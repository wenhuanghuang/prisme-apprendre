import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { CODE_GENERATORS, generateFromCode, generatorTracks } from '../../app/js/generators/maths-pc.js';
import { canonicalResponse } from '../../app/js/generators/data-kinds.js';
import { instantiate, check } from '../../app/js/core/checkers/index.js';
import { validateExercise } from '../../app/js/content/validate.js';

const skillIds = new Set(readdirSync(new URL('../../app/content/skills/', import.meta.url)).filter((f) => f.endsWith('.json'))
  .flatMap((f) => JSON.parse(readFileSync(new URL(`../../app/content/skills/${f}`, import.meta.url), 'utf8')).skills.map((s) => s.id)));

const optionSets = (gen) => [{}, ...(gen.options || []).flatMap((o) => o.values.map((v) => ({ [o.id]: v.id })))];
const asText = (n) => String(n).replace('.', ',');

/** Réponse d'un élève qui commet l'idée fausse `m` (nombre écrit à la française, avec l'unité si elle est exigée). */
const wrongValue = (def, m) => (def.type === 'numeric' ? asText(m.answer) + (def.unit && !def.unitOptional ? ` ${def.unit}` : '') : m.answer);

for (const gen of CODE_GENERATORS) {
  for (const tier of generatorTracks(gen)) {
    test(`générateur ${gen.id} (${tier}) : 40 tirages par option, bonne réponse acceptée, idées fausses diagnostiquées`, () => {
      assert.ok(skillIds.has(gen.skill), `compétence ${gen.skill}`);
      for (const s of gen.skills || []) assert.ok(skillIds.has(s), `${gen.id} : compétence secondaire ${s}`);
      for (const opts of optionSets(gen)) {
        for (let seed = 1; seed <= 40; seed++) {
          const def = generateFromCode(gen, seed, { ...opts, parcours: tier });
          const where = `${gen.id} [${tier}] ${JSON.stringify(opts)} #${seed}`;
          assert.equal(def.track, tier, `${where} : parcours`);
          assert.ok(skillIds.has(def.skill), `${where} : compétence ${def.skill}`);
          assert.ok(!/undefined|NaN|Infinity/.test(JSON.stringify(def)), `${where} : valeur manquante dans ${def.prompt}`);
          assert.ok(def.prompt && def.solution, `${where} : énoncé et correction obligatoires`);
          const errs = validateExercise({ ...def, selfTest: [{ response: canonicalResponse(def), expect: 'correct' }] }, skillIds);
          assert.deepEqual(errs, [], where);
          const inst = instantiate(def, seed);
          for (const m of def.misconceptions || []) {
            const value = wrongValue(def, m);
            const d = check(inst, { value });
            assert.notEqual(d.verdict, 'correct', `${where} : l'idée fausse ${m.id} (${value}) est acceptée`);
            assert.equal(d.misconception, m.id, `${where} : ${value} devrait être diagnostiqué ${m.id}, obtenu ${d.misconception} (${d.feedback})`);
          }
          // problème : une seule question fausse (idée fausse typique) suffit à ne pas tout valider
          (def.parts || []).forEach((part, k) => {
            for (const m of part.misconceptions || []) {
              const response = { ...def.generatedAnswer, parts: def.generatedAnswer.parts.map((r, j) => (j === k ? { value: wrongValue(part, m) } : r)) };
              const d = check(inst, response);
              assert.notEqual(d.verdict, 'correct', `${where} : question ${k + 1}, l'idée fausse ${m.id} est acceptée`);
            }
          });
        }
      }
    });
  }
}

test('niveaux : ◆ et ✦ produisent d’autres exercices que le niveau de la classe', () => {
  for (const gen of CODE_GENERATORS) {
    const tracks = generatorTracks(gen);
    for (const tier of tracks.filter((t) => t !== 'classe')) {
      const prompts = new Set(Array.from({ length: 20 }, (_, i) => generateFromCode(gen, i + 1, { parcours: tier }).prompt));
      assert.ok(prompts.size >= 10, `${gen.id} [${tier}] : seulement ${prompts.size} énoncés différents sur 20`);
      if (tracks.includes('classe')) {
        const same = Array.from({ length: 10 }, (_, i) => generateFromCode(gen, i + 1, { parcours: tier }).prompt === generateFromCode(gen, i + 1).prompt).filter(Boolean).length;
        assert.ok(same < 3, `${gen.id} [${tier}] : ${same}/10 énoncés identiques au niveau de la classe`);
      }
    }
  }
});

test('générateurs de calcul : tirages reproductibles et variés', () => {
  for (const gen of CODE_GENERATORS) {
    assert.deepEqual(generateFromCode(gen, 11), generateFromCode(gen, 11), gen.id);
    const prompts = new Set(Array.from({ length: 20 }, (_, i) => generateFromCode(gen, i + 1).prompt));
    assert.ok(prompts.size >= 12, `${gen.id} : seulement ${prompts.size} énoncés différents sur 20`);
  }
});

