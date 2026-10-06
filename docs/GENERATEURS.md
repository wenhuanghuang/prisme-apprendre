# Générateurs d'exercices

L'**Espace exercices** produit des exercices à la demande, en nombre illimité, de deux façons :

1. **Séries** tirées des leçons : les exercices paramétrés changent de valeurs à chaque tirage.
2. **Générateurs** : des fichiers de données (`app/content/generators/<id>.json`) ou des modules de calcul
   (`app/js/generators/*.js`) fabriquent de nouveaux exercices, corrigés et diagnostiqués comme les autres.
   Chaque réponse alimente le modèle de l'élève (compétence `skill`).

## Fichier de générateur (sans code)

```json
{
  "id": "fr-conjugaison",
  "label": "Conjugaison : présent, imparfait, passé simple, futur",
  "description": "Une forme à écrire ; les confusions de temps et de personne sont diagnostiquées.",
  "subject": "francais", "levels": ["5e", "4e"], "skill": "fr.conjugaison.temps-simples",
  "kind": "conjugaison",
  "options": [ { "id": "tense", "label": "Temps", "values": [ { "id": "tous", "label": "Tous" }, { "id": "present", "label": "Présent" } ] } ],
  "data": { … selon le genre … }
}
```

| `kind` | `data` | exercice produit |
|---|---|---|
| `conjugaison` | `pronouns` (6), `tenses: {id: libellé}`, `verbs: { infinitif: { forms: { tempsId: [6 formes] } } }`, `hints: {tempsId: indice}`, `lang` (ex. `es-ES`, facultatif) — une forme peut avoir des variantes `"paie|paye"` | réponse courte ; confusion de temps → `mc:temps-confondu`, de personne → `mc:accord-sujet-verbe` |
| `vocab` | `pairs: [{ q, a, theme?, hint? }]` (q dans la langue de départ, a = réponses acceptées), `lang`, `fromLabel`, `toLabel` ; options `theme`, `direction` (`normal`, `inverse`, `mixte`) | réponse courte + écoute |
| `chronologie` | `events: [{ label, year, hint? }]` (≥ 5) ; option `mode` (`frise`, `date`) | frise à ranger ou année à donner |
| `categorize` | `prompt`, `categories: [{id,label}]`, `items: [{label, category, feedback?}]`, `count` | classement |
| `match` | `prompt`, `pairs: [{left, right}]`, `count`, `leftTitle`, `rightTitle` | association |
| `cloze` | `prompt`, `items: [{ sentence: "… ___ …", accept: [..], misconceptions: [{answer, id, error, feedback}], hint, rule }]`, `lang` | texte à trous |

`npm run validate` produit 25 exercices par option de chaque générateur et vérifie que la réponse attendue est acceptée et qu'aucune idée fausse ne coïncide avec une bonne réponse.

## Générateurs de calcul (maths, physique-chimie)

`app/js/generators/maths-pc.js` contient des modules qui tirent des nombres et calculent, avec ces
mêmes nombres, la bonne réponse **et les réponses fausses typiques**. Le diagnostic est donc aussi précis
que dans les leçons : « 6 + (−16) » proposé pour « 6 − (−16) » est reconnu comme l'oubli de l'opposé.

