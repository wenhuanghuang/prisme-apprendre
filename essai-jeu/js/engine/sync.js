/**
 * Synchroniser un compte entre deux appareils, sans serveur : on fusionne ce qui a été fait ici et ce qui a été fait
 * là-bas, au lieu d'écraser l'un par l'autre. Les exercices faits, les événements du jeu (leçons, coffres, quêtes,
 * petits jeux…) et les réponses rédigées sont réunis ; pour chaque notion, on garde l'état le plus récent ; pour
 * chaque record, le meilleur. Le profil (pseudo, classe, avatar, code) est celui de l'appareil utilisé en dernier.
 * Moteur pur : il ne lit ni n'écrit rien.
 *
 * Un compte = { profile, states: { skills, lessons, game }, attempts, submissions } (format des sauvegardes).
 */

const num = (x) => (Number.isFinite(x) ? x : 0);

/** Date de la dernière activité d'un compte (exercice, événement du jeu, notion travaillée). */
export function lastActivity(acc) {
  let t = num(acc && acc.profile && acc.profile.createdAt);
  for (const a of (acc && acc.attempts) || []) t = Math.max(t, num(a.ts));
  for (const e of (acc && acc.states && acc.states.game && acc.states.game.events) || []) t = Math.max(t, num(e.ts));
  for (const s of Object.values((acc && acc.states && acc.states.skills) || {})) t = Math.max(t, num(s && s.lastTs));
  return t;
}

const attemptKey = (a) => `${a.ts}|${a.skill}|${a.exerciseId || ''}|${a.verdict || ''}`;

/** Exercices faits sur les deux appareils, sans doublon, du plus ancien au plus récent. */
export function mergeAttempts(a = [], b = []) {
  const seen = new Set(); const out = [];
  for (const x of [...a, ...b]) {
    if (!x || !Number.isFinite(x.ts)) continue;
    const k = attemptKey(x);
    if (seen.has(k)) continue;
    seen.add(k);
    const { id, ...rest } = x; // l'identifiant est propre à chaque appareil
    out.push(rest);
  }
  return out.sort((p, q) => p.ts - q.ts);
}

/** Pour chaque notion, l'état le plus récent (à égalité, celui qui a vu le plus d'exercices). */
export function mergeSkills(a = {}, b = {}) {
  const out = { ...a };
  for (const [id, sb] of Object.entries(b)) {
    const sa = out[id];
    if (!sa) { out[id] = sb; continue; }
    const ta = num(sa.lastTs); const tb = num(sb.lastTs);
    out[id] = tb > ta || (tb === ta && num(sb.n) > num(sa.n)) ? sb : sa;
  }
  return out;
}

/** Progression dans les leçons : sections vues et exercices réussis réunis (le meilleur crédit de chaque exercice). */
export function mergeLessons(a = {}, b = {}) {
  const out = { ...a };
  for (const [id, lb] of Object.entries(b)) {
    const la = out[id];
    if (!la) { out[id] = lb; continue; }
    const done = { ...(la.done || {}) };
    for (const [ex, c] of Object.entries(lb.done || {})) done[ex] = Math.max(num(done[ex]), num(c));
    const seen = [...new Set([...(la.seen || []), ...(lb.seen || [])])].sort((x, y) => x - y);
    out[id] = { ...la, ...lb, done, seen, lastTs: Math.max(num(la.lastTs), num(lb.lastTs)) || null };
  }
  return out;
}

/** Records : le meilleur temps (le plus court) ou le meilleur score (le plus haut). */
export function mergeRecords(a = {}, b = {}) {
  const out = { ...a };
  for (const [k, rb] of Object.entries(b)) {
    const ra = out[k];
    if (!ra) { out[k] = rb; continue; }
    if (Number.isFinite(ra.ms) && Number.isFinite(rb.ms)) out[k] = rb.ms < ra.ms ? rb : ra;
    else if (Number.isFinite(ra.score) && Number.isFinite(rb.score)) out[k] = rb.score > ra.score ? rb : ra;
  }
  return out;
}

/** Le jeu : événements réunis (une seule fois chacun), objectifs, records ; l'apparence vient de l'appareil le plus récent. */
export function mergeGame(a = {}, b = {}, newerIsB = false) {
  const events = []; const seen = new Set();
  for (const e of [...(a.events || []), ...(b.events || [])].sort((p, q) => num(p.ts) - num(q.ts))) {
    const k = `${e.type}:${e.id}`;
    if (seen.has(k)) continue;
    seen.add(k); events.push(e);
  }
  const goals = []; const from = new Set();
  for (const g of [...((newerIsB ? b : a).goals || []), ...((newerIsB ? a : b).goals || [])]) {
    if (from.has(g.from)) continue;
    from.add(g.from); goals.push(g);
  }
  goals.sort((p, q) => (p.from < q.from ? -1 : p.from > q.from ? 1 : 0));
  const newer = newerIsB ? b : a; const older = newerIsB ? a : b;
  return {
    ...older, ...newer,
    events, goals,
    records: mergeRecords(a.records || {}, b.records || {}),
    seenLevel: Math.max(num(a.seenLevel), num(b.seenLevel)) || null,
    goalsVersion: Math.max(num(a.goalsVersion), num(b.goalsVersion)) || null,
  };
}

/** Réponses rédigées : réunies ; pour une même réponse, la version la plus avancée (plus de versions, ou déjà relue). */
export function mergeSubmissions(a = [], b = []) {
  const byId = new Map();
  for (const s of [...a, ...b]) {
    const cur = byId.get(s.id);
    if (!cur) { byId.set(s.id, s); continue; }
    const score = (x) => (x.versions || []).length * 10 + (x.status && x.status !== 'en-attente' ? 1 : 0);
    if (score(s) > score(cur)) byId.set(s.id, s);
  }
  return [...byId.values()];
}

/**
 * Fusionne le compte de cet appareil (local) et celui reçu d'un autre appareil (incoming), qui ont le même
 * identifiant. Renvoie le compte fusionné et ce qui a été ajouté.
 */
export function mergeAccounts(local, incoming) {
  const newerIsB = lastActivity(incoming) > lastActivity(local);
  const ls = local.states || {}; const is = incoming.states || {};
  const profile = { ...(newerIsB ? local.profile : incoming.profile), ...(newerIsB ? incoming.profile : local.profile), id: local.profile.id };
  if (!(newerIsB ? incoming.profile : local.profile).secret) {
    const other = (newerIsB ? local.profile : incoming.profile).secret;
    if (other) profile.secret = other; else delete profile.secret;
  }
  const attempts = mergeAttempts(local.attempts, incoming.attempts);
  const game = mergeGame(ls.game || {}, is.game || {}, newerIsB);
  return {
    account: {
      profile,
      states: { profileId: profile.id, skills: mergeSkills(ls.skills, is.skills), lessons: mergeLessons(ls.lessons, is.lessons), game },
      attempts,
      submissions: mergeSubmissions(local.submissions, incoming.submissions),
    },
    added: {
      attempts: attempts.length - mergeAttempts(local.attempts).length,
      events: game.events.length - ((ls.game && ls.game.events) || []).length,
    },
  };
}
