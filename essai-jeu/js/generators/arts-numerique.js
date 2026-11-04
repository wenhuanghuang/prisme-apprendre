/**
 * Éducation musicale, arts plastiques, IA et numérique : familles d'instruments, compositeurs et œuvres, vocabulaire
 * musical ; artistes, œuvres et mouvements, vocabulaire des arts plastiques ; bases de l'intelligence artificielle et
 * compétences numériques. Rattachés aux chapitres des parcours de référence et, en 5e et 4e, aux chapitres rédigés.
 */
import { pick, sample } from './gen-util.js';
import { qcm } from './primaire-savoirs.js';

const PRIM_COL = ['cp', 'ce1', 'ce2', 'cm1', 'cm2', '6e', '5e', '4e', '3e'];
const GEN = [];
function add(g) {
  const { make, ...rest } = g;
  GEN.push({ tracks: ['classe', 'approfondissement'], options: [], ...rest, make(rand, o = {}, tier = 'classe') { return make(rand, tier !== 'classe'); } });
}
function categorize(rand, prompt, categories, items, count = 6) {
  let pk = [];
  for (let k = 0; k < 30; k++) { pk = sample(rand, items, Math.min(count, items.length)); if (new Set(pk.map((i) => i[1])).size >= 2) break; }
  return { type: 'categorize', prompt, categories: categories.map(([id, label]) => ({ id, label })), items: pk.map(([label, category], i) => ({ id: `i${i}`, label, category })),
    hints: ['Pense à la façon dont on produit le son : frotter, pincer, frapper, souffler.'], solution: pk.map(([l, c]) => `${l} → ${categories.find((x) => x[0] === c)[1]}`).join(' ; '), expectedSeconds: 70, representation: 'concrete', errorType: 'notion' };
}
function match(rand, prompt, pairs, [lt, rt], count = 4) {
  const ps = sample(rand, pairs, Math.min(count, pairs.length));
  const right = sample(rand, ps.map((p, i) => ({ id: `r${i}`, label: p[1] })), ps.length);
  return { type: 'match', prompt, leftTitle: lt, rightTitle: rt, left: ps.map((p, i) => ({ id: `l${i}`, label: p[0] })), right, pairs: Object.fromEntries(ps.map((p, i) => [`l${i}`, `r${i}`])),
    hints: ['Commence par les associations dont tu es sûr.'], solution: ps.map((p) => `${p[0]} ↔ ${p[1]}`).join(' ; '), expectedSeconds: 70, representation: 'visuelle', errorType: 'notion' };
}

/* ------------------------------ Musique ------------------------------ */

const INSTR = [['Le violon', 'frottees'], ['Le violoncelle', 'frottees'], ['La contrebasse', 'frottees'], ['La guitare', 'pincees'], ['La harpe', 'pincees'], ['Le piano', 'frappees', 'des marteaux frappent les cordes'],
  ['La flûte traversière', 'bois', 'elle appartient aux bois, même en métal'], ['La clarinette', 'bois'], ['Le hautbois', 'bois'], ['Le saxophone', 'bois', 'il a une anche : c’est un bois, même s’il est en métal'],
  ['La trompette', 'cuivres'], ['Le trombone', 'cuivres'], ['Le cor', 'cuivres'], ['Le tuba', 'cuivres'],
  ['La batterie', 'percussions'], ['Le xylophone', 'percussions'], ['Les timbales', 'percussions'], ['Le triangle', 'percussions']];
add({
  id: 'mus-instruments', subject: 'musique', levels: PRIM_COL, label: 'Musique : les familles d’instruments', skill: 'mus.instruments',
  chapters: ['musique-2020-champs', 'musique-2020-domaines', 'mus5-ch-timbre', 'mus4-ch-orchestre'],
  description: 'Cordes frottées, pincées, frappées, bois, cuivres, percussions : ranger les instruments de l’orchestre.',
  make(rand) {
    return categorize(rand, 'Range chaque instrument dans sa famille.', [['frottees', 'Cordes frottées'], ['pincees', 'Cordes pincées'], ['frappees', 'Cordes frappées'], ['bois', 'Bois'], ['cuivres', 'Cuivres'], ['percussions', 'Percussions']], INSTR, 6);
  },
});

const OEUVRES_MUS = [['Antonio Vivaldi', 'Les Quatre Saisons'], ['Wolfgang Amadeus Mozart', 'La Flûte enchantée'], ['Ludwig van Beethoven', 'La Neuvième Symphonie (« Hymne à la joie »)'],
  ['Maurice Ravel', 'Boléro'], ['Camille Saint-Saëns', 'Le Carnaval des animaux'], ['Sergueï Prokofiev', 'Pierre et le Loup'], ['Georges Bizet', 'Carmen'], ['Piotr Ilitch Tchaïkovski', 'Casse-Noisette'],
  ['Jean-Sébastien Bach', 'Les Concertos brandebourgeois'], ['Claude Debussy', 'Clair de lune']];
