import { test } from 'node:test';
import assert from 'node:assert/strict';
import { instantiate, check } from '../../app/js/core/checkers/index.js';
import { tokenizeHighlight } from '../../app/js/core/checkers/language.js';

const run = (def, response) => check(instantiate(def, 1), response);

test('surligner : découpage, cibles entre crochets, apostrophes', () => {
  const words = tokenizeHighlight("L'[immense] arbre [vert] [a poussé] près de l'école.").filter((t) => t.word);
  assert.deepEqual(words.map((t) => t.text), ["L'", 'immense', 'arbre', 'vert', 'a poussé', 'près', 'de', "l'", 'école']);
  assert.deepEqual(words.filter((t) => t.target).map((t) => t.index), [1, 3, 4]);
});

test('surligner : juste, oubli, mot en trop avec idée fausse', () => {
  const def = { id: 'h', type: 'highlight', text: 'Le [petit] chat [noir] dort.', misconceptions: [{ word: 'chat', id: 'mc:nom-adjectif', error: 'notion', feedback: 'Chat est un nom.' }] };
  assert.equal(run(def, { selected: [1, 3] }).verdict, 'correct');
  assert.equal(run(def, { selected: [1] }).verdict, 'partiel');
  const d = run(def, { selected: [1, 2, 3] });
  assert.equal(d.misconception, 'mc:nom-adjectif');
  assert.match(d.feedback, /en trop/);
});

test('associer et classer', () => {
  const m = { id: 'm', type: 'match', left: [{ id: 'a', label: 'cœur' }, { id: 'b', label: 'poumons' }], right: [{ id: '1', label: 'pompe le sang' }, { id: '2', label: 'échanges gazeux' }], pairs: { a: '1', b: '2' } };
  assert.equal(run(m, { pairs: { a: '1', b: '2' } }).verdict, 'correct');
  assert.equal(run(m, { pairs: { a: '2', b: '1' } }).verdict, 'incorrect');
  const c = { id: 'c', type: 'categorize', categories: [{ id: 'r', label: 'Renouvelable' }, { id: 'n', label: 'Non renouvelable' }], items: [{ id: 'i1', label: 'vent', category: 'r' }, { id: 'i2', label: 'pétrole', category: 'n' }], misconceptions: [{ item: 'i2', category: 'r', id: 'mc:fossile', error: 'notion', feedback: 'Le pétrole met des millions d’années à se former.' }] };
  assert.equal(run(c, { assign: { i1: 'r', i2: 'n' } }).verdict, 'correct');
  assert.equal(run(c, { assign: { i1: 'r', i2: 'r' } }).misconception, 'mc:fossile');
});

test('dictée : alignement mot à mot, accents, mots oubliés', () => {
  const def = { id: 'd', type: 'dictation', answer: 'Les élèves sont allés à la bibliothèque.', misconceptions: [{ word: 'allé', id: 'mc:pp-etre', error: 'notion', feedback: 'Avec être, on accorde avec le sujet.' }] };
  assert.equal(run(def, { value: 'les élèves sont allés à la bibliothèque' }).verdict, 'correct');
  const acc = run(def, { value: 'Les eleves sont allés à la bibliothèque.' });
  assert.equal(acc.errorType, 'orthographe');
  assert.equal(run(def, { value: 'Les élèves sont allés à la bibliotèque.' }).errorType, 'orthographe');
  const pp = run(def, { value: 'Les élèves sont allé à la bibliothèque.' });
  assert.equal(pp.misconception, 'mc:pp-etre');
  const missing = run(def, { value: 'Les élèves sont à la bibliothèque.' }).feedback;
  assert.match(missing, /manque après « sont »/);
  assert.doesNotMatch(run(def, { value: 'Les élèves sont allés à la bibliotèque.' }).feedback, /bibliothèque/, 'le mot attendu n’est pas donné avant la fin');
});
