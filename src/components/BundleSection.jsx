'use client';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAnalytics } from '@/context/AnalyticsContext';
import { formatPrice } from '@/lib/currency';
import { fixImageUrl } from '@/lib/api';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

// ── helpers ───────────────────────────────────────────────────────────
function applyDiscount(price, pct) {
  if (!pct || Number(pct) <= 0) return null;   // null = no discount
  return Math.round((price * (1 - Number(pct) / 100)) * 100) / 100;
}

// ── Product image chip (equal size) ──────────────────────────────────
function ProductChip({ product, selected, selectable, onClick }) {
  return (
    <button
      onClick={selectable ? onClick : undefined}
      style={{
        all: 'unset',
        cursor: selectable ? 'pointer' : 'default',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        flex: '1 1 0',
      }}
    >
      <div style={{
        width: '100%', aspectRatio: '1', borderRadius: 12,
        overflow: 'hidden', background: '#f5f5f5',
        border: selected ? '2.5px solid #0a0a0a' : '2.5px solid transparent',
        opacity: selectable && !selected ? 0.45 : 1,
        transition: 'all .15s',
        position: 'relative',
      }}>
        <img
          src={fixImageUrl(product.image) || '/images/spanish-tomato.jpg'}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {selectable && selected && (
          <div style={{
            position: 'absolute', top: 4, right: 4,
            background: '#0a0a0a', color: '#fff',
            borderRadius: '50%', width: 18, height: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '.6rem', fontWeight: 900,
          }}>✓</div>
        )}
      </div>
      <span style={{
        fontSize: '.58rem', fontWeight: 600,
        textAlign: 'center', lineHeight: 1.2,
        color: selectable && !selected ? '#aaa' : 'inherit',
        maxWidth: 56, wordBreak: 'break-word',
      }}>
        {product.name.replace(/crunz/i, '').trim()}
      </span>
    </button>
  );
}

