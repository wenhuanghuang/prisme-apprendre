/**
 * Saisie visuelle en SVG : droite graduée (placer des points). Le repère est dans graph-input.js.
 * Souris, doigt et clavier (flèches, Entrée) sont pris en charge.
 */
import { h } from './dom.js';
import { formatNumber } from '../core/expr.js';

const SVGNS = 'http://www.w3.org/2000/svg';
function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) el.setAttribute(k, String(v));
  for (const c of children) if (c) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
}

/* ------------------------------ Droite graduée ------------------------------ */

export function createNumberLine({ min = -5, max = 5, step = 0.5, points = [], interactive = true, markers = [] }) {
  const W = 640; const H = 130; const pad = 34; const axisY = 86;
  const xOf = (v) => pad + ((v - min) / (max - min)) * (W - 2 * pad);
  const vOf = (x) => min + ((x - pad) / (W - 2 * pad)) * (max - min);
  const snap = (v) => Math.max(min, Math.min(max, Math.round(v / step) * step));
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'nl-svg', role: 'group', 'aria-label': `Droite graduée de ${formatNumber(min)} à ${formatNumber(max)}` });
  svg.append(s('line', { x1: pad - 10, y1: axisY, x2: W - pad + 10, y2: axisY, class: 'nl-axis' }));
  svg.append(s('path', { d: `M${W - pad + 10},${axisY - 5} L${W - pad + 18},${axisY} L${W - pad + 10},${axisY + 5}`, class: 'nl-arrow' }));
  const nTicks = Math.round((max - min) / step);
  for (let i = 0; i <= nTicks; i++) {
    const v = min + i * step;
    const major = Math.abs(v - Math.round(v)) < 1e-9;
    svg.append(s('line', { x1: xOf(v), y1: axisY - (major ? 8 : 4), x2: xOf(v), y2: axisY + (major ? 8 : 4), class: major ? 'nl-tick nl-tick--major' : 'nl-tick' }));
    if (major) svg.append(s('text', { x: xOf(v), y: axisY + 26, class: `nl-label ${v === 0 ? 'nl-zero' : ''}`, 'text-anchor': 'middle' }, formatNumber(v)));
  }
  for (const m of markers) {
    svg.append(s('circle', { cx: xOf(m.value), cy: axisY, r: 5, class: 'nl-marker' }));
    if (m.label) svg.append(s('text', { x: xOf(m.value), y: axisY - 14, 'text-anchor': 'middle', class: 'nl-marker-label' }, m.label));
  }
  const state = Object.fromEntries(points.map((p) => [p, null]));
  const nodes = {};
  let locked = !interactive;
  const trayY = 24;
  points.forEach((label, i) => {
    const g = s('g', { class: 'nl-point', tabindex: interactive ? '0' : '-1', role: 'slider', 'aria-label': `Point ${label}`, 'aria-valuemin': min, 'aria-valuemax': max, 'aria-valuetext': 'non placé' });
    const circle = s('circle', { r: 11, class: 'nl-point-dot' });
    const text = s('text', { 'text-anchor': 'middle', dy: '4', class: 'nl-point-txt' }, label);
    const stem = s('line', { class: 'nl-stem' });
    g.append(stem, circle, text);
    svg.append(g);
    nodes[label] = { g, circle, text, stem, trayX: pad + 20 + i * 34 };
    const place = (v) => { if (locked) return; state[label] = v === null ? null : snap(v); draw(label); };
    g.addEventListener('keydown', (e) => {
      if (locked) return;
      const cur = state[label] ?? 0;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); place(state[label] === null ? 0 : cur + step); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); place(state[label] === null ? 0 : cur - step); }
      else if (e.key === 'PageUp') { e.preventDefault(); place(cur + 1); }
      else if (e.key === 'PageDown') { e.preventDefault(); place(cur - 1); }
      else if (e.key === 'Home') { e.preventDefault(); place(min); }
      else if (e.key === 'End') { e.preventDefault(); place(max); }
      else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); place(null); }
    });
    g.addEventListener('pointerdown', (e) => {
      if (locked) return;
      e.preventDefault(); g.focus(); g.setPointerCapture(e.pointerId);
      const move = (ev) => { const pt = toSvg(ev); place(vOf(pt.x)); };
      const up = () => { g.removeEventListener('pointermove', move); g.removeEventListener('pointerup', up); };
      g.addEventListener('pointermove', move); g.addEventListener('pointerup', up);
    });
  });
  function toSvg(ev) {
    const r = svg.getBoundingClientRect();
    return { x: ((ev.clientX - r.left) / r.width) * W, y: ((ev.clientY - r.top) / r.height) * H };
  }
  function draw(label) {
    const n = nodes[label]; const v = state[label];
    const x = v === null ? n.trayX : xOf(v); const y = v === null ? trayY : axisY - 30;
    n.circle.setAttribute('cx', x); n.circle.setAttribute('cy', y);
    n.text.setAttribute('x', x); n.text.setAttribute('y', y);
    n.stem.setAttribute('x1', x); n.stem.setAttribute('x2', x); n.stem.setAttribute('y1', y + 11); n.stem.setAttribute('y2', v === null ? y + 11 : axisY);
    n.g.classList.toggle('is-placed', v !== null);
    n.g.setAttribute('aria-valuetext', v === null ? 'non placé' : `graduation ${Math.round((v - min) / step)} sur ${nTicks}`);
    if (v !== null) n.g.setAttribute('aria-valuenow', v); else n.g.removeAttribute('aria-valuenow');
  }
  points.forEach(draw);
  const el = h('div', { class: 'nl' }, svg, interactive && points.length ? h('p', { class: 'muted small' }, 'Fais glisser chaque point sur la droite, ou sélectionne-le (Tab) puis utilise les flèches ← →.') : null);
  return {
    el,
    svg,
    positions: () => ({ ...state }),
    set(label, v) { state[label] = v; draw(label); },
    mark(details) { for (const d of details) { const n = nodes[d.label]; if (n) { n.g.classList.toggle('is-ok', d.ok); n.g.classList.toggle('is-ko', !d.ok); } } },
    lock(b) { locked = b; },
    focus() { const first = Object.values(nodes)[0]; if (first) first.g.focus(); },
    xOf,
  };
}
