/**
 * Générateurs de PROBLÈMES de mathématiques (2/2) : fractions, diviseurs, programmes de calcul, probabilités, volumes, statistiques.
 * Une situation concrète, plusieurs questions qui s'enchaînent et, au niveau expert, une justification
 * à rédiger. Chaque générateur déclare ses `tracks` et `make(rand, options, parcours)` renvoie un `problem(...)`.
 * Voir docs/GENERATEURS.md.
 */
import { ri, pick, sample, clean, fr, sgn, poly, gcd, lcm, frac, fracStr, mc, numeric, expression, problem } from './gen-util.js';
import { sum, nom, noms, round, eur, plur, quot, hhmm, divisors, isPrime, decomp, lin, yesNo, choose, proba, probaForm, fracTxt, cap, byTier, asHour, ALL_TRACKS } from './problemes-outils.js';


/* ------------------------------------------------------------------------------------------
 * 7. Le partage d'un héritage, d'une cagnotte ou d'un jardin en fractions
 * ---------------------------------------------------------------------------------------- */

const PARTAGES = [
  { label: (T) => `un jardin partagé de ${fr(T)} m²`, de: 'du jardin', unit: 'm²', mult: 1 },
  { label: (T) => `une cagnotte de ${eur(T)}`, de: 'de la cagnotte', unit: '€', mult: 5 },
  { label: (T) => `un héritage de ${eur(T)}`, de: 'de l’héritage', unit: '€', mult: 100 },
];
const unitOf = (ctx) => (ctx.unit === 'm²' ? { unit: 'm²', unitOptional: true } : {});

function partageClasse(rand) {
  const [A, B, C] = noms(rand, 3); const ctx = pick(rand, PARTAGES);
  let dA; let m; let dB; let nA; let nB; let s;
  for (;;) {
    dA = pick(rand, [2, 3, 4, 5]); m = pick(rand, [2, 3]); dB = dA * m; nA = ri(rand, 1, dA - 1); nB = ri(rand, 1, dB - 1);
    s = nA * m + nB;
    if (gcd(nA, dA) === 1 && gcd(nB, dB) === 1 && s < dB) break;
  }
  const T = dB * ri(rand, 3, 20) * ctx.mult;
  const fAB = frac(s, dB); const fC = frac(dB - s, dB); const partC = clean((T * (dB - s)) / dB);
  return problem([
    expression(fracStr(fAB), { prompt: `Quelle fraction ${ctx.de} reçoivent ${A} et ${B} ensemble ? (écris une fraction)`, misconceptions: [
      mc(`${nA + nB}/${dA + dB}`, 'mc:denominateurs-additionnes', 'notion', `On n’additionne pas les dénominateurs : on écrit les deux fractions avec le même dénominateur (${dB}), puis on additionne les numérateurs.`),
    ] }),
    expression(fracStr(fC), { prompt: `Quelle fraction ${ctx.de} revient à ${C} ? (écris une fraction)`, misconceptions: [
      mc(fracStr(frac(dA + dB - nA - nB, dA + dB)), 'mc:denominateurs-additionnes', 'notion', 'Pour additionner des fractions, on les met d’abord au même dénominateur, sans additionner les dénominateurs.'),
    ] }),
    numeric(partC, { prompt: `Quelle part reçoit ${C} ? (en ${ctx.unit})`, ...unitOf(ctx), misconceptions: [
      mc(clean((T * s) / dB), 'mc:mauvaise-part', 'lecture', `Ce nombre est la part de ${A} et ${B} réunis ; ${C} reçoit le reste.`),
      mc(clean((T * dB) / (dB - s)), 'mc:division-au-lieu-produit', 'methode', `Prendre une fraction d’une quantité, c’est multiplier : ${fracStr(fC)} × ${fr(T)}.`),
    ] }),
  ], {
    prompt: `${A}, ${B} et ${C} se partagent ${ctx.label(T)}. ${A} reçoit ${nA}/${dA} ${ctx.de}, ${B} en reçoit ${nB}/${dB}, et ${C} reçoit le reste.`,
    hints: [`Écris ${nA}/${dA} avec le dénominateur ${dB} : ${nA}/${dA} = ${nA * m}/${dB}.`, `Le tout vaut ${dB}/${dB} : la fraction de ${C} est ${dB}/${dB} moins la part de ${A} et ${B}.`, `Pour la part de ${C}, multiplie ${fr(T)} par sa fraction.`],
    solution: `${nA}/${dA} + ${nB}/${dB} = ${nA * m}/${dB} + ${nB}/${dB} = ${s}/${dB}${fAB[1] !== dB ? ` = ${fracStr(fAB)}` : ''}. Pour ${C} : 1 − ${s}/${dB} = ${dB - s}/${dB}${fC[1] !== dB ? ` = ${fracStr(fC)}` : ''}. Part de ${C} : ${fr(T)} × ${dB - s} ÷ ${dB} = ${fr(partC)} ${ctx.unit}.`,
    expectedSeconds: 300,
  });
}

function partagePlus(rand) {
  const [A, B, C] = noms(rand, 3); const ctx = pick(rand, PARTAGES);
  let dA; let dB; let nA; let nB; let D; let pA; let pB; let pC;
  for (;;) {
    dA = pick(rand, [2, 3, 4, 5]); dB = pick(rand, [3, 4, 5, 6, 7]);
    if (dA === dB || gcd(dA, dB) !== 1) continue;
    nA = ri(rand, 1, dA - 1); nB = ri(rand, 1, dB - 1);
    if (gcd(nA, dA) !== 1 || gcd(nB, dB) !== 1) continue;
    D = dA * dB; pA = nA * dB; pB = nB * dA; pC = D - pA - pB;
    if (pC <= 0) continue;
    const sorted = [pA, pB, pC].sort((x, y) => y - x);
    if (sorted[0] > sorted[1]) break;
  }
  const T = D * ri(rand, 2, 12) * ctx.mult; const fC = frac(pC, D); const partC = clean((T * pC) / D);
  const people = [A, B, C]; const winner = people[[pA, pB, pC].indexOf(Math.max(pA, pB, pC))];
  return problem([
    expression(fracStr(fC), { form: 'irreductible', prompt: `Quelle fraction ${ctx.de} revient à ${C} ? (fraction irréductible)`, misconceptions: [
      mc(fracStr(frac(dA + dB - nA - nB, dA + dB)), 'mc:denominateurs-additionnes', 'notion', `Pour additionner ${nA}/${dA} et ${nB}/${dB}, on les écrit avec le dénominateur commun ${D} ; on n’additionne pas les dénominateurs.`),
    ] }),
    numeric(partC, { prompt: `Quelle part reçoit ${C} ? (en ${ctx.unit})`, ...unitOf(ctx), misconceptions: [
      mc(clean((T * (pA + pB)) / D), 'mc:mauvaise-part', 'lecture', `Ce nombre est la part de ${A} et ${B} réunis ; ${C} reçoit le reste.`),
    ] }),
    choose('Qui reçoit la plus grande part ? (écris le prénom)', [winner], people.filter((x) => x !== winner).map((x) => ({ accept: [x], id: 'mc:comparaison-fractions', error: 'notion', feedback: `Pour comparer, écris les trois fractions avec le dénominateur ${D} : ${pA}/${D}, ${pB}/${D} et ${pC}/${D}.` }))),
  ], {
    prompt: `${A}, ${B} et ${C} se partagent ${ctx.label(T)}. ${A} reçoit ${nA}/${dA} ${ctx.de}, ${B} en reçoit ${nB}/${dB}, et ${C} reçoit le reste.`,
    hints: [`Le dénominateur commun de ${nA}/${dA} et ${nB}/${dB} est ${D}.`, `${nA}/${dA} = ${pA}/${D} et ${nB}/${dB} = ${pB}/${D} ; le tout vaut ${D}/${D}.`, 'Pour comparer les trois parts, compare les numérateurs des fractions de même dénominateur.'],
    solution: `${nA}/${dA} + ${nB}/${dB} = ${pA}/${D} + ${pB}/${D} = ${pA + pB}/${D}. Pour ${C} : ${D}/${D} − ${pA + pB}/${D} = ${pC}/${D}${fC[1] !== D ? ` = ${fracStr(fC)}` : ''}, soit ${fr(T)} × ${pC} ÷ ${D} = ${fr(partC)} ${ctx.unit}. Parts : ${pA}/${D}, ${pB}/${D} et ${pC}/${D} : ${winner} reçoit la plus grande part.`,
    expectedSeconds: 330,
  });
}

