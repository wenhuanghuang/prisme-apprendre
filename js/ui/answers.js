/**
 * Zones de réponse, une par type d'exercice. Chaque fabrique renvoie :
 *   { el, getResponse(), show(diagnosis), lock(bool), focus() }
 * Tout est utilisable au clavier ; les manipulations visuelles ont un équivalent clavier.
 */
import { h, inlineHTML, richText, clear } from './dom.js';
import { tryParse, toHTML } from '../core/expr.js';
import { interpolate, parseWithParams } from '../core/template.js';
import { createNumberLine } from './visual-inputs.js';
import { createGraphInput } from './graph-input.js';
import { createCodeEditor } from '../activities/turtle-editor.js';

let uid = 0;
const nextId = (p) => `${p}-${++uid}`;

/** Champ mathématique avec aperçu « je lis… » et petit clavier virtuel. */
export function mathField({ placeholder = '', label = 'Ta réponse', keyboard = true, value = '', onEnter } = {}) {
  const id = nextId('mf');
  const input = h('input', { id, class: 'field-input', type: 'text', autocomplete: 'off', spellcheck: 'false', placeholder, value, 'aria-describedby': `${id}-prev` });
  const preview = h('div', { id: `${id}-prev`, class: 'mathprev', 'aria-live': 'polite' });
  const update = () => {
    const v = input.value.trim();
    if (!v) { preview.innerHTML = ''; return; }
    const r = tryParse(v);
    preview.innerHTML = r.ok ? `<span class="mathprev-label">Je lis :</span> <span class="math">${toHTML(r.node)}</span>` : '<span class="mathprev-label warn">Écriture incomplète…</span>';
  };
  input.addEventListener('input', update);
  if (onEnter) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); onEnter(); } });
  const insert = (txt) => {
    const s = input.selectionStart ?? input.value.length; const e = input.selectionEnd ?? s;
    input.value = input.value.slice(0, s) + txt + input.value.slice(e);
    input.selectionStart = input.selectionEnd = s + txt.length;
    input.focus(); update();
  };
  const kb = keyboard ? h('div', { class: 'kbd', role: 'group', 'aria-label': 'Symboles' },
    ...[['x', 'x'], ['²', '²'], ['(', '('], [')', ')'], ['×', '×'], ['÷', '÷'], ['−', '−'], ['√', '√'], ['/', '/'], ['=', '=']]
      .map(([lab, ins]) => h('button', { type: 'button', class: 'kbd-key', tabindex: '-1', onclick: () => insert(ins), 'aria-label': `Insérer ${lab}` }, lab))) : null;
  update();
  return { el: h('div', { class: 'mathfield' }, h('label', { class: 'field-label', for: id }, label), input, kb, preview), input, update };
}

function textField({ label = 'Ta réponse', placeholder = '', onEnter } = {}) {
  const id = nextId('tf');
  const input = h('input', { id, class: 'field-input', type: 'text', autocomplete: 'off', placeholder });
  if (onEnter) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); onEnter(); } });
  return { el: h('div', { class: 'field' }, h('label', { class: 'field-label', for: id }, label), input), input };
}

function lockAll(el, locked) {
  el.querySelectorAll('input, textarea, button, select').forEach((x) => { if (!x.dataset.keepEnabled) x.disabled = locked; });
}

/* ---------------------------------------------------------------- */

function numericInput(inst, def, ctx) {
  const f = mathField({ label: def.unit ? `Ta réponse (avec l'unité, ex. 2,5 ${def.unit})` : 'Ta réponse', placeholder: def.unit ? `ex. 12,5 ${def.unit}` : 'ex. 3,5 ou 7/4', keyboard: false, onEnter: ctx.submit });
  return { el: f.el, getResponse: () => ({ value: f.input.value }), show() {}, lock: (b) => lockAll(f.el, b), focus: () => f.input.focus() };
}

function expressionInput(inst, def, ctx) {
  const formLabel = { 'developpee-reduite': 'forme développée et réduite', developpee: 'forme développée', factorisee: 'forme factorisée', irreductible: 'fraction irréductible', nombre: 'un nombre' }[def.form];
  const f = mathField({ label: formLabel ? `Ta réponse (${formLabel})` : 'Ta réponse', placeholder: 'ex. 3x² − 2x + 1', onEnter: ctx.submit });
  return { el: f.el, getResponse: () => ({ value: f.input.value }), show() {}, lock: (b) => lockAll(f.el, b), focus: () => f.input.focus() };
}

