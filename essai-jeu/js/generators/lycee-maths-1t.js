/**
 * Mathématiques de première et de terminale (spécialité) : générateurs rattachés aux chapitres des parcours de
 * référence maths-1re et maths-tle. Calculs exacts ou arrondis, erreurs typiques reconnues, questions de cours
 * à choix expliquées.
 */
import { pick, sample, ri, nz, numeric, mc, fr, par, poly, roundTo, roundedTo } from './gen-util.js';
import { qcm } from './primaire-savoirs.js';

const GEN = [];
function add(level, g) {
  const { make, ...rest } = g;
  GEN.push({ tracks: ['classe', 'approfondissement'], options: [], levels: [level], subject: 'maths', ...rest, make(rand, o = {}, tier = 'classe') { return make(rand, tier !== 'classe'); } });
}
const neg = (n) => String(n).replace('-', '−');
const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
const comb = (n, k) => fact(n) / (fact(k) * fact(n - k));
const IND = '\u00a0\u00a0\u00a0\u00a0';
/** Terme a·v bien écrit : « −x », « + 3y », « − 2 » ; rien si a = 0. `first` : premier terme (signe collé). */
const mono = (a, v, first = false) => { if (!a) return ''; const abs = Math.abs(a); const body = v ? `${abs === 1 ? '' : fr(abs)}${v}` : fr(abs); return first ? `${a < 0 ? '−' : ''}${body}` : ` ${a < 0 ? '−' : '+'} ${body}`; };
const sub = (n) => String(n).split('').map((d) => '₀₁₂₃₄₅₆₇₈₉'[d]).join('');
/** Polynôme [a0, a1, a2, a3] écrit dans l'ordre décroissant, jusqu'au degré 3 : « 2x³ − x² + 4 ». */
function poly3(c) {
  const P = ['', 'x', 'x²', 'x³']; const terms = [];
  for (let k = c.length - 1; k >= 0; k--) { const a = c[k] || 0; if (!a) continue; const abs = Math.abs(a); terms.push({ neg: a < 0, body: k === 0 ? String(abs) : `${abs === 1 ? '' : abs}${P[k]}` }); }
  if (!terms.length) return '0';
  return terms.map((t, i) => (i === 0 ? `${t.neg ? '−' : ''}${t.body}` : `${t.neg ? ' − ' : ' + '}${t.body}`)).join('');
}

/* ================================ PREMIÈRE ================================ */

add('1re', {
  id: 'l1-suites', label: 'Suites arithmétiques et géométriques', skill: 'l1.suites', chapters: ['1re-m-suites', '1re-m-suites-arith-geo'],
  description: 'Terme général, raison, somme des premiers termes, suite définie par récurrence, sens de variation, modéliser une évolution.',
  make(rand, hard) {
    const k = pick(rand, hard ? ['arith-n', 'raison', 'somme', 'geo-n', 'recurrence', 'qcm'] : ['arith-n', 'raison', 'geo-n', 'recurrence', 'qcm']);
    if (k === 'arith-n') {
      const u0 = ri(rand, -10, 20); const r = nz(rand, -6, 8); const n = ri(rand, 5, 30);
      return numeric(u0 + n * r, { prompt: `(uₙ) est la suite arithmétique de premier terme u₀ = ${u0} et de raison r = ${r}. Calcule u${sub(n)}.`,
        misconceptions: [mc(u0 + (n - 1) * r, 'mc:indice-decale', 'notion', `Le premier terme est u₀ : uₙ = u₀ + n × r, avec n = ${n}.`)],
        expectedSeconds: 45, hints: ['uₙ = u₀ + n × r.'], solution: `u${sub(n)} = ${u0} + ${n} × ${par(r)} = ${u0 + n * r}`, representation: 'symbolique' });
    }
    if (k === 'raison') {
      const r = nz(rand, -5, 7); const a = ri(rand, 1, 5); const b = a + ri(rand, 2, 6); const ua = ri(rand, -10, 10);
      return numeric(r, { prompt: `(uₙ) est arithmétique, avec u${sub(a)} = ${ua} et u${sub(b)} = ${ua + (b - a) * r}. Quelle est sa raison ?`,
        misconceptions: (b - a) * r !== r ? [mc((b - a) * r, 'mc:raison-ecart', 'notion', `Entre u${sub(a)} et u${sub(b)}, on ajoute ${b - a} fois la raison : on divise l’écart par ${b - a}.`)] : [], expectedSeconds: 50,
        hints: [`u${sub(b)} = u${sub(a)} + (${b} − ${a}) × r.`], solution: `r = (${ua + (b - a) * r} − ${par(ua)}) / ${b - a} = ${r}`, representation: 'symbolique' });
    }
    if (k === 'somme') {
      const n = pick(rand, [10, 20, 50, 100]);
      return numeric((n * (n + 1)) / 2, { prompt: `Calcule la somme S = 1 + 2 + 3 + … + ${n}.`, misconceptions: [mc(n * (n + 1), 'mc:somme-oubli-2', 'notion', 'S = n(n + 1) / 2 : on n’oublie pas de diviser par 2.')], expectedSeconds: 45,
        hints: ['1 + 2 + … + n = n(n + 1) / 2 (Gauss : on ajoute le premier et le dernier terme, n / 2 fois).'], solution: `S = ${n} × ${n + 1} / 2 = ${(n * (n + 1)) / 2}`, representation: 'symbolique' });
    }
    if (k === 'geo-n') {
      const [v0, q, n] = pick(rand, [[3, 2, 5], [5, 2, 4], [1, 3, 4], [2, 3, 5], [64, 0.5, 4], [1000, 0.1, 3], [80, 0.5, 3], [7, 2, 6]]);
      const vn = roundTo(v0 * q ** n, 6);
      return numeric(vn, { prompt: `(vₙ) est la suite géométrique de premier terme v₀ = ${fr(v0)} et de raison q = ${fr(q)}. Calcule v${sub(n)}.`,
        misconceptions: [mc(roundTo(v0 + n * q, 6), 'mc:geo-arith', 'notion', 'Suite géométrique : on MULTIPLIE par q à chaque étape, vₙ = v₀ × qⁿ.'), mc(roundTo(v0 * q * n, 6), 'mc:geo-produit', 'notion', 'vₙ = v₀ × qⁿ : q puissance n, et non q × n.')].filter((m, i, a) => m.answer !== vn && a.findIndex((x) => x.answer === m.answer) === i),
        expectedSeconds: 45, hints: ['vₙ = v₀ × qⁿ.'], solution: `v${sub(n)} = ${fr(v0)} × ${fr(q)}^${n} = ${fr(vn)}`, representation: 'symbolique' });
    }
    if (k === 'recurrence') {
      const a = pick(rand, [2, 3, -1]); const b = ri(rand, -5, 5); let u = ri(rand, -3, 4); const u0 = u;
      for (let i = 0; i < 3; i++) u = a * u + b;
      return numeric(u, { prompt: `La suite (uₙ) est définie par u₀ = ${u0} et, pour tout n, uₙ₊₁ = ${a === -1 ? '−' : a}uₙ ${b < 0 ? '−' : '+'} ${Math.abs(b)}. Calcule u₃.`, expectedSeconds: 60,
        hints: ['Calcule u₁, puis u₂, puis u₃ : chaque terme se calcule à partir du précédent.'], solution: (() => { let v = u0; const steps = []; for (let i = 1; i <= 3; i++) { v = a * v + b; steps.push(`u${'₀₁₂₃'[i]} = ${v}`); } return steps.join(' ; '); })(), representation: 'symbolique' });
    }
    return qcm(rand, pick(rand, [
      ['Un capital augmente de 3 % par an. Les capitaux successifs forment une suite…', 'géométrique de raison 1,03', ['arithmétique de raison 3', 'géométrique de raison 0,03', 'arithmétique de raison 1,03'], 'Augmenter de 3 %, c’est multiplier par 1,03 : on multiplie par le même nombre chaque année.'],
      ['Une suite arithmétique de raison −2 est…', 'décroissante', ['croissante', 'constante', 'ni croissante ni décroissante'], 'uₙ₊₁ − uₙ = −2 < 0 : chaque terme est plus petit que le précédent.'],
      ['Une suite géométrique de premier terme 5 et de raison 0,8 est…', 'décroissante', ['croissante', 'constante', 'alternativement positive et négative'], 'Premier terme positif et 0 < q < 1 : les termes diminuent.'],
      ['La suite uₙ = n² est…', 'croissante', ['décroissante', 'arithmétique', 'géométrique'], 'uₙ₊₁ − uₙ = 2n + 1 > 0 pour n ≥ 0.'],
    ]));
  },
});

