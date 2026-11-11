/**
 * Comptes sur l'appareil : chaque profil peut être protégé par un code secret, pour que chaque enfant ait son compte
 * et que personne n'ouvre celui d'un autre. Trois sortes de codes : une suite de 4 images (pour les petits lecteurs),
 * 4 chiffres, ou un mot de passe. Le code n'est jamais enregistré en clair : seule une empreinte (PBKDF2-SHA-256,
 * avec un sel propre à chaque profil) est gardée. Ce n'est pas un coffre-fort (les données restent lisibles par qui
 * a accès à l'ordinateur), mais une vraie séparation des comptes au quotidien.
 */

export const PICTOS = ['🐱', '🐶', '🦊', '🐸', '🐼', '🦁', '🐙', '🦉', '🐢'];
export const PICTO_NAMES = ['chat', 'chien', 'renard', 'grenouille', 'panda', 'lion', 'pieuvre', 'chouette', 'tortue'];
export const SECRET_KINDS = {
  images: { label: 'Code en images', help: 'Choisis 4 images, dans l’ordre (la même image peut revenir).' },
  pin: { label: 'Code à 4 chiffres', help: 'Choisis 4 chiffres faciles à retenir pour toi, difficiles à deviner pour les autres.' },
  motdepasse: { label: 'Mot de passe', help: 'Au moins 6 caractères.' },
};
export const ITERATIONS = 100000;
export const IMAGES_LENGTH = 4;

/** Le code tel qu'il est saisi, mis sous une forme unique ; null s'il n'est pas valable. */
export function normalizeSecret(kind, value) {
  if (kind === 'images') {
    const a = Array.isArray(value) ? value : String(value || '').split('-');
    const ok = a.length === IMAGES_LENGTH && a.every((x) => /^[0-8]$/.test(String(x)));
    return ok ? a.join('-') : null;
  }
  if (kind === 'pin') return /^\d{4}$/.test(String(value || '')) ? String(value) : null;
  if (kind === 'motdepasse') { const s = String(value || ''); return s.length >= 6 && s.length <= 64 ? s : null; }
  return null;
}

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function derive(text, salt, iterations) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(text), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations }, key, 256);
  return hex(bits);
}

/** Fabrique l'empreinte à enregistrer avec le profil : { kind, salt, iter, hash }. */
export async function makeSecret(kind, value) {
  const norm = normalizeSecret(kind, value);
  if (norm === null) throw new Error(kind === 'images' ? 'Choisis 4 images.' : kind === 'pin' ? 'Le code doit comporter 4 chiffres.' : 'Le mot de passe doit comporter au moins 6 caractères.');
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
  return { kind, salt, iter: ITERATIONS, hash: await derive(`${kind}:${norm}`, salt, ITERATIONS) };
}

/** Vérifie un code saisi. */
export async function checkSecret(secret, value) {
  if (!secret) return true;
  const norm = normalizeSecret(secret.kind, value);
  if (norm === null) return false;
  return (await derive(`${secret.kind}:${norm}`, secret.salt, secret.iter || ITERATIONS)) === secret.hash;
}

/** Une empreinte bien formée (pour la restauration d'une sauvegarde) ; null sinon. */
export function cleanSecret(s) {
  if (!s || typeof s !== 'object' || !SECRET_KINDS[s.kind]) return null;
  if (!/^[0-9a-f]{16,64}$/.test(String(s.salt)) || !/^[0-9a-f]{64}$/.test(String(s.hash))) return null;
  const iter = Number.isInteger(s.iter) && s.iter >= 10000 && s.iter <= 1000000 ? s.iter : ITERATIONS;
  return { kind: s.kind, salt: s.salt, iter, hash: s.hash };
}

/** Attente imposée après des erreurs : rien pour les 4 premières, puis 30 s, 60 s, 120 s… (au plus 10 min). */
export function lockDelay(failures) {
  if (failures < 5) return 0;
  return Math.min(600, 30 * 2 ** (failures - 5)) * 1000;
}

/** Verrouillage automatique d'un compte protégé après une période sans activité. */
export const AUTO_LOCK_MINUTES = 20;
