/**
 * Éléments d'interface des comptes : saisir un code secret (4 images, 4 chiffres ou un mot de passe), choisir son
 * code à la création du compte, et l'écran de connexion d'un compte protégé.
 */
import { h, announce } from './dom.js';
import { PICTOS, PICTO_NAMES, SECRET_KINDS, IMAGES_LENGTH, normalizeSecret } from '../engine/compte.js';
import { store, unlockProfile, exportAccount, importAccount } from '../app/store.js';
import { TRANSFER_EXT, isAccountFile } from '../storage/transfer.js';

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

/* ------------------------------ Passer d'un appareil à l'autre ------------------------------ */

function downloadJson(name, obj) {
  const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
  const a = h('a', { href: URL.createObjectURL(blob), download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
const slug = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'compte';

/** Emporter son compte : télécharge le fichier chiffré et affiche (une seule fois) son code de transfert. */
export function sendPanel(profile) {
  const out = h('div', { class: 'transfer-out', 'aria-live': 'polite' });
  const btn = h('button', { type: 'button', class: 'btn btn--primary transfer-send', onclick: async () => {
    btn.disabled = true; out.textContent = 'Je prépare ton fichier…';
    try {
      const { file, code } = await exportAccount(profile.id);
      downloadJson(`prisme-compte-${slug(profile.pseudo)}-${new Date().toISOString().slice(0, 10)}${TRANSFER_EXT}`, file);
      out.replaceChildren(
        h('p', {}, 'Ton fichier est téléchargé. Voici son code de transfert :'),
        h('p', { class: 'transfer-code', 'aria-label': `Code de transfert : ${code.split('').join(' ')}` }, code),
        h('p', { class: 'small' }, 'Note-le bien : il ne s’affichera plus. Envoie le fichier sur l’autre appareil (courriel, clé USB, messagerie…), puis là-bas, ouvre Prisme : « J’ai déjà un compte sur un autre appareil » (ou « Mon compte » → « Récupérer »), choisis le fichier et tape ce code.'),
        h('p', { class: 'small muted' }, 'Sans ce code, personne ne peut ouvrir le fichier.'));
      announce('Fichier téléchargé. Note le code de transfert affiché.');
    } catch (e) { out.textContent = `Impossible de préparer le fichier : ${e.message}`; }
    btn.disabled = false;
  } }, '📤 Emporter mon compte');
  return h('div', { class: 'transfer-block' }, h('div', { class: 'btn-row' }, btn), out);
}

/**
 * Recevoir un compte : un fichier .prisme et son code. Avec onlyId, seulement ce compte-là (pour le mettre à jour).
 * onDone(result) est appelé après un import réussi.
 */
export function receivePanel({ onlyId = null, onDone = () => {}, label = '📥 Recevoir' } = {}) {
  const msg = h('p', { class: 'transfer-msg', 'aria-live': 'assertive' });
  let obj = null;
  const fileInput = h('input', { type: 'file', class: 'transfer-file', accept: `${TRANSFER_EXT},application/json,.json`, onchange: async (e) => {
    obj = null; msg.textContent = '';
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try { obj = JSON.parse(await f.text()); } catch { msg.textContent = 'Ce fichier est illisible.'; return; }
    if (!isAccountFile(obj)) {
      msg.textContent = obj && obj.format === 'prisme-sauvegarde' ? 'C’est une sauvegarde complète : un adulte peut la restaurer dans l’espace Parents.' : 'Ce n’est pas un fichier de compte Prisme.';
      obj = null; return;
    }
    msg.textContent = obj.pseudo ? `Compte de ${obj.pseudo}. Tape maintenant son code de transfert.` : 'Tape maintenant le code de transfert.';
    codeInput.focus();
  } });
  const codeInput = h('input', { class: 'field-input transfer-codein', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', maxlength: 20, placeholder: 'XXXX-XXXX-XXXX', 'aria-label': 'Code de transfert',
    onkeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } } });
  let busy = false;
  async function go() {
    if (busy) return;
    if (!obj) { msg.textContent = 'Choisis d’abord le fichier de ton compte.'; return; }
    busy = true; msg.textContent = 'J’ouvre le fichier…';
    const r = await importAccount(obj, codeInput.value, { onlyId });
    busy = false;
    if (!r.ok) { msg.textContent = r.error; return; }
    const what = r.merged
      ? `C’est fait, ${r.pseudo} ! Depuis l’autre appareil : ${r.added.attempts} exercice${r.added.attempts > 1 ? 's' : ''} et ${r.added.events} réussite${r.added.events > 1 ? 's' : ''} du jeu en plus. Rien n’a été perdu.`
      : `Bienvenue, ${r.pseudo} : ton compte est maintenant aussi sur cet appareil.`;
    msg.textContent = what; announce(what);
    onDone(r);
  }
  return h('div', { class: 'transfer-block transfer-in' },
    h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Le fichier de ton compte (.prisme)'), fileInput),
    h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Son code de transfert'), codeInput),
    h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn btn--primary transfer-receive', onclick: go }, label)), msg);
}

/** Tout ce qui sert à passer d'un appareil à l'autre, pour la page « Mon compte ». */
export function devicesSection(profile, { onChange = () => {} } = {}) {
  return h('section', { class: 'card compte-card compte-devices' },
    h('h2', {}, 'Mes autres appareils'),
    h('p', {}, 'Tu travailles sur deux appareils (une tablette à la maison, un ordinateur chez un grand-parent…) ? Emporte ton compte de l’un à l’autre : ce que tu as fait des deux côtés est réuni, rien n’est perdu. Pas besoin de compte en ligne : le fichier est chiffré et ne s’ouvre qu’avec son code.'),
    h('h3', {}, 'Emporter mon compte'), sendPanel(profile),
    h('h3', {}, 'Récupérer ce que j’ai fait sur un autre appareil'),
    receivePanel({ onlyId: profile.id, label: '📥 Récupérer', onDone: onChange }));
}
