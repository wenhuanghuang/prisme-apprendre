# Format des contenus (leçons, exercices, compétences)

Les contenus sont des fichiers JSON placés dans `app/content/`. **Ajouter un chapitre ne demande aucune modification du code** : on crée un fichier de leçon, on le déclare dans le parcours (`courses/*.json`), et le validateur (`npm run validate`) vérifie tout automatiquement.

```
app/content/
├── catalog.json            niveaux, matières, parcours (niveau × matière), statut de couverture
├── programmes.json         textes officiels applicables en 2026-2027 + liens BO / Éduscol
├── skills/*.json           graphe des compétences (prérequis, statut programme / approfondissement / hors programme)
├── courses/<parcours>.json chapitres d'un parcours, ordre éditorial, renvoi aux leçons
└── lessons/<id>.json       une leçon = sections pédagogiques + exercices + parcours facultatifs
```

## 0. Parcours (`courses/<matière>-<niveau>.json`)

```json
{ "id": "svt-5e", "level": "5e", "subject": "svt", "authored": true, "coverage": "partiel", "programmes": ["svt-c4-2020"],
  "progressionNote": "… (dire si le programme est défini par cycle : ordre éditorial)",
  "chapters": [ { "id": "svt5-…", "title": "…", "status": "programme", "state": "disponible", "lessons": ["svt5-…"], "skills": ["…"], "official": [{"id": "…", "label": "attendu officiel"}] },
                { "id": "svt5-…", "title": "…", "status": "programme", "state": "a-venir", "lessons": [], "skills": [], "official": [] } ] }
```
Identifiants de matière : `maths`, `francais`, `hg`, `emc`, `svt`, `pc`, `techno`, `lv` (langues vivantes : anglais, espagnol… dans le même parcours), `musique`, `arts-plastiques`, `numerique`. Les chapitres non rédigés restent listés avec `"state": "a-venir"` : le nombre de chapitres suit le programme réel.

## 1. Compétence (`skills/*.json`)

```json
{ "id": "m4.equations.resoudre", "label": "Résoudre une équation du premier degré",
  "level": "4e", "track": "classe", "status": "programme", "domain": "nombres-calculs",
  "prereqs": ["m5.litteral.tester"], "bridge": "3e", "editorialLevel": true }
```
- `track` : `classe` | `approfondissement` | `expert`.
- `status` : `programme` | `approfondissement` | `hors-programme`. `bridge` signale une passerelle vers un niveau supérieur.
- `editorialLevel: true` : le programme officiel est défini par cycle ; le niveau est une progression proposée.

## 2. Leçon (`lessons/<id>.json`)

```json
{
  "id": "m4-equations", "title": "…", "subject": "maths", "level": "4e",
  "skills": ["m4.equations.resoudre"], "status": "programme", "programmes": ["maths-c4"],
  "duration": 50, "summary": "…",
  "sections": [ … ],
  "tracks": { "approfondissement": { "intro": "…", "exercises": ["id", …] },
              "expert":            { "intro": "…", "exercises": ["id", …] } },
  "exercises": [ … définitions complètes … ]
}
```

### Rattachement au parcours
`"chapter": "<id du chapitre>"` : la leçon est ajoutée automatiquement à ce chapitre du parcours (`tools/link-chapters.js`, lancé par `npm run build`). Inutile de modifier `courses/*.json`.

### Sections (format d'une vraie leçon, toutes facultatives)
Depuis la version 0.3, l'élève joue la leçon **écran par écran** : une section = une étape du chemin, les exercices d'une section arrivent un par un, le cours se lit carte par carte, et `ressource` et `revision` sont regroupées sur l'écran final. Méthode de rédaction : [GUIDE-REDACTION.md](GUIDE-REDACTION.md).

| `kind` | rôle |
|---|---|
| `decouverte` | situation de départ, énigme, question qui donne envie |
| `ressource` | liens externes (`links: [{label, url, provider: "lumni"|"eduscol"|"bo"|"autre"}]`) — **jamais** de vidéo téléchargée ou republiée |
| `cours` | cours court en **cartes** : `cards: [{emoji, title, body, example?, reveal?: {question, answer}, figure?}]` (un ancien `body` long est découpé automatiquement) |
| `experience` | expérience **montrée** étape par étape, avec pauses et prédictions : `demo: {items, steps, conclusion}` — voir [EXPERIENCES.md](EXPERIENCES.md) |
| `manipulation` | activité interactive `activity: {widget, config}` (mathématiques, programmation ; en sciences, préférer `experience`) |
| `exemple` | exemple entièrement résolu `steps: [{text, math}]` |
| `exercices` | exercices guidés `exercises: [ids]` |
| `libre` | réponses libres / rédigées |
| `reinvestissement` | problème qui réutilise la notion |
| `mission` | projet / mission (souvent `composite`) |
| `correction` | ce qu'il faut retenir, erreurs fréquentes expliquées |
| `revision` | rappel : la révision est programmée automatiquement par le moteur |