function partageExpert(rand) {
  const [A, B, C] = noms(rand, 3);
  let dA; let nA; let dB; let nB;
  do { dA = pick(rand, [3, 4, 5, 6, 8]); nA = ri(rand, 1, dA - 1); dB = pick(rand, [2, 3, 4, 5]); nB = ri(rand, 1, dB - 1); } while (gcd(nA, dA) !== 1 || gcd(nB, dB) !== 1);
  const D = dA * dB; const fB = frac(nB * (dA - nA), D); const fC = frac((dA - nA) * (dB - nB), D);
  const T = D * 10 * ri(rand, 3, 30); const M = clean((T * fC[0]) / fC[1]);
  const naive = D - nA * dB - nB * dA; // 1 − a − b (fraction de B prise sur le total), sur D
  return problem([
    expression(fracStr(fB), { form: 'irreductible', prompt: `Quelle fraction de l’héritage reçoit ${B} ? (fraction irréductible)`, misconceptions: [
      mc(`${nB}/${dB}`, 'mc:fraction-du-reste', 'raisonnement', `${B} reçoit ${nB}/${dB} de ce qui reste après la part de ${A}, pas ${nB}/${dB} de l’héritage : calcule ${nB}/${dB} × ${dA - nA}/${dA}.`),
    ] }),
    expression(fracStr(fC), { form: 'irreductible', prompt: `Quelle fraction de l’héritage reçoit ${C} ? (fraction irréductible)`, misconceptions: naive > 0 ? [
      mc(fracStr(frac(naive, D)), 'mc:fraction-du-reste', 'raisonnement', `${B} reçoit ${nB}/${dB} du reste, pas ${nB}/${dB} de l’héritage entier.`),
    ] : [] }),
    numeric(T, { prompt: `${C} a reçu ${eur(M)}. Quel était le montant total de l’héritage ? (en €)`, misconceptions: [
      mc(clean((M * fC[0]) / fC[1]), 'mc:produit-au-lieu-quotient', 'raisonnement', `${eur(M)} représente ${fracStr(fC)} de l’héritage : pour retrouver le total, on divise par ${fracStr(fC)}.`),
      ...(naive > 0 ? [mc(clean((M * D) / naive), 'mc:fraction-du-reste', 'raisonnement', `La part de ${C} n’est pas ${fracStr(frac(naive, D))} de l’héritage : ${B} prend ${nB}/${dB} du reste.`)] : []),
    ] }),
  ], {
    prompt: `Un héritage est partagé entre ${A}, ${B} et ${C}. ${A} reçoit ${nA}/${dA} de l’héritage, ${B} reçoit ${nB}/${dB} de ce qui reste ensuite, et ${C} reçoit le reste.`,
    hints: [`Après la part de ${A}, il reste ${dA - nA}/${dA} de l’héritage.`, `Prendre ${nB}/${dB} de ce reste, c’est calculer ${nB}/${dB} × ${dA - nA}/${dA}.`, `Si ${fracStr(fC)} de l’héritage vaut ${eur(M)}, l’héritage entier vaut ${fr(M)} ÷ ${fracStr(fC)}.`],
    solution: `Reste après ${A} : 1 − ${nA}/${dA} = ${dA - nA}/${dA}. ${B} : ${nB}/${dB} × ${dA - nA}/${dA} = ${nB * (dA - nA)}/${D}${fB[1] !== D ? ` = ${fracStr(fB)}` : ''}. ${C} : ${dB - nB}/${dB} × ${dA - nA}/${dA} = ${(dB - nB) * (dA - nA)}/${D}${fC[1] !== D ? ` = ${fracStr(fC)}` : ''}. Total : ${fr(M)} ÷ ${fracStr(fC)} = ${fr(M)} × ${fC[1]} ÷ ${fC[0]} = ${eur(T)}.`,
    justify: { prompt: `Explique pourquoi la part de ${B} n’est pas ${nB}/${dB} de l’héritage, et comment tu retrouves le montant total.`, minWords: 15, keywords: ['reste', ['fraction', 'multipli', '×'], ['total', 'divis']], example: `${B} reçoit ${nB}/${dB} du reste et non de l’héritage entier : il faut multiplier ${nB}/${dB} par ${dA - nA}/${dA}, ce qui donne ${fracStr(fB)}. ${C} reçoit donc ${fracStr(fC)} de l’héritage ; comme cette part vaut ${eur(M)}, je divise ${fr(M)} par ${fracStr(fC)} et je trouve le total, ${eur(T)}.` },
    expectedSeconds: 450,
  });
}

/* ------------------------------------------------------------------------------------------
 * 8. Faire le plus de paquets identiques possible (diviseurs communs)
 * ---------------------------------------------------------------------------------------- */

const LOTS2 = [
  { items: ['bonbons', 'sucettes'], pack: 'sachets', one: 'sachet' },
  { items: ['crayons', 'gommes'], pack: 'lots', one: 'lot' },
  { items: ['billes rouges', 'billes bleues'], pack: 'sachets', one: 'sachet' },
  { items: ['roses', 'tulipes'], pack: 'bouquets', one: 'bouquet' },
  { items: ['cartes', 'badges'], pack: 'paquets', one: 'paquet' },
];
const LOTS3 = [
  { items: ['bonbons', 'sucettes', 'caramels'], pack: 'sachets', one: 'sachet' },
  { items: ['crayons', 'gommes', 'stylos'], pack: 'lots', one: 'lot' },
  { items: ['roses', 'tulipes', 'marguerites'], pack: 'bouquets', one: 'bouquet' },
  { items: ['lapins en chocolat', 'poissons en chocolat', 'cloches en chocolat'], pack: 'paniers', one: 'panier' },
];

function paquetsClasse(rand) {
  const who = nom(rand); const lot = pick(rand, LOTS2); const [i1, i2] = lot.items;
  let g; let p; let q; let a; let b; let k; let ok;
  for (;;) {
    g = ri(rand, 3, 12); p = ri(rand, 2, 10); q = ri(rand, 2, 10);
    if (p === q || gcd(p, q) !== 1) continue;
    a = g * p; b = g * q;
    if (a > 120 || b > 120) continue;
    const yes = divisors(g).filter((d) => d > 1 && d < g);
    const no = [2, 3, 4, 5, 6, 8, 9, 10, 12].filter((d) => (a % d === 0) !== (b % d === 0));
    ok = yes.length > 0 && (rand() < 0.5 || !no.length);
    if (!ok && !no.length) continue;
    k = pick(rand, ok ? yes : no);
    break;
  }
  const sp = divisors(g)[1];
  return problem([
    yesNo(ok, `Peut-on faire ${k} ${lot.pack} identiques, sans rien laisser ? (oui ou non)`, 'mc:diviseur-commun', 'notion', `Pour faire ${k} ${lot.pack} identiques sans reste, ${k} doit diviser ${a} et aussi ${b}.`),
    numeric(g, { prompt: `Quel est le plus grand nombre de ${lot.pack} identiques possible ?`, misconceptions: [
      mc(lcm(a, b), 'mc:ppcm-au-lieu-pgcd', 'notion', `Le nombre de ${lot.pack} doit diviser les deux quantités : on cherche le plus grand diviseur commun, pas un multiple commun.`),
      ...(sp < g ? [mc(g / sp, 'mc:diviseur-pas-le-plus-grand', 'raisonnement', 'C’est bien un diviseur commun, mais pas le plus grand : cherche s’il en existe un plus grand.')] : []),
    ] }),
    numeric(p, { prompt: `Combien de ${i1} y aura-t-il alors dans chaque ${lot.one} ?`, misconceptions: [
      mc(g, 'mc:lots-au-lieu-contenu', 'lecture', `${g}, c’est le nombre de ${lot.pack} ; dans chaque ${lot.one}, il y a ${a} ÷ ${g} ${i1}.`),
    ] }),
  ], {
    prompt: `${who} a ${a} ${i1} et ${b} ${i2}, et veut composer des ${lot.pack} identiques (même nombre de ${i1} et même nombre de ${i2} dans chaque ${lot.one}) en utilisant la totalité des ${i1} et des ${i2}.`,
    hints: [`Le nombre de ${lot.pack} doit diviser ${a} et ${b} : c’est un diviseur commun.`, `Liste les diviseurs de ${a} et ceux de ${b} (ou décompose-les en facteurs premiers).`, 'Prends le plus grand diviseur commun, puis divise chaque quantité par ce nombre.'],
    solution: `Diviseurs communs de ${a} et ${b} : ${divisors(g).join(', ')}. ${ok ? `${k} divise ${a} et ${b} : on peut faire ${k} ${lot.pack}.` : `${k} ne divise pas à la fois ${a} et ${b} : on ne peut pas faire ${k} ${lot.pack}.`} Le plus grand diviseur commun est ${g} : on peut faire au plus ${g} ${lot.pack}, avec ${a} ÷ ${g} = ${p} ${i1} et ${b} ÷ ${g} = ${q} ${i2} dans chacun.`,
    expectedSeconds: 270,
  });
}

