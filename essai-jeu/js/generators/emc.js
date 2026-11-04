/**
 * Enseignement moral et civique, du CP à la terminale : une banque de questions par cycle (règles de vie et
 * symboles, droits de l'enfant et laïcité, institutions et libertés, Constitution et droits fondamentaux), et un
 * générateur par classe rattaché au chapitre de cette classe dans le parcours de référence (emc-2024-<classe>).
 */
import { pick } from './gen-util.js';
import { qcm } from './primaire-savoirs.js';

const C2 = [
  ['En classe, pour prendre la parole, on…', 'lève la main et on attend son tour', ['crie plus fort que les autres', 'coupe la parole', 'se lève et part'], 'Attendre son tour permet à chacun d’être écouté.'],
  ['Un camarade se moque sans arrêt d’un autre élève. Que faire ?', 'en parler à un adulte de l’école', ['rire avec lui', 'ne rien dire à personne', 'se moquer à son tour'], 'Le harcèlement n’est jamais un jeu : en parler, c’est aider.'],
  ['Filles et garçons ont-ils les mêmes droits ?', 'oui, ils sont égaux', ['non, les garçons en ont plus', 'non, les filles en ont plus', 'seulement à l’école'], 'L’égalité entre les filles et les garçons est un principe de la République.'],
  ['Quand je suis en colère, il vaut mieux…', 'dire avec des mots ce que je ressens', ['taper', 'casser un objet', 'insulter'], 'Exprimer ses émotions par des mots aide à se faire comprendre et à se calmer.'],
  ['Pour traverser la rue, on…', 'utilise le passage piéton et on regarde des deux côtés', ['court entre les voitures', 'traverse sans regarder', 'joue au ballon sur la route'], 'On attend le feu vert pour les piétons et on vérifie qu’aucune voiture n’arrive.'],
  ['Quel numéro appeler pour joindre le SAMU (urgence médicale) ?', 'le 15', ['le 17', 'le 18', 'le 3018'], '15 : SAMU ; 17 : police ; 18 : pompiers ; 112 : numéro d’urgence européen.'],
  ['Quelles sont les couleurs du drapeau français ?', 'bleu, blanc, rouge', ['vert, blanc, rouge', 'bleu, jaune, rouge', 'noir, rouge, or'], 'Le drapeau tricolore est un symbole de la République.'],
  ['Quelle est la devise de la République française ?', 'Liberté, Égalité, Fraternité', ['Travail, Famille, Patrie', 'Un pour tous, tous pour un', 'Paix et Amour'], 'Elle est inscrite sur les mairies et les écoles.'],
];
const C3 = [
  ['En quelle année a été adoptée la Convention internationale des droits de l’enfant ?', '1989', ['1789', '1945', '2005'], 'Adoptée par l’ONU en 1989, elle protège notamment le droit à l’éducation, à la santé et à être protégé.'],
  ['« Les hommes naissent et demeurent libres et égaux en droits » : c’est l’article 1er…', 'de la Déclaration des droits de l’homme et du citoyen de 1789', ['du Code de la route', 'du règlement de l’école', 'de la Constitution américaine'], 'Ce texte fondateur a été adopté pendant la Révolution française.'],
  ['La laïcité, à l’école publique, signifie que…', 'l’école est neutre et respecte la liberté de conscience de chacun', ['les religions sont interdites dans le pays', 'chacun doit avoir la même religion', 'on n’étudie pas l’histoire des religions'], 'La loi de 1905 sépare les Églises et l’État ; chacun est libre de croire ou de ne pas croire.'],
  ['Qui dirige la commune ?', 'le maire, avec le conseil municipal élu', ['le président de la République', 'le directeur de l’école', 'le préfet seul'], 'Les habitants élisent le conseil municipal, qui élit le maire.'],
  ['Pourquoi le vote est-il secret ?', 'pour que chacun choisisse librement, sans pression', ['pour gagner du temps', 'parce que c’est interdit de voter', 'pour que personne ne vote'], 'On vote seul dans l’isoloir et on glisse son bulletin dans une enveloppe.'],
  ['À quoi sert l’ONU ?', 'à maintenir la paix et favoriser la coopération entre les pays', ['à organiser les Jeux olympiques', 'à fabriquer de la monnaie', 'à diriger la France'], 'L’Organisation des Nations unies a été créée en 1945.'],
  ['Être solidaire, c’est…', 'aider les autres, en particulier ceux qui en ont besoin', ['garder tout pour soi', 'se moquer des autres', 'faire toujours tout seul'], 'La fraternité de la devise républicaine se traduit par la solidarité.'],
  ['Le règlement intérieur d’une école sert à…', 'fixer des règles communes pour bien vivre ensemble', ['punir le plus souvent possible', 'choisir les vacances', 'désigner le meilleur élève'], 'Les règles protègent chacun et s’appliquent à tous.'],
];
const C4 = [
  ['Le pouvoir législatif (voter les lois) appartient…', 'au Parlement : l’Assemblée nationale et le Sénat', ['au président de la République seul', 'aux juges', 'aux maires'], 'La séparation des pouvoirs distingue le législatif, l’exécutif et le judiciaire.'],
  ['Le président de la République est élu…', 'pour cinq ans, au suffrage universel direct', ['à vie', 'par les députés seulement', 'pour deux ans'], 'Le quinquennat existe depuis l’élection de 2002.'],
  ['En France, la majorité civile (et le droit de vote) est fixée à…', '18 ans', ['16 ans', '21 ans', '15 ans'], 'Elle est à 18 ans depuis 1974.'],
  ['La liberté d’expression a-t-elle des limites ?', 'oui : la loi interdit par exemple la diffamation et l’incitation à la haine', ['non, on peut tout dire', 'oui, il est interdit de critiquer', 'non, sauf à l’école'], 'Elle s’exerce dans le respect des droits des autres.'],
  ['Depuis quand les femmes ont-elles le droit de vote en France ?', '1944', ['1789', '1848', '1981'], 'Elles votent pour la première fois en 1945.'],
  ['En quelle année la peine de mort a-t-elle été abolie en France ?', '1981', ['1848', '1905', '2001'], 'Loi portée par Robert Badinter, ministre de la Justice.'],
  ['À 16 ans, tout jeune Français doit…', 'se faire recenser à la mairie', ['faire son service militaire', 'voter', 'passer le permis de conduire'], 'Le recensement permet d’être convoqué à la Journée défense et citoyenneté (JDC).'],
  ['La Sécurité sociale, créée en 1945, est un exemple de…', 'solidarité : chacun cotise selon ses moyens et reçoit selon ses besoins', ['propriété privée', 'liberté d’expression', 'laïcité'], 'Elle protège contre les risques de la vie : maladie, vieillesse, accidents du travail.'],
  ['Le pouvoir judiciaire est exercé par…', 'les juges et les tribunaux', ['les députés', 'le gouvernement', 'les journalistes'], 'Ils jugent de façon indépendante, selon la loi.'],
];
const LYC = [
  ['La Constitution de la Ve République date…', 'du 4 octobre 1958', ['du 14 juillet 1789', 'de 1905', 'de 1946'], 'Elle fixe l’organisation des pouvoirs et les droits fondamentaux, avec son préambule.'],
  ['Quel organe vérifie que les lois respectent la Constitution ?', 'le Conseil constitutionnel', ['le Sénat', 'la Cour des comptes', 'le conseil municipal'], 'Il peut être saisi avant la promulgation, ou par un citoyen lors d’un procès (question prioritaire de constitutionnalité).'],
  ['La Cour européenne des droits de l’homme siège à…', 'Strasbourg', ['Bruxelles', 'Genève', 'New York'], 'Elle veille au respect de la Convention européenne des droits de l’homme.'],
  ['Le Défenseur des droits est une autorité qui…', 'aide les personnes victimes de discriminations ou d’atteintes à leurs droits', ['vote les lois', 'dirige l’armée', 'collecte les impôts'], 'On peut le saisir gratuitement.'],
  ['Un référendum permet…', 'aux citoyens de décider directement par un vote', ['aux députés de démissionner', 'au président de nommer les juges', 'de supprimer les élections'], 'C’est un instrument de démocratie directe.'],
  ['La loi sur la parité (2000) vise à…', 'favoriser l’égal accès des femmes et des hommes aux mandats électoraux', ['interdire le vote des femmes', 'réserver les mandats aux hommes', 'supprimer les élections locales'], 'Elle impose par exemple des listes alternant femmes et hommes à certaines élections.'],
  ['Le RGPD, appliqué depuis 2018, protège…', 'les données personnelles des citoyens européens', ['les monuments historiques', 'les espèces menacées', 'les brevets industriels'], 'Il donne par exemple le droit d’accéder à ses données et de demander leur suppression.'],
  ['Délibérer, en démocratie, c’est…', 'débattre en échangeant des arguments avant de décider', ['décider seul et vite', 'tirer au sort sans discuter', 'refuser tout désaccord'], 'La délibération suppose d’écouter les arguments contraires.'],
];

