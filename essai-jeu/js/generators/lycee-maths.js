/**
 * Mathématiques de seconde : générateurs rattachés aux chapitres du programme (parcours de référence maths-2nde),
 * pour que la quête de l'année, le jeu de plateau et l'énigme du jour existent aussi au lycée. Chaque exercice a
 * un indice, une correction détaillée et, quand c'est utile, les erreurs typiques reconnues.
 */
import { pick, sample, ri, nz, numeric, expression, text, problem, mc, fr, par, poly } from './gen-util.js';
import { qcm } from './primaire-savoirs.js';

const GEN = [];
function add(g) {
  const { make, ...rest } = g;
  GEN.push({ tracks: ['classe', 'approfondissement'], options: [], levels: ['2nde'], subject: 'maths', ...rest, make(rand, o = {}, tier = 'classe') { return make(rand, tier !== 'classe'); } });
}
const neg = (n) => String(n).replace('-', '−');
/** Écritures acceptées d'un intervalle : crochets, séparateur « ; » ou « , », espaces, signe moins. */
function intervalAccept(L, a, b, R) {
  const out = new Set();
  for (const sep of [';', ' ; ', '; ', ' ;', ',', ', '])
    for (const f of [String, neg]) out.add(`${L}${f(a)}${sep}${f(b)}${R}`);
  return [...out];
}

/* ------------------------------ Réels, intervalles, valeur absolue ------------------------------ */

add({
  id: 'l2-intervalles', label: 'Intervalles et valeur absolue', skill: 'l2.reels.intervalles', chapters: ['2nde-m-reels', '2nde-m-logique'],
  description: 'Écrire un ensemble de réels sous forme d’intervalle, lire un crochet, calculer une distance avec la valeur absolue.',
  make(rand, hard) {
    const k = pick(rand, hard ? ['ecrire', 'absolue', 'intersection', 'appartient'] : ['ecrire', 'ecrire', 'absolue', 'appartient']);
    if (k === 'ecrire') {
      const a = ri(rand, -9, 4); const b = a + ri(rand, 2, 9);
      const [ls, rs] = [pick(rand, ['≤', '<']), pick(rand, ['≤', '<'])];
      const L = ls === '≤' ? '[' : ']'; const R = rs === '≤' ? ']' : '[';
      const wrongL = L === '[' ? ']' : '['; const wrongR = R === ']' ? '[' : ']';
      return text(intervalAccept(L, a, b, R), {
        prompt: `Écris sous forme d’intervalle l’ensemble des réels $x$ tels que $${a} ${ls} x ${rs} ${b}$.`,
        misconceptions: [mc(`${wrongL}${a};${b}${wrongR}`, 'mc:crochets-inverses', 'notion', 'Le crochet est tourné vers le nombre quand celui-ci est compris (≤), à l’envers quand il est exclu (<).')],
        expectedSeconds: 40, hints: ['Une borne comprise (≤) : crochet tourné vers l’intérieur, [ ou ]. Une borne exclue (<) : crochet tourné vers l’extérieur.'],
        solution: `${L}${neg(a)} ; ${neg(b)}${R} : ${neg(a)} est ${L === '[' ? 'compris' : 'exclu'}, ${neg(b)} est ${R === ']' ? 'compris' : 'exclu'}.`, representation: 'symbolique',
      });
    }
    if (k === 'absolue') {
      const a = ri(rand, -9, 9); let b = ri(rand, -9, 9); if (b === a) b = a + 3;
      return numeric(Math.abs(a - b), {
        prompt: `Sur la droite des réels, quelle est la distance entre $${a}$ et $${b}$ ? (C’est $|${a} − ${par(b)}|$.)`,
        misconceptions: a - b < 0 ? [mc(a - b, 'mc:distance-negative', 'notion', 'Une distance est toujours positive : la valeur absolue enlève le signe.')] : [],
        expectedSeconds: 30, hints: ['La distance entre a et b est |a − b| : on calcule la différence, puis on enlève le signe.'],
        solution: `$|${a} − ${par(b)}| = |${a - b}| = ${Math.abs(a - b)}$`, representation: 'symbolique',
      });
    }
    if (k === 'intersection') {
      const a = ri(rand, -8, 0); const c = a + ri(rand, 1, 4); const b = c + ri(rand, 1, 5); const d = b + ri(rand, 1, 5);
      return qcm(rand, [`Que vaut $[${a} ; ${b}] ∩ [${c} ; ${d}]$ ?`, `[${neg(c)} ; ${neg(b)}]`, [`[${neg(a)} ; ${neg(d)}]`, `[${neg(a)} ; ${neg(c)}]`, `[${neg(b)} ; ${neg(d)}]`],
        `L’intersection contient les réels qui sont dans les deux intervalles à la fois : de ${neg(c)} à ${neg(b)}. ([${neg(a)} ; ${neg(d)}] serait la réunion.)`], { hint: 'Dessine les deux intervalles sur une même droite graduée.' });
    }
    const a = ri(rand, -5, 3); const b = a + ri(rand, 2, 6);
    return qcm(rand, [`Le réel $${b}$ appartient-il à l’intervalle $]${a} ; ${b}[$ ?`, `non : le crochet ouvert exclut ${neg(b)}`, ['oui, c’est une borne', 'oui, car il est plus grand que ' + neg(a), 'on ne peut pas savoir'],
      `]${neg(a)} ; ${neg(b)}[ contient les réels strictement compris entre ${neg(a)} et ${neg(b)} : les bornes sont exclues.`]);
  },
});

/* ------------------------------ Arithmétique ------------------------------ */

const PRIMES = [7, 11, 13, 17, 19, 23];
const DIV_N = [12, 18, 20, 24, 28, 30, 36, 40, 45, 48, 50, 60, 72, 84, 90, 96, 100];
const divisors = (n) => Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0);
const PARITE = [
  ['Si $n$ est un entier impair, alors $n^2$ est…', 'impair', ['pair', 'parfois pair, parfois impair', 'un multiple de 4'], 'Si n = 2k + 1, alors n² = 4k² + 4k + 1 = 2(2k² + 2k) + 1 : c’est un nombre impair.'],
  ['La somme de deux entiers impairs est…', 'paire', ['impaire', 'parfois paire, parfois impaire', 'un multiple de 4'], '(2k + 1) + (2m + 1) = 2(k + m + 1) : c’est un nombre pair.'],
  ['Pour tout entier $n$, le produit $n(n + 1)$ est…', 'pair', ['impair', 'un multiple de 3', 'parfois pair, parfois impair'], 'n et n + 1 sont deux entiers consécutifs : l’un des deux est pair, donc leur produit est pair.'],
  ['Un multiple de 6 est-il toujours un multiple de 3 ?', 'oui, car 6 = 2 × 3', ['non, jamais', 'seulement s’il est pair', 'seulement s’il est plus grand que 30'], 'Si a = 6k, alors a = 3 × (2k) : a est un multiple de 3.'],
  ['Un multiple de 3 est-il toujours un multiple de 6 ?', 'non : 9 est un multiple de 3 mais pas de 6', ['oui, toujours', 'oui, s’il est impair', 'oui, car 3 divise 6'], 'Un seul contre-exemple suffit à montrer qu’une affirmation est fausse : 9 = 3 × 3 n’est pas divisible par 6.'],
];
const PRIME_Q = [[91, 7], [97, 0], [119, 7], [113, 0], [143, 11], [127, 0], [221, 13], [131, 0], [187, 11], [101, 0], [133, 7], [109, 0]];
add({
  id: 'l2-arithmetique', label: 'Multiples, diviseurs, nombres premiers', skill: 'l2.arithmetique', chapters: ['2nde-m-arithmetique'],
  description: 'Diviseurs d’un entier, plus petit diviseur premier, nombres premiers, parité.',
  make(rand, hard) {
    const k = pick(rand, ['premier-div', 'nb-div', 'parite', 'premier']);
    if (k === 'premier-div') {
      const [p, q] = sample(rand, PRIMES, 2).sort((x, y) => x - y);
      return numeric(p, { prompt: `Quel est le plus petit diviseur premier de $${p * q}$ ?`, misconceptions: [mc(1, 'mc:un-premier', 'notion', '1 n’est pas un nombre premier : un nombre premier a exactement deux diviseurs.')], expectedSeconds: 60,
        hints: ['Teste dans l’ordre la divisibilité par 2, 3, 5, 7, 11, 13…'], solution: `$${p * q} = ${p} × ${q}$ : il n’est divisible ni par 2, ni par 3, ni par 5${p > 7 ? ', ni par 7' : ''}${p > 11 ? ', ni par 11' : ''}… le plus petit diviseur premier est ${p}.`, representation: 'symbolique' });
    }
    if (k === 'nb-div') {
      const n = pick(rand, DIV_N); const ds = divisors(n);
      return numeric(ds.length, { prompt: `Combien l’entier $${n}$ a-t-il de diviseurs positifs (en comptant 1 et ${n}) ?`, misconceptions: [mc(ds.length - 2, 'mc:oubli-1-n', 'notion', `1 et ${n} sont aussi des diviseurs de ${n}.`)], expectedSeconds: 75, difficulty: 3,
        hints: ['Cherche les diviseurs par paires : 1 × …, 2 × …, 3 × …'], solution: `Diviseurs de ${n} : ${ds.join(', ')} — il y en a ${ds.length}.`, representation: 'symbolique' });
    }
    if (k === 'parite') return qcm(rand, pick(rand, PARITE), { hint: 'Écris un nombre pair 2k et un nombre impair 2k + 1, avec k entier.' });
    const [n, d] = pick(rand, PRIME_Q);
    return d
      ? qcm(rand, [`Le nombre $${n}$ est-il premier ?`, `non : il est divisible par ${d}`, ['oui', 'non : il est pair', 'non : il est divisible par 5'], `${n} = ${d} × ${n / d} : il a d’autres diviseurs que 1 et lui-même.`], { hint: 'Teste les divisions par 2, 3, 5, 7, 11, 13 : il suffit d’aller jusqu’à la racine carrée du nombre.' })
      : qcm(rand, [`Le nombre $${n}$ est-il premier ?`, 'oui : ses seuls diviseurs sont 1 et lui-même', ['non : il est divisible par 7', 'non : il est divisible par 3', 'non : il est divisible par 11'], `${n} n’est divisible par aucun nombre premier inférieur ou égal à √${n} ≈ ${Math.floor(Math.sqrt(n))} : il est premier.`], { hint: 'Il suffit de tester les nombres premiers jusqu’à la racine carrée du nombre.' });
  },
});

