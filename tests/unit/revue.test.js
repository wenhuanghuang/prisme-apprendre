/**
 * Non-régression des problèmes relevés par la revue de code du 05/10/2026.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { instantiate, check } from '../../app/js/core/checkers/index.js';
import { parse, solveLinear, equationsEquivalent, isReduced, evalString, toText } from '../../app/js/core/expr.js';
import { parseQuantity } from '../../app/js/core/units.js';
import { runProgram, sameDrawing } from '../../app/js/core/turtle.js';
import { applyAttempt, emptySkillState, normalizeStates } from '../../app/js/engine/mastery.js';
import { targetDifficulty } from '../../app/js/engine/select.js';
import { validateBackup, buildBackup } from '../../app/js/storage/backup.js';
import { train, distribution } from '../../app/js/activities/bigram-lab.js';

const run = (def, response, seed = 5) => check(instantiate(def, seed), response);

test('calcul pas à pas : « A = … », égalités chaînées et lettre x pour « fois » sont acceptés', () => {
  const def = { id: 'c', type: 'steps', mode: 'calcul', start: '7 + 8 * 3' };
  assert.equal(run(def, { lines: ['A = 7 + 8 × 3', 'A = 7 + 24', 'A = 31'] }).verdict, 'correct');
  assert.equal(run(def, { lines: ['7 + 8 x 3', '7 + 24', '31'] }).verdict, 'correct');
  assert.equal(run(def, { lines: ['7 + 8 × 3 = 7 + 24', '31'] }).verdict, 'correct');
  assert.equal(run(def, { lines: ['A = 15 × 3', 'A = 45'] }).errorType, 'calcul', 'une vraie erreur reste détectée');
});

test('grandeurs : durées « 2 h 00 », « 7 min 30 s », fractions, unité inconnue', () => {
  assert.equal(parseQuantity('2h00').value, 2);
  assert.equal(parseQuantity('1 h 30').value, 1.5);
  assert.equal(parseQuantity('7 min 30 s').value, 7.5);
  assert.equal(parseQuantity('7/4 h').value, 1.75);
  assert.ok(parseQuantity('12 trucs').unknownUnit);
  assert.equal(run({ id: 'h', type: 'numeric', answer: 2, unit: 'h' }, { value: '2 h 00' }).verdict, 'correct');
  assert.equal(run({ id: 'm', type: 'numeric', answer: 7.5, unit: 'min' }, { value: '7 min 30 s' }).verdict, 'correct');
  assert.equal(run({ id: 'v', type: 'numeric', answer: 36, unit: 'km/h' }, { value: '36 Km/h' }).verdict, 'correct');
  assert.equal(run({ id: 'u', type: 'numeric', answer: 2, unit: 'h' }, { value: '2 trucs' }).verdict, 'illisible');
  assert.equal(run({ id: 'k', type: 'numeric', answer: 293, unit: 'K' }, { value: '293 °C' }).errorType, 'unite', '°C et K ne sont pas confondus');
});

test('une réponse « incertaine » ne fait pas baisser la maîtrise', () => {
  let s = emptySkillState('k');
  for (let i = 0; i < 4; i++) s = applyAttempt(s, { ts: i, verdict: 'correct', score: 1, type: 'text' }).state;
  const after = applyAttempt(s, { ts: 10, verdict: 'incertain', score: 0, type: 'text' }).state;
  assert.equal(after.pL, s.pL);
  assert.equal(after.failStreak, 0);
  assert.equal(targetDifficulty({ pL: 0.6 }, [{ credit: null }, { credit: null }]).consecutiveFails, 0);
});

test('problème composé dont toutes les questions relèvent d’un adulte : à valider, pas « correct »', () => {
  const def = { id: 'o', type: 'composite', parts: [{ type: 'open', criteria: [] }, { type: 'open', criteria: [] }] };
  assert.equal(run(def, { parts: [{ text: 'une réponse' }, { text: 'une autre' }] }).verdict, 'a-valider');
});

test('tortue : distances infinies ou démesurées refusées, grands dessins comparés vite', () => {
  assert.throws(() => runProgram('avance 1/0'), /impossible/);
  assert.throws(() => runProgram('avance 10000000'), /trop grande/);
  const big = runProgram('avance 90000');
  const t = Date.now();
  assert.ok(sameDrawing(big.segments, big.segments));
  assert.ok(Date.now() - t < 2000);
});

test('équation à inventer : les fausses identités sont détectées (√(x²) = x)', () => {
  assert.equal(solveLinear(parse('sqrt(x^2) = x')).kind, 'nonlinear');
  assert.equal(solveLinear(parse('|x| + x = 2x')).kind, 'nonlinear');
  assert.equal(solveLinear(parse('2(x + 3) = 2x + 6')).kind, 'all');
  const d = run({ id: 'id', type: 'equation', expectKind: 'all', varBothSides: true }, { value: 'sqrt(x^2) = x' });
  assert.equal(d.errorType, 'raisonnement');
  assert.match(d.feedback, /−3/);
});

test('identités dans les équations pas à pas, « 0 » réduit, factorielle', () => {
  assert.ok(equationsEquivalent(parse('2x + 2 = 2x + 2'), parse('0 = 0')));
  assert.ok(isReduced(parse('0')));
  assert.equal(evalString('3! = 6'), 1);
});

test('pollution de prototype : un mot « __proto__ » ne corrompt pas le moteur', () => {
  const table = train(['__proto__', 'x', 'constructor', 'y']);
  assert.equal(distribution(table, '__proto__')[0].word, 'x');
  assert.equal(({}).x, undefined);
  assert.equal(toText(parse('2x+1')), '2x + 1');
  assert.throws(() => evalString('constructor'));
});

test('sauvegarde abîmée : les états sont reconstruits, les réponses sans versions écartées', () => {
  const file = buildBackup([{
    profile: { id: 'p1', pseudo: 'Test', level: '4e' },
    states: { skills: { 'm4.puissances': { pL: 'beaucoup', recentErrors: 'oui', n: 3 } } },
    attempts: [{ ts: 1, skill: 'm4.puissances', credit: 'x' }, { nimporte: true }],
    submissions: [{ id: 'p1::e', skill: 'k' }, { id: 'p1::f', skill: 'k', versions: [{ ts: 1 }] }],
  }]);
  const v = validateBackup(file);
  const p = v.profiles[0];
  const st = p.states.skills['m4.puissances'];
  assert.equal(typeof st.pL, 'number');
  assert.ok(Array.isArray(st.recentErrors));
  assert.equal(st.n, 3);
  assert.equal(p.attempts.length, 1);
  assert.equal(p.attempts[0].credit, 0);
  assert.equal(p.submissions.length, 1);
  assert.equal(normalizeStates(null, 'x').profileId, 'x');
});

test('QCM à plus de 10 choix : tri numérique des réponses', () => {
  const choices = Array.from({ length: 12 }, (_, i) => ({ text: `c${i}`, correct: i === 2 || i === 10 }));
  assert.equal(run({ id: 'q', type: 'qcm', multiple: true, choices }, { selected: [10, 2] }).verdict, 'correct');
});

test('pourcentages : « 0,85 % » n’est pas 0,85', () => {
  assert.equal(run({ id: 'p', type: 'numeric', answer: 0.85 }, { value: '0,85 %' }).verdict, 'incorrect');
  assert.equal(run({ id: 'p2', type: 'numeric', answer: 0.85 }, { value: '85 %' }).verdict, 'correct');
  assert.equal(run({ id: 'p3', type: 'numeric', answer: 85 }, { value: '85 %' }).verdict, 'correct');
});

test('variables : « 2X + 3 » vaut « 2x + 3 »', () => {
  assert.equal(run({ id: 'v', type: 'expression', answer: '2x + 3' }, { value: '2X + 3' }).verdict, 'correct');
});
