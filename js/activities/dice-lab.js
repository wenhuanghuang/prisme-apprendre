/**
 * Lancers de dés : simulation par paquets (1 à 10 000) avec un générateur cryptographique sans biais,
 * histogramme des fréquences (avec 2 dés : des sommes), probabilité théorique affichable sur demande,
 * courbe de la fréquence d'un résultat en fonction du nombre de lancers, tableau effectifs / fréquences.
 * config : { faces (4 à 20), dice (1 ou 2), event (texte décrivant l'événement étudié) }
 */
import { h } from '../ui/dom.js';
import { formatNumber } from '../core/expr.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const MAX_TOTAL = 1000000;
const BATCHES = [[1, '1 lancer'], [10, '10'], [100, '100'], [1000, '1 000'], [10000, '10 000']];
const Y_STEPS = [0.01, 0.02, 0.05, 0.1, 0.2, 0.25];
const HH = 260; const CH = 220;
const ML = 50; const MR = 14; const MT = 14; const MB = 38;

function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) el.setAttribute(k, String(v));
  for (const c of children) if (c !== null && c !== undefined) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
}
const toInt = (v, fallback) => {
  const txt = String(v ?? '').trim();
  const n = Number(txt);
  return txt !== '' && Number.isFinite(n) ? Math.round(n) : fallback;
};
const fix3 = (x) => x.toFixed(3).replace('.', ',');
const fmtN = (n) => formatNumber(n, 0);

/** Entier uniforme dans [0, n[ : rejet des tirages au-delà du dernier multiple de n (aucun biais de modulo). */
function makeRng() {
  const buf = new Uint32Array(2048); let idx = buf.length;
  return (n) => {
    const limit = Math.floor(0x100000000 / n) * n;
    for (;;) {
      if (idx >= buf.length) { crypto.getRandomValues(buf); idx = 0; }
      const v = buf[idx++];
      if (v < limit) return v % n;
    }
  };
}

/** Échelle verticale « ronde » : au plus 5 graduations. */
function yScale(maxVal) {
  for (const step of Y_STEPS) {
    const n = Math.ceil((maxVal - 1e-12) / step);
    if (n <= 5) return { step, top: Math.max(1, n) * step };
  }
  return { step: 0.25, top: 1 };
}
function niceInt(raw) {
  if (raw <= 1) return 1;
  const p = 10 ** Math.floor(Math.log10(raw));
  for (const m of [1, 2, 5]) if (m * p >= raw) return m * p;
  return 10 * p;
}

function readConfig(cfg) {
  const faces = Math.max(4, Math.min(20, toInt(cfg.faces, 6)));
  const dice = toInt(cfg.dice, 1) === 2 ? 2 : 1;
  const event = typeof cfg.event === 'string' ? cfg.event.trim().slice(0, 140) : '';
  const lo = dice; const hi = dice * faces;
  const m = event.match(/\d+/);
  const fromEvent = m ? Number(m[0]) : NaN;
  const tracked = fromEvent >= lo && fromEvent <= hi ? fromEvent : (dice === 1 ? faces : faces + 1);
  return { faces, dice, event, lo, hi, tracked };
}

