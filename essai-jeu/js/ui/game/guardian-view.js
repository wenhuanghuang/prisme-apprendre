/**
 * Gardien d'une période (quête de l'année) : huit questions mêlées des chapitres déjà faits ; chaque bonne réponse
 * allume un cœur du gardien, les cinq cœurs allumés il est apprivoisé et confie son trésor (coffre rare). Sinon il
 * s'envole et revient avec d'autres questions. L'affrontement en cours est enregistré avec l'année (reprise au retour).
 */
import { h, announce } from '../dom.js';
import { store, recordGameEvent, gameProgress } from '../../app/store.js';
import { GUARDIANS, GUARDIAN_HEARTS, GUARDIAN_QUESTIONS, fightState, answerFight, guardianLine, agree } from '../../engine/gardien.js';
import { materializeItem } from './quest-plan.js';
import { mountExercise } from '../exercise.js';
import { chestReveal, newVignettes } from './rewards-ui.js';
import { burstStars, confetti } from '../lesson-play/celebrate.js';

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Rangée de cœurs : allumés / à allumer. */
export function heartsRow(n, total = GUARDIAN_HEARTS) {
  return h('span', { class: 'guardian-hearts', role: 'img', 'aria-label': `${n} cœur${n > 1 ? 's' : ''} allumé${n > 1 ? 's' : ''} sur ${total}` },
    Array.from({ length: total }, (_, i) => h('i', { class: i < n ? 'is-lit' : '', 'aria-hidden': 'true' }, i < n ? '❤' : '♡')));
}

/**
 * @param {HTMLElement} stage
 * @param {object} fight affrontement (engine/gardien.js), modifié sur place
 * @param {{ eventId: string, eyebrow: string, save: Function, onExit: Function, onAgain: Function, setStopper: Function }} opts
 */
