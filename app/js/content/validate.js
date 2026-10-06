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
import { generateFromData, canonicalResponse, DATA_KINDS } from '../generators/data-kinds.js';

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
    // valeurs tirées au hasard : l'exercice peut revenir dans une série avec d'autres nombres
    variable: Boolean(ex.params && Object.keys(ex.params).length),
  };
}

/* ------------------------------ Générateurs de données ------------------------------ */

/** Valide un générateur (fichier app/content/generators/<id>.json) en produisant 25 exercices et en les corrigeant. */
export function validateGenerator(gen, skillIds) {
  const errs = [];
  const at = `générateur ${gen.id || '(sans id)'}`;
  for (const f of ['id', 'label', 'subject', 'levels', 'skill', 'kind', 'data']) if (gen[f] === undefined) errs.push(`${at} : champ « ${f} » manquant`);
  if (errs.length) return errs;
  if (!DATA_KINDS.includes(gen.kind)) return [`${at} : genre inconnu « ${gen.kind} » (attendu : ${DATA_KINDS.join(', ')})`];
  if (!skillIds.has(gen.skill)) errs.push(`${at} : compétence inconnue « ${gen.skill} »`);
  const d = gen.data;
  if (gen.kind === 'conjugaison') {
    if (!Array.isArray(d.pronouns) || d.pronouns.length !== 6) errs.push(`${at} : 6 pronoms attendus`);
    for (const [v, info] of Object.entries(d.verbs || {})) {
      for (const [t, forms] of Object.entries(info.forms || {})) {
        if (!d.tenses[t]) errs.push(`${at} : ${v} — temps inconnu « ${t} »`);
        if (!Array.isArray(forms) || forms.length !== 6 || forms.some((x) => !String(x).trim())) errs.push(`${at} : ${v} au ${t} — 6 formes attendues`);
      }
    }
  }
  if (gen.kind === 'vocab' && (!Array.isArray(d.pairs) || d.pairs.length < 4)) errs.push(`${at} : au moins 4 paires de vocabulaire`);
  if (gen.kind === 'chronologie' && (!Array.isArray(d.events) || d.events.length < 5 || d.events.some((e) => !Number.isInteger(e.year) || !e.label))) errs.push(`${at} : au moins 5 événements {label, year entier}`);
  if (gen.kind === 'categorize' && (!Array.isArray(d.items) || d.items.some((i) => !d.categories.some((c) => c.id === i.category)))) errs.push(`${at} : chaque élément doit avoir une catégorie existante`);
  if (gen.kind === 'match' && (!Array.isArray(d.pairs) || d.pairs.length < 3)) errs.push(`${at} : au moins 3 paires`);
  if (gen.kind === 'cloze' && (!Array.isArray(d.items) || d.items.some((i) => !String(i.sentence || '').includes('___') || !i.accept))) errs.push(`${at} : chaque phrase doit contenir « ___ » et une réponse`);
  if (errs.length) return errs;
  const optionSets = [{}];
  for (const o of gen.options || []) for (const v of o.values || []) optionSets.push({ [o.id]: v.id });
  for (const opts of optionSets) {
    for (let seed = 1; seed <= 25; seed++) {
      let def;
      try { def = generateFromData(gen, seed, opts); } catch (e) { errs.push(`${at} [${JSON.stringify(opts)} tirage ${seed}] : ${e.message}`); break; }
      const d1 = check(instantiate(def, seed), canonicalResponse(def));
      if (d1.verdict !== 'correct') { errs.push(`${at} [tirage ${seed}] : la réponse attendue n'est pas acceptée (${d1.feedback})`); break; }
      for (const mc of def.misconceptions || []) {
        if ((def.accept || []).some((a) => String(a).trim().toLowerCase() === String(mc.answer).trim().toLowerCase())) { errs.push(`${at} [tirage ${seed}] : idée fausse identique à une réponse acceptée (${mc.answer})`); break; }
      }
    }
    if (errs.length) break;
  }
  return errs;
}

export function generatorMeta(gen) {
  return { id: gen.id, label: gen.label, subject: gen.subject, levels: gen.levels, skill: gen.skill, kind: gen.kind, description: gen.description || '', options: gen.options || [], track: gen.track || 'classe' };
}
