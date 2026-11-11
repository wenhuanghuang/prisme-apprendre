/**
 * « Le plus grand ! » : deux nombres ou deux calculs, lequel est le plus grand ? Les paires suivent la classe :
 * nombres entiers au CP, calculs au CE, décimaux et fractions en CM et en 6e, relatifs, puissances, racines au collège,
 * exponentielle et logarithme au lycée. Les deux valeurs sont toujours nettement différentes (jamais d'égalité).
 * Moteur pur.
 */

const ri = (rand, a, b) => a + Math.floor(rand() * (b - a + 1));
const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];
const fr = (x) => String(Number(x.toPrecision(12))).replace('.', ',').replace('-', '−');
const rel = (x) => (x < 0 ? `(−${-x})` : `${x}`);
const sup = (n) => String(n).split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(c)] || (c === '-' ? '⁻' : c)).join('');
const card = (label, value) => ({ label, value });

/** Familles de paires : chacune renvoie [carte, carte]. */
const MAKERS = {
  // CP : nombres jusqu'à 100, souvent avec les mêmes chiffres (47 / 74)
  entiers100: (r) => { const a = ri(r, 1, 9); const b = ri(r, 0, 9); if (a === b || b === 0) return [card(String(10 * a + 3), 10 * a + 3), card(String(10 * a + 8), 10 * a + 8)]; return [card(String(10 * a + b), 10 * a + b), card(String(10 * b + a), 10 * b + a)]; },
  // CE1 : additions et nombres jusqu'à 1 000
  sommes: (r) => { const a = ri(r, 12, 60); const b = ri(r, 3, 30); const c = a + b + pick(r, [-7, -4, -2, 2, 3, 6]); return [card(`${a} + ${b}`, a + b), card(String(c), c)]; },
  entiers1000: (r) => { const n = ri(r, 101, 989); const m = n + pick(r, [-90, -9, -1, 1, 9, 90, 100, -100]); return [card(String(n), n), card(String(m), m)]; },
  // CE2 : produits des tables
  produits: (r) => { const a = ri(r, 3, 9); const b = ri(r, 3, 9); let c; let d; do { c = ri(r, 3, 9); d = ri(r, 3, 9); } while (c * d === a * b); return [card(`${a} × ${b}`, a * b), card(`${c} × ${d}`, c * d)]; },
  // CM : décimaux qui piègent (2,5 et 2,45), fractions simples
  decimaux: (r) => { const a = ri(r, 1, 9); const x = a + ri(r, 1, 9) / 10; const y = a + ri(r, 10, 99) / 100; return Math.abs(x - y) < 1e-9 ? MAKERS.decimaux(r) : [card(fr(x), x), card(fr(y), y)]; },
  fractions: (r) => { const p = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [5, 6], [3, 8], [7, 10]]; let a; let b; do { a = pick(r, p); b = pick(r, p); } while (a[0] * b[1] === b[0] * a[1]); return [card(`${a[0]}/${a[1]}`, a[0] / a[1]), card(`${b[0]}/${b[1]}`, b[0] / b[1])]; },
  fracDec: (r) => { const [n, d] = pick(r, [[1, 2], [3, 4], [1, 4], [2, 5], [3, 5], [1, 5], [7, 10]]); const v = n / d; const w = Math.round((v + pick(r, [-0.15, -0.05, 0.05, 0.15])) * 100) / 100; return [card(`${n}/${d}`, v), card(fr(w), w)]; },
  pourcents: (r) => { const [p, base] = pick(r, [[10, 70], [20, 50], [25, 80], [50, 30], [75, 20], [30, 60]]); const v = (p * base) / 100; const w = v + pick(r, [-3, -1, 1, 2, 4]); return [card(`${p} % de ${base}`, v), card(String(w), w)]; },
  // 5e-4e : relatifs
  relatifs: (r) => { const a = ri(r, -12, 12) || -5; let b; do { b = ri(r, -12, 12); } while (b === a); return [card(fr(a), a), card(fr(b), b)]; },
  calculsRel: (r) => { const a = ri(r, -6, 6) || 3; const b = ri(r, -6, 6) || -2; const v = a * b; const w = v + pick(r, [-3, -1, 2, 5]); return [card(`${rel(a)} × ${rel(b)}`, v), card(fr(w), w)]; },
  // 4e-3e : puissances, écriture scientifique, racines
  puissances: (r) => { const pairs = [[[2, 5], [5, 2]], [[2, 10], [10, 3]], [[3, 4], [4, 3]], [[2, 6], [6, 2]], [[10, 2], [2, 7]], [[3, 3], [5, 2]], [[2, 4], [4, 2.5]]]; const [[a, b], [c, d]] = pick(r, pairs.slice(0, 6)); return [card(`${a}${sup(b)}`, a ** b), card(`${c}${sup(d)}`, c ** d)]; },
  scientifique: (r) => { const a = ri(r, 11, 99) / 10; const e = ri(r, -4, 6); const b = ri(r, 11, 99) / 10; const f = e + pick(r, [-1, 0, 1]); const v = a * 10 ** e; const w = b * 10 ** f; return Math.abs(v - w) / Math.max(v, w) < 0.02 ? MAKERS.scientifique(r) : [card(`${fr(a)} × 10${sup(e)}`, v), card(`${fr(b)} × 10${sup(f)}`, w)]; },
  racines: (r) => { const n = ri(r, 3, 12); const k = n * n + pick(r, [-3, -2, 2, 3, 5]); return [card(`√${k}`, Math.sqrt(k)), card(String(n), n)]; },
  // lycée : exponentielle, logarithme, croissances
  expln: (r) => pick(r, [
    () => [card('e²', Math.E ** 2), card('7', 7)], () => [card('ln(10)', Math.log(10)), card('2', 2)], () => [card('e', Math.E), card('2,8', 2.8)],
    () => [card('1,1¹⁰', 1.1 ** 10), card('2', 2)], () => [card('ln(2)', Math.log(2)), card('0,7', 0.7)], () => [card('e⁻¹', 1 / Math.E), card('0,3', 0.3)],
    () => [card('2¹⁰', 1024), card('10³', 1000)], () => [card('√2', Math.SQRT2), card('1,4', 1.4)], () => [card('π', Math.PI), card('22/7', 22 / 7)],
    () => [card('0,9¹⁰', 0.9 ** 10), card('0,5', 0.5)], () => [card('ln(100)', Math.log(100)), card('5', 5)], () => [card('e³', Math.E ** 3), card('20', 20)],
  ])(),
};

