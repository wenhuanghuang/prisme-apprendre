/**
 * Niveaux ◆ approfondissement et ✦ expert des générateurs : équations et calcul littéral.
 * Chaque fonction reçoit (rand, options) et renvoie un exercice comme `make` (numeric, expression, steps).
 */
import { ri, nz, pick, clean, fr, par, gcd, lcm, frac, fracStr, sgn, xTerm, poly, mc, numeric, expression } from './gen-util.js';
import { near, distinct, fval, pdistinct, fm, isNice, fracResult, formTxt, steps, readFrac } from './tiers-nombres-outils.js';

export const TIERS_LITTERAL = {
  'm-equations': {
    /** ◆ Parenthèse à développer, coefficient négatif, décimaux, x à regrouper d'un membre à l'autre. */
    approfondissement(rand, o) {
      const forme = o.forme || pick(rand, ['simple', 'deux-membres']);
      const etapes = (o.reponse || (rand() < 0.5 ? 'etapes' : 'solution')) === 'etapes';
      const kind = pick(rand, forme === 'simple' ? ['s1', 's2'] : ['d1', 'd2']);
      return eqExercise(EQ_APPRO[kind](rand), etapes, 150);
    },
    /** ✦ Parenthèses des deux côtés (« − » devant l'une), solution fractionnaire, coefficients fractionnaires, paramètre à trouver. */
    expert(rand, o) {
      const forme = o.forme || pick(rand, ['simple', 'deux-membres']);
      const etapes = (o.reponse || (rand() < 0.5 ? 'etapes' : 'solution')) === 'etapes';
      const kinds = forme === 'simple' ? ['e3', 'e4'] : ['e1', 'e2'];
      if (!etapes && rand() < 0.3) return EQ_PARAM(rand, forme);
      return eqExercise(EQ_EXPERT[pick(rand, kinds)](rand), etapes, 210);
    },
  },

  'm-litteral-valeur': {
    /** ◆ Deux lettres, valeur décimale, quotient, carré d'une parenthèse. */
    approfondissement(rand) { return LV_APPRO[pick(rand, ['deuxLettres', 'decimal', 'quotient', 'parenthese'])](rand); },
    /** ✦ Utiliser la structure sans chercher x, cas pièges −x² / (−x)³ / (kx)², coefficient manquant. */
    expert(rand) { return LV_EXPERT[pick(rand, ['structure', 'piege', 'manquant'])](rand); },
  },

  'm-developper': {
    /** ◆ Somme de deux produits, « − » devant une parenthèse, kx(ax + b), factoriser (à l'envers). */
    approfondissement(rand) { return DV_APPRO[pick(rand, ['somme', 'moins', 'xfois', 'factoriser'])](rand); },
    /** ✦ Différence de produits avec x², factoriser par un nombre négatif, termes en x qui s'annulent. */
    expert(rand) { return DV_EXPERT[pick(rand, ['xcarre', 'factoriserNeg', 'annule'])](rand); },
  },

  'm-double-distributivite': {
    /** ◆ Coefficients négatifs, carré (ax + b)², double et simple distributivité réunies. */
    approfondissement(rand) { return DD_APPRO[pick(rand, ['negatif', 'carre', 'mixte'])](rand); },
    /** ✦ Différence de deux produits, nombre manquant dans un facteur, différence de carrés (cas piège). */
    expert(rand) { return DD_EXPERT[pick(rand, ['difference', 'manquant', 'piege'])](rand); },
  },
};

/**
 * Tirage { eq, s, lines, mcs, hints } → exercice : toutes les étapes, ou la solution seule. Une solution fractionnaire
 * (`sol` = [num, dén], dén > 1) se donne en valeur exacte : fraction irréductible, idées fausses écrites en fractions.
 */
function eqExercise(t, etapes, secs) {
  const sTxt = t.sTxt || fr(t.s);
  const common = { expectedSeconds: secs, hints: t.hints, solution: `$${t.eq}$ ⟶ ${t.lines.map((l) => `$${l}$`).join(' ⟶ ')}. Vérification : en remplaçant x par ${sTxt}, les deux membres sont égaux.`, ...(t.skills ? { skills: t.skills } : {}) };
  if (etapes) return steps('equation', t.eq, t.lines, { prompt: `Résous l’équation $${t.eq}$. Écris une étape par ligne, jusqu’à « x = … ».`, ...common });
  if (t.sol && t.sol[1] > 1) {
    return fracResult(t.sol, {
      prompt: `Résous l’équation $${t.eq}$. Quelle est la valeur exacte de x ? Donne-la sous la forme d’${formTxt(t.sol)}.`, misconceptions: [...t.mcs, ...approxMcs(t.sol, t.mcs)],
      wrongFeedback: 'Ce n’est pas la valeur exacte de x. Vérifie chaque étape, puis donne la solution sous la forme d’une fraction irréductible (une valeur approchée ne suffit pas).', ...common,
    });
  }
  return numeric(t.s, { prompt: `Résous l’équation $${t.eq}$. Quelle est la valeur de x ?`, misconceptions: t.mcs, ...common });
}
/** Valeurs approchées d'une solution fractionnaire (au centième, tronquée, au dixième, au millième) : la valeur exacte est demandée. */
function approxMcs(sol, mcs) {
  const v = fval(sol);
  const taken = [v, ...mcs.map((m) => fval(readFrac(m.answer)))];
  const out = [];
  for (const a of [Math.round(v * 100) / 100, Math.trunc(v * 100) / 100, Math.round(v * 10) / 10, Math.round(v * 1000) / 1000].map(clean)) {
    if (taken.some((x) => near(x, a))) continue;
    taken.push(a);
    out.push(mc(String(a), 'mc:valeur-approchee', 'forme', 'C’est une valeur approchée de la solution : la division ne tombe pas juste. Donne la valeur exacte, sous la forme d’une fraction irréductible.'));
  }
  return out;
}
const opWord = (b) => (b > 0 ? `soustrait ${fr(b)}` : `ajoute ${fr(-b)}`);

