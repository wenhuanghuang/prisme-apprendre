/** Générateurs du primaire : chaque classe, chaque niveau, 60 tirages ; bonne réponse acceptée, idées fausses diagnostiquées. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const W = fileURLToPath(new URL('../../', import.meta.url));
const { CODE_GENERATORS, generateFromCode, generatorTracks, codeGeneratorMeta } = await import(W + 'js/generators/maths-pc.js');
const { PRIMAIRE_MATHS: MATHS, PRIMAIRE_SKILLS, PRIMARY_LEVELS } = await import(W + 'js/generators/primaire-maths.js');
const { PRIMAIRE_MONDE, PRIMAIRE_MONDE_SKILLS } = await import(W + 'js/generators/primaire-monde.js');
const { PRIMAIRE_PLUS, PRIMAIRE_PLUS_SKILLS } = await import(W + 'js/generators/primaire-plus.js');
const { PRIMAIRE_SAVOIRS, PRIMAIRE_SAVOIRS_SKILLS } = await import(W + 'js/generators/primaire-savoirs.js');
const { PRIMAIRE_LECTURE } = await import(W + 'js/generators/primaire-lecture.js');
const PRIMAIRE_MATHS = [...MATHS, ...PRIMAIRE_MONDE, ...PRIMAIRE_PLUS, ...PRIMAIRE_SAVOIRS, ...PRIMAIRE_LECTURE];
const { canonicalResponse } = await import(W + 'js/generators/data-kinds.js');
const { instantiate, check } = await import(W + 'js/core/checkers/index.js');
const { validateExercise } = await import(W + 'js/content/validate.js');

const skillIds = new Set([...readdirSync(W + 'content/skills/').filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(readFileSync(W + 'content/skills/' + f, 'utf8')).skills.map((s) => s.id)), ...PRIMAIRE_SKILLS.map((s) => s.id), ...PRIMAIRE_MONDE_SKILLS.map((s) => s.id), ...PRIMAIRE_PLUS_SKILLS.map((s) => s.id), ...PRIMAIRE_SAVOIRS_SKILLS.map((s) => s.id)]);
const asText = (n) => String(n).replace('.', ',');
/** Dictée avec l'idée fausse : le mot le plus proche de `m.word` est remplacé par lui. */
const strip = (w) => w.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[.,]/g, '');
function dist(a, b) { const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; }
function dictationWrong(def, m) {
  const words = def.answer.split(' ');
  let best = 0; let bd = Infinity;
  words.forEach((w, i) => { const x = dist(strip(w), strip(m.word)); if (x < bd && strip(w) !== strip(m.word)) { bd = x; best = i; } });
  const punct = (words[best].match(/[.,]$/) || [''])[0];
  words[best] = m.word + punct;
  return words.join(' ');
}
const wrongValue = (def, m) => (def.type === 'numeric' ? asText(m.answer) + (def.unit && !def.unitOptional ? ` ${def.unit}` : '') : m.answer);
const chapters = new Map(PRIMARY_LEVELS.map((lv) => [lv, new Set(['maths', 'hg', 'francais', 'qlm', 'sciences-techno'].flatMap((sj) => (() => { try { return JSON.parse(readFileSync(W + `content/courses/${sj}-${lv}.json`, 'utf8')).chapters.map((c) => c.id); } catch { return []; } })()))]));

test('primaire : générateurs enregistrés, rattachés à de vrais chapitres de leur classe', () => {
  assert.ok(PRIMAIRE_MATHS.length >= 20);
  for (const g of PRIMAIRE_MATHS) {
    assert.ok(CODE_GENERATORS.includes(g), g.id);
    assert.deepEqual(codeGeneratorMeta(g).chapters, g.chapters);
    for (const ch of g.chapters) assert.ok(g.levels.some((lv) => chapters.get(lv).has(ch)), `${g.id} : chapitre ${ch} inconnu pour ${g.levels}`);
  }
  const covered = new Set(MATHS.flatMap((g) => g.chapters));
  for (const lv of PRIMARY_LEVELS) {
    const all = JSON.parse(readFileSync(W + `content/courses/maths-${lv}.json`, 'utf8')).chapters.map((c) => c.id);
    const n = all.filter((c) => covered.has(c)).length;
    assert.ok(n / all.length >= 0.7, `${lv} : ${n}/${all.length} chapitres couverts`);
  }
});

for (const gen of PRIMAIRE_MATHS) {
  for (const tier of generatorTracks(gen)) {
    test(`primaire ${gen.id} (${tier}) : 60 tirages par classe`, () => {
      for (const niveau of gen.levels) {
        const prompts = new Set();
        for (let seed = 1; seed <= 60; seed++) {
          const def = generateFromCode(gen, seed, { niveau, parcours: tier });
          const where = `${gen.id} [${tier}] ${niveau} #${seed}`;
          prompts.add(JSON.stringify([def.prompt, def.answer, def.accept, (def.items || []).map((x) => x.label)]));
          assert.ok(!/undefined|NaN|Infinity|\[object/.test(JSON.stringify(def)), `${where} : ${def.prompt}`);
          assert.ok(def.prompt && def.solution && (def.hints || []).length, `${where} : énoncé, indice et correction`);
          if (def.type === 'numeric') assert.ok(Number.isFinite(def.answer) && def.answer >= 0, `${where} : réponse ${def.answer}`);
          const errs = validateExercise({ ...def, selfTest: [{ response: canonicalResponse(def), expect: 'correct' }] }, skillIds);
          assert.deepEqual(errs, [], where);
          const inst = instantiate(def, seed);
          assert.equal(check(inst, canonicalResponse(def)).verdict, 'correct', `${where} : bonne réponse refusée (${def.prompt} → ${def.answer})`);
          for (const m of def.misconceptions || []) {
            const d = check(inst, { value: def.type === 'dictation' ? dictationWrong(def, m) : wrongValue(def, m) });
            assert.notEqual(d.verdict, 'correct', `${where} : idée fausse ${m.id} acceptée`);
            assert.equal(d.misconception, m.id, `${where} : ${m.answer} → ${d.misconception}`);
          }
        }
        // questions de connaissance (solides, figures) : un petit répertoire de faits, à retrouver souvent
        assert.ok(prompts.size >= (gen.facts ? 3 : 8), `${gen.id} [${tier}] ${niveau} : ${prompts.size} énoncés différents sur 60`);
      }
    });
  }
}
