/** Accueil : choisir ou créer un profil (pseudo uniquement), ou charger les élèves fictifs de démonstration. */
import { h } from '../dom.js';
import { store, createProfile, selectProfile, loadDemoProfiles } from '../../app/store.js';

export const LEVELS = ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6e', '5e', '4e', '3e', '2nde', '1re', 'Tle'];
const SYMBOLS = ['◆', '★', '⚡', '●', '▲', '✦', '☄', '◎', '✳', '♞', '☀', '❄'];
const COLORS = ['#3b4cca', '#0f7b7d', '#7a4cc2', '#c2410c', '#a16207', '#2a9d5c', '#d9468f', '#1d2433'];

function prismHero() {
  const wrap = h('div', { 'aria-hidden': 'true' });
  wrap.innerHTML = `<svg class="prism-hero" viewBox="0 0 400 220">
    <defs><linearGradient id="beam" x1="0" x2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".1"/><stop offset="1" stop-color="currentColor" stop-opacity=".9"/></linearGradient></defs>
    <line x1="0" y1="128" x2="150" y2="118" stroke="url(#beam)" stroke-width="5"/>
    <path d="M200 20 L290 190 H110 Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
    <path d="M200 20 L290 190 H110 Z" fill="currentColor" opacity=".04"/>
    ${[['#3b4cca', 70], ['#0f7b7d', 102], ['#7a4cc2', 134], ['#a16207', 166], ['#c2410c', 198]].map(([c, y]) => `<line x1="246" y1="118" x2="400" y2="${y}" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`).join('')}
    <text x="404" y="74" font-size="11" text-anchor="end" fill="#3b4cca">maths</text>
  </svg>`;
  return wrap;
}

export function render(root) {
  let level = '5e'; let symbol = SYMBOLS[0]; let color = COLORS[0];
  const err = h('p', { class: 'warn', 'aria-live': 'assertive' });
  const pseudo = h('input', { id: 'pseudo', class: 'field-input', maxlength: 24, autocomplete: 'off', placeholder: 'ex. Comète, Kepler, Pixel…' });

  const pick = (items, current, onPick, render) => {
    const grp = h('div', { class: 'picker', role: 'group' });
    const draw = (cur) => {
      grp.replaceChildren(...items.map((it) => h('button', {
        type: 'button', 'aria-pressed': it === cur ? 'true' : 'false', 'aria-label': render.label(it),
        style: render.style ? render.style(it) : null, onclick: () => { onPick(it); draw(it); },
      }, render.text(it))));
    };
    draw(current);
    return grp;
  };
  const levels = h('div', { class: 'levels', role: 'group', 'aria-label': 'Classe' });
  const drawLevels = () => levels.replaceChildren(...LEVELS.map((lv) => h('button', { type: 'button', 'aria-pressed': lv === level ? 'true' : 'false', onclick: () => { level = lv; drawLevels(); } }, lv)));
  drawLevels();

  const form = h('form', { class: 'card', onsubmit: async (e) => {
    e.preventDefault();
    err.textContent = '';
    try {
      await createProfile({ pseudo: pseudo.value, symbol, color, level });
      location.hash = '#/';
    } catch (ex) { err.textContent = ex.message; pseudo.focus(); }
  } },
  h('h2', {}, 'Nouveau profil'),
  h('div', { class: 'field' }, h('label', { class: 'field-label', for: 'pseudo' }, 'Ton pseudo'), pseudo,
    h('span', { class: 'muted small' }, 'Pas ton vrai nom : un pseudo suffit. Aucune adresse, école, photo ou date de naissance n’est demandée.')),
  h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Ton symbole'), pick(SYMBOLS, symbol, (v) => { symbol = v; }, { text: (v) => v, label: (v) => `Symbole ${v}` })),
  h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Ta couleur'), pick(COLORS, color, (v) => { color = v; }, { text: () => '', label: (v) => `Couleur ${v}`, style: (v) => ({ background: v }) })),
  h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Ta classe en 2026-2027'), levels),
  err,
  h('button', { class: 'btn btn--primary', type: 'submit' }, 'Créer mon profil →'));

  const existing = store.profiles.filter((p) => !p.demo);
  const demos = store.profiles.filter((p) => p.demo);
  const list = (profiles) => h('div', { class: 'profile-list' }, profiles.map((p) => h('button', {
    type: 'button', class: 'profile-btn', onclick: async () => { await selectProfile(p.id); location.hash = '#/'; },
  }, h('span', { class: 'avatar', style: { background: p.color } }, p.symbol), h('span', {}, h('strong', {}, p.pseudo), h('br'), h('span', { class: 'muted small' }, p.level)), p.demo ? h('span', { class: 'chip chip--track-expert tag' }, 'fictif') : null)));

  root.append(h('div', { class: 'welcome' },
    h('section', {},
      h('p', { class: 'eyebrow' }, 'Du CP à la Terminale'),
      h('h1', {}, 'Apprendre en ', h('em', {}, 'manipulant'), ', pas en cochant.'),
      h('p', { class: 'lede' }, 'Des laboratoires, des calculs vérifiés étape par étape, des problèmes à plusieurs méthodes, et un guide qui repère précisément ce qui coince — pour proposer le bon exercice au bon moment, en expliquant pourquoi.'),
      prismHero(),
      h('div', { class: 'privacy' }, h('span', { 'aria-hidden': 'true' }, '🔒'), h('span', {}, store.persistent
        ? 'Tout reste sur cet ordinateur : aucun compte, aucun envoi de données. Chaque enfant peut avoir son profil ; les parents peuvent exporter, restaurer ou effacer les données.'
        : 'Attention : le stockage local est bloqué par ce navigateur (navigation privée ?). Rien ne sera conservé après fermeture.'))),
    h('section', {},
      existing.length ? h('div', { class: 'card', style: { marginBottom: '16px' } }, h('h2', {}, 'Qui travaille aujourd’hui ?'), list(existing)) : null,
      form,
      h('div', { class: 'card', style: { marginTop: '16px' } },
        h('h3', {}, 'Découvrir avec des élèves fictifs'),
        h('p', { class: 'muted small' }, 'Cinq profils fictifs dont l’historique est simulé par le vrai moteur : idéal pour voir le diagnostic et le tableau de bord parent.'),
        demos.length ? list(demos) : null,
        h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: async (e) => { e.target.disabled = true; await loadDemoProfiles(); root.replaceChildren(); render(root); } }, demos.length ? 'Recharger les profils fictifs' : 'Charger les profils fictifs')))));
}
