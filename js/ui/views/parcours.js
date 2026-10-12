/**
 * Parcours, à la manière des applications de langues :
 * - #/parcours : une carte par matière (avancement, « Continuer : leçon suivante ») ;
 * - #/parcours/<matière> : le chemin, unité par unité, avec « Tu es ici », les étoiles des leçons faites,
 *   les révisions dues et, à la fin de chaque unité, un bilan qui rapporte une couronne.
 * Rien n'est verrouillé : chaque professeur choisit son ordre, le parcours conseille sans interdire.
 */
import { h } from '../dom.js';
import { store, dueReviews } from '../../app/store.js';
import { photon } from '../photon.js';
import { goalRing } from '../game/hud.js';
import { coursesOf, pathOf, progressNow, subjectLabel, levelOfProfile, SUBJECT_ICONS } from '../parcours/data.js';

const ZIGZAG = [0, 56, 88, 56, 0, -56, -88, -56]; // décalage horizontal des nœuds (px), comme un sentier
const MEDAL = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);
/** Lien qui garde la classe consultée (un parent peut regarder une autre classe que celle du profil). */
const withLevel = (href, level) => (level === levelOfProfile() ? href : `${href}${href.includes('?') ? '&' : '?'}niveau=${encodeURIComponent(level)}`);

function nextButton(subject, next, level, big = false) {
  if (!next) return h('span', { class: 'path-done-all' }, '🎉 Parcours terminé, toutes les couronnes gagnées !');
  const href = next.kind === 'bilan' ? withLevel(`#/parcours/${subject}/bilan/${next.id}`, level) : `#/lecon/${next.id}`;
  return h('a', { class: `btn btn--primary ${big ? 'btn--big' : 'btn--small'}`, href }, next.kind === 'bilan' ? '👑 ' : '▶ ', big ? `Continuer : ${next.title}` : 'Continuer');
}

/* ------------------------------ #/parcours : mes parcours ------------------------------ */

async function renderHome(root, level) {
  const courses = coursesOf(level);
  root.append(h('div', { class: 'page-head' }, h('div', {}, h('p', { class: 'eyebrow' }, `Mes parcours · ${level}`), h('h1', {}, 'Choisis ta matière'),
    h('p', { class: 'lede' }, 'Chaque matière est un chemin d’unités : fais les leçons dans l’ordre conseillé, puis réussis le bilan de l’unité pour gagner sa couronne 👑.'))));
  if (!courses.length) {
    root.append(h('div', { class: 'card empty' }, photon('curieux', 64), h('p', {}, 'Les parcours de cette classe arrivent bientôt. En attendant, la carte du programme montre ce qui sera étudié.'), h('a', { class: 'btn', href: '#/carte' }, 'Voir le programme')));
    return;
  }
  const progress = progressNow();
  const cards = await Promise.all(courses.map(async (c) => {
    const data = await pathOf(c.id, progress);
    if (!data || !data.path.total) return null;
    const { path } = data;
    const unit = path.units.find((u) => u.id === path.currentUnit);
    return h('article', { class: `path-card subj-${c.subject}` },
      h('a', { class: 'path-card-head', href: withLevel(`#/parcours/${c.subject}`, level) },
        h('span', { class: 'path-card-ring' }, goalRing(path.progress, 58, 7), h('span', { class: 'path-card-icon', 'aria-hidden': 'true' }, SUBJECT_ICONS[c.subject] || '•')),
        h('span', {}, h('strong', {}, subjectLabel(c.subject)), h('small', {}, `${path.doneCount}/${path.total} leçons · ${path.crowns} 👑`))),
      unit ? h('p', { class: 'small muted' }, `Unité ${unit.number} : ${unit.title}`) : null,
      h('div', { class: 'btn-row' }, nextButton(c.subject, path.next, level), h('a', { class: 'btn btn--ghost btn--small', href: withLevel(`#/parcours/${c.subject}`, level) }, 'Voir le chemin')));
  }));
  root.append(h('div', { class: 'path-cards' }, cards.filter(Boolean)));
}

/* ------------------------------ #/parcours/<matière> : le chemin ------------------------------ */

function lessonNode(subject, l, i, isCurrent) {
  const state = l.done ? 'est terminée' : isCurrent ? 'est la prochaine' : 'est à faire';
  const label = `${l.title} : la leçon ${state}${l.done ? `, ${l.medal} étoile${l.medal > 1 ? 's' : ''} sur 3` : ''}${l.experiences ? ', avec une expérience' : ''}`;
  return h('li', { class: `path-node ${l.done ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''}`, style: { '--x': `${ZIGZAG[i % ZIGZAG.length]}px` } },
    isCurrent ? h('div', { class: 'path-here' }, photon('joie', 46), h('span', {}, 'Tu es ici')) : null,
    h('a', { class: 'node-btn', href: `#/lecon/${l.id}`, 'aria-label': label, 'aria-current': isCurrent ? 'step' : undefined },
      h('span', { 'aria-hidden': 'true' }, l.done ? '✓' : SUBJECT_ICONS[subject] || '•'),
      l.experiences ? h('span', { class: 'node-badge', 'aria-hidden': 'true' }, '🧪') : null),
    h('span', { class: 'node-label', 'aria-hidden': 'true' }, l.title),
    l.done ? h('span', { class: 'node-medal', 'aria-hidden': 'true' }, MEDAL(l.medal)) : null);
}

