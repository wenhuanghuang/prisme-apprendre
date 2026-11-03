/* Version d'essai du jeu de plateau : pas de fonctionnement hors connexion.
   Le cache appartient à l'application principale (un dossier plus haut) : cet essai n'y touche pas. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
