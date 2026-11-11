/**
 * Chapitres encore sans exercices : pratiques des arts plastiques (matériaux, gestes, dispositifs, numérique, présence
 * de l'œuvre, spectateur) et de l'éducation musicale (voix, simultané, son et numérique) au collège, cycles de vie des
 * êtres vivants au CM2, société d'ordres en seconde. Questions expliquées et étapes à remettre dans l'ordre.
 */
import { pick } from './gen-util.js';
import { qcm } from './primaire-savoirs.js';

const GEN = [];
function add(g) {
  const { make, ...rest } = g;
  GEN.push({ tracks: ['classe', 'approfondissement'], options: [], facts: true, ...rest, make(rand, o = {}, tier = 'classe') { return make(rand, tier !== 'classe'); } });
}
const order = (prompt, steps, label, hint) => ({ type: 'order', prompt, orderLabel: label, items: steps.map((s, i) => ({ id: `s${i + 1}`, label: s })), hints: [hint], solution: steps.join(' → '), expectedSeconds: 60, representation: 'visuelle', errorType: 'notion' });

/* ------------------------------ Arts plastiques ------------------------------ */

const ARTS = [
  ['Une sculpture « en ronde-bosse » est une sculpture…', 'dont on peut faire le tour', ['collée contre un mur', 'peinte sur une toile', 'projetée sur un écran'], 'Le bas-relief, lui, reste attaché à un fond.'],
  ['Le « non-fini », c’est…', 'une œuvre laissée volontairement inachevée, qui montre le travail de la matière', ['une œuvre ratée', 'une œuvre détruite', 'une copie'], 'Les Esclaves de Michel-Ange semblent sortir du bloc de marbre.'],
  ['Modeler, c’est…', 'donner forme à une matière molle (argile, pâte) avec les mains ou des outils', ['enlever de la matière à un bloc dur', 'assembler des objets trouvés', 'peindre au pistolet'], 'Tailler, c’est enlever de la matière ; assembler, c’est réunir des éléments.'],
  ['Tailler une sculpture dans un bloc de pierre consiste à…', 'enlever de la matière', ['ajouter de la matière', 'fondre du métal', 'mouler du plâtre'], 'C’est un procédé soustractif, à l’inverse du modelage, qui ajoute de la matière.'],
  ['Une installation, en art contemporain, est…', 'une œuvre qui occupe un espace, que le spectateur parcourt ou traverse', ['un tableau accroché au mur', 'une sculpture miniature', 'une simple photographie'], 'Le lieu et le corps du spectateur font partie de l’œuvre.'],
  ['Avec le « dripping », Jackson Pollock peignait…', 'en faisant couler et projeter la peinture sur une toile posée au sol', ['au pinceau très fin', 'uniquement à l’aquarelle', 'avec un ordinateur'], 'Tout le corps participe au geste : on parle d’« action painting ».'],
  ['Les mains négatives des grottes préhistoriques étaient obtenues…', 'en soufflant un pigment autour de la main posée sur la paroi', ['avec un pinceau à poils', 'par photographie', 'en gravant du métal'], 'La main sert de pochoir : ce sont parmi les plus anciennes traces humaines.'],
  ['Une œuvre « in situ » est…', 'créée pour un lieu précis, avec lequel elle dialogue', ['exposable dans n’importe quel musée', 'toujours numérique', 'cachée au public'], 'Daniel Buren a conçu ses colonnes pour la cour du Palais-Royal, à Paris (1986).'],
  ['Le pixel est…', 'le plus petit élément d’une image numérique', ['un pinceau', 'un type de papier', 'un logiciel de son'], 'Une image numérique est une grille de pixels colorés.'],
  ['Le « land art » consiste à…', 'créer avec les matériaux de la nature, souvent dans le paysage lui-même', ['peindre des paysages en atelier', 'sculpter du marbre', 'photographier des villes'], 'Robert Smithson réalise sa Spiral Jetty dans un lac de l’Utah en 1970.'],
  ['Le cartel, dans un musée, indique…', 'l’auteur, le titre, la date, la technique et les dimensions de l’œuvre', ['le prix de l’œuvre', 'les horaires du musée', 'le nom du gardien'], 'Il aide le spectateur à situer l’œuvre.'],
  ['Une performance, en art, est…', 'une action réalisée par l’artiste devant un public', ['un très grand tableau', 'une sculpture en bronze', 'une photo retouchée'], 'L’œuvre est l’événement lui-même ; il en reste parfois des photos ou des vidéos.'],
  ['Le collage, pratiqué par Picasso et Braque vers 1912, consiste à…', 'fixer sur le support des papiers, des tissus ou des objets', ['coller deux sculptures ensemble', 'coller des photos sur un écran', 'peindre avec de la colle'], 'Des fragments du réel entrent ainsi dans le tableau.'],
  ['Le format d’une œuvre désigne…', 'ses dimensions et sa forme (portrait, paysage, carré…)', ['son prix', 'son auteur', 'sa date'], 'Le format change la façon dont le spectateur regarde l’œuvre.'],
  ['La gravure permet…', 'd’imprimer plusieurs exemplaires d’une même image', ['de sculpter le bois en ronde-bosse', 'de projeter un film', 'de mélanger des sons'], 'L’artiste creuse une plaque (bois, cuivre), l’encre, puis la presse sur le papier.'],
  ['L’art numérique peut utiliser…', 'des programmes, des images de synthèse, des capteurs, l’interaction avec le public', ['seulement de la peinture à l’huile', 'seulement du marbre', 'uniquement des crayons'], 'Le numérique est à la fois un outil et un matériau.'],
  ['Une œuvre « éphémère » est une œuvre…', 'faite pour ne durer qu’un temps', ['exposée pour toujours', 'en bronze', 'très ancienne'], 'Sculptures de sable ou de glace, œuvres de land art emportées par la marée…'],
  ['Changer l’échelle d’un objet, en art, c’est…', 'le représenter beaucoup plus grand ou plus petit que nature', ['le peindre en noir et blanc', 'le casser', 'le vendre'], 'Les sculptures géantes de Claes Oldenburg agrandissent des objets du quotidien.'],
];
add({
  id: 'ap-pratiques', subject: 'arts-plastiques', levels: ['5e', '4e', '3e'], label: 'Arts plastiques : matières, gestes, espace, numérique, spectateur', skill: 'ap.pratiques',
  chapters: ['arts5-ch-materiaux', 'arts5-ch-transformation', 'arts5-ch-dispositif', 'arts5-ch-corps', 'arts5-ch-numerique', 'arts4-ch-numerique', 'arts4-ch-presence', 'arts4-ch-spectateur', 'arts-plastiques-2020-cycle-4'],
  description: 'Ronde-bosse, non-fini, modeler et tailler, installation, geste et trace, in situ, pixel, land art, performance, collage, gravure, échelle.',
  make(rand) { return qcm(rand, pick(rand, ARTS)); },
});

