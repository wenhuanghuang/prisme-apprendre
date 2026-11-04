/**
 * Calcul éclair : une série de calculs mentaux adaptés à la classe (compléments, tables, décimaux, relatifs,
 * puissances, pourcentages…). Un calcul raté revient plus tard dans la série : on finit toujours sur des réussites.
 * Le temps total peut devenir un record personnel (par classe, thème et longueur de série).
 * Moteur pur : pas de DOM, pas de stockage.
 */

const ri = (rand, a, b) => a + Math.floor(rand() * (b - a + 1));
const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];
const clean = (x) => Number(Number(x).toPrecision(12));
/** Nombre à la française : virgule décimale, signe moins typographique. */
export const frNum = (x) => String(clean(x)).replace('.', ',').replace('-', '−');
const rel = (x) => (x < 0 ? `(−${-x})` : `(+${x})`);
const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻' };
const sup = (n) => String(n).split('').map((c) => SUP[c]).join('');

/** Thèmes : id → { label, make(rand) → { q, a } }. */
export const ECLAIR_THEMES = {
  add10: { label: 'Additions jusqu’à 10', make: (r) => { const a = ri(r, 0, 9); const b = ri(r, 1, 10 - a); return { q: `${a} + ${b}`, a: a + b }; } },
  sub10: { label: 'Soustractions jusqu’à 10', make: (r) => { const a = ri(r, 2, 10); const b = ri(r, 1, a - 1); return { q: `${a} − ${b}`, a: a - b }; } },
  comp10: { label: 'Compléments à 10', make: (r) => { const a = ri(r, 1, 9); return { q: r() < 0.5 ? `${a} + … = 10` : `… + ${a} = 10`, a: 10 - a }; } },
  add20: { label: 'Additions jusqu’à 20', make: (r) => { const a = ri(r, 3, 9); const b = ri(r, 3, 9); return { q: `${a} + ${b}`, a: a + b }; } },
  sub20: { label: 'Soustractions jusqu’à 20', make: (r) => { const a = ri(r, 11, 19); const b = ri(r, 2, 9); return { q: `${a} − ${b}`, a: a - b }; } },
  doubles: { label: 'Doubles et moitiés', make: (r) => { const n = ri(r, 2, 50); return r() < 0.5 ? { q: `le double de ${n}`, a: 2 * n } : { q: `la moitié de ${2 * n}`, a: n }; } },
  comp100: { label: 'Compléments à 100', make: (r) => { const a = 5 * ri(r, 1, 19); return { q: `${a} + … = 100`, a: 100 - a }; } },
  tables25: { label: 'Tables de 2, 3, 4 et 5', make: (r) => { const a = ri(r, 2, 5); const b = ri(r, 1, 10); return r() < 0.5 ? { q: `${a} × ${b}`, a: a * b } : { q: `${b} × ${a}`, a: a * b }; } },
  tables: { label: 'Tables de multiplication', make: (r) => { const a = ri(r, 2, 9); const b = ri(r, 2, 9); return { q: `${a} × ${b}`, a: a * b }; } },
  divisions: { label: 'Divisions des tables', make: (r) => { const a = ri(r, 2, 9); const b = ri(r, 2, 9); return { q: `${a * b} ÷ ${a}`, a: b }; } },
  dizaines: { label: 'Ajouter et retirer des dizaines', make: (r) => { const a = ri(r, 12, 89); const b = 10 * ri(r, 1, 9); return r() < 0.6 ? { q: `${a} + ${b}`, a: a + b } : { q: `${a + b} − ${b}`, a }; } },
  x10: { label: 'Multiplier et diviser par 10, 100', make: (r) => { const n = ri(r, 2, 99); const k = pick(r, [10, 100]); return r() < 0.6 ? { q: `${n} × ${k}`, a: n * k } : { q: `${n * k} ÷ ${k}`, a: n }; } },
  x10dec: { label: 'Décimaux × 10, 100 et ÷ 10', make: (r) => { const d = ri(r, 11, 99) / 10; const k = pick(r, [10, 100]); return r() < 0.6 ? { q: `${frNum(d)} × ${k}`, a: clean(d * k) } : { q: `${frNum(d)} ÷ 10`, a: clean(d / 10) }; } },
  decimaux: { label: 'Additions de décimaux', make: (r) => { const a = ri(r, 1, 49); const b = ri(r, 1, 49); return r() < 0.6 ? { q: `${frNum(a / 10)} + ${frNum(b / 10)}`, a: clean((a + b) / 10) } : { q: `${frNum(Math.max(a, b) / 10)} − ${frNum(Math.min(a, b) / 10)}`, a: clean(Math.abs(a - b) / 10) }; } },
  fractions: { label: 'Fraction d’une quantité', make: (r) => {
    const [num, den, name] = pick(r, [[1, 2, 'la moitié'], [1, 3, 'le tiers'], [1, 4, 'le quart'], [3, 4, 'les trois quarts'], [2, 3, 'les deux tiers'], [1, 10, 'le dixième']]);
    const n = den * ri(r, 2, 12); return { q: `${name} de ${n}`, a: (n / den) * num };
  } },
  priorites: { label: 'Priorités de calcul', make: (r) => { const a = ri(r, 1, 20); const b = ri(r, 2, 9); const c = ri(r, 2, 9); return r() < 0.5 ? { q: `${a} + ${b} × ${c}`, a: a + b * c } : { q: `${b} × ${c} − ${Math.min(a, b * c)}`, a: b * c - Math.min(a, b * c) }; } },
  relatifsAdd: { label: 'Additions de nombres relatifs', make: (r) => { const a = ri(r, -9, 9) || 4; const b = ri(r, -9, 9) || -3; return r() < 0.6 ? { q: `${rel(a)} + ${rel(b)}`, a: a + b } : { q: `${rel(a)} − ${rel(b)}`, a: a - b }; } },
  relatifsMul: { label: 'Produits de nombres relatifs', make: (r) => { const a = ri(r, 2, 9) * pick(r, [1, -1]); const b = ri(r, 2, 9) * pick(r, [1, -1]); return { q: `${rel(a)} × ${rel(b)}`, a: a * b }; } },
  carres: { label: 'Carrés et racines carrées', make: (r) => { const n = ri(r, 2, 15); return r() < 0.6 ? { q: `${n}²`, a: n * n } : { q: `√${n * n}`, a: n }; } },
  puissances: { label: 'Puissances', make: (r) => {
    const k = pick(r, ['2', '2', '10', '3', '10neg']);
    if (k === '2') { const n = ri(r, 0, 10); return { q: `2${sup(n)}`, a: 2 ** n }; }
    if (k === '3') { const n = ri(r, 0, 4); return { q: `3${sup(n)}`, a: 3 ** n }; }
    if (k === '10') { const n = ri(r, 0, 6); return { q: `10${sup(n)}`, a: 10 ** n }; }
    const n = ri(r, 1, 3); return { q: `10${sup(-n)}`, a: clean(10 ** -n) };
  } },
  pourcentages: { label: 'Pourcentages', make: (r) => { const [p, step] = pick(r, [[10, 10], [20, 5], [25, 4], [50, 2], [75, 4], [5, 20], [1, 100]]); const n = step * ri(r, 1, 12); return { q: `${p} % de ${n}`, a: clean((p * n) / 100) }; } },
  evolutions: { label: 'Coefficients multiplicateurs', make: (r) => {
    const t = pick(r, [5, 10, 15, 20, 25, 30, 50, 75, 100]);
    return r() < 0.55 ? { q: `augmenter de ${t} %, c’est multiplier par …`, a: clean(1 + t / 100) } : { q: `baisser de ${Math.min(t, 90)} %, c’est multiplier par …`, a: clean(1 - Math.min(t, 90) / 100) };
  } },
};

