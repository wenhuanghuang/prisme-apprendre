/**
 * Expériences animées : calcul de l'état de la scène à un instant donné, puis rendu SVG.
 * L'état est une fonction pure de (étape, temps dans l'étape) : on peut mettre en pause,
 * revenir en arrière ou rejouer une étape sans rien « défaire ».
 */
import { PRIMS } from './prims.js';

export const DEFAULT_W = 800;
export const DEFAULT_H = 440;
const DEFAULT_TWEEN = 3;

/* ---------- interpolation ---------- */
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
function hexToRgb(c) {
  let s = c.slice(1);
  if (s.length === 3) s = s.split('').map((x) => x + x).join('');
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
}
function mixColor(a, b, t) {
  const A = hexToRgb(a); const B = hexToRgb(b);
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export function lerp(a, b, t) {
  if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * t;
  if (typeof a === 'string' && typeof b === 'string' && HEX.test(a) && HEX.test(b)) return mixColor(a, b, t);
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) return a.map((x, i) => lerp(x, b[i], t));
  return t >= 1 ? b : a; // valeurs non interpolables : bascule à la fin
}

/** Durée d'une étape (secondes) : la plus longue action, ou `duration`. */
export function stepDuration(step) {
  let d = Number(step.duration) || 0;
  for (const a of step.do || []) {
    const at = Number(a.at) || 0;
    const dur = a.to ? (a.dur !== undefined ? Number(a.dur) : (Number(step.duration) || DEFAULT_TWEEN) - at) : 0;
    d = Math.max(d, at + Math.max(0, dur));
  }
  return d;
}

/** Propriétés initiales de chaque objet (valeurs par défaut du type + celles de la scène). */
export function initialState(demo) {
  const st = {};
  (demo.items || []).forEach((it, i) => {
    const id = it.id || `_${i}`;
    const prim = PRIMS[it.type];
    st[id] = { ...(prim ? prim.defaults : {}), ...it, id };
  });
  return st;
}

function applyStep(st, step, t, full) {
  const out = st;
  for (const id of step.show || []) if (out[id]) out[id] = { ...out[id], hidden: false };
  for (const id of step.hide || []) if (out[id]) out[id] = { ...out[id], hidden: true };
  const dflt = Number(step.duration) || DEFAULT_TWEEN;
  for (const a of step.do || []) {
    const cur = out[a.id];
    if (!cur) continue;
    const at = Number(a.at) || 0;
    if (!full && t < at) continue;
    let next = { ...cur };
    if (a.set) next = { ...next, ...a.set };
    if (a.to) {
      const dur = a.dur !== undefined ? Number(a.dur) : Math.max(0.01, dflt - at);
      const k = full ? 1 : Math.min(1, Math.max(0, (t - at) / Math.max(0.01, dur)));
      const e = a.ease === 'lineaire' ? k : ease(k);
      for (const [key, target] of Object.entries(a.to)) {
        // départ de l'interpolation : valeur au début de l'action (mémorisée), sinon valeur courante
        const from = cur[key] !== undefined ? cur[key] : target;
        next[key] = lerp(from, target, e);
      }
    }
    out[a.id] = next;
  }
  return out;
}

/** État de la scène pendant l'étape `k`, au temps `t` (secondes depuis le début de l'étape). */
export function stateAt(demo, base, k, t) {
  let st = { ...base };
  for (let i = 0; i < k; i++) st = applyStep(st, demo.steps[i], 0, true);
  if (demo.steps[k]) st = applyStep(st, demo.steps[k], t, false);
  return st;
}

/** Image SVG (chaîne) de la scène ; `clock` anime l'ambiance (bulles, flamme, courant). */
export function renderScene(demo, st, clock, focus = [], uid = 'd') {
  const W = Number(demo.w) || DEFAULT_W;
  const H = Number(demo.h) || DEFAULT_H;
  const ctx = { clock, W, H, uid };
  let body = '';
  let halo = '';
  for (const id of Object.keys(st)) {
    const p = st[id];
    if (p.hidden) continue;
    const prim = PRIMS[p.type];
    if (!prim) continue;
    const o = Number(p.opacity);
    const op = p.opacity !== undefined && Number.isFinite(o) && o < 1 ? ` opacity="${Math.max(0, o)}"` : '';
    const key = `${uid}-${String(id).replace(/[^\w-]/g, '_')}`; // sert d'identifiant SVG (clipPath)
    // préfixe « dp- » pour le groupe : ne pas hériter des styles des pièces (ex. « d-zoom » = le verre de la loupe)
    try { body += `<g class="d-item dp-${p.type}"${op}>${prim.render(p, { ...ctx, key })}</g>`; } catch (e) {
      // objet mal décrit : on dessine le reste de la scène et on le signale (les tests le détectent)
      console.error(`Expérience : objet « ${id} » (${p.type}) impossible à dessiner : ${e.message}`);
    }
    if (focus.includes(id) && prim.box) {
      const [x, y, w, h] = prim.box(p);
      const pulse = 4 + Math.sin(clock * 4) * 3;
      halo += `<rect class="d-focus" x="${x - 8 - pulse}" y="${y - 8 - pulse}" width="${w + 16 + 2 * pulse}" height="${h + 16 + 2 * pulse}" rx="14"/>`;
    }
  }
  return { W, H, svg: `${halo}${body}` };
}

/** Une étape a-t-elle des animations d'ambiance (à redessiner en continu) ? */
export function isAnimated(st) {
  return Object.values(st).some((p) => !p.hidden && PRIMS[p.type] && PRIMS[p.type].animated && PRIMS[p.type].animated(p));
}
