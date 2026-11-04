/**
 * SVT de seconde : générateurs rattachés aux chapitres du parcours de référence svt-2nde. Questions de cours à
 * choix expliquées, et quelques calculs : taille réelle au microscope, estimation d'une population par
 * capture-marquage-recapture, rendement d'une parcelle.
 */
import { pick, ri, numeric, mc, fr, roundTo } from './gen-util.js';
import { qcm } from './primaire-savoirs.js';

const GEN = [];
function add(g) {
  const { make, ...rest } = g;
  GEN.push({ tracks: ['classe', 'approfondissement'], options: [], levels: ['2nde'], subject: 'svt', ...rest, make(rand, o = {}, tier = 'classe') { return make(rand, tier !== 'classe'); } });
}
const num = (answer, o) => numeric(answer, { representation: 'concrete', expectedSeconds: 60, ...o });

const CELL = [
  ['Où se trouve l’ADN dans une cellule animale ?', 'dans le noyau (et un peu dans les mitochondries)', ['dans la membrane', 'dans les ribosomes seulement', 'à l’extérieur de la cellule'], 'Le noyau contient l’essentiel de l’information génétique, portée par l’ADN.'],
  ['Quel organite est le siège de la photosynthèse ?', 'le chloroplaste', ['la mitochondrie', 'le noyau', 'la vacuole'], 'Les chloroplastes, avec leur chlorophylle, captent l’énergie lumineuse.'],
  ['Quel organite est le siège de la respiration cellulaire ?', 'la mitochondrie', ['le chloroplaste', 'le noyau', 'la paroi'], 'Dans les mitochondries, le glucose est oxydé grâce au dioxygène, ce qui libère de l’énergie.'],
  ['Qu’est-ce qui distingue une cellule végétale d’une cellule animale ?', 'une paroi, des chloroplastes et souvent une grande vacuole', ['un noyau', 'une membrane plasmique', 'de l’ADN'], 'Toutes les cellules eucaryotes ont un noyau et une membrane ; la paroi et les chloroplastes sont propres aux végétaux.'],
  ['Une cellule spécialisée, comme un neurone ou un globule rouge,…', 'exprime seulement une partie de ses gènes', ['a perdu son ADN', 'a un ADN différent des autres cellules', 'n’a plus de membrane'], 'Toutes les cellules d’un organisme ont le même ADN ; elles diffèrent par les gènes qu’elles expriment.'],
  ['L’ADN est une molécule formée de…', 'deux brins enroulés en double hélice', ['un seul brin de glucose', 'trois brins de protéines', 'quatre chromosomes'], 'Chaque brin est une suite de nucléotides (A, T, C, G) ; A s’associe à T et C à G.'],
  ['Une bactérie est une cellule…', 'sans noyau (procaryote)', ['avec un noyau', 'végétale', 'animale'], 'Chez les procaryotes, l’ADN est libre dans le cytoplasme.'],
];
const METAB = [
  ['Les végétaux chlorophylliens sont dits autotrophes car ils…', 'fabriquent leur matière organique à partir de matière minérale', ['mangent d’autres êtres vivants', 'vivent seuls', 'ne respirent pas'], 'Grâce à la lumière, ils produisent leur matière organique à partir de CO₂, d’eau et d’ions minéraux.'],
  ['Les produits de la photosynthèse sont…', 'du glucose (matière organique) et du dioxygène', ['du dioxyde de carbone et de l’eau', 'des protéines seulement', 'de l’azote'], '6 CO₂ + 6 H₂O → C₆H₁₂O₆ + 6 O₂, grâce à l’énergie lumineuse.'],
  ['La respiration cellulaire consomme…', 'du glucose et du dioxygène', ['du dioxyde de carbone et de la lumière', 'de l’azote', 'uniquement de l’eau'], 'Elle rejette du CO₂ et de l’eau, et fournit de l’énergie à la cellule.'],
  ['Une enzyme est…', 'une protéine qui accélère une réaction chimique précise', ['un sucre de réserve', 'un acide gras', 'une cellule'], 'Chaque enzyme est spécifique d’une réaction (ou d’un substrat).'],
  ['La fermentation, par rapport à la respiration,…', 'se fait sans dioxygène et libère moins d’énergie', ['demande plus de dioxygène', 'libère plus d’énergie', 'produit du glucose'], 'Exemple : la fermentation lactique des muscles ou celle des levures dans le pain.'],
];
add({
  id: 'l2svt-cellules', label: 'Cellules et métabolisme', skill: 'l2svt.cellules', chapters: ['2nde-svt-cellules', '2nde-svt-metabolisme'],
  description: 'Organites, ADN, cellules spécialisées, photosynthèse, respiration, enzymes ; taille réelle observée au microscope.',
  make(rand) {
    if (rand() < 0.3) {
      const [size, G] = pick(rand, [[20, 400], [10, 1000], [50, 100], [8, 1000], [100, 40], [30, 400]]);
      const img = roundTo((size * G) / 1000, 3); // en mm
      return num(size, { prompt: `Au microscope, au grossissement ×${G}, l’image d’une cellule mesure ${fr(img)} mm sur la photo. Quelle est la taille réelle de la cellule, en micromètres (µm) ? (1 mm = 1 000 µm.)`, unit: 'µm', unitOptional: true,
        misconceptions: [mc(roundTo(img * G, 3), 'mc:grossissement-produit', 'notion', 'Taille réelle = taille de l’image / grossissement : on divise.'), mc(roundTo(img / G, 6), 'mc:unite-mm', 'unite', `${fr(img)} mm / ${G} donne des mm : il reste à convertir en µm (× 1 000).`)], hints: ['Taille réelle = taille de l’image / grossissement, puis conversion en µm.'],
        solution: `${fr(img)} mm / ${G} = ${fr(roundTo(img / G, 6))} mm = ${size} µm` });
    }
    return qcm(rand, pick(rand, [...CELL, ...METAB]));
  },
});

