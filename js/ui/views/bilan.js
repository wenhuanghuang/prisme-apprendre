/**
 * Bilan d'une unité (#/parcours/<matière>/bilan/<chapitre>) : 8 exercices pris à tour de rôle dans chaque leçon de
 * l'unité, joués un par un. Avec au moins 70 % des étoiles, l'unité gagne sa couronne (et des points, une fois).
 * Seul le premier résultat de chaque exercice compte (refaire un exercice après avoir vu la correction ne fait pas
 * gagner la couronne). Sinon, on revoit les leçons conseillées et on réessaie : le tirage change à chaque essai.
 */
import { h, announce } from '../dom.js';
import { store, loadLesson, recordGameEvent } from '../../app/store.js';
import { exerciseRunner } from '../lesson-play/runner.js';
import { confetti } from '../lesson-play/celebrate.js';
import { pickBilan, bilanOutcome, hashString, BILAN_PASS } from '../../engine/path.js';
import { dayKey } from '../../engine/game.js';
import { coursesOf, pathOf, subjectLabel, levelOfProfile } from '../parcours/data.js';
import { photon } from '../photon.js';

/** Exercices du niveau de la classe d'une leçon, dans l'ordre de ses étapes. */
function classPool(lesson) {
  const byId = Object.fromEntries((lesson.exercises || []).map((e) => [e.id, e]));
  const ids = (lesson.sections || []).flatMap((s) => s.exercises || []);
  return { lessonId: lesson.id, exercises: ids.map((id) => byId[id]).filter((e) => e && (e.track || 'classe') === 'classe') };
}

function outcomeCard({ ratio, passed, alreadyCrowned, unit, nextUnit, subject, weakLessons, lvq }) {
  const pctTxt = `${Math.round(ratio * 100)} % des étoiles`;
  if (passed) {
    return h('div', { class: 'card bilan-win' },
      photon('bravo', 84),
      h('div', {},
        h('p', { class: 'eyebrow' }, alreadyCrowned ? 'Bilan réussi à nouveau' : 'Nouvelle couronne'),
        h('h2', {}, `👑 Unité ${unit.number} réussie !`),
        h('p', {}, `${pctTxt}. ${alreadyCrowned ? 'Tu gardes ta couronne : bel entraînement.' : 'La couronne de l’unité est à toi.'}`),
        h('div', { class: 'btn-row' },
          nextUnit ? h('a', { class: 'btn btn--primary', href: `#/parcours/${subject}?unite=${nextUnit.id}${lvq}` }, `Unité suivante : ${nextUnit.title} →`) : null,
          h('a', { class: 'btn btn--ghost', href: `#/parcours/${subject}${lvq ? `?${lvq.slice(1)}` : ''}` }, 'Retour au parcours'))));
  }
  return h('div', { class: 'card bilan-retry' },
    photon('encourage', 72),
    h('div', {},
      h('h2', {}, 'Encore un petit effort'),
      h('p', {}, `${pctTxt} : il en faut ${Math.round(BILAN_PASS * 100)} % pour la couronne. Relis la correction des exercices manqués, revois une leçon, puis réessaie.`),
      weakLessons.length ? h('div', { class: 'btn-row' }, weakLessons.map((l) => h('a', { class: 'btn btn--small', href: `#/lecon/${l.id}` }, `Revoir : ${l.title}`))) : null,
      h('a', { class: 'btn btn--ghost btn--small', href: `#/parcours/${subject}?unite=${unit.id}${lvq}` }, 'Retour au parcours')));
}

