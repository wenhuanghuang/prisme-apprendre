/**
 * Quête : un jeu linéaire dans l'Espace exercices. On avance pas à pas, un exercice après l'autre ; toutes les
 * quatre étapes, un défi garde un coffre. Défi relevé (réussi sans voir la correction, au plus un indice ou un
 * deuxième essai) : le coffre s'ouvre (points et vignette de l'album). Défi manqué : on le retente avec une autre
 * question, ou on continue sans ce coffre. Au bout du chemin, le grand coffre s'ouvre si l'on a gagné au moins la
 * moitié des étoiles des étapes.
 *
 * Fonctions pures sur un état JSON (sauvegardé après chaque étape, repris au retour). Les exercices sont choisis
 * par l'interface (quest-plan.js) : ici, seulement l'ordre, les résultats et les récompenses.
 */

export const STEPS_PER_STAGE = 4;
export const CHALLENGE_MIN_STARS = 2;
export const QUEST_PASS = 0.5; // part des étoiles des étapes pour ouvrir le grand coffre

export const QUEST_SIZES = {
  courte: { stages: 3, label: 'Courte', detail: '12 exercices · 3 défis' },
  normale: { stages: 5, label: 'Normale', detail: '20 exercices · 5 défis' },
  longue: { stages: 8, label: 'Longue', detail: '32 exercices · 8 défis' },
};

/**
 * @param {{ id: string, title: string, level: string, subject: string, chapter?: string|null, skills?: string[], size: string,
 *           steps: object[], challenges: object[], now: number }} p  steps : STEPS_PER_STAGE × nombre de défis
 */
export function newQuest(p) {
  const stages = p.challenges.length;
  if (!stages || p.steps.length !== stages * STEPS_PER_STAGE) throw new Error('Quête mal formée : 4 exercices par défi.');
  return {
    version: 1, id: p.id, title: p.title, level: p.level, subject: p.subject, chapter: p.chapter || null, size: p.size,
    skills: p.skills ? [...p.skills] : null, // notions du chapitre choisi (pour tirer un autre défi)
    steps: p.steps, challenges: p.challenges,
    stepStars: Array(p.steps.length).fill(null), // 0 à 3, null = pas encore fait
    challengeState: Array.from({ length: stages }, () => ({ tries: 0, passed: false, skipped: false })),
    pos: 0, createdAt: p.now, finishedAt: null,
  };
}

export const stageCount = (q) => q.challenges.length;
export const nodeCount = (q) => stageCount(q) * (STEPS_PER_STAGE + 1);

/** Nœud n° i du chemin : 4 étapes puis le défi de l'étape, et ainsi de suite. */
export function nodeAt(q, i) {
  if (i < 0 || i >= nodeCount(q)) return null;
  const stage = Math.floor(i / (STEPS_PER_STAGE + 1));
  const k = i % (STEPS_PER_STAGE + 1);
  if (k < STEPS_PER_STAGE) {
    const step = stage * STEPS_PER_STAGE + k;
    return { i, kind: 'pas', stage, step, item: q.steps[step], stars: q.stepStars[step] };
  }
  return { i, kind: 'defi', stage, item: q.challenges[stage], ...q.challengeState[stage] };
}

export const currentNode = (q) => nodeAt(q, q.pos);
export const isOver = (q) => q.pos >= nodeCount(q);

/** Étape faite : on avance d'un pas, réussie ou non (les étoiles restent sur le chemin). */
export function answerStep(q, stars) {
  const n = currentNode(q);
  if (!n || n.kind !== 'pas') throw new Error('Ce n’est pas une étape.');
  q.stepStars[n.step] = clampStars(stars);
  q.pos += 1;
  return { stars: q.stepStars[n.step] };
}

/** Réponse au défi : relevé, le coffre s'ouvre et on avance ; sinon on reste devant le coffre. */
export function answerChallenge(q, stars, now) {
  const n = currentNode(q);
  if (!n || n.kind !== 'defi') throw new Error('Ce n’est pas un défi.');
  const st = q.challengeState[n.stage];
  st.tries += 1;
  const passed = clampStars(stars) >= CHALLENGE_MIN_STARS;
  if (passed) { st.passed = true; q.pos += 1; }
  const over = finishIfOver(q, now);
  return { passed, tries: st.tries, chest: passed ? chestId(q, n.stage) : null, over };
}

/** Nouvelle question pour retenter un défi manqué. */
export function replaceChallenge(q, item) {
  const n = currentNode(q);
  if (!n || n.kind !== 'defi') throw new Error('Ce n’est pas un défi.');
  q.challenges[n.stage] = item;
}

/** Continuer sans ce coffre (seulement après au moins un essai). */
export function skipChallenge(q, now) {
  const n = currentNode(q);
  if (!n || n.kind !== 'defi' || n.tries < 1) throw new Error('On ne peut passer un défi qu’après l’avoir tenté.');
  q.challengeState[n.stage].skipped = true;
  q.pos += 1;
  return { over: finishIfOver(q, now) };
}

function finishIfOver(q, now) {
  if (isOver(q) && q.finishedAt === null) q.finishedAt = now;
  return isOver(q);
}

const clampStars = (s) => Math.max(0, Math.min(3, Math.round(Number(s) || 0)));

/** Identifiants des évènements de récompense (une seule fois chacun : on ne regagne pas un coffre déjà ouvert). */
export const chestId = (q, stage) => `${q.id}:${stage + 1}`;

/** Bilan de la quête : étoiles, défis relevés, grand coffre. */
export function questSummary(q) {
  const stars = q.stepStars.reduce((s, x) => s + (x || 0), 0);
  const maxStars = q.steps.length * 3;
  const passed = q.challengeState.filter((c) => c.passed).length;
  const done = isOver(q);
  return {
    stars, maxStars, ratio: maxStars ? stars / maxStars : 0,
    challenges: stageCount(q), passed,
    stage: Math.min(stageCount(q), Math.floor(q.pos / (STEPS_PER_STAGE + 1)) + 1),
    done, grandChest: done && maxStars > 0 && stars / maxStars >= QUEST_PASS,
  };
}
