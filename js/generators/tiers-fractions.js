/**
 * Niveaux ◆ approfondissement et ✦ expert des générateurs : fractions et puissances.
 * Chaque fonction reçoit (rand, options) et renvoie un exercice comme `make` (numeric, expression, steps).
 */
import { ri, nz, pick, sample, clean, fr, par, gcd, lcm, frac, fracStr, mc, numeric } from './gen-util.js';
import { distinct, fdistinct, fadd, fsub, fmul, fdiv, fneg, fm, fp, numFor, e, isNice, VERB, signHint, fracResult, formTxt, negWord, readFrac } from './tiers-nombres-outils.js';

export const TIERS_FRACTIONS = {
  'm-fractions-somme': {
    /** ◆ Trois fractions, un entier et deux fractions, fraction manquante (question à l'envers). */
    approfondissement(rand, o) {
      const mode = o.denominateurs || pick(rand, ['multiple', 'quelconques']);
      return FS_APPRO[pick(rand, ['trois', 'trois', 'entier', 'manquant'])](rand, o, mode);
    },
    /** ✦ Numérateur manquant, « le reste » d'un tout, « − » devant une parenthèse de fractions. */
    expert(rand, o) {
      const mode = o.denominateurs || pick(rand, ['multiple', 'quelconques']);
      const kinds = o.op === 'addition' ? ['numerateur', 'reste'] : o.op === 'soustraction' ? ['numerateur', 'parentheses', 'reste'] : ['numerateur', 'parentheses', 'reste'];
      return FS_EXPERT[pick(rand, kinds)](rand, o, mode);
    },
  },

  'm-fractions-produit': {
    /** ◆ Trois facteurs et des signes, entier × fraction, enchaînement ÷ ×, facteur ou diviseur manquant. */
    approfondissement(rand, o) {
      const kinds = o.op === 'multiplication' ? ['trois', 'entier', 'manquant'] : o.op === 'division' ? ['entierDiv', 'chaine', 'manquantDiv'] : ['trois', 'entier', 'manquant', 'entierDiv', 'chaine', 'manquantDiv'];
      return FP_APPRO[pick(rand, kinds)](rand);
    },
    /** ✦ Fractions et priorités, carré d'une fraction négative, inverse, « les 2/3 des 3/5 » à l'envers. */
    expert(rand, o) {
      const kinds = o.op === 'multiplication' ? ['prioMul', 'carre', 'inverse'] : o.op === 'division' ? ['prioDiv', 'fractionDe', 'inverse'] : ['prioMul', 'carre', 'inverse', 'prioDiv', 'fractionDe'];
      return FP_EXPERT[pick(rand, kinds)](rand);
    },
  },

  'm-puissances': {
    /** ◆ Signes et carrés (−3² ≠ (−3)²), puissance d'une fraction, deux règles enchaînées, exposant manquant, écriture scientifique d'un nombre mal écrit. */
    approfondissement(rand, o) {
      const mode = o.mode || pick(rand, ['valeur', 'regles', 'scientifique']);
      return PU_APPRO[mode](rand);
    },
    /** ✦ Puissances et priorités, exposant à retrouver, décimaux en puissances de 10, notation scientifique d'un produit ou d'un quotient. */
    expert(rand, o) {
      const mode = o.mode || pick(rand, ['valeur', 'regles', 'scientifique']);
      return PU_EXPERT[mode](rand);
    },
  },

};

function dens2(rand, mode) {
  let b; let d;
  if (mode === 'quelconques') { do { b = ri(rand, 2, 9); d = ri(rand, 2, 9); } while (b === d || b % d === 0 || d % b === 0); }
  else { b = ri(rand, 2, 6); d = b * ri(rand, 2, 3); if (rand() < 0.5) [b, d] = [d, b]; }
  return [b, d];
}
/** Trois dénominateurs (dénominateur commun au plus 72). */
function dens3(rand, mode) {
  if (mode === 'multiple') {
    const L = pick(rand, [6, 8, 10, 12, 18, 20, 24]);
    const divs = []; for (let k = 2; k < L; k++) if (L % k === 0) divs.push(k);
    return sample(rand, [L, ...sample(rand, divs, 2)]);
  }
  let t;
  do { t = [ri(rand, 2, 9), ri(rand, 2, 9), ri(rand, 2, 9)]; } while (new Set(t).size < 3 || t.some((x) => t.some((y) => x !== y && y % x === 0)) || lcm(lcm(t[0], t[1]), t[2]) > 72);
  return t;
}
/** Signes « + » / « − » entre les termes, selon l'option `op`. */
function fsOps(rand, o, n) {
  if (o.op === 'addition') return Array(n).fill('+');
  if (o.op === 'soustraction') return Array(n).fill('−');
  const ops = Array.from({ length: n }, () => pick(rand, ['+', '−']));
  if (!ops.includes('−')) ops[ri(rand, 0, n - 1)] = '−';
  if (n > 1 && !ops.includes('+')) ops[ri(rand, 0, n - 1)] = '+';
  return ops;
}
const combine = (fs, ops) => fs.slice(1).reduce((acc, f, i) => (ops[i] === '+' ? fadd(acc, f) : fsub(acc, f)), fs[0]);
const signedSum = (ns, ops) => ns.slice(1).reduce((acc, n, i) => (ops[i] === '+' ? acc + n : acc - n), ns[0]);
const joinOps = (parts, ops) => parts.map((p, i) => (i === 0 ? p : `${ops[i - 1]} ${p}`)).join(' ');
const SIGN_FB = 'Le résultat est négatif : la partie retirée est plus grande que la partie ajoutée. Vérifie le signe.';