add('1re', {
  id: 'l1-second-degre', label: 'Second degré : discriminant, racines, forme canonique', skill: 'l1.second-degre', chapters: ['1re-m-second-degre', '1re-m-automatismes'],
  description: 'Δ = b² − 4ac, nombre et valeur des racines, sommet de la parabole, signe du trinôme.',
  make(rand) {
    const k = pick(rand, ['delta', 'racine', 'sommet', 'nb', 'signe']);
    const a = pick(rand, [1, 1, 2, -1, 3]);
    const r1 = ri(rand, -6, 5); const r2 = r1 + ri(rand, 1, 6);
    const b = -a * (r1 + r2); const c = a * r1 * r2;
    if (k === 'delta') {
      const A = nz(rand, -4, 4); const B = ri(rand, -9, 9); const C = ri(rand, -9, 9); const D = B * B - 4 * A * C;
      return numeric(D, { prompt: `Calcule le discriminant Δ du trinôme $${poly([C, B, A])}$.`, misconceptions: [mc(B * B + 4 * A * C, 'mc:delta-signe', 'signe', 'Δ = b² − 4ac : attention au signe moins.'), mc(B - 4 * A * C, 'mc:delta-carre', 'notion', 'Δ = b² − 4ac : b est au carré.')].filter((m, i, arr) => m.answer !== D && arr.findIndex((x) => x.answer === m.answer) === i),
        expectedSeconds: 45, hints: ['Δ = b² − 4ac.'], solution: `Δ = ${par(B)}² − 4 × ${par(A)} × ${par(C)} = ${D}`, representation: 'symbolique' });
    }
    if (k === 'racine') {
      const low = rand() < 0.5;
      return numeric(low ? r1 : r2, { prompt: `Le trinôme $${poly([c, b, a])}$ a deux racines. Quelle est la ${low ? 'plus petite' : 'plus grande'} ?`,
        misconceptions: [mc(-(low ? r1 : r2), 'mc:racine-signe', 'signe', 'x = (−b ± √Δ) / (2a) : attention aux signes.')].filter((m) => m.answer !== r1 && m.answer !== r2), expectedSeconds: 90,
        hints: ['Calcule Δ = b² − 4ac, puis x = (−b − √Δ) / (2a) et x = (−b + √Δ) / (2a).'], solution: `Δ = ${b * b - 4 * a * c} ; racines : ${r1} et ${r2} (le trinôme vaut ${a === 1 ? '' : a === -1 ? '−' : a}(x − ${par(r1)})(x − ${par(r2)})).`, representation: 'symbolique' });
    }
    if (k === 'sommet') {
      const al = ri(rand, -5, 5); const be = ri(rand, -9, 9); const A = pick(rand, [1, 2, -1]);
      const B = -2 * A * al; const C = A * al * al + be;
      return numeric(al, { prompt: `Quelle est l’abscisse du sommet de la parabole d’équation $y = ${poly([C, B, A])}$ ?`, misconceptions: al !== 0 ? [mc(-al, 'mc:sommet-signe', 'signe', 'α = −b / (2a) : attention au signe.')] : [], expectedSeconds: 50,
        hints: ['Le sommet a pour abscisse α = −b / (2a).'], solution: `α = −(${B}) / (2 × ${par(A)}) = ${al} ; forme canonique : ${A === 1 ? '' : A === -1 ? '−' : A}(x − ${par(al)})² ${be < 0 ? '−' : '+'} ${Math.abs(be)}.`, representation: 'symbolique' });
    }
    if (k === 'nb') {
      const A = nz(rand, -3, 3); const B = ri(rand, -6, 6); const C = ri(rand, -6, 6); const D = B * B - 4 * A * C;
      const good = D > 0 ? 'deux racines distinctes' : D === 0 ? 'une racine double' : 'aucune racine réelle';
      return qcm(rand, [`Combien de racines réelles le trinôme $${poly([C, B, A])}$ possède-t-il ?`, good, ['deux racines distinctes', 'une racine double', 'aucune racine réelle', 'une infinité de racines'], `Δ = ${par(B)}² − 4 × ${par(A)} × ${par(C)} = ${D} : ${D > 0 ? 'Δ > 0' : D === 0 ? 'Δ = 0' : 'Δ < 0'}, donc ${good}.`]);
    }
    return qcm(rand, [`Le trinôme $${poly([c, b, a])}$ a pour racines ${r1} et ${r2}. Sur quel ensemble est-il strictement positif ?`, a > 0 ? `]−∞ ; ${neg(r1)}[ ∪ ]${neg(r2)} ; +∞[` : `]${neg(r1)} ; ${neg(r2)}[`, [a > 0 ? `]${neg(r1)} ; ${neg(r2)}[` : `]−∞ ; ${neg(r1)}[ ∪ ]${neg(r2)} ; +∞[`, `]${neg(r2)} ; +∞[`, 'ℝ'],
      `Un trinôme est du signe de a à l’extérieur des racines et du signe contraire entre elles ; ici a = ${a}.`]);
  },
});

add('1re', {
  id: 'l1-derivation', label: 'Dérivation : nombre dérivé, tangente, variations', skill: 'l1.derivation', chapters: ['1re-m-nombre-derive', '1re-m-fonction-derivee', '1re-m-variations'],
  description: 'Taux de variation, nombre dérivé d’un polynôme, équation de tangente, dérivées usuelles, extremum.',
  make(rand, hard) {
    const k = pick(rand, ['fprime', 'fprime', 'tangente', 'taux', 'qcm', 'extremum']);
    if (k === 'fprime') {
      const a = nz(rand, -3, 3); const b = ri(rand, -5, 5); const c = ri(rand, -6, 6); const d = ri(rand, -9, 9); const x = ri(rand, -3, 3);
      const fp = 3 * a * x * x + 2 * b * x + c;
      const wrong = a * x * x + b * x + c; // oubli des coefficients de la règle (xⁿ)′ = n xⁿ⁻¹
      return numeric(fp, { prompt: `Soit f(x) = ${poly3([d, c, b, a])}. Calcule f′(${x}).`,
        misconceptions: wrong !== fp ? [mc(wrong, 'mc:derivee-exposant', 'notion', '(xⁿ)′ = n xⁿ⁻¹ : l’exposant descend en facteur.')] : [], expectedSeconds: 75,
        hints: ['(x³)′ = 3x², (x²)′ = 2x, (x)′ = 1, et la dérivée d’une constante est 0.'], solution: `f′(x) = ${poly3([c, 2 * b, 3 * a])}, donc f′(${x}) = ${fp}.`, representation: 'symbolique' });
    }
    if (k === 'tangente') {
      const A = nz(rand, -2, 3); const B = ri(rand, -5, 5); const C = ri(rand, -6, 6); const x0 = ri(rand, -3, 3);
      const f0 = A * x0 * x0 + B * x0 + C; const m = 2 * A * x0 + B; const p = f0 - m * x0;
      const askP = hard && rand() < 0.5;
      return numeric(askP ? p : m, { prompt: `Soit $f(x) = ${poly([C, B, A])}$. La tangente à sa courbe au point d’abscisse ${x0} a pour équation y = mx + p. Que vaut ${askP ? 'p' : 'm'} ?`,
        misconceptions: askP ? (f0 !== p ? [mc(f0, 'mc:tangente-p', 'notion', 'p n’est pas f(a) : y = f′(a)(x − a) + f(a), donc p = f(a) − a × f′(a).')] : []) : (f0 !== m ? [mc(f0, 'mc:tangente-pente', 'notion', 'La pente de la tangente est le nombre dérivé f′(a), pas f(a).')] : []),
        expectedSeconds: 90, difficulty: 3, hints: ['Tangente en a : y = f′(a)(x − a) + f(a).'], solution: `f(${x0}) = ${f0}, f′(${x0}) = ${m} : y = ${neg(m)}(x − ${par(x0)}) + ${par(f0)}, soit y = ${mono(m, 'x', true)}${mono(p, '') || ''}.`, representation: 'symbolique' });
    }
    if (k === 'taux') {
      const a = ri(rand, -4, 4); const h = pick(rand, [1, 2, 0.5, 0.1]);
      return numeric(roundTo(2 * a + h, 6), { prompt: `Soit f(x) = x². Calcule le taux de variation de f entre ${a} et ${fr(a + h)} : [f(${fr(a + h)}) − f(${a})] / ${fr(h)}.`, expectedSeconds: 60,
        hints: ['Calcule f(a + h) et f(a), fais la différence, puis divise par h.'], solution: `(${fr(roundTo((a + h) ** 2, 6))} − ${a * a}) / ${fr(h)} = ${fr(roundTo(2 * a + h, 6))} (= 2a + h ; quand h tend vers 0, on trouve f′(${a}) = ${2 * a}).`, representation: 'symbolique' });
    }
    if (k === 'extremum') {
      const al = ri(rand, -5, 5); const A = pick(rand, [1, 2, -1, -2]); const B = -2 * A * al; const C = ri(rand, -9, 9);
      return numeric(al, { prompt: `Soit $f(x) = ${poly([C, B, A])}$. En quelle valeur de x f admet-elle un ${A > 0 ? 'minimum' : 'maximum'} ?`, misconceptions: al !== 0 ? [mc(-al, 'mc:extremum-signe', 'signe', `f′(x) = ${2 * A}x ${B < 0 ? '−' : '+'} ${Math.abs(B)} s’annule en x = ${al}.`)] : [], expectedSeconds: 60,
        hints: ['Calcule f′(x), puis résous f′(x) = 0 ; f′ change de signe en ce point.'], solution: `f′(x) = ${2 * A}x ${B < 0 ? '−' : '+'} ${Math.abs(B)} = 0 ⇔ x = ${al}.`, representation: 'symbolique' });
    }
    return qcm(rand, pick(rand, [
      ['Quelle est la dérivée de f(x) = 1/x sur ]0 ; +∞[ ?', 'f′(x) = −1/x²', ['f′(x) = 1/x²', 'f′(x) = ln(x)', 'f′(x) = −1/x'], '(1/x)′ = −1/x² : la fonction inverse est décroissante sur ]0 ; +∞[.'],
      ['Quelle est la dérivée de f(x) = √x sur ]0 ; +∞[ ?', 'f′(x) = 1/(2√x)', ['f′(x) = 2√x', 'f′(x) = √x / 2', 'f′(x) = 1/√x'], '(√x)′ = 1/(2√x).'],
      ['La dérivée d’un produit u × v est…', 'u′v + uv′', ['u′ × v′', 'u′v − uv′', '(u′v − uv′)/v²'], '(uv)′ = u′v + uv′ ; c’est (u′v − uv′)/v² pour un quotient u/v.'],
      ['Quelle est la dérivée de g(x) = (3x + 1)² ?', 'g′(x) = 6(3x + 1)', ['g′(x) = 2(3x + 1)', 'g′(x) = 3(3x + 1)²', 'g′(x) = 6x'], 'Dérivée de x ↦ f(ax + b) : a × f′(ax + b). Ici a = 3 et (X²)′ = 2X : 3 × 2(3x + 1).'],
      ['Si f′(x) > 0 sur un intervalle, alors f est…', 'strictement croissante sur cet intervalle', ['décroissante', 'positive', 'constante'], 'Le signe de la dérivée donne le sens de variation, pas le signe de la fonction.'],
    ]));
  },
});

