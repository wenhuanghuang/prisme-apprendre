/**
 * Démarrage : charge l'index des contenus, restaure le dernier profil, puis route selon l'adresse (#/…).
 */
import { store, init, subscribe } from './app/store.js';
import { h, clear, focusPendingTab } from './ui/dom.js';
import { gameHud } from './ui/game/hud.js';
import { watchBreaks } from './ui/game/pause.js';

const ROUTES = [
  { re: /^\/?$/, view: () => import('./ui/views/today.js'), needsProfile: true, nav: 'today' },
  { re: /^\/profils$/, view: () => import('./ui/views/welcome.js'), nav: null },
  { re: /^\/compte$/, view: () => import('./ui/views/compte.js'), needsProfile: true, nav: null },
  { re: /^\/carte(?:\/([\w-]+))?$/, view: () => import('./ui/views/map.js'), needsProfile: true, nav: 'map' },
  { re: /^\/parcours(?:\/([\w-]+))?$/, view: () => import('./ui/views/parcours.js'), needsProfile: true, nav: 'parcours' },
  { re: /^\/parcours\/([\w-]+)\/bilan\/([\w-]+)$/, view: () => import('./ui/views/bilan.js'), needsProfile: true, nav: 'parcours' },
  { re: /^\/lecon\/([\w-]+)$/, view: () => import('./ui/views/lesson.js'), needsProfile: true, nav: 'parcours' },
  { re: /^\/seance$/, view: () => import('./ui/views/session.js'), needsProfile: true, nav: 'today' },
  { re: /^\/exercices$/, view: () => import('./ui/views/exercices.js'), needsProfile: true, nav: 'exercices' },
  { re: /^\/jeu$/, view: () => import('./ui/views/jeu.js'), needsProfile: true, nav: 'jeu' },
  { re: /^\/enigme$/, view: () => import('./ui/views/enigme.js'), needsProfile: true, nav: 'today' },
  { re: /^\/memoire$/, view: () => import('./ui/views/memoire.js'), needsProfile: true, nav: 'jeu' },
  { re: /^\/frise$/, view: () => import('./ui/views/frise.js'), needsProfile: true, nav: 'jeu' },
  { re: /^\/eclair$/, view: () => import('./ui/views/eclair.js'), needsProfile: true, nav: 'jeu' },
  { re: /^\/mot$/, view: () => import('./ui/views/mot.js'), needsProfile: true, nav: 'jeu' },
  { re: /^\/fluence$/, view: () => import('./ui/views/fluence.js'), needsProfile: true, nav: 'jeu' },
  { re: /^\/estime$/, view: () => import('./ui/views/estime.js'), needsProfile: true, nav: 'jeu' },
  { re: /^\/compare$/, view: () => import('./ui/views/compare.js'), needsProfile: true, nav: 'jeu' },
  { re: /^\/vraifaux$/, view: () => import('./ui/views/vraifaux.js'), needsProfile: true, nav: 'jeu' },
  { re: /^\/boutique$/, view: () => import('./ui/views/boutique.js'), needsProfile: true, nav: 'jeu' },
  { re: /^\/labo$/, view: () => import('./ui/views/labo.js'), nav: 'labo' },
  { re: /^\/carnet$/, view: () => import('./ui/views/carnet.js'), needsProfile: true, nav: 'carnet' },
  { re: /^\/progression$/, view: () => import('./ui/views/progression.js'), needsProfile: true, nav: null },
  { re: /^\/parents$/, view: () => import('./ui/views/parents.js'), nav: 'parents' },
  { re: /^\/programmes$/, view: () => import('./ui/views/programmes.js'), nav: 'programmes' },
  { re: /^\/a-propos$/, view: () => import('./ui/views/about.js'), nav: null },
];

const NAV = [
  { id: 'today', href: '#/', label: "Aujourd'hui", needsProfile: true },
  { id: 'parcours', href: '#/parcours', label: 'Parcours', needsProfile: true },
  { id: 'exercices', href: '#/exercices', label: 'Exercices', needsProfile: true },
  { id: 'jeu', href: '#/jeu', label: 'Jeu', needsProfile: true },
  { id: 'labo', href: '#/labo', label: 'Labo' },
  { id: 'carnet', href: '#/carnet', label: 'Mon carnet', needsProfile: true },
  { id: 'parents', href: '#/parents', label: 'Parents' },
  { id: 'programmes', href: '#/programmes', label: 'Programmes' },
];

let currentCleanup = null;
let renderToken = 0;

function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, query = ''] = raw.split('?');
  return { path, params: new URLSearchParams(query) };
}

