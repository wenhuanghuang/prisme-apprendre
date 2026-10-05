/**
 * Stockage local (IndexedDB) : rien ne quitte l'appareil.
 * Magasins : profiles, states (un enregistrement par profil), attempts, submissions, meta.
 * Si IndexedDB est indisponible (navigation privée stricte), un stockage en mémoire prend le relais
 * et l'interface prévient que rien ne sera conservé.
 */
const DB_NAME = 'prisme';
const DB_VERSION = 1;

let dbPromise = null;
let memory = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') { memory = createMemory(); resolve(null); return; }
    let req;
    try { req = indexedDB.open(DB_NAME, DB_VERSION); } catch { memory = createMemory(); resolve(null); return; }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('profiles')) db.createObjectStore('profiles', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('states')) db.createObjectStore('states', { keyPath: 'profileId' });
      if (!db.objectStoreNames.contains('attempts')) {
        const s = db.createObjectStore('attempts', { keyPath: 'id', autoIncrement: true });
        s.createIndex('profile', 'profileId');
      }
      if (!db.objectStoreNames.contains('submissions')) {
        const s = db.createObjectStore('submissions', { keyPath: 'id' });
        s.createIndex('profile', 'profileId');
      }
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => { memory = createMemory(); resolve(null); };
    req.onblocked = () => { memory = createMemory(); resolve(null); };
  });
  return dbPromise;
}

function createMemory() {
  return { profiles: new Map(), states: new Map(), attempts: new Map(), submissions: new Map(), meta: new Map(), seq: 1 };
}

export async function isPersistent() {
  await openDb();
  return memory === null;
}

function tx(db, store, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    let result;
    Promise.resolve(fn(s)).then((r) => { result = r; });
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

const req2p = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

export async function get(store, key) {
  const db = await openDb();
  if (!db) return structuredClone(memory[store].get(key));
  return tx(db, store, 'readonly', (s) => req2p(s.get(key)));
}

export async function put(store, value) {
  const db = await openDb();
  if (!db) {
    const v = structuredClone(value);
    if (store === 'attempts' && v.id === undefined) v.id = memory.seq++;
    const key = store === 'states' ? v.profileId : v[store === 'meta' ? 'key' : 'id'];
    memory[store].set(key, v);
    return key;
  }
  return tx(db, store, 'readwrite', (s) => req2p(s.put(value)));
}

export async function all(store) {
  const db = await openDb();
  if (!db) return [...memory[store].values()].map((v) => structuredClone(v));
  return tx(db, store, 'readonly', (s) => req2p(s.getAll()));
}

export async function byProfile(store, profileId) {
  const db = await openDb();
  if (!db) return [...memory[store].values()].filter((v) => v.profileId === profileId).map((v) => structuredClone(v));
  return tx(db, store, 'readonly', (s) => req2p(s.index('profile').getAll(profileId)));
}

export async function del(store, key) {
  const db = await openDb();
  if (!db) { memory[store].delete(key); return; }
  return tx(db, store, 'readwrite', (s) => req2p(s.delete(key)));
}

/** Efface toutes les données d'un profil (définitif). */
export async function deleteProfileData(profileId) {
  const db = await openDb();
  if (!db) {
    memory.profiles.delete(profileId);
    memory.states.delete(profileId);
    for (const st of ['attempts', 'submissions']) for (const [k, v] of memory[st]) if (v.profileId === profileId) memory[st].delete(k);
    return;
  }
  for (const st of ['attempts', 'submissions']) {
    await tx(db, st, 'readwrite', (s) => new Promise((resolve) => {
      const r = s.index('profile').openCursor(IDBKeyRange.only(profileId));
      r.onsuccess = () => { const c = r.result; if (c) { c.delete(); c.continue(); } else resolve(); };
    }));
  }
  await del('states', profileId);
  await del('profiles', profileId);
}

/** Efface toute la base de cet appareil. */
export async function wipeAll() {
  const db = await openDb();
  if (!db) { memory = createMemory(); return; }
  for (const st of ['profiles', 'states', 'attempts', 'submissions', 'meta']) await tx(db, st, 'readwrite', (s) => req2p(s.clear()));
}
