/* Service worker : fonctionnement hors connexion.
   La liste des fichiers et la version sont générées par `npm run build` (precache.json). */
const PREFIX = 'prisme-v-';
const META = 'prisme-meta';
let currentName = null;

async function readCurrent() {
  if (currentName) return currentName;
  const meta = await caches.open(META);
  const res = await meta.match('current');
  currentName = res ? await res.text() : null;
  return currentName;
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const res = await fetch('precache.json', { cache: 'no-store' });
    const { version, files } = await res.json();
    const name = PREFIX + version;
    const cache = await caches.open(name);
    for (let i = 0; i < files.length; i += 20) await cache.addAll(files.slice(i, i + 20));
    await (await caches.open(META)).put('current', new Response(name));
    currentName = name;
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const current = await readCurrent();
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== current).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const name = await readCurrent();
    const cache = name ? await caches.open(name) : null;
    const hit = cache ? await cache.match(event.request, { ignoreSearch: true }) : null;
    if (hit) return hit;
    try {
      return await fetch(event.request);
    } catch {
      if (event.request.mode === 'navigate' && cache) return (await cache.match('index.html')) || Response.error();
      return Response.error();
    }
  })());
});