function equationInput(inst, def, ctx) {
  const f = mathField({ label: 'Ton équation', placeholder: 'ex. 4x + 5 = x + 3', onEnter: ctx.submit });
  return { el: f.el, getResponse: () => ({ value: f.input.value }), show() {}, lock: (b) => lockAll(f.el, b), focus: () => f.input.focus() };
}

function stepsInput(inst, def, ctx) {
  let startHTML = '';
  try { startHTML = def.start ? `<span class="math">${toHTML(parseWithParams(def.startExpr || def.start, inst.params))}</span>` : ''; } catch { startHTML = inlineHTML(interpolate(def.start || '', inst.params)); }
  const list = h('ol', { class: 'steps-list' });
  const lines = [];
  const addLine = (value = '', focus = true) => {
    const n = lines.length + 1;
    const f = mathField({ label: `Étape ${n}`, value, keyboard: n === 1, onEnter: () => { if (f.input.value.trim()) addLine(); else ctx.submit(); } });
    const status = h('span', { class: 'step-status', 'aria-live': 'polite' });
    const del = h('button', { type: 'button', class: 'btn btn--icon', 'aria-label': `Supprimer l'étape ${n}`, onclick: () => { if (lines.length > 1) { lines.splice(lines.indexOf(item), 1); li.remove(); relabel(); } } }, '×');
    const li = h('li', { class: 'step-line' }, f.el, status, del);
    const item = { f, status, li };
    lines.push(item);
    list.append(li);
    if (focus) f.input.focus();
  };
  const relabel = () => lines.forEach((l, i) => { const lab = l.li.querySelector('.field-label'); if (lab) lab.textContent = `Étape ${i + 1}`; });
  addLine('', false);
  const modeHelp = { equation: 'Écris une équation par ligne, jusqu’à « x = … ».', calcul: 'Écris une étape de calcul par ligne, jusqu’au résultat.', expression: 'Écris une étape par ligne, jusqu’à la forme demandée.' }[def.mode || 'calcul'];
  const el = h('div', { class: 'steps' },
    startHTML ? h('div', { class: 'steps-start' }, h('span', { class: 'muted' }, 'Départ : '), h('span', { html: startHTML })) : null,
    h('p', { class: 'hint-line' }, modeHelp, ' ', h('kbd', {}, 'Entrée'), ' ajoute une ligne.'),
    list,
    h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => addLine() }, '+ Ajouter une étape'));
  return {
    el,
    getResponse: () => ({ lines: lines.map((l) => l.f.input.value) }),
    show(d) {
      const nonEmpty = lines.filter((l) => l.f.input.value.trim());
      nonEmpty.forEach((l, i) => {
        const det = (d.details || [])[i];
        l.li.classList.remove('is-ok', 'is-ko');
        if (!det) { l.status.textContent = ''; return; }
        l.li.classList.add(det.ok ? 'is-ok' : 'is-ko');
        l.status.textContent = det.ok ? '✓ juste' : (i === d.firstBadStep ? '✗ ici' : '');
      });
    },
    lock: (b) => lockAll(el, b),
    focus: () => lines[0].f.input.focus(),
  };
}

function openInput(inst, def, ctx) {
  const id = nextId('op');
  const ta = h('textarea', { id, class: 'field-textarea', rows: 7, placeholder: 'Écris ta réponse avec tes mots…' });
  const counter = h('span', { class: 'muted small' }, '0 mot');
  ta.addEventListener('input', () => { const n = ta.value.trim().split(/\s+/).filter(Boolean).length; counter.textContent = `${n} mot${n > 1 ? 's' : ''}${def.minWords ? ` (conseillé : ${def.minWords} ou plus)` : ''}`; });
  const checks = (def.criteria || []).map((c) => {
    const cid = nextId('cr');
    const cb = h('input', { type: 'checkbox', id: cid, value: c.id });
    return { c, cb, el: h('li', {}, cb, h('label', { for: cid, html: inlineHTML(c.label) })) };
  });
  const el = h('div', { class: 'open' },
    h('label', { class: 'field-label', for: id }, 'Ta réponse'), ta, counter,
    checks.length ? h('div', { class: 'criteria' },
      h('p', { class: 'criteria-title' }, 'Critères de réussite — coche ceux que tu penses avoir remplis :'),
      h('ul', { class: 'criteria-list' }, checks.map((x) => x.el))) : null);
  return {
    el,
    getResponse: () => ({ text: ta.value, selfCheck: Object.fromEntries(checks.map((x) => [x.c.id, x.cb.checked])) }),
    show(d) {
      for (const x of checks) {
        const det = (d.details || []).find((y) => y.id === x.c.id);
        x.el.dataset.detected = det && det.detected !== null ? String(det.detected) : '';
      }
    },
    lock: (b) => lockAll(el, b),
    focus: () => ta.focus(),
    unlockForNewVersion() { lockAll(el, false); ta.focus(); },
  };
}

