/**
 * SVT de première et de terminale (spécialité) : générateurs rattachés aux chapitres des parcours de référence
 * svt-1re et svt-tle. Questions de cours à choix, expliquées, et quelques calculs (complémentarité des bases,
 * longueur d'une protéine, vitesse d'expansion océanique, nombre de gamètes différents).
 */
import { pick, ri, numeric, mc, fr } from './gen-util.js';
import { qcm } from './primaire-savoirs.js';

const GEN = [];
function add(level, g) {
  const { make, ...rest } = g;
  GEN.push({ tracks: ['classe', 'approfondissement'], options: [], levels: [level], subject: 'svt', ...rest, make(rand, o = {}, tier = 'classe') { return make(rand, tier !== 'classe'); } });
}
const num = (answer, o) => numeric(answer, { representation: 'symbolique', expectedSeconds: 60, ...o });

/* ================================ PREMIÈRE ================================ */

const GEN1 = [
  ['À l’issue d’une mitose, une cellule humaine donne…', 'deux cellules filles génétiquement identiques, à 46 chromosomes', ['quatre cellules à 23 chromosomes', 'deux cellules à 23 chromosomes', 'une seule cellule à 92 chromosomes'], 'La réplication de l’ADN, avant la mitose, permet de transmettre le même programme génétique.'],
  ['La réplication de l’ADN est dite semi-conservative car…', 'chaque nouvelle molécule contient un brin ancien et un brin nouveau', ['la moitié de l’ADN est détruite', 'seul un brin est copié', 'elle n’a lieu qu’une fois sur deux'], 'Chaque brin sert de modèle à la synthèse d’un brin complémentaire (expérience de Meselson et Stahl).'],
  ['Où a lieu la transcription de l’ADN en ARN messager chez les eucaryotes ?', 'dans le noyau', ['dans le cytoplasme, sur les ribosomes', 'dans la membrane', 'dans les vacuoles'], 'L’ARNm sort ensuite du noyau ; la traduction a lieu dans le cytoplasme, sur les ribosomes.'],
  ['Un codon est…', 'une suite de trois nucléotides de l’ARNm qui code un acide aminé', ['un acide aminé', 'un chromosome entier', 'une enzyme'], 'Le code génétique associe chaque triplet à un acide aminé (ou à un signal d’arrêt).'],
  ['Une mutation silencieuse…', 'ne change pas la séquence de la protéine', ['empêche toujours la vie', 'change tous les acides aminés', 'supprime le chromosome'], 'Le code génétique est redondant : plusieurs codons codent le même acide aminé.'],
  ['Une enzyme agit sur son substrat grâce à…', 'son site actif, de forme complémentaire', ['sa couleur', 'son noyau', 'la lumière'], 'La forme du site actif explique la spécificité de l’enzyme ; elle dépend de la température et du pH.'],
  ['Une cellule cancéreuse…', 'se divise de façon incontrôlée', ['ne se divise plus jamais', 'n’a plus d’ADN', 'vient toujours d’un virus'], 'Des mutations successives touchent les gènes qui contrôlent la division cellulaire.'],
  ['Pourquoi des bactéries résistantes aux antibiotiques se répandent-elles ?', 'les antibiotiques éliminent les sensibles et sélectionnent les résistantes', ['les antibiotiques créent volontairement des résistances', 'les bactéries deviennent des virus', 'les antibiotiques nourrissent les bactéries'], 'Une mutation ou un gène reçu d’une autre bactérie donne la résistance ; l’antibiotique fait ensuite la sélection.'],
  ['La comparaison des génomes montre que les humains actuels…', 'portent quelques gènes hérités de Néandertal (hors Afrique)', ['descendent directement du chimpanzé', 'ont tous exactement le même génome', 'n’ont aucun lien avec les autres primates'], 'Des croisements ont eu lieu il y a plusieurs dizaines de milliers d’années.'],
];
add('1re', {
  id: 'l1svt-genetique', label: 'Génétique et expression des gènes', skill: 'l1svt.genetique',
  chapters: ['1re-svt-divisions', '1re-svt-replication', '1re-svt-mutations', '1re-svt-genome-humain', '1re-svt-expression', '1re-svt-enzymes', '1re-svt-mutations-sante', '1re-svt-patrimoine-sante', '1re-svt-cancer', '1re-svt-antibiotiques'],
  description: 'Mitose, réplication, transcription et traduction, mutations, enzymes, cancer, résistance aux antibiotiques ; complémentarité des bases.',
  make(rand) {
    const k = pick(rand, ['qcm', 'qcm', 'chargaff', 'proteine']);
    if (k === 'chargaff') {
      const A = pick(rand, [15, 20, 22, 25, 30, 35]); const ask = pick(rand, ['T', 'G']);
      const ans = ask === 'T' ? A : 50 - A;
      return num(ans, { prompt: `Dans une molécule d’ADN double brin, l’adénine (A) représente ${A} % des bases. Quel pourcentage représente ${ask === 'T' ? 'la thymine (T)' : 'la guanine (G)'} ?`, unit: '%', unitOptional: true,
        misconceptions: ask === 'G' ? [mc(100 - A, 'mc:chargaff-total', 'notion', `A + T = ${2 * A} % ; il reste ${100 - 2 * A} % pour G + C, à partager entre les deux : G = ${50 - A} %.`)] : [mc(100 - A, 'mc:chargaff-total', 'notion', 'A s’apparie toujours avec T : il y a autant de T que de A.')],
        hints: ['A s’apparie avec T, et G avec C : %A = %T et %G = %C.'], solution: ask === 'T' ? `%T = %A = ${A} %` : `%A + %T = ${2 * A} %, donc %G + %C = ${100 - 2 * A} % et %G = ${50 - A} %` });
    }
    if (k === 'proteine') {
      const aa = pick(rand, [50, 100, 120, 150, 200, 300]);
      return num(aa, { prompt: `La partie codante d’un ARN messager compte ${aa * 3 + 3} nucléotides, du codon initiateur au codon stop inclus. Combien d’acides aminés compte la protéine ?`,
        misconceptions: [mc(aa + 1, 'mc:codon-stop', 'notion', 'Le codon stop ne code aucun acide aminé : il marque la fin de la traduction.'), mc(aa * 3 + 3, 'mc:codon-triplet', 'notion', 'Un acide aminé est codé par trois nucléotides : on divise par 3.')],
        hints: ['Un codon = 3 nucléotides = 1 acide aminé ; le codon stop n’en code aucun.'], solution: `${aa * 3 + 3} / 3 = ${aa + 1} codons, dont un codon stop : ${aa} acides aminés.` });
    }
    return qcm(rand, pick(rand, GEN1));
  },
});

