/**
 * L'énigme du jour (#/enigme) : une question un peu plus exigeante, de la classe de l'enfant, dans une matière qui
 * change chaque jour ; résolue, elle rapporte des points et allonge la série d'énigmes, puis un « Le savais-tu ? »
 * récompense la curiosité. Une par jour : la suivante arrive demain (sauter un jour ne fait rien perdre).
 */
import { h, announce } from '../dom.js';
import { store, getSetting, setSetting, recordGameEvent, gameProgress } from '../../app/store.js';
import { dayKey } from '../../engine/game.js';
import { daySeed, subjectOfDay, enigmaStreak, factOfDay } from '../../engine/enigme.js';
import { rng } from '../../core/template.js';
import { buildSeries, subjLabel } from './exercices.js';
import { gameSubjects, nearestLevel, quickExercise } from '../game/deck.js';
import { allGenerators } from '../../generators/registry.js';
import { materializeItem } from '../game/quest-plan.js';
import { mountExercise } from '../exercise.js';
import { photon } from '../photon.js';
import { burstStars } from '../lesson-play/celebrate.js';

const levelId = (x) => String(x || '').toLowerCase();
const missKey = (key) => `enigme:${store.profile.id}:${key}`;
const tally = (st) => `Une énigme par jour, un peu plus difficile que d’habitude. Série : ${st.streak} jour${st.streak > 1 ? 's' : ''} · ${st.total} énigme${st.total > 1 ? 's' : ''} résolue${st.total > 1 ? 's' : ''}.`;

/** L'exercice du jour : défi ◆ si possible, sinon un exercice exigeant de la classe ; le même pour toute la journée. */
export function enigmaItem(key, level) {
  const subjects = gameSubjects(level);
  const subject = subjectOfDay(key, subjects);
  if (!subject) return null;
  const rand = rng(daySeed(key, level, subject));
  const lessons = (tracks, minD) => store.index.exercises.filter((e) => levelId(e.level) === level && e.subject === subject && tracks.includes(e.track) && quickExercise(e) && (e.difficulty || 2) >= minD);
  const gens = (tracks) => allGenerators(store.index).filter((g) => g.subject === subject && g.levels.map(levelId).includes(level) && g.kind !== 'probleme')
    .flatMap((g) => (g.tracks || ['classe']).filter((t) => tracks.includes(t)).map((t) => ({ ...g, track: t })));
  for (const [tracks, minD] of [[['approfondissement'], 0], [['classe'], 3], [['classe'], 0]]) {
    const [it] = buildSeries({ lessonPool: lessons(tracks, minD), genPool: gens(tracks), count: 1, adapted: false, recent: [], rand, level });
    if (it) return { subject, item: it.kind === 'gen' ? { kind: 'gen', gen: it.meta.id, seed: it.seed, opts: it.opts } : { kind: 'lesson', id: it.id } };
  }
  return null;
}

/** État de l'énigme du jour pour le profil actif : à faire, résolue, ou manquée (correction vue). */
export async function enigmaStatus(now = store.now()) {
  const key = dayKey(now);
  const events = (store.states && store.states.game && store.states.game.events) || [];
  const st = enigmaStreak(events, now);
  if (st.solvedToday) return { key, state: 'resolue', ...st };
  const missed = await getSetting(missKey(key), null).catch(() => null);
  return { key, state: missed ? 'manquee' : 'a-faire', ...st };
}

export async function render(root) {
  const level = nearestLevel(store.profile.level);
  const status = await enigmaStatus();
  const pick = enigmaItem(status.key, level);
  const head = h('div', { class: 'page-head' }, h('div', {},
    h('p', { class: 'eyebrow' }, `L’énigme du jour · ${new Date(store.now()).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`),
    h('h1', {}, pick ? `🧩 ${subjLabel(pick.subject)}` : '🧩 L’énigme du jour'),
    h('p', { class: 'muted enigme-tally' }, tally(status))));
  const stage = h('div', { class: 'enigme-stage' });
  root.append(head, stage);
  let current = null;

  const factCard = () => {
    const f = factOfDay(status.key, pick ? pick.subject : 'maths');
    return h('aside', { class: 'card enigme-fact' }, h('span', { class: 'enigme-fact-icon', 'aria-hidden': 'true' }, '💡'),
      h('div', {}, h('p', { class: 'eyebrow' }, 'Le savais-tu ?'), h('p', {}, f.text)));
  };
  const comeBack = (title, mood, extra) => {
    stage.replaceChildren(h('section', { class: 'card enigme-done' }, photon(mood, 64),
      h('div', {}, h('h2', { tabindex: '-1' }, title), extra || null,
        h('p', { class: 'small muted' }, 'Une nouvelle énigme t’attend demain. Si tu sautes un jour, tu ne perds ni points ni trophées : seule la série repart de zéro.'),
        h('div', { class: 'btn-row' }, h('a', { class: 'btn btn--primary', href: '#/exercices' }, '🗺️ Continuer ma quête'), h('a', { class: 'btn btn--ghost', href: '#/' }, 'Aujourd’hui')))),
    factCard());
    const t = stage.querySelector('h2'); if (t) t.focus({ preventScroll: true });
  };

  if (status.state === 'resolue') { comeBack('Énigme du jour résolue ✓', 'bravo'); return undefined; }
  if (status.state === 'manquee') { comeBack('L’énigme d’aujourd’hui est passée', 'encourage', h('p', {}, 'Tu as vu la correction : retiens bien l’astuce, elle resservira !')); return undefined; }
  if (!pick) { stage.append(h('p', { class: 'card' }, 'Pas encore d’énigme pour cette classe.')); return undefined; }

  let m;
  try { m = await materializeItem(pick.item); } catch { stage.append(h('p', { class: 'card warn' }, 'L’énigme du jour n’a pas pu être préparée.')); return undefined; }
  const slot = h('div', {});
  stage.append(h('div', { class: 'card enigme-intro' }, photon('curieux', 48), h('p', {}, 'Prends ton temps : tu peux essayer plusieurs fois et demander un indice. Si tu regardes la correction, l’énigme est passée pour aujourd’hui.')), slot);
  current = mountExercise(slot, {
    def: m.def, seed: m.seed, lessonId: m.lessonId, context: 'enigme', nextLabel: 'Voir le résultat →',
    onNext: async (diag, out) => {
      if (current) { current.destroy(); current = null; }
      if (out.stars >= 1 && !out.solutionShown && !out.answerRevealed) {
        const before = gameProgress();
        await recordGameEvent('enigme', status.key).catch(() => {});
        const after = gameProgress();
        const gained = before && after ? after.totalXp - before.totalXp : 0;
        const st = enigmaStreak(store.states.game.events, store.now());
        const t = root.querySelector('.enigme-tally'); if (t) t.textContent = tally(st);
        comeBack('Énigme résolue ! 🎉', 'bravo', h('p', { class: 'chest-points' }, `+${gained} points · série : ${st.streak} jour${st.streak > 1 ? 's' : ''}`));
        burstStars(stage, 3);
        announce(`Énigme résolue. Série de ${st.streak} jours.`);
      } else {
        await setSetting(missKey(status.key), true).catch(() => {});
        comeBack('Pas cette fois…', 'encourage', h('p', {}, 'Relis bien la correction : demain, une nouvelle énigme !'));
      }
    },
  });
  const first = slot.querySelector('.ex-answer input, .ex-answer textarea, .ex-answer select, .ex-answer [tabindex="0"], .ex-answer button');
  if (first && first.focus) first.focus({ preventScroll: true });
  return () => { if (current) current.destroy(); };
}
