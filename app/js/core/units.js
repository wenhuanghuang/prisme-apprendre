/**
 * Grandeurs physiques : lecture d'une valeur avec unité (« 2,5 kg », « 1,2 g/cm³ », « 36 km/h »),
 * conversion vers le Système international et comparaison de dimensions.
 * Dimensions : [longueur, masse, temps, intensité, température]
 */
import { tryParse, evaluate, variables } from './expr.js';

const DIM = {
  L: [1, 0, 0, 0, 0], M: [0, 1, 0, 0, 0], T: [0, 0, 1, 0, 0], I: [0, 0, 0, 1, 0], K: [0, 0, 0, 0, 1], N: [0, 0, 0, 0, 0],
};
const add = (a, b, k = 1) => a.map((x, i) => x + k * b[i]);
const scale = (a, k) => a.map((x) => x * k);
// dimensions dérivées
const FORCE = [1, 1, -2, 0, 0];
const ENERGY = [2, 1, -2, 0, 0];
const POWER = [2, 1, -3, 0, 0];
const VOLT = [2, 1, -3, -1, 0];
const OHM = [2, 1, -3, -2, 0];

/** symbole -> [facteur vers SI, dimension] */
const UNITS = {
  m: [1, DIM.L], km: [1000, DIM.L], hm: [100, DIM.L], dam: [10, DIM.L], dm: [0.1, DIM.L], cm: [0.01, DIM.L], mm: [0.001, DIM.L],
  'µm': [1e-6, DIM.L], um: [1e-6, DIM.L], nm: [1e-9, DIM.L], 'a.l.': [9.461e15, DIM.L], al: [9.461e15, DIM.L], ua: [1.496e11, DIM.L],
  g: [0.001, DIM.M], kg: [1, DIM.M], hg: [0.1, DIM.M], dag: [0.01, DIM.M], mg: [1e-6, DIM.M], t: [1000, DIM.M], cg: [1e-5, DIM.M], dg: [1e-4, DIM.M],
  s: [1, DIM.T], ms: [0.001, DIM.T], 'µs': [1e-6, DIM.T], min: [60, DIM.T], h: [3600, DIM.T], j: [86400, DIM.T], jours: [86400, DIM.T], an: [31557600, DIM.T], ans: [31557600, DIM.T], 'siècle': [3155760000, DIM.T], 'siècles': [3155760000, DIM.T],
  A: [1, DIM.I], mA: [0.001, DIM.I],
  K: [1, DIM.K], '°C': [1, [0, 0, 0, 0, 2]], // dimension fictive : °C et K ne se convertissent pas par simple facteur
  L: [0.001, [3, 0, 0, 0, 0]], l: [0.001, [3, 0, 0, 0, 0]], dL: [1e-4, [3, 0, 0, 0, 0]], cL: [1e-5, [3, 0, 0, 0, 0]], mL: [1e-6, [3, 0, 0, 0, 0]],
  ml: [1e-6, [3, 0, 0, 0, 0]], cl: [1e-5, [3, 0, 0, 0, 0]], dl: [1e-4, [3, 0, 0, 0, 0]], hL: [0.1, [3, 0, 0, 0, 0]],
  N: [1, FORCE], kN: [1000, FORCE],
  J: [1, ENERGY], kJ: [1000, ENERGY], MJ: [1e6, ENERGY], Wh: [3600, ENERGY], kWh: [3.6e6, ENERGY],
  W: [1, POWER], kW: [1000, POWER], MW: [1e6, POWER], mW: [0.001, POWER],
  V: [1, VOLT], mV: [0.001, VOLT], kV: [1000, VOLT],
  'Ω': [1, OHM], ohm: [1, OHM], 'kΩ': [1000, OHM], kohm: [1000, OHM], 'MΩ': [1e6, OHM],
  pouce: [0.0254, DIM.L], pouces: [0.0254, DIM.L], po: [0.0254, DIM.L], in: [0.0254, DIM.L],
  Hz: [1, [0, 0, -1, 0, 0]], kHz: [1000, [0, 0, -1, 0, 0]],
  // information : dimension fictive (comme °C) ; préfixes du SI (1 ko = 1 000 o) et binaires (1 Kio = 1 024 o)
  o: [1, [0, 0, 0, 0, 3]], ko: [1e3, [0, 0, 0, 0, 3]], Mo: [1e6, [0, 0, 0, 0, 3]], Go: [1e9, [0, 0, 0, 0, 3]], To: [1e12, [0, 0, 0, 0, 3]],
  Kio: [1024, [0, 0, 0, 0, 3]], Mio: [1024 ** 2, [0, 0, 0, 0, 3]], Gio: [1024 ** 3, [0, 0, 0, 0, 3]], bit: [0.125, [0, 0, 0, 0, 3]], bits: [0.125, [0, 0, 0, 0, 3]],
};

