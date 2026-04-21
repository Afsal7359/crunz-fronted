'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/currency';

const STATUS_COLOR = {
  pending:   { bg: '#fef3c7', color: '#92400e' },
  confirmed: { bg: '#d1fae5', color: '#065f46' },
  shipped:   { bg: '#dbeafe', color: '#1e40af' },
  delivered: { bg: '#f0fdf4', color: '#15803d' },
  cancelled: { bg: '#fee2e2', color: '#991b1b' },
};

export default function ProfileModal({ open, onClose }) {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    api.get('/orders/my')
      .then(data => setOrders(data.filter(o => o.paymentStatus === 'paid')))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [open, user]);

  const handleLogout = () => { logout(); onClose(); };

  if (!open || !user) return null;

  const initials = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="pm2-ov open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pm2-box">

        {/* Header */}
        <div className="pm2-hd">
          <div className="pm2-avatar">{initials}</div>
          <div className="pm2-info">
            <div className="pm2-name">{user.name}</div>
            <div className="pm2-email">{user.email}</div>
          </div>
          <button className="pm2-x" onClick={onClose}>✕</button>
        </div>

        {/* Stats row */}
        <div className="pm2-stats">
          <div className="pm2-stat">
            <div className="pm2-stat-val">{orders.filter(o => o.paymentStatus === 'paid').length}</div>
            <div className="pm2-stat-lbl">Orders</div>
          </div>
          <div className="pm2-stat">
            <div className="pm2-stat-val">
              {orders.filter(o => o.status === 'delivered').length}
            </div>
            <div className="pm2-stat-lbl">Delivered</div>
          </div>
          <div className="pm2-stat">
            <div className="pm2-stat-val">
              {orders.filter(o => o.paymentStatus === 'paid').length}
            </div>
            <div className="pm2-stat-lbl">Paid</div>
          </div>
        </div>

        {/* Orders */}
        <div className="pm2-section-title">Order History</div>
        <div className="pm2-orders">
          {loading ? (
            <div className="pm2-empty">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="pm2-empty">No orders yet. Start shopping!</div>
          ) : (
            orders.map(order => {
              const id = order._id.toString().slice(-6).toUpperCase();
              const cur = order.currency || 'GBP';
              const total = cur === 'INR' ? order.totalINR : order.totalGBP;
              const st = STATUS_COLOR[order.status] || STATUS_COLOR.pending;
              const isOpen = expanded === order._id;
              const date = new Date(order.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric'
              });

              return (
                <div key={order._id} className="pm2-order">
                  <button className="pm2-order-row" onClick={() => setExpanded(isOpen ? null : order._id)}>
                    <div className="pm2-order-left">
                      <div className="pm2-order-id">#{id}</div>
                      <div className="pm2-order-date">{date}</div>
                    </div>
                    <div className="pm2-order-right">
                      <span className="pm2-order-status" style={{ background: st.bg, color: st.color }}>
                        {order.status}
                      </span>
                      <span className="pm2-order-total">{formatPrice(total, cur)}</span>
                      <span className="pm2-order-arrow">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="pm2-order-detail">
                      {/* Items */}
                      <div className="pm2-detail-section">
                        {order.items.map((item, i) => {
                          const price = cur === 'INR' ? item.priceINR : item.priceGBP;
                          return (
                            <div key={i} className="pm2-item-row">
                              <span>{item.name} <span style={{ opacity: .45 }}>× {item.qty}</span></span>
                              <span>{formatPrice(price * item.qty, cur)}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Totals */}
                      <div className="pm2-detail-totals">
                        {order.deliveryCharge > 0 && (
                          <div className="pm2-total-row">
                            <span>Delivery</span>
                            <span>{formatPrice(order.deliveryCharge, cur)}</span>
                          </div>
                        )}
                        <div className="pm2-total-row pm2-grand-total">
                          <span>Total</span>
                          <span>{formatPrice(total, cur)}</span>
                        </div>
                      </div>

                      {/* Payment + Address */}
                      <div className="pm2-meta-grid">
                        <div>
                          <div className="pm2-meta-label">Payment</div>
                          <div className="pm2-meta-val" style={{
                            color: order.paymentStatus === 'paid' ? '#16a34a' : '#92400e',
                            fontWeight: 700, textTransform: 'capitalize'
                          }}>
                            {order.paymentStatus === 'paid' ? '✓ Paid' : '⏳ ' + order.paymentStatus}
                          </div>
                          <div className="pm2-meta-val" style={{ opacity: .45, fontSize: '.72rem' }}>
                            {order.orderSource === 'whatsapp' ? 'via WhatsApp' : 'Card'}
                          </div>
                        </div>
                        {order.shippingAddress && (
                          <div>
                            <div className="pm2-meta-label">Delivery to</div>
                            <div className="pm2-meta-val">
                              {order.shippingAddress.name}<br />
                              {order.shippingAddress.street}<br />
                              {[order.shippingAddress.city, order.shippingAddress.postcode].filter(Boolean).join(', ')}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Logout */}
        <div className="pm2-footer">
          <button className="pm2-logout" onClick={handleLogout}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>

      </div>
    </div>
  );
}
