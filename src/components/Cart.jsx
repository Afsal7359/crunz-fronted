'use client';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/currency';
import { fixImageUrl } from '@/lib/api';
import { useAnalytics } from '@/context/AnalyticsContext';

function getDelivery(total, currency, content) {
  const threshold = parseFloat(
    currency === 'INR' ? content.free_delivery_threshold_inr : content.free_delivery_threshold_gbp
  ) || (currency === 'INR' ? 500 : 25);
  const charge = parseFloat(
    currency === 'INR' ? content.delivery_charge_inr : content.delivery_charge_gbp
  ) || (currency === 'INR' ? 99 : 3.99);
  const isFree = total >= threshold;
  return { charge: isFree ? 0 : charge, threshold, isFree };
}

export default function Cart({ content = {} }) {
  const { cart, currency, setCurrency, cartOpen, setCartOpen, setCheckoutOpen, removeFromCart, changeQty, total, itemCount } = useCart();
  const { charge, threshold, isFree } = getDelivery(total, currency, content);
  const grandTotal = total + charge;
  const { track } = useAnalytics();

  const handleCheckout = () => {
    track('checkout_start', { itemCount, total: grandTotal, currency });
    setCartOpen(false);
    setTimeout(() => setCheckoutOpen(true), 200);
  };

  return (
    <>
      <div className={`c-ov ${cartOpen ? 'open' : ''}`} onClick={() => setCartOpen(false)} />
      <div className={`c-pan ${cartOpen ? 'open' : ''}`}>
        <div className="c-hd">
          <div className="c-ttl">Your Cart ({itemCount})</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="c-cur-toggle">
              <button className={currency === 'GBP' ? 'active' : ''} onClick={() => setCurrency('GBP')}>£ GBP</button>
              <button className={currency === 'INR' ? 'active' : ''} onClick={() => setCurrency('INR')}>₹ INR</button>
            </div>
            <button className="c-x" onClick={() => setCartOpen(false)}>✕</button>
          </div>
        </div>

        <div className="c-body">
          {cart.length === 0 ? (
            <div className="c-empty">
              <div className="c-empty-ico">🛒</div>
              <div className="c-empty-ttl">Your cart is empty</div>
              <div className="c-empty-sub">Add some delicious chips to get started</div>
            </div>
          ) : (
            cart.map(item => {
              const price = currency === 'INR' ? item.priceINR : item.priceGBP;
              return (
                <div key={item._id} className="c-itm">
                  <img className="c-itm-img" src={fixImageUrl(item.image) || '/images/spanish-tomato.jpg'} alt={item.name} />
                  <div className="c-itm-info">
                    <div className="c-itm-name">{item.name}</div>
                    <div className="c-itm-sub">Banana Chips · {formatPrice(price, currency)}</div>
                    <div className="c-ctrl">
                      <button className="c-q" onClick={() => changeQty(item._id, -1)}>−</button>
                      <span className="c-qn">{item.qty}</span>
                      <button className="c-q" onClick={() => changeQty(item._id, 1)}>+</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <div className="c-itm-p">{formatPrice(price * item.qty, currency)}</div>
                    <button className="c-rm" onClick={() => removeFromCart(item._id)}>✕</button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="c-ft">
          {cart.length > 0 && (
            <>
              {/* Free delivery progress */}
              {!isFree && (
                <div style={{ fontSize: '.75rem', opacity: .55, marginBottom: 10, textAlign: 'center', lineHeight: 1.5 }}>
                  Add <strong>{formatPrice(threshold - total, currency)}</strong> more for free delivery
                </div>
              )}
              {isFree && (
                <div style={{ fontSize: '.75rem', color: '#16a34a', fontWeight: 700, marginBottom: 10, textAlign: 'center' }}>
                  ✓ You qualify for free delivery!
                </div>
              )}

              <div className="c-tot-row" style={{ marginBottom: 4 }}>
                <div className="c-tot-lbl" style={{ opacity: .6, fontSize: '.82rem' }}>Subtotal</div>
                <div className="c-tot-p" style={{ fontSize: '.9rem' }}>{formatPrice(total, currency)}</div>
              </div>
              <div className="c-tot-row" style={{ marginBottom: 10 }}>
                <div className="c-tot-lbl" style={{ opacity: .6, fontSize: '.82rem' }}>Delivery</div>
                <div className="c-tot-p" style={{ fontSize: '.9rem', color: isFree ? '#16a34a' : undefined }}>
                  {isFree ? 'FREE' : formatPrice(charge, currency)}
                </div>
              </div>
              <div className="c-tot-row" style={{ borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
                <div className="c-tot-lbl">Total</div>
                <div className="c-tot-p">{formatPrice(grandTotal, currency)}</div>
              </div>
            </>
          )}
          {cart.length === 0 && (
            <div className="c-tot-row">
              <div className="c-tot-lbl">Total</div>
              <div className="c-tot-p">{formatPrice(0, currency)}</div>
            </div>
          )}
          <button className="c-ck" disabled={cart.length === 0} onClick={handleCheckout}>
            Checkout →
          </button>
        </div>
      </div>
    </>
  );
}