const GEO1 = [
  ['La lithosphère est…', 'l’enveloppe rigide externe : croûte et partie supérieure du manteau', ['le noyau de la Terre', 'l’atmosphère', 'uniquement la croûte océanique'], 'Elle repose sur l’asthénosphère, plus ductile, sur laquelle les plaques se déplacent.'],
  ['La croûte océanique est constituée principalement de…', 'basalte et gabbro', ['granite', 'calcaire', 'sel'], 'La croûte continentale, plus épaisse et moins dense, est surtout granitique.'],
  ['Une dorsale océanique est une zone de…', 'divergence, où se forme de la nouvelle lithosphère océanique', ['collision entre deux continents', 'subduction', 'désert sous-marin sans activité'], 'Le magma remonte à l’axe de la dorsale et crée du plancher océanique.'],
  ['Lors d’une subduction,…', 'une lithosphère océanique plonge sous une autre plaque', ['deux continents s’écartent', 'une dorsale se forme', 'la croûte continentale plonge facilement'], 'La lithosphère océanique, refroidie et dense, s’enfonce dans le manteau (fosses, volcans explosifs).'],
  ['La chaîne de l’Himalaya résulte…', 'de la collision entre l’Inde et l’Asie', ['d’une dorsale', 'd’un point chaud', 'de l’érosion seule'], 'Après la fermeture d’un océan, deux lithosphères continentales se sont affrontées.'],
  ['Qui a proposé, au début du XXe siècle, la dérive des continents ?', 'Alfred Wegener', ['Charles Darwin', 'Louis Pasteur', 'Isaac Newton'], 'Wegener (1912) s’appuyait sur la forme des côtes et des fossiles communs à plusieurs continents.'],
  ['Les plaques lithosphériques se déplacent à une vitesse de l’ordre de…', 'quelques centimètres par an', ['quelques mètres par seconde', 'quelques kilomètres par an', 'un millimètre par siècle'], 'À peu près la vitesse de pousse des ongles.'],
  ['Le principal service écosystémique rendu par les insectes pollinisateurs est…', 'la pollinisation des cultures et des plantes sauvages', ['la production de pétrole', 'la formation des montagnes', 'le réchauffement du climat'], 'Une grande partie des cultures alimentaires dépend, au moins en partie, des pollinisateurs.'],
  ['Dans un écosystème, les relations de symbiose sont…', 'des associations durables à bénéfices réciproques', ['des combats entre prédateurs', 'des maladies', 'des migrations'], 'Exemple : les mycorhizes entre champignons et racines.'],
];
add('1re', {
  id: 'l1svt-terre-ecosystemes', label: 'Dynamique de la Terre et écosystèmes', skill: 'l1svt.terre',
  chapters: ['1re-svt-globe', '1re-svt-mobilite', '1re-svt-divergence', '1re-svt-convergence', '1re-svt-ecosystemes', '1re-svt-services'],
  description: 'Structure du globe, plaques, dorsales, subduction et collision, vitesse d’expansion ; interactions et services écosystémiques.',
  make(rand) {
    if (rand() < 0.3) {
      const [d, t, v] = pick(rand, [[200, 10, 2], [100, 5, 2], [300, 10, 3], [50, 10, 0.5], [600, 12, 5], [80, 2, 4]]);
      return num(v, { prompt: `Un basalte daté de ${t} millions d’années se trouve à ${d} km de l’axe de la dorsale. Quelle est la vitesse moyenne d’expansion de ce côté de la dorsale, en cm par an ?`, unit: 'cm/an', unitOptional: true,
        misconceptions: [mc(d / t, 'mc:unites-expansion', 'unite', `${d} km / ${t} Ma = ${fr(d / t)} km par million d’années : il faut convertir en cm par an (1 km = 100 000 cm).`)].filter((m) => m.answer !== v), difficulty: 3, expectedSeconds: 90,
        hints: ['v = distance / durée ; 1 km = 10⁵ cm et 1 Ma = 10⁶ ans.'], solution: `${d} km = ${d} × 10⁵ cm ; ${t} Ma = ${t} × 10⁶ ans : v = ${fr(v)} cm/an` });
    }
    return qcm(rand, pick(rand, GEO1));
  },
});

