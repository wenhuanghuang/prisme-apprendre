import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rng } from '../../app/js/core/template.js';
import { store } from '../../app/js/app/store.js';
import { buildSeries } from '../../app/js/ui/views/exercices.js';

const lessonPool = Array.from({ length: 12 }, (_, i) => ({ id: `e${i}`, skill: i < 6 ? 'fragile' : 'solide', track: i % 3 ? 'classe' : 'approfondissement', difficulty: 1 + (i % 4) }));
const genPool = [{ id: 'g', skill: 'fragile', track: 'classe' }];

test('série : pas de doublon, au plus la moitié d’exercices générés, du plus guidé au plus exigeant', () => {
  store.states = { skills: {} }; store.attempts = []; store.now = () => 0;
  for (let k = 1; k <= 20; k++) {
    const s = buildSeries({ lessonPool, genPool, count: 10, adapted: false, rand: rng(k), level: '4e' });
    assert.equal(s.length, 10);
    const ids = s.filter((x) => x.kind === 'lesson').map((x) => x.id);
    assert.equal(new Set(ids).size, ids.length, 'aucun exercice de leçon en double');
    assert.ok(s.filter((x) => x.kind === 'gen').length <= 5);
    assert.ok(s.filter((x) => x.kind === 'gen').every((x) => x.opts.niveau === '4e'), 'le niveau est transmis au générateur');
    const tracks = s.map((x) => x.track);
    assert.deepEqual(tracks, [...tracks].sort((a, b) => ['classe', 'approfondissement', 'expert'].indexOf(a) - ['classe', 'approfondissement', 'expert'].indexOf(b)));
  }
  assert.equal(buildSeries({ lessonPool: [], genPool: [], count: 10, adapted: true }).length, 0, 'réservoir vide : série vide');
});

test('série adaptée : les notions fragiles sont nettement plus fréquentes', () => {
  store.states = { skills: { fragile: { pL: 0.15 }, solide: { pL: 0.95 } } }; store.attempts = []; store.now = () => 0;
  let fragile = 0; let total = 0;
  for (let k = 1; k <= 40; k++) {
    for (const x of buildSeries({ lessonPool, genPool: [], count: 6, adapted: true, rand: rng(k) })) { total++; if (x.skill === 'fragile') fragile++; }
  }
  assert.ok(fragile / total > 0.7, `${fragile}/${total}`);
});
