/**
 * Langage « Tortue » en français (programmation textuelle après les blocs).
 * Interprété sans eval : sûr, limité en nombre d'instructions.
 *
 *   avance 50          recule 20          droite 90          gauche 45
 *   répète 4 [ avance 50 droite 90 ]
 *   lève               pose               couleur rouge
 *   mets c à 10        ajoute 5 à c
 *   si c > 20 [ … ] sinon [ … ]
 *   pour carre taille [ répète 4 [ avance taille droite 90 ] ]   puis   carre 80
 * Les expressions sont écrites sans espace (100/n, c*2) ou entre parenthèses ((c + 5) * 2).
 */
import { parse, evaluate } from './expr.js';

const MAX_STEPS = 20000;
const MAX_SEGMENTS = 6000;

export class TurtleError extends Error {
  constructor(message, line) { super(line ? `Ligne ${line} : ${message}` : message); this.line = line; }
}

const ALIASES = Object.assign(Object.create(null), {
  avance: 'avance', av: 'avance', recule: 'recule', re: 'recule',
  droite: 'droite', dr: 'droite', td: 'droite', gauche: 'gauche', ga: 'gauche', tg: 'gauche',
  tourne: 'tourne', 'répète': 'repete', repete: 'repete', 'lève': 'leve', leve: 'leve', pose: 'pose',
  couleur: 'couleur', mets: 'mets', ajoute: 'ajoute', si: 'si', sinon: 'sinon', pour: 'pour',
});

