# Version d'essai : quête, jeu de plateau et récompenses

Ce dossier `essai-jeu/` est la version en ligne du 12 octobre (v0.4, à la racine du site) **plus** :

- **Quête** (onglet par défaut de l'Espace exercices) : un chemin linéaire, un exercice par étape ; toutes les
  4 étapes, un défi garde un coffre (relevé = réussi sans la correction, au plus un indice ou un 2e essai) ;
  au bout, le grand coffre (au moins la moitié des étoiles). Sauvegardée par profil, reprise au retour.
- **Jeu de plateau** (`#/jeu`) : 1 à 4 joueurs sur le même ordinateur, chacun avec les questions de sa classe.
- **Récompenses** : points (défi 15, quête 40, partie 15, victoire +20, une fois par identifiant), album de
  24 vignettes de lumière (ordinaires dans les coffres de défi, rares pour une quête ou une victoire), 7 trophées.

Fichiers ajoutés : `js/engine/quete.js`, `js/engine/plateau.js`, `js/ui/game/{quest-plan,quest-view,rewards-ui,board,deck,dice}.js`,
`js/ui/views/jeu.js`, `css/jeu.css`. Fichiers modifiés : `index.html`, `js/main.js`, `js/app/store.js`, `js/ui/exercise.js`,
`js/engine/game.js`, `js/engine/game-rewards.js`, `js/ui/views/{exercices,progression,today}.js`.
Différence exacte avec la racine : `git diff --no-index <racine> essai-jeu` (en excluant `sw.js`, `precache.json`, `dev/`).

`sw.js` de l'essai ne met rien en cache (le cache hors connexion appartient à l'application principale).

Tests : `node --test essai-jeu/dev/tests/*.test.js` (règles du plateau, quête, album, points).
