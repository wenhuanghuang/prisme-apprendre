# Version d'essai : quête, jeu de plateau et récompenses

Ce dossier `essai-jeu/` est la version en ligne du 12 octobre (v0.4, à la racine du site) **plus** :

- **Quête de l'année** (accueil de l'onglet « Quête ») : pour chaque matière, les chapitres du parcours dans l'ordre,
  répartis sur les 5 périodes de l'année scolaire 2026-2027 (calendrier officiel ; hiver et printemps : zone A,
  indicatif). Chaque chapitre est une quête de 1 à 3 étapes ; terminé avec au moins 30 % des étoiles, il reçoit une
  médaille (bronze, argent ≥ 60 %, or ≥ 85 %) ; une période terminée ouvre un coffre rare ; l'année entière, un dernier
  coffre. Le jour indique la période en cours et le rythme conseillé (étapes par semaine), sans rien verrouiller.
- **Gardiens des périodes** (quête de l'année) : chaque période a son gardien (Feuillu le hérisson, Frimas la chouette,
  Banquise le phoque, Pétale la tortue, Solaris le dragon). Dès deux chapitres de la période terminés, on peut le défier :
  8 questions mêlées des chapitres faits (révision espacée et entrelacée) ; chaque réponse réussie sans la correction
  (au plus un indice ou un 2e essai) allume un de ses 5 cœurs. Cinq cœurs : il est apprivoisé et ouvre son trésor
  (+30 points, vignette rare, trophées « Ami des gardiens » et « Dompteur de dragons ») ; sinon il s'envole et revient
  avec d'autres questions, sans pénalité. Affrontement enregistré (reprise après une pause), revanche possible sans
  nouveaux points (`js/engine/gardien.js`, `js/ui/game/guardian-view.js`, `planReview` dans `quest-plan.js`).
- **École primaire (CP → CM2)** : 23 générateurs de mathématiques rattachés aux chapitres des parcours officiels
  (`js/generators/primaire-maths.js`, notions dans `content/skills/maths-primaire.json`) : numération, calcul,
  tables, grandeurs, fractions, décimaux, problèmes, géométrie, données, hasard. La quête de l'année, la quête libre,
  le plateau, les séries et les générateurs illimités fonctionnent donc aussi au primaire (19 à 23 chapitres de maths
  jouables par classe). Les erreurs typiques sont diagnostiquées (retenue oubliée, « 1 h = 100 min », virgules…).
- **Primaire, toutes matières** : 31 générateurs de données (`content/generators/*-p-*.json`, fabriqués par
  `dev/gen_primaire.py`) et 2 générateurs « temps » (`js/generators/primaire-monde.js`) : conjugaison du CP au CM2
  (présent → passé simple et plus-que-parfait), homophones, pluriels, féminins, accord sujet-verbe, classes de mots,
  types de phrases, contraires ; vivant/non vivant, régimes alimentaires, états de la matière, familles d'aliments,
  conducteurs/isolants, ovipares/vivipares, sources de lumière, énergies, classification des vertébrés ; calendrier,
  siècles, grandes périodes, frises du Moyen Âge à 1789 et de 1789 à nos jours, continents et océans, capitales de
  l'UE ; anglais (59 mots, avec écoute). Chaque générateur est rattaché à ses chapitres officiels : en CE1 comme en
  CM2, cinq matières ont leur quête de l'année.
- **Encore au primaire** : dictées lues par l'ordinateur (mots du CP, mots invariables du CE1, phrases du CE2, avec les
  erreurs typiques reconnues), cycles de vie et phases de la Lune à remettre dans l'ordre, journée, semaine et saisons,
  points cardinaux, symboles de la République (`js/generators/primaire-plus.js`, `emc-p-symboles`).
- **Trophées annoncés** : un message « 🏆 Nouveau trophée » quand on en gagne un.
- **Correctif** : dans « Générateurs illimités », la classe de l'élève est transmise (un CE2 n'a plus des exercices de CP).
- **Curiosité et bonnes habitudes** : énigme du jour (une par jour, matière tournante, +10 points, série d'énigmes,
  un « Le savais-tu ? » parmi 30 curiosités vérifiées, trophées Esprit curieux / Grand curieux) ; constellation de
  l'année (une étoile par chapitre, allumée à la médaille) ; série de réussites du premier coup dans les quêtes ;
  pause proposée après 25 minutes d'exercices sans coupure (jamais imposée).
- **Quête libre** : un chemin linéaire au choix, un exercice par étape ; toutes les
  4 étapes, un défi garde un coffre (relevé = réussi sans la correction, au plus un indice ou un 2e essai) ;
  au bout, le grand coffre (au moins la moitié des étoiles). Sauvegardée par profil, reprise au retour.
- **Jeu de plateau** (`#/jeu`) : 1 à 4 joueurs sur le même ordinateur, chacun avec les questions de sa classe.
- **Récompenses** : points (défi 15, quête 40, partie 15, victoire +20, chapitre 20, période 50, année 100, gardien 30 ; une fois par
  identifiant), album de 48 vignettes de lumière (36 ordinaires dans les coffres de défi, 12 rares pour une quête, une
  période, une année ou une victoire), 11 trophées.

Fichiers ajoutés : `js/engine/{quete,annee,enigme,plateau,gardien}.js`, `js/generators/primaire-maths.js`, `content/skills/maths-primaire.json`,
`js/ui/game/{quest-plan,quest-view,year-view,guardian-view,rewards-ui,pause,board,deck,dice}.js`, `js/ui/views/enigme.js`,
`js/ui/views/jeu.js`, `css/jeu.css`. Fichiers modifiés : `index.html`, `js/main.js`, `js/app/store.js`, `js/ui/exercise.js`,
`js/engine/game.js`, `js/engine/game-rewards.js`, `js/generators/maths-pc.js`, `js/ui/views/{exercices,progression,today}.js`,
`content/index.json` (57 notions et 31 générateurs du primaire ajoutés ; à régénérer par `npm run build` à l'intégration), `content/skills/{maths-primaire,hg-primaire,primaire-donnees}.json`.
Différence exacte avec la racine : `git diff --no-index <racine> essai-jeu` (en excluant `sw.js`, `precache.json`, `dev/`).

`sw.js` de l'essai ne met rien en cache (le cache hors connexion appartient à l'application principale).

Tests : `node --test essai-jeu/dev/tests/*.test.js` (125 tests : plateau, quête, année, album, points, énigme, pauses, et les générateurs du primaire — 60 tirages par classe et par niveau, bonne réponse acceptée, erreurs typiques diagnostiquées).
