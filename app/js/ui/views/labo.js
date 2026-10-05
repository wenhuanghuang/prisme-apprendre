/** Laboratoire libre : toutes les activités interactives, à manipuler sans exercice. */
import { h, tabs } from '../dom.js';
import { ACTIVITY_INFO, mountActivity } from '../../activities/registry.js';

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
  { id: 'maths', label: 'Mathématiques', icon: '∑' },
  { id: 'pc', label: 'Physique-chimie', icon: '⚗' },
  { id: 'numerique', label: 'Programmation et IA', icon: '⌘' },
];

export function render(root, { params }) {
  const group = GROUPS.some((g) => g.id === params.get('g')) ? params.get('g') : 'maths';
  const names = Object.entries(ACTIVITY_INFO).filter(([, v]) => v.subject === group).map(([k]) => k);
  const pick = names.includes(params.get('a')) ? params.get('a') : names[0];
  root.append(
    h('div', { class: 'page-head' }, h('div', {}, h('p', { class: 'eyebrow' }, 'Laboratoire'), h('h1', {}, 'Manipuler, mesurer, essayer'),
      h('p', { class: 'lede' }, 'Toutes les simulations, en accès libre. Dans les leçons, les mêmes outils servent à résoudre de vrais problèmes.'))),
    tabs(GROUPS, group, (id) => { location.hash = `#/labo?g=${id}`; }, 'Domaines'),
    h('div', { class: 'btn-row', style: { margin: '14px 0' } }, names.map((n) => h('a', { class: `btn btn--small ${n === pick ? 'btn--primary' : 'btn--ghost'}`, href: `#/labo?g=${group}&a=${n}`, 'aria-current': n === pick ? 'true' : null }, ACTIVITY_INFO[n].title))));
  const info = ACTIVITY_INFO[pick];
  const slot = h('div', {});
  root.append(h('section', { class: 'card' }, h('h2', {}, info.title), h('p', { class: 'muted' }, info.blurb), slot));
  const cleanup = mountActivity(slot, pick, DEFAULTS[pick] || {});
  return cleanup;
}
