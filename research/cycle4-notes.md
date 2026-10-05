# Cycle 4 : mathématiques et physique-chimie en 2026-2027 (synthèse de recherche)

Recherche du 5 octobre 2026. Fichiers associés dans le même dossier : cycle4-maths-pc.json (données structurées, 199 entrées), lumni-links.json (20 liens Lumni vérifiés). Règle suivie : aucune URL devinée ; une URL est marquée verified=true seulement si elle a été ouverte et lue.

## 1. Réponse courte

| Classe en 2026-2027 | Mathématiques | Physique-chimie |
|---|---|---|
| 5e | NOUVEAU programme de cycle 4 (arrêté du 18 février 2026, NOR MENE2602912A, JORF du 4 mars 2026, BO n°10 du 5 mars 2026, annexe 2). Premier niveau concerné. | Programme du cycle 4 en vigueur depuis 2020 (BO n°31 du 30 juillet 2020). Aucun changement. |
| 4e | ANCIEN programme (texte de 2015 consolidé en 2020, BO n°31 du 30 juillet 2020) + repères annuels et attendus de fin d'année de 2019. Nouveau programme de 4e : rentrée 2027-2028. | Idem 5e : programme de cycle 2020. |
| 3e | ANCIEN programme, mêmes textes. Nouveau programme de 3e : rentrée 2028-2029. | Idem. |

Corrections au brief :
- Le nouveau programme de maths est de 2026, pas de 2025. Ce qui date de mai 2025 est un projet du Conseil supérieur des programmes, sans valeur réglementaire.
- Les repères annuels de 2019 existent bien (BO n°22 du 29 mai 2019) mais ne servent plus que pour les 4e et 3e. Pour la 5e, le nouveau texte est lui-même annuel.
- Le programme de 6e (cycle 3, français et maths) a aussi changé : arrêté du 10 avril 2025, appliqué en 6e depuis 2025-2026. Les élèves de 5e de cette année sont donc la première cohorte à avoir fait le nouveau 6e ; les élèves de 4e ont fait l'ancien.
- En physique-chimie, aucun nouveau programme n'est applicable : il n'existe qu'un projet (CSP, juillet 2025), soumis à consultation nationale du 18 mai au 19 juin 2026.

## 2. Mathématiques

### 2.1 Lecture du texte applicable

Article 3 de l'arrêté du 18 février 2026, cité mot pour mot par Légifrance : application à la rentrée 2026-2027 pour la classe de cinquième, 2027-2028 pour la quatrième, 2028-2029 pour la troisième. L'article 2 supprime les parties français et mathématiques de l'annexe 3 de l'arrêté du 9 novembre 2015. Comme l'article 3 échelonne tout l'arrêté par classe, l'ancien texte continue de s'appliquer aux 4e et 3e jusqu'à leur tour. C'est la lecture de toutes les académies consultées, mais c'est une inférence : la phrase n'est pas écrite telle quelle.

Structure du nouveau texte : cinq rubriques (Nombres et calculs ; Espace et géométrie ; Organisation et gestion de données et probabilités ; Proportionnalité, fonctions ; La pensée informatique). Pour chaque classe et chaque rubrique : « Automatismes » puis « Objectifs d'apprentissage », avec des « Prolongements possibles » historiques ou culturels. Il n'y a plus de thème « Grandeurs et mesures » : les aires, volumes et unités sont répartis dans Espace et géométrie et dans Proportionnalité. Le JSON range donc les entrées de 5e dans les cinq thèmes du brief, avec la rubrique officielle d'origine dans le champ source.

L'ancien texte est un programme de cycle (thèmes A à E). Les attendus par classe viennent des documents Éduscol de 2019.

### 2.2 Classe de 5e (nouveau programme, 66 entrées au programme)

