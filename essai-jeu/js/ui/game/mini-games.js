/**
 * Les petits jeux de Prisme, vus depuis la page « Aujourd'hui » et la page « Ma progression » : ce que chacun a déjà
 * rapporté aujourd'hui (ses points se gagnent une fois par jour), un « jeu du jour » qui change chaque jour pour
 * varier les plaisirs, et les records personnels du calcul éclair.
 */
import { h } from '../dom.js';
import { store } from '../../app/store.js';
import { dayKey, XP } from '../../engine/game.js';
import { ECLAIR_THEMES, ECLAIR_LEVELS, formatMs } from '../../engine/eclair.js';
import { allGenerators, coversSkills } from '../../generators/registry.js';

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

// générateurs écrits en code qui produisent des associations (voir le jeu de mémoire)
const MATCH_CODE = new Set(['lf-oeuvres', 'mus-oeuvres', 'arts-oeuvres', 'tc-donnees', 'tc-projet']);
const LANGS = new Set(['lv', 'anglais', 'espagnol', 'allemand']);

/**
 * Le petit jeu qui prolonge un chapitre de la quête de l'année : sa frise, ses associations au jeu de mémoire,
 * le calcul éclair en maths, le mot mystère en français et en langues. Renvoie { icon, label, href } ou null.
 * Un générateur prolonge le chapitre s'il lui est rattaché ou s'il en couvre les notions.
 */
export function bonusGame(level, subject, ch) {
  const lv = String(level || '').toLowerCase();
  const skills = new Set((ch && ch.skills) || []);
  const gens = allGenerators(store.index).filter((g) => g.levels.map((x) => String(x).toLowerCase()).includes(lv)
    && ((g.chapters || []).includes(ch && ch.id) || (skills.size && coversSkills(g, skills))));
  const q = (o) => new URLSearchParams(o).toString();
  // en langues, le vocabulaire se joue au mot mystère (on l'écrit lettre à lettre)
  if (LANGS.has(subject) && gens.some((g) => g.kind === 'vocab')) return { icon: '🔤', label: 'Un mot mystère avec le vocabulaire du chapitre', href: `#/mot?${q({ classe: lv, mots: gens.some((g) => g.id === 'es-vocabulario') ? 'es' : 'en' })}` };
  const chrono = gens.find((g) => g.source !== 'code' && g.kind === 'chronologie');
  if (chrono) return { icon: '⏳', label: 'Range les dates de ce chapitre sur une frise', href: `#/frise?${q({ classe: lv, theme: chrono.id })}` };
  const pairs = gens.find((g) => (g.source !== 'code' && ['match', 'vocab'].includes(g.kind)) || MATCH_CODE.has(g.id));
  if (pairs) return { icon: '🃏', label: 'Retrouve les paires de ce chapitre au jeu de mémoire', href: `#/memoire?${q({ classe: lv, theme: pairs.id })}` };
  if (subject === 'maths' && ECLAIR_LEVELS[lv]) return { icon: '⚡', label: 'Un calcul éclair pour garder la forme', href: `#/eclair?${q({ classe: lv })}` };
  if (subject === 'francais') return { icon: '🔤', label: 'Un mot mystère pour finir en beauté', href: `#/mot?${q({ classe: lv, mots: 'fr' })}` };
  if (LANGS.has(subject)) return { icon: '🔤', label: 'Un mot mystère avec le vocabulaire de la classe', href: `#/mot?${q({ classe: lv, mots: gens.some((g) => g.id === 'es-vocabulario') ? 'es' : 'en' })}` };
  return null;
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

/* ------------------------------ Espace parents ------------------------------ */

const WEEK_ROWS = [
  ['chapitre', '🏅', 'chapitre de la quête de l’année terminé', 'chapitres de la quête de l’année terminés'], ['gardien', '🦔', 'gardien de période apprivoisé', 'gardiens de période apprivoisés'],
  ['quete', '🗺️', 'quête libre terminée', 'quêtes libres terminées'], ['defi', '🎁', 'défi relevé', 'défis relevés'], ['plateau', '🎲', 'partie de plateau', 'parties de plateau'],
  ['enigme', '🧩', 'énigme du jour', 'énigmes du jour'], ['memoire', '🃏', 'jour de jeu de mémoire', 'jours de jeu de mémoire'], ['frise', '⏳', 'jour de frise chronologique', 'jours de frise chronologique'],
  ['eclair', '⚡', 'jour de calcul éclair', 'jours de calcul éclair'], ['mot', '🔤', 'jour de mot mystère', 'jours de mot mystère'],
];

/** Ce qui a été joué ces 7 derniers jours : { type → nombre }. Fonction pure. */
export function weekGames(events, now) {
  const since = now - 7 * 86400000;
  const out = {};
  for (const e of events || []) if (e.ts >= since && e.ts <= now) out[e.type] = (out[e.type] || 0) + 1;
  return out;
}

/** Carte « Les jeux cette semaine » du tableau de bord parent. */
export function parentGamesSection(game, now) {
  const w = weekGames(game && game.events, now);
  const rows = WEEK_ROWS.filter(([t]) => w[t]);
  const recs = Object.entries((game && game.records) || {}).filter(([k]) => k.startsWith('eclair:')).sort((a, b) => b[1].at - a[1].at).slice(0, 3);
  return h('section', { class: 'card parent-games' }, h('h2', {}, 'Les jeux cette semaine'),
    rows.length ? h('ul', { class: 'parent-games-list' }, rows.map(([t, icon, one, many]) => h('li', {}, h('span', { 'aria-hidden': 'true' }, `${icon} `), h('strong', {}, String(w[t])), ` ${w[t] > 1 ? many : one}`)))
      : h('p', { class: 'muted' }, 'Aucun jeu ces sept derniers jours.'),
    recs.length ? h('p', { class: 'small' }, 'Records récents au calcul éclair : ', recs.map(([k, v]) => { const [, level, theme, count] = k.split(':'); return `${formatMs(v.ms)} (${LEVEL(level)}, ${theme === 'melange' ? 'mélange' : (ECLAIR_THEMES[theme] || { label: theme }).label.toLowerCase()}, ${count} calculs)`; }).join(' ; '), '.') : null,
    h('p', { class: 'small muted' }, 'Les jeux reprennent les contenus de la classe : questions des chapitres, associations, frises, calcul mental, vocabulaire. Les points des petits jeux ne se gagnent qu’une fois par jour, pour encourager la variété plutôt que la répétition.'));
}