const BANKS = { cp: C2, ce1: C2, ce2: C2, cm1: C3, cm2: C3, '6e': C3, '5e': C4, '4e': C4, '3e': C4, '2nde': LYC, '1re': LYC, tle: LYC };
const LABEL = { cp: 'CP', ce1: 'CE1', ce2: 'CE2', cm1: 'CM1', cm2: 'CM2', '6e': '6e', '5e': '5e', '4e': '4e', '3e': '3e', '2nde': 'seconde', '1re': 'première', tle: 'terminale' };
const SKILL_OF = { cp: 'emc.c2', ce1: 'emc.c2', ce2: 'emc.c2', cm1: 'emc.c3', cm2: 'emc.c3', '6e': 'emc.c3', '5e': 'emc.c4', '4e': 'emc.c4', '3e': 'emc.c4', '2nde': 'emc.lycee', '1re': 'emc.lycee', tle: 'emc.lycee' };

// en 5e et en 4e, le parcours rédigé (préféré au parcours de référence) a ses propres chapitres
const WRITTEN = { '5e': ['emc5-egalite-discriminations', 'emc5-solidarite'], '4e': ['emc4-etat-droit-libertes', 'emc4-securite-defense'] };

export const EMC = Object.entries(BANKS).map(([lv, bank]) => ({
  id: `emc-${lv}`, subject: 'emc', levels: [lv], label: `EMC (${LABEL[lv]}) : vivre ensemble, droits et institutions`, skill: SKILL_OF[lv],
  chapters: [`emc-2024-${lv}`, ...(WRITTEN[lv] || [])], facts: true, tracks: ['classe', 'approfondissement'], options: [],
  description: 'Règles de vie, symboles et valeurs de la République, droits, laïcité, institutions et libertés : questions expliquées.',
  make(rand) { return qcm(rand, pick(rand, bank)); },
}));
export const EMC_SKILLS = [
  ['emc.c2', 'cp', 'EMC cycle 2 : règles de vie, respect, symboles de la République'],
  ['emc.c3', 'cm1', 'EMC cycle 3 : droits de l’enfant, laïcité, démocratie locale, solidarité'],
  ['emc.c4', '5e', 'EMC cycle 4 : institutions, libertés et droits, citoyenneté'],
  ['emc.lycee', '2nde', 'EMC au lycée : Constitution, droits fondamentaux, démocratie'],
].map(([id, level, label]) => ({ subject: 'emc', id, label, level, track: 'classe', status: 'programme', domain: 'emc', prereqs: [], editorialLevel: true }));
