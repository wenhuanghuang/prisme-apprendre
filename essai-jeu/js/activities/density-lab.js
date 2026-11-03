/**
 * Laboratoire « Masse volumique » : balance électronique (coupelle, tare, 0,1 g) et éprouvette graduée
 * (déplacement d'eau, lecture au bas du ménisque). Masses et volumes des objets ne sont jamais affichés :
 * l'élève relève la masse, lit V1 et V2, puis exploite m = f(V).
 * Un objet moins dense que l'eau flotte : il ne déplace alors que m / ρeau ; il faut l'enfoncer avec une tige fine.
 */
import { h, announce } from '../ui/dom.js';
import { formatNumber } from '../core/expr.js';
import {
  s, num, clamp, fixed, parseReading, createMessage, createMeasureTable, createPlot, createOriginFit,
  createScaleLoupe, nextId,
} from './pc-kit.js';

const RHO_WATER = 1; // g/cm³
const COUPELLE = 4.3; // g
const CAPACITY = 610; // g, portée de la balance

const DEFAULT_OBJECTS = [
  { id: 'cube', label: 'Cube gris', mass: 21.6, volume: 8 },
  { id: 'cyl', label: 'Cylindre doré', mass: 85, volume: 10 },
  { id: 'caillou', label: 'Caillou', mass: 31.2, volume: 12 },
  { id: 'bouchon', label: 'Bouchon', mass: 2.4, volume: 10 },
];

const CYLINDERS = [
  { cap: 100, minor: 1, major: 5, label: 10, v0: 50, d: 2.7 },
  { cap: 250, minor: 2, major: 10, label: 20, v0: 100, d: 3.7 },
  { cap: 500, minor: 5, major: 10, label: 50, v0: 200, d: 5 },
  { cap: 1000, minor: 10, major: 50, label: 100, v0: 500, d: 6.5 },
];

const REFERENCE = [
  ['liège', '0,24'], ['bois de chêne', '0,7'], ['glace', '0,92'], ['eau', '1,00'], ['PVC', '1,4'], ['verre', '2,5'],
  ['aluminium', '2,7'], ['granite', '2,7'], ['fer', '7,9'], ['laiton', '8,5'], ['cuivre', '8,9'], ['plomb', '11,3'],
];

const SHAPES = ['cube', 'caillou', 'cylindre', 'bille'];

function readObjects(list) {
  const src = Array.isArray(list) && list.length ? list : DEFAULT_OBJECTS;
  return src.map((o, i) => {
    const label = String(o.label ?? `Objet ${i + 1}`);
    const mass = Math.max(0.1, num(o.mass, 10));
    const volume = Math.max(0.1, num(o.volume, 5));
    return { id: String(o.id ?? `obj${i + 1}`), label, mass, volume, shape: shapeOf(label, i), mat: materialOf(mass / volume) };
  });
}

function shapeOf(label, i) {
  const t = label.toLowerCase();
  if (/bille|sph[eè]re|boule/.test(t)) return 'bille';
  if (/cube/.test(t)) return 'cube';
  if (/cylindre|tube|tige|vis|écrou|ecrou/.test(t)) return 'cylindre';
  if (/bouchon/.test(t)) return 'bouchon';
  if (/caillou|pierre|roche/.test(t)) return 'caillou';
  return SHAPES[i % SHAPES.length];
}

function materialOf(rho) {
  if (rho >= 7) return 'dense';
  if (rho >= 2) return 'mineral';
  if (rho >= 1) return 'plastic';
  return 'wood';
}

function pickCylinder(objs, water) {
  const maxV = Math.max(...objs.map((o) => o.volume));
  const fits = (c, v0) => v0 + maxV <= 0.92 * c.cap && v0 >= c.cap * 0.1;
  const w = num(water, NaN);
  if (Number.isFinite(w)) {
    const c = CYLINDERS.find((cc) => fits(cc, w));
    if (c) return { ...c, v0: Math.round(w / c.minor) * c.minor };
  }
  return CYLINDERS.find((c) => fits(c, c.v0)) || CYLINDERS[CYLINDERS.length - 1];
}

