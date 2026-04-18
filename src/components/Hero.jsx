'use client';
import { useState, useEffect, useRef } from 'react';

export default function Hero({ content = {}, products = [] }) {
  const eyebrow = content.hero_eyebrow || 'Premium Banana Chips · Preston, UK';
  const title   = content.hero_title   || 'CRUNZ';
  const sub     = content.hero_sub     || 'Zero preservatives. Four bold flavours. The ultimate crunch in every bite.';
  const cta     = content.hero_cta     || 'Shop Now';

  // Build slide list: custom hero slides from admin + product images as fallback
  let slides = [];
  try {
    const heroSlides = content.hero_slides ? JSON.parse(content.hero_slides) : [];
    slides = heroSlides.length ? heroSlides : [];
  } catch {}

  if (!slides.length) {
    slides = products.length
      ? products.map(p => ({ type: 'image', src: p.image || '/images/spanish-tomato.jpg', label: p.name }))
      : [
          { type: 'image', src: '/images/spanish-tomato.jpg',  label: 'Spanish Tomato' },
          { type: 'image', src: '/images/peri-peri.jpg',       label: 'Peri Peri Magic' },
          { type: 'image', src: '/images/sour-onion.jpg',      label: 'Sour & Onion' },
          { type: 'image', src: '/images/classic-normal.jpg',  label: 'Classic Normal' },
        ];
  }

  const n = slides.length;

  // Infinite loop: [clone-of-last, ...slides, clone-of-first]
  // Real slides live at indices 1..n; clones at 0 and n+1
  const loopSlides = [slides[n - 1], ...slides, slides[0]];

  const [cur, setCur]         = useState(1);    // start at real slide 0 (index 1)
  const [animate, setAnimate] = useState(true);
  const timer = useRef(null);

  const startTimer = () => {
    clearInterval(timer.current);
    timer.current = setInterval(() => setCur(c => c + 1), 3000);
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(timer.current);
  }, [n]);

  // After sliding into a clone, wait for the CSS transition then jump silently
  useEffect(() => {
    if (cur === n + 1) {
      // landed on clone-of-first → jump to real first (index 1)
      const t = setTimeout(() => { setAnimate(false); setCur(1); }, 500);
      return () => clearTimeout(t);
    }
    if (cur === 0) {
      // landed on clone-of-last → jump to real last (index n)
      const t = setTimeout(() => { setAnimate(false); setCur(n); }, 500);
      return () => clearTimeout(t);
    }
  }, [cur, n]);

  // Re-enable animation one frame after the silent jump
  useEffect(() => {
    if (!animate) {
      const t = setTimeout(() => setAnimate(true), 20);
      return () => clearTimeout(t);
    }
  }, [animate]);

  const pause  = () => clearInterval(timer.current);
  const resume = () => startTimer();

  const prev = () => { setAnimate(true); setCur(c => c - 1); startTimer(); };
  const next = () => { setAnimate(true); setCur(c => c + 1); startTimer(); };

  // Map cur back to a 0-based real-slide index for the dot indicator
  const activeDot = cur === 0 ? n - 1 : cur === n + 1 ? 0 : cur - 1;

  const go = (realIdx) => { setAnimate(true); setCur(realIdx + 1); startTimer(); };

  return (
    <section className="hero">
      <div className="hero-banner">

        {/* Left — text */}
        <div className="hero-text-side">
          <div className="hero-eyebrow">{eyebrow}</div>
          <h1 className="hero-title">{title}</h1>
          <p className="hero-sub">{sub}</p>
          <a href="#products" className="btn-blk">{cta} →</a>
        </div>

        {/* Right — infinite carousel */}
        <div
          className="hero-carousel"
          onMouseEnter={pause}
          onMouseLeave={resume}
        >
          <div
            className="hero-slides"
            style={{
              transform: `translateX(-${cur * 100}%)`,
              transition: animate ? 'transform .5s cubic-bezier(.4,0,.2,1)' : 'none',
            }}
          >
            {loopSlides.map((slide, i) => (
              <div key={i} className="hero-slide">
                {slide.type === 'text' ? (
                  <div
                    className="hero-slide-text"
                    style={slide.bg ? { background: slide.bg, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}}
                  >
                    {slide.text}
                  </div>
                ) : (
                  <img src={slide.src} alt={slide.label || 'Crunz'} />
                )}
                {slide.label && slide.type !== 'text' && (
                  <div className="hero-slide-label">{slide.label}</div>
                )}
              </div>
            ))}
          </div>

          {/* Dot indicators — only for real slides */}
          <div className="hero-dots">
            {slides.map((_, i) => (
              <button key={i} className={`hero-dot ${i === activeDot ? 'active' : ''}`} onClick={() => go(i)} />
            ))}
          </div>

          {/* Prev / Next arrows */}
          <button className="hero-arr hero-arr-l" onClick={prev}>‹</button>
          <button className="hero-arr hero-arr-r" onClick={next}>›</button>
        </div>

      </div>
    </section>
  );
}
