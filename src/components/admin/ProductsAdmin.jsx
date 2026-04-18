'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const empty = { name: '', flavor: '', description: '', badge: '', priceGBP: '', priceINR: '', image: '', spice: 'None', tags: [], inStock: true, order: 0 };

export default function ProductsAdmin() {
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null); // null | 'new' | product object
  const [form, setForm] = useState(empty);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const load = () => api.get('/products/admin/all').then(setProducts).catch(console.error);
  useEffect(() => { load(); }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const openNew = () => { setForm(empty); setEditing('new'); setErr(''); };
  const openEdit = p => { setForm({ ...p, tags: p.tags || [] }); setEditing(p); setErr(''); };
  const cancel = () => { setEditing(null); setErr(''); };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(f => ({ ...f, tags: [...f.tags, tagInput.trim()] }));
    }
    setTagInput('');
  };
  const removeTag = t => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }));

  const handleUpload = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const d = await api.upload('/upload', fd);
      setForm(f => ({ ...f, image: d.url }));
    } catch (e) { setErr(e.message); }
    setUploading(false);
  };

  const handleSave = async () => {
    setErr(''); setSaving(true);
    try {
      const payload = { ...form, priceGBP: Number(form.priceGBP), priceINR: Number(form.priceINR), order: Number(form.order) };
      if (editing === 'new') await api.post('/products', payload);
      else await api.put(`/products/${editing._id}`, payload);
      await load();
      cancel();
    } catch (e) { setErr(e.message); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`);
    await load();
  };

  if (editing !== null) {
    return (
      <div>
        <div className="admin-topbar" style={{ marginBottom: 20 }}>
          <div className="admin-page-title">{editing === 'new' ? 'New Product' : 'Edit Product'}</div>
          <button className="act-btn" onClick={cancel}>← Back to Products</button>
        </div>
        <div className="admin-form-wrap">
          <div className="admin-form-grid">
            {/* Left column */}
            <div>
              <div className="fg">
                <label className="fl">Product Image</label>
                {form.image && <img src={form.image} alt="" className="admin-img-preview" style={{ marginBottom: 10, maxHeight: 200 }} />}
                <input type="file" accept="image/*" onChange={handleUpload} className="fi" style={{ padding: '8px 10px' }} />
                {uploading && <div className="form-hint">Uploading…</div>}
                <input className="fi" style={{ marginTop: 8 }} placeholder="Or paste image URL" value={form.image} onChange={set('image')} />
              </div>
              <div className="fg">
                <label className="fl">Badge (e.g. BEST SELLER)</label>
                <input className="fi" value={form.badge} onChange={set('badge')} placeholder="BEST SELLER" />
              </div>
              <div className="fg">
                <label className="fl">Spice Level</label>
                <input className="fi" value={form.spice} onChange={set('spice')} placeholder="None / Mild / Hot 🔥🔥" />
              </div>
              <div className="fg">
                <label className="fl">Display Order</label>
                <input className="fi" type="number" value={form.order} onChange={set('order')} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.85rem', cursor: 'pointer', marginTop: 8 }}>
                <input type="checkbox" checked={form.inStock} onChange={e => setForm(f => ({ ...f, inStock: e.target.checked }))} />
                In Stock
              </label>
            </div>

            {/* Right column */}
            <div>
              <div className="fg">
                <label className="fl">Product Name *</label>
                <input className="fi" value={form.name} onChange={set('name')} placeholder="e.g. Spanish Tomato" />
              </div>
              <div className="fg">
                <label className="fl">Flavor Description</label>
                <input className="fi" value={form.flavor} onChange={set('flavor')} placeholder="e.g. Tangy · Bold" />
              </div>
              <div className="fg">
                <label className="fl">Description</label>
                <textarea className="fi" style={{ minHeight: 80, resize: 'vertical' }} value={form.description} onChange={set('description')} placeholder="Product description…" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="fg">
                  <label className="fl">Price GBP (£) *</label>
                  <input className="fi" type="number" step="0.01" value={form.priceGBP} onChange={set('priceGBP')} placeholder="3.99" />
                </div>
                <div className="fg">
                  <label className="fl">Price INR (₹) *</label>
                  <input className="fi" type="number" value={form.priceINR} onChange={set('priceINR')} placeholder="424" />
                </div>
              </div>
              <div className="fg">
                <label className="fl">Tags</label>
                <div className="admin-tag-input" onClick={() => document.getElementById('tag-inp')?.focus()}>
                  {form.tags.map(t => (
                    <span key={t} className="admin-tag">
                      {t} <button onClick={() => removeTag(t)}>×</button>
                    </span>
                  ))}
                  <input
                    id="tag-inp" value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder={form.tags.length ? '' : 'Type tag + Enter'}
                    style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '.82rem', flex: 1, minWidth: 80 }}
                  />
                </div>
                <div className="form-hint">Press Enter to add a tag</div>
              </div>
            </div>
          </div>

          {err && <div className="form-err" style={{ marginTop: 16 }}>{err}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button className="act-btn primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editing === 'new' ? 'Create Product' : 'Save Changes'}
            </button>
            <button className="act-btn" onClick={cancel}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-topbar">
        <div className="admin-page-title">Products ({products.length})</div>
        <button className="act-btn primary" onClick={openNew}>+ Add Product</button>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>Image</th>
              <th>Name</th>
              <th>Flavor</th>
              <th>Price GBP</th>
              <th>Price INR</th>
              <th>Badge</th>
              <th>Stock</th>
              <th>Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p._id}>
                <td>
                  <img src={p.image || '/images/spanish-tomato.jpg'} alt={p.name} style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 6, background: '#fafafa', padding: 2 }} />
                </td>
                <td style={{ fontWeight: 700 }}>{p.name}</td>
                <td style={{ opacity: .6, fontSize: '.8rem' }}>{p.flavor}</td>
                <td style={{ fontWeight: 700 }}>£{p.priceGBP?.toFixed(2)}</td>
                <td style={{ fontWeight: 700 }}>₹{p.priceINR}</td>
                <td>{p.badge && <span className="badge badge-gray">{p.badge}</span>}</td>
                <td><span className={`badge ${p.inStock ? 'badge-green' : 'badge-red'}`}>{p.inStock ? 'In Stock' : 'Out'}</span></td>
                <td style={{ opacity: .5 }}>{p.order}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="act-btn" onClick={() => openEdit(p)}>Edit</button>
                    <button className="act-btn danger" onClick={() => handleDelete(p._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {!products.length && (
              <tr><td colSpan={9} style={{ textAlign: 'center', opacity: .4, padding: 40 }}>No products. Click "+ Add Product" to create one.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
