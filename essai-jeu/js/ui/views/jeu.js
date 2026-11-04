/**
 * Jeu de plateau « La traversée du Prisme » : de 1 à 4 joueurs sur le même appareil (profils locaux,
 * invités, Photon joué par l'ordinateur). Chaque joueur reçoit des questions de SA classe et de sa matière :
 * on peut jouer en famille à plusieurs niveaux. Les réponses d'un profil sont corrigées, diagnostiquées
 * et comptées dans son propre profil, comme dans les leçons ; celles d'un invité ne sont pas enregistrées.
 * La partie est sauvegardée après chaque action et peut être reprise.
 */
import { h, announce } from '../dom.js';
import { store, getSetting, setSetting, playerContext, activeContext, useContext, keepContext, refreshViews, gameProgress, recordGameEvent } from '../../app/store.js';
import { vignetteCard, newVignettes } from '../game/rewards-ui.js';
import { normalizeStates } from '../../engine/mastery.js';
import {
  BOARD_SIZES, CASE_TYPES, CARDS, PHOTON_LEVELS, QUESTION_LABELS,
  newGame, startTurn, answer, endTurn, currentPlayer, photonResult, ranking, gameStars, caseAt,
} from '../../engine/plateau.js';
import { boardView, legend } from '../game/board.js';
import { die } from '../game/dice.js';
import { createDeck, gameLevels, nearestLevel, gameSubjects } from '../game/deck.js';
import { subjLabel } from './exercices.js';
import { mountExercise } from '../exercise.js';
import { photon } from '../photon.js';
import { confetti, burstStars } from '../lesson-play/celebrate.js';

const SAVE_KEY = 'jeu:partie';
const GUEST_SYMBOLS = ['★', '▲', '●', '◆'];
const GUEST_COLORS = ['#c2410c', '#2a9d5c', '#d9468f', '#a16207'];
const PHOTON_LOOK = { symbol: '☀', color: '#f08a24' };
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, reduced() ? Math.min(ms, 150) : ms));
const levelLabel = (id) => ((store.catalog && store.catalog.levels.find((l) => l.id === id)) || { label: id }).label;
const rankLabel = (r) => (r === 1 ? '1er' : `${r}e`);
const subjectText = (s) => (s === 'tous' ? 'toutes matières' : subjLabel(s));

/* ------------------------------ Mise en place ------------------------------ */

const PAWN_COLORS = ['#3b4cca', '#c2410c', '#2a9d5c', '#7a4cc2', '#d9468f', '#0f7b7d', '#a16207', '#1d2433'];
const PAWN_SYMBOLS = ['◆', '★', '●', '▲', '✦', '☄', '◎', '✳'];

/** Deux profils peuvent avoir la même couleur et le même symbole : sur le plateau, chaque pion doit se distinguer. */
export function distinctPawns(players) {
  const colors = new Set(); const symbols = new Set();
  return players.map((p) => {
    const q = { ...p };
    if (colors.has(q.color)) q.color = PAWN_COLORS.find((c) => !colors.has(c)) || q.color;
    if (symbols.has(q.symbol)) q.symbol = PAWN_SYMBOLS.find((c) => !symbols.has(c)) || q.symbol;
    colors.add(q.color); symbols.add(q.symbol);
    return q;
  });
}

function fromProfile(prof) {
  return { kind: 'profil', profileId: prof.id, name: prof.pseudo, color: prof.color, symbol: prof.symbol, level: nearestLevel(prof.level), profileLevel: prof.level, subject: 'tous' };
}

function rulesCard(open) {
  return h('details', { class: 'card jeu-rules', open: open || null },
    h('summary', {}, h('strong', {}, 'Règle du jeu'), h('span', { class: 'muted small' }, ' · 2 minutes de lecture')),
    h('ol', { class: 'jeu-rules-list' },
      h('li', {}, h('strong', {}, 'Lance le dé. '), 'La case visée (ta position + le dé) décide de la question : simple, défi ◆ ou révision ↻.'),
      h('li', {}, h('strong', {}, 'Réponds. '), 'Réussi : ton pion va sur la case visée. Du premier coup et sans indice : tu gagnes aussi un éclat de lumière ✦.'),
      h('li', {}, h('strong', {}, 'Raté ? '), 'Tu avances quand même d’une case, et tu lis la correction : c’est comme ça qu’on progresse.'),
      h('li', {}, h('strong', {}, 'Cases spéciales. '), 'L’arc-en-ciel ⤴ fait filer plus loin, le nuage ☁ pose une question de rattrapage (ratée, on glisse en arrière), la carte Lumière ✧ réserve une surprise.'),
      h('li', {}, h('strong', {}, 'Le Prisme. '), 'On entre dans la dernière case seulement avec une bonne réponse. Le premier arrivé déclenche le dernier tour : chacun joue autant de tours, puis on classe (arrivée, position, éclats).')),
    h('h3', {}, 'Les cases'), legend(),
    h('h3', {}, 'Les cartes Lumière'),
    h('ul', { class: 'card-legend' }, Object.values(CARDS).map((c) => h('li', {}, h('span', { 'aria-hidden': 'true' }, c.icon), ' ', h('strong', {}, c.label), ' — ', c.text))),
    h('p', { class: 'small muted' }, 'Chaque joueur répond à des questions de sa classe : un élève de 5e et un de 4e peuvent jouer ensemble. Les réponses d’un profil comptent dans sa progression ; celles d’un invité ne sont pas enregistrées.'));
}

