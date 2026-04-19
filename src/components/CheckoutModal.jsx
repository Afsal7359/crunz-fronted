'use client';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/currency';

const WA_NUMBER = '447741940700'; // fallback, overridden by content

export default function CheckoutModal({ content = {} }) {
  const { checkoutOpen, setCheckoutOpen, cart, currency, total, clearCart } = useCart();

  const [form, setForm] = useState({ name: '', phone: '', street: '', city: '', postcode: '', country: 'United Kingdom', notes: '' });
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const close = () => {
    setCheckoutOpen(false);
    setTimeout(() => { setDone(false); setErr(''); }, 400);
  };

  const handleWhatsApp = () => {
    if (!form.name.trim()) { setErr('Please enter your name'); return; }
    if (!form.phone.trim()) { setErr('Please enter your phone number'); return; }
    if (!form.street.trim()) { setErr('Please enter your street address'); return; }
    if (!form.postcode.trim()) { setErr('Please enter your postcode'); return; }
    setErr('');

    // Build order summary
    const sym = currency === 'INR' ? '₹' : '£';
    const itemLines = cart.map(i => {
      const price = currency === 'INR' ? i.priceINR : i.priceGBP;
      return `• ${i.name} × ${i.qty} = ${formatPrice(price * i.qty, currency)}`;
    }).join('\n');

    const address = [form.street, form.city, form.postcode, form.country].filter(Boolean).join(', ');

    const msg = [
      '🍌 *New Order — CRUNZ*',
      '',
      '*Order Items:*',
      itemLines,
      '',
      `*Total: ${formatPrice(total, currency)}*`,
      '',
      '*Delivery Details:*',
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      `Address: ${address}`,
      form.notes ? `Notes: ${form.notes}` : '',
    ].filter(l => l !== undefined).join('\n');

    const waNum = (content.whatsapp || WA_NUMBER).replace(/\D/g, '');
    const waUrl = `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`;

    clearCart();
    setDone(true);
    window.open(waUrl, '_blank');
  };

  if (!checkoutOpen) return null;

  return (
    <div className="co-ov open" onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <div className="co-box">
        <div className="co-hd">
          <div>
            <div className="co-step-label">{done ? '' : 'Delivery Details'}</div>
            <div className="co-title">{done ? 'Redirecting to WhatsApp!' : 'Place Your Order'}</div>
          </div>
          <button className="co-close" onClick={close}>✕</button>
        </div>

        <div className="co-body">
          {done ? (
            /* ── Success ── */
            <div className="success-box">
              <div className="success-ico">🎉</div>
              <div className="success-ttl">Order Sent!</div>
              <p className="success-sub">
                Your order details have been sent to WhatsApp. We'll confirm your order and arrange delivery shortly.
              </p>
              <button className="sub-btn" style={{ marginTop: 24 }} onClick={close}>
                Continue Shopping
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <div>
              {/* Order summary */}
              <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
                <div style={{ fontSize: '.65rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', opacity: .35, marginBottom: 10 }}>Your Order</div>
                {cart.map(item => {
                  const price = currency === 'INR' ? item.priceINR : item.priceGBP;
                  return (
                    <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem', marginBottom: 6 }}>
                      <span>{item.name} <span style={{ opacity: .4 }}>× {item.qty}</span></span>
                      <span style={{ fontWeight: 700 }}>{formatPrice(price * item.qty, currency)}</span>
                    </div>
                  );
                })}
                <div style={{ borderTop: '1px solid #eee', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1rem' }}>
                  <span>Total</span>
                  <span>{formatPrice(total, currency)}</span>
                </div>
              </div>

              {/* Contact */}
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

              {/* Address */}
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

              <button className="sub-btn" style={{ marginTop: 8, background: '#25D366', borderColor: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }} onClick={handleWhatsApp} disabled={cart.length === 0}>
                <svg width="20" height="20" viewBox="0 0 32 32" fill="none"><path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.67 4.61 1.832 6.5L4 29l7.7-1.8A12.94 12.94 0 0016 28c6.627 0 12-5.373 12-12S22.627 3 16 3z" fill="#fff"/><path d="M21.5 18.5c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51H11.6c-.2 0-.52.07-.79.37-.27.3-1.03 1.01-1.03 2.46s1.06 2.86 1.2 3.06c.15.2 2.08 3.17 5.04 4.45.7.3 1.25.48 1.68.62.7.22 1.34.19 1.84.11.56-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.12-.27-.2-.57-.35z" fill="#25D366"/></svg>
                Order via WhatsApp
              </button>
              <p style={{ fontSize: '.72rem', opacity: .4, textAlign: 'center', marginTop: 10 }}>
                Your order details will be sent to our WhatsApp. We'll confirm and arrange delivery.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
