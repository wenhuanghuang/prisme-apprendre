/**
 * Générateurs de calcul pour les mathématiques et la physique-chimie.
 * Chaque tirage produit un exercice ordinaire (numeric, expression ou steps) : énoncé, indices,
 * correction rédigée et réponses fausses typiques calculées avec les mêmes nombres,
 * pour que le diagnostic reste aussi précis que dans les leçons.
 * Le tirage est reproductible : même générateur, même graine, mêmes options → même exercice.
 */
import { rng } from '../core/template.js';
import { formatNumber, tryParse, equivalent, evaluate } from '../core/expr.js';

const ri = (rand, a, b) => a + Math.floor(rand() * (b - a + 1));
const nz = (rand, a, b) => { for (;;) { const x = ri(rand, a, b); if (x !== 0) return x; } };
const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];
const clean = (x) => Number(Number(x).toPrecision(12));
const fr = (n) => formatNumber(clean(n));
const par = (n) => (n < 0 ? `(${fr(n)})` : fr(n));
const plain = (n) => String(clean(n)).replace('.', ',');
const sq = (n) => clean(n * n);
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
function frac(n, d) { const s = d < 0 ? -1 : 1; const g = gcd(n, d) || 1; return [(s * n) / g, (s * d) / g]; }
const fracStr = ([n, d]) => (d === 1 ? String(n) : `${n}/${d}`);
/** « + 5 » ou « − 5 » pour écrire un terme à la suite d'un autre. */
const sgn = (n) => (n < 0 ? ` − ${fr(-n)}` : ` + ${fr(n)}`);
/** « + 3x », « − x » : terme en x écrit à la suite d'un autre (développement non réduit). */
const xTerm = (k) => `${k < 0 ? ' − ' : ' + '}${Math.abs(k) === 1 ? '' : fr(Math.abs(k))}x`;

/** Polynôme [a0, a1, a2] écrit dans l'ordre décroissant : « 6x² − 7x + 2 ». */
function poly(c, v = 'x') {
  const terms = [];
  for (let k = c.length - 1; k >= 0; k--) {
    const a = clean(c[k] || 0);
    if (!a) continue;
    const abs = Math.abs(a);
    const body = k === 0 ? fr(abs) : `${abs === 1 ? '' : fr(abs)}${v}${k === 2 ? '²' : ''}`;
    terms.push({ neg: a < 0, body });
  }
  if (!terms.length) return '0';
  return terms.map((t, i) => (i === 0 ? `${t.neg ? '−' : ''}${t.body}` : `${t.neg ? ' − ' : ' + '}${t.body}`)).join('');
}

const mc = (answer, id, error, feedback) => ({ answer, id, error, feedback });

function numeric(answer, rest = {}) {
  const value = clean(answer);
  return { type: 'numeric', answer: value, generatedAnswer: { value: rest.unit && !rest.unitOptional ? `${plain(value)} ${rest.unit}` : plain(value) }, ...rest };
}

function expression(answer, rest = {}) {
  return { type: 'expression', answer, generatedAnswer: { value: answer }, ...rest };
}

/* ======================================================================= */
/*                              Mathématiques                              */
/* ======================================================================= */

const GENERATORS = [];
const add = (g) => GENERATORS.push({ subject: 'maths', ...g });

add({
  id: 'm-relatifs-somme', label: 'Relatifs : additions et soustractions', skill: 'm5.relatifs.addition', levels: ['5e', '4e'],
  description: 'Un calcul à la fois ; les confusions de signe et l’oubli de l’opposé sont repérés.',
  options: [
    { id: 'op', label: 'Opération', values: [{ id: 'mixte', label: 'Les deux' }, { id: 'addition', label: 'Additions' }, { id: 'soustraction', label: 'Soustractions' }] },
    { id: 'nombres', label: 'Nombres', values: [{ id: 'entiers', label: 'Entiers' }, { id: 'decimaux', label: 'Décimaux' }] },
  ],
  make(rand, o) {
    const op = o.op === 'addition' ? '+' : o.op === 'soustraction' ? '-' : pick(rand, ['+', '-']);
    const nombres = o.nombres || (rand() < 0.3 ? 'decimaux' : 'entiers');
    const draw = () => (nombres === 'decimaux' ? nz(rand, -99, 99) / 10 : nz(rand, -20, 20));
    const a = draw(); const b = draw();
    const added = op === '+' ? b : -b;
    const ans = clean(a + added);
    const mcs = [];
    if (op === '-') mcs.push(mc(clean(a + b), 'mc:soustraire-opposé', 'notion', `Soustraire ${par(b)}, c’est ajouter son opposé ${par(-b)}. Ici, tu as ajouté ${par(b)}.`));
    if (Math.sign(a) !== Math.sign(added)) mcs.push(mc(clean(Math.sign(ans || 1) * (Math.abs(a) + Math.abs(added))), 'mc:distances-ajoutees', 'notion', 'Les deux termes ont des signes contraires : on soustrait leurs distances à zéro, on ne les additionne pas.'));
    mcs.push(mc(-ans, 'mc:signe-somme', 'signe', 'La distance à zéro est juste, mais pas le signe : le résultat prend le signe du terme le plus éloigné de zéro.'));
    const opTxt = op === '+' ? '+' : '−';
    return numeric(ans, {
      prompt: `Calcule : $${fr(a)} ${opTxt} ${par(b)}$`,
      misconceptions: mcs, difficulty: nombres === 'decimaux' ? 3 : 2, expectedSeconds: 40,
      hints: [op === '-' ? `Remplace « − ${par(b)} » par « + ${par(-b)} » : soustraire un nombre, c’est ajouter son opposé.` : 'Les deux termes ont-ils le même signe ?',
        'Même signe : on ajoute les distances à zéro. Signes contraires : on les soustrait, et le résultat prend le signe du terme le plus éloigné de zéro.'],
      solution: op === '-' ? `$${fr(a)} − ${par(b)} = ${fr(a)} + ${par(-b)} = ${fr(ans)}$` : `$${fr(a)} + ${par(b)} = ${fr(ans)}$`,
    });
  },
});

add({
  id: 'm-relatifs-produit', label: 'Relatifs : multiplications et divisions', skill: 'm4.relatifs.produit', levels: ['4e', '3e'],
  description: 'Produits et quotients de relatifs ; la règle des signes est diagnostiquée.',
  options: [{ id: 'op', label: 'Opération', values: [{ id: 'mixte', label: 'Les deux' }, { id: 'multiplication', label: 'Multiplications' }, { id: 'division', label: 'Divisions' }] }],
  make(rand, o) {
    const op = o.op === 'multiplication' ? '×' : o.op === 'division' ? '÷' : pick(rand, ['×', '÷']);
    const signHint = 'Compte les facteurs négatifs : un nombre pair donne un résultat positif, un nombre impair un résultat négatif.';
    if (op === '×' && rand() < 0.35) {
      const a = nz(rand, -6, 6); const b = nz(rand, -6, 6); const c = nz(rand, -5, 5);
      const ans = a * b * c;
      const negs = [a, b, c].filter((x) => x < 0).length;
      return numeric(ans, {
        prompt: `Calcule : $${fr(a)} × ${par(b)} × ${par(c)}$`, difficulty: 3, expectedSeconds: 45,
        misconceptions: [mc(-ans, 'mc:regle-signes', 'signe', `Il y a ${negs} facteur${negs > 1 ? 's' : ''} négatif${negs > 1 ? 's' : ''} : le produit est ${negs % 2 ? 'négatif' : 'positif'}.`)],
        hints: [signHint, 'Multiplie ensuite les distances à zéro.'],
        solution: `${negs} facteur${negs > 1 ? 's' : ''} négatif${negs > 1 ? 's' : ''} → produit ${negs % 2 ? 'négatif' : 'positif'} ; $${Math.abs(a)} × ${Math.abs(b)} × ${Math.abs(c)} = ${Math.abs(ans)}$, donc le résultat est ${fr(ans)}.`,
      });
    }
    const a = nz(rand, -12, 12); const b = nz(rand, -12, 12);
    if (op === '×') {
      const ans = a * b;
      return numeric(ans, {
        prompt: `Calcule : $${fr(a)} × ${par(b)}$`, expectedSeconds: 30,
        misconceptions: [mc(-ans, 'mc:regle-signes', 'signe', 'Règle des signes : deux nombres de même signe donnent un produit positif, de signes contraires un produit négatif.'), mc(clean(a + b), 'mc:operation', 'notion', 'Tu as additionné au lieu de multiplier.')],
        hints: [signHint], solution: `$${fr(a)} × ${par(b)} = ${fr(ans)}$ (${a * b > 0 ? 'mêmes signes : positif' : 'signes contraires : négatif'}).`,
      });
    }
    const dividend = a * b;
    return numeric(a, {
      prompt: `Calcule : $${fr(dividend)} ÷ ${par(b)}$`, expectedSeconds: 30,
      misconceptions: [mc(-a, 'mc:regle-signes', 'signe', 'Pour un quotient, la règle des signes est la même que pour un produit.')],
      hints: [signHint, `Cherche le nombre qui, multiplié par ${par(b)}, donne ${fr(dividend)}.`],
      solution: `$${fr(dividend)} ÷ ${par(b)} = ${fr(a)}$ car $${par(a)} × ${par(b)} = ${fr(dividend)}$.`,
    });
  },
});

