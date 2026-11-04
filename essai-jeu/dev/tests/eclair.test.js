/** Calcul éclair : calculs justes et variés pour chaque classe, saisie, calculs ratés qui reviennent, records, points. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
const W = new URL('../../js/', import.meta.url).href;
const E = await import(W + 'engine/eclair.js');
const G = await import(W + 'engine/game.js');

/** Recalcule la réponse attendue à partir du texte du calcul (contrôle indépendant du générateur). */
function evaluate(q) {
  const n = (s) => Number(s.replace('−', '-').replace(',', '.'));
  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  let m;
  if ((m = q.match(/^(\d+(?:,\d+)?) \+ … = (\d+)$/))) return n(m[2]) - n(m[1]);
  if ((m = q.match(/^… \+ (\d+) = (\d+)$/))) return n(m[2]) - n(m[1]);
  if ((m = q.match(/^le double de (\d+)$/))) return 2 * n(m[1]);
  if ((m = q.match(/^la moitié de (\d+)$/))) return n(m[1]) / 2;
  if ((m = q.match(/^(le tiers|le quart|les trois quarts|les deux tiers|le dixième) de (\d+)$/))) return ({ 'le tiers': 1 / 3, 'le quart': 1 / 4, 'les trois quarts': 3 / 4, 'les deux tiers': 2 / 3, 'le dixième': 1 / 10 })[m[1]] * n(m[2]);
  if ((m = q.match(/^(\d+) % de (\d+)$/))) return (n(m[1]) * n(m[2])) / 100;
  if ((m = q.match(/^augmenter de (\d+) %, c’est multiplier par …$/))) return 1 + n(m[1]) / 100;
  if ((m = q.match(/^baisser de (\d+) %, c’est multiplier par …$/))) return 1 - n(m[1]) / 100;
  if ((m = q.match(/^(\d+)²$/))) return n(m[1]) ** 2;
  if ((m = q.match(/^√(\d+)$/))) return Math.sqrt(n(m[1]));
  if ((m = q.match(/^(\d+)(⁻?)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)$/))) { const e = Number([...m[3]].map((c) => SUP.indexOf(c)).join('')); return n(m[1]) ** (m[2] ? -e : e); }
  const expr = q.replace(/\(([+−])(\d+)\)/g, (_, s, d) => (s === '−' ? `(-${d})` : `(${d})`)).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/(\d),(\d)/g, '$1.$2');
  assert.match(expr, /^[\d\s+\-*/().]+$/, `calcul non reconnu : ${q}`);
  return Function(`return (${expr});`)();
}

for (const level of Object.keys(E.ECLAIR_LEVELS)) {
  test(`calcul éclair ${level} : calculs justes, variés, réponses lisibles`, () => {
    const themes = ['melange', ...E.ECLAIR_LEVELS[level]];
    for (const theme of themes) {
      const qs = new Set();
      for (let s = 0; s < 200; s++) {
        const e = E.newEclair({ level, theme, count: 10 });
        assert.equal(e.queue.length, 10, `${level} ${theme}`);
        for (const c of e.queue) {
          qs.add(c.q);
          assert.ok(Number.isFinite(c.a), `${c.q}`);
          assert.ok(Math.abs(evaluate(c.q) - c.a) < 1e-9, `${level} ${theme} : ${c.q} → ${c.a} (attendu ${evaluate(c.q)})`);
          assert.equal(E.parseAnswer(E.frNum(c.a)), c.a, `${c.a} se tape et se relit`);
          assert.ok(!/undefined|NaN/.test(c.q));
          if (['cp', 'ce1', 'ce2', 'cm1'].includes(level)) assert.ok(c.a >= 0 && Number.isInteger(c.a), `${level} : ${c.q} = ${c.a} (entier positif à l’école)`);
        }
        assert.equal(new Set(e.queue.map((c) => c.q)).size, 10, `${level} ${theme} : pas deux fois le même calcul dans une série`);
      }
      assert.ok(qs.size >= 12, `${level} ${theme} : ${qs.size} calculs différents`);
    }
  });
}

test('saisie : virgule, point, signe moins', () => {
  assert.equal(E.parseAnswer(' 56 '), 56);
  assert.equal(E.parseAnswer('0,5'), 0.5);
  assert.equal(E.parseAnswer('1.2'), 1.2);
  assert.equal(E.parseAnswer('−3'), -3);
  assert.equal(E.parseAnswer('-12'), -12);
  assert.equal(E.parseAnswer('abc'), null);
  assert.equal(E.parseAnswer(''), null);
  assert.equal(E.frNum(-2.5), '−2,5');
});

test('un calcul raté revient plus loin ; la série finit sur des réussites', () => {
  const e = E.newEclair({ level: 'cm1', theme: 'tables', count: 5, rand: Math.random });
  const first = E.currentCalc(e);
  assert.equal(E.answer(e, 'n’importe quoi', 1000).status, 'invalid');
  assert.equal(E.answer(e, String(first.a + 1), 1000).status, 'wrong');
  assert.equal(e.errors, 1);
  assert.equal(e.queue.length, 5, 'il est remis dans la série');
  assert.equal(e.queue.indexOf(first), 3);
  let t = 2000;
  while (!E.isDone(e)) { const c = E.currentCalc(e); assert.equal(E.answer(e, E.frNum(c.a), t += 1000).status, 'right'); }
  assert.equal(e.done.length, 5);
  assert.equal(E.elapsedMs(e), t - 1000);
  assert.equal(E.eclairStars(e), 2);
  assert.equal(e.misses.length, 1);
});

test('temps lisibles', () => {
  assert.equal(E.formatMs(42340), '42,3 s');
  assert.equal(E.formatMs(65000), '1 min 05 s');
});

test('records : seulement s’ils sont battus ; conservés à la relecture ; points une fois par jour', () => {
  const k = E.recordKey('cm1', 'tables', 10);
  let g = G.normalizeGame({});
  g = G.withRecord(g, k, 42000, 1);
  assert.equal(g.records[k].ms, 42000);
  assert.equal(G.withRecord(g, k, 50000, 2), g, 'plus lent : rien ne change');
  g = G.withRecord(g, k, 38000, 3);
  assert.equal(g.records[k].ms, 38000);
  const back = G.normalizeGame(JSON.parse(JSON.stringify({ ...g, records: { ...g.records, 'bad key!': { ms: 3, at: 1 }, x: { ms: -1, at: 1 } } })));
  assert.deepEqual(Object.keys(back.records), [k]);
  assert.equal(G.XP.eclair, 10);
  let game = G.withEvent(back, 'eclair', '2026-11-04', 1);
  game = G.withEvent(game, 'eclair', '2026-11-04', 2);
  const c = G.computeGame([], game, 3);
  assert.equal(c.counters.eclairs, 1);
  assert.equal(c.totalXp, 10);
  assert.ok(c.trophies.find((t) => t.id === 'eclair-1').earned);
});
