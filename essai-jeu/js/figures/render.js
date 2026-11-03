/**
 * Rendu SVG des figures décrites en JSON (docs/FIGURES.md) : géométrie (repère à échelle égale),
 * puis diagrammes et frises (charts.js). Couleurs = variables CSS : lisible en mode clair et sombre.
 */
import { num, CHART_TYPES } from './check.js';
import { renderChart } from './charts.js';
import { s, color, fmt } from './svg.js';

/** Repère : conversion des coordonnées de la figure en pixels. */
function makeFrame(fig, W, H) {
  if (!fig.frame) return { X: (x) => x, Y: (y) => y, scale: 1, math: false, box: [0, 0, W, H] };
  const [x0, x1] = fig.frame.x.map(num);
  const [y0, y1] = fig.frame.y.map(num);
  const pad = fig.frame.axes ? 28 : 22;
  const scale = Math.min((W - 2 * pad) / (x1 - x0), (H - 2 * pad) / (y1 - y0));
  const offX = (W - scale * (x1 - x0)) / 2;
  const offY = (H - scale * (y1 - y0)) / 2;
  return { X: (x) => offX + (x - x0) * scale, Y: (y) => H - offY - (y - y0) * scale, scale, math: true, x0, x1, y0, y1, box: [offX, offY, W - offX, H - offY] };
}

function gridAndAxes(svg, fig, F) {
  const fr = fig.frame;
  if (!fr) return;
  const step = fr.grid === true ? 1 : num(fr.grid);
  const tooDense = (F.x1 - F.x0) / step > 300 || (F.y1 - F.y0) / step > 300;
  if (step > 0 && !tooDense) {
    const g = s('g', { class: 'fig-grid' });
    for (let x = Math.ceil(F.x0 / step) * step; x <= F.x1 + 1e-9; x += step) g.append(s('line', { x1: F.X(x), y1: F.Y(F.y0), x2: F.X(x), y2: F.Y(F.y1) }));
    for (let y = Math.ceil(F.y0 / step) * step; y <= F.y1 + 1e-9; y += step) g.append(s('line', { x1: F.X(F.x0), y1: F.Y(y), x2: F.X(F.x1), y2: F.Y(y) }));
    svg.append(g);
  }
  if (!fr.axes) return;
  const g = s('g', { class: 'fig-axes' });
  const ay = Math.min(Math.max(0, F.y0), F.y1);
  const ax = Math.min(Math.max(0, F.x0), F.x1);
  g.append(s('line', { x1: F.X(F.x0), y1: F.Y(ay), x2: F.X(F.x1) + 8, y2: F.Y(ay), 'marker-end': arrowUrl() }));
  g.append(s('line', { x1: F.X(ax), y1: F.Y(F.y0), x2: F.X(ax), y2: F.Y(F.y1) - 8, 'marker-end': arrowUrl() }));
  const tick = step > 0 && !tooDense ? step : Math.max(1, (F.x1 - F.x0) / 20);
  for (let x = Math.ceil(F.x0 / tick) * tick; x <= F.x1 + 1e-9; x += tick) {
    if (Math.abs(x) < 1e-9) continue;
    g.append(s('line', { x1: F.X(x), y1: F.Y(ay) - 3, x2: F.X(x), y2: F.Y(ay) + 3 }));
    g.append(s('text', { x: F.X(x), y: F.Y(ay) + 15, 'text-anchor': 'middle', class: 'fig-tick' }, fmt(x)));
  }
  for (let y = Math.ceil(F.y0 / tick) * tick; y <= F.y1 + 1e-9; y += tick) {
    if (Math.abs(y) < 1e-9) continue;
    g.append(s('line', { x1: F.X(ax) - 3, y1: F.Y(y), x2: F.X(ax) + 3, y2: F.Y(y) }));
    g.append(s('text', { x: F.X(ax) - 6, y: F.Y(y) + 4, 'text-anchor': 'end', class: 'fig-tick' }, fmt(y)));
  }
  g.append(s('text', { x: F.X(ax) - 6, y: F.Y(ay) + 15, 'text-anchor': 'end', class: 'fig-tick' }, '0'));
  svg.append(g);
}

const POS = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0], ne: [0.75, -0.75], nw: [-0.75, -0.75], se: [0.75, 0.75], sw: [-0.75, 0.75] };

function labelAt(x, y, text, { dx = 0, dy = 0, anchor = 'middle', cls = 'fig-label', fill } = {}) {
  return s('text', { x: x + dx, y: y + dy, 'text-anchor': anchor, 'dominant-baseline': 'middle', class: cls, style: fill ? `fill:${fill}` : undefined }, text);
}

