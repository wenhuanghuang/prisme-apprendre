/**
 * Raisonnement : contre-exemples et exercices à plusieurs réponses valables.
 * Ces deux types demandent de la réflexion mais restent vérifiables avec certitude.
 */
import { parse, evaluate, tryParse, formatNumber, toText, solveLinear, variables } from '../expr.js';
import { interpolate } from '../template.js';
import { diagnosis } from '../errors.js';
import { FORMS } from './expression.js';

function predicate(src, params, extra) {
  const env = { ...params, ...extra };
  const names = new Set(Object.keys(env));
  return evaluate(parse(src, { names }), env);
}

/**
 * Contre-exemple. Définition :
 *   claim : énoncé ; vars : ["n"] ; domain : "n >= 0 and estentier(n)" ;
 *   refutes : "not estpremier(n^2+n+41)" ; show : "n^2+n+41" (valeur à montrer dans le retour) ;
 *   claimIsTrue : false (si l'énoncé est vrai, l'élève doit le reconnaître et le justifier).
 */
export function checkCounterexample(def, params, response) {
  if (response.claimTrue) {
    if (def.claimIsTrue) {
      return diagnosis({ verdict: 'a-valider', needsHuman: true, score: 0.5, feedback: "Tu affirmes que l'énoncé est vrai : c'est le cas. Ta justification sera relue (un exemple ne suffit pas, il faut une preuve)." });
    }
    return diagnosis({ verdict: 'incorrect', errorType: 'raisonnement', feedback: "Cet énoncé est en réalité faux : cherche encore, un contre-exemple existe (parfois loin des premiers essais)." });
  }
  const values = {};
  for (const name of def.vars || []) {
    const raw = response.values ? response.values[name] : undefined;
    const r = tryParse(String(raw ?? '').trim());
    if (!r.ok) return diagnosis({ verdict: 'illisible', feedback: `Donne une valeur pour ${name}.` });
    try { values[name] = evaluate(r.node); } catch { return diagnosis({ verdict: 'illisible', feedback: `Valeur de ${name} illisible.` }); }
  }
  const shown = def.show ? ` (${interpolate(def.showLabel || def.show, params)} = ${formatNumber(predicate(def.show, params, values))})` : '';
  const valuesTxt = Object.entries(values).map(([k, v]) => `${k} = ${formatNumber(v)}`).join(', ');
  if (def.domain && !predicate(def.domain, params, values)) {
    return diagnosis({ verdict: 'incorrect', errorType: 'lecture', feedback: `Avec ${valuesTxt}, on sort des conditions de l'énoncé (${def.domainLabel || def.domain}).` });
  }
  if (predicate(def.refutes, params, values)) {
    if (def.claimIsTrue) throw new Error('Contenu incohérent : un énoncé vrai a été réfuté');
    return diagnosis({ verdict: 'correct', score: 1, feedback: `Bravo : avec ${valuesTxt}${shown}, l'énoncé est faux. Un seul contre-exemple suffit pour réfuter un « pour tout ».` });
  }
  return diagnosis({ verdict: 'incorrect', errorType: 'raisonnement', feedback: `Avec ${valuesTxt}${shown}, l'énoncé est vérifié : ce n'est pas un contre-exemple. ${def.refuteHint || 'Essaie des valeurs moins « ordinaires ».'}` });
}

/**
 * Plusieurs réponses valables. Définition :
 *   count : 3 ; predicate : "v > 1/3 and v < 1/2" ; distinct : true ; form : "irreductible" (facultatif)
 */