add('1re', {
  id: 'l1-exponentielle', label: 'Fonction exponentielle', skill: 'l1.exponentielle', chapters: ['1re-m-exponentielle'],
  description: 'Propriétés algébriques, équations simples, dérivée de e^(kx), signe et variations.',
  make(rand) {
    const k = pick(rand, ['equation', 'exposant', 'qcm', 'qcm']);
    if (k === 'equation') {
      const a = pick(rand, [1, 2, 3, 4]); const x0 = ri(rand, -5, 5); const b = -a * x0;
      return numeric(x0, { prompt: `Résous l’équation e^(${poly3([b, a])}) = 1.`, expectedSeconds: 50,
        misconceptions: [mc(x0 + 1, 'mc:exp-egal-1', 'notion', 'e^X = 1 ⇔ X = 0 (car e⁰ = 1), pas X = 1.')].filter((m) => m.answer !== x0),
        hints: ['e^X = 1 si et seulement si X = 0.'], solution: `${poly3([b, a])} = 0 ⇔ x = ${x0}`, representation: 'symbolique' });
    }
    if (k === 'exposant') {
      const p = ri(rand, 2, 6); const q = ri(rand, -4, 5); const r = ri(rand, 1, 4);
      return numeric(p + q - r, { prompt: `Simplifie : e^${p} × e^(${q}) / e^${r} = e^k. Que vaut k ?`, misconceptions: [mc(p * q - r, 'mc:exp-produit', 'notion', 'e^a × e^b = e^(a + b) : les exposants s’additionnent.')].filter((m) => m.answer !== p + q - r), expectedSeconds: 40,
        hints: ['e^a × e^b = e^(a + b) et e^a / e^b = e^(a − b).'], solution: `k = ${p} + ${par(q)} − ${r} = ${p + q - r}`, representation: 'symbolique' });
    }
    return qcm(rand, pick(rand, [
      ['Pour tout réel x, e^x est…', 'strictement positif', ['positif ou nul', 'du signe de x', 'compris entre 0 et 1'], 'La fonction exponentielle ne prend que des valeurs strictement positives.'],
      ['Quelle est la dérivée de f(x) = e^(3x) ?', 'f′(x) = 3e^(3x)', ['f′(x) = e^(3x)', 'f′(x) = 3x e^(3x − 1)', 'f′(x) = e^3'], '(e^(kx))′ = k e^(kx).'],
      ['Que vaut e⁰ ?', '1', ['0', 'e', 'on ne peut pas le calculer'], 'Par définition, exp(0) = 1.'],
      ['(e^x)² est égal à…', 'e^(2x)', ['e^(x²)', '2e^x', 'e^(x + 2)'], '(e^a)^n = e^(na).'],
      ['La fonction exponentielle est…', 'strictement croissante sur ℝ', ['décroissante sur ℝ', 'croissante seulement sur [0 ; +∞[', 'constante'], 'exp′ = exp > 0 : la fonction est strictement croissante.'],
      ['Une valeur approchée de e est…', '2,718', ['3,14', '1,414', '1,618'], 'e ≈ 2,718 ; 3,14 est π, 1,414 est √2 et 1,618 le nombre d’or.'],
    ]));
  },
});

const TRIG = [
  ['Que vaut cos(π/3) ?', '1/2', ['√3/2', '√2/2', '0'], 'Sur le cercle trigonométrique, le point associé à π/3 a pour abscisse 1/2.'],
  ['Que vaut sin(π/6) ?', '1/2', ['√3/2', '√2/2', '1'], 'sin(π/6) = 1/2 et cos(π/6) = √3/2.'],
  ['Que vaut cos(π/4) ?', '√2/2', ['1/2', '√3/2', '1'], 'Pour π/4, cosinus et sinus sont égaux : √2/2.'],
  ['Que vaut cos(π) ?', '−1', ['0', '1', '1/2'], 'Le point associé à π est (−1 ; 0).'],
  ['Que vaut sin(π/2) ?', '1', ['0', '−1', '1/2'], 'Le point associé à π/2 est (0 ; 1).'],
  ['Pour tout réel x, cos(−x) est égal à…', 'cos(x)', ['−cos(x)', 'sin(x)', '−sin(x)'], 'Les points associés à x et −x sont symétriques par rapport à l’axe des abscisses : même cosinus.'],
  ['Pour tout réel x, cos²(x) + sin²(x) vaut…', '1', ['0', '2', 'cos(2x)'], 'C’est le théorème de Pythagore sur le cercle trigonométrique de rayon 1.'],
  ['Combien de radians mesure un angle de 180° ?', 'π', ['2π', 'π/2', '180'], 'Un tour complet, 360°, mesure 2π radians.'],
];
add('1re', {
  id: 'l1-trigonometrie', label: 'Trigonométrie : radians, cosinus et sinus', skill: 'l1.trigonometrie', chapters: ['1re-m-trigonometrie'],
  description: 'Conversions degrés ↔ radians, valeurs remarquables, propriétés du cercle trigonométrique.',
  make(rand) {
    if (rand() < 0.35) {
      const [num, den] = pick(rand, [[1, 6], [1, 4], [1, 3], [1, 2], [2, 3], [3, 4], [5, 6], [1, 1], [3, 2]]);
      const deg = (180 * num) / den;
      return numeric(deg, { prompt: `Combien de degrés mesure un angle de ${num === 1 ? '' : num}π${den === 1 ? '' : `/${den}`} radian${num / den > 1 ? 's' : ''} ?`, unit: '°', unitOptional: true, expectedSeconds: 30,
        hints: ['π radians = 180°.'], solution: `${num === 1 ? '' : num}π${den === 1 ? '' : `/${den}`} = ${num} × 180° / ${den} = ${deg}°`, representation: 'symbolique' });
    }
    return qcm(rand, pick(rand, TRIG), { hint: 'Place le point sur le cercle trigonométrique : son abscisse est le cosinus, son ordonnée le sinus.' });
  },
});