const IMMU = [
  ['Les signes de la réaction inflammatoire sont…', 'rougeur, chaleur, gonflement et douleur', ['fièvre et toux seulement', 'perte de poids', 'pâleur et froid'], 'C’est la réponse immunitaire innée, rapide, au point d’entrée du pathogène.'],
  ['La phagocytose, c’est…', 'l’ingestion et la digestion d’un élément étranger par certains globules blancs', ['la production d’anticorps', 'la division des bactéries', 'la coagulation du sang'], 'Macrophages et granulocytes englobent les pathogènes.'],
  ['Les anticorps sont produits par…', 'des lymphocytes B transformés en plasmocytes', ['les globules rouges', 'les plaquettes', 'les neurones'], 'Chaque anticorps reconnaît spécifiquement un antigène.'],
  ['Les lymphocytes T cytotoxiques (T CD8)…', 'détruisent les cellules infectées', ['produisent des anticorps', 'transportent le dioxygène', 'digèrent les graisses'], 'Ils reconnaissent les cellules qui présentent des fragments de l’antigène.'],
  ['La mémoire immunitaire explique que…', 'la réponse à un second contact avec le même antigène est plus rapide et plus forte', ['l’on attrape la même maladie chaque année', 'les anticorps disparaissent tous', 'les vaccins ne servent à rien'], 'Des lymphocytes mémoire persistent après le premier contact : c’est le principe de la vaccination.'],
  ['L’immunité innée est…', 'présente dès la naissance et non spécifique d’un pathogène', ['acquise seulement après un vaccin', 'spécifique d’un seul antigène', 'absente chez l’être humain'], 'L’immunité adaptative, plus lente au premier contact, est spécifique.'],
];
add('1re', {
  id: 'l1svt-immunite', label: 'Immunité innée et adaptative', skill: 'l1svt.immunite', chapters: ['1re-svt-immunite-innee', '1re-svt-immunite-adaptative', '1re-svt-immunite-sante'],
  description: 'Inflammation, phagocytose, lymphocytes B et T, anticorps, mémoire immunitaire, vaccination.',
  facts: true,
  make(rand) { return qcm(rand, pick(rand, IMMU)); },
});