add({
  id: 'm-priorites', label: 'Priorités opératoires', skill: 'm5.calcul.priorites', levels: ['5e', '4e'],
  description: 'Calculs avec ou sans parenthèses ; le calcul « de gauche à droite » est repéré. Option : écrire chaque étape.',
  options: [{ id: 'reponse', label: 'Réponse', values: [{ id: 'resultat', label: 'Le résultat' }, { id: 'etapes', label: 'Toutes les étapes' }] }],
  make(rand, o) {
    const b = ri(rand, 2, 9); const c = ri(rand, 2, 9);
    const t = ri(rand, 1, 6);
    let expr; let ans; let steps; let wrong; let wrongId = 'mc:gauche-a-droite'; let wrongFb = 'La multiplication est prioritaire sur l’addition et la soustraction : on la calcule d’abord.';
    if (t === 1) { const a = ri(rand, 2, 20); expr = `${a} + ${b} × ${c}`; ans = a + b * c; steps = [`${a} + ${b * c}`]; wrong = (a + b) * c; }
    else if (t === 2) { const a = b * c + ri(rand, 1, 30); expr = `${a} − ${b} × ${c}`; ans = a - b * c; steps = [`${a} − ${b * c}`]; wrong = (a - b) * c; }
    else if (t === 3) { const a = ri(rand, 2, 9); expr = `${a} × (${b} + ${c})`; ans = a * (b + c); steps = [`${a} × ${b + c}`]; wrong = a * b + c; wrongId = 'mc:parentheses-ignorees'; wrongFb = 'Les calculs entre parenthèses sont prioritaires : on calcule d’abord ce qu’elles contiennent.'; }
    else if (t === 4) { const a = ri(rand, 2, 20); const k = ri(rand, 2, 9); expr = `${a} + ${c * k} ÷ ${c}`; ans = a + k; steps = [`${a} + ${k}`]; wrong = clean((a + c * k) / c); wrongFb = 'La division est prioritaire sur l’addition : on la calcule d’abord.'; }
    else if (t === 5) { const a = ri(rand, 3, 9); const d = ri(rand, 2, Math.max(2, Math.min(5, Math.floor((a * b) / 3)))); const cc = ri(rand, 1, Math.max(1, Math.floor((a * b - 1) / d))); expr = `${a} × ${b} − ${cc} × ${d}`; ans = a * b - cc * d; steps = [`${a * b} − ${cc * d}`]; wrong = (a * b - cc) * d; }
    else { const a = ri(rand, 2, 9); const d = ri(rand, 1, c - 1 || 1); const cc = d + ri(rand, 1, 6); expr = `(${a} + ${b}) × (${cc} − ${d})`; ans = (a + b) * (cc - d); steps = [`${a + b} × ${cc - d}`]; wrong = a + b * cc - d; wrongId = 'mc:parentheses-ignorees'; wrongFb = 'Les calculs entre parenthèses sont prioritaires : on calcule d’abord ce qu’elles contiennent.'; }
    const common = {
      difficulty: t >= 5 ? 3 : 2, expectedSeconds: 60,
      hints: ['Repère d’abord les parenthèses, puis les multiplications et divisions, enfin les additions et soustractions.', `Première étape : ${steps[0]}.`],
      solution: `$${expr} = ${steps[0]} = ${fr(ans)}$`,
    };
    if ((o.reponse || (rand() < 0.4 ? 'etapes' : 'resultat')) === 'etapes') {
      return { type: 'steps', mode: 'calcul', start: expr, minSteps: 2, prompt: `Calcule en écrivant chaque étape (une par ligne) : $${expr}$`, misconceptions: [], generatedAnswer: { lines: [steps[0], String(ans)] }, ...common };
    }
    return numeric(ans, { prompt: `Calcule : $${expr}$`, misconceptions: [mc(wrong, wrongId, 'notion', wrongFb)], ...common });
  },
});

add({
  id: 'm-fractions-somme', label: 'Fractions : additions et soustractions', skill: 'm5.fractions.addition', levels: ['5e', '4e'],
  description: 'Mettre au même dénominateur, puis simplifier ; l’addition des dénominateurs est diagnostiquée.',
  options: [
    { id: 'denominateurs', label: 'Dénominateurs', values: [{ id: 'multiple', label: 'L’un multiple de l’autre' }, { id: 'quelconques', label: 'Quelconques' }] },
    { id: 'op', label: 'Opération', values: [{ id: 'mixte', label: 'Les deux' }, { id: 'addition', label: 'Additions' }, { id: 'soustraction', label: 'Soustractions' }] },
  ],
  make(rand, o) {
    const op = o.op === 'addition' ? '+' : o.op === 'soustraction' ? '-' : pick(rand, ['+', '-']);
    // programme 2026 de 5e : dénominateurs quelconques (voir la compétence m5.fractions.addition)
    const denominateurs = o.denominateurs || pick(rand, ['multiple', 'quelconques']);
    let b; let d;
    if (denominateurs === 'quelconques') { do { b = ri(rand, 2, 9); d = ri(rand, 2, 9); } while (b === d || b % d === 0 || d % b === 0); }
    else { b = ri(rand, 2, 9); d = b * ri(rand, 2, 4); if (rand() < 0.5) [b, d] = [d, b]; }
    // fractions de l'énoncé déjà irréductibles (on ne propose pas « 2/8 »)
    const numFor = (den) => { for (;;) { const n = ri(rand, 1, 2 * den - 1); if (gcd(n, den) === 1) return n; } };
    let a = numFor(b); let c = numFor(d);
    if (op === '-' && a / b < c / d) [a, b, c, d] = [c, d, a, b];
    if (op === '-' && a * d === c * b) a += 1;
    const m = (b * d) / gcd(b, d);
    const num = op === '+' ? a * (m / b) + c * (m / d) : a * (m / b) - c * (m / d);
    const res = frac(num, m);
    const opTxt = op === '+' ? '+' : '−';
    const naive = frac(op === '+' ? a + c : a - c, op === '+' ? b + d : Math.abs(b - d) || 1);
    const mcs = [mc(fracStr(naive), 'mc:ajouter-denominateurs', 'notion', `On n’${op === '+' ? 'additionne' : 'soustrait'} pas les dénominateurs : on écrit d’abord les deux fractions avec le même dénominateur (${m}).`)];
    if (b !== d) {
      const big = Math.max(b, d);
      mcs.push(mc(fracStr(frac(op === '+' ? a + c : a - c, big)), 'mc:numerateur-non-converti', 'notion', `Quand on change le dénominateur d’une fraction, on multiplie aussi son numérateur par le même nombre.`));
    }
    return expression(fracStr(res), {
      form: res[1] === 1 ? 'nombre' : 'irreductible',
      prompt: `Calcule et donne le résultat sous forme ${res[1] === 1 ? 'd’un nombre entier' : 'de fraction irréductible'} : $${a}/${b} ${opTxt} ${c}/${d}$`,
      misconceptions: mcs, difficulty: denominateurs === 'quelconques' ? 3 : 2, expectedSeconds: 90,
      hints: [`Cherche un dénominateur commun à ${b} et ${d} : ${m} convient.`, `$${a}/${b} = ${a * (m / b)}/${m}$ et $${c}/${d} = ${c * (m / d)}/${m}$.`, 'Simplifie le résultat si c’est possible.'],
      solution: `$${a}/${b} ${opTxt} ${c}/${d} = ${a * (m / b)}/${m} ${opTxt} ${c * (m / d)}/${m} = ${num}/${m}${fracStr(res) !== `${num}/${m}` ? ` = ${fracStr(res)}` : ''}$`,
    });
  },
});

