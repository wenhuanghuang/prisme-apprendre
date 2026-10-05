/**
 * Validation des contenus (utilisée par `npm run validate`, par les tests et par l'outil d'auteur).
 * Vérifie la structure, rejoue les réponses types (`selfTest`) sur plusieurs tirages de paramètres,
 * et détecte les gabarits mal interpolés ou les idées fausses qui coïncident avec la bonne réponse.
 */
import { instantiate, check, CHECKERS } from '../core/checkers/index.js';
import { interpolateDeep } from '../core/template.js';
import { expectedValue } from '../core/checkers/numeric.js';
import { parseWithParams } from '../core/template.js';
import { equivalent, evaluate } from '../core/expr.js';

export const TRACKS = ['classe', 'approfondissement', 'expert'];
export const ROLES = ['guide', 'libre', 'reinvestissement', 'transfert', 'remediation', 'defi', 'mission', 'verification', 'labo', 'debug'];
export const REPRESENTATIONS = ['symbolique', 'visuelle', 'concrete', 'manipulation', 'verbale'];
export const SECTION_KINDS = ['decouverte', 'ressource', 'cours', 'manipulation', 'exemple', 'exercices', 'libre', 'reinvestissement', 'mission', 'correction', 'revision'];
const SEEDS = [1, 2, 3, 17, 42, 101, 2026];

function leftoverBraces(text) {
  return typeof text === 'string' && /\{[^{}]*\}/.test(text.replace(/\{\{|\}\}/g, ''));
}

function collectStrings(obj, out = []) {
  if (typeof obj === 'string') out.push(obj);
  else if (Array.isArray(obj)) obj.forEach((x) => collectStrings(x, out));
  else if (obj && typeof obj === 'object') Object.values(obj).forEach((x) => collectStrings(x, out));
  return out;
}

function misconceptionCollides(def, params) {
  for (const mc of def.misconceptions || []) {
    try {
      if (def.type === 'numeric') {
        const a = expectedValue(def, params);
        const b = typeof mc.answer === 'number' ? mc.answer : evaluate(parseWithParams(mc.answer, params));
        if (Math.abs(a - b) < 1e-9) return mc.id || mc.answer;
      } else if (def.type === 'expression') {
        if (equivalent(parseWithParams(def.answer, params), parseWithParams(mc.answer, params))) return mc.id || mc.answer;
      }
    } catch { /* paramètres invalides : signalé ailleurs */ }
  }
  return null;
}

function matchesExpectation(d, expect) {
  if (expect === 'any') return true;
  if (['correct', 'partiel', 'incorrect', 'a-valider', 'incertain'].includes(expect)) return d.verdict === expect;
  return d.errorType === expect || d.misconception === expect;
}

/** Valide un exercice ; renvoie la liste des problèmes (chaînes). */
export function validateExercise(def, skillIds, where = '') {
  const errs = [];
  const at = `${where}${def.id || '(sans id)'}`;
  if (!def.id) errs.push(`${at} : id manquant`);
  if (!CHECKERS[def.type]) { errs.push(`${at} : type inconnu « ${def.type} »`); return errs; }
  if (!def.skill || !skillIds.has(def.skill)) errs.push(`${at} : compétence inconnue « ${def.skill} »`);
  for (const s of def.skills || []) if (!skillIds.has(s)) errs.push(`${at} : compétence secondaire inconnue « ${s} »`);
  if (def.track && !TRACKS.includes(def.track)) errs.push(`${at} : parcours invalide « ${def.track} »`);
  if (def.role && !ROLES.includes(def.role)) errs.push(`${at} : rôle invalide « ${def.role} »`);
  if (def.representation && !REPRESENTATIONS.includes(def.representation)) errs.push(`${at} : représentation invalide « ${def.representation} »`);
  if (def.difficulty !== undefined && !(def.difficulty >= 1 && def.difficulty <= 5)) errs.push(`${at} : difficulté hors de 1-5`);
  if (def.type === 'composite') {
    for (const [i, p] of (def.parts || []).entries()) if (!CHECKERS[p.type]) errs.push(`${at} : question ${i + 1} de type inconnu « ${p.type} »`);
  }
  for (const name of Object.keys(def.params || {})) {
    if (!/^[A-Za-z]+$/.test(name)) errs.push(`${at} : nom de paramètre « ${name} » refusé (lettres uniquement : « V1 » serait lu V × 1)`);
  }
  if (!def.selfTest || !def.selfTest.length) errs.push(`${at} : aucune réponse type (selfTest) — impossible de vérifier la correction automatique`);

  for (const seed of def.params ? SEEDS : [1]) {
    let inst;
    try { inst = instantiate(def, seed); } catch (e) { errs.push(`${at} [tirage ${seed}] : paramètres impossibles (${e.message})`); break; }
    const visible = { ...def, params: undefined, constraints: undefined, selfTest: undefined, answer: undefined, start: undefined, startExpr: undefined, misconceptions: (def.misconceptions || []).map((m) => m.feedback), parts: (def.parts || []).map((p) => ({ prompt: p.prompt, choices: p.choices })), refutes: undefined, domain: undefined, predicate: undefined, show: undefined, reference: undefined, cells: undefined, expectSolution: undefined, choices: (def.choices || []).map((c) => ({ text: c.text, feedback: c.feedback })) };
    const rendered = collectStrings(interpolateDeep(visible, inst.params));
    const bad = rendered.find(leftoverBraces);
    if (bad) { errs.push(`${at} [tirage ${seed}] : accolades non interprétées dans « ${bad.slice(0, 80)} »`); break; }
    const collide = misconceptionCollides(def, inst.params);
    if (collide) { errs.push(`${at} [tirage ${seed}] : l'idée fausse ${collide} donne la même valeur que la bonne réponse`); break; }
    for (const [k, t] of (def.selfTest || []).entries()) {
      const response = interpolateDeep(t.response, inst.params);
      const d = check(inst, response);
      if (!matchesExpectation(d, t.expect)) {
        errs.push(`${at} [tirage ${seed}] réponse type ${k + 1} : attendu « ${t.expect} », obtenu verdict « ${d.verdict} » / erreur « ${d.errorType} » (${d.feedback})`);
      }
    }
    if (errs.length) break;
  }
  return errs;
}

