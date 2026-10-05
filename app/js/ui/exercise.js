/**
 * Un exercice jouable : énoncé, activité éventuelle, zone de réponse, indices progressifs,
 * correction détaillée, plusieurs démarches, nouvelle version (réponses rédigées) et
 * enregistrement de la tentative dans le modèle de l'élève.
 */
import { h, richText, inlineHTML, announce } from './dom.js';
import { instantiate, check } from '../core/checkers/index.js';
import { interpolateDeep } from '../core/template.js';
import { ERROR_TYPES } from '../core/errors.js';
import { createAnswer, justificationField } from './answers.js';
import { mountActivity } from '../activities/registry.js';
import { recordAttempt, store } from '../app/store.js';
import { photon } from './photon.js';

export const ROLE_LABELS = {
  guide: 'Guidé', libre: 'Réponse libre', reinvestissement: 'Problème', transfert: 'Transfert', remediation: 'Point précis',
  defi: 'Défi', mission: 'Mission', verification: 'Vérification rapide', labo: 'Laboratoire', debug: 'Débogage',
};
export const TRACK_LABELS = { classe: 'Niveau de la classe', approfondissement: 'Approfondissement · facultatif', expert: 'Expert · facultatif' };
export const TRACK_ICONS = { classe: '●', approfondissement: '◆', expert: '✦' };

const VERDICT_UI = {
  correct: { cls: 'ok', title: 'Réussi', mood: 'joie' },
  partiel: { cls: 'partial', title: 'Presque', mood: 'encourage' },
  incorrect: { cls: 'ko', title: 'Pas encore', mood: 'encourage' },
  'a-valider': { cls: 'pending', title: 'Réponse enregistrée', mood: 'attentif' },
  incertain: { cls: 'pending', title: 'À vérifier par un adulte', mood: 'attentif' },
  vide: { cls: 'neutral', title: '', mood: 'attentif' },
  illisible: { cls: 'neutral', title: 'Écriture à préciser', mood: 'attentif' },
};

/** Après interpolation, « −3 » ou « 2,5 » redeviennent des nombres pour les activités. */
export function coerceNumbers(v) {
  if (typeof v === 'string' && /^\s*[−-]?\d+(?:[.,]\d+)?\s*$/.test(v)) return Number(v.trim().replace('−', '-').replace(',', '.'));
  if (Array.isArray(v)) return v.map(coerceNumbers);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, coerceNumbers(x)]));
  return v;
}

function difficultyDots(d = 2) {
  return h('span', { class: 'dots', title: `Difficulté ${d}/5`, 'aria-label': `Difficulté ${d} sur 5` }, ...[1, 2, 3, 4, 5].map((i) => h('i', { class: i <= d ? 'on' : '' })));
}

/**
 * @param {HTMLElement} container
 * @param {{ def, lessonId?, seed?, context?, why?: string[], onNext?: Function, compact?: boolean }} opts
 */
