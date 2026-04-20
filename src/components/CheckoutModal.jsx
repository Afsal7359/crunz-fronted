'use client';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '@/context/CartContext';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/currency';

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
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setLoading(true); setErr('');
    try {
      const { error: submitErr } = await elements.submit();
      if (submitErr) { setErr(submitErr.message); setLoading(false); return; }

      const { error: confirmErr, paymentIntent: pi } = await stripe.confirmPayment({
        elements,
        clientSecret,
        redirect: 'if_required',
      });
      if (confirmErr) { setErr(confirmErr.message); setLoading(false); return; }

      // Immediately confirm with backend — marks order paid without needing webhook
      await api.post('/payment/confirm-order', {
        paymentIntentId: pi?.id || paymentIntentId,
        orderId,
      });

      clearCart();
      onSuccess();
    } catch (e) {
      setErr(e.message || 'Payment failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <PaymentElement options={{ layout: 'tabs' }} />
      {err && <div className="form-err" style={{ marginTop: 10 }}>{err}</div>}
      <button className="sub-btn" onClick={handlePay} disabled={loading || !stripe} style={{ marginTop: 16 }}>
        {loading ? 'Processing...' : `Pay ${formatPrice(grandTotal, currency)}`}
      </button>
    </div>
  );
}

// ── Main checkout modal ──────────────────────────────────────────────
export default function CheckoutModal({ content = {} }) {
  const { checkoutOpen, setCheckoutOpen, cart, currency, total, clearCart } = useCart();
  const { charge, isFree } = getDelivery(total, currency, content);
  const grandTotal = total + charge;

  const [form, setForm] = useState({ name: '', phone: '', street: '', city: '', postcode: '', country: 'United Kingdom', notes: '' });
  const [err, setErr]   = useState('');
  const [done, setDone] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const close = () => {
    setCheckoutOpen(false);
    setTimeout(() => { setDone(false); setErr(''); setClientSecret(null); setOrderId(null); setPaymentIntentId(null); }, 400);
  };

  const validate = () => {
    if (!form.name.trim())     { setErr('Please enter your name'); return false; }
    if (!form.phone.trim())    { setErr('Please enter your phone number'); return false; }
    if (!form.street.trim())   { setErr('Please enter your street address'); return false; }
    if (!form.postcode.trim()) { setErr('Please enter your postcode'); return false; }
    setErr(''); return true;
  };

  const handleProceed = async () => {
    if (!validate()) return;
    setLoading(true); setErr('');
    try {
      const totalGBP = cart.reduce((s, i) => s + i.priceGBP * i.qty, 0) + (currency === 'GBP' ? charge : 0);
      const totalINR = cart.reduce((s, i) => s + i.priceINR * i.qty, 0) + (currency === 'INR' ? charge : 0);

      const orderData = {
        items: cart.map(i => ({ product: i._id, name: i.name, image: i.image, priceGBP: i.priceGBP, priceINR: i.priceINR, qty: i.qty })),
        shippingAddress: { name: form.name, phone: form.phone, street: form.street, city: form.city, postcode: form.postcode, country: form.country },
        currency, deliveryCharge: charge, notes: form.notes,
        totalGBP, totalINR,
      };

      const { clientSecret: cs, orderId: oid, paymentIntentId: pid } = await api.post('/payment/create-intent', {
        amountGBP: totalGBP,
        amountINR: totalINR,
        currency,
        orderData,
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
                onClick={() => { setClientSecret(null); setOrderPayload(null); }}>
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
                <div className="co-summary-row co-summary-total">
                  <span>Total</span>
                  <span>{formatPrice(grandTotal, currency)}</span>
                </div>
              </div>
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1rem' }}>
                    <span>Total</span><span>{formatPrice(grandTotal, currency)}</span>
                  </div>
                </div>
              </div>

              {/* Address form */}
              <div className="fr">
                <div className="fg">
                  <label className="fl">Full Name *</label>
                  <input className="fi" placeholder="Your full name" value={form.name} onChange={set('name')} />
                </div>
                <div className="fg">
                  <label className="fl">Phone Number *</label>
                  <input className="fi" placeholder="+44 7xxx..." value={form.phone} onChange={set('phone')} />
                </div>
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
                <label className="fl">Country</label>
                <input className="fi" placeholder="United Kingdom" value={form.country} onChange={set('country')} />
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
