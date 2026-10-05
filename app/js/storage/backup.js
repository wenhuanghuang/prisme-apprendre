/**
 * Sauvegarde et restauration : un fichier JSON lisible, avec une empreinte de contrôle
 * pour détecter un fichier abîmé. La restauration se fait profil par profil (elle n'écrase
 * jamais tous les profils d'un coup) ; un profil déjà présent peut être remplacé ou copié.
 */
import { hashString } from '../core/template.js';

export const BACKUP_FORMAT = 'prisme-sauvegarde';
export const BACKUP_VERSION = 1;

function checksum(payload) {
  return hashString(JSON.stringify(payload)).toString(16);
}

/** @param {Array<{profile, states, attempts, submissions}>} profiles */
export function buildBackup(profiles, now = new Date()) {
  const payload = { profiles };
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: now.toISOString(), checksum: checksum(payload), ...payload };
}

const PSEUDO_RE = /^[\p{L}\p{N} _'’-]{1,24}$/u;

/** Vérifie un fichier de sauvegarde ; renvoie { ok, errors, profiles }. */
export function validateBackup(obj) {
  const errors = [];
  if (!obj || typeof obj !== 'object') return { ok: false, errors: ['Fichier illisible.'], profiles: [] };
  if (obj.format !== BACKUP_FORMAT) errors.push("Ce fichier n'est pas une sauvegarde de Prisme.");
  if (typeof obj.version !== 'number' || obj.version > BACKUP_VERSION) errors.push('Version de sauvegarde inconnue (fichier créé par une version plus récente ?).');
  if (!Array.isArray(obj.profiles)) errors.push('Aucun profil dans le fichier.');
  if (errors.length) return { ok: false, errors, profiles: [] };
  if (obj.checksum && obj.checksum !== checksum({ profiles: obj.profiles })) errors.push("L'empreinte de contrôle ne correspond pas : le fichier a été modifié ou abîmé.");
  const profiles = [];
  for (const [i, p] of obj.profiles.entries()) {
    const prof = p && p.profile;
    if (!prof || typeof prof.id !== 'string' || !PSEUDO_RE.test(String(prof.pseudo || ''))) { errors.push(`Profil n°${i + 1} invalide.`); continue; }
    if (p.states && typeof p.states !== 'object') { errors.push(`Profil ${prof.pseudo} : états invalides.`); continue; }
    if (p.attempts && !Array.isArray(p.attempts)) { errors.push(`Profil ${prof.pseudo} : historique invalide.`); continue; }
    profiles.push({
      profile: { id: prof.id, pseudo: prof.pseudo, symbol: String(prof.symbol || '◆').slice(0, 2), color: /^#[0-9a-f]{6}$/i.test(prof.color || '') ? prof.color : '#3b4cca', level: String(prof.level || '5e'), createdAt: prof.createdAt || null, demo: Boolean(prof.demo) },
      states: p.states || { profileId: prof.id, skills: {}, lessons: {} },
      attempts: (p.attempts || []).filter((a) => a && typeof a === 'object' && typeof a.ts === 'number'),
      submissions: (p.submissions || []).filter((s) => s && typeof s === 'object' && typeof s.id === 'string'),
    });
  }
  return { ok: errors.length === 0, errors, profiles };
}
