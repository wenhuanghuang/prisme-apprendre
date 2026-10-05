# Élèves fictifs : ce que le moteur diagnostique et propose

Rapport généré par `node tools/demo-report.js` : l’historique de chaque élève est **rejoué dans le vrai moteur** (aucune valeur saisie à la main). Les mêmes profils sont chargeables dans l’application (« Charger les profils fictifs ») et sont vérifiés par les tests automatiques (`tests/scenarios/profils-fictifs.test.js`).

Date de référence : 05/10/2026.

## Comète (5e)

> À l'aise en calcul, mais la soustraction d'un nombre négatif lui a longtemps posé problème. Surmontée il y a trois semaines, la difficulté vient de réapparaître.

**État des compétences travaillées**

| Compétence | Niveau | Maîtrise estimée | Tentatives | Réussites autonomes | Réussites différées | Erreurs (types) |
|---|---|---|---|---|---|---|
| Repérer, comparer des nombres relatifs sur une droite graduée | Découverte | 93 % | 2 | 2 | 0 | — |
| Additionner et soustraire des nombres relatifs | Consolidée (réussie plusieurs jours après) | 100 % | 10 | 5 | 3 | Notion non comprise ×4 |
| Reconnaître des fractions égales et simplifier une fraction | Découverte | 78 % | 2 | 2 | 0 | — |
| Additionner et soustraire des fractions (dénominateurs quelconques) | Découverte | 75 % | 2 | 1 | 0 | — |

**Recommandations (par priorité) et raisons affichées**

1. **Rappel : Additionner et soustraire des nombres relatifs** (resurgence, priorité 95)
   - À l’élève : Une difficulté que tu avais surmontée revient (« notion non comprise »). Un rappel rapide suffit souvent à la faire disparaître.
   - Au parent : Difficulté ancienne réapparue sur « Additionner et soustraire des nombres relatifs » (notion non comprise) alors qu'elle était résolue depuis plusieurs réussites.
   - Exercice choisi : `m5-relatifs-soustraire` (steps, classe, difficulté 2, symbolique) — Difficulté 2/5 (visée : 3) ; travaille précisément l’idée fausse détectée
2. **Révision : Repérer, comparer des nombres relatifs sur une droite graduée** (revision, priorité 80)
   - À l’élève : Tu as réussi cette notion il y a 24 jour(s). La revoir maintenant, juste avant de l'oublier, la fixe durablement.
   - Au parent : Révision espacée programmée (intervalle actuel : 1 j). Une réussite maintenant comptera comme « réussite différée ».
   - Exercice choisi : `m5-relatifs-comparer` (numeric, classe, difficulté 2, concrete) — Difficulté 2/5 (visée : 4)
3. **Révision : Reconnaître des fractions égales et simplifier une fraction** (revision, priorité 80)
   - À l’élève : Tu as réussi cette notion il y a 11 jour(s). La revoir maintenant, juste avant de l'oublier, la fixe durablement.
   - Au parent : Révision espacée programmée (intervalle actuel : 1 j). Une réussite maintenant comptera comme « réussite différée ».
   - Exercice choisi : `m5-fractions-entre` (multi, classe, difficulté 3, symbolique) — Difficulté 3/5 (visée : 4)
4. **Révision : Additionner et soustraire des fractions (dénominateurs quelconques)** (revision, priorité 78)
   - À l’élève : Tu as réussi cette notion il y a 9 jour(s). La revoir maintenant, juste avant de l'oublier, la fixe durablement.
   - Au parent : Révision espacée programmée (intervalle actuel : 1 j). Une réussite maintenant comptera comme « réussite différée ».
   - Exercice choisi : `m5-fractions-quelconques` (steps, classe, difficulté 3, symbolique) — Difficulté 3/5 (visée : 4)