function paquetsPlus(rand) {
  const who = nom(rand); const lot = pick(rand, LOTS3); const [i1, i2, i3] = lot.items;
  let g; let p; let q; let r;
  do { g = ri(rand, 2, 12); p = ri(rand, 2, 12); q = ri(rand, 2, 12); r = ri(rand, 2, 12); }
  while (new Set([p, q, r]).size < 3 || gcd(gcd(p, q), r) !== 1 || g * Math.max(p, q, r) > 150);
  const a = g * p; const b = g * q; const c = g * r; const g2 = gcd(a, b);
  return problem([
    numeric(g, { prompt: `Quel est le plus grand nombre de ${lot.pack} identiques possible ?`, misconceptions: [
      mc(g2, 'mc:oubli-troisieme', 'raisonnement', `${g2} divise ${a} et ${b}, mais pas ${c} : le nombre de ${lot.pack} doit diviser les trois quantités.`),
      mc(lcm(lcm(a, b), c), 'mc:ppcm-au-lieu-pgcd', 'notion', 'On cherche un diviseur commun (le plus grand), pas un multiple commun.'),
    ] }),
    numeric(q, { prompt: `Combien de ${i2} y aura-t-il dans chaque ${lot.one} ?`, misconceptions: [
      mc(g, 'mc:lots-au-lieu-contenu', 'lecture', `${g}, c’est le nombre de ${lot.pack} ; dans chaque ${lot.one}, il y a ${b} ÷ ${g} ${i2}.`),
    ] }),
    numeric(p + q + r, { prompt: `Combien d’objets en tout y aura-t-il dans chaque ${lot.one} ?`, misconceptions: [
      mc(a + b + c, 'mc:total-au-lieu-lot', 'lecture', `${a + b + c}, c’est le nombre total d’objets ; il faut le répartir dans les ${g} ${lot.pack}.`),
    ] }),
  ], {
    prompt: `${who} a ${a} ${i1}, ${b} ${i2} et ${c} ${i3}, et veut composer des ${lot.pack} identiques en utilisant la totalité des objets : chaque ${lot.one} doit contenir le même nombre de ${i1}, de ${i2} et de ${i3}.`,
    hints: [`Le nombre de ${lot.pack} doit diviser ${a}, ${b} et ${c}.`, `Décompose en facteurs premiers : ${decomp(a)} ; ${decomp(b)} ; ${decomp(c)}.`, 'Le plus grand diviseur commun est le produit des facteurs premiers communs aux trois décompositions.'],
    solution: `${decomp(a)} ; ${decomp(b)} ; ${decomp(c)}. Le plus grand diviseur commun aux trois nombres est ${g} : ${g} ${lot.pack}. Dans chaque ${lot.one} : ${p} ${i1}, ${q} ${i2} et ${r} ${i3}, soit ${p + q + r} objets.`,
    expectedSeconds: 330,
  });
}

function dallesExpert(rand) {
  const who = nom(rand);
  let g; let p; let q;
  do { g = pick(rand, [20, 24, 30, 36, 40, 48, 50, 60]); p = ri(rand, 3, 12); q = ri(rand, 2, 11); }
  while (q >= p || gcd(p, q) !== 1 || g * p > 720 || g * q > 600);
  const L = g * p; const l = g * q; const n = p * q;
  return problem([
    numeric(g, { prompt: 'Quel est le côté des dalles ? (en cm)', unit: 'cm', unitOptional: true, misconceptions: [
      mc(lcm(L, l), 'mc:ppcm-au-lieu-pgcd', 'notion', 'Le côté doit diviser la longueur et la largeur : on cherche le plus grand diviseur commun, pas un multiple commun.'),
      mc(g / 2, 'mc:diviseur-pas-le-plus-grand', 'raisonnement', `${g / 2} cm convient, mais ce n’est pas le plus grand côté possible.`),
    ] }),
    numeric(n, { prompt: 'Combien de dalles faut-il ?', misconceptions: [
      mc(p + q, 'mc:addition-au-lieu-produit', 'raisonnement', 'Le nombre de dalles est (dalles dans la longueur) × (dalles dans la largeur), pas leur somme.'),
      mc((L * l) / g, 'mc:aire-dalle', 'notion', `L’aire d’une dalle est ${g} × ${g} cm² : on divise l’aire de la terrasse par ${g * g}, pas par ${g}.`),
    ] }),
    numeric(4 * n, { prompt: `Avec des dalles de ${g / 2} cm de côté, combien en faudrait-il ?`, misconceptions: [
      mc(2 * n, 'mc:aire-double', 'raisonnement', 'Si le côté est divisé par 2, l’aire de chaque dalle est divisée par 4 : il faut 4 fois plus de dalles, pas 2 fois plus.'),
    ] }),
  ], {
    prompt: `${who} veut recouvrir une terrasse rectangulaire de ${fr(L / 100)} m sur ${fr(l / 100)} m avec des dalles carrées identiques, sans découpe ni espace. Le côté des dalles doit être un nombre entier de centimètres, le plus grand possible.`,
    hints: ['Convertis les dimensions en centimètres.', `Le côté doit diviser ${L} et ${l} : c’est un diviseur commun ; on veut le plus grand.`, 'Nombre de dalles = (dalles dans la longueur) × (dalles dans la largeur).'],
    solution: `${fr(L / 100)} m = ${L} cm et ${fr(l / 100)} m = ${l} cm. ${decomp(L)} et ${decomp(l)} : le plus grand diviseur commun est ${g}. Dalles de ${g} cm : ${L} ÷ ${g} = ${p} dans la longueur, ${l} ÷ ${g} = ${q} dans la largeur, soit ${p} × ${q} = ${n} dalles. Avec un côté deux fois plus petit, il en faut 2 × 2 = 4 fois plus : ${4 * n} dalles.`,
    justify: { prompt: 'Explique pourquoi le côté des dalles doit être un diviseur commun des deux dimensions, et pourquoi on prend le plus grand.', minWords: 15, keywords: ['diviseur', 'commun', ['plus grand', 'pgcd']], example: `Il faut un nombre entier de dalles dans la longueur et dans la largeur, sans découpe : le côté doit donc diviser ${L} et ${l}, c’est un diviseur commun. On veut les dalles les plus grandes possible, donc on prend le plus grand diviseur commun, ${g} cm.` },
    expectedSeconds: 420,
  });
}

/* ------------------------------------------------------------------------------------------
 * 9. Programmes de calcul : remonter le programme, prouver un résultat constant
 * ---------------------------------------------------------------------------------------- */

const step = (a) => (a > 0 ? `ajoute ${a}` : `soustrais ${-a}`);

function programmeClasse(rand) {
  const who = nom(rand);
  let a; let b; let c; let n1; let x0;
  do { a = ri(rand, 2, 9); b = ri(rand, 2, 6); c = ri(rand, 1, 15); n1 = ri(rand, 2, 10); x0 = ri(rand, 1, 12); } while (x0 === n1 || a * b === c);
  const f = (x) => (x + a) * b - c; const R = f(x0);
  return problem([
    numeric(f(n1), { prompt: `Quel résultat obtient-on en choisissant ${n1} ?`, misconceptions: [
      mc(n1 + a * b - c, 'mc:priorites-programme', 'methode', `Chaque étape s’applique au résultat de l’étape précédente : on multiplie (${n1} + ${a}) par ${b}, pas seulement ${a}.`),
    ] }),
    numeric(f(0), { prompt: 'Quel résultat obtient-on en choisissant 0 ?', misconceptions: [
      mc(-c, 'mc:zero-absorbant', 'calcul', `0 + ${a} = ${a} : le résultat de la deuxième étape n’est pas 0.`),
      mc(a - c, 'mc:etape-oubliee', 'methode', `N’oublie pas l’étape « multiplie par ${b} ».`),
    ] }),
    numeric(x0, { prompt: `Quel nombre faut-il choisir au départ pour obtenir ${fr(R)} ?`, misconceptions: [
      mc(clean((R - c) / b - a), 'mc:operation-inverse', 'methode', `Pour remonter le programme, on fait les opérations inverses dans l’ordre inverse : + ${c}, puis ÷ ${b}, puis − ${a}.`),
      mc(f(R), 'mc:sens-programme', 'raisonnement', 'Tu as appliqué le programme au résultat : il faut le remonter à l’envers.'),
    ] }),
  ], {
    prompt: `${who} propose ce programme de calcul : choisis un nombre ; ajoute ${a} ; multiplie le résultat par ${b} ; soustrais ${c}.`,
    hints: ['Applique les étapes une par une, dans l’ordre.', `Pour ${n1} : ${n1} + ${a} = ${n1 + a}, puis on multiplie ce résultat par ${b}…`, `Pour remonter depuis ${fr(R)} : ajoute ${c}, puis divise par ${b}, puis soustrais ${a}.`],
    solution: `${n1} → ${n1 + a} → ${(n1 + a) * b} → ${fr(f(n1))}. 0 → ${a} → ${a * b} → ${fr(f(0))}. En remontant depuis ${fr(R)} : ${fr(R)} + ${c} = ${fr(R + c)} ; ${fr(R + c)} ÷ ${b} = ${fr((R + c) / b)} ; ${fr((R + c) / b)} − ${a} = ${x0}.`,
    expectedSeconds: 270,
  });
}