/** Thèmes proposés pour chaque classe (le premier est le thème par défaut). */
export const ECLAIR_LEVELS = {
  cp: ['add10', 'sub10', 'comp10'],
  ce1: ['add20', 'sub20', 'doubles', 'tables25', 'comp10'],
  ce2: ['tables25', 'tables', 'comp100', 'doubles', 'dizaines'],
  cm1: ['tables', 'divisions', 'x10', 'comp100', 'dizaines'],
  cm2: ['tables', 'divisions', 'x10dec', 'decimaux', 'fractions'],
  '6e': ['tables', 'divisions', 'decimaux', 'fractions', 'priorites', 'x10dec'],
  '5e': ['relatifsAdd', 'priorites', 'fractions', 'decimaux', 'pourcentages'],
  '4e': ['relatifsMul', 'relatifsAdd', 'carres', 'puissances', 'pourcentages'],
  '3e': ['carres', 'puissances', 'pourcentages', 'relatifsMul', 'fractions'],
  '2nde': ['pourcentages', 'evolutions', 'puissances', 'carres', 'relatifsMul'],
  '1re': ['evolutions', 'pourcentages', 'puissances', 'carres'],
  tle: ['evolutions', 'puissances', 'pourcentages', 'carres'],
};

export const eclairThemes = (level) => (ECLAIR_LEVELS[level] || []).map((id) => ({ id, label: ECLAIR_THEMES[id].label }));