5. **Nouvelle notion : Effectuer un calcul en respectant les priorités opératoires** (suite, priorité 58)
   - À l’élève : Prochaine notion du programme de ta classe : ses prérequis sont en place.
   - Au parent : Notion du programme non commencée, prérequis acquis ou non requis.
   - Exercice choisi : `m5-litteral-valeur` (steps, classe, difficulté 2, symbolique) — Difficulté 2/5 (visée : 1)
6. **Approfondissement : Additionner et soustraire des nombres relatifs** (defi, priorité 53)
   - À l’élève : Tu réussis vite et sans aide (83 % de réussites autonomes). Un problème d’approfondissement t'attend : facultatif, il ne change pas ta progression du programme.
   - Au parent : Réussite autonome (83 %), temps médian 100 % du temps prévu. Proposition facultative hors progression officielle (parcours approfondissement).
   - Exercice choisi : `m5-relatifs-contre-exemple` (counterexample, approfondissement, difficulté 3, symbolique) — Difficulté 3/5 (visée : 4)

## Orbite (4e)

> Très à l'aise en mathématiques : réussit vite, du premier coup et sans indice. Le moteur lui ouvre les parcours d'approfondissement puis expert, sans toucher à sa progression du programme.

**État des compétences travaillées**

| Compétence | Niveau | Maîtrise estimée | Tentatives | Réussites autonomes | Réussites différées | Erreurs (types) |
|---|---|---|---|---|---|---|
| Résoudre une équation du premier degré | Consolidée (réussie plusieurs jours après) | 100 % | 8 | 8 | 1 | — |
| Calculer une longueur avec le théorème de Pythagore | Consolidée (réussie plusieurs jours après) | 100 % | 5 | 5 | 1 | — |
| Multiplier et diviser des nombres relatifs | Découverte | 78 % | 2 | 2 | 0 | — |

**Recommandations (par priorité) et raisons affichées**

1. **Révision : Multiplier et diviser des nombres relatifs** (revision, priorité 72)
   - À l’élève : Tu as réussi cette notion il y a 3 jour(s). La revoir maintenant, juste avant de l'oublier, la fixe durablement.
   - Au parent : Révision espacée programmée (intervalle actuel : 1 j). Une réussite maintenant comptera comme « réussite différée ».
   - Exercice choisi : `m4-relatifs-produit-temperature` (composite, classe, difficulté 3, concrete) — Difficulté 3/5 (visée : 4)
2. **Nouvelle notion : Démontrer qu'un triangle est rectangle ou ne l'est pas** (suite, priorité 58)
   - À l’élève : Prochaine notion du programme de ta classe : ses prérequis sont en place.
   - Au parent : Notion du programme non commencée, prérequis acquis ou non requis.
   - Exercice choisi : `m4-pythagore-reciproque` (composite, classe, difficulté 2, symbolique) — Difficulté 2/5 (visée : 1)
3. **Nouvelle notion : Mesurer et utiliser la masse volumique (ρ = m / V)** (suite, priorité 58)
   - À l’élève : Prochaine notion du programme de ta classe : ses prérequis sont en place.
   - Au parent : Notion du programme non commencée, prérequis acquis ou non requis.
   - Exercice choisi : `pc-masse-volumique-calcul` (numeric, classe, difficulté 2, symbolique) — Difficulté 2/5 (visée : 1)
4. **Nouvelle notion : Utiliser une variable et une condition** (suite, priorité 58)
   - À l’élève : Prochaine notion du programme de ta classe : ses prérequis sont en place.
   - Au parent : Notion du programme non commencée, prérequis acquis ou non requis.
   - Exercice choisi : `code-variables-valeur` (numeric, classe, difficulté 1, symbolique) — Difficulté 1/5 (visée : 1)
5. **Défi expert : Résoudre une équation du premier degré** (defi, priorité 57)
   - À l’élève : Tu réussis vite et sans aide (100 % de réussites autonomes). Un défi de niveau expert t'attend : facultatif, il ne change pas ta progression du programme.
   - Au parent : Réussite autonome (100 %), temps médian 45 % du temps prévu. Proposition facultative hors progression officielle (parcours expert).
   - Exercice choisi : `m4-eq-diviser-par-zero` (counterexample, expert, difficulté 4, symbolique) — Difficulté 4/5 (visée : 4)