add({
  id: 'm-fractions-produit', label: 'Fractions : produits et quotients', skill: 'm4.fractions.produit', levels: ['4e', '3e'],
  description: 'Multiplier, diviser (par l’inverse), simplifier.',
  options: [{ id: 'op', label: 'Opération', values: [{ id: 'mixte', label: 'Les deux' }, { id: 'multiplication', label: 'Produits' }, { id: 'division', label: 'Quotients' }] }],
  make(rand, o) {
    const op = o.op === 'multiplication' ? '×' : o.op === 'division' ? '÷' : pick(rand, ['×', '÷']);
    let a; let b; let c; let d;
    do { a = ri(rand, 1, 9); b = ri(rand, 2, 9); c = ri(rand, 1, 9); d = ri(rand, 2, 9); } while (gcd(a, b) !== 1 || gcd(c, d) !== 1 || (a === c && b === d));
    const res = op === '×' ? frac(a * c, b * d) : frac(a * d, b * c);
    const mcs = op === '×'
      ? [mc(fracStr(frac(a * d, b * c)), 'mc:produit-en-croix', 'notion', 'Pour multiplier deux fractions, on multiplie les numérateurs entre eux et les dénominateurs entre eux (pas en croix).'),
        mc(fracStr(frac(a * c, b + d)), 'mc:ajouter-denominateurs', 'notion', 'Les dénominateurs se multiplient aussi.')]
      : [mc(fracStr(frac(a * c, b * d)), 'mc:division-sans-inverse', 'notion', `Diviser par $${c}/${d}$, c’est multiplier par son inverse $${d}/${c}$.`),
        mc(fracStr(frac(b * c, a * d)), 'mc:inverser-premiere', 'notion', 'C’est la seconde fraction (le diviseur) qu’on inverse, pas la première.')];
    return expression(fracStr(res), {
      form: res[1] === 1 ? 'nombre' : 'irreductible',
      prompt: `Calcule et simplifie : $(${a}/${b}) ${op} (${c}/${d})$`,
      misconceptions: mcs, difficulty: op === '÷' ? 3 : 2, expectedSeconds: 75,
      hints: op === '×' ? ['Numérateur × numérateur, dénominateur × dénominateur.', 'Simplifie à la fin (ou avant de multiplier).'] : [`Diviser par $${c}/${d}$ revient à multiplier par $${d}/${c}$.`, 'Simplifie le résultat.'],
      solution: op === '×' ? `$${a}/${b} × ${c}/${d} = ${a * c}/${b * d}${fracStr(res) !== `${a * c}/${b * d}` ? ` = ${fracStr(res)}` : ''}$` : `$${a}/${b} ÷ ${c}/${d} = ${a}/${b} × ${d}/${c} = ${a * d}/${b * c}${fracStr(res) !== `${a * d}/${b * c}` ? ` = ${fracStr(res)}` : ''}$`,
    });
  },
});

add({
  id: 'm-puissances', label: 'Puissances', skill: 'm4.puissances', levels: ['4e', '3e'],
  description: 'Valeur d’une puissance, règles sur les puissances de 10, notation scientifique.',
  options: [{ id: 'mode', label: 'Type', values: [{ id: 'valeur', label: 'Calculer une puissance' }, { id: 'regles', label: 'Puissances de 10' }, { id: 'scientifique', label: 'Notation scientifique' }] }],
  make(rand, o) {
    const mode = o.mode || pick(rand, ['valeur', 'regles', 'scientifique']);
    if (mode === 'valeur') {
      const base = pick(rand, [2, 3, 4, 5, -2, -3]);
      const n = ri(rand, 2, Math.abs(base) >= 4 ? 3 : 5);
      const ans = base ** n;
      const b = par(base);
      return numeric(ans, {
        prompt: `Calcule : $${b}^${n}$`, expectedSeconds: 40,
        misconceptions: [mc(base * n, 'mc:puissance-produit', 'notion', `$${b}^${n}$ signifie ${n} facteurs égaux à ${b}, pas ${b} × ${n}.`), ...(base < 0 ? [mc(-ans, 'mc:regle-signes', 'signe', `${n} facteurs négatifs : le résultat est ${n % 2 ? 'négatif' : 'positif'}.`)] : [])],
        hints: [`Écris le produit : ${Array(n).fill(b).join(' × ')}.`],
        solution: `$${b}^${n} = ${Array(n).fill(b).join(' × ')} = ${fr(ans)}$`,
      });
    }
    if (mode === 'regles') {
      const p = nz(rand, -5, 9); const q = nz(rand, -5, 6);
      const kind = ri(rand, 1, 3);
      const e = (k) => (k < 0 ? `(${fr(k)})` : String(k));
      if (kind === 1) return numeric(p + q, { prompt: `On a $10^${e(p)} × 10^${e(q)} = 10^n$. Quelle est la valeur de n ?`, misconceptions: [mc(p * q, 'mc:multiplier-exposants', 'notion', 'Pour multiplier deux puissances de 10, on additionne les exposants.')], hints: ['$10^a × 10^b = 10^(a + b)$'], solution: `$10^${e(p)} × 10^${e(q)} = 10^${e(p + q)}$, donc n = ${fr(p + q)}.`, expectedSeconds: 40 });
      if (kind === 2) return numeric(p - q, { prompt: `On a $10^${e(p)} ÷ 10^${e(q)} = 10^n$. Quelle est la valeur de n ?`, misconceptions: [mc(q - p, 'mc:ordre-soustraction', 'signe', 'On soustrait l’exposant du dénominateur à celui du numérateur : a − b, pas b − a.'), mc(p + q, 'mc:additionner-exposants', 'notion', 'Pour diviser, on soustrait les exposants.')], hints: ['$10^a ÷ 10^b = 10^(a − b)$'], solution: `$10^${e(p)} ÷ 10^${e(q)} = 10^${e(p - q)}$, donc n = ${fr(p - q)}.`, expectedSeconds: 40 });
      const k = ri(rand, 2, 4);
      return numeric(p * k, { prompt: `On a $(10^${e(p)})^${k} = 10^n$. Quelle est la valeur de n ?`, misconceptions: [mc(p + k, 'mc:additionner-exposants', 'notion', 'Une puissance de puissance : on multiplie les exposants.')], hints: ['$(10^a)^b = 10^(a × b)$'], solution: `$(10^${e(p)})^${k} = 10^${e(p * k)}$, donc n = ${fr(p * k)}.`, expectedSeconds: 40 });
    }
    const m = ri(rand, 11, 99) / 10;
    const k = pick(rand, [3, 4, 5, 6, 7, 8, -2, -3, -4, -5]);
    const n = clean(m * 10 ** k);
    const mTxt = fr(m);
    const zerosPos = k - (Number.isInteger(m) ? 0 : 1);
    return numeric(k, {
      prompt: `Écris ${fr(n)} en notation scientifique : ${fr(n)} = ${mTxt} × 10ⁿ. Quelle est la valeur de n ?`, difficulty: 3, expectedSeconds: 60,
      misconceptions: k > 0 ? [mc(zerosPos, 'mc:compter-zeros', 'notion', `Compter les zéros ne suffit pas : de combien de rangs faut-il déplacer la virgule pour passer de ${mTxt} à ${fr(n)} ?`)] : [mc(-k, 'mc:exposant-negatif', 'signe', 'Le nombre est plus petit que 1 : l’exposant est négatif.'), mc(k + 1, 'mc:compter-zeros', 'notion', 'Compte de combien de rangs la virgule se déplace pour arriver juste après le premier chiffre non nul.')],
      hints: ['En notation scientifique, il y a un seul chiffre non nul avant la virgule.', `De combien de rangs la virgule se déplace-t-elle entre ${mTxt} et ${fr(n)} ?`],
      solution: `${fr(n)} = ${mTxt} × 10^${k} : la virgule se déplace de ${Math.abs(k)} rang${Math.abs(k) > 1 ? 's' : ''} vers la ${k > 0 ? 'droite' : 'gauche'}.`,
    });
  },
});

