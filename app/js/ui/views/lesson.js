/**
 * Lecteur de leçon, écran par écran : un chemin d'étapes (découverte → cours en cartes → expérience →
 * exemple → exercices un par un → mission → à retenir), des étoiles à gagner et un écran final.
 * Les parcours facultatifs Approfondissement / Expert se jouent de la même façon, à part.
 */
import { h, richText, announce } from '../dom.js';
import { store, loadLesson, markLessonSection } from '../../app/store.js';
import { TRACK_LABELS, TRACK_ICONS } from '../exercise.js';
import { buildSteps, renderStep, guide } from '../lesson-play/steps.js';
import { exerciseRunner } from '../lesson-play/runner.js';
import { confetti } from '../lesson-play/celebrate.js';
import { loadPlay, savePlay } from '../lesson-play/progress.js';

const PROVIDERS = { lumni: 'Lumni', eduscol: 'Éduscol', bo: 'Bulletin officiel', legifrance: 'Légifrance', autre: 'Ressource' };

let resourcesCache = null;
async function resources() {
  if (resourcesCache) return resourcesCache;
  try { resourcesCache = await (await fetch('content/resources.json', { cache: 'no-cache' })).json(); } catch { resourcesCache = { lessons: {}, skills: {} }; }
  return resourcesCache;
}

function setUrl(lessonId, params) {
  const q = new URLSearchParams(params).toString();
  history.replaceState(null, '', `#/lecon/${lessonId}${q ? `?${q}` : ''}`);
}

