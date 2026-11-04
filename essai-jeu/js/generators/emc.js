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
  ['Que veut dire « respecter » les autres ?', 'faire attention à eux, à leurs différences et à leurs affaires', ['faire tout ce qu’on veut', 'ignorer les règles', 'ne parler à personne'], 'Respecter, c’est traiter les autres comme on aimerait être traité.'],
  ['Quel numéro appeler pour joindre les pompiers ?', 'le 18', ['le 15', 'le 17', 'le 10'], '18 : pompiers ; 15 : SAMU ; 17 : police ; 112 : numéro d’urgence européen.'],
  ['Quel numéro appeler pour joindre la police ?', 'le 17', ['le 15', 'le 18', 'le 12'], '17 : police ; 15 : SAMU ; 18 : pompiers ; 112 : numéro d’urgence européen.'],
  ['Quel est l’hymne national de la France ?', 'La Marseillaise', ['Au clair de la lune', 'Frère Jacques', 'Le Chant des oiseaux'], 'Écrite par Rouget de Lisle en 1792, elle est devenue l’hymne national.'],
  ['Qui est Marianne ?', 'une figure qui représente la République française', ['une reine de France', 'la première présidente', 'une chanteuse célèbre'], 'Son buste se trouve dans les mairies ; on la voit aussi sur les timbres.'],
  ['Le 14 juillet, on fête…', 'la fête nationale', ['Noël', 'la fête des mères', 'la rentrée des classes'], 'Elle rappelle la prise de la Bastille (1789) et la fête de la Fédération (1790).'],
  ['Un camarade est tombé dans la cour et s’est fait mal. Que faire ?', 'prévenir tout de suite un adulte', ['le laisser seul', 'se moquer de lui', 'continuer à jouer sans rien dire'], 'Alerter un adulte, c’est le premier geste pour porter secours.'],
  ['À la cantine, pour ne pas gaspiller, on…', 'prend seulement ce qu’on va manger', ['prend le double de ce qu’on mange', 'cache la nourriture sous la table', 'lance son pain aux autres'], 'Éviter le gaspillage, c’est respecter le travail des autres et la planète.'],
  ['Une bouteille en plastique vide va…', 'dans la poubelle de tri, pour être recyclée', ['par terre dans la cour', 'dans la nature', 'dans les toilettes'], 'Les emballages triés servent à fabriquer de nouveaux objets.'],
  ['Un nouvel élève arrive d’un autre pays et parle encore mal français. On…', 'l’accueille et on l’aide', ['l’empêche de jouer', 'se moque de son accent', 'fait comme s’il n’existait pas'], 'Chacun a sa place à l’école, quelles que soient ses origines.'],
  ['Que veut dire « coopérer » ?', 'travailler ensemble pour réussir', ['gagner seul contre tous', 'refuser d’aider', 'tricher'], 'En coopérant, on met en commun les idées et les efforts de chacun.'],
  ['Dans le bus, une personne âgée reste debout. On peut…', 'lui proposer sa place', ['faire semblant de ne pas la voir', 'poser son sac sur le siège libre', 'la bousculer'], 'La politesse et l’attention aux autres rendent la vie commune plus agréable.'],
  ['En voiture, un enfant doit…', 'être attaché, avec un siège adapté ou un rehausseur', ['se tenir debout', 'voyager sans ceinture', 's’asseoir sur les genoux d’un adulte'], 'La ceinture protège en cas de freinage brusque ou d’accident.'],
  ['À vélo, pour protéger sa tête, on porte…', 'un casque', ['une casquette', 'un bonnet', 'rien du tout'], 'Le casque est obligatoire à vélo pour les enfants de moins de 12 ans, conducteurs ou passagers.'],
  ['Le 119 est un numéro à appeler…', 'quand un enfant est en danger ou maltraité', ['pour commander un repas', 'pour connaître la météo', 'pour réserver un train'], 'Allô Enfance en danger : gratuit, jour et nuit, et il n’apparaît pas sur les factures.'],
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
  ['Quel numéro appeler en cas de harcèlement, à l’école ou en ligne ?', 'le 3018', ['le 15', 'le 18', 'le 12'], 'Le 3018 est gratuit et confidentiel ; il aide aussi en cas de cyberharcèlement.'],
  ['Les conseillers municipaux sont élus pour…', 'six ans', ['un an', 'dix ans', 'toute leur vie'], 'Ils élisent ensuite le maire parmi eux.'],
  ['Aux élections municipales, en France, peuvent voter…', 'les citoyens français majeurs et les citoyens européens qui habitent la commune', ['tous les enfants', 'seulement les maires', 'seulement les hommes'], 'Les citoyens de l’Union européenne résidant en France votent aux municipales et aux européennes.'],
  ['Discriminer quelqu’un, c’est…', 'le traiter plus mal à cause de son origine, de son sexe, de son handicap…', ['l’aider', 'le féliciter', 'jouer avec lui'], 'Les discriminations sont interdites et punies par la loi.'],
  ['Le drapeau de l’Union européenne est…', 'bleu, avec un cercle de douze étoiles jaunes', ['rouge avec une étoile', 'vert avec un cercle blanc', 'bleu, blanc, rouge'], 'Les douze étoiles symbolisent l’unité et l’harmonie, pas le nombre de pays.'],
  ['Un conseil municipal d’enfants permet…', 'aux enfants de proposer et de mener des projets pour leur commune', ['aux enfants de diriger la police', 'aux enfants de choisir le maire', 'de supprimer l’école'], 'C’est une façon d’apprendre la démocratie en y participant.'],
  ['Un délégué de classe…', 'représente les élèves et porte leur parole', ['punit les autres élèves', 'remplace le professeur', 'décide seul des règles'], 'Il est élu par ses camarades, à bulletin secret.'],
  ['En France, l’instruction est obligatoire…', 'de 3 à 16 ans', ['de 6 à 10 ans', 'de 10 à 20 ans', 'seulement pour les garçons'], 'Depuis 2019, elle commence dès 3 ans ; les lois Jules Ferry l’avaient rendue obligatoire de 6 à 13 ans (1882).'],
  ['Qui a rendu l’école publique gratuite, laïque et obligatoire dans les années 1880 ?', 'Jules Ferry', ['Napoléon Ier', 'Louis XIV', 'Charles de Gaulle'], 'Les lois Ferry (1881-1882) ont fondé l’école de la République.'],
  ['Les impôts servent notamment à payer…', 'les écoles, les hôpitaux et les routes', ['les vacances des voisins', 'les jouets des adultes', 'rien du tout'], 'Les services publics sont financés en commun, chacun selon ses moyens.'],
  ['Lequel de ces exemples est un service public ?', 'les pompiers', ['un magasin de jouets', 'une pizzeria', 'une salle de sport privée'], 'Un service public répond à un besoin de tous et s’adresse à tous, comme l’école ou les hôpitaux publics.'],
  ['Publier la photo d’un camarade sans son accord…', 'n’est pas permis : chacun a droit à son image', ['est toujours permis', 'est obligatoire', 'est un cadeau à lui faire'], 'Le droit à l’image protège chacun : on demande d’abord l’autorisation.'],
  ['Le 11 novembre, on commémore…', 'la fin de la Première Guerre mondiale', ['la prise de la Bastille', 'la fin de la Seconde Guerre mondiale', 'la naissance de Jules Ferry'], 'L’armistice a été signé le 11 novembre 1918.'],
  ['Le 8 mai, on commémore…', 'la victoire de 1945 et la fin de la Seconde Guerre mondiale en Europe', ['la prise de la Bastille', 'la fin de la Première Guerre mondiale', 'la fête du travail'], 'L’Allemagne nazie capitule le 8 mai 1945.'],
  ['Une association, c’est…', 'un groupe de personnes réunies librement autour d’un projet commun, sans but de s’enrichir', ['une entreprise qui vend des voitures', 'un club obligatoire pour tous', 'une banque'], 'La liberté d’association est garantie par la loi de 1901.'],
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
  ['Les députés sont élus…', 'pour cinq ans au plus, au suffrage universel direct', ['pour sept ans, par les maires', 'pour deux ans, par tirage au sort', 'à vie'], 'Ils sont 577 à siéger à l’Assemblée nationale ; une dissolution peut abréger leur mandat.'],
  ['Les sénateurs sont élus…', 'au suffrage universel indirect, par des élus (les grands électeurs)', ['directement par tous les citoyens', 'par le président de la République', 'par tirage au sort'], 'Élus pour six ans, ils représentent les collectivités territoriales.'],
  ['Qui nomme le Premier ministre ?', 'le président de la République', ['le Sénat', 'les maires', 'le Conseil constitutionnel'], 'Le Premier ministre dirige l’action du gouvernement, responsable devant l’Assemblée nationale.'],
  ['Un État de droit est un État où…', 'tous, y compris les dirigeants, doivent respecter la loi', ['le chef peut faire ce qu’il veut', 'il n’existe pas de lois', 'seuls les juges votent'], 'Les droits de chacun y sont garantis par des juges indépendants.'],
  ['La présomption d’innocence signifie que…', 'toute personne est considérée comme innocente tant que sa culpabilité n’est pas prouvée', ['tout suspect est coupable', 'on ne juge jamais personne', 'les juges décident sans preuve'], 'Ce principe figure à l’article 9 de la Déclaration de 1789.'],
  ['La Journée défense et citoyenneté (JDC) concerne…', 'tous les jeunes Français, filles et garçons, après leur recensement', ['seulement les garçons', 'seulement les militaires', 'seulement les adultes de plus de 30 ans'], 'Le service militaire obligatoire a été suspendu en 1997 ; la JDC présente les enjeux de la défense.'],
  ['Qui vote le budget de l’État chaque année ?', 'le Parlement', ['le président de la République seul', 'les juges', 'les banques'], 'Le projet de loi de finances est préparé par le gouvernement puis voté par le Parlement.'],
  ['La loi de 1905 établit…', 'la séparation des Églises et de l’État', ['le droit de vote des femmes', 'l’abolition de l’esclavage', 'l’école obligatoire'], 'La République garantit le libre exercice des cultes et ne reconnaît, ne salarie ni ne subventionne aucun culte.'],
  ['L’esclavage a été définitivement aboli en France en…', '1848', ['1789', '1905', '1945'], 'Le décret d’abolition est porté par Victor Schœlcher.'],
  ['Le suffrage universel masculin est instauré en France en…', '1848', ['1789', '1944', '1958'], 'Les femmes n’obtiennent le droit de vote qu’en 1944.'],
  ['La CNIL veille…', 'à la protection des données personnelles et de la vie privée', ['à la qualité de l’eau', 'au respect du Code de la route', 'aux prix dans les magasins'], 'La Commission nationale de l’informatique et des libertés a été créée en 1978.'],
  ['Une fausse information diffusée volontairement pour tromper s’appelle…', 'une infox (fake news)', ['un éditorial', 'une dépêche', 'un démenti'], 'Vérifier la source et la date, et croiser avec d’autres médias permet de la repérer.'],
  ['Avant de partager une information vue sur un réseau social, il faut…', 'vérifier sa source et la comparer avec d’autres sources fiables', ['la partager vite, avant tout le monde', 'la croire si elle a beaucoup de « j’aime »', 'y ajouter des détails inventés'], 'Le nombre de partages ne prouve pas qu’une information est vraie.'],
  ['Combien d’États compte l’Union européenne ?', '27', ['12', '15', '50'], 'Depuis le départ du Royaume-Uni en 2020, l’Union européenne compte 27 États membres.'],
  ['Le droit de grève est…', 'reconnu par la Constitution (préambule de 1946)', ['interdit en France', 'réservé aux élèves', 'réservé au président'], 'Il s’exerce dans le cadre des lois qui le réglementent.'],
  ['Un mineur qui commet une infraction est jugé…', 'par une justice adaptée : juge des enfants, tribunal pour enfants', ['jamais', 'exactement comme un adulte', 'seulement par ses parents'], 'La justice des mineurs cherche d’abord à éduquer ; la responsabilité dépend de l’âge et du discernement.'],
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
  ['Le gouvernement est responsable devant…', 'l’Assemblée nationale, qui peut le renverser par une motion de censure', ['le Sénat seul', 'le Conseil constitutionnel', 'les maires'], 'C’est un trait parlementaire de la Ve République (article 49).'],
  ['L’article 49, alinéa 3, de la Constitution permet au gouvernement…', 'de faire adopter un texte sans vote, sauf si une motion de censure est votée', ['de dissoudre le Sénat', 'de nommer les juges', 'de supprimer une élection'], 'Les députés peuvent alors renverser le gouvernement en votant la censure.'],
  ['Le président de la République peut dissoudre…', 'l’Assemblée nationale', ['le Sénat', 'le Conseil constitutionnel', 'les conseils municipaux'], 'Article 12 de la Constitution : de nouvelles élections législatives ont alors lieu.'],
  ['Le préambule de la Constitution de 1958 renvoie notamment…', 'à la Déclaration de 1789, au préambule de 1946 et à la Charte de l’environnement de 2004', ['au Code de la route', 'au traité de Versailles', 'à la Constitution américaine'], 'Ces textes forment, avec la Constitution, le « bloc de constitutionnalité ».'],
  ['La Convention européenne des droits de l’homme (1950) a été adoptée dans le cadre…', 'du Conseil de l’Europe', ['de l’Union européenne', 'de l’OTAN', 'de l’ONU'], 'Le Conseil de l’Europe, distinct de l’Union européenne, rassemble 46 États.'],
  ['La Déclaration universelle des droits de l’homme a été adoptée par l’ONU en…', '1948', ['1789', '1958', '1989'], 'Elle a été adoptée à Paris, au palais de Chaillot, le 10 décembre 1948.'],
  ['La laïcité garantit à chacun…', 'la liberté de croire ou de ne pas croire, et l’égalité devant la loi quelles que soient ses convictions', ['l’obligation de pratiquer une religion', 'l’interdiction de toute religion', 'une religion officielle de l’État'], 'Article 1er de la Constitution : la France est une République laïque.'],
  ['La loi de 2004 interdit, dans les écoles, collèges et lycées publics…', 'les signes ou tenues par lesquels les élèves manifestent ostensiblement une appartenance religieuse', ['toute religion dans le pays', 'l’enseignement du fait religieux', 'les fêtes religieuses en famille'], 'Elle s’applique aux élèves des établissements publics, pas à l’université.'],
  ['Un engagement possible de 16 à 25 ans, de 6 à 12 mois, indemnisé, dans une association ou un service public :', 'le service civique', ['le service militaire obligatoire', 'le mandat de député', 'le vote aux législatives'], 'Il est ouvert jusqu’à 30 ans aux jeunes en situation de handicap.'],
  ['Un lanceur d’alerte est une personne qui…', 'signale de bonne foi une menace ou une atteinte grave à l’intérêt général', ['diffuse des rumeurs pour nuire', 'travaille pour la météo', 'déclenche les alarmes incendie'], 'La loi le protège contre les représailles s’il respecte les procédures prévues.'],
  ['Le pluralisme des médias compte en démocratie parce qu’il…', 'permet d’accéder à des points de vue différents pour se forger une opinion', ['impose une seule opinion', 'supprime le débat', 'garantit que tout est vrai'], 'La liberté de la presse est garantie en France par la loi du 29 juillet 1881.'],
  ['L’abstention, lors d’une élection, désigne…', 'le fait de ne pas aller voter', ['le vote blanc', 'le vote par procuration', 'le vote à main levée'], 'Le vote blanc, lui, est compté à part depuis 2014 mais n’entre pas dans les suffrages exprimés.'],
  ['Voter par procuration, c’est…', 'confier à un autre électeur le soin de voter à sa place', ['voter deux fois', 'voter par téléphone', 'refuser de voter'], 'Utile quand on ne peut pas se rendre au bureau de vote le jour du scrutin.'],
  ['L’égalité devant la loi signifie que…', 'la loi est la même pour tous, sans distinction d’origine, de sexe ou de religion', ['chacun a la même fortune', 'tout le monde a le même métier', 'les lois changent selon les personnes'], 'Article 6 de la Déclaration de 1789 et article 1er de la Constitution.'],
  ['En 2018, le Conseil constitutionnel a reconnu la valeur constitutionnelle du principe de…', 'fraternité', ['propriété', 'laïcité', 'souveraineté'], 'Il en découle la liberté d’aider autrui, dans un but humanitaire.'],
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
