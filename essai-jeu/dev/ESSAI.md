# Version d'essai : quête, jeu de plateau et récompenses

Ce dossier `essai-jeu/` est la version en ligne du 12 octobre (v0.4, à la racine du site) **plus** :

- **Quête de l'année** (accueil de l'onglet « Quête ») : pour chaque matière, les chapitres du parcours dans l'ordre,
  répartis sur les 5 périodes de l'année scolaire 2026-2027 (calendrier officiel ; hiver et printemps : zone A,
  indicatif). Chaque chapitre est une quête de 1 à 3 étapes ; terminé avec au moins 30 % des étoiles, il reçoit une
  médaille (bronze, argent ≥ 60 %, or ≥ 85 %) ; une période terminée ouvre un coffre rare ; l'année entière, un dernier
  coffre. Le jour indique la période en cours et le rythme conseillé (étapes par semaine), sans rien verrouiller.
- **Lycée : la physique-chimie de première et de terminale** (`js/generators/lycee-pc-1t.js`,
  `content/skills/lycee-pc-1t.json`) : 14 générateurs. Première : concentration molaire, dilution, Beer-Lambert,
  avancement maximal et réactif limitant, titrage colorimétrique, oxydoréduction, géométrie et polarité, chimie
  organique et spectres IR, rendement, combustions, pression et loi de Mariotte, statique des fluides, champs,
  énergies cinétique et potentielle, travail, puissance et effet Joule, rendement, ondes, conjugaison, photons.
  Terminale : pH et acides forts, prédominance, titrages (stœchiométrie 1:2), cinétique, Qr et K, décroissance
  radioactive et datation, piles, capacité en mAh, Newton, chute libre, satellites, chaleur Q = m c ΔT, Archimède,
  gaz parfait, décibels, diffraction, lunette, effet Doppler, circuit RC.
- **Anglais en 6e, en 3e et au lycée** (`js/generators/lycee-langues.js`) : en 6e, be, have got, there is / are,
  possessifs, pluriels irréguliers ; de la 3e à la terminale, voix passive, conditionnels (dont le 3e type), pronoms
  relatifs, should have, discours rapporté, mots de liaison à classer, verbes irréguliers, repères culturels (États-Unis,
  Australie, Commonwealth, Martin Luther King, Nelson Mandela). Avec écoute des phrases.
- **Musique, arts plastiques, IA et numérique** (`js/generators/arts-numerique.js`) : familles d'instruments à ranger,
  dix œuvres à associer à leur compositeur, vocabulaire (nuances, tempo, timbre, ostinato, canon, périodes) ; dix
  œuvres d'art à associer à leur artiste, mouvements, ready-made, couleurs complémentaires, perspective ; IA générative,
  vérification des sources, biais, données personnelles, usage honnête, Pix et CRCN (de la 6e à la terminale).
- **Compléments** (`js/generators/complements.js`) : programmation par blocs dans les chapitres d'algorithmique de maths
  (5e, 4e), logique en première, anglais du primaire à l'écrit (phrases à remettre dans l'ordre, avec écoute) et à l'oral
  (petits dialogues du quotidien).
- **EPS, numérique au primaire, enseignement scientifique, sciences de l'ingénieur** (`js/generators/eps-sciences.js`) :
  échauffement, effort et cœur, 60 minutes d'activité par jour (OMS), hydratation, règles des sports collectifs,
  fair-play, Jeux olympiques (du CP à la terminale) ; écrans et sommeil, informations personnelles, mots de passe,
  robots et IA, vérifier une information (CP → CM2) ; Ératosthène, âge de la Terre, octave, fusion solaire, effet de
  serre, énergies renouvelables ; chaînes de puissance et d'information, rendement, exigences, simulation.
- **Philosophie (terminale)** (`js/generators/philo.js`) : 15 œuvres à attribuer, 8 citations célèbres, 8 repères du
  programme (légal / légitime, persuader / convaincre, contingent / nécessaire, en fait / en droit, origine / fondement,
  objectif / subjectif, transcendant / immanent, croire / savoir) et les dix-sept notions.