/* ------------------------------ Puissances, racines carrées ------------------------------ */

add({
  id: 'l2-puissances-racines', label: 'Puissances et racines carrées', skill: 'l2.calcul.puissances', chapters: ['2nde-m-calcul', '2nde-m-automatismes'],
  description: 'Règles de calcul sur les puissances, notation scientifique, simplification de racines carrées.',
  make(rand, hard) {
    const k = pick(rand, ['produit', 'puissance', 'quotient', 'scientifique', 'racine', 'racine-produit']);
    const a = pick(rand, [2, 3, 5, 7, 10]);
    if (k === 'produit') {
      const m = ri(rand, 2, 9); const n = ri(rand, 2, 9);
      return numeric(m + n, { prompt: `On a $${a}^${m} × ${a}^${n} = ${a}^k$. Quel est l’exposant k ?`, misconceptions: m * n !== m + n ? [mc(m * n, 'mc:produit-exposants', 'notion', 'Pour multiplier deux puissances d’un même nombre, on ADDITIONNE les exposants.')] : [],
        expectedSeconds: 25, hints: [`$${a}^${m}$, c’est ${m} facteurs ${a} ; $${a}^${n}$, ${n} facteurs de plus.`], solution: `${a}^${m} × ${a}^${n} = ${a}^(${m} + ${n}) = ${a}^${m + n}`, representation: 'symbolique' });
    }
    if (k === 'puissance') {
      const m = ri(rand, 2, 6); const n = ri(rand, 2, 5);
      return numeric(m * n, { prompt: `On a $(${a}^${m})^${n} = ${a}^k$. Quel est l’exposant k ?`, misconceptions: m * n !== m + n ? [mc(m + n, 'mc:somme-exposants', 'notion', 'Une puissance de puissance : on MULTIPLIE les exposants.')] : [],
        expectedSeconds: 25, hints: [`$(${a}^${m})^${n}$, c’est ${n} fois le facteur $${a}^${m}$.`], solution: `(${a}^${m})^${n} = ${a}^(${m} × ${n}) = ${a}^${m * n}`, representation: 'symbolique' });
    }
    if (k === 'quotient') {
      const n = ri(rand, 2, 6); const m = n + ri(rand, 1, 7);
      return numeric(m - n, { prompt: `On a $${a}^${m} / ${a}^${n} = ${a}^k$. Quel est l’exposant k ?`, misconceptions: m % n === 0 && m / n !== m - n ? [mc(m / n, 'mc:quotient-exposants', 'notion', 'Pour diviser deux puissances d’un même nombre, on SOUSTRAIT les exposants.')] : [],
        expectedSeconds: 25, hints: ['Simplifie les facteurs communs en haut et en bas.'], solution: `${a}^${m} ÷ ${a}^${n} = ${a}^(${m} − ${n}) = ${a}^${m - n}`, representation: 'symbolique' });
    }
    if (k === 'scientifique') {
      const mant = ri(rand, 11, 99) / 10; const e = pick(rand, hard ? [-6, -5, -4, 5, 6, 7] : [-4, -3, -2, 3, 4, 5]);
      const value = (mant * 10 ** e).toFixed(Math.max(0, -e + 1)).replace(/\.?0+$/, '');
      const shown = fr(Number(value));
      return numeric(e, { prompt: `En notation scientifique, $${shown} = ${fr(mant)} × 10^k$. Quel est l’exposant k ?`, misconceptions: [mc(-e, 'mc:signe-exposant', 'signe', e < 0 ? 'Le nombre est plus petit que 1 : l’exposant est négatif.' : 'Le nombre est plus grand que 10 : l’exposant est positif.')],
        expectedSeconds: 45, hints: ['Compte de combien de rangs la virgule se déplace pour obtenir un nombre entre 1 et 10.'], solution: `${shown} = ${fr(mant)} × 10^(${e})`, representation: 'symbolique' });
    }
    if (k === 'racine') {
      const m = pick(rand, [2, 3, 5, 6, 7]); const c = ri(rand, 2, hard ? 9 : 6);
      return numeric(c, { prompt: `Écris √${c * c * m} sous la forme a√${m}, avec a entier. Que vaut a ?`, misconceptions: [mc(c * c, 'mc:racine-carre', 'notion', `√${c * c} = ${c} : on sort la racine carrée du facteur ${c * c}, pas le facteur lui-même.`)],
        expectedSeconds: 50, hints: [`Cherche un carré parfait qui divise ${c * c * m} : ${c * c * m} = ${c * c} × ${m}.`], solution: `√${c * c * m} = √${c * c} × √${m} = ${c}√${m}`, representation: 'symbolique' });
    }
    const [x, y, r] = pick(rand, [[8, 2, 4], [3, 12, 6], [2, 18, 6], [5, 20, 10], [27, 3, 9], [2, 50, 10], [7, 28, 14], [6, 24, 12]]);
    return numeric(r, { prompt: `Calcule √${x} × √${y}.`, misconceptions: [mc(x * y, 'mc:oubli-racine', 'notion', `√${x} × √${y} = √${x * y} : il reste à prendre la racine carrée.`)],
      expectedSeconds: 30, hints: ['Pour des nombres positifs : √a × √b = √(a × b).'], solution: `√${x} × √${y} = √${x * y} = ${r}`, representation: 'symbolique' });
  },
});

/* ------------------------------ Identités remarquables ------------------------------ */

