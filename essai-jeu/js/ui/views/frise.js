/**
 * Frise chronologique (#/frise) : on pioche un événement et on le place sur la frise, entre ceux déjà posés.
 * Bien placé, il reste ; mal placé, il rejoint sa vraie place (on voit l'année) et, seul, on perd une vie.
 * À deux sur le même appareil, chacun son tour, un point par carte bien placée.
 * Une partie terminée rapporte quelques points une fois par jour ; la frise complète sert de récapitulatif.
 */
import { h, announce } from '../dom.js';
import { store, recordGameEvent, gameProgress } from '../../app/store.js';
import { allGenerators, loadData } from '../../generators/registry.js';
import { newFrise, place, currentCard, cardsLeft, isOver, friseStars, friseWinners, distinctEvents, yearLabel, FRISE_LIVES } from '../../engine/frise.js';
import { gameLevels, nearestLevel } from '../game/deck.js';
import { subjLabel } from './exercices.js';
import { dayKey } from '../../engine/game.js';
import { recordMiniGame } from '../game/mini-games.js';
import { photon } from '../photon.js';
import { burstStars, confetti } from '../lesson-play/celebrate.js';

const levelId = (x) => String(x || '').toLowerCase();
const levelLabel = (id) => ((store.catalog && store.catalog.levels.find((l) => l.id === id)) || { label: id }).label;
const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** Frises jouables pour une classe (générateurs de données « chronologie »). */
export const friseThemes = (level) => allGenerators(store.index).filter((g) => g.source !== 'code' && g.kind === 'chronologie' && g.levels.map(levelId).includes(level));
/** Classes qui ont au moins une frise. */
export const friseLevels = () => gameLevels().filter((l) => friseThemes(l).length);

async function eventsOf(meta) { return ((await loadData(meta.id)).data || {}).events || []; }

/* ------------------------------ Mise en place ------------------------------ */

