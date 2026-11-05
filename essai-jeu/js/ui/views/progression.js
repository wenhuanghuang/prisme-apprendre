/**
 * Ma progression : niveau et titre de lumière, objectif du jour, série et jokers, ma semaine,
 * garde-robe de Photon (récompenses débloquées par niveau), trophées d'assiduité, et la règle des points
 * expliquée en clair (les parents savent ce qui est récompensé).
 */
import { h } from '../dom.js';
import { store, subscribe, gameProgress, setDailyGoal, equipPhoton } from '../../app/store.js';
import { XP, TRACK_MULT, GOALS, MAX_JOKERS, JOKER_EVERY } from '../../engine/game.js';
import { ACCESSORIES, TINTS } from '../../engine/game-rewards.js';
import { photon } from '../photon.js';
import { goalRing, streakLabel } from '../game/hud.js';
import { albumSection } from '../game/rewards-ui.js';
import { recordsSection } from '../game/mini-games.js';

function hero(g) {
  return h('section', { class: 'prog-hero card' },
    h('div', { class: 'prog-photon' }, photon('joie', 132)),
    h('div', { class: 'prog-hero-text' },
      h('p', { class: 'eyebrow' }, `Niveau ${g.level}`),
      h('h2', { class: 'prog-title' }, g.title),
      h('div', { class: 'prog-bar', role: 'progressbar', 'aria-valuemin': String(g.levelFloor), 'aria-valuemax': String(g.levelCeil), 'aria-valuenow': String(g.totalXp), 'aria-label': `Points vers le niveau ${g.level + 1}` },
        h('i', { style: { width: `${Math.round(g.progress * 100)}%` } })),
      h('p', { class: 'prog-next' }, h('strong', {}, `${g.totalXp} points`), ` · encore ${g.xpToNext} pour devenir ${g.nextTitle} (niveau ${g.level + 1})`)));
}

function goalCard(g) {
  const ratio = g.todayXp / g.goal;
  return h('section', { class: 'card prog-goal' },
    h('h2', {}, 'Objectif du jour'),
    h('div', { class: 'prog-goal-ring' }, goalRing(ratio, 112, 12), h('div', {}, h('b', {}, String(g.todayXp)), h('small', {}, `sur ${g.goal} points`))),
    h('p', { class: 'small' }, g.goalReached ? '🎯 Objectif atteint aujourd’hui. Bravo !' : `Encore ${g.goal - g.todayXp} points aujourd’hui.`),
    h('fieldset', { class: 'prog-goal-choice' }, h('legend', {}, 'Mon rythme'),
      GOALS.map((o) => h('label', { class: `goal-opt ${o.xp === g.nextGoal ? 'is-on' : ''}` },
        h('input', { type: 'radio', name: 'goal', value: String(o.xp), 'data-k': `goal-${o.xp}`, checked: o.xp === g.nextGoal, onchange: () => setDailyGoal(o.xp).catch(() => {}) }),
        h('strong', {}, o.label), h('span', {}, `${o.xp} points`), h('small', {}, o.hint))),
      g.nextGoal !== g.goal ? h('p', { class: 'small muted' }, `Ton nouvel objectif (${g.nextGoal} points) commence demain : un objectif plus bas ne compte pas pour la journée en cours.`) : null));
}

function streakCard(g) {
  return h('section', { class: `card prog-streak ${g.streak ? '' : 'is-off'}` },
    h('h2', {}, 'Ma série'),
    h('p', { class: 'prog-flame' }, h('span', { 'aria-hidden': 'true' }, '🔥'), h('b', {}, streakLabel(g.streak))),
    h('p', { class: 'small' }, g.atRisk ? 'Atteins ton objectif aujourd’hui pour garder ta série !' : g.streak ? 'Objectif atteint chaque jour : continue demain !' : 'Atteins ton objectif du jour pour lancer une série.'),
    h('p', { class: 'small muted' }, `Record : ${streakLabel(g.bestStreak)}`),
    h('div', { class: 'prog-jokers' }, h('span', { class: 'sr-only' }, `${g.jokers} joker${g.jokers > 1 ? 's' : ''} sur ${MAX_JOKERS}.`),
      ...Array.from({ length: MAX_JOKERS }, (_, i) => h('span', { class: `joker ${i < g.jokers ? 'is-on' : ''}`, 'aria-hidden': 'true' }, '❄️')),
      h('small', {}, `Un joker ❄️ protège ta série si tu manques un jour. Tu en gagnes un tous les ${JOKER_EVERY} jours d’objectif atteint (${MAX_JOKERS} au plus).`)));
}

