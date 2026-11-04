/**
 * Bandeau de progression dans la barre du haut : série 🔥, anneau de l'objectif du jour, niveau.
 * Il suit le store : « +10 » qui s'envole à chaque gain, message quand l'objectif du jour est atteint,
 * fête du passage de niveau (une seule fois par niveau) avec les récompenses débloquées.
 */
import { h, announce } from '../dom.js';
import { store, subscribe, gameProgress, markLevelSeen } from '../../app/store.js';
import { photon, setPhotonOutfit } from '../photon.js';
import { unlocksOf } from '../../engine/game-rewards.js';
import { confetti } from '../lesson-play/celebrate.js';

let el = null;
let last = null;
let lastProfile = null;
let celebrateFrom = null; // niveau de départ de la fête en cours (deux niveaux d'un coup : une seule fête)

/** Anneau de progression (SVG) : `ratio` de 0 à 1. */
export function goalRing(ratio, size = 30, stroke = 4) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const done = Math.max(0, Math.min(1, ratio));
  const svg = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-bg" stroke-width="${stroke}" fill="none"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-fg ${done >= 1 ? 'is-full' : ''}" ${done > 0 ? '' : 'visibility="hidden"'} stroke-width="${stroke}" fill="none"
      stroke-dasharray="${(c * done).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 ${size / 2} ${size / 2})" stroke-linecap="round"/>
  </svg>`;
  return h('span', { class: 'goal-ring', html: svg });
}

export const streakLabel = (n) => `${n} jour${n > 1 ? 's' : ''}`;

/** Le bandeau (un seul élément, réutilisé à chaque changement de page). */
export function gameHud() {
  if (!el) {
    el = h('a', { class: 'game-hud', href: '#/progression' });
    subscribe(update);
    update();
  }
  return el;
}

function paint(g) {
  const streakCls = g.streak === 0 ? 'is-off' : g.atRisk ? 'is-risk' : '';
  el.setAttribute('aria-label', `Ma progression : niveau ${g.level}, ${g.title}. Aujourd’hui ${g.todayXp} points sur ${g.goal}. Série : ${streakLabel(g.streak)}.`);
  el.title = g.atRisk ? 'Atteins ton objectif aujourd’hui pour garder ta série !' : 'Ma progression';
  el.replaceChildren(
    h('span', { class: `gh-streak ${streakCls}` }, h('span', { 'aria-hidden': 'true' }, '🔥'), h('b', {}, String(g.streak))),
    h('span', { class: 'gh-goal' }, goalRing(g.todayXp / g.goal), h('b', {}, String(g.todayXp)), h('small', {}, `/${g.goal}`)),
    h('span', { class: 'gh-level' }, h('small', {}, 'Niv.'), h('b', {}, String(g.level))));
}

function update() {
  if (!el) return;
  const g = gameProgress();
  if (!g) { el.hidden = true; last = null; lastProfile = null; setPhotonOutfit(null); return; }
  el.hidden = false;
  setPhotonOutfit(g.equipped);
  paint(g);
  const pid = store.profile.id;
  if (lastProfile === pid && last) {
    const gain = g.totalXp - last.totalXp;
    if (gain > 0) floatGain(gain);
    // trophée tout juste gagné : un petit message (deux au plus d'un coup)
    const before = new Set((last.trophies || []).filter((t) => t.earned).map((t) => t.id));
    g.trophies.filter((t) => t.earned && !before.has(t.id)).slice(0, 2).forEach((t, k) => setTimeout(() => toast(`🏆 Nouveau trophée : ${t.icon} ${t.label}`), 900 + k * 1500));
    if (!last.goalReached && g.goalReached) {
      toast(`🎯 Objectif du jour atteint ! Série : ${streakLabel(g.streak)} 🔥`);
      el.classList.remove('is-pop'); void el.offsetWidth; el.classList.add('is-pop');
    }
  }
  // la toute première fois (profil existant ou nouveau), on enregistre le niveau sans le fêter
  if (g.seenLevel === null) markLevelSeen(g.level).catch(() => {});
  else if (g.level > g.seenLevel) {
    if (celebrateFrom === null) celebrateFrom = g.seenLevel;
    const from = celebrateFrom;
    // au tour suivant : l'exercice qui vient d'être corrigé a fini de placer son focus
    setTimeout(() => celebrateLevel(g, from), 0);
    markLevelSeen(g.level).catch(() => {});
  }
  last = g;
  lastProfile = pid;
}

function floatGain(n) {
  const fx = h('span', { class: 'gh-gain', 'aria-hidden': 'true' }, `+${n}`);
  el.append(fx);
  setTimeout(() => fx.remove(), 1400);
}

/** Petit message qui s'efface tout seul (et qui est lu par les lecteurs d'écran). */
export function toast(text) {
  const t = h('div', { class: 'game-toast' }, text); // lu par la zone d'annonce commune
  document.body.append(t);
  announce(text);
  setTimeout(() => t.classList.add('is-out'), 3600);
  setTimeout(() => t.remove(), 4200);
}

/** Fenêtre modale (<dialog>) : le reste de la page est inactif, Échap ferme, le focus revient où il était. */
function celebrateLevel(g, from) {
  const previous = document.querySelector('dialog.level-up');
  if (previous) previous.remove(); // un deuxième niveau pendant la fête : une seule fenêtre, avec tout ce qui est débloqué
  const unlocks = [];
  for (let n = from + 1; n <= g.level; n++) unlocks.push(...unlocksOf(n));
  const opener = document.activeElement;
  // fermeture faite ici (et non sur l'événement « close », qui n'arrive pas dans tous les navigateurs)
  const close = () => {
    if (!overlay.isConnected) return;
    if (overlay.open) overlay.close();
    overlay.remove();
    celebrateFrom = null;
    if (opener && opener.isConnected && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
  };
  const ok = h('button', { type: 'button', class: 'btn btn--primary btn--big', onclick: close }, 'Super !');
  const card = h('div', { class: 'level-up-card' },
    photon('bravo', 120),
    h('p', { class: 'eyebrow' }, 'Nouveau niveau'),
    h('h2', { id: 'level-up-title' }, `Niveau ${g.level} : ${g.title} !`),
    h('p', {}, `Tu as gagné ${g.totalXp} points en tout. Continue comme ça !`),
    unlocks.length ? h('div', { class: 'level-up-unlocks' }, h('p', { class: 'small' }, 'Tu débloques pour Photon :'),
      h('ul', {}, unlocks.map((u) => h('li', {}, u.icon ? `${u.icon} ` : '🎨 ', u.label))),
      h('a', { class: 'btn btn--ghost btn--small', href: '#/progression?voir=garde-robe', onclick: close }, 'Habiller Photon')) : null,
    ok);
  const overlay = h('dialog', { class: 'level-up', 'aria-labelledby': 'level-up-title', onclick: (e) => { if (e.target === overlay) close(); } }, card);
  overlay.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); close(); } });
  overlay.addEventListener('close', close);
  document.body.append(overlay);
  overlay.showModal();
  ok.focus();
  confetti(card, 90);
  announce(`Nouveau niveau : ${g.level}, ${g.title}.`);
}