add({
  id: 'm-equations', label: 'Équations du premier degré', skill: 'm4.equations.resoudre', levels: ['4e', '3e'],
  description: 'Résoudre ax + b = c ou ax + b = cx + d ; option : écrire chaque étape (la démarche est analysée ligne par ligne).',
  options: [
    { id: 'forme', label: 'Forme', values: [{ id: 'simple', label: 'ax + b = c' }, { id: 'deux-membres', label: 'x dans les deux membres' }] },
    { id: 'reponse', label: 'Réponse', values: [{ id: 'etapes', label: 'Toutes les étapes' }, { id: 'solution', label: 'La solution seule' }] },
  ],
  make(rand, o) {
    const s = nz(rand, -10, 10);
    const forme = o.forme || pick(rand, ['simple', 'deux-membres']);
    const reponse = o.reponse || (rand() < 0.6 ? 'etapes' : 'solution');
    let left; let right; let lines; let mcs;
    if (forme === 'deux-membres') {
      const c = ri(rand, 1, 7); const a = c + ri(rand, 2, 6); const b = nz(rand, -15, 15); const d = (a - c) * s + b;
      left = poly([b, a]); right = poly([d, c]);
      lines = [`${poly([0, a - c])} = ${fr(d - b)}`, `x = ${fr(s)}`];
      mcs = [mc(clean((d - b) / (a + c)), 'mc:transposer-signe', 'signe', `En faisant passer ${poly([0, c])} dans l’autre membre, on le soustrait des deux côtés : on obtient ${poly([0, a - c])}, pas ${poly([0, a + c])}.`),
        mc(clean((d + b) / (a - c)), 'mc:transposer-signe', 'signe', `Pour éliminer ${fr(b)} du membre de gauche, on ${b > 0 ? 'soustrait' : 'ajoute'} ${fr(Math.abs(b))} des deux côtés.`)];
    } else {
      const a = nz(rand, -9, 9) || 2; const aa = Math.abs(a) === 1 ? a * 3 : a; const b = nz(rand, -15, 15); const c = aa * s + b;
      left = poly([b, aa]); right = fr(c);
      lines = [`${poly([0, aa])} = ${fr(c - b)}`, `x = ${fr(s)}`];
      mcs = [mc(clean((c + b) / aa), 'mc:transposer-signe', 'signe', `Pour éliminer ${fr(b)}, on ${b > 0 ? 'soustrait' : 'ajoute'} ${fr(Math.abs(b))} aux deux membres : on obtient ${poly([0, aa])} = ${fr(c - b)}.`),
        mc(c - b - aa, 'mc:isoler-x', 'notion', `${fr(aa)} multiplie x : pour isoler x, on divise par ${fr(aa)}, on ne soustrait pas ${fr(aa)}.`),
        mc((c - b) * aa, 'mc:isoler-x', 'notion', `On divise les deux membres par ${fr(aa)} (on ne multiplie pas).`)];
    }
    const eq = `${left} = ${right}`;
    const common = {
      difficulty: forme === 'deux-membres' ? 3 : 2, expectedSeconds: 150,
      hints: forme === 'deux-membres' ? ['Regroupe les termes en x dans un même membre en soustrayant le plus petit des deux.', `Tu dois obtenir ${lines[0]}.`] : ['Commence par éliminer le nombre ajouté à ax.', `Tu dois obtenir ${lines[0]}, puis divise.`],
      solution: `$${eq}$ ⟶ $${lines[0]}$ ⟶ $${lines[1]}$. Vérification : en remplaçant x par ${fr(s)}, les deux membres sont égaux.`,
    };
    if (reponse === 'solution') return numeric(s, { prompt: `Résous l’équation $${eq}$. Quelle est la valeur de x ?`, misconceptions: mcs, ...common });
    return { type: 'steps', mode: 'equation', start: eq, minSteps: 2, prompt: `Résous l’équation $${eq}$. Écris une étape par ligne, jusqu’à « x = … ».`, misconceptions: [], generatedAnswer: { lines }, ...common };
  },
});

const ITEMS = [['cahiers', 'cahier'], ['stylos', 'stylo'], ['croissants', 'croissant'], ['tickets de bus', 'ticket de bus'], ['baguettes', 'baguette'], ['classeurs', 'classeur']];

add({
  id: 'm-proportionnalite', label: 'Proportionnalité : quatrième proportionnelle', skill: 'm5.proportionnalite', levels: ['5e', '4e'],
  description: 'Prix, recettes, consommation ; le raisonnement additif (« ajouter la différence ») est diagnostiqué.',
  options: [{ id: 'contexte', label: 'Contexte', values: [{ id: 'prix', label: 'Prix' }, { id: 'recette', label: 'Recette' }, { id: 'carburant', label: 'Consommation' }] }],
  make(rand, o) {
    const ctx = o.contexte || pick(rand, ['prix', 'recette', 'carburant']);
    const q1 = ri(rand, 2, 8); let q2 = ri(rand, 2, 15); if (q2 === q1) q2 += 3;
    if (ctx === 'prix') {
      const [pl] = pick(rand, ITEMS); const u = pick(rand, [0.4, 0.5, 0.6, 0.75, 0.8, 1.2, 1.25, 1.5, 2.5, 3]);
      const p1 = clean(q1 * u); const ans = clean(q2 * u);
      return numeric(ans, {
        prompt: `${q1} ${pl} coûtent ${fr(p1)} €. Les prix sont proportionnels aux quantités. Combien coûtent ${q2} ${pl} ?`, representation: 'concrete', tolerance: 0.005, expectedSeconds: 75,
        misconceptions: [mc(clean(p1 + (q2 - q1)), 'mc:modele-additif', 'raisonnement', `Ajouter ${q2 - q1} (la différence des quantités) au prix ne respecte pas la proportionnalité : il faut multiplier.`), mc(clean(p1 * q2), 'mc:oubli-unitaire', 'methode', `Tu as multiplié le prix de ${q1} ${pl} par ${q2} : cherche d’abord le prix d’un seul.`)],
        hints: [`Combien coûte un seul ? ${fr(p1)} ÷ ${q1}.`, `Puis multiplie par ${q2}.`],
        solution: `Prix d’un : ${fr(p1)} ÷ ${q1} = ${fr(u)} €. Prix de ${q2} : ${q2} × ${fr(u)} = ${fr(ans)} €.`,
      });
    }
    if (ctx === 'recette') {
      const per = pick(rand, [20, 25, 30, 40, 50, 60, 75]); const ing = pick(rand, ['farine', 'sucre', 'beurre', 'chocolat']);
      const m1 = q1 * per; const ans = q2 * per;
      return numeric(ans, {
        prompt: `Pour ${q1} personnes, une recette demande ${m1} g de ${ing}. Quelle masse de ${ing} faut-il pour ${q2} personnes ?`, unit: 'g', unitOptional: true, representation: 'concrete', expectedSeconds: 75,
        misconceptions: [mc(m1 + (q2 - q1), 'mc:modele-additif', 'raisonnement', 'Ajouter la différence du nombre de personnes ne convient pas : les quantités sont proportionnelles, il faut multiplier.'), mc(m1 * q2, 'mc:oubli-unitaire', 'methode', `Cherche d’abord la masse pour une personne : ${m1} ÷ ${q1}.`)],
        hints: [`Masse pour une personne : ${m1} ÷ ${q1}.`], solution: `Pour une personne : ${m1} ÷ ${q1} = ${per} g. Pour ${q2} personnes : ${q2} × ${per} = ${ans} g.`,
      });
    }
    const cons = pick(rand, [4, 5, 5.5, 6, 6.5, 7, 8]); const d1 = pick(rand, [100, 200, 300, 400, 50]); const d2 = pick(rand, [150, 250, 350, 500, 600, 800].filter((x) => x !== d1));
    const l1 = clean((cons * d1) / 100); const ans = clean((cons * d2) / 100);
    return numeric(ans, {
      prompt: `Une voiture consomme ${fr(l1)} L de carburant pour ${d1} km. La consommation est proportionnelle à la distance. Combien consomme-t-elle pour ${d2} km ?`, unit: 'L', unitOptional: true, tolerance: 0.005, representation: 'concrete', difficulty: 3, expectedSeconds: 90,
      misconceptions: [mc(clean(l1 + (d2 - d1)), 'mc:modele-additif', 'raisonnement', 'On ne peut pas ajouter des kilomètres à des litres : il faut un coefficient de proportionnalité.'), mc(clean((l1 * d1) / d2), 'mc:rapport-inverse', 'raisonnement', 'Plus la distance est grande, plus la consommation est grande : vérifie le sens du calcul.')],
      hints: [`Calcule la consommation pour 1 km, ou pour 100 km : ${fr(l1)} ÷ ${d1} × 100.`], solution: `Pour 100 km : ${fr(cons)} L. Pour ${d2} km : ${fr(cons)} × ${d2} ÷ 100 = ${fr(ans)} L.`,
    });
  },
});

