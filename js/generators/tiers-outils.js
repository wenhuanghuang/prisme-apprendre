/** Outils communs des niveaux ◆ et ✦ des générateurs de grandeurs et de physique-chimie. */
import { pick, clean, fr, mc, numeric, text } from './gen-util.js';

export const PRENOMS = ['Léa', 'Hugo', 'Inès', 'Noah', 'Jade', 'Adam', 'Sacha', 'Camille', 'Yanis', 'Lina', 'Maël', 'Zoé', 'Nina', 'Malo', 'Aya', 'Timéo', 'Lou', 'Ilyes'];
export const prenom = (rand) => pick(rand, PRENOMS);
export const round = (x, n = 2) => clean(Math.round(x * 10 ** n) / 10 ** n);
export const isRound = (x, n = 2) => Math.abs(x * 10 ** n - Math.round(x * 10 ** n)) < 1e-6;
/** Montant en euros : « 12 », « 4,50 ». */
export const eur = (x) => (Number.isInteger(clean(x)) ? fr(x) : fr(Math.trunc(clean(x))) + clean(x).toFixed(2).slice(-3).replace('.', ','));
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
/** « d’élèves », « de livres » */
export const de = (w) => (/^[aeiouyéèêâîôûœh]/i.test(w) ? `d’${w}` : `de ${w}`);
/** Valeur de l'option si elle est connue, sinon un tirage. */
export const choice = (rand, value, all) => (all.includes(value) ? value : pick(rand, all));
/** Durée en minutes écrite « 1 h 15 min ». */
export const hm = (min) => (min < 60 ? `${min} min` : `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}`);
/** Idées fausses lisibles : on écarte les valeurs impossibles à taper (trop petites, trop grandes). */
export const sane = (list) => list.filter((m) => typeof m.answer !== 'number'
  || (Number.isFinite(m.answer) && (m.answer === 0 || (m.answer >= 1e-5 && m.answer < 1e9))));
export const num = (answer, rest = {}) => numeric(answer, { ...rest, misconceptions: sane(rest.misconceptions || []) });
/** Question oui / non : la réponse contraire est l'idée fausse. */
export const yesNo = (yes, prompt, id, error, feedback) => text([yes ? 'oui' : 'non'], { prompt, misconceptions: [mc(yes ? 'non' : 'oui', id, error, feedback)] });
export const tableFig = (alt, head, rows) => ({ alt, items: [{ type: 'table', head, rows }] });
export const pt = (id, x, y, pos) => ({ type: 'point', id, x: clean(x), y: clean(y), pos });
export function frameAround(points) {
  const xs = points.map((p) => p[0]); const ys = points.map((p) => p[1]);
  const pad = 0.18 * Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  return { x: [clean(Math.min(...xs) - pad), clean(Math.max(...xs) + pad)], y: [clean(Math.min(...ys) - pad), clean(Math.max(...ys) + pad)] };
}

