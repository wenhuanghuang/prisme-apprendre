/**
 * Compréhension de lecture au primaire : de courts textes originaux (récits et documentaires), avec une question
 * explicite (l'information est écrite) ou d'inférence (il faut la déduire d'indices). L'énoncé peut être lu à voix
 * haute (bouton « Lire l'énoncé »), ce qui aide les plus jeunes lecteurs. Rattachés aux chapitres « Comprendre ».
 */
import { pick } from './gen-util.js';
import { qcm } from './primaire-savoirs.js';

// [texte, question, bonne réponse, distracteurs, explication (où est l'indice)]
const COURTS = [
  ['Lina met son manteau, son bonnet et ses gants. Dehors, tout est blanc.', 'Quelle saison est-ce ?', 'l’hiver', ['l’été', 'le printemps', 'l’automne'], 'Le bonnet, les gants et le paysage tout blanc (la neige) montrent que c’est l’hiver.'],
  ['Tom a oublié son parapluie. Il arrive à l’école tout mouillé.', 'Quel temps fait-il ?', 'il pleut', ['il fait très chaud', 'il neige', 'il y a du soleil'], 'Sans parapluie, il est arrivé tout mouillé : il pleut.'],
  ['Le chat de Zoé s’appelle Pompon. Il dort toute la journée sur le canapé.', 'Comment s’appelle le chat ?', 'Pompon', ['Zoé', 'Canapé', 'Minou'], 'C’est écrit dans la première phrase : « Le chat de Zoé s’appelle Pompon ».'],
  ['Papa sort un gâteau du four et allume six bougies. Toute la famille chante.', 'Que fête la famille ?', 'un anniversaire', ['Noël', 'la rentrée', 'un mariage'], 'Un gâteau, des bougies et une chanson : c’est un anniversaire.'],
  ['Léo court vers le bus, mais les portes se ferment. Le bus part sans lui.', 'Que s’est-il passé ?', 'Léo a raté le bus', ['Léo conduit le bus', 'Léo est monté dans le bus', 'le bus attend Léo'], 'Les portes se ferment et le bus part sans lui : il l’a raté.'],
  ['Nina plante une graine dans un pot. Chaque jour, elle l’arrose. Bientôt, une petite tige verte sort de la terre.', 'Qu’est-ce qui sort de la terre ?', 'une jeune plante', ['un ver de terre', 'une fleur coupée', 'un caillou'], 'La graine arrosée a germé : la tige verte est une jeune plante.'],
  ['Sam bâille et se frotte les yeux. Maman éteint la lumière de sa chambre.', 'Que va faire Sam ?', 'dormir', ['manger', 'aller à l’école', 'jouer dehors'], 'Il bâille, se frotte les yeux et on éteint la lumière : il va dormir.'],
  ['Au marché, Inès choisit des pommes, des poires et des bananes.', 'Qu’achète Inès ?', 'des fruits', ['des légumes', 'des jouets', 'du pain'], 'Pommes, poires et bananes sont des fruits.'],
  ['Malo enfile ses bottes et prend son seau. Il va chercher des escargots après l’averse.', 'Quel temps faisait-il juste avant ?', 'il a plu', ['il a neigé', 'il faisait très chaud', 'il y avait du soleil'], 'Une averse, c’est une pluie : Malo sort après la pluie, avec ses bottes.'],
  ['Zoé souffle les bougies. Tout le monde applaudit et chante. Elle a maintenant sept ans.', 'Quel âge avait Zoé hier ?', 'six ans', ['sept ans', 'huit ans', 'cinq ans'], 'C’est son anniversaire : elle a « maintenant » sept ans, elle en avait donc six.'],
  ['Le facteur dépose une lettre dans la boîte. Sur l’enveloppe, il y a un timbre avec une girafe.', 'Qu’y a-t-il sur le timbre ?', 'une girafe', ['un facteur', 'une boîte', 'une enveloppe'], 'C’est écrit : « un timbre avec une girafe ».'],
  ['Lucas met son pyjama, se brosse les dents et choisit un livre. Papa vient lui lire une histoire.', 'À quel moment de la journée sommes-nous ?', 'le soir', ['le matin', 'à midi', 'l’après-midi'], 'Pyjama, dents brossées et histoire : c’est l’heure d’aller au lit.'],
  ['Au zoo, Emma regarde un grand animal gris qui s’arrose le dos avec sa trompe.', 'Quel animal Emma regarde-t-elle ?', 'un éléphant', ['une girafe', 'un lion', 'un zèbre'], 'Un grand animal gris avec une trompe : c’est l’éléphant.'],
  ['Hugo range ses crayons dans sa trousse et ferme son cartable. La cloche sonne.', 'Où est Hugo ?', 'à l’école', ['à la piscine', 'au marché', 'dans son lit'], 'Trousse, cartable et cloche : Hugo est à l’école.'],
];
const LONGS = [
  ['Au bord de l’étang, la vieille tortue Mira regardait les têtards. « Quand j’étais jeune, disait-elle, il y avait des centaines de grenouilles ici. » Aujourd’hui, on n’en entendait plus que trois ou quatre chanter le soir.', 'Qu’est-ce qui a changé autour de l’étang ?', 'il y a beaucoup moins de grenouilles qu’avant', ['il y a plus de tortues', 'l’étang a disparu', 'les grenouilles chantent plus fort'], 'Autrefois des centaines de grenouilles, aujourd’hui trois ou quatre : leur nombre a beaucoup diminué.'],
  ['Malik ouvrit la lettre en tremblant. Il la lut deux fois, puis sauta de joie dans toute la cuisine : il était sélectionné pour le tournoi !', 'Pourquoi Malik tremblait-il en ouvrant la lettre ?', 'il était inquiet de la réponse', ['il avait froid', 'il était malade', 'la lettre était lourde'], 'Il attendait une réponse importante : il tremblait d’impatience et d’inquiétude, puis la joie éclate.'],
  ['Le manchot empereur vit en Antarctique. Pendant l’hiver, la femelle pond un œuf, puis part en mer pour se nourrir. Le mâle garde l’œuf au chaud sur ses pattes pendant environ deux mois, sans manger.', 'Qui garde l’œuf au chaud ?', 'le mâle', ['la femelle', 'les deux parents à tour de rôle', 'personne'], 'C’est écrit : « Le mâle garde l’œuf au chaud sur ses pattes ».'],
  ['Le marchand regarda la pièce, la mordit, puis la rendit au voyageur en fronçant les sourcils.', 'Que pense sans doute le marchand de la pièce ?', 'qu’elle est fausse', ['qu’elle est très belle', 'qu’elle vaut une fortune', 'qu’elle est à lui'], 'Il la mord pour vérifier le métal, fronce les sourcils et la rend : il la croit fausse.'],
  ['Le soleil se couchait derrière les collines quand Jade aperçut enfin le toit de la ferme. Ses jambes étaient lourdes, mais elle sourit.', 'Pourquoi Jade sourit-elle ?', 'elle est presque arrivée après une longue marche', ['elle vient de se réveiller', 'elle a gagné une course', 'elle quitte la ferme'], '« Enfin », « jambes lourdes », le toit de la ferme en vue : la longue marche est presque finie.'],
  ['Chaque matin, le phare de l’île restait éteint. Mais dès que la nuit tombait, sa lumière tournait jusqu’à l’aube pour guider les bateaux.', 'À quoi sert le phare ?', 'à guider les bateaux la nuit', ['à éclairer l’île le matin', 'à chauffer les marins', 'à attirer les poissons'], 'C’est écrit : sa lumière tourne la nuit « pour guider les bateaux ».'],
  ['Hugo posa sa canne à pêche et rangea sa boîte d’hameçons. Son seau était toujours vide. « Demain, je viendrai plus tôt », soupira-t-il.', 'Comment s’est passée la pêche d’Hugo ?', 'il n’a rien pêché', ['il a pêché beaucoup de poissons', 'il a perdu sa canne', 'il est tombé à l’eau'], 'Le seau est vide et il soupire : il n’a rien attrapé.'],
  ['Les abeilles butinent les fleurs pour récolter le nectar. De retour à la ruche, elles le transforment en miel, qui servira de nourriture pendant l’hiver.', 'À quoi sert le miel pour les abeilles ?', 'à se nourrir pendant l’hiver', ['à construire la ruche', 'à attirer les fleurs', 'à se défendre'], 'C’est écrit à la fin : le miel « servira de nourriture pendant l’hiver ».'],
  ['Quand le chevalier entra dans la salle, tous se turent. Le roi lui-même se leva de son trône pour l’accueillir.', 'Que peut-on dire du chevalier ?', 'il est très respecté', ['il est inconnu de tous', 'il est le cuisinier du château', 'il est en retard et on le gronde'], 'Le silence de tous et le roi qui se lève : on le respecte beaucoup.'],
  ['« Encore un ! » s’écria Lou en montrant le ciel. Une traînée lumineuse venait de le traverser. Son grand-père sourit : « Fais un vœu, c’est la nuit des étoiles filantes. »', 'Qu’a vu Lou dans le ciel ?', 'une étoile filante', ['un avion', 'un arc-en-ciel', 'le soleil'], 'Le grand-père le dit : c’est la nuit des étoiles filantes, et une traînée lumineuse traverse le ciel.'],
  ['Le vieux pêcheur regarda le ciel noir à l’horizon, puis rentra son bateau au port plus tôt que d’habitude. « Ce n’est pas un jour pour sortir en mer », murmura-t-il.', 'Pourquoi le pêcheur rentre-t-il plus tôt ?', 'il voit qu’une tempête arrive', ['il a déjà pêché beaucoup de poissons', 'son bateau est en panne', 'il a faim'], 'Le ciel noir à l’horizon annonce l’orage : il préfère ne pas rester en mer.'],
  ['Chaque fois que Nadia passait devant la boulangerie, elle s’arrêtait un instant, fermait les yeux et respirait profondément.', 'Pourquoi Nadia s’arrête-t-elle ?', 'elle aime l’odeur du pain chaud', ['elle est fatiguée', 'elle attend le bus', 'elle a mal aux yeux'], 'Elle ferme les yeux et respire : elle profite de la bonne odeur de la boulangerie.'],
  ['Les lucioles sont de petits insectes qui produisent leur propre lumière. Les soirs d’été, elles clignotent dans l’herbe pour attirer un partenaire.', 'Pourquoi les lucioles clignotent-elles ?', 'pour attirer un partenaire', ['pour faire peur aux oiseaux', 'pour se réchauffer', 'pour éclairer les promeneurs'], 'C’est écrit dans la deuxième phrase.'],
  ['Paul arriva en courant, tout essoufflé, et regarda l’horloge de la gare : le train venait de partir. Il s’assit sur un banc en soupirant.', 'Comment se sent Paul ?', 'déçu', ['joyeux', 'fier', 'amusé'], 'Il a raté son train de peu : il soupire, déçu.'],
  ['Le castor abat des arbres avec ses dents très solides. Avec les branches et la boue, il construit un barrage sur la rivière, puis une hutte où il élève ses petits.', 'Que construit le castor avec les branches ?', 'un barrage et une hutte', ['un nid dans les arbres', 'un terrier sous la terre', 'un bateau'], 'Le texte dit : « il construit un barrage… puis une hutte ».'],
];
const ask = (rand, bank) => {
  const [t, q, good, bad, why] = pick(rand, bank);
  return qcm(rand, [`Lis le texte, puis réponds.\n*${t}*\n${q}`, good, bad, why], { hint: 'Relis le texte : la réponse est écrite, ou bien des indices te permettent de la deviner.', expectedSeconds: 60 });
};

