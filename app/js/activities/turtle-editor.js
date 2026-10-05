/**
 * Atelier de programmation « Tortue » : éditeur par blocs ET éditeur texte, qui produisent le même langage.
 * On commence avec les blocs, on passe au texte quand on est prêt (programmation visuelle puis textuelle).
 */
import { h, clear } from '../ui/dom.js';
import { runProgram, parseProgram, TurtleError } from '../core/turtle.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const BLOCKS = {
  avance: { label: 'avancer de', arg: 50, cls: 'b-move' },
  recule: { label: 'reculer de', arg: 50, cls: 'b-move' },
  droite: { label: 'tourner à droite de', arg: 90, unit: '°', cls: 'b-turn' },
  gauche: { label: 'tourner à gauche de', arg: 90, unit: '°', cls: 'b-turn' },
  repete: { label: 'répéter', arg: 4, unit: 'fois', cls: 'b-loop', container: true },
  leve: { label: 'lever le stylo', cls: 'b-pen' },
  pose: { label: 'poser le stylo', cls: 'b-pen' },
};
const KW = { avance: 'avance', recule: 'recule', droite: 'droite', gauche: 'gauche', repete: 'répète', leve: 'lève', pose: 'pose' };

export function serialize(blocks, indent = '') {
  return blocks.map((b) => {
    if (b.op === 'repete') return `${indent}répète ${b.arg} [\n${serialize(b.body, indent + '  ')}\n${indent}]`;
    return BLOCKS[b.op].arg !== undefined ? `${indent}${KW[b.op]} ${b.arg}` : `${indent}${KW[b.op]}`;
  }).join('\n');
}

/** Convertit un programme texte en blocs si possible (sinon null : on reste en mode texte). */
export function toBlocks(src) {
  let parsed;
  try { parsed = parseProgram(src); } catch { return null; }
  const conv = (list) => {
    const out = [];
    for (const st of list) {
      if (st.op === 'noop') return null;
      if (!BLOCKS[st.op]) return null;
      const b = { op: st.op };
      if (BLOCKS[st.op].arg !== undefined) {
        if (!st.arg || st.arg.node.t !== 'num') return null;
        b.arg = st.arg.node.v;
      }
      if (st.op === 'repete') { const body = conv(st.body); if (!body) return null; b.body = body; }
      out.push(b);
    }
    return out;
  };
  return conv(parsed.program);
}

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

/** Zone de dessin : modèle en pointillés, dessin de l'élève par-dessus. */
export function createCanvas() {
  const svg = svgEl('svg', { class: 'turtle-svg', viewBox: '-150 -150 300 300', role: 'img', 'aria-label': 'Dessin de la tortue' });
  const draw = ({ target = [], student = [], turtle = null, fit = null }) => {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const all = fit ? [...target, ...fit] : [...target, ...student];
    let minX = -60; let maxX = 60; let minY = -60; let maxY = 60;
    for (const sg of all) { minX = Math.min(minX, sg.x1, sg.x2); maxX = Math.max(maxX, sg.x1, sg.x2); minY = Math.min(minY, sg.y1, sg.y2); maxY = Math.max(maxY, sg.y1, sg.y2); }
    const m = 20; const w = Math.max(maxX - minX, maxY - minY) + 2 * m;
    const cx = (minX + maxX) / 2; const cy = (minY + maxY) / 2;
    svg.setAttribute('viewBox', `${cx - w / 2} ${-cy - w / 2} ${w} ${w}`);
    const sw = w / 220;
    for (const sg of target) svg.append(svgEl('line', { x1: sg.x1, y1: -sg.y1, x2: sg.x2, y2: -sg.y2, class: 'tt-target', 'stroke-width': sw * 3 }));
    for (const sg of student) svg.append(svgEl('line', { x1: sg.x1, y1: -sg.y1, x2: sg.x2, y2: -sg.y2, stroke: sg.color, 'stroke-width': sw * 2.2, 'stroke-linecap': 'round' }));
    const t = turtle || { x: 0, y: 0, heading: 0 };
    const tri = svgEl('path', { d: `M ${8 * sw} 0 L ${-5 * sw} ${5 * sw} L ${-5 * sw} ${-5 * sw} Z`, class: 'tt-turtle', transform: `translate(${t.x} ${-t.y}) rotate(${-t.heading})` });
    svg.append(tri);
  };
  draw({});
  return { el: svg, draw };
}