/** Dessin d'un objet posé : bas centré en (cx, bottom), taille caractéristique size (px). */
function drawObject(o, cx, bottom, size) {
  const g = s('g', { class: `dens-obj dens-mat-${o.mat}` });
  const z = size;
  switch (o.shape) {
    case 'bille':
      g.append(s('circle', { cx, cy: bottom - z / 2, r: z / 2 }), s('circle', { cx: cx - z * 0.17, cy: bottom - z * 0.68, r: z * 0.1, class: 'dens-shine' }));
      break;
    case 'cylindre':
      g.append(
        s('path', { d: `M ${cx - z * 0.4} ${bottom - z * 1.05} V ${bottom - z * 0.08} A ${z * 0.4} ${z * 0.08} 0 0 0 ${cx + z * 0.4} ${bottom - z * 0.08} V ${bottom - z * 1.05} Z` }),
        s('ellipse', { cx, cy: bottom - z * 1.05, rx: z * 0.4, ry: z * 0.08, class: 'dens-top' }));
      break;
    case 'bouchon':
      g.append(s('path', { d: `M ${cx - z * 0.5} ${bottom - z * 0.85} H ${cx + z * 0.5} L ${cx + z * 0.4} ${bottom} H ${cx - z * 0.4} Z` }));
      break;
    case 'caillou':
      g.append(s('path', {
        d: `M ${cx - z * 0.55} ${bottom - z * 0.1} C ${cx - z * 0.65} ${bottom - z * 0.6} ${cx - z * 0.2} ${bottom - z * 0.95} ${cx + z * 0.15} ${bottom - z * 0.85}`
          + ` C ${cx + z * 0.6} ${bottom - z * 0.75} ${cx + z * 0.65} ${bottom - z * 0.25} ${cx + z * 0.45} ${bottom - z * 0.05}`
          + ` C ${cx + z * 0.2} ${bottom + z * 0.02} ${cx - z * 0.3} ${bottom + z * 0.02} ${cx - z * 0.55} ${bottom - z * 0.1} Z`,
      }));
      break;
    default: // cube vu légèrement de dessus
      g.append(
        s('rect', { x: cx - z / 2, y: bottom - z, width: z, height: z }),
        s('path', { d: `M ${cx - z / 2} ${bottom - z} l ${z * 0.18} ${-z * 0.14} h ${z} l ${-z * 0.18} ${z * 0.14} Z`, class: 'dens-top' }),
        s('path', { d: `M ${cx + z / 2} ${bottom} v ${-z} l ${z * 0.18} ${-z * 0.14} v ${z} Z`, class: 'dens-side' }));
  }
  return g;
}

function objectHeight(o, size) {
  return { bille: 1, cylindre: 1.13, bouchon: 0.85, caillou: 0.9, cube: 1.14 }[o.shape] * size;
}

