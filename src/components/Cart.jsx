'use client';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/currency';

export default function Cart() {
  const { cart, currency, cartOpen, setCartOpen, setCheckoutOpen, removeFromCart, changeQty, total, itemCount } = useCart();

  const handleCheckout = () => {
    setCartOpen(false);
    setTimeout(() => setCheckoutOpen(true), 200);
  };

  return (
    <>
      <div className={`c-ov ${cartOpen ? 'open' : ''}`} onClick={() => setCartOpen(false)} />
      <div className={`c-pan ${cartOpen ? 'open' : ''}`}>
        <div className="c-hd">
          <div className="c-ttl">Your Cart ({itemCount})</div>
          <button className="c-x" onClick={() => setCartOpen(false)}>✕</button>
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
                  <img className="c-itm-img" src={item.image || '/images/spanish-tomato.jpg'} alt={item.name} />
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
          <div className="c-tot-row">
            <div className="c-tot-lbl">Total</div>
            <div className="c-tot-p">{formatPrice(total, currency)}</div>
          </div>
          <button className="c-ck" disabled={cart.length === 0} onClick={handleCheckout}>
            Checkout →
          </button>
        </div>
      </div>
    </>
  );
}
