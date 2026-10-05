# État du projet — version 0.1 (5 octobre 2026)

Liste honnête de ce qui est terminé et de ce qui reste à développer. Les chiffres sont issus des contenus (voir [MATRICE-PROGRAMMES.md](MATRICE-PROGRAMMES.md)).

## Terminé et testé

### Socle technique
- PWA installable (Chrome, Edge), utilisable hors connexion (tous les fichiers et contenus pré-cachés), responsive ordinateur / tablette.
- Profils locaux par pseudo (aucune donnée personnelle demandée), IndexedDB, plusieurs profils par ordinateur.
- Sauvegarde JSON avec empreinte de contrôle, restauration profil par profil (copie ou remplacement), effacement d'un profil ou de tout, code parent.
- Aucun appel réseau applicatif (politique de sécurité stricte), aucune IA distante.
- Contenus en JSON, ajout de chapitres sans code ; validateur qui rejoue les réponses types de chaque exercice sur 7 tirages.
- Tests : 44 tests automatiques (moteur d'expressions, correcteurs, élèves fictifs, bout en bout dans un vrai navigateur).

### Moteur pédagogique
- Diagnostic par type d'erreur (notion, prérequis, calcul, signe, lecture, méthode, justification, forme, unité, arrondi, raisonnement) et par idée fausse (296 idées fausses déclarées dans les contenus).
- Analyse de la démarche : chaque étape d'un calcul ou d'une équation est vérifiée.
- Modèle de l'élève par compétence : maîtrise, autonomie, rapidité, justification, réussite immédiate et différée, révision espacée, résurgences.
- Recommandations expliquées (élève et parent), sélection d'exercice adaptée (difficulté, représentation, idée fausse ciblée).
- Parcours facultatifs approfondissement / expert, qui ne font jamais baisser la progression du programme.
- Cinq élèves fictifs simulés par le moteur, chargeables dans l'application, et rapport généré.

### Contenus
- **23 leçons, 341 exercices** (230 niveau de la classe, 54 approfondissement, 341PERT expert), QCM ≈ 18PCT % des questions.
- Mathématiques 5e (programme 2026) : relatifs, fractions, calcul littéral (preuve et contre-exemple), triangles (dont démonstration de la somme des angles), probabilités.
- Mathématiques 4e (programme 2020) : relatifs (produit), puissances, équations, Pythagore ; 3e : double distributivité.
- Physique-chimie (cycle 4) : changements d'état, masse volumique, vitesse, loi d'Ohm, son et lumière, poids et masse.
- Programmation : tortue (séquences, boucles, débogage), variables, conditions, procédures — blocs puis texte.
- Intelligence artificielle : apprendre à partir d'exemples, biais des données, modèles de langage, usage responsable.
- Français : réviser un texte à partir de critères (5e), accord du participe passé (4e). Histoire : la Révolution française (4e).
- 14 activités interactives (balance, droite graduée, fractions, Pythagore, triangles, dés, loi d'Ohm, masse volumique, chronophotographie, poids, changement d'état, classifieur, modèle de langage, tortue).
- Programmes 2026-2027 : 53 textes officiels référencés pour 12 niveaux, 155 parcours niveau × matière, liens BO / Éduscol / Légifrance (marqués « vérifié » ou non), 20 pages Lumni vérifiées.

## Partiellement fait
- **Couverture des programmes** : 11 parcours sur 155 ont des leçons rédigées ; même dans ceux-ci, des chapitres restent « à venir » (ex. en 5e : symétries, parallélogrammes, aires et volumes, statistiques, proportionnalité). Les autres parcours affichent les domaines et notions officiels, sans exercices.
- **Projets interdisciplinaires** : quelques ponts existent (masse volumique ↔ glace qui flotte, proportionnalité ↔ loi d'Ohm), pas encore de vrais projets transversaux.
- **Accessibilité** : clavier et lecteurs d'écran pris en compte dans les manipulations principales ; pas d'audit complet, pas de synthèse vocale, pas de mode dyslexie.
- **Liens officiels** : une partie des URL du BO et d'Éduscol n'a pas pu être ouverte par nos outils (sites protégés) ; elles sont marquées « non vérifiées » dans l'application.
- **Paramètres du moteur** : valeurs par défaut raisonnables, non encore calibrées sur de vraies données d'élèves.

## Reste à développer
1. Leçons des chapitres « à venir » en 5e et 4e (priorité : vos enfants), puis 3e et 6e.
2. SVT, technologie, EMC, langues vivantes : aucune leçon interactive.
3. Primaire (CP-CM2) : lecture, numération, calcul — nécessite d'autres types d'activités (audio, manipulation d'objets).
4. Lycée : mathématiques (nouveau programme 2026 de seconde), physique-chimie, SNT/NSI avec Python.
5. Correction des rédactions assistée par IA, **locale de préférence** ; une IA distante ne serait activée qu'avec l'accord explicite d'un parent (l'espace Parents indique aujourd'hui qu'aucune IA distante n'est utilisée ; fonctionnalité non implémentée).
6. Synthèse vocale des énoncés, mode dyslexie, taille de texte réglable.
7. Synchronisation optionnelle entre les deux ordinateurs (aujourd'hui : export / import manuel).
8. Mise en évidence de la ligne en cours pendant l'exécution pas à pas des programmes (le dessin pas à pas existe déjà).
9. Relecture de l'ensemble des contenus par un enseignant.
