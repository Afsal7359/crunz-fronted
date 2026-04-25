'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

const EMPTY_FORM = {
  code: '', description: '', discountType: 'percentage', discountValue: '',
  currency: 'both', maxUses: '', minOrderGBP: '', minOrderINR: '',
  active: true, expiresAt: '',
};

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: accent ? '#0a0a0a' : '#fff',
      color: accent ? '#fff' : '#0a0a0a',
      border: accent ? 'none' : '1px solid #f0f0f0',
      borderRadius: 12, padding: '18px 20px',
    }}>
      <div style={{ fontSize: '.6rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', opacity: .4, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: '1.7rem', fontWeight: 900, letterSpacing: '-1px' }}>{value}</div>
      {sub && <div style={{ fontSize: '.72rem', opacity: .4, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Label({ children }) {
  return (
    <label style={{ display: 'block', fontSize: '.64rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', opacity: .35, marginBottom: 6 }}>
      {children}
    </label>
  );
}

function Input({ value, onChange, type = 'text', placeholder, style }) {
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{ width: '100%', background: '#fafafa', border: '1px solid #e8e8e8', borderRadius: 7, padding: '9px 12px', fontFamily: 'Inter,sans-serif', fontSize: '.84rem', outline: 'none', ...style }}
    />
  );
}

export default function CouponsAdmin() {
  const [coupons, setCoupons]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [editing, setEditing]   = useState(null);
  const [saving, setSaving]     = useState(false);
  const [formErr, setFormErr]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setCoupons(await api.get('/coupons')); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setF = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const setFB = k => e => setForm(f => ({ ...f, [k]: e.target.checked }));

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormErr(''); setShowForm(true); };
  const openEdit   = (c) => {
    setEditing(c._id);
    setForm({
      code: c.code, description: c.description || '',
      discountType: c.discountType, discountValue: c.discountValue,
      currency: c.currency, maxUses: c.maxUses || '',
      minOrderGBP: c.minOrderGBP || '', minOrderINR: c.minOrderINR || '',
      active: c.active,
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
    });
    setFormErr('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.code.trim())      return setFormErr('Coupon code is required');
    if (!form.discountValue)    return setFormErr('Discount value is required');
    if (Number(form.discountValue) <= 0) return setFormErr('Discount value must be greater than 0');
    if (form.discountType === 'percentage' && Number(form.discountValue) > 100)
      return setFormErr('Percentage cannot exceed 100');

    setSaving(true); setFormErr('');
    try {
      const body = {
        ...form,
        discountValue: Number(form.discountValue),
        maxUses:       Number(form.maxUses) || 0,
        minOrderGBP:   Number(form.minOrderGBP) || 0,
        minOrderINR:   Number(form.minOrderINR) || 0,
        expiresAt:     form.expiresAt || null,
      };
      if (editing) {
        await api.put(`/coupons/${editing}`, body);
      } else {
        await api.post('/coupons', body);
      }
      await load();
      setShowForm(false);
    } catch (e) { setFormErr(e.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (c) => {
    await api.put(`/coupons/${c._id}`, { active: !c.active });
    setCoupons(prev => prev.map(x => x._id === c._id ? { ...x, active: !x.active } : x));
  };

  const deleteCoupon = async (id) => {
    if (!confirm('Delete this coupon permanently?')) return;
    await api.delete(`/coupons/${id}`);
    setCoupons(prev => prev.filter(c => c._id !== id));
  };

  // Summary stats
  const totalActive   = coupons.filter(c => c.active).length;
  const totalUsed     = coupons.reduce((s, c) => s + (c.usedCount || 0), 0);
  const totalOrders   = coupons.reduce((s, c) => s + (c.orderCount || 0), 0);
  const totalSavedGBP = coupons.reduce((s, c) => s + (c.totalDiscount || 0), 0);

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard accent label="Active Coupons" value={totalActive} sub={`of ${coupons.length} total`} />
        <StatCard label="Total Uses" value={totalUsed} sub="Times redeemed" />
        <StatCard label="Orders w/ Coupon" value={totalOrders} sub="Paid orders" />
        <StatCard label="Total Discounted" value={`£${totalSavedGBP.toFixed(2)}`} sub="GBP value given" />
      </div>

      {/* Header + Create button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: '.65rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', opacity: .35 }}>
          {coupons.length} coupon{coupons.length !== 1 ? 's' : ''}
        </div>
        <button onClick={openCreate}
          style={{ background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer' }}>
          + Create Coupon
        </button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: '1rem' }}>{editing ? 'Edit Coupon' : 'Create Coupon'}</div>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', opacity: .4 }}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <Label>Coupon Code *</Label>
              <Input value={form.code} onChange={setF('code')} placeholder="e.g. SAVE10" style={{ textTransform: 'uppercase', letterSpacing: 1 }} />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={form.description} onChange={setF('description')} placeholder="e.g. 10% off all orders" />
            </div>
            <div>
              <Label>Discount Type *</Label>
              <select value={form.discountType} onChange={setF('discountType')}
                style={{ width: '100%', background: '#fafafa', border: '1px solid #e8e8e8', borderRadius: 7, padding: '9px 12px', fontFamily: 'Inter,sans-serif', fontSize: '.84rem', outline: 'none' }}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (£/₹)</option>
              </select>
            </div>
            <div>
              <Label>Discount Value * {form.discountType === 'percentage' ? '(%)' : '(amount in selected currency)'}</Label>
              <Input type="number" value={form.discountValue} onChange={setF('discountValue')} placeholder={form.discountType === 'percentage' ? '10' : '5.00'} />
            </div>
            <div>
              <Label>Valid For Currency</Label>
              <select value={form.currency} onChange={setF('currency')}
                style={{ width: '100%', background: '#fafafa', border: '1px solid #e8e8e8', borderRadius: 7, padding: '9px 12px', fontFamily: 'Inter,sans-serif', fontSize: '.84rem', outline: 'none' }}>
                <option value="both">Both GBP &amp; INR</option>
                <option value="GBP">GBP only</option>
                <option value="INR">INR only</option>
              </select>
            </div>
            <div>
              <Label>Max Uses (0 = unlimited)</Label>
              <Input type="number" value={form.maxUses} onChange={setF('maxUses')} placeholder="0" />
            </div>
            <div>
              <Label>Min Order (GBP)</Label>
              <Input type="number" value={form.minOrderGBP} onChange={setF('minOrderGBP')} placeholder="0" />
            </div>
            <div>
              <Label>Min Order (INR)</Label>
              <Input type="number" value={form.minOrderINR} onChange={setF('minOrderINR')} placeholder="0" />
            </div>
            <div>
              <Label>Expires On (optional)</Label>
              <Input type="date" value={form.expiresAt} onChange={setF('expiresAt')} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 20 }}>
              <input type="checkbox" id="active-chk" checked={form.active} onChange={setFB('active')} style={{ width: 16, height: 16, cursor: 'pointer' }} />
              <label htmlFor="active-chk" style={{ fontSize: '.84rem', fontWeight: 600, cursor: 'pointer' }}>Active (usable immediately)</label>
            </div>
          </div>

          {formErr && (
            <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 7, padding: '10px 14px', marginTop: 16, fontSize: '.82rem', fontWeight: 600 }}>{formErr}</div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button onClick={handleSave} disabled={saving}
              style={{ background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 24px', fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: '.86rem', cursor: saving ? 'wait' : 'pointer', opacity: saving ? .6 : 1 }}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Coupon'}
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ background: 'none', border: '1px solid #e8e8e8', borderRadius: 8, padding: '11px 20px', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '.86rem', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Coupons table */}
      <div className="admin-table-wrap">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', opacity: .4 }}>Loading…</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Uses</th>
                <th>Available</th>
                <th>Orders</th>
                <th>Revenue Saved</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => {
                const isExpired = c.expiresAt && new Date() > new Date(c.expiresAt);
                const remaining = c.maxUses === 0 ? '∞' : Math.max(0, c.maxUses - c.usedCount);
                const discLabel = c.discountType === 'percentage'
                  ? `${c.discountValue}%`
                  : `£${c.discountValue} / ₹${c.discountValue}`;
                const usePct = c.maxUses > 0 ? Math.round((c.usedCount / c.maxUses) * 100) : 0;

                return (
                  <tr key={c._id}>
                    <td>
                      <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '.9rem', letterSpacing: 1 }}>{c.code}</div>
                      {c.description && <div style={{ fontSize: '.7rem', opacity: .4, marginTop: 2 }}>{c.description}</div>}
                    </td>
                    <td>
                      <span style={{
                        background: c.discountType === 'percentage' ? '#ede9fe' : '#dbeafe',
                        color: c.discountType === 'percentage' ? '#5b21b6' : '#1e40af',
                        borderRadius: 20, padding: '3px 10px', fontSize: '.72rem', fontWeight: 800,
                      }}>{discLabel}</span>
                      <div style={{ fontSize: '.68rem', opacity: .4, marginTop: 3 }}>{c.currency === 'both' ? 'GBP + INR' : c.currency}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800 }}>{c.usedCount}</div>
                      {c.maxUses > 0 && (
                        <div style={{ marginTop: 4 }}>
                          <div style={{ background: '#f0f0f0', borderRadius: 4, height: 4, width: 60 }}>
                            <div style={{ height: '100%', width: `${Math.min(100, usePct)}%`, background: usePct >= 90 ? '#ef4444' : '#0a0a0a', borderRadius: 4 }} />
                          </div>
                          <div style={{ fontSize: '.65rem', opacity: .35, marginTop: 2 }}>{usePct}% used</div>
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 700, color: remaining === 0 ? '#ef4444' : 'inherit' }}>
                      {remaining}
                    </td>
                    <td style={{ fontWeight: 700 }}>{c.orderCount || 0}</td>
                    <td>
                      {c.revenueGBP > 0 && <div style={{ fontSize: '.82rem', fontWeight: 700 }}>£{c.revenueGBP.toFixed(2)}</div>}
                      {c.revenueINR > 0 && <div style={{ fontSize: '.78rem', opacity: .6 }}>₹{Math.round(c.revenueINR).toLocaleString('en-IN')}</div>}
                      {!c.revenueGBP && !c.revenueINR && <span style={{ opacity: .3 }}>—</span>}
                    </td>
                    <td style={{ fontSize: '.76rem', opacity: .5 }}>
                      {isExpired
                        ? <span style={{ color: '#ef4444', fontWeight: 700 }}>Expired</span>
                        : c.expiresAt
                        ? new Date(c.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : <span style={{ opacity: .35 }}>Never</span>}
                    </td>
                    <td>
                      <button onClick={() => toggleActive(c)}
                        style={{
                          padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                          background: c.active && !isExpired ? '#d1fae5' : '#fee2e2',
                          color: c.active && !isExpired ? '#065f46' : '#991b1b',
                          fontWeight: 700, fontSize: '.72rem',
                        }}>
                        {c.active && !isExpired ? '● Active' : '○ Inactive'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="act-btn" onClick={() => openEdit(c)}>Edit</button>
                        <button className="act-btn danger" onClick={() => deleteCoupon(c._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!coupons.length && !loading && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', opacity: .4, padding: 48 }}>
                    No coupons yet. Create your first one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