const VOCAB_MUS = [
  ['« Piano », sur une partition, indique de jouer…', 'doucement', ['fort', 'vite', 'au piano seulement'], 'Piano (p) = doux ; forte (f) = fort ; pianissimo (pp) = très doux.'],
  ['Un crescendo, c’est…', 'une augmentation progressive de l’intensité', ['un ralentissement', 'un silence', 'une note très aiguë'], 'Le contraire est le decrescendo (ou diminuendo).'],
  ['Le tempo, c’est…', 'la vitesse d’exécution d’un morceau', ['le volume sonore', 'la hauteur des notes', 'le nom du chef d’orchestre'], 'Il se mesure en pulsations par minute (battements par minute).'],
  ['Un ostinato est…', 'un motif répété obstinément tout au long d’un passage', ['un instrument à vent', 'un chant à une seule voix', 'une note tenue très longtemps'], 'Le Boléro de Ravel repose sur un ostinato rythmique de caisse claire.'],
  ['Le timbre d’un son permet…', 'de reconnaître l’instrument ou la voix qui le produit', ['de savoir s’il est fort ou doux', 'de connaître sa durée', 'de mesurer sa vitesse'], 'Deux instruments jouant la même note au même volume n’ont pas le même timbre.'],
  ['Un canon, c’est…', 'un chant où les voix entrent l’une après l’autre avec la même mélodie', ['une chanson sans paroles', 'un instrument de percussion', 'un morceau très rapide'], 'Exemple : « Frère Jacques ».'],
  ['Vivaldi et Bach sont des compositeurs de la période…', 'baroque (XVIIe-XVIIIe siècle)', ['romantique', 'contemporaine', 'médiévale'], 'Mozart appartient à la période classique ; Chopin à la période romantique.'],
];
add({
  id: 'mus-oeuvres', subject: 'musique', levels: PRIM_COL, label: 'Musique : compositeurs, œuvres et vocabulaire', skill: 'mus.oeuvres',
  chapters: ['musique-2020-champs', 'musique-2020-domaines', 'mus5-ch-styles', 'mus5-ch-audition', 'mus5-ch-rythme', 'mus5-ch-dynamique', 'mus5-ch-forme', 'mus4-ch-societe', 'mus4-ch-rythme', 'mus4-ch-interpretation', 'mus4-ch-forme'],
  description: 'Associer des œuvres célèbres à leur compositeur ; nuances, tempo, timbre, ostinato, canon, périodes.',
  make(rand) {
    if (rand() < 0.45) return match(rand, 'Associe chaque compositeur à l’une de ses œuvres.', OEUVRES_MUS, ['Compositeur', 'Œuvre'], 4);
    return qcm(rand, pick(rand, VOCAB_MUS));
  },
});

/* ------------------------------ Arts plastiques ------------------------------ */

const ARTISTES = [['Léonard de Vinci', 'La Joconde'], ['Claude Monet', 'Impression, soleil levant'], ['Vincent van Gogh', 'La Nuit étoilée'], ['Pablo Picasso', 'Guernica'],
  ['Salvador Dalí', 'La Persistance de la mémoire (les montres molles)'], ['Henri Matisse', 'La Danse'], ['Marcel Duchamp', 'Fontaine (un urinoir exposé comme œuvre, 1917)'],
  ['Andy Warhol', 'Les portraits sérigraphiés de Marilyn Monroe'], ['Edvard Munch', 'Le Cri'], ['Johannes Vermeer', 'La Jeune Fille à la perle']];
const VOCAB_ARTS = [
  ['Claude Monet est l’un des fondateurs du mouvement…', 'impressionniste', ['cubiste', 'surréaliste', 'pop art'], 'Son tableau « Impression, soleil levant » (1872) a donné son nom au mouvement.'],
  ['Picasso et Braque ont inventé…', 'le cubisme', ['l’impressionnisme', 'le fauvisme', 'le pop art'], 'Ils représentent les objets sous plusieurs angles à la fois, en formes géométriques.'],
  ['Un ready-made, c’est…', 'un objet ordinaire choisi et exposé comme œuvre d’art', ['une peinture à l’huile', 'une sculpture en marbre', 'une photographie retouchée'], 'Marcel Duchamp en a fait le premier geste radical, avec « Fontaine » (1917).'],
  ['Une nature morte représente…', 'des objets inanimés : fruits, fleurs, vaisselle…', ['des personnes en mouvement', 'un paysage de montagne', 'un animal sauvage'], 'C’est un genre pictural très pratiqué depuis le XVIIe siècle.'],
  ['La couleur complémentaire du rouge est…', 'le vert', ['le bleu', 'le jaune', 'le noir'], 'Côte à côte, deux couleurs complémentaires se renforcent : rouge et vert, bleu et orange, jaune et violet.'],
  ['La perspective permet de…', 'donner l’illusion de la profondeur sur une surface plane', ['mélanger les couleurs', 'sculpter le bois', 'agrandir une photo'], 'Les lignes de fuite se rejoignent en un point de fuite.'],
  ['Un autoportrait est…', 'un portrait que l’artiste fait de lui-même', ['un portrait d’un roi', 'une photo de voiture', 'une sculpture d’animal'], 'Rembrandt, Van Gogh, Frida Kahlo en ont peint beaucoup.'],
  ['Le collage consiste à…', 'assembler et coller des éléments (papiers, images…) sur un support', ['peindre au couteau', 'sculpter dans la pierre', 'filmer une scène'], 'Picasso et Braque l’ont introduit dans la peinture vers 1912.'],
];
add({
  id: 'arts-oeuvres', subject: 'arts-plastiques', levels: PRIM_COL, label: 'Arts plastiques : artistes, œuvres et vocabulaire', skill: 'arts.oeuvres',
  chapters: ['arts-plastiques-2020-cycle-4', 'arts-plastiques-2020-competences', 'arts5-ch-couleur', 'arts5-ch-objet', 'arts4-ch-images', 'arts4-ch-ressemblance', 'arts4-ch-statut-objet'],
  description: 'Associer des œuvres célèbres à leur artiste ; mouvements, ready-made, nature morte, couleurs complémentaires, perspective.',
  make(rand) {
    if (rand() < 0.45) return match(rand, 'Associe chaque artiste à son œuvre.', ARTISTES, ['Artiste', 'Œuvre'], 4);
    return qcm(rand, pick(rand, VOCAB_ARTS));
  },
});