function setupScreen(stage, { onStart, prefill }) {
  const levels = gameLevels();
  const state = prefill ? structuredClone(prefill) : { size: 'normale', players: [fromProfile(store.profile)] };
  const err = h('p', { class: 'warn', 'aria-live': 'assertive' });

  const usedColors = () => new Set(state.players.map((p) => p.color));
  const addGuest = () => {
    const k = state.players.filter((p) => p.kind === 'invite').length;
    const color = GUEST_COLORS.find((c) => !usedColors().has(c)) || GUEST_COLORS[k % 4];
    state.players.push({ kind: 'invite', name: `Invité ${k + 1}`, color, symbol: GUEST_SYMBOLS[k % 4], level: nearestLevel(store.profile.level), subject: 'tous' });
  };

  const draw = () => {
    const others = store.profiles.filter((pr) => !state.players.some((p) => p.profileId === pr.id));
    const hasPhoton = state.players.some((p) => p.kind === 'photon');
    const humans = state.players.filter((p) => p.kind !== 'photon').length;
    const row = (p, k) => {
      const remove = state.players.length > 1 && !(p.kind !== 'photon' && humans === 1)
        ? h('button', { type: 'button', class: 'btn btn--icon', 'aria-label': `Retirer ${p.name}`, title: 'Retirer ce joueur', onclick: () => { state.players.splice(k, 1); draw(); } }, '✕') : null;
      const sel = (label, value, options, onchange) => h('label', { class: 'field' }, h('span', { class: 'field-label' }, label),
        h('select', { class: 'field-input', onchange: (e) => onchange(e.target.value) }, options.map(([v, l]) => h('option', { value: v, selected: v === value }, l))));
      let fields;
      if (p.kind === 'photon') {
        fields = [sel('Adversaire', p.photonLevel, Object.entries(PHOTON_LEVELS).map(([id, x]) => [id, x.label]), (v) => { p.photonLevel = v; })];
      } else {
        const subjects = gameSubjects(p.level);
        if (p.subject !== 'tous' && !subjects.includes(p.subject)) p.subject = 'tous';
        fields = [
          sel('Classe des questions', p.level, levels.map((l) => [l, levelLabel(l)]), (v) => { p.level = v; draw(); }),
          sel('Matière', p.subject, [['tous', 'Toutes les matières'], ...subjects.map((s) => [s, subjLabel(s)])], (v) => { p.subject = v; }),
          // primaire et lycée : pas encore d'exercices, on le dit plutôt que de proposer en silence une autre classe
          p.profileLevel && !levels.includes(String(p.profileLevel).toLowerCase())
            ? h('p', { class: 'small muted jeu-setup-note' }, `Pas encore de questions de ${p.profileLevel} dans Prisme (pour l’instant : ${levels.map(levelLabel).join(', ')}). Choisis la classe des questions.`) : null,
        ];
      }
      const name = p.kind === 'invite'
        ? h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Pseudo de l’invité'), h('input', { class: 'field-input', value: p.name, maxlength: 24, oninput: (e) => { p.name = e.target.value; } }))
        : h('p', { class: 'jeu-setup-name' }, h('strong', {}, p.name), h('br'), h('span', { class: 'small muted' }, p.kind === 'photon' ? 'joué par l’ordinateur' : 'profil de cet appareil · progression enregistrée'));
      return h('li', { class: `jeu-setup-player jeu-setup-player--${p.kind}` },
        h('span', { class: 'avatar avatar--l', style: { background: p.color } }, p.symbol), name, h('div', { class: 'jeu-setup-fields' }, fields), remove);
    };
    stage.replaceChildren(
      h('section', { class: 'card jeu-setup', 'aria-labelledby': 'jeu-qui' },
        h('h2', { id: 'jeu-qui' }, 'Qui joue ?'),
        h('ol', { class: 'jeu-setup-players' }, state.players.map(row)),
        state.players.length < 4 ? h('div', { class: 'jeu-add' },
          h('p', { class: 'small muted' }, 'Ajouter un joueur (4 au plus) :'),
          h('div', { class: 'btn-row' },
            others.map((pr) => h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => { state.players.push(fromProfile(pr)); draw(); } },
              h('span', { class: 'avatar avatar--s', style: { background: pr.color }, 'aria-hidden': 'true' }, pr.symbol), `+ ${pr.pseudo}${pr.demo ? ' (fictif)' : ''}`)),
            h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => { addGuest(); draw(); } }, '+ Invité'),
            hasPhoton ? null : h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => { state.players.push({ kind: 'photon', name: 'Photon', ...PHOTON_LOOK, photonLevel: 'malin' }); draw(); } },
              photon('joie', 22), '+ Photon (l’ordinateur)'))) : null,
        h('fieldset', { class: 'jeu-size' }, h('legend', {}, 'Durée de la partie'),
          h('div', { class: 'jeu-size-options' }, Object.entries(BOARD_SIZES).map(([id, s]) => h('label', { class: `jeu-size-opt ${state.size === id ? 'is-on' : ''}` },
            h('input', { type: 'radio', name: 'jeu-size', value: id, checked: state.size === id, onchange: () => { state.size = id; draw(); } }),
            h('strong', {}, s.label), h('span', { class: 'small muted' }, `${s.cases} cases · ${s.detail}`))))),
        err,
        h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn btn--primary jeu-go', onclick: () => go() }, h('span', { 'aria-hidden': 'true' }, '🎲 '), 'Commencer la partie'))),
      rulesCard(!prefill));
  };

  const go = () => {
    for (const p of state.players) if (p.kind === 'invite') p.name = String(p.name || '').trim().slice(0, 24);
    if (state.players.some((p) => p.kind === 'invite' && !p.name)) { err.textContent = 'Donne un pseudo à chaque invité.'; return; }
    if (!state.players.some((p) => p.kind !== 'photon')) { err.textContent = 'Il faut au moins un joueur qui répond aux questions.'; return; }
    onStart(state);
  };
  draw();
}

