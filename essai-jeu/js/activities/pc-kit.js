/**
 * Outils communs aux laboratoires de physique-chimie (ohm, masse volumique, mouvement, poids, changement d'état) :
 * création d'éléments SVG, arrondis « d'appareil », bruit de mesure, afficheurs LCD, tableau de mesures
 * effaçable ligne par ligne, graphique à axes gradués et droite passant par l'origine.
 * Aucune donnée saisie n'est injectée en HTML : tout passe par textContent (h() / s()).
 */
import { h } from '../ui/dom.js';
import { formatNumber } from '../core/expr.js';

const SVGNS = 'http://www.w3.org/2000/svg';
let uid = 0;

export function nextId(prefix) {
  uid += 1;
  return `${prefix}-${uid}`;
}

/** Équivalent de h() pour le SVG. */
export function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, String(v));
  }
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

/* ---------- Nombres ---------- */

/** Lit un nombre de config (accepte « 2,5 » et les chaînes issues des modèles d'exercice). */
export function num(v, def) {
  const n = Number(typeof v === 'string' ? v.replace(',', '.').trim() : v);
  return v !== '' && v !== null && v !== undefined && Number.isFinite(n) ? n : def;
}

export function bool(v) {
  return v === true || v === 'true' || v === 1 || v === '1';
}

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/** Saisie d'élève : « 12,5 » ou « 12.5 » → 12.5 ; sinon NaN. */
export function parseReading(txt) {
  const t = String(txt ?? '').trim().replace(/\s/g, '').replace(',', '.').replace('−', '-');
  if (!/^-?\d+(\.\d+)?$|^-?\.\d+$/.test(t)) return NaN;
  return Number(t);
}

/** Nombre au format français avec exactement d décimales (afficheurs d'appareils). */
export function fixed(v, d) {
  const dd = Math.max(0, d);
  const r = Math.round(v * 10 ** dd) / 10 ** dd;
  const txt = formatNumber(Object.is(r, -0) ? 0 : r, dd);
  if (dd === 0) return txt;
  const [i, dec = ''] = txt.split(',');
  return `${i},${dec.padEnd(dd, '0')}`;
}

/** Nombre de décimales pour n chiffres significatifs. */
export function decimalsFor(v, n) {
  if (!v) return n - 1;
  return Math.max(0, n - 1 - Math.floor(Math.log10(Math.abs(v))));
}

/** n chiffres significatifs, zéros utiles conservés (« 0,220 »). */
export function fmtSig(v, n = 3) {
  if (!Number.isFinite(v)) return '—';
  if (v === 0) return '0';
  const d = decimalsFor(v, n);
  // l'arrondi peut faire passer à la puissance de 10 suivante (9,996 → 10,0)
  const r = Math.round(v * 10 ** d) / 10 ** d;
  return fixed(r, decimalsFor(r, n));
}

/** Bruit gaussien borné (±2,5 σ). */
export function jitter(sigma) {
  if (!(sigma > 0)) return 0;
  let u = 0;
  while (!u) u = Math.random();
  const g = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
  return clamp(g, -2.5, 2.5) * sigma;
}

export function reducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function niceStep(range, target = 5) {
  if (!(range > 0)) return 1;
  const raw = range / target;
  const p = 10 ** Math.floor(Math.log10(raw));
  const m = raw / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
}

/** Coefficient directeur de la droite passant par l'origine au plus près (moindres carrés). */
export function slopeThroughOrigin(points) {
  let sxy = 0; let sxx = 0;
  for (const p of points) { sxy += p.x * p.y; sxx += p.x * p.x; }
  return sxx > 0 ? sxy / sxx : null;
}

/* ---------- Éléments d'interface ---------- */

/** Afficheur à cristaux liquides d'un appareil. */
export function createLcd({ name, unit = '', extra = null, cls = '' }) {
  const val = h('span', { class: 'pck-lcd-val' }, '0');
  const un = h('span', { class: 'pck-lcd-unit' }, unit);
  const screen = h('span', { class: 'pck-lcd-screen' }, val, un);
  const el = h('div', { class: `pck-lcd ${cls}`, role: 'group', 'aria-label': name },
    h('span', { class: 'pck-lcd-name' }, name), screen, extra);
  return {
    el,
    set(text, unitText = unit, { alert = false } = {}) {
      val.textContent = text;
      un.textContent = unitText;
      el.classList.toggle('is-alert', alert);
    },
  };
}

