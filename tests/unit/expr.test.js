import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parse, evaluate, evalString, equivalent, equationsEquivalent, isDeveloped, isReduced, isFactored,
  isIrreducibleFraction, isSolvedForm, solveLinear, toText, formatNumber,
} from '../../app/js/core/expr.js';

test('lecture tolérante : virgule décimale, multiplication implicite, symboles', () => {
  assert.equal(evalString('3,5 + 1,5'), 5);
  assert.equal(evalString('2x', { x: 4 }), 8);
  assert.equal(evalString('3(x+1)', { x: 2 }), 9);
  assert.equal(evalString('(x+1)(x-1)', { x: 3 }), 8);
  assert.equal(evalString('2x²', { x: 3 }), 18);
  assert.equal(evalString('−4 × 3'), -12);
  assert.equal(evalString('12 ÷ 4'), 3);
  assert.equal(evalString('12 : 4'), 3);
  assert.equal(evalString('-3^2'), -9);
  assert.equal(evalString('(-3)^2'), 9);
  assert.equal(evalString('√16 + 1'), 5);
  assert.equal(evalString('pgcd(12;18)'), 6);
  assert.equal(evalString('pgcd(12, 18)'), 6);
  assert.equal(evalString('5!'), 120);
  assert.equal(evalString('|3-7|'), 4);
});

test('prédicats logiques pour les contenus', () => {
  assert.equal(evalString('v > 1/3 et v < 1/2', { v: 0.4 }), 1);
  assert.equal(evalString('v > 1/3 and v < 1/2', { v: 0.6 }), 0);
  assert.equal(evalString('non estpremier(n^2+n+41)', { n: 40 }), 1);
  assert.equal(evalString('non estpremier(n^2+n+41)', { n: 5 }), 0);
});

test('équivalence d\'expressions', () => {
  assert.ok(equivalent(parse('2(x+3)'), parse('2x+6')));
  assert.ok(!equivalent(parse('2(x+3)'), parse('2x+3')));
  assert.ok(equivalent(parse('(x+1)²'), parse('x²+2x+1')));
  assert.ok(equivalent(parse('1/3 + 1/6'), parse('1/2')));
});

test('formes : développée, réduite, factorisée, irréductible', () => {
  assert.ok(isReduced(parse('2x + 6')));
  assert.ok(isReduced(parse('-3x + 6')));
  assert.ok(isReduced(parse('x² - 5x + 6')));
  assert.ok(isReduced(parse('3x/2 + 1')));
  assert.ok(!isReduced(parse('2x + 3x')));
  assert.ok(!isReduced(parse('2*3x')));
  assert.ok(!isReduced(parse('x*x + 1')));
  assert.ok(!isDeveloped(parse('2(x+3)')));
  assert.ok(!isDeveloped(parse('-(x+1)')));
  assert.ok(isFactored(parse('2(x+3)')));
  assert.ok(isFactored(parse('(x+1)(x-1)')));
  assert.ok(isFactored(parse('(x+1)²')));
  assert.ok(!isFactored(parse('2x+6')));
  assert.ok(isIrreducibleFraction(parse('3/4')));
  assert.ok(isIrreducibleFraction(parse('-3/4')));
  assert.ok(!isIrreducibleFraction(parse('6/8')));
});

test('équations équivalentes et résolution', () => {
  const start = parse('3x + 5 = 2x - 7');
  assert.ok(equationsEquivalent(start, parse('3x - 2x = -7 - 5')));
  assert.ok(equationsEquivalent(start, parse('x = -12')));
  assert.ok(!equationsEquivalent(start, parse('3x - 2x = -7 + 5')));
  assert.ok(isSolvedForm(parse('x = -12')));
  assert.deepEqual(solveLinear(start), { kind: 'unique', x: -12 });
  assert.equal(solveLinear(parse('2x + 1 = 2x + 3')).kind, 'none');
  assert.equal(solveLinear(parse('2(x + 1) = 2x + 2')).kind, 'all');
});

test('affichage français', () => {
  assert.equal(formatNumber(-3.5), '−3,5');
  assert.equal(formatNumber(12345), '12\u202f345');
  assert.equal(toText(parse('2x^2 - 3(x+1)')), '2x² − 3(x + 1)');
});

test('séparateurs de milliers, notation scientifique', () => {
  assert.equal(evalString('2 700'), 2700);
  assert.equal(evalString('12 345,5'), 12345.5);
  assert.equal(evalString('1e6'), 1e6);
  assert.equal(evalString('3,2e-5'), 3.2e-5);
  assert.equal(evalString('2 x', { x: 3 }), 6);
});