/* ================================ TERMINALE ================================ */

const GEN2 = [
  ['La méiose produit…', 'quatre cellules haploïdes, génétiquement différentes', ['deux cellules diploïdes identiques', 'une cellule diploïde', 'quatre cellules identiques'], 'Deux divisions successives ; les brassages inter- et intrachromosomique créent la diversité des gamètes.'],
  ['Le brassage intrachromosomique est dû…', 'aux crossing-over entre chromosomes homologues', ['à la mitose', 'à la fécondation seule', 'aux mutations du soleil'], 'Des échanges de portions de chromatides en prophase I créent de nouvelles combinaisons d’allèles.'],
  ['La trisomie 21 correspond à…', 'la présence de trois chromosomes 21 (47 chromosomes)', ['l’absence de chromosome 21', 'une mutation d’un seul gène', 'une infection'], 'Elle résulte le plus souvent d’une mauvaise séparation des chromosomes lors de la méiose.'],
  ['Un croisement test consiste à croiser un individu…', 'avec un homozygote récessif pour les gènes étudiés', ['avec un individu identique', 'avec un individu d’une autre espèce', 'avec lui-même'], 'Les phénotypes des descendants révèlent directement les gamètes produits par l’individu testé.'],
  ['Les mitochondries descendent probablement…', 'de bactéries intégrées par endosymbiose', ['de virus', 'du noyau', 'de chloroplastes'], 'Elles ont leur propre ADN, circulaire comme celui des bactéries.'],
  ['Le modèle de Hardy-Weinberg décrit une population où les fréquences des allèles…', 'restent stables d’une génération à l’autre', ['changent toujours', 'sont toutes nulles', 'dépendent de la météo'], 'Il suppose une très grande population, sans sélection, mutation ni migration : les écarts révèlent les forces évolutives.'],
  ['Un transfert horizontal de gènes, c’est…', 'le passage de gènes entre organismes sans reproduction', ['la transmission des parents aux enfants', 'une mutation', 'la mitose'], 'Fréquent chez les bactéries (par exemple pour la résistance aux antibiotiques).'],
];
add('tle', {
  id: 'ltsvt-genetique', label: 'Génétique : méiose, brassages, populations', skill: 'ltsvt.genetique',
  chapters: ['tle-svt-clonal', 'tle-svt-meiose', 'tle-svt-genetique', 'tle-svt-accidents', 'tle-svt-transferts', 'tle-svt-populations', 'tle-svt-diversite'],
  description: 'Mitose et méiose, brassages, gamètes possibles, croisements test, accidents génétiques, endosymbiose, Hardy-Weinberg.',
  make(rand) {
    const k = pick(rand, ['qcm', 'qcm', 'gametes', 'n']);
    if (k === 'gametes') {
      const n = ri(rand, 2, 5);
      return num(2 ** n, { prompt: `Un individu est hétérozygote pour ${n} gènes situés sur ${n} paires de chromosomes différentes. Combien de types de gamètes génétiquement différents peut-il produire (sans crossing-over) ?`,
        misconceptions: [mc(2 * n, 'mc:gametes-produit', 'notion', `Chaque paire se répartit au hasard, indépendamment des autres : 2 × 2 × … (${n} fois) = 2^${n}.`)].filter((m) => m.answer !== 2 ** n), hints: ['Brassage interchromosomique : chaque paire offre 2 possibilités, indépendamment des autres.'], solution: `2^${n} = ${2 ** n} types de gamètes` });
    }
    if (k === 'n') {
      const [sp, dn] = pick(rand, [['l’être humain', 46], ['le chien', 78], ['le chat', 38], ['la drosophile', 8], ['le maïs', 20]]);
      return num(dn / 2, { prompt: `Les cellules de ${sp} contiennent 2n = ${dn} chromosomes. Combien de chromosomes contient chacun de ses gamètes ?`, misconceptions: [mc(dn, 'mc:gamete-diploide', 'notion', 'La méiose divise par deux le nombre de chromosomes : les gamètes sont haploïdes (n).')], expectedSeconds: 30, hints: ['Les gamètes sont haploïdes : n chromosomes.'], solution: `n = ${dn} / 2 = ${dn / 2}` });
    }
    return qcm(rand, pick(rand, GEN2));
  },
});

