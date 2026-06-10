'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { detectCurrencyFromTimezone } from '@/lib/currency';
import { fixImageUrl } from '@/lib/api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [currency, setCurrency] = useState('GBP');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [toast, setToast] = useState(null); // { product, qty }
  const toastTimer = useRef(null);

  useEffect(() => {
    setCurrency(detectCurrencyFromTimezone());
    const saved = localStorage.getItem('crunz_cart');
    if (saved) {
      try { setCart(JSON.parse(saved)); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('crunz_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = useCallback((product, qty = 1) => {
    setCart(prev => {
      const ex = prev.find(i => i._id === product._id);
      if (ex) return prev.map(i => i._id === product._id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { ...product, qty }];
    });
    // Show toast
    setToast({ product, qty });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart(prev => prev.filter(i => i._id !== id));
  }, []);

  const changeQty = useCallback((id, delta) => {
    setCart(prev =>
      prev
        .map(i => i._id === id ? { ...i, qty: i.qty + delta } : i)
        .filter(i => i.qty > 0)
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const itemCount = cart.reduce((s, i) => s + i.qty, 0);

  const total = cart.reduce((s, i) => {
    const price = currency === 'INR' ? i.priceINR : i.priceGBP;
    return s + price * i.qty;
  }, 0);

  const dismissToast = useCallback(() => {
    setToast(null);
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  return (
    <CartContext.Provider value={{
      cart, currency, setCurrency, cartOpen, checkoutOpen,
      addToCart, removeFromCart, changeQty, clearCart,
      setCartOpen, setCheckoutOpen,
      itemCount, total,
    }}>
      {children}
      {/* Cart add toast — rendered here so it works on every page */}
      {toast && (
        <CartToast
          product={toast.product}
          qty={toast.qty}
          currency={currency}
          onViewCart={() => { dismissToast(); setCartOpen(true); }}
          onClose={dismissToast}
        />
      )}
    </CartContext.Provider>
  );
}

function CartToast({ product, qty, currency, onViewCart, onClose }) {
  const price = currency === 'INR' ? product.priceINR : product.priceGBP;
  const sym   = currency === 'INR' ? '₹' : '£';

  return (
    <>
      <style>{`
        @keyframes slideUpToast {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }

        /* ── Base (desktop floating card) ── */
        .cart-toast {
          position: fixed;
          bottom: 28px;
          left: 16px;
          right: 16px;
          margin: 0 auto;
          max-width: 400px;
          z-index: 99999;
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 12px 48px rgba(0,0,0,.18), 0 2px 8px rgba(0,0,0,.08);
          animation: slideUpToast .35s cubic-bezier(.34,1.4,.64,1) both;
          overflow: hidden;
          font-family: Inter, system-ui, sans-serif;
        }

        /* ── Mobile: full-width bottom sheet ── */
        @media (max-width: 600px) {
          .cart-toast {
            bottom: 0;
            left: 0;
            right: 0;
            max-width: 100%;
            border-radius: 20px 20px 0 0;
            box-shadow: 0 -4px 32px rgba(0,0,0,.14);
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
          .cart-toast-actions {
            padding-bottom: max(14px, env(safe-area-inset-bottom, 14px)) !important;
          }
        }

        .cart-toast-bar {
          height: 3px;
          background: #f0f0f0;
          overflow: hidden;
        }
        .cart-toast-bar-fill {
          height: 100%;
          background: #16a34a;
          animation: toastProgress 4s linear forwards;
        }
        .cart-toast-inner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 16px 0;
        }
        .cart-toast-img {
          width: 58px;
          height: 58px;
          border-radius: 12px;
          object-fit: cover;
          background: #f5f5f5;
          flex-shrink: 0;
        }
        .cart-toast-info {
          flex: 1;
          min-width: 0;
        }
        .cart-toast-label {
          font-size: .62rem;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #16a34a;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .cart-toast-name {
          font-size: .94rem;
          font-weight: 700;
          letter-spacing: -.2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #0a0a0a;
        }
        .cart-toast-sub {
          font-size: .76rem;
          color: #888;
          margin-top: 3px;
        }
        .cart-toast-close {
          all: unset;
          cursor: pointer;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: .75rem;
          color: #666;
          flex-shrink: 0;
          align-self: flex-start;
          transition: background .15s;
        }
        .cart-toast-close:hover { background: #e8e8e8; }
        .cart-toast-actions {
          display: flex;
          gap: 10px;
          padding: 14px 16px 16px;
        }
        .cart-toast-btn-view {
          flex: 1;
          background: #0a0a0a;
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 13px 0;
          font-family: Inter, system-ui, sans-serif;
          font-size: .88rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity .15s;
          letter-spacing: -.1px;
        }
        .cart-toast-btn-view:hover { opacity: .85; }
        .cart-toast-btn-skip {
          flex: 1;
          background: #f5f5f5;
          color: #0a0a0a;
          border: none;
          border-radius: 12px;
          padding: 13px 0;
          font-family: Inter, system-ui, sans-serif;
          font-size: .88rem;
          font-weight: 600;
          cursor: pointer;
          transition: background .15s;
          letter-spacing: -.1px;
        }
        .cart-toast-btn-skip:hover { background: #ebebeb; }
      `}</style>

      <div className="cart-toast">
        {/* Auto-dismiss progress bar */}
        <div className="cart-toast-bar">
          <div className="cart-toast-bar-fill" />
        </div>

        {/* Product info */}
        <div className="cart-toast-inner">
          <img
            className="cart-toast-img"
            src={fixImageUrl(product.image) || '/images/spanish-tomato.jpg'}
            alt={product.name}
            width="58"
            height="58"
          />
          <div className="cart-toast-info">
            <div className="cart-toast-label">✓ Added to Cart</div>
            <div className="cart-toast-name">{product.name}</div>
            <div className="cart-toast-sub">{qty} × {sym}{Number(price).toFixed(2)}</div>
          </div>
          <button className="cart-toast-close" onClick={onClose} aria-label="Dismiss">✕</button>
        </div>

        {/* Actions */}
        <div className="cart-toast-actions">
          <button className="cart-toast-btn-view" onClick={onViewCart}>View Cart</button>
          <button className="cart-toast-btn-skip" onClick={onClose}>Continue</button>
        </div>
      </div>
    </>
  );
}

export const useCart = () => useContext(CartContext);
