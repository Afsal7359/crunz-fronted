'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

/* ─── constants ─────────────────────────────────────────────────── */
const PIE_COLORS    = ['#0a0a0a', '#6366f1', '#f59e0b', '#10b981', '#ef4444'];
const CHART_COLOR   = '#6366f1';
const RANGE_OPTS    = [{ key: '1d', label: 'Today' }, { key: '7d', label: '7 Days' }, { key: '30d', label: '30 Days' }];

const EVENT_LABELS = {
  session_start:   'Session Start',  page_view:       'Page View',
  product_view:    'Product View',   add_to_cart:     'Add to Cart',
  checkout_start:  'Checkout',       payment_start:   'Payment',
  payment_success: 'Paid ✓',        payment_failed:  'Payment Failed',
  session_end:     'Session End',    user_identified: 'User Login',
};
const FUNNEL_LABELS = {
  session_start: 'Visitors', product_view: 'Viewed Product',
  add_to_cart: 'Added to Cart', checkout_start: 'Started Checkout',
  payment_start: 'Entered Payment', payment_success: 'Paid',
};
const EVENT_COLORS = {
  page_view: '#6366f1', add_to_cart: '#7c3aed', product_view: '#3b82f6',
  checkout_start: '#ea580c', payment_start: '#f59e0b',
  payment_success: '#16a34a', payment_failed: '#dc2626',
  session_start: '#94a3b8', session_end: '#94a3b8', user_identified: '#f59e0b',
};

/* ─── helpers ───────────────────────────────────────────────────── */
function toFlag(code = '') {
  if (!code || code.length !== 2) return '🌍';
  try { return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0))); }
  catch { return '🌍'; }
}
function fmtDur(secs) {
  if (!secs) return '—';
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}
function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function prevDay(d) {
  const dt = new Date(d); dt.setDate(dt.getDate() - 1); return dt.toISOString().split('T')[0];
}
function nextDay(d) {
  const dt = new Date(d); dt.setDate(dt.getDate() + 1); return dt.toISOString().split('T')[0];
}

