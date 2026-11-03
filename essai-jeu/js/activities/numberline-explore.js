/**
 * Sauts sur la droite graduée : un pion part de `start` et se déplace par sauts (nombres relatifs).
 * L'élève applique les sauts proposés ou un saut libre, peut prédire l'arrivée AVANT de lancer
 * la suite de sauts, et lit chaque déplacement sous forme d'addition dans le journal.
 * config : { min, max, start, moves }  (moves : liste de sauts proposés, ex. [3, -5])
 */
import { h } from '../ui/dom.js';
import { formatNumber } from '../core/expr.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const W = 720; const H = 170; const PAD = 36; const AXIS_Y = 118;
const MAX_ARCS = 8;

function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) el.setAttribute(k, String(v));
  for (const c of children) if (c !== null && c !== undefined) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
}

/** Lit un nombre écrit à la française (virgule, signe moins typographique) ; renvoie `fallback` sinon. */
function toNumber(v, fallback) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
  if (typeof v !== 'string') return fallback;
  const t = v.trim().replace(/[−–]/g, '-').replace(',', '.').replace(/\s+/g, '');
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(t)) return fallback;
  return Number(t);
}
const round6 = (x) => Math.round(x * 1e6) / 1e6;
const fmt = (v) => formatNumber(v, 3);
const signed = (v) => (v > 0 ? `+${fmt(v)}` : fmt(v));
const term = (v) => (v < 0 ? `(${fmt(v)})` : fmt(v));
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2);

function readConfig(config) {
  let min = toNumber(config.min, -10); let max = toNumber(config.max, 10);
  if (!(max > min)) { min = -10; max = 10; }
  const start = Math.min(max, Math.max(min, toNumber(config.start, 0)));
  let raw = [3, -5];
  if (Array.isArray(config.moves)) raw = config.moves;
  else if (typeof config.moves === 'string') raw = config.moves.split(/[;\s]+/);
  const moves = raw.map((m) => toNumber(m, NaN)).filter((m) => Number.isFinite(m) && m !== 0).slice(0, 8);
  return { min, max, start, moves };
}

function niceStep(raw) {
  const p = 10 ** Math.floor(Math.log10(raw));
  for (const m of [1, 2, 5]) if (m * p >= raw - 1e-12) return m * p;
  return 10 * p;
}

function drawAxis(svg, { min, max }, xOf) {
  const g = s('g', { class: 'nlx-axis', 'aria-hidden': 'true' });
  g.append(s('line', { x1: PAD - 16, y1: AXIS_Y, x2: W - PAD + 12, y2: AXIS_Y, class: 'nl-axis' }));
  g.append(s('path', { d: `M${W - PAD + 6},${AXIS_Y - 5} L${W - PAD + 14},${AXIS_Y} L${W - PAD + 6},${AXIS_Y + 5}`, class: 'nl-arrow' }));
  const range = max - min;
  // Pas des étiquettes selon leur largeur (~8 px par caractère à 14 px) pour qu'elles ne se touchent jamais.
  // Deux passes : la largeur dépend du pas choisi (« 0,05 » est plus long que « 2 »).
  const stepFor = (chars) => niceStep(range / Math.max(4, Math.floor((W - 2 * PAD) / (chars * 8 + 6))));
  let st = stepFor(Math.max(fmt(min).length, fmt(max).length));
  st = stepFor(Math.max(fmt(min).length, fmt(max).length, fmt(round6(max - st)).length, fmt(round6(min + st)).length));
  let minor = st >= 1 && range <= 60 ? 1 : st / 5;
  if (range / minor > 80) minor = st / 2;
  if (range / minor > 80) minor = st;
  for (let v = Math.ceil(min / minor - 1e-9) * minor; v <= max + 1e-9; v = round6(v + minor)) {
    const major = Math.abs(v / st - Math.round(v / st)) < 1e-6;
    const x = xOf(v);
    g.append(s('line', { x1: x, y1: AXIS_Y - (major ? 8 : 4), x2: x, y2: AXIS_Y + (major ? 8 : 4), class: major ? 'nl-tick nl-tick--major' : 'nl-tick' }));
    if (major) g.append(s('text', { x, y: AXIS_Y + 28, 'text-anchor': 'middle', class: `nl-label${Math.abs(v) < 1e-9 ? ' nl-zero' : ''}` }, fmt(round6(v))));
  }
  svg.append(g);
}