const BIODIV = [
  ['Quelles sont les trois échelles de la biodiversité ?', 'les écosystèmes, les espèces et la diversité génétique', ['les plantes, les animaux et les bactéries', 'les mers, les forêts et les villes', 'les cellules, les tissus et les organes'], 'Biodiversité des écosystèmes, des espèces, et des allèles au sein d’une même espèce.'],
  ['Deux individus d’une même espèce peuvent avoir des yeux de couleurs différentes car ils ont…', 'des allèles différents d’un même gène', ['des gènes complètement différents', 'un nombre différent de chromosomes', 'un ADN de structure différente'], 'C’est la biodiversité génétique : un gène peut exister sous plusieurs versions, les allèles.'],
  ['La sélection naturelle favorise…', 'les individus dont les caractères augmentent la survie et la reproduction dans un milieu donné', ['toujours les individus les plus grands', 'les individus qui le veulent', 'les espèces les plus anciennes'], 'Ces individus laissent plus de descendants : la fréquence de leurs allèles augmente.'],
  ['La dérive génétique est…', 'une variation aléatoire des fréquences des allèles, plus forte dans les petites populations', ['un déplacement des continents', 'une mutation provoquée par le soleil', 'une sélection par l’être humain'], 'Le hasard des reproductions modifie la fréquence des allèles, sans lien avec un avantage.'],
  ['Une crise biologique, comme celle de la fin du Crétacé, correspond à…', 'la disparition massive de nombreuses espèces en peu de temps', ['l’apparition des premiers êtres vivants', 'un hiver très froid', 'la naissance des continents'], 'Il y a environ 66 millions d’années, de nombreux groupes ont disparu, dont les dinosaures non aviens.'],
  ['La sélection sexuelle explique, par exemple,…', 'la queue colorée des paons mâles', ['la couleur verte des feuilles', 'la forme des cristaux de neige', 'la taille des bactéries'], 'Les femelles choisissent plus souvent les mâles aux ornements voyants, même si ces caractères les exposent davantage.'],
  ['Une mutation est…', 'une modification de la séquence de l’ADN', ['un changement de forme d’une cellule', 'une maladie contagieuse', 'un déplacement d’animaux'], 'Les mutations, souvent dues au hasard, créent de nouveaux allèles : elles sont la source de la diversité génétique.'],
];
add({
  id: 'l2svt-biodiversite', label: 'Biodiversité et évolution', skill: 'l2svt.biodiversite', chapters: ['2nde-svt-echelles', '2nde-svt-biodiversite-temps', '2nde-svt-forces-evolutives', '2nde-svt-communication'],
  description: 'Les échelles de la biodiversité, mutations, sélection naturelle et sexuelle, dérive génétique, estimation d’une population.',
  make(rand) {
    if (rand() < 0.35) {
      const [M, C, R] = pick(rand, [[50, 40, 10], [100, 80, 20], [30, 60, 12], [200, 100, 25], [40, 50, 8], [60, 45, 9]]);
      const N = (M * C) / R;
      return num(N, { prompt: `Pour estimer une population de lézards, on en capture et marque ${M}. Quelques jours plus tard, on en capture ${C}, dont ${R} portent une marque. Combien de lézards compte environ la population ?`, unit: 'lézards', unitOptional: true,
        misconceptions: [mc(M + C, 'mc:cmr-somme', 'notion', 'La proportion de marqués dans le 2e échantillon (R/C) estime celle de la population (M/N) : N = M × C / R.'), mc(roundTo((M * R) / C, 2), 'mc:cmr-inverse', 'notion', 'N = M × C / R : on divise par le nombre de recapturés marqués.')].filter((m) => m.answer !== N),
        hints: ['M / N ≈ R / C : la part de marqués est la même dans l’échantillon et dans toute la population.'], solution: `N ≈ ${M} × ${C} / ${R} = ${N} lézards` });
    }
    return qcm(rand, pick(rand, BIODIV));
  },
});