function programmePlus(rand) {
  let a; let b; let c; let x0;
  do { a = pick(rand, [-1, 1]) * ri(rand, 2, 9); b = ri(rand, 2, 7); c = ri(rand, 1, 20); x0 = ri(rand, -9, 12); } while (x0 === 0 || a * b === c);
  const K = a * b - c; const R = b * (x0 + a) - c;
  return problem([
    expression(`${b}*(${lin(1, a)}) - ${c}`, { prompt: 'On note x le nombre choisi. Écris le résultat du programme en fonction de x.', misconceptions: [
      mc(lin(1, a * b - c), 'mc:parentheses-oubliees', 'methode', `C’est tout le résultat de la deuxième étape (x${sgn(a)}) qui est multiplié par ${b} : il faut des parenthèses.`),
      mc(lin(b, a - c), 'mc:distributivite-partielle', 'calcul', `${b} multiplie x et aussi ${fr(a)}.`),
    ] }),
    expression(lin(b, K), { form: 'developpee-reduite', prompt: 'Développe et réduis cette expression.', misconceptions: [
      mc(lin(b, a - c), 'mc:distributivite-partielle', 'calcul', `${b}(x${sgn(a)}) = ${b}x${sgn(a * b)} : ${b} multiplie les deux termes.`),
    ] }),
    numeric(x0, { prompt: `Quel nombre faut-il choisir pour obtenir ${fr(R)} ?`, misconceptions: [
      mc(clean((R + K) / b), 'mc:transposition', 'signe', `Pour isoler ${b}x dans ${poly([K, b])} = ${fr(R)}, on soustrait ${fr(K)} aux deux membres (on change le signe en le faisant passer de l’autre côté).`),
      mc(clean(R - K - b), 'mc:soustraction-au-lieu-division', 'methode', `${b}x signifie ${b} × x : pour trouver x, on divise par ${b}.`),
    ] }),
  ], {
    prompt: `Programme de calcul : choisis un nombre ; ${step(a)} ; multiplie le résultat par ${b} ; soustrais ${c}.`,
    hints: [`Avec x : la deuxième étape donne x${sgn(a)} ; tout ce résultat est multiplié par ${b}.`, `Développe ${b}(x${sgn(a)}) : ${b} multiplie chacun des deux termes.`, `Résous l’équation ${poly([K, b])} = ${fr(R)}.`],
    solution: `Résultat : ${b}(x${sgn(a)}) − ${c} = ${b}x${sgn(a * b)} − ${c} = ${poly([K, b])}. Équation : ${poly([K, b])} = ${fr(R)}, donc ${b}x = ${fr(R)}${sgn(-K)} = ${fr(R - K)} et x = ${fr(R - K)} ÷ ${b} = ${fr(x0)}.`,
    expectedSeconds: 330,
  });
}

function programmeExpert(rand) {
  const constant = rand() < 0.65;
  let a; let b; let c; let n1; let n2;
  do { a = pick(rand, [-1, 1]) * ri(rand, 2, 9); b = ri(rand, 2, 6); c = ri(rand, 1, 15); n1 = ri(rand, 2, 9); n2 = -ri(rand, 2, 9); } while (a * b === c);
  const m = constant ? b : b - 1; const K = a * b - c; const f = (x) => b * (x + a) - c - m * x;
  const mx = m === 1 ? 'x' : `${m}x`;
  const last = m === 1 ? 'soustrais le nombre choisi au départ' : `soustrais ${m} fois le nombre choisi au départ`;
  return problem([
    numeric(f(n1), { prompt: `Quel résultat obtient-on en choisissant ${n1} ?`, misconceptions: [
      mc(n1 + a * b - c - m * n1, 'mc:priorites-programme', 'methode', `Le résultat de la deuxième étape (${n1}${sgn(a)} = ${fr(n1 + a)}) est multiplié en entier par ${b}.`),
    ] }),
    numeric(f(n2), { prompt: `Et en choisissant ${fr(n2)} ?`, misconceptions: [
      mc(b * (n2 + a) - c + m * n2, 'mc:signe-soustraction', 'signe', `Soustraire ${m === 1 ? '' : `${m} fois `}${fr(n2)}, c’est soustraire ${fr(m * n2)}, donc ajouter ${fr(-m * n2)}.`),
    ] }),
    expression(lin(b - m, K), { form: 'developpee-reduite', prompt: 'On note x le nombre choisi. Écris le résultat en fonction de x, sous forme développée et réduite.', misconceptions: [
      mc(lin(b - m, a - c), 'mc:distributivite-partielle', 'calcul', `${b}(x${sgn(a)}) = ${b}x${sgn(a * b)} : ${b} multiplie les deux termes.`),
    ] }),
    yesNo(constant, 'Le résultat est-il toujours le même, quel que soit le nombre choisi ? (oui ou non)', 'mc:exemples-ne-prouvent-pas', 'raisonnement', constant ? 'Regarde l’expression réduite : contient-elle encore x ? Si non, le résultat ne dépend pas du nombre choisi.' : 'L’expression réduite contient encore x : le résultat dépend du nombre choisi (compare tes deux essais). Deux essais égaux ne prouvent jamais que c’est toujours vrai.'),
  ], {
    prompt: `Programme de calcul : choisis un nombre ; ${step(a)} ; multiplie le résultat par ${b} ; soustrais ${c} ; enfin, ${last}.`,
    hints: ['Fais deux essais avec des nombres différents.', `Avec x : ${b}(x${sgn(a)}) − ${c} − ${mx}. Développe, puis réduis.`, 'Si x disparaît après réduction, le résultat ne dépend pas du nombre choisi ; sinon, un contre-exemple suffit à le montrer.'],
    solution: `Avec ${n1} : ${fr(f(n1))} ; avec ${fr(n2)} : ${fr(f(n2))}. Avec x : ${b}(x${sgn(a)}) − ${c} − ${mx} = ${b}x${sgn(a * b)} − ${c} − ${mx} = ${poly([K, b - m])}. ${constant ? `x disparaît : le résultat vaut toujours ${fr(K)}.` : `Le résultat dépend de x : il n’est pas toujours le même (${fr(f(n1))} ≠ ${fr(f(n2))}).`}`,
    justify: { prompt: 'Justifie ta réponse à la dernière question : une preuve avec la lettre x si c’est toujours vrai, un contre-exemple sinon.', minWords: 12, keywords: [['x', 'lettre', 'contre-exemple'], ['développe', 'distributivité', 'réduit', 'essai'], ['toujours', 'quel que soit', 'dépend', 'change']], example: constant ? `Je note x le nombre choisi : ${b}(x${sgn(a)}) − ${c} − ${mx} = ${b}x${sgn(a * b)} − ${c} − ${mx} = ${fr(K)}. Après réduction, x disparaît : le résultat vaut toujours ${fr(K)}, quel que soit le nombre choisi.` : `Ce n’est pas toujours le même résultat : avec ${n1} on obtient ${fr(f(n1))} et avec ${fr(n2)} on obtient ${fr(f(n2))}, c’est un contre-exemple. Avec x, le résultat réduit vaut ${poly([K, b - m])}, il dépend du nombre choisi.` },
    expectedSeconds: 450,
  });
}

/* ------------------------------------------------------------------------------------------
 * 10. Le jeu est-il équitable ? (probabilités)
 * ---------------------------------------------------------------------------------------- */

const EQUITABLE = ['équitable', 'equitable', 'le jeu est équitable', 'c’est équitable', 'égalité', 'egalite', 'les deux', 'autant', 'personne', 'aucun'];
/** Qui a le plus de chances ? (prénom, ou « équitable »). */
function whoWins(prompt, A, B, pA, pB, feedback) {
  const opts = { A: [A], B: [B], eq: EQUITABLE };
  const good = pA > pB ? 'A' : pB > pA ? 'B' : 'eq';
  return choose(prompt, opts[good], Object.keys(opts).filter((k) => k !== good).map((k) => ({ accept: opts[k], id: 'mc:comparaison-probabilites', feedback })));
}

