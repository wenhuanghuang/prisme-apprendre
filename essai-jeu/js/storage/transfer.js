/**
 * Fichier de compte, pour passer d'un appareil à l'autre sans serveur ni nuage : le compte (sa sauvegarde) est
 * compressé puis chiffré (AES-GCM 256 bits) avec une clé tirée d'un code de transfert (PBKDF2-SHA-256, 200 000
 * tours). Le code, 12 caractères faciles à lire, est affiché une seule fois sur l'appareil de départ et n'est jamais
 * enregistré : sans lui, le fichier est illisible. On peut donc l'envoyer par courriel, clé USB ou messagerie.
 */

export const TRANSFER_FORMAT = 'prisme-compte';
export const TRANSFER_VERSION = 1;
export const TRANSFER_EXT = '.prisme';
const ITER = 200000;
// sans 0/O, 1/I/L, ni U/V : rien qui se confonde à la lecture
const ALPHABET = 'ABCDEFGHJKMNPQRSTWXYZ23456789';

/** Un code de transfert au hasard, en trois groupes de quatre : « K7PQ-4XMZ-9TRA » (environ 58 bits). */
export function newTransferCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const chars = [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join('');
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8)}`;
}

/** Code tapé par l'utilisateur, remis en forme (majuscules, sans espaces ni tirets), ou null s'il est incomplet. */
export function normalizeCode(code) {
  const c = String(code || '').toUpperCase().replace(/[\s-]+/g, '');
  return c.length === 12 && [...c].every((ch) => ALPHABET.includes(ch)) ? c : null;
}

const toB64 = (buf) => { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };
const fromB64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

async function pipe(bytes, Stream, kind) {
  const out = new Blob([bytes]).stream().pipeThrough(new Stream(kind));
  return new Uint8Array(await new Response(out).arrayBuffer());
}
const canZip = () => typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';

async function keyFrom(code, salt, usage, iterations = ITER) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(normalizeCode(code) || ''), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, [usage]);
}

/**
 * Emballe un compte : renvoie le contenu du fichier (objet JSON) à télécharger.
 * @param {object} backup sauvegarde d'un seul profil (buildBackup)
 * @param {string} code code de transfert
 * @param {{ pseudo?: string }} label ce qui reste lisible sans le code : le pseudo, pour reconnaître le fichier
 */
export async function packAccount(backup, code, { pseudo = '', now = new Date() } = {}) {
  let bytes = new TextEncoder().encode(JSON.stringify(backup));
  const zip = canZip();
  if (zip) bytes = await pipe(bytes, CompressionStream, 'gzip');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await keyFrom(code, salt, 'encrypt'), bytes);
  return { format: TRANSFER_FORMAT, version: TRANSFER_VERSION, pseudo: String(pseudo).slice(0, 24), exportedAt: now.toISOString(), kdf: { name: 'PBKDF2-SHA-256', iter: ITER, salt: toB64(salt) }, iv: toB64(iv), zip, data: toB64(data) };
}

/** Le fichier est-il un fichier de compte Prisme ? */
export const isAccountFile = (obj) => Boolean(obj && typeof obj === 'object' && obj.format === TRANSFER_FORMAT);

/**
 * Ouvre un fichier de compte avec son code. Renvoie { ok: true, backup } ou { ok: false, error }.
 */
export async function unpackAccount(obj, code) {
  if (!isAccountFile(obj)) return { ok: false, error: 'Ce fichier n’est pas un fichier de compte Prisme.' };
  if (typeof obj.version !== 'number' || obj.version > TRANSFER_VERSION) return { ok: false, error: 'Ce fichier vient d’une version plus récente de Prisme : mets d’abord Prisme à jour.' };
  if (!normalizeCode(code)) return { ok: false, error: 'Le code de transfert comporte 12 caractères (par exemple K7PQ-4XMZ-9TRA).' };
  let bytes;
  try {
    const salt = fromB64(obj.kdf.salt); const iv = fromB64(obj.iv);
    const iter = Number.isInteger(obj.kdf.iter) && obj.kdf.iter >= 100000 && obj.kdf.iter <= 2000000 ? obj.kdf.iter : ITER;
    bytes = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, await keyFrom(code, salt, 'decrypt', iter), fromB64(obj.data)));
  } catch {
    return { ok: false, error: 'Ce n’est pas le bon code de transfert (ou le fichier est abîmé).' };
  }
  try {
    if (obj.zip) {
      if (!canZip()) return { ok: false, error: 'Ce navigateur ne sait pas ouvrir ce fichier : essaie avec un navigateur plus récent.' };
      bytes = await pipe(bytes, DecompressionStream, 'gzip');
    }
    return { ok: true, backup: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return { ok: false, error: 'Le fichier est abîmé.' };
  }
}
