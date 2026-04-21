'use client';
import { useState, useEffect, useCallback } from 'react';
import { api, fixImageUrl } from '@/lib/api';

const STATUSES = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_STYLE = {
  confirmed:  { bg: '#dbeafe', color: '#1e40af' },
  processing: { bg: '#ede9fe', color: '#5b21b6' },
  shipped:    { bg: '#e0f2fe', color: '#0369a1' },
  delivered:  { bg: '#d1fae5', color: '#065f46' },
  cancelled:  { bg: '#fee2e2', color: '#991b1b' },
  pending:    { bg: '#fef3c7', color: '#92400e' },
};

const FILTERS = [
  { key: '',           label: 'All' },
  { key: 'confirmed',  label: 'Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped',    label: 'Shipped' },
  { key: 'delivered',  label: 'Delivered' },
  { key: 'cancelled',  label: 'Cancelled' },
];

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return (
    <span style={{
      background: s.bg, color: s.color,
      borderRadius: 20, padding: '3px 11px',
      fontSize: '.72rem', fontWeight: 700, textTransform: 'capitalize', whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}

export default function OrdersAdmin() {
  const [orders, setOrders]           = useState([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [pages, setPages]             = useState(1);
  const [counts, setCounts]           = useState({});
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [updating, setUpdating]       = useState(null);

  const load = useCallback(async (status, pg) => {
    setLoading(true);
    try {
      const qs = `?page=${pg}&limit=15${status ? `&status=${status}` : ''}`;
      const d = await api.get(`/admin/orders${qs}`);
      setOrders(d.orders);
      setTotal(d.total);
      setPages(d.pages);
      setCounts(d.counts || {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(filterStatus, page); }, [filterStatus, page, load]);

  const handleFilter = (key) => { setFilterStatus(key); setPage(1); };

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      const updated = await api.put(`/admin/orders/${id}`, { status });
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
      if (selected?._id === id) setSelected(s => ({ ...s, status }));
    } catch (e) { console.error(e); }
    finally { setUpdating(null); }
  };

  const deleteOrder = async (id) => {
    if (!confirm('Delete this order permanently?')) return;
    await api.delete(`/admin/orders/${id}`);
    setSelected(null);
    load(filterStatus, page);
  };

  // ── Order detail view ────────────────────────────────────────────
  if (selected) {
    const o = selected;
    const sym = o.currency === 'INR' ? '₹' : '£';
    const tot = o.currency === 'INR' ? o.totalINR : o.totalGBP;
    return (
      <div>
        <div className="admin-topbar">
          <div>
            <div style={{ fontSize: '.72rem', opacity: .4, marginBottom: 4 }}>Order Detail</div>
            <div className="admin-page-title">#{o._id.slice(-6).toUpperCase()}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="act-btn danger" onClick={() => deleteOrder(o._id)}>Delete</button>
            <button className="act-btn" onClick={() => setSelected(null)}>← Back</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Order info */}
          <div className="admin-form-wrap">
            <div style={{ fontSize: '.65rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', opacity: .35, marginBottom: 16 }}>Order Info</div>
            <table style={{ width: '100%', fontSize: '.85rem', borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  ['ID',       `#${o._id.slice(-6).toUpperCase()}`],
                  ['Date',     new Date(o.createdAt).toLocaleString('en-GB')],
                  ['Currency', o.currency],
                  ['Delivery', o.deliveryCharge > 0 ? `${sym}${Number(o.deliveryCharge).toFixed(2)}` : 'Free'],
                  ['Total',    `${sym}${Number(tot).toFixed(2)}`],
                  ['Payment',  o.paymentStatus],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ padding: '7px 0', opacity: .45, width: 110 }}>{k}</td>
                    <td style={{ fontWeight: 600 }}>{v}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ padding: '7px 0', opacity: .45, verticalAlign: 'middle' }}>Status</td>
                  <td style={{ paddingTop: 6 }}>
                    {/* Quick status buttons */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {STATUSES.map(s => {
                        const active = o.status === s;
                        const st = STATUS_STYLE[s];
                        return (
                          <button key={s} onClick={() => updateStatus(o._id, s)}
                            disabled={updating === o._id}
                            style={{
                              padding: '4px 12px', borderRadius: 20, border: active ? 'none' : '1px solid #e0e0e0',
                              background: active ? st.bg : '#fff',
                              color: active ? st.color : '#888',
                              fontWeight: active ? 700 : 500,
                              fontSize: '.72rem', cursor: 'pointer', textTransform: 'capitalize',
                            }}>
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Delivery address */}
          <div className="admin-form-wrap">
            <div style={{ fontSize: '.65rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', opacity: .35, marginBottom: 16 }}>Delivery Address</div>
            <div style={{ fontSize: '.87rem', lineHeight: 2 }}>
              <strong>{o.shippingAddress?.name}</strong><br />
              {o.shippingAddress?.email && <>{o.shippingAddress.email}<br /></>}
              {o.shippingAddress?.phone && <>{o.shippingAddress.phone}<br /></>}
              {o.shippingAddress?.street}<br />
              {o.shippingAddress?.city && <>{o.shippingAddress.city}, </>}
              {o.shippingAddress?.postcode}<br />
              {o.shippingAddress?.country}
            </div>
            {o.notes && (
              <div style={{ marginTop: 14, padding: '10px 12px', background: '#fafafa', borderRadius: 6, fontSize: '.82rem', opacity: .65 }}>
                <strong>Notes:</strong> {o.notes}
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="admin-table-wrap">
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', fontWeight: 700 }}>Items</div>
          <table className="admin-table">
            <thead>
              <tr><th>Image</th><th>Product</th><th>Qty</th><th>Unit Price</th><th>Line Total</th></tr>
            </thead>
            <tbody>
              {o.items?.map((item, i) => {
                const unitPrice = o.currency === 'INR' ? item.priceINR : item.priceGBP;
                return (
                  <tr key={i}>
                    <td><img src={fixImageUrl(item.image) || '/images/spanish-tomato.jpg'} alt={item.name}
                      style={{ width: 42, height: 42, objectFit: 'contain', borderRadius: 6, background: '#fafafa', padding: 3 }} /></td>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td>× {item.qty}</td>
                    <td>{sym}{Number(unitPrice).toFixed(2)}</td>
                    <td style={{ fontWeight: 700 }}>{sym}{(unitPrice * item.qty).toFixed(2)}</td>
                  </tr>
                );
              })}
              <tr>
                <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700, paddingTop: 12 }}>Total</td>
                <td style={{ fontWeight: 900, fontSize: '1.05rem' }}>{sym}{Number(tot).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── Orders list ──────────────────────────────────────────────────
  return (
    <div>
      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map(f => {
          const active = filterStatus === f.key;
          const count = f.key === '' ? counts.all : counts[f.key];
          return (
            <button key={f.key} onClick={() => handleFilter(f.key)}
              style={{
                padding: '7px 18px', borderRadius: 20,
                border: active ? 'none' : '1px solid #e8e8e8',
                background: active ? '#0a0a0a' : '#fff',
                color: active ? '#fff' : '#0a0a0a',
                fontWeight: 700, fontSize: '.78rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
              {f.label}
              {count !== undefined && (
                <span style={{
                  background: active ? 'rgba(255,255,255,.2)' : '#f0f0f0',
                  color: active ? '#fff' : '#555',
                  borderRadius: 10, padding: '1px 7px', fontSize: '.7rem', fontWeight: 700,
                }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="admin-table-wrap">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', opacity: .4 }}>Loading…</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Update Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const sym = o.currency === 'INR' ? '₹' : '£';
                const tot = o.currency === 'INR' ? o.totalINR : o.totalGBP;
                return (
                  <tr key={o._id}>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '.82rem' }}>
                      #{o._id.slice(-6).toUpperCase()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '.85rem' }}>{o.user?.name || o.shippingAddress?.name || '—'}</div>
                      <div style={{ fontSize: '.7rem', opacity: .4 }}>{o.user?.email || o.shippingAddress?.email || ''}</div>
                    </td>
                    <td style={{ opacity: .6 }}>{o.items?.length} item{o.items?.length !== 1 ? 's' : ''}</td>
                    <td style={{ fontWeight: 800 }}>{sym}{Number(tot).toFixed(2)}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td>
                      <select
                        value={o.status}
                        disabled={updating === o._id}
                        onChange={e => updateStatus(o._id, e.target.value)}
                        style={{
                          padding: '5px 8px', borderRadius: 6, border: '1px solid #e0e0e0',
                          fontSize: '.78rem', fontWeight: 600, cursor: 'pointer',
                          background: '#fafafa', outline: 'none',
                          opacity: updating === o._id ? .5 : 1,
                        }}>
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ opacity: .5, fontSize: '.75rem' }}>
                      {new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <button className="act-btn" onClick={() => setSelected(o)}>View</button>
                    </td>
                  </tr>
                );
              })}
              {!orders.length && (
                <tr><td colSpan={8} style={{ textAlign: 'center', opacity: .4, padding: 40 }}>No orders found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid #e8e8e8', background: '#fff', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? .4 : 1, fontWeight: 600, fontSize: '.8rem' }}>
            ← Prev
          </button>
          <span style={{ fontSize: '.82rem', opacity: .5 }}>Page {page} of {pages} &nbsp;·&nbsp; {total} orders</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid #e8e8e8', background: '#fff', cursor: page === pages ? 'default' : 'pointer', opacity: page === pages ? .4 : 1, fontWeight: 600, fontSize: '.8rem' }}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
