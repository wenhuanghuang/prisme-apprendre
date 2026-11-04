/**
 * SES, NSI et SNT au lycée : générateurs rattachés aux chapitres (larges) des parcours de référence ses-*, nsi-* et
 * snt-2nde. Calculs économiques (taux de variation, indices, taux de chômage, valeur ajoutée, élasticité), notions
 * de sociologie et d'économie ; binaire, hexadécimal, lecture de programmes, structures de données, SQL ; les sept
 * thèmes de SNT.
 */
import { pick, sample, ri, numeric, text, mc, fr, roundTo } from './gen-util.js';
import { qcm } from './primaire-savoirs.js';

const GEN = [];
function add(g) {
  const { make, ...rest } = g;
  GEN.push({ tracks: ['classe', 'approfondissement'], options: [], ...rest, make(rand, o = {}, tier = 'classe') { return make(rand, tier !== 'classe'); } });
}
const num = (answer, o) => numeric(answer, { representation: 'concrete', expectedSeconds: 60, ...o });
const IND = '\u00a0\u00a0\u00a0\u00a0';

/* ------------------------------ SES ------------------------------ */

const SES_CH = ['ses-2nde-2019-econ', 'ses-2nde-2019-regards-croises', 'ses-spe-1re-tle-2019-1re-econ', 'ses-spe-1re-tle-2019-1re-regards', 'ses-spe-1re-tle-2019-tle-econ', 'ses-spe-1re-tle-2019-tle-regards'];
add({
  id: 'ses-calculs', subject: 'ses', levels: ['2nde', '1re', 'tle'], label: 'SES : calculs économiques', skill: 'ses.l.calculs', chapters: SES_CH,
  description: 'Taux de variation, coefficient multiplicateur, indice base 100, taux de chômage, valeur ajoutée, élasticité-prix.',
  make(rand, hard) {
    const k = pick(rand, hard ? ['taux', 'indice', 'chomage', 'va', 'elasticite'] : ['taux', 'indice', 'chomage', 'va']);
    if (k === 'taux') {
      const v0 = pick(rand, [200, 400, 500, 800, 1000, 1250]); const t = pick(rand, [-20, -10, -5, 5, 10, 15, 25, 40]); const v1 = (v0 * (100 + t)) / 100;
      return num(t, { prompt: `Le PIB d’un pays passe de ${v0} à ${fr(v1)} milliards d’euros. Quel est son taux de variation, en % ?`, unit: '%', unitOptional: true,
        misconceptions: [mc(roundTo(v1 - v0, 2), 'mc:variation-absolue', 'notion', 'La variation absolue (en milliards) n’est pas le taux : on divise par la valeur de départ.')].filter((m) => m.answer !== t), hints: ['Taux de variation = (valeur d’arrivée − valeur de départ) / valeur de départ × 100.'], solution: `(${fr(v1)} − ${v0}) / ${v0} × 100 = ${t} %` });
    }
    if (k === 'indice') {
      const I = pick(rand, [80, 92, 105, 112, 125, 150, 200]);
      return num(I - 100, { prompt: `Le prix d’un produit vaut l’indice ${I} en 2024 (base 100 en 2015). De combien de pourcents a-t-il varié entre 2015 et 2024 ? (Négatif pour une baisse.)`, unit: '%', unitOptional: true,
        misconceptions: [mc(I, 'mc:indice-taux', 'notion', `Un indice ${I} signifie une variation de ${I - 100} % par rapport à la base 100.`)], hints: ['Variation en % = indice − 100.'], solution: `${I} − 100 = ${I - 100} %` });
    }
    if (k === 'chomage') {
      const pa = pick(rand, [30, 32, 25, 40]); const c = pick(rand, [1.5, 2.4, 3, 2, 3.2]); const t = roundTo((c / pa) * 100, 1);
      return num(t, { prompt: `Un pays compte ${fr(c)} millions de chômeurs et une population active de ${pa} millions de personnes. Quel est le taux de chômage, en % (arrondi au dixième) ?`, unit: '%', unitOptional: true, tolerance: 0.051,
        misconceptions: [mc(roundTo((c / (pa + c)) * 100, 1), 'mc:actifs-chomeurs', 'notion', 'Les chômeurs font partie de la population active : on divise par la population active, pas par actifs + chômeurs.')].filter((m) => Math.abs(m.answer - t) > 0.06), hints: ['Taux de chômage = chômeurs / population active × 100.'], solution: `${fr(c)} / ${pa} × 100 ≈ ${fr(t)} %` });
    }
    if (k === 'va') {
      const P = pick(rand, [500, 800, 1200, 2000]); const CI = pick(rand, [200, 300, 450, 600].filter((x) => x < P));
      return num(P - CI, { prompt: `Une entreprise réalise une production de ${P} 000 € et achète pour ${CI} 000 € de consommations intermédiaires (matières premières, énergie…). Quelle est sa valeur ajoutée, en milliers d’euros ?`, unit: 'k€', unitOptional: true,
        misconceptions: [mc(P + CI, 'mc:va-somme', 'notion', 'Valeur ajoutée = production − consommations intermédiaires : la richesse réellement créée.')], hints: ['VA = production − consommations intermédiaires.'], solution: `${P} − ${CI} = ${P - CI} milliers d’euros` });
    }
    const dp = pick(rand, [10, 20, 5]); const e = pick(rand, [-0.5, -1, -1.5, -2]); const dq = e * dp;
    return num(e, { prompt: `Le prix d’un bien augmente de ${dp} % et la quantité demandée baisse de ${fr(-dq)} %. Quelle est l’élasticité-prix de la demande ?`, tolerance: 1e-9,
      misconceptions: [mc(-e, 'mc:elasticite-signe', 'signe', 'La quantité baisse quand le prix augmente : l’élasticité-prix de la demande est négative.')], hints: ['e = (variation en % de la quantité) / (variation en % du prix).'], solution: `e = ${fr(dq)} / ${dp} = ${fr(e)}` });
  },
});

