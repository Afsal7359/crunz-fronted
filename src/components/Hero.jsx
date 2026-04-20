'use client';
import { useState, useEffect, useRef } from 'react';

// ── Full-width infinite carousel ────────────────────────────────────
function Carousel({ slides, eyebrow, title, cta }) {
  const n = slides.length;
  const loop = [slides[n - 1], ...slides, slides[0]];
  const [cur, setCur]         = useState(1);
  const [animate, setAnimate] = useState(true);
  const timer = useRef(null);

  const start = () => {
    if (n <= 1) return;
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
      {/* Slides */}
      <div className="hero-slides" style={{
        transform: `translateX(-${cur * 100}%)`,
        transition: animate ? 'transform .5s cubic-bezier(.4,0,.2,1)' : 'none',
      }}>
        {loop.map((slide, i) => (
          <div key={i} className="hero-slide">
            {slide.type === 'text' ? (
              <div className="hero-slide-text"
                style={slide.bg ? { background: slide.bg } : {}}>
                {slide.text}
              </div>
            ) : (
              <img src={slide.src} alt={slide.label || 'Crunz'} fetchpriority={i === 1 ? 'high' : 'low'} />
            )}
          </div>
        ))}
      </div>

      {/* Text overlay at bottom-left */}
      <div className="hero-overlay">
        {eyebrow && <div className="hero-eyebrow">{eyebrow}</div>}
        {title   && <h1 className="hero-title">{title}</h1>}
        {cta     && <a href="#products" className="btn-hero">{cta} →</a>}
      </div>

      {/* Dots */}
      {n > 1 && (
        <div className="hero-dots">
          {slides.map((_, i) => <button key={i} className={`hero-dot ${i === activeDot ? 'active' : ''}`} onClick={() => go(i)} />)}
        </div>
      )}

      {/* Arrows */}
      {n > 1 && (
        <>
          <button className="hero-arr hero-arr-l" onClick={prev}>‹</button>
          <button className="hero-arr hero-arr-r" onClick={next}>›</button>
        </>
      )}
    </div>
  );
}

// ── Main Hero ───────────────────────────────────────────────────────
export default function Hero({ content = {}, products = [], loaded = false }) {
  const eyebrow = content.hero_eyebrow || 'Premium Banana Chips · Preston, UK';
  const title   = content.hero_title   || 'CRUNZ';
  const cta     = content.hero_cta     || 'Shop Now';

  // Banner slides: admin-defined or fall back to product images
  let slides = [];
  try { slides = content.hero_slides ? JSON.parse(content.hero_slides) : []; } catch {}
  if (!slides.length && products.length) {
    slides = products.map(p => ({ type: 'image', src: p.image || '', label: p.name }));
  }

  // Preload all slide images as soon as URLs are known
  useEffect(() => {
    slides.forEach(s => {
      if (s.type !== 'text' && s.src) {
        const img = new window.Image();
        img.src = s.src;
      }
    });
  }, [slides.map(s => s.src).join(',')]);

  return (
    <section className="hero">
      <div className="hero-banner">
        {!loaded || !slides.length
          ? <div className="hero-skel" />
          : <Carousel slides={slides} eyebrow={eyebrow} title={title} cta={cta} />
        }
      </div>
    </section>
  );
}
