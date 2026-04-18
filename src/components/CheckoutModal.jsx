'use client';
import { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/currency';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// ─── Step indicators ───────────────────────────────────────────────
function Steps({ current, total }) {
  return (
    <div className="co-steps">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`co-step ${i < current ? 'done' : i === current ? 'active' : ''}`} />
      ))}
    </div>
  );
}

// ─── Auth Step ─────────────────────────────────────────────────────
function AuthStep({ onDone }) {
  const { login } = useAuth();
  const [tab, setTab] = useState('signin');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [userId, setUserId] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleOtpChange = (val, idx) => {
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleRegister = async () => {
    setErr(''); setLoading(true);
    try {
      const d = await api.post('/auth/register', form);
      setUserId(d.userId);
      setOtpMode(true);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    setErr(''); setLoading(true);
    try {
      const d = await api.post('/auth/verify-otp', { userId, otp: otp.join('') });
      login(d.token, d.user);
      onDone(d.user);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setErr('');
    try { await api.post('/auth/resend-otp', { userId }); setErr('OTP resent!'); } catch (e) { setErr(e.message); }
  };

  const handleLogin = async () => {
    setErr(''); setLoading(true);
    try {
      const d = await api.post('/auth/login', { email: form.email, password: form.password });
      login(d.token, d.user);
      onDone(d.user);
    } catch (e) {
      if (e.message.includes('verify')) { setUserId(e.userId); setOtpMode(true); }
      else setErr(e.message);
    }
    setLoading(false);
  };

  const handleGoogle = useGoogleLogin({
    onSuccess: async (cred) => {
      setErr(''); setLoading(true);
      try {
        const d = await api.post('/auth/google', { credential: cred.credential });
        login(d.token, d.user);
        onDone(d.user);
      } catch (e) { setErr(e.message); }
      setLoading(false);
    },
    flow: 'implicit'
  });

  if (otpMode) {
    return (
      <div>
        <p style={{ fontSize: '.87rem', opacity: .55, marginBottom: 8, lineHeight: 1.6 }}>
          Enter the 6-digit code sent to <strong>{form.email}</strong>
        </p>
        <div className="otp-inputs">
          {otp.map((v, i) => (
            <input
              key={i} id={`otp-${i}`} className="otp-input"
              value={v} maxLength={1} type="text" inputMode="numeric"
              onChange={e => handleOtpChange(e.target.value, i)}
              onKeyDown={e => { if (e.key === 'Backspace' && !v && i > 0) document.getElementById(`otp-${i - 1}`)?.focus(); }}
            />
          ))}
        </div>
        {err && <div className={`form-err ${err === 'OTP resent!' ? '' : ''}`} style={err === 'OTP resent!' ? { color: '#16a34a' } : {}}>{err}</div>}
        <button className="sub-btn" onClick={handleVerifyOtp} disabled={loading || otp.join('').length < 6}>
          {loading ? 'Verifying…' : 'Verify & Continue'}
        </button>
        <button onClick={handleResendOtp} style={{ marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', fontSize: '.8rem', opacity: .5, width: '100%', textDecoration: 'underline' }}>
          Resend OTP
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Google */}
      <button className="g-btn" onClick={handleGoogle} disabled={loading}>
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        Continue with Google
      </button>
      <div className="divider-or">or</div>

      {/* Tabs */}
      <div className="auth-tabs">
        <button className={`auth-tab ${tab === 'signin' ? 'active' : ''}`} onClick={() => setTab('signin')}>Sign In</button>
        <button className={`auth-tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => setTab('signup')}>Sign Up</button>
      </div>

      {tab === 'signup' && (
        <div className="fg">
          <label className="fl">Full Name</label>
          <input className="fi" placeholder="Your full name" value={form.name} onChange={set('name')} />
        </div>
      )}
      <div className="fg">
        <label className="fl">Email</label>
        <input className="fi" type="email" placeholder="you@email.com" value={form.email} onChange={set('email')} />
      </div>
      <div className="fg">
        <label className="fl">Password</label>
        <input className="fi" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} />
      </div>
      {err && <div className="form-err">{err}</div>}
      <button className="sub-btn" disabled={loading} onClick={tab === 'signin' ? handleLogin : handleRegister}>
        {loading ? '…' : tab === 'signin' ? 'Sign In & Continue' : 'Create Account'}
      </button>
    </div>
  );
}

// ─── Address Step ──────────────────────────────────────────────────
function AddressStep({ user, onDone }) {
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(!user?.addresses?.length);
  const [saveAddr, setSaveAddr] = useState(true);
  const [form, setForm] = useState({ name: user?.name || '', phone: '', street: '', city: '', postcode: '', country: 'United Kingdom' });
  const [err, setErr] = useState('');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleContinue = () => {
    const addr = selected !== null ? user.addresses[selected] : form;
    if (!addr.name || !addr.street || !addr.postcode) { setErr('Please fill name, street and postcode'); return; }
    onDone({ address: addr, saveAddress: selected === null && saveAddr });
  };

  return (
    <div>
      {user?.addresses?.length > 0 && (
        <>
          <p className="fl" style={{ marginBottom: 12 }}>Saved Addresses</p>
          {user.addresses.map((a, i) => (
            <div key={i} className={`addr-card ${selected === i ? 'selected' : ''}`} onClick={() => { setSelected(i); setShowNew(false); }}>
              <div className="addr-card-lbl">{a.label || 'Address'}</div>
              <div className="addr-card-val">{a.name} · {a.street}, {a.city} {a.postcode}</div>
            </div>
          ))}
          <button onClick={() => { setSelected(null); setShowNew(true); }} style={{ marginBottom: 16, marginTop: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: '.82rem', fontWeight: 600, textDecoration: 'underline', opacity: .6 }}>
            + Use a different address
          </button>
        </>
      )}

      {showNew && (
        <>
          <div className="fg">
            <label className="fl">Full Name *</label>
            <input className="fi" value={form.name} onChange={set('name')} placeholder="Recipient name" />
          </div>
          <div className="fr">
            <div className="fg">
              <label className="fl">Phone</label>
              <input className="fi" value={form.phone} onChange={set('phone')} placeholder="+44 7xxx..." />
            </div>
            <div className="fg">
              <label className="fl">Postcode *</label>
              <input className="fi" value={form.postcode} onChange={set('postcode')} placeholder="PR1 1AA" />
            </div>
          </div>
          <div className="fg">
            <label className="fl">Street Address *</label>
            <input className="fi" value={form.street} onChange={set('street')} placeholder="Street and house number" />
          </div>
          <div className="fr">
            <div className="fg">
              <label className="fl">City</label>
              <input className="fi" value={form.city} onChange={set('city')} placeholder="City" />
            </div>
            <div className="fg">
              <label className="fl">Country</label>
              <input className="fi" value={form.country} onChange={set('country')} placeholder="United Kingdom" />
            </div>
          </div>
          <label className="save-addr-row">
            <input type="checkbox" checked={saveAddr} onChange={e => setSaveAddr(e.target.checked)} />
            Save this address for future orders
          </label>
        </>
      )}

      {err && <div className="form-err">{err}</div>}
      <button className="sub-btn" style={{ marginTop: 16 }} onClick={handleContinue}>
        Continue to Payment →
      </button>
    </div>
  );
}

// ─── Payment Step ──────────────────────────────────────────────────
function PaymentStep({ cart, currency, total, address, saveAddress, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setErr(''); setLoading(true);

    try {
      const amountGBP = cart.reduce((s, i) => s + i.priceGBP * i.qty, 0);
      const amountINR = cart.reduce((s, i) => s + i.priceINR * i.qty, 0);

      const { clientSecret } = await api.post('/payment/create-intent', { amountGBP, amountINR, currency });

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: { name: address.name, address: { line1: address.street, city: address.city, postal_code: address.postcode, country: address.country === 'India' ? 'IN' : 'GB' } }
        }
      });

      if (result.error) { setErr(result.error.message); setLoading(false); return; }

      const items = cart.map(i => ({ product: i._id, name: i.name, image: i.image, priceGBP: i.priceGBP, priceINR: i.priceINR, qty: i.qty }));
      await api.post('/orders', {
        items, shippingAddress: address, currency,
        stripePaymentIntentId: result.paymentIntent.id,
        saveAddress
      });

      clearCart();
      onSuccess();
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 16, background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 8, padding: '12px 14px' }}>
        <div style={{ fontSize: '.65rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', opacity: .35, marginBottom: 8 }}>Order Total</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: -1 }}>{formatPrice(total, currency)}</div>
        <div style={{ fontSize: '.72rem', opacity: .4, marginTop: 2 }}>
          {cart.length} item{cart.length !== 1 ? 's' : ''} · {address.street}, {address.postcode}
        </div>
      </div>

      <div className="fg">
        <label className="fl">Card Details</label>
        <div className="stripe-wrap">
          <CardElement options={{ style: { base: { fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#0a0a0a', '::placeholder': { color: '#aaa' } } } }} />
        </div>
      </div>

      {err && <div className="form-err">{err}</div>}
      <button className={`sub-btn ${loading ? 'loading' : ''}`} onClick={handlePay} disabled={loading || !stripe}>
        {loading ? 'Processing payment…' : `Pay ${formatPrice(total, currency)}`}
      </button>
      <p style={{ fontSize: '.72rem', opacity: .35, textAlign: 'center', marginTop: 10 }}>
        🔒 Secured by Stripe · Your card details are never stored
      </p>
    </div>
  );
}

// ─── Main CheckoutModal ────────────────────────────────────────────
export default function CheckoutModal() {
  const { checkoutOpen, setCheckoutOpen, cart, currency, total } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState(0); // 0=auth, 1=address, 2=payment, 3=success
  const [authUser, setAuthUser] = useState(null);
  const [addrData, setAddrData] = useState(null);

  const activeUser = user || authUser;

  useEffect(() => {
    if (checkoutOpen) {
      setStep(user ? 1 : 0);
      setAuthUser(null);
      setAddrData(null);
    }
  }, [checkoutOpen, user]);

  const close = () => setCheckoutOpen(false);

  const stepLabels = activeUser
    ? ['Address', 'Payment', 'Done']
    : ['Account', 'Address', 'Payment', 'Done'];

  const stepIdx = activeUser ? step - 1 : step;
  const currentLabel = stepLabels[Math.max(0, stepIdx)] || '';

  return (
    <div className={`co-ov ${checkoutOpen ? 'open' : ''}`} onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <div className="co-box">
        <div className="co-hd">
          <div>
            <div className="co-step-label">{stepLabels.length > 1 ? `Step ${Math.max(1, stepIdx + 1)} of ${step === 3 || (activeUser && step === 3) ? stepLabels.length : stepLabels.length}` : ''}</div>
            <div className="co-title">
              {step === 0 && 'Sign in to continue'}
              {step === 1 && 'Delivery Address'}
              {step === 2 && 'Payment'}
              {step === 3 && 'Order Confirmed!'}
            </div>
          </div>
          <button className="co-close" onClick={close}>✕</button>
        </div>
        <div className="co-body">
          <Steps current={stepIdx} total={activeUser ? 3 : 4} />

          {step === 0 && (
            <AuthStep onDone={u => { setAuthUser(u); setStep(1); }} />
          )}

          {step === 1 && (
            <AddressStep
              user={activeUser}
              onDone={({ address, saveAddress }) => { setAddrData({ address, saveAddress }); setStep(2); }}
            />
          )}

          {step === 2 && addrData && (
            <Elements stripe={stripePromise}>
              <PaymentStep
                cart={cart}
                currency={currency}
                total={total}
                address={addrData.address}
                saveAddress={addrData.saveAddress}
                onSuccess={() => setStep(3)}
              />
            </Elements>
          )}

          {step === 3 && (
            <div className="success-box">
              <div className="success-ico">🎉</div>
              <div className="success-ttl">Order Confirmed!</div>
              <p className="success-sub">
                Thank you for your order! A confirmation email has been sent to your inbox. We'll get your Crunz chips ready right away.
              </p>
              <button className="sub-btn" style={{ marginTop: 24 }} onClick={close}>
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
