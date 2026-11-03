/**
 * Jeu de plateau « La traversée du Prisme » : règles pures, sans interface ni stockage (testées sous Node).
 *
 * Principe : à son tour, le joueur lance le dé ; la case visée (position + dé) décide de la question.
 * Réussie, le pion y va ; réussie du premier coup sans indice, il gagne aussi un éclat de lumière.
 * Ratée, il avance quand même d'une case (il a lu la correction). Cases spéciales à l'arrivée :
 * arc-en-ciel (raccourci), nuage (question de rattrapage, sinon on glisse), carte Lumière (surprise).
 * Le premier qui entre dans le Prisme (dernière case, sur une bonne réponse) déclenche le dernier tour :
 * chacun joue autant de tours, puis on classe (arrivée, position, éclats).
 *
 * L'état de la partie est un objet JSON simple : il peut être sauvegardé puis repris.
 */

export const BOARD_SIZES = {
  courte: { cases: 23, label: 'Courte', detail: '≈ 7 questions chacun' },
  normale: { cases: 31, label: 'Normale', detail: '≈ 10 questions chacun' },
  longue: { cases: 47, label: 'Longue', detail: '≈ 15 questions chacun' },
};

export const COLUMNS = 8; // plateau en serpentin : 8 cases par rangée (taille + 1 = multiple de 8)

/** question : genre de question posée quand cette case est visée. */
export const CASE_TYPES = {
  depart: { icon: '⌂', label: 'Départ', question: null, help: 'Tous les pions partent d’ici.' },
  normale: { icon: '', label: 'Case lumière', question: 'classe', help: 'Une question du niveau de ta classe.' },
  defi: { icon: '◆', label: 'Défi', question: 'defi', help: 'Une question plus exigeante. Réussie : 2 éclats de lumière.' },
  revision: { icon: '↻', label: 'Révision', question: 'revision', help: 'Une notion à consolider, choisie d’après tes erreurs. Réussie : 1 éclat.' },
  carte: { icon: '✧', label: 'Carte Lumière', question: 'classe', help: 'Arrivé ici, tu pioches une carte Lumière.' },
  pont: { icon: '⤴', label: 'Arc-en-ciel', question: 'classe', help: 'Arrivé ici, tu files par l’arc-en-ciel jusqu’à une case plus loin.' },
  nuage: { icon: '☁', label: 'Nuage', question: 'classe', help: 'Arrivé ici, une question de rattrapage : ratée, tu glisses en arrière.' },
  arrivee: { icon: '△', label: 'Le Prisme', question: 'finale', help: 'La dernière case : on y entre seulement avec une bonne réponse.' },
};

export const QUESTION_LABELS = {
  classe: 'Question', defi: 'Défi ◆', revision: 'Révision ↻', finale: 'Question finale', rattrapage: 'Rattrapage ☁', bonus: 'Question cadeau ✧',
};

/** Cartes Lumière : surtout des bonus ; leurs déplacements ne déclenchent pas les cases spéciales. */
export const CARDS = {
  vent: { icon: '➶', label: 'Vent solaire', text: 'Avance de 2 cases.', weight: 3 },
  miroir: { icon: '◐', label: 'Miroir', text: 'Rejoue tout de suite.', weight: 2 },
  loupe: { icon: '⌕', label: 'Loupe', text: 'À ta prochaine question, le premier indice est gratuit : il ne te retire pas d’étoile.', weight: 2 },
  bouclier: { icon: '⛉', label: 'Bouclier', text: 'Garde-le : il te protège du prochain nuage.', weight: 2 },
  arc: { icon: '✦', label: 'Éclat', text: 'Gagne un éclat de lumière.', weight: 2 },
  eclipse: { icon: '◑', label: 'Éclipse', text: 'Tous les autres joueurs reculent d’une case.', weight: 1 },
  etoile: { icon: '☄', label: 'Étoile filante', text: 'File jusqu’à la prochaine case Défi ◆.', weight: 1 },
  cadeau: { icon: '✉', label: 'Question cadeau', text: 'Réponds à une question bonus : réussie, tu avances de 3 cases.', weight: 2 },
};

