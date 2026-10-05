/**
 * Moteur d'expressions mathématiques (sans dépendance, utilisable dans le navigateur et sous Node).
 *
 * - Lecture tolérante de ce qu'un élève tape : virgule décimale française (3,5),
 *   multiplication implicite (2x, 3(x+1), (x+1)(x-1)), ×, ÷, :, ², ³, √, −.
 * - Les arguments de fonction sont séparés par « ; » (convention des calculatrices françaises).
 * - Comparaisons et logique (<, ≤, =, ≠, et, ou, non) pour les prédicats écrits dans les contenus.
 *
 * Arbre (AST) : {t:'num',v} {t:'var',n} {t:'neg',a} {t:'+'|'-'|'*'|'/'|'^',a,b}
 *               {t:'call',f,args} {t:'cmp',op,a,b} {t:'and'|'or',a,b} {t:'not',a} {t:'fact',a} {t:'abs',a}
 */

const FUNCTIONS = {
  sqrt: Math.sqrt, racine: Math.sqrt,
  abs: Math.abs,
  floor: Math.floor, ent: Math.floor,
  ceil: Math.ceil,
  round: (x, d = 0) => { const k = 10 ** d; return Math.round(x * k) / k; },
  arrondi: (x, d = 0) => { const k = 10 ** d; return Math.round(x * k) / k; },
  min: Math.min, max: Math.max,
  gcd: gcd, pgcd: gcd,
  lcm: (a, b) => Math.abs(a * b) / gcd(a, b), ppcm: (a, b) => Math.abs(a * b) / gcd(a, b),
  mod: (a, b) => ((a % b) + b) % b,
  isprime: (n) => (isPrime(n) ? 1 : 0), estpremier: (n) => (isPrime(n) ? 1 : 0),
  isint: (x) => (Math.abs(x - Math.round(x)) < 1e-9 ? 1 : 0), estentier: (x) => (Math.abs(x - Math.round(x)) < 1e-9 ? 1 : 0),
  // Trigonométrie en degrés (convention du collège)
  cos: (d) => Math.cos((d * Math.PI) / 180),
  sin: (d) => Math.sin((d * Math.PI) / 180),
  tan: (d) => Math.tan((d * Math.PI) / 180),
  ln: Math.log, log: Math.log10, exp: Math.exp,
  ndiv: countDivisors, nbdiv: countDivisors,
  digitsum: digitSum, sommechiffres: digitSum,
};

const CONSTANTS = { pi: Math.PI, 'π': Math.PI };
// tables sans prototype : « constructor » ou « __proto__ » ne sont ni des fonctions ni des constantes
Object.setPrototypeOf(FUNCTIONS, null);
Object.setPrototypeOf(CONSTANTS, null);
const own = (o, k) => o !== null && o !== undefined && Object.prototype.hasOwnProperty.call(o, k);

export function gcd(a, b) {
  a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b));
  while (b) [a, b] = [b, a % b];
  return a;
}

export function isPrime(n) {
  n = Math.round(n);
  if (n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return false;
  return true;
}

function countDivisors(n) {
  n = Math.abs(Math.round(n));
  let c = 0;
  for (let d = 1; d * d <= n; d++) if (n % d === 0) c += d * d === n ? 1 : 2;
  return c;
}

function digitSum(n) {
  return String(Math.abs(Math.round(n))).split('').reduce((s, c) => s + Number(c), 0);
}

export class ParseError extends Error {
  constructor(message, pos) { super(message); this.pos = pos; }
}

/* ------------------------------------------------------------------ */
/* Tokeniseur                                                          */
/* ------------------------------------------------------------------ */

const SUPERSCRIPTS = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };
const WORD_OPS = { et: 'and', and: 'and', ou: 'or', or: 'or', non: 'not', not: 'not' };
Object.setPrototypeOf(SUPERSCRIPTS, null);
Object.setPrototypeOf(WORD_OPS, null);

function normalizeInput(src) {
  return String(src)
    .replace(/[−–—]/g, '-') // signes moins typographiques
    .replace(/[×·∙⋅]/g, '*')
    .replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/≠/g, '!=')
    .replace(/ | /g, ' ');
}