- **EMC, du CP à la terminale** (`js/generators/emc.js`, `content/skills/emc.json`) : une banque de questions expliquées
  par cycle (règles de vie, harcèlement, numéros d'urgence, symboles ; droits de l'enfant, DDHC, laïcité, commune, vote ;
  séparation des pouvoirs, quinquennat, majorité, libertés, recensement et JDC ; Constitution de 1958, Conseil
  constitutionnel, CEDH, Défenseur des droits, parité, RGPD), un générateur par classe rattaché au chapitre de la
  classe (et aux chapitres rédigés de 5e et de 4e) : chaque élève a une quête de l'année en EMC.
- **Lycée : SES, NSI et SNT** (`js/generators/lycee-ses-nsi.js`) : calculs de SES (taux de variation, indice base 100,
  taux de chômage, valeur ajoutée, élasticité-prix) et notions (socialisation, PIB, inflation, chômage au sens du BIT,
  externalités, BCE, marché, abstention, mobilité sociale) ; NSI (binaire, hexadécimal, ASCII, dictionnaires et boucles
  Python, piles et files, tris, dichotomie, arbres, récursivité, SQL, TCP/IP) ; les sept thèmes de SNT.
- **Lycée : le français de seconde et de première** (`js/generators/lycee-francais.js`, `content/skills/lycee-francais.json`) :
  5 générateurs — figures de style sur des citations célèbres (Corneille, Racine, Molière, Baudelaire, Éluard, Louise
  Labé…), versification, 20 œuvres à associer à leur auteur, mouvements littéraires et siècles, grammaire de l'oral du
  bac (complétives, relatives, circonstancielles, valeurs des temps, négation, interrogation, accord du participe),
  connecteurs logiques à classer, thèse, concession, contraction de texte.
- **Lycée : les SVT de première et de terminale** (`js/generators/lycee-svt-1t.js`, `content/skills/lycee-svt-1t.json`) :
  7 générateurs pour tous les chapitres — mitose, réplication, transcription et traduction, mutations, enzymes,
  cancer, antibiorésistance, règle de complémentarité des bases, longueur d'une protéine ; structure du globe, plaques,
  dorsales et subduction, vitesse d'expansion ; écosystèmes et services ; immunité innée et adaptative, vaccination ;
  méiose, brassages, nombre de gamètes, trisomie, endosymbiose, Hardy-Weinberg ; chronologie relative et absolue,
  climats passés et réchauffement ; plantes à fleurs et domestication ; réflexes, mouvement, ATP, glycémie, stress.
- **Lycée : l'histoire-géographie** : trois frises de repères datés (`content/generators/hg-l-chrono-{2nde,1re,tle}.json`,
  de l'édit de Caracalla aux Lumières, de 1789 à 1919, de 1929 à l'euro : ranger les événements ou retrouver l'année),
  rattachées à tous les chapitres d'histoire ; et trois banques de géographie (`js/generators/lycee-hg.js`) : risques,
  IDH, transition démographique, outre-mer, Afrique australe ; métropoles, littoralisation, périurbanisation, Chine ;
  ZEE, canaux et détroits, Union européenne, Schengen, zone euro.
- **Lycée : les SVT de seconde** (`js/generators/lycee-svt.js`, `content/skills/lycee-svt.json`) : 5 générateurs pour
  16 des 17 chapitres — cellules, ADN et organites, photosynthèse, respiration et enzymes, taille réelle au microscope ;
  biodiversité, mutations, sélection naturelle et sexuelle, dérive génétique, capture-marquage-recapture ; érosion et
  sédimentation ; agrosystèmes, engrais, humus, rendement ; maladies vectorielles, antibiotiques, microbiote,
  vaccination, procréation et contraception.
- **Langues vivantes au collège** (`js/generators/college-langues.js`, `content/skills/college-langues.json`) :
  9 générateurs pour l'anglais et l'espagnol de 5e et de 4e (avant : 5 chapitres jouables sur 19 dans chaque classe) —
  anglais : prétérit (réguliers et 22 irréguliers), présent simple et be + V-ing, comparatifs et superlatifs, modaux et
  futur, present perfect, formes contractées, repères sur le Royaume-Uni ; espagnol : présent (ser, tener,
  diphtongues), gustar, ser ou estar, pretérito indefinido et imparfait, ir a + infinitif, gérondif, tener que / hay
  que, le Mexique et l'heure. Chaque phrase corrigée peut être écoutée dans la langue (voix anglaise ou espagnole).
