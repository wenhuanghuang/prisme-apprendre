/**
 * Ordre de grandeur (#/estime) : six questions d'estimation adaptées à la classe (hauteur d'une porte, distance
 * Terre-Lune, nombre d'os du squelette, âge de l'Univers…). Seul, chaque estimation rapporte de 0 à 3 étoiles selon
 * l'écart ; à deux sur le même appareil, chacun estime à son tour (sans voir l'autre) et le plus proche marque le point.
 * La vraie valeur et une explication s'affichent après chaque question. Une partie rapporte des points une fois par jour.
 */
import { h, announce } from '../dom.js';
import { store, gameProgress } from '../../app/store.js';
import { pickQuestions, parseEstimate, estimateStars, closest, fmtValue, ratioOf } from '../../engine/estime.js';
import { gameLevels, nearestLevel } from '../game/deck.js';
import { recordMiniGame } from '../game/mini-games.js';
import { photon } from '../photon.js';
import { burstStars, confetti } from '../lesson-play/celebrate.js';

const levelLabel = (id) => ((store.catalog && store.catalog.levels.find((l) => l.id === id)) || { label: id }).label;
const unitOf = (q) => (q.unit ? ` ${q.unit}` : '');
const starsTxt = (n) => `${'★'.repeat(n)}${'☆'.repeat(3 - n)}`;

