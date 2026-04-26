/**
 * Convert a product name to a URL-safe slug.
 * e.g. "Crunz Spanish Tomato" → "spanish-tomato"
 */
export function toSlug(name = '') {
  return name
    .toLowerCase()
    .replace(/crunz\s*/gi, '')   // strip brand name
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // non-alphanum → dash
    .replace(/^-+|-+$/g, '');    // trim leading/trailing dashes
}

/**
 * Find a product from a list by matching its slug.
 */
export function findBySlug(products = [], slug = '') {
  return products.find(p => toSlug(p.name) === slug) || null;
}
