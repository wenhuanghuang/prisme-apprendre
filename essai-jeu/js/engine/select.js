/**
 * Choix de l'exercice suivant à l'intérieur d'une séance adaptative.
 *
 * - difficulté visée selon la maîtrise estimée (zone « ni trop facile ni trop dure ») ;
 * - après deux échecs consécutifs : on baisse d'un cran et on change de représentation ;
 * - après trois réussites rapides et autonomes : on monte d'un cran ;
 * - on privilégie les exercices qui ciblent l'erreur détectée ;
 * - on évite de reproposer un exercice vu récemment.
 * Chaque choix est accompagné d'une explication.
 */
import { matches } from './recommend.js';

export function targetDifficulty(state, session = []) {
  const pL = state ? state.pL : 0.12;
  let d = 1 + Math.round(pL * 3.5); // 1 à 4.5 → les 5 sont réservés aux défis
  // les réponses en attente d'un adulte (crédit null) ne comptent ni comme réussite ni comme échec
  const last = session.filter((a) => a.credit !== null && a.credit !== undefined).slice(-3);
  const fails = [...last].reverse().findIndex((a) => a.credit >= 0.7);
  const consecutiveFails = fails === -1 ? last.length : fails;
  const quickWins = last.length === 3 && last.every((a) => a.credit >= 0.9 && (!a.timeRatio || a.timeRatio <= 1));
  const reasons = [];
  if (consecutiveFails >= 2) { d -= 1; reasons.push('deux erreurs de suite : on descend d’un cran'); }
  else if (quickWins) { d += 1; reasons.push('trois réussites rapides et sans aide : on monte d’un cran'); }
  return { difficulty: Math.max(1, Math.min(5, d)), reasons, consecutiveFails };
}

/**
 * @param {Array} pool      métadonnées des exercices (id, skill, track, role, difficulty, representation, targets…)
 * @param {object} query    demande issue d'une recommandation ou de la leçon
 * @param {object} state    état de la compétence
 * @param {Array} session   tentatives de la séance en cours [{exerciseId, credit, representation, timeRatio, errorType, misconception}]
 * @param {Array} recentIds identifiants vus récemment (à éviter)
 * @param {() => number} rand
 */
export function selectExercise(pool, query, state, session = [], recentIds = [], rand = Math.random) {
  let candidates = pool.filter((e) => matches(e, query));
  if (!candidates.length) candidates = pool.filter((e) => matches(e, { skill: query.skill }));
  if (!candidates.length) return null;

  const { difficulty, reasons, consecutiveFails } = targetDifficulty(state, session);
  let target = difficulty;
  if (query.maxDifficulty) target = Math.min(target, query.maxDifficulty);
  if (query.track === 'approfondissement') target = Math.max(target, 3);
  if (query.track === 'expert') target = Math.max(target, 4);

  const scored = session.filter((a) => a.credit !== null && a.credit !== undefined);
  const lastFail = [...scored].reverse().find((a) => a.credit < 0.4);
  const lastAttempt = scored[scored.length - 1];
  if (lastAttempt && lastAttempt.credit < 0.4 && lastAttempt.misconception && consecutiveFails < 2) {
    target = Math.max(1, target - 1);
    reasons.push('idée fausse détectée : on reprend un cran plus bas, sur ce point précis');
  }
  const failedReps = new Set(scored.filter((a) => a.credit < 0.4).map((a) => a.representation).filter(Boolean));
  const wantTargets = new Set([...(query.targets || []), lastFail && lastFail.errorType, lastFail && lastFail.misconception].filter(Boolean));
  const preferRep = query.preferRepresentation || (consecutiveFails >= 2 ? ['visuelle', 'manipulation', 'concrete', 'symbolique'].filter((r) => !failedReps.has(r)) : null);
  const seenInSession = new Set(session.map((a) => a.exerciseId));
  const recent = new Set(recentIds);

  const ranked = candidates.map((e) => {
    let score = -Math.abs((e.difficulty || 2) - target) * 2;
    const why = [];
    const hits = (e.targets || []).filter((t) => wantTargets.has(t));
    if (hits.some((t) => t.startsWith('mc:'))) { score += 5; why.push('travaille précisément l’idée fausse détectée'); }
    else if (hits.length) { score += 3; why.push('cible précisément le type d’erreur détecté'); }
    if (preferRep && preferRep.includes(e.representation)) { score += 2.5; why.push(`autre représentation (${e.representation})`); }
    if (seenInSession.has(e.id)) score -= 8;
    else if (recent.has(e.id)) score -= 3;
    score += rand() * 0.8;
    return { e, score, why };
  }).sort((a, b) => b.score - a.score);

  const pick = ranked[0];
  const explanation = [
    `Difficulté ${pick.e.difficulty || 2}/5 (visée : ${target})`,
    ...reasons,
    ...pick.why,
  ];
  return { exercise: pick.e, target, explanation };
}
