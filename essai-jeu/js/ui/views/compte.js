/**
 * Mon compte (#/compte) : qui est connecté, son code secret (le poser, le changer, le retirer), et se déconnecter
 * (indispensable quand plusieurs enfants partagent l'appareil).
 */
import { h, announce } from '../dom.js';
import { store, changeMySecret, logout, updateProfile } from '../../app/store.js';
import { makeSecret, SECRET_KINDS, AUTO_LOCK_MINUTES } from '../../engine/compte.js';
import { secretInput, secretChooser } from '../compte-ui.js';
import { LEVELS } from './welcome.js';

export function render(root) {
  const p = store.profile;
  const msg = h('p', { 'aria-live': 'polite', class: 'small' });
  const draw = () => {
    const prof = store.profile;
    const current = prof.secret ? secretInput(prof.secret.kind, { label: 'Ton code actuel' }) : null;
    const chooser = secretChooser({ allowNone: true, initial: prof.secret ? prof.secret.kind : 'images' });
    const levelSel = h('select', { class: 'field-input', style: { maxWidth: '160px' }, onchange: async (e) => { await updateProfile({ level: e.target.value }); msg.textContent = `Classe enregistrée : ${e.target.value}.`; } },
      LEVELS.map((l) => h('option', { value: l, selected: l === prof.level }, l)));
    root.replaceChildren(
      h('div', { class: 'page-head' }, h('div', {}, h('p', { class: 'eyebrow' }, 'Mon compte'), h('h1', {}, prof.pseudo),
        h('p', { class: 'muted' }, prof.secret ? `🔒 Ton compte est protégé par un ${SECRET_KINDS[prof.secret.kind].label.toLowerCase()}.` : '🔓 Ton compte n’a pas de code secret : n’importe qui sur cet appareil peut l’ouvrir.'))),
      h('section', { class: 'card compte-card' },
        h('div', { class: 'unlock-head' }, h('span', { class: 'avatar avatar--big', style: { background: prof.color } }, prof.symbol),
          h('div', {}, h('p', {}, h('strong', {}, prof.pseudo), ` · ${prof.level}`), h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Ma classe'), levelSel))),
        h('div', { class: 'btn-row' },
          h('button', { type: 'button', class: 'btn btn--primary compte-logout', onclick: () => { logout(); location.hash = '#/profils'; } }, prof.secret ? '🔒 Me déconnecter' : 'Changer de profil'),
          h('a', { class: 'btn btn--ghost', href: '#/progression' }, 'Ma progression')),
        prof.secret ? h('p', { class: 'small muted' }, `Pense à te déconnecter quand tu as fini. Sans activité pendant ${AUTO_LOCK_MINUTES} minutes, ton compte se verrouille tout seul.`) : null),
      h('section', { class: 'card compte-card' },
        h('h2', {}, prof.secret ? 'Changer mon code secret' : 'Protéger mon compte'),
        current ? h('div', {}, h('span', { class: 'field-label' }, 'D’abord, ton code actuel'), current.el) : null,
        h('span', { class: 'field-label' }, 'Ton nouveau code'), chooser.el,
        h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn btn--primary compte-save', onclick: async () => {
          const c = chooser.get();
          if (c.error) { msg.textContent = c.error; return; }
          const secret = c.kind ? await makeSecret(c.kind, c.value) : null;
          const ok = await changeMySecret(current ? current.getValue() : '', secret);
          if (!ok) { msg.textContent = 'Ton code actuel n’est pas le bon : rien n’a changé.'; current.reset(); return; }
          msg.textContent = secret ? 'Nouveau code enregistré. Retiens-le bien !' : 'Code retiré : ton compte n’est plus protégé.';
          announce(msg.textContent);
          draw();
        } }, 'Enregistrer')), msg),
      h('p', { class: 'small muted' }, 'Ton compte et ta progression restent sur cet appareil. Un adulte peut en faire une sauvegarde dans l’espace Parents, pour les retrouver sur un autre appareil.'));
  };
  if (!p) { location.hash = '#/profils'; return; }
  draw();
}
