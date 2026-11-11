/**
 * « Vrai ou faux ? » (#/vraifaux) : une question de ta classe et une réponse proposée, ou deux éléments qui vont
 * peut-être ensemble. Vrai ou faux ? Seul : 12 cartes, un combo pour les bonnes réponses d'affilée et des « réponses
 * éclair » ; après chaque carte, la bonne réponse et son explication. À deux, en buzzer sur le même appareil : le
 * premier qui répond juste marque, une erreur donne le point à l'autre. Une partie rapporte des points une fois par jour.
 */
import { h, announce } from '../dom.js';
import { store, gameProgress } from '../../app/store.js';
import { allGenerators, produce, loadData, newSeed } from '../../generators/registry.js';
import { VF_ROUNDS, qcmCandidate, pairCandidates, newDeck, isRight, verdict, vfStars } from '../../engine/vraifaux.js';
import { gameLevels, nearestLevel } from '../game/deck.js';
import { subjLabel } from './exercices.js';
import { recordMiniGame } from '../game/mini-games.js';
import { photon } from '../photon.js';
import { burstStars, confetti } from '../lesson-play/celebrate.js';

const levelId = (x) => String(x || '').toLowerCase();
const levelLabel = (id) => ((store.catalog && store.catalog.levels.find((l) => l.id === id)) || { label: id }).label;
const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const KEYS = [['a', 'z'], ['k', 'l']]; // joueur 1 : A (vrai) Z (faux) ; joueur 2 : K (vrai) L (faux)
const FAST_MS = 4000;

/** Sources de cartes d'une classe : banques de questions (QCM) et associations (mots, œuvres, traductions…). */
export function vfSources(level) {
  return allGenerators(store.index).filter((g) => g.levels.map(levelId).includes(level)
    && ((g.source === 'code' && g.facts) || (g.source !== 'code' && ['match', 'vocab'].includes(g.kind))));
}
const vfLevels = () => gameLevels().filter((l) => vfSources(l).length);

async function candidatesOf(meta, level, tries = 6) {
  if (meta.source === 'code') {
    const out = [];
    for (let k = 0; k < tries; k++) {
      const c = qcmCandidate(await produce(meta, newSeed(), { niveau: level }).catch(() => null), meta);
      if (c) out.push(c);
    }
    return out;
  }
  const d = (await loadData(meta.id)).data || {};
  if (meta.kind === 'vocab') {
    return pairCandidates(shuffle(d.pairs || []).slice(0, 40).map((p) => ({ a: p.q, b: Array.isArray(p.a) ? p.a[0] : p.a })), meta,
      { leftTitle: `En ${d.fromLabel || 'français'}`, rightTitle: `En ${d.toLabel || 'langue étrangère'}` });
  }
  return pairCandidates((d.pairs || []).map((p) => ({ a: p.left, b: p.right })), meta, { leftTitle: d.leftTitle || '', rightTitle: d.rightTitle || '' });
}

/** Réunit les cartes d'une partie : une dizaine de banques de questions et quelques associations, au hasard. */
async function gatherDeck(level, subject) {
  const all = vfSources(level).filter((g) => !subject || g.subject === subject);
  const code = shuffle(all.filter((g) => g.source === 'code')).slice(0, 10);
  const data = shuffle(all.filter((g) => g.source !== 'code')).slice(0, code.length ? 3 : 6);
  const tries = Math.max(6, Math.ceil(36 / Math.max(1, code.length))); // une matière avec peu de banques : plus de tirages
  const cands = (await Promise.all([...code, ...data].map((m) => candidatesOf(m, level, tries).catch(() => [])))).flat();
  return newDeck(cands, VF_ROUNDS);
}

/* ------------------------------ Mise en place ------------------------------ */

