/**
 * Choix des exercices d'une quête : des exercices courts de la classe (leçons et générateurs), du plus simple au
 * plus exigeant, puis un défi par étape (approfondissement, à défaut un exercice de la classe de difficulté ≥ 3).
 * Les éléments sont enregistrables (identifiants et graines) : une quête reprise redonne les mêmes exercices.
 */
import { store, recentExerciseIds } from '../../app/store.js';
import { allGenerators, coversSkills } from '../../generators/registry.js';
import { buildSeries, materialize } from '../views/exercices.js';
import { quickExercise, gameSubjects } from './deck.js';
import { STEPS_PER_STAGE } from '../../engine/quete.js';

const levelId = (x) => String(x || '').toLowerCase();

function pools({ level, subjects, skills, tracks, minDifficulty = 0, exclude }) {
  const lessonPool = store.index.exercises.filter((e) => levelId(e.level) === level && subjects.includes(e.subject) && tracks.includes(e.track)
    && quickExercise(e) && (e.difficulty || 2) >= minDifficulty && !exclude.has(e.id) && (!skills || skills.has(e.skill)));
  const genPool = allGenerators(store.index)
    .filter((g) => subjects.includes(g.subject) && g.levels.map(levelId).includes(level) && g.kind !== 'probleme' && (!skills || coversSkills(g, skills)))
    .flatMap((g) => (g.tracks || ['classe']).filter((t) => tracks.includes(t)).map((t) => ({ ...g, track: t })));
  return { lessonPool, genPool };
}

/** Élément enregistrable (sans les métadonnées complètes d'un générateur). */
function toItem(x) {
  if (x.kind === 'gen') return { kind: 'gen', gen: x.meta.id, seed: x.seed, opts: x.opts, skill: x.skill, track: x.track, difficulty: x.difficulty };
  return { kind: 'lesson', id: x.id, ...(x.seed ? { seed: x.seed } : {}), skill: x.skill, track: x.track, difficulty: x.difficulty };
}

function draw(spec, count, rand) {
  const { lessonPool, genPool } = pools(spec);
  return buildSeries({ lessonPool, genPool, count, adapted: Boolean(spec.adapted), recent: recentExerciseIds(40), rand, level: spec.level }).map(toItem);
}

/** Défis : approfondissement, puis exercices exigeants de la classe, puis n'importe quel exercice de la classe. */
function drawChallenges(base, count, exclude, rand) {
  const out = [];
  for (const spec of [{ tracks: ['approfondissement'] }, { tracks: ['classe'], minDifficulty: 3 }, { tracks: ['classe'] }]) {
    if (out.length >= count) break;
    const used = new Set([...exclude, ...out.filter((x) => x.kind === 'lesson').map((x) => x.id)]);
    out.push(...draw({ ...base, ...spec, exclude: used }, count - out.length, rand));
  }
  return out.slice(0, count).sort((a, b) => (a.difficulty || 2) - (b.difficulty || 2));
}

/**
 * @param {{ level: string, subject: string, skills?: Set<string>|null, stages: number, rand?: Function }} p
 * @returns {{ steps: object[], challenges: object[] } | null} moins d'étapes que demandé s'il n'y a pas assez d'exercices
 */
export function planQuest({ level, subject, skills = null, stages, rand = Math.random }) {
  const lv = levelId(level);
  const base = { level: lv, subjects: subject === 'tous' ? gameSubjects(lv) : [subject], skills: skills && skills.size ? skills : null };
  let steps = draw({ ...base, tracks: ['classe'], exclude: new Set() }, stages * STEPS_PER_STAGE, rand);
  const n = Math.min(stages, Math.floor(steps.length / STEPS_PER_STAGE));
  if (!n) return null;
  steps = steps.slice(0, n * STEPS_PER_STAGE).sort((a, b) => (a.difficulty || 2) - (b.difficulty || 2));
  const used = new Set(steps.filter((x) => x.kind === 'lesson').map((x) => x.id));
  const challenges = drawChallenges(base, n, used, rand);
  if (challenges.length < n) return null;
  return { steps, challenges };
}

/** Nouvelle question de défi (pour retenter un défi manqué), différente de celles de la quête. */
export function anotherChallenge(q, rand = Math.random) {
  const used = new Set([...q.steps, ...q.challenges].filter((x) => x.kind === 'lesson').map((x) => x.id));
  const [item] = drawChallenges({ level: levelId(q.level), subjects: q.subject === 'tous' ? gameSubjects(levelId(q.level)) : [q.subject], skills: q.skills ? new Set(q.skills) : null }, 1, used, rand);
  return item || null;
}

/** Prépare l'exercice d'un élément de quête : { def, lessonId, seed }. */
export async function materializeItem(item) {
  if (item.kind === 'gen') {
    const meta = allGenerators(store.index).find((g) => g.id === item.gen);
    if (!meta) throw new Error(`Générateur introuvable : ${item.gen}`);
    return materialize({ kind: 'gen', meta, seed: item.seed, opts: item.opts || {} });
  }
  return materialize({ kind: 'lesson', id: item.id, seed: item.seed });
}
