/**
 * Fiche d'exercices imprimable : énoncés avec une zone de réponse adaptée au papier, puis le corrigé
 * sur une nouvelle page. Aucun nom d'élève n'est imprimé.
 */
import { h, richText, inlineHTML } from './dom.js';
import { interpolate, interpolateDeep, rng, parseWithParams } from '../core/template.js';
import { renderFigure } from '../figures/render.js';
import { describeExpected } from '../core/checkers/index.js';
import { polyCoefficients } from '../core/checkers/expression.js';
import { expectedValue } from '../core/checkers/numeric.js';
import { tokenizeHighlight } from '../core/checkers/language.js';
import { canonicalResponse } from '../generators/data-kinds.js';
import { poly } from '../generators/gen-util.js';
import { tryParse, toText, parse, evaluate, formatNumber, gcd, variables } from '../core/expr.js';

/** Exercices que le papier ne peut pas remplacer (programme à exécuter, manipulation interactive). */
export function printable(def) {
  return def.type !== 'code' && !def.activity && !(def.parts || []).some((p) => p.type === 'code');
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const lines = (n) => h('div', { class: 'ps-lines' }, Array.from({ length: n }, () => h('div', { class: 'ps-line' })));
const t = (inst, s) => interpolate(String(s ?? ''), inst.params);

function zone(def, inst) {
  switch (def.type) {
    case 'qcm': return h('ul', { class: 'ps-choices' }, def.choices.map((c, i) => h('li', { html: `☐ <strong>${LETTERS[i]}</strong>. ${inlineHTML(t(inst, c.text))}` })));
    case 'match': return h('div', { class: 'ps-match' },
      h('ol', {}, def.left.map((l) => h('li', { html: `${inlineHTML(l.label)} → ……` }))),
      h('ul', { class: 'ps-letters' }, def.right.map((r, i) => h('li', { html: `<strong>${LETTERS[i]}</strong>. ${inlineHTML(r.label)}` }))));
    case 'categorize': return h('table', { class: 'ps-table' },
      h('thead', {}, h('tr', {}, h('th', {}, ''), def.categories.map((c) => h('th', {}, c.label)))),
      h('tbody', {}, def.items.map((it) => h('tr', {}, h('td', { html: inlineHTML(it.label) }), def.categories.map(() => h('td', { class: 'ps-box' }, '☐'))))));
    case 'order': return h('div', {}, h('ul', { class: 'ps-letters' }, def.items.map((it, i) => h('li', { html: `<strong>${LETTERS[i]}</strong>. ${inlineHTML(it.label)}` }))), h('p', {}, `Ordre (${def.orderLabel || 'du premier au dernier'}) : ……………………`));
    case 'highlight': return h('div', {}, h('p', { class: 'ps-note' }, def.instruction || 'Souligne les mots demandés.'), h('p', { class: 'ps-hl' }, tokenizeHighlight(t(inst, def.text)).map((x) => x.text).join('')));
    case 'table': return h('table', { class: 'ps-table' },
      h('thead', {}, h('tr', {}, (def.columns || []).map((c) => h('th', { html: inlineHTML(t(inst, c)) })))),
      h('tbody', {}, (def.rows || []).map((row) => h('tr', {}, row.map((cell) => (String(cell).startsWith('?') ? h('td', { class: 'ps-box' }, '') : h('td', { html: inlineHTML(t(inst, cell)) })))))));
    case 'dictation': return h('div', {}, h('p', { class: 'ps-note' }, 'Dictée : un adulte lit le texte (il figure dans le corrigé).'), lines(3));
    case 'open': return lines(Math.max(5, Math.ceil((def.minWords || 40) / 10)));
    case 'steps': return lines(5);
    case 'composite': return h('ol', { class: 'ps-parts' }, def.parts.map((p) => h('li', {}, richText(t(inst, p.prompt), 'rich'), zone(p, inst))));
    case 'counterexample': return lines(2);
    default: return lines(def.type === 'numberline' || def.type === 'graph' ? 3 : 2);
  }
}

/** [p, q] irréductible avec q > 0, ou null si le calcul sort des entiers exacts. */
function ratio(p, q) {
  if (!q || !Number.isSafeInteger(p) || !Number.isSafeInteger(q)) return null;
  const g = gcd(p, q) || 1; const s = q < 0 ? -1 : 1;
  return [(s * p) / g, (s * q) / g];
}

/** Valeur exacte [p, q] d'un calcul sans lettre écrit avec des entiers (+, −, ×, ÷, puissances entières), ou null. */
export function exactFraction(node) {
  if (node.t === 'num') return Number.isInteger(node.v) ? [node.v, 1] : null;
  if (node.t === 'neg') { const r = exactFraction(node.a); return r && [-r[0], r[1]]; }
  if (!['+', '-', '*', '/', '^'].includes(node.t)) return null;
  const a = exactFraction(node.a); const b = exactFraction(node.b);
  if (!a || !b) return null;
  if (node.t === '+') return ratio(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
  if (node.t === '-') return ratio(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
  if (node.t === '*') return ratio(a[0] * b[0], a[1] * b[1]);
  if (node.t === '/') return ratio(a[0] * b[1], a[1] * b[0]);
  if (b[1] !== 1 || Math.abs(b[0]) > 64) return null;
  const r = ratio(a[0] ** Math.abs(b[0]), a[1] ** Math.abs(b[0]));
  return r && b[0] < 0 ? ratio(r[1], r[0]) : r;
}

const numNode = (v) => ({ t: 'num', v });
/** Entier, ou fraction irréductible avec le signe au numérateur (« −2/3 »). */
const fractionNode = ([p, q]) => (q === 1 ? numNode(p) : { t: '/', a: numNode(p), b: numNode(q) });
const niceCoef = (c) => Math.abs(c * 1000 - Math.round(c * 1000)) < 1e-6;
/** Le dénominateur ne contient que des 2 et des 5 : la valeur décimale tombe juste. */
const finiteDecimal = (q) => { let n = q; while (n % 2 === 0) n /= 2; while (n % 5 === 0) n /= 5; return n === 1; };

/** Polynôme réduit en v (degré 2 au plus, coefficients simples) : « x² − 5x − 14 », ou null. */
function reducedPoly(node, v) {
  const c = polyCoefficients(node, v);
  return c && c.length <= 3 && c.every(niceCoef) ? parse(poly(c, v), { names: new Set([v]) }) : null;
}

/** Partie positive d'un terme écrit avec un signe moins (« −3 », « −(…) », « −2x », « −1x »), ou null. */
function positivePart(n) {
  if (n.t === 'num' && n.v < 0) return numNode(-n.v);
  if (n.t === 'neg') return n.a;
  if ((n.t === '*' || n.t === '/') && n.a.t === 'num' && n.a.v < 0) return n.a.v === -1 && n.t === '*' ? n.b : { ...n, a: numNode(-n.a.v) };
  return null;
}

/** « a + (−b) » → « a − b », « a − (−b) » → « a + b », « 1x » → « x », « −1x » → « −x ». */
function tidySigns(node) {
  if (node.t === '*' && node.a.t === 'num' && Math.abs(node.a.v) === 1) return node.a.v === 1 ? node.b : { t: 'neg', a: node.b };
  if (node.t !== '+' && node.t !== '-') return node;
  const pos = positivePart(node.b);
  return pos ? { ...node, t: node.t === '+' ? '-' : '+', b: pos } : node;
}

/**
 * Calculs sans lettre effectués (fractions gardées exactes) et signes nettoyés, sans changer l'ordre des termes :
 * « x(x + (−4)) » → « x(x − 4) ». Un produit n'est pas développé : une forme factorisée reste factorisée.
 */
function tidy(node) {
  if (!variables(node).size) { const r = exactFraction(node); if (r) return fractionNode(r); }
  const out = { ...node };
  for (const k of ['a', 'b']) if (node[k]) out[k] = tidy(node[k]);
  if (node.args) out.args = node.args.map(tidy);
  return tidySigns(out);
}

/** Décomposition en facteurs premiers d'un entier n ≥ 2 : 280 → 2³ × 5 × 7 (arbre d'expression). */
function primeProductNode(n) {
  const factors = []; let m = n;
  for (let p = 2; p * p <= m; p++) {
    let k = 0;
    while (m % p === 0) { m /= p; k++; }
    if (k) factors.push(k === 1 ? numNode(p) : { t: '^', a: numNode(p), b: numNode(k) });
  }
  if (m > 1) factors.push(numNode(m));
  return factors.reduce((a, b) => ({ t: '*', a, b }));
}

/**
 * Réponse d'un exercice « expression ». Sans paramètre, elle est imprimée telle que l'auteur l'a écrite.
 * Avec des paramètres, ils sont remplacés et les calculs faits : « x² + (2 + (−7))x + 2 × (−7) » → « x² − 5x − 14 ».
 */
export function expressionAnswer(def, params = {}) {
  const src = interpolate(String(def.answer ?? ''), params);
  const names = new Set(Object.keys(params));
  const written = tryParse(src, { names });
  if (!written.ok) return src;
  try {
    const node = parseWithParams(src, params);
    if (def.form === 'premiers') {
      const n = evaluate(node);
      if (Number.isSafeInteger(n) && n >= 2) return toText(primeProductNode(n));
    }
    if (![...variables(written.node)].some((n) => names.has(n))) return toText(written.node);
    const v = def.variable || [...variables(node)][0] || 'x';
    const expand = def.form === 'developpee' || def.form === 'developpee-reduite';
    return toText((expand && reducedPoly(node, v)) || tidy(node));
  } catch {
    return toText(written.node);
  }
}

/**
 * Réponse numérique écrite comme une fraction (« 2/3 », « a/b », « v/(r + v + b) ») : on imprime la fraction
 * irréductible, pas « 0,666667 ». Si la valeur décimale tombe juste, elle suit (« 3/4 = 0,75 ») ; elle reste seule
 * pour une mesure (« q/10 », « a*360/N »). Avec une tolérance, l'arrondi accepté suit une part d'un tout
 * (« 2/3 ≈ 0,67 ») ; un rapport plus grand que 1 (« 20/6 ») s'écrit en décimal arrondi.
 */
export function fractionAnswer(def, params = {}, dec = null) {
  if (typeof def.answer !== 'string' || def.unit || def.round !== undefined) return null;
  const src = interpolate(def.answer, params);
  const written = tryParse(src, { names: new Set(Object.keys(params)) });
  if (!written.ok) return null;
  const q = written.node.t === 'neg' ? written.node.a : written.node;
  // une division quelque part (« (1 − a/b) × c/d », « (r/(r + b))² ») : la réponse est un rationnel à écrire en fraction
  const hasDiv = (n) => Boolean(n && typeof n === 'object' && (n.t === '/' || Object.values(n).some((x) => x && typeof x === 'object' && hasDiv(x))));
  if (!hasDiv(q)) return null;
  let r;
  try { r = exactFraction(parseWithParams(src, params)); } catch { return null; }
  // une fraction lisible : ni un entier, ni des termes à rallonge (« 15 000 000/17 »)
  if (!r || r[1] === 1 || Math.abs(r[0]) > 10000 || r[1] > 10000) return null;
  const value = r[0] / r[1];
  const finite = finiteDecimal(r[1]);
  const text = toText(fractionNode(r));
  if (def.tolerance !== undefined || def.rel !== undefined) {
    if (finite || Math.abs(value) >= 1) return null;
    return dec === null ? text : `${text} ≈ ${formatNumber(Math.round(value * 10 ** dec) / 10 ** dec)}`;
  }
  if (!finite) return text;
  const single = (n) => n.t === 'num' || n.t === 'var';
  const asFraction = q.t !== '/' || (single(q.a) && single(q.b) && !(q.a.t === 'var' && q.b.t === 'num')) || (q.b.t !== 'num' && Math.abs(value) < 1);
  return asFraction ? `${text} = ${formatNumber(value)}` : null;
}

const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
/** 0,000003 → « 3 × 10⁻⁶ » (3 chiffres significatifs au plus). */
export function scientific(v) {
  const e = Math.floor(Math.log10(Math.abs(v)));
  const m = Math.round((v / 10 ** e) * 100) / 100;
  return `${formatNumber(m)} × 10${String(e).split('').map((c) => SUP[c]).join('')}`;
}

/** Réponse attendue, lisible sur papier. */
export function answerText(def, inst) {
  try {
    switch (def.type) {
      case 'numeric': {
        // exercice généré : la réponse type est déjà écrite comme on l'attend (« 1/6 », « 15 h 30 »)…
        const g = def.generatedAnswer && def.generatedAnswer.value;
        if (g && !/\d[.,]\d{4,}/.test(String(g))) return String(g);
        // … sauf une valeur exacte à rallonge (233,333…) : on l'écrit avec l'arrondi demandé (tolérance ou `round`)
        const dec = Number.isInteger(def.round) ? def.round : def.tolerance ? Math.max(0, Math.ceil(-Math.log10(def.tolerance * 2) - 1e-9)) : null;
        const frac = fractionAnswer(def, inst.params, dec);
        if (frac) return frac;
        // (réponse écrite comme un nombre ou comme un calcul : « 1700000/1465 »)
        const value = dec === null ? null : typeof def.answer === 'number' ? def.answer : expectedValue(def, inst.params);
        if (Number.isFinite(value)) return `${formatNumber(Math.round(value * 10 ** dec) / 10 ** dec)}${def.unit ? ` ${def.unit}` : ''}`;
        // très petite valeur (« 0,000003 s ») : en notation scientifique
        const exact = typeof def.answer === 'number' ? def.answer : expectedValue(def, inst.params);
        if (Number.isFinite(exact) && exact !== 0 && Math.abs(exact) < 1e-3) return `${scientific(exact)}${def.unit ? ` ${def.unit}` : ''}`;
        return describeExpected({ def, params: inst.params });
      }
      case 'expression': return expressionAnswer(def, inst.params);
      case 'text': return (def.accept || [])[0] || '';
      case 'qcm': {
        // « correct » peut être une condition sur les paramètres (« a > 2 ») : on l'évalue comme le correcteur
        const ok = (c) => (typeof c.correct === 'string' ? Boolean(evaluate(parse(c.correct, { names: new Set(Object.keys(inst.params)) }), inst.params)) : Boolean(c.correct));
        return def.choices.map((c, i) => (ok(c) ? LETTERS[i] : null)).filter(Boolean).join(', ');
      }
      case 'match': return def.left.map((l, i) => `${i + 1} → ${LETTERS[def.right.findIndex((r) => r.id === def.pairs[l.id])]}`).join(' ; ');
      case 'categorize': return def.items.map((it) => `${it.label} : ${(def.categories.find((c) => c.id === it.category) || {}).label}`).join(' ; ');
      case 'order': return (def.answerOrder || def.items.map((i) => i.id)).map((id) => LETTERS[def.items.findIndex((i) => i.id === id)]).join(' – ');
      case 'highlight': return tokenizeHighlight(t(inst, def.text)).filter((x) => x.target).map((x) => x.text).join(', ');
      case 'dictation': return Array.isArray(def.answer) ? def.answer[0] : def.answer;
      case 'steps': return def.generatedAnswer ? def.generatedAnswer.lines[def.generatedAnswer.lines.length - 1] : '';
      case 'composite': return def.parts.map((p, i) => `${i + 1}) ${answerText(p, inst) || 'voir la correction'}`).join('   ');
      default: { const c = canonicalResponse(def); return c.value || ''; }
    }
  } catch { return ''; }
}

/**
 * Imprime une fiche. items = [{ def, inst }] (instances déjà tirées : le corrigé correspond aux énoncés).
 * Pour les rangements, l'ordre imprimé est mélangé et le corrigé indique les lettres dans le bon ordre.
 */
/** Mélange reproductible (même graine → même fiche) ; jamais l'ordre de départ quand c'est possible. */
export function seededShuffle(arr, seed) {
  const rand = rng(seed);
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  if (a.length > 1 && a.every((x, i) => x === arr[i])) [a[0], a[1]] = [a[1], a[0]];
  return a;
}

/**
 * Version papier d'un exercice : les éléments à ranger et la colonne de droite des associations sont
 * mélangés (sinon l'ordre du contenu donnerait la réponse), y compris dans les problèmes en plusieurs questions.
 */
export function paperDef(def, seed) {
  if (def.type === 'order') return { ...def, items: seededShuffle(def.items, seed), answerOrder: def.items.map((i) => i.id) };
  if (def.type === 'match') return { ...def, right: seededShuffle(def.right, seed) };
  if (def.type === 'composite') return { ...def, parts: def.parts.map((p, i) => paperDef(p, seed + i + 1)) };
  return def;
}

export function printSheet({ title, subtitle, items }) {
  const shuffledItems = items.map(({ def, inst }) => ({ def: paperDef(def, inst.seed), inst }));
  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const sheet = h('div', { class: 'print-sheet' },
    h('header', { class: 'ps-head' }, h('h1', {}, title), h('p', {}, subtitle || ''), h('p', { class: 'ps-meta' }, `Prisme · ${date} · Prénom ou pseudo : …………………`)),
    h('ol', { class: 'ps-list' }, shuffledItems.map(({ def, inst }) => h('li', { class: 'ps-item' }, richText(inst.prompt, 'rich'), def.figure ? renderFigure(interpolateDeep(def.figure, inst.params)) : null, zone(def, inst),
      // problème expert : place pour la justification
      def.justify ? h('div', {}, h('p', { class: 'ps-note' }, def.justify.prompt || 'Explique ta démarche :'), lines(4)) : null))),
    h('section', { class: 'ps-answers' },
      h('h2', {}, 'Corrigé'),
      h('ol', { class: 'ps-list' }, shuffledItems.map(({ def, inst }) => {
        const ans = answerText(def, inst);
        return h('li', { class: 'ps-item' },
          ans ? h('p', {}, h('strong', {}, 'Réponse : '), ans) : null,
          inst.solution ? richText(inst.solution, 'rich small') : null,
          def.type === 'open' && inst.models.length ? h('p', { class: 'small' }, h('em', {}, 'Exemple : '), inst.models[0]) : null);
      }))));
  document.querySelectorAll('.print-sheet').forEach((x) => x.remove());
  document.body.append(sheet);
  document.body.classList.add('has-print-sheet');
  const cleanup = () => { sheet.remove(); document.body.classList.remove('has-print-sheet'); window.removeEventListener('afterprint', cleanup); };
  window.addEventListener('afterprint', cleanup);
  window.print();
}
