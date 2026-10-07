# Figures (géométrie, repères, diagrammes, frises, tableaux)

Une **figure** se décrit en JSON, sans dessin ni image : l'application la trace en SVG (net à toutes les tailles, lisible en mode sombre, lisible par les lecteurs d'écran grâce à `alt`).

Elle peut être placée :
- dans une **section** de leçon : `"figure": { … }` (affichée sous le texte) ;
- dans une **carte de cours** : `cards[i].figure` ;
- dans une **étape d'exemple résolu** : `steps[i].figure` ;
- dans un **exercice** : `"figure": { … }` (affichée sous l'énoncé). Dans un exercice, les valeurs peuvent utiliser les paramètres : `"x": "{a}"`, `"label": "{b} cm"`.

`npm run validate` vérifie chaque figure (types connus, points existants, nombres valides).

## 1. Cadre

```json
"figure": {
  "alt": "Triangle ABC rectangle en B, AB = 4 cm, BC = 3 cm",
  "w": 400, "h": 260,
  "frame": { "x": [0, 8], "y": [0, 5], "grid": false, "axes": false },
  "caption": "Légende facultative sous la figure",
  "items": [ … ]
}
```
- `alt` (**obligatoire**) : description en une phrase, pour la lecture vocale et l'accessibilité. Elle ne doit pas donner la réponse de l'exercice.
- `w`, `h` : taille d'affichage (défaut 400 × 260). Conseillé : entre 200 et 800 de large (le validateur accepte de 80 à 1 200).
- `frame` (recommandé pour la géométrie et les repères) : les coordonnées des éléments sont alors **mathématiques** (axe des ordonnées vers le haut), avec **la même échelle sur les deux axes** (un cercle reste rond, un angle droit reste droit). `grid` : `true` (pas de 1) ou un nombre (pas de la grille) ; `axes: true` trace les axes gradués (repère du plan).
- Sans `frame` : coordonnées en pixels dans le rectangle `w × h`, origine en haut à gauche, axe vertical vers le bas.

## 2. Éléments géométriques (`items`)

Un point se désigne par son `id` (ex. `"A"`) ou directement par des coordonnées `[x, y]`.
Options communes : `color` (`bleu`, `rouge`, `vert`, `orange`, `violet`, `gris`, `noir`, ou la couleur d'une matière `maths`, `pc`, `svt`, `hg`, `francais`), `dashed: true`, `label`.

| `type` | champs | rendu |
|---|---|---|
| `point` | `id`, `x`, `y`, `label` (défaut : l'id), `pos` (`n`, `s`, `e`, `w`, `ne`, `nw`, `se`, `sw` ; défaut `ne`), `style` (`croix` défaut, `rond`), `hidden: true` (point d'appui invisible) | point marqué d'une croix et nommé |
| `segment` | `from`, `to`, `label` (ex. `"5 cm"`), `marks` (1, 2 ou 3 : codage des longueurs égales), `arrows` (`end`, `both`) | segment |
| `line` | `through: [P, Q]`, `label` (ex. `"(d)"`) | droite (prolongée jusqu'au bord) |
| `ray` | `from`, `through`, `label` | demi-droite |
| `polygon` | `points: [P, Q, R, …]`, `fill` (couleur, teinte claire), `label` (écrit au centre) | polygone |
| `circle` | `center`, `r` (rayon, dans l'unité du cadre) ou `through` (point du cercle), `fill`, `dashed` | cercle |
| `arc` | `center`, `r`, `start`, `end` (angles en degrés, sens direct) | arc de cercle (traits de construction) |
| `angle` | `vertex`, `from`, `to`, `label` (ex. `"40°"`), `right: true` (petit carré), `marks` (1, 2, 3 : angles égaux) | marque d'angle |
| `arrow` | `from`, `to`, `label` | flèche (vecteur de translation, déplacement) |
| `text` | `x`, `y`, `text`, `size` (`s`, `m`, `l`), `anchor` (`start`, `middle`, `end`), `bold` | texte libre |
| `rect` | `x`, `y`, `w`, `h`, `fill`, `label` | rectangle (avec `frame` : `x, y` = coin inférieur gauche ; sans `frame` : coin supérieur gauche) |

## 3. Diagrammes, frises et tableaux

Un diagramme **occupe toute la figure** : un seul par figure, sans `frame`.

| `type` | champs |
|---|---|
| `bars` | `data: [{label, value, color?}]`, `unit` (ex. `"millions"`), `yMax`, `horizontal: true` (barres couchées), `values: false` (masquer les valeurs) |
| `linechart` | `series: [{label, points: [[x, y], …], color?}]`, `xLabel`, `yLabel`, `xRange`, `yRange` (facultatifs) |
| `pie` | `data: [{label, value, color?}]`, `percent: true` (afficher les pourcentages) |
| `timeline` | `from`, `to` (années, négatives avant J.-C.), `step` (graduation, ex. `100`), `events: [{year, label}]`, `periods: [{from, to, label, color?}]` |
| `table` | `head: ["…", "…"]`, `rows: [["…", "…"], …]` (texte court ; `?` pour une case à deviner) |

## 4. Exemples

Triangle rectangle codé :
```json
{ "alt": "Triangle ABC rectangle en B", "frame": { "x": [0, 6], "y": [0, 4] }, "items": [
  { "type": "point", "id": "A", "x": 1, "y": 3.5, "pos": "nw" },
  { "type": "point", "id": "B", "x": 1, "y": 0.5, "pos": "sw" },
  { "type": "point", "id": "C", "x": 5, "y": 0.5, "pos": "se" },
  { "type": "polygon", "points": ["A", "B", "C"], "fill": "maths" },
  { "type": "angle", "vertex": "B", "from": "A", "to": "C", "right": true },
  { "type": "segment", "from": "A", "to": "B", "label": "3 cm" },
  { "type": "segment", "from": "B", "to": "C", "label": "4 cm" } ] }
```

Symétrique d'un point dans un repère :
```json
{ "alt": "Repère avec le point A(2 ; 3) et l'axe des ordonnées", "frame": { "x": [-5, 5], "y": [-4, 4], "grid": true, "axes": true }, "items": [
  { "type": "point", "id": "A", "x": 2, "y": 3, "style": "rond" } ] }
```

Frise :
```json
{ "alt": "Frise du VIIe au XIIIe siècle", "w": 640, "h": 160, "items": [
  { "type": "timeline", "from": 600, "to": 1300, "step": 100,
    "periods": [{ "from": 632, "to": 750, "label": "Califes omeyyades" }],
    "events": [{ "year": 622, "label": "Hégire" }, { "year": 1258, "label": "Prise de Bagdad" }] } ] }
```
