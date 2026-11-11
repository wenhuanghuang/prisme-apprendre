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
  { id: 'defi-1', icon: '🗝️', label: 'Premier coffre', attests: 'Un défi de quête relevé : son coffre est ouvert.', goal: 1, value: (c) => c.defis || 0 },
  { id: 'defi-10', icon: '💎', label: 'Chasseur de trésors', attests: 'Dix défis de quête relevés.', goal: 10, value: (c) => c.defis || 0 },
  { id: 'quete-1', icon: '🗺️', label: 'Première quête', attests: 'Une quête terminée avec au moins la moitié des étoiles.', goal: 1, value: (c) => c.quetes || 0 },
  { id: 'quete-5', icon: '🧭', label: 'Grand explorateur', attests: 'Cinq quêtes réussies.', goal: 5, value: (c) => c.quetes || 0 },
  { id: 'plateau-1', icon: '🎲', label: 'Premier au Prisme', attests: 'Une partie du jeu de plateau gagnée (en répondant juste au moins trois fois).', goal: 1, value: (c) => c.victoires || 0 },
  { id: 'chapitre-5', icon: '🥇', label: 'Cinq chapitres', attests: 'Cinq chapitres terminés dans la quête de l’année.', goal: 5, value: (c) => c.chapitres || 0 },
  { id: 'periode-1', icon: '📅', label: 'Période accomplie', attests: 'Tous les chapitres d’une période de l’année terminés dans une matière.', goal: 1, value: (c) => c.periodes || 0 },
  { id: 'annee-1', icon: '🎓', label: 'Année accomplie', attests: 'Toute la quête de l’année terminée dans une matière.', goal: 1, value: (c) => c.annees || 0 },
  { id: 'gardien-1', icon: '🦔', label: 'Ami des gardiens', attests: 'Un gardien de période apprivoisé : huit questions mêlées de ses chapitres, cinq cœurs allumés.', goal: 1, value: (c) => c.gardiens || 0 },
  { id: 'gardien-5', icon: '🐉', label: 'Dompteur de dragons', attests: 'Cinq gardiens de période apprivoisés.', goal: 5, value: (c) => c.gardiens || 0 },
  { id: 'famille-1', icon: '🤝', label: 'Esprit d’équipe', attests: 'Le défi de la famille réussi une semaine : le but commun atteint.', goal: 1, value: (c) => c.familles || 0 },
  { id: 'famille-4', icon: '🏡', label: 'Famille de lumière', attests: 'Le défi de la famille réussi quatre semaines.', goal: 4, value: (c) => c.familles || 0 },
  { id: 'memoire-1', icon: '🃏', label: 'Bonne mémoire', attests: 'Une partie de jeu de mémoire terminée.', goal: 1, value: (c) => c.memoires || 0 },
  { id: 'frise-1', icon: '⏳', label: 'Voyageur du temps', attests: 'Une partie de frise chronologique terminée.', goal: 1, value: (c) => c.frises || 0 },
  { id: 'frise-7', icon: '🏛️', label: 'Historien en herbe', attests: 'Des parties de frise chronologique terminées sept jours différents.', goal: 7, value: (c) => c.frises || 0 },
  { id: 'eclair-1', icon: '⚡', label: 'Esprit vif', attests: 'Une série de calcul éclair terminée.', goal: 1, value: (c) => c.eclairs || 0 },
  { id: 'eclair-7', icon: '🚀', label: 'Fusée du calcul', attests: 'Des séries de calcul éclair terminées sept jours différents.', goal: 7, value: (c) => c.eclairs || 0 },
  { id: 'mot-1', icon: '🔤', label: 'Détective des mots', attests: 'Une série de mots mystère terminée.', goal: 1, value: (c) => c.mots || 0 },
  { id: 'mot-7', icon: '📖', label: 'Dictionnaire vivant', attests: 'Des séries de mots mystère terminées sept jours différents.', goal: 7, value: (c) => c.mots || 0 },
  { id: 'fluence-1', icon: '📖', label: 'Lecteur à voix haute', attests: 'Une lecture chronométrée terminée.', goal: 1, value: (c) => c.fluences || 0 },
  { id: 'fluence-7', icon: '🎙️', label: 'Belle voix', attests: 'Des lectures chronométrées sept jours différents.', goal: 7, value: (c) => c.fluences || 0 },
  { id: 'jeudujour-7', icon: '🌟', label: 'Curieux de tout', attests: 'Le jeu du jour joué sept jours différents.', goal: 7, value: (c) => c.jeuxdujour || 0 },
  { id: 'estime-1', icon: '📏', label: 'Bon estimateur', attests: 'Une partie d’ordre de grandeur terminée.', goal: 1, value: (c) => c.estimes || 0 },
  { id: 'estime-7', icon: '🔭', label: 'Œil de lynx', attests: 'Des parties d’ordre de grandeur terminées sept jours différents.', goal: 7, value: (c) => c.estimes || 0 },
  { id: 'passeport-1', icon: '🛂', label: 'Passeport tamponné', attests: 'Quatre petits jeux différents joués dans la même semaine.', goal: 1, value: (c) => c.passeports || 0 },
  { id: 'passeport-4', icon: '🧭', label: 'Grand voyageur des jeux', attests: 'Le passeport des jeux complété quatre semaines.', goal: 4, value: (c) => c.passeports || 0 },
  { id: 'compare-1', icon: '⚖️', label: 'Sens des nombres', attests: 'Une partie de « Le plus grand ! » terminée.', goal: 1, value: (c) => c.compares || 0 },
  { id: 'compare-7', icon: '🦅', label: 'Coup d’œil d’aigle', attests: 'Des parties de « Le plus grand ! » sept jours différents.', goal: 7, value: (c) => c.compares || 0 },
  { id: 'vraifaux-1', icon: '🕵️', label: 'Détecteur de pièges', attests: 'Une partie de « Vrai ou faux ? » terminée.', goal: 1, value: (c) => c.vraifaux || 0 },
  { id: 'vraifaux-7', icon: '🦉', label: 'Esprit critique', attests: 'Des parties de « Vrai ou faux ? » sept jours différents.', goal: 7, value: (c) => c.vraifaux || 0 },
  { id: 'boutique-1', icon: '🏪', label: 'Petit commerçant', attests: 'Une journée de « La boutique » terminée.', goal: 1, value: (c) => c.boutiques || 0 },
  { id: 'boutique-7', icon: '💶', label: 'As de la monnaie', attests: 'La boutique tenue sept jours différents.', goal: 7, value: (c) => c.boutiques || 0 },
  { id: 'memoire-7', icon: '🐘', label: 'Mémoire d’éléphant', attests: 'Des parties de jeu de mémoire terminées sept jours différents.', goal: 7, value: (c) => c.memoires || 0 },
  { id: 'enigme-7', icon: '🧩', label: 'Esprit curieux', attests: 'Sept énigmes du jour résolues.', goal: 7, value: (c) => c.enigmes || 0 },
  { id: 'enigme-30', icon: '🔎', label: 'Grand curieux', attests: 'Trente énigmes du jour résolues.', goal: 30, value: (c) => c.enigmes || 0 },
  { id: 'album-12', icon: '📒', label: 'Collectionneur', attests: 'Douze vignettes dans l’album de lumière.', goal: 12, value: (c) => c.album || 0 },
  { id: 'album-24', icon: '📚', label: 'Grand collectionneur', attests: 'Vingt-quatre vignettes dans l’album de lumière.', goal: 24, value: (c) => c.album || 0 },
  { id: 'album-48', icon: '🏆', label: 'Album complet', attests: 'Les quarante-huit vignettes de l’album de lumière.', goal: 48, value: (c) => c.album || 0 },
  { id: 'album-72', icon: '🐾', label: 'Ami des bêtes', attests: 'Vingt-quatre vignettes de l’album des animaux extraordinaires.', goal: 72, value: (c) => c.album || 0 },
  { id: 'album-96', icon: '🦄', label: 'Grand naturaliste', attests: 'Les deux albums complets : quatre-vingt-seize vignettes.', goal: 96, value: (c) => c.album || 0 },
  { id: 'album-120', icon: '🧳', label: 'Globe-trotteur', attests: 'Vingt-quatre vignettes de l’album des merveilles du monde.', goal: 120, value: (c) => c.album || 0 },
  { id: 'album-144', icon: '🌐', label: 'Explorateur du monde', attests: 'Les trois albums complets : cent quarante-quatre vignettes.', goal: 144, value: (c) => c.album || 0 },
  { id: 'niveau-5', icon: '🌟', label: 'Rayon', attests: 'Niveau 5 atteint.', goal: 5, value: (c) => c.level },
  { id: 'niveau-10', icon: '🌅', label: 'Aurore', attests: 'Niveau 10 atteint.', goal: 10, value: (c) => c.level },
];

