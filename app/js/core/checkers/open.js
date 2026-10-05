/**
 * Réponses rédigées (explications, démonstrations, textes).
 * Principe d'honnêteté : le logiciel ne déclare JAMAIS une rédaction fausse. Il affiche les critères
 * de réussite, signale des repères qu'il a détectés (ou non) à titre indicatif, demande une
 * auto-évaluation, puis place la réponse en attente de validation par un parent ou un professeur.
 */
import { diagnosis } from '../errors.js';

export function normalizeText(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function wordCount(s) {
  return String(s || '').trim().split(/\s+/).filter(Boolean).length;
}

/** Un critère est « repéré » si l'un de ses mots-clés (ou groupes de mots alternatifs) apparaît. */
export function detectCriterion(text, criterion) {
  if (!criterion.keywords || !criterion.keywords.length) return null;
  const t = normalizeText(text);
  // début de mot obligatoire (« or » ne doit pas être repéré dans « encore ») ; la fin reste libre (radicaux)
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return criterion.keywords.some((k) => {
    const alternatives = Array.isArray(k) ? k : [k];
    return alternatives.some((a) => new RegExp(`(?:^|[^a-z0-9])${esc(normalizeText(a))}`).test(t));
  });
}

export function checkOpen(def, params, response) {
  const text = String(response.text || '').trim();
  if (!text) return diagnosis({ verdict: 'vide', feedback: 'Écris ta réponse avant de la soumettre.' });
  const words = wordCount(text);
  const minWords = def.minWords || 0;
  const criteria = (def.criteria || []).map((c) => ({
    id: c.id,
    label: c.label,
    detected: detectCriterion(text, c),
    self: response.selfCheck ? Boolean(response.selfCheck[c.id]) : null,
  }));
  const selfCount = criteria.filter((c) => c.self).length;
  const selfRatio = criteria.length ? selfCount / criteria.length : 0;
  const missingHints = criteria.filter((c) => c.detected === false).map((c) => c.label);

  let feedback = 'Réponse enregistrée. Compare-la aux critères puis à des exemples de bonnes démarches.';
  if (words < minWords) feedback = `Ta réponse est courte (${words} mots) : développe un peu (au moins ${minWords} mots conseillés).`;
  else if (missingHints.length) feedback = `Piste de relecture (indicative, non certaine) : vérifie si tu as bien traité « ${missingHints[0]} ».`;

  return diagnosis({
    verdict: 'a-valider',
    score: Math.round(selfRatio * 50) / 100, // poids provisoire faible tant que personne n'a validé
    needsHuman: true,
    details: criteria,
    feedback,
  });
}

function normShort(s, { caseSensitive = false, accents = true } = {}) {
  let t = String(s || '').trim().replace(/[’']/g, "'").replace(/\s+/g, ' ').replace(/[.!?;:]+$/, '').trim();
  if (!caseSensitive) t = t.toLowerCase();
  if (!accents) t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return t;
}

/**
 * Réponse courte (un mot, une forme verbale, un terme) : def.accept = ["cueillies", …],
 * def.misconceptions = [{answer: "cueilli", id, error, feedback}], def.caseSensitive (défaut : non).
 * Une réponse juste à l'accent près est signalée sans être comptée fausse.
 */
export function checkText(def, params, response) {
  const raw = String(response.value ?? '').trim();
  if (!raw) return diagnosis({ verdict: 'vide', feedback: 'Écris ta réponse.' });
  const opts = { caseSensitive: Boolean(def.caseSensitive) };
  const given = normShort(raw, opts);
  const accepted = (def.accept || []).map((a) => normShort(a, opts));
  if (accepted.includes(given)) return diagnosis({ verdict: 'correct', score: 1, feedback: def.correctFeedback || 'Exact.' });
  for (const mc of def.misconceptions || []) {
    if (normShort(mc.answer, opts) === given) {
      return diagnosis({ verdict: 'incorrect', errorType: mc.error || 'notion', misconception: mc.id || null, prerequisite: mc.prerequisite || null, feedback: mc.feedback || '' });
    }
  }
  const noAcc = (s) => normShort(s, { ...opts, accents: false });
  if ((def.accept || []).some((a) => noAcc(a) === noAcc(raw))) {
    return diagnosis({ verdict: 'partiel', score: 0.7, errorType: 'forme', feedback: 'Presque : vérifie les accents.' });
  }
  return diagnosis({ verdict: def.openEnded ? 'incertain' : 'incorrect', errorType: def.openEnded ? null : 'inconnue', needsHuman: Boolean(def.openEnded), feedback: def.openEnded ? "Réponse différente de celles que je connais : elle n'est pas forcément fausse, un adulte pourra la valider." : (def.wrongFeedback || "Ce n'est pas la réponse attendue.") });
}