const EQ_APPRO = {
  /** k(ax + b) = c */
  s1(rand) {
    let k; let a; let b; let s; let c; let vals;
    do { k = nz(rand, -6, 6); a = ri(rand, 1, 5); b = nz(rand, -9, 9); s = nz(rand, -8, 8); c = k * (a * s + b); vals = [(c - b) / (k * a), (c + k * b) / (k * a), c - k * b - k * a]; } while (Math.abs(k) < 2 || !distinct(s, vals));
    const lines = [`${poly([k * b, k * a])} = ${fr(c)}`, `${poly([0, k * a])} = ${fr(c - k * b)}`, `x = ${fr(s)}`];
    return {
      eq: `${fr(k)}(${poly([b, a])}) = ${fr(c)}`, s, lines,
      mcs: [mc(clean(vals[0]), 'mc:distributivite-partielle', 'notion', `${fr(k)} multiplie les deux termes de la parenthèse : $${fr(k)}(${poly([b, a])}) = ${poly([k * b, k * a])}$.`),
        mc(clean(vals[1]), 'mc:transposer-signe', 'signe', `Pour éliminer ${fr(k * b)}, on ${opWord(k * b)} aux deux membres.`),
        mc(clean(vals[2]), 'mc:isoler-x', 'notion', `${fr(k * a)} multiplie x : pour isoler x, on divise par ${fr(k * a)}, on ne soustrait pas.`)],
      hints: ['Commence par développer le membre de gauche.', `Tu obtiens $${lines[0]}$.`, `Puis $${lines[1]}$, et divise.`],
    };
  },
  /** b − ax = c (coefficient négatif, décimaux) */
  s2(rand) {
    let a; let s; let b; let c; let vals;
    do { a = ri(rand, 2, 9); s = nz(rand, -20, 20) / 2; b = nz(rand, -99, 99) / 10; c = clean(b - a * s); vals = [clean((c - b) / a), clean((c + b) / -a)]; } while (!isNice(c, 2) || !distinct(s, vals));
    const lines = [`${poly([0, -a])} = ${fr(clean(c - b))}`, `x = ${fr(s)}`];
    return {
      eq: `${fr(b)} − ${a}x = ${fr(c)}`, s, lines,
      mcs: [mc(vals[0], 'mc:signe-coefficient', 'signe', `Le coefficient de x est ${fr(-a)} (avec son signe « − ») : on divise par ${fr(-a)}.`), mc(vals[1], 'mc:transposer-signe', 'signe', `Pour éliminer ${fr(b)}, on ${opWord(b)} aux deux membres.`)],
      hints: [`Attention : le terme en x est « − ${a}x ».`, `Élimine ${fr(b)} : $${lines[0]}$.`, `Divise les deux membres par ${fr(-a)}.`],
    };
  },
  /** a(x + b) = cx + d */
  d1(rand) {
    let a; let c; let b; let s; let d; let vals;
    do { a = nz(rand, -6, 8); c = nz(rand, -6, 8); b = nz(rand, -9, 9); s = nz(rand, -10, 10); d = a * (s + b) - c * s; vals = [(d - b) / (a - c), (d - a * b) / (a + c)]; } while (Math.abs(a) < 2 || Math.abs(a - c) < 2 || !distinct(s, vals));
    const lines = [`${poly([a * b, a])} = ${poly([d, c])}`, `${poly([0, a - c])} = ${fr(d - a * b)}`, `x = ${fr(s)}`];
    return {
      eq: `${fr(a)}(x${sgn(b)}) = ${poly([d, c])}`, s, lines,
      mcs: [mc(clean(vals[0]), 'mc:distributivite-partielle', 'notion', `${fr(a)} multiplie les deux termes : $${fr(a)}(x${sgn(b)}) = ${poly([a * b, a])}$.`), mc(clean(vals[1]), 'mc:transposer-signe', 'signe', `Pour regrouper les x, on soustrait ${poly([0, c])} aux deux membres : on obtient ${poly([0, a - c])}, pas ${poly([0, a + c])}.`)],
      hints: ['Développe d’abord le membre de gauche.', `Tu obtiens $${lines[0]}$.`, `Regroupe les x dans un membre : $${lines[1]}$.`],
    };
  },
  /** ax + b = d − cx */
  d2(rand) {
    let a; let c; let b; let s; let d; let vals;
    do { a = nz(rand, -5, 9); c = ri(rand, 2, 7); b = nz(rand, -15, 15); s = nz(rand, -10, 10); d = (a + c) * s + b; vals = [(d - b) / (a - c), (d + b) / (a + c)]; } while (Math.abs(a) < 2 || Math.abs(a + c) < 2 || !distinct(s, vals));
    const lines = [`${poly([b, a + c])} = ${fr(d)}`, `${poly([0, a + c])} = ${fr(d - b)}`, `x = ${fr(s)}`];
    return {
      eq: `${poly([b, a])} = ${fr(d)} − ${c}x`, s, lines,
      mcs: [mc(clean(vals[0]), 'mc:transposer-signe', 'signe', `Pour éliminer « − ${c}x » du membre de droite, on ajoute ${c}x aux deux membres : on obtient ${poly([0, a + c])}.`), mc(clean(vals[1]), 'mc:transposer-signe', 'signe', `Pour éliminer ${fr(b)}, on ${opWord(b)} aux deux membres.`)],
      hints: [`Ajoute ${c}x aux deux membres.`, `Tu obtiens $${lines[0]}$.`, `Puis $${lines[1]}$.`],
    };
  },
};

