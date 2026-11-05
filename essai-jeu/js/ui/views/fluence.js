/**
 * Lecture chronométrée (#/fluence), du CP au CM2 : l'enfant lit un texte à voix haute pendant une minute. L'adulte qui
 * écoute touche les mots mal lus, puis, quand le temps est écoulé, le dernier mot atteint. Résultat : les mots
 * correctement lus en une minute, et le record de l'enfant pour ce texte. On peut d'abord écouter le texte lu par
 * l'ordinateur. Une lecture terminée rapporte quelques points une fois par jour.
 */
import { h, announce } from '../dom.js';
import { store, recordGameEvent, gameProgress, recordBestScore } from '../../app/store.js';
import { TEXTS, textsFor, tokens, scoreReading, READING_SECONDS } from '../../engine/fluence.js';
import { dayKey } from '../../engine/game.js';
import { photon } from '../photon.js';
import { speak, speechAvailable, stopSpeaking } from '../speech.js';
import { confetti } from '../lesson-play/celebrate.js';

const LEVELS = ['cp', 'ce1', 'ce2', 'cm1', 'cm2'];
const levelLabel = (id) => ((store.catalog && store.catalog.levels.find((l) => l.id === id)) || { label: id.toUpperCase() }).label;
const bestOf = (id) => (((store.states && store.states.game && store.states.game.records) || {})[`fluence:${id}`] || null);