export function mountExercise(container, opts) {
  const { def } = opts;
  const inst = instantiate(def, opts.seed ?? Math.floor(Math.random() * 1e9));
  const started = Date.now();
  let tries = 0; let hintsUsed = 0; let solutionShown = false; let finished = false; let recorded = false;
  let lastDiag = null; let firstError = null; let giveUpArmed = false; const cleanups = [];

  const skill = store.index && store.index.skills.get(def.skill);
  const head = h('header', { class: 'ex-head' },
    h('span', { class: `chip chip--track-${def.track || 'classe'}` }, TRACK_ICONS[def.track || 'classe'], ' ', TRACK_LABELS[def.track || 'classe']),
    def.role ? h('span', { class: `chip chip--role chip--role-${def.role}` }, ROLE_LABELS[def.role] || def.role) : null,
    difficultyDots(def.difficulty),
    skill ? h('span', { class: 'ex-skill' }, skill.label) : null);

  const prompt = richText(inst.prompt, 'rich ex-prompt');
  let activityEl = null;
  if (def.activity) {
    activityEl = h('div', { class: 'ex-activity' });
    const cfg = coerceNumbers(interpolateDeep(def.activity.config || {}, inst.params));
    cleanups.push(mountActivity(activityEl, def.activity.widget, cfg));
  }
  const criteria = Array.isArray(def.criteria) && def.criteria.length && typeof def.criteria[0] === 'string'
    ? h('details', { class: 'criteria-box' }, h('summary', {}, 'Critères de réussite'), h('ul', {}, def.criteria.map((c) => h('li', { html: inlineHTML(c) })))) : null;

  const ctx = { submit: () => submit() };
  const answer = createAnswer(inst, def, ctx);
  const just = def.justify ? justificationField(def.justify) : null;

  const feedback = h('div', { class: 'feedback', 'aria-live': 'polite', hidden: true });
  const hintsBox = h('div', { class: 'hints', 'aria-live': 'polite' });
  const extra = h('div', { class: 'ex-extra' });

  const btnSubmit = h('button', { type: 'button', class: 'btn btn--primary', onclick: () => submit() }, def.type === 'open' ? 'Soumettre ma réponse' : 'Valider');
  const btnHint = h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => showHint(), disabled: !inst.hints.length }, inst.hints.length ? `Indice (${inst.hints.length})` : 'Pas d’indice');
  const btnSolution = h('button', { type: 'button', class: 'btn btn--ghost btn--quiet', onclick: () => giveUp() }, 'Voir la correction');
  const btnNext = h('button', { type: 'button', class: 'btn btn--primary', hidden: true, onclick: () => { finish(); if (opts.onNext) opts.onNext(lastDiag); } }, opts.nextLabel || 'Continuer');
  const btnNewVersion = h('button', { type: 'button', class: 'btn btn--ghost', hidden: true, onclick: () => newVersion() }, 'Améliorer ma réponse (nouvelle version)');
  const actions = h('div', { class: 'ex-actions' }, btnSubmit, btnHint, btnSolution, btnNewVersion, btnNext);

  const why = opts.why && opts.why.length ? h('details', { class: 'why' }, h('summary', {}, 'Pourquoi cet exercice ?'), h('ul', {}, opts.why.map((w) => h('li', {}, w)))) : null;

  const card = h('article', { class: `ex ex--${def.type} ${opts.compact ? 'ex--compact' : ''}`, 'aria-label': 'Exercice' },
    head, why, prompt, activityEl, criteria, h('div', { class: 'ex-answer' }, answer.el, just ? just.el : null), actions, hintsBox, feedback, extra);
  container.append(card);

  function showHint() {
    if (hintsUsed >= inst.hints.length) return;
    const n = hintsUsed;
    hintsUsed++;
    hintsBox.append(h('div', { class: 'hint' }, h('strong', {}, `Indice ${n + 1}/${inst.hints.length} · `), h('span', { html: inlineHTML(inst.hints[n]) })));
    btnHint.textContent = hintsUsed < inst.hints.length ? `Indice suivant (${inst.hints.length - hintsUsed})` : 'Plus d’indice';
    btnHint.disabled = hintsUsed >= inst.hints.length;
    announce(`Indice ${n + 1} : ${inst.hints[n]}`);
  }

  function renderFeedback(d) {
    const ui = VERDICT_UI[d.verdict] || VERDICT_UI.incorrect;
    feedback.hidden = false;
    feedback.className = `feedback feedback--${ui.cls}`;
    const et = d.errorType && ERROR_TYPES[d.errorType];
    const steps = d.stepsTotal ? h('p', { class: 'fb-steps' }, `${d.stepsOk}/${d.stepsTotal} étape${d.stepsTotal > 1 ? 's' : ''} juste${d.stepsTotal > 1 ? 's' : ''}`) : null;
    const message = d.verdict === 'correct' && tries === 1 && hintsUsed === 0 ? 'Réussi du premier coup, sans indice.' : d.feedback;
    feedback.replaceChildren(
      photon(ui.mood),
      h('div', { class: 'fb-body' },
        ui.title ? h('p', { class: 'fb-title' }, ui.title) : null,
        h('p', { class: 'fb-msg', html: inlineHTML(message || '') }),
        steps,
        et && d.verdict !== 'correct' ? h('p', { class: 'fb-error' }, h('span', { class: `chip chip--err chip--err-${et.family}` }, et.label), ' ', h('span', { class: 'muted' }, et.student)) : null,
        d.verdict === 'incertain' ? h('p', { class: 'muted small' }, "Je ne peux pas évaluer cette réponse avec certitude : elle n'est pas comptée fausse et un adulte pourra la valider.") : null,
        d.verdict === 'a-valider' ? h('p', { class: 'muted small' }, "Je ne note pas les rédactions automatiquement : compare-la aux critères et aux exemples ci-dessous. Un parent ou un professeur pourra la valider depuis l'espace parents.") : null));
  }

  function showSolution(reason) {
    if (extra.dataset.shown) return;
    extra.dataset.shown = '1';
    const blocks = [];
    if (inst.solution) blocks.push(h('section', { class: 'solution' }, h('h4', {}, reason === 'giveup' ? 'Correction détaillée' : 'Correction'), richText(inst.solution)));
    if (inst.methods.length) blocks.push(h('section', { class: 'methods' }, h('h4', {}, 'Autres démarches valables'), h('ol', {}, inst.methods.map((m) => h('li', { html: inlineHTML(m) })))));
    if (inst.models.length) blocks.push(h('section', { class: 'models' }, h('h4', {}, 'Exemples de bonnes réponses'), ...inst.models.map((m) => h('blockquote', { class: 'model' }, richText(m)))));
    const partModels = (def.parts || []).flatMap((p) => interpolateDeep(p.models || [], inst.params));
    if (partModels.length) blocks.push(h('section', { class: 'models' }, h('h4', {}, 'Exemples de bonnes réponses'), ...partModels.map((m) => h('blockquote', { class: 'model' }, richText(m)))));
    extra.append(...blocks);
  }

  async function record(d) {
    if (recorded && d.verdict !== 'a-valider') return;
    recorded = true;
    const response = answer.getResponse();
    await recordAttempt(inst, { ...d, errorType: d.verdict === 'correct' ? null : d.errorType }, {
      tries, hintsUsed, solutionShown, durationMs: Date.now() - started, lessonId: opts.lessonId, context: opts.context || null,
      response: def.type === 'open' || d.needsHuman ? response : undefined, firstError,
    });
  }

  async function submit() {
    if (finished) return;
    const response = { ...answer.getResponse(), ...(just ? { justification: just.value() } : {}) };
    const d = check(inst, response);
    if (d.verdict === 'vide' || d.verdict === 'illisible') { renderFeedback(d); answer.show(d); return; }
    tries++;
    lastDiag = d;
    if (d.errorType && !firstError && d.verdict !== 'correct') firstError = d.errorType;
    renderFeedback(d);
    answer.show(d);
    announce(`${VERDICT_UI[d.verdict] ? VERDICT_UI[d.verdict].title : ''}. ${d.feedback || ''}`);
    if (d.verdict === 'correct') {
      await record(d);
      done();
      showSolution('correct');
    } else if (d.verdict === 'a-valider' || d.verdict === 'incertain') {
      await record(d);
      answer.lock(true); if (just) just.lock(true);
      showSolution('open');
      btnSubmit.hidden = true; btnSolution.hidden = true; btnHint.hidden = true;
      btnNewVersion.hidden = def.type !== 'open';
      btnNext.hidden = false;
    } else if (tries >= 3 && !inst.hints.length) {
      btnSolution.classList.remove('btn--quiet');
    }
  }

  function newVersion() {
    answer.lock(false);
    if (answer.unlockForNewVersion) answer.unlockForNewVersion();
    btnSubmit.hidden = false; btnNewVersion.hidden = true; btnNext.hidden = true;
    btnSubmit.textContent = 'Soumettre la nouvelle version';
    feedback.hidden = true;
  }

  async function giveUp() {
    if (finished) return;
    if (tries === 0 && !giveUpArmed) {
      giveUpArmed = true;
      btnSolution.textContent = 'Essayer d’abord aide à retenir — voir quand même ?';
      announce('Essayer d’abord, même faux, aide beaucoup plus à retenir. Clique à nouveau pour voir la correction.');
      return;
    }
    solutionShown = true;
    const d = lastDiag || { verdict: 'incorrect', score: 0, errorType: null };
    tries = Math.max(tries, 1);
    await record({ ...d, verdict: d.verdict === 'correct' ? 'correct' : 'incorrect' });
    done();
    showSolution('giveup');
  }

  function done() {
    finished = true;
    answer.lock(true); if (just) just.lock(true);
    btnSubmit.hidden = true; btnHint.hidden = true; btnSolution.hidden = true;
    btnNext.hidden = false;
    btnNext.focus();
  }

  function finish() {
    if (!recorded && tries > 0 && lastDiag) record(lastDiag);
  }

  return {
    el: card,
    instance: inst,
    destroy() { finish(); cleanups.forEach((c) => c && c()); },
  };
}