const EQ_EXPERT = {
  /** a(x + b) = e − c(x − d) : un « − » devant une parenthèse */
  e1(rand) {
    let a; let c; let b; let d; let s; let ee; let vals;
    do { a = ri(rand, 2, 7); c = ri(rand, 2, 6); b = nz(rand, -9, 9); d = nz(rand, -9, 9); s = nz(rand, -9, 9); ee = a * (s + b) + c * (s - d); vals = [(ee - c * d - a * b) / (a + c), (ee + c * d - b) / (a + c)]; } while (!distinct(s, vals));
    const lines = [`${poly([a * b, a])} = ${poly([ee + c * d, -c])}`, `${poly([0, a + c])} = ${fr(ee + c * d - a * b)}`, `x = ${fr(s)}`];
    return {
      eq: `${a}(x${sgn(b)}) = ${fr(ee)} − ${c}(x${sgn(-d)})`, s, lines,
      mcs: [mc(clean(vals[0]), 'mc:moins-devant-parenthese', 'signe', `$− ${c}(x${sgn(-d)}) = ${poly([c * d, -c])}$ : le « − » s’applique aux deux termes de la parenthèse.`), mc(clean(vals[1]), 'mc:distributivite-partielle', 'notion', `${a} multiplie les deux termes : $${a}(x${sgn(b)}) = ${poly([a * b, a])}$.`)],
      hints: ['Développe chaque membre ; attention au « − » devant la seconde parenthèse.', `Tu obtiens $${lines[0]}$.`, `Regroupe les x à gauche : $${lines[1]}$.`],
    };
  },
  /** k(ax + b) = m(cx + d) : parenthèses des deux côtés, solution parfois fractionnaire */
  e2(rand) {
    let k; let m; let a; let c; let b; let d; let A; let B; let vals;
    do { k = nz(rand, -5, 5); m = nz(rand, -5, 5); a = ri(rand, 1, 4); c = ri(rand, 1, 4); b = nz(rand, -6, 6); d = nz(rand, -6, 6); A = k * a - m * c; B = m * d - k * b; vals = [(d - k * b) / A, (m * d - k * b) / (k * a + m * c)]; } while (Math.abs(k) < 2 || Math.abs(m) < 2 || Math.abs(k) === Math.abs(m) || Math.abs(A) < 2 || !B || frac(B, A)[1] > 9 || !distinct(B / A, vals));
    const sol = frac(B, A);
    // solution fractionnaire : les idées fausses s'écrivent aussi en fractions exactes (l'exercice attend une fraction)
    const wrong = [frac(d - k * b, A), frac(m * d - k * b, k * a + m * c)].map((f) => (sol[1] > 1 ? fracStr(f) : clean(fval(f))));
    const lines = [`${poly([k * b, k * a])} = ${poly([m * d, m * c])}`, `${poly([0, A])} = ${fr(B)}`, `x = ${fracStr(sol)}`];
    return {
      eq: `${fr(k)}(${poly([b, a])}) = ${fr(m)}(${poly([d, c])})`, s: B / A, sol, sTxt: fm(sol), lines,
      mcs: [mc(wrong[0], 'mc:distributivite-partielle', 'notion', `${fr(m)} multiplie les deux termes : $${fr(m)}(${poly([d, c])}) = ${poly([m * d, m * c])}$.`), mc(wrong[1], 'mc:transposer-signe', 'signe', `Pour regrouper les x, on soustrait ${poly([0, m * c])} aux deux membres.`)],
      hints: ['Développe les deux membres.', `Tu obtiens $${lines[0]}$.`, `Regroupe : $${lines[1]}$ ; la solution peut être une fraction.`],
    };
  },
  /** x/a ± x/b = c : coefficients fractionnaires */
  e3(rand) {
    let a; let b; let plus; let L; let s; let c; let co; let vals;
    do {
      a = ri(rand, 2, 6); b = ri(rand, 2, 8); plus = rand() < 0.6; L = lcm(a, b); s = L * nz(rand, -4, 5);
      c = plus ? s / a + s / b : s / a - s / b; co = plus ? L / a + L / b : L / a - L / b;
      vals = [plus ? c * (a + b) : c * (b - a), c / co];
    } while (a === b || (!plus && a > b) || !distinct(s, vals));
    // coefficient 1 écrit « x » ; s'il reste x après réduction, la ligne « x = … » n'est pas répétée
    const lines = [`${poly([0, L / a])} ${plus ? '+' : '−'} ${poly([0, L / b])} = ${fr(c * L)}`, ...(co === 1 ? [] : [`${poly([0, co])} = ${fr(c * L)}`]), `x = ${fr(s)}`];
    return {
      eq: `x/${a} ${plus ? '+' : '−'} x/${b} = ${fr(c)}`, s, lines, skills: ['m4.fractions.calcul'],
      mcs: [mc(clean(vals[0]), 'mc:ajouter-denominateurs', 'notion', `$x/${a} ${plus ? '+' : '−'} x/${b}$ n’est pas $x/${plus ? a + b : b - a}$ : mets au même dénominateur (${L}).`), mc(clean(vals[1]), 'mc:un-seul-membre', 'methode', `On multiplie les DEUX membres par ${L} : le second membre devient ${fr(c * L)}.`)],
      hints: [`Multiplie les deux membres par ${L} (un multiple commun de ${a} et ${b}).`, `Tu obtiens $${lines[0]}$.`, co === 1 ? 'Réduis le membre de gauche : il reste x, la solution se lit directement.' : 'Réduis le membre de gauche, puis divise.'],
    };
  },
  /** (p/q)x + c = d */
  e4(rand) {
    let q; let p; let s; let c; let d; let vals;
    do { q = ri(rand, 2, 7); p = nz(rand, -7, 7); s = q * nz(rand, -6, 6); c = nz(rand, -12, 12); d = (p * s) / q + c; vals = [((d - c) * p) / q, ((d + c) * q) / p]; } while (Math.abs(p) < 2 || gcd(p, q) !== 1 || !distinct(s, vals));
    const coef = rand() < 0.5 ? `(${fm([p, q])})x` : `(${fr(p)}x)/${q}`;
    const lines = [`${coef} = ${fr(d - c)}`, `${fr(p)}x = ${fr((d - c) * q)}`, `x = ${fr(s)}`];
    return {
      eq: `${coef}${sgn(c)} = ${fr(d)}`, s, lines, skills: ['m4.fractions.inverse'],
      mcs: [mc(clean(vals[0]), 'mc:inverse-oublie', 'notion', `Pour isoler x, on divise par $${fm([p, q])}$, c’est-à-dire qu’on multiplie par son inverse $${fm(frac(q, p))}$.`), mc(clean(vals[1]), 'mc:transposer-signe', 'signe', `Pour éliminer ${fr(c)}, on ${opWord(c)} aux deux membres.`)],
      hints: [`Élimine d’abord ${fr(c)} : $${lines[0]}$.`, `Multiplie les deux membres par ${q} : $${lines[1]}$.`, `Divise enfin par ${fr(p)}.`],
    };
  },
};

/** ✦ Paramètre : quelle valeur de a rend x = s solution ? */
function EQ_PARAM(rand, forme) {
  let s; let a; let b; let c; let d; let rhs; let vals;
  do {
    s = nz(rand, -6, 6); a = nz(rand, -9, 9); b = nz(rand, -12, 12); c = nz(rand, -6, 6);
    d = forme === 'simple' ? 0 : a * s + b - c * s; rhs = forme === 'simple' ? a * s + b : c * s + d;
    vals = [(rhs + b) / s, rhs - b - s];
  } while (Math.abs(s) < 2 || (forme !== 'simple' && c === a) || !distinct(a, vals));
  const eq = forme === 'simple' ? `ax${sgn(b)} = ${fr(rhs)}` : `ax${sgn(b)} = ${poly([d, c])}`;
  return numeric(a, {
    prompt: `Trouve le nombre a pour que x = ${fr(s)} soit solution de l’équation $${eq}$.`, expectedSeconds: 180,
    misconceptions: [mc(clean(vals[0]), 'mc:transposer-signe', 'signe', `Pour éliminer ${fr(b)}, on ${opWord(b)} aux deux membres.`), mc(clean(vals[1]), 'mc:isoler-x', 'notion', `${fr(s)} multiplie a : pour isoler a, on divise par ${fr(s)}, on ne soustrait pas.`)],
    hints: [`Remplace x par ${par(s)} dans ${forme === 'simple' ? 'l’équation' : 'les deux membres'}.`, `Tu obtiens une équation d’inconnue a : $${fr(s)}a${sgn(b)} = ${fr(rhs)}$.`, 'Résous-la, puis vérifie en remplaçant.'],
    solution: `Avec x = ${fr(s)} : ${fr(s)}a ${sgn(b).trim()} = ${fr(rhs)}, donc ${fr(s)}a = ${fr(rhs - b)} et a = ${fr(a)}. Vérification : $${fr(a)} × ${par(s)}${sgn(b)} = ${fr(rhs)}$.`,
  });
}

/* -------------------------- calcul littéral : valeur ---------------------- */

const CARRE_NEG = (x) => `Le carré d’un nombre négatif est positif : ${par(x)}² = ${fr(clean(x * x))}.`;
const valueAt = (expr, vars) => `Calcule la valeur de $${expr}$ pour ${vars}.`;