const GEO = [
  ['L’érosion d’une roche, c’est…', 'son altération puis l’arrachage et le transport de ses fragments', ['sa fusion en profondeur', 'sa formation au fond de la mer', 'son refroidissement'], 'L’eau, le gel, le vent et les êtres vivants altèrent les roches ; les fragments sont ensuite transportés.'],
  ['Où les sédiments se déposent-ils le plus souvent ?', 'là où le courant ralentit (deltas, fonds marins, lacs)', ['au sommet des montagnes', 'dans les zones de fort courant', 'dans le noyau terrestre'], 'Quand l’eau ralentit, elle ne peut plus transporter ses particules : elles se déposent.'],
  ['Une roche sédimentaire se forme…', 'par accumulation puis compaction de sédiments', ['par refroidissement d’un magma', 'par fusion d’une roche', 'dans le noyau terrestre'], 'Les couches de sédiments s’empilent ; avec le temps, elles se tassent et se cimentent.'],
  ['Comment l’être humain accélère-t-il l’érosion des sols ?', 'en déboisant et en laissant les sols nus', ['en plantant des haies', 'en couvrant les sols de végétation', 'en construisant des terrasses'], 'Sans racines ni couvert végétal, la pluie et le vent emportent la terre.'],
  ['Les barrages sur les fleuves…', 'retiennent des sédiments, qui n’atteignent plus les côtes', ['augmentent les sédiments arrivant à la mer', 'n’ont aucun effet', 'creusent les montagnes'], 'Privées de sédiments, certaines plages et certains deltas reculent.'],
];
add({
  id: 'l2svt-geosciences', label: 'Érosion et sédimentation', skill: 'l2svt.geosciences', chapters: ['2nde-svt-erosion', '2nde-svt-sedimentation', '2nde-svt-erosion-humain'],
  description: 'Altération, transport, dépôt et formation des roches sédimentaires ; l’activité humaine et l’érosion.',
  make(rand) {
    if (rand() < 0.3) {
      const v = pick(rand, [0.5, 1, 2, 5]); const years = pick(rand, [1000, 10000, 100000]);
      return num(roundTo((v * years) / 1000, 3), { prompt: `Dans un lac, les sédiments se déposent au rythme d’environ ${fr(v)} mm par an. Quelle épaisseur de sédiments s’accumule en ${years.toLocaleString('fr-FR')} ans, en mètres ?`, unit: 'm', unitOptional: true,
        misconceptions: [mc(v * years, 'mc:mm-m', 'unite', `${fr(v)} × ${years} donne des millimètres : il reste à convertir en mètres (÷ 1 000).`)], hints: ['Épaisseur = vitesse de dépôt × durée, puis conversion des mm en m.'], solution: `${fr(v)} mm/an × ${years} ans = ${fr(v * years)} mm = ${fr(roundTo((v * years) / 1000, 3))} m` });
    }
    return qcm(rand, pick(rand, GEO));
  },
});

