/**
 * « La boutique » (#/boutique) : sers 8 clients. Touche les pièces et les billets du porte-monnaie pour les poser sur
 * le comptoir (touche-les sur le comptoir pour les reprendre), puis paie. À partir du CE2, certains clients paient avec
 * un billet : il faut leur rendre la monnaie. Le moins de pièces possible = « paiement malin ». Seul, ou à deux en
 * servant un client chacun son tour. Une journée rapporte des points une fois par jour.
 */
import { h, announce } from '../dom.js';
import { store, gameProgress } from '../../app/store.js';
import { BOUTIQUE_LEVELS, DENOMS, newDay, judge, feedback, changeHint, money, denomLabel, boutiqueStars } from '../../engine/boutique.js';
import { gameLevels, nearestLevel } from '../game/deck.js';
import { recordMiniGame } from '../game/mini-games.js';
import { photon } from '../photon.js';
import { burstStars, confetti } from '../lesson-play/celebrate.js';

const levelLabel = (id) => ((store.catalog && store.catalog.levels.find((l) => l.id === id)) || { label: id }).label;
const CUSTOMERS = 8;
const meta = (v) => DENOMS.find((d) => d.v === v);

/** Une pièce ou un billet, dessiné en CSS. */
function coin(v, attrs = {}) {
  const d = meta(v);
  return h('button', { type: 'button', ...attrs, class: `bq-money ${d.kind === 'billet' ? `bq-bill bq-bill--${v / 100}` : `bq-coin bq-coin--${d.metal}`} ${attrs.class || ''}`, dataset: { v: String(v), ...(attrs.dataset || {}) } },
    h('span', { 'aria-hidden': 'true' }, denomLabel(v)));
}

