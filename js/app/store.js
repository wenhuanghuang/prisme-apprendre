/**
 * État de l'application : contenus chargés, profil actif, et toutes les actions qui modifient
 * le profil (tentatives, validations, sauvegardes). Les vues lisent le store et s'abonnent aux changements.
 */
import * as db from '../storage/db.js';
import { buildBackup, validateBackup } from '../storage/backup.js';
import { applyAttempt, emptySkillState, masteryLevel, normalizeStates, DAY } from '../engine/mastery.js';
import { recommend } from '../engine/recommend.js';
import { summarizeAttempts, computeBadges, skillBadges } from '../engine/badges.js';
import { DEMO_PROFILES, simulateProfile } from '../engine/demo-profiles.js';

const listeners = new Set();
const lessonCache = new Map();

export const store = {
  ready: false,
  persistent: true,
  index: null, // { skills: Map, lessons: [], exercises: [], byLesson: Map }
  catalog: null,
  programmes: null,
  courses: new Map(),
  profiles: [],
  profile: null,
  states: null, // { profileId, skills: {}, lessons: {} }
  attempts: [],
  submissions: [],
  now: () => Date.now(),
};

export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit() { for (const fn of listeners) fn(store); }

async function fetchJson(path) {
  const r = await fetch(path, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`Chargement impossible : ${path} (${r.status})`);
  return r.json();
}

export async function init() {
  const [index, catalog, programmes] = await Promise.all([
    fetchJson('content/index.json'),
    fetchJson('content/catalog.json').catch(() => null),
    fetchJson('content/programmes.json').catch(() => null),
  ]);
  store.index = {
    skills: new Map(index.skills.map((s) => [s.id, s])),
    lessons: index.lessons,
    exercises: index.exercises,
    byLesson: new Map(index.lessons.map((l) => [l.id, l])),
  };
  store.catalog = catalog;
  store.programmes = programmes;
  store.persistent = await db.isPersistent();
  store.profiles = (await db.all('profiles')).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const lastId = localStorageGet('prisme:last-profile');
  if (lastId && store.profiles.some((p) => p.id === lastId)) await selectProfile(lastId, { silent: true });
  store.ready = true;
  emit();
}

function localStorageGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function localStorageSet(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* ignoré */ } }

export async function loadLesson(id) {
  if (lessonCache.has(id)) return lessonCache.get(id);
  const data = await fetchJson(`content/lessons/${encodeURIComponent(id)}.json`);
  lessonCache.set(id, data);
  return data;
}

export async function loadCourse(id) {
  if (store.courses.has(id)) return store.courses.get(id);
  const data = await fetchJson(`content/courses/${encodeURIComponent(id)}.json`).catch(() => null);
  store.courses.set(id, data);
  return data;
}

/** Trouve la définition complète d'un exercice (charge sa leçon si nécessaire). */
export async function loadExercise(exerciseId) {
  const meta = store.index.exercises.find((e) => e.id === exerciseId);
  if (!meta) return null;
  const lesson = await loadLesson(meta.lesson);
  return { def: lesson.exercises.find((e) => e.id === exerciseId), lesson, meta };
}

/* ------------------------------ Profils ------------------------------ */

