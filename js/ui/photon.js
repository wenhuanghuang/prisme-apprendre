/**
 * Photon, le guide de Prisme : un petit grain de lumière qui accompagne les retours.
 * Sobre (pas de personnage enfantin), il change d'expression ; l'élève peut l'habiller avec les accessoires
 * et les teintes gagnés en montant de niveau (voir engine/game-rewards.js).
 */
import { h } from './dom.js';
import { TINTS } from '../engine/game-rewards.js';

const FACES = {
  joie: 'M-5 3 Q0 7 5 3',
  encourage: 'M-4 4 Q0 6 4 4',
  attentif: 'M-4 5 L4 5',
  bravo: 'M-6 2 Q0 10 6 2 Z',
  surpris: 'M-2 5 a2 2.4 0 1 0 4 0 a2 2.4 0 1 0 -4 0',
  curieux: 'M-4 5 Q1 3 5 6',
};

/** Accessoires dessinés dans le repère de Photon (corps : cercle de rayon 12 centré en 0). `back` : derrière le corps. */
const ACCESSORY_SVG = {
  lunettes: '<g class="ph-acc" fill="rgba(255,255,255,.28)" stroke="#1d2433" stroke-width="1.2"><circle cx="-4.3" cy="-2" r="3"/><circle cx="4.3" cy="-2" r="3"/><path fill="none" d="M-1.3 -2.4 Q0 -3.3 1.3 -2.4 M-7.3 -2.6 L-11.2 -4.2 M7.3 -2.6 L11.2 -4.2"/></g>',
  noeud: '<g class="ph-acc"><path d="M0 12.6 L-5.4 9.4 L-5.4 15.8 Z M0 12.6 L5.4 9.4 L5.4 15.8 Z" fill="#e11d74"/><circle cy="12.6" r="1.7" fill="#9d174d"/></g>',
  casquette: '<g class="ph-acc"><path d="M-10.4 -6 Q-10.4 -15.5 0 -15.5 Q10.4 -15.5 10.4 -6 Z" fill="#3b4cca"/><path d="M3 -6.4 Q12 -8 17 -4.6 L9.5 -4.6 Z" fill="#26339a"/><circle cy="-15.2" r="1.3" fill="#26339a"/></g>',
  echarpe: '<g class="ph-acc"><path d="M-10.6 5.6 Q0 11 10.6 5.6 L10.2 9.4 Q0 14.6 -10.2 9.4 Z" fill="#c2410c"/><path d="M4.6 9.6 L8.4 17.6 L4.6 18.2 L2.6 10.6 Z" fill="#9a3412"/></g>',
  chapeau: '<g class="ph-acc"><ellipse cy="-9.6" rx="15.5" ry="2.7" fill="#8a5a2b"/><path d="M-8 -9.6 Q-8 -19.2 0 -19.2 Q8 -19.2 8 -9.6 Z" fill="#a16a35"/><rect x="-8" y="-12.4" width="16" height="2.3" fill="#5b3a1a"/></g>',
  couronne: '<g class="ph-acc"><path d="M-8.4 -9.8 L-8.4 -17 L-4.2 -13 L0 -18.8 L4.2 -13 L8.4 -17 L8.4 -9.8 Z" fill="#ffcf4d" stroke="#b7791f" stroke-width=".8"/><circle cx="0" cy="-12.2" r="1.3" fill="#e11d74"/><circle cx="-5" cy="-11.6" r=".9" fill="#3b4cca"/><circle cx="5" cy="-11.6" r=".9" fill="#0f7b7d"/></g>',
  aureole: '<g class="ph-acc"><ellipse cy="-15.6" rx="9.5" ry="2.6" fill="none" stroke="#ffe27a" stroke-width="1.8"/><path d="M-12 -17.5 l.8 1.8 1.8 .8 -1.8 .8 -.8 1.8 -.8 -1.8 -1.8 -.8 1.8 -.8 Z M12 -16.5 l.6 1.4 1.4 .6 -1.4 .6 -.6 1.4 -.6 -1.4 -1.4 -.6 1.4 -.6 Z" fill="#ffe27a"/></g>',
  cape: { back: '<g class="ph-acc"><path d="M-11 -4 Q-18 9 -14.5 19.5 L14.5 19.5 Q18 9 11 -4 Z" fill="#33246e"/><circle cx="-10" cy="12" r=".8" fill="#fff7d6"/><circle cx="-6" cy="17" r=".6" fill="#fff7d6"/><circle cx="11" cy="14" r=".8" fill="#fff7d6"/><circle cx="7" cy="18" r=".6" fill="#fff7d6"/></g>' },
};

let outfit = { accessory: null, tint: 'soleil' };

/** Apparence choisie par l'élève, appliquée à tous les Photon affichés ensuite. */
export function setPhotonOutfit(next) {
  outfit = { accessory: (next && next.accessory) || null, tint: (next && next.tint) || 'soleil' };
}

let photonSeq = 0;
/**
 * @param {string} mood expression
 * @param {number} size taille en pixels
 * @param {{accessory?: string|null, tint?: string}} [look] apparence imposée (sinon celle choisie par l'élève)
 */
export function photon(mood = 'attentif', size = 44, look) {
  const o = look ? { ...outfit, ...look } : outfit;
  const wrap = h('span', { class: `photon photon--${mood}`, 'aria-hidden': 'true' });
  const gid = `pg-${++photonSeq}`; // identifiant unique : un dégradé masqué ne doit pas éteindre les autres Photon
  const stops = (TINTS.find((t) => t.id === o.tint) || TINTS[0]).stops;
  const acc = ACCESSORY_SVG[o.accessory] || null;
  const front = typeof acc === 'string' ? acc : '';
  const back = acc && typeof acc === 'object' ? acc.back : '';
  wrap.innerHTML = `<svg viewBox="-20 -20 40 40" width="${size}" height="${size}">
    <defs><radialGradient id="${gid}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="${stops[0]}"/><stop offset=".55" stop-color="${stops[1]}"/><stop offset="1" stop-color="${stops[2]}"/></radialGradient></defs>
    ${back}
    <g class="photon-rays">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<line x1="0" y1="-14" x2="0" y2="-18.5" transform="rotate(${a})"${o.tint === 'soleil' ? '' : ` style="stroke:${stops[1]}"`}/>`).join('')}</g>
    <circle r="12" fill="url(#${gid})"/>
    <circle cx="-4" cy="-2" r="1.6" class="photon-eye"/><circle cx="4" cy="-2" r="1.6" class="photon-eye"/>
    <path d="${FACES[mood] || FACES.attentif}" class="photon-mouth"/>
    ${front}
  </svg>`;
  return wrap;
}

export const PHOTON_TIPS = [
  'Se tromper, puis comprendre pourquoi, fait plus progresser que réussir du premier coup.',
  'Une notion réussie plusieurs jours plus tard est vraiment acquise : c’est le rôle des révisions.',
  'Les parcours ◆ et ✦ sont facultatifs : ils ne retirent rien à ta progression du programme.',
  'Vérifier une solution en la remplaçant dans l’énoncé prend 20 secondes et évite beaucoup d’erreurs.',
  'Quand tu bloques, un indice vaut mieux que la correction : il te laisse faire le dernier pas.',
  'Un peu chaque jour vaut mieux que beaucoup une fois : c’est le secret de la série 🔥.',
];
