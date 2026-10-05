# Analyse de l'application de référence « Pixel & Code — Académie interactive du CP à la Terminale »

Analyse du 05/10/2026, en lecture seule. Rien n'a été soumis ni modifié en ligne.

**Sources :**
- `page-BbNtgdP4.js` (409 Ko) : tout le contenu et toute l'interface.
- `index-AcTb4SmW.js` (178 Ko) : moteur de routage vinext/Next, sans aucune donnée pédagogique (0 occurrence de « lumni », « mission », « localStorage »).
- Fichiers récupérés ensuite en GET : HTML d'accueil, `/sw.js`, `/manifest.webmanifest`, `index.ByLcdr77.css` et `layout-segment-context-C2ThMqGU.js`.

**Méthode :**
- Le bundle a été exécuté dans un `vm` Node isolé, sans réseau, avec des imports factices. Les tableaux finaux ont été extraits après exécution des générateurs.
- Le générateur de QCM (fonction `De`) a été reproduit à l'identique, avec le même générateur pseudo-aléatoire et la même graine. Il a été appliqué aux 7 648 séances.
- Les scripts d’extraction, jetables, ne sont pas conservés dans le dépôt.

**Légende :**
- **[Constaté]** : lu dans le code ou mesuré.
- **[Supposé]** : inférence.
- **[Non vérifié]** : affirmation de l'application que je n'ai pas pu contrôler.

---

## Synthèse

1. **Les 7 648 séances sont générées au chargement, aucune n'est rédigée une à une.** Le total s'écrit : 7 648 = 5 × 1 268 « graines » + 12 × 109 parcours. [Constaté]
2. **Le texte vraiment rédigé à la main est réduit :**
   - 604 notions d'environ 16 mots chacune (objectif + exemple + défi facultatif) ;
   - 664 intitulés de thèmes d'une ligne en maths et sciences ;
   - 72 extras hors programme.

   À côté de ça, 26 chapitres « historiques » 5e/4e et 6 missions IA sont, eux, réellement écrits.
3. **86,4 % des séances ont un objectif fabriqué par gabarit** de la forme « … « titre » … ». Une fois le titre retiré, il reste 1 272 combinaisons (objectif, exemple, défi) distinctes sur 7 648, soit 16,6 %. Les 1 704 séances « expert » n'utilisent que 9 exemples différents.
4. **Le déroulé est identique pour toutes les séances**, en 4 étapes. Les « exercices » sont 3 QCM générés qui interrogent le texte de la séance : reconnaître son objectif, son exemple, la première étape de méthode. Ils n'interrogent jamais la discipline : **aucun calcul ni aucune notion de maths ou de physique n'est évalué dans les 7 648 séances.**
5. **Ces QCM sont fragiles :**
   - dans 79,4 % des cas, on trouve la bonne réponse en repérant simplement le titre ;
   - dans 30,1 % des cas, une option apparaît en double ;
   - dans 19,7 % des cas, la bonne réponse est en double et l'une des deux copies est notée fausse ;
   - la 3e question a la même réponse pour toutes les séances d'une matière ;
   - après une erreur, l'indice affiche la bonne réponse.
6. **Les 3 niveaux de difficulté sont des séances distinctes, mais avec la même mécanique** ; seul le texte change, par gabarit. Le niveau « expert » ne fournit aucun énoncé : une consigne générique, 3 cases à cocher par l'élève lui-même, puis 25 caractères de texte libre.
7. **Il n'y a aucun moteur adaptatif.** L'application ne retient que :
   - la liste des séances et chapitres terminés ;
   - les badges (7) ;
   - le projet de quiz.

   Pas de score, pas d'erreurs, pas de durée, pas de répétition espacée, pas de recommandation.
8. **La vie privée est exemplaire :**
   - pseudo seul, aucun nom réel demandé ;
   - stockage en `localStorage` uniquement ;
   - aucun appel réseau de l'application ;
   - export et import JSON avec validation, réinitialisation confirmée.

   En revanche, l'espace parents n'est pas protégé et n'affiche que des compteurs.
9. **Le rattachement aux programmes s'arrête au niveau de la matière.**
   - 31 URL officielles (22 Éduscol, 9 arrêtés BO) et 103 rubriques Lumni.
   - Aucune séance ne renvoie vers une vidéo précise.
   - La distinction entre programme, approfondissement et expert est explicite et honnête.
10. **Il y a de vrais points forts :**
    - interface soignée, PWA qui fonctionne hors ligne, ludification sans pression ;
    - 7 laboratoires IA et code vraiment interactifs : classement par k plus proches voisins (k-NN), prédiction du mot suivant, interpréteur « MiniCode » pas à pas ;
    - 26 chapitres 5e/4e de bonne facture.

    Mais ce cœur de qualité se résume à quelques dizaines d'activités, face aux 7 648 séances annoncées.

---

## 1. Modèle de données

### Structure constatée

