/**
 * Un message d'idée fausse qui contient la réponse attendue la « donne » : l'élève qui la recopie à l'essai
 * suivant n'a pas réussi seul (crédit plafonné, pas d'étoiles ni de points de réussite autonome).
 * Détection prudente : réponse d'au moins 2 caractères, cherchée entre deux limites de mot,
 * et jamais une réponse que l'énoncé lui-même contient déjà.
 */
import { expectedValue } from './checkers/numeric.js';
import { describeExpected as expressionText } from './checkers/expression.js';
import { interpolate } from './template.js';

/** Minuscules, sans accents, tirets et espaces unifiés (espaces insécables compris). */
export function normalizeForReveal(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[−–]/g, '-').replace(/[’‘]/g, "'").replace(/×/g, '*')
    .replace(/\s+/g, ' ')
    .trim();
}

const group = (intPart) => intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** Écritures d'un nombre : « 12,5 », « 12.5 », « 12 500 », « 12500 ». */
export function numberForms(v) {
  if (!Number.isFinite(v)) return [];
  const raw = String(Math.round(v * 1e9) / 1e9);
  if (/e/i.test(raw)) return [];
  const [i, d] = raw.split('.');
  const forms = new Set([raw, raw.replace('.', ',')]);
  const sign = i.startsWith('-') ? '-' : '';
  const grouped = sign + group(i.replace('-', ''));
  forms.add(d ? `${grouped},${d}` : grouped);
  return [...forms];
}

/** Réponses attendues d'une question (texte, nombre, expression), déjà normalisées. */
export function expectedForms(def, params) {
  try {
    if (def.type === 'text') return (def.accept || []).map((a) => normalizeForReveal(String(a).replace(/[.!?;:]+$/, '')));
    if (def.type === 'numeric') return numberForms(expectedValue(def, params)).map(normalizeForReveal);
    if (def.type === 'expression') return [normalizeForReveal(expressionText(def, params))];
  } catch { /* réponse non calculable avec ces paramètres : rien à chercher */ }
  return [];
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Le texte contient-il cette forme, entre deux limites de mot (« 12 » n'est pas trouvé dans « 12,5 » ni « 112 ») ? */
function containsForm(text, form) {
  if (form.replace(/\s/g, '').length < 2) return false;
  const numeric = /^-?[\d ,.]+$/.test(form);
  // un mot très court (« que », « a », « ou ») n'est une réponse donnée que s'il est cité : « que », *que*
  if (!numeric && form.length <= 3) return new RegExp(`[«"“*_'‘]\\s*${escape(form)}\\s*[»"”*_'’]`, 'u').test(text);
  // un nombre qui suit « par », « fois » ou « × » est un facteur du raisonnement (« multiplie par 10 »), pas la réponse
  const before = numeric ? '(?<![\\p{L}\\d]|\\d[.,])(?<!(?:\\bpar|\\bfois|\\*)\\s?)' : '(?<![\\p{L}\\d])';
  const after = numeric ? '(?![\\p{L}\\d]|[.,]\\d)' : '(?![\\p{L}\\d])';
  const re = new RegExp(`${before}${escape(form)}${after}`, 'u');
  if (re.test(text)) return true;
  // expressions : « 2x+3 » écrit sans espaces dans le message
  if (!numeric && /[+\-*/=]/.test(form)) return text.replace(/\s/g, '').includes(form.replace(/\s/g, ''));
  return false;
}

/**
 * Le message de correction donne-t-il la réponse ?
 * @param {{def, params, prompt?}} instance exercice tiré (instantiate)
 * @param {{verdict, feedback, details?}} diagnosis correction de la réponse de l'élève
 */
export function revealsAnswer(instance, diagnosis) {
  if (!instance || !diagnosis || diagnosis.verdict === 'correct') return false;
  const { def, params = {} } = instance;
  const prompt = normalizeForReveal(instance.prompt || '');
  // ce que l'énoncé (général ou de la question) affiche déjà n'est pas une réponse donnée
  const gives = (forms, feedback, partPrompt = '') => {
    const text = normalizeForReveal(feedback);
    const shown = partPrompt ? `${prompt} ${normalizeForReveal(partPrompt.includes('{') ? interpolate(partPrompt, params) : partPrompt)}` : prompt;
    return forms.some((f) => !containsForm(shown, f) && containsForm(text, f));
  };
  if (def.type === 'composite') {
    // chaque question encore fausse face à SON message : citer la réponse d'une autre question ne donne rien
    const details = Array.isArray(diagnosis.details) ? diagnosis.details : [];
    return (def.parts || []).some((p, i) => {
      const d = details[i];
      if (!d || d.verdict === 'correct' || typeof d.feedback !== 'string') return false;
      return gives(expectedForms(p, params), d.feedback.includes('{') ? interpolate(d.feedback, params) : d.feedback, p.prompt || '');
    });
  }
  return typeof diagnosis.feedback === 'string' && gives(expectedForms(def, params), diagnosis.feedback);
}
