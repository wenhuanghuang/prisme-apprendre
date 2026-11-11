/**
 * « La cible » : quelques nombres et un nombre à atteindre. On choisit deux nombres et une opération ; le résultat
 * remplace les deux nombres, et ainsi de suite. On reste dans les nombres entiers positifs : pas de soustraction qui
 * donne zéro ou un négatif, pas de division qui ne tombe pas juste. Chaque cible est fabriquée à partir des nombres
 * donnés, donc on peut toujours l'atteindre exactement (une solution est gardée pour la montrer).
 * Moteur pur : pas de DOM, pas de stockage.
 */

export const OPS = ['+', '−', '×', '÷'];

/** Réglages par classe : combien de nombres, lesquels, quelles opérations, quelles cibles, combien d'étapes au moins. */
export const CIBLE_LEVELS = {
  ce1: { count: 3, small: 10, big: [], ops: ['+', '−'], min: 11, max: 40, minSteps: 2, maxProduct: 0 },
  ce2: { count: 4, small: 10, big: [20], ops: ['+', '−', '×'], min: 20, max: 100, minSteps: 2, maxProduct: 100 },
  cm1: { count: 5, small: 10, big: [25], ops: OPS, min: 40, max: 300, minSteps: 2, maxProduct: 300 },
  cm2: { count: 5, small: 10, big: [25, 50], ops: OPS, min: 100, max: 500, minSteps: 3, maxProduct: 600 },
  '6e': { count: 6, small: 10, big: [25, 50, 75, 100], ops: OPS, min: 100, max: 999, minSteps: 3, maxProduct: 1500 },
};
for (const l of ['5e', '4e', '3e', '2nde', '1re', 'tle']) CIBLE_LEVELS[l] = { ...CIBLE_LEVELS['6e'], minSteps: 4 };

const cfg = (level) => CIBLE_LEVELS[String(level || '').toLowerCase()] || CIBLE_LEVELS.cm1;
const ri = (rand, a, b) => a + Math.floor(rand() * (b - a + 1));
const shuffle = (arr, rand) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** Résultat d'une opération entre entiers positifs, ou null si elle n'est pas permise. */
export function compute(a, op, b) {
  if (op === '+') return a + b;
  if (op === '−') return a > b ? a - b : null;
  if (op === '×') return a * b;
  if (op === '÷') return b > 0 && a % b === 0 ? a / b : null;
  return null;
}
/** Pourquoi une opération est refusée. */
export function refusal(a, op, b) {
  if (op === '−') return `${a} − ${b} ne donne pas un nombre positif : essaie ${b} − ${a}, ou une autre opération.`;
  if (op === '÷') return `${a} ÷ ${b} ne tombe pas juste : on ne garde que des nombres entiers.`;
  return 'Opération impossible.';
}

/** Tire les nombres d'une partie : des petits (au plus deux fois le même) et au plus un grand nombre de chaque. */
function drawNumbers(c, rand) {
  const out = []; const seen = {};
  const nBig = c.big.length ? ri(rand, 0, Math.min(2, c.big.length)) : 0;
  for (const b of shuffle(c.big, rand).slice(0, nBig)) out.push(b);
  while (out.length < c.count) {
    const n = ri(rand, 1, c.small);
    if ((seen[n] || 0) >= 2) continue;
    seen[n] = (seen[n] || 0) + 1; out.push(n);
  }
  return shuffle(out, rand);
}

/**
 * Une partie : { numbers, target, solution: [{ a, op, b, r }] }. La cible est obtenue en combinant au hasard une partie
 * des nombres, avec des opérations qui ne soient pas « gratuites » (× 1, ÷ 1).
 */
