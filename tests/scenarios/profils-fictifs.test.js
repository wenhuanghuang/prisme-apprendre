/**
 * Scénarios : cinq élèves fictifs dont l'historique est rejoué dans le vrai moteur.
 * On vérifie que le diagnostic et les recommandations correspondent à leur situation,
 * et que les exercices proposés changent selon leurs difficultés.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_PROFILES, simulateProfile } from '../../app/js/engine/demo-profiles.js';
import { recommend } from '../../app/js/engine/recommend.js';
import { selectExercise, targetDifficulty } from '../../app/js/engine/select.js';
import { masteryLevel, applyAttempt, emptySkillState, DAY } from '../../app/js/engine/mastery.js';
import { loadAll, buildIndex } from '../../tools/validate-content.js';

const NOW = Date.UTC(2026, 9, 5, 16, 0, 0);
const raw = buildIndex(loadAll());
const realExercises = [...raw.exercises];
// Pour tester le moteur de recommandation indépendamment de l'avancement des contenus, on ajoute à chaque
// compétence des exercices génériques (un par rôle et par parcours). Les tests de sélection, eux, n'utilisent
// que les exercices réels.
const stubs = raw.skills.flatMap((s) => [['classe', 'guide'], ['classe', 'remediation'], ['classe', 'transfert'], ['classe', 'libre'], ['approfondissement', 'defi'], ['expert', 'defi']]
  .map(([track, role]) => ({ id: `stub-${s.id}-${track}-${role}`, skill: s.id, skills: [], track, role, difficulty: track === 'classe' ? 2 : 4, representation: 'symbolique', targets: [], justify: role === 'libre', type: 'numeric' })));
const index = { skills: new Map(raw.skills.map((s) => [s.id, s])), exercises: [...realExercises, ...stubs] };

const sim = Object.fromEntries(DEMO_PROFILES.map((d) => [d.profile.pseudo, simulateProfile(d, NOW)]));
const recsOf = (name) => recommend(index, sim[name].states.skills, { now: NOW, level: sim[name].profile.level });

test('Comète : la difficulté ancienne qui réapparaît passe en premier', () => {
  const st = sim['Comète'].states.skills['m5.relatifs.addition'];
  assert.ok(st.everMastered, 'la notion avait été maîtrisée');
  assert.ok(sim['Comète'].attempts.at(-1).resurgence, 'la dernière erreur est marquée comme résurgence');
  const recs = recsOf('Comète');
  assert.equal(recs[0].kind, 'resurgence');
  assert.equal(recs[0].skill, 'm5.relatifs.addition');
  assert.match(recs[0].reasonStudent, /revient/);
});

test('Nova : le moteur remonte au prérequis (distributivité simple)', () => {
  const recs = recsOf('Nova');
  assert.equal(recs[0].kind, 'prerequis');
  assert.equal(recs[0].skill, 'm5.litteral.distributivite');
  assert.equal(recs[0].forSkill, 'm4.litteral.double-distributivite');
  assert.ok(recs[0].query.maxDifficulty <= 2, 'exercice plus simple sur le prérequis');
  assert.match(recs[0].reasonParent, /prérequis/);
});

test('Orbite : réussite rapide et autonome → transfert et défi (approfondissement réussi → expert)', () => {
  const recs = recsOf('Orbite');
  const eq = recs.filter((r) => r.skill === 'm4.equations.resoudre');
  assert.ok(eq.some((r) => r.kind === 'transfert'));
  const defi = eq.find((r) => r.kind === 'defi');
  assert.ok(defi, 'un défi facultatif est proposé');
  assert.equal(defi.query.track, 'expert', 'deux réussites en approfondissement → expert');
  assert.match(defi.reasonStudent, /facultatif/);
  const pyth = recs.find((r) => r.skill === 'm4.pythagore.calcul' && r.kind === 'defi');
  assert.equal(pyth.query.track, 'approfondissement', 'sans réussite en approfondissement → approfondissement d’abord');
});

test('Quasar : réponses justes non justifiées → travailler l’explication', () => {
  const r = recsOf('Quasar').find((x) => x.skill === 'm5.litteral.expression');
  assert.equal(r.kind, 'expliquer');
  assert.ok(r.query.justify);
});

test('Pulsar : révision espacée arrivée à échéance + remédiation ciblée sur le calcul', () => {
  const st = sim['Pulsar'].states.skills['m5.fractions.addition'];
  assert.ok(st.due < NOW, 'révision échue');
  assert.ok(st.delayedSuccesses >= 1, 'au moins une réussite différée');
  const recs = recsOf('Pulsar');
  assert.ok(recs.some((r) => r.kind === 'revision' && r.skill === 'm5.fractions.addition'));
  const rem = recs.find((r) => r.kind === 'remediation' && r.skill === 'm4.equations.resoudre');
  assert.ok(rem, 'remédiation sur les équations');
  assert.equal(rem.evidence.type, 'calcul', 'erreur de calcul et non de méthode');
});

test('Chaque recommandation est expliquée à l’élève et au parent', () => {
  for (const name of Object.keys(sim)) {
    for (const r of recsOf(name)) {
      assert.ok(r.reasonStudent && r.reasonStudent.length > 30, `${name} ${r.kind}`);
      assert.ok(r.reasonParent && r.reasonParent.length > 20, `${name} ${r.kind}`);
    }
  }
});

test('Niveaux de maîtrise lisibles', () => {
  assert.equal(masteryLevel(sim['Orbite'].states.skills['m4.equations.resoudre'], NOW), 'consolide', 'réussie après 2 jours sans pratique');
  assert.equal(masteryLevel(sim['Orbite'].states.skills['m4.pythagore.calcul'], NOW), 'consolide');
  assert.equal(masteryLevel(sim['Nova'].states.skills['m4.litteral.double-distributivite'], NOW), 'fragile');
  assert.equal(masteryLevel(undefined, NOW), 'non-vu');
});

/* ---------- Les exercices changent selon les difficultés ---------- */

