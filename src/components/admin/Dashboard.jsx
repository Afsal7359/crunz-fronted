'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const statusColors = {
  pending: 'badge-yellow', confirmed: 'badge-blue', processing: 'badge-purple',
  shipped: 'badge-blue', delivered: 'badge-green', cancelled: 'badge-red'
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', opacity: .4 }}>Loading…</div>;
  if (!stats) return null;

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card dark">
          <div className="stat-lbl">Total Revenue (GBP)</div>
          <div className="stat-val">£{stats.revenueGBP?.toFixed(2) || '0.00'}</div>
          <div className="stat-sub">From paid orders</div>
        </div>
        <div className="stat-card dark">
          <div className="stat-lbl">Total Revenue (INR)</div>
          <div className="stat-val">₹{Math.round(stats.revenueINR || 0).toLocaleString('en-IN')}</div>
          <div className="stat-sub">From paid orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">Total Orders</div>
          <div className="stat-val">{stats.totalOrders}</div>
          <div className="stat-sub">All time</div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">Customers</div>
          <div className="stat-val">{stats.totalUsers}</div>
          <div className="stat-sub">Registered accounts</div>
        </div>
      </div>

      {/* Order Status Breakdown */}
      {stats.statusCounts && (
        <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 10, padding: 20, marginBottom: 24 }}>
          <div style={{ fontSize: '.65rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', opacity: .35, marginBottom: 16 }}>Order Status Breakdown</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {Object.entries(stats.statusCounts).map(([status, count]) => (
              <div key={status} style={{ textAlign: 'center', padding: '10px 20px', background: '#fafafa', borderRadius: 8, minWidth: 80 }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: -1 }}>{count}</div>
                <div className={`badge ${statusColors[status] || 'badge-gray'}`} style={{ marginTop: 4 }}>{status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="admin-table-wrap">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: 700, fontSize: '.9rem' }}>Recent Orders</div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {(stats.recentOrders || []).map(order => (
              <tr key={order._id}>
                <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>#{order._id.slice(-6).toUpperCase()}</td>
                <td>
                  <div style={{ fontWeight: 600 }}>{order.user?.name || order.shippingAddress?.name || 'Guest'}</div>
                  <div style={{ fontSize: '.72rem', opacity: .4 }}>{order.user?.email || ''}</div>
                </td>
                <td style={{ opacity: .6 }}>{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</td>
                <td style={{ fontWeight: 700 }}>
                  {order.currency === 'INR' ? `₹${Math.round(order.totalINR)}` : `£${order.totalGBP?.toFixed(2)}`}
                </td>
                <td><span className={`badge ${statusColors[order.status] || 'badge-gray'}`}>{order.status}</span></td>
                <td style={{ opacity: .5, fontSize: '.78rem' }}>{new Date(order.createdAt).toLocaleDateString('en-GB')}</td>
              </tr>
            ))}
            {!stats.recentOrders?.length && (
              <tr><td colSpan={6} style={{ textAlign: 'center', opacity: .4, padding: 32 }}>No orders yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
