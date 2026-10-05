/**
 * Construire un triangle.
 *  - mode 'inegalite' : trois longueurs (curseurs 1 à 15). Construction au compas : [AB] = c, arc de centre A
 *    et de rayon b, arc de centre B et de rayon a. Les arcs se coupent (triangle), se touchent (triangle aplati)
 *    ou ne se rencontrent pas. On compare la somme des deux petits côtés au plus grand.
 *  - mode 'angles' : triangle dont on déplace les sommets (souris, doigt, clavier) ; mesures des angles et somme ;
 *    « Découper et recoller » met les trois angles bout à bout pour former un angle plat.
 * config : { mode: 'inegalite' | 'angles', sides?: [a, b, c] }  (a = BC, b = CA, c = AB)
 */
import { h } from '../ui/dom.js';
import { formatNumber } from '../core/expr.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const COLORS = { a: 'var(--maths)', b: 'var(--pc)', c: 'var(--ink)' };

function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) el.setAttribute(k, String(v));
  for (const c of children) if (c !== null && c !== undefined) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
}
function toNumber(v, fallback) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
  if (typeof v !== 'string') return fallback;
  const t = v.trim().replace(/[−–]/g, '-').replace(',', '.').replace(/\s+/g, '');
  return /^[+-]?(\d+\.?\d*|\.\d+)$/.test(t) ? Number(t) : fallback;
}
function readSides(cfg) {
  let raw = cfg.sides;
  if (typeof raw === 'string') raw = raw.split(/[;\s]+/);
  if (!Array.isArray(raw) || raw.length !== 3) return null;
  const v = raw.map((x) => toNumber(x, NaN));
  return v.every((x) => Number.isFinite(x) && x > 0) ? v : null;
}
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2);
const fmt = (v) => formatNumber(v, 2);
const withVar = (el, name, value) => { el.style.setProperty(name, value); return el; };

/* =====================================================================
   Mode inégalité triangulaire
   ===================================================================== */
const IW = 640; const IH = 300; const U = 13; const AX = 26 + 15 * U; const BASE_Y = 262;

function classify(a, b, c) {
  if (a + b > c && a + c > b && b + c > a) return 'ok';
  const m = Math.max(a, b, c);
  return Math.abs(a + b + c - 2 * m) < 1e-9 ? 'flat' : 'none';
}

function unitGrid() {
  let d = '';
  for (let x = AX % U; x <= IW; x += U) d += `M${x},0V${IH}`;
  for (let y = BASE_Y % U; y <= IH; y += U) d += `M0,${y}H${IW}`;
  return s('path', { d, class: 'tri-grid', 'aria-hidden': 'true' });
}

function upperArc(cx, r, cls) {
  return s('path', { d: `M${cx - r},${BASE_Y} A${r},${r} 0 0 1 ${cx + r},${BASE_Y}`, class: `tri-arc ${cls}` });
}

