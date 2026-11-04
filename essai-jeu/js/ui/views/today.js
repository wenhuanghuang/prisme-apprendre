/** « Aujourd'hui » : recommandations expliquées, révisions dues, accès rapide aux leçons. */
import { h, relDays } from '../dom.js';
import { store, recommendations, dueReviews, badges, skillLevel, gameProgress } from '../../app/store.js';
import { goalRing, streakLabel } from '../game/hud.js';
import { coursesOf, pathOf, progressNow, subjectLabel, levelOfProfile, SUBJECT_ICONS } from '../parcours/data.js';
import { photon, PHOTON_TIPS } from '../photon.js';
import { enigmaStreak, subjectOfDay } from '../../engine/enigme.js';
import { dayKey } from '../../engine/game.js';
import { gameSubjects, nearestLevel } from '../game/deck.js';
import { subjLabel } from './exercices.js';
import { familyCard } from '../game/family-card.js';
import { yearSummary } from '../game/year-view.js';

/** Carte « Ma quête de l'année » : la matière la plus récemment jouée (sinon les maths), son prochain chapitre. */
async function questCard(slot) {
  const ys = await yearSummary(nearestLevel(store.profile.level));
  if (!ys.length) { slot.replaceChildren(); return; }
  const main = ys.slice().sort((a, b) => b.last - a.last || (a.subject === 'maths' ? -1 : b.subject === 'maths' ? 1 : 0))[0];
  const ch = main.inProgress || (main.finished ? main.next : main.nowChapter || main.next);
  const total = ys.reduce((s, y) => s + y.finished, 0);
  slot.replaceChildren(h('a', { class: 'card side-card year-today', href: `#/exercices?annee=${encodeURIComponent(main.subject)}`, style: { textDecoration: 'none', color: 'inherit' } },
    h('span', { class: 'year-today-icon', 'aria-hidden': 'true' }, SUBJECT_ICONS[main.subject] || '🗺️'),
    h('div', {},
      h('h3', {}, main.complete ? `Année de ${subjLabel(main.subject)} accomplie !` : 'Ma quête de l’année'),
      h('p', { class: 'small' }, main.complete ? 'Bravo ! Tu peux rejouer les chapitres pour décrocher l’or partout.' : `${subjLabel(main.subject)} · ${main.inProgress ? 'chapitre en cours' : 'prochain chapitre'} : ${ch ? ch.title : ''}`),
      h('p', { class: 'small muted' }, `${main.finished}/${main.chapters} chapitres en ${subjLabel(main.subject).toLowerCase()} · ${total} médaille${total > 1 ? 's' : ''} toutes matières`),
      h('span', { class: 'btn btn--primary btn--small' }, main.inProgress ? 'Reprendre le chapitre' : main.finished ? 'Continuer mon année' : 'Commencer mon année'))));
}

/** Carte de l'énigme du jour : la matière du jour, résolue ou non, et la série d'énigmes. */
function enigmaCard() {
  const now = store.now();
  const st = enigmaStreak((store.states && store.states.game && store.states.game.events) || [], now);
  const subject = subjectOfDay(dayKey(now), gameSubjects(nearestLevel(store.profile.level)));
  if (!subject) return null;
  return h('a', { class: `card side-card enigme-card ${st.solvedToday ? 'is-solved' : ''}`, href: '#/enigme', style: { textDecoration: 'none', color: 'inherit' } },
    h('span', { class: 'enigme-card-icon', 'aria-hidden': 'true' }, st.solvedToday ? '✅' : '🧩'),
    h('div', {},
      h('h3', {}, st.solvedToday ? 'Énigme du jour résolue' : 'L’énigme du jour'),
      h('p', { class: 'small' }, st.solvedToday ? 'Bravo ! Une nouvelle énigme arrive demain.' : `Aujourd’hui : ${subjLabel(subject)}. Un peu plus difficile que d’habitude… et un « Le savais-tu ? » à la clé.`),
      st.streak ? h('p', { class: 'small muted' }, `Série : ${st.streak} jour${st.streak > 1 ? 's' : ''} d’énigmes`) : null));
}

export const KIND_UI = {
  resurgence: { icon: '↺', label: 'Rappel' },
  prerequis: { icon: '⤓', label: 'Prérequis' },
  remediation: { icon: '◎', label: 'Point précis' },
  revision: { icon: '◷', label: 'Révision' },
  expliquer: { icon: '✎', label: 'Justifier' },
  suite: { icon: '→', label: 'Suite' },
  transfert: { icon: '⇄', label: 'Transfert' },
  defi: { icon: '✦', label: 'Défi facultatif' },
};

