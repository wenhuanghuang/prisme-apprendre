# Activités interactives disponibles (`activity.widget`)

Une section `manipulation` (ou un exercice) peut afficher une activité : `"activity": { "widget": "<nom>", "config": { … } }`.
Dans un exercice, les valeurs de `config` peuvent utiliser les paramètres : `"R": "{R}"`.
Les activités font **manipuler** la notion ; la réponse de l'exercice reste saisie dans les champs prévus par son type.

| widget | ce que l'élève manipule | config |
|---|---|---|
| `balance` | balance à plateaux : sacs identiques (inconnue) et billes ; boutons « retirer 1 bille / 1 sac des deux côtés », « partager en n » ; journal des équations équivalentes | `a, b, c, d` (équation `a·x + b = c·x + d`, entiers ≥ 0), `x` (contenu caché d'un sac), `mode`: `explore` ou `solve` |
| `numberline-explore` | droite graduée : un point se déplace par sauts (relatifs), l'élève ajoute des sauts et prédit l'arrivée | `min, max, start, moves` (liste de sauts proposés, ex. `[3, -5]`) |
| `fraction-bars` | barres découpables : choisir le nombre de parts, colorier, comparer deux fractions, trouver une fraction égale | `fractions` (ex. `["2/3", "4/6"]`), `maxDen` (≤ 24) |
| `pythagore` | triangle rectangle déformable, carrés construits sur les côtés avec leurs aires ; mode réciproque : trois longueurs données | `a, b` (côtés de l'angle droit) ou `sides: [a, b, c]` pour la réciproque |
| `triangle-lab` | trois longueurs (curseurs) : le triangle se construit ou non ; mesure des angles et de leur somme | `mode`: `inegalite` ou `angles` ; `sides` (facultatif) |
| `ohm-lab` | circuit générateur réglable + résistance ; voltmètre et ampèremètre ; bouton « mesurer » qui remplit un tableau ; tracé U = f(I) | `R` (Ω, caché), `lamp` (true : lampe non ohmique), `noise` (0 à 0,05 : dispersion des mesures), `uMax` (V) |
| `density-lab` | balance électronique + éprouvette graduée (déplacement d'eau) avec plusieurs objets | `objects: [{id, label, mass (g), volume (cm³)}]` |
| `motion-lab` | chronophotographie : positions à intervalles réguliers, règle, chronomètre ; graphique position-temps | `mode`: `uniforme`/`accelere`/`ralenti`, `v` (m/s), `a` (m/s²), `dt` (s), `n` (nombre de positions) |
| `weight-lab` | dynamomètre et masses marquées sur différents astres ; tableau P/m | `planet`: `Terre`/`Lune`/`Mars`/`Jupiter`/`inconnue`, `g` (N/kg, utilisé si `inconnue`) |
| `heating-lab` | chauffage d'un échantillon depuis l'état solide ; thermomètre ; courbe température-temps | `mode`: `pur` ou `melange`, `palier` (°C, température de fusion du corps pur) |
| `dice-lab` | lancers simulés (1 à 10 000) ; fréquences qui se stabilisent ; comparaison avec la probabilité | `faces` (4 à 20), `dice` (1 ou 2), `event` (texte) |
| `knn-lab` | nuage de points étiquetés ; l'élève ajoute des exemples, choisit k ; l'IA classe de nouveaux points ; matrice d'erreurs | `preset`: `fruits` (taille/couleur) ou `biais` (données déséquilibrées) ; `k` |
| `bigram-lab` | modèle de langage miniature : on lui donne un texte, il compte « quel mot suit quel mot » et génère une suite ; on voit les probabilités | `corpus` (texte), `start` (mot de départ) |
| `turtle` | zone de dessin de la tortue (utilisée automatiquement par les exercices `code`) | `program` (programme à exécuter) |

## Langage Tortue (exercices `code`)

```
avance 50         recule 20         droite 90         gauche 45      (tourne droite 90 est aussi accepté)
répète 4 [ avance 50 droite 90 ]
lève              pose              couleur rouge
mets c à 10       ajoute 5 à c      si c > 20 [ … ] sinon [ … ]
pour carre taille [ répète 4 [ avance taille droite 90 ] ]     puis :  carre 80
```
La tortue part de (0, 0) vers la droite. Les noms de variables peuvent avoir plusieurs lettres ; une expression continue jusqu'au prochain mot-clé ou crochet (`avance c + 5 droite 90`, `si c > 20 [ … ]`, `avance (c + 5) * 2`).
Un exercice `code` compare le dessin obtenu à celui du programme `reference` (au symétrique près) ; `start` pré-remplit l'éditeur (programme à compléter ou à déboguer) ; `codeConstraints.maxInstructions` / `codeConstraints.mustUse` imposent une démarche ; `misconceptions: [{ program, id, error, feedback }]` reconnaît le dessin produit par une idée fausse typique (ex. tourner de 60° au lieu de 120° pour un triangle).
