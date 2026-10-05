/**
 * Lecteur de leçon : les sections pédagogiques (découverte → révision) et les parcours facultatifs
 * Approfondissement / Expert, clairement séparés de la progression de la classe.
 */
import { h, richText, inlineHTML, mathHTML, tabs } from '../dom.js';
import { store, loadLesson, markLessonSection, skillLevel } from '../../app/store.js';
import { mountExercise, TRACK_LABELS, TRACK_ICONS } from '../exercise.js';
import { mountActivity } from '../../activities/registry.js';
import { LEVELS as MASTERY } from '../../engine/mastery.js';

const KIND_LABELS = {
  decouverte: 'Découverte', ressource: 'Ressource', cours: 'Cours', manipulation: 'Manipulation', exemple: 'Exemple résolu',
  exercices: 'Exercices guidés', libre: 'Réponses libres', reinvestissement: 'Problèmes', mission: 'Mission', correction: 'À retenir', revision: 'Révision',
};
const PROVIDERS = { lumni: 'Lumni', eduscol: 'Éduscol', bo: 'Bulletin officiel', legifrance: 'Légifrance', autre: 'Ressource' };

let resourcesCache = null;
async function resources() {
  if (resourcesCache) return resourcesCache;
  try { resourcesCache = await (await fetch('content/resources.json', { cache: 'no-cache' })).json(); } catch { resourcesCache = { lessons: {}, skills: {} }; }
  return resourcesCache;
}

function statusChip(status) {
  const lab = { programme: 'Programme de la classe', approfondissement: 'Approfondissement', 'hors-programme': 'Hors programme (passerelle)' }[status] || status;
  return h('span', { class: `chip chip--status-${status}` }, lab);
}