test('conversions : l’unité de départ recopiée est refusée, le nombre seul suffit', () => {
  const gen = CODE_GENERATORS.find((g) => g.id === 'm-conversions');
  const def = { ...generateFromCode(gen, 3, { grandeur: 'longueur' }) };
  const inst = instantiate(def, 3);
  const from = def.prompt.match(/: (.+) = …/)[1];
  assert.equal(check(inst, { value: from }).verdict, 'incorrect');
  assert.equal(check(inst, { value: asText(def.answer) }).verdict, 'correct');
  assert.equal(check(inst, { value: `${asText(def.answer)} ${def.unit}` }).verdict, 'correct');
});

test('montants en euros : « 7,50 € » se lit 7,5', () => {
  const def = { id: 'e', type: 'numeric', answer: 7.5 };
  assert.equal(check(instantiate(def, 1), { value: '7,50 €' }).verdict, 'correct');
  assert.equal(check(instantiate(def, 1), { value: '7,5 euros' }).verdict, 'correct');
});

test('l’énoncé affiché vaut bien la réponse attendue (lecture de ÷ et des fractions)', async () => {
  const { tryParse, evaluate, toHTML } = await import('../../app/js/core/expr.js');
  for (const id of ['m-relatifs-somme', 'm-relatifs-produit', 'm-priorites', 'm-fractions-somme', 'm-fractions-produit']) {
    const gen = CODE_GENERATORS.find((g) => g.id === id);
    for (const opts of optionSets(gen)) {
      for (let seed = 1; seed <= 30; seed++) {
        const def = generateFromCode(gen, seed, opts);
        const math = def.prompt.match(/\$([^$]+)\$/)[1];
        const parsed = tryParse(math);
        assert.ok(parsed.ok, `${id} : ${math}`);
        const expected = def.type === 'steps' ? Number(def.generatedAnswer.lines.at(-1)) : evaluate(tryParse(String(def.answer)).node);
        assert.ok(Math.abs(evaluate(parsed.node) - expected) < 1e-9, `${id} #${seed} : « ${math} » vaut ${evaluate(parsed.node)}, attendu ${expected}`);
        // une division écrite « ÷ » reste en ligne : jamais affichée comme une fraction empilée
        if (math.includes('÷')) assert.match(toHTML(parsed.node), /÷/, `${id} : ${math}`);
      }
    }
  }
});

test('avec une unité : arrondi, calcul non terminé et « x » pour « fois » sont vérifiés', () => {
  const round = { id: 'r', type: 'numeric', answer: 17, unit: 'cm', unitOptional: true, tolerance: 0.051, round: 1 };
  assert.equal(check(instantiate(round, 1), { value: '17 cm' }).verdict, 'correct');
  assert.equal(check(instantiate(round, 1), { value: '16,971 cm' }).errorType, 'precision');
  assert.equal(check(instantiate(round, 1), { value: '17,05 cm' }).errorType, 'precision');
  const conv = { id: 'c', type: 'numeric', answer: 0.456, unit: 'dam', unitOptional: true, strictUnit: true };
  assert.equal(check(instantiate(conv, 1), { value: '456 × 0,001 dam' }).errorType, 'forme');
  assert.equal(check(instantiate(conv, 1), { value: '456 x 0,001' }).errorType, 'forme');
  assert.equal(check(instantiate(conv, 1), { value: '0,456 dam' }).verdict, 'correct');
  const sci = { id: 's', type: 'numeric', answer: 300000000, unit: 'm/s' };
  assert.equal(check(instantiate(sci, 1), { value: '3 × 10^8 m/s' }).verdict, 'correct', 'la notation scientifique est un résultat');
});

test('fiche imprimée : rangements et associations mélangés de façon reproductible', async () => {
  const { paperDef, answerText } = await import('../../app/js/ui/print-sheet.js');
  const order = { type: 'order', items: ['a', 'b', 'c', 'd'].map((id) => ({ id, label: id })) };
  const match = { type: 'match', left: [{ id: 'l1', label: 'x' }, { id: 'l2', label: 'y' }, { id: 'l3', label: 'z' }], right: [{ id: 'r1', label: '1' }, { id: 'r2', label: '2' }, { id: 'r3', label: '3' }], pairs: { l1: 'r1', l2: 'r2', l3: 'r3' } };
  for (let seed = 1; seed <= 20; seed++) {
    const o = paperDef(order, seed);
    assert.notDeepEqual(o.items.map((i) => i.id), ['a', 'b', 'c', 'd'], 'jamais dans le bon ordre');
    assert.deepEqual(paperDef(order, seed), o, 'même graine, même fiche');
    // le corrigé donne les lettres de la fiche dans le bon ordre
    const letters = answerText(o, { params: {} }).split(' – ');
    assert.deepEqual(letters.map((L) => o.items['ABCD'.indexOf(L)].id), ['a', 'b', 'c', 'd']);
    const m = paperDef(match, seed);
    assert.notDeepEqual(m.right.map((r) => r.id), ['r1', 'r2', 'r3']);
    const comp = paperDef({ type: 'composite', parts: [order] }, seed);
    assert.notDeepEqual(comp.parts[0].items.map((i) => i.id), ['a', 'b', 'c', 'd'], 'sous-questions mélangées aussi');
  }
});