/** Familles par classe. */
export const COMPARE_LEVELS = {
  cp: ['entiers100'], ce1: ['entiers100', 'sommes', 'entiers1000'], ce2: ['entiers1000', 'sommes', 'produits'],
  cm1: ['produits', 'decimaux', 'fractions', 'entiers1000'], cm2: ['decimaux', 'fractions', 'fracDec', 'produits'],
  '6e': ['decimaux', 'fractions', 'fracDec', 'pourcents'], '5e': ['relatifs', 'fracDec', 'pourcents', 'fractions'],
  '4e': ['relatifs', 'calculsRel', 'puissances', 'scientifique'], '3e': ['puissances', 'scientifique', 'racines', 'calculsRel'],
  '2nde': ['racines', 'scientifique', 'expln', 'puissances'], '1re': ['expln', 'scientifique', 'racines'], tle: ['expln', 'scientifique', 'racines'],
};

/** Une manche : deux cartes dans un ordre au hasard, la bonne réponse (0 = gauche, 1 = droite). */
export function newRound(level, rand = Math.random) {
  const kinds = COMPARE_LEVELS[String(level || '').toLowerCase()] || COMPARE_LEVELS['5e'];
  for (let k = 0; k < 50; k++) {
    const pair = MAKERS[pick(rand, kinds)](rand);
    if (!pair || Math.abs(pair[0].value - pair[1].value) < 1e-9 || pair[0].label === pair[1].label) continue;
    const cards = rand() < 0.5 ? pair : [pair[1], pair[0]];
    return { cards, answer: cards[0].value > cards[1].value ? 0 : 1 };
  }
  return { cards: [card('3', 3), card('5', 5)], answer: 1 };
}

/** Une série de manches sans deux fois la même paire. */
export function newSeries(level, count = 15, rand = Math.random) {
  const out = []; const seen = new Set();
  for (let k = 0; out.length < count && k < count * 30; k++) {
    const r = newRound(level, rand);
    const key = r.cards.map((c) => c.label).sort().join('|');
    if (seen.has(key) && k < count * 20) continue;
    seen.add(key); out.push(r);
  }
  return out;
}

/** Étoiles d'une série en solo : sans erreur 3, une ou deux erreurs 2, sinon 1. */
export const compareStars = (errors) => (errors === 0 ? 3 : errors <= 2 ? 2 : 1);
/** Explication : la valeur des deux cartes. */
export const explain = (round) => round.cards.map((c) => `${c.label} = ${fr(Math.round(c.value * 1000) / 1000)}`).join(' ; ');
