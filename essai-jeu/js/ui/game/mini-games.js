/**
 * Les petits jeux de Prisme, vus depuis la page « Aujourd'hui » et la page « Ma progression » : ce que chacun a déjà
 * rapporté aujourd'hui (ses points se gagnent une fois par jour), un « jeu du jour » qui change chaque jour pour
 * varier les plaisirs, et les records personnels du calcul éclair.
 */
import { h } from '../dom.js';
import { store, recordGameEvent } from '../../app/store.js';
import { dayKey, XP } from '../../engine/game.js';
import { ECLAIR_THEMES, ECLAIR_LEVELS, formatMs } from '../../engine/eclair.js';
import { allGenerators, coversSkills } from '../../generators/registry.js';
import { TEXTS as FLUENCE_TEXTS } from '../../engine/fluence.js';

export const MINI_GAMES = [
  { id: 'memoire', icon: '🃏', label: 'Mémoire', href: '#/memoire', pitch: 'retrouve les paires (mots, dates, traductions…), seul ou à deux' },
  { id: 'frise', icon: '⏳', label: 'Frise', href: '#/frise', pitch: 'avant ou après ? place les événements dans l’ordre du temps' },
  { id: 'eclair', icon: '⚡', label: 'Calcul éclair', href: '#/eclair', pitch: '10 calculs de ta classe, et ton record à battre' },
  { id: 'mot', icon: '🔤', label: 'Mot mystère', href: '#/mot', pitch: 'une devinette, un mot à retrouver lettre à lettre' },
  { id: 'estime', icon: '📏', label: 'Ordre de grandeur', href: '#/estime', pitch: 'combien mesure, pèse ou dure… ? estime, seul ou à deux' },
  { id: 'fluence', icon: '📖', label: 'Lecture chronométrée', href: '#/fluence', pitch: 'une minute de lecture à voix haute, avec un adulte', levels: ['cp', 'ce1', 'ce2', 'cm1', 'cm2'] },
];
/** Les petits jeux d'une classe (la lecture chronométrée est réservée à l'école primaire). */
const gamesFor = (level) => MINI_GAMES.filter((g) => !g.levels || g.levels.includes(String(level || '').toLowerCase()));

/** Le jeu du jour : change chaque jour, le même pour toute la famille. */
export function gameOfDay(day, level) {
  const list = gamesFor(level);
  const n = Math.floor(Date.parse(`${day}T12:00:00Z`) / 86400000);
  return list[((n % list.length) + list.length) % list.length];
}

const playedToday = (type, day) => ((store.states && store.states.game && store.states.game.events) || []).some((e) => e.type === type && e.id === day);

/**
 * Enregistre une partie de petit jeu (ses points, une fois par jour) et, si c'est le jeu du jour, le bonus.
 * @returns {Promise<boolean>} vrai si le bonus du jeu du jour vient d'être gagné
 */
export async function recordMiniGame(type) {
  const day = dayKey(store.now());
  await recordGameEvent(type, day);
  const star = gameOfDay(day, store.profile && store.profile.level);
  if (!star || star.id !== type || playedToday('jeudujour', day)) return false;
  await recordGameEvent('jeudujour', day);
  return true;
}

