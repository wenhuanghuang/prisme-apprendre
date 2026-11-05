/** Associations de 6e et du lycée (dieux, unités, changements d'état, mouvements littéraires, sigles) : rattachées, paires distinctes, tirages. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const W = fileURLToPath(new URL('../../', import.meta.url));
const { generateFromData, canonicalResponse, DATA_TRACKS } = await import(W + 'js/generators/data-kinds.js');
const { instantiate, check } = await import(W + 'js/core/checkers/index.js');
const { validateExercise } = await import(W + 'js/content/validate.js');
const ix = JSON.parse(readFileSync(W + 'content/index.json', 'utf8'));
const skillIds = new Set(ix.skills.map((s) => s.id));

for (const [id, courses] of [['hg-6e-dieux', ['hg-6e']], ['fr-6e-dieux', ['francais-6e']], ['maths-p-unites', ['maths-cm1', 'maths-cm2', 'maths-6e']], ['st-6e-etats', ['sciences-techno-6e']], ['lf-l-mouvements', ['francais-2nde', 'francais-1re']], ['snt-l-sigles', ['snt-2nde']]]) {
  test(`${id} : chapitres, paires distinctes, tirages`, () => {
    const g = JSON.parse(readFileSync(W + `content/generators/${id}.json`, 'utf8'));
    const chapters = new Set(courses.flatMap((c) => JSON.parse(readFileSync(W + `content/courses/${c}.json`, 'utf8')).chapters.map((x) => x.id)));
    for (const ch of g.chapters) assert.ok(chapters.has(ch), `${id} : ${ch}`);
    assert.ok(ix.generators.some((x) => x.id === id) && skillIds.has(g.skill));
    assert.equal(new Set(g.data.pairs.map((p) => p.left)).size, g.data.pairs.length);
    assert.equal(new Set(g.data.pairs.map((p) => p.right)).size, g.data.pairs.length);
    for (const tier of DATA_TRACKS) for (let seed = 1; seed <= 40; seed++) {
      const def = generateFromData(g, seed, { parcours: tier });
      assert.deepEqual(validateExercise({ ...def, selfTest: [{ response: canonicalResponse(def), expect: 'correct' }] }, skillIds), [], `${id} #${seed}`);
      assert.equal(check(instantiate(def, seed), canonicalResponse(def)).verdict, 'correct', `${id} #${seed}`);
    }
  });
}
