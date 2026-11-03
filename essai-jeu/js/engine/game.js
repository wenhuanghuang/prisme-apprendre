/**
 * Progression ludique (points d'expérience, niveaux, objectif du jour, série de jours, jokers, trophées).
 * Tout est recalculé à partir de l'historique des tentatives et de quelques événements (leçon terminée,
 * expérience regardée jusqu'au bout) : rien ne peut se désynchroniser, et une sauvegarde restaurée
 * redonne exactement la même progression. Fonctions pures, testées dans tests/unit/jeu.test.js.
 *
 * Les points récompensent la réussite autonome, le niveau choisi et la régularité, jamais le simple clic :
 * une solution affichée ne rapporte qu'un point d'effort, refaire le même exercice le même jour rapporte de moins en moins.
 */
import { titleFor, unlockedAt, computeTrophies, albumOf, ACCESSORIES, TINTS } from './game-rewards.js';

export const XP = {
  correct: 10, // réussi du premier coup sans indice (niveau de la classe)
  helped: 6, // réussi après un essai manqué ou avec un indice
  partial: 4,
  effort: 1, // essai manqué ou solution affichée : on récompense d'avoir essayé, à peine
  pending: 3, // réponse rédigée envoyée à la relecture d'un adulte
  humanValidated: 15, // réponse rédigée validée par un adulte
  multiPart: 4, // mission ou problème en plusieurs questions, réussi
  review: 5, // révision espacée réussie (plusieurs jours après)
  lesson: 30, // leçon terminée (au moins 70 % des exercices vraiment faits), une fois par leçon
  experience: 15, // expérience regardée jusqu'au bout, une fois par expérience
  bilan: 40, // bilan d'unité réussi (au moins 70 % des étoiles), une fois par unité : une couronne
  defi: 15, // défi d'une quête relevé (réussi sans la correction, au plus un indice) : un coffre
  quete: 40, // quête terminée avec au moins la moitié des étoiles : le grand coffre
  plateau: 15, // partie du jeu de plateau jouée jusqu'au bout, avec au moins trois bonnes réponses
  victoire: 20, // partie du jeu de plateau gagnée (avec au moins trois bonnes réponses)
  chapitre: 20, // chapitre de la quête de l'année terminé : une médaille
  periode: 50, // tous les chapitres d'une période de l'année terminés : un coffre rare
  annee: 100, // toute la quête de l'année terminée dans une matière
};

export const TRACK_MULT = { classe: 1, approfondissement: 1.5, expert: 2 };
export const LESSON_MIN_DONE = 0.7; // part des exercices d'une leçon vraiment faits (pas « passés ») pour la compter terminée
const REPEAT_FACTOR = [1, 0.5, 0.25]; // même exercice le même jour : 1re, 2e, 3e fois ; ensuite 0
export const EFFORT_DAILY_CAP = 5; // points d'effort (essais manqués, corrections affichées) au plus par jour
const GUESSABLE = ['qcm']; // quelques choix : réussir au 2e essai peut n'être que de l'élimination

// une bonne réponse rapporte environ 7 à 10 points : « Régulier » ≈ une leçon entière par jour
export const GOALS = [
  { xp: 60, label: 'Tranquille', hint: 'environ 10 minutes par jour (8 à 10 exercices)' },
  { xp: 150, label: 'Régulier', hint: 'environ 20 minutes par jour (une leçon)' },
  { xp: 300, label: 'Intense', hint: 'environ 40 minutes par jour (deux leçons)' },
];
export const DEFAULT_GOAL = 150;
// objectifs de la première version (20, 50, 100 ; 50 par défaut), atteints en deux ou trois questions : gardés
// pour les jours passés (la série ne se perd pas), remplacés à partir du lendemain de la mise à jour (migrateGoals)
const LEGACY_GOALS = { 20: 60, 50: 150, 100: 300 };
const LEGACY_DEFAULT = 50;
const LEGACY_START = '2000-01-01'; // « depuis toujours » : l'ancien défaut, avant tout objectif choisi
export const GOALS_VERSION = 3; // 2 : première conversion (corrigée par la 3)
export const MAX_JOKERS = 2;
export const JOKER_EVERY = 7; // un joker gagné tous les 7 jours d'objectif atteint d'affilée
const EVENT_TYPES = ['lecon', 'experience', 'bilan', 'defi', 'quete', 'plateau', 'victoire', 'chapitre', 'periode', 'annee'];

