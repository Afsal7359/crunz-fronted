'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const RANGE_OPTS = [
  { key: '1d',  label: 'Today' },
  { key: '7d',  label: '7 Days' },
  { key: '30d', label: '30 Days' },
];

const FUNNEL_LABELS = {
  session_start:    'Visitors',
  product_view:     'Viewed Product',
  add_to_cart:      'Added to Cart',
  checkout_start:   'Started Checkout',
  payment_start:    'Entered Payment',
  payment_success:  'Paid',
};

const EVENT_LABELS = {
  session_start:   'Sessions',
  page_view:       'Page Views',
  product_view:    'Product Views',
  add_to_cart:     'Add to Cart',
  checkout_start:  'Checkout Started',
  payment_start:   'Payment Started',
  payment_success: 'Payment Success',
  payment_failed:  'Payment Failed',
  session_end:      'Session Ended',
  user_identified:  'User Logged In',
};

const PIE_COLORS = ['#0a0a0a', '#6366f1', '#f59e0b', '#10b981', '#ef4444'];
const CHART_COLOR = '#6366f1';

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: accent ? '#0a0a0a' : '#fff',
      color: accent ? '#fff' : '#0a0a0a',
      border: accent ? 'none' : '1px solid #f0f0f0',
      borderRadius: 12, padding: '20px 22px',
    }}>
      <div style={{ fontSize: '.65rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', opacity: .45, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '.75rem', opacity: .45, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: '.65rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', opacity: .35, marginBottom: 16 }}>
      {children}
    </div>
  );
}

