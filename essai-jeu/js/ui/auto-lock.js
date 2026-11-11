/**
 * Verrouillage automatique : un compte protégé par un code se déconnecte après AUTO_LOCK_MINUTES sans activité
 * (ou quand on revient sur un onglet resté caché plus longtemps), pour qu'un autre enfant ne retrouve pas le compte
 * ouvert sur un appareil partagé.
 */
import { store, logout } from '../app/store.js';
import { AUTO_LOCK_MINUTES } from '../engine/compte.js';

let last = Date.now();
let started = false;

function check() {
  if (!store.profile || !store.profile.secret) return;
  if (Date.now() - last >= AUTO_LOCK_MINUTES * 60000) {
    logout();
    location.hash = '#/profils';
  }
}

export function startAutoLock() {
  if (started) return;
  started = true;
  const touch = () => { last = Date.now(); };
  for (const ev of ['pointerdown', 'keydown', 'wheel', 'touchstart']) window.addEventListener(ev, touch, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
  setInterval(check, 30000);
}
