'use client';
import { useState, useEffect } from 'react';
import { api, BACKEND_URL } from '@/lib/api';

const TEXT_FIELDS = [
  { key: 'announce',    label: 'Announcement Bar',     hint: 'Use · to separate items' },
  { key: 'hero_eyebrow', label: 'Hero Eyebrow Text',  hint: 'Small label above title' },
  { key: 'hero_title',  label: 'Hero Title',           hint: 'Main brand headline' },
  { key: 'hero_sub',    label: 'Hero Subtitle',        hint: 'Short tagline below title' },
  { key: 'hero_cta',    label: 'Hero Button Label',    hint: 'e.g. "Shop Now"' },
  { key: 'footer_tagline', label: 'Footer Tagline',    hint: 'Shown in the footer' },
  { key: 'whatsapp',    label: 'WhatsApp Number',      hint: 'Country code, no + (e.g. 447741940700)' },
  { key: 'email',       label: 'Contact Email',        hint: '' },
  { key: 'instagram',   label: 'Instagram URL',        hint: 'Full URL' },
  { key: 'free_delivery_threshold_gbp', label: 'Free Delivery Min (£)', hint: '' },
  { key: 'free_delivery_threshold_inr', label: 'Free Delivery Min (₹)', hint: '' },
];

export default function ContentAdmin() {
  const [content, setContent]   = useState({});
  const [slides, setSlides]     = useState([]);   // hero carousel slides
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(null); // index being uploaded

  useEffect(() => {
    api.get('/admin/content').then(d => {
      setContent(d);
      try { setSlides(d.hero_slides ? JSON.parse(d.hero_slides) : []); } catch { setSlides([]); }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const setField = key => e => setContent(c => ({ ...c, [key]: e.target.value }));

  // ── Slide helpers ──────────────────────────────────────────────
  const addImageSlide = () => setSlides(s => [...s, { type: 'image', src: '', label: '' }]);
  const addTextSlide  = () => setSlides(s => [...s, { type: 'text',  text: '', label: '' }]);
  const removeSlide   = i  => setSlides(s => s.filter((_, idx) => idx !== i));
  const updateSlide   = (i, key, val) => setSlides(s => s.map((sl, idx) => idx === i ? { ...sl, [key]: val } : sl));
  const moveSlide     = (i, dir) => {
    const next = [...slides];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setSlides(next);
  };

  const handleUploadSlide = async (e, i) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(i);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const d = await api.upload('/upload', fd);
      updateSlide(i, 'src', d.url);
    } catch (err) { alert(err.message); }
    setUploading(null);
  };

  // ── Save ───────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      await api.put('/admin/content', {
        ...content,
        hero_slides: JSON.stringify(slides)
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', opacity: .4 }}>Loading…</div>;

  return (
    <div>
      <div className="admin-topbar">
        <div className="admin-page-title">Site Content</div>
        <button className="act-btn primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save All Changes'}
        </button>
      </div>

      {/* ── Hero Carousel Slides ───────────────────────────────── */}
      <div className="admin-form-wrap" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-.4px' }}>Hero Carousel Slides</div>
            <div style={{ fontSize: '.78rem', opacity: .45, marginTop: 2 }}>Auto-scrolls every 3 seconds. Drag to reorder. Leave empty to use product images.</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="act-btn" onClick={addImageSlide}>+ Image Slide</button>
            <button className="act-btn" onClick={addTextSlide}>+ Text Slide</button>
          </div>
        </div>

        {slides.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', opacity: .35, fontSize: '.85rem', border: '1px dashed #e8e8e8', borderRadius: 8 }}>
            No custom slides — product images are used by default.<br />Click "+ Image Slide" or "+ Text Slide" to add custom slides.
          </div>
        )}

        {slides.map((slide, i) => (
          <div key={i} style={{ border: '1px solid #e8e8e8', borderRadius: 10, padding: 18, marginBottom: 12, background: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ background: '#0a0a0a', color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: '.65rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
                  {slide.type === 'text' ? '✏️ Text' : '🖼 Image'} · Slide {i + 1}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="act-btn" onClick={() => moveSlide(i, -1)} disabled={i === 0} title="Move up">↑</button>
                <button className="act-btn" onClick={() => moveSlide(i, 1)} disabled={i === slides.length - 1} title="Move down">↓</button>
                <button className="act-btn danger" onClick={() => removeSlide(i)}>Remove</button>
              </div>
            </div>

            {slide.type === 'image' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="fl">Image</label>
                  {slide.src && (
                    <img src={slide.src} alt="" style={{ width: '100%', height: 140, objectFit: 'contain', background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', padding: 8, marginBottom: 8 }} />
                  )}
                  <input type="file" accept="image/*" className="fi" style={{ padding: '8px 10px', marginBottom: 8 }}
                    onChange={e => handleUploadSlide(e, i)} />
                  {uploading === i && <div style={{ fontSize: '.75rem', opacity: .5 }}>Uploading…</div>}
                  <input className="fi" placeholder="Or paste image URL" value={slide.src}
                    onChange={e => updateSlide(i, 'src', e.target.value)} style={{ marginTop: 4 }} />
                </div>
                <div>
                  <div className="fg">
                    <label className="fl">Slide Label (optional)</label>
                    <input className="fi" placeholder="e.g. Spanish Tomato" value={slide.label || ''}
                      onChange={e => updateSlide(i, 'label', e.target.value)} />
                    <div className="form-hint">Shown as caption overlay at bottom of image</div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="fg">
                  <label className="fl">Text Content</label>
                  <textarea className="fi" style={{ minHeight: 80, resize: 'vertical' }}
                    placeholder="e.g. The Ultimate Crunch In Every Bite"
                    value={slide.text || ''} onChange={e => updateSlide(i, 'text', e.target.value)} />
                  <div className="form-hint">Large bold text shown on the slide</div>
                </div>
                <div className="fg">
                  <label className="fl">Background Color (optional)</label>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input type="color" value={slide.bg || '#fafafa'} onChange={e => updateSlide(i, 'bg', e.target.value)}
                      style={{ width: 44, height: 38, border: '1px solid #e8e8e8', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
                    <input className="fi" value={slide.bg || '#fafafa'} onChange={e => updateSlide(i, 'bg', e.target.value)} placeholder="#fafafa" style={{ maxWidth: 120 }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {slides.length > 0 && (
          <button className="act-btn primary" onClick={handleSave} disabled={saving} style={{ marginTop: 4 }}>
            {saving ? 'Saving…' : 'Save Slides'}
          </button>
        )}
      </div>

      {/* ── Text Content Fields ────────────────────────────────── */}
      <div className="admin-form-wrap">
        <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-.4px', marginBottom: 20 }}>Text & Settings</div>
        {TEXT_FIELDS.map(field => (
          <div key={field.key} className="fg">
            <label className="fl">{field.label}</label>
            <input className="fi" value={content[field.key] || ''} onChange={setField(field.key)} placeholder={field.hint} />
            {field.hint && <div className="form-hint">{field.hint}</div>}
          </div>
        ))}
        <button className="act-btn primary" onClick={handleSave} disabled={saving} style={{ marginTop: 8 }}>
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