const SES_Q = [
  ['La socialisation primaire se déroule principalement…', 'pendant l’enfance, dans la famille et à l’école', ['au travail, à l’âge adulte', 'uniquement à l’université', 'à la retraite'], 'La socialisation secondaire prolonge ensuite la première : travail, couple, associations…'],
  ['Le PIB mesure…', 'la richesse produite sur un territoire pendant une année', ['le patrimoine des ménages', 'le bonheur des habitants', 'la quantité de monnaie en circulation'], 'Il additionne les valeurs ajoutées ; il ne mesure ni les inégalités ni les dégâts environnementaux.'],
  ['L’inflation, c’est…', 'une hausse durable et générale des prix', ['une baisse des salaires', 'la hausse d’un seul prix', 'une augmentation du chômage'], 'Elle réduit le pouvoir d’achat de la monnaie.'],
  ['Selon le Bureau international du travail, un chômeur est une personne qui…', 'est sans emploi, disponible et cherche activement un emploi', ['ne travaille pas, quelle qu’en soit la raison', 'est étudiante', 'est à la retraite'], 'Les trois critères doivent être réunis.'],
  ['Une externalité négative, c’est…', 'un effet nuisible d’une activité sur des tiers, sans compensation', ['un bénéfice pour l’entreprise', 'une taxe', 'une exportation'], 'Exemple : la pollution d’une usine supportée par les riverains.'],
  ['Quelle institution fixe les taux directeurs dans la zone euro ?', 'la Banque centrale européenne', ['le Parlement européen', 'chaque banque commerciale', 'l’ONU'], 'La BCE mène la politique monétaire ; sa mission première est la stabilité des prix.'],
  ['Sur un marché concurrentiel, si le prix est au-dessus du prix d’équilibre,…', 'l’offre dépasse la demande', ['la demande dépasse l’offre', 'il n’y a plus de vendeurs', 'le prix monte encore'], 'Il y a des invendus, ce qui pousse le prix à la baisse.'],
  ['L’abstention électorale, c’est…', 'le fait de ne pas voter alors qu’on est inscrit', ['voter blanc', 'voter pour un petit parti', 'être candidat'], 'Elle est une forme de (non-)participation politique étudiée en science politique.'],
  ['La mobilité sociale intergénérationnelle compare…', 'la position sociale des enfants à celle de leurs parents', ['les salaires de deux pays', 'deux emplois d’une même personne', 'les prix d’une année à l’autre'], 'On l’étudie avec des tables de mobilité.'],
  ['Le libre-échange, c’est…', 'des échanges internationaux sans obstacles (droits de douane, quotas)', ['la gratuité des produits', 'la fermeture des frontières', 'le troc'], 'Le protectionnisme, à l’inverse, protège la production nationale.'],
  ['Le taux de chômage est le rapport entre…', 'le nombre de chômeurs et la population active', ['le nombre de chômeurs et la population totale', 'le nombre d’emplois et le nombre d’entreprises', 'les salaires et les prix'], 'Population active = actifs occupés + chômeurs.'],
  ['Un bien public, en économie, est un bien…', 'non rival et non excluable, comme l’éclairage public', ['vendu uniquement par l’État', 'toujours gratuit à produire', 'réservé aux fonctionnaires'], 'Non rival : l’usage de l’un ne réduit pas celui des autres ; non excluable : on ne peut empêcher personne d’en profiter.'],
  ['La productivité du travail mesure…', 'la quantité produite par travailleur ou par heure de travail', ['le nombre de salariés', 'le bénéfice de l’entreprise', 'la durée des congés'], 'Ses gains sont une source essentielle de la croissance économique.'],
  ['Aujourd’hui, la monnaie est principalement créée par…', 'les banques commerciales, lorsqu’elles accordent des crédits', ['l’impression de billets', 'les ménages', 'le ministère de l’Économie'], '« Les crédits font les dépôts » ; la banque centrale encadre ce processus.'],
  ['Une politique budgétaire de relance consiste à…', 'augmenter les dépenses publiques ou baisser les impôts pour soutenir l’activité', ['augmenter les taux d’intérêt', 'fermer les frontières', 'réduire la quantité de monnaie'], 'Elle peut creuser le déficit public.'],
  ['Le capital social, au sens de Bourdieu, désigne…', 'le réseau de relations qu’un individu peut mobiliser', ['l’argent apporté par les actionnaires', 'les diplômes obtenus', 'les machines d’une usine'], 'Bourdieu distingue capital économique, capital culturel et capital social.'],
  ['La déviance, en sociologie, désigne…', 'la transgression d’une norme sociale', ['un comportement forcément illégal', 'un trouble médical', 'une maladie contagieuse'], 'Toute déviance n’est pas délinquance : la délinquance transgresse une norme pénale.'],
  ['Le coefficient de Gini mesure…', 'les inégalités de répartition des revenus ou du patrimoine', ['la croissance du PIB', 'le taux de chômage', 'l’inflation'], 'Il va de 0 (égalité parfaite) à 1 (inégalité maximale).'],
  ['La balance commerciale d’un pays est excédentaire quand…', 'ses exportations dépassent ses importations', ['ses importations dépassent ses exportations', 'son PIB baisse', 'sa population augmente'], 'Celle des biens de la France est déficitaire depuis les années 2000.'],
  ['Selon la théorie des avantages comparatifs de Ricardo, chaque pays a intérêt à…', 'se spécialiser là où il est relativement le plus efficace, puis échanger', ['tout produire lui-même', 'n’exporter que des matières premières', 'fermer ses frontières'], 'Même un pays moins efficace en tout gagne à l’échange (1817).'],
  ['Un mouvement social est…', 'une action collective organisée pour défendre une cause ou transformer la société', ['un déménagement', 'une décision de justice', 'un remaniement ministériel'], 'Exemples : mouvement ouvrier, mouvement féministe, mouvement écologiste.'],
];
add({
  id: 'ses-notions', subject: 'ses', levels: ['2nde', '1re', 'tle'], label: 'SES : notions d’économie, de sociologie et de science politique', skill: 'ses.l.notions',
  chapters: ['ses-2nde-2019-econ', 'ses-2nde-2019-socio-science-po', 'ses-spe-1re-tle-2019-1re-econ', 'ses-spe-1re-tle-2019-1re-socio', 'ses-spe-1re-tle-2019-tle-econ', 'ses-spe-1re-tle-2019-tle-socio'],
  description: 'Socialisation, PIB, inflation, chômage, externalités, banque centrale, marché, abstention, mobilité sociale, libre-échange.',
  facts: true,
  make(rand) { return qcm(rand, pick(rand, SES_Q)); },
});

