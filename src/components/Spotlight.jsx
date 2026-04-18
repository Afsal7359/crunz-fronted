'use client';
import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/currency';

export default function Spotlight({ products = [], onOpenModal }) {
  const [cur, setCur] = useState(0);
  const { currency } = useCart();
  const ref = useRef(null);

  const d = products[cur] || {
    name: 'Spanish Tomato', flavor: 'Tangy · Bold', spice: 'Mild', priceGBP: 3.99, priceINR: 424,
    image: '/images/spanish-tomato.jpg', tags: ['Rich Tomato', 'Spanish Herbs', 'Tangy Burst', 'Zesty Finish'],
    description: 'A rich, tangy burst of tomato flavour with a hint of authentic Spanish seasoning.'
  };

  useEffect(() => {
    const obs = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); }),
      { threshold: 0.07 }
    );
    ref.current?.querySelectorAll('.rv').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <section id="spotlight" ref={ref}>
      <div className="spot-inner">
        <div className="sec-ey rv">Flavour Range</div>
        <h2 className="sec-title rv" style={{ marginBottom: 32 }}>Every flavour, explored</h2>
        <div className="ftabs rv">
          {products.map((p, i) => (
            <button key={p._id} className={`ftab ${cur === i ? 'active' : ''}`} onClick={() => setCur(i)}>
              {p.name}
            </button>
          ))}
        </div>
        <div className="spot-grid">
          <div>
            <div className="spot-ey">{d.flavor}</div>
            <div className="spot-name">{d.name}</div>
            <p className="spot-desc">{d.description}</p>
            <div className="spot-tags">
              {(d.tags || []).map(t => <span key={t} className="s-tag">{t}</span>)}
            </div>
            <div className="spot-stats">
              <div className="ss"><div className="ss-num">{d.spice || 'None'}</div><div className="ss-lbl">Spice</div></div>
              <div className="ss"><div className="ss-num">★★★★★</div><div className="ss-lbl">Rating</div></div>
              <div className="ss">
                <div className="ss-num">{currency === 'INR' ? formatPrice(d.priceINR, 'INR') : formatPrice(d.priceGBP, 'GBP')}</div>
                <div className="ss-lbl">Per Pack</div>
              </div>
            </div>
            <button className="btn-blk" onClick={() => onOpenModal && onOpenModal(d)}>
              Add to Cart →
            </button>
          </div>
          <div className="spot-img" style={{ background: '#fff' }}>
            <img src={d.image || '/images/spanish-tomato.jpg'} alt={d.name} />
          </div>
        </div>
      </div>
    </section>
  );
}