const LV_APPRO = {
  /** px² − qxy + ry pour x négatif */
  deuxLettres(rand) {
    let p; let q; let r; let x; let y; let ans; let vals;
    do { p = ri(rand, 2, 6); q = ri(rand, 2, 6); r = ri(rand, 2, 6); x = -ri(rand, 2, 5); y = nz(rand, -5, 5); ans = p * x * x - q * x * y + r * y; vals = [-p * x * x - q * x * y + r * y, (p * x) ** 2 - q * x * y + r * y, p * x * x + q * x * y + r * y]; } while (Math.abs(y) < 2 || !distinct(ans, vals));
    const expr = `${p}x² − ${q}xy + ${r}y`;
    const sub = `${p} × ${par(x)}² − ${q} × ${par(x)} × ${par(y)} + ${r} × ${par(y)}`;
    return numeric(ans, {
      prompt: valueAt(expr, `$x = ${fr(x)}$ et $y = ${fr(y)}$`), expectedSeconds: 120,
      misconceptions: [mc(vals[0], 'mc:carre-negatif', 'signe', CARRE_NEG(x)), mc(vals[1], 'mc:carre-coefficient', 'notion', `${p}x² = ${p} × x² : seul x est au carré, pas ${p}x.`), mc(vals[2], 'mc:signe-produit', 'signe', `Attention au signe : $− ${q} × ${par(x)} × ${par(y)} = ${fr(-q * x * y)}$.`)],
      hints: [`Remplace x par ${par(x)} et y par ${par(y)} : $${sub}$.`, `$${par(x)}² = ${x * x}$`, 'Calcule chaque produit, puis la somme.'],
      solution: `$${sub} = ${fr(p * x * x)} − ${par(q * x * y)} + ${par(r * y)} = ${fr(ans)}$`,
    });
  },
  /** ax² + bx + c pour une valeur décimale */
  decimal(rand) {
    let x; let a; let b; let c; let ans; let vals;
    do { x = pick(rand, [-0.5, -1.5, -2.5, -0.2, -0.4, 0.5, 1.5, -1.2, -0.3]); a = ri(rand, 2, 6); b = nz(rand, -9, 9); c = nz(rand, -9, 9); ans = clean(a * x * x + b * x + c); vals = [clean(2 * a * x + b * x + c), clean((a * x) ** 2 + b * x + c), ...(x < 0 ? [clean(-a * x * x + b * x + c)] : [])]; } while (!distinct(ans, vals));
    const expr = poly([c, b, a]);
    const mcs = [mc(vals[0], 'mc:carre-double', 'notion', 'x² = x × x, pas 2 × x.'), mc(vals[1], 'mc:carre-coefficient', 'notion', `${a}x² = ${a} × x² : seul x est au carré.`)];
    if (x < 0) mcs.push(mc(vals[2], 'mc:carre-negatif', 'signe', CARRE_NEG(x)));
    return numeric(ans, {
      prompt: valueAt(expr, `$x = ${fr(x)}$`), expectedSeconds: 120, misconceptions: mcs,
      hints: [`Remplace x par ${par(x)} : $${a} × ${par(x)}² ${b < 0 ? '−' : '+'} ${Math.abs(b)} × ${par(x)}${sgn(c)}$.`, `$${par(x)}² = ${fr(clean(x * x))}$`, 'Puissances, puis produits, puis la somme.'],
      solution: `$${a} × ${par(x)}² ${b < 0 ? '−' : '+'} ${Math.abs(b)} × ${par(x)}${sgn(c)} = ${fr(clean(a * x * x))}${sgn(clean(b * x))}${sgn(c)} = ${fr(ans)}$`,
    });
  },
  /** (x² − a)/(x + b) pour x négatif */
  quotient(rand) {
    let x; let b; let den; let t; let a; let vals;
    do { x = -ri(rand, 2, 6); b = nz(rand, -8, 8); den = x + b; t = nz(rand, -9, 9); a = x * x - t * den; vals = [(-x * x - a) / den, (2 * x - a) / den]; } while (Math.abs(den) < 2 || !a || Math.abs(a) > 60 || !distinct(t, vals));
    const expr = `(${poly([-a, 0, 1])})/(${poly([b, 1])})`;
    return numeric(t, {
      prompt: valueAt(expr, `$x = ${fr(x)}$`), expectedSeconds: 120,
      misconceptions: [mc(clean(vals[0]), 'mc:carre-negatif', 'signe', CARRE_NEG(x)), mc(clean(vals[1]), 'mc:carre-double', 'notion', 'x² = x × x, pas 2 × x.')],
      hints: ['Le trait de fraction regroupe : calcule le numérateur, puis le dénominateur.', `Numérateur : $${par(x)}²${sgn(-a)} = ${x * x - a}$ ; dénominateur : $${fr(x)}${sgn(b)} = ${fr(den)}$.`, 'Divise (attention au signe).'],
      solution: `$(${par(x)}²${sgn(-a)})/(${fr(x)}${sgn(b)}) = ${x * x - a}/${par(den)} = ${fr(t)}$`,
    });
  },
  /** k(x − a)² − x pour x négatif */
  parenthese(rand) {
    let k; let a; let x; let in1; let ans; let vals;
    do { k = ri(rand, 2, 4); a = ri(rand, 1, 5); x = -ri(rand, 1, 4); in1 = x - a; ans = k * in1 * in1 - x; vals = [(k * in1) ** 2 - x, k * (x * x - a * a) - x, k * in1 * in1 + x]; } while (!distinct(ans, vals));
    const expr = `${k}(x − ${a})² − x`;
    return numeric(ans, {
      prompt: valueAt(expr, `$x = ${fr(x)}$`), expectedSeconds: 120,
      misconceptions: [mc(vals[0], 'mc:puissance-prioritaire', 'notion', `Le carré porte seulement sur la parenthèse : on calcule ${par(in1)}², puis on multiplie par ${k}.`), mc(vals[1], 'mc:carre-somme', 'notion', `$(x − ${a})²$ n’est pas $x² − ${a * a}$ : calcule d’abord la parenthèse, puis son carré.`), mc(vals[2], 'mc:signe-produit', 'signe', `$− x$ avec x = ${fr(x)} : $− ${par(x)} = ${fr(-x)}$.`)],
      hints: [`Remplace x par ${par(x)} partout : $${k}(${fr(x)} − ${a})² − ${par(x)}$.`, `La parenthèse vaut ${fr(in1)}, son carré ${in1 * in1}.`, 'Puis la multiplication, puis la soustraction.'],
      solution: `$${k} × ${par(in1)}² − ${par(x)} = ${k} × ${in1 * in1} + ${-x} = ${fr(ans)}$`,
    });
  },
};

