/** Matrice niveaux × matières : textes officiels applicables en 2026-2027, liens, et couverture réelle dans Prisme. */
import { h } from '../dom.js';
import { store } from '../../app/store.js';

const COV = { demo: ['cov--demo', 'Leçons rédigées'], partiel: ['cov--partial', 'Partiellement rédigé'], reference: ['cov--ref', 'Programme référencé, leçons à venir'] };

export function render(root) {
  const { catalog, programmes } = store;
  const progs = programmes.programmes;
  const subjects = catalog.subjects.filter((s) => catalog.courses.some((c) => c.subject === s.id));
  const courseOf = (lv, subj) => catalog.courses.find((c) => c.level === lv && c.subject === subj);
  const lessonsOf = (lv, subj) => store.index.lessons.filter((l) => l.level === lv && (l.subject === subj || (subj === 'numerique' && ['code', 'ia', 'numerique'].includes(l.subject))));

  root.append(h('div', { class: 'page-head' }, h('div', {},
    h('p', { class: 'eyebrow' }, `Année scolaire ${catalog.schoolYear}`), h('h1', {}, 'Programmes officiels et contenus'),
    h('p', { class: 'lede' }, 'Pour chaque classe et chaque matière : le texte réellement applicable cette année, les liens vers le Bulletin officiel, Éduscol ou Légifrance, et ce que Prisme couvre vraiment.'))));

  const legend = h('p', { class: 'small' }, ...Object.values(COV).map(([cls, label]) => h('span', { style: { marginRight: '16px' } }, h('span', { class: `cov ${cls}` }), label)));
  const table = h('table', { class: 'matrix' },
    h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Matière'), ...catalog.levels.map((l) => h('th', { scope: 'col' }, l.label)))),
    h('tbody', {}, subjects.map((s) => h('tr', {}, h('th', { scope: 'row' }, s.label), ...catalog.levels.map((l) => {
      const c = courseOf(l.id, s.id);
      if (!c) return h('td', { class: 'muted' }, '—');
      const n = lessonsOf(l.id, s.id).length;
      const [cls] = COV[c.coverage] || COV.reference;
      return h('td', {}, h('a', { href: `#/carte/${s.id}?niveau=${l.id}`, title: c.programmes.join(', ') }, h('span', { class: `cov ${cls}` }), n ? `${n} leçon${n > 1 ? 's' : ''}` : 'réf.'));
    })))));
  root.append(legend, h('div', { class: 'matrix-wrap' }, table));

  root.append(h('h2', { style: { marginTop: '32px' } }, 'Textes officiels applicables en 2026-2027'));
  if (programmes.calendarChanges && programmes.calendarChanges.length) {
    root.append(h('details', { class: 'card', style: { marginBottom: '14px' } }, h('summary', {}, 'Calendrier des réformes (ce qui change cette année)'),
      h('ul', {}, programmes.calendarChanges.map((c) => h('li', {}, typeof c === 'string' ? c : `${c.date || c.when || ''} ${c.summary || c.label || c.change || JSON.stringify(c)}`)))));
  }
  for (const p of progs) {
    root.append(h('details', { class: 'card', style: { marginBottom: '10px' } },
      h('summary', {}, h('strong', {}, p.title), ` — ${p.levels.map((x) => (catalog.levels.find((l) => l.id === x) || { label: x }).label).join(', ')}`, p.status === 'legacy-in-force' ? h('span', { class: 'chip chip--soon', style: { marginLeft: '8px' } }, 'ancien texte encore applicable') : null),
      h('p', { class: 'small' }, p.officialText),
      h('p', { class: 'small' }, h('strong', {}, 'En 2026-2027 : '), p.inForce2026_2027),
      h('p', { class: 'small' }, h('strong', {}, p.scope === 'cycle' ? 'Défini par cycle : ' : 'Défini par année : '), p.scopeDetail || '', p.scope === 'cycle' ? ' L’ordre des chapitres proposé par Prisme est une progression éditoriale.' : ''),
      p.annualMarkers ? h('p', { class: 'small muted' }, p.annualMarkers) : null,
      h('ul', { class: 'small' }, p.links.map((l) => h('li', {}, h('a', { href: l.url, target: '_blank', rel: 'noopener noreferrer' }, l.label), l.verified ? (l.opened ? ' — texte ouvert et lu' : ' — lien vérifié') : ' — lien non vérifié'))),
      p.domains.length ? h('details', { class: 'small' }, h('summary', {}, `Domaines et notions (${p.domains.length})`), h('ul', {}, p.domains.map((d) => h('li', {}, h('strong', {}, d.label), d.notions.length ? ` : ${d.notions.join(' ; ')}` : '')))) : null,
      p.confidence !== 'high' ? h('p', { class: 'small warn' }, `Niveau de confiance de la recherche : ${p.confidence}. ${p.notes || ''}`) : null));
  }
  if (programmes.pending && programmes.pending.length) {
    root.append(h('h3', {}, 'Annoncés mais pas en vigueur en 2026-2027'), h('ul', {}, programmes.pending.map((p) => h('li', {}, h('strong', {}, p.title), ` — ${p.notes}`))));
  }
}
