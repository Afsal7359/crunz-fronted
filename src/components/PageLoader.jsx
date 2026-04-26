'use client';

/**
 * Full-page loading screen — matches the initial app splash:
 * dark background · logo · animated progress bar
 */
export default function PageLoader() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0a0a0a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 36,
    }}>
      <img
        src="/images/logo.png"
        alt="Crunz"
        style={{ width: 140, height: 'auto', objectFit: 'contain' }}
      />
      <div style={{
        width: 160, height: 2,
        background: 'rgba(255,255,255,.15)',
        borderRadius: 2, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', background: '#fff', borderRadius: 2,
          animation: 'pl-bar 1.4s cubic-bezier(.4,0,.2,1) forwards',
        }} />
      </div>
      <style>{`
        @keyframes pl-bar { from { width: 0 } to { width: 100% } }
      `}</style>
    </div>
  );
}
