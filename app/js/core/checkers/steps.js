/**
 * Calcul détaillé étape par étape. Chaque ligne écrite par l'élève est vérifiée :
 *  - mode « calcul »     : chaque ligne doit avoir la même valeur que le calcul de départ ;
 *  - mode « expression » : chaque ligne doit être égale à l'expression de départ (pour tout x) ;
 *  - mode « equation »   : chaque ligne doit avoir les mêmes solutions que l'équation de départ.
 * Le diagnostic indique les étapes justes, la première étape fausse et la nature probable de l'erreur.
 */
import {
  tryParse, evaluate, equivalent, alignVariableCase, equationsEquivalent, solveLinear, sumTerms, isSolvedForm, variables, formatNumber,
} from '../expr.js';
import { parseWithParams } from '../template.js';
import { diagnosis } from '../errors.js';
import { FORMS } from './expression.js';

function cleanLine(line) {
  return String(line).trim().replace(/^=\s*/, '').replace(/\s*\.$/, '');
}

function readLines(lines) {
  return (lines || []).map(cleanLine).filter((l) => l.length > 0);
}

/** Découpe « a = b = c » au niveau des signes = hors parenthèses. */
export function splitEqualities(line) {
  const parts = []; let depth = 0; let cur = '';
  for (const ch of line) {
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth--;
    if (ch === '=' && depth === 0) { parts.push(cur); cur = ''; } else cur += ch;
  }
  parts.push(cur);
  return parts.map((x) => x.trim()).filter((x) => x.length);
}

/**
 * En calcul (et en expression), on accepte les écritures usuelles des élèves :
 * « A = 7 + 8 × 3 », « 7 + 8 × 3 = 31 » (égalités chaînées), et la lettre x pour « fois » entre deux nombres.
 */