export function subjectOf(skillId) {
  const s = store.index.skills.get(skillId);
  if (!s) return 'autre';
  if (s.subject === 'transversal') return skillId.startsWith('fr.') ? 'francais' : 'hg';
  return s.subject;
}

export function recoCard(r) {
  const ui = KIND_UI[r.kind] || { icon: '•', label: r.kind };
  const lesson = store.index.lessons.find((l) => l.skills.includes(r.skill));
  return h('article', { class: `reco kind-${r.kind} subj-${subjectOf(r.skill)}` },
    h('div', { class: 'reco-kind', 'aria-hidden': 'true' }, ui.icon),
    h('div', {},
      h('h3', {}, h('span', { class: 'sr-only' }, `${ui.label} : `), r.title),
      h('p', {}, r.reasonStudent),
      h('details', {}, h('summary', {}, 'Pourquoi ? (détail du diagnostic)'), h('p', {}, r.reasonParent))),
    h('div', { class: 'btn-row' },
      h('a', { class: 'btn btn--primary btn--small', href: `#/seance?kind=${encodeURIComponent(r.kind)}&skill=${encodeURIComponent(r.skill)}` }, r.kind === 'defi' ? 'Relever le défi' : 'Commencer'),
      lesson ? h('a', { class: 'btn btn--ghost btn--small', href: `#/lecon/${lesson.id}` }, 'Leçon') : null));
}

/** « Continuer » : la prochaine leçon de chaque parcours de la classe, comme sur une appli de langues. */
function continueStrip() {
  const strip = h('section', { class: 'continue-strip', 'aria-label': 'Continuer mes parcours' });
  const progress = progressNow();
  Promise.all(coursesOf(levelOfProfile()).map(async (c) => {
    const data = await pathOf(c.id, progress);
    if (!data || !data.path.total || !data.path.next) return null;
    const { path } = data;
    const href = path.next.kind === 'bilan' ? `#/parcours/${c.subject}/bilan/${path.next.id}` : `#/lecon/${path.next.id}`;
    return h('a', { class: `continue-card subj-${c.subject}`, href },
      h('span', { class: 'continue-ring' }, goalRing(path.progress, 46, 6), h('span', { 'aria-hidden': 'true' }, SUBJECT_ICONS[c.subject] || '•')),
      h('span', { class: 'continue-text' }, h('small', {}, subjectLabel(c.subject)), h('strong', {}, path.next.title)),
      h('span', { class: 'continue-go', 'aria-hidden': 'true' }, '▶'));
  })).then((cards) => {
    const list = cards.filter(Boolean);
    if (list.length) strip.append(h('h2', {}, 'Continuer mes parcours'), h('div', { class: 'continue-cards' }, list));
  }).catch(() => { /* les parcours restent accessibles par le menu */ });
  return strip;
}