/** Zone de message pour les lecteurs d'écran et les avertissements. */
export function createMessage() {
  const el = h('p', { class: 'pck-msg small', role: 'status', 'aria-live': 'polite' });
  return {
    el,
    set(text, kind = '') {
      el.textContent = text || '';
      el.dataset.kind = kind;
    },
  };
}

/** Groupe de boutons radio présenté comme un sélecteur d'appareil (calibre, vitesse…). */
export function createChoice({ legend, name, options, value, onChange }) {
  const fs = h('fieldset', { class: 'pck-choice' }, h('legend', {}, legend));
  const row = h('div', { class: 'pck-choice-row' });
  for (const o of options) {
    const input = h('input', { type: 'radio', name, value: o.value, checked: o.value === value, onchange: () => onChange(o.value) });
    row.append(h('label', { class: 'pck-choice-opt' }, input, h('span', {}, o.label)));
  }
  fs.append(row);
  return fs;
}

/**
 * Tableau de mesures : chaque ligne s'efface individuellement.
 * columns : [{ label, value: (row) => texte }]
 */
export function createMeasureTable({ caption, columns, onChange, empty = 'Aucune mesure pour l’instant.' }) {
  let rows = [];
  let seq = 0;
  const tbody = h('tbody');
  const table = h('table', { class: 'lab-table pck-table' },
    h('caption', { class: 'sr-only' }, caption),
    h('thead', {}, h('tr', {},
      h('th', { scope: 'col', class: 'pck-col-n' }, 'n°'),
      columns.map((c) => h('th', { scope: 'col' }, c.label)),
      h('th', { scope: 'col', class: 'pck-col-del' }, h('span', { class: 'sr-only' }, 'Effacer')))),
    tbody);
  const scroller = h('div', { class: 'pck-table-scroll', tabindex: '-1' }, table);
  const clearAll = h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => set([], -1) }, 'Tout effacer');
  const el = h('div', { class: 'pck-table-wrap' }, scroller, h('div', { class: 'btn-row pck-table-tools' }, clearAll));

  function render(focusIndex) {
    tbody.replaceChildren();
    if (!rows.length) {
      tbody.append(h('tr', { class: 'pck-empty' }, h('td', { colspan: String(columns.length + 2) }, empty)));
    }
    rows.forEach((r, i) => {
      const del = h('button', {
        type: 'button', class: 'btn btn--icon pck-del', 'aria-label': `Effacer la mesure n° ${i + 1}`, title: 'Effacer cette ligne',
        onclick: () => set(rows.filter((x) => x._id !== r._id), i),
      }, '×');
      tbody.append(h('tr', {},
        h('td', { class: 'pck-col-n' }, String(i + 1)),
        columns.map((c) => h('td', {}, c.value(r))),
        h('td', { class: 'pck-col-del' }, del)));
    });
    clearAll.disabled = rows.length === 0;
    if (focusIndex !== undefined) {
      const dels = tbody.querySelectorAll('.pck-del');
      const target = dels[Math.min(focusIndex, dels.length - 1)];
      if (target) target.focus(); else scroller.focus();
    }
    scroller.scrollTop = focusIndex === undefined ? scroller.scrollHeight : scroller.scrollTop;
  }

  function set(next, focusIndex) {
    rows = next;
    render(focusIndex);
    if (onChange) onChange(rows);
  }

  render();
  return {
    el,
    add(row) {
      seq += 1;
      set([...rows, { ...row, _id: seq }]);
      return rows.length;
    },
    rows: () => rows,
    clear: () => set([]),
  };
}

const SERIES_COUNT = 6;

/**
 * Graphique de type « papier millimétré » : axes gradués, points en croix, droites et liaisons facultatives.
 * x / y : { name, unit, lo, hi, fixed } (lo/hi : étendue par défaut, fixed : ne pas adapter aux données).
 */