export async function render(root, { args, params }) {
  const lessonId = args[0];
  const meta = store.index.byLesson.get(lessonId);
  if (!meta) { root.append(h('p', {}, 'Leçon introuvable.'), h('a', { class: 'btn', href: '#/carte' }, 'Retour à la carte')); return; }
  const lesson = await loadLesson(lessonId);
  const res = await resources();
  const track = ['approfondissement', 'expert'].includes(params.get('parcours')) ? params.get('parcours') : 'classe';
  const byId = Object.fromEntries(lesson.exercises.map((e) => [e.id, e]));
  const subj = lesson.subject;
  root.classList.add(`subj-${subj}`, 'play-root');
  const play = loadPlay(lessonId);
  const results = play.results;

  const starsEl = h('span', { class: 'play-stars', 'aria-live': 'polite' });
  const paintStars = () => {
    const n = Object.values(results).reduce((a, r) => a + (r.stars || 0), 0);
    starsEl.textContent = `★ ${n}`;
    starsEl.setAttribute('aria-label', `${n} étoiles gagnées dans cette leçon`);
  };
  paintStars();
  const onResult = () => { paintStars(); savePlay(lessonId, play); starsEl.classList.remove('is-pop'); void starsEl.offsetWidth; starsEl.classList.add('is-pop'); };

  const top = h('div', { class: `play-top subj-${subj}` },
    h('a', { class: 'play-back', href: `#/carte/${subj}`, 'aria-label': 'Retour à la carte' }, '←'),
    h('div', { class: 'play-titles' }, h('p', { class: 'eyebrow' }, `${lesson.level} · ${track === 'classe' ? `${meta.counts.classe} exercices` : TRACK_LABELS[track]}`), h('h1', {}, lesson.title)),
    starsEl);
  root.append(top);

  /* ---- parcours facultatifs : une seule étape, les exercices un par un ---- */
  if (track !== 'classe') {
    const info = (lesson.tracks && lesson.tracks[track]) || { exercises: [] };
    const defs = info.exercises.map((id) => byId[id]).filter(Boolean);
    const box = h('section', { class: `play-stage step subj-${subj}`, style: { '--accent': `var(--${track})` } },
      h('header', { class: 'step-head' }, h('span', { class: 'step-icon', 'aria-hidden': 'true' }, TRACK_ICONS[track]), h('div', {}, h('p', { class: 'step-kind' }, 'Facultatif'), h('h2', { class: 'step-title' }, TRACK_LABELS[track]))),
      guide('curieux', info.intro || 'Des exercices pour aller plus loin. Ils ne retirent rien à ta progression du programme.'));
    const back = h('p', { class: 'play-foot-links' }, h('a', { class: 'btn btn--ghost', href: `#/lecon/${lessonId}` }, '← Revenir à la leçon'));
    if (!defs.length) { box.append(h('p', { class: 'muted' }, 'Pas encore d’exercice dans ce parcours pour cette leçon.'), back); root.append(box); return undefined; }
    const runner = exerciseRunner(defs, { lessonId, results, onResult, startAt: params.get('exercice') });
    box.append(runner.el, back);
    root.append(box);
    return () => runner.destroy();
  }

  /* ---- leçon de la classe : étapes ---- */
  const steps = buildSteps(lesson);
  const fromUrl = Number(params.get('etape'));
  let current = Number.isInteger(fromUrl) && fromUrl >= 1 && fromUrl <= steps.length ? fromUrl - 1 : Math.min(play.step, steps.length - 1);
  if (steps[current] && steps[current].kind === 'fin' && !params.get('etape')) current = 0; // leçon déjà finie : on recommence au début
  if (params.get('experience') !== null) {
    // lien depuis la galerie d'expériences : n-ième expérience de la leçon
    const exps = steps.map((st, i) => [st, i]).filter(([st]) => st.kind === 'experience');
    const pick = exps[Number(params.get('experience'))];
    if (pick) current = pick[1];
  }
  // lien direct vers un exercice : on ouvre l'étape qui le contient, sur cet exercice
  let focusExercise = params.get('exercice');
  if (focusExercise) {
    const i = steps.findIndex((st) => st.section && (st.section.exercises || []).includes(focusExercise));
    if (i >= 0) current = i; else focusExercise = null;
  }
  let view = null;

  const path = h('ol', { class: 'play-path', 'aria-label': 'Étapes de la leçon' });
  const bar = h('div', { class: 'play-progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(steps.length) }, h('span'));
  const stage = h('div', { class: 'play-stage' });
  const btnBack = h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => go(current - 1, 'back') }, '← Retour');
  const btnNext = h('button', { type: 'button', class: 'btn btn--primary btn--big', onclick: () => onContinue() }, 'Continuer →');
  const waitHint = h('span', { class: 'play-wait muted small' });
  const nav = h('div', { class: 'play-nav' }, btnBack, waitHint, btnNext);
  root.append(h('nav', { class: `play-map subj-${subj}`, 'aria-label': 'Plan de la leçon' }, bar, path), stage, nav);

  function paintPath() {
    path.replaceChildren(...steps.map((st, i) => h('li', {}, h('button', {
      type: 'button', class: `play-station ${i < current ? 'is-done' : ''} ${i === current ? 'is-current' : ''}`,
      title: `${i + 1}. ${st.title}`, 'aria-label': `Étape ${i + 1} : ${st.title}`, 'aria-current': i === current ? 'step' : undefined,
      onclick: () => go(i, i < current ? 'back' : 'fwd'),
    }, h('span', { 'aria-hidden': 'true' }, st.icon), h('small', {}, st.label)))));
    bar.firstChild.style.width = `${(current / Math.max(1, steps.length - 1)) * 100}%`;
    bar.setAttribute('aria-valuenow', String(current + 1));
    bar.setAttribute('aria-label', `Étape ${current + 1} sur ${steps.length}`);
  }

  function paintNav() {
    btnBack.disabled = current === 0;
    const last = steps[current].kind === 'fin';
    btnNext.hidden = last;
    const ready = !view || view.ready();
    btnNext.disabled = !ready;
    btnNext.textContent = view && view.continueLabel ? view.continueLabel() : 'Continuer →';
    btnNext.classList.toggle('is-pulse', ready && view && view.ready !== undefined && steps[current].section && (steps[current].section.exercises || []).length > 0);
    waitHint.textContent = ready ? '' : 'Termine les exercices (ou passe-les) pour continuer.';
  }

  function onContinue() {
    if (view && view.advance && view.advance()) { paintNav(); return; }
    go(current + 1, 'fwd');
  }

  function go(i, dir = 'fwd') {
    if (i < 0 || i >= steps.length) return;
    if (view) view.destroy();
    current = i;
    play.step = i;
    savePlay(lessonId, play);
    setUrl(lessonId, { etape: String(i + 1) });
    const st = steps[i];
    if (st.idx >= 0) markLessonSection(lessonId, st.idx).catch(() => {});
    view = st.kind === 'fin' ? endScreen() : renderStep(st, { lessonId, byId, results, onResult, subject: subj, startAt: focusExercise, onReadyChange: () => paintNav() });
    focusExercise = null;
    view.el.classList.add(`enter-${dir}`);
    stage.replaceChildren(view.el);
    paintPath();
    paintNav();
    const title = view.el.querySelector('.step-title, h2');
    if (title) { title.setAttribute('tabindex', '-1'); title.focus({ preventScroll: true }); }
    root.scrollIntoView ? window.scrollTo({ top: 0, behavior: 'smooth' }) : null;
    announce(`Étape ${i + 1} sur ${steps.length} : ${st.title}`);
  }

  /** Référence au programme officiel (et note « programme défini par cycle »), pour les parents. */
  function programmeNote() {
    const programmes = ((store.programmes && store.programmes.programmes) || []).filter((p) => (lesson.programmes || []).includes(p.id));
    const editorial = lesson.skills.some((sid) => (store.index.skills.get(sid) || {}).editorialLevel);
    if (!programmes.length && !editorial) return null;
    return h('details', { class: 'note-cycle' }, h('summary', {}, 'Référence au programme officiel'),
      ...programmes.map((p) => h('p', {}, h('strong', {}, p.title), ` — ${p.officialText || ''} `,
        ...(p.links || []).filter((l) => l.url).slice(0, 2).map((l) => h('a', { href: l.url, target: '_blank', rel: 'noopener noreferrer', style: { marginRight: '8px' } }, l.label || 'Lien officiel')))),
      editorial ? h('p', {}, 'Ce programme est défini pour l’ensemble du cycle : la classe indiquée ici est une progression proposée par Prisme, pas un ordre national obligatoire.') : null);
  }

  function endScreen() {
    const allIds = steps.flatMap((st) => (st.section && st.section.exercises) || []);
    const total = Object.entries(results).filter(([id]) => allIds.includes(id)).reduce((a, [, r]) => a + (r.stars || 0), 0);
    const max = allIds.length * 3;
    const skills = lesson.skills.map((sid) => store.states.skills[sid]).filter(Boolean);
    const due = skills.filter((x) => x.due).map((x) => x.due);
    const revision = due.length ? `Prochaine révision programmée dans ${Math.max(0, Math.round((Math.min(...due) - store.now()) / 86400000))} jour(s) : Prisme te la proposera dans « Aujourd'hui ».` : 'La révision sera programmée dès ta première réussite.';
    const links = [];
    for (const s of lesson.sections.filter((x) => x.kind === 'ressource')) links.push(...(s.links || []));
    for (const l of (res.lessons[lessonId] || [])) if (!links.some((x) => x.url === l.url)) links.push(l);
    for (const sk of lesson.skills) for (const l of (res.skills[sk] || [])) if (!links.some((x) => x.url === l.url)) links.push(l);
    const tracks = ['approfondissement', 'expert'].map((t) => {
      const info = lesson.tracks && lesson.tracks[t];
      if (!info || !info.exercises || !info.exercises.length) return null;
      return h('a', { class: 'card card--accent play-track', style: { '--accent': `var(--${t})` }, href: `#/lecon/${lessonId}?parcours=${t}` },
        h('p', { class: 'eyebrow' }, `${TRACK_ICONS[t]} ${TRACK_LABELS[t]}`), richText(info.intro || ''), h('span', { class: 'btn btn--small' }, `Relever le défi (${info.exercises.length} exercices)`));
    }).filter(Boolean);
    const ratio = max ? total / max : 1;
    const el = h('section', { class: 'step step--fin' },
      h('div', { class: 'fin-hero' },
        guide('bravo', ratio >= 0.7 ? 'Bravo ! Leçon terminée avec brio.' : ratio >= 0.4 ? 'Leçon terminée ! Tu as bien travaillé.' : 'Leçon terminée. Reviens sur les exercices manqués : c’est comme ça qu’on progresse.'),
        h('p', { class: 'fin-stars' }, `${total} ★`, h('small', {}, max ? ` sur ${max}` : '')),
        h('h2', { class: 'step-title' }, lesson.title)),
      h('p', { class: 'fin-revision' }, '🔁 ', revision),
      tracks.length ? h('div', {}, h('h3', {}, 'Pour aller plus loin (facultatif)'), h('div', { class: 'grid grid--2' }, tracks)) : null,
      links.length ? h('div', { class: 'fin-links' }, h('h3', {}, 'Revoir la notion ailleurs'), h('div', { class: 'resource-links' }, links.map((l) => h('a', { class: 'resource-link', href: l.url, target: '_blank', rel: 'noopener noreferrer' },
        h('span', { class: 'prov' }, PROVIDERS[l.provider] || l.provider || 'Lien'), h('span', {}, l.label), h('span', { class: 'muted small', style: { marginLeft: 'auto' } }, '↗ site externe'))))) : null,
      programmeNote(),
      h('div', { class: 'fin-actions' },
        h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => go(0, 'back') }, '↺ Revoir la leçon depuis le début'),
        h('a', { class: 'btn btn--ghost', href: `#/exercices?lecon=${lessonId}` }, '✏️ M’entraîner encore'),
        h('a', { class: 'btn btn--primary', href: `#/carte/${subj}` }, 'Retour à la carte')));
    setTimeout(() => confetti(el), 250);
    // « terminée » seulement si chaque exercice de la leçon a été fait (ou passé), pas en sautant à la fin
    if (!play.done && allIds.every((id) => results[id])) { play.done = true; savePlay(lessonId, play); }
    return { el, destroy() {}, ready: () => true };
  }

  const onKey = (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    // seulement quand le focus n'est pas dans un exercice, une manipulation ou une expérience
    // (certains exercices utilisent les flèches pour se déplacer entre les mots ou les points)
    const t = e.target;
    const neutral = !t || t === document.body || t.id === 'app';
    if (!neutral && !t.closest('.play-nav, .play-map, .play-top, .step-head, .guide')) return;
    if (neutral && stage.querySelector('.demo')) return; // sur une expérience, les flèches pilotent l'expérience
    if (neutral && stage.querySelector('.run-ex')) return; // exercice affiché : les flèches peuvent lui servir
    if (e.key === 'ArrowRight' && !btnNext.hidden && !btnNext.disabled) { e.preventDefault(); onContinue(); }
    if (e.key === 'ArrowLeft' && current > 0) { e.preventDefault(); go(current - 1, 'back'); }
  };
  document.addEventListener('keydown', onKey);

  go(current, 'fwd');
  return () => { if (view) view.destroy(); document.removeEventListener('keydown', onKey); };
}
