/**
 * Éléments d'interface des comptes : saisir un code secret (4 images, 4 chiffres ou un mot de passe), choisir son
 * code à la création du compte, et l'écran de connexion d'un compte protégé.
 */
import { h, announce } from './dom.js';
import { PICTOS, PICTO_NAMES, SECRET_KINDS, IMAGES_LENGTH, normalizeSecret } from '../engine/compte.js';
import { unlockProfile } from '../app/store.js';

/**
 * Champ de saisie d'un code. getValue() renvoie la valeur brute ; onComplete est appelé quand le code est complet
 * (4 images ou 4 chiffres), pour valider sans bouton.
 */
export function secretInput(kind, { label = 'Code secret', onComplete = null, newCode = false } = {}) {
  if (kind === 'images') {
    let seq = [];
    const slots = h('div', { class: 'secret-slots', 'aria-live': 'polite' });
    const paint = () => {
      slots.replaceChildren(...Array.from({ length: IMAGES_LENGTH }, (_, i) => h('span', { class: `secret-slot ${seq[i] !== undefined ? 'is-filled' : ''}` },
        seq[i] !== undefined ? (newCode ? PICTOS[seq[i]] : '●') : '')));
      slots.setAttribute('aria-label', `${seq.length} image${seq.length > 1 ? 's' : ''} sur ${IMAGES_LENGTH}`);
    };
    const grid = h('div', { class: 'secret-grid', role: 'group', 'aria-label': label },
      PICTOS.map((p, i) => h('button', { type: 'button', class: 'secret-picto', dataset: { picto: String(i) }, 'aria-label': PICTO_NAMES[i], onclick: () => {
        if (seq.length >= IMAGES_LENGTH) return;
        seq.push(i); paint();
        if (seq.length === IMAGES_LENGTH && onComplete) onComplete();
      } }, p)));
    const clear = h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => { seq = []; paint(); } }, 'Effacer');
    paint();
    return { el: h('div', { class: 'secret-input' }, slots, grid, clear), getValue: () => seq.slice(), reset: () => { seq = []; paint(); }, focus: () => { const b = grid.querySelector('button'); if (b) b.focus({ preventScroll: true }); } };
  }
  const isPin = kind === 'pin';
  const input = h('input', { class: 'field-input secret-text', type: 'password', autocomplete: newCode ? 'new-password' : 'current-password', 'aria-label': label,
    ...(isPin ? { inputmode: 'numeric', maxlength: 4, pattern: '[0-9]*' } : { maxlength: 64 }) });
  if (isPin && onComplete) input.addEventListener('input', () => { input.value = input.value.replace(/\D/g, '').slice(0, 4); if (input.value.length === 4) onComplete(); });
  return { el: h('div', { class: 'secret-input' }, input), getValue: () => input.value, reset: () => { input.value = ''; }, focus: () => input.focus({ preventScroll: true }) };
}

/**
 * Choisir un code pour son compte : sans code, en images, 4 chiffres, ou mot de passe (avec confirmation).
 * get() renvoie { kind: null } (pas de code), { kind, value } ou { error }.
 */
export function secretChooser({ allowNone = true, initial = 'images' } = {}) {
  let kind = initial;
  const box = h('div', { class: 'secret-chooser' });
  let first = null; let second = null;
  const draw = () => {
    first = kind ? secretInput(kind, { label: 'Ton nouveau code', newCode: true }) : null;
    second = kind === 'pin' || kind === 'motdepasse' ? secretInput(kind, { label: 'Le même code, une deuxième fois', newCode: true }) : null;
    const opts = [...(allowNone ? [[null, 'Pas de code']] : []), ...Object.entries(SECRET_KINDS).map(([k, v]) => [k, v.label])];
    box.replaceChildren(...[
      h('div', { class: 'picker secret-kinds', role: 'group', 'aria-label': 'Sorte de code' }, opts.map(([k, l]) => h('button', { type: 'button', 'aria-pressed': k === kind ? 'true' : 'false', dataset: { kind: k || 'aucun' }, onclick: () => { kind = k; draw(); } }, l))),
      kind ? h('p', { class: 'small muted' }, SECRET_KINDS[kind].help, kind === 'images' ? ' Retiens bien leur ordre !' : '') : h('p', { class: 'small muted' }, 'N’importe qui sur cet appareil pourra ouvrir ce compte.'),
      first ? first.el : null,
      second ? h('div', {}, h('span', { class: 'field-label' }, 'Encore une fois, pour vérifier'), second.el) : null].filter(Boolean));
  };
  draw();
  return {
    el: box,
    get() {
      if (!kind) return { kind: null };
      const v = first.getValue();
      if (normalizeSecret(kind, v) === null) return { error: kind === 'images' ? `Choisis ${IMAGES_LENGTH} images.` : kind === 'pin' ? 'Le code doit comporter 4 chiffres.' : 'Le mot de passe doit comporter au moins 6 caractères.' };
      if (second && second.getValue() !== v) return { error: 'Les deux codes ne sont pas identiques.' };
      return { kind, value: v };
    },
  };
}

/** Écran de connexion d'un compte protégé. */
export function unlockPanel(profile, { onDone, onCancel }) {
  const msg = h('p', { class: 'warn', 'aria-live': 'assertive' });
  let busy = false;
  const field = secretInput(profile.secret.kind, { label: `Code secret de ${profile.pseudo}`, onComplete: () => submit() });
  async function submit() {
    if (busy) return;
    busy = true; msg.textContent = '';
    const r = await unlockProfile(profile.id, field.getValue());
    busy = false;
    if (r.ok) { announce(`Bonjour ${profile.pseudo} !`); onDone(); return; }
    field.reset();
    msg.textContent = r.wait ? `Trop d’erreurs : attends ${Math.ceil(r.wait / 1000)} secondes avant de réessayer.` : 'Ce n’est pas le bon code. Réessaie !';
    field.focus();
  }
  const panel = h('section', { class: 'card unlock-panel' },
    h('div', { class: 'unlock-head' }, h('span', { class: 'avatar avatar--big', style: { background: profile.color } }, profile.symbol),
      h('div', {}, h('h2', {}, `Bonjour ${profile.pseudo} !`), h('p', { class: 'small muted' }, profile.secret.kind === 'images' ? 'Touche tes 4 images secrètes, dans l’ordre.' : profile.secret.kind === 'pin' ? 'Tape ton code à 4 chiffres.' : 'Tape ton mot de passe.'))),
    field.el, msg,
    h('div', { class: 'btn-row' },
      profile.secret.kind === 'motdepasse' ? h('button', { type: 'button', class: 'btn btn--primary', onclick: submit }, 'Me connecter') : null,
      h('button', { type: 'button', class: 'btn btn--ghost', onclick: onCancel }, 'Ce n’est pas moi')),
    h('details', { class: 'small' }, h('summary', {}, 'J’ai oublié mon code'),
      h('p', {}, 'Demande à un adulte : dans l’espace Parents, rubrique « Comptes », il peut effacer ton code. Tu en choisiras ensuite un nouveau dans « Mon compte ».')));
  if (profile.secret.kind === 'motdepasse') panel.querySelector('input').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
  setTimeout(() => field.focus(), 0);
  return panel;
}
