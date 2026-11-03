/**
 * Laboratoire « Changement d'état » : un échantillon solide (−15 °C) est chauffé à puissance constante jusqu'à 40 °C.
 * Modèle enthalpique : H = P·t.
 *  - corps pur : échauffement du solide, palier à `palier` °C pendant toute la fusion, échauffement du liquide ;
 *  - mélange (eau salée, 3,5 % environ) : fraction liquide à l'équilibre f(θ) = Δ / (palier − θ) (abaissement Δ = 2 °C),
 *    la fusion s'étale sur une plage de températures sous `palier` : pas de palier net.
 * La masse totale affichée reste constante (conservation de la masse).
 */
import { h, announce } from '../ui/dom.js';
import { formatNumber } from '../core/expr.js';
import {
  s, num, clamp, fixed, jitter, createLcd, createMessage, createChoice, createMeasureTable, createPlot, createLoop,
  nextId,
} from './pc-kit.js';

const M = 50; // g d'échantillon
const C_S = 2.1; const C_L = 4.18; const L_F = 334; // J/(g·K), J/(g·K), J/g (eau)
const POWER = 18; // W reçus par l'échantillon
const BEAKER = 112.4; // g
const DEPRESSION = 2; // °C, abaissement du point de fusion de l'eau salée
const AUTO_STEP = 30; // s
const SPEEDS = [1, 5, 20];

function makeModel(mode, palier) {
  const T0 = Math.min(-15, palier - 15);
  const Tend = Math.max(40, palier + 20);
  if (mode !== 'melange') {
    const H1 = M * C_S * (palier - T0); const H2 = H1 + M * L_F;
    const Hend = H2 + M * C_L * (Tend - palier);
    const at = (H) => {
      if (H < H1) return { T: T0 + H / (M * C_S), f: 0 };
      if (H < H2) return { T: palier, f: (H - H1) / (M * L_F) };
      return { T: Math.min(Tend, palier + (H - H2) / (M * C_L)), f: 1 };
    };
    return { T0, Tend, tEnd: Hend / POWER, at };
  }
  const Tm = palier - DEPRESSION;
  const frac = (T) => (T >= Tm ? 1 : clamp(DEPRESSION / (palier - T), 0, 1));
  const f0 = frac(T0);
  const Hm = M * C_S * (Tm - T0) + M * L_F * (1 - f0);
  const enthalpy = (T) => (T <= Tm ? M * C_S * (T - T0) + M * L_F * (frac(T) - f0) : Hm + M * C_L * (T - Tm));
  const Hend = enthalpy(Tend);
  const at = (H) => {
    let lo = T0; let hi = Tend;
    for (let i = 0; i < 50; i += 1) { const mid = (lo + hi) / 2; if (enthalpy(mid) > H) hi = mid; else lo = mid; }
    const T = (lo + hi) / 2;
    return { T, f: frac(T) };
  };
  return { T0, Tend, tEnd: Hend / POWER, at };
}

function stateName(f) {
  if (f <= 0.001) return 'solide';
  if (f >= 0.999) return 'liquide';
  return 'solide + liquide';
}

