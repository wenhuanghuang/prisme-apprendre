/**
 * Jeu de mémoire (#/memoire) : retrouver des paires qui vont ensemble, tirées des contenus de la classe — un mot et
 * son contraire, un instrument de météo et ce qu'il mesure, un événement et son année, un mot et sa traduction…
 * Seul (en un minimum d'essais) ou à deux sur le même appareil (une paire trouvée = un point, et on rejoue).
 * Une partie terminée rapporte quelques points une fois par jour ; le récapitulatif rappelle toutes les paires.
 */
import { h, announce } from '../dom.js';
import { store, recordGameEvent, gameProgress } from '../../app/store.js';
import { allGenerators, produce, loadData } from '../../generators/registry.js';
import { newMemory, flip, hideMiss, isOver, memoryStars, memoryWinners, distinctPairs, pairCount } from '../../engine/memoire.js';
import { yearLabel } from '../../engine/frise.js';
import { gameLevels, nearestLevel } from '../game/deck.js';
import { subjLabel } from './exercices.js';
import { dayKey } from '../../engine/game.js';
import { photon } from '../photon.js';
import { burstStars, confetti } from '../lesson-play/celebrate.js';

const levelId = (x) => String(x || '').toLowerCase();
const levelLabel = (id) => ((store.catalog && store.catalog.levels.find((l) => l.id === id)) || { label: id }).label;
// générateurs écrits en code qui produisent (parfois) des associations
const MATCH_CODE = new Set(['lf-oeuvres', 'mus-oeuvres', 'arts-oeuvres', 'tc-donnees', 'tc-projet']);
const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** Thèmes jouables pour une classe : associations, vocabulaire, frises. */
export function themesFor(level) {
  return allGenerators(store.index).filter((g) => g.levels.map(levelId).includes(level)
    && ((g.source !== 'code' && ['match', 'vocab', 'chronologie'].includes(g.kind)) || MATCH_CODE.has(g.id)));
}

/** Paires candidates d'un thème (mélangées). */
export async function pairsOf(meta, level) {
  if (meta.source !== 'code') {
    const d = (await loadData(meta.id)).data || {};
    if (meta.kind === 'match') return shuffle((d.pairs || []).map((p) => ({ a: p.left, b: p.right })));
    if (meta.kind === 'vocab') return shuffle((d.pairs || []).map((p) => ({ a: p.q, b: Array.isArray(p.a) ? p.a[0] : p.a })));
    if (meta.kind === 'chronologie') return shuffle((d.events || []).map((e) => ({ a: e.label, b: yearLabel(e) })));
    return [];
  }
  const out = [];
  for (let k = 0; k < 40 && out.length < 24; k++) {
    const def = await produce(meta, 1 + Math.floor(Math.random() * 2 ** 31), { niveau: level }).catch(() => null);
    if (!def || def.type !== 'match') continue;
    for (const l of def.left) { const r = def.right.find((x) => x.id === def.pairs[l.id]); if (r) out.push({ a: l.label, b: r.label }); }
  }
  return shuffle(out);
}

/* ------------------------------ Mise en place ------------------------------ */

