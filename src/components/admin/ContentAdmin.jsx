'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const TEXT_FIELDS = [
  { key: 'announce',       label: 'Announcement Bar',           hint: 'Use · to separate items' },
  { key: 'hero_eyebrow',   label: 'Hero Eyebrow',               hint: 'Small label e.g. Premium Banana Chips · Preston, UK' },
  { key: 'hero_title',     label: 'Hero Title',                  hint: 'Main headline e.g. CRUNZ' },
  { key: 'hero_cta',       label: 'Hero Button Label',           hint: 'e.g. Shop Now' },
  { key: 'footer_tagline', label: 'Footer Tagline',              hint: 'Shown in the footer' },
];

const CONTACT_FIELDS = [
  { key: 'contact_location', label: 'Location',                  hint: 'e.g. Preston, United Kingdom' },
  { key: 'contact_phone',    label: 'Phone / WhatsApp Display',  hint: 'e.g. +44 7741 940 700' },
  { key: 'whatsapp',         label: 'WhatsApp Number',           hint: 'Country code, no + (e.g. 447741940700)' },
  { key: 'email',            label: 'Contact Email',              hint: '' },
  { key: 'instagram',        label: 'Instagram URL',              hint: 'Full URL' },
];

const DELIVERY_FIELDS = [
  { key: 'delivery_charge_gbp',         label: 'Delivery Charge (£)',     hint: 'e.g. 3.99' },
  { key: 'free_delivery_threshold_gbp', label: 'Free Delivery Above (£)', hint: 'e.g. 25' },
  { key: 'delivery_charge_inr',         label: 'Delivery Charge (₹)',     hint: 'e.g. 99' },
  { key: 'free_delivery_threshold_inr', label: 'Free Delivery Above (₹)', hint: 'e.g. 500' },
];

