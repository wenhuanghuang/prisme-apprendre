/**
 * Technologie au collège (cycle 4) : générateurs rattachés aux chapitres des parcours techno-5e, techno-4e et
 * techno-3e. Classements (matériaux, énergies, capteurs et actionneurs), associations, étapes à ranger, petits
 * calculs (énergie, données) et questions de cours expliquées.
 */
import { pick, sample, ri, numeric, mc, fr, roundTo } from './gen-util.js';
import { qcm } from './primaire-savoirs.js';

const GEN = [];
const LEVELS = ['5e', '4e', '3e'];
function add(g) {
  const { make, ...rest } = g;
  GEN.push({ tracks: ['classe', 'approfondissement'], options: [], levels: LEVELS, subject: 'techno', ...rest, make(rand, o = {}, tier = 'classe') { return make(rand, tier !== 'classe'); } });
}
/** Classement : quelques éléments tirés au hasard, au moins deux catégories représentées. */
function categorize(rand, prompt, categories, items, count = 6) {
  let pickd = [];
  for (let k = 0; k < 30; k++) { pickd = sample(rand, items, Math.min(count, items.length)); if (new Set(pickd.map((i) => i[1])).size >= 2) break; }
  return {
    type: 'categorize', prompt, categories: categories.map(([id, label]) => ({ id, label })), items: pickd.map(([label, category], i) => ({ id: `i${i}`, label, category })),
    hints: ['Pour chaque élément, demande-toi à quoi il sert ou de quoi il est fait.'], solution: pickd.map(([label, c, why]) => `${label} → ${categories.find((x) => x[0] === c)[1]}${why ? ` (${why})` : ''}`).join(' ; '),
    expectedSeconds: 70, representation: 'concrete', errorType: 'notion',
  };
}
function match(rand, prompt, pairs, [lt, rt], count = 4) {
  const ps = sample(rand, pairs, Math.min(count, pairs.length));
  const right = sample(rand, ps.map((p, i) => ({ id: `r${i}`, label: p[1] })), ps.length);
  return { type: 'match', prompt, leftTitle: lt, rightTitle: rt, left: ps.map((p, i) => ({ id: `l${i}`, label: p[0] })), right, pairs: Object.fromEntries(ps.map((p, i) => [`l${i}`, `r${i}`])),
    hints: ['Commence par les associations dont tu es sûr.'], solution: ps.map((p) => `${p[0]} ↔ ${p[1]}`).join(' ; '), expectedSeconds: 70, representation: 'visuelle', errorType: 'notion' };
}
const order = (prompt, steps, label, hint) => ({ type: 'order', prompt, orderLabel: label, items: steps.map((s, i) => ({ id: `s${i + 1}`, label: s })), hints: [hint], solution: steps.join(' → '), expectedSeconds: 60, representation: 'visuelle', errorType: 'notion' });

/* ------------------------------ Matériaux ------------------------------ */

const MATS = [['L’acier', 'metal'], ['L’aluminium', 'metal'], ['Le cuivre', 'metal'], ['Le laiton', 'metal', 'un alliage de cuivre et de zinc'],
  ['Le PVC', 'plastique'], ['Le polystyrène', 'plastique'], ['Le PET des bouteilles', 'plastique'], ['Le polyéthylène des sacs', 'plastique'],
  ['Le chêne', 'bois'], ['Le contreplaqué', 'bois', 'des feuilles de bois collées'], ['Le MDF', 'bois', 'des fibres de bois agglomérées'],
  ['Le verre', 'ceramique'], ['La porcelaine', 'ceramique'], ['La brique', 'ceramique'],
  ['La fibre de carbone', 'composite', 'des fibres noyées dans une résine'], ['Le béton armé', 'composite', 'du béton renforcé de barres d’acier'], ['La fibre de verre', 'composite']];