/** Petits traits de codage (longueurs égales) au milieu d'un segment. */
function ticks(p, q, n) {
  const g = s('g', { class: 'fig-marks' });
  const mx = (p[0] + q[0]) / 2; const my = (p[1] + q[1]) / 2;
  const len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
  const ux = (q[0] - p[0]) / len; const uy = (q[1] - p[1]) / len;
  for (let i = 0; i < n; i++) {
    const o = (i - (n - 1) / 2) * 4;
    const cx = mx + ux * o; const cy = my + uy * o;
    g.append(s('line', { x1: cx - uy * 6 + ux * 2, y1: cy + ux * 6 + uy * 2, x2: cx + uy * 6 - ux * 2, y2: cy - ux * 6 - uy * 2 }));
  }
  return g;
}

function drawGeometry(svg, fig, F, W, H) {
  const pts = new Map();
  for (const it of fig.items) if (it.type === 'point') pts.set(String(it.id), [num(it.x), num(it.y)]);
  const at = (v) => (Array.isArray(v) ? [num(v[0]), num(v[1])] : pts.get(String(v)) || [0, 0]);
  const scr = (v) => { const [x, y] = at(v); return [F.X(x), F.Y(y)]; };
  // centre de la figure : les étiquettes de segment se placent à l'extérieur
  const all = [...pts.values()].map(([x, y]) => [F.X(x), F.Y(y)]);
  const cx = all.length ? all.reduce((a, p) => a + p[0], 0) / all.length : W / 2;
  const cy = all.length ? all.reduce((a, p) => a + p[1], 0) / all.length : H / 2;
  const layers = { fill: s('g'), lines: s('g'), marks: s('g'), points: s('g'), labels: s('g') };
  const stroke = (it, extra = {}) => ({ stroke: color(it.color, 'var(--ink)'), 'stroke-dasharray': it.dashed ? '6 5' : undefined, fill: 'none', 'stroke-width': it.width || 1.8, ...extra });
  const segLabel = (p, q, text, col) => {
    const mx = (p[0] + q[0]) / 2; const my = (p[1] + q[1]) / 2;
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    let nx = -(q[1] - p[1]) / len; let ny = (q[0] - p[0]) / len;
    if ((mx - cx) * nx + (my - cy) * ny < 0) { nx = -nx; ny = -ny; }
    layers.labels.append(labelAt(mx + nx * 13, my + ny * 13, text, { fill: col }));
  };
  const extend = (p, q, both) => {
    const d = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    const k = (W + H) * 2 / d;
    const a = both ? [p[0] - (q[0] - p[0]) * k, p[1] - (q[1] - p[1]) * k] : p;
    return [a, [q[0] + (q[0] - p[0]) * k, q[1] + (q[1] - p[1]) * k]];
  };

  for (const it of fig.items) {
    const col = color(it.color, 'var(--ink)');
    switch (it.type) {
      case 'polygon': {
        const p = it.points.map(scr);
        const fillCol = it.fill ? color(it.fill, 'var(--maths)') : null;
        layers.fill.append(s('polygon', { points: p.map((x) => x.join(',')).join(' '), ...stroke(it), fill: fillCol || 'none', 'fill-opacity': fillCol ? 0.13 : undefined }));
        if (it.label) layers.labels.append(labelAt(p.reduce((a, x) => a + x[0], 0) / p.length, p.reduce((a, x) => a + x[1], 0) / p.length, it.label, { fill: col }));
        break;
      }
      case 'rect': {
        const x = num(it.x); const y = num(it.y); const w = num(it.w); const hh = num(it.h);
        const [sx, sy] = F.math ? [F.X(x), F.Y(y + hh)] : [x, y];
        const fillCol = it.fill ? color(it.fill, 'var(--maths)') : null;
        layers.fill.append(s('rect', { x: sx, y: sy, width: w * F.scale, height: hh * F.scale, ...stroke(it), fill: fillCol || 'none', 'fill-opacity': fillCol ? 0.15 : undefined }));
        if (it.label) layers.labels.append(labelAt(sx + w * F.scale / 2, sy + hh * F.scale / 2, it.label, { fill: col }));
        break;
      }
      case 'circle': {
        const c = scr(it.center);
        const r = it.through !== undefined ? Math.hypot(scr(it.through)[0] - c[0], scr(it.through)[1] - c[1]) : num(it.r) * F.scale;
        const fillCol = it.fill ? color(it.fill, 'var(--maths)') : null;
        layers.fill.append(s('circle', { cx: c[0], cy: c[1], r, ...stroke(it), fill: fillCol || 'none', 'fill-opacity': fillCol ? 0.12 : undefined }));
        break;
      }
      case 'arc': {
        const c = scr(it.center); const r = num(it.r) * F.scale;
        const a0 = num(it.start) * Math.PI / 180; const a1 = num(it.end) * Math.PI / 180;
        const p0 = [c[0] + r * Math.cos(a0), c[1] - r * Math.sin(a0)]; const p1 = [c[0] + r * Math.cos(a1), c[1] - r * Math.sin(a1)];
        const large = ((num(it.end) - num(it.start)) % 360 + 360) % 360 > 180 ? 1 : 0;
        layers.lines.append(s('path', { d: `M${p0} A${r},${r} 0 ${large} 0 ${p1}`, ...stroke(it, { 'stroke-width': 1.2 }) }));
        break;
      }
      case 'segment': case 'arrow': {
        const p = scr(it.from); const q = scr(it.to);
        const arrows = it.type === 'arrow' ? 'end' : it.arrows;
        layers.lines.append(s('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1], ...stroke(it, { 'stroke-width': it.type === 'arrow' ? 2.2 : it.width || 1.8 }), 'marker-end': arrows ? arrowUrl() : undefined, 'marker-start': arrows === 'both' ? arrowUrl(true) : undefined, style: `color:${col}` }));
        if (it.marks) layers.marks.append(ticks(p, q, Math.min(3, num(it.marks) || 1)));
        if (it.label) segLabel(p, q, it.label, col);
        break;
      }
      case 'line': case 'ray': {
        const p = scr(it.type === 'line' ? it.through[0] : it.from); const q = scr(it.type === 'line' ? it.through[1] : it.through);
        const [a, b] = extend(p, q, it.type === 'line');
        layers.lines.append(s('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], ...stroke(it, { 'stroke-width': it.width || 1.4 }) }));
        if (it.label) {
          // étiquette près du bord, sur la droite
          const d = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
          const t = [q[0] + (q[0] - p[0]) / d * 30, q[1] + (q[1] - p[1]) / d * 30];
          layers.labels.append(labelAt(t[0] - (q[1] - p[1]) / d * 12, t[1] + (q[0] - p[0]) / d * 12, it.label, { fill: col }));
        }
        break;
      }
      case 'angle': {
        const v = scr(it.vertex); const a = scr(it.from); const c = scr(it.to);
        const ua = [a[0] - v[0], a[1] - v[1]]; const uc = [c[0] - v[0], c[1] - v[1]];
        const la = Math.hypot(...ua) || 1; const lc = Math.hypot(...uc) || 1;
        const ea = [ua[0] / la, ua[1] / la]; const ec = [uc[0] / lc, uc[1] / lc];
        const r = it.r ? num(it.r) : 20;
        const angCol = color(it.color, 'var(--maths)');
        if (it.right) {
          const k = 11;
          layers.marks.append(s('path', { d: `M${v[0] + ea[0] * k},${v[1] + ea[1] * k} L${v[0] + (ea[0] + ec[0]) * k},${v[1] + (ea[1] + ec[1]) * k} L${v[0] + ec[0] * k},${v[1] + ec[1] * k}`, fill: 'none', stroke: angCol, 'stroke-width': 1.5 }));
        } else {
          const cross = ea[0] * ec[1] - ea[1] * ec[0];
          const p0 = [v[0] + ea[0] * r, v[1] + ea[1] * r]; const p1 = [v[0] + ec[0] * r, v[1] + ec[1] * r];
          layers.marks.append(s('path', { d: `M${v[0]},${v[1]} L${p0} A${r},${r} 0 0 ${cross > 0 ? 1 : 0} ${p1} Z`, fill: angCol, 'fill-opacity': 0.14, stroke: angCol, 'stroke-width': 1.4 }));
          const n = Math.min(3, num(it.marks) || 0);
          const bis = [ea[0] + ec[0], ea[1] + ec[1]]; const lb = Math.hypot(...bis) || 1;
          for (let i = 0; i < n; i++) {
            const m = [v[0] + bis[0] / lb * r, v[1] + bis[1] / lb * r];
            const rot = (i - (n - 1) / 2) * 0.18;
            const dir = [Math.cos(rot) * bis[0] / lb - Math.sin(rot) * bis[1] / lb, Math.sin(rot) * bis[0] / lb + Math.cos(rot) * bis[1] / lb];
            layers.marks.append(s('line', { x1: m[0] - dir[0] * 5, y1: m[1] - dir[1] * 5, x2: m[0] + dir[0] * 5, y2: m[1] + dir[1] * 5, stroke: angCol, 'stroke-width': 1.4 }));
          }
        }
        if (it.label) {
          const bis = [ea[0] + ec[0], ea[1] + ec[1]]; const lb = Math.hypot(...bis) || 1;
          layers.labels.append(labelAt(v[0] + bis[0] / lb * (r + 15), v[1] + bis[1] / lb * (r + 15), it.label, { fill: angCol, cls: 'fig-label fig-label--angle' }));
        }
        break;
      }
      case 'point': {
        if (it.hidden) break;
        const [x, y] = scr([num(it.x), num(it.y)]);
        if (it.style === 'rond') layers.points.append(s('circle', { cx: x, cy: y, r: 4, fill: col, stroke: 'var(--card)', 'stroke-width': 1.5 }));
        else layers.points.append(s('path', { d: `M${x - 4},${y - 4} L${x + 4},${y + 4} M${x - 4},${y + 4} L${x + 4},${y - 4}`, stroke: col, 'stroke-width': 1.8 }));
        const lab = it.label === undefined ? String(it.id) : it.label;
        if (lab) {
          const [dx, dy] = POS[it.pos] || POS.ne;
          layers.labels.append(labelAt(x + dx * 13, y + dy * 13, lab, { anchor: dx > 0.1 ? 'start' : dx < -0.1 ? 'end' : 'middle', cls: 'fig-label fig-label--point', fill: col }));
        }
        break;
      }
      case 'text': {
        const [x, y] = F.math ? [F.X(num(it.x)), F.Y(num(it.y))] : [num(it.x), num(it.y)];
        layers.labels.append(s('text', { x, y, 'text-anchor': it.anchor || 'middle', 'dominant-baseline': 'middle', class: `fig-text fig-text--${it.size || 'm'}${it.bold ? ' is-bold' : ''}`, style: it.color ? `fill:${col}` : undefined }, it.text));
        break;
      }
      default: break;
    }
  }
  svg.append(layers.fill, layers.lines, layers.marks, layers.points, layers.labels);
}

// identifiants SVG propres à chaque figure (deux figures d'une page ne doivent pas partager leurs flèches)
let figSeq = 0;
let ARROW = 'fig-arrow';
const arrowUrl = (start = false) => `url(#${ARROW}${start ? '-start' : ''})`;

function defs() {
  const d = s('defs');
  for (const [id, path, refX] of [[ARROW, 'M0,0 L10,5 L0,10 z', 9], [`${ARROW}-start`, 'M10,0 L0,5 L10,10 z', 1]]) {
    const m = s('marker', { id, viewBox: '0 0 10 10', refX, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto' });
    m.append(s('path', { d: path, fill: 'context-stroke' }));
    d.append(m);
  }
  return d;
}

/**
 * @param {object} fig figure (déjà interpolée pour un exercice)
 * @returns {HTMLElement} élément <figure>
 */
export function renderFigure(fig) {
  const wrap = document.createElement('figure');
  wrap.className = 'fig';
  try {
    ARROW = `fig-arrow-${++figSeq}`;
    const W = num(fig.w) || 400; const H = num(fig.h) || 260;
    const chart = fig.items.find((it) => CHART_TYPES.includes(it.type));
    if (chart && chart.type === 'table') {
      wrap.append(renderChart(chart, W, H));
    } else {
      const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fig-svg', role: 'img', 'aria-label': fig.alt || 'Figure', style: `max-width:${W}px` });
      svg.append(defs());
      if (chart) svg.append(renderChart(chart, W, H, arrowUrl()));
      else {
        const F = makeFrame(fig, W, H);
        const clipId = `fig-clip-${Math.random().toString(36).slice(2, 8)}`;
        const clip = s('clipPath', { id: clipId });
        clip.append(s('rect', { x: 0, y: 0, width: W, height: H }));
        svg.firstChild.append(clip);
        const g = s('g', { 'clip-path': `url(#${clipId})` });
        gridAndAxes(g, fig, F);
        drawGeometry(g, fig, F, W, H);
        svg.append(g);
      }
      wrap.append(svg);
    }
    if (fig.caption) { const c = document.createElement('figcaption'); c.textContent = fig.caption; wrap.append(c); }
  } catch (e) {
    wrap.textContent = `Figure : ${fig && fig.alt ? fig.alt : 'indisponible'}`;
  }
  return wrap;
}