export function tokenize(src) {
  const s = normalizeInput(src);
  const out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ' || c === '\t' || c === '\n') { i++; continue; }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(s[i + 1] || ''))) {
      let j = i;
      while (j < s.length && /[0-9]/.test(s[j])) j++;
      // séparateur de milliers : « 2 700 », « 25 000 » (espace suivie d'exactement 3 chiffres)
      if (j - i <= 3) {
        while (s[j] === ' ' && /^[0-9]{3}(?![0-9])/.test(s.slice(j + 1, j + 5))) j += 4;
      }
      // séparateur décimal : point, ou virgule immédiatement suivie d'un chiffre
      if ((s[j] === '.' || s[j] === ',') && /[0-9]/.test(s[j + 1] || '')) {
        j++;
        while (j < s.length && /[0-9]/.test(s[j])) j++;
      }
      // notation scientifique : 1e6, 3,2e-5
      const ex = s.slice(j).match(/^[eE][+-]?[0-9]+/);
      let v = Number(s.slice(i, j).replace(/ /g, '').replace(',', '.'));
      if (ex) { v *= 10 ** Number(ex[0].slice(1)); j += ex[0].length; }
      out.push({ k: 'num', v, pos: i });
      i = j;
      continue;
    }
    if (SUPERSCRIPTS[c] !== undefined) {
      let j = i; let txt = '';
      while (j < s.length && SUPERSCRIPTS[s[j]] !== undefined) { txt += SUPERSCRIPTS[s[j]]; j++; }
      out.push({ k: 'sup', v: Number(txt), pos: i });
      i = j;
      continue;
    }
    if (/[A-Za-zÀ-ÖØ-öø-ÿα-ωπ_]/.test(c)) {
      let j = i;
      while (j < s.length && /[A-Za-zÀ-ÖØ-öø-ÿα-ωπ_0-9]/.test(s[j])) j++;
      // les chiffres collés à une lettre (x2) sont rendus au flux : x2 -> x * 2 est ambigu, on coupe avant les chiffres
      let word = s.slice(i, j);
      const m = word.match(/^([^0-9]+)([0-9].*)$/);
      if (m) { word = m[1]; j = i + word.length; }
      const lw = word.toLowerCase();
      if (WORD_OPS[lw]) out.push({ k: 'op', v: WORD_OPS[lw], pos: i });
      else out.push({ k: 'id', v: word, pos: i });
      i = j;
      continue;
    }
    const two = s.slice(i, i + 2);
    if (['<=', '>=', '!=', '==', '**', '&&', '||'].includes(two)) {
      const map = { '**': '^', '==': '=', '&&': 'and', '||': 'or' };
      out.push({ k: 'op', v: map[two] || two, pos: i });
      i += 2;
      continue;
    }
    if ('+-*/^()[]=<>|!;:√,÷'.includes(c)) {
      let v = c;
      if (c === '[') v = '('; else if (c === ']') v = ')';
      else if (c === ',') v = ';';
      // « ÷ » et « : » : division écrite en ligne (affichée telle quelle, pas en fraction empilée)
      const inline = c === ':' || c === '÷';
      if (inline) v = '/';
      out.push({ k: 'op', v, pos: i, ...(inline ? { inline: true } : {}) });
      i++;
      continue;
    }
    throw new ParseError(`Caractère inattendu « ${c} »`, i);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Analyseur syntaxique (descente récursive)                            */
/* ------------------------------------------------------------------ */