add('1re', {
  id: 'l1-produit-scalaire', label: 'Produit scalaire et géométrie repérée', skill: 'l1.produit-scalaire', chapters: ['1re-m-produit-scalaire', '1re-m-geometrie-reperee'],
  description: 'u · v = xx′ + yy′, avec les normes et l’angle, orthogonalité, équation de cercle, vecteur normal.',
  make(rand) {
    const k = pick(rand, ['coord', 'angle', 'ortho', 'cercle', 'normal']);
    if (k === 'coord') {
      const [x, y, x2, y2] = [nz(rand, -5, 5), ri(rand, -5, 5), ri(rand, -5, 5), nz(rand, -5, 5)];
      const d = x * x2 + y * y2;
      return numeric(d, { prompt: `Calcule le produit scalaire u · v, avec u(${x} ; ${y}) et v(${x2} ; ${y2}).`, misconceptions: [mc(x * y2 - y * x2, 'mc:ps-determinant', 'notion', 'u · v = xx′ + yy′ (on multiplie abscisses entre elles et ordonnées entre elles) ; xy′ − yx′ est le déterminant.')].filter((m) => m.answer !== d), expectedSeconds: 40,
        hints: ['u · v = xx′ + yy′.'], solution: `u · v = ${par(x)} × ${par(x2)} + ${par(y)} × ${par(y2)} = ${d}`, representation: 'symbolique' });
    }
    if (k === 'angle') {
      const [a, b] = [ri(rand, 2, 6), ri(rand, 2, 6)]; const [ang, c, cs] = pick(rand, [[60, 0.5, '1/2'], [0, 1, '1'], [90, 0, '0'], [120, -0.5, '−1/2'], [180, -1, '−1']]);
      return numeric(a * b * c, { prompt: `‖u‖ = ${a}, ‖v‖ = ${b} et l’angle entre u et v mesure ${ang}°. Calcule u · v.`, expectedSeconds: 45,
        misconceptions: c !== 1 ? [mc(a * b, 'mc:ps-oubli-cos', 'notion', 'u · v = ‖u‖ × ‖v‖ × cos(θ) : n’oublie pas le cosinus de l’angle.')] : [], hints: ['u · v = ‖u‖ × ‖v‖ × cos(θ).'], solution: `u · v = ${a} × ${b} × cos(${ang}°) = ${a} × ${b} × ${cs} = ${fr(a * b * c)}`, representation: 'symbolique' });
    }
    if (k === 'ortho') {
      const x = nz(rand, -4, 4); const y = nz(rand, -4, 4); const t = nz(rand, -3, 3); const yes = rand() < 0.5;
      const [x2, y2] = yes ? [-y * t, x * t] : [-y * t + 1, x * t];
      return qcm(rand, [`Les vecteurs u(${x} ; ${y}) et v(${x2} ; ${y2}) sont-ils orthogonaux ?`, yes ? 'oui, leur produit scalaire est nul' : `non, leur produit scalaire vaut ${neg(x * x2 + y * y2)}`, yes ? [`non, leur produit scalaire vaut ${neg(x * y2 - y * x2)}`, 'non, ils n’ont pas la même norme', 'on ne peut pas savoir'] : ['oui, leur produit scalaire est nul', 'oui, car leurs coordonnées sont entières', 'on ne peut pas savoir'],
        `u · v = ${neg(x)} × ${neg(x2)} + ${neg(y)} × ${neg(y2)} = ${neg(x * x2 + y * y2)} ; deux vecteurs sont orthogonaux si et seulement si leur produit scalaire est nul.`]);
    }
    if (k === 'cercle') {
      const a = ri(rand, -5, 5); const b = ri(rand, -5, 5); const r = ri(rand, 1, 7);
      return numeric(r, { prompt: `Le cercle d’équation (x ${a < 0 ? '+' : '−'} ${Math.abs(a)})² + (y ${b < 0 ? '+' : '−'} ${Math.abs(b)})² = ${r * r} a pour rayon…`, misconceptions: r * r !== r ? [mc(r * r, 'mc:rayon-carre', 'notion', `Le second membre est le carré du rayon : r = √${r * r}.`)] : [], expectedSeconds: 30,
        hints: ['Cercle de centre (a ; b) et de rayon r : (x − a)² + (y − b)² = r².'], solution: `r² = ${r * r}, donc r = ${r} ; le centre est (${a} ; ${b}).`, representation: 'symbolique' });
    }
    const A = nz(rand, -5, 5); const B = nz(rand, -5, 5); const C = ri(rand, -9, 9);
    return qcm(rand, [`Quel vecteur est normal à la droite d’équation ${mono(A, 'x', true)}${mono(B, 'y')}${mono(C, '')} = 0 ?`, `(${neg(A)} ; ${neg(B)})`, [`(${neg(-B)} ; ${neg(A)})`, `(${neg(B)} ; ${neg(A)})`, `(${neg(A)} ; ${neg(C)})`, `(1 ; ${neg(A)})`],
      `Pour ax + by + c = 0, le vecteur (a ; b) est normal et (−b ; a) est directeur.`]);
  },
});

add('1re', {
  id: 'l1-probabilites', label: 'Probabilités conditionnelles, variables aléatoires', skill: 'l1.probabilites', chapters: ['1re-m-probas-cond', '1re-m-variables-aleatoires', '1re-m-experimentations'],
  description: 'P_B(A), formule des probabilités totales, indépendance, espérance d’une variable aléatoire.',
  make(rand, hard) {
    const k = pick(rand, ['cond', 'totales', 'esperance', 'qcm']);
    if (k === 'cond') {
      const pb = pick(rand, [0.4, 0.5, 0.8, 0.25]); const pab = pick(rand, [0.1, 0.2]); const r = roundTo(pab / pb, 4);
      return numeric(r, { prompt: `On sait que P(B) = ${fr(pb)} et P(A ∩ B) = ${fr(pab)}. Calcule P_B(A).`, tolerance: 1e-9,
        misconceptions: [mc(roundTo(pab * pb, 4), 'mc:cond-produit', 'notion', 'P_B(A) = P(A ∩ B) / P(B) : on divise.')], expectedSeconds: 45,
        hints: ['P_B(A) = P(A ∩ B) / P(B).'], solution: `P_B(A) = ${fr(pab)} / ${fr(pb)} = ${fr(r)}`, representation: 'symbolique' });
    }
    if (k === 'totales') {
      const pa = pick(rand, [0.3, 0.4, 0.6, 0.7]); const pba = pick(rand, [0.1, 0.2, 0.5]); const pbna = pick(rand, [0.3, 0.4, 0.6]);
      const pb = roundTo(pa * pba + (1 - pa) * pbna, 4);
      return numeric(pb, { prompt: `Sur un arbre : P(A) = ${fr(pa)}, P_A(B) = ${fr(pba)} et P_Ā(B) = ${fr(pbna)}. Calcule P(B).`, tolerance: 1e-9,
        misconceptions: [mc(roundTo(pa * pba, 4), 'mc:totales-oubli', 'notion', 'Il y a deux chemins qui mènent à B : par A et par Ā. On additionne les deux.')], expectedSeconds: 75, difficulty: 3,
        hints: ['Formule des probabilités totales : P(B) = P(A) × P_A(B) + P(Ā) × P_Ā(B).'], solution: `P(B) = ${fr(pa)} × ${fr(pba)} + ${fr(roundTo(1 - pa, 2))} × ${fr(pbna)} = ${fr(pb)}`, representation: 'symbolique' });
    }
    if (k === 'esperance') {
      for (;;) {
        const vals = sample(rand, [-5, -2, 0, 1, 2, 3, 5, 10], 3).sort((x, y) => x - y);
        const ps = pick(rand, [[0.2, 0.5, 0.3], [0.1, 0.6, 0.3], [0.25, 0.25, 0.5], [0.5, 0.3, 0.2], [0.4, 0.4, 0.2]]);
        const E = roundTo(vals.reduce((s, v, i) => s + v * ps[i], 0), 4);
        const plain = roundTo(vals.reduce((s, v) => s + v, 0) / 3, 4);
        if (E === plain) continue;
        return numeric(E, { prompt: 'Voici la loi de probabilité d’une variable aléatoire X. Calcule son espérance E(X).', tolerance: 1e-9,
          figure: { alt: `Loi de X : valeurs ${vals.join(', ')} ; probabilités ${ps.map(fr).join(', ')}.`, items: [{ type: 'table', head: ['xᵢ', ...vals.map(String)], rows: [['P(X = xᵢ)', ...ps.map(fr)]] }] },
          misconceptions: Number.isInteger(plain * 100) ? [mc(plain, 'mc:esperance-moyenne', 'notion', 'L’espérance pondère chaque valeur par sa probabilité : E(X) = Σ xᵢ × pᵢ.')] : [],
          expectedSeconds: 75, hints: ['E(X) = x₁p₁ + x₂p₂ + x₃p₃.'], solution: `E(X) = ${vals.map((v, i) => `${par(v)} × ${fr(ps[i])}`).join(' + ')} = ${fr(E)}`, representation: 'symbolique' });
      }
    }
    return qcm(rand, pick(rand, [
      ['Deux événements A et B sont indépendants si et seulement si…', 'P(A ∩ B) = P(A) × P(B)', ['P(A ∩ B) = 0', 'P(A) + P(B) = 1', 'P(A) = P(B)'], 'L’indépendance : savoir que B est réalisé ne change pas la probabilité de A, P_B(A) = P(A).'],
      ['Deux événements incompatibles (de probabilités non nulles) sont-ils indépendants ?', 'non : P(A ∩ B) = 0 alors que P(A) × P(B) > 0', ['oui, toujours', 'oui, si P(A) = P(B)', 'on ne peut jamais le savoir'], 'Incompatibles : ils ne peuvent pas se produire ensemble ; savoir que l’un a lieu change tout pour l’autre.'],
      ['En répétant une expérience un grand nombre de fois, la moyenne des résultats obtenus…', 'se rapproche de l’espérance', ['reste toujours égale à 0', 's’éloigne de l’espérance', 'devient égale à la variance'], 'C’est ce qu’on observe en simulant des échantillons de grande taille (loi des grands nombres).'],
    ]));
  },
});

