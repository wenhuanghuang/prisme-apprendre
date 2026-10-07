/**
 * Diagrammes des figures : barres, courbes, secteurs (camembert), frise chronologique, tableau.
 * Chaque diagramme occupe toute la figure (largeur W, hauteur H).
 */
import { num } from './check.js';
import { s, color, fmt } from './svg.js';

const PALETTE = ['var(--maths)', 'var(--francais)', 'var(--pc)', 'var(--hg)', 'var(--numerique)', 'var(--ok)', 'var(--ko)', 'var(--ink-3)'];
const pick = (d, i) => color(d.color, PALETTE[i % PALETTE.length]);

/** Pas « rond » (1, 2, 5 × 10^n) pour environ `target` graduations. */
export function niceStep(range, target = 5) {
  const raw = range / target;
  const p = 10 ** Math.floor(Math.log10(raw || 1));
  const m = raw / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
}

const yearLabel = (y) => (y < 0 ? `${fmt(-y)} av. J.-C.` : String(y));

function bars(it, W, H) {
  const g = s('g', { class: 'fig-chart' });
  const data = it.data.map((d) => ({ ...d, value: num(d.value) }));
  const max = num(it.yMax) || Math.max(...data.map((d) => d.value)) * 1.1 || 1;
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const showValues = it.values !== false;
  if (it.horizontal) {
    const left = Math.min(170, Math.max(...data.map((d) => String(d.label).length)) * 7 + 14);
    const right = 46; const t = 14; const b = 26;
    const bw = (H - t - b) / data.length;
    const X = (v) => left + (v / top) * (W - left - right);
    for (let v = 0; v <= top + 1e-9; v += step) {
      g.append(s('line', { x1: X(v), y1: t, x2: X(v), y2: H - b, class: 'fig-gridline' }));
      g.append(s('text', { x: X(v), y: H - b + 15, 'text-anchor': 'middle', class: 'fig-tick' }, fmt(v)));
    }
    data.forEach((d, i) => {
      const y = t + i * bw + bw * 0.18;
      g.append(s('rect', { x: left, y, width: Math.max(0, X(d.value) - left), height: bw * 0.64, rx: 3, fill: pick(d, it.data.length > 1 && !d.color ? 0 : i) }));
      g.append(s('text', { x: left - 8, y: y + bw * 0.32, 'text-anchor': 'end', 'dominant-baseline': 'middle', class: 'fig-tick fig-tick--cat' }, d.label));
      if (showValues) g.append(s('text', { x: X(d.value) + 5, y: y + bw * 0.32, 'dominant-baseline': 'middle', class: 'fig-value' }, fmt(d.value)));
    });
    if (it.unit) g.append(s('text', { x: W - right, y: H - 4, 'text-anchor': 'end', class: 'fig-axis-title' }, it.unit));
    return g;
  }
  const left = 46; const right = 12; const t = it.unit ? 24 : 14;
  const rotate = data.length > 6 || data.some((d) => String(d.label).length > 12);
  const b = rotate ? 70 : 32;
  const Y = (v) => H - b - (v / top) * (H - b - t);
  for (let v = 0; v <= top + 1e-9; v += step) {
    g.append(s('line', { x1: left, y1: Y(v), x2: W - right, y2: Y(v), class: 'fig-gridline' }));
    g.append(s('text', { x: left - 6, y: Y(v) + 4, 'text-anchor': 'end', class: 'fig-tick' }, fmt(v)));
  }
  const bw = (W - left - right) / data.length;
  data.forEach((d, i) => {
    const x = left + i * bw + bw * 0.16;
    g.append(s('rect', { x, y: Y(d.value), width: bw * 0.68, height: Math.max(0, Y(0) - Y(d.value)), rx: 3, fill: d.color ? color(d.color) : 'var(--maths)' }));
    const lx = x + bw * 0.34;
    g.append(rotate
      ? s('text', { x: lx, y: H - b + 12, 'text-anchor': 'end', transform: `rotate(-35 ${lx} ${H - b + 12})`, class: 'fig-tick fig-tick--cat' }, d.label)
      : s('text', { x: lx, y: H - b + 16, 'text-anchor': 'middle', class: 'fig-tick fig-tick--cat' }, d.label));
    if (showValues) g.append(s('text', { x: lx, y: Y(d.value) - 5, 'text-anchor': 'middle', class: 'fig-value' }, fmt(d.value)));
  });
  g.append(s('line', { x1: left, y1: Y(0), x2: W - right, y2: Y(0), class: 'fig-baseline' }));
  if (it.unit) g.append(s('text', { x: left - 40, y: 12, class: 'fig-axis-title' }, it.unit));
  return g;
}