export function parse(src, opts = {}) {
  const names = opts.names || null; // identifiants de plusieurs lettres à garder entiers (paramètres)
  const toks = tokenize(src);
  if (toks.length === 0) throw new ParseError('Expression vide', 0);
  let p = 0;
  const peek = () => toks[p];
  const isOp = (v) => toks[p] && toks[p].k === 'op' && toks[p].v === v;
  const expect = (v) => {
    if (!isOp(v)) throw new ParseError(`« ${v} » attendu`, toks[p] ? toks[p].pos : -1);
    p++;
  };

  function parseOr() {
    let a = parseAnd();
    while (isOp('or')) { p++; a = { t: 'or', a, b: parseAnd() }; }
    return a;
  }
  function parseAnd() {
    let a = parseNot();
    while (isOp('and')) { p++; a = { t: 'and', a, b: parseNot() }; }
    return a;
  }
  function parseNot() {
    if (isOp('not')) { p++; return { t: 'not', a: parseNot() }; }
    return parseCmp();
  }
  function parseCmp() {
    const a = parseSum();
    const t = peek();
    if (t && t.k === 'op' && ['=', '<', '>', '<=', '>=', '!='].includes(t.v)) {
      p++;
      const b = parseSum();
      return { t: 'cmp', op: t.v, a, b };
    }
    return a;
  }
  function parseSum() {
    let a = parseTerm();
    for (;;) {
      if (isOp('+')) { p++; a = { t: '+', a, b: parseTerm() }; }
      else if (isOp('-')) { p++; a = { t: '-', a, b: parseTerm() }; }
      else return a;
    }
  }
  function startsPrimary(t) {
    if (!t) return false;
    if (t.k === 'num' || t.k === 'id') return true;
    return t.k === 'op' && (t.v === '(' || t.v === '√');
  }
  function parseTerm() {
    let a = parseUnary();
    for (;;) {
      if (isOp('*')) { p++; a = { t: '*', a, b: parseUnary() }; }
      else if (isOp('/')) { const inline = peek().inline; p++; a = { t: '/', a, b: parseUnary(), ...(inline ? { inline: true } : {}) }; }
      else if (startsPrimary(peek())) { a = { t: '*', a, b: parsePower(), implicit: true }; }
      else return a;
    }
  }
  function parseUnary() {
    if (isOp('-')) { p++; return { t: 'neg', a: parseUnary() }; }
    if (isOp('+')) { p++; return parseUnary(); }
    return parsePower();
  }
  function parsePower() {
    const base = parsePostfix();
    if (isOp('^')) { p++; return { t: '^', a: base, b: parseUnary() }; }
    return base;
  }
  function parsePostfix() {
    let a = parsePrimary();
    for (;;) {
      const t = peek();
      if (t && t.k === 'sup') { p++; a = { t: '^', a, b: numNode(t.v) }; }
      else if (isOp('!')) { p++; a = { t: 'fact', a }; }
      else return a;
    }
  }
  function parsePrimary() {
    const t = peek();
    if (!t) throw new ParseError('Expression incomplète', -1);
    if (t.k === 'num') { p++; return numNode(t.v); }
    if (t.k === 'op' && t.v === '(') {
      p++;
      const e = parseOr();
      expect(')');
      return e;
    }
    if (t.k === 'op' && t.v === '|') {
      p++;
      const e = parseSum();
      expect('|');
      return { t: 'abs', a: e };
    }
    if (t.k === 'op' && t.v === '√') {
      p++;
      return { t: 'call', f: 'sqrt', args: [parsePostfix()] };
    }
    if (t.k === 'id') {
      p++;
      const lw = t.v.toLowerCase();
      if (FUNCTIONS[lw] && isOp('(')) {
        p++;
        const args = [];
        if (!isOp(')')) {
          args.push(parseOr());
          while (isOp(';')) { p++; args.push(parseOr()); }
        }
        expect(')');
        return { t: 'call', f: lw, args };
      }
      if (CONSTANTS[lw] !== undefined) return { t: 'var', n: 'π' };
      if (names && names.has(t.v)) return { t: 'var', n: t.v };
      if (opts.wholeIdentifiers) return { t: 'var', n: t.v };
      // identifiant de plusieurs lettres non reconnu : produit de variables (xy -> x*y)
      if (t.v.length > 1 && !/_/.test(t.v)) {
        const letters = [...t.v];
        let node = { t: 'var', n: letters[0] };
        for (let k = 1; k < letters.length; k++) node = { t: '*', a: node, b: { t: 'var', n: letters[k] }, implicit: true };
        return node;
      }
      return { t: 'var', n: t.v };
    }
    throw new ParseError(`« ${t.v} » inattendu`, t.pos);
  }

  const tree = parseOr();
  if (p < toks.length) throw new ParseError(`« ${toks[p].v} » inattendu`, toks[p].pos);
  return tree;
}

/** Variante de parse qui ne lève pas d'exception. */
export function tryParse(src, opts) {
  try { return { ok: true, node: parse(src, opts) }; } catch (e) { return { ok: false, error: e.message }; }
}

function numNode(v) { return { t: 'num', v }; }

/* ------------------------------------------------------------------ */
/* Évaluation                                                          */
/* ------------------------------------------------------------------ */

