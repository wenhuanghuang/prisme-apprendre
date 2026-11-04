/**
 * Géographie du lycée : questions de cours à choix, expliquées, rattachées aux thèmes de géographie des parcours de
 * référence hg-2nde, hg-1re et hg-tle (risques, ressources, démographie, métropoles, espaces productifs, mers et
 * océans, Union européenne…). Les repères chiffrés retenus sont stables et arrondis.
 */
import { pick } from './gen-util.js';
import { qcm } from './primaire-savoirs.js';

const GEN = [];
function add(level, g) {
  const { make, ...rest } = g;
  GEN.push({ tracks: ['classe', 'approfondissement'], options: [], levels: [level], subject: 'hg', facts: true, ...rest, make(rand, o = {}, tier = 'classe') { return make(rand, tier !== 'classe'); } });
}

const G2 = [
  ['Un risque naît de la rencontre entre…', 'un aléa et des enjeux vulnérables', ['deux catastrophes', 'une saison et un climat', 'un relief et une ville'], 'Un séisme dans un désert vide n’est pas un risque majeur ; près d’une ville mal préparée, il l’est.'],
  ['L’indice de développement humain (IDH) combine…', 'la santé, l’éducation et le niveau de vie', ['la superficie, le climat et le relief', 'le nombre d’habitants seulement', 'la production d’énergie seulement'], 'Espérance de vie, durée de scolarisation, revenu par habitant.'],
  ['La transition démographique, c’est le passage…', 'd’une forte natalité et mortalité à une faible natalité et mortalité', ['d’une ville à la campagne', 'd’un pays à un autre', 'de l’agriculture à l’industrie'], 'La mortalité baisse d’abord, la natalité ensuite : la population augmente fortement entre les deux.'],
  ['Depuis 2023, le pays le plus peuplé du monde est…', 'l’Inde', ['la Chine', 'les États-Unis', 'le Nigeria'], 'L’Inde a dépassé la Chine, dont la population commence à diminuer.'],
  ['La population mondiale a dépassé, en 2022,…', '8 milliards d’habitants', ['2 milliards', '4 milliards', '15 milliards'], 'Elle était d’environ 2,5 milliards en 1950.'],
  ['Quelle part de l’eau de la Terre est de l’eau douce ?', 'moins de 3 %', ['environ 50 %', 'environ 25 %', 'plus de 90 %'], 'Presque toute l’eau est salée ; une grande partie de l’eau douce est en plus bloquée dans les glaces.'],
  ['Quel pays accueille le plus de touristes internationaux ?', 'la France', ['le Brésil', 'l’Australie', 'le Canada'], 'La France est depuis longtemps en tête des arrivées de touristes internationaux.'],
  ['Quels territoires sont des départements et régions d’outre-mer (DROM) ?', 'Guadeloupe, Martinique, Guyane, La Réunion et Mayotte', ['la Corse et la Bretagne', 'la Nouvelle-Calédonie seulement', 'Monaco et Andorre'], 'Ces cinq territoires ont le même statut que les départements de métropole.'],
  ['En Afrique du Sud, la fin de l’apartheid est marquée par l’élection de Nelson Mandela comme président en…', '1994', ['1948', '1962', '2010'], 'Les premières élections au suffrage universel sans discrimination ont lieu en 1994.'],
  ['Une migration internationale, c’est…', 'un déplacement de population d’un pays à un autre pour s’y installer', ['un voyage touristique d’une semaine', 'un déménagement dans la même ville', 'un trajet domicile-travail'], 'On parle de migration quand le changement de résidence est durable.'],
  ['Le mix énergétique d’un pays, c’est…', 'la répartition des différentes sources d’énergie qu’il utilise', ['le prix de l’électricité', 'la quantité de pétrole qu’il exporte', 'le nombre de ses barrages'], 'En France, le nucléaire fournit environ les deux tiers de l’électricité.'],
  ['Quel pays possède les plus grandes réserves prouvées de pétrole ?', 'le Venezuela', ['la France', 'le Japon', 'l’Allemagne'], 'Il devance l’Arabie saoudite ; mais une grande partie de son pétrole est lourde et coûteuse à exploiter.'],
  ['Le stress hydrique désigne une situation où…', 'la demande en eau dépasse les ressources disponibles', ['il pleut trop', 'l’eau est trop froide', 'les rivières débordent'], 'Il touche surtout des régions arides et peuplées, comme le Moyen-Orient.'],
  ['Quel continent a la croissance démographique la plus rapide ?', 'l’Afrique', ['l’Europe', 'l’Amérique du Nord', 'l’Océanie'], 'Sa population pourrait atteindre environ 2,5 milliards d’habitants en 2050.'],
  ['Le vieillissement démographique, c’est…', 'la hausse de la part des personnes âgées dans la population', ['la baisse de l’espérance de vie', 'la hausse de la natalité', 'l’arrivée de jeunes migrants'], 'Le Japon et l’Europe sont particulièrement concernés.'],
  ['Quel est le premier risque naturel en France métropolitaine ?', 'l’inondation', ['l’éruption volcanique', 'le tsunami', 'le cyclone'], 'Les plans de prévention des risques encadrent la construction en zone inondable.'],
  ['La résilience d’un territoire, c’est sa capacité à…', 'faire face à une catastrophe et à s’en relever', ['empêcher tout aléa naturel', 'attirer des touristes', 'produire du pétrole'], 'Prévision, prévention, alerte, reconstruction : elle dépend aussi du niveau de développement.'],
  ['L’argent que les migrants envoient à leur famille restée au pays…', 'est une ressource importante pour de nombreux pays en développement', ['est interdit par l’ONU', 'n’existe plus aujourd’hui', 'ne représente presque rien'], 'Ces transferts dépassent souvent l’aide publique au développement reçue par ces pays.'],
  ['Le surtourisme, c’est…', 'une fréquentation touristique excessive qui dégrade un lieu et la vie des habitants', ['l’absence de touristes', 'le tourisme spatial', 'un voyage en avion'], 'Venise, Barcelone ou le Mont-Saint-Michel cherchent à réguler les flux.'],
  ['Le Cap, Johannesburg et Durban sont des villes…', 'd’Afrique du Sud', ['du Brésil', 'd’Australie', 'du Maroc'], 'L’Afrique du Sud est la puissance économique de l’Afrique australe.'],
  ['L’Afrique australe est riche en ressources minières, notamment…', 'l’or, le platine et les diamants', ['le café et le cacao', 'le pétrole de la mer du Nord', 'le riz'], 'L’Afrique du Sud est le premier producteur mondial de platine.'],
];
add('2nde', {
  id: 'hg-l-geo-2nde', label: 'Géographie de seconde : risques, ressources, population, mobilités', skill: 'hg.l.geo-2nde',
  chapters: ['2nde-hg-g1-risques', '2nde-hg-g1-ressources', '2nde-hg-g1-france', '2nde-hg-g2-demographie', '2nde-hg-g2-developpement', '2nde-hg-g2-france', '2nde-hg-g3-migrations', '2nde-hg-g3-tourisme', '2nde-hg-g3-france', '2nde-hg-g4-afrique-australe'],
  description: 'Aléa et vulnérabilité, IDH, transition démographique, eau douce, tourisme, outre-mer, Afrique australe.',
  make(rand) { return qcm(rand, pick(rand, G2)); },
});