const AGRO = [
  ['Un agrosystème se distingue d’un écosystème naturel par…', 'l’action de l’être humain : intrants, récoltes, choix des espèces', ['l’absence d’êtres vivants', 'l’absence de sol', 'l’absence de lumière'], 'L’agriculteur exporte la biomasse (récoltes) et apporte des intrants (engrais, eau, traitements).'],
  ['Pourquoi apporte-t-on des engrais dans un champ ?', 'pour compenser les ions minéraux exportés par les récoltes', ['pour tuer les insectes', 'pour réchauffer le sol', 'pour remplacer la lumière'], 'Les récoltes emportent l’azote, le phosphore, le potassium… absorbés par les plantes.'],
  ['Un excès d’engrais azotés peut provoquer…', 'la pollution des eaux (nitrates, eutrophisation)', ['une hausse de la biodiversité des rivières', 'la disparition de la pluie', 'un sol plus riche à coup sûr'], 'Les nitrates lessivés favorisent la prolifération d’algues qui asphyxient les milieux aquatiques.'],
  ['L’humus du sol provient…', 'de la décomposition de la matière organique morte par les organismes du sol', ['de la fusion des roches', 'de la pluie', 'des engrais chimiques uniquement'], 'Vers de terre, champignons et bactéries transforment feuilles et débris en humus.'],
  ['Laquelle de ces pratiques va vers une gestion plus durable d’un agrosystème ?', 'alterner les cultures et garder des haies', ['laisser le sol nu tout l’hiver', 'multiplier les pesticides', 'cultiver toujours la même plante'], 'Rotations, couverts végétaux et haies protègent le sol et la biodiversité.'],
];
add({
  id: 'l2svt-agrosystemes', label: 'Agrosystèmes et sols', skill: 'l2svt.agrosystemes', chapters: ['2nde-svt-agrosystemes', '2nde-svt-sols', '2nde-svt-gestion-durable'],
  description: 'Fonctionnement d’un agrosystème, intrants et exportations, sols et humus, rendement, gestion durable.',
  make(rand) {
    if (rand() < 0.35) {
      const S = pick(rand, [2, 4, 5, 10, 25]); const r = pick(rand, [6, 7, 8, 9]);
      return num(r, { prompt: `Une parcelle de ${S} hectares produit ${S * r} tonnes de blé. Quel est le rendement, en tonnes par hectare ?`, unit: 't/ha', unitOptional: true,
        misconceptions: [mc(S * r * S, 'mc:rendement-produit', 'notion', 'Rendement = production / surface : on divise.')], hints: ['Rendement = masse récoltée / surface cultivée.'], solution: `${S * r} t / ${S} ha = ${r} t/ha` });
    }
    return qcm(rand, pick(rand, AGRO));
  },
});

