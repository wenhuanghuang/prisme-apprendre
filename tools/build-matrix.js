#!/usr/bin/env node
/**
 * Génère docs/MATRICE-PROGRAMMES.md : correspondance entre les programmes officiels applicables en 2026-2027
 * et les contenus réellement présents dans Prisme (chapitres, leçons, compétences, exercices par parcours).
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const content = join(root, 'app', 'content');
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const catalog = read(join(content, 'catalog.json'));
const programmes = read(join(content, 'programmes.json'));
const index = read(join(content, 'index.json'));
const lessons = new Map(index.lessons.map((l) => [l.id, l]));
const skills = new Map(index.skills.map((s) => [s.id, s]));
const levelLabel = (id) => (catalog.levels.find((l) => l.id === id) || { label: id }).label;
const subjLabel = (id) => (catalog.subjects.find((s) => s.id === id) || { label: id }).label;
const progById = new Map(programmes.programmes.map((p) => [p.id, p]));
const exByLesson = {};
for (const e of index.exercises) {
  exByLesson[e.lesson] = exByLesson[e.lesson] || { classe: 0, approfondissement: 0, expert: 0, qcm: 0, types: new Set() };
  exByLesson[e.lesson][e.track] += 1;
  if (e.type === 'qcm') exByLesson[e.lesson].qcm += 1;
  exByLesson[e.lesson].types.add(e.type);
}

const lines = [];
const out = (s = '') => lines.push(s);
out('# Matrice de correspondance : programmes officiels ↔ contenus de Prisme');
out();
out(`Année scolaire ${catalog.schoolYear}. Fichier généré par \`node tools/build-matrix.js\` à partir de \`app/content/\` (ne pas modifier à la main).`);
out();
out('Légende : **rédigé** = leçons interactives présentes ; **référence** = domaines et notions officiels listés dans l’application, leçons à développer.');
out();

const totals = { courses: catalog.courses.length, authored: catalog.courses.filter((c) => c.coverage !== 'reference').length, lessons: index.lessons.length, exercises: index.exercises.length };
const byTrack = { classe: 0, approfondissement: 0, expert: 0 };
let qcm = 0;
for (const e of index.exercises) { byTrack[e.track] += 1; if (e.type === 'qcm') qcm += 1; }
out('## Synthèse');
out();
out(`- ${totals.courses} parcours niveau × matière structurés à partir des textes officiels (CP → Terminale), dont **${totals.authored} avec des leçons rédigées**.`);
out(`- ${totals.lessons} leçons, ${totals.exercises} exercices : ${byTrack.classe} niveau de la classe, ${byTrack.approfondissement} approfondissement, ${byTrack.expert} expert.`);
// questions réelles : les problèmes composés comptent pour leurs sous-questions
let questions = 0; let qcmAll = 0;
for (const f of readdirSync(join(content, 'lessons'))) {
  for (const e of read(join(content, 'lessons', f)).exercises) {
    const items = e.type === 'composite' ? e.parts || [] : [e];
    questions += items.length; qcmAll += items.filter((x) => x.type === 'qcm').length;
  }
}
out(`- QCM : ${qcmAll} questions sur ${questions} (${(qcmAll / questions * 100).toFixed(1).replace('.', ',')} %), réservées aux vérifications rapides.`);
out(`- ${index.skills.length} compétences dans le graphe (avec prérequis).`);
out();

out('## Vue d’ensemble (niveaux × matières)');
out();
const subjects = catalog.subjects.filter((s) => catalog.courses.some((c) => c.subject === s.id));
out(`| Matière | ${catalog.levels.map((l) => l.label).join(' | ')} |`);
out(`|---|${catalog.levels.map(() => '---').join('|')}|`);
for (const s of subjects) {
  const cells = catalog.levels.map((l) => {
    const c = catalog.courses.find((x) => x.level === l.id && x.subject === s.id);
    if (!c) return '—';
    const n = index.lessons.filter((x) => x.level === l.id && (x.subject === s.id || (s.id === 'numerique' && ['code', 'ia', 'numerique'].includes(x.subject)))).length;
    return c.coverage === 'reference' ? 'réf.' : `**${n || 'rédigé'}**`;
  });
  out(`| ${s.label} | ${cells.join(' | ')} |`);
}
out();

out('## Détail des parcours rédigés');
for (const c of catalog.courses.filter((x) => x.coverage !== 'reference')) {
  const course = read(join(content, 'courses', `${c.id}.json`));
  out();
  out(`### ${subjLabel(c.subject)} — ${levelLabel(c.level)}`);
  out();
  for (const pid of course.programmes || []) {
    const p = progById.get(pid);
    if (!p) continue;
    const link = (p.links || []).find((l) => /education\.gouv\.fr\/bo|legifrance|eduscol/.test(l.url)) || (p.links || [])[0];
    out(`- Texte : **${p.title}** — ${p.officialText.split(';')[0]}${link ? ` — [lien officiel](${link.url})${link.verified ? '' : ' (non vérifié)'}` : ''}`);
    out(`  - ${p.scope === 'cycle' ? 'Défini par cycle : ordre éditorial.' : 'Défini par année.'}`);
  }
  if (course.progressionNote) out(`- ${course.progressionNote}`);
  out();
  out('| Chapitre | État | Attendus officiels | Leçon(s) | Exercices classe / ◆ / ✦ |');
  out('|---|---|---|---|---|');
  for (const ch of course.chapters) {
    const att = (ch.official || []).map((o) => o.label).join(' ; ') || '—';
    const ls = (ch.lessons || []).map((id) => (lessons.get(id) ? lessons.get(id).title : `${id} (manquante)`)).join(', ') || '—';
    const counts = (ch.lessons || []).reduce((acc, id) => { const e = exByLesson[id]; if (e) { acc[0] += e.classe; acc[1] += e.approfondissement; acc[2] += e.expert; } return acc; }, [0, 0, 0]);
    out(`| ${ch.title} | ${ch.state === 'disponible' ? 'rédigé' : 'à venir'} | ${att.replace(/\|/g, '/')} | ${ls} | ${ch.lessons && ch.lessons.length ? counts.join(' / ') : '—'} |`);
  }
}
out();
out('## Compétences et statut (programme / approfondissement / hors programme)');
out();
out('| Compétence | Classe | Statut | Prérequis |');
out('|---|---|---|---|');
for (const s of index.skills) out(`| ${s.label} | ${levelLabel(s.level)} | ${s.status}${s.bridge ? ` (passerelle ${s.bridge})` : ''}${s.editorialLevel ? ' — niveau éditorial' : ''} | ${(s.prereqs || []).map((p) => (skills.get(p) || { label: p }).label).join(' ; ') || '—'} |`);
out();
out('## Textes officiels référencés (2026-2027)');
out();
for (const p of programmes.programmes) {
  const link = (p.links || [])[0];
  out(`- **${p.title}** (${p.levels.map(levelLabel).join(', ')}) — ${p.status === 'legacy-in-force' ? 'ancien texte encore applicable' : 'en vigueur'}${link ? ` — [${link.label}](${link.url})` : ''}`);
}
writeFileSync(join(root, 'docs', 'MATRICE-PROGRAMMES.md'), lines.join('\n') + '\n');
console.log('✓ docs/MATRICE-PROGRAMMES.md');