// ── Single bundle card ────────────────────────────────────────────────
function BundleCard({ bundle, products, currency, discountPct, isFeatured, isMobile }) {
  const { addToCart, setCartOpen } = useCart();
  const { track } = useAnalytics();
  const [selected, setSelected] = useState(
    bundle.type === 'all' ? products.map(p => p._id) : []
  );
  const [added, setAdded] = useState(false);

  const sym        = currency === 'INR' ? '₹' : '£';
  const priceKey   = currency === 'INR' ? 'priceINR' : 'priceGBP';
  const needed     = bundle.count;   // how many to pick
  const isAll      = bundle.type === 'all';

  const selectedProducts = isAll
    ? products
    : products.filter(p => selected.includes(p._id));

  const subtotal = selectedProducts.reduce((s, p) => s + (p[priceKey] || 0), 0);
  const discountedPrice = applyDiscount(subtotal, discountPct);
  const finalPrice = discountedPrice ?? subtotal;

  const toggleSelect = (id) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= needed) return [...prev.filter((_, i) => i !== 0), id]; // replace oldest
      return [...prev, id];
    });
  };

  const canAdd = isAll ? true : selected.length === needed;

  const handleAdd = () => {
    if (!canAdd) return;
    selectedProducts.forEach(p => addToCart(p, 1));
    track('add_to_cart', { bundle: bundle.id, items: selectedProducts.length, currency });
    setAdded(true);
    setTimeout(() => { setAdded(false); setCartOpen(true); }, 800);
  };

  const bg    = isFeatured ? '#0a0a0a' : '#fff';
  const fg    = isFeatured ? '#fff'    : '#0a0a0a';
  const subFg = isFeatured ? 'rgba(255,255,255,.45)' : '#888';
  const border = isFeatured ? 'none' : '1px solid #e8e8e8';

  return (
    <div style={{
      background: bg, color: fg, border,
      borderRadius: 20, padding: isFeatured && !isMobile ? '32px 24px 28px' : '22px 18px 20px',
      display: 'flex', flexDirection: 'column', gap: 0,
      position: 'relative', overflow: 'hidden',
      boxShadow: isFeatured ? '0 24px 64px rgba(0,0,0,.22)' : '0 2px 12px rgba(0,0,0,.05)',
      transform: isFeatured && !isMobile ? 'scale(1.04)' : 'scale(1)',
      transition: 'transform .2s, box-shadow .2s',
      zIndex: isFeatured ? 2 : 1,
    }}>
      {/* Badge */}
      {isFeatured && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          background: '#f59e0b', color: '#0a0a0a',
          textAlign: 'center', fontSize: '.65rem', fontWeight: 800,
          letterSpacing: '2px', textTransform: 'uppercase', padding: '6px 0',
          borderRadius: '20px 20px 0 0',
        }}>
          ⭐ Most Recommended
        </div>
      )}
      {bundle.id === 'trio' && !isFeatured && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: '#fef3c7', color: '#92400e',
          fontSize: '.62rem', fontWeight: 800, letterSpacing: '1.5px',
          textTransform: 'uppercase', padding: '4px 10px', borderRadius: 20,
        }}>Popular</div>
      )}

      <div style={{ marginTop: isFeatured && !isMobile ? 28 : 18 }}>
        {/* Tag + title */}
        <div style={{ fontSize: '.58rem', fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase', opacity: .35, marginBottom: 6 }}>
          {bundle.tag}
        </div>
        <div style={{ fontSize: isMobile ? '1rem' : (isFeatured ? '1.35rem' : '1.1rem'), fontWeight: 900, letterSpacing: '-.5px', marginBottom: 3 }}>
          {bundle.title}
        </div>
        <div style={{ fontSize: isMobile ? '.72rem' : '.8rem', color: subFg, marginBottom: isMobile ? 12 : 16 }}>
          {bundle.subtitle}
        </div>

        {/* Product images — equal size grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${products.length}, 1fr)`,
          gap: isMobile ? 4 : 8, marginBottom: isMobile ? 10 : 16,
        }}>
          {products.map(p => (
            <ProductChip
              key={p._id}
              product={p}
              selected={selected.includes(p._id) || isAll}
              selectable={!isAll}
              onClick={() => toggleSelect(p._id)}
            />
          ))}
        </div>

        {/* Selector hint */}
        {!isAll && (
          <div style={{
            fontSize: '.68rem', fontWeight: 600, marginBottom: isMobile ? 8 : 12,
            color: selected.length === needed ? (isFeatured ? '#4ade80' : '#16a34a') : subFg,
          }}>
            {selected.length === needed
              ? `✓ ${needed} selected`
              : `Choose ${needed - selected.length} more`}
          </div>
        )}

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: isMobile ? 10 : 14 }}>
          {subtotal > 0 ? (
            <>
              <div style={{ fontSize: isMobile ? '1.2rem' : (isFeatured ? '1.6rem' : '1.35rem'), fontWeight: 900, letterSpacing: '-1px' }}>
                {sym}{finalPrice.toFixed(2)}
              </div>
              {discountedPrice !== null && (
                <>
                  <div style={{ fontSize: '.78rem', textDecoration: 'line-through', opacity: .35 }}>
                    {sym}{subtotal.toFixed(2)}
                  </div>
                  <div style={{
                    background: isFeatured ? 'rgba(74,222,128,.2)' : '#dcfce7',
                    color: isFeatured ? '#4ade80' : '#16a34a',
                    fontSize: '.62rem', fontWeight: 800, padding: '2px 7px', borderRadius: 20,
                  }}>
                    -{discountPct}%
                  </div>
                </>
              )}
            </>
          ) : (
            <div style={{ fontSize: '.9rem', opacity: .4 }}>Select flavours</div>
          )}
        </div>

        {/* Add button */}
        <button
          onClick={handleAdd}
          disabled={!canAdd || added}
          style={{
            width: '100%', padding: isMobile ? '11px 0' : '13px 0', borderRadius: 10, border: 'none',
            background: added ? '#16a34a' : (isFeatured ? '#fff' : '#0a0a0a'),
            color: added ? '#fff' : (isFeatured ? '#0a0a0a' : '#fff'),
            fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: '.88rem',
            cursor: canAdd && !added ? 'pointer' : 'default',
            opacity: !canAdd ? .35 : 1,
            transition: 'all .2s',
          }}
        >
          {added
            ? '✓ Added to Cart!'
            : canAdd
            ? `Add to Cart · ${sym}${finalPrice.toFixed(2)}`
            : `Choose ${needed - selected.length} more`}
        </button>
      </div>
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────
export default function BundleSection({ products = [], content = {} }) {
  const { currency } = useCart();
  const isMobile = useIsMobile();

  const inStock = products.filter(p => p.inStock !== false);
  if (inStock.length < 2) return null;

  // Admin can disable entire section
  if (content.bundle_enabled === 'false') return null;

  // Discount values from admin (0 or empty = no discount shown)
  const disc2 = content.bundle_2_discount || '0';
  const disc3 = content.bundle_3_discount || '0';
  const disc4 = content.bundle_4_discount || '0';

  // Define bundles — layout order: [2-pick LEFT] [4-all CENTER] [3-pick RIGHT]
  const defs = [
    {
      id: 'starter', type: 'pick', count: 2,
      tag: 'Starter Pack', title: 'Pick 2 Flavours',
      subtitle: 'Perfect intro to Crunz',
    },
    {
      id: 'ultimate', type: 'all', count: inStock.length,
      tag: 'Best Value', title: `All ${inStock.length} Flavours`,
      subtitle: 'The full Crunz experience',
    },
    {
      id: 'trio', type: 'pick', count: 3,
      tag: 'Popular Pick', title: 'Pick 3 Flavours',
      subtitle: 'Our bestselling combo',
    },
  ].filter(b => b.type === 'all' || inStock.length >= b.count);

  const discMap = { starter: disc2, trio: disc3, ultimate: disc4 };

  return (
    <section style={{ padding: isMobile ? '40px 14px' : '80px 20px', background: '#fafafa', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, background: 'radial-gradient(circle,rgba(99,102,241,.05) 0%,transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 48 }}>
          <div style={{ display: 'inline-block', background: '#0a0a0a', color: '#fff', fontSize: '.6rem', fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 20, marginBottom: 12 }}>
            Bundle &amp; Save
          </div>
          <h2 style={{ fontSize: isMobile ? '1.7rem' : 'clamp(2rem,5vw,2.8rem)', fontWeight: 900, letterSpacing: '-1.5px', margin: '0 0 8px' }}>
            Choose Your Pack
          </h2>
          <p style={{ fontSize: isMobile ? '.82rem' : '.95rem', color: '#666', maxWidth: 340, margin: '0 auto', lineHeight: 1.5 }}>
            Tap a flavour to select it
          </p>
        </div>

        {/* Cards */}
        {isMobile ? (
          // Mobile: stack vertically, featured first
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[...defs].sort((a, b) => (b.type === 'all' ? 1 : 0) - (a.type === 'all' ? 1 : 0)).map(bundle => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                products={inStock}
                currency={currency}
                discountPct={discMap[bundle.id]}
                isFeatured={bundle.type === 'all'}
                isMobile={isMobile}
              />
            ))}
          </div>
        ) : (
          // Desktop: 3 columns, center featured
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(defs.length, 3)}, 1fr)`,
            gap: 20,
            alignItems: 'center',
          }}>
            {defs.map(bundle => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                products={inStock}
                currency={currency}
                discountPct={discMap[bundle.id]}
                isFeatured={bundle.type === 'all'}
                isMobile={false}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
