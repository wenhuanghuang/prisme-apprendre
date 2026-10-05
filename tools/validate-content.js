#!/usr/bin/env node
/**
 * Valide tous les contenus et génère l'index léger chargé au démarrage de l'application
 * (app/content/index.json). Les leçons elles-mêmes sont chargées à la demande.
 *
 *   node tools/validate-content.js          → valide + écrit l'index
 *   node tools/validate-content.js --check  → valide sans écrire
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateLesson, exerciseMeta, validateGenerator, generatorMeta } from '../app/js/content/validate.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = join(root, 'app', 'content');
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

export function loadAll() {
  const skills = [];
  for (const f of readdirSync(join(contentDir, 'skills')).filter((x) => x.endsWith('.json')).sort()) {
    const data = readJson(join(contentDir, 'skills', f));
    for (const s of data.skills) skills.push({ subject: data.subject, ...s, file: f });
  }
  const lessons = readdirSync(join(contentDir, 'lessons')).filter((x) => x.endsWith('.json')).sort()
    .map((f) => ({ file: f, data: readJson(join(contentDir, 'lessons', f)) }));
  const courses = readdirSync(join(contentDir, 'courses')).filter((x) => x.endsWith('.json')).sort()
    .map((f) => ({ file: f, data: readJson(join(contentDir, 'courses', f)) }));
  const genDir = join(contentDir, 'generators');
  const generators = existsSync(genDir) ? readdirSync(genDir).filter((x) => x.endsWith('.json')).sort().map((f) => ({ file: f, data: readJson(join(genDir, f)) })) : [];
  const catalog = existsSync(join(contentDir, 'catalog.json')) ? readJson(join(contentDir, 'catalog.json')) : null;
  const programmes = existsSync(join(contentDir, 'programmes.json')) ? readJson(join(contentDir, 'programmes.json')) : null;
  return { skills, lessons, courses, generators, catalog, programmes };
}

export function validateAll(all) {
  const errors = [];
  const skillIds = new Set();
  for (const s of all.skills) {
    if (skillIds.has(s.id)) errors.push(`compétence en double : ${s.id}`);
    skillIds.add(s.id);
  }
  for (const s of all.skills) for (const p of s.prereqs || []) if (!all.skills.some((x) => x.id === p)) errors.push(`compétence ${s.id} : prérequis inconnu ${p}`);
  const globalIds = new Set();
  const lessonIds = new Set();
  for (const { file, data } of all.lessons) {
    if (`${data.id}.json` !== file) errors.push(`${file} : le nom du fichier doit être <id>.json (id = ${data.id})`);
    lessonIds.add(data.id);
    errors.push(...validateLesson(data, skillIds, { globalIds }));
  }
  const programmeIds = new Set((all.programmes ? all.programmes.programmes : []).map((p) => p.id));
  for (const { file, data } of all.courses) {
    if (all.programmes && data.programme && !programmeIds.has(data.programme)) errors.push(`${file} : programme inconnu ${data.programme}`);
    for (const ch of data.chapters || []) {
      for (const l of ch.lessons || []) if (!lessonIds.has(l)) errors.push(`${file} › ${ch.id} : leçon inexistante ${l}`);
      for (const s of ch.skills || []) if (!skillIds.has(s)) errors.push(`${file} › ${ch.id} : compétence inconnue ${s}`);
    }
  }
  for (const { data } of all.lessons) for (const p of data.programmes || []) if (all.programmes && !programmeIds.has(p)) errors.push(`${data.id} : programme inconnu ${p}`);
  const genIds = new Set();
  for (const { file, data } of all.generators || []) {
    if (`${data.id}.json` !== file) errors.push(`${file} : le nom du fichier doit être <id>.json`);
    if (genIds.has(data.id)) errors.push(`générateur en double : ${data.id}`);
    genIds.add(data.id);
    errors.push(...validateGenerator(data, skillIds));
  }
  return errors;
}

export function buildIndex(all) {
  const lessonChapter = {};
  for (const { data } of all.courses) for (const ch of data.chapters || []) for (const l of ch.lessons || []) lessonChapter[l] = { course: data.id, chapter: ch.id };
  return {
    generatedAt: new Date().toISOString().slice(0, 10),
    skills: all.skills.map(({ file, ...s }) => s),
    lessons: all.lessons.map(({ data }) => ({
      id: data.id, title: data.title, subject: data.subject, level: data.level, skills: data.skills, status: data.status,
      duration: data.duration, summary: data.summary, ...(lessonChapter[data.id] || {}),
      counts: {
        classe: data.exercises.filter((e) => (e.track || 'classe') === 'classe').length,
        approfondissement: data.exercises.filter((e) => e.track === 'approfondissement').length,
        expert: data.exercises.filter((e) => e.track === 'expert').length,
      },
    })),
    exercises: all.lessons.flatMap(({ data }) => data.exercises.map((e) => exerciseMeta(e, data))),
    generators: (all.generators || []).map(({ data }) => generatorMeta(data)),
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const all = loadAll();
  const onlyArg = process.argv.find((a) => a.startsWith('--only='));
  if (onlyArg) {
    const only = new Set(onlyArg.slice(7).split(','));
    all.lessons = all.lessons.filter((l) => only.has(l.data.id));
    all.generators = (all.generators || []).filter((g) => only.has(g.data.id));
    all.courses = [];
    process.argv.push('--check');
  }
  const errors = validateAll(all);
  const nEx = all.lessons.reduce((n, l) => n + l.data.exercises.length, 0);
  if (errors.length) {
    console.error(`✗ ${errors.length} problème(s) dans les contenus :`);
    for (const e of errors) console.error('  - ' + e);
    process.exitCode = 1;
  } else {
    console.log(`✓ Contenus valides : ${all.skills.length} compétences, ${all.lessons.length} leçons, ${nEx} exercices (réponses types rejouées sur 7 tirages), ${(all.generators || []).length} générateurs.`);
  }
  // --force : écrit quand même l'index (développement, contenus en cours de rédaction)
  if (!process.argv.includes('--check') && (!errors.length || process.argv.includes('--force'))) {
    writeFileSync(join(contentDir, 'index.json'), JSON.stringify(buildIndex(all)));
    console.log('✓ Index écrit : app/content/index.json');
  }
}