function textInput(inst, def, ctx) {
  const f = textField({ label: def.inputLabel || 'Ta réponse', placeholder: def.placeholder || '', onEnter: ctx.submit });
  return { el: f.el, getResponse: () => ({ value: f.input.value }), show() {}, lock: (b) => lockAll(f.el, b), focus: () => f.input.focus() };
}

function counterexampleInput(inst, def, ctx) {
  const fields = (def.vars || []).map((v) => ({ v, f: mathField({ label: `${v} =`, keyboard: false, onEnter: ctx.submit }) }));
  let claimTrue = false;
  const toggle = h('label', { class: 'check-inline' }, h('input', { type: 'checkbox', onchange: (e) => { claimTrue = e.target.checked; fields.forEach((x) => { x.f.input.disabled = claimTrue; }); } }), " Je pense que l'affirmation est vraie (je le justifierai)");
  const el = h('div', { class: 'cex' },
    def.claim ? h('blockquote', { class: 'claim', html: inlineHTML(interpolate(def.claim, inst.params)) }) : null,
    h('p', { class: 'muted' }, 'Propose des valeurs qui rendent l’affirmation fausse :'),
    h('div', { class: 'cex-fields' }, fields.map((x) => x.f.el)), toggle);
  return {
    el,
    getResponse: () => (claimTrue ? { claimTrue: true } : { values: Object.fromEntries(fields.map((x) => [x.v, x.f.input.value])) }),
    show() {}, lock: (b) => lockAll(el, b), focus: () => fields[0] && fields[0].f.input.focus(),
  };
}

function multiInput(inst, def, ctx) {
  const n = def.count || 3;
  const fields = Array.from({ length: n }, (_, i) => mathField({ label: `Réponse ${i + 1}`, keyboard: i === 0, onEnter: ctx.submit }));
  const el = h('div', { class: 'multi' }, h('p', { class: 'muted' }, `Plusieurs réponses sont possibles : donne-en ${n} différentes.`), h('div', { class: 'multi-fields' }, fields.map((f) => f.el)));
  return {
    el,
    getResponse: () => ({ values: fields.map((f) => f.input.value) }),
    show(d) { fields.forEach((f, i) => { const det = (d.details || [])[i]; f.el.classList.toggle('is-ok', Boolean(det && det.ok)); f.el.classList.toggle('is-ko', Boolean(det && !det.ok && det.text)); }); },
    lock: (b) => lockAll(el, b), focus: () => fields[0].input.focus(),
  };
}

function tableInput(inst, def, ctx) {
  const inputs = {};
  const table = h('table', { class: 'tbl' },
    h('thead', {}, h('tr', {}, (def.columns || []).map((c) => h('th', { scope: 'col', html: inlineHTML(interpolate(c, inst.params)) })))),
    h('tbody', {}, (def.rows || []).map((row) => h('tr', {}, row.map((cell, ci) => {
      const txt = String(cell);
      if (txt.startsWith('?')) {
        const key = txt.slice(1);
        const inp = h('input', { class: 'field-input cell', type: 'text', autocomplete: 'off', 'aria-label': `${(def.columns || [])[ci] || 'Case'} (à compléter)` });
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); ctx.submit(); } });
        inputs[key] = inp;
        return h('td', {}, inp);
      }
      return h('td', { html: inlineHTML(interpolate(txt, inst.params)) });
    })))));
  const el = h('div', { class: 'tbl-wrap' }, table);
  return {
    el,
    getResponse: () => ({ cells: Object.fromEntries(Object.entries(inputs).map(([k, i]) => [k, i.value])) }),
    show(d) { for (const det of d.details || []) { const i = inputs[det.key]; if (i) { i.classList.toggle('is-ok', det.ok); i.classList.toggle('is-ko', !det.ok && det.verdict !== 'vide'); } } },
    lock: (b) => lockAll(el, b), focus: () => { const f = Object.values(inputs)[0]; if (f) f.focus(); },
  };
}

