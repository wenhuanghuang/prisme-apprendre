/**
 * Réponses structurées : tableaux à compléter, frises/rangements, droite graduée, points dans un repère,
 * et QCM (réservés aux vérifications rapides).
 */
import { evaluate, parse } from '../expr.js';
import { parseWithParams, interpolate } from '../template.js';
import { diagnosis } from '../errors.js';
import { checkNumeric } from './numeric.js';

/** Tableau : def.cells = { "r0c1": {answer:"…", tolerance, unit}, … } */
export function checkTable(def, params, response) {
  const cells = Object.entries(def.cells || {});
  const details = []; let ok = 0; let firstError = null;
  for (const [key, cellDef] of cells) {
    const d = checkNumeric({ ...cellDef, misconceptions: cellDef.misconceptions || [] }, params, { value: (response.cells || {})[key] });
    const good = d.verdict === 'correct';
    if (good) ok++;
    else if (!firstError && d.verdict !== 'vide') firstError = { key, d };
    details.push({ key, ok: good, feedback: d.feedback, verdict: d.verdict });
  }
  if (ok === cells.length) return diagnosis({ verdict: 'correct', score: 1, details, stepsOk: ok, stepsTotal: cells.length, feedback: 'Tableau entièrement juste.' });
  const empty = details.filter((x) => x.verdict === 'vide').length;
  if (empty === cells.length) return diagnosis({ verdict: 'vide', feedback: 'Complète le tableau.' });
  return diagnosis({
    verdict: ok > 0 ? 'partiel' : 'incorrect', score: (ok / cells.length) * 0.8, details, stepsOk: ok, stepsTotal: cells.length,
    errorType: firstError ? firstError.d.errorType || 'inconnue' : null,
    misconception: firstError ? firstError.d.misconception : null,
    feedback: `${ok}/${cells.length} cases justes.${firstError ? ' ' + firstError.d.feedback : ''}`,
  });
}

/** Rangement / frise : def.items dans le bon ordre ; response.order = liste d'identifiants. */
export function checkOrder(def, params, response) {
  const expected = def.items.map((i) => i.id);
  const given = response.order || [];
  if (given.length !== expected.length) return diagnosis({ verdict: 'vide', feedback: 'Place tous les éléments.' });
  const pos = Object.fromEntries(expected.map((id, i) => [id, i]));
  let inversions = 0; const n = given.length;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (pos[given[i]] > pos[given[j]]) inversions++;
  const wellPlaced = given.filter((id, i) => id === expected[i]).length;
  const details = given.map((id, i) => ({ id, ok: id === expected[i] }));
  if (inversions === 0) return diagnosis({ verdict: 'correct', score: 1, details, feedback: 'Ordre exact.' });
  const maxInv = (n * (n - 1)) / 2;
  const misplaced = def.items.filter((it, i) => given[i] !== it.id).map((it) => it.label);
  return diagnosis({
    verdict: inversions <= 2 ? 'partiel' : 'incorrect', score: Math.max(0, 1 - inversions / maxInv) * 0.7, details,
    errorType: def.errorType || 'notion', stepsOk: wellPlaced, stepsTotal: n,
    feedback: `${wellPlaced}/${n} éléments bien placés (${inversions} inversion${inversions > 1 ? 's' : ''}). ${misplaced.length <= 3 ? 'Revois : ' + misplaced.join(' ; ') + '.' : ''}`,
  });
}

/** Droite graduée : def.points = [{label, value}], response.positions = {label: nombre}. */
export function checkNumberline(def, params, response) {
  const tol = def.tolerance ?? 0.26;
  const details = []; let ok = 0; let signErrors = 0;
  const num = (v) => (typeof v === 'string' ? evaluate(parse(v.trim())) : v);
  for (const p of def.points) {
    const expected = evaluate(parseWithParams(interpolate(String(p.value), params), params));
    let given = response.positions ? response.positions[p.label] : undefined;
    if (given !== undefined && given !== null) { try { given = num(given); } catch { given = null; } }
    if (given === undefined || given === null) { details.push({ label: p.label, ok: false, reason: 'non placé' }); continue; }
    const good = Math.abs(given - expected) <= tol;
    if (good) ok++;
    else if (Math.abs(given + expected) <= tol && expected !== 0) signErrors++;
    details.push({ label: p.label, ok: good, expected, given });
  }
  const n = def.points.length;
  if (ok === n) return diagnosis({ verdict: 'correct', score: 1, details, feedback: 'Tous les points sont bien placés.' });
  return diagnosis({
    verdict: ok ? 'partiel' : 'incorrect', score: (ok / n) * 0.8, details, stepsOk: ok, stepsTotal: n,
    errorType: signErrors ? 'signe' : 'notion',
    feedback: signErrors ? `${ok}/${n} bien placés. Certains points sont du mauvais côté de zéro : regarde le signe.` : `${ok}/${n} bien placés.`,
  });
}

