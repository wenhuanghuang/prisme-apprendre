/**
 * Carrés de Pythagore.
 *  - config { a, b } : triangle rectangle déformable (curseurs 1 à 12), carrés construits sur les trois côtés
 *    avec leurs aires, et démonstration par réarrangement (grand carré de côté a + b) en deux étapes animées.
 *  - config { sides: [a, b, c] } (réciproque) : triangle construit à partir de trois longueurs ; affiche c²,
 *    a² + b² et l'angle opposé au plus grand côté (loi des cosinus). L'activité ne conclut pas : l'élève conclut.
 */
import { h } from '../ui/dom.js';
import { formatNumber } from '../core/expr.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const W = 560; const H = 500; const M = 26;

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
const fmt = (v, d = 2) => formatNumber(v, d);
const isWhole = (v) => Math.abs(v - Math.round(v)) < 1e-9;
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2);
const uid = () => Math.random().toString(36).slice(2, 8);

/* ---------- Géométrie (repère mathématique, y vers le haut) ---------- */
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const mul = (p, k) => [p[0] * k, p[1] * k];
const dot = (p, q) => p[0] * q[0] + p[1] * q[1];
const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
const unit = (p) => { const l = Math.hypot(p[0], p[1]) || 1; return [p[0] / l, p[1] / l]; };
const centroid = (pts) => mul(pts.reduce(add, [0, 0]), 1 / pts.length);
const ptsAttr = (pts) => pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');

/** Carré construit sur [UV], du côté opposé au point Wp. */
function outwardSquare(U, V, Wp) {
  const d = sub(V, U); let n = [-d[1], d[0]];
  if (dot(n, sub(Wp, U)) > 0) n = mul(n, -1);
  return [U, V, add(V, n), add(U, n)];
}

/** Cadrage : met à l'échelle et centre les points dans le SVG (y inversé). */
function fitView(points, maxScale = Infinity) {
  const xs = points.map((p) => p[0]); const ys = points.map((p) => p[1]);
  const x0 = Math.min(...xs); const x1 = Math.max(...xs); const y0 = Math.min(...ys); const y1 = Math.max(...ys);
  const k = Math.min((W - 2 * M) / (x1 - x0 || 1), (H - 2 * M - 16) / (y1 - y0 || 1), maxScale);
  const ox = (W - (x1 - x0) * k) / 2 - x0 * k;
  const oy = (H - 16 - (y1 - y0) * k) / 2 + y1 * k;
  return { k, P: (p) => [ox + p[0] * k, oy - p[1] * k] };
}

/* ---------- Dessin ---------- */
function gridPath(pts, side) {
  const [U, V, V2, U2] = pts;
  let d = '';
  for (let i = 1; i < side - 1e-9; i++) {
    const t = i / side;
    const a1 = lerp(U, U2, t); const a2 = lerp(V, V2, t);
    const b1 = lerp(U, V, t); const b2 = lerp(U2, V2, t);
    d += `M${a1[0].toFixed(1)},${a1[1].toFixed(1)}L${a2[0].toFixed(1)},${a2[1].toFixed(1)}`;
    d += `M${b1[0].toFixed(1)},${b1[1].toFixed(1)}L${b2[0].toFixed(1)},${b2[1].toFixed(1)}`;
  }
  return s('path', { d, class: 'py-grid' });
}

function drawSquares(svg, view, squares, withGrid) {
  for (const sq of squares) {
    const pts = sq.pts.map(view.P);
    const g = s('g', { class: `py-sq ${sq.cls}` }, s('polygon', { points: ptsAttr(pts) }));
    if (withGrid && sq.side <= 30) g.append(gridPath(pts, sq.side));
    const sidePx = sq.side * view.k;
    const cen = centroid(pts);
    const fs = Math.max(11, Math.min(20, sidePx * 0.16));
    const txt = sidePx >= 76 ? `${sq.name}² = ${fmt(sq.area, 4)}` : fmt(sq.area, 2);
    g.append(s('text', { x: cen[0], y: cen[1] + fs * 0.35, 'text-anchor': 'middle', 'font-size': fs.toFixed(1), class: 'py-area' }, txt));
    svg.append(g);
  }
}

/**
 * Triangle et étiquettes de côtés : à l'intérieur (lettres courtes) ou, avec `outside`, juste au-delà du côté
 * (sur le bord du carré), décalées selon l'orientation du côté pour ne pas chevaucher le trait.
 */
