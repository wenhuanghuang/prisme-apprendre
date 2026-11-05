/**
 * Mot mystère (#/mot) : une série de mots à retrouver lettre à lettre, avec un indice — une devinette en français
 * (selon la classe), ou la traduction d'un mot d'anglais ou d'espagnol tiré du vocabulaire de la classe.
 * Les sept couleurs de l'arc-en-ciel s'éteignent une à une à chaque lettre absente. Une série terminée rapporte
 * quelques points une fois par jour.
 */
import { h, announce } from '../dom.js';
import { store, recordGameEvent, gameProgress } from '../../app/store.js';
import { allGenerators, loadData } from '../../generators/registry.js';
import { RAYS, RAINBOW, newWord, guess, revealOne, maskOf, isSolved, isLost, isFinished, pickWords, seriesStars, vocabAnswer, frEntries, frTier } from '../../engine/mot.js';
import { gameLevels, nearestLevel } from '../game/deck.js';
import { dayKey } from '../../engine/game.js';
import { photon } from '../photon.js';
import { speak, speechAvailable } from '../speech.js';
import { burstStars, confetti } from '../lesson-play/celebrate.js';

const levelLabel = (id) => ((store.catalog && store.catalog.levels.find((l) => l.id === id)) || { label: id }).label;
const PRIMARY = ['cp', 'ce1', 'ce2', 'cm1', 'cm2'];
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const TIER = { facile: 'mots faciles', moyen: 'mots plus longs', difficile: 'orthographe d’usage' };

/** Sources de mots d'une classe : devinettes en français, vocabulaire d'anglais et d'espagnol. */
export function motThemes(level) {
  const have = new Set(allGenerators(store.index).map((g) => g.id));
  const LYCEE = ['2nde', '1re', 'tle'];
  const en = PRIMARY.includes(level) ? ['en-p-vocabulaire'] : level === '6e' ? ['en-p-vocabulaire', 'en-vocabulaire'] : LYCEE.includes(level) && have.has('en-l-vocabulary') ? ['en-l-vocabulary'] : ['en-vocabulaire'];
  const out = [{ id: 'fr', label: `Français · devinettes (${TIER[frTier(level)]})`, lang: 'fr-FR' }];
  if (en.every((id) => have.has(id))) out.push({ id: 'en', label: 'Anglais · vocabulaire de la classe', lang: 'en-GB', sources: en, prefix: 'En anglais' });
  if (!PRIMARY.includes(level) && level !== '6e' && have.has('es-vocabulario')) out.push({ id: 'es', label: 'Espagnol · vocabulaire', lang: 'es-ES', sources: ['es-vocabulario'], prefix: 'En espagnol' });
  return out;
}

async function entriesOf(theme, level) {
  if (theme.id === 'fr') return frEntries(level);
  const lists = await Promise.all(theme.sources.map((id) => loadData(id).then((d) => {
    // libellés des thèmes (« Le numérique » plutôt que « numerique »), d'après les options du générateur
    const opt = (d.options || []).find((o) => o.id === 'theme');
    const names = new Map(((opt && opt.values) || []).map((v) => [v.id, v.label]));
    return ((d.data || {}).pairs || []).map((p) => ({ ...p, themeLabel: names.get(p.theme) || p.theme }));
  }).catch(() => [])));
  return lists.flat().map((p) => ({ word: vocabAnswer(p.a), clue: `${theme.prefix} : ${p.q}`, lang: theme.lang, extra: p.themeLabel ? `Thème : ${p.themeLabel.charAt(0).toLowerCase()}${p.themeLabel.slice(1)}` : '' }));
}

/* ------------------------------ Mise en place ------------------------------ */

