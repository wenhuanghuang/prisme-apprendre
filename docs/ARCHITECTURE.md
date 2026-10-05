# Architecture de Prisme

## 1. Analyse des exigences → choix structurants

| Exigence | Conséquence architecturale |
|---|---|
| Chrome / Edge, installable, partiellement hors connexion | Application web statique **PWA** (manifeste + service worker qui pré-cache tous les fichiers, contenus compris). Aucun serveur applicatif. |
| Chaque enfant a son profil sur son PC, données locales, export / restauration / effacement | Stockage **IndexedDB** dans le navigateur ; fichier de sauvegarde JSON avec empreinte de contrôle ; restauration profil par profil. |
| Pas de nom réel, réponses libres locales, IA distante seulement avec accord parental | Aucun appel réseau applicatif (CSP `connect-src 'self'`). Aucune IA distante dans cette version. Pseudo seulement. |
| Suivi compétence par compétence, typologie d'erreurs, raisons des recommandations | **Moteur pédagogique pur** (fonctions sans effet de bord) testé hors navigateur : modèle de l'élève, recommandations, sélection d'exercices. |
| Analyser la démarche, pas seulement la réponse | **Moteur d'expressions maison** (lecture tolérante à l'écriture des élèves) + un correcteur par type de réponse, qui renvoie un **diagnostic structuré**. |
| Recevoir de nouveaux chapitres sans modifier l'application | **Contenus en JSON** (leçons, exercices paramétrés, compétences, parcours) ; types d'exercices et activités en **registres** ; validateur automatique. |
| Rapide avec des milliers de contenus | Index léger chargé au démarrage (métadonnées des exercices) ; leçons et activités chargées **à la demande** (modules ES dynamiques). |
| Programmes officiels 2026-2027, liens BO / Éduscol, programme vs approfondissement vs hors programme | Catalogue des programmes généré depuis une recherche documentaire sourcée ; chaque compétence porte un statut ; chaque parcours précise si l'ordre est national ou éditorial. |
| Tests automatiques | `node --test` (aucune dépendance) : moteur d'expressions, correcteurs, scénarios d'élèves fictifs ; validateur qui rejoue les réponses types de chaque exercice. |

Choix technique : **JavaScript natif (modules ES), sans framework ni étape de compilation**. Raisons : aucune dépendance à maintenir, démarrage rapide, code lisible par un tiers, même code exécuté dans le navigateur et dans les tests Node.

## 2. Vue d'ensemble

```
app/                         ← racine publiée (site statique)
├── index.html, manifest.webmanifest, sw.js, precache.json
├── css/                     app.css (direction artistique) + styles des laboratoires
├── fonts/, icons/
├── content/                 ← CONTENUS (JSON) : rien à compiler
│   ├── index.json           index léger généré (compétences, leçons, métadonnées d'exercices)
│   ├── catalog.json         niveaux × matières → parcours, couverture
│   ├── programmes.json      textes officiels applicables en 2026-2027 + liens
│   ├── resources.json       liens externes vérifiés (Lumni, Éduscol) par compétence
│   ├── skills/*.json        graphe des compétences (prérequis, statut)
│   ├── courses/*.json       parcours : chapitres, attendus officiels, leçons
│   └── lessons/*.json       leçons : sections pédagogiques + exercices + parcours ◆ ✦
└── js/
    ├── core/                ← logique pure (testée sous Node)
    │   ├── expr.js          lecture/évaluation/équivalence d'expressions, formes, affichage
    │   ├── units.js         grandeurs physiques et conversions
    │   ├── template.js      exercices paramétrés (tirage, interpolation)
    │   ├── turtle.js        langage Tortue (interpréteur sûr, sans eval)
    │   ├── errors.js        typologie des erreurs, format du diagnostic
    │   └── checkers/        un correcteur par type de réponse (registre)
    ├── engine/              ← moteur pédagogique pur (testé sous Node)
    │   ├── mastery.js       modèle de l'élève par compétence
    │   ├── recommend.js     recommandations expliquées
    │   ├── select.js        choix de l'exercice suivant
    │   ├── badges.js        badges liés à des compétences
    │   ├── dashboard.js     synthèse pour le tableau de bord
    │   └── demo-profiles.js élèves fictifs simulés par le moteur
    ├── storage/             IndexedDB (db.js) et sauvegardes (backup.js)
    ├── app/store.js         état de l'application et actions (enregistrer une tentative…)
    ├── activities/          laboratoires interactifs (registre, chargés à la demande)
    └── ui/                  vues (accueil, aujourd'hui, carte, leçon, séance, labo, carnet, parents, programmes)
tools/                       build, validation, catalogue, matrice, rapport des profils fictifs, serveur local
tests/                       unit/ (expressions, correcteurs), scenarios/ (élèves fictifs)
research/                    recherche documentaire sourcée (programmes, Lumni, analyse de l'app de référence)
docs/                        documentation
```