/* ------------------------------ NSI ------------------------------ */

const NSI_CH = ['nsi-spe-1re-tle-2019-concepts', 'nsi-spe-1re-tle-2019-1re', 'nsi-spe-1re-tle-2019-tle'];
add({
  id: 'nsi-representation', subject: 'nsi', levels: ['1re', 'tle'], label: 'NSI : représenter les données (binaire, hexadécimal, texte)', skill: 'nsi.l.representation', chapters: NSI_CH,
  description: 'Conversions décimal ↔ binaire ↔ hexadécimal, nombre de valeurs codables, code ASCII.',
  make(rand) {
    const k = pick(rand, ['vers-binaire', 'depuis-binaire', 'hexa', 'valeurs', 'ascii']);
    if (k === 'vers-binaire') { const n = ri(rand, 5, 255); const b = n.toString(2); return text([b, b.padStart(8, '0')], { prompt: `Écris le nombre ${n} en binaire.`, expectedSeconds: 60, representation: 'symbolique', hints: ['Divise par 2 successivement et lis les restes de bas en haut, ou décompose en puissances de 2 (128, 64, 32, 16, 8, 4, 2, 1).'], solution: `${n} = ${b} en binaire` }); }
    if (k === 'depuis-binaire') { const n = ri(rand, 5, 255); const b = n.toString(2); return num(n, { prompt: `Quelle est la valeur décimale du nombre binaire ${b} ?`, representation: 'symbolique', hints: ['Chaque chiffre 1 vaut une puissance de 2, de droite à gauche : 1, 2, 4, 8, 16…'], solution: `${b.split('').map((d, i) => (d === '1' ? 2 ** (b.length - 1 - i) : null)).filter((x) => x !== null).join(' + ')} = ${n}` }); }
    if (k === 'hexa') { const n = ri(rand, 16, 255); const h = n.toString(16).toUpperCase(); return text([h, h.toLowerCase(), `0x${h}`, `0x${h.toLowerCase()}`], { prompt: `Écris le nombre ${n} en hexadécimal (base 16).`, expectedSeconds: 60, representation: 'symbolique', hints: ['16 × chiffre des « seizaines » + chiffre des unités ; A = 10, B = 11, … F = 15.'], solution: `${n} = ${Math.floor(n / 16)} × 16 + ${n % 16} = ${h} en hexadécimal` }); }
    if (k === 'valeurs') { const b = pick(rand, [4, 8, 10, 16]); return num(2 ** b, { prompt: `Combien d’entiers naturels différents peut-on coder sur ${b} bits ?`, representation: 'symbolique', misconceptions: [mc(2 ** b - 1, 'mc:valeur-max', 'notion', `On code de 0 à ${2 ** b - 1} : cela fait ${2 ** b} valeurs.`)], hints: ['n bits permettent 2ⁿ valeurs différentes.'], solution: `2^${b} = ${2 ** b} valeurs (de 0 à ${2 ** b - 1})` }); }
    const ch = pick(rand, ['A', 'B', 'C', 'Z', 'a']); const code = ch.charCodeAt(0);
    return num(code, { prompt: `En ASCII, la lettre « A » a pour code 65 et les lettres se suivent dans l’ordre de l’alphabet (« a » vaut 97). Quel est le code de « ${ch} » ?`, representation: 'symbolique', hints: ['Compte le décalage depuis « A » (ou depuis « a » pour les minuscules).'], solution: `« ${ch} » : ${code}` });
  },
});

