import { test } from 'node:test';
import assert from 'node:assert/strict';
import { instantiate, check } from '../../app/js/core/checkers/index.js';
import { runProgram, sameDrawing } from '../../app/js/core/turtle.js';
import { convert, parseQuantity } from '../../app/js/core/units.js';

const run = (def, response, seed = 7) => check(instantiate(def, seed), response);

test('numérique : juste, signe, idée fausse déclarée, puissance de 10', () => {
  const def = {
    id: 't1', type: 'numeric', prompt: 'Calcule {a} − ({b})', params: { a: { int: [2, 9] }, b: { int: [-9, -2] } },
    answer: 'a - b',
    misconceptions: [{ answer: 'a + b', id: 'mc:moins-negatif', error: 'notion', feedback: 'Soustraire un négatif revient à ajouter son opposé.' }],
  };
  const inst = instantiate(def, 3);
  const { a, b } = inst.params;
  assert.equal(check(inst, { value: String(a - b) }).verdict, 'correct');
  const mc = check(inst, { value: String(a + b) });
  assert.equal(mc.errorType, 'notion');
  assert.equal(mc.misconception, 'mc:moins-negatif');
  assert.equal(check(inst, { value: String(-(a - b)) }).errorType, 'signe');
  assert.equal(check(inst, { value: String((a - b) * 10) }).errorType, 'calcul');
  assert.equal(check(inst, { value: 'abc(' }).verdict, 'illisible');
});

test('grandeur avec unité : conversion acceptée, unité manquante, mauvaise dimension', () => {
  const def = { id: 't2', type: 'numeric', answer: 2.7, unit: 'g/cm³', rel: 0.02 };
  assert.equal(run(def, { value: '2,7 g/cm3' }).verdict, 'correct');
  assert.equal(run(def, { value: '2700 kg/m³' }).verdict, 'correct');
  assert.equal(run(def, { value: '2,7' }).errorType, 'unite');
  assert.equal(run(def, { value: '2,7 kg' }).errorType, 'unite');
  assert.equal(run(def, { value: '27 g/cm3' }).errorType, 'unite');
  assert.equal(convert(36, 'km/h', 'm/s'), 10);
  assert.equal(parseQuantity('3×10^8 m/s').value, 3e8);
});

test('expression : forme demandée et diagnostic de coefficient', () => {
  const def = {
    id: 't3', type: 'expression', form: 'developpee-reduite', answer: '(x + 3)(x - 2)',
    misconceptions: [{ answer: 'x^2 - 6', id: 'mc:double-distrib-partielle', error: 'notion', feedback: 'Il manque les produits croisés.' }],
  };
  assert.equal(run(def, { value: 'x² + x − 6' }).verdict, 'correct');
  assert.equal(run(def, { value: '(x+3)(x-2)' }).errorType, 'forme');
  assert.equal(run(def, { value: 'x² + 3x − 2x − 6' }).errorType, 'forme');
  assert.equal(run(def, { value: 'x² − 6' }).misconception, 'mc:double-distrib-partielle');
  assert.equal(run(def, { value: 'x² − x − 6' }).errorType, 'signe');
  assert.equal(run(def, { value: 'x² + x − 5' }).errorType, 'calcul');
});

test('équation étape par étape : étapes justes, erreur de transposition, erreur pour isoler x', () => {
  const def = { id: 't4', type: 'steps', mode: 'equation', start: '3x + 5 = 2x - 7' };
  const ok = run(def, { lines: ['3x - 2x = -7 - 5', 'x = -12'] });
  assert.equal(ok.verdict, 'correct');
  assert.equal(ok.stepsOk, 2);
  const sign = run(def, { lines: ['3x - 2x = -7 + 5', 'x = -2'] });
  assert.equal(sign.errorType, 'signe');
  assert.equal(sign.firstBadStep, 0);
  const def2 = { id: 't5', type: 'steps', mode: 'equation', start: '4x - 3 = 9' };
  const iso = run(def2, { lines: ['4x = 12', 'x = 8'] });
  assert.equal(iso.errorType, 'notion');
  assert.equal(iso.firstBadStep, 1);
  assert.equal(iso.stepsOk, 1);
  const short = run(def2, { lines: ['x = 3'] });
  assert.equal(short.errorType, 'sans-justification');
  const unfinished = run(def2, { lines: ['4x = 12'] });
  assert.equal(unfinished.errorType, 'forme');
});

