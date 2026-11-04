/**
 * Les petits jeux de Prisme, vus depuis la page « Aujourd'hui » et la page « Ma progression » : ce que chacun a déjà
 * rapporté aujourd'hui (ses points se gagnent une fois par jour), un « jeu du jour » qui change chaque jour pour
 * varier les plaisirs, et les records personnels du calcul éclair.
 */
import { h } from '../dom.js';
import { store } from '../../app/store.js';
import { dayKey, XP } from '../../engine/game.js';
import { ECLAIR_THEMES, formatMs } from '../../engine/eclair.js';

export const MINI_GAMES = [
  { id: 'memoire', icon: '🃏', label: 'Mémoire', href: '#/memoire', pitch: 'retrouve les paires (mots, dates, traductions…), seul ou à deux' },
  { id: 'frise', icon: '⏳', label: 'Frise', href: '#/frise', pitch: 'avant ou après ? place les événements dans l’ordre du temps' },
  { id: 'eclair', icon: '⚡', label: 'Calcul éclair', href: '#/eclair', pitch: '10 calculs de ta classe, et ton record à battre' },
  { id: 'mot', icon: '🔤', label: 'Mot mystère', href: '#/mot', pitch: 'une devinette, un mot à retrouver lettre à lettre' },
];

/** Le jeu du jour : change chaque jour, le même pour toute la famille. */
export function gameOfDay(day) {
  const n = Math.floor(Date.parse(`${day}T12:00:00Z`) / 86400000);
  return MINI_GAMES[((n % MINI_GAMES.length) + MINI_GAMES.length) % MINI_GAMES.length];
}

const playedToday = (type, day) => ((store.states && store.states.game && store.states.game.events) || []).some((e) => e.type === type && e.id === day);

/** Liste des petits jeux, avec leur état du jour. */
export function miniGamesList() {
  const day = dayKey(store.now());
  const star = gameOfDay(day);
  return h('ul', { class: 'mini-games' }, MINI_GAMES.map((g) => {
    const done = playedToday(g.id, day);
    return h('li', { class: `mini-game ${g.id === star.id ? 'is-star' : ''} ${done ? 'is-done' : ''}` },
      h('a', { href: g.href, class: 'mini-game-link' },
        h('span', { class: 'mini-game-icon', 'aria-hidden': 'true' }, g.icon),
        h('span', { class: 'mini-game-text' }, h('strong', {}, g.label), g.id === star.id ? h('span', { class: 'mini-game-star' }, ' · 🌟 jeu du jour') : null,
          h('small', {}, g.pitch)),
        h('span', { class: 'mini-game-state' }, done ? '✓ fait aujourd’hui' : `+${XP[g.id]} points`)));
  }));
}

const LEVEL = (id) => ((store.catalog && store.catalog.levels.find((l) => l.id === id)) || { label: id }).label;

/** Records personnels (calcul éclair), du plus récent au plus ancien. */
export function recordsSection() {
  const recs = Object.entries((store.states && store.states.game && store.states.game.records) || {})
    .map(([k, v]) => { const [kind, level, theme, count] = k.split(':'); return { kind, level, theme, count, ...v }; })
    .filter((r) => r.kind === 'eclair')
    .sort((a, b) => b.at - a.at);
  return h('section', { class: 'card prog-records', id: 'records' },
    h('h2', {}, `Mes records · ${recs.length}`),
    recs.length
      ? h('ul', { class: 'records-list' }, recs.map((r) => h('li', {},
        h('span', { 'aria-hidden': 'true' }, '⚡ '), h('strong', {}, formatMs(r.ms)),
        ` · ${r.theme === 'melange' ? 'Mélange' : (ECLAIR_THEMES[r.theme] || { label: r.theme }).label} · ${LEVEL(r.level)} · ${r.count} calculs`,
        h('small', { class: 'muted' }, ` (le ${new Date(r.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })})`))))
      : h('p', { class: 'small muted' }, 'Pas encore de record : lance un calcul éclair avec le chrono, puis essaie de battre ton temps.'),
    h('a', { class: 'btn btn--ghost btn--small', href: '#/eclair' }, '⚡ Calcul éclair'));
}