const NSI_Q = [
  ['Une pile (structure de données) fonctionne selon le principe…', 'dernier entré, premier sorti (LIFO)', ['premier entré, premier sorti (FIFO)', 'aléatoire', 'du plus petit au plus grand'], 'Comme une pile d’assiettes ; une file fonctionne en FIFO, comme une file d’attente.'],
  ['Le tri par sélection d’une liste de n éléments a un coût…', 'quadratique (de l’ordre de n²)', ['constant', 'logarithmique', 'linéaire'], 'Pour chaque position, on cherche le minimum dans le reste de la liste.'],
  ['La recherche dichotomique dans une liste triée…', 'divise par deux la zone de recherche à chaque étape', ['parcourt tous les éléments un par un', 'ne fonctionne que sur des listes non triées', 'trie la liste'], 'Son coût est logarithmique : environ log₂(n) comparaisons.'],
  ['En SQL, quelle instruction permet de lire des données d’une table ?', 'SELECT', ['INSERT', 'DELETE', 'UPDATE'], 'SELECT … FROM … WHERE … sélectionne des lignes et des colonnes.'],
  ['Dans un arbre binaire, chaque nœud a…', 'au plus deux enfants', ['exactement trois enfants', 'un seul parent et aucun enfant', 'autant d’enfants qu’on veut'], 'Un fils gauche, un fils droit, ou aucun (feuille).'],
  ['Une fonction récursive est une fonction qui…', 's’appelle elle-même, avec un cas de base pour s’arrêter', ['ne renvoie rien', 'utilise forcément une boucle while', 'est écrite en SQL'], 'Exemple : factorielle(n) = n × factorielle(n − 1), avec factorielle(0) = 1.'],
  ['Le protocole TCP/IP sert à…', 'acheminer des paquets de données sur un réseau', ['afficher des pages web en couleurs', 'compresser les images', 'chiffrer les mots de passe uniquement'], 'Les données sont découpées en paquets, routés jusqu’à destination puis réassemblés.'],
  ['Un dictionnaire Python associe…', 'des clés à des valeurs', ['des indices numériques seulement', 'des fonctions à des fichiers', 'des listes à des tuples'], 'd = dict(nom="Ada", age=36) ; d["nom"] vaut "Ada".'],
  ['Une file (structure de données) fonctionne selon le principe…', 'premier entré, premier sorti (FIFO)', ['dernier entré, premier sorti (LIFO)', 'aléatoire', 'du plus grand au plus petit'], 'Comme une file d’attente : on ajoute à la fin, on retire au début.'],
  ['Le tri par insertion d’une liste déjà triée a un coût…', 'linéaire (de l’ordre de n)', ['quadratique (de l’ordre de n²)', 'exponentiel', 'nul'], 'Chaque élément est déjà à sa place : une comparaison suffit pour chacun.'],
  ['En SQL, la clé primaire d’une table…', 'identifie chaque ligne de façon unique', ['peut être identique pour deux lignes', 'est toujours un texte', 'sert à trier les colonnes'], 'Une clé étrangère fait référence à la clé primaire d’une autre table.'],
  ['En Python, que vaut len([4, 8, 15, 16]) ?', '4', ['16', '43', '3'], 'len renvoie le nombre d’éléments de la liste.'],
  ['En Python, si L = [5, 3, 9], que vaut L[0] ?', '5', ['3', '9', 'une erreur'], 'Les indices commencent à 0 : L[0] est le premier élément.'],
  ['La porte logique ET (AND) renvoie 1…', 'seulement si ses deux entrées valent 1', ['si au moins une entrée vaut 1', 'si les deux entrées valent 0', 'toujours'], 'OU (OR) renvoie 1 si au moins une entrée vaut 1 ; NON (NOT) inverse l’entrée.'],
  ['Un algorithme glouton…', 'fait à chaque étape le choix qui semble le meilleur sur le moment', ['essaie toutes les possibilités', 'ne fait aucun choix', 'trie toujours la liste d’abord'], 'Exemple : rendre la monnaie avec la plus grosse pièce possible ; ce n’est pas toujours optimal.'],
  ['Le système d’exploitation d’un ordinateur…', 'gère le matériel, les fichiers et l’exécution des programmes', ['est un logiciel de traitement de texte', 'est une partie de l’écran', 'n’existe que sur les téléphones'], 'Exemples : Linux, Windows, macOS, Android.'],
  ['Le DNS sert à…', 'traduire un nom de domaine en adresse IP', ['compresser une vidéo', 'protéger contre les virus', 'mesurer le débit du réseau'], 'Le nom exemple.fr est ainsi associé à une adresse IP numérique.'],
  ['Le parcours en largeur d’un graphe utilise…', 'une file', ['une pile', 'un tri par sélection', 'aucune structure'], 'Le parcours en profondeur utilise une pile, ou la récursivité.'],
];
add({
  id: 'nsi-algo', subject: 'nsi', levels: ['1re', 'tle'], label: 'NSI : programmes, algorithmes et structures de données', skill: 'nsi.l.algo', chapters: NSI_CH,
  description: 'Prévoir le résultat d’un programme Python, coût des algorithmes, piles et files, arbres, récursivité, SQL, réseaux.',
  make(rand) {
    const k = pick(rand, ['dict', 'boucle', 'qcm', 'qcm']);
    if (k === 'dict') {
      const ages = { Ada: ri(rand, 10, 40), Linus: ri(rand, 10, 40), Grace: ri(rand, 10, 40) }; const who = pick(rand, Object.keys(ages));
      return num(ages[who] + 1, { prompt: `Qu’affiche ce programme ?\nages = dict(Ada=${ages.Ada}, Linus=${ages.Linus}, Grace=${ages.Grace})\nages["${who}"] = ages["${who}"] + 1\nprint(ages["${who}"])`, representation: 'symbolique', hints: ['On lit la valeur associée à la clé, on lui ajoute 1, puis on l’affiche.'], solution: `${ages[who]} + 1 = ${ages[who] + 1}` });
    }
    if (k === 'boucle') {
      const L = sample(rand, [3, 7, 2, 9, 4, 6, 1, 8], 5);
      const m = Math.max(...L);
      return num(m, { prompt: `Qu’affiche ce programme ?\nL = [${L.join(', ')}]\nm = L[0]\nfor x in L:\n${IND}if x > m:\n${IND}${IND}m = x\nprint(m)`, representation: 'symbolique', misconceptions: [mc(L[L.length - 1], 'mc:dernier-element', 'notion', 'm n’est remplacé que par une valeur plus grande : à la fin, m est le maximum.')].filter((x) => x.answer !== m), hints: ['Suis la valeur de m à chaque tour.'], solution: `m garde la plus grande valeur rencontrée : ${m}.` });
    }
    return qcm(rand, pick(rand, NSI_Q));
  },
});

