'use client';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/currency';
import { fixImageUrl } from '@/lib/api';

export default function ProductModal({ product, onClose }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addToCart, currency } = useCart();

  useEffect(() => {
    setQty(1);
    setAdded(false);
  }, [product]);

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    if (product) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [product, onClose]);

  if (!product) return null;

  const handleAdd = () => {
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => { onClose(); setAdded(false); }, 900);
  };

  const gbp = formatPrice(product.priceGBP, 'GBP');
  const inr = formatPrice(product.priceINR, 'INR');
  const mainPrice = currency === 'INR' ? inr : gbp;
  const altPrice = currency === 'INR' ? gbp : inr;

  return (
    <div className={`pm-ov ${product ? 'open' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pm-box">
        <div className="pm-img">
          {product.badge && <div className="pm-badge-m">{product.badge}</div>}
          <img src={fixImageUrl(product.image) || '/images/spanish-tomato.jpg'} alt={product.name} />
        </div>
        <div className="pm-detail">
          <div className="pm-close-row">
            <button className="pm-x" onClick={onClose}>✕</button>
          </div>
          <div className="pm-flavor">{product.flavor}</div>
          <div className="pm-name">{product.name}</div>
          <p className="pm-desc">{product.description}</p>
          <div className="pm-tags">
            {(product.tags || []).map(t => <span key={t} className="pm-tag">{t}</span>)}
          </div>
          <hr className="pm-divider" />
          <div className="pm-prices">
            <div className="pm-price-main">{mainPrice}</div>
            <div className="pm-price-alt">Also available at {altPrice} / pack</div>
          </div>
          <div className="pm-qty-row">
            <div className="pm-qty-lbl">Quantity</div>
            <div className="pm-qty-ctrl">
              <button className="pm-q" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span className="pm-qn">{qty}</span>
              <button className="pm-q" onClick={() => setQty(q => q + 1)}>+</button>
            </div>
          </div>
          <button className={`pm-add ${added ? 'added' : ''}`} onClick={handleAdd}>
            {added ? 'Added to Cart ✓' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
