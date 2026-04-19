import Image from 'next/image';

export default function Footer({ content = {} }) {
  const tagline = content.footer_tagline || 'Premium banana chips from Preston, UK. The ultimate crunch in every bite.';
  const ig = content.instagram || 'https://instagram.com/crunzofficial';
  const wa = content.whatsapp || '447741940700';

  return (
    <footer>
      <div className="foot-inner">
        <div className="foot-grid">
          <div>
            <Image src="/images/logo.png" alt="CRUNZ" width={130} height={44} style={{ objectFit: 'contain', height: 44, width: 'auto', marginBottom: 12 }} />
            <p className="f-tag">{tagline}</p>
            <div className="f-socs">
              <a href={ig} target="_blank" rel="noreferrer" className="f-soc">Instagram</a>
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="f-soc">WhatsApp</a>
            </div>
          </div>
          <div>
            <div className="f-col-ttl">Shop</div>
            <ul className="f-links">
              <li><a href="#products">All Flavours</a></li>
              <li><a href="#spotlight">Spanish Tomato</a></li>
              <li><a href="#spotlight">Peri Peri Magic</a></li>
              <li><a href="#spotlight">Sour & Onion</a></li>
              <li><a href="#spotlight">Classic Normal</a></li>
            </ul>
          </div>
          <div>
            <div className="f-col-ttl">Company</div>
            <ul className="f-links">
              <li><a href="#features">Why Crunz</a></li>
              <li><a href="#reviews">Reviews</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
          <div>
            <div className="f-col-ttl">Order</div>
            <ul className="f-links">
              <li><a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">WhatsApp Order</a></li>
              <li><a href={`mailto:${content.email || 'crunzsnacks@gmail.com'}`}>Email Order</a></li>
              <li><a href="#contact">Wholesale</a></li>
              <li><a href="#contact">Distribution</a></li>
            </ul>
          </div>
        </div>
        <div className="foot-bot">
          <div className="f-copy">© {new Date().getFullYear()} CRUNZ. All rights reserved. Preston, United Kingdom.</div>
          <div className="f-copy">Made with care for snack lovers.</div>
        </div>
      </div>
    </footer>
  );
}