const PSEUDO_RE = /^[\p{L}\p{N} _'’-]{1,24}$/u;

export async function createProfile({ pseudo, symbol, color, level }) {
  const clean = String(pseudo || '').trim();
  if (!PSEUDO_RE.test(clean)) throw new Error('Choisis un pseudo de 1 à 24 caractères (lettres, chiffres, espaces, tirets).');
  const id = `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const profile = { id, pseudo: clean, symbol, color, level, createdAt: store.now(), demo: false };
  await db.put('profiles', profile);
  await db.put('states', { profileId: id, skills: {}, lessons: {} });
  store.profiles = [...store.profiles, profile];
  await selectProfile(id);
  return profile;
}

export async function updateProfile(changes) {
  if (!store.profile) return;
  const allowed = {};
  if (changes.level) allowed.level = changes.level;
  if (changes.symbol) allowed.symbol = changes.symbol;
  if (changes.color) allowed.color = changes.color;
  if (changes.pseudo && PSEUDO_RE.test(changes.pseudo.trim())) allowed.pseudo = changes.pseudo.trim();
  const profile = { ...store.profile, ...allowed };
  await db.put('profiles', profile);
  store.profile = profile;
  store.profiles = store.profiles.map((p) => (p.id === profile.id ? profile : p));
  emit();
}

export async function selectProfile(id, opts = {}) {
  const profile = store.profiles.find((p) => p.id === id);
  if (!profile) return;
  store.profile = profile;
  store.states = normalizeStates(await db.get('states', id), id);
  store.attempts = (await db.byProfile('attempts', id)).sort((a, b) => a.ts - b.ts);
  store.submissions = await db.byProfile('submissions', id);
  localStorageSet('prisme:last-profile', id);
  if (!opts.silent) emit();
}

export function logout() {
  store.profile = null; store.states = null; store.attempts = []; store.submissions = [];
  localStorageSet('prisme:last-profile', null);
  emit();
}

export async function deleteProfile(id) {
  await db.deleteProfileData(id);
  store.profiles = store.profiles.filter((p) => p.id !== id);
  if (store.profile && store.profile.id === id) logout();
  emit();
}

export async function wipeEverything() {
  await db.wipeAll();
  store.profiles = [];
  logout();
}

/** Charge (ou recharge) les élèves fictifs, simulés par le vrai moteur. */
export async function loadDemoProfiles() {
  const now = store.now();
  for (const demo of DEMO_PROFILES) {
    const sim = simulateProfile(demo, now);
    await db.deleteProfileData(sim.profile.id);
    await db.put('profiles', sim.profile);
    await db.put('states', sim.states);
    for (const a of sim.attempts) await db.put('attempts', a);
  }
  store.profiles = (await db.all('profiles')).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  emit();
}

/* ------------------------------ Tentatives ------------------------------ */

/**
 * Enregistre une tentative corrigée et met à jour le modèle de l'élève.
 * meta : { tries, hintsUsed, solutionShown, durationMs, response, lessonId, context }
 */
export async function recordAttempt(instance, diagnosis, meta) {
  if (!store.profile) return null;
  const def = instance.def;
  const now = store.now();
  const skill = def.skill;
  const attempt = {
    profileId: store.profile.id,
    ts: now,
    exerciseId: def.id,
    lessonId: meta.lessonId || null,
    skill,
    type: def.type,
    track: def.track || 'classe',
    role: def.role || 'libre',
    representation: def.representation || 'symbolique',
    difficulty: def.difficulty || 2,
    verdict: diagnosis.verdict,
    score: diagnosis.score,
    errorType: diagnosis.errorType,
    misconception: diagnosis.misconception,
    prerequisite: diagnosis.prerequisite,
    stepsOk: diagnosis.stepsOk,
    stepsTotal: diagnosis.stepsTotal,
    tries: meta.tries || 1,
    hintsUsed: meta.hintsUsed || 0,
    solutionShown: Boolean(meta.solutionShown),
    durationMs: meta.durationMs || null,
    expectedSeconds: def.expectedSeconds || 120,
    justified: Boolean(diagnosis.justified),
    context: meta.context || null,
  };
  const before = store.states.skills[skill] || emptySkillState(skill);
  const { state, flags, credit } = applyAttempt(before, attempt);
  const record = { ...attempt, credit, delayed: flags.delayed, resurgence: flags.resurgence };
  store.states = { ...store.states, skills: { ...store.states.skills, [skill]: state } };
  if (meta.lessonId) {
    const lp = store.states.lessons[meta.lessonId] || { done: {}, lastTs: null };
    const done = { ...lp.done, [def.id]: Math.max(lp.done[def.id] || 0, credit) };
    store.states = { ...store.states, lessons: { ...store.states.lessons, [meta.lessonId]: { ...lp, done, lastTs: now } } };
  }
  await db.put('states', store.states);
  const id = await db.put('attempts', record);
  store.attempts = [...store.attempts, { ...record, id }];
  if (diagnosis.needsHuman) await saveSubmission(instance, diagnosis, meta);
  emit();
  return { record, flags, state };
}

/** Réponses rédigées : chaque nouvelle version est conservée ; un adulte peut valider. */
async function saveSubmission(instance, diagnosis, meta) {
  const id = `${store.profile.id}::${instance.def.id}`;
  const existing = store.submissions.find((s) => s.id === id);
  const version = { ts: store.now(), response: meta.response, selfCheck: meta.response && meta.response.selfCheck, verdict: diagnosis.verdict, seed: instance.seed };
  const sub = existing
    ? { ...existing, versions: [...existing.versions, version], status: 'en-attente' }
    : { id, profileId: store.profile.id, exerciseId: instance.def.id, skill: instance.def.skill, lessonId: meta.lessonId || null, prompt: instance.prompt, versions: [version], status: 'en-attente', comment: '' };
  await db.put('submissions', sub);
  store.submissions = [...store.submissions.filter((s) => s.id !== id), sub];
}

export async function markLessonSection(lessonId, sectionIndex) {
  if (!store.profile) return;
  const lp = store.states.lessons[lessonId] || { done: {}, lastTs: null, seen: [] };
  const seen = new Set(lp.seen || []);
  if (seen.has(sectionIndex)) return;
  seen.add(sectionIndex);
  store.states = { ...store.states, lessons: { ...store.states.lessons, [lessonId]: { ...lp, seen: [...seen], lastTs: store.now() } } };
  await db.put('states', store.states);
}

/**
 * Validation humaine d'une réponse rédigée (parent ou professeur).
 * decision : 'valide' | 'a-retravailler' ; la décision est intégrée au modèle comme une tentative.
 */
export async function validateSubmission(submissionId, decision, comment) {
  const active = store.profile && submissionId.startsWith(`${store.profile.id}::`);
  const sub = active ? store.submissions.find((s) => s.id === submissionId) : await db.get('submissions', submissionId);
  if (!sub) return;
  const updated = { ...sub, status: decision, comment: String(comment || '').slice(0, 1000), validatedAt: store.now() };
  await db.put('submissions', updated);
  if (active) store.submissions = store.submissions.map((s) => (s.id === submissionId ? updated : s));
  const meta = store.index.exercises.find((e) => e.id === sub.exerciseId) || {};
  const attempt = {
    profileId: sub.profileId, ts: store.now(), exerciseId: sub.exerciseId, lessonId: sub.lessonId, skill: sub.skill, type: meta.type || 'open',
    track: meta.track || 'classe', role: meta.role || 'libre', verdict: decision === 'valide' ? 'correct' : 'incorrect',
    score: decision === 'valide' ? 1 : 0.2, errorType: decision === 'valide' ? null : 'raisonnement', humanValidated: decision === 'valide', justified: true,
  };
  const states = active ? store.states : ((await db.get('states', sub.profileId)) || { profileId: sub.profileId, skills: {}, lessons: {} });
  const before = states.skills[sub.skill] || emptySkillState(sub.skill);
  const { state, credit } = applyAttempt(before, attempt);
  const nextStates = { ...states, skills: { ...states.skills, [sub.skill]: state } };
  await db.put('states', nextStates);
  const id = await db.put('attempts', { ...attempt, credit });
  if (active) {
    store.states = nextStates;
    store.attempts = [...store.attempts, { ...attempt, credit, id }];
  }
  emit();
}

/* ------------------------------ Lectures dérivées ------------------------------ */

export function recommendations(limit = 8) {
  if (!store.profile) return [];
  return recommend(store.index, store.states.skills, { now: store.now(), level: String(store.profile.level).toLowerCase(), limit });
}

/** Données complètes d'un profil (sans changer le profil actif) : pour l'espace parents. */
export async function profileData(id) {
  const profile = store.profiles.find((p) => p.id === id);
  if (!profile) return null;
  if (store.profile && store.profile.id === id) return { profile, states: store.states, attempts: store.attempts, submissions: store.submissions };
  return {
    profile,
    states: (await db.get('states', id)) || { profileId: id, skills: {}, lessons: {} },
    attempts: (await db.byProfile('attempts', id)).sort((a, b) => a.ts - b.ts),
    submissions: await db.byProfile('submissions', id),
  };
}

export function skillLevel(skillId) {
  return masteryLevel(store.states && store.states.skills[skillId], store.now());
}

export function badges() {
  const summary = summarizeAttempts(store.attempts);
  return { thematic: computeBadges(summary), skills: skillBadges(store.index, store.states ? store.states.skills : {}, store.now()), summary };
}

export function dueReviews() {
  if (!store.states) return [];
  const now = store.now();
  return Object.values(store.states.skills).filter((s) => s.due && s.due <= now + DAY && (s.everMastered || s.pL >= 0.6));
}

export function recentExerciseIds(n = 15) {
  return store.attempts.slice(-n).map((a) => a.exerciseId).filter(Boolean);
}

/* ------------------------------ Sauvegarde ------------------------------ */

export async function exportBackup(profileIds) {
  const out = [];
  for (const id of profileIds) {
    const profile = store.profiles.find((p) => p.id === id);
    if (!profile) continue;
    out.push({
      profile,
      states: (await db.get('states', id)) || { profileId: id, skills: {}, lessons: {} },
      attempts: await db.byProfile('attempts', id),
      submissions: await db.byProfile('submissions', id),
    });
  }
  return buildBackup(out);
}

/** Restaure les profils choisis. mode : 'remplacer' (même identifiant) ou 'copie' (nouveau profil). */
export async function importBackup(obj, choices) {
  const v = validateBackup(obj);
  const restored = [];
  for (const p of v.profiles) {
    const mode = choices[p.profile.id];
    if (!mode || mode === 'ignorer') continue;
    let profile = p.profile;
    if (mode === 'copie') profile = { ...profile, id: `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, pseudo: `${profile.pseudo} (copie)`.slice(0, 24) };
    else await db.deleteProfileData(profile.id);
    await db.put('profiles', profile);
    await db.put('states', { ...p.states, profileId: profile.id });
    for (const a of p.attempts) { const { id, ...rest } = a; await db.put('attempts', { ...rest, profileId: profile.id }); }
    for (const s of p.submissions) await db.put('submissions', { ...s, id: s.id.replace(/^[^:]+::/, `${profile.id}::`), profileId: profile.id });
    restored.push(profile.pseudo);
  }
  store.profiles = (await db.all('profiles')).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  if (store.profile) await selectProfile(store.profile.id, { silent: true });
  emit();
  return { restored, errors: v.errors };
}

/* ------------------------------ Code parent ------------------------------ */

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hasParentPin() {
  return Boolean(await db.get('meta', 'parent-pin'));
}

export async function setParentPin(pin) {
  if (!/^\d{4,8}$/.test(pin)) throw new Error('Le code doit comporter 4 à 8 chiffres.');
  const salt = crypto.getRandomValues(new Uint32Array(2)).join('-');
  await db.put('meta', { key: 'parent-pin', salt, hash: await sha256(`${salt}:${pin}`) });
}

export async function checkParentPin(pin) {
  const rec = await db.get('meta', 'parent-pin');
  if (!rec) return true;
  return rec.hash === (await sha256(`${rec.salt}:${pin}`));
}

export async function removeParentPin() {
  await db.del('meta', 'parent-pin');
}

export async function getSetting(key, fallback) {
  const rec = await db.get('meta', `setting:${key}`);
  return rec ? rec.value : fallback;
}

export async function setSetting(key, value) {
  await db.put('meta', { key: `setting:${key}`, value });
}