- Nombres et calculs : opérations et priorités ; distributivité simple ; critères de divisibilité par 3 et 9 ; relatifs (définition, opposé, valeur absolue sans exercice, addition et soustraction) ; comparer, additionner et soustraire des fractions de dénominateurs quelconques ; carré et cube (carrés de 0 à 12) ; calcul littéral (formules, substitution, k(a+b), contre-exemple, preuve par le calcul littéral, inconnue, équations ax = c et x + b = c par opérations inverses).
- Données et fonctions : effectifs, fréquences, diagrammes, moyenne simple ; probabilités simples (échelle, équiprobabilité, fréquences) ; proportions et pourcentages, coefficient de proportionnalité, graphiques ; « en fonction de », tableaux de valeurs, graphique cartésien.
- Grandeurs et mesures (rangement éditorial) : volumes du cube, pavé et prisme ; aire du disque et volume du cylindre ; aires du triangle et du parallélogramme ; conversions.
- Espace et géométrie : repérage ; perspective cavalière et patrons ; demi-tour (symétrie centrale) ; parallélisme et angles ; somme des angles d'un triangle (à démontrer) ; médiatrices, hauteurs, médianes ; parallélogrammes et parallélogrammes particuliers.
- Algorithmique : instructions, entrées et sorties, programmation par blocs, boucle inconditionnelle ; la variable n'est vue qu'en lecture d'une donnée saisie.

Changements notables par rapport à l'ancien 5e : l'inégalité triangulaire n'est plus citée ; les calculs de durées et d'horaires ne sont plus cités ; les fractions ne sont plus limitées aux dénominateurs égaux ou multiples ; carré et cube arrivent en 5e ; les médianes et l'aire du disque sont explicites ; le calcul littéral est plus poussé (équations simples dès la 5e).

### 2.3 Classe de 4e (ancien programme, 41 entrées au programme)

Source : attendus de fin d'année 4e (Éduscol 2019) et colonne 4e des repères annuels.

- Nombres : puissances de 10 (exposants positifs et négatifs) et notation scientifique ; préfixes nano à giga ; racine carrée (définition, encadrement) ; produit et quotient de relatifs ; les quatre opérations sur les fractions et l'inverse ; nombres premiers jusqu'à 100 et décomposition ; simplification de fractions.
- Calcul littéral : structure somme/produit ; distributivité simple ; équivalence de programmes de calcul ; mise en équation ; équations du premier degré jusqu'à 2x + 5 = −x − 4.
- Données et fonctions : diagramme circulaire ; médiane (effectif jusqu'à 30) ; vocabulaire des probabilités et évènement contraire ; quatrième proportionnelle ; formules (loi d'Ohm, v = d/t) ; dépendance de deux grandeurs par formule et graphique.
- Grandeurs : volumes de la pyramide et du cône ; conversions de grandeurs composées (km/h et m/s) ; agrandissement-réduction ; effet de la translation.
- Géométrie : repérage dans un pavé droit ; cas d'égalité des triangles ; Thalès (triangles emboîtés) ; Pythagore et réciproque ; cosinus ; translation.
- Algorithmique : niveaux 1 et 2 attendus (blocs, conditions, boucle répéter n fois, évènement, variable).

Pas en 4e (ancien programme) : double distributivité et a² − b² (3e) ; Thalès en papillon, sinus, tangente, rotation, homothétie (3e) ; fonctions linéaires et affines, notation f(x) (3e) ; taux d'évolution et coefficient multiplicateur (3e) ; histogrammes et étendue (3e).

Explicitement exclus par les textes : formules générales sur les produits et quotients de puissances ; propriétés algébriques des racines carrées ; objet vecteur et définition ponctuelle de la translation ; arbres de probabilités.

Attention à la rupture de 2027-2028 : un élève de 4e en 2026-2027 aura en 2027-2028 le nouveau programme de 4e. Dans le nouveau texte le cosinus, le sinus et la tangente passent tous en 3e, Thalès passe en 3e, la racine carrée et les puissances sont reformulées, les pourcentages avec coefficient multiplicateur arrivent en 4e.

### 2.4 Classe de 3e (brève, ancien programme)

