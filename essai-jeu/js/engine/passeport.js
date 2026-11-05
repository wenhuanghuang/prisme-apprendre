/**
 * Passeport des jeux : chaque semaine (du lundi au dimanche), un tampon par petit jeu différent joué. Quatre tampons
 * différents ouvrent le coffre du passeport (une vignette rare et des points), une fois par semaine : on récompense
 * la variété, pas la répétition. Moteur pur, recalculé à partir des évènements.
 */
import { weekKey } from './famille.js';
import { addDays } from './game.js';

export const PASSPORT_NEED = 4;

/**
 * @param {Array<{type, id}>} events évènements du jeu (les petits jeux ont pour identifiant le jour « AAAA-MM-JJ »)
 * @param {number} now
 * @param {string[]} games identifiants des petits jeux de la classe
 */
export function passportOf(events, now, games) {
  const week = weekKey(now);
  const end = addDays(week, 7);
  const inWeek = (d) => typeof d === 'string' && d >= week && d < end;
  const stamps = Object.fromEntries(games.map((g) => [g, (events || []).some((e) => e.type === g && inWeek(e.id))]));
  const count = Object.values(stamps).filter(Boolean).length;
  const need = Math.min(PASSPORT_NEED, games.length);
  const opened = (events || []).some((e) => e.type === 'passeport' && e.id === week);
  return { week, stamps, count, need, complete: count >= need, opened };
}