const MAT_Q = [
  ['Quel matériau conduit le mieux le courant électrique ?', 'le cuivre', ['le bois', 'le verre', 'le PVC'], 'Les métaux conduisent l’électricité ; le cuivre est utilisé dans les fils électriques.'],
  ['Pourquoi entoure-t-on les fils électriques de PVC ?', 'c’est un isolant électrique', ['c’est un conducteur', 'il rouille', 'il est magnétique'], 'Le plastique ne laisse pas passer le courant : il protège des électrocutions.'],
  ['Quel métal est léger et ne rouille pas, utilisé pour les canettes et les avions ?', 'l’aluminium', ['l’acier', 'le plomb', 'le fer'], 'L’aluminium est environ trois fois plus léger que l’acier et ne rouille pas.'],
  ['Quel matériau est attiré par un aimant ?', 'l’acier', ['l’aluminium', 'le cuivre', 'le verre'], 'L’acier contient du fer, attiré par les aimants : on s’en sert pour trier les déchets.'],
  ['Comment s’appelle la fabrication d’un objet couche par couche, à partir d’un fichier numérique ?', 'l’impression 3D (fabrication additive)', ['l’usinage', 'le moulage', 'le pliage'], 'L’imprimante 3D dépose la matière couche après couche ; l’usinage, lui, enlève de la matière.'],
  ['Quel procédé consiste à enlever de la matière avec un outil (fraise, foret) ?', 'l’usinage', ['le moulage', 'l’impression 3D', 'le collage'], 'Usiner, c’est retirer de la matière : perçage, fraisage, tournage.'],
  ['Quel est l’avantage principal d’un matériau composite comme la fibre de carbone ?', 'il est à la fois très léger et très résistant', ['il est toujours bon marché', 'il conduit bien l’électricité', 'il se recycle très facilement'], 'Les fibres apportent la résistance, la résine les maintient : vélos, raquettes, avions.'],
  ['Le bois est un matériau…', 'd’origine naturelle (végétale) et renouvelable', ['d’origine minérale', 'fabriqué à partir du pétrole', 'métallique'], 'Il provient des arbres ; une forêt bien gérée se renouvelle.'],
  ['La plupart des matières plastiques sont fabriquées à partir…', 'du pétrole', ['du sable', 'du bois', 'du minerai de fer'], 'Certains plastiques, dits biosourcés, sont fabriqués à partir de plantes.'],
  ['Le verre est fabriqué principalement à partir…', 'de sable (silice) fondu', ['de pétrole', 'de bois', 'de cuivre'], 'Le verre se recycle indéfiniment sans perdre ses qualités.'],
  ['Le moulage consiste à…', 'couler une matière liquide ou pâteuse dans un moule', ['enlever de la matière avec un outil', 'plier une tôle', 'assembler des pièces par des vis'], 'Les pièces en plastique sont souvent moulées par injection.'],
  ['L’acier est un alliage…', 'de fer et de carbone', ['de cuivre et de zinc', 'd’aluminium et de verre', 'de bois et de plastique'], 'L’acier inoxydable contient aussi du chrome, qui l’empêche de rouiller.'],
  ['Pourquoi trier les matériaux en fin de vie ?', 'pour les recycler et économiser les ressources', ['pour les rendre plus lourds', 'pour qu’ils polluent davantage', 'cela ne sert à rien'], 'Recycler l’aluminium demande environ 95 % d’énergie en moins que de le produire.'],
];
add({
  id: 'tc-materiaux', label: 'Les matériaux : familles, propriétés, procédés', skill: 'tc.materiaux',
  chapters: ['t5-ch-materiaux', 't4-ch-materiaux-procedes', 't4-ch-choisir', 'techno-c4-2024-theme-2'],
  description: 'Ranger les matériaux par famille, relier une propriété à un usage, reconnaître un procédé de fabrication.',
  make(rand) {
    if (rand() < 0.45) return categorize(rand, 'Range chaque matériau dans sa famille.', [['metal', 'Métaux'], ['plastique', 'Matières plastiques'], ['bois', 'Bois et dérivés'], ['ceramique', 'Céramiques et verres'], ['composite', 'Composites']], MATS, 6);
    return qcm(rand, pick(rand, MAT_Q));
  },
});

/* ------------------------------ Énergie ------------------------------ */

const SOURCES = [['Le Soleil', 'renouvelable'], ['Le vent', 'renouvelable'], ['L’eau d’un barrage', 'renouvelable'], ['La biomasse (bois, déchets végétaux)', 'renouvelable'], ['La géothermie (chaleur du sous-sol)', 'renouvelable'], ['Les marées', 'renouvelable'],
  ['Le pétrole', 'non', 'formé en des millions d’années'], ['Le charbon', 'non'], ['Le gaz naturel', 'non'], ['L’uranium des centrales nucléaires', 'non', 'un minerai en quantité limitée']];