/* ------------------------------ Partie ------------------------------ */

function cardEl(id) {
  const c = CARDS[id];
  return h('div', { class: 'lumiere-card', role: 'group', 'aria-label': `Carte Lumière : ${c.label}. ${c.text}` },
    h('span', { class: 'lumiere-card-kind', 'aria-hidden': 'true' }, 'Carte Lumière'),
    h('span', { class: 'lumiere-card-icon', 'aria-hidden': 'true' }, c.icon),
    h('strong', {}, c.label), h('span', {}, c.text));
}

function caseBadge(c, n) {
  const t = CASE_TYPES[c.type];
  return h('span', { class: `case-badge case-badge--${c.type}`, style: { '--h': String(Math.round((c.i / n) * 280)) } },
    h('span', { 'aria-hidden': 'true' }, t.icon || '•'), ' ', c.type === 'arrivee' ? 'Le Prisme' : `Case ${c.i}${c.type !== 'normale' ? ` · ${t.label}` : ''}`);
}

function questionIntro(game, pend, p) {
  const c = caseAt(game, pend.target);
  if (pend.phase === 'rattrapage') return `Nuage ! Réussis cette question pour rester ; sinon tu glisses jusqu’à la case ${c.to}.`;
  if (pend.phase === 'bonus') return 'Question cadeau : réussie, tu avances de 3 cases.';
  const base = pend.question === 'defi' ? 'Défi : une question plus exigeante. Réussie, 2 éclats de lumière en plus.'
    : pend.question === 'revision' ? 'Révision : une notion à consolider. Réussie, 1 éclat de lumière.'
      : pend.question === 'finale' ? 'Question finale : réussie, tu entres dans le Prisme !'
        : c.type === 'pont' ? 'Réussis cette question pour prendre l’arc-en-ciel.'
          : c.type === 'nuage' ? 'Attention, cette case est un nuage.'
            : c.type === 'carte' ? 'Réussis cette question pour piocher une carte Lumière.' : 'Réussis cette question pour aller sur cette case.';
  return `${base}${p.loupe ? ' Loupe : ton premier indice est gratuit.' : ''}`;
}