/* ------------------------------ Éducation musicale ------------------------------ */

const MUSIQUE = [
  ['Chanter « juste », c’est…', 'produire la bonne hauteur de note', ['chanter très fort', 'chanter très vite', 'chanter seul'], 'Chanter « en mesure », c’est respecter le rythme et la pulsation.'],
  ['Quand on chante, l’air qui sort des poumons fait vibrer…', 'les cordes vocales, dans le larynx', ['les dents', 'les oreilles', 'le cœur'], 'La gorge, la bouche et le nez servent de caisse de résonance.'],
  ['Les voix de femmes, de la plus aiguë à la plus grave :', 'soprano, mezzo-soprano, alto', ['basse, ténor, baryton', 'alto, soprano, basse', 'ténor, alto, soprano'], 'Voix d’hommes, de l’aiguë à la grave : ténor, baryton, basse.'],
  ['La polyphonie, c’est…', 'plusieurs mélodies différentes chantées ou jouées en même temps', ['une seule mélodie sans accompagnement', 'un long silence', 'un rythme très lent'], 'La monodie, au contraire, ne fait entendre qu’une seule ligne mélodique.'],
  ['Un accompagnement…', 'soutient la mélodie principale (accords, basse, rythme)', ['remplace toujours la mélodie', 'est toujours chanté', 'n’a jamais de rythme'], 'La mélodie reste au premier plan.'],
  ['Un bourdon, en musique, est…', 'une note tenue longtemps sous la mélodie', ['un instrument à vent', 'une note très aiguë', 'un silence'], 'La cornemuse en fait entendre un.'],
  ['Un accord, c’est…', 'plusieurs notes jouées en même temps', ['une seule note tenue', 'un silence', 'un changement de tempo'], 'Do, mi et sol ensemble forment l’accord parfait de do majeur.'],
  ['Le contrepoint est l’art de…', 'superposer des mélodies indépendantes qui s’accordent entre elles', ['jouer une seule note', 'battre la mesure', 'accorder un instrument'], 'Jean-Sébastien Bach en est un grand maître, avec ses fugues.'],
  ['La prosodie, dans une chanson, c’est…', 'l’accord entre le rythme des mots et celui de la musique', ['le volume du micro', 'le nombre de couplets', 'le prix du disque'], 'Une bonne prosodie place les syllabes accentuées sur les temps forts.'],
  ['Le refrain d’une chanson…', 'revient plusieurs fois avec les mêmes paroles', ['change à chaque fois', 'n’est chanté qu’une fois', 'est toujours sans paroles'], 'Les couplets, eux, ont des paroles différentes.'],
  ['Échantillonner (« sampler ») un son, c’est…', 'enregistrer un extrait sonore pour le réutiliser, le transformer, le répéter', ['jouer plus fort', 'accorder un violon', 'écrire une partition'], 'Le hip-hop et la musique électronique l’utilisent beaucoup.'],
  ['Une boucle (« loop »), en musique assistée par ordinateur, est…', 'un court motif répété en continu', ['un instrument à cordes', 'une erreur d’enregistrement', 'un silence'], 'On superpose plusieurs boucles pour construire un morceau.'],
  ['Le tempo se mesure souvent en…', 'battements par minute (BPM)', ['décibels', 'kilogrammes', 'mètres'], 'À 60 BPM, on compte une pulsation par seconde.'],
  ['Le Boléro de Maurice Ravel (1928) est construit sur…', 'un long crescendo et la répétition de deux mélodies sur un même rythme', ['un seul accord tenu', 'des silences', 'une improvisation libre'], 'Les instruments s’ajoutent peu à peu ; la caisse claire répète son rythme du début à la fin.'],
  ['Le « beatbox », c’est…', 'imiter des sons de batterie avec la bouche', ['jouer de la flûte', 'chanter en chœur', 'battre la mesure avec un bâton'], 'La voix devient un instrument de percussion.'],
  ['Écouter longtemps de la musique très forte (au-delà d’environ 85 dB)…', 'peut abîmer l’audition durablement', ['est sans aucun danger', 'améliore l’audition', 'est impossible'], 'On baisse le volume, on fait des pauses ; le seuil de douleur se situe vers 120 dB.'],
  ['Le format MP3 est…', 'un format audio compressé, qui allège le fichier en supprimant des sons peu audibles', ['un format d’image', 'un format qui garde toute l’information', 'un instrument'], 'Les formats WAV ou FLAC, eux, conservent toute l’information sonore.'],
  ['La réverbération est…', 'la prolongation d’un son par ses réflexions sur les murs', ['un instrument', 'une danse', 'une partition'], 'Dans une église, elle fait durer les sons après qu’on a cessé de chanter.'],
];
add({
  id: 'mu-pratiques', subject: 'musique', levels: ['5e', '4e', '3e'], label: 'Éducation musicale : voix, polyphonie, accords, son et numérique', skill: 'mu.pratiques',
  chapters: ['mus5-ch-voix', 'mus5-ch-simultane', 'mus5-ch-numerique', 'mus4-ch-projet', 'mus4-ch-simultane', 'mus4-ch-son', 'musique-2020-domaines'],
  description: 'Chanter juste, voix, polyphonie et accompagnement, accords, contrepoint, prosodie, sampler et boucles, tempo, volume et audition, formats audio.',
  make(rand) { return qcm(rand, pick(rand, MUSIQUE)); },
});

