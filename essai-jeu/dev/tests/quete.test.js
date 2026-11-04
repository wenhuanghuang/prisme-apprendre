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

test('album : une vignette par coffre, rare pour une quête ou une victoire, reproductible, complet sans doublon', () => {
  assert.equal(new Set(R.VIGNETTES.map((v) => v.id)).size, R.VIGNETTES.length);
  assert.ok(R.VIGNETTES.every((v) => v.icon && v.label && v.fact.length > 30));
  const ev = [{ type: 'defi', id: 'a:1', ts: 1 }, { type: 'quete', id: 'a', ts: 2 }, { type: 'lecon', id: 'l', ts: 3 }, { type: 'victoire', id: 'p:1', ts: 4 }];
  const a = R.albumOf(ev);
  assert.equal(a.owned.length, 3, 'une leçon ne donne pas de vignette');
  assert.equal(a.owned[0].vignette.rare, undefined);
  assert.equal(a.owned[1].vignette.rare, true);
  assert.equal(a.byEvent.get('quete:a'), a.owned[1].vignette);
  assert.deepEqual(R.albumOf([...ev].reverse()).owned.map((o) => o.vignette.id), a.owned.map((o) => o.vignette.id), 'ordre chronologique, pas l’ordre de la liste');
  const many = Array.from({ length: 140 }, (_, i) => ({ type: i % 3 ? 'defi' : 'victoire', id: `x${i}`, ts: i }));
  const full = R.albumOf(many);
  assert.ok(full.owned.slice(0, 48).every((o) => o.vignette.album === 'lumiere'), 'l’album de lumière se remplit d’abord');
  assert.ok(full.owned.slice(48).every((o) => o.vignette.album === 'animaux'), 'puis l’album des animaux');
  assert.equal(full.owned.length, R.VIGNETTES.length, 'album complet, sans doublon');
  assert.equal(new Set(full.owned.map((o) => o.vignette.id)).size, R.VIGNETTES.length);
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

const A = await import(W + 'engine/annee.js');
const day = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12).getTime(); };

test('année 2026-2027 : cinq périodes séparées par les vacances, période en cours et rythme', () => {
  assert.equal(A.schoolYearKey(day('2026-11-03')), '2026-2027');
  assert.equal(A.schoolYearKey(day('2027-06-30')), '2026-2027');
  assert.equal(A.schoolYearKey(day('2027-08-20')), '2027-2028');
  const cal = A.calendarOf('2026-2027');
  assert.equal(cal.approx, undefined, 'calendrier officiel');
  assert.equal(A.calendarOf('2031-2032').approx, true, 'autre année : dates approchées');
  const P = A.periodsOf(cal);
  assert.deepEqual(P.map((p) => p.days), [46, 47, 40, 40, 68]);
  const c1 = A.yearClock(cal, day('2026-11-03'));
  assert.equal(c1.current, 1); assert.equal(c1.holiday, false);
  assert.ok(c1.fraction > 0.18 && c1.fraction < 0.22);
  const c2 = A.yearClock(cal, day('2026-10-25'));
  assert.equal(c2.current, 1, 'pendant les vacances de la Toussaint : la période suivante');
  assert.equal(c2.holiday, true);
  assert.equal(A.yearClock(cal, day('2026-08-25')).fraction, 0);
  assert.equal(A.yearClock(cal, day('2027-07-20')).fraction, 1);
});

test('plan de l’année : chapitres dans l’ordre, répartis sur les périodes ; médailles et rythme', () => {
  const P = A.periodsOf(A.calendarOf('2026-2027'));
  const chapters = Array.from({ length: 15 }, (_, i) => ({ id: `c${i}`, title: `C${i}`, stages: i === 7 ? 0 : 2 }));
  const plan = A.planYear(chapters, P);
  const periods = plan.filter((c) => c.stages).map((c) => c.period);
  assert.deepEqual(periods, [...periods].sort((a, b) => a - b), 'les périodes suivent l’ordre du programme');
  assert.deepEqual([...new Set(periods)], [0, 1, 2, 3, 4], 'chaque période a des chapitres');
  assert.equal(plan[7].period, null, 'chapitre sans exercices : à venir');
  assert.equal(A.chapterStages(0, false), 0); assert.equal(A.chapterStages(4, false), 1); assert.equal(A.chapterStages(8, false), 2); assert.equal(A.chapterStages(3, true), 3);
  assert.equal(A.medalOf(0.2), null, 'parcourir en affichant les corrections ne donne pas de médaille');
  assert.equal(A.medalOf(0.3).id, 'bronze'); assert.equal(A.medalOf(0.6).id, 'argent'); assert.equal(A.medalOf(0.9).id, 'or');
  const clock = A.yearClock(A.calendarOf('2026-2027'), day('2026-11-03'));
  let pr = A.yearProgress(plan, {}, clock);
  assert.equal(pr.chapters, 14); assert.equal(pr.finished, 0); assert.equal(pr.next.id, 'c0');
  assert.equal(pr.nowChapter.period, 1, 'chapitre conseillé maintenant : dans la période en cours');
  const done = Object.fromEntries(plan.filter((c) => c.period === 0).map((c) => [c.id, { ratio: 0.9 }]));
  pr = A.yearProgress(plan, done, clock);
  assert.deepEqual(pr.periodDone, [true, false, false, false, false]);
  assert.equal(pr.complete, false);
  const all = Object.fromEntries(plan.filter((c) => c.stages).map((c) => [c.id, { ratio: 0.5 }]));
  assert.equal(A.yearProgress(plan, all, clock).complete, true);
  assert.equal(A.yearId('2026-2027', '5e', 'maths'), '2026-2027:5e:maths');
});

test('deux albums de 48 vignettes : coffres de période et d’année = vignettes rares', () => {
  assert.equal(R.VIGNETTES.length, 96);
  assert.deepEqual(R.ALBUMS.map((a) => R.VIGNETTES.filter((v) => v.album === a.id).length), [48, 48]);
  assert.deepEqual(R.ALBUMS.map((a) => R.VIGNETTES.filter((v) => v.album === a.id && v.rare).length), [12, 12]);
  assert.equal(new Set(R.VIGNETTES.map((v) => v.icon)).size, 96, 'une icône différente pour chaque vignette');
  const a = R.albumOf([{ type: 'periode', id: 'y:1', ts: 1 }, { type: 'annee', id: 'y', ts: 2 }, { type: 'chapitre', id: 'y:c', ts: 3 }]);
  assert.deepEqual(a.owned.map((o) => Boolean(o.vignette.rare)), [true, true], 'une médaille de chapitre ne donne pas de vignette');
  const g = G.computeGame([], { events: [{ type: 'chapitre', id: 'y:c', ts: 1 }, { type: 'periode', id: 'y:1', ts: 2 }, { type: 'annee', id: 'y', ts: 3 }] }, 10);
  assert.equal(g.totalXp, 20 + 50 + 100);
  assert.equal(g.counters.chapitres, 1);
  assert.ok(g.trophies.find((t) => t.id === 'annee-1').earned);
});