export function evaluate(node, env = {}) {
  switch (node.t) {
    case 'num': return node.v;
    case 'var': {
      if (node.n === 'π') return Math.PI;
      if (!own(env, node.n) || env[node.n] === undefined) throw new Error(`Variable inconnue : ${node.n}`);
      return env[node.n];
    }
    case 'neg': return -evaluate(node.a, env);
    case '+': return evaluate(node.a, env) + evaluate(node.b, env);
    case '-': return evaluate(node.a, env) - evaluate(node.b, env);
    case '*': return evaluate(node.a, env) * evaluate(node.b, env);
    case '/': return evaluate(node.a, env) / evaluate(node.b, env);
    case '^': return Math.pow(evaluate(node.a, env), evaluate(node.b, env));
    case 'abs': return Math.abs(evaluate(node.a, env));
    case 'fact': {
      const n = Math.round(evaluate(node.a, env));
      let r = 1;
      for (let k = 2; k <= n; k++) r *= k;
      return r;
    }
    case 'call': {
      const f = FUNCTIONS[node.f];
      if (!f) throw new Error(`Fonction inconnue : ${node.f}`);
      return f(...node.args.map((a) => evaluate(a, env)));
    }
    case 'cmp': {
      const a = evaluate(node.a, env); const b = evaluate(node.b, env);
      const eq = Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
      switch (node.op) {
        case '=': return eq ? 1 : 0;
        case '!=': return eq ? 0 : 1;
        case '<': return a < b && !eq ? 1 : 0;
        case '>': return a > b && !eq ? 1 : 0;
        case '<=': return a < b || eq ? 1 : 0;
        case '>=': return a > b || eq ? 1 : 0;
        default: throw new Error('Comparaison inconnue');
      }
    }
    case 'and': return evaluate(node.a, env) && evaluate(node.b, env) ? 1 : 0;
    case 'or': return evaluate(node.a, env) || evaluate(node.b, env) ? 1 : 0;
    case 'not': return evaluate(node.a, env) ? 0 : 1;
    default: throw new Error(`Nœud inconnu : ${node.t}`);
  }
}

/** Évalue une chaîne (raccourci pratique pour les contenus). */
export function evalString(src, env = {}) {
  return evaluate(parse(src, { names: new Set(Object.keys(env)) }), env);
}

/** Liste triée des variables libres d'une expression. */
export function variables(node, acc = new Set()) {
  if (!node) return acc;
  if (node.t === 'var' && node.n !== 'π') acc.add(node.n);
  for (const k of ['a', 'b']) if (node[k]) variables(node[k], acc);
  if (node.args) node.args.forEach((x) => variables(x, acc));
  return acc;
}

/** Remplace les variables présentes dans env par leur valeur numérique. */
export function substitute(node, env) {
  if (node.t === 'var' && own(env, node.n) && env[node.n] !== undefined) {
    const v = env[node.n];
    return v < 0 ? { t: 'neg', a: numNode(-v) } : numNode(v);
  }
  const copy = { ...node };
  for (const k of ['a', 'b']) if (node[k]) copy[k] = substitute(node[k], env);
  if (node.args) copy.args = node.args.map((x) => substitute(x, env));
  return copy;
}

/* ------------------------------------------------------------------ */
/* Équivalence numérique                                               */
/* ------------------------------------------------------------------ */

function close(a, b, rel = 1e-7) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(a - b) <= rel * Math.max(1, Math.abs(a), Math.abs(b));
}

function sampler(seed = 12345) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Deux expressions sont-elles égales pour toutes les valeurs des variables ?
 * Test numérique sur des points pseudo-aléatoires (fiable pour les expressions du secondaire).
 */
export function equivalent(a, b, opts = {}) {
  const vars = [...new Set([...variables(a), ...variables(b)])];
  const rnd = sampler(opts.seed || 987654);
  const trials = opts.trials || 10;
  let tested = 0;
  for (let k = 0; k < trials * 4 && tested < trials; k++) {
    const env = {};
    for (const v of vars) env[v] = Math.round((rnd() * 20 - 10) * 1000) / 1000 + 0.1234;
    let va; let vb;
    try { va = evaluate(a, env); vb = evaluate(b, env); } catch { return false; }
    if (!Number.isFinite(va) && !Number.isFinite(vb)) continue;
    if (!close(va, vb, opts.rel)) return false;
    tested++;
  }
  return tested > 0;
}

