/**
 * Repère où l'élève place des points (souris, doigt, clavier).
 * Graduations automatiques « agréables » (1, 2 ou 5 × 10^k, environ dix par axe) et placement fin
 * au dixième de graduation : on peut placer (2,9 ; 1) comme (85 ; 340). Les coordonnées s'affichent en direct.
 */
import { h } from './dom.js';
import { formatNumber } from '../core/expr.js';

const SVGNS = 'http://www.w3.org/2000/svg';
function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) el.setAttribute(k, String(v));
  for (const c of children) if (c !== null && c !== undefined) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
}

/** Pas « agréable » (1, 2 ou 5 × 10^k) pour environ `target` graduations. */
export function niceStep(range, target = 10) {
  const raw = range / target;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const m = raw / pow;
  const nice = m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10;
  return nice * pow;
}

const roundTo = (v, step) => Math.round(Math.round(v / step) * step * 1e9) / 1e9;

export function createGraphInput({ xRange = [-5, 5], yRange = [-5, 5], step, xStep, yStep, maxPoints = 12, readOnlyPoints = [], xLabel = '', yLabel = '' }) {
  const W = 460; const H = 420; const padL = 46; const padB = 34; const padT = 14; const padR = 14;
  const [x0, x1] = xRange; const [y0, y1] = yRange;
  const gx = xStep || step || niceStep(x1 - x0); const gy = yStep || step || niceStep(y1 - y0);
  const sx = gx / 10; const sy = gy / 10;
  const X = (x) => padL + ((x - x0) / (x1 - x0)) * (W - padL - padR);
  const Y = (y) => H - padB - ((y - y0) / (y1 - y0)) * (H - padB - padT);
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'graph-svg', tabindex: '0', role: 'application', 'aria-label': 'Repère : flèches pour déplacer le curseur (Maj + flèche : une graduation entière), Entrée pour placer ou retirer un point' });
  const xs = []; for (let v = Math.ceil(x0 / gx - 1e-9) * gx; v <= x1 + 1e-9; v += gx) xs.push(roundTo(v, gx));
  const ys = []; for (let v = Math.ceil(y0 / gy - 1e-9) * gy; v <= y1 + 1e-9; v += gy) ys.push(roundTo(v, gy));
  for (const v of xs) svg.append(s('line', { x1: X(v), y1: Y(y0), x2: X(v), y2: Y(y1), class: v === 0 ? 'g-axis' : 'g-grid' }));
  for (const v of ys) svg.append(s('line', { x1: X(x0), y1: Y(v), x2: X(x1), y2: Y(v), class: v === 0 ? 'g-axis' : 'g-grid' }));
  if (y0 > 0 || y1 < 0) svg.append(s('line', { x1: X(x0), y1: Y(y0), x2: X(x1), y2: Y(y0), class: 'g-axis' }));
  if (x0 > 0 || x1 < 0) svg.append(s('line', { x1: X(x0), y1: Y(y0), x2: X(x0), y2: Y(y1), class: 'g-axis' }));
  const axisY = y0 <= 0 && y1 >= 0 ? Y(0) : Y(y0);
  const axisX = x0 <= 0 && x1 >= 0 ? X(0) : X(x0);
  const origin = x0 <= 0 && x1 >= 0 && y0 <= 0 && y1 >= 0;
  for (const v of xs) if (!(origin && v === 0)) svg.append(s('text', { x: X(v), y: axisY + 16, 'text-anchor': 'middle', class: 'g-label' }, formatNumber(v)));
  for (const v of ys) if (!(origin && v === 0)) svg.append(s('text', { x: axisX - 6, y: Y(v) + 4, 'text-anchor': 'end', class: 'g-label' }, formatNumber(v)));
  if (origin) svg.append(s('text', { x: X(0) - 6, y: Y(0) + 16, 'text-anchor': 'end', class: 'g-label' }, '0'));
  if (xLabel) svg.append(s('text', { x: W - padR, y: axisY - 6, 'text-anchor': 'end', class: 'g-axis-label' }, xLabel));
  if (yLabel) svg.append(s('text', { x: axisX + 6, y: padT + 10, class: 'g-axis-label' }, yLabel));
  const layer = s('g'); svg.append(layer);
  const ghost = s('circle', { r: 0, class: 'g-ghost' }); svg.append(ghost);
  const cursor = s('circle', { r: 9, class: 'g-cursor' }); svg.append(cursor);
  let pts = []; let cur = [roundTo((x0 + x1) / 2, gx), roundTo((y0 + y1) / 2, gy)]; let locked = false;
  const readout = h('p', { class: 'g-readout small', 'aria-live': 'polite' });
  const list = h('p', { class: 'muted small' });
  const fmt = ([a, b]) => `(${formatNumber(a)} ; ${formatNumber(b)})`;

  const draw = () => {
    while (layer.firstChild) layer.removeChild(layer.firstChild);
    for (const [a, b] of readOnlyPoints) layer.append(s('circle', { cx: X(a), cy: Y(b), r: 5, class: 'g-fixed' }));
    for (const p of pts) {
      layer.append(s('circle', { cx: X(p[0]), cy: Y(p[1]), r: 6, class: 'g-point' }));
      layer.append(s('text', { x: X(p[0]) + 9, y: Y(p[1]) - 9, class: 'g-pt-label' }, fmt(p)));
    }
    cursor.setAttribute('cx', X(cur[0])); cursor.setAttribute('cy', Y(cur[1]));
    list.textContent = pts.length ? `Points placés : ${pts.map(fmt).join(', ')}` : 'Aucun point placé : clique à l’endroit voulu (un nouveau clic sur un point le retire).';
  };
  const toggle = (p) => {
    if (locked) return;
    const near = pts.find(([a, b]) => Math.abs(a - p[0]) <= sx * 1.5 && Math.abs(b - p[1]) <= sy * 1.5);
    if (near) pts = pts.filter((q) => q !== near);
    else if (pts.length < maxPoints) pts = [...pts, p];
    draw();
  };
  const fromEvent = (e) => {
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W; const py = ((e.clientY - r.top) / r.height) * H;
    const x = roundTo(x0 + ((px - padL) / (W - padL - padR)) * (x1 - x0), sx);
    const y = roundTo(y0 + ((H - padB - py) / (H - padB - padT)) * (y1 - y0), sy);
    return x < x0 - 1e-9 || x > x1 + 1e-9 || y < y0 - 1e-9 || y > y1 + 1e-9 ? null : [x, y];
  };
  svg.addEventListener('pointermove', (e) => {
    const p = fromEvent(e);
    if (!p) { ghost.setAttribute('r', 0); return; }
    ghost.setAttribute('r', 5); ghost.setAttribute('cx', X(p[0])); ghost.setAttribute('cy', Y(p[1]));
    readout.textContent = `Pointeur : ${fmt(p)}`;
  });
  svg.addEventListener('pointerleave', () => { ghost.setAttribute('r', 0); });
  svg.addEventListener('click', (e) => { const p = fromEvent(e); if (p) { cur = p; toggle(p); } });
  svg.addEventListener('keydown', (e) => {
    const k = e.shiftKey ? 10 : 1;
    const moves = { ArrowLeft: [-sx * k, 0], ArrowRight: [sx * k, 0], ArrowUp: [0, sy * k], ArrowDown: [0, -sy * k] };
    if (moves[e.key]) {
      e.preventDefault();
      cur = [roundTo(Math.max(x0, Math.min(x1, cur[0] + moves[e.key][0])), sx), roundTo(Math.max(y0, Math.min(y1, cur[1] + moves[e.key][1])), sy)];
      draw();
      readout.textContent = `Curseur : ${fmt(cur)}`;
    } else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(cur); }
  });
  draw();
  return {
    el: h('div', { class: 'graph' }, svg, readout, list),
    points: () => pts.slice(),
    lock(b) { locked = b; },
    focus() { svg.focus(); },
  };
}
