/** Technologie au collège : chaque générateur, chaque niveau, 60 tirages ; bonne réponse acceptée, idées fausses diagnostiquées. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const W = fileURLToPath(new URL('../../', import.meta.url));
const { CODE_GENERATORS, generateFromCode, generatorTracks, codeGeneratorMeta } = await import(W + 'js/generators/maths-pc.js');
const { PHILO } = await import(W + 'js/generators/philo.js');
const { canonicalResponse } = await import(W + 'js/generators/data-kinds.js');
const { instantiate, check } = await import(W + 'js/core/checkers/index.js');
const { validateExercise } = await import(W + 'js/content/validate.js');

const skillIds = new Set(readdirSync(W + 'content/skills/').filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(readFileSync(W + 'content/skills/' + f, 'utf8')).skills.map((s) => s.id)));
const courses = ['philo-tle'].map((id) => JSON.parse(readFileSync(W + `content/courses/${id}.json`, 'utf8')));
const allChapters = new Set(courses.flatMap((c) => c.chapters.map((x) => x.id)));
const asText = (n) => String(n).replace('.', ',');

test('PHILO : générateurs enregistrés, rattachés aux chapitres des trois parcours, presque tout couvert', () => {
  for (const g of PHILO) {
    assert.ok(CODE_GENERATORS.includes(g), g.id);
    assert.equal(codeGeneratorMeta(g).subject, 'philo');
    assert.ok(skillIds.has(g.skill), `${g.id} : notion ${g.skill} inconnue`);
    for (const ch of g.chapters) assert.ok(allChapters.has(ch), `${g.id} : chapitre ${ch} inconnu`);
  }
  const covered = new Set(PHILO.flatMap((g) => g.chapters));
  for (const c of courses) {
    const n = c.chapters.filter((x) => covered.has(x.id)).length;
    assert.ok(n >= c.chapters.length - 1, `${c.id} : ${n}/${c.chapters.length} chapitres couverts`);
  }
});

for (const gen of PHILO) {
  for (const tier of generatorTracks(gen)) {
    test(`PHILO ${gen.id} (${tier}) : 60 tirages`, () => {
      const prompts = new Set();
      for (let seed = 1; seed <= 60; seed++) {
        const def = generateFromCode(gen, seed, { parcours: tier });
        const where = `${gen.id} [${tier}] #${seed}`;
        prompts.add(JSON.stringify([def.prompt, def.answer, (def.choices || []).map((c) => c.text), (def.items || []).map((i) => i.label), (def.left || []).map((i) => i.label)]));
        assert.ok(!/undefined|NaN|Infinity|\[object/.test(JSON.stringify(def)), `${where} : ${def.prompt}`);
        assert.ok(def.prompt && def.solution && (def.hints || []).length, `${where} : énoncé, indice et correction`);
        if (def.type === 'qcm') {
          assert.equal(def.choices.filter((c) => c.correct).length, 1, `${where} : une seule bonne réponse`);
          assert.equal(new Set(def.choices.map((c) => c.text)).size, def.choices.length, `${where} : choix en double`);
          assert.ok(def.choices.length >= 3, `${where} : au moins trois choix`);
        }
        if (def.type === 'match') assert.equal(new Set(def.right.map((r) => r.label)).size, def.right.length, `${where} : deux réponses identiques à relier`);
        const errs = validateExercise({ ...def, selfTest: [{ response: canonicalResponse(def), expect: 'correct' }] }, skillIds);
        assert.deepEqual(errs, [], where);
        const inst = instantiate(def, seed);
        assert.equal(check(inst, canonicalResponse(def)).verdict, 'correct', `${where} : bonne réponse refusée (${def.prompt})`);
        for (const m of def.misconceptions || []) {
          const d = check(inst, { value: def.type === 'numeric' ? asText(m.answer) : m.answer });
          assert.notEqual(d.verdict, 'correct', `${where} : idée fausse ${m.id} acceptée`);
          assert.equal(d.misconception, m.id, `${where} : ${m.answer} → ${d.misconception}`);
        }
      }
      assert.ok(prompts.size >= (gen.facts ? 5 : 12), `${gen.id} [${tier}] : ${prompts.size} énoncés différents sur 60`);
    });
  }
}