const G1 = [
  ['Une métropole est une grande ville qui…', 'concentre des fonctions de commandement et rayonne bien au-delà de sa région', ['compte forcément plus de 50 millions d’habitants', 'est toujours une capitale', 'n’a pas d’industrie'], 'Sièges d’entreprises, universités, institutions, aéroports : la métropole commande et attire.'],
  ['Quelle est l’agglomération la plus peuplée du monde ?', 'Tokyo', ['Paris', 'New York', 'Londres'], 'L’agglomération de Tokyo compte environ 37 millions d’habitants.'],
  ['La littoralisation désigne…', 'la concentration des hommes et des activités sur les littoraux', ['le recul des côtes', 'la pêche artisanale', 'la construction de digues'], 'Ports, industries et villes s’installent près des mers, portes de la mondialisation.'],
  ['La périurbanisation, c’est…', 'l’extension de l’urbanisation à la périphérie des villes, dans d’anciens espaces ruraux', ['le retour à la campagne de toute la population', 'la construction de gratte-ciel au centre', 'la disparition des villes'], 'Lotissements et zones d’activités gagnent les communes autour des villes.'],
  ['Un conflit d’usages oppose…', 'des acteurs qui veulent utiliser un même espace de façons différentes', ['deux pays en guerre', 'deux équipes sportives', 'des élèves et des professeurs'], 'Agriculteurs, résidents, touristes, promoteurs : des usages concurrents d’un même espace rural.'],
  ['Shenzhen, en Chine, est devenue une métropole à partir de…', 'la création d’une zone économique spéciale en 1980', ['la dynastie Ming', 'la construction de la Grande Muraille', 'les Jeux olympiques de 2008'], 'Ouverte aux capitaux étrangers, cette ancienne ville de pêcheurs compte aujourd’hui plus de 17 millions d’habitants.'],
  ['Quel pays est le premier exportateur mondial de marchandises ?', 'la Chine', ['la France', 'le Brésil', 'l’Inde'], 'La Chine est l’« atelier du monde » depuis les années 2000.'],
  ['Une chaîne de valeur mondiale signifie que…', 'les étapes de fabrication d’un produit sont réparties dans plusieurs pays', ['tout est fabriqué dans une seule usine', 'les produits ne sont vendus que dans un pays', 'les prix sont les mêmes partout'], 'Conception, composants, assemblage et vente se répartissent selon les coûts et les savoir-faire.'],
  ['En France, la plus grande aire d’attraction urbaine est de loin celle de…', 'Paris', ['Lyon', 'Marseille', 'Lille'], 'Environ 13 millions d’habitants, contre environ 2,3 millions pour celle de Lyon.'],
  ['La gentrification d’un quartier, c’est…', 'l’arrivée de ménages plus aisés qui transforment un quartier populaire', ['la construction d’une autoroute', 'le départ de tous les habitants', 'la création d’un parc national'], 'Les prix montent ; les habitants modestes peuvent être repoussés plus loin.'],
  ['Parmi les villes mondiales, au sommet de la hiérarchie urbaine, on trouve…', 'New York, Londres, Tokyo et Paris', ['Brest, Dijon et Pau', 'des villages de montagne', 'toutes les capitales'], 'Elles concentrent sièges de firmes, finance et institutions internationales.'],
  ['Un bidonville est…', 'un quartier d’habitat précaire, souvent sans eau courante ni assainissement', ['un quartier d’affaires', 'un centre historique rénové', 'une zone industrielle portuaire'], 'Environ un milliard de citadins vivent dans des quartiers informels.'],
  ['Un hub aéroportuaire est…', 'un aéroport où convergent de nombreuses lignes, avec des correspondances', ['un petit aérodrome de loisirs', 'une gare routière', 'un port de pêche'], 'Dubaï, Atlanta ou Paris-Charles-de-Gaulle en sont des exemples.'],
  ['Une zone industrialo-portuaire associe…', 'un port et des industries lourdes installées sur place', ['une station de ski et des hôtels', 'une université et un musée', 'des champs et des fermes'], 'Exemples : Fos-sur-Mer, Le Havre, Dunkerque.'],
  ['Dire que les espaces ruraux sont multifonctionnels, c’est dire qu’ils accueillent…', 'agriculture, résidences, tourisme et activités variées', ['uniquement de l’agriculture', 'uniquement des usines', 'aucune activité'], 'Les campagnes ne sont plus seulement agricoles.'],
  ['En France, la « diagonale des faibles densités » s’étend…', 'des Ardennes aux Pyrénées', ['de Lille à Strasbourg', 'de Brest à Nice', 'le long de la Méditerranée'], 'Les densités de population y sont faibles et certaines campagnes s’y dépeuplent.'],
  ['La Chine est devenue la deuxième économie mondiale (par son PIB) en…', '2010', ['1949', '1978', '2024'], 'Elle a dépassé le Japon ; seuls les États-Unis la devancent.'],
  ['Les réformes d’ouverture économique de la Chine ont été lancées…', 'par Deng Xiaoping, à partir de 1978', ['par Mao Zedong, en 1949', 'par Sun Yat-sen, en 1911', 'par Xi Jinping, en 2012'], 'Elles introduisent des mécanismes de marché et attirent les capitaux étrangers.'],
  ['En Chine, la politique de l’enfant unique est abandonnée en…', '2015', ['1949', '1979', '1990'], 'Instaurée à partir de 1979, elle laisse place à deux enfants autorisés en 2016, puis trois en 2021.'],
  ['Une mobilité pendulaire, c’est…', 'un trajet quotidien entre le domicile et le lieu de travail', ['un déménagement à l’étranger', 'un voyage touristique', 'une migration saisonnière'], 'Ces navettes s’allongent avec la périurbanisation.'],
];
add('1re', {
  id: 'hg-l-geo-1re', label: 'Géographie de première : métropoles, espaces productifs, espaces ruraux, Chine', skill: 'hg.l.geo-1re',
  chapters: ['1re-hg-g1-metropoles', '1re-hg-g1-inegales', '1re-hg-g1-france', '1re-hg-g2-production', '1re-hg-g2-flux', '1re-hg-g2-france', '1re-hg-g3-fragmentation', '1re-hg-g3-conflits', '1re-hg-g3-france', '1re-hg-g4-chine'],
  description: 'Métropolisation, littoralisation, périurbanisation, conflits d’usages, chaînes de valeur, la Chine.',
  make(rand) { return qcm(rand, pick(rand, G1)); },
});