function drawTriangle(svg, view, tri, labels, outside = false) {
  const pts = tri.map(view.P); const cen = centroid(pts);
  svg.append(s('polygon', { points: ptsAttr(pts), class: 'py-tri' }));
  for (const { U, V, text } of labels) {
    const m = mul(add(view.P(U), view.P(V)), 0.5);
    const toward = sub(cen, m); const dist = Math.hypot(toward[0], toward[1]);
    let p;
    if (outside) {
      const n = mul(unit(toward), -1);
      p = add(m, mul(n, 6 + Math.abs(n[0]) * text.length * 4.6 + Math.abs(n[1]) * 9));
    } else {
      p = add(m, mul(unit(toward), Math.min(17, dist * 0.6)));
    }
    svg.append(s('text', { x: p[0], y: p[1] + 5, 'text-anchor': 'middle', class: 'py-side' }, text));
  }
}

function drawRightAngle(svg, view, C, P, Q) {
  const c = view.P(C); const u = unit(sub(view.P(P), c)); const v = unit(sub(view.P(Q), c)); const k = 12;
  const p1 = add(c, mul(u, k)); const p2 = add(p1, mul(v, k)); const p3 = add(c, mul(v, k));
  svg.append(s('path', { d: `M${p1[0]},${p1[1]} L${p2[0]},${p2[1]} L${p3[0]},${p3[1]}`, class: 'py-right' }));
}

function drawAngle(svg, view, V, A, B, text) {
  const v = view.P(V); const u1 = unit(sub(view.P(A), v)); const u2 = unit(sub(view.P(B), v)); const r = 24;
  const p1 = add(v, mul(u1, r)); const p2 = add(v, mul(u2, r));
  const sweep = u1[0] * u2[1] - u1[1] * u2[0] > 0 ? 1 : 0;
  svg.append(s('path', { d: `M${p1[0]},${p1[1]} A${r},${r} 0 0 ${sweep} ${p2[0]},${p2[1]}`, class: 'py-angle' }));
  const lp = add(v, mul(unit(add(u1, u2)), 48));
  svg.append(s('text', { x: lp[0], y: lp[1] + 5, 'text-anchor': 'middle', class: 'py-angle-label' }, text));
}

function drawScale(svg, view) {
  const len = view.k; const y = H - 12;
  svg.append(s('g', { class: 'py-scale', 'aria-hidden': 'true' },
    s('path', { d: `M${M},${y - 5} L${M},${y} L${M + len},${y} L${M + len},${y - 5}` }),
    s('text', { x: M + len + 6, y: y + 1 }, '1 unité')));
}

function slider(text, value, onInput) {
  const out = h('output', { class: 'py-out' }, String(value));
  const input = h('input', { type: 'range', min: 1, max: 12, step: 1, value: String(value), 'aria-valuetext': `${value} unités` });
  input.addEventListener('input', () => {
    out.textContent = input.value;
    input.setAttribute('aria-valuetext', `${input.value} unités`);
    onInput(Number(input.value));
  });
  return h('label', { class: 'py-slider' }, h('span', { class: 'py-slider-head' }, h('span', {}, text), out), input);
}