add('1re', {
  id: 'l1-listes', label: 'Python : les listes', skill: 'l1.listes', chapters: ['1re-m-listes'],
  description: 'Indices à partir de 0, len, append, listes en compréhension, parcourir une liste.',
  make(rand) {
    const L = sample(rand, [2, 3, 4, 5, 7, 8, 9, 11, 12, 15], ri(rand, 4, 6));
    const k = pick(rand, ['indice', 'append', 'comprehension', 'somme', 'dernier']);
    if (k === 'indice') {
      const i = ri(rand, 1, L.length - 1);
      return numeric(L[i], { prompt: `Que vaut L[${i}] ?\nL = [${L.join(', ')}]`, misconceptions: L[i - 1] !== L[i] ? [mc(L[i - 1], 'mc:indice-1', 'notion', 'Les indices commencent à 0 : L[0] est le premier élément.')] : [], expectedSeconds: 30,
        hints: ['En Python, le premier élément d’une liste a l’indice 0.'], solution: `L[0] = ${L[0]}, L[1] = ${L[1]}… donc L[${i}] = ${L[i]}.`, representation: 'symbolique' });
    }
    if (k === 'append') {
      const n = ri(rand, 1, 3);
      return numeric(L.length + n, { prompt: `Qu’affiche ce programme ?\nL = [${L.join(', ')}]\nfor k in range(${n}):\n${IND}L.append(k)\nprint(len(L))`, expectedSeconds: 50,
        misconceptions: [mc(L.length, 'mc:append-oubli', 'notion', 'append ajoute un élément à la fin de la liste à chaque tour de boucle.')], hints: [`La boucle tourne ${n} fois et ajoute un élément à chaque fois.`], solution: `${L.length} éléments au départ, ${n} ajoutés : len(L) = ${L.length + n}.`, representation: 'symbolique' });
    }
    if (k === 'comprehension') {
      const a = ri(rand, 2, 5); const n = ri(rand, 4, 7);
      return numeric(a * (n - 1), { prompt: `On définit M = [${a} * k for k in range(${n})]. Quel est le dernier élément de M ?`, misconceptions: [mc(a * n, 'mc:range-inclus', 'notion', `range(${n}) s’arrête à ${n - 1}.`)], expectedSeconds: 45,
        hints: [`k prend les valeurs 0, 1, …, ${n - 1}.`], solution: `M = [${Array.from({ length: n }, (_, k) => a * k).join(', ')}] : le dernier élément est ${a * (n - 1)}.`, representation: 'symbolique' });
    }
    if (k === 'somme') {
      const s = L.reduce((x, y) => x + y, 0);
      return numeric(s, { prompt: `Que vaut s à la fin ?\nL = [${L.join(', ')}]\ns = 0\nfor x in L:\n${IND}s = s + x`, expectedSeconds: 50,
        hints: ['La variable x prend successivement chaque élément de la liste.'], solution: `s = ${L.join(' + ')} = ${s}`, representation: 'symbolique' });
    }
    return numeric(L[L.length - 1], { prompt: `Que vaut L[-1] ?\nL = [${L.join(', ')}]`, misconceptions: [mc(L[0], 'mc:indice-negatif', 'notion', 'L[-1] désigne le DERNIER élément de la liste.')].filter((m) => m.answer !== L[L.length - 1]), expectedSeconds: 25,
      hints: ['Les indices négatifs comptent à partir de la fin.'], solution: `L[-1] est le dernier élément : ${L[L.length - 1]}.`, representation: 'symbolique' });
  },
});

/* ================================ TERMINALE ================================ */

add('tle', {
  id: 'lt-suites-limites', label: 'Limites de suites, récurrence', skill: 'lt.suites', chapters: ['tle-m-limites-suites', 'tle-m-recurrence'],
  description: 'Limite d’un quotient, d’une suite géométrique, somme géométrique, principe de récurrence.',
  make(rand) {
    const k = pick(rand, ['quotient', 'qcm', 'qcm', 'somme-geo']);
    if (k === 'quotient') {
      const a = nz(rand, -6, 6); const b = nz(rand, -9, 9); const c = ri(rand, 1, 5); const d = nz(rand, -9, 9);
      return numeric(roundTo(a / c, 6), { prompt: `Quelle est la limite de la suite uₙ = (${mono(a, 'n', true)}${mono(b, '')}) / (${mono(c, 'n', true)}${mono(d, '')}) quand n tend vers +∞ ? (Réponds par un nombre ou une fraction.)`, tolerance: 1e-9,
        misconceptions: c !== 1 && Math.abs(b / d - a / c) > 1e-9 && d !== 0 ? [mc(roundTo(b / d, 6), 'mc:limite-constantes', 'notion', 'En +∞, ce sont les termes de plus haut degré qui l’emportent : on factorise par n.')] : [], expectedSeconds: 60,
        hints: ['Factorise numérateur et dénominateur par n.'], solution: `uₙ = (${fr(a)}${mono(b, '/n')}) / (${c}${mono(d, '/n')}) → ${a}/${c}${c === 1 ? '' : ` = ${fr(roundTo(a / c, 4))}`}`, representation: 'symbolique' });
    }
    if (k === 'somme-geo') {
      const q = pick(rand, [2, 3]); const n = ri(rand, 4, 8);
      const S = (q ** (n + 1) - 1) / (q - 1);
      return numeric(S, { prompt: `Calcule S = 1 + ${q} + ${q}² + … + ${q}^${n}.`, misconceptions: [mc((q ** n - 1) / (q - 1), 'mc:somme-geo-termes', 'notion', `De ${q}⁰ à ${q}^${n}, il y a ${n + 1} termes : S = (q^(n+1) − 1)/(q − 1).`)], expectedSeconds: 60,
        hints: ['1 + q + … + qⁿ = (q^(n+1) − 1) / (q − 1).'], solution: `S = (${q}^${n + 1} − 1) / (${q} − 1) = ${S}`, representation: 'symbolique' });
    }
    return qcm(rand, pick(rand, [
      ['Quelle est la limite de (0,9)ⁿ quand n tend vers +∞ ?', '0', ['1', '+∞', '0,9'], 'Pour −1 < q < 1, qⁿ tend vers 0.'],
      ['Quelle est la limite de 1,5ⁿ quand n tend vers +∞ ?', '+∞', ['0', '1,5', '1'], 'Pour q > 1, qⁿ tend vers +∞.'],
      ['Dans une démonstration par récurrence, l’hérédité consiste à montrer que…', 'si la propriété est vraie au rang n, elle l’est au rang n + 1', ['la propriété est vraie au rang 0', 'la propriété est vraie pour tous les n à la fois', 'la suite est croissante'], 'Initialisation (premier rang) + hérédité (n → n + 1) : la propriété est vraie pour tout n.'],
      ['Une suite croissante et majorée…', 'converge', ['tend vers +∞', 'est constante', 'diverge forcément'], 'Théorème de convergence monotone : croissante et majorée ⇒ convergente.'],
      ['Si uₙ ≤ vₙ pour tout n et si uₙ tend vers +∞, alors vₙ…', 'tend vers +∞', ['tend vers 0', 'converge', 'on ne peut rien dire'], 'Théorème de comparaison.'],
    ]));
  },
});

add('tle', {
  id: 'lt-fonctions', label: 'Limites de fonctions, continuité, convexité', skill: 'lt.fonctions', chapters: ['tle-m-limites-fonctions', 'tle-m-continuite', 'tle-m-derivation'],
  description: 'Limite d’une fraction rationnelle, asymptotes, théorème des valeurs intermédiaires, dérivée d’une composée, convexité.',
  make(rand) {
    const k = pick(rand, ['limite', 'composee', 'qcm', 'qcm']);
    if (k === 'limite') {
      const a = nz(rand, -5, 6); const c = ri(rand, 1, 4); const b = nz(rand, -9, 9); const d = nz(rand, -9, 9);
      return numeric(roundTo(a / c, 6), { prompt: `Quelle est la limite en +∞ de f(x) = (${mono(a, 'x²', true)}${mono(b, '')}) / (${mono(c, 'x²', true)}${mono(d, '')}) ? (Nombre ou fraction.)`, tolerance: 1e-9, expectedSeconds: 50,
        hints: ['Factorise par x² en haut et en bas.'], solution: `f(x) → ${a}/${c} : la droite y = ${fr(roundTo(a / c, 4))} est asymptote horizontale.`, representation: 'symbolique' });
    }
    if (k === 'composee') {
      const a = nz(rand, -3, 4); const b = ri(rand, -5, 5); const n = pick(rand, [2, 3, 4]); const x = ri(rand, -2, 2);
      const fp = n * a * (a * x + b) ** (n - 1);
      return numeric(fp, { prompt: `Soit f(x) = (${mono(a, 'x', true)}${mono(b, '')})^${n}. Calcule f′(${x}).`, misconceptions: [mc(n * (a * x + b) ** (n - 1), 'mc:composee-oubli', 'notion', `(uⁿ)′ = n u′ uⁿ⁻¹ : n’oublie pas de multiplier par u′ = ${a}.`)].filter((m) => m.answer !== fp), expectedSeconds: 75,
        hints: ['(uⁿ)′ = n × u′ × uⁿ⁻¹.'], solution: `f′(x) = ${n} × ${par(a)} × (${mono(a, 'x', true)}${mono(b, '')})^${n - 1}, donc f′(${x}) = ${fp}.`, representation: 'symbolique' });
    }
    return qcm(rand, pick(rand, [
      ['f est continue et strictement croissante sur [a ; b], avec f(a) < 0 < f(b). L’équation f(x) = 0…', 'a une unique solution dans [a ; b]', ['n’a pas de solution', 'a au moins deux solutions', 'a pour solution x = 0'], 'Théorème des valeurs intermédiaires, cas strictement monotone.'],
      ['Si lim f(x) = +∞ quand x tend vers 2, la courbe de f admet…', 'une asymptote verticale d’équation x = 2', ['une asymptote horizontale y = 2', 'un maximum en 2', 'une tangente horizontale en 2'], 'Une limite infinie en un réel a donne l’asymptote verticale x = a.'],
      ['Si f″(x) > 0 sur un intervalle, f est…', 'convexe sur cet intervalle', ['concave', 'décroissante', 'négative'], 'f″ > 0 : f′ croît, la courbe est au-dessus de ses tangentes.'],
      ['La fonction x ↦ x³ a, en 0,…', 'un point d’inflexion', ['un minimum', 'un maximum', 'une asymptote'], 'f″(x) = 6x change de signe en 0 : la convexité change.'],
      ['Quelle est la limite de e^x / x quand x tend vers +∞ ?', '+∞', ['0', '1', 'e'], 'Croissances comparées : l’exponentielle l’emporte sur toute puissance de x.'],
    ]));
  },
});

