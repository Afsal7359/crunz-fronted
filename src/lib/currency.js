'use client';

export function detectCurrencyFromTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (
      tz.includes('Calcutta') ||
      tz.includes('Kolkata') ||
      tz.startsWith('Asia/C') ||
      tz === 'Asia/Mumbai'
    ) {
      return 'INR';
    }
  } catch {}
  try {
    const lang = (navigator.language || '').toLowerCase();
    if (lang === 'hi' || lang.startsWith('hi-') || lang === 'en-in') return 'INR';
  } catch {}
  return 'GBP';
}

export function formatPrice(amount, currency) {
  if (!amount && amount !== 0) return '';
  if (currency === 'INR') {
    return `₹${Math.round(amount).toLocaleString('en-IN')}`;
  }
  return `£${Number(amount).toFixed(2)}`;
}

export function getProductPrice(product, currency) {
  return currency === 'INR' ? product.priceINR : product.priceGBP;
}

export function cartTotal(items, currency) {
  return items.reduce((sum, i) => {
    const price = currency === 'INR' ? i.priceINR : i.priceGBP;
    return sum + price * i.qty;
  }, 0);
}
