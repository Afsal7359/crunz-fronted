'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { detectCurrencyFromTimezone } from '@/lib/currency';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [currency, setCurrency] = useState('GBP');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

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

  return (
    <CartContext.Provider value={{
      cart, currency, setCurrency, cartOpen, checkoutOpen,
      addToCart, removeFromCart, changeQty, clearCart,
      setCartOpen, setCheckoutOpen,
      itemCount, total
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