/** Photon, l'adversaire de l'ordinateur : probabilité de réussir selon son niveau et la question. */
export const PHOTON_LEVELS = {
  tranquille: { label: 'Photon tranquille', p: 0.55 },
  malin: { label: 'Photon malin', p: 0.7 },
  rapide: { label: 'Photon foudroyant', p: 0.85 },
};

const shuffle = (rand, arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

export const rollDie = (rand) => 1 + Math.floor(rand() * 6);

/**
 * Plateau : cases 0 (départ) à n (le Prisme). Par blocs de 6 cases : une carte, un défi ou une révision
 * (en alternance), le reste en cases lumière ; puis des arcs-en-ciel dans les deux premiers tiers
 * et des nuages dans la seconde moitié. Les deux premières et la dernière avant le Prisme restent simples.
 */
export function createBoard(sizeId, rand) {
  const n = (BOARD_SIZES[sizeId] || BOARD_SIZES.normale).cases;
  const types = Array.from({ length: n + 1 }, () => 'normale');
  types[0] = 'depart'; types[n] = 'arrivee';
  let alt = 0;
  for (let start = 3; start <= n - 2; start += 6) {
    const block = [];
    for (let i = start; i < Math.min(start + 6, n - 1); i++) block.push(i);
    if (block.length < 3) break;
    const picks = shuffle(rand, block);
    types[picks[0]] = 'carte';
    types[picks[1]] = alt++ % 2 === 0 ? 'defi' : 'revision';
    if (block.length >= 5) types[picks[2]] = alt % 2 === 0 ? 'defi' : 'revision';
  }
  const cases = types.map((type, i) => ({ i, type }));
  const free = (i) => i > 1 && i < n - 1 && cases[i].type === 'normale';
  const count = Math.max(1, Math.floor(n / 16));
  const place = (type, from, to, jump) => {
    const spots = shuffle(rand, Array.from({ length: Math.max(0, to - from) }, (_, k) => from + k).filter(free));
    let placed = 0;
    for (const i of spots) {
      if (placed >= count) break;
      const target = jump(i);
      // la case d'arrivée d'un arc-en-ciel ou d'un nuage est une case sans effet de déplacement
      if (target <= 0 || target >= n || ['pont', 'nuage'].includes(cases[target].type) || cases.some((c) => c.to === i)) continue;
      cases[i] = { i, type, to: target };
      placed++;
    }
  };
  place('pont', 3, Math.floor((n * 2) / 3), (i) => i + 4 + Math.floor(rand() * 3));
  place('nuage', Math.ceil(n / 2), n - 1, (i) => i - 4 - Math.floor(rand() * 2));
  return { size: sizeId, n, cases };
}

/** Position (colonne, rangée) d'une case sur le serpentin, la rangée 0 en bas (départ en bas à gauche). */
export function caseCell(i, cols = COLUMNS) {
  const row = Math.floor(i / cols);
  const k = i % cols;
  return { row, col: row % 2 === 0 ? k : cols - 1 - k };
}

function makeDeck(rand) {
  return shuffle(rand, Object.entries(CARDS).flatMap(([id, c]) => Array.from({ length: c.weight }, () => id)));
}

/**
 * players : [{ id, name, kind: 'profil'|'invite'|'photon', color, symbol, level?, subject?, photonLevel? }]
 */
export function newGame({ players, size = 'normale', rand }) {
  if (!players || !players.length || players.length > 4) throw new Error('De 1 à 4 joueurs.');
  return {
    version: 1,
    board: createBoard(size, rand),
    players: players.map((p) => ({
      ...p, pos: 0, eclats: 0, shield: false, loupe: false, finished: null,
      stats: { questions: 0, ok: 0, perfect: 0, stars: 0 },
    })),
    turn: 0, round: 1, lastRound: null, extraTurn: false,
    pending: null, // { roll, target, question } : dé lancé, question pas encore répondue (gardé à la reprise)
    deck: makeDeck(rand), arrivals: 0, over: false, startedAt: null,
  };
}

export const currentPlayer = (g) => g.players[g.turn];
export const caseAt = (g, i) => g.board.cases[Math.max(0, Math.min(g.board.n, i))];

/** Lance le dé pour le joueur courant ; la case visée décide de la question. */
export function startTurn(g, rand) {
  if (g.over) throw new Error('Partie terminée.');
  if (g.pending) return g.pending; // déjà lancé (reprise d'une partie) : pas de second lancer
  const p = currentPlayer(g);
  const roll = rollDie(rand);
  const target = Math.min(g.board.n, p.pos + roll);
  g.pending = { roll, target, question: CASE_TYPES[caseAt(g, target).type].question || 'classe', phase: 'question' };
  return g.pending;
}

/** Étoiles comptées dans le jeu : la carte Loupe rend le premier indice gratuit. */
export function gameStars({ verdict, tries = 1, hintsUsed = 0, solutionShown = false }, { loupe = false } = {}) {
  if (!verdict || solutionShown) return 0;
  if (verdict === 'a-valider' || verdict === 'incertain') return 2;
  if (verdict !== 'correct') return 0;
  const hints = Math.max(0, hintsUsed - (loupe ? 1 : 0));
  if (tries <= 1 && hints === 0) return 3;
  if (tries <= 2 && hints <= 1) return 2;
  return 1;
}

function arrive(g, p, events) {
  if (p.pos >= g.board.n && p.finished === null) {
    p.finished = ++g.arrivals;
    events.push({ type: 'arrivee', player: p.id, rank: p.finished });
    if (g.lastRound === null) g.lastRound = g.round;
  }
}

/** Déplacement « doux » (cartes) : sans effet de case, et le Prisme se gagne seulement par une bonne réponse. */
function slide(g, p, to, events, reason) {
  const from = p.pos;
  const cap = p.finished ? g.board.n : g.board.n - 1;
  p.pos = Math.max(0, Math.min(cap, to));
  if (p.pos !== from) events.push({ type: 'move', player: p.id, from, to: p.pos, reason });
}

function drawCard(g, rand) {
  if (!g.deck.length) g.deck = makeDeck(rand);
  return g.deck.shift();
}

function applyCard(g, p, id, events) {
  events.push({ type: 'carte', player: p.id, card: id });
  switch (id) {
    case 'vent': slide(g, p, p.pos + 2, events, 'carte'); break;
    case 'miroir': g.extraTurn = true; break;
    case 'loupe': p.loupe = true; break;
    case 'bouclier': p.shield = true; break;
    case 'arc': p.eclats += 1; events.push({ type: 'eclat', player: p.id, n: 1 }); break;
    case 'eclipse':
      for (const o of g.players) if (o !== p && !o.finished && o.pos > 0) slide(g, o, o.pos - 1, events, 'eclipse');
      break;
    case 'etoile': {
      const next = g.board.cases.find((c) => c.i > p.pos && c.i < g.board.n && c.type === 'defi');
      slide(g, p, next ? next.i : p.pos + 2, events, 'carte');
      break;
    }
    case 'cadeau': g.pending = { roll: 0, target: p.pos, question: 'bonus', phase: 'bonus' }; break;
    default: break;
  }
}

/** Effets de la case où le pion vient d'arriver (après une question). */
function landing(g, p, events, rand) {
  const c = caseAt(g, p.pos);
  if (c.type === 'pont') {
    const from = p.pos;
    p.pos = c.to;
    events.push({ type: 'move', player: p.id, from, to: c.to, reason: 'pont' });
  } else if (c.type === 'nuage') {
    if (p.shield) { p.shield = false; events.push({ type: 'bouclier', player: p.id }); } else g.pending = { roll: 0, target: p.pos, question: 'rattrapage', phase: 'rattrapage' };
  } else if (c.type === 'carte') {
    applyCard(g, p, drawCard(g, rand), events);
  }
}

/**
 * Applique la réponse à la question en cours. result : { stars } (0 à 3 ; 0 = ratée).
 * Renvoie la liste des évènements à animer ; `g.pending` reste défini si une autre question suit
 * (rattrapage d'un nuage, question cadeau).
 */
export function answer(g, result, rand) {
  const pend = g.pending;
  if (!pend) throw new Error('Aucune question en cours.');
  const p = currentPlayer(g);
  const stars = Math.max(0, Math.min(3, Number(result.stars) || 0));
  const ok = stars >= 1;
  const events = [];
  p.loupe = false; // la loupe sert une fois, réussie ou non
  p.stats.questions += 1;
  if (ok) { p.stats.ok += 1; p.stats.stars += stars; }
  if (stars === 3) p.stats.perfect += 1;
  g.pending = null;
  events.push({ type: 'verdict', player: p.id, ok, stars, question: pend.question });

  if (pend.phase === 'rattrapage') {
    if (!ok) {
      const from = p.pos; p.pos = caseAt(g, p.pos).to;
      events.push({ type: 'move', player: p.id, from, to: p.pos, reason: 'nuage' });
    } else events.push({ type: 'tenu', player: p.id });
    return events;
  }
  if (pend.phase === 'bonus') {
    if (ok) slide(g, p, p.pos + 3, events, 'cadeau');
    return events;
  }

  let gain = stars === 3 ? 1 : 0;
  if (ok && pend.question === 'defi') gain += 2;
  if (ok && pend.question === 'revision') gain += 1;
  if (gain) { p.eclats += gain; events.push({ type: 'eclat', player: p.id, n: gain }); }

  const from = p.pos;
  const to = ok ? pend.target : Math.min(p.pos + 1, g.board.n - 1);
  p.pos = to;
  if (to !== from) events.push({ type: 'move', player: p.id, from, to, reason: ok ? 'reussite' : 'petit-pas' });
  arrive(g, p, events);
  if (!p.finished) landing(g, p, events, rand);
  return events;
}

/** Fin du tour : joueur suivant (Miroir = rejouer), fin de partie après le dernier tour complet. */
export function endTurn(g) {
  if (g.pending) throw new Error('Une question est encore en cours.');
  const p = currentPlayer(g);
  if (g.extraTurn && !p.finished) { g.extraTurn = false; return { same: true }; }
  g.extraTurn = false;
  const n = g.players.length;
  let idx = g.turn;
  for (let step = 0; step < n; step++) {
    idx += 1;
    if (idx >= n) {
      // fin du tour de table : si quelqu'un est entré dans le Prisme pendant ce tour, la partie s'arrête
      idx = 0;
      if (g.lastRound !== null) { g.over = true; return { over: true }; }
      g.round += 1;
    }
    if (!g.players[idx].finished) { const same = idx === g.turn; g.turn = idx; return { same }; }
  }
  g.over = true;
  return { over: true };
}

/** Tour automatique de Photon : il lance le dé et « répond » selon son niveau. */
export function photonResult(g, rand) {
  const p = currentPlayer(g);
  const base = (PHOTON_LEVELS[p.photonLevel] || PHOTON_LEVELS.malin).p;
  const q = g.pending ? g.pending.question : 'classe';
  const pr = q === 'defi' ? base - 0.15 : q === 'rattrapage' ? base - 0.05 : base;
  const ok = rand() < pr;
  return { stars: ok ? (rand() < 0.55 ? 3 : 2) : 0 };
}

/** Classement : arrivés d'abord (dans l'ordre), puis position, puis éclats. */
export function ranking(g) {
  return g.players.slice().sort((a, b) => {
    if (a.finished && b.finished) return a.finished - b.finished;
    if (a.finished || b.finished) return a.finished ? -1 : 1;
    return b.pos - a.pos || b.eclats - a.eclats || b.stats.ok - a.stats.ok;
  });
}