function clock(t) {
  const sec = Math.floor(t + 1e-6);
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

export function mount(container, config = {}) {
  const mode = config.mode === 'melange' ? 'melange' : 'pur';
  const palier = clamp(num(config.palier, 0), -50, 150);
  const noise = clamp(num(config.noise, 0), 0, 0.05);
  const model = makeModel(mode, palier);
  const sMin = Math.floor((model.T0 - 5) / 10) * 10;
  const sMax = Math.ceil((model.Tend + 5) / 10) * 10;
  const sample = mode === 'melange' ? 'eau salée' : palier === 0 ? 'eau pure' : 'corps pur';

  let st = { t: 0, heating: false, speed: 5, auto: false, done: false };
  let lastState = '';
  const msg = createMessage();

  /* ----- Thermomètre ----- */
  const TH = { top: 30, bottom: 360, x: 60 };
  const yT = (T) => TH.bottom - ((T - sMin) / (sMax - sMin)) * (TH.bottom - TH.top);
  const thermo = s('svg', { class: 'lab-svg heat-thermo', viewBox: '0 0 120 420', role: 'img', 'aria-label': 'Thermomètre' });
  const column = s('rect', { x: TH.x - 2.5, width: 5, class: 'heat-column' });
  thermo.append(
    s('rect', { x: TH.x - 9, y: TH.top - 14, width: 18, height: TH.bottom - TH.top + 40, rx: 9, class: 'heat-thermo-glass' }),
    s('circle', { cx: TH.x, cy: TH.bottom + 30, r: 13, class: 'heat-thermo-glass' }),
    s('circle', { cx: TH.x, cy: TH.bottom + 30, r: 9, class: 'heat-bulb' }),
    column,
  );
  for (let T = sMin; T <= sMax; T += 1) {
    const isLabel = T % 10 === 0; const isMajor = T % 5 === 0;
    const len = isLabel ? 14 : isMajor ? 10 : 6;
    thermo.append(s('line', { x1: TH.x + 9, x2: TH.x + 9 + len, y1: yT(T), y2: yT(T), class: 'heat-tick' }));
    if (isLabel) thermo.append(s('text', { x: TH.x + 27, y: yT(T) + 4, class: 'heat-tick-txt' }, formatNumber(T)));
  }
  thermo.append(s('text', { x: TH.x + 27, y: TH.top - 18, class: 'heat-tick-txt' }, '°C'));

  /* ----- Bécher sur plaque chauffante ----- */
  const beaker = s('svg', { class: 'lab-svg heat-beaker', viewBox: '0 0 300 330', role: 'img', 'aria-label': 'Bécher sur une plaque chauffante' });
  const content = s('g');
  const plate = s('rect', { x: 60, y: 272, width: 180, height: 8, rx: 2, class: 'heat-plate' });
  const led = s('circle', { cx: 246, cy: 298, r: 5, class: 'heat-led' });
  beaker.append(
    s('rect', { x: 40, y: 280, width: 220, height: 36, rx: 6, class: 'heat-heater' }),
    s('circle', { cx: 70, cy: 298, r: 9, class: 'heat-knob' }),
    led, plate, content,
    s('line', { x1: 196, y1: 30, x2: 196, y2: 255, class: 'heat-probe' }),
    s('circle', { cx: 196, cy: 257, r: 4, class: 'heat-probe-tip' }),
    s('path', { d: 'M 74 104 L 80 110 V 262 Q 80 270 88 270 H 212 Q 220 270 220 262 V 110 L 226 104', class: 'heat-glass' }),
    s('text', { x: 150, y: 96, 'text-anchor': 'middle', class: 'heat-sample' }, sample),
  );

  const CUBES = [[-1.5, 0, -6], [-0.5, 0, 4], [0.5, 0, -3], [1.5, 0, 7], [-1, 1, 5], [0, 1, -8], [1, 1, 2]];
  function drawContent(f) {
    content.replaceChildren();
    const bottom = 268; const hFull = 74;
    const surface = bottom - f * hFull;
    if (f > 0.002) {
      content.append(
        s('rect', { x: 82, y: surface, width: 136, height: bottom - surface, class: 'heat-liquid' }),
        s('line', { x1: 82, x2: 218, y1: surface, y2: surface, class: 'heat-surface' }),
      );
    }
    const side = 30 * Math.cbrt(Math.max(0, 1 - f));
    if (side < 1.5) return;
    const base = Math.min(bottom, surface + 0.9 * side);
    for (const [dx, row, rot] of CUBES) {
      const cx = 150 + dx * (side + 3); const cyB = base - row * (side + 1);
      content.append(s('rect', {
        x: cx - side / 2, y: cyB - side, width: side, height: side, rx: side * 0.2,
        transform: `rotate(${rot} ${cx} ${cyB - side / 2})`, class: 'heat-ice',
      }));
    }
  }

  /* ----- Afficheurs et commandes ----- */
  const clockLcd = createLcd({ name: 'Chronomètre', unit: '', cls: 'heat-lcd' });
  const massLcd = createLcd({ name: 'Masse totale (bécher + contenu)', unit: 'g', cls: 'heat-lcd' });
  const bar = h('div', { class: 'heat-bar', role: 'img', 'aria-label': '' }, h('span', { class: 'heat-bar-s' }), h('span', { class: 'heat-bar-l' }));
  const stateTxt = h('p', { class: 'heat-state' });
  const heatBtn = h('button', { type: 'button', class: 'btn btn--primary', 'aria-pressed': 'false', onclick: toggleHeat }, 'Chauffer');
  const noteBtn = h('button', { type: 'button', class: 'btn', onclick: () => note(false) }, 'Noter la température');
  const resetBtn = h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: reset }, 'Recommencer (efface les relevés)');
  const autoId = nextId('heat-auto');
  const autoBox = h('input', { id: autoId, type: 'checkbox', onchange: () => { st = { ...st, auto: autoBox.checked }; if (st.auto && st.t === 0) note(true); } });
  const speedChoice = createChoice({
    legend: 'Vitesse de la simulation', name: nextId('heat-speed'), value: String(st.speed),
    options: SPEEDS.map((v) => ({ value: String(v), label: `×${v}` })),
    onChange: (v) => { st = { ...st, speed: Number(v) }; },
  });

  function readTemp(T) {
    return Math.round((T + jitter(noise * 10)) * 2) / 2;
  }

  function note(auto, tAt = st.t) {
    const tRec = Math.round(tAt);
    if (table.rows().some((r) => r.t === tRec)) {
      if (!auto) msg.set(`Une température est déjà notée à t = ${tRec} s.`, 'warn');
      return;
    }
    const cur = model.at(POWER * tAt);
    const T = readTemp(cur.T);
    table.add({ t: tRec, T, state: stateName(cur.f) });
    if (!auto) {
      const txt = `Noté : t = ${tRec} s ; θ = ${fixed(T, 1)} °C (${stateName(cur.f)}).`;
      msg.set(txt, 'ok');
      announce(txt);
    }
  }

  function toggleHeat() {
    if (st.done) return;
    st = { ...st, heating: !st.heating };
    if (st.heating) {
      if (st.auto && st.t === 0) note(true);
      loop.start();
      msg.set('Chauffage en marche.');
    } else {
      loop.stop();
      msg.set('Chauffage arrêté : le chronomètre est en pause (on néglige les échanges avec l’air).');
    }
    render();
  }

  function reset() {
    loop.stop();
    st = { ...st, t: 0, heating: false, done: false };
    table.clear();
    msg.set('Nouvelle expérience : échantillon solide à la température de départ.');
    render();
  }

  const loop = createLoop((dt) => {
    if (!st.heating) return false;
    const t1 = Math.min(model.tEnd, st.t + dt * st.speed);
    if (st.auto) {
      for (let k = Math.floor(st.t / AUTO_STEP) + 1; k * AUTO_STEP <= t1 + 1e-9; k += 1) note(true, k * AUTO_STEP);
    }
    st = { ...st, t: t1 };
    if (t1 >= model.tEnd) {
      if (st.auto) note(true, model.tEnd);
      st = { ...st, heating: false, done: true };
      msg.set(`Fin de l’expérience : l’échantillon a atteint ${formatNumber(model.Tend)} °C, le chauffage s’arrête.`, 'ok');
      announce('Fin de l’expérience.');
    }
    render();
    return st.heating;
  });

  function render() {
    const cur = model.at(POWER * st.t);
    column.setAttribute('y', String(yT(cur.T)));
    column.setAttribute('height', String(Math.max(0, TH.bottom + 30 - yT(cur.T))));
    drawContent(cur.f);
    clockLcd.set(clock(st.t), '');
    plate.classList.toggle('is-on', st.heating);
    led.classList.toggle('is-on', st.heating);
    bar.firstChild.style.width = `${(1 - cur.f) * 100}%`;
    bar.lastChild.style.width = `${cur.f * 100}%`;
    const name = stateName(cur.f);
    if (name !== lastState) {
      lastState = name;
      stateTxt.textContent = `État observé : ${name}`;
      beaker.setAttribute('aria-label', `Bécher sur une plaque chauffante, contenant de l’${sample} : ${name}.`);
    }
    bar.setAttribute('aria-label', `Proportion de liquide : environ ${Math.round(cur.f * 10) * 10} %`);
    thermo.setAttribute('aria-label', `Thermomètre gradué de ${formatNumber(sMin)} à ${formatNumber(sMax)} °C, tous les 1 °C : la colonne est vers ${formatNumber(Math.round(cur.T))} °C.`);
    heatBtn.textContent = st.done ? 'Expérience terminée' : st.heating ? 'Arrêter' : st.t > 0 ? 'Reprendre le chauffage' : 'Chauffer';
    heatBtn.setAttribute('aria-pressed', String(st.heating));
    heatBtn.disabled = st.done;
  }

  /* ----- Exploitation ----- */
  const table = createMeasureTable({
    caption: 'Relevés de température au cours du chauffage',
    columns: [
      { label: 't (s)', value: (r) => String(r.t) },
      { label: 'θ (°C)', value: (r) => fixed(r.T, 1) },
      { label: 'état', value: (r) => r.state },
    ],
    onChange: () => refreshGraph(),
  });
  const plot = createPlot({
    title: 'Graphique de la température θ en fonction du temps t',
    x: { name: 't', unit: 's', lo: 0, hi: model.tEnd, fixed: true },
    y: { name: 'θ', unit: '°C', lo: sMin, hi: sMax, fixed: true },
  });
  let join = false;
  const joinBtn = h('button', { type: 'button', class: 'btn btn--ghost btn--small', 'aria-pressed': 'false', onclick: () => { join = !join; joinBtn.setAttribute('aria-pressed', String(join)); joinBtn.textContent = join ? 'Ne plus relier les points' : 'Relier les points'; refreshGraph(); } }, 'Relier les points');

  function refreshGraph() {
    plot.update({ points: table.rows().map((r) => ({ x: r.t, y: r.T })), join });
  }

  massLcd.set(fixed(M + BEAKER, 1), 'g');

  const root = h('div', { class: 'pck heat' },
    h('p', { class: 'pck-intro' }, `Échantillon : ${sample}, sorti du congélateur. Lance le chauffage, observe le contenu du bécher et relève la température à intervalles réguliers. Trace ensuite θ = f(t).`),
    h('div', { class: 'heat-bench' },
      h('figure', { class: 'pck-bench heat-fig' }, beaker,
        h('div', { class: 'heat-statebox' }, stateTxt, bar, h('div', { class: 'heat-bar-legend small muted', 'aria-hidden': 'true' }, h('span', {}, 'solide'), h('span', {}, 'liquide')))),
      h('figure', { class: 'pck-bench heat-thermo-fig' }, thermo),
      h('div', { class: 'lab-controls heat-controls' },
        h('div', { class: 'heat-lcds' }, clockLcd.el, massLcd.el),
        h('div', { class: 'btn-row' }, heatBtn, noteBtn),
        speedChoice,
        h('label', { class: 'check-inline heat-auto', for: autoId }, autoBox, `Relevé automatique toutes les ${AUTO_STEP} s (temps simulé)`),
        h('div', { class: 'btn-row' }, resetBtn),
        msg.el)),
    h('div', { class: 'pck-exploit' },
      h('section', { class: 'pck-panel' }, h('h4', {}, 'Relevés'), table.el),
      h('section', { class: 'pck-panel' }, h('h4', {}, 'Graphique θ = f(t)'), plot.el, h('div', { class: 'btn-row' }, joinBtn))));

  container.append(root);
  render();
  refreshGraph();

  return () => { loop.stop(); root.remove(); };
}