const FS_APPRO = {
  /** a/b ± c/d ± e/f : trois dénominateurs */
  trois(rand, o, mode) {
    const ops = fsOps(rand, o, 2);
    let dens; let L; let F; let res; let mcs;
    do {
      dens = dens3(rand, mode); L = lcm(lcm(dens[0], dens[1]), dens[2]);
      F = dens.map((d) => [numFor(rand, d), d]);
      res = combine(F, ops);
      const numS = signedSum(F.map((f) => f[0]), ops);
      mcs = [mc(fracStr(frac(numS, dens[0] + dens[1] + dens[2])), 'mc:ajouter-denominateurs', 'notion', `On n’additionne pas les dénominateurs : on écrit d’abord les trois fractions avec le même dénominateur (${L}).`),
        mc(fracStr(frac(numS, L)), 'mc:numerateur-non-converti', 'notion', 'Quand on change le dénominateur d’une fraction, on multiplie aussi son numérateur par le même nombre.')];
      if (res[0] < 0) mcs.push(mc(fracStr(fneg(res)), 'mc:signe-resultat', 'signe', SIGN_FB));
    } while (!res[0] || !fdistinct(res, mcs.map((m) => readFrac(m.answer))));
    const expr = joinOps(F.map(fm), ops);
    const conv = joinOps(F.map((f) => `${(f[0] * L) / f[1]}/${L}`), ops);
    const N = signedSum(F.map((f) => (f[0] * L) / f[1]), ops);
    return fracResult(res, {
      prompt: `Calcule et donne le résultat sous la forme d’${formTxt(res)} : $${expr}$`, expectedSeconds: 150, misconceptions: mcs,
      hints: [`Cherche un dénominateur commun à ${dens.join(', ')} : ${L} convient.`, `$${F.map((f) => `${fm(f)} = ${(f[0] * L) / f[1]}/${L}`).join('$ ; $')}$`, 'Calcule le numérateur (attention aux signes), puis simplifie si possible.'],
      solution: `$${expr} = ${conv} = ${N}/${L}${fracStr(res) !== `${N}/${L}` ? ` = ${fracStr(res)}` : ''}$`,
    });
  },
  /** k ± a/b ± c/d : un entier à écrire en fraction */
  entier(rand, o, mode) {
    const ops = fsOps(rand, o, 2);
    let b; let d; let L; let k; let A; let C; let res; let mcs;
    do {
      [b, d] = dens2(rand, mode); L = lcm(b, d);
      k = ri(rand, 1, 4); A = [numFor(rand, b, b - 1), b]; C = [numFor(rand, d), d];
      res = combine([[k, 1], A, C], ops);
      mcs = [mc(fracStr(combine([frac(ops[0] === '+' ? k + A[0] : k - A[0], b), C], [ops[1]])), 'mc:entier-au-numerateur', 'notion', `${k} ${ops[0]} ${fm(A)} n’est pas (${k} ${ops[0]} ${A[0]})/${b} : écris d’abord ${k} = ${k * b}/${b}.`),
        mc(fracStr(frac(signedSum([k, A[0], C[0]], ops), b + d)), 'mc:ajouter-denominateurs', 'notion', `On n’ajoute ni les numérateurs ni les dénominateurs tels quels : on écrit tout avec le dénominateur ${L}.`)];
    } while (!res[0] || !fdistinct(res, mcs.map((m) => readFrac(m.answer))));
    const expr = `${k} ${ops[0]} ${fm(A)} ${ops[1]} ${fm(C)}`;
    const N = signedSum([k * L, (A[0] * L) / b, (C[0] * L) / d], ops);
    return fracResult(res, {
      prompt: `Calcule et donne le résultat sous la forme d’${formTxt(res)} : $${expr}$`, expectedSeconds: 140, misconceptions: mcs,
      hints: [`Un entier s’écrit comme une fraction : ${k} = ${k * L}/${L}.`, `Avec le dénominateur ${L} : $${fm(A)} = ${(A[0] * L) / b}/${L}$ et $${fm(C)} = ${(C[0] * L) / d}/${L}$.`, 'Calcule le numérateur, puis simplifie.'],
      solution: `$${expr} = ${k * L}/${L} ${ops[0]} ${(A[0] * L) / b}/${L} ${ops[1]} ${(C[0] * L) / d}/${L} = ${N}/${L}${fracStr(res) !== `${N}/${L}` ? ` = ${fracStr(res)}` : ''}$`,
    });
  },
  /** a/b + x = c/d (ou a/b − x = c/d, x − a/b = c/d) : retrouver la fraction manquante */
  manquant(rand, o, mode) {
    const form = o.op === 'addition' ? 'plus' : o.op === 'soustraction' ? pick(rand, ['moins', 'xmoins']) : pick(rand, ['plus', 'moins', 'xmoins']);
    let b; let d; let L; let A; let C; let x; let eq; let calc; let mcs;
    do {
      [b, d] = dens2(rand, mode); L = lcm(b, d);
      A = [numFor(rand, b), b]; C = [numFor(rand, d), d];
      if (form === 'plus') {
        x = fsub(C, A); eq = `${fm(A)} + x = ${fm(C)}`; calc = [C, '−', A];
        mcs = [mc(fracStr(frac(C[0] - A[0], d - b)), 'mc:ajouter-denominateurs', 'notion', `On ne soustrait pas les dénominateurs : on écrit d’abord les deux fractions avec le dénominateur ${L}.`), mc(fracStr(fadd(C, A)), 'mc:operation-reciproque', 'raisonnement', `On a ajouté x à ${fm(A)} : pour retrouver x, on soustrait ${fm(A)}.`)];
      } else if (form === 'moins') {
        x = fsub(A, C); eq = `${fm(A)} − x = ${fm(C)}`; calc = [A, '−', C];
        mcs = [mc(fracStr(fsub(C, A)), 'mc:ordre-soustraction', 'signe', `x est ce qu’on retire à ${fm(A)} : x = ${fm(A)} − ${fm(C)}, pas l’inverse.`), mc(fracStr(fadd(A, C)), 'mc:operation-reciproque', 'raisonnement', 'Vérifie en remplaçant x par ta réponse dans l’égalité.')];
      } else {
        x = fadd(C, A); eq = `x − ${fm(A)} = ${fm(C)}`; calc = [C, '+', A];
        mcs = [mc(fracStr(fsub(C, A)), 'mc:operation-reciproque', 'raisonnement', `On a retiré ${fm(A)} à x : pour retrouver x, on rajoute ${fm(A)}.`), mc(fracStr(frac(C[0] + A[0], d + b)), 'mc:ajouter-denominateurs', 'notion', `On n’additionne pas les dénominateurs : on écrit les deux fractions avec le dénominateur ${L}.`)];
      }
    } while (x[0] <= 0 || !fdistinct(x, mcs.map((m) => readFrac(m.answer))));
    const [P, s, Q] = calc;
    const calcTxt = `${fm(P)} ${s} ${fm(Q)}`;
    const conv = `${(P[0] * L) / P[1]}/${L} ${s} ${(Q[0] * L) / Q[1]}/${L}`;
    return fracResult(x, {
      prompt: `Trouve la fraction x telle que $${eq}$. Donne-la sous la forme d’${formTxt(x)}.`, expectedSeconds: 150, misconceptions: mcs,
      hints: ['Quelle opération permet de retrouver x ?', `x = ${calcTxt}.`, `Mets les deux fractions au même dénominateur (${L}), puis simplifie.`],
      solution: `$x = ${calcTxt} = ${conv} = ${fracStr(x)}$. Vérification : en remplaçant x par $${fm(x)}$, l’égalité est vraie.`,
    });
  },
};

const RESTE = [
  (A, B) => `Dans un collège, $${A}$ des élèves viennent à pied et $${B}$ en bus ; les autres viennent à vélo. Quelle fraction des élèves vient à vélo ?`,
  (A, B) => `Léa a dépensé $${A}$ de son argent de poche pour un livre et $${B}$ pour une place de cinéma. Quelle fraction de son argent de poche lui reste-t-il ?`,
  (A, B) => `Un jardin est planté pour $${A}$ de tomates et pour $${B}$ de salades ; le reste est fleuri. Quelle fraction du jardin est fleurie ?`,
  (A, B) => `Pendant une randonnée, on parcourt $${A}$ du trajet le matin et $${B}$ en début d’après-midi. Quelle fraction du trajet reste-t-il à parcourir ?`,
  (A, B) => `Quelle fraction faut-il ajouter à $${A} + ${B}$ pour obtenir 1 ?`,
];