const pool = realExercises;

test('Deux échecs de suite : difficulté abaissée, autre représentation, exercice ciblant l’erreur', () => {
  const state = { pL: 0.55 };
  const session = [
    { exerciseId: 'm4-eq-g1', credit: 0, representation: 'symbolique', errorType: 'signe' },
    { exerciseId: 'm4-eq-g2', credit: 0.1, representation: 'symbolique', errorType: 'signe' },
  ];
  const before = targetDifficulty(state, []).difficulty;
  assert.equal(targetDifficulty(state, session).difficulty, before - 1);
  const pick = selectExercise(pool, { skill: 'm4.equations.resoudre', track: 'classe' }, state, session, [], () => 0.5);
  assert.notEqual(pick.exercise.representation, 'symbolique', 'changement de représentation');
  assert.ok(pick.exercise.targets.includes('signe'), 'exercice ciblant l’erreur de signe');
  assert.ok(pick.explanation.some((s) => /cran/.test(s)));
});

test('Trois réussites rapides : on monte d’un cran', () => {
  const state = { pL: 0.6 };
  const session = [0, 1, 2].map((i) => ({ exerciseId: `x${i}`, credit: 1, timeRatio: 0.5 }));
  assert.equal(targetDifficulty(state, session).difficulty, targetDifficulty(state, []).difficulty + 1);
});

test('Remédiation ciblée → exercice qui travaille précisément l’idée fausse', () => {
  const query = { skill: 'm4.equations.resoudre', track: 'classe', roles: ['remediation', 'guide', 'libre'], targets: ['mc:isoler-x'], maxDifficulty: 2 };
  const pick = selectExercise(pool, query, { pL: 0.3 }, [], [], () => 0.1);
  assert.ok(pick.exercise.targets.includes('mc:isoler-x'));
  assert.ok(pick.exercise.difficulty <= 2);
});

test('Élève très à l’aise : défi issu du parcours expert', () => {
  const defi = recsOf('Orbite').find((r) => r.skill === 'm4.equations.resoudre' && r.kind === 'defi');
  const pick = selectExercise(pool, defi.query, sim['Orbite'].states.skills['m4.equations.resoudre'], [], [], () => 0.3);
  assert.equal(pick.exercise.track, 'expert');
  assert.ok(pick.exercise.difficulty >= 4);
});

