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
import { toSlug } from '@/lib/slug';
import PageLoader from '@/components/PageLoader';
import { AnalyticsProvider, useAnalytics } from '@/context/AnalyticsContext';

/* ─── Bundle definitions (mirrors BundleSection) ─── */
function buildBundles(products) {
  return [
    {
      id: 'starter', type: 'pick', count: 2,
      tag: 'Starter Pack', title: 'Pick 2 Flavours',
      subtitle: 'The perfect intro to Crunz. Choose any 2 flavours you love.',
      discKey: 'bundle_2_discount',
    },
    {
      id: 'ultimate', type: 'all', count: products.length,
      tag: 'Best Value', title: `All ${products.length} Flavours`,
      subtitle: 'The complete Crunz experience — one pack of every flavour.',
      discKey: 'bundle_4_discount',
    },
    {
      id: 'trio', type: 'pick', count: 3,
      tag: 'Popular Pick', title: 'Pick 3 Flavours',
      subtitle: 'Our bestselling combo. Pick any 3 flavours from the range.',
      discKey: 'bundle_3_discount',
    },
  ];
}

function applyDiscount(price, pct) {
  if (!pct || Number(pct) <= 0) return null;
  return Math.round(price * (1 - Number(pct) / 100) * 100) / 100;
}

/* ─── Flavour chip for bundle detail ─── */
function FlavourChip({ product, selected, selectable, onClick, currency }) {
  const price = currency === 'INR' ? product.priceINR : product.priceGBP;
  return (
    <button
      onClick={selectable ? onClick : undefined}
      style={{
        all: 'unset',
        cursor: selectable ? 'pointer' : 'default',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        background: selected ? '#0a0a0a' : '#f7f7f7',
        borderRadius: 16, padding: '16px 12px',
        border: selected ? '2.5px solid #0a0a0a' : '2.5px solid transparent',
        transition: 'all .15s',
        position: 'relative',
        opacity: selectable && !selected ? 0.55 : 1,
      }}
    >
      {/* Checkmark */}
      {selectable && selected && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          background: '#fff', color: '#0a0a0a',
          borderRadius: '50%', width: 22, height: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '.7rem', fontWeight: 900,
        }}>✓</div>
      )}
      {/* Image */}
      <div style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
        <img
          src={fixImageUrl(product.image) || '/images/spanish-tomato.jpg'}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
      {/* Name */}
      <div style={{ fontSize: '.75rem', fontWeight: 700, textAlign: 'center', lineHeight: 1.3, color: selected ? '#fff' : '#0a0a0a', maxWidth: 80 }}>
        {product.name.replace(/crunz/i, '').trim()}
      </div>
      {/* Price */}
      <div style={{ fontSize: '.7rem', opacity: .6, color: selected ? '#fff' : '#0a0a0a', fontWeight: 600 }}>
        {formatPrice(price, currency)}
      </div>
    </button>
  );
}