function urneClasse(rand) {
  const [A, B] = noms(rand, 2);
  const r = ri(rand, 2, 8); const bl = rand() < 0.3 ? r : ri(rand, 2, 8); const v = ri(rand, 1, 6); const N = r + bl + v;
  const faux = (k) => [
    mc(clean(k / (N - k)), 'mc:favorables-sur-defavorables', 'notion', 'Une probabilité, c’est le nombre de cas favorables divisé par le nombre TOTAL de boules.'),
    mc(clean(k / (r + bl)), 'mc:oubli-vertes', 'lecture', 'Les boules vertes font partie des boules que l’on peut tirer : compte-les dans le total.'),
  ];
  return problem([
    proba(r, N, { prompt: `Quelle est la probabilité de tirer une boule rouge ? ${probaForm(r, N)}`, misconceptions: faux(r) }),
    proba(bl, N, { prompt: `Quelle est la probabilité de tirer une boule bleue ? ${probaForm(bl, N)}`, misconceptions: faux(bl) }),
    yesNo(r === bl, 'Ce jeu est-il équitable ? (oui ou non)', 'mc:equitable', 'raisonnement', 'Un jeu est équitable si les deux joueurs ont la même probabilité de gagner : compare les deux probabilités.'),
  ], {
    prompt: `${A} et ${B} jouent avec une urne qui contient ${plur(r, 'boule rouge', 'boules rouges')}, ${plur(bl, 'boule bleue', 'boules bleues')} et ${plur(v, 'boule verte', 'boules vertes')}, indiscernables au toucher. On tire une boule au hasard : ${A} gagne si elle est rouge, ${B} gagne si elle est bleue ; si elle est verte, personne ne gagne.`,
    hints: [`Il y a ${N} boules en tout, et chacune a la même chance d’être tirée.`, 'Probabilité = nombre de cas favorables ÷ nombre total de cas.', 'Le jeu est équitable si les deux probabilités sont égales.'],
    solution: `Il y a ${r} + ${bl} + ${v} = ${N} boules. P(rouge) = ${fracTxt(r, N)} ; P(bleue) = ${fracTxt(bl, N)}. ${r === bl ? 'Les deux probabilités sont égales : le jeu est équitable.' : `${r > bl ? A : B} a plus de chances de gagner : le jeu n’est pas équitable.`}`,
    expectedSeconds: 240,
  });
}

function deEvents(rand, n) {
  const k1 = ri(rand, Math.ceil(n / 2), n - 1); const k2 = ri(rand, 3, Math.floor(n / 2) + 1);
  return [
    { label: 'un nombre pair', test: (x) => x % 2 === 0 },
    { label: 'un nombre impair', test: (x) => x % 2 === 1 },
    { label: 'un nombre premier', test: isPrime, extra: (c) => [mc(clean((c + 1) / n), 'mc:un-premier', 'notion', '1 n’est pas un nombre premier : il n’a qu’un seul diviseur.')] },
    { label: 'un multiple de 3', test: (x) => x % 3 === 0 },
    { label: 'un multiple de 4', test: (x) => x % 4 === 0 },
    { label: `un nombre supérieur ou égal à ${k1}`, test: (x) => x >= k1, extra: (c) => [mc(clean((c - 1) / n), 'mc:inegalite-large', 'lecture', `« Supérieur ou égal à ${k1} » : ${k1} compte aussi.`)] },
    { label: `un nombre strictement inférieur à ${k2}`, test: (x) => x < k2, extra: (c) => [mc(clean((c + 1) / n), 'mc:inegalite-stricte', 'lecture', `« Strictement inférieur à ${k2} » : ${k2} ne compte pas.`)] },
  ];
}

function deApprof(rand) {
  const [A, B] = noms(rand, 2);
  let n; let eA; let eB; let fA; let fB;
  for (;;) {
    n = pick(rand, [6, 8, 10, 12, 20]); [eA, eB] = sample(rand, deEvents(rand, n), 2);
    const faces = Array.from({ length: n }, (_, i) => i + 1);
    fA = faces.filter(eA.test); fB = faces.filter(eB.test);
    if (fA.length > 0 && fA.length < n && fB.length > 0 && fB.length < n) break;
  }
  const cA = fA.length; const cB = fB.length;
  const faux = (e, c) => [mc(clean(c / (n - c)), 'mc:favorables-sur-defavorables', 'notion', `Une probabilité se calcule sur toutes les issues : on divise par ${n}.`), ...(e.extra ? e.extra(c) : [])];
  const verdict = cA === cB ? 'les chances sont égales : le jeu est équitable' : `${cA > cB ? A : B} a plus de chances de marquer`;
  return problem([
    proba(cA, n, { prompt: `Quelle est la probabilité que ${A} marque un point ? ${probaForm(cA, n)}`, misconceptions: faux(eA, cA) }),
    proba(cB, n, { prompt: `Quelle est la probabilité que ${B} marque un point ? ${probaForm(cB, n)}`, misconceptions: faux(eB, cB) }),
    whoWins('Qui a le plus de chances de marquer un point ? (écris le prénom, ou « équitable » si les chances sont égales)', A, B, cA, cB, `Compare les deux probabilités : ${cA}/${n} pour ${A} et ${cB}/${n} pour ${B}.`),
  ], {
    prompt: `${A} et ${B} lancent un dé équilibré à ${n} faces, numérotées de 1 à ${n}. ${A} marque un point si le dé donne ${eA.label} ; ${B} marque un point si le dé donne ${eB.label} (les deux peuvent marquer en même temps).`,
    hints: [`Il y a ${n} issues équiprobables : 1, 2, …, ${n}.`, `Écris la liste des faces qui font marquer ${A}, puis celle des faces qui font marquer ${B}.`, `Les deux probabilités ont le même dénominateur ${n} : compare les numérateurs.`],
    solution: `Pour ${A} (${eA.label}) : ${fA.join(', ')}, soit ${plur(cA, 'issue', 'issues')} sur ${n}, P = ${fracTxt(cA, n)}. Pour ${B} (${eB.label}) : ${fB.join(', ')}, soit ${plur(cB, 'issue', 'issues')}, P = ${fracTxt(cB, n)}. Donc ${verdict}.`,
    expectedSeconds: 300,
  });
}

function twoDiceEvents(rand) {
  const s = ri(rand, 3, 11); const k = ri(rand, 8, 11);
  let unordered = 0;
  for (let x = 1; x <= 6; x++) for (let y = x; y <= 6; y++) if (x + y === s) unordered++;
  return [
    { label: `la somme des deux dés vaut ${s}`, test: (x, y) => x + y === s, extra: [
      mc(clean(1 / 11), 'mc:sommes-equiprobables', 'notion', 'Les 11 sommes possibles (de 2 à 12) ne sont pas équiprobables : il faut compter les couples de résultats.'),
      mc(clean(unordered / 36), 'mc:ordre-des-des', 'raisonnement', 'Les deux dés sont différents : (1 ; 6) et (6 ; 1) sont deux issues distinctes.'),
    ] },
    { label: `la somme des deux dés est supérieure ou égale à ${k}`, test: (x, y) => x + y >= k },
    { label: 'on obtient un double', test: (x, y) => x === y },
    { label: 'le produit des deux dés est pair', test: (x, y) => (x * y) % 2 === 0 },
    { label: 'le produit des deux dés est impair', test: (x, y) => (x * y) % 2 === 1 },
    { label: 'la somme des deux dés est paire', test: (x, y) => (x + y) % 2 === 0 },
    { label: 'au moins un des deux dés donne 6', test: (x, y) => x === 6 || y === 6, extra: [
      mc(clean(12 / 36), 'mc:double-compte', 'raisonnement', 'Le couple (6 ; 6) a été compté deux fois : il y a 11 issues favorables, pas 12.'),
    ] },
    { label: 'l’écart entre les deux dés vaut 1', test: (x, y) => Math.abs(x - y) === 1, extra: [
      mc(clean(5 / 36), 'mc:ordre-des-des', 'raisonnement', 'Les deux dés sont différents : (2 ; 3) et (3 ; 2) sont deux issues distinctes.'),
    ] },
  ];
}

function deuxDesExpert(rand) {
  const [A, B] = noms(rand, 2);
  const [eA, eB] = sample(rand, twoDiceEvents(rand), 2);
  const count = (e) => { let c = 0; for (let x = 1; x <= 6; x++) for (let y = 1; y <= 6; y++) if (e.test(x, y)) c++; return c; };
  const cA = count(eA); const cB = count(eB);
  const faux = (e) => [mc(clean(1 / 36), 'mc:une-seule-issue', 'raisonnement', 'Plusieurs couples de résultats réalisent cet évènement : compte-les tous.'), ...(e.extra || [])];
  const verdict = cA === cB ? 'les chances sont égales : le jeu est équitable' : `${cA > cB ? A : B} a plus de chances de marquer`;
  return problem([
    numeric(36, { prompt: 'Combien y a-t-il d’issues possibles (couples formés par le résultat du dé rouge et celui du dé bleu) ?', misconceptions: [
      mc(12, 'mc:issues-additionnees', 'raisonnement', 'Chaque issue est un couple (dé rouge ; dé bleu) : il y a 6 × 6 issues, pas 6 + 6.'),
      mc(11, 'mc:sommes-equiprobables', 'notion', 'Il y a 11 sommes possibles, mais 36 couples de résultats, tous équiprobables.'),
    ] }),
    proba(cA, 36, { prompt: `Quelle est la probabilité que ${A} marque un point ? ${probaForm(cA, 36)}`, misconceptions: faux(eA) }),
    proba(cB, 36, { prompt: `Quelle est la probabilité que ${B} marque un point ? ${probaForm(cB, 36)}`, misconceptions: faux(eB) }),
    whoWins('Qui a le plus de chances de marquer un point ? (écris le prénom, ou « équitable » si les chances sont égales)', A, B, cA, cB, `Compare les deux probabilités : ${cA}/36 pour ${A} et ${cB}/36 pour ${B}.`),
  ], {
    prompt: `${A} et ${B} lancent ensemble un dé rouge et un dé bleu, équilibrés, à six faces. ${A} marque un point si ${eA.label} ; ${B} marque un point si ${eB.label} (les deux peuvent marquer en même temps).`,
    hints: ['Fais un tableau à double entrée : le dé rouge en ligne, le dé bleu en colonne.', 'Il y a 6 × 6 = 36 couples, tous équiprobables.', 'Colorie dans le tableau les cases qui font marquer chaque joueur, puis compte-les.'],
    solution: `Il y a 6 × 6 = 36 issues équiprobables. ${cap(eA.label)} : ${cA} couples, donc P = ${fracTxt(cA, 36)}. ${cap(eB.label)} : ${cB} couples, donc P = ${fracTxt(cB, 36)}. Donc ${verdict}.`,
    justify: { prompt: 'Explique comment tu as compté les issues favorables (un tableau à double entrée peut aider), puis conclus.', minWords: 15, keywords: ['36', ['tableau', 'couple', 'issue'], ['probabilité', 'chance']], example: `Avec un tableau à double entrée, il y a 6 × 6 = 36 couples équiprobables. Pour ${A}, ${eA.label} dans ${cA} couples, donc la probabilité vaut ${cA}/36. Pour ${B}, ${eB.label} dans ${cB} couples, donc ${cB}/36. Donc ${verdict}.` },
    expectedSeconds: 480,
  });
}

