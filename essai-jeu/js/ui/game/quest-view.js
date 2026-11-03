/**
 * Onglet « Quête » de l'Espace exercices : un chemin linéaire. On avance pas à pas (un exercice par étape) ;
 * toutes les quatre étapes, un défi garde un coffre (points + vignette) ; au bout, le grand coffre.
 * La quête en cours est sauvegardée pour chaque profil et reprise au retour.
 */
import { h, announce } from '../dom.js';
import { store, getSetting, setSetting, loadCourse, recordGameEvent, gameProgress } from '../../app/store.js';
import {
  QUEST_SIZES, STEPS_PER_STAGE, QUEST_PASS, newQuest, nodeAt, nodeCount, currentNode, isOver,
  answerStep, answerChallenge, replaceChallenge, skipChallenge, chestId, questSummary, stageCount,
} from '../../engine/quete.js';
import { XP } from '../../engine/game.js';
import { planQuest, anotherChallenge, materializeItem } from './quest-plan.js';
import { gameLevels, nearestLevel, gameSubjects } from './deck.js';
import { subjLabel } from '../views/exercices.js';
import { mountExercise } from '../exercise.js';
import { photon } from '../photon.js';
import { chestReveal, chestSvg, newVignettes } from './rewards-ui.js';
import { yearCards, yearMap } from './year-view.js';

const levelId = (x) => String(x || '').toLowerCase();
const levelLabel = (id) => ((store.catalog && store.catalog.levels.find((l) => l.id === id)) || { label: id }).label;
const saveKey = () => `quete:${store.profile.id}`;
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const starsText = (n) => (n === null || n === undefined ? '' : '★'.repeat(n) + '☆'.repeat(3 - n));

/** Chapitres d'un parcours qui ont des exercices de quête, avec leurs notions. */
async function chaptersOf(level, subject) {
  if (!subject || subject === 'tous' || !store.catalog) return [];
  const course = store.catalog.courses.find((c) => c.level === level && c.subject === subject);
  const data = course ? await loadCourse(course.id) : null;
  const have = new Set(store.index.exercises.filter((e) => levelId(e.level) === level && e.subject === subject).map((e) => e.skill));
  return ((data && data.chapters) || []).map((ch) => ({ id: ch.id, title: ch.title, skills: (ch.skills || []).filter((s) => have.has(s)) })).filter((ch) => ch.skills.length);
}

/* ------------------------------ Mise en place ------------------------------ */