export function newPuzzle(level, rand = Math.random) {
  const c = cfg(level);
  for (let attempt = 0; attempt < 2000; attempt++) {
    const numbers = drawNumbers(c, rand);
    const k = ri(rand, Math.min(c.count, c.minSteps + 1), c.count);
    let pool = shuffle(numbers, rand).slice(0, k);
    const steps = [];
    let ok = true;
    while (pool.length > 1 && ok) {
      const [x, y, ...rest] = shuffle(pool, rand);
      const a = Math.max(x, y); const b = Math.min(x, y);
      const ops = shuffle(c.ops, rand).filter((op) => {
        if (op === '×') return a > 1 && b > 1 && a * b <= Math.max(c.maxProduct, c.max);
        if (op === '÷') return b > 1 && a % b === 0 && a !== b;
        if (op === '−') return a > b && a - b !== b;
        return true;
      });
      if (!ops.length) { ok = false; break; }
      const op = ops[0]; const r = compute(a, op, b);
      steps.push({ a, op, b, r });
      pool = [...rest, r];
    }
    if (!ok || steps.length < c.minSteps) continue;
    const target = pool[0];
    if (target < c.min || target > c.max || numbers.includes(target)) continue;
    return { numbers, target, solution: steps };
  }
  // filet de sécurité (jamais atteint en pratique) : une somme, permise à toutes les classes
  return { numbers: [9, 8, 5, 3, 2, 7].slice(0, c.count), target: 22, solution: [{ a: 9, op: '+', b: 8, r: 17 }, { a: 17, op: '+', b: 5, r: 22 }] };
}

/** Une série de parties, sans deux fois la même cible. */
export function newSeries(level, count = 5, rand = Math.random) {
  const out = []; const seen = new Set();
  for (let k = 0; out.length < count && k < count * 30; k++) {
    const p = newPuzzle(level, rand);
    if (seen.has(p.target)) continue;
    seen.add(p.target); out.push(p);
  }
  return out;
}

/** État de jeu d'une partie : les plaques encore disponibles et les étapes faites. */
export function startBoard(puzzle) {
  return { target: puzzle.target, tiles: puzzle.numbers.map((v, i) => ({ id: `n${i}`, value: v })), steps: [], next: puzzle.numbers.length };
}

/**
 * Combine deux plaques. Renvoie { board } (nouvel état) ou { error } si l'opération n'est pas permise.
 */
export function combine(board, idA, op, idB) {
  if (idA === idB) return { error: 'Choisis deux nombres différents.' };
  const A = board.tiles.find((t) => t.id === idA); const B = board.tiles.find((t) => t.id === idB);
  if (!A || !B || !OPS.includes(op)) return { error: 'Choisis un nombre, une opération, puis un autre nombre.' };
  const r = compute(A.value, op, B.value);
  if (r === null) return { error: refusal(A.value, op, B.value) };
  const tile = { id: `n${board.next}`, value: r, made: true };
  return {
    board: {
      ...board,
      tiles: [...board.tiles.filter((t) => t.id !== idA && t.id !== idB), tile],
      steps: [...board.steps, { a: A.value, op, b: B.value, r, used: [A, B], made: tile.id }],
      next: board.next + 1,
    },
  };
}

/** Annule la dernière étape. */
export function undo(board) {
  if (!board.steps.length) return board;
  const last = board.steps[board.steps.length - 1];
  return { ...board, tiles: [...board.tiles.filter((t) => t.id !== last.made), ...last.used], steps: board.steps.slice(0, -1) };
}

/** Le nombre le plus proche de la cible parmi ceux que l'on a. */
export const closest = (board) => board.tiles.reduce((best, t) => (Math.abs(t.value - board.target) < Math.abs(best - board.target) ? t.value : best), board.tiles[0].value);
export const isHit = (board) => board.tiles.some((t) => t.value === board.target);

/** Points d'une partie : 3 dans le mille, 2 à 2 près, 1 à 10 près, 0 sinon. */
export function points(value, target) {
  const d = Math.abs(value - target);
  return d === 0 ? 3 : d <= 2 ? 2 : d <= 10 ? 1 : 0;
}

/** Une étape écrite : « 9 × 8 = 72 ». */
export const stepText = (s) => `${s.a} ${s.op} ${s.b} = ${s.r}`;
export const solutionText = (puzzle) => puzzle.solution.map(stepText).join(' ; ');

/** Étoiles d'une série : selon la part des points possibles. */
export function cibleStars(total, max) {
  const r = max ? total / max : 0;
  return r >= 0.85 ? 3 : r >= 0.5 ? 2 : 1;
}
