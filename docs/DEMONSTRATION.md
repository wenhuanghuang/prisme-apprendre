# Démonstration complète (≈ 20 minutes) — mathématiques et physique-chimie

Objectif : vérifier par vous-même, dans l'application, ce qui la distingue d'un catalogue de fiches et de QCM. Chaque étape indique **ce qu'il faut faire** et **ce que vous devez observer**.

Avant de commencer : ouvrir l'application (adresse publique ou `npm start` puis http://localhost:10090/).

---

## A. Le diagnostic, vu par un parent (3 min)

1. Accueil → **« Charger les profils fictifs »**, puis **Parents**.
2. Onglet **Nova (fictif)**. Observer :
   - « Exercices recommandés, et pourquoi » : *D'abord : utiliser la distributivité simple* — le moteur a remonté une difficulté de 3e (double distributivité) à son **prérequis de 5e**, parce que les erreurs correspondent à l'idée fausse « le deuxième terme n'est pas multiplié » ;
   - « Erreurs récurrentes » : type d'erreur + idée fausse identifiée ;
   - « Prérequis manquants ».
3. Onglet **Comète** : la recommandation n°1 est un **rappel**, car une difficulté surmontée il y a trois semaines (soustraire un nombre négatif) **réapparaît**.
4. Onglet **Orbite** : élève très à l'aise → **problème de transfert** et **défi expert** facultatif ; la colonne « contenus facultatifs » est séparée du programme.
5. Onglet **Pulsar** : une **révision espacée** est due (fractions réussies il y a un mois) ; sur les équations, les erreurs sont des **erreurs de calcul**, pas de méthode : la remédiation est ciblée en conséquence.
6. Onglet **Quasar** : réponses justes **sans justification** → exercices où il faut expliquer.

Le détail de ce que calcule le moteur pour chacun est dans [PROFILS-FICTIFS.md](PROFILS-FICTIFS.md).

## B. Mathématiques 4e : résoudre une équation (7 min)

1. Accueil → créer un profil (pseudo seulement) en **4e**. Ouvrir **Carte → Mathématiques → Équations du premier degré**.
2. Section **Découverte** : la **balance**. Cliquer « − 1 bille à gauche seulement » : la balance **penche** (« l'égalité n'est plus vraie »). Annuler. Retirer un sac des deux côtés, puis des billes des deux côtés, puis « Partager » : le **journal** écrit l'équation équivalente à chaque étape.
3. **Exercices guidés**, premier exercice « étape par étape » (ex. *3x + 2 = 29*) :
   - écrire `3x = 29 + 2` puis `x = 31/3`, valider → **« Ligne 1 : un terme a changé de membre sans changer de signe »**, étiquette *Erreur de signe*, « 0/2 étapes justes », ligne 1 marquée ;
   - corriger : `3x = 27`, `x = 9` → réussi ; la correction et **une autre démarche valable** s'affichent.
   - Essayer aussi `x = 27 - 3` sur une ligne de la forme *3x = 27* : diagnostic **« 3 multiplie x : on divise »** (idée fausse, pas une étourderie).
4. Exercice *a(x + b) = c* : écrire la ligne `3x + 2 = …` en oubliant de distribuer → **idée fausse rattachée au prérequis** « distributivité simple ».
5. **Avec tes mots** : rédiger une explication → la réponse n'est **jamais notée fausse automatiquement** : critères visibles, auto-évaluation, exemples de bonnes réponses, bouton « nouvelle version », puis validation par un parent dans l'espace Parents.
6. Parcours **◆ Approfondissement** : *invente une équation dont la solution est −2/3* (n'importe quelle équation juste est acceptée : le logiciel la résout). Parcours **✦ Expert** : *« si a·x = a·y alors x = y »* → l'élève doit trouver un **contre-exemple** (a = 0), vérifié par le calcul ; équation à paramètre ; problème de type concours avec trois méthodes valables.
7. Revenir sur **Aujourd'hui** : les recommandations tiennent compte des erreurs commises ; « Pourquoi ? » montre le raisonnement.

## C. Mathématiques 5e (programme 2026) (3 min)

1. Changer de profil (ou en créer un en 5e) → **Fractions**. Exercice « trois fractions entre 1/3 et 1/2 » : **plusieurs réponses valables**, chacune vérifiée.
2. Dans l'exercice d'addition de fractions, additionner les numérateurs entre eux et les dénominateurs entre eux → idée fausse « on additionne numérateurs et dénominateurs », reconnue comme telle ; la remédiation proposée ensuite utilise les **barres de fractions** (autre représentation).
3. **Triangles** : remettre dans l'ordre les étapes de la **démonstration** de la somme des angles, puis la rédiger. L'inégalité triangulaire est signalée **hors programme 2026** et proposée en approfondissement.

## D. Physique-chimie : la loi d'Ohm (5 min)

1. Profil 4e → **Carte → Physique-chimie → Loi d'Ohm**. La carte précise que le programme est **défini par cycle** (ordre éditorial).
2. **Laboratoire** : la résistance est **cachée**. Régler le générateur, **mesurer** plusieurs couples (U, I) — ils s'ajoutent au tableau —, tracer U = f(I), déterminer R. La réponse est acceptée avec une **tolérance de mesure**.
3. Erreurs typiques à essayer : donner I en mA sans convertir → **erreur d'unité** ; calculer I/U au lieu de U/I → **idée fausse** identifiée.
4. **Approfondissement** : remplacer la résistance par une **lampe** → la caractéristique n'est plus une droite : **limites du modèle**. **Expert** : mesures **bruitées** → estimer R et son **incertitude** (passerelle vers la seconde), puissance P = U × I (passerelle 3e).
5. **Labo** (menu) → *Masse volumique* : peser, lire l'éprouvette, identifier un matériau ; *Chronophotographie* ; *Poids sur d'autres astres* (la masse affichée ne change pas, le poids si) ; *Changement d'état* (palier de fusion, masse constante).

## E. Données et vie privée (2 min)

1. **Parents → Exporter une sauvegarde** : un fichier JSON lisible, avec empreinte de contrôle.
2. **Restaurer** : choix profil par profil (restaurer, copie, ignorer) — jamais d'écrasement global.
3. **Code parent** (facultatif), **effacement** d'un profil ou de tout.
4. Mettre l'ordinateur hors ligne (ou installer l'application depuis la barre d'adresse de Chrome/Edge) : l'application et toutes les leçons restent utilisables.

## F. Tests automatiques (pour vérifier sans cliquer)

```bash
npm test
```

```bash
npm run test:e2e
```

- `npm test` : moteur d'expressions, correcteurs (chaque type d'erreur), élèves fictifs et changements d'exercice selon les erreurs ;
- `npm run test:e2e` : dans un vrai navigateur, ouvre chaque leçon et chaque parcours, résout une équation avec une erreur de signe, vérifie le tableau de bord, ouvre chaque laboratoire ;
- `npm run validate` : rejoue les réponses types de **chaque** exercice sur 7 tirages de paramètres.
