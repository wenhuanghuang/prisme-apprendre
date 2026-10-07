/**
 * Niveaux ◆ approfondissement et ✦ expert des générateurs de mesure (Pythagore, conversions d’unités).
 * Chaque fonction reçoit (rand, options) et renvoie un exercice comme `make`.
 * ◆ : conversions, plusieurs opérations, question posée à l'envers ; ✦ : plusieurs étapes, cas piège,
 * conclusion à donner (oui / non, matériau…). Toutes les idées fausses sont calculées avec les nombres tirés.
 */
import { ri, pick, sample, clean, fr, sq, mc, text, problem } from './gen-util.js';
import { prenom, round, isRound, choice, num, yesNo, pt, frameAround } from './tiers-outils.js';
import { distinct } from './tiers-nombres-outils.js';

/* ======================================================================= */
/*                                Pythagore                                */
/* ======================================================================= */

const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41], [12, 35, 37], [6, 8, 10], [9, 12, 15]];
const TRI_NAMES = ['ABC', 'DEF', 'MNP', 'RST', 'IJK', 'EFG', 'KLM', 'UVW'];
function scaled(rand, ks, maxLen = 30, list = TRIPLES) {
  for (;;) {
    const t = pick(rand, list); const k = pick(rand, ks);
    if (Math.max(...t) * k <= maxLen && Math.min(...t) * k >= 0.8) return t.map((x) => clean(x * k));
  }
}

/** ◆ Diagonale d’un rectangle (décimaux) puis périmètre d’un triangle. */
function pyRectangle(rand) {
  const [l, L, d] = scaled(rand, [0.3, 0.4, 0.6, 0.8, 1.2, 1.5, 2.5], 26);
  const [A, B, C, D] = pick(rand, ['ABCD', 'EFGH', 'MNPQ', 'RSTU']).split('');
  const per = clean(L + l + d); const s2 = clean(sq(L) + sq(l));
  return problem([
    num(d, { prompt: `Calcule la longueur de la diagonale [${A}${C}].`, unit: 'cm', unitOptional: true, misconceptions: [mc(clean(L + l), 'mc:pythagore-somme-longueurs', 'notion', 'Le théorème de Pythagore porte sur les carrés des longueurs, pas sur les longueurs.'), mc(s2, 'mc:oubli-racine', 'methode', `Tu as trouvé ${A}${C}² : il reste à prendre la racine carrée.`)] }),
    num(per, { prompt: `Calcule le périmètre du triangle ${A}${B}${C}.`, unit: 'cm', unitOptional: true, misconceptions: [mc(clean(2 * (L + l)), 'mc:perimetre-rectangle', 'lecture', `C’est le périmètre du rectangle : le triangle ${A}${B}${C} a pour côtés [${A}${B}], [${B}${C}] et la diagonale [${A}${C}].`), mc(clean((L * l) / 2), 'mc:aire-perimetre', 'notion', 'Tu as calculé l’aire du triangle ; le périmètre est la somme des longueurs des côtés.')] }),
  ], {
    prompt: `${A}${B}${C}${D} est un rectangle tel que ${A}${B} = ${fr(L)} cm et ${B}${C} = ${fr(l)} cm.`,
    figure: { alt: `Rectangle ${A}${B}${C}${D} et sa diagonale [${A}${C}]`, frame: frameAround([[0, 0], [L, l]]), items: [pt(A, 0, 0, 'sw'), pt(B, L, 0, 'se'), pt(C, L, l, 'ne'), pt(D, 0, l, 'nw'), { type: 'polygon', points: [A, B, C, D], fill: 'maths' }, { type: 'segment', from: A, to: B, label: `${fr(L)} cm` }, { type: 'segment', from: B, to: C, label: `${fr(l)} cm` }, { type: 'segment', from: A, to: C, dashed: true }, { type: 'angle', vertex: B, from: A, to: C, right: true }] },
    representation: 'visuelle', expectedSeconds: 240,
    hints: [`Le triangle ${A}${B}${C} est rectangle en ${B} (un rectangle a quatre angles droits) ; son hypoténuse est [${A}${C}].`, `${A}${C}² = ${A}${B}² + ${B}${C}² = ${fr(sq(L))} + ${fr(sq(l))}.`, `Périmètre du triangle : ${A}${B} + ${B}${C} + ${A}${C}.`],
    solution: `Dans le triangle ${A}${B}${C} rectangle en ${B}, d’après le théorème de Pythagore : ${A}${C}² = ${fr(L)}² + ${fr(l)}² = ${fr(sq(L))} + ${fr(sq(l))} = ${fr(s2)}, donc ${A}${C} = √${fr(s2)} = ${fr(d)} cm. Périmètre : ${fr(L)} + ${fr(l)} + ${fr(d)} = ${fr(per)} cm.`,
  });
}

/** ◆ Côté de l’angle droit (décimaux) puis aire du triangle. */
function pyAire(rand) {
  const [R, P, Q] = pick(rand, TRI_NAMES).split('');
  let [a, b, c] = scaled(rand, [0.2, 0.4, 0.5, 0.6, 1.5, 2.5], 30);
  if (rand() < 0.5) [a, b] = [b, a];
  const area = clean((a * b) / 2); const d2 = clean(sq(c) - sq(a));
  return problem([
    num(b, { prompt: `Calcule ${R}${Q}.`, unit: 'cm', unitOptional: true, tolerance: 0.01, misconceptions: [mc(round(Math.sqrt(sq(c) + sq(a)), 2), 'mc:pythagore-cote-somme', 'notion', `[${P}${Q}] est l’hypoténuse : ${R}${Q}² = ${P}${Q}² − ${R}${P}² (une différence, pas une somme).`), mc(clean(c - a), 'mc:soustraire-longueurs', 'notion', 'On soustrait les carrés des longueurs, pas les longueurs.'), mc(d2, 'mc:oubli-racine', 'methode', `Tu as trouvé ${R}${Q}² : il reste à prendre la racine carrée.`)] }),
    num(area, { prompt: `Calcule l’aire du triangle ${R}${P}${Q}.`, unit: 'cm²', unitOptional: true, misconceptions: [mc(clean(a * b), 'mc:aire-triangle-moitie', 'methode', 'L’aire d’un triangle rectangle est la moitié de celle du rectangle : (côté × côté) ÷ 2.'), mc(clean((a * c) / 2), 'mc:aire-hypotenuse', 'notion', `Les deux côtés de l’angle droit sont [${R}${P}] et [${R}${Q}] : on n’utilise pas l’hypoténuse.`), mc(clean(a + b + c), 'mc:aire-perimetre', 'notion', 'Tu as calculé le périmètre ; l’aire utilise les deux côtés de l’angle droit.')] }),
  ], {
    prompt: `Le triangle ${R}${P}${Q} est rectangle en ${R}, avec ${P}${Q} = ${fr(c)} cm et ${R}${P} = ${fr(a)} cm.`,
    representation: 'visuelle', expectedSeconds: 240,
    hints: [`L’hypoténuse est [${P}${Q}] (en face de l’angle droit) : ${P}${Q}² = ${R}${P}² + ${R}${Q}².`, `Donc ${R}${Q}² = ${fr(sq(c))} − ${fr(sq(a))}.`, `Aire d’un triangle rectangle : (${R}${P} × ${R}${Q}) ÷ 2.`],
    solution: `D’après le théorème de Pythagore dans ${R}${P}${Q} rectangle en ${R} : ${R}${Q}² = ${fr(c)}² − ${fr(a)}² = ${fr(sq(c))} − ${fr(sq(a))} = ${fr(d2)}, donc ${R}${Q} = ${fr(b)} cm. Aire : ${fr(a)} × ${fr(b)} ÷ 2 = ${fr(area)} cm².`,
  });
}

/** ◆ Échelle contre un mur : hauteur arrondie, puis décision. */
function pyEchelle(rand) {
  let L; let d; let h;
  do { L = pick(rand, [2.5, 3, 3.5, 4, 4.5, 5, 6]); d = pick(rand, [0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.5]); h = Math.sqrt(L * L - d * d); } while (isRound(h, 2));
  const H = round(h, 2); const target = round(H + pick(rand, [-0.3, -0.2, -0.15, 0.1, 0.15, 0.25]), 2); const ok = H >= target;
  return problem([
    num(H, { prompt: 'À quelle hauteur arrive le haut de l’échelle ? (en m, arrondie au centimètre)', unit: 'm', unitOptional: true, round: 2, tolerance: 0.0051, misconceptions: [mc(round(Math.sqrt(L * L + d * d), 2), 'mc:pythagore-cote-somme', 'notion', 'L’échelle est l’hypoténuse (en face de l’angle droit entre le mur et le sol) : hauteur² = échelle² − distance².'), mc(clean(L - d), 'mc:soustraire-longueurs', 'notion', 'On soustrait les carrés des longueurs, pas les longueurs.'), mc(round(L * L - d * d, 4), 'mc:oubli-racine', 'methode', 'Tu as trouvé le carré de la hauteur : prends la racine carrée.')] }),
    yesNo(ok, `Une gouttière est à ${fr(target)} m du sol. Le haut de l’échelle l’atteint-il ? (oui ou non)`, 'mc:comparaison', 'raisonnement', ok ? `${fr(H)} m ≥ ${fr(target)} m : l’échelle atteint la gouttière.` : `${fr(H)} m < ${fr(target)} m : il manque ${fr(round(target - H, 2))} m.`),
  ], {
    prompt: `Une échelle de ${fr(L)} m est appuyée contre un mur vertical. Son pied est posé sur le sol horizontal, à ${fr(d)} m du mur.`,
    representation: 'concrete', expectedSeconds: 240,
    hints: ['Le mur et le sol forment un angle droit : l’échelle est l’hypoténuse du triangle.', `hauteur² = ${fr(L)}² − ${fr(d)}² = ${fr(L * L)} − ${fr(d * d)}.`, 'Prends la racine carrée et arrondis au centième (centimètre).'],
    solution: `hauteur² = ${fr(L)}² − ${fr(d)}² = ${fr(clean(L * L - d * d))}, donc hauteur = √${fr(clean(L * L - d * d))} ≈ ${fr(H)} m. ${ok ? `${fr(H)} ≥ ${fr(target)} : la gouttière est atteinte.` : `${fr(H)} < ${fr(target)} : la gouttière n’est pas atteinte.`}`,
  });
}

