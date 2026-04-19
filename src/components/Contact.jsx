'use client';
import { useEffect, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/currency';
import { fixImageUrl } from '@/lib/api';

export default function Contact({ products = [], content = {}, onOpenModal }) {
  const { currency, setCartOpen } = useCart();
  const ref = useRef(null);

  const wa       = content.whatsapp          || '447741940700';
  const email    = content.email             || 'crunzsnacks@gmail.com';
  const ig       = content.instagram         || 'https://instagram.com/crunzofficial';
  const location = content.contact_location  || 'Preston, United Kingdom';
  const phone    = content.contact_phone     || '+44 7741 940 700';

  useEffect(() => {
    const obs = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); }),
      { threshold: 0.07 }
    );
    ref.current?.querySelectorAll('.rv').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <section id="contact" ref={ref}>
      <div className="cont-inner">
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
              <div><div className="c-lbl">Instagram</div>
                <div className="c-val">{ig.replace('https://instagram.com/', '@').replace('https://www.instagram.com/', '@')}</div>
              </div>
            </a>
          </div>
        </div>
        <div className="rv">
          <div className="order-box">
            <div className="ob-title">Quick Order</div>
            <div className="ob-sub">Add to cart and checkout online</div>
            <div className="ob-rows">
              {products.map(p => (
                <div key={p._id} className="ob-row" onClick={() => onOpenModal && onOpenModal(p)}>
                  <img src={fixImageUrl(p.image) || '/images/spanish-tomato.jpg'} alt={p.name} />
                  <span className="ob-row-name">{p.name}</span>
                  <span className="ob-row-price">
                    {currency === 'INR' ? formatPrice(p.priceINR, 'INR') : formatPrice(p.priceGBP, 'GBP')}
                  </span>
                </div>
              ))}
            </div>
            <button className="ck-btn" onClick={() => setCartOpen(true)}>
              View Cart & Checkout →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