Rationnels et fractions irréductibles ; puissances négatives et notation scientifique ; racines carrées ; double distributivité, a² − b², équations produits et x² = a ; histogrammes ; probabilités à une ou deux épreuves (tableau à double entrée) ; fonctions, linéaires et affines ; pourcentage d'évolution ; volume de la boule ; rotation et homothétie ; Thalès en papillon, triangles semblables, cosinus, sinus, tangente ; algorithmique niveau 3. Les trois identités remarquables, les vecteurs et la sphère ne sont qu'au nouveau texte de 2028-2029.

### 2.5 Les exemples du brief, un par un

| Classe | Notion | Verdict |
|---|---|---|
| 5e | Relatifs, addition et soustraction | Oui |
| 5e | Fractions de même dénominateur ou multiples | Non, plus large : dénominateurs quelconques |
| 5e | Distributivité simple | Oui |
| 5e | Symétrie centrale | Oui (appelée demi-tour) |
| 5e | Parallélogramme | Oui |
| 5e | Somme des angles d'un triangle | Oui, et à démontrer |
| 5e | Inégalité triangulaire | Plus citée dans le texte de 2026 |
| 5e | Proportionnalité | Oui, avec pourcentages |
| 5e | Probabilités | Oui, version simple |
| 4e | Produit et quotient de relatifs | Oui |
| 4e | Opérations sur les fractions | Oui (quatre opérations) |
| 4e | Puissances | Oui, sans formules générales |
| 4e | Double distributivité | Non, 3e |
| 4e | Équations du 1er degré | Oui |
| 4e | Pythagore et réciproque | Oui |
| 4e | Cosinus | Oui (ancien programme seulement) |
| 4e | Thalès | Oui, triangles emboîtés seulement |
| 4e | Translation | Oui, sans vecteur |
| 4e | Pourcentages | Partiel : application de la quatrième proportionnelle |
| 4e | Scratch | Oui, niveaux 1 et 2 |

### 2.6 Les six compétences

Chercher, modéliser, représenter, raisonner, calculer, communiquer. Les deux textes (2020 et 2026) les nomment à l'identique ; le texte de 2026 les rattache à la résolution de problèmes, « au cœur de tous les domaines ». Descriptions dans le JSON.

### 2.7 Hors programme mais accessible en approfondissement

- Ne sont PAS hors programme : le raisonnement par l'absurde, par contre-exemple, par disjonction de cas, la contraposée et la réciproque, l'initiation à la démonstration. Les deux textes les inscrivent ; le texte de 2026 demande d'abord la compréhension du raisonnement, sans exigence formelle de rédaction.
- Vraiment au-delà du texte applicable en 2026-2027 : identités remarquables (a+b)² et (a−b)² (3e du nouveau texte) ; sinus et tangente avant la 3e ; vecteurs ; arbres de probabilités ; propriétés algébriques des racines ; formules générales sur les puissances (pour un 4e de l'ancien programme) ; systèmes d'équations et équations du second degré (absents des deux textes) ; programmation textuelle.
- Prolongements culturels cités par le texte de 2026 : crible d'Ératosthène et infinité des nombres premiers (5e), droite d'Euler et cercle des neuf points (5e), irrationalité de √2 par l'absurde (4e), théorème de Varignon (4e), identité de Sophie Germain (3e).
- Ressources Éduscol vérifiées : Exemples pour la mise en œuvre des programmes, cycle 4, mathématiques (2026) ; Repères annuels de progression et attendus de fin d'année 5e, 4e, 3e (2019) ; guide « La résolution de problèmes mathématiques au collège » ; document « Algorithmique et programmation » cycles 2, 3, 4 (mars 2016, ancien programme, sans équivalent récent trouvé). La page Éduscol « Ressources d'accompagnement du programme de mathématiques au cycle 4 » n'a pas pu être ouverte (HTTP 403).

## 3. Physique-chimie

### 3.1 Texte applicable

Programme du cycle 4 en vigueur depuis la rentrée 2020 : annexe 3 de l'arrêté du 9 novembre 2015, remplacée par l'arrêté du 17 juillet 2020 (NOR MENE2018714A), BO n°31 du 30 juillet 2020. Les textes modificatifs de 2024 à juin 2026 listés par Légifrance ne contiennent rien sur la physique-chimie du cycle 4.

### 3.2 Défini par cycle uniquement : oui

Le programme ne donne que des attendus de fin de cycle, des connaissances et compétences associées, et des « repères de progressivité » par thème. Il n'y a ni repères annuels ni attendus de fin d'année officiels. Le programme précise lui-même qu'il est possible d'atteindre les attendus par différentes programmations sur les trois années, et Éduscol (juin 2016) répète que la progression relève de l'équipe enseignante. L'ordre proposé par l'application sera donc une progression éditoriale : le JSON distingue pour chaque notion le champ basis = officiel (le programme donne une indication de classe) ou éditorial (proposition).

Intitulés officiels des quatre thèmes : Organisation et transformations de la matière ; Mouvement et interactions ; L'énergie, ses transferts et ses conversions (et non « l'énergie et ses conversions », intitulé de 2015-2016) ; Des signaux pour observer et communiquer.