/** Arc de saut (courbe de Bézier) avec pointe de flèche et étiquette du saut. */
function makeArc(x1, x2, d) {
  const y0 = AXIS_Y - 3;
  const hgt = Math.max(18, Math.min(70, Math.abs(x2 - x1) * 0.4));
  const xm = (x1 + x2) / 2; const cy = y0 - 2 * hgt;
  const path = s('path', { d: `M${x1},${y0} Q${xm},${cy} ${x2},${y0}`, class: 'nlx-arc-path' });
  let dx = x2 - xm; let dy = y0 - cy;
  const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
  const bx = x2 - dx * 10; const by = y0 - dy * 10;
  const head = s('path', { d: `M${x2},${y0} L${bx - dy * 5},${by + dx * 5} L${bx + dy * 5},${by - dx * 5} Z`, class: 'nlx-arc-head' });
  const label = s('text', { x: xm, y: y0 - hgt - 8, 'text-anchor': 'middle', class: 'nlx-arc-label' }, signed(d));
  const g = s('g', { class: `nlx-arc ${d > 0 ? 'is-plus' : 'is-minus'}`, 'aria-hidden': 'true' }, path, head, label);
  return { g, path, head, label };
}

export function mount(container, config = {}) {
  const cfg = readConfig(config || {});
  const { min, max, start, moves } = cfg;
  const xOf = (v) => PAD + ((v - min) / (max - min)) * (W - 2 * PAD);
  const st = { pos: start, pending: start, queue: [], busy: false, raf: 0, disposed: false, jumps: [], prediction: null, phase: 'free' };

  /* ---------- Figure ---------- */
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'nlx-svg', role: 'img' });
  drawAxis(svg, cfg, xOf);
  const predLayer = s('g', { 'aria-hidden': 'true' });
  const arcLayer = s('g');
  const startMark = s('circle', { cx: xOf(start), cy: AXIS_Y, r: 5, class: 'nlx-start', 'aria-hidden': 'true' });
  const pawn = s('g', { class: 'nlx-pawn', 'aria-hidden': 'true' }, s('circle', { r: 10 }), s('circle', { r: 3.5, class: 'nlx-pawn-core' }));
  svg.append(predLayer, arcLayer, startMark, pawn);
  const placePawn = (x, y = AXIS_Y) => pawn.setAttribute('transform', `translate(${x} ${y})`);
  placePawn(xOf(start));

  /* ---------- Lectures ---------- */
  const readout = h('div', { class: 'lab-readout nlx-readout' });
  const status = h('p', { class: 'nlx-status small', 'aria-live': 'polite' });
  const log = h('ol', { class: 'log nlx-log', 'aria-label': 'Journal des sauts' });

  /* ---------- Commandes ---------- */
  const moveBtns = moves.map((m) => h('button', {
    type: 'button', class: `btn btn--small nlx-move ${m > 0 ? 'is-plus' : 'is-minus'}`,
    'aria-label': `Sauter de ${m > 0 ? 'plus' : 'moins'} ${fmt(Math.abs(m))}`, onclick: () => requestJump(m),
  }, signed(m)));
  const seqLabel = moves.map(signed).join(' puis ');
  const seqBtn = moves.length ? h('button', { type: 'button', class: 'btn btn--small', onclick: runSequence }, `Enchaîner : ${seqLabel}`) : null;
  const helpId = `nlx-help-${Math.random().toString(36).slice(2, 8)}`;
  const freeInput = h('input', { type: 'text', class: 'field-input nlx-free-input', autocomplete: 'off', spellcheck: 'false', placeholder: 'ex. −4', 'aria-describedby': helpId });
  const freeBtn = h('button', { type: 'submit', class: 'btn btn--small' }, 'Sauter');
  const freeForm = h('form', { class: 'nlx-free', onsubmit: (e) => { e.preventDefault(); freeJump(); } },
    h('label', { class: 'nlx-free-label' }, 'Saut libre', freeInput), freeBtn);

  const predInput = h('input', { type: 'text', class: 'field-input nlx-pred-input', autocomplete: 'off', spellcheck: 'false' });
  const predSave = h('button', { type: 'submit', class: 'btn btn--small btn--primary' }, 'Enregistrer ma prédiction');
  const predNote = h('p', { class: 'small muted nlx-pred-note' });
  const predForm = h('form', { class: 'nlx-pred-form', onsubmit: (e) => { e.preventDefault(); savePrediction(); } },
    h('label', {}, `Le pion part de ${fmt(start)} et fait les sauts ${seqLabel}. Il arrivera en :`, predInput), predSave);
  const predPanel = h('div', { class: 'nlx-pred-panel', hidden: true }, predForm, predNote);
  const predToggle = moves.length ? h('button', {
    type: 'button', class: 'btn btn--ghost btn--small', 'aria-expanded': 'false', onclick: togglePrediction,
  }, 'Prédire l’arrivée') : null;
  const resetBtn = h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: reset }, 'Réinitialiser');


  container.append(h('div', { class: 'nlx' },
    h('p', { class: 'muted small' }, 'Le pion se déplace par sauts : vers la droite pour un nombre positif, vers la gauche pour un nombre négatif.'),
    h('div', { class: 'nlx-stage' }, svg),
    readout,
    h('div', { class: 'lab-grid nlx-grid' },
      h('div', { class: 'lab-controls' },
        moves.length ? h('div', { class: 'nlx-block' }, h('p', { class: 'nlx-title' }, 'Sauts proposés'),
          h('div', { class: 'btn-row', role: 'group', 'aria-label': 'Sauts proposés' }, moveBtns, seqBtn)) : null,
        h('div', { class: 'nlx-block' }, freeForm, h('p', { id: helpId, class: 'small muted' }, 'Un nombre relatif, par exemple −4 ou 2,5.')),
        predToggle ? h('div', { class: 'nlx-block' }, predToggle, predPanel) : null,
        status),
      h('div', { class: 'nlx-journal' }, h('p', { class: 'nlx-title' }, 'Journal'), log, h('div', { class: 'btn-row' }, resetBtn)))));

  /* ---------- Logique ---------- */
  function setStatus(msg) { status.textContent = msg; }
  function render() {
    readout.textContent = `Position du pion : ${fmt(st.pos)}   ·   déplacement depuis le départ : ${signed(round6(st.pos - start))}`;
    svg.setAttribute('aria-label', `Droite graduée de ${fmt(min)} à ${fmt(max)}. Départ en ${fmt(start)}. Pion en ${fmt(st.pos)}.`);
    const locked = st.phase === 'predicted' || st.phase === 'running';
    for (const b of moveBtns) b.disabled = locked;
    freeInput.disabled = locked; freeBtn.disabled = locked;
    if (seqBtn) seqBtn.disabled = st.phase === 'running';
  }
  function addLog(text, cls = '') { log.append(h('li', { class: cls }, text)); log.scrollTop = log.scrollHeight; }

  function inRange(v) { return v >= min - 1e-9 && v <= max + 1e-9; }
  function requestJump(d) {
    const target = round6(st.pending + d);
    if (!inRange(target)) { setStatus(`Le saut ${signed(d)} ferait sortir le pion de la droite graduée (de ${fmt(min)} à ${fmt(max)}).`); return false; }
    st.pending = target; st.queue.push(d); pump();
    return true;
  }
  function pump() {
    if (st.busy || !st.queue.length || st.disposed) return;
    st.busy = true;
    const d = st.queue.shift();
    const from = st.pos; const to = round6(from + d);
    for (const old of arcLayer.children) old.classList.add('is-old');
    while (arcLayer.children.length >= MAX_ARCS) arcLayer.firstChild.remove();
    const arc = makeArc(xOf(from), xOf(to), d);
    arcLayer.append(arc.g);
    animate(arc, xOf(to), () => {
      st.pos = to; st.jumps.push(d); st.busy = false;
      addLog(`${fmt(from)} + ${term(d)} = ${fmt(to)}`);
      setStatus(`Saut de ${signed(d)} : le pion passe de ${fmt(from)} à ${fmt(to)}.`);
      if (!st.queue.length) afterQueue();
      render(); pump();
    });
  }
  function animate(arc, toX, done) {
    const len = typeof arc.path.getTotalLength === 'function' ? arc.path.getTotalLength() : 0;
    if (reducedMotion() || !len || document.hidden) { placePawn(toX); done(); return; }
    arc.path.style.strokeDasharray = `${len}`; arc.path.style.strokeDashoffset = `${len}`;
    arc.head.style.opacity = '0'; arc.label.style.opacity = '0';
    const dur = Math.min(1100, 450 + len * 1.1);
    const t0 = performance.now();
    const step = (now) => {
      if (st.disposed) return;
      const t = Math.min(1, (now - t0) / dur); const e = ease(t);
      arc.path.style.strokeDashoffset = `${len * (1 - e)}`;
      const p = arc.path.getPointAtLength(len * e);
      placePawn(p.x, p.y + 3);
      if (t < 1) { st.raf = requestAnimationFrame(step); return; }
      arc.path.style.strokeDasharray = ''; arc.path.style.strokeDashoffset = '';
      arc.head.style.opacity = ''; arc.label.style.opacity = '';
      placePawn(toX); done();
    };
    st.raf = requestAnimationFrame(step);
  }

  function freeJump() {
    const d = toNumber(freeInput.value, NaN);
    if (!Number.isFinite(d) || d === 0) { setStatus('Écris un nombre relatif non nul, par exemple −4 ou 2,5.'); freeInput.focus(); return; }
    if (requestJump(round6(d))) freeInput.value = '';
  }

  function runSequence() {
    let p = st.pending;
    for (const m of moves) { p = round6(p + m); if (!inRange(p)) { setStatus(`La suite de sauts ferait sortir le pion de la droite graduée (de ${fmt(min)} à ${fmt(max)}). Réinitialise d’abord.`); return; } }
    // Toute la suite est mise en file AVANT de démarrer : sans animation (mouvement réduit), les sauts
    // s'exécutent de façon synchrone et le bilan ne doit venir qu'après le dernier.
    st.seqStart = st.pending; st.seqPending = true;
    if (st.phase === 'predicted') st.phase = 'running';
    for (const m of moves) { st.pending = round6(st.pending + m); st.queue.push(m); }
    render();
    pump();
  }
  function afterQueue() {
    if (!st.seqPending) return;
    st.seqPending = false;
    addLog(`Bilan : ${fmt(st.seqStart)} + ${moves.map(term).join(' + ')} = ${fmt(st.pos)}`, 'nlx-log-sum');
    if (st.phase === 'running') compare();
  }
  function compare() {
    st.phase = 'compared';
    const diff = round6(Math.abs(st.pos - st.prediction));
    const msg = diff === 0
      ? `Prédiction juste : le pion arrive en ${fmt(st.pos)}, comme tu l’avais prévu.`
      : `Le pion arrive en ${fmt(st.pos)} ; tu avais prévu ${fmt(st.prediction)} (écart de ${fmt(diff)}).`;
    predNote.textContent = msg;
    predNote.classList.toggle('is-ok', diff === 0);
    setStatus(msg);
  }

  function togglePrediction() {
    const open = predPanel.hidden;
    predPanel.hidden = !open;
    predToggle.setAttribute('aria-expanded', String(open));
    if (open) refreshPredictionPanel();
    if (open && !predInput.disabled) predInput.focus();
  }
  function refreshPredictionPanel() {
    const canPredict = st.jumps.length === 0 && !st.queue.length && st.prediction === null;
    predInput.disabled = !canPredict; predSave.disabled = !canPredict;
    if (!canPredict && st.prediction === null) predNote.textContent = 'La prédiction se fait avant le premier saut : réinitialise pour recommencer.';
  }
  function savePrediction() {
    if (st.jumps.length || st.queue.length) { refreshPredictionPanel(); return; }
    const v = toNumber(predInput.value, NaN);
    if (!Number.isFinite(v)) { predNote.textContent = 'Écris un nombre, par exemple −2.'; predInput.focus(); return; }
    st.prediction = round6(v); st.phase = 'predicted';
    predInput.disabled = true; predSave.disabled = true;
    predNote.classList.remove('is-ok');
    predNote.textContent = `Prédiction enregistrée : ${fmt(st.prediction)}. Clique sur « Enchaîner » pour vérifier.`;
    drawPrediction();
    render();
    if (seqBtn) seqBtn.focus();
  }
  function drawPrediction() {
    predLayer.replaceChildren();
    if (st.prediction === null) return;
    const v = Math.max(min, Math.min(max, st.prediction));
    const x = xOf(v);
    predLayer.append(
      s('line', { x1: x, y1: 26, x2: x, y2: AXIS_Y + 10, class: 'nlx-pred-line' }),
      s('text', { x, y: 18, 'text-anchor': 'middle', class: 'nlx-pred-label' }, inRange(st.prediction) ? 'prédiction' : 'prédiction (hors de la droite)'));
  }

  function reset() {
    cancelAnimationFrame(st.raf);
    Object.assign(st, { pos: start, pending: start, queue: [], busy: false, jumps: [], prediction: null, phase: 'free', seqPending: false });
    arcLayer.replaceChildren(); predLayer.replaceChildren(); log.replaceChildren();
    placePawn(xOf(start));
    addLog(`Départ : ${fmt(start)}`);
    predInput.value = ''; predNote.textContent = ''; predNote.classList.remove('is-ok');
    refreshPredictionPanel();
    setStatus('Le pion est revenu au départ.');
    render();
  }

  addLog(`Départ : ${fmt(start)}`);
  render();

  return () => {
    st.disposed = true;
    cancelAnimationFrame(st.raf);
    st.queue = [];
  };
}