export function tokenizeProgram(src) {
  const toks = [];
  const lines = String(src).replace(/\r/g, '').split('\n');
  lines.forEach((rawLine, li) => {
    const line = rawLine.replace(/#.*$/, '').replace(/\/\/.*$/, '');
    let i = 0;
    while (i < line.length) {
      const c = line[i];
      if (/\s/.test(c)) { i++; continue; }
      if (c === '[' || c === ']') { toks.push({ v: c, line: li + 1 }); i++; continue; }
      if (c === '(') {
        let depth = 0; let j = i;
        for (; j < line.length; j++) {
          if (line[j] === '(') depth++;
          else if (line[j] === ')') { depth--; if (depth === 0) break; }
        }
        if (depth !== 0) throw new TurtleError('parenthèse non fermée', li + 1);
        toks.push({ v: line.slice(i, j + 1), line: li + 1, expr: true });
        i = j + 1;
        continue;
      }
      let j = i;
      while (j < line.length && !/[\s[\]]/.test(line[j])) j++;
      toks.push({ v: line.slice(i, j), line: li + 1 });
      i = j;
    }
  });
  return toks;
}

/** Mots-clés utilisés dans un programme, normalisés (« repete » et « répète » donnent le même mot-clé). */
export function programKeywords(src) {
  const out = new Set();
  for (const t of tokenizeProgram(src)) { const k = ALIASES[t.v.toLowerCase()]; if (k) out.add(k); }
  return out;
}

/** Analyse le programme en arbre d'instructions. */
export function parseProgram(src) {
  const toks = tokenizeProgram(src);
  let p = 0;
  const procs = Object.create(null);

  function block() {
    const t = toks[p];
    if (!t || t.v !== '[') throw new TurtleError('« [ » attendu pour ouvrir un bloc', t ? t.line : undefined);
    p++;
    const body = [];
    while (toks[p] && toks[p].v !== ']') body.push(statement());
    if (!toks[p]) throw new TurtleError('« ] » manquant pour fermer un bloc', t.line);
    p++;
    return body;
  }
  const isStop = (t, line) => !t || t.line !== line || t.v === '[' || t.v === ']' || t.v === 'à' || ALIASES[t.v.toLowerCase()] || procs[t.v.toLowerCase()];
  /** Expression : un jeton, ou plusieurs jetons de la même ligne (« c + 5 », « c > 20 ») jusqu'au prochain mot-clé ou crochet. */
  function exprTok(single = false) {
    const t = toks[p];
    if (!t || t.v === '[' || t.v === ']') throw new TurtleError('valeur attendue', t ? t.line : undefined);
    const parts = [t.v];
    p++;
    while (!single && !isStop(toks[p], t.line)) { parts.push(toks[p].v); p++; }
    const src = parts.join(' ');
    try { return { node: parse(src, { wholeIdentifiers: true }), line: t.line }; } catch (e) { throw new TurtleError(`valeur « ${src} » illisible`, t.line); }
  }
  function statement() {
    const t = toks[p];
    const word = t.v.toLowerCase();
    const kw = ALIASES[word];
    p++;
    switch (kw) {
      case 'avance': case 'recule': case 'droite': case 'gauche':
        return { op: kw, arg: exprTok(), line: t.line };
      case 'tourne': {
        const dir = toks[p] && ALIASES[toks[p].v.toLowerCase()];
        if (dir === 'droite' || dir === 'gauche') { p++; return { op: dir, arg: exprTok(), line: t.line }; }
        return { op: 'droite', arg: exprTok(), line: t.line };
      }
      case 'repete': {
        const n = exprTok();
        return { op: 'repete', arg: n, body: block(), line: t.line };
      }
      case 'leve': return { op: 'leve', line: t.line };
      case 'pose': return { op: 'pose', line: t.line };
      case 'couleur': { const c = toks[p]; p++; return { op: 'couleur', color: c ? c.v : 'noir', line: t.line }; }
      case 'mets': {
        const name = toks[p]; p++;
        if (!toks[p] || toks[p].v !== 'à') throw new TurtleError('écris « mets variable à valeur »', t.line);
        p++;
        return { op: 'mets', name: name.v, arg: exprTok(), line: t.line };
      }
      case 'ajoute': {
        const val = exprTok();
        if (!toks[p] || toks[p].v !== 'à') throw new TurtleError('écris « ajoute valeur à variable »', t.line);
        p++;
        const name = toks[p]; p++;
        return { op: 'ajoute', name: name.v, arg: val, line: t.line };
      }
      case 'si': {
        const cond = exprTok();
        const yes = block();
        let no = [];
        if (toks[p] && toks[p].v.toLowerCase() === 'sinon') { p++; no = block(); }
        return { op: 'si', arg: cond, body: yes, elseBody: no, line: t.line };
      }
      case 'pour': {
        const name = toks[p]; p++;
        const params = [];
        while (toks[p] && toks[p].v !== '[') { params.push(toks[p].v.replace(/^:/, '')); p++; }
        const body = block();
        procs[name.v.toLowerCase()] = { params, body };
        return { op: 'noop', line: t.line };
      }
      default: {
        if (procs[word]) {
          const args = procs[word].params.map(() => exprTok(true));
          return { op: 'appel', name: word, args, line: t.line };
        }
        if (t.v === ']') throw new TurtleError('« ] » en trop', t.line);
        throw new TurtleError(`instruction inconnue « ${t.v} »`, t.line);
      }
    }
  }
  const program = [];
  while (p < toks.length) program.push(statement());
  return { program, procs };
}

const COLORS = { noir: '#1d2433', rouge: '#d6453d', bleu: '#2f5bd3', vert: '#2a9d5c', orange: '#e07a1f', violet: '#7a4cc2', rose: '#d9468f', jaune: '#d9a400' };

/** Exécute le programme et renvoie le dessin (segments) et l'état final. */
export function runProgram(src, opts = {}) {
  const { program, procs } = parseProgram(src);
  const st = { x: 0, y: 0, heading: 0, pen: true, color: COLORS.noir, steps: 0, segments: [], vars: { ...(opts.vars || {}) } };
  function exec(list, scope) {
    for (const s of list) {
      if (++st.steps > MAX_STEPS) throw new TurtleError('programme trop long (boucle infinie ?)', s.line);
      switch (s.op) {
        case 'avance': case 'recule': {
          const d = evalNode(s.arg, scope) * (s.op === 'recule' ? -1 : 1);
          if (!Number.isFinite(d) || Math.abs(d) > 100000) throw new TurtleError('distance impossible ou trop grande (100 000 au plus)', s.line);
          const rad = (st.heading * Math.PI) / 180;
          const nx = st.x + d * Math.cos(rad); const ny = st.y + d * Math.sin(rad);
          if (st.pen) {
            st.segments.push({ x1: st.x, y1: st.y, x2: nx, y2: ny, color: st.color });
            if (st.segments.length > MAX_SEGMENTS) throw new TurtleError('dessin trop grand', s.line);
          }
          st.x = nx; st.y = ny;
          break;
        }
        case 'droite': case 'gauche': {
          const a = evalNode(s.arg, scope);
          if (!Number.isFinite(a)) throw new TurtleError('angle impossible', s.line);
          st.heading += s.op === 'gauche' ? a : -a;
          break;
        }
        case 'repete': {
          const n = Math.round(evalNode(s.arg, scope));
          if (n < 0 || n > 10000) throw new TurtleError('nombre de répétitions invalide', s.line);
          for (let k = 0; k < n; k++) exec(s.body, scope);
          break;
        }
        case 'leve': st.pen = false; break;
        case 'pose': st.pen = true; break;
        case 'couleur': st.color = COLORS[s.color.toLowerCase()] || COLORS.noir; break;
        case 'mets': scope[s.name] = evalNode(s.arg, scope); break;
        case 'ajoute':
          if (scope[s.name] === undefined) throw new TurtleError(`variable « ${s.name} » non définie`, s.line);
          scope[s.name] += evalNode(s.arg, scope);
          break;
        case 'si': exec(evalNode(s.arg, scope) ? s.body : s.elseBody, scope); break;
        case 'appel': {
          const proc = procs[s.name];
          const local = { ...scope };
          proc.params.forEach((pName, i) => { local[pName] = evalNode(s.args[i], scope); });
          exec(proc.body, local);
          break;
        }
        default: break;
      }
    }
  }
  function evalNode(arg, scope) {
    try {
      return evaluate(arg.node, scope);
    } catch (e) {
      throw new TurtleError(e.message.replace('Variable inconnue', 'variable inconnue'), arg.line);
    }
  }
  exec(program, st.vars);
  return { segments: st.segments, x: st.x, y: st.y, heading: st.heading, steps: st.steps, instructions: countInstructions(program) };
}

function countInstructions(list) {
  return list.reduce((n, s) => n + (s.op === 'noop' ? 0 : 1) + (s.body ? countInstructions(s.body) : 0) + (s.elseBody ? countInstructions(s.elseBody) : 0), 0);
}

/** Échantillonne les segments en points (pas de 1 unité) pour comparer deux dessins. */
export function samplePoints(segments, step = 1) {
  const pts = [];
  for (const s of segments) {
    const len = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
    const n = Math.max(1, Math.ceil(len / step));
    for (let k = 0; k <= n; k++) pts.push([s.x1 + ((s.x2 - s.x1) * k) / n, s.y1 + ((s.y2 - s.y1) * k) / n]);
  }
  return pts;
}

function coverage(a, b, tol = 1.6) {
  if (!a.length) return b.length ? 0 : 1;
  const grid = new Map();
  const cell = (x, y) => `${Math.floor(x / tol)},${Math.floor(y / tol)}`;
  for (const [x, y] of b) {
    const k = cell(x, y);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push([x, y]);
  }
  let hit = 0;
  for (const [x, y] of a) {
    const cx = Math.floor(x / tol); const cy = Math.floor(y / tol);
    let found = false;
    for (let dx = -1; dx <= 1 && !found; dx++) {
      for (let dy = -1; dy <= 1 && !found; dy++) {
        const bucket = grid.get(`${cx + dx},${cy + dy}`);
        if (bucket && bucket.some(([u, v]) => Math.hypot(u - x, v - y) <= tol)) found = true;
      }
    }
    if (found) hit++;
  }
  return hit / a.length;
}

/** Les deux dessins sont-ils identiques (au symétrique près par rapport à la direction de départ) ? */
export function sameDrawing(segA, segB) {
  // pas d'échantillonnage adapté à la taille du dessin (au plus ≈ 20 000 points), tolérance en conséquence
  const length = (segs) => segs.reduce((t, s) => t + Math.hypot(s.x2 - s.x1, s.y2 - s.y1), 0);
  const step = Math.max(1, Math.max(length(segA), length(segB)) / 20000);
  const tol = Math.max(1.6, step * 1.5);
  const a = samplePoints(segA, step);
  const b = samplePoints(segB, step);
  const bMirror = b.map(([x, y]) => [x, -y]);
  const score = (u, v) => Math.min(coverage(u, v, tol), coverage(v, u, tol));
  return Math.max(score(a, b), score(a, bMirror)) >= 0.97;
}