test('Réussite plusieurs jours après : la mémoire se consolide', () => {
  let s = emptySkillState('k');
  const t0 = NOW - 20 * DAY;
  for (let i = 0; i < 4; i++) s = applyAttempt(s, { ts: t0 + i * 600000, verdict: 'correct', score: 1, type: 'numeric' }).state;
  const stabBefore = s.stability;
  s = applyAttempt(s, { ts: t0 + 6 * DAY, verdict: 'correct', score: 1, type: 'numeric' }).state;
  assert.ok(s.stability > stabBefore * 2, 'la stabilité augmente fortement après une réussite différée');
  assert.equal(masteryLevel(s, t0 + 6 * DAY + 1000), 'consolide');
});

test('Une réussite avec indices et plusieurs essais compte moins qu’une réussite autonome', () => {
  const a = applyAttempt(emptySkillState('k'), { ts: NOW, verdict: 'correct', score: 1, type: 'steps' });
  const b = applyAttempt(emptySkillState('k'), { ts: NOW, verdict: 'correct', score: 1, hintsUsed: 2, tries: 3, type: 'steps' });
  assert.ok(a.state.pL > b.state.pL);
  assert.equal(a.state.autonomousSuccesses, 1);
  assert.equal(b.state.assistedSuccesses, 0, 'crédit trop faible pour compter comme réussite');
});

test('Après une idée fausse précise, l’exercice suivant la travaille (et redescend d’un cran)', () => {
  const session = [{ exerciseId: 'm4-eq-g1', credit: 0, representation: 'symbolique', errorType: 'notion', misconception: 'mc:isoler-x' }];
  const pick = selectExercise(pool, { skill: 'm4.equations.resoudre', track: 'classe' }, { pL: 0.55 }, session, [], () => 0.5);
  assert.ok(pick.exercise.targets.includes('mc:isoler-x'));
  assert.ok(pick.explanation.some((s) => /idée fausse/.test(s)));
});

test('Deux bonnes réponses ne suffisent pas pour déclarer une notion maîtrisée', () => {
  let s = emptySkillState('k');
  for (let i = 0; i < 2; i++) s = applyAttempt(s, { ts: NOW + i * 60000, verdict: 'correct', score: 1, type: 'numeric' }).state;
  assert.notEqual(masteryLevel(s, NOW + 120000), 'maitrise');
  s = applyAttempt(s, { ts: NOW + 180000, verdict: 'correct', score: 1, type: 'numeric' }).state;
  s = applyAttempt(s, { ts: NOW + 240000, verdict: 'correct', score: 1, type: 'numeric' }).state;
  assert.equal(masteryLevel(s, NOW + 300000), 'maitrise');
});

test('Un échec dans un parcours facultatif ne fait pas baisser la progression du programme', () => {
  let s = emptySkillState('k');
  for (let i = 0; i < 4; i++) s = applyAttempt(s, { ts: NOW + i * 60000, verdict: 'correct', score: 1, type: 'numeric' }).state;
  const before = s.pL;
  const after = applyAttempt(s, { ts: NOW + 600000, verdict: 'incorrect', score: 0, errorType: 'raisonnement', track: 'expert', type: 'counterexample' }).state;
  assert.equal(after.pL, before);
  assert.equal(after.recentErrors.length, 0, 'pas d’erreur comptée pour la remédiation du programme');
  assert.equal(after.optionalErrors.length, 1);
  const win = applyAttempt(s, { ts: NOW + 600000, verdict: 'correct', score: 1, track: 'expert', type: 'counterexample' }).state;
  assert.ok(win.pL >= before, 'une réussite facultative peut confirmer la maîtrise');
});

test('Nouveau profil : une nouvelle notion par matière, en commençant par les mathématiques', () => {
  const recs = recommend(index, {}, { now: NOW, level: '4e' }).filter((r) => r.kind === 'suite');
  assert.ok(recs.length >= 2 && recs.length <= 3);
  assert.equal(index.skills.get(recs[0].skill).subject, 'maths');
  const subjects = recs.map((r) => index.skills.get(r.skill).subject + ':' + r.skill.split('.')[0]);
  assert.equal(new Set(subjects.map((x) => x.split(':')[0] === 'transversal' ? x : x.split(':')[0])).size, recs.length, 'une seule par matière');
});
