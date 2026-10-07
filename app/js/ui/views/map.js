/**
 * Carte de progression : pour une classe et une matière, les chapitres du programme (rédigés ou à venir),
 * avec l'anneau de maîtrise de chaque chapitre et ce que dit le programme officiel.
 */
import { h, tabs, pct } from '../dom.js';
import { store, loadCourse, skillLevel } from '../../app/store.js';
import { LEVELS as MASTERY } from '../../engine/mastery.js';
import { allGenerators } from '../../generators/registry.js';
import { lessonStars } from '../lesson-play/progress.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const SUBJECT_ICONS = { maths: '∑', pc: '⚗', numerique: '⌘', francais: '¶', hg: '⌖', svt: '❦', techno: '⚙', emc: '⚖', lv: '✎', eps: '⚑', musique: '♪', 'arts-plastiques': '◐' };

function ring(value, label) {
  const r = 24; const c = 2 * Math.PI * r;
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', '0 0 60 60');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `<circle class="ring-bg" cx="30" cy="30" r="${r}"/><circle class="ring" cx="30" cy="30" r="${r}" stroke-dasharray="${(value * c).toFixed(1)} ${c.toFixed(1)}"/><text class="ring-txt" x="30" y="35" text-anchor="middle">${label}</text>`;
  return svg;
}

export function levelId(label) { return String(label || '').toLowerCase(); }