const FS_EXPERT = {
  /** a/b ± n/d = S : retrouver le numérateur n (S est donnée simplifiée) */
  numerateur(rand, o, mode) {
    const sub = o.op === 'soustraction' || (o.op !== 'addition' && rand() < 0.5);
    let b; let d; let a; let n; let S; let L2; let diff; let w1; let w2;
    do {
      [b, d] = dens2(rand, mode);
      a = numFor(rand, b); n = ri(rand, 1, 2 * d);
      S = sub ? fsub([a, b], [n, d]) : fadd([a, b], [n, d]);
      L2 = lcm(S[1], b); diff = frac(n, d);
      w1 = sub ? a - S[0] : S[0] - a; w2 = (diff[0] * L2) / diff[1];
    } while (S[0] <= 0 || S[1] === d || L2 === d || !distinct(n, [w1, w2]));
    const eq = `${a}/${b} ${sub ? '−' : '+'} n/${d} = ${fm(S)}`;
    const calc = sub ? `${a}/${b} − ${fm(S)}` : `${fm(S)} − ${a}/${b}`;
    return numeric(n, {
      prompt: `Trouve le nombre entier n tel que $${eq}$.`, expectedSeconds: 210,
      misconceptions: [mc(w1, 'mc:numerateur-non-converti', 'notion', `On ne peut pas ${sub ? 'soustraire' : 'comparer'} les numérateurs directement : les fractions n’ont pas le même dénominateur.`),
        mc(w2, 'mc:denominateur-oublie', 'notion', `Tu as trouvé $n/${d}$ écrite avec le dénominateur ${L2} : écris-la avec le dénominateur ${d} pour lire n.`)],
      hints: [`Calcule d’abord $n/${d}$ : $n/${d} = ${calc}$.`, `Tu trouves $${fm(diff)}$ : écris cette fraction avec le dénominateur ${d}.`, 'Vérifie en remplaçant n par ta réponse.'],
      solution: `$n/${d} = ${calc} = ${fm(diff)}${diff[1] === d ? '' : ` = ${n}/${d}`}$, donc n = ${n}.`,
    });
  },
  /** 1 − a/b − c/d : la part qui reste (un tout vaut 1) */
  reste(rand, o, mode) {
    let b; let d; let L; let A; let C; let S; let res; let mcs;
    do {
      [b, d] = dens2(rand, mode); L = lcm(b, d);
      A = [numFor(rand, b, b - 1), b]; C = [numFor(rand, d, d - 1), d]; S = fadd(A, C); res = fsub([1, 1], S);
      mcs = [mc(fracStr(S), 'mc:complement-oublie', 'raisonnement', `$${fm(S)}$ est la part des deux premiers groupes : il faut encore la retirer du total, qui vaut 1.`),
        mc(fracStr(frac(b + d - A[0] - C[0], b + d)), 'mc:ajouter-denominateurs', 'notion', `On n’additionne pas les dénominateurs : $${fm(A)} + ${fm(C)}$ se calcule avec le dénominateur commun ${L}.`),
        mc(fracStr(frac(L - A[0] - C[0], L)), 'mc:numerateur-non-converti', 'notion', `Avec le dénominateur ${L}, les numérateurs changent aussi : $${fm(A)} = ${(A[0] * L) / b}/${L}$.`)];
    } while (res[0] <= 0 || !fdistinct(res, mcs.map((m) => readFrac(m.answer))));
    return fracResult(res, {
      prompt: `${pick(rand, RESTE)(fm(A), fm(C))} Donne la réponse sous la forme d’${formTxt(res)}.`, expectedSeconds: 180, representation: 'concrete', misconceptions: mcs,
      hints: [`Le tout correspond à 1, c’est-à-dire $${L}/${L}$.`, `Calcule d’abord $${fm(A)} + ${fm(C)} = ${fm(S)}$.`, `Retire cette part du tout : $1 − ${fm(S)}$.`],
      solution: `$${fm(A)} + ${fm(C)} = ${(A[0] * L) / b}/${L} + ${(C[0] * L) / d}/${L} = ${fm(S)}$ ; il reste $1 − ${fm(S)} = ${fracStr(res)}$.`,
    });
  },
  /** a/b − (c/d − e/f) ou k − (a/b + c/d) : le « − » devant la parenthèse change tous les signes */
  parentheses(rand, o, mode) {
    let expr; let res; let mcs; let hint;
    if (rand() < 0.5) {
      let dens; let F;
      do {
        dens = dens3(rand, mode);
        F = dens.map((dd) => [numFor(rand, dd), dd]);
        res = fadd(fsub(F[0], F[1]), F[2]);
        mcs = [mc(fracStr(fsub(fsub(F[0], F[1]), F[2])), 'mc:moins-devant-parenthese', 'signe', `Le « − » devant la parenthèse change le signe de chaque terme : $− (${fm(F[1])} − ${fm(F[2])}) = − ${fm(F[1])} + ${fm(F[2])}$.`),
          mc(fracStr(frac(F[0][0] - F[1][0] + F[2][0], dens[0] + dens[1] + dens[2])), 'mc:ajouter-denominateurs', 'notion', 'On n’additionne pas les dénominateurs : on cherche un dénominateur commun.')];
        if (res[0] < 0) mcs.push(mc(fracStr(fneg(res)), 'mc:signe-resultat', 'signe', SIGN_FB));
      } while (!res[0] || res[1] > 72 || !fdistinct(res, mcs.map((m) => readFrac(m.answer))));
      expr = `${fm(F[0])} − (${fm(F[1])} − ${fm(F[2])})`;
      hint = `Calcule d’abord la parenthèse : $${fm(F[1])} − ${fm(F[2])} = ${fm(fsub(F[1], F[2]))}$.`;
    } else {
      let b; let d; let k; let A; let C;
      do {
        [b, d] = dens2(rand, mode);
        k = ri(rand, 1, 3); A = [numFor(rand, b), b]; C = [numFor(rand, d), d];
        res = fsub([k, 1], fadd(A, C));
        mcs = [mc(fracStr(fadd(fsub([k, 1], A), C)), 'mc:moins-devant-parenthese', 'signe', `Le « − » porte sur toute la parenthèse : $${k} − (${fm(A)} + ${fm(C)}) = ${k} − ${fm(A)} − ${fm(C)}$.`),
          mc(fracStr(fsub([k, 1], frac(A[0] + C[0], b + d))), 'mc:ajouter-denominateurs', 'notion', 'Dans la parenthèse, on n’additionne pas les dénominateurs : on cherche un dénominateur commun.')];
        if (res[0] < 0) mcs.push(mc(fracStr(fneg(res)), 'mc:signe-resultat', 'signe', SIGN_FB));
      } while (!res[0] || !fdistinct(res, mcs.map((m) => readFrac(m.answer))));
      expr = `${k} − (${fm(A)} + ${fm(C)})`;
      hint = `Calcule d’abord la parenthèse : $${fm(A)} + ${fm(C)} = ${fm(fadd(A, C))}$.`;
    }
    return fracResult(res, {
      prompt: `Calcule et donne le résultat sous la forme d’${formTxt(res)} : $${expr}$`, expectedSeconds: 180, misconceptions: mcs,
      hints: [hint, 'Puis effectue la soustraction en mettant au même dénominateur.', 'Le résultat peut être négatif.'],
      solution: `$${expr} = ${fracStr(res)}$. ${hint.replace('Calcule d’abord la parenthèse : ', 'La parenthèse : ')}`,
    });
  },
};

/* ------------------------- fractions : produits --------------------------- */

/** Fraction irréductible positive (dénominateur 2 à 9) ; signée au hasard avec `neg`. */
function rf(rand, neg = 0) {
  const d = ri(rand, 2, 9); const n = numFor(rand, d, 9);
  return [rand() < neg ? -n : n, d];
}
const inv = (f) => frac(f[1], f[0]);
const asFracs = (mcs) => mcs.map((m) => readFrac(m.answer));
const INV_HINT = 'Diviser par une fraction, c’est multiplier par son inverse.';

/** Calcul de fractions dont le résultat est une fraction irréductible. */
const fracCalc = (res, expr, rest) => fracResult(res, { prompt: `Calcule et donne le résultat sous la forme d’${formTxt(res)} : $${expr}$`, ...rest });