/* ------------------------------ Cycles de vie (CM2) ------------------------------ */

const CYCLES_Q = [
  ['La germination, c’est…', 'le moment où la graine se met à pousser', ['la chute des feuilles', 'la floraison', 'la fabrication du fruit'], 'Il faut de l’eau, de l’air et une température douce ; la lumière n’est pas nécessaire au tout début.'],
  ['Le fruit se forme à partir…', 'de la fleur, après la fécondation', ['de la racine', 'de la tige', 'des feuilles mortes'], 'Une partie du pistil devient le fruit ; les ovules deviennent les graines.'],
  ['La pollinisation est…', 'le transport du pollen d’une fleur à une autre', ['la chute des fruits', 'l’arrosage des plantes', 'l’éclosion d’un œuf'], 'Les insectes et le vent transportent le pollen.'],
  ['Une métamorphose est…', 'une transformation importante du corps au cours de la vie d’un animal', ['une maladie', 'un changement de couleur selon la saison', 'une migration'], 'La chenille devient papillon ; le têtard devient grenouille.'],
  ['Un animal ovipare…', 'pond des œufs', ['donne naissance à des petits déjà formés', 'ne se reproduit pas', 'vit seulement dans l’eau'], 'Les oiseaux et la plupart des reptiles sont ovipares ; le chien, mammifère, est vivipare.'],
  ['Lequel de ces animaux est vivipare ?', 'le lapin', ['la poule', 'la tortue', 'le papillon'], 'Ses petits se développent dans le ventre de leur mère.'],
  ['Au début de sa vie, le têtard respire…', 'dans l’eau, grâce à des branchies', ['seulement avec des poumons', 'par les oreilles', 'sans dioxygène'], 'La grenouille adulte respire avec des poumons et par sa peau.'],
  ['Une plante annuelle, comme le tournesol,…', 'fait son cycle complet en une seule année', ['vit des centaines d’années', 'ne fait jamais de graines', 'pousse uniquement en hiver'], 'Un arbre, lui, vit de nombreuses années et refleurit chaque printemps.'],
  ['Les insectes qui aident à polliniser les fleurs, comme l’abeille, sont appelés…', 'des pollinisateurs', ['des prédateurs', 'des décomposeurs', 'des parasites'], 'Sans eux, beaucoup de plantes ne donneraient pas de fruits.'],
  ['Une graine contient…', 'une future plante et des réserves de nourriture', ['seulement de l’eau', 'des œufs d’insectes', 'du pollen'], 'Les réserves nourrissent la jeune plante avant qu’elle ait des feuilles.'],
  ['Pour germer, une graine a surtout besoin…', 'd’eau, d’air et d’une température douce', ['de lumière très forte et de sel', 'd’engrais uniquement', 'd’être dans le noir et au froid'], 'La lumière devient nécessaire ensuite, pour la jeune plante.'],
  ['Chez les mammifères, les petits se nourrissent d’abord…', 'du lait de leur mère', ['de graines', 'd’insectes', 'de plancton'], 'Les mammifères allaitent leurs petits.'],
  ['Le fraisier peut aussi se reproduire sans graines, grâce…', 'à ses stolons, des tiges qui rampent et prennent racine', ['à ses épines', 'à ses fleurs fanées', 'au vent'], 'C’est une reproduction asexuée : les nouveaux plants sont identiques.'],
  ['La durée de vie d’un éphémère adulte (un insecte) est…', 'de quelques heures à quelques jours', ['de dix ans', 'd’un siècle', 'de plusieurs mois'], 'Sa larve, elle, vit longtemps dans l’eau.'],
];
const CYCLES_O = [
  ['Range les étapes de la vie d’une plante à fleurs.', ['La graine', 'La germination', 'La jeune plante', 'La floraison', 'Le fruit et ses graines']],
  ['Range les étapes de la vie d’un papillon.', ['L’œuf', 'La chenille', 'La chrysalide', 'Le papillon adulte']],
  ['Range les étapes de la vie d’une grenouille.', ['L’œuf', 'Le têtard', 'Le têtard avec des pattes', 'La grenouille adulte']],
  ['Range les étapes de la vie d’une poule.', ['L’œuf', 'Le poussin', 'La jeune poule', 'La poule adulte, qui pond à son tour']],
];
add({
  id: 'st-cycles', subject: 'sciences-techno', levels: ['cm2'], label: 'Cycles de vie des plantes à fleurs et des animaux', skill: 'st.cycles',
  chapters: ['cm2-st-cycle-vie'], description: 'Germination, fleur, fruit et graine, pollinisation ; ovipares et vivipares, métamorphoses ; étapes à remettre dans l’ordre.',
  make(rand) {
    if (rand() < 0.35) { const [p, steps] = pick(rand, CYCLES_O); return order(p, steps, 'de la première à la dernière étape', 'Commence par le tout début de la vie.'); }
    return qcm(rand, pick(rand, CYCLES_Q));
  },
});