function setupScreen(stage, { onStart, prefill = {} }) {
  const levels = friseLevels();
  const near = nearestLevel(store.profile.level);
  const fallback = levels.includes(near) ? near : levels.find((l) => gameLevels().indexOf(l) >= gameLevels().indexOf(near)) || levels[levels.length - 1];
  const state = { level: levels.includes(prefill.level) ? prefill.level : fallback, theme: prefill.theme || '', players: prefill.players || 1, size: prefill.size || 8, guest: prefill.guest || 'Invité' };
  const err = h('p', { class: 'warn', 'aria-live': 'assertive' });
  const draw = () => {
    const themes = friseThemes(state.level);
    if (state.theme && !themes.some((t) => t.id === state.theme)) state.theme = '';
    const sel = (label, value, options, onchange) => h('label', { class: 'field' }, h('span', { class: 'field-label' }, label),
      h('select', { class: 'field-input', onchange: (e) => onchange(e.target.value) }, options.map(([v, l]) => h('option', { value: v, selected: String(v) === String(value) }, l))));
    stage.replaceChildren(h('section', { class: 'card frise-setup' },
      h('div', { class: 'quest-setup-head' }, h('span', { class: 'mem-setup-art', 'aria-hidden': 'true' }, '⏳'),
        h('div', {}, h('h2', {}, 'Frise chronologique'),
          h('p', {}, 'Une première carte est posée sur la frise. Pioche un événement et place-le au bon endroit : avant, après, ou entre deux cartes. Bien placé, il reste ; sinon il rejoint sa vraie place et tu découvres son année. Seul, tu as 3 vies ; à deux, chacun son tour, un point par carte bien placée.'))),
      h('div', { class: 'series-grid' },
        sel('Classe', state.level, levels.map((l) => [l, levelLabel(l)]), (v) => { state.level = v; draw(); }),
        sel('Frise', state.theme, [['', 'Au hasard'], ...themes.map((t) => [t.id, `${subjLabel(t.subject)} · ${t.label}`])], (v) => { state.theme = v; }),
        sel('Nombre de cartes', state.size, [[8, '8 cartes'], [12, '12 cartes']], (v) => { state.size = Number(v); }),
        sel('Joueurs', state.players, [[1, `Seul (${store.profile.pseudo})`], [2, 'À deux, sur le même appareil']], (v) => { state.players = Number(v); draw(); }),
        state.players === 2 ? h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Nom du deuxième joueur'),
          h('input', { class: 'field-input', value: state.guest, maxlength: 20, oninput: (e) => { state.guest = e.target.value || 'Invité'; } })) : null),
      err,
      h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn btn--primary', disabled: !themes.length, onclick: () => go(themes) }, '⏳ Commencer la frise'))));
  };
  const go = async (themes) => {
    err.textContent = '';
    const order = state.theme ? themes.filter((t) => t.id === state.theme) : shuffle(themes);
    for (const meta of order) {
      const events = distinctEvents(await eventsOf(meta).catch(() => []), state.size);
      if (events.length >= Math.min(state.size, 6)) { onStart({ ...state, meta, events }); return; }
    }
    err.textContent = 'Pas assez d’événements pour cette frise : choisis-en une autre.';
  };
  if (!levels.length) { stage.replaceChildren(h('p', { class: 'card' }, 'Aucune frise disponible pour le moment.')); return; }
  draw();
}

/* ------------------------------ Partie ------------------------------ */

function play(stage, setup, { onAgain, onNew }) {
  const names = setup.players === 2 ? [store.profile.pseudo, setup.guest || 'Invité'] : [store.profile.pseudo];
  const f = newFrise(setup.events, { players: names });
  const status = h('p', { class: 'mem-status', 'aria-live': 'polite' });
  const score = h('div', { class: 'mem-score' });
  const hand = h('div', { class: 'frise-hand' });
  const line = h('ol', { class: 'frise-line', 'aria-label': 'La frise, du plus ancien au plus récent' });
  let lastAt = -1;

  const paint = () => {
    score.replaceChildren(...(f.solo
      ? [h('span', { class: 'frise-lives', 'aria-label': `${f.lives} vie${f.lives > 1 ? 's' : ''}` }, '❤️'.repeat(Math.max(0, f.lives)) + '🤍'.repeat(Math.max(0, FRISE_LIVES - f.lives))),
        h('span', {}, h('b', {}, String(f.players[0].score)), ' bien placée', f.players[0].score > 1 ? 's' : '')]
      : f.players.map((p, i) => h('span', { class: `mem-player ${i === f.turn && !isOver(f) ? 'is-turn' : ''}` }, h('b', {}, p.name), ` · ${p.score} point${p.score > 1 ? 's' : ''}`))));
    const card = currentCard(f);
    const over = isOver(f);
    hand.replaceChildren(...(card && !over ? [
      h('p', { class: 'eyebrow' }, f.solo ? `Carte à placer · encore ${cardsLeft(f)}` : `${f.players[f.turn].name}, à toi · encore ${cardsLeft(f)} carte${cardsLeft(f) > 1 ? 's' : ''}`),
      h('p', { class: 'frise-card frise-card--hand' }, card.label),
      card.hint ? h('details', { class: 'frise-hint' }, h('summary', {}, '💡 Un indice'), h('p', { class: 'small' }, card.hint)) : null,
    ].filter(Boolean) : []));
    const slot = (i) => h('li', { class: 'frise-slot-row' }, h('button', {
      type: 'button', class: 'frise-slot', dataset: { slot: String(i) }, disabled: over,
      'aria-label': i === 0 ? `Placer avant : ${f.line[0].label}` : i === f.line.length ? `Placer après : ${f.line[i - 1].label}` : `Placer entre « ${f.line[i - 1].label} » et « ${f.line[i].label} »`,
      onclick: () => turn(i),
    }, h('span', { 'aria-hidden': 'true' }, '＋'), i === 0 ? ' Plus ancien' : i === f.line.length ? ' Plus récent' : ' Ici'));
    const rows = [];
    f.line.forEach((e, i) => {
      rows.push(slot(i));
      rows.push(h('li', { class: `frise-item ${e.missed ? 'is-missed' : ''} ${e.start ? 'is-start' : ''} ${i === lastAt ? 'is-new' : ''}` },
        h('span', { class: 'frise-year' }, yearLabel(e)), h('span', { class: 'frise-card' }, e.label)));
    });
    rows.push(slot(f.line.length));
    line.replaceChildren(...rows);
  };

  function turn(i) {
    const who = f.players[f.turn].name;
    const r = place(f, i);
    if (!r) return;
    lastAt = r.at;
    status.textContent = r.ok
      ? `Bien placé${f.solo ? '' : `, ${who}`} : ${r.card.label} — ${yearLabel(r.card)}.`
      : `Pas tout à fait : ${r.card.label}, c’était ${r.card.year < 0 || r.card.circa ? '' : 'en '}${yearLabel(r.card)}. La carte rejoint sa place.`;
    paint();
    const el = line.querySelector('.frise-item.is-new');
    if (el) { el.scrollIntoView({ block: 'nearest' }); if (r.ok) burstStars(el, 2); }
    if (isOver(f)) { setTimeout(end, 900); return; }
    const btn = line.querySelector('.frise-slot');
    if (btn) btn.focus({ preventScroll: true });
  }

  async function end() {
    const before = gameProgress();
    const star = await recordMiniGame('frise').catch(() => false);
    const after = gameProgress();
    const gained = before && after ? after.totalXp - before.totalXp : 0;
    const stars = f.solo ? friseStars(f) : 0;
    const winners = friseWinners(f);
    const done = f.current >= f.deck.length;
    stage.replaceChildren(h('section', { class: 'card mem-end frise-end enter-fwd' },
      h('div', { class: 'jeu-turn-head' }, photon(f.solo && !done ? 'attentif' : 'bravo', 64),
        h('div', {}, h('p', { class: 'eyebrow' }, done ? 'La frise est complète' : 'Plus de vies'),
          h('h2', { tabindex: '-1' }, f.solo ? `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)} · ${f.players[0].score} carte${f.players[0].score > 1 ? 's' : ''} bien placée${f.players[0].score > 1 ? 's' : ''}` : winners.length > 1 ? 'Égalité !' : `${winners[0].name} gagne !`))),
      f.solo ? h('p', {}, stars === 3 ? 'Sans une erreur : un vrai voyageur du temps !' : done ? 'Bien joué ! Relis la frise : la prochaine fois, tu placeras encore mieux.' : 'Les vies sont épuisées, mais chaque carte a trouvé sa place : relis la frise et retente !')
        : h('p', {}, f.players.map((p) => `${p.name} : ${p.score} point${p.score > 1 ? 's' : ''}`).join(' · ')),
      gained > 0 ? h('p', { class: 'chest-points' }, `+${gained} points${star ? ' · 🌟 bonus du jeu du jour' : ''}`) : h('p', { class: 'small muted' }, 'Les points de la frise se gagnent une fois par jour : reviens demain !'),
      h('details', { class: 'mem-recap', open: true }, h('summary', {}, 'La frise dans l’ordre'),
        h('ol', { class: 'frise-recap' }, [...f.line, ...f.deck.slice(f.current)].sort((a, b) => a.year - b.year).map((e) => h('li', {}, h('strong', {}, yearLabel(e)), ' · ', e.label)))),
      h('div', { class: 'btn-row' },
        h('button', { type: 'button', class: 'btn btn--primary', onclick: () => onAgain() }, 'Rejouer avec d’autres cartes'),
        h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => onNew() }, 'Changer de frise'),
        h('a', { class: 'btn btn--ghost', href: '#/memoire' }, '🃏 Jeu de mémoire'))));
    if (!f.solo || stars === 3) setTimeout(() => confetti(stage.firstChild, 60), 150);
    announce(f.solo ? `Partie terminée : ${f.players[0].score} cartes bien placées.` : `${winners.map((w) => w.name).join(' et ')} ${winners.length > 1 ? 'sont à égalité' : 'gagne'}.`);
    const t = stage.querySelector('h2'); if (t) t.focus({ preventScroll: true });
  }

  stage.replaceChildren(
    h('div', { class: 'series-head quest-head' },
      h('div', {}, h('p', { class: 'eyebrow' }, `Frise chronologique · ${subjLabel(setup.meta.subject)} · ${levelLabel(setup.level)}`), h('h2', {}, setup.meta.label)),
      h('div', { class: 'btn-row' }, score, h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => onNew() }, 'Arrêter'))),
    status, h('div', { class: 'frise-board' }, hand, line));
  status.textContent = f.solo ? 'Où se place cette carte sur la frise ?' : `${f.players[0].name} commence.`;
  paint();
}

export async function render(root, { params } = {}) {
  const stage = h('div', { class: 'quest-stage frise-stage' });
  root.append(h('div', { class: 'page-head' },
    h('div', {}, h('p', { class: 'eyebrow' }, 'Jeux'), h('h1', {}, 'Frise chronologique'),
      h('p', { class: 'muted' }, 'Avant ou après ? Place les événements de ta classe dans l’ordre du temps.')),
    h('a', { class: 'btn', href: '#/jeu' }, h('span', { 'aria-hidden': 'true' }, '🎲 '), 'Jeu de plateau')), stage);
  let last = null;
  const toSetup = (prefill) => setupScreen(stage, { onStart: start, prefill });
  const fromUrl = { level: (params && params.get('classe')) || undefined, theme: (params && params.get('theme')) || undefined };
  function start(setup) { last = setup; window.scrollTo({ top: 0 }); play(stage, setup, { onAgain: again, onNew: () => toSetup(last) }); }
  async function again() {
    const events = distinctEvents(await eventsOf(last.meta).catch(() => []), last.size);
    if (events.length >= Math.min(last.size, 6)) start({ ...last, events }); else toSetup(last);
  }
  toSetup(fromUrl);
}
