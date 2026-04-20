'use client';
import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

export default function AuthModal({ open, onClose, onSuccess }) {
  const { login } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const reset = () => {
    setTab('login'); setStep('form');
    setForm({ name: '', email: '', password: '' });
    setOtp(''); setUserId(null); setErr(''); setMsg(''); setLoading(false);
  };

  const close = () => { reset(); onClose(); };

  const switchTab = t => { setTab(t); setStep('form'); setErr(''); setMsg(''); };

  // ── Login ──────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!form.email.trim() || !form.password.trim()) { setErr('Email and password required'); return; }
    setLoading(true); setErr('');
    try {
      const data = await api.post('/auth/login', { email: form.email, password: form.password });
      login(data.token, data.user);
      reset();
      onSuccess?.();
      onClose();
    } catch (e) {
      if (e.message?.includes('verify')) {
        setErr('Email not verified. Register again to get a new code.');
      } else {
        setErr(e.message || 'Login failed');
      }
    } finally { setLoading(false); }
  };

  // ── Register → OTP ─────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setErr('All fields required'); return;
    }
    setLoading(true); setErr('');
    try {
      const data = await api.post('/auth/register', {
        name: form.name, email: form.email, password: form.password
      });
      setUserId(data.userId);
      setMsg(`Verification code sent to ${form.email}`);
      setStep('otp');
    } catch (e) {
      setErr(e.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  // ── Verify OTP ─────────────────────────────────────────────────────
  const handleOtp = async () => {
    if (otp.length !== 6) { setErr('Enter the 6-digit code'); return; }
    setLoading(true); setErr('');
    try {
      const data = await api.post('/auth/verify-otp', { userId, otp });
      login(data.token, data.user);
      reset();
      onSuccess?.();
      onClose();
    } catch (e) { setErr(e.message || 'Invalid code'); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    setErr(''); setMsg('');
    try {
      await api.post('/auth/resend-otp', { userId });
      setMsg('New code sent!');
    } catch (e) { setErr(e.message); }
  };

  // ── Google OAuth ───────────────────────────────────────────────────
  const handleGoogle = async (credentialResponse) => {
    setErr('');
    try {
      const data = await api.post('/auth/google', { credential: credentialResponse.credential });
      login(data.token, data.user);
      reset();
      onSuccess?.();
      onClose();
    } catch (e) { setErr(e.message || 'Google sign-in failed'); }
  };

  if (!open) return null;

  return (
    <div className="am-ov open" onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <div className="am-box">
        {/* Header */}
        <div className="am-hd">
          <div className="am-title">
            {step === 'otp' ? 'Verify Your Email' : 'Welcome to Crunz'}
          </div>
          <button className="am-x" onClick={close}>✕</button>
        </div>

        <div className="am-body">
          {step === 'otp' ? (
            /* ── OTP step ── */
            <>
              <p className="am-sub">
                We sent a 6-digit code to <strong>{form.email}</strong>
              </p>
              <div className="fg">
                <label className="fl">Verification Code</label>
                <input
                  className="fi am-otp-input"
                  placeholder="0 0 0 0 0 0"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && handleOtp()}
                  autoFocus
                />
              </div>
              {msg && <div className="form-ok">{msg}</div>}
              {err && <div className="form-err">{err}</div>}
              <button className="sub-btn" onClick={handleOtp} disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Continue →'}
              </button>
              <button className="am-resend" onClick={handleResend}>
                Didn't get it? Resend code
              </button>
            </>
          ) : (
            /* ── Form step ── */
            <>
              {/* Tabs */}
              <div className="am-tabs">
                <button className={`am-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => switchTab('login')}>Sign In</button>
                <button className={`am-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => switchTab('register')}>Create Account</button>
              </div>

              {tab === 'register' && (
                <div className="fg">
                  <label className="fl">Full Name</label>
                  <input className="fi" placeholder="Your name" value={form.name} onChange={set('name')} />
                </div>
              )}
              <div className="fg">
                <label className="fl">Email Address</label>
                <input className="fi" type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} />
              </div>
              <div className="fg" style={{ marginBottom: 4 }}>
                <label className="fl">Password</label>
                <input
                  className="fi"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set('password')}
                  onKeyDown={e => e.key === 'Enter' && (tab === 'login' ? handleLogin() : handleRegister())}
                />
              </div>

              {msg && <div className="form-ok" style={{ marginBottom: 10 }}>{msg}</div>}
              {err && <div className="form-err" style={{ marginBottom: 10 }}>{err}</div>}

              <button
                className="sub-btn"
                onClick={tab === 'login' ? handleLogin : handleRegister}
                disabled={loading}
              >
                {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
              </button>

              {tab === 'register' && (
                <p className="am-note">We'll send a verification code to your email.</p>
              )}

              {/* Google */}
              <div className="am-or"><span>or continue with</span></div>
              <div className="am-google">
                <GoogleLogin
                  onSuccess={handleGoogle}
                  onError={() => setErr('Google sign-in failed. Try again.')}
                  text={tab === 'login' ? 'signin_with' : 'signup_with'}
                  shape="rectangular"
                  theme="outline"
                  width="100%"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
