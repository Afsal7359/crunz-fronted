'use client';
import { useEffect, useRef } from 'react';

const features = [
  { ico: '🌿', name: '100% Natural', txt: 'No preservatives, no artificial flavours. Pure, honest snacking exactly as nature intended.' },
  { ico: '🍌', name: 'Handpicked Bananas', txt: 'Sourced from the finest farms, processed with care for maximum freshness in every pack.' },
  { ico: '✦', name: 'Uniquely Thin & Crispy', txt: 'Our technique produces an even, light crunch that regular banana chips simply cannot match.' },
  { ico: '📦', name: 'Sealed for Freshness', txt: 'Every pack carefully sealed to lock in flavour and maintain that perfect crunch until you open it.' },
  { ico: '♻️', name: 'Eco Packaging', txt: 'Sustainable materials to reduce our footprint. Good for you and good for the planet.' },
  { ico: '⚡', name: 'Nutrient Rich', txt: 'Energy, fibre and essential minerals in every bag. Snacking that actually does you good.' },
];

export default function Features() {
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); }),
      { threshold: 0.07 }
    );
    ref.current?.querySelectorAll('.rv').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <section id="features" ref={ref}>
      <div className="feat-inner">
        <div className="feat-top rv">
          <div>
            <div className="sec-ey" style={{ color: '#fff', opacity: .3 }}>Why Crunz</div>
            <h2 className="sec-title">Made different.<br />Tastes better.</h2>
          </div>
          <p className="sec-desc">We obsess over every detail — from sourcing to seasoning — so you don't have to think twice.</p>
        </div>
        <div className="feat-grid rv">
          {features.map((f, i) => (
            <div key={i} className="feat-card">
              <span className="feat-ico">{f.ico}</span>
              <div className="feat-name">{f.name}</div>
              <p className="feat-txt">{f.txt}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