/* ---------- Mode direct ---------- */
function mountDirect(root, cfg) {
  const clamp = (v) => Math.max(1, Math.min(12, Math.round(v)));
  let a = clamp(toNumber(cfg.a, 3)); let b = clamp(toNumber(cfg.b, 4));
  let liveTimer = 0;
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'lab-svg py-svg', role: 'img' });
  const readout = h('div', { class: 'lab-readout py-readout' });
  const live = h('p', { class: 'sr-only', 'aria-live': 'polite' });
  const gridBox = h('input', { type: 'checkbox', checked: true, onchange: () => draw() });
  const demo = createDemo(() => [a, b]);
  const demoBtn = h('button', { type: 'button', class: 'btn btn--small', 'aria-expanded': 'false', 'aria-controls': demo.id, onclick: toggleDemo }, 'Démonstration par réarrangement');

  root.append(
    h('p', { class: 'muted small' }, 'Triangle rectangle : a et b sont les côtés de l’angle droit, c est l’hypoténuse. Sur chaque côté, on construit un carré.'),
    h('div', { class: 'lab-grid' },
      h('div', { class: 'py-stage' }, svg),
      h('div', { class: 'lab-controls' },
        slider('a (côté de l’angle droit)', a, (v) => { a = v; draw(); }),
        slider('b (côté de l’angle droit)', b, (v) => { b = v; draw(); }),
        h('label', { class: 'check-inline' }, gridBox, 'Quadriller les carrés (carreaux de 1 unité)'),
        readout, live, demoBtn)),
    demo.el);

  function draw() {
    const C = [0, 0]; const P = [a, 0]; const Q = [0, b];
    const c = Math.hypot(a, b); const c2 = a * a + b * b;
    const squares = [
      { pts: outwardSquare(C, P, Q), cls: 'py-sq--a', name: 'a', side: a, area: a * a },
      { pts: outwardSquare(C, Q, P), cls: 'py-sq--b', name: 'b', side: b, area: b * b },
      { pts: outwardSquare(P, Q, C), cls: 'py-sq--c', name: 'c', side: c, area: c2 },
    ];
    const view = fitView([C, P, Q, ...squares.flatMap((q) => q.pts)], 34);
    svg.replaceChildren();
    drawSquares(svg, view, squares, gridBox.checked);
    drawTriangle(svg, view, [C, P, Q], [{ U: C, V: P, text: 'a' }, { U: C, V: Q, text: 'b' }, { U: P, V: Q, text: 'c' }]);
    drawRightAngle(svg, view, C, P, Q);
    drawScale(svg, view);
    const cTxt = isWhole(c) ? `c = ${fmt(c)}` : `c ≈ ${fmt(c)}`;
    readout.textContent = `a = ${a}   b = ${b}   ${cTxt}\na² + b² = ${a * a} + ${b * b} = ${c2}\nc² = ${c2}`;
    svg.setAttribute('aria-label', `Triangle rectangle de côtés a = ${a} et b = ${b}, hypoténuse ${cTxt}. Aires des carrés : ${a * a}, ${b * b} et ${c2}.`);
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => { live.textContent = `Aires : a² = ${a * a}, b² = ${b * b}, c² = ${c2}.`; }, 400);
    demo.refresh();
  }
  function toggleDemo() {
    const open = demo.el.hidden;
    demo.el.hidden = !open;
    demoBtn.setAttribute('aria-expanded', String(open));
    if (open) demo.start();
    else demo.stop();
  }

  draw();
  return () => { clearTimeout(liveTimer); demo.stop(); };
}

/* ---------- Démonstration par réarrangement ---------- */
/**
 * Grand carré de côté a + b (repère écran, y vers le bas). Les 4 triangles passent de la disposition 1
 * (autour du carré c²) à la disposition 2 (deux rectangles a × b, il reste a² et b²) par de simples translations.
 */
function demoLayout(a, b) {
  const z = a + b;
  return {
    z,
    triangles: [
      { pts: [[0, 0], [a, 0], [0, b]], move: [0, a] },
      { pts: [[z, 0], [a, 0], [z, a]], move: [0, 0] },
      { pts: [[z, z], [z, a], [b, z]], move: [-b, 0] },
      { pts: [[0, z], [b, z], [0, b]], move: [a, -b] },
    ],
    inner: [[a, 0], [z, a], [b, z], [0, b]],
    sqA: [[0, 0], [a, 0], [a, a], [0, a]],
    sqB: [[a, a], [z, a], [z, z], [a, z]],
  };
}

