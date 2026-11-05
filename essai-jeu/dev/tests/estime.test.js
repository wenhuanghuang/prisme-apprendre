/** Ordre de grandeur : questions par niveau, lecture des estimations, étoiles par rapport, plus proche, points. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
const W = new URL('../../js/', import.meta.url).href;
const E = await import(W + 'engine/estime.js');
const G = await import(W + 'engine/game.js');

test('questions : au moins douze par niveau, identifiants uniques, valeurs positives, explications', () => {
  for (const tier of ['p', 'c', 'l']) assert.ok(E.ESTIME_QUESTIONS[tier].length >= 12, tier);
  const all = Object.values(E.ESTIME_QUESTIONS).flat();
  assert.equal(new Set(all.map((q) => q.id)).size, all.length);
  for (const q of all) { assert.ok(q.value > 0 && q.q.endsWith('?') && q.why.length > 10, q.id); assert.ok(!/'|[{}]/.test(q.q + q.why), q.id); }
  assert.equal(E.questionsFor('ce1'), E.ESTIME_QUESTIONS.p);
  assert.equal(E.questionsFor('6e').length, E.ESTIME_QUESTIONS.p.length + E.ESTIME_QUESTIONS.c.length);
  assert.equal(E.pickQuestions('tle', 6).length, 6);
  assert.equal(new Set(E.pickQuestions('4e', 10).map((q) => q.id)).size, 10);
});

test('estimations : espaces, virgule ; étoiles selon le rapport ; plus proche', () => {
  assert.equal(E.parseEstimate('384 000'), 384000);
  assert.equal(E.parseEstimate('4,5'), 4.5);
  assert.equal(E.parseEstimate('0.1'), 0.1);
  assert.equal(E.parseEstimate('-3'), null);
  assert.equal(E.parseEstimate('0'), null);
  assert.equal(E.parseEstimate('beaucoup'), null);
  assert.equal(E.estimateStars(330, 330), 3);
  assert.equal(E.estimateStars(300, 330), 3);
  assert.equal(E.estimateStars(250, 330), 2);
  assert.equal(E.estimateStars(660, 330), 1);
  assert.equal(E.estimateStars(165, 330), 1, 'deux fois trop peu = deux fois trop');
  assert.equal(E.estimateStars(3300, 330), 0);
  assert.deepEqual(E.closest([200, 500], 330), [1], '500 est plus proche de 330 que 200, en rapport');
  assert.deepEqual(E.closest([165, 660], 330), [0, 1]);
  assert.equal(E.fmtValue(384000), '384 000');
  assert.equal(E.fmtValue(4.5), '4,5');
});

test('points de l’ordre de grandeur : 10, une fois par jour ; trophée', () => {
  assert.equal(G.XP.estime, 10);
  let game = G.withEvent(G.normalizeGame({}), 'estime', '2026-11-05', 1);
  game = G.withEvent(game, 'estime', '2026-11-05', 2);
  const c = G.computeGame([], game, 3);
  assert.equal(c.counters.estimes, 1);
  assert.equal(c.totalXp, 10);
  assert.ok(c.trophies.find((t) => t.id === 'estime-1').earned);
});
