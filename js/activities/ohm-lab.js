/**
 * Laboratoire « Loi d'Ohm » : générateur réglable, résistor (ou lampe), ampèremètre en série, voltmètre en dérivation.
 * L'élève règle la tension, choisit le calibre, mesure ; le tableau et le graphique U = f(I) se remplissent.
 * La résistance (config.R) n'est jamais affichée : l'élève la détermine par le coefficient directeur.
 * Lampe : R = R0·(1 + k·I²), réglée pour être multipliée par 5 à la tension maximale (filament chaud).
 */
import { h, announce } from '../ui/dom.js';
import { formatNumber } from '../core/expr.js';
import {
  s, num, bool, clamp, fixed, decimalsFor, fmtSig, jitter,
  createLcd, createMessage, createChoice, createMeasureTable, createPlot, createOriginFit, nextId,
} from './pc-kit.js';

const CALIBRES = {
  '10A': { label: '10 A', unit: 'A', factor: 1, max: 9.99, res: 0.01, terminal: '10A' },
  '200mA': { label: '200 mA', unit: 'mA', factor: 1000, max: 199.9, res: 0.1, terminal: 'mA' },
  '20mA': { label: '20 mA', unit: 'mA', factor: 1000, max: 19.99, res: 0.01, terminal: 'mA' },
};

/** Lecture d'un afficheur : limitée par la résolution du calibre et à 3 chiffres significatifs. */
function meter(v, res) {
  const dRes = Math.max(0, Math.round(-Math.log10(res)));
  const d = v === 0 ? dRes : Math.min(dRes, decimalsFor(v, 3));
  const q = Math.round(v * 10 ** d) / 10 ** d;
  return { value: q, text: fixed(q, d) };
}

function readConfig(config) {
  const lamp = bool(config.lamp);
  return {
    lamp,
    R: Math.max(1, num(config.R, lamp ? 15 : 100)), // lampe : R0 à froid (I max ≈ 160 mA sous 12 V)
    noise: clamp(num(config.noise, 0), 0, 0.05),
    uMax: clamp(num(config.uMax, 12), 1, 30),
  };
}

function makeModel({ lamp, R, uMax }) {
  const iHot = uMax / (5 * R); // intensité à uMax : résistance ×5
  const k = 4 / (iHot * iHot);
  return function current(u) {
    if (u <= 0) return 0;
    if (!lamp) return u / R;
    // R0·I·(1 + k·I²) = U, fonction croissante de I : dichotomie
    let lo = 0; let hi = u / R;
    for (let i = 0; i < 60; i += 1) {
      const m = (lo + hi) / 2;
      if (R * m * (1 + k * m * m) > u) hi = m; else lo = m;
    }
    return (lo + hi) / 2;
  };
}

/* ---------- Schéma normalisé ---------- */