function shuffled(arr, seed) {
  const a = arr.slice();
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) { s = (s * 1103515245 + 12345) % 2147483648; const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  if (a.every((x, i) => x === arr[i]) && a.length > 1) [a[0], a[1]] = [a[1], a[0]];
  return a;
}

function orderInput(inst, def, ctx) {
  let order = shuffled(def.items.map((i) => i.id), inst.seed);
  const byId = Object.fromEntries(def.items.map((i) => [i.id, i]));
  const list = h('ol', { class: 'order-list', 'aria-label': def.orderLabel || 'Éléments à ranger' });
  let dragId = null;
  const render = (focusId, focusDir) => {
    clear(list);
    order.forEach((id, idx) => {
      const up = h('button', { type: 'button', class: 'btn btn--icon', 'aria-label': `Monter « ${byId[id].label} »`, disabled: idx === 0, onclick: () => move(idx, -1) }, '↑');
      const down = h('button', { type: 'button', class: 'btn btn--icon', 'aria-label': `Descendre « ${byId[id].label} »`, disabled: idx === order.length - 1, onclick: () => move(idx, 1) }, '↓');
      const li = h('li', { class: 'order-item', draggable: 'true', dataset: { id } },
        h('span', { class: 'order-grip', 'aria-hidden': 'true' }, '⋮⋮'), h('span', { class: 'order-label', html: inlineHTML(byId[id].label) }), h('span', { class: 'order-btns' }, up, down));
      li.addEventListener('dragstart', (e) => { dragId = id; li.classList.add('is-dragging'); e.dataTransfer.effectAllowed = 'move'; });
      li.addEventListener('dragend', () => li.classList.remove('is-dragging'));
      li.addEventListener('dragover', (e) => { e.preventDefault(); });
      li.addEventListener('drop', (e) => { e.preventDefault(); if (!dragId || dragId === id) return; const to = order.indexOf(id); order = [...order.filter((x) => x !== dragId).slice(0, to), dragId, ...order.filter((x) => x !== dragId).slice(to)]; render(); });
      list.append(li);
      if (focusId === id) requestAnimationFrame(() => { const b = li.querySelector(focusDir < 0 ? '.order-btns button:first-child' : '.order-btns button:last-child'); (b && !b.disabled ? b : li.querySelector('button:not([disabled])')).focus(); });
    });
  };
  const move = (idx, dir) => { const j = idx + dir; if (j < 0 || j >= order.length) return; const next = order.slice(); [next[idx], next[j]] = [next[j], next[idx]]; order = next; render(next[j], dir); };
  render();
  const el = h('div', { class: 'order' }, h('p', { class: 'muted' }, `Range ${def.orderLabel || 'dans le bon ordre'} (glisser-déposer ou boutons ↑ ↓).`), list);
  return {
    el,
    getResponse: () => ({ order }),
    show(d) { [...list.children].forEach((li, i) => { const det = (d.details || [])[i]; li.classList.toggle('is-ok', Boolean(det && det.ok)); li.classList.toggle('is-ko', Boolean(det && !det.ok)); }); },
    lock: (b) => { lockAll(el, b); list.querySelectorAll('li').forEach((li) => { li.draggable = !b; }); },
    focus: () => { const b = list.querySelector('button:not([disabled])'); if (b) b.focus(); },
  };
}

function qcmInput(inst, def, ctx) {
  const name = nextId('qcm');
  const multiple = Boolean(def.multiple);
  const opts = def.choices.map((c, i) => {
    const id = `${name}-${i}`;
    const input = h('input', { type: multiple ? 'checkbox' : 'radio', name, id, value: String(i) });
    return { input, el: h('li', {}, input, h('label', { for: id, html: inlineHTML(interpolate(c.text, inst.params)) })) };
  });
  const el = h('div', { class: 'qcm' }, h('p', { class: 'chip chip--quick' }, 'Vérification rapide'), h('ul', { class: 'qcm-list' }, opts.map((o) => o.el)));
  return {
    el,
    getResponse: () => ({ selected: opts.map((o, i) => (o.input.checked ? i : -1)).filter((i) => i >= 0) }),
    show() {}, lock: (b) => lockAll(el, b), focus: () => opts[0].input.focus(),
  };
}

