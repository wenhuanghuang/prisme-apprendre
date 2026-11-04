/** Mot mystère : lettres et accents, couleurs perdues, lettre révélée, séries, listes de mots, points une fois par jour. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const W = fileURLToPath(new URL('../../', import.meta.url));
const M = await import(W + 'js/engine/mot.js');
const G = await import(W + 'js/engine/game.js');

test('lettres de base : les accents se devinent avec la lettre simple', () => {
  assert.equal(M.baseLetter('é'), 'E');
  assert.equal(M.baseLetter('ç'), 'C');
  assert.equal(M.baseLetter('ñ'), 'N');
  assert.equal(M.baseLetter('œ'), 'O');
  assert.equal(M.baseLetter('-'), null);
  assert.equal(M.baseLetter('’'), null);
  const w = M.newWord({ word: 'élève', clue: 'x' });
  assert.equal(M.guess(w, 'e'), 'hit');
  assert.equal(M.maskOf(w).map((m) => (m.shown ? m.ch : '_')).join(''), 'é_è_e');
});

test('une lettre absente éteint une couleur ; répétition ignorée ; mot perdu au bout de sept', () => {
  const w = M.newWord({ word: 'chat', clue: 'Un animal qui miaule.' });
  assert.equal(M.guess(w, 'Z'), 'miss');
  assert.equal(w.rays, M.RAYS - 1);
  assert.equal(M.guess(w, 'Z'), 'repeat');
  assert.equal(w.rays, M.RAYS - 1, 'pas de double peine');
  for (const l of 'BDEFGI') M.guess(w, l);
  assert.ok(M.isLost(w));
  assert.ok(M.maskOf(w).every((m) => m.shown), 'le mot s’affiche quand il est perdu');
  assert.equal(M.guess(w, 'C'), 'ignore');
});

test('révéler une lettre coûte une couleur, jamais la dernière', () => {
  const w = M.newWord({ word: 'lune', clue: 'x' });
  const l = M.revealOne(w, () => 0);
  assert.equal(l, 'L');
  assert.equal(w.rays, M.RAYS - 1);
  w.rays = 1;
  assert.equal(M.revealOne(w), null);
  for (const x of 'UNE') M.guess(w, x);
  assert.ok(M.isSolved(w));
});

test('espaces, tirets et apostrophes sont donnés d’office', () => {
  const w = M.newWord({ word: 'ice cream', clue: 'x' });
  assert.equal(M.maskOf(w).filter((m) => m.shown).length, 1);
  for (const x of 'ICERAM') M.guess(w, x);
  assert.ok(M.isSolved(w));
  assert.ok(!M.playable('ab'));
  assert.ok(!M.playable('R2D2'));
  assert.ok(M.playable('aujourd’hui'));
});

test('séries : choix sans doublon, étoiles', () => {
  const ws = M.pickWords([{ word: 'chat', clue: 'a' }, { word: 'Chat', clue: 'b' }, { word: 'lune', clue: 'a' }, { word: 'xy', clue: 'c' }, { word: 'soleil', clue: 'd' }], 10, () => 0.9999); // ordre conservé
  assert.equal(ws.length, 2);
  assert.equal(M.seriesStars([{ found: true, misses: 1 }, { found: true, misses: 1 }]), 3);
  assert.equal(M.seriesStars([{ found: true, misses: 5 }, { found: true, misses: 2 }]), 2);
  assert.equal(M.seriesStars([{ found: false, misses: 7 }, { found: true, misses: 0 }, { found: false, misses: 7 }]), 1);
  assert.equal(M.vocabAnswer(['el padre', 'padre']), 'padre');
  assert.equal(M.vocabAnswer(['ice cream']), 'ice cream');
});

test('devinettes en français : trois niveaux, mots jouables et distincts, indices distincts', () => {
  for (const [tier, list] of Object.entries(M.MOTS_FR)) {
    assert.ok(list.length >= 20, `${tier} : ${list.length} mots`);
    assert.equal(new Set(list.map(([w]) => w)).size, list.length, `${tier} : mots en double`);
    assert.equal(new Set(list.map(([, c]) => c)).size, list.length, `${tier} : indices en double`);
    for (const [w, c] of list) { assert.ok(M.playable(w), w); assert.ok(!c.toLowerCase().includes(w.toLowerCase()), `${w} : l’indice ne doit pas contenir le mot`); }
  }
  assert.equal(M.frTier('cp'), 'facile');
  assert.equal(M.frTier('cm2'), 'moyen');
  assert.equal(M.frTier('tle'), 'difficile');
});

test('vocabulaire d’anglais et d’espagnol : assez de mots jouables', () => {
  for (const id of ['en-p-vocabulaire', 'en-vocabulaire', 'es-vocabulario']) {
    const pairs = JSON.parse(readFileSync(W + `content/generators/${id}.json`, 'utf8')).data.pairs;
    const ok = pairs.map((p) => M.vocabAnswer(p.a)).filter((w) => M.playable(w));
    assert.ok(ok.length >= Math.min(40, pairs.length * 0.8), `${id} : ${ok.length}/${pairs.length} mots jouables`);
  }
});

test('points du mot mystère : 10, une fois par jour ; trophée', () => {
  assert.equal(G.XP.mot, 10);
  let game = G.withEvent(G.normalizeGame({}), 'mot', '2026-11-04', 1);
  game = G.withEvent(game, 'mot', '2026-11-04', 2);
  const c = G.computeGame([], game, 3);
  assert.equal(c.counters.mots, 1);
  assert.equal(c.totalXp, 10);
  assert.ok(c.trophies.find((t) => t.id === 'mot-1').earned);
});
