/** Gardiens des périodes (quête de l'année) : déverrouillage, cœurs, victoire, défaite, points et vignette rare. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
const W = new URL('../../js/', import.meta.url).href;
const D = await import(W + 'engine/gardien.js');
const R = await import(W + 'engine/game-rewards.js');
const G = await import(W + 'engine/game.js');

const items = (n) => Array.from({ length: n }, (_, i) => ({ kind: 'gen', gen: 'g', seed: i }));

test('un gardien par période, avec ses répliques', () => {
  assert.equal(D.GUARDIANS.length, 5);
  assert.equal(new Set(D.GUARDIANS.map((g) => g.id)).size, 5);
  for (const g of D.GUARDIANS) for (const k of ['icon', 'name', 'what', 'hello', 'win', 'lose']) assert.ok(g[k] && g[k].length > 0, `${g.id}.${k}`);
  assert.notEqual(D.guardianLine(true, 0), D.guardianLine(false, 0));
  assert.ok(D.guardianLine(true, -3)); // indices négatifs tolérés
});

test('déverrouillage : deux chapitres terminés de la période (un seul s’il n’y en a qu’un)', () => {
  const cs = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  assert.deepEqual(D.guardianUnlock(cs, {}), { total: 3, finished: 0, need: 2, open: false });
  assert.equal(D.guardianUnlock(cs, { a: {} }).open, false);
  assert.equal(D.guardianUnlock(cs, { a: {}, c: {} }).open, true);
  assert.equal(D.guardianUnlock([{ id: 'a' }], { a: {} }).open, true);
  assert.equal(D.guardianUnlock([], {}).open, false);
});

test('affrontement : chaque réponse à 2 étoiles ou plus allume un cœur ; cinq cœurs : apprivoisé', () => {
  const f = D.newFight({ period: 0, items: items(10), now: 1 });
  assert.equal(f.items.length, D.GUARDIAN_QUESTIONS);
  let s = D.fightState(f);
  assert.deepEqual([s.asked, s.hearts, s.left, s.over], [0, 0, 8, false]);
  assert.equal(s.current.seed, 0);
  assert.equal(D.answerFight(f, 3).hit, true);
  assert.equal(D.answerFight(f, 1).hit, false);
  assert.equal(D.answerFight(f, 2).hit, true);
  s = D.fightState(f);
  assert.deepEqual([s.asked, s.hearts, s.left, s.current.seed], [3, 2, 5, 3]);
  D.answerFight(f, 3); D.answerFight(f, 3);
  const r = D.answerFight(f, 3);
  assert.equal(r.won, true); assert.equal(r.over, true); assert.equal(r.hearts, 5); assert.equal(r.current, null);
  const n = f.results.length;
  D.answerFight(f, 3); // fini : plus rien ne change
  assert.equal(f.results.length, n);
});

test('affrontement perdu dès qu’il ne reste plus assez de questions', () => {
  const f = D.newFight({ period: 4, items: items(8), now: 1 });
  D.answerFight(f, 0); D.answerFight(f, 1); D.answerFight(f, 3);
  assert.equal(D.fightState(f).over, false); // 1 cœur, 5 questions : encore possible (il en faut 4)
  assert.equal(D.answerFight(f, 0).lost, false); // 1 cœur, 4 questions : il faut tout réussir
  const r = D.answerFight(f, 1);
  assert.equal(r.lost, true); // 1 cœur + 3 questions < 5
  assert.equal(r.won, false);
  assert.equal(D.answerFight(f, 'n’importe quoi').hit, false);
});

test('jouable seulement avec au moins cinq questions ; étoiles bornées', () => {
  assert.equal(D.fightPlayable(items(4)), false);
  assert.equal(D.fightPlayable(items(5)), true);
  assert.equal(D.fightPlayable(null), false);
  const f = D.newFight({ period: 1, items: items(8), now: 0 });
  D.answerFight(f, 99); D.answerFight(f, -4);
  assert.deepEqual(f.results, [3, 0]);
});

test('points, trophées et vignette rare d’un gardien apprivoisé (une fois par période)', () => {
  assert.equal(G.XP.gardien, 30);
  assert.equal(R.CHEST_EVENTS.gardien, 'rare');
  let game = G.withEvent(G.normalizeGame({}), 'gardien', '2026-2027:cm1:maths:1', 1000);
  game = G.withEvent(game, 'gardien', '2026-2027:cm1:maths:1', 2000); // doublon ignoré
  const g = G.computeGame([], game, 3000);
  assert.equal(g.counters.gardiens, 1);
  assert.equal(g.totalXp, 30);
  assert.equal(g.album.owned.length, 1);
  assert.equal(g.album.owned[0].vignette.rare, true);
  assert.equal(g.trophies.find((t) => t.id === 'gardien-1').earned, true);
  assert.equal(g.trophies.find((t) => t.id === 'gardien-5').earned, false);
});