export async function render(root, { args, params }) {
  const lessonId = args[0];
  const meta = store.index.byLesson.get(lessonId);
  if (!meta) { root.append(h('p', {}, 'Leçon introuvable.'), h('a', { class: 'btn', href: '#/carte' }, 'Retour à la carte')); return; }
  const lesson = await loadLesson(lessonId);
  const res = await resources();
  const track = ['approfondissement', 'expert'].includes(params.get('parcours')) ? params.get('parcours') : 'classe';
  const mounted = [];
  const cleanups = [];
  const progress = (store.states.lessons[lessonId] || {});
  const seen = new Set(progress.seen || []);
  const byId = Object.fromEntries(lesson.exercises.map((e) => [e.id, e]));
  const subj = lesson.subject;
  const programmes = (store.programmes && store.programmes.programmes || []).filter((p) => (lesson.programmes || []).includes(p.id));
  const editorial = lesson.skills.some((s) => (store.index.skills.get(s) || {}).editorialLevel);

  const mountEx = (container, id) => {
    const def = byId[id];
    if (!def) return;
    mounted.push(mountExercise(container, { def, lessonId }));
  };

  /* ---- en-tête ---- */
  const skillsList = h('div', { class: 'skill-pills' }, lesson.skills.map((sid) => {
    const sk = store.index.skills.get(sid);
    const lvl = skillLevel(sid);
    return h('span', { class: `skill-pill lvl-${lvl}`, title: MASTERY[lvl].label }, sk ? sk.label : sid);
  }));
  root.append(h('div', { class: `page-head subj-${subj}` },
    h('div', {},
      h('p', { class: 'eyebrow' }, h('a', { href: `#/carte/${subj}` }, '← Carte'), ` · ${lesson.level} · ${meta.counts.classe} exercices de classe · ${meta.counts.approfondissement + meta.counts.expert} facultatifs`),
      h('h1', {}, lesson.title),
      h('p', { class: 'lede' }, lesson.summary || ''),
      h('div', { class: 'station-meta' }, statusChip(lesson.status || 'programme'), lesson.duration ? h('span', { class: 'chip chip--role' }, `≈ ${lesson.duration} min`) : null),
      skillsList)));
  if (programmes.length || editorial) {
    root.append(h('details', { class: 'note-cycle' },
      h('summary', {}, 'Référence au programme officiel'),
      ...programmes.map((p) => h('p', {}, h('strong', {}, p.title), ` — ${p.officialText || ''} `, ...(p.links || []).filter((l) => l.url).slice(0, 2).map((l) => h('a', { href: l.url, target: '_blank', rel: 'noopener noreferrer', style: { marginRight: '8px' } }, l.label || 'Lien officiel')))),
      editorial ? h('p', {}, 'Ce programme est défini pour l’ensemble du cycle : la classe indiquée ici est une progression proposée par Prisme, pas un ordre national obligatoire.') : null));
  }

  /* ---- rail ---- */
  const railLinks = lesson.sections.map((s, i) => h('li', {}, h('a', { href: `#sec-${i}`, class: seen.has(i) ? 'is-seen' : '', dataset: { idx: String(i) }, onclick: (e) => { e.preventDefault(); const t = document.getElementById(`sec-${i}`); if (t) { t.scrollIntoView({ behavior: 'smooth' }); t.focus({ preventScroll: true }); } } }, s.title || KIND_LABELS[s.kind])));
  const trackLink = (t) => {
    const info = lesson.tracks && lesson.tracks[t];
    if (!info || !info.exercises || !info.exercises.length) return null;
    return h('a', { class: `rail-track rail-track--${t}`, href: `#/lecon/${lessonId}?parcours=${t}` }, h('strong', {}, `${TRACK_ICONS[t]} ${t === 'expert' ? 'Expert' : 'Approfondissement'}`), h('small', {}, `${info.exercises.length} exercices · facultatif`));
  };
  const rail = h('nav', { class: 'lesson-rail', 'aria-label': 'Plan de la leçon' },
    track === 'classe' ? h('ol', { class: 'rail-list' }, railLinks) : h('a', { class: 'btn btn--ghost btn--small', href: `#/lecon/${lessonId}` }, '← Leçon de la classe'),
    h('div', { class: 'rail-tracks' }, trackLink('approfondissement'), trackLink('expert')));

  const content = h('div', { class: 'lesson-content' });
  root.append(h('div', { class: `lesson subj-${subj}` }, rail, content));

  if (track !== 'classe') {
    const info = lesson.tracks[track] || { exercises: [] };
    content.append(
      tabs([{ id: 'classe', label: 'Classe', icon: '●' }, { id: 'approfondissement', label: 'Approfondissement', icon: '◆' }, { id: 'expert', label: 'Expert', icon: '✦' }], track, (id) => { location.hash = id === 'classe' ? `#/lecon/${lessonId}` : `#/lecon/${lessonId}?parcours=${id}`; }, 'Parcours'),
      h('div', { class: 'track-intro', style: { '--accent': `var(--${track})`, marginTop: '14px' } },
        h('p', { class: 'eyebrow' }, TRACK_LABELS[track]),
        richText(info.intro || ''),
        h('p', { class: 'small muted' }, 'Ces exercices sont facultatifs : ils ne retirent rien à ta progression du programme, et leurs réussites sont comptées à part.')));
    for (const id of info.exercises) { const slot = h('div', {}); content.append(slot); mountEx(slot, id); }
    return () => { mounted.forEach((m) => m.destroy()); };
  }

  /* ---- sections ---- */
  lesson.sections.forEach((s, i) => {
    const sec = h('section', { class: 'lesson-section', id: `sec-${i}`, tabindex: '-1', 'aria-labelledby': `sec-${i}-t`, dataset: { idx: String(i) } },
      h('p', { class: 'section-kind' }, `${i + 1} · ${KIND_LABELS[s.kind] || s.kind}`),
      h('h2', { id: `sec-${i}-t` }, s.title || KIND_LABELS[s.kind]));
    if (s.body) sec.append(richText(s.body));
    if (s.kind === 'ressource') {
      const links = [...(s.links || []), ...((res.lessons[lessonId] || []))];
      for (const sk of lesson.skills) for (const l of (res.skills[sk] || [])) if (!links.some((x) => x.url === l.url)) links.push(l);
      sec.append(links.length
        ? h('div', { class: 'resource-links' }, links.map((l) => h('a', { class: 'resource-link', href: l.url, target: '_blank', rel: 'noopener noreferrer' },
          h('span', { class: 'prov' }, PROVIDERS[l.provider] || l.provider || 'Lien'), h('span', {}, l.label, l.note ? h('span', { class: 'muted small', style: { display: 'block' } }, l.note) : null), h('span', { class: 'muted small', style: { marginLeft: 'auto' } }, '↗ site externe'))))
        : h('p', { class: 'muted' }, 'Pas encore de ressource externe vérifiée pour cette leçon.'));
    }
    if (s.activity) { const slot = h('div', {}); sec.append(slot); cleanups.push(mountActivity(slot, s.activity.widget, s.activity.config || {})); }
    if (s.kind === 'exemple' && s.steps) {
      sec.append(h('ol', { class: 'example-steps' }, s.steps.map((st) => h('li', {}, h('span', { html: inlineHTML(st.text) }), st.math ? h('span', { html: mathHTML(st.math) }) : h('span')))));
    }
    if (s.kind === 'revision') {
      const st = lesson.skills.map((sid) => store.states.skills[sid]).filter(Boolean);
      const due = st.filter((x) => x.due).map((x) => x.due);
      sec.append(h('p', { class: 'muted' }, due.length ? `Prochaine révision programmée : dans ${Math.max(0, Math.round((Math.min(...due) - store.now()) / 86400000))} jour(s).` : 'La révision sera programmée dès ta première réussite.'));
    }
    for (const id of s.exercises || []) { const slot = h('div', {}); sec.append(slot); mountEx(slot, id); }
    content.append(sec);
  });

  const tracksBox = ['approfondissement', 'expert'].map((t) => {
    const info = lesson.tracks && lesson.tracks[t];
    if (!info || !info.exercises || !info.exercises.length) return null;
    return h('a', { class: `card card--accent`, style: { '--accent': `var(--${t})`, textDecoration: 'none', color: 'inherit' }, href: `#/lecon/${lessonId}?parcours=${t}` },
      h('p', { class: 'eyebrow' }, `${TRACK_ICONS[t]} ${TRACK_LABELS[t]}`), richText(info.intro || ''), h('span', { class: 'btn btn--small' }, `Ouvrir (${info.exercises.length} exercices)`));
  }).filter(Boolean);
  if (tracksBox.length) content.append(h('section', { class: 'lesson-section' }, h('h2', {}, 'Pour aller plus loin (facultatif)'), h('div', { class: 'grid grid--2' }, tracksBox)));

  /* ---- sections vues ---- */
  let observer = null;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        const idx = Number(en.target.dataset.idx);
        markLessonSection(lessonId, idx).catch(() => {});
        const link = rail.querySelector(`a[data-idx="${idx}"]`);
        if (link) link.classList.add('is-seen');
      }
    }, { threshold: 0.4 });
    content.querySelectorAll('.lesson-section[data-idx]').forEach((el) => observer.observe(el));
  }
  return () => { mounted.forEach((m) => m.destroy()); cleanups.forEach((c) => c && c()); if (observer) observer.disconnect(); };
}