const ENERGY_Q = [
  ['Un moteur électrique convertit l’énergie électrique principalement en énergie…', 'mécanique', ['lumineuse', 'chimique', 'nucléaire'], 'Le moteur fait tourner un axe : il produit un mouvement.'],
  ['Une pile ou une batterie stocke de l’énergie sous forme…', 'chimique', ['mécanique', 'lumineuse', 'thermique'], 'Des réactions chimiques dans la pile produisent le courant électrique.'],
  ['Un panneau photovoltaïque convertit l’énergie lumineuse en énergie…', 'électrique', ['chimique', 'mécanique', 'nucléaire'], 'Les cellules photovoltaïques produisent directement un courant électrique.'],
  ['Une éolienne convertit l’énergie du vent (cinétique) en énergie…', 'électrique', ['chimique', 'lumineuse', 'thermique'], 'Le vent fait tourner les pales, qui entraînent un générateur (alternateur).'],
  ['Dans la chaîne d’énergie d’un objet, la fonction « alimenter » est assurée par…', 'la pile, la batterie ou le secteur', ['le moteur', 'le capteur', 'le microcontrôleur'], 'Chaîne d’énergie : alimenter, distribuer, convertir, transmettre.'],
  ['Une lampe convertit principalement l’énergie électrique en énergie…', 'lumineuse (et un peu thermique)', ['chimique', 'nucléaire', 'mécanique'], 'Une lampe LED perd beaucoup moins d’énergie en chaleur qu’une ampoule à incandescence.'],
  ['L’énergie consommée par un appareil se calcule par…', 'E = P × t (puissance × durée)', ['E = P + t', 'E = P / t', 'E = t − P'], 'Un appareil de 1 000 W allumé 2 h consomme 2 kWh.'],
  ['Un appareil en veille…', 'consomme encore un peu d’électricité', ['ne consomme rien', 'produit de l’électricité', 'se recharge tout seul'], 'Éteindre complètement les appareils (multiprise à interrupteur) évite ce gaspillage.'],
  ['Dans une centrale hydroélectrique, l’énergie de l’eau fait tourner…', 'une turbine reliée à un alternateur', ['un panneau solaire', 'une pile', 'un moteur thermique'], 'L’alternateur convertit l’énergie mécanique en énergie électrique.'],
  ['Quelle source d’énergie est renouvelable ?', 'la géothermie', ['le charbon', 'le gaz naturel', 'le pétrole'], 'La chaleur du sous-sol se renouvelle à l’échelle humaine ; les énergies fossiles mettent des millions d’années à se former.'],
  ['Isoler les murs d’une maison permet…', 'de réduire les pertes de chaleur et la consommation de chauffage', ['d’augmenter la consommation', 'de produire de l’électricité', 'de rendre la maison plus lumineuse'], 'Le toit, les murs et les fenêtres sont les principales sources de pertes.'],
];
add({
  id: 'tc-energie', label: 'L’énergie : sources, formes, consommation', skill: 'tc.energie',
  chapters: ['t5-ch-energie', 't4-ch-chaines', 't4-ch-choisir', 'techno-c4-2024-theme-2'],
  description: 'Sources renouvelables ou non, conversions d’énergie, énergie consommée E = P × t.',
  make(rand, hard) {
    const k = pick(rand, ['sources', 'conso', 'qcm', 'qcm']);
    if (k === 'sources') return categorize(rand, 'Cette source d’énergie est-elle renouvelable ?', [['renouvelable', 'Renouvelable'], ['non', 'Non renouvelable (stock limité)']], SOURCES, 6);
    if (k === 'conso') {
      const [name, P] = pick(rand, [['Un radiateur électrique', 2000], ['Un four', 2500], ['Une bouilloire', 2000], ['Un téléviseur', 100], ['Un ordinateur portable', 50], ['Un aspirateur', 800], ['Une lampe LED', 10]]);
      const t = pick(rand, hard ? [0.5, 1.5, 2, 4, 6] : [1, 2, 3, 4, 5]); const E = roundTo((P * t) / 1000, 3);
      return numeric(E, { prompt: `${name} de ${P} W fonctionne pendant ${fr(t)} h. Quelle énergie consomme-t-il, en kWh ?`, unit: 'kWh', unitOptional: true,
        misconceptions: [mc(P * t, 'mc:kwh-wh', 'unite', `${P} W × ${fr(t)} h = ${fr(P * t)} Wh : il reste à convertir en kWh (÷ 1 000).`)], expectedSeconds: 60,
        hints: ['E = P × t ; avec P en kW et t en h, E est en kWh (1 kW = 1 000 W).'], solution: `E = ${fr(P / 1000)} kW × ${fr(t)} h = ${fr(E)} kWh`, representation: 'concrete' });
    }
    return qcm(rand, pick(rand, ENERGY_Q));
  },
});

/* ------------------------------ Chaîne d'information ------------------------------ */

const INFO = [['Un bouton poussoir', 'capteur'], ['Un capteur de température', 'capteur'], ['Un détecteur de mouvement', 'capteur'], ['Un microphone', 'capteur'], ['Un capteur de luminosité', 'capteur'], ['Un capteur à ultrasons (distance)', 'capteur'],
  ['Un moteur', 'actionneur'], ['Une LED', 'actionneur'], ['Un haut-parleur', 'actionneur'], ['Un vérin', 'actionneur'], ['Un buzzer', 'actionneur'],
  ['Un microcontrôleur', 'traiter', 'il exécute le programme'], ['Une carte programmable', 'traiter']];
const INFO_Q = [
  ['Dans la chaîne d’information, que fait un capteur ?', 'il acquiert une information (il mesure ou détecte)', ['il agit sur le monde extérieur', 'il stocke l’énergie', 'il affiche le programme'], 'Chaîne d’information : acquérir (capteurs), traiter (programme), communiquer (vers la chaîne d’énergie, un écran…).'],
  ['Le programme d’un robot est exécuté par…', 'le microcontrôleur', ['le capteur', 'le moteur', 'la batterie'], 'Le microcontrôleur traite les informations des capteurs et commande les actionneurs.'],
  ['Une porte automatique s’ouvre quand quelqu’un approche. Quel élément détecte la personne ?', 'un détecteur de présence (capteur)', ['le moteur', 'la batterie', 'le vérin'], 'Le capteur acquiert l’information « quelqu’un approche » ; le moteur ouvre ensuite la porte.'],
  ['Un capteur « tout ou rien » donne…', 'deux états seulement : 0 ou 1', ['une infinité de valeurs', 'toujours une température', 'une image'], 'Un interrupteur ou un détecteur de fin de course est soit activé, soit non : c’est une information logique.'],
  ['Un actionneur, dans un système automatisé,…', 'agit sur le monde extérieur (moteur, lampe, vérin)', ['mesure une grandeur', 'stocke le programme', 'fournit l’énergie'], 'Le capteur acquiert ; le microcontrôleur traite ; l’actionneur agit.'],
  ['Dans un programme, une boucle « répéter 4 fois » sert à…', 'exécuter plusieurs fois les mêmes instructions', ['arrêter le programme', 'tester une condition une seule fois', 'effacer une variable'], 'Pour dessiner un carré : répéter 4 fois « avancer, tourner de 90° ».'],
  ['« Si la luminosité est faible, alors allumer la lampe » est…', 'une instruction conditionnelle', ['une boucle', 'une variable', 'un capteur'], 'Si… alors… sinon : le programme choisit selon une condition.'],
  ['Une variable, dans un programme, sert à…', 'mémoriser une valeur qui peut changer (un score, une température)', ['allumer un moteur', 'mesurer une distance', 'relier deux ordinateurs'], 'On peut la lire, la modifier, la comparer.'],
  ['Un capteur de température donne une information…', 'analogique ou numérique, qui varie de façon continue', ['seulement 0 ou 1', 'toujours une image', 'uniquement sonore'], 'Il mesure une grandeur qui peut prendre de nombreuses valeurs, contrairement à un capteur tout ou rien.'],
  ['Un algorithme, c’est…', 'une suite ordonnée d’instructions pour résoudre un problème', ['un composant électronique', 'un type de capteur', 'une batterie'], 'Il peut ensuite être traduit en programme (Scratch, Python…).'],
];
add({
  id: 'tc-information', label: 'La chaîne d’information : capteurs, traitement, actionneurs', skill: 'tc.information',
  chapters: ['t5-ch-information', 't4-ch-chaines', 't4-ch-programmer', 'techno-c4-2024-theme-2'],
  description: 'Reconnaître capteurs, actionneurs et unité de traitement ; acquérir, traiter, communiquer.',
  make(rand) {
    if (rand() < 0.5) return categorize(rand, 'Range chaque composant : capte-t-il une information, la traite-t-il, ou agit-il ?', [['capteur', 'Capteur (acquérir)'], ['traiter', 'Traiter (programme)'], ['actionneur', 'Actionneur (agir)']], INFO, 6);
    return qcm(rand, pick(rand, INFO_Q));
  },
});

