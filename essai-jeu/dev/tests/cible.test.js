/** « La cible » : cibles toujours atteignables, règles des opérations, annulation, points. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
const W = new URL('../../js/', import.meta.url).href;
const C = await import(W + 'engine/cible.js');
const G = await import(W + 'engine/game.js');

/** Rejoue la solution d'une partie sur le plateau. */
function replay(p) {
  let b = C.startBoard(p);
  for (const s of p.solution) {
    const A = b.tiles.find((t) => t.value === s.a);
    const B = b.tiles.find((t) => t.value === s.b && t.id !== A.id);
    assert.ok(A && B, `${JSON.stringify(p)} : étape ${C.stepText(s)}`);
    const r = C.combine(b, A.id, s.op, B.id);
    assert.ok(!r.error, r.error);
    b = r.board;
  }
  return b;
}

for (const level of Object.keys(C.CIBLE_LEVELS)) {
  test(`cible ${level} : 1 000 parties atteignables, selon la classe`, () => {
    const cfg = C.CIBLE_LEVELS[level];
    const targets = new Set();
    for (let k = 0; k < 1000; k++) {
      const p = C.newPuzzle(level);
      assert.equal(p.numbers.length, cfg.count);
      assert.ok(p.target >= cfg.min && p.target <= cfg.max, `${level} cible ${p.target}`);
      assert.ok(!p.numbers.includes(p.target));
      assert.ok(p.solution.length >= cfg.minSteps);
      for (const s of p.solution) {
        assert.ok(cfg.ops.includes(s.op), `${level} : ${s.op} interdit`);
        assert.ok(Number.isInteger(s.r) && s.r > 0);
        assert.ok(!(s.op === '×' && (s.a === 1 || s.b === 1)) && !(s.op === '÷' && s.b === 1), 'pas d’opération gratuite');
      }
      assert.ok(C.isHit(replay(p)), 'la solution atteint la cible');
      targets.add(p.target);
    }
    assert.ok(targets.size >= (level === 'ce1' ? 15 : 60), `${level} : ${targets.size} cibles différentes`);
    const s = C.newSeries(level, 6);
    assert.equal(new Set(s.map((p) => p.target)).size, 6);
  });
}

test('opérations : entiers positifs seulement', () => {
  assert.equal(C.compute(9, '−', 4), 5);
  assert.equal(C.compute(4, '−', 9), null);
  assert.equal(C.compute(4, '−', 4), null);
  assert.equal(C.compute(12, '÷', 4), 3);
  assert.equal(C.compute(12, '÷', 5), null);
  assert.match(C.refusal(4, '−', 9), /ne donne pas un nombre positif/);
  assert.match(C.refusal(12, '÷', 5), /ne tombe pas juste/);
});

test('plateau : combiner, refuser, annuler, le plus proche, les points', () => {
  const p = { numbers: [9, 8, 5], target: 67, solution: [] };
  let b = C.startBoard(p);
  assert.match(C.combine(b, 'n0', '+', 'n0').error, /deux nombres différents/);
  assert.match(C.combine(b, 'n2', '−', 'n0').error, /positif/);
  b = C.combine(b, 'n0', '×', 'n1').board;
  assert.deepEqual(b.tiles.map((t) => t.value), [5, 72]);
  assert.equal(C.closest(b), 72);
  b = C.combine(b, b.tiles[1].id, '−', 'n2').board;
  assert.ok(C.isHit(b));
  assert.deepEqual(b.steps.map(C.stepText), ['9 × 8 = 72', '72 − 5 = 67']);
  b = C.undo(b);
  assert.deepEqual(b.tiles.map((t) => t.value).sort((x, y) => x - y), [5, 72]);
  b = C.undo(C.undo(b));
  assert.deepEqual(b.tiles.map((t) => t.value).sort((x, y) => x - y), [5, 8, 9]);
  assert.equal(C.points(67, 67), 3);
  assert.equal(C.points(69, 67), 2);
  assert.equal(C.points(57, 67), 1);
  assert.equal(C.points(50, 67), 0);
  assert.equal(C.cibleStars(13, 15), 3);
  assert.equal(C.cibleStars(8, 15), 2);
  assert.equal(C.cibleStars(3, 15), 1);
  assert.equal(G.eventXp('cible'), 10);
});