const LV_EXPERT = {
  /** sachant ax + b = V, calculer m·ax + c sans chercher x */
  structure(rand) {
    let a; let b; let V; let m; let c; let ans; let vals;
    do { a = ri(rand, 2, 5); b = nz(rand, -9, 9); V = nz(rand, -20, 30); m = nz(rand, -4, 4); c = nz(rand, -12, 12); ans = m * (V - b) + c; vals = [m * V + c, V - b + c, -m * (V - b) + c]; } while (Math.abs(m) < 2 || (V - b) % a === 0 || !distinct(ans, vals));
    const ax = poly([0, a]); const max = poly([0, m * a]);
    const target = rand() < 0.5 ? poly([c, m * a]) : `${fr(c)} ${m * a < 0 ? '−' : '+'} ${Math.abs(m * a)}x`;
    return numeric(ans, {
      prompt: `On sait que $${poly([b, a])} = ${fr(V)}$. Sans chercher la valeur de x, calcule $${target}$.`, expectedSeconds: 180, skills: ['m4.litteral.structure'],
      misconceptions: [mc(vals[0], 'mc:structure-constante', 'raisonnement', `$${max} = ${fr(m)} × ${ax}$, mais le ${fr(b)} de $${poly([b, a])}$ ne doit pas être multiplié : commence par trouver $${ax}$.`),
        mc(vals[1], 'mc:coefficient-oublie', 'raisonnement', `$${ax} = ${fr(V - b)}$, mais l’expression contient $${max} = ${fr(m)} × ${ax}$.`),
        mc(vals[2], 'mc:signe-produit', 'signe', `$${fr(m)} × ${par(V - b)} = ${fr(m * (V - b))}$ : attention au signe.`)],
      hints: [`Commence par trouver $${ax}$ : $${ax} = ${fr(V)} − ${par(b)} = ${fr(V - b)}$.`, `$${max} = ${fr(m)} × ${ax}$`, `Donc $${max} = ${fr(m)} × ${par(V - b)} = ${fr(m * (V - b))}$.`],
      solution: `$${ax} = ${fr(V - b)}$, donc $${max} = ${fr(m)} × ${par(V - b)} = ${fr(m * (V - b))}$ et $${target} = ${fr(ans)}$.`,
    });
  },
  /** c − x² − x³ ou kx² − (kx)² : les pièges du signe et du carré */
  piege(rand) {
    let expr; let x; let ans; let vals; let fbs;
    if (rand() < 0.5) {
      let c;
      do { x = -ri(rand, 2, 4); c = nz(rand, -10, 10); ans = c - x * x - x ** 3; vals = [c + x * x - x ** 3, c - x * x - Math.abs(x) ** 3, c - 2 * x - 3 * x]; } while (!distinct(ans, vals));
      expr = `${fr(c)} − x² − x³`;
      fbs = [['mc:moins-carre', 'signe', `$− x²$ = $−(x²)$ = $−${par(x)}² = ${fr(-x * x)}$ : le « − » n’est pas élevé au carré.`], ['mc:cube-negatif', 'signe', `${par(x)}³ = ${fr(x ** 3)} (trois facteurs négatifs), donc $− x³ = ${fr(-(x ** 3))}$.`], ['mc:puissance-produit', 'notion', 'x² = x × x et x³ = x × x × x : ce ne sont pas 2x et 3x.']];
    } else {
      let k;
      do { x = -ri(rand, 2, 5); k = ri(rand, 2, 4); ans = k * x * x - (k * x) ** 2; vals = [0, k * x * x + (k * x) ** 2]; } while (!distinct(ans, vals));
      expr = `${k}x² − (${k}x)²`;
      fbs = [['mc:carre-coefficient', 'notion', `$(${k}x)² = ${k}x × ${k}x = ${k * k}x²$ : le ${k} est aussi élevé au carré, contrairement à $${k}x²$.`], ['mc:carre-negatif', 'signe', `$(${k} × ${par(x)})² = ${par(k * x)}² = ${(k * x) ** 2}$ : un carré est positif.`]];
    }
    return numeric(ans, {
      prompt: valueAt(expr, `$x = ${fr(x)}$`), expectedSeconds: 150,
      misconceptions: vals.map((v, i) => mc(v, ...fbs[i])),
      hints: [`Remplace x par ${par(x)} en gardant les parenthèses.`, 'Regarde sur quoi porte chaque exposant : sur x seul, ou sur toute la parenthèse ?', 'Calcule les puissances avant les produits et les sommes.'],
      solution: `En remplaçant x par ${par(x)} : $${expr.replace(/x/g, par(x))} = ${fr(ans)}$.`,
    });
  },
  /** pour x donné, kx² + bx vaut V : retrouver k */
  manquant(rand) {
    let x; let k; let b; let V; let vals;
    do { x = -ri(rand, 2, 4); k = nz(rand, -5, 6); b = nz(rand, -9, 9); V = k * x * x + b * x; vals = [(V - b * x) / -(x * x), (V + b * x) / (x * x)]; } while (!distinct(k, vals));
    const bx = `${b < 0 ? '−' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x`;
    return numeric(k, {
      prompt: `Pour $x = ${fr(x)}$, l’expression $k x² ${bx}$ vaut ${fr(V)}. Trouve le nombre k.`, expectedSeconds: 180, skills: ['m4.equations.resoudre'],
      misconceptions: [mc(clean(vals[0]), 'mc:carre-negatif', 'signe', `${CARRE_NEG(x)} L’expression vaut donc ${x * x}k${sgn(b * x)}.`), mc(clean(vals[1]), 'mc:signe-produit', 'signe', `$${fr(b)} × ${par(x)} = ${fr(b * x)}$ : attention au signe.`)],
      hints: [`Remplace x par ${par(x)} : $k × ${par(x)}² ${b < 0 ? '−' : '+'} ${Math.abs(b)} × ${par(x)} = ${fr(V)}$.`, `Tu obtiens $${x * x}k${sgn(b * x)} = ${fr(V)}$.`, 'Résous cette équation d’inconnue k.'],
      solution: `$k × ${par(x)}² ${b < 0 ? '−' : '+'} ${Math.abs(b)} × ${par(x)} = ${x * x}k${sgn(b * x)}$ ; donc $${x * x}k = ${fr(V - b * x)}$ et k = ${fr(k)}.`,
    });
  },
};

/* ------------------------- calcul littéral : développer ------------------- */

const DEV = ['Développe et réduis', 'Développe puis réduis', 'Écris sous forme développée et réduite'];
const devEx = (rand, ans, expr, rest) => expression(poly(ans), { form: 'developpee-reduite', prompt: `${pick(rand, DEV)} : $${expr}$`, ...rest });
const pmc = (c, id, err, fb) => mc(poly(c), id, err, fb);
const pDistinct = (ans, mcs) => pdistinct(ans, mcs.map((m) => m.c));