- **Technologie au collège** (`js/generators/college-techno.js`, `content/skills/college-techno.json`) : 8 générateurs
  pour tous les chapitres de 5e, 4e et 3e (avant : 2/12, 3/12 et 0/4 chapitres jouables ; maintenant 12/12, 12/12, 4/4) —
  familles de matériaux et procédés, sources et conversions d'énergie, énergie consommée en kWh, capteurs et
  actionneurs, bits, octets, taille d'une image, formats de fichiers, adresses IP et réseaux, numérique responsable
  (mots de passe, hameçonnage, droit d'auteur, 3018), besoin, contraintes et lignées d'objets, programmation par
  blocs (compteurs, polygones, conditions), étapes d'un projet et d'un dépannage, instruments de mesure.
- **Lycée : les mathématiques de seconde** (`js/generators/lycee-maths.js`, `content/skills/lycee-maths.json`) : jusqu'ici,
  aucun exercice n'existait après la 3e. 14 générateurs rattachés aux 18 chapitres du programme de seconde :
  intervalles et valeur absolue, arithmétique, puissances et racines carrées, identités remarquables, équations,
  inéquations et produit nul, vecteurs dans un repère, droites, fonctions (images, antécédents, ensembles de
  définition, carré et inverse), signe et extremums, pourcentages et évolutions, statistiques, probabilités et
  tableaux croisés, lecture de programmes Python, logique. Avec les erreurs typiques reconnues (taux additionnés,
  oubli du double produit, sens de l'inégalité, range qui s'arrête avant la borne…). Un élève de seconde a donc sa
  quête de l'année (18 chapitres sur cinq périodes), ses gardiens, le jeu de plateau et l'énigme du jour.
- **Lycée : les mathématiques de première et de terminale** (`js/generators/lycee-maths-1t.js`,
  `content/skills/lycee-maths-1t.json`) : 16 générateurs. Première : suites arithmétiques et géométriques (terme
  général, raison, somme, récurrence), second degré (discriminant, racines, sommet, signe), dérivation (nombre
  dérivé, tangente, extremum, dérivées usuelles), exponentielle, trigonométrie, produit scalaire et cercle,
  probabilités conditionnelles et espérance, listes Python. Terminale : limites de suites et récurrence, limites de
  fonctions, continuité et convexité, dérivée d'une composée, logarithme (équations, seuil de doublement),
  intégrales et équations différentielles, sinus et cosinus, géométrie dans l'espace, dénombrement, loi binomiale,
  algorithmes de seuil. Toutes les classes, du CP à la terminale, ont désormais une quête de l'année en maths.
- **Lycée : la physique-chimie de seconde** (`js/generators/lycee-pc.js`, `content/skills/lycee-pc.json`) :
  10 générateurs pour les 17 chapitres — concentration en masse et dilution, masse volumique, noyau (A, Z, N), ions,
  équations nucléaires, configuration électronique et électrons de valence, ions stables et liaisons, la mole
  (n = m/M, n = N/NA), changements d'état et énergie de fusion, équations de réaction à ajuster, réactif limitant,
  vitesse et conversions km/h ↔ m/s, principe d'inertie, poids et gravitation, fréquence et écho, réfraction
  (Snell-Descartes), spectres, vergence et grandissement, lois d'Ohm, des nœuds et des mailles, capteurs. Erreurs
  repérées : volume en mL au lieu de L, intensité en mA, écho sans l'aller-retour, A pris pour le nombre de neutrons…
- **Deuxième album : les animaux extraordinaires** (48 vignettes, dont 12 rares, un fait vrai chacune : la pieuvre
  et ses trois cœurs, le narval dont la « corne » est une dent, le colibri qui vole en arrière…). Il s'ouvre quand
  l'album de lumière est complet ; la page « Ma progression » montre l'album en cours, replie les albums finis et
  annonce le suivant. Trophées « Ami des bêtes » (72 vignettes) et « Grand naturaliste » (96).
- **« Ma quête de l'année » sur la page Aujourd'hui** : la matière jouée en dernier (sinon les maths), son chapitre en
  cours ou le prochain, le nombre de médailles ; un clic ouvre directement la carte de l'année de cette matière
  (lien `#/exercices?annee=<matière>`).
- **Défi de la famille** (page « Aujourd'hui ») : un jeu coopératif entre les profils de l'appareil. Chaque semaine,
  du lundi au dimanche, les bonnes réponses de chacun (sans la correction affichée) remplissent une barre commune,
  une couleur par enfant ; le but est de 35 par joueur actif (un profil sans réponse depuis 4 semaines, ou un profil
  de démonstration, ne compte pas). But atteint : chacun ouvre le coffre de la famille depuis son profil (+25 points,
  vignette rare, trophées « Esprit d'équipe » et « Famille de lumière »). Avec un seul profil : « Défi de la semaine »
  (`js/engine/famille.js`, `js/ui/game/family-card.js`).
- **Mot mystère** (`#/mot`, liens depuis le plateau et la page Aujourd'hui) : une série de 5 ou 8 mots à retrouver lettre
  à lettre, avec un indice : une devinette en français (environ 40 mots par niveau : mots faciles au CP-CE1, plus longs du CE2 au CM2, orthographe
  d'usage à partir de la 6e : accueil, rythme, chrysanthème…), ou la traduction d'un mot du vocabulaire d'anglais (du CP
  à la Tle) ou d'espagnol (à partir de la 5e). Chaque lettre absente éteint l'une des sept couleurs de l'arc-en-ciel ;
  les accents viennent avec la lettre simple ; une lettre peut être révélée contre une couleur ; on peut écouter le mot
  (voix de l'ordinateur). Clavier à l'écran ou physique, +10 points une fois par jour, trophées « Détective des mots »
  et « Dictionnaire vivant » (`js/engine/mot.js`, `js/ui/views/mot.js`).
- **Anglais : vocabulaire du lycée** (`content/generators/en-l-vocabulary.json`) : 65 mots des axes culturels
  (environnement, numérique, société, travail et études, santé, voyages, arts), dans les deux sens, avec écoute et
  faux amis signalés (stage, roman) ; dans la quête de l'année de la 2nde à la Tle, au jeu de mémoire et au mot mystère.
- **Spécialités et options du lycée** (`js/generators/lycee-options.js`, `content/skills/lycee-options.json`) : HGGSP
  (première : démocratie, puissances, frontières, information, États et religions ; terminale : espaces de conquête,
  guerre et paix, mémoires, patrimoine, environnement, connaissance), HLP (pouvoirs de la parole, représentations du
  monde, recherche de soi, humanité en question), mathématiques expertes (nombres complexes, arithmétique, graphes et
  matrices, avec idées fausses diagnostiquées : i² = −1, module, quotient et reste, PGCD et PPCM, produit terme à terme,
  somme des degrés) et mathématiques complémentaires (suites, exponentielle, dérivation, logarithme, intégrales, loi
  binomiale). Chacune a maintenant sa quête de l'année.
- **Lecture chronométrée** (`#/fluence`, du CP au CM2) : neuf textes originaux (trois par niveau : CP, CE1-CE2,
  CM1-CM2), qu'on peut d'abord écouter lus par l'ordinateur. L'enfant lit à voix haute pendant une minute ; l'adulte
  qui écoute touche les mots mal lus, puis le dernier mot atteint. Résultat : les mots correctement lus en une minute
  (ramené à une minute si le texte est fini avant), un record par texte (« plus haut, c'est mieux » : `withScore`,
  `recordBestScore`), +10 points une fois par jour, trophées « Lecteur à voix haute » et « Belle voix ». Proposée dans
  les petits jeux du primaire et, dans la quête de l'année, à côté des chapitres de fluence et de lecture à voix haute
  (`js/engine/fluence.js`, `js/ui/views/fluence.js`).
- **Derniers chapitres vides comblés** (`js/generators/college-arts-plus.js`) : arts plastiques au collège (matières,
  gestes, dispositifs, in situ, numérique, spectateur : tous les chapitres de 5e et de 4e), éducation musicale (voix,
  polyphonie et accords, son, volume et formats audio, MAO : tous les chapitres de 5e et de 4e), cycles de vie des
  plantes et des animaux (CM2, avec des étapes à remettre dans l'ordre), la société d'ordres (seconde). Restent sans
  exercices les chapitres de vie affective et de puberté (EVARS, laissés de côté volontairement), l'oral, l'écriture
  cursive et LLCER.
- **Quête de l'année : une année par classe** : un parcours de référence qui couvre plusieurs classes (l'EMC du CP à la
  terminale, les langues du collège au lycée, la HGGSP) n'affiche plus comme « à venir » les chapitres des autres
  classes ; une année faite d'un seul chapitre de questions (l'EMC d'une classe) compte trois étapes
  (`yearPlan` dans `js/ui/game/year-view.js`).
- **Troisième album : les merveilles du monde** (48 vignettes, dont 12 rares) : pyramides de Gizeh, Grande Muraille,
  Machu Picchu, Everest, Grande Barrière de corail, tour Eiffel, viaduc de Millau, lac Baïkal, dune du Pilat…, un fait
  vrai chacune ; il s'ouvre quand l'album des animaux est complet. Trophées « Globe-trotteur » et « Explorateur du
  monde » (144 vignettes en tout, `js/engine/game-rewards.js`).
- **Jouer à deux, partout** : le mot mystère se joue aussi à deux (chacun son mot, à tour de rôle ; un point par mot
  trouvé, le moins d'erreurs départage), et le calcul éclair propose un duel : les deux joueurs font exactement la même
  série l'un après l'autre, le plus rapide gagne (le record et les points vont au profil qui joue).
- **Géographie** : les 18 régions et leur chef-lieu (CM2, 3e), les pays et leur continent (CE2, CM1), les grandes
  métropoles du monde et leur pays (4e), les 26 États de l'Union européenne et leur capitale (3e, Tle) ; dans la quête de
  l'année et au jeu de mémoire (`content/generators/{hg-regions,hg-p-pays-continents,hg-metropoles,hg-ue-capitales}.json`).
- **Bonus de fin de chapitre** (quête de l'année) : un chapitre terminé propose le petit jeu qui le prolonge, déjà réglé
  sur la classe et le thème : sa frise (histoire, technologie, musique), ses associations au jeu de mémoire, le
  vocabulaire au mot mystère (langues), un calcul éclair (maths), une devinette (français). Les jeux se règlent par
  l'adresse : `#/frise?classe=5e&theme=hg5-chronologie`, `#/memoire?classe=1re&theme=hg-l-capitales`,
  `#/eclair?classe=4e`, `#/mot?classe=5e&mots=es` (`bonusGame` dans `js/ui/game/mini-games.js`).
- **Espace parents : « Les jeux cette semaine »** : chapitres terminés, gardiens, quêtes, défis, parties de plateau,
  énigmes et jours de chaque petit jeu sur les sept derniers jours, records récents du calcul éclair, et ce que les jeux
  font travailler (`parentGamesSection` dans `js/ui/game/mini-games.js`, appelée par `js/ui/views/parents.js`).
- **Petits jeux du jour** (page Aujourd'hui, carte « Jouer ») : mémoire, frise, calcul éclair et mot mystère, chacun avec ce qu'il
  rapporte ou « ✓ fait aujourd'hui », et un « 🌟 jeu du jour » qui change chaque jour pour varier les plaisirs ; la page
  « Ma progression » liste les records personnels (`js/ui/game/mini-games.js`).
- **Calcul éclair** (`#/eclair`, liens depuis le plateau et la page Aujourd'hui) : 10 ou 20 calculs mentaux de la classe,
  l'un après l'autre, avec un pavé numérique pour les tablettes. Du CP (compléments à 10) à la terminale (coefficients
  multiplicateurs), en passant par les tables, les divisions, ×10 et ×100, les décimaux, les fractions d'une quantité,
  les priorités, les relatifs, les carrés, les puissances et les pourcentages ; un thème ou le mélange de la classe.
  Un calcul raté revient trois calculs plus loin : la série se termine toujours sur des réussites. Avec le chrono, le
  temps total devient un record personnel (par classe, thème et longueur, gardé dans le profil : `records` dans l'état
  du jeu) ; sans le chrono, on s'entraîne tranquillement. +10 points une fois par jour, trophées « Esprit vif » et
  « Fusée du calcul », les calculs ratés à retravailler (`js/engine/eclair.js`, `js/ui/views/eclair.js`,
  `recordBest` dans `js/app/store.js`, `withRecord` dans `js/engine/game.js`).
- **Frise chronologique** (`#/frise`, liens depuis le plateau et la page Aujourd'hui) : une carte est posée ; on pioche
  un événement et on le place avant, après ou entre les cartes déjà posées. Bien placé, il reste ; mal placé, il rejoint
  sa vraie place (l'année s'affiche : on apprend en jouant). Seul avec 3 vies (1 à 3 étoiles), ou à deux sur le même
  appareil (un point par carte bien placée). 8 ou 12 cartes, indice facultatif, +10 points une fois par jour, trophées
  « Voyageur du temps » et « Historien en herbe », la frise complète en récapitulatif (`js/engine/frise.js`,
  `js/ui/views/frise.js`). Toutes les frises de la classe servent : du CE2 à la terminale, et la musique au collège.
- **Nouvelles frises** : CE2 (de Lascaux à l'euro : les grandes périodes), 6e (des premiers outils à la fin de l'Empire
  romain), 3e (de 1914 à 2002), inventions et découvertes (de Gutenberg au smartphone : CM2 et technologie de la 5e à la 3e),
  histoire des arts (de Lascaux à la pyramide du Louvre : arts plastiques de la 5e à la 3e), histoire des sciences
  (d'Ératosthène à la première image d'un trou noir : physique-chimie en 3e, enseignement scientifique au lycée), dans la quête de l'année, la frise et le jeu de mémoire. Les dates approximatives de la
  Préhistoire (« vers 300 000 av. J.-C. ») ne servent qu'à ranger, jamais à « retrouver l'année » (`data.mode: "frise"`,
  champ `circa` : une date approximative n'est jamais demandée ; `js/generators/data-kinds.js` affiche les années
  avant J.-C. en clair).
- **Banques de questions agrandies** (pour rejouer une année entière sans revoir sans cesse les mêmes questions) :
  EMC de 8 à 23-25 questions par cycle (numéros d'urgence, symboles, commémorations, institutions, Ve République,
  laïcité, médias), philosophie (22 citations, 18 repères), EPS, numérique au primaire, enseignement scientifique,
  sciences de l'ingénieur, SES, NSI, SNT, géographie du lycée (21 à 22 questions par classe), SVT de la 2nde à la Tle ;
  puis français du lycée (versification, mouvements littéraires, argumentation), technologie au collège (matériaux,
  énergie, programmation, réseaux, cycle de vie, numérique responsable) et anglais du lycée (voix passive,
  conditionnels, relatifs, discours rapporté, repères culturels).
- **Associations au lycée** (`content/generators/{pc-l-unites,svt-l-organites,maths-l-derivees,hg-l-capitales,philo-l-auteurs}.json`) :
  une grandeur et son unité SI (newton, joule, watt, pascal, coulomb, volt, ampère, hertz, ohm, mole), un élément de la
  cellule et son rôle, une fonction usuelle et sa dérivée, 14 grands pays et leur capitale, 12 philosophes et une de
  leurs œuvres. Rattachées aux chapitres du lycée (quête de l'année) et jouables au jeu de mémoire de la 2nde à la Tle.
- **Jeu de mémoire** (`#/memoire`, liens depuis le plateau et la page Aujourd'hui) : 12 ou 16 cartes face cachée, des paires
  tirées des contenus de la classe (associations, vocabulaire anglais, frises : un événement ↔ son année). Seul, en un
  minimum d'essais (1 à 3 étoiles), ou à deux sur le même appareil (une paire = un point et on rejoue). +10 points une
  fois par jour, trophées « Bonne mémoire » et « Mémoire d'éléphant », récapitulatif des paires à la fin
  (`js/engine/memoire.js`, `js/ui/views/memoire.js` ; `loadData` exporté par `js/generators/registry.js`).
- **Gardiens des périodes** (quête de l'année) : chaque période a son gardien (Feuillu le hérisson, Frimas la chouette,
  Banquise le phoque, Pétale la tortue, Solaris le dragon). Dès deux chapitres de la période terminés, on peut le défier :
  8 questions mêlées des chapitres faits (révision espacée et entrelacée) ; chaque réponse réussie sans la correction
  (au plus un indice ou un 2e essai) allume un de ses 5 cœurs. Cinq cœurs : il est apprivoisé et ouvre son trésor
  (+30 points, vignette rare, trophées « Ami des gardiens » et « Dompteur de dragons ») ; sinon il s'envole et revient
  avec d'autres questions, sans pénalité. Affrontement enregistré (reprise après une pause), revanche possible sans
  nouveaux points (`js/engine/gardien.js`, `js/ui/game/guardian-view.js`, `planReview` dans `quest-plan.js`).
- **École primaire (CP → CM2)** : 23 générateurs de mathématiques rattachés aux chapitres des parcours officiels
  (`js/generators/primaire-maths.js`, notions dans `content/skills/maths-primaire.json`) : numération, calcul,
  tables, grandeurs, fractions, décimaux, problèmes, géométrie, données, hasard. La quête de l'année, la quête libre,
  le plateau, les séries et les générateurs illimités fonctionnent donc aussi au primaire (19 à 23 chapitres de maths
  jouables par classe). Les erreurs typiques sont diagnostiquées (retenue oubliée, « 1 h = 100 min », virgules…).
- **Primaire, toutes matières** : 31 générateurs de données (`content/generators/*-p-*.json`, fabriqués par
  `dev/gen_primaire.py`) et 2 générateurs « temps » (`js/generators/primaire-monde.js`) : conjugaison du CP au CM2
  (présent → passé simple et plus-que-parfait), homophones, pluriels, féminins, accord sujet-verbe, classes de mots,
  types de phrases, contraires ; vivant/non vivant, régimes alimentaires, états de la matière, familles d'aliments,
  conducteurs/isolants, ovipares/vivipares, sources de lumière, énergies, classification des vertébrés ; calendrier,
  siècles, grandes périodes, frises du Moyen Âge à 1789 et de 1789 à nos jours, continents et océans, capitales de
  l'UE ; anglais (59 mots, avec écoute). Chaque générateur est rattaché à ses chapitres officiels : en CE1 comme en
  CM2, cinq matières ont leur quête de l'année.
- **Savoirs du primaire, nouveau lot** (`js/generators/primaire-savoirs.js`, `content/skills/primaire-savoirs.json`) :
  15 générateurs à questions courtes, chacun avec une explication — système solaire (planètes à ranger), Terre-Soleil-Lune
  et saisons, digestion et circulation, chaînes alimentaires, vitesses (distance, durée), masses, volumes et
  températures, l'eau solide et liquide, cerveau et sens, fabrication du pain et du yaourt, projet technique, famille
  et générations, sons et lettres muettes, analyse de la phrase (sujet même inversé, COD, compléments
  circonstanciels), et un **robot à guider sur un quadrillage** (CP-CE1 : coder un déplacement ; CM : programmes et
  boucles « répéter »). Et 41 générateurs de données de plus (`gen_primaire.py`) : instruments de météo, météo ou climat,
  séismes et volcans, familles d'aliments, rôles dans l'écosystème, trajectoires, objets fabriqués ou naturels, besoins,
  objets d'hier et d'aujourd'hui, articulations, os et muscles, cinq sens, santé, tri des déchets et gestes pour la
  planète, paysages de France, grands milieux, lieux de la commune, transports, Internet, âge industriel, cultures
  tempérées et tropicales, contes, fables de La Fontaine, héros, auteurs, phrase simple ou complexe, rimes,
  traitement de texte. Chapitres jouables dans la quête de l'année : sciences CM2 7 → 19 sur 21, CM1 6 → 14 sur 15,
  CP 4 → 9 sur 9 ; histoire-géographie CE1, CE2 et CM2 complètes ; français CM1 et CM2 8 → 15 sur 20 (restent l'oral,
  la lecture à voix haute et la production d'écrits, à faire en classe).
- **Lire et comprendre (CP → CM2)** (`js/generators/primaire-lecture.js`) : 18 courts textes originaux (récits et
  documentaires) avec une question explicite ou d'inférence (« Quelle saison est-ce ? », « Pourquoi sourit-elle ? »),
  l'indice expliqué dans la correction ; l'énoncé peut être lu à voix haute.
- **Écrire (CP → CM2)** (`js/generators/primaire-ecrire.js`) : construire une phrase en remettant ses mots dans l'ordre
  (majuscule au début, point à la fin) ; organiser un récit en cinq étapes (situation initiale, élément perturbateur,
  péripéties, résolution, situation finale).
- **Encore au primaire** : dictées lues par l'ordinateur (mots du CP, mots invariables du CE1, phrases du CE2, avec les
  erreurs typiques reconnues), cycles de vie et phases de la Lune à remettre dans l'ordre, journée, semaine et saisons,
  points cardinaux, symboles de la République (`js/generators/primaire-plus.js`, `emc-p-symboles`).
- **Trophées annoncés** : un message « 🏆 Nouveau trophée » quand on en gagne un.
- **Correctif** : dans « Générateurs illimités », la classe de l'élève est transmise (un CE2 n'a plus des exercices de CP).
- **Curiosité et bonnes habitudes** : énigme du jour (une par jour, matière tournante, +10 points, série d'énigmes,
  un « Le savais-tu ? » parmi 30 curiosités vérifiées, trophées Esprit curieux / Grand curieux) ; constellation de
  l'année (une étoile par chapitre, allumée à la médaille) ; série de réussites du premier coup dans les quêtes ;
  pause proposée après 25 minutes d'exercices sans coupure (jamais imposée).
- **Quête libre** : un chemin linéaire au choix, un exercice par étape ; toutes les
  4 étapes, un défi garde un coffre (relevé = réussi sans la correction, au plus un indice ou un 2e essai) ;
  au bout, le grand coffre (au moins la moitié des étoiles). Sauvegardée par profil, reprise au retour.
- **Jeu de plateau** (`#/jeu`) : 1 à 4 joueurs sur le même ordinateur, chacun avec les questions de sa classe.
- **Récompenses** : points (défi 15, quête 40, partie 15, victoire +20, chapitre 20, période 50, année 100, gardien 30, famille 25, mémoire 10, frise 10, calcul éclair 10, mot mystère 10, lecture chronométrée 10 ; une fois par
  identifiant), album de 48 vignettes de lumière, puis album des animaux, puis album des merveilles du monde (chacun : 36 ordinaires dans les coffres de défi, 12 rares pour une quête, une
  période, une année ou une victoire), 11 trophées.

Fichiers ajoutés : `js/engine/{quete,annee,enigme,plateau,gardien,famille,memoire,frise,eclair,mot,fluence}.js`, `js/generators/{lycee-options,college-arts-plus,primaire-maths,primaire-monde,primaire-plus,primaire-savoirs,lycee-maths,lycee-pc,lycee-maths-1t,lycee-pc-1t,college-techno,college-langues,lycee-svt,lycee-hg,lycee-svt-1t,lycee-francais,lycee-ses-nsi,emc,philo,arts-numerique,lycee-langues,eps-sciences,complements}.js`, `content/skills/maths-primaire.json`,
`js/ui/game/{quest-plan,quest-view,year-view,guardian-view,family-card,rewards-ui,mini-games,pause,board,deck,dice}.js`, `js/ui/views/{enigme,memoire,frise,eclair,mot,fluence}.js`,
`js/ui/views/jeu.js`, `css/jeu.css`. Fichiers modifiés : `index.html`, `js/main.js`, `js/app/store.js`, `js/ui/exercise.js`,
`js/engine/game.js`, `js/engine/game-rewards.js`, `js/generators/maths-pc.js`, `js/generators/data-kinds.js`, `js/ui/views/{exercices,progression,today,parents}.js`,
`content/index.json` (les notions et les générateurs de données du primaire ajoutés ; à régénérer par `npm run build` à l'intégration), `content/skills/{maths-primaire,hg-primaire,primaire-donnees,primaire-plus,primaire-savoirs,lycee-maths,lycee-pc,lycee-maths-1t,lycee-pc-1t,college-techno,college-langues,lycee-svt,lycee-hg,lycee-svt-1t,lycee-francais,lycee-ses-nsi,emc}.json`.
Différence exacte avec la racine : `git diff --no-index <racine> essai-jeu` (en excluant `sw.js`, `precache.json`, `dev/`).

`sw.js` de l'essai ne met rien en cache (le cache hors connexion appartient à l'application principale).

Tests : `node --test essai-jeu/dev/tests/*.test.js` (565 tests : plateau, quête, année, album, points, énigme, pauses, et les générateurs du primaire — 60 tirages par classe et par niveau, bonne réponse acceptée, erreurs typiques diagnostiquées).
