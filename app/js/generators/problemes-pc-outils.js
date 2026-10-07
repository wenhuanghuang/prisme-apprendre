/** Outils communs des générateurs de problèmes de physique-chimie (prénoms, élision, arrondis, écriture scientifique…). */
import { pick, clean, fr, mc, text, boundAnswer } from './gen-util.js';

export const PRENOMS = ['Sacha', 'Camille', 'Yanis', 'Zoé', 'Malo', 'Aya', 'Timéo', 'Lina', 'Nathan', 'Maëlys', 'Ilyes', 'Louise', 'Eden', 'Nour', 'Gabriel', 'Lou', 'Mathis', 'Sarah', 'Kenji', 'Awa'];
export const TROIS = ['classe', 'approfondissement', 'expert'];
// élision devant un prénom commençant par une voyelle : « la vitesse d’Ilyes », « qu’Eden » (pas devant Yanis).
// Même principe que elide() de problemes-outils.js, avec les prénoms de ce fichier (Awa n'y figure pas).
export const VOYELLE = PRENOMS.filter((n) => /^[AEIOUÉÈÊÎ]/.test(n));
export const ELISION = new RegExp(`(^|[\\s(])(de|que|De|Que) (${VOYELLE.join('|')})(?!\\p{L})`, 'gu');
export const ELIDE = { de: 'd’', De: 'D’', que: 'qu’', Que: 'Qu’' };
/** Applique l'élision à tous les textes d'un exercice (énoncés, questions, indices, corrections, idées fausses). */
export function elide(v) {
  if (typeof v === 'string') return v.replace(ELISION, (m, pre, w, n) => `${pre}${ELIDE[w]}${n}`);
  if (Array.isArray(v)) return v.map(elide);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, elide(x)]));
  return v;
}

/** Tire des valeurs jusqu'à ce qu'elles « tombent juste » (équivalent d'une boucle do … while bornée). */
export function until(draw, ok) {
  for (let i = 0; i < 5000; i++) { const v = draw(); if (ok(v)) return v; }
  throw new Error('problemes-pc : aucun tirage ne convient');
}
export const round = (x, d = 0) => clean(Math.round(x * 10 ** d) / 10 ** d);
export const isInt = (x, d = 0) => Math.abs(x * 10 ** d - Math.round(x * 10 ** d)) < 1e-6;
/** « = 12,5 » si le résultat tombe juste à d décimales, sinon « ≈ 12,3 ». */
export const eq = (x, d = 1) => (isInt(x, d) ? `= ${fr(x)}` : `≈ ${fr(round(x, d))}`);
/** Dans une phrase : « 16 » si le nombre tombe juste, sinon « environ 16,3 ». */
export const about = (x, d = 1) => (isInt(x, d) ? fr(x) : `environ ${fr(round(x, d))}`);
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
/** « 10⁷ », « 10⁻³ ». */
export const pow10 = (n) => `10${String(n).replace('-', '⁻').replace(/\d/g, (c) => SUP[c])}`;
/** Écriture scientifique d'un nombre positif : [a, n] avec x = a × 10ⁿ et 1 ≤ a < 10. */
export function sciParts(x) {
  let n = Math.floor(Math.log10(x) + 1e-12); let a = clean(x / 10 ** n);
  if (a >= 10) { a = clean(a / 10); n += 1; } else if (a < 1) { a = clean(a * 10); n -= 1; }
  return [a, n];
}
/** Écriture scientifique : sci(58e6) → « 5,8 × 10⁷ », sci(1.43e9) → « 1,43 × 10⁹ ». */
export const sci = (x) => { const [a, n] = sciParts(x); return `${fr(a)} × ${pow10(n)}`; };
/**
 * Tolérance d'une réponse arrondie à d décimales : la moitié du dernier chiffre (0,05 au dixième, 0,5 à l'unité),
 * élargie juste assez pour accepter aussi `alts`, les résultats obtenus en partant des réponses ARRONDIES
 * des questions précédentes (par exemple 2 × la durée arrondie d'un aller).
 */
export const tolRound = (exact, d, alts = []) => clean(Math.max(0.5 / 10 ** d, ...alts.map((a) => Math.abs(a - exact))) + 0.001 / 10 ** d);
/** Valeur LIMITE arrondie du côté sûr (voir boundAnswer) ; `gap` : vrai si la valeur exacte a dû être arrondie. */
export const bound = (exact, side, d = 0) => { const b = boundAnswer(exact, side, d); return { ...b, gap: Math.abs(exact - b.answer) > 1e-9 }; };
/** Résultat qui dépasse une limite, écrit avec assez de décimales pour que le dépassement se voie : « ≈ 30,04 ». */
export function beyond(x, lim) {
  for (let d = 1; d <= 6; d++) if (Math.abs(round(x, d) - lim) > 1e-9) return eq(x, d);
  return `≈ ${fr(x)}`;
}
export const clock = (min) => `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
export const yes = (b) => (b ? 'oui' : 'non');
/** Question fermée (oui / non) : la réponse contraire porte l'idée fausse. */
export const yesNo = (ok, prompt, id, error, feedback) => text([yes(ok)], { prompt, placeholder: 'oui ou non', misconceptions: [mc(yes(!ok), id, error, feedback)] });
/** make(rand, options, parcours) : un prénom, puis le niveau demandé (textes relus pour l'élision). */
export const tiered = (tiers) => (rand, o, tier) => elide((tiers[tier] || tiers.classe)(rand, pick(rand, PRENOMS)));
