/**
 * Laboratoire « Chronophotographie » : positions successives d'un mobile à intervalles réguliers τ = dt,
 * sur une règle graduée. Outil « règle » : l'élève clique deux images, la distance est lue à la demi-graduation,
 * la durée vaut (écart d'indices) × τ. Le type de mouvement (mode, v, a) n'est jamais affiché.
 *   uniforme : x = v·t      accéléré : x = v·t + ½·a·t²      ralenti : x = v·t − ½·a·t² (jusqu'à l'arrêt)
 */
import { h, announce } from '../ui/dom.js';
import { formatNumber } from '../core/expr.js';
import {
  s, num, clamp, fixed, jitter, reducedMotion, createLcd, createMessage, createMeasureTable, createPlot,
  createOriginFit, createLoop,
} from './pc-kit.js';

const DEFAULTS = {
  uniforme: { v: 0.5, a: 0 },
  accelere: { v: 0.1, a: 0.6 },
  ralenti: { v: 1, a: 0.5 },
};
const STRIP = { x0: 30, x1: 670, rail: 66 };

function readConfig(config) {
  const mode = DEFAULTS[config.mode] ? config.mode : 'uniforme';
  const d = DEFAULTS[mode];
  return {
    mode,
    v: Math.max(0, num(config.v, d.v)),
    a: Math.abs(num(config.a, d.a)),
    dt: clamp(num(config.dt, 0.2), 0.01, 5),
    n: Math.round(clamp(num(config.n, 10), 3, 30)),
    noise: clamp(num(config.noise, 0), 0, 0.05),
  };
}

function makeLaw({ mode, v, a }) {
  if (mode === 'accelere') return (t) => v * t + 0.5 * a * t * t;
  if (mode === 'ralenti') {
    const tStop = a > 0 ? v / a : Infinity;
    return (t) => { const tt = Math.min(t, tStop); return v * tt - 0.5 * a * tt * tt; };
  }
  return (t) => v * t;
}

/** Règle : longueur, graduations et résolution de lecture (en cm). */
function makeRuler(xMaxM) {
  const needCm = Math.max(5, xMaxM * 100 * 1.08 + 2);
  const unit = needCm > 50 ? 10 : needCm > 20 ? 5 : 1;
  const lengthCm = Math.ceil(needCm / unit) * unit;
  const pxPerCm = (STRIP.x1 - STRIP.x0) / lengthCm;
  const minor = [0.1, 0.2, 0.5, 1, 2, 5, 10].find((m) => m * pxPerCm >= 4) || 10;
  const labelStep = [1, 2, 5, 10, 20, 50, 100].find((l) => l * pxPerCm >= 36 && Math.abs(l / minor - Math.round(l / minor)) < 1e-9) || 100;
  const half = labelStep / 2;
  const majorStep = Math.abs(half / minor - Math.round(half / minor)) < 1e-9 && half > minor ? half : labelStep;
  const offsetCm = Math.max(minor, Math.round((lengthCm * 0.04) / minor) * minor);
  return { lengthCm, pxPerCm, minor, labelStep, majorStep, offsetCm, resCm: minor / 2 };
}