/* ------------------------------------------------------------------------------------------
 * 11. Remplir un aquarium ou une piscine (volumes, contenances, débit)
 * ---------------------------------------------------------------------------------------- */

function aquariumClasse(rand) {
  const who = nom(rand);
  const L = pick(rand, [40, 50, 60, 70, 80, 100]); const l = pick(rand, [25, 30, 35, 40]); const h = pick(rand, [30, 35, 40, 45, 50]); const e = h - pick(rand, [5, 10]);
  const V = L * l * h; const VL = clean(V / 1000); const W = clean((L * l * e) / 1000);
  return problem([
    numeric(V, { prompt: 'Quel est le volume de l’aquarium ? (en cm³)', unit: 'cm³', unitOptional: true, misconceptions: [
      mc(L * l, 'mc:aire-au-lieu-volume', 'notion', 'Tu as calculé l’aire du fond. Le volume d’un pavé droit, c’est longueur × largeur × hauteur.'),
      mc(L + l + h, 'mc:somme-dimensions', 'notion', 'On multiplie les trois dimensions, on ne les additionne pas.'),
    ] }),
    numeric(VL, { prompt: 'Combien de litres l’aquarium contient-il quand il est plein ?', unit: 'L', unitOptional: true, misconceptions: [
      mc(clean(V / 100), 'mc:conversion-litres', 'unite', '1 L = 1 dm³ = 1 000 cm³ : on divise par 1 000.'),
    ] }),
    numeric(W, { prompt: `${who} remplit l’aquarium jusqu’à ${e} cm de hauteur. Combien de litres d’eau faut-il ?`, unit: 'L', unitOptional: true, misconceptions: [
      mc(VL, 'mc:hauteur-eau', 'lecture', `L’eau ne monte que jusqu’à ${e} cm : la hauteur à utiliser est ${e} cm, pas ${h} cm.`),
    ] }),
  ], {
    prompt: `${who} a un aquarium en forme de pavé droit : ${L} cm de long, ${l} cm de large et ${h} cm de haut.`,
    hints: ['Volume d’un pavé droit = longueur × largeur × hauteur.', '1 L = 1 dm³ = 1 000 cm³.', `Pour l’eau, on garde la longueur et la largeur, mais la hauteur est ${e} cm.`],
    solution: `Volume : ${L} × ${l} × ${h} = ${fr(V)} cm³, soit ${fr(V)} ÷ 1 000 = ${fr(VL)} L. Eau : ${L} × ${l} × ${e} = ${fr(L * l * e)} cm³ = ${fr(W)} L.`,
    expectedSeconds: 240,
  });
}

function piscinePlus(rand) {
  const who = nom(rand);
  let L; let l; let e; let d; let V; let T;
  for (;;) {
    L = ri(rand, 4, 10); l = ri(rand, 2, 5); e = pick(rand, [80, 100, 120, 140, 150]); d = pick(rand, [20, 25, 30, 40, 50, 60]);
    if (l >= L) continue;
    V = clean((L * l * e) / 100); T = clean((V * 1000) / d);
    if (Number.isInteger(T) && T % 5 === 0 && T <= 2400) break;
  }
  const p = pick(rand, [3.5, 3.8, 4, 4.2, 4.5]); const cout = clean(V * p);
  return problem([
    numeric(V, { prompt: 'Quel volume d’eau faut-il pour la remplir ? (en m³)', unit: 'm³', unitOptional: true, misconceptions: [
      mc(L * l * e, 'mc:conversion-cm-m', 'unite', `La profondeur est en centimètres : ${e} cm = ${fr(e / 100)} m.`),
    ] }),
    numeric(T, { prompt: 'Combien de temps dure le remplissage ? (en minutes, ou en heures et minutes, par exemple 2 h 15)', unit: 'min', unitOptional: true, misconceptions: [
      mc(clean(V / d), 'mc:conversion-m3-l', 'unite', 'Le débit est en litres par minute : convertis d’abord le volume en litres (1 m³ = 1 000 L).'),
    ] }),
    numeric(cout, { prompt: `L’eau coûte ${eur(p)} le mètre cube. Combien coûte le remplissage ? (en €)`, tolerance: 0.01, misconceptions: [
      mc(clean(V * 1000 * p), 'mc:prix-au-litre', 'unite', 'Le prix est donné par mètre cube : multiplie le volume en m³, pas en litres.'),
    ] }),
  ], {
    prompt: `${who} remplit une piscine rectangulaire de ${L} m de long et ${l} m de large, jusqu’à une profondeur de ${e} cm. Le tuyau débite ${d} L d’eau par minute.`,
    hints: [`Convertis la profondeur en mètres : ${e} cm = ${fr(e / 100)} m.`, '1 m³ = 1 000 L : convertis le volume en litres avant d’utiliser le débit.', `Durée = volume en litres ÷ ${d} L par minute.`],
    solution: `Volume : ${L} × ${l} × ${fr(e / 100)} = ${fr(V)} m³ = ${fr(V * 1000)} L. Durée : ${fr(V * 1000)} ÷ ${d} = ${fr(T)} min, soit ${hhmm(T / 60)}. Coût : ${fr(V)} × ${fr(p)} = ${eur(cout)}.`,
    expectedSeconds: 330,
  });
}

