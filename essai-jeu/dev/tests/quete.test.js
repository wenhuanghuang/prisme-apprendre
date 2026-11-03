/** Quête, album de lumière et points des nouveaux évènements (moteurs purs de la version en ligne + jeu). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
const W = new URL('../../js/', import.meta.url).href;
const Q = await import(W + 'engine/quete.js');
const R = await import(W + 'engine/game-rewards.js');
const G = await import(W + 'engine/game.js');

const item = (i) => ({ kind: 'lesson', id: `e${i}`, difficulty: 1 + (i % 4) });
const quest = (stages = 3) => Q.newQuest({ id: 'q1', title: 'T', level: '5e', subject: 'maths', size: 'courte',
  steps: Array.from({ length: stages * 4 }, (_, i) => item(i)), challenges: Array.from({ length: stages }, (_, i) => item(100 + i)), now: 0 });

test('quête : 4 étapes puis un défi, dans l’ordre ; on avance pas à pas', () => {
  assert.throws(() => Q.newQuest({ id: 'x', steps: [item(1)], challenges: [item(2)], now: 0 }), /4 exercices/);
  const q = quest(2);
  assert.equal(Q.nodeCount(q), 10);
  assert.deepEqual([0, 1, 2, 3, 4, 5, 9].map((i) => Q.nodeAt(q, i).kind), ['pas', 'pas', 'pas', 'pas', 'defi', 'pas', 'defi']);
  assert.equal(Q.nodeAt(q, 5).step, 4);
  assert.equal(Q.nodeAt(q, 9).stage, 1);
  assert.throws(() => Q.answerChallenge(q, 3, 0), /pas un défi/);
  for (let k = 0; k < 4; k++) Q.answerStep(q, k === 0 ? 0 : 3);
  assert.equal(Q.currentNode(q).kind, 'defi');
  assert.throws(() => Q.answerStep(q, 3), /pas une étape/);
  assert.deepEqual(q.stepStars.slice(0, 4), [0, 3, 3, 3], 'une étape ratée avance quand même');
});

test('défi : relevé avec 2 étoiles ou plus ; manqué, on le retente ou on passe (après un essai)', () => {
  const q = quest(2);
  for (let k = 0; k < 4; k++) Q.answerStep(q, 2);
  assert.throws(() => Q.skipChallenge(q, 0), /après l’avoir tenté/);
  let r = Q.answerChallenge(q, 1, 0);
  assert.equal(r.passed, false);
  assert.equal(Q.currentNode(q).kind, 'defi', 'on reste devant le coffre');
  Q.replaceChallenge(q, item(999));
  assert.equal(Q.currentNode(q).item.id, 'e999');
  r = Q.answerChallenge(q, 2, 0);
  assert.equal(r.passed, true);
  assert.equal(r.chest, 'q1:1');
  assert.equal(r.tries, 2);
  for (let k = 0; k < 4; k++) Q.answerStep(q, 3);
  Q.answerChallenge(q, 0, 5);
  const s = Q.skipChallenge(q, 7);
  assert.equal(s.over, true);
  assert.equal(q.finishedAt, 7);
  const sum = Q.questSummary(q);
  assert.deepEqual({ stars: sum.stars, max: sum.maxStars, passed: sum.passed, done: sum.done, grand: sum.grandChest }, { stars: 20, max: 24, passed: 1, done: true, grand: true });
});

test('grand coffre : au moins la moitié des étoiles des étapes', () => {
  const q = quest(1);
  for (const s of [1, 1, 1, 2]) Q.answerStep(q, s); // 5 sur 12
  Q.answerChallenge(q, 3, 1);
  assert.equal(Q.questSummary(q).grandChest, false);
  const q2 = quest(1);
  for (const s of [2, 1, 1, 2]) Q.answerStep(q2, s); // 6 sur 12
  Q.answerChallenge(q2, 0, 1); Q.skipChallenge(q2, 2);
  assert.equal(Q.questSummary(q2).grandChest, true, 'même sans aucun coffre de défi');
  assert.equal(JSON.stringify(JSON.parse(JSON.stringify(q2))), JSON.stringify(q2), 'état sérialisable');
});

test('album : une vignette par coffre, rare pour une quête ou une victoire, reproductible, complet à 24', () => {
  assert.equal(R.VIGNETTES.length, 24);
  assert.equal(new Set(R.VIGNETTES.map((v) => v.id)).size, 24);
  assert.equal(R.VIGNETTES.filter((v) => v.rare).length, 6);
  assert.ok(R.VIGNETTES.every((v) => v.icon && v.label && v.fact.length > 30));
  const ev = [{ type: 'defi', id: 'a:1', ts: 1 }, { type: 'quete', id: 'a', ts: 2 }, { type: 'lecon', id: 'l', ts: 3 }, { type: 'victoire', id: 'p:1', ts: 4 }];
  const a = R.albumOf(ev);
  assert.equal(a.owned.length, 3, 'une leçon ne donne pas de vignette');
  assert.equal(a.owned[0].vignette.rare, undefined);
  assert.equal(a.owned[1].vignette.rare, true);
  assert.equal(a.byEvent.get('quete:a'), a.owned[1].vignette);
  assert.deepEqual(R.albumOf([...ev].reverse()).owned.map((o) => o.vignette.id), a.owned.map((o) => o.vignette.id), 'ordre chronologique, pas l’ordre de la liste');
  const many = Array.from({ length: 40 }, (_, i) => ({ type: i % 3 ? 'defi' : 'victoire', id: `x${i}`, ts: i }));
  const full = R.albumOf(many);
  assert.equal(full.owned.length, 24, 'album complet, sans doublon');
  assert.equal(new Set(full.owned.map((o) => o.vignette.id)).size, 24);
});

test('points et trophées des jeux : défi 15, quête 40, partie 15, victoire 20, une fois par identifiant', () => {
  let game = G.normalizeGame({});
  for (const [t, id] of [['defi', 'q:1'], ['defi', 'q:1'], ['quete', 'q'], ['plateau', 'p:a'], ['victoire', 'p:a']]) game = G.withEvent(game, t, id, 1000);
  assert.equal(game.events.length, 4, 'un coffre ne s’ouvre qu’une fois');
  assert.equal(G.normalizeGame(JSON.parse(JSON.stringify(game))).events.length, 4, 'les nouveaux évènements sont gardés à la relecture');
  const g = G.computeGame([], game, 2000);
  assert.equal(g.totalXp, 15 + 40 + 15 + 20);
  assert.equal(g.counters.defis, 1); assert.equal(g.counters.quetes, 1); assert.equal(g.counters.victoires, 1); assert.equal(g.counters.album, 3);
  const earned = g.trophies.filter((t) => t.earned).map((t) => t.id);
  for (const id of ['defi-1', 'quete-1', 'plateau-1']) assert.ok(earned.includes(id), id);
});