export function mount(container, config = {}) {
  const { faces, dice, event, lo, hi, tracked: tracked0 } = readConfig(config || {});
  const values = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  const ways = (v) => (dice === 1 ? 1 : faces - Math.abs(v - (faces + 1)));
  const outcomes = dice === 1 ? faces : faces * faces;
  const prob = (v) => ways(v) / outcomes;
  const probTxt = (v) => `${ways(v)}/${outcomes}`;
  const word = dice === 1 ? 'Résultat' : 'Somme';
  const rng = makeRng();
  const st = { counts: values.map(() => 0), seq: new Uint8Array(4096), total: 0, last: null, tracked: tracked0, showProb: false, liveTimer: 0 };

  /* ---------- Interface ---------- */
  const batchBtns = BATCHES.map(([n, txt]) => h('button', {
    type: 'button', class: `btn btn--small${n === 1 ? ' btn--primary' : ''}`,
    'aria-label': n === 1 ? 'Lancer une fois' : `Lancer ${txt} fois`, onclick: () => roll(n),
  }, n === 1 ? txt : `× ${txt}`));
  const probBox = h('input', { type: 'checkbox', onchange: () => { st.showProb = probBox.checked; render(); } });
  const trackSel = h('select', { class: 'field-input dice-select', onchange: () => { st.tracked = Number(trackSel.value); render(); } },
    values.map((v) => h('option', { value: String(v), selected: v === st.tracked }, String(v))));
  const resetBtn = h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: reset }, 'Réinitialiser');
  const lastBox = h('div', { class: 'dice-last', 'aria-hidden': 'true' });
  const readout = h('div', { class: 'lab-readout dice-readout' });
  const live = h('p', { class: 'sr-only', 'aria-live': 'polite' });
  const hist = s('svg', { viewBox: `0 0 640 ${HH}`, class: 'lab-svg dice-hist', role: 'img' });
  const curve = s('svg', { viewBox: `0 0 640 ${CH}`, class: 'lab-svg dice-curve', role: 'img' });
  const curveTitle = h('p', { class: 'dice-title' });
  const tableHost = h('div', { class: 'dice-table-wrap' });

  const setup = dice === 1 ? `Un dé équilibré à ${faces} faces (numérotées de 1 à ${faces}).`
    : `Deux dés équilibrés à ${faces} faces : on note la somme des deux résultats (de 2 à ${2 * faces}).`;
  container.append(h('div', { class: 'dice' },
    h('p', { class: 'muted small' }, setup),
    event ? h('p', { class: 'dice-event' }, h('span', { class: 'muted' }, 'Événement étudié : '), `« ${event} »`) : null,
    h('div', { class: 'lab-grid' },
      h('div', { class: 'dice-main' },
        h('p', { class: 'dice-title' }, `Fréquence de chaque ${word.toLowerCase()}`),
        hist,
        curveTitle, curve),
      h('div', { class: 'lab-controls' },
        h('div', { class: 'dice-throw', role: 'group', 'aria-label': 'Lancer les dés' }, batchBtns),
        lastBox, readout, live,
        h('label', { class: 'check-inline' }, probBox, 'Montrer la probabilité'),
        h('label', {}, `${word} suivi${dice === 1 ? '' : 'e'} sur la courbe`, trackSel),
        resetBtn)),
    h('details', { class: 'dice-details', open: true }, h('summary', {}, 'Tableau des effectifs et des fréquences'), tableHost)));

  /* ---------- Simulation ---------- */
  function ensureCapacity(n) {
    if (n <= st.seq.length) return;
    let size = st.seq.length;
    while (size < n) size *= 2;
    const next = new Uint8Array(Math.min(size, MAX_TOTAL));
    next.set(st.seq.subarray(0, st.total));
    st.seq = next;
  }
  function roll(n) {
    const k = Math.min(n, MAX_TOTAL - st.total);
    if (k <= 0) return;
    ensureCapacity(st.total + k);
    const counts = st.counts.slice();
    let f1 = 0; let f2 = 0;
    for (let i = 0; i < k; i++) {
      f1 = rng(faces) + 1;
      f2 = dice === 2 ? rng(faces) + 1 : 0;
      const v = f1 + f2;
      st.seq[st.total + i] = v;
      counts[v - lo] += 1;
    }
    st.counts = counts; st.total += k; st.last = dice === 2 ? [f1, f2] : [f1];
    renderLast(n === 1);
    render();
    clearTimeout(st.liveTimer);
    st.liveTimer = setTimeout(() => {
      live.textContent = `${fmtN(k)} lancer${k > 1 ? 's' : ''} de plus, ${fmtN(st.total)} au total. Fréquence de ${st.tracked} : ${fix3(freq(st.tracked))}.`;
    }, 300);
  }
  const freq = (v) => (st.total ? st.counts[v - lo] / st.total : 0);

  function reset() {
    st.counts = values.map(() => 0); st.total = 0; st.last = null;
    lastBox.replaceChildren();
    render();
    live.textContent = 'Tous les lancers ont été effacés.';
  }

  /* ---------- Rendu ---------- */
  function renderLast(animate) {
    if (!st.last) { lastBox.replaceChildren(); return; }
    const facesEls = st.last.map((f) => h('span', { class: `dice-face${animate ? ' is-rolling' : ''}` }, String(f)));
    const parts = dice === 2 ? [facesEls[0], h('span', { class: 'dice-op' }, '+'), facesEls[1], h('span', { class: 'dice-op' }, '='), h('b', {}, String(st.last[0] + st.last[1]))] : facesEls;
    lastBox.replaceChildren(h('span', { class: 'muted small' }, 'Dernier lancer :'), ...parts);
  }

  /** Largeur du viewBox = largeur affichée (bornée) : le texte des graphiques garde sa taille réelle sur tablette et téléphone. */
  function measureWidth() {
    const px = hist.getBoundingClientRect().width;
    st.w = px ? Math.round(Math.max(340, Math.min(640, px))) : 640;
    hist.setAttribute('viewBox', `0 0 ${st.w} ${HH}`);
    curve.setAttribute('viewBox', `0 0 ${st.w} ${CH}`);
  }

  function render() {
    measureWidth();
    const full = st.total >= MAX_TOTAL;
    for (const b of batchBtns) b.disabled = full;
    const c = st.counts[st.tracked - lo];
    readout.textContent = `Lancers : ${fmtN(st.total)}\n« ${st.tracked} » : ${fmtN(c)} fois${st.total ? `, fréquence ${fix3(freq(st.tracked))}` : ''}${full ? '\n(limite atteinte)' : ''}`;
    renderHistogram();
    renderCurve();
    renderTable();
  }

  function yAxis(svg, W, top, step, Y) {
    for (let i = 0; i * step <= top + 1e-9; i++) {
      const v = i * step; const y = Y(v);
      svg.append(s('line', { x1: ML, y1: y, x2: W - MR, y2: y, class: v === 0 ? 'dice-axis' : 'dice-gridline' }),
        s('text', { x: ML - 6, y: y + 4, 'text-anchor': 'end', class: 'dice-tick' }, formatNumber(Math.round(v * 100) / 100, 2)));
    }
  }

  function renderHistogram() {
    const HW = st.w; const plotW = HW - ML - MR; const plotH = HH - MT - MB;
    const freqs = values.map(freq);
    const maxProb = Math.max(...values.map(prob));
    const { step, top } = yScale(Math.max(...freqs, st.showProb || !st.total ? maxProb : 0, 0.01));
    const Y = (f) => MT + plotH - (Math.min(f, top) / top) * plotH;
    const slot = plotW / values.length; const bw = Math.max(4, slot * 0.68);
    hist.replaceChildren();
    yAxis(hist, HW, top, step, Y);
    const labelEvery = slot >= 18 ? 1 : slot >= 9 ? 2 : 4;
    values.forEach((v, i) => {
      const x = ML + i * slot + (slot - bw) / 2; const y = Y(freqs[i]);
      const bar = s('rect', { x: x.toFixed(1), y: y.toFixed(1), width: bw.toFixed(1), height: Math.max(0, MT + plotH - y).toFixed(1), class: `dice-bar${v === st.tracked ? ' is-tracked' : ''}` });
      bar.addEventListener('click', () => { st.tracked = v; trackSel.value = String(v); render(); });
      hist.append(bar);
      if ((v - lo) % labelEvery === 0) hist.append(s('text', { x: (x + bw / 2).toFixed(1), y: HH - MB + 16, 'text-anchor': 'middle', class: `dice-tick${v === st.tracked ? ' is-tracked' : ''}` }, String(v)));
    });
    hist.append(s('text', { x: ML + plotW / 2, y: HH - 6, 'text-anchor': 'middle', class: 'dice-axis-title' }, word));
    if (st.showProb) drawProbOnHistogram(Y, slot, bw);
    const best = values.reduce((m, v) => (freq(v) > freq(m) ? v : m), values[0]);
    hist.setAttribute('aria-label', st.total
      ? `Histogramme des fréquences après ${fmtN(st.total)} lancers. Fréquence la plus haute : ${best} (${fix3(freq(best))}). Le détail est dans le tableau.`
      : 'Histogramme vide : aucun lancer pour l’instant.');
  }

  function drawProbOnHistogram(Y, slot, bw) {
    const HW = st.w;
    if (dice === 1) {
      const y = Y(prob(lo));
      hist.append(s('line', { x1: ML, y1: y, x2: HW - MR, y2: y, class: 'dice-prob' }),
        s('text', { x: HW - MR - 4, y: y - 6, 'text-anchor': 'end', class: 'dice-prob-label' }, `probabilité : ${probTxt(lo)} ≈ ${fix3(prob(lo))}`));
      return;
    }
    values.forEach((v, i) => {
      const x = ML + i * slot + (slot - bw) / 2 - 3; const y = Y(prob(v));
      hist.append(s('line', { x1: x, y1: y, x2: x + bw + 6, y2: y, class: 'dice-prob' }));
    });
    hist.append(s('text', { x: HW - MR - 4, y: MT + 10, 'text-anchor': 'end', class: 'dice-prob-label' }, '— probabilité de chaque somme'));
  }

  function curvePoints(target) {
    const N = st.total; const pts = [];
    if (!N) return pts;
    const nPts = Math.min(N, 600);
    let c = 0; let k = 1; let mark = Math.round(N / nPts);
    for (let i = 0; i < N; i++) {
      if (st.seq[i] === target) c += 1;
      while (i + 1 >= mark && k <= nPts) { pts.push([i + 1, c / (i + 1)]); k += 1; mark = Math.round((k * N) / nPts); }
    }
    return pts;
  }

  function renderCurve() {
    const v = st.tracked; const p = prob(v);
    curveTitle.textContent = `Fréquence de « ${v} » en fonction du nombre de lancers`;
    const CW = st.w; const plotW = CW - ML - MR; const plotH = CH - MT - MB;
    const { step, top } = yScale(Math.min(1, Math.max(0.1, 3 * p)));
    const N = Math.max(st.total, 10);
    const X = (n) => ML + (n / N) * plotW;
    const Y = (f) => MT + plotH - (Math.min(f, top) / top) * plotH;
    curve.replaceChildren();
    yAxis(curve, CW, top, step, Y);
    const xs = niceInt(N / (CW < 480 ? 3 : 5));
    for (let n = xs; n <= N; n += xs) {
      curve.append(s('line', { x1: X(n), y1: MT + plotH, x2: X(n), y2: MT + plotH + 4, class: 'dice-axis' }),
        s('text', { x: X(n), y: CH - MB + 16, 'text-anchor': X(n) > CW - MR - 24 ? 'end' : 'middle', class: 'dice-tick' }, fmtN(n)));
    }
    curve.append(s('text', { x: ML + plotW / 2, y: CH - 6, 'text-anchor': 'middle', class: 'dice-axis-title' }, 'nombre de lancers'));
    if (st.showProb) {
      curve.append(s('line', { x1: ML, y1: Y(p), x2: CW - MR, y2: Y(p), class: 'dice-prob' }),
        s('text', { x: CW - MR - 4, y: Y(p) - 6, 'text-anchor': 'end', class: 'dice-prob-label' }, `probabilité : ${probTxt(v)} ≈ ${fix3(p)}`));
    }
    const pts = curvePoints(v);
    if (pts.length) curve.append(s('polyline', { points: pts.map(([n, f]) => `${X(n).toFixed(1)},${Y(f).toFixed(1)}`).join(' '), class: 'dice-line' }));
    curve.setAttribute('aria-label', st.total
      ? `Courbe de la fréquence de ${v} : après ${fmtN(st.total)} lancers, elle vaut ${fix3(freq(v))}.`
      : 'Courbe vide : aucun lancer pour l’instant.');
  }

  function renderTable() {
    const head = [word, 'Effectif', 'Fréquence', ...(st.showProb ? ['Probabilité'] : [])];
    const rows = values.map((v) => h('tr', { class: v === st.tracked ? 'is-tracked' : null },
      h('th', { scope: 'row' }, String(v)),
      h('td', {}, fmtN(st.counts[v - lo])),
      h('td', {}, st.total ? fix3(freq(v)) : '—'),
      st.showProb ? h('td', {}, `${probTxt(v)} ≈ ${fix3(prob(v))}`) : null));
    tableHost.replaceChildren(h('table', { class: 'lab-table dice-table' },
      h('caption', { class: 'sr-only' }, 'Effectifs et fréquences de chaque résultat'),
      h('thead', {}, h('tr', {}, head.map((t) => h('th', { scope: 'col' }, t)))),
      h('tbody', {}, rows),
      h('tfoot', {}, h('tr', {}, h('th', { scope: 'row' }, 'Total'), h('td', {}, fmtN(st.total)), h('td', {}, st.total ? '1' : '—'), st.showProb ? h('td', {}, '1') : null))));
  }

  render();
  let ro = null;
  if (typeof ResizeObserver === 'function') {
    // Rendu différé au cadre suivant : redessiner change la hauteur du SVG observé (pas de boucle ResizeObserver).
    ro = new ResizeObserver(() => {
      cancelAnimationFrame(st.roRaf);
      st.roRaf = requestAnimationFrame(() => {
        const px = hist.getBoundingClientRect().width;
        if (px && Math.abs(Math.max(340, Math.min(640, px)) - st.w) >= 16) render();
      });
    });
    ro.observe(hist);
  }
  return () => { clearTimeout(st.liveTimer); cancelAnimationFrame(st.roRaf); if (ro) ro.disconnect(); };
}