add({
  id: 'l2-identites', label: 'Développer avec les identités remarquables', skill: 'l2.calcul.identites', chapters: ['2nde-m-calcul'],
  description: '(a + b)², (a − b)², (a − b)(a + b) : développer et réduire ; l’oubli du double produit est repéré.',
  make(rand) {
    const a = ri(rand, 1, 5); const b = ri(rand, 1, 9);
    const k = pick(rand, ['plus', 'moins', 'diff']);
    if (k === 'diff') {
      const ans = poly([-b * b, 0, a * a]);
      return expression(ans, { form: 'developpee-reduite', expectedSeconds: 60, prompt: `Développe et réduis : $(${poly([-b, a])})(${poly([b, a])})$`,
        misconceptions: [mc(poly([b * b, 0, a * a]), 'mc:signe-identite3', 'signe', `$(a − b)(a + b) = a^2 − b^2$ : le carré de ${b} est retranché.`)],
        hints: ['Troisième identité remarquable : (a − b)(a + b) = a² − b².'], solution: `$(${poly([-b, a])})(${poly([b, a])}) = (${poly([0, a])})^2 − ${b}^2 = ${ans}$` });
    }
    const s = k === 'plus' ? 1 : -1;
    const ans = poly([b * b, 2 * a * b * s, a * a]);
    return expression(ans, { form: 'developpee-reduite', expectedSeconds: 75, difficulty: 3, prompt: `Développe et réduis : $(${poly([s * b, a])})^2$`,
      misconceptions: [mc(poly([b * b, 0, a * a]), 'mc:oubli-double-produit', 'notion', `$(a ${s > 0 ? '+' : '−'} b)^2 = a^2 ${s > 0 ? '+' : '−'} 2ab + b^2$ : n’oublie pas le double produit $2 × ${poly([0, a])} × ${b}$.`)],
      hints: [`${s > 0 ? '(a + b)² = a² + 2ab + b²' : '(a − b)² = a² − 2ab + b²'}, avec a = ${poly([0, a])} et b = ${b}.`], solution: `$(${poly([s * b, a])})^2 = (${poly([0, a])})^2 ${s > 0 ? '+' : '−'} 2 × ${poly([0, a])} × ${b} + ${b}^2 = ${ans}$` });
  },
});

/* ------------------------------ Équations et inéquations ------------------------------ */

add({
  id: 'l2-equations', label: 'Équations et inéquations du premier degré, produit nul', skill: 'l2.equations', chapters: ['2nde-m-equations', '2nde-m-automatismes'],
  description: 'Résoudre ax + b = cx + d, une équation produit nul, une inéquation (avec le changement de sens quand on divise par un négatif).',
  make(rand, hard) {
    const k = pick(rand, hard ? ['lineaire', 'fraction', 'produit', 'inequation'] : ['lineaire', 'lineaire', 'produit', 'inequation']);
    if (k === 'lineaire') {
      const x0 = ri(rand, -9, 9); let a = nz(rand, -6, 9); let c = nz(rand, -6, 9); if (a === c) c = a + 2; if (c === 0) c = 1;
      const b = ri(rand, -12, 12); const d = (a - c) * x0 + b;
      return numeric(x0, { prompt: `Résous l’équation $${poly([b, a])} = ${poly([d, c])}$. Quelle est la solution ?`, expectedSeconds: 75,
        misconceptions: (d + b) % (a - c) === 0 && (d + b) / (a - c) !== x0 ? [mc((d + b) / (a - c), 'mc:signe-transposition', 'signe', 'Quand un terme change de membre, il change de signe : on ajoute ou on retranche la même chose des deux côtés.')] : [],
        hints: ['Regroupe les termes en x d’un côté et les nombres de l’autre.'], solution: `$${poly([0, a - c])} = ${fr(d - b)}$, donc x = ${fr(d - b)} / ${par(a - c)} = ${fr(x0)}`, representation: 'symbolique' });
    }
    if (k === 'fraction') {
      const a = pick(rand, [3, 4, 6, 7, 8]); const b = ri(rand, -9, 9); let c = ri(rand, -9, 9); if ((c - b) % a === 0) c += 1;
      return numeric((c - b) / a, { prompt: `Résous $${poly([b, a])} = ${c}$. (Tu peux répondre par une fraction, par exemple 5/3.)`, tolerance: 1e-9, expectedSeconds: 60,
        hints: [`Retranche ${b} des deux côtés, puis divise par ${a}.`], solution: `$${a}x = ${c - b}$, donc x = ${c - b}/${a}`, representation: 'symbolique' });
    }
    if (k === 'produit') {
      const p = ri(rand, -8, 8); const a = ri(rand, 1, 4); const q = nz(rand, -6, 6); const b = -a * q; // ax + b = 0 ⇔ x = q
      const [lo, hi] = [Math.min(p, q), Math.max(p, q)];
      if (lo === hi) return numeric(p, { prompt: `Résous $(${poly([-p, 1])})(${poly([b, a])}) = 0$ : quelle est l’unique solution ?`, expectedSeconds: 60, hints: ['Un produit est nul si et seulement si l’un de ses facteurs est nul.'], solution: `Les deux facteurs s’annulent en $x = ${p}$.`, representation: 'symbolique' });
      const askLow = rand() < 0.5;
      return numeric(askLow ? lo : hi, { prompt: `Résous $(${poly([-p, 1])})(${poly([b, a])}) = 0$. Quelle est la ${askLow ? 'plus petite' : 'plus grande'} des deux solutions ?`, expectedSeconds: 75,
        misconceptions: [mc(-(askLow ? lo : hi), 'mc:signe-racine', 'signe', `$x − ${par(p)} = 0$ donne $x = ${p}$ (et non son opposé).`)].filter((m) => m.answer !== (askLow ? lo : hi) && m.answer !== (askLow ? hi : lo)),
        hints: ['Un produit est nul si et seulement si l’un de ses facteurs est nul : résous chaque facteur = 0.'], solution: `$${poly([-p, 1])} = 0 ⇔ x = ${p}$ ; $${poly([b, a])} = 0 ⇔ x = ${q}$. Solutions : ${lo} et ${hi}.`, representation: 'symbolique' });
    }
    const kk = ri(rand, 2, 6); const s = nz(rand, -6, 6); const m = ri(rand, -9, 9); const n = m - (-kk) * s; // −k x + m ≥ n ⇔ x ≤ s
    return qcm(rand, [`Résous l’inéquation $${poly([m, -kk])} ≥ ${n}$.`, `x ≤ ${neg(s)}`, [`x ≥ ${neg(s)}`, `x ≤ ${neg(-s)}`, `x ≥ ${neg(-s)}`],
      `$${poly([0, -kk])} ≥ ${n - m}$ ; on divise par ${-kk}, un nombre NÉGATIF : le sens de l’inégalité change, donc $x ≤ ${s}$.`], { hint: 'Quand on multiplie ou divise par un nombre négatif, on change le sens de l’inégalité.' });
  },
});

/* ------------------------------ Vecteurs dans un repère ------------------------------ */

