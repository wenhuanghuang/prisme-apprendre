/** Lycée (seconde : maths, physique-chimie) : chaque générateur, chaque niveau, 60 tirages ; bonne réponse acceptée, idées fausses diagnostiquées. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const W = fileURLToPath(new URL('../../', import.meta.url));
const { CODE_GENERATORS, generateFromCode, generatorTracks, codeGeneratorMeta } = await import(W + 'js/generators/maths-pc.js');
const { LYCEE_MATHS } = await import(W + 'js/generators/lycee-maths.js');
const { LYCEE_PC } = await import(W + 'js/generators/lycee-pc.js');
const { LYCEE_MATHS_1T } = await import(W + 'js/generators/lycee-maths-1t.js');
const { LYCEE_PC_1T } = await import(W + 'js/generators/lycee-pc-1t.js');
const { LYCEE_SVT } = await import(W + 'js/generators/lycee-svt.js');
const { canonicalResponse } = await import(W + 'js/generators/data-kinds.js');
const { instantiate, check } = await import(W + 'js/core/checkers/index.js');
const { validateExercise } = await import(W + 'js/content/validate.js');

const skillIds = new Set(readdirSync(W + 'content/skills/').filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(readFileSync(W + 'content/skills/' + f, 'utf8')).skills.map((s) => s.id)));
const asText = (n) => String(n).replace('.', ',');
const wrongValue = (def, m) => (def.type === 'numeric' ? asText(m.answer) + (def.unit && !def.unitOptional ? ` ${def.unit}` : '') : m.answer);

const SETS = [
  [LYCEE_MATHS, 'maths-2nde', 'maths', '2nde', 1], [LYCEE_PC, 'pc-2nde', 'pc', '2nde', 1],
  [LYCEE_MATHS_1T.filter((g) => g.levels[0] === '1re'), 'maths-1re', 'maths', '1re', 3],
  [LYCEE_MATHS_1T.filter((g) => g.levels[0] === 'tle'), 'maths-tle', 'maths', 'tle', 3],
  [LYCEE_PC_1T.filter((g) => g.levels[0] === '1re'), 'pc-1re', 'pc', '1re', 1],
  [LYCEE_PC_1T.filter((g) => g.levels[0] === 'tle'), 'pc-tle', 'pc', 'tle', 2],
  [LYCEE_SVT, 'svt-2nde', 'svt', '2nde', 1],
];
for (const [GENS, courseId, subject, level, missing] of SETS) {
  const course = JSON.parse(readFileSync(W + `content/courses/${courseId}.json`, 'utf8'));
  const chapterIds = new Set(course.chapters.map((c) => c.id));
  test(`${courseId} : générateurs enregistrés, rattachés aux chapitres du programme, presque tous couverts`, () => {
    assert.ok(GENS.length >= 5, `${GENS.length} générateurs`);
    for (const g of GENS) {
      assert.ok(CODE_GENERATORS.includes(g), g.id);
      assert.deepEqual(codeGeneratorMeta(g).chapters, g.chapters);
      assert.deepEqual(g.levels, [level]);
      assert.equal(codeGeneratorMeta(g).subject, subject, g.id);
      assert.ok(skillIds.has(g.skill), `${g.id} : notion ${g.skill} inconnue`);
      for (const ch of g.chapters) assert.ok(chapterIds.has(ch), `${g.id} : chapitre ${ch} inconnu`);
    }
    const covered = new Set(GENS.flatMap((g) => g.chapters));
    const n = course.chapters.filter((c) => covered.has(c.id)).length;
    assert.ok(n >= course.chapters.length - missing, `${n}/${course.chapters.length} chapitres couverts`);
  });

  for (const gen of GENS) {
    for (const tier of generatorTracks(gen)) {
      test(`${courseId} ${gen.id} (${tier}) : 60 tirages`, () => {
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
            assert.notEqual(d.verdict, 'correct', `${where} : idée fausse ${m.id} acceptée (${m.answer})`);
            assert.equal(d.misconception, m.id, `${where} : ${m.answer} → ${d.misconception}`);
          }
          if (def.type === 'composite') for (const p of def.parts) for (const m of p.misconceptions || []) assert.notEqual(m.answer, p.answer, `${where} : idée fausse = bonne réponse`);
        }
        assert.ok(prompts.size >= (gen.facts ? 5 : 12), `${gen.id} [${tier}] : ${prompts.size} énoncés différents sur 60`);
      });
    }
  }
}