test('calcul étape par étape avec idée fausse sur les priorités', () => {
  const def = {
    id: 't6', type: 'steps', mode: 'calcul', start: '2 + 3 × 4',
    misconceptions: [{ answer: '20', id: 'mc:priorites', error: 'notion', feedback: 'La multiplication est prioritaire.' }],
  };
  assert.equal(run(def, { lines: ['2 + 12', '14'] }).verdict, 'correct');
  assert.equal(run(def, { lines: ['5 × 4', '20'] }).misconception, 'mc:priorites');
});

test('contre-exemple : vérifié par le calcul, retour précis sinon', () => {
  const def = {
    id: 't7', type: 'counterexample', claim: 'Pour tout entier n ≥ 0, n² + n + 41 est premier.',
    vars: ['n'], domain: 'n >= 0 and estentier(n)', refutes: 'non estpremier(n^2+n+41)', show: 'n^2+n+41',
  };
  assert.equal(run(def, { values: { n: '40' } }).verdict, 'correct');
  const no = run(def, { values: { n: '5' } });
  assert.equal(no.verdict, 'incorrect');
  assert.match(no.feedback, /71/);
  assert.equal(run(def, { values: { n: '-3' } }).errorType, 'lecture');
  assert.equal(run(def, { claimTrue: true }).errorType, 'raisonnement');
});

test('plusieurs réponses valables', () => {
  const def = { id: 't8', type: 'multi', count: 3, predicate: 'v > 1/3 and v < 1/2', distinct: true };
  assert.equal(run(def, { values: ['2/5', '3/7', '0,45'] }).verdict, 'correct');
  const partial = run(def, { values: ['2/5', '4/10', '3/5'] });
  assert.equal(partial.verdict, 'partiel');
});

test('réponse rédigée : jamais déclarée fausse, validation humaine', () => {
  const def = { id: 't9', type: 'open', criteria: [{ id: 'c1', label: 'Cite le théorème', keywords: ['pythagore'] }], minWords: 5 };
  const d = run(def, { text: 'On utilise le théorème de Pythagore dans le triangle rectangle.', selfCheck: { c1: true } });
  assert.equal(d.verdict, 'a-valider');
  assert.equal(d.needsHuman, true);
  assert.equal(d.details[0].detected, true);
});

test('justification exigée : réponse juste mais non justifiée', () => {
  const def = { id: 't10', type: 'numeric', answer: 12, justify: { required: true, minWords: 5 } };
  assert.equal(run(def, { value: '12' }).errorType, 'sans-justification');
  assert.equal(run(def, { value: '12', justification: "J'ai multiplié 3 par 4 car il y a 3 paquets de 4." }).verdict, 'correct');
});

test('frise, droite graduée, repère, QCM', () => {
  const order = { id: 'o', type: 'order', items: [{ id: 'a', label: '1789' }, { id: 'b', label: '1792' }, { id: 'c', label: '1799' }] };
  assert.equal(run(order, { order: ['a', 'b', 'c'] }).verdict, 'correct');
  assert.equal(run(order, { order: ['b', 'a', 'c'] }).verdict, 'partiel');
  const nl = { id: 'n', type: 'numberline', points: [{ label: 'A', value: '-3/2' }, { label: 'B', value: '2' }] };
  assert.equal(run(nl, { positions: { A: -1.5, B: 2 } }).verdict, 'correct');
  assert.equal(run(nl, { positions: { A: 1.5, B: 2 } }).errorType, 'signe');
  const g = { id: 'g', type: 'graph', expectedPoints: [[2, 3], [-1, 4]] };
  assert.equal(run(g, { points: [[2, 3], [-1, 4]] }).verdict, 'correct');
  assert.equal(run(g, { points: [[3, 2], [4, -1]] }).errorType, 'lecture');
  const q = { id: 'q', type: 'qcm', choices: [{ text: 'A', correct: true }, { text: 'B', error: 'notion', feedback: 'non' }] };
  assert.equal(run(q, { selected: [0] }).verdict, 'correct');
  assert.equal(run(q, { selected: [1] }).errorType, 'notion');
});