function setupScreen(stage, { onStart, prefill = {} }) {
  const levels = gameLevels().filter((l) => BOUTIQUE_LEVELS[l]);
  const near = nearestLevel(store.profile.level);
  const state = { level: levels.includes(prefill.level) ? prefill.level : levels.includes(near) ? near : levels[levels.length - 1], players: prefill.players || 1, guest: prefill.guest || 'Invité' };
  const draw = () => {
    const sel = (label, value, options, onchange) => h('label', { class: 'field' }, h('span', { class: 'field-label' }, label),
      h('select', { class: 'field-input', onchange: (e) => onchange(e.target.value) }, options.map(([v, l]) => h('option', { value: v, selected: String(v) === String(value) }, l))));
    stage.replaceChildren(h('section', { class: 'card bq-setup' },
      h('div', { class: 'quest-setup-head' }, h('span', { class: 'mem-setup-art', 'aria-hidden': 'true' }, '🏪'),
        h('div', {}, h('h2', {}, 'La boutique'),
          h('p', {}, 'Tu tiens la boutique ! Huit clients vont passer. Touche les pièces et les billets pour payer le prix exact. À partir du CE2, certains clients paient avec un billet : rends-leur la monnaie. Paie avec le moins de pièces possible pour un « paiement malin ».'))),
      h('div', { class: 'series-grid' },
        sel('Classe', state.level, levels.map((l) => [l, levelLabel(l)]), (v) => { state.level = v; }),
        sel('Joueurs', state.players, [[1, `Seul (${store.profile.pseudo})`], [2, 'À deux, un client chacun son tour']], (v) => { state.players = Number(v); draw(); }),
        state.players === 2 ? h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Nom du deuxième joueur'),
          h('input', { class: 'field-input', value: state.guest, maxlength: 20, oninput: (e) => { state.guest = e.target.value || 'Invité'; } })) : null),
      h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn btn--primary bq-start', onclick: () => onStart({ ...state }) }, '🏪 Ouvrir la boutique'))));
  };
  if (!levels.length) { stage.replaceChildren(h('p', { class: 'card' }, 'La boutique est ouverte du CP à la 6e.')); return; }
  draw();
}

function play(stage, setup, { onAgain, onNew }) {
  const names = setup.players === 2 ? [store.profile.pseudo, setup.guest || 'Invité'] : [store.profile.pseudo];
  const duo = names.length > 1;
  const cfg = BOUTIQUE_LEVELS[setup.level];
  const day = newDay(setup.level, CUSTOMERS);
  let i = 0; let tray = []; let tries = 0; let errors = 0; let smart = 0; let locked = false; let peek = false;
  const scores = names.map(() => 0);
  const misses = [];
  const head = h('div', { class: 'series-head quest-head' });
  const counter = h('div', { class: 'bq-counter' });
  const trayEl = h('div', { class: 'bq-tray', 'aria-label': 'Le comptoir' });
  const totalEl = h('p', { class: 'bq-total', 'aria-live': 'polite' });
  const purse = h('div', { class: 'bq-purse', role: 'group', 'aria-label': 'Le porte-monnaie' });
  const fb = h('div', { class: 'bq-feedback', 'aria-live': 'polite' });
  const actions = h('div', { class: 'btn-row bq-actions' });
  const player = () => (duo ? i % 2 : 0);

  const paintHead = () => head.replaceChildren(
    h('div', {}, h('p', { class: 'eyebrow' }, `La boutique · ${levelLabel(setup.level)}`), h('h2', {}, `Client ${Math.min(i + 1, day.length)}/${day.length}`)),
    h('div', { class: 'btn-row' }, ...(duo ? names.map((n, p) => h('span', { class: `mem-player ${p === player() ? 'is-turn' : ''}` }, h('b', {}, n), ` · ${scores[p]}`))
      : [h('span', { class: 'cmp-combo' }, `${scores[0]} client${scores[0] > 1 ? 's' : ''} servi${scores[0] > 1 ? 's' : ''}${smart ? ` · 🧠 ${smart}` : ''}`)]),
    h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => onNew() }, 'Fermer')));

  const paintTray = () => {
    const sum = tray.reduce((s, v) => s + v, 0);
    trayEl.replaceChildren(...(tray.length ? [...tray].sort((a, b) => b - a).map((v) => coin(v, { class: 'is-on-tray', 'aria-label': `Reprendre ${denomLabel(v)}`, onclick: () => { if (locked) return; tray.splice(tray.indexOf(v), 1); paintTray(); } }))
      : [h('span', { class: 'bq-tray-empty' }, 'Le comptoir est vide : touche les pièces et les billets du porte-monnaie.')]));
    totalEl.textContent = cfg.showTotal || peek ? `Sur le comptoir : ${money(sum)}` : `${tray.length} pièce${tray.length > 1 ? 's' : ''} ou billet${tray.length > 1 ? 's' : ''} sur le comptoir`;
  };

  const paint = () => {
    const c = day[i];
    tray = []; tries = 0; locked = false; peek = false;
    counter.replaceChildren(
      h('div', { class: 'bq-item' }, h('span', { class: 'bq-icon', 'aria-hidden': 'true' }, c.icon),
        h('div', {}, duo ? h('p', { class: 'eyebrow' }, `Au tour de ${names[player()]}`) : null,
          h('p', { class: 'bq-name' }, c.name.replace(/^./, (m) => m.toUpperCase())),
          h('p', { class: 'bq-price' }, h('span', { class: 'bq-tag' }, money(c.price))))),
      c.mode === 'rendre'
        ? h('div', { class: 'bq-given' }, h('p', {}, 'Le client te donne :'), h('div', { class: 'bq-given-money' }, c.given === 10000 ? h('span', { class: 'bq-money bq-bill bq-bill--100 is-given' }, '100 €') : coin(c.given, { disabled: true, tabindex: '-1', class: 'is-given' })),
          h('p', { class: 'bq-ask' }, h('strong', {}, 'Rends-lui la monnaie.')))
        : h('p', { class: 'bq-ask' }, h('strong', {}, 'Paie le prix exact.')));
    purse.replaceChildren(...cfg.denoms.map((v) => coin(v, { 'aria-label': `Poser ${denomLabel(v)}`, onclick: () => { if (locked) return; if (tray.length >= 30) return; tray.push(v); paintTray(); } })));
    fb.replaceChildren(); fb.className = 'bq-feedback';
    actions.replaceChildren(
      h('button', { type: 'button', class: 'btn btn--primary bq-pay', onclick: pay }, c.mode === 'rendre' ? '🤝 Rendre la monnaie' : '💶 Payer'),
      h('button', { type: 'button', class: 'btn btn--ghost bq-clear', onclick: () => { if (!locked) { tray = []; paintTray(); } } }, 'Tout reprendre'),
      !cfg.showTotal ? h('button', { type: 'button', class: 'btn btn--ghost bq-peek', onclick: () => { peek = true; paintTray(); } }, '🔍 Voir le total') : null);
    paintTray(); paintHead();
  };

  function next() {
    i++;
    if (i >= day.length) { end(); return; }
    paint();
  }

  function pay() {
    if (locked) return;
    const c = day[i];
    const v = judge(c, tray, setup.level);
    if (!tray.length) { fb.className = 'bq-feedback is-wrong'; fb.textContent = 'Pose d’abord des pièces ou des billets sur le comptoir.'; return; }
    tries++;
    if (v.exact) {
      locked = true;
      const pts = (tries === 1 ? 1 : 0) + (v.smart ? 1 : 0);
      scores[player()] += duo ? pts : (tries === 1 ? 1 : 0);
      if (v.smart) smart++;
      fb.className = 'bq-feedback is-right';
      fb.replaceChildren(h('p', { class: 'bq-feedback-title' }, `${v.smart ? '🧠 ' : ''}Merci ! ${c.icon}`), h('p', {}, feedback(c, v)),
        h('button', { type: 'button', class: 'btn btn--primary btn--small bq-next', onclick: next }, i + 1 >= day.length ? 'Fermer la boutique' : 'Client suivant ▶'));
      burstStars(trayEl, v.smart ? 3 : 1);
      announce(feedback(c, v));
      fb.querySelector('.bq-next').focus({ preventScroll: true });
      paintHead();
      return;
    }
    if (tries === 1) errors++;
    if (tries >= 3) {
      locked = true; misses.push(c);
      fb.className = 'bq-feedback is-wrong';
      fb.replaceChildren(h('p', { class: 'bq-feedback-title' }, 'Regarde comment faire :'),
        h('p', {}, `${c.mode === 'rendre' ? changeHint(c) + ' ' : ''}Par exemple : ${v.best.map(denomLabel).join(' + ')} = ${money(c.target)}.`),
        h('div', { class: 'bq-solution', 'aria-hidden': 'true' }, v.best.map((d) => coin(d, { disabled: true, tabindex: '-1' }))),
        h('button', { type: 'button', class: 'btn btn--primary btn--small bq-next', onclick: next }, i + 1 >= day.length ? 'Fermer la boutique' : 'Client suivant ▶'));
      fb.querySelector('.bq-next').focus({ preventScroll: true });
      return;
    }
    fb.className = 'bq-feedback is-wrong';
    fb.replaceChildren(...[h('p', {}, feedback(c, v)), c.mode === 'rendre' && tries === 2 ? h('p', { class: 'small' }, changeHint(c)) : null].filter(Boolean));
    if (!cfg.showTotal) { peek = true; paintTray(); }
  }

  async function end() {
    const before = gameProgress();
    const star = await recordMiniGame('boutique').catch(() => false);
    const after = gameProgress();
    const gained = before && after ? after.totalXp - before.totalXp : 0;
    const stars = boutiqueStars(errors);
    const top = Math.max(...scores);
    const win = scores.map((s, p) => (s === top ? p : -1)).filter((p) => p >= 0);
    stage.replaceChildren(h('section', { class: 'card mem-end bq-end enter-fwd' },
      h('div', { class: 'jeu-turn-head' }, photon('bravo', 64),
        h('div', {}, h('p', { class: 'eyebrow' }, 'La boutique ferme'),
          h('h2', { tabindex: '-1' }, duo ? (win.length > 1 ? 'Égalité !' : `${names[win[0]]} gagne !`) : `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)} · ${scores[0]}/${day.length} clients servis du premier coup`))),
      duo ? h('p', {}, names.map((n, p) => `${n} : ${scores[p]} point${scores[p] > 1 ? 's' : ''}`).join(' · '), h('br'), h('span', { class: 'small muted' }, 'Un point par client servi du premier coup, un de plus pour un paiement malin.'))
        : h('p', {}, smart ? `🧠 ${smart} paiement${smart > 1 ? 's' : ''} malin${smart > 1 ? 's' : ''} (le moins de pièces possible).` : 'Astuce : commence par le plus gros billet ou la plus grosse pièce possible, pour payer avec le moins de pièces.'),
      gained > 0 ? h('p', { class: 'chest-points' }, `+${gained} points${star ? ' · 🌟 bonus du jeu du jour' : ''}`) : h('p', { class: 'small muted' }, 'Les points de la boutique se gagnent une fois par jour.'),
      misses.length ? h('details', { class: 'mem-recap', open: true }, h('summary', {}, 'À retenir'), h('ul', {}, misses.map((c) => h('li', {}, `${c.icon} ${c.name} à ${money(c.price)}${c.mode === 'rendre' ? ` payé avec ${money(c.given)} : on rend ${money(c.target)}` : ''}.`)))) : null,
      h('div', { class: 'btn-row' },
        h('button', { type: 'button', class: 'btn btn--primary', onclick: () => onAgain() }, duo ? 'Revanche' : 'Rouvrir la boutique'),
        h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => onNew() }, 'Changer de réglages'))));
    if (duo || stars === 3) setTimeout(() => confetti(stage.firstChild, 60), 150);
    announce(duo ? `${win.map((p) => names[p]).join(' et ')} ${win.length > 1 ? 'sont à égalité' : 'gagne'}.` : `${scores[0]} clients servis du premier coup sur ${day.length}.`);
    const t = stage.querySelector('h2'); if (t) t.focus({ preventScroll: true });
  }

  stage.replaceChildren(head, h('section', { class: 'card bq-board' },
    counter,
    h('div', { class: 'bq-desk' }, h('p', { class: 'field-label' }, 'Le comptoir'), trayEl, totalEl),
    fb, actions,
    h('div', { class: 'bq-purse-wrap' }, h('p', { class: 'field-label' }, 'Ton porte-monnaie (touche pour poser)'), purse)));
  paint();
}

export async function render(root, { params } = {}) {
  const stage = h('div', { class: 'quest-stage bq-stage' });
  root.append(h('div', { class: 'page-head' },
    h('div', {}, h('p', { class: 'eyebrow' }, 'Jeux'), h('h1', {}, 'La boutique'),
      h('p', { class: 'muted' }, 'Payer juste et rendre la monnaie, avec de vraies pièces et de vrais billets en euros.')),
    h('a', { class: 'btn', href: '#/jeu' }, h('span', { 'aria-hidden': 'true' }, '🎲 '), 'Jeu de plateau')), stage);
  let last = null;
  const toSetup = (prefill) => setupScreen(stage, { onStart: start, prefill });
  function start(setup) { last = setup; window.scrollTo({ top: 0 }); play(stage, setup, { onAgain: () => start(last), onNew: () => toSetup(last) }); }
  toSetup({ level: (params && params.get('classe')) || undefined });
}
