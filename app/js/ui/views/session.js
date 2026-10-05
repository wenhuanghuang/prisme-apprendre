/**
 * Séance adaptative : enchaîne quelques exercices choisis par le moteur pour une recommandation donnée.
 * Avant une remédiation, une courte explication ciblée ; à chaque exercice, « pourquoi cet exercice ? ».
 */
import { h, richText, inlineHTML, pct } from '../dom.js';
import { store, recommendations, loadExercise, loadLesson, recentExerciseIds } from '../../app/store.js';
import { selectExercise } from '../../engine/select.js';
import { masteryLevel, LEVELS } from '../../engine/mastery.js';
import { ERROR_TYPES } from '../../core/errors.js';
import { instantiate } from '../../core/checkers/index.js';
import { interpolate } from '../../core/template.js';
import { mountExercise } from '../exercise.js';
import { KIND_UI } from './today.js';
import { photon } from '../photon.js';

const LENGTH = { revision: 3, defi: 2, transfert: 2, expliquer: 3 };

async function targetedExplanation(rec) {
  const ev = rec.evidence || {};
  const out = [];
  const typeKey = ev.type || (ev.error && ev.error.type);
  const mcId = ev.misconception || (ev.error && ev.error.misconception);
  if (typeKey && ERROR_TYPES[typeKey]) out.push(h('p', {}, h('strong', {}, `${ERROR_TYPES[typeKey].label} : `), ERROR_TYPES[typeKey].student));
  if (mcId) {
    for (const meta of store.index.exercises.filter((e) => e.skill === rec.skill || (e.skills || []).includes(rec.skill))) {
      const loaded = await loadExercise(meta.id);
      const all = [loaded.def, ...(loaded.def.parts || [])];
      const mc = all.flatMap((d) => d.misconceptions || []).find((m) => m.id === mcId);
      if (mc && mc.feedback) {
        const inst = instantiate(loaded.def, 7);
        out.push(h('p', { html: inlineHTML(interpolate(mc.feedback, inst.params)) }));
        break;
      }
    }
  }
  const lessonMeta = store.index.lessons.find((l) => l.skills.includes(rec.skill));
  if (lessonMeta) {
    const lesson = await loadLesson(lessonMeta.id);
    const course = lesson.sections.find((s) => s.kind === 'cours');
    const pitfalls = lesson.sections.find((s) => s.kind === 'correction');
    if (pitfalls && pitfalls.body) out.push(h('details', {}, h('summary', {}, 'Les erreurs fréquentes sur cette notion'), richText(pitfalls.body)));
    if (course && course.body) out.push(h('details', {}, h('summary', {}, 'Revoir le cours'), richText(course.body)));
  }
  return out;
}

export async function render(root, { params }) {
  const kind = params.get('kind') || 'suite';
  const skill = params.get('skill');
  const skillMeta = store.index.skills.get(skill);
  if (!skillMeta) { root.append(h('p', {}, 'Notion inconnue.'), h('a', { class: 'btn', href: '#/' }, 'Retour')); return; }
  const rec = recommendations(30).find((r) => r.kind === kind && r.skill === skill)
    || { kind, skill, title: skillMeta.label, reasonStudent: 'Entraînement sur cette notion.', reasonParent: 'Séance lancée manuellement.', query: { skill, track: kind === 'defi' ? 'approfondissement' : 'classe' }, evidence: {} };
  const total = LENGTH[kind] || 4;
  const ui = KIND_UI[kind] || { icon: '•', label: kind };
  const before = store.states.skills[skill] ? store.states.skills[skill].pL : null;
  const history = [];
  let current = null;

  const progress = h('p', { class: 'eyebrow' });
  const stage = h('div', {});
  root.append(
    h('div', { class: 'page-head' }, h('div', {}, h('p', { class: 'eyebrow' }, `${ui.icon} ${ui.label}`), h('h1', {}, rec.title)), h('a', { class: 'btn btn--ghost', href: '#/' }, 'Terminer plus tard')),
    h('div', { class: 'card', style: { display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '14px' } }, photon('attentif', 48),
      h('div', {}, h('p', { style: { margin: 0 } }, rec.reasonStudent), h('details', { class: 'small muted' }, h('summary', {}, 'Détail pour les parents'), h('p', {}, rec.reasonParent)))),
    progress, stage);

  if (['remediation', 'resurgence', 'prerequis'].includes(kind)) {
    const expl = await targetedExplanation(rec);
    if (expl.length) stage.append(h('section', { class: 'card', style: { marginBottom: '14px' } }, h('h2', {}, 'Explication ciblée'), ...expl));
  }

  const next = async () => {
    try { await nextStep(); } catch (e) {
      stage.append(h('p', { class: 'card warn' }, `Impossible de charger l'exercice suivant (${e.message}).`), h('a', { class: 'btn', href: '#/' }, 'Retour à Aujourd’hui'));
    }
  };
  const nextStep = async () => {
    if (current) { current.destroy(); current = null; }
    if (history.length >= total) return summary();
    const pick = selectExercise(store.index.exercises, rec.query, store.states.skills[rec.query.skill || skill], history, recentExerciseIds(20));
    if (!pick) { stage.append(h('p', { class: 'card' }, 'Aucun exercice disponible pour cette demande dans les contenus actuels.')); return; }
    const loaded = await loadExercise(pick.exercise.id);
    progress.textContent = `Exercice ${history.length + 1} sur ${total}`;
    const slot = h('div', {});
    stage.querySelectorAll('.ex').forEach((e) => e.remove());
    stage.append(slot);
    current = mountExercise(slot, {
      def: loaded.def, lessonId: loaded.lesson.id, context: `seance:${kind}`, why: pick.explanation,
      nextLabel: history.length + 1 >= total ? 'Voir le bilan' : 'Exercice suivant',
      onNext: () => {
        const last = store.attempts[store.attempts.length - 1];
        const humanVerdict = last && ['a-valider', 'incertain'].includes(last.verdict);
        if (last && last.exerciseId === loaded.def.id) {
          history.push({ exerciseId: last.exerciseId, credit: humanVerdict ? null : last.credit, representation: last.representation, errorType: last.errorType, misconception: last.misconception, timeRatio: last.durationMs && last.expectedSeconds ? last.durationMs / 1000 / last.expectedSeconds : null });
        } else history.push({ exerciseId: loaded.def.id, credit: 0 });
        next();
      },
    });
    slot.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const summary = () => {
    const st = store.states.skills[skill];
    const lvl = masteryLevel(st, store.now());
    const ok = history.filter((x) => x.credit >= 0.7).length;
    stage.replaceChildren(h('section', { class: 'card' },
      h('h2', {}, 'Bilan de la séance'),
      h('p', {}, `${ok} réussite(s) sur ${history.length} exercice(s).`),
      st ? h('p', {}, `Maîtrise estimée de « ${skillMeta.label} » : ${before !== null ? `${pct(before)} → ` : ''}${pct(st.pL)} (${LEVELS[lvl].label.toLowerCase()}).`) : null,
      st && st.due ? h('p', { class: 'muted' }, `Prochaine révision programmée dans environ ${Math.max(1, Math.round((st.due - store.now()) / 86400000))} jour(s).`) : null,
      h('div', { class: 'btn-row' }, h('a', { class: 'btn btn--primary', href: '#/' }, 'Voir mes prochaines recommandations'), h('a', { class: 'btn btn--ghost', href: '#/carnet' }, 'Mon carnet'))));
    progress.textContent = 'Séance terminée';
  };

  await next();
  return () => { if (current) current.destroy(); };
}
