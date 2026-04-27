'use client';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '@/context/CartContext';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { useAnalytics } from '@/context/AnalyticsContext';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

function getDelivery(total, currency, content) {
  const threshold = parseFloat(
    currency === 'INR' ? content.free_delivery_threshold_inr : content.free_delivery_threshold_gbp
  ) || (currency === 'INR' ? 500 : 25);
  const charge = parseFloat(
    currency === 'INR' ? content.delivery_charge_inr : content.delivery_charge_gbp
  ) || (currency === 'INR' ? 99 : 3.99);
  return { charge: total >= threshold ? 0 : charge, isFree: total >= threshold };
}

// ── Stripe inner form ────────────────────────────────────────────────
function StripeForm({ grandTotal, currency, clientSecret, orderId, paymentIntentId, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const { clearCart } = useCart();
  const { track } = useAnalytics();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState('');

  const handlePay = async () => {
    if (!stripe || !elements || !ready) return;
    setLoading(true); setErr('');
    track('payment_start', { amount: grandTotal, currency });
    try {
      const { error: confirmErr, paymentIntent: pi } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: 'if_required',
      });
      if (confirmErr) {
        track('payment_failed', { reason: confirmErr.message, currency });
        setErr(confirmErr.message); setLoading(false); return;
      }

      const resolvedPid = pi?.id || paymentIntentId;
      console.log('[Checkout] Payment confirmed, intent:', resolvedPid, 'order:', orderId);

      const confirmRes = await api.post('/payment/confirm-order', {
        paymentIntentId: resolvedPid,
        orderId,
      });
      console.log('[Checkout] Confirm result:', confirmRes);

      track('payment_success', { amount: grandTotal, currency, orderId });
      clearCart();
      onSuccess();
    } catch (e) {
      setErr(e.message || 'Payment failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <PaymentElement
        onReady={() => setReady(true)}
        options={{ layout: { type: 'accordion', defaultCollapsed: false, radios: false, spacedAccordionItems: false } }}
      />
      {err && <div className="form-err" style={{ marginTop: 10 }}>{err}</div>}
      <button
        className="sub-btn"
        onClick={handlePay}
        disabled={loading || !stripe || !ready}
        style={{ marginTop: 16 }}
      >
        {!ready ? 'Loading...' : loading ? 'Processing...' : `Pay ${formatPrice(grandTotal, currency)}`}
      </button>
    </div>
  );
}

// ── Main checkout modal ──────────────────────────────────────────────
export default function CheckoutModal({ content = {} }) {
  const { checkoutOpen, setCheckoutOpen, cart, currency, total, clearCart } = useCart();
  const { charge, isFree } = getDelivery(total, currency, content);

  const defaultCountry = currency === 'INR' ? 'India' : 'United Kingdom';
  const [form, setForm] = useState({ name: '', email: '', phone: '', street: '', city: '', postcode: '', country: defaultCountry, notes: '' });
  const [err, setErr]           = useState('');
  const [done, setDone]         = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [orderId, setOrderId]   = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [loading, setLoading]   = useState(false);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon]           = useState(null);   // { code, discountAmount, discountType, discountValue, description }
  const [couponErr, setCouponErr]     = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const subtotal    = total + charge;
  const discount    = coupon?.discountAmount || 0;
  const grandTotal  = Math.max(0, subtotal - discount);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const close = () => {
    setCheckoutOpen(false);
    setTimeout(() => {
      setDone(false); setErr(''); setClientSecret(null);
      setOrderId(null); setPaymentIntentId(null);
      setCoupon(null); setCouponInput(''); setCouponErr('');
    }, 400);
  };

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true); setCouponErr(''); setCoupon(null);
    try {
      const res = await api.post('/coupons/validate', {
        code: couponInput.trim(),
        subtotal,
        currency,
      });
      setCoupon(res);
    } catch (e) {
      setCouponErr(e.message || 'Invalid coupon');
    } finally { setCouponLoading(false); }
  };

  const removeCoupon = () => { setCoupon(null); setCouponInput(''); setCouponErr(''); };

  const validate = () => {
    if (!form.name.trim())     { setErr('Please enter your name'); return false; }
    if (!form.email.trim())    { setErr('Please enter your email'); return false; }
    if (!form.phone.trim())    { setErr('Please enter your phone number'); return false; }
    if (!form.street.trim())   { setErr('Please enter your street address'); return false; }
    if (!form.postcode.trim()) { setErr('Please enter your postcode'); return false; }
    setErr(''); return true;
  };

  const handleProceed = async () => {
    if (!validate()) return;
    setLoading(true); setErr('');
    try {
      const baseGBP = cart.reduce((s, i) => s + i.priceGBP * i.qty, 0) + (currency === 'GBP' ? charge : 0);
      const baseINR = cart.reduce((s, i) => s + i.priceINR * i.qty, 0) + (currency === 'INR' ? charge : 0);

      // Apply discount to the active currency total
      const discountAmt = coupon?.discountAmount || 0;
      const totalGBP = currency === 'GBP' ? Math.max(0, baseGBP - discountAmt) : baseGBP;
      const totalINR = currency === 'INR' ? Math.max(0, baseINR - discountAmt) : baseINR;

      const orderData = {
        items: cart.map(i => ({ product: i._id, name: i.name, image: i.image, priceGBP: i.priceGBP, priceINR: i.priceINR, qty: i.qty })),
        shippingAddress: { name: form.name, email: form.email, phone: form.phone, street: form.street, city: form.city, postcode: form.postcode, country: form.country },
        currency, deliveryCharge: charge, notes: form.notes,
        totalGBP, totalINR,
        discountAmount: discountAmt,
      };

      const { clientSecret: cs, orderId: oid, paymentIntentId: pid } = await api.post('/payment/create-intent', {
        amountGBP: totalGBP,
        amountINR: totalINR,
        currency,
        orderData,
        couponCode: coupon?.code || '',
      });

      setClientSecret(cs);
      setOrderId(oid);
      setPaymentIntentId(pid);
    } catch (e) {
      setErr(e.message || 'Could not initiate payment. Please try again.');
    } finally { setLoading(false); }
  };

  if (!checkoutOpen) return null;

  return (
    <div className="co-ov open" onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <div className="co-box">
        <div className="co-hd">
          <div>
            <div className="co-step-label">{done ? '' : clientSecret ? 'Step 2 of 2' : 'Step 1 of 2'}</div>
            <div className="co-title">
              {done ? 'Order Confirmed!' : clientSecret ? 'Complete Payment' : 'Delivery Details'}
            </div>
          </div>
          <button className="co-close" onClick={close}>✕</button>
        </div>

        <div className="co-body">
          {done ? (
            <div className="success-box">
              <div className="success-ico">🎉</div>
              <div className="success-ttl">Payment Successful!</div>
              <p className="success-sub">Your order is confirmed. Check your email for details.</p>
              <button className="sub-btn" style={{ marginTop: 24 }} onClick={close}>Continue Shopping</button>
            </div>

          ) : clientSecret ? (
            <>
              <button className="am-resend" style={{ marginBottom: 16 }}
                onClick={() => { setClientSecret(null); setOrderId(null); setPaymentIntentId(null); }}>
                ← Back to delivery details
              </button>
              {/* Compact order summary */}
              <div className="co-summary-compact">
                {cart.map(item => {
                  const price = currency === 'INR' ? item.priceINR : item.priceGBP;
                  return (
                    <div key={item._id} className="co-summary-row">
                      <span>{item.name} <span style={{ opacity: .4 }}>× {item.qty}</span></span>
                      <span>{formatPrice(price * item.qty, currency)}</span>
                    </div>
                  );
                })}
                <div className="co-summary-row" style={{ opacity: .55, fontSize: '.8rem' }}>
                  <span>Delivery</span>
                  <span>{isFree ? 'FREE' : formatPrice(charge, currency)}</span>
                </div>
                {coupon && (
                  <div className="co-summary-row" style={{ color: '#16a34a', fontWeight: 700, fontSize: '.8rem' }}>
                    <span>Coupon ({coupon.code})</span>
                    <span>−{formatPrice(discount, currency)}</span>
                  </div>
                )}
                <div className="co-summary-row co-summary-total">
                  <span>Total</span>
                  <span>{formatPrice(grandTotal, currency)}</span>
                </div>
              </div>
              <Elements stripe={stripePromise} options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: { colorPrimary: '#0a0a0a', borderRadius: '6px' },
                },
              }}>
                <StripeForm
                  grandTotal={grandTotal}
                  currency={currency}
                  clientSecret={clientSecret}
                  orderId={orderId}
                  paymentIntentId={paymentIntentId}
                  onSuccess={() => setDone(true)}
                />
              </Elements>
            </>

          ) : (
            <>
              {/* Order summary */}
              <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
                <div style={{ fontSize: '.65rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', opacity: .35, marginBottom: 10 }}>Your Order</div>
                {cart.map(item => {
                  const price = currency === 'INR' ? item.priceINR : item.priceGBP;
                  return (
                    <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem', marginBottom: 6 }}>
                      <span>{item.name} <span style={{ opacity: .4 }}>× {item.qty}</span></span>
                      <span style={{ fontWeight: 600 }}>{formatPrice(price * item.qty, currency)}</span>
                    </div>
                  );
                })}
                <div style={{ borderTop: '1px solid #eee', marginTop: 8, paddingTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', opacity: .6, marginBottom: 4 }}>
                    <span>Subtotal</span><span>{formatPrice(total, currency)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', marginBottom: 8, color: isFree ? '#16a34a' : undefined }}>
                    <span style={{ opacity: isFree ? 1 : .6 }}>Delivery</span>
                    <span style={{ fontWeight: isFree ? 700 : 400, opacity: isFree ? 1 : .6 }}>{isFree ? 'FREE' : formatPrice(charge, currency)}</span>
                  </div>
                  {coupon && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', color: '#16a34a', fontWeight: 700, marginBottom: 4 }}>
                      <span>Coupon ({coupon.code})</span>
                      <span>−{formatPrice(discount, currency)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1rem' }}>
                    <span>Total</span><span>{formatPrice(grandTotal, currency)}</span>
                  </div>
                </div>
              </div>

              {/* Coupon input */}
              <div style={{ marginBottom: 18 }}>
                {coupon ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px' }}>
                    <span style={{ fontSize: '.85rem', fontWeight: 700, color: '#16a34a', flex: 1 }}>
                      ✓ {coupon.code} — {coupon.discountType === 'percentage' ? `${coupon.discountValue}% off` : `${formatPrice(coupon.discountValue, currency)} off`}
                      {coupon.description ? ` · ${coupon.description}` : ''}
                    </span>
                    <button onClick={removeCoupon} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.75rem', color: '#16a34a', fontWeight: 700, opacity: .7 }}>Remove</button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        style={{ flex: 1, background: '#fafafa', border: '1px solid #e8e8e8', borderRadius: 7, padding: '10px 13px', fontFamily: 'Inter,sans-serif', fontSize: '.84rem', outline: 'none', textTransform: 'uppercase', letterSpacing: 1 }}
                        placeholder="Coupon code"
                        value={couponInput}
                        onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponErr(''); }}
                        onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                      />
                      <button
                        onClick={applyCoupon}
                        disabled={couponLoading || !couponInput.trim()}
                        style={{ background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 7, padding: '10px 18px', fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: '.82rem', cursor: couponLoading ? 'wait' : 'pointer', opacity: !couponInput.trim() ? .4 : 1 }}>
                        {couponLoading ? '…' : 'Apply'}
                      </button>
                    </div>
                    {couponErr && <div style={{ fontSize: '.76rem', color: '#dc2626', marginTop: 6, fontWeight: 600 }}>{couponErr}</div>}
                  </div>
                )}
              </div>

              {/* Address form */}
              <div className="fr">
                <div className="fg">
                  <label className="fl">Full Name *</label>
                  <input className="fi" placeholder="Your full name" value={form.name} onChange={set('name')} />
                </div>
                <div className="fg">
                  <label className="fl">Email *</label>
                  <input className="fi" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
                </div>
              </div>
              <div className="fg">
                <label className="fl">Phone Number *</label>
                <input className="fi" placeholder="+44 7xxx..." value={form.phone} onChange={set('phone')} />
              </div>
              <div className="fg">
                <label className="fl">Street Address *</label>
                <input className="fi" placeholder="House number and street" value={form.street} onChange={set('street')} />
              </div>
              <div className="fr">
                <div className="fg">
                  <label className="fl">City</label>
                  <input className="fi" placeholder="City" value={form.city} onChange={set('city')} />
                </div>
                <div className="fg">
                  <label className="fl">Postcode *</label>
                  <input className="fi" placeholder="PR1 1AA" value={form.postcode} onChange={set('postcode')} />
                </div>
              </div>
              <div className="fg">
                <label className="fl">Country *</label>
                <select className="fi" value={form.country} onChange={set('country')} style={{ cursor: 'pointer' }}>
                  <option value="United Kingdom">🇬🇧 United Kingdom</option>
                  <option value="India">🇮🇳 India</option>
                </select>
              </div>
              <div className="fg">
                <label className="fl">Notes (optional)</label>
                <input className="fi" placeholder="Any special instructions..." value={form.notes} onChange={set('notes')} />
              </div>

              {err && <div className="form-err">{err}</div>}

              <button className="sub-btn" onClick={handleProceed} disabled={cart.length === 0 || loading} style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="1" y="4" width="22" height="16" rx="3" stroke="currentColor" strokeWidth="2"/>
                  <path d="M1 10h22" stroke="currentColor" strokeWidth="2"/>
                </svg>
                {loading ? 'Loading...' : `Continue to Payment · ${formatPrice(grandTotal, currency)}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