export function playGuardian(stage, fight, { eventId, eyebrow, save, onExit, onAgain, setStopper }) {
  const g = GUARDIANS[fight.period] || GUARDIANS[0];
  let current = null; let stopped = false;
  setStopper(() => { stopped = true; if (current) { current.destroy(); current = null; } });
  const persist = () => Promise.resolve(save(fight)).catch(() => {});

  const bubble = h('p', { class: 'guardian-bubble', 'aria-live': 'polite' }, fight.results.length ? 'Où en étions-nous ? Continuons !' : g.hello);
  const hearts = h('div', { class: 'guardian-meter' });
  const counter = h('p', { class: 'guardian-count small' });
  const creature = h('span', { class: 'guardian-creature', 'aria-hidden': 'true' }, g.icon);
  const slot = h('div', { class: 'quest-slot' });
  const paint = () => {
    const s = fightState(fight);
    hearts.replaceChildren(heartsRow(s.hearts));
    counter.textContent = s.over ? '' : `Question ${s.asked + 1} sur ${s.total} · encore ${GUARDIAN_HEARTS - s.hearts} cœur${GUARDIAN_HEARTS - s.hearts > 1 ? 's' : ''} à allumer`;
  };
  stage.replaceChildren(
    h('div', { class: 'series-head quest-head' },
      h('div', {}, h('p', { class: 'eyebrow' }, eyebrow), h('h2', {}, `${g.name}, ${g.what}`)),
      h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => { stopped = true; if (current) { current.destroy(); current = null; } onExit(); } }, 'Faire une pause'))),
    h('section', { class: `card guardian-arena guardian--${g.id}` }, creature, h('div', { class: 'guardian-talk' }, bubble, hearts, counter)),
    slot);
  paint();

  const focusIn = (el) => {
    const first = el.querySelector('.ex-answer input, .ex-answer textarea, .ex-answer select, .ex-answer [tabindex="0"], .ex-answer button');
    if (first && first.focus) first.focus({ preventScroll: true });
  };

  async function show() {
    if (stopped) return;
    if (current) { current.destroy(); current = null; }
    paint();
    const s = fightState(fight);
    if (s.over) { end(s); return; }
    const exSlot = h('div', {});
    slot.replaceChildren(exSlot);
    let m;
    try { m = await materializeItem(s.current); } catch {
      if (stopped) return;
      // exercice disparu des contenus : on passe à la question suivante, comptée comme réussie (pas la faute de l'élève)
      answerFight(fight, 3); persist(); show(); return;
    }
    if (stopped) return;
    const last = s.left === 1 || GUARDIAN_HEARTS - s.hearts === 1;
    current = mountExercise(exSlot, {
      def: m.def, seed: m.seed, lessonId: m.lessonId, context: 'gardien',
      nextLabel: last ? 'Voir le gardien →' : 'Question suivante →',
      onNext: (diag, out) => resolve(out.stars),
    });
    focusIn(exSlot);
  }

  function resolve(stars) {
    if (stopped) return;
    if (current) { current.destroy(); current = null; }
    const r = answerFight(fight, stars);
    persist();
    bubble.textContent = guardianLine(r.hit, r.asked - 1);
    creature.classList.remove('is-happy', 'is-doubt');
    void creature.offsetWidth; // relance l'animation
    creature.classList.add(r.hit ? 'is-happy' : 'is-doubt');
    if (r.hit) setTimeout(() => { const lit = hearts.querySelectorAll('.is-lit'); const el = lit[lit.length - 1]; if (el) burstStars(el, 2); }, 40);
    announce(r.hit ? `Un cœur s’allume : ${r.hearts} sur ${GUARDIAN_HEARTS}.` : 'Pas de cœur cette fois.');
    show();
    stage.querySelector('.guardian-arena').scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
  }

  async function end(s) {
    if (s.won) {
      const before = gameProgress();
      await recordGameEvent('gardien', eventId).catch(() => {});
      const after = gameProgress();
      if (stopped) return;
      const [vignette] = newVignettes(before, after);
      const gained = before && after ? after.totalXp - before.totalXp : 0;
      bubble.textContent = g.win;
      creature.classList.add('is-tamed');
      counter.textContent = '';
      const back = h('button', { type: 'button', class: 'btn btn--primary', onclick: () => onExit(true) }, 'Retour à mon année');
      slot.replaceChildren(h('div', { class: 'card quest-chest' },
        chestReveal({ title: `${g.name} est ${agree(g, 'apprivoisé')} : son trésor s’ouvre !`, points: gained > 0 ? gained : 0, vignette, rare: true, already: gained <= 0 }),
        h('p', { class: 'small muted' }, `${s.hearts} cœurs allumés en ${s.asked} questions.`),
        h('div', { class: 'btn-row quest-next' }, back)));
      setTimeout(() => confetti(stage.querySelector('.guardian-arena'), 70), 150);
      announce(`${g.name} est ${agree(g, 'apprivoisé')}.${vignette ? ` Nouvelle vignette : ${vignette.label}.` : ''}`);
      setTimeout(() => back.focus({ preventScroll: true }), 60);
      return;
    }
    bubble.textContent = g.lose;
    creature.classList.add('is-gone');
    counter.textContent = '';
    const again = h('button', { type: 'button', class: 'btn btn--primary', onclick: () => onAgain() }, `Retenter avec ${g.name} (autres questions)`);
    slot.replaceChildren(h('div', { class: 'card quest-failed' },
      h('div', {}, h('h3', { tabindex: '-1' }, `${g.name} s’est ${agree(g, 'envolé')}…`),
        h('p', {}, `${s.hearts} cœur${s.hearts > 1 ? 's' : ''} allumé${s.hearts > 1 ? 's' : ''} sur ${GUARDIAN_HEARTS} en ${s.asked} questions. Relis les corrections des chapitres, puis retente : les questions changent à chaque fois, et rien n’est perdu.`),
        h('div', { class: 'btn-row' }, again, h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => onExit(false) }, 'Retour à mon année')))));
    announce(`${g.name} s’est ${agree(g, 'envolé')}. Tu peux le défier à nouveau.`);
    again.focus({ preventScroll: true });
  }

  show();
}

export const guardianOf = (period) => GUARDIANS[period] || GUARDIANS[0];
export { GUARDIAN_QUESTIONS };
