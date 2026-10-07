/**
 * Outils communs aux générateurs de calcul et de problèmes (maths, physique-chimie) :
 * tirages, écriture des nombres à la française, fractions, idées fausses, fabrication des exercices.
 * Voir docs/GENERATEURS.md (niveaux classe / approfondissement / expert, problèmes).
 */
import { formatNumber } from '../core/expr.js';

export const ri = (rand, a, b) => a + Math.floor(rand() * (b - a + 1));
export const nz = (rand, a, b) => { for (;;) { const x = ri(rand, a, b); if (x !== 0) return x; } };
export const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];
/** Mélange (tirage reproductible) puis garde n éléments. */
export function sample(rand, arr, n = arr.length) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, n);
}
/** 12 chiffres significatifs, et les résidus de calcul (1,7e-16) ramenés à 0. */
export const clean = (x) => { const v = Number(Number(x).toPrecision(12)); return Math.abs(v) < 1e-9 ? 0 : v; };
/** Nombre écrit à la française (virgule, espaces fines pour les milliers). */
export const fr = (n) => formatNumber(clean(n));
/** Nombre entre parenthèses s'il est négatif : « (−3) ». */
export const par = (n) => (n < 0 ? `(${fr(n)})` : fr(n));
/** Nombre écrit comme l'élève le taperait (« 2,5 »). */
export const plain = (n) => String(clean(n)).replace('.', ',');
export const sq = (n) => clean(n * n);
export const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
export const lcm = (a, b) => Math.abs(a * b) / (gcd(a, b) || 1);
/** Fraction simplifiée, dénominateur positif : [num, den]. */
export function frac(n, d) { const s = d < 0 ? -1 : 1; const g = gcd(n, d) || 1; return [(s * n) / g, (s * d) / g]; }
export const fracStr = ([n, d]) => (d === 1 ? String(n) : `${n}/${d}`);
/** « + 5 » ou « − 5 » pour écrire un terme à la suite d'un autre. */
export const sgn = (n) => (n < 0 ? ` − ${fr(-n)}` : ` + ${fr(n)}`);
/** « + 3x », « − x » : terme en x écrit à la suite d'un autre (développement non réduit). */
export const xTerm = (k) => `${k < 0 ? ' − ' : ' + '}${Math.abs(k) === 1 ? '' : fr(Math.abs(k))}x`;

/** Polynôme [a0, a1, a2] écrit dans l'ordre décroissant : « 6x² − 7x + 2 ». */
export function poly(c, v = 'x') {
  const terms = [];
  for (let k = c.length - 1; k >= 0; k--) {
    const a = clean(c[k] || 0);
    if (!a) continue;
    const abs = Math.abs(a);
    const body = k === 0 ? fr(abs) : `${abs === 1 ? '' : fr(abs)}${v}${k === 2 ? '²' : ''}`;
    terms.push({ neg: a < 0, body });
  }
  if (!terms.length) return '0';
  return terms.map((t, i) => (i === 0 ? `${t.neg ? '−' : ''}${t.body}` : `${t.neg ? ' − ' : ' + '}${t.body}`)).join('');
}

/** Idée fausse : la réponse typique, son identifiant, le type d'erreur et l'explication. */
export const mc = (answer, id, error, feedback) => ({ answer, id, error, feedback });

/** Exercice numérique ; la réponse type est écrite comme un élève la taperait. */
export function numeric(answer, rest = {}) {
  const value = clean(answer);
  return { type: 'numeric', answer: value, generatedAnswer: { value: rest.unit && !rest.unitOptional ? `${plain(value)} ${rest.unit}` : plain(value) }, ...rest };
}

export function expression(answer, rest = {}) {
  return { type: 'expression', answer, generatedAnswer: { value: answer }, ...rest };
}

/**
 * Valeur LIMITE arrondie du côté sûr : « masse maximale » → arrondi inférieur, « résistance minimale » → arrondi
 * supérieur. Renvoie { answer, tolerance, unsafe } : la valeur exacte et l'arrondi sûr sont acceptés, l'arrondi
 * dangereux (`unsafe`, à déclarer en idée fausse) est refusé. `side` : 'max' ou 'min' ; `dec` : décimales.
 */
export function boundAnswer(exact, side, dec = 0) {
  const f = 10 ** dec;
  const safe = side === 'max' ? Math.floor(exact * f + 1e-9) / f : Math.ceil(exact * f - 1e-9) / f;
  const unsafe = side === 'max' ? safe + 1 / f : safe - 1 / f;
  const gap = Math.abs(exact - safe);
  return { answer: clean(safe), tolerance: clean(Math.min(gap + 0.1 / f, 0.9 / f)), unsafe: clean(unsafe) };
}

/** Réponse courte en texte (ex. « oui », « le fer ») : `accept` = toutes les réponses acceptées. */
export function text(accept, rest = {}) {
  const list = (Array.isArray(accept) ? accept : [accept]).map(String);
  return { type: 'text', accept: list, generatedAnswer: { value: list[0] }, ...rest };
}

/**
 * Problème en plusieurs questions (exercice « composite »). Chaque partie est fabriquée avec
 * numeric(), expression() ou text(), avec son propre `prompt`.
 * `justify` (facultatif) : { prompt, minWords, keywords, example } — l'élève explique sa démarche ;
 * `example` sert de réponse type pour la vérification automatique.
 */
export function problem(parts, rest = {}) {
  const { justify, ...others } = rest;
  const def = { type: 'composite', parts, ...others };
  def.generatedAnswer = { parts: parts.map((p) => p.generatedAnswer) };
  if (justify) {
    const { example, ...j } = justify;
    def.justify = { required: true, minWords: 8, ...j };
    def.generatedAnswer.justification = example || 'Je calcule chaque étape puis je compare les résultats obtenus pour conclure.';
  }
  return def;
}