const SNT_Q = [
  ['Pour se localiser, un récepteur GPS a besoin des signaux d’au moins…', '4 satellites', ['1 satellite', '2 satellites', '30 satellites'], 'Trois satellites pour la position, un quatrième pour corriger l’horloge du récepteur.'],
  ['Une URL, c’est…', 'l’adresse d’une ressource sur le Web', ['un virus', 'un réseau social', 'un format d’image'], 'Exemple : https://www.exemple.fr/page.html.'],
  ['Le Web et Internet, c’est…', 'différent : le Web est un service qui utilise le réseau Internet', ['exactement la même chose', 'deux réseaux sans lien', 'deux noms de navigateurs'], 'Internet est le réseau ; le Web, les courriels, les jeux en ligne sont des services qui l’utilisent.'],
  ['Dans une photo numérique, un pixel en couleur est souvent codé par…', 'trois valeurs (rouge, vert, bleu) de 0 à 255', ['une seule lettre', 'un mot de passe', 'une date'], 'Chaque composante tient sur un octet : 256 nuances par couleur.'],
  ['Les métadonnées EXIF d’une photo peuvent contenir…', 'la date, l’appareil et parfois la position GPS de la prise de vue', ['le mot de passe du téléphone', 'le nom de tes amis', 'le prix de la photo'], 'Mieux vaut les vérifier avant de publier une photo prise chez soi.'],
  ['Un fichier CSV contient…', 'des données structurées en lignes et en colonnes, séparées par des virgules ou des points-virgules', ['une vidéo', 'un son', 'un programme exécutable'], 'C’est un format simple pour échanger des tables de données.'],
  ['Dans un réseau social, le « graphe » représente…', 'les personnes (sommets) et leurs liens (arêtes)', ['les couleurs du site', 'les publicités', 'la vitesse de connexion'], 'On peut y calculer des distances, des centres, des communautés.'],
  ['Un système informatique embarqué, c’est par exemple…', 'le calculateur d’une voiture ou d’un robot aspirateur', ['un livre papier', 'une lampe à huile', 'une calculatrice mécanique'], 'Capteurs, programme et actionneurs intégrés dans un objet.'],
  ['Une adresse IP (version 4) est formée de…', 'quatre nombres de 0 à 255 séparés par des points', ['dix lettres', 'un seul chiffre', 'le nom de l’ordinateur'], 'Exemple : 192.168.1.10 ; les adresses IPv6 sont plus longues.'],
  ['Le langage HTML sert à…', 'décrire la structure et le contenu d’une page web', ['choisir seulement les couleurs', 'stocker des mots de passe', 'compresser les images'], 'Le CSS, lui, décrit la mise en forme : couleurs, polices, disposition.'],
  ['Par rapport à HTTP, le protocole HTTPS…', 'chiffre les échanges entre le navigateur et le serveur', ['est réservé aux vidéos', 'interdit les images', 'n’utilise pas Internet'], 'Le cadenas de la barre d’adresse signale une connexion chiffrée.'],
  ['Un moteur de recherche classe les pages…', 'à l’aide d’algorithmes : pertinence, popularité, liens…', ['au hasard', 'par ordre alphabétique', 'par date de création uniquement'], 'Les résultats peuvent aussi dépendre de l’utilisateur et de la publicité.'],
  ['Un cookie, sur le Web, est…', 'un petit fichier déposé par un site pour mémoriser des informations', ['un virus', 'un câble réseau', 'un antivirus'], 'Le RGPD impose de demander le consentement pour les cookies non indispensables.'],
  ['La « bulle de filtre » désigne…', 'le fait de ne voir que des contenus proches de ses goûts, choisis par les algorithmes', ['une protection antivirus', 'un réseau Wi-Fi', 'un filtre photo'], 'Elle peut enfermer dans un seul point de vue.'],
  ['La définition d’une image numérique, c’est…', 'son nombre de pixels (largeur × hauteur)', ['sa taille en centimètres', 'son nombre de couleurs', 'sa date de prise de vue'], 'Exemple : 4 000 × 3 000 pixels = 12 mégapixels.'],
  ['Une image de 1 000 × 1 000 pixels en couleurs (RVB), sans compression, occupe environ…', '3 millions d’octets (3 Mo)', ['1 000 octets', '3 000 octets', '1 milliard d’octets'], 'Chaque pixel utilise 3 octets : rouge, vert, bleu.'],
  ['Pour calculer un itinéraire, une application de cartographie utilise…', 'un graphe des routes et un algorithme de plus court chemin', ['une boussole', 'seulement la météo', 'les photos des utilisateurs'], 'Les sommets sont les carrefours, les arêtes les tronçons, pondérés par la distance ou la durée.'],
  ['Le système européen de localisation par satellites s’appelle…', 'Galileo', ['GPS', 'Apollo', 'Ariane'], 'GPS est américain, GLONASS russe, BeiDou chinois.'],
  ['Dans un réseau social, deux personnes prises au hasard sont reliées en moyenne par…', 'une courte chaîne de quelques intermédiaires', ['des milliers d’intermédiaires', 'aucun lien possible', 'exactement une personne'], 'C’est l’effet « petit monde » (expérience de Milgram, 1967 : environ six intermédiaires).'],
];
add({
  id: 'snt-themes', subject: 'snt', levels: ['2nde'], label: 'SNT : les sept thèmes', skill: 'snt.l.themes', chapters: ['snt-2nde-2019-themes'],
  description: 'Internet, Web, réseaux sociaux, données structurées, localisation, informatique embarquée, photographie numérique.',
  facts: true,
  make(rand) { return qcm(rand, pick(rand, SNT_Q)); },
});

export const LYCEE_SES_NSI = GEN;
export const LYCEE_SES_NSI_SKILLS = [
  ['ses', 'ses.l.calculs', '2nde', 'SES : calculs économiques (taux, indices, chômage, valeur ajoutée, élasticité)'],
  ['ses', 'ses.l.notions', '2nde', 'SES : notions d’économie, de sociologie et de science politique'],
  ['nsi', 'nsi.l.representation', '1re', 'NSI : représentation des données'], ['nsi', 'nsi.l.algo', '1re', 'NSI : programmes, algorithmes, structures de données'],
  ['snt', 'snt.l.themes', '2nde', 'SNT : les sept thèmes'],
].map(([subject, id, level, label]) => ({ subject, id, label, level, track: 'classe', status: 'programme', domain: 'lycee', prereqs: [], editorialLevel: true }));
