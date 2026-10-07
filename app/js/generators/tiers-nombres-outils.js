/** Outils communs des niveaux ◆ et ✦ des générateurs de nombres et de calcul littéral. */
import { ri, clean, fr, par, gcd, frac, fracStr, expression } from './gen-util.js';


export const near = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
/** Valeurs finies, toutes différentes de la réponse et entre elles. */
export function distinct(ans, vals) {
  const seen = [ans];
  for (const v of vals) {
    if (!Number.isFinite(v) || seen.some((s) => near(s, v))) return false;
    seen.push(v);
  }
  return true;
}
export const fval = ([n, d]) => n / d;
/** Fractions [num, dén] : la réponse et les idées fausses ont des valeurs deux à deux différentes. */
export const fdistinct = (ans, list) => list.every((f) => f[1] !== 0) && distinct(fval(ans), list.map(fval));
/** Polynômes [a0, a1, a2] deux à deux différents. */
export const pkey = (c) => [0, 1, 2].map((k) => clean(c[k] || 0)).join('|');
export function pdistinct(ans, list) {
  const keys = [ans, ...list].map(pkey);
  return new Set(keys).size === keys.length;
}
export const fadd = (x, y) => frac(x[0] * y[1] + y[0] * x[1], x[1] * y[1]);
export const fsub = (x, y) => frac(x[0] * y[1] - y[0] * x[1], x[1] * y[1]);
export const fmul = (x, y) => frac(x[0] * y[0], x[1] * y[1]);
export const fdiv = (x, y) => frac(x[0] * y[1], x[1] * y[0]);
export const fneg = (x) => [-x[0], x[1]];
/** Fraction à afficher dans une formule ; entre parenthèses dans un produit ou un quotient. */
export const fm = (f) => fracStr(f).replace('-', '−');
export const fp = (f) => `(${fm(f)})`;
/** Numérateur irréductible avec `den`, entre 1 et max. */
export function numFor(rand, den, max = 2 * den - 1) { for (;;) { const n = ri(rand, 1, max); if (gcd(n, den) === 1) return n; } }
/** Exposant écrit dans une formule : 10^(−3). */
export const e = (k) => (k < 0 ? `(${fr(k)})` : String(k));
export const isNice = (x, dec = 3) => Math.abs(x * 10 ** dec - Math.round(x * 10 ** dec)) < 1e-6;
export const decimals = (x) => { let k = 0; while (k < 6 && !isNice(x, k)) k++; return k; };
export const VERB = ['Calcule', 'Effectue', 'Donne la valeur de'];
export const signHint = 'Compte les facteurs négatifs : un nombre pair donne un résultat positif, un nombre impair un résultat négatif.';
export const fracResult = (res, rest) => expression(fracStr(res), { form: res[1] === 1 ? 'nombre' : 'irreductible', ...rest });
export const formTxt = (res) => (res[1] === 1 ? 'un nombre entier' : 'une fraction irréductible');
/** Exercice « toutes les étapes » : une ligne par étape, vérifiée ligne par ligne. */
export const steps = (mode, start, lines, rest) => ({ type: 'steps', mode, start, minSteps: 2, misconceptions: [], generatedAnswer: { lines }, ...rest });

export const negWord = (n) => `${n} facteur${n > 1 ? 's' : ''} négatif${n > 1 ? 's' : ''}`;
export const readFrac = (s) => (String(s).includes('/') ? frac(...String(s).split('/').map(Number)) : [Number(s), 1]);
