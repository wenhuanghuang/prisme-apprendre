/**
 * Données des parcours pour l'interface : matières de la classe, progression de l'élève (leçons terminées,
 * étoiles, couronnes des bilans) et chemin calculé par engine/path.js.
 */
import { store, loadCourse } from '../../app/store.js';
import { buildPath } from '../../engine/path.js';
import { lessonStars } from '../lesson-play/progress.js';
import { lessonEarnsXp } from '../../engine/game.js';

export const SUBJECT_ICONS = { maths: '∑', pc: '⚗', numerique: '⌘', francais: '¶', hg: '⌖', svt: '❦', 'sciences-techno': '🔬', techno: '⚙', emc: '⚖', lv: '✎', eps: '⚑', musique: '♪', 'arts-plastiques': '◐' };
const ORDER = ['francais', 'maths', 'hg', 'sciences-techno', 'pc', 'svt', 'numerique', 'techno', 'lv', 'emc', 'musique', 'arts-plastiques'];

export const subjectLabel = (id) => ((store.catalog && store.catalog.subjects.find((s) => s.id === id)) || { label: id }).label;
export const levelOfProfile = () => String(store.profile.level).toLowerCase();

/** Parcours (rédigés) d'une classe, dans l'ordre des matières principales. */
export function coursesOf(level) {
  const rank = (s) => { const i = ORDER.indexOf(s); return i === -1 ? 50 : i; };
  return (store.catalog ? store.catalog.courses : [])
    .filter((c) => c.level === level && c.coverage !== 'reference')
    .sort((a, b) => rank(a.subject) - rank(b.subject));
}

/** Exercices de la classe joués dans les étapes, par leçon (ceux qui comptent pour terminer une leçon et pour ses étoiles). */
function classExercisesByLesson() {
  const by = new Map();
  for (const e of store.index.exercises || []) {
    if ((e.track || 'classe') !== 'classe' || e.role === 'remediation') continue; // remédiation : seulement après une erreur
    if (!by.has(e.lesson)) by.set(e.lesson, []);
    by.get(e.lesson).push(e.id);
  }
  return by;
}

/**
 * Progression de l'élève : leçon terminée (événement « leçon » : 70 % des exercices vraiment faits ; ou leçon
 * jouée jusqu'au bout avant la version 0.4, avec la même règle), étoiles des exercices de la classe, couronnes.
 */
export function progressNow() {
  const events = (store.states && store.states.game && store.states.game.events) || [];
  const finished = new Set(events.filter((e) => e.type === 'lecon').map((e) => e.id));
  const crowns = new Set(events.filter((e) => e.type === 'bilan').map((e) => e.id));
  const classIds = classExercisesByLesson();
  const done = new Set(); const stars = new Map();
  for (const l of store.index.lessons) {
    const ids = classIds.get(l.id) || [];
    const s = lessonStars(l.id, ids);
    if (s.stars) stars.set(l.id, s.stars);
    if (finished.has(l.id) || (s.done && lessonEarnsXp(s.results, ids))) done.add(l.id);
  }
  return { done, stars, crowns };
}

/** Chemin d'un parcours (null si le parcours est introuvable). */
export async function pathOf(courseId, progress = progressNow()) {
  const course = await loadCourse(courseId);
  if (!course) return null;
  return { course, path: buildPath(course, store.index.byLesson, progress) };
}

/** Parcours qui contient une leçon (pour « Leçon suivante » en fin de leçon). */
export function courseOfLesson(lessonId) {
  const meta = store.index.byLesson.get(lessonId);
  if (!meta) return null;
  return (store.catalog ? store.catalog.courses : []).find((c) => c.level === String(meta.level).toLowerCase() && c.subject === meta.subject) || null;
}
