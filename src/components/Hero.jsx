'use client';
import { useState, useEffect, useRef } from 'react';

// ── Reusable infinite carousel (left AND right panels) ─────────────
function Carousel({ slides }) {
  const n = slides.length;
  const loop = [slides[n - 1], ...slides, slides[0]];
  const [cur, setCur]         = useState(1);
  const [animate, setAnimate] = useState(true);
  const timer = useRef(null);

  const start = () => {
    clearInterval(timer.current);
    timer.current = setInterval(() => setCur(c => c + 1), 3000);
  };
  useEffect(() => { start(); return () => clearInterval(timer.current); }, [n]);

  useEffect(() => {
    if (cur === n + 1) { const t = setTimeout(() => { setAnimate(false); setCur(1); }, 500); return () => clearTimeout(t); }
    if (cur === 0)     { const t = setTimeout(() => { setAnimate(false); setCur(n); }, 500); return () => clearTimeout(t); }
  }, [cur, n]);

  useEffect(() => {
    if (!animate) { const t = setTimeout(() => setAnimate(true), 20); return () => clearTimeout(t); }
  }, [animate]);

  const prev = () => { setAnimate(true); setCur(c => c - 1); start(); };
  const next = () => { setAnimate(true); setCur(c => c + 1); start(); };
  const go   = i  => { setAnimate(true); setCur(i + 1); start(); };
  const activeDot = cur === 0 ? n - 1 : cur === n + 1 ? 0 : cur - 1;

  return (
    <div className="hero-carousel"
      onMouseEnter={() => clearInterval(timer.current)}
      onMouseLeave={start}
    >
      <div className="hero-slides" style={{
        transform: `translateX(-${cur * 100}%)`,
        transition: animate ? 'transform .5s cubic-bezier(.4,0,.2,1)' : 'none',
      }}>
        {loop.map((slide, i) => (
          <div key={i} className="hero-slide">
            {slide.type === 'text' ? (
              <div className="hero-slide-text"
                style={slide.bg ? { background: slide.bg, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}}>
                {slide.text}
              </div>
            ) : (
              <img src={slide.src} alt={slide.label || 'Crunz'} />
            )}
            {slide.label && slide.type !== 'text' && <div className="hero-slide-label">{slide.label}</div>}
          </div>
        ))}
      </div>

      {n > 1 && (
        <>
          <div className="hero-dots">
            {slides.map((_, i) => <button key={i} className={`hero-dot ${i === activeDot ? 'active' : ''}`} onClick={() => go(i)} />)}
          </div>
          <button className="hero-arr hero-arr-l" onClick={prev}>‹</button>
          <button className="hero-arr hero-arr-r" onClick={next}>›</button>
        </>
      )}
    </div>
  );
}

// ── Main Hero ───────────────────────────────────────────────────────
export default function Hero({ content = {}, products = [] }) {
  const eyebrow = content.hero_eyebrow || 'Premium Banana Chips · Preston, UK';
  const title   = content.hero_title   || 'CRUNZ';
  const sub     = content.hero_sub     || 'Zero preservatives. Four bold flavours. The ultimate crunch in every bite.';
  const cta     = content.hero_cta     || 'Shop Now';

  // Left panel: try new hero_left_slides key, fall back to old hero_left_images
  let leftSlides = [];
  try {
    if (content.hero_left_slides) {
      leftSlides = JSON.parse(content.hero_left_slides).filter(s => s.src || s.text);
    } else if (content.hero_left_images) {
      const old = JSON.parse(content.hero_left_images);
      leftSlides = old.filter(img => img.src).map(img => ({ type: 'image', src: img.src, label: img.label }));
    }
  } catch {}

  // Right panel: admin carousel slides or fall back to product images
  let rightSlides = [];
  try { rightSlides = content.hero_slides ? JSON.parse(content.hero_slides) : []; } catch {}
  if (!rightSlides.length) {
    rightSlides = products.length
      ? products.map(p => ({ type: 'image', src: p.image || '/images/spanish-tomato.jpg', label: p.name }))
      : [
          { type: 'image', src: '/images/spanish-tomato.jpg',  label: 'Spanish Tomato' },
          { type: 'image', src: '/images/peri-peri.jpg',       label: 'Peri Peri Magic' },
          { type: 'image', src: '/images/sour-onion.jpg',      label: 'Sour & Onion' },
          { type: 'image', src: '/images/classic-normal.jpg',  label: 'Classic Normal' },
        ];
  }

  return (
    <section className="hero">
      <div className="hero-banner">

        {/* Left — images from admin OR text fallback */}
        {leftSlides.length > 0
          ? <Carousel slides={leftSlides} />
          : (
            <div className="hero-text-side">
              <div className="hero-eyebrow">{eyebrow}</div>
              <h1 className="hero-title">{title}</h1>
              <p className="hero-sub">{sub}</p>
              <a href="#products" className="btn-blk">{cta} →</a>
            </div>
          )
        }

        {/* Right — product/custom image carousel */}
        <Carousel slides={rightSlides} />

      </div>
    </section>
  );
}