/* ─── small shared UI pieces ────────────────────────────────────── */
function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: accent ? '#0a0a0a' : '#fff', color: accent ? '#fff' : '#0a0a0a',
      border: accent ? 'none' : '1px solid #f0f0f0', borderRadius: 12, padding: '20px 22px',
    }}>
      <div style={{ fontSize: '.65rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', opacity: .45, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '.75rem', opacity: .45, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}
function SectionTitle({ children }) {
  return <div style={{ fontSize: '.65rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', opacity: .35, marginBottom: 16 }}>{children}</div>;
}
function DeviceIcon({ device }) {
  return <span title={device}>{device === 'mobile' ? '📱' : device === 'tablet' ? '📱' : '💻'}</span>;
}
function DateNav({ date, onChange }) {
  const isToday = date === todayStr();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button onClick={() => onChange(prevDay(date))} style={{ border: '1px solid #e8e8e8', background: '#fff', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: '.82rem' }}>‹</button>
      <input type="date" value={date} max={todayStr()} onChange={e => onChange(e.target.value)}
        style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: '6px 12px', fontSize: '.82rem', fontFamily: 'Inter,sans-serif', cursor: 'pointer' }} />
      <button onClick={() => onChange(nextDay(date))} disabled={isToday}
        style={{ border: '1px solid #e8e8e8', background: isToday ? '#f5f5f5' : '#fff', borderRadius: 8, padding: '6px 12px', cursor: isToday ? 'default' : 'pointer', fontSize: '.82rem', opacity: isToday ? .4 : 1 }}>›</button>
      {!isToday && (
        <button onClick={() => onChange(todayStr())}
          style={{ border: 'none', background: '#0a0a0a', color: '#fff', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: '.78rem', fontWeight: 700 }}>Today</button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 1 — OVERVIEW (charts, funnel, devices, etc.)
═══════════════════════════════════════════════════════════════════ */
function OverviewTab() {
  const [data, setData] = useState(null);
  const [range, setRange] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/analytics/summary?range=${range}`).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [range]);

  if (loading) return <div style={{ padding: 60, textAlign: 'center', opacity: .4 }}>Loading…</div>;
  if (!data) return null;

  const funnelData  = data.funnel.map(f => ({ name: FUNNEL_LABELS[f.event] || f.event, count: f.count }));
  const visitorCount = data.funnel.find(f => f.event === 'session_start')?.count || 1;
  const paidCount    = data.funnel.find(f => f.event === 'payment_success')?.count || 0;
  const deviceData  = data.deviceBreakdown.map(d => ({ name: d._id || 'unknown', value: d.count }));
  const dailyData   = data.dailySessions.map(d => ({ date: d._id?.slice(5) || d._id, sessions: d.sessions }));
  const eventData   = data.eventBreakdown.filter(e => EVENT_LABELS[e._id]).map(e => ({ name: EVENT_LABELS[e._id] || e._id, count: e.count })).slice(0, 8);
  const convRate    = visitorCount > 0 ? ((paidCount / visitorCount) * 100).toFixed(1) : '0.0';

  return (
    <div>
      {/* Range */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {RANGE_OPTS.map(r => (
          <button key={r.key} onClick={() => setRange(r.key)} style={{
            padding: '7px 18px', borderRadius: 20, border: range === r.key ? 'none' : '1px solid #e8e8e8',
            background: range === r.key ? '#0a0a0a' : '#fff', color: range === r.key ? '#fff' : '#0a0a0a',
            fontWeight: 700, fontSize: '.78rem', cursor: 'pointer',
          }}>{r.label}</button>
        ))}
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard accent label="Sessions"   value={data.uniqueSessions} sub="Unique visitors" />
        <StatCard label="Logged In"  value={data.loggedInUsers ?? 0} sub="Identified users" />
        <StatCard label="Events"     value={data.totalEvents.toLocaleString()} sub="Total interactions" />
        <StatCard label="Avg Time"   value={fmtDur(data.avgDuration)} sub="Per session" />
        <StatCard label="Conversion" value={`${convRate}%`} sub="Visitor → Paid" />
      </div>

      {/* Daily area chart */}
      {dailyData.length > 1 && (
        <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: '20px 20px 10px', marginBottom: 24 }}>
          <SectionTitle>Daily Sessions</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={dailyData}>
              <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLOR} stopOpacity={0.15}/>
                <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0}/>
              </linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#aaa' }} />
              <YAxis tick={{ fontSize: 11, fill: '#aaa' }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #f0f0f0' }} />
              <Area type="monotone" dataKey="sessions" stroke={CHART_COLOR} strokeWidth={2} fill="url(#sg)" name="Sessions" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Funnel + Device */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: 20 }}>
          <SectionTitle>Conversion Funnel</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {funnelData.map((step, i) => {
              const pct = Math.round((step.count / visitorCount) * 100);
              const cols = ['#0a0a0a','#1d4ed8','#7c3aed','#ea580c','#dc2626','#16a34a'];
              return (
                <div key={step.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', marginBottom: 5 }}>
                    <span style={{ fontWeight: 600 }}>{step.name}</span>
                    <span style={{ fontWeight: 800 }}>{step.count} <span style={{ opacity: .4, fontWeight: 400 }}>({pct}%)</span></span>
                  </div>
                  <div style={{ background: '#f5f5f5', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 6, background: cols[i] || '#ccc', transition: 'width .5s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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
          ) : <div style={{ opacity: .4, fontSize: '.82rem' }}>No data yet</div>}
          {data.browserBreakdown?.length > 0 && (
            <>
              <div style={{ height: 1, background: '#f0f0f0', margin: '16px 0' }} />
              <SectionTitle>Browser</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.browserBreakdown.map(b => {
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

      {/* Events bar + Top pages */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
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
        <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: 20 }}>
          <SectionTitle>Top Pages</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.topPages.length > 0 ? data.topPages.map((p) => {
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
            }) : <div style={{ opacity: .4, fontSize: '.82rem' }}>No page views recorded yet</div>}
          </div>
        </div>
      </div>

      {/* Countries + Cities */}
      {(data.countryBreakdown?.length > 0 || data.cityBreakdown?.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: 20 }}>
            <SectionTitle>Visitors by Country</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(data.countryBreakdown || []).map((c, i) => {
                const total = data.countryBreakdown.reduce((s, x) => s + x.sessions, 0);
                const pct   = total > 0 ? Math.round((c.sessions / total) * 100) : 0;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, fontSize: '.82rem' }}>
                      <span style={{ fontSize: '1.1rem' }}>{toFlag(c._id.countryCode)}</span>
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
          <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: 20 }}>
            <SectionTitle>Top Cities</SectionTitle>
            {(data.cityBreakdown || []).map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < data.cityBreakdown.length - 1 ? '1px solid #f8f8f8' : 'none', fontSize: '.82rem' }}>
                <span>{toFlag(c._id.countryCode)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{c._id.city}</div>
                  <div style={{ fontSize: '.7rem', opacity: .4 }}>{c._id.country}</div>
                </div>
                <div style={{ background: '#f0f0f0', borderRadius: 20, padding: '3px 10px', fontSize: '.72rem', fontWeight: 700 }}>{c.sessions} sessions</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live event feed */}
      <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: 20 }}>
        <SectionTitle>Live Event Feed</SectionTitle>
        {data.recentEvents.length === 0 && <div style={{ opacity: .4, fontSize: '.82rem' }}>No events yet</div>}
        {data.recentEvents.map((ev, i) => {
          const dotColor = EVENT_COLORS[ev.event] || '#6366f1';
          const userName = ev.userId?.name || null;
          const userEmail = ev.userId?.email || null;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: i < data.recentEvents.length - 1 ? '1px solid #f8f8f8' : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0, marginTop: 5 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '.82rem' }}>{EVENT_LABELS[ev.event] || ev.event}</span>
                  {ev.properties?.name && <span style={{ opacity: .45, fontSize: '.76rem' }}>— {ev.properties.name}</span>}
                  {userName && <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 10, padding: '1px 8px', fontSize: '.68rem', fontWeight: 700 }}>👤 {userName}</span>}
                </div>
                <div style={{ fontSize: '.7rem', opacity: .35, marginTop: 2 }}>
                  {ev.page} · {ev.device} · {ev.browser}
                  {ev.country && <> · {toFlag(ev.countryCode)} {ev.city ? `${ev.city}, ` : ''}{ev.country}</>}
                  <span style={{ fontFamily: 'monospace' }}> · #{ev.sessionId?.slice(-6)}</span>
                </div>
                {userEmail && <div style={{ fontSize: '.68rem', color: '#6366f1', marginTop: 1 }}>{userEmail}</div>}
              </div>
              <div style={{ opacity: .4, fontSize: '.7rem', textAlign: 'right', flexShrink: 0 }}>
                <div>{fmtTime(ev.timestamp)}</div>
                <div>{fmtDate(ev.timestamp)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SESSION DETAIL MODAL
═══════════════════════════════════════════════════════════════════ */
function SessionDetailModal({ sessionId, onClose }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/analytics/sessions/${sessionId}`)
      .then(d => setEvents(d.events || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId]);

  // Detect back-navigation: page appears again after leaving it
  const pagesSeen = [];
  const processedEvents = events.map((ev, i) => {
    let isBack = false;
    if (ev.event === 'page_view') {
      isBack = pagesSeen.includes(ev.page);
      pagesSeen.push(ev.page);
    }
    return { ...ev, isBack };
  });

  const user = events.find(e => e.userId)?.userId;
  const first = events[0];
  const durationSec = events.length > 1
    ? Math.round((new Date(events[events.length - 1].timestamp) - new Date(events[0].timestamp)) / 1000)
    : 0;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: '100%', maxWidth: 560, height: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 32px rgba(0,0,0,.12)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: '-.3px', marginBottom: 4 }}>
              Session Detail
              <span style={{ fontFamily: 'monospace', fontSize: '.72rem', opacity: .35, marginLeft: 8 }}>#{sessionId?.slice(-8)}</span>
            </div>
            {first && (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '.75rem', opacity: .55 }}>
                <span>{fmtDate(first.timestamp)} · {fmtTime(first.timestamp)}</span>
                {first.device && <span><DeviceIcon device={first.device} /> {first.device}</span>}
                {first.browser && <span>{first.browser}</span>}
                {first.country && <span>{toFlag(first.countryCode)} {first.city ? `${first.city}, ` : ''}{first.country}</span>}
                {durationSec > 0 && <span>⏱ {fmtDur(durationSec)}</span>}
              </div>
            )}
            {user && (
              <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fef3c7', color: '#92400e', borderRadius: 20, padding: '4px 12px', fontSize: '.75rem', fontWeight: 700 }}>
                👤 {user.name} · {user.email}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', fontSize: '1.4rem', opacity: .4, lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>

        {/* Timeline */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loading && <div style={{ opacity: .4, textAlign: 'center', paddingTop: 40 }}>Loading journey…</div>}
          {!loading && processedEvents.length === 0 && <div style={{ opacity: .4, fontSize: '.82rem' }}>No events found.</div>}
          {!loading && processedEvents.map((ev, i) => {
            const color  = EVENT_COLORS[ev.event] || '#6366f1';
            const label  = EVENT_LABELS[ev.event] || ev.event;
            const isPage = ev.event === 'page_view';
            const isPay  = ev.event === 'payment_success';
            const isFail = ev.event === 'payment_failed';
            const isCart = ev.event === 'add_to_cart';
            const isEnd  = ev.event === 'session_end';

            return (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 2 }}>
                {/* Spine */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: isPay ? '#dcfce7' : isFail ? '#fee2e2' : isCart ? '#ede9fe' : isPage ? '#f0f0ff' : '#f5f5f5',
                    border: `2px solid ${color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '.7rem',
                  }}>
                    {isPay ? '✓' : isFail ? '✗' : isCart ? '🛒' : isPage ? (ev.isBack ? '↩' : '→') : isEnd ? '■' : '●'}
                  </div>
                  {i < processedEvents.length - 1 && (
                    <div style={{ width: 2, flex: 1, minHeight: 16, background: '#f0f0f0', margin: '2px 0' }} />
                  )}
                </div>

                {/* Content */}
                <div style={{
                  flex: 1, paddingBottom: 14,
                  background: isPay ? '#f0fdf4' : isFail ? '#fef2f2' : 'transparent',
                  borderRadius: isPay || isFail ? 8 : 0,
                  padding: isPay || isFail ? '6px 10px' : '0',
                  marginBottom: isPay || isFail ? 6 : 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '.8rem', fontWeight: ev.isBack || isPay || isFail || isCart ? 700 : 600, color: isPay ? '#16a34a' : isFail ? '#dc2626' : color }}>
                      {ev.isBack ? '↩ Back to' : ''} {label}
                    </span>
                    {ev.isBack && <span style={{ fontSize: '.66rem', background: '#fef9c3', color: '#854d0e', borderRadius: 6, padding: '1px 6px', fontWeight: 700 }}>BACK</span>}
                    {isCart && ev.properties?.name && <span style={{ fontSize: '.74rem', opacity: .6 }}>— {ev.properties.name}</span>}
                  </div>
                  {isPage && (
                    <div style={{ fontSize: '.72rem', color: '#6366f1', marginTop: 2, wordBreak: 'break-all' }}>{ev.page}</div>
                  )}
                  {ev.properties && Object.keys(ev.properties).length > 0 && !isPage && !isCart && (
                    <div style={{ fontSize: '.7rem', opacity: .45, marginTop: 2 }}>
                      {Object.entries(ev.properties).filter(([k]) => k !== 'isBounce').map(([k, v]) => `${k}: ${v}`).join(' · ')}
                    </div>
                  )}
                  <div style={{ fontSize: '.68rem', opacity: .35, marginTop: 2 }}>
                    {fmtTime(ev.timestamp)}
                    {ev.duration > 0 && ` · ${fmtDur(ev.duration)}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 2 — SESSIONS (paginated list, date filter)
═══════════════════════════════════════════════════════════════════ */
function SessionsTab() {
  const [date, setDate]         = useState(todayStr());
  const [data, setData]         = useState(null);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback((d, p) => {
    setLoading(true);
    api.get(`/analytics/sessions?date=${d}&page=${p}&limit=25`)
      .then(r => { setData(r); setPage(p); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(date, 1); }, [date, load]);

  // Auto-advance at midnight
  useEffect(() => {
    const iv = setInterval(() => {
      const today = todayStr();
      if (today !== date && date === todayStr()) setDate(today);
    }, 60_000);
    return () => clearInterval(iv);
  }, [date]);

  const sessions = data?.sessions || [];
  const totalPages = data?.pages || 1;
  const total = data?.total || 0;

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <DateNav date={date} onChange={d => { setDate(d); setPage(1); }} />
        <div style={{ fontSize: '.82rem', opacity: .45 }}>
          {loading ? 'Loading…' : `${total} session${total !== 1 ? 's' : ''}`}
        </div>
      </div>

      {/* Summary pills */}
      {data && !loading && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          {[
            { label: 'Total Sessions', value: total },
            { label: 'Converted', value: sessions.filter(s => s.converted > 0).length },
            { label: 'Added to Cart', value: sessions.filter(s => s.addToCart > 0).length },
            { label: 'Logged In', value: sessions.filter(s => s.userName).length },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 10, padding: '8px 16px', fontSize: '.8rem' }}>
              <span style={{ fontWeight: 900, fontSize: '1rem' }}>{s.value}</span>
              <span style={{ opacity: .45, marginLeft: 6 }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 1fr 80px 70px 60px 60px 60px', padding: '10px 16px', borderBottom: '1px solid #f0f0f0', fontSize: '.65rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', opacity: .4 }}>
          <span>#</span><span>User / Session</span><span>Location</span><span>Device</span><span>Pages</span><span>Duration</span><span>Cart</span><span>Paid</span>
        </div>

        {loading && (
          <div style={{ padding: 40, textAlign: 'center', opacity: .4, fontSize: '.82rem' }}>Loading sessions…</div>
        )}
        {!loading && sessions.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', opacity: .4, fontSize: '.82rem' }}>No sessions on this date</div>
        )}

        {!loading && sessions.map((s, i) => {
          const rowNum = (page - 1) * 25 + i + 1;
          const isConverted = s.converted > 0;
          return (
            <div key={s.sessionId}
              onClick={() => setSelected(s.sessionId)}
              style={{
                display: 'grid', gridTemplateColumns: '44px 1fr 1fr 80px 70px 60px 60px 60px',
                padding: '12px 16px', borderBottom: '1px solid #fafafa',
                cursor: 'pointer', transition: 'background .12s',
                background: isConverted ? '#f0fdf4' : 'transparent',
              }}
              onMouseEnter={e => e.currentTarget.style.background = isConverted ? '#dcfce7' : '#f9f9f9'}
              onMouseLeave={e => e.currentTarget.style.background = isConverted ? '#f0fdf4' : 'transparent'}
            >
              <span style={{ fontSize: '.72rem', opacity: .35, alignSelf: 'center' }}>{rowNum}</span>

              {/* User / session */}
              <div style={{ alignSelf: 'center', minWidth: 0 }}>
                {s.userName ? (
                  <>
                    <div style={{ fontWeight: 700, fontSize: '.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.userName}</div>
                    <div style={{ fontSize: '.68rem', color: '#6366f1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.userEmail}</div>
                  </>
                ) : (
                  <div style={{ fontSize: '.78rem', opacity: .45 }}>Anonymous</div>
                )}
                <div style={{ fontSize: '.66rem', opacity: .3, fontFamily: 'monospace' }}>#{s.sessionId?.slice(-8)}</div>
                <div style={{ fontSize: '.68rem', opacity: .4 }}>{fmtTime(s.startTime)}</div>
              </div>

              {/* Location */}
              <div style={{ alignSelf: 'center', fontSize: '.78rem' }}>
                <span style={{ marginRight: 5 }}>{toFlag(s.countryCode)}</span>
                <span style={{ fontWeight: 600 }}>{s.city || s.country || '—'}</span>
                {s.city && s.country && <div style={{ fontSize: '.68rem', opacity: .4 }}>{s.country}</div>}
              </div>

              {/* Device */}
              <div style={{ alignSelf: 'center', fontSize: '.78rem' }}>
                <DeviceIcon device={s.device} />
                <div style={{ fontSize: '.66rem', opacity: .4, marginTop: 2 }}>{s.browser}</div>
              </div>

              {/* Page views */}
              <div style={{ alignSelf: 'center', textAlign: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '.9rem' }}>{s.pageViews || 0}</span>
              </div>

              {/* Duration */}
              <div style={{ alignSelf: 'center', fontSize: '.78rem', opacity: .6 }}>{fmtDur(s.duration)}</div>

              {/* Cart */}
              <div style={{ alignSelf: 'center', textAlign: 'center' }}>
                {s.addToCart > 0
                  ? <span style={{ background: '#ede9fe', color: '#6d28d9', borderRadius: 20, padding: '2px 8px', fontSize: '.68rem', fontWeight: 700 }}>{s.addToCart}</span>
                  : <span style={{ opacity: .2 }}>—</span>}
              </div>

              {/* Paid */}
              <div style={{ alignSelf: 'center', textAlign: 'center' }}>
                {isConverted
                  ? <span style={{ background: '#dcfce7', color: '#16a34a', borderRadius: 20, padding: '2px 8px', fontSize: '.68rem', fontWeight: 800 }}>✓</span>
                  : <span style={{ opacity: .2 }}>—</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button onClick={() => load(date, page - 1)} disabled={page <= 1}
            style={{ border: '1px solid #e8e8e8', background: '#fff', borderRadius: 8, padding: '7px 14px', cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? .35 : 1, fontSize: '.82rem' }}>
            ← Prev
          </button>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const pg = totalPages <= 7 ? i + 1
                : page <= 4 ? i + 1
                : page >= totalPages - 3 ? totalPages - 6 + i
                : page - 3 + i;
              return (
                <button key={pg} onClick={() => load(date, pg)}
                  style={{ width: 34, height: 34, borderRadius: 8, border: pg === page ? 'none' : '1px solid #e8e8e8', background: pg === page ? '#0a0a0a' : '#fff', color: pg === page ? '#fff' : '#0a0a0a', fontWeight: pg === page ? 800 : 400, cursor: 'pointer', fontSize: '.82rem' }}>
                  {pg}
                </button>
              );
            })}
          </div>
          <button onClick={() => load(date, page + 1)} disabled={page >= totalPages}
            style={{ border: '1px solid #e8e8e8', background: '#fff', borderRadius: 8, padding: '7px 14px', cursor: page >= totalPages ? 'default' : 'pointer', opacity: page >= totalPages ? .35 : 1, fontSize: '.82rem' }}>
            Next →
          </button>
          <span style={{ opacity: .35, fontSize: '.75rem', marginLeft: 8 }}>Page {page} of {totalPages} · {total} total</span>
        </div>
      )}

      {/* Session detail slide-over */}
      {selected && <SessionDetailModal sessionId={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 3 — PAGES (page-wise stats, date filter)
═══════════════════════════════════════════════════════════════════ */
function PagesTab() {
  const [date, setDate]       = useState(todayStr());
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback((d) => {
    setLoading(true);
    api.get(`/analytics/pages?date=${d}`)
      .then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(date); }, [date, load]);

  const pages    = data?.pages || [];
  const maxViews = pages[0]?.views || 1;

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <DateNav date={date} onChange={d => { setDate(d); load(d); }} />
        {!loading && data && <div style={{ fontSize: '.82rem', opacity: .45 }}>{pages.length} pages tracked</div>}
      </div>

      {loading && <div style={{ padding: 60, textAlign: 'center', opacity: .4 }}>Loading…</div>}

      {!loading && data && (
        <>
          {/* Entry / Exit pages */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {/* Entry pages */}
            <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: 20 }}>
              <SectionTitle>Top Entry Pages</SectionTitle>
              {(data.entryPages || []).length === 0 && <div style={{ opacity: .4, fontSize: '.82rem' }}>No data</div>}
              {(data.entryPages || []).map((p, i) => {
                const max = data.entryPages[0]?.count || 1;
                const pct = Math.round((p.count / max) * 100);
                return (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6366f1' }}>{p._id || '/'}</span>
                      <span style={{ fontWeight: 800, marginLeft: 8 }}>{p.count}</span>
                    </div>
                    <div style={{ background: '#f5f5f5', borderRadius: 4, height: 5 }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 4, background: '#6366f1' }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Exit pages */}
            <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: 20 }}>
              <SectionTitle>Top Exit Pages</SectionTitle>
              {(data.exitPages || []).length === 0 && <div style={{ opacity: .4, fontSize: '.82rem' }}>No data</div>}
              {(data.exitPages || []).map((p, i) => {
                const max = data.exitPages[0]?.count || 1;
                const pct = Math.round((p.count / max) * 100);
                return (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#ef4444' }}>{p._id || '/'}</span>
                      <span style={{ fontWeight: 800, marginLeft: 8 }}>{p.count}</span>
                    </div>
                    <div style={{ background: '#f5f5f5', borderRadius: 4, height: 5 }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 4, background: '#ef4444' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full page stats table */}
          <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #f0f0f0', display: 'grid', gridTemplateColumns: '1fr 80px 100px 80px', gap: 8, fontSize: '.65rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', opacity: .4 }}>
              <span>Page</span><span style={{ textAlign: 'right' }}>Views</span><span style={{ textAlign: 'right' }}>Unique Users</span><span style={{ textAlign: 'right' }}>% Share</span>
            </div>
            {pages.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', opacity: .4, fontSize: '.82rem' }}>No page views on this date</div>
            )}
            {pages.map((p, i) => {
              const totalViews = pages.reduce((s, x) => s + x.views, 0);
              const sharePct   = totalViews > 0 ? ((p.views / totalViews) * 100).toFixed(1) : '0.0';
              const barPct     = Math.round((p.views / maxViews) * 100);
              return (
                <div key={i} style={{ padding: '14px 20px', borderBottom: i < pages.length - 1 ? '1px solid #fafafa' : 'none', display: 'grid', gridTemplateColumns: '1fr 80px 100px 80px', gap: 8, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '.82rem', fontWeight: 600, color: '#6366f1', wordBreak: 'break-all' }}>{p._id || '/'}</div>
                    <div style={{ marginTop: 5, background: '#f5f5f5', borderRadius: 3, height: 4 }}>
                      <div style={{ height: '100%', width: `${barPct}%`, borderRadius: 3, background: '#6366f1', opacity: .4 }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 900, fontSize: '.95rem' }}>{p.views}</div>
                  <div style={{ textAlign: 'right', fontWeight: 600, opacity: .6 }}>{p.uniqueVisitors}</div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ background: '#f0f0f0', borderRadius: 20, padding: '2px 8px', fontSize: '.72rem', fontWeight: 700 }}>{sharePct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ROOT COMPONENT
═══════════════════════════════════════════════════════════════════ */
const TABS = [
  { key: 'overview',  label: 'Overview',  ico: '📊' },
  { key: 'sessions',  label: 'Sessions',  ico: '👥' },
  { key: 'pages',     label: 'Pages',     ico: '📄' },
];

export default function AnalyticsAdmin() {
  const [tab, setTab] = useState('overview');
  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 28, borderBottom: '1px solid #f0f0f0', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding: '9px 20px', borderRadius: '10px 10px 0 0',
              border: 'none', borderBottom: tab === t.key ? '2px solid #0a0a0a' : '2px solid transparent',
              background: tab === t.key ? '#0a0a0a' : 'transparent',
              color: tab === t.key ? '#fff' : '#666',
              fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', transition: 'all .15s',
              fontFamily: 'Inter,sans-serif',
            }}>
            {t.ico} {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab />}
      {tab === 'sessions' && <SessionsTab />}
      {tab === 'pages'    && <PagesTab />}
    </div>
  );
}