/* ------------------------------ Jours (heure locale) ------------------------------ */

const pad = (n) => String(n).padStart(2, '0');
export function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function keyToDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12); // midi : à l'abri des changements d'heure
}
export function addDays(key, n) {
  const d = keyToDate(key);
  d.setDate(d.getDate() + n);
  return dayKey(d.getTime());
}

/* ------------------------------ Points ------------------------------ */

/** Une tentative qui ne rapporte qu'un point d'effort (plafonné chaque jour). */
export const isEffortOnly = (a) => Boolean(a) && a.humanValidated !== true && (a.solutionShown || a.verdict === 'incorrect');

/** Réussite obtenue après plusieurs essais : 6 points au 2e essai, 3 au 3e, ensuite un point d'effort (on a éliminé). */
function helpedXp(a) {
  const tries = a.tries || 1;
  if (GUESSABLE.includes(a.type) && tries > 1) return XP.effort;
  return tries <= 2 ? XP.helped : tries === 3 ? XP.helped / 2 : XP.effort;
}

/** Points d'une tentative. `repeats` = nombre de tentatives précédentes sur le même exercice, le même jour. */
export function attemptXp(a, repeats = 0) {
  const factor = REPEAT_FACTOR[repeats] ?? 0;
  if (!factor || !a || a.untried) return 0; // correction affichée sans avoir essayé : rien
  let xp;
  if (a.humanValidated === true) xp = XP.humanValidated;
  else if (a.verdict === 'a-valider' || a.verdict === 'incertain') xp = XP.pending;
  else if (a.solutionShown) xp = XP.effort;
  else if (a.answerRevealed && a.verdict === 'correct') xp = XP.partial * (TRACK_MULT[a.track] || 1); // réponse lue dans la correction
  else if (a.verdict === 'correct') {
    const autonomous = (a.tries || 1) === 1 && !(a.hintsUsed > 0);
    const mult = TRACK_MULT[a.track] || 1;
    const base = autonomous ? XP.correct : helpedXp(a);
    xp = base * mult;
    if (base > XP.effort && a.type === 'composite') xp += XP.multiPart * mult;
    if (base > XP.effort && a.delayed) xp += XP.review;
  } else if (a.verdict === 'partiel') xp = XP.partial * (TRACK_MULT[a.track] || 1);
  else if (a.verdict === 'incorrect') xp = XP.effort;
  else xp = 0; // vide, illisible
  return Math.round(xp * factor);
}

export const eventXp = (type) => ({ lecon: XP.lesson, experience: XP.experience, bilan: XP.bilan, defi: XP.defi, quete: XP.quete, plateau: XP.plateau, victoire: XP.victoire, chapitre: XP.chapitre, periode: XP.periode, annee: XP.annee }[type] || 0);

/**
 * Points de niveau : passer du niveau n au niveau n + 1 demande 150 + 100 × (n − 1) points, soit un peu plus
 * d'une journée d'objectif « Régulier » au début ; niveau 10 vers 5 000 points, Galaxie (15) en un trimestre régulier.
 */
export const levelFloor = (n) => 150 * (n - 1) + 50 * (n - 1) * (n - 2);
export function levelOf(xp) {
  let n = 1;
  while (levelFloor(n + 1) <= xp) n += 1;
  return n;
}

/* ------------------------------ État persistant ------------------------------ */