/* ------------------------------ Données, fichiers, réseaux ------------------------------ */

const FORMATS = [['photo.jpg', 'une image'], ['chanson.mp3', 'un son'], ['film.mp4', 'une vidéo'], ['notes.txt', 'du texte brut'], ['plan.pdf', 'un document à imprimer'], ['tableau.csv', 'un tableau de données'], ['logo.png', 'une image']];
const NET_Q = [
  ['Une adresse IPv4, comme 192.168.1.12, est formée de…', 'quatre nombres compris entre 0 et 255', ['quatre lettres', 'deux nombres', 'un nom de site'], 'Chaque nombre tient sur un octet (8 bits) : de 0 à 255.'],
  ['Dans un réseau, le serveur…', 'fournit un service (une page web, des fichiers) aux clients', ['ne fait que recevoir des pages', 'est forcément un téléphone', 'empêche les connexions'], 'Le client demande, le serveur répond.'],
  ['Quel appareil relie les ordinateurs d’un même réseau local ?', 'le commutateur (switch)', ['le serveur web', 'l’imprimante', 'le capteur'], 'Le switch relie les machines du réseau local ; le routeur relie des réseaux entre eux (la box, vers Internet).'],
  ['Le rôle du DNS est de…', 'traduire un nom de domaine en adresse IP', ['protéger des virus', 'compresser les fichiers', 'allumer les ordinateurs'], 'Quand on tape un nom de site, un serveur DNS donne l’adresse IP de la machine correspondante.'],
  ['À quoi sert le protocole HTTPS ?', 'à échanger des pages web de façon chiffrée', ['à envoyer des SMS', 'à imprimer', 'à recharger une batterie'], 'Le « S » signifie sécurisé : les échanges entre le navigateur et le serveur sont chiffrés.'],
  ['Un routeur (ou une box) sert à…', 'relier le réseau local à Internet et acheminer les données entre réseaux', ['imprimer des documents', 'stocker les mots de passe', 'refroidir les ordinateurs'], 'Le switch relie les machines d’un même réseau local ; le routeur relie des réseaux entre eux.'],
  ['Un octet est composé de…', '8 bits', ['2 bits', '10 bits', '1 000 bits'], 'Un bit vaut 0 ou 1 ; un octet peut donc prendre 256 valeurs.'],
  ['Quelle unité est la plus grande ?', 'le gigaoctet (Go)', ['le kilooctet (ko)', 'le mégaoctet (Mo)', 'l’octet'], 'Environ : 1 ko = 1 000 octets, 1 Mo = 1 000 ko, 1 Go = 1 000 Mo.'],
  ['Le « cloud », c’est…', 'le stockage de fichiers sur des serveurs distants, accessibles par Internet', ['un nuage de pluie', 'un câble réseau', 'un antivirus'], 'Les fichiers sont dans des centres de données, qui consomment de l’énergie.'],
  ['Une adresse MAC identifie…', 'la carte réseau d’un appareil', ['un site web', 'un mot de passe', 'un fichier'], 'L’adresse IP, elle, peut changer selon le réseau auquel on se connecte.'],
];
add({
  id: 'tc-donnees', label: 'Données, fichiers et réseaux', skill: 'tc.donnees',
  chapters: ['t5-ch-donnees', 't4-ch-donnees', 't4-ch-reseaux', 't5-ch-reseau', 'techno-c4-2024-pensee-informatique'],
  description: 'Bits et octets, taille d’un fichier, formats de fichiers, adresses IP, client et serveur.',
  make(rand, hard) {
    const k = pick(rand, hard ? ['bits', 'image', 'adresses', 'reseau'] : ['bits', 'formats', 'reseau', 'reseau', 'mo']);
    if (k === 'bits') { const o = ri(rand, 2, 16); return numeric(o * 8, { prompt: `Combien de bits y a-t-il dans ${o} octets ?`, misconceptions: [mc(o / 8, 'mc:bits-octets', 'notion', '1 octet = 8 bits : on multiplie.')].filter((m) => m.answer !== o * 8), expectedSeconds: 25, hints: ['1 octet = 8 bits.'], solution: `${o} × 8 = ${o * 8} bits`, representation: 'symbolique' }); }
    if (k === 'mo') { const n = pick(rand, [2, 5, 12, 50, 250]); return numeric(n * 1000, { prompt: `Un fichier fait ${n} Mo. Combien de kilo-octets (Ko) cela représente-t-il ? (1 Mo = 1 000 Ko.)`, unit: 'Ko', unitOptional: true, expectedSeconds: 25, hints: ['On passe d’une unité à la plus petite : on multiplie par 1 000.'], solution: `${n} × 1 000 = ${n * 1000} Ko`, representation: 'symbolique' }); }
    if (k === 'image') {
      const [w, hgt] = pick(rand, [[1000, 800], [2000, 1500], [1920, 1080], [4000, 3000]]); const size = roundTo((w * hgt * 3) / 1e6, 2);
      return numeric(size, { prompt: `Une photo non compressée mesure ${w} × ${hgt} pixels, chaque pixel étant codé sur 3 octets. Quelle est sa taille en Mo (1 Mo = 1 000 000 octets) ?`, unit: 'Mo', unitOptional: true, tolerance: 0.011,
        misconceptions: [mc(roundTo((w * hgt) / 1e6, 2), 'mc:octets-pixel', 'notion', 'Chaque pixel occupe 3 octets (rouge, vert, bleu) : on multiplie par 3.')], expectedSeconds: 75, difficulty: 3,
        hints: ['Nombre de pixels × 3 octets, puis conversion en Mo.'], solution: `${w} × ${hgt} × 3 = ${w * hgt * 3} octets ≈ ${fr(size)} Mo`, representation: 'concrete' });
    }
    if (k === 'adresses') { const b = pick(rand, [4, 8, 10, 16]); return numeric(2 ** b, { prompt: `Combien de valeurs différentes peut-on coder avec ${b} bits ?`, misconceptions: [mc(2 * b, 'mc:puissance-2', 'notion', `Chaque bit double le nombre de possibilités : 2 × 2 × … (${b} fois) = 2^${b}.`)], expectedSeconds: 40, hints: ['1 bit : 2 valeurs ; 2 bits : 4 valeurs ; 3 bits : 8…'], solution: `2^${b} = ${2 ** b}`, representation: 'symbolique' }); }
    if (k === 'formats') return match(rand, 'Associe chaque fichier à ce qu’il contient.', FORMATS.filter((f, i, a) => a.findIndex((x) => x[1] === f[1]) === i), ['Fichier', 'Contenu'], 4);
    return qcm(rand, pick(rand, NET_Q));
  },
});

