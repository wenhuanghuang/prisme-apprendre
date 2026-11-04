/**
 * Calcul éclair (#/eclair) : 10 ou 20 calculs mentaux de la classe, l'un après l'autre. Un calcul raté revient un peu
 * plus loin : on termine toujours sur des réussites. Avec le chrono, le temps total peut battre le record personnel
 * (par classe, thème et longueur de série) ; sans le chrono, on s'entraîne tranquillement.
 * Une série terminée rapporte quelques points une fois par jour.
 */
import { h, announce } from '../dom.js';
import { store, recordGameEvent, gameProgress, recordBest } from '../../app/store.js';
import { newEclair, answer, currentCalc, isDone, elapsedMs, eclairStars, recordKey, formatMs, frNum, eclairThemes, ECLAIR_LEVELS, ECLAIR_THEMES } from '../../engine/eclair.js';
import { gameLevels, nearestLevel } from '../game/deck.js';
import { dayKey } from '../../engine/game.js';
import { photon } from '../photon.js';
import { burstStars, confetti } from '../lesson-play/celebrate.js';

const levelLabel = (id) => ((store.catalog && store.catalog.levels.find((l) => l.id === id)) || { label: id }).label;
const themeLabel = (id) => (id === 'melange' ? 'Mélange de la classe' : (ECLAIR_THEMES[id] || { label: id }).label);
/** Le calcul et sa réponse : « 7 × 8 = 56 », « 4 + 6 = 10 ». */
const solved = (c) => (/…/.test(c.q) ? c.q.replace('…', frNum(c.a)) : `${c.q} = ${frNum(c.a)}`);
const recordOf = (key) => ((store.states && store.states.game && store.states.game.records) || {})[key] || null;
export const eclairLevels = () => gameLevels().filter((l) => ECLAIR_LEVELS[l]);

/* ------------------------------ Mise en place ------------------------------ */

