/**
 * Récompenses de la progression ludique : titres des niveaux (le thème de la lumière, comme Photon),
 * accessoires et teintes de Photon débloqués par niveau, trophées d'assiduité.
 * Les trophées récompensent la régularité et l'effort ; les badges du carnet (badges.js) attestent des compétences.
 */

export const TITLES = ['Étincelle', 'Lueur', 'Luciole', 'Lanterne', 'Rayon', 'Phare', 'Éclat', 'Prisme', 'Arc-en-ciel', 'Aurore', 'Comète', 'Étoile', 'Constellation', 'Nébuleuse', 'Galaxie'];

export function titleFor(level) {
  return TITLES[Math.max(0, Math.min(TITLES.length, level) - 1)];
}

/** Accessoires de Photon : `level` = niveau qui le débloque. */
export const ACCESSORIES = [
  { id: 'lunettes', label: 'Lunettes de savant', icon: '👓', level: 2 },
  { id: 'noeud', label: 'Nœud papillon', icon: '🎀', level: 3 },
  { id: 'casquette', label: 'Casquette', icon: '🧢', level: 4 },
  { id: 'echarpe', label: 'Écharpe', icon: '🧣', level: 5 },
  { id: 'chapeau', label: 'Chapeau d’explorateur', icon: '🤠', level: 7 },
  { id: 'couronne', label: 'Couronne de lumière', icon: '👑', level: 9 },
  { id: 'aureole', label: 'Auréole d’étoiles', icon: '✨', level: 12 },
  { id: 'cape', label: 'Cape de galaxie', icon: '🌌', level: 15 },
];

/** Teintes de Photon (dégradé du centre vers le bord). */
export const TINTS = [
  { id: 'soleil', label: 'Soleil', level: 1, stops: ['#fff7d6', '#ffcf4d', '#f08a24'] },
  { id: 'menthe', label: 'Menthe', level: 6, stops: ['#e9fff6', '#5fd3a5', '#138a6a'] },
  { id: 'lavande', label: 'Lavande', level: 8, stops: ['#f3edff', '#b49cff', '#6c4cc2'] },
  { id: 'corail', label: 'Corail', level: 10, stops: ['#fff0ec', '#ff9b85', '#d9483b'] },
  { id: 'nuit', label: 'Nuit étoilée', level: 13, stops: ['#e8f0ff', '#7aa2ff', '#2b3f9e'] },
];

export const unlockedAt = (level) => ({
  accessories: ACCESSORIES.filter((a) => a.level <= level).map((a) => a.id),
  tints: TINTS.filter((t) => t.level <= level).map((t) => t.id),
});

/** Ce qui se débloque exactement à un niveau donné (pour la fête du passage de niveau). */
export const unlocksOf = (level) => [...ACCESSORIES, ...TINTS].filter((x) => x.level === level);

/** Trophées d'assiduité : `value(c)` lit les compteurs calculés par computeGame. */
export const TROPHIES = [
  { id: 'premier-pas', icon: '👣', label: 'Premier pas', attests: 'Un premier exercice réussi.', goal: 1, value: (c) => c.correct },
  { id: 'objectif-1', icon: '🎯', label: 'Dans le mille', attests: 'Objectif du jour atteint une première fois.', goal: 1, value: (c) => c.goalDays },
  { id: 'serie-3', icon: '🔥', label: 'Trois jours de suite', attests: 'Objectif atteint trois jours d’affilée.', goal: 3, value: (c) => c.bestStreak },
  { id: 'serie-7', icon: '🔥', label: 'Une semaine entière', attests: 'Objectif atteint sept jours d’affilée.', goal: 7, value: (c) => c.bestStreak },
  { id: 'serie-30', icon: '🌋', label: 'Un mois de lumière', attests: 'Objectif atteint trente jours d’affilée.', goal: 30, value: (c) => c.bestStreak },
  { id: 'objectif-10', icon: '📅', label: 'Régulier', attests: 'Objectif du jour atteint dix jours (pas forcément de suite).', goal: 10, value: (c) => c.goalDays },
  { id: 'lecon-1', icon: '📘', label: 'Première leçon', attests: 'Une leçon terminée, en faisant au moins 7 exercices sur 10.', goal: 1, value: (c) => c.lessons },
  { id: 'lecon-10', icon: '📚', label: 'Dix leçons', attests: 'Dix leçons terminées.', goal: 10, value: (c) => c.lessons },
  { id: 'lecon-25', icon: '🏛️', label: 'Bibliothèque', attests: 'Vingt-cinq leçons terminées.', goal: 25, value: (c) => c.lessons },
  { id: 'couronne-1', icon: '👑', label: 'Première couronne', attests: 'Un bilan d’unité réussi dans un parcours.', goal: 1, value: (c) => c.crowns || 0 },
  { id: 'couronne-10', icon: '🏰', label: 'Dix couronnes', attests: 'Dix bilans d’unité réussis.', goal: 10, value: (c) => c.crowns || 0 },
  { id: 'experience-5', icon: '🧪', label: 'Œil de scientifique', attests: 'Cinq expériences regardées jusqu’au bout.', goal: 5, value: (c) => c.experiences },
  { id: 'sans-faute', icon: '🎖️', label: 'Sans faute', attests: 'Dix exercices de suite réussis du premier coup, sans indice.', goal: 10, value: (c) => c.bestPerfectRun },
  { id: 'revisions', icon: '🔁', label: 'Bonne mémoire', attests: 'Dix révisions réussies plusieurs jours après.', goal: 10, value: (c) => c.reviews },
  { id: 'niveau-5', icon: '🌟', label: 'Rayon', attests: 'Niveau 5 atteint.', goal: 5, value: (c) => c.level },
  { id: 'niveau-10', icon: '🌅', label: 'Aurore', attests: 'Niveau 10 atteint.', goal: 10, value: (c) => c.level },
];

export function computeTrophies(counters) {
  return TROPHIES.map((t) => {
    const v = Math.max(0, Number(t.value(counters)) || 0);
    return { id: t.id, icon: t.icon, label: t.label, attests: t.attests, goal: t.goal, value: Math.min(v, t.goal), earned: v >= t.goal };
  });
}