/** ◆ Diagonale d’un écran en cm puis en pouces. */
function pyEcran(rand) {
  const D = pick(rand, [24, 27, 32, 40, 43, 50, 55, 65]); const diag = D * 2.54;
  const W = round((diag * 16) / Math.sqrt(337), 1); const H = round((diag * 9) / Math.sqrt(337), 1);
  const dc = round(Math.sqrt(W * W + H * H), 1); const inch = Math.round(dc / 2.54);
  return problem([
    num(dc, { prompt: 'Longueur de la diagonale de l’écran, en cm (arrondie au dixième) ?', unit: 'cm', unitOptional: true, round: 1, tolerance: 0.051, misconceptions: [mc(clean(W + H), 'mc:pythagore-somme-longueurs', 'notion', 'Le théorème de Pythagore porte sur les carrés des longueurs.'), mc(round(W * W + H * H, 2), 'mc:oubli-racine', 'methode', 'Tu as trouvé le carré de la diagonale : prends la racine carrée.')] }),
    num(inch, { prompt: 'Taille de l’écran, en pouces (arrondie à l’unité) ? Rappel : 1 pouce = 2,54 cm.', unit: 'pouces', unitOptional: true, strictUnit: true, round: 0, misconceptions: [mc(Math.round(dc * 2.54), 'mc:conversion-sens', 'notion', 'Un pouce est plus long qu’un centimètre : le nombre de pouces est plus PETIT que le nombre de centimètres. Divise par 2,54.'), mc(Math.round((W + H) / 2.54), 'mc:pythagore-somme-longueurs', 'notion', 'Utilise la diagonale calculée avec le théorème de Pythagore, pas la somme des côtés.')] }),
  ], {
    prompt: `Un écran rectangulaire mesure ${fr(W)} cm de large et ${fr(H)} cm de haut. La taille d’un écran se donne par la longueur de sa diagonale, en pouces.`,
    representation: 'concrete', expectedSeconds: 240,
    hints: ['La diagonale est l’hypoténuse d’un triangle rectangle dont les côtés de l’angle droit sont la largeur et la hauteur.', `diagonale² = ${fr(W)}² + ${fr(H)}².`, 'Pour convertir en pouces, divise par 2,54.'],
    solution: `diagonale² = ${fr(W)}² + ${fr(H)}² = ${fr(round(W * W + H * H, 2))}, donc diagonale ≈ ${fr(dc)} cm. En pouces : ${fr(dc)} ÷ 2,54 ≈ ${inch} pouces.`,
  });
}

/** ◆ Couper par la diagonale d’un terrain : longueur arrondie, puis distance gagnée. */
function pyTerrain(rand) {
  let L; let l; let d;
  do { L = pick(rand, [25, 30, 35, 40, 45, 50, 60, 80]); l = pick(rand, [12, 15, 18, 20, 24, 28, 32]); d = Math.sqrt(L * L + l * l); } while (l >= L || isRound(d, 1));
  const D = round(d, 1); const gain = round(L + l - D, 1); const who = prenom(rand);
  return problem([
    num(D, { prompt: 'Longueur du trajet en diagonale, en m (arrondie au décimètre) ?', unit: 'm', unitOptional: true, round: 1, tolerance: 0.051, misconceptions: [mc(L + l, 'mc:pythagore-somme-longueurs', 'notion', 'Le théorème de Pythagore porte sur les carrés des longueurs, pas sur les longueurs.'), mc(L * L + l * l, 'mc:oubli-racine', 'methode', 'Tu as trouvé le carré de la diagonale : prends la racine carrée.')] }),
    num(gain, { prompt: 'Combien de mètres économise-t-on en coupant par la diagonale plutôt qu’en longeant deux côtés ? (au décimètre)', unit: 'm', unitOptional: true, round: 1, tolerance: 0.051, misconceptions: [mc(D, 'mc:question-posee', 'lecture', 'C’est la longueur de la diagonale ; la question demande la différence entre les deux trajets.'), mc(round(2 * (L + l) - D, 1), 'mc:perimetre-entier', 'lecture', `Le trajet le long des bords ne fait que deux côtés : ${L} + ${l} = ${L + l} m.`)] }),
  ], {
    prompt: `Un terrain de sport rectangulaire mesure ${L} m sur ${l} m. Pour aller d’un coin au coin opposé, ${who} hésite entre longer deux côtés du terrain ou le traverser en diagonale.`,
    representation: 'concrete', expectedSeconds: 240,
    hints: ['La diagonale est l’hypoténuse d’un triangle rectangle dont les côtés de l’angle droit sont la longueur et la largeur.', `diagonale² = ${L}² + ${l}² = ${L * L} + ${l * l}.`, `Trajet le long des bords : ${L} + ${l} = ${L + l} m ; compare.`],
    solution: `diagonale² = ${L}² + ${l}² = ${L * L + l * l}, donc diagonale ≈ ${fr(D)} m. Le long des bords : ${L + l} m. Gain : ${L + l} − ${fr(D)} ≈ ${fr(gain)} m.`,
  });
}

const TRIPLES_R = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [12, 35, 37], [9, 40, 41], [28, 45, 53], [33, 56, 65], [65, 72, 97], [11, 60, 61], [16, 63, 65], [48, 55, 73], [36, 77, 85], [39, 80, 89]];

/** ✦ Réciproque (ou contraposée) : le triangle est-il rectangle ? */
function pyReciproque(rand) {
  const [X, Y, Z] = pick(rand, TRI_NAMES).split('');
  let a; let b; let c;
  do { [a, b, c] = scaled(rand, [0.1, 0.2, 0.5, 1], 20, TRIPLES_R); } while (c < 4);
  const right = rand() < 0.5;
  const step = [a, b, c].every((x) => Number.isInteger(x)) ? 1 : 0.1;
  const down = clean(c - step) > Math.max(a, b) && rand() < 0.5;
  const c2 = right ? c : clean(c + (down ? -step : step));
  const S = clean(sq(a) + sq(b)); const C2 = sq(c2);
  // « proches » seulement si l'écart est faible (au plus 10 %) : 36 et 25 sont seulement différents
  const close = Math.abs(C2 - S) <= 0.1 * S;
  const notRight = close
    ? `Les deux nombres sont proches mais différents (${fr(C2)} ≠ ${fr(S)}) : le triangle n’est pas rectangle. Un dessin peut tromper, seul le calcul permet de conclure.`
    : `Les deux nombres sont différents (${fr(C2)} ≠ ${fr(S)}) : s’il était rectangle, ils seraient égaux d’après le théorème de Pythagore. Le triangle n’est donc pas rectangle.`;
  const sides = sample(rand, [`${X}${Y} = ${fr(a)} cm`, `${Y}${Z} = ${fr(b)} cm`, `${X}${Z} = ${fr(c2)} cm`]);
  const parts = [
    num(C2, { prompt: 'Calcule le carré de la longueur du plus grand côté.', misconceptions: [mc(sq(a), 'mc:plus-grand-cote', 'methode', 'Repère d’abord le plus grand côté : c’est le seul qui peut être l’hypoténuse.'), mc(sq(b), 'mc:plus-grand-cote', 'methode', 'Repère d’abord le plus grand côté : c’est le seul qui peut être l’hypoténuse.'), mc(clean(2 * c2), 'mc:carre-double', 'calcul', 'Le carré d’un nombre, c’est ce nombre multiplié par lui-même (et non par 2).')] }),
    num(S, { prompt: 'Calcule la somme des carrés des longueurs des deux autres côtés.', misconceptions: [mc(sq(a + b), 'mc:carre-somme', 'calcul', '(a + b)² n’est pas égal à a² + b² : calcule chaque carré, puis additionne.'), mc(clean(sq(a) + C2), 'mc:plus-grand-cote', 'methode', 'On additionne les carrés des deux PETITS côtés, et on compare au carré du plus grand.')] }),
    yesNo(right, `Le triangle ${X}${Y}${Z} est-il rectangle ? (oui ou non)`, right ? 'mc:reciproque-pythagore' : 'mc:presque-egal', 'raisonnement', right ? 'Les deux nombres sont égaux : d’après la réciproque du théorème de Pythagore, le triangle est rectangle.' : notRight),
  ];
  if (right) parts.push(text([Y, `en ${Y}`], { prompt: 'En quel sommet est l’angle droit ? (une lettre)', misconceptions: [X, Z].map((L) => mc(L, 'mc:sommet-angle-droit', 'notion', `L’angle droit est en face du plus grand côté [${X}${Z}] : c’est le sommet qui n’appartient pas à ce côté.`)) }));
  const concl = right
    ? `Dans le triangle ${X}${Y}${Z}, ${X}${Z}² = ${fr(C2)} et ${X}${Y}² + ${Y}${Z}² = ${fr(S)}. Ces deux résultats sont égaux, donc d’après la réciproque du théorème de Pythagore, le triangle est rectangle en ${Y}.`
    : `Dans le triangle ${X}${Y}${Z}, ${X}${Z}² = ${fr(C2)} et ${X}${Y}² + ${Y}${Z}² = ${fr(S)}. Ces deux résultats sont différents ; s’il était rectangle, ils seraient égaux d’après le théorème de Pythagore : le triangle n’est donc pas rectangle.`;
  return problem(parts, {
    prompt: `Un triangle ${X}${Y}${Z} a pour côtés : ${sides.join(', ')}.`,
    representation: 'symbolique', expectedSeconds: 330,
    hints: ['Repère le plus grand côté : s’il y a un angle droit, il est en face de ce côté.', 'Calcule séparément le carré du plus grand côté et la somme des carrés des deux autres.', 'Égalité : le triangle est rectangle (réciproque) ; sinon, il ne l’est pas.'],
    solution: concl,
    justify: { prompt: 'Rédige la conclusion en citant la propriété utilisée.', minWords: 10, keywords: [['réciproque', 'pythagore'], ['carré', 'égal', 'différent']], example: concl },
  });
}

const CHAINS = [[3, 4, 5, 12, 13], [6, 8, 10, 24, 26], [9, 12, 15, 8, 17], [9, 12, 15, 20, 25], [12, 16, 20, 21, 29], [12, 16, 20, 15, 25], [15, 20, 25, 60, 65], [7, 24, 25, 60, 65], [12, 9, 15, 36, 39], [16, 12, 20, 48, 52], [8, 6, 10, 24, 26], [5, 12, 13, 84, 85]];

