/**
 * Labo : la galerie des expériences animées des leçons (à regarder étape par étape),
 * puis les simulations interactives en accès libre.
 */
import { h, tabs } from '../dom.js';
import { ACTIVITY_INFO, mountActivity } from '../../activities/registry.js';
import { store } from '../../app/store.js';

const DEFAULTS = {
  balance: { a: 3, b: 4, c: 1, d: 12, x: 4, mode: 'explore' },
  'numberline-explore': { min: -10, max: 10, start: 3, moves: [-5, 4, -7] },
  'fraction-bars': { fractions: ['2/3', '4/6'], maxDen: 24 },
  pythagore: { a: 3, b: 4 },
  'triangle-lab': { mode: 'inegalite' },
  'dice-lab': { faces: 6, dice: 2, event: 'somme' },
  'ohm-lab': { R: 220, noise: 0.02, uMax: 12 },
  'density-lab': { objects: [{ id: 'alu', label: 'Cube gris', mass: 27, volume: 10 }, { id: 'cuivre', label: 'Cylindre orangé', mass: 89.6, volume: 10 }, { id: 'bois', label: 'Bloc de bois', mass: 14, volume: 20 }, { id: 'mystere', label: 'Objet mystère', mass: 78.7, volume: 10 }] },
  'motion-lab': { mode: 'accelere', v: 1, a: 2, dt: 0.1, n: 12 },
  'weight-lab': { planet: 'Terre' },
  'heating-lab': { mode: 'pur', palier: 0 },
  'knn-lab': { preset: 'fruits', k: 3 },
  'bigram-lab': { corpus: 'le chat mange la souris . le chien mange la viande . la souris mange le fromage . le chat dort sur le tapis . le chien dort dans la niche .', start: 'le' },
  turtle: { program: 'répète 6 [\n  avance 60\n  droite 60\n]' },
};

const GROUPS = [
  { id: 'experiences', label: 'Expériences à regarder', icon: '🧪' },
  { id: 'maths', label: 'Mathématiques', icon: '∑' },
  { id: 'pc', label: 'Simulations de physique', icon: '⚗' },
  { id: 'numerique', label: 'Programmation et IA', icon: '⌘' },
];
const SUBJECT_LABEL = { pc: 'Physique-chimie', svt: 'SVT', techno: 'Technologie', maths: 'Mathématiques' };
const LEVEL_ORDER = ['cp', 'ce1', 'ce2', 'cm1', 'cm2', '6e', '5e', '4e', '3e', '2nde', '1re', 'tle'];

function gallery(root) {
  const lessons = (store.index.lessons || []).filter((l) => (l.experiences || []).length);
  const level = String((store.profile && store.profile.level) || '').toLowerCase();
  lessons.sort((a, b) => (String(a.level).toLowerCase() === level ? -1 : 0) - (String(b.level).toLowerCase() === level ? -1 : 0)
    || LEVEL_ORDER.indexOf(String(a.level).toLowerCase()) - LEVEL_ORDER.indexOf(String(b.level).toLowerCase())
    || String(a.subject).localeCompare(String(b.subject)));
  if (!lessons.length) { root.append(h('p', { class: 'muted' }, 'Aucune expérience pour l’instant.')); return; }
  const bySubject = new Map();
  for (const l of lessons) {
    if (!bySubject.has(l.subject)) bySubject.set(l.subject, []);
    bySubject.get(l.subject).push(l);
  }
  for (const [subject, list] of bySubject) {
    root.append(h('h2', { class: 'xp-group' }, SUBJECT_LABEL[subject] || subject));
    root.append(h('div', { class: 'xp-grid' }, list.flatMap((l) => l.experiences.map((x, i) => h('a', {
      class: `xp-card subj-${l.subject}`, href: `#/lecon/${l.id}?experience=${i}`,
    }, h('span', { class: 'xp-icon', 'aria-hidden': 'true' }, x.animated ? '🧪' : '📜'),
      h('span', { class: 'xp-body' }, h('strong', {}, x.title), h('span', { class: 'xp-meta' }, `${l.level} · ${l.title}`), h('span', { class: 'xp-steps' }, `${x.steps} étapes${x.animated ? '' : ' · récit'}`)))))));
  }
}

export function render(root, { params }) {
  const group = GROUPS.some((g) => g.id === params.get('g')) ? params.get('g') : 'experiences';
  root.append(
    h('div', { class: 'page-head' }, h('div', {}, h('p', { class: 'eyebrow' }, 'Laboratoire'), h('h1', {}, group === 'experiences' ? 'Les expériences, étape par étape' : 'Manipuler, mesurer, essayer'),
      h('p', { class: 'lede' }, group === 'experiences'
        ? 'Chaque expérience est montrée et expliquée étape par étape. Tu peux la mettre en pause, revenir en arrière et prévoir ce qui va se passer.'
        : 'Les simulations, en accès libre et facultatives : pour essayer par toi-même si tu en as envie.'))),
    tabs(GROUPS, group, (id) => { location.hash = `#/labo?g=${id}`; }, 'Domaines'));
  if (group === 'experiences') { gallery(root); return undefined; }
  const names = Object.entries(ACTIVITY_INFO).filter(([, v]) => v.subject === group).map(([k]) => k);
  const pick = names.includes(params.get('a')) ? params.get('a') : names[0];
  root.append(h('div', { class: 'btn-row', style: { margin: '14px 0' } }, names.map((n) => h('a', { class: `btn btn--small ${n === pick ? 'btn--primary' : 'btn--ghost'}`, href: `#/labo?g=${group}&a=${n}`, 'aria-current': n === pick ? 'true' : null }, ACTIVITY_INFO[n].title))));
  const info = ACTIVITY_INFO[pick];
  const slot = h('div', {});
  root.append(h('section', { class: 'card' }, h('h2', {}, info.title), h('p', { class: 'muted' }, info.blurb), slot));
  return mountActivity(slot, pick, DEFAULTS[pick] || {});
}