const FP_APPRO = {
  /** (−a/b) × (c/d) × (e/f) : signe, puis simplification avant de multiplier */
  trois(rand) {
    let F; let P; let N; let D; let mcs;
    do {
      F = [rf(rand, 0.45), rf(rand, 0.45), rf(rand, 0.45)];
      N = F.reduce((p, f) => p * f[0], 1); D = F.reduce((p, f) => p * f[1], 1); P = frac(N, D);
      mcs = [mc(fracStr(fneg(P)), 'mc:regle-signes', 'signe', `Il y a ${negWord(F.filter((f) => f[0] < 0).length)} : applique la règle des signes.`),
        mc(fracStr(frac(N, F[0][1] + F[1][1] + F[2][1])), 'mc:ajouter-denominateurs', 'notion', 'Dans un produit de fractions, les dénominateurs se multiplient aussi.')];
    } while (!F.some((f) => f[0] < 0) || gcd(N, D) < 4 || P[1] > 40 || !fdistinct(P, asFracs(mcs)));
    const negs = F.filter((f) => f[0] < 0).length;
    const expr = F.map(fp).join(' × ');
    const raw = `(${F.map((f) => Math.abs(f[0])).join(' × ')})/(${F.map((f) => f[1]).join(' × ')})`;
    return fracCalc(P, expr, {
      expectedSeconds: 150, misconceptions: mcs,
      hints: [signHint, 'Avant de multiplier, simplifie : décompose numérateurs et dénominateurs et barre les facteurs communs.', `Distance à zéro : $${raw}$`],
      solution: `${negWord(negs)} → produit ${negs % 2 ? 'négatif' : 'positif'}. $${expr} = ${negs % 2 ? '−' : ''}${raw} = ${fracStr(P)}$`,
    });
  },
  /** k × (a/b) : seul le numérateur est multiplié, puis on simplifie */
  entier(rand) {
    let k; let A; let ans;
    do { const b = ri(rand, 3, 12); A = [numFor(rand, b, 11), b]; k = nz(rand, -12, 12); ans = fmul([k, 1], A); } while (Math.abs(k) < 2 || gcd(k, A[1]) < 2 || !fdistinct(ans, [A, fneg(ans)]));
    const expr = rand() < 0.5 ? `${fr(k)} × ${fp(A)}` : `${fp(A)} × ${par(k)}`;
    const mcs = [mc(fracStr(A), 'mc:entier-deux-termes', 'notion', `Multiplier une fraction par ${fr(k)}, c’est multiplier son numérateur seulement : on ne multiplie pas aussi le dénominateur.`)];
    // la fraction est toujours positive : la règle des signes ne joue que si l'entier est négatif
    if (k < 0) mcs.push(mc(fracStr(fneg(ans)), 'mc:regle-signes', 'signe', `Un facteur négatif (${fr(k)}) et un facteur positif ($${fm(A)}$) : le produit est négatif.`));
    return fracCalc(ans, expr, {
      expectedSeconds: 75,
      misconceptions: mcs,
      hints: [`$${par(k)} × ${A[0]}/${A[1]} = (${fr(k)} × ${A[0]})/${A[1]}$ : seul le numérateur est multiplié.`, `Simplifie : ${Math.abs(k)} et ${A[1]} ont ${gcd(k, A[1])} comme diviseur commun.`],
      solution: `$${expr} = (${fr(k)} × ${A[0]})/${A[1]} = ${fr(k * A[0])}/${A[1]} = ${fracStr(ans)}$`,
    });
  },
  /** (a/b) × x = c/d : le facteur manquant */
  manquant(rand) {
    let A; let C; let x; let mcs;
    do {
      A = rf(rand, 0.4); C = rf(rand, 0.4); x = fdiv(C, A);
      mcs = [mc(fracStr(fmul(C, A)), 'mc:operation-reciproque', 'raisonnement', `x est un facteur : on divise le produit $${fm(C)}$ par le facteur connu, on ne multiplie pas.`),
        mc(fracStr(fdiv(A, C)), 'mc:quotient-inverse', 'raisonnement', `C’est le produit qu’on divise par le facteur connu : x = $${fp(C)} ÷ ${fp(A)}$, pas l’inverse.`)];
    } while (x[1] > 60 || !fdistinct(x, asFracs(mcs)));
    return fracResult(x, {
      prompt: `Trouve le nombre x tel que $${fp(A)} × x = ${fm(C)}$. Donne-le sous la forme d’${formTxt(x)}.`, expectedSeconds: 120, misconceptions: mcs,
      hints: ['x est le facteur manquant : on divise le produit par le facteur connu.', `$x = ${fp(C)} ÷ ${fp(A)}$`, `${INV_HINT} L’inverse de $${fm(A)}$ est $${fm(inv(A))}$.`],
      solution: `$x = ${fp(C)} ÷ ${fp(A)} = ${fp(C)} × ${fp(inv(A))} = ${fracStr(x)}$. Vérification : $${fp(A)} × ${fp(x)} = ${fm(C)}$.`,
    });
  },
  /** (a/b) ÷ k ou k ÷ (a/b) */
  entierDiv(rand) {
    let k; let A; let ans; let mcs; let expr; let detail;
    const first = rand() < 0.5;
    do {
      k = nz(rand, -9, 9); A = rf(rand, 0.3);
      if (first) {
        ans = fdiv(A, [k, 1]); expr = `${fp(A)} ÷ ${par(k)}`; detail = `${fp(A)} × (1/${par(k)})`;
        mcs = [mc(fracStr(fmul(A, [k, 1])), 'mc:division-sans-inverse', 'notion', `Diviser par ${fr(k)}, c’est multiplier par son inverse $1/${par(k)}$ : le dénominateur est multiplié par ${fr(k)}.`), mc(fracStr(A), 'mc:diviser-les-deux', 'notion', 'Diviser le numérateur et le dénominateur par le même nombre ne change pas la fraction : ce n’est pas une division.')];
      } else {
        ans = fdiv([k, 1], A); expr = `${fr(k)} ÷ ${fp(A)}`; detail = `${par(k)} × ${fp(inv(A))}`;
        mcs = [mc(fracStr(fmul([k, 1], A)), 'mc:division-sans-inverse', 'notion', `Diviser par $${fm(A)}$, c’est multiplier par son inverse $${fm(inv(A))}$.`), mc(fracStr(fdiv(A, [k, 1])), 'mc:inverser-premiere', 'notion', 'C’est le diviseur (la fraction) qu’on inverse, pas le premier nombre.')];
      }
      if (ans[0] < 0) mcs.push(mc(fracStr(fneg(ans)), 'mc:regle-signes', 'signe', 'Pour un quotient, la règle des signes est la même que pour un produit.'));
    } while (Math.abs(k) < 2 || !fdistinct(ans, asFracs(mcs)));
    return fracCalc(ans, expr, {
      expectedSeconds: 90, misconceptions: mcs,
      hints: [INV_HINT, `$${expr} = ${detail}$`, 'Simplifie le résultat.'],
      solution: `$${expr} = ${detail} = ${fracStr(ans)}$`,
    });
  },
  /** (a/b) ÷ (c/d) × (e/f) : de gauche à droite */
  chaine(rand) {
    let A; let B; let C; let ans; let mcs;
    do {
      A = rf(rand, 0.3); B = rf(rand, 0.3); C = rf(rand, 0.3);
      ans = fmul(fdiv(A, B), C);
      mcs = [mc(fracStr(fdiv(A, fmul(B, C))), 'mc:multiplication-prioritaire', 'notion', 'La multiplication n’est pas prioritaire sur la division : on calcule de gauche à droite.'),
        mc(fracStr(fmul(fmul(A, B), C)), 'mc:division-sans-inverse', 'notion', `Diviser par $${fm(B)}$, c’est multiplier par son inverse $${fm(inv(B))}$.`)];
    } while (ans[1] > 60 || !fdistinct(ans, asFracs(mcs)));
    const expr = `${fp(A)} ÷ ${fp(B)} × ${fp(C)}`;
    return fracCalc(ans, expr, {
      expectedSeconds: 150, misconceptions: mcs,
      hints: ['Multiplications et divisions : on calcule de gauche à droite.', `${INV_HINT} $${fp(A)} ÷ ${fp(B)} = ${fp(A)} × ${fp(inv(B))}$`, 'Simplifie avant de multiplier.'],
      solution: `$${expr} = ${fp(A)} × ${fp(inv(B))} × ${fp(C)} = ${fracStr(ans)}$`,
    });
  },
  /** x ÷ (a/b) = c/d ou (a/b) ÷ x = c/d */
  manquantDiv(rand) {
    let A; let C; let x; let mcs; let eq; let calc;
    const dividend = rand() < 0.5;
    do {
      A = rf(rand, 0.3); C = rf(rand, 0.3);
      if (dividend) {
        x = fmul(C, A); eq = `x ÷ ${fp(A)} = ${fm(C)}`; calc = `${fp(C)} × ${fp(A)}`;
        mcs = [mc(fracStr(fdiv(C, A)), 'mc:operation-reciproque', 'raisonnement', `x a été divisé par $${fm(A)}$ : pour le retrouver, on multiplie $${fm(C)}$ par $${fm(A)}$.`)];
      } else {
        x = fdiv(A, C); eq = `${fp(A)} ÷ x = ${fm(C)}`; calc = `${fp(A)} ÷ ${fp(C)}`;
        mcs = [mc(fracStr(fmul(A, C)), 'mc:operation-reciproque', 'raisonnement', 'x est le diviseur : x = dividende ÷ quotient (on ne multiplie pas).'), mc(fracStr(fdiv(C, A)), 'mc:quotient-inverse', 'raisonnement', `x = $${fp(A)} ÷ ${fp(C)}$ (dividende ÷ quotient), pas l’inverse.`)];
      }
    } while (x[1] > 60 || !fdistinct(x, asFracs(mcs)));
    return fracResult(x, {
      prompt: `Trouve le nombre x tel que $${eq}$. Donne-le sous la forme d’${formTxt(x)}.`, expectedSeconds: 120, misconceptions: mcs,
      hints: [dividend ? 'On a divisé x : pour le retrouver, on fait l’opération inverse.' : 'x est le diviseur : diviseur = dividende ÷ quotient.', `$x = ${calc}$`, INV_HINT],
      solution: `$x = ${calc} = ${fracStr(x)}$. Vérification : en remplaçant x par $${fm(x)}$, l’égalité est vraie.`,
    });
  },
};

