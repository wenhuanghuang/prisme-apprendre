/** « Le plus grand ! » : paires de chaque classe, toujours différentes, bonne réponse cohérente ; séries ; points. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
const W = new URL('../../js/', import.meta.url).href;
const C = await import(W + 'engine/compare.js');
const G = await import(W + 'engine/game.js');

for (const level of Object.keys(C.COMPARE_LEVELS)) {
  test(`plus grand ${level} : 1 000 manches justes et variées`, () => {
    const labels = new Set();
    for (let k = 0; k < 1000; k++) {
      const r = C.newRound(level);
      assert.equal(r.cards.length, 2);
      const [a, b] = r.cards;
      assert.ok(Number.isFinite(a.value) && Number.isFinite(b.value), `${a.label} / ${b.label}`);
      assert.ok(Math.abs(a.value - b.value) > 1e-9, `égalité : ${a.label} / ${b.label}`);
      assert.notEqual(a.label, b.label);
      assert.equal(r.answer, a.value > b.value ? 0 : 1);
      assert.ok(!/undefined|NaN|[{}]|-/.test(a.label + b.label), `${a.label} / ${b.label}`);
      labels.add(`${a.label}|${b.label}`);
    }
    assert.ok(labels.size >= 12, `${level} : ${labels.size} paires différentes`);
    const s = C.newSeries(level, 15);
    assert.equal(s.length, 15);
  });
}

test('étoiles, explication, points une fois par jour', () => {
  assert.equal(C.compareStars(0), 3);
  assert.equal(C.compareStars(2), 2);
  assert.equal(C.compareStars(5), 1);
  assert.match(C.explain({ cards: [{ label: '3/4', value: 0.75 }, { label: '0,7', value: 0.7 }] }), /3\/4 = 0,75 ; 0,7 = 0,7/);
  assert.equal(G.XP.compare, 10);
  let game = G.withEvent(G.normalizeGame({}), 'compare', '2026-11-11', 1);
  game = G.withEvent(game, 'compare', '2026-11-11', 2);
  const c = G.computeGame([], game, 3);
  assert.equal(c.counters.compares, 1);
  assert.equal(c.totalXp, 10);
});
