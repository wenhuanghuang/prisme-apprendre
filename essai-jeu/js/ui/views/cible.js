/**
 * « La cible » (#/cible) : des nombres, une cible. Touche un nombre, une opération, puis un autre nombre : le résultat
 * remplace les deux. Atteins la cible (3 points), ou approche-toi le plus possible (2 points à 2 près, 1 point à 10
 * près). Seul : 5 cibles ; à deux : 6 cibles, une chacun son tour. Une série rapporte des points une fois par jour.
 */
import { h, announce } from '../dom.js';
import { store, gameProgress } from '../../app/store.js';
import { CIBLE_LEVELS, newSeries, startBoard, combine, undo, closest, isHit, points, stepText, solutionText, cibleStars } from '../../engine/cible.js';
import { gameLevels, nearestLevel } from '../game/deck.js';
import { recordMiniGame } from '../game/mini-games.js';
import { photon } from '../photon.js';
import { burstStars, confetti } from '../lesson-play/celebrate.js';

const levelLabel = (id) => ((store.catalog && store.catalog.levels.find((l) => l.id === id)) || { label: id }).label;
const OP_NAMES = { '+': 'plus', '−': 'moins', '×': 'fois', '÷': 'divisé par' };

function setupScreen(stage, { onStart, prefill = {} }) {
  const levels = gameLevels().filter((l) => CIBLE_LEVELS[l]);
  const near = nearestLevel(store.profile.level);
  const state = { level: levels.includes(prefill.level) ? prefill.level : levels.includes(near) ? near : levels[0], players: prefill.players || 1, guest: prefill.guest || 'Invité' };
  const draw = () => {
    const sel = (label, value, options, onchange) => h('label', { class: 'field' }, h('span', { class: 'field-label' }, label),
      h('select', { class: 'field-input', onchange: (e) => onchange(e.target.value) }, options.map(([v, l]) => h('option', { value: v, selected: String(v) === String(value) }, l))));
    stage.replaceChildren(h('section', { class: 'card cb-setup' },
      h('div', { class: 'quest-setup-head' }, h('span', { class: 'mem-setup-art', 'aria-hidden': 'true' }, '🎯'),
        h('div', {}, h('h2', {}, 'La cible'),
          h('p', {}, 'Des nombres et une cible à atteindre. Touche un nombre, une opération, puis un autre nombre : le résultat remplace les deux. Recommence jusqu’à tomber pile sur la cible ! Pas besoin d’utiliser tous les nombres. Dans le mille : 3 points ; à 2 près : 2 points ; à 10 près : 1 point.'))),
      h('div', { class: 'series-grid' },
        sel('Classe', state.level, levels.map((l) => [l, levelLabel(l)]), (v) => { state.level = v; }),
        sel('Joueurs', state.players, [[1, `Seul (${store.profile.pseudo})`], [2, 'À deux, une cible chacun son tour']], (v) => { state.players = Number(v); draw(); }),
        state.players === 2 ? h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Nom du deuxième joueur'),
          h('input', { class: 'field-input', value: state.guest, maxlength: 20, oninput: (e) => { state.guest = e.target.value || 'Invité'; } })) : null),
      h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn btn--primary cb-start', onclick: () => onStart({ ...state }) }, '🎯 Viser !'))));
  };
  if (!levels.length) { stage.replaceChildren(h('p', { class: 'card' }, 'La cible se joue du CE1 à la terminale.')); return; }
  draw();
}

function play(stage, setup, { onAgain, onNew }) {
  const names = setup.players === 2 ? [store.profile.pseudo, setup.guest || 'Invité'] : [store.profile.pseudo];
  const duo = names.length > 1;
  const ops = CIBLE_LEVELS[setup.level].ops;
  const series = newSeries(setup.level, duo ? 6 : 5);
  let i = 0; let board = null; let sel = null; let op = null; let done = false; let hits = 0;
  const scores = names.map(() => 0);
  const recap = [];
  const head = h('div', { class: 'series-head quest-head' });
  const targetEl = h('div', { class: 'cb-target' });
  const tilesEl = h('div', { class: 'cb-tiles', role: 'group', 'aria-label': 'Tes nombres' });
  const opsEl = h('div', { class: 'cb-ops', role: 'group', 'aria-label': 'Opérations' });
  const histEl = h('ol', { class: 'cb-history', 'aria-label': 'Tes calculs' });
  const msg = h('div', { class: 'cb-msg', 'aria-live': 'polite' });
  const tools = h('div', { class: 'btn-row cb-tools' });
  const player = () => (duo ? i % 2 : 0);

  const paintHead = () => head.replaceChildren(
    h('div', {}, h('p', { class: 'eyebrow' }, `La cible · ${levelLabel(setup.level)}`), h('h2', {}, `Cible ${Math.min(i + 1, series.length)}/${series.length}`)),
    h('div', { class: 'btn-row' }, ...(duo ? names.map((n, p) => h('span', { class: `mem-player ${p === player() && !done ? 'is-turn' : ''}` }, h('b', {}, n), ` · ${scores[p]}`))
      : [h('span', { class: 'cmp-combo' }, `${scores[0]} point${scores[0] > 1 ? 's' : ''}${hits ? ` · 🎯 ${hits}` : ''}`)]),
    h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => onNew() }, 'Arrêter')));

  const paint = () => {
    const near = closest(board);
    targetEl.replaceChildren(...[h('span', { class: 'cb-target-label' }, duo ? `Au tour de ${names[player()]} · cible` : 'Cible'), h('span', { class: 'cb-target-value' }, String(board.target)),
      board.steps.length && !done ? h('span', { class: 'cb-near' }, near === board.target ? 'Dans le mille !' : `Le plus proche : ${near} (à ${Math.abs(near - board.target)})`) : null].filter(Boolean));
    tilesEl.replaceChildren(...board.tiles.map((t) => h('button', {
      type: 'button', class: `cb-tile ${t.made ? 'is-made' : ''} ${sel === t.id ? 'is-selected' : ''} ${t.value === board.target ? 'is-hit' : ''}`, dataset: { id: t.id, v: String(t.value) },
      disabled: done, 'aria-pressed': sel === t.id ? 'true' : 'false', onclick: () => tapTile(t.id),
    }, String(t.value))));
    opsEl.replaceChildren(...ops.map((o) => h('button', { type: 'button', class: `cb-op ${op === o ? 'is-selected' : ''}`, dataset: { op: o }, disabled: done, 'aria-label': OP_NAMES[o], 'aria-pressed': op === o ? 'true' : 'false', onclick: () => tapOp(o) }, o)));
    histEl.replaceChildren(...board.steps.map((s) => h('li', {}, stepText(s))));
    tools.replaceChildren(...(done ? [] : [
      h('button', { type: 'button', class: 'btn btn--ghost btn--small cb-undo', disabled: !board.steps.length, onclick: () => { board = undo(board); sel = null; op = null; msg.textContent = ''; paint(); } }, '↩ Annuler'),
      h('button', { type: 'button', class: 'btn btn--ghost btn--small cb-reset', disabled: !board.steps.length, onclick: () => { board = startBoard(series[i]); sel = null; op = null; msg.textContent = ''; paint(); } }, 'Recommencer'),
      h('button', { type: 'button', class: 'btn btn--small cb-stop', onclick: () => finish(false) }, board.steps.length ? `J’arrête à ${near}` : 'Je passe')]));
    paintHead();
  };

  function tapTile(id) {
    if (done) return;
    if (!sel || (sel && !op)) { sel = sel === id ? null : id; msg.textContent = sel && !op ? 'Choisis maintenant une opération.' : ''; paint(); return; }
    const r = combine(board, sel, op, id);
    if (r.error) { msg.textContent = r.error; sel = null; op = null; paint(); return; }
    board = r.board; sel = null; op = null; msg.textContent = '';
    paint();
    if (isHit(board)) finish(true);
  }
  function tapOp(o) {
    if (done) return;
    if (!sel) { msg.textContent = 'Touche d’abord un nombre.'; return; }
    op = op === o ? null : o; msg.textContent = op ? 'Touche le deuxième nombre.' : ''; paint();
  }

  function finish(hit) {
    done = true;
    const puzzle = series[i];
    const value = closest(board);
    const pts = board.steps.length || hit ? points(value, board.target) : 0;
    scores[player()] += pts;
    if (pts === 3) hits++;
    recap.push({ puzzle, value, pts, steps: board.steps.slice() });
    paint();
    msg.replaceChildren(...[
      h('p', { class: 'cb-msg-title' }, pts === 3 ? '🎯 Dans le mille ! +3 points' : pts ? `${value}, à ${Math.abs(value - puzzle.target)} de la cible : +${pts} point${pts > 1 ? 's' : ''}` : 'Pas de point cette fois.'),
      pts < 3 ? h('p', {}, `Une solution : ${solutionText(puzzle)}.`) : null,
      h('button', { type: 'button', class: 'btn btn--primary btn--small cb-next', onclick: next }, i + 1 >= series.length ? 'Voir le résultat' : 'Cible suivante ▶')].filter(Boolean));
    if (pts === 3) burstStars(targetEl, 3);
    announce(msg.firstChild.textContent);
    msg.querySelector('.cb-next').focus({ preventScroll: true });
  }

  function next() {
    i++;
    if (i >= series.length) { end(); return; }
    board = startBoard(series[i]); sel = null; op = null; done = false; msg.replaceChildren();
    paint();
  }

  async function end() {
    const before = gameProgress();
    const star = await recordMiniGame('cible').catch(() => false);
    const after = gameProgress();
    const gained = before && after ? after.totalXp - before.totalXp : 0;
    const max = (duo ? series.length / 2 : series.length) * 3;
    const stars = cibleStars(scores[0], max);
    const top = Math.max(...scores);
    const win = scores.map((s, p) => (s === top ? p : -1)).filter((p) => p >= 0);
    stage.replaceChildren(h('section', { class: 'card mem-end cb-end enter-fwd' },
      h('div', { class: 'jeu-turn-head' }, photon('bravo', 64),
        h('div', {}, h('p', { class: 'eyebrow' }, 'Série terminée'),
          h('h2', { tabindex: '-1' }, duo ? (win.length > 1 ? 'Égalité !' : `${names[win[0]]} gagne !`) : `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)} · ${scores[0]} points sur ${max}`))),
      duo ? h('p', {}, names.map((n, p) => `${n} : ${scores[p]} point${scores[p] > 1 ? 's' : ''}`).join(' · ')) : h('p', {}, `🎯 ${hits} cible${hits > 1 ? 's' : ''} atteinte${hits > 1 ? 's' : ''} pile sur ${series.length}.`),
      gained > 0 ? h('p', { class: 'chest-points' }, `+${gained} points${star ? ' · 🌟 bonus du jeu du jour' : ''}`) : h('p', { class: 'small muted' }, 'Les points de la cible se gagnent une fois par jour.'),
      h('details', { class: 'mem-recap' }, h('summary', {}, 'Les solutions'), h('ul', {}, recap.map((r) => h('li', {}, `${r.puzzle.numbers.join(', ')} → ${r.puzzle.target} : ${r.pts === 3 ? `atteinte (${r.steps.map(stepText).join(' ; ')})` : `une solution : ${solutionText(r.puzzle)}`}`)))),
      h('div', { class: 'btn-row' },
        h('button', { type: 'button', class: 'btn btn--primary', onclick: () => onAgain() }, duo ? 'Revanche' : 'Rejouer'),
        h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => onNew() }, 'Changer de réglages'))));
    if (duo || stars === 3) setTimeout(() => confetti(stage.firstChild, 60), 150);
    announce(duo ? `${win.map((p) => names[p]).join(' et ')} ${win.length > 1 ? 'sont à égalité' : 'gagne'}.` : `${scores[0]} points sur ${max}.`);
    const t = stage.querySelector('h2'); if (t) t.focus({ preventScroll: true });
  }

  board = startBoard(series[0]);
  stage.replaceChildren(head, h('section', { class: 'card cb-board' }, targetEl, tilesEl, opsEl, msg, tools,
    h('details', { class: 'cb-hist-wrap', open: true }, h('summary', { class: 'small' }, 'Mes calculs'), histEl)));
  paint();
}

export async function render(root, { params } = {}) {
  const stage = h('div', { class: 'quest-stage cb-stage' });
  root.append(h('div', { class: 'page-head' },
    h('div', {}, h('p', { class: 'eyebrow' }, 'Jeux'), h('h1', {}, 'La cible'),
      h('p', { class: 'muted' }, 'Combine les nombres pour atteindre la cible : du calcul mental qui fait réfléchir, seul ou à deux.')),
    h('a', { class: 'btn', href: '#/jeu' }, h('span', { 'aria-hidden': 'true' }, '🎲 '), 'Jeu de plateau')), stage);
  let last = null;
  const toSetup = (prefill) => setupScreen(stage, { onStart: start, prefill });
  function start(setup) { last = setup; window.scrollTo({ top: 0 }); play(stage, setup, { onAgain: () => start(last), onNew: () => toSetup(last) }); }
  toSetup({ level: (params && params.get('classe')) || undefined });
}
