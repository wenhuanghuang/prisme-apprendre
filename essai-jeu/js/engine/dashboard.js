/**
 * Synthèse pédagogique pour le tableau de bord (élève et parent). Fonctions pures.
 * L'élève est comparé à sa propre progression : aucun classement entre enfants.
 */
import { masteryLevel, recurringErrors, autonomy, DAY } from './mastery.js';
import { recommend } from './recommend.js';
import { ERROR_TYPES } from '../core/errors.js';

export function computeDashboard(index, data, now) {
  const skills = data.states ? data.states.skills : {};
  const entries = Object.entries(skills).filter(([id]) => index.skills.has(id));
  const withMeta = entries.map(([id, st]) => ({ id, st, meta: index.skills.get(id), level: masteryLevel(st, now) }));

  const mastered = withMeta.filter((x) => x.level === 'maitrise' || x.level === 'consolide');
  const fragile = withMeta.filter((x) => x.level === 'fragile');
  const inProgress = withMeta.filter((x) => x.level === 'en-cours' || x.level === 'decouverte');
  const toReview = withMeta.filter((x) => x.level === 'a-revoir' || (x.st.due && x.st.due <= now && x.st.everMastered));

  const recos = recommend(index, skills, { now, level: data.profile ? String(data.profile.level).toLowerCase() : undefined, limit: 12 });
  const missingPrereqs = recos.filter((r) => r.kind === 'prerequis').map((r) => ({ skill: r.skill, forSkill: r.forSkill, reason: r.reasonParent }));

  const recurring = [];
  for (const x of withMeta) {
    for (const r of recurringErrors(x.st, now, 30)) {
      recurring.push({ skill: x.id, label: x.meta.label, type: r.type, typeLabel: (ERROR_TYPES[r.type] || {}).label || r.type, count: r.count, misconception: r.misconception, resolved: (x.st.successesSinceError[r.type] || 0) >= 3 });
    }
  }
  recurring.sort((a, b) => Number(a.resolved) - Number(b.resolved) || b.count - a.count);

  const families = {};
  for (const a of data.attempts || []) {
    if (!a.errorType || a.credit >= 0.7) continue;
    const fam = (ERROR_TYPES[a.errorType] || { family: 'inconnue' }).family;
    families[fam] = (families[fam] || 0) + 1;
  }

  // progression dans le temps : maîtrise moyenne des notions travaillées, jour par jour (30 derniers jours)
  const days = 30;
  const start = Math.floor(now / DAY) - days + 1;
  const series = [];
  for (let d = start; d <= Math.floor(now / DAY); d++) {
    const vals = [];
    for (const x of withMeta) {
      const hist = x.st.history.filter((p) => p.day <= d);
      if (hist.length) vals.push(hist[hist.length - 1].pL);
    }
    const count = (data.attempts || []).filter((a) => Math.floor(a.ts / DAY) === d).length;
    series.push({ day: d, avg: vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null, attempts: count });
  }

  const advanced = { approfondissement: { n: 0, ok: 0 }, expert: { n: 0, ok: 0 } };
  for (const a of data.attempts || []) {
    if (advanced[a.track]) { advanced[a.track].n += 1; if (a.credit >= 0.7) advanced[a.track].ok += 1; }
  }
  const programme = withMeta.filter((x) => x.meta.status === 'programme');
  const optional = withMeta.filter((x) => x.meta.status !== 'programme');

  const totalAttempts = (data.attempts || []).length;
  const autonomous = withMeta.reduce((s, x) => s + x.st.autonomousSuccesses, 0);
  const assisted = withMeta.reduce((s, x) => s + x.st.assistedSuccesses, 0);
  const delayed = withMeta.reduce((s, x) => s + x.st.delayedSuccesses, 0);

  return {
    mastered, fragile, inProgress, toReview, missingPrereqs, recurring, families, series, recos, advanced, programme, optional,
    totals: { attempts: totalAttempts, autonomyRate: autonomous + assisted ? autonomous / (autonomous + assisted) : null, delayed, skills: withMeta.length },
    autonomyOf: (st) => autonomy(st),
  };
}