/* ------------------------------ Numérique responsable ------------------------------ */

const RESP = [
  ['Lequel de ces mots de passe est le plus robuste ?', 'Lune7!Velo#Rouge', ['123456', 'motdepasse', 'Lucas2012'], 'Un mot de passe robuste est long et mélange majuscules, minuscules, chiffres et symboles, sans prénom ni date.'],
  ['Une image trouvée sur Internet peut-on la réutiliser librement dans un exposé publié en ligne ?', 'non, pas sans vérifier ses droits (auteur, licence)', ['oui, tout ce qui est sur Internet est libre', 'oui, si on la recadre', 'oui, si elle est jolie'], 'Les images sont protégées par le droit d’auteur ; certaines sont sous licence libre (Creative Commons) : il faut citer l’auteur.'],
  ['Un camarade est harcelé en ligne. Quel numéro national gratuit peut-on appeler ?', 'le 3018', ['le 15', 'le 17', 'le 112'], 'Le 3018 est le numéro national contre le harcèlement et les violences numériques, gratuit et anonyme.'],
  ['Un message dit : « Votre compte est bloqué, cliquez ici et donnez votre mot de passe ». C’est sans doute…', 'une tentative d’hameçonnage (phishing)', ['un message officiel', 'une bonne affaire', 'une mise à jour normale'], 'Aucun service sérieux ne demande un mot de passe par message : on ne clique pas, on prévient un adulte.'],
  ['Quelle étape de la vie d’un smartphone pèse le plus sur l’environnement ?', 'sa fabrication', ['sa recharge', 'son transport jusqu’au magasin', 'l’envoi de SMS'], 'Extraire les métaux et fabriquer les composants représente la plus grande part de son empreinte : le garder longtemps est le meilleur geste.'],
  ['Publier la photo d’un ami sans son accord…', 'n’est pas permis : chacun a droit à son image', ['est permis si la photo est réussie', 'est permis sur les réseaux sociaux', 'est obligatoire pour les anniversaires'], 'Le droit à l’image impose de demander l’accord de la personne photographiée.'],
  ['Une licence Creative Commons « BY » oblige à…', 'citer l’auteur de l’œuvre', ['payer l’auteur', 'ne jamais partager l’œuvre', 'modifier l’œuvre'], 'BY = attribution : on peut réutiliser l’œuvre à condition de citer son auteur.'],
  ['Pourquoi faire des mises à jour de son ordinateur ou de son téléphone ?', 'elles corrigent souvent des failles de sécurité', ['elles effacent toujours les photos', 'elles ralentissent forcément l’appareil', 'elles ne servent à rien'], 'Un appareil à jour est mieux protégé contre les attaques.'],
  ['La double authentification, c’est…', 'confirmer sa connexion par un deuxième moyen (un code reçu, une application)', ['avoir deux mots de passe identiques', 'prêter son compte à un ami', 'se connecter deux fois de suite'], 'Même si le mot de passe est volé, le compte reste protégé.'],
  ['Pour réduire l’impact environnemental du numérique, le plus efficace est…', 'de garder ses appareils plus longtemps et de les faire réparer', ['de changer de téléphone chaque année', 'de laisser les appareils allumés', 'de regarder les vidéos en plus haute définition'], 'L’essentiel de l’impact vient de la fabrication des appareils.'],
  ['Avant de croire une information virale, on vérifie…', 'la source, la date et si d’autres médias fiables la confirment', ['seulement le nombre de « j’aime »', 'la couleur de l’image', 'qui l’a partagée en premier'], 'Une image peut aussi être sortie de son contexte ou retouchée.'],
  ['Sur un réseau social, régler son profil en « privé » permet…', 'de choisir qui voit ses publications', ['de devenir invisible des services de police', 'de supprimer définitivement ses données', 'd’effacer les publications des autres'], 'Ce qui est publié peut tout de même être copié ou partagé.'],
  ['Un « cookie » accepté sur un site peut servir à…', 'mémoriser des préférences ou suivre la navigation pour la publicité', ['réparer l’ordinateur', 'accélérer la connexion', 'recharger la batterie'], 'On peut refuser les cookies non indispensables.'],
  ['Le « droit à l’oubli » permet de demander…', 'l’effacement ou le déréférencement de données personnelles', ['un nouveau téléphone', 'un mot de passe plus court', 'la fermeture d’un site entier'], 'Il est prévu par le RGPD, le règlement européen sur les données personnelles.'],
  ['Une pièce jointe inattendue, reçue d’un inconnu, peut…', 'contenir un logiciel malveillant', ['réparer l’ordinateur', 'accélérer Internet', 'protéger le mot de passe'], 'On ne l’ouvre pas : on la supprime ou on la signale.'],
  ['Faire réparer ou acheter reconditionné un téléphone plutôt que neuf…', 'réduit les déchets et l’extraction de métaux', ['consomme plus que d’en fabriquer un neuf', 'n’a aucun effet', 'est interdit en France'], 'La fabrication est l’étape qui pèse le plus sur l’environnement.'],
  ['L’empreinte numérique, c’est…', 'l’ensemble des traces que l’on laisse en ligne', ['la marque du doigt sur l’écran', 'la taille d’un fichier', 'le prix d’un forfait'], 'Messages, photos, commentaires, recherches : elles peuvent rester longtemps.'],
];
add({
  id: 'tc-numerique-responsable', label: 'Usages responsables du numérique', skill: 'tc.numerique-responsable',
  chapters: ['t5-ch-numerique-responsable', 't4-ch-numerique-responsable', 'techno-c4-2024-theme-1'],
  description: 'Mots de passe, hameçonnage, droit d’auteur et droit à l’image, cyberharcèlement (3018), impact environnemental.',
  make(rand) { return qcm(rand, pick(rand, RESP)); },
  facts: true,
});