function renderNav(active) {
  const nav = document.getElementById('nav');
  clear(nav);
  for (const item of NAV) {
    if (item.needsProfile && !store.profile) continue;
    nav.append(h('a', { href: item.href, 'aria-current': item.id === active ? 'page' : null }, item.label));
  }
  const who = document.getElementById('who');
  clear(who);
  if (store.profile) {
    who.append(
      gameHud(),
      h('a', { href: '#/compte', class: 'who-link', style: { display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }, 'aria-label': `Mon compte : ${store.profile.pseudo}${store.profile.secret ? ', protégé par un code' : ''}` },
        h('span', { class: 'avatar', style: { background: store.profile.color } }, store.profile.symbol),
        h('span', {}, h('span', { class: 'who-name' }, `${store.profile.secret ? '🔒 ' : ''}${store.profile.pseudo}`), h('br'), h('span', { class: 'who-level' }, `${store.profile.level}${store.profile.demo ? ' · fictif' : ''}`))));
  } else {
    who.append(h('a', { href: '#/profils', class: 'btn btn--small' }, 'Choisir un profil'));
  }
}

async function route() {
  const token = ++renderToken;
  const { path, params } = parseHash();
  const match = ROUTES.map((r) => ({ r, m: path.match(r.re) })).find((x) => x.m);
  const app = document.getElementById('app');
  if (!match) { location.hash = '#/'; return; }
  if (match.r.needsProfile && !store.profile) { location.hash = '#/profils'; return; }
  if (currentCleanup) { try { currentCleanup(); } catch { /* ignoré */ } currentCleanup = null; }
  renderNav(match.r.nav);
  try {
    const mod = await match.r.view();
    if (token !== renderToken) return;
    // chaque vue a son propre conteneur : une vue encore en chargement ne peut pas s'ajouter sous la suivante
    const view = h('div', { class: 'view' });
    app.replaceChildren(view);
    const cleanup = await mod.render(view, { params, args: match.m.slice(1), path });
    if (token !== renderToken || !view.isConnected) { if (cleanup) cleanup(); view.remove(); return; }
    currentCleanup = cleanup || null;
    if (!focusPendingTab()) app.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  } catch (e) {
    if (token !== renderToken) return;
    clear(app);
    app.append(h('div', { class: 'card' }, h('h2', {}, 'Oups, cette page n’a pas pu s’afficher.'), h('p', { class: 'muted' }, e.message), h('a', { class: 'btn', href: '#/' }, 'Retour à l’accueil')));
  }
}

async function start() {
  try {
    await init();
  } catch (e) {
    document.getElementById('app').replaceChildren(h('div', { class: 'card' }, h('h2', {}, 'Impossible de charger les contenus.'), h('p', {}, e.message)));
    return;
  }
  window.addEventListener('hashchange', route);
  import('./ui/auto-lock.js').then((m) => m.startAutoLock()).catch(() => {}); // comptes protégés : verrouillage après inactivité
  watchBreaks(); // une pause proposée après 25 minutes d'exercices sans coupure
  let lastProfile = store.profile && store.profile.id;
  subscribe(() => {
    if (store.sharedPlay) return; // jeu à plusieurs : l'en-tête garde le profil de l'appareil
    const id = store.profile && store.profile.id;
    if (id !== lastProfile) { lastProfile = id; renderNav(null); }
  });
  if (!store.profile && !location.hash.match(/^#\/(profils|labo|parents|programmes|a-propos)/)) location.hash = '#/profils';
  else route();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') setupServiceWorker();
}

/** Hors connexion + mises à jour : une nouvelle version s'installe en arrière-plan, puis on propose de recharger. */
async function setupServiceWorker() {
  let reloading = false;
  // recharger seulement quand une nouvelle version remplace l'ancienne, jamais à la toute première visite
  // (sinon la page se rechargerait une seconde après l'arrivée, en effaçant ce que l'on commence à taper)
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !reloading) { reloading = true; location.reload(); } });
  try {
    const reg = await navigator.serviceWorker.register('sw.js');
    const offer = (worker) => {
      if (!worker || !navigator.serviceWorker.controller || document.querySelector('.update-banner')) return;
      const banner = h('div', { class: 'update-banner', role: 'status' },
        h('span', {}, 'Une nouvelle version de Prisme est prête.'),
        h('button', { type: 'button', class: 'btn btn--small btn--primary', onclick: () => worker.postMessage('activer-nouvelle-version') }, 'Recharger maintenant'),
        h('button', { type: 'button', class: 'btn btn--small btn--ghost', onclick: () => banner.remove() }, 'Plus tard'));
      document.body.append(banner);
    };
    const track = (w) => { if (w) w.addEventListener('statechange', () => { if (w.state === 'installed') offer(w); }); };
    if (reg.waiting) offer(reg.waiting);
    track(reg.installing); // une installation a pu commencer avant que l'on écoute
    reg.addEventListener('updatefound', () => track(reg.installing));
    reg.update().catch(() => {});
    setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
  } catch { /* hors ligne indisponible : l'application fonctionne quand même */ }
}

start();