function linechart(it, W, H) {
  const g = s('g', { class: 'fig-chart' });
  const all = it.series.flatMap((se) => se.points.map(([x, y]) => [num(x), num(y)]));
  let [x0, x1] = it.xRange ? it.xRange.map(num) : [Math.min(...all.map((p) => p[0])), Math.max(...all.map((p) => p[0]))];
  let [y0, y1] = it.yRange ? it.yRange.map(num) : [Math.min(0, ...all.map((p) => p[1])), Math.max(...all.map((p) => p[1]))];
  if (x1 === x0) x1 = x0 + 1;
  if (y1 === y0) y1 = y0 + 1;
  const ys = niceStep(y1 - y0); const xs = niceStep(x1 - x0, 6);
  if (!it.yRange) { y0 = Math.floor(y0 / ys) * ys; y1 = Math.ceil(y1 / ys) * ys; }
  const legend = it.series.length > 1;
  const left = 50; const right = 14; const t = it.yLabel ? 26 : 14; const b = legend ? 54 : 36;
  const X = (x) => left + (x - x0) / (x1 - x0) * (W - left - right);
  const Y = (y) => H - b - (y - y0) / (y1 - y0) * (H - b - t);
  for (let v = Math.ceil(y0 / ys) * ys; v <= y1 + 1e-9; v += ys) {
    g.append(s('line', { x1: left, y1: Y(v), x2: W - right, y2: Y(v), class: 'fig-gridline' }));
    g.append(s('text', { x: left - 6, y: Y(v) + 4, 'text-anchor': 'end', class: 'fig-tick' }, fmt(v)));
  }
  for (let v = Math.ceil(x0 / xs) * xs; v <= x1 + 1e-9; v += xs) {
    g.append(s('line', { x1: X(v), y1: Y(y0), x2: X(v), y2: Y(y0) + 4, class: 'fig-baseline' }));
    g.append(s('text', { x: X(v), y: Y(y0) + 17, 'text-anchor': 'middle', class: 'fig-tick' }, fmt(v)));
  }
  g.append(s('line', { x1: left, y1: Y(y0), x2: W - right, y2: Y(y0), class: 'fig-baseline' }));
  g.append(s('line', { x1: left, y1: Y(y0), x2: left, y2: t - 4, class: 'fig-baseline' }));
  it.series.forEach((se, i) => {
    const col = pick(se, i);
    const pts = se.points.map(([x, y]) => [X(num(x)), Y(num(y))]);
    g.append(s('polyline', { points: pts.map((p) => p.join(',')).join(' '), fill: 'none', stroke: col, 'stroke-width': 2.4, 'stroke-linejoin': 'round' }));
    for (const p of pts) g.append(s('circle', { cx: p[0], cy: p[1], r: 3.2, fill: col }));
    if (legend) {
      const lx = left + i * Math.min(170, (W - left) / it.series.length);
      g.append(s('rect', { x: lx, y: H - 16, width: 14, height: 4, fill: col }));
      g.append(s('text', { x: lx + 19, y: H - 11, class: 'fig-tick' }, se.label || `Série ${i + 1}`));
    }
  });
  if (it.yLabel) g.append(s('text', { x: left - 44, y: 12, class: 'fig-axis-title' }, it.yLabel));
  if (it.xLabel) g.append(s('text', { x: W - right, y: Y(y0) + (legend ? 32 : 31), 'text-anchor': 'end', class: 'fig-axis-title' }, it.xLabel));
  return g;
}

function pie(it, W, H) {
  const g = s('g', { class: 'fig-chart' });
  const data = it.data.map((d) => ({ ...d, value: num(d.value) }));
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const r = Math.min(H / 2 - 12, W * 0.26);
  const cx = r + 16; const cy = H / 2;
  let a = -Math.PI / 2;
  data.forEach((d, i) => {
    const frac = d.value / total;
    const b = a + frac * 2 * Math.PI;
    const col = pick(d, i);
    if (frac >= 0.9999) g.append(s('circle', { cx, cy, r, fill: col, stroke: 'var(--card)', 'stroke-width': 2 }));
    else if (frac > 0) {
      const p0 = [cx + r * Math.cos(a), cy + r * Math.sin(a)]; const p1 = [cx + r * Math.cos(b), cy + r * Math.sin(b)];
      g.append(s('path', { d: `M${cx},${cy} L${p0} A${r},${r} 0 ${frac > 0.5 ? 1 : 0} 1 ${p1} Z`, fill: col, stroke: 'var(--card)', 'stroke-width': 2 }));
    }
    const ly = 18 + i * Math.min(26, (H - 24) / data.length);
    const lx = cx + r + 26;
    g.append(s('rect', { x: lx, y: ly - 9, width: 12, height: 12, rx: 2, fill: col }));
    const pctTxt = it.percent ? ` — ${fmt(Math.round(frac * 1000) / 10)} %` : '';
    g.append(s('text', { x: lx + 18, y: ly + 1, class: 'fig-tick fig-tick--cat' }, `${d.label}${pctTxt}`));
    a = b;
  });
  return g;
}