async function setupScreen(stage, { onStart }) {
  const levels = gameLevels();
  const state = { level: nearestLevel(store.profile.level), subject: 'tous', chapter: '', size: 'normale' };
  const err = h('p', { class: 'warn', 'aria-live': 'assertive' });
  const draw = async () => {
    const subjects = gameSubjects(state.level);
    if (state.subject !== 'tous' && !subjects.includes(state.subject)) state.subject = 'tous';
    const chapters = await chaptersOf(state.level, state.subject);
    if (!chapters.some((c) => c.id === state.chapter)) state.chapter = '';
    const sel = (key, label, value, options, onchange) => h('label', { class: 'field' }, h('span', { class: 'field-label' }, label),
      h('select', { class: 'field-input', dataset: { key }, onchange: (e) => onchange(e.target.value) }, options.map(([v, l]) => h('option', { value: v, selected: v === value }, l))));
    const focusKey = stage.contains(document.activeElement) && document.activeElement.dataset ? document.activeElement.dataset.key : null;
    const size = QUEST_SIZES[state.size];
    stage.replaceChildren(h('section', { class: 'card quest-setup' },
      h('div', { class: 'quest-setup-head' }, chestSvg({ rare: true }),
        h('div', {}, h('h2', {}, 'Pars en quête'),
          h('p', {}, 'Avance pas à pas : un exercice par étape. Toutes les quatre étapes, un ', h('strong', {}, 'défi'), ' garde un ', h('strong', {}, 'coffre'),
            ' : relève-le pour gagner des points et une vignette de ton album. Au bout du chemin, le grand coffre t’attend.'))),
      h('div', { class: 'series-grid' },
        sel('classe', 'Classe', state.level, levels.map((l) => [l, levelLabel(l)]), (v) => { state.level = v; draw(); }),
        sel('matiere', 'Matière', state.subject, [['tous', 'Toutes les matières'], ...subjects.map((s) => [s, subjLabel(s)])], (v) => { state.subject = v; state.chapter = ''; draw(); }),
        chapters.length ? sel('chapitre', 'Chapitre', state.chapter, [['', 'Tout le programme'], ...chapters.map((c) => [c.id, c.title])], (v) => { state.chapter = v; }) : null),
      h('fieldset', { class: 'jeu-size' }, h('legend', {}, 'Longueur du chemin'),
        h('div', { class: 'jeu-size-options' }, Object.entries(QUEST_SIZES).map(([id, s]) => h('label', { class: `jeu-size-opt ${state.size === id ? 'is-on' : ''}` },
          h('input', { type: 'radio', name: 'quest-size', value: id, checked: state.size === id, dataset: { key: `taille-${id}` }, onchange: () => { state.size = id; draw(); } }),
          h('strong', {}, s.label), h('span', { class: 'small muted' }, s.detail))))),
      h('p', { class: 'small muted' }, `${size.stages} coffres de défi + le grand coffre. Un défi est relevé s’il est réussi sans voir la correction, avec au plus un indice ou un deuxième essai. Le grand coffre s’ouvre avec au moins ${Math.round(QUEST_PASS * 100)} % des étoiles.`),
      err,
      h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn btn--primary jeu-go', dataset: { key: 'partir' }, onclick: () => go(chapters) }, h('span', { 'aria-hidden': 'true' }, '🗺️ '), 'Partir en quête'))));
    if (focusKey) { const el = stage.querySelector(`[data-key="${focusKey}"]`); if (el) el.focus(); }
  };
  const go = (chapters) => {
    const ch = chapters.find((c) => c.id === state.chapter);
    const plan = planQuest({ level: state.level, subject: state.subject, skills: ch ? new Set(ch.skills) : null, stages: QUEST_SIZES[state.size].stages });
    if (!plan) { err.textContent = 'Pas assez d’exercices pour ce choix : prends une autre matière ou tout le programme.'; return; }
    const q = newQuest({
      id: `q-${Date.now().toString(36)}`, title: ch ? ch.title : state.subject === 'tous' ? 'Toutes les matières' : 'Tout le programme',
      level: state.level, subject: state.subject, chapter: ch ? ch.id : null, skills: ch ? ch.skills : null, size: state.size,
      steps: plan.steps, challenges: plan.challenges, now: store.now(),
    });
    onStart(q);
  };
  await draw();
}

/* ------------------------------ Chemin ------------------------------ */

function trackView(q) {
  const list = h('ol', { class: 'quest-track', 'aria-label': 'Chemin de la quête' });
  const paint = () => {
    const nodes = [];
    for (let i = 0; i < nodeCount(q); i++) {
      const n = nodeAt(q, i);
      const current = i === q.pos;
      const done = i < q.pos;
      if (n.kind === 'pas') {
        nodes.push(h('li', { class: `qnode qnode--pas ${done ? 'is-done' : ''} ${current ? 'is-current' : ''} ${n.step % STEPS_PER_STAGE === 0 ? 'is-stage-start' : ''}`, 'aria-current': current ? 'step' : null },
          n.step % STEPS_PER_STAGE === 0 ? h('span', { class: 'qnode-stage' }, `Étape ${n.stage + 1}`) : null,
          h('span', { class: 'qnode-dot', 'aria-hidden': 'true' }, done ? (n.stars ? '★' : '·') : String(n.step % STEPS_PER_STAGE + 1)),
          h('span', { class: 'sr-only' }, `Exercice ${n.step + 1}${done ? ` : ${n.stars} étoile${n.stars > 1 ? 's' : ''}` : current ? ' : en cours' : ''}`),
          done && n.stars ? h('small', { class: 'qnode-stars', 'aria-hidden': 'true' }, starsText(n.stars)) : null));
      } else {
        const state = n.passed ? 'is-open' : n.skipped ? 'is-skipped' : '';
        nodes.push(h('li', { class: `qnode qnode--defi ${state} ${current ? 'is-current' : ''}`, 'aria-current': current ? 'step' : null },
          h('span', { class: 'qnode-chest', 'aria-hidden': 'true' }, chestSvg({ open: n.passed })),
          h('span', { class: 'sr-only' }, `Défi de l’étape ${n.stage + 1} : ${n.passed ? 'coffre ouvert' : n.skipped ? 'coffre laissé fermé' : current ? 'en cours' : 'à venir'}`)));
      }
    }
    const sum = questSummary(q);
    nodes.push(h('li', { class: `qnode qnode--final ${isOver(q) ? (sum.grandChest ? 'is-open' : 'is-skipped') : ''}` },
      h('span', { class: 'qnode-chest', 'aria-hidden': 'true' }, chestSvg({ rare: true, open: isOver(q) && sum.grandChest })),
      h('span', { class: 'sr-only' }, 'Grand coffre de fin de quête')));
    list.replaceChildren(...nodes);
    const cur = list.querySelector('.is-current');
    if (cur && list.scrollWidth > list.clientWidth) list.scrollTo({ left: Math.max(0, cur.offsetLeft - list.clientWidth / 2), behavior: reduced() ? 'auto' : 'smooth' });
  };
  paint();
  return { el: list, paint };
}

/* ------------------------------ Partie ------------------------------ */

/**
 * Joue une quête. Pour un chapitre de la quête de l'année : `save` enregistre la quête dans l'année, et `onFinished`
 * remplace le grand coffre (l'année donne une médaille au chapitre).
 */
export function playQuest(stage, q, { onNew, onPause, setStopper, save: saveTo = null, onFinished = null, eyebrow = null }) {
  let current = null; let stopped = false;
  setStopper(() => { stopped = true; if (current) { current.destroy(); current = null; } });
  const save = () => (saveTo ? saveTo(q) : setSetting(saveKey(), q)).catch(() => {});
  const track = trackView(q);
  const score = h('p', { class: 'quest-score', 'aria-live': 'polite' });
  const slot = h('div', { class: 'quest-slot' });
  const paintScore = () => {
    const s = questSummary(q);
    score.replaceChildren(h('span', {}, h('b', {}, `★ ${s.stars}`), h('small', {}, `/${s.maxStars}`)), h('span', {}, '🎁 ', h('b', {}, String(s.passed)), h('small', {}, `/${s.challenges} coffres`)));
  };
  stage.replaceChildren(
    h('div', { class: 'series-head quest-head' },
      h('div', {}, h('p', { class: 'eyebrow' }, eyebrow || `Quête · ${q.subject === 'tous' ? 'toutes matières' : subjLabel(q.subject)} · ${levelLabel(q.level)}`), h('h2', {}, q.title)),
      h('div', { class: 'btn-row' }, score, h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => { if (current) { current.destroy(); current = null; } stopped = true; onPause(); } }, 'Faire une pause'))),
    track.el, slot);

  const focusIn = (el) => {
    const first = el.querySelector('.ex-answer input, .ex-answer textarea, .ex-answer select, .ex-answer [tabindex="0"], .ex-answer button');
    if (first && first.focus) first.focus({ preventScroll: true });
  };

  async function show() {
    if (stopped) return;
    if (current) { current.destroy(); current = null; }
    track.paint(); paintScore();
    if (isOver(q)) { finale(); return; }
    const n = currentNode(q);
    if (n.kind === 'defi' && n.tries > 0) { failedChallenge(n); return; } // repris après un défi manqué
    const intro = n.kind === 'defi'
      ? h('div', { class: 'card quest-intro quest-intro--defi' }, chestSvg(), h('div', {}, h('p', { class: 'quest-kind' }, `Défi de l’étape ${n.stage + 1}`),
        h('p', {}, 'Une question plus exigeante garde le coffre. Relève-la sans voir la correction, avec au plus un indice ou un deuxième essai, pour l’ouvrir.')))
      : n.step % STEPS_PER_STAGE === 0
        ? h('div', { class: 'card quest-intro' }, photon('curieux', 44), h('div', {}, h('p', { class: 'quest-kind' }, `Étape ${n.stage + 1} sur ${stageCount(q)}`),
          h('p', {}, `${STEPS_PER_STAGE} exercices, puis un défi pour ouvrir le coffre.`)))
        : null;
    const exSlot = h('div', {});
    slot.replaceChildren(...[intro, exSlot].filter(Boolean));
    let m;
    try { m = await materializeItem(n.item); } catch {
      if (stopped) return;
      // exercice disparu des contenus : on le remplace par un autre du même genre, sans pénalité
      if (n.kind === 'defi') { const it = anotherChallenge(q); if (it) { replaceChallenge(q, it); save(); show(); return; } }
      exSlot.replaceChildren(h('p', { class: 'card warn' }, 'Cet exercice n’est plus disponible : on passe à la suite.'));
      setTimeout(() => { answerStep(q, 0); save(); show(); }, 900);
      return;
    }
    if (stopped) return;
    const nextIsChallenge = n.kind === 'pas' && (n.step % STEPS_PER_STAGE) === STEPS_PER_STAGE - 1;
    current = mountExercise(exSlot, {
      def: m.def, seed: m.seed, lessonId: m.lessonId, context: n.kind === 'defi' ? 'quete:defi' : 'quete',
      nextLabel: n.kind === 'defi' ? 'Voir le coffre →' : nextIsChallenge ? 'Vers le défi →' : 'Étape suivante →',
      onNext: (diag, out) => resolve(n, out.stars),
    });
    focusIn(exSlot);
    slot.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
  }

  async function resolve(n, stars) {
    if (stopped) return;
    if (current) { current.destroy(); current = null; }
    if (n.kind === 'pas') { answerStep(q, stars); save(); show(); return; }
    const res = answerChallenge(q, stars, store.now());
    save();
    track.paint(); paintScore();
    if (!res.passed) { failedChallenge(currentNode(q)); return; }
    const before = gameProgress();
    await recordGameEvent('defi', res.chest).catch(() => {});
    const after = gameProgress();
    const [vignette] = newVignettes(before, after);
    const gained = after && before ? after.totalXp - before.totalXp : XP.defi;
    const next = h('button', { type: 'button', class: 'btn btn--primary', onclick: () => show() }, isOver(q) ? (onFinished ? 'Terminer le chapitre →' : 'Vers le grand coffre →') : 'Continuer la quête →');
    slot.replaceChildren(h('div', { class: 'card quest-chest' },
      chestReveal({ title: `Coffre de l’étape ${n.stage + 1} ouvert !`, points: gained > 0 ? gained : 0, vignette, already: gained <= 0 }),
      h('div', { class: 'btn-row quest-next' }, next)));
    announce(`Défi relevé : coffre ouvert.${vignette ? ` Nouvelle vignette : ${vignette.label}.` : ''}`);
    setTimeout(() => next.focus({ preventScroll: true }), 50);
  }

  function failedChallenge(n) {
    const retry = h('button', { type: 'button', class: 'btn btn--primary' }, 'Retenter le défi (autre question)');
    const skip = h('button', { type: 'button', class: 'btn btn--ghost' }, 'Continuer sans ce coffre');
    retry.addEventListener('click', () => {
      const it = anotherChallenge(q);
      if (it) replaceChallenge(q, it); // sinon on retente la même question
      save();
      showChallengeAgain();
    });
    skip.addEventListener('click', () => { skipChallenge(q, store.now()); save(); show(); });
    slot.replaceChildren(h('div', { class: 'card quest-failed' }, chestSvg(),
      h('div', {}, h('h3', { tabindex: '-1' }, 'Le coffre reste fermé…'),
        h('p', {}, `Ce défi n’est pas encore relevé (${n.tries} essai${n.tries > 1 ? 's' : ''}). Relis bien la correction, puis retente ta chance avec une autre question — ou continue la quête sans ce coffre.`),
        h('div', { class: 'btn-row' }, retry, skip))));
    retry.focus({ preventScroll: true });
  }

  /** Défi retenté : on rejoue le défi courant même s'il a déjà des essais. */
  async function showChallengeAgain() {
    const n = currentNode(q);
    track.paint(); paintScore();
    const exSlot = h('div', {});
    slot.replaceChildren(h('div', { class: 'card quest-intro quest-intro--defi' }, chestSvg(), h('div', {}, h('p', { class: 'quest-kind' }, `Défi de l’étape ${n.stage + 1} · nouvel essai`),
      h('p', {}, 'Une autre question pour ouvrir le coffre. Prends ton temps !'))), exSlot);
    let m;
    try { m = await materializeItem(n.item); } catch { failedChallenge(n); return; }
    if (stopped) return;
    current = mountExercise(exSlot, { def: m.def, seed: m.seed, lessonId: m.lessonId, context: 'quete:defi', nextLabel: 'Voir le coffre →', onNext: (diag, out) => resolve(n, out.stars) });
    focusIn(exSlot);
  }

  async function finale() {
    const s = questSummary(q);
    if (onFinished) { if (!stopped) onFinished(s, q); return; }
    setSetting(saveKey(), null).catch(() => {});
    let reveal = null;
    if (s.grandChest) {
      const before = gameProgress();
      await recordGameEvent('quete', q.id).catch(() => {});
      const after = gameProgress();
      const [vignette] = newVignettes(before, after);
      const gained = after && before ? after.totalXp - before.totalXp : XP.quete;
      reveal = chestReveal({ title: 'Le grand coffre s’ouvre !', points: gained > 0 ? gained : 0, vignette, rare: true, already: gained <= 0 });
    }
    if (stopped) return;
    track.paint(); paintScore();
    slot.replaceChildren(h('section', { class: 'card quest-end' },
      h('div', { class: 'jeu-turn-head' }, photon(s.grandChest ? 'bravo' : 'encourage', 64),
        h('div', {}, h('p', { class: 'eyebrow' }, 'Quête terminée'), h('h3', { tabindex: '-1' }, s.grandChest ? 'Quête réussie !' : 'Bout du chemin atteint'))),
      h('p', {}, `★ ${s.stars} étoiles sur ${s.maxStars} · ${s.passed} coffre${s.passed > 1 ? 's' : ''} de défi ouvert${s.passed > 1 ? 's' : ''} sur ${s.challenges}.`),
      s.grandChest ? null : h('p', { class: 'small' }, `Le grand coffre demande au moins ${Math.round(QUEST_PASS * 100)} % des étoiles : relis les corrections et retente une quête, tu y es presque !`),
      reveal,
      h('div', { class: 'btn-row' },
        h('button', { type: 'button', class: 'btn btn--primary', onclick: () => onNew() }, 'Nouvelle quête'),
        h('a', { class: 'btn btn--ghost', href: '#/progression?voir=album' }, 'Mon album de lumière'),
        h('a', { class: 'btn btn--ghost', href: '#/carnet' }, 'Mon carnet'))));
    announce(s.grandChest ? 'Quête réussie : le grand coffre est ouvert.' : 'Quête terminée.');
    const t = slot.querySelector('h3'); if (t) t.focus({ preventScroll: true });
  }

  show();
}

