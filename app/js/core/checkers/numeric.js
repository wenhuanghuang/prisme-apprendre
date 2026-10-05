/**
 * Réponse numérique (éventuellement avec unité).
 * Diagnostics automatiques : idée fausse déclarée par le contenu, signe inversé,
 * puissance de 10 (conversion), arrondi, petite erreur de calcul, autre grandeur (lecture).
 */
import { tryParse, evaluate, formatNumber, isFinalNumber } from '../expr.js';
import { parseWithParams } from '../template.js';
import { parseQuantity, parseUnit, sameDimension } from '../units.js';
import { diagnosis } from '../errors.js';

export function expectedValue(def, params) {
  if (typeof def.answer === 'number') return def.answer;
  return evaluate(parseWithParams(def.answer, params));
}

function closeEnough(value, expected, def) {
  if (def.tolerance !== undefined) return Math.abs(value - expected) <= def.tolerance + 1e-9;
  if (def.rel !== undefined) return Math.abs(value - expected) <= def.rel * Math.abs(expected) + 1e-12;
  return Math.abs(value - expected) <= 1e-9 * Math.max(1, Math.abs(expected));
}

/** Lit la saisie de l'élève : nombre, fraction ou calcul simple, avec unité éventuelle. */
export function readNumber(text, expectUnit) {
  let raw = String(text ?? '').trim();
  const percent = /%\s*$/.test(raw) && expectUnit !== '%';
  if (percent) raw = raw.replace(/%\s*$/, '').trim();
  if (!raw) return { empty: true };
  if (expectUnit) {
    const q = parseQuantity(raw);
    // node : l'écriture lue, pour vérifier aussi l'arrondi et que le calcul est terminé
    if (q && !q.unitText) return { value: q.value, unit: null, unitText: '', badUnit: true, node: q.node };
    if (q && q.unit) return { value: q.value, unit: q.unit, unitText: q.unitText, node: q.node };
    if (q && q.unknownUnit) return { error: `je ne reconnais pas l'unité « ${q.unitText} » (exemples : ${expectUnit}, km/h, g/cm³)` };
    if (q && !q.unit) return { value: q.value, unit: null, unitText: q.unitText, badUnit: true, node: q.node };
  }
  // sans unité attendue : un montant « 7,50 € » se lit 7,5 ; « 8 x 3 » = 8 × 3 (la lettre x pour « fois »)
  raw = raw.replace(/\s*(?:€|euros?)\s*$/i, '');
  raw = raw.replace(/(\d)\s*[xX]\s*(?=[\d(])/g, '$1 × ');
  const parsed = tryParse(raw);
  if (!parsed.ok) return { error: parsed.error };
  try {
    const v = evaluate(parsed.node);
    if (!Number.isFinite(v)) return { error: 'Valeur non définie' };
    return { value: v, node: parsed.node, percent };
  } catch (e) {
    return { error: e.message };
  }
}

function isPowerOfTenOff(value, expected) {
  if (!expected || !value) return false;
  const r = Math.abs(value / expected);
  const k = Math.log10(r);
  return Math.abs(k - Math.round(k)) < 1e-6 && Math.round(k) !== 0 && Math.abs(Math.round(k)) <= 9;
}

function matchMisconception(def, params, value) {
  for (const mc of def.misconceptions || []) {
    let v;
    try { v = typeof mc.answer === 'number' ? mc.answer : evaluate(parseWithParams(mc.answer, params)); } catch { continue; }
    if (Math.abs(v - value) <= 1e-9 * Math.max(1, Math.abs(v))
      || (def.rel !== undefined && Math.abs(v - value) <= def.rel * Math.abs(v))
      || (def.tolerance !== undefined && Math.abs(v - value) <= def.tolerance + 1e-9)) return mc;
  }
  return null;
}

export function checkNumeric(def, params, response) {
  const expected = expectedValue(def, params);
  const read = readNumber(response.value, def.unit);
  if (read.empty) return diagnosis({ verdict: 'vide', feedback: 'Écris ta réponse avant de valider.' });
  if (read.error) return diagnosis({ verdict: 'illisible', feedback: `Je n'ai pas réussi à lire ta réponse (${read.error}). Écris par exemple 3,5 ou 7/4.` });

  let value = read.value;
  let unitNote = null;
  if (def.unit) {
    const target = parseUnit(def.unit);
    if (!read.unit || read.badUnit) {
      // conversion « 2,5 km = … m » : l'unité est imposée par l'énoncé, le nombre seul suffit
      if (!def.unitOptional) unitNote = `Précise l'unité (attendu : ${def.unit}).`;
    } else if (def.strictUnit && sameDimension(read.unit, target) && Math.abs(read.unit.factor - target.factor) > 1e-12 * target.factor) {
      const v = (read.value * read.unit.factor) / target.factor;
      if (closeEnough(v, expected, def)) return diagnosis({ verdict: 'incorrect', score: 0, errorType: 'unite', feedback: `Tu as gardé la même grandeur dans une autre unité : il faut l'exprimer en ${def.unit}.` });
      value = v;
    } else if (!sameDimension(read.unit, target)) {
      return diagnosis({ verdict: 'incorrect', errorType: 'unite', feedback: `L'unité « ${read.unitText} » ne correspond pas à la grandeur demandée (${def.unit}).` });
    } else {
      value = (read.value * read.unit.factor) / target.factor;
    }
  }

  // « 85 % » : on accepte la valeur écrite (85) ou sa forme décimale (0,85) selon ce qui est attendu
  // « 85 % » : si la réponse attendue est un pourcentage (85), on garde 85 ; si c'est une proportion (0,85), 85 % = 0,85.
  // Ainsi « 0,85 % » n'est pas accepté pour 0,85.
  if (read.percent && Math.abs(expected) < 1) value /= 100;
  if (closeEnough(value, expected, def)) {
    if (unitNote) return diagnosis({ verdict: 'partiel', score: 0.7, errorType: 'unite', feedback: `La valeur est juste. ${unitNote}` });
    if (def.round !== undefined && read.node) {
      const txt = String(response.value).replace(',', '.');
      const decimals = (txt.split('.')[1] || '').replace(/\D.*$/, '').length;
      if (decimals > def.round) return diagnosis({ verdict: 'partiel', score: 0.8, errorType: 'precision', feedback: `Juste, mais arrondis au nombre de décimales demandé (${def.round}).` });
    }
    // un calcul non effectué (« 2^5 » pour « calcule 2⁵ ») n'est pas un résultat
    if (read.node && !def.allowExpression && !isFinalNumber(read.node)) {
      return diagnosis({ verdict: 'partiel', score: 0.5, errorType: 'forme', feedback: 'Ton calcul donne bien le bon résultat, mais termine-le : écris le nombre obtenu.' });
    }
    return diagnosis({ verdict: 'correct', score: 1, feedback: def.correctFeedback || 'Exact.' });
  }

  const mc = matchMisconception(def, params, value);
  if (mc) {
    return diagnosis({
      verdict: 'incorrect', errorType: mc.error || 'notion', misconception: mc.id || null,
      prerequisite: mc.prerequisite || null, feedback: mc.feedback || '',
    });
  }
  if (Math.abs(value + expected) <= 1e-9 * Math.max(1, Math.abs(expected)) && expected !== 0) {
    return diagnosis({ verdict: 'incorrect', errorType: 'signe', feedback: 'Tu as la bonne valeur, mais avec le mauvais signe.' });
  }
  if (isPowerOfTenOff(value, expected)) {
    return diagnosis({ verdict: 'incorrect', errorType: def.unit ? 'unite' : 'calcul', feedback: def.unit ? 'Les chiffres sont bons mais pas la puissance de 10 : vérifie la conversion des unités.' : 'Les chiffres sont bons, mais la virgule (ou un zéro) est mal placée.' });
  }
  const relGap = Math.abs(value - expected) / Math.max(1e-12, Math.abs(expected));
  if (def.round !== undefined && relGap < 0.02) {
    return diagnosis({ verdict: 'partiel', score: 0.6, errorType: 'precision', feedback: `Très proche. Vérifie l'arrondi (${def.round} décimale${def.round > 1 ? 's' : ''}).` });
  }
  if (Number.isInteger(expected) && Number.isInteger(value) && Math.abs(value - expected) <= 2 && Math.abs(expected) >= 5) {
    return diagnosis({ verdict: 'incorrect', errorType: 'calcul', feedback: 'Tu es tout près : une petite erreur de calcul, refais le calcul pas à pas.' });
  }
  if (relGap < 0.02) {
    return diagnosis({ verdict: 'incorrect', errorType: 'calcul', feedback: 'Très proche du résultat : vérifie tes calculs intermédiaires.' });
  }
  return diagnosis({ verdict: 'incorrect', errorType: 'inconnue', feedback: def.wrongFeedback || "Ce n'est pas le résultat attendu." });
}

export function describeExpected(def, params) {
  const v = expectedValue(def, params);
  return def.unit ? `${formatNumber(v)} ${def.unit}` : formatNumber(v);
}
