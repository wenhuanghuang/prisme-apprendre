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