const TERRE = [
  ['D’après le principe de superposition, dans une série de couches non déformées,…', 'une couche est plus récente que celle qu’elle recouvre', ['la couche du dessous est la plus récente', 'toutes les couches ont le même âge', 'on ne peut rien dire'], 'C’est un principe de chronologie relative.'],
  ['Une faille qui recoupe des couches est…', 'plus récente que les couches qu’elle recoupe', ['plus ancienne que ces couches', 'du même âge', 'impossible à dater'], 'Principe de recoupement.'],
  ['La datation absolue d’une roche utilise…', 'la décroissance d’éléments radioactifs', ['la couleur de la roche', 'le nombre de fossiles', 'la hauteur de la montagne'], 'Le rapport entre isotope père et isotope fils donne l’âge (radiochronologie).'],
  ['Avant l’ère industrielle, la concentration de CO₂ dans l’atmosphère était d’environ…', '280 ppm', ['10 ppm', '1 000 ppm', '50 000 ppm'], 'Elle dépasse aujourd’hui 400 ppm, à cause surtout de la combustion des énergies fossiles.'],
  ['Les bulles d’air piégées dans les glaces polaires permettent…', 'de connaître la composition de l’atmosphère passée', ['de prévoir la météo de demain', 'de dater les volcans actifs', 'de mesurer la vitesse du vent'], 'Les carottages en Antarctique remontent à plus de 800 000 ans.'],
  ['Le réchauffement climatique actuel est principalement dû…', 'aux gaz à effet de serre émis par les activités humaines', ['à l’activité du Soleil seule', 'aux volcans', 'au mouvement des plaques'], 'C’est la conclusion des rapports successifs du GIEC.'],
  ['Une conséquence du réchauffement climatique est…', 'l’élévation du niveau des mers', ['la disparition des saisons', 'l’arrêt de la rotation de la Terre', 'la baisse du niveau des océans'], 'La dilatation de l’eau et la fonte des glaces continentales élèvent le niveau marin.'],
];
add('tle', {
  id: 'ltsvt-terre-climat', label: 'Temps géologiques et climats', skill: 'ltsvt.terre-climat', chapters: ['tle-svt-chronologie', 'tle-svt-passe-terre', 'tle-svt-climats-passes', 'tle-svt-rechauffement'],
  description: 'Chronologie relative et absolue, climats du passé, effet de serre, réchauffement climatique et ses conséquences.',
  facts: true,
  make(rand) { return qcm(rand, pick(rand, TERRE)); },
});

const PLANTES = [
  ['Les stomates des feuilles permettent…', 'les échanges de gaz (CO₂, O₂) et la sortie de vapeur d’eau', ['l’absorption des sels minéraux', 'la fixation de la plante au sol', 'la production des graines'], 'Ces petits orifices s’ouvrent et se ferment selon les conditions.'],
  ['La sève brute, puisée par les racines, circule dans…', 'le xylème', ['le phloème', 'les stomates', 'les pétales'], 'La sève élaborée, riche en sucres, circule dans le phloème.'],
  ['Après la fécondation, la fleur se transforme : l’ovaire devient…', 'le fruit', ['la racine', 'la feuille', 'la tige'], 'Les ovules fécondés deviennent les graines.'],
  ['Pourquoi beaucoup de plantes ont-elles besoin des insectes ?', 'pour transporter le pollen d’une fleur à l’autre', ['pour faire la photosynthèse', 'pour boire', 'pour pousser plus haut'], 'Plantes fixées, elles utilisent des animaux (ou le vent) pour la pollinisation ; fleurs et nectar attirent les pollinisateurs.'],
  ['Où a commencé la domestication du blé, il y a environ 10 000 ans ?', 'au Proche-Orient (le Croissant fertile)', ['en Amérique du Sud', 'en Australie', 'en Europe du Nord'], 'Le maïs, lui, a été domestiqué au Mexique, à partir de la téosinte.'],
  ['La plante stocke la matière organique produite par photosynthèse sous forme de…', 'amidon (et saccharose transporté)', ['protéines du sang', 'graisses animales', 'calcaire'], 'On trouve l’amidon dans les tubercules, les graines…'],
];
add('tle', {
  id: 'ltsvt-plantes', label: 'La plante, productrice et domestiquée', skill: 'ltsvt.plantes', chapters: ['tle-svt-plantes', 'tle-svt-plante-matiere', 'tle-svt-plante-reproduction', 'tle-svt-domestication'],
  description: 'Organisation de la plante, sèves, stomates, matière organique, pollinisation, fruit et graine, domestication.',
  facts: true,
  make(rand) { return qcm(rand, pick(rand, PLANTES)); },
});

