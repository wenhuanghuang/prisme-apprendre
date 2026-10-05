/** Mon carnet : mes compétences (par matière), mes révisions à venir, mes badges, mes réponses relues. */
import { h, pct, relDays, richText } from '../dom.js';
import { store, badges, skillLevel } from '../../app/store.js';
import { LEVELS as MASTERY } from '../../engine/mastery.js';
import { subjectOf } from './today.js';

const SUBJECT_LABEL = { maths: 'Mathématiques', pc: 'Physique-chimie', numerique: 'Programmation et IA', francais: 'Français', hg: 'Histoire-géographie', emc: 'Enseignement moral et civique', svt: 'Sciences de la vie et de la Terre', techno: 'Technologie', lv: 'Langues vivantes', musique: 'Éducation musicale', 'arts-plastiques': 'Arts plastiques', autre: 'Autres' };

export function render(root) {
  const b = badges();
  const states = store.states.skills;
  const worked = Object.keys(states).filter((id) => store.index.skills.has(id));
  const bySubject = {};
  for (const id of worked) (bySubject[subjectOf(id)] = bySubject[subjectOf(id)] || []).push(id);
  const upcoming = worked.map((id) => ({ id, st: states[id] })).filter((x) => x.st.due).sort((a, c) => a.st.due - c.st.due).slice(0, 6);
  const reviewed = store.submissions.filter((s) => s.status !== 'en-attente');

  root.append(
    h('div', { class: 'page-head' }, h('div', {}, h('p', { class: 'eyebrow' }, 'Mon carnet'), h('h1', {}, 'Ce que je sais faire'),
      h('p', { class: 'lede' }, 'Chaque notion a son propre niveau. « Consolidée » veut dire réussie à nouveau plusieurs jours plus tard : c’est la preuve que c’est vraiment acquis.'))),
    h('section', { class: 'card', style: { marginBottom: '18px' } }, h('h2', {}, 'Mes badges'),
      h('p', { class: 'small muted' }, 'Chaque badge atteste une compétence précise.'),
      h('div', { class: 'badge-grid' }, b.thematic.map((x) => h('div', { class: `badge ${x.earned ? 'is-earned' : ''}` },
        h('span', { class: 'badge-icon', 'aria-hidden': 'true' }, x.icon),
        h('div', {}, h('strong', {}, x.label), h('br'), h('small', {}, x.attests), h('div', { class: 'progress-mini' }, h('i', { style: { width: `${(x.value / x.goal) * 100}%` } })), h('small', {}, `${x.value}/${x.goal}${x.earned ? ' · obtenu' : ''}`))))),
      b.skills.length ? h('div', { style: { marginTop: '14px' } }, h('h3', {}, 'Notions consolidées'), h('div', { class: 'skill-pills' }, b.skills.map((s) => h('span', { class: 'skill-pill lvl-consolide' }, `✓ ${s.label}`)))) : null),
    upcoming.length ? h('section', { class: 'card', style: { marginBottom: '18px' } }, h('h2', {}, 'Mes prochaines révisions'),
      h('ul', {}, upcoming.map((x) => h('li', {}, `${store.index.skills.get(x.id).label} — ${relDays(x.st.due, store.now())}`)))) : null,
    ...Object.entries(bySubject).map(([subj, ids]) => h('section', { class: `card card--accent subj-${subj}`, style: { marginBottom: '18px' } },
      h('h2', {}, SUBJECT_LABEL[subj] || subj),
      h('div', { class: 'tbl-wrap' }, h('table', { class: 'skill-table' },
        h('thead', {}, h('tr', {}, ['Notion', 'Niveau', 'Maîtrise', 'Réussites'].map((t) => h('th', { scope: 'col' }, t)))),
        h('tbody', {}, ids.map((id) => {
          const st = states[id]; const meta = store.index.skills.get(id); const lv = skillLevel(id);
          return h('tr', {}, h('td', {}, meta.label, meta.status !== 'programme' ? ' ◆' : ''), h('td', {}, h('span', { class: `level-tag skill-pill lvl-${lv}` }, MASTERY[lv].label)),
            h('td', {}, h('div', { class: 'bar' }, h('i', { style: { width: pct(st.pL).replace(' ', '') } }))),
            h('td', { class: 'small' }, `${st.successes}/${st.n} · ${st.autonomousSuccesses} sans aide`));
        })))))),
    !worked.length ? h('p', { class: 'card empty' }, 'Ton carnet se remplira au fil des exercices.') : null,
    reviewed.length ? h('section', { class: 'card' }, h('h2', {}, 'Mes réponses relues par un adulte'),
      ...reviewed.map((s) => h('div', { class: 'pending-item', style: { marginBottom: '10px' } },
        h('strong', {}, s.status === 'valide' ? '✓ Validée' : '↻ À retravailler'), richText(s.prompt || ''), s.comment ? h('blockquote', {}, s.comment) : null,
        s.lessonId ? h('a', { class: 'btn btn--ghost btn--small', href: `#/lecon/${s.lessonId}` }, 'Retourner à la leçon') : null))) : null);
}