export async function render(root, { args, params }) {
  const [subject, unitId] = args;
  const level = params.get('niveau') || levelOfProfile();
  const lvq = level === levelOfProfile() ? '' : `&niveau=${encodeURIComponent(level)}`; // garder la classe consultée
  const meta = coursesOf(level).find((c) => c.subject === subject);
  const data = meta ? await pathOf(meta.id) : null;
  const units = data ? data.path.units : [];
  const ui = units.findIndex((u) => u.id === unitId);
  if (ui < 0) { root.append(h('p', { class: 'card' }, 'Unité introuvable.'), h('a', { class: 'btn', href: '#/parcours' }, 'Mes parcours')); return undefined; }
  const unit = units[ui];
  const lessons = await Promise.all(unit.lessons.map((l) => loadLesson(l.id)));
  const context = `bilan:${unit.key}`;
  const today = dayKey(store.now());
  const triedToday = store.attempts.filter((a) => a.context === context && dayKey(a.ts) === today).length; // nouveau tirage à chaque essai
  const picked = pickBilan(lessons.map(classPool), hashString(`${unit.key}:${today}:${store.profile.id}:${triedToday}`));
  const lessonOf = new Map(picked.map((p) => [p.def.id, p.lessonId]));
  const defs = picked.map((p) => p.def);
  const results = {};
  const firstStars = new Map(); // premier résultat de chaque exercice : le seul qui compte pour la couronne
  const outcome = h('div', { class: 'bilan-outcome' }); // annoncé une fois par announce()
  let concluded = false;
  let runner = null; // le lecteur appelle onChange pendant sa construction

  root.classList.add(`subj-${subject}`);
  root.append(
    h('div', { class: 'play-top' },
      h('a', { class: 'play-back', href: `#/parcours/${subject}?unite=${unitId}${lvq}`, 'aria-label': 'Retour au parcours' }, '←'),
      h('div', { class: 'play-titles' }, h('p', { class: 'eyebrow' }, `${subjectLabel(subject)} · Unité ${unit.number} · Bilan`), h('h1', {}, unit.title))),
    h('div', { class: 'card bilan-intro' }, photon('curieux', 52),
      h('p', {}, `${defs.length} exercices pris dans les ${unit.lessons.length} leçon${unit.lessons.length > 1 ? 's' : ''} de l’unité. Avec ${Math.round(BILAN_PASS * 100)} % des étoiles, tu gagnes la couronne 👑 de l’unité.`,
        unit.bilan.passed ? ' Tu l’as déjà : refais le bilan pour t’entraîner.' : unit.bilan.advised ? '' : ' Conseil : fais d’abord les leçons de l’unité.')));

  if (!defs.length) { root.append(h('p', { class: 'card' }, 'Pas encore d’exercice corrigé automatiquement dans cette unité.')); return undefined; }

  const conclude = async () => {
    if (!runner || !runner.isComplete()) { concluded = false; return; } // « réessayer les exercices manqués » relance le bilan
    if (concluded) return;
    concluded = true;
    const { ratio, passed, missedLessons } = bilanOutcome(defs, firstStars, (d) => lessonOf.get(d.id));
    const alreadyCrowned = unit.bilan.passed;
    if (passed && !alreadyCrowned) await recordGameEvent('bilan', unit.key).catch(() => {});
    const weakLessons = unit.lessons.filter((l) => missedLessons.has(l.id)).slice(0, 3);
    outcome.replaceChildren(outcomeCard({ ratio, passed, alreadyCrowned, unit, nextUnit: units[ui + 1], subject, weakLessons, lvq }));
    if (passed) setTimeout(() => confetti(outcome), 150);
    announce(passed ? `Bilan réussi : couronne de l’unité ${unit.number}.` : 'Bilan à retenter.');
    const heading = outcome.querySelector('h2');
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
    outcome.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  const onChange = () => {
    // « passé » sans rien tenter (aucune correction vue) : l'exercice pourra encore compter quand il sera fait
    for (const d of defs) if (results[d.id] && results[d.id].verdict !== 'passe' && !firstStars.has(d.id)) firstStars.set(d.id, results[d.id].stars);
    conclude();
  };
  runner = exerciseRunner(defs, {
    lessonOf: (d) => lessonOf.get(d.id), context, results, onChange,
    lockAttempts: true, // revenir sur un exercice tenté ne le remet pas à zéro
    scoreOf: (d) => firstStars.get(d.id) || 0,
    retryLabel: 'S’entraîner sur les exercices manqués',
  });
  root.append(h('section', { class: 'play-stage step' }, runner.el), outcome);
  return () => runner.destroy();
}
