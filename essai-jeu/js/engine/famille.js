/**
 * Défi de la famille : un jeu coopératif entre les profils d'un même appareil (frères, sœurs, cousins…). Chaque
 * semaine, du lundi au dimanche, les bonnes réponses de chacun s'additionnent vers un but commun ; le but atteint,
 * le coffre de la famille s'ouvre pour tous (chacun l'ouvre depuis son profil). On s'encourage, on ne se compare pas :
 * chaque joueur compte selon sa classe et son rythme, et le but grandit avec le nombre de joueurs actifs.
 *
 * Fonctions pures (dates en millisecondes, jours « AAAA-MM-JJ » en heure locale).
 */
import { dayKey, addDays } from './game.js';

export const FAMILY_PER_PLAYER = 35; // bonnes réponses par joueur et par semaine (environ 5 par jour)
export const ACTIVE_DAYS = 28; // un profil sans réponse depuis quatre semaines ne compte pas dans le but

/** Lundi de la semaine d'une date (clé « AAAA-MM-JJ »). */
export function weekKey(ts) {
  const d = new Date(ts);
  const back = (d.getDay() + 6) % 7; // lundi → 0, dimanche → 6
  return addDays(dayKey(ts), -back);
}

const startOf = (key) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d).getTime(); };

/** Une bonne réponse « vraie » : réussie sans avoir affiché la correction. */
export const countsForFamily = (a) => Boolean(a) && (a.verdict === 'correct' || a.humanValidated === true) && !a.solutionShown && !a.answerRevealed;

/**
 * Bilan de la semaine pour la famille.
 * @param {Array<{ profile: { id, pseudo, color?, symbol? }, attempts: Array<{ ts, verdict }> }>} members
 * @param {number} now
 * @returns {{ week, goal, total, players: Array, reached, left, daysLeft, active }}
 */
export function familyWeek(members, now) {
  const week = weekKey(now);
  const from = startOf(week); const to = startOf(addDays(week, 7));
  const since = now - ACTIVE_DAYS * 86400000;
  const players = (members || []).map(({ profile, attempts }) => {
    const list = attempts || [];
    const count = list.filter((a) => a.ts >= from && a.ts < to && countsForFamily(a)).length;
    const active = count > 0 || list.some((a) => a.ts >= since);
    return { id: profile.id, pseudo: profile.pseudo, color: profile.color || null, symbol: profile.symbol || null, count, active };
  });
  const active = players.filter((p) => p.active).length;
  const goal = FAMILY_PER_PLAYER * Math.max(1, active);
  const total = players.reduce((s, p) => s + p.count, 0);
  const today = dayKey(now);
  const daysLeft = Math.max(1, Math.round((to - startOf(today)) / 86400000)); // aujourd'hui compris
  return { week, goal, total, players, reached: total >= goal, left: Math.max(0, goal - total), daysLeft, active };
}

/** Phrase d'encouragement : ce qui manque, réparti sur les jours qui restent. */
export function familyPep(fw) {
  if (fw.reached) return 'Le but de la semaine est atteint : le coffre de la famille est ouvert !';
  const perDay = Math.ceil(fw.left / fw.daysLeft);
  const who = fw.active > 1 ? 'à vous tous' : 'à toi';
  return `Encore ${fw.left} bonne${fw.left > 1 ? 's' : ''} réponse${fw.left > 1 ? 's' : ''} ${who} pour ouvrir le coffre — environ ${perDay} par jour d’ici dimanche.`;
}