6. **Approfondissement : Calculer une longueur avec le théorème de Pythagore** (defi, priorité 57)
   - À l’élève : Tu réussis vite et sans aide (100 % de réussites autonomes). Un problème d’approfondissement t'attend : facultatif, il ne change pas ta progression du programme.
   - Au parent : Réussite autonome (100 %), temps médian 50 % du temps prévu. Proposition facultative hors progression officielle (parcours approfondissement).
   - Exercice choisi : `m4-pythagore-quadrillage` (composite, approfondissement, difficulté 4, visuelle) — Difficulté 4/5 (visée : 4)

## Nova (3e)

> En 3e, Nova bloque sur la double distributivité. Ses erreurs montrent un oubli systématique : le deuxième terme de la parenthèse n'est pas multiplié. La difficulté vient en réalité de la distributivité simple (5e).

**État des compétences travaillées**

| Compétence | Niveau | Maîtrise estimée | Tentatives | Réussites autonomes | Réussites différées | Erreurs (types) |
|---|---|---|---|---|---|---|
| Développer avec la double distributivité et réduire | Fragile | 13 % | 4 | 0 | 0 | Notion non comprise ×3 |
| Résoudre une équation du premier degré | Découverte | 17 % | 2 | 1 | 0 | Notion non comprise ×1 |

**Recommandations (par priorité) et raisons affichées**

1. **D'abord : Utiliser la distributivité simple pour développer ou factoriser** (prerequis, priorité 90)
   - À l’élève : Tes erreurs sur « Développer avec la double distributivité et réduire » viennent souvent de « Utiliser la distributivité simple pour développer ou factoriser ». On consolide ce point avec un exercice plus simple, puis on revient.
   - Au parent : 3 erreur(s) récente(s) sur « Développer avec la double distributivité et réduire » correspondent à une idée fausse rattachée au prérequis « Utiliser la distributivité simple pour développer ou factoriser ».
   - Exercice choisi : `m5-litteral-remed-aire` (expression, classe, difficulté 1, visuelle) — Difficulté 1/5 (visée : 1)
2. **Point précis : Développer avec la double distributivité et réduire** (remediation, priorité 88)
   - À l’élève : 3 erreurs du même type (« notion non comprise ») sur cette notion. Voici une courte explication ciblée et des exercices sur ce point précis, présentés autrement (schéma ou figure).
   - Au parent : Erreur récurrente « notion non comprise » (3 fois en 3 semaines), idée fausse identifiée : mc:distrib-partielle. Changement de représentation proposé car la même approche a échoué.
   - Exercice choisi : `m4-double-distributivite-remed-etapes` (composite, classe, difficulté 1, symbolique) — Difficulté 1/5 (visée : 1) ; travaille précisément l’idée fausse détectée
3. **D'abord : Multiplier et diviser des nombres relatifs** (prerequis, priorité 86)
   - À l’élève : « Développer avec la double distributivité et réduire » s'appuie sur « Multiplier et diviser des nombres relatifs », qui n'est pas encore solide. On commence par là.
   - Au parent : Compétence fragile (« Développer avec la double distributivité et réduire ») dont le prérequis « Multiplier et diviser des nombres relatifs » est lui-même peu ou pas maîtrisé.
   - Exercice choisi : `m4-relatifs-produit-remed-suite` (table, classe, difficulté 1, symbolique) — Difficulté 1/5 (visée : 1)
4. **Nouvelle notion : Distinguer poids et masse ; utiliser P = m × g** (suite, priorité 58)
   - À l’élève : Prochaine notion du programme de ta classe : ses prérequis sont en place.
   - Au parent : Notion du programme non commencée, prérequis acquis ou non requis.
   - Exercice choisi : `pc-poids-masse-comparer` (composite, classe, difficulté 2, concrete) — Difficulté 2/5 (visée : 1)

