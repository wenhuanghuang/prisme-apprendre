/**
 * Les étapes d'une leçon jouée écran par écran : une section pédagogique = une étape.
 * Chaque étape sait dire si l'on peut continuer, et peut consommer le bouton « Continuer »
 * pour avancer à l'intérieur d'elle-même (carte suivante, étape d'exemple suivante).
 */
import { h, richText, inlineHTML, mathHTML } from '../dom.js';
import { mountActivity } from '../../activities/registry.js';
import { renderFigure } from '../../figures/render.js';
import { mountDemo } from '../../demos/player.js';
import { photon } from '../photon.js';
import { autoCards, cardDeck } from './cards.js';
import { exerciseRunner } from './runner.js';

export const STEP_META = {
  decouverte: { icon: '🔍', label: 'Découverte', mood: 'curieux', say: 'Une énigme pour commencer ! Lis-la et fais ta propre hypothèse avant d’avancer.' },
  cours: { icon: '📖', label: 'Le cours', mood: 'attentif', say: 'Le cours tient en quelques cartes. Une idée par carte : prends ton temps.' },
  manipulation: { icon: '🖐️', label: 'Manipulation', mood: 'joie', say: 'À toi de manipuler : essaie, observe, recommence.' },
  experience: { icon: '🧪', label: 'Expérience', mood: 'curieux', say: 'Regarde l’expérience étape par étape. Tu peux la mettre en pause ou revenir en arrière quand tu veux.' },
  exemple: { icon: '🧩', label: 'Exemple résolu', mood: 'attentif', say: 'Un exemple résolu, une étape à la fois. Essaie de deviner l’étape suivante !' },
  exercices: { icon: '✏️', label: 'Entraînement', mood: 'encourage', say: 'À toi de jouer ! Réussir du premier coup, sans indice, rapporte 3 étoiles.' },
  libre: { icon: '💬', label: 'Explique', mood: 'encourage', say: 'Explique avec tes mots : il n’y a pas une seule bonne façon de le dire.' },
  reinvestissement: { icon: '🧠', label: 'Problème', mood: 'encourage', say: 'Un problème pour réutiliser ce que tu viens d’apprendre.' },
  mission: { icon: '🚀', label: 'Mission', mood: 'joie', say: 'Mission spéciale ! Utilise tout ce que tu sais.' },
  correction: { icon: '⭐', label: 'À retenir', mood: 'attentif', say: 'Voici l’essentiel. Lis-le à voix haute : on retient mieux.' },
  fin: { icon: '🏆', label: 'Bravo', mood: 'bravo', say: '' },
};
const EXERCISE_KINDS = new Set(['exercices', 'libre', 'reinvestissement', 'mission']);
const AT_END = new Set(['revision', 'ressource']); // regroupées sur l'écran final

/** Étapes jouables d'une leçon (sections dans l'ordre, puis l'écran final). */
export function buildSteps(lesson) {
  const steps = [];
  lesson.sections.forEach((s, idx) => {
    if (AT_END.has(s.kind)) return;
    if (s.kind === 'exemple' && !s.body && !(s.steps || []).length && !s.figure) return;
    const meta = STEP_META[s.kind] || { icon: '•', label: s.kind, mood: 'attentif', say: '' };
    steps.push({ kind: s.kind, section: s, idx, title: s.title || meta.label, ...meta });
  });
  steps.push({ kind: 'fin', idx: -1, title: 'Leçon terminée', ...STEP_META.fin });
  return steps;
}

function stepHead(step) {
  return h('header', { class: 'step-head' },
    h('span', { class: 'step-icon', 'aria-hidden': 'true' }, step.icon),
    h('div', {}, h('p', { class: 'step-kind' }, step.label), h('h2', { class: 'step-title', tabindex: '-1' }, step.title)));
}

export function guide(mood, text) {
  if (!text) return null;
  return h('div', { class: 'guide' }, photon(mood, 52), h('p', { class: 'guide-bubble' }, text));
}