add({
  id: 'm-pourcentages', label: 'Pourcentages', skill: 'm5.pourcentages', levels: ['5e', '4e'],
  description: 'Prendre un pourcentage, appliquer une réduction ou une augmentation.',
  options: [{ id: 'mode', label: 'Type', values: [{ id: 'part', label: 'Prendre p %' }, { id: 'reduction', label: 'Réduction' }, { id: 'augmentation', label: 'Augmentation' }] }],
  make(rand, o) {
    const mode = o.mode || pick(rand, ['part', 'reduction', 'augmentation']);
    const p = pick(rand, [5, 10, 15, 20, 25, 30, 40, 50, 75]); const n = 20 * ri(rand, 1, 20);
    const part = clean((n * p) / 100);
    if (mode === 'part') {
      const what = pick(rand, [['élèves d’un collège', 'élèves', 'viennent à vélo'], ['pages d’un livre', 'pages', 'sont illustrées'], ['spectateurs', 'spectateurs', 'ont moins de 18 ans']]);
      return numeric(part, {
        prompt: `Sur ${n} ${what[0]}, ${p} % ${what[2]}. Combien ${/^[aeiouyéèê]/i.test(what[1]) ? 'd’' : 'de '}${what[1]} cela représente-t-il ?`, representation: 'concrete', expectedSeconds: 60,
        misconceptions: [mc(clean(n / p), 'mc:diviser-par-p', 'notion', `Prendre ${p} %, c’est multiplier par ${p}/100, pas diviser par ${p}.`), mc(n - p, 'mc:soustraire-p', 'notion', 'Un pourcentage n’est pas une quantité à retirer : c’est une proportion du total.'), mc(n * p, 'mc:oubli-cent', 'calcul', 'N’oublie pas de diviser par 100.')],
        hints: [`${p} % de ${n}, c’est ${n} × ${p} ÷ 100.`], solution: `${n} × ${p} ÷ 100 = ${fr(part)}.`,
      });
    }
    const up = mode === 'augmentation';
    const ans = clean(up ? n + part : n - part);
    return numeric(ans, {
      prompt: up ? `Un abonnement coûte ${n} € et augmente de ${p} %. Quel est son nouveau prix ?` : `Un article coûte ${n} €. Il est soldé à −${p} %. Quel est son prix après réduction ?`, representation: 'concrete', tolerance: 0.005, difficulty: 3, expectedSeconds: 75,
      misconceptions: [mc(up ? n + p : n - p, 'mc:soustraire-p', 'notion', `${p} % de ${n} € ne vaut pas ${p} € : calcule d’abord ${n} × ${p} ÷ 100.`), mc(part, 'mc:reduction-seule', 'methode', `Tu as calculé ${up ? 'l’augmentation' : 'la réduction'} (${fr(part)} €) : il faut encore ${up ? 'l’ajouter au' : 'la retirer du'} prix de départ.`)],
      hints: [`${up ? 'Augmentation' : 'Réduction'} : ${n} × ${p} ÷ 100 = ?`, up ? 'Ajoute-la au prix de départ.' : 'Retire-la du prix de départ.'],
      solution: `${up ? 'Augmentation' : 'Réduction'} : ${n} × ${p} ÷ 100 = ${fr(part)} €. Nouveau prix : ${n} ${up ? '+' : '−'} ${fr(part)} = ${fr(ans)} €. (Autre méthode : ${n} × ${fr(1 + (up ? p : -p) / 100)}.)`,
    });
  },
});

const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10], [9, 12, 15], [20, 21, 29], [12, 16, 20]];
const TRIANGLES = ['ABC', 'DEF', 'MNP', 'RST', 'IJK', 'EFG'];

add({
  id: 'm-pythagore', label: 'Théorème de Pythagore : calculer une longueur', skill: 'm4.pythagore.calcul', levels: ['4e', '3e'],
  description: 'Hypoténuse ou côté de l’angle droit, valeurs exactes ou arrondies ; l’oubli de la racine et l’addition des longueurs sont repérés.',
  options: [{ id: 'mode', label: 'Longueur cherchée', values: [{ id: 'hypotenuse', label: 'Hypoténuse' }, { id: 'cote', label: 'Côté de l’angle droit' }, { id: 'arrondi', label: 'Résultat à arrondir' }] }],
  make(rand, o) {
    const mode = o.mode || pick(rand, ['hypotenuse', 'cote', 'arrondi']);
    const [R, P, Q] = pick(rand, TRIANGLES).split('');
    const k = pick(rand, [1, 1, 2, 3, 0.5, 0.1]);
    const [t1, t2, t3] = pick(rand, TRIPLES).map((x) => clean(x * k));
    const intro = `Le triangle ${R}${P}${Q} est rectangle en ${R}.`;
    if (mode === 'hypotenuse' || mode === 'arrondi') {
      let a = t1; let b = t2; let c = t3; let round;
      if (mode === 'arrondi') { do { a = ri(rand, 2, 12); b = ri(rand, 2, 12); } while (Number.isInteger(Math.sqrt(a * a + b * b))); c = Math.round(Math.sqrt(a * a + b * b) * 10) / 10; round = 1; }
      return numeric(c, {
        prompt: `${intro} ${R}${P} = ${fr(a)} cm et ${R}${Q} = ${fr(b)} cm. Calcule ${P}${Q}${round ? ' (arrondi au dixième)' : ''}.`, unit: 'cm', unitOptional: true, tolerance: round ? 0.051 : undefined, round, representation: 'visuelle', difficulty: round ? 3 : 2, expectedSeconds: 120,
        misconceptions: [mc(clean(a + b), 'mc:pythagore-somme-longueurs', 'notion', 'Le théorème porte sur les carrés des longueurs, pas sur les longueurs elles-mêmes.'), mc(clean(sq(a) + sq(b)), 'mc:oubli-racine', 'methode', `Tu as trouvé ${P}${Q}² : il reste à prendre la racine carrée.`), mc(round ? Math.round(Math.sqrt(Math.abs(sq(a) - sq(b))) * 10) / 10 : clean(Math.sqrt(Math.abs(sq(a) - sq(b)))), 'mc:pythagore-hypotenuse-soustraction', 'notion', `${P}${Q} est l’hypoténuse (le côté opposé à l’angle droit) : son carré est la SOMME des deux autres carrés.`)],
        hints: [`L’hypoténuse est le côté opposé à l’angle droit : ici ${P}${Q}.`, `${P}${Q}² = ${R}${P}² + ${R}${Q}²`],
        solution: `${P}${Q}² = ${fr(a)}² + ${fr(b)}² = ${fr(sq(a))} + ${fr(sq(b))} = ${fr(sq(a) + sq(b))}, donc ${P}${Q} = √${fr(sq(a) + sq(b))} ${round ? '≈' : '='} ${fr(c)} cm.`,
      });
    }
    return numeric(t2, {
      prompt: `${intro} ${P}${Q} = ${fr(t3)} cm et ${R}${P} = ${fr(t1)} cm. Calcule ${R}${Q}.`, unit: 'cm', unitOptional: true, representation: 'visuelle', difficulty: 3, expectedSeconds: 120,
      misconceptions: [mc(clean(Math.sqrt(sq(t3) + sq(t1))), 'mc:pythagore-cote-somme', 'notion', `${P}${Q} est l’hypoténuse : ${R}${Q}² = ${P}${Q}² − ${R}${P}² (une différence, pas une somme).`), mc(clean(t3 - t1), 'mc:soustraire-longueurs', 'notion', 'On soustrait les carrés des longueurs, pas les longueurs.'), mc(clean(sq(t3) - sq(t1)), 'mc:oubli-racine', 'methode', `Tu as trouvé ${R}${Q}² : il reste à prendre la racine carrée.`)],
      hints: [`Écris l’égalité de Pythagore avec l’hypoténuse ${P}${Q} : ${P}${Q}² = ${R}${P}² + ${R}${Q}².`, `Donc ${R}${Q}² = ${P}${Q}² − ${R}${P}².`],
      solution: `${P}${Q}² = ${R}${P}² + ${R}${Q}², donc ${R}${Q}² = ${fr(t3)}² − ${fr(t1)}² = ${fr(sq(t3))} − ${fr(sq(t1))} = ${fr(sq(t3) - sq(t1))} et ${R}${Q} = √${fr(sq(t3) - sq(t1))} = ${fr(t2)} cm.`,
    });
  },
});

