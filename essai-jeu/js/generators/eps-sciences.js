/**
 * EPS (tous niveaux), numérique au primaire, enseignement scientifique et sciences de l'ingénieur (lycée) :
 * banques de questions expliquées, rattachées aux chapitres des parcours de référence.
 */
import { pick } from './gen-util.js';
import { qcm } from './primaire-savoirs.js';

const ALL = ['cp', 'ce1', 'ce2', 'cm1', 'cm2', '6e', '5e', '4e', '3e', '2nde', '1re', 'tle'];
const EPS = [
  ['Pourquoi s’échauffe-t-on avant le sport ?', 'pour préparer le cœur, les muscles et les articulations et éviter les blessures', ['pour se fatiguer avant', 'pour gagner du temps', 'parce que c’est obligatoire, sans raison'], 'L’échauffement augmente progressivement la température des muscles et le rythme cardiaque.'],
  ['Pendant un effort, le cœur…', 'bat plus vite', ['s’arrête', 'bat plus lentement', 'ne change pas'], 'Les muscles ont besoin de plus de dioxygène : le cœur accélère pour leur en apporter.'],
  ['Combien de temps d’activité physique par jour l’OMS conseille-t-elle aux enfants et aux adolescents ?', 'au moins 60 minutes', ['5 minutes', 'une heure par semaine', 'aucune'], 'Jouer dehors, marcher, faire du vélo, du sport : tout compte.'],
  ['Pendant et après un effort, il faut…', 'boire de l’eau régulièrement', ['ne jamais boire', 'boire des sodas', 'manger des bonbons'], 'L’effort fait transpirer : on perd de l’eau qu’il faut remplacer.'],
  ['Combien de joueurs une équipe de football a-t-elle sur le terrain ?', '11', ['5', '7', '15'], 'Au basket : 5 ; au handball : 7 ; au volley : 6 ; au rugby à XV : 15.'],
  ['Combien de joueurs une équipe de basket-ball a-t-elle sur le terrain ?', '5', ['6', '7', '11'], 'Football 11, handball 7, volley 6, rugby à XV 15.'],
  ['Le fair-play, c’est…', 'respecter les règles, les adversaires et l’arbitre', ['gagner à tout prix', 'tricher sans se faire voir', 'se moquer des perdants'], 'Serrer la main de l’adversaire après un match en fait partie.'],
  ['Les cinq anneaux olympiques représentent…', 'l’union des cinq continents', ['cinq sports', 'cinq médailles', 'cinq villes'], 'Le symbole a été dessiné par Pierre de Coubertin, à l’origine des Jeux modernes (1896).'],
  ['Quelle ville a accueilli les Jeux olympiques d’été en 2024 ?', 'Paris', ['Londres', 'Tokyo', 'Los Angeles'], 'Paris avait déjà accueilli les Jeux en 1900 et en 1924.'],
  ['Après un effort intense, il est bon de…', 'récupérer : s’étirer doucement, boire, se reposer', ['recommencer aussitôt plus fort', 'ne plus bouger pendant une semaine', 'manger très salé'], 'La récupération aide le corps à se réparer et à progresser.'],
];
const NUM_P = [
  ['Pourquoi éviter les écrans juste avant de dormir ?', 'leur lumière gêne l’endormissement', ['ils rendent plus intelligent', 'ils réchauffent la chambre', 'ils réveillent les voisins'], 'Mieux vaut lire un livre ou discuter avant de dormir.'],
  ['Un inconnu te demande ton adresse dans un jeu en ligne. Que fais-tu ?', 'je ne réponds pas et j’en parle à un adulte', ['je la donne', 'je donne celle d’un ami', 'je lui envoie une photo de ma maison'], 'On ne donne jamais ses informations personnelles sur Internet.'],
  ['Un mot de passe, on le partage…', 'avec personne, sauf ses parents', ['avec tous ses amis', 'avec les inconnus gentils', 'sur Internet'], 'Un mot de passe protège ton compte : il reste secret.'],
  ['Un robot ou une intelligence artificielle…', 'suit des programmes écrits par des humains', ['pense et ressent comme un humain', 'ne se trompe jamais', 'est toujours vivant'], 'Une machine calcule ; elle peut se tromper, il faut vérifier.'],
  ['Tu vois une image ou une vidéo qui te fait peur sur Internet. Que fais-tu ?', 'j’en parle à un adulte de confiance', ['je la garde pour moi', 'je l’envoie à mes amis', 'je continue à regarder'], 'Les adultes sont là pour t’aider ; ce n’est pas ta faute.'],
  ['Une information lue sur Internet est-elle toujours vraie ?', 'non, il faut vérifier', ['oui, toujours', 'oui, si elle a beaucoup de « j’aime »', 'oui, si elle est en couleur'], 'On compare plusieurs sources et on demande à un adulte.'],
];
const ENS_SCI = [
  ['Ératosthène, il y a plus de 2 000 ans, a estimé…', 'la circonférence de la Terre, grâce aux ombres du Soleil', ['la distance de la Lune', 'l’âge de l’Univers', 'la vitesse de la lumière'], 'En comparant la longueur des ombres à Syène et à Alexandrie, il trouva une valeur remarquablement juste.'],
  ['Quel est l’âge de la Terre, d’après la datation radioactive ?', 'environ 4,5 milliards d’années', ['6 000 ans', '1 million d’années', '100 milliards d’années'], 'Il est établi par la datation de météorites, formées en même temps que la Terre.'],
  ['Une note jouée une octave plus haut a une fréquence…', 'deux fois plus grande', ['deux fois plus petite', 'identique', 'dix fois plus grande'], 'La4 : 440 Hz ; La5 : 880 Hz.'],
  ['La puissance rayonnée par le Soleil provient…', 'de réactions de fusion nucléaire en son cœur', ['de la combustion du charbon', 'de réactions chimiques avec l’oxygène', 'de la lumière des autres étoiles'], 'Des noyaux d’hydrogène fusionnent en hélium en libérant de l’énergie.'],
  ['Le bilan radiatif de la Terre : sans effet de serre, la température moyenne serait d’environ…', '−18 °C', ['+15 °C', '+40 °C', '−100 °C'], 'L’effet de serre naturel porte la moyenne à environ +15 °C ; les gaz émis par l’activité humaine le renforcent.'],
  ['Une énergie renouvelable…', 'se reconstitue à l’échelle humaine (soleil, vent, eau)', ['provient toujours du pétrole', 'ne produit jamais de déchets', 'est inépuisable et gratuite à produire'], 'Elles ont aussi des impacts (matériaux, surfaces), à comparer.'],
  ['La cellule est…', 'l’unité de base de tous les êtres vivants', ['un atome', 'un organe', 'une molécule d’eau'], 'Théorie cellulaire, établie au XIXe siècle.'],
];
const SI = [
  ['Dans une chaîne de puissance, un moteur électrique…', 'convertit l’énergie électrique en énergie mécanique', ['stocke l’énergie', 'mesure la température', 'transmet l’information'], 'Chaîne de puissance : alimenter, moduler, convertir, transmettre.'],
  ['Un capteur, dans un système, sert à…', 'acquérir une information sur une grandeur physique', ['transmettre un mouvement', 'stocker de l’énergie', 'convertir l’énergie électrique en chaleur'], 'Il fait partie de la chaîne d’information.'],
  ['Le rendement d’un système est…', 'le rapport entre la puissance utile et la puissance absorbée', ['toujours supérieur à 1', 'la masse du système', 'sa vitesse maximale'], 'η = Pu / Pa, inférieur à 1 à cause des pertes.'],
  ['Un diagramme des exigences (SysML) décrit…', 'ce que le système doit faire ou respecter', ['le prix de vente', 'la couleur du produit', 'le nom du fabricant'], 'On y lit les fonctions attendues et les contraintes, avec des critères.'],
  ['Simuler le comportement d’un système permet…', 'de prévoir ses performances avant de le fabriquer', ['de le fabriquer plus vite', 'de supprimer les tests réels', 'de le rendre plus lourd'], 'On compare ensuite simulation, mesures et cahier des charges.'],
];

