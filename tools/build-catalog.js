#!/usr/bin/env node
/**
 * Construit, à partir de la recherche documentaire (research/programmes-catalogue.json) :
 *  - app/content/programmes.json : textes officiels applicables en 2026-2027 et leurs liens ;
 *  - app/content/catalog.json    : niveaux, matières, parcours (niveau × matière) et leur couverture ;
 *  - app/content/courses/<matière>-<niveau>.json pour les parcours non encore rédigés à la main
 *    (« parcours de référence » : domaines et notions officiels, chapitres à venir).
 * Les parcours rédigés à la main portent "authored": true et ne sont jamais écrasés.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const research = JSON.parse(readFileSync(join(root, 'research', 'programmes-catalogue.json'), 'utf8'));
const contentDir = join(root, 'app', 'content');
const coursesDir = join(contentDir, 'courses');

const LEVEL_LABELS = { cp: 'CP', ce1: 'CE1', ce2: 'CE2', cm1: 'CM1', cm2: 'CM2', '6e': '6e', '5e': '5e', '4e': '4e', '3e': '3e', '2nde': '2nde', '1re': '1re', tle: 'Tle' };
const SUBJECT_SHORT = {
  maths: 'Mathématiques', francais: 'Français', pc: 'Physique-chimie', svt: 'SVT', techno: 'Technologie', 'sciences-techno': 'Sciences et technologie',
  qlm: 'Questionner le monde', hg: 'Histoire-géographie', emc: 'EMC', lv: 'Langues vivantes', 'arts-plastiques': 'Arts plastiques', musique: 'Éducation musicale',
  eps: 'EPS', snt: 'SNT', nsi: 'NSI', ses: 'SES', philo: 'Philosophie', 'ens-sci': 'Enseignement scientifique', hggsp: 'HGGSP', hlp: 'HLP', si: "Sciences de l'ingénieur",
  evars: 'EVAR / EVARS', 'ia-numerique': 'IA et numérique', 'maths-complementaires': 'Maths complémentaires', 'maths-expertes': 'Maths expertes', llcer: 'LLCER',
  numerique: 'Programmation et IA',
};

const programmes = research.programmes
  .filter((p) => p.status !== 'pending-not-in-force')
  .map((p) => ({
    id: p.id, subject: p.subject, levels: p.levelsInForce2026_2027 || p.levels, status: p.status, title: p.title,
    officialText: p.officialText, inForce2026_2027: p.inForce2026_2027, scope: p.scope, scopeDetail: p.scopeDetail || '',
    annualMarkers: p.annualMarkers || '', confidence: p.confidence,
    links: (p.links || []).filter((l) => /^https:\/\//.test(l.url || '')).map((l) => ({ label: l.label, url: l.url, kind: l.kind, verified: Boolean(l.verified), opened: Boolean(l.opened) })),
    domains: (p.domains || []).map((d) => ({ id: d.id, label: d.label, notions: d.notions || [] })),
    notes: p.notes || '',
  }));
const pending = research.programmes.filter((p) => p.status === 'pending-not-in-force').map((p) => ({ id: p.id, title: p.title, notes: p.notes || p.inForce2026_2027 || '' }));

writeFileSync(join(contentDir, 'programmes.json'), JSON.stringify({
  schoolYear: research.schoolYear, generatedAt: research.generatedAt,
  note: 'Textes applicables en 2026-2027, issus de la recherche documentaire. « verified » : URL officielle vérifiée ; « opened » : texte effectivement ouvert et lu.',
  programmes, pending, calendarChanges: research.calendarChanges || [], uncertainties: research.uncertainties || [],
}, null, 1));

/* ---- parcours ---- */
const authored = new Map();
for (const f of readdirSync(coursesDir).filter((x) => x.endsWith('.json'))) {
  const c = JSON.parse(readFileSync(join(coursesDir, f), 'utf8'));
  if (c.authored) authored.set(c.id, c);
}

const courses = [];
for (const levelId of Object.keys(LEVEL_LABELS)) {
  const subjects = new Map();
  for (const p of programmes) {
    if (!p.levels.includes(levelId)) continue;
    if (!subjects.has(p.subject)) subjects.set(p.subject, []);
    subjects.get(p.subject).push(p.id);
  }
  for (const [subject, ids] of subjects) {
    const id = `${subject}-${levelId}`;
    const a = authored.get(id);
    courses.push({ id, level: levelId, subject, programmes: ids, coverage: a ? a.coverage || 'partiel' : 'reference' });
    if (!a) {
      const chapters = [];
      for (const pid of ids) {
        const p = programmes.find((x) => x.id === pid);
        for (const d of p.domains) chapters.push({ id: `${pid}-${d.id}`, title: d.label, status: 'programme', state: 'a-venir', notions: d.notions, programme: pid });
      }
      const p0 = programmes.find((x) => x.id === ids[0]);
      writeFileSync(join(coursesDir, `${id}.json`), JSON.stringify({
        id, level: levelId, subject, authored: false, coverage: 'reference', programmes: ids,
        progressionNote: p0.scope === 'cycle'
          ? 'Programme défini pour l’ensemble du cycle : l’ordre des chapitres ci-dessous suit les domaines officiels, ce n’est pas un ordre national obligatoire.'
          : 'Programme défini par année. Ordre des chapitres : celui des domaines officiels (progression à adapter).',
        chapters,
      }, null, 1));
    }
  }
}
// parcours rédigés pour des matières transversales (ex. programmation et IA) qui ne sont pas des disciplines du BO
for (const [id, a] of authored) if (!courses.some((c) => c.id === id)) courses.push({ id, level: a.level, subject: a.subject, programmes: a.programmes || [], coverage: a.coverage || 'partiel' });

writeFileSync(join(contentDir, 'catalog.json'), JSON.stringify({
  schoolYear: '2026-2027',
  levels: Object.entries(LEVEL_LABELS).map(([id, label]) => ({ id, label, cycle: (research.levels.find((l) => l.id === id) || {}).cycle })),
  subjects: Object.entries(SUBJECT_SHORT).map(([id, label]) => ({ id, label })),
  courses,
}, null, 1));
console.log(`✓ ${programmes.length} programmes, ${courses.length} parcours (${courses.filter((c) => c.coverage !== 'reference').length} rédigés).`);