// ── Slide manager ──────────────────────────────────────────────────
function SlideManager({ slides, setSlides, title, hint, emptyNote, onSave, saving, saved, saveLabel }) {
  const [uploading, setUploading] = useState(null);

  const addImage = () => setSlides(s => [...s, { type: 'image', src: '', label: '' }]);
  const addText  = () => setSlides(s => [...s, { type: 'text',  text: '', bg: '#fafafa' }]);
  const remove   = i  => setSlides(s => s.filter((_, idx) => idx !== i));
  const update   = (i, key, val) => setSlides(s => s.map((sl, idx) => idx === i ? { ...sl, [key]: val } : sl));
  const move     = (i, dir) => {
    const next = [...slides]; const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]]; setSlides(next);
  };
  const handleUpload = async (e, i) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(i);
    const fd = new FormData(); fd.append('image', file);
    try { const d = await api.upload('/upload', fd); update(i, 'src', d.url); }
    catch (err) { alert(err.message); }
    setUploading(null);
  };

  return (
    <div className="admin-form-wrap" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-.4px' }}>{title}</div>
          {hint && <div style={{ fontSize: '.78rem', opacity: .45, marginTop: 3, maxWidth: 500 }}>{hint}</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 16 }}>
          <button className="act-btn" onClick={addImage}>+ Image Slide</button>
          <button className="act-btn" onClick={addText}>+ Text Slide</button>
        </div>
      </div>

      {slides.length === 0 && (
        <div style={{ textAlign: 'center', padding: '28px 0', opacity: .35, fontSize: '.85rem', border: '1px dashed #e8e8e8', borderRadius: 8 }}>
          {emptyNote}
        </div>
      )}

      {slides.map((slide, i) => (
        <div key={i} style={{ border: '1px solid #e8e8e8', borderRadius: 10, padding: 18, marginBottom: 12, background: '#fafafa' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ background: '#0a0a0a', color: '#fff', borderRadius: 4, padding: '2px 10px', fontSize: '.65rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
              {slide.type === 'text' ? '✏️ Text' : '🖼 Image'} · Slide {i + 1}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="act-btn" onClick={() => move(i, -1)} disabled={i === 0} title="Move up">↑</button>
              <button className="act-btn" onClick={() => move(i, 1)}  disabled={i === slides.length - 1} title="Move down">↓</button>
              <button className="act-btn danger" onClick={() => remove(i)}>Remove</button>
            </div>
          </div>

          {slide.type === 'image' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label className="fl">Image</label>
                {slide.src && (
                  <img src={slide.src} alt="" style={{ width: '100%', height: 140, objectFit: 'contain', background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', padding: 8, marginBottom: 8 }} />
                )}
                <input type="file" accept="image/*" className="fi" style={{ padding: '8px 10px', marginBottom: 6 }}
                  onChange={e => handleUpload(e, i)} />
                {uploading === i && <div style={{ fontSize: '.75rem', opacity: .5, marginBottom: 4 }}>Uploading…</div>}
                <input className="fi" placeholder="Or paste image URL" value={slide.src || ''}
                  onChange={e => update(i, 'src', e.target.value)} style={{ marginTop: 4 }} />
              </div>
              <div>
                <label className="fl">Caption (optional)</label>
                <input className="fi" placeholder="e.g. Spanish Tomato" value={slide.label || ''}
                  onChange={e => update(i, 'label', e.target.value)} />
                <div className="form-hint">Shown as overlay at bottom of image</div>
              </div>
            </div>
          )}

          {slide.type === 'text' && (
            <div>
              <div className="fg">
                <label className="fl">Text Content</label>
                <textarea className="fi" style={{ minHeight: 90, resize: 'vertical' }}
                  placeholder="e.g. The Ultimate Crunch In Every Bite"
                  value={slide.text || ''} onChange={e => update(i, 'text', e.target.value)} />
              </div>
              <div className="fg">
                <label className="fl">Background Color</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input type="color" value={slide.bg || '#fafafa'}
                    onChange={e => update(i, 'bg', e.target.value)}
                    style={{ width: 44, height: 38, border: '1px solid #e8e8e8', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
                  <input className="fi" value={slide.bg || '#fafafa'}
                    onChange={e => update(i, 'bg', e.target.value)} style={{ maxWidth: 120 }} />
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      <button className="act-btn primary" onClick={onSave} disabled={saving} style={{ marginTop: 4 }}>
        {saving ? 'Saving…' : saved ? '✓ Saved!' : saveLabel || 'Save Slides'}
      </button>
    </div>
  );
}

// ── Main ContentAdmin ───────────────────────────────────────────────
export default function ContentAdmin() {
  const [content, setContent]       = useState({});
  const [heroSlides, setHeroSlides] = useState([]);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    api.get('/admin/content').then(d => {
      setContent(d);
      try { setHeroSlides(d.hero_slides ? JSON.parse(d.hero_slides) : []); } catch { setHeroSlides([]); }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const setField = key => e => setContent(c => ({ ...c, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      await api.put('/admin/content', {
        ...content,
        hero_slides: JSON.stringify(heroSlides),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const SaveBtn = ({ label = 'Save All Changes' }) => (
    <button className="act-btn primary" onClick={handleSave} disabled={saving} style={{ marginTop: 8 }}>
      {saving ? 'Saving…' : saved ? '✓ Saved!' : label}
    </button>
  );

  if (loading) return <div style={{ padding: 40, textAlign: 'center', opacity: .4 }}>Loading…</div>;

  return (
    <div>
      <div className="admin-topbar">
        <div className="admin-page-title">Site Content</div>
        <SaveBtn />
      </div>

      {/* ── 1. Hero Banner Slides ──────────────────────────────────── */}
      <SlideManager
        slides={heroSlides}
        setSlides={setHeroSlides}
        title="Hero Banner — Slides"
        hint="Full-width banner slides. Add images (cover fill) or text slides. Multiple slides auto-scroll infinitely. If empty, product images are used."
        emptyNote="No custom slides — product images are used by default. Click '+ Image Slide' or '+ Text Slide' to add custom banner slides."
        onSave={handleSave}
        saving={saving}
        saved={saved}
        saveLabel="Save Banner Slides"
      />

      {/* ── 2. Hero Text Overlay ───────────────────────────────────── */}
      <div className="admin-form-wrap" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-.4px', marginBottom: 4 }}>Hero Text Overlay</div>
        <div style={{ fontSize: '.78rem', opacity: .45, marginBottom: 18 }}>Text shown over the banner at bottom-left (eyebrow label, main title, button).</div>
        {TEXT_FIELDS.map(field => (
          <div key={field.key} className="fg">
            <label className="fl">{field.label}</label>
            <input className="fi" value={content[field.key] || ''} onChange={setField(field.key)} placeholder={field.hint} />
            {field.hint && <div className="form-hint">{field.hint}</div>}
          </div>
        ))}
        <SaveBtn label="Save Text Fields" />
      </div>

      {/* ── 3. Delivery Charges ────────────────────────────────────── */}
      <div className="admin-form-wrap" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-.4px', marginBottom: 4 }}>Delivery Charges</div>
        <div style={{ fontSize: '.78rem', opacity: .45, marginBottom: 18 }}>Set charges and free-delivery thresholds per currency.</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: '#fafafa', border: '1px solid #e8e8e8', borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 14, fontSize: '.85rem' }}>🇬🇧 GBP — UK Customers</div>
            {DELIVERY_FIELDS.filter(f => f.key.includes('gbp')).map(field => (
              <div key={field.key} className="fg">
                <label className="fl">{field.label}</label>
                <input className="fi" type="number" step="0.01" min="0" value={content[field.key] || ''} onChange={setField(field.key)} placeholder={field.hint} />
                <div className="form-hint">{field.hint}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#fafafa', border: '1px solid #e8e8e8', borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 14, fontSize: '.85rem' }}>🇮🇳 INR — Indian Customers</div>
            {DELIVERY_FIELDS.filter(f => f.key.includes('inr')).map(field => (
              <div key={field.key} className="fg">
                <label className="fl">{field.label}</label>
                <input className="fi" type="number" step="1" min="0" value={content[field.key] || ''} onChange={setField(field.key)} placeholder={field.hint} />
                <div className="form-hint">{field.hint}</div>
              </div>
            ))}
          </div>
        </div>
        <SaveBtn label="Save Delivery Settings" />
      </div>

      {/* ── 4. Contact & Social ────────────────────────────────────── */}
      <div className="admin-form-wrap">
        <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-.4px', marginBottom: 4 }}>Contact & Social</div>
        <div style={{ fontSize: '.78rem', opacity: .45, marginBottom: 18 }}>Shown in the Contact section and footer.</div>
        {CONTACT_FIELDS.map(field => (
          <div key={field.key} className="fg">
            <label className="fl">{field.label}</label>
            <input className="fi" value={content[field.key] || ''} onChange={setField(field.key)} placeholder={field.hint} />
            {field.hint && <div className="form-hint">{field.hint}</div>}
          </div>
        ))}
        <SaveBtn label="Save Contact Details" />
      </div>
    </div>
  );
}