const DV_APPRO = {
  /** k(ax + b) ± m(cx + d) */
  somme(rand) {
    let k; let m; let M; let a; let b; let c; let d; let ans; let list;
    do {
      k = nz(rand, -6, 6); m = ri(rand, 2, 6); M = rand() < 0.5 ? -m : m; a = nz(rand, -6, 6); c = nz(rand, -6, 6); b = nz(rand, -9, 9); d = nz(rand, -9, 9);
      ans = [k * b + M * d, k * a + M * c];
      list = [{ c: [b + Math.sign(M) * d, k * a + M * c], id: 'mc:distributivite-partielle', err: 'notion', fb: 'Le facteur devant une parenthèse multiplie chacun de ses termes, y compris le nombre.' }];
      if (M < 0) list.push({ c: [k * b - M * d, k * a + M * c], id: 'mc:signe-distributivite', err: 'signe', fb: `$− ${m} × ${par(d)} = ${fr(-m * d)}$ : le signe « − » s’applique aussi au second terme.` });
    } while (Math.abs(k) < 2 || !ans[0] || !ans[1] || !pDistinct(ans, list));
    const expr = `${fr(k)}(${poly([b, a])}) ${M < 0 ? '−' : '+'} ${m}(${poly([d, c])})`;
    return devEx(rand, ans, expr, {
      expectedSeconds: 120, misconceptions: list.map((x) => pmc(x.c, x.id, x.err, x.fb)),
      hints: ['Développe chaque produit : le facteur devant la parenthèse multiplie chaque terme.', `$${fr(k)}(${poly([b, a])}) = ${poly([k * b, k * a])}$ et $${M < 0 ? '−' : '+'} ${m}(${poly([d, c])})$ donne $${poly([M * d, M * c])}$.`, 'Regroupe les termes en x, puis les nombres.'],
      solution: `$${expr} = ${poly([k * b, k * a])}${xTerm(M * c)}${sgn(M * d)} = ${poly(ans)}$`,
    });
  },
  /** k(ax + b) − (cx + d) */
  moins(rand) {
    let k; let a; let b; let c; let d; let ans; let list;
    do {
      k = nz(rand, -7, 7); a = nz(rand, -6, 6); b = nz(rand, -9, 9); c = nz(rand, -6, 6); d = nz(rand, -9, 9); ans = [k * b - d, k * a - c];
      list = [{ c: [k * b + d, k * a - c], id: 'mc:moins-devant-parenthese', err: 'signe', fb: `Le « − » devant la parenthèse change le signe de chaque terme : $−(${poly([d, c])}) = ${poly([-d, -c])}$.` }, { c: [b - d, k * a - c], id: 'mc:distributivite-partielle', err: 'notion', fb: `${fr(k)} multiplie les deux termes de sa parenthèse.` }];
    } while (Math.abs(k) < 2 || !ans[0] || !ans[1] || !pDistinct(ans, list));
    const expr = `${fr(k)}(${poly([b, a])}) − (${poly([d, c])})`;
    return devEx(rand, ans, expr, {
      expectedSeconds: 100, misconceptions: list.map((x) => pmc(x.c, x.id, x.err, x.fb)),
      hints: [`Développe $${fr(k)}(${poly([b, a])})$.`, `$−(${poly([d, c])}) = ${poly([-d, -c])}$ : le « − » change tous les signes.`, 'Regroupe les termes semblables.'],
      solution: `$${expr} = ${poly([k * b, k * a])}${xTerm(-c)}${sgn(-d)} = ${poly(ans)}$`,
    });
  },
  /** kx(ax + b) */
  xfois(rand) {
    let k; let a; let b; let ans; let list;
    do {
      k = nz(rand, -6, 6); a = nz(rand, -6, 6); b = nz(rand, -9, 9); ans = [0, k * b, k * a];
      list = [{ c: [0, 2 * k * a + k * b], id: 'mc:x-fois-x', err: 'notion', fb: 'x × x = x², pas 2x.' }, { c: [b, 0, k * a], id: 'mc:distributivite-partielle', err: 'notion', fb: `${fr(k)}x multiplie les deux termes de la parenthèse.` }];
    } while (Math.abs(k) < 2 || !pDistinct(ans, list));
    const inner = rand() < 0.5 ? poly([b, a]) : `${fr(b)} ${a < 0 ? '−' : '+'} ${Math.abs(a) === 1 ? '' : Math.abs(a)}x`;
    const expr = `${fr(k)}x(${inner})`;
    return devEx(rand, ans, expr, {
      expectedSeconds: 90, misconceptions: list.map((x) => pmc(x.c, x.id, x.err, x.fb)),
      hints: [`Multiplie ${fr(k)}x par chaque terme de la parenthèse.`, `$${fr(k)}x × ${poly([0, a])} = ${poly([0, 0, k * a])}$ (x × x = x²).`],
      solution: `$${expr} = ${poly([0, 0, k * a])}${xTerm(k * b)} = ${poly(ans)}$`,
    });
  },
  /** à l'envers : Ax + B = k(…) */
  factoriser(rand) {
    let k; let a; let b; let list;
    do {
      k = ri(rand, 2, 9); a = nz(rand, -9, 9); b = nz(rand, -9, 9);
      list = [{ c: [k * b, a], id: 'mc:factor-partielle', err: 'notion', fb: `Les deux termes doivent être divisés par ${k} : $${fr(k * b)} ÷ ${k} = ${fr(b)}$.` }, { c: [k * b - k, k * a - k], id: 'mc:factoriser-soustraire', err: 'notion', fb: `Mettre ${k} en facteur, c’est diviser chaque terme par ${k}, pas lui soustraire ${k}.` }];
    } while (gcd(a, b) !== 1 || !pDistinct([b, a], list));
    const lhs = poly([k * b, k * a]);
    return expression(poly([b, a]), {
      form: 'developpee-reduite', expectedSeconds: 90, skills: ['m4.litteral.reduire'],
      prompt: `Complète l’égalité : $${lhs} = ${k}(…)$. Écris l’expression qui va entre les parenthèses.`,
      misconceptions: list.map((x) => pmc(x.c, x.id, x.err, x.fb)),
      hints: [`Il faut que ${k} × (…) redonne $${lhs}$.`, `$${poly([0, k * a])} ÷ ${k} = ${poly([0, a])}$ ; et le nombre ?`, 'Vérifie en développant ta réponse.'],
      solution: `$${lhs} = ${k}(${poly([b, a])})$ car $${k} × ${poly([0, a])} = ${poly([0, k * a])}$ et $${k} × ${par(b)} = ${fr(k * b)}$.`,
    });
  },
};

