/**
 * Barres de fractions : chaque barre représente une unité. L'élève choisit le nombre de parts égales,
 * colorie des parts (souris, doigt, ou clavier : flèches + Espace), compare les longueurs coloriées
 * et redécoupe / regroupe une barre pour voir des fractions égales.
 * config : { fractions: ["2/3", "4/6"], maxDen (≤ 24) }
 */
import { h } from '../ui/dom.js';

const COLORS = ['var(--maths)', 'var(--pc)', 'var(--approfondissement)', 'var(--numerique)'];
const NAMES = ['A', 'B', 'C', 'D'];
const MAX_BARS = 4;
const K_CHOICES = [2, 3, 4, 5, 6, 8, 10, 12];

function toInt(v, fallback) {
  const txt = String(v ?? '').trim();
  const n = Number(txt);
  return txt !== '' && Number.isInteger(n) ? n : fallback;
}

function parseFraction(v) {
  const m = String(v ?? '').replace(/\s+/g, '').match(/^(\d+)(?:\/(\d+))?$/);
  if (!m) return null;
  const n = Number(m[1]); const d = m[2] === undefined ? 1 : Number(m[2]);
  return d > 0 ? { n, d } : null;
}

function readConfig(config) {
  let list = ['2/3', '4/6'];
  if (Array.isArray(config.fractions)) list = config.fractions;
  else if (typeof config.fractions === 'string') list = config.fractions.split(/[;,\s]+/);
  let targets = list.map(parseFraction).filter(Boolean).slice(0, MAX_BARS);
  if (!targets.length) targets = [null, null];
  const needed = Math.max(2, ...targets.map((t) => (t ? t.d : 2)));
  const maxDen = Math.min(24, Math.max(2, toInt(config.maxDen, 12), Math.min(24, needed)));
  return { targets, maxDen };
}

/** Fraction écrite verticalement (classes .m-frac de app.css), lisible par les lecteurs d'écran. */
function fracEl(n, d) {
  return h('span', { class: 'math fbar-frac' },
    h('span', { class: 'm-frac', 'aria-hidden': 'true' }, h('span', { class: 'm-numer' }, n), h('span', { class: 'm-denom' }, d)),
    h('span', { class: 'sr-only' }, `${n}/${d}`));
}

/** Pose une variable CSS (Object.assign sur style ne gère pas les propriétés personnalisées). */
function withVar(el, name, value) { el.style.setProperty(name, value); return el; }

const countOn = (bar) => bar.colored.filter(Boolean).length;
const label = (bar) => `${bar.name} (${countOn(bar)}/${bar.parts})`;
/** > 0 si la fraction coloriée de x est plus grande que celle de y (produits en croix, calcul exact). */
const cmpBars = (x, y) => countOn(x) * y.parts - countOn(y) * x.parts;

function verdictText(bars) {
  if (bars.length === 1) {
    const b = bars[0];
    return countOn(b) === b.parts ? `${label(b)} est égale à 1 : toute la barre est coloriée.`
      : `${label(b)} est plus petite que 1 : la barre n’est pas entièrement coloriée.`;
  }
  if (bars.length === 2) {
    const [x, y] = bars; const c = cmpBars(x, y);
    if (c === 0) return `${label(x)} et ${label(y)} sont égales : les parties coloriées s’arrêtent au même endroit.`;
    const [big, small] = c > 0 ? [x, y] : [y, x];
    return `${label(big)} est plus grande que ${label(small)} : sa partie coloriée va plus loin.`;
  }
  const sorted = [...bars].sort((x, y) => cmpBars(y, x));
  let txt = label(sorted[0]);
  for (let i = 1; i < sorted.length; i++) txt += ` ${cmpBars(sorted[i - 1], sorted[i]) === 0 ? '=' : '>'} ${label(sorted[i])}`;
  return `Du plus grand au plus petit : ${txt}.`;
}

