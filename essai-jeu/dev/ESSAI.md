# Version d'essai : quête, jeu de plateau et récompenses

Ce dossier `essai-jeu/` est la version en ligne du 12 octobre (v0.4, à la racine du site) **plus** :

- **Quête de l'année** (accueil de l'onglet « Quête ») : pour chaque matière, les chapitres du parcours dans l'ordre,
  répartis sur les 5 périodes de l'année scolaire 2026-2027 (calendrier officiel ; hiver et printemps : zone A,
  indicatif). Chaque chapitre est une quête de 1 à 3 étapes ; terminé avec au moins 30 % des étoiles, il reçoit une
  médaille (bronze, argent ≥ 60 %, or ≥ 85 %) ; une période terminée ouvre un coffre rare ; l'année entière, un dernier
  coffre. Le jour indique la période en cours et le rythme conseillé (étapes par semaine), sans rien verrouiller.
- **Quête libre** : un chemin linéaire au choix, un exercice par étape ; toutes les
  4 étapes, un défi garde un coffre (relevé = réussi sans la correction, au plus un indice ou un 2e essai) ;
  au bout, le grand coffre (au moins la moitié des étoiles). Sauvegardée par profil, reprise au retour.
- **Jeu de plateau** (`#/jeu`) : 1 à 4 joueurs sur le même ordinateur, chacun avec les questions de sa classe.
- **Récompenses** : points (défi 15, quête 40, partie 15, victoire +20, chapitre 20, période 50, année 100 ; une fois par
  identifiant), album de 48 vignettes de lumière (36 ordinaires dans les coffres de défi, 12 rares pour une quête, une
  période, une année ou une victoire), 11 trophées.

Fichiers ajoutés : `js/engine/{quete,annee,plateau}.js`, `js/ui/game/{quest-plan,quest-view,year-view,rewards-ui,board,deck,dice}.js`,
`js/ui/views/jeu.js`, `css/jeu.css`. Fichiers modifiés : `index.html`, `js/main.js`, `js/app/store.js`, `js/ui/exercise.js`,
`js/engine/game.js`, `js/engine/game-rewards.js`, `js/ui/views/{exercices,progression,today}.js`.
Différence exacte avec la racine : `git diff --no-index <racine> essai-jeu` (en excluant `sw.js`, `precache.json`, `dev/`).

`sw.js` de l'essai ne met rien en cache (le cache hors connexion appartient à l'application principale).

Tests : `node --test essai-jeu/dev/tests/*.test.js` (règles du plateau, quête, calendrier et plan de l'année, album, points).