add('tle', {
  id: 'lt-logarithme', label: 'Fonction logarithme népérien', skill: 'lt.logarithme', chapters: ['tle-m-logarithme'],
  description: 'ln et exp réciproques, propriétés algébriques, équations, seuil d’une suite géométrique.',
  make(rand) {
    const k = pick(rand, ['ln-exp', 'equation', 'coef', 'seuil', 'qcm']);
    if (k === 'ln-exp') { const a = ri(rand, -6, 9); return numeric(a, { prompt: `Que vaut ln(e^${a < 0 ? `(${a})` : a}) ?`, expectedSeconds: 20, hints: ['ln et exp sont des fonctions réciproques.'], solution: `ln(e^a) = a, donc ${a}.`, representation: 'symbolique' }); }
    if (k === 'equation') {
      const c = pick(rand, [2, 3, 5, 7, 10]); const x = roundTo(Math.log(c), 2);
      return numeric(x, { prompt: `Résous e^x = ${c}. Donne la solution arrondie au centième.`, ...roundedTo(2), misconceptions: [mc(roundTo(Math.exp(c), 2), 'mc:ln-exp', 'notion', `e^x = ${c} ⇔ x = ln(${c}) : on applique ln, la réciproque de exp.`)], expectedSeconds: 45,
        hints: ['e^x = a ⇔ x = ln(a) (pour a > 0).'], solution: `x = ln(${c}) ≈ ${fr(x)}`, representation: 'symbolique' });
    }
    if (k === 'coef') {
      const [b, n] = pick(rand, [[2, 3], [2, 5], [3, 2], [3, 4], [2, 4], [5, 2], [2, 6]]);
      return numeric(n, { prompt: `On écrit ln(${b ** n}) = k × ln(${b}). Que vaut k ?`, misconceptions: [mc(b ** n / b, 'mc:ln-quotient', 'notion', `ln(aⁿ) = n × ln(a) : ${b ** n} = ${b}^${n}.`)].filter((m) => m.answer !== n), expectedSeconds: 40,
        hints: [`Écris ${b ** n} comme une puissance de ${b}.`], solution: `${b ** n} = ${b}^${n}, donc ln(${b ** n}) = ${n} ln(${b}).`, representation: 'symbolique' });
    }
    if (k === 'seuil') {
      const [t, label] = pick(rand, [[0.05, '5 %'], [0.1, '10 %'], [0.02, '2 %'], [0.04, '4 %']]);
      const n = Math.ceil(Math.log(2) / Math.log(1 + t));
      return numeric(n, { prompt: `Une population augmente de ${label} par an. Au bout de combien d’années (nombre entier) aura-t-elle doublé pour la première fois ?`, expectedSeconds: 90, difficulty: 3,
        misconceptions: [mc(Math.round(100 / (t * 100)), 'mc:seuil-lineaire', 'notion', 'Les hausses se cumulent : on résout (1 + t)ⁿ ≥ 2 avec le logarithme, pas 2 = 1 + n × t.')].filter((m) => m.answer !== n),
        hints: [`Résous ${fr(1 + t)}ⁿ ≥ 2 : n ≥ ln(2) / ln(${fr(1 + t)}).`], solution: `n ≥ ln 2 / ln(${fr(1 + t)}) ≈ ${fr(roundTo(Math.log(2) / Math.log(1 + t), 2))}, donc n = ${n} ans.`, representation: 'concrete' });
    }
    return qcm(rand, pick(rand, [
      ['Pour a > 0 et b > 0, ln(a × b) est égal à…', 'ln(a) + ln(b)', ['ln(a) × ln(b)', 'ln(a + b)', 'a ln(b)'], 'Le logarithme transforme les produits en sommes.'],
      ['Que vaut ln(1) ?', '0', ['1', 'e', 'il n’existe pas'], 'e⁰ = 1, donc ln(1) = 0.'],
      ['Quelle est la dérivée de ln(x) sur ]0 ; +∞[ ?', '1/x', ['ln(x)', 'e^x', '−1/x²'], '(ln x)′ = 1/x.'],
      ['Sur quel ensemble la fonction ln est-elle définie ?', ']0 ; +∞[', ['ℝ', '[0 ; +∞[', ']−∞ ; 0['], 'ln(x) n’existe que pour x strictement positif.'],
      ['ln(x) < 0 lorsque…', '0 < x < 1', ['x > 1', 'x < 0', 'x > e'], 'ln est croissante et ln(1) = 0.'],
    ]));
  },
});

add('tle', {
  id: 'lt-integrales', label: 'Primitives, intégrales, équations différentielles', skill: 'lt.integrales', chapters: ['tle-m-primitives', 'tle-m-integrales', 'tle-m-sinus-cosinus'],
  description: 'Calculer une intégrale de fonction affine ou polynomiale, intégrale de e^x, solutions de y′ = ay + b, dérivées de sin et cos.',
  make(rand) {
    const k = pick(rand, ['affine', 'poly', 'exp', 'diff', 'qcm']);
    if (k === 'affine') {
      const c = nz(rand, -4, 4); const d = ri(rand, -5, 5); const a = ri(rand, -2, 1); const b = a + ri(rand, 1, 4);
      const I = roundTo((c / 2) * (b * b - a * a) + d * (b - a), 6);
      return numeric(I, { prompt: `Calcule l’intégrale de ${a} à ${b} de f(x) = ${mono(c, 'x', true)}${mono(d, '')}.`, tolerance: 1e-9, expectedSeconds: 75,
        misconceptions: [mc(roundTo(c * b + d - (c * a + d), 6), 'mc:integrale-f', 'notion', 'On calcule F(b) − F(a) avec une PRIMITIVE F de f, pas f(b) − f(a).')].filter((m) => Math.abs(m.answer - I) > 1e-9),
        hints: [`Une primitive de ${mono(c, 'x', true)}${mono(d, '')} est F(x) = ${mono(c / 2, 'x²', true)}${mono(d, 'x')}.`], solution: `F(${b}) − F(${a}) = ${fr(roundTo((c / 2) * b * b + d * b, 6))} − ${par(roundTo((c / 2) * a * a + d * a, 6))} = ${fr(I)}`, representation: 'symbolique' });
    }
    if (k === 'poly') {
      const n = pick(rand, [2, 3]); const b = pick(rand, [1, 2, 3]);
      const I = b ** (n + 1) / (n + 1);
      return numeric(roundTo(I, 6), { prompt: `Calcule l’intégrale de 0 à ${b} de x^${n}. (Fraction ou décimal exact.)`, tolerance: 1e-6, expectedSeconds: 50,
        misconceptions: [mc(n * b ** (n - 1), 'mc:integrale-derivee', 'notion', `Il faut une primitive, x^${n + 1}/${n + 1}, pas la dérivée.`)].filter((m) => Math.abs(m.answer - I) > 1e-6),
        hints: [`Une primitive de xⁿ est x^(n+1)/(n+1).`], solution: `[x^${n + 1}/${n + 1}] de 0 à ${b} = ${b ** (n + 1)}/${n + 1}${Number.isInteger(I) ? ` = ${I}` : ''}`, representation: 'symbolique' });
    }
    if (k === 'exp') {
      const b = pick(rand, [1, 2]); const I = roundTo(Math.exp(b) - 1, 2);
      return numeric(I, { prompt: `Calcule l’intégrale de 0 à ${b} de e^x, arrondie au centième.`, ...roundedTo(2), misconceptions: [mc(roundTo(Math.exp(b), 2), 'mc:integrale-borne-0', 'notion', 'F(b) − F(0) avec e⁰ = 1 : n’oublie pas de retirer 1.')], expectedSeconds: 50,
        hints: ['Une primitive de e^x est e^x.'], solution: `e^${b} − e⁰ = e^${b} − 1 ≈ ${fr(I)}`, representation: 'symbolique' });
    }
    if (k === 'diff') {
      const a = pick(rand, [-3, -2, 2, 3, 4]); const s = nz(rand, -5, 5); const b = -a * s;
      return numeric(s, { prompt: `Quelle est la solution constante de l’équation différentielle y′ = ${mono(a, 'y', true)}${mono(b, '')} ?`, misconceptions: [mc(-s, 'mc:diff-signe', 'signe', `Constante : y′ = 0, donc ${mono(a, 'y', true)}${mono(b, '')} = 0, y = −b/a.`)], expectedSeconds: 45,
        hints: ['Une fonction constante a une dérivée nulle : résous 0 = ay + b.'], solution: `0 = ${mono(a, 'y', true)}${mono(b, '')} ⇔ y = ${s} ; les solutions sont y = C e^(${a}x) + ${par(s)}.`, representation: 'symbolique' });
    }
    return qcm(rand, pick(rand, [
      ['Les solutions de y′ = 2y sont les fonctions…', 'x ↦ C e^(2x), C réel', ['x ↦ 2e^x', 'x ↦ x² + C', 'x ↦ C e^(x/2)'], 'y′ = ay a pour solutions x ↦ C e^(ax).'],
      ['Quelle est la dérivée de sin(x) ?', 'cos(x)', ['−cos(x)', '−sin(x)', 'sin(x)'], 'sin′ = cos et cos′ = −sin.'],
      ['Quelle est la dérivée de cos(x) ?', '−sin(x)', ['sin(x)', 'cos(x)', '−cos(x)'], 'cos′ = −sin.'],
      ['La fonction cosinus est périodique de période…', '2π', ['π', 'π/2', '1'], 'cos(x + 2π) = cos(x) pour tout x.'],
      ['Si f est positive sur [a ; b], l’intégrale de a à b de f représente…', 'l’aire sous la courbe, en unités d’aire', ['la longueur de la courbe', 'la pente moyenne', 'la valeur maximale de f'], 'C’est l’aire du domaine entre la courbe, l’axe des abscisses et les droites x = a et x = b.'],
    ]));
  },
});