export function normalizeCalcLine(line, mode, variable) {
  let t = line;
  if (mode === 'calcul') t = t.replace(/(\d)\s*[xX]\s*(?=[\d(−-])/g, '$1 × ');
  const parts = splitEqualities(t);
  if (parts.length > 1 && /^[A-Za-z]$/.test(parts[0]) && parts[0] !== variable) parts.shift();
  return parts;
}

/** Valeur de x d'une ligne « x = … » ou « … = x » */
function solvedValue(eq, v) {
  const isV = (n) => n.t === 'var' && n.n === v;
  try {
    if (isV(eq.a)) return evaluate(eq.b);
    if (isV(eq.b)) return evaluate(eq.a);
  } catch { /* ignore */ }
  return null;
}

/** Erreur de transposition : la ligne fausse correspond à la ligne précédente avec UN terme dont le signe est inversé. */
function detectSignFlip(prev, bad) {
  const f = { t: '-', a: prev.a, b: prev.b };
  const candidates = [];
  for (const { sign, node } of sumTerms(prev.a)) candidates.push({ t: '-', a: f, b: { t: '*', a: { t: 'num', v: 2 * sign }, b: node } });
  for (const { sign, node } of sumTerms(prev.b)) candidates.push({ t: '+', a: f, b: { t: '*', a: { t: 'num', v: 2 * sign }, b: node } });
  return candidates.some((alt) => equationsEquivalent(bad, { t: 'cmp', op: '=', a: alt, b: { t: 'num', v: 0 } }));
}

/** Pour une ligne de la forme k·x = c : l'élève a-t-il soustrait/ajouté k au lieu de diviser ? */
function detectIsolateError(prev, bad, v) {
  const value = solvedValue(bad, v);
  if (value === null) return null;
  const left = sumTerms(prev.a); const right = sumTerms(prev.b);
  if (left.length !== 1 || right.length !== 1) return null;
  const xSide = variables(prev.a).has(v) ? prev.a : prev.b;
  const cSide = xSide === prev.a ? prev.b : prev.a;
  if (variables(cSide).size) return null;
  let k; let c;
  try { k = evaluate(xSide, { [v]: 1 }); c = evaluate(cSide); } catch { return null; }
  if (Math.abs(evaluate(xSide, { [v]: 2 }) - 2 * k) > 1e-9 || k === 1) return null;
  const near = (a, b) => Math.abs(a - b) < 1e-9;
  if (near(value, c - k) || near(value, c + k)) return `Dans ${formatNumber(k)}${v} = ${formatNumber(c)}, ${formatNumber(k)} multiplie ${v} : pour isoler ${v}, on divise les deux membres par ${formatNumber(k)} (on ne soustrait pas).`;
  if (c !== 0 && near(value, k / c)) return `Attention au sens de la division : ${v} = ${formatNumber(c)} ÷ ${formatNumber(k)}, et non ${formatNumber(k)} ÷ ${formatNumber(c)}.`;
  if (near(value, c * k)) return `Pour isoler ${v}, on divise par ${formatNumber(k)} (on ne multiplie pas).`;
  return null;
}

function matchLineMisconception(def, params, node, mode, expectedValue) {
  for (const mc of def.misconceptions || []) {
    let mcNode;
    try { mcNode = parseWithParams(mc.answer, params); } catch { continue; }
    if (mode === 'calcul') {
      try {
        if (Math.abs(evaluate(node) - evaluate(mcNode)) < 1e-9 && Math.abs(evaluate(mcNode) - expectedValue) > 1e-9) return mc;
      } catch { /* ignore */ }
    } else if (mode === 'expression') {
      if (equivalent(node, mcNode)) return mc;
    } else if (mcNode.t === 'cmp' && equationsEquivalent(node, mcNode)) {
      return mc;
    }
  }
  return null;
}

export function checkSteps(def, params, response) {
  const mode = def.mode || 'calcul';
  const v = def.variable || 'x';
  const lines = readLines(response.lines);
  if (!lines.length) return diagnosis({ verdict: 'vide', feedback: 'Écris au moins une étape.' });

  const start = parseWithParams(def.startExpr || def.start, params);
  let expectedValue = null;
  if (mode === 'calcul') expectedValue = evaluate(start);

  const nodes = []; const extraParts = [];
  for (let i = 0; i < lines.length; i++) {
    const pieces = mode === 'equation' ? [lines[i]] : normalizeCalcLine(lines[i], mode, v);
    const parsed = pieces.map((x) => tryParse(x));
    const bad = parsed.findIndex((r) => !r.ok);
    if (bad !== -1 || !parsed.length) {
      return diagnosis({ verdict: 'illisible', firstBadStep: i, stepsOk: i, stepsTotal: lines.length, feedback: `Ligne ${i + 1} : je n'arrive pas à lire « ${lines[i]} »${parsed[bad] ? ` (${parsed[bad].error})` : ''}. Pour multiplier, utilise × ou *.` });
    }
    nodes.push(alignVariableCase(parsed[parsed.length - 1].node, start)); // le dernier membre est l'étape « écrite »
    extraParts.push(parsed.slice(0, -1).map((r) => alignVariableCase(r.node, start)));
  }

  const oneOk = (node) => {
    if (mode === 'calcul') return node.t !== 'cmp' && Math.abs(evaluate(node) - expectedValue) <= 1e-9 * Math.max(1, Math.abs(expectedValue));
    if (mode === 'expression') return node.t !== 'cmp' && equivalent(node, start);
    return node.t === 'cmp' && equationsEquivalent(node, start);
  };
  const lineOk = (node, i) => {
    try { return oneOk(node) && extraParts[i].every(oneOk); } catch { return false; }
  };

  const details = nodes.map((n, i) => ({ line: i + 1, text: lines[i], ok: lineOk(n, i) }));
  const firstBad = details.findIndex((d) => !d.ok);

  if (firstBad === -1) {
    const last = nodes[nodes.length - 1];
    let finished;
    if (mode === 'equation') finished = isSolvedForm(last, v);
    else finished = (FORMS[def.final || (mode === 'calcul' ? 'nombre' : 'developpee-reduite')] || FORMS.any).test(last);
    if (!finished) {
      return diagnosis({
        verdict: 'partiel', score: 0.5, errorType: 'forme', stepsOk: lines.length, stepsTotal: lines.length, details,
        feedback: mode === 'equation' ? `Toutes tes étapes sont justes. Continue jusqu'à obtenir « ${v} = … ».` : 'Toutes tes étapes sont justes, mais le calcul n’est pas terminé.',
      });
    }
    const minSteps = def.minSteps ?? 2;
    if (lines.length < minSteps) {
      return diagnosis({
        verdict: 'partiel', score: 0.7, errorType: 'sans-justification', stepsOk: lines.length, stepsTotal: lines.length, details,
        feedback: `Le résultat est juste. Montre au moins ${minSteps} étapes pour qu’on puisse suivre ta démarche.`,
      });
    }
    if (mode === 'equation' && def.checkUnique !== false) {
      const sol = solveLinear(start, v);
      if (sol.kind === 'unique') {
        const val = solvedValue(last, v);
        if (val !== null && Math.abs(val - sol.x) > 1e-9) return diagnosis({ verdict: 'incorrect', errorType: 'calcul', details, feedback: 'La dernière ligne ne donne pas la solution.' });
      }
    }
    return diagnosis({ verdict: 'correct', score: 1, stepsOk: lines.length, stepsTotal: lines.length, details, feedback: def.correctFeedback || 'Toutes les étapes sont justes.' });
  }

  const bad = nodes[firstBad];
  const base = { verdict: 'incorrect', stepsOk: firstBad, stepsTotal: lines.length, firstBadStep: firstBad, details, score: Math.min(0.4, 0.4 * (firstBad / Math.max(1, lines.length))) };
  const where = `Ligne ${firstBad + 1}`;

  const mc = matchLineMisconception(def, params, bad, mode, expectedValue);
  if (mc) return diagnosis({ ...base, errorType: mc.error || 'notion', misconception: mc.id || null, prerequisite: mc.prerequisite || null, feedback: `${where} : ${mc.feedback || 'idée fausse fréquente.'}` });

  if (mode === 'equation') {
    if (bad.t !== 'cmp') return diagnosis({ ...base, errorType: 'methode', feedback: `${where} : en résolvant une équation, chaque ligne doit rester une égalité (avec un signe =).` });
    const prev = firstBad === 0 ? start : nodes[firstBad - 1];
    if (detectSignFlip(prev, bad)) {
      return diagnosis({ ...base, errorType: 'signe', feedback: `${where} : un terme a changé de membre sans changer de signe (ou l'inverse). Rappel : ajouter ou soustraire le même nombre aux deux membres.` });
    }
    const iso = detectIsolateError(prev, bad, v);
    if (iso) return diagnosis({ ...base, errorType: 'notion', misconception: 'mc:isoler-x', feedback: `${where} : ${iso}` });
    return diagnosis({ ...base, errorType: firstBad === 0 ? 'methode' : 'methode', feedback: `${where} : cette équation n'a plus la même solution que la précédente. Quelle opération as-tu faite sur les deux membres ?` });
  }

  if (mode === 'calcul') {
    let val = null;
    try { val = evaluate(bad); } catch { /* ignore */ }
    if (val !== null && Math.abs(val + expectedValue) < 1e-9 && expectedValue !== 0) {
      return diagnosis({ ...base, errorType: 'signe', feedback: `${where} : la valeur a changé de signe.` });
    }
    return diagnosis({ ...base, errorType: 'calcul', feedback: `${where} : cette ligne n'est plus égale à la précédente. Vérifie l'opération effectuée.` });
  }

  // mode expression
  return diagnosis({ ...base, errorType: firstBad === 0 ? 'methode' : 'calcul', feedback: `${where} : cette expression n'est plus égale à la précédente. Teste avec x = 2 de chaque côté pour trouver l'écart.` });
}
