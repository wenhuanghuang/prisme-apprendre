/**
 * Progression locale d'une leçon jouée (étape où l'on s'est arrêté, étoiles par exercice).
 * Confort de l'élève, jamais indispensable : le modèle de l'élève (IndexedDB) reste la référence.
 */
import { store } from '../../app/store.js';

const playKey = (lessonId) => `prisme.play.${store.profile ? store.profile.id : 'anon'}.${lessonId}`;

export function loadPlay(lessonId) {
  try {
    const v = JSON.parse(localStorage.getItem(playKey(lessonId)) || 'null');
    if (v && typeof v === 'object') return { step: Number(v.step) || 0, results: v.results && typeof v.results === 'object' ? v.results : {}, done: Boolean(v.done) };
  } catch { /* stockage indisponible */ }
  return { step: 0, results: {}, done: false };
}

export function savePlay(lessonId, play) {
  try { localStorage.setItem(playKey(lessonId), JSON.stringify(play)); } catch { /* stockage indisponible */ }
}

/**
 * Étoiles gagnées dans une leçon (pour la carte et les parcours). Avec `ids`, seuls ces exercices comptent
 * (les exercices de la classe : les défis facultatifs ne gonflent pas la médaille de la leçon).
 */
export function lessonStars(lessonId, ids = null) {
  const p = loadPlay(lessonId);
  const kept = ids ? ids.map((id) => p.results[id]).filter(Boolean) : Object.values(p.results);
  return { stars: kept.reduce((a, r) => a + (Number(r.stars) || 0), 0), done: p.done, results: p.results };
}
