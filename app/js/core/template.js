/**
 * Gabarits d'exercices : tirage des paramètres et interpolation des énoncés.
 *
 * Un contenu peut déclarer des paramètres :
 *   "params": { "a": {"int":[2,9]}, "b": {"int":[-9,9], "not":[0]}, "c": {"choice":[2,3,5]},
 *               "d": {"dec":[0.5,9.5], "step":0.5}, "p": {"expr":"a*b"} },
 *   "constraints": ["gcd(a;b) = 1", "a != b"]
 * et les utiliser dans les textes : {a}, {a*b}, {b|p} (parenthèses si négatif), {b|s} (terme signé « + 3 » / « − 3 »),
 * {a|c} (coefficient devant une lettre : 1 → rien, −1 → « − »), {x|d2} (deux décimales).
 */
import { parse, evaluate, formatNumber, substitute } from './expr.js';

/** Générateur pseudo-aléatoire reproductible (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function drawOne(spec, rand, env, names) {
  if (typeof spec === 'number') return spec;
  if (spec.int) {
    const [lo, hi] = spec.int;
    return lo + Math.floor(rand() * (hi - lo + 1));
  }
  if (spec.dec) {
    const [lo, hi] = spec.dec;
    const step = spec.step || 0.1;
    const n = Math.round((hi - lo) / step);
    const v = lo + Math.floor(rand() * (n + 1)) * step;
    return Math.round(v * 1e6) / 1e6;
  }
  if (spec.choice) return spec.choice[Math.floor(rand() * spec.choice.length)];
  if (spec.expr) return evaluate(parse(spec.expr, { names }), env);
  throw new Error('Paramètre invalide : ' + JSON.stringify(spec));
}

/**
 * Tire les paramètres en respectant les exclusions et contraintes (200 essais au plus).
 * Renvoie un objet {nom: valeur} (les valeurs non numériques de « choice » sont conservées).
 */
export function drawParams(paramsSpec = {}, constraints = [], seed = 1) {
  const rand = rng(seed);
  const names = new Set(Object.keys(paramsSpec));
  for (let attempt = 0; attempt < 200; attempt++) {
    const env = {};
    let ok = true;
    for (const [name, spec] of Object.entries(paramsSpec)) {
      const v = drawOne(spec, rand, env, names);
      if (spec.not && spec.not.includes(v)) { ok = false; break; }
      env[name] = v;
    }
    if (!ok) continue;
    const numericEnv = Object.fromEntries(Object.entries(env).filter(([, v]) => typeof v === 'number'));
    if (constraints.every((c) => evaluate(parse(c, { names }), numericEnv))) return env;
  }
  throw new Error('Impossible de tirer des paramètres respectant les contraintes');
}

function applyFilter(value, filter) {
  if (typeof value !== 'number') return String(value);
  switch (filter) {
    case 'p': return value < 0 ? `(${formatNumber(value)})` : formatNumber(value);
    case 's': return value < 0 ? `− ${formatNumber(-value)}` : `+ ${formatNumber(value)}`;
    case 'c': return value === 1 ? '' : value === -1 ? '−' : formatNumber(value);
    case 'sc': return value === 1 ? '+ ' : value === -1 ? '− ' : value < 0 ? `− ${formatNumber(-value)}` : `+ ${formatNumber(value)}`;
    case 'abs': return formatNumber(Math.abs(value));
    default: {
      const m = filter && filter.match(/^d(\d)$/);
      if (m) return formatNumber(Number(value.toFixed(Number(m[1]))), Number(m[1]));
      return formatNumber(value);
    }
  }
}

/** Remplace {expr|filtre} dans un texte. Les accolades doublées {{ }} restent littérales. */
export function interpolate(text, env = {}) {
  if (typeof text !== 'string') return text;
  const names = new Set(Object.keys(env));
  const numericEnv = Object.fromEntries(Object.entries(env).filter(([, v]) => typeof v === 'number'));
  return text
    .replace(/\{\{/g, '\u0001').replace(/\}\}/g, '\u0002')
    .replace(/\{([^{}]+)\}/g, (whole, inner) => {
      const [exprSrc, filter] = inner.split('|').map((x) => x.trim());
      if (env[exprSrc] !== undefined && typeof env[exprSrc] !== 'number') return String(env[exprSrc]);
      try {
        return applyFilter(evaluate(parse(exprSrc, { names }), numericEnv), filter);
      } catch {
        return whole;
      }
    })
    .replace(/\u0001/g, '{').replace(/\u0002/g, '}');
}

/** Analyse une expression de réponse en remplaçant les paramètres par leurs valeurs (les inconnues restent libres). */
export function parseWithParams(src, env = {}) {
  const names = new Set(Object.keys(env));
  const numericEnv = Object.fromEntries(Object.entries(env).filter(([, v]) => typeof v === 'number'));
  return substitute(parse(String(src), { names }), numericEnv);
}

/** Interpole récursivement toutes les chaînes d'un objet (énoncés, indices, corrections…). */
export function interpolateDeep(value, env) {
  if (typeof value === 'string') return interpolate(value, env);
  if (Array.isArray(value)) return value.map((v) => interpolateDeep(v, env));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = interpolateDeep(v, env);
    return out;
  }
  return value;
}
