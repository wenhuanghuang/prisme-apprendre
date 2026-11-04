/**
 * Pauses : après 25 minutes d'exercices sans vraie coupure, Photon propose une pause de 5 minutes (le cerveau range
 * ce qu'il vient d'apprendre pendant les pauses). C'est une proposition, jamais un blocage ; elle revient au plus
 * toutes les 20 minutes si l'on continue. Rien n'est proposé pendant une partie à plusieurs.
 */
import { h, announce } from '../dom.js';
import { store, subscribe } from '../../app/store.js';
import { photon } from '../photon.js';

const GAP = 5 * 60000; // plus de 5 minutes sans réponse : c'était déjà une pause
const AFTER = 25 * 60000;
const AGAIN = 20 * 60000;
let lastShown = 0;
let watching = false;

/** Début de la séance en cours : la tentative la plus ancienne sans coupure de plus de GAP. */
export function sessionStart(attempts, now) {
  // les dernières tentatives, de la plus récente à la plus ancienne (l'ordre de la liste n'est pas garanti)
  const times = (attempts || []).slice(-300).map((x) => x.ts).filter((t) => Number.isFinite(t) && t <= now).sort((x, y) => y - x);
  let start = null; let last = now;
  for (const t of times) {
    if (last - t > GAP) break;
    start = t; last = t;
  }
  return start;
}

/** Faut-il proposer une pause maintenant ? */
export function breakDue(attempts, now, shownAt = 0) {
  const start = sessionStart(attempts, now);
  if (start === null || now - start < AFTER) return false;
  return now - Math.max(shownAt, start) >= (shownAt > start ? AGAIN : AFTER);
}

function show() {
  if (document.querySelector('.pause-banner, .pause-overlay')) return;
  const minutes = Math.round((store.now() - sessionStart(store.attempts, store.now())) / 60000);
  const banner = h('div', { class: 'pause-banner', role: 'status' }, photon('joie', 40),
    h('p', {}, h('strong', {}, `${minutes} minutes d’entraînement : bravo ! `), 'Une pause de 5 minutes aide ton cerveau à ranger ce que tu viens d’apprendre.'),
    h('div', { class: 'btn-row' },
      h('button', { type: 'button', class: 'btn btn--primary btn--small', onclick: () => { banner.remove(); breakOverlay(); } }, 'Je fais une pause'),
      h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => banner.remove() }, 'Encore un peu')));
  document.body.append(banner);
  announce('Proposition de pause : 5 minutes pour laisser ton cerveau ranger ce que tu as appris.');
}

function breakOverlay() {
  let left = 5 * 60;
  const clock = h('p', { class: 'pause-clock', 'aria-live': 'off' }, '5:00');
  const resume = h('button', { type: 'button', class: 'btn btn--primary' }, 'Je reprends');
  const overlay = h('dialog', { class: 'pause-overlay', 'aria-labelledby': 'pause-title' },
    h('div', { class: 'pause-card' }, photon('joie', 96),
      h('h2', { id: 'pause-title' }, 'Pause lumière'),
      h('ul', {}, h('li', {}, '💧 Bois un verre d’eau.'), h('li', {}, '👀 Regarde au loin par la fenêtre.'), h('li', {}, '🙆 Étire-toi, bouge un peu.')),
      clock, resume));
  const timer = setInterval(() => {
    left -= 1;
    clock.textContent = `${Math.floor(Math.max(0, left) / 60)}:${String(Math.max(0, left) % 60).padStart(2, '0')}`;
    if (left <= 0) { clearInterval(timer); clock.textContent = 'C’est reparti quand tu veux !'; announce('La pause est finie.'); }
  }, 1000);
  const close = () => { clearInterval(timer); if (overlay.open) overlay.close(); overlay.remove(); };
  resume.addEventListener('click', close);
  overlay.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); close(); } });
  document.body.append(overlay);
  overlay.showModal();
  resume.focus();
}

/** À appeler une fois au démarrage : surveille les tentatives du profil actif. */
export function watchBreaks() {
  if (watching) return;
  watching = true;
  subscribe(() => {
    if (!store.profile || store.sharedPlay || !store.attempts.length) return;
    const now = store.now();
    if (breakDue(store.attempts, now, lastShown)) { lastShown = now; show(); }
  });
}