/** ✦ Figure composée : deux triangles rectangles qui partagent un côté. */
function pyChaine(rand) {
  let ch; let k;
  do { ch = pick(rand, CHAINS); k = pick(rand, [0.2, 0.5, 1, 1.5, 2]); } while (Math.max(...ch) * k > 30 || Math.min(...ch) * k < 1);
  const [ab, bc, ac, cd, ad] = ch.map((x) => clean(x * k));
  const [A, B, C, D] = pick(rand, ['ABCD', 'EFGH', 'MNPQ', 'RSTU']).split('');
  const per = clean(ab + bc + cd + ad);
  const ux = ab / ac; const uy = bc / ac; const Dp = [bc + cd * ux, cd * uy];
  return problem([
    num(ac, { prompt: `Calcule ${A}${C}.`, unit: 'cm', unitOptional: true, misconceptions: [mc(clean(ab + bc), 'mc:pythagore-somme-longueurs', 'notion', 'Le théorème de Pythagore porte sur les carrés des longueurs.'), mc(clean(sq(ab) + sq(bc)), 'mc:oubli-racine', 'methode', `Tu as trouvé ${A}${C}² : prends la racine carrée.`)] }),
    num(ad, { prompt: `Calcule ${A}${D}.`, unit: 'cm', unitOptional: true, tolerance: 0.01, misconceptions: [mc(clean(ac + cd), 'mc:pythagore-somme-longueurs', 'notion', 'Le théorème de Pythagore porte sur les carrés des longueurs.'), mc(clean(sq(ac) + sq(cd)), 'mc:oubli-racine', 'methode', `Tu as trouvé ${A}${D}² : prends la racine carrée.`), mc(round(Math.sqrt(sq(bc) + sq(cd)), 2), 'mc:mauvais-triangle', 'methode', `Dans le triangle ${A}${C}${D} rectangle en ${C}, les côtés de l’angle droit sont [${A}${C}] et [${C}${D}] : utilise ${A}${C}, que tu viens de calculer.`)] }),
    num(per, { prompt: `Calcule le périmètre du quadrilatère ${A}${B}${C}${D}.`, unit: 'cm', unitOptional: true, misconceptions: [mc(clean(per + ac), 'mc:diagonale-perimetre', 'notion', `[${A}${C}] est à l’intérieur du quadrilatère : ce n’est pas un de ses côtés.`), mc(clean(ab + bc + cd), 'mc:cote-oublie', 'methode', `Le quadrilatère a quatre côtés : n’oublie pas [${A}${D}].`)] }),
  ], {
    prompt: `Dans la figure, le triangle ${A}${B}${C} est rectangle en ${B} et le triangle ${A}${C}${D} est rectangle en ${C}. On sait que ${A}${B} = ${fr(ab)} cm, ${B}${C} = ${fr(bc)} cm et ${C}${D} = ${fr(cd)} cm.`,
    figure: { alt: `Quadrilatère ${A}${B}${C}${D} formé de deux triangles rectangles, ${A}${B}${C} en ${B} et ${A}${C}${D} en ${C}`, frame: frameAround([[0, 0], [0, ab], [bc, 0], Dp]), items: [pt(A, 0, ab, 'nw'), pt(B, 0, 0, 'sw'), pt(C, bc, 0, 'se'), pt(D, Dp[0], Dp[1], 'ne'), { type: 'polygon', points: [A, B, C, D], fill: 'maths' }, { type: 'segment', from: A, to: B, label: `${fr(ab)} cm` }, { type: 'segment', from: B, to: C, label: `${fr(bc)} cm` }, { type: 'segment', from: C, to: D, label: `${fr(cd)} cm` }, { type: 'segment', from: A, to: C, dashed: true }, { type: 'angle', vertex: B, from: A, to: C, right: true }, { type: 'angle', vertex: C, from: A, to: D, right: true }] },
    representation: 'visuelle', expectedSeconds: 330,
    hints: [`Commence par le triangle ${A}${B}${C} : son hypoténuse est [${A}${C}].`, `Puis dans ${A}${C}${D}, rectangle en ${C}, l’hypoténuse est [${A}${D}] : ${A}${D}² = ${A}${C}² + ${C}${D}².`, `Le périmètre ne compte que les quatre côtés : ${A}${B} + ${B}${C} + ${C}${D} + ${D}${A}.`],
    solution: `${A}${C}² = ${fr(ab)}² + ${fr(bc)}² = ${fr(clean(sq(ab) + sq(bc)))}, donc ${A}${C} = ${fr(ac)} cm. ${A}${D}² = ${fr(ac)}² + ${fr(cd)}² = ${fr(clean(sq(ac) + sq(cd)))}, donc ${A}${D} = ${fr(ad)} cm. Périmètre : ${fr(ab)} + ${fr(bc)} + ${fr(cd)} + ${fr(ad)} = ${fr(per)} cm.`,
  });
}

/** ✦ Triangle isocèle : hauteur (pied au milieu de la base) puis aire. */
function pyIsocele(rand) {
  const [A, B, C] = pick(rand, ['ABC', 'DEF', 'RST', 'KLM', 'IJK']).split('');
  let [bh, ah, ab] = scaled(rand, [0.5, 1, 1.5, 2, 0.2], 30);
  if (rand() < 0.5) [bh, ah] = [ah, bh];
  const bc = clean(2 * bh); const area = clean((bc * ah) / 2);
  const mis1 = [mc(clean(sq(ab) - sq(bh)), 'mc:oubli-racine', 'methode', `Tu as trouvé ${A}H² : prends la racine carrée.`), mc(round(Math.sqrt(sq(ab) + sq(bh)), 2), 'mc:pythagore-cote-somme', 'notion', `[${A}${B}] est l’hypoténuse du triangle ${A}${B}H : ${A}H² = ${A}${B}² − ${B}H².`)];
  if (ab > bc) mis1.unshift(mc(round(Math.sqrt(sq(ab) - sq(bc)), 2), 'mc:moitie-base', 'methode', `H est le milieu de [${B}${C}] : dans le triangle ${A}${B}H, le côté ${B}H mesure la moitié de ${B}${C}, soit ${fr(bh)} cm.`));
  return problem([
    num(ah, { prompt: `Calcule la hauteur ${A}H.`, unit: 'cm', unitOptional: true, tolerance: 0.01, misconceptions: mis1 }),
    num(area, { prompt: `Calcule l’aire du triangle ${A}${B}${C}.`, unit: 'cm²', unitOptional: true, misconceptions: [mc(clean(bc * ah), 'mc:aire-triangle-moitie', 'methode', 'Aire d’un triangle : base × hauteur ÷ 2.'), mc(clean((bh * ah) / 2), 'mc:aire-demi-triangle', 'lecture', `C’est l’aire du triangle ${A}${B}H, la moitié seulement du triangle ${A}${B}${C}.`), mc(clean((ab * bc) / 2), 'mc:hauteur-cote', 'notion', `La hauteur issue de ${A} est [${A}H], perpendiculaire à la base, pas le côté [${A}${B}].`)] }),
  ], {
    prompt: `Le triangle ${A}${B}${C} est isocèle en ${A} : ${A}${B} = ${A}${C} = ${fr(ab)} cm et ${B}${C} = ${fr(bc)} cm. H est le milieu de [${B}${C}] ; la droite (${A}H) est perpendiculaire à (${B}${C}).`,
    figure: { alt: `Triangle ${A}${B}${C} isocèle en ${A}, avec le milieu H de la base [${B}${C}]`, frame: frameAround([[-bh, 0], [bh, 0], [0, ah]]), items: [pt(A, 0, ah, 'n'), pt(B, -bh, 0, 'sw'), pt(C, bh, 0, 'se'), pt('H', 0, 0, 's'), { type: 'polygon', points: [A, B, C], fill: 'maths' }, { type: 'segment', from: A, to: B, label: `${fr(ab)} cm`, marks: 1 }, { type: 'segment', from: A, to: C, marks: 1 }, { type: 'segment', from: A, to: 'H', dashed: true }, { type: 'angle', vertex: 'H', from: C, to: A, right: true }] },
    representation: 'visuelle', expectedSeconds: 300,
    hints: [`H est le milieu de [${B}${C}] : ${B}H = ${fr(bc)} ÷ 2 = ${fr(bh)} cm.`, `Le triangle ${A}${B}H est rectangle en H, d’hypoténuse [${A}${B}] : ${A}H² = ${A}${B}² − ${B}H².`, 'Aire du triangle : base × hauteur ÷ 2.'],
    solution: `${B}H = ${fr(bh)} cm. Dans ${A}${B}H rectangle en H : ${A}H² = ${fr(ab)}² − ${fr(bh)}² = ${fr(sq(ab))} − ${fr(sq(bh))} = ${fr(clean(sq(ab) - sq(bh)))}, donc ${A}H = ${fr(ah)} cm. Aire : ${fr(bc)} × ${fr(ah)} ÷ 2 = ${fr(area)} cm².`,
  });
}

/** ✦ Losange : demi-diagonale par Pythagore, diagonale, aire. */
function pyLosange(rand) {
  const [A, B, C, D] = pick(rand, ['ABCD', 'EFGH', 'MNPQ', 'RSTU']).split('');
  let [oa, ob, c] = scaled(rand, [0.5, 1, 1.5, 0.2], 25);
  if (rand() < 0.5) [oa, ob] = [ob, oa];
  const ac = clean(2 * oa); const bd = clean(2 * ob); const area = clean((ac * bd) / 2);
  const mis1 = [mc(clean(sq(c) - sq(oa)), 'mc:oubli-racine', 'methode', `Tu as trouvé O${B}² : prends la racine carrée.`), mc(round(Math.sqrt(sq(c) + sq(oa)), 2), 'mc:pythagore-cote-somme', 'notion', `[${A}${B}] est l’hypoténuse du triangle ${A}O${B} : O${B}² = ${A}${B}² − O${A}².`)];
  if (c > ac) mis1.unshift(mc(round(Math.sqrt(sq(c) - sq(ac)), 2), 'mc:moitie-diagonale', 'methode', `Les diagonales se coupent en leur milieu : O${A} = ${fr(ac)} ÷ 2 = ${fr(oa)} cm.`));
  return problem([
    num(ob, { prompt: `Calcule O${B}.`, unit: 'cm', unitOptional: true, tolerance: 0.01, misconceptions: mis1 }),
    num(bd, { prompt: `Calcule la longueur de la diagonale [${B}${D}].`, unit: 'cm', unitOptional: true, misconceptions: [mc(ob, 'mc:demi-diagonale', 'methode', `O${B} n’est que la moitié de [${B}${D}] : O est le milieu de la diagonale.`)] }),
    num(area, { prompt: `Calcule l’aire du losange ${A}${B}${C}${D}.`, unit: 'cm²', unitOptional: true, misconceptions: [mc(clean(ac * bd), 'mc:aire-losange', 'methode', 'Aire d’un losange : (grande diagonale × petite diagonale) ÷ 2.'), mc(sq(c), 'mc:aire-carre', 'notion', 'Un losange n’est pas un carré : son aire n’est pas côté × côté.')] }),
  ], {
    prompt: `${A}${B}${C}${D} est un losange de centre O et de côté ${fr(c)} cm. Sa diagonale [${A}${C}] mesure ${fr(ac)} cm.`,
    figure: { alt: `Losange ${A}${B}${C}${D} de centre O et ses diagonales`, frame: frameAround([[-oa, 0], [oa, 0], [0, ob], [0, -ob]]), items: [pt(A, -oa, 0, 'w'), pt(B, 0, ob, 'n'), pt(C, oa, 0, 'e'), pt(D, 0, -ob, 's'), pt('O', 0, 0, 'se'), { type: 'polygon', points: [A, B, C, D], fill: 'maths' }, { type: 'segment', from: A, to: B, label: `${fr(c)} cm` }, { type: 'segment', from: A, to: C, dashed: true }, { type: 'segment', from: B, to: D, dashed: true }, { type: 'angle', vertex: 'O', from: C, to: B, right: true }] },
    representation: 'visuelle', expectedSeconds: 300,
    hints: ['Les diagonales d’un losange sont perpendiculaires et se coupent en leur milieu O.', `Le triangle ${A}O${B} est rectangle en O, avec O${A} = ${fr(oa)} cm et ${A}${B} = ${fr(c)} cm.`, 'Aire d’un losange : produit des diagonales ÷ 2.'],
    solution: `O${A} = ${fr(ac)} ÷ 2 = ${fr(oa)} cm. Dans ${A}O${B} rectangle en O : O${B}² = ${fr(c)}² − ${fr(oa)}² = ${fr(clean(sq(c) - sq(oa)))}, donc O${B} = ${fr(ob)} cm et ${B}${D} = ${fr(bd)} cm. Aire : ${fr(ac)} × ${fr(bd)} ÷ 2 = ${fr(area)} cm².`,
  });
}