function sideLabel(P, Q, text, away, cls) {
  const mx = (P[0] + Q[0]) / 2; const my = (P[1] + Q[1]) / 2;
  let dx = mx - away[0]; let dy = my - away[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
  return s('text', { x: mx + dx * 16, y: my + dy * 16 + 5, 'text-anchor': 'middle', class: `tri-len ${cls}` }, text);
}

function drawInequality(svg, [a, b, c]) {
  const kind = classify(a, b, c);
  const A = [AX, BASE_Y]; const B = [AX + c * U, BASE_Y];
  svg.replaceChildren(unitGrid());
  svg.append(upperArc(A[0], b * U, 'tri-arc--b'), upperArc(B[0], a * U, 'tri-arc--a'));
  let C = null;
  if (kind !== 'none') {
    const x = (c * c + b * b - a * a) / (2 * c);
    C = [AX + x * U, BASE_Y - Math.sqrt(Math.max(0, b * b - x * x)) * U];
  }
  const g = s('g', { class: 'tri-shape' });
  if (kind === 'ok') {
    g.append(s('polygon', { points: `${A} ${B} ${C}`, class: 'tri-fill' }),
      s('line', { x1: C[0], y1: C[1], x2: A[0], y2: A[1], class: 'tri-seg tri-seg--b' }),
      s('line', { x1: C[0], y1: C[1], x2: B[0], y2: B[1], class: 'tri-seg tri-seg--a' }));
  } else if (kind === 'flat') {
    g.append(s('line', { x1: C[0], y1: BASE_Y - 6, x2: A[0], y2: BASE_Y - 6, class: 'tri-seg tri-seg--b' }),
      s('line', { x1: C[0], y1: BASE_Y + 6, x2: B[0], y2: BASE_Y + 6, class: 'tri-seg tri-seg--a' }));
  }
  g.append(s('line', { x1: A[0], y1: A[1], x2: B[0], y2: B[1], class: 'tri-seg tri-seg--c' }));
  const centre = kind === 'ok' ? [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3] : [(A[0] + B[0]) / 2, BASE_Y - 40];
  g.append(s('text', { x: (A[0] + B[0]) / 2, y: BASE_Y + 26, 'text-anchor': 'middle', class: 'tri-len tri-len--c' }, `AB = ${fmt(c)}`));
  if (kind === 'ok') g.append(sideLabel(B, C, `BC = ${fmt(a)}`, centre, 'tri-len--a'), sideLabel(A, C, `CA = ${fmt(b)}`, centre, 'tri-len--b'));
  for (const [P, name, dy] of [[A, 'A', 22], [B, 'B', 22]]) g.append(s('circle', { cx: P[0], cy: P[1], r: 4, class: 'tri-pt' }), s('text', { x: P[0] - 12, y: P[1] + dy, class: 'tri-name' }, name));
  if (C) g.append(s('circle', { cx: C[0], cy: C[1], r: 5, class: 'tri-pt tri-pt--c' }), s('text', { x: C[0] + 8, y: C[1] - 10, class: 'tri-name' }, 'C'));
  svg.append(g);
  return kind;
}

const STATUS_TEXT = {
  ok: 'Les deux arcs se coupent en C : le triangle ABC existe.',
  flat: 'Les deux arcs se touchent en un seul point, sur la droite (AB) : le « triangle » est aplati, A, B et C sont alignés.',
  none: 'Les deux arcs ne se rencontrent pas : impossible de placer le point C.',
};
const RESULT = { ok: 'oui', flat: 'aplati', none: 'non' };

function compareBlock([a, b, c]) {
  const sides = [{ n: 'AB', v: c }, { n: 'BC', v: a }, { n: 'CA', v: b }];
  const big = sides.reduce((m, x) => (x.v > m.v ? x : m), sides[0]);
  const [o1, o2] = sides.filter((x) => x !== big);
  const sum = o1.v + o2.v;
  const sign = Math.abs(sum - big.v) < 1e-9 ? '=' : sum > big.v ? '>' : '<';
  const words = { '>': 'plus grand que', '=': 'égal à', '<': 'plus petit que' }[sign];
  return {
    el: h('div', { class: 'tri-compare', role: 'group', 'aria-label': `${o1.n} + ${o2.n} = ${fmt(sum)}, ${words} ${big.n} = ${fmt(big.v)}` },
      h('span', { class: 'tri-plate', 'aria-hidden': 'true' }, h('small', {}, 'deux autres côtés'), `${o1.n} + ${o2.n} = ${fmt(o1.v)} + ${fmt(o2.v)} = ${fmt(sum)}`),
      h('span', { class: `tri-sign tri-sign--${sign === '>' ? 'gt' : sign === '=' ? 'eq' : 'lt'}`, 'aria-hidden': 'true' }, sign),
      h('span', { class: 'tri-plate', 'aria-hidden': 'true' }, h('small', {}, 'plus grand côté'), `${big.n} = ${fmt(big.v)}`)),
    sign,
    short: `${o1.n} + ${o2.n} = ${fmt(sum)} ${sign} ${big.n} = ${fmt(big.v)}`,
  };
}

function rangeInput(text, value, onInput) {
  const out = h('output', { class: 'tri-out' }, String(value));
  const input = h('input', { type: 'range', min: 1, max: 15, step: 1, value: String(value) });
  input.addEventListener('input', () => { out.textContent = input.value; onInput(Number(input.value)); });
  return { el: h('label', { class: 'tri-slider' }, h('span', { class: 'tri-slider-head' }, h('span', {}, text), out), input), input, out };
}

function mountInequality(root, cfg) {
  const init = (readSides(cfg) || [6, 4, 8]).map((v) => Math.max(1, Math.min(15, Math.round(v))));
  const L = { a: init[0], b: init[1], c: init[2] };
  let liveTimer = 0;
  const svg = s('svg', { viewBox: `0 0 ${IW} ${IH}`, class: 'lab-svg tri-svg', role: 'img' });
  const cmpHost = h('div', { class: 'tri-compare-host' });
  const status = h('p', { class: 'tri-status', 'aria-live': 'polite' });
  const rows = h('tbody');
  const table = h('table', { class: 'lab-table tri-table', hidden: true },
    h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'BC'), h('th', { scope: 'col' }, 'CA'), h('th', { scope: 'col' }, 'AB'), h('th', { scope: 'col' }, 'Comparaison'), h('th', { scope: 'col' }, 'Triangle ?'))),
    rows);
  const sliders = {
    a: withVar(rangeInput('BC = a', L.a, (v) => { L.a = v; update(); }).el, '--c', COLORS.a),
    b: withVar(rangeInput('CA = b', L.b, (v) => { L.b = v; update(); }).el, '--c', COLORS.b),
    c: withVar(rangeInput('AB = c', L.c, (v) => { L.c = v; update(); }).el, '--c', COLORS.c),
  };
  const noteBtn = h('button', { type: 'button', class: 'btn btn--small', onclick: note }, 'Noter cet essai');
  const clearBtn = h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => { rows.replaceChildren(); table.hidden = true; } }, 'Effacer le tableau');

  root.append(
    h('p', { class: 'muted small' }, 'On trace [AB], puis un arc de centre A et de rayon CA, et un arc de centre B et de rayon BC. Le point C doit être sur les deux arcs.'),
    h('div', { class: 'tri-stage' }, svg),
    h('div', { class: 'lab-grid' },
      h('div', {}, cmpHost, status, h('div', { class: 'tri-table-wrap' }, table)),
      h('div', { class: 'lab-controls' }, sliders.a, sliders.b, sliders.c, h('div', { class: 'btn-row' }, noteBtn, clearBtn))));

  let kind = 'ok';
  function update() {
    const sides = [L.a, L.b, L.c];
    kind = drawInequality(svg, sides);
    const cmp = compareBlock(sides);
    cmpHost.replaceChildren(cmp.el);
    const text = STATUS_TEXT[kind];
    svg.setAttribute('aria-label', `Construction au compas avec BC = ${L.a}, CA = ${L.b}, AB = ${L.c}. ${text}`);
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => { status.textContent = text; }, 250);
  }
  function note() {
    if (rows.children.length >= 12) rows.firstChild.remove();
    const cmp = compareBlock([L.a, L.b, L.c]);
    rows.append(h('tr', {}, h('td', {}, fmt(L.a)), h('td', {}, fmt(L.b)), h('td', {}, fmt(L.c)),
      h('td', {}, cmp.short), h('td', {}, RESULT[kind])));
    table.hidden = false;
  }

  update();
  clearTimeout(liveTimer);
  status.textContent = STATUS_TEXT[kind];
  return () => { clearTimeout(liveTimer); };
}