/** État ludique enregistré avec le profil (states.game) : événements, objectifs choisis, apparence de Photon. */
export function normalizeGame(raw) {
  const g = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const seen = new Set();
  const events = (Array.isArray(g.events) ? g.events : [])
    .filter((e) => e && EVENT_TYPES.includes(e.type) && typeof e.id === 'string' && Number.isFinite(e.ts))
    .filter((e) => { const k = `${e.type}:${e.id}`; if (seen.has(k)) return false; seen.add(k); return true; })
    .map((e) => ({ type: e.type, id: e.id.slice(0, 200), ts: e.ts }));
  const goals = (Array.isArray(g.goals) ? g.goals : [])
    .filter((x) => x && /^\d{4}-\d{2}-\d{2}$/.test(x.from) && (GOALS.some((o) => o.xp === x.xp) || LEGACY_GOALS[x.xp]))
    .map((x) => ({ from: x.from, xp: x.xp }))
    .sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : 0));
  const eq = g.equipped && typeof g.equipped === 'object' ? g.equipped : {};
  return {
    events,
    goals,
    equipped: {
      accessory: ACCESSORIES.some((a) => a.id === eq.accessory) ? eq.accessory : null,
      tint: TINTS.some((t) => t.id === eq.tint) ? eq.tint : 'soleil',
    },
    seenLevel: Number.isInteger(g.seenLevel) && g.seenLevel >= 1 ? g.seenLevel : null,
    goalsVersion: [2, GOALS_VERSION].includes(g.goalsVersion) ? g.goalsVersion : null,
  };
}

/**
 * Passage aux objectifs de la version 0.4 bis. L'historique garde les anciens objectifs (et l'ancien défaut, 50)
 * pour les jours passés : la série déjà construite ne se perd pas. Le nouvel objectif équivalent (plus haut)
 * s'applique dès aujourd'hui, comme quand on choisit soi-même un objectif plus haut.
 * Un profil sans aucune activité passe directement aux nouveaux objectifs.
 * @param {boolean} hasHistory le profil a déjà des tentatives ou des événements
 */
export function migrateGoals(game, now, hasHistory) {
  if (game.goalsVersion === GOALS_VERSION) return game;
  const goals = game.goals || [];
  const upgrade = (x) => ({ from: x.from, xp: LEGACY_GOALS[x.xp] || x.xp });
  const legacyStart = { from: LEGACY_START, xp: LEGACY_DEFAULT };
  if (game.goalsVersion === 2) {
    // première conversion (2026-10-09) : les jours avant le premier objectif choisi étaient jugés sur 150
    const legacy = goals.some((x) => LEGACY_GOALS[x.xp]);
    const fixed = legacy && (!goals.length || goals[0].from !== LEGACY_START) ? [legacyStart, ...goals] : goals;
    return { ...game, goals: fixed, goalsVersion: GOALS_VERSION };
  }
  if (!hasHistory) return { ...game, goals: goals.map(upgrade), goalsVersion: GOALS_VERSION };
  const today = dayKey(now);
  // avant le premier objectif choisi, c'était l'ancien défaut (50)
  const all = goals.length && goals[0].from === LEGACY_START ? goals : [legacyStart, ...goals];
  const past = all.filter((x) => x.from < today);
  const current = goalOn(all, today); // l'objectif d'aujourd'hui, converti
  const planned = all.filter((x) => x.from > today).map(upgrade); // une baisse déjà prévue pour demain
  return { ...game, goals: [...past, { from: today, xp: LEGACY_GOALS[current] || current }, ...planned], goalsVersion: GOALS_VERSION };
}

/** Objectif en vigueur un jour donné (l'historique évite qu'un nouvel objectif réécrive les jours passés). */
export function goalOn(goals, key) {
  let goal = DEFAULT_GOAL;
  for (const x of goals || []) if (x.from <= key) goal = x.xp;
  return goal;
}

/**
 * Nouvel objectif : un objectif plus haut s'applique tout de suite ; un objectif plus bas seulement demain
 * (baisser l'objectif le soir ne doit pas « sauver » la série du jour).
 */