/** ✦ L’échelle qui glisse : le haut ne descend pas d’autant que le pied recule. */
function pyEchelleGlisse(rand) {
  let L; let d1; let e; let d2; let H1; let H2; let desc;
  do {
    L = pick(rand, [3, 3.5, 4, 4.5, 5, 6]); d1 = pick(rand, [0.6, 0.8, 1, 1.2, 1.4, 1.5]); e = pick(rand, [0.3, 0.4, 0.5, 0.6, 0.8, 1, 1.2]);
    d2 = clean(d1 + e); H1 = round(Math.sqrt(L * L - d1 * d1), 2); H2 = round(Math.sqrt(L * L - d2 * d2), 2); desc = round(H1 - H2, 2);
  } while (d2 > L - 0.8 || Math.abs(desc - e) < 0.08);
  return problem([
    num(H1, { prompt: 'Hauteur atteinte au départ, en m (au centimètre près) ?', unit: 'm', unitOptional: true, round: 2, tolerance: 0.0051, misconceptions: [mc(round(Math.sqrt(L * L + d1 * d1), 2), 'mc:pythagore-cote-somme', 'notion', 'L’échelle est l’hypoténuse : hauteur² = échelle² − distance².'), mc(clean(L - d1), 'mc:soustraire-longueurs', 'notion', 'On soustrait les carrés des longueurs, pas les longueurs.')] }),
    num(H2, { prompt: 'Hauteur atteinte après le glissement, en m (au centimètre près) ?', unit: 'm', unitOptional: true, round: 2, tolerance: 0.0051, misconceptions: [mc(round(H1 - e, 2), 'mc:glissement-egal', 'raisonnement', 'Le haut de l’échelle ne descend pas d’autant que le pied recule : refais le calcul avec la nouvelle distance au mur.'), mc(round(Math.sqrt(L * L - e * e), 2), 'mc:distance-pied', 'lecture', `Le pied est maintenant à ${fr(d1)} + ${fr(e)} = ${fr(d2)} m du mur.`)] }),
    num(desc, { prompt: 'De combien le haut de l’échelle est-il descendu, en m ?', unit: 'm', unitOptional: true, round: 2, tolerance: 0.011, misconceptions: [mc(e, 'mc:glissement-egal', 'raisonnement', `Le pied a reculé de ${fr(e)} m, mais le haut descend de ${fr(desc)} m seulement : les deux déplacements ne sont pas égaux.`)] }),
  ], {
    prompt: `Une échelle de ${fr(L)} m est appuyée contre un mur vertical, son pied à ${fr(d1)} m du mur. Le pied de l’échelle glisse et s’éloigne du mur de ${fr(e)} m de plus.`,
    representation: 'concrete', expectedSeconds: 360,
    hints: ['Dans chaque position, l’échelle est l’hypoténuse d’un triangle rectangle (mur, sol, échelle).', `Après le glissement, le pied est à ${fr(d1)} + ${fr(e)} = ${fr(d2)} m du mur.`, 'La descente est la différence des deux hauteurs.'],
    solution: `Au départ : h² = ${fr(L)}² − ${fr(d1)}² = ${fr(clean(L * L - d1 * d1))}, h ≈ ${fr(H1)} m. Après : h² = ${fr(L)}² − ${fr(d2)}² = ${fr(clean(L * L - d2 * d2))}, h ≈ ${fr(H2)} m. Le haut descend de ${fr(H1)} − ${fr(H2)} = ${fr(desc)} m, alors que le pied a reculé de ${fr(e)} m.`,
  });
}

/** ✦ Défi : la grande diagonale d’un pavé (Pythagore deux fois). */
function pyPave(rand) {
  let L; let l; let h; let d; let Dg; let rod; let fits;
  do {
    L = pick(rand, [40, 45, 50, 60, 80]); l = pick(rand, [20, 25, 30, 35]); h = pick(rand, [15, 20, 25, 30, 40]);
    d = Math.sqrt(L * L + l * l); Dg = Math.sqrt(L * L + l * l + h * h); fits = rand() < 0.5;
    rod = fits ? Math.floor(Dg) - ri(rand, 0, 2) : Math.ceil(Dg) + ri(rand, 1, 3);
  } while (rod - Dg > -0.5 && rod - Dg < 0.5 || (fits && rod < d + 1.5));
  const D1 = round(d, 1); const D2 = round(Dg, 1);
  return problem([
    num(D1, { prompt: 'Longueur de la diagonale du fond de la boîte, en cm (arrondie au dixième) ?', unit: 'cm', unitOptional: true, round: 1, tolerance: 0.051, misconceptions: [mc(L + l, 'mc:pythagore-somme-longueurs', 'notion', 'Le théorème de Pythagore porte sur les carrés des longueurs.'), mc(L * L + l * l, 'mc:oubli-racine', 'methode', 'Tu as trouvé le carré de la diagonale : prends la racine carrée.')] }),
    num(D2, { prompt: 'Longueur de la grande diagonale de la boîte (d’un coin du fond au coin opposé du couvercle), en cm (au dixième) ?', unit: 'cm', unitOptional: true, round: 1, tolerance: 0.11, misconceptions: [mc(round(d + h, 1), 'mc:pythagore-somme-longueurs', 'notion', 'Utilise encore le théorème de Pythagore, avec les carrés : grande diagonale² = diagonale du fond² + hauteur².'), mc(round(Math.sqrt(L * L + h * h), 1), 'mc:diagonale-face', 'methode', 'C’est la diagonale d’une face latérale : la grande diagonale s’appuie sur la diagonale du fond et sur la hauteur.')] }),
    yesNo(fits, `Une baguette rigide de ${rod} cm peut-elle tenir entièrement dans la boîte fermée ? (oui ou non)`, 'mc:baguette-pave', 'raisonnement', fits ? `La baguette est plus longue que la diagonale du fond (${fr(D1)} cm), mais plus courte que la grande diagonale (${fr(D2)} cm) : placée en biais, elle tient.` : `Même la plus grande longueur disponible, la grande diagonale (${fr(D2)} cm), est plus courte que la baguette.`),
  ], {
    prompt: `Défi (au-delà du programme : il suffit d’utiliser deux fois le théorème de Pythagore). Une boîte en forme de pavé droit mesure ${L} cm de long, ${l} cm de large et ${h} cm de haut.`,
    representation: 'visuelle', expectedSeconds: 420,
    hints: ['Le fond de la boîte est un rectangle : sa diagonale est l’hypoténuse d’un triangle rectangle.', 'La diagonale du fond, la hauteur et la grande diagonale forment un autre triangle rectangle (la hauteur est verticale).', `grande diagonale² = diagonale du fond² + ${h}².`],
    solution: `Fond : d² = ${L}² + ${l}² = ${L * L + l * l}, d ≈ ${fr(D1)} cm. Grande diagonale : D² = d² + ${h}² = ${L * L + l * l} + ${h * h} = ${L * L + l * l + h * h}, D ≈ ${fr(D2)} cm. Baguette de ${rod} cm : ${fits ? `elle tient (${rod} < ${fr(D2)})` : `elle ne tient pas (${rod} > ${fr(D2)})`}.`,
  });
}

/* ======================================================================= */
/*                               Conversions                               */
/* ======================================================================= */

const AIRES = ['km²', 'hm²', 'dam²', 'm²', 'dm²', 'cm²', 'mm²'];
const VOLS = ['m³', 'dm³', 'cm³', 'mm³'];

/** ◆ Conversion d’aires (base 100) ou de volumes (base 1 000). */
function convPuissance(rand, units, base) {
  let i; let j; let v; let ans;
  do {
    i = ri(rand, 0, units.length - 1); j = ri(rand, Math.max(0, i - 2), Math.min(units.length - 1, i + 2));
    v = clean(ri(rand, 1, 999) / 10 ** ri(rand, 0, 2)); ans = clean(v * base ** (j - i));
  } while (i === j || ans < 0.001 || ans > 1e7);
  const from = units[i]; const to = units[j]; const steps = j - i; const factor = clean(base ** steps);
  const aire = base === 100;
  const mcs = [
    mc(clean(v * 10 ** steps), aire ? 'mc:conversion-aire-lineaire' : 'mc:conversion-volume-lineaire', 'notion', aire ? 'Pour les aires, on change de 100 à chaque unité (1 m² = 100 dm²), pas de 10 : deux chiffres par colonne.' : 'Pour les volumes, on change de 1 000 à chaque unité (1 m³ = 1 000 dm³) : trois chiffres par colonne.'),
    mc(clean(v / factor), 'mc:conversion-sens', 'notion', `Passer de ${from} à ${to} : l’unité d’arrivée est ${steps > 0 ? 'plus petite, le nombre doit donc être plus grand' : 'plus grande, le nombre doit donc être plus petit'}.`),
  ];
  if (!aire) mcs.push(mc(clean(v * 100 ** steps), 'mc:conversion-volume-aire', 'notion', 'C’est pour les aires qu’on change de 100 à chaque unité ; pour les volumes, c’est 1 000.'));
  return num(ans, {
    prompt: `Convertis : ${fr(v)} ${from} = … ${to}`, unit: to, unitOptional: true, strictUnit: true, representation: 'symbolique', expectedSeconds: 90,
    misconceptions: mcs,
    hints: [aire ? '1 m² = 100 dm² = 10 000 cm² : dans le tableau des aires, chaque unité a deux colonnes.' : '1 m³ = 1 000 dm³ = 1 000 000 cm³ : dans le tableau des volumes, chaque unité a trois colonnes.', `De ${from} à ${to}, il y a ${Math.abs(steps)} rang${Math.abs(steps) > 1 ? 's' : ''} : 1 ${from} = ${fr(factor)} ${to}.`],
    solution: `1 ${from} = ${fr(factor)} ${to}, donc ${fr(v)} ${from} = ${fr(v)} × ${fr(factor)} = ${fr(ans)} ${to}.`,
  });
}

/** ◆ Aire d’un rectangle dont les côtés sont dans deux unités différentes. */
function convAireRectangle(rand) {
  const Lm = pick(rand, [0.6, 0.8, 1.2, 1.5, 2.4, 3]); const lcm = pick(rand, [15, 25, 35, 40, 45, 60]);
  const ans = clean(Lm * 100 * lcm); const obj = pick(rand, ['Une bande de tissu', 'Une étagère', 'Une affiche', 'Un tapis']);
  return num(ans, {
    prompt: `${obj} rectangulaire mesure ${fr(Lm)} m de long et ${lcm} cm de large. Quelle est son aire, en cm² ?`,
    unit: 'cm²', unitOptional: true, strictUnit: true, representation: 'concrete', expectedSeconds: 120,
    misconceptions: [
      mc(clean(Lm * lcm), 'mc:unites-melangees', 'unite', `Les deux longueurs doivent être dans la même unité : ${fr(Lm)} m = ${fr(Lm * 100)} cm.`),
      mc(clean((Lm * lcm) / 100), 'mc:unite-demandee', 'lecture', 'Ce nombre est l’aire en m² ; la question la demande en cm² (1 m² = 10 000 cm²).'),
      mc(clean(2 * (Lm * 100 + lcm)), 'mc:aire-perimetre', 'notion', 'Tu as calculé le périmètre ; l’aire d’un rectangle est longueur × largeur.'),
    ],
    hints: [`Convertis la longueur : ${fr(Lm)} m = ${fr(Lm * 100)} cm.`, 'Aire d’un rectangle : longueur × largeur.'],
    solution: `${fr(Lm)} m = ${fr(Lm * 100)} cm ; aire = ${fr(Lm * 100)} × ${lcm} = ${fr(ans)} cm².`,
  });
}

