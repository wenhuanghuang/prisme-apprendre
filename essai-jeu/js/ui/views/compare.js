/**
 * « Le plus grand ! » (#/compare) : deux nombres ou deux calculs, touche le plus grand. Seul : 15 manches, une série
 * de bonnes réponses fait monter le combo, et chaque erreur montre les deux valeurs. À deux, en buzzer sur le même
 * appareil : chacun ses deux boutons (ou ses touches), le premier qui répond juste marque ; une erreur donne le point
 * à l'autre. Une partie rapporte des points une fois par jour.
 */
import { h, announce } from '../dom.js';
import { store, gameProgress } from '../../app/store.js';
import { newSeries, compareStars, explain, COMPARE_LEVELS } from '../../engine/compare.js';
import { gameLevels, nearestLevel } from '../game/deck.js';
import { recordMiniGame } from '../game/mini-games.js';
import { photon } from '../photon.js';
import { burstStars, confetti } from '../lesson-play/celebrate.js';

const levelLabel = (id) => ((store.catalog && store.catalog.levels.find((l) => l.id === id)) || { label: id }).label;
const ROUNDS = 15;
const KEYS = [['a', 'z'], ['k', 'l']]; // joueur 1 : A (gauche) Z (droite) ; joueur 2 : K (gauche) L (droite)

