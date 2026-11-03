/**
 * Registre unique des générateurs : modules de calcul (maths, physique-chimie) et fichiers de données
 * (app/content/generators/*.json, listés dans l'index). Les fichiers sont chargés à la demande.
 */
import { CODE_GENERATORS, generateFromCode, codeGeneratorMeta } from './maths-pc.js';
import { generateFromData, DATA_TRACKS } from './data-kinds.js';

const dataCache = new Map();

/**
 * Métadonnées de tous les générateurs (sans les données). `tracks` = niveaux qu'il sait produire
 * (classe, approfondissement, expert) ; `kind` = « calcul », « probleme » ou genre de données.
 */
export function allGenerators(index) {
  const data = ((index && index.generators) || []).map((g) => ({ ...g, tracks: g.tracks || DATA_TRACKS, source: 'data' }));
  return [...CODE_GENERATORS.map(codeGeneratorMeta), ...data];
}

/** Le générateur porte-t-il sur l'une de ces notions (compétence principale ou secondaire) ? */
export function coversSkills(meta, skills) {
  return !skills.size || skills.has(meta.skill) || (meta.skills || []).some((s) => skills.has(s));
}

async function loadData(id) {
  if (dataCache.has(id)) return dataCache.get(id);
  const r = await fetch(`content/generators/${encodeURIComponent(id)}.json`, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`Générateur introuvable : ${id}`);
  const gen = await r.json();
  dataCache.set(id, gen);
  return gen;
}

/** Fabrique un exercice. Le même (générateur, graine, options) redonne toujours le même exercice. */
export async function produce(meta, seed, opts = {}) {
  const clean = Object.fromEntries(Object.entries(opts).filter(([, v]) => v && v !== 'tous'));
  if (meta.source === 'code') {
    const gen = CODE_GENERATORS.find((g) => g.id === meta.id);
    if (!gen) throw new Error(`Générateur inconnu : ${meta.id}`);
    return generateFromCode(gen, seed, clean);
  }
  return generateFromData(await loadData(meta.id), seed, clean);
}

export const newSeed = () => 1 + Math.floor(Math.random() * 2 ** 31);