const CORPS = [
  ['Le réflexe myotatique est…', 'la contraction d’un muscle en réponse à son propre étirement', ['un mouvement volontaire', 'une réaction hormonale lente', 'une maladie'], 'Exemple : le réflexe rotulien ; l’arc réflexe passe par la moelle épinière.'],
  ['Un mouvement volontaire est commandé par…', 'les aires motrices du cortex cérébral', ['le cœur', 'les muscles eux-mêmes', 'le pancréas'], 'Les messages nerveux descendent par la moelle épinière jusqu’aux motoneurones.'],
  ['La contraction d’une cellule musculaire est due au glissement des filaments…', 'd’actine et de myosine', ['d’ADN', 'de kératine', 'de collagène'], 'Ce glissement consomme de l’ATP.'],
  ['L’énergie directement utilisable par la cellule musculaire est apportée par…', 'l’ATP', ['le glucose directement', 'le dioxyde de carbone', 'le sodium'], 'L’ATP est régénéré par la respiration (et la fermentation lors d’efforts intenses).'],
  ['Quelle hormone fait baisser la glycémie ?', 'l’insuline', ['le glucagon', 'l’adrénaline', 'le cortisol'], 'Produite par le pancréas, elle favorise le stockage du glucose ; le glucagon a l’effet inverse.'],
  ['Le diabète de type 1 est dû…', 'à la destruction des cellules du pancréas qui produisent l’insuline', ['à un excès de sucre dans un seul repas', 'à une bactérie', 'au stress uniquement'], 'C’est une maladie auto-immune ; le diabète de type 2 est lié à une moindre sensibilité à l’insuline.'],
  ['Face à un stress aigu, l’organisme libère rapidement…', 'de l’adrénaline', ['de l’insuline', 'des anticorps', 'de la mélatonine'], 'Le cœur s’accélère, la glycémie augmente : l’organisme se prépare à réagir.'],
  ['La plasticité cérébrale, c’est…', 'la capacité du cerveau à modifier ses connexions selon l’apprentissage', ['la dureté du crâne', 'la taille fixe du cerveau', 'une maladie'], 'Elle explique les progrès par l’entraînement et la récupération après certaines lésions.'],
];
add('tle', {
  id: 'ltsvt-corps', label: 'Comportements, mouvement, énergie, glycémie et stress', skill: 'ltsvt.corps',
  chapters: ['tle-svt-reflexes', 'tle-svt-mouvement-volontaire', 'tle-svt-cerveau', 'tle-svt-cellule-musculaire', 'tle-svt-atp', 'tle-svt-glucose', 'tle-svt-stress', 'tle-svt-stress-chronique'],
  description: 'Réflexes, commande du mouvement volontaire, plasticité, contraction et ATP, régulation de la glycémie, stress.',
  facts: true,
  make(rand) { return qcm(rand, pick(rand, CORPS)); },
});

export const LYCEE_SVT_1T = GEN;
export const LYCEE_SVT_1T_SKILLS = [
  ['l1svt.genetique', '1re', 'Génétique et expression des gènes'], ['l1svt.terre', '1re', 'Dynamique de la Terre et écosystèmes'], ['l1svt.immunite', '1re', 'Immunité innée et adaptative'],
  ['ltsvt.genetique', 'tle', 'Méiose, brassages et génétique des populations'], ['ltsvt.terre-climat', 'tle', 'Temps géologiques et climats'],
  ['ltsvt.plantes', 'tle', 'La plante productrice et domestiquée'], ['ltsvt.corps', 'tle', 'Mouvement, énergie, glycémie et stress'],
].map(([id, level, label]) => ({ subject: 'svt', id, label, level, track: 'classe', status: 'programme', domain: 'lycee', prereqs: [], editorialLevel: true }));
