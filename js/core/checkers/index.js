/**
 * Registre des types d'exercices côté logique (sans interface).
 * Ajouter un type = ajouter une entrée ici + un composant d'affichage dans js/ui/widgets.
 * Les contenus (JSON) n'ont jamais besoin de code : ils choisissent un type et le paramètrent.
 */
import { drawParams, interpolate, hashString } from '../template.js';
import { diagnosis } from '../errors.js';
import { checkNumeric, describeExpected as describeNumeric } from './numeric.js';
import { checkExpression, describeExpected as describeExpression } from './expression.js';
import { checkSteps } from './steps.js';
import { checkOpen, checkText, wordCount, detectCriterion } from './open.js';
import { checkCounterexample, checkMulti, checkEquation } from './logic.js';
import { checkTable, checkOrder, checkNumberline, checkGraph, checkQcm } from './structured.js';
import { runProgram, sameDrawing, TurtleError, programKeywords } from '../turtle.js';
import { checkHighlight, checkMatch, checkCategorize, checkDictation } from './language.js';

function checkCode(def, params, response) {
  const src = String(response.program || '');
  if (!src.trim()) return diagnosis({ verdict: 'vide', feedback: 'Écris un programme.' });
  let student;
  try { student = runProgram(src); } catch (e) {
    return diagnosis({ verdict: 'illisible', errorType: 'methode', feedback: e instanceof TurtleError ? e.message : 'Programme illisible.' });
  }
  const reference = runProgram(interpolate(def.reference, params));
  const same = sameDrawing(student.segments, reference.segments);
  if (!same) {
    for (const mc of def.misconceptions || []) {
      if (!mc.program) continue;
      let bad;
      try { bad = runProgram(interpolate(mc.program, params)); } catch { continue; }
      if (sameDrawing(student.segments, bad.segments)) {
        return diagnosis({ verdict: 'incorrect', errorType: mc.error || 'notion', misconception: mc.id || null, prerequisite: mc.prerequisite || null, feedback: mc.feedback || '' });
      }
    }
    const diff = student.segments.length - reference.segments.length;
    let hint = 'Le dessin obtenu ne correspond pas encore à celui demandé.';
    if (student.segments.length && reference.segments.length && diff !== 0) hint += ` Ton programme trace ${student.segments.length} segment(s), le modèle en a ${reference.segments.length}.`;
    return diagnosis({ verdict: 'incorrect', errorType: 'inconnue', feedback: hint, details: { student: student.segments, reference: reference.segments } });
  }
  const c = def.codeConstraints || (Array.isArray(def.constraints) ? {} : def.constraints || {});
  if (c.maxInstructions && student.instructions > c.maxInstructions) {
    return diagnosis({ verdict: 'partiel', score: 0.7, errorType: 'methode', feedback: `Le dessin est juste ! Défi : y arriver avec au plus ${c.maxInstructions} instructions (tu en utilises ${student.instructions}). Pense à « répète ».` });
  }
  const used = programKeywords(src);
  if (c.mustUse && c.mustUse.some((w) => !used.has(programKeywords(w).values().next().value))) {
    return diagnosis({ verdict: 'partiel', score: 0.7, errorType: 'methode', feedback: `Le dessin est juste. Consigne : utilise ${c.mustUse.map((w) => `« ${w} »`).join(', ')}.` });
  }
  return diagnosis({ verdict: 'correct', score: 1, feedback: def.correctFeedback || 'Le dessin est exactement celui demandé.' });
}

function checkComposite(def, params, response) {
  const parts = def.parts || [];
  const results = parts.map((part, i) => {
    return checkDef(part, params, (response.parts || [])[i] || {});
  });
  // « à valider » et « incertain » relèvent d'un adulte : ils ne comptent ni juste ni faux
  const HUMAN = ['a-valider', 'incertain'];
  const scorable = results.filter((r) => !HUMAN.includes(r.verdict));
  const allOk = scorable.length > 0 && scorable.every((r) => r.verdict === 'correct');
  if (!scorable.length && results.length) {
    return diagnosis({ verdict: 'a-valider', needsHuman: true, details: results, feedback: 'Réponses enregistrées : elles seront relues par un adulte.' });
  }
  const anyHuman = results.some((r) => r.needsHuman);
  const firstBad = results.find((r) => !['correct', ...HUMAN].includes(r.verdict));
  const score = scorable.length ? scorable.reduce((s, r) => s + r.score, 0) / scorable.length : 0;
  const okCount = scorable.filter((r) => r.verdict === 'correct').length;
  return diagnosis({
    verdict: allOk ? 'correct' : results.every((r) => r.verdict === 'vide') ? 'vide' : okCount ? 'partiel' : 'incorrect',
    score: allOk ? 1 : score,
    errorType: firstBad ? firstBad.errorType : null,
    misconception: firstBad ? firstBad.misconception : null,
    prerequisite: firstBad ? firstBad.prerequisite : null,
    stepsOk: okCount, stepsTotal: scorable.length,
    needsHuman: anyHuman,
    details: results,
    feedback: allOk ? 'Toutes les questions sont justes.' : `${okCount}/${scorable.length} question(s) juste(s). ${firstBad ? firstBad.feedback : ''}`,
  });
}

