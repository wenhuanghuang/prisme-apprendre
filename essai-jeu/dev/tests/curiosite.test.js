/** Énigme du jour, pauses et points de curiosité. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
const W = new URL('../../js/', import.meta.url).href;
const E = await import(W + 'engine/enigme.js');
const G = await import(W + 'engine/game.js');
const P = await import(W + 'ui/game/pause.js');

const t = (k, h = 12) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, h).getTime(); };

test('énigme : même graine pour un jour et une classe ; la matière change chaque jour', () => {
  assert.equal(E.daySeed('2026-11-04', '5e', 'maths'), E.daySeed('2026-11-04', '5e', 'maths'));
  assert.notEqual(E.daySeed('2026-11-04', '5e', 'maths'), E.daySeed('2026-11-05', '5e', 'maths'));
  const subjects = ['maths', 'francais', 'hg', 'svt'];
  const seen = new Set(['2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07'].map((k) => E.subjectOfDay(k, subjects)));
  assert.equal(seen.size, 4, 'quatre jours de suite, quatre matières');
  assert.equal(E.subjectOfDay('2026-11-04', []), null);
});

test('série d’énigmes : jours consécutifs ; aujourd’hui pas encore fait ne casse pas la série ; un jour sauté la remet à zéro', () => {
  const ev = (ids) => ids.map((id) => ({ type: 'enigme', id, ts: t(id) }));
  assert.deepEqual(E.enigmaStreak(ev(['2026-11-02', '2026-11-03']), t('2026-11-04')), { streak: 2, total: 2, solvedToday: false });
  assert.deepEqual(E.enigmaStreak(ev(['2026-11-02', '2026-11-03', '2026-11-04']), t('2026-11-04')), { streak: 3, total: 3, solvedToday: true });
  assert.equal(E.enigmaStreak(ev(['2026-11-01', '2026-11-02']), t('2026-11-04')).streak, 0);
  assert.equal(E.enigmaStreak([{ type: 'lecon', id: '2026-11-04', ts: 1 }], t('2026-11-04')).total, 0);
});

test('« Le savais-tu ? » : trente curiosités, une par jour, de la matière du jour si possible', () => {
  assert.equal(E.FACTS.length, 30);
  assert.ok(E.FACTS.every((f) => f.text.length > 30 && f.text.length < 160));
  assert.equal(E.factOfDay('2026-11-04', 'hg').subject, 'hg');
  assert.ok(E.factOfDay('2026-11-04', 'eps'), 'matière sans curiosité : une autre');
});

test('points et trophées : énigme 10 points une fois par jour ; 7 énigmes = Esprit curieux', () => {
  let game = G.normalizeGame({});
  for (let d = 1; d <= 8; d++) game = G.withEvent(game, 'enigme', `2026-11-${String(d).padStart(2, '0')}`, t(`2026-11-${String(d).padStart(2, '0')}`));
  game = G.withEvent(game, 'enigme', '2026-11-08', t('2026-11-08', 18));
  assert.equal(game.events.length, 8, 'une seule énigme comptée par jour');
  const g = G.computeGame([], game, t('2026-11-08', 20));
  assert.equal(g.totalXp, 80);
  assert.ok(g.trophies.find((x) => x.id === 'enigme-7').earned);
});

test('pause : proposée après 25 minutes sans coupure, pas après une vraie pause, puis au plus toutes les 20 minutes', () => {
  const at = (min) => t('2026-11-04', 14) + min * 60000;
  const every2 = (from, to) => Array.from({ length: Math.floor((to - from) / 2) + 1 }, (_, k) => ({ ts: at(from + 2 * k) }));
  const s30 = every2(0, 30);
  assert.equal(P.breakDue(s30.slice(0, 10), at(18)), false, '18 minutes : trop tôt');
  assert.equal(P.breakDue(s30, at(30)), true, '30 minutes sans coupure');
  const withGap = [...every2(0, 14), ...every2(21, 40)]; // 7 minutes sans rien : la séance repart à 21 min
  assert.equal(P.breakDue(withGap, at(40)), false);
  assert.equal(P.sessionStart(withGap, at(40)), at(21));
  assert.equal(P.breakDue(every2(0, 40), at(40), at(30)), false, 'proposée à 30 min : pas avant 50 min');
  assert.equal(P.breakDue(every2(0, 50), at(50), at(30)), true);
});