export function withGoal(game, xp, now) {
  const today = dayKey(now);
  const from = xp < goalOn(game.goals, today) ? addDays(today, 1) : today;
  const kept = (game.goals || []).filter((x) => x.from < from);
  return { ...game, goals: [...kept, { from, xp }] };
}

/**
 * Une leçon rapporte ses points de fin si chaque exercice a un résultat et si au moins 70 % ont été vraiment
 * tentés : ni « passés », ni abandonnés pour voir la correction.
 * @param {object} results résultats de la leçon jouée ({ [id]: { stars, verdict, tries?, solutionShown? } })
 * @param {string[]} ids exercices de la leçon
 */
export function lessonEarnsXp(results, ids) {
  if (!ids.length || !ids.every((id) => results[id])) return false;
  const done = ids.filter((id) => {
    const r = results[id];
    if (r.verdict === 'passe' || r.verdict === 'abandon' || r.solutionShown) return false;
    return r.tries === undefined ? r.stars > 0 : r.tries > 0; // anciens résultats sans le nombre d'essais : une étoile au moins
  }).length;
  return done >= Math.ceil(LESSON_MIN_DONE * ids.length);
}

export function withEvent(game, type, id, now) {
  if (!EVENT_TYPES.includes(type) || (game.events || []).some((e) => e.type === type && e.id === id)) return game;
  return { ...game, events: [...(game.events || []), { type, id, ts: now }] };
}

/* ------------------------------ Calcul de la progression ------------------------------ */

/** Points de chaque tentative et de chaque événement, rangés par jour. */
export function xpLedger(attempts, events) {
  const byDay = new Map();
  const repeats = new Map();
  const effort = new Map(); // points d'effort déjà comptés, par jour
  const items = [];
  for (const a of [...(attempts || [])].sort((x, y) => x.ts - y.ts)) {
    if (!Number.isFinite(a.ts)) continue;
    const key = dayKey(a.ts);
    const rk = `${key}|${a.exerciseId}`;
    const n = a.humanValidated === true ? 0 : (repeats.get(rk) || 0); // une validation d'adulte n'est pas une répétition
    if (a.humanValidated !== true) repeats.set(rk, n + 1);
    let xp = attemptXp(a, n);
    if (isEffortOnly(a)) {
      xp = Math.min(xp, Math.max(0, EFFORT_DAILY_CAP - (effort.get(key) || 0)));
      effort.set(key, (effort.get(key) || 0) + xp);
    }
    items.push({ ts: a.ts, xp, kind: 'tentative', lessonId: a.lessonId || null });
    byDay.set(key, (byDay.get(key) || 0) + xp);
  }
  for (const e of events || []) {
    const xp = eventXp(e.type);
    // une expérience est notée « <leçon>:<section> » : ses points comptent pour sa leçon
    items.push({ ts: e.ts, xp, kind: e.type, lessonId: e.type === 'lecon' ? e.id : e.type === 'experience' ? e.id.split(':')[0] || null : null });
    byDay.set(dayKey(e.ts), (byDay.get(dayKey(e.ts)) || 0) + xp);
  }
  return { byDay, items };
}

/** Série de jours où l'objectif est atteint ; un jour manqué est couvert par un joker s'il en reste. */
export function streakOf(byDay, goals, now) {
  const today = dayKey(now);
  const active = [...byDay.keys()].filter((k) => k <= today).sort();
  const reached = (k) => (byDay.get(k) || 0) >= goalOn(goals, k);
  let streak = 0; let best = 0; let jokers = 0; let run = 0; let goalDays = 0;
  const protectedDays = [];
  let pending = []; // jours couverts par un joker, confirmés seulement si la série continue
  if (active.length) {
    for (let k = active[0]; k <= today; k = addDays(k, 1)) {
      if (reached(k)) {
        protectedDays.push(...pending); pending = [];
        streak += 1; run += 1; goalDays += 1;
        if (run % JOKER_EVERY === 0 && jokers < MAX_JOKERS) jokers += 1;
      } else if (k !== today) {
        if (streak > 0 && jokers > 0) { jokers -= 1; pending.push(k); } else { streak = 0; pending = []; }
        run = 0;
      }
      best = Math.max(best, streak);
    }
  }
  protectedDays.push(...pending); // série toujours en cours : les jokers d'hier la protègent bien
  return { streak, best, jokers, goalDays, protectedDays, todayReached: reached(today), atRisk: streak > 0 && !reached(today) };
}