function createDemo(getAB) {
  const id = `py-demo-${uid()}`;
  const DS = 360; const O = 34; const SIDE = DS - 2 * O;
  const st = { t: 0, target: 0, raf: 0 };
  const svg = s('svg', { viewBox: `0 0 ${DS} ${DS}`, class: 'lab-svg py-demo-svg', role: 'img' });
  const stepText = h('p', { class: 'py-demo-text', 'aria-live': 'polite' });
  const concl = h('p', { class: 'py-demo-concl', hidden: true });
  const b1 = h('button', { type: 'button', class: 'btn btn--small', 'aria-pressed': 'true', onclick: () => go(0) }, 'Étape 1');
  const b2 = h('button', { type: 'button', class: 'btn btn--small', 'aria-pressed': 'false', onclick: () => go(1) }, 'Étape 2 : déplacer les triangles');
  const el = h('section', { id, class: 'py-demo', hidden: true, 'aria-label': 'Démonstration par réarrangement' },
    h('div', { class: 'py-demo-grid' },
      h('div', { class: 'py-demo-fig' }, svg),
      h('div', { class: 'py-demo-side' }, stepText, h('div', { class: 'btn-row' }, b1, b2), concl)));

  function draw() {
    const [a, b] = getAB(); const L = demoLayout(a, b); const k = SIDE / L.z; const t = ease(st.t);
    const P = (p) => [O + p[0] * k, O + p[1] * k];
    svg.replaceChildren(s('rect', { x: O, y: O, width: SIDE, height: SIDE, class: 'py-demo-big' }));
    const region = (pts, cls, name, op) => {
      const g = s('g', { class: cls, opacity: op.toFixed(3) }, s('polygon', { points: ptsAttr(pts.map(P)) }));
      const c = P(centroid(pts));
      g.append(s('text', { x: c[0], y: c[1] + 6, 'text-anchor': 'middle', class: 'py-demo-label' }, name));
      svg.append(g);
    };
    region(L.inner, 'py-sq py-sq--c', 'c²', 1 - t);
    region(L.sqA, 'py-sq py-sq--a', 'a²', t);
    region(L.sqB, 'py-sq py-sq--b', 'b²', t);
    L.triangles.forEach((tr, i) => {
      const pts = tr.pts.map((p) => P(add(p, mul(tr.move, t))));
      const c = centroid(pts);
      svg.append(s('g', { class: 'py-demo-tri' }, s('polygon', { points: ptsAttr(pts) }),
        s('text', { x: c[0], y: c[1] + 5, 'text-anchor': 'middle' }, String(i + 1))));
    });
    const ya = O - 10; const xa = O + a * k;
    svg.append(s('g', { class: 'py-demo-edge', 'aria-hidden': 'true' },
      s('path', { d: `M${O},${ya} L${O},${ya - 6} M${xa},${ya + 4} L${xa},${ya - 6} M${O + SIDE},${ya} L${O + SIDE},${ya - 6} M${O},${ya - 3} L${O + SIDE},${ya - 3}` }),
      s('text', { x: O + (a * k) / 2, y: ya - 9, 'text-anchor': 'middle' }, 'a'),
      s('text', { x: xa + (b * k) / 2, y: ya - 9, 'text-anchor': 'middle' }, 'b')));
    svg.setAttribute('aria-label', st.target === 0
      ? 'Grand carré de côté a + b : quatre triangles autour d’un carré de côté c.'
      : 'Grand carré de côté a + b : quatre triangles groupés en deux rectangles, il reste un carré de côté a et un carré de côté b.');
  }
  function describe() {
    const [a, b] = getAB();
    stepText.textContent = st.target === 0
      ? 'Étape 1 — Dans un grand carré de côté a + b, on place 4 triangles rectangles identiques au nôtre. La partie non recouverte est un carré de côté c : son aire est c².'
      : 'Étape 2 — On fait glisser les mêmes 4 triangles (sans les tourner) pour former deux rectangles. La partie non recouverte est formée de deux carrés : a² + b².';
    concl.hidden = st.target === 0;
    concl.textContent = `Même grand carré, mêmes 4 triangles : la partie non recouverte a la même aire dans les deux cas. Donc c² = a² + b². Ici : a² + b² = ${a * a} + ${b * b} = ${a * a + b * b}.`;
    b1.setAttribute('aria-pressed', String(st.target === 0));
    b2.setAttribute('aria-pressed', String(st.target === 1));
  }
  function go(target) {
    cancelAnimationFrame(st.raf);
    st.target = target; describe();
    if (reducedMotion()) { st.t = target; draw(); return; }
    const from = st.t; const dur = 1100 * Math.abs(target - from); const t0 = performance.now();
    if (!dur) { draw(); return; }
    const step = (now) => {
      const u = Math.min(1, (now - t0) / dur);
      st.t = from + (target - from) * u; draw();
      if (u < 1) st.raf = requestAnimationFrame(step);
    };
    st.raf = requestAnimationFrame(step);
  }
  return {
    el, id,
    start() { st.t = 0; st.target = 0; describe(); draw(); },
    stop() { cancelAnimationFrame(st.raf); },
    refresh() { if (!el.hidden) { describe(); draw(); } },
  };
}

/* ---------- Mode réciproque ---------- */
function reciprocalGeometry(lengths) {
  const [p, q, r] = [...lengths].sort((x, y) => x - y);
  const base = { a: p, b: q, c: r };
  if (p + q <= r + 1e-9) return { ...base, ok: false, flat: Math.abs(p + q - r) < 1e-9 };
  const A = [0, 0]; const B = [r, 0];
  const x = (r * r + q * q - p * p) / (2 * r);
  const C = [x, Math.sqrt(Math.max(0, q * q - x * x))];
  const cos = (p * p + q * q - r * r) / (2 * p * q);
  const angle = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
  return { ...base, ok: true, A, B, C, angle };
}

