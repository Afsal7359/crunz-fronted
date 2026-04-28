'use client';
import { useEffect, useRef } from 'react';

const REVIEWS = [
  { text: 'I\'ve tried every banana chip brand and Crunz is on another level. Spanish Tomato is divine — tangy, crispy, completely addictive. Can\'t stop at one bag.', name: 'Sarah K.', loc: 'Manchester, UK', initials: 'S', color: '#f59e0b' },
  { text: 'Peri Peri Magic is something else. Perfect heat — not too much, just enough. My whole family is hooked. We order six bags at a time now!', name: 'Ahmed R.', loc: 'Birmingham, UK', initials: 'A', color: '#6366f1' },
  { text: 'Sour & Onion Cream is my weakness. So thin, so crispy, no artificial ingredients. Guilt-free snacking done perfectly!', name: 'Priya M.', loc: 'London, UK', initials: 'P', color: '#16a34a' },
  { text: 'Classic Curry Leaves brings back so many memories. Authentic flavour, incredible crunch. Nothing else comes close in the UK market.', name: 'Rajan T.', loc: 'Leicester, UK', initials: 'R', color: '#ec4899' },
  { text: 'Ordered as a gift for my mum and she absolutely loved them! The packaging is beautiful and the chips arrived fresh. Will definitely re-order.', name: 'Emma L.', loc: 'Bristol, UK', initials: 'E', color: '#0ea5e9' },
  { text: 'These are dangerously good. I open a bag meaning to have a few and the whole thing is gone in minutes. The Peri Peri flavour especially!', name: 'James O.', loc: 'Leeds, UK', initials: 'J', color: '#f97316' },
];

function ReviewCard({ r }) {
  return (
    <div style={{
      flexShrink: 0,
      width: 300,
      background: '#fff',
      border: '1.5px solid #f0f0f0',
      borderRadius: 16,
      padding: '22px 22px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      userSelect: 'none',
    }}>
      <div style={{ color: '#f59e0b', fontSize: '.88rem', letterSpacing: 2 }}>★★★★★</div>
      <p style={{ fontSize: '.84rem', lineHeight: 1.7, opacity: .65, flex: 1, margin: 0 }}>"{r.text}"</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: r.color, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: '.82rem', flexShrink: 0,
        }}>{r.initials}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '.84rem', letterSpacing: '-.2px' }}>{r.name}</div>
          <div style={{ fontSize: '.7rem', opacity: .38, marginTop: 1 }}>{r.loc}</div>
        </div>
      </div>
    </div>
  );
}

export default function Contact({ content = {} }) {
  const ref = useRef(null);

  const wa       = content.whatsapp         || '447741940700';
  const email    = content.email            || 'crunzsnacks@gmail.com';
  const ig       = content.instagram        || 'https://instagram.com/crunzofficial';
  const location = content.contact_location || 'Preston, United Kingdom';
  const phone    = content.contact_phone    || '+44 7741 940 700';

  useEffect(() => {
    const obs = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); }),
      { threshold: 0.07 }
    );
    ref.current?.querySelectorAll('.rv').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Duplicate for seamless infinite loop
  const track = [...REVIEWS, ...REVIEWS];

  return (
    <section id="contact" ref={ref} style={{ paddingBottom: 0 }}>
      <div className="cont-inner" style={{ alignItems: 'start' }}>

        {/* LEFT — contact info */}
        <div>
          <div className="sec-ey rv">Get In Touch</div>
          <h2 className="sec-title rv">Order. Connect.<br />Partner with us.</h2>
          <p className="rv" style={{ fontSize: '.88rem', opacity: .5, lineHeight: 1.7, marginTop: 10, maxWidth: 380 }}>
            Opportunities for retailers, distributors and entrepreneurs. Find Crunz at your nearest supermarket or order below.
          </p>
          <div className="cont-links">
            <div className="c-item rv">
              <div className="c-ico">📍</div>
              <div><div className="c-lbl">Location</div><div className="c-val">{location}</div></div>
            </div>
            <a className="c-item rv" href={`https://wa.me/${wa.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
              <div className="c-ico">📞</div>
              <div><div className="c-lbl">Call / WhatsApp</div><div className="c-val">{phone}</div></div>
            </a>
            <a className="c-item rv" href={`mailto:${email}`}>
              <div className="c-ico">✉️</div>
              <div><div className="c-lbl">Email</div><div className="c-val">{email}</div></div>
            </a>
            <a className="c-item rv" href={ig} target="_blank" rel="noreferrer">
              <div className="c-ico">📸</div>
              <div>
                <div className="c-lbl">Instagram</div>
                <div className="c-val">{ig.replace('https://instagram.com/', '@').replace('https://www.instagram.com/', '@')}</div>
              </div>
            </a>
          </div>
        </div>

        {/* RIGHT — auto-scrolling reviews */}
        <div className="rv" style={{ overflow: 'hidden', paddingTop: 8 }}>
          <div style={{ fontSize: '.65rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', opacity: .35, marginBottom: 14 }}>
            Customer Reviews
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-.5px', marginBottom: 20 }}>
            What people are saying
          </div>

          {/* Scroll track — pauses on hover */}
          <div style={{ overflow: 'hidden', margin: '0 -4px' }}>
            <div className="rev-scroll-track">
              {track.map((r, i) => (
                <ReviewCard key={i} r={r} />
              ))}
            </div>
          </div>

          {/* Second row scrolling opposite direction */}
          <div style={{ overflow: 'hidden', margin: '12px -4px 0' }}>
            <div className="rev-scroll-track rev-scroll-reverse">
              {[...track].reverse().map((r, i) => (
                <ReviewCard key={i} r={r} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .rev-scroll-track {
          display: flex;
          gap: 14px;
          padding: 4px;
          width: max-content;
          animation: rev-scroll 28s linear infinite;
        }
        .rev-scroll-track:hover { animation-play-state: paused; }
        .rev-scroll-reverse {
          animation-name: rev-scroll-r;
          animation-duration: 32s;
        }
        @keyframes rev-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes rev-scroll-r {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </section>
  );
}