/* ------------------------------ Analyser un objet, son évolution ------------------------------ */

const ANALYSE_Q = [
  ['Le besoin auquel répond un parapluie est…', 'se protéger de la pluie', ['avoir une toile en nylon', 'se plier en trois', 'avoir un manche courbé'], 'Le besoin dit à quoi sert l’objet ; la toile et le mécanisme pliant sont des solutions techniques.'],
  ['Dans un cahier des charges, « l’objet doit fonctionner sur batterie pendant 8 h » est…', 'une contrainte (un critère à respecter)', ['le besoin', 'une solution technique', 'un matériau'], 'Le cahier des charges précise les fonctions et les contraintes, avec des critères mesurables.'],
  ['Pour une trottinette, « les roues en polyuréthane » sont…', 'une solution technique', ['le besoin', 'une contrainte', 'une fonction d’usage'], 'La fonction est de rouler sans bruit et sans glisser ; les roues en polyuréthane sont une solution choisie pour cela.'],
  ['Une famille d’objets techniques regroupe des objets qui…', 'répondent au même besoin', ['ont la même couleur', 'coûtent le même prix', 'ont été inventés la même année'], 'Exemple : tous les objets pour s’éclairer (bougie, lampe à pétrole, ampoule, LED).'],
  ['Pourquoi l’ampoule LED a-t-elle remplacé l’ampoule à incandescence ?', 'elle consomme beaucoup moins d’énergie pour éclairer autant', ['elle est plus lourde', 'elle chauffe davantage', 'elle était plus ancienne'], 'L’incandescence perd l’essentiel de son énergie en chaleur ; la LED est bien plus efficace.'],
  ['Le cycle de vie d’un objet comprend…', 'l’extraction des matières, la fabrication, le transport, l’utilisation et la fin de vie', ['seulement son utilisation', 'seulement sa fabrication', 'seulement son prix'], 'Chaque étape a un impact sur l’environnement.'],
  ['Pour une lampe de bureau, « éclairer le plan de travail » est…', 'la fonction d’usage', ['une contrainte de prix', 'une solution technique', 'un matériau'], 'La fonction d’usage dit à quoi sert l’objet pour l’utilisateur.'],
  ['Un prototype est…', 'un premier exemplaire, fabriqué pour tester une solution', ['l’objet vendu en magasin', 'le dessin du logo', 'un mode d’emploi'], 'On le teste par rapport au cahier des charges avant la fabrication en série.'],
  ['L’écoconception d’un objet vise à…', 'réduire ses impacts sur l’environnement dès sa conception', ['le rendre plus lourd', 'augmenter sa consommation', 'le rendre impossible à réparer'], 'Matériaux recyclables, pièces démontables, faible consommation…'],
  ['Un objet facile à réparer…', 'dure plus longtemps et produit moins de déchets', ['coûte toujours plus cher à utiliser', 'est forcément démodé', 'ne peut pas être recyclé'], 'L’indice de réparabilité est affiché sur certains appareils depuis 2021.'],
];
const LINEES = [
  ['Range ces objets pour s’éclairer, du plus ancien au plus récent.', ['La bougie', 'La lampe à pétrole', 'L’ampoule à incandescence', 'La lampe LED']],
  ['Range ces téléphones, du plus ancien au plus récent.', ['Le téléphone à manivelle', 'Le téléphone à cadran', 'Le téléphone portable à touches', 'Le smartphone']],
  ['Range ces supports de musique, du plus ancien au plus récent.', ['Le disque vinyle', 'La cassette audio', 'Le CD', 'Le fichier MP3']],
];
add({
  id: 'tc-analyse', label: 'Analyser un objet technique et son évolution', skill: 'tc.analyse',
  chapters: ['t5-ch-analyse', 't5-ch-evolution', 't4-ch-evolution', 't4-ch-contraintes', 'techno-c4-2024-theme-1', 'techno-c4-2024-theme-3'],
  description: 'Besoin, fonction, contrainte, solution technique ; familles et lignées d’objets.',
  make(rand) {
    if (rand() < 0.3) { const [p, steps] = pick(rand, LINEES); return order(p, steps, 'du plus ancien au plus récent', 'Pense aux objets de tes grands-parents, puis aux tiens.'); }
    return qcm(rand, pick(rand, ANALYSE_Q));
  },
});

