# Le moteur d'adaptation, expliqué

Le moteur répond à trois questions, pour chaque élève et chaque compétence :
1. **Où en est-il ?** (maîtrise, rétention, type d'erreurs, autonomie)
2. **Que faut-il proposer maintenant, et pourquoi ?** (recommandations expliquées)
3. **Quel exercice précis, à quelle difficulté, sous quelle forme ?** (sélection)

Tout le code est dans `app/js/engine/` et `app/js/core/checkers/` : des fonctions pures, testées hors navigateur (`npm test`).

---

## 1. Le diagnostic d'une réponse (correcteurs)

Chaque type de réponse a son correcteur. Tous renvoient le même diagnostic :

```
{ verdict, score, errorType, misconception, prerequisite, stepsOk, stepsTotal, firstBadStep, feedback, needsHuman }
```

- `verdict` : `correct`, `partiel`, `incorrect`, **`incertain`** (le logiciel ne sait pas trancher : il le dit, ne compte pas faux et propose une validation par un adulte), **`a-valider`** (réponse rédigée : jamais notée automatiquement).
- `errorType` : la typologie demandée.

| Type | Comment il est détecté (exemples) |
|---|---|
| Notion non comprise | la réponse coïncide avec une **idée fausse déclarée** dans le contenu (ex. `a(x + b) → ax + b`, `5 − (−3) → 2`, « la somme 7 et la somme 2 sont aussi probables ») |
| Prérequis manquant | l'idée fausse est rattachée à une compétence antérieure (`prerequisite`) |
| Erreur de calcul | méthode juste, valeur légèrement fausse ; ou un seul coefficient faux dans un polynôme ; ou une étape non équivalente après des étapes justes |
| Erreur de signe | valeur opposée ; un seul coefficient de signe inversé ; dans une équation, **un terme changé de membre sans changer de signe** (détecté en comparant la ligne fausse à la ligne précédente avec un terme inversé) |
| Lecture de l'énoncé | la réponse correspond à une autre grandeur de l'énoncé (déclarée dans le contenu), coordonnées inversées, valeur hors des conditions |
| Méthode mal appliquée | les premières étapes sont justes, puis une étape casse l'équivalence ; ou dessin juste mais sans la boucle demandée |
| Réponse juste sans justification | résultat juste mais justification absente / trop courte, ou une seule ligne quand il faut montrer la démarche |
| Forme non respectée | expression égale au résultat mais pas développée, réduite, factorisée ou irréductible |
| Unité / conversion | dimension physique incompatible, unité absente, ou bonne valeur à une puissance de 10 près |
| Arrondi | valeur très proche, précision demandée non respectée |
| Raisonnement | un exemple donné à la place d'un contre-exemple, une équation inventée qui n'a pas la propriété demandée |

**La démarche, pas seulement la réponse** : en calcul et en équations, **chaque ligne** est vérifiée (même valeur, ou même ensemble de solutions) ; l'élève voit quelles étapes sont justes et où se situe la première erreur. Pour les expressions, l'égalité est testée sur de nombreuses valeurs, puis la **forme** est analysée sur l'arbre syntaxique.

**Honnêteté** : une rédaction n'est jamais déclarée fausse ; les verdicts « à valider » et « incertain » ne modifient pas la maîtrise estimée (ni en bien ni en mal) tant qu'un adulte n'a pas tranché ; les critères « repérés » le sont à titre indicatif ; une réponse courte inconnue d'un exercice ouvert passe en « incertain » ; une erreur interne du correcteur produit « incertain » + validation humaine, jamais « faux ».

## 2. Le modèle de l'élève (par compétence)

Fichier `engine/mastery.js`. Pour chaque compétence, l'état contient notamment :

| Information | Rôle |
|---|---|
| `pL` | probabilité estimée de maîtrise (traçage bayésien des connaissances, BKT) |
| crédit partiel | une réussite avec indices (−0,15 par indice), après plusieurs essais (−0,1 par essai) ou après avoir vu la solution compte moins |
| `successes`, `autonomousSuccesses`, `assistedSuccesses` | réussites, dont sans aide |
| `immediateSuccesses`, `delayedSuccesses` | réussite immédiate vs **réussite plusieurs jours plus tard** (≥ 2 jours sans pratique) |
| `stability`, `due` | répétition espacée : la stabilité (en jours) augmente fortement après une réussite différée (×2,5), modérément après une réussite un autre jour (×1,3), et baisse après un échec (×0,5) ; la révision est programmée à `dernière réussite + stabilité` |
| `errors`, `misconceptions`, `recentErrors` | compteurs par type et par idée fausse, journal des 30 dernières erreurs |
| `successesSinceError` | nombre de réussites depuis la dernière erreur de chaque type → détection des **difficultés anciennes qui réapparaissent** (erreur d'un type déjà vu, après au moins 3 réussites sans elle, sur une notion maîtrisée ou plus d'une semaine après) |
| `timeRatios` | temps passé / temps prévu (rapidité) |
| `justified`, `unjustified` | capacité à expliquer la méthode |
| `tracks`, `roles` | réussites par parcours (classe, approfondissement, expert) et par rôle (transfert, défi…) |

Niveaux affichés : *pas encore travaillée → découverte → fragile → en cours → maîtrisée (≥ 85 % et au moins 3 réussites) → consolidée (maîtrisée + réussite différée)*, et *acquise, à réviser* quand la révision est échue et la rétention estimée faible.

## 3. Les recommandations (et leurs raisons)

Fichier `engine/recommend.js`. Règles par priorité :

| Priorité | Situation détectée | Proposition | Raison affichée à l'élève (exemple) |
|---|---|---|---|
| 95 | difficulté ancienne qui réapparaît | rappel ciblé, difficulté ≤ 3 | « Une difficulté que tu avais surmontée revient… » |
| 86-90 | erreurs rattachées à un prérequis, ou notion fragile dont un prérequis est faible | **exercice plus simple sur le prérequis** (difficulté ≤ 2) | « Tes erreurs sur X viennent souvent de Y. On consolide ce point, puis on revient. » |
| 84-88 | même type d'erreur ≥ 2 fois récemment (non résolu) | explication ciblée + exercices sur cette difficulté ; **autre représentation** si la même a échoué | « 3 erreurs du même type… présentés autrement (schéma ou figure). » |
| 70-80 | révision échue | révision espacée | « Tu as réussi cette notion il y a 9 jours… » |
| 65 | réponses justes non justifiées | exercices avec justification | « Savoir justifier est une compétence à part entière. » |
| 58-61 | notion du programme non maîtrisée, prérequis en place | suite du parcours | « Prochaine notion du programme de ta classe. » |
| 55 | notion maîtrisée sans réinvestissement | **problème de transfert** | « Ce problème vérifie que tu sais l'utiliser dans une situation nouvelle. » |
| 48-57 | réussite rapide (temps ≤ 1,2 × prévu) et autonome (≥ 75 %) | **approfondissement, puis expert** après 2 réussites en approfondissement (facultatif) | « Un défi t'attend : facultatif, il ne change pas ta progression du programme. » |

Chaque recommandation porte deux textes : `reasonStudent` (tutoiement, motivant) et `reasonParent` (factuel : nombre d'erreurs, type, idée fausse, intervalle de révision, taux d'autonomie). Au plus 3 « nouvelles notions » sont proposées à la fois (une par matière, mathématiques et sciences d'abord), et le meilleur défi facultatif est toujours conservé pour les élèves très à l'aise.

## 4. Le choix de l'exercice

Fichier `engine/select.js`. Parmi les exercices qui correspondent à la recommandation :

- **difficulté visée** = 1 + 3,5 × maîtrise (1 à 5) ; −1 après deux échecs de suite ; −1 après une idée fausse précise ; +1 après trois réussites rapides et autonomes ; plafonnée pour les remédiations, relevée pour les parcours ◆ et ✦ ;
- **bonus** pour un exercice qui travaille l'idée fausse précise (+5) ou le type d'erreur (+3), et pour une **représentation différente** de celle qui a échoué (+2,5) ;
- **pénalité** pour un exercice déjà vu dans la séance (−8) ou récemment (−3).

L'élève voit « Pourquoi cet exercice ? » (ex. *« Difficulté 1/5 (visée : 2) ; deux erreurs de suite : on descend d'un cran ; travaille précisément l'idée fausse détectée ; autre représentation (manipulation) »*).

## 5. Séparation programme / facultatif

- Chaque compétence a un **statut** (`programme`, `approfondissement`, `hors-programme` + passerelle) et chaque exercice un **parcours** (`classe`, `approfondissement`, `expert`).
- Les réussites facultatives sont comptées à part (tableau de bord : « contenus facultatifs ») et n'abaissent jamais la progression du programme : un échec en expert n'est pas un échec du programme (il est enregistré, mais les recommandations de la classe reposent sur les exercices de la classe et la maîtrise globale).

## 6. Vérification

- `tests/scenarios/profils-fictifs.test.js` : 5 élèves fictifs rejoués dans le moteur réel + scénarios de sélection (deux erreurs → plus simple et autre représentation ; idée fausse → exercice ciblé ; trois réussites rapides → plus difficile ; très à l'aise → parcours expert ; 2 réussites ne suffisent pas pour « maîtrisée » ; réussite différée → consolidée).
- `docs/PROFILS-FICTIFS.md` : rapport généré (`node tools/demo-report.js`) montrant, pour chaque élève fictif, l'état, les recommandations, les raisons et l'exercice choisi.

## 7. Limites connues (honnêtes)

- Les paramètres du modèle (vitesse d'apprentissage, glissement, devinette, coefficients de stabilité) sont des **valeurs raisonnables par défaut**, pas encore calibrées sur de vraies données d'élèves.
- Le diagnostic « notion non comprise » dépend des idées fausses **déclarées par les auteurs** : une erreur non prévue reste « non identifiée » (et le logiciel le dit).
- Les rédactions ne sont pas analysées par une IA : seuls des repères indicatifs (mots-clés) et l'auto-évaluation sont utilisés, en attendant la validation humaine.
