#!/usr/bin/env node
/**
 * Rapport « élèves fictifs » : rejoue l'historique simulé de chaque élève dans le vrai moteur et écrit
 * docs/PROFILS-FICTIFS.md avec l'état des compétences, les recommandations (et leurs raisons), puis
 * les exercices que le moteur choisirait — y compris après de nouvelles erreurs ou réussites.
 */
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEMO_PROFILES, simulateProfile } from '../app/js/engine/demo-profiles.js';
import { recommend } from '../app/js/engine/recommend.js';
import { selectExercise } from '../app/js/engine/select.js';
import { masteryLevel, LEVELS } from '../app/js/engine/mastery.js';
import { ERROR_TYPES } from '../app/js/core/errors.js';
import { loadAll, buildIndex } from './validate-content.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const NOW = Date.UTC(2026, 9, 5, 16, 0, 0);
const all = loadAll();
const raw = buildIndex(all);
const index = { skills: new Map(raw.skills.map((s) => [s.id, s])), exercises: raw.exercises };
const defs = new Map(all.lessons.flatMap(({ data }) => data.exercises.map((e) => [e.id, { ...e, lesson: data.id }])));
const label = (id) => (index.skills.get(id) || { label: id }).label;
const pct = (x) => `${Math.round(x * 100)} %`;
const rand = (() => { let s = 7; return () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; })();

const L = [];
const out = (s = '') => L.push(s);
out('# Élèves fictifs : ce que le moteur diagnostique et propose');
out();
out('Rapport généré par `node tools/demo-report.js` : l’historique de chaque élève est **rejoué dans le vrai moteur** (aucune valeur saisie à la main). Les mêmes profils sont chargeables dans l’application (« Charger les profils fictifs ») et sont vérifiés par les tests automatiques (`tests/scenarios/profils-fictifs.test.js`).');
out();
out(`Date de référence : ${new Date(NOW).toLocaleDateString('fr-FR')}.`);

for (const demo of DEMO_PROFILES) {
  const sim = simulateProfile(demo, NOW);
  const p = sim.profile;
  out();
  out(`## ${p.pseudo} (${p.level})`);
  out();
  out(`> ${demo.story}`);
  out();
  out('**État des compétences travaillées**');
  out();
  out('| Compétence | Niveau | Maîtrise estimée | Tentatives | Réussites autonomes | Réussites différées | Erreurs (types) |');
  out('|---|---|---|---|---|---|---|');
  for (const [id, st] of Object.entries(sim.states.skills)) {
    const errs = Object.entries(st.errors).map(([t, n]) => `${(ERROR_TYPES[t] || {}).label || t} ×${n}`).join(', ') || '—';
    out(`| ${label(id)} | ${LEVELS[masteryLevel(st, NOW)].label} | ${pct(st.pL)} | ${st.n} | ${st.autonomousSuccesses} | ${st.delayedSuccesses} | ${errs} |`);
  }
  const recs = recommend(index, sim.states.skills, { now: NOW, level: String(p.level).toLowerCase(), limit: 6 });
  out();
  out('**Recommandations (par priorité) et raisons affichées**');
  out();
  recs.forEach((r, i) => {
    out(`${i + 1}. **${r.title}** (${r.kind}, priorité ${Math.round(r.priority)})`);
    out(`   - À l’élève : ${r.reasonStudent}`);
    out(`   - Au parent : ${r.reasonParent}`);
    const pick = selectExercise(index.exercises, r.query, sim.states.skills[r.query.skill || r.skill], [], [], rand);
    if (pick) {
      const d = defs.get(pick.exercise.id);
      out(`   - Exercice choisi : \`${pick.exercise.id}\` (${d.type}, ${pick.exercise.track}, difficulté ${pick.exercise.difficulty}, ${pick.exercise.representation}) — ${pick.explanation.join(' ; ')}`);
    } else out('   - Exercice choisi : aucun exercice disponible pour cette demande dans les contenus actuels (leçon à rédiger).');
  });
}

out();
out('## Comment l’exercice suivant change selon les résultats');
out();
out('Simulation sur la compétence « Résoudre une équation du premier degré » (maîtrise estimée 55 %).');
out();
const skill = 'm4.equations.resoudre';
const state = { pL: 0.55 };
const scenarios = [
  ['Début de séance', []],
  ['Après deux erreurs de signe en calcul écrit', [{ exerciseId: 'm4-eq-g1', credit: 0, representation: 'symbolique', errorType: 'signe' }, { exerciseId: 'm4-eq-g2', credit: 0.1, representation: 'symbolique', errorType: 'signe' }]],
  ['Après une erreur « isoler x » (soustraire au lieu de diviser)', [{ exerciseId: 'm4-eq-g1', credit: 0, representation: 'symbolique', errorType: 'notion', misconception: 'mc:isoler-x' }]],
  ['Après trois réussites rapides et autonomes', [0, 1, 2].map((i) => ({ exerciseId: ['m4-eq-g1', 'm4-eq-g2', 'm4-eq-g3'][i], credit: 1, timeRatio: 0.5, representation: 'symbolique' }))],
];
out('| Situation | Difficulté visée | Exercice choisi | Pourquoi |');
out('|---|---|---|---|');
for (const [name, session] of scenarios) {
  const pick = selectExercise(index.exercises, { skill, track: 'classe' }, state, session, [], () => 0.5);
  out(`| ${name} | ${pick.target}/5 | \`${pick.exercise.id}\` (${pick.exercise.representation}, difficulté ${pick.exercise.difficulty}) | ${pick.explanation.join(' ; ')} |`);
}
writeFileSync(join(root, 'docs', 'PROFILS-FICTIFS.md'), L.join('\n') + '\n');
console.log('✓ docs/PROFILS-FICTIFS.md');
