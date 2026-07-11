'use client';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/currency';
import { fixImageUrl } from '@/lib/api';
import { useAnalytics } from '@/context/AnalyticsContext';

export default function ProductModal({ product, onClose, wa = '447741940700' }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addToCart, currency } = useCart();
  const { track } = useAnalytics();
  const isOOS = product?.inStock === false;

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
    track('add_to_cart', { id: product._id, name: product.name, qty, currency });
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
          </div>
          {isOOS ? (
            <div style={{ marginTop: 20 }}>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: '.88rem', color: '#dc2626', marginBottom: 4 }}>Currently Out of Stock</div>
                <div style={{ fontSize: '.82rem', color: '#666', lineHeight: 1.55 }}>This product is temporarily unavailable. Contact us on WhatsApp and we'll let you know when it's back!</div>
              </div>
              <a
                href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hi! I'm interested in "${product.name}" but it shows Out of Stock. Can you let me know when it'll be available?`)}`}
                target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', background: '#25d366', color: '#fff', border: 'none', borderRadius: 8, padding: '13px 0', fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: '.9rem', textDecoration: 'none', cursor: 'pointer' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Chat on WhatsApp
              </a>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