function piscineExpert(rand) {
  const who = nom(rand);
  let L; let l; let p1; let p2; let V; let d; let T; let H0;
  for (;;) {
    L = pick(rand, [8, 10, 12, 15]); l = pick(rand, [4, 5, 6]); p1 = pick(rand, [0.8, 1, 1.2]); p2 = pick(rand, [1.6, 1.8, 2, 2.2]);
    V = clean(((p1 + p2) / 2) * L * l); d = pick(rand, [100, 120, 125, 150, 200, 250]); T = clean((V * 1000) / d / 60); H0 = ri(rand, 6, 9);
    if (Number.isInteger(clean(T * 4)) && T <= 14 && H0 + T <= 23.75) break;
  }
  const base = clean(((p1 + p2) * L) / 2); const fin = clean(H0 + T); const minutes = clean((V * 1000) / d);
  const decTrap = T % 1 ? [mc(clean(H0 + Math.floor(T) + ((T % 1) * 100) / 60), 'mc:heures-decimales', 'unite', `${fr(T)} h, ce n’est pas ${Math.floor(T)} h ${Math.round((T % 1) * 100)} : ${fr(clean(T % 1))} h = ${Math.round((T % 1) * 60)} min.`)] : [];
  return problem([
    numeric(V, { prompt: 'Quel est le volume de la piscine ? (en m³)', unit: 'm³', unitOptional: true, tolerance: 0.001, misconceptions: [
      mc(clean(L * l * p2), 'mc:profondeur-max', 'raisonnement', 'Le fond est en pente : la piscine n’a pas partout la profondeur maximale.'),
      mc(clean(L * l * (p1 + p2)), 'mc:moitie-oubliee', 'notion', `La base est un trapèze : son aire est (${fr(p1)} + ${fr(p2)}) × ${L} ÷ 2 ; n’oublie pas de diviser par 2.`),
      mc(clean(L * l * p1), 'mc:profondeur-min', 'raisonnement', 'Le fond est en pente : la piscine est plus profonde d’un côté.'),
    ] }),
    asHour(numeric(T, { prompt: 'Combien de temps dure le remplissage ? (en heures, par exemple 7,5 ou 7 h 30)', unit: 'h', unitOptional: true, misconceptions: [
      mc(minutes, 'mc:minutes-heures', 'unite', 'Ce nombre est la durée en minutes : divise par 60 pour l’avoir en heures (ou écris « min » après le nombre).'),
    ] }), T),
    asHour(numeric(fin, { prompt: 'À quelle heure la piscine sera-t-elle pleine ? (par exemple 17 h 45)', unit: 'h', unitOptional: true, misconceptions: [
      mc(T, 'mc:duree-au-lieu-heure', 'lecture', `Ce nombre est la durée du remplissage ; il faut l’ajouter à l’heure de départ (${H0} h).`),
      ...decTrap,
    ] }), fin),
  ], {
    prompt: `${who} remplit une piscine de ${L} m de long et ${l} m de large. Son fond est en pente : la profondeur passe de ${fr(p1)} m d’un côté à ${fr(p2)} m de l’autre, si bien que la piscine est un prisme droit dont la base est un trapèze. Le remplissage commence à ${H0} h, avec un débit de ${d} L par minute.`,
    hints: [`Aire de la base (trapèze) : (${fr(p1)} + ${fr(p2)}) × ${L} ÷ 2 ; volume du prisme = aire de la base × ${l}.`, '1 m³ = 1 000 L ; durée en minutes = litres ÷ débit, puis divise par 60 pour les heures.', `Heure de fin = ${H0} h + durée (attention : 0,5 h = 30 min, 0,25 h = 15 min).`],
    solution: `Base : (${fr(p1)} + ${fr(p2)}) × ${L} ÷ 2 = ${fr(base)} m² ; volume : ${fr(base)} × ${l} = ${fr(V)} m³ = ${fr(V * 1000)} L. Durée : ${fr(V * 1000)} ÷ ${d} = ${fr(minutes)} min = ${fr(T)} h (${hhmm(T)}). Fin : ${H0} h + ${hhmm(T)} = ${hhmm(fin)}.`,
    justify: { prompt: 'Explique ta démarche : le calcul du volume, la conversion en litres, puis la durée et l’heure de fin.', minWords: 15, keywords: [['prisme', 'trapèze', 'volume'], ['litre', 'débit'], ['heure', 'minute']], example: `La piscine est un prisme droit à base trapèze : (${fr(p1)} + ${fr(p2)}) × ${L} ÷ 2 = ${fr(base)} m², multiplié par ${l} m, cela donne ${fr(V)} m³, soit ${fr(V * 1000)} litres. Avec ${d} litres par minute, il faut ${fr(minutes)} minutes, soit ${hhmm(T)}, donc la piscine est pleine à ${hhmm(fin)}.` },
    expectedSeconds: 480,
  });
}

/* ------------------------------------------------------------------------------------------
 * 12. Moyenne et médiane d'une classe, effet d'une nouvelle note
 * ---------------------------------------------------------------------------------------- */

const SERIES = [
  { intro: (n) => `Voici les notes sur 20 obtenues par ${n} élèves à un contrôle`, min: 5, max: 19 },
  { intro: (n) => `Voici le nombre de livres lus pendant l’été par ${n} élèves`, min: 0, max: 14 },
  { intro: (n) => `Voici la durée du trajet jusqu’au collège, en minutes, de ${n} élèves`, min: 5, max: 40 },
];
const IND_MOY = ['la moyenne', 'moyenne'];
const IND_MED = ['la médiane', 'médiane', 'la mediane', 'mediane'];
const median = (sorted) => { const n = sorted.length; return n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2; };

function statsClasse(rand) {
  const S = pick(rand, SERIES);
  let n; let vals; let tot;
  do { n = pick(rand, [7, 9, 11]); vals = Array.from({ length: n }, () => ri(rand, S.min, S.max)); tot = sum(vals); } while (tot % n !== 0);
  const sorted = vals.slice().sort((x, y) => x - y); const moy = tot / n; const med = median(sorted); const min = sorted[0]; const max = sorted[n - 1];
  return problem([
    numeric(moy, { prompt: 'Quelle est la moyenne de cette série ?', misconceptions: [
      mc(clean((min + max) / 2), 'mc:moyenne-extremes', 'notion', 'La moyenne utilise toutes les valeurs : somme des valeurs ÷ nombre de valeurs.'),
      mc(med, 'mc:mediane-au-lieu-moyenne', 'notion', 'Ce nombre est la médiane. La moyenne, c’est la somme des valeurs divisée par leur nombre.'),
    ] }),
    numeric(med, { prompt: 'Quelle est la médiane de cette série ?', misconceptions: [
      mc(vals[(n - 1) / 2], 'mc:mediane-non-triee', 'methode', 'Avant de prendre la valeur du milieu, il faut ranger les valeurs dans l’ordre croissant.'),
      mc(moy, 'mc:moyenne-au-lieu-mediane', 'notion', 'Ce nombre est la moyenne. La médiane est la valeur du milieu de la série rangée.'),
    ] }),
    numeric(max - min, { prompt: 'Quelle est l’étendue de cette série ?', misconceptions: [
      mc(max, 'mc:etendue-maximum', 'notion', 'L’étendue est l’écart entre la plus grande et la plus petite valeur : maximum − minimum.'),
    ] }),
  ], {
    prompt: `${S.intro(n)} : ${vals.join(' ; ')}.`,
    hints: ['Moyenne = somme des valeurs ÷ nombre de valeurs.', `Range les ${n} valeurs dans l’ordre croissant : la médiane est la ${(n + 1) / 2}e.`, 'Étendue = plus grande valeur − plus petite valeur.'],
    solution: `Somme : ${tot}, donc moyenne = ${tot} ÷ ${n} = ${fr(moy)}. Série rangée : ${sorted.join(' ; ')} ; la ${(n + 1) / 2}e valeur est ${med} : c’est la médiane. Étendue : ${max} − ${min} = ${max - min}.`,
    expectedSeconds: 270,
  });
}

function statsPlus(rand) {
  const who = nom(rand);
  let v; let e; let N; let moy;
  for (;;) {
    v = sample(rand, [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18], 5).sort((x, y) => x - y);
    e = v.map(() => ri(rand, 1, 7)); N = sum(e); moy = sum(v.map((x, i) => x * e[i])) / N;
    if (N >= 12 && Math.abs(moy * 10 - Math.round(moy * 10)) < 0.35) break;
  }
  const list = v.flatMap((x, i) => Array(e[i]).fill(x)); const med = median(list);
  const mode = v[e.indexOf(Math.max(...e))]; const moy1 = round(moy, 1); const tot = sum(v.map((x, i) => x * e[i]));
  const rang = N % 2 ? `la ${(N + 1) / 2}e note` : `la moyenne de la ${N / 2}e et de la ${N / 2 + 1}e note`;
  return problem([
    numeric(N, { prompt: 'Combien d’élèves ont passé le contrôle ?', misconceptions: [
      mc(5, 'mc:valeurs-au-lieu-effectifs', 'lecture', 'Il y a 5 notes différentes, mais chacune est obtenue par plusieurs élèves : additionne les effectifs.'),
    ] }),
    numeric(moy1, { prompt: 'Quelle est la moyenne de la classe, arrondie au dixième ?', tolerance: 0.05, round: 1, misconceptions: [
      mc(round(sum(v) / 5, 1), 'mc:effectifs-oublies', 'methode', 'Chaque note doit compter autant de fois que d’élèves l’ont obtenue : multiplie chaque note par son effectif.'),
    ] }),
    numeric(med, { prompt: 'Quelle est la note médiane ?', misconceptions: [
      mc(v[2], 'mc:effectifs-oublies', 'methode', `La médiane se cherche parmi les ${N} notes rangées (en tenant compte des effectifs), pas parmi les 5 notes différentes.`),
      mc(mode, 'mc:mode-au-lieu-mediane', 'notion', 'Ce nombre est la note la plus fréquente ; la médiane partage les élèves en deux groupes de même effectif.'),
    ] }),
  ], {
    prompt: `Au dernier contrôle de la classe de ${who}, les notes sur 20 se répartissent ainsi : ${v.map((x, i) => `${x} (${plur(e[i], 'élève', 'élèves')})`).join(', ')}.`,
    hints: ['L’effectif total est la somme des effectifs.', 'Moyenne = (somme des produits note × effectif) ÷ effectif total.', `Médiane : range les ${N} notes dans l’ordre ; c’est ${rang}.`],
    solution: `Effectif total : ${e.join(' + ')} = ${N}. Somme des notes : ${v.map((x, i) => `${x} × ${e[i]}`).join(' + ')} = ${tot} ; moyenne : ${quot(tot, N)}, soit ${fr(moy1)} au dixième. Médiane : ${rang}, soit ${fr(med)}.`,
    expectedSeconds: 330,
  });
}