function common(s, cleanups, { lead = false } = {}) {
  const out = [];
  if (s.body) out.push(richText(s.body, lead ? 'rich step-lead' : 'rich'));
  if (s.figure) out.push(renderFigure(s.figure));
  if (s.activity) {
    const slot = h('div', { class: 'step-activity' });
    cleanups.push(mountActivity(slot, s.activity.widget, s.activity.config || {}));
    out.push(slot);
  }
  return out;
}

/**
 * @param {object} step
 * @param {{ lessonId, byId, results, onResult, onReadyChange }} ctx
 */
export function renderStep(step, ctx) {
  const s = step.section;
  const cleanups = [];
  const api = { advance: () => false, ready: () => true, continueLabel: () => 'Continuer →' };
  const body = h('div', { class: 'step-body' });
  const el = h('section', { class: `step step--${step.kind}`, 'aria-labelledby': 'step-title' }, stepHead(step), guide(step.mood, step.say), body);
  el.querySelector('.step-title').id = 'step-title';

  if (step.kind === 'cours') {
    const cards = Array.isArray(s.cards) && s.cards.length ? s.cards : autoCards(s.body);
    if (Array.isArray(s.cards) && s.body) body.append(richText(s.body, 'rich step-lead'));
    if (s.figure) body.append(renderFigure(s.figure));
    if (cards.length) {
      const deck = cardDeck(cards, { onChange: () => ctx.onReadyChange() });
      body.append(deck.el);
      api.advance = () => deck.next();
      api.continueLabel = () => (deck.remaining() > 0 ? 'Carte suivante →' : 'J’ai compris, on continue →');
    }
  } else if (step.kind === 'exemple') {
    body.append(...common(s, cleanups));
    const items = (s.steps || []).map((st, k) => h('li', { class: 'ex-step', hidden: k > 0 },
      h('span', { class: 'ex-step-n', 'aria-hidden': 'true' }, String(k + 1)),
      h('div', {}, h('p', { html: inlineHTML(st.text) }), st.math ? h('p', { class: 'ex-step-math', html: mathHTML(st.math) }) : null, st.figure ? renderFigure(st.figure) : null)));
    if (items.length) {
      let shown = 1;
      const all = h('button', { type: 'button', class: 'btn btn--quiet btn--small', onclick: () => { items.forEach((li) => { li.hidden = false; }); shown = items.length; all.hidden = true; ctx.onReadyChange(); } }, 'Tout afficher');
      body.append(h('ol', { class: 'example-reveal' }, items), items.length > 1 ? all : null);
      api.advance = () => {
        if (shown >= items.length) return false;
        items[shown].hidden = false;
        items[shown].classList.add('enter-fwd');
        items[shown].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        shown += 1;
        if (shown >= items.length) all.hidden = true;
        return true;
      };
      api.continueLabel = () => (shown < items.length ? `Étape suivante (${shown + 1}/${items.length}) →` : 'Continuer →');
    }
  } else if (step.kind === 'experience') {
    body.append(...common(s, cleanups));
    if (s.demo) {
      const slot = h('div', { class: 'step-demo' });
      body.append(slot);
      cleanups.push(mountDemo(slot, s.demo));
    }
  } else if (step.kind === 'correction') {
    el.classList.add('step--poster');
    body.append(...common(s, cleanups));
    api.continueLabel = () => 'C’est retenu, on termine →';
  } else {
    body.append(...common(s, cleanups, { lead: step.kind === 'decouverte' }));
  }

  // exercices de la section, un par un (toutes les sections peuvent en porter)
  const defs = (s && s.exercises ? s.exercises : []).map((id) => ctx.byId[id]).filter(Boolean);
  if (defs.length) {
    const runner = exerciseRunner(defs, {
      lessonId: ctx.lessonId, results: ctx.results, onResult: ctx.onResult, startAt: ctx.startAt,
      onChange: () => ctx.onReadyChange(),
    });
    body.append(runner.el);
    cleanups.push(() => runner.destroy());
    if (EXERCISE_KINDS.has(step.kind) || step.kind === 'decouverte') {
      api.ready = () => runner.isComplete();
    }
  }

  return { el, ...api, destroy: () => cleanups.forEach((c) => { try { if (c) c(); } catch { /* ignoré */ } }) };
}