const SANTE = [
  ['Quel insecte transmet le paludisme ?', 'un moustique (l’anophèle femelle)', ['la mouche domestique', 'la puce', 'l’abeille'], 'Le parasite (Plasmodium) passe dans le sang lors de la piqûre : c’est une maladie vectorielle.'],
  ['Le moustique tigre peut transmettre…', 'la dengue et le chikungunya', ['la grippe', 'le paludisme en Europe', 'la tuberculose'], 'Il s’est installé dans une grande partie de la France ; on limite sa prolifération en supprimant les eaux stagnantes.'],
  ['La maladie de Lyme est transmise par…', 'une tique', ['un moustique', 'un chien', 'l’eau du robinet'], 'Après une promenade en forêt, on vérifie sa peau pour retirer rapidement les tiques.'],
  ['Les antibiotiques sont efficaces contre…', 'les bactéries', ['les virus', 'tous les microbes', 'les champignons uniquement'], 'Ils n’agissent pas sur les virus ; mal utilisés, ils favorisent les bactéries résistantes.'],
  ['Le microbiote intestinal, c’est…', 'l’ensemble des micro-organismes qui vivent dans notre intestin', ['un organe de l’intestin', 'une maladie de l’intestin', 'un médicament'], 'Des milliards de bactéries qui participent à la digestion et à la défense contre les pathogènes.'],
  ['Pourquoi un traitement antibiotique peut-il perturber la digestion ?', 'il élimine aussi une partie des bactéries utiles du microbiote', ['il bouche l’intestin', 'il augmente le nombre de bactéries', 'il rend l’estomac acide'], 'Le microbiote se reconstitue ensuite, plus ou moins vite.'],
  ['Une maladie vectorielle est une maladie…', 'dont l’agent est transmis par un être vivant, souvent un insecte piqueur', ['héréditaire', 'causée par une carence', 'qui ne touche que les plantes'], 'Le vecteur (moustique, tique…) transporte l’agent pathogène d’un hôte à l’autre.'],
  ['La vaccination permet…', 'de préparer le système immunitaire avant une infection', ['de soigner une infection déjà installée en quelques minutes', 'de tuer les bactéries par un antibiotique', 'de changer ses gènes'], 'Le vaccin déclenche une réponse immunitaire et une mémoire, sans provoquer la maladie.'],
];
const REPRO = [
  ['Où sont produits les spermatozoïdes ?', 'dans les testicules', ['dans la prostate', 'dans les reins', 'dans la vessie'], 'Les testicules produisent aussi la testostérone, à partir de la puberté.'],
  ['Quelle glande, sous le cerveau, commande le fonctionnement des ovaires et des testicules ?', 'l’hypophyse', ['la thyroïde', 'le foie', 'le pancréas'], 'L’hypophyse libère des hormones (LH, FSH) qui agissent sur les gonades.'],
  ['La fécondation correspond à…', 'la fusion d’un spermatozoïde et d’un ovocyte', ['la nidation de l’embryon', 'la puberté', 'l’accouchement'], 'Elle a lieu dans une trompe utérine ; la cellule-œuf se divise ensuite.'],
  ['Les ovaires produisent des ovocytes et des hormones :', 'les œstrogènes et la progestérone', ['la testostérone uniquement', 'l’insuline', 'l’adrénaline'], 'Ces hormones règlent le cycle menstruel.'],
  ['Quel moyen de contraception protège aussi des infections sexuellement transmissibles ?', 'le préservatif', ['la pilule', 'le stérilet', 'l’implant'], 'Le préservatif (externe ou interne) est le seul à protéger des IST.'],
];
add({
  id: 'l2svt-sante', label: 'Corps humain et santé : procréation, pathogènes, microbiote', skill: 'l2svt.sante', chapters: ['2nde-svt-pathogenes', '2nde-svt-microbiote', '2nde-svt-fecondation-puberte', '2nde-svt-hormones'],
  description: 'Maladies vectorielles et vecteurs, antibiotiques, microbiote, vaccination ; gonades, hormones, fécondation et contraception.',
  facts: true,
  make(rand) { return qcm(rand, pick(rand, [...SANTE, ...REPRO])); },
});

export const LYCEE_SVT = GEN;
export const LYCEE_SVT_SKILLS = [
  ['l2svt.cellules', 'Cellules spécialisées et métabolisme'], ['l2svt.biodiversite', 'Biodiversité et forces évolutives'],
  ['l2svt.geosciences', 'Érosion et sédimentation'], ['l2svt.agrosystemes', 'Agrosystèmes et sols'], ['l2svt.sante', 'Corps humain et santé'],
].map(([id, label]) => ({ subject: 'svt', id, label, level: '2nde', track: 'classe', status: 'programme', domain: 'lycee', prereqs: [], editorialLevel: true }));
