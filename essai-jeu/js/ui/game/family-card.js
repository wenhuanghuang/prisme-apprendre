/**
 * Carte « Défi de la famille » (page Aujourd'hui) : la barre commune de la semaine, une couleur par joueur, et le
 * coffre de la famille quand le but est atteint (chacun l'ouvre depuis son profil). Les profils fictifs de
 * démonstration ne comptent pas.
 */
import { h, announce } from '../dom.js';
import { store, profileData, recordGameEvent, gameProgress } from '../../app/store.js';
import { familyWeek, familyPep } from '../../engine/famille.js';
import { chestReveal, chestSvg, newVignettes } from './rewards-ui.js';

const FALLBACK = ['#3b4cca', '#c2410c', '#2a9d5c', '#7a4cc2', '#d9468f', '#0f7b7d', '#a16207', '#1d2433'];

/** Les joueurs de la famille : les profils réels de l'appareil, avec leurs tentatives. */
async function members() {
  const out = [];
  for (const p of store.profiles.filter((x) => !x.demo)) {
    const d = await profileData(p.id).catch(() => null);
    if (d) out.push({ profile: p, attempts: d.attempts });
  }
  return out;
}

/** Couleurs distinctes (deux profils de la même couleur : la seconde prend une couleur libre). */
function colorsOf(players) {
  const used = new Set();
  return players.map((p) => {
    let c = p.color && !used.has(p.color) ? p.color : FALLBACK.find((x) => !used.has(x)) || '#888';
    used.add(c);
    return c;
  });
}

export function familyBar(fw) {
  const colors = colorsOf(fw.players);
  const scale = Math.max(fw.goal, fw.total);
  return h('div', { class: 'family-bar', role: 'img', 'aria-label': `${fw.total} bonnes réponses sur ${fw.goal} cette semaine` },
    fw.players.filter((p) => p.count > 0).map((p) => h('span', { class: 'family-seg', title: `${p.pseudo} : ${p.count}`, style: { width: `${(100 * p.count) / scale}%`, background: colors[fw.players.indexOf(p)] } })),
    fw.total < fw.goal ? null : h('span', { class: 'family-goal-mark', 'aria-hidden': 'true' }, '🎁'));
}

export async function familyCard(slot) {
  const ms = await members();
  if (!ms.length || !store.profile) { slot.replaceChildren(); return; }
  const now = store.now();
  const fw = familyWeek(ms, now);
  const many = fw.players.length > 1;
  const colors = colorsOf(fw.players);
  const events = (store.states && store.states.game && store.states.game.events) || [];
  const opened = events.some((e) => e.type === 'famille' && e.id === fw.week);
  const open = h('button', { type: 'button', class: 'btn btn--primary btn--small' }, many ? 'Ouvrir le coffre de la famille' : 'Ouvrir le coffre de la semaine');
  const card = h('section', { class: `card side-card family-card ${fw.reached ? 'is-reached' : ''}`, 'aria-labelledby': 'family-title' },
    h('div', { class: 'family-head' }, h('span', { class: 'family-icon', 'aria-hidden': 'true' }, chestSvg({ rare: true, open: fw.reached && opened })),
      h('div', {}, h('h3', { id: 'family-title' }, many ? 'Défi de la famille' : 'Défi de la semaine'),
        h('p', { class: 'small muted' }, many ? 'Ensemble, cette semaine : chaque bonne réponse de chacun compte.' : 'Tes bonnes réponses de la semaine remplissent la barre.'))),
    familyBar(fw),
    h('p', { class: 'family-total' }, h('strong', {}, `${fw.total} / ${fw.goal}`), ' bonnes réponses'),
    many ? h('ul', { class: 'family-legend' }, fw.players.map((p, i) => h('li', { class: p.id === store.profile.id ? 'is-me' : '' },
      h('i', { style: { background: colors[i] }, 'aria-hidden': 'true' }), `${p.pseudo}${p.id === store.profile.id ? ' (toi)' : ''} : ${p.count}`))) : null,
    h('p', { class: 'small' }, fw.reached && opened ? '✅ Tu as ouvert le coffre de cette semaine. Un nouveau défi commence lundi !' : familyPep(fw)),
    fw.reached && !opened ? h('div', { class: 'btn-row' }, open) : null);
  open.addEventListener('click', async () => {
    open.disabled = true;
    const before = gameProgress();
    await recordGameEvent('famille', fw.week).catch(() => {});
    const after = gameProgress();
    const [vignette] = newVignettes(before, after);
    const gained = before && after ? after.totalXp - before.totalXp : 0;
    card.replaceChildren(chestReveal({ title: many ? 'Le coffre de la famille s’ouvre !' : 'Le coffre de la semaine s’ouvre !', points: gained > 0 ? gained : 0, vignette, rare: true, already: gained <= 0 }),
      h('p', { class: 'small muted' }, many ? 'Chacun peut ouvrir le coffre depuis son propre profil. Bravo à toute l’équipe !' : 'Bravo ! Un nouveau défi commence lundi.'));
    announce(`Coffre ouvert.${vignette ? ` Nouvelle vignette : ${vignette.label}.` : ''}`);
  });
  slot.replaceChildren(card);
}
