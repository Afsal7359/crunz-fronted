'use client';
import { createContext, useContext, useEffect, useRef, useCallback } from 'react';

const AnalyticsContext = createContext(null);

function getDevice() {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function getBrowser() {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/edg/i.test(ua))     return 'Edge';
  if (/chrome/i.test(ua))  return 'Chrome';
  if (/firefox/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua))  return 'Safari';
  if (/opera/i.test(ua))   return 'Opera';
  return 'Other';
}

function getOrCreateSession() {
  if (typeof window === 'undefined') return { sessionId: 'ssr', isNew: false };
  let sessionId = sessionStorage.getItem('crunz_sid');
  let isNew = false;
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('crunz_sid', sessionId);
    isNew = true;
  }
  return { sessionId, isNew };
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5006/api';

async function sendEvent(payload) {
  try {
    await fetch(`${API}/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {/* silent — never break the app */}
}

export function AnalyticsProvider({ children, userId }) {
  const sessionRef  = useRef(null);
  const startRef    = useRef(Date.now());
  const userIdRef   = useRef(userId);  // always up-to-date userId for track()
  const device      = typeof window !== 'undefined' ? getDevice() : 'desktop';
  const browser     = getBrowser();

  // Keep userIdRef in sync whenever user logs in/out
  useEffect(() => { userIdRef.current = userId; }, [userId]);

  // Track user_identified when user logs in mid-session
  useEffect(() => {
    if (!userId || !sessionRef.current) return;
    sendEvent({
      sessionId: sessionRef.current, event: 'user_identified',
      page: typeof window !== 'undefined' ? window.location.pathname : '/',
      device, browser, userId,
    });
  }, [userId]);

  useEffect(() => {
    const { sessionId, isNew } = getOrCreateSession();
    sessionRef.current = sessionId;
    startRef.current   = Date.now();

    // Fetch location once per session
    const fetchLocation = async () => {
      try {
        const cached = sessionStorage.getItem('crunz_loc');
        if (cached) return JSON.parse(cached);
        const r = await fetch('https://ipapi.co/json/');
        if (!r.ok) return {};
        const d = await r.json();
        const loc = {
          country:     d.country_name || '',
          countryCode: d.country_code || '',
          city:        d.city         || '',
          region:      d.region       || '',
          latitude:    d.latitude     || null,
          longitude:   d.longitude    || null,
          timezone:    d.timezone     || '',
        };
        sessionStorage.setItem('crunz_loc', JSON.stringify(loc));
        return loc;
      } catch { return {}; }
    };

    const init = async () => {
      const loc = isNew ? await fetchLocation() : (() => {
        try { return JSON.parse(sessionStorage.getItem('crunz_loc') || '{}'); } catch { return {}; }
      })();

      if (isNew) {
        sendEvent({
          sessionId, event: 'session_start',
          page: window.location.pathname,
          device, browser, userId: userIdRef.current,
          ...loc,
        });
      }

      // Page view (always)
      sendEvent({
        sessionId, event: 'page_view',
        page: window.location.pathname,
        device, browser, userId: userIdRef.current,
        ...loc,
      });
    };
    init();

    // Session end on unload
    const handleUnload = () => {
      const duration = Math.round((Date.now() - startRef.current) / 1000);
      navigator.sendBeacon(`${API}/analytics/event`, JSON.stringify({
        sessionId, event: 'session_end',
        page: window.location.pathname,
        device, browser, userId: userIdRef.current, duration,
      }));
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);  // run once on mount only

  const track = useCallback((event, properties = {}) => {
    const sessionId = sessionRef.current;
    if (!sessionId) return;
    let loc = {};
    try { loc = JSON.parse(sessionStorage.getItem('crunz_loc') || '{}'); } catch {}
    sendEvent({
      sessionId, event,
      page: typeof window !== 'undefined' ? window.location.pathname : '/',
      properties, device, browser, userId: userIdRef.current,
      ...loc,
    });
  }, [device, browser]);

  return (
    <AnalyticsContext.Provider value={{ track }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) return { track: () => {} };
  return ctx;
}
