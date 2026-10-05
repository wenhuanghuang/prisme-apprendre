/**
 * Registre des activités interactives. Chaque module exporte mount(container, config) → fonction de nettoyage.
 * Les modules sont chargés à la demande (import dynamique) pour garder un démarrage rapide.
 */
import { h } from '../ui/dom.js';

const LOADERS = {
  balance: () => import('./balance.js'),
  'numberline-explore': () => import('./numberline-explore.js'),
  'fraction-bars': () => import('./fraction-bars.js'),
  pythagore: () => import('./pythagore.js'),
  'triangle-lab': () => import('./triangle-lab.js'),
  'ohm-lab': () => import('./ohm-lab.js'),
  'density-lab': () => import('./density-lab.js'),
  'motion-lab': () => import('./motion-lab.js'),
  'weight-lab': () => import('./weight-lab.js'),
  'heating-lab': () => import('./heating-lab.js'),
  'dice-lab': () => import('./dice-lab.js'),
  'knn-lab': () => import('./knn-lab.js'),
  'bigram-lab': () => import('./bigram-lab.js'),
  turtle: () => import('./turtle-lab.js'),
};

export const ACTIVITY_INFO = {
  balance: { title: 'Balance à équations', subject: 'maths', blurb: 'Garder l’équilibre en faisant la même chose des deux côtés.' },
  'numberline-explore': { title: 'Sauts sur la droite graduée', subject: 'maths', blurb: 'Additionner et soustraire des relatifs en se déplaçant.' },
  'fraction-bars': { title: 'Barres de fractions', subject: 'maths', blurb: 'Découper, colorier, comparer des fractions.' },
  pythagore: { title: 'Carrés de Pythagore', subject: 'maths', blurb: 'Voir pourquoi a² + b² = c² dans un triangle rectangle.' },
  'triangle-lab': { title: 'Construire un triangle', subject: 'maths', blurb: 'Trois longueurs forment-elles toujours un triangle ?' },
  'dice-lab': { title: 'Lancers de dés', subject: 'maths', blurb: 'Fréquences et probabilités sur des milliers de lancers.' },
  'ohm-lab': { title: 'Loi d’Ohm', subject: 'pc', blurb: 'Mesurer tension et intensité, tracer, trouver la résistance.' },
  'density-lab': { title: 'Masse volumique', subject: 'pc', blurb: 'Balance, éprouvette et identification d’un matériau.' },
  'motion-lab': { title: 'Chronophotographie', subject: 'pc', blurb: 'Mesurer des positions et étudier un mouvement.' },
  'weight-lab': { title: 'Poids sur d’autres astres', subject: 'pc', blurb: 'Dynamomètre, masses marquées et intensité de pesanteur.' },
  'heating-lab': { title: 'Changement d’état', subject: 'pc', blurb: 'Chauffer de la glace et observer le palier.' },
  'knn-lab': { title: 'Entraîner une IA', subject: 'numerique', blurb: 'Une IA qui apprend à partir d’exemples… et ses biais.' },
  'bigram-lab': { title: 'Mini modèle de langage', subject: 'numerique', blurb: 'Prédire le mot suivant à partir de statistiques.' },
  turtle: { title: 'Atelier Tortue', subject: 'numerique', blurb: 'Programmer avec des blocs, puis en texte.' },
};

export function mountActivity(container, name, config = {}) {
  const loader = LOADERS[name];
  if (!loader) { container.append(h('p', { class: 'warn' }, `Activité inconnue : ${name}`)); return () => {}; }
  const slot = h('div', { class: 'activity', 'aria-busy': 'true' }, h('p', { class: 'muted' }, 'Chargement de l’activité…'));
  container.append(slot);
  let cleanup = null; let cancelled = false;
  loader().then((mod) => {
    if (cancelled) return;
    slot.replaceChildren();
    slot.removeAttribute('aria-busy');
    cleanup = mod.mount(slot, config) || null;
  }).catch((e) => { slot.replaceChildren(h('p', { class: 'warn' }, `Impossible de charger l’activité (${e.message}).`)); });
  return () => { cancelled = true; if (cleanup) cleanup(); };
}
