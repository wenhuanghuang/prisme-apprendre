#!/usr/bin/env node
/**
 * Parcours « programmation et IA » (5e, 4e), rattachés aux attendus d'algorithmique du programme de maths.
 * Tous les autres parcours (mathématiques et physique-chimie compris) sont rédigés directement dans
 * app/content/courses/ avec "authored": true : ce script ne les touche pas.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const c4 = JSON.parse(readFileSync(join(root, 'research', 'cycle4-maths-pc.json'), 'utf8'));
const out = join(root, 'app', 'content', 'courses');

const mathsAttendus = {};
for (const lv of ['5e', '4e', '3e']) for (const th of c4.maths.levels[lv].themes) for (const a of th.attendus) mathsAttendus[a.id] = a.label;
const official = (ids, table) => ids.map((id) => ({ id, label: table[id] || id }));

const courses = [];

const numNote = 'L’algorithmique et la programmation font partie du programme de mathématiques (et de technologie) du cycle 4. L’intelligence artificielle n’est pas une discipline du BO : ces leçons s’appuient sur le cadre de référence des compétences numériques (CRCN) et les parcours Pix IA (obligatoires en 4e en 2026-2027).';
courses.push(
  { id: 'numerique-5e', level: '5e', subject: 'numerique', programmes: ['maths-c4-2026', 'ia-numerique-cadre-2026'], coverage: 'partiel', progressionNote: numNote, chapters: [
    { id: 'n5-code', title: 'Programmer la tortue : séquences, boucles, débogage', status: 'programme', state: 'disponible', lessons: ['code-tortue-boucles'], skills: ['code.sequences', 'code.boucles', 'code.debug'], official: official(['m5-ap-01', 'm5-ap-02', 'm5-ap-03', 'm5-ap-04'], mathsAttendus) },
    { id: 'n5-ia', title: 'Comment une IA apprend à partir d’exemples', status: 'programme', state: 'disponible', lessons: ['ia-apprendre-exemples'], skills: ['ia.apprentissage', 'ia.biais'], official: [] },
  ] },
  { id: 'numerique-4e', level: '4e', subject: 'numerique', programmes: ['maths-c4-2020', 'ia-numerique-cadre-2026'], coverage: 'partiel', progressionNote: numNote, chapters: [
    { id: 'n4-code', title: 'Variables, conditions, procédures', status: 'programme', state: 'disponible', lessons: ['code-variables'], skills: ['code.variables', 'code.procedures'], official: official(['m4-ap-01'], mathsAttendus) },
    { id: 'n4-ia', title: 'Les modèles de langage et l’usage responsable de l’IA', status: 'programme', state: 'disponible', lessons: ['ia-modeles-langage'], skills: ['ia.generative', 'ia.usage'], official: [] },
  ] },
);

for (const c of courses) writeFileSync(join(out, `${c.id}.json`), JSON.stringify({ ...c, authored: true }, null, 1));
console.log(`✓ ${courses.length} parcours rédigés écrits.`);
