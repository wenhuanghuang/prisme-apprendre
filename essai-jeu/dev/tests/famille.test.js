/** Défi de la famille : semaine du lundi au dimanche, but commun selon les joueurs actifs, coffre et trophées. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
const W = new URL('../../js/', import.meta.url).href;
const F = await import(W + 'engine/famille.js');
const G = await import(W + 'engine/game.js');
const R = await import(W + 'engine/game-rewards.js');

const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h).getTime();
const ok = (ts, extra = {}) => ({ ts, verdict: 'correct', ...extra });

test('semaine : du lundi au dimanche, en heure locale', () => {
  assert.equal(F.weekKey(at(2026, 11, 4)), '2026-11-02'); // mercredi → lundi
  assert.equal(F.weekKey(at(2026, 11, 2, 0)), '2026-11-02');
  assert.equal(F.weekKey(at(2026, 11, 8, 23)), '2026-11-02'); // dimanche soir
  assert.equal(F.weekKey(at(2026, 11, 9, 0)), '2026-11-09');
  assert.equal(F.weekKey(at(2027, 1, 1)), '2026-12-28'); // à cheval sur deux années
});

test('seules les vraies bonnes réponses de la semaine comptent', () => {
  const now = at(2026, 11, 4);
  const attempts = [ok(at(2026, 11, 2)), ok(at(2026, 11, 3)), ok(at(2026, 11, 3), { solutionShown: true }), { ts: at(2026, 11, 3), verdict: 'incorrect' },
    ok(at(2026, 11, 1)), ok(at(2026, 11, 9)), { ts: at(2026, 11, 4), verdict: 'pending', humanValidated: true }];
  const fw = F.familyWeek([{ profile: { id: 'a', pseudo: 'Léa' }, attempts }], now);
  assert.equal(fw.players[0].count, 3);
  assert.equal(fw.goal, F.FAMILY_PER_PLAYER);
  assert.equal(fw.daysLeft, 5); // mercredi → dimanche, aujourd'hui compris
});

test('le but grandit avec les joueurs actifs ; un profil endormi ne compte pas', () => {
  const now = at(2026, 11, 4);
  const many = (n, d) => Array.from({ length: n }, (_, i) => ok(at(2026, 11, d) + i));
  const fw = F.familyWeek([
    { profile: { id: 'a', pseudo: 'Léa', color: '#111' }, attempts: many(30, 3) },
    { profile: { id: 'b', pseudo: 'Tom' }, attempts: many(20, 2) },
    { profile: { id: 'c', pseudo: 'Ancien' }, attempts: [ok(at(2026, 6, 1))] }, // rien depuis juin
    { profile: { id: 'd', pseudo: 'Nouveau' }, attempts: [{ ts: at(2026, 10, 20), verdict: 'incorrect' }] }, // actif ce mois-ci
  ], now);
  assert.equal(fw.active, 3);
  assert.equal(fw.goal, 3 * F.FAMILY_PER_PLAYER);
  assert.equal(fw.total, 50);
  assert.equal(fw.reached, false);
  assert.equal(fw.left, 105 - 50);
  assert.match(F.familyPep(fw), /Encore 55 bonnes réponses à vous tous/);
  const done = F.familyWeek([{ profile: { id: 'a', pseudo: 'Léa' }, attempts: many(40, 3) }], now);
  assert.equal(done.reached, true);
  assert.match(F.familyPep(done), /atteint/);
  assert.match(F.familyPep(F.familyWeek([{ profile: { id: 'a', pseudo: 'Léa' }, attempts: many(34, 3) }], now)), /Encore 1 bonne réponse à toi/);
});

test('coffre de la famille : 25 points, vignette rare, une fois par semaine, trophées', () => {
  assert.equal(G.XP.famille, 25);
  assert.equal(R.CHEST_EVENTS.famille, 'rare');
  let game = G.withEvent(G.normalizeGame({}), 'famille', '2026-11-02', 1000);
  game = G.withEvent(game, 'famille', '2026-11-02', 2000);
  const g = G.computeGame([], game, 3000);
  assert.equal(g.counters.familles, 1);
  assert.equal(g.totalXp, 25);
  assert.equal(g.album.owned[0].vignette.rare, true);
  assert.equal(g.trophies.find((t) => t.id === 'famille-1').earned, true);
  assert.equal(g.trophies.find((t) => t.id === 'famille-4').earned, false);
});