const FP_EXPERT = {
  /** a/b ± (c/d) × (e/f) : priorités avec des fractions relatives */
  prioMul(rand) {
    let A; let B; let C; let plus; let P; let res; let mcs;
    do {
      A = rf(rand, 0.4); B = rf(rand); C = rf(rand); plus = rand() < 0.4; P = fmul(B, C);
      res = plus ? fadd(A, P) : fsub(A, P);
      mcs = [mc(fracStr(fmul(plus ? fadd(A, B) : fsub(A, B), C)), 'mc:gauche-a-droite', 'notion', `La multiplication passe avant ${plus ? 'l’addition' : 'la soustraction'} : on calcule d’abord $${fp(B)} × ${fp(C)}$.`)];
      if (plus || A[1] !== P[1]) mcs.push(mc(fracStr(frac(plus ? A[0] + P[0] : A[0] - P[0], plus ? A[1] + P[1] : A[1] - P[1])), 'mc:ajouter-denominateurs', 'notion', 'Pour ajouter ou soustraire des fractions, on les écrit d’abord avec le même dénominateur.'));
    } while (!res[0] || P[1] === 1 || res[1] > 72 || !fdistinct(res, asFracs(mcs)));
    const s = plus ? '+' : '−';
    const expr = `${fm(A)} ${s} ${fp(B)} × ${fp(C)}`;
    return fracCalc(res, expr, {
      expectedSeconds: 210, misconceptions: mcs, skills: ['m4.fractions.calcul'],
      hints: [`Priorités : la multiplication passe avant ${plus ? 'l’addition' : 'la soustraction'}.`, `$${fp(B)} × ${fp(C)} = ${fm(P)}$`, `Calcule ensuite $${fm(A)} ${s} ${fm(P)}$ avec un dénominateur commun (${lcm(A[1], P[1])}).`],
      solution: `$${expr} = ${fm(A)} ${s} ${fm(P)} = ${fracStr(res)}$`,
    });
  },
  /** (−a/b)² × (c/d) ou −(a/b)² × (c/d) : le carré d'une fraction, et son signe */
  carre(rand) {
    const minus = rand() < 0.4;
    let a; let b; let C; let S; let ans; let mcs;
    do {
      b = ri(rand, 2, 6); a = numFor(rand, b, 5); const d = ri(rand, 2, 9); C = [numFor(rand, d, 12), d]; S = [a * a, b * b];
      ans = minus ? fneg(fmul(S, C)) : fmul(S, C);
      mcs = minus
        ? [mc(fracStr(fneg(ans)), 'mc:moins-carre', 'signe', `Le signe « − » est devant le carré : seul $${a}/${b}$ est élevé au carré, le résultat reste négatif.`), mc(fracStr(fneg(fmul([a * a, b], C))), 'mc:puissance-numerateur', 'notion', `$(${a}/${b})² = ${a * a}/${b * b}$ : le numérateur ET le dénominateur sont élevés au carré.`)]
        : [mc(fracStr(fneg(ans)), 'mc:carre-negatif', 'signe', `Le carré d’un nombre négatif est positif : $(−${a}/${b})² = ${a * a}/${b * b}$.`), mc(fracStr(fmul([a * a, b], C)), 'mc:puissance-numerateur', 'notion', 'Le numérateur ET le dénominateur sont élevés au carré.'), mc(fracStr(fmul([-2 * a, b], C)), 'mc:carre-double', 'notion', `$(−${a}/${b})²$ = $(−${a}/${b}) × (−${a}/${b})$, pas $2 × (−${a}/${b})$.`)];
    } while (gcd(a * a * C[0], b * b * C[1]) < 2 || !fdistinct(ans, asFracs(mcs)));
    const expr = minus ? `−(${a}/${b})² × ${fp(C)}` : `(−${a}/${b})² × ${fp(C)}`;
    return fracCalc(ans, expr, {
      expectedSeconds: 150, misconceptions: mcs, skills: ['m4.puissances'],
      hints: ['La puissance d’abord : $(p/q)² = p²/q²$.', minus ? `$−(${a}/${b})² = −${a * a}/${b * b}$ : le « − » n’est pas élevé au carré.` : `$(−${a}/${b})² = ${a * a}/${b * b}$ (deux facteurs négatifs).`, 'Multiplie ensuite, en simplifiant avant.'],
      solution: `$${expr} = ${minus ? '−' : ''}(${a * a}/${b * b}) × ${fp(C)} = ${fracStr(ans)}$`,
    });
  },
  /** par quelle fraction multiplier a/b pour obtenir l'inverse de c/d ? */
  inverse(rand) {
    let A; let C; let iC; let ans; let mcs;
    do {
      A = rf(rand, 0.6); C = rf(rand, 0.3); iC = inv(C); ans = fdiv(iC, A);
      mcs = [mc(fracStr(fdiv(C, A)), 'mc:inverse-oublie', 'notion', `On veut obtenir l’inverse de $${fm(C)}$, c’est-à-dire $${fm(iC)}$, pas $${fm(C)}$ lui-même.`),
        mc(fracStr(fneg(ans)), 'mc:regle-signes', 'signe', 'Vérifie le signe : le produit doit avoir le signe de l’inverse cherché.'),
        mc(fracStr(fmul(iC, A)), 'mc:operation-reciproque', 'raisonnement', 'On cherche un facteur manquant : on divise, on ne multiplie pas.')];
    } while (ans[1] > 60 || !fdistinct(ans, asFracs(mcs)));
    const prompt = rand() < 0.5
      ? `Par quel nombre faut-il multiplier $${fm(A)}$ pour obtenir l’inverse de $${fm(C)}$ ? Donne-le sous la forme d’${formTxt(ans)}.`
      : `On cherche x tel que $${fp(A)} × x$ soit égal à l’inverse de $${fm(C)}$. Donne x sous la forme d’${formTxt(ans)}.`;
    return fracResult(ans, {
      prompt, expectedSeconds: 180, misconceptions: mcs, skills: ['m4.fractions.inverse'],
      hints: [`L’inverse de $${fm(C)}$ est $${fm(iC)}$ (leur produit vaut 1).`, `On cherche x tel que $${fp(A)} × x = ${fm(iC)}$ : $x = ${fp(iC)} ÷ ${fp(A)}$.`, INV_HINT],
      solution: `L’inverse de $${fm(C)}$ est $${fm(iC)}$. $x = ${fp(iC)} ÷ ${fp(A)} = ${fp(iC)} × ${fp(inv(A))} = ${fracStr(ans)}$.`,
    });
  },
  /** a/b + (c/d) ÷ (e/f) ou (a/b − c/d) ÷ (e/f) */
  prioDiv(rand) {
    const t1 = rand() < 0.5;
    let A; let B; let C; let res; let mcs;
    do {
      A = rf(rand, 0.3); B = rf(rand); C = rf(rand);
      if (t1) {
        res = fadd(A, fdiv(B, C));
        mcs = [mc(fracStr(fdiv(fadd(A, B), C)), 'mc:gauche-a-droite', 'notion', 'La division passe avant l’addition : on calcule d’abord le quotient.'), mc(fracStr(fadd(A, fmul(B, C))), 'mc:division-sans-inverse', 'notion', `Diviser par $${fm(C)}$, c’est multiplier par $${fm(inv(C))}$.`)];
      } else {
        res = fdiv(fsub(A, B), C);
        mcs = [mc(fracStr(fmul(fsub(A, B), C)), 'mc:division-sans-inverse', 'notion', `Diviser par $${fm(C)}$, c’est multiplier par $${fm(inv(C))}$.`), mc(fracStr(fsub(A, fdiv(B, C))), 'mc:parentheses-ignorees', 'notion', 'La parenthèse est prioritaire : on calcule d’abord la différence, puis on divise.')];
      }
    } while (!res[0] || res[1] > 72 || (!t1 && !fsub(A, B)[0]) || !fdistinct(res, asFracs(mcs)));
    const expr = t1 ? `${fm(A)} + ${fp(B)} ÷ ${fp(C)}` : `(${fm(A)} − ${fm(B)}) ÷ ${fp(C)}`;
    const first = t1 ? fdiv(B, C) : fsub(A, B);
    return fracCalc(res, expr, {
      expectedSeconds: 210, misconceptions: mcs, skills: ['m4.fractions.calcul'],
      hints: [t1 ? 'Priorités : la division passe avant l’addition.' : 'La parenthèse d’abord.', t1 ? `$${fp(B)} ÷ ${fp(C)} = ${fp(B)} × ${fp(inv(C))} = ${fm(first)}$` : `$${fm(A)} − ${fm(B)} = ${fm(first)}$`, INV_HINT],
      solution: `$${expr} = ${t1 ? `${fm(A)} + ${fm(first)}` : `${fp(first)} × ${fp(inv(C))}`} = ${fracStr(res)}$`,
    });
  },
  /** « Les p/q des r/s d'un nombre valent N » : retrouver le nombre */
  fractionDe(rand) {
    let p; let q; let r; let s; let F; let X; let N; let vals;
    do {
      q = ri(rand, 2, 7); p = numFor(rand, q, q - 1); s = ri(rand, 2, 9); r = numFor(rand, s, s - 1);
      F = frac(p * r, q * s); const t = ri(rand, 2, 6); X = F[1] * t; N = F[0] * t;
      vals = [(N * F[0]) / F[1], N / (p / q + r / s), N / (p / q)];
    } while ((p === r && q === s) || X > 400 || !distinct(X, vals));
    const ctx = pick(rand, [
      { txt: `d’un nombre valent ${N}. Quel est ce nombre ?`, rest: {} },
      { txt: `d’une somme d’argent représentent ${N} €. Quelle est cette somme (en euros) ?`, rest: {} },
      { txt: `d’un trajet représentent ${N} km. Quelle est la longueur du trajet ?`, rest: { unit: 'km', unitOptional: true } },
    ]);
    return numeric(X, {
      prompt: `Les $${p}/${q}$ des $${r}/${s}$ ${ctx.txt}`, expectedSeconds: 210, representation: 'concrete', ...ctx.rest,
      misconceptions: [mc(clean(vals[0]), 'mc:operation-reciproque', 'raisonnement', `On connaît la partie (${N}), on cherche le tout : on divise par la fraction $${fm(F)}$, on ne multiplie pas.`),
        mc(clean(vals[1]), 'mc:de-addition', 'notion', `« Les ${p}/${q} DES ${r}/${s} » : « des » se traduit par une multiplication, pas par une somme.`),
        mc(clean(vals[2]), 'mc:fraction-oubliee', 'raisonnement', `Les deux fractions s’appliquent l’une après l’autre : la partie connue vaut les $${fm(F)}$ du nombre.`)],
      hints: [`« Les ${p}/${q} des ${r}/${s} » : calcule $(${p}/${q}) × (${r}/${s})$.`, `Cette fraction du nombre vaut ${N} : le nombre vaut ${N} ÷ $${fm(F)}$.`, INV_HINT],
      solution: `$(${p}/${q}) × (${r}/${s}) = ${fm(F)}$ ; le nombre vaut ${N} ÷ $${fm(F)}$ = ${N} × $${fm(inv(F))}$ = ${X}. Vérification : les $${fm(F)}$ de ${X} valent ${N}.`,
    });
  },
};