/** ◆ Somme de longueurs exprimées en m, cm et mm. */
function convLongueurSomme(rand) {
  let m; let cm; let mm; let ans;
  do {
    m = pick(rand, [0.85, 1.2, 1.6, 1.75, 2.4, 3.05]); cm = pick(rand, [35, 48, 64, 75, 92, 120]); mm = pick(rand, [85, 150, 250, 450, 600, 1250]);
    ans = clean(m * 100 + cm + mm / 10);
  } while (!distinct(ans, [clean(m + cm + mm), clean(m * 10 + cm + mm / 10), clean(m * 100 + cm + mm)]));
  const who = prenom(rand);
  return num(ans, {
    prompt: `Pour une guirlande, ${who} attache bout à bout trois morceaux de ficelle : ${fr(m)} m, ${cm} cm et ${fr(mm)} mm. Quelle est la longueur totale, en cm ?`,
    unit: 'cm', unitOptional: true, strictUnit: true, representation: 'concrete', expectedSeconds: 120,
    misconceptions: [
      mc(clean(m + cm + mm), 'mc:unites-melangees', 'unite', 'On n’additionne que des longueurs exprimées dans la même unité : convertis d’abord tout en cm.'),
      mc(clean(m * 10 + cm + mm / 10), 'mc:conversion-facteur', 'notion', '1 m = 100 cm (et non 10 cm).'),
      mc(clean(m * 100 + cm + mm), 'mc:conversion-oubliee', 'unite', `${fr(mm)} mm = ${fr(mm / 10)} cm : convertis aussi les millimètres.`),
    ],
    hints: ['1 m = 100 cm et 1 cm = 10 mm.', `${fr(m)} m = ${fr(m * 100)} cm ; ${fr(mm)} mm = ${fr(mm / 10)} cm.`, 'Additionne ensuite les trois longueurs en cm.'],
    solution: `${fr(m)} m = ${fr(m * 100)} cm ; ${fr(mm)} mm = ${fr(mm / 10)} cm. Total : ${fr(m * 100)} + ${cm} + ${fr(mm / 10)} = ${fr(ans)} cm.`,
  });
}

/** ◆ Périmètre d’un rectangle dont les côtés sont dans deux unités différentes. */
function convPerimetre(rand) {
  let L; let l; let ans;
  do { L = pick(rand, [0.6, 0.8, 1.2, 1.5, 2.4, 3]); l = pick(rand, [15, 25, 35, 40, 45, 60]); ans = clean(2 * (L * 100 + l)); }
  while (!distinct(ans, [clean(2 * (L + l)), clean(L * 100 + l), clean(2 * (L * 10 + l)), clean(L * 100 * l)]));
  const obj = pick(rand, ['Un cadre', 'Une nappe', 'Un panneau', 'Un tapis']);
  return num(ans, {
    prompt: `${obj} rectangulaire mesure ${fr(L)} m de long et ${l} cm de large. Quel est son périmètre, en cm ?`,
    unit: 'cm', unitOptional: true, strictUnit: true, representation: 'concrete', expectedSeconds: 120,
    misconceptions: [
      mc(clean(2 * (L + l)), 'mc:unites-melangees', 'unite', `Les deux longueurs doivent être dans la même unité : ${fr(L)} m = ${fr(L * 100)} cm.`),
      mc(clean(L * 100 + l), 'mc:perimetre-moitie', 'methode', 'Le périmètre fait le tour complet : il compte deux longueurs et deux largeurs.'),
      mc(clean(2 * (L * 10 + l)), 'mc:conversion-facteur', 'notion', '1 m = 100 cm (et non 10 cm).'),
      mc(clean(L * 100 * l), 'mc:aire-perimetre', 'notion', 'Tu as calculé l’aire ; le périmètre est la longueur du tour : 2 × (longueur + largeur).'),
    ],
    hints: [`Convertis la longueur : ${fr(L)} m = ${fr(L * 100)} cm.`, 'Périmètre d’un rectangle : 2 × (longueur + largeur).'],
    solution: `${fr(L)} m = ${fr(L * 100)} cm ; périmètre = 2 × (${fr(L * 100)} + ${l}) = ${fr(ans)} cm.`,
  });
}

/** ◆ Somme de masses exprimées en t, kg et g. */
function convMasseSomme(rand) {
  const t = pick(rand, [0.8, 1.2, 1.5, 2.5, 3.05, 1.75]); const kg = ri(rand, 12, 950); const g = pick(rand, [250, 500, 750, 800, 1200, 1500, 2500]);
  const ans = clean(t * 1000 + kg + g / 1000);
  return num(ans, {
    prompt: `Un camion transporte une machine de ${fr(t)} t, une caisse de ${kg} kg et un colis de ${fr(g)} g. Quelle est la masse totale du chargement, en kg ?`,
    unit: 'kg', unitOptional: true, strictUnit: true, representation: 'concrete', expectedSeconds: 120,
    misconceptions: [
      mc(clean(t + kg + g), 'mc:unites-melangees', 'unite', 'On n’additionne que des masses exprimées dans la même unité : convertis d’abord tout en kg.'),
      mc(clean(t * 100 + kg + g / 1000), 'mc:tonne-100', 'notion', '1 t = 1 000 kg (et non 100 kg).'),
      mc(clean(t * 1000 + kg + g), 'mc:conversion-oubliee', 'unite', `${fr(g)} g = ${fr(g / 1000)} kg : convertis aussi les grammes.`),
    ],
    hints: ['1 t = 1 000 kg et 1 kg = 1 000 g.', `${fr(t)} t = ${fr(t * 1000)} kg ; ${fr(g)} g = ${fr(g / 1000)} kg.`, 'Additionne ensuite les trois masses en kg.'],
    solution: `${fr(t)} t = ${fr(t * 1000)} kg ; ${fr(g)} g = ${fr(g / 1000)} kg. Total : ${fr(t * 1000)} + ${kg} + ${fr(g / 1000)} = ${fr(ans)} kg.`,
  });
}

/** ◆ Grammes → milligrammes avec une multiplication. */
function convMasseMg(rand) {
  const dose = pick(rand, [0.05, 0.1, 0.2, 0.25, 0.5, 1]); const n = pick(rand, [12, 16, 20, 24, 30]);
  const ans = clean(dose * 1000 * n);
  return num(ans, {
    prompt: `Un comprimé contient ${fr(dose)} g de vitamine C. Quelle masse de vitamine C, en mg, contient une boîte de ${n} comprimés ?`,
    unit: 'mg', unitOptional: true, strictUnit: true, representation: 'concrete', expectedSeconds: 120,
    misconceptions: [
      mc(clean(dose * n), 'mc:conversion-oubliee', 'unite', 'Ce nombre est la masse en g : la question la demande en mg (1 g = 1 000 mg).'),
      mc(clean(dose * 100 * n), 'mc:conversion-facteur', 'notion', '1 g = 1 000 mg : trois rangs dans le tableau (g, dg, cg, mg).'),
      mc(clean(dose * 1000), 'mc:oubli-quantite', 'lecture', `C’est la masse pour un seul comprimé ; la boîte en contient ${n}.`),
    ],
    hints: [`Masse pour la boîte : ${n} × ${fr(dose)} g.`, '1 g = 1 000 mg.'],
    solution: `${n} × ${fr(dose)} = ${fr(dose * n)} g = ${fr(dose * n)} × 1 000 = ${fr(ans)} mg.`,
  });
}

const CROSS = [['dm³', 'cL', 100, 1], ['cm³', 'cL', 0.1, 1], ['L', 'cm³', 1000, 100], ['m³', 'L', 1000, 1], ['dm³', 'mL', 1000, 1], ['cL', 'cm³', 10, 1], ['hL', 'm³', 0.1, 100], ['dL', 'cm³', 100, 10]];

/** ◆ Contenances ↔ volumes (1 L = 1 dm³, 1 mL = 1 cm³). */
function convContenanceVolume(rand) {
  const c = pick(rand, CROSS); const rev = rand() < 0.5;
  const [from, to, factor, wrong] = rev ? [c[1], c[0], 1 / c[2], 1 / c[3]] : c;
  let v; let ans;
  do { v = clean(ri(rand, 1, 999) / 10 ** ri(rand, 0, 2)); ans = clean(v * factor); } while (ans < 0.001 || ans > 1e6);
  return num(ans, {
    prompt: `Convertis : ${fr(v)} ${from} = … ${to}`, unit: to, unitOptional: true, strictUnit: true, representation: 'symbolique', expectedSeconds: 90,
    misconceptions: [
      mc(clean(v / factor), 'mc:conversion-sens', 'notion', `L’unité d’arrivée est ${factor > 1 ? 'plus petite : le nombre doit être plus grand' : 'plus grande : le nombre doit être plus petit'}.`),
      mc(clean(v * wrong), 'mc:equivalence-litre', 'notion', 'Rappel : 1 L = 1 dm³ et 1 mL = 1 cm³ ; 1 L = 100 cL = 1 000 mL.'),
    ],
    hints: ['1 L = 1 dm³ et 1 mL = 1 cm³.', `Donc 1 ${from} = ${fr(factor)} ${to}.`],
    solution: `1 ${from} = ${fr(factor)} ${to}, donc ${fr(v)} ${from} = ${fr(v)} × ${fr(factor)} = ${fr(ans)} ${to}.`,
  });
}

/** ◆ Combien de verres pleins avec une bouteille ? */
function convVerres(rand) {
  const Y = pick(rand, [0.75, 1, 1.5, 2, 2.5]); const X = pick(rand, [12.5, 15, 20, 25, 30]);
  const q = (Y * 100) / X; const ans = Math.floor(q + 1e-9);
  const mcs = [mc(round(Y / X, 4), 'mc:unites-melangees', 'unite', `Mets les deux contenances dans la même unité : ${fr(Y)} L = ${fr(Y * 100)} cL.`), mc(Math.floor((Y * 10) / X + 1e-9), 'mc:conversion-facteur', 'notion', '1 L = 100 cL (et non 10 cL).')];
  if (!Number.isInteger(round(q, 6))) mcs.push(mc(Math.ceil(q), 'mc:arrondi-par-exces', 'raisonnement', 'Le dernier verre ne serait pas plein : on ne compte que les verres remplis entièrement.'));
  return num(ans, {
    prompt: `Avec une bouteille de ${fr(Y)} L de jus, combien de verres de ${fr(X)} cL peut-on remplir entièrement ?`,
    representation: 'concrete', expectedSeconds: 120, misconceptions: mcs,
    hints: [`${fr(Y)} L = ${fr(Y * 100)} cL.`, `Combien de fois ${fr(X)} cL dans ${fr(Y * 100)} cL ?`, 'On ne garde que les verres pleins.'],
    solution: `${fr(Y)} L = ${fr(Y * 100)} cL ; ${fr(Y * 100)} ÷ ${fr(X)} ${Number.isInteger(round(q, 6)) ? '=' : '≈'} ${fr(round(q, 2))}, donc ${ans} verres pleins.`,
  });
}

