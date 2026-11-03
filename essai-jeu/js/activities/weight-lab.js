/**
 * Laboratoire « Poids et masse » : masses marquées accrochées à un dynamomètre gradué en newtons, sur plusieurs astres.
 * L'élève lit P sur la graduation (loupe), écrit m en kg et P en N ; le graphique P = f(m) se trace par astre.
 * L'intensité de pesanteur g n'est jamais affichée ; l'étiquette des masses ne change pas d'un astre à l'autre.
 */
import { h, announce } from '../ui/dom.js';
import { formatNumber } from '../core/expr.js';
import {
  s, num, clamp, fixed, jitter, parseReading, reducedMotion, createMessage, createChoice, createMeasureTable,
  createPlot, createOriginFit, createScaleLoupe, createLoop, nextId,
} from './pc-kit.js';

const PLANETS = {
  Terre: { label: 'la Terre', g: 9.8 },
  Lune: { label: 'la Lune', g: 1.6 },
  Mars: { label: 'Mars', g: 3.7 },
  Jupiter: { label: 'Jupiter', g: 24.8 },
  inconnue: { label: 'l’astre inconnu', g: null },
};
const MASSES = [50, 100, 200, 500, 1000]; // g
const MASS_H = { 50: 12, 100: 15, 200: 19, 500: 26, 1000: 33 };
const DYNAMOS = {
  1: { max: 1, minor: 0.02, major: 0.1, label: 0.2, dec: 2 },
  5: { max: 5, minor: 0.1, major: 0.5, label: 1, dec: 1 },
  10: { max: 10, minor: 0.2, major: 1, label: 2, dec: 1 },
  50: { max: 50, minor: 1, major: 5, label: 10, dec: 0 },
};
const GEO = { cx: 170, zero: 50, len: 144, tubeTop: 36, tubeBottom: 212 };

function massLabel(g) {
  return g >= 1000 ? `${formatNumber(g / 1000)} kg` : `${g} g`;
}