## Quasar (5e)

> Trouve presque toujours le bon résultat… sans jamais expliquer comment. Le moteur distingue « réponse juste » et « réponse justifiée ».

**État des compétences travaillées**

| Compétence | Niveau | Maîtrise estimée | Tentatives | Réussites autonomes | Réussites différées | Erreurs (types) |
|---|---|---|---|---|---|---|
| Produire une expression littérale et calculer sa valeur | En cours d'acquisition | 82 % | 4 | 4 | 2 | — |
| Connaître, démontrer et utiliser la somme des angles d'un triangle | Découverte | 59 % | 2 | 2 | 0 | — |

**Recommandations (par priorité) et raisons affichées**

1. **Continuer : Connaître, démontrer et utiliser la somme des angles d'un triangle** (suite, priorité 61)
   - À l’élève : Tu as commencé cette notion : encore quelques exercices pour la maîtriser.
   - Au parent : Notion en cours (maîtrise estimée 59 %).
   - Exercice choisi : `m5-triangles-echelle` (composite, classe, difficulté 3, concrete) — Difficulté 3/5 (visée : 3)
2. **Nouvelle notion : Interpréter un changement d'état (palier, conservation de la masse)** (suite, priorité 58)
   - À l’élève : Prochaine notion du programme de ta classe : ses prérequis sont en place.
   - Au parent : Notion du programme non commencée, prérequis acquis ou non requis.
   - Exercice choisi : `pc-changements-etat-vocabulaire` (composite, classe, difficulté 2, verbale) — Difficulté 2/5 (visée : 1)
3. **Nouvelle notion : Écrire une suite d'instructions pour obtenir un résultat précis** (suite, priorité 58)
   - À l’élève : Prochaine notion du programme de ta classe : ses prérequis sont en place.
   - Au parent : Notion du programme non commencée, prérequis acquis ou non requis.
   - Exercice choisi : `code-tortue-boucles-rectangle` (code, classe, difficulté 1, manipulation) — Difficulté 1/5 (visée : 1)

## Pulsar (4e)

> A maîtrisé l'addition de fractions il y a un mois : la révision espacée arrive à échéance. Sur les équations, ses erreurs sont des erreurs de calcul, pas de méthode : la remédiation est ciblée en conséquence.

**État des compétences travaillées**

| Compétence | Niveau | Maîtrise estimée | Tentatives | Réussites autonomes | Réussites différées | Erreurs (types) |
|---|---|---|---|---|---|---|
| Additionner et soustraire des fractions (dénominateurs quelconques) | Acquise, à réviser | 100 % | 5 | 4 | 2 | — |
| Résoudre une équation du premier degré | Fragile | 13 % | 5 | 2 | 0 | Erreur de calcul ×2, Erreur de signe ×1 |

**Recommandations (par priorité) et raisons affichées**

1. **D'abord : Tester si une égalité est vraie pour une valeur de la lettre** (prerequis, priorité 86)
   - À l’élève : « Résoudre une équation du premier degré » s'appuie sur « Tester si une égalité est vraie pour une valeur de la lettre », qui n'est pas encore solide. On commence par là.
   - Au parent : Compétence fragile (« Résoudre une équation du premier degré ») dont le prérequis « Tester si une égalité est vraie pour une valeur de la lettre » est lui-même peu ou pas maîtrisé.
   - Exercice choisi : `m5-litteral-contre-exemple` (counterexample, classe, difficulté 2, symbolique) — Difficulté 2/5 (visée : 1)
