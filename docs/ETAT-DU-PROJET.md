# État du projet — version 0.2 (5 octobre 2026)

Liste honnête de ce qui est terminé et de ce qui reste à développer. Les chiffres sont issus des contenus (voir [MATRICE-PROGRAMMES.md](MATRICE-PROGRAMMES.md)).

## Nouveautés de la version 0.2
- **Toutes les matières du collège en 5e et en 4e** : français, histoire-géographie, EMC, SVT, technologie, anglais, espagnol, arts plastiques, éducation musicale, en plus des mathématiques, de la physique-chimie et de la programmation.
- **Espace exercices** : séries sur mesure, 43 générateurs d'exercices illimités, fiches imprimables avec corrigé.
- **Nouveaux types de réponses** : mots à repérer dans un texte, associations, classements, dictée corrigée mot à mot.
- **Lecture à voix haute** des énoncés, des dictées et de l'oral en langue étrangère (voix installées sur l'ordinateur uniquement).

## Terminé et testé

### Socle technique
- PWA installable (Chrome, Edge), utilisable hors connexion (tous les fichiers et contenus pré-cachés), responsive ordinateur / tablette ; installée sur le PC familial (raccourcis Bureau et menu Démarrer).
- Profils locaux par pseudo (aucune donnée personnelle demandée), IndexedDB, plusieurs profils par ordinateur.
- Sauvegarde JSON avec empreinte de contrôle, restauration profil par profil (copie ou remplacement), effacement d'un profil ou de tout, code parent.
- Aucun appel réseau applicatif (politique de sécurité stricte), aucune IA distante, synthèse vocale limitée aux voix locales.
- Contenus en JSON, ajout de chapitres et de générateurs sans code ; validateur qui rejoue les réponses types de chaque exercice sur 7 tirages et 25 tirages par option de chaque générateur.
- Tests : **95 tests automatiques** (85 unitaires et scénarios d'élèves fictifs, 10 de bout en bout dans Edge : chaque leçon et chaque parcours, une série par matière en 5e et 4e, chaque générateur, clavier, impression).

### Moteur pédagogique
- Diagnostic par type d'erreur (notion, prérequis, calcul, signe, lecture, méthode, justification, forme, orthographe, unité, arrondi, raisonnement) et par idée fausse (**853 idées fausses** distinctes déclarées dans les leçons, plus celles calculées par les générateurs).
- Analyse de la démarche : chaque étape d'un calcul ou d'une équation est vérifiée ; dictée alignée mot à mot (mots mal écrits, oubliés, en trop) sans donner la réponse avant la fin.
- Modèle de l'élève par compétence : maîtrise, autonomie, rapidité, justification, réussite immédiate et différée, révision espacée, résurgences.
- Recommandations expliquées (élève et parent), sélection d'exercice adaptée (difficulté, représentation, idée fausse ciblée).
- Parcours facultatifs approfondissement / expert, qui ne font jamais baisser la progression du programme.
- Cinq élèves fictifs simulés par le moteur, chargeables dans l'application, et rapport généré.

### Espace exercices
- Séries sur mesure : classe, matière, chapitres et notions (regroupés selon le programme), parcours, nombre d'exercices, sans QCM, « adaptée à mes besoins » (notions fragiles, révisions dues, erreurs récentes) ; bilan de série et reprise des exercices manqués ; lien « S'entraîner » depuis chaque chapitre de la carte.
- 18 générateurs de calcul (relatifs, priorités, fractions, puissances, équations avec étapes, proportionnalité, pourcentages, Pythagore, calcul littéral, conversions, vitesse, masse volumique, loi d'Ohm, poids) et 25 générateurs de données (conjugaison française et espagnole, homophones, accords, classes de mots, verbes irréguliers anglais, vocabulaire anglais et espagnol, chronologies, notions d'histoire-géographie, valeurs de la République, classification du vivant, organes, aliments, géologie, chaînes d'information et d'énergie, matériaux, unités informatiques, durées musicales, périodes musicales, couleurs, mouvements artistiques).
- Fiche imprimable : énoncés avec zone de réponse adaptée au papier, corrigé sur une nouvelle page, aucun nom imprimé.

### Contenus
- **64 leçons, 902 exercices** (627 niveau de la classe, 136 approfondissement, 139 expert), QCM = 1,4 % des questions.

| Matière | 5e | 4e | Exercices |
|---|---|---|---|
| Mathématiques | 5 leçons (programme 2026) | 4 leçons (+1 en 3e) | 161 |
| Physique-chimie | 1 | 4 (+1 en 3e) | 83 |
| Programmation et IA | 2 | 2 | 56 |
| Français | 5 (programme 2026) | 5 | 139 |
| Histoire-géographie | 4 | 4 | 108 |
| EMC | 1 | 1 | 27 |
| SVT | 3 | 3 | 84 |
| Technologie | 2 | 2 | 56 |
| Langues vivantes (anglais, espagnol) | 5 | 5 | 140 |
| Arts plastiques | 1 | 1 | 24 |
| Éducation musicale | 1 | 1 | 24 |

- 14 activités interactives (balance, droite graduée, fractions, Pythagore, triangles, dés, loi d'Ohm, masse volumique, chronophotographie, poids, changement d'état, classifieur, modèle de langage, tortue).
- Programmes 2026-2027 : 53 textes officiels référencés pour 12 niveaux, 155 parcours niveau × matière (24 rédigés), liens BO / Éduscol / Légifrance (marqués « vérifié » ou non), 20 pages Lumni vérifiées.
- Textes cités : uniquement des extraits courts du domaine public (La Fontaine, Maupassant) ou des textes officiels ; chiffres réels datés et sourcés en histoire-géographie et EMC (Insee, ONU, RTE, OMS).

## Partiellement fait
- **Couverture des programmes** : dans chaque parcours rédigé, plusieurs chapitres restent « à venir » (par exemple 8 sur 13 en français 5e, 10 sur 12 en technologie). Les 131 autres parcours affichent les domaines et notions officiels, sans exercices.
- **Voix** : sur cet ordinateur, Windows n'a que des voix françaises. Pour écouter l'anglais et l'espagnol, un adulte doit ajouter les voix (Paramètres Windows › Heure et langue › Voix › Ajouter des voix) ; en attendant, l'application l'explique au lieu de rester muette.
- **Unités informatiques et années** : reconnues depuis cette version ; certains exercices déjà écrits demandent encore « le nombre seul ».
- **SVT** : le chapitre « Roches, érosion et paysages » (5e) dépasse les attendus du cycle 4 ; il est marqué « approfondissement, facultatif ».
- **Repérage de mots en anglais** : « o'clock » ou « don't » sont découpés en deux mots cliquables.
- **Accessibilité** : clavier et lecteurs d'écran pris en compte dans les manipulations et les nouvelles zones de réponse (statut texte « juste / à revoir », pas seulement la couleur) ; pas d'audit complet, pas de mode dyslexie.
- **Liens officiels** : une partie des URL du BO et d'Éduscol n'a pas pu être ouverte par nos outils (sites protégés) ; elles sont marquées « non vérifiées » dans l'application.
- **Paramètres du moteur** : valeurs par défaut raisonnables, non encore calibrées sur de vraies données d'élèves.

## Reste à développer
1. Leçons des chapitres « à venir » en 5e et 4e (priorité), puis 3e et 6e.
2. Primaire (CP-CM2) : lecture, numération, calcul — nécessite d'autres activités (manipulation d'objets, audio guidé).
3. Lycée : mathématiques (nouveau programme 2026 de seconde), physique-chimie, SNT/NSI avec Python.
4. Correction des rédactions assistée par IA, **locale de préférence** ; une IA distante ne serait activée qu'avec l'accord explicite d'un parent (non implémenté).
5. Mode dyslexie, taille de texte réglable.
6. Synchronisation optionnelle entre ordinateurs (aujourd'hui : export / import manuel).
7. Relecture de l'ensemble des contenus par un enseignant de chaque matière.