add({
  id: 'l2-vecteurs', label: 'Vecteurs : coordonnées, milieu, norme, colinéarité', skill: 'l2.vecteurs.repere', chapters: ['2nde-m-vecteurs-repere', '2nde-m-vecteurs'],
  description: 'Coordonnées d’un vecteur, d’un milieu, norme, déterminant et colinéarité.',
  make(rand, hard) {
    const k = pick(rand, ['coord', 'milieu', 'norme', 'det', 'colineaires']);
    const xa = ri(rand, -6, 6); const ya = ri(rand, -6, 6);
    if (k === 'coord') {
      const xb = ri(rand, -6, 6); const yb = ri(rand, -6, 6);
      return problem([
        numeric(xb - xa, { prompt: 'Abscisse du vecteur', misconceptions: xa - xb !== xb - xa ? [mc(xa - xb, 'mc:ordre-soustraction', 'notion', 'Coordonnées de AB : extrémité moins origine, xB − xA.')] : [] }),
        numeric(yb - ya, { prompt: 'Ordonnée du vecteur' }),
      ], { prompt: `Dans un repère, A(${xa} ; ${ya}) et B(${xb} ; ${yb}). Quelles sont les coordonnées du vecteur AB ?`, expectedSeconds: 60, hints: ['Coordonnées de AB : (xB − xA ; yB − yA).'], solution: `vecteur AB (${xb} − ${par(xa)} ; ${yb} − ${par(ya)}) = (${xb - xa} ; ${yb - ya})`, representation: 'symbolique' });
    }
    if (k === 'milieu') {
      const xb = xa + 2 * ri(rand, -4, 4) + (hard ? 1 : 0); const yb = ya + 2 * ri(rand, -4, 4);
      return problem([numeric((xa + xb) / 2, { prompt: 'Abscisse du milieu' }), numeric((ya + yb) / 2, { prompt: 'Ordonnée du milieu' })],
        { prompt: `Dans un repère, A(${xa} ; ${ya}) et B(${xb} ; ${yb}). Quelles sont les coordonnées du milieu I de [AB] ?`, expectedSeconds: 60, hints: ['Le milieu a pour coordonnées les moyennes : ((xA + xB)/2 ; (yA + yB)/2).'], solution: `I((${xa} + ${par(xb)})/2 ; (${ya} + ${par(yb)})/2) = (${fr((xa + xb) / 2)} ; ${fr((ya + yb) / 2)})`, representation: 'symbolique' });
    }
    if (k === 'norme') {
      let [dx, dy] = pick(rand, [[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [12, 5], [0, 7]]);
      dx *= pick(rand, [1, -1]); dy *= pick(rand, [1, -1]);
      const r = Math.round(Math.hypot(dx, dy));
      return numeric(r, { prompt: `Quelle est la norme du vecteur u(${dx} ; ${dy}) ?`, misconceptions: [mc(Math.abs(dx) + Math.abs(dy), 'mc:norme-somme', 'notion', 'La norme se calcule avec le théorème de Pythagore : √(x² + y²), pas x + y.')].filter((m) => m.answer !== r),
        expectedSeconds: 45, hints: ['‖u‖ = √(x² + y²).'], solution: `‖u‖ = √(${par(dx)}² + ${par(dy)}²) = √${dx * dx + dy * dy} = ${r}`, representation: 'symbolique' });
    }
    const ux = nz(rand, -5, 5); const uy = nz(rand, -5, 5); const t = pick(rand, [-3, -2, 2, 3]);
    const col = k === 'colineaires' ? rand() < 0.5 : false;
    const vx = col ? t * ux : nz(rand, -6, 6); let vy = col ? t * uy : nz(rand, -6, 6);
    if (!col && ux * vy - uy * vx === 0) vy += 1;
    const det = ux * vy - uy * vx;
    if (k === 'det') {
      return numeric(det, { prompt: `Calcule le déterminant det(u, v) des vecteurs u(${ux} ; ${uy}) et v(${vx} ; ${vy}).`, misconceptions: [mc(ux * vx - uy * vy, 'mc:det-produits', 'notion', 'det(u, v) = x × y′ − y × x′ : on croise les coordonnées.'), mc(uy * vx - ux * vy, 'mc:det-ordre', 'signe', 'det(u, v) = x × y′ − y × x′, dans cet ordre.')].filter((m) => m.answer !== det),
        expectedSeconds: 45, hints: ['det(u, v) = x × y′ − y × x′.'], solution: `$${par(ux)} × ${par(vy)} − ${par(uy)} × ${par(vx)} = ${det}$`, representation: 'symbolique' });
    }
    return qcm(rand, [`Les vecteurs u(${ux} ; ${uy}) et v(${vx} ; ${vy}) sont-ils colinéaires ?`, col ? 'oui, leur déterminant est nul' : `non, leur déterminant vaut ${neg(det)}`, col ? [`non, leur déterminant vaut ${neg(ux * vy + uy * vx || 1)}`, 'non, car ils n’ont pas la même norme', 'on ne peut pas savoir sans figure'] : ['oui, leur déterminant est nul', 'oui, car ils ont des coordonnées entières', 'on ne peut pas savoir sans figure'],
      `det(u, v) = ${neg(ux)} × ${neg(vy)} − ${neg(uy)} × ${neg(vx)} = ${neg(det)} : deux vecteurs sont colinéaires si et seulement si leur déterminant est nul.`]);
  },
});

/* ------------------------------ Droites ------------------------------ */

add({
  id: 'l2-droites', label: 'Droites : pente, ordonnée à l’origine, vecteur directeur', skill: 'l2.droites', chapters: ['2nde-m-droites'],
  description: 'Coefficient directeur passant par deux points, équation réduite, appartenance d’un point, vecteur directeur.',
  make(rand) {
    const m = nz(rand, -4, 4); const p = ri(rand, -8, 8);
    const k = pick(rand, ['pente', 'ordonnee', 'point', 'directeur']);
    if (k === 'pente') {
      const xa = ri(rand, -5, 3); const xb = xa + nz(rand, 1, 4) * pick(rand, [1, 1, -1]); const ya = m * xa + p; const yb = m * xb + p;
      const inv = (xb - xa) / (yb - ya);
      return numeric(m, { prompt: `La droite (AB) passe par A(${xa} ; ${ya}) et B(${xb} ; ${yb}). Quel est son coefficient directeur ?`, misconceptions: Number.isInteger(inv) && inv !== m ? [mc(inv, 'mc:pente-inverse', 'notion', 'Le coefficient directeur est (yB − yA) / (xB − xA) : la variation des ordonnées sur celle des abscisses.')] : [],
        expectedSeconds: 60, hints: ['m = (yB − yA) / (xB − xA).'], solution: `m = (${yb} − ${par(ya)}) / (${xb} − ${par(xa)}) = ${yb - ya} / ${par(xb - xa)} = ${m}`, representation: 'symbolique' });
    }
    if (k === 'ordonnee') {
      const xa = nz(rand, -5, 5); const ya = m * xa + p;
      return numeric(p, { prompt: `Une droite a pour coefficient directeur ${m} et passe par A(${xa} ; ${ya}). Quelle est son ordonnée à l’origine p (équation y = ${neg(m)}x + p) ?`, expectedSeconds: 60,
        hints: ['Remplace x et y par les coordonnées de A dans y = mx + p, puis isole p.'], solution: `$${ya} = ${m} × ${par(xa)} + p$, donc $p = ${ya} − ${par(m * xa)} = ${p}$`, representation: 'symbolique' });
    }
    if (k === 'point') {
      const x = ri(rand, -4, 4); const on = rand() < 0.5; const y = m * x + p + (on ? 0 : pick(rand, [-2, -1, 1, 2]));
      return qcm(rand, [`Le point C(${x} ; ${y}) appartient-il à la droite d’équation $y = ${poly([p, m])}$ ?`, on ? 'oui' : 'non', on ? ['non', 'seulement si x est positif', 'on ne peut pas savoir'] : ['oui', 'seulement si x est positif', 'on ne peut pas savoir'],
        `On remplace x par ${neg(x)} : ${neg(m)} × ${neg(x)} + ${neg(p)} = ${neg(m * x + p)}, ${on ? 'c’est bien' : 'ce n’est pas'} l’ordonnée ${neg(y)} du point.`]);
    }
    return qcm(rand, [`Quel vecteur est un vecteur directeur de la droite d’équation $y = ${poly([p, m])}$ ?`, `(1 ; ${neg(m)})`, [`(${neg(m)} ; 1)`, `(1 ; ${neg(p)})`, `(${neg(p)} ; ${neg(m)})`, `(1 ; ${neg(-m)})`, `(${neg(-m)} ; 1)`, `(0 ; ${neg(m)})`],
      `Quand x augmente de 1, y augmente de m = ${neg(m)} : le vecteur (1 ; m) dirige la droite.`]);
  },
});

/* ------------------------------ Fonctions ------------------------------ */

add({
  id: 'l2-fonctions', label: 'Fonctions : images, antécédents, fonctions de référence', skill: 'l2.fonctions', chapters: ['2nde-m-fonctions', '2nde-m-fonctions-reference', '2nde-m-automatismes'],
  description: 'Calculer une image, un antécédent ; ensemble de définition ; encadrer x² et 1/x.',
  make(rand, hard) {
    const k = pick(rand, ['image', 'antecedent', 'definition', 'carre', 'inverse']);
    if (k === 'image') {
      const a = nz(rand, -3, 4); const b = ri(rand, -6, 6); const c = ri(rand, -9, 9); const x = nz(rand, -4, 4);
      const y = a * x * x + b * x + c;
      const wrong = -a * x * x + b * x + c;
      return numeric(y, { prompt: `Soit $f(x) = ${poly([c, b, a])}$. Calcule $f(${x})$.`, misconceptions: x < 0 && wrong !== y ? [mc(wrong, 'mc:carre-negatif', 'signe', `$(${x})^2 = ${x * x}$ : le carré d’un nombre négatif est positif.`)] : [],
        expectedSeconds: 60, hints: [`Remplace x par ${par(x)}, avec des parenthèses.`], solution: `$f(${x}) = ${a} × ${par(x)}^2 ${b < 0 ? '−' : '+'} ${Math.abs(b)} × ${par(x)} ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${y}$`, representation: 'symbolique' });
    }
    if (k === 'antecedent') {
      const a = nz(rand, -5, 5); const b = ri(rand, -9, 9); const x = ri(rand, -6, 6); const y = a * x + b;
      return numeric(x, { prompt: `Soit $f(x) = ${poly([b, a])}$. Quel est l’antécédent de $${y}$ par $f$ ?`, misconceptions: a * y + b !== x ? [mc(a * y + b, 'mc:image-antecedent', 'notion', 'On cherche x tel que f(x) = ' + neg(y) + ' : c’est une équation à résoudre, pas une image à calculer.')] : [],
        expectedSeconds: 60, hints: [`Résous l’équation ${poly([b, a])} = ${neg(y)}.`], solution: `$${poly([b, a])} = ${y} ⇔ ${a}x = ${y - b} ⇔ x = ${x}$`, representation: 'symbolique' });
    }
    if (k === 'definition') {
      const c = nz(rand, -7, 7);
      return rand() < 0.5
        ? qcm(rand, [`Quel est l’ensemble de définition de f(x) = 1/(x ${c < 0 ? '+' : '−'} ${Math.abs(c)}) ?`, `ℝ privé de ${neg(c)}`, [`ℝ privé de ${neg(-c)}`, 'ℝ', `[${neg(c)} ; +∞[`], `On ne peut pas diviser par 0 : x − ${par(c)} = 0 pour x = ${neg(c)}, valeur interdite.`])
        : qcm(rand, [`Quel est l’ensemble de définition de f(x) = √(x ${c < 0 ? '+' : '−'} ${Math.abs(c)}) ?`, `[${neg(c)} ; +∞[`, [`]−∞ ; ${neg(c)}]`, 'ℝ', `ℝ privé de ${neg(c)}`], `La racine carrée n’existe que pour un nombre positif ou nul : x − ${par(c)} ≥ 0 ⇔ x ≥ ${neg(c)}.`]);
    }
    if (k === 'carre') {
      const b = -ri(rand, 1, 4); const a = b - ri(rand, 1, 4); // a < b ≤ −1 : la fonction carré est décroissante sur ]−∞ ; 0]
      return numeric(b * b, { prompt: `On sait que $${a} ≤ x ≤ ${b}$. Quelle est la plus petite valeur possible de $x^2$ ?`, misconceptions: [mc(a * a, 'mc:carre-ordre', 'notion', 'Sur les nombres négatifs, la fonction carré est décroissante : elle inverse l’ordre.')],
        expectedSeconds: 60, difficulty: 3, hints: ['La fonction carré est décroissante sur ]−∞ ; 0] : le plus petit carré vient du nombre le plus proche de 0.'], solution: `${neg(a)} ≤ x ≤ ${neg(b)} ≤ 0, donc ${neg(b)}² ≤ x² ≤ ${neg(a)}² : ${b * b} ≤ x² ≤ ${a * a}.`, representation: 'symbolique' });
    }
    const [a, b] = sample(rand, [2, 3, 4, 5, 8, 10], 2).sort((x, y) => x - y);
    return qcm(rand, [`On sait que $${a} ≤ x ≤ ${b}$. Quel encadrement de 1/x est juste ?`, `1/${b} ≤ 1/x ≤ 1/${a}`, [`1/${a} ≤ 1/x ≤ 1/${b}`, `${a} ≤ 1/x ≤ ${b}`, `−${b} ≤ 1/x ≤ −${a}`], 'La fonction inverse est décroissante sur ]0 ; +∞[ : elle inverse l’ordre des nombres positifs.']);
  },
});

/* ------------------------------ Signe et variations ------------------------------ */

add({
  id: 'l2-signe', label: 'Signe et extremums', skill: 'l2.signe', chapters: ['2nde-m-signe', '2nde-m-variations'],
  description: 'Signe d’une fonction affine et d’un produit, minimum ou maximum d’une fonction écrite sous forme canonique.',
  make(rand) {
    const k = pick(rand, ['affine', 'produit', 'extremum']);
    if (k === 'affine') {
      const a = nz(rand, -5, 5); const x0 = ri(rand, -6, 6); const b = -a * x0;
      const right = `]${neg(x0)} ; +∞[`; const left = `]−∞ ; ${neg(x0)}[`;
      return qcm(rand, [`Sur quel intervalle la fonction $f(x) = ${poly([b, a])}$ est-elle strictement positive ?`, a > 0 ? right : left, [a > 0 ? left : right, `]${neg(-x0)} ; +∞[`, `]−∞ ; ${neg(-x0)}[`, `[${neg(x0)} ; +∞[`, `]−∞ ; ${neg(x0)}]`, ']−∞ ; +∞['].filter((c, i, arr) => arr.indexOf(c) === i && c !== (a > 0 ? right : left)),
        `f s’annule en x = ${neg(x0)} ; son coefficient ${neg(a)} est ${a > 0 ? 'positif : f est croissante, positive après' : 'négatif : f est décroissante, positive avant'} ${neg(x0)}.`], { hint: 'Cherche où f s’annule, puis regarde le signe du coefficient de x.' });
    }
    if (k === 'produit') {
      const p = ri(rand, -6, 3); const q = p + ri(rand, 1, 6);
      return qcm(rand, [`Pour quelles valeurs de $x$ a-t-on $(x ${p < 0 ? '+' : '−'} ${Math.abs(p)})(x ${q < 0 ? '+' : '−'} ${Math.abs(q)}) < 0$ ?`, `x ∈ ]${neg(p)} ; ${neg(q)}[`, [`x ∈ ]−∞ ; ${neg(p)}[ ∪ ]${neg(q)} ; +∞[`, `x ∈ ]${neg(-q)} ; ${neg(-p)}[`, `x ∈ ]${neg(q)} ; +∞[`, `x ∈ ]−∞ ; ${neg(p)}[`],
        `Tableau de signes : le produit est négatif entre les deux valeurs qui l’annulent, ${neg(p)} et ${neg(q)} (les deux facteurs y sont de signes contraires).`], { hint: 'Fais un tableau de signes avec une ligne par facteur.' });
    }
    const a = pick(rand, [-3, -2, -1, 1, 2, 3]); const hh = ri(rand, -5, 5); const kk = ri(rand, -9, 9);
    const word = a > 0 ? 'minimum' : 'maximum';
    return numeric(kk, { prompt: `Soit $f(x) = ${a === 1 ? '' : a === -1 ? '−' : a}(x ${hh < 0 ? '+' : '−'} ${Math.abs(hh)})^2 ${kk < 0 ? '−' : '+'} ${Math.abs(kk)}$. Quel est le ${word} de $f$ sur ℝ ?`,
      misconceptions: hh !== kk ? [mc(hh, 'mc:extremum-abscisse', 'notion', `${neg(hh)} est la valeur de x où le ${word} est atteint ; le ${word} est la valeur de f(x).`)] : [],
      expectedSeconds: 60, difficulty: 3, hints: [`Un carré est toujours positif ou nul : ${a > 0 ? 'f(x) est donc toujours au moins égal à' : 'f(x) est donc toujours au plus égal à'}…`], solution: `Le carré est nul pour x = ${neg(hh)} : f atteint son ${word} ${neg(kk)} en x = ${neg(hh)}.`, representation: 'symbolique' });
  },
});

/* ------------------------------ Information chiffrée ------------------------------ */

const EVO2 = [[20, -20, -4], [10, 10, 21], [50, -50, -25], [25, -20, 0], [20, 50, 80], [-10, -10, -19], [100, -50, 0], [30, -10, 17]];
const RECIP = [[25, 20], [100, 50], [150, 60], [300, 75], [400, 80], [900, 90]];
add({
  id: 'l2-evolutions', label: 'Pourcentages et évolutions', skill: 'l2.info-chiffree', chapters: ['2nde-m-info-chiffree', '2nde-m-automatismes'],
  description: 'Coefficient multiplicateur, évolutions successives et réciproques, taux d’évolution, proportion de proportion.',
  make(rand, hard) {
    const k = pick(rand, hard ? ['successives', 'reciproque', 'taux', 'proportion'] : ['cm', 'taux', 'successives', 'proportion']);
    if (k === 'cm') {
      const t = pick(rand, [5, 10, 15, 20, 25, 30, 40, 50, 75]); const up = rand() < 0.5;
      return numeric(up ? 1 + t / 100 : 1 - t / 100, { prompt: `${up ? 'Augmenter' : 'Diminuer'} une quantité de ${t} % revient à la multiplier par quel nombre ?`, misconceptions: [mc(t / 100, 'mc:cm-taux', 'notion', `Il faut garder la quantité de départ : 1 ${up ? '+' : '−'} ${fr(t / 100)}.`)],
        expectedSeconds: 30, hints: [`${up ? 'Augmenter' : 'Diminuer'} de t %, c’est multiplier par 1 ${up ? '+' : '−'} t/100.`], solution: `1 ${up ? '+' : '−'} ${t}/100 = ${fr(up ? 1 + t / 100 : 1 - t / 100)}`, representation: 'symbolique' });
    }
    if (k === 'taux') {
      const v0 = pick(rand, [40, 50, 80, 200, 250, 400]); const t = pick(rand, [-50, -25, -20, -10, 10, 20, 25, 50, 75]); const v1 = v0 * (1 + t / 100);
      const wrong = ((v1 - v0) / v1) * 100;
      return numeric(t, { prompt: `Un prix passe de ${v0} € à ${fr(v1)} €. Quel est le taux d’évolution, en % ? (Négatif pour une baisse.)`, unit: '%', unitOptional: true,
        misconceptions: Number.isInteger(wrong) && wrong !== t ? [mc(wrong, 'mc:taux-base', 'notion', 'Le taux se calcule par rapport à la valeur de DÉPART : (V1 − V0) / V0.')] : [],
        expectedSeconds: 50, hints: ['Taux = (valeur d’arrivée − valeur de départ) / valeur de départ.'], solution: `(${fr(v1)} − ${v0}) / ${v0} = ${fr(t / 100)}, soit ${t > 0 ? '+' : ''}${t} %.`, representation: 'concrete' });
    }
    if (k === 'successives') {
      const [a, b, g] = pick(rand, EVO2);
      const sa = (x) => `${x > 0 ? 'hausse' : 'baisse'} de ${Math.abs(x)} %`;
      return numeric(g, { prompt: `Un prix subit une ${sa(a)}, puis une ${sa(b)}. Quel est le taux d’évolution global, en % ?`, unit: '%', unitOptional: true,
        misconceptions: a + b !== g ? [mc(a + b, 'mc:taux-additionnes', 'notion', 'Les taux successifs ne s’additionnent pas : on MULTIPLIE les coefficients multiplicateurs.')] : [],
        expectedSeconds: 60, difficulty: 3, hints: ['Multiplie les coefficients : (1 + t1/100) × (1 + t2/100).'], solution: `${fr(1 + a / 100)} × ${fr(1 + b / 100)} = ${fr((1 + a / 100) * (1 + b / 100))} : évolution globale de ${g > 0 ? '+' : ''}${g} %.`, representation: 'symbolique' });
    }
    if (k === 'reciproque') {
      const [t, r] = pick(rand, RECIP);
      return numeric(r, { prompt: `Après une hausse de ${t} %, de quel pourcentage faut-il baisser pour revenir à la valeur de départ ?`, unit: '%', unitOptional: true, misconceptions: [mc(t, 'mc:reciproque-meme-taux', 'notion', 'La baisse se calcule sur la valeur augmentée, plus grande : ce n’est pas le même pourcentage.')],
        expectedSeconds: 75, difficulty: 3, hints: [`Le coefficient réciproque est 1 / ${fr(1 + t / 100)}.`], solution: `1 / ${fr(1 + t / 100)} = ${fr(1 - r / 100)} : une baisse de ${r} %.`, representation: 'symbolique' });
    }
    const [p1, p2] = pick(rand, [[30, 40], [60, 50], [25, 40], [80, 25], [40, 75], [50, 30], [20, 60]]);
    return numeric((p1 * p2) / 100, { prompt: `Dans un lycée, ${p1} % des élèves sont demi-pensionnaires et, parmi eux, ${p2} % sont en seconde. Quel pourcentage des élèves du lycée sont des demi-pensionnaires de seconde ?`, unit: '%', unitOptional: true,
      misconceptions: [mc(p1 + p2, 'mc:proportions-additionnees', 'notion', 'Une proportion d’une proportion : on multiplie les deux proportions.')], expectedSeconds: 60,
      hints: ['Prendre p2 % de p1 %, c’est calculer p1/100 × p2/100.'], solution: `${fr(p1 / 100)} × ${fr(p2 / 100)} = ${fr((p1 * p2) / 10000)}, soit ${fr((p1 * p2) / 100)} %.`, representation: 'concrete' });
  },
});

/* ------------------------------ Statistiques ------------------------------ */

add({
  id: 'l2-statistiques', label: 'Statistiques : moyenne, médiane, écart type', skill: 'l2.statistiques', chapters: ['2nde-m-statistiques'],
  description: 'Moyenne pondérée lue dans un tableau, médiane, écart type d’une série simple, effet d’une transformation.',
  make(rand) {
    const k = pick(rand, ['moyenne', 'mediane', 'ecart', 'transfo']);
    if (k === 'moyenne') {
      for (;;) {
        const vals = sample(rand, [8, 9, 10, 11, 12, 13, 14, 15, 16], 4).sort((x, y) => x - y);
        const eff = vals.map(() => ri(rand, 1, 6));
        const n = eff.reduce((s, e) => s + e, 0); const tot = vals.reduce((s, v, i) => s + v * eff[i], 0);
        const mean = tot / n;
        if (Math.round(mean * 10) !== mean * 10) continue;
        const plainMean = vals.reduce((s, v) => s + v, 0) / 4;
        return numeric(mean, { prompt: 'Voici les notes d’un contrôle. Quelle est la note moyenne de la classe ?', figure: { alt: `Tableau : notes ${vals.join(', ')} ; effectifs ${eff.join(', ')}.`, items: [{ type: 'table', head: ['Note', ...vals.map(String)], rows: [['Effectif', ...eff.map(String)]] }] },
          misconceptions: plainMean !== mean ? [mc(plainMean, 'mc:moyenne-non-ponderee', 'notion', 'Chaque note compte autant de fois que son effectif : moyenne pondérée.')] : [],
          expectedSeconds: 90, hints: ['Moyenne = (somme des note × effectif) / effectif total.'], solution: `(${vals.map((v, i) => `${v} × ${eff[i]}`).join(' + ')}) / ${n} = ${tot} / ${n} = ${fr(mean)}`, representation: 'concrete' });
      }
    }
    if (k === 'mediane') {
      const n = pick(rand, [7, 8, 9, 10]); const vals = Array.from({ length: n }, () => ri(rand, 2, 20)).sort((x, y) => x - y);
      const med = n % 2 ? vals[(n - 1) / 2] : (vals[n / 2 - 1] + vals[n / 2]) / 2;
      const mean = vals.reduce((s, v) => s + v, 0) / n;
      return numeric(med, { prompt: `Voici une série rangée dans l’ordre croissant : ${vals.join(' ; ')}. Quelle est sa médiane ?`, misconceptions: mean !== med && Math.round(mean * 10) === mean * 10 ? [mc(mean, 'mc:mediane-moyenne', 'notion', 'La médiane partage la série rangée en deux moitiés de même effectif : ce n’est pas la moyenne.')] : [],
        expectedSeconds: 50, hints: [`Il y a ${n} valeurs : la médiane est ${n % 2 ? `la ${(n + 1) / 2}e` : `la moyenne de la ${n / 2}e et de la ${n / 2 + 1}e`}.`], solution: `${n} valeurs : médiane = ${fr(med)}.`, representation: 'concrete' });
    }
    if (k === 'ecart') {
      const m = ri(rand, 8, 15); const d = ri(rand, 1, 5); const r = pick(rand, [2, 3]);
      const vals = sample(rand, [...Array(r).fill(m - d), ...Array(r).fill(m + d)], 2 * r);
      return numeric(d, { prompt: `Série : ${vals.join(' ; ')}. Sa moyenne est ${m}. Quel est son écart type ?`, misconceptions: [mc(d * d, 'mc:variance', 'notion', 'Le carré moyen des écarts est la variance ; l’écart type est sa racine carrée.')].filter((x) => x.answer !== d),
        expectedSeconds: 60, hints: [`Chaque valeur est à ${d} de la moyenne.`], solution: `Tous les écarts à la moyenne valent ${d} (au carré : ${d * d}) : variance ${d * d}, écart type √${d * d} = ${d}.`, representation: 'symbolique' });
    }
    const c = ri(rand, 2, 5);
    return qcm(rand, [`On ajoute ${c} points à toutes les notes d’une série. Que deviennent la moyenne et l’écart type ?`, `la moyenne augmente de ${c}, l’écart type ne change pas`, [`les deux augmentent de ${c}`, 'rien ne change', `la moyenne ne change pas, l’écart type augmente de ${c}`], 'Toutes les valeurs se décalent ensemble : la moyenne aussi, mais les écarts à la moyenne restent les mêmes.']);
  },
});

/* ------------------------------ Probabilités, tableaux croisés ------------------------------ */

const DICE7 = [[2, 1], [3, 2], [4, 3], [5, 4], [6, 5], [7, 6], [8, 5], [9, 4], [10, 3], [11, 2], [12, 1]];
add({
  id: 'l2-probabilites', label: 'Probabilités et fréquences conditionnelles', skill: 'l2.probabilites', chapters: ['2nde-m-probabilites', '2nde-m-tableaux-croises'],
  description: 'Fréquence conditionnelle lue dans un tableau croisé, probabilité sur un arbre, somme de deux dés, événement contraire.',
  make(rand) {
    const k = pick(rand, ['tableau', 'arbre', 'des', 'contraire']);
    if (k === 'tableau') {
      const nf = pick(rand, [20, 25, 40, 50, 80]); const a = ri(rand, 1, nf - 1); const ng = pick(rand, [20, 25, 40, 50]); const c = ri(rand, 1, ng - 1);
      return numeric(a / nf, { prompt: 'Parmi les filles de ce lycée, quelle est la proportion de demi-pensionnaires ? (Réponds par une fraction ou un nombre décimal.)', tolerance: 1e-9,
        figure: { alt: `Tableau croisé : filles ${a} demi-pensionnaires et ${nf - a} externes ; garçons ${c} et ${ng - c}.`, items: [{ type: 'table', head: [' ', 'Demi-pension', 'Externe', 'Total'], rows: [['Filles', String(a), String(nf - a), String(nf)], ['Garçons', String(c), String(ng - c), String(ng)], ['Total', String(a + c), String(nf - a + ng - c), String(nf + ng)]] }] },
        misconceptions: [mc(a / (nf + ng), 'mc:mauvais-total', 'notion', `« Parmi les filles » : on divise par le nombre de filles (${nf}), pas par l’effectif total.`), mc(a / (a + c), 'mc:mauvaise-colonne', 'notion', 'On cherche la part des demi-pensionnaires parmi les filles, pas la part des filles parmi les demi-pensionnaires.')].filter((m) => Math.abs(m.answer - a / nf) > 1e-9),
        expectedSeconds: 60, hints: ['« Parmi les filles » : la ligne des filles est la nouvelle population de référence.'], solution: `${a} / ${nf} = ${fr(a / nf)}`, representation: 'concrete' });
    }
    if (k === 'arbre') {
      const pa = pick(rand, [0.2, 0.3, 0.4, 0.5, 0.6, 0.7]); const pb = pick(rand, [0.1, 0.2, 0.3, 0.5, 0.8, 0.9]);
      const r = Math.round(pa * pb * 1000) / 1000;
      return numeric(r, { prompt: `Sur un arbre de probabilités, $P(A) = ${fr(pa)}$ et $P_A(B) = ${fr(pb)}$. Calcule $P(A ∩ B)$.`, tolerance: 1e-9,
        misconceptions: [mc(Math.round((pa + pb) * 100) / 100, 'mc:arbre-somme', 'notion', 'Le long d’une branche, on MULTIPLIE les probabilités.')].filter((m) => m.answer !== r && m.answer <= 1),
        expectedSeconds: 45, hints: ['P(A ∩ B) = P(A) × P_A(B) : on multiplie le long du chemin.'], solution: `$P(A ∩ B) = ${fr(pa)} × ${fr(pb)} = ${fr(r)}$`, representation: 'symbolique' });
    }
    if (k === 'des') {
      const [s, n] = pick(rand, DICE7);
      return numeric(n / 36, { prompt: `On lance deux dés équilibrés à six faces et on additionne les résultats. Quelle est la probabilité d’obtenir ${s} ? (Réponds par une fraction.)`, tolerance: 1e-9,
        misconceptions: [mc(1 / 11, 'mc:issues-non-equiprobables', 'notion', 'Les 11 sommes possibles ne sont pas équiprobables : on compte les 36 couples (dé 1 ; dé 2).')].filter((m) => Math.abs(m.answer - n / 36) > 1e-9),
        expectedSeconds: 75, difficulty: 3, hints: ['Fais un tableau à double entrée : 6 × 6 = 36 issues équiprobables.'], solution: `${n} couple${n > 1 ? 's' : ''} sur 36 donne${n > 1 ? 'nt' : ''} ${s} : probabilité ${n}/36.`, representation: 'visuelle' });
    }
    const p = pick(rand, [0.15, 0.2, 0.35, 0.4, 0.62, 0.75, 0.08]);
    return numeric(Math.round((1 - p) * 100) / 100, { prompt: `La probabilité qu’un élève tiré au sort pratique un sport en club est ${fr(p)}. Quelle est la probabilité qu’il n’en pratique pas ?`, tolerance: 1e-9,
      expectedSeconds: 30, hints: ['P(Ā) = 1 − P(A).'], solution: `1 − ${fr(p)} = ${fr(Math.round((1 - p) * 100) / 100)}`, representation: 'symbolique' });
  },
});

/* ------------------------------ Python ------------------------------ */

const IND = '    ';
add({
  id: 'l2-python', label: 'Lire un programme Python', skill: 'l2.python', chapters: ['2nde-m-python'],
  description: 'Prévoir ce qu’affiche un programme : variables, boucles for et while, fonctions, conditions.',
  make(rand) {
    const k = pick(rand, ['for', 'while', 'def', 'if']);
    if (k === 'for') {
      const a = ri(rand, 0, 3); const b = a + ri(rand, 3, 6);
      const s = (b - 1 + a) * (b - a) / 2; const incl = s + b;
      return numeric(s, { prompt: `Que vaut s à la fin de ce programme ?\ns = 0\nfor i in range(${a}, ${b}):\n${IND}s = s + i`, misconceptions: [mc(incl, 'mc:range-inclus', 'notion', `range(${a}, ${b}) s’arrête AVANT ${b} : i prend les valeurs ${a} à ${b - 1}.`)],
        expectedSeconds: 75, hints: [`Écris les valeurs successives de i : range(${a}, ${b}) donne ${a}, ${a + 1}, …, ${b - 1}.`], solution: `i prend les valeurs ${Array.from({ length: b - a }, (_, j) => a + j).join(', ')} : s = ${s}.`, representation: 'symbolique' });
    }
    if (k === 'while') {
      const start = ri(rand, 1, 5); const lim = ri(rand, 20, 90); let n = start; let steps = 0;
      while (n < lim) { n *= 2; steps++; }
      return numeric(n, { prompt: `Que vaut n à la fin de ce programme ?\nn = ${start}\nwhile n < ${lim}:\n${IND}n = 2 * n`, misconceptions: n / 2 !== start && n / 2 < lim ? [mc(n / 2, 'mc:while-arret', 'notion', `La boucle continue tant que n < ${lim} : elle s’arrête dès que n atteint ou dépasse ${lim}.`)] : [],
        expectedSeconds: 75, hints: ['Écris la valeur de n après chaque tour, et vérifie la condition à chaque fois.'], solution: `n vaut successivement ${Array.from({ length: steps + 1 }, (_, j) => start * 2 ** j).join(', ')} : la boucle s’arrête à ${n} (${steps} tour${steps > 1 ? 's' : ''}).`, representation: 'symbolique' });
    }
    if (k === 'def') {
      const a = nz(rand, -5, 6); const b = ri(rand, -9, 9); const x = ri(rand, -4, 6);
      return numeric(a * x + b, { prompt: `Qu’affiche ce programme ?\ndef f(x):\n${IND}return ${a} * x ${b < 0 ? '-' : '+'} ${Math.abs(b)}\nprint(f(${x}))`, expectedSeconds: 50,
        hints: [`f(${x}) : on remplace x par ${x} dans l’expression renvoyée.`], solution: `f(${x}) = ${a} × ${par(x)} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${a * x + b}`, representation: 'symbolique' });
    }
    const n = ri(rand, 8, 20); const d = pick(rand, [2, 3, 4, 5]); const c = Math.ceil(n / d);
    return numeric(c, { prompt: `Que vaut c à la fin de ce programme ?\nc = 0\nfor i in range(${n}):\n${IND}if i % ${d} == 0:\n${IND}${IND}c = c + 1`,
      misconceptions: Math.floor(n / d) !== c ? [mc(Math.floor(n / d), 'mc:range-zero', 'notion', `range(${n}) commence à 0, et 0 est un multiple de ${d}.`)] : [],
      expectedSeconds: 90, difficulty: 3, hints: [`i % ${d} == 0 veut dire : i est un multiple de ${d}. range(${n}) donne 0, 1, …, ${n - 1}.`], solution: `Multiples de ${d} entre 0 et ${n - 1} : ${Array.from({ length: c }, (_, j) => j * d).join(', ')} — c = ${c}.`, representation: 'symbolique' });
  },
});

/* ------------------------------ Logique ------------------------------ */

const LOGIC = [
  ['Quelle est la négation de « Tous les élèves de la classe ont un stylo rouge » ?', 'au moins un élève de la classe n’a pas de stylo rouge', ['aucun élève de la classe n’a de stylo rouge', 'tous les élèves ont un stylo bleu', 'un seul élève a un stylo rouge'], 'Le contraire de « tous » est « au moins un… ne… pas ».'],
  ['Quelle est la réciproque de « Si x = 3, alors x² = 9 » ?', 'si x² = 9, alors x = 3', ['si x ≠ 3, alors x² ≠ 9', 'si x² ≠ 9, alors x ≠ 3', 'x = 3 et x² = 9'], 'La réciproque échange l’hypothèse et la conclusion. Ici elle est fausse : x = −3 donne aussi x² = 9.'],
  ['Pour montrer que « tout nombre premier est impair » est faux, il suffit…', 'de trouver un contre-exemple, comme 2', ['de vérifier avec 3, 5 et 7', 'de faire un dessin', 'de demander au professeur'], '2 est premier et pair : un seul contre-exemple suffit à prouver qu’une affirmation générale est fausse.'],
  ['Quel symbole convient : $3 … ℕ$ ?', '∈', ['⊂', '=', '∩'], '3 est un élément de l’ensemble ℕ : on écrit 3 ∈ ℕ (« appartient à »).'],
  ['Quel symbole convient : $ℕ … ℤ$ ?', '⊂', ['∈', '=', '∪'], 'Tout entier naturel est un entier relatif : l’ensemble ℕ est inclus dans ℤ.'],
  ['Le nombre 1/3 est-il un nombre décimal ?', 'non : son écriture décimale ne s’arrête jamais', ['oui, il vaut 0,33', 'oui, car c’est une fraction', 'non, car il est négatif'], '1/3 = 0,333… : il est rationnel, mais pas décimal.'],
  ['√2 appartient à…', 'ℝ, mais pas à ℚ', ['ℚ', 'ℕ', 'ℤ'], '√2 est irrationnel : on ne peut pas l’écrire comme un quotient de deux entiers.'],
  ['« x > 2 » implique-t-il « x > 1 » ?', 'oui : tout nombre plus grand que 2 est plus grand que 1', ['non', 'seulement si x est entier', 'seulement si x est négatif'], 'Si x > 2, alors x > 2 > 1 : l’implication est vraie (la réciproque, elle, est fausse : 1,5 > 1 mais 1,5 < 2).'],
  ['Quelle est la contraposée de « Si un quadrilatère est un carré, alors c’est un rectangle » ?', 'si un quadrilatère n’est pas un rectangle, ce n’est pas un carré', ['si un quadrilatère est un rectangle, c’est un carré', 'si un quadrilatère n’est pas un carré, ce n’est pas un rectangle', 'tout rectangle est un carré'], 'La contraposée de « si P alors Q » est « si non Q alors non P » : elle est vraie exactement quand la proposition l’est.'],
  ['Quelle est la négation de « Il existe un nombre réel dont le carré est négatif » ?', 'pour tout réel x, x² ≥ 0', ['il existe un réel dont le carré est positif', 'pour tout réel x, x² < 0', 'il existe un réel x tel que x² ≥ 0'], 'La négation de « il existe … tel que P » est « pour tout …, non P ».'],
  ['Quelle est la négation de « x ≥ 2 et x ≤ 5 » ?', 'x < 2 ou x > 5', ['x < 2 et x > 5', 'x ≤ 2 ou x ≥ 5', 'x > 5'], 'La négation de « P et Q » est « non P ou non Q ».'],
  ['« x² = 4 » est-elle une condition suffisante pour avoir « x = 2 » ?', 'non : x peut aussi valoir −2', ['oui, toujours', 'oui, si x est un réel', 'oui, si x² est pair'], 'x = −2 est un contre-exemple. En revanche, x = 2 suffit pour avoir x² = 4.'],
  ['Le nombre 0,25 est-il un nombre décimal ?', 'oui : 0,25 = 25/100', ['non, car c’est une fraction', 'non, car il est plus petit que 1', 'seulement s’il est positif'], 'Un décimal s’écrit a/10ⁿ avec a entier : 0,25 = 25/10².'],
  ['π est-il un nombre rationnel ?', 'non : π est irrationnel', ['oui, car π = 22/7', 'oui, car π = 3,14', 'oui, car c’est un nombre réel'], '22/7 et 3,14 n’en sont que des valeurs approchées.'],
  ['Dire « |x| < 3 », c’est dire que…', 'x appartient à l’intervalle ]−3 ; 3[', ['x appartient à ]0 ; 3[', 'x < 3, sans autre condition', 'x > −3, sans autre condition'], '|x| est la distance entre x et 0 : elle est inférieure à 3.'],
  ['Lequel de ces ensembles contient tous les autres ?', 'ℝ', ['ℕ', 'ℤ', 'ℚ'], 'ℕ ⊂ ℤ ⊂ 𝔻 ⊂ ℚ ⊂ ℝ.'],
  ['Quelle est la réciproque de « Un nombre divisible par 4 est pair » ?', 'un nombre pair est divisible par 4 (elle est fausse : pensez à 6)', ['un nombre impair n’est pas divisible par 4', 'un nombre non divisible par 4 est impair', 'un nombre divisible par 4 est divisible par 2'], 'La réciproque échange l’hypothèse et la conclusion ; ici, 6 est un contre-exemple.'],
];
add({
  id: 'l2-logique', label: 'Logique et ensembles de nombres', skill: 'l2.logique', chapters: ['2nde-m-logique', '2nde-m-reels'],
  description: 'Négation, réciproque, contre-exemple, appartenance et inclusion, ensembles de nombres.',
  facts: true,
  make(rand) { return qcm(rand, pick(rand, LOGIC)); },
});

export const LYCEE_MATHS = GEN;
export const LYCEE_MATHS_SKILLS = [
  ['l2.reels.intervalles', 'Intervalles et valeur absolue'],
  ['l2.arithmetique', 'Multiples, diviseurs, nombres premiers, parité'],
  ['l2.calcul.puissances', 'Puissances, notation scientifique, racines carrées'],
  ['l2.calcul.identites', 'Développer avec les identités remarquables'],
  ['l2.equations', 'Équations et inéquations du premier degré, équation produit nul'],
  ['l2.vecteurs.repere', 'Vecteurs dans un repère : coordonnées, milieu, norme, déterminant'],
  ['l2.droites', 'Droites : coefficient directeur, équation réduite, vecteur directeur'],
  ['l2.fonctions', 'Fonctions : image, antécédent, ensemble de définition, fonctions de référence'],
  ['l2.signe', 'Signe d’une fonction, tableaux de signes, extremums'],
  ['l2.info-chiffree', 'Proportions, pourcentages, évolutions successives et réciproques'],
  ['l2.statistiques', 'Statistiques : moyenne pondérée, médiane, écart type'],
  ['l2.probabilites', 'Probabilités, arbres, fréquences conditionnelles'],
  ['l2.python', 'Lire un programme Python : boucles, conditions, fonctions'],
  ['l2.logique', 'Logique et ensembles de nombres'],
].map(([id, label]) => ({ subject: 'maths', id, label, level: '2nde', track: 'classe', status: 'programme', domain: 'lycee', prereqs: [], editorialLevel: true }));