/* =====================================================================
   Mode angles
   ===================================================================== */
const AW = 640; const AH = 470; const BOX = { x0: 30, y0: 34, x1: 610, y1: 300 };
const SEP_Y = 330; const P0 = [320, 440];
const NAMES = ['A', 'B', 'C'];
const VCOL = ['var(--maths)', 'var(--pc)', 'var(--approfondissement)'];

const vsub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const vlen = (p) => Math.hypot(p[0], p[1]);
const normRad = (x) => { let r = x % (2 * Math.PI); if (r <= -Math.PI) r += 2 * Math.PI; if (r > Math.PI) r -= 2 * Math.PI; return r; };

/** Angle intérieur en chaque sommet : direction de départ et ouverture (radians, sens écran). */
function corners(V) {
  return V.map((P, i) => {
    const Q = V[(i + 1) % 3]; const R = V[(i + 2) % 3];
    const t1 = Math.atan2(Q[1] - P[1], Q[0] - P[0]); const t2 = Math.atan2(R[1] - P[1], R[0] - P[0]);
    const d = normRad(t2 - t1);
    return d >= 0 ? { start: t1, sweep: d } : { start: t2, sweep: -d };
  });
}

/** Arrondit au degré en gardant une somme de 180 (méthode du plus fort reste) : chaque valeur reste exacte au degré près. */
function roundDegrees(deg) {
  const fl = deg.map(Math.floor);
  const rest = 180 - fl.reduce((sum, v) => sum + v, 0);
  const order = deg.map((v, i) => [v - fl[i], i]).sort((p, q) => q[0] - p[0]);
  const out = fl.slice();
  for (let k = 0; k < rest && k < 3; k++) out[order[k][1]] += 1;
  return out;
}

