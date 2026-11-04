/**
 * Mot mystère : retrouver un mot lettre à lettre grâce à un indice (une devinette en français, la traduction d'un mot
 * d'anglais ou d'espagnol). Chaque lettre absente éteint l'une des sept couleurs de l'arc-en-ciel ; une lettre peut
 * aussi être révélée, au prix d'une couleur. Les accents ne se devinent pas à part : « E » dévoile é, è, ê, ë.
 * Moteur pur : pas de DOM, pas de stockage.
 */

export const RAYS = 7;
export const RAINBOW = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#3949ab', '#8e24aa'];

/** Lettre de base (A à Z) d'un caractère, ou null pour une espace, un tiret, une apostrophe. */
export function baseLetter(ch) {
  const c = String(ch || '').toLowerCase();
  if (c === 'œ') return 'O';
  if (c === 'æ') return 'A';
  const b = c.normalize('NFD').replace(/[̀-ͯ]/g, '');
  return /^[a-z]$/.test(b) ? b.toUpperCase() : null;
}

/** Un mot jouable : 3 à 16 lettres, seulement des lettres, espaces, tirets, apostrophes. */
export function playable(word) {
  const w = String(word || '').trim();
  if (!w || w.length > 18 || !/^[\p{L}' ’-]+$/u.test(w)) return false;
  const letters = [...w].filter((c) => baseLetter(c)).length;
  return letters >= 3 && letters <= 16;
}

export function newWord({ word, clue, lang = 'fr-FR', extra = '' }) {
  return { word: String(word).trim(), clue, lang, extra, guessed: [], wrong: [], rays: RAYS, revealed: 0 };
}

const letters = (w) => [...w.word].map(baseLetter).filter(Boolean);
export const isSolved = (w) => letters(w).every((l) => w.guessed.includes(l));
export const isLost = (w) => w.rays <= 0 && !isSolved(w);
export const isFinished = (w) => isSolved(w) || isLost(w);

/** Le mot, caractère par caractère : { ch, letter, shown }. */
export const maskOf = (w) => [...w.word].map((ch) => { const l = baseLetter(ch); return { ch, letter: l, shown: !l || w.guessed.includes(l) || isLost(w) }; });

/** Propose une lettre. Renvoie 'hit', 'miss', 'repeat' ou 'ignore'. */
export function guess(w, letter) {
  const l = baseLetter(letter);
  if (!l || isFinished(w)) return 'ignore';
  if (w.guessed.includes(l) || w.wrong.includes(l)) return 'repeat';
  if (letters(w).includes(l)) { w.guessed.push(l); return 'hit'; }
  w.wrong.push(l); w.rays--;
  return 'miss';
}

/** Révèle une lettre cachée au prix d'une couleur (impossible s'il n'en reste qu'une). */
export function revealOne(w, rand = Math.random) {
  if (isFinished(w) || w.rays <= 1) return null;
  const hidden = [...new Set(letters(w).filter((l) => !w.guessed.includes(l)))];
  if (!hidden.length) return null;
  const l = hidden[Math.floor(rand() * hidden.length)];
  w.guessed.push(l); w.rays--; w.revealed++;
  return l;
}

/** Choisit `count` entrées jouables, sans doublon (ni de mot ni d'indice). */
export function pickWords(entries, count, rand = Math.random) {
  const a = (entries || []).filter((e) => e && playable(e.word) && e.clue);
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  const out = []; const seen = new Set();
  for (const e of a) {
    const k = e.word.toLowerCase();
    if (seen.has(k) || seen.has(`clue:${e.clue}`)) continue;
    seen.add(k); seen.add(`clue:${e.clue}`); out.push(e);
    if (out.length >= count) break;
  }
  return out;
}

/** Étoiles d'une série : 3 si tous les mots sont trouvés avec peu d'erreurs, 2 si presque tous, 1 sinon. */
export function seriesStars(results) {
  const found = results.filter((r) => r.found).length;
  const misses = results.reduce((s, r) => s + r.misses, 0);
  if (found === results.length && misses <= results.length) return 3;
  return found >= results.length - 1 ? 2 : 1;
}

/** Forme à deviner d'un mot de vocabulaire : de préférence sans article ni espace. */
export function vocabAnswer(accepted) {
  const list = (Array.isArray(accepted) ? accepted : [accepted]).map((x) => String(x || '').trim()).filter(Boolean);
  return list.find((x) => !/\s/.test(x)) || list[0] || '';
}

/* ------------------------------ Devinettes en français ------------------------------ */

export const MOTS_FR = {
  facile: [
    ['chat', 'Un animal qui miaule.'], ['lune', 'Elle brille dans le ciel, la nuit.'], ['vélo', 'On pédale pour le faire avancer.'],
    ['pomme', 'Un fruit rouge, jaune ou vert qui pousse sur un arbre.'], ['école', 'Le lieu où l’on apprend à lire et à écrire.'], ['livre', 'On le lit en tournant ses pages.'],
    ['maison', 'On y habite avec sa famille.'], ['soleil', 'Il nous éclaire et nous chauffe, le jour.'], ['poisson', 'Il vit dans l’eau et nage avec ses nageoires.'],
    ['table', 'On mange ou on écrit dessus.'], ['lapin', 'Un animal aux longues oreilles qui aime les carottes.'], ['fleur', 'Elle pousse au jardin et sent souvent bon.'],
    ['train', 'Il roule sur des rails.'], ['pluie', 'De l’eau qui tombe des nuages.'], ['neige', 'Des flocons blancs qui tombent quand il fait très froid.'],
    ['chien', 'Un animal qui aboie.'], ['gâteau', 'On en mange un, avec des bougies, à son anniversaire.'], ['arbre', 'Il a un tronc, des branches et des feuilles.'],
    ['étoile', 'Elle brille dans le ciel de la nuit, très loin.'], ['crayon', 'On s’en sert pour écrire ou dessiner.'], ['jardin', 'On y fait pousser des fleurs et des légumes.'],
    ['tortue', 'Un animal lent qui porte une carapace.'], ['souris', 'Un petit animal qui a peur du chat.'], ['bateau', 'Il flotte et navigue sur l’eau.'],
    ['cheval', 'Un grand animal que l’on peut monter ; il hennit.'], ['vache', 'Elle donne du lait et fait « meuh ».'], ['oiseau', 'Il a des plumes et des ailes.'],
    ['lion', 'Le roi des animaux, à la grande crinière.'], ['banane', 'Un fruit jaune et courbé.'], ['ballon', 'On joue avec lui au football.'], ['pain', 'Le boulanger le fait cuire chaque matin.'], ['nuage', 'Il flotte dans le ciel et peut apporter la pluie.'], ['clé', 'Elle sert à ouvrir une porte.'], ['loup', 'Un animal sauvage qui hurle à la lune.'], ['canard', 'Un oiseau qui nage et fait « coin-coin ».'], ['fraise', 'Un petit fruit rouge couvert de petits grains.'], ['tomate', 'Un fruit rouge que l’on mange souvent en salade.'], ['main', 'Elle a cinq doigts.'], ['ours', 'Un gros animal qui aime le miel.'], ['abeille', 'Un insecte qui fabrique le miel.'], ['avion', 'Il vole dans le ciel et transporte des passagers.'], ['piano', 'Un instrument de musique à touches noires et blanches.'],
  ],
  moyen: [
    ['bibliothèque', 'Un lieu où l’on emprunte des livres.'], ['dictionnaire', 'Un livre qui donne le sens des mots, rangés dans l’ordre alphabétique.'],
    ['papillon', 'Un insecte aux ailes colorées, qui a d’abord été une chenille.'], ['montagne', 'Un relief très élevé, parfois couvert de neige.'],
    ['tonnerre', 'Le bruit qui accompagne l’éclair pendant l’orage.'], ['grenouille', 'Un amphibien vert qui saute et coasse.'],
    ['parapluie', 'On l’ouvre pour se protéger de la pluie.'], ['ordinateur', 'Une machine pour écrire, calculer, jouer ou aller sur Internet.'],
    ['hélicoptère', 'Un appareil à hélices qui peut rester immobile dans les airs.'], ['château', 'Une grande demeure fortifiée, où vivaient les seigneurs.'],
    ['squelette', 'L’ensemble des os du corps.'], ['volcan', 'Une montagne qui peut cracher de la lave.'],
    ['dauphin', 'Un mammifère marin très intelligent qui saute hors de l’eau.'], ['planète', 'La Terre, Mars et Jupiter en sont.'],
    ['thermomètre', 'Un instrument qui mesure la température.'], ['boussole', 'Un instrument dont l’aiguille indique le nord.'],
    ['citrouille', 'Un gros légume orange que l’on creuse pour Halloween.'], ['escargot', 'Un petit animal lent qui porte sa coquille sur son dos.'],
    ['forêt', 'Un grand espace couvert d’arbres.'], ['musée', 'On y admire des tableaux, des sculptures ou des objets anciens.'],
    ['océan', 'Une immense étendue d’eau salée.'], ['cerveau', 'L’organe qui nous permet de penser.'],
    ['chocolat', 'Une gourmandise fabriquée avec du cacao.'], ['pyramide', 'Un monument de l’Égypte ancienne, aux faces triangulaires.'], ['vacances', 'Des jours sans école.'],
    ['crocodile', 'Un grand reptile aux mâchoires puissantes, qui vit près des fleuves.'], ['kangourou', 'Un animal d’Australie qui porte son petit dans une poche.'], ['tempête', 'Un vent très violent, souvent accompagné de pluie.'], ['araignée', 'Elle tisse une toile pour attraper des insectes.'], ['télescope', 'Un instrument pour observer les étoiles et les planètes.'], ['désert', 'Une région très sèche, où il pleut très rarement.'], ['champignon', 'Il pousse dans les bois après la pluie ; certains sont dangereux.'], ['microscope', 'Un instrument qui permet de voir des choses minuscules.'], ['écureuil', 'Un petit animal roux à la queue touffue, qui aime les noisettes.'], ['girafe', 'L’animal au plus long cou.'], ['moustique', 'Un petit insecte qui pique, surtout le soir.'], ['marmotte', 'Un animal des montagnes qui dort tout l’hiver.'], ['fromage', 'On le fabrique avec du lait ; il en existe des centaines de sortes en France.'], ['calendrier', 'Il présente les jours, les semaines et les mois de l’année.'], ['astronaute', 'Une personne qui voyage dans l’espace.'], ['récréation', 'La pause dans la cour, entre deux temps de classe.'], ['trompette', 'Un instrument à vent, en cuivre, avec trois pistons.'], ['cascade', 'Une chute d’eau.'], ['anniversaire', 'Le jour où l’on fête sa naissance, chaque année.'],
  ],
  difficile: [
    ['accueil', 'L’action de recevoir quelqu’un, et l’endroit où l’on est reçu.'], ['rythme', 'La cadence régulière d’une musique ou d’un mouvement.'],
    ['parallèle', 'Se dit de deux droites qui ne se coupent jamais.'], ['hypothèse', 'Une supposition que l’on cherche à vérifier.'],
    ['symétrie', 'Une figure qui se superpose à elle-même par pliage en a un axe.'], ['atmosphère', 'La couche d’air qui entoure la Terre.'],
    ['labyrinthe', 'Un réseau de chemins compliqués où l’on se perd facilement.'], ['orthographe', 'La façon correcte d’écrire les mots.'],
    ['chrysanthème', 'Une fleur d’automne, souvent déposée sur les tombes à la Toussaint.'], ['démocratie', 'Un régime où le pouvoir appartient au peuple.'],
    ['photosynthèse', 'Grâce à elle, les plantes fabriquent leur matière avec la lumière.'], ['archipel', 'Un groupe d’îles proches les unes des autres.'],
    ['mammifère', 'Un animal qui allaite ses petits.'], ['amphithéâtre', 'Une grande salle en gradins, ou un monument antique de spectacle.'],
    ['bicyclette', 'Un autre nom du vélo.'], ['chorégraphie', 'L’art de composer les pas d’une danse.'], ['millénaire', 'Une période de mille ans.'],
    ['psychologie', 'L’étude des pensées, des émotions et des comportements.'], ['vaccin', 'Il prépare le système immunitaire à se défendre contre une maladie.'],
    ['électricité', 'Elle circule dans les fils et fait fonctionner les appareils.'], ['géographie', 'La matière qui étudie la Terre, ses paysages et ses habitants.'],
    ['théorème', 'Une propriété démontrée, comme celle de Pythagore.'], ['personnage', 'Un être imaginaire qui agit dans un récit.'],
    ['pharmacie', 'La boutique où l’on achète des médicaments.'], ['exception', 'Un cas qui ne suit pas la règle.'],
    ['acquérir', 'Obtenir, devenir propriétaire de quelque chose.'], ['apparaître', 'Se montrer, devenir visible.'], ['dilemme', 'Une situation où il faut choisir entre deux solutions aussi difficiles l’une que l’autre.'], ['catastrophe', 'Un événement désastreux.'], ['enthousiasme', 'Une grande joie, un vif intérêt pour quelque chose.'], ['phénomène', 'Un fait que l’on peut observer, parfois étonnant.'], ['patrimoine', 'Les biens et l’héritage culturel transmis d’une génération à l’autre.'], ['hémisphère', 'Chacune des deux moitiés de la Terre, de part et d’autre de l’équateur.'], ['bibliographie', 'La liste des livres et des sources utilisés pour un travail.'], ['omniprésent', 'Qui est présent partout.'], ['hiéroglyphe', 'Un signe de l’écriture de l’Égypte ancienne.'], ['rhinocéros', 'Un gros animal d’Afrique ou d’Asie qui porte une ou deux cornes sur le nez.'], ['néanmoins', 'Un mot qui signifie « pourtant », « cependant ».'], ['quotidien', 'Qui revient chaque jour ; c’est aussi un journal publié chaque jour.'],
  ],
};

/** Niveau des devinettes en français pour une classe. */
export const frTier = (level) => (['cp', 'ce1'].includes(level) ? 'facile' : ['ce2', 'cm1', 'cm2'].includes(level) ? 'moyen' : 'difficile');
export const frEntries = (level) => MOTS_FR[frTier(level)].map(([word, clue]) => ({ word, clue, lang: 'fr-FR' }));