/** Texte d'un évènement du moteur (null : rien à dire). */
function eventText(e, game, pend) {
  const who = (id) => (game.players.find((x) => x.id === id) || {}).name;
  switch (e.type) {
    case 'verdict':
      if (e.ok) return { icon: e.stars === 3 ? '★' : '✓', cls: 'ok', text: e.stars === 3 ? 'Réussi du premier coup, sans indice !' : 'Réussi !' };
      if (e.question === 'finale') return { icon: '…', cls: 'ko', text: 'Pas encore : il faut une bonne réponse pour entrer dans le Prisme.' };
      if (pend && pend.phase === 'rattrapage') return { icon: '☁', cls: 'ko', text: 'Raté…' };
      if (pend && pend.phase === 'bonus') return { icon: '…', cls: 'ko', text: 'Pas cette fois : la question cadeau ne rapporte rien.' };
      return { icon: '→', cls: 'ko', text: 'Pas cette fois : le pion avance quand même d’une case. Relis bien la correction !' };
    case 'eclat': return { icon: '✦', cls: 'eclat', text: `+${e.n} éclat${e.n > 1 ? 's' : ''} de lumière pour ${who(e.player)}.` };
    case 'move': {
      const d = Math.abs(e.to - e.from);
      const msg = {
        reussite: `${who(e.player)} avance de ${d} case${d > 1 ? 's' : ''}${e.to === game.board.n ? '' : ` (case ${e.to})`}.`,
        'petit-pas': `${who(e.player)} avance d’une case.`,
        pont: `Arc-en-ciel ! ${who(e.player)} file jusqu’à la case ${e.to}.`,
        nuage: `Le nuage emporte ${who(e.player)} jusqu’à la case ${e.to}.`,
        carte: `${who(e.player)} avance jusqu’à la case ${e.to}.`,
        eclipse: `${who(e.player)} recule d’une case.`,
        cadeau: `Cadeau : ${who(e.player)} avance jusqu’à la case ${e.to}.`,
      }[e.reason];
      return { icon: { pont: '⤴', nuage: '☁', eclipse: '◑' }[e.reason] || '→', cls: e.to > e.from ? 'move' : 'back', text: msg };
    }
    case 'bouclier': return { icon: '⛉', cls: 'ok', text: `Le bouclier protège ${who(e.player)} du nuage.` };
    case 'tenu': return { icon: '☁', cls: 'ok', text: `${who(e.player)} tient bon sur le nuage !` };
    case 'arrivee': {
      const left = game.players.some((x) => !x.finished);
      return { icon: '△', cls: 'win', text: `${who(e.player)} entre dans le Prisme (${rankLabel(e.rank)}) !${e.rank === 1 && left ? ' Dernier tour : les autres joueurs jouent encore jusqu’à la fin de ce tour.' : ''}` };
    }
    default: return null;
  }
}