function setupScreen(stage, { onStart, prefill = {} }) {
  const levels = gameLevels();
  const state = { level: prefill.level || nearestLevel(store.profile.level), theme: prefill.theme || '', players: prefill.players || 1, size: prefill.size || 6, guest: prefill.guest || 'Invité' };
  const err = h('p', { class: 'warn', 'aria-live': 'assertive' });
  const draw = () => {
    const themes = themesFor(state.level);
    if (state.theme && !themes.some((t) => t.id === state.theme)) state.theme = '';
    const sel = (label, value, options, onchange) => h('label', { class: 'field' }, h('span', { class: 'field-label' }, label),
      h('select', { class: 'field-input', onchange: (e) => onchange(e.target.value) }, options.map(([v, l]) => h('option', { value: v, selected: String(v) === String(value) }, l))));
    stage.replaceChildren(h('section', { class: 'card mem-setup' },
      h('div', { class: 'quest-setup-head' }, h('span', { class: 'mem-setup-art', 'aria-hidden': 'true' }, '🃏'),
        h('div', {}, h('h2', {}, 'Jeu de mémoire'),
          h('p', {}, 'Les cartes sont face cachée. Retourne-en deux : si elles vont ensemble (un mot et son contraire, un événement et son année…), elles restent visibles. Sinon, mémorise-les et retente ! À deux, une paire trouvée rapporte un point et permet de rejouer.'))),
      h('div', { class: 'series-grid' },
        sel('Classe', state.level, levels.map((l) => [l, levelLabel(l)]), (v) => { state.level = v; draw(); }),
        sel('Thème', state.theme, [['', 'Au hasard'], ...themes.map((t) => [t.id, `${subjLabel(t.subject)} · ${t.label}`])], (v) => { state.theme = v; }),
        sel('Nombre de paires', state.size, [[6, '6 paires (12 cartes)'], [8, '8 paires (16 cartes)']], (v) => { state.size = Number(v); }),
        sel('Joueurs', state.players, [[1, `Seul (${store.profile.pseudo})`], [2, 'À deux, sur le même appareil']], (v) => { state.players = Number(v); draw(); }),
        state.players === 2 ? h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Nom du deuxième joueur'),
          h('input', { class: 'field-input', value: state.guest, maxlength: 20, oninput: (e) => { state.guest = e.target.value || 'Invité'; } })) : null),
      themes.length ? null : h('p', { class: 'small muted' }, `Pas encore de thème de paires en ${levelLabel(state.level)} : choisis une autre classe.`),
      err,
      h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn btn--primary', disabled: !themes.length, onclick: () => go(themes) }, '🃏 Distribuer les cartes'))));
  };
  const go = async (themes) => {
    err.textContent = '';
    const order = state.theme ? themes.filter((t) => t.id === state.theme) : shuffle(themes);
    for (const meta of order) {
      const pairs = distinctPairs(await pairsOf(meta, state.level).catch(() => []), state.size);
      if (pairs.length >= Math.min(state.size, 5)) { onStart({ ...state, meta, pairs }); return; }
    }
    err.textContent = 'Pas assez de paires pour ce thème : choisis-en un autre.';
  };
  draw();
}

/* ------------------------------ Partie ------------------------------ */

function play(stage, setup, { onAgain, onNew }) {
  const names = setup.players === 2 ? [store.profile.pseudo, setup.guest || 'Invité'] : [store.profile.pseudo];
  const m = newMemory(setup.pairs, { players: names });
  let busy = false;
  const status = h('p', { class: 'mem-status', 'aria-live': 'polite' });
  const score = h('div', { class: 'mem-score' });
  const grid = h('div', { class: `mem-grid mem-grid--${pairCount(m) * 2}` });
  const paint = () => {
    score.replaceChildren(...(m.players.length > 1
      ? m.players.map((p, i) => h('span', { class: `mem-player ${i === m.turn && !isOver(m) ? 'is-turn' : ''}` }, h('b', {}, p.name), ` · ${p.pairs} paire${p.pairs > 1 ? 's' : ''}`))
      : [h('span', {}, h('b', {}, String(m.players[0].pairs)), `/${pairCount(m)} paires`), h('span', {}, h('b', {}, String(m.tries)), ` essai${m.tries > 1 ? 's' : ''}`)]));
    grid.replaceChildren(...m.cards.map((c, i) => {
      const visible = c.found || m.up.includes(c.id);
      return h('button', { type: 'button', class: `mem-card side-${c.side} ${visible ? 'is-up' : ''} ${c.found ? 'is-found' : ''}`, dataset: { id: c.id },
        'aria-label': visible ? `${c.label}${c.found ? ' (paire trouvée)' : ''}` : `Carte ${i + 1}, face cachée`, 'aria-pressed': visible ? 'true' : 'false',
        disabled: c.found || busy, onclick: () => turn(c.id) },
      h('span', { class: 'mem-face mem-back', 'aria-hidden': 'true' }, '◆'), h('span', { class: 'mem-face mem-front' }, c.label));
    }));
  };
  function turn(id) {
    if (busy) return;
    const r = flip(m, id);
    if (r === 'ignore') return;
    if (r === 'first') { paint(); focusCard(id); return; }
    if (r === 'pair') {
      const c = m.cards.find((x) => x.id === id);
      const pair = setup.pairs[c.pair];
      status.textContent = `Paire trouvée : ${pair.a} ↔ ${pair.b}${m.players.length > 1 ? ` — ${m.players[m.turn].name} rejoue !` : ''}`;
      paint();
      const el = grid.querySelector(`[data-id="${id}"]`); if (el) burstStars(el, 2);
      if (isOver(m)) setTimeout(end, 700);
      return;
    }
    status.textContent = m.players.length > 1 ? `Raté ! Au tour de ${m.players[(m.turn + 1) % m.players.length].name}.` : 'Ce n’est pas une paire : mémorise ces deux cartes !';
    busy = true; paint();
    setTimeout(() => { hideMiss(m); busy = false; paint(); focusCard(id); }, 1300);
  }
  const focusCard = (id) => { const el = grid.querySelector(`[data-id="${id}"]`); if (el && !el.disabled) el.focus({ preventScroll: true }); else { const any = grid.querySelector('.mem-card:not([disabled])'); if (any) any.focus({ preventScroll: true }); } };

  async function end() {
    const before = gameProgress();
    await recordGameEvent('memoire', dayKey(store.now())).catch(() => {});
    const after = gameProgress();
    const gained = before && after ? after.totalXp - before.totalXp : 0;
    const solo = m.players.length === 1;
    const stars = memoryStars(m);
    const winners = memoryWinners(m);
    stage.replaceChildren(h('section', { class: 'card mem-end enter-fwd' },
      h('div', { class: 'jeu-turn-head' }, photon('bravo', 64),
        h('div', {}, h('p', { class: 'eyebrow' }, 'Toutes les paires sont trouvées'),
          h('h2', { tabindex: '-1' }, solo ? `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)} en ${m.tries} essais` : winners.length > 1 ? 'Égalité !' : `${winners[0].name} gagne !`))),
      solo ? h('p', {}, stars === 3 ? 'Mémoire d’éléphant : bravo !' : stars === 2 ? 'Très bien ! Rejoue pour faire encore moins d’essais.' : 'Bien joué ! En rejouant, tu retiendras mieux où sont les cartes.')
        : h('p', {}, m.players.map((p) => `${p.name} : ${p.pairs} paire${p.pairs > 1 ? 's' : ''}`).join(' · ')),
      gained > 0 ? h('p', { class: 'chest-points' }, `+${gained} points`) : h('p', { class: 'small muted' }, 'Les points du jeu de mémoire se gagnent une fois par jour : reviens demain !'),
      h('details', { class: 'mem-recap', open: true }, h('summary', {}, 'Ce qu’il fallait associer'),
        h('ul', {}, setup.pairs.map((p) => h('li', {}, h('strong', {}, p.a), ' ↔ ', p.b)))),
      h('div', { class: 'btn-row' },
        h('button', { type: 'button', class: 'btn btn--primary', onclick: () => onAgain() }, 'Rejouer avec d’autres cartes'),
        h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => onNew() }, 'Changer de thème'),
        h('a', { class: 'btn btn--ghost', href: '#/jeu' }, '🎲 Jeu de plateau'))));
    if (solo ? stars === 3 : true) setTimeout(() => confetti(stage.firstChild, 60), 150);
    announce(solo ? `Partie terminée en ${m.tries} essais.` : `${winners.map((w) => w.name).join(' et ')} ${winners.length > 1 ? 'sont à égalité' : 'gagne'}.`);
    const t = stage.querySelector('h2'); if (t) t.focus({ preventScroll: true });
  }

  stage.replaceChildren(
    h('div', { class: 'series-head quest-head' },
      h('div', {}, h('p', { class: 'eyebrow' }, `Jeu de mémoire · ${subjLabel(setup.meta.subject)} · ${levelLabel(setup.level)}`), h('h2', {}, setup.meta.label)),
      h('div', { class: 'btn-row' }, score, h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => onNew() }, 'Arrêter'))),
    status, grid);
  status.textContent = m.players.length > 1 ? `${m.players[0].name} commence.` : 'Retourne deux cartes.';
  paint();
}

export async function render(root) {
  const stage = h('div', { class: 'quest-stage mem-stage' });
  root.append(h('div', { class: 'page-head' },
    h('div', {}, h('p', { class: 'eyebrow' }, 'Jeux'), h('h1', {}, 'Jeu de mémoire'),
      h('p', { class: 'muted' }, 'Des paires à retrouver dans les contenus de ta classe : de quoi s’entraîner la mémoire… et réviser sans s’en rendre compte.')),
    h('a', { class: 'btn', href: '#/jeu' }, h('span', { 'aria-hidden': 'true' }, '🎲 '), 'Jeu de plateau')), stage);
  let last = null;
  const toSetup = (prefill) => setupScreen(stage, { onStart: start, prefill });
  async function start(setup) { last = setup; window.scrollTo({ top: 0 }); play(stage, setup, { onAgain: again, onNew: () => toSetup(last) }); }
  async function again() {
    const pairs = distinctPairs(await pairsOf(last.meta, last.level).catch(() => []), last.size);
    if (pairs.length >= Math.min(last.size, 5)) start({ ...last, pairs }); else toSetup(last);
  }
  toSetup();
}
