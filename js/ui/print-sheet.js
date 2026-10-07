/**
 * Fiche d'exercices imprimable : énoncés avec une zone de réponse adaptée au papier, puis le corrigé
 * sur une nouvelle page. Aucun nom d'élève n'est imprimé.
 */
import { h, richText, inlineHTML } from './dom.js';
import { interpolate, interpolateDeep, rng } from '../core/template.js';
import { renderFigure } from '../figures/render.js';
import { describeExpected } from '../core/checkers/index.js';
import { tokenizeHighlight } from '../core/checkers/language.js';
import { canonicalResponse } from '../generators/data-kinds.js';
import { tryParse, toText, parse, evaluate, formatNumber } from '../core/expr.js';

/** Exercices que le papier ne peut pas remplacer (programme à exécuter, manipulation interactive). */
export function printable(def) {
  return def.type !== 'code' && !def.activity && !(def.parts || []).some((p) => p.type === 'code');
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const lines = (n) => h('div', { class: 'ps-lines' }, Array.from({ length: n }, () => h('div', { class: 'ps-line' })));
const t = (inst, s) => interpolate(String(s ?? ''), inst.params);

function zone(def, inst) {
  switch (def.type) {
    case 'qcm': return h('ul', { class: 'ps-choices' }, def.choices.map((c, i) => h('li', { html: `☐ <strong>${LETTERS[i]}</strong>. ${inlineHTML(t(inst, c.text))}` })));
    case 'match': return h('div', { class: 'ps-match' },
      h('ol', {}, def.left.map((l) => h('li', { html: `${inlineHTML(l.label)} → ……` }))),
      h('ul', { class: 'ps-letters' }, def.right.map((r, i) => h('li', { html: `<strong>${LETTERS[i]}</strong>. ${inlineHTML(r.label)}` }))));
    case 'categorize': return h('table', { class: 'ps-table' },
      h('thead', {}, h('tr', {}, h('th', {}, ''), def.categories.map((c) => h('th', {}, c.label)))),
      h('tbody', {}, def.items.map((it) => h('tr', {}, h('td', { html: inlineHTML(it.label) }), def.categories.map(() => h('td', { class: 'ps-box' }, '☐'))))));
    case 'order': return h('div', {}, h('ul', { class: 'ps-letters' }, def.items.map((it, i) => h('li', { html: `<strong>${LETTERS[i]}</strong>. ${inlineHTML(it.label)}` }))), h('p', {}, `Ordre (${def.orderLabel || 'du premier au dernier'}) : ……………………`));
    case 'highlight': return h('div', {}, h('p', { class: 'ps-note' }, def.instruction || 'Souligne les mots demandés.'), h('p', { class: 'ps-hl' }, tokenizeHighlight(t(inst, def.text)).map((x) => x.text).join('')));
    case 'table': return h('table', { class: 'ps-table' },
      h('thead', {}, h('tr', {}, (def.columns || []).map((c) => h('th', { html: inlineHTML(t(inst, c)) })))),
      h('tbody', {}, (def.rows || []).map((row) => h('tr', {}, row.map((cell) => (String(cell).startsWith('?') ? h('td', { class: 'ps-box' }, '') : h('td', { html: inlineHTML(t(inst, cell)) })))))));
    case 'dictation': return h('div', {}, h('p', { class: 'ps-note' }, 'Dictée : un adulte lit le texte (il figure dans le corrigé).'), lines(3));
    case 'open': return lines(Math.max(5, Math.ceil((def.minWords || 40) / 10)));
    case 'steps': return lines(5);
    case 'composite': return h('ol', { class: 'ps-parts' }, def.parts.map((p) => h('li', {}, richText(t(inst, p.prompt), 'rich'), zone(p, inst))));
    case 'counterexample': return lines(2);
    default: return lines(def.type === 'numberline' || def.type === 'graph' ? 3 : 2);
  }
}

/** Réponse attendue, lisible sur papier. */
export function answerText(def, inst) {
  try {
    switch (def.type) {
      case 'numeric': {
        // exercice généré : la réponse type est déjà écrite comme on l'attend (« 1/6 », « 15 h 30 »)…
        const g = def.generatedAnswer && def.generatedAnswer.value;
        if (g && !/\d[.,]\d{4,}/.test(String(g))) return String(g);
        // … sauf une valeur exacte à rallonge (233,333…) : on l'écrit avec l'arrondi demandé (tolérance ou `round`)
        const dec = Number.isInteger(def.round) ? def.round : def.tolerance ? Math.max(0, Math.ceil(-Math.log10(def.tolerance * 2) - 1e-9)) : null;
        if (dec !== null && typeof def.answer === 'number') return `${formatNumber(Math.round(def.answer * 10 ** dec) / 10 ** dec)}${def.unit ? ` ${def.unit}` : ''}`;
        return describeExpected({ def, params: inst.params });
      }
      case 'expression': { const p = tryParse(t(inst, def.answer)); return p.ok ? toText(p.node) : def.answer; }
      case 'text': return (def.accept || [])[0] || '';
      case 'qcm': {
        // « correct » peut être une condition sur les paramètres (« a > 2 ») : on l'évalue comme le correcteur
        const ok = (c) => (typeof c.correct === 'string' ? Boolean(evaluate(parse(c.correct, { names: new Set(Object.keys(inst.params)) }), inst.params)) : Boolean(c.correct));
        return def.choices.map((c, i) => (ok(c) ? LETTERS[i] : null)).filter(Boolean).join(', ');
      }
      case 'match': return def.left.map((l, i) => `${i + 1} → ${LETTERS[def.right.findIndex((r) => r.id === def.pairs[l.id])]}`).join(' ; ');
      case 'categorize': return def.items.map((it) => `${it.label} : ${(def.categories.find((c) => c.id === it.category) || {}).label}`).join(' ; ');
      case 'order': return (def.answerOrder || def.items.map((i) => i.id)).map((id) => LETTERS[def.items.findIndex((i) => i.id === id)]).join(' – ');
      case 'highlight': return tokenizeHighlight(t(inst, def.text)).filter((x) => x.target).map((x) => x.text).join(', ');
      case 'dictation': return Array.isArray(def.answer) ? def.answer[0] : def.answer;
      case 'steps': return def.generatedAnswer ? def.generatedAnswer.lines[def.generatedAnswer.lines.length - 1] : '';
      case 'composite': return def.parts.map((p, i) => `${i + 1}) ${answerText(p, inst) || 'voir la correction'}`).join('   ');
      default: { const c = canonicalResponse(def); return c.value || ''; }
    }
  } catch { return ''; }
}

/**
 * Imprime une fiche. items = [{ def, inst }] (instances déjà tirées : le corrigé correspond aux énoncés).
 * Pour les rangements, l'ordre imprimé est mélangé et le corrigé indique les lettres dans le bon ordre.
 */
/** Mélange reproductible (même graine → même fiche) ; jamais l'ordre de départ quand c'est possible. */
export function seededShuffle(arr, seed) {
  const rand = rng(seed);
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  if (a.length > 1 && a.every((x, i) => x === arr[i])) [a[0], a[1]] = [a[1], a[0]];
  return a;
}

/**
 * Version papier d'un exercice : les éléments à ranger et la colonne de droite des associations sont
 * mélangés (sinon l'ordre du contenu donnerait la réponse), y compris dans les problèmes en plusieurs questions.
 */
export function paperDef(def, seed) {
  if (def.type === 'order') return { ...def, items: seededShuffle(def.items, seed), answerOrder: def.items.map((i) => i.id) };
  if (def.type === 'match') return { ...def, right: seededShuffle(def.right, seed) };
  if (def.type === 'composite') return { ...def, parts: def.parts.map((p, i) => paperDef(p, seed + i + 1)) };
  return def;
}

export function printSheet({ title, subtitle, items }) {
  const shuffledItems = items.map(({ def, inst }) => ({ def: paperDef(def, inst.seed), inst }));
  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const sheet = h('div', { class: 'print-sheet' },
    h('header', { class: 'ps-head' }, h('h1', {}, title), h('p', {}, subtitle || ''), h('p', { class: 'ps-meta' }, `Prisme · ${date} · Prénom ou pseudo : …………………`)),
    h('ol', { class: 'ps-list' }, shuffledItems.map(({ def, inst }) => h('li', { class: 'ps-item' }, richText(inst.prompt, 'rich'), def.figure ? renderFigure(interpolateDeep(def.figure, inst.params)) : null, zone(def, inst),
      // problème expert : place pour la justification
      def.justify ? h('div', {}, h('p', { class: 'ps-note' }, def.justify.prompt || 'Explique ta démarche :'), lines(4)) : null))),
    h('section', { class: 'ps-answers' },
      h('h2', {}, 'Corrigé'),
      h('ol', { class: 'ps-list' }, shuffledItems.map(({ def, inst }) => {
        const ans = answerText(def, inst);
        return h('li', { class: 'ps-item' },
          ans ? h('p', {}, h('strong', {}, 'Réponse : '), ans) : null,
          inst.solution ? richText(inst.solution, 'rich small') : null,
          def.type === 'open' && inst.models.length ? h('p', { class: 'small' }, h('em', {}, 'Exemple : '), inst.models[0]) : null);
      }))));
  document.querySelectorAll('.print-sheet').forEach((x) => x.remove());
  document.body.append(sheet);
  document.body.classList.add('has-print-sheet');
  const cleanup = () => { sheet.remove(); document.body.classList.remove('has-print-sheet'); window.removeEventListener('afterprint', cleanup); };
  window.addEventListener('afterprint', cleanup);
  window.print();
}