async function play(stage, game, { host, onReplay, onNew, setStopper }) {
  let stopped = false; let current = null; let activeCtx = null;
  const contexts = new Map();
  const decks = new Map();
  const save = () => setSetting(SAVE_KEY, game).catch(() => { /* sauvegarde impossible : la partie continue */ });
  // en rendant la main, le bandeau de progression (s'il existe) revient au profil de l'appareil
  const release = () => { if (activeCtx) { keepContext(activeCtx); useContext(host); activeCtx = null; refreshViews(); } };
  setStopper(() => { stopped = true; if (current) { current.destroy(); current = null; } release(); });

  store.sharedPlay = true;
  for (const p of game.players) {
    if (p.kind === 'photon') continue;
    if (p.kind === 'profil') {
      const ctx = p.profileId === host.profile.id ? host : await playerContext(p.profileId);
      if (ctx) contexts.set(p.id, ctx); else { p.kind = 'invite'; p.name = `${p.name} (profil supprimé)`.slice(0, 40); }
    }
    // un invité a un contexte vide : ses questions ne dépendent pas de l'historique du propriétaire de l'appareil
    if (!contexts.has(p.id)) contexts.set(p.id, { profile: host.profile, states: normalizeStates(null, host.profile.id), attempts: [], submissions: [], guest: true });
    decks.set(p.id, createDeck({ level: p.level, subject: p.subject }));
  }
  if (stopped) return;
  // un profil qui prend la main : le bandeau de progression montre la sienne (un invité n'en a pas)
  const takeHand = (p) => { release(); const ctx = contexts.get(p.id); if (ctx) { useContext(ctx); activeCtx = ctx; if (!ctx.guest) refreshViews(); } };

  const board = boardView(game);
  const playersList = h('ol', { class: 'jeu-players', 'aria-label': 'Joueurs' });
  const turnBox = h('div', { class: 'jeu-turn', 'aria-live': 'off' });
  stage.replaceChildren(h('div', { class: 'jeu-layout' },
    h('div', { class: 'jeu-board-col' }, board.el, playersList,
      h('details', { class: 'jeu-legend' }, h('summary', {}, 'Les cases et les cartes'), legend(), h('ul', { class: 'card-legend' }, Object.values(CARDS).map((c) => h('li', {}, h('span', { 'aria-hidden': 'true' }, c.icon), ' ', h('strong', {}, c.label), ' — ', c.text))))),
    h('div', { class: 'jeu-turn-col' }, turnBox)));

  const paintPlayers = () => {
    playersList.replaceChildren(...game.players.map((p, idx) => h('li', { class: `jeu-player ${idx === game.turn && !game.over ? 'is-turn' : ''} ${p.finished ? 'is-finished' : ''}`, 'aria-current': idx === game.turn && !game.over ? 'true' : null, dataset: { player: p.id } },
      h('span', { class: 'avatar', style: { background: p.color }, 'aria-hidden': 'true' }, p.symbol),
      h('span', { class: 'jeu-player-main' }, h('strong', {}, p.name),
        h('span', { class: 'small muted' }, p.kind === 'photon' ? (PHOTON_LEVELS[p.photonLevel] || PHOTON_LEVELS.malin).label : `${levelLabel(p.level)} · ${subjectText(p.subject)}${p.kind === 'invite' ? ' · invité' : ''}`)),
      h('span', { class: 'jeu-player-pos' }, p.finished ? `△ ${rankLabel(p.finished)}` : p.pos === 0 ? 'Départ' : `Case ${p.pos}`),
      h('span', { class: 'jeu-player-eclats', title: 'Éclats de lumière', 'aria-label': `${p.eclats} éclat${p.eclats > 1 ? 's' : ''}` }, `✦ ${p.eclats}`),
      p.shield ? h('span', { class: 'jeu-player-item', title: 'Bouclier : protège du prochain nuage', 'aria-label': 'Bouclier' }, '⛉') : null,
      p.loupe ? h('span', { class: 'jeu-player-item', title: 'Loupe : premier indice gratuit', 'aria-label': 'Loupe' }, '⌕') : null)));
  };
  const refresh = () => { board.update(game); paintPlayers(); };

  /** Montre les évènements un par un, avec les déplacements animés. */
  async function showEvents(log, events, pend) {
    for (const e of events) {
      if (stopped) return;
      const t = eventText(e, game, pend);
      if (e.type === 'carte') {
        const card = cardEl(e.card);
        log.append(h('li', { class: 'jeu-log-card' }, card));
        announce(`Carte Lumière : ${CARDS[e.card].label}. ${CARDS[e.card].text}`);
        await wait(900);
      } else if (t) {
        log.append(h('li', { class: `jeu-log-${t.cls}` }, h('span', { class: 'jeu-log-icon', 'aria-hidden': 'true' }, t.icon), h('span', {}, t.text)));
        announce(t.text);
      }
      if (e.type === 'move') {
        await board.move(e.player, e.from, e.to, { jump: ['pont', 'nuage', 'carte', 'cadeau'].includes(e.reason) });
        await wait(120);
      }
      if (e.type === 'eclat') { refresh(); burstStars(playersList.querySelector(`[data-player="${e.player}"]`), 2); await wait(300); }
      if (e.type === 'arrivee') { confetti(board.el, 60); await wait(600); }
      refresh();
    }
  }

  function turnHeader(p, sub) {
    return h('div', { class: 'jeu-turn-head' },
      p.kind === 'photon' ? photon('curieux', 54) : h('span', { class: 'avatar avatar--l', style: { background: p.color }, 'aria-hidden': 'true' }, p.symbol),
      h('div', {}, h('p', { class: 'eyebrow' }, `Tour ${game.round}`), h('h2', { tabindex: '-1' }, p.kind === 'photon' ? 'Photon joue' : `À toi, ${p.name} !`), sub ? h('p', { class: 'small muted' }, sub) : null));
  }

  async function beginTurn() {
    if (stopped) return;
    board.target(null); refresh();
    if (game.over) { finale(); return; }
    const p = currentPlayer(game);
    if (p.kind === 'photon') { photonTurn(p); return; }
    const d = die(1);
    const head = turnHeader(p, `${levelLabel(p.level)} · ${subjectText(p.subject)}`);
    if (game.pending) { // partie reprise : le dé était déjà lancé
      turnBox.replaceChildren(head);
      askQuestion(p, head);
      return;
    }
    const btn = h('button', { type: 'button', class: 'btn btn--primary jeu-roll' }, h('span', { 'aria-hidden': 'true' }, '🎲 '), 'Lancer le dé');
    turnBox.replaceChildren(h('section', { class: 'card jeu-turn-card enter-fwd' }, head, h('div', { class: 'jeu-roll-zone' }, d.el, btn),
      h('p', { class: 'small muted' }, p.pos === 0 ? 'Tous les pions partent du départ.' : `Ton pion est sur la case ${p.pos}.`)));
    btn.focus({ preventScroll: true });
    btn.addEventListener('click', async () => {
      if (btn.disabled) return;
      btn.disabled = true;
      const pend = startTurn(game, Math.random);
      save();
      await d.roll(pend.roll);
      if (stopped) return;
      board.target(pend.target);
      announce(`Dé : ${pend.roll}. Case visée : ${pend.target}.`);
      await wait(350);
      turnBox.replaceChildren(head);
      askQuestion(p, head);
    });
  }

  async function askQuestion(p, head) {
    const pend = game.pending;
    const c = caseAt(game, pend.target);
    board.target(pend.target);
    const intro = h('div', { class: 'jeu-question-intro' },
      pend.roll ? h('span', { class: 'jeu-die-mini', 'aria-label': `Dé : ${pend.roll}` }, die(pend.roll).el) : null,
      h('div', {},
        h('p', { class: 'jeu-question-kind' }, QUESTION_LABELS[pend.phase === 'question' ? pend.question : pend.phase] || 'Question', ' ', caseBadge(c, game.board.n)),
        h('p', { class: 'small' }, questionIntro(game, pend, p))));
    const slot = h('div', { class: 'jeu-ex-slot' }, h('p', { class: 'muted' }, 'Je tire une question…'));
    turnBox.replaceChildren(h('section', { class: 'card jeu-turn-card' }, head, intro), slot);
    takeHand(p);
    const kind = pend.question === 'defi' ? 'defi' : pend.question === 'revision' ? 'revision' : 'classe';
    let q = null;
    try { q = await decks.get(p.id).draw(kind); } catch { q = null; }
    if (stopped) return;
    if (!q) {
      release();
      slot.replaceChildren(h('div', { class: 'card warn' }, h('p', {}, 'Aucune question disponible pour cette classe et cette matière : elle est offerte.'),
        h('button', { type: 'button', class: 'btn btn--primary', onclick: () => resolve(p, { stars: 1 }) }, 'Déplacer mon pion →')));
      return;
    }
    slot.replaceChildren(h('p', { class: 'jeu-ex-meta small muted' }, `${subjLabel(q.subject)} · ${levelLabel(p.level)}${q.track !== 'classe' ? ' · approfondissement' : ''}`));
    const exSlot = h('div', {});
    slot.append(exSlot);
    const loupe = p.loupe;
    current = mountExercise(exSlot, {
      def: q.def, seed: q.seed, lessonId: q.lessonId, context: 'jeu:plateau', record: p.kind === 'profil',
      nextLabel: 'Déplacer mon pion →',
      onNext: (diag, out) => resolve(p, { stars: gameStars({ verdict: diag ? diag.verdict : null, tries: out.tries, hintsUsed: out.hintsUsed, solutionShown: out.solutionShown, answerRevealed: out.answerRevealed }, { loupe }) }),
    });
    // au clavier : on peut répondre tout de suite après avoir lancé le dé
    const first = exSlot.querySelector('.ex-answer input, .ex-answer textarea, .ex-answer select, .ex-answer [tabindex="0"], .ex-answer button');
    if (first && first.focus) first.focus({ preventScroll: true });
  }

  async function resolve(p, res) {
    if (stopped) return;
    if (current) { current.destroy(); current = null; }
    release();
    const pend = game.pending;
    const events = answer(game, res, Math.random);
    save();
    const log = h('ol', { class: 'jeu-log', 'aria-label': 'Ce qui se passe' });
    const head = turnHeader(p);
    turnBox.replaceChildren(h('section', { class: 'card jeu-turn-card enter-fwd' }, head, log));
    const rect = board.el.getBoundingClientRect();
    if (rect.bottom < 60 || rect.top > window.innerHeight - 60) board.el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
    await showEvents(log, events, pend);
    if (stopped) return;
    if (game.pending) {
      const more = h('button', { type: 'button', class: 'btn btn--primary' }, game.pending.phase === 'rattrapage' ? 'Question de rattrapage →' : 'Question cadeau →');
      more.addEventListener('click', () => askQuestion(p, turnHeader(p)), { once: true });
      log.after(h('div', { class: 'btn-row jeu-next' }, more));
      more.focus({ preventScroll: true });
      return;
    }
    finishTurn(log);
  }

  function finishTurn(log) {
    const res = endTurn(game);
    save();
    board.target(null); refresh();
    if (game.over) { const b = h('button', { type: 'button', class: 'btn btn--primary', onclick: () => finale() }, 'Voir le classement →'); log.after(h('div', { class: 'btn-row jeu-next' }, b)); b.focus({ preventScroll: true }); return; }
    const next = currentPlayer(game);
    const label = res.same ? (game.players.length > 1 ? 'Rejouer (carte Miroir) →' : 'Tour suivant →') : next.kind === 'photon' ? 'Au tour de Photon →' : `C’est à ${next.name} →`;
    const b = h('button', { type: 'button', class: 'btn btn--primary', onclick: () => beginTurn() }, label);
    log.after(h('div', { class: 'btn-row jeu-next' }, b));
    b.focus({ preventScroll: true });
  }

  async function photonTurn(p) {
    const d = die(1);
    const log = h('ol', { class: 'jeu-log', 'aria-label': 'Ce que fait Photon' });
    turnBox.replaceChildren(h('section', { class: 'card jeu-turn-card enter-fwd' }, turnHeader(p, (PHOTON_LEVELS[p.photonLevel] || PHOTON_LEVELS.malin).label), h('div', { class: 'jeu-roll-zone' }, d.el), log));
    const pend = game.pending || startTurn(game, Math.random);
    save();
    if (pend.roll) await d.roll(pend.roll);
    if (stopped) return;
    board.target(pend.target);
    const c = caseAt(game, pend.target);
    if (pend.roll) {
      log.append(h('li', {}, h('span', { class: 'jeu-log-icon', 'aria-hidden': 'true' }, '🎲'), h('span', {}, `Photon fait ${pend.roll} et vise ${c.type === 'arrivee' ? 'le Prisme' : `la case ${pend.target}`}${['normale', 'arrivee'].includes(c.type) ? '' : ` (${CASE_TYPES[c.type].label})`}.`)));
      announce(`Photon fait ${pend.roll}.`);
    }
    for (let guard = 0; game.pending && guard < 4; guard++) {
      await wait(650);
      if (stopped) return;
      log.append(h('li', { class: 'muted' }, h('span', { class: 'jeu-log-icon', 'aria-hidden': 'true' }, '…'), h('span', {}, `Photon réfléchit${game.pending.phase === 'question' ? '' : ` (${QUESTION_LABELS[game.pending.phase]})`}…`)));
      await wait(900);
      if (stopped) return;
      const before = game.pending;
      const events = answer(game, photonResult(game, Math.random), Math.random);
      save();
      await showEvents(log, events, before);
    }
    if (stopped) return;
    finishTurn(log);
  }

  /**
   * Récompenses de la partie, une fois : chaque profil qui a répondu juste au moins 3 fois gagne les points de la
   * partie ; le premier du classement (s'il y avait un adversaire) gagne aussi une victoire et une vignette rare.
   */
  async function rewardPlayers(rk) {
    const out = [];
    if (game.rewarded) return out;
    game.rewarded = true;
    const id = String(game.startedAt || 'partie');
    for (const p of game.players.filter((x) => x.kind === 'profil' && x.stats.ok >= 3)) {
      takeHand(p);
      const before = gameProgress();
      await recordGameEvent('plateau', `${id}:${p.profileId}`).catch(() => {});
      if (rk[0] === p && game.players.length > 1) await recordGameEvent('victoire', `${id}:${p.profileId}`).catch(() => {});
      const after = gameProgress();
      out.push({ p, points: before && after ? after.totalXp - before.totalXp : 0, vignettes: newVignettes(before, after), won: rk[0] === p && game.players.length > 1 });
      release();
    }
    return out;
  }

  async function finale() {
    const rk = ranking(game);
    const rewards = await rewardPlayers(rk);
    release();
    store.sharedPlay = false;
    useContext(host);
    setSetting(SAVE_KEY, null).catch(() => {});
    board.target(null); refresh();
    const recorded = game.players.filter((p) => p.kind === 'profil').map((p) => p.name);
    const winner = rk[0];
    turnBox.replaceChildren(h('section', { class: 'card jeu-finale enter-fwd' },
      h('div', { class: 'jeu-turn-head' }, photon('bravo', 64), h('div', {}, h('p', { class: 'eyebrow' }, `Partie terminée · ${game.round} tour${game.round > 1 ? 's' : ''}`),
        h('h2', { tabindex: '-1' }, winner.kind === 'photon' ? 'Photon gagne… la revanche ?' : `Bravo ${winner.name} !`))),
      h('ol', { class: 'jeu-podium' }, rk.map((p, k) => h('li', { class: `podium-${k + 1}` },
        h('span', { class: 'podium-rank' }, rankLabel(k + 1)),
        h('span', { class: 'avatar', style: { background: p.color }, 'aria-hidden': 'true' }, p.symbol),
        h('span', { class: 'podium-name' }, h('strong', {}, p.name), h('span', { class: 'small muted' }, p.finished ? 'dans le Prisme' : `case ${p.pos}`)),
        h('span', { class: 'podium-stats small' }, `✦ ${p.eclats} éclat${p.eclats > 1 ? 's' : ''} · réussies : ${p.stats.ok}/${p.stats.questions}${p.stats.perfect ? ` · ${p.stats.perfect} du premier coup` : ''}`)))),
      rewards.length ? h('div', { class: 'jeu-rewards' }, h('h3', {}, '🎁 Récompenses'),
        h('ul', {}, rewards.map((r) => h('li', {}, h('strong', {}, r.p.name), ` : +${r.points} points${r.won ? ' (victoire)' : ''}`,
          r.vignettes.length ? h('div', { class: 'jeu-reward-cards' }, r.vignettes.map((v) => vignetteCard(v, { isNew: true }))) : null)))) : null,
      game.players.some((p) => p.kind === 'profil' && p.stats.ok < 3) ? h('p', { class: 'small muted' }, 'Les points de la partie se gagnent avec au moins trois bonnes réponses.') : null,
      recorded.length ? h('p', { class: 'small muted' }, `Les réponses de ${recorded.join(', ')} sont enregistrées dans ${recorded.length > 1 ? 'leurs profils' : 'son profil'} : elles comptent dans la carte et le carnet.`) : null,
      h('div', { class: 'btn-row' },
        h('button', { type: 'button', class: 'btn btn--primary', onclick: () => onReplay(game.setup) }, 'Rejouer (nouveau plateau)'),
        h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => onNew(game.setup) }, 'Changer les joueurs'),
        h('a', { class: 'btn btn--ghost', href: '#/carnet' }, 'Mon carnet'))));
    confetti(turnBox, 90);
    announce(`Partie terminée. ${rk.map((p, k) => `${rankLabel(k + 1)} : ${p.name}`).join(', ')}.`);
    const t = turnBox.querySelector('h2'); if (t) t.focus({ preventScroll: true });
  }

  refresh();
  beginTurn();
}

