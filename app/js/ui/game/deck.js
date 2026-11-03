/**
 * Pioche de questions du jeu de plateau, propre à chaque joueur (sa classe, sa matière) :
 * exercices courts des leçons et exercices générés, corrigés et diagnostiqués comme ailleurs.
 * Le contexte du joueur doit être actif pendant le tirage (notions fragiles, exercices récents).
 */
import { store, recentExerciseIds } from '../../app/store.js';
import { allGenerators, coversSkills } from '../../generators/registry.js';
import { buildSeries, levelsWithContent, subjectsAt, materialize } from '../views/exercices.js';

const levelId = (x) => String(x || '').toLowerCase();

/** Une question de jeu se joue en quelques minutes : ni rédaction à faire relire, ni laboratoire, ni mission. */
export function quickExercise(e) {
  return e.type !== 'open' && e.role !== 'labo' && e.role !== 'mission' && (e.expectedSeconds || 120) <= 240;
}

export const gameLevels = () => levelsWithContent();

/** Classe proposée à un joueur : la sienne si elle a des contenus, sinon la plus proche. */
export function nearestLevel(level) {
  const levels = gameLevels();
  const want = levelId(level);
  if (levels.includes(want)) return want;
  const order = store.catalog ? store.catalog.levels.map((l) => l.id) : levels;
  const at = order.indexOf(want);
  if (at < 0) return levels[0];
  return levels.slice().sort((a, b) => Math.abs(order.indexOf(a) - at) - Math.abs(order.indexOf(b) - at))[0];
}

export const gameSubjects = (level) => subjectsAt(levelId(level));

const shuffled = (arr) => arr.map((x) => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);

/** Notions à consolider du joueur actif (pour les cases Révision). */
function fragileSkills() {
  const now = store.now();
  const out = new Set();
  for (const [id, st] of Object.entries((store.states && store.states.skills) || {})) {
    if (st.pL < 0.8 || (st.due && st.due <= now + 86400000)) out.add(id);
  }
  return out;
}

/**
 * @param {{ level: string, subject: string }} who  subject = identifiant de matière ou « tous »
 */
export function createDeck({ level, subject }) {
  const lv = levelId(level);
  const used = new Set();

  function pools(subj, tracks, skills, minDifficulty = 0) {
    const lessonPool = store.index.exercises.filter((e) => levelId(e.level) === lv && e.subject === subj && tracks.includes(e.track)
      && quickExercise(e) && !used.has(e.id) && (e.difficulty || 2) >= minDifficulty && (!skills || skills.has(e.skill)));
    const gens = allGenerators(store.index).filter((g) => g.subject === subj && g.levels.map(levelId).includes(lv) && g.kind !== 'probleme'
      && (!skills || coversSkills(g, skills)));
    const genPool = gens.flatMap((g) => (g.tracks || ['classe']).filter((t) => tracks.includes(t)).map((t) => ({ ...g, track: t })));
    return { lessonPool, genPool };
  }

  /** Plans de tirage, du plus fidèle à la case au plus large : on prend le premier qui donne un exercice. */
  function plans(question) {
    if (question === 'defi') return [{ tracks: ['approfondissement'] }, { tracks: ['classe'], minDifficulty: 3 }, { tracks: ['classe'] }];
    if (question === 'revision') {
      const fragile = fragileSkills();
      return [...(fragile.size ? [{ tracks: ['classe', 'approfondissement'], skills: fragile, adapted: true }] : []), { tracks: ['classe'], adapted: true }];
    }
    return [{ tracks: ['classe'] }];
  }

  const subjects = () => (subject && subject !== 'tous' ? [subject] : shuffled(gameSubjects(lv)));

  /** Tire et prépare une question ; renvoie { def, lessonId, seed, subject, track } ou null. */
  async function draw(question) {
    for (let round = 0; round < 2; round++) {
      for (const plan of plans(question)) {
        for (const subj of subjects()) {
          const { lessonPool, genPool } = pools(subj, plan.tracks, plan.skills || null, plan.minDifficulty || 0);
          const [item] = buildSeries({ lessonPool, genPool, count: 1, adapted: Boolean(plan.adapted), recent: recentExerciseIds(30), level: lv });
          if (!item) continue;
          if (item.kind === 'lesson') used.add(item.id);
          try {
            const m = await materialize(item);
            if (m && m.def) return { ...m, subject: subj, track: item.track };
          } catch { /* exercice indisponible : on en tire un autre */ }
        }
      }
      used.clear(); // tous les exercices de leçon ont servi : on recommence la pioche
    }
    return null;
  }

  return { draw };
}