export function mount(container, config = {}) {
  const cfg = readConfig(config);
  const law = makeLaw(cfg);
  const times = Array.from({ length: cfg.n }, (_, i) => i * cfg.dt);
  const tEnd = times[times.length - 1];
  const xMax = law(tEnd);
  const sigma = cfg.noise * xMax * 0.1;
  const xs = times.map((t, i) => (i === 0 ? 0 : law(t) + jitter(sigma)));
  const ruler = makeRuler(xMax);
  const X = (xm) => STRIP.x0 + (ruler.offsetCm + xm * 100) * ruler.pxPerCm;
  const resM = ruler.resCm / 100;
  const xDec = Math.max(2, Math.ceil(-Math.log10(resM) - 1e-9));
  const slow = Math.max(1, Math.ceil(4 / Math.max(tEnd, 0.01)));
  const reduce = reducedMotion();

  let sel = [];
  let anim = { t: 0, playing: false };
  const msg = createMessage();

  /* ----- Chronophotographie et règle ----- */
  const svg = s('svg', {
    class: 'lab-svg mot-strip', viewBox: '0 0 700 186', role: 'group',
    'aria-label': `Chronophotographie : ${cfg.n} positions du mobile, prises toutes les ${formatNumber(cfg.dt, 3)} s, devant une règle graduée en centimètres`,
  });
  const photo = s('g');
  photo.append(
    s('rect', { x: 18, y: 14, width: 664, height: 96, rx: 6, class: 'mot-photo' }),
    s('line', { x1: 24, x2: 676, y1: STRIP.rail + 12, y2: STRIP.rail + 12, class: 'mot-rail' }),
  );
  svg.append(photo);

  const rulerG = s('g', { 'aria-hidden': 'true' });
  rulerG.append(s('rect', { x: 18, y: 116, width: 664, height: 56, rx: 4, class: 'mot-ruler' }));
  const nTicks = Math.round(ruler.lengthCm / ruler.minor);
  for (let k = 0; k <= nTicks; k += 1) {
    const cm = Math.round(k * ruler.minor * 1000) / 1000;
    const isLabel = Math.abs(cm / ruler.labelStep - Math.round(cm / ruler.labelStep)) < 1e-6;
    const isMajor = Math.abs(cm / ruler.majorStep - Math.round(cm / ruler.majorStep)) < 1e-6;
    const xx = STRIP.x0 + cm * ruler.pxPerCm;
    rulerG.append(s('line', { x1: xx, x2: xx, y1: 116, y2: 116 + (isLabel ? 18 : isMajor ? 13 : 8), class: 'mot-tick' }));
    if (isLabel) rulerG.append(s('text', { x: xx, y: 150, 'text-anchor': 'middle', class: 'mot-tick-txt' }, formatNumber(cm)));
  }
  rulerG.append(s('text', { x: 676, y: 166, 'text-anchor': 'end', class: 'mot-tick-txt' }, 'cm'));
  svg.append(rulerG);

  const measureG = s('g', { 'aria-hidden': 'true' });
  svg.append(measureG);
  const imgs = xs.map((x, i) => {
    const prev = i > 0 ? X(xs[i]) - X(xs[i - 1]) : Infinity;
    const next = i < xs.length - 1 ? X(xs[i + 1]) - X(xs[i]) : Infinity;
    const crowded = Math.min(prev, next) < 26;
    const hitR = clamp(Math.min(prev, next) / 2, 6, 15);
    const g = s('g', {
      class: 'mot-img', tabindex: '0', role: 'button', 'aria-pressed': 'false',
      'aria-label': `Image M${i}, date t = ${formatNumber(i)} × τ`,
      onclick: () => pick(i),
      onkeydown: (e) => onImgKey(e, i),
    },
    s('circle', { cx: X(x), cy: STRIP.rail, r: hitR, class: 'mot-hit' }),
    s('circle', { cx: X(x), cy: STRIP.rail, r: 7, class: 'mot-puck' }),
    s('circle', { cx: X(x), cy: STRIP.rail, r: 1.6, class: 'mot-center' }),
    s('text', { x: X(x), y: crowded && i % 2 ? STRIP.rail + 32 : STRIP.rail - 16, 'text-anchor': 'middle', class: 'mot-lbl' }, `M${i}`));
    svg.append(g);
    return g;
  });
  const live = s('circle', { cx: X(0), cy: STRIP.rail, r: 9, class: 'mot-live', opacity: 0 });
  svg.append(live);

  function onImgKey(e, i) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(i); return; }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const j = clamp(i + (e.key === 'ArrowRight' ? 1 : -1), 0, imgs.length - 1);
      imgs[j].focus();
    }
  }

  /* ----- Mesure ----- */
  const readSel = h('p', { class: 'mot-read' });
  const noteBtn = h('button', { type: 'button', class: 'btn btn--primary', disabled: true, onclick: note }, 'Noter dans le tableau');
  const clearSelBtn = h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => { sel = []; renderSel(); } }, 'Effacer la sélection');

  function distance(i, j) {
    const dCm = Math.abs(xs[j] - xs[i]) * 100;
    return Math.round(dCm / ruler.resCm) * ruler.resCm / 100;
  }

  function pick(i) {
    if (sel.length === 1 && sel[0] === i) sel = [];
    else if (sel.length === 1) sel = [sel[0], i];
    else sel = [i];
    renderSel();
  }

  function renderSel() {
    imgs.forEach((g, k) => {
      const on = sel.includes(k);
      g.setAttribute('aria-pressed', String(on));
      g.classList.toggle('is-sel', on);
    });
    measureG.replaceChildren();
    readSel.replaceChildren();
    if (!sel.length) {
      readSel.append('Clique sur une première image (origine de la mesure), puis sur une seconde.');
      noteBtn.disabled = true;
      return;
    }
    if (sel.length === 1) {
      readSel.append(`Origine de la mesure : M${sel[0]}. Clique maintenant sur une autre image.`);
      noteBtn.disabled = true;
      return;
    }
    const [i, j] = sel;
    const d = distance(i, j);
    const k = Math.abs(j - i);
    const xa = X(xs[Math.min(i, j)]); const xb = X(xs[Math.max(i, j)]);
    measureG.append(
      s('line', { x1: xa, x2: xb, y1: 28, y2: 28, class: 'mot-measure' }),
      s('line', { x1: xa, x2: xa, y1: 22, y2: 54, class: 'mot-measure' }),
      s('line', { x1: xb, x2: xb, y1: 22, y2: 54, class: 'mot-measure' }),
    );
    readSel.append(
      h('span', {}, `M${i} → M${j} : distance d = ${fixed(d * 100, Math.max(0, xDec - 2))} cm, soit ${fixed(d, xDec)} m.`),
      h('br'),
      h('span', {}, `Durée : ${k} × ${formatNumber(cfg.dt, 3)} s = ${formatNumber(k * cfg.dt, 4)} s.`),
    );
    const withOrigin = sel.includes(0);
    noteBtn.disabled = !withOrigin;
    if (!withOrigin) readSel.append(h('br'), h('span', { class: 'muted' }, 'Pour le tableau position-temps, mesure à partir de M0 (origine des positions et des dates).'));
  }

  function note() {
    if (sel.length !== 2 || !sel.includes(0)) return;
    const j = sel[0] === 0 ? sel[1] : sel[0];
    if (table.rows().some((r) => r.img === j)) { msg.set(`La position de M${j} est déjà dans le tableau.`, 'warn'); return; }
    const x = distance(0, j);
    table.add({ img: j, t: j * cfg.dt, x });
    const txt = `M${j} noté : t = ${formatNumber(j * cfg.dt, 4)} s ; x = ${fixed(x, xDec)} m.`;
    msg.set(txt, 'ok');
    announce(txt);
  }

  /* ----- Animation ----- */
  const chrono = createLcd({ name: 'Chronomètre', unit: 's', cls: 'mot-lcd' });
  const playBtn = h('button', { type: 'button', class: 'btn', 'aria-pressed': 'false', onclick: togglePlay }, 'Lecture');
  const loop = createLoop((dt) => {
    anim = { ...anim, t: Math.min(tEnd, anim.t + dt / slow) };
    showLive();
    if (anim.t >= tEnd) { anim = { ...anim, playing: false }; syncPlay(); return false; }
    return true;
  });

  function showLive() {
    const tShown = reduce ? Math.floor(anim.t / cfg.dt + 1e-9) * cfg.dt : anim.t;
    const idx = Math.round(tShown / cfg.dt);
    const xNow = reduce || Math.abs(tShown - idx * cfg.dt) < 1e-9 ? xs[Math.min(idx, xs.length - 1)] : law(tShown);
    live.setAttribute('cx', String(X(xNow)));
    live.setAttribute('opacity', anim.playing || anim.t > 0 ? '1' : '0');
    chrono.set(fixed(tShown, 2), 's');
  }

  function syncPlay() {
    playBtn.setAttribute('aria-pressed', String(anim.playing));
    playBtn.textContent = anim.playing ? 'Pause' : anim.t >= tEnd ? 'Rejouer' : anim.t > 0 ? 'Reprendre' : 'Lecture';
  }

  function togglePlay() {
    if (anim.playing) { loop.stop(); anim = { ...anim, playing: false }; }
    else {
      if (anim.t >= tEnd) anim = { ...anim, t: 0 };
      anim = { ...anim, playing: true };
      loop.start();
    }
    syncPlay();
    showLive();
  }

  /* ----- Exploitation ----- */
  const table = createMeasureTable({
    caption: 'Positions du mobile en fonction du temps',
    columns: [
      { label: 'image', value: (r) => `M${r.img}` },
      { label: 't (s)', value: (r) => formatNumber(r.t, 4) },
      { label: 'x (m)', value: (r) => fixed(r.x, xDec) },
    ],
    onChange: () => refreshGraph(),
  });
  const plot = createPlot({
    title: 'Graphique de la position x en fonction du temps t',
    x: { name: 't', unit: 's', lo: 0, hi: tEnd },
    y: { name: 'x', unit: 'm', lo: 0, hi: ruler.lengthCm / 100 },
  });
  let join = false;
  const joinBtn = h('button', { type: 'button', class: 'btn btn--ghost btn--small', 'aria-pressed': 'false', onclick: () => { join = !join; joinBtn.setAttribute('aria-pressed', String(join)); joinBtn.textContent = join ? 'Ne plus relier les points' : 'Relier les points'; refreshGraph(); } }, 'Relier les points');
  const fit = createOriginFit({ unit: 'm/s', onChange: () => refreshGraph() });

  function refreshGraph() {
    const pts = table.rows().map((r) => ({ x: r.t, y: r.x }));
    fit.setPoints(pts);
    plot.update({ points: pts, lines: fit.lines(), join });
  }

  const root = h('div', { class: 'pck mot' },
    h('p', { class: 'pck-intro' },
      `Les images du mobile ont été prises toutes les τ = ${formatNumber(cfg.dt, 3)} s. Utilise la règle : clique sur M0 puis sur une autre image pour mesurer sa position, et note-la dans le tableau.`),
    h('figure', { class: 'pck-bench mot-bench' }, svg,
      h('figcaption', { class: 'small muted' }, `Intervalle de temps entre deux images : τ = ${formatNumber(cfg.dt, 3)} s. Lecture de la règle à ${formatNumber(ruler.resCm)} cm près.`)),
    h('div', { class: 'mot-controls' },
      h('div', { class: 'pck-panel mot-anim' },
        h('h4', {}, 'Revoir le mouvement'),
        h('div', { class: 'btn-row' }, playBtn, chrono.el),
        h('p', { class: 'small muted' }, slow > 1 ? `Animation ralentie ×${slow}.` : 'Animation en temps réel.')),
      h('div', { class: 'pck-panel mot-tool' },
        h('h4', {}, 'Outil règle'),
        readSel,
        h('div', { class: 'btn-row' }, noteBtn, clearSelBtn),
        msg.el)),
    h('div', { class: 'pck-exploit' },
      h('section', { class: 'pck-panel' }, h('h4', {}, 'Tableau position-temps'), table.el),
      h('section', { class: 'pck-panel' }, h('h4', {}, 'Graphique x = f(t)'), plot.el,
        h('div', { class: 'btn-row' }, joinBtn), fit.el)));

  container.append(root);
  renderSel();
  syncPlay();
  showLive();
  refreshGraph();

  return () => { loop.stop(); root.remove(); };
}