/**
 * Deux équations (nœuds cmp '=') ont-elles le même ensemble de solutions ?
 * On teste si (G1 - D1) est proportionnel à (G2 - D2) : c'est exact pour les équations
 * du premier degré et suffisant pour les transformations usuelles (ajouter, multiplier par k ≠ 0).
 */
export function equationsEquivalent(e1, e2, opts = {}) {
  if (e1.t !== 'cmp' || e2.t !== 'cmp' || e1.op !== '=' || e2.op !== '=') return false;
  const f1 = { t: '-', a: e1.a, b: e1.b };
  const f2 = { t: '-', a: e2.a, b: e2.b };
  const vars = [...new Set([...variables(f1), ...variables(f2)])];
  const rnd = sampler(opts.seed || 4242);
  let ratio = null; let tested = 0; let bothZero = 0;
  for (let k = 0; k < 40 && tested < 8; k++) {
    const env = {};
    for (const v of vars) env[v] = Math.round((rnd() * 20 - 10) * 1000) / 1000 + 0.377;
    let v1; let v2;
    try { v1 = evaluate(f1, env); v2 = evaluate(f2, env); } catch { return false; }
    if (!Number.isFinite(v1) || !Number.isFinite(v2)) continue;
    if (Math.abs(v1) < 1e-12 && Math.abs(v2) < 1e-12) { tested++; bothZero++; continue; }
    if (Math.abs(v1) < 1e-12 || Math.abs(v2) < 1e-12) return false;
    const r = v2 / v1;
    if (ratio === null) ratio = r;
    else if (!close(r, ratio, 1e-6)) return false;
    tested++;
  }
  if (tested > 0 && bothZero === tested) return true; // deux identités (vraies pour tout x)
  return tested > 0 && ratio !== null && Math.abs(ratio) > 1e-12;
}

/** Résout a·x + b = c·x + d (premier degré). Renvoie {kind:'unique', x} | {kind:'none'} | {kind:'all'}. */
export function solveLinear(eq, v = 'x') {
  const f = { t: '-', a: eq.a, b: eq.b };
  const at = (x) => evaluate(f, { [v]: x });
  const f0 = at(0); const f1 = at(1);
  const slope = f1 - f0;
  // linéarité vérifiée aussi en des points négatifs et non entiers (√(x²) ou |x| ne sont pas linéaires)
  for (const x of [2, -3.7, 5.3, -11, 0.45]) {
    const fx = at(x);
    if (!Number.isFinite(fx) || Math.abs(fx - (f0 + slope * x)) > 1e-9 * Math.max(1, Math.abs(fx))) return { kind: 'nonlinear' };
  }
  if (Math.abs(slope) < 1e-12) return Math.abs(f0) < 1e-12 ? { kind: 'all' } : { kind: 'none' };
  return { kind: 'unique', x: -f0 / slope };
}

/* ------------------------------------------------------------------ */
/* Formes : développée, réduite, factorisée, fraction irréductible      */
/* ------------------------------------------------------------------ */

function hasVar(node) { return variables(node).size > 0; }

/** Liste des termes signés d'une somme : [{sign:+1|-1, node}] */
export function sumTerms(node, sign = 1, out = []) {
  if (node.t === '+') { sumTerms(node.a, sign, out); sumTerms(node.b, sign, out); }
  else if (node.t === '-') { sumTerms(node.a, sign, out); sumTerms(node.b, -sign, out); }
  else if (node.t === 'neg') sumTerms(node.a, -sign, out);
  else out.push({ sign, node });
  return out;
}

/** Liste des facteurs d'un produit (les divisions par une constante comptent comme facteurs). */
export function productFactors(node, out = []) {
  if (node.t === '*') { productFactors(node.a, out); productFactors(node.b, out); }
  else if (node.t === 'neg' && node.a.t === 'num') out.push(numNode(-node.a.v));
  else if (node.t === 'neg') { out.push(numNode(-1)); productFactors(node.a, out); }
  else out.push(node);
  return out;
}

const isSum = (n) => n.t === '+' || n.t === '-' || (n.t === 'neg' && (n.a.t === '+' || n.a.t === '-'));