### 3.3 Indications de classe données par le programme (repères de progressivité)

- Matière : dès la 5e, états, changements d'état, mélanges, corps pur, conservation de la masse et non-conservation du volume ; modèle particulaire possible dès la 5e ; premières transformations chimiques dès la 5e ; masse volumique à partir de la 4e ; tableau périodique à partir de la 4e ; équations de réaction fournies, cas simples, en 4e ; atome et noyau réservés à la 3e.
- Mouvement : vitesse dès le début du cycle ; interactions de façon descriptive dès le début, force si possible dès la 4e ; en fin de cycle P = m × g et gravitation avec l'expression fournie.
- Énergie : 5e = sources et conversions, ordres de grandeur ; circuits simples dès la 5e ; lois de l'électricité en 4e et 3e dans l'ordre voulu ; aspects énergétiques (P = U × I, E = P × t, énergie cinétique) pouvant être réservés à la 3e ; conservation de l'énergie objectif de fin de cycle.
- Signaux : aucune indication de classe ; maîtrise de la fréquence en fin de cycle.

### 3.4 Hors programme mais traitable en approfondissement

Absents du programme de 2020 (aucune occurrence dans le texte) : incertitudes de mesure et chiffres significatifs, régression linéaire, vecteurs, aimants, notion de pression, notion d'onde, rendement, principe d'inertie. Les modèles et leurs limites sont à la fois une compétence du programme (« Développer des modèles simples ») et un thème explicite du projet de 2025. Pont avec l'IA : le programme de 2020 cite déjà le coût énergétique du numérique ; le projet de 2025 ajoute l'IA générative (calcul E = P × t).

### 3.5 Ce qui arrive