Toute section, carte, étape d'exemple ou exercice peut porter une **figure** (géométrie, repère, diagramme, frise, tableau) décrite en JSON : voir [FIGURES.md](FIGURES.md).

Le texte (`body`) accepte un Markdown léger : paragraphes, `**gras**`, `*italique*`, listes `- `, citations `> ` (encadré « À retenir »), liens `[texte](https://…)` et formules entre `$…$` (ex. `$3x + 5 = 2x − 7$`).

## 3. Exercice

Champs communs :
```json
{ "id": "m4-eq-01", "type": "steps", "skill": "m4.equations.resoudre",
  "track": "classe", "role": "guide", "difficulty": 2, "representation": "symbolique",
  "targets": ["signe"], "expectedSeconds": 120,
  "params": { "a": {"int": [2, 9]}, "b": {"int": [-9, 9], "not": [0]} },
  "constraints": ["a != b"],
  "prompt": "Résous $ {a}x {b|s} = 0 $.",
  "hints": ["indice 1 (léger)", "indice 2", "indice 3 (presque la méthode)"],
  "solution": "correction détaillée",
  "methods": ["Démarche 1 …", "Démarche 2 …"],
  "criteria": ["Critère de réussite visible 1", "…"],
  "justify": { "required": true, "prompt": "Explique…", "minWords": 6, "keywords": ["…"] },
  "figure": { "alt": "…", "frame": { "x": [0, 8], "y": [0, 5] }, "items": [ … ] },
  "activity": { "widget": "ohm-lab", "config": { "R": "{R}" } },
  "selfTest": [ { "response": { … }, "expect": "correct" }, { "response": { … }, "expect": "signe" } ] }
```
- `role` : `guide` | `libre` | `reinvestissement` | `transfert` | `remediation` | `defi` | `mission` | `verification` | `labo` | `debug`.
- `difficulty` : 1 (très guidé) à 5 (défi).
- `representation` : `symbolique` | `visuelle` | `concrete` | `manipulation` | `verbale`.
- `targets` : types d'erreur ou idées fausses que l'exercice travaille (le moteur les choisit pour remédier).
- Paramètres : `{"int":[min,max]}`, `{"dec":[min,max],"step":0.5}`, `{"choice":[…]}`, `{"expr":"a*b"}` ; `not` exclut des valeurs ; `constraints` (expressions vraies/fausses).
- Dans les textes : `{a}`, `{a*b}`, `{b|p}` (parenthèses si négatif), `{b|s}` (terme signé « + 3 » / « − 3 »), `{a|c}` (coefficient : 1 → rien, −1 → « − »), `{v|d2}` (2 décimales).
- Fonctions dans les expressions : `pgcd(a;b)`, `ppcm`, `estpremier`, `estentier`, `racine`, `arrondi(x;n)`, `abs`, `mod(a;b)`, `cos/sin/tan` en degrés. Séparateur d'arguments : `;`.
- `selfTest` : réponses types avec le verdict ou le type d'erreur attendu. Les chaînes sont interpolées avec les paramètres (`"{a-b}"`). Le validateur les rejoue sur plusieurs tirages.

