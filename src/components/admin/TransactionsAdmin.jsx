'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

const PAY_COLOR = {
  paid:    { bg: '#d1fae5', color: '#065f46' },
  pending: { bg: '#fef3c7', color: '#92400e' },
  failed:  { bg: '#fee2e2', color: '#991b1b' },
};

const ORDER_COLOR = {
  confirmed: { bg: '#dbeafe', color: '#1e40af' },
  pending:   { bg: '#fef3c7', color: '#92400e' },
  cancelled: { bg: '#fee2e2', color: '#991b1b' },
  shipped:   { bg: '#ede9fe', color: '#5b21b6' },
  delivered: { bg: '#f0fdf4', color: '#15803d' },
};

export default function TransactionsAdmin() {
  const [data, setData]       = useState(null);
  const [filter, setFilter]   = useState('all');
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (f, p) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/transactions?filter=${f}&page=${p}&limit=30`);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(filter, page); }, [filter, page, load]);

  const handleFilter = (f) => { setFilter(f); setPage(1); };

  const FILTERS = [
    { key: 'all',     label: 'All' },
    { key: 'paid',    label: 'Paid' },
    { key: 'pending', label: 'Pending' },
    { key: 'failed',  label: 'Failed' },
  ];

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => handleFilter(f.key)}
            style={{
              padding: '7px 18px',
              borderRadius: 20,
              border: filter === f.key ? 'none' : '1px solid #e8e8e8',
              background: filter === f.key ? '#0a0a0a' : '#fff',
              color: filter === f.key ? '#fff' : '#0a0a0a',
              fontWeight: 700,
              fontSize: '.78rem',
              cursor: 'pointer',
              letterSpacing: '.3px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {f.label}
            {data?.counts && (
              <span style={{
                background: filter === f.key ? 'rgba(255,255,255,.2)' : '#f0f0f0',
                color: filter === f.key ? '#fff' : '#555',
                borderRadius: 10,
                padding: '1px 7px',
                fontSize: '.7rem',
                fontWeight: 700,
              }}>
                {data.counts[f.key] ?? '—'}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', opacity: .4 }}>Loading…</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Order Status</th>
                <th>Source</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(data?.transactions || []).map(tx => {
                const cur    = tx.currency || 'GBP';
                const amount = cur === 'INR'
                  ? `₹${Math.round(tx.totalINR || 0).toLocaleString('en-IN')}`
                  : `£${(tx.totalGBP || 0).toFixed(2)}`;
                const customer = tx.user?.name || tx.shippingAddress?.name || 'Guest';
                const email    = tx.user?.email || tx.shippingAddress?.email || '—';
                const pc       = PAY_COLOR[tx.paymentStatus] || PAY_COLOR.pending;
                const oc       = ORDER_COLOR[tx.status]      || ORDER_COLOR.pending;
                const date     = new Date(tx.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                });
                const time     = new Date(tx.createdAt).toLocaleTimeString('en-GB', {
                  hour: '2-digit', minute: '2-digit',
                });
                return (
                  <tr key={tx._id}>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '.82rem' }}>
                      #{tx._id.slice(-6).toUpperCase()}
                      {tx.stripePaymentIntentId && (
                        <div style={{ fontSize: '.65rem', opacity: .35, fontWeight: 400, marginTop: 2 }}>
                          {tx.stripePaymentIntentId.slice(0, 20)}…
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{customer}</div>
                      <div style={{ fontSize: '.72rem', opacity: .4 }}>{email}</div>
                    </td>
                    <td style={{ fontWeight: 800, fontSize: '.95rem' }}>{amount}</td>
                    <td>
                      <span style={{
                        background: pc.bg, color: pc.color,
                        borderRadius: 20, padding: '3px 10px',
                        fontSize: '.72rem', fontWeight: 700, textTransform: 'capitalize',
                      }}>
                        {tx.paymentStatus === 'paid' ? '✓ ' : tx.paymentStatus === 'failed' ? '✕ ' : '⏳ '}
                        {tx.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        background: oc.bg, color: oc.color,
                        borderRadius: 20, padding: '3px 10px',
                        fontSize: '.72rem', fontWeight: 700, textTransform: 'capitalize',
                      }}>
                        {tx.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '.75rem', opacity: .5, textTransform: 'capitalize' }}>
                      {tx.orderSource || 'website'}
                    </td>
                    <td style={{ opacity: .5, fontSize: '.75rem' }}>
                      <div>{date}</div>
                      <div>{time}</div>
                    </td>
                  </tr>
                );
              })}
              {!loading && !data?.transactions?.length && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', opacity: .4, padding: 40 }}>
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '7px 16px', borderRadius: 6, border: '1px solid #e8e8e8',
              background: '#fff', cursor: page === 1 ? 'default' : 'pointer',
              opacity: page === 1 ? .4 : 1, fontWeight: 600, fontSize: '.8rem',
            }}
          >
            ← Prev
          </button>
          <span style={{ padding: '7px 14px', fontSize: '.8rem', opacity: .5 }}>
            Page {page} of {data.pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(data.pages, p + 1))}
            disabled={page === data.pages}
            style={{
              padding: '7px 16px', borderRadius: 6, border: '1px solid #e8e8e8',
              background: '#fff', cursor: page === data.pages ? 'default' : 'pointer',
              opacity: page === data.pages ? .4 : 1, fontWeight: 600, fontSize: '.8rem',
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
