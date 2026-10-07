/** Outils communs des générateurs de problèmes de mathématiques (prénoms, montants, heures, élision…). */
import { pick, sample, clean, fr, frac, fracStr, numeric, text } from './gen-util.js';

export const PRENOMS = ['Léa', 'Hugo', 'Inès', 'Noah', 'Jade', 'Adam', 'Chloé', 'Rayan', 'Manon', 'Lucas'];
export const sum = (arr) => arr.reduce((a, b) => a + b, 0);

/* ------------------------------------------------------------------------------------------
 * Outils communs aux problèmes ci-dessous
 * ---------------------------------------------------------------------------------------- */

// prénoms variés ; les énoncés n'emploient jamais de pronom ni d'accord qui supposerait un genre
export const NOMS = ['Sacha', 'Camille', 'Inès', 'Yanis', 'Maël', 'Aya', 'Noa', 'Léo', 'Lina', 'Amadou', 'Zoé', 'Ilyes',
  'Mei', 'Tom', 'Fatou', 'Eden', 'Nina', 'Kenji', 'Lou', 'Samir', 'Alix', 'Jade', 'Rayan', 'Charlie'];
export const nom = (rand) => pick(rand, NOMS);
export const noms = (rand, n) => sample(rand, NOMS, n);
export const round = (x, k = 0) => clean(Math.round(x * 10 ** k) / 10 ** k);
/** Montant en euros : « 12 € », « 7,50 € ». */
export const eur = (x) => { const v = clean(x); return `${Number.isInteger(v) ? fr(v) : fr(round(v, 2)).replace(/,(\d)$/, ',$10')} €`; };
/** « 1 boule verte », « 3 boules vertes ». */
export const plur = (n, one, many) => `${fr(n)} ${n > 1 ? many : one}`;
/** Quotient écrit pour une correction : « 45 ÷ 4 ≈ 11,25 » ou « 12 ÷ 4 = 3 ». */
export const quot = (a, b) => `${fr(a)} ÷ ${fr(b)} ${Number.isInteger(clean(a / b)) ? '=' : '≈'} ${fr(round(a / b, 2))}`;
/** Durée en heures écrite « 7 h 30 ». */
export const hhmm = (t) => { const h = Math.floor(t + 1e-9); const m = Math.round((t - h) * 60); return `${h} h ${String(m).padStart(2, '0')}`; };
export const divisors = (n) => Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0);
export const isPrime = (n) => n > 1 && divisors(n).length === 2;
/** « 60 = 2 × 2 × 3 × 5 ». */
export function decomp(n) {
  const f = []; let m = n;
  for (let d = 2; m > 1; d++) while (m % d === 0) { f.push(d); m /= d; }
  return `${n} = ${f.join(' × ')}`;
}
/** Expression k·x + c écrite pour le correcteur (ASCII) : « 4*x + 7 », « x - 3 », « -5 ». */
export function lin(k, c) {
  const parts = [];
  if (k) parts.push(k === 1 ? 'x' : k === -1 ? '-x' : `${k}*x`);
  if (!parts.length) parts.push(String(c));
  else if (c) parts.push(c < 0 ? `- ${-c}` : `+ ${c}`);
  return parts.join(' ');
}
/** Question oui / non ; la mauvaise réponse est une idée fausse. */
export const yesNo = (ok, prompt, id, error, feedback) => text(ok ? ['oui'] : ['non'], { prompt, misconceptions: [{ answer: ok ? 'non' : 'oui', id, error, feedback }] });
/**
 * Réponse texte parmi plusieurs options : `accept` = toutes les formulations de la bonne option,
 * `wrongs` = [{ accept, id, error, feedback }] pour les autres (chaque formulation devient une idée fausse).
 */
export function choose(prompt, accept, wrongs) {
  return text(accept, { prompt, misconceptions: wrongs.flatMap((w) => w.accept.map((answer) => ({ answer, id: w.id, error: w.error || 'raisonnement', feedback: w.feedback }))) });
}
/** n/d a-t-elle une écriture décimale exacte ? (dénominateur irréductible sans autre facteur premier que 2 et 5) */
export function isDecimalFrac(n, d) {
  let q = frac(n, d)[1];
  while (q % 2 === 0) q /= 2;
  while (q % 5 === 0) q /= 5;
  return q === 1;
}
/** Tolérance d'une probabilité sans écriture décimale exacte : arrondi au centième (ou au pourcent). */
const PROBA_TOL = 0.005;
/** Consigne de forme d'une probabilité : les arrondis acceptés sont annoncés quand l'écriture décimale n'est pas exacte. */
export const probaForm = (n, d) => (isDecimalFrac(n, d)
  ? '(fraction, nombre décimal ou pourcentage)'
  : '(fraction, ou nombre décimal arrondi au centième, ou pourcentage arrondi à l’unité)');
/**
 * Probabilité n/d : réponse numérique, réponse type en fraction. La fraction exacte est toujours acceptée ;
 * sans écriture décimale exacte (5/12), l'arrondi au centième (0,42) et au pourcent (42 %) le sont aussi
 * (les idées fausses trop proches de la réponse pour être distinguées sont alors écartées).
 */
export function proba(n, d, rest = {}) {
  const f = frac(n, d); const p = f[0] / f[1];
  if (isDecimalFrac(n, d)) return { ...numeric(p, rest), generatedAnswer: { value: fracStr(f) } };
  const misconceptions = (rest.misconceptions || []).filter((m) => typeof m.answer !== 'number' || Math.abs(m.answer - p) > PROBA_TOL + 1e-9);
  return { ...numeric(p, { ...rest, tolerance: PROBA_TOL, misconceptions }), generatedAnswer: { value: fracStr(f) } };
}
/** « 2/8 = 1/4 » (forme simplifiée ajoutée si besoin) pour une correction. */
export const fracTxt = (n, d) => { const f = frac(n, d); return f[1] === d ? `${n}/${d}` : `${n}/${d} = ${fracStr(f)}`; };
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// élision devant un prénom commençant par une voyelle : « l’ombre d’Inès », « la probabilité qu’Aya » (pas devant Yanis)
export const VOYELLE = NOMS.filter((n) => /^[AEIOUÉÈÊÎ]/.test(n));
export const ELISION = new RegExp(`(^|[\\s(])(de|que) (${VOYELLE.join('|')})(?!\\p{L})`, 'gu');
export function elide(v) {
  if (typeof v === 'string') return v.replace(ELISION, (m, pre, w, n) => `${pre}${w === 'de' ? 'd’' : 'qu’'}${n}`);
  if (Array.isArray(v)) return v.map(elide);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, elide(x)]));
  return v;
}
/** make(rand, options, parcours) à partir d'une fonction par parcours (textes relus pour l'élision). */
export const byTier = (fns) => (rand, o, tier) => elide((fns[tier] || fns.classe)(rand, o));
/** Réponse type d'une durée ou d'une heure écrite comme un élève : « 7 h 30 ». */
export const asHour = (part, t) => ({ ...part, generatedAnswer: { value: hhmm(t) } });
export const ALL_TRACKS = ['classe', 'approfondissement', 'expert'];