export function mount(container, config = {}) {
  const objs = readObjects(config.objects);
  const cyl = pickCylinder(objs, config.water);
  let st = { sel: 0, place: 'paillasse', pushed: false, coupelle: false, tare: 0, m: null };

  const msg = createMessage();
  const sel = () => objs[st.sel];
  const floats = (o) => o.mass / o.volume < RHO_WATER;

  /* ----- Balance ----- */
  const balSvg = s('svg', { class: 'lab-svg dens-balance', viewBox: '0 40 260 165', role: 'img', 'aria-label': 'Balance électronique' });
  const balDynamic = s('g');
  const balDigits = s('text', { x: 136, y: 169, 'text-anchor': 'end', class: 'dens-bal-digits' }, '0,0');
  balSvg.append(
    s('path', { d: 'M 20 128 H 240 L 250 196 H 10 Z', class: 'dens-bal-body' }),
    s('rect', { x: 118, y: 116, width: 24, height: 12, class: 'dens-bal-stem' }),
    s('rect', { x: 46, y: 109, width: 168, height: 8, rx: 3, class: 'dens-bal-plate' }),
    s('rect', { x: 28, y: 142, width: 126, height: 38, rx: 4, class: 'pck-lcd-svg' }),
    balDigits,
    s('text', { x: 141, y: 169, class: 'dens-bal-unit' }, 'g'),
    s('rect', { x: 170, y: 148, width: 30, height: 24, rx: 5, class: 'dens-bal-key' }),
    s('text', { x: 185, y: 165, 'text-anchor': 'middle', class: 'dens-bal-keytxt' }, 'T'),
    s('rect', { x: 206, y: 148, width: 30, height: 24, rx: 5, class: 'dens-bal-key' }),
    s('text', { x: 221, y: 165, 'text-anchor': 'middle', class: 'dens-bal-keytxt' }, 'I/O'),
    s('text', { x: 28, y: 192, class: 'dens-bal-spec' }, `Portée ${CAPACITY} g — précision 0,1 g`),
    balDynamic,
  );

  function balanceReading() {
    const gross = (st.coupelle ? COUPELLE : 0) + (st.place === 'balance' ? sel().mass : 0);
    if (gross > CAPACITY) return null;
    const v = Math.round((gross - st.tare) * 10) / 10;
    return { value: Object.is(v, -0) ? 0 : v, text: fixed(v, 1) };
  }

  /* ----- Éprouvette ----- */
  const Y0 = 300; const YCAP = 44; // fond intérieur et niveau de la capacité
  const yOf = (v) => Y0 - (v / cyl.cap) * (Y0 - YCAP);
  const pxPerCm = 44 / cyl.d;
  const cylSvg = s('svg', {
    class: 'lab-svg dens-cyl', viewBox: '24 0 122 324', role: 'img',
    'aria-label': `Éprouvette graduée de ${cyl.cap} mL, graduée tous les ${formatNumber(cyl.minor)} mL`,
  });
  const cylDynamic = s('g');
  const ticks = s('g', { class: 'dens-ticks', 'aria-hidden': 'true' });
  const tickGap = ((Y0 - YCAP) / cyl.cap) * cyl.minor;
  for (let v = cyl.label; v <= cyl.cap + 1e-9; v += cyl.minor) {
    const vv = Math.round(v * 1000) / 1000;
    const isLabel = Math.abs(vv / cyl.label - Math.round(vv / cyl.label)) < 1e-6;
    const isMajor = Math.abs(vv / cyl.major - Math.round(vv / cyl.major)) < 1e-6;
    if (!isMajor && tickGap < 2) continue;
    const len = isLabel ? 16 : isMajor ? 11 : 6;
    ticks.append(s('line', { x1: 64, x2: 64 + len, y1: yOf(vv), y2: yOf(vv), class: isLabel ? 'dens-tick-l' : 'dens-tick' }));
    if (isLabel) ticks.append(s('text', { x: 56, y: yOf(vv) + 3.5, 'text-anchor': 'end', class: 'dens-tick-txt' }, formatNumber(vv)));
  }
  cylSvg.append(
    s('rect', { x: 60, y: 18, width: 52, height: 286, rx: 4, class: 'dens-glass' }),
    cylDynamic,
    ticks,
    s('text', { x: 92, y: 36, 'text-anchor': 'middle', class: 'dens-tick-txt' }, 'mL'),
    s('path', { d: 'M 60 304 V 22 Q 60 16 54 14 M 112 304 V 18', class: 'dens-glass-edge' }),
    s('rect', { x: 34, y: 304, width: 104, height: 12, rx: 4, class: 'dens-foot' }),
  );

  const loupe = createScaleLoupe({
    title: 'Vue rapprochée du ménisque', minor: cyl.minor, major: cyl.major, label: cyl.label,
    span: cyl.minor * 12, kind: 'meniscus',
  });

  function level() {
    const o = sel();
    if (st.place !== 'eprouvette') return cyl.v0;
    return cyl.v0 + (floats(o) && !st.pushed ? o.mass / RHO_WATER : o.volume);
  }

  /* ----- Commandes ----- */
  const objName = nextId('dens-obj');
  const chooser = h('fieldset', { class: 'pck-choice dens-chooser' }, h('legend', {}, 'Objet étudié'));
  const chooserRow = h('div', { class: 'pck-choice-row' });
  objs.forEach((o, i) => {
    chooserRow.append(h('label', { class: 'pck-choice-opt' },
      h('input', { type: 'radio', name: objName, value: o.id, checked: i === 0, onchange: () => selectObject(i) }),
      h('span', {}, o.label)));
  });
  chooser.append(chooserRow);

  const btnCoupelle = h('button', { type: 'button', class: 'btn btn--ghost btn--small', 'aria-pressed': 'false', onclick: () => { st = { ...st, coupelle: !st.coupelle }; render(); } }, 'Poser la coupelle');
  const btnOnBalance = h('button', { type: 'button', class: 'btn btn--ghost btn--small', 'aria-pressed': 'false', onclick: toggleBalance }, 'Poser l’objet');
  const btnTare = h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: tare }, 'Tarer (T)');
  const btnNoteMass = h('button', { type: 'button', class: 'btn btn--small', onclick: noteMass }, 'Relever la masse affichée');
  const btnInCyl = h('button', { type: 'button', class: 'btn btn--ghost btn--small', 'aria-pressed': 'false', onclick: toggleCylinder }, 'Plonger l’objet');
  const btnPush = h('button', { type: 'button', class: 'btn btn--ghost btn--small', 'aria-pressed': 'false', hidden: true, onclick: () => { st = { ...st, pushed: !st.pushed }; render(); } }, 'Enfoncer avec une tige fine');

  const v1Id = nextId('dens-v1'); const v2Id = nextId('dens-v2');
  const inV1 = h('input', { id: v1Id, class: 'field-input dens-in', type: 'text', inputmode: 'decimal', autocomplete: 'off', placeholder: 'ex. 50' });
  const inV2 = h('input', { id: v2Id, class: 'field-input dens-in', type: 'text', inputmode: 'decimal', autocomplete: 'off', placeholder: 'ex. 58,5' });
  const massOut = h('output', { class: 'dens-mass-out' }, '— g');
  const formTitle = h('h4', {}, 'Fiche de mesure');
  const btnAdd = h('button', { type: 'button', class: 'btn btn--primary', onclick: addRow }, 'Ajouter au tableau');

  function selectObject(i) {
    st = { ...st, sel: i, place: 'paillasse', pushed: false, m: null };
    inV2.value = '';
    msg.set(`${objs[i].label} : posé sur la paillasse.`);
    render();
  }

  function toggleBalance() {
    const wasIn = st.place === 'eprouvette';
    st = { ...st, place: st.place === 'balance' ? 'paillasse' : 'balance', pushed: false };
    msg.set(st.place === 'balance' ? (wasIn ? 'Objet sorti de l’éprouvette et posé sur la balance (pense à l’essuyer).' : 'Objet posé sur la balance.') : 'Objet retiré de la balance.');
    render();
  }

  function toggleCylinder() {
    const o = sel();
    st = { ...st, place: st.place === 'eprouvette' ? 'paillasse' : 'eprouvette', pushed: false };
    if (st.place === 'eprouvette' && floats(o)) {
      msg.set('L’objet flotte : il n’est pas entièrement immergé, l’eau ne monte donc pas de tout son volume. Enfonce-le avec une tige fine (son volume est négligeable).', 'warn');
    } else {
      msg.set(st.place === 'eprouvette' ? 'Objet plongé délicatement dans l’éprouvette.' : 'Objet sorti de l’éprouvette.');
    }
    render();
  }

  function tare() {
    const gross = (st.coupelle ? COUPELLE : 0) + (st.place === 'balance' ? sel().mass : 0);
    st = { ...st, tare: gross };
    msg.set('Balance tarée : elle affiche maintenant 0,0 g.');
    render();
  }

  function noteMass() {
    const r = balanceReading();
    if (st.place !== 'balance') { msg.set('Pose d’abord l’objet sur la balance.', 'warn'); return; }
    if (!r) { msg.set('La balance est en surcharge.', 'warn'); return; }
    st = { ...st, m: { value: r.value, text: r.text } };
    const forgot = st.coupelle && st.tare < COUPELLE - 0.05;
    msg.set(forgot ? `Masse relevée : ${r.text} g. Attention : la coupelle n’a pas été tarée, sa masse est comprise dans la lecture.` : `Masse relevée : ${r.text} g.`, forgot ? 'warn' : 'ok');
    render();
  }

  function addRow() {
    const o = sel();
    const v1 = parseReading(inV1.value); const v2 = parseReading(inV2.value);
    if (!st.m) { msg.set('Relève d’abord la masse de l’objet sur la balance.', 'warn'); return; }
    if (!Number.isFinite(v1) || !Number.isFinite(v2) || v1 < 0 || v2 < 0) {
      msg.set('Écris les deux volumes lus, en mL (par exemple 50 ou 57,5).', 'warn');
      (Number.isFinite(v1) ? inV2 : inV1).focus();
      return;
    }
    if (v2 <= v1) { msg.set('V2 doit être plus grand que V1 : l’objet immergé fait monter le niveau de l’eau.', 'warn'); return; }
    const notes = [];
    const tol = cyl.minor * 1.01;
    if (Math.abs(v1 - cyl.v0) > tol) notes.push('ta lecture de V1 semble éloignée du niveau initial : relis au bas du ménisque, l’œil à sa hauteur');
    const vFloat = cyl.v0 + o.mass / RHO_WATER; const vSunk = cyl.v0 + o.volume;
    if (floats(o) && Math.abs(v2 - vFloat) <= tol && Math.abs(v2 - vSunk) > tol) notes.push('V2 a été lu alors que l’objet flottait : il n’était pas entièrement immergé');
    else if (Math.abs(v2 - vSunk) > tol) notes.push('ta lecture de V2 semble éloignée du niveau avec l’objet immergé : relis-la');
    const n = table.add({ label: o.label, series: st.sel, m: st.m.value, mTxt: st.m.text, v1, v2 });
    const base = `Mesure n° ${n} ajoutée (${o.label}).`;
    msg.set(notes.length ? `${base} Attention : ${notes.join(' ; ')}.` : base, notes.length ? 'warn' : 'ok');
    announce(base);
    st = { ...st, m: null };
    inV2.value = '';
    render();
  }

  /* ----- Exploitation ----- */
  const table = createMeasureTable({
    caption: 'Mesures de masse et de volumes',
    columns: [
      { label: 'objet', value: (r) => r.label },
      { label: 'm (g)', value: (r) => r.mTxt },
      { label: 'V1 (mL)', value: (r) => formatNumber(r.v1, 2) },
      { label: 'V2 (mL)', value: (r) => formatNumber(r.v2, 2) },
    ],
    onChange: () => refreshGraph(),
  });
  const plot = createPlot({
    title: 'Graphique de la masse m en fonction du volume V = V2 − V1',
    x: { name: 'V = V2 − V1', unit: 'cm³', lo: 0, hi: 10 },
    y: { name: 'm', unit: 'g', lo: 0, hi: 50 },
  });
  const fit = createOriginFit({
    unit: 'g/cm³', minPoints: 1, lineLabel: 'Tracer les droites passant par l’origine',
    onChange: () => refreshGraph(),
  });

  function refreshGraph() {
    const pts = table.rows().map((r) => ({ x: r.v2 - r.v1, y: r.m, series: r.series, seriesName: r.label }));
    fit.setPoints(pts);
    plot.update({ points: pts, lines: fit.lines() });
  }

  /* ----- Rendu ----- */
  function render() {
    const o = sel();
    // balance
    balDynamic.replaceChildren();
    let bottom = 109;
    if (st.coupelle) {
      balDynamic.append(s('path', { d: 'M 84 97 H 176 L 166 109 H 94 Z', class: 'dens-coupelle' }));
      bottom = 97;
    }
    if (st.place === 'balance') balDynamic.append(drawObject(o, 130, bottom, clamp(Math.cbrt(o.volume) * 13, 9, 46)));
    const r = balanceReading();
    balDigits.textContent = r ? r.text : 'OL';
    balSvg.setAttribute('aria-label', `Balance électronique : l’écran affiche ${r ? `${r.text} g` : 'une surcharge'}${st.coupelle ? ', coupelle posée' : ''}${st.place === 'balance' ? `, ${o.label} sur le plateau` : ''}.`);

    // éprouvette
    cylDynamic.replaceChildren();
    const lv = level(); const yl = yOf(lv);
    const size = clamp(Math.cbrt(o.volume) * pxPerCm * 1.05, 8, 40);
    const hgt = objectHeight(o, size);
    const water = s('path', { d: `M 64 ${yl - 3} Q 86 ${yl + 3} 108 ${yl - 3} V ${Y0} H 64 Z`, class: 'dens-water' });
    cylDynamic.append(water);
    if (st.place === 'eprouvette') {
      let objBottom = Y0;
      if (floats(o) && !st.pushed) objBottom = Math.min(Y0, yl + hgt * (o.mass / o.volume));
      else if (floats(o) && st.pushed) objBottom = Math.min(Y0, yl + hgt + 22);
      cylDynamic.append(drawObject(o, 86, objBottom, size));
      if (floats(o) && st.pushed) cylDynamic.append(s('line', { x1: 86, x2: 86, y1: 4, y2: objBottom - hgt, class: 'dens-rod' }));
    }
    cylDynamic.append(s('path', { d: `M 64 ${yl - 3} Q 86 ${yl + 3} 108 ${yl - 3}`, class: 'dens-surface' }));
    loupe.update(lv);

    // boutons
    btnCoupelle.setAttribute('aria-pressed', String(st.coupelle));
    btnCoupelle.textContent = st.coupelle ? 'Retirer la coupelle' : 'Poser la coupelle';
    btnOnBalance.setAttribute('aria-pressed', String(st.place === 'balance'));
    btnOnBalance.textContent = st.place === 'balance' ? 'Retirer l’objet' : 'Poser l’objet';
    btnInCyl.setAttribute('aria-pressed', String(st.place === 'eprouvette'));
    btnInCyl.textContent = st.place === 'eprouvette' ? 'Sortir l’objet' : 'Plonger l’objet';
    btnPush.hidden = !(st.place === 'eprouvette' && floats(o));
    btnPush.setAttribute('aria-pressed', String(st.pushed));
    btnPush.textContent = st.pushed ? 'Relâcher la tige' : 'Enfoncer avec une tige fine';
    massOut.textContent = st.m ? `${st.m.text} g` : '— g';
    formTitle.textContent = `Fiche de mesure — ${o.label}`;
  }

  const root = h('div', { class: 'pck dens' },
    h('p', { class: 'pck-intro' }, 'Choisis un objet. Mesure sa masse avec la balance (pense à la tare), puis son volume par déplacement d’eau : lis le niveau V1 avant, et V2 après avoir immergé l’objet.'),
    chooser,
    h('div', { class: 'dens-bench' },
      h('section', { class: 'pck-panel dens-bal-panel' },
        h('h4', {}, 'Balance électronique'),
        balSvg,
        h('div', { class: 'btn-row' }, btnCoupelle, btnOnBalance, btnTare),
        h('div', { class: 'btn-row' }, btnNoteMass)),
      h('section', { class: 'pck-panel dens-cyl-panel' },
        h('h4', {}, 'Éprouvette graduée'),
        h('div', { class: 'dens-cyl-row' }, cylSvg, loupe.el),
        h('div', { class: 'btn-row' }, btnInCyl, btnPush),
        h('p', { class: 'small muted' }, 'Lis le niveau au bas du ménisque, l’œil à sa hauteur. 1 mL = 1 cm³.')),
      h('section', { class: 'pck-panel dens-form' },
        formTitle,
        h('div', { class: 'dens-form-grid' },
          h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Masse m relevée'), massOut),
          h('div', { class: 'field' }, h('label', { class: 'field-label', for: v1Id }, 'V1 lu (mL), sans l’objet'), inV1),
          h('div', { class: 'field' }, h('label', { class: 'field-label', for: v2Id }, 'V2 lu (mL), objet immergé'), inV2)),
        h('div', { class: 'btn-row' }, btnAdd),
        msg.el)),
    h('div', { class: 'pck-exploit' },
      h('section', { class: 'pck-panel' }, h('h4', {}, 'Tableau de mesures'), table.el),
      h('section', { class: 'pck-panel' }, h('h4', {}, 'Graphique m = f(V)'), plot.el, fit.el,
        h('details', { class: 'pck-ref small' },
          h('summary', {}, 'Masses volumiques de quelques matériaux'),
          h('table', { class: 'lab-table' },
            h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'matériau'), h('th', { scope: 'col' }, 'ρ (g/cm³)'))),
            h('tbody', {}, REFERENCE.map(([n, v]) => h('tr', {}, h('td', {}, n), h('td', {}, v)))))))));

  container.append(root);
  render();
  refreshGraph();
  return () => { root.remove(); };
}