function timeline(it, W, H, arrow) {
  const g = s('g', { class: 'fig-chart fig-timeline' });
  const from = num(it.from); const to = num(it.to);
  const left = 18; const right = 18;
  const X = (y) => left + (y - from) / (to - from) * (W - left - right);
  const axisY = Math.round(H * 0.5);
  const periods = it.periods || [];
  periods.forEach((p, i) => {
    const x0 = X(Math.max(from, num(p.from))); const x1 = X(Math.min(to, num(p.to)));
    const row = i % 2;
    const y = axisY - 30 - row * 22;
    const col = pick(p, i + 1);
    g.append(s('rect', { x: x0, y, width: Math.max(3, x1 - x0), height: 18, rx: 4, fill: col, 'fill-opacity': 0.22, stroke: col }));
    g.append(s('text', { x: (x0 + x1) / 2, y: y + 12.5, 'text-anchor': 'middle', class: 'fig-period' }, p.label));
  });
  g.append(s('line', { x1: left - 6, y1: axisY, x2: W - right + 8, y2: axisY, class: 'fig-axis-strong', 'marker-end': arrow }));
  const asked = num(it.step);
  const step = asked > 0 && (to - from) / asked <= 200 ? asked : niceStep(to - from, 7); // pas positif, 200 graduations au plus
  // graduations dessinées après les évènements : leurs traits ne barrent pas les années
  const ticksG = s('g');
  for (let y = Math.ceil(from / step) * step; y <= to + 1e-9; y += step) {
    ticksG.append(s('line', { x1: X(y), y1: axisY - 4, x2: X(y), y2: axisY + 4, class: 'fig-baseline' }));
    ticksG.append(s('text', { x: X(y), y: axisY + 17, 'text-anchor': 'middle', class: 'fig-tick fig-tick--halo' }, yearLabel(y)));
  }
  const events = [...(it.events || [])].sort((a, b) => num(a.year) - num(b.year));
  const lastX = [-Infinity, -Infinity, -Infinity];
  events.forEach((e) => {
    const x = X(num(e.year));
    const txt = `${yearLabel(num(e.year))} : ${e.label}`;
    const width = txt.length * 6.2;
    let row = lastX.findIndex((lx) => x - width / 2 > lx + 6);
    if (row < 0) row = lastX.indexOf(Math.min(...lastX));
    lastX[row] = x + width / 2;
    const ty = axisY + 36 + row * 17;
    g.append(s('circle', { cx: x, cy: axisY, r: 4.5, class: 'fig-event-dot' }));
    g.append(s('line', { x1: x, y1: axisY + 5, x2: x, y2: ty - 10, class: 'fig-event-line' }));
    const anchor = x - width / 2 < 2 ? 'start' : x + width / 2 > W - 2 ? 'end' : 'middle';
    g.append(s('text', { x, y: ty, 'text-anchor': anchor, class: 'fig-event' }, txt));
  });
  g.append(ticksG);
  return g;
}

function table(it) {
  const t = document.createElement('table');
  t.className = 'fig-table';
  if (it.head) {
    const tr = document.createElement('tr');
    for (const c of it.head) { const th = document.createElement('th'); th.textContent = String(c); tr.append(th); }
    const thead = document.createElement('thead'); thead.append(tr); t.append(thead);
  }
  const tb = document.createElement('tbody');
  for (const row of it.rows) {
    const tr = document.createElement('tr');
    for (const c of row) {
      const td = document.createElement('td');
      td.textContent = String(c);
      if (String(c).trim() === '?') td.className = 'is-blank';
      tr.append(td);
    }
    tb.append(tr);
  }
  t.append(tb);
  const wrap = document.createElement('div');
  wrap.className = 'fig-table-wrap';
  wrap.append(t);
  return wrap;
}

export function renderChart(it, W, H, arrow) {
  switch (it.type) {
    case 'bars': return bars(it, W, H);
    case 'linechart': return linechart(it, W, H);
    case 'pie': return pie(it, W, H);
    case 'timeline': return timeline(it, W, H, arrow);
    case 'table': return table(it);
    default: return s('g');
  }
}