test('tortue : interprétation, boucle, procédure, comparaison de dessins', () => {
  const square = runProgram('répète 4 [ avance 100 droite 90 ]');
  assert.equal(square.segments.length, 4);
  const longSquare = runProgram('avance 100\ndroite 90\navance 100\ndroite 90\navance 100\ndroite 90\navance 100');
  assert.ok(sameDrawing(square.segments, longSquare.segments));
  const leftSquare = runProgram('répète 4 [ avance 100 gauche 90 ]');
  assert.ok(sameDrawing(square.segments, leftSquare.segments), 'symétrique accepté');
  const proc = runProgram('pour carre c [ répète 4 [ avance c droite 90 ] ]\ncarre 100');
  assert.ok(sameDrawing(square.segments, proc.segments));
  const tri = runProgram('répète 3 [ avance 100 droite 120 ]');
  assert.ok(!sameDrawing(square.segments, tri.segments));
  assert.throws(() => runProgram('répète 4 [ avance 100'), /manquant/);
  const def = { id: 'c', type: 'code', reference: 'répète 4 [ avance 100 droite 90 ]', constraints: { maxInstructions: 3 } };
  assert.equal(run(def, { program: 'répète 4 [ avance 100 droite 90 ]' }).verdict, 'correct');
  assert.equal(run(def, { program: longSquare && 'avance 100\ndroite 90\navance 100\ndroite 90\navance 100\ndroite 90\navance 100' }).errorType, 'methode');
});

test('tortue : variables de plusieurs lettres, expressions avec espaces, procédures', () => {
  assert.equal(runProgram('pour carre taille [ répète 4 [ avance taille droite 90 ] ]\ncarre 80').segments.length, 4);
  assert.equal(runProgram('mets c à 10\nsi c > 5 [ avance c + 5 ] sinon [ avance 1 ]').segments[0].x2, 15);
  assert.equal(runProgram('mets c à 3\nrépète 3 [ ajoute 2 à c ]\navance (c + 5) * 2').segments[0].x2, 28);
  assert.equal(runProgram('avance 50 droite 90 avance 50').segments.length, 2);
});

test('code : idée fausse reconnue par son dessin, consigne « utilise répète » insensible aux accents', () => {
  const def = {
    id: 'tri', type: 'code', reference: 'répète 3 [ avance 100 droite 120 ]', codeConstraints: { mustUse: ['répète'] },
    misconceptions: [{ program: 'répète 3 [ avance 100 droite 60 ]', id: 'mc:angle-interieur', error: 'notion', feedback: 'On tourne de l’angle extérieur.' }],
  };
  assert.equal(run(def, { program: 'repete 3 [ avance 100 droite 120 ]' }).verdict, 'correct');
  assert.equal(run(def, { program: 'répète 3 [ avance 100 droite 60 ]' }).misconception, 'mc:angle-interieur');
  assert.equal(run(def, { program: 'avance 100 droite 120 avance 100 droite 120 avance 100' }).errorType, 'methode');
});

test('pourcentages et tolérance des idées fausses', () => {
  assert.equal(run({ id: 'p', type: 'numeric', answer: 85 }, { value: '85 %' }).verdict, 'correct');
  assert.equal(run({ id: 'p2', type: 'numeric', answer: 0.85 }, { value: '85 %' }).verdict, 'correct');
  const def = { id: 'p3', type: 'numeric', answer: '1/3', tolerance: 0.01, misconceptions: [{ answer: '1/8', id: 'mc:x', error: 'notion' }] };
  assert.equal(run(def, { value: '0,33' }).verdict, 'correct');
  assert.equal(run(def, { value: '0,12' }).misconception, 'mc:x');
});

test('grandeur : unité oubliée = réponse partielle, année-lumière', () => {
  const d = run({ id: 'u', type: 'numeric', answer: 2.7, unit: 'g/cm³', rel: 0.02 }, { value: '2,7' });
  assert.equal(d.verdict, 'partiel');
  assert.equal(d.errorType, 'unite');
  assert.equal(run({ id: 'al', type: 'numeric', answer: 9.461e15, unit: 'm', rel: 0.01 }, { value: '1 a.l.' }).verdict, 'correct');
});

test('numérique : un calcul non effectué n’est pas un résultat ; écriture scientifique acceptée', () => {
  assert.equal(run({ id: 'p5', type: 'numeric', answer: 32 }, { value: '2^5' }).errorType, 'forme');
  assert.equal(run({ id: 'p5b', type: 'numeric', answer: 32 }, { value: '32' }).verdict, 'correct');
  assert.equal(run({ id: 'sc', type: 'numeric', answer: 3e8 }, { value: '3 × 10^8' }).verdict, 'correct');
  assert.equal(run({ id: 'fr', type: 'numeric', answer: 0.75 }, { value: '3/4' }).verdict, 'correct');
  assert.equal(run({ id: 'cst', type: 'expression', answer: '12', form: 'nombre' }, { value: '13' }).feedback.includes('terme constant'), false);
});