/** Aucun produit ni puissance ne porte sur une somme contenant une variable. */
export function isDeveloped(node) {
  let ok = true;
  (function walk(n, parent) {
    if (!ok || !n) return;
    if (isSum(n) && hasVar(n) && parent && ['*', '^', '/'].includes(parent.t)) ok = false;
    if (isSum(n) && hasVar(n) && parent && parent.t === 'neg') ok = false;
    for (const k of ['a', 'b']) if (n[k]) walk(n[k], n);
    if (n.args) n.args.forEach((x) => walk(x, n));
  })(node, null);
  return ok;
}

/** Clé de monôme d'un terme développé, ou null si ce n'est pas un monôme simple. */
function monomialInfo(term) {
  const factors = productFactors(term);
  let numeric = 0; let coef = 1; const powers = {}; let varOccurrences = 0;
  for (const f of factors) {
    if (f.t === 'num') { numeric++; coef *= f.v; continue; }
    if (f.t === '/' && !hasVar(f)) { numeric++; coef *= evaluate(f); continue; }
    if (f.t === 'var') { powers[f.n] = (powers[f.n] || 0) + 1; varOccurrences++; continue; }
    if (f.t === '^' && f.a.t === 'var' && f.b.t === 'num') { powers[f.a.n] = (powers[f.a.n] || 0) + f.b.v; varOccurrences++; continue; }
    if (f.t === '/' && hasVar(f.a) && !hasVar(f.b)) {
      const inner = monomialInfo(f.a);
      if (!inner) return null;
      coef *= inner.coef / evaluate(f.b);
      numeric += Math.max(1, inner.numeric);
      for (const [k, v] of Object.entries(inner.powers)) powers[k] = (powers[k] || 0) + v;
      varOccurrences += inner.varOccurrences;
      continue;
    }
    return null;
  }
  const key = Object.keys(powers).sort().map((k) => (powers[k] === 1 ? k : `${k}^${powers[k]}`)).join('*') || '1';
  return { key, coef, numeric, varOccurrences, distinctVars: Object.keys(powers).length, powers };
}

/** Développée ET réduite : un seul terme par monôme, coefficients calculés, pas de x·x. */
export function isReduced(node) {
  if (!isDeveloped(node)) return false;
  const terms = sumTerms(node);
  if (terms.length === 1 && terms[0].node.t === 'num' && terms[0].node.v === 0) return true; // « 0 » est réduit
  const seen = new Set();
  for (const { node: t } of terms) {
    const info = monomialInfo(t);
    if (!info) return false;
    if (info.numeric > 1) return false;
    if (info.varOccurrences > info.distinctVars) return false;
    if (seen.has(info.key)) return false;
    if (info.coef === 0) return false;
    seen.add(info.key);
  }
  return true;
}

/** Forme factorisée : un produit (ou une puissance) dont au moins un facteur est une somme avec variable. */
export function isFactored(node) {
  let n = node;
  while (n.t === 'neg') n = n.a;
  if (n.t === '^') return isSum(n.a) && hasVar(n.a);
  if (n.t !== '*') return false;
  const factors = productFactors(n);
  return factors.length >= 2 && factors.some((f) => (isSum(f) && hasVar(f)) || (f.t === '^' && isSum(f.a)));
}

/** Entier, ou quotient d'entiers premiers entre eux avec dénominateur > 1 (signe éventuel devant). */
export function isIrreducibleFraction(node) {
  let n = node;
  if (n.t === 'neg') n = n.a;
  if (n.t === 'num') return Number.isInteger(n.v);
  if (n.t !== '/') return false;
  let a = n.a; let b = n.b;
  if (a.t === 'neg') a = a.a;
  if (b.t === 'neg') b = b.a;
  if (a.t !== 'num' || b.t !== 'num') return false;
  if (!Number.isInteger(a.v) || !Number.isInteger(b.v)) return false;
  return b.v > 1 && gcd(a.v, b.v) === 1;
}

/** Nombre écrit « tout fait » : entier, décimal, ou fraction d'entiers (avec signe éventuel). */
export function isNumberLiteral(node) {
  let n = node;
  if (n.t === 'neg') n = n.a;
  if (n.t === 'num') return true;
  if (n.t === '/') {
    const a = n.a.t === 'neg' ? n.a.a : n.a;
    const b = n.b.t === 'neg' ? n.b.a : n.b;
    return a.t === 'num' && b.t === 'num' && Number.isInteger(a.v) && Number.isInteger(b.v);
  }
  return false;
}