2. **D'abord : Additionner et soustraire des nombres relatifs** (prerequis, priorité 86)
   - À l’élève : « Résoudre une équation du premier degré » s'appuie sur « Additionner et soustraire des nombres relatifs », qui n'est pas encore solide. On commence par là.
   - Au parent : Compétence fragile (« Résoudre une équation du premier degré ») dont le prérequis « Additionner et soustraire des nombres relatifs » est lui-même peu ou pas maîtrisé.
   - Exercice choisi : `m5-relatifs-remed-points` (numeric, classe, difficulté 1, concrete) — Difficulté 1/5 (visée : 1)
3. **D'abord : Multiplier et diviser des nombres relatifs** (prerequis, priorité 86)
   - À l’élève : « Résoudre une équation du premier degré » s'appuie sur « Multiplier et diviser des nombres relatifs », qui n'est pas encore solide. On commence par là.
   - Au parent : Compétence fragile (« Résoudre une équation du premier degré ») dont le prérequis « Multiplier et diviser des nombres relatifs » est lui-même peu ou pas maîtrisé.
   - Exercice choisi : `m4-relatifs-produit-remed-suite` (table, classe, difficulté 1, symbolique) — Difficulté 1/5 (visée : 1)
4. **Point précis : Résoudre une équation du premier degré** (remediation, priorité 84)
   - À l’élève : 2 erreurs du même type (« erreur de calcul ») sur cette notion. Voici une courte explication ciblée et des exercices sur ce point précis, présentés autrement (schéma ou figure).
   - Au parent : Erreur récurrente « erreur de calcul » (2 fois en 3 semaines). Changement de représentation proposé car la même approche a échoué.
   - Exercice choisi : `m4-eq-balance` (numeric, classe, difficulté 1, manipulation) — Difficulté 1/5 (visée : 1) ; autre représentation (manipulation)
5. **Révision : Additionner et soustraire des fractions (dénominateurs quelconques)** (revision, priorité 80)
   - À l’élève : Tu as réussi cette notion il y a 30 jour(s). La revoir maintenant, juste avant de l'oublier, la fixe durablement.
   - Au parent : Révision espacée programmée (intervalle actuel : 8 j). Une réussite maintenant comptera comme « réussite différée ».
   - Exercice choisi : `m5-fractions-jardin` (composite, classe, difficulté 3, concrete) — Difficulté 3/5 (visée : 4)
6. **Approfondissement : Additionner et soustraire des fractions (dénominateurs quelconques)** (defi, priorité 53)
   - À l’élève : Tu réussis vite et sans aide (80 % de réussites autonomes). Un problème d’approfondissement t'attend : facultatif, il ne change pas ta progression du programme.
   - Au parent : Réussite autonome (80 %), temps médian 100 % du temps prévu. Proposition facultative hors progression officielle (parcours approfondissement).
   - Exercice choisi : `m4-eq-fractions` (steps, approfondissement, difficulté 4, symbolique) — Difficulté 4/5 (visée : 4)

## Comment l’exercice suivant change selon les résultats

Simulation sur la compétence « Résoudre une équation du premier degré » (maîtrise estimée 55 %).

| Situation | Difficulté visée | Exercice choisi | Pourquoi |
|---|---|---|---|
| Début de séance | 3/5 | `m4-eq-g2` (symbolique, difficulté 3) | Difficulté 3/5 (visée : 3) |
| Après deux erreurs de signe en calcul écrit | 2/5 | `m4-eq-balance` (manipulation, difficulté 1) | Difficulté 1/5 (visée : 2) ; deux erreurs de suite : on descend d’un cran ; cible précisément le type d’erreur détecté ; autre représentation (manipulation) |
| Après une erreur « isoler x » (soustraire au lieu de diviser) | 2/5 | `m4-eq-balance` (manipulation, difficulté 1) | Difficulté 1/5 (visée : 2) ; idée fausse détectée : on reprend un cran plus bas, sur ce point précis ; travaille précisément l’idée fausse détectée |
| Après trois réussites rapides et autonomes | 4/5 | `m4-eq-forfaits` (concrete, difficulté 3) | Difficulté 3/5 (visée : 4) ; trois réussites rapides et sans aide : on monte d’un cran |
