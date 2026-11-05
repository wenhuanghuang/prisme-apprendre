/** Lecture chronométrée : textes par niveau, découpage, score (mots bien lus par minute), records et points. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
const W = new URL('../../js/', import.meta.url).href;
const F = await import(W + 'engine/fluence.js');
const G = await import(W + 'engine/game.js');

test('textes : trois par niveau, plus longs que ce qu’on lit en une minute, identifiants uniques', () => {
  for (const [tier, min] of [['cp', 60], ['ce', 120], ['cm', 160]]) {
    const list = F.TEXTS.filter((t) => t.tier === tier);
    assert.equal(list.length, 3, tier);
    for (const t of list) assert.ok(F.wordCount(t.text) >= min, `${t.id} : ${F.wordCount(t.text)} mots`);
  }
  assert.equal(new Set(F.TEXTS.map((t) => t.id)).size, F.TEXTS.length);
  assert.ok(F.TEXTS.every((t) => !/'/.test(t.text) && !/[{}]/.test(t.text)), 'apostrophes typographiques, pas d’accolades');
  assert.equal(F.tierOf('CE2'), 'ce');
  assert.equal(F.textsFor('cp').length, 3);
});

test('découpage : la ponctuation isolée ne compte pas comme un mot', () => {
  const tk = F.tokens('Maman appelle : « Sami, à table ! »');
  assert.deepEqual(tk.filter((x) => x.word).map((x) => x.t), ['Maman', 'appelle', 'Sami,', 'à', 'table']);
  assert.equal(F.wordCount('Bonne nuit, Milo !'), 3);
});

test('score : mots lus jusqu’au dernier, erreurs retirées, ramené à une minute si le texte est fini avant', () => {
  const text = 'un deux trois quatre cinq six sept huit neuf dix';
  assert.deepEqual(F.scoreReading(text, { lastIndex: 5, errors: [1, 3, 8] }), { read: 6, errors: 2, correct: 4, perMinute: 4, finished: false });
  const fin = F.scoreReading(text, { lastIndex: 9, errors: [], seconds: 30 });
  assert.equal(fin.perMinute, 20);
  assert.ok(fin.finished);
  assert.equal(F.scoreReading(text, { lastIndex: -1 }).read, 0);
});

test('records : un score plus haut l’emporte ; conservé à la relecture ; points une fois par jour', () => {
  let g = G.normalizeGame({});
  g = G.withScore(g, 'fluence:cp-chat', 34, 1);
  assert.equal(G.withScore(g, 'fluence:cp-chat', 30, 2), g, 'moins bien : rien ne change');
  g = G.withScore(g, 'fluence:cp-chat', 41, 3);
  g = G.withRecord(g, 'eclair:cm1:tables:10', 40000, 4);
  const back = G.normalizeGame(JSON.parse(JSON.stringify(g)));
  assert.deepEqual(back.records['fluence:cp-chat'], { score: 41, at: 3 });
  assert.equal(back.records['eclair:cm1:tables:10'].ms, 40000);
  assert.equal(G.XP.fluence, 10);
  let game = G.withEvent(back, 'fluence', '2026-11-05', 1);
  game = G.withEvent(game, 'fluence', '2026-11-05', 2);
  const c = G.computeGame([], game, 3);
  assert.equal(c.counters.fluences, 1);
  assert.equal(c.totalXp, 10);
  assert.ok(c.trophies.find((t) => t.id === 'fluence-1').earned);
});
