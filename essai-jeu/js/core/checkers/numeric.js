/**
 * Réponse numérique (éventuellement avec unité).
 * Diagnostics automatiques : idée fausse déclarée par le contenu, signe inversé,
 * puissance de 10 (conversion), arrondi, petite erreur de calcul, autre grandeur (lecture).
 */
import { tryParse, evaluate, formatNumber, isFinalNumber } from '../expr.js';
import { parseWithParams, interpolate } from '../template.js';
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

const NUMBER_WORDS = {
  zero: 0, aucun: 0, aucune: 0, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10,
  onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16, 'dix-sept': 17, 'dix-huit': 18, 'dix-neuf': 19,
  vingt: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60, cent: 100, mille: 1000,
};
// mots qui font partie d'un calcul : « 5 pi », « 3 fois 4 » ne sont pas « un nombre suivi d'un mot »
const MATH_WORDS = new Set(['pi', 'racine', 'sqrt', 'fois', 'plus', 'moins', 'sur', 'divise', 'par', 'puissance', 'exposant', 'carre', 'cube', 'ln', 'log', 'exp', 'sin', 'cos', 'tan', 'et']);
const plainWord = (w) => w.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const wordsOf = (s) => plainWord(s).split(/[\s'’-]+/).filter(Boolean);
// mots qui changent la valeur du nombre : « 68 millions », « 3 quarts » ne valent pas 68 ni 3
const MAGNITUDES = new Set(['million', 'millions', 'milliard', 'milliards', 'mille', 'milles', 'cent', 'cents', 'centaine', 'centaines', 'dizaine', 'dizaines', 'dixieme', 'dixiemes', 'centieme', 'centiemes', 'millieme', 'milliemes', 'tiers', 'quart', 'quarts', 'demi', 'demie', 'demis', 'virgule',
  'millier', 'milliers', 'douzaine', 'douzaines', 'pourcent', 'pourcents', 'negatif', 'negatifs', 'negative', 'positif', 'positifs', 'positive', 'racine', 'racines', 'carres', 'cubes']);
const harmless = (s) => wordsOf(s).every((w) => w.length >= 2 && !MATH_WORDS.has(w) && !MAGNITUDES.has(w) && NUMBER_WORDS[w] === undefined);

/**
 * Sans unité attendue, un nombre suivi de mots sans opérateur (« 7 syllabes », « 1 000 habitants ») se lit comme ce
 * nombre, sauf si un mot en change la valeur (« 68 millions »). Un nombre simple écrit en lettres et SEUL (« cinq »,
 * « vingt », « aucun ») aussi. Renvoie l'écriture en chiffres, ou null si la saisie n'est pas de cette forme.
 */
export function wordedNumber(raw) {
  const m = String(raw).match(/^([−-]?\d{1,3}(?:[   ]\d{3})+(?:[.,]\d+)?|[−-]?\d+(?:[.,]\d+)?)\s+([\p{L}'’ -]+)$/u);
  if (m) return harmless(m[2]) ? m[1].replace(/[   ]/g, '') : null;
  const n = NUMBER_WORDS[plainWord(String(raw).trim())];
  return n === undefined ? null : String(n);
}

/**
 * Unités citées dans un énoncé (« 70 cm », « (en km) », « combien de minutes ») : pour vérifier une unité tapée alors
 * qu'aucune n'est attendue. Une lettre seule (« s », « m ») ne compte que derrière un nombre ou « en ».
 */
export function unitsInText(text) {
  const s = String(text || '');
  const found = [];
  for (const m of s.matchAll(/[\p{L}°µ][\p{L}°µ²³/·]*/gu)) {
    const tok = m[0];
    if (tok.length < 2 && !/(?:\d|\ben|…|\.{3})\s*\(?\s*$/u.test(s.slice(0, m.index))) continue;
    const u = parseUnit(tok);
    if (u && u.text) found.push(u);
  }
  return found;
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
  if (!expectUnit) {
    // « 23 °C », « 150 m² », « 12 heures » alors que l'énoncé ne demande que le nombre : on lit le nombre
    const q = parseQuantity(raw);
    if (q && q.unit && q.unitText) return { value: q.value, node: q.node, percent, ignoredUnit: q.unit, ignoredUnitText: q.unitText };
  }
  // sans unité attendue : un montant « 7,50 € » se lit 7,5 ; « 8 x 3 » = 8 × 3 (la lettre x pour « fois »)
  raw = raw.replace(/\s*(?:€|euros?)\s*$/i, '');
  // un angle « 37° » ou « 37 degrés » quand on demande le nombre seul
  raw = raw.replace(/\s*(?:°|degrés?)\s*$/i, '');
  // « 7 syllabes », « cinq », « 40 secondes » quand on demande le nombre seul
  raw = wordedNumber(raw) ?? raw;
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

/** Unités que l'énoncé DEMANDE : « en km », « (en cm²) », « combien de grammes », « nombre de minutes », « = … m ». */
export function requestedUnits(text) {
  const out = [];
  const re = /(?:\ben|\bcombien\s+d(?:e\s+|['’]\s*)|\bnombre\s+d(?:e\s+|['’]\s*)|…|\.{3})\s*\(?\s*([\p{L}°µ][\p{L}°µ²³/·]*)/giu;
  for (const m of String(text || '').matchAll(re)) {
    const u = parseUnit(m[1]);
    if (u && u.text) out.push(u);
  }
  return out;
}

/**
 * Unité tapée alors que l'exercice ne demande que le nombre : elle doit être celle que l'énoncé demande.
 * Renvoie null (unité acceptable), 'autre' (une autre unité de la même grandeur : erreur) ou 'ambigue'
 * (l'énoncé cite des unités de cette grandeur sans dire laquelle : on demande le nombre seul, sans pénalité).
 */
export function typedUnitProblem(read, promptText) {
  const u = read.ignoredUnit;
  if (!u) return null;
  const same = (x) => sameDimension(x, u);
  const sameFactor = (x) => Math.abs(x.factor - u.factor) <= 1e-9 * x.factor;
  const asked = requestedUnits(promptText).filter(same);
  if (asked.length) return asked.some(sameFactor) ? null : 'autre';
  const cited = unitsInText(promptText).filter(same);
  if (!cited.length || cited.every(sameFactor)) return null; // aucune unité de cette grandeur, ou une seule : la même
  return cited.some(sameFactor) ? 'ambigue' : 'autre';
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function checkNumeric(rawDef, params, rawResponse) {
  // `unit` qui n'est pas une grandeur physique (« € », « % », « avions ») : une étiquette, retirée de la réponse
  const label = rawDef.unit && !parseUnit(rawDef.unit) ? String(rawDef.unit) : null;
  const def = label ? { ...rawDef, unit: undefined } : rawDef;
  const response = label ? { ...rawResponse, value: String(rawResponse.value ?? '').replace(new RegExp(`\\s*${escapeRe(label)}\\s*$`, 'i'), '') } : rawResponse;
  const expected = expectedValue(def, params);
  const read = readNumber(response.value, def.unit);
  if (read.empty) return diagnosis({ verdict: 'vide', feedback: 'Écris ta réponse avant de valider.' });
  // « 90 min = … h (écriture décimale) » : « 1 h 30 » vaut bien 1,5 h, mais ce n'est pas la forme demandée
  if (def.decimalOnly && /\d\s*h\s*\d/i.test(String(response.value ?? ''))) {
    return diagnosis({ verdict: 'incorrect', errorType: 'forme', feedback: 'On demande l’écriture décimale : écris la durée en heures avec une virgule, pas en heures et minutes.' });
  }
  if (read.error) return diagnosis({ verdict: 'illisible', feedback: `Je n'ai pas réussi à lire ta réponse (${read.error}). Écris par exemple 3,5 ou 7/4.` });

  // unité tapée alors que l'énoncé ne demande que le nombre : ce doit être l'unité que l'énoncé demande
  const unitPb = !def.unit && read.ignoredUnit ? typedUnitProblem(read, interpolate(def.prompt || '', params || {})) : null;
  if (unitPb === 'autre') return diagnosis({ verdict: 'incorrect', errorType: 'unite', feedback: `Ta réponse est en « ${read.ignoredUnitText} » : relis l'unité demandée dans l'énoncé.` });
  if (unitPb === 'ambigue') return diagnosis({ verdict: 'illisible', feedback: 'Écris seulement le nombre : l’unité est déjà fixée par l’énoncé.' });
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
  // Ainsi « 0,85 % » n'est pas accepté pour 0,85. Avec `percent: true`, la réponse attendue est un pourcentage écrit
  // (0,3 pour 0,3 %) : un « % » tapé ne divise jamais.
  if (read.percent && !def.percent && Math.abs(expected) < 1) value /= 100;
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
  // valeur limite (charge maximale, dose minimale…) : arrondir du mauvais côté est une vraie erreur
  if (relGap < 0.02 && ((def.limit === 'max' && value > expected) || (def.limit === 'min' && value < expected))) {
    return diagnosis({ verdict: 'incorrect', errorType: 'precision', feedback: def.limit === 'max' ? 'Attention, c’est une limite à ne pas dépasser : ta valeur la dépasse. Arrondis du côté sûr.' : 'Attention, c’est un minimum : ta valeur est en dessous. Arrondis du côté sûr.' });
  }
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
  if (def.percent) return `${formatNumber(v)} %`;
  return def.unit ? `${formatNumber(v)} ${def.unit}` : formatNumber(v);
}