/** Résultat « final » : nombre écrit, fraction d'entiers, ou écriture scientifique a × 10^k. */
export function isFinalNumber(node) {
  if (isNumberLiteral(node)) return true;
  let n = node.t === 'neg' ? node.a : node;
  if (n.t === '*' && isNumberLiteral(n.a) && n.b.t === '^' && n.b.a.t === 'num' && n.b.a.v === 10) {
    const e = n.b.b.t === 'neg' ? n.b.b.a : n.b.b;
    return e.t === 'num' && Number.isInteger(e.v);
  }
  if (n.t === '^' && n.a.t === 'num' && n.a.v === 10) { const e = n.b.t === 'neg' ? n.b.a : n.b; return e.t === 'num'; }
  return false;
}

/** Équation résolue : « x = nombre » (ou « nombre = x »). */
export function isSolvedForm(node, v = 'x') {
  if (node.t !== 'cmp' || node.op !== '=') return false;
  const isV = (n) => n.t === 'var' && n.n === v;
  return (isV(node.a) && !hasVar(node.b)) || (isV(node.b) && !hasVar(node.a));
}

/** Nombre de « traces de calcul » restant dans une expression numérique (opérations non effectuées). */
export function operationCount(node) {
  if (!node || node.t === 'num' || node.t === 'var') return 0;
  if (node.t === 'neg') return node.a.t === 'num' ? 0 : operationCount(node.a);
  let c = node.t === '/' && node.a.t === 'num' && node.b.t === 'num' ? 0 : 1;
  for (const k of ['a', 'b']) if (node[k]) c += operationCount(node[k]);
  if (node.args) node.args.forEach((x) => { c += operationCount(x); });
  return c;
}

/* ------------------------------------------------------------------ */
/* Affichage                                                           */
/* ------------------------------------------------------------------ */

/** Nombre au format français : virgule décimale, signe moins typographique, espaces fines. */
export function formatNumber(v, maxDecimals = 6) {
  if (!Number.isFinite(v)) return String(v);
  const r = Math.round(v * 10 ** maxDecimals) / 10 ** maxDecimals;
  const neg = r < 0;
  const [int, dec] = Math.abs(r).toString().split('.');
  const intFmt = int.length > 4 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : int;
  return (neg ? '−' : '') + intFmt + (dec ? ',' + dec : '');
}

const PREC = { or: 1, and: 2, not: 3, cmp: 4, '+': 5, '-': 5, '*': 6, '/': 6, neg: 7, '^': 8, fact: 9, call: 10, abs: 10, num: 10, var: 10 };
const CMP_TXT = { '=': ' = ', '<': ' < ', '>': ' > ', '<=': ' ≤ ', '>=': ' ≥ ', '!=': ' ≠ ' };