function setupScreen(stage, { onStart, prefill = {} }) {
  const levels = gameLevels();
  const state = { level: levels.includes(prefill.level) ? prefill.level : nearestLevel(store.profile.level), players: prefill.players || 1, guest: prefill.guest || 'Invité', count: prefill.count || 6 };
  const draw = () => {
    const sel = (label, value, options, onchange) => h('label', { class: 'field' }, h('span', { class: 'field-label' }, label),
      h('select', { class: 'field-input', onchange: (e) => onchange(e.target.value) }, options.map(([v, l]) => h('option', { value: v, selected: String(v) === String(value) }, l))));
    stage.replaceChildren(h('section', { class: 'card est-setup' },
      h('div', { class: 'quest-setup-head' }, h('span', { class: 'mem-setup-art', 'aria-hidden': 'true' }, '📏'),
        h('div', {}, h('h2', {}, 'Ordre de grandeur'),
          h('p', {}, 'Combien mesure, pèse ou dure… ? Donne ton estimation, sans chercher la valeur exacte : à 10 % près, 3 étoiles ; à 50 % près, 2 ; à trois fois près, 1. À deux, chacun estime sans voir l’autre, et le plus proche marque le point.'))),
      h('div', { class: 'series-grid' },
        sel('Classe', state.level, levels.map((l) => [l, levelLabel(l)]), (v) => { state.level = v; }),
        sel('Questions', state.count, [[6, '6 questions'], [10, '10 questions']], (v) => { state.count = Number(v); }),
        sel('Joueurs', state.players, [[1, `Seul (${store.profile.pseudo})`], [2, 'À deux, sur le même appareil']], (v) => { state.players = Number(v); draw(); }),
        state.players === 2 ? h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Nom du deuxième joueur'),
          h('input', { class: 'field-input', value: state.guest, maxlength: 20, oninput: (e) => { state.guest = e.target.value || 'Invité'; } })) : null),
      h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn btn--primary', onclick: () => onStart({ ...state, questions: pickQuestions(state.level, state.count) }) }, '📏 C’est parti !'))));
  };
  draw();
}

function play(stage, setup, { onAgain, onNew }) {
  const names = setup.players === 2 ? [store.profile.pseudo, setup.guest || 'Invité'] : [store.profile.pseudo];
  const duo = names.length > 1;
  const results = []; // { q, guesses, stars[], winners[] }
  let index = 0; let turn = 0; let guesses = [];
  const head = h('div', { class: 'series-head quest-head' });
  const card = h('section', { class: 'card est-card' });

  const paintHead = () => head.replaceChildren(
    h('div', {}, h('p', { class: 'eyebrow' }, `Ordre de grandeur · ${levelLabel(setup.level)}`), h('h2', {}, `Question ${Math.min(index + 1, setup.questions.length)}/${setup.questions.length}`)),
    h('div', { class: 'btn-row' }, ...(duo ? names.map((n, i) => h('span', { class: `mem-player ${i === turn ? 'is-turn' : ''}` }, h('b', {}, n), ` · ${results.filter((r) => r.winners.includes(i)).length}`))
      : [h('span', { class: 'eclair-progress' }, `${results.reduce((s, r) => s + r.stars[0], 0)} ★`)]),
    h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => onNew() }, 'Arrêter')));

  function ask() {
    const q = setup.questions[index];
    const input = h('input', { class: 'field-input est-input', type: duo ? 'password' : 'text', inputmode: 'decimal', autocomplete: 'off', 'aria-label': `Ton estimation${unitOf(q)}`, maxlength: 16 });
    const warn = h('p', { class: 'est-warn', 'aria-live': 'assertive' });
    const submit = () => {
      const v = parseEstimate(input.value);
      if (v === null) { warn.textContent = 'Écris un nombre positif (par exemple 300, 4,5 ou 384 000).'; input.focus({ preventScroll: true }); return; }
      guesses.push(v);
      if (guesses.length < names.length) { turn = guesses.length; paintHead(); ask(); return; }
      reveal();
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
    card.replaceChildren(
      duo ? h('p', { class: 'eyebrow' }, `${names[turn]}, à toi${turn === 1 ? ` (${names[0]} a déjà répondu, sans te le montrer)` : ''}`) : null,
      h('p', { class: 'est-question' }, q.q),
      h('div', { class: 'eclair-answer' }, input, q.unit ? h('span', { class: 'est-unit' }, q.unit) : null, h('button', { type: 'button', class: 'btn btn--primary', onclick: submit }, 'Valider')),
      warn);
    input.focus({ preventScroll: true });
  }

  function reveal() {
    const q = setup.questions[index];
    const stars = guesses.map((g) => estimateStars(g, q.value));
    const winners = duo ? closest(guesses, q.value) : [];
    results.push({ q, guesses: guesses.slice(), stars, winners });
    turn = 0; paintHead();
    const factor = (g) => {
      const r = ratioOf(g, q.value); const way = g > q.value ? 'grand' : 'petit';
      if (r < 1.005) return 'pile !';
      return r < 2 ? `trop ${way} de ${Math.round((Math.abs(g - q.value) / q.value) * 100)} %` : `${fmtValue(Math.round(r * 10) / 10)} fois trop ${way}`;
    };
    card.replaceChildren(
      h('p', { class: 'est-question' }, q.q),
      h('p', { class: 'est-answer' }, 'Réponse : ', h('strong', {}, `${fmtValue(q.value)}${unitOf(q)}`)),
      h('ul', { class: 'est-guesses' }, guesses.map((g, i) => h('li', { class: winners.includes(i) ? 'is-winner' : '' },
        duo ? h('strong', {}, `${names[i]} : `) : 'Ton estimation : ', `${fmtValue(g)}${unitOf(q)} — ${factor(g)} `, h('span', { class: 'est-stars', 'aria-label': `${stars[i]} étoile${stars[i] > 1 ? 's' : ''}` }, starsTxt(stars[i]))))),
      duo ? h('p', { class: 'est-point' }, winners.length > 1 ? 'Égalité : un point chacun !' : `Point pour ${names[winners[0]]} !`) : null,
      h('p', { class: 'small' }, q.why),
      h('div', { class: 'btn-row est-next-row' }, h('button', { type: 'button', class: 'btn btn--primary est-next', onclick: next }, index + 1 < setup.questions.length ? 'Question suivante →' : 'Voir le résultat')));
    if (Math.max(...stars) >= 2) burstStars(card.querySelector('.est-answer'), Math.max(...stars));
    announce(`Réponse : ${fmtValue(q.value)}${unitOf(q)}.`);
    const b = card.querySelector('.est-next'); if (b) b.focus({ preventScroll: true });
  }

  function next() { index++; guesses = []; if (index >= setup.questions.length) { end(); return; } paintHead(); ask(); }

  async function end() {
    const before = gameProgress();
    const star = await recordMiniGame('estime').catch(() => false);
    const after = gameProgress();
    const gained = before && after ? after.totalXp - before.totalXp : 0;
    const total = results.reduce((s, r) => s + r.stars[0], 0);
    const max = results.length * 3;
    const pts = names.map((_, i) => results.filter((r) => r.winners.includes(i)).length);
    const best = Math.max(...pts);
    const win = pts.map((p, i) => (p === best ? i : -1)).filter((i) => i >= 0);
    stage.replaceChildren(h('section', { class: 'card mem-end est-end enter-fwd' },
      h('div', { class: 'jeu-turn-head' }, photon('bravo', 64),
        h('div', {}, h('p', { class: 'eyebrow' }, 'Partie terminée'),
          h('h2', { tabindex: '-1' }, duo ? (win.length > 1 ? 'Égalité !' : `${names[win[0]]} gagne !`) : `${total} étoile${total > 1 ? 's' : ''} sur ${max}`))),
      duo ? h('p', {}, names.map((n, i) => `${n} : ${pts[i]} point${pts[i] > 1 ? 's' : ''}`).join(' · '))
        : h('p', {}, total >= max * 0.7 ? 'Un œil d’expert : tes ordres de grandeur sont justes !' : total >= max * 0.4 ? 'Bien estimé ! Relis les réponses : elles serviront de repères.' : 'Ces grandeurs sont difficiles à imaginer : les réponses ci-dessous deviendront tes repères.'),
      gained > 0 ? h('p', { class: 'chest-points' }, `+${gained} points${star ? ' · 🌟 bonus du jeu du jour' : ''}`) : h('p', { class: 'small muted' }, 'Les points de l’ordre de grandeur se gagnent une fois par jour.'),
      h('details', { class: 'mem-recap', open: true }, h('summary', {}, 'Les bonnes réponses'),
        h('ul', {}, results.map((r) => h('li', {}, `${r.q.q.replace(/, en [^?]+\?$/, ' ?')} `, h('strong', {}, `${fmtValue(r.q.value)}${unitOf(r.q)}`))))),
      h('div', { class: 'btn-row' },
        h('button', { type: 'button', class: 'btn btn--primary', onclick: () => onAgain() }, 'Rejouer avec d’autres questions'),
        h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => onNew() }, 'Changer de réglages'))));
    if (duo || total >= max * 0.7) setTimeout(() => confetti(stage.firstChild, 60), 150);
    announce(duo ? `${win.map((i) => names[i]).join(' et ')} ${win.length > 1 ? 'sont à égalité' : 'gagne'}.` : `${total} étoiles sur ${max}.`);
    const t = stage.querySelector('h2'); if (t) t.focus({ preventScroll: true });
  }

  stage.replaceChildren(head, card);
  paintHead(); ask();
}

export async function render(root, { params } = {}) {
  const stage = h('div', { class: 'quest-stage est-stage' });
  root.append(h('div', { class: 'page-head' },
    h('div', {}, h('p', { class: 'eyebrow' }, 'Jeux'), h('h1', {}, 'Ordre de grandeur'),
      h('p', { class: 'muted' }, 'Combien mesure, pèse ou dure… ? Estime, puis découvre la vraie valeur : de quoi se faire des repères pour toute la vie.')),
    h('a', { class: 'btn', href: '#/jeu' }, h('span', { 'aria-hidden': 'true' }, '🎲 '), 'Jeu de plateau')), stage);
  let last = null;
  const toSetup = (prefill) => setupScreen(stage, { onStart: start, prefill });
  function start(setup) { last = setup; window.scrollTo({ top: 0 }); play(stage, setup, { onAgain: () => start({ ...last, questions: pickQuestions(last.level, last.count) }), onNew: () => toSetup(last) }); }
  toSetup({ level: (params && params.get('classe')) || undefined });
}