### Types et réponse attendue
| type | champs spécifiques | réponse |
|---|---|---|
| `numeric` | `answer` (expr), `tolerance` / `rel`, `round`, `unit`, `misconceptions` (la tolérance s'applique aussi aux idées fausses) ; « 85 % » est accepté pour 85 ou 0,85 | `{value}` |
| `expression` | `answer`, `form` (`any`, `developpee`, `developpee-reduite`, `factorisee`, `irreductible`, `nombre`), `misconceptions` | `{value}` |
| `steps` | `mode` (`calcul`/`expression`/`equation`), `start` (affiché), `startExpr` (facultatif), `final`, `minSteps`, `misconceptions` | `{lines: []}` |
| `open` | `criteria: [{id,label,keywords}]`, `models`, `minWords` | `{text, selfCheck}` |
| `text` | réponse courte : `accept: ["…"]`, `misconceptions` (chaînes), `caseSensitive`, `openEnded` (si d'autres réponses peuvent être justes → validation humaine) | `{value}` |
| `equation` | équation à inventer : `expectKind` (`unique`/`none`/`all`), `expectSolution`, `varBothSides` | `{value}` |
| `counterexample` | `claim`, `vars`, `domain`, `domainLabel`, `refutes`, `show`, `claimIsTrue` | `{values:{n:…}}` ou `{claimTrue:true}` |
| `multi` | `count`, `predicate` (variable `v`), `distinct`, `form` | `{values: []}` |
| `table` | `columns`, `rows` (texte ou clé de cellule `"?r0c1"`), `cells: {r0c1: {answer, …}}` | `{cells:{}}` |
| `order` | `items` dans le bon ordre, `orderLabel` | `{order: [ids]}` |
| `numberline` | `min`, `max`, `step`, `points: [{label, value}]` | `{positions:{}}` |
| `graph` | `xRange`, `yRange`, `expectedPoints` ou `predicate` + `count` | `{points: [[x,y]]}` |
| `qcm` | `choices: [{text, correct, feedback, error, misconception}]` — **vérification rapide seulement** | `{selected: [i]}` |
| `code` | `reference` (programme modèle), `start`, `codeConstraints` (`maxInstructions`, `mustUse`), `misconceptions: [{program, id, error, feedback}]` (dessin typique d'une idée fausse) | `{program}` |
| `composite` | `parts: [définitions sans id]` (partagent les paramètres) | `{parts: [réponses]}` |
| `highlight` | `text` avec les mots à repérer entre crochets : `"Le [petit] chat [noir] dort."` (un groupe de mots possible : `[sont venus]`), `instruction`, `misconceptions: [{word, id, error, feedback}]` (mot sélectionné à tort) | `{selected: [index des mots]}` |
| `match` | `left: [{id,label}]`, `right: [{id,label}]`, `pairs: {idGauche: idDroite}`, `leftTitle`, `rightTitle`, `misconceptions: [{pair: [g, d], id, error, feedback}]` | `{pairs: {}}` |
| `categorize` | `categories: [{id,label}]`, `items: [{id,label,category}]`, `misconceptions: [{item, category, id, error, feedback}]` | `{assign: {item: categorie}}` |
| `dictation` | `answer` (phrase attendue, ou liste de variantes), `audio: {text, lang}` obligatoire, `misconceptions: [{word, id, error, feedback}]` (mot mal écrit typique). Correction mot à mot ; la ponctuation n'est pas notée | `{value}` |

### Écoute (synthèse vocale locale)
Tout exercice peut porter `"audio": { "text": "The cat is sleeping.", "lang": "en-GB" }` : un bouton « ▶ Écouter » (et « lentement ») lit le texte avec les voix installées sur l'ordinateur (aucun envoi de données). Langues : `fr-FR`, `en-GB`, `en-US`, `es-ES`, `de-DE`, `it-IT`. `"after": true` ne propose l'écoute qu'après la réponse (pour vérifier la prononciation sans donner la réponse). Chaque énoncé dispose en plus d'un bouton « Lire l'énoncé » en français.

### Réponse courte en langue étrangère
Pour `text`, `accept` liste toutes les réponses acceptables (synonymes, avec ou sans article : `["house", "a house", "the house"]`). Les majuscules sont ignorées sauf `caseSensitive: true` ; une faute d'accent seule est signalée sans être comptée fausse.

### Idées fausses (`misconceptions`)
```json
{ "answer": "a + b", "id": "mc:moins-moins", "error": "notion",
  "prerequisite": "m5.relatifs.reperage", "feedback": "Soustraire un nombre négatif revient à ajouter son opposé." }
```
`error` est un type de la typologie (`notion`, `calcul`, `signe`, `lecture`, `methode`, `forme`, `orthographe`, `unite`, `precision`, `raisonnement`). Dans une dictée, un mot reconnu mais mal écrit (accent, une ou deux lettres) est classé `orthographe` automatiquement. Si `prerequisite` est renseigné, le moteur propose ce prérequis quand l'erreur se répète.
