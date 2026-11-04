/** Jeu de mémoire : distribution, paires, tours à deux joueurs, étoiles, points une fois par jour. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
const W = new URL('../../js/', import.meta.url).href;
const M = await import(W + 'engine/memoire.js');
const G = await import(W + 'engine/game.js');

const PAIRS = [{ a: 'grand', b: 'petit' }, { a: 'chaud', b: 'froid' }, { a: 'jour', b: 'nuit' }, { a: 'vide', b: 'plein' }, { a: 'haut', b: 'bas' }, { a: 'vite', b: 'lent' }];
const card = (m, pair, side) => m.cards.find((c) => c.pair === pair && c.side === side).id;

test('distribution : deux cartes par paire, mélangées', () => {
  const m = M.newMemory(PAIRS, { rand: () => 0.3 });
  assert.equal(m.cards.length, 12);
  assert.equal(M.pairCount(m), 6);
  assert.equal(new Set(m.cards.map((c) => c.id)).size, 12);
  assert.ok(!M.isOver(m));
});

test('une paire trouvée reste visible ; une erreur se retourne et passe la main', () => {
  const m = M.newMemory(PAIRS, { players: ['Léa', 'Tom'], rand: Math.random });
  assert.equal(M.flip(m, card(m, 0, 'a')), 'first');
  assert.equal(M.flip(m, card(m, 0, 'a')), 'ignore', 'même carte');
  assert.equal(M.flip(m, card(m, 0, 'b')), 'pair');
  assert.equal(m.players[0].pairs, 1);
  assert.equal(m.turn, 0, 'une paire : on rejoue');
  assert.equal(M.flip(m, card(m, 0, 'a')), 'ignore', 'carte trouvée');
  M.flip(m, card(m, 1, 'a'));
  assert.equal(M.flip(m, card(m, 2, 'b')), 'miss');
  assert.equal(M.flip(m, card(m, 3, 'a')), 'ignore', 'deux cartes déjà retournées');
  M.hideMiss(m);
  assert.equal(m.turn, 1, 'raté : la main passe');
  assert.deepEqual(m.up, []);
  assert.equal(m.tries, 2);
});

test('partie complète : étoiles et gagnants', () => {
  const m = M.newMemory(PAIRS.slice(0, 4), { rand: Math.random });
  for (let i = 0; i < 4; i++) { M.flip(m, card(m, i, 'a')); M.flip(m, card(m, i, 'b')); }
  assert.ok(M.isOver(m));
  assert.equal(m.tries, 4);
  assert.equal(M.memoryStars(m), 3);
  const n = M.newMemory(PAIRS.slice(0, 4), { rand: Math.random }); n.tries = 20; n.cards.forEach((c) => { c.found = true; });
  assert.equal(M.memoryStars(n), 1);
  const duo = M.newMemory(PAIRS.slice(0, 2), { players: ['A', 'B'] });
  duo.players[0].pairs = 1; duo.players[1].pairs = 1;
  assert.equal(M.memoryWinners(duo).length, 2, 'égalité');
});

test('paires distinctes : pas de doublon d’un côté ou de l’autre', () => {
  const ps = M.distinctPairs([{ a: '1789', b: 'Bastille' }, { a: '1789', b: 'autre' }, { a: 'x', b: 'Bastille' }, { a: 'y', b: 'y' }, { a: 'z', b: 'w' }], 5);
  assert.deepEqual(ps, [{ a: '1789', b: 'Bastille' }, { a: 'z', b: 'w' }]);
});

test('points du jeu de mémoire : 10, une fois par jour', () => {
  assert.equal(G.XP.memoire, 10);
  let game = G.withEvent(G.normalizeGame({}), 'memoire', '2026-11-04', 1);
  game = G.withEvent(game, 'memoire', '2026-11-04', 2);
  game = G.withEvent(game, 'memoire', '2026-11-05', 3);
  const g = G.computeGame([], game, 4);
  assert.equal(g.counters.memoires, 2);
  assert.equal(g.totalXp, 20);
  assert.ok(g.trophies.find((t) => t.id === 'memoire-1').earned);
});