export function createPlot({ title, x, y }) {
  const W = 460; const H = 320; const ml = 58; const mr = 20; const mt = 30; const mb = 48;
  const clipId = nextId('pck-clip');
  const svg = s('svg', { class: 'pck-plot', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': title });
  const legend = h('ul', { class: 'pck-legend', hidden: true });
  const el = h('figure', { class: 'pck-plot-fig' }, svg, legend);
  let state = { points: [], lines: [], join: false };

  function axisRange(values, ax) {
    let lo = ax.lo; let hi = ax.hi;
    if (!ax.fixed && values.length) {
      const dMax = Math.max(...values); const dMin = Math.min(...values);
      lo = Math.min(ax.lo, dMin);
      hi = dMax > lo ? lo + (dMax - lo) * 1.1 : ax.hi;
    }
    const step = niceStep(hi - lo, 5);
    return { lo: Math.floor(lo / step + 1e-9) * step, hi: Math.ceil(hi / step - 1e-9) * step, step };
  }

  function draw() {
    svg.replaceChildren();
    const pts = state.points;
    const X = axisRange(pts.map((p) => p.x), x);
    const Y = axisRange(pts.map((p) => p.y), y);
    const pw = W - ml - mr; const ph = H - mt - mb;
    const px = (v) => ml + ((v - X.lo) / (X.hi - X.lo)) * pw;
    const py = (v) => H - mb - ((v - Y.lo) / (Y.hi - Y.lo)) * ph;

    svg.append(s('defs', {}, s('clipPath', { id: clipId }, s('rect', { x: ml, y: mt, width: pw, height: ph }))));
    svg.append(s('rect', { x: ml, y: mt, width: pw, height: ph, class: 'pck-plot-paper' }));
    const grid = s('g', { 'aria-hidden': 'true' });
    const nx = Math.round((X.hi - X.lo) / X.step) * 5;
    for (let k = 0; k <= nx; k += 1) {
      const xx = px(X.lo + (k * X.step) / 5);
      grid.append(s('line', { x1: xx, x2: xx, y1: mt, y2: H - mb, class: k % 5 ? 'pck-plot-minor' : 'pck-plot-major' }));
    }
    const ny = Math.round((Y.hi - Y.lo) / Y.step) * 5;
    for (let k = 0; k <= ny; k += 1) {
      const yy = py(Y.lo + (k * Y.step) / 5);
      grid.append(s('line', { x1: ml, x2: W - mr, y1: yy, y2: yy, class: k % 5 ? 'pck-plot-minor' : 'pck-plot-major' }));
    }
    svg.append(grid);

    // Axes (passent par 0 quand 0 est dans l'étendue) et flèches
    const ax0 = px(clamp(0, X.lo, X.hi)); const ay0 = py(clamp(0, Y.lo, Y.hi));
    svg.append(s('line', { x1: ml, x2: W - mr + 10, y1: ay0, y2: ay0, class: 'pck-plot-axis' }));
    svg.append(s('path', { d: `M ${W - mr + 12} ${ay0} l -8 -4 v 8 z`, class: 'pck-plot-arrow' }));
    svg.append(s('line', { x1: ax0, x2: ax0, y1: H - mb, y2: mt - 12, class: 'pck-plot-axis' }));
    svg.append(s('path', { d: `M ${ax0} ${mt - 14} l -4 8 h 8 z`, class: 'pck-plot-arrow' }));

    const labels = s('g', { class: 'pck-plot-labels', 'aria-hidden': 'true' });
    const nxt = Math.round((X.hi - X.lo) / X.step);
    for (let k = 0; k <= nxt; k += 1) {
      const v = X.lo + k * X.step;
      labels.append(s('text', { x: px(v), y: H - mb + 16, 'text-anchor': 'middle' }, formatNumber(v, 6)));
    }
    const nyt = Math.round((Y.hi - Y.lo) / Y.step);
    for (let k = 0; k <= nyt; k += 1) {
      const v = Y.lo + k * Y.step;
      labels.append(s('text', { x: ml - 7, y: py(v) + 4, 'text-anchor': 'end' }, formatNumber(v, 6)));
    }
    labels.append(s('text', { x: W - mr, y: H - 8, 'text-anchor': 'end', class: 'pck-plot-title' }, `${x.name} (${x.unit})`));
    labels.append(s('text', { x: ml + 8, y: mt - 14, 'text-anchor': 'start', class: 'pck-plot-title' }, `${y.name} (${y.unit})`));
    svg.append(labels);

    const plotArea = s('g', { 'clip-path': `url(#${clipId})` });
    for (const ln of state.lines) {
      if (!Number.isFinite(ln.slope)) continue;
      plotArea.append(s('line', {
        x1: px(0), y1: py(0), x2: px(X.hi), y2: py(ln.slope * X.hi),
        class: `pck-plot-line pck-s${(ln.series || 0) % SERIES_COUNT}`,
      }));
    }
    if (state.join) {
      const bySeries = groupBy(pts);
      for (const [k, list] of bySeries) {
        const sorted = [...list].sort((a, b) => a.x - b.x);
        if (sorted.length < 2) continue;
        plotArea.append(s('polyline', {
          points: sorted.map((p) => `${px(p.x)},${py(p.y)}`).join(' '),
          class: `pck-plot-join pck-s${k % SERIES_COUNT}`,
        }));
      }
    }
    for (const p of pts) {
      const cx = px(p.x); const cy = py(p.y); const r = 4.5;
      plotArea.append(s('path', {
        d: `M ${cx - r} ${cy} H ${cx + r} M ${cx} ${cy - r} V ${cy + r}`,
        class: `pck-plot-pt pck-s${(p.series || 0) % SERIES_COUNT}`,
      }, s('title', {}, `${x.name} = ${formatNumber(p.x, 4)} ${x.unit} ; ${y.name} = ${formatNumber(p.y, 4)} ${y.unit}`)));
    }
    svg.append(plotArea);
    svg.setAttribute('aria-label', `${title} — ${pts.length} point${pts.length > 1 ? 's' : ''} placé${pts.length > 1 ? 's' : ''}`);

    const names = [...new Map(pts.filter((p) => p.seriesName).map((p) => [p.series || 0, p.seriesName])).entries()];
    legend.replaceChildren(...names.map(([k, n]) => h('li', { class: `pck-s${k % SERIES_COUNT}` }, h('i', { 'aria-hidden': 'true' }), n)));
    legend.hidden = names.length < 2;
  }

  draw();
  return {
    el,
    update(partial) {
      state = { ...state, ...partial };
      draw();
    },
  };
}

function groupBy(points) {
  const m = new Map();
  for (const p of points) {
    const k = p.series || 0;
    m.set(k, [...(m.get(k) || []), p]);
  }
  return m;
}

/**
 * Commandes « droite passant par l'origine au plus près » + « coefficient directeur » (affiché à la demande).
 * extra(a) : texte complémentaire facultatif (ex. conversion d'unités).
 */
export function createOriginFit({ unit, onChange, extra = null, minPoints = 2, lineLabel = 'Tracer la droite passant par l’origine au plus près' }) {
  let showLine = false; let showCoef = false; let points = [];
  const lineBtn = h('button', { type: 'button', class: 'btn btn--ghost btn--small', 'aria-pressed': 'false', onclick: () => { showLine = !showLine; if (!showLine) showCoef = false; refresh(); onChange(); } }, lineLabel);
  const coefBtn = h('button', { type: 'button', class: 'btn btn--ghost btn--small', 'aria-pressed': 'false', disabled: true, onclick: () => { showCoef = !showCoef; refresh(); } }, 'Afficher le coefficient directeur');
  const out = h('div', { class: 'pck-fit-out small', 'aria-live': 'polite' });
  const el = h('div', { class: 'pck-fit' }, h('div', { class: 'btn-row' }, lineBtn, coefBtn), out);

  function fits() {
    const groups = groupBy(points.filter((p) => p.x !== 0 || p.y !== 0));
    return [...groups.entries()]
      .filter(([, list]) => list.length >= minPoints)
      .map(([series, list]) => ({ series, name: list[0].seriesName || '', slope: slopeThroughOrigin(list) }))
      .filter((f) => Number.isFinite(f.slope));
  }

  function refresh() {
    const f = fits();
    lineBtn.setAttribute('aria-pressed', String(showLine));
    lineBtn.textContent = showLine ? 'Masquer la droite' : lineLabel;
    coefBtn.disabled = !showLine || f.length === 0;
    coefBtn.setAttribute('aria-pressed', String(showCoef));
    coefBtn.textContent = showCoef ? 'Masquer le coefficient directeur' : 'Afficher le coefficient directeur';
    out.replaceChildren();
    if (showLine && f.length === 0) {
      out.append(h('p', {}, minPoints > 1
        ? 'Il faut au moins deux mesures (en dehors de l’origine) pour tracer une droite.'
        : 'Il faut au moins une mesure (en dehors de l’origine) pour tracer une droite.'));
    } else if (showLine && showCoef) {
      for (const fi of f) {
        const lead = fi.name ? `${fi.name} : ` : '';
        out.append(h('p', {}, `${lead}coefficient directeur ≈ ${fmtSig(fi.slope, 3)} ${unit}${extra ? extra(fi.slope) : ''}`));
      }
    }
  }

  refresh();
  return {
    el,
    setPoints(pts) { points = pts; refresh(); },
    lines: () => (showLine ? fits().map((f) => ({ slope: f.slope, series: f.series })) : []),
  };
}

/** Boucle d'animation annulable (requestAnimationFrame). */
export function createLoop(step) {
  let raf = 0; let last = 0;
  const tick = (now) => {
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    const keep = step(dt, now);
    raf = keep === false ? 0 : requestAnimationFrame(tick);
    if (!raf) last = 0;
  };
  return {
    start() { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } },
    stop() { if (raf) cancelAnimationFrame(raf); raf = 0; last = 0; },
    get running() { return raf !== 0; },
  };
}

/**
 * Loupe sur une échelle verticale graduée (lecture d'éprouvette, de dynamomètre…).
 * kind : 'meniscus' (liquide et ménisque) | 'needle' (index) ; minor/major/label : pas des graduations.
 * downward : graduations croissantes vers le bas (dynamomètre), comme sur l'appareil.
 */
export function createScaleLoupe({ title, minor, major, label, span, kind = 'needle', decimals = 0, downward = false }) {
  const W = 150; const H = 150; const R = 72;
  const svg = s('svg', { class: `pck-loupe pck-loupe--${kind}`, viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': title });
  const el = h('figure', { class: 'pck-loupe-fig' }, svg, h('figcaption', { class: 'small muted' }, 'Vue rapprochée'));
  const clipId = nextId('pck-loupe');

  function update(value) {
    svg.replaceChildren();
    const pxPer = (2 * R) / span;
    const yOf = (v) => H / 2 + (downward ? 1 : -1) * (v - value) * pxPer;
    svg.append(s('defs', {}, s('clipPath', { id: clipId }, s('circle', { cx: W / 2, cy: H / 2, r: R }))));
    const g = s('g', { 'clip-path': `url(#${clipId})` });
    g.append(s('rect', { x: 0, y: 0, width: W, height: H, class: 'pck-loupe-bg' }));
    const x0 = 34;
    if (kind === 'meniscus') {
      const yl = yOf(value);
      // bas du ménisque exactement au niveau lu (point de contrôle symétrique)
      g.append(s('path', { d: `M 0 ${yl - 10} Q ${W / 2} ${yl + 10} ${W} ${yl - 10} L ${W} ${H} L 0 ${H} Z`, class: 'pck-loupe-liquid' }));
      g.append(s('path', { d: `M 0 ${yl - 10} Q ${W / 2} ${yl + 10} ${W} ${yl - 10}`, class: 'pck-loupe-surface' }));
    }
    const lo = Math.floor((value - span / 2) / minor) - 1; const hi = Math.ceil((value + span / 2) / minor) + 1;
    for (let k = lo; k <= hi; k += 1) {
      const v = k * minor;
      const isLabel = Math.abs(v / label - Math.round(v / label)) < 1e-6;
      const isMajor = Math.abs(v / major - Math.round(v / major)) < 1e-6;
      const len = isLabel ? 36 : isMajor ? 26 : 16;
      const yy = yOf(v);
      g.append(s('line', { x1: x0, x2: x0 + len, y1: yy, y2: yy, class: 'pck-loupe-tick' }));
      if (isLabel) g.append(s('text', { x: x0 + len + 5, y: yy + 5, class: 'pck-loupe-txt' }, fixed(v, decimals)));
    }
    if (kind === 'needle') {
      const yn = yOf(value);
      g.append(s('path', { d: `M 6 ${yn} L 28 ${yn - 6} L 28 ${yn + 6} Z`, class: 'pck-loupe-needle' }));
      g.append(s('line', { x1: 6, x2: x0 + 40, y1: yn, y2: yn, class: 'pck-loupe-needle-line' }));
    }
    svg.append(g);
    svg.append(s('circle', { cx: W / 2, cy: H / 2, r: R, class: 'pck-loupe-rim' }));
  }

  update(0);
  return { el, update };
}
