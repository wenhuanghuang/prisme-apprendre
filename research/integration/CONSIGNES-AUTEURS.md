# Consignes communes aux auteurs de contenus (vague 1 : compléter la 5e et la 4e)

Projet : `D:\Claude\Logiciel d'aide à apprentissage Primaire - lycée` (application « Prisme »).

## À lire d'abord
- `docs/FORMAT-CONTENU.md` (format des leçons, exercices, types, idées fausses, `selfTest`, audio) ;
- `docs/WIDGETS.md` (activités interactives disponibles) ;
- la leçon modèle de ta matière (indiquée dans ta mission) et `app/content/lessons/m4-equations.json` ;
- le parcours concerné dans `app/content/courses/` (lecture seule) : titres des chapitres, attendus officiels (`official`), compétences déjà rattachées ;
- les compétences existantes (`app/content/skills/*.json`) : **réutilise** une compétence existante quand elle correspond exactement.

## Pour chaque chapitre qui t'est confié : une leçon
- Fichier `app/content/lessons/<id>.json` (id avec le préfixe indiqué), `level`, `subject`, `programmes` (ids du parcours), `status`.
- Sections : découverte, cours (« À retenir »), exemple(s) résolu(s), exercices, erreurs fréquentes (`correction`), ressource (`"links": []` : **aucune URL inventée**).
- **10 à 12 exercices** : au moins 6 « classe », 2 « approfondissement », 2 « expert » (vrais problèmes de réflexion), 2 remédiations (`role: "remediation"`, `targets`), **au plus 1 QCM**. Varie les types (numeric, expression, steps, text, table, order, match, categorize, highlight, graph, numberline, open avec critères visibles et 2 modèles, composite, code…).
- **Paramètres** (`params`) dès que possible en maths et en physique-chimie : l'exercice change de valeurs à chaque tirage et peut revenir dans une série.
- Idées fausses précises (`mc:…`, `error`, `feedback` qui explique sans donner la réponse) et `selfTest` pour chaque exercice (réponse juste + réponse fausse typique).
- Exactitude absolue (vérifie en ligne si besoin). Géométrie : pas d'image ; utilise le repère (`graph`), la droite graduée, la Tortue (`code`), les activités, ou des coordonnées et des descriptions précises.

## Compétences
Crée **un seul** fichier `app/content/skills/<ta-clé>.json` (`"subject"` = la matière) pour tes nouvelles compétences : identifiants avec le préfixe de la matière et du niveau (ex. `m5.geo.symetrie-axiale`), `level`, `track: "classe"`, `status` (`programme` / `approfondissement` / `hors-programme`), `domain`, `prereqs`, `editorialLevel: true` si le programme est défini par cycle. Ne modifie aucun autre fichier de compétences.

## Ne modifie PAS
Les parcours (`app/content/courses/`), le code (`app/js`, `tools`), les fichiers d'autres auteurs. Pour le rattachement, écris **`research/integration/<ta-clé>.json`** :
```json
[ { "course": "maths-5e", "chapter": "m5-ch-symetries", "lessons": ["m5-symetries"], "skills": ["m5.geo.symetrie-axiale"] } ]
```

## Textes et filtre de contenu
Ne recopie jamais plus de 4 vers ou 40 mots d'un texte, même du domaine public (un filtre automatique interrompt sinon ton travail). Écris tes propres textes et phrases d'exercice ; pour une œuvre, cite au plus un court extrait exact et résume le reste.

## Validation obligatoire
`node tools/validate-content.js --only=<tes ids de leçons, séparés par des virgules>` jusqu'à « ✓ Contenus valides », puis `node tools/validate-content.js --check` (d'autres auteurs travaillent en parallèle : ignore leurs erreurs, corrige les tiennes). Écris et valide les leçons **une par une**.

## Réponse finale
Leçons créées (id, nombre d'exercices par parcours), compétences créées, fichier d'intégration, idées fausses principales, points à signaler (doutes, limites).