/* ─── Individual product card for "Also add" section ─── */
function IndividualCard({ product, currency, onNavigate }) {
  const { addToCart, setCartOpen } = useCart();
  const { track } = useAnalytics();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const price = currency === 'INR' ? product.priceINR : product.priceGBP;

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart(product, qty);
    track('add_to_cart', { id: product._id, name: product.name, qty, currency, source: 'bundle_detail_related' });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div
      onClick={() => onNavigate(product._id)}
      style={{
        background: '#fff', border: '1.5px solid #efefef', borderRadius: 16,
        overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow .2s, border-color .2s',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.08)'; e.currentTarget.style.borderColor = '#ddd'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#efefef'; }}
    >
      <div style={{ background: '#fafafa', aspectRatio: '4/3', overflow: 'hidden', position: 'relative' }}>
        {product.badge && (
          <div style={{
            position: 'absolute', top: 10, left: 10, zIndex: 2,
            background: '#0a0a0a', color: '#fff',
            fontSize: '.62rem', fontWeight: 800, padding: '3px 9px', borderRadius: 4,
          }}>{product.badge}</div>
        )}
        <img
          src={fixImageUrl(product.image) || '/images/spanish-tomato.jpg'}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .3s' }}
          onMouseEnter={e => e.target.style.transform = 'scale(1.04)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        />
      </div>
      <div style={{ padding: '14px 14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ fontSize: '.62rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', opacity: .4 }}>{product.flavor}</div>
        <div style={{ fontSize: '.9rem', fontWeight: 700, lineHeight: 1.2 }}>{product.name}</div>
        <div style={{ fontSize: '.75rem', opacity: .5, lineHeight: 1.5, flexGrow: 1 }}>
          {(product.description || '').slice(0, 55)}{product.description?.length > 55 ? '…' : ''}
        </div>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontWeight: 800, fontSize: '.95rem' }}>
            {formatPrice(price, currency)}<span style={{ fontWeight: 400, opacity: .45, fontSize: '.7rem', marginLeft: 4 }}>/ pack</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f5f5f5', borderRadius: 7, padding: '3px 7px' }}>
              <button onClick={e => { e.stopPropagation(); setQty(q => Math.max(1, q - 1)); }}
                style={{ all: 'unset', cursor: 'pointer', fontWeight: 700, fontSize: '.9rem', width: 22, textAlign: 'center' }}>−</button>
              <span style={{ fontWeight: 700, fontSize: '.85rem', minWidth: 16, textAlign: 'center' }}>{qty}</span>
              <button onClick={e => { e.stopPropagation(); setQty(q => q + 1); }}
                style={{ all: 'unset', cursor: 'pointer', fontWeight: 700, fontSize: '.9rem', width: 22, textAlign: 'center' }}>+</button>
            </div>
            <button
              onClick={handleAdd}
              style={{
                flex: 1, background: added ? '#16a34a' : '#0a0a0a', color: '#fff',
                border: 'none', borderRadius: 7, padding: '8px 10px',
                fontSize: '.78rem', fontWeight: 700, cursor: 'pointer', transition: 'background .2s',
              }}
            >{added ? '✓ Added' : 'Add to Cart'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main bundle detail content ─── */
function BundleDetailContent({ products, content, bundleDef }) {
  const { currency, addToCart, setCartOpen } = useCart();
  const { track } = useAnalytics();
  const router = useRouter();

  const priceKey   = currency === 'INR' ? 'priceINR' : 'priceGBP';
  const sym        = currency === 'INR' ? '₹' : '£';
  const discountPct = Number(content[bundleDef.discKey] || 0);
  const isAll      = bundleDef.type === 'all';
  const needed     = bundleDef.count;

  const [selected, setSelected] = useState(isAll ? products.map(p => p._id) : []);
  const [added, setAdded]       = useState(false);
  const [authOpen, setAuthOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const selectedProducts = isAll ? products : products.filter(p => selected.includes(p._id));
  const subtotal         = selectedProducts.reduce((s, p) => s + (p[priceKey] || 0), 0);
  const discountedPrice  = applyDiscount(subtotal, discountPct);
  const finalPrice       = discountedPrice ?? subtotal;
  const canAdd           = isAll ? true : selected.length === needed;
  const savings          = discountedPrice !== null ? (subtotal - discountedPrice) : 0;

  const toggleSelect = (id) => {
    if (isAll) return;
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= needed) return [...prev.filter((_, i) => i !== 0), id];
      return [...prev, id];
    });
  };

  const handleAdd = () => {
    if (!canAdd) return;
    selectedProducts.forEach(p => addToCart(p, 1));
    track('bundle_add_to_cart', { bundle: bundleDef.id, items: selectedProducts.length, currency });
    setAdded(true);
    setTimeout(() => { setAdded(false); setCartOpen(true); }, 900);
  };

  const handleBuyNow = () => {
    if (!canAdd) return;
    selectedProducts.forEach(p => addToCart(p, 1));
    track('bundle_buy_now', { bundle: bundleDef.id, items: selectedProducts.length, currency });
    setCartOpen(true);
  };

  const isFeatured = bundleDef.id === 'ultimate';

  return (
    <>
      <Navbar content={content} onOpenAuth={() => setAuthOpen(true)} onOpenProfile={() => setProfileOpen(true)} />

      <main style={{ minHeight: '80vh', background: '#fff' }}>

        {/* ── Top nav bar ── */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 5% 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => router.back()}
            style={{
              all: 'unset', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: '.82rem', fontWeight: 600, opacity: .5, transition: 'opacity .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = .5}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>

          <Link
            href="/"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: '.82rem', fontWeight: 700, color: '#0a0a0a',
              textDecoration: 'none', padding: '8px 18px',
              border: '1.5px solid #e8e8e8', borderRadius: 8,
              transition: 'border-color .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#0a0a0a'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#e8e8e8'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Go Home
          </Link>
        </div>

        {/* ── Bundle Hero ── */}
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 5% 64px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'start' }} className="bd-hero-grid">

            {/* LEFT — flavour selector */}
            <div>
              {/* Bundle badge */}
              <div style={{ marginBottom: 16 }}>
                {isFeatured ? (
                  <span style={{
                    display: 'inline-block', background: '#f59e0b', color: '#0a0a0a',
                    fontSize: '.62rem', fontWeight: 800, letterSpacing: '2px',
                    textTransform: 'uppercase', padding: '5px 14px', borderRadius: 20,
                  }}>⭐ Most Recommended</span>
                ) : bundleDef.id === 'trio' ? (
                  <span style={{
                    display: 'inline-block', background: '#fef3c7', color: '#92400e',
                    fontSize: '.62rem', fontWeight: 800, letterSpacing: '1.5px',
                    textTransform: 'uppercase', padding: '5px 14px', borderRadius: 20,
                  }}>Popular</span>
                ) : (
                  <span style={{
                    display: 'inline-block', background: '#f5f5f5', color: '#555',
                    fontSize: '.62rem', fontWeight: 800, letterSpacing: '1.5px',
                    textTransform: 'uppercase', padding: '5px 14px', borderRadius: 20,
                  }}>{bundleDef.tag}</span>
                )}
              </div>

              <h1 style={{ fontSize: 'clamp(1.7rem,3vw,2.4rem)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.05, marginBottom: 10 }}>
                {bundleDef.title}
              </h1>
              <p style={{ fontSize: '.95rem', lineHeight: 1.7, opacity: .55, marginBottom: 28, maxWidth: 420 }}>
                {bundleDef.subtitle}
              </p>

              {/* Flavour chips */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', opacity: .4, marginBottom: 14 }}>
                  {isAll ? 'All Flavours Included' : `Select ${needed} Flavours`}
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(products.length, 4)}, 1fr)`,
                  gap: 10,
                }} className="bd-chips-grid">
                  {products.map(p => (
                    <FlavourChip
                      key={p._id}
                      product={p}
                      selected={selected.includes(p._id) || isAll}
                      selectable={!isAll}
                      onClick={() => toggleSelect(p._id)}
                      currency={currency}
                    />
                  ))}
                </div>
              </div>

              {/* Selection status */}
              {!isAll && (
                <div style={{
                  fontSize: '.82rem', fontWeight: 600,
                  color: selected.length === needed ? '#16a34a' : '#888',
                  marginBottom: 16,
                }}>
                  {selected.length === needed
                    ? `✓ ${needed} flavours selected — ready to add`
                    : `Choose ${needed - selected.length} more flavour${needed - selected.length > 1 ? 's' : ''}`}
                </div>
              )}
            </div>

            {/* RIGHT — order summary */}
            <div style={{ position: 'sticky', top: 88 }}>
              <div style={{
                background: isFeatured ? '#0a0a0a' : '#f9f9f9',
                color: isFeatured ? '#fff' : '#0a0a0a',
                borderRadius: 20, padding: '32px 28px',
                border: isFeatured ? 'none' : '1.5px solid #efefef',
              }}>
                <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', opacity: .4, marginBottom: 10 }}>
                  Order Summary
                </div>

                {/* Items list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {(isAll ? products : selectedProducts).map(p => (
                    <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', background: '#fff', flexShrink: 0 }}>
                        <img src={fixImageUrl(p.image)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '.8rem', fontWeight: 600, opacity: .9 }}>{p.name.replace(/crunz/i, '').trim()}</div>
                        <div style={{ fontSize: '.72rem', opacity: .45 }}>{p.flavor}</div>
                      </div>
                      <div style={{ fontSize: '.82rem', fontWeight: 700 }}>
                        {formatPrice(p[priceKey], currency)}
                      </div>
                    </div>
                  ))}
                  {!isAll && selected.length < needed && (
                    Array.from({ length: needed - selected.length }).map((_, i) => (
                      <div key={`empty-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: isFeatured ? 'rgba(255,255,255,.08)' : '#efefef', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '.85rem', opacity: .3 }}>?</span>
                        </div>
                        <div style={{ fontSize: '.8rem', opacity: .35, fontStyle: 'italic' }}>Select a flavour</div>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ height: 1, background: isFeatured ? 'rgba(255,255,255,.1)' : '#efefef', marginBottom: 16 }} />

                {/* Price breakdown */}
                {subtotal > 0 && (
                  <>
                    {discountedPrice !== null && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', opacity: .55, marginBottom: 6 }}>
                          <span>Subtotal ({selectedProducts.length} items)</span>
                          <span style={{ textDecoration: 'line-through' }}>{sym}{subtotal.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', color: '#4ade80', marginBottom: 10, fontWeight: 600 }}>
                          <span>Bundle discount ({discountPct}% off)</span>
                          <span>−{sym}{savings.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <span style={{ fontSize: '.9rem', fontWeight: 700, opacity: .7 }}>Total</span>
                      <span style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-1px' }}>{sym}{finalPrice.toFixed(2)}</span>
                    </div>
                  </>
                )}
                {subtotal === 0 && (
                  <div style={{ textAlign: 'center', opacity: .35, fontSize: '.85rem', marginBottom: 20, paddingBottom: 4 }}>
                    Select flavours to see price
                  </div>
                )}

                {/* CTA buttons */}
                <button
                  onClick={handleBuyNow}
                  disabled={!canAdd}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 11, border: 'none',
                    background: canAdd ? (isFeatured ? '#fff' : '#0a0a0a') : (isFeatured ? 'rgba(255,255,255,.2)' : '#e0e0e0'),
                    color: isFeatured ? '#0a0a0a' : '#fff',
                    fontFamily: 'Inter,sans-serif', fontWeight: 800, fontSize: '.95rem',
                    cursor: canAdd ? 'pointer' : 'default',
                    transition: 'opacity .15s', marginBottom: 10,
                    opacity: canAdd ? 1 : .5,
                  }}
                >
                  Buy Now →
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!canAdd || added}
                  style={{
                    width: '100%', padding: '13px', borderRadius: 11,
                    background: added ? '#16a34a' : 'transparent',
                    color: added ? '#fff' : (isFeatured ? 'rgba(255,255,255,.8)' : '#0a0a0a'),
                    border: `2px solid ${added ? '#16a34a' : (isFeatured ? 'rgba(255,255,255,.25)' : '#e8e8e8')}`,
                    fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: '.9rem',
                    cursor: canAdd && !added ? 'pointer' : 'default',
                    transition: 'all .2s',
                    opacity: !canAdd ? .4 : 1,
                  }}
                >
                  {added ? '✓ Added to Cart!' : `Add to Cart${canAdd && subtotal > 0 ? ` · ${sym}${finalPrice.toFixed(2)}` : ''}`}
                </button>

                {/* Delivery note */}
                <div style={{ textAlign: 'center', fontSize: '.72rem', opacity: .4, marginTop: 14, lineHeight: 1.5 }}>
                  Free delivery on orders over {currency === 'INR' ? '₹500' : '£25'} · Secure checkout
                </div>
              </div>

              {/* Bundle switch pills */}
              <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {buildBundles(products).map(b => (
                  <Link key={b.id} href={`/bundle/${b.id}`} style={{
                    textDecoration: 'none', padding: '6px 14px', borderRadius: 100,
                    background: b.id === bundleDef.id ? '#0a0a0a' : '#f0f0f0',
                    color: b.id === bundleDef.id ? '#fff' : '#0a0a0a',
                    fontSize: '.72rem', fontWeight: 700, transition: 'all .15s',
                  }}>
                    {b.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Individual Products section ── */}
        <section style={{ background: '#fafafa', padding: '56px 5%' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', opacity: .4, marginBottom: 8 }}>
                Also Purchase
              </div>
              <h2 style={{ fontSize: 'clamp(1.3rem,2.5vw,1.9rem)', fontWeight: 900, letterSpacing: '-1px' }}>
                Individual Packs
              </h2>
              <p style={{ fontSize: '.88rem', opacity: .5, marginTop: 6, lineHeight: 1.5 }}>
                Add extra packs of your favourite flavour to your order.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }} className="bd-related-grid">
              {products.map(p => (
                <IndividualCard
                  key={p._id}
                  product={p}
                  currency={currency}
                  onNavigate={() => router.push(`/product/${toSlug(p.name)}`)}
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer content={content} />
      <Cart content={content} />
      <CheckoutModal content={content} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />

      <style>{`
        @media (max-width: 900px) {
          .bd-hero-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
        @media (max-width: 640px) {
          .bd-chips-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .bd-related-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 400px) {
          .bd-related-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

/* ─── Page wrapper ─── */
function BundlePage() {
  const { type } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts]   = useState([]);
  const [content, setContent]     = useState({});
  const [bundleDef, setBundleDef] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/products'),
      api.get('/content').catch(() => ({})),
    ]).then(([allProducts, c]) => {
      const inStock = allProducts.filter(p => p.inStock !== false);
      setProducts(inStock);
      setContent(c);
      const bundles = buildBundles(inStock);
      const def = bundles.find(b => b.id === type);
      if (def) {
        setBundleDef({ ...def, count: def.type === 'all' ? inStock.length : def.count });
      } else {
        setNotFound(true);
      }
    }).catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [type]);

  if (loading) return <PageLoader />;

  if (notFound || !bundleDef) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: '2.5rem' }}>📦</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>Bundle not found</div>
        <Link href="/" style={{ color: '#0a0a0a', fontWeight: 600, fontSize: '.9rem' }}>← Go Home</Link>
      </div>
    );
  }

  return (
    <AnalyticsProvider userId={user?._id}>
      <BundleDetailContent products={products} content={content} bundleDef={bundleDef} />
    </AnalyticsProvider>
  );
}

export default BundlePage;
