/**
 * Écrire au primaire : deux briques de la production d'écrits que l'on peut corriger automatiquement —
 * construire une phrase (remettre les mots dans l'ordre : majuscule au début, point à la fin) et organiser un récit
 * (remettre dans l'ordre les étapes d'une petite histoire : situation initiale, problème, péripéties, solution, fin).
 */
import { pick } from './gen-util.js';

const order = (prompt, steps, label, hint, solution) => ({
  type: 'order', prompt, orderLabel: label, errorType: 'notion', representation: 'verbale', expectedSeconds: 60,
  items: steps.map((s, i) => ({ id: `s${i + 1}`, label: s })), hints: [hint], solution: solution || steps.join(' '),
});

// phrases à l'ordre naturel unique (pas de complément déplaçable)
const PHRASES_CP = ['Le chat boit du lait.', 'Ma sœur lit un livre.', 'Le bébé dort.', 'Papa coupe le pain.', 'Les oiseaux chantent.', 'Tom mange une pomme.', 'La maîtresse ouvre la porte.', 'Le chien court vite.'];
const PHRASES_CE = ['Le petit garçon regarde les étoiles.', 'Ma grand-mère prépare une tarte aux pommes.', 'Les enfants construisent une cabane en bois.', 'Le renard roux guette une poule.',
  'Notre voisin répare son vieux vélo.', 'La fusée décolle vers la Lune.', 'Le boulanger sort les croissants du four.', 'Mon frère cherche ses chaussures.'];
const RECITS = [
  ['Il était une fois un petit lapin qui vivait au bord de la forêt.', 'Un matin, il découvrit que sa réserve de carottes avait disparu.', 'Il chercha partout et demanda de l’aide à ses amis.', 'Le hérisson remarqua des traces qui menaient au terrier du blaireau.', 'Le blaireau rendit les carottes et tous partagèrent un grand repas.'],
  ['Léa adorait jouer au ballon dans le jardin.', 'Un jour, son ballon passa par-dessus la haie du voisin.', 'Elle sonna, mais personne ne répondit.', 'Le soir, le voisin rapporta le ballon avec un grand sourire.', 'Depuis, ils jouent souvent ensemble.'],
  ['Le roi vivait heureux dans son château.', 'Mais un dragon s’installa dans la montagne et effraya tout le royaume.', 'Plusieurs chevaliers tentèrent de le chasser, sans succès.', 'Une jeune bergère eut l’idée d’offrir au dragon une montagne de gâteaux.', 'Le dragon, rassasié et ravi, devint l’ami du royaume.'],
];
const ETAPES = ['situation initiale', 'élément perturbateur', 'péripéties', 'élément de résolution', 'situation finale'];

export const PRIMAIRE_ECRIRE = [
  {
    id: 'fr-p-phrase-ordre', subject: 'francais', levels: ['cp', 'ce1', 'ce2'], label: 'Construire une phrase : remettre les mots dans l’ordre', skill: 'fp.construire-phrase',
    chapters: ['cp-f-ecrire', 'ce1-f-ecrire', 'ce2-f-ecrire', 'cp-f-copie', 'ce1-f-copie', 'ce2-f-cursive-copie'], tracks: ['classe', 'approfondissement'],
    options: [{ id: 'niveau', label: 'Classe', values: [{ id: 'cp', label: 'CP' }, { id: 'ce1', label: 'CE1' }, { id: 'ce2', label: 'CE2' }] }],
    description: 'Les mots d’une phrase sont mélangés : la remettre dans l’ordre, avec la majuscule au début et le point à la fin.',
    make(rand, o = {}, tier = 'classe') {
      const lv = String(o.niveau || '').toLowerCase();
      const s = pick(rand, lv === 'cp' && tier === 'classe' ? PHRASES_CP : PHRASES_CE);
      return order('Range les mots pour écrire une phrase correcte.', s.split(' '), 'du premier au dernier mot', 'Le mot avec une majuscule commence la phrase ; celui avec le point la termine. Cherche qui fait l’action, puis l’action.', s);
    },
  },
  {
    id: 'fr-p-recit-ordre', subject: 'francais', levels: ['ce2', 'cm1', 'cm2'], facts: true, label: 'Organiser un récit : les étapes d’une histoire', skill: 'fp.schema-narratif',
    chapters: ['ce2-f-ecrire', 'cm1-f-produire', 'cm2-f-produire', 'cm1-f-merveilleux'], tracks: ['classe', 'approfondissement'], options: [],
    description: 'Remettre dans l’ordre les cinq étapes d’une petite histoire (schéma narratif).',
    make(rand) {
      const r = pick(rand, RECITS);
      return order('Range les phrases pour reconstituer l’histoire.', r, 'du début à la fin de l’histoire', 'Une histoire commence par la situation de départ, puis un problème arrive, on cherche à le résoudre… et elle se termine bien (ou mal) !',
        r.map((x, i) => `${i + 1}. ${x} (${ETAPES[i]})`).join(' '));
    },
  },
];
export const PRIMAIRE_ECRIRE_SKILLS = [
  { subject: 'francais', id: 'fp.construire-phrase', label: 'Construire une phrase correcte', level: 'cp' },
  { subject: 'francais', id: 'fp.schema-narratif', label: 'Organiser un récit selon le schéma narratif', level: 'ce2' },
].map((s) => ({ ...s, track: 'classe', status: 'programme', domain: 'primaire', prereqs: [], editorialLevel: true }));