function circuitSvg(lamp) {
  const svg = s('svg', {
    class: 'lab-svg ohm-circuit', viewBox: '0 0 460 270', role: 'img',
    'aria-label': `Schéma du circuit : générateur de tension réglable, ampèremètre en série, ${lamp ? 'lampe' : 'résistor'}, voltmètre branché en dérivation aux bornes du dipôle.`,
  });
  const wire = (d) => s('path', { d, class: 'ohm-wire' });
  // Fils de la boucle principale
  svg.append(
    wire('M 60 111 V 50 H 133'), wire('M 167 50 H 300 V 107'), wire('M 300 163 V 220 H 60 V 159'),
    wire('M 300 80 H 400 V 118'), wire('M 400 152 V 190 H 300'),
    s('circle', { cx: 300, cy: 80, r: 3.5, class: 'ohm-node' }), s('circle', { cx: 300, cy: 190, r: 3.5, class: 'ohm-node' }),
  );
  // Générateur (source de tension) réglable : cercle traversé, flèche oblique, bornes + et −
  svg.append(
    s('circle', { cx: 60, cy: 135, r: 24, class: 'ohm-sym' }),
    s('line', { x1: 60, y1: 111, x2: 60, y2: 159, class: 'ohm-wire' }),
    s('line', { x1: 34, y1: 166, x2: 84, y2: 106, class: 'ohm-adjust' }),
    s('path', { d: 'M 88 101 l -11 3 l 6 6 z', class: 'ohm-adjust-head' }),
    s('text', { x: 72, y: 104, class: 'ohm-txt ohm-pol' }, '+'),
    s('text', { x: 72, y: 176, class: 'ohm-txt ohm-pol' }, '−'),
    s('text', { x: 18, y: 140, class: 'ohm-txt ohm-name' }, 'G'),
  );
  // Sens conventionnel du courant
  svg.append(s('path', { d: 'M 104 50 l -10 -5 v 10 z', class: 'ohm-arrow' }), s('text', { x: 95, y: 38, class: 'ohm-txt ohm-name' }, 'I'));
  // Ampèremètre
  const ammTerminal = s('text', { x: 124, y: 72, class: 'ohm-txt ohm-term' }, '10A');
  svg.append(
    s('circle', { cx: 150, cy: 50, r: 17, class: 'ohm-sym' }),
    s('text', { x: 150, y: 56, class: 'ohm-txt ohm-letter', 'text-anchor': 'middle' }, 'A'),
    ammTerminal,
    s('text', { x: 160, y: 72, class: 'ohm-txt ohm-term' }, 'COM'),
  );
  // Dipôle étudié
  const glow = s('circle', { cx: 300, cy: 135, r: 30, class: 'ohm-glow', opacity: 0 });
  if (lamp) {
    svg.append(
      glow,
      s('circle', { cx: 300, cy: 135, r: 20, class: 'ohm-sym' }),
      s('path', { d: 'M 285.9 120.9 L 314.1 149.1 M 314.1 120.9 L 285.9 149.1', class: 'ohm-wire' }),
      wire('M 300 107 V 115'), wire('M 300 155 V 163'),
      s('text', { x: 328, y: 140, class: 'ohm-txt ohm-name' }, 'L'),
    );
  } else {
    svg.append(
      s('rect', { x: 291, y: 107, width: 18, height: 56, class: 'ohm-sym' }),
      s('text', { x: 318, y: 140, class: 'ohm-txt ohm-name' }, 'R'),
    );
  }
  // Flèche-tension U (pointe vers la borne reliée au + du générateur)
  svg.append(
    s('path', { d: 'M 266 168 V 106', class: 'ohm-uarrow' }),
    s('path', { d: 'M 266 100 l -5 9 h 10 z', class: 'ohm-uarrow-head' }),
    s('text', { x: 248, y: 140, class: 'ohm-txt ohm-name' }, 'U'),
  );
  // Voltmètre
  svg.append(
    s('circle', { cx: 400, cy: 135, r: 17, class: 'ohm-sym' }),
    s('text', { x: 400, y: 141, class: 'ohm-txt ohm-letter', 'text-anchor': 'middle' }, 'V'),
    s('text', { x: 408, y: 112, class: 'ohm-txt ohm-term' }, 'V'),
    s('text', { x: 408, y: 168, class: 'ohm-txt ohm-term' }, 'COM'),
  );
  return { svg, glow, ammTerminal };
}

/* ---------- Activité ---------- */