/* ------------------------------ IA et numérique ------------------------------ */

const IA = [
  ['Une intelligence artificielle générative (comme un robot conversationnel)…', 'produit du texte ou des images à partir de ce qu’elle a appris sur de très nombreux exemples', ['comprend tout comme un humain', 'ne peut jamais se tromper', 'connaît toujours l’actualité du jour'], 'Elle calcule des réponses probables : elle peut inventer des informations fausses.'],
  ['Une IA affirme un fait étonnant. Que faire ?', 'vérifier l’information auprès de sources fiables', ['la croire, puisque c’est une machine', 'la partager tout de suite', 'l’apprendre par cœur'], 'Les IA peuvent « halluciner » : produire des réponses fausses mais convaincantes.'],
  ['Les « biais » d’une IA viennent souvent…', 'des données sur lesquelles elle a été entraînée', ['de la couleur de l’écran', 'de la météo', 'de la taille du clavier'], 'Si les exemples sont déséquilibrés, l’IA reproduit ces déséquilibres.'],
  ['Pix est…', 'un service public pour évaluer et certifier ses compétences numériques', ['un réseau social', 'un jeu vidéo', 'un moteur de recherche'], 'Les élèves passent une certification Pix au collège et au lycée.'],
  ['Le cadre de référence des compétences numériques (CRCN) compte…', 'cinq domaines', ['deux domaines', 'dix domaines', 'un seul domaine'], 'Information et données ; communication et collaboration ; création de contenus ; protection et sécurité ; environnement numérique.'],
  ['Donner à une IA des informations personnelles (adresse, photos de famille)…', 'est à éviter : on ne sait pas toujours comment elles seront utilisées', ['est sans risque', 'est obligatoire', 'rend l’IA plus gentille'], 'Les données saisies peuvent être conservées et réutilisées.'],
  ['Pour un devoir, utiliser une IA est acceptable si…', 'on respecte les consignes du professeur et on vérifie, comprend et reformule', ['on recopie sa réponse sans la lire', 'on cache qu’on l’a utilisée quand c’est interdit', 'on ne vérifie rien'], 'L’IA peut aider à réfléchir, pas à remplacer le travail personnel.'],
  ['Un algorithme d’apprentissage automatique apprend…', 'à partir d’exemples, en ajustant ses paramètres', ['tout seul sans aucune donnée', 'en lisant les pensées', 'uniquement grâce à Internet en direct'], 'On l’entraîne sur des données, puis on le teste sur des exemples nouveaux.'],
];
add({
  id: 'ia-numerique', subject: 'ia-numerique', levels: ['6e', '5e', '4e', '3e', '2nde', '1re', 'tle'], label: 'IA et numérique : comprendre et bien utiliser', skill: 'ia.bases',
  chapters: ['ia-numerique-cadre-2026-crcn', 'ia-numerique-cadre-2026-pix-ia', 'ia-numerique-cadre-2026-attestation-6e', 'ia-numerique-cadre-2026-programmes'],
  description: 'IA générative et ses erreurs, biais, données personnelles, usage honnête ; Pix et les cinq domaines du CRCN.',
  facts: true,
  make(rand) { return qcm(rand, pick(rand, IA)); },
});

export const ARTS_NUMERIQUE = GEN;
export const ARTS_NUMERIQUE_SKILLS = [
  ['musique', 'mus.instruments', 'cp', 'Reconnaître les familles d’instruments'], ['musique', 'mus.oeuvres', 'cp', 'Connaître des œuvres, des compositeurs et le vocabulaire musical'],
  ['arts-plastiques', 'arts.oeuvres', 'cp', 'Connaître des artistes, des œuvres et le vocabulaire des arts plastiques'],
  ['ia-numerique', 'ia.bases', '6e', 'Comprendre l’IA et utiliser le numérique de façon responsable'],
].map(([subject, id, level, label]) => ({ subject, id, label, level, track: 'classe', status: 'programme', domain: 'arts-numerique', prereqs: [], editorialLevel: true }));