function setupScreen(stage, { onStart, prefill = {} }) {
  const levels = gameLevels().filter((l) => COMPARE_LEVELS[l]);
  const near = nearestLevel(store.profile.level);
  const state = { level: levels.includes(prefill.level) ? prefill.level : levels.includes(near) ? near : levels[0], players: prefill.players || 1, guest: prefill.guest || 'Invité' };
  const draw = () => {
    const sel = (label, value, options, onchange) => h('label', { class: 'field' }, h('span', { class: 'field-label' }, label),
      h('select', { class: 'field-input', onchange: (e) => onchange(e.target.value) }, options.map(([v, l]) => h('option', { value: v, selected: String(v) === String(value) }, l))));
    stage.replaceChildren(h('section', { class: 'card cmp-setup' },
      h('div', { class: 'quest-setup-head' }, h('span', { class: 'mem-setup-art', 'aria-hidden': 'true' }, '⚖️'),
        h('div', {}, h('h2', {}, 'Le plus grand !'),
          h('p', {}, 'Deux nombres ou deux calculs : touche le plus grand, le plus vite possible. Seul, enchaîne les bonnes réponses pour faire monter ton combo. À deux, c’est un buzzer : chacun ses boutons, le premier qui a juste marque le point, mais une erreur donne le point à l’autre !'))),
      h('div', { class: 'series-grid' },
        sel('Classe', state.level, levels.map((l) => [l, levelLabel(l)]), (v) => { state.level = v; }),
        sel('Joueurs', state.players, [[1, `Seul (${store.profile.pseudo})`], [2, 'Buzzer à deux, sur le même appareil']], (v) => { state.players = Number(v); draw(); }),
        state.players === 2 ? h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Nom du deuxième joueur'),
          h('input', { class: 'field-input', value: state.guest, maxlength: 20, oninput: (e) => { state.guest = e.target.value || 'Invité'; } })) : null),
      state.players === 2 ? h('p', { class: 'small muted' }, 'Au clavier : le joueur 1 répond avec A (gauche) et Z (droite), le joueur 2 avec K (gauche) et L (droite).') : null,
      h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn btn--primary', onclick: () => onStart({ ...state }) }, '⚖️ C’est parti !'))));
  };
  draw();
}

function play(stage, setup, { onAgain, onNew }) {
  const names = setup.players === 2 ? [store.profile.pseudo, setup.guest || 'Invité'] : [store.profile.pseudo];
  const duo = names.length > 1;
  const rounds = newSeries(setup.level, ROUNDS);
  const started = Date.now();
  let i = 0; let combo = 0; let best = 0; let errors = 0; let locked = false;
  const misses = [];
  const scores = names.map(() => 0);
  const status = h('p', { class: 'cmp-status', 'aria-live': 'polite' });
  const head = h('div', { class: 'series-head quest-head' });
  const cardsEl = h('div', { class: 'cmp-cards' });
  const pads = names.map((n, p) => h('div', { class: `cmp-pad cmp-pad--${p}` }));

  const paintHead = () => head.replaceChildren(
    h('div', {}, h('p', { class: 'eyebrow' }, `Le plus grand ! · ${levelLabel(setup.level)}`), h('h2', {}, `Manche ${Math.min(i + 1, rounds.length)}/${rounds.length}`)),
    h('div', { class: 'btn-row' }, ...(duo ? names.map((n, p) => h('span', { class: 'mem-player' }, h('b', {}, n), ` · ${scores[p]}`))
      : [h('span', { class: `cmp-combo ${combo >= 3 ? 'is-hot' : ''}` }, combo >= 2 ? `🔥 combo ×${combo}` : `${scores[0]} juste${scores[0] > 1 ? 's' : ''}`)]),
    h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => { detach(); onNew(); } }, 'Arrêter')));

  const paint = () => {
    const r = rounds[i];
    cardsEl.replaceChildren(...r.cards.map((c, side) => h(duo ? 'div' : 'button', {
      ...(duo ? {} : { type: 'button', onclick: () => answer(0, side) }),
      class: 'cmp-card', dataset: { side: String(side) }, 'aria-label': duo ? c.label : `${c.label}${side === 0 ? ' (gauche)' : ' (droite)'}`,
    }, c.label)));
    if (duo) pads.forEach((pad, p) => pad.replaceChildren(h('span', { class: 'cmp-pad-name' }, names[p]),
      ...['◀ Gauche', 'Droite ▶'].map((l, side) => h('button', { type: 'button', class: 'cmp-buzz', dataset: { player: String(p), side: String(side) }, onclick: () => answer(p, side) }, `${l} (${KEYS[p][side].toUpperCase()})`))));
    paintHead();
  };

  function answer(p, side) {
    if (locked || i >= rounds.length) return;
    locked = true;
    const r = rounds[i];
    const right = side === r.answer;
    const cardEls = cardsEl.querySelectorAll('.cmp-card');
    cardEls[r.answer].classList.add('is-right');
    if (!right) cardEls[side].classList.add('is-wrong');
    if (duo) {
      const winner = right ? p : 1 - p;
      scores[winner]++;
      status.textContent = right ? `Point pour ${names[p]} !` : `Raté, ${names[p]} : point pour ${names[1 - p]}. (${explain(r)})`;
    } else if (right) {
      scores[0]++; combo++; best = Math.max(best, combo);
      status.textContent = combo >= 3 ? `Juste ! 🔥 ${combo} d’affilée` : 'Juste !';
      burstStars(cardEls[r.answer], Math.min(3, combo));
    } else {
      errors++; combo = 0; misses.push(r);
      status.textContent = `Raté : ${explain(r)}.`;
    }
    paintHead();
    setTimeout(() => { i++; locked = false; if (i >= rounds.length) { end(); return; } status.textContent = ''; paint(); }, right && !duo ? 450 : 1500);
  }

  const onKey = (ev) => {
    if (!cardsEl.isConnected) { detach(); return; }
    const k = ev.key.toLowerCase();
    if (!duo) { if (ev.key === 'ArrowLeft') answer(0, 0); else if (ev.key === 'ArrowRight') answer(0, 1); return; }
    KEYS.forEach((pair, p) => pair.forEach((key, side) => { if (k === key) answer(p, side); }));
  };
  const detach = () => document.removeEventListener('keydown', onKey);
  document.addEventListener('keydown', onKey);

  async function end() {
    detach();
    const before = gameProgress();
    const star = await recordMiniGame('compare').catch(() => false);
    const after = gameProgress();
    const gained = before && after ? after.totalXp - before.totalXp : 0;
    const secs = Math.round((Date.now() - started) / 1000);
    const stars = compareStars(errors);
    const top = Math.max(...scores);
    const win = scores.map((s, p) => (s === top ? p : -1)).filter((p) => p >= 0);
    stage.replaceChildren(h('section', { class: 'card mem-end cmp-end enter-fwd' },
      h('div', { class: 'jeu-turn-head' }, photon('bravo', 64),
        h('div', {}, h('p', { class: 'eyebrow' }, 'Partie terminée'),
          h('h2', { tabindex: '-1' }, duo ? (win.length > 1 ? 'Égalité !' : `${names[win[0]]} gagne !`) : `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)} · ${scores[0]}/${rounds.length} en ${secs} s`))),
      duo ? h('p', {}, names.map((n, p) => `${n} : ${scores[p]} point${scores[p] > 1 ? 's' : ''}`).join(' · '))
        : h('p', {}, best >= 5 ? `Meilleur combo : ${best} d’affilée. Impressionnant !` : `Meilleur combo : ${best} d’affilée.`),
      gained > 0 ? h('p', { class: 'chest-points' }, `+${gained} points${star ? ' · 🌟 bonus du jeu du jour' : ''}`) : h('p', { class: 'small muted' }, 'Les points de « Le plus grand ! » se gagnent une fois par jour.'),
      !duo && misses.length ? h('details', { class: 'mem-recap', open: true }, h('summary', {}, 'À retenir'), h('ul', {}, misses.map((r) => h('li', {}, explain(r))))) : null,
      h('div', { class: 'btn-row' },
        h('button', { type: 'button', class: 'btn btn--primary', onclick: () => onAgain() }, duo ? 'Revanche' : 'Rejouer'),
        h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => onNew() }, 'Changer de réglages'))));
    if (duo || stars === 3) setTimeout(() => confetti(stage.firstChild, 60), 150);
    announce(duo ? `${win.map((p) => names[p]).join(' et ')} ${win.length > 1 ? 'sont à égalité' : 'gagne'}.` : `${scores[0]} bonnes réponses sur ${rounds.length}.`);
    const t = stage.querySelector('h2'); if (t) t.focus({ preventScroll: true });
  }

  stage.replaceChildren(head, h('section', { class: `card cmp-board ${duo ? 'is-duo' : ''}` },
    duo ? pads[0] : null, h('p', { class: 'cmp-ask' }, 'Lequel est le plus grand ?'), cardsEl, status, duo ? pads[1] : h('p', { class: 'small muted' }, 'Au clavier : flèche gauche ou flèche droite.')));
  paint();
}

export async function render(root, { params } = {}) {
  const stage = h('div', { class: 'quest-stage cmp-stage' });
  root.append(h('div', { class: 'page-head' },
    h('div', {}, h('p', { class: 'eyebrow' }, 'Jeux'), h('h1', {}, 'Le plus grand !'),
      h('p', { class: 'muted' }, 'Deux nombres, un seul plus grand : un jeu éclair pour aiguiser son sens des nombres, seul ou en duel.')),
    h('a', { class: 'btn', href: '#/jeu' }, h('span', { 'aria-hidden': 'true' }, '🎲 '), 'Jeu de plateau')), stage);
  let last = null;
  const toSetup = (prefill) => setupScreen(stage, { onStart: start, prefill });
  function start(setup) { last = setup; window.scrollTo({ top: 0 }); play(stage, setup, { onAgain: () => start(last), onNew: () => toSetup(last) }); }
  toSetup({ level: (params && params.get('classe')) || undefined });
}