add({
  id: 'm-litteral-valeur', label: 'Calcul littéral : valeur d’une expression', skill: 'm5.litteral.expression', levels: ['5e', '4e'],
  description: 'Remplacer la lettre par un nombre (souvent négatif) ; les erreurs de carré et de signe sont repérées.',
  options: [],
  make(rand) {
    const x = nz(rand, -6, 6); const a = ri(rand, 2, 9); const b = nz(rand, -10, 10);
    const t = ri(rand, 1, 4);
    let expr; let ans; let mcs = []; let detail;
    if (t === 1) { expr = poly([b, a]); ans = a * x + b; mcs = [mc(a * Math.abs(x) + b, 'mc:signe-produit', 'signe', `${a} × ${par(x)} : attention au signe de x.`), mc(Number(`${a}${Math.abs(x)}`) * Math.sign(x) + b, 'mc:juxtaposition', 'notion', `${a}x signifie ${a} × x : on ne colle pas les chiffres.`)]; detail = `${a} × ${par(x)}${sgn(b)} = ${fr(a * x)}${sgn(b)} = ${fr(ans)}`; }
    else if (t === 2) { expr = poly([b, 0, a]); ans = a * x * x + b; mcs = [mc(sq(a * x) + b, 'mc:carre-coefficient', 'notion', `${a}x² = ${a} × x² : seul x est au carré, pas ${a}x.`), mc(-a * x * x + b, 'mc:carre-negatif', 'signe', `Le carré d’un nombre négatif est positif : ${par(x)}² = ${sq(x)}.`), mc(2 * a * x + b, 'mc:carre-double', 'notion', `x² = x × x, pas 2 × x.`)]; detail = `${a} × ${par(x)}²${sgn(b)} = ${a} × ${sq(x)}${sgn(b)} = ${fr(ans)}`; }
    else if (t === 3) { const c = ri(rand, 2, 9); expr = `${fr(b)} − ${c}x`; ans = b - c * x; mcs = [mc(b - c * Math.abs(x), 'mc:signe-produit', 'signe', `${c} × ${par(x)} = ${fr(c * x)} : soustraire un nombre négatif revient à ajouter son opposé.`)]; detail = `${fr(b)} − ${c} × ${par(x)} = ${fr(b)} − ${par(c * x)} = ${fr(ans)}`; }
    else { expr = `${a}(x${sgn(b)})`; ans = a * (x + b); mcs = [mc(a * x + b, 'mc:distributivite-partielle', 'notion', `Le facteur ${a} multiplie toute la parenthèse.`)]; detail = `${a} × (${fr(x)}${sgn(b)}) = ${a} × ${par(x + b)} = ${fr(ans)}`; }
    return numeric(ans, {
      prompt: `Calcule la valeur de $${expr}$ pour $x = ${fr(x)}$.`, misconceptions: mcs, expectedSeconds: 60, difficulty: x < 0 ? 3 : 2,
      hints: [`Remplace x par ${par(x)} (avec des parenthèses s’il est négatif).`, 'Respecte les priorités : puissances, puis multiplications, puis additions.'],
      solution: `$${detail}$`,
    });
  },
});

add({
  id: 'm-developper', label: 'Développer : k(ax + b)', skill: 'm5.litteral.distributivite', levels: ['5e', '4e'],
  description: 'Simple distributivité ; l’oubli du second terme et les erreurs de signe sont repérés.',
  options: [],
  make(rand) {
    let kk = nz(rand, -9, 9); if (Math.abs(kk) === 1) kk *= 3;
    const a = ri(rand, 1, 9); const b = nz(rand, -9, 9);
    const ans = poly([kk * b, kk * a]);
    return expression(ans, {
      form: 'developpee-reduite', expectedSeconds: 75,
      prompt: `Développe : $${fr(kk)}(${poly([b, a])})$`,
      misconceptions: [mc(poly([b, kk * a]), 'mc:distributivite-partielle', 'notion', `${fr(kk)} multiplie chaque terme de la parenthèse, y compris ${fr(b)}.`), ...(kk < 0 ? [mc(poly([-kk * b, kk * a]), 'mc:signe-distributivite', 'signe', `${fr(kk)} × ${par(b)} : attention au signe du produit.`)] : [])],
      hints: [`$${par(kk)} × ${poly([0, a])}$ puis $${par(kk)} × ${par(b)}$.`],
      solution: `$${fr(kk)}(${poly([b, a])}) = ${par(kk)} × ${poly([0, a])} + ${par(kk)} × ${par(b)} = ${ans}$`,
    });
  },
});

add({
  id: 'm-double-distributivite', label: 'Développer : (ax + b)(cx + d)', skill: 'm4.litteral.double-distributivite', levels: ['4e', '3e'],
  description: 'Double distributivité puis réduction ; l’oubli des termes croisés est repéré.',
  options: [],
  make(rand) {
    const a = ri(rand, 1, 5); const b = nz(rand, -9, 9); const c = ri(rand, 1, 5); const d = nz(rand, -9, 9);
    const ans = poly([b * d, a * d + b * c, a * c]);
    return expression(ans, {
      form: 'developpee-reduite', difficulty: 3, expectedSeconds: 150,
      prompt: `Développe et réduis : $(${poly([b, a])})(${poly([d, c])})$`,
      misconceptions: [mc(poly([b * d, 0, a * c]), 'mc:oubli-termes-croises', 'notion', 'Chaque terme de la première parenthèse multiplie chaque terme de la seconde : il y a 4 produits.')],
      hints: ['Quatre produits : premier × premier, premier × second, second × premier, second × second.', `$${poly([0, a])} × ${poly([0, c])} = ${poly([0, 0, a * c])}$`],
      solution: `$(${poly([b, a])})(${poly([d, c])}) = ${poly([0, 0, a * c])}${xTerm(a * d)}${xTerm(b * c)}${sgn(b * d)} = ${ans}$`,
    });
  },
});

const CONV = {
  longueur: { units: ['km', 'hm', 'dam', 'm', 'dm', 'cm', 'mm'], f: [1000, 100, 10, 1, 0.1, 0.01, 0.001] },
  masse: { units: ['kg', 'hg', 'dag', 'g', 'dg', 'cg', 'mg'], f: [1000, 100, 10, 1, 0.1, 0.01, 0.001] },
  contenance: { units: ['hL', 'L', 'dL', 'cL', 'mL'], f: [100, 1, 0.1, 0.01, 0.001] },
};
const VOLUMES = [['dm³', 'L', 1], ['cm³', 'mL', 1], ['m³', 'L', 1000], ['m³', 'dm³', 1000], ['dm³', 'cm³', 1000], ['L', 'cm³', 1000], ['cm³', 'dm³', 0.001], ['mL', 'L', 0.001]];

add({
  id: 'm-conversions', label: 'Conversions d’unités', skill: 'm5.grandeurs.conversions', levels: ['5e', '4e'],
  description: 'Longueurs, masses, contenances, volumes, durées ; la mauvaise puissance de 10 et la confusion décimal/sexagésimal sont repérées.',
  options: [{ id: 'grandeur', label: 'Grandeur', values: [{ id: 'longueur', label: 'Longueurs' }, { id: 'masse', label: 'Masses' }, { id: 'contenance', label: 'Contenances' }, { id: 'volume', label: 'Volumes' }, { id: 'duree', label: 'Durées' }] }],
  make(rand, o) {
    const g = o.grandeur || pick(rand, ['longueur', 'masse', 'contenance', 'volume', 'duree']);
    if (g === 'duree') {
      const t = ri(rand, 1, 3);
      if (t === 1) { const h = ri(rand, 1, 4) + pick(rand, [0.25, 0.5, 0.75]); const ans = h * 60; const wrong = Math.floor(h) * 60 + Math.round((h % 1) * 100); return numeric(ans, { prompt: `Convertis : ${fr(h)} h = … min`, unit: 'min', unitOptional: true, strictUnit: true, representation: 'concrete', expectedSeconds: 45, misconceptions: [mc(wrong, 'mc:duree-decimale', 'notion', `${fr(h)} h ne veut pas dire ${Math.floor(h)} h ${Math.round((h % 1) * 100)} min : 0,${String(h).split('.')[1]} h est une fraction d’heure (${fr(h % 1)} × 60 min).`)], hints: ['1 h = 60 min : multiplie par 60.'], solution: `${fr(h)} × 60 = ${ans} min.` }); }
      if (t === 2) { const m = pick(rand, [15, 30, 45, 75, 90, 105, 135, 150]); const ans = m / 60; const wrong = Number(`${Math.floor(m / 60)}.${String(m % 60).padStart(2, '0')}`); return numeric(ans, { prompt: `Convertis en heures (écriture décimale) : ${m} min = … h`, unit: 'h', unitOptional: true, strictUnit: true, representation: 'concrete', expectedSeconds: 45, misconceptions: [mc(wrong, 'mc:duree-decimale', 'notion', `${Math.floor(m / 60)} h ${m % 60} min ne s’écrit pas ${fr(wrong)} h : ${m % 60} min = ${fr((m % 60) / 60)} h.`)], hints: ['Divise par 60.'], solution: `${m} ÷ 60 = ${fr(ans)} h.` }); }
      const h = ri(rand, 1, 5); const m = ri(rand, 5, 55); const ans = h * 60 + m;
      return numeric(ans, { prompt: `Convertis : ${h} h ${m} min = … min`, unit: 'min', unitOptional: true, strictUnit: true, representation: 'concrete', expectedSeconds: 45, misconceptions: [mc(h * 100 + m, 'mc:base-60', 'notion', 'Une heure vaut 60 minutes, pas 100.')], hints: [`${h} h = ${h} × 60 min.`], solution: `${h} × 60 + ${m} = ${ans} min.` });
    }
    let from; let to; let factor;
    if (g === 'volume') { const v = pick(rand, VOLUMES); [from, to, factor] = rand() < 0.5 ? v : [v[1], v[0], 1 / v[2]]; }
    else {
      const c = CONV[g]; const i = ri(rand, 0, c.units.length - 1); let j;
      do { j = ri(rand, Math.max(0, i - 3), Math.min(c.units.length - 1, i + 3)); } while (j === i);
      from = c.units[i]; to = c.units[j]; factor = c.f[i] / c.f[j];
    }
    const v = clean(ri(rand, 1, 999) / 10 ** ri(rand, 0, 2));
    const ans = clean(v * factor);
    return numeric(ans, {
      prompt: `Convertis : ${fr(v)} ${from} = … ${to}`, unit: to, unitOptional: true, strictUnit: true, representation: 'concrete', expectedSeconds: 45,
      misconceptions: factor !== 1 ? [mc(clean(v / factor), 'mc:conversion-sens', 'notion', `Passer de ${from} à ${to} : l’unité d’arrivée est ${factor > 1 ? 'plus petite, le nombre doit donc être plus grand' : 'plus grande, le nombre doit donc être plus petit'}.`)] : [],
      hints: [`1 ${from} = ${fr(factor)} ${to}.`, g === 'volume' ? '1 L = 1 dm³ et 1 mL = 1 cm³ ; 1 dm³ = 1 000 cm³.' : 'Utilise un tableau de conversion : un chiffre par colonne.'],
      solution: `1 ${from} = ${fr(factor)} ${to}, donc ${fr(v)} ${from} = ${fr(v)} × ${fr(factor)} = ${fr(ans)} ${to}.`,
    });
  },
});