function formatDuration(secs) {
  if (!secs) return '0s';
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}m ${s}s`;
}

export default function AnalyticsAdmin() {
  const [data, setData]     = useState(null);
  const [range, setRange]   = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/analytics/summary?range=${range}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [range]);

  if (loading) return <div style={{ padding: 60, textAlign: 'center', opacity: .4 }}>Loading analytics…</div>;
  if (!data)   return null;

  // Prepare funnel data
  const funnelData = data.funnel.map(f => ({
    name: FUNNEL_LABELS[f.event] || f.event,
    count: f.count,
  }));
  const visitorCount = data.funnel.find(f => f.event === 'session_start')?.count || 1;
  const paidCount    = data.funnel.find(f => f.event === 'payment_success')?.count || 0;

  // Prepare device pie data
  const deviceData = data.deviceBreakdown.map(d => ({
    name: d._id || 'unknown', value: d.count,
  }));

  // Daily sessions for area chart
  const dailyData = data.dailySessions.map(d => ({
    date: d._id?.slice(5) || d._id, // show MM-DD
    sessions: d.sessions,
  }));

  // Top events bar
  const eventData = data.eventBreakdown
    .filter(e => EVENT_LABELS[e._id])
    .map(e => ({ name: EVENT_LABELS[e._id] || e._id, count: e.count }))
    .slice(0, 8);

  const convRate = visitorCount > 0 ? ((paidCount / visitorCount) * 100).toFixed(1) : '0.0';

  return (
    <div>
      {/* Range selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {RANGE_OPTS.map(r => (
          <button key={r.key} onClick={() => setRange(r.key)}
            style={{
              padding: '7px 18px', borderRadius: 20,
              border: range === r.key ? 'none' : '1px solid #e8e8e8',
              background: range === r.key ? '#0a0a0a' : '#fff',
              color: range === r.key ? '#fff' : '#0a0a0a',
              fontWeight: 700, fontSize: '.78rem', cursor: 'pointer',
            }}>
            {r.label}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard accent label="Sessions" value={data.uniqueSessions} sub="Unique visitors" />
        <StatCard label="Logged In" value={data.loggedInUsers ?? 0} sub="Identified users" />
        <StatCard label="Events" value={data.totalEvents.toLocaleString()} sub="Total interactions" />
        <StatCard label="Avg Time" value={formatDuration(data.avgDuration)} sub="Per session" />
        <StatCard label="Conversion" value={`${convRate}%`} sub="Visitor → Paid" />
      </div>

      {/* Area chart — daily sessions */}
      {dailyData.length > 1 && (
        <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: '20px 20px 10px', marginBottom: 24 }}>
          <SectionTitle>Daily Sessions</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLOR} stopOpacity={0.15}/>
                  <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#aaa' }} />
              <YAxis tick={{ fontSize: 11, fill: '#aaa' }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #f0f0f0' }} />
              <Area type="monotone" dataKey="sessions" stroke={CHART_COLOR} strokeWidth={2} fill="url(#sg)" name="Sessions" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Funnel + Device side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Conversion funnel */}
        <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: 20 }}>
          <SectionTitle>Conversion Funnel</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {funnelData.map((step, i) => {
              const pct = visitorCount > 0 ? Math.round((step.count / visitorCount) * 100) : 0;
              const colors = ['#0a0a0a', '#1d4ed8', '#7c3aed', '#ea580c', '#dc2626', '#16a34a'];
              return (
                <div key={step.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', marginBottom: 5 }}>
                    <span style={{ fontWeight: 600 }}>{step.name}</span>
                    <span style={{ fontWeight: 800 }}>{step.count} <span style={{ opacity: .4, fontWeight: 400 }}>({pct}%)</span></span>
                  </div>
                  <div style={{ background: '#f5f5f5', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`, borderRadius: 6,
                      background: colors[i] || '#ccc', transition: 'width .5s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Device breakdown */}
        <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: 20 }}>
          <SectionTitle>Device Breakdown</SectionTitle>
          {deviceData.length > 0 ? (
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <PieChart width={130} height={130}>
                <Pie data={deviceData} cx={60} cy={60} innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={3}>
                  {deviceData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} />
              </PieChart>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {deviceData.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.82rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                    <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{d.name}</span>
                    <span style={{ opacity: .4 }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ opacity: .4, fontSize: '.82rem' }}>No data yet</div>
          )}

          {/* Browser breakdown */}
          {data.browserBreakdown.length > 0 && (
            <>
              <div style={{ height: 1, background: '#f0f0f0', margin: '16px 0' }} />
              <SectionTitle>Browser</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.browserBreakdown.map((b, i) => {
                  const total = data.browserBreakdown.reduce((s, x) => s + x.count, 0);
                  const pct = total > 0 ? Math.round((b.count / total) * 100) : 0;
                  return (
                    <div key={b._id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.78rem' }}>
                      <span style={{ width: 70, fontWeight: 600 }}>{b._id || 'Other'}</span>
                      <div style={{ flex: 1, background: '#f5f5f5', borderRadius: 4, height: 6 }}>
                        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 4, background: '#0a0a0a' }} />
                      </div>
                      <span style={{ opacity: .45, width: 28, textAlign: 'right' }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Events bar chart + Top pages side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Events breakdown */}
        <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: '20px 20px 10px' }}>
          <SectionTitle>Event Breakdown</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={eventData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#aaa' }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#555' }} width={110} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" fill={CHART_COLOR} radius={[0, 4, 4, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top pages */}
        <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: 20 }}>
          <SectionTitle>Top Pages</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.topPages.length > 0 ? data.topPages.map((p, i) => {
              const max = data.topPages[0]?.views || 1;
              const pct = Math.round((p.views / max) * 100);
              return (
                <div key={p._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, opacity: .7 }}>{p._id || '/'}</span>
                    <span style={{ fontWeight: 800 }}>{p.views}</span>
                  </div>
                  <div style={{ background: '#f5f5f5', borderRadius: 4, height: 5 }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 4, background: '#0a0a0a' }} />
                  </div>
                </div>
              );
            }) : (
              <div style={{ opacity: .4, fontSize: '.82rem' }}>No page views recorded yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Location: Countries + Cities */}
      {(data.countryBreakdown?.length > 0 || data.cityBreakdown?.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

          {/* Countries */}
          <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: 20 }}>
            <SectionTitle>Visitors by Country</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(data.countryBreakdown || []).map((c, i) => {
                const total = data.countryBreakdown.reduce((s, x) => s + x.sessions, 0);
                const pct   = total > 0 ? Math.round((c.sessions / total) * 100) : 0;
                const flag  = c._id.countryCode
                  ? String.fromCodePoint(...[...c._id.countryCode.toUpperCase()].map(ch => 0x1F1E6 - 65 + ch.charCodeAt(0)))
                  : '🌍';
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, fontSize: '.82rem' }}>
                      <span style={{ fontSize: '1.1rem' }}>{flag}</span>
                      <span style={{ fontWeight: 600, flex: 1 }}>{c._id.country || 'Unknown'}</span>
                      <span style={{ fontWeight: 800 }}>{c.sessions}</span>
                      <span style={{ opacity: .35, minWidth: 32, textAlign: 'right' }}>{pct}%</span>
                    </div>
                    <div style={{ background: '#f5f5f5', borderRadius: 4, height: 6 }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 4, background: '#0a0a0a', transition: 'width .5s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cities */}
          <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: 20 }}>
            <SectionTitle>Top Cities</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {(data.cityBreakdown || []).map((c, i) => {
                const flag = c._id.countryCode
                  ? String.fromCodePoint(...[...c._id.countryCode.toUpperCase()].map(ch => 0x1F1E6 - 65 + ch.charCodeAt(0)))
                  : '🌍';
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 0', borderBottom: i < data.cityBreakdown.length - 1 ? '1px solid #f8f8f8' : 'none',
                    fontSize: '.82rem',
                  }}>
                    <span style={{ fontSize: '1rem' }}>{flag}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{c._id.city}</div>
                      <div style={{ fontSize: '.7rem', opacity: .4 }}>{c._id.country}</div>
                    </div>
                    <div style={{
                      background: '#f0f0f0', borderRadius: 20,
                      padding: '3px 10px', fontSize: '.72rem', fontWeight: 700,
                    }}>{c.sessions} sessions</div>
                  </div>
                );
              })}
              {!data.cityBreakdown?.length && (
                <div style={{ opacity: .4, fontSize: '.82rem' }}>No location data yet</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent events feed */}
      <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: 20 }}>
        <SectionTitle>Live Event Feed</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {data.recentEvents.length === 0 && (
            <div style={{ opacity: .4, fontSize: '.82rem' }}>No events yet</div>
          )}
          {data.recentEvents.map((ev, i) => {
            const time = new Date(ev.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const date = new Date(ev.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            const label = EVENT_LABELS[ev.event] || ev.event;
            const dotColor = ev.event === 'payment_success' ? '#16a34a'
              : ev.event === 'payment_failed' ? '#dc2626'
              : ev.event === 'add_to_cart' ? '#7c3aed'
              : ev.event === 'user_identified' ? '#f59e0b'
              : '#6366f1';
            const userName  = ev.userId?.name  || null;
            const userEmail = ev.userId?.email || null;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '10px 0', borderBottom: i < data.recentEvents.length - 1 ? '1px solid #f8f8f8' : 'none',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0, marginTop: 5 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '.82rem' }}>{label}</span>
                    {ev.properties?.name && <span style={{ opacity: .45, fontSize: '.76rem' }}>— {ev.properties.name}</span>}
                    {userName && (
                      <span style={{
                        background: '#fef3c7', color: '#92400e',
                        borderRadius: 10, padding: '1px 8px',
                        fontSize: '.68rem', fontWeight: 700,
                      }}>
                        👤 {userName}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '.7rem', opacity: .35, marginTop: 2 }}>
                    {ev.page} · {ev.device} · {ev.browser}
                    {ev.country && <> · {ev.countryCode ? String.fromCodePoint(...[...ev.countryCode.toUpperCase()].map(ch => 0x1F1E6 - 65 + ch.charCodeAt(0))) : '🌍'} {ev.city ? `${ev.city}, ` : ''}{ev.country}</>}
                    {ev.sessionId && <span style={{ fontFamily: 'monospace' }}> · #{ev.sessionId.slice(-6)}</span>}
                  </div>
                  {userEmail && (
                    <div style={{ fontSize: '.68rem', color: '#6366f1', marginTop: 1 }}>{userEmail}</div>
                  )}
                </div>
                <div style={{ opacity: .4, fontSize: '.7rem', textAlign: 'right', flexShrink: 0 }}>
                  <div>{time}</div>
                  <div>{date}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
