/**
 * Modèle de l'élève, compétence par compétence.
 *
 * 1. Maîtrise estimée : traçage bayésien des connaissances (BKT) avec « crédit partiel ».
 *    Une réussite avec indices, après plusieurs essais ou en voyant la solution compte moins
 *    qu'une réussite autonome du premier coup.
 * 2. Rétention : chaque compétence a une « stabilité » (en jours). Une réussite après plusieurs jours
 *    sans pratique (réussite différée) l'augmente fortement ; un échec la réduit. La prochaine révision
 *    est programmée à date = dernière réussite + stabilité (répétition espacée).
 * 3. Erreurs : comptage par type, idées fausses, et détection des difficultés anciennes qui réapparaissent.
 *
 * Toutes les fonctions sont pures : elles renvoient un nouvel état sans modifier l'ancien.
 */

export const DAY = 24 * 3600 * 1000;

export const BKT_DEFAULTS = { pInit: 0.1, pTransit: 0.1, pSlip: 0.1, pGuess: 0.2 };
const GUESS_BY_TYPE = { qcm: 0.3, order: 0.15, numberline: 0.1, multi: 0.05, counterexample: 0.05 };

export const LEVELS = {
  'non-vu': { label: 'Pas encore travaillée', rank: 0 },
  decouverte: { label: 'Découverte', rank: 1 },
  fragile: { label: 'Fragile', rank: 2 },
  'en-cours': { label: "En cours d'acquisition", rank: 3 },
  'a-revoir': { label: 'Acquise, à réviser', rank: 4 },
  maitrise: { label: 'Maîtrisée', rank: 5 },
  consolide: { label: 'Consolidée (réussie plusieurs jours après)', rank: 6 },
};

export function emptySkillState(skillId) {
  return {
    skill: skillId,
    pL: BKT_DEFAULTS.pInit,
    n: 0,
    successes: 0,
    firstTs: null,
    lastTs: null,
    lastSuccessTs: null,
    stability: 0,
    due: null,
    streak: 0,
    failStreak: 0,
    errors: {},
    misconceptions: {},
    recentErrors: [],
    optionalErrors: [],
    successesSinceError: {},
    hintsTotal: 0,
    autonomousSuccesses: 0,
    assistedSuccesses: 0,
    immediateSuccesses: 0,
    delayedSuccesses: 0,
    delayedAttempts: 0,
    timeRatios: [],
    justified: 0,
    unjustified: 0,
    tracks: { classe: { n: 0, ok: 0 }, approfondissement: { n: 0, ok: 0 }, expert: { n: 0, ok: 0 } },
    roles: {},
    everMastered: false,
    masteredAt: null,
    history: [],
  };
}

/** Crédit de 0 à 1 accordé à une tentative, selon la qualité et l'autonomie de la réussite. */
export function creditOf(attempt) {
  let c = attempt.score ?? (attempt.verdict === 'correct' ? 1 : 0);
  c -= Math.min(0.45, 0.15 * (attempt.hintsUsed || 0));
  c -= Math.min(0.3, 0.1 * Math.max(0, (attempt.tries || 1) - 1));
  if (attempt.solutionShown) c = Math.min(c, 0.1);
  return Math.max(0, Math.min(1, c));
}

function bktUpdate(pL, credit, params) {
  const { pTransit, pSlip, pGuess } = params;
  const postCorrect = (pL * (1 - pSlip)) / (pL * (1 - pSlip) + (1 - pL) * pGuess);
  const postWrong = (pL * pSlip) / (pL * pSlip + (1 - pL) * (1 - pGuess));
  const post = credit * postCorrect + (1 - credit) * postWrong;
  return post + (1 - post) * pTransit;
}

/** Probabilité estimée de se souvenir aujourd'hui (courbe d'oubli exponentielle). */
export function retention(state, now) {
  if (!state.lastSuccessTs || !state.stability) return state.n ? 0.5 : 0;
  const days = (now - state.lastSuccessTs) / DAY;
  return Math.exp(-days / (state.stability * 1.4));
}

/**
 * Intègre une tentative dans l'état d'une compétence.
 * attempt : { ts, verdict, score, errorType, misconception, prerequisite, tries, hintsUsed, solutionShown,
 *             durationMs, expectedSeconds, track, role, type, justified }
 * Renvoie { state, flags } ; flags.resurgence est vrai si une difficulté ancienne réapparaît.
 */
