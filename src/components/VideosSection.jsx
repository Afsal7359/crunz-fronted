'use client';
import { useEffect, useRef } from 'react';

/** Extract YouTube video ID from any YT URL format */
function getYouTubeId(url = '') {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

function getEmbedUrl(url) {
  const id = getYouTubeId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
}

export default function VideosSection({ content = {} }) {
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); }),
      { threshold: 0.07 }
    );
    ref.current?.querySelectorAll('.rv').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Read up to 3 video entries from content
  const videos = [
    { url: content.video_1_url, title: content.video_1_title || '' },
    { url: content.video_2_url, title: content.video_2_title || '' },
    { url: content.video_3_url, title: content.video_3_title || '' },
  ].filter(v => v.url && getYouTubeId(v.url));

  const hasVideos = videos.length > 0;

  return (
    <section id="videos" ref={ref} style={{ background: '#0a0a0a', padding: '80px 0', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 5%' }}>

        {/* Header */}
        <div className="rv" style={{ marginBottom: hasVideos ? 48 : 0 }}>
          <div style={{
            fontSize: '.68rem', fontWeight: 700, letterSpacing: 3,
            textTransform: 'uppercase', color: 'rgba(255,255,255,.3)',
            marginBottom: 10,
          }}>Watch &amp; Learn</div>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900,
            letterSpacing: '-2px', color: '#fff', lineHeight: 1.02,
            marginBottom: 14,
          }}>
            See Crunz<br />in action.
          </h2>
          <p style={{
            fontSize: '.95rem', color: 'rgba(255,255,255,.45)',
            maxWidth: 460, lineHeight: 1.7,
          }}>
            From farm to bag — watch how we make the crunchiest banana chips you&apos;ve ever tasted.
          </p>
        </div>

        {/* Videos grid */}
        {hasVideos ? (
          <div
            className="rv"
            style={{
              display: 'grid',
              gridTemplateColumns: videos.length === 1
                ? '1fr'
                : videos.length === 2
                ? '1fr 1fr'
                : 'repeat(3, 1fr)',
              gap: 20,
            }}
          >
            {videos.map((v, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  position: 'relative',
                  paddingBottom: '56.25%', /* 16:9 */
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: '#111',
                  border: '1px solid rgba(255,255,255,.08)',
                }}>
                  <iframe
                    src={getEmbedUrl(v.url)}
                    title={v.title || `Crunz Video ${i + 1}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{
                      position: 'absolute', inset: 0,
                      width: '100%', height: '100%',
                      border: 'none',
                    }}
                  />
                </div>
                {v.title && (
                  <div style={{ color: 'rgba(255,255,255,.65)', fontSize: '.85rem', fontWeight: 600, paddingLeft: 2 }}>
                    {v.title}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Placeholder when no videos configured */
          <div className="rv" style={{
            marginTop: 48,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
          }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{
                aspectRatio: '16/9',
                borderRadius: 16,
                background: 'rgba(255,255,255,.04)',
                border: '1px dashed rgba(255,255,255,.12)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 10,
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="1.5">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.2)', fontWeight: 600 }}>
                  Video {n}
                </span>
              </div>
            ))}
            <style>{`@media(max-width:640px){ .vid-ph-grid { grid-template-columns: 1fr !important; } }`}</style>
          </div>
        )}
      </div>

      <style>{`
        #videos .rv { opacity: 0; transform: translateY(24px); transition: opacity .6s ease, transform .6s ease; }
        #videos .rv.vis { opacity: 1; transform: none; }
        @media(max-width: 768px) {
          #videos > div > div:last-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