/** Série de `count` calculs (thème 'melange' : tous les thèmes de la classe), sans deux calculs identiques si possible. */
export function newEclair({ level, theme = 'melange', count = 10, rand = Math.random }) {
  const ids = (theme === 'melange' ? ECLAIR_LEVELS[level] || [] : [theme]).filter((id) => ECLAIR_THEMES[id]);
  const seen = new Set(); const queue = [];
  for (let k = 0; ids.length && queue.length < count && k < count * 40; k++) {
    const id = pick(rand, ids);
    const c = ECLAIR_THEMES[id].make(rand);
    if (seen.has(c.q) && k < count * 30) continue;
    seen.add(c.q); queue.push({ ...c, theme: id });
  }
  return { level, theme, count, queue, done: [], errors: 0, misses: [], startedAt: null, endedAt: null };
}

/** Lecture d'une réponse tapée : « 56 », « −3 », « 0,5 », « 1.2 ». */
export function parseAnswer(text) {
  const s = String(text || '').trim().replace(/\s+/g, '').replace(/[−–]/g, '-').replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

export const currentCalc = (e) => e.queue[0] || null;
export const isDone = (e) => e.queue.length === 0;

/** Répond au calcul en cours. Juste : il est rangé ; faux : il revient plus loin dans la série. */
export function answer(e, text, now = Date.now()) {
  const c = currentCalc(e);
  if (!c) return null;
  const v = parseAnswer(text);
  if (v === null) return { status: 'invalid', calc: c };
  if (e.startedAt === null) e.startedAt = now;
  e.queue.shift();
  if (Math.abs(v - c.a) < 1e-9) {
    e.done.push(c);
    if (isDone(e)) e.endedAt = now;
    return { status: 'right', calc: c };
  }
  e.errors++;
  if (!e.misses.some((m) => m.q === c.q)) e.misses.push(c);
  e.queue.splice(Math.min(e.queue.length, 3), 0, c); // il revient trois calculs plus loin (ou à la fin)
  return { status: 'wrong', calc: c, given: v };
}

export const elapsedMs = (e, now = Date.now()) => (e.startedAt === null ? 0 : (e.endedAt ?? now) - e.startedAt);
export const eclairStars = (e) => (e.errors === 0 ? 3 : e.errors <= 2 ? 2 : 1);
export const recordKey = (level, theme, count) => `eclair:${level}:${theme}:${count}`;
/** « 42,3 s » ou « 1 min 05 s ». */
export function formatMs(ms) {
  const s = Math.max(0, ms) / 1000;
  if (s < 60) return `${frNum(Math.round(s * 10) / 10)} s`;
  const m = Math.floor(s / 60); const r = Math.round(s - 60 * m);
  return `${m} min ${String(r).padStart(2, '0')} s`;
}