add('tle', {
  id: 'lt-espace', label: 'Géométrie dans l’espace', skill: 'lt.espace', chapters: ['tle-m-espace', 'tle-m-orthogonalite', 'tle-m-representations'],
  description: 'Produit scalaire et norme dans l’espace, représentation paramétrique d’une droite, vecteur normal à un plan.',
  make(rand) {
    const k = pick(rand, ['ps', 'norme', 'parametre', 'qcm']);
    if (k === 'ps') {
      const u = [ri(rand, -4, 4), ri(rand, -4, 4), nz(rand, -4, 4)]; const v = [ri(rand, -4, 4), nz(rand, -4, 4), ri(rand, -4, 4)];
      const d = u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
      return numeric(d, { prompt: `Dans un repère orthonormé de l’espace, calcule u · v avec u(${u.join(' ; ')}) et v(${v.join(' ; ')}).`, expectedSeconds: 45,
        hints: ['u · v = xx′ + yy′ + zz′.'], solution: `u · v = ${u.map((x, i) => `${par(x)} × ${par(v[i])}`).join(' + ')} = ${d}`, representation: 'symbolique' });
    }
    if (k === 'norme') {
      const [a, b, c, r] = pick(rand, [[1, 2, 2, 3], [2, 3, 6, 7], [1, 4, 8, 9], [2, 6, 9, 11], [4, 4, 7, 9], [2, 10, 11, 15]]);
      const s = [a, b, c].map((x) => x * pick(rand, [1, -1]));
      return numeric(r, { prompt: `Quelle est la norme du vecteur u(${s.join(' ; ')}) ?`, misconceptions: [mc(a + b + c, 'mc:norme-somme', 'notion', '‖u‖ = √(x² + y² + z²).'), mc(r * r, 'mc:norme-carre', 'notion', 'x² + y² + z² est le CARRÉ de la norme.')], expectedSeconds: 45,
        hints: ['‖u‖ = √(x² + y² + z²).'], solution: `‖u‖ = √(${a * a} + ${b * b} + ${c * c}) = √${r * r} = ${r}`, representation: 'symbolique' });
    }
    if (k === 'parametre') {
      const A = [ri(rand, -3, 3), ri(rand, -3, 3), ri(rand, -3, 3)]; const u = [nz(rand, -3, 3), ri(rand, -3, 3), ri(rand, -3, 3)]; const t = nz(rand, -3, 4);
      const M = A.map((x, i) => x + t * u[i]);
      return numeric(t, { prompt: `La droite d a pour représentation paramétrique x = ${A[0]} ${u[0] < 0 ? '−' : '+'} ${Math.abs(u[0])}t, y = ${A[1]} ${u[1] < 0 ? '−' : '+'} ${Math.abs(u[1])}t, z = ${A[2]} ${u[2] < 0 ? '−' : '+'} ${Math.abs(u[2])}t (t réel). Le point M(${M.join(' ; ')}) est sur d : pour quelle valeur de t ?`, expectedSeconds: 60,
        hints: ['Résous l’équation sur x, puis vérifie avec y et z.'], solution: `${A[0]} ${u[0] < 0 ? '−' : '+'} ${Math.abs(u[0])}t = ${M[0]} ⇔ t = ${t} (et les autres coordonnées concordent).`, representation: 'symbolique' });
    }
    const n = [nz(rand, -4, 4), nz(rand, -4, 4), nz(rand, -4, 4)]; const d = ri(rand, -9, 9);
    return qcm(rand, [`Quel vecteur est normal au plan d’équation ${n[0]}x ${n[1] < 0 ? '−' : '+'} ${Math.abs(n[1])}y ${n[2] < 0 ? '−' : '+'} ${Math.abs(n[2])}z ${d < 0 ? '−' : '+'} ${Math.abs(d)} = 0 ?`, `(${n.map(neg).join(' ; ')})`, [`(${[n[1], n[0], n[2]].map(neg).join(' ; ')})`, `(${[n[0], n[1], d].map(neg).join(' ; ')})`, `(${[-n[0], n[1], n[2]].map(neg).join(' ; ')})`, `(${[n[2], n[1], n[0]].map(neg).join(' ; ')})`],
      'Pour un plan d’équation ax + by + cz + d = 0, le vecteur (a ; b ; c) est normal au plan.']);
  },
});

add('tle', {
  id: 'lt-denombrement', label: 'Combinatoire et dénombrement', skill: 'lt.denombrement', chapters: ['tle-m-denombrement'],
  description: 'Factorielles, k-uplets, arrangements, combinaisons, nombre de parties d’un ensemble.',
  make(rand) {
    const k = pick(rand, ['fact', 'uplets', 'arrangements', 'comb', 'parties']);
    if (k === 'fact') { const n = ri(rand, 3, 7); return numeric(fact(n), { prompt: `De combien de façons peut-on ranger ${n} livres différents sur une étagère ?`, misconceptions: [mc(n * n, 'mc:fact-carre', 'notion', `${n}! = ${n} × ${n - 1} × … × 1.`)], expectedSeconds: 40, hints: ['Choix du 1er livre, puis du 2e parmi ceux qui restent…'], solution: `${n}! = ${Array.from({ length: n }, (_, i) => n - i).join(' × ')} = ${fact(n)}`, representation: 'concrete' }); }
    if (k === 'uplets') { const n = pick(rand, [2, 10, 26]); const p = ri(rand, 2, 4); return numeric(n ** p, { prompt: `Combien de codes de ${p} ${n === 2 ? 'bits (0 ou 1)' : n === 10 ? 'chiffres' : 'lettres'} peut-on former (répétitions permises) ?`, misconceptions: [mc(n * p, 'mc:uplets-produit', 'notion', `${n} choix pour chacune des ${p} positions : ${n}^${p}.`)], expectedSeconds: 40, hints: ['Chaque position peut prendre toutes les valeurs : on multiplie.'], solution: `${n}^${p} = ${n ** p}`, representation: 'concrete' }); }
    if (k === 'arrangements') { const n = ri(rand, 5, 10); const p = 3; const A = n * (n - 1) * (n - 2); return numeric(A, { prompt: `${n} coureurs participent à une course. Combien de podiums (1er, 2e, 3e) différents sont possibles ?`, misconceptions: [mc(comb(n, 3), 'mc:arrangement-combinaison', 'notion', 'L’ordre compte sur un podium : ce n’est pas une combinaison.'), mc(n ** 3, 'mc:arrangement-repetition', 'notion', 'Un coureur ne peut pas occuper deux places : pas de répétition.')], expectedSeconds: 50, hints: [`${n} choix pour la 1re place, ${n - 1} pour la 2e, ${n - 2} pour la 3e.`], solution: `${n} × ${n - 1} × ${n - 2} = ${A}`, representation: 'concrete' }); }
    if (k === 'comb') { const n = ri(rand, 5, 10); const p = pick(rand, [2, 3]); return numeric(comb(n, p), { prompt: `Dans une classe de ${n} élèves, combien de groupes de ${p} élèves différents peut-on former ?`, misconceptions: [mc(fact(n) / fact(n - p), 'mc:combinaison-ordre', 'notion', `Dans un groupe, l’ordre ne compte pas : on divise par ${p}!.`)], expectedSeconds: 50, hints: [`C’est « ${p} parmi ${n} » : n! / (p! (n − p)!).`], solution: `C(${n}, ${p}) = ${comb(n, p)}`, representation: 'concrete' }); }
    const n = ri(rand, 3, 8);
    return numeric(2 ** n, { prompt: `Combien de parties (sous-ensembles) possède un ensemble à ${n} éléments, en comptant l’ensemble vide et l’ensemble lui-même ?`, misconceptions: [mc(n * 2, 'mc:parties-2n', 'notion', 'Pour chaque élément : dedans ou dehors, 2 choix, donc 2 × 2 × … = 2ⁿ.')], expectedSeconds: 40, hints: ['Chaque élément est dans la partie ou n’y est pas.'], solution: `2^${n} = ${2 ** n}`, representation: 'symbolique' });
  },
});