```
Q (12 niveaux) = Ye( $e( [...ze (5 niveaux primaire), ...Fe (4 collège), ...Re (3 lycée)] ) )
 niveau  { level, programLabel, officialUrl, subjects[] }
  matière/parcours { id, name, icon, color, description, officialUrl, lumniUrl, label,
                     methodSteps[4], units[] }
   séance { id, title, goal, example, challenge?, kind, chapter, phase, difficulty,
            domain?, sourceUrl?, isSynthesis?, videoUrl (toujours undefined) }
```

- Le **chapitre n'est pas un objet**. C'est un champ texte `chapter`, sur lequel l'interface regroupe les séances (`reduce` sur `t.chapter||t.title`).
- La **séance ne contient aucun exercice**. Les exercices sont fabriqués à l'affichage à partir de `goal`, `example` et `methodSteps`.
- Les **missions IA** (6) et l'**académie historique 5e/4e** (4 matières, 26 chapitres) sont deux structures distinctes, celles-là vraiment rédigées.

| Niveau | Matières | Séances | Notions rédigées | Chapitres « classe » |
|---|---:|---:|---:|---:|
| CP | 7 | 464 | 41 | 76 |
| CE1 | 7 | 494 | 41 | 82 |
| CE2 | 7 | 524 | 42 | 88 |
| CM1 | 7 | 574 | 44 | 98 |
| CM2 | 7 | 614 | 44 | 106 |
| 6e | 10 | 590 | 50 | 94 |
| 5e | 10 | 545 | 50 | 85 |
| 4e | 10 | 530 | 50 | 82 |
| 3e | 10 | 530 | 50 | 82 |
| 2de | 9 | 808 | 55 | 140 |
| 1re | 13 | 1 006 | 71 | 170 |
| Terminale | 12 | 969 | 66 | 165 |
| **Total** | **109** | **7 648** | **604** | **1 268** |

### Génération combinatoire [Constaté, code des fonctions `$e`, `Ye`, `Ue`, `Ve`, `He`, `Ge`, `Je`, `qe`, `Qe`]

1. **`$e` (maths et sciences).** Pour 25 couples niveau × matière (maths et sciences/physique-chimie, du CP à la Terminale) :
   - les notions rédigées sont remplacées par une liste `Ze` de **664 intitulés** répartis en 127 domaines. Ce sont des chaînes séparées par « ; », par exemple « Demi-tour et symétrie centrale » ;
   - chaque intitulé devient une séance dont l'objectif, l'exemple et le défi sont des **gabarits** (`Qe`) ;
   - les 141 notions rédigées de ces matières sont **recopiées** sous le titre « Révision cumulative — … », avec une phrase ajoutée : « Réactiver les notions dans le temps… ».
2. **`Ye` / `Ue`.** Chaque graine donne 3 séances « classe » :
   - Comprendre : la graine elle-même ;
   - Atelier guidé : gabarit `Ve` ;
   - En autonomie : gabarit `He`.
3. **`Ge`.** Chaque graine donne aussi 2 séances hors programme, approfondissement et expert. Leurs textes sont **100 % gabarit**, choisis selon la famille (maths / sciences / numérique / général) et le cycle.
4. **`Je` / `qe`.** Chaque matière reçoit 3 extras tirés de `Be` (72 entrées, partagées entre tous les niveaux) et un « Projet interdisciplinaire ». Chacun est décliné en 3 phases : Découvrir, Atelier, Projet expert.

| Origine | Graines | Séances |
|---|---:|---:|
| Notions rédigées (hors maths/sciences) × 3 phases | 463 | 1 389 |
| Intitulés `Ze` maths/sciences (1 ligne) × 3 phases | 664 | 1 992 |
| Copies « Révision cumulative » × 3 phases | 141 | 423 |
| **Sous-total « niveau de la classe »** | 1 268 | **3 804** |
| Gabarits hors programme `Ge` (approfondi + expert) | 1 268 × 2 | 2 536 |
| Extras par matière `Je` (109 × 4 × 3) | 436 | 1 308 |
| **Total** | | **7 648** |

### Contenus réellement distincts [Constaté]

| Champ | Chaînes distinctes / total | Après retrait du titre inséré |
|---|---:|---:|
| `goal` (objectif) | 6 550 / 7 648 | **801** |
| `example` | 1 384 / 7 648 | 704 |
| `challenge` | 1 129 / 7 384 | 351 |
| Triplet objectif + exemple + défi | 6 569 | **1 272** (16,6 %) |

- 72,8 % des séances ont un exemple identique à au moins une autre séance de la même matière.
- **Exemples les plus répétés :**
  - « Une question de synthèse oblige à sélectionner les notions pertinentes… » : 475 fois ;
  - « La notion est cachée dans un petit problème du quotidien… » : 450 fois.
- **Volume de texte :**
  - 2,41 millions de caractères de texte affichable sur l'ensemble des séances ;
  - 1,0 million de caractères distincts, gonflés par l'insertion des titres ;
  - **84 000 caractères** seulement de texte rédigé pour les 604 notions de base (environ 3,5 %).