function bilanNode(subject, u, i, isCurrent, level) {
  const label = `Bilan de l’unité ${u.number}${u.bilan.passed ? ' : réussi, couronne gagnée' : u.bilan.advised ? ' : conseillé maintenant' : ''}`;
  return h('li', { class: `path-node path-node--bilan ${u.bilan.passed ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''}`, style: { '--x': `${ZIGZAG[i % ZIGZAG.length]}px` } },
    isCurrent ? h('div', { class: 'path-here' }, photon('bravo', 46), h('span', {}, 'À toi le bilan !')) : null,
    h('a', { class: 'node-btn', href: withLevel(`#/parcours/${subject}/bilan/${u.id}`, level), 'aria-label': label, 'aria-current': isCurrent ? 'step' : undefined },
      h('span', { 'aria-hidden': 'true' }, u.bilan.passed ? '👑' : '🏆')),
    h('span', { class: 'node-label', 'aria-hidden': 'true' }, u.bilan.passed ? 'Couronne gagnée' : 'Bilan de l’unité'));
}

function unitSection(subject, path, u, level) {
  const nodes = u.lessons.map((l, i) => lessonNode(subject, l, i, path.next && path.next.kind === 'lecon' && path.next.id === l.id));
  nodes.push(bilanNode(subject, u, u.lessons.length, path.next && path.next.kind === 'bilan' && path.next.id === u.id, level));
  return h('section', { class: `unit ${u.id === path.currentUnit ? 'is-current' : ''} ${u.complete ? 'is-complete' : ''}`, id: `unite-${u.id}`, 'aria-labelledby': `unite-t-${u.id}` },
    h('header', { class: 'unit-head' },
      h('p', { class: 'unit-num' }, `Unité ${u.number}`, u.bilan.passed ? h('span', { title: 'Couronne gagnée' }, ' 👑') : null),
      h('h2', { id: `unite-t-${u.id}` }, u.title),
      h('p', { class: 'unit-meta' }, `${u.doneCount}/${u.total} leçon${u.total > 1 ? 's' : ''}`, u.status !== 'programme' ? ' · facultatif' : '')),
    h('ol', { class: 'path-nodes' }, nodes));
}

function reviewsBlock(course) {
  const skills = new Set((course.chapters || []).flatMap((c) => c.skills || []));
  const due = dueReviews().filter((s) => skills.has(s.skill) && s.due <= store.now());
  if (!due.length) return null;
  const first = due[0].skill;
  return h('a', { class: 'path-reviews', href: `#/seance?kind=revision&skill=${encodeURIComponent(first)}` },
    h('span', { class: 'path-reviews-icon', 'aria-hidden': 'true' }, '🔁'),
    h('span', {}, h('strong', {}, `${due.length} notion${due.length > 1 ? 's' : ''} à réviser`), h('small', {}, 'Une révision réussie plusieurs jours après fixe la notion pour longtemps.')),
    h('span', { class: 'btn btn--small' }, 'Réviser'));
}

async function renderPath(root, level, subject, focus) {
  const courses = coursesOf(level);
  const meta = courses.find((c) => c.subject === subject);
  if (!meta) { location.hash = '#/parcours'; return; }
  const data = await pathOf(meta.id);
  if (!data) { root.append(h('p', { class: 'card' }, 'Parcours introuvable.')); return; }
  const { course, path } = data;
  root.classList.add(`subj-${subject}`);
  if (!path.total) {
    root.append(h('div', { class: 'card empty' }, photon('curieux', 64), h('p', {}, 'Les leçons de ce parcours arrivent bientôt.'), h('a', { class: 'btn', href: withLevel('#/parcours', level) }, 'Mes parcours')));
    return;
  }
  root.append(
    h('nav', { class: 'path-subjects', 'aria-label': 'Matières' }, courses.map((c) => h('a', { class: `path-subject subj-${c.subject}`, href: withLevel(`#/parcours/${c.subject}`, level), 'aria-current': c.subject === subject ? 'page' : undefined },
      h('span', { 'aria-hidden': 'true' }, SUBJECT_ICONS[c.subject] || '•'), subjectLabel(c.subject)))),
    h('div', { class: 'path-top card' },
      h('span', { class: 'path-top-ring' }, goalRing(path.progress, 84, 10), h('b', {}, `${Math.round(path.progress * 100)} %`)),
      h('div', {}, h('p', { class: 'eyebrow' }, `Parcours · ${level}`), h('h1', {}, subjectLabel(subject)),
        h('p', { class: 'small muted' }, `${path.doneCount}/${path.total} leçons · ${path.crowns}/${path.units.length} couronnes 👑`)),
      h('div', { class: 'path-top-go' }, nextButton(subject, path.next, level, true),
        h('a', { class: 'small', href: `#/carte/${subject}` }, 'Ce que dit le programme officiel'))),
    reviewsBlock(course) || '', // append() natif : null s'afficherait « null »
    h('div', { class: 'path' }, path.units.map((u) => unitSection(subject, path, u, level))));
  // on arrive sur l'unité en cours (ou celle demandée), pas en haut d'un long chemin
  const target = root.querySelector(focus ? `#unite-${CSS.escape(focus)}` : '.path-node.is-current');
  const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (target) setTimeout(() => target.scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'auto' }), 60);
}

export async function render(root, { args, params }) {
  const level = params.get('niveau') || levelOfProfile();
  if (args[0]) await renderPath(root, level, args[0], params.get('unite'));
  else await renderHome(root, level);
}