/* ======================================================================= */
/*                            Physique-chimie                              */
/* ======================================================================= */

const addPc = (g) => GENERATORS.push({ subject: 'pc', ...g });

addPc({
  id: 'pc-vitesse', label: 'Vitesse, distance, durée', skill: 'pc.mouvement.vitesse', levels: ['4e', '3e'],
  description: 'v = d / t dans les deux unités usuelles ; les formules inversées sont diagnostiquées.',
  options: [{ id: 'cherche', label: 'Grandeur cherchée', values: [{ id: 'vitesse', label: 'Vitesse' }, { id: 'distance', label: 'Distance' }, { id: 'duree', label: 'Durée' }] }],
  make(rand, o) {
    const cherche = o.cherche || pick(rand, ['vitesse', 'distance', 'duree']);
    const kmh = rand() < 0.7;
    const mobile = kmh
      ? pick(rand, [['Un cycliste', [12, 15, 18, 20, 24, 30], 'roule'], ['Une voiture', [50, 60, 80, 90, 100, 120], 'roule'], ['Un train', [120, 150, 200, 240, 300], 'roule'], ['Une randonneuse', [4, 5, 6], 'marche']])
      : pick(rand, [['Un coureur', [4, 5, 6, 8], 'court'], ['Un drone', [10, 12, 15, 20], 'vole'], ['Un nageur', [1, 2], 'nage']]);
    const v = pick(rand, mobile[1]);
    const t = kmh ? pick(rand, [0.5, 1, 1.5, 2, 2.5, 3, 4]) : pick(rand, [10, 20, 25, 40, 50, 100, 120]);
    const d = clean(v * t);
    const [du, tu, vu] = kmh ? ['km', 'h', 'km/h'] : ['m', 's', 'm/s'];
    const minutes = Math.round((t % 1) * 60);
    const tTxt = kmh && t % 1 ? `${fr(t)} h (soit ${Math.floor(t) ? `${Math.floor(t)} h ` : ''}${minutes} min)` : `${fr(t)} ${tu}`;
    const hints = ['Écris la relation v = d / t, puis remplace par les valeurs connues.', 'Vérifie que les unités vont ensemble (km et h → km/h ; m et s → m/s).'];
    if (cherche === 'vitesse') return numeric(v, { prompt: `${mobile[0]} parcourt ${fr(d)} ${du} en ${tTxt}. Calcule sa vitesse moyenne en ${vu}.`, unit: vu, representation: 'concrete', expectedSeconds: 75, misconceptions: [mc(clean(t / d), 'mc:vitesse-inverse', 'notion', 'La vitesse est la distance divisée par la durée (v = d / t), pas l’inverse.'), mc(clean(d * t), 'mc:vitesse-produit', 'notion', 'On divise la distance par la durée ; on ne multiplie pas.')], hints, solution: `v = d / t = ${fr(d)} / ${fr(t)} = ${fr(v)} ${vu}.` });
    if (cherche === 'distance') return numeric(d, { prompt: `${mobile[0]} ${mobile[2]} à ${fr(v)} ${vu} pendant ${tTxt}. Quelle distance est parcourue ?`, unit: du, representation: 'concrete', expectedSeconds: 75, misconceptions: [mc(clean(v / t), 'mc:distance-division', 'notion', 'd = v × t : à vitesse constante, plus on roule longtemps, plus la distance est grande.')], hints, solution: `d = v × t = ${fr(v)} × ${fr(t)} = ${fr(d)} ${du}.` });
    return numeric(t, { prompt: `${mobile[0]} doit parcourir ${fr(d)} ${du} à ${fr(v)} ${vu}. Combien de temps lui faut-il (en ${tu}) ?`, unit: tu, representation: 'concrete', difficulty: 3, expectedSeconds: 90, misconceptions: [mc(clean(v / d), 'mc:duree-inverse', 'notion', 't = d / v : on divise la distance par la vitesse.'), mc(clean(d * v), 'mc:vitesse-produit', 'notion', 't = d / v : on divise, on ne multiplie pas.')], hints, solution: `t = d / v = ${fr(d)} / ${fr(v)} = ${fr(t)} ${tu}.` });
  },
});

/** [nom, masse volumique en g/cm³, « du … » / « de l’… »] */
const SOLIDS = [['aluminium', 2.7, 'de l’aluminium'], ['zinc', 7.14, 'du zinc'], ['fer', 7.87, 'du fer'], ['cuivre', 8.96, 'du cuivre'], ['argent', 10.5, 'de l’argent'], ['plomb', 11.3, 'du plomb'], ['or', 19.3, 'de l’or']];

addPc({
  id: 'pc-masse-volumique', label: 'Masse volumique', skill: 'pc.matiere.masse-volumique', levels: ['4e', '3e'],
  description: 'ρ = m / V : calculer la masse volumique, la masse ou le volume d’un objet métallique.',
  options: [{ id: 'cherche', label: 'Grandeur cherchée', values: [{ id: 'rho', label: 'Masse volumique' }, { id: 'masse', label: 'Masse' }, { id: 'volume', label: 'Volume' }] }],
  make(rand, o) {
    const cherche = o.cherche || pick(rand, ['rho', 'masse', 'volume']);
    const [name, rho, duName] = pick(rand, SOLIDS);
    const V = pick(rand, [2, 4, 5, 10, 20, 25, 50, 100]);
    const m = clean(rho * V);
    const hints = ['ρ = m / V ; donc m = ρ × V et V = m / ρ.', 'Avec m en g et V en cm³, ρ est en g/cm³.'];
    if (cherche === 'rho') return numeric(rho, { prompt: `Un objet en ${name} a une masse de ${fr(m)} g et un volume de ${V} cm³. Calcule sa masse volumique en g/cm³.`, unit: 'g/cm³', representation: 'concrete', expectedSeconds: 75, misconceptions: [mc(clean(V / m), 'mc:rho-inverse', 'notion', 'ρ = m / V : la masse divisée par le volume.'), mc(clean(m * V), 'mc:rho-produit', 'notion', 'On divise la masse par le volume.')], hints, solution: `ρ = m / V = ${fr(m)} / ${V} = ${fr(rho)} g/cm³.` });
    if (cherche === 'masse') return numeric(m, { prompt: `La masse volumique ${duName} est ${fr(rho)} g/cm³. Quelle est la masse d’un objet en ${name} de ${V} cm³ ?`, unit: 'g', representation: 'concrete', expectedSeconds: 75, misconceptions: [mc(clean(rho / V), 'mc:rho-division', 'notion', 'm = ρ × V : plus le volume est grand, plus la masse est grande.'), mc(clean(V / rho), 'mc:rho-division', 'notion', 'm = ρ × V.')], hints, solution: `m = ρ × V = ${fr(rho)} × ${V} = ${fr(m)} g.` });
    return numeric(V, { prompt: `Un objet en ${name} (ρ = ${fr(rho)} g/cm³) a une masse de ${fr(m)} g. Quel est son volume ?`, unit: 'cm³', representation: 'concrete', difficulty: 3, expectedSeconds: 90, misconceptions: [mc(clean(m * rho), 'mc:rho-produit', 'notion', 'V = m / ρ : on divise la masse par la masse volumique.'), mc(clean(rho / m), 'mc:rho-inverse', 'notion', 'V = m / ρ (et non ρ / m).')], hints, solution: `V = m / ρ = ${fr(m)} / ${fr(rho)} = ${fr(V)} cm³.` });
  },
});