Projet CSP de juillet 2025 (« n'engage pas, à ce stade, le ministère ») : organisé année par année, thèmes renommés (dont « Ondes et signaux »), avec « Variabilité de la mesure » et « Connaissances épistémiques ». Consultation nationale du 18 mai au 19 juin 2026. Réunion ministère-syndicats le 24 septembre 2026. Aucune date d'application publiée ; un syndicat évoque un programme de 5e à la rentrée 2028.

## 4. IA et numérique au collège en 2026-2027

- Pix IA : deux parcours obligatoires, « Décrypter le fonctionnement et les enjeux de l'IA » et « Utiliser l'IA générative de façon éclairée et efficace », pour les élèves de 4e, de 2de et de 1re année de CAP. Réalisés en classe, sans certification, 30 à 45 minutes par parcours selon Pix. Note de service du BO n°6 du 5 février 2026. L'élève de 4e est concerné ; l'élève de 5e ne l'est pas.
- Cadre d'usage de l'IA en éducation (juin 2025) : sensibilisation dès le premier degré sans manipulation d'IA générative ; usage pédagogique des IA génératives par les élèves autorisé en classe à partir de la 4e, encadré par l'enseignant ; jamais de compte personnel demandé aux élèves ; formation obligatoire en 4e et en 2de sur Pix.
- Pix et CRCN : premier parcours Pix dès la 5e ; certification Pix en 3e (fenêtre collèges 2026-2027 : du 15 mars au 11 juin 2027).
- Technologie : programme du BO n°9 du 29 février 2024, applicable aux trois classes en 2026-2027 ; il cite les grands types d'apprentissage des IA, le biais et les incidences sociétales de l'IA.
- Mathématiques 2026 : la « pensée informatique » vise à comprendre les algorithmes et l'usage de machines « avec ou sans intelligence artificielle » ; programmation par blocs.
- EMI : programme de cycle 4 de 2020 en vigueur (sans mention de l'IA) ; projet de 2025 en consultation du 9 février au 13 mars 2026, qui place l'IA générative en 4e et en 3e ; pas encore applicable.
- Conséquence pour l'application : ne pas exposer l'IA générative en accès direct à l'élève de 5e ; pour la 4e, prévoir un usage encadré et complémentaire du parcours Pix IA, sans le dupliquer. Il s'agit d'une recommandation de prudence tirée du cadre d'usage, pas d'une obligation légale pour une application à usage familial.

## 5. Lumni

20 notions sur 20 ont une page vérifiée (HTTP 200, titre exact, niveaux), plus 40 pages alternatives vérifiées. WebFetch refuse le domaine lumni.fr : la vérification a été faite par GET HTTP direct, avec un test témoin (un chemin inventé renvoie 404).

URL de recherche fonctionnelle : https://www.lumni.fr/recherche?query={terme} (format relevé dans le JSON-LD du site ; testé avec accents et espaces ; le champ de recherche est pré-rempli). Le paramètre ?q= répond 200 mais ne pré-remplit rien. Les résultats sont chargés en JavaScript : l'URL ouvre la recherche dans un navigateur mais ne permet pas de récupérer les résultats par simple requête.

Précautions : les « cours Lumni - Collège » datent de 2020 et suivent l'ancien programme (à manier avec prudence pour la 5e) ; les niveaux affichés sont ceux de Lumni ; la vidéo « Les états de la matière » signale elle-même une erreur et n'a pas été retenue comme lien principal.

| Notion | Titre exact de la page | Type | Niveaux Lumni | URL |
|---|---|---|---|---|
| nombres relatifs (addition) | Comment additionner des nombres relatifs ? | video | 6e, 5e, 4e, 3e | https://www.lumni.fr/video/comment-additionner-des-nombres-relatifs |
| fractions (addition) | Comment additionner les fractions ? | video | 6e, 5e, 4e, 3e | https://www.lumni.fr/video/comment-additionner-les-fractions |
| calcul littéral / distributivité | Calcul littéral : la distributivité simple | video | 4e, 3e | https://www.lumni.fr/video/calcul-litteral-la-distributivite-simple |
| équations du premier degré | Résolutions d'équations | quiz | 4e, 3e | https://www.lumni.fr/quiz/les-equations |
| théorème de Pythagore | Le théorème de Pythagore | video | 4e, 3e | https://www.lumni.fr/video/le-theoreme-de-pythagore |
| proportionnalité | La proportionnalité | video | 5e, 4e | https://www.lumni.fr/video/proportionnalites-suite-31-mars |
| puissances | Puissances et notation scientifique | video | 4e, 3e | https://www.lumni.fr/video/puissances-de-10-et-notation-scientifique |
| probabilités | Introduction aux probabilités | video | 4e, 3e | https://www.lumni.fr/video/introduction-aux-probabilites |
| statistiques (moyenne/médiane) | Statistiques : moyenne et médiane | video | 4e, 3e | https://www.lumni.fr/video/statistiques-moyenne-et-mediane |
| Scratch / algorithmique | Algorithmique et programmation en Scratch : variables, boucles, tests | video | 4e, 3e | https://www.lumni.fr/video/algorithmique-et-programmation-en-scratch-variables-boucles-tests |
| masse volumique | Autour de la masse volumique | video | 4e, 3e | https://www.lumni.fr/video/autour-de-la-masse-volumique |
| changements d'état | Les états physiques, du macroscopique au microscopique | video | 6e, 5e | https://www.lumni.fr/video/les-etats-physiques-du-macroscopique-au-microscopique-30-avril |
| vitesse | Comment calculer une vitesse ? | video | 6e, 5e, 4e, 3e | https://www.lumni.fr/video/comment-calculer-une-vitesse |
| poids et masse | Poids et masse | video | 3e | https://www.lumni.fr/video/poids-et-masse |
| loi d'Ohm | Electricité : la loi d'Ohm | video | 4e, 3e | https://www.lumni.fr/video/la-loi-dohm |
| circuit électrique en série/dérivation | Les lois de l’électricité | video | 5e, 4e | https://www.lumni.fr/video/les-lois-de-lelectricite-14-mai |
| propagation du son | La propagation du son | quiz | 4e, 3e | https://www.lumni.fr/quiz/la-propagation-du-son |
| propagation de la lumière | Lumière : sources et propagation | quiz | 5e, 4e | https://www.lumni.fr/quiz/lumiere-sources-et-propagation |
| intelligence artificielle (comprendre l'IA) | L'IA est-elle vraiment intelligente ? | video | 4e, 3e | https://www.lumni.fr/video/l-ia-est-elle-vraiment-intelligente |
| atomes et molécules | Molécules, atomes et ions | video | 4e, 3e | https://www.lumni.fr/video/molecules-atomes-et-ions |

## 6. Points d'incertitude

- Plusieurs URLs officielles (education.gouv.fr/bo/..., eduscol.education.gouv.fr/NNNN/..., Éduscol « Enseigner au cycle 4 », consultation cycle 4, note de service Pix IA, circulaire de rentrée 2026) renvoient HTTP 403 (protection anti-robot) à WebFetch comme à curl : elles sont marquées verified=false. Les PDF hébergés sous /sites/default/files/... s'ouvrent, eux, normalement : ce sont eux qui ont servi de base.
- Annexe 2 de 2026 : le fichier officiel (education.gouv.fr, 395,7 Ko) et la copie reforme.education ont le même md5 : aucune incertitude sur le texte lu, relu en entier (1 438 lignes).
- Lecture juridique de l'arrêté du 18 février 2026 : l'article 2 supprime les parties français et mathématiques de l'annexe 3 de 2015, l'article 3 échelonne l'application par classe. L'inférence « l'ancien programme reste applicable en 4e et 3e jusqu'à leur tour » est celle de toutes les académies ouvertes mais n'est pas écrite telle quelle dans l'arrêté.
- Les repères annuels et attendus de fin d'année de 2019 (BO n°22 du 29 mai 2019) ne sont plus applicables en 5e (le texte 2026 les remplace par des objectifs annuels). Rien n'a été trouvé indiquant une abrogation formelle : ils restent la référence pour les 4e et 3e de 2026-2027.
- Texte 2026, 5e, calcul littéral : « Réduire une expression littérale de la forme ax + b » (probablement ax + bx). À confirmer sur le BO.
- Le rangement des entrées de 5e dans les 5 thèmes du brief est éditorial : le texte 2026 n'a plus de thème « Grandeurs et mesures ».
- Physique-chimie : ni arrêté ni date d'application d'un nouveau programme trouvés au 5 octobre 2026. Les informations sur la consultation (18 mai-19 juin 2026), la réunion du 24 septembre 2026 et l'espoir d'un programme de 5e en 2028 proviennent de syndicats (SNES, SNALC) et d'une académie ; non confirmées par un texte officiel lisible. À re-vérifier avant toute planification de contenu 2027-2028.
- Physique-chimie : les suggestedLevel marqués basis=éditorial sont des propositions : le programme est défini par cycle uniquement, l'ordre de l'application est une progression éditoriale.
- Pix IA : date de début d'obligation divergente selon les sources (janvier 2026 pour la DRANE BFC, mars 2026 pour Pix et la DRANE de Lyon) ; durée 30-45 minutes par parcours (Pix) contre 30 minutes à 1 h 30 au total (note de service citée par les académies). La note de service elle-même n'a pas pu être ouverte.
- Programme de technologie 2024 : le calendrier d'application par classe (5e 2024-25, 4e 2025-26, 3e 2026-27) vient de sites tiers ; l'arrêté du 9 février 2024 est confirmé par Légifrance mais son article d'entrée en vigueur n'a pas été lu.
- Lumni : WebFetch refuse lumni.fr ; vérification par GET HTTP direct. Les cours Lumni du collège datent de 2020 et suivent l'ancien programme.
- Acquis amont des élèves : le nouveau programme de 6e en mathématiques (arrêté du 10 avril 2025) s'applique depuis 2025-2026 ; le contenu de ce programme de cycle 3 n'a pas été lu en détail ici. Les élèves de 5e 2026-2027 l'ont suivi, ceux de 4e non.

## 7. À trancher ou à faire

- Confirmer sur le BO (page education.gouv.fr/bo/2026/Hebdo10/MENE2602912A, inaccessible aux robots) la formulation « ax + b » du calcul littéral de 5e.
- Re-vérifier avant chaque rentrée l'état du projet de programme de physique-chimie et la date d'application éventuelle.
- Décider si l'application affiche, pour la 5e, des contenus du nouveau programme de 4e en anticipation (marqués autre-annee dans le JSON) ou les masque.
- Prévoir le changement de référentiel de maths à chaque rentrée : 4e en 2027-2028, 3e en 2028-2029.

## 8. Sources principales (ouvertes et lues le 5 octobre 2026)

- Arrêté du 18 février 2026 (Légifrance) : https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053613385
- Annexe 2, programme de mathématiques du cycle 4 (PDF officiel) : https://www.education.gouv.fr/sites/default/files/document/Annexe%202%20%E2%80%93%20Programme%20de%20math%C3%A9matiques%20pour%20le%20cycle%204-480716.pdf
- Éduscol, Exemples pour la mise en œuvre des programmes, mathématiques cycle 4 (2026) : https://eduscol.education.gouv.fr/sites/default/files/document/exemple-mise-en-oeuvre-c4-mathematiques0pdf-126080.pdf
- BO n°31 du 30 juillet 2020 (PDF officiel, annexe 3 : programme du cycle 4, maths et physique-chimie) : https://education.gouv.fr/sites/default/files/imported_files/documents/BO_MENJS_31_1313155.pdf
- Arrêté du 17 juillet 2020 (Légifrance) : https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000042157717
- Arrêté du 10 avril 2025, cycle 3 français et maths (Légifrance) : https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000051468918
- Éduscol, repères annuels de progression cycle 4 mathématiques (2019) : https://eduscol.education.gouv.fr/sites/default/files/document/26-maths-c4-reperes-eduscol1114756pdf-74694.pdf
- Éduscol, attendus de fin d'année 4e (2019) : https://eduscol.education.gouv.fr/sites/default/files/document/16-maths-4e-attendus-eduscol1114746pdf-74682.pdf
- Éduscol, attendus de fin d'année 3e (2019) : https://eduscol.education.gouv.fr/sites/default/files/document/18-maths-3e-attendus-eduscol1114748pdf-74688.pdf
- Éduscol, progression en physique-chimie au cycle 4 (juin 2016) : https://eduscol.education.gouv.fr/sites/default/files/document/ra16c4phchaideconstructionprogression594860pdf-78099.pdf
- Projet CSP de programmes de physique-chimie du cycle 4 (juillet 2025) : https://www.education.gouv.fr/sites/default/files/2025-07/csp---projet-de-programmes-de-physique-chimie-du-cycle-4-441609.pdf
- Pix, parcours IA : https://pix.fr/actualites/intelligence-artificielle-parcours-apprenants-enseignement-scolaire-2026/
- Cadre d'usage de l'IA en éducation (juin 2025, copie hébergée à Rennes) : https://pedagogie.ac-rennes.fr/sites/pedagogie.ac-rennes.fr/IMG/pdf/l_ia_en_education_-_cadre-d-usage-2.pdf
- Programme de technologie du cycle 4 (BO n°9 du 29 février 2024) : https://www.education.gouv.fr/sites/default/files/ensel802_annexe.pdf