add('tle', {
  id: 'lt-binomiale', label: 'Loi binomiale, sommes de variables aléatoires', skill: 'lt.binomiale', chapters: ['tle-m-bernoulli', 'tle-m-sommes-va', 'tle-m-concentration'],
  description: 'P(X = k), espérance et variance d’une loi binomiale, linéarité de l’espérance, inégalités de concentration.',
  make(rand) {
    const k = pick(rand, ['pk', 'esperance', 'variance', 'qcm']);
    const n = ri(rand, 4, 10); const p = pick(rand, [0.2, 0.3, 0.5, 0.6, 0.25]);
    if (k === 'pk') {
      const kk = ri(rand, 1, Math.min(3, n)); const P = roundTo(comb(n, kk) * p ** kk * (1 - p) ** (n - kk), 3);
      return numeric(P, { prompt: `X suit la loi binomiale de paramètres n = ${n} et p = ${fr(p)}. Calcule P(X = ${kk}), arrondie au millième.`, ...roundedTo(3),
        misconceptions: [mc(roundTo(p ** kk * (1 - p) ** (n - kk), 3), 'mc:binomiale-coef', 'notion', `Il y a C(${n}, ${kk}) façons de placer les ${kk} succès : n’oublie pas ce coefficient.`)].filter((m) => Math.abs(m.answer - P) > 0.0015), expectedSeconds: 90, difficulty: 3,
        hints: ['P(X = k) = C(n, k) × p^k × (1 − p)^(n − k).'], solution: `P(X = ${kk}) = C(${n}, ${kk}) × ${fr(p)}^${kk} × ${fr(roundTo(1 - p, 2))}^${n - kk} = ${comb(n, kk)} × … ≈ ${fr(P)}`, representation: 'symbolique' });
    }
    if (k === 'esperance') return numeric(roundTo(n * p, 6), { prompt: `X suit la loi binomiale B(${n} ; ${fr(p)}). Quelle est son espérance E(X) ?`, expectedSeconds: 30, hints: ['E(X) = n × p.'], solution: `E(X) = ${n} × ${fr(p)} = ${fr(roundTo(n * p, 4))}`, representation: 'symbolique' });
    if (k === 'variance') {
      const V = roundTo(n * p * (1 - p), 6);
      return numeric(V, { prompt: `X suit la loi binomiale B(${n} ; ${fr(p)}). Quelle est sa variance V(X) ?`, tolerance: 1e-9, misconceptions: [mc(roundTo(n * p, 6), 'mc:variance-esperance', 'notion', 'V(X) = n p (1 − p) ; n p est l’espérance.')], expectedSeconds: 40,
        hints: ['V(X) = n × p × (1 − p).'], solution: `V(X) = ${n} × ${fr(p)} × ${fr(roundTo(1 - p, 2))} = ${fr(V)}`, representation: 'symbolique' });
    }
    return qcm(rand, pick(rand, [
      ['X et Y sont deux variables aléatoires. E(X + Y) est égal à…', 'E(X) + E(Y)', ['E(X) × E(Y)', 'E(X) + E(Y) seulement si X et Y sont indépendantes', 'V(X) + V(Y)'], 'L’espérance est linéaire : E(X + Y) = E(X) + E(Y), toujours.'],
      ['Si X et Y sont indépendantes, V(X + Y) est égal à…', 'V(X) + V(Y)', ['V(X) × V(Y)', 'V(X) − V(Y)', '(V(X) + V(Y))²'], 'Pour des variables indépendantes, les variances s’additionnent.'],
      ['L’inégalité de Bienaymé-Tchebychev majore…', 'la probabilité que X s’écarte de son espérance d’au moins δ', ['l’espérance de X', 'la valeur maximale de X', 'le nombre de valeurs de X'], 'P(|X − E(X)| ≥ δ) ≤ V(X) / δ².'],
      ['Une épreuve de Bernoulli a…', 'deux issues : succès ou échec', ['trois issues', 'une seule issue', 'une infinité d’issues'], 'Succès avec probabilité p, échec avec probabilité 1 − p.'],
    ]));
  },
});

add('tle', {
  id: 'lt-algorithmique', label: 'Algorithmique : boucles et seuils', skill: 'lt.algorithmique', chapters: ['tle-m-algorithmique', 'tle-m-logique'],
  description: 'Prévoir le résultat d’un algorithme de seuil, d’une boucle sur une suite, d’une fonction récursive simple.',
  make(rand) {
    const k = pick(rand, ['seuil', 'suite', 'factorielle']);
    if (k === 'seuil') {
      const u0 = pick(rand, [100, 200, 500, 1000]); const q = pick(rand, [0.5, 0.8, 0.9]); const s = pick(rand, [10, 20, 50]);
      let u = u0; let n = 0; while (u > s) { u *= q; n += 1; }
      return numeric(n, { prompt: `Que vaut n à la fin ?\nu = ${u0}\nn = 0\nwhile u > ${s}:\n${IND}u = ${String(q)} * u\n${IND}n = n + 1`, expectedSeconds: 90, difficulty: 3,
        misconceptions: [mc(n - 1, 'mc:seuil-dernier', 'notion', `La boucle s’arrête dès que u ≤ ${s} : le dernier tour compte.`)].filter((m) => m.answer >= 0), hints: ['Calcule u à chaque tour et compte les tours jusqu’à ce que la condition devienne fausse.'],
        solution: `n = ${n} : u passe sous ${s} au ${n}e tour (u ≈ ${fr(roundTo(u, 2))}).`, representation: 'symbolique' });
    }
    if (k === 'suite') {
      const a = pick(rand, [2, 3]); const b = ri(rand, -3, 3); const u0 = ri(rand, 0, 3); const N = ri(rand, 3, 4);
      let u = u0; for (let i = 0; i < N; i++) u = a * u + b;
      return numeric(u, { prompt: `Qu’affiche ce programme ?\nu = ${u0}\nfor i in range(${N}):\n${IND}u = ${a} * u ${b < 0 ? '-' : '+'} ${Math.abs(b)}\nprint(u)`, expectedSeconds: 75,
        hints: [`La boucle tourne ${N} fois.`], solution: (() => { let v = u0; const st = [String(v)]; for (let i = 0; i < N; i++) { v = a * v + b; st.push(String(v)); } return `u vaut successivement ${st.join(', ')}.`; })(), representation: 'symbolique' });
    }
    const n = ri(rand, 3, 6);
    return numeric(fact(n), { prompt: `Qu’affiche ce programme ?\ndef f(n):\n${IND}if n == 0:\n${IND}${IND}return 1\n${IND}return n * f(n - 1)\nprint(f(${n}))`, expectedSeconds: 75, difficulty: 3,
      hints: ['f(n) = n × f(n − 1), et f(0) = 1 : c’est la factorielle.'], solution: `f(${n}) = ${Array.from({ length: n }, (_, i) => n - i).join(' × ')} × 1 = ${fact(n)}`, representation: 'symbolique' });
  },
});

export const LYCEE_MATHS_1T = GEN;
export const LYCEE_MATHS_1T_SKILLS = [
  ['l1.suites', '1re', 'Suites arithmétiques et géométriques'], ['l1.second-degre', '1re', 'Second degré : discriminant, racines, forme canonique'],
  ['l1.derivation', '1re', 'Dérivation : nombre dérivé, tangente, variations'], ['l1.exponentielle', '1re', 'Fonction exponentielle'],
  ['l1.trigonometrie', '1re', 'Trigonométrie : radians, cosinus et sinus'], ['l1.produit-scalaire', '1re', 'Produit scalaire et géométrie repérée'],
  ['l1.probabilites', '1re', 'Probabilités conditionnelles, variables aléatoires'], ['l1.listes', '1re', 'Python : les listes'],
  ['lt.suites', 'tle', 'Limites de suites, récurrence'], ['lt.fonctions', 'tle', 'Limites de fonctions, continuité, convexité'],
  ['lt.logarithme', 'tle', 'Fonction logarithme népérien'], ['lt.integrales', 'tle', 'Primitives, intégrales, équations différentielles'],
  ['lt.espace', 'tle', 'Géométrie dans l’espace'], ['lt.denombrement', 'tle', 'Combinatoire et dénombrement'],
  ['lt.binomiale', 'tle', 'Loi binomiale, sommes de variables aléatoires'], ['lt.algorithmique', 'tle', 'Algorithmique : boucles et seuils'],
].map(([id, level, label]) => ({ subject: 'maths', id, label, level, track: 'classe', status: 'programme', domain: 'lycee', prereqs: [], editorialLevel: true }));