addPc({
  id: 'pc-ohm', label: 'Loi d’Ohm', skill: 'pc.electricite.ohm', levels: ['4e', '3e'],
  description: 'U = R × I avec des intensités en mA : la conversion oubliée et la formule inversée sont repérées.',
  options: [{ id: 'cherche', label: 'Grandeur cherchée', values: [{ id: 'tension', label: 'Tension' }, { id: 'intensite', label: 'Intensité' }, { id: 'resistance', label: 'Résistance' }] }],
  make(rand, o) {
    const cherche = o.cherche || pick(rand, ['tension', 'intensite', 'resistance']);
    let R; let I; let U;
    do { R = pick(rand, [10, 22, 47, 100, 150, 220, 330, 470, 1000]); I = pick(rand, [5, 10, 15, 20, 25, 30, 40, 50]); U = clean((R * I) / 1000); } while (U > 24 || U < 0.2);
    const hints = ['Loi d’Ohm : U = R × I, avec U en V, R en Ω et I en A.', `Convertis d’abord l’intensité : 1 mA = 0,001 A.`];
    if (cherche === 'tension') return numeric(U, { prompt: `Un conducteur ohmique de résistance R = ${R} Ω est traversé par un courant d’intensité I = ${I} mA. Calcule la tension U à ses bornes.`, unit: 'V', representation: 'concrete', expectedSeconds: 90, misconceptions: [mc(clean(R / (I / 1000)), 'mc:ohm-division', 'notion', 'U = R × I : on multiplie la résistance par l’intensité.')], hints, solution: `I = ${I} mA = ${fr(I / 1000)} A ; U = R × I = ${R} × ${fr(I / 1000)} = ${fr(U)} V.` });
    if (cherche === 'intensite') return numeric(I, { prompt: `On applique une tension U = ${fr(U)} V aux bornes d’un conducteur ohmique de résistance R = ${R} Ω. Calcule l’intensité I du courant, en mA.`, unit: 'mA', representation: 'concrete', difficulty: 3, expectedSeconds: 90, misconceptions: [mc(clean(R / U), 'mc:ohm-inverse', 'notion', 'I = U / R : on divise la tension par la résistance.'), mc(clean(U * R * 1000), 'mc:ohm-produit', 'notion', 'I = U / R (on divise).')], hints, solution: `I = U / R = ${fr(U)} / ${R} = ${fr(I / 1000)} A = ${I} mA.` });
    return numeric(R, { prompt: `Aux bornes d’un conducteur ohmique, on mesure U = ${fr(U)} V et I = ${I} mA. Calcule sa résistance R.`, unit: 'Ω', representation: 'concrete', difficulty: 3, expectedSeconds: 90, misconceptions: [mc(clean((I / 1000) / U), 'mc:ohm-inverse', 'notion', 'R = U / I : la tension divisée par l’intensité.')], hints, solution: `I = ${fr(I / 1000)} A ; R = U / I = ${fr(U)} / ${fr(I / 1000)} = ${R} Ω.` });
  },
});

addPc({
  id: 'pc-poids', label: 'Poids et masse', skill: 'pc.interactions.poids', levels: ['4e', '3e'],
  description: 'P = m × g sur la Terre, la Lune ou Mars ; la confusion masse/poids est repérée.',
  options: [{ id: 'cherche', label: 'Grandeur cherchée', values: [{ id: 'poids', label: 'Poids' }, { id: 'masse', label: 'Masse' }] }],
  make(rand, o) {
    const cherche = o.cherche || pick(rand, ['poids', 'masse']);
    const [astre, g] = pick(rand, [['la Terre', 9.8], ['la Terre', 9.8], ['la Lune', 1.6], ['Mars', 3.7]]);
    const grams = rand() < 0.3;
    const m = grams ? pick(rand, [200, 250, 500, 750]) / 1000 : pick(rand, [2, 5, 12, 20, 45, 60, 70, 80]);
    const P = clean(m * g);
    const mTxt = grams ? `${m * 1000} g` : `${m} kg`;
    const hints = [`P = m × g, avec m en kg et g = ${fr(g)} N/kg sur ${astre}.`, grams ? 'Convertis d’abord la masse en kg.' : 'Le poids s’exprime en newtons (N).'];
    if (cherche === 'poids') return numeric(P, { prompt: `Sur ${astre}, l’intensité de la pesanteur vaut g = ${fr(g)} N/kg. Calcule le poids d’un objet de masse ${mTxt}.`, unit: 'N', representation: 'concrete', tolerance: 0.005, expectedSeconds: 75, misconceptions: [mc(clean(m / g), 'mc:poids-division', 'notion', 'P = m × g : on multiplie la masse par g.')], hints, solution: `${grams ? `m = ${mTxt} = ${fr(m)} kg ; ` : ''}P = m × g = ${fr(m)} × ${fr(g)} = ${fr(P)} N.` });
    return numeric(m, { prompt: `Sur ${astre} (g = ${fr(g)} N/kg), un objet a un poids de ${fr(P)} N. Quelle est sa masse en kg ?`, unit: 'kg', representation: 'concrete', difficulty: 3, tolerance: 0.005, expectedSeconds: 90, misconceptions: [mc(clean(P * g), 'mc:poids-division', 'notion', 'm = P / g : on divise le poids par g.'), mc(P, 'mc:masse-poids', 'notion', 'La masse (en kg) et le poids (en N) sont deux grandeurs différentes : m = P / g.')], hints, solution: `m = P / g = ${fr(P)} / ${fr(g)} = ${fr(m)} kg.` });
  },
});

/* ======================================================================= */

export const CODE_GENERATORS = GENERATORS;

/** Garde les idées fausses qui diffèrent de la bonne réponse et entre elles. */
function keepDistinct(def) {
  const out = [];
  if (def.type === 'numeric') {
    const tol = (v) => Math.max(def.tolerance || 0, 1e-9 * Math.max(1, Math.abs(v)));
    const seen = [def.answer];
    for (const m of def.misconceptions || []) {
      const v = Number(m.answer);
      if (!Number.isFinite(v) || seen.some((s) => Math.abs(s - v) <= tol(s))) continue;
      seen.push(v); out.push({ ...m, answer: clean(v) });
    }
    return out;
  }
  if (def.type === 'expression') {
    const seen = [tryParse(def.answer).node];
    for (const m of def.misconceptions || []) {
      const p = tryParse(String(m.answer));
      if (!p.ok || seen.some((s) => equivalent(s, p.node))) continue;
      seen.push(p.node); out.push(m);
    }
    return out;
  }
  return def.misconceptions || [];
}

/** Produit un exercice à partir d'un générateur de calcul ; seed et options rendent le tirage reproductible. */
export function generateFromCode(gen, seed, opts = {}) {
  const rand = rng(seed);
  const d = gen.make(rand, opts);
  const def = {
    id: `gen-${gen.id}-${seed}`, skill: gen.skill, track: gen.track || 'classe', role: 'libre',
    difficulty: 2, representation: 'symbolique', expectedSeconds: 60, generated: gen.id, ...d,
  };
  def.misconceptions = keepDistinct(def);
  return Object.fromEntries(Object.entries(def).filter(([, v]) => v !== undefined));
}

export function codeGeneratorMeta(gen) {
  return { id: gen.id, label: gen.label, subject: gen.subject, levels: gen.levels, skill: gen.skill, kind: 'calcul', description: gen.description || '', options: gen.options || [], track: gen.track || 'classe', source: 'code' };
}

/** Valeur numérique d'une réponse type (pour les tests) */
export const _internal = { poly, frac, fracStr, evaluate };
