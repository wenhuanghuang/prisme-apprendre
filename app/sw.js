/* Service worker : fonctionnement hors connexion.
   VERSION est réécrite par `npm run build` à chaque modification des fichiers : le navigateur voit donc
   un nouveau service worker, l'installe en arrière-plan, et l'application propose de recharger. */
const VERSION = 'tti54b';
const CACHE = `prisme-v-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const res = await fetch('precache.json', { cache: 'no-store' });
    const { files } = await res.json();
    const cache = await caches.open(CACHE);
    for (let i = 0; i < files.length; i += 20) {
      await cache.addAll(files.slice(i, i + 20).map((f) => new Request(f, { cache: 'reload' })));
    }
  })());
});

// La nouvelle version n'est activée qu'à la demande de la page (bouton « recharger »),
// pour ne jamais mélanger l'ancien et le nouveau code dans un onglet ouvert.
self.addEventListener('message', (event) => {
  if (event.data === 'activer-nouvelle-version') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('prisme-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(event.request, { ignoreSearch: true });
    if (hit) return hit;
    try {
      return await fetch(event.request);
    } catch {
      if (event.request.mode === 'navigate') return (await cache.match('index.html')) || Response.error();
      return Response.error();
    }
  })());
});
