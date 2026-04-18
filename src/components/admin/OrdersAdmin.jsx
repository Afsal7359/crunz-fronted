'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const statusColors = {
  pending: 'badge-yellow', confirmed: 'badge-blue', processing: 'badge-purple',
  shipped: 'badge-blue', delivered: 'badge-green', cancelled: 'badge-red'
};

export default function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const qs = filterStatus ? `?status=${filterStatus}&page=${page}` : `?page=${page}`;
    api.get(`/admin/orders${qs}`)
      .then(d => { setOrders(d.orders); setTotal(d.total); setPages(d.pages); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterStatus, page]);

  const updateStatus = async (id, status) => {
    await api.put(`/admin/orders/${id}`, { status });
    load();
  };

  const deleteOrder = async (id) => {
    if (!confirm('Delete this order permanently?')) return;
    await api.delete(`/admin/orders/${id}`);
    setSelected(null);
    load();
  };

  if (selected) {
    const o = selected;
    const sym = o.currency === 'INR' ? '₹' : '£';
    const total = o.currency === 'INR' ? o.totalINR : o.totalGBP;
    return (
      <div>
        <div className="admin-topbar">
          <div>
            <div style={{ fontSize: '.72rem', opacity: .4, marginBottom: 4 }}>Order Detail</div>
            <div className="admin-page-title">#{o._id.slice(-6).toUpperCase()}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="act-btn danger" onClick={() => deleteOrder(o._id)}>Delete Order</button>
            <button className="act-btn" onClick={() => setSelected(null)}>← Back</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Order Info */}
          <div className="admin-form-wrap">
            <div style={{ fontSize: '.65rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', opacity: .35, marginBottom: 16 }}>Order Info</div>
            <table style={{ width: '100%', fontSize: '.85rem', borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  ['ID', `#${o._id.slice(-6).toUpperCase()}`],
                  ['Date', new Date(o.createdAt).toLocaleString('en-GB')],
                  ['Currency', o.currency],
                  ['Total', `${sym}${Number(total).toFixed(2)}`],
                  ['Payment', o.paymentStatus],
                  ['Stripe ID', o.stripePaymentIntentId || 'N/A'],
                ].map(([k, v]) => (
                  <tr key={k}><td style={{ padding: '7px 0', opacity: .45, width: 120 }}>{k}</td><td style={{ fontWeight: 600 }}>{v}</td></tr>
                ))}
                <tr>
                  <td style={{ padding: '7px 0', opacity: .45 }}>Status</td>
                  <td>
                    <select className="status-sel" value={o.status} onChange={e => { updateStatus(o._id, e.target.value); setSelected({ ...o, status: e.target.value }); }}>
                      {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Delivery */}
          <div className="admin-form-wrap">
            <div style={{ fontSize: '.65rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', opacity: .35, marginBottom: 16 }}>Delivery Address</div>
            <div style={{ fontSize: '.87rem', lineHeight: 1.8 }}>
              <strong>{o.shippingAddress?.name}</strong><br />
              {o.shippingAddress?.phone && <>{o.shippingAddress.phone}<br /></>}
              {o.shippingAddress?.street}<br />
              {o.shippingAddress?.city && <>{o.shippingAddress.city}, </>}
              {o.shippingAddress?.postcode}<br />
              {o.shippingAddress?.country}
            </div>
            {o.notes && (
              <div style={{ marginTop: 16, padding: '10px 12px', background: '#fafafa', borderRadius: 6, fontSize: '.82rem', opacity: .65 }}>
                <strong>Notes:</strong> {o.notes}
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="admin-table-wrap" style={{ marginTop: 20 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', fontWeight: 700 }}>Items</div>
          <table className="admin-table">
            <thead><tr><th>Image</th><th>Product</th><th>Qty</th><th>Unit Price</th><th>Line Total</th></tr></thead>
            <tbody>
              {o.items?.map((item, i) => {
                const unitPrice = o.currency === 'INR' ? item.priceINR : item.priceGBP;
                return (
                  <tr key={i}>
                    <td><img src={item.image || '/images/spanish-tomato.jpg'} alt={item.name} style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 5, background: '#fafafa', padding: 2 }} /></td>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td>× {item.qty}</td>
                    <td>{sym}{Number(unitPrice).toFixed(2)}</td>
                    <td style={{ fontWeight: 700 }}>{sym}{(unitPrice * item.qty).toFixed(2)}</td>
                  </tr>
                );
              })}
              <tr>
                <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700, paddingTop: 12 }}>Total</td>
                <td style={{ fontWeight: 900, fontSize: '1.1rem' }}>{sym}{Number(total).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-topbar">
        <div className="admin-page-title">Orders ({total})</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select className="status-sel" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div className="admin-table-wrap">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', opacity: .4 }}>Loading orders…</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Currency</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const sym = o.currency === 'INR' ? '₹' : '£';
                const total = o.currency === 'INR' ? o.totalINR : o.totalGBP;
                return (
                  <tr key={o._id}>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '.82rem' }}>#{o._id.slice(-6).toUpperCase()}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '.85rem' }}>{o.user?.name || o.shippingAddress?.name || '—'}</div>
                      <div style={{ fontSize: '.7rem', opacity: .4 }}>{o.user?.email || ''}</div>
                    </td>
                    <td>{o.items?.length}</td>
                    <td style={{ fontWeight: 800 }}>{sym}{Number(total).toFixed(2)}</td>
                    <td><span className={`badge ${o.currency === 'INR' ? 'badge-purple' : 'badge-blue'}`}>{o.currency}</span></td>
                    <td><span className={`badge ${o.paymentStatus === 'paid' ? 'badge-green' : 'badge-yellow'}`}>{o.paymentStatus}</span></td>
                    <td>
                      <select className="status-sel" value={o.status} onChange={e => updateStatus(o._id, e.target.value)}>
                        {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </td>
                    <td style={{ opacity: .5, fontSize: '.75rem' }}>{new Date(o.createdAt).toLocaleDateString('en-GB')}</td>
                    <td>
                      <button className="act-btn" onClick={() => setSelected(o)}>View</button>
                    </td>
                  </tr>
                );
              })}
              {!orders.length && <tr><td colSpan={9} style={{ textAlign: 'center', opacity: .4, padding: 40 }}>No orders found</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} className={`act-btn ${page === i + 1 ? 'primary' : ''}`} onClick={() => setPage(i + 1)}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