export function createCodeEditor({ start = '', target = '', mode = 'both', onRun } = {}) {
  let blocks = toBlocks(start || '') || [];
  let current = mode === 'text' || (start && !toBlocks(start)) ? 'text' : 'blocks';
  let insertTarget = null; // bloc « répète » sélectionné pour y insérer
  let locked = false;
  const canvas = createCanvas();
  const msg = h('p', { class: 'turtle-msg', 'aria-live': 'polite' });
  const textarea = h('textarea', { class: 'code-text', rows: 10, spellcheck: 'false', 'aria-label': 'Programme (texte)' }, start);
  const blockList = h('div', { class: 'blocks', role: 'list', 'aria-label': 'Programme (blocs)' });
  let targetSegs = [];
  try { targetSegs = target ? runProgram(target).segments : []; } catch { targetSegs = []; }

  const program = () => (current === 'text' ? textarea.value : serialize(blocks));

  const run = () => {
    try {
      const r = runProgram(program());
      canvas.draw({ target: targetSegs, student: r.segments, turtle: r });
      msg.className = 'turtle-msg';
      msg.textContent = `${r.instructions} instruction(s), ${r.segments.length} segment(s) tracé(s).`;
      if (onRun) onRun(r);
    } catch (e) {
      msg.className = 'turtle-msg warn';
      msg.textContent = e instanceof TurtleError ? e.message : 'Programme illisible.';
      canvas.draw({ target: targetSegs, student: [] });
    }
  };

  const renderBlocks = () => {
    clear(blockList);
    const renderList = (list, depth) => {
      list.forEach((b, i) => {
        const def = BLOCKS[b.op];
        const arg = def.arg !== undefined ? h('input', {
          type: 'number', class: 'block-arg', value: b.arg, step: 'any', 'aria-label': `${def.label} (valeur)`,
          oninput: (e) => { const v = Number(e.target.value); if (Number.isFinite(v)) { b.arg = v; run(); } },
        }) : null;
        const row = h('div', { class: `block ${def.cls} ${insertTarget === b ? 'is-target' : ''}`, role: 'listitem', style: { marginLeft: `${depth * 22}px` } },
          h('span', { class: 'block-label' }, def.label), arg, def.unit ? h('span', { class: 'block-unit' }, def.unit) : null,
          h('span', { class: 'block-tools' },
            def.container ? h('button', { type: 'button', class: 'btn btn--icon', title: 'Insérer dans cette boucle', 'aria-label': 'Insérer les prochains blocs dans cette boucle', 'aria-pressed': insertTarget === b ? 'true' : 'false', onclick: () => { insertTarget = insertTarget === b ? null : b; renderBlocks(); } }, '⤵') : null,
            h('button', { type: 'button', class: 'btn btn--icon', 'aria-label': 'Monter', disabled: i === 0, onclick: () => { [list[i - 1], list[i]] = [list[i], list[i - 1]]; renderBlocks(); run(); } }, '↑'),
            h('button', { type: 'button', class: 'btn btn--icon', 'aria-label': 'Descendre', disabled: i === list.length - 1, onclick: () => { [list[i + 1], list[i]] = [list[i], list[i + 1]]; renderBlocks(); run(); } }, '↓'),
            h('button', { type: 'button', class: 'btn btn--icon', 'aria-label': 'Supprimer le bloc', onclick: () => { list.splice(i, 1); if (insertTarget === b) insertTarget = null; renderBlocks(); run(); } }, '×')));
        blockList.append(row);
        if (b.op === 'repete') {
          renderList(b.body, depth + 1);
          blockList.append(h('div', { class: 'block-end', style: { marginLeft: `${depth * 22}px` } }, `fin de la boucle « répéter ${b.arg} fois »`));
        }
      });
    };
    renderList(blocks, 0);
    if (!blocks.length) blockList.append(h('p', { class: 'muted small' }, 'Ajoute des blocs avec la palette.'));
  };

  const palette = h('div', { class: 'palette', role: 'group', 'aria-label': 'Palette de blocs' },
    ...Object.entries(BLOCKS).map(([op, def]) => h('button', {
      type: 'button', class: `block block--palette ${def.cls}`,
      onclick: () => {
        if (locked) return;
        const b = { op };
        if (def.arg !== undefined) b.arg = def.arg;
        if (def.container) b.body = [];
        (insertTarget ? insertTarget.body : blocks).push(b);
        renderBlocks(); run();
      },
    }, `+ ${def.label}`)));

  const blocksPane = h('div', { class: 'pane-blocks' }, palette, h('p', { class: 'muted small' }, 'Astuce : sélectionne ⤵ sur une boucle pour y insérer les blocs suivants.'), blockList);
  const textPane = h('div', { class: 'pane-text' }, textarea, h('p', { class: 'muted small' }, 'Langage : avance 50 · droite 90 · gauche 45 · répète 4 [ … ] · lève · pose · mets c à 10 · si c > 5 [ … ]'));
  textarea.addEventListener('input', () => run());

  // exécution pas à pas : les segments apparaissent un par un, la tortue montre où elle en est
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let stepTimer = null;
  const stepBtn = h('button', { type: 'button', class: 'btn btn--ghost btn--small' }, '▶ Pas à pas');
  const stopStep = () => { if (stepTimer) clearInterval(stepTimer); stepTimer = null; stepBtn.textContent = '▶ Pas à pas'; };
  stepBtn.addEventListener('click', () => {
    if (stepTimer) { stopStep(); run(); return; }
    let r;
    try { r = runProgram(program()); } catch { run(); return; }
    if (!r.segments.length) { run(); return; }
    let k = 0;
    stepBtn.textContent = '■ Arrêter';
    stepTimer = setInterval(() => {
      if (!el.isConnected) { stopStep(); return; }
      k += 1;
      const segs = r.segments.slice(0, k);
      const last = segs[segs.length - 1];
      canvas.draw({ target: targetSegs, student: segs, fit: r.segments, turtle: { x: last.x2, y: last.y2, heading: (Math.atan2(last.y2 - last.y1, last.x2 - last.x1) * 180) / Math.PI } });
      msg.className = 'turtle-msg';
      msg.textContent = `Segment ${k} sur ${r.segments.length}`;
      if (k >= r.segments.length) { stopStep(); msg.textContent = `Terminé : ${r.instructions} instruction(s), ${r.segments.length} segment(s).`; }
    }, reduced ? 60 : 380);
  });

  const switchBtn = h('button', { type: 'button', class: 'btn btn--ghost btn--small' });
  const setMode = (m) => {
    if (m === 'blocks') {
      const b = toBlocks(textarea.value);
      if (!b) { msg.className = 'turtle-msg warn'; msg.textContent = 'Ce programme utilise des instructions qui n’existent qu’en mode texte : on reste en texte.'; return; }
      blocks = b; current = 'blocks'; renderBlocks();
    } else {
      textarea.value = serialize(blocks); current = 'text';
    }
    blocksPane.hidden = current !== 'blocks';
    textPane.hidden = current !== 'text';
    switchBtn.textContent = current === 'blocks' ? 'Passer au texte ⟶' : '⟵ Revenir aux blocs';
    run();
  };
  switchBtn.addEventListener('click', () => setMode(current === 'blocks' ? 'text' : 'blocks'));

  const el = h('div', { class: 'code-editor' },
    h('div', { class: 'code-left' }, h('div', { class: 'code-toolbar' }, h('strong', {}, 'Programme'), h('span', { class: 'btn-row' }, stepBtn, mode !== 'text' ? switchBtn : null)), blocksPane, textPane),
    h('div', { class: 'code-right' }, canvas.el, h('p', { class: 'muted small' }, target ? 'En pointillés : le dessin à obtenir.' : ''), msg));
  renderBlocks();
  setMode(current);
  return {
    el,
    program,
    run,
    showResult() { run(); },
    lock(b) { locked = b; stopStep(); textarea.disabled = b; el.querySelectorAll('button, input').forEach((x) => { x.disabled = b; }); },
    focus() { (current === 'text' ? textarea : palette.querySelector('button')).focus(); },
  };
}
