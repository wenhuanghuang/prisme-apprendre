/**
 * Sauvegarde et restauration : un fichier JSON lisible, avec une empreinte de contrôle
 * pour détecter un fichier abîmé. La restauration se fait profil par profil (elle n'écrase
 * jamais tous les profils d'un coup) ; un profil déjà présent peut être remplacé ou copié.
 */
import { hashString } from '../core/template.js';
import { normalizeStates } from '../engine/mastery.js';

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
    const LEVELS = ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6e', '5e', '4e', '3e', '2nde', '1re', 'Tle'];
    profiles.push({
      profile: { id: String(prof.id).slice(0, 64), pseudo: prof.pseudo, symbol: String(prof.symbol || '◆').slice(0, 2), color: /^#[0-9a-f]{6}$/i.test(prof.color || '') ? prof.color : '#3b4cca', level: LEVELS.includes(prof.level) ? prof.level : '5e', createdAt: Number.isFinite(prof.createdAt) ? prof.createdAt : null, demo: Boolean(prof.demo) },
      // chaque état est reconstruit champ par champ : un fichier abîmé ne peut pas casser l'application
      states: normalizeStates(p.states, prof.id),
      attempts: (p.attempts || []).filter((a) => a && typeof a === 'object' && Number.isFinite(a.ts) && typeof a.skill === 'string')
        .map((a) => ({ ...a, credit: Number.isFinite(a.credit) ? a.credit : 0, score: Number.isFinite(a.score) ? a.score : 0 })),
      submissions: (p.submissions || []).filter((s) => s && typeof s === 'object' && typeof s.id === 'string' && Array.isArray(s.versions) && s.versions.length && typeof s.skill === 'string')
        .map((s) => ({ ...s, prompt: String(s.prompt || ''), status: ['en-attente', 'valide', 'a-retravailler'].includes(s.status) ? s.status : 'en-attente', comment: String(s.comment || '') })),
    });
  }
  return { ok: errors.length === 0, errors, profiles };
}
