/** « La boutique » : prix et monnaie justes à chaque classe, paiement le plus court, verdicts. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
const W = new URL('../../js/', import.meta.url).href;
const B = await import(W + 'engine/boutique.js');
const G = await import(W + 'engine/game.js');

test('montants écrits à la française', () => {
  assert.equal(B.money(350), '3,50 €');
  assert.equal(B.money(1200), '12 €');
  assert.equal(B.money(1205), '12,05 €');
  assert.equal(B.money(45), '45 c');
  assert.equal(B.denomLabel(200), '2 €');
  assert.equal(B.denomLabel(20), '20 c');
  assert.equal(B.denomLabel(5000), '50 €');
});

test('le moins de pièces possible', () => {
  assert.deepEqual(B.fewest(380, B.DENOMS.map((d) => d.v)), [200, 100, 50, 20, 10]);
  assert.deepEqual(B.fewest(1700, [100, 200, 500, 1000]), [1000, 500, 200]);
  assert.equal(B.fewest(150, [100, 200]), null);
});

for (const level of Object.keys(B.BOUTIQUE_LEVELS)) {
  test(`boutique ${level} : 2 000 clients jouables`, () => {
    const cfg = B.BOUTIQUE_LEVELS[level];
    let rendre = 0; const prices = new Set();
    for (let k = 0; k < 2000; k++) {
      const c = B.newCustomer(level);
      assert.ok(Number.isInteger(c.price) && c.price >= cfg.min && c.price <= cfg.max, `${level} prix ${c.price}`);
      assert.equal(c.price % cfg.step, 0);
      assert.ok(c.target > 0);
      assert.ok(B.fewest(c.target, cfg.denoms), `${level} : ${c.target} faisable`);
      if (c.mode === 'rendre') {
        rendre++;
        assert.equal(c.target, c.given - c.price);
        assert.ok([500, 1000, 2000, 5000, 10000].includes(c.given) && c.given > c.price);
      } else assert.equal(c.target, c.price);
      assert.ok(c.icon && c.name && !/undefined|NaN/.test(c.name + B.money(c.price)));
      prices.add(c.price);
    }
    if (cfg.rendre) assert.ok(rendre > 2000 * cfg.rendre * 0.6, `${level} : ${rendre} rendus de monnaie`);
    else assert.equal(rendre, 0);
    assert.ok(prices.size >= 15, `${level} : ${prices.size} prix différents`);
    const day = B.newDay(level, 8);
    assert.equal(day.length, 8);
    for (let j = 1; j < day.length; j++) assert.notEqual(day[j].name, day[j - 1].name);
  });
}

test('verdicts : exact, malin, trop, pas assez', () => {
  const c = { icon: '🧸', name: 'un ours', price: 1700, mode: 'payer', given: 0, target: 1700 };
  const smart = B.judge(c, [1000, 500, 200], 'cp');
  assert.ok(smart.exact && smart.smart);
  assert.match(B.feedback(c, smart), /paiement malin/);
  const slow = B.judge(c, [500, 500, 500, 200], 'cp');
  assert.ok(slow.exact && !slow.smart);
  assert.match(B.feedback(c, slow), /3 pièces ou billets seulement/);
  const over = B.judge(c, [1000, 1000], 'cp');
  assert.equal(over.diff, 300);
  assert.match(B.feedback(c, over), /C’est trop : tu as posé 20 €, il faut payer 17 €\. Reprends 3 €/);
  const under = B.judge(c, [1000], 'cp');
  assert.match(B.feedback(c, under), /Il manque 7 €/);
  const r = { icon: '📚', name: 'un livre', price: 1350, mode: 'rendre', given: 2000, target: 650 };
  assert.match(B.changeHint(r), /de 13,50 € à 20 €, il manque 6,50 €/);
  assert.ok(B.judge(r, [500, 100, 50], 'cm1').smart);
  assert.equal(B.boutiqueStars(0), 3);
  assert.equal(B.boutiqueStars(3), 1);
  assert.equal(G.eventXp('boutique'), 10);
});