/** ◆ Durée entre deux horaires, en heures décimales. */
function convDureeHoraires(rand) {
  const h1 = ri(rand, 6, 14); const m1 = ri(rand, 1, 11) * 5 - ri(rand, 0, 1) * 2;
  const D = 60 * ri(rand, 1, 4) + pick(rand, [6, 12, 15, 18, 24, 36, 42, 45, 48, 54]);
  const end = h1 * 60 + m1 + D; const h2 = Math.floor(end / 60); const m2 = end % 60;
  const ans = clean(D / 60); const dh = Math.floor(D / 60); const dm = D % 60;
  const p2 = (x) => String(x).padStart(2, '0');
  return num(ans, {
    prompt: `Un train part à ${h1} h ${p2(m1)} et arrive à ${h2} h ${p2(m2)}. Quelle est la durée du trajet, en heures (écriture décimale) ?`,
    unit: 'h', unitOptional: true, strictUnit: true, representation: 'concrete', expectedSeconds: 150,
    misconceptions: [
      mc(clean(h2 + m2 / 100 - (h1 + m1 / 100)), 'mc:duree-decimale', 'notion', 'Les heures ne se soustraient pas comme des nombres décimaux : 1 h = 60 min, pas 100.'),
      mc(Number(`${dh}.${p2(dm)}`), 'mc:duree-decimale', 'notion', `${dh} h ${dm} min ne s’écrit pas ${dh},${p2(dm)} h : ${dm} min = ${dm} ÷ 60 h = ${fr(dm / 60)} h.`),
      mc(D, 'mc:unite-demandee', 'lecture', 'Ce nombre est la durée en minutes ; la question la demande en heures.'),
    ],
    hints: [`Compte en heures et minutes : de ${h1} h ${p2(m1)} à ${h2} h ${p2(m2)}.`, `Tu dois trouver ${dh} h ${dm} min.`, `Convertis les minutes : ${dm} min = ${dm} ÷ 60 h.`],
    solution: `Durée : ${dh} h ${dm} min. ${dm} min = ${dm} ÷ 60 = ${fr(dm / 60)} h, donc ${fr(ans)} h.`,
  });
}

/** ◆ Heures décimales → heures et minutes (deux réponses). */
function convDureeHM(rand) {
  const h = ri(rand, 1, 4); const f = pick(rand, [0.1, 0.15, 0.2, 0.3, 0.35, 0.4, 0.45, 0.6, 0.7, 0.8, 0.85, 0.9]);
  const x = clean(h + f); const mins = Math.round(f * 60); const pct = Math.round(f * 100);
  return problem([
    num(h, { prompt: 'Nombre d’heures entières ?', unit: 'h', unitOptional: true, misconceptions: [mc(Math.round(x * 60), 'mc:unite-demandee', 'lecture', 'Ce nombre est la durée totale en minutes ; écris ici seulement les heures entières.')] }),
    num(mins, { prompt: 'Nombre de minutes en plus ?', unit: 'min', unitOptional: true, misconceptions: [mc(pct, 'mc:duree-decimale', 'notion', `${fr(f)} h n’est pas ${pct} min : c’est une fraction d’heure, ${fr(f)} × 60 = ${mins} min.`)] }),
  ], {
    prompt: `Une randonnée a duré ${fr(x)} h. Écris cette durée en heures et minutes.`,
    representation: 'concrete', expectedSeconds: 120,
    hints: [`${fr(x)} h = ${h} h + ${fr(f)} h.`, `1 h = 60 min, donc ${fr(f)} h = ${fr(f)} × 60 min.`],
    solution: `${fr(x)} h = ${h} h + ${fr(f)} h ; ${fr(f)} × 60 = ${mins} min. Donc ${h} h ${mins} min.`,
  });
}

/** ◆ Secondes → heures et minutes. */
function convSecondes(rand) {
  const h = ri(rand, 1, 2); const m = pick(rand, [5, 10, 12, 18, 20, 25, 35, 40, 50]); const sec = 3600 * h + 60 * m;
  const decWrong = Math.round((sec / 3600 - h) * 100);
  return problem([
    num(h, { prompt: 'Nombre d’heures entières ?', unit: 'h', unitOptional: true, misconceptions: [mc(sec / 60, 'mc:secondes-minutes', 'lecture', 'Ce nombre est la durée en minutes ; combien d’heures entières contient-elle ?')] }),
    num(m, { prompt: 'Nombre de minutes en plus ?', unit: 'min', unitOptional: true, misconceptions: [mc(decWrong, 'mc:duree-decimale', 'notion', `${fr(round(sec / 3600, 4))} h ne veut pas dire ${h} h ${decWrong} min : la partie décimale est une fraction d’heure, à multiplier par 60.`)] }),
  ], {
    prompt: `Un film dure ${fr(sec)} s. Exprime cette durée en heures et minutes.`,
    representation: 'concrete', expectedSeconds: 150,
    hints: ['1 min = 60 s et 1 h = 60 min = 3 600 s.', `${fr(sec)} ÷ 60 = ${fr(sec / 60)} min.`, `Combien de fois 60 min dans ${fr(sec / 60)} min ? Le reste donne les minutes.`],
    solution: `${fr(sec)} ÷ 60 = ${fr(sec / 60)} min = ${h} × 60 + ${m} min, soit ${h} h ${m} min.`,
  });
}

/** ✦ Vitesses : km/h ↔ m/s. */
function convVitesse(rand) {
  if (rand() < 0.5) {
    const v = pick(rand, [18, 21.6, 36, 43.2, 54, 72, 90, 108, 126, 144, 162, 30, 50, 80, 110, 130]); const ms = v / 3.6; const exact = isRound(ms, 2);
    const ans = exact ? clean(ms) : round(ms, 1);
    return num(ans, {
      prompt: `Convertis en m/s${exact ? '' : ' (arrondi au dixième)'} : ${v} km/h = … m/s`, unit: 'm/s', unitOptional: true, strictUnit: true, round: exact ? undefined : 1, tolerance: exact ? undefined : 0.051, representation: 'symbolique', expectedSeconds: 120,
      misconceptions: [
        mc(round((v * 1000) / 60, 2), 'mc:heure-60', 'notion', '1 h = 3 600 s (et non 60 s) : ce résultat est en mètres par minute.'),
        mc(clean(v * 3.6), 'mc:conversion-sens', 'notion', 'Une vitesse en m/s est un nombre plus petit qu’en km/h : on divise par 3,6.'),
        mc(clean(v * 1000), 'mc:conversion-partielle', 'methode', 'Tu as converti les kilomètres en mètres, mais pas les heures en secondes (1 h = 3 600 s).'),
        mc(round(v / 3600, 5), 'mc:conversion-partielle', 'methode', 'Tu as converti les heures en secondes, mais pas les kilomètres en mètres (1 km = 1 000 m).'),
      ],
      hints: ['1 km = 1 000 m et 1 h = 3 600 s.', `En 1 h, on parcourt ${v} km = ${fr(v * 1000)} m.`, 'Divise ces mètres par 3 600 (ou divise directement par 3,6).'],
      solution: `${v} km/h = ${fr(v * 1000)} m en 3 600 s, soit ${fr(v * 1000)} ÷ 3 600 ${exact ? '=' : '≈'} ${fr(ans)} m/s.`,
    });
  }
  const v = pick(rand, [1.5, 2.5, 3, 4, 5, 7.5, 8, 10, 12, 15, 17.5, 20, 25, 30, 35, 40, 45]); const ans = clean(v * 3.6);
  return num(ans, {
    prompt: `Convertis en km/h : ${fr(v)} m/s = … km/h`, unit: 'km/h', unitOptional: true, strictUnit: true, representation: 'symbolique', expectedSeconds: 120,
    misconceptions: [
      mc(round(v / 3.6, 3), 'mc:conversion-sens', 'notion', 'Une vitesse en km/h est un nombre plus grand qu’en m/s : on multiplie par 3,6.'),
      mc(clean((v * 60) / 1000), 'mc:heure-60', 'notion', 'En 1 h, il y a 3 600 s (et non 60).'),
      mc(clean(v * 3600), 'mc:conversion-partielle', 'methode', 'Tu as trouvé des mètres par heure : convertis encore les mètres en kilomètres.'),
      mc(clean(v / 1000), 'mc:conversion-partielle', 'methode', 'Tu as converti les mètres en kilomètres, mais pas les secondes en heures.'),
    ],
    hints: ['1 h = 3 600 s et 1 km = 1 000 m.', `En 1 h, on parcourt ${fr(v)} × 3 600 m.`, 'Convertis ensuite ces mètres en kilomètres.'],
    solution: `En 1 h : ${fr(v)} × 3 600 = ${fr(v * 3600)} m = ${fr(ans)} km, donc ${fr(v)} m/s = ${fr(ans)} km/h.`,
  });
}

/** [unité de départ, d'arrivée, facteur de la masse, facteur du volume] */
const MV_CONV = [['g/cm³', 'kg/m³', 0.001, 1e6], ['kg/m³', 'g/cm³', 1000, 1e-6], ['g/L', 'kg/m³', 0.001, 1000], ['kg/m³', 'g/L', 1000, 0.001], ['g/cm³', 'g/L', 1, 1000], ['g/L', 'g/cm³', 1, 0.001], ['kg/L', 'g/cm³', 1000, 0.001]];
const MV_FROM = { 'g/cm³': 1, 'kg/m³': 1000, 'g/L': 1000, 'kg/L': 1 };
const LIQUIDES_MV = [['de l’eau', 1], ['de l’huile', 0.92], ['de l’éthanol', 0.79], ['de l’eau de mer', 1.03], ['de la glycérine', 1.26]];
const SOLIDES_MV = [['de l’aluminium', 2.7], ['du fer', 7.87], ['du cuivre', 8.96], ['de l’or', 19.3], ['du plomb', 11.3], ['du bois de chêne', 0.75]];

/** ✦ Masses volumiques : g/cm³, kg/m³, g/L, kg/L (deux unités à convertir). */
function convMasseVolumique(rand) {
  const [from, to, fm, fv] = pick(rand, MV_CONV);
  // les unités en litres conviennent aux liquides ; g/cm³ et kg/m³ à toutes les matières
  const [du, rho] = pick(rand, /L$/.test(from) || /L$/.test(to) ? LIQUIDES_MV : [...LIQUIDES_MV, ...SOLIDES_MV]);
  const v = clean(rho * MV_FROM[from]); const total = clean(fm * fv); const ans = clean(v * total);
  const mcs = [mc(clean(v / total), 'mc:conversion-sens', 'notion', `Vérifie le sens : 1 ${from} = ${fr(total)} ${to}.`)];
  if (fm === 1) mcs.push(mc(v, 'mc:conversion-oubliee', 'methode', 'La masse est déjà en grammes, mais le volume change d’unité : 1 L = 1 000 cm³.'));
  else mcs.push(mc(clean(v * fm), 'mc:conversion-partielle', 'methode', 'Tu as converti la masse mais pas le volume : il faut convertir les deux unités.'), mc(clean(v * fv), 'mc:conversion-partielle', 'methode', 'Tu as converti le volume mais pas la masse : il faut convertir les deux unités.'));
  return num(ans, {
    prompt: `La masse volumique ${du} vaut ${fr(v)} ${from}. Convertis-la en ${to}.`, unit: to, unitOptional: true, strictUnit: true, representation: 'symbolique', expectedSeconds: 150,
    misconceptions: mcs,
    hints: [`Écris ${fr(v)} ${from} comme « ${fr(v)} ${from.split('/')[0]} dans 1 ${from.split('/')[1]} ».`, '1 kg = 1 000 g ; 1 m³ = 1 000 L = 1 000 000 cm³ ; 1 L = 1 000 cm³.', `Convertis la masse ET le volume, puis divise : on trouve 1 ${from} = ${fr(total)} ${to}.`],
    solution: `1 ${from} = ${fr(total)} ${to}${total === 1 ? ' (les deux changements d’unité se compensent)' : ''}, donc ${fr(v)} ${from} = ${fr(ans)} ${to}.`,
  });
}

