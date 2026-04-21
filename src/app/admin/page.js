'use client';
import './admin.css';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Dashboard from '@/components/admin/Dashboard';
import ProductsAdmin from '@/components/admin/ProductsAdmin';
import OrdersAdmin from '@/components/admin/OrdersAdmin';
import ContentAdmin from '@/components/admin/ContentAdmin';
import UsersAdmin from '@/components/admin/UsersAdmin';
import TransactionsAdmin from '@/components/admin/TransactionsAdmin';

const NAV = [
  { key: 'dashboard',    label: 'Dashboard',    ico: '📊' },
  { key: 'products',     label: 'Products',     ico: '🍌' },
  { key: 'orders',       label: 'Orders',       ico: '📦' },
  { key: 'transactions', label: 'Transactions', ico: '💳' },
  { key: 'content',      label: 'Site Content', ico: '✏️'  },
  { key: 'users',        label: 'Users',        ico: '👥' },
];

/* ── Admin Login ─────────────────────────────────────────── */
function AdminLogin() {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr]           = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const d = await api.post('/auth/login', { email, password });
      if (!d.user.isAdmin) { setErr('This account does not have admin access.'); setLoading(false); return; }
      login(d.token, d.user);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#111', fontFamily:'Inter,sans-serif' }}>
      <div style={{ background:'#fff', borderRadius:14, padding:'40px 36px', width:'100%', maxWidth:380, boxShadow:'0 24px 80px rgba(0,0,0,.5)' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:'2rem', fontWeight:900, letterSpacing:-2, color:'#0a0a0a' }}>CRUNZ</div>
          <div style={{ fontSize:'.65rem', fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', opacity:.3, marginTop:4 }}>Admin Panel</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:'.66rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'1.5px', opacity:.35, marginBottom:6 }}>Email</label>
            <input style={{ width:'100%', background:'#fafafa', border:'1px solid #e8e8e8', borderRadius:6, padding:'11px 13px', fontFamily:'Inter,sans-serif', fontSize:'.86rem', outline:'none' }}
              type="email" required autoFocus placeholder="admin@crunzofficial.com"
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={{ display:'block', fontSize:'.66rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'1.5px', opacity:.35, marginBottom:6 }}>Password</label>
            <input style={{ width:'100%', background:'#fafafa', border:'1px solid #e8e8e8', borderRadius:6, padding:'11px 13px', fontFamily:'Inter,sans-serif', fontSize:'.86rem', outline:'none' }}
              type="password" required placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {err && <div style={{ background:'#fee2e2', color:'#dc2626', fontSize:'.8rem', fontWeight:600, padding:'10px 13px', borderRadius:6, marginBottom:14 }}>{err}</div>}
          <button type="submit" disabled={loading}
            style={{ width:'100%', background:'#0a0a0a', color:'#fff', border:'none', fontFamily:'Inter,sans-serif', fontWeight:700, fontSize:'.9rem', padding:13, borderRadius:7, cursor:loading?'wait':'pointer', opacity:loading?.6:1 }}>
            {loading ? 'Signing in…' : 'Sign In to Admin'}
          </button>
        </form>
        <div style={{ marginTop:20, textAlign:'center' }}>
          <a href="/" style={{ fontSize:'.78rem', opacity:.4, textDecoration:'none', color:'#0a0a0a' }}>← Back to store</a>
        </div>
      </div>
    </div>
  );
}

/* ── Main Panel ──────────────────────────────────────────── */
export default function AdminPage() {
  const { user, loading, logout } = useAuth();
  const [active, setActive]       = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = (key) => { setActive(key); setSidebarOpen(false); };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#111', fontFamily:'Inter,sans-serif' }}>
      <div style={{ color:'#fff', opacity:.4 }}>Loading…</div>
    </div>
  );

  if (!user || !user.isAdmin) return <AdminLogin />;

  return (
    <div className="adm-layout">

      {/* Overlay — closes sidebar on mobile tap-outside */}
      <div className={`adm-overlay ${sidebarOpen ? 'adm-overlay-on' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* ── Sidebar ── */}
      <aside className={`adm-sidebar ${sidebarOpen ? 'adm-open' : ''}`}>
        <div className="adm-logo-wrap">
          <span className="adm-logo-name">CRUNZ</span>
          <span className="adm-logo-sub">Admin Panel</span>
        </div>

        <nav className="adm-nav">
          {NAV.map(item => (
            <button
              key={item.key}
              className={`adm-nav-btn ${active === item.key ? 'adm-active' : ''}`}
              onClick={() => navigate(item.key)}
            >
              <span className="adm-nav-ico">{item.ico}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="adm-bottom">
          <div className="adm-username">{user.name}</div>
          <button className="adm-signout" onClick={() => logout()}>Sign Out</button>
        </div>
      </aside>

      {/* ── Content ── */}
      <main className="adm-main">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28, paddingBottom:20, borderBottom:'1px solid #e0e0e0', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {/* Hamburger — visible on mobile only */}
            <button className="adm-hbg" onClick={() => setSidebarOpen(o => !o)} aria-label="Menu">☰</button>
            <h1 style={{ fontSize:'1.4rem', fontWeight:900, letterSpacing:'-1px', color:'#0a0a0a', margin:0 }}>
              {NAV.find(n => n.key === active)?.ico} {NAV.find(n => n.key === active)?.label}
            </h1>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fff', border:'1px solid #e8e8e8', borderRadius:8, padding:'8px 14px', fontSize:'.82rem', fontWeight:600, flexShrink:0 }}>
            <span>👤</span>
            <span style={{ maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name}</span>
            <span style={{ opacity:.3 }}>·</span>
            <span style={{ color:'#16a34a', fontWeight:700, fontSize:'.75rem' }}>Admin</span>
          </div>
        </div>

        {active === 'dashboard'    && <Dashboard />}
        {active === 'products'     && <ProductsAdmin />}
        {active === 'orders'       && <OrdersAdmin />}
        {active === 'transactions' && <TransactionsAdmin />}
        {active === 'content'      && <ContentAdmin />}
        {active === 'users'        && <UsersAdmin />}
      </main>
    </div>
  );
}
