'use client';
import { useEffect, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/currency';
import { fixImageUrl } from '@/lib/api';

export default function Products({ products = [], onOpenModal }) {
  const { currency } = useCart();
  const sectionRef = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); }),
      { threshold: 0.07 }
    );
    sectionRef.current?.querySelectorAll('.rv').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [products]);

  return (
    <section id="products" ref={sectionRef}>
      <div className="sec-hdr rv">
        <div>
          <div className="sec-ey">Our Collection</div>
          <h2 className="sec-title">Shop All Flavours</h2>
        </div>
        <p className="sec-desc">Thinner than regular banana chips for an irresistible, light crunch.</p>
      </div>
      <div className="prod-grid rv">
        {products.map(product => (
          <div
            key={product._id}
            className="prod-card"
            onClick={() => onOpenModal(product)}
          >
            <div className="prod-img-wrap" style={{ background: '#fafafa' }}>
              {product.badge && <div className="prod-badge">{product.badge}</div>}
              <img src={fixImageUrl(product.image) || '/images/spanish-tomato.jpg'} alt={product.name} loading="lazy" />
            </div>
            <div className="prod-body">
              <div className="prod-flavor">{product.flavor}</div>
              <div className="prod-name">{product.name}</div>
              <p className="prod-desc">{product.description}</p>
              <div className="prod-foot">
                <div className="prod-price">
                  {currency === 'INR'
                    ? formatPrice(product.priceINR, 'INR')
                    : formatPrice(product.priceGBP, 'GBP')}
                  <small>/ pack</small>
                </div>
                <button
                  className="add-btn"
                  onClick={e => { e.stopPropagation(); onOpenModal(product); }}
                >
                  View
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