export function computeTrophies(counters) {
  return TROPHIES.map((t) => {
    const v = Math.max(0, Number(t.value(counters)) || 0);
    return { id: t.id, icon: t.icon, label: t.label, attests: t.attests, goal: t.goal, value: Math.min(v, t.goal), earned: v >= t.goal };
  });
}

/* ------------------------------ Album de lumière ------------------------------ */

/**
 * Vignettes à collectionner, gagnées dans les coffres des jeux : chaque défi de quête relevé donne une vignette
 * ordinaire, une quête réussie ou une victoire au jeu de plateau une vignette rare. Chacune explique un phénomène
 * de lumière (la récompense apprend aussi quelque chose). Les icônes sont des émojis anciens, présents partout.
 */
const LUMIERE = [
  { id: 'arc-en-ciel', icon: '🌈', label: 'Arc-en-ciel', fact: 'Les gouttes de pluie dévient et décomposent la lumière du Soleil, comme un prisme : on voit l’arc en tournant le dos au Soleil.' },
  { id: 'coucher', icon: '🌅', label: 'Coucher de soleil', fact: 'Le soir, la lumière traverse beaucoup plus d’air : le bleu est diffusé en chemin, il reste surtout l’orange et le rouge.' },
  { id: 'ciel-bleu', icon: '🌤️', label: 'Ciel bleu', fact: 'L’air diffuse bien plus la lumière bleue que la rouge : c’est pour cela que le ciel paraît bleu le jour.' },
  { id: 'pleine-lune', icon: '🌕', label: 'Pleine lune', fact: 'La Lune ne produit pas de lumière : elle renvoie celle du Soleil vers nous.' },
  { id: 'croissant', icon: '🌙', label: 'Croissant de lune', fact: 'Les phases de la Lune viennent de la part de sa face éclairée par le Soleil que l’on voit depuis la Terre.' },
  { id: 'eclipse', icon: '🌑', label: 'Éclipse de Soleil', fact: 'La Lune passe entre la Terre et le Soleil et le cache quelques minutes : son ombre se déplace sur la Terre.' },
  { id: 'soleil', icon: '☀️', label: 'Soleil', fact: 'La lumière du Soleil met environ 8 minutes pour arriver jusqu’à la Terre.' },
  { id: 'etoile', icon: '⭐', label: 'Étoile', fact: 'La lumière des étoiles a voyagé pendant des années : on les voit telles qu’elles étaient dans le passé.' },
  { id: 'voie-lactee', icon: '🌌', label: 'Voie lactée', fact: 'La bande pâle du ciel nocturne, ce sont des milliards d’étoiles de notre galaxie, vues par la tranche.' },
  { id: 'comete', icon: '☄️', label: 'Comète', fact: 'Près du Soleil, la glace d’une comète se change en gaz : sa queue s’allonge à l’opposé du Soleil.' },
  { id: 'etoile-filante', icon: '🌠', label: 'Étoile filante', fact: 'Ce n’est pas une étoile : c’est une poussière venue de l’espace qui chauffe et brille en entrant dans l’atmosphère.' },
  { id: 'lampe', icon: '🔦', label: 'Lampe de poche', fact: 'La lumière se propage en ligne droite : dans le brouillard, le faisceau d’une lampe dessine un cône bien net.' },
  { id: 'led', icon: '💡', label: 'Ampoule LED', fact: 'Une LED change l’énergie électrique en lumière en chauffant bien moins qu’une ampoule à filament.' },
  { id: 'bougie', icon: '🕯️', label: 'Bougie', fact: 'La flamme brille parce que de minuscules grains de suie, très chauds, émettent de la lumière.' },
  { id: 'loupe', icon: '🔍', label: 'Loupe', fact: 'Une loupe est une lentille convergente : elle dévie les rayons et fait paraître les objets plus grands.' },
  { id: 'lunettes', icon: '👓', label: 'Lunettes', fact: 'Les verres de lunettes sont des lentilles : ils corrigent la façon dont l’œil fait converger la lumière.' },
  { id: 'appareil-photo', icon: '📷', label: 'Appareil photo', fact: 'Comme dans l’œil, une lentille forme une image du paysage, à l’envers, sur le capteur.' },
  { id: 'feu-artifice', icon: '🎆', label: 'Feu d’artifice', fact: 'Les couleurs viennent de métaux : le strontium donne du rouge, le cuivre du bleu, le sodium du jaune.' },
  { id: 'chouette', icon: '🦉', label: 'Chouette', fact: 'La chouette voit dans la pénombre grâce à de très grands yeux qui captent beaucoup de lumière.' },
  { id: 'chat', icon: '🐱', label: 'Yeux de chat', fact: 'Au fond de l’œil du chat, une couche réfléchissante renvoie la lumière : ses yeux brillent dans le noir.' },
  { id: 'papillon', icon: '🦋', label: 'Papillon bleu', fact: 'Le bleu de certains papillons ne vient pas d’un pigment : de minuscules structures de leurs ailes renvoient la lumière bleue.' },
  { id: 'feuille', icon: '🍃', label: 'Feuille verte', fact: 'La chlorophylle absorbe surtout le rouge et le bleu de la lumière et renvoie le vert : les feuilles paraissent vertes.' },
  { id: 'photosynthese', icon: '🌱', label: 'Photosynthèse', fact: 'Grâce à la lumière, les plantes fabriquent leur matière à partir d’eau et de dioxyde de carbone, et rejettent du dioxygène.' },
  { id: 'panneau-solaire', icon: '🔆', label: 'Panneau solaire', fact: 'Un panneau solaire photovoltaïque transforme directement la lumière du Soleil en électricité.' },
  { id: 'oeil', icon: '👁️', label: 'Pupille', fact: 'La pupille est une ouverture qui s’agrandit dans le noir et se rétrécit en pleine lumière.' },
  { id: 'lunettes-soleil', icon: '🕶️', label: 'Lunettes de soleil', fact: 'De bons verres solaires arrêtent les rayons ultraviolets, invisibles mais dangereux pour les yeux.' },
  { id: 'brouillard', icon: '🌫️', label: 'Brouillard', fact: 'Les gouttelettes du brouillard dispersent la lumière dans tous les sens : on ne voit plus au loin.' },
  { id: 'neige', icon: '❄️', label: 'Neige', fact: 'La neige paraît blanche parce que ses cristaux renvoient toutes les couleurs de la lumière.' },
  { id: 'mer', icon: '🌊', label: 'Fond de la mer', fact: 'L’eau absorbe d’abord le rouge : sous la mer, plus on descend, plus tout paraît bleu-vert.' },
  { id: 'ecran', icon: '📺', label: 'Écran', fact: 'Chaque point d’un écran mélange trois lumières, rouge, verte et bleue : c’est la synthèse additive.' },
  { id: 'peinture', icon: '🖍️', label: 'Mélange de peintures', fact: 'Mélanger des peintures retire des couleurs à la lumière renvoyée : c’est la synthèse soustractive.' },
  { id: 'telescope', icon: '🔭', label: 'Télescope', fact: 'Le grand miroir d’un télescope recueille la lumière des astres : plus il est grand, plus on voit des objets pâles.' },
  { id: 'satellite', icon: '🛰️', label: 'Satellite', fact: 'Les satellites photographient la Terre en lumière visible et en infrarouge, une lumière invisible pour nos yeux.' },
  { id: 'terre', icon: '🌍', label: 'Planète bleue', fact: 'Vue de l’espace, la Terre paraît bleue : ses océans et son atmosphère renvoient surtout la lumière bleue.' },
  { id: 'volcan', icon: '🌋', label: 'Lave', fact: 'La lave très chaude brille d’elle-même : plus elle est chaude, plus sa lumière passe du rouge au jaune.' },
  { id: 'eclair', icon: '⚡', label: 'Éclair', fact: 'On voit l’éclair presque aussitôt, le tonnerre arrive plus tard : environ 3 secondes d’écart par kilomètre.' },
  { id: 'aurore', icon: '✨', label: 'Aurore polaire', rare: true, fact: 'Des particules venues du Soleil frappent la haute atmosphère près des pôles et la font briller en vert et en rose.' },
  { id: 'prisme', icon: '🔺', label: 'Prisme de Newton', rare: true, fact: 'Isaac Newton a montré qu’un prisme sépare la lumière blanche en couleurs, et qu’un second prisme peut les réunir.' },
  { id: 'laser', icon: '🔴', label: 'Laser', rare: true, fact: 'La lumière d’un laser est d’une seule couleur et reste serrée en un faisceau très fin.' },
  { id: 'supernova', icon: '💥', label: 'Supernova', rare: true, fact: 'Une étoile très massive qui explose peut briller un moment autant que toute une galaxie.' },
  { id: 'halo', icon: '🌞', label: 'Halo solaire', rare: true, fact: 'Des cristaux de glace dans les nuages très hauts dévient la lumière et dessinent un anneau autour du Soleil.' },
  { id: 'mirage', icon: '🏜️', label: 'Mirage', rare: true, fact: 'Au-dessus d’une route brûlante, l’air chaud courbe la lumière : on croit voir une flaque qui reflète le ciel.' },
  { id: 'microscope', icon: '🔬', label: 'Microscope', rare: true, fact: 'Avec de simples lentilles, Antoni van Leeuwenhoek a vu au XVIIe siècle des êtres vivants invisibles à l’œil nu.' },
  { id: 'andromede', icon: '🌀', label: 'Galaxie d’Andromède', rare: true, fact: 'Notre grande voisine est si loin que sa lumière a voyagé environ 2,5 millions d’années avant de nous parvenir.' },
  { id: 'trou-noir', icon: '🕳️', label: 'Trou noir', rare: true, fact: 'Un trou noir attire si fort que même la lumière ne peut pas s’en échapper.' },
  { id: 'diamant', icon: '💎', label: 'Diamant', rare: true, fact: 'Le diamant dévie très fortement la lumière et la décompose : c’est ce qui le fait scintiller de couleurs.' },
  { id: 'calmar', icon: '🦑', label: 'Calmar des abysses', rare: true, fact: 'Certains calmars des grandes profondeurs fabriquent leur propre lumière pour se camoufler.' },
  { id: 'vitesse', icon: '💫', label: 'Vitesse de la lumière', rare: true, fact: 'La lumière parcourt environ 300 000 km chaque seconde : sept fois et demie le tour de la Terre.' },
].map((v) => ({ ...v, album: 'lumiere' }));
/** Deuxième album, ouvert quand l'album de lumière est complet : des animaux extraordinaires, un fait vrai chacun. */
const ANIMAUX = [
  ['girafe', '🦒', 'Girafe', 'Malgré son long cou, la girafe a sept vertèbres cervicales, comme nous : elles sont simplement très longues.'],
  ['elephant', '🐘', 'Éléphant', 'Sa trompe, c’est son nez et sa lèvre supérieure réunis : elle lui sert à respirer, boire, attraper et caresser.'],
  ['guepard', '🐆', 'Guépard', 'C’est l’animal terrestre le plus rapide : il dépasse les 100 km/h, mais seulement pendant quelques secondes.'],
  ['abeille', '🐝', 'Abeille', 'Une abeille qui a trouvé des fleurs danse dans la ruche : sa danse indique aux autres la direction et la distance.'],
  ['fourmi', '🐜', 'Fourmi', 'Une fourmi peut porter des objets bien plus lourds qu’elle, plusieurs dizaines de fois son poids pour certaines.'],
  ['escargot', '🐌', 'Escargot', 'Sa langue est couverte de milliers de dents minuscules : elle râpe les feuilles comme une lime.'],
  ['chauve-souris', '🦇', 'Chauve-souris', 'C’est le seul mammifère qui vole vraiment. Dans le noir, elle se repère à l’écho de ses cris.'],
  ['dauphin', '🐬', 'Dauphin', 'Le dauphin dort avec une moitié du cerveau à la fois : l’autre moitié reste éveillée pour remonter respirer.'],
  ['ours-polaire', '🐻', 'Ours polaire', 'Sous sa fourrure blanche, sa peau est noire : elle absorbe mieux la chaleur du soleil.'],
  ['koala', '🐨', 'Koala', 'Le koala dort jusqu’à vingt heures par jour : les feuilles d’eucalyptus qu’il mange lui donnent très peu d’énergie.'],
  ['saumon', '🐟', 'Saumon', 'Après des années en mer, le saumon remonte jusqu’à la rivière où il est né pour y pondre.'],
  ['hirondelle', '🐦', 'Hirondelle', 'À l’automne, les hirondelles de France partent passer l’hiver en Afrique, à des milliers de kilomètres.'],
  ['grenouille', '🐸', 'Grenouille', 'La grenouille respire avec ses poumons, mais aussi à travers sa peau, qui doit rester humide.'],
  ['crocodile', '🐊', 'Crocodile', 'Au repos, un crocodile peut rester plus d’une heure sous l’eau sans respirer.'],
  ['requin', '🦈', 'Requin', 'Le requin perd ses dents toute sa vie : une nouvelle rangée pousse derrière et vient les remplacer.'],
  ['etoile-mer', '🐚', 'Étoile de mer', 'Une étoile de mer qui perd un bras peut le faire repousser.'],
  ['mouton', '🐑', 'Mouton', 'La laine du mouton pousse sans arrêt : on le tond environ une fois par an, au printemps.'],
  ['effraie', '🤫', 'Chouette effraie', 'Le bord de ses plumes est frangé comme un peigne : elle vole sans faire aucun bruit.'],
  ['panda', '🐼', 'Panda géant', 'Le panda passe une grande partie de la journée à manger du bambou : il lui en faut beaucoup pour être rassasié.'],
  ['dromadaire', '🐪', 'Dromadaire', 'Sa bosse n’est pas une réserve d’eau mais de graisse : elle l’aide à tenir longtemps sans manger.'],
  ['kangourou', '🦘', 'Kangourou', 'À la naissance, le bébé kangourou est minuscule : il grandit plusieurs mois dans la poche de sa mère.'],
  ['crabe', '🦀', 'Crabe', 'Quand sa carapace devient trop petite, le crabe mue : il en sort et s’en fabrique une nouvelle, plus grande.'],
  ['zebre', '🦓', 'Zèbre', 'Il n’y a pas deux zèbres avec les mêmes rayures : chacun a son motif, comme nos empreintes digitales.'],
  ['gecko', '🦎', 'Gecko', 'Le gecko grimpe aux vitres grâce à des millions de poils minuscules sous ses doigts.'],
  ['monarque', '🍁', 'Papillon monarque', 'Chaque automne, des millions de monarques volent du Canada jusqu’au Mexique : des milliers de kilomètres.'],
  ['fourmilier', '👅', 'Fourmilier', 'Sa langue collante, longue d’environ 60 cm, attrape des milliers de fourmis et de termites par jour.'],
  ['ecureuil', '🐿️', 'Écureuil', 'L’écureuil enterre des graines pour l’hiver et en oublie : certaines deviennent de nouveaux arbres.'],
  ['herisson', '🦔', 'Hérisson', 'En hiver, le hérisson hiberne : son cœur ralentit et il vit sur ses réserves de graisse.'],
  ['vache', '🐄', 'Vache', 'La vache rumine : son estomac a quatre poches, et elle remâche l’herbe déjà avalée.'],
  ['cheval', '🐴', 'Cheval', 'Le cheval peut somnoler debout : ses pattes se « verrouillent » pour qu’il ne tombe pas.'],
  ['lion', '🦁', 'Lion', 'Le rugissement du lion s’entend à plusieurs kilomètres à la ronde.'],
  ['tigre', '🐯', 'Tigre', 'Les rayures du tigre ne sont pas seulement sur ses poils : elles sont aussi dessinées sur sa peau.'],
  ['loup', '🐺', 'Loup', 'Les loups vivent en meute et hurlent pour se retrouver et se parler de loin.'],
  ['perroquet', '🦜', 'Perroquet', 'Certains perroquets imitent la voix humaine et peuvent apprendre des dizaines de mots.'],
  ['baleine-bosse', '🐳', 'Baleine à bosse', 'Les mâles chantent sous l’eau des chants longs et compliqués, qu’ils répètent pendant des heures.'],
  ['araignee', '🕷️', 'Araignée', 'À épaisseur égale, un fil d’araignée est aussi solide que l’acier, tout en restant élastique.'],
  ['baleine-bleue', '🐋', 'Baleine bleue', 'C’est le plus gros animal qui ait jamais vécu, dinosaures compris : jusqu’à 30 mètres de long.', true],
  ['ornithorynque', '🦆', 'Ornithorynque', 'C’est un mammifère qui pond des œufs ! Il a un bec de canard et une queue de castor.', true],
  ['pieuvre', '🐙', 'Pieuvre', 'La pieuvre a trois cœurs et du sang bleu ; elle peut changer de couleur en un instant.', true],
  ['narval', '🦄', 'Narval', 'La longue « corne » du narval est en fait une dent, qui peut dépasser deux mètres.', true],
  ['axolotl', '🐲', 'Axolotl', 'Cet amphibien du Mexique peut faire repousser une patte entière, et même une partie de son cœur.', true],
  ['faucon', '🦅', 'Faucon pèlerin', 'En piqué, le faucon pèlerin dépasse les 300 km/h : c’est l’animal le plus rapide du monde.', true],
  ['tortue-luth', '🐢', 'Tortue luth', 'La plus grande des tortues marines peut plonger à plus de 1 000 mètres de profondeur.', true],
  ['hippocampe', '🐠', 'Hippocampe', 'Chez l’hippocampe, c’est le mâle qui porte les œufs dans une poche, jusqu’à la naissance des petits.', true],
  ['manchot', '🐧', 'Manchot empereur', 'Le mâle couve l’œuf sur ses pattes pendant tout l’hiver de l’Antarctique, sans manger.', true],
  ['paresseux', '🦥', 'Paresseux', 'Il bouge si lentement que de petites algues vertes poussent dans sa fourrure.', true],
  ['cameleon', '👀', 'Caméléon', 'Ses deux yeux bougent chacun de leur côté : il peut regarder devant et derrière à la fois.', true],
  ['colibri', '🌺', 'Colibri', 'Le colibri bat des ailes si vite qu’il peut voler sur place, et même en arrière.', true],
].map(([id, icon, label, fact, rare]) => ({ id: `a-${id}`, icon, label, fact, album: 'animaux', ...(rare ? { rare: true } : {}) }));