/** ✦ Consommation (L/100 km ↔ km/L) et débits (L/min ↔ m³/h). */
function convConsoDebit(rand) {
  const kind = ri(rand, 1, 4);
  if (kind <= 2) {
    const [c, k] = pick(rand, [[2.5, 40], [3.2, 31.25], [4, 25], [5, 20], [6.25, 16], [8, 12.5], [12.5, 8]]);
    const toKm = kind === 1; const ans = toKm ? k : c; const given = toKm ? c : k;
    return num(ans, {
      prompt: toKm ? `Une voiture consomme ${fr(c)} L aux 100 km. Combien de kilomètres parcourt-elle avec 1 L de carburant ?` : `Une voiture parcourt ${fr(k)} km avec 1 L de carburant. Quelle est sa consommation, en litres pour 100 km ? (écris seulement le nombre)`,
      unit: toKm ? 'km' : undefined, unitOptional: toKm ? true : undefined, representation: 'concrete', expectedSeconds: 150,
      misconceptions: [
        mc(clean(given / 100), 'mc:rapport-inverse', 'raisonnement', toKm ? 'Ce nombre est la quantité de carburant pour 1 km ; on cherche la distance parcourue avec 1 L.' : `Tu as divisé dans le mauvais sens : la consommation aux 100 km vaut 100 ÷ ${fr(k)}.`),
        mc(clean(given * 100), 'mc:operation-inverse', 'raisonnement', 'Vérifie l’ordre de grandeur : une voiture consomme quelques litres aux 100 km et parcourt une dizaine de kilomètres avec 1 L.'),
        mc(clean(1 / given), 'mc:oubli-cent-km', 'methode', toKm ? 'Les ' + fr(c) + ' L correspondent à 100 km, pas à 1 km.' : 'Ce nombre est la consommation pour 1 km : multiplie par 100.'),
      ],
      hints: toKm ? [`Avec ${fr(c)} L, on parcourt 100 km.`, `Avec 1 L, on parcourt ${fr(c)} fois moins : 100 ÷ ${fr(c)}.`] : [`Pour 1 km, il faut 1 ÷ ${fr(k)} L.`, `Pour 100 km : 100 ÷ ${fr(k)}.`],
      solution: toKm ? `100 ÷ ${fr(c)} = ${fr(k)} km avec 1 L.` : `100 ÷ ${fr(k)} = ${fr(c)} L aux 100 km.`,
    });
  }
  if (kind === 3) {
    const q = pick(rand, [5, 6, 8, 9, 10, 12, 15, 18, 20, 25, 30]); const ans = clean((q * 60) / 1000);
    return num(ans, {
      prompt: `Un robinet débite ${q} L par minute. Exprime ce débit en m³ par heure.`, unit: 'm³/h', unitOptional: true, strictUnit: true, representation: 'concrete', expectedSeconds: 150,
      misconceptions: [
        mc(q * 60, 'mc:conversion-partielle', 'methode', 'C’est le débit en litres par heure : convertis encore les litres en m³ (1 m³ = 1 000 L).'),
        mc(clean(q / 1000), 'mc:conversion-partielle', 'methode', 'C’est le débit en m³ par MINUTE : en une heure, il coule 60 fois plus.'),
        mc(q * 60000, 'mc:conversion-sens', 'notion', '1 m³ = 1 000 L : un nombre de m³ est plus petit qu’un nombre de litres.'),
      ],
      hints: [`En 1 h = 60 min, il coule ${q} × 60 L.`, '1 m³ = 1 000 L.'],
      solution: `En 1 h : ${q} × 60 = ${q * 60} L = ${q * 60} ÷ 1 000 = ${fr(ans)} m³, soit ${fr(ans)} m³/h.`,
    });
  }
  const Q = pick(rand, [0.3, 0.6, 0.9, 1.2, 1.5, 1.8, 2.1, 2.4, 3, 3.6, 4.5]); const ans = clean((Q * 1000) / 60);
  return num(ans, {
    prompt: `Une pompe débite ${fr(Q)} m³ par heure. Combien de litres par minute cela fait-il ?`, unit: 'L/min', unitOptional: true, strictUnit: true, representation: 'concrete', expectedSeconds: 150,
    misconceptions: [
      mc(clean(Q * 1000), 'mc:conversion-partielle', 'methode', 'C’est le débit en litres par HEURE : en une minute, il coule 60 fois moins.'),
      mc(clean(Q / 60), 'mc:conversion-partielle', 'methode', 'C’est le débit en m³ par minute : convertis encore les m³ en litres.'),
      mc(clean(Q * 60 * 1000), 'mc:conversion-sens', 'notion', 'En une minute, il coule moins qu’en une heure : on divise par 60.'),
    ],
    hints: [`${fr(Q)} m³ = ${fr(Q * 1000)} L par heure.`, '1 h = 60 min : divise par 60.'],
    solution: `${fr(Q)} m³ = ${fr(Q * 1000)} L en 60 min, soit ${fr(Q * 1000)} ÷ 60 = ${fr(ans)} L/min.`,
  });
}

/** ✦ Contenance d’un aquarium aux dimensions données dans trois unités, puis nombre de seaux. */
function convAquarium(rand) {
  const U = [['m', 0.1], ['dm', 1], ['cm', 10]];
  let dims; let V; let s; let units;
  do {
    dims = [pick(rand, [6, 8, 10, 12]), pick(rand, [3, 3.5, 4, 4.5]), pick(rand, [4, 4.5, 5, 6])];
    units = [pick(rand, U), pick(rand, U), pick(rand, U)]; V = clean(dims[0] * dims[1] * dims[2]); s = pick(rand, [5, 8, 10, 12]);
  } while (Number.isInteger(round(V / s, 6)) || new Set(units).size < 2 || round(units.reduce((p, u) => p * u[1], 1), 6) === 1);
  const shown = dims.map((d, i) => clean(d * units[i][1]));
  const raw = clean(shown[0] * shown[1] * shown[2]); const n = Math.ceil(V / s);
  const txt = shown.map((x, i) => `${fr(x)} ${units[i][0]}`);
  return problem([
    num(V, { prompt: 'Quelle est la contenance de l’aquarium, en litres ?', unit: 'L', unitOptional: true, misconceptions: [mc(raw, 'mc:unites-melangees', 'unite', 'Les trois dimensions doivent être dans la même unité avant de les multiplier : convertis-les en dm (1 dm³ = 1 L).'), mc(clean(V * 1000), 'mc:cm3-litre', 'unite', 'Ce nombre est le volume en cm³ : 1 L = 1 000 cm³.')] }),
    num(n, { prompt: `Combien de seaux de ${s} L faut-il au minimum pour le remplir ?`, misconceptions: [mc(Math.floor(V / s), 'mc:arrondi-par-defaut', 'raisonnement', `Avec ${Math.floor(V / s)} seaux, il manque de l’eau : on arrondit à l’entier supérieur.`), mc(round(V / s, 2), 'mc:quotient-non-entier', 'raisonnement', 'Le nombre de seaux est un nombre entier : arrondis à l’entier supérieur.')] }),
  ], {
    prompt: `Un aquarium a la forme d’un pavé droit de ${txt[0]} de long, ${txt[1]} de large et ${txt[2]} de haut.`,
    representation: 'concrete', expectedSeconds: 300,
    hints: ['Convertis les trois dimensions en dm : 1 dm³ = 1 L.', `En dm : ${dims.map((d) => fr(d)).join(' × ')}.`, `Nombre de seaux : contenance ÷ ${s}, arrondi à l’entier supérieur.`],
    solution: `En dm : ${dims.map((d) => fr(d)).join(' × ')} = ${fr(V)} dm³ = ${fr(V)} L. ${fr(V)} ÷ ${s} ≈ ${fr(round(V / s, 2))}, il faut donc ${n} seaux.`,
  });
}

const ALLURES = [[300, 12], [320, 11.25], [240, 15], [375, 9.6], [400, 9], [225, 16], [288, 12.5], [450, 8], [360, 10], [250, 14.4]];

/** ✦ Allure (temps pour 1 km) ↔ vitesse (km/h). */
function convAllure(rand) {
  const toSpeed = rand() < 0.5;
  const [secs, v] = pick(rand, toSpeed ? ALLURES : ALLURES.filter(([t]) => t % 60)); const m = Math.floor(secs / 60); const s = secs % 60; const who = prenom(rand);
  const tTxt = s ? `${m} min ${s} s` : `${m} min`;
  if (toSpeed) {
    const mcs = [mc(round(secs / 60, 2), 'mc:allure-vitesse', 'notion', 'Ce nombre est le temps en minutes pour 1 km (l’allure), pas la vitesse en km/h.')];
    if (s) mcs.push(mc(round(60 / (m + s / 100), 2), 'mc:duree-decimale', 'notion', `${m} min ${s} s ne font pas ${m},${s} min : ${s} s = ${fr(round(s / 60, 4))} min.`), mc(round(60 / m, 2), 'mc:secondes-oubliees', 'methode', `N’oublie pas les ${s} secondes.`));
    return num(v, {
      prompt: `${who} court à allure régulière : un kilomètre en ${tTxt}. Quelle est sa vitesse, en km/h ?`, unit: 'km/h', unitOptional: true, tolerance: 0.01, representation: 'concrete', expectedSeconds: 180, misconceptions: mcs,
      hints: [`Convertis la durée en secondes : ${tTxt} = ${secs} s.`, `En 1 h = 3 600 s, combien de fois ${secs} s ?`, 'Ce nombre de fois est aussi le nombre de kilomètres parcourus en 1 h.'],
      solution: `${tTxt} = ${secs} s. En 3 600 s : 3 600 ÷ ${secs} = ${fr(v)} km, donc ${fr(v)} km/h.`,
    });
  }
  return problem([
    num(m, { prompt: 'Allure : nombre de minutes entières pour 1 km ?', unit: 'min', unitOptional: true, misconceptions: [mc(round(60 / v, 2), 'mc:duree-decimale', 'notion', 'Écris ici seulement le nombre entier de minutes ; le reste se met en secondes.'), mc(v, 'mc:allure-vitesse', 'notion', 'La vitesse (km en 1 h) n’est pas l’allure (temps pour 1 km).')] }),
    num(s, { prompt: 'Et combien de secondes en plus ?', unit: 's', unitOptional: true, misconceptions: [mc(Math.round((60 / v - m) * 100), 'mc:duree-decimale', 'notion', 'La partie décimale d’un nombre de minutes est une fraction de minute : multiplie-la par 60 pour avoir des secondes.')] }),
  ], {
    prompt: `${who} court à ${fr(v)} km/h. Calcule son allure, c’est-à-dire le temps mis pour parcourir 1 km.`,
    representation: 'concrete', expectedSeconds: 240,
    hints: [`En 60 min, ${fr(v)} km : pour 1 km, il faut 60 ÷ ${fr(v)} min.`, 'Sépare les minutes entières de la partie décimale.', 'Partie décimale × 60 = secondes.'],
    solution: `60 ÷ ${fr(v)} = ${fr(round(60 / v, 4))} min = ${m} min + ${fr(round(60 / v - m, 4))} × 60 s = ${m} min ${s} s par km.`,
  });
}