## 3. Flux d'une réponse d'élève

```
élève ──saisie──▶ zone de réponse (ui/answers.js)
                     │ getResponse()
                     ▼
           checkers/index.js  check(instance, réponse)
                     │  → diagnostic { verdict, score, errorType, misconception, prerequisite,
                     │                 stepsOk, firstBadStep, feedback, needsHuman }
                     ▼
           store.recordAttempt()  ──▶ engine/mastery.applyAttempt()  (nouvel état de la compétence)
                     │                         └─ drapeaux : réussite différée, résurgence
                     ├──▶ IndexedDB (états, tentatives, réponses rédigées + versions)
                     ▼
           engine/recommend()  ──▶ « Pour toi aujourd'hui » (raisons élève / parent)
           engine/select()     ──▶ exercice suivant de la séance (« pourquoi cet exercice ? »)
```

## 4. Modèle de contenu

Voir [FORMAT-CONTENU.md](FORMAT-CONTENU.md) et [WIDGETS.md](WIDGETS.md). Points clés :

- **Un exercice = des données**, jamais du code : type, compétence, parcours (classe / approfondissement / expert), rôle (guidé, problème, transfert, remédiation, défi, mission…), difficulté 1-5, représentation (symbolique, visuelle, concrète, manipulation, verbale), cibles (types d'erreur ou idées fausses travaillés), paramètres tirés au hasard, idées fausses diagnostiquées, indices progressifs, correction, démarches alternatives, critères de réussite, et **réponses types** rejouées par le validateur.
- **Une leçon** suit le format demandé (découverte, ressource externe, cours, manipulation, exemple résolu, exercices guidés, réponses libres, problèmes, mission, correction, révision programmée) ; toutes les sections sont facultatives.
- **Un parcours** (niveau × matière) liste ses chapitres **sans nombre imposé** : autant que le programme l'exige ; chaque chapitre porte les attendus officiels, ses compétences et ses leçons (ou « à venir »).

Ajouter un chapitre : écrire `lessons/<id>.json`, le référencer dans le parcours, lancer `npm run build` (qui valide, rejoue les réponses types et régénère l'index et la liste hors connexion). Aucune ligne de JavaScript à modifier.

Ajouter un **type d'exercice** : un correcteur dans `core/checkers/`, une zone de réponse dans `ui/answers.js`. Ajouter une **activité** : un module dans `activities/` et une ligne dans `activities/registry.js`.

## 5. Sécurité et vie privée

- Politique de sécurité du contenu stricte (`default-src 'self'`, pas de script externe, pas de `connect-src` externe) : l'application ne peut techniquement pas envoyer de données ailleurs.
- Aucun `eval` : le langage Tortue et les expressions sont interprétés par nos propres analyseurs.
- Les saisies des élèves ne sont jamais injectées comme HTML (création d'éléments par `textContent`).
- Code parent haché (SHA-256 salé) : il empêche l'accès accidentel, il ne chiffre pas (dit explicitement dans l'interface).
- Sauvegardes : format vérifié (version, empreinte, pseudo), restauration profil par profil, jamais d'écrasement global silencieux.

## 6. Performances

- Démarrage : index JSON unique + vue demandée ; les leçons (≈ 20-60 Ko) et les laboratoires sont chargés à la demande.
- Le moteur travaille sur des métadonnées (≈ 300 octets par exercice) : 10 000 exercices ≈ 3 Mo d'index, recommandations en quelques millisecondes.
- Si le volume grossit au-delà, l'index peut être découpé par niveau sans changer le moteur.

## 7. Déploiement

Site statique : `app/` est publié tel quel (GitHub Pages, `bash tools/deploy.sh`). `npm run build` régénère l'index, le catalogue, les ressources et la liste de pré-cache, et inscrit l'empreinte de la version dans `sw.js`. Le navigateur détecte donc chaque nouvelle version, l'installe en arrière-plan dans un cache séparé, et l'application affiche « Une nouvelle version de Prisme est prête — Recharger maintenant » : un onglet ouvert ne mélange jamais l'ancien et le nouveau code (scénario vérifié dans Edge).