export function applyAttempt(prev, attempt, opts = {}) {
  const s = structuredCloneSafe(prev);
  const now = attempt.ts;
  const flags = { resurgence: false, delayed: false };
  // « à valider » (rédaction) et « incertain » (le logiciel ne sait pas trancher) relèvent d'un adulte :
  // ils ne comptent ni comme réussite ni comme échec.
  const human = attempt.verdict === 'a-valider' || attempt.verdict === 'incertain';
  const credit = creditOf(attempt);
  const success = !human && credit >= 0.7;
  const failure = !human && credit < 0.4;
  // Parcours facultatifs (approfondissement, expert) : une réussite compte comme preuve de maîtrise,
  // mais un échec ne fait JAMAIS baisser la progression du programme.
  const optional = (attempt.track || 'classe') !== 'classe';
  const neutralFailure = optional && !success;

  flags.delayed = Boolean(s.lastTs && now - s.lastTs >= 2 * DAY);
  s.n += 1;
  s.firstTs = s.firstTs || now;

  if (!human && !neutralFailure) {
    const params = { ...BKT_DEFAULTS, ...(opts.bkt || {}), pGuess: GUESS_BY_TYPE[attempt.type] ?? BKT_DEFAULTS.pGuess };
    s.pL = bktUpdate(s.pL, credit, params);
  }

  const track = attempt.track || 'classe';
  s.tracks[track] = s.tracks[track] || { n: 0, ok: 0 };
  s.tracks[track].n += 1;
  if (attempt.role) {
    s.roles[attempt.role] = s.roles[attempt.role] || { n: 0, ok: 0 };
    s.roles[attempt.role].n += 1;
  }
  s.hintsTotal += attempt.hintsUsed || 0;
  if (attempt.durationMs && attempt.expectedSeconds) {
    s.timeRatios = [...s.timeRatios, attempt.durationMs / 1000 / attempt.expectedSeconds].slice(-10);
  }
  if (attempt.errorType === 'sans-justification') s.unjustified += 1;
  else if (attempt.justified) s.justified += 1;

  if (success) {
    s.successes += 1;
    s.streak += 1;
    s.failStreak = 0;
    s.tracks[track].ok += 1;
    if (attempt.role) s.roles[attempt.role].ok += 1;
    if ((attempt.hintsUsed || 0) === 0 && (attempt.tries || 1) === 1 && !attempt.solutionShown) s.autonomousSuccesses += 1;
    else s.assistedSuccesses += 1;
    if (flags.delayed) s.delayedSuccesses += 1;
    else s.immediateSuccesses += 1;
    // stabilité de la mémoire
    if (!s.stability) s.stability = 1;
    else if (flags.delayed) s.stability = Math.min(180, s.stability * 2.5);
    else if (!s.lastSuccessTs || now - s.lastSuccessTs > 0.5 * DAY) s.stability = Math.min(180, s.stability * 1.3);
    s.lastSuccessTs = now;
    s.due = now + s.stability * DAY;
    for (const k of Object.keys(s.successesSinceError)) s.successesSinceError[k] += 1;
  } else if (failure && !optional) {
    s.streak = 0;
    s.failStreak += 1;
    if (s.stability) {
      s.stability = Math.max(0.5, s.stability * 0.5);
      s.due = now + s.stability * DAY;
    }
  }
  if (flags.delayed) s.delayedAttempts += 1;

  if (attempt.errorType && !success && optional) {
    s.optionalErrors = [...(s.optionalErrors || []), { type: attempt.errorType, ts: now, track: attempt.track }].slice(-20);
  } else if (attempt.errorType && !success) {
    const type = attempt.errorType;
    const seenBefore = (s.errors[type] || 0) > 0;
    const quietFor = s.successesSinceError[type] || 0;
    const lastSame = [...s.recentErrors].reverse().find((e) => e.type === type);
    const longAgo = lastSame ? now - lastSame.ts >= 7 * DAY : false;
    if (seenBefore && quietFor >= 3 && (s.everMastered || longAgo)) flags.resurgence = true;
    s.errors[type] = (s.errors[type] || 0) + 1;
    if (attempt.misconception) s.misconceptions[attempt.misconception] = (s.misconceptions[attempt.misconception] || 0) + 1;
    s.successesSinceError[type] = 0;
    s.recentErrors = [...s.recentErrors, {
      type, ts: now, misconception: attempt.misconception || null, prerequisite: attempt.prerequisite || null,
      resurgence: flags.resurgence, representation: attempt.representation || null, exercise: attempt.exerciseId || null,
    }].slice(-30);
  }

  s.lastTs = now;
  if (s.pL >= 0.85 && s.successes >= 3 && !s.everMastered) {
    s.everMastered = true;
    s.masteredAt = now;
  }
  const day = Math.floor(now / DAY);
  const last = s.history[s.history.length - 1];
  if (last && last.day === day) s.history = [...s.history.slice(0, -1), { day, pL: s.pL }];
  else s.history = [...s.history, { day, pL: s.pL }].slice(-120);

  return { state: s, flags, credit };
}