const DV_EXPERT = {
  /** px(ax + b) − m(cx² + d) */
  xcarre(rand) {
    let p; let a; let b; let m; let c; let d; let ans; let list;
    do {
      p = nz(rand, -4, 5); a = nz(rand, -5, 5); b = nz(rand, -9, 9); m = ri(rand, 2, 5); c = nz(rand, -4, 4); d = nz(rand, -9, 9); ans = [-m * d, p * b, p * a - m * c];
      list = [{ c: [m * d, p * b, p * a - m * c], id: 'mc:moins-devant-parenthese', err: 'signe', fb: `$− ${m}(${poly([d, 0, c])}) = ${poly([-m * d, 0, -m * c])}$ : le « − » s’applique aux deux termes.` },
        { c: [-m * d, 2 * p * a + p * b, -m * c], id: 'mc:x-fois-x', err: 'notion', fb: 'x × x = x², pas 2x.' },
        { c: [b - m * d, 0, p * a - m * c], id: 'mc:distributivite-partielle', err: 'notion', fb: `${fr(p)}x multiplie les deux termes de sa parenthèse.` }];
    } while (Math.abs(p) < 2 || !ans[2] || !pDistinct(ans, list));
    const expr = `${fr(p)}x(${poly([b, a])}) − ${m}(${poly([d, 0, c])})`;
    return devEx(rand, ans, expr, {
      expectedSeconds: 180, skills: ['m4.litteral.reduire'], misconceptions: list.map((x) => pmc(x.c, x.id, x.err, x.fb)),
      hints: ['Développe chaque produit séparément.', `$${fr(p)}x(${poly([b, a])}) = ${poly([0, p * b, p * a])}$ ; attention au « − » devant ${m}(…).`, `$− ${m}(${poly([d, 0, c])}) = ${poly([-m * d, 0, -m * c])}$, puis regroupe les x² entre eux.`],
      solution: `$${expr} = ${poly([0, p * b, p * a])} ${poly([-m * d, 0, -m * c]).startsWith('−') ? '' : '+ '}${poly([-m * d, 0, -m * c])} = ${poly(ans)}$`,
    });
  },
  /** à l'envers, facteur négatif : −6x + 15 = −3(…) */
  factoriserNeg(rand) {
    let k; let a; let b; let list;
    do {
      k = -ri(rand, 2, 9); a = nz(rand, -9, 9); b = nz(rand, -9, 9);
      list = [{ c: [-b, -a], id: 'mc:signe-factorisation', err: 'signe', fb: `On divise chaque terme par ${fr(k)} (un nombre négatif) : les deux signes changent.` },
        { c: [-b, a], id: 'mc:signe-partiel', err: 'signe', fb: `Développe ta réponse pour vérifier : $${fr(k)} × (…)$ doit redonner les deux termes avec leur signe.` },
        { c: [k * b, a], id: 'mc:factor-partielle', err: 'notion', fb: `Les deux termes doivent être divisés par ${fr(k)}.` }];
    } while (gcd(a, b) !== 1 || !pDistinct([b, a], list));
    const lhs = poly([k * b, k * a]);
    return expression(poly([b, a]), {
      form: 'developpee-reduite', expectedSeconds: 120, skills: ['m4.litteral.reduire'],
      prompt: rand() < 0.5 ? `Complète l’égalité : $${lhs} = ${fr(k)}(…)$. Écris l’expression qui va entre les parenthèses.` : `Factorise $${lhs}$ en mettant ${fr(k)} en facteur : écris seulement ce qui va entre les parenthèses de $${fr(k)}(…)$.`,
      misconceptions: list.map((x) => pmc(x.c, x.id, x.err, x.fb)),
      hints: [`Il faut que ${fr(k)} × (…) redonne $${lhs}$.`, `Divise chaque terme par ${fr(k)} : $${poly([0, k * a])} ÷ ${par(k)} = ${poly([0, a])}$.`, 'Vérifie en développant ta réponse.'],
      solution: `$${lhs} = ${fr(k)}(${poly([b, a])})$ car $${fr(k)} × ${poly([0, a])} = ${poly([0, k * a])}$ et $${fr(k)} × ${par(b)} = ${fr(k * b)}$.`,
    });
  },
  /** k(ax + b) − m(cx + d) avec ka = mc : il ne reste qu'un nombre (cas piège) */
  annule(rand) {
    let k; let m; let c; let a; let b; let d; let R; let vals;
    do { k = ri(rand, 2, 6); m = ri(rand, 2, 6); c = nz(rand, -6, 6); a = (m * c) / k; b = nz(rand, -9, 9); d = nz(rand, -9, 9); R = k * b - m * d; vals = [k * b + m * d, b - d]; } while (k === m || !Number.isInteger(a) || !R || !distinct(R, vals));
    const expr = `${k}(${poly([b, a])}) − ${m}(${poly([d, c])})`;
    return expression(String(R), {
      form: 'developpee-reduite', expectedSeconds: 150, skills: ['m4.litteral.reduire'],
      prompt: rand() < 0.5 ? `${pick(rand, DEV)} : $${expr}$` : `Montre que l’expression $${expr}$ ne dépend pas de x : développe-la et réduis-la.`,
      misconceptions: [mc(String(vals[0]), 'mc:moins-devant-parenthese', 'signe', `$− ${m}(${poly([d, c])}) = ${poly([-m * d, -m * c])}$ : le « − » change le signe des deux termes.`), mc(String(vals[1]), 'mc:distributivite-partielle', 'notion', 'Chaque facteur multiplie les deux termes de sa parenthèse, y compris le nombre.')],
      hints: ['Développe chaque produit ; attention au « − » devant le second.', `$${k}(${poly([b, a])}) = ${poly([k * b, k * a])}$ et $− ${m}(${poly([d, c])}) = ${poly([-m * d, -m * c])}$.`, 'Regroupe les termes en x : que remarques-tu ?'],
      solution: `$${expr} = ${poly([k * b, k * a])}${xTerm(-m * c)}${sgn(-m * d)} = ${fr(R)}$ : les termes en x s’annulent.`,
    });
  },
};

/* ---------------------- calcul littéral : double distributivité ---------- */

const prodPoly = (p, q) => [p[0] * q[0], p[0] * q[1] + p[1] * q[0], p[1] * q[1]];
const subPoly = (p, q) => p.map((v, i) => v - (q[i] || 0));

const DD_APPRO = {
  /** (b − ax)(cx + d) */
  negatif(rand) {
    let a; let b; let c; let d; let ans; let list;
    do {
      a = ri(rand, 1, 5); b = nz(rand, -9, 9); c = nz(rand, -5, 5); d = nz(rand, -9, 9); ans = [b * d, -a * d + b * c, -a * c];
      list = [{ c: [b * d, 0, -a * c], id: 'mc:oubli-termes-croises', err: 'notion', fb: 'Chaque terme de la première parenthèse multiplie chaque terme de la seconde : il y a 4 produits.' }, { c: [b * d, a * d + b * c, -a * c], id: 'mc:signe-produit', err: 'signe', fb: `$− ${a === 1 ? '' : a}x × ${par(d)}$ : attention au signe de ce produit.` }];
    } while (!ans[1] || !pDistinct(ans, list));
    const f2 = rand() < 0.5 ? poly([d, c]) : `${fr(d)} ${c < 0 ? '−' : '+'} ${Math.abs(c) === 1 ? '' : Math.abs(c)}x`;
    const expr = `(${fr(b)} − ${a === 1 ? '' : a}x)(${f2})`;
    return devEx(rand, ans, expr, {
      expectedSeconds: 150, misconceptions: list.map((x) => pmc(x.c, x.id, x.err, x.fb)),
      hints: ['Quatre produits : chaque terme de la première parenthèse par chaque terme de la seconde.', `Le terme en x de la première parenthèse est $${poly([0, -a])}$ (avec son signe).`, 'Regroupe les deux termes en x.'],
      solution: `$${expr} = ${poly([b * d, b * c])}${xTerm(-a * d)}${poly([0, 0, -a * c]).startsWith('−') ? ' ' : ' + '}${poly([0, 0, -a * c])} = ${poly(ans)}$`,
    });
  },
  /** (ax + b)² */
  carre(rand) {
    let a; let b; let ans; let list;
    do {
      a = nz(rand, -5, 5); b = nz(rand, -9, 9); ans = [b * b, 2 * a * b, a * a];
      list = [{ c: [b * b, 0, a * a], id: 'mc:carre-somme', err: 'notion', fb: `$(${poly([b, a])})² = (${poly([b, a])})(${poly([b, a])})$ : il y a aussi les deux produits croisés.` }, { c: [2 * b, 2 * a], id: 'mc:carre-double', err: 'notion', fb: 'Le carré, c’est multiplier l’expression par elle-même, pas par 2.' }, { c: [b * b, a * b, a * a], id: 'mc:double-produit', err: 'notion', fb: 'Le produit croisé apparaît deux fois.' }];
    } while (!pDistinct(ans, list));
    const f = poly([b, a]);
    return devEx(rand, ans, `(${f})²`, {
      expectedSeconds: 120, misconceptions: list.map((x) => pmc(x.c, x.id, x.err, x.fb)),
      hints: [`Écris le carré comme un produit : $(${f})(${f})$.`, 'Quatre produits : deux d’entre eux sont les mêmes.', `$${poly([0, a])} × ${par(b)}$ apparaît deux fois.`],
      solution: `$(${f})² = (${f})(${f}) = ${poly([0, 0, a * a])}${xTerm(a * b)}${xTerm(a * b)}${sgn(b * b)} = ${poly(ans)}$`,
    });
  },
  /** (ax + b)(cx + d) ± k(ex + f) */
  mixte(rand) {
    let a; let b; let c; let d; let k; let ee; let f; let P; let ans; let list;
    do {
      a = ri(rand, 1, 4); b = nz(rand, -7, 7); c = ri(rand, 1, 4); d = nz(rand, -7, 7); k = nz(rand, -5, 5); ee = nz(rand, -5, 5); f = nz(rand, -9, 9);
      P = prodPoly([b, a], [d, c]); ans = [P[0] + k * f, P[1] + k * ee, P[2]];
      list = [{ c: [P[0] + k * f, k * ee, P[2]], id: 'mc:oubli-termes-croises', err: 'notion', fb: 'Dans le produit des deux parenthèses, il y a 4 produits : n’oublie pas les termes croisés.' }, { c: [P[0] + Math.sign(k) * f, P[1] + k * ee, P[2]], id: 'mc:distributivite-partielle', err: 'notion', fb: `${fr(k)} multiplie les deux termes de sa parenthèse.` }];
    } while (Math.abs(k) < 2 || !ans[1] || !pDistinct(ans, list));
    const expr = `(${poly([b, a])})(${poly([d, c])}) ${k < 0 ? '−' : '+'} ${Math.abs(k)}(${poly([f, ee])})`;
    return devEx(rand, ans, expr, {
      expectedSeconds: 180, misconceptions: list.map((x) => pmc(x.c, x.id, x.err, x.fb)),
      hints: ['Développe séparément le produit des deux parenthèses et le second produit.', `$(${poly([b, a])})(${poly([d, c])}) = ${poly(P)}$`, `Puis $${k < 0 ? '−' : '+'} ${Math.abs(k)}(${poly([f, ee])})$ donne $${poly([k * f, k * ee])}$ ; regroupe.`],
      solution: `$${expr} = ${poly(P)}${xTerm(k * ee)}${sgn(k * f)} = ${poly(ans)}$`,
    });
  },
};