function weekCard(g) {
  const top = Math.max(g.goal, ...g.week.map((d) => d.xp), 1);
  return h('section', { class: 'card prog-week' },
    h('h2', {}, 'Ma semaine'),
    h('div', { class: 'week-bars', role: 'list' }, g.week.map((d) => h('div', {
      class: `week-day ${d.reached ? 'is-reached' : ''} ${d.today ? 'is-today' : ''}`, role: 'listitem',
      'aria-label': `${d.label} : ${d.xp} points${d.reached ? ', objectif atteint' : ''}${d.protected ? ', série protégée par un joker' : ''}`,
    },
    h('div', { class: 'week-col' }, h('i', { class: 'week-goal', style: { bottom: `${(d.goal / top) * 100}%` } }), h('span', { class: 'week-fill', style: { height: `${(d.xp / top) * 100}%` } })),
    h('small', {}, d.protected ? '❄️' : d.reached ? '✓' : String(d.xp)), h('span', { class: 'week-label' }, d.label)))));
}

function wardrobe(g) {
  const accessory = (a) => {
    const locked = !g.unlocked.accessories.includes(a.id);
    const on = g.equipped.accessory === a.id;
    return h('button', { type: 'button', class: `ward-item ${on ? 'is-on' : ''}`, 'data-k': `acc-${a.id}`, disabled: locked, 'aria-pressed': String(on), onclick: () => equipPhoton({ accessory: on ? null : a.id }).catch(() => {}) },
      photon('joie', 56, { accessory: a.id, tint: g.equipped.tint }), h('span', {}, a.label), h('small', {}, locked ? `🔒 niveau ${a.level}` : on ? 'porté' : 'essayer'));
  };
  const tint = (t) => {
    const locked = !g.unlocked.tints.includes(t.id);
    const on = g.equipped.tint === t.id;
    return h('button', { type: 'button', class: `ward-tint ${on ? 'is-on' : ''}`, 'data-k': `tint-${t.id}`, disabled: locked, 'aria-pressed': String(on), onclick: () => equipPhoton({ tint: t.id }).catch(() => {}), title: locked ? `Niveau ${t.level}` : t.label },
      h('span', { class: 'tint-dot', style: { background: `radial-gradient(circle at 35% 30%, ${t.stops[0]}, ${t.stops[1]} 55%, ${t.stops[2]})` } }), h('small', {}, locked ? `🔒 ${t.level}` : t.label));
  };
  return h('section', { class: 'card prog-wardrobe', id: 'garde-robe' },
    h('h2', {}, 'La garde-robe de Photon'),
    h('p', { class: 'small muted' }, 'Chaque niveau débloque un accessoire ou une teinte. Photon les porte partout dans l’application.'),
    h('div', { class: 'ward-grid' }, ACCESSORIES.map(accessory)),
    h('div', { class: 'ward-tints' }, TINTS.map(tint)));
}

function trophies(g) {
  const earned = g.trophies.filter((t) => t.earned).length;
  return h('section', { class: 'card prog-trophies' },
    h('h2', {}, `Mes trophées · ${earned}/${g.trophies.length}`),
    h('p', { class: 'small muted' }, 'Les trophées récompensent la régularité. Les badges de ton carnet, eux, attestent ce que tu sais faire.'),
    h('div', { class: 'trophy-grid' }, g.trophies.map((t) => h('div', { class: `trophy ${t.earned ? 'is-earned' : ''}` },
      h('span', { class: 'trophy-icon', 'aria-hidden': 'true' }, t.icon),
      h('div', {}, h('strong', {}, t.label), h('small', {}, t.attests),
        t.earned ? h('small', { class: 'trophy-done' }, '✓ obtenu') : [h('div', { class: 'progress-mini', 'aria-hidden': 'true' }, h('i', { style: { width: `${(t.value / t.goal) * 100}%` } })), h('small', {}, `${t.value}/${t.goal}`)])))));
}

