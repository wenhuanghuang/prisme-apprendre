# Expériences animées (section `experience`)

L'élève **ne fait pas** l'expérience : on la lui **montre**, étape par étape. Chaque étape anime la scène et l'explique. L'élève peut mettre en pause (bouton ⏸, barre d'espace, ou clic sur la scène), revenir à l'étape précédente, revoir une étape, changer la vitesse, faire lire les explications à voix haute (voix installées sur l'ordinateur) ou enchaîner automatiquement. Des étapes « Que va-t-il se passer ? » l'arrêtent pour qu'il fasse une prédiction avant de voir le résultat.

```json
{ "kind": "experience", "title": "L'expérience : chauffer de la glace", "body": "Phrase d'introduction (facultative).",
  "demo": {
    "w": 800, "h": 440,
    "items": [ … objets de la scène … ],
    "steps": [ … étapes … ],
    "conclusion": "Ce que l'on a observé (Markdown léger), affiché à la fin."
  } }
```

`npm run validate` vérifie chaque expérience (types d'objets, identifiants, actions, questions).

## 1. Les étapes

```json
{ "title": "On chauffe", "text": "Explication de l'étape, 20 à 60 mots, au présent, adressée à l'élève.",
  "duration": 6,
  "do": [ { "id": "plaque", "set": { "on": true } },
          { "id": "thermo", "to": { "value": 0 }, "at": 0, "dur": 4 },
          { "id": "courbe", "to": { "progress": 0.2 } } ],
  "show": ["zoom"], "hide": ["fleche1"], "focus": ["thermo"],
  "ask": { "question": "Que va faire la température pendant que la glace fond ?",
           "choices": ["Elle continue de monter", "Elle reste à 0 °C", "Elle redescend"], "answer": 1,
           "explain": "Tant qu'il reste de la glace, l'énergie reçue sert à faire fondre la glace : la température reste à 0 °C." } }
```
- `title` et `text` : obligatoires (`text` peut manquer sur une étape qui ne fait que poser une question).
- `do` : actions sur les objets. `set` change des propriétés **au début** de l'action ; `to` les fait **varier progressivement** (nombres, couleurs `#rrggbb`, listes de nombres) de la valeur actuelle vers la valeur indiquée. `at` = début de l'action (secondes depuis le début de l'étape, défaut 0) ; `dur` = durée (défaut : jusqu'à la fin de l'étape). Les propriétés non numériques (texte, vrai/faux) changent d'un coup.
- `duration` : durée de l'étape en secondes (défaut 3 s s'il y a des `to`, sinon 0 : l'étape ne fait qu'expliquer). Prévoir **3 à 8 s** par étape animée.
- `show` / `hide` : fait apparaître ou disparaître des objets (un objet peut commencer caché avec `"hidden": true`).
- `focus` : entoure un ou plusieurs objets d'un halo, pour guider le regard.
- `ask` (facultatif) : question de prédiction. Le lecteur attend la réponse, affiche si elle est juste, puis `explain`. Placer la question **avant** l'étape qui montre le résultat. 1 ou 2 questions par expérience.
- L'état de la scène se calcule à partir du début : revenir en arrière ou rejouer une étape est toujours exact.

Une bonne expérience : **5 à 9 étapes** — le matériel (montrer ce qu'on utilise), le protocole, une prédiction, l'observation (animation), la mesure (thermomètre, balance, tableau qui se remplit, courbe qui se trace), l'interprétation (loupe sur les particules, étiquettes), la conclusion.

Une expérience sans objets (`"items": []`) reste possible : elle se joue en **récit illustré** (un grand emoji par étape : `"emoji": "🧪"` sur l'étape ou sur `demo`). À utiliser seulement en attendant l'animation.

## 2. La scène

Repère de **800 × 440** (modifiable avec `w`, `h`), origine en haut à gauche, axe vertical vers le bas. La paillasse se met en général à `y = 380`.

**Convention de placement** : la verrerie, le matériel posé et les objets sont placés par **le milieu de leur base** (`x`, `y` = point posé sur la table). Les panneaux (`courbe`, `releve`) par leur **coin supérieur gauche**. Les composants électriques et la loupe par leur **centre**.

Propriétés communes : `id` (obligatoire si une étape agit dessus), `hidden`, `opacity` (0 à 1). La plupart des objets acceptent aussi `label` (petite étiquette au-dessus ou au-dessous) ; pas `fil`, `rayon`, `courbe` (utiliser `title`), `releve` (`title`), `forme`, `trepied`. Pour nommer un objet qui n'a pas d'étiquette, ajouter un `etiquette` ou un `texte`.

Limites vérifiées par `npm run validate` : `grains`, `ice`, `colonies`, `leaves`, `n` entre 0 et 200 ; `decimals` entre 0 et 6 ; pas de graduation (`step`) positif. Un chemin `forme` / `path` n'accepte que des commandes SVG et des nombres décimaux simples (pas d'écriture `1e-3`).

Couleurs de contenu : `eau`, `bleu`, `rouge`, `vert`, `orange`, `violet`, `jaune`, `gris`, `noir`, `blanc`, `marron`, `rose`, `huile`, `glace`, `cuivre`, `fer`, `bois`, `sable`, ou `#rrggbb` (**obligatoire pour une couleur qui varie** avec `to`, ex. l'eau iodée qui passe de `#7c3f00` à `#1e1b4b`).

### Verrerie et contenus
| `type` | propriétés (défauts) |
|---|---|
| `paillasse` | `y` (380) — la table |
| `becher` | `x`, `y`, `w` (120), `h` (150), `level` (0 à 1), `liquid` (couleur), `ice` (nombre de glaçons), `solid` (0 à 1 : taille des glaçons, 0 = fondus), `bubbles` (0 à 1 : ébullition, dégagement gazeux), `steam` (0 à 1 : vapeur au-dessus), `grains` (nombre de grains au fond), `dissolve` (0 à 1 : les grains disparaissent), `grainColor`, `cloudy` (0 à 1 : trouble), `precipitate` (0 à 1 : dépôt), `precipitateColor`, `top: {level, color}` (couche au-dessus, ex. huile), `spoon` (cuillère), `grad` (graduations) |
| `tube` | idem bécher (sauf `grad`), `w` (34), `h` (150), `stopper` (bouchon) |
| `erlenmeyer` | idem, `w` (130), `h` (160), `stopper` |
| `eprouvette` | éprouvette graduée : `value` (volume affiché), `max` (100), `step` (10, graduation), `liquid`, `objet: {size, color}` (caillou immergé) |

### Chauffage et mesure
| `type` | propriétés |
|---|---|
| `plaque` | plaque chauffante : `w` (150), `on` (vrai/faux), `power` (0 à 1) |
| `flamme` | bec électrique / bec Bunsen : `on`, `power` |
| `trepied` | `w` (140), `h` (100) : poser un bécher à `y − h` |
| `thermometre` | `x`, `y` (bas du réservoir), `h` (190), `value`, `min` (−20), `max` (110), `unit` (°C), `decimals` (0), `display` (afficheur, vrai), `dx` (30 : écart de l'afficheur ; plus grand pour le sortir d'un bécher, négatif pour le mettre à gauche) |
| `balance` | `w` (170), `value`, `unit` (g), `decimals` (1) — un objet posé dessus : `y = y_balance − 44` |
| `dynamometre` | `x`, `y` (point d'accroche en haut), `h` (170), `value`, `max` (10), `unit` (N) — l'objet suspendu : `y = y_dyn + h + 26 + taille de l'objet` avec `"hang": 0` |
| `chrono` | `x`, `y` (centre), `value` (secondes), `format` (`mmss` ou `s`) |
| `multimetre` | `x`, `y` (centre), `mode` (`A`, `V`, `Ω`), `value`, `unit`, `decimals` (2) — bornes : `(x − 18, y + 42)` COM et `(x + 18, y + 42)` |

### Électricité (placés par leur centre ; relier les bornes avec des `fil`)
| `type` | propriétés | bornes |
|---|---|---|
| `fil` | `points: [[x, y], …]`, `current` (0 à 2 : le courant circule, points lumineux), `color` | — |
| `pile` | `label` (« 4,5 V ») | `(x − 40, y)` borne −, `(x + 40, y)` borne + |
| `lampe` | `on` (0 à 1 : éclat) | `(x − 12, y + 34)`, `(x + 12, y + 34)` |
| `del` | `on`, `color` | `(x − 22, y)`, `(x + 22, y)` |
| `resistance` | `label` | `(x − 38, y)`, `(x + 38, y)` |
| `moteur` | `speed` (tours/s) | `(x − 34, y)`, `(x + 34, y)` |
| `interrupteur` | `closed` (vrai/faux) | `(x − 32, y)`, `(x + 32, y)` |

### Objets, modèle particulaire, vivant
| `type` | propriétés |
|---|---|
| `objet` | `shape` (`cube`, `boule`, `caillou`, `cylindre`, `goutte`, `bouteille`), `size` (40), `color`, `hang` (longueur de fil au-dessus) |
| `zoom` | loupe sur les particules : `x`, `y` (centre), `r` (70), `etat` (**0 = solide, 1 = liquide, 2 = gaz**, valeurs intermédiaires animées), `n` (24 particules), `color`, `mix` (0 à 1 : part de particules d'une 2e espèce, `color2`), `speed` |
| `boite-petri` | `x`, `y` (centre), `r` (60), `colonies` (nombre), `color` |
| `plante` | `h` (120), `leaves` (6), `color`, `wilt` (0 à 1 : se fane) |
| `emoji` | `char`, `size` (48) |

### Annotations et résultats
| `type` | propriétés |
|---|---|
| `etiquette` | `x`, `y` (centre de l'étiquette), `text`, `to: [x, y]` (point désigné par un trait) |
| `texte` | `x`, `y`, `text`, `size` (16), `anchor`, `bold`, `color` |
| `fleche` | `from: [x, y]`, `to: [x, y]`, `label`, `color`, `progress` (0 à 1 : la flèche se dessine) |
| `rayon` | rayon lumineux : `from`, `to`, `color`, `progress`, `width` |
| `courbe` | panneau graphique (coin haut gauche) : `w` (280), `h` (190), `xRange`, `yRange`, `xLabel`, `yLabel`, `title`, `points: [[x, y], …]`, `progress` (0 à 1 : la courbe se trace de gauche à droite), `color`, `zones: [{from, to, label}]` (bandes surlignées, ex. un palier : à ajouter avec `set` au bon moment), `ref: {points, label}` (courbe de comparaison en pointillés) |
| `releve` | tableau de mesures (coin haut gauche) : `w` (240), `title`, `head: [...]`, `rows: [[...], …]`, `shown` (nombre de lignes visibles : animer de 0 à N ; la dernière ligne apparue est surlignée, sauf avec `highlight: false`) |
| `forme` | `shape` (`rect`, `ellipse`, `line`, `polygon`, `path`), `x`, `y`, `w`, `h`, `points`, `d`, `fill`, `stroke`, `width` (pour entourer un `path` avec `focus`, donner aussi son cadre `x`, `y`, `w`, `h`) |

## 3. Exemple complet (extrait)

```json
"demo": {
  "items": [
    { "type": "paillasse", "y": 380 },
    { "type": "plaque", "id": "plaque", "x": 210, "y": 380 },
    { "type": "becher", "id": "b", "x": 210, "y": 344, "level": 0, "ice": 8, "solid": 1 },
    { "type": "thermometre", "id": "th", "x": 240, "y": 330, "value": -18, "h": 230 },
    { "type": "courbe", "id": "g", "x": 500, "y": 30, "xRange": [0, 20], "yRange": [-20, 110], "xLabel": "t (min)", "yLabel": "θ (°C)",
      "points": [[0, -18], [2, 0], [8, 0], [12, 100], [18, 100]], "progress": 0 },
    { "type": "zoom", "id": "z", "x": 640, "y": 330, "r": 60, "etat": 0, "hidden": true }
  ],
  "steps": [
    { "title": "Le matériel", "text": "De la glace sortie du congélateur, un thermomètre, une plaque chauffante.", "focus": ["b", "th"] },
    { "title": "On chauffe", "text": "La température de la glace monte jusqu'à 0 °C.", "duration": 4,
      "do": [ { "id": "plaque", "set": { "on": true } }, { "id": "th", "to": { "value": 0 } }, { "id": "g", "to": { "progress": 0.1 } } ] },
    { "title": "Prévois !", "ask": { "question": "…", "choices": ["…", "…"], "answer": 1, "explain": "…" } },
    { "title": "La glace fond", "text": "…", "duration": 7,
      "do": [ { "id": "b", "to": { "solid": 0, "level": 0.45 } }, { "id": "g", "to": { "progress": 0.4 } }, { "id": "z", "to": { "etat": 1 } } ], "show": ["z"] }
  ],
  "conclusion": "Pendant la fusion de l'eau pure, la température reste à 0 °C : c'est un **palier**." }
```
La leçon `pc-changements-etat` contient une expérience complète qui sert de modèle.