export function render(root) {
  const p = store.profile;
  const familySlot = h('div', { class: 'family-slot' });
  const questSlot = h('div', { class: 'family-slot' });
  questCard(questSlot).catch(() => questSlot.replaceChildren());
  familyCard(familySlot).catch(() => familySlot.replaceChildren());
  const recos = recommendations(8);
  const due = dueReviews();
  const b = badges();
  const pending = store.submissions.filter((s) => s.status === 'en-attente').length;
  const levels = Object.keys(store.states.skills).map((id) => skillLevel(id));
  const mastered = levels.filter((l) => l === 'maitrise' || l === 'consolide').length;
  const fragile = levels.filter((l) => l === 'fragile').length;
  const lastAttempt = store.attempts[store.attempts.length - 1];
  const lastLesson = lastAttempt && lastAttempt.lessonId ? store.index.byLesson.get(lastAttempt.lessonId) : null;
  const myLessons = store.index.lessons.filter((l) => l.level === p.level);
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const tip = PHOTON_TIPS[new Date().getDate() % PHOTON_TIPS.length];
  const g = gameProgress();

  root.append(
    p.demo ? h('p', { class: 'demo-banner' }, h('strong', {}, 'Profil fictif. '), p.story || '', ' Son historique a été simulé par le moteur réel.') : '', // append() natif : null s'afficherait « null »
    h('div', { class: 'page-head' },
      h('div', {}, h('p', { class: 'eyebrow' }, `${p.level} · ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`), h('h1', {}, `${hello}, ${p.pseudo}`)),
      h('div', { class: 'btn-row' }, h('a', { class: 'btn', href: '#/parcours' }, 'Mes parcours'), h('a', { class: 'btn btn--ghost', href: '#/labo' }, 'Laboratoire libre'))),
    continueStrip(),
    h('div', { class: 'today' },
      h('section', { 'aria-labelledby': 'reco-title' },
        h('h2', { id: 'reco-title' }, 'Pour toi aujourd’hui'),
        recos.length
          ? h('div', { class: 'reco-list' }, recos.map(recoCard))
          : h('div', { class: 'card empty' }, photon('attentif', 64),
            h('p', {}, 'Pas encore assez de traces pour te conseiller : commence par une leçon de ta classe.'),
            h('div', { class: 'btn-row', style: { justifyContent: 'center' } }, myLessons.slice(0, 3).map((l) => h('a', { class: 'btn btn--small', href: `#/lecon/${l.id}` }, l.title)), h('a', { class: 'btn btn--ghost btn--small', href: '#/parcours' }, 'Toutes les leçons')))),
      h('aside', { class: 'grid' },
        questSlot,
        enigmaCard(),
        familySlot,
        g ? h('a', { class: 'card side-card today-goal', href: '#/progression', style: { textDecoration: 'none', color: 'inherit' } },
          goalRing(g.todayXp / g.goal, 64, 8),
          h('h3', {}, g.goalReached ? '🎯 Objectif du jour atteint' : 'Objectif du jour'),
          h('p', {}, h('strong', {}, `${g.todayXp} / ${g.goal} points`), g.streak ? ` · 🔥 ${streakLabel(g.streak)}` : ''),
          h('p', { class: 'small muted' }, g.atRisk ? 'Atteins-le aujourd’hui pour garder ta série !' : `Niveau ${g.level} · ${g.title} — voir ma progression`)) : null,
        h('div', { class: 'card side-card' },
          h('h3', {}, 'Où j’en suis'),
          h('div', { class: 'stat-row' },
            h('div', { class: 'stat' }, h('b', {}, String(mastered)), h('span', {}, 'notions maîtrisées')),
            h('div', { class: 'stat' }, h('b', {}, String(fragile)), h('span', {}, 'fragiles')),
            h('div', { class: 'stat' }, h('b', {}, String(due.length)), h('span', {}, 'révisions prévues'))),
          due.length ? h('p', { class: 'small muted', style: { marginTop: '10px' } }, Math.min(...due.map((d) => d.due)) <= store.now()
            ? `${due.filter((d) => d.due <= store.now()).length} révision(s) à faire maintenant : elles sont dans tes recommandations.`
            : `Prochaine révision : ${relDays(Math.min(...due.map((d) => d.due)))}.`) : null,
          pending ? h('p', { class: 'small', style: { marginTop: '6px' } }, `${pending} réponse(s) rédigée(s) en attente de relecture par un adulte.`) : null,
          h('a', { class: 'btn btn--ghost btn--small', href: '#/carnet', style: { marginTop: '8px' } }, 'Mon carnet de compétences')),
        h('div', { class: 'card side-card side-card--jeu' },
          h('h3', {}, h('span', { 'aria-hidden': 'true' }, '🎮 '), 'Jouer'),
          h('p', { class: 'small' }, h('strong', {}, 'Quête : '), 'avance pas à pas, relève les défis et ouvre les coffres (points et vignettes de ton album).'),
          h('p', { class: 'small' }, h('strong', {}, 'Plateau : '), 'la course au Prisme, seul contre Photon ou à plusieurs, chacun avec les questions de sa classe.'),
          h('div', { class: 'btn-row' }, h('a', { class: 'btn btn--primary btn--small', href: '#/exercices' }, '🗺️ Partir en quête'), h('a', { class: 'btn btn--ghost btn--small', href: '#/jeu' }, '🎲 Plateau'))),
        lastLesson ? h('div', { class: 'card side-card' }, h('h3', {}, 'Reprendre'), h('p', {}, lastLesson.title), h('a', { class: 'btn btn--small', href: `#/lecon/${lastLesson.id}` }, 'Continuer la leçon')) : null,
        h('div', { class: 'card side-card' }, h('h3', {}, 'Badges en cours'),
          h('div', { class: 'grid' }, b.thematic.filter((x) => x.value > 0).slice(0, 3).map((x) => h('div', {},
            h('strong', {}, `${x.icon} ${x.label}`), h('div', { class: 'progress-mini' }, h('i', { style: { width: `${(x.value / x.goal) * 100}%` } })), h('span', { class: 'small muted' }, `${x.value}/${x.goal} — ${x.attests}`)))),
          b.thematic.every((x) => x.value === 0) ? h('p', { class: 'small muted' }, 'Les badges attestent de vraies compétences (contre-exemples, calculs pas à pas, expériences…), pas d’un total de points.') : null),
        h('div', { class: 'card side-card', style: { display: 'flex', gap: '12px', alignItems: 'flex-start' } }, photon('attentif', 40), h('p', { class: 'small', style: { margin: 0 } }, tip)))));
}
