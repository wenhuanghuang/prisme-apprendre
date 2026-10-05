import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateFromData, canonicalResponse } from '../../app/js/generators/data-kinds.js';
import { validateGenerator } from '../../app/js/content/validate.js';
import { instantiate, check } from '../../app/js/core/checkers/index.js';

const conj = {
  id: 'test-conj', label: 'Conjugaison', subject: 'francais', levels: ['5e'], skill: 's', kind: 'conjugaison',
  data: {
    pronouns: ['je', 'tu', 'il / elle / on', 'nous', 'vous', 'ils / elles'],
    tenses: { present: 'présent', imparfait: 'imparfait' },
    verbs: {
      finir: { forms: { present: ['finis', 'finis', 'finit', 'finissons', 'finissez', 'finissent'], imparfait: ['finissais', 'finissais', 'finissait', 'finissions', 'finissiez', 'finissaient'] } },
      chanter: { forms: { present: ['chante', 'chantes', 'chante', 'chantons', 'chantez', 'chantent'], imparfait: ['chantais', 'chantais', 'chantait', 'chantions', 'chantiez', 'chantaient'] } },
    },
  },
};

test('générateur de conjugaison : réponse juste, confusion de temps et de personne diagnostiquées', () => {
  assert.deepEqual(validateGenerator(conj, new Set(['s'])), []);
  for (let seed = 1; seed < 30; seed++) {
    const def = generateFromData(conj, seed, { tense: 'present' });
    const inst = instantiate(def, seed);
    assert.equal(check(inst, canonicalResponse(def)).verdict, 'correct');
    const wrongTense = def.misconceptions.find((m) => m.id === 'mc:temps-confondu');
    if (wrongTense) assert.equal(check(inst, { value: wrongTense.answer }).misconception, 'mc:temps-confondu');
  }
});

test('générateurs reproductibles : même graine, même exercice ; graines différentes, exercices variés', () => {
  assert.deepEqual(generateFromData(conj, 7), generateFromData(conj, 7));
  const prompts = new Set(Array.from({ length: 20 }, (_, i) => generateFromData(conj, i + 1).prompt));
  assert.ok(prompts.size > 8);
});

test('chronologie, classement, association, texte à trous, vocabulaire', () => {
  const skills = new Set(['s']);
  const gens = [
    { id: 'c', label: 'c', subject: 'hg', levels: ['4e'], skill: 's', kind: 'chronologie', data: { events: [{ label: 'A', year: 1789 }, { label: 'B', year: 1792 }, { label: 'C', year: 1793 }, { label: 'D', year: 1799 }, { label: 'E', year: 1804 }] } },
    { id: 'k', label: 'k', subject: 'svt', levels: ['5e'], skill: 's', kind: 'categorize', data: { categories: [{ id: 'v', label: 'Vertébré' }, { id: 'i', label: 'Invertébré' }], items: [{ label: 'chat', category: 'v' }, { label: 'escargot', category: 'i' }, { label: 'truite', category: 'v' }, { label: 'araignée', category: 'i' }] } },
    { id: 'm', label: 'm', subject: 'svt', levels: ['5e'], skill: 's', kind: 'match', data: { pairs: [{ left: 'cœur', right: 'pompe' }, { left: 'poumon', right: 'échanges gazeux' }, { left: 'rein', right: 'filtre le sang' }] } },
    { id: 'z', label: 'z', subject: 'francais', levels: ['5e'], skill: 's', kind: 'cloze', data: { items: [{ sentence: 'Il ___ parti.', accept: ['est'], misconceptions: [{ answer: 'et', feedback: 'et = et puis' }] }] } },
    { id: 'v', label: 'v', subject: 'lv', levels: ['5e'], skill: 's', kind: 'vocab', data: { lang: 'en-GB', pairs: [{ q: 'la maison', a: ['house', 'a house'] }, { q: 'le chien', a: 'dog|a dog' }, { q: 'le chat', a: ['cat'] }, { q: 'rouge', a: ['red'] }] }, options: [{ id: 'direction', values: [{ id: 'normal' }, { id: 'inverse' }] }] },
  ];
  for (const g of gens) assert.deepEqual(validateGenerator(g, skills), [], g.kind);
});
