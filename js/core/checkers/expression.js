/**
 * Réponse sous forme d'expression littérale (développer, factoriser, réduire, simplifier une fraction…).
 * L'équivalence est testée numériquement, la forme est vérifiée sur l'arbre syntaxique.
 */
import {
  tryParse, equivalent, alignVariableCase, isDeveloped, isReduced, isFactored, isIrreducibleFraction, isNumberLiteral, variables, evaluate, toText,
} from '../expr.js';
import { parseWithParams } from '../template.js';
import { diagnosis } from '../errors.js';

export const FORMS = {
  any: { label: 'toute écriture correcte', test: () => true },
  developpee: { label: 'forme développée', test: isDeveloped },
  'developpee-reduite': { label: 'forme développée et réduite', test: isReduced },
  factorisee: { label: 'forme factorisée', test: isFactored },
  irreductible: { label: 'fraction irréductible', test: isIrreducibleFraction },
  nombre: { label: 'un nombre (calcul terminé)', test: isNumberLiteral },
};

/**
 * Coefficients d'un polynôme en une variable (degré ≤ maxDeg), ou null si ce n'en est pas un.
 * Méthode : interpolation de Newton sur des points entiers puis vérification sur d'autres points.
 */
export function polyCoefficients(node, v = 'x', maxDeg = 4) {
  const vars = [...variables(node)];
  if (vars.length > 1 || (vars.length === 1 && vars[0] !== v)) return null;
  const f = (x) => evaluate(node, { [v]: x });
  try {
    const n = maxDeg + 1;
    const xs = Array.from({ length: n }, (_, i) => i - 2);
    const ys = xs.map(f);
    if (ys.some((y) => !Number.isFinite(y))) return null;
    // différences divisées
    const coef = ys.slice();
    for (let j = 1; j < n; j++) for (let i = n - 1; i >= j; i--) coef[i] = (coef[i] - coef[i - 1]) / (xs[i] - xs[i - j]);
    // passage forme de Newton -> coefficients usuels
    let poly = [0];
    for (let i = n - 1; i >= 0; i--) {
      // poly = poly * (x - xs[i]) + coef[i]
      const next = new Array(poly.length + 1).fill(0);
      for (let k = 0; k < poly.length; k++) { next[k + 1] += poly[k]; next[k] -= poly[k] * xs[i]; }
      next[0] += coef[i];
      poly = next;
    }
    poly = poly.map((c) => (Math.abs(c - Math.round(c)) < 1e-9 ? Math.round(c) : c));
    for (const x of [3.7, -4.3, 7.1]) {
      const val = poly.reduce((s, c, k) => s + c * x ** k, 0);
      if (Math.abs(val - f(x)) > 1e-6 * Math.max(1, Math.abs(val))) return null;
    }
    while (poly.length > 1 && Math.abs(poly[poly.length - 1]) < 1e-12) poly.pop();
    return poly;
  } catch {
    return null;
  }
}

/** Compare deux polynômes : renvoie 'signe' si un seul coefficient diffère par son signe, 'calcul' si un seul coefficient diffère. */
export function compareCoefficients(student, expected) {
  if (!student || !expected) return null;
  const n = Math.max(student.length, expected.length);
  const diffs = [];
  for (let k = 0; k < n; k++) {
    const a = student[k] || 0; const b = expected[k] || 0;
    if (Math.abs(a - b) > 1e-9) diffs.push({ k, a, b });
  }
  if (diffs.length === 1) {
    const { a, b } = diffs[0];
    if (Math.abs(a + b) < 1e-9) return { kind: 'signe', degree: diffs[0].k };
    return { kind: 'calcul', degree: diffs[0].k };
  }
  return null;
}

const DEGREE_NAMES = ['le terme constant', 'le coefficient de x', 'le coefficient de x²', 'le coefficient de x³', 'le coefficient de x⁴'];

export function checkExpression(def, params, response) {
  const raw = String(response.value ?? '').trim();
  if (!raw) return diagnosis({ verdict: 'vide', feedback: 'Écris ton expression avant de valider.' });
  const parsed = tryParse(raw);
  if (!parsed.ok) return diagnosis({ verdict: 'illisible', feedback: `Je n'arrive pas à lire cette écriture (${parsed.error}). Exemple : 3x² − 2(x + 1).` });
  const expected = parseWithParams(def.answer, params);
  const student = alignVariableCase(parsed.node, expected);
  const form = FORMS[def.form || 'any'] || FORMS.any;

  if (equivalent(student, expected)) {
    if (!form.test(student)) {
      return diagnosis({
        verdict: 'partiel', score: 0.6, errorType: 'forme',
        feedback: `Ton expression est bien égale au résultat, mais elle n'est pas sous ${form.label}.`,
      });
    }
    return diagnosis({ verdict: 'correct', score: 1, feedback: def.correctFeedback || 'Exact.' });
  }

  for (const mc of def.misconceptions || []) {
    let mcNode;
    try { mcNode = parseWithParams(mc.answer, params); } catch { continue; }
    if (equivalent(student, mcNode)) {
      return diagnosis({
        verdict: 'incorrect', errorType: mc.error || 'notion', misconception: mc.id || null,
        prerequisite: mc.prerequisite || null, feedback: mc.feedback || '',
      });
    }
  }

  const v = def.variable || [...variables(expected)][0] || 'x';
  const expectedPoly = polyCoefficients(expected, v);
  // comparer des coefficients n'a de sens que pour une expression littérale (pas pour un simple nombre)
  const cmp = expectedPoly && expectedPoly.length > 1 ? compareCoefficients(polyCoefficients(student, v), expectedPoly) : null;
  if (cmp) {
    const where = DEGREE_NAMES[cmp.degree] || 'un coefficient';
    if (cmp.kind === 'signe') return diagnosis({ verdict: 'incorrect', errorType: 'signe', feedback: `Presque : regarde le signe dans ${where}.` });
    return diagnosis({ verdict: 'incorrect', errorType: 'calcul', feedback: `Presque : ${where} n'est pas le bon. Vérifie ce calcul.` });
  }
  return diagnosis({ verdict: 'incorrect', errorType: 'inconnue', feedback: def.wrongFeedback || "Cette expression n'est pas égale à celle attendue. Teste-la avec une valeur de x pour le vérifier." });
}

export function describeExpected(def, params) {
  return toText(parseWithParams(def.answer, params));
}
