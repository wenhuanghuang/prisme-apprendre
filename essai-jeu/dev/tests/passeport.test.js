/** Passeport des jeux : tampons de la semaine (lundi → dimanche), quatre jeux différents, coffre rare une fois par semaine. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
const W = new URL('../../js/', import.meta.url).href;
const P = await import(W + 'engine/passeport.js');
const G = await import(W + 'engine/game.js');
const R = await import(W + 'engine/game-rewards.js');
const GAMES = ['memoire', 'frise', 'eclair', 'mot', 'estime'];
const thu = new Date(2026, 10, 5, 15).getTime(); // jeudi 5 novembre 2026

test('tampons de la semaine en cours seulement ; quatre jeux différents', () => {
  const ev = [{ type: 'memoire', id: '2026-11-02' }, { type: 'memoire', id: '2026-11-03' }, { type: 'frise', id: '2026-11-05' }, { type: 'eclair', id: '2026-11-01' }, { type: 'mot', id: '2026-11-08' }];
  const p = P.passportOf(ev, thu, GAMES);
  assert.equal(p.week, '2026-11-02');
  assert.deepEqual(p.stamps, { memoire: true, frise: true, eclair: false, mot: true, estime: false }, 'dimanche 1er : semaine précédente ; dimanche 8 : cette semaine');
  assert.equal(p.count, 3);
  assert.equal(p.complete, false);
  const p2 = P.passportOf([...ev, { type: 'estime', id: '2026-11-04' }], thu, GAMES);
  assert.ok(p2.complete && !p2.opened);
  assert.ok(P.passportOf([...ev, { type: 'estime', id: '2026-11-04' }, { type: 'passeport', id: '2026-11-02' }], thu, GAMES).opened);
  assert.equal(P.passportOf([], thu, ['memoire', 'frise']).need, 2, 'pas plus de tampons demandés que de jeux');
});

test('coffre du passeport : 20 points, une vignette rare, une fois par semaine ; trophée', () => {
  assert.equal(R.CHEST_EVENTS.passeport, 'rare');
  let game = G.withEvent(G.normalizeGame({}), 'passeport', '2026-11-02', 1);
  game = G.withEvent(game, 'passeport', '2026-11-02', 2);
  const c = G.computeGame([], game, 3);
  assert.equal(c.totalXp, 20);
  assert.equal(c.counters.passeports, 1);
  assert.ok(c.trophies.find((t) => t.id === 'passeport-1').earned);
  assert.ok(R.albumOf(game.events).owned[0].vignette.rare);
});