/** Valide une leçon complète. */
export function validateLesson(lesson, skillIds, opts = {}) {
  const errs = [];
  const at = `${lesson.id || '(leçon sans id)'} › `;
  for (const f of ['id', 'title', 'subject', 'level', 'skills', 'sections', 'exercises']) if (lesson[f] === undefined) errs.push(`${at}champ « ${f} » manquant`);
  if (errs.length) return errs;
  for (const s of lesson.skills) if (!skillIds.has(s)) errs.push(`${at}compétence inconnue « ${s} »`);
  const ids = new Set();
  for (const ex of lesson.exercises) {
    if (ids.has(ex.id)) errs.push(`${at}identifiant d'exercice en double « ${ex.id} »`);
    ids.add(ex.id);
    if (opts.globalIds) {
      if (opts.globalIds.has(ex.id)) errs.push(`${at}identifiant « ${ex.id} » déjà utilisé dans une autre leçon`);
      opts.globalIds.add(ex.id);
    }
    errs.push(...validateExercise(ex, skillIds, at));
  }
  const referenced = new Set();
  for (const sec of lesson.sections) {
    if (!SECTION_KINDS.includes(sec.kind)) errs.push(`${at}section de type inconnu « ${sec.kind} »`);
    for (const id of sec.exercises || []) { referenced.add(id); if (!ids.has(id)) errs.push(`${at}section « ${sec.title} » : exercice inexistant « ${id} »`); }
    for (const l of sec.links || []) if (!/^https:\/\//.test(l.url || '')) errs.push(`${at}lien non sécurisé ou vide : ${l.url}`);
  }
  for (const [track, t] of Object.entries(lesson.tracks || {})) {
    if (!TRACKS.includes(track)) errs.push(`${at}parcours inconnu « ${track} »`);
    for (const id of t.exercises || []) {
      referenced.add(id);
      const ex = lesson.exercises.find((e) => e.id === id);
      if (!ex) errs.push(`${at}parcours ${track} : exercice inexistant « ${id} »`);
      else if ((ex.track || 'classe') !== track) errs.push(`${at}exercice « ${id} » rangé dans le parcours ${track} mais marqué ${ex.track || 'classe'}`);
    }
  }
  for (const ex of lesson.exercises) {
    if (!referenced.has(ex.id) && ex.role !== 'remediation') errs.push(`${at}exercice « ${ex.id} » jamais proposé (ni section, ni parcours, ni remédiation)`);
  }
  return errs;
}

/** Métadonnées légères d'un exercice pour l'index global (le moteur n'a pas besoin des énoncés). */
export function exerciseMeta(ex, lesson) {
  return {
    id: ex.id, lesson: lesson.id, subject: lesson.subject, level: lesson.level, type: ex.type,
    skill: ex.skill, skills: ex.skills || [], track: ex.track || 'classe', role: ex.role || 'libre',
    difficulty: ex.difficulty || 2, representation: ex.representation || 'symbolique',
    targets: ex.targets || [], justify: Boolean(ex.justify && ex.justify.required), expectedSeconds: ex.expectedSeconds || 120,
  };
}