- La donnée générée pèse **4,8 Mo** en JSON, recalculée à chaque démarrage.

**Estimation :** environ **676 notions rédigées** (604 + 72), de 16 mots en moyenne, et 664 intitulés d'une ligne servent de matière première aux 7 648 séances. Cela fait **environ un texte original pour 11 séances**. Tout le reste est du gabarit ou de la répétition.

À noter : les 423 séances « révision cumulative » sont des copies, mais elles sont comptées dans les « 3 804 séances au niveau de la classe ».

---

## 2. Types d'exercices et proportion de QCM

### Séances du parcours principal (7 648 séances, chaîne `Te → Ee → De → Oe`, identique partout) [Constaté]

| Étape | Mécanique | Vérifiée automatiquement ? | Nombre total |
|---|---|---|---:|
| 1. Vidéo et cours | Case « J'ai regardé une ressource » + lien vers la rubrique Lumni de la matière | Non (déclaratif) | 7 648 |
| 2. Manipulation | Remettre en ordre les 4 `methodSteps` de la matière avec des boutons ↑/↓ ; liste présentée inversée au départ | Oui | 7 648 |
| 3. Exercices | **3 QCM à 3 options**, générés | Oui | **22 944** |
| 4. Mission | 3 cases à cocher par l'élève + texte libre de 12, 25 ou 40 caractères minimum selon le cycle, **ni évalué ni enregistré** | Non | 7 648 |

- **QCM :** 75 % des tâches corrigées automatiquement ; les 25 % restants sont l'ordre de la méthode.
- **Absents :** saisie numérique, saisie libre corrigée, glisser-déposer (0 API drag), code et simulation sont absents des 7 648 séances.

