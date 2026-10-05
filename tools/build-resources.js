#!/usr/bin/env node
/**
 * Ressources externes vérifiées (Lumni, Éduscol) rattachées aux compétences → app/content/resources.json.
 * Les vidéos restent hébergées sur leur site d'origine : on ne stocke que des liens.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lumni = JSON.parse(readFileSync(join(root, 'research', 'lumni-links.json'), 'utf8'));
const c4 = JSON.parse(readFileSync(join(root, 'research', 'cycle4-maths-pc.json'), 'utf8'));

const NOTION_TO_SKILLS = {
  'nombres relatifs (addition)': ['m5.relatifs.addition'],
  'fractions (addition)': ['m5.fractions.addition'],
  'calcul littéral / distributivité': ['m5.litteral.distributivite', 'm4.litteral.double-distributivite'],
  'équations du premier degré': ['m4.equations.resoudre'],
  'théorème de Pythagore': ['m4.pythagore.calcul', 'm4.pythagore.reciproque'],
  'proportionnalité': ['m5.proportionnalite'],
  'puissances': ['m4.puissances'],
  'probabilités': ['m5.probabilites'],
  'Scratch / algorithmique': ['code.variables', 'code.boucles'],
  'masse volumique': ['pc.matiere.masse-volumique'],
  "changements d'état": ['pc.matiere.etats'],
  'vitesse': ['pc.mouvement.vitesse'],
  'poids et masse': ['pc.interactions.poids'],
  "loi d'Ohm": ['pc.electricite.ohm'],
  'propagation du son': ['pc.signaux.propagation'],
  'propagation de la lumière': ['pc.signaux.propagation'],
  "intelligence artificielle (comprendre l'IA)": ['ia.apprentissage', 'ia.generative'],
};

const skills = {};
const add = (skill, link) => {
  skills[skill] = skills[skill] || [];
  if (!skills[skill].some((l) => l.url === link.url)) skills[skill].push(link);
};
for (const l of lumni.links) {
  if (!l.verified || !l.url) continue;
  for (const s of NOTION_TO_SKILLS[l.notion] || []) {
    add(s, { label: `${l.title}${l.type === 'quiz' ? ' (quiz)' : ''}`, url: l.url, provider: 'lumni', levels: l.levels || [], note: 'Vidéo ou quiz hébergé par Lumni (cours enregistrés en 2020, ancien programme : à utiliser comme complément).' });
  }
}
// ressources d'accompagnement Éduscol (mathématiques), si vérifiées
const eduscol = (c4.maths.eduscolResources || []).filter((r) => r.verified && /^https:\/\//.test(r.url));
for (const r of eduscol) {
  const t = (r.label || '').toLowerCase();
  if (/algorithm|programm/.test(t)) ['code.sequences', 'code.boucles', 'code.variables'].forEach((s) => add(s, { label: r.label, url: r.url, provider: 'eduscol' }));
  if (/probl/.test(t)) ['m4.equations.modeliser'].forEach((s) => add(s, { label: r.label, url: r.url, provider: 'eduscol' }));
}
writeFileSync(join(root, 'app', 'content', 'resources.json'), JSON.stringify({ note: 'Liens vérifiés (recherche du 05/10/2026). Recherche Lumni : ' + lumni.searchUrlPattern, lessons: {}, skills }, null, 1));
console.log(`✓ resources.json : ${Object.values(skills).flat().length} liens sur ${Object.keys(skills).length} compétences`);