/* ------------------------------ Vue ------------------------------ */

export async function render(root) {
  const host = activeContext();
  let stopper = null;
  const stage = h('div', { class: 'jeu-stage' });
  root.classList.add('jeu-view');
  // pendant la partie, l'en-tête se fait discret : le plateau et la question restent visibles ensemble
  const playing = (on) => root.classList.toggle('is-playing', on);
  root.append(h('div', { class: 'page-head jeu-head' },
    h('div', {}, h('p', { class: 'eyebrow' }, 'Jeu de plateau'), h('h1', {}, 'La traversée du Prisme'),
      h('p', { class: 'muted' }, 'Lance le dé, réponds à la question de la case et fais avancer ton pion jusqu’au Prisme. Jusqu’à 4 joueurs sur le même ordinateur, chacun avec les questions de sa classe.')),
    h('div', { class: 'btn-row' }, h('a', { class: 'btn', href: '#/memoire' }, h('span', { 'aria-hidden': 'true' }, '🃏 '), 'Jeu de mémoire'),
      h('a', { class: 'btn', href: '#/frise' }, h('span', { 'aria-hidden': 'true' }, '⏳ '), 'Frise chronologique'),
      h('a', { class: 'btn', href: '#/eclair' }, h('span', { 'aria-hidden': 'true' }, '⚡ '), 'Calcul éclair'),
      h('div', { class: 'jeu-head-art', 'aria-hidden': 'true' }, die(5).el, photon('joie', 52)))), stage);

  const stop = () => { if (stopper) { stopper(); stopper = null; } };
  const toSetup = (prefill) => {
    stop(); store.sharedPlay = false; useContext(host); playing(false);
    setupScreen(stage, { onStart: launch, prefill });
  };
  const run = (game) => {
    stop();
    window.scrollTo({ top: 0 });
    playing(true);
    play(stage, game, { host, onReplay: launch, onNew: toSetup, setStopper: (fn) => { stopper = fn; } });
  };
  function launch(setup) {
    const players = distinctPawns(setup.players.map((p, k) => ({ ...p, id: `j${k + 1}`, name: p.kind === 'photon' ? 'Photon' : p.name })));
    const game = newGame({ players, size: setup.size, rand: Math.random });
    game.startedAt = Date.now();
    game.setup = setup;
    setSetting(SAVE_KEY, game).catch(() => {});
    run(game);
  }

  const saved = await getSetting(SAVE_KEY, null).catch(() => null);
  const resumable = saved && saved.version === 1 && !saved.over && Array.isArray(saved.players) && saved.board && saved.setup;
  if (resumable) {
    const where = (p) => (p.finished ? 'dans le Prisme' : p.pos ? `case ${p.pos}` : 'au départ');
    stage.replaceChildren(h('section', { class: 'card jeu-resume' },
      h('h2', {}, 'Une partie est en cours'),
      h('p', {}, `Tour ${saved.round} · ${saved.players.map((p) => `${p.name} (${where(p)})`).join(', ')}.`),
      h('div', { class: 'btn-row' },
        h('button', { type: 'button', class: 'btn btn--primary', onclick: () => run(saved) }, 'Reprendre la partie'),
        h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => { setSetting(SAVE_KEY, null).catch(() => {}); toSetup(saved.setup); } }, 'Abandonner et en commencer une autre'))),
    rulesCard(false));
  } else setupScreen(stage, { onStart: launch });

  return () => { stop(); store.sharedPlay = false; useContext(host); };
}
