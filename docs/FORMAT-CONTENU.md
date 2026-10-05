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

### Sections (format d'une vraie leçon, toutes facultatives)
| `kind` | rôle |
|---|---|
| `decouverte` | situation de départ, énigme, question qui donne envie |
| `ressource` | liens externes (`links: [{label, url, provider: "lumni"|"eduscol"|"bo"|"autre"}]`) — **jamais** de vidéo téléchargée ou republiée |
| `cours` | cours court adapté à l'âge (texte) |
| `manipulation` | activité interactive `activity: {widget, config}` |
| `exemple` | exemple entièrement résolu `steps: [{text, math}]` |
| `exercices` | exercices guidés `exercises: [ids]` |
| `libre` | réponses libres / rédigées |
| `reinvestissement` | problème qui réutilise la notion |
| `mission` | projet / mission (souvent `composite`) |
| `correction` | ce qu'il faut retenir, erreurs fréquentes expliquées |
| `revision` | rappel : la révision est programmée automatiquement par le moteur |

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

### Idées fausses (`misconceptions`)
```json
{ "answer": "a + b", "id": "mc:moins-moins", "error": "notion",
  "prerequisite": "m5.relatifs.reperage", "feedback": "Soustraire un nombre négatif revient à ajouter son opposé." }
```
`error` est un type de la typologie (`notion`, `calcul`, `signe`, `lecture`, `methode`, `forme`, `unite`, `precision`, `raisonnement`). Si `prerequisite` est renseigné, le moteur propose ce prérequis quand l'erreur se répète.