function statsExpert(rand) {
  const who = nom(rand);
  let vals; let tot; let X; let mb; let ma; let medb; let meda; let s2;
  for (;;) {
    vals = Array.from({ length: 9 }, () => ri(rand, 6, 18)); tot = sum(vals);
    if (tot % 9) continue;
    mb = tot / 9; X = rand() < 0.5 ? ri(rand, 0, 4) : ri(rand, 19, 20);
    if (Math.abs(X - mb) < 6) continue;
    s2 = [...vals, X].sort((x, y) => x - y);
    medb = median(vals.slice().sort((x, y) => x - y)); meda = median(s2); ma = clean((tot + X) / 10);
    if (Math.abs(Math.abs(mb - ma) - Math.abs(medb - meda)) >= 0.3) break;
  }
  const dm = clean(Math.abs(mb - ma)); const moyPlus = dm > Math.abs(medb - meda); const baisse = X < mb;
  return problem([
    numeric(ma, { prompt: `Quelle est la moyenne des 10 notes, avec celle de ${who} ?`, misconceptions: [
      mc(clean((tot + X) / 9), 'mc:effectif-non-mis-a-jour', 'calcul', 'Il y a maintenant 10 notes : on divise le total par 10.'),
      mc(mb, 'mc:ancienne-moyenne', 'lecture', `Ce nombre est la moyenne des 9 premières notes, sans celle de ${who}.`),
    ] }),
    numeric(meda, { prompt: 'Quelle est la médiane des 10 notes ?', misconceptions: [
      mc(s2[4], 'mc:mediane-effectif-pair', 'methode', 'Avec 10 notes, la médiane est la moyenne de la 5e et de la 6e note rangées dans l’ordre croissant.'),
      mc(s2[5], 'mc:mediane-effectif-pair', 'methode', 'Avec 10 notes, la médiane est la moyenne de la 5e et de la 6e note rangées dans l’ordre croissant.'),
      mc(medb, 'mc:ancienne-mediane', 'lecture', `Ce nombre est la médiane des 9 premières notes, sans celle de ${who}.`),
    ] }),
    numeric(dm, { prompt: `De combien de points la moyenne a-t-elle ${baisse ? 'baissé' : 'augmenté'} avec la note de ${who} ?`, misconceptions: [
      mc(Math.abs(X - mb), 'mc:ecart-au-lieu-variation', 'raisonnement', `C’est l’écart entre la note de ${who} et l’ancienne moyenne. Compare plutôt l’ancienne moyenne et la nouvelle.`),
    ] }),
    choose('Quel indicateur a été le plus modifié par cette note : la moyenne ou la médiane ?', moyPlus ? IND_MOY : IND_MED, [
      { accept: moyPlus ? IND_MED : IND_MOY, id: 'mc:indicateur-modifie', feedback: `Compare les variations : la moyenne passe de ${fr(mb)} à ${fr(ma)}, la médiane de ${fr(medb)} à ${fr(meda)}.` },
    ]),
  ], {
    prompt: `Voici les notes sur 20 de 9 élèves à un contrôle : ${vals.join(' ; ')}. ${who} n’a pas pu passer ce contrôle le même jour ; au rattrapage, la note de ${who} est ${X}.`,
    hints: [`Calcule d’abord la moyenne et la médiane des 9 notes, sans celle de ${who}.`, 'Avec 10 notes, la médiane est la moyenne de la 5e et de la 6e note rangées dans l’ordre croissant.', 'Pour chaque indicateur, calcule l’écart entre l’ancienne et la nouvelle valeur, puis compare.'],
    solution: `Avant : somme ${tot}, moyenne ${tot} ÷ 9 = ${fr(mb)} ; médiane (5e note rangée) ${fr(medb)}. Après : somme ${tot + X}, moyenne ${tot + X} ÷ 10 = ${fr(ma)} ; série rangée ${s2.join(' ; ')}, médiane (${s2[4]} + ${s2[5]}) ÷ 2 = ${fr(meda)}. La moyenne a ${baisse ? 'baissé' : 'augmenté'} de ${fr(dm)} point${dm >= 2 ? 's' : ''}, la médiane a varié de ${fr(clean(Math.abs(medb - meda)))} : c’est ${moyPlus ? 'la moyenne' : 'la médiane'} qui a le plus changé.`,
    justify: { prompt: 'Explique, avec tes calculs, comment une seule note très éloignée des autres agit sur la moyenne et sur la médiane.', minWords: 15, keywords: ['moyenne', 'médiane', ['toutes les', 'milieu', 'rang', 'extrême', 'éloignée']], example: `Avant, la moyenne était ${fr(mb)} et la médiane ${fr(medb)}. La moyenne utilise toutes les notes : elle passe à ${fr(ma)}, soit ${fr(dm)} point d’écart. La médiane ne dépend que des notes du milieu de la série rangée : elle passe à ${fr(meda)}. C’est donc ${moyPlus ? 'la moyenne' : 'la médiane'} qui a le plus changé.` },
    expectedSeconds: 480,
  });
}

/* ------------------------------------------------------------------------------------------
 * Registre
 * ---------------------------------------------------------------------------------------- */

export const PROBLEMES_MATHS_2 = [
  {
    id: 'p-partage-fractions', subject: 'maths', label: 'Problème : partager un jardin, une cagnotte ou un héritage en fractions',
    skill: 'm5.fractions.addition', skills: ['m4.fractions.problemes', 'm4.fractions.produit', 'm5.fractions.comparaison'], levels: ['5e', '4e'],
    tracks: ALL_TRACKS,
    description: 'Additionner deux parts et trouver le reste ; ◆ dénominateurs quelconques, fraction irréductible, qui reçoit le plus ? ; ✦ fraction d’un reste et montant total retrouvé, avec justification.',
    make: byTier({ classe: partageClasse, approfondissement: partagePlus, expert: partageExpert }),
  },
  {
    id: 'p-paquets-identiques', subject: 'maths', label: 'Problème : faire le plus de paquets identiques possible',
    skill: 'm5.arith.multiples', skills: ['m4.premiers.problemes', 'm4.premiers.decomposer'], levels: ['5e', '4e'],
    tracks: ALL_TRACKS,
    description: 'Diviseurs communs de deux quantités ; ◆ trois quantités et décomposition en facteurs premiers ; ✦ dalles carrées les plus grandes possible, effet d’un côté divisé par 2, justification.',
    make: byTier({ classe: paquetsClasse, approfondissement: paquetsPlus, expert: dallesExpert }),
  },
  {
    id: 'p-programme-de-calcul', subject: 'maths', label: 'Problème : programme de calcul, retrouver le départ et prouver',
    skill: 'm5.calcul.enchainer', skills: ['m4.litteral.programmes', 'm5.litteral.expression', 'm5.litteral.distributivite', 'm4.equations.resoudre'], levels: ['5e', '4e'],
    tracks: ALL_TRACKS,
    description: 'Exécuter un programme et le remonter ; ◆ l’écrire avec x, développer et résoudre ; ✦ le résultat est-il toujours le même ? preuve littérale ou contre-exemple.',
    make: byTier({ classe: programmeClasse, approfondissement: programmePlus, expert: programmeExpert }),
  },
  {
    id: 'p-jeu-equitable', subject: 'maths', label: 'Problème : le jeu est-il équitable ?',
    skill: 'm5.probabilites', skills: ['m4.probas.equiprobabilite', 'm4.probas.vocabulaire', 'm5.fractions.comparaison'], levels: ['5e', '4e'],
    tracks: ALL_TRACKS,
    description: 'Urne et probabilités ; ◆ dé à n faces et évènements (premier, multiple, inégalités) ; ✦ deux dés, 36 issues, sommes non équiprobables et justification.',
    make: byTier({ classe: urneClasse, approfondissement: deApprof, expert: deuxDesExpert }),
  },
  {
    id: 'p-remplir-aquarium-piscine', subject: 'maths', label: 'Problème : remplir un aquarium ou une piscine',
    skill: 'm5.grandeurs.volumes', skills: ['m5.grandeurs.conversions', 'm4.grandeurs.composees'], levels: ['5e', '4e'],
    tracks: ALL_TRACKS,
    description: 'Volume d’un pavé et litres ; ◆ piscine, conversions, durée avec un débit et coût de l’eau ; ✦ fond en pente (prisme à base trapèze), durée et heure de fin, justification.',
    make: byTier({ classe: aquariumClasse, approfondissement: piscinePlus, expert: piscineExpert }),
  },
  {
    id: 'p-moyenne-mediane', subject: 'maths', label: 'Problème : moyenne, médiane et effet d’une nouvelle note',
    skill: 'm4.stats.mediane', skills: ['m5.stats.moyenne'], levels: ['4e'],
    tracks: ALL_TRACKS,
    description: 'Moyenne, médiane et étendue ; ◆ tableau d’effectifs ; ✦ une note extrême ajoutée : comparer l’effet sur la moyenne et sur la médiane, et l’expliquer.',
    make: byTier({ classe: statsClasse, approfondissement: statsPlus, expert: statsExpert }),
  },
];