/** Texte lisible (ex. « 2x² − 3(x + 1) »). */
export function toText(node) {
  const wrap = (child, parentPrec, right = false) => {
    const s = toText(child);
    const cp = PREC[child.t] ?? 10;
    // un nombre négatif à droite d'une opération s'écrit entre parenthèses : 5 − (−3), 2 × (−4)
    const needs = cp < parentPrec || (right && cp === parentPrec) || (right && child.t === 'neg');
    return needs ? `(${s})` : s;
  };
  switch (node.t) {
    case 'num': return formatNumber(node.v);
    case 'var': return node.n;
    case 'neg': return '−' + wrap(node.a, PREC.neg);
    case '+': return `${wrap(node.a, 5)} + ${wrap(node.b, 5, true)}`;
    case '-': return `${wrap(node.a, 5)} − ${wrap(node.b, 5, true)}`;
    case '*': {
      const left = wrap(node.a, 6);
      const right = wrap(node.b, 6, true);
      const implicitOk = node.b.t === 'var' || (node.b.t === '^' && node.b.a.t === 'var') || (/^\(/.test(right) && node.b.t !== 'neg');
      return implicitOk ? `${left}${right}` : `${left} × ${right}`;
    }
    case '/': return `${wrap(node.a, 6)}${node.inline ? ' ÷ ' : '/'}${wrap(node.b, 6, true)}`;
    case '^': {
      const base = wrap(node.a, 9);
      if (node.b.t === 'num' && Number.isInteger(node.b.v) && node.b.v >= 0 && node.b.v < 10) return base + '⁰¹²³⁴⁵⁶⁷⁸⁹'[node.b.v];
      return `${base}^${wrap(node.b, 8)}`;
    }
    case 'fact': return wrap(node.a, 9) + '!';
    case 'abs': return `|${toText(node.a)}|`;
    case 'call': return node.f === 'sqrt' ? `√(${toText(node.args[0])})` : `${node.f}(${node.args.map(toText).join(' ; ')})`;
    case 'cmp': return toText(node.a) + CMP_TXT[node.op] + toText(node.b);
    case 'and': return `${wrap(node.a, 2)} et ${wrap(node.b, 2)}`;
    case 'or': return `${wrap(node.a, 1)} ou ${wrap(node.b, 1)}`;
    case 'not': return `non ${wrap(node.a, 3)}`;
    default: return '?';
  }
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Rendu HTML (fractions empilées, exposants) pour l'aperçu « voici ce que j'ai compris ». */
export function toHTML(node) {
  const wrap = (child, parentPrec, right = false) => {
    const s = toHTML(child);
    // une fraction empilée se lit d'un bloc : pas de parenthèses autour d'elle dans un produit ou un quotient
    if (child.t === '/' && !child.inline && parentPrec <= PREC['/']) return s;
    const cp = PREC[child.t] ?? 10;
    const needs = cp < parentPrec || (right && cp === parentPrec) || (right && child.t === 'neg');
    return needs ? `<span class="m-par">(</span>${s}<span class="m-par">)</span>` : s;
  };
  switch (node.t) {
    case 'num': return `<span class="m-num">${esc(formatNumber(node.v))}</span>`;
    case 'var': return `<i class="m-var">${esc(node.n)}</i>`;
    case 'neg': return '−' + wrap(node.a, PREC.neg);
    case '+': return `${wrap(node.a, 5)} + ${wrap(node.b, 5, true)}`;
    case '-': return `${wrap(node.a, 5)} − ${wrap(node.b, 5, true)}`;
    case '*': {
      const right = wrap(node.b, 6, true);
      const implicitOk = node.b.t === 'var' || (node.b.t === '^' && node.b.a.t === 'var') || (right.startsWith('<span class="m-par">') && node.b.t !== 'neg');
      return implicitOk ? `${wrap(node.a, 6)}${right}` : `${wrap(node.a, 6)} × ${right}`;
    }
    case '/': return node.inline
      ? `${wrap(node.a, 6)} ÷ ${wrap(node.b, 6, true)}`
      : `<span class="m-frac"><span class="m-numer">${toHTML(node.a)}</span><span class="m-denom">${toHTML(node.b)}</span></span>`;
    case '^': return `${wrap(node.a, 9)}<sup>${toHTML(node.b)}</sup>`;
    case 'fact': return wrap(node.a, 9) + '!';
    case 'abs': return `|${toHTML(node.a)}|`;
    case 'call': return node.f === 'sqrt' ? `√<span class="m-sqrt">${toHTML(node.args[0])}</span>` : `${esc(node.f)}(${node.args.map(toHTML).join(' ; ')})`;
    case 'cmp': return toHTML(node.a) + esc(CMP_TXT[node.op]) + toHTML(node.b);
    case 'and': return `${toHTML(node.a)} et ${toHTML(node.b)}`;
    case 'or': return `${toHTML(node.a)} ou ${toHTML(node.b)}`;
    case 'not': return `non ${toHTML(node.a)}`;
    default: return '?';
  }
}

/**
 * Harmonise la casse des variables avec celles de la réponse attendue : un élève qui tape « 2X + 3 »
 * pour « 2x + 3 » n'a pas fait d'erreur de mathématiques.
 */
export function alignVariableCase(node, reference) {
  const expected = variables(reference);
  const map = {};
  for (const v of variables(node)) {
    if (!expected.has(v) && expected.has(v.toLowerCase())) map[v] = v.toLowerCase();
    else if (!expected.has(v) && expected.has(v.toUpperCase())) map[v] = v.toUpperCase();
  }
  if (!Object.keys(map).length) return node;
  const walk = (n) => {
    if (n.t === 'var' && Object.prototype.hasOwnProperty.call(map, n.n)) return { ...n, n: map[n.n] };
    const c = { ...n };
    for (const k of ['a', 'b']) if (n[k]) c[k] = walk(n[k]);
    if (n.args) c.args = n.args.map(walk);
    return c;
  };
  return walk(node);
}