/* ------------------------------ Programmation ------------------------------ */

const IND = '    ';
add({
  id: 'tc-programmation', label: 'Programmer : boucles, variables, conditions', skill: 'tc.programmation',
  chapters: ['t5-ch-programmation', 't4-ch-programmer', 't4-ch-chaines', 'techno-c4-2024-pensee-informatique'],
  description: 'Prévoir l’effet d’un programme par blocs : boucle « répéter », variable compteur, condition, tracé de polygones.',
  make(rand) {
    const k = pick(rand, ['compteur', 'polygone', 'angle', 'condition', 'qcm']);
    if (k === 'compteur') {
      const a = ri(rand, 0, 5); const n = ri(rand, 3, 8); const s = ri(rand, 2, 5);
      return numeric(a + n * s, { prompt: `Que vaut la variable score à la fin ?\nmettre score à ${a}\nrépéter ${n} fois\n${IND}ajouter ${s} à score`, misconceptions: [mc(n * s, 'mc:valeur-initiale', 'notion', `score commence à ${a}, pas à 0.`)].filter((m) => m.answer !== a + n * s), expectedSeconds: 40,
        hints: ['Note la valeur de score avant la boucle, puis ajoute à chaque tour.'], solution: `${a} + ${n} × ${s} = ${a + n * s}`, representation: 'symbolique' });
    }
    if (k === 'polygone') {
      const [n, name] = pick(rand, [[3, 'un triangle équilatéral'], [4, 'un carré'], [5, 'un pentagone régulier'], [6, 'un hexagone régulier'], [8, 'un octogone régulier']]);
      const others = ['un triangle équilatéral', 'un carré', 'un pentagone régulier', 'un hexagone régulier', 'un octogone régulier', 'un cercle'].filter((x) => x !== name);
      return qcm(rand, [`Quelle figure trace ce programme ?\nrépéter ${n} fois\n${IND}avancer de 100\n${IND}tourner de ${360 / n} degrés`, name, others, `${n} côtés égaux et ${n} rotations de ${360 / n}° : un tour complet (${n} × ${360 / n} = 360°), c’est ${name}.`]);
    }
    if (k === 'angle') {
      const n = pick(rand, [3, 4, 5, 6, 8, 9, 10, 12]);
      return numeric(360 / n, { prompt: `Pour tracer un polygone régulier à ${n} côtés avec « répéter ${n} fois [avancer, tourner] », de combien de degrés faut-il tourner à chaque fois ?`, unit: '°', unitOptional: true,
        misconceptions: [mc(180 - 360 / n, 'mc:angle-interieur', 'notion', 'Le lutin tourne de l’angle EXTÉRIEUR : la somme des rotations fait un tour complet, 360°.')].filter((m) => m.answer !== 360 / n), expectedSeconds: 45,
        hints: ['Après tous les côtés, le lutin a fait exactement un tour complet.'], solution: `360° ÷ ${n} = ${fr(360 / n)}°`, representation: 'symbolique' });
    }
    if (k === 'condition') {
      const t = ri(rand, 10, 30); const seuil = ri(rand, 15, 25);
      return qcm(rand, [`Une serre automatique suit ce programme :\nsi température > ${seuil} alors\n${IND}ouvrir la fenêtre\nsinon\n${IND}fermer la fenêtre\nLe capteur mesure ${t} °C. Que fait le système ?`, t > seuil ? 'il ouvre la fenêtre' : 'il ferme la fenêtre', [t > seuil ? 'il ferme la fenêtre' : 'il ouvre la fenêtre', 'il ne fait rien', 'il éteint le capteur'],
        `${t} ${t > seuil ? '>' : '≤'} ${seuil} : la condition est ${t > seuil ? 'vraie' : 'fausse'}, on exécute ${t > seuil ? 'le bloc « alors »' : 'le bloc « sinon »'}.`]);
    }
    return qcm(rand, pick(rand, [
      ['À quoi sert une variable dans un programme ?', 'à garder en mémoire une valeur qui peut changer', ['à dessiner une figure', 'à alimenter le robot', 'à mesurer la température'], 'Exemple : une variable « score » augmente à chaque point marqué.'],
      ['Un algorithme, c’est…', 'une suite d’instructions pour résoudre un problème', ['un composant électronique', 'un type de capteur', 'un langage étranger'], 'On peut l’écrire en langage naturel avant de le programmer (blocs, Python…).'],
      ['Un événement comme « quand le bouton est pressé » sert à…', 'déclencher une partie du programme', ['arrêter définitivement le robot', 'mesurer une distance', 'stocker un fichier'], 'La programmation événementielle réagit aux actions de l’utilisateur ou aux capteurs.'],
    ]));
  },
});