export const CHECKERS = {
  numeric: { check: checkNumeric, describe: describeNumeric, label: 'Réponse numérique' },
  expression: { check: checkExpression, describe: describeExpression, label: 'Expression' },
  steps: { check: checkSteps, label: 'Calcul étape par étape' },
  open: { check: checkOpen, label: 'Réponse rédigée' },
  text: { check: checkText, label: 'Réponse courte' },
  counterexample: { check: checkCounterexample, label: 'Contre-exemple' },
  multi: { check: checkMulti, label: 'Plusieurs réponses valables' },
  equation: { check: checkEquation, label: 'Équation à inventer' },
  table: { check: checkTable, label: 'Tableau à compléter' },
  order: { check: checkOrder, label: 'Rangement / frise' },
  numberline: { check: checkNumberline, label: 'Droite graduée' },
  graph: { check: checkGraph, label: 'Repère' },
  qcm: { check: checkQcm, label: 'Vérification rapide (QCM)' },
  code: { check: checkCode, label: 'Programme à écrire' },
  highlight: { check: checkHighlight, label: 'Mots à repérer dans un texte' },
  match: { check: checkMatch, label: 'Associations' },
  categorize: { check: checkCategorize, label: 'Classement' },
  dictation: { check: checkDictation, label: 'Dictée' },
  composite: { check: checkComposite, label: 'Problème en plusieurs questions' },
};

/** Prépare une instance jouable d'un exercice : paramètres tirés et textes interpolés. */
export function instantiate(def, seed) {
  const s = seed ?? hashString(def.id || 'x');
  const params = def.params ? drawParams(def.params, Array.isArray(def.constraints) ? def.constraints : [], s) : {};
  const t = (x) => (typeof x === 'string' ? interpolate(x, params) : x);
  return {
    def,
    seed: s,
    params,
    prompt: t(def.prompt || ''),
    hints: (def.hints || []).map(t),
    solution: t(def.solution || ''),
    methods: (def.methods || []).map(t),
    models: (def.models || []).map(t),
  };
}

/**
 * Corrige une réponse. Ajoute la vérification de la justification si l'exercice en demande une :
 * un résultat juste sans justification est distingué (type « sans-justification »).
 */
export function check(instance, response = {}) {
  return checkDef(instance.def, instance.params, response);
}

/** Correction d'une définition (utilisée aussi pour chaque question d'un problème composite). */
export function checkDef(def, params, response = {}) {
  const checker = CHECKERS[def.type];
  if (!checker) return diagnosis({ verdict: 'incertain', feedback: `Type d'exercice inconnu : ${def.type}` });
  let d;
  try {
    d = checker.check(def, params, response);
  } catch (e) {
    return diagnosis({ verdict: 'incertain', needsHuman: true, feedback: "La correction automatique n'a pas pu analyser cette réponse : elle sera proposée à la validation d'un adulte." });
  }
  if (def.justify && d.verdict === 'correct') {
    const text = String(response.justification || '').trim();
    const min = def.justify.minWords ?? 6;
    if (def.justify.required && wordCount(text) < min) {
      return { ...d, verdict: 'partiel', score: Math.min(d.score, 0.7), errorType: 'sans-justification', feedback: 'Le résultat est juste, mais il manque la justification de ta démarche.' };
    }
    if (text) {
      const crit = (def.justify.keywords || []).length ? detectCriterion(text, { keywords: def.justify.keywords }) : null;
      return { ...d, justification: { text, detected: crit }, justified: true, needsHuman: d.needsHuman || def.justify.review === true };
    }
  }
  return d;
}

export function describeExpected(instance) {
  const c = CHECKERS[instance.def.type];
  try { return c && c.describe ? c.describe(instance.def, instance.params) : null; } catch { return null; }
}