function setupScreen(stage, { onStart, prefill = {} }) {
  const levels = gameLevels();
  const state = { level: levels.includes(prefill.level) ? prefill.level : nearestLevel(store.profile.level), theme: prefill.theme || 'fr', count: prefill.count || 5, players: prefill.players || 1, guest: prefill.guest || 'Invité' };
  const err = h('p', { class: 'warn', 'aria-live': 'assertive' });
  const draw = () => {
    const themes = motThemes(state.level);
    if (!themes.some((t) => t.id === state.theme)) state.theme = 'fr';
    const sel = (label, value, options, onchange) => h('label', { class: 'field' }, h('span', { class: 'field-label' }, label),
      h('select', { class: 'field-input', onchange: (e) => onchange(e.target.value) }, options.map(([v, l]) => h('option', { value: v, selected: String(v) === String(value) }, l))));
    stage.replaceChildren(h('section', { class: 'card mot-setup' },
      h('div', { class: 'quest-setup-head' }, h('span', { class: 'mem-setup-art', 'aria-hidden': 'true' }, '🔤'),
        h('div', {}, h('h2', {}, 'Mot mystère'),
          h('p', {}, 'Lis l’indice et retrouve le mot, lettre après lettre. Chaque lettre qui n’est pas dans le mot éteint une couleur de l’arc-en-ciel : tu en as sept. Les accents viennent tout seuls : « E » dévoile aussi é, è et ê. À deux, chacun son mot, à tour de rôle : un point par mot trouvé.'))),
      h('div', { class: 'series-grid' },
        sel('Classe', state.level, levels.map((l) => [l, levelLabel(l)]), (v) => { state.level = v; draw(); }),
        sel('Mots', state.theme, themes.map((t) => [t.id, t.label]), (v) => { state.theme = v; }),
        sel('Longueur', state.count, state.players === 2 ? [[6, '6 mots (3 chacun)'], [8, '8 mots (4 chacun)']] : [[5, '5 mots'], [8, '8 mots']], (v) => { state.count = Number(v); }),
        sel('Joueurs', state.players, [[1, `Seul (${store.profile.pseudo})`], [2, 'À deux, sur le même appareil']], (v) => { state.players = Number(v); state.count = state.players === 2 ? (state.count === 5 ? 6 : state.count) : (state.count === 6 ? 5 : state.count); draw(); }),
        state.players === 2 ? h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Nom du deuxième joueur'),
          h('input', { class: 'field-input', value: state.guest, maxlength: 20, oninput: (e) => { state.guest = e.target.value || 'Invité'; } })) : null),
      err,
      h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn btn--primary', onclick: go }, '🔤 Commencer'))));
  };
  async function go() {
    err.textContent = '';
    const theme = motThemes(state.level).find((t) => t.id === state.theme);
    const words = pickWords(await entriesOf(theme, state.level), state.count);
    if (words.length < Math.min(3, state.count)) { err.textContent = 'Pas assez de mots pour ce choix : choisis-en un autre.'; return; }
    onStart({ ...state, themeLabel: theme.label, words });
  }
  draw();
}

/* ------------------------------ Série ------------------------------ */

function play(stage, setup, { onAgain, onNew }) {
  const names = setup.players === 2 ? [store.profile.pseudo, setup.guest || 'Invité'] : [store.profile.pseudo];
  const duo = names.length > 1;
  const turnOf = (i) => names[i % names.length];
  const results = [];
  let index = 0;
  let w = null;
  const head = h('div', { class: 'series-head quest-head' });
  const rays = h('div', { class: 'mot-rays', role: 'img' });
  const clue = h('p', { class: 'mot-clue' });
  const extra = h('p', { class: 'small muted mot-extra' });
  const board = h('p', { class: 'mot-word', 'aria-live': 'polite' });
  const status = h('p', { class: 'mot-status', 'aria-live': 'polite' });
  const keys = h('div', { class: 'mot-keys', role: 'group', 'aria-label': 'Lettres' });
  const tools = h('div', { class: 'btn-row mot-tools' });
  const card = h('section', { class: 'card mot-card' }, rays, clue, extra, board, status, keys, tools);

  const paintHead = () => head.replaceChildren(
    h('div', {}, h('p', { class: 'eyebrow' }, `Mot mystère · ${levelLabel(setup.level)}`), h('h2', {}, setup.themeLabel)),
    h('div', { class: 'btn-row' }, ...(duo ? names.map((n, i) => h('span', { class: `mem-player ${i === index % names.length ? 'is-turn' : ''}` }, h('b', {}, n), ` · ${results.filter((r) => r.player === i && r.found).length}`)) : []),
      h('span', { class: 'eclair-progress' }, `Mot ${Math.min(index + 1, setup.words.length)}/${setup.words.length}`),
      h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => { detach(); onNew(); } }, 'Arrêter')));

  const paint = () => {
    rays.setAttribute('aria-label', `${w.rays} couleur${w.rays > 1 ? 's' : ''} sur ${RAYS}`);
    rays.replaceChildren(...RAINBOW.map((c, i) => h('span', { class: `mot-ray ${i < w.rays ? '' : 'is-off'}`, style: { background: c } })));
    const mask = maskOf(w);
    board.setAttribute('aria-label', mask.map((m) => (m.letter ? (m.shown ? m.ch : 'blanc') : m.ch === ' ' ? 'espace' : m.ch)).join(' '));
    board.replaceChildren(...mask.map((m) => (m.letter
      ? h('span', { class: `mot-letter ${m.shown ? 'is-shown' : ''} ${isLost(w) && !w.guessed.includes(m.letter) ? 'is-missed' : ''}`, 'aria-hidden': 'true' }, m.shown ? m.ch : '')
      : h('span', { class: m.ch === ' ' ? 'mot-space' : 'mot-sep', 'aria-hidden': 'true' }, m.ch === ' ' ? '' : m.ch))));
    const over = isFinished(w);
    keys.replaceChildren(...ALPHABET.map((l) => h('button', {
      type: 'button', class: `mot-key ${w.guessed.includes(l) ? 'is-hit' : ''} ${w.wrong.includes(l) ? 'is-miss' : ''}`, dataset: { letter: l },
      disabled: over || w.guessed.includes(l) || w.wrong.includes(l), onclick: () => press(l),
    }, l)));
    tools.replaceChildren(...[
      speechAvailable() ? h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => speak(w.word, { lang: w.lang, rate: 0.85 }) }, '🔊 Écouter le mot') : null,
      !over ? h('button', { type: 'button', class: 'btn btn--ghost btn--small mot-reveal', disabled: w.rays <= 1, onclick: reveal }, '💡 Révéler une lettre (−1 couleur)') : null,
      over ? h('button', { type: 'button', class: 'btn btn--primary mot-next', onclick: next }, index + 1 < setup.words.length ? 'Mot suivant →' : 'Voir le résultat') : null].filter(Boolean));
  };

  const finishWord = () => {
    results.push({ word: w.word, clue: w.clue, found: isSolved(w), misses: w.wrong.length + w.revealed, player: index % names.length });
    status.textContent = isSolved(w) ? `Bravo${duo ? `, ${turnOf(index)}` : ''} : « ${w.word} » !` : `Le mot était « ${w.word} ». ${duo ? 'Pas de point pour ce mot.' : 'Tu le retrouveras la prochaine fois !'}`;
    paintHead();
    status.className = `mot-status ${isSolved(w) ? 'is-ok' : 'is-miss'}`;
    if (isSolved(w)) burstStars(board, 3);
    paint();
    const btn = tools.querySelector('.mot-next'); if (btn) btn.focus({ preventScroll: true });
  };
  function press(l) {
    if (!w || isFinished(w)) return;
    const r = guess(w, l);
    if (r === 'ignore' || r === 'repeat') return;
    status.className = 'mot-status';
    status.textContent = r === 'hit' ? `Oui, il y a un « ${l} ».` : `Pas de « ${l} » : une couleur s’éteint.`;
    if (isFinished(w)) { finishWord(); return; }
    paint();
  }
  function reveal() {
    const l = revealOne(w);
    if (!l) return;
    status.className = 'mot-status';
    status.textContent = `Lettre révélée : « ${l} ».`;
    if (isFinished(w)) { finishWord(); return; }
    paint();
  }
  function next() {
    index++;
    if (index >= setup.words.length) { end(); return; }
    start();
  }
  function start() {
    w = newWord(setup.words[index]);
    clue.textContent = w.clue;
    extra.textContent = w.extra || '';
    status.textContent = duo ? `${turnOf(index)}, à toi !` : ''; status.className = 'mot-status';
    paintHead(); paint();
    const k = keys.querySelector('.mot-key'); if (k) k.focus({ preventScroll: true });
  }
  const onKey = (ev) => {
    if (!card.isConnected) { detach(); return; }
    if (ev.ctrlKey || ev.metaKey || ev.altKey || /^(INPUT|SELECT|TEXTAREA)$/.test((ev.target && ev.target.tagName) || '')) return;
    if (/^[a-zA-Z]$/.test(ev.key)) { ev.preventDefault(); press(ev.key.toUpperCase()); }
    else if (ev.key === 'Enter' && w && isFinished(w) && !(ev.target && ev.target.tagName === 'BUTTON')) { ev.preventDefault(); next(); }
  };
  const detach = () => document.removeEventListener('keydown', onKey);
  document.addEventListener('keydown', onKey);

  async function end() {
    detach();
    const before = gameProgress();
    await recordGameEvent('mot', dayKey(store.now())).catch(() => {});
    const after = gameProgress();
    const gained = before && after ? after.totalXp - before.totalXp : 0;
    const found = results.filter((r) => r.found).length;
    const stars = seriesStars(results);
    const scores = names.map((n, i) => ({ name: n, found: results.filter((r) => r.player === i && r.found).length, misses: results.filter((r) => r.player === i).reduce((a, r) => a + r.misses, 0) }));
    const best = Math.max(...scores.map((x) => x.found));
    let winners = scores.filter((x) => x.found === best);
    if (winners.length > 1) { const fewest = Math.min(...winners.map((x) => x.misses)); winners = winners.filter((x) => x.misses === fewest); }
    stage.replaceChildren(h('section', { class: 'card mem-end mot-end enter-fwd' },
      h('div', { class: 'jeu-turn-head' }, photon(found ? 'bravo' : 'attentif', 64),
        h('div', {}, h('p', { class: 'eyebrow' }, 'Série terminée'),
          h('h2', { tabindex: '-1' }, duo ? (winners.length > 1 ? 'Égalité !' : `${winners[0].name} gagne !`) : `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)} · ${found}/${results.length} mot${results.length > 1 ? 's' : ''} trouvé${found > 1 ? 's' : ''}`))),
      duo ? h('p', {}, `${scores.map((x) => `${x.name} : ${x.found} mot${x.found > 1 ? 's' : ''} trouvé${x.found > 1 ? 's' : ''} (${x.misses} erreur${x.misses > 1 ? 's' : ''})`).join(' · ')}${winners.length === 1 && scores.filter((x) => x.found === best).length > 1 ? ' — à égalité de mots, le moins d’erreurs l’emporte.' : ''}`) : null,
      duo ? null : h('p', {}, stars === 3 ? 'Un vrai détective des mots !' : found === results.length ? 'Tous trouvés ! La prochaine fois, essaie avec moins d’erreurs.' : 'Bien joué ! Relis les mots ci-dessous : ils reviendront.'),
      gained > 0 ? h('p', { class: 'chest-points' }, `+${gained} points`) : h('p', { class: 'small muted' }, 'Les points du mot mystère se gagnent une fois par jour : reviens demain !'),
      h('details', { class: 'mem-recap', open: true }, h('summary', {}, 'Les mots de la série'),
        h('ul', {}, results.map((r) => h('li', {}, h('span', { 'aria-hidden': 'true' }, r.found ? '✓ ' : '✗ '), h('strong', {}, r.word), ` · ${r.clue}${duo ? ` (${names[r.player]})` : ''}`)))),
      h('div', { class: 'btn-row' },
        h('button', { type: 'button', class: 'btn btn--primary', onclick: () => onAgain() }, 'Rejouer avec d’autres mots'),
        h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => onNew() }, 'Changer de mots'),
        h('a', { class: 'btn btn--ghost', href: '#/memoire' }, '🃏 Jeu de mémoire'))));
    if (duo || stars === 3) setTimeout(() => confetti(stage.firstChild, 60), 150);
    announce(duo ? `${winners.map((x) => x.name).join(' et ')} ${winners.length > 1 ? 'sont à égalité' : 'gagne'}.` : `Série terminée : ${found} mots trouvés sur ${results.length}.`);
    const t = stage.querySelector('h2'); if (t) t.focus({ preventScroll: true });
  }

  stage.replaceChildren(head, card);
  start();
}

export async function render(root, { params } = {}) {
  const stage = h('div', { class: 'quest-stage mot-stage' });
  root.append(h('div', { class: 'page-head' },
    h('div', {}, h('p', { class: 'eyebrow' }, 'Jeux'), h('h1', {}, 'Mot mystère'),
      h('p', { class: 'muted' }, 'Une devinette ou une traduction, et un mot à retrouver lettre à lettre avant que l’arc-en-ciel ne s’éteigne.')),
    h('a', { class: 'btn', href: '#/jeu' }, h('span', { 'aria-hidden': 'true' }, '🎲 '), 'Jeu de plateau')), stage);
  let last = null;
  const toSetup = (prefill) => setupScreen(stage, { onStart: start, prefill });
  function start(setup) { last = setup; window.scrollTo({ top: 0 }); play(stage, setup, { onAgain: again, onNew: () => toSetup(last) }); }
  async function again() {
    const theme = motThemes(last.level).find((t) => t.id === last.theme);
    const words = pickWords(await entriesOf(theme, last.level), last.count);
    if (words.length >= Math.min(3, last.count)) start({ ...last, words }); else toSetup(last);
  }
  toSetup({ level: (params && params.get('classe')) || undefined, theme: (params && params.get('mots')) || undefined });
}