function rules() {
  const row = (what, pts) => h('tr', {}, h('td', {}, what), h('td', {}, pts));
  return h('details', { class: 'card prog-rules' },
    h('summary', {}, 'Comment gagner des points ?'),
    h('table', { class: 'skill-table' }, h('tbody', {},
      row('Exercice réussi du premier coup, sans indice', `${XP.correct} points`),
      row('Exercice réussi avec un indice ou au 2e essai', `${XP.helped} points`),
      row('Niveau ◆ approfondissement / ✦ expert', `× ${TRACK_MULT.approfondissement} / × ${TRACK_MULT.expert}`),
      row('Mission ou problème en plusieurs questions, réussi', `+ ${XP.multiPart} points`),
      row('Révision réussie plusieurs jours après', `+ ${XP.review} points`),
      row('Réponse rédigée validée par un adulte', `${XP.humanValidated} points`),
      row('Leçon terminée, au moins 7 exercices sur 10 faits (une fois par leçon)', `${XP.lesson} points`),
      row('Expérience regardée jusqu’au bout (une fois)', `${XP.experience} points`),
      row('Bilan d’unité réussi dans un parcours (une couronne, une fois)', `${XP.bilan} points`),
      row('Défi de quête relevé : un coffre et une vignette (une fois par coffre)', `${XP.defi} points`),
      row('Quête terminée avec au moins la moitié des étoiles : le grand coffre et une vignette rare', `${XP.quete} points`),
      row('Partie du jeu de plateau jouée jusqu’au bout, au moins 3 bonnes réponses', `${XP.plateau} points`),
      row('Victoire au jeu de plateau (au moins 3 bonnes réponses) : une vignette rare', `+ ${XP.victoire} points`),
      row('Chapitre de la quête de l’année terminé (une médaille, une fois par chapitre)', `${XP.chapitre} points`),
      row('Période de l’année terminée dans une matière : un coffre rare', `${XP.periode} points`),
      row('Année entière terminée dans une matière', `${XP.annee} points`),
      row('Énigme du jour résolue (une par jour)', `${XP.enigme} points`),
      row('Gardien d’une période apprivoisé (une fois par période et par matière) : un coffre rare', `${XP.gardien} points`),
      row('Défi de la famille réussi (le but commun de la semaine, une fois par semaine) : un coffre rare', `${XP.famille} points`),
      row('Partie de jeu de mémoire terminée (une fois par jour)', `${XP.memoire} points`),
      row('Partie de frise chronologique terminée (une fois par jour)', `${XP.frise} points`),
      row('Série de calcul éclair terminée (une fois par jour)', `${XP.eclair} points`),
      row('Série de mots mystère terminée (une fois par jour)', `${XP.mot} points`),
      row('Lecture chronométrée à voix haute (une fois par jour)', `${XP.fluence} points`),
      row('Partie d’ordre de grandeur terminée (une fois par jour)', `${XP.estime} points`),
      row('Passeport des jeux : quatre petits jeux différents dans la semaine (une fois par semaine) : un coffre rare', `${XP.passeport} points`),
      row('Bonus : jouer au « jeu du jour » mis en avant sur la page Aujourd’hui', `+ ${XP.jeudujour} points`),
      row('Essai manqué ou correction affichée', `${XP.effort} point`))),
    h('p', { class: 'small muted' }, 'Refaire le même exercice le même jour rapporte de moins en moins : on progresse en variant. Les points ne remplacent pas la maîtrise des notions, suivie dans le carnet.'));
}

export function render(root, { params }) {
  const paint = () => {
    const g = gameProgress();
    if (!g) return;
    // le choix d'un objectif ou d'un accessoire redessine la page : on garde le focus sur le même bouton
    const focusKey = document.activeElement && root.contains(document.activeElement) ? document.activeElement.getAttribute('data-k') : null;
    const rulesOpen = Boolean(root.querySelector('.prog-rules[open]')); // un choix ne doit pas refermer la règle des points
    root.replaceChildren(
      h('div', { class: 'page-head' }, h('div', {}, h('p', { class: 'eyebrow' }, store.profile.pseudo), h('h1', { class: 'sr-only' }, 'Ma progression'))),
      hero(g),
      h('div', { class: 'prog-grid' }, goalCard(g), streakCard(g), weekCard(g)),
      wardrobe(g),
      albumSection(g),
      trophies(g),
      recordsSection(),
      rules());
    if (rulesOpen) root.querySelector('.prog-rules').open = true;
    const again = focusKey && root.querySelector(`[data-k="${focusKey}"]`);
    if (again) again.focus({ preventScroll: true });
  };
  paint();
  const voir = params && params.get('voir');
  if (voir === 'garde-robe' || voir === 'album' || voir === 'records') setTimeout(() => { const w = root.querySelector(`#${voir}`); if (w) w.scrollIntoView({ block: 'start' }); }, 50);
  return subscribe(() => { if (root.isConnected) paint(); });
}