export function checkMulti(def, params, response) {
  const raw = (response.values || []).map((x) => String(x ?? '').trim());
  const filled = raw.filter(Boolean);
  if (!filled.length) return diagnosis({ verdict: 'vide', feedback: 'Propose au moins une réponse.' });
  const items = [];
  const seen = [];
  for (const txt of raw) {
    if (!txt) { items.push({ text: '', ok: false, reason: 'vide' }); continue; }
    const r = tryParse(txt);
    if (!r.ok) { items.push({ text: txt, ok: false, reason: 'illisible' }); continue; }
    let v;
    try { v = evaluate(r.node); } catch { items.push({ text: txt, ok: false, reason: 'illisible' }); continue; }
    if (def.form && FORMS[def.form] && !FORMS[def.form].test(r.node)) {
      items.push({ text: txt, ok: false, reason: `pas sous ${FORMS[def.form].label}` });
      continue;
    }
    if (def.distinct !== false && seen.some((s) => Math.abs(s - v) < 1e-12)) {
      items.push({ text: txt, ok: false, reason: 'même valeur qu’une autre réponse' });
      continue;
    }
    const ok = Boolean(predicate(def.predicate, params, { v }));
    if (ok) seen.push(v);
    items.push({ text: txt, value: v, ok, reason: ok ? '' : `${toText(r.node)} = ${formatNumber(v)} ne convient pas` });
  }
  const good = items.filter((i) => i.ok).length;
  const count = def.count || 1;
  if (good >= count) return diagnosis({ verdict: 'correct', score: 1, details: items, feedback: def.correctFeedback || 'Toutes tes réponses conviennent. Il en existe bien d’autres !' });
  const firstBad = items.find((i) => !i.ok && i.reason !== 'vide');
  return diagnosis({
    verdict: good > 0 ? 'partiel' : 'incorrect',
    score: good / count * 0.8,
    errorType: firstBad ? 'inconnue' : null,
    details: items,
    feedback: firstBad ? `${good}/${count} réponse(s) valable(s). ${firstBad.reason}.` : `${good}/${count} : complète les cases restantes.`,
  });
}

/**
 * Équation à inventer : l'élève écrit une équation qui doit avoir une propriété donnée.
 *   expectKind : "unique" | "none" | "all" ; expectSolution : "-2/3" (si unique) ;
 *   varBothSides : true (l'inconnue doit apparaître dans les deux membres)
 */
export function checkEquation(def, params, response) {
  const raw = String(response.value ?? '').trim();
  if (!raw) return diagnosis({ verdict: 'vide', feedback: 'Écris ton équation.' });
  const r = tryParse(raw);
  if (!r.ok) return diagnosis({ verdict: 'illisible', feedback: `Je n'arrive pas à lire cette équation (${r.error}).` });
  const eq = r.node;
  const v = def.variable || 'x';
  if (eq.t !== 'cmp' || eq.op !== '=') return diagnosis({ verdict: 'incorrect', errorType: 'lecture', feedback: 'Une équation contient un signe « = ».' });
  if (!variables(eq).has(v)) return diagnosis({ verdict: 'incorrect', errorType: 'lecture', feedback: `L'inconnue ${v} doit apparaître dans ton équation.` });
  if (def.varBothSides && (!variables(eq.a).has(v) || !variables(eq.b).has(v))) {
    return diagnosis({ verdict: 'partiel', score: 0.5, errorType: 'lecture', feedback: `Consigne : ${v} doit apparaître dans les deux membres.` });
  }
  const sol = solveLinear(eq, v);
  if (sol.kind === 'nonlinear') return diagnosis({ verdict: 'incorrect', errorType: 'lecture', feedback: "Cette équation n'est pas du premier degré." });
  const kindLabel = { unique: 'une seule solution', none: 'aucune solution', all: 'une infinité de solutions' };
  if (sol.kind !== def.expectKind) {
    return diagnosis({ verdict: 'incorrect', errorType: 'raisonnement', feedback: `Ton équation a ${kindLabel[sol.kind]}${sol.kind === 'unique' ? ` (${v} = ${formatNumber(sol.x)})` : ''} : ce n'est pas ce qui est demandé.` });
  }
  if (sol.kind === 'unique' && def.expectSolution !== undefined) {
    const target = evaluate(parse(String(def.expectSolution), { names: new Set(Object.keys(params)) }), params);
    if (Math.abs(sol.x - target) > 1e-9) return diagnosis({ verdict: 'incorrect', errorType: 'calcul', feedback: `La solution de ton équation est ${v} = ${formatNumber(sol.x)}, pas ${formatNumber(target)}.` });
  }
  return diagnosis({ verdict: 'correct', score: 1, feedback: def.correctFeedback || 'Ton équation a exactement la propriété demandée.' });
}
