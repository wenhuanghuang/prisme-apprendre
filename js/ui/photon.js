/**
 * Photon, le guide de Prisme : un petit grain de lumière qui accompagne les retours.
 * Sobre (pas de personnage enfantin), il change seulement d'expression.
 */
import { h } from './dom.js';

const FACES = {
  joie: 'M-5 3 Q0 7 5 3',
  encourage: 'M-4 4 Q0 6 4 4',
  attentif: 'M-4 5 L4 5',
};

export function photon(mood = 'attentif', size = 44) {
  const wrap = h('span', { class: `photon photon--${mood}`, 'aria-hidden': 'true' });
  wrap.innerHTML = `<svg viewBox="-20 -20 40 40" width="${size}" height="${size}">
    <defs><radialGradient id="pg-${mood}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff7d6"/><stop offset=".55" stop-color="#ffcf4d"/><stop offset="1" stop-color="#f08a24"/></radialGradient></defs>
    <g class="photon-rays">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<line x1="0" y1="-14" x2="0" y2="-18.5" transform="rotate(${a})"/>`).join('')}</g>
    <circle r="12" fill="url(#pg-${mood})"/>
    <circle cx="-4" cy="-2" r="1.6" class="photon-eye"/><circle cx="4" cy="-2" r="1.6" class="photon-eye"/>
    <path d="${FACES[mood] || FACES.attentif}" class="photon-mouth"/>
  </svg>`;
  return wrap;
}

export const PHOTON_TIPS = [
  'Se tromper, puis comprendre pourquoi, fait plus progresser que réussir du premier coup.',
  'Une notion réussie plusieurs jours plus tard est vraiment acquise : c’est le rôle des révisions.',
  'Les parcours ◆ et ✦ sont facultatifs : ils ne retirent rien à ta progression du programme.',
  'Vérifier une solution en la remplaçant dans l’énoncé prend 20 secondes et évite beaucoup d’erreurs.',
  'Quand tu bloques, un indice vaut mieux que la correction : il te laisse faire le dernier pas.',
];