/** Troisième album, ouvert quand l'album des animaux est complet : des merveilles du monde, monuments et paysages. */
const MERVEILLES = [
  ['pyramides', '🏺', 'Pyramides de Gizeh', 'La grande pyramide de Khéops, haute d’environ 146 m à l’origine, est restée pendant près de 4 000 ans le plus haut monument construit par l’être humain.', true],
  ['muraille', '🧱', 'Grande Muraille', 'Avec toutes ses branches, elle s’étend sur plus de 20 000 km ; contrairement à une légende, on ne la voit pas à l’œil nu depuis la Lune.', true],
  ['machu-picchu', '⛰️', 'Machu Picchu', 'Cette cité inca perchée dans les Andes, au Pérou, a été bâtie au XVe siècle sans mortier : les pierres s’emboîtent parfaitement.', true],
  ['taj-mahal', '🕌', 'Taj Mahal', 'Ce mausolée de marbre blanc, en Inde, a été construit au XVIIe siècle par l’empereur Shah Jahan en mémoire de son épouse.', true],
  ['everest', '🏔️', 'Everest', 'Le plus haut sommet du monde culmine à 8 849 m, à la frontière entre le Népal et la Chine.', true],
  ['grand-canyon', '🏞️', 'Grand Canyon', 'Le fleuve Colorado a creusé ce canyon des États-Unis en quelques millions d’années ; il atteint 1 800 m de profondeur.', true],
  ['corail', '🪸', 'Grande Barrière de corail', 'Au large de l’Australie, c’est la plus grande structure construite par des êtres vivants : on la voit depuis l’espace.', true],
  ['angkor', '🛕', 'Angkor Vat', 'Au Cambodge, c’est le plus grand monument religieux du monde ; il figure sur le drapeau du pays.', true],
  ['petra', '🧭', 'Petra', 'Cette ville de Jordanie a été taillée directement dans la falaise de grès rose par les Nabatéens, il y a plus de 2 000 ans.', true],
  ['moai', '🗿', 'Moaï de l’île de Pâques', 'Près de 900 statues géantes de pierre se dressent sur cette petite île isolée du Pacifique.', true],
  ['victoria', '💧', 'Chutes Victoria', 'Sur le Zambèze, en Afrique, leur nuage d’embruns se voit à des kilomètres : on les surnomme « la fumée qui gronde ».', true],
  ['uyuni', '🪞', 'Salar d’Uyuni', 'En Bolivie, ce désert de sel est si plat qu’après la pluie il devient un immense miroir du ciel.', true],
  ['tour-eiffel', '🗼', 'Tour Eiffel', 'Construite pour l’Exposition universelle de 1889, elle grandit de quelques centimètres l’été : le fer se dilate à la chaleur.'],
  ['colisee', '🏟️', 'Colisée', 'Cet amphithéâtre de Rome pouvait accueillir environ 50 000 spectateurs, venus voir des combats de gladiateurs.'],
  ['liberte', '🗽', 'Statue de la Liberté', 'Offerte par la France aux États-Unis en 1886, elle tient debout grâce à une charpente intérieure conçue par Gustave Eiffel.'],
  ['big-ben', '🕰️', 'Big Ben', 'Big Ben est le surnom de la grosse cloche de la tour de l’horloge du palais de Westminster, à Londres.'],
  ['mont-saint-michel', '🏰', 'Mont-Saint-Michel', 'Dans sa baie, la marée monte très vite : « à la vitesse d’un cheval au galop », dit le proverbe.'],
  ['notre-dame', '⛪', 'Notre-Dame de Paris', 'Après l’incendie de 2019, sa charpente et sa flèche ont été reconstruites ; la cathédrale a rouvert en décembre 2024.'],
  ['sagrada', '🏗️', 'Sagrada Família', 'La basilique imaginée par Gaudí, à Barcelone, est en construction depuis 1882.'],
  ['opera-sydney', '🎭', 'Opéra de Sydney', 'Ses toits en forme de voiles sont couverts de plus d’un million de tuiles.'],
  ['corcovado', '🕊️', 'Christ du Corcovado', 'Au-dessus de Rio de Janeiro, au Brésil, cette statue mesure environ 30 m, sans compter son socle.'],
  ['stonehenge', '🪨', 'Stonehenge', 'Dressées en Angleterre il y a environ 4 500 ans, ces pierres sont alignées sur le lever du Soleil au solstice d’été.'],
  ['burj-khalifa', '🏙️', 'Burj Khalifa', 'À Dubaï, ce gratte-ciel de plus de 800 m était le plus haut du monde à son ouverture, en 2010.'],
  ['golden-gate', '🌉', 'Golden Gate', 'Ce pont de San Francisco est peint d’une couleur orange spéciale, pour bien se voir dans le brouillard.'],
  ['millau', '🛣️', 'Viaduc de Millau', 'Son plus haut pylône culmine à 343 m, plus haut que la tour Eiffel : c’est le pont le plus haut du monde.'],
  ['versailles', '👑', 'Château de Versailles', 'Sa galerie des Glaces, où se tenaient les fêtes de la cour, compte 357 miroirs.'],
  ['alhambra', '🏵️', 'Alhambra', 'Ce palais de Grenade, en Espagne, est couvert de milliers de motifs géométriques sculptés.'],
  ['pise', '📐', 'Tour de Pise', 'Elle penche depuis sa construction, au Moyen Âge, parce que le sol est trop mou d’un côté.'],
  ['cite-interdite', '🏯', 'Cité interdite', 'À Pékin, le palais des empereurs de Chine compte des centaines de bâtiments ; il est resté fermé au public pendant cinq siècles.'],
  ['fuji', '🗻', 'Mont Fuji', 'Ce volcan de 3 776 m, le plus haut sommet du Japon, est toujours actif : sa dernière éruption date de 1707.'],
  ['niagara', '💦', 'Chutes du Niagara', 'Entre le Canada et les États-Unis, plus de deux millions de litres d’eau y tombent chaque seconde.'],
  ['amazonie', '🌳', 'Forêt amazonienne', 'La plus grande forêt tropicale du monde abrite une part immense des espèces vivantes de la planète.'],
  ['sahara', '🐫', 'Sahara', 'Le plus grand désert chaud du monde est presque aussi vaste que les États-Unis.'],
  ['mer-morte', '🧂', 'Mer Morte', 'Son eau est si salée qu’on y flotte sans effort ; ses rives sont les terres émergées les plus basses du globe.'],
  ['baikal', '🧊', 'Lac Baïkal', 'Ce lac de Sibérie, profond de plus de 1 600 m, est le plus profond du monde.'],
  ['geysir', '♨️', 'Geysir', 'Le mot « geyser » vient du Grand Geysir, en Islande, une source qui projette de l’eau bouillante dans les airs.'],
  ['ha-long', '🛶', 'Baie d’Ha Long', 'Au Viêt Nam, la baie compte près de 2 000 îles et îlots de calcaire.'],
  ['galapagos', '🦭', 'Îles Galápagos', 'Les animaux de ces îles du Pacifique ont aidé Charles Darwin à imaginer sa théorie de l’évolution.'],
  ['kilimandjaro', '🌄', 'Kilimandjaro', 'Le plus haut sommet d’Afrique (5 895 m) porte des glaciers, tout près de l’équateur.'],
  ['verdon', '🧗', 'Gorges du Verdon', 'En Provence, leurs falaises dominent jusqu’à 700 m une rivière couleur émeraude.'],
  ['pilat', '🏖️', 'Dune du Pilat', 'En Gironde, c’est la plus haute dune d’Europe : plus de 100 m de sable.'],
  ['pont-du-gard', '🌁', 'Pont du Gard', 'Cet aqueduc romain à trois étages, vieux de près de 2 000 ans, apportait l’eau jusqu’à Nîmes.'],
  ['chambord', '⚜️', 'Château de Chambord', 'Son grand escalier à double vis permet à deux personnes de monter en même temps sans jamais se croiser.'],
  ['lascaux', '🐂', 'Grotte de Lascaux', 'Ses peintures, vieilles d’environ 17 000 ans, sont si fragiles que l’on visite une copie fidèle.'],
  ['mont-blanc', '⛷️', 'Mont Blanc', 'Le plus haut sommet des Alpes dépasse 4 800 m ; sa hauteur varie un peu avec l’épaisseur de la glace au sommet.'],
  ['louvre', '🔷', 'Pyramide du Louvre', 'Cette pyramide de verre, inaugurée en 1989, est l’entrée du musée le plus visité du monde.'],
  ['atomium', '⚛️', 'Atomium', 'À Bruxelles, ce monument de 1958 représente un cristal de fer agrandi des milliards de fois.'],
  ['parthenon', '🏛️', 'Parthénon', 'Ce temple d’Athéna, sur l’Acropole d’Athènes, date du Ve siècle av. J.-C. ; il était peint de couleurs vives.'],
].map(([id, icon, label, fact, rare]) => ({ id: `m-${id}`, icon, label, fact, album: 'merveilles', ...(rare ? { rare: true } : {}) }));