function structuredCloneSafe(o) {
  return JSON.parse(JSON.stringify(o));
}

/** Niveau de maîtrise lisible pour l'élève et le parent. */
export function masteryLevel(state, now) {
  if (!state || state.n === 0) return 'non-vu';
  const recent = state.recentErrors.filter((e) => now - e.ts < 14 * DAY).length;
  // « maîtrisée » exige au moins 3 réussites : deux bonnes réponses ne prouvent pas grand-chose
  if (state.pL >= 0.85 && state.successes >= 3) {
    if (state.due && now > state.due && retention(state, now) < 0.7) return 'a-revoir';
    if (state.delayedSuccesses >= 1) return 'consolide';
    return 'maitrise';
  }
  if (state.n < 3) return 'decouverte';
  if (state.pL < 0.5 || (recent >= 3 && state.failStreak >= 2)) return 'fragile';
  return 'en-cours';
}

/** Autonomie : part des réussites obtenues sans indice ni nouvel essai. */
export function autonomy(state) {
  const total = state.autonomousSuccesses + state.assistedSuccesses;
  return total ? state.autonomousSuccesses / total : null;
}

/** Rapidité : temps médian / temps prévu (1 = conforme au temps prévu). */
export function speedRatio(state) {
  if (!state.timeRatios.length) return null;
  const sorted = [...state.timeRatios].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/** Erreurs du même type répétées récemment (dans les N dernières erreurs, sur 21 jours). */
export function recurringErrors(state, now, windowDays = 21) {
  const recent = state.recentErrors.filter((e) => now - e.ts < windowDays * DAY);
  const byType = {};
  for (const e of recent) {
    const key = e.misconception || e.type;
    byType[key] = byType[key] || { type: e.type, misconception: e.misconception, prerequisite: e.prerequisite, count: 0, lastTs: 0, representations: new Set() };
    byType[key].count += 1;
    byType[key].lastTs = Math.max(byType[key].lastTs, e.ts);
    if (e.representation) byType[key].representations.add(e.representation);
  }
  return Object.values(byType).filter((x) => x.count >= 2).sort((a, b) => b.count - a.count)
    .map((x) => ({ ...x, representations: [...x.representations] }));
}

/**
 * Reconstruit un état de compétence sûr à partir de données externes (sauvegarde importée, ancienne version) :
 * chaque champ manquant ou d'un mauvais type reprend sa valeur par défaut.
 */
export function normalizeSkillState(raw, skillId) {
  const base = emptySkillState(skillId);
  if (!raw || typeof raw !== 'object') return base;
  const out = { ...base };
  for (const [k, def] of Object.entries(base)) {
    const v = raw[k];
    if (v === undefined || v === null) continue;
    if (typeof def === 'number' && Number.isFinite(v)) out[k] = v;
    else if (def === null && (typeof v === 'number' && Number.isFinite(v))) out[k] = v;
    else if (typeof def === 'boolean' && typeof v === 'boolean') out[k] = v;
    else if (Array.isArray(def) && Array.isArray(v)) out[k] = v.filter((x) => (typeof x === 'number' && Number.isFinite(x)) || (x && typeof x === 'object'));
    else if (def && typeof def === 'object' && !Array.isArray(def) && typeof v === 'object' && !Array.isArray(v)) out[k] = { ...def, ...v };
  }
  out.skill = skillId;
  out.pL = Math.min(1, Math.max(0, out.pL));
  out.recentErrors = out.recentErrors.filter((e) => typeof e.type === 'string' && Number.isFinite(e.ts));
  out.history = out.history.filter((h) => Number.isFinite(h.day) && Number.isFinite(h.pL));
  return out;
}

export function normalizeStates(raw, profileId) {
  const skills = {};
  const src = raw && raw.skills && typeof raw.skills === 'object' ? raw.skills : {};
  for (const [id, st] of Object.entries(src)) if (typeof id === 'string') skills[id] = normalizeSkillState(st, id);
  const lessons = raw && raw.lessons && typeof raw.lessons === 'object' && !Array.isArray(raw.lessons) ? raw.lessons : {};
  return { profileId, skills, lessons };
}
