/**
 * Jeu de mémoire (paires) : des cartes face cachée, chaque paire associe deux éléments qui vont ensemble (un mot et
 * son contraire, un pays et sa capitale, un instrument et sa famille…). On retourne deux cartes ; si elles forment une
 * paire, elles restent visibles (et, à deux joueurs, le joueur rejoue) ; sinon elles se retournent et la main passe.
 *
 * Fonctions pures. L'état est un petit objet, modifié sur place.
 */

/**
 * @param {Array<{ a: string, b: string }>} pairs les paires (côtés a et b)
 * @param {{ players?: string[], rand?: Function }} opts
 */
export function newMemory(pairs, { players = ['Joueur'], rand = Math.random } = {}) {
  const cards = [];
  pairs.forEach((p, i) => { cards.push({ id: `c${i}a`, pair: i, side: 'a', label: p.a }); cards.push({ id: `c${i}b`, pair: i, side: 'b', label: p.b }); });
  for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; }
  return {
    version: 1, cards: cards.map((c) => ({ ...c, found: false, by: null })), up: [], tries: 0,
    players: players.map((name) => ({ name, pairs: 0 })), turn: 0, last: null,
  };
}

export const pairCount = (m) => m.cards.length / 2;
export const isOver = (m) => m.cards.every((c) => c.found);

/**
 * Retourne une carte. Renvoie ce qui se passe : 'ignore' (carte déjà visible ou deux cartes déjà retournées),
 * 'first' (première carte), 'pair' (deuxième carte, paire trouvée) ou 'miss' (deuxième carte, pas une paire :
 * il faudra appeler hideMiss avant de continuer).
 */
export function flip(m, cardId) {
  const c = m.cards.find((x) => x.id === cardId);
  if (!c || c.found || m.up.includes(cardId) || m.up.length >= 2) return 'ignore';
  m.up.push(cardId);
  if (m.up.length === 1) return 'first';
  m.tries++;
  const [x, y] = m.up.map((id) => m.cards.find((k) => k.id === id));
  if (x.pair === y.pair && x.side !== y.side) {
    x.found = true; y.found = true; x.by = m.turn; y.by = m.turn;
    m.players[m.turn].pairs++;
    m.up = []; m.last = { kind: 'pair', pair: x.pair, player: m.turn };
    return 'pair';
  }
  m.last = { kind: 'miss', player: m.turn };
  return 'miss';
}

/** Après une erreur : les deux cartes se retournent, la main passe au joueur suivant. */
export function hideMiss(m) {
  if (m.up.length < 2) return;
  m.up = [];
  m.turn = (m.turn + 1) % m.players.length;
}

/** Étoiles d'une partie en solo, d'après le nombre d'essais : la mémoire parfaite trouve tout en peu d'essais. */
export function memoryStars(m) {
  const n = pairCount(m);
  if (m.tries <= Math.ceil(n * 1.5)) return 3;
  if (m.tries <= n * 2 + 2) return 2;
  return 1;
}

/** Classement final (à plusieurs) : ex aequo possibles. */
export function memoryWinners(m) {
  const best = Math.max(...m.players.map((p) => p.pairs));
  return m.players.map((p, i) => ({ ...p, index: i })).filter((p) => p.pairs === best);
}

/**
 * Réunit des paires distinctes (ni deux fois le même côté a, ni deux fois le même côté b), jusqu'à `count`.
 * @param {Array<{a,b}>} candidates
 */
export function distinctPairs(candidates, count) {
  const out = []; const as = new Set(); const bs = new Set();
  for (const p of candidates) {
    const a = String(p.a).trim(); const b = String(p.b).trim();
    if (!a || !b || as.has(a.toLowerCase()) || bs.has(b.toLowerCase()) || a.toLowerCase() === b.toLowerCase()) continue;
    as.add(a.toLowerCase()); bs.add(b.toLowerCase());
    out.push({ a, b });
    if (out.length >= count) break;
  }
  return out;
}