export function mount(container, config = {}) {
  const cfg = readConfig(config);
  const current = makeModel(cfg);
  const vRes = cfg.uMax * 1.06 > 19.99 ? 0.1 : 0.01;
  const pMax = cfg.uMax * current(cfg.uMax);
  let state = { u: 0, cal: '10A', eU: 0, eI: 0 };

  const msg = createMessage();
  const { svg, glow, ammTerminal } = circuitSvg(cfg.lamp);
  const voltLcd = createLcd({ name: 'Voltmètre', unit: 'V', cls: 'ohm-lcd' });
  const ampLcd = createLcd({ name: 'Ampèremètre', unit: 'A', cls: 'ohm-lcd' });

  const sliderId = nextId('ohm-u');
  const slider = h('input', {
    id: sliderId, type: 'range', min: '0', max: String(cfg.uMax), step: '0.5', value: '0',
    oninput: () => { state = { ...state, u: Number(slider.value), eU: jitter(cfg.noise / 2), eI: jitter(cfg.noise) }; render(); },
  });
  const knob = h('output', { for: sliderId, class: 'ohm-knob' }, '0,0 V');

  const calChoice = createChoice({
    legend: 'Calibre de l’ampèremètre', name: nextId('ohm-cal'), value: state.cal,
    options: Object.entries(CALIBRES).map(([value, c]) => ({ value, label: c.label })),
    onChange: (v) => { state = { ...state, cal: v }; render(); },
  });

  const table = createMeasureTable({
    caption: 'Mesures de la tension U et de l’intensité I',
    columns: [
      { label: 'U (V)', value: (r) => r.uTxt },
      { label: 'I (mA)', value: (r) => r.iTxt },
      { label: 'calibre', value: (r) => r.cal },
    ],
    onChange: () => refreshGraph(),
  });

  const plot = createPlot({
    title: 'Graphique de la tension U en fonction de l’intensité I',
    x: { name: 'I', unit: 'mA', lo: 0, hi: 10 },
    y: { name: 'U', unit: 'V', lo: 0, hi: cfg.uMax },
  });
  const fit = createOriginFit({
    unit: 'V/mA',
    extra: (a) => `, soit ${fmtSig(a * 1000, 3)} V/A (1 mA = 0,001 A)`,
    onChange: () => refreshGraph(),
  });

  function readings() {
    const iTrue = current(state.u);
    const uM = state.u * (1 + state.eU);
    const iM = iTrue * (1 + state.eI);
    const cal = CALIBRES[state.cal];
    const iInUnit = iM * cal.factor;
    return { v: meter(uM, vRes), a: iInUnit > cal.max ? null : meter(iInUnit, cal.res), cal };
  }

  function render() {
    const r = readings();
    knob.textContent = `${fixed(state.u, 1)} V`;
    slider.setAttribute('aria-valuetext', `${fixed(state.u, 1)} volts`);
    voltLcd.set(r.v.text, 'V');
    if (r.a) ampLcd.set(r.a.text, r.cal.unit);
    else ampLcd.set('1.', r.cal.unit, { alert: true });
    ammTerminal.textContent = r.cal.terminal;
    const p = state.u * current(state.u);
    glow.setAttribute('opacity', cfg.lamp && pMax > 0 ? String(Math.pow(p / pMax, 0.6).toFixed(3)) : '0');
    if (!r.a) msg.set('Dépassement : l’afficheur indique « 1. » à gauche. Choisis un calibre plus grand.', 'warn');
    else if (msg.el.dataset.kind === 'warn') msg.set('');
  }

  function measure() {
    const r = readings();
    if (!r.a) {
      msg.set('Impossible de lire l’intensité : l’ampèremètre est en dépassement. Choisis un calibre plus grand.', 'warn');
      return;
    }
    const iMa = r.cal.unit === 'A' ? r.a.value * 1000 : r.a.value;
    const n = table.add({
      u: r.v.value, uTxt: r.v.text, i: iMa,
      iTxt: r.cal.unit === 'A' ? formatNumber(iMa, 3) : r.a.text, cal: r.cal.label,
    });
    const txt = `Mesure n° ${n} notée : U = ${r.v.text} V ; I = ${r.a.text} ${r.cal.unit}.`;
    msg.set(r.cal.unit === 'A' && iMa < 200 ? `${txt} Sur le calibre 10 A, la lecture est peu précise : un calibre plus petit donnerait plus de chiffres.` : txt, 'ok');
    announce(txt);
  }

  function refreshGraph() {
    const pts = table.rows().map((r) => ({ x: r.i, y: r.u }));
    fit.setPoints(pts);
    plot.update({ points: pts, lines: fit.lines() });
  }

  const measureBtn = h('button', { type: 'button', class: 'btn btn--primary', onclick: measure }, 'Mesurer');

  const root = h('div', { class: 'pck ohm' },
    h('p', { class: 'pck-intro' },
      `Règle la tension du générateur, choisis le calibre adapté de l’ampèremètre, puis clique sur « Mesurer ». Fais des mesures pour plusieurs tensions et observe le graphique U = f(I) pour ${cfg.lamp ? 'la lampe' : 'le résistor'}.`),
    h('div', { class: 'lab-grid' },
      h('figure', { class: 'pck-bench' }, svg),
      h('div', { class: 'lab-controls' },
        h('div', { class: 'pck-slider' },
          h('label', { for: sliderId }, 'Réglage du générateur'),
          h('span', { class: 'pck-slider-row' }, slider, knob)),
        h('div', { class: 'ohm-meters' }, voltLcd.el, ampLcd.el),
        calChoice,
        h('p', { class: 'small muted pck-tip' }, 'Bonne pratique : commencer par le plus grand calibre, puis descendre tant que l’appareil n’indique pas de dépassement.'),
        h('div', { class: 'btn-row' }, measureBtn),
        msg.el)),
    h('div', { class: 'pck-exploit' },
      h('section', { class: 'pck-panel' }, h('h4', {}, 'Tableau de mesures'), table.el),
      h('section', { class: 'pck-panel' }, h('h4', {}, 'Graphique U = f(I)'), plot.el, fit.el)));

  container.append(root);
  render();
  refreshGraph();

  return () => { root.remove(); };
}