/** Les albums, dans l'ordre : le suivant s'ouvre quand le précédent est complet. */
export const ALBUMS = [
  { id: 'lumiere', label: 'Album de lumière', icon: '🔆', about: 'des phénomènes de lumière' },
  { id: 'animaux', label: 'Album des animaux extraordinaires', icon: '🐾', about: 'des animaux étonnants' },
  { id: 'merveilles', label: 'Album des merveilles du monde', icon: '🌍', about: 'des monuments et des paysages extraordinaires' },
];
export const VIGNETTES = [...LUMIERE, ...ANIMAUX, ...MERVEILLES];

/** Évènements qui ouvrent un coffre, et la sorte de vignette qu’il contient. */
export const CHEST_EVENTS = { defi: 'ordinaire', quete: 'rare', victoire: 'rare', periode: 'rare', annee: 'rare', gardien: 'rare', famille: 'rare', passeport: 'rare' };

function hashId(s) {
  let x = 2166136261;
  for (const c of String(s)) { x ^= c.codePointAt(0); x = Math.imul(x, 16777619) >>> 0; }
  return x >>> 0;
}

/**
 * Album recalculé à partir des évènements, dans l’ordre : chaque coffre donne une vignette pas encore obtenue de sa
 * sorte (sinon de l’autre), tirée d’après l’identifiant de l’évènement. Rien à enregistrer en plus, et une sauvegarde
 * restaurée redonne exactement le même album.
 * @returns {{ owned: Array<{ vignette, event }>, byEvent: Map<string, object> }} byEvent : « type:id » → vignette
 */
export function albumOf(events) {
  const owned = []; const have = new Set(); const byEvent = new Map();
  const chests = (events || []).filter((e) => CHEST_EVENTS[e.type]).slice().sort((a, b) => a.ts - b.ts);
  for (const e of chests) {
    const rare = CHEST_EVENTS[e.type] === 'rare';
    // l'album en cours : le premier qui n'est pas complet (le suivant ne s'ouvre qu'ensuite)
    const album = ALBUMS.find((a) => VIGNETTES.some((v) => v.album === a.id && !have.has(v.id)));
    if (!album) break; // tous les albums sont complets
    const left = VIGNETTES.filter((v) => v.album === album.id && !have.has(v.id));
    let pool = left.filter((v) => Boolean(v.rare) === rare);
    if (!pool.length) pool = left;
    const v = pool[hashId(`${e.type}:${e.id}`) % pool.length];
    have.add(v.id);
    owned.push({ vignette: v, event: e });
    byEvent.set(`${e.type}:${e.id}`, v);
  }
  return { owned, byEvent };
}