/* ------------------------------- puissances ------------------------------- */

const ASK_N = 'Quelle est la valeur de n ?';
const SCI = 'en notation scientifique $c × 10^n$ (avec 1 ≤ c < 10)';

const PU_APPRO = {
  valeur(rand) {
    const t = ri(rand, 1, 3);
    if (t === 3) {
      // (±a/b)^n : puissance d'une fraction
      let b; let a; let n; let base; let ans; let mcs;
      do {
        b = ri(rand, 2, 5); a = numFor(rand, b, 4); n = ri(rand, 2, 3); base = [rand() < 0.5 ? -a : a, b]; ans = frac(base[0] ** n, b ** n);
        mcs = [mc(fracStr(frac(base[0] ** n, b)), 'mc:puissance-numerateur', 'notion', `Le numérateur ET le dénominateur sont élevés à la puissance ${n} : $(${fm(base)})^${n} = ${par(base[0])}^${n}/${b}^${n}$.`),
          mc(fracStr(frac(base[0] * n, b)), 'mc:puissance-produit', 'notion', `L’exposant ${n} indique ${n} facteurs égaux : ce n’est pas une multiplication par ${n}.`)];
        if (base[0] < 0 && n % 2) mcs.push(mc(fracStr(fneg(ans)), 'mc:regle-signes', 'signe', `${n} facteurs négatifs : le résultat est négatif.`));
      } while (!fdistinct(ans, asFracs(mcs)));
      const expr = `(${fm(base)})^${n}`;
      return fracCalc(ans, expr, {
        expectedSeconds: 90, misconceptions: mcs, skills: ['m4.fractions.produit'],
        hints: [`Écris le produit : $${Array(n).fill(fp(base)).join(' × ')}$.`, 'Numérateurs entre eux, dénominateurs entre eux.', base[0] < 0 ? `Signe : ${n} facteurs négatifs.` : 'Vérifie que la fraction est irréductible.'],
        solution: `$${expr} = ${Array(n).fill(fp(base)).join(' × ')} = ${fracStr(ans)}$`,
      });
    }
    let expr; let ans; let vals; let fbs;
    if (t === 1) {
      // −a² + (−b)³
      let a; let b;
      do { a = ri(rand, 2, 9); b = ri(rand, 2, 4); ans = -a * a + (-b) ** 3; vals = [a * a + (-b) ** 3, -a * a + b ** 3, -2 * a - 3 * b]; } while (!distinct(ans, vals));
      expr = `−${a}² + (−${b})³`;
      fbs = [['mc:moins-carre', 'signe', `$−${a}² = −(${a}²) = ${fr(-a * a)}$ : le carré porte seulement sur ${a}, pas sur le signe « − ».`],
        ['mc:regle-signes', 'signe', `$(−${b})³$ : trois facteurs négatifs, le résultat est négatif.`],
        ['mc:puissance-produit', 'notion', `$${a}² = ${a} × ${a}$ (et non ${a} × 2) ; $(−${b})³ = (−${b}) × (−${b}) × (−${b})$.`]];
    } else {
      // k × (−b)^n − a²
      let k; let b; let n; let a;
      do { k = ri(rand, 2, 5); b = ri(rand, 2, 3); n = ri(rand, 2, 4); a = ri(rand, 2, 9); ans = k * (-b) ** n - a * a; vals = [(-k * b) ** n - a * a, -k * (-b) ** n - a * a, k * -b * n - 2 * a]; } while (!distinct(ans, vals));
      expr = `${k} × (−${b})^${n} − ${a}²`;
      fbs = [['mc:puissance-prioritaire', 'notion', `La puissance passe avant la multiplication : on calcule $(−${b})^${n} = ${fr((-b) ** n)}$, puis on multiplie par ${k}.`],
        ['mc:regle-signes', 'signe', `$(−${b})^${n}$ : ${n} facteurs négatifs, le résultat est ${n % 2 ? 'négatif' : 'positif'}.`],
        ['mc:puissance-produit', 'notion', `L’exposant compte des facteurs égaux : $(−${b})^${n}$ n’est pas $(−${b}) × ${n}$.`]];
    }
    return numeric(ans, {
      prompt: `${pick(rand, VERB)} : $${expr}$`, expectedSeconds: 90,
      misconceptions: vals.map((v, i) => mc(v, ...fbs[i])),
      hints: ['Les puissances se calculent avant les multiplications et les additions.', 'Repère sur quoi porte chaque exposant : $−3²$ = $−(3²)$, mais $(−3)²$ = $(−3) × (−3)$.', 'Calcule chaque puissance, puis termine le calcul.'],
      solution: `$${expr} = ${fr(ans)}$ (les puissances d’abord, en regardant sur quoi porte chaque exposant).`,
    });
  },
  regles(rand) {
    const t = ri(rand, 1, 3);
    if (t === 1) {
      let p; let q; let r; let n;
      do { p = nz(rand, -6, 9); q = nz(rand, -6, 6); r = nz(rand, -5, 7); n = p + q - r; } while (!distinct(n, [p + q + r, p * q - r]));
      return numeric(n, {
        prompt: `On a $(10^${e(p)} × 10^${e(q)})/10^${e(r)} = 10^n$. ${ASK_N}`, expectedSeconds: 75,
        misconceptions: [mc(p + q + r, 'mc:additionner-exposants', 'notion', 'Pour diviser par une puissance de 10, on soustrait son exposant.'), mc(p * q - r, 'mc:multiplier-exposants', 'notion', 'Pour multiplier deux puissances de 10, on additionne les exposants (on ne les multiplie pas).')],
        hints: ['$10^a × 10^b = 10^(a + b)$ et $10^a ÷ 10^b = 10^(a − b)$.', `Numérateur : $10^${e(p + q)}$.`, `Puis ${fr(p + q)} − ${par(r)}.`],
        solution: `$(10^${e(p)} × 10^${e(q)})/10^${e(r)} = 10^${e(p + q)}/10^${e(r)} = 10^${e(n)}$, donc n = ${fr(n)}.`,
      });
    }
    if (t === 2) {
      let p; let k; let q; let n;
      do { p = nz(rand, -5, 6); k = ri(rand, 2, 4); q = nz(rand, -6, 6); n = p * k + q; } while (!distinct(n, [p + k + q, p * k * q]));
      return numeric(n, {
        prompt: `On a $(10^${e(p)})^${k} × 10^${e(q)} = 10^n$. ${ASK_N}`, expectedSeconds: 75,
        misconceptions: [mc(p + k + q, 'mc:additionner-exposants', 'notion', 'Une puissance de puissance : on multiplie les exposants.'), mc(p * k * q, 'mc:multiplier-exposants', 'notion', 'Pour multiplier deux puissances de 10, on additionne les exposants.')],
        hints: ['$(10^a)^b = 10^(a × b)$', `$(10^${e(p)})^${k} = 10^${e(p * k)}$`, 'Puis additionne les exposants.'],
        solution: `$(10^${e(p)})^${k} × 10^${e(q)} = 10^${e(p * k)} × 10^${e(q)} = 10^${e(n)}$, donc n = ${fr(n)}.`,
      });
    }
    // à l'envers : l'exposant manquant
    const form = ri(rand, 1, 3);
    let p; let q; let n; let eq; let vals; let fbs;
    do {
      p = nz(rand, -7, 9); q = nz(rand, -7, 9);
      if (form === 1) { n = q - p; eq = `10^${e(p)} × 10^n = 10^${e(q)}`; vals = [q + p, p - q]; fbs = [['mc:operation-reciproque', 'raisonnement', `On additionne les exposants : ${fr(p)} + n = ${fr(q)}, donc n = ${fr(q)} − ${par(p)}.`], ['mc:ordre-soustraction', 'signe', `${fr(p)} + n = ${fr(q)} : n = ${fr(q)} − ${par(p)}, pas l’inverse.`]]; }
      else if (form === 2) { n = q + p; eq = `10^n ÷ 10^${e(p)} = 10^${e(q)}`; vals = [q - p]; fbs = [['mc:operation-reciproque', 'raisonnement', `n − ${par(p)} = ${fr(q)} : pour retrouver n, on ajoute ${par(p)}.`]]; }
      else { n = p - q; eq = `10^${e(p)} ÷ 10^n = 10^${e(q)}`; vals = [q - p, p + q]; fbs = [['mc:ordre-soustraction', 'signe', `${fr(p)} − n = ${fr(q)} : n = ${fr(p)} − ${par(q)}.`], ['mc:operation-reciproque', 'raisonnement', 'Pour une division, on soustrait les exposants.']]; }
    } while (!n || !distinct(n, vals));
    return numeric(n, {
      prompt: `Trouve l’entier n tel que $${eq}$.`, expectedSeconds: 75,
      misconceptions: vals.map((v, i) => mc(v, ...fbs[i])),
      hints: ['$10^a × 10^b = 10^(a + b)$ et $10^a ÷ 10^b = 10^(a − b)$.', 'Écris l’égalité des exposants, puis résous-la.'],
      solution: `Égalité des exposants : n = ${fr(n)}. Vérification : $${eq.replace(/\bn\b/, e(n))}$.`,
    });
  },
  scientifique(rand) {
    let a; let s; let k; let m; let n;
    do { a = rand() < 0.3 ? ri(rand, 2, 9) : ri(rand, 11, 99) / 10; s = pick(rand, [-3, -2, -1, 1, 2, 3]); k = nz(rand, -9, 9); m = clean(a * 10 ** s); n = k + s; } while (!n || Math.abs(k) < 2 || Math.abs(n) > 12 || !distinct(n, [k, k - s]));
    return numeric(n, {
      prompt: `Écris $${fr(m)} × 10^${e(k)}$ en notation scientifique : $${fr(m)} × 10^${e(k)} = ${fr(a)} × 10^n$. ${ASK_N}`, expectedSeconds: 90,
      misconceptions: [mc(k, 'mc:exposant-recopie', 'notion', `${fr(m)} n’est pas compris entre 1 et 10 : écris-le d’abord ${fr(a)} × 10^${e(s)}, puis additionne les exposants.`), mc(k - s, 'mc:sens-decalage', 'notion', `$${fr(m)} = ${fr(a)} × 10^${e(s)}$ : vérifie le sens du décalage de la virgule.`)],
      hints: ['En notation scientifique, le premier facteur est compris entre 1 et 10 (10 exclu).', `$${fr(m)} = ${fr(a)} × 10^${e(s)}$`, `Donc $10^${e(s)} × 10^${e(k)} = 10^(${fr(s)} + ${par(k)})$.`],
      solution: `$${fr(m)} × 10^${e(k)} = ${fr(a)} × 10^${e(s)} × 10^${e(k)} = ${fr(a)} × 10^${e(n)}$, donc n = ${fr(n)}.`,
    });
  },
};

