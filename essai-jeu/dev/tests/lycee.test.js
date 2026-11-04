/** Mathématiques de seconde : chaque générateur, chaque niveau, 60 tirages ; bonne réponse acceptée, idées fausses diagnostiquées. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const W = fileURLToPath(new URL('../../', import.meta.url));
const { CODE_GENERATORS, generateFromCode, generatorTracks, codeGeneratorMeta } = await import(W + 'js/generators/maths-pc.js');
const { LYCEE_MATHS } = await import(W + 'js/generators/lycee-maths.js');
const { canonicalResponse } = await import(W + 'js/generators/data-kinds.js');
const { instantiate, check } = await import(W + 'js/core/checkers/index.js');
const { validateExercise } = await import(W + 'js/content/validate.js');

const skillIds = new Set(readdirSync(W + 'content/skills/').filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(readFileSync(W + 'content/skills/' + f, 'utf8')).skills.map((s) => s.id)));
const course = JSON.parse(readFileSync(W + 'content/courses/maths-2nde.json', 'utf8'));
const chapterIds = new Set(course.chapters.map((c) => c.id));
const asText = (n) => String(n).replace('.', ',');
const wrongValue = (def, m) => (def.type === 'numeric' ? asText(m.answer) + (def.unit && !def.unitOptional ? ` ${def.unit}` : '') : m.answer);

test('seconde : générateurs enregistrés, rattachés aux chapitres du programme, presque tous couverts', () => {
  assert.ok(LYCEE_MATHS.length >= 12);
  for (const g of LYCEE_MATHS) {
    assert.ok(CODE_GENERATORS.includes(g), g.id);
    assert.deepEqual(codeGeneratorMeta(g).chapters, g.chapters);
    assert.deepEqual(g.levels, ['2nde']);
    assert.equal(codeGeneratorMeta(g).subject, 'maths', g.id);
    assert.ok(skillIds.has(g.skill), `${g.id} : notion ${g.skill} inconnue`);
    for (const ch of g.chapters) assert.ok(chapterIds.has(ch), `${g.id} : chapitre ${ch} inconnu`);
  }
  const covered = new Set(LYCEE_MATHS.flatMap((g) => g.chapters));
  const n = course.chapters.filter((c) => covered.has(c.id)).length;
  assert.ok(n >= course.chapters.length - 1, `${n}/${course.chapters.length} chapitres couverts`);
});

for (const gen of LYCEE_MATHS) {
  for (const tier of generatorTracks(gen)) {
    test(`seconde ${gen.id} (${tier}) : 60 tirages`, () => {
      const prompts = new Set();
      for (let seed = 1; seed <= 60; seed++) {
        const def = generateFromCode(gen, seed, { parcours: tier });
        const where = `${gen.id} [${tier}] #${seed}`;
        prompts.add(JSON.stringify([def.prompt, def.answer, def.accept, (def.choices || []).map((c) => c.text)]));
        assert.ok(!/undefined|NaN|Infinity|\[object|\\(frac|sqrt|vec)/.test(JSON.stringify(def)), `${where} : ${def.prompt}`);
        assert.ok(def.prompt && def.solution && (def.hints || []).length, `${where} : énoncé, indice et correction`);
        if (def.type === 'qcm') {
          assert.equal(def.choices.filter((c) => c.correct).length, 1, `${where} : une seule bonne réponse`);
          assert.equal(new Set(def.choices.map((c) => c.text)).size, def.choices.length, `${where} : choix en double ${def.choices.map((c) => c.text).join(' | ')}`);
          assert.ok(def.choices.length >= 3, `${where} : au moins trois choix`);
        }
        const errs = validateExercise({ ...def, selfTest: [{ response: canonicalResponse(def), expect: 'correct' }] }, skillIds);
        assert.deepEqual(errs, [], where);
        const inst = instantiate(def, seed);
        assert.equal(check(inst, canonicalResponse(def)).verdict, 'correct', `${where} : bonne réponse refusée (${def.prompt} → ${def.answer ?? JSON.stringify(def.accept)})`);
        for (const m of def.misconceptions || []) {
          const d = check(inst, { value: wrongValue(def, m) });
          assert.notEqual(d.verdict, 'correct', `${where} : idée fausse ${m.id} acceptée`);
          assert.equal(d.misconception, m.id, `${where} : ${m.answer} → ${d.misconception}`);
        }
        if (def.type === 'composite') for (const p of def.parts) for (const m of p.misconceptions || []) assert.notEqual(m.answer, p.answer, `${where} : idée fausse = bonne réponse`);
      }
      assert.ok(prompts.size >= (gen.facts ? 5 : 15), `${gen.id} [${tier}] : ${prompts.size} énoncés différents sur 60`);
    });
  }
}