function numberlineInput(inst, def) {
  const nl = createNumberLine({ min: def.min ?? -5, max: def.max ?? 5, step: def.step ?? 0.5, points: def.points.map((p) => p.label), interactive: true });
  return { el: nl.el, getResponse: () => ({ positions: nl.positions() }), show(d) { nl.mark(d.details || []); }, lock: (b) => nl.lock(b), focus: () => nl.focus() };
}

function graphInput(inst, def) {
  const g = createGraphInput({ xRange: def.xRange || [-5, 5], yRange: def.yRange || [-5, 5], step: def.gridStep, xStep: def.xStep, yStep: def.yStep, maxPoints: def.maxPoints || 12, xLabel: def.xLabel || '', yLabel: def.yLabel || '' });
  return { el: g.el, getResponse: () => ({ points: g.points() }), show() {}, lock: (b) => g.lock(b), focus: () => g.focus() };
}

function codeInput(inst, def) {
  const ed = createCodeEditor({ start: interpolate(def.start || '', inst.params), target: interpolate(def.reference || '', inst.params), mode: def.mode || 'both' });
  return { el: ed.el, getResponse: () => ({ program: ed.program() }), show(d) { ed.showResult(d); }, lock: (b) => ed.lock(b), focus: () => ed.focus() };
}

function compositeInput(inst, def, ctx) {
  const parts = (def.parts || []).map((part, i) => {
    const sub = createAnswer(inst, part, ctx);
    const just = part.justify ? justificationField(part.justify) : null;
    const status = h('span', { class: 'part-status', 'aria-live': 'polite' });
    const box = h('section', { class: 'part', 'aria-label': `Question ${i + 1}` },
      h('div', { class: 'part-head' }, h('span', { class: 'part-num' }, String(i + 1)), h('div', { class: 'part-prompt', html: richText(interpolate(part.prompt || '', inst.params), 'rich').innerHTML }), status),
      sub.el, just ? just.el : null);
    return { sub, just, box, status };
  });
  const el = h('div', { class: 'composite' }, parts.map((p) => p.box));
  return {
    el,
    getResponse: () => ({ parts: parts.map((p) => ({ ...p.sub.getResponse(), ...(p.just ? { justification: p.just.value() } : {}) })) }),
    show(d) {
      parts.forEach((p, i) => {
        const det = (d.details || [])[i];
        if (!det) return;
        p.sub.show(det);
        p.box.classList.remove('is-ok', 'is-ko', 'is-pending');
        const cls = det.verdict === 'correct' ? 'is-ok' : det.verdict === 'a-valider' ? 'is-pending' : det.verdict === 'vide' ? '' : 'is-ko';
        if (cls) p.box.classList.add(cls);
        p.status.textContent = { correct: '✓', 'a-valider': '✎ à relire', partiel: '≈ presque', incorrect: '✗', vide: '' }[det.verdict] || '';
        p.status.title = det.feedback || '';
      });
    },
    lock: (b) => parts.forEach((p) => { p.sub.lock(b); if (p.just) p.just.lock(b); }),
    focus: () => parts[0] && parts[0].sub.focus(),
  };
}

export function justificationField(spec = {}) {
  const id = nextId('just');
  const ta = h('textarea', { id, class: 'field-textarea small', rows: 3, placeholder: 'Explique ta démarche ou écris ton calcul…' });
  const el = h('div', { class: 'justify' }, h('label', { class: 'field-label', for: id }, spec.prompt || (spec.required ? 'Justifie ta réponse (obligatoire)' : 'Explique ta démarche (facultatif)')), ta);
  return { el, value: () => ta.value, lock: (b) => { ta.disabled = b; } };
}

const FACTORIES = {
  numeric: numericInput, expression: expressionInput, equation: equationInput, steps: stepsInput, open: openInput, text: textInput,
  counterexample: counterexampleInput, multi: multiInput, table: tableInput, order: orderInput, qcm: qcmInput,
  numberline: numberlineInput, graph: graphInput, code: codeInput, composite: compositeInput,
};

export function createAnswer(inst, def, ctx) {
  const f = FACTORIES[def.type];
  if (!f) return { el: h('p', { class: 'warn' }, `Type d'exercice non pris en charge : ${def.type}`), getResponse: () => ({}), show() {}, lock() {}, focus() {} };
  return f(inst, def, ctx);
}