**Les 3 QCM générés (reproduction exacte de `De`) :**
1. « Quel objectif correspond au chapitre « *titre de la séance* » ? »
   - Options : l'objectif de la séance et 2 objectifs d'autres séances de la matière.
   - Dans **6 076 cas (79,4 %)**, seule la bonne option contient le titre cité dans la question : on répond par simple correspondance de texte.
   - Dans 533 cas (7,0 %), un leurre contient le même titre (par exemple l'objectif « En autonomie » du même chapitre) : la question est ambiguë.
2. « Quel exemple appartient vraiment à cette notion ? »
   - Options en double dans **2 303 séances (30,1 %)**.
   - Bonne réponse présente deux fois dans **1 506 séances (19,7 %)**. Comme le code prend la première position (`indexOf`), cliquer sur la seconde copie est compté faux.
   - Clé React = texte de l'option : les doublons créent des clés en collision.
3. « Quelle action doit ouvrir la démarche ? »
   - La bonne réponse est **la même pour toutes les séances d'une matière**.
   - Il n'existe que **11 jeux de méthode différents pour 109 matières**. 40 matières de collège partagent le même jeu générique, qui décrit le déroulé de l'application (« Je découvre la notion avec un exemple guidé et une ressource Lumni… ») et non une méthode disciplinaire.
   - L'étape 2 (remise en ordre) porte sur ces mêmes 4 phrases dans toutes les séances.

**Correction :**
- Les essais sont illimités et le retour est immédiat.
- Après une erreur, le message « Relis l'indice » affiche l'`explanation`, qui **est le texte de la bonne réponse** pour les QCM 1 et 2.

**Coût minimal pour valider une séance :**
- 1 case + jusqu'à 6 permutations + au plus 9 clics de QCM + 3 cases + 12 à 40 caractères quelconques (« aaaaaaaaaaaa » passe) + 4 clics de navigation ;
- soit **environ 25 actions** ;
- moins d'une minute [Supposé], loin des 15, 25 ou 35 minutes annoncées. Le champ `minutes` est défini mais jamais lu.

### Académie historique 5e/4e (contenu rédigé) [Constaté]

- **4 matières, 26 chapitres** : informatique 7, maths 6, physique-chimie 6, français 7.
- **Chaque chapitre contient :**
  - 3 concepts ;
  - **3 QCM rédigés** à 3 options, soit **78 QCM** au total, mélangés à l'affichage ;
  - 1 laboratoire ;
  - 1 projet : 3 cases + 20 caractères.
- **Laboratoires** : ordre (`order`) 9, classement par menu déroulant (`sort`) 6, curseur vers une valeur cible (`tune`) 6, assemblage de jetons (`compose`) 5.
- **QCM :** 78 sur 104 items corrigés, soit 75 %.
- La « version 4e » réutilise les **mêmes 3 QCM** que la 5e ; elle ajoute seulement un paragraphe `extension4e`, non interactif.
- Le champ `sessions` (127 séances déclarées au total) n'est qu'un libellé : chaque chapitre se joue en une seule fois.

### Parcours IA, laboratoires libres et projet [Constaté]

- **Parcours IA (6 missions)** : vidéo, puis mini-jeu, puis « À retenir ». Les mini-jeux sont :
  - repérer les usages de l'IA (sélection multiple) ;
  - choisir 4 exemples variés pour entraîner ;
  - construire un prompt par choix binaires, avec un piège sur le mot de passe ;
  - choisir la source fiable ;
  - séquencer des actions ;
  - régler une boucle.
- **Les 18 QCM rédigés des missions ne sont jamais affichés.** Les champs `quiz`, `concepts`, `intro`, `objective` et `labType` des missions ne sont lus nulle part : c'est du **code mort**, comme `gameTitle` et `minutes`.
- **Mode « J'explore » (7 laboratoires sans note) :**
  - prédiction du mot suivant par comptage d'occurrences ;
  - « Deux cerveaux » : règles contre exemples ;
  - entraînement d'un **classifieur k-NN** (3 voisins, distance pondérée couleur / forme / points / antennes) avec mesure du taux de réussite ;
  - studio de prompts, avec une adresse fictive activée par défaut pour apprendre à la retirer ;
  - bureau des preuves face à une « réponse fictive de l'IA » ;
  - **interpréteur MiniCode** en français (`let`, `si/sinon`, `repete`, `affiche`), exécution pas à pas, affichage de la mémoire, garde-fous (600 opérations, 2 500 caractères, `repete` ≤ 20) ;
  - labyrinthe programmé par blocs.
- **Projet final :** l'élève crée un quiz de 5 questions. C'est la **seule saisie libre corrigée** de l'application, par comparaison exacte sans tenir compte de la casse.

### Proportion de QCM, vue d'ensemble

- **Par volume rencontré par l'élève : les QCM dominent.**
  - 22 944 instances générées + 78 rédigées ;
  - 3 tâches corrigées sur 4 dans chaque séance ou chapitre.
- **Par items rédigés et corrigés :**
  - 78 QCM, 26 laboratoires d'académie, 6 mini-jeux, 7 laboratoires libres et 1 créateur de quiz, soit 118 items ;
  - QCM ≈ 66 %.

---

## 3. Fonctionnement des 3 niveaux de difficulté

- **Répartition [Constaté] :**
  - classe : 3 804 séances (49,7 %) ;
  - approfondissement : 2 140 (28,0 %) ;
  - expert : 1 704 (22,3 %).
- Ce sont des **séances distinctes**, chacune avec son identifiant (`…-approfondissement`, `…-expert`, `…-plus-N-projet`). Elles sont présentées dans trois onglets.
- **La mécanique ne change pas avec la difficulté.**
  - Même enchaînement `Te → Ee → De → Oe` : mêmes 3 QCM générés, même remise en ordre, même mission.
  - Les seuls paramètres variables dépendent du **cycle** (Primaire / Collège / Lycée) : longueur minimale du texte (12 / 25 / 40) et formulation de la consigne. Ils ne dépendent pas de la difficulté.
- **Seul le texte change, et il vient presque entièrement de gabarits :**

| Niveau | Séances | Objectifs distincts (hors titre) | Exemples distincts | Défis distincts |
|---|---:|---:|---:|---:|
| Classe | 3 804 | 636 | 1 221 | 1 041 |
| Approfondissement | 2 140 | **15** | 154 | 81 |
| Expert | 1 704 | **12** | **9** | 81 |

- **Les gabarits s'appliquent parfois de façon incohérente [Constaté] :**
  - **Maths, collège.** Tout thème reçoit en expert « Formuler une conjecture… construire une démonstration ». Cela vaut aussi pour « Séquences, entrées-sorties, paramètres et boucles » et « Prismes, cylindres, patrons ».
  - **SVT.** La matière ne correspond à aucun motif du classifieur `We` (`/math/`, `/physique|sciences|scientifique/`, `/technologie|snt|nsi/`). Elle reçoit donc le gabarit « général » des humanités (« Problématiser… examiner une objection… »).
  - **Extras `Be`.** Ils sont partagés par niveau : les mêmes 3 extras « français » servent du CP à la 1re, seul un préfixe de cycle change.
- **L'interface est honnête sur un point :** les onglets indiquent « Facultatif et sans effet sur la progression officielle ».

---

## 4. Moteur adaptatif ?

Il n'y en a pas. [Constaté]

- **Ce qui est enregistré par profil :**
  - `completed` : identifiants des missions IA terminées ;
  - `badges` : 6 badges de mission + « Explorateur IA & Code » ;
  - `courseProgress` : chapitres d'académie terminés ;
  - `curriculumProgress` : identifiants de séances terminées, par « niveau:matière » ;
  - `lastMission`, `project`.
- **Ce qui n'est pas enregistré :** aucune réponse, aucun score, aucun nombre d'essais, aucune durée, aucune date d'activité (seule la date de création du profil existe).
- **Suivi par compétence :** aucun. Il n'existe pas d'objet « compétence » ; la progression se compte en séances terminées par matière.
- **Typologie d'erreurs :** aucune. Les leurres des QCM générés sont tirés au hasard ; les messages d'erreur sont génériques (« Pas encore », « Presque ! Essaie l'autre catégorie »).
- **Répétition espacée :** aucune. Les « révisions cumulatives » sont 141 séances recopiées et placées en fin de liste, sans calendrier ni rappel.
- **Recommandation :**
  - « prochaine mission » = première mission non terminée ;
  - chapitres d'académie déverrouillés dans l'ordre ;
  - séances du parcours principal toutes ouvertes, sans prérequis.

  Aucune recommandation expliquée.
- **Ludification présente :** 7 badges, barres de progression, message de félicitations (« Séance réussie », « Nouveau badge »), missions verrouillées dans l'ordre. **Pas d'XP, pas de série de jours, pas de chronomètre** : les « XP » trouvés par recherche de texte correspondent en fait à « EXPLORATEUR » ou « EXPERT ».

---

## 5. Profils, stockage, export/import, tableau de bord parent, vie privée

**Profils [Constaté] :**
- plusieurs profils sur le même navigateur : pseudo de 20 caractères maximum, couleur d'avatar parmi 4, classe ;
- identifiant `crypto.randomUUID()` ;
- l'accueil précise : « Pas besoin de ton vrai nom, de ton âge ou de ton école ».

**Stockage [Constaté] :**
- **`localStorage` uniquement**, clé `pixel-and-code-v1` ;
- structure `{version:1, profiles[], currentProfileId}` ;
- tout l'état est réécrit à chaque changement ;
- ni IndexedDB, ni sessionStorage, ni cookie posé par l'application.

**Export / import [Constaté] :**
- **Export :** tout le stockage (tous les profils) en `pixel-code-sauvegarde-AAAA-MM-JJ.json`.
- **Import :**
  - fichier de 1 Mo maximum ;
  - validation de la structure (`at()`) : version, types des champs, niveaux connus ;
  - message clair en cas d'échec ;
  - attention : l'import **remplace tout le stockage**, sans fusion.
- **Réinitialisation** d'un profil, avec `window.confirm`.

**Espace parents [Constaté] :**
- C'est un onglet de la barre de navigation, **accessible à l'enfant sans code**.
- **Il affiche :**
  - pour chaque profil : séances officielles terminées sur le total, missions IA sur 6, une barre ;
  - les totaux du catalogue ;
  - les explications sur la vie privée, les liens officiels, 5 règles IA à discuter en famille ;
  - les boutons d'export, d'import et de réinitialisation.
- **Il n'affiche pas :** détail par compétence, temps passé, erreurs, historique.

**Vie privée [Constaté] :**
- **Côté application :**
  - aucun appel réseau dans le code (0 `fetch` dans le bundle de la page) ;
  - aucune publicité, aucun outil de mesure d'audience ;
  - les vidéos Vimeo ne se chargent qu'après un clic, avec `dnt=1` ;
  - les textes « Avec mes mots » ne sont pas enregistrés : leur état reste local au composant, ce que l'espace parents annonce.
- **Côté hébergement (*.chatgpt.site, Cloudflare) :**
  - pose un cookie technique `__cf_bm` et injecte un script anti-robot (`/cdn-cgi/challenge-platform`), hors du code de l'application ;
  - **aucun en-tête de sécurité** observé : ni CSP, ni HSTS, ni X-Frame-Options.
- **Point d'attention [Supposé] :** le projet de quiz (questions et réponses saisies librement) est stocké en clair et peut contenir des données personnelles tapées par l'enfant.

---

## 6. Rattachement aux programmes officiels

**Ce qui est constaté :**
- **Chaque niveau** porte un `programLabel` daté et un lien vers la page Éduscol ou education.gouv du cycle. Exemple : « Programme 2026-2027 — nouveaux français, mathématiques et langues de 5e ».
- **Chaque matière** porte un `officialUrl` (31 URL officielles distinctes au total : 22 Éduscol, 9 arrêtés du BO, 3 pages education.gouv) et un `lumniUrl`, présent pour 109 matières sur 109 (103 distinctes).
- **Les références BO citées** sont : 2020 n°31, 2024 n°9 et 24, 2025 n°16 et 22, 2026 n°10, 12, 22 et 24. Exemple de libellé : « Nouveau programme de 5e · BO du 5 mars 2026 ». [Non vérifié : contenu et exactitude des arrêtés]
- **Lumni :**
  - **0 séance sur 7 648 a sa propre vidéo** (le champ `videoUrl` vaut toujours `undefined`) ; toutes renvoient à la **rubrique Lumni de la matière** ;
  - les vidéos Lumni précises se limitent aux 4 missions IA et à 5 ressources de l'académie 5e/4e ;
  - 2 vidéos Class'Code (Pixees) sont intégrées via Vimeo ;
  - aucune vidéo n'est rehébergée (choix explicite et respectueux des droits) ;
  - l'existence des URL n'a pas été testée. [Non vérifié]
- **Distinction programme / approfondissement / hors programme :**
  - **explicite** dans les données (`kind: programme | hors-programme`, `difficulty`) ;
  - **explicite** dans l'interface, avec des onglets et des bandeaux « FACULTATIF ».
- **Granularité :**
  - en maths et sciences, les séances portent un `domain` (127 domaines, par exemple « Espace et géométrie ») ;
  - **aucune référence aux attendus de fin d'année** ni à un identifiant de compétence ;
  - aucun lien au niveau d'une séance (`sourceUrl` = l'URL de la matière).
- **Ce que l'espace parents reconnaît lui-même :** la progression est « éditoriale », le découpage n'est pas national, et les voies technologique et professionnelle ne sont pas couvertes.

---

## 7. Mathématiques et physique 5e/4e : exemples par difficulté

### Parcours principal, Mathématiques 5e

- **142 séances :** 78 « classe » (26 chapitres), 34 approfondies, 30 expertes.
- **Matière première :** 5 notions rédigées, par exemple « Pensée algébrique : Généraliser un motif et utiliser une lettre », et 21 intitulés d'une ligne.

| Niveau | Séance | Ce qui est demandé (résumé) | Constat |
|---|---|---|---|
| Classe | « Opérations, priorités et parenthèses · Comprendre » | Objectif-gabarit « Comprendre et utiliser « … » dans les calculs… » ; exemple générique « Un même problème est représenté par des mots, un calcul, une figure… » | Aucun calcul de priorités. QCM 1 : la bonne option est la seule qui cite le titre. |
| Classe | « Équations simples et mise en équation · En autonomie » | « Choisir seul quand et comment utiliser « … » » ; défi « Résous un problème nouveau sur « … » » | Aucune équation n'est fournie, l'élève doit l'inventer. |
| Classe | « Issues, événements, équiprobabilité… · Atelier guidé » | « Appliquer « … » à plusieurs situations » | QCM 2 : deux leurres identiques. |
| Approfondi | « Opérations, priorités… · Problème approfondi » | « Relier « … » à une autre notion… » ; défi « Résous le problème par deux démarches… » | Texte identique pour les 26 chapitres ; aucun problème fourni. |
| Approfondi | « Angles alternes-internes… · Problème approfondi » | Idem | QCM 1 ambigu : un leurre cite le même chapitre. |
| Approfondi | « Révision cumulative — Pensée algébrique · Problème approfondi » | Idem | QCM 2 : la bonne réponse apparaît deux fois, l'une est notée fausse. |
| Expert | « Opérations, priorités… · Défi expert » | « Formuler une conjecture…, construire une démonstration » ; « Généralise… rédige une preuve » | Aucun énoncé ; validation par cases à cocher et 25 caractères. |
| Expert | « Demi-tour et symétrie centrale · Défi expert » | Texte identique | Même gabarit pour 26 thèmes. |
| Expert | « Séquences, entrées-sorties… boucles · Défi expert » | « … construire une démonstration » | Gabarit inadapté à un thème d'algorithmique. |

### Parcours principal, Physique-chimie 4e

- **97 séances :** 51 « classe » (17 chapitres), 25 approfondies, 21 expertes.
- **Matière première :** 5 notions rédigées (« Électricité : Mesurer tension et intensité en sécurité ») et 12 intitulés.

| Niveau | Séance | Ce qui est demandé (résumé) | Constat |
|---|---|---|---|
| Classe | « Masse volumique, miscibilité et solubilité · Comprendre » | « Observer, décrire et expliquer « … » par une démarche scientifique » | Aucune donnée, aucun calcul ρ = m/V. |
| Classe | « Actions mécaniques et représentation des forces · En autonomie » | « Choisir seul quand et comment utiliser « … » » | Aucune force à représenter. |
| Classe | « Année-lumière et distances astronomiques · Atelier guidé » | « Appliquer « … » à plusieurs situations » | Exemple générique « Des mesures, documents ou modèles sont confrontés… ». |
| Approfondi | « Masse volumique… · Laboratoire approfondi » | « Enquête expérimentale… mesures, unités et graphiques » ; « estime l'incertitude » | Aucune mesure fournie. |
| Approfondi | « Lois des circuits en série et en dérivation · Laboratoire approfondi » | Texte identique | |
| Approfondi | « Révision cumulative — Propagation des signaux · Laboratoire approfondi » | Texte identique | |
| Expert | « Masse volumique… · Recherche experte » | « Mettre à l'épreuve un modèle… par analyse dimensionnelle, cas limites » | Ambition au-delà du programme de 4e, sans aucun support. |
| Expert | « Intensité et tension dans les circuits · Recherche experte » | Texte identique | |
| Expert | « Révision cumulative — Énergie et puissance · Recherche experte » | Texte identique | |

### Académie 5e/4e, exercices rédigés (sans niveaux de difficulté)

- **Maths :**
  - « De −4 °C à 3 °C, la variation est… » (+7 °C) ;
  - « 2/3 + 1/6 ? » (5/6) ;
  - « 4² ? » (16) ;
  - « 25 % de 80 ? » (20) ;
  - triangle de base 8 et de hauteur 5 (aire 20).
- **Physique-chimie :**
  - « 150 m en 30 s » (5 m/s) ;
  - masse conservée de 150 g de glace fondue ;
  - pH 3 : acide ;
  - « Dans le vide, le son… » (ne se propage pas).
- **Laboratoires à curseur :**
  - recette 300 g pour 4 → 450 g pour 6 ;
  - urne 4/8 ;
  - écho 340 × 1 ÷ 2 = 170 m ;
  - mobile 120 m en 20 s.

### Exigence réelle

- **Parcours principal :**
  - l'ambition affichée est élevée, voire hors programme : démonstration, incertitudes, analyse dimensionnelle ;
  - **l'exigence contrôlée est nulle** : aucun énoncé, aucune donnée, aucune réponse attendue ;
  - les QCM vérifient la reconnaissance d'un texte, pas une compétence.
- **Académie :**
  - des exercices justes et bien expliqués, mais en **application directe en une étape**, à 3 options, avec la réponse révélée par l'indice ;
  - c'est un niveau « automatismes » de 5e, faible pour la 4e (mêmes questions) ;
  - les curseurs n'ont que 9 à 10 positions : ils se résolvent par balayage. [Constaté : retour à chaque changement]

---

## 8. PWA, accessibilité clavier, tests

### PWA [Constaté]

- **Manifest :**
  - `display: standalone`, `lang: fr-FR`, couleurs de thème et de fond, `categories: education` ;
  - **une seule icône SVG « any »** : pas de PNG 192 ni 512, pas d'icône « maskable », pas de captures d'écran ;
  - pas d'`apple-touch-icon` dans le HTML [Supposé : installation dégradée sur iOS] ;
  - pas de `robots.txt` ni de `sitemap.xml` (404).
- **Service worker** (2,4 Ko, cache `pixel-code-academie-2026-v4`) :
  - à l'installation, il récupère `/`, extrait tous les `src` et `href` du HTML et les met en cache, y compris le bloc de 409 Ko qui contient tout le contenu ;
  - navigation : réseau d'abord, avec repli sur la page `/` en cache ;
  - fichiers : cache d'abord ;
  - purge des anciens caches, `skipWaiting` et `clients.claim`.
  - **Le hors-ligne fonctionne pour tout le catalogue après la première visite** ; les vidéos Lumni demandent Internet, ce que l'application annonce.
- **Poids :**
  - page : 409 Ko (121 Ko en gzip, 101 Ko en brotli) ;
  - runtime : 178 Ko (51 Ko gzip) ;
  - CSS : 107 Ko (21 Ko gzip) ;
  - données développées en mémoire : environ 4,8 Mo à chaque démarrage.

### Accessibilité [Constaté]

**Positif :**
- `lang="fr"` sur la page ;
- 58 `aria-label`, 13 `aria-labelledby`, 10 `aria-pressed`, 32 `aria-hidden` (emojis décoratifs) ;
- retours annoncés par `role="status"` (13) et `aria-live` (5) ;
- `fieldset`/`legend` pour chaque QCM ;
- **contrôles natifs** : radio, checkbox, select, range, textarea ;
- **aucune interaction réservée au glisser-déposer** : l'ordre se change avec des boutons ↑/↓ étiquetés « Monter X / Descendre X » ;
- focus déplacé sur le titre à chaque étape de mission ;
- **synthèse vocale « 🔊 Écouter »** (`speechSynthesis`, fr-FR, vitesse 0,9), mais seulement dans les missions IA ;
- `prefers-reduced-motion` respecté ;
- contour de focus de 4 px sur les boutons et les liens.

**Manques :**
- 0 gestionnaire clavier (`onKeyDown`) : les `role="tab"` et `role="menu"` n'ont ni flèches ni Échap ;
- pas de lien d'évitement ;
- l'éditeur de code a `outline:0`, donc le focus y est invisible ;
- les contrastes n'ont pas été mesurés.

### Tests

**Non observable** depuis des fichiers de production : pas de `data-testid`, pas de source maps. Aucune conclusion possible sur l'existence de tests.

---

## 9. Points forts réels, à reconnaître honnêtement

- **Interface et parcours :**
  - séquence claire et constante en 4 étapes, sur 3 univers (parcours principal, académie, IA) ;
  - consignes adaptées au cycle (durée annoncée, longueur et formulation de la consigne) ;
  - ton bienveillant (« Pas de chrono. Essaie autant que tu veux. »).
- **Laboratoires IA et code de grande qualité pédagogique :**
  - IA expliquée par la manipulation plutôt que par un discours : k-NN avec données à rééquilibrer et taux de réussite mesuré, prédiction du mot suivant par comptage, piège de la donnée privée dans le prompt, « réponse fictive de l'IA » à confronter à des sources ;
  - **interpréteur MiniCode** sûr, avec exécution pas à pas et mémoire visible ;
  - **c'est le meilleur de l'application.**
- **IA :** il n'y a **aucun modèle de langage ni aucune API**. L'« IA » est enseignée ; elle n'est pas utilisée pour tutorer. C'est un choix cohérent avec la vie privée et le hors-ligne.
- **Académie 5e/4e :** 26 chapitres rédigés, avec concepts, exemples chiffrés, exercices justes et expliqués, laboratoires à curseur pertinents et projets concrets. Exemples de projets : « Carnet d'expédition polaire », « Station de traitement virtuelle ».
- **Vie privée et transparence :**
  - pseudo seul, stockage local, export et import validés ;
  - honnêteté dans l'espace parents : limites de couverture, découpage non officiel, vidéos laissées chez leur éditeur ;
  - règles IA à discuter en famille.
- **Couverture et hors-ligne :**
  - 12 niveaux et 109 matières nommées, avec liens officiels et Lumni par matière ;
  - PWA hors ligne simple et efficace.
- **Robustesse du code :**
  - validation de l'import, limites de taille ;
  - mélanges pseudo-aléatoires à graine (« Mélanger la série ») ;
  - aucune erreur de structure dans les 7 648 objets générés.

---

## Tableau récapitulatif

| Critère | Application de référence | Observation |
|---|---|---|
| Volume annoncé | 12 niveaux, 109 parcours, 7 648 séances | Chiffres exacts, mais obtenus par produit 5 × 1 268 + 12 × 109 |
| Contenu original | Environ 676 notions de 16 mots + 664 intitulés + 26 chapitres et 6 missions rédigés | Environ 1 texte original pour 11 séances ; 1 272 combinaisons de contenu distinctes (16,6 %) |
| Cours par séance | Objectif + exemple (1 phrase chacun) + lien vers la rubrique Lumni de la matière | Aucun cours rédigé par séance ; 0 vidéo propre à une séance |
| Exercices disciplinaires | 0 dans le parcours principal ; 78 QCM dans l'académie 5e/4e | Les maths et la physique ne sont jamais réellement exercées dans les 7 648 séances |
| Part de QCM | 75 % des tâches corrigées (parcours et académie) | Le reste : un réordonnancement générique identique ; aucune saisie numérique corrigée |
| Qualité des QCM générés | 3 QCM à 3 options sur le texte de la séance | 79,4 % devinables par le titre, 30,1 % avec doublons, 19,7 % avec bonne réponse en double |
| Retour sur erreur | Immédiat, essais illimités | L'indice révèle la réponse ; aucune explication de l'erreur |
| Niveaux de difficulté | Classe / approfondi / expert (49,7 / 28,0 / 22,3 %) | Mêmes mécaniques ; textes de gabarit (expert : 12 objectifs, 9 exemples pour 1 704 séances) |
| Évaluation de la production | 3 cases cochées par l'élève + 12, 25 ou 40 caractères | Rien n'est vérifié ni enregistré |
| Moteur adaptatif | Absent | Seules les séances terminées sont stockées ; ni score, ni erreur, ni durée |
| Répétition espacée | « Révisions cumulatives » statiques (141 copies) | Aucun calendrier ni rappel |
| Ludification | 7 badges, barres, déverrouillage, félicitations | Douce et sans pression ; pas d'XP ni de série de jours |
| Profils | Plusieurs pseudos locaux, avatar, classe | Simple et sûr |
| Stockage | `localStorage` (`pixel-and-code-v1`) | Pas d'IndexedDB ; tout est réécrit à chaque changement |
| Export / import | JSON global, validé, 1 Mo maximum | L'import remplace tout, sans fusion |
| Tableau de bord parent | Compteurs par profil, liens, règles IA | Non protégé ; pas de vue par compétence ni d'historique |
| Vie privée | Aucun appel réseau applicatif, aucun outil de mesure | Hébergeur : cookie Cloudflare ; aucun en-tête de sécurité |
| Programmes officiels | URL par niveau et par matière (22 Éduscol, 9 BO) | Pas de lien aux attendus ni de code de compétence ; dates BO non vérifiées |
| Lumni | 103 rubriques par matière, environ 9 vidéos précises | Vidéos laissées chez l'éditeur (correct pour les droits) |
| Programme / hors programme | Champs `kind` et `difficulty`, onglets étiquetés | Distinction claire et honnête |
| IA | Enseignée par simulation (k-NN, prédiction, prompts, preuves) | Aucun modèle de langage : cohérent avec la vie privée ; très bons laboratoires |
| Code | Interpréteur MiniCode pas à pas, labyrinthe à blocs | Point fort réel, mais seulement dans le mode « J'explore » |
| PWA | Manifest + service worker avec mise en cache à l'installation | Hors-ligne complet ; icône SVG seule, pas de PNG ni d'icône iOS |
| Accessibilité | ARIA abondant, contrôles natifs, synthèse vocale, mouvements réduits | Aucune gestion clavier personnalisée ; focus invisible dans l'éditeur ; pas de lien d'évitement |
| Code mort | 18 QCM, concepts et intro des missions, `minutes`, `gameTitle` | Données rédigées jamais affichées |
| Tests | Non observable depuis la production | Inconnu |
