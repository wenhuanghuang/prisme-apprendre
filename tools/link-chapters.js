#!/usr/bin/env node
/**
 * Rattache automatiquement chaque leçon à son chapitre : une leçon qui déclare `"chapter": "<id du chapitre>"`
 * est ajoutée au chapitre correspondant des parcours (`courses/*.json`), avec ses compétences, et le chapitre
 * passe à l'état « disponible ». Plusieurs auteurs peuvent ainsi rédiger des leçons en parallèle sans
 * modifier les fichiers de parcours. Idempotent : relancer le script ne change rien.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const content = join(dirname(fileURLToPath(import.meta.url)), '..', 'app', 'content');
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

const lessons = readdirSync(join(content, 'lessons')).filter((f) => f.endsWith('.json'))
  .map((f) => readJson(join(content, 'lessons', f)))
  .filter((l) => l.chapter);

const byChapter = new Map();
for (const l of lessons) {
  if (!byChapter.has(l.chapter)) byChapter.set(l.chapter, []);
  byChapter.get(l.chapter).push(l);
}

const sameLevel = (lesson, course) => !lesson.level || !course.level || String(lesson.level).toLowerCase() === String(course.level).toLowerCase();
const found = new Set();
let changedFiles = 0;
for (const f of readdirSync(join(content, 'courses')).filter((x) => x.endsWith('.json'))) {
  const path = join(content, 'courses', f);
  const raw = readFileSync(path, 'utf8');
  const course = JSON.parse(raw);
  let changed = false;
  for (const ch of course.chapters || []) {
    // un même identifiant de chapitre peut exister dans plusieurs classes : on ne rattache qu'au parcours de la classe de la leçon
    const attached = (byChapter.get(ch.id) || []).filter((l) => sameLevel(l, course));
    if (!attached.length) continue;
    found.add(ch.id);
    for (const l of attached) {
      const lessonsList = Array.isArray(ch.lessons) ? ch.lessons : [];
      const skillsList = Array.isArray(ch.skills) ? ch.skills : [];
      if (!lessonsList.includes(l.id)) { ch.lessons = [...lessonsList, l.id]; changed = true; } else ch.lessons = lessonsList;
      const missing = (l.skills || []).filter((s) => !skillsList.includes(s));
      ch.skills = [...skillsList, ...missing];
      if (missing.length) changed = true;
    }
    if (ch.state !== 'disponible') { ch.state = 'disponible'; changed = true; }
  }
  if (changed && (course.chapters || []).every((c) => c.state === 'disponible') && course.coverage !== 'complet') course.coverage = 'complet';
  if (changed) {
    const indent = /^\{\r?\n {2}"/.test(raw) ? 2 : 1;
    writeFileSync(path, JSON.stringify(course, null, indent) + (raw.endsWith('\n') ? '\n' : ''));
    changedFiles += 1;
  }
}

const orphans = [...byChapter.keys()].filter((id) => !found.has(id));
for (const id of orphans) console.error(`✗ chapitre « ${id} » introuvable (leçons : ${byChapter.get(id).map((l) => l.id).join(', ')})`);
if (orphans.length) process.exitCode = 1;
console.log(`✓ Chapitres : ${lessons.length} leçon(s) rattachée(s) par le champ « chapter », ${changedFiles} parcours mis à jour.`);