function mountReciprocal(root, sides) {
  const valid = (arr) => arr.length === 3 && arr.every((v) => Number.isFinite(v) && v > 0);
  let lengths = valid(sides) ? sides : [6, 8, 10];
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'lab-svg py-svg', role: 'img' });
  const readout = h('div', { class: 'lab-readout py-readout', 'aria-live': 'polite' });
  const msg = h('p', { class: 'py-msg small', 'aria-live': 'polite' });
  const inputs = lengths.map((v, i) => h('input', {
    type: 'number', min: '0.1', step: '0.1', value: String(v), inputmode: 'decimal', class: 'field-input py-len',
    'aria-label': `Longueur ${i + 1}`,
  }));
  const form = h('form', { class: 'py-lengths', onsubmit: (e) => { e.preventDefault(); rebuild(); } },
    h('p', { class: 'py-title' }, 'Trois longueurs'),
    h('div', { class: 'py-len-row' }, inputs),
    h('button', { type: 'submit', class: 'btn btn--small' }, 'Construire le triangle'));

  root.append(
    h('p', { class: 'muted small' }, 'Le triangle est construit à partir de trois longueurs. On note c la plus grande, a et b les deux autres. À toi de conclure.'),
    h('div', { class: 'lab-grid' },
      h('div', { class: 'py-stage' }, svg),
      h('div', { class: 'lab-controls' }, form, readout, msg)));

  function rebuild() {
    const vals = inputs.map((inp) => toNumber(inp.value, NaN));
    if (!valid(vals)) { msg.textContent = 'Chaque longueur doit être un nombre strictement positif.'; return; }
    lengths = vals; msg.textContent = ''; draw();
  }
  function draw() {
    const g = reciprocalGeometry(lengths);
    const sq = (v) => fmt(v * v, 4);
    readout.textContent = `a = ${fmt(g.a)}   b = ${fmt(g.b)}   c = ${fmt(g.c)}\nc² = ${sq(g.c)}\na² + b² = ${sq(g.a)} + ${sq(g.b)} = ${fmt(g.a * g.a + g.b * g.b, 4)}`;
    svg.replaceChildren();
    if (!g.ok) {
      const sum = `${fmt(g.a)} + ${fmt(g.b)} = ${fmt(g.a + g.b)}`;
      msg.textContent = g.flat
        ? `Pas de vrai triangle : le plus grand côté (${fmt(g.c)}) est égal à la somme des deux autres (${sum}), les trois sommets seraient alignés.`
        : `Pas de triangle : le plus grand côté (${fmt(g.c)}) est plus long que la somme des deux autres (${sum}).`;
      svg.setAttribute('aria-label', 'Aucun triangle ne peut être construit avec ces longueurs.');
      return;
    }
    const { A, B, C } = g;
    const squares = [
      { pts: outwardSquare(B, C, A), cls: 'py-sq--a', name: 'a', side: g.a, area: g.a * g.a },
      { pts: outwardSquare(A, C, B), cls: 'py-sq--b', name: 'b', side: g.b, area: g.b * g.b },
      { pts: outwardSquare(A, B, C), cls: 'py-sq--c', name: 'c', side: g.c, area: g.c * g.c },
    ];
    const view = fitView([A, B, C, ...squares.flatMap((q) => q.pts)]);
    drawSquares(svg, view, squares, false);
    drawTriangle(svg, view, [A, B, C], [
      { U: B, V: C, text: `a = ${fmt(g.a)}` }, { U: A, V: C, text: `b = ${fmt(g.b)}` }, { U: A, V: B, text: `c = ${fmt(g.c)}` }], true);
    const angleTxt = `${(Math.round(g.angle * 10) / 10).toFixed(1).replace('.', ',')}°`;
    drawAngle(svg, view, C, A, B, angleTxt);
    readout.textContent += `\nangle opposé à c : ${angleTxt}`;
    svg.setAttribute('aria-label', `Triangle de côtés ${fmt(g.a)}, ${fmt(g.b)} et ${fmt(g.c)}, avec les carrés construits sur ses côtés. Angle opposé au plus grand côté : ${angleTxt}.`);
  }

  draw();
  return () => {};
}

export function mount(container, config = {}) {
  const cfg = config || {};
  const root = h('div', { class: 'py' });
  container.append(root);
  if (Array.isArray(cfg.sides)) return mountReciprocal(root, cfg.sides.map((v) => toNumber(v, NaN)));
  if (typeof cfg.sides === 'string') return mountReciprocal(root, cfg.sides.split(/[;\s]+/).map((v) => toNumber(v, NaN)));
  return mountDirect(root, cfg);
}