/* ------------------------------ Projet, dépannage, mesures ------------------------------ */

const PROJET = ['Analyser le besoin et rédiger le cahier des charges', 'Imaginer des solutions et en choisir une', 'Modéliser l’objet (croquis, logiciel de CAO)', 'Fabriquer et assembler le prototype', 'Tester et valider par rapport au cahier des charges'];
const DEPANNE = ['Constater la panne et la décrire', 'Faire des hypothèses sur sa cause', 'Tester chaque hypothèse (mesures, observations)', 'Remplacer ou réparer l’élément défectueux', 'Vérifier que l’objet fonctionne à nouveau'];
const MESURE = [['Une tension électrique', 'un voltmètre (multimètre)'], ['Une intensité électrique', 'un ampèremètre (multimètre)'], ['Une longueur au dixième de millimètre', 'un pied à coulisse'], ['Une masse', 'une balance'], ['Une température', 'un thermomètre'], ['Une durée', 'un chronomètre']];
add({
  id: 'tc-projet', label: 'Projet, dépannage et mesures', skill: 'tc.projet',
  chapters: ['t5-ch-projet', 't5-ch-reparer', 't5-ch-valider', 't4-ch-projet', 't4-ch-reparer', 't4-ch-valider', 'techno-c4-2024-theme-3'],
  description: 'Les étapes d’un projet et d’un dépannage, choisir l’instrument de mesure, valider un prototype.',
  make(rand) {
    const k = pick(rand, ['projet', 'depanne', 'mesure', 'qcm']);
    if (k === 'projet') return order('Range les étapes d’un projet technique.', PROJET, 'de la première à la dernière', 'On commence par comprendre ce que l’objet doit faire.');
    if (k === 'depanne') return order('Range les étapes d’un dépannage.', DEPANNE, 'de la première à la dernière', 'Avant de réparer, il faut savoir ce qui ne marche pas.');
    if (k === 'mesure') return match(rand, 'Associe chaque grandeur à l’instrument qui la mesure.', MESURE, ['Grandeur', 'Instrument'], 4);
    return qcm(rand, pick(rand, [
      ['Une lampe de poche ne s’allume plus. Que vérifier en premier ?', 'les piles', ['la couleur du boîtier', 'le poids de la lampe', 'la marque'], 'On teste d’abord l’hypothèse la plus probable et la plus simple : l’alimentation.'],
      ['Valider un prototype, c’est…', 'vérifier par des tests qu’il respecte le cahier des charges', ['le peindre', 'le vendre', 'le démonter'], 'On mesure ses performances et on les compare aux critères du cahier des charges.'],
      ['Le cahier des charges demande une autonomie d’au moins 6 h ; le test donne 5 h 30. Le prototype…', 'n’est pas validé sur ce critère', ['est validé', 'est validé si les autres critères sont bons', 'n’a pas besoin d’être testé'], '5 h 30 < 6 h : le critère n’est pas atteint, il faut améliorer la solution.'],
    ]));
  },
});

export const COLLEGE_TECHNO = GEN;
export const COLLEGE_TECHNO_SKILLS = [
  ['tc.materiaux', 'Les matériaux : familles, propriétés, procédés de fabrication'],
  ['tc.energie', 'L’énergie : sources, formes, conversions, consommation'],
  ['tc.information', 'La chaîne d’information : capteurs, traitement, actionneurs'],
  ['tc.donnees', 'Données, fichiers et réseaux'],
  ['tc.numerique-responsable', 'Usages responsables du numérique'],
  ['tc.analyse', 'Analyser un objet technique et son évolution'],
  ['tc.programmation', 'Programmer : boucles, variables, conditions'],
  ['tc.projet', 'Projet, dépannage, mesures et validation'],
].map(([id, label]) => ({ subject: 'techno', id, label, level: '5e', track: 'classe', status: 'programme', domain: 'college', prereqs: [], editorialLevel: true }));