export function mount(container, config = {}) {
  const { targets, maxDen } = readConfig(config || {});
  const ui = { compare: false };
  const status = h('p', { class: 'fbar-status small', 'aria-live': 'polite' });
  const verdict = h('p', { class: 'fbar-verdict', 'aria-live': 'polite', hidden: true });
  const history = h('ol', { class: 'log fbar-log', 'aria-label': 'Fractions égales trouvées', hidden: true });
  const setStatus = (msg) => { status.textContent = msg; };
  const invalidate = () => { verdict.hidden = true; verdict.textContent = ''; };

  const bars = targets.map((target, i) => makeBar(i, target));

  /* ---------- Une barre ---------- */
  function makeBar(i, target) {
    const bar = { name: NAMES[i], color: COLORS[i], target, parts: 1, colored: [false], focus: 0 };
    bar.num = h('input', {
      type: 'number', min: 1, max: maxDen, value: 1, inputmode: 'numeric', class: 'field-input fbar-num',
      'aria-label': `Nombre de parts de la barre ${bar.name}`,
      onchange: () => setParts(bar, toInt(bar.num.value, bar.parts)),
      onkeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); setParts(bar, toInt(bar.num.value, bar.parts)); } },
    });
    const minus = h('button', { type: 'button', class: 'btn btn--icon', 'aria-label': `Une part de moins (barre ${bar.name})`, onclick: () => setParts(bar, bar.parts - 1) }, '−');
    const plus = h('button', { type: 'button', class: 'btn btn--icon', 'aria-label': `Une part de plus (barre ${bar.name})`, onclick: () => setParts(bar, bar.parts + 1) }, '+');
    bar.track = h('div', { class: 'fbar-track', role: 'group' });
    bar.foot = h('div', { class: 'fbar-foot' });
    bar.el = withVar(h('div', { class: 'fbar-row' },
      h('div', { class: 'fbar-head' },
        h('span', { class: 'fbar-name' }, `Barre ${bar.name}`),
        target ? h('span', { class: 'fbar-target' }, 'à représenter : ', fracEl(target.n, target.d)) : null,
        h('span', { class: 'fbar-stepper', role: 'group', 'aria-label': `Découpage de la barre ${bar.name}` }, minus, bar.num, plus, h('span', { class: 'small muted' }, 'parts'))),
      bar.track, bar.foot), '--c', bar.color);
    return bar;
  }

  function renderTrack(bar) {
    const btns = bar.colored.map((on, i) => h('button', {
      type: 'button', class: 'fbar-part', 'aria-pressed': String(on), tabindex: i === bar.focus ? '0' : '-1',
      'aria-label': `Part ${i + 1} sur ${bar.parts}`,
      onclick: () => togglePart(bar, i),
      onkeydown: (e) => keyNav(bar, i, e),
    }));
    bar.track.setAttribute('aria-label', `Barre ${bar.name} découpée en ${bar.parts} part${bar.parts > 1 ? 's' : ''} égales. Flèches pour choisir une part, Espace pour la colorier.`);
    bar.marks = h('div', { class: 'fbar-marks', 'aria-hidden': 'true' });
    bar.track.replaceChildren(...btns, bar.marks);
    bar.track.style.setProperty('--n', String(bar.parts));
    bar.num.value = String(bar.parts);
    renderFoot(bar);
  }
  function renderFoot(bar) {
    bar.foot.replaceChildren(h('span', { class: 'muted small' }, 'Coloriée : '), fracEl(countOn(bar), bar.parts));
  }
  function renderMarks() {
    for (const host of bars) {
      if (!host.marks) continue;
      host.marks.replaceChildren(...(ui.compare ? bars.map((b) => withVar(h('span', {
        class: `fbar-mark${b === host ? ' is-own' : ''}`,
        style: { left: `${(countOn(b) / b.parts) * 100}%` },
      }, b === host ? h('span', { class: 'fbar-mark-label' }, b.name) : null), '--c', b.color)) : []));
    }
  }

  function togglePart(bar, i) {
    bar.colored = bar.colored.map((v, j) => (j === i ? !v : v));
    bar.focus = i;
    const btn = bar.track.children[i];
    btn.setAttribute('aria-pressed', String(bar.colored[i]));
    for (const [j, b] of [...bar.track.querySelectorAll('.fbar-part')].entries()) b.tabIndex = j === i ? 0 : -1;
    renderFoot(bar); renderMarks(); invalidate();
  }
  function keyNav(bar, i, e) {
    let next = null;
    if (e.key === 'ArrowRight') next = Math.min(bar.parts - 1, i + 1);
    else if (e.key === 'ArrowLeft') next = Math.max(0, i - 1);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = bar.parts - 1;
    if (next === null) return;
    e.preventDefault();
    bar.focus = next;
    const parts = bar.track.querySelectorAll('.fbar-part');
    parts.forEach((b, j) => { b.tabIndex = j === next ? 0 : -1; });
    parts[next].focus();
  }
  function setParts(bar, n) {
    const v = Math.max(1, Math.min(maxDen, Number.isInteger(n) ? n : bar.parts));
    if (v === bar.parts) { bar.num.value = String(bar.parts); if (n > maxDen) setStatus(`Au plus ${maxDen} parts.`); return; }
    const hadColor = countOn(bar) > 0;
    bar.parts = v; bar.colored = Array(v).fill(false); bar.focus = 0;
    renderTrack(bar); renderMarks(); invalidate();
    setStatus(`Barre ${bar.name} découpée en ${v} part${v > 1 ? 's' : ''}${hadColor ? ' : le coloriage a été effacé' : ''}.`);
  }
  /** Range les parts coloriées à gauche (sans changer leur nombre) pour lire la longueur coloriée. */
  function packAll() {
    let moved = false;
    for (const bar of bars) {
      const k = countOn(bar);
      const packed = bar.colored.map((_, i) => i < k);
      if (packed.some((v, i) => v !== bar.colored[i])) { bar.colored = packed; moved = true; renderTrack(bar); }
    }
    return moved;
  }

  /* ---------- Redécouper / regrouper ---------- */
  const barSelect = h('select', { class: 'field-input fbar-select' }, bars.map((b, i) => h('option', { value: String(i) }, `Barre ${b.name}`)));
  const kSelect = h('select', { class: 'field-input fbar-select' }, K_CHOICES.map((k) => h('option', { value: String(k) }, String(k))));
  const chosenBar = () => bars[toInt(barSelect.value, 0)] || bars[0];
  const addHistory = (text) => { history.hidden = false; history.append(h('li', {}, text)); };

  function recut() {
    const bar = chosenBar(); const k = toInt(kSelect.value, 2); const n0 = bar.parts; const k0 = countOn(bar);
    if (n0 * k > maxDen) { setStatus(`Impossible : ${n0} × ${k} = ${n0 * k} parts, c’est plus que le maximum (${maxDen}).`); return; }
    bar.colored = Array.from({ length: n0 * k }, (_, i) => bar.colored[Math.floor(i / k)]);
    bar.parts = n0 * k; bar.focus = 0;
    renderTrack(bar); renderMarks(); invalidate();
    addHistory(`Barre ${bar.name} : ${k0}/${n0} = ${k0 * k}/${n0 * k} (chaque part coupée en ${k})`);
    setStatus(`Barre ${bar.name} redécoupée : ${bar.parts} parts, ${countOn(bar)} coloriées. La longueur coloriée n’a pas changé.`);
  }
  function regroup() {
    const bar = chosenBar(); const k = toInt(kSelect.value, 2); const n0 = bar.parts; const k0 = countOn(bar);
    if (n0 % k !== 0) { setStatus(`Impossible : ${n0} n’est pas un multiple de ${k}, on ne peut pas faire des groupes de ${k} parts.`); return; }
    const groups = Array.from({ length: n0 / k }, (_, g) => bar.colored.slice(g * k, g * k + k));
    if (groups.some((grp) => grp.some((v) => v !== grp[0]))) {
      setStatus(`Impossible : un groupe de ${k} parts mélange des parts coloriées et non coloriées. Essaie le mode comparaison pour ranger les parts à gauche.`);
      return;
    }
    bar.colored = groups.map((grp) => grp[0]); bar.parts = n0 / k; bar.focus = 0;
    renderTrack(bar); renderMarks(); invalidate();
    addHistory(`Barre ${bar.name} : ${k0}/${n0} = ${k0 / k}/${n0 / k} (parts regroupées par ${k})`);
    setStatus(`Barre ${bar.name} regroupée : ${bar.parts} parts, ${countOn(bar)} coloriées. La longueur coloriée n’a pas changé.`);
  }

  /* ---------- Comparaison ---------- */
  const compareBox = h('input', { type: 'checkbox', onchange: () => setCompare(compareBox.checked) });
  function setCompare(on) {
    ui.compare = on; compareBox.checked = on;
    const moved = on ? packAll() : false;
    renderMarks();
    if (on) setStatus(moved ? 'Mode comparaison : les parts coloriées ont été rangées à gauche ; un trait marque la fin de chaque fraction.' : 'Mode comparaison : un trait marque la fin de chaque fraction.');
  }
  function compareNow() {
    setCompare(true);
    verdict.textContent = verdictText(bars);
    verdict.hidden = false;
  }
  function reset() {
    for (const bar of bars) { bar.parts = 1; bar.colored = [false]; bar.focus = 0; renderTrack(bar); }
    setCompare(false); invalidate();
    history.replaceChildren(); history.hidden = true;
    setStatus('Les barres sont revenues entières, sans coloriage.');
  }

  container.append(h('div', { class: 'fbar' },
    h('p', { class: 'muted small' }, 'Chaque barre représente une unité. Choisis le nombre de parts égales, puis clique sur les parts pour les colorier (au clavier : Tab jusqu’à la barre, flèches ← →, Espace).'),
    h('div', { class: 'fbar-bars' }, bars.map((b) => b.el)),
    h('div', { class: 'fbar-tools' },
      h('div', { class: 'btn-row' },
        h('label', { class: 'check-inline' }, compareBox, 'Mode comparaison'),
        h('button', { type: 'button', class: 'btn btn--primary btn--small', onclick: compareNow }, 'Comparer'),
        h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: reset }, 'Réinitialiser')),
      verdict, status,
      h('fieldset', { class: 'fbar-recut' },
        h('legend', {}, 'Redécouper ou regrouper'),
        bars.length > 1 ? h('label', { class: 'fbar-inline' }, 'Barre', barSelect) : null,
        h('label', { class: 'fbar-inline' }, 'k =', kSelect),
        h('div', { class: 'btn-row' },
          h('button', { type: 'button', class: 'btn btn--small', onclick: recut }, 'Couper chaque part en k'),
          h('button', { type: 'button', class: 'btn btn--small btn--ghost', onclick: regroup }, 'Regrouper les parts par k'))),
      history)));

  for (const bar of bars) renderTrack(bar);
  renderMarks();

  return () => { /* aucun écouteur global ni minuterie : rien à libérer */ };
}
