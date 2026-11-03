/**
 * Récompenses des jeux : coffre qui s'ouvre (points + vignette), carte d'une vignette, album de lumière.
 * Les vignettes sont calculées à partir des évènements du profil (albumOf) : rien n'est stocké en double.
 */
import { h } from '../dom.js';
import { VIGNETTES } from '../../engine/game-rewards.js';
import { confetti, burstStars } from '../lesson-play/celebrate.js';

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, reduced() ? 0 : ms));

/** Coffre dessiné (SVG) ; `rare` = coffre doré. */
export function chestSvg({ rare = false, open = false } = {}) {
  const wrap = h('span', { class: `chest ${rare ? 'chest--rare' : ''} ${open ? 'is-open' : ''}`, 'aria-hidden': 'true' });
  wrap.innerHTML = `<svg viewBox="0 0 120 104" width="120" height="104">
    <g class="chest-rays">${[0, 30, 60, 90, 120, 150, 180].map((a) => `<line x1="60" y1="44" x2="60" y2="2" transform="rotate(${a - 90} 60 44)"/>`).join('')}</g>
    <rect class="chest-body" x="16" y="46" width="88" height="46" rx="7"/>
    <rect class="chest-band" x="16" y="60" width="88" height="6"/>
    <rect class="chest-band" x="36" y="46" width="6" height="46"/><rect class="chest-band" x="78" y="46" width="6" height="46"/>
    <g class="chest-lid"><path class="chest-lid-shape" d="M16 48 Q16 20 60 20 Q104 20 104 48 Z"/><rect class="chest-band" x="16" y="41" width="88" height="7"/></g>
    <rect class="chest-lock" x="53" y="54" width="14" height="17" rx="3"/><circle class="chest-hole" cx="60" cy="61" r="2.4"/>
  </svg>`;
  return wrap;
}

/** Carte d'une vignette (gagnée) : icône, nom, le phénomène expliqué. */
export function vignetteCard(v, { isNew = false } = {}) {
  return h('div', { class: `vignette ${v.rare ? 'vignette--rare' : ''} ${isNew ? 'is-new' : ''}`, role: 'group', 'aria-label': `Vignette ${v.rare ? 'rare ' : ''}: ${v.label}. ${v.fact}` },
    isNew ? h('span', { class: 'vignette-tag' }, v.rare ? 'Nouvelle vignette rare !' : 'Nouvelle vignette !') : null,
    h('span', { class: 'vignette-icon', 'aria-hidden': 'true' }, v.icon),
    h('strong', {}, v.label),
    h('span', { class: 'vignette-fact' }, v.fact));
}

/**
 * Ouverture d'un coffre. `reward` : { points, vignette (ou null si l'album est complet), already (coffre déjà ouvert) }.
 * Renvoie l'élément ; l'animation se joue toute seule.
 */
export function chestReveal({ title, points, vignette, rare = false, already = false }) {
  const chest = chestSvg({ rare });
  const prize = h('div', { class: 'chest-prize', hidden: true },
    points ? h('p', { class: 'chest-points' }, `+${points} points`) : null,
    vignette ? vignetteCard(vignette, { isNew: true }) : already ? h('p', { class: 'small muted' }, 'Ce coffre était déjà ouvert : pas de nouvelle récompense.') : h('p', { class: 'small' }, 'Ton album est complet : bravo !'));
  const el = h('section', { class: `chest-reveal ${rare ? 'chest-reveal--rare' : ''}`, 'aria-live': 'polite' },
    h('h3', { tabindex: '-1' }, title), chest, prize);
  (async () => {
    await wait(350);
    chest.classList.add('is-shaking');
    await wait(650);
    chest.classList.remove('is-shaking');
    chest.classList.add('is-open');
    await wait(300);
    prize.hidden = false;
    if (el.isConnected) { if (rare) confetti(el, 80); else burstStars(el, 3); }
  })();
  return el;
}

/** Album de lumière (page « Ma progression ») : vignettes gagnées et cases encore vides. */
export function albumSection(g) {
  const owned = new Map(((g.album && g.album.owned) || []).map((o) => [o.vignette.id, o]));
  const n = owned.size;
  return h('section', { class: 'card prog-album', id: 'album' },
    h('h2', {}, `Mon album de lumière · ${n}/${VIGNETTES.length}`),
    h('p', { class: 'small muted' }, 'Chaque défi relevé dans une quête ouvre un coffre et donne une vignette ; une quête réussie ou une victoire au jeu de plateau donne une vignette rare ✦. Clique sur une vignette pour lire ce qu’elle explique.'),
    h('ul', { class: 'album-grid' }, VIGNETTES.map((v) => {
      const o = owned.get(v.id);
      if (!o) {
        return h('li', { class: `album-slot is-empty ${v.rare ? 'is-rare' : ''}` },
          h('span', { class: 'vignette-icon', 'aria-hidden': 'true' }, '?'), h('small', {}, v.rare ? 'rare ✦' : 'à gagner'), h('span', { class: 'sr-only' }, v.rare ? 'Vignette rare pas encore gagnée' : 'Vignette pas encore gagnée'));
      }
      return h('li', { class: `album-slot ${v.rare ? 'is-rare' : ''}` },
        h('details', {}, h('summary', {}, h('span', { class: 'vignette-icon', 'aria-hidden': 'true' }, v.icon), h('strong', {}, v.label)), h('p', { class: 'small' }, v.fact)));
    })));
}

/** Vignettes apparues entre deux états de la progression (avant / après une récompense). */
export function newVignettes(before, after) {
  const had = new Set(((before && before.album && before.album.owned) || []).map((o) => o.vignette.id));
  return ((after && after.album && after.album.owned) || []).map((o) => o.vignette).filter((v) => !had.has(v.id));
}
