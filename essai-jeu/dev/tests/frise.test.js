/** Frise chronologique : emplacements valides, vies, tours à deux, étoiles, points une fois par jour ; nouvelles frises CE2, 6e, 3e. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const W = fileURLToPath(new URL('../../', import.meta.url));
const F = await import(W + 'js/engine/frise.js');
const G = await import(W + 'js/engine/game.js');
const { generateFromData, canonicalResponse, DATA_TRACKS } = await import(W + 'js/generators/data-kinds.js');
const { instantiate, check } = await import(W + 'js/core/checkers/index.js');
const { validateExercise } = await import(W + 'js/content/validate.js');

const EV = [{ label: 'Lascaux', year: -15000, circa: true }, { label: 'Alésia', year: -52 }, { label: 'Charlemagne', year: 800 }, { label: 'Marignan', year: 1515 }, { label: 'Bastille', year: 1789 }, { label: 'Lune', year: 1969 }];
// tirage déterministe : l'ordre des cartes est celui de la liste (le mélange de Fisher-Yates avec rand = 0.999… ne change rien)
const keep = () => 0.9999;

test('années lisibles', () => {
  assert.equal(F.yearLabel({ year: 1789 }), '1789');
  assert.equal(F.yearLabel({ year: -52 }), '52 av. J.-C.');
  assert.equal(F.yearLabel({ year: -300000, circa: true }), 'vers 300 000 av. J.-C.');
});

test('emplacements valides, y compris à égalité d’année', () => {
  const line = [{ year: 800 }, { year: 1515 }, { year: 1789 }];
  assert.deepEqual(F.validSlots(line, -52), [0]);
  assert.deepEqual(F.validSlots(line, 1600), [2]);
  assert.deepEqual(F.validSlots(line, 2000), [3]);
  assert.deepEqual(F.validSlots(line, 1515), [1, 2]);
});

test('seul : bonne place, erreur (la carte rejoint sa vraie place), vies et fin', () => {
  const f = F.newFrise(EV, { rand: keep });
  assert.equal(f.line.length, 1);
  assert.equal(f.line[0].label, 'Lascaux');
  assert.equal(F.currentCard(f).label, 'Alésia');
  assert.equal(F.place(f, 1).ok, true);
  const r = F.place(f, 0); // Charlemagne avant Lascaux : faux
  assert.equal(r.ok, false);
  assert.equal(r.at, 2);
  assert.deepEqual(f.line.map((e) => e.label), ['Lascaux', 'Alésia', 'Charlemagne']);
  assert.ok(f.line[2].missed);
  assert.equal(f.lives, F.FRISE_LIVES - 1);
  F.place(f, 0); F.place(f, 0);
  assert.equal(f.lives, 0);
  assert.ok(F.isOver(f), 'plus de vies');
  assert.equal(F.place(f, 0), null);
  assert.equal(F.friseStars(f), 1);
  const g = F.newFrise(EV, { rand: keep });
  for (let i = 1; i < EV.length; i++) F.place(g, g.line.length);
  assert.ok(F.isOver(g));
  assert.equal(g.players[0].score, 5);
  assert.equal(F.friseStars(g), 3);
});

test('à deux : chacun son tour, pas de vies, gagnant', () => {
  const f = F.newFrise(EV, { players: ['Léa', 'Tom'], rand: keep });
  F.place(f, 1); // Léa : juste
  assert.equal(f.turn, 1);
  F.place(f, 0); // Tom : faux
  assert.equal(f.turn, 0);
  assert.equal(f.lives, F.FRISE_LIVES, 'les vies ne comptent qu’en solo');
  while (!F.isOver(f)) F.place(f, f.line.length);
  assert.deepEqual(f.players.map((p) => p.score), [3, 1]);
  assert.deepEqual(F.friseWinners(f).map((p) => p.name), ['Léa']);
});

test('événements distincts : pas deux fois le même intitulé ni la même année', () => {
  const ev = F.distinctEvents([...EV, { label: 'Bastille', year: 1790 }, { label: 'Autre', year: 1789 }, { label: '', year: 3 }, { label: 'X', year: 'abc' }], 20);
  assert.equal(ev.length, EV.length);
  assert.equal(new Set(ev.map((e) => e.year)).size, ev.length);
});

test('points de la frise : 10, une fois par jour ; trophée', () => {
  assert.equal(G.XP.frise, 10);
  let game = G.withEvent(G.normalizeGame({}), 'frise', '2026-11-04', 1);
  game = G.withEvent(game, 'frise', '2026-11-04', 2);
  const g = G.computeGame([], game, 3);
  assert.equal(g.counters.frises, 1);
  assert.equal(g.totalXp, 10);
  assert.ok(g.trophies.find((t) => t.id === 'frise-1').earned);
});

const ix = JSON.parse(readFileSync(W + 'content/index.json', 'utf8'));
const skillIds = new Set(ix.skills.map((s) => s.id));
for (const [id, subjectLv] of [['hg-p-chrono-ce2', 'hg-ce2'], ['hg6-chronologie', 'hg-6e'], ['hg3-chronologie', 'hg-3e']]) {
  test(`frise ${id} : chapitres, tirages, mode imposé`, () => {
    const g = JSON.parse(readFileSync(W + `content/generators/${id}.json`, 'utf8'));
    const chapters = new Set(JSON.parse(readFileSync(W + `content/courses/${subjectLv}.json`, 'utf8')).chapters.map((c) => c.id));
    for (const ch of g.chapters) assert.ok(chapters.has(ch), `${id} : chapitre ${ch}`);
    assert.ok(ix.generators.some((x) => x.id === id), 'dans l’index');
    assert.ok(skillIds.has(g.skill));
    for (const tier of DATA_TRACKS) {
      for (let seed = 1; seed <= 40; seed++) {
        const def = generateFromData(g, seed, { parcours: tier });
        const where = `${id} [${tier}] #${seed}`;
        if (g.data.mode === 'frise') assert.equal(def.type, 'order', `${where} : seulement des frises à ranger`);
        assert.ok(!/undefined|NaN|\[object|-\d{3}/.test(JSON.stringify(def.solution)), `${where} : ${def.solution}`);
        assert.deepEqual(validateExercise({ ...def, selfTest: [{ response: canonicalResponse(def), expect: 'correct' }] }, skillIds), [], where);
        assert.equal(check(instantiate(def, seed), canonicalResponse(def)).verdict, 'correct', where);
      }
    }
  });
}