export const EPS_SCIENCES = [
  { id: 'eps-sante', subject: 'eps', levels: ALL, facts: true, label: 'EPS : santé, sécurité, règles et olympisme', skill: 'eps.sante',
    chapters: ['eps-2020-champs', 'eps-c2c3-2026-deplacer', 'eps-c2c3-2026-equilibres', 'eps-c2c3-2026-exprimer', 'eps-c2c3-2026-cooperer', 'eps-c2c3-2026-6e', 'eps-lycee-2019-champs'],
    description: 'Échauffement, effort et cœur, activité physique quotidienne, hydratation, règles des sports collectifs, fair-play, Jeux olympiques.',
    tracks: ['classe', 'approfondissement'], options: [], make(rand) { return qcm(rand, pick(rand, EPS)); } },
  { id: 'num-primaire', subject: 'ia-numerique', levels: ['cp', 'ce1', 'ce2', 'cm1', 'cm2'], facts: true, label: 'Numérique : bien utiliser les écrans et Internet', skill: 'ia.primaire',
    chapters: ['ia-numerique-cadre-2026-crcn', 'ia-numerique-cadre-2026-pix-ia', 'ia-numerique-cadre-2026-attestation-6e', 'ia-numerique-cadre-2026-programmes'],
    description: 'Écrans et sommeil, informations personnelles, mots de passe, robots et IA, demander de l’aide, vérifier une information.',
    tracks: ['classe', 'approfondissement'], options: [], make(rand) { return qcm(rand, pick(rand, NUM_P)); } },
  { id: 'ens-sci', subject: 'ens-sci', levels: ['1re', 'tle'], facts: true, label: 'Enseignement scientifique', skill: 'enssci.bases',
    chapters: ['ens-sci-2023-1re', 'ens-sci-2023-tle'], description: 'Forme et âge de la Terre, son et musique, énergie du Soleil, bilan radiatif et effet de serre, énergies renouvelables, cellule.',
    tracks: ['classe', 'approfondissement'], options: [], make(rand) { return qcm(rand, pick(rand, ENS_SCI)); } },
  { id: 'si-bases', subject: 'si', levels: ['1re', 'tle'], facts: true, label: 'Sciences de l’ingénieur : chaînes, rendement, exigences', skill: 'si.bases',
    chapters: ['si-spe-1re-tle-2019-programme'], description: 'Chaîne de puissance et d’information, rendement, diagramme des exigences, simulation.',
    tracks: ['classe', 'approfondissement'], options: [], make(rand) { return qcm(rand, pick(rand, SI)); } },
];
export const EPS_SCIENCES_SKILLS = [
  ['eps', 'eps.sante', 'cp', 'EPS : santé, sécurité, règles et olympisme'], ['ia-numerique', 'ia.primaire', 'cp', 'Numérique au primaire : écrans, sécurité, esprit critique'],
  ['ens-sci', 'enssci.bases', '1re', 'Enseignement scientifique : Terre, son, énergie, climat'], ['si', 'si.bases', '1re', 'Sciences de l’ingénieur : chaînes, rendement, exigences'],
].map(([subject, id, level, label]) => ({ subject, id, label, level, track: 'classe', status: 'programme', domain: 'divers', prereqs: [], editorialLevel: true }));
