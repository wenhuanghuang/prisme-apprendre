/** Générateurs de données du primaire (français, sciences, histoire-géographie, anglais) : tirages par classe et par niveau. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const W = fileURLToPath(new URL('../../', import.meta.url));
const { generateFromData, canonicalResponse, DATA_TRACKS } = await import(W + 'js/generators/data-kinds.js');
const { instantiate, check } = await import(W + 'js/core/checkers/index.js');
const { validateExercise } = await import(W + 'js/content/validate.js');

const ix = JSON.parse(readFileSync(W + 'content/index.json', 'utf8'));
const skillIds = new Set(ix.skills.map((s) => s.id));
const files = readdirSync(W + 'content/generators/').filter((f) => /-p-/.test(f));
const gens = files.map((f) => JSON.parse(readFileSync(W + 'content/generators/' + f, 'utf8')));
const chaptersOf = (subject, lv) => { try { return new Set(JSON.parse(readFileSync(W + `content/courses/${subject}-${lv}.json`, 'utf8')).chapters.map((c) => c.id)); } catch { return new Set(); } };

test('primaire (données) : fichiers, index et chapitres cohérents', () => {
  assert.ok(gens.length >= 30, `${gens.length} générateurs`);
  for (const g of gens) {
    const entry = ix.generators.find((x) => x.id === g.id);
    assert.ok(entry, `${g.id} dans l’index`);
    assert.deepEqual(entry.chapters, g.chapters);
    assert.ok(skillIds.has(g.skill), `${g.id} : notion ${g.skill}`);
    for (const ch of g.chapters) assert.ok(g.levels.some((lv) => chaptersOf(g.subject, lv).has(ch)), `${g.id} : chapitre ${ch} absent des parcours ${g.subject} ${g.levels}`);
  }
});

for (const g of gens) {
  test(`primaire ${g.id} : 25 tirages par niveau de difficulté`, () => {
    for (const tier of DATA_TRACKS) {
      for (let seed = 1; seed <= 25; seed++) {
        const def = generateFromData(g, seed, { parcours: tier });
        const where = `${g.id} [${tier}] #${seed}`;
        assert.ok(!/undefined|NaN|\[object/.test(JSON.stringify(def)), `${where} : ${def.prompt}`);
        const errs = validateExercise({ ...def, selfTest: [{ response: canonicalResponse(def), expect: 'correct' }] }, skillIds);
        assert.deepEqual(errs, [], where);
        const inst = instantiate(def, seed);
        assert.equal(check(inst, canonicalResponse(def)).verdict, 'correct', `${where} : bonne réponse refusée — ${def.prompt}`);
        for (const m of def.misconceptions || []) {
          const d = check(inst, { value: m.answer });
          assert.notEqual(d.verdict, 'correct', `${where} : idée fausse ${m.id} « ${m.answer} » acceptée`);
        }
      }
    }
  });
}