function normalizeUnit(u) {
  return u.trim()
    .replace(/a\.\s?l\.?/gi, 'al')
    .replace(/μ/g, 'µ')
    .replace(/\s+/g, '')
    .replace(/³/g, '^3').replace(/²/g, '^2')
    .replace(/[·.*×]/g, '·')
    .replace(/ohms?/gi, 'Ω');
}

const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

/** Symbole d'unité connu ; tolère une majuscule initiale (« Km » pour « km »). */
function lookupUnit(sym) {
  if (has(UNITS, sym)) return UNITS[sym];
  const lower = sym.charAt(0).toLowerCase() + sym.slice(1);
  if (has(UNITS, lower)) return UNITS[lower];
  return null;
}

function parseFactor(f) {
  // exposant explicite (^2, ^-1) ou chiffre final 2 ou 3 (« cm3 », « m2 ») — jamais 0
  const m = f.match(/^(.+?)(?:\^(-?[1-3])|([23]))?$/);
  if (!m) return null;
  const sym = m[1];
  const exp = m[2] ? Number(m[2]) : m[3] ? Number(m[3]) : 1;
  const def = lookupUnit(sym);
  if (!def) return null;
  return [def[0] ** exp, scale(def[1], exp)];
}

/** Analyse une unité composée : « g/cm^3 », « km/h », « N/kg », « m·s^-1 ». */
export function parseUnit(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === '') return { factor: 1, dim: DIM.N, text: '' };
  const u = normalizeUnit(String(raw));
  const [numPart, ...denParts] = u.split('/');
  let factor = 1; let dim = DIM.N;
  for (const f of numPart.split('·').filter(Boolean)) {
    const r = parseFactor(f);
    if (!r) return null;
    factor *= r[0]; dim = add(dim, r[1]);
  }
  for (const part of denParts) {
    for (const f of part.split('·').filter(Boolean)) {
      const r = parseFactor(f);
      if (!r) return null;
      factor /= r[0]; dim = add(dim, r[1], -1);
    }
  }
  return { factor, dim, text: String(raw).trim() };
}

export function sameDimension(a, b) {
  return a.dim.every((x, i) => Math.abs(x - b.dim[i]) < 1e-9);
}

/**
 * Sépare « 2,5 kg » en nombre + unité. Accepte « 2,5kg », « 2.5 kg », « 1,2 g/cm3 », « 3×10^8 m/s », « 3e8 m/s ».
 */
export function parseQuantity(text) {
  const s = String(text).trim()
    .replace(/\u2212/g, '-')
    .replace(/[\u00a0\u202f]/g, ' ');
  if (!s) return null;
  // durées écrites à la française : « 2 h 00 », « 1h30 », « 1 h 30 min 15 s », « 7 min 30 s »
  let d = s.match(/^(\d+)\s*h\s*(\d{1,2})\s*(?:min)?\s*(?:(\d{1,2})\s*s)?$/i);
  if (d) return { value: Number(d[1]) + Number(d[2]) / 60 + (d[3] ? Number(d[3]) / 3600 : 0), unitText: 'h', unit: parseUnit('h') };
  d = s.match(/^(\d+)\s*min\s*(\d{1,2})\s*s?$/i);
  if (d) return { value: Number(d[1]) + Number(d[2]) / 60, unitText: 'min', unit: parseUnit('min') };
  // sinon : la plus longue partie numérique (nombre, fraction, écriture scientifique), puis l'unité
  for (let i = s.length; i > 0; i--) {
    const numText = s.slice(0, i).trim();
    const unitText = s.slice(i).trim();
    if (!numText || !/^[-+(\d.,]/.test(numText)) continue;
    if (unitText && /^[\d(]/.test(unitText)) continue;
    // la lettre x employ\u00e9e pour \u00ab fois \u00bb entre deux nombres : \u00ab 456 x 0,001 \u00bb, \u00ab 3 x 10^8 \u00bb
    const r = tryParse(numText.replace(/(\d)\s*[xX]\s*(?=[\d(])/g, '$1\u00d7'));
    if (!r.ok || variables(r.node).size) continue;
    let value;
    try { value = evaluate(r.node); } catch { continue; }
    if (!Number.isFinite(value)) continue;
    const unit = parseUnit(unitText);
    if (unit) return { value, unitText, unit, node: r.node };
    return { value, unitText, unit: null, unknownUnit: true, node: r.node };
  }
  return null;
}

/** Convertit une valeur d'une unité vers une autre (null si dimensions incompatibles). */
export function convert(value, fromUnit, toUnit) {
  const a = parseUnit(fromUnit); const b = parseUnit(toUnit);
  if (!a || !b || !sameDimension(a, b)) return null;
  return (value * a.factor) / b.factor;
}

export const KNOWN_UNITS = Object.keys(UNITS);