/* ------------------------------ Société d'ordres (seconde) ------------------------------ */

const ORDRES = [
  ['Dans la société d’ordres de l’Ancien Régime, les trois ordres sont…', 'le clergé, la noblesse et le tiers état', ['les rois, les reines et les princes', 'les villes, les campagnes et les ports', 'les marchands, les soldats et les paysans'], 'Ceux qui prient, ceux qui combattent, ceux qui travaillent.'],
  ['Parmi les privilèges de la noblesse, on trouve…', 'l’exemption de certains impôts, comme la taille', ['l’interdiction de posséder des terres', 'l’obligation de travailler aux champs', 'le droit de vote de tous'], 'Le tiers état supporte l’essentiel des impôts.'],
  ['La Fronde (1648-1653) est…', 'une révolte des parlementaires et des grands nobles contre le pouvoir royal', ['une guerre contre l’Angleterre', 'une découverte scientifique', 'une épidémie'], 'Elle marque le jeune Louis XIV, qui renforce ensuite l’absolutisme.'],
  ['En achetant certains offices de justice ou de finances, un bourgeois pouvait…', 'accéder à la noblesse (noblesse de robe)', ['devenir roi', 'quitter le royaume', 'entrer dans le clergé sans études'], 'On l’oppose à la noblesse d’épée, d’origine militaire.'],
  ['Le Bourgeois gentilhomme (1670), qui se moque d’un bourgeois voulant imiter les nobles, est de…', 'Molière', ['Racine', 'Corneille', 'Voltaire'], 'La musique est de Lully ; la pièce est créée pour la cour de Louis XIV.'],
  ['L’absolutisme désigne un régime où le roi…', 'concentre tous les pouvoirs, sans contrôle d’une assemblée élue', ['est élu par le peuple', 'partage le pouvoir avec un Parlement élu', 'n’a aucun pouvoir'], 'Il se dit roi « de droit divin » ; Louis XIV en est la figure.'],
  ['La dîme était…', 'un prélèvement sur les récoltes au profit de l’Église', ['un impôt du roi pour la guerre', 'une monnaie', 'un titre de noblesse'], 'Son nom vient de « dixième », même si la part variait.'],
  ['La gabelle était…', 'un impôt sur le sel', ['un impôt sur les portes et fenêtres', 'un péage sur les ponts', 'une taxe sur le tabac'], 'Très impopulaire, elle provoque de nombreuses révoltes, comme celle des Nu-pieds en 1639.'],
  ['Le Code noir (1685) réglemente…', 'l’esclavage dans les colonies françaises', ['la vie à la cour de Versailles', 'les droits des femmes', 'la presse'], 'Il fait des esclaves des « biens meubles ».'],
  ['Au XVIIIe siècle, les salons, souvent tenus par des femmes comme Mme Geoffrin, sont…', 'des lieux de discussion où circulent les idées des Lumières', ['des tribunaux', 'des écoles militaires', 'des marchés'], 'Nobles et bourgeois cultivés s’y rencontrent.'],
  ['La révocation de l’édit de Nantes (1685) pousse…', 'de nombreux protestants à quitter le royaume', ['les nobles à renoncer à leurs privilèges', 'le clergé à se marier', 'le roi à abdiquer'], 'Environ 200 000 protestants partent vers les pays voisins.'],
  ['À la fin du XVIIIe siècle, Sieyès demande : « Qu’est-ce que le tiers état ? » et répond…', '« Tout »', ['« Rien du tout, et c’est bien ainsi »', '« Le clergé »', '« Le roi »'], 'Dans ce pamphlet de 1789, il ajoute qu’il n’a été « rien » jusqu’ici et demande à devenir « quelque chose ».'],
  ['La taille était…', 'un impôt direct payé surtout par le tiers état', ['un impôt sur le sel', 'une taxe sur les livres', 'un don volontaire au roi'], 'Le clergé et la noblesse en étaient exemptés.'],
  ['La corvée royale obligeait les paysans à…', 'travailler gratuitement à l’entretien des routes', ['servir à la cour', 'payer la dîme deux fois', 'quitter leur village'], 'Elle est très impopulaire à la fin du XVIIIe siècle.'],
  ['La « noblesse de robe » désigne…', 'les nobles qui doivent leur titre à une charge de justice ou de finances', ['les nobles les plus anciens', 'les chevaliers du Moyen Âge', 'les officiers de marine'], 'On l’oppose à la noblesse d’épée, issue de la tradition militaire.'],
  ['Louis XIV fait de Versailles…', 'le lieu où il réunit et surveille la haute noblesse', ['une forteresse militaire', 'une université', 'un port de commerce'], 'L’étiquette règle chaque geste de la journée du roi et des courtisans.'],
  ['Les cahiers de doléances (1789) sont…', 'des listes de plaintes et de vœux rédigées dans tout le royaume', ['des registres d’impôts', 'des journaux intimes de nobles', 'des livres de prières'], 'Ils sont rédigés pour la réunion des états généraux.'],
  ['Les états généraux de 1789 réunissent…', 'des députés des trois ordres', ['seulement les nobles', 'les ministres du roi', 'les maires des villes'], 'Le roi les convoque pour trouver de l’argent ; le tiers état s’y proclame Assemblée nationale.'],
];
add({
  id: 'hg-l-societe-ordres', subject: 'hg', levels: ['2nde'], label: 'La société d’ordres : tensions, mutations et crispations', skill: 'hg.l.societe-ordres',
  chapters: ['2nde-hg-h4-societe-ordres'], description: 'Les trois ordres, privilèges, impôts (taille, gabelle, dîme), révoltes et Fronde, absolutisme, noblesse de robe, Code noir, salons, tiers état.',
  make(rand) { return qcm(rand, pick(rand, ORDRES)); },
});

export const COLLEGE_ARTS_PLUS = GEN;
export const COLLEGE_ARTS_PLUS_SKILLS = [
  ['arts-plastiques', 'ap.pratiques', '5e', 'Arts plastiques : matières, gestes, espace de l’œuvre, numérique, spectateur'],
  ['musique', 'mu.pratiques', '5e', 'Éducation musicale : voix, polyphonie, accords, son et numérique'],
  ['sciences-techno', 'st.cycles', 'cm2', 'Cycles de vie des plantes à fleurs et des animaux'],
  ['hg', 'hg.l.societe-ordres', '2nde', 'La société d’ordres (XVIe-XVIIIe siècle)'],
].map(([subject, id, level, label]) => ({ subject, id, label, level, track: 'classe', status: 'programme', domain: 'divers', prereqs: [], editorialLevel: true }));