/** ✦ Échelle d’une carte : distance réelle en km, puis longueur sur la carte (1 km = 100 000 cm). */
function convEchelle(rand) {
  let E; let d; let D; let R; let r;
  do {
    // pas de 1/100 000 : la distance en km y serait le nombre lu sur la carte
    E = pick(rand, [20000, 25000, 50000, 200000, 250000]); d = pick(rand, [2.4, 3.5, 4.8, 6, 7.2, 8.5, 12]); D = clean((d * E) / 100000);
    R = pick(rand, [1.5, 2.5, 3, 4.5, 6, 7.5, 12]); r = clean((R * 100000) / E);
  } while (D < 0.5 || D > 40 || r < 0.5 || r > 30 || R === D);
  return problem([
    num(D, { prompt: 'Quelle est la distance réelle entre le parking et le refuge, en km ?', unit: 'km', unitOptional: true, strictUnit: true, misconceptions: [
      mc(clean(d * E), 'mc:unite-demandee', 'lecture', 'Ce nombre est la distance réelle en centimètres ; la question la demande en kilomètres.'),
      mc(clean((d * E) / 100), 'mc:unite-demandee', 'lecture', 'Ce nombre est la distance réelle en mètres : 1 km = 1 000 m.'),
      mc(clean((d * E) / 1000), 'mc:conversion-facteur', 'notion', '1 km = 1 000 m = 100 000 cm : pour passer des centimètres aux kilomètres, on divise par 100 000.'),
    ] }),
    num(r, { prompt: `Un sentier mesure ${fr(R)} km sur le terrain. Quelle est sa longueur sur la carte, en cm ?`, unit: 'cm', unitOptional: true, strictUnit: true, misconceptions: [
      mc(clean((R * 1000) / E), 'mc:conversion-facteur', 'notion', `${fr(R)} km = ${fr(R * 100000)} cm (1 km = 100 000 cm) : convertis en centimètres avant de diviser par ${fr(E)}.`),
      mc(clean(R * E), 'mc:echelle-sens', 'raisonnement', `Sur la carte, les longueurs sont ${fr(E)} fois plus petites que sur le terrain : on divise, on ne multiplie pas.`),
    ] }),
  ], {
    prompt: `Une carte de randonnée est à l’échelle 1/${fr(E)} : 1 cm sur la carte représente ${fr(E)} cm sur le terrain. Sur la carte, le refuge est à ${fr(d)} cm du parking.`,
    representation: 'concrete', expectedSeconds: 300,
    hints: [`Distance réelle en cm : ${fr(d)} × ${fr(E)}.`, '1 m = 100 cm et 1 km = 1 000 m, donc 1 km = 100 000 cm.', `Dans l’autre sens : convertis ${fr(R)} km en cm, puis divise par ${fr(E)}.`],
    solution: `${fr(d)} × ${fr(E)} = ${fr(d * E)} cm = ${fr(D)} km. ${fr(R)} km = ${fr(R * 100000)} cm, et ${fr(R * 100000)} ÷ ${fr(E)} = ${fr(r)} cm sur la carte.`,
  });
}

/** ✦ Épaisseur d’une feuille (cm → mm), puis nombre de feuilles dans une pile (m → mm). */
function convFeuilles(rand) {
  let n; let H; let ep; let P; let N;
  do {
    n = pick(rand, [200, 250, 400, 500]); H = pick(rand, [2, 2.5, 3, 4, 5, 6]); ep = clean((H * 10) / n);
    P = pick(rand, [0.6, 0.8, 0.9, 1.2, 1.5]); N = clean((P * 1000) / ep);
  } while (!Number.isInteger(N) || !isRound(ep, 3));
  return problem([
    num(ep, { prompt: 'Quelle est l’épaisseur d’une feuille, en mm ?', unit: 'mm', unitOptional: true, strictUnit: true, misconceptions: [
      mc(clean(H / n), 'mc:unite-demandee', 'lecture', 'Ce nombre est l’épaisseur en cm ; la question la demande en mm (1 cm = 10 mm).'),
      mc(clean((H * 100) / n), 'mc:conversion-facteur', 'notion', '1 cm = 10 mm (et non 100 mm).'),
      mc(clean(n / H), 'mc:rapport-inverse', 'raisonnement', `Ce nombre est le nombre de feuilles par centimètre ; l’épaisseur d’une feuille, c’est ${fr(H)} cm ÷ ${n}.`),
    ] }),
    num(N, { prompt: `Combien de feuilles faut-il empiler pour obtenir une pile de ${fr(P)} m de haut ?`, misconceptions: [
      mc(clean((P * 100) / ep), 'mc:conversion-facteur', 'notion', `1 m = 1 000 mm (et non 100 mm) : ${fr(P)} m = ${fr(P * 1000)} mm.`),
      mc(clean(P / ep), 'mc:unites-melangees', 'unite', `La hauteur est en mètres et l’épaisseur en millimètres : convertis ${fr(P)} m en mm avant de diviser.`),
      mc(clean(P * 1000 * ep), 'mc:produit-au-lieu-quotient', 'raisonnement', 'On cherche combien de fois l’épaisseur d’une feuille tient dans la hauteur de la pile : on divise.'),
    ] }),
  ], {
    prompt: `Une ramette de ${n} feuilles de papier a une épaisseur de ${fr(H)} cm.`,
    representation: 'concrete', expectedSeconds: 300,
    hints: [`Épaisseur d’une feuille : ${fr(H)} cm ÷ ${n} ; convertis en mm (1 cm = 10 mm).`, `${fr(H)} cm = ${fr(H * 10)} mm.`, `Pour la pile : ${fr(P)} m = ${fr(P * 1000)} mm, puis divise par l’épaisseur d’une feuille.`],
    solution: `${fr(H)} cm = ${fr(H * 10)} mm, donc une feuille mesure ${fr(H * 10)} ÷ ${n} = ${fr(ep)} mm. ${fr(P)} m = ${fr(P * 1000)} mm, et ${fr(P * 1000)} ÷ ${fr(ep)} = ${fr(N)} feuilles.`,
  });
}

/** ✦ Charge maximale en tonnes : masse encore disponible (kg), puis nombre entier de sacs (arrondi du côté sûr). */
function convChargement(rand) {
  let C; let p; let s; let dispo; let n; let noLoad;
  do {
    C = pick(rand, [0.8, 1.2, 1.5, 2, 2.5, 3.5]); p = pick(rand, [45, 60, 85, 120, 150, 230, 340]); s = pick(rand, [25, 35, 40, 50]);
    dispo = clean(C * 1000 - p); n = Math.floor(dispo / s + 1e-9); noLoad = Math.floor((C * 1000) / s + 1e-9);
  } while (Number.isInteger(clean(dispo / s)) || !distinct(n, [n + 1, noLoad, round(dispo / s, 2)]));
  const veh = pick(rand, ['Une camionnette', 'Une remorque', 'Un monte-charge']);
  return problem([
    num(dispo, { prompt: 'Quelle masse peut-on encore charger, en kg ?', unit: 'kg', unitOptional: true, strictUnit: true, misconceptions: [
      mc(clean(C * 100 - p), 'mc:tonne-100', 'notion', '1 t = 1 000 kg (et non 100 kg).'),
      mc(clean(C * 1000), 'mc:oubli-quantite', 'lecture', `${p} kg de matériel sont déjà chargés : retire-les de la charge maximale.`),
      mc(clean(C * 1000 + p), 'mc:operation-inverse', 'raisonnement', 'La masse déjà chargée réduit ce qu’on peut encore ajouter : on soustrait, on n’additionne pas.'),
    ] }),
    num(n, { prompt: `Combien de sacs de ${s} kg peut-on encore ajouter, au maximum ?`, misconceptions: [
      mc(n + 1, 'mc:arrondi-par-exces', 'raisonnement', `Avec ${n + 1} sacs, on ajouterait ${fr((n + 1) * s)} kg : c’est plus que les ${fr(dispo)} kg disponibles. On garde l’entier inférieur.`),
      mc(noLoad, 'mc:oubli-quantite', 'lecture', `N’oublie pas les ${p} kg déjà chargés : il ne reste que ${fr(dispo)} kg.`),
      mc(round(dispo / s, 2), 'mc:quotient-non-entier', 'raisonnement', 'Le nombre de sacs est un nombre entier : on ne peut pas en charger une partie.'),
    ] }),
  ], {
    prompt: `${veh} peut transporter au maximum ${fr(C)} t. On y a déjà chargé ${p} kg de matériel, et on veut ajouter des sacs de ciment de ${s} kg chacun.`,
    representation: 'concrete', expectedSeconds: 240,
    hints: ['1 t = 1 000 kg.', `Masse disponible : ${fr(C * 1000)} kg − ${p} kg.`, `Nombre de sacs : masse disponible ÷ ${s}, arrondi à l’entier inférieur (on ne doit pas dépasser la charge maximale).`],
    solution: `${fr(C)} t = ${fr(C * 1000)} kg ; il reste ${fr(C * 1000)} − ${p} = ${fr(dispo)} kg. ${fr(dispo)} ÷ ${s} ${isRound(dispo / s, 2) ? '=' : '≈'} ${fr(round(dispo / s, 2))} : on peut ajouter au plus ${n} sacs (${fr(n * s)} kg).`,
  });
}

/**
 * Variantes des conversions par grandeur : l'option choisie est respectée. Les grandeurs composées
 * (aires, vitesses, masses volumiques) n'ont pas d'option : elles ne sortent qu'au hasard, sans option.
 */
const CONV_APPRO = {
  longueur: [convLongueurSomme, convPerimetre],
  masse: [convMasseSomme, convMasseMg],
  contenance: [convContenanceVolume, convVerres],
  volume: [(rand) => convPuissance(rand, VOLS, 1000)],
  duree: [convDureeHoraires, convDureeHM, convSecondes],
  aire: [(rand) => convPuissance(rand, AIRES, 100), convAireRectangle],
};
const CONV_EXPERT = {
  longueur: [convEchelle, convFeuilles],
  masse: [convChargement],
  contenance: [convConsoDebit],
  volume: [convAquarium],
  duree: [convAllure],
  vitesse: [convVitesse],
  'masse-volumique': [convMasseVolumique],
};
const convTier = (pools) => (rand, o = {}) => pick(rand, pools[choice(rand, o.grandeur, Object.keys(pools))])(rand);

export const TIERS_MESURES = {
  'm-pythagore': {
    approfondissement(rand, o = {}) {
      const mode = choice(rand, o.mode, ['hypotenuse', 'cote', 'arrondi']);
      if (mode === 'hypotenuse') return pyRectangle(rand);
      if (mode === 'cote') return pyAire(rand);
      return pick(rand, [pyEchelle, pyEcran, pyTerrain])(rand);
    },
    expert(rand, o = {}) {
      const mode = choice(rand, o.mode, ['hypotenuse', 'cote', 'arrondi']);
      if (mode === 'hypotenuse') return rand() < 0.5 ? pyReciproque(rand) : pyChaine(rand);
      if (mode === 'cote') return rand() < 0.5 ? pyIsocele(rand) : pyLosange(rand);
      return rand() < 0.5 ? pyEchelleGlisse(rand) : pyPave(rand);
    },
  },
  'm-conversions': {
    approfondissement: convTier(CONV_APPRO),
    expert: convTier(CONV_EXPERT),
  },
};
