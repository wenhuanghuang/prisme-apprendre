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
  ['Combien de joueurs une équipe de handball a-t-elle sur le terrain ?', '7', ['5', '6', '11'], 'Six joueurs de champ et un gardien de but.'],
  ['Combien de joueurs une équipe de volley-ball a-t-elle sur le terrain ?', '6', ['5', '7', '11'], 'Au volley, une équipe renvoie le ballon en trois touches au plus.'],
  ['Au basket-ball, un panier réussi derrière la ligne à trois points rapporte…', '3 points', ['1 point', '2 points', '5 points'], 'Un panier à l’intérieur de la ligne vaut 2 points, un lancer franc 1 point.'],
  ['À la piscine, avant d’entrer dans l’eau, on…', 'se douche et on écoute les consignes', ['court au bord du bassin', 'plonge là où l’on n’a pas pied', 'pousse ses camarades dans l’eau'], 'On ne court jamais au bord du bassin : le sol mouillé est glissant.'],
  ['Savoir nager en sécurité, c’est…', 'pouvoir se déplacer dans l’eau, flotter et regagner le bord seul', ['nager très vite le crawl', 'gagner une compétition', 'plonger d’un plongeoir de 10 mètres'], 'L’attestation du savoir nager en sécurité se prépare à l’école et au collège.'],
  ['Pendant un effort, la respiration…', 's’accélère pour apporter plus de dioxygène aux muscles', ['s’arrête', 'ralentit', 'ne change pas'], 'Le cœur et les poumons travaillent ensemble pendant l’effort.'],
  ['En course d’orientation, on se repère avec…', 'une carte, et parfois une boussole', ['un ballon', 'une raquette', 'un sifflet'], 'On tient la carte orientée dans le même sens que le terrain.'],
  ['Quelle ville accueillera les Jeux olympiques d’été de 2028 ?', 'Los Angeles', ['Paris', 'Brisbane', 'Rome'], 'Après Paris 2024 viennent Los Angeles 2028, puis Brisbane 2032.'],
  ['Les Jeux paralympiques réunissent…', 'des sportifs en situation de handicap', ['seulement des enfants', 'seulement des sports d’hiver', 'des équipes de robots'], 'Ils ont lieu peu après les Jeux olympiques, dans la même ville.'],
  ['Pourquoi bien dormir aide-t-il à progresser en sport ?', 'pendant le sommeil, le corps récupère et les muscles se réparent', ['le sommeil remplace l’entraînement', 'on peut s’entraîner en dormant', 'cela ne sert à rien'], 'De 6 à 12 ans, il faut 9 à 12 heures de sommeil ; à l’adolescence, 8 à 10 heures.'],
];
const NUM_P = [
  ['Pourquoi éviter les écrans juste avant de dormir ?', 'leur lumière gêne l’endormissement', ['ils rendent plus intelligent', 'ils réchauffent la chambre', 'ils réveillent les voisins'], 'Mieux vaut lire un livre ou discuter avant de dormir.'],
  ['Un inconnu te demande ton adresse dans un jeu en ligne. Que fais-tu ?', 'je ne réponds pas et j’en parle à un adulte', ['je la donne', 'je donne celle d’un ami', 'je lui envoie une photo de ma maison'], 'On ne donne jamais ses informations personnelles sur Internet.'],
  ['Un mot de passe, on le partage…', 'avec personne, sauf ses parents', ['avec tous ses amis', 'avec les inconnus gentils', 'sur Internet'], 'Un mot de passe protège ton compte : il reste secret.'],
  ['Un robot ou une intelligence artificielle…', 'suit des programmes écrits par des humains', ['pense et ressent comme un humain', 'ne se trompe jamais', 'est toujours vivant'], 'Une machine calcule ; elle peut se tromper, il faut vérifier.'],
  ['Tu vois une image ou une vidéo qui te fait peur sur Internet. Que fais-tu ?', 'j’en parle à un adulte de confiance', ['je la garde pour moi', 'je l’envoie à mes amis', 'je continue à regarder'], 'Les adultes sont là pour t’aider ; ce n’est pas ta faute.'],
  ['Une information lue sur Internet est-elle toujours vraie ?', 'non, il faut vérifier', ['oui, toujours', 'oui, si elle a beaucoup de « j’aime »', 'oui, si elle est en couleur'], 'On compare plusieurs sources et on demande à un adulte.'],
  ['Un pseudo, sur Internet, c’est…', 'un surnom qui évite de donner son vrai nom', ['son adresse', 'son mot de passe', 'le nom de son école'], 'Un bon pseudo ne révèle ni son nom, ni son âge, ni où l’on habite.'],
  ['Un bon mot de passe est…', 'long et difficile à deviner', ['son prénom', '1234', 'le nom de son chien'], 'Une petite phrase secrète, avec des chiffres et des symboles, fait un bon mot de passe.'],
  ['Avant de mettre en ligne la photo d’un ami, il faut…', 'lui demander s’il est d’accord', ['la publier sans rien dire', 'la modifier pour se moquer', 'l’envoyer à des inconnus'], 'Chacun a le droit de décider de son image.'],
  ['Quelqu’un t’envoie chaque jour des messages méchants en ligne. C’est…', 'du cyberharcèlement : il faut en parler à un adulte, ou appeler le 3018', ['un jeu normal', 'de ta faute', 'un secret à garder'], 'Le 3018 est gratuit et aide les enfants victimes de harcèlement en ligne.'],
  ['Un algorithme, c’est…', 'une suite d’instructions pour réaliser une tâche', ['un animal', 'un ordinateur', 'un écran'], 'Une recette de cuisine est un algorithme : des étapes dans un ordre précis.'],
  ['Pour qu’un robot avance de 3 cases puis tourne, on lui donne…', 'des instructions, dans le bon ordre', ['des bonbons', 'une seule instruction au hasard', 'rien : il devine'], 'Un robot exécute exactement ce qu’on lui a programmé, dans l’ordre.'],
  ['Un message dit : « Tu as gagné un téléphone, clique ici ! » Que faire ?', 'ne pas cliquer et prévenir un adulte', ['cliquer vite', 'donner son adresse pour recevoir le cadeau', 'l’envoyer à tous ses amis'], 'Ces messages sont souvent des pièges pour voler des informations.'],
  ['Pour bien utiliser les écrans, on évite…', 'les écrans le matin avant l’école, pendant les repas et avant de dormir', ['de lire un livre', 'de jouer dehors', 'de parler en famille'], 'On garde du temps pour jouer, lire, bouger et dormir.'],
];
const ENS_SCI = [
  ['Ératosthène, il y a plus de 2 000 ans, a estimé…', 'la circonférence de la Terre, grâce aux ombres du Soleil', ['la distance de la Lune', 'l’âge de l’Univers', 'la vitesse de la lumière'], 'En comparant la longueur des ombres à Syène et à Alexandrie, il trouva une valeur remarquablement juste.'],
  ['Quel est l’âge de la Terre, d’après la datation radioactive ?', 'environ 4,5 milliards d’années', ['6 000 ans', '1 million d’années', '100 milliards d’années'], 'Il est établi par la datation de météorites, formées en même temps que la Terre.'],
  ['Une note jouée une octave plus haut a une fréquence…', 'deux fois plus grande', ['deux fois plus petite', 'identique', 'dix fois plus grande'], 'La4 : 440 Hz ; La5 : 880 Hz.'],
  ['La puissance rayonnée par le Soleil provient…', 'de réactions de fusion nucléaire en son cœur', ['de la combustion du charbon', 'de réactions chimiques avec l’oxygène', 'de la lumière des autres étoiles'], 'Des noyaux d’hydrogène fusionnent en hélium en libérant de l’énergie.'],
  ['Le bilan radiatif de la Terre : sans effet de serre, la température moyenne serait d’environ…', '−18 °C', ['+15 °C', '+40 °C', '−100 °C'], 'L’effet de serre naturel porte la moyenne à environ +15 °C ; les gaz émis par l’activité humaine le renforcent.'],
  ['Une énergie renouvelable…', 'se reconstitue à l’échelle humaine (soleil, vent, eau)', ['provient toujours du pétrole', 'ne produit jamais de déchets', 'est inépuisable et gratuite à produire'], 'Elles ont aussi des impacts (matériaux, surfaces), à comparer.'],
  ['La cellule est…', 'l’unité de base de tous les êtres vivants', ['un atome', 'un organe', 'une molécule d’eau'], 'Théorie cellulaire, établie au XIXe siècle.'],
  ['La Terre tourne sur elle-même en environ…', '24 heures', ['365 jours', '1 heure', '1 mois'], 'Cette rotation explique le jour et la nuit ; le tour du Soleil dure environ 365,25 jours.'],
  ['L’oreille humaine entend des sons de fréquence comprise entre environ…', '20 Hz et 20 000 Hz', ['0 et 20 Hz', '1 et 10 Hz', '1 et 2 millions de Hz'], 'En dessous : les infrasons ; au-dessus : les ultrasons.'],
  ['Le niveau d’intensité sonore se mesure en…', 'décibels (dB)', ['hertz (Hz)', 'watts (W)', 'mètres (m)'], 'Au-delà d’environ 85 dB, une exposition prolongée peut abîmer l’audition.'],
  ['La photosynthèse permet aux végétaux chlorophylliens de…', 'fabriquer de la matière organique à partir de CO₂, d’eau et de lumière', ['respirer sans dioxygène', 'produire du CO₂ à partir de rien', 'capter l’azote de l’air'], 'Elle libère du dioxygène et stocke l’énergie lumineuse sous forme chimique.'],
  ['Lequel de ces gaz est un gaz à effet de serre ?', 'le méthane (CH₄)', ['le dioxygène (O₂)', 'le diazote (N₂)', 'l’argon (Ar)'], 'Avec la vapeur d’eau et le CO₂ ; le diazote et le dioxygène, majoritaires dans l’air, n’absorbent pas l’infrarouge terrestre.'],
  ['L’albédo d’une surface est…', 'la part du rayonnement solaire qu’elle réfléchit', ['sa température', 'sa masse', 'la part qu’elle absorbe'], 'La neige a un albédo élevé ; l’océan, un albédo faible. Celui de la Terre vaut environ 0,3.'],
  ['Un panneau photovoltaïque convertit en électricité environ…', '15 à 22 % de l’énergie lumineuse reçue', ['100 %', 'plus de 90 %', 'moins de 0,1 %'], 'Le reste est réfléchi ou transformé en chaleur.'],
  ['Une croissance exponentielle est une croissance où la quantité…', 'est multipliée par le même nombre à intervalles de temps égaux', ['augmente de la même valeur à chaque étape', 'reste constante', 'diminue toujours'], 'Augmenter de la même valeur à chaque étape, c’est une croissance linéaire.'],
  ['Un atome est constitué…', 'd’un noyau (protons et neutrons) entouré d’électrons', ['uniquement d’électrons', 'de cellules', 'de molécules d’eau'], 'Le noyau concentre presque toute la masse de l’atome.'],
  ['La structure en double hélice de l’ADN a été décrite en…', '1953', ['1789', '1905', '2001'], 'Par Watson et Crick, grâce notamment aux clichés de diffraction de Rosalind Franklin.'],
];
const SI = [
  ['Dans une chaîne de puissance, un moteur électrique…', 'convertit l’énergie électrique en énergie mécanique', ['stocke l’énergie', 'mesure la température', 'transmet l’information'], 'Chaîne de puissance : alimenter, moduler, convertir, transmettre.'],
  ['Un capteur, dans un système, sert à…', 'acquérir une information sur une grandeur physique', ['transmettre un mouvement', 'stocker de l’énergie', 'convertir l’énergie électrique en chaleur'], 'Il fait partie de la chaîne d’information.'],
  ['Le rendement d’un système est…', 'le rapport entre la puissance utile et la puissance absorbée', ['toujours supérieur à 1', 'la masse du système', 'sa vitesse maximale'], 'η = Pu / Pa, inférieur à 1 à cause des pertes.'],
  ['Un diagramme des exigences (SysML) décrit…', 'ce que le système doit faire ou respecter', ['le prix de vente', 'la couleur du produit', 'le nom du fabricant'], 'On y lit les fonctions attendues et les contraintes, avec des critères.'],
  ['Simuler le comportement d’un système permet…', 'de prévoir ses performances avant de le fabriquer', ['de le fabriquer plus vite', 'de supprimer les tests réels', 'de le rendre plus lourd'], 'On compare ensuite simulation, mesures et cahier des charges.'],
  ['Dans une chaîne d’information, un microcontrôleur…', 'traite les informations reçues des capteurs', ['convertit l’énergie en mouvement', 'stocke l’énergie électrique', 'transmet un mouvement de rotation'], 'Acquérir, traiter, communiquer : les fonctions de la chaîne d’information.'],
  ['Dans une chaîne de puissance, une batterie sert à…', 'stocker l’énergie pour alimenter le système', ['acquérir une information', 'transmettre un mouvement', 'mesurer une tension'], 'Elle intervient dans la fonction « alimenter ».'],
  ['Un réducteur à engrenages placé après un moteur…', 'diminue la vitesse de rotation et augmente le couple', ['augmente la vitesse et le couple', 'produit de l’électricité', 'mesure la température'], 'Aux pertes près, la puissance se conserve : P = C × ω.'],
  ['Dans P = C × ω, la vitesse angulaire ω s’exprime en…', 'radians par seconde', ['tours par minute', 'mètres par seconde', 'newtons'], 'Conversion : ω = 2π × N / 60 si N est en tours par minute.'],
  ['Un variateur (ou un hacheur), dans une chaîne de puissance, sert à…', 'moduler l’énergie envoyée au moteur', ['stocker l’énergie', 'mesurer une position', 'transmettre un message radio'], 'Il règle par exemple la vitesse du moteur.'],
  ['Un écart entre la performance mesurée et celle du cahier des charges conduit à…', 'en chercher les causes et à modifier la conception', ['ignorer le résultat', 'changer le cahier des charges sans réfléchir', 'arrêter de mesurer'], 'L’ingénieur compare trois performances : attendue, mesurée et simulée.'],
  ['Un système asservi (en boucle fermée)…', 'compare en permanence sa sortie à la consigne et corrige l’écart', ['fonctionne sans aucun capteur', 'ne corrige jamais d’erreur', 'n’a pas de consigne'], 'Exemple : le régulateur de vitesse d’une voiture.'],
  ['Une énergie s’exprime en joules ; une puissance, en…', 'watts (1 W = 1 J/s)', ['joules aussi', 'newtons', 'volts'], 'E = P × t : 1 kWh = 3,6 millions de joules.'],
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
