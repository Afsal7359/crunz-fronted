'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Cart from '@/components/Cart';
import CheckoutModal from '@/components/CheckoutModal';
import AuthModal from '@/components/AuthModal';
import ProfileModal from '@/components/ProfileModal';
import Footer from '@/components/Footer';
import { api, fixImageUrl } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/currency';
import { toSlug, findBySlug } from '@/lib/slug';
import PageLoader from '@/components/PageLoader';
import { AnalyticsProvider, useAnalytics } from '@/context/AnalyticsContext';

/* ── Quantity selector shared style ── */
const qBtnStyle = {
  width: 36, height: 36, borderRadius: 8,
  border: '1.5px solid #e0e0e0', background: '#fff',
  fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'border-color .15s',
};

/* ── Related product card ── */
function RelatedCard({ product, currency, onNavigate }) {
  const { addToCart } = useCart();
  const { track } = useAnalytics();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const price = currency === 'INR' ? product.priceINR : product.priceGBP;

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart(product, qty);
    track('add_to_cart', { id: product._id, name: product.name, qty, currency, source: 'related' });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div
      onClick={() => onNavigate()}
      style={{
        background: '#fff', border: '1.5px solid #f0f0f0', borderRadius: 16,
        overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow .2s, border-color .2s',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,.08)'; e.currentTarget.style.borderColor = '#ddd'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#f0f0f0'; }}
    >
      {/* Image */}
      <div style={{ position: 'relative', background: '#fafafa', aspectRatio: '4/3', overflow: 'hidden' }}>
        {product.badge && (
          <div style={{
            position: 'absolute', top: 10, left: 10, zIndex: 2,
            background: '#0a0a0a', color: '#fff', fontSize: '.65rem',
            fontWeight: 800, padding: '3px 9px', borderRadius: 4, letterSpacing: .5,
          }}>{product.badge}</div>
        )}
        <img
          src={fixImageUrl(product.image) || '/images/spanish-tomato.jpg'}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .3s' }}
          onMouseEnter={e => e.target.style.transform = 'scale(1.04)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        />
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <div style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', opacity: .45 }}>
          {product.flavor}
        </div>
        <div style={{ fontSize: '.95rem', fontWeight: 700, letterSpacing: '-.3px', lineHeight: 1.2 }}>
          {product.name}
        </div>
        <div style={{ fontSize: '.78rem', opacity: .5, lineHeight: 1.5, flexGrow: 1 }}>
          {(product.description || '').length > 60
            ? product.description.slice(0, 60) + '…'
            : product.description}
        </div>

        {/* Price + qty + add */}
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: '1rem', fontWeight: 800 }}>
            {formatPrice(price, currency)}<small style={{ fontWeight: 400, opacity: .5, fontSize: '.72rem', marginLeft: 4 }}>/ pack</small>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Qty */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8f8f8', borderRadius: 8, padding: '4px 8px' }}
              onClick={e => e.stopPropagation()}>
              <button style={{ ...qBtnStyle, width: 26, height: 26, fontSize: '.9rem', border: 'none', background: 'transparent' }}
                onClick={e => { e.stopPropagation(); setQty(q => Math.max(1, q - 1)); }}>−</button>
              <span style={{ minWidth: 18, textAlign: 'center', fontWeight: 700, fontSize: '.88rem' }}>{qty}</span>
              <button style={{ ...qBtnStyle, width: 26, height: 26, fontSize: '.9rem', border: 'none', background: 'transparent' }}
                onClick={e => { e.stopPropagation(); setQty(q => q + 1); }}>+</button>
            </div>
            {/* Add to cart */}
            <button
              onClick={handleAdd}
              style={{
                flex: 1, background: added ? '#16a34a' : '#0a0a0a', color: '#fff',
                border: 'none', borderRadius: 8, padding: '8px 12px',
                fontSize: '.8rem', fontWeight: 700, cursor: 'pointer',
                transition: 'background .2s', whiteSpace: 'nowrap',
              }}
            >
              {added ? '✓ Added' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main product detail content ── */
function ProductDetailContent({ products, content, product }) {
  const { currency, addToCart, setCartOpen } = useCart();
  const { track } = useAnalytics();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const price = currency === 'INR' ? product.priceINR : product.priceGBP;
  const lineTotal = formatPrice(price * qty, currency);
  const related = products.filter(p => p._id !== product._id);

  useEffect(() => {
    setQty(1);
    setAdded(false);
    track('product_detail_view', { id: product._id, name: product.name, currency });
  }, [product._id]);

  const handleAdd = () => {
    addToCart(product, qty);
    track('add_to_cart', { id: product._id, name: product.name, qty, currency });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  const handleBuyNow = () => {
    addToCart(product, qty);
    track('add_to_cart', { id: product._id, name: product.name, qty, currency, source: 'buy_now' });
    setCartOpen(true);
  };

  const navigateToProduct = (p) => {
    router.push(`/product/${toSlug(p.name)}`);
  };

  return (
    <>
      <Navbar content={content} onOpenAuth={() => setAuthOpen(true)} onOpenProfile={() => setProfileOpen(true)} />

      <main style={{ minHeight: '80vh', background: '#fff' }}>

        {/* Back breadcrumb */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 5% 0' }}>
          <Link href="/#products" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: '.82rem', fontWeight: 600, color: '#0a0a0a',
            textDecoration: 'none', opacity: .5, transition: 'opacity .15s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = .5}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Shop
          </Link>
        </div>

        {/* ── Product Hero ── */}
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 5% 56px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 56,
            alignItems: 'start',
          }}
            className="pd-hero-grid"
          >

            {/* LEFT — Image */}
            <div style={{
              position: 'sticky', top: 88,
              background: '#f7f7f7', borderRadius: 20,
              overflow: 'hidden', aspectRatio: '1 / 1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {product.badge && (
                <div style={{
                  position: 'absolute', top: 20, left: 20, zIndex: 2,
                  background: '#0a0a0a', color: '#fff',
                  fontSize: '.72rem', fontWeight: 800,
                  padding: '5px 12px', borderRadius: 5, letterSpacing: .5,
                }}>{product.badge}</div>
              )}
              <img
                src={fixImageUrl(product.image) || '/images/spanish-tomato.jpg'}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>

            {/* RIGHT — Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

              {/* Flavor */}
              <div style={{
                fontSize: '.7rem', fontWeight: 700, letterSpacing: 3,
                textTransform: 'uppercase', opacity: .4, marginBottom: 10,
              }}>{product.flavor}</div>

              {/* Name */}
              <h1 style={{
                fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 900,
                letterSpacing: '-1.5px', lineHeight: 1.05, marginBottom: 14,
              }}>{product.name}</h1>

              {/* Description */}
              <p style={{
                fontSize: '.95rem', lineHeight: 1.7, opacity: .6,
                marginBottom: 18, maxWidth: 480,
              }}>{product.description}</p>

              {/* Tags */}
              {(product.tags || []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 24 }}>
                  {product.tags.map(t => (
                    <span key={t} style={{
                      fontSize: '.72rem', fontWeight: 600,
                      padding: '4px 11px', borderRadius: 100,
                      border: '1.5px solid #e8e8e8', color: '#0a0a0a', opacity: .7,
                    }}>{t}</span>
                  ))}
                </div>
              )}

              <div style={{ height: 1, background: '#f0f0f0', marginBottom: 24 }} />

              {/* Price */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1 }}>
                  {formatPrice(price, currency)}
                  <span style={{ fontSize: '.85rem', fontWeight: 500, opacity: .45, marginLeft: 6 }}>/ pack</span>
                </div>
                <div style={{ fontSize: '.78rem', opacity: .4, marginTop: 5 }}>
                  Inclusive of all taxes · Free delivery over {currency === 'INR' ? '₹500' : '£25'}
                </div>
              </div>

              {/* Quantity */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: '.8rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', opacity: .5, marginBottom: 12 }}>
                  Quantity
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, width: 'fit-content' }}>
                  <button
                    style={{ ...qBtnStyle, borderRadius: '8px 0 0 8px', borderRight: 'none' }}
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                  >−</button>
                  <div style={{
                    width: 52, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1.5px solid #e0e0e0', borderLeft: 'none', borderRight: 'none',
                    fontWeight: 700, fontSize: '1rem',
                  }}>{qty}</div>
                  <button
                    style={{ ...qBtnStyle, borderRadius: '0 8px 8px 0', borderLeft: 'none' }}
                    onClick={() => setQty(q => q + 1)}
                  >+</button>
                </div>
                {qty > 1 && (
                  <div style={{ fontSize: '.82rem', opacity: .55, marginTop: 10 }}>
                    Total: <strong>{lineTotal}</strong> for {qty} packs
                  </div>
                )}
              </div>

              {/* Bulk hint */}
              {qty >= 3 && (
                <div style={{
                  background: '#f0fdf4', border: '1px solid #bbf7d0',
                  borderRadius: 10, padding: '10px 14px',
                  fontSize: '.78rem', color: '#15803d', fontWeight: 600,
                  marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span>🎉</span> Great bulk buy! {qty} packs ordered.
                </div>
              )}

              {/* CTA Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={handleBuyNow}
                  style={{
                    background: '#0a0a0a', color: '#fff', border: 'none',
                    borderRadius: 12, padding: '15px 28px',
                    fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                    letterSpacing: '-.2px', transition: 'opacity .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = .85}
                  onMouseLeave={e => e.currentTarget.style.opacity = 1}
                >
                  Buy Now →
                </button>
                <button
                  onClick={handleAdd}
                  style={{
                    background: added ? '#f0fdf4' : '#fff',
                    color: added ? '#16a34a' : '#0a0a0a',
                    border: added ? '2px solid #bbf7d0' : '2px solid #e8e8e8',
                    borderRadius: 12, padding: '13px 28px',
                    fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                    letterSpacing: '-.2px', transition: 'all .2s',
                  }}
                >
                  {added ? '✓ Added to Cart' : 'Add to Cart'}
                </button>
              </div>

              {/* Trust badges */}
              <div style={{ display: 'flex', gap: 18, marginTop: 24, flexWrap: 'wrap' }}>
                {[
                  { icon: '🚚', text: 'Fast Delivery' },
                  { icon: '✅', text: 'Secure Payment' },
                  { icon: '🍌', text: 'Natural Ingredients' },
                ].map(b => (
                  <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.75rem', opacity: .55, fontWeight: 600 }}>
                    <span style={{ fontSize: '.95rem' }}>{b.icon}</span> {b.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Other Flavours ── */}
        {related.length > 0 && (
          <section style={{ background: '#fafafa', padding: '56px 5%' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', opacity: .4, marginBottom: 8 }}>
                  Explore More
                </div>
                <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 900, letterSpacing: '-1px' }}>
                  Other Flavours
                </h2>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(related.length, 3)}, 1fr)`,
                gap: 20,
              }}
                className="pd-related-grid"
              >
                {related.map(p => (
                  <RelatedCard
                    key={p._id}
                    product={p}
                    currency={currency}
                    onNavigate={() => navigateToProduct(p)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer content={content} />
      <Cart content={content} />
      <CheckoutModal content={content} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .pd-hero-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          .pd-related-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .pd-related-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

/* ── Page wrapper: fetches data, wraps providers ── */
function ProductPage() {
  const { id: slug } = useParams();   // param is named 'id' by folder, but contains a slug
  const router = useRouter();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/products'),
      api.get('/content').catch(() => ({})),
    ]).then(([allProducts, c]) => {
      setProducts(allProducts);
      setContent(c);
      const found = findBySlug(allProducts, slug);
      if (found) {
        setProduct(found);
      } else {
        setNotFound(true);
      }
    }).catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <PageLoader />;

  if (notFound || !product) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: '3rem' }}>🍌</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>Product not found</div>
        <Link href="/" style={{ color: '#0a0a0a', fontWeight: 600, fontSize: '.9rem' }}>← Back to Home</Link>
      </div>
    );
  }

  return (
    <AnalyticsProvider userId={user?._id}>
      <ProductDetailContent products={products} content={content} product={product} />
    </AnalyticsProvider>
  );
}

export default ProductPage;
