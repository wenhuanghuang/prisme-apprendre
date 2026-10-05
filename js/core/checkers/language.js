/**
 * Types utiles en français, langues, histoire-géographie, SVT, technologie :
 *  - highlight  : surligner dans un texte les mots demandés (classes grammaticales, fonctions, indices…) ;
 *  - match      : associer deux à deux (mot ↔ définition, date ↔ événement, organe ↔ fonction…) ;
 *  - categorize : classer des éléments dans des catégories ;
 *  - dictation  : écrire ce que l'on entend (dictée, compréhension orale en langue étrangère).
 * Chaque correcteur explique précisément ce qui est juste, ce qui manque et ce qui est en trop.
 */
import { diagnosis } from '../errors.js';
import { interpolate } from '../template.js';

const strip = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
const norm = (s) => String(s || '').toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();

/**
 * Découpe un texte de surlignage. Les cibles sont écrites entre crochets : « Le [petit] chat [noir] dort. »
 * Un groupe entre crochets peut contenir plusieurs mots (« [sont venus] »). Renvoie la liste des jetons
 * sélectionnables (mots) et non sélectionnables (ponctuation, espaces).
 */
export function tokenizeHighlight(text) {
  const tokens = [];
  const re = /\[([^\]]+)\]|([\p{L}\p{N}]+(?:['’](?=[\p{L}]))?(?:-[\p{L}\p{N}]+)*['’]?)|(\s+)|([^\s\p{L}\p{N}[\]]+)/gu;
  let m;
  while ((m = re.exec(String(text || '')))) {
    if (m[1] !== undefined) tokens.push({ text: m[1], word: true, target: true });
    else if (m[2] !== undefined) tokens.push({ text: m[2], word: true, target: false });
    else if (m[3] !== undefined) tokens.push({ text: m[3], word: false, space: true });
    else tokens.push({ text: m[4], word: false });
  }
  let w = 0;
  for (const t of tokens) if (t.word) t.index = w++;
  return tokens;
}

export function checkHighlight(def, params, response) {
  const tokens = tokenizeHighlight(interpolate(def.text || '', params || {})).filter((t) => t.word);
  const selected = new Set((response.selected || []).map(Number));
  if (!selected.size) return diagnosis({ verdict: 'vide', feedback: 'Clique sur les mots demandés.' });
  const targets = tokens.filter((t) => t.target);
  const found = targets.filter((t) => selected.has(t.index));
  const extra = tokens.filter((t) => !t.target && selected.has(t.index));
  const missing = targets.filter((t) => !selected.has(t.index));
  const details = tokens.map((t) => ({ index: t.index, text: t.text, target: t.target, selected: selected.has(t.index) }));
  if (!extra.length && !missing.length) return diagnosis({ verdict: 'correct', score: 1, details, feedback: def.correctFeedback || 'Tous les mots demandés, et seulement eux.' });
  const mc = (def.misconceptions || []).find((m) => extra.some((t) => norm(t.text) === norm(m.word)));
  const parts = [];
  parts.push(`${found.length}/${targets.length} trouvé${found.length > 1 ? 's' : ''}`);
  if (extra.length) parts.push(`${extra.length} en trop (${extra.slice(0, 3).map((t) => `« ${t.text} »`).join(', ')})`);
  if (missing.length && found.length) parts.push(`il en manque ${missing.length}`);
  return diagnosis({
    verdict: found.length ? 'partiel' : 'incorrect',
    score: Math.max(0, (found.length - extra.length) / targets.length) * 0.8,
    stepsOk: found.length, stepsTotal: targets.length, details,
    errorType: mc ? mc.error || 'notion' : extra.length ? 'notion' : 'lecture',
    misconception: mc ? mc.id || null : null,
    prerequisite: mc ? mc.prerequisite || null : null,
    feedback: `${parts.join(' ; ')}.${mc && mc.feedback ? ' ' + mc.feedback : ''}`,
  });
}

/** Associer : def.left = [{id,label}], def.right = [{id,label}], def.pairs = {leftId: rightId}. */
export function checkMatch(def, params, response) {
  const given = response.pairs || {};
  const keys = Object.keys(def.pairs || {});
  const answered = keys.filter((k) => given[k]);
  if (!answered.length) return diagnosis({ verdict: 'vide', feedback: 'Associe chaque élément de gauche à un élément de droite.' });
  const details = keys.map((k) => ({ left: k, given: given[k] || null, ok: given[k] === def.pairs[k] }));
  const ok = details.filter((d) => d.ok).length;
  if (ok === keys.length) return diagnosis({ verdict: 'correct', score: 1, details, feedback: def.correctFeedback || 'Toutes les associations sont justes.' });
  const wrong = details.find((d) => !d.ok && d.given);
  const mc = wrong && (def.misconceptions || []).find((m) => m.pair && m.pair[0] === wrong.left && m.pair[1] === wrong.given);
  const label = (list, id) => ((list || []).find((x) => x.id === id) || { label: id }).label;
  return diagnosis({
    verdict: ok ? 'partiel' : 'incorrect', score: (ok / keys.length) * 0.8, details, stepsOk: ok, stepsTotal: keys.length,
    errorType: mc ? mc.error || 'notion' : 'notion', misconception: mc ? mc.id || null : null, prerequisite: mc ? mc.prerequisite || null : null,
    feedback: `${ok}/${keys.length} association${keys.length > 1 ? 's' : ''} juste${ok > 1 ? 's' : ''}.${mc && mc.feedback ? ' ' + mc.feedback : wrong ? ` Revois « ${label(def.left, wrong.left)} ».` : ''}`,
  });
}