function setupScreen(stage, { onStart, prefill = {} }) {
  const levels = eclairLevels();
  const near = nearestLevel(store.profile.level);
  const state = { level: prefill.level || (levels.includes(near) ? near : levels[0]), theme: prefill.theme || 'melange', count: prefill.count || 10, timer: prefill.timer ?? true };
  const draw = () => {
    const themes = eclairThemes(state.level);
    if (state.theme !== 'melange' && !themes.some((t) => t.id === state.theme)) state.theme = 'melange';
    const rec = recordOf(recordKey(state.level, state.theme, state.count));
    const sel = (label, value, options, onchange) => h('label', { class: 'field' }, h('span', { class: 'field-label' }, label),
      h('select', { class: 'field-input', onchange: (e) => onchange(e.target.value) }, options.map(([v, l]) => h('option', { value: v, selected: String(v) === String(value) }, l))));
    stage.replaceChildren(h('section', { class: 'card eclair-setup' },
      h('div', { class: 'quest-setup-head' }, h('span', { class: 'mem-setup-art', 'aria-hidden': 'true' }, '⚡'),
        h('div', {}, h('h2', {}, 'Calcul éclair'),
          h('p', {}, 'Des calculs de ta classe, l’un après l’autre, à faire de tête. Un calcul raté revient un peu plus loin : la série se termine toujours sur des réussites. Avec le chrono, essaie de battre ton record ; sans, entraîne-toi tranquillement.'))),
      h('div', { class: 'series-grid' },
        sel('Classe', state.level, levels.map((l) => [l, levelLabel(l)]), (v) => { state.level = v; draw(); }),
        sel('Calculs', state.theme, [['melange', 'Mélange de la classe'], ...themes.map((t) => [t.id, t.label])], (v) => { state.theme = v; draw(); }),
        sel('Longueur', state.count, [[10, '10 calculs'], [20, '20 calculs']], (v) => { state.count = Number(v); draw(); }),
        sel('Chrono', state.timer ? 'oui' : 'non', [['oui', 'Affiché : record à battre'], ['non', 'Caché : tranquille']], (v) => { state.timer = v === 'oui'; draw(); })),
      h('p', { class: 'small muted eclair-record' }, state.timer ? (rec ? `🏅 Ton record pour cette série : ${formatMs(rec.ms)}` : 'Pas encore de record pour cette série : c’est le moment d’en établir un !') : 'Sans chrono : pas de record, juste de l’entraînement.'),
      h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn btn--primary', onclick: () => onStart({ ...state }) }, '⚡ C’est parti !'))));
  };
  draw();
}

/* ------------------------------ Série ------------------------------ */

function play(stage, setup, { onAgain, onNew }) {
  const e = newEclair({ level: setup.level, theme: setup.theme, count: setup.count });
  e.startedAt = Date.now();
  const calcEl = h('p', { class: 'eclair-calc', 'aria-live': 'polite' });
  const input = h('input', { class: 'field-input eclair-input', type: 'text', inputmode: 'decimal', autocomplete: 'off', 'aria-label': 'Ta réponse', maxlength: 12 });
  const feedback = h('p', { class: 'eclair-feedback', 'aria-live': 'polite' });
  const progress = h('span', { class: 'eclair-progress' });
  const bar = h('i', {});
  const clock = h('span', { class: 'eclair-clock', 'aria-hidden': 'true' }, `⏱ ${formatMs(0)}`);
  let tick = null;
  const stopClock = () => { if (tick) { clearInterval(tick); tick = null; } };
  if (setup.timer) tick = setInterval(() => { if (!clock.isConnected) { stopClock(); return; } clock.textContent = `⏱ ${formatMs(elapsedMs(e))}`; }, 100);

  const paint = () => {
    const c = currentCalc(e);
    calcEl.textContent = c ? `${c.q}${/…/.test(c.q) ? '' : ' = ?'}` : '';
    progress.textContent = `${e.done.length}/${e.count}`;
    bar.style.width = `${(e.done.length / e.count) * 100}%`;
  };
  const submit = () => {
    const r = answer(e, input.value);
    if (!r) return;
    if (r.status === 'invalid') { feedback.textContent = 'Écris un nombre (par exemple 12, −3 ou 0,5).'; feedback.className = 'eclair-feedback is-warn'; input.focus({ preventScroll: true }); return; }
    if (r.status === 'right') {
      feedback.textContent = '✓ Juste !'; feedback.className = 'eclair-feedback is-ok';
      burstStars(calcEl, 1);
    } else {
      feedback.textContent = `Presque : ${solved(r.calc)}. Ce calcul reviendra un peu plus loin.`;
      feedback.className = 'eclair-feedback is-miss';
    }
    input.value = '';
    paint();
    if (isDone(e)) { stopClock(); setTimeout(end, 350); return; }
    input.focus({ preventScroll: true });
  };
  input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); submit(); } });
  const key = (k) => {
    if (k === 'ok') { submit(); return; }
    if (k === 'del') input.value = input.value.slice(0, -1);
    else if (k === '−') input.value = input.value.startsWith('−') ? input.value.slice(1) : `−${input.value}`;
    else if (input.value.length < 12) input.value += k;
    input.focus({ preventScroll: true });
  };
  const pad = h('div', { class: 'eclair-pad', role: 'group', 'aria-label': 'Pavé numérique' },
    ['7', '8', '9', '4', '5', '6', '1', '2', '3', '−', '0', ','].map((k) => h('button', { type: 'button', class: 'eclair-key', dataset: { key: k }, onclick: () => key(k) }, k)),
    h('button', { type: 'button', class: 'eclair-key eclair-key--del', dataset: { key: 'del' }, 'aria-label': 'Effacer', onclick: () => key('del') }, '⌫'),
    h('button', { type: 'button', class: 'eclair-key eclair-key--ok', dataset: { key: 'ok' }, onclick: () => key('ok') }, 'Valider'));

  async function end() {
    const ms = elapsedMs(e);
    const key = recordKey(setup.level, setup.theme, setup.count);
    const before = gameProgress();
    const rec = setup.timer ? await recordBest(key, ms).catch(() => ({ previous: null, best: false })) : null;
    await recordGameEvent('eclair', dayKey(store.now())).catch(() => {});
    const after = gameProgress();
    const gained = before && after ? after.totalXp - before.totalXp : 0;
    const stars = eclairStars(e);
    const beat = rec && rec.best && rec.previous;
    stage.replaceChildren(h('section', { class: 'card mem-end eclair-end enter-fwd' },
      h('div', { class: 'jeu-turn-head' }, photon('bravo', 64),
        h('div', {}, h('p', { class: 'eyebrow' }, `${e.count} calculs réussis`),
          h('h2', { tabindex: '-1' }, `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}${setup.timer ? ` en ${formatMs(ms)}` : ''}`))),
      setup.timer ? h('p', { class: `eclair-verdict ${rec && rec.best ? 'is-record' : ''}` },
        beat ? `🏅 Nouveau record ! Tu as gagné ${formatMs(rec.previous.ms - ms)} sur ton ancien temps (${formatMs(rec.previous.ms)}).`
          : rec && rec.best ? '🏅 Premier record établi pour cette série : à toi de le battre la prochaine fois !'
            : rec && rec.previous ? `Ton record reste ${formatMs(rec.previous.ms)} : encore ${formatMs(ms - rec.previous.ms)} à gagner.` : '') : null,
      h('p', {}, e.errors === 0 ? 'Sans une erreur : bravo !' : `${e.errors} erreur${e.errors > 1 ? 's' : ''}, toutes rattrapées.`),
      gained > 0 ? h('p', { class: 'chest-points' }, `+${gained} points`) : h('p', { class: 'small muted' }, 'Les points du calcul éclair se gagnent une fois par jour : reviens demain !'),
      e.misses.length ? h('details', { class: 'mem-recap', open: true }, h('summary', {}, 'À retravailler'),
        h('ul', {}, e.misses.map((c) => h('li', {}, solved(c))))) : null,
      h('div', { class: 'btn-row' },
        h('button', { type: 'button', class: 'btn btn--primary', onclick: () => onAgain() }, 'Rejouer'),
        h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => onNew() }, 'Changer de calculs'),
        h('a', { class: 'btn btn--ghost', href: '#/frise' }, '⏳ Frise chronologique'))));
    if (stars === 3 || (rec && rec.best)) setTimeout(() => confetti(stage.firstChild, 60), 150);
    announce(`Série terminée${setup.timer ? ` en ${formatMs(ms)}` : ''}${beat ? ', nouveau record' : ''}.`);
    const t = stage.querySelector('h2'); if (t) t.focus({ preventScroll: true });
  }

  stage.replaceChildren(
    h('div', { class: 'series-head quest-head' },
      h('div', {}, h('p', { class: 'eyebrow' }, `Calcul éclair · ${levelLabel(setup.level)}`), h('h2', {}, themeLabel(setup.theme))),
      h('div', { class: 'btn-row' }, setup.timer ? clock : null, progress, h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => { stopClock(); onNew(); } }, 'Arrêter'))),
    h('div', { class: 'progress-mini eclair-bar' }, bar),
    h('section', { class: 'card eclair-card' }, calcEl,
      h('div', { class: 'eclair-answer' }, input, h('button', { type: 'button', class: 'btn btn--primary', onclick: submit }, 'OK')),
      feedback, pad));
  paint();
  // sur un petit écran, le calcul et le pavé numérique passent devant l'en-tête de la page
  if (window.matchMedia && window.matchMedia('(max-width: 720px)').matches) {
    const bar = document.querySelector('.topbar');
    window.scrollTo({ top: Math.max(0, stage.getBoundingClientRect().top + window.scrollY - (bar ? bar.offsetHeight : 0) - 6) });
  }
  input.focus({ preventScroll: true });
}

export async function render(root) {
  const stage = h('div', { class: 'quest-stage eclair-stage' });
  root.append(h('div', { class: 'page-head' },
    h('div', {}, h('p', { class: 'eyebrow' }, 'Jeux'), h('h1', {}, 'Calcul éclair'),
      h('p', { class: 'muted' }, 'Tables, compléments, décimaux, relatifs, pourcentages… : quelques minutes de calcul mental, et ton record à battre.')),
    h('a', { class: 'btn', href: '#/jeu' }, h('span', { 'aria-hidden': 'true' }, '🎲 '), 'Jeu de plateau')), stage);
  let last = null;
  const toSetup = (prefill) => setupScreen(stage, { onStart: start, prefill });
  function start(setup) { last = setup; window.scrollTo({ top: 0 }); play(stage, setup, { onAgain: () => start(last), onNew: () => toSetup(last) }); }
  toSetup();
}
