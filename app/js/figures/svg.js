/** Outils SVG partagés par les figures et les expériences animées. */
export const SVGNS = 'http://www.w3.org/2000/svg';

export function s(tag, attrs = {}, text) {
  const el = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null && v !== false) el.setAttribute(k, String(v));
  if (text !== undefined) el.textContent = String(text);
  return el;
}

const COLORS = {
  bleu: 'var(--maths)', rouge: 'var(--ko)', vert: 'var(--ok)', orange: 'var(--francais)', violet: 'var(--numerique)',
  gris: 'var(--ink-3)', noir: 'var(--ink)', jaune: 'var(--hg)', maths: 'var(--maths)', pc: 'var(--pc)', svt: 'var(--svt)',
  hg: 'var(--hg)', francais: 'var(--francais)', numerique: 'var(--numerique)',
};

/** Nom de couleur (docs/FIGURES.md) ou code hexadécimal → valeur CSS. */
export function color(c, fallback = 'var(--ink)') {
  if (!c) return fallback;
  if (COLORS[c]) return COLORS[c];
  return /^#[0-9a-f]{3,8}$/i.test(c) ? c : fallback;
}

export const fmt = (v) => (Math.round(v * 100) / 100).toLocaleString('fr-FR');