export async function render(root, { args, params }) {
  const catalog = store.catalog;
  const lvParam = params.get('niveau');
  const level = lvParam || levelId(store.profile.level);
  const levelCourses = catalog.courses.filter((c) => c.level === level);
  const ORDER = ['maths', 'pc', 'numerique', 'francais', 'hg', 'svt', 'techno', 'sciences-techno', 'qlm', 'lv', 'emc', 'musique', 'arts-plastiques', 'snt', 'nsi', 'ens-sci', 'ses', 'philo'];
  const rank = (s) => { const c = levelCourses.find((x) => x.subject === s); const i = ORDER.indexOf(s); return (c.coverage !== 'reference' ? 0 : 100) + (i === -1 ? 50 : i); };
  const subjects = [...new Set(levelCourses.map((c) => c.subject))].sort((a, b) => rank(a) - rank(b));
  const subject = args[0] && subjects.includes(args[0]) ? args[0] : subjects[0];
  const subjLabel = (id) => (catalog.subjects.find((s) => s.id === id) || { label: id }).label;

  root.append(h('div', { class: 'page-head' },
    h('div', {}, h('p', { class: 'eyebrow' }, 'Carte de progression'), h('h1', {}, `${(catalog.levels.find((l) => l.id === level) || {}).label || level} · ${subjLabel(subject)}`)),
    h('label', { class: 'field', style: { minWidth: '200px' } }, h('span', { class: 'field-label' }, 'Voir une autre classe'),
      h('select', { class: 'field-input', onchange: (e) => { location.hash = `#/carte?niveau=${e.target.value}`; } },
        catalog.levels.map((l) => h('option', { value: l.id, selected: l.id === level }, `${l.label}${l.id === levelId(store.profile.level) ? ' (ma classe)' : ''}`))))));

  if (!subjects.length) { root.append(h('p', { class: 'card' }, 'Aucun programme catalogué pour cette classe.')); return; }

  root.append(h('div', { class: 'map-subjects' }, tabs(subjects.map((s) => {
    const c = levelCourses.find((x) => x.subject === s);
    return { id: s, label: subjLabel(s), icon: SUBJECT_ICONS[s] || '•', cls: c.coverage === 'reference' ? 'tab--ref' : '' };
  }), subject, (id) => { location.hash = `#/carte/${id}${lvParam ? `?niveau=${lvParam}` : ''}`; }, 'Matières')));

  const courseMeta = levelCourses.find((c) => c.subject === subject);
  const course = await loadCourse(courseMeta.id);
  if (!course) { root.append(h('p', { class: 'card' }, 'Parcours introuvable.')); return; }
  const progs = (store.programmes.programmes || []).filter((p) => (course.programmes || []).includes(p.id));

  root.append(h('div', { class: `subj-${subject}` },
    h('p', { class: 'note-cycle' }, course.progressionNote || ''),
    progs.length ? h('details', { class: 'note-cycle' }, h('summary', {}, `Texte${progs.length > 1 ? 's' : ''} officiel${progs.length > 1 ? 's' : ''} applicable${progs.length > 1 ? 's' : ''} en 2026-2027`),
      ...progs.map((p) => h('div', { style: { margin: '8px 0' } }, h('strong', {}, p.title), h('p', { class: 'small' }, p.inForce2026_2027 || ''),
        h('p', { class: 'small' }, ...(p.links || []).slice(0, 3).map((l) => h('a', { href: l.url, target: '_blank', rel: 'noopener noreferrer', style: { marginRight: '12px' } }, `${l.label}${l.verified ? '' : ' (lien non vérifié)'}`)))))) : null,
    course.coverage === 'reference' ? h('p', { class: 'demo-banner' }, 'Ce parcours présente les domaines et notions du programme officiel. Les leçons interactives sont à développer : rien n’est encore exercé ici.') : null));

  const gens = allGenerators(store.index);
  const trainable = (skills) => skills.some((s) => store.index.exercises.some((e) => e.skill === s) || gens.some((g) => g.skill === s));
  const trail = h('div', { class: `trail subj-${subject}` });
  for (const ch of course.chapters || []) {
    const skills = ch.skills || [];
    const states = skills.map((s) => store.states.skills[s]).filter(Boolean);
    const avg = states.length ? states.reduce((a, s) => a + s.pL, 0) / skills.length : 0;
    const soon = ch.state !== 'disponible';
    const lessons = (ch.lessons || []).map((id) => store.index.byLesson.get(id)).filter(Boolean);
    const extra = lessons.reduce((n, l) => n + l.counts.approfondissement + l.counts.expert, 0);
    trail.append(h('div', { class: `station ${soon ? 'station--soon' : ''}` },
      h('div', { class: 'station-node' }, soon ? ring(0, '…') : ring(avg, states.length ? pct(avg).replace(' %', '') : '·')),
      h('div', { class: 'station-body' },
        h('h3', {}, ch.title),
        h('div', { class: 'station-meta' },
          soon ? h('span', { class: 'chip chip--soon' }, 'À venir') : h('span', { class: `chip chip--status-${ch.status || 'programme'}` }, { approfondissement: 'Approfondissement · facultatif', 'hors-programme': 'Hors programme · facultatif' }[ch.status] || 'Programme'),
          extra ? h('span', { class: 'chip chip--track-expert' }, `◆ ✦ ${extra} défis facultatifs`) : null),
        ch.note ? h('p', { class: 'small muted' }, ch.note) : null,
        skills.length ? h('div', { class: 'skill-pills' }, skills.map((s) => {
          const lv = skillLevel(s); const meta = store.index.skills.get(s);
          return meta ? h('span', { class: `skill-pill lvl-${lv}`, title: MASTERY[lv].label }, `${meta.label}${meta.status !== 'programme' ? ' ◆' : ''}`) : null;
        })) : null,
        lessons.length || trainable(skills) ? h('div', { class: 'btn-row', style: { marginTop: '10px' } },
          lessons.map((l) => {
            const { stars, done } = lessonStars(l.id);
            return h('a', { class: `btn btn--small ${done ? 'is-done' : ''}`, href: `#/lecon/${l.id}`, title: done ? 'Leçon terminée' : undefined },
              done ? h('span', { 'aria-hidden': 'true' }, '✓ ') : null, `${l.title}`,
              (l.experiences || []).length ? h('span', { class: 'map-xp', 'aria-hidden': 'true', title: 'Contient une expérience à regarder' }, ' 🧪') : null,
              stars ? h('span', { class: 'map-stars', 'aria-hidden': 'true' }, ` ★ ${stars}`) : null, ' →',
              h('span', { class: 'sr-only' }, [done ? ' (terminée)' : '', (l.experiences || []).length ? ', avec une expérience' : '', stars ? `, ${stars} étoiles` : ''].join('')));
          }),
          trainable(skills) ? h('a', { class: 'btn btn--small btn--ghost', href: `#/exercices?niveau=${level}&matiere=${subject}&notions=${skills.join(',')}` }, 'S’entraîner ↻') : null) : null,
        (ch.official && ch.official.length) || (ch.notions && ch.notions.length)
          ? h('details', { class: 'small', style: { marginTop: '8px' } }, h('summary', {}, 'Ce que dit le programme'),
            h('ul', {}, ...(ch.official || []).map((o) => h('li', {}, o.label)), ...(ch.notions || []).map((n) => h('li', {}, n)))) : null)));
  }
  root.append(trail);
}