/** Plus longue suite d'exercices réussis du premier coup sans indice ni solution. */
function bestPerfectRun(attempts) {
  let run = 0; let best = 0;
  for (const a of attempts || []) {
    if (a.humanValidated === true || a.verdict === 'a-valider') continue;
    if (a.verdict === 'correct' && (a.tries || 1) === 1 && !(a.hintsUsed > 0) && !a.solutionShown && !a.answerRevealed) { run += 1; best = Math.max(best, run); } else run = 0;
  }
  return best;
}

const WEEKDAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];

/**
 * Toute la progression ludique d'un profil.
 * @param {Array} attempts tentatives (store.attempts)
 * @param {object} gameState états ludiques enregistrés (states.game)
 * @param {number} now horodatage courant
 */
export function computeGame(attempts, gameState, now) {
  const game = normalizeGame(gameState);
  const { byDay, items } = xpLedger(attempts, game.events);
  const totalXp = items.reduce((s, x) => s + x.xp, 0);
  const level = levelOf(totalXp);
  const floor = levelFloor(level); const ceil = levelFloor(level + 1);
  const today = dayKey(now);
  const goal = goalOn(game.goals, today);
  const nextGoal = goalOn(game.goals, addDays(today, 1));
  const todayXp = byDay.get(today) || 0;
  const st = streakOf(byDay, game.goals, now);
  const week = Array.from({ length: 7 }, (_, i) => {
    const key = addDays(today, i - 6);
    const xp = byDay.get(key) || 0;
    return { key, label: WEEKDAYS[keyToDate(key).getDay()], xp, goal: goalOn(game.goals, key), reached: xp >= goalOn(game.goals, key), today: key === today, protected: st.protectedDays.includes(key) };
  });
  const counters = {
    correct: (attempts || []).filter((a) => a.verdict === 'correct' || a.humanValidated === true).length,
    goalDays: st.goalDays, bestStreak: st.best, level,
    lessons: game.events.filter((e) => e.type === 'lecon').length,
    experiences: game.events.filter((e) => e.type === 'experience').length,
    crowns: game.events.filter((e) => e.type === 'bilan').length,
    bestPerfectRun: bestPerfectRun(attempts),
    reviews: (attempts || []).filter((a) => a.delayed && a.verdict === 'correct').length,
    defis: game.events.filter((e) => e.type === 'defi').length,
    quetes: game.events.filter((e) => e.type === 'quete').length,
    victoires: game.events.filter((e) => e.type === 'victoire').length,
    chapitres: game.events.filter((e) => e.type === 'chapitre').length,
    periodes: game.events.filter((e) => e.type === 'periode').length,
    annees: game.events.filter((e) => e.type === 'annee').length,
  };
  const album = albumOf(game.events);
  counters.album = album.owned.length;
  const unlocked = unlockedAt(level);
  return {
    totalXp, level, title: titleFor(level), nextTitle: titleFor(level + 1),
    levelFloor: floor, levelCeil: ceil, xpToNext: ceil - totalXp, progress: (totalXp - floor) / (ceil - floor),
    goal, nextGoal, todayXp, goalReached: todayXp >= goal,
    streak: st.streak, bestStreak: st.best, jokers: st.jokers, atRisk: st.atRisk, goalDays: st.goalDays,
    week, counters, trophies: computeTrophies(counters), unlocked,
    equipped: {
      accessory: game.equipped.accessory && unlocked.accessories.includes(game.equipped.accessory) ? game.equipped.accessory : null,
      tint: unlocked.tints.includes(game.equipped.tint) ? game.equipped.tint : 'soleil',
    },
    seenLevel: game.seenLevel,
    album,
    items,
  };
}