/**
 * Repère : placer des points. def.expectedPoints = [[x,y],…] (ensemble exact) OU def.predicate = "y = 2*x+1" et def.count.
 * response.points = [[x,y],…]
 */
export function checkGraph(def, params, response) {
  const pts = response.points || [];
  if (!pts.length) return diagnosis({ verdict: 'vide', feedback: 'Place des points dans le repère.' });
  const tol = def.tolerance ?? 0.01;
  if (def.expectedPoints) {
    const expected = def.expectedPoints.map(([x, y]) => [evaluate(parseWithParams(String(x), params)), evaluate(parseWithParams(String(y), params))]);
    const found = expected.filter(([x, y]) => pts.some(([a, b]) => Math.abs(a - x) <= tol && Math.abs(b - y) <= tol)).length;
    const extra = pts.filter(([a, b]) => !expected.some(([x, y]) => Math.abs(a - x) <= tol && Math.abs(b - y) <= tol)).length;
    const swapped = pts.filter(([a, b]) => expected.some(([x, y]) => Math.abs(a - y) <= tol && Math.abs(b - x) <= tol && Math.abs(x - y) > tol)).length;
    if (found === expected.length && !extra) return diagnosis({ verdict: 'correct', score: 1, feedback: 'Tous les points sont justes.' });
    return diagnosis({
      verdict: found ? 'partiel' : 'incorrect', score: (found / expected.length) * 0.8, stepsOk: found, stepsTotal: expected.length,
      errorType: swapped ? 'lecture' : 'notion',
      feedback: swapped ? "Certains points ont l'abscisse et l'ordonnée inversées : l'abscisse se lit sur l'axe horizontal." : `${found}/${expected.length} points attendus placés${extra ? `, ${extra} point(s) en trop` : ''}.`,
    });
  }
  const names = new Set([...Object.keys(params), 'x', 'y']);
  const pred = parse(def.predicate, { names });
  const good = pts.filter(([x, y]) => evaluate(pred, { ...params, x, y }));
  const distinct = new Set(good.map(([x, y]) => `${x};${y}`)).size;
  const need = def.count || 2;
  if (distinct >= need && good.length === pts.length) return diagnosis({ verdict: 'correct', score: 1, feedback: 'Tes points vérifient bien la condition.' });
  return diagnosis({
    verdict: distinct ? 'partiel' : 'incorrect', score: Math.min(1, distinct / need) * 0.7, errorType: 'notion',
    feedback: `${distinct} point(s) valable(s) sur ${need} demandés${good.length < pts.length ? `, ${pts.length - good.length} ne vérifie(nt) pas ${interpolate(def.predicateLabel || def.predicate, params)}` : ''}.`,
  });
}

/** QCM : vérification rapide uniquement. def.choices = [{text, correct, feedback, error, misconception}] */
export function checkQcm(def, params, response) {
  const sel = (response.selected || []).slice().sort((a, b) => a - b);
  if (!sel.length) return diagnosis({ verdict: 'vide', feedback: 'Choisis une réponse.' });
  const isCorrect = (c) => (typeof c.correct === 'string' ? Boolean(evaluate(parse(c.correct, { names: new Set(Object.keys(params)) }), params)) : Boolean(c.correct));
  const correct = def.choices.map((c, i) => (isCorrect(c) ? i : -1)).filter((i) => i >= 0);
  const exact = sel.length === correct.length && sel.every((v, i) => v === correct[i]);
  if (exact) return diagnosis({ verdict: 'correct', score: 1, feedback: def.choices[sel[0]].feedback || 'Exact.' });
  const wrong = sel.map((i) => def.choices[i]).find((c) => !isCorrect(c));
  return diagnosis({
    verdict: 'incorrect', score: 0,
    errorType: (wrong && wrong.error) || 'inconnue', misconception: (wrong && wrong.misconception) || null,
    prerequisite: (wrong && wrong.prerequisite) || null,
    feedback: (wrong && wrong.feedback) || (def.multiple ? 'Il manque une bonne réponse.' : 'Ce n’est pas la bonne réponse.'),
  });
}
