# Comparaison avec l'application de référence « Pixel & Code »

Application de référence : https://pixel-code-mission-ia-2026.wenhuanghuang.chatgpt.site/ — analysée le 05/10/2026 **en lecture seule** à partir de son code publié (détail, méthode et chiffres : [research/reference-app-analysis.md](../research/reference-app-analysis.md)). Les chiffres de Prisme sont ceux de la version 0.2 (5 octobre 2026) (voir [MATRICE-PROGRAMMES.md](MATRICE-PROGRAMMES.md), générée à partir des contenus).

## En une phrase

**Pixel & Code** affiche un très grand volume (12 niveaux, 109 parcours, 7 648 séances) obtenu par génération de gabarits, avec des QCM sur le texte des séances et sans moteur adaptatif ; **Prisme** couvre moins de chapitres, mais dans **11 matières** (5e et 4e), chaque exercice exerce réellement la notion, analyse la démarche, diagnostique le type d'erreur et alimente un modèle de l'élève compétence par compétence.

## Tableau comparatif

| Critère | Pixel & Code (constaté dans le code) | Prisme v0.2 |
|---|---|---|
| Volume affiché | 7 648 séances = 5 × 1 268 + 12 × 109 (générées au chargement) | **64** leçons rédigées dans 11 matières, **902** exercices (1 997 questions), chacun différent ; **43 générateurs** d'exercices illimités ; 155 parcours niveau × matière structurés à partir des programmes, dont **24** rédigés (toutes les matières de 5e et de 4e) |
| Contenu original | ≈ 1 texte original pour 11 séances ; 16,6 % de combinaisons distinctes ; « expert » : 9 exemples pour 1 704 séances | Chaque exercice est écrit pour une difficulté précise ; les exercices paramétrés changent de valeurs à chaque tirage (et sont vérifiés sur 7 tirages) |
| Maths et physique réellement exercées | 0 calcul évalué dans les 7 648 séances (78 QCM justes dans 26 chapitres « historiques ») | Calculs vérifiés ligne par ligne, expressions (forme développée, factorisée…), grandeurs avec unités, mesures en laboratoire virtuel, contre-exemples, démonstrations |
| Part de QCM | 75 % des tâches corrigées ; 79,4 % devinables par le titre ; doublons dans 30 % | **27** QCM sur 1 997 questions (1,4 %), réservés aux « vérifications rapides » |
| Types de réponses | QCM + réordonnancement générique | 19 types : étapes de calcul et d'équations, mots à repérer dans un texte, associations, classements, dictée corrigée mot à mot, expression, numérique avec unité, réponse courte, rédaction critériée, contre-exemple, réponses multiples, équation à inventer, tableau, frise, droite graduée, repère, programme (blocs puis texte), problèmes à plusieurs questions… |
| Analyse de la démarche | aucune | étapes justes / première étape fausse ; type d'erreur ; idée fausse ; prérequis en cause |
| Retour sur erreur | l'indice affiche la bonne réponse | indices progressifs (2-3), correction détaillée seulement à la demande ou après réussite, autres démarches valables, nouvelle version possible |
| Réponses ouvertes | 3 cases cochées + 12 à 40 caractères, ni évalués ni enregistrés | critères visibles, repères indicatifs, auto-évaluation, versions successives conservées, **validation par un parent**, jamais déclarées fausses automatiquement |
| Trois niveaux de difficulté | même mécanique, textes de gabarit | parcours classe / approfondissement / expert **réellement différents** : non routinier, plusieurs méthodes, généralisation, contre-exemples, modélisation, incertitudes, passerelles signalées ; facultatifs et sans effet négatif sur la progression du programme |
| Moteur adaptatif | absent (seules les séances terminées sont stockées) | maîtrise par compétence (BKT à crédit partiel), autonomie, rapidité, justification, réussite immédiate vs différée, erreurs par type, idées fausses, **résurgences**, **révision espacée**, prérequis |
| Recommandations | aucune | 8 règles (rappel, prérequis, remédiation ciblée avec changement de représentation, révision, justification, suite, transfert, défi) **expliquées à l'élève et au parent** |
| Tableau de bord parent | compteurs, non protégé | compétences maîtrisées / fragiles, prérequis manquants, erreurs récurrentes, notions à revoir, progrès dans le temps, recommandations motivées, parcours avancés séparés du programme, rédactions à valider ; code parent ; aucun classement entre enfants |
| Programmes officiels | URL par niveau et matière (22 Éduscol, 9 BO), sans lien aux attendus | 53 textes applicables en 2026-2027 avec calendrier réel (ex. nouveau programme de 5e 2026, 4e/3e sur le programme 2020) ; attendus officiels rattachés aux chapitres ; statut programme / approfondissement / hors programme par compétence ; mention « progression éditoriale » quand le programme est défini par cycle |
| Lumni | 103 rubriques par matière, ≈ 9 vidéos précises | 20 notions avec une page Lumni précise **vérifiée**, liens seulement (rien n'est copié) |
| Stockage, sauvegarde | localStorage, import qui remplace tout | IndexedDB ; sauvegarde avec empreinte ; restauration **profil par profil** (copie ou remplacement) ; effacement par profil ou total |
| Vie privée | aucun appel réseau applicatif | idem, et politique de sécurité qui l'interdit techniquement ; pas d'IA distante |
| Ludification | 7 badges, déverrouillage | carte de progression, missions, énigmes, laboratoires, badges attestant une compétence précise, défis facultatifs, guide « Photon » ; pas de points ni de classement |
| IA et code | bons laboratoires (k plus proches voisins, prédiction du mot suivant, interpréteur pas à pas) — **point fort réel** | laboratoires équivalents (classifieur avec matrice d'erreurs et données biaisées, mini modèle de langage), programmation par blocs **puis** en texte, débogage, diagnostic par le dessin produit |
| Accessibilité | ARIA abondant, synthèse vocale ; pas de gestion clavier spécifique | manipulations utilisables au clavier (droite graduée, repère, frise, blocs, mots à repérer), lien d'évitement, focus visible ; **synthèse vocale** des énoncés, des dictées et de l'oral en langue étrangère avec les seules voix installées sur l'ordinateur (aucun envoi de texte) |
| PWA | oui (icône SVG seule) | oui (icônes PNG, hors ligne complet, contenus compris) |
| Génération d'exercices | gabarits de textes générés au chargement | **Espace exercices** : séries sur mesure (classe, matière, chapitres, parcours, nombre, « adaptée à mes besoins »), 43 générateurs (calcul, conjugaison, vocabulaire, chronologie, classements…) dont les réponses fausses typiques sont calculées et diagnostiquées ; fiche imprimable avec corrigé |
| Tests | non observables | **95** tests (85 unitaires et scénarios d'élèves fictifs, 10 de bout en bout dans Edge) + rejeu des réponses types de chaque exercice + 40 tirages contrôlés par option de chaque générateur |

## Ce que Pixel & Code fait mieux aujourd'hui (honnêtement)

- **Couverture apparente** : toutes les matières et tous les niveaux ont des séances navigables ; Prisme a des leçons interactives sur 24 parcours (toutes les matières de 5e et de 4e, plus la 3e en maths et physique-chimie) ; les 131 autres listent les domaines officiels, « à venir », et même dans les parcours rédigés plusieurs chapitres restent « à venir ».
- Ambiance très accueillante pour les plus jeunes ; sa synthèse vocale fonctionne sans installation, alors que Prisme exige une voix installée sur l'ordinateur pour l'anglais et l'espagnol (choix de confidentialité).
- **Interpréteur pas à pas** du mode « J'explore » (Prisme propose un dessin pas à pas, segment par segment, mais sans suivi de la ligne en cours ni des variables).

## Ce que Prisme apporte et que l'autre n'a pas

1. Les notions de maths et de physique sont **réellement exercées et corrigées**, avec analyse des étapes.
2. Le logiciel **sait pourquoi** l'élève s'est trompé, et adapte la suite en conséquence (prérequis, autre représentation, difficulté).
3. Les élèves très à l'aise ont de **vrais problèmes de réflexion** (contre-exemples, paramètres, preuves, incertitudes de mesure), clairement séparés du programme.
4. Le parent voit **les compétences**, pas seulement des séances cochées, et peut valider les rédactions.
5. Le rattachement aux programmes tient compte du **calendrier réel 2026-2027**.
