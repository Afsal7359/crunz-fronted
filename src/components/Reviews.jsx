'use client';
import { useEffect, useRef } from 'react';

const defaultReviews = [
  { text: '"I\'ve tried every banana chip brand and Crunz is on another level. Spanish Tomato is divine — tangy, crispy, completely addictive. Can\'t stop at one bag."', name: 'Sarah K.', loc: 'Manchester, UK', initials: 'S' },
  { text: '"Peri Peri Magic is something else. Perfect heat — not too much, just enough. My whole family is hooked. We order six bags at a time now!"', name: 'Ahmed R.', loc: 'Birmingham, UK', initials: 'A' },
  { text: '"Sour & Onion Cream is my weakness. So thin, so crispy, no artificial ingredients. Guilt-free snacking done perfectly!"', name: 'Priya M.', loc: 'London, UK', initials: 'P' },
];

export default function Reviews() {
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
    <section id="reviews" ref={ref}>
      <div className="rev-inner">
        <div className="rv">
          <div className="sec-ey" style={{ color: '#fff', opacity: .4 }}>Customer Reviews</div>
          <h2 className="sec-title" style={{ color: '#fff' }}>What people are saying</h2>
        </div>
        <div className="rev-grid rv">
          {defaultReviews.map((r, i) => (
            <div key={i} className="rev-card">
              <div className="rev-stars">★★★★★</div>
              <p className="rev-text">{r.text}</p>
              <div className="rev-auth">
                <div className="rev-av">{r.initials}</div>
                <div>
                  <div className="rev-name">{r.name}</div>
                  <div className="rev-loc">{r.loc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