const GT = [
  ['Jusqu’à quelle distance des côtes s’étend une zone économique exclusive (ZEE) ?', '200 milles marins (environ 370 km)', ['12 milles marins', '20 km', '1 000 km'], 'Dans sa ZEE, un État exploite les ressources (pêche, pétrole) ; les eaux territoriales s’arrêtent à 12 milles.'],
  ['Grâce à ses territoires d’outre-mer, la France possède…', 'la deuxième ZEE du monde', ['aucune ZEE', 'la plus petite ZEE d’Europe', 'une ZEE seulement en Méditerranée'], 'Environ 10 millions de km², juste derrière les États-Unis.'],
  ['Quelle part environ du commerce mondial de marchandises (en volume) passe par la mer ?', 'environ 80 %', ['environ 10 %', 'environ 30 %', 'la totalité'], 'Porte-conteneurs, vraquiers et pétroliers transportent l’essentiel des marchandises.'],
  ['Le canal de Suez relie…', 'la mer Méditerranée et la mer Rouge', ['l’Atlantique et le Pacifique', 'la Manche et la mer du Nord', 'la mer Noire et la Caspienne'], 'Ouvert en 1869, il évite le contournement de l’Afrique.'],
  ['Le canal de Panama relie…', 'l’océan Atlantique et l’océan Pacifique', ['la Méditerranée et la mer Rouge', 'l’océan Indien et le Pacifique', 'deux lacs américains'], 'Ouvert en 1914, il traverse l’isthme de Panama.'],
  ['Combien d’États compte l’Union européenne depuis la sortie du Royaume-Uni (2020) ?', '27', ['12', '15', '28'], 'Le Royaume-Uni a quitté l’Union le 31 janvier 2020.'],
  ['L’espace Schengen permet…', 'de circuler sans contrôle systématique aux frontières entre les pays membres', ['d’utiliser l’euro', 'de voter dans tous les pays', 'de ne pas payer d’impôts'], 'Il ne coïncide pas exactement avec l’Union européenne : la Suisse et la Norvège en font partie.'],
  ['Combien de pays utilisent l’euro depuis l’entrée de la Croatie en 2023 ?', '20', ['27', '12', '6'], 'La zone euro ne regroupe pas tous les États de l’Union.'],
  ['Les politiques de cohésion de l’Union européenne visent à…', 'réduire les écarts de développement entre les régions', ['supprimer les régions', 'fermer les frontières extérieures', 'fixer les prix des produits'], 'Les fonds européens (comme le FEDER) financent des projets dans les régions les moins développées.'],
  ['Un détroit très fréquenté par les navires entre l’océan Indien et la mer de Chine est…', 'le détroit de Malacca', ['le détroit de Gibraltar', 'le Pas de Calais', 'le détroit de Béring'], 'Des dizaines de milliers de navires l’empruntent chaque année : c’est un point de passage stratégique.'],
  ['Le premier port de conteneurs du monde est…', 'Shanghai', ['Le Havre', 'Marseille', 'New York'], 'Les plus grands ports à conteneurs sont asiatiques ; Rotterdam est le premier port d’Europe.'],
  ['La convention de Montego Bay (1982), sur le droit de la mer, définit notamment…', 'les eaux territoriales et les zones économiques exclusives', ['les fuseaux horaires', 'les frontières terrestres de l’Europe', 'les couloirs aériens'], 'Elle encadre l’appropriation des espaces maritimes par les États.'],
  ['La haute mer, au-delà des ZEE, est un espace…', 'qui n’appartient à aucun État, où la navigation est libre', ['qui appartient à l’ONU', 'qui appartient aux États-Unis', 'interdit aux navires'], 'Un traité de l’ONU sur la biodiversité en haute mer a été adopté en 2023.'],
  ['La plus grande partie de la ZEE française se trouve…', 'autour des territoires d’outre-mer, surtout dans le Pacifique', ['en Méditerranée', 'dans la Manche', 'autour de la Corse'], 'La Polynésie française et la Nouvelle-Calédonie en représentent une grande part.'],
  ['Une firme transnationale est une entreprise qui…', 'possède des filiales dans plusieurs pays', ['ne vend que dans son pays', 'appartient forcément à un État', 'n’a qu’une seule usine'], 'Les firmes transnationales organisent les chaînes de valeur mondiales.'],
  ['La conteneurisation a permis…', 'de baisser fortement le coût du transport maritime', ['de supprimer les ports', 'de ralentir le commerce mondial', 'de remplacer les navires par des trains'], 'La boîte standard passe facilement du navire au camion ou au train.'],
  ['L’Organisation mondiale du commerce (OMC) a pour but…', 'd’encadrer le commerce international et de réduire les obstacles aux échanges', ['de fixer le prix du pétrole', 'de diriger l’Union européenne', 'de construire des ports'], 'Créée en 1995, elle compte plus de 160 membres.'],
  ['Les régions ultrapériphériques de l’Union européenne sont…', 'des territoires éloignés du continent mais membres de l’Union, comme La Réunion ou les Canaries', ['des pays candidats à l’Union', 'des régions hors de l’Union', 'les capitales européennes'], 'Elles reçoivent des aides spécifiques pour compenser leur éloignement.'],
  ['La Commission européenne siège à…', 'Bruxelles', ['Strasbourg', 'Francfort', 'Genève'], 'Le Parlement européen siège à Strasbourg ; la Banque centrale européenne est à Francfort.'],
  ['Combien de régions compte la France métropolitaine depuis 2016 ?', '13', ['22', '18', '27'], 'Avec les 5 régions d’outre-mer, la France compte 18 régions.'],
  ['Une coopération transfrontalière permet…', 'à des territoires voisins, de part et d’autre d’une frontière, de mener des projets communs', ['de supprimer une frontière', 'de créer un nouveau pays', 'd’interdire le travail frontalier'], 'Exemple : l’Eurométropole Lille-Kortrijk-Tournai, avec la Belgique.'],
];
add('tle', {
  id: 'hg-l-geo-tle', label: 'Géographie de terminale : mers et océans, mondialisation, Union européenne', skill: 'hg.l.geo-tle',
  chapters: ['tle-hg-g1-vecteurs', 'tle-hg-g1-appropriation', 'tle-hg-g1-france', 'tle-hg-g2-integration', 'tle-hg-g2-cooperations', 'tle-hg-g2-france', 'tle-hg-g3-politiques', 'tle-hg-g3-ouverture', 'tle-hg-g3-france', 'tle-hg-g4-france-regions'],
  description: 'ZEE, routes et canaux maritimes, détroits, Union européenne, espace Schengen, zone euro, cohésion des territoires.',
  make(rand) { return qcm(rand, pick(rand, GT)); },
});

export const LYCEE_HG = GEN;
export const LYCEE_HG_SKILLS = [
  ['hg.l.geo-2nde', '2nde', 'Géographie de seconde : risques, ressources, population, mobilités'],
  ['hg.l.geo-1re', '1re', 'Géographie de première : métropoles, espaces productifs et ruraux, Chine'],
  ['hg.l.geo-tle', 'tle', 'Géographie de terminale : mers et océans, mondialisation, Union européenne'],
].map(([id, level, label]) => ({ subject: 'hg', id, label, level, track: 'classe', status: 'programme', domain: 'lycee', prereqs: [], editorialLevel: true }));