function initialVertices(cfg) {
  const sides = readSides(cfg);
  if (!sides || classify(...sides) !== 'ok') return [[150, 262], [500, 244], [270, 80]];
  const [a, b, c] = sides;
  const x = (c * c + b * b - a * a) / (2 * c); const y = Math.sqrt(Math.max(0, b * b - x * x));
  const pts = [[0, 0], [c, 0], [x, y]];
  const xs = pts.map((p) => p[0]); const minX = Math.min(...xs); const w = Math.max(...xs) - minX;
  const k = Math.min((BOX.x1 - BOX.x0 - 60) / (w || 1), (BOX.y1 - BOX.y0 - 40) / (y || 1));
  const ox = (BOX.x0 + BOX.x1) / 2 - (w * k) / 2 - minX * k; const oy = (BOX.y0 + BOX.y1) / 2 + (y * k) / 2;
  return pts.map((p) => [ox + p[0] * k, oy - p[1] * k]);
}

function wedgePath(r, start, sweep) {
  const x1 = r * Math.cos(start); const y1 = r * Math.sin(start);
  const x2 = r * Math.cos(start + sweep); const y2 = r * Math.sin(start + sweep);
  return `M0,0 L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 0 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;
}

function mountAngles(root, cfg) {
  const st = { V: initialVertices(cfg), t: 0, cut: false, raf: 0, liveTimer: 0, drag: null };
  const svg = s('svg', { viewBox: `0 0 ${AW} ${AH}`, class: 'lab-svg tri-svg tri-svg--angles', role: 'group', 'aria-label': 'Triangle ABC aux sommets déplaçables' });
  const tri = s('polygon', { class: 'tri-fill tri-fill--angles' });
  const arcs = VCOL.map((col) => withVar(s('path', { class: 'tri-angle-arc' }), '--c', col));
  const labels = VCOL.map((col) => withVar(s('text', { class: 'tri-angle-val', 'text-anchor': 'middle' }), '--c', col));
  const wedgeLayer = s('g', { class: 'tri-wedges', 'aria-hidden': 'true' });
  const wedges = VCOL.map((col) => withVar(s('path', { class: 'tri-wedge' }), '--c', col));
  wedgeLayer.append(...wedges);
  const flat = s('g', { class: 'tri-flat', 'aria-hidden': 'true' },
    s('line', { x1: 40, y1: SEP_Y, x2: AW - 40, y2: SEP_Y, class: 'tri-sep' }),
    s('line', { x1: P0[0] - 130, y1: P0[1], x2: P0[0] + 130, y2: P0[1], class: 'tri-flat-line' }),
    s('text', { x: P0[0], y: P0[1] + 22, 'text-anchor': 'middle', class: 'tri-flat-txt' }, 'angle plat : 180°'));
  const flatLabels = VCOL.map((col) => withVar(s('text', { class: 'tri-angle-val', 'text-anchor': 'middle' }), '--c', col));
  flat.append(...flatLabels);
  const helpId = `tri-help-${Math.random().toString(36).slice(2, 8)}`;
  const handles = NAMES.map((name, i) => makeHandle(name, i));
  svg.append(tri, ...arcs, ...labels, flat, wedgeLayer, ...handles.map((x) => x.g));

  const readout = h('div', { class: 'lab-readout tri-readout' });
  const live = h('p', { class: 'sr-only', 'aria-live': 'polite' });
  const cutBtn = h('button', { type: 'button', class: 'btn btn--primary btn--small', 'aria-pressed': 'false', onclick: toggleCut }, 'Découper et recoller');
  const cutMsg = h('p', { class: 'tri-status', 'aria-live': 'polite' });
  root.append(
    h('p', { class: 'muted small', id: helpId }, 'Déplace les sommets à la souris ou au doigt. Au clavier : Tab pour choisir un sommet, flèches pour le déplacer (Maj + flèche : plus vite).'),
    h('div', { class: 'tri-stage' }, svg),
    h('div', { class: 'lab-grid' }, h('div', {}, readout, cutMsg, live), h('div', { class: 'lab-controls' }, cutBtn)));

  function makeHandle(name, i) {
    const g = withVar(s('g', { class: 'tri-vertex', tabindex: '0', role: 'button', 'aria-roledescription': 'sommet déplaçable', 'aria-describedby': helpId }), '--c', VCOL[i]);
    const hit = s('circle', { r: 22, class: 'tri-vertex-hit' });
    const dot = s('circle', { r: 8, class: 'tri-vertex-dot' });
    const txt = s('text', { class: 'tri-name', 'text-anchor': 'middle' }, name);
    g.append(hit, dot, txt);
    g.addEventListener('touchstart', (e) => { e.preventDefault(); }, { passive: false });
    g.addEventListener('pointerdown', (e) => {
      e.preventDefault(); g.focus();
      try { g.setPointerCapture(e.pointerId); } catch { /* capture indisponible : le glisser marche quand même */ }
      st.drag = { i, id: e.pointerId };
    });
    g.addEventListener('pointermove', (e) => {
      if (!st.drag || st.drag.id !== e.pointerId) return;
      const m = svg.getScreenCTM(); if (!m) return;
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      moveVertex(i, [p.x, p.y]);
    });
    const end = (e) => { if (st.drag && st.drag.id === e.pointerId) { st.drag = null; announceSoon(); } };
    g.addEventListener('pointerup', end); g.addEventListener('pointercancel', end);
    g.addEventListener('keydown', (e) => {
      const stepPx = e.shiftKey ? 25 : 5;
      const d = { ArrowLeft: [-stepPx, 0], ArrowRight: [stepPx, 0], ArrowUp: [0, -stepPx], ArrowDown: [0, stepPx] }[e.key];
      if (!d) return;
      e.preventDefault();
      moveVertex(i, [st.V[i][0] + d[0], st.V[i][1] + d[1]]);
      announceSoon();
    });
    return { g, hit, dot, txt };
  }

  function moveVertex(i, p) {
    const q = [Math.max(BOX.x0, Math.min(BOX.x1, p[0])), Math.max(BOX.y0, Math.min(BOX.y1, p[1]))];
    if (st.V.some((P, j) => j !== i && vlen(vsub(P, q)) < 30)) return;
    st.V = st.V.map((P, j) => (j === i ? q : P));
    if (st.cut || st.t > 0) setCut(false, true);
    render();
  }

  function measures() {
    const cs = corners(st.V);
    return { cs, deg: roundDegrees(cs.map((c) => (c.sweep * 180) / Math.PI)) };
  }

  function render() {
    const { cs, deg } = measures();
    const V = st.V;
    tri.setAttribute('points', V.map((P) => P.join(',')).join(' '));
    tri.classList.toggle('is-faded', st.t > 0);
    const cen = [(V[0][0] + V[1][0] + V[2][0]) / 3, (V[0][1] + V[1][1] + V[2][1]) / 3];
    V.forEach((P, i) => {
      const { start, sweep } = cs[i]; const r = 24;
      const p1 = [P[0] + r * Math.cos(start), P[1] + r * Math.sin(start)];
      const p2 = [P[0] + r * Math.cos(start + sweep), P[1] + r * Math.sin(start + sweep)];
      arcs[i].setAttribute('d', `M${p1[0]},${p1[1]} A${r},${r} 0 0 1 ${p2[0]},${p2[1]}`);
      const mid = start + sweep / 2;
      labels[i].setAttribute('x', P[0] + 46 * Math.cos(mid)); labels[i].setAttribute('y', P[1] + 46 * Math.sin(mid) + 5);
      labels[i].textContent = `${deg[i]}°`;
      const out = vsub(P, cen); const l = vlen(out) || 1;
      const hd = handles[i];
      hd.g.setAttribute('transform', `translate(${P[0]} ${P[1]})`);
      hd.txt.setAttribute('x', (out[0] / l) * 22); hd.txt.setAttribute('y', (out[1] / l) * 22 + 5);
      hd.g.setAttribute('aria-label', `Sommet ${NAMES[i]} : angle de ${deg[i]}°`);
    });
    readout.textContent = `A : ${deg[0]}°   B : ${deg[1]}°   C : ${deg[2]}°\nSomme : ${deg[0]}° + ${deg[1]}° + ${deg[2]}° = ${deg[0] + deg[1] + deg[2]}°`;
    renderWedges(cs, deg);
  }

  function renderWedges(cs, deg) {
    const minSide = Math.min(...st.V.map((P, i) => vlen(vsub(P, st.V[(i + 1) % 3]))));
    const r = Math.min(52, 0.42 * minSide);
    const e = ease(st.t);
    let acc = Math.PI;
    cs.forEach((c, i) => {
      const target = acc; acc += c.sweep;
      const rot = (normRad(target - c.start) * 180) / Math.PI;
      const P = st.V[i];
      const x = P[0] + (P0[0] - P[0]) * e; const y = P[1] + (P0[1] - P[1]) * e;
      wedges[i].setAttribute('d', wedgePath(r, c.start, c.sweep));
      wedges[i].setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(rot * e).toFixed(2)})`);
      const mid = target + c.sweep / 2;
      flatLabels[i].setAttribute('x', (P0[0] + (r + 18) * Math.cos(mid)).toFixed(1));
      flatLabels[i].setAttribute('y', (P0[1] + (r + 18) * Math.sin(mid) + 5).toFixed(1));
      flatLabels[i].textContent = `${deg[i]}°`;
    });
    wedgeLayer.style.display = st.t > 0 || st.cut ? '' : 'none';
    flat.style.display = st.t >= 1 ? '' : 'none';
  }

  function setCut(on, instant = false) {
    cancelAnimationFrame(st.raf);
    st.cut = on;
    cutBtn.setAttribute('aria-pressed', String(on));
    cutBtn.textContent = on ? 'Remettre les angles en place' : 'Découper et recoller';
    const target = on ? 1 : 0;
    const { deg } = measures();
    cutMsg.textContent = on ? `Les trois angles (${deg[0]}°, ${deg[1]}° et ${deg[2]}°) sont découpés et mis bout à bout : ils forment un angle plat.` : '';
    if (instant || reducedMotion()) { st.t = target; render(); return; }
    const from = st.t; const t0 = performance.now(); const dur = 1300 * Math.abs(target - from);
    const step = (now) => {
      const u = dur ? Math.min(1, (now - t0) / dur) : 1;
      st.t = from + (target - from) * u; render();
      if (u < 1) st.raf = requestAnimationFrame(step);
    };
    st.raf = requestAnimationFrame(step);
  }
  function toggleCut() { setCut(!st.cut); }

  function announceSoon() {
    clearTimeout(st.liveTimer);
    st.liveTimer = setTimeout(() => {
      const { deg } = measures();
      live.textContent = `Angles : A ${deg[0]}°, B ${deg[1]}°, C ${deg[2]}°. Somme : ${deg[0] + deg[1] + deg[2]}°.`;
    }, 450);
  }

  render();
  return () => { cancelAnimationFrame(st.raf); clearTimeout(st.liveTimer); st.drag = null; };
}

export function mount(container, config = {}) {
  const cfg = config || {};
  const root = h('div', { class: 'tri' });
  container.append(root);
  return cfg.mode === 'angles' ? mountAngles(root, cfg) : mountInequality(root, cfg);
}