export function mount(container, config = {}) {
  const startPlanet = PLANETS[config.planet] ? config.planet : 'Terre';
  const gUnknown = clamp(num(config.g, 5.2), 0.1, 300);
  const noise = clamp(num(config.noise, 0), 0, 0.05);
  const planetKeys = Object.keys(PLANETS).filter((k) => k !== 'inconnue' || startPlanet === 'inconnue');
  const gOf = (k) => (k === 'inconnue' ? gUnknown : PLANETS[k].g);
  const reduce = reducedMotion();

  let st = { planet: startPlanet, hooked: [], dyn: '10', err: 0 };
  let shownPx = 0; // allongement affiché (px)
  let osc = null;
  const msg = createMessage();

  const totalG = () => st.hooked.reduce((a, b) => a + b, 0);
  const trueP = () => (totalG() / 1000) * gOf(st.planet) * (1 + st.err);
  const dyn = () => DYNAMOS[st.dyn];
  const targetPx = () => clamp(trueP() / dyn().max, 0, 1.03) * GEO.len;

  /* ----- Dessin ----- */
  const svg = s('svg', { class: 'lab-svg wt-svg', viewBox: '72 0 196 516', role: 'img', 'aria-label': 'Dynamomètre' });
  const scaleG = s('g', { 'aria-hidden': 'true' });
  const moving = s('g', { 'aria-hidden': 'true' });
  const planetTxt = s('text', { x: 264, y: 70, 'text-anchor': 'end', class: 'wt-planet' }, '');
  svg.append(
    s('rect', { x: 76, y: 500, width: 188, height: 12, rx: 3, class: 'wt-stand' }),
    s('rect', { x: 88, y: 14, width: 8, height: 488, class: 'wt-stand' }),
    s('rect', { x: 88, y: 14, width: 98, height: 7, class: 'wt-stand' }),
    s('line', { x1: GEO.cx, x2: GEO.cx, y1: 21, y2: 24, class: 'wt-rod' }),
    s('circle', { cx: GEO.cx, cy: 29, r: 5, class: 'wt-ring' }),
    s('rect', { x: GEO.cx - 18, y: GEO.tubeTop, width: 36, height: GEO.tubeBottom - GEO.tubeTop, rx: 6, class: 'wt-tube' }),
    scaleG, moving,
    s('rect', { x: GEO.cx - 18, y: GEO.tubeTop, width: 36, height: GEO.tubeBottom - GEO.tubeTop, rx: 6, class: 'wt-tube-edge' }),
    planetTxt,
  );

  function drawScale() {
    scaleG.replaceChildren();
    const d = dyn();
    const n = Math.round(d.max / d.minor);
    for (let k = 0; k <= n; k += 1) {
      const v = Math.round(k * d.minor * 1e6) / 1e6;
      const isLabel = Math.abs(v / d.label - Math.round(v / d.label)) < 1e-6;
      const isMajor = Math.abs(v / d.major - Math.round(v / d.major)) < 1e-6;
      const y = GEO.zero + (v / d.max) * GEO.len;
      scaleG.append(s('line', { x1: GEO.cx - 18, x2: GEO.cx - 18 + (isLabel ? 12 : isMajor ? 9 : 5), y1: y, y2: y, class: 'wt-tick' }));
      if (isLabel) scaleG.append(s('text', { x: GEO.cx - 24, y: y + 3.5, 'text-anchor': 'end', class: 'wt-tick-txt' }, formatNumber(v)));
    }
    scaleG.append(s('text', { x: GEO.cx - 24, y: GEO.zero - 8, 'text-anchor': 'end', class: 'wt-tick-txt wt-unit' }, 'N'));
    scaleG.append(s('text', { x: GEO.cx + 24, y: GEO.tubeBottom - 4, class: 'wt-cal' }, `${d.max} N`));
  }

  function spring(y0, y1) {
    const coils = 14; const amp = 8; const step = (y1 - y0) / (coils * 2);
    let d = `M ${GEO.cx} ${y0}`;
    for (let i = 1; i < coils * 2; i += 1) d += ` L ${GEO.cx + (i % 2 ? amp : -amp)} ${y0 + i * step}`;
    return `${d} L ${GEO.cx} ${y1}`;
  }

  function drawMoving(px) {
    moving.replaceChildren();
    const yIdx = GEO.zero + px;
    moving.append(s('path', { d: spring(GEO.tubeTop + 4, yIdx - 3), class: 'wt-spring' }));
    moving.append(s('rect', { x: GEO.cx - 15, y: yIdx - 1.5, width: 30, height: 3, class: 'wt-index' }));
    const hookY = GEO.tubeBottom + 14 + px;
    moving.append(
      s('line', { x1: GEO.cx, x2: GEO.cx, y1: yIdx + 1.5, y2: hookY, class: 'wt-rod' }),
      s('path', { d: `M ${GEO.cx} ${hookY} q 0 7 -5 7 q -5 0 -5 -5`, class: 'wt-hook' }),
    );
    let y = hookY + 7;
    const order = [...st.hooked].sort((a, b) => b - a);
    for (const m of order) {
      const hh = MASS_H[m]; const w = 16 + hh * 0.7;
      moving.append(
        s('line', { x1: GEO.cx - 5, x2: GEO.cx - 5, y1: y - 5, y2: y + 3, class: 'wt-rod' }),
        s('rect', { x: GEO.cx - 5 - w / 2, y: y + 3, width: w, height: hh, rx: 3, class: 'wt-mass' }),
        s('text', { x: GEO.cx - 5 + w / 2 + 6, y: y + 3 + hh / 2 + 4, class: 'wt-mass-txt' }, massLabel(m)),
      );
      y += hh + 8;
    }
  }

  const makeLoupe = () => {
    const d = dyn();
    return createScaleLoupe({
      title: 'Vue rapprochée de l’index du dynamomètre', minor: d.minor, major: d.major, label: d.label,
      span: d.minor * 12, kind: 'needle', decimals: d.dec, downward: true,
    });
  };
  let loupeApi = makeLoupe();
  let loupeEl = loupeApi.el;

  function rebuildLoupe() {
    const next = makeLoupe();
    loupeEl.replaceWith(next.el);
    loupeEl = next.el; loupeApi = next;
  }

  function showPx(px) {
    shownPx = px;
    drawMoving(px);
    loupeApi.update((px / GEO.len) * dyn().max);
  }

  const loop = createLoop((dt) => {
    if (!osc) return false;
    osc = { ...osc, t: osc.t + dt };
    const a = osc.amp * Math.exp(-osc.t / 0.35);
    showPx(osc.target + a * Math.cos(2 * Math.PI * 1.8 * osc.t));
    if (Math.abs(a) < 0.15) { osc = null; showPx(targetPx()); return false; }
    return true;
  });

  function settle() {
    const target = targetPx();
    if (reduce || Math.abs(target - shownPx) < 0.5) { loop.stop(); osc = null; showPx(target); return; }
    osc = { target, amp: shownPx - target, t: 0 };
    loop.start();
  }

  function describe() {
    const d = dyn(); const p = trueP();
    if (p > d.max) return `Dynamomètre de calibre ${d.max} N : l’index est en butée, au-delà de ${d.max} N.`;
    const lo = Math.floor(p / d.minor + 1e-9) * d.minor;
    const on = Math.abs(p - lo) < d.minor * 0.1 || Math.abs(p - lo - d.minor) < d.minor * 0.1;
    const near = Math.abs(p - lo) < d.minor * 0.1 ? lo : lo + d.minor;
    return on
      ? `Dynamomètre de calibre ${d.max} N : l’index est sur la graduation ${fixed(near, d.dec)} N.`
      : `Dynamomètre de calibre ${d.max} N : l’index est entre les graduations ${fixed(lo, d.dec)} N et ${fixed(lo + d.minor, d.dec)} N.`;
  }

  /* ----- Commandes ----- */
  const planetChoice = createChoice({
    legend: 'Astre', name: nextId('wt-planet'), value: st.planet,
    options: planetKeys.map((k) => ({ value: k, label: k === 'inconnue' ? 'Astre inconnu' : k })),
    onChange: (v) => { st = { ...st, planet: v, err: jitter(noise) }; msg.set(`Expérience transportée sur ${PLANETS[v].label}.`); render(); },
  });
  const dynChoice = createChoice({
    legend: 'Calibre du dynamomètre', name: nextId('wt-dyn'), value: st.dyn,
    options: Object.keys(DYNAMOS).map((k) => ({ value: k, label: `${k} N` })),
    onChange: (v) => { st = { ...st, dyn: v }; drawScale(); rebuildLoupe(); shownPx = targetPx(); render(); },
  });
  const massBtns = MASSES.map((m) => h('button', {
    type: 'button', class: 'btn btn--ghost btn--small wt-mass-btn', 'aria-pressed': 'false',
    onclick: () => {
      const on = st.hooked.includes(m);
      st = { ...st, hooked: on ? st.hooked.filter((x) => x !== m) : [...st.hooked, m], err: jitter(noise) };
      render();
    },
  }, massLabel(m)));

  const mId = nextId('wt-m'); const pId = nextId('wt-p');
  const inM = h('input', { id: mId, class: 'field-input', type: 'text', inputmode: 'decimal', autocomplete: 'off', placeholder: 'ex. 0,2' });
  const inP = h('input', { id: pId, class: 'field-input', type: 'text', inputmode: 'decimal', autocomplete: 'off', placeholder: 'ex. 1,9' });
  const noteBtn = h('button', { type: 'button', class: 'btn btn--primary', onclick: note }, 'Noter dans le tableau');

  function note() {
    const m = parseReading(inM.value); const p = parseReading(inP.value);
    const mKg = totalG() / 1000;
    if (!Number.isFinite(m) || m < 0) { msg.set('Écris la masse accrochée en kilogrammes (par exemple 0,2).', 'warn'); inM.focus(); return; }
    if (Math.abs(m - mKg) > 0.0005) { msg.set('La masse notée ne correspond pas aux masses accrochées. Rappel : 1 kg = 1 000 g.', 'warn'); inM.focus(); return; }
    if (trueP() > dyn().max) { msg.set('Le dynamomètre est en butée : la lecture est impossible. Choisis un plus grand calibre.', 'warn'); return; }
    if (!Number.isFinite(p) || p < 0) { msg.set('Écris le poids lu sur le dynamomètre, en newtons.', 'warn'); inP.focus(); return; }
    const far = Math.abs(p - trueP()) > dyn().minor * 1.01;
    const n = table.add({ planet: st.planet, m, p });
    const txt = `Mesure n° ${n} notée sur ${PLANETS[st.planet].label} : m = ${formatNumber(m, 4)} kg ; P = ${formatNumber(p, 3)} N.`;
    msg.set(far ? `${txt} Attention : ta lecture semble éloignée de la position de l’index (une petite graduation vaut ${formatNumber(dyn().minor)} N). Tu peux effacer la ligne et relire.` : txt, far ? 'warn' : 'ok');
    announce(txt);
  }

  /* ----- Exploitation ----- */
  const table = createMeasureTable({
    caption: 'Masse et poids mesurés',
    columns: [
      { label: 'astre', value: (r) => (r.planet === 'inconnue' ? 'inconnu' : r.planet) },
      { label: 'm (kg)', value: (r) => formatNumber(r.m, 4) },
      { label: 'P (N)', value: (r) => formatNumber(r.p, 3) },
    ],
    onChange: () => refreshGraph(),
  });
  const plot = createPlot({
    title: 'Graphique du poids P en fonction de la masse m',
    x: { name: 'm', unit: 'kg', lo: 0, hi: 1 },
    y: { name: 'P', unit: 'N', lo: 0, hi: 10 },
  });
  const fit = createOriginFit({ unit: 'N/kg', onChange: () => refreshGraph() });

  function refreshGraph() {
    const keys = Object.keys(PLANETS);
    const pts = table.rows().map((r) => ({
      x: r.m, y: r.p, series: keys.indexOf(r.planet), seriesName: r.planet === 'inconnue' ? 'Astre inconnu' : r.planet,
    }));
    fit.setPoints(pts);
    plot.update({ points: pts, lines: fit.lines() });
  }

  function render() {
    planetTxt.textContent = `Sur ${PLANETS[st.planet].label}`;
    massBtns.forEach((b, i) => {
      const on = st.hooked.includes(MASSES[i]);
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', `${on ? 'Décrocher' : 'Accrocher'} la masse marquée de ${massLabel(MASSES[i])}`);
    });
    svg.setAttribute('aria-label', `${describe()} Masses accrochées : ${st.hooked.length ? [...st.hooked].sort((a, b) => a - b).map(massLabel).join(', ') : 'aucune'}.`);
    if (trueP() > dyn().max) msg.set('L’index est en butée : le poids dépasse le calibre du dynamomètre. Choisis un plus grand calibre.', 'warn');
    else if (msg.el.dataset.kind === 'warn') msg.set('');
    settle();
  }

  const root = h('div', { class: 'pck wt' },
    h('p', { class: 'pck-intro' }, 'Accroche une ou plusieurs masses marquées, attends que l’index s’immobilise et lis le poids P sur la graduation. Note la masse en kilogrammes et le poids en newtons, puis change d’astre.'),
    h('div', { class: 'lab-grid' },
      h('div', { class: 'pck-bench wt-bench' }, h('figure', { class: 'wt-fig' }, svg), loupeEl),
      h('div', { class: 'lab-controls' },
        planetChoice,
        h('fieldset', { class: 'pck-choice' }, h('legend', {}, 'Masses marquées (cliquer pour accrocher)'), h('div', { class: 'btn-row' }, massBtns)),
        dynChoice,
        h('div', { class: 'wt-form' },
          h('div', { class: 'field' }, h('label', { class: 'field-label', for: mId }, 'm (kg)'), inM),
          h('div', { class: 'field' }, h('label', { class: 'field-label', for: pId }, 'P lu (N)'), inP)),
        h('div', { class: 'btn-row' }, noteBtn),
        msg.el)),
    h('div', { class: 'pck-exploit' },
      h('section', { class: 'pck-panel' }, h('h4', {}, 'Tableau de mesures'), table.el),
      h('section', { class: 'pck-panel' }, h('h4', {}, 'Graphique P = f(m)'), plot.el, fit.el)));

  container.append(root);
  drawScale();
  showPx(0);
  render();
  refreshGraph();

  return () => { loop.stop(); root.remove(); };
}