const PU_EXPERT = {
  valeur(rand) {
    if (rand() < 0.5) {
      // a × b² − (−c)³ ÷ d : puissances et priorités
      let a; let b; let c; let d; let ans; let vals;
      do { a = ri(rand, 2, 6); b = ri(rand, 2, 5); c = ri(rand, 2, 4); d = pick(rand, { 2: [2, 4, 8], 3: [3, 9], 4: [2, 4, 8, 16] }[c]); ans = a * b * b + c ** 3 / d; vals = [(a * b) ** 2 + c ** 3 / d, a * b * b - c ** 3 / d, a * 2 * b + (3 * c) / d]; } while (!distinct(ans, vals));
      const expr = `${a} × ${b}² − (−${c})³ ÷ ${d}`;
      return numeric(ans, {
        prompt: `${pick(rand, VERB)} : $${expr}$`, expectedSeconds: 150, skills: ['m5.calcul.priorites'],
        misconceptions: [mc(clean(vals[0]), 'mc:puissance-prioritaire', 'notion', `Le carré porte seulement sur ${b} : $${a} × ${b}² = ${a} × ${b * b}$, pas $(${a} × ${b})²$.`),
          mc(clean(vals[1]), 'mc:regle-signes', 'signe', `$(−${c})³ = ${fr(-(c ** 3))}$ (trois facteurs négatifs) ; puis $− ${par(-(c ** 3))} ÷ ${d}$ : soustraire un négatif revient à ajouter.`),
          mc(clean(vals[2]), 'mc:puissance-produit', 'notion', 'Un exposant compte des facteurs égaux : ce n’est pas une multiplication par l’exposant.')],
        hints: ['Ordre : puissances, puis multiplications et divisions, enfin additions et soustractions.', `$${b}² = ${b * b}$ et $(−${c})³ = ${fr(-(c ** 3))}$.`, `Il reste $${a * b * b} − ${par(-(c ** 3))} ÷ ${d}$.`],
        solution: `$${expr} = ${a} × ${b * b} − ${par(-(c ** 3))} ÷ ${d} = ${a * b * b} − ${par(-(c ** 3) / d)} = ${fr(ans)}$`,
      });
    }
    // (±b)^n = v : retrouver l'exposant
    let b; let base; let n; let v;
    do { b = ri(rand, 2, 5); base = rand() < 0.7 ? -b : b; n = ri(rand, 3, b === 2 ? 7 : b === 3 ? 5 : 4); v = base ** n; } while (!distinct(n, [v / base, n - 1]));
    return numeric(n, {
      prompt: `Trouve l’entier n tel que $${par(base)}^n = ${fr(v)}$.`, expectedSeconds: 120,
      misconceptions: [mc(clean(v / base), 'mc:puissance-produit', 'notion', `$${par(base)}^n$ n’est pas ${par(base)} × n : c’est un produit de n facteurs égaux à ${par(base)}.`), mc(n - 1, 'mc:compter-facteurs', 'notion', 'Compte les facteurs, pas les signes × : il y a un facteur de plus que de signes ×.')],
      hints: [`Calcule les puissances successives : $${par(base)}² = ${fr(base ** 2)}$, $${par(base)}³ = ${fr(base ** 3)}$…`, base < 0 ? `Le signe aide : un résultat ${v < 0 ? 'négatif impose un exposant impair' : 'positif impose un exposant pair'}.` : `Combien de fois faut-il multiplier ${b} par lui-même ?`],
      solution: `$${par(base)}^${n} = ${Array(n).fill(par(base)).join(' × ')} = ${fr(v)}$, donc n = ${n}.`,
    });
  },
  regles(rand) {
    const t = ri(rand, 1, 3);
    if (t === 1) {
      // 0,01 × 10^p × 1000 = 10^n
      let u; let w; let p; let n;
      do { u = ri(rand, 1, 3); w = ri(rand, 2, 4); p = nz(rand, -6, 6); n = p - u + w; } while (!distinct(n, [p + u + w, p - (u - 1) + w]));
      const dec = fr(10 ** -u); const big = fr(10 ** w);
      return numeric(n, {
        prompt: `Écris sous la forme d’une puissance de 10 : $${dec} × 10^${e(p)} × ${big} = 10^n$. ${ASK_N}`, expectedSeconds: 120,
        misconceptions: [mc(p + u + w, 'mc:exposant-negatif-signe', 'signe', `$${dec} = 10^(−${u})$ : un nombre plus petit que 1 a un exposant négatif.`), mc(p - (u - 1) + w, 'mc:compter-zeros', 'notion', `$${dec} = 10^(−${u})$ : compte les rangs entre la virgule et le chiffre 1 (il y en a ${u}).`)],
        hints: [`Écris chaque nombre comme une puissance de 10 : $${dec} = 10^(−${u})$ et $${big} = 10^${w}$.`, 'Puis additionne les exposants.'],
        solution: `$${dec} × 10^${e(p)} × ${big} = 10^(−${u}) × 10^${e(p)} × 10^${w} = 10^${e(n)}$, donc n = ${fr(n)}.`,
      });
    }
    if (t === 2) {
      // (10^n)^k × 10^p = 10^q : exposant manquant dans une puissance de puissance
      let n; let k; let p; let q;
      do { n = nz(rand, -5, 6); k = ri(rand, 2, 4); p = nz(rand, -6, 6); q = n * k + p; } while (!distinct(n, [q - p - k, (q + p) / k]));
      return numeric(n, {
        prompt: `Trouve l’entier n tel que $(10^n)^${k} × 10^${e(p)} = 10^${e(q)}$.`, expectedSeconds: 150,
        misconceptions: [mc(q - p - k, 'mc:additionner-exposants', 'notion', `$(10^n)^${k} = 10^(${k}n)$ : pour une puissance de puissance, on multiplie les exposants.`), mc(clean((q + p) / k), 'mc:operation-reciproque', 'raisonnement', `${k}n + ${par(p)} = ${fr(q)} : il faut retirer ${par(p)}, pas l’ajouter.`)],
        hints: [`$(10^n)^${k} = 10^(${k}n)$`, `Donc ${k}n + ${par(p)} = ${fr(q)}.`, 'Résous cette petite équation.'],
        solution: `$(10^n)^${k} × 10^${e(p)} = 10^(${k}n + ${par(p)})$, donc ${k}n = ${fr(q)} − ${par(p)} = ${fr(q - p)} et n = ${fr(n)}.`,
      });
    }
    // vers la 3e : mêmes règles pour une base quelconque
    let base; let p; let q; let r; let n;
    do { base = pick(rand, [2, 3, 5, 7]); p = ri(rand, 2, 9); q = ri(rand, 2, 9); r = ri(rand, 2, 9); n = p + q - r; } while (n < 1 || !distinct(n, [p * q - r, p + q + r]));
    return numeric(n, {
      prompt: `Vers la 3e : les règles des puissances de 10 valent pour les puissances de n’importe quel nombre. Trouve l’entier n tel que $(${base}^${p} × ${base}^${q})/${base}^${r} = ${base}^n$.`, expectedSeconds: 120,
      misconceptions: [mc(p * q - r, 'mc:multiplier-exposants', 'notion', `$${base}^${p} × ${base}^${q}$ contient ${p} + ${q} facteurs égaux à ${base} : on additionne les exposants.`), mc(p + q + r, 'mc:additionner-exposants', 'notion', `Diviser par $${base}^${r}$, c’est simplifier ${r} facteurs : on soustrait l’exposant.`)],
      hints: [`$${base}^${p}$ est un produit de ${p} facteurs égaux à ${base} : compte les facteurs du numérateur.`, `Le numérateur contient ${p + q} facteurs ${base} ; on en simplifie ${r}.`],
      solution: `$(${base}^${p} × ${base}^${q})/${base}^${r} = ${base}^${p + q}/${base}^${r} = ${base}^${n}$, donc n = ${n}.`,
    });
  },
  scientifique(rand) {
    if (rand() < 0.5) {
      // produit : le premier facteur dépasse 10, il faut renormaliser
      let a; let b; let p; let q; let prod; let n; let prompt;
      const light = rand() < 0.35;
      do {
        a = light ? 3 : pick(rand, [1.5, 2, 2.5, 3, 4, 5, 6, 8, 1.2, 3.5]); b = pick(rand, light ? [4, 5, 6, 8] : [2, 2.5, 3, 4, 5, 6, 8]);
        p = light ? 5 : nz(rand, -9, 9); q = light ? ri(rand, 2, 7) : nz(rand, -9, 9); prod = clean(a * b); n = p + q + 1;
      } while (prod < 10 || !isNice(prod, 2) || Math.abs(n) > 20 || !distinct(n, [p + q, p * q]));
      prompt = light
        ? `La lumière parcourt environ $3 × 10^5$ km par seconde. Quelle distance parcourt-elle en $${fr(b)} × 10^${e(q)}$ secondes ? Écris le résultat (en km) ${SCI}. ${ASK_N}`
        : `On donne $A = ${fr(a)} × 10^${e(p)}$ et $B = ${fr(b)} × 10^${e(q)}$. Écris le produit A × B ${SCI}. ${ASK_N}`;
      return numeric(n, {
        prompt, expectedSeconds: 150, representation: light ? 'concrete' : 'symbolique',
        misconceptions: [mc(p + q, 'mc:mantisse-non-normalisee', 'forme', `${fr(a)} × ${fr(b)} = ${fr(prod)} n’est pas compris entre 1 et 10 : ${fr(prod)} = ${fr(prod / 10)} × 10, ce qui ajoute 1 à l’exposant.`), mc(p * q, 'mc:multiplier-exposants', 'notion', 'Pour multiplier des puissances de 10, on additionne les exposants.')],
        hints: ['Regroupe : (nombres entre eux) × (puissances de 10 entre elles).', `${fr(a)} × ${fr(b)} = ${fr(prod)} et $10^${e(p)} × 10^${e(q)} = 10^${e(p + q)}$.`, `${fr(prod)} n’est pas entre 1 et 10 : écris-le ${fr(prod / 10)} × 10.`],
        solution: `$${fr(a)} × 10^${e(p)} × ${fr(b)} × 10^${e(q)} = ${fr(prod)} × 10^${e(p + q)} = ${fr(prod / 10)} × 10^${e(n)}$, donc n = ${fr(n)}.`,
      });
    }
    // quotient : le premier facteur est plus petit que 1
    let a; let b; let p; let q; let n;
    do { [a, b] = pick(rand, [[1.2, 4], [1.5, 5], [2, 8], [3, 6], [1.8, 2], [4.5, 9], [1.4, 7], [2.4, 8], [1, 4], [2.1, 3]]); p = nz(rand, -9, 9); q = nz(rand, -9, 9); n = p - q - 1; } while (Math.abs(n) > 20 || !distinct(n, [p - q, p + q]));
    const r = clean(a / b);
    return numeric(n, {
      prompt: `Écris $(${fr(a)} × 10^${e(p)})/(${fr(b)} × 10^${e(q)})$ ${SCI}. ${ASK_N}`, expectedSeconds: 150,
      misconceptions: [mc(p - q, 'mc:mantisse-non-normalisee', 'forme', `${fr(a)} ÷ ${fr(b)} = ${fr(r)} est plus petit que 1 : ${fr(r)} = ${fr(clean(r * 10))} × 10^(−1), ce qui retire 1 à l’exposant.`), mc(p + q, 'mc:additionner-exposants', 'notion', 'Pour diviser des puissances de 10, on soustrait les exposants.')],
      hints: [`Sépare : $(${fr(a)}/${fr(b)}) × (10^${e(p)}/10^${e(q)})$.`, `${fr(a)} ÷ ${fr(b)} = ${fr(r)} et $10^${e(p)} ÷ 10^${e(q)} = 10^${e(p - q)}$.`, `Écris ${fr(r)} en notation scientifique.`],
      solution: `$(${fr(a)} × 10^${e(p)})/(${fr(b)} × 10^${e(q)}) = ${fr(r)} × 10^${e(p - q)} = ${fr(clean(r * 10))} × 10^${e(n)}$, donc n = ${fr(n)}.`,
    });
  },
};