function setupScreen(stage, { onStart, prefill = {} }) {
  const mine = String((store.profile && store.profile.level) || '').toLowerCase();
  const state = { level: LEVELS.includes(prefill.level) ? prefill.level : LEVELS.includes(mine) ? mine : 'cm2', text: prefill.text || '' };
  const draw = () => {
    const list = textsFor(state.level);
    if (!list.some((t) => t.id === state.text)) state.text = list[0].id;
    const sel = (label, value, options, onchange) => h('label', { class: 'field' }, h('span', { class: 'field-label' }, label),
      h('select', { class: 'field-input', onchange: (e) => onchange(e.target.value) }, options.map(([v, l]) => h('option', { value: v, selected: String(v) === String(value) }, l))));
    const best = bestOf(state.text);
    stage.replaceChildren(h('section', { class: 'card fl-setup' },
      h('div', { class: 'quest-setup-head' }, h('span', { class: 'mem-setup-art', 'aria-hidden': 'true' }, '📖'),
        h('div', {}, h('h2', {}, 'Lecture chronométrée'),
          h('p', {}, 'Lis le texte à voix haute pendant une minute, sans te presser : l’important est de lire juste et de bien articuler. Un adulte écoute ; il touche un mot mal lu pour le marquer, puis, à la fin de la minute, le dernier mot que tu as lu.'))),
      h('div', { class: 'series-grid' },
        sel('Classe', state.level, LEVELS.map((l) => [l, levelLabel(l)]), (v) => { state.level = v; draw(); }),
        sel('Texte', state.text, list.map((t) => [t.id, t.title]), (v) => { state.text = v; draw(); })),
      h('p', { class: 'small muted' }, best ? `🏅 Ton record sur ce texte : ${best.score} mots bien lus en une minute.` : 'Pas encore de record sur ce texte.'),
      h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn btn--primary', onclick: () => onStart({ ...state }) }, '📖 Préparer la lecture'))));
  };
  draw();
}

function play(stage, setup, { onAgain, onNew }) {
  const t = TEXTS.find((x) => x.id === setup.text);
  const toks = tokens(t.text);
  const errors = new Set();
  let phase = 'ready'; // ready → reading → last → done
  let started = 0; let tick = null; let elapsed = 0;
  const status = h('p', { class: 'fl-status', 'aria-live': 'polite' }, 'Quand tu es prêt, appuie sur « Démarrer » et commence à lire.');
  const clock = h('span', { class: 'eclair-clock fl-clock' }, `⏱ ${READING_SECONDS} s`);
  const textEl = h('p', { class: 'fl-text', lang: 'fr' });
  const tools = h('div', { class: 'btn-row fl-tools' });
  const stopClock = () => { if (tick) { clearInterval(tick); tick = null; } };

  const paintText = () => textEl.replaceChildren(...toks.map((x, i) => (x.word
    ? h('button', { type: 'button', class: `fl-word ${errors.has(i) ? 'is-error' : ''}`, dataset: { i: String(i) }, 'aria-pressed': errors.has(i) ? 'true' : 'false', onclick: () => tap(i) }, x.t)
    : h('span', { class: 'fl-punct' }, x.t))).flatMap((el, i) => (i ? [' ', el] : [el])));
  const paintTools = () => tools.replaceChildren(...[
    phase === 'ready' && speechAvailable() ? h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => speak(t.text, { lang: 'fr-FR', rate: 0.9 }) }, '🔊 Écouter le texte d’abord') : null,
    phase === 'ready' ? h('button', { type: 'button', class: 'btn btn--primary fl-start', onclick: start }, `▶ Démarrer (${READING_SECONDS} secondes)`) : null,
    phase === 'reading' ? h('button', { type: 'button', class: 'btn btn--ghost fl-finish', onclick: () => finish(toks.length - 1, true) }, 'J’ai lu tout le texte') : null,
  ].filter(Boolean));

  function start() {
    stopSpeaking();
    phase = 'reading'; started = Date.now();
    status.textContent = 'Lis à voix haute ! (L’adulte touche les mots mal lus.)';
    tick = setInterval(() => {
      if (!clock.isConnected) { stopClock(); return; }
      elapsed = Math.min(READING_SECONDS, (Date.now() - started) / 1000);
      clock.textContent = `⏱ ${Math.ceil(READING_SECONDS - elapsed)} s`;
      if (elapsed >= READING_SECONDS) timeUp();
    }, 200);
    paintTools();
  }
  function timeUp() {
    stopClock(); phase = 'last'; elapsed = READING_SECONDS;
    clock.textContent = '⏱ 0 s';
    status.textContent = 'Temps écoulé ! Touche le dernier mot lu.';
    textEl.classList.add('is-picking');
    paintTools();
    announce('Temps écoulé. Touchez le dernier mot lu.');
  }
  function tap(i) {
    if (phase === 'reading') { if (errors.has(i)) errors.delete(i); else errors.add(i); paintText(); return; }
    if (phase === 'last') finish(i, false);
  }
  function finish(lastIndex, early) {
    stopClock();
    const seconds = early ? Math.max(1, (Date.now() - started) / 1000) : READING_SECONDS;
    phase = 'done';
    end(scoreReading(t.text, { lastIndex, errors: [...errors], seconds }), early);
  }

  async function end(r, early) {
    const before = gameProgress();
    const rec = await recordBestScore(`fluence:${t.id}`, r.perMinute).catch(() => ({ previous: null, best: false }));
    await recordGameEvent('fluence', dayKey(store.now())).catch(() => {});
    const after = gameProgress();
    const gained = before && after ? after.totalXp - before.totalXp : 0;
    stage.replaceChildren(h('section', { class: 'card mem-end fl-end enter-fwd' },
      h('div', { class: 'jeu-turn-head' }, photon('bravo', 64),
        h('div', {}, h('p', { class: 'eyebrow' }, t.title),
          h('h2', { tabindex: '-1' }, `${r.perMinute} mot${r.perMinute > 1 ? 's' : ''} bien lu${r.perMinute > 1 ? 's' : ''} en une minute`))),
      h('p', {}, `${r.read} mot${r.read > 1 ? 's' : ''} lu${r.read > 1 ? 's' : ''}, ${r.errors} erreur${r.errors > 1 ? 's' : ''}${early ? ` — texte terminé en ${Math.round(Math.min(READING_SECONDS, (Date.now() - started) / 1000))} secondes, ramené à une minute` : ''}.`),
      rec.best ? h('p', { class: 'eclair-verdict is-record' }, rec.previous ? `🏅 Nouveau record sur ce texte ! (ancien : ${rec.previous.score})` : '🏅 Premier record sur ce texte : relis-le un autre jour pour le battre !')
        : rec.previous ? h('p', {}, `Ton record sur ce texte reste ${rec.previous.score} mots par minute.`) : null,
      h('p', { class: 'small muted' }, 'Relire plusieurs fois le même texte rend la lecture plus fluide : c’est normal de progresser à chaque fois.'),
      gained > 0 ? h('p', { class: 'chest-points' }, `+${gained} points`) : h('p', { class: 'small muted' }, 'Les points de la lecture chronométrée se gagnent une fois par jour.'),
      h('div', { class: 'btn-row' },
        h('button', { type: 'button', class: 'btn btn--primary', onclick: () => onAgain() }, 'Relire ce texte'),
        h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => onNew() }, 'Choisir un autre texte'))));
    if (rec.best) setTimeout(() => confetti(stage.firstChild, 60), 150);
    announce(`${r.perMinute} mots bien lus en une minute.`);
    const ttl = stage.querySelector('h2'); if (ttl) ttl.focus({ preventScroll: true });
  }

  stage.replaceChildren(
    h('div', { class: 'series-head quest-head' },
      h('div', {}, h('p', { class: 'eyebrow' }, `Lecture chronométrée · ${levelLabel(setup.level)}`), h('h2', {}, t.title)),
      h('div', { class: 'btn-row' }, clock, h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => { stopClock(); stopSpeaking(); onNew(); } }, 'Arrêter'))),
    h('section', { class: 'card fl-card' }, status, textEl, tools));
  paintText(); paintTools();
}

export async function render(root, { params } = {}) {
  const stage = h('div', { class: 'quest-stage fl-stage' });
  root.append(h('div', { class: 'page-head' },
    h('div', {}, h('p', { class: 'eyebrow' }, 'Jeux'), h('h1', {}, 'Lecture chronométrée'),
      h('p', { class: 'muted' }, 'Une minute de lecture à voix haute, avec un adulte qui écoute : chaque relecture rend la lecture plus fluide.')),
    h('a', { class: 'btn', href: '#/jeu' }, h('span', { 'aria-hidden': 'true' }, '🎲 '), 'Jeu de plateau')), stage);
  let last = null;
  const toSetup = (prefill) => setupScreen(stage, { onStart: start, prefill });
  function start(setup) { last = setup; window.scrollTo({ top: 0 }); play(stage, setup, { onAgain: () => start(last), onNew: () => toSetup(last) }); }
  toSetup({ level: (params && params.get('classe')) || undefined, text: (params && params.get('texte')) || undefined });
}
