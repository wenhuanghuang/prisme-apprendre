# Guide de rédaction d'une leçon (version 0.3)

Ce guide complète [FORMAT-CONTENU.md](FORMAT-CONTENU.md) (format des exercices) et [FIGURES.md](FIGURES.md) (figures). Il s'adresse à toute personne (ou tout agent) qui rédige un chapitre.

## 1. Le public et le ton
- Élèves de **5e (12 ans) et 4e (13 ans)**. Phrases courtes, vocabulaire expliqué, exemples concrets tirés de la vie d'un collégien.
- Depuis la version 0.3, une leçon se joue **écran par écran** : une section = une étape, les exercices arrivent **un par un**, le cours se lit **carte par carte**. Il faut donc des blocs courts et vivants, jamais un long texte.
- On tutoie l'élève. On donne envie : énigme, défi, situation surprenante, « Et toi, qu'en penses-tu ? ».
- Exactitude d'abord : programmes officiels 2026-2027 (voir le parcours `app/content/courses/<matière>-<niveau>.json` : titre du chapitre et attendus `official`). Les chiffres réels sont datés et sourcés (Insee, ONU, etc.).

## 2. Droits d'auteur
- Aucun long extrait d'œuvre : **au plus 4 vers ou 40 mots** d'un texte du **domaine public** (auteur mort depuis plus de 70 ans), en citant l'auteur et l'œuvre.
- Les textes d'exercices (récits, dialogues, articles, documents) sont **écrits par toi**, de façon originale.
- Aucune URL inventée : ne crée pas de section `ressource` (les liens vérifiés sont ajoutés automatiquement par l'outil de construction).

## 3. Fichiers à créer (et seulement ceux-là)
1. Une leçon par chapitre : `app/content/lessons/<id>.json`, avec le champ **`"chapter": "<id du chapitre>"`** (identifiant exact du chapitre dans le parcours). C'est ce champ qui rattache la leçon au parcours : **ne modifie jamais** `courses/*.json`, `tools/*.js`, ni les leçons et compétences existantes.
2. Tes nouvelles compétences dans **ton propre fichier** `app/content/skills/<ton-lot>.json` :
   ```json
   { "subject": "maths", "note": "Compétences du lot …", "skills": [
     { "id": "m5.symetrie.axiale", "label": "Construire le symétrique d'une figure par rapport à une droite",
       "level": "5e", "track": "classe", "status": "programme", "domain": "espace-geometrie", "prereqs": ["…"] } ] }
   ```
   Avant de créer une compétence, cherche si elle existe déjà (`app/content/skills/*.json`) : réutilise-la, ou cite-la en prérequis. Identifiants uniques, préfixés comme les existants (`m5.`, `m4.`, `f5.`, `f4.`, `hg5.`, `hg4.`, `svt5.`, `svt4.`, `pc.`…). Reprends les valeurs de `domain` déjà utilisées dans la matière. `editorialLevel: true` si le programme est défini par cycle (SVT, physique-chimie).
3. Identifiants d'exercice : `<id de la leçon>-<mot-clé>` (uniques dans toute l'application).

## 4. Structure d'une leçon (sections dans cet ordre)
| # | `kind` | contenu attendu |
|---|---|---|
| 1 | `decouverte` | Une énigme ou une situation qui intrigue, **≤ 80 mots**, terminée par une question. Une figure si elle aide. |
| 2 | `cours` | **3 à 6 cartes** (`cards`) au lieu d'un long `body` (voir § 5). |
| 3 | `exemple` | Un exemple entièrement résolu en `steps: [{text, math?, figure?}]` (3 à 6 étapes). |
| 4 | `exercices` | « Je m'entraîne » : 4 à 6 exercices, du plus guidé au plus autonome. |
| 5 | `libre` ou `reinvestissement` | 1 ou 2 exercices : expliquer, rédiger, résoudre un problème. |
| 6 | `mission` | 1 exercice `composite` dans une situation de la vie réelle (2 à 4 questions). |
| 7 | `correction` | « À retenir » (bloc `> `) + 2 à 4 erreurs fréquentes expliquées, **≤ 150 mots**. |
| 8 | `revision` | Une phrase : la révision est programmée automatiquement. |

Parcours facultatifs : `tracks.approfondissement` (2 exercices, `track: "approfondissement"`) et `tracks.expert` (2 exercices, `track: "expert"`), chacun avec une `intro` d'une phrase.

Volume par leçon : **10 à 12 exercices de classe + 2 approfondissement + 2 expert**. Un QCM au plus (vérification rapide). `duration` réaliste (40 à 60 min).

## 5. Cartes de cours
```json
{ "kind": "cours", "title": "Le cours en 5 cartes", "cards": [
  { "emoji": "🪞", "title": "Le symétrique d'un point", "body": "Texte court (25 à 70 mots), Markdown léger, formules entre $…$.",
    "example": "Facultatif : un exemple d'une ligne.",
    "reveal": { "question": "Devine : où est le symétrique d'un point situé SUR l'axe ?", "answer": "Il est confondu avec lui-même : il ne bouge pas." },
    "figure": { … facultatif, voir FIGURES.md … } } ] }
```
- Une idée par carte. Le titre dit l'idée. Un emoji parlant.
- `reveal` (« carte devinette », 1 ou 2 par leçon) : l'élève réfléchit puis retourne la carte. Pas noté.
- La dernière carte peut récapituler (« En résumé »).

## 6. Exercices : exigences de qualité
- **Varier les types** (au moins 5 types différents par leçon) : `numeric`, `expression`, `steps`, `text`, `order`, `match`, `categorize`, `highlight`, `table`, `numberline`, `graph`, `composite`, `open`, `counterexample`, `dictation`… Les types visuels et de manipulation sont les plus ludiques.
- Chaque exercice a : `skill`, `track`, `role`, `difficulty`, `representation`, `prompt`, **2 ou 3 `hints` progressifs**, une `solution` détaillée, et des **idées fausses** (`misconceptions`) avec un `feedback` qui explique l'erreur sans humilier.
- **`selfTest` obligatoire** : au moins une réponse juste (`"expect": "correct"`) et une erreur typique (`"expect": "<id de l'idée fausse ou type d'erreur>"`). Pour `open`, `expect: "a-valider"`.
- Paramètres aléatoires (`params`) dès que c'est possible en maths et en physique : l'exercice peut alors revenir avec d'autres nombres.
- Limites des types : `steps` ne corrige que des calculs, expressions et équations (pas des phrases) ; les cases d'un `table` sont corrigées comme des nombres. Pour transformer une phrase pas à pas, enchaîner des questions courtes dans un `composite` ; pour une réponse-phrase dont plusieurs formulations sont justes, `text` avec `openEnded: true`.
- Figures : en **géométrie**, presque chaque exercice a une figure ; en **statistiques** et en **histoire-géographie**, utilise `bars`, `linechart`, `pie`, `timeline`, `table`. `alt` ne doit pas donner la réponse.

## 7. Vérifier
```
node tools/validate-content.js --only=<id-leçon-1>,<id-leçon-2>
```
Corrige jusqu'à **0 problème**. Cette commande ne modifie rien. **Ne lance pas** `npm run build`, `npm test` ni git (d'autres rédacteurs travaillent en même temps).