const DD_EXPERT = {
  /** (ax + b)(cx + d) − (ex + f)(gx + h) */
  difference(rand) {
    let a; let b; let c; let d; let ee; let f; let g; let h; let P1; let P2; let ans; let list;
    do {
      a = ri(rand, 1, 4); b = nz(rand, -7, 7); c = ri(rand, 1, 4); d = nz(rand, -7, 7); ee = ri(rand, 1, 4); f = nz(rand, -7, 7); g = ri(rand, 1, 4); h = nz(rand, -7, 7);
      P1 = prodPoly([b, a], [d, c]); P2 = prodPoly([f, ee], [h, g]); ans = subPoly(P1, P2);
      list = [{ c: [P1[0] + P2[0], P1[1] + P2[1], P1[2] - P2[2]], id: 'mc:moins-devant-parenthese', err: 'signe', fb: 'Le « − » devant le second produit change le signe de CHAQUE terme de son développement : écris-le entre parenthèses.' }, { c: [P1[0] - P2[0], 0, P1[2] - P2[2]], id: 'mc:oubli-termes-croises', err: 'notion', fb: 'Chaque produit de deux parenthèses donne 4 termes : n’oublie pas les termes croisés.' }];
    } while (ans.every((v) => !v) || !pDistinct(ans, list));
    const expr = `(${poly([b, a])})(${poly([d, c])}) − (${poly([f, ee])})(${poly([h, g])})`;
    return devEx(rand, ans, expr, {
      expectedSeconds: 240, skills: ['m4.litteral.reduire'], misconceptions: list.map((x) => pmc(x.c, x.id, x.err, x.fb)),
      hints: ['Développe chaque produit séparément, et garde le second entre parenthèses.', `$(${poly([b, a])})(${poly([d, c])}) = ${poly(P1)}$ et $(${poly([f, ee])})(${poly([h, g])}) = ${poly(P2)}$.`, 'Le « − » change le signe de chaque terme du second développement.'],
      solution: `$${expr} = ${poly(P1)} − (${poly(P2)}) = ${poly(ans)}$`,
    });
  },
  /** (ax + n)(cx + d) = … : retrouver n */
  manquant(rand) {
    let a; let c; let d; let n; let rhs; let vals;
    do { a = ri(rand, 1, 5); c = ri(rand, 2, 4); d = nz(rand, -9, 9); n = nz(rand, -9, 9); rhs = [n * d, a * d + n * c, a * c]; vals = [-n, rhs[1], rhs[1] / c]; } while (!rhs[1] || !distinct(n, vals));
    return numeric(n, {
      prompt: `Trouve le nombre n pour que l’égalité soit vraie pour toute valeur de x : $(${poly([0, a])} + n)(${poly([d, c])}) = ${poly(rhs)}$.`, expectedSeconds: 210,
      misconceptions: [mc(-n, 'mc:regle-signes', 'signe', `Vérifie le signe : $n × ${par(d)}$ doit valoir ${fr(n * d)}.`), mc(rhs[1], 'mc:lecture', 'lecture', `${fr(rhs[1])} est le coefficient de x, qui vient de deux produits (${poly([0, a])} × ${par(d)} et n × ${poly([0, c])}) : ce n’est pas n.`), mc(clean(rhs[1] / c), 'mc:oubli-termes-croises', 'notion', `Le terme en x vient de deux produits : $${poly([0, a])} × ${par(d)}$ ET $n × ${poly([0, c])}$.`)],
      hints: ['Développe le membre de gauche en gardant la lettre n.', `Le terme constant donne : $n × ${par(d)} = ${fr(n * d)}$.`, `Vérifie avec le coefficient de x : $${fr(a * d)} + ${c}n = ${fr(rhs[1])}$.`],
      solution: `Terme constant : ${par(d)} × n = ${fr(n * d)}, donc n = ${fr(n)}. Vérification sur le terme en x : ${fr(a * d)} + ${c} × ${par(n)} = ${fr(rhs[1])}.`,
    });
  },
  /** (ax + b)² − (ax − b)² ou (x + b)(x − b) − (x − b)² : presque tout s'annule */
  piege(rand) {
    let a; let b; let ans; let expr; let list;
    if (rand() < 0.5) {
      a = ri(rand, 1, 4); b = nz(rand, -6, 6); ans = [0, 4 * a * b];
      expr = `(${poly([b, a])})² − (${poly([-b, a])})²`;
      list = [{ c: [0], id: 'mc:carre-somme', err: 'notion', fb: 'Un carré se développe en écrivant le produit : il y a aussi le double produit croisé, qui ne disparaît pas.' }, { c: [2 * b * b], id: 'mc:moins-devant-parenthese', err: 'signe', fb: 'Le « − » devant le second carré change le signe de CHAQUE terme de son développement.' }];
    } else {
      b = nz(rand, -7, 7); ans = [-2 * b * b, 2 * b];
      expr = `(${poly([b, 1])})(${poly([-b, 1])}) − (${poly([-b, 1])})²`;
      list = [{ c: [-2 * b * b], id: 'mc:carre-somme', err: 'notion', fb: `$(${poly([-b, 1])})² = (${poly([-b, 1])})(${poly([-b, 1])})$ : il y a aussi les produits croisés.` }, { c: [0, -2 * b], id: 'mc:moins-devant-parenthese', err: 'signe', fb: 'Le « − » devant le carré change le signe de CHAQUE terme de son développement.' }];
    }
    return devEx(rand, ans, expr, {
      expectedSeconds: 210, skills: ['m4.litteral.reduire'], misconceptions: list.map((x) => pmc(x.c, x.id, x.err, x.fb)),
      hints: ['Écris chaque carré comme un produit et développe.', 'Mets le second développement entre parenthèses : le « − » change le signe de chacun de ses termes.', 'Beaucoup de termes s’annulent : c’est normal.'],
      solution: `$${expr} = ${poly(ans)}$ (les termes en x² et une partie des autres s’annulent).`,
    });
  },
};