| id | compétence | options | erreurs diagnostiquées |
|---|---|---|---|
| `m-relatifs-somme` | m5.relatifs.addition | opération, entiers/décimaux | opposé oublié, distances ajoutées, signe |
| `m-relatifs-produit` | m4.relatifs.produit | opération | règle des signes |
| `m-priorites` | m5.calcul.priorites | résultat / **toutes les étapes** | calcul de gauche à droite, parenthèses ignorées |
| `m-fractions-somme` | m5.fractions.addition | dénominateurs multiples / quelconques | dénominateurs additionnés, numérateur non converti ; forme irréductible exigée |
| `m-fractions-produit` | m4.fractions.produit | produit / quotient | produit en croix, division sans inverse |
| `m-puissances` | m4.puissances | valeur, règles des puissances de 10, notation scientifique | aⁿ = a × n, exposants multipliés, zéros comptés |
| `m-equations` | m4.equations.resoudre | ax + b = c / x dans les deux membres ; **toutes les étapes** | transposition sans changer le signe, soustraction au lieu de division |
| `m-proportionnalite` | m5.proportionnalite | prix, recette, consommation | modèle additif, passage à l'unité oublié |
| `m-pourcentages` | m5.pourcentages | part, réduction, augmentation | division par p, « p % = p € », réduction seule |
| `m-pythagore` | m4.pythagore.calcul | hypoténuse, côté, arrondi | somme des longueurs, racine oubliée, somme au lieu de différence |
| `m-litteral-valeur` | m5.litteral.expression | — | carré d'un négatif, (ax)², juxtaposition |
| `m-developper` | m5.litteral.distributivite / m4.litteral.double-distributivite | k(ax + b), (ax + b)(cx + d) | distributivité partielle, termes croisés oubliés |
| `m-conversions` | m5.grandeurs.conversions | longueurs, masses, contenances, volumes, durées | sens de conversion, « 2,5 h = 2 h 50 », base 100 au lieu de 60 ; l'unité de départ recopiée est refusée |
| `pc-vitesse` | pc.mouvement.vitesse | vitesse, distance, durée | formule inversée, produit au lieu du quotient |
| `pc-masse-volumique` | pc.matiere.masse-volumique | ρ, m, V | formule inversée |
| `pc-ohm` | pc.electricite.ohm | U, I, R (intensités en mA) | conversion mA oubliée (repérée automatiquement), formule inversée |
| `pc-poids` | pc.interactions.poids | poids, masse (Terre, Lune, Mars) | confusion masse/poids, division par g |

Un générateur de calcul est un objet `{ id, label, description, subject, levels, skill, options, make(rand, options) }` ;
`make` renvoie un exercice ordinaire (`numeric`, `expression` ou `steps`) et sa réponse type `generatedAnswer`.
Le test `tests/unit/generateurs-calcul.test.js` produit 40 exercices par option de chaque générateur et vérifie :
réponse type acceptée, chaque idée fausse diagnostiquée par son identifiant, aucune valeur manquante,
énoncés variés et tirages reproductibles.

## Espace exercices (`#/exercices`)

- **Séries sur mesure** : classe, matière, chapitres et notions (regroupés selon le parcours officiel),
  parcours (classe, approfondissement, expert), nombre d'exercices, sans QCM, « adaptée à mes besoins »
  (notions peu maîtrisées, révisions dues et erreurs récentes en priorité). La série mêle exercices des
  leçons (sans doublon) et exercices générés, du plus guidé au plus exigeant ; bilan final avec les types
  d'erreurs et la maîtrise mise à jour ; « reprendre les exercices manqués ».
  Si le parcours choisi n'a pas assez d'exercices pour les notions cochées (par exemple « Expert » seul),
  les exercices à valeurs variables reviennent avec d'autres nombres (3 fois au plus), puis la case
  « Compléter avec des exercices générés » (cochée par défaut) ajoute des exercices générés **sur les mêmes
  notions**, du niveau de la classe. La composition de la série est annoncée avant de commencer
  (« 4 exercices experts tirés des leçons + 6 générés du niveau de la classe pour compléter »).
- **Générateurs illimités** : chaque exercice est nouveau ; compteur de réussites, série sans faute, record.
- **Fiche imprimable** : énoncés avec une zone de réponse adaptée au papier (cases à cocher, tableau,
  lettres à associer, lignes), puis le **corrigé** sur une nouvelle page. Aucun nom d'élève n'est imprimé.
  Les exercices qui exigent l'ordinateur (programmes, manipulations) sont retirés de la fiche et signalés.
