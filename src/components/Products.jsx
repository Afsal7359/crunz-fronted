'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/currency';
import { fixImageUrl } from '@/lib/api';
import { toSlug } from '@/lib/slug';
import { useAnalytics } from '@/context/AnalyticsContext';

export default function Products({ products = [], onOpenModal }) {
  const { currency } = useCart();
  const { track } = useAnalytics();
  const router = useRouter();
  const sectionRef = useRef(null);

  const goToDetail = (product) => {
    track('product_view', { id: product._id, name: product.name });
    router.push(`/product/${toSlug(product.name)}`);
  };

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
            onClick={() => goToDetail(product)}
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
                  onClick={e => { e.stopPropagation(); goToDetail(product); }}
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
