/**
 * Badges liés à de véritables compétences (pas à un simple total de points).
 * Chaque badge dit précisément ce qu'il atteste.
 */
import { masteryLevel } from './mastery.js';

export function summarizeAttempts(attempts) {
  const sum = { byType: {}, byRole: {}, byTrack: {}, validatedOpen: 0, persistence: 0, delayed: 0, total: attempts.length };
  for (const a of attempts) {
    const ok = a.credit >= 0.7 || a.humanValidated === true;
    for (const [key, val] of [['byType', a.type], ['byRole', a.role], ['byTrack', a.track || 'classe']]) {
      if (!val) continue;
      sum[key][val] = sum[key][val] || { n: 0, ok: 0 };
      sum[key][val].n += 1;
      if (ok) sum[key][val].ok += 1;
    }
    if (a.humanValidated === true) sum.validatedOpen += 1;
    if (a.verdict === 'correct' && (a.tries || 1) >= 3 && !a.solutionShown) sum.persistence += 1;
    if (a.delayed && a.credit >= 0.7) sum.delayed += 1;
  }
  return sum;
}

const ok = (sum, key, val) => (sum[key][val] ? sum[key][val].ok : 0);

export const BADGES = [
  { id: 'contre-exemples', icon: '⊥', label: 'Chasseur de contre-exemples', attests: 'Sait réfuter un énoncé général par un contre-exemple vérifié.', goal: 3, progress: (s) => ok(s, 'byType', 'counterexample') },
  { id: 'etapes', icon: '≡', label: 'Calcul pas à pas', attests: 'Résout des calculs et équations en montrant des étapes toutes justes.', goal: 5, progress: (s) => ok(s, 'byType', 'steps') },
  { id: 'demonstrateur', icon: '∴', label: 'Démonstrateur', attests: 'Rédactions ou démonstrations validées par un adulte.', goal: 3, progress: (s) => s.validatedOpen },
  { id: 'experimentateur', icon: '⚗', label: 'Expérimentateur', attests: 'Mène une expérience virtuelle jusqu’à l’analyse des mesures.', goal: 3, progress: (s) => ok(s, 'byRole', 'labo') },
  { id: 'debogueur', icon: '⌁', label: 'Débogueur', attests: 'Trouve et corrige des erreurs dans des programmes.', goal: 3, progress: (s) => ok(s, 'byRole', 'debug') },
  { id: 'memoire', icon: '◷', label: 'Mémoire longue', attests: 'Réussites plusieurs jours après la dernière pratique (révisions espacées).', goal: 5, progress: (s) => s.delayed },
  { id: 'perseverant', icon: '↻', label: 'Persévérant', attests: 'A trouvé seul après plusieurs essais, sans afficher la solution.', goal: 5, progress: (s) => s.persistence },
  { id: 'approfondissement', icon: '◆', label: 'Explorateur', attests: 'Réussites dans le parcours d’approfondissement (facultatif).', goal: 5, progress: (s) => ok(s, 'byTrack', 'approfondissement') },
  { id: 'expert', icon: '✦', label: 'Expert', attests: 'Réussites dans le parcours expert (facultatif, au-delà du programme).', goal: 3, progress: (s) => ok(s, 'byTrack', 'expert') },
];

/** Badges de compétence : une notion « consolidée » = maîtrisée ET réussie plusieurs jours plus tard. */
export function skillBadges(index, states, now) {
  return Object.entries(states)
    .filter(([id, st]) => index.skills.has(id) && masteryLevel(st, now) === 'consolide')
    .map(([id]) => ({ id: `skill:${id}`, label: index.skills.get(id).label, attests: 'Notion consolidée (réussie à nouveau après plusieurs jours).' }));
}

export function computeBadges(summary) {
  return BADGES.map((b) => {
    const p = b.progress(summary);
    return { ...b, value: Math.min(p, b.goal), earned: p >= b.goal };
  });
}