function setupScreen(stage, { onStart, prefill = {} }) {
  const levels = vfLevels();
  const near = nearestLevel(store.profile.level);
  const state = { level: levels.includes(prefill.level) ? prefill.level : levels.includes(near) ? near : levels[0], subject: prefill.subject || '', players: prefill.players || 1, guest: prefill.guest || 'Invité' };
  const err = h('p', { class: 'warn', 'aria-live': 'assertive' });
  let busy = false;
  const draw = () => {
    const subjects = [...new Set(vfSources(state.level).map((g) => g.subject))].sort((a, b) => subjLabel(a).localeCompare(subjLabel(b), 'fr'));
    if (state.subject && !subjects.includes(state.subject)) state.subject = '';
    const sel = (label, value, options, onchange) => h('label', { class: 'field' }, h('span', { class: 'field-label' }, label),
      h('select', { class: 'field-input', onchange: (e) => onchange(e.target.value) }, options.map(([v, l]) => h('option', { value: v, selected: String(v) === String(value) }, l))));
    stage.replaceChildren(h('section', { class: 'card vf-setup' },
      h('div', { class: 'quest-setup-head' }, h('span', { class: 'mem-setup-art', 'aria-hidden': 'true' }, '🕵️'),
        h('div', {}, h('h2', {}, 'Vrai ou faux ?'),
          h('p', {}, 'Une question de ta classe et une réponse proposée : est-ce vrai ou faux ? Méfie-toi, les pièges ressemblent beaucoup aux bonnes réponses ! Après chaque carte, tu découvres la bonne réponse et son explication. À deux, c’est un buzzer : le premier qui a juste marque, mais une erreur donne le point à l’autre.'))),
      h('div', { class: 'series-grid' },
        sel('Classe', state.level, levels.map((l) => [l, levelLabel(l)]), (v) => { state.level = v; draw(); }),
        sel('Matière', state.subject, [['', 'Toutes les matières'], ...subjects.map((s) => [s, subjLabel(s)])], (v) => { state.subject = v; }),
        sel('Joueurs', state.players, [[1, `Seul (${store.profile.pseudo})`], [2, 'Buzzer à deux, sur le même appareil']], (v) => { state.players = Number(v); draw(); }),
        state.players === 2 ? h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Nom du deuxième joueur'),
          h('input', { class: 'field-input', value: state.guest, maxlength: 20, oninput: (e) => { state.guest = e.target.value || 'Invité'; } })) : null),
      state.players === 2 ? h('p', { class: 'small muted' }, 'Au clavier : le joueur 1 répond avec A (vrai) et Z (faux), le joueur 2 avec K (vrai) et L (faux).') : null,
      err,
      h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn btn--primary vf-start', onclick: go }, '🕵️ C’est parti !'))));
  };
  async function go() {
    if (busy) return;
    busy = true; err.textContent = 'Je prépare les cartes…';
    const deck = await gatherDeck(state.level, state.subject).catch(() => []);
    busy = false;
    if (deck.length < 6) { err.textContent = 'Pas assez de questions pour cette matière : choisis-en une autre.'; return; }
    err.textContent = '';
    onStart({ ...state, deck });
  }
  if (!levels.length) { stage.replaceChildren(h('p', { class: 'card' }, 'Aucune question disponible pour le moment.')); return; }
  draw();
}

/* ------------------------------ Partie ------------------------------ */

function cardView(card) {
  const where = [card.subject ? subjLabel(card.subject) : '', card.theme].filter(Boolean).join(' · ');
  if (card.kind === 'pair') {
    return h('div', { class: 'vf-card vf-card--pair' }, h('p', { class: 'eyebrow' }, where),
      h('p', { class: 'vf-q' }, 'Ces deux-là vont-ils ensemble ?'),
      h('div', { class: 'vf-pair' },
        h('div', { class: 'vf-chip' }, card.leftTitle ? h('span', { class: 'vf-chip-title' }, card.leftTitle) : null, h('b', {}, card.question)),
        h('span', { class: 'vf-link', 'aria-hidden': 'true' }, '⟷'),
        h('div', { class: 'vf-chip' }, card.rightTitle ? h('span', { class: 'vf-chip-title' }, card.rightTitle) : null, h('b', {}, card.proposal))));
  }
  return h('div', { class: 'vf-card' }, h('p', { class: 'eyebrow' }, where),
    h('p', { class: 'vf-q' }, card.question),
    h('p', { class: 'vf-prop' }, h('span', { class: 'vf-prop-label' }, 'Réponse proposée'), h('b', {}, card.proposal)));
}

function play(stage, setup, { onAgain, onNew }) {
  const names = setup.players === 2 ? [store.profile.pseudo, setup.guest || 'Invité'] : [store.profile.pseudo];
  const duo = names.length > 1;
  const deck = setup.deck;
  const started = Date.now();
  let i = 0; let combo = 0; let best = 0; let errors = 0; let fast = 0; let locked = false; let shownAt = Date.now(); let timer = null;
  const misses = [];
  const scores = names.map(() => 0);
  const head = h('div', { class: 'series-head quest-head' });
  const cardHost = h('div', { class: 'vf-card-host' });
  const feedback = h('div', { class: 'vf-feedback', 'aria-live': 'polite' });
  const answers = h('div', { class: 'vf-answers' });
  const pads = names.map(() => h('div', { class: 'cmp-pad vf-pad' }));
  pads.forEach((p, k) => p.classList.add(`cmp-pad--${k}`));

  const paintHead = () => head.replaceChildren(
    h('div', {}, h('p', { class: 'eyebrow' }, `Vrai ou faux ? · ${levelLabel(setup.level)}`), h('h2', {}, `Carte ${Math.min(i + 1, deck.length)}/${deck.length}`)),
    h('div', { class: 'btn-row' }, ...(duo ? names.map((n, p) => h('span', { class: 'mem-player' }, h('b', {}, n), ` · ${scores[p]}`))
      : [h('span', { class: `cmp-combo ${combo >= 3 ? 'is-hot' : ''}` }, combo >= 2 ? `🔥 combo ×${combo}` : `${scores[0]} juste${scores[0] > 1 ? 's' : ''}`)]),
    h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => { detach(); onNew(); } }, 'Arrêter')));

  const paint = () => {
    const card = deck[i];
    cardHost.replaceChildren(cardView(card));
    feedback.replaceChildren();
    feedback.className = 'vf-feedback';
    if (duo) {
      answers.replaceChildren();
      pads.forEach((pad, p) => pad.replaceChildren(h('span', { class: 'cmp-pad-name' }, names[p]),
        ...[[true, '✔ Vrai'], [false, '✘ Faux']].map(([says, l], k) => h('button', { type: 'button', class: `cmp-buzz vf-buzz ${says ? 'is-true' : 'is-false'}`, dataset: { player: String(p), says: says ? 'vrai' : 'faux' }, onclick: () => answer(p, says) }, `${l} (${KEYS[p][k].toUpperCase()})`))));
    } else {
      answers.replaceChildren(
        h('button', { type: 'button', class: 'vf-btn vf-btn--vrai', dataset: { says: 'vrai' }, onclick: () => answer(0, true) }, h('span', { 'aria-hidden': 'true' }, '✔ '), 'Vrai'),
        h('button', { type: 'button', class: 'vf-btn vf-btn--faux', dataset: { says: 'faux' }, onclick: () => answer(0, false) }, h('span', { 'aria-hidden': 'true' }, '✘ '), 'Faux'));
    }
    paintHead();
    shownAt = Date.now();
  };

  function next() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!locked) return;
    i++; locked = false;
    if (i >= deck.length) { end(); return; }
    paint();
  }

  function answer(p, saysTrue) {
    if (locked || i >= deck.length) return;
    locked = true;
    const card = deck[i];
    const right = isRight(card, saysTrue);
    const quick = right && Date.now() - shownAt < FAST_MS;
    const el = cardHost.firstChild;
    el.classList.add(card.truth ? 'is-true' : 'is-false');
    let title;
    if (duo) {
      const winner = right ? p : 1 - p;
      scores[winner]++;
      title = right ? `Point pour ${names[p]} !` : `Raté, ${names[p]} : point pour ${names[1 - p]}.`;
    } else if (right) {
      scores[0]++; combo++; best = Math.max(best, combo);
      if (quick) fast++;
      title = `${quick ? '⚡ ' : ''}Juste !${combo >= 3 ? ` 🔥 ${combo} d’affilée` : ''}`;
      burstStars(el, Math.min(3, combo));
    } else {
      errors++; combo = 0; misses.push(card);
      title = 'Raté !';
    }
    feedback.className = `vf-feedback ${right ? 'is-right' : 'is-wrong'}`;
    feedback.replaceChildren(h('p', { class: 'vf-feedback-title' }, title), h('p', {}, verdict(card)),
      h('button', { type: 'button', class: 'btn btn--primary btn--small vf-next', onclick: next }, i + 1 >= deck.length ? 'Voir le résultat' : 'Carte suivante ▶'));
    answers.querySelectorAll('button').forEach((b) => { b.disabled = true; });
    pads.forEach((pad) => pad.querySelectorAll('button').forEach((b) => { b.disabled = true; }));
    paintHead();
    if (duo) timer = setTimeout(next, 4000);
    else if (right) timer = setTimeout(next, 2600);
    const nb = feedback.querySelector('.vf-next'); if (nb && !right && !duo) nb.focus({ preventScroll: true });
  }

  const onKey = (ev) => {
    if (!cardHost.isConnected) { detach(); return; }
    if (ev.target && /^(INPUT|SELECT|TEXTAREA)$/.test(ev.target.tagName)) return;
    const k = ev.key.toLowerCase();
    if (locked) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); next(); } return; }
    if (!duo) {
      if (k === 'v' || ev.key === 'ArrowLeft') answer(0, true);
      else if (k === 'f' || ev.key === 'ArrowRight') answer(0, false);
      return;
    }
    KEYS.forEach((pair, p) => pair.forEach((key, side) => { if (k === key) answer(p, side === 0); }));
  };
  const detach = () => { document.removeEventListener('keydown', onKey); if (timer) { clearTimeout(timer); timer = null; } };
  document.addEventListener('keydown', onKey);

  async function end() {
    detach();
    const before = gameProgress();
    const star = await recordMiniGame('vraifaux').catch(() => false);
    const after = gameProgress();
    const gained = before && after ? after.totalXp - before.totalXp : 0;
    const secs = Math.round((Date.now() - started) / 1000);
    const stars = vfStars(errors);
    const top = Math.max(...scores);
    const win = scores.map((s, p) => (s === top ? p : -1)).filter((p) => p >= 0);
    stage.replaceChildren(h('section', { class: 'card mem-end vf-end enter-fwd' },
      h('div', { class: 'jeu-turn-head' }, photon('bravo', 64),
        h('div', {}, h('p', { class: 'eyebrow' }, 'Partie terminée'),
          h('h2', { tabindex: '-1' }, duo ? (win.length > 1 ? 'Égalité !' : `${names[win[0]]} gagne !`) : `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)} · ${scores[0]}/${deck.length} en ${secs} s`))),
      duo ? h('p', {}, names.map((n, p) => `${n} : ${scores[p]} point${scores[p] > 1 ? 's' : ''}`).join(' · '))
        : h('p', {}, `Meilleur combo : ${best} d’affilée${fast ? ` · ⚡ ${fast} réponse${fast > 1 ? 's' : ''} éclair (moins de 4 secondes)` : ''}.`),
      gained > 0 ? h('p', { class: 'chest-points' }, `+${gained} points${star ? ' · 🌟 bonus du jeu du jour' : ''}`) : h('p', { class: 'small muted' }, 'Les points de « Vrai ou faux ? » se gagnent une fois par jour.'),
      !duo && misses.length ? h('details', { class: 'mem-recap', open: true }, h('summary', {}, 'À retenir'),
        h('ul', {}, misses.map((c) => h('li', {}, h('b', {}, c.question), ' ', h('span', {}, `→ ${c.good}`), c.why ? h('span', { class: 'small muted' }, ` (${c.why})`) : null)))) : null,
      h('div', { class: 'btn-row' },
        h('button', { type: 'button', class: 'btn btn--primary', onclick: () => onAgain() }, duo ? 'Revanche' : 'Rejouer'),
        h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => onNew() }, 'Changer de réglages'))));
    if (duo || stars === 3) setTimeout(() => confetti(stage.firstChild, 60), 150);
    announce(duo ? `${win.map((p) => names[p]).join(' et ')} ${win.length > 1 ? 'sont à égalité' : 'gagne'}.` : `${scores[0]} bonnes réponses sur ${deck.length}.`);
    const t = stage.querySelector('h2'); if (t) t.focus({ preventScroll: true });
  }

  stage.replaceChildren(head, h('section', { class: `card vf-board ${duo ? 'is-duo' : ''}` },
    duo ? pads[0] : null, cardHost, answers, feedback,
    duo ? pads[1] : h('p', { class: 'small muted' }, 'Au clavier : V (ou flèche gauche) pour vrai, F (ou flèche droite) pour faux, Entrée pour continuer.')));
  paint();
}

export async function render(root, { params } = {}) {
  const stage = h('div', { class: 'quest-stage vf-stage' });
  root.append(h('div', { class: 'page-head' },
    h('div', {}, h('p', { class: 'eyebrow' }, 'Jeux'), h('h1', {}, 'Vrai ou faux ?'),
      h('p', { class: 'muted' }, 'Démasque les fausses réponses : toutes les matières de ta classe, seul ou en buzzer à deux.')),
    h('a', { class: 'btn', href: '#/jeu' }, h('span', { 'aria-hidden': 'true' }, '🎲 '), 'Jeu de plateau')), stage);
  let last = null;
  const toSetup = (prefill) => setupScreen(stage, { onStart: start, prefill });
  async function start(setup) {
    last = setup; window.scrollTo({ top: 0 });
    play(stage, setup, {
      onAgain: async () => { const deck = await gatherDeck(last.level, last.subject).catch(() => []); start(deck.length >= 6 ? { ...last, deck } : last); },
      onNew: () => toSetup(last),
    });
  }
  toSetup({ level: (params && params.get('classe')) || undefined });
}