/** Classer : def.categories = [{id,label}], def.items = [{id,label,category}]. Réponse {assign: {itemId: categoryId}}. */
export function checkCategorize(def, params, response) {
  const assign = response.assign || {};
  const items = def.items || [];
  if (!items.some((i) => assign[i.id])) return diagnosis({ verdict: 'vide', feedback: 'Range chaque élément dans une catégorie.' });
  const details = items.map((i) => ({ id: i.id, label: i.label, given: assign[i.id] || null, ok: assign[i.id] === i.category }));
  const ok = details.filter((d) => d.ok).length;
  if (ok === items.length) return diagnosis({ verdict: 'correct', score: 1, details, feedback: def.correctFeedback || 'Tout est bien classé.' });
  const wrong = details.find((d) => !d.ok && d.given);
  const mc = wrong && (def.misconceptions || []).find((m) => m.item === wrong.id && (!m.category || m.category === wrong.given));
  const cat = (id) => ((def.categories || []).find((c) => c.id === id) || { label: id }).label;
  return diagnosis({
    verdict: ok ? 'partiel' : 'incorrect', score: (ok / items.length) * 0.8, details, stepsOk: ok, stepsTotal: items.length,
    errorType: mc ? mc.error || 'notion' : 'notion', misconception: mc ? mc.id || null : null, prerequisite: mc ? mc.prerequisite || null : null,
    feedback: `${ok}/${items.length} bien classé${ok > 1 ? 's' : ''}.${mc && mc.feedback ? ' ' + mc.feedback : wrong ? ` Revois « ${wrong.label} ».` : ''}`,
  });
}

/** Alignement mot à mot (plus longue sous-suite commune) pour repérer les mots fautifs d'une dictée. */
function alignWords(expected, given) {
  const n = expected.length; const m = given.length;
  const eq = (a, b) => norm(a) === norm(b);
  const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = eq(expected[i], given[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const ops = []; let i = 0; let j = 0;
  while (i < n && j < m) {
    if (eq(expected[i], given[j])) { ops.push({ type: 'ok', expected: expected[i], given: given[j] }); i++; j++; }
    else if (L[i + 1][j + 1] >= L[i + 1][j] && L[i + 1][j + 1] >= L[i][j + 1]) { ops.push({ type: 'sub', expected: expected[i], given: given[j] }); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) { ops.push({ type: 'missing', expected: expected[i] }); i++; }
    else { ops.push({ type: 'extra', given: given[j] }); j++; }
  }
  while (i < n) ops.push({ type: 'missing', expected: expected[i++] });
  while (j < m) ops.push({ type: 'extra', given: given[j++] });
  return ops;
}

function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

const words = (s) => String(s || '').replace(/[’]/g, "'").match(/[\p{L}\p{N}]+(?:['-][\p{L}\p{N}]+)*'?/gu) || [];

/** Dictée : def.answer = phrase attendue (la ponctuation n'est pas notée), def.lang pour la synthèse vocale. */
export function checkDictation(def, params, response) {
  const raw = String(response.value || '').trim();
  if (!raw) return diagnosis({ verdict: 'vide', feedback: 'Écris ce que tu entends.' });
  const answers = Array.isArray(def.answer) ? def.answer : [def.answer];
  let best = null;
  for (const a of answers) {
    const ops = alignWords(words(a), words(raw));
    const errors = ops.filter((o) => o.type !== 'ok');
    if (!best || errors.length < best.errors.length) best = { ops, errors, total: words(a).length };
  }
  if (!best.errors.length) return diagnosis({ verdict: 'correct', score: 1, details: best.ops, feedback: 'Aucune faute.' });
  const accentOnly = best.errors.every((o) => o.type === 'sub' && strip(norm(o.expected)) === strip(norm(o.given)));
  // le mot est reconnu (au plus deux lettres de différence) : c'est une faute d'orthographe, pas une incompréhension
  const spelling = best.errors.every((o) => o.type === 'sub' && editDistance(strip(norm(o.expected)), strip(norm(o.given))) <= 2);
  const subs = best.errors.filter((o) => o.type === 'sub');
  const before = (k) => { for (let i = k - 1; i >= 0; i--) if (best.ops[i].given) return best.ops[i].given; return null; };
  const list = best.errors.slice(0, 4).map((o) => {
    if (o.type === 'sub') return `« ${o.given} » est mal écrit`;
    if (o.type === 'extra') return `« ${o.given} » est en trop`;
    const prev = before(best.ops.indexOf(o));
    return prev ? `un mot manque après « ${prev} »` : 'un mot manque au début';
  }).join(' ; ');
  const mc = subs.map((o) => (def.misconceptions || []).find((m) => norm(m.word) === norm(o.given))).find(Boolean);
  return diagnosis({
    verdict: best.errors.length <= Math.max(1, Math.round(best.total * 0.15)) ? 'partiel' : 'incorrect',
    score: Math.max(0, 1 - best.errors.length / best.total) * 0.8,
    stepsOk: best.total - best.errors.filter((o) => o.type !== 'extra').length, stepsTotal: best.total,
    errorType: mc ? mc.error || 'notion' : accentOnly || spelling ? 'orthographe' : 'inconnue',
    misconception: mc ? mc.id || null : null,
    details: best.ops,
    feedback: `${best.errors.length} faute${best.errors.length > 1 ? 's' : ''} : ${list}.${accentOnly ? ' (seulement des accents)' : ''}${mc && mc.feedback ? ' ' + mc.feedback : ''}`,
  });
}