export const PRIMAIRE_LECTURE = [
  { id: 'fr-p-lecture-courte', subject: 'francais', levels: ['cp', 'ce1'], facts: true, label: 'Comprendre un texte court', skill: 'fp.comprendre-court',
    chapters: ['cp-f-comprendre', 'ce1-f-comprendre', 'cp-f-lecteur', 'ce1-f-lecteur'], description: 'Deux ou trois phrases, une question : trouver l’information écrite ou la deviner grâce aux indices.',
    tracks: ['classe', 'approfondissement'], options: [], make(rand) { return ask(rand, COURTS); } },
  { id: 'fr-p-lecture', subject: 'francais', levels: ['ce2', 'cm1', 'cm2'], facts: true, label: 'Comprendre un texte : informations et indices', skill: 'fp.comprendre',
    chapters: ['ce2-f-comprendre', 'cm1-f-comprendre', 'cm2-f-comprendre', 'ce2-f-lecteur'], description: 'Récits et textes documentaires : retrouver une information, comprendre un personnage, faire une inférence.',
    tracks: ['classe', 'approfondissement'], options: [], make(rand) { return ask(rand, LONGS); } },
];
export const PRIMAIRE_LECTURE_SKILLS = [
  { subject: 'francais', id: 'fp.comprendre-court', label: 'Comprendre un texte court : information explicite et indices', level: 'cp' },
  { subject: 'francais', id: 'fp.comprendre', label: 'Comprendre un texte : informations, personnages, inférences', level: 'ce2' },
].map((s) => ({ ...s, track: 'classe', status: 'programme', domain: 'primaire', prereqs: [], editorialLevel: true }));