/* ------------------------------ Onglet ------------------------------ */

export async function questPanel(panel, cleanup) {
  const stage = h('div', { class: 'quest-stage' });
  panel.append(stage);
  let stopper = null;
  const stop = () => { if (stopper) { stopper(); stopper = null; } };
  cleanup.fn = stop;
  let homeLevel = null;
  const handlers = () => ({ onNew: () => { stop(); setupScreen(stage, { onStart: start }); }, onPause: () => { stop(); home(); }, setStopper: (fn) => { stopper = fn; } });
  function start(q) { stop(); setSetting(saveKey(), q).catch(() => {}); playQuest(stage, q, handlers()); }
  /**
   * Accueil de l'onglet : la quête de l'année de chaque matière (le chemin principal, de septembre à juin), puis
   * la quête libre (courte, au choix) — reprise si elle est en cours.
   */
  async function home() {
    stop();
    const saved = await getSetting(saveKey(), null).catch(() => null);
    const free = saved && saved.version === 1 && !isOver(saved) && Array.isArray(saved.steps) ? saved : null;
    const levels = gameLevels();
    let level = homeLevel || nearestLevel(store.profile.level);
    const cards = h('div', { class: 'grid grid--3 year-cards' }, h('p', { class: 'muted' }, 'Je prépare ton année…'));
    const s = free ? questSummary(free) : null;
    stage.replaceChildren(
      h('section', { class: 'year-home' },
        h('div', { class: 'year-home-head' },
          h('div', {}, h('h2', {}, 'Mon année, pas à pas'),
            h('p', { class: 'muted' }, 'Chaque matière est un chemin de septembre à juin : les chapitres du programme dans l’ordre, avec des défis, des coffres, une médaille par chapitre et un coffre rare à la fin de chaque période.')),
          h('label', { class: 'field year-level' }, h('span', { class: 'field-label' }, 'Classe'),
            h('select', { class: 'field-input', dataset: { key: 'annee-classe' }, onchange: (e) => { homeLevel = e.target.value; home(); } }, levels.map((l) => h('option', { value: l, selected: l === level }, levelLabel(l)))))),
        cards),
      h('section', { class: 'card quest-resume quest-free' }, chestSvg({ rare: Boolean(free) }),
        h('div', {},
          h('h2', {}, free ? 'Ta quête libre t’attend' : 'Quête libre'),
          h('p', {}, free
            ? `${free.subject === 'tous' ? 'Toutes matières' : subjLabel(free.subject)} · ${levelLabel(free.level)} · ${free.title} — étape ${s.stage} sur ${s.challenges}, ★ ${s.stars}.`
            : 'Une quête courte, au choix : une matière ou toutes, un chapitre, 12 à 32 exercices, et le grand coffre au bout.'),
          h('div', { class: 'btn-row' },
            free ? h('button', { type: 'button', class: 'btn btn--primary', onclick: () => { stop(); playQuest(stage, free, handlers()); } }, 'Continuer ma quête libre') : null,
            h('button', { type: 'button', class: free ? 'btn btn--ghost' : 'btn', onclick: () => { if (free) setSetting(saveKey(), null).catch(() => {}); setupScreen(stage, { onStart: start }); } }, free ? 'En choisir une autre' : 'Choisir une quête libre')))));
    await yearCards(cards, { level, onOpen: (subject) => openYear(level, subject) });
  }
  async function openYear(level, subject) {
    stop();
    await yearMap(stage, { level, subject, onBack: () => home(), setStopper: (fn) => { stopper = fn; } });
  }
  await home();
}
