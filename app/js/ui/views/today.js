/** « Aujourd'hui » : recommandations expliquées, révisions dues, accès rapide aux leçons. */
import { h, relDays } from '../dom.js';
import { store, recommendations, dueReviews, badges, skillLevel } from '../../app/store.js';
import { photon, PHOTON_TIPS } from '../photon.js';

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

export function render(root) {
  const p = store.profile;
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

  root.append(
    p.demo ? h('p', { class: 'demo-banner' }, h('strong', {}, 'Profil fictif. '), p.story || '', ' Son historique a été simulé par le moteur réel.') : null,
    h('div', { class: 'page-head' },
      h('div', {}, h('p', { class: 'eyebrow' }, `${p.level} · ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`), h('h1', {}, `${hello}, ${p.pseudo}`)),
      h('div', { class: 'btn-row' }, h('a', { class: 'btn', href: '#/carte' }, 'Ma carte de progression'), h('a', { class: 'btn btn--ghost', href: '#/labo' }, 'Laboratoire libre'))),
    h('div', { class: 'today' },
      h('section', { 'aria-labelledby': 'reco-title' },
        h('h2', { id: 'reco-title' }, 'Pour toi aujourd’hui'),
        recos.length
          ? h('div', { class: 'reco-list' }, recos.map(recoCard))
          : h('div', { class: 'card empty' }, photon('attentif', 64),
            h('p', {}, 'Pas encore assez de traces pour te conseiller : commence par une leçon de ta classe.'),
            h('div', { class: 'btn-row', style: { justifyContent: 'center' } }, myLessons.slice(0, 3).map((l) => h('a', { class: 'btn btn--small', href: `#/lecon/${l.id}` }, l.title)), h('a', { class: 'btn btn--ghost btn--small', href: '#/carte' }, 'Toutes les leçons')))),
      h('aside', { class: 'grid' },
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
        lastLesson ? h('div', { class: 'card side-card' }, h('h3', {}, 'Reprendre'), h('p', {}, lastLesson.title), h('a', { class: 'btn btn--small', href: `#/lecon/${lastLesson.id}` }, 'Continuer la leçon')) : null,
        h('div', { class: 'card side-card' }, h('h3', {}, 'Badges en cours'),
          h('div', { class: 'grid' }, b.thematic.filter((x) => x.value > 0).slice(0, 3).map((x) => h('div', {},
            h('strong', {}, `${x.icon} ${x.label}`), h('div', { class: 'progress-mini' }, h('i', { style: { width: `${(x.value / x.goal) * 100}%` } })), h('span', { class: 'small muted' }, `${x.value}/${x.goal} — ${x.attests}`)))),
          b.thematic.every((x) => x.value === 0) ? h('p', { class: 'small muted' }, 'Les badges attestent de vraies compétences (contre-exemples, calculs pas à pas, expériences…), pas d’un total de points.') : null),
        h('div', { class: 'card side-card', style: { display: 'flex', gap: '12px', alignItems: 'flex-start' } }, photon('attentif', 40), h('p', { class: 'small', style: { margin: 0 } }, tip)))));
}
