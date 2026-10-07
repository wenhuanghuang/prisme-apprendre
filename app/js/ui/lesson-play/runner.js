/**
 * Série d'exercices jouée un par un : compteur, pastilles d'étoiles, « passer », bilan de la série.
 */
import { h, announce } from '../dom.js';
import { mountExercise } from '../exercise.js';
import { photon } from '../photon.js';
import { burstStars } from './celebrate.js';

const STAR_LABEL = ['passé ou corrigé', '1 étoile', '2 étoiles', '3 étoiles'];

/**
 * @param {object[]} defs définitions d'exercices
 * @param {{ lessonId: string, results: Record<string, {stars:number}>, onResult?: Function, onChange?: Function, startAt?: string }} opts
 *   `onChange` est appelé quand l'état « série terminée » peut avoir changé.
 */
export function exerciseRunner(defs, opts) {
  let i = 0;
  let mounted = null;
  let summaryShown = false;
  const results = opts.results; // partagé avec la leçon (étoiles déjà gagnées)
  // terminée = chaque exercice a été réussi, corrigé ou passé
  const complete = () => defs.every((d) => results[d.id]);
  const changed = () => { if (opts.onChange) opts.onChange(); };
  const dots = h('ol', { class: 'run-dots', 'aria-label': 'Exercices de cette étape' });
  const counter = h('p', { class: 'run-counter' });
  const slot = h('div', { class: 'run-slot' });
  const skip = h('button', { type: 'button', class: 'btn btn--quiet btn--small run-skip', onclick: () => advance(null) }, 'Passer cet exercice →');
  const el = h('div', { class: 'runner' }, h('div', { class: 'run-head' }, counter, dots), slot, h('div', { class: 'run-foot' }, skip));

  function paintDots() {
    dots.replaceChildren(...defs.map((d, j) => {
      const r = results[d.id];
      const st = r ? r.stars : null;
      const current = j === i && !summaryShown;
      return h('li', {}, h('button', {
        type: 'button', class: `run-dot ${current ? 'is-current' : ''} ${r ? `is-done s${st}` : ''}`,
        'aria-label': `Exercice ${j + 1}${r ? ` : ${STAR_LABEL[st]}` : ''}`, 'aria-current': current ? 'step' : undefined, onclick: () => show(j),
      }, r ? (st > 0 ? '★' : '·') : String(j + 1)));
    }));
  }

  function show(j) {
    if (mounted) { mounted.destroy(); mounted = null; }
    summaryShown = false;
    i = j;
    counter.textContent = `Exercice ${i + 1} sur ${defs.length}`;
    skip.hidden = false;
    slot.replaceChildren();
    const box = h('div', { class: 'run-ex enter-fwd' });
    slot.append(box);
    const def = defs[j];
    mounted = mountExercise(box, {
      def, lessonId: opts.lessonId,
      nextLabel: defs.some((d, k) => k !== j && !results[d.id]) ? 'Exercice suivant →' : 'Terminer la série',
      onSettled: (diag, out) => {
        const prevBest = results[def.id] ? results[def.id].stars : -1;
        if (out.stars > prevBest) {
          results[def.id] = { stars: out.stars, verdict: diag ? diag.verdict : 'abandon' };
          if (opts.onResult) opts.onResult(def.id, out.stars);
        }
        if (out.stars >= 2) burstStars(box, out.stars);
        skip.hidden = true;
        paintDots();
        changed();
      },
      onNext: () => advance(true),
    });
    paintDots();
    const first = box.querySelector('.ex-answer input, .ex-answer textarea, .ex-answer select, .ex-answer [tabindex="0"], .ex-answer button');
    if (first && first.focus) first.focus({ preventScroll: true });
    box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    changed();
  }

  function advance(done) {
    if (!done && !results[defs[i].id]) results[defs[i].id] = { stars: 0, verdict: 'passe' };
    const after = defs.findIndex((d, j) => j > i && !results[d.id]);
    const any = after >= 0 ? after : defs.findIndex((d) => !results[d.id]);
    if (any >= 0) show(any); else summary();
  }

  function summary() {
    if (mounted) { mounted.destroy(); mounted = null; }
    summaryShown = true;
    skip.hidden = true;
    const total = defs.reduce((a, d) => a + (results[d.id] ? results[d.id].stars : 0), 0);
    const max = defs.length * 3;
    const ratio = total / max;
    const mood = ratio >= 0.7 ? 'bravo' : ratio >= 0.4 ? 'joie' : 'encourage';
    const msg = ratio >= 0.7 ? 'Excellent travail !' : ratio >= 0.4 ? 'Bien joué, tu progresses !' : 'Courage : relis la correction des exercices manqués, puis réessaie-les.';
    counter.textContent = 'Série terminée';
    const missed = defs.map((d, j) => [d, j]).filter(([d]) => !results[d.id] || results[d.id].stars === 0);
    slot.replaceChildren(h('div', { class: 'run-summary enter-fwd' },
      photon(mood, 64),
      h('div', {},
        h('p', { class: 'run-summary-stars', 'aria-label': `${total} étoiles sur ${max}` }, `${total} ★`, h('small', {}, ` / ${max}`)),
        h('p', { class: 'run-summary-msg' }, msg),
        missed.length ? h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => { for (const [d] of missed) delete results[d.id]; show(missed[0][1]); } }, `Réessayer ${missed.length > 1 ? `les ${missed.length} exercices manqués` : 'l’exercice manqué'}`) : null)));
    paintDots();
    announce(`Série terminée : ${total} étoiles sur ${max}.`);
    changed();
  }

  const wanted = opts.startAt ? defs.findIndex((d) => d.id === opts.startAt) : -1;
  const firstTodo = defs.findIndex((d) => !results[d.id]);
  if (!defs.length) skip.hidden = true;
  else if (wanted >= 0) show(wanted);
  else if (firstTodo < 0) summary();
  else show(firstTodo);

  return {
    el,
    isComplete: complete,
    destroy() { if (mounted) mounted.destroy(); },
  };
}
