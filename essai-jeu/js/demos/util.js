/** Petits outils de dessin des expériences (chaînes SVG). */

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const n = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
export const r1 = (v) => Math.round(v * 10) / 10;
export const frac = (v) => v - Math.floor(v);
/** Pseudo-hasard déterministe (même dessin à chaque image). */
export const rnd = (k) => frac(Math.sin(k * 127.1 + 311.7) * 43758.5453);

const NAMED = {
  eau: '#a9d8f5', bleu: '#3b82f6', rouge: '#e11d48', vert: '#22c55e', orange: '#f97316', violet: '#8b5cf6',
  jaune: '#facc15', gris: '#9ca3af', noir: '#1f2937', blanc: '#ffffff', marron: '#92400e', rose: '#f472b6',
  huile: '#f2c94c', glace: '#e3f4ff', cuivre: '#c2703d', fer: '#7c8794', bois: '#c8964f', sable: '#e9cf8f',
};
/** Couleur de contenu : nom (eau, rouge…) ou code hexadécimal. */
export function col(c, fallback = '#a9d8f5') {
  if (!c) return fallback;
  if (NAMED[c]) return NAMED[c];
  return typeof c === 'string' && /^#[0-9a-f]{3,8}$/i.test(c) ? c : fallback;
}

/** Nombre à la française (virgule), avec `dec` décimales. */
export function fr(v, dec = 0) {
  const x = n(v);
  const d = Math.max(0, Math.min(6, Math.round(n(dec)))); // toLocaleString refuse plus de 20 décimales
  return x.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }).replace('-', '−');
}

/** Étiquette posée au-dessus d'un objet. */
export function tag(x, y, text) {
  if (!text) return '';
  const w = Math.max(30, String(text).length * 7.4 + 14);
  return `<g class="d-tag"><rect x="${r1(x - w / 2)}" y="${r1(y - 11)}" width="${r1(w)}" height="22" rx="11"/><text x="${r1(x)}" y="${r1(y + 4.5)}" text-anchor="middle">${esc(text)}</text></g>`;
}

/** Afficheur numérique (thermomètre, balance, multimètre…). */
export function lcd(x, y, text, { w, cls = '' } = {}) {
  const width = w || Math.max(64, String(text).length * 10 + 18);
  return `<g class="d-lcd ${cls}"><rect x="${r1(x - width / 2)}" y="${r1(y - 15)}" width="${r1(width)}" height="30" rx="6"/><text x="${r1(x)}" y="${r1(y + 6)}" text-anchor="middle">${esc(text)}</text></g>`;
}

export function niceStep(range, target = 5) {
  const raw = range / target;
  const p = 10 ** Math.floor(Math.log10(raw || 1));
  const m = raw / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
}