/** Liste des petits jeux, avec leur état du jour. */
export function miniGamesList() {
  const day = dayKey(store.now());
  const level = store.profile && store.profile.level;
  const star = gameOfDay(day, level);
  return h('ul', { class: 'mini-games' }, gamesFor(level).map((g) => {
    const done = playedToday(g.id, day);
    return h('li', { class: `mini-game ${g.id === star.id ? 'is-star' : ''} ${done ? 'is-done' : ''}` },
      h('a', { href: g.href, class: 'mini-game-link' },
        h('span', { class: 'mini-game-icon', 'aria-hidden': 'true' }, g.icon),
        h('span', { class: 'mini-game-text' }, h('strong', {}, g.label), g.id === star.id ? h('span', { class: 'mini-game-star' }, ' · 🌟 jeu du jour') : null,
          h('small', {}, g.pitch)),
        h('span', { class: 'mini-game-state' }, done ? '✓ fait aujourd’hui' : `+${XP[g.id] + (g.id === star.id ? XP.jeudujour : 0)} points`)));
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

/** Pour un chapitre sans exercices corrigés : une activité à faire quand même (la lecture à voix haute). */
export function laterActivity(level, subject, ch) {
  const lv = String(level || '').toLowerCase();
  if (subject === 'francais' && ['cp', 'ce1', 'ce2', 'cm1', 'cm2'].includes(lv) && /fluence|voix-haute/.test((ch && ch.id) || '')) {
    return { icon: '📖', label: 'Lecture chronométrée', href: `#/fluence?classe=${lv}` };
  }
  return null;
}

const LEVEL = (id) => ((store.catalog && store.catalog.levels.find((l) => l.id === id)) || { label: id }).label;

/** Records personnels (calcul éclair, lecture chronométrée), du plus récent au plus ancien. */
export function recordsSection() {
  const recs = Object.entries((store.states && store.states.game && store.states.game.records) || {})
    .map(([k, v]) => { const [kind, level, theme, count] = k.split(':'); return { kind, level, theme, count, ...v }; })
    .filter((r) => r.kind === 'eclair' || r.kind === 'fluence')
    .sort((a, b) => b.at - a.at);
  const when = (r) => h('small', { class: 'muted' }, ` (le ${new Date(r.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })})`);
  const line = (r) => (r.kind === 'fluence'
    ? h('li', {}, h('span', { 'aria-hidden': 'true' }, '📖 '), h('strong', {}, `${r.score} mots/min`), ` · ${(FLUENCE_TEXTS.find((t) => t.id === r.level) || { title: r.level }).title}`, when(r))
    : h('li', {}, h('span', { 'aria-hidden': 'true' }, '⚡ '), h('strong', {}, formatMs(r.ms)),
      ` · ${r.theme === 'melange' ? 'Mélange' : (ECLAIR_THEMES[r.theme] || { label: r.theme }).label} · ${LEVEL(r.level)} · ${r.count} calculs`, when(r)));
  return h('section', { class: 'card prog-records', id: 'records' },
    h('h2', {}, `Mes records · ${recs.length}`),
    recs.length ? h('ul', { class: 'records-list' }, recs.map(line))
      : h('p', { class: 'small muted' }, 'Pas encore de record : lance un calcul éclair avec le chrono (ou, à l’école primaire, une lecture chronométrée), puis essaie de faire mieux.'),
    h('div', { class: 'btn-row' }, h('a', { class: 'btn btn--ghost btn--small', href: '#/eclair' }, '⚡ Calcul éclair'),
      gamesFor(store.profile && store.profile.level).some((g) => g.id === 'fluence') ? h('a', { class: 'btn btn--ghost btn--small', href: '#/fluence' }, '📖 Lecture chronométrée') : null));
}

/* ------------------------------ Espace parents ------------------------------ */

const WEEK_ROWS = [
  ['chapitre', '🏅', 'chapitre de la quête de l’année terminé', 'chapitres de la quête de l’année terminés'], ['gardien', '🦔', 'gardien de période apprivoisé', 'gardiens de période apprivoisés'],
  ['quete', '🗺️', 'quête libre terminée', 'quêtes libres terminées'], ['defi', '🎁', 'défi relevé', 'défis relevés'], ['plateau', '🎲', 'partie de plateau', 'parties de plateau'],
  ['enigme', '🧩', 'énigme du jour', 'énigmes du jour'], ['memoire', '🃏', 'jour de jeu de mémoire', 'jours de jeu de mémoire'], ['frise', '⏳', 'jour de frise chronologique', 'jours de frise chronologique'],
  ['eclair', '⚡', 'jour de calcul éclair', 'jours de calcul éclair'], ['mot', '🔤', 'jour de mot mystère', 'jours de mot mystère'],
  ['fluence', '📖', 'jour de lecture chronométrée', 'jours de lecture chronométrée'], ['estime', '📏', 'jour d’ordre de grandeur', 'jours d’ordre de grandeur'],
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
  const reads = Object.entries((game && game.records) || {}).filter(([k]) => k.startsWith('fluence:')).sort((a, b) => b[1].at - a[1].at).slice(0, 3);
  return h('section', { class: 'card parent-games' }, h('h2', {}, 'Les jeux cette semaine'),
    rows.length ? h('ul', { class: 'parent-games-list' }, rows.map(([t, icon, one, many]) => h('li', {}, h('span', { 'aria-hidden': 'true' }, `${icon} `), h('strong', {}, String(w[t])), ` ${w[t] > 1 ? many : one}`)))
      : h('p', { class: 'muted' }, 'Aucun jeu ces sept derniers jours.'),
    recs.length ? h('p', { class: 'small' }, 'Records récents au calcul éclair : ', recs.map(([k, v]) => { const [, level, theme, count] = k.split(':'); return `${formatMs(v.ms)} (${LEVEL(level)}, ${theme === 'melange' ? 'mélange' : (ECLAIR_THEMES[theme] || { label: theme }).label.toLowerCase()}, ${count} calculs)`; }).join(' ; '), '.') : null,
    reads.length ? h('p', { class: 'small' }, 'Meilleures lectures chronométrées : ', reads.map(([k, v]) => `${v.score} mots bien lus par minute (« ${(FLUENCE_TEXTS.find((t) => t.id === k.split(':')[1]) || { title: k }).title} »)`).join(' ; '), '.') : null,
    h('p', { class: 'small muted' }, 'Les jeux reprennent les contenus de la classe : questions des chapitres, associations, frises, calcul mental, vocabulaire. Les points des petits jeux ne se gagnent qu’une fois par jour, pour encourager la variété plutôt que la répétition.'));
}
