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
- **Récompenses** : points (défi 15, quête 40, partie 15, victoire +20, chapitre 20, période 50, année 100, gardien 30, famille 25 ; une fois par
  identifiant), album de 48 vignettes de lumière puis album des animaux (36 ordinaires dans les coffres de défi, 12 rares pour une quête, une
  période, une année ou une victoire), 11 trophées.

Fichiers ajoutés : `js/engine/{quete,annee,enigme,plateau,gardien,famille}.js`, `js/generators/{primaire-maths,primaire-monde,primaire-plus,primaire-savoirs,lycee-maths,lycee-pc,lycee-maths-1t,lycee-pc-1t,college-techno,college-langues,lycee-svt,lycee-hg,lycee-svt-1t,lycee-francais,lycee-ses-nsi}.js`, `content/skills/maths-primaire.json`,
`js/ui/game/{quest-plan,quest-view,year-view,guardian-view,family-card,rewards-ui,pause,board,deck,dice}.js`, `js/ui/views/enigme.js`,
`js/ui/views/jeu.js`, `css/jeu.css`. Fichiers modifiés : `index.html`, `js/main.js`, `js/app/store.js`, `js/ui/exercise.js`,
`js/engine/game.js`, `js/engine/game-rewards.js`, `js/generators/maths-pc.js`, `js/ui/views/{exercices,progression,today}.js`,
`content/index.json` (les notions et les générateurs de données du primaire ajoutés ; à régénérer par `npm run build` à l'intégration), `content/skills/{maths-primaire,hg-primaire,primaire-donnees,primaire-plus,primaire-savoirs,lycee-maths,lycee-pc,lycee-maths-1t,lycee-pc-1t,college-techno,college-langues,lycee-svt,lycee-hg,lycee-svt-1t,lycee-francais,lycee-ses-nsi}.json`.
Différence exacte avec la racine : `git diff --no-index <racine> essai-jeu` (en excluant `sw.js`, `precache.json`, `dev/`).

`sw.js` de l'essai ne met rien en cache (le cache hors connexion appartient à l'application principale).

Tests : `node --test essai-jeu/dev/tests/*.test.js` (407 tests : plateau, quête, année, album, points, énigme, pauses, et les générateurs du primaire — 60 tirages par classe et par niveau, bonne réponse acceptée, erreurs typiques diagnostiquées).
