/**
 * Générateurs de connaissances de l'école primaire : questions à choix (QCM courts, une explication à chaque
 * réponse), étapes à ranger, petits calculs de sciences et un robot à guider sur un quadrillage. Chacun est rattaché
 * aux chapitres officiels qu'il fait travailler (quête de l'année).
 */
import { pick, sample, ri, numeric, text } from './gen-util.js';

const LABEL = { cp: 'CP', ce1: 'CE1', ce2: 'CE2', cm1: 'CM1', cm2: 'CM2' };
const GEN = [];
function add(g) {
  const { make, ...rest } = g;
  GEN.push({
    tracks: ['classe', 'approfondissement'],
    options: [{ id: 'niveau', label: 'Classe', values: g.levels.map((l) => ({ id: l, label: LABEL[l] })) }],
    ...rest,
    make(rand, o = {}, tier = 'classe') {
      const lv = g.levels.includes(String(o.niveau || '').toLowerCase()) ? String(o.niveau).toLowerCase() : g.levels[0];
      return make(rand, lv, tier !== 'classe');
    },
  });
}

/** Question à choix : une bonne réponse, des distracteurs, une explication (montrée quelle que soit la réponse). */
export function qcm(rand, [question, good, bad, why], extra = {}) {
  const pool = [...new Set(bad.filter((b) => b !== good))]; // jamais deux fois le même choix
  const choices = sample(rand, [{ text: good, correct: true, feedback: `Oui ! ${why}` }, ...sample(rand, pool, Math.min(3, pool.length)).map((b) => ({ text: b, correct: false, feedback: why }))]);
  return {
    type: 'qcm', prompt: question, choices, generatedAnswer: { selected: [choices.findIndex((c) => c.correct)] },
    hints: [extra.hint || 'Lis chaque réponse et élimine d’abord celles qui sont impossibles.'], solution: `${good}. ${why}`,
    expectedSeconds: 35, representation: 'verbale', errorType: 'notion', ...extra,
  };
}

const order = (prompt, steps, label = 'du premier au dernier', hint = 'Commence par ce qui arrive en premier.') => ({
  type: 'order', prompt, orderLabel: label, errorType: 'notion', representation: 'visuelle', expectedSeconds: 60,
  items: steps.map((s, i) => ({ id: `s${i + 1}`, label: s })), hints: [hint], solution: steps.join(' → '),
});

/* ------------------------------ Le système solaire ------------------------------ */

const PLANETS = ['Mercure', 'Vénus', 'la Terre', 'Mars', 'Jupiter', 'Saturne', 'Uranus', 'Neptune'];
const SOLAR = [
  ['Quelle planète est la plus proche du Soleil ?', 'Mercure', ['Vénus', 'Mars', 'Neptune'], 'Dans l’ordre en partant du Soleil : Mercure, Vénus, la Terre, Mars, Jupiter, Saturne, Uranus, Neptune.'],
  ['Quelle est la plus grande planète du système solaire ?', 'Jupiter', ['Saturne', 'la Terre', 'Mars'], 'Jupiter est une planète géante faite surtout de gaz : on pourrait y ranger plus de mille Terres.'],
  ['Quelle planète est surnommée « la planète rouge » ?', 'Mars', ['Vénus', 'Jupiter', 'Mercure'], 'Le sol de Mars contient beaucoup d’oxyde de fer, comme la rouille : il paraît rouge.'],
  ['Le Soleil est…', 'une étoile', ['une planète', 'un satellite', 'une comète'], 'Le Soleil est une étoile : une énorme boule de gaz très chaud qui produit sa propre lumière.'],
  ['La Lune est…', 'le satellite naturel de la Terre', ['une étoile', 'une planète', 'une comète'], 'La Lune tourne autour de la Terre en un peu moins d’un mois ; elle renvoie la lumière du Soleil.'],
  ['En combien de temps la Terre fait-elle le tour du Soleil ?', 'en un an, environ 365 jours', ['en 24 heures', 'en un mois', 'en une semaine'], 'Un tour complet autour du Soleil dure une année : environ 365 jours et un quart.'],
  ['En combien de temps la Terre fait-elle un tour sur elle-même ?', 'en 24 heures environ', ['en un an', 'en un mois', 'en une heure'], 'La Terre tourne sur elle-même en une journée, environ 24 heures.'],
  ['D’où vient l’alternance du jour et de la nuit ?', 'de la rotation de la Terre sur elle-même', ['du tour de la Terre autour du Soleil', 'des nuages qui cachent le Soleil', 'du Soleil qui s’éteint la nuit'], 'La Terre tourne sur elle-même : la moitié tournée vers le Soleil est dans le jour, l’autre moitié dans la nuit.'],
  ['Combien de planètes tournent autour du Soleil ?', 'huit', ['neuf', 'sept', 'douze'], 'Huit planètes : depuis 2006, Pluton est classée parmi les planètes naines.'],
  ['Quelle planète est entourée de grands anneaux bien visibles ?', 'Saturne', ['Mars', 'Mercure', 'Vénus'], 'Les anneaux de Saturne sont faits de milliards de morceaux de glace et de roche.'],
  ['Pourquoi y a-t-il des saisons ?', 'parce que l’axe de la Terre est penché', ['parce que la Terre s’éloigne beaucoup du Soleil en hiver', 'parce que la Lune cache le Soleil', 'parce que le Soleil s’allume plus fort l’été'], 'L’axe de la Terre est incliné : selon le moment de l’année, notre pays reçoit les rayons du Soleil plus ou moins directement et les jours sont plus ou moins longs.'],
  ['En partant du Soleil, la Terre est la…', 'troisième planète', ['deuxième planète', 'quatrième planète', 'première planète'], 'Mercure, Vénus, puis la Terre : la troisième.'],
];
add({
  id: 'st-p-systeme-solaire', subject: 'sciences-techno', facts: true, label: 'Le système solaire', skill: 'sciences-techno.p.systeme-solaire', levels: ['cm1', 'cm2'],
  description: 'Les planètes dans l’ordre, le Soleil et la Lune, le jour et la nuit, l’année et les saisons.',
  chapters: ['cm2-st-meteo-climat'],
  make(rand, lv, hard) {
    if (rand() < 0.35) {
      const n = hard ? 6 : 4;
      const chosen = sample(rand, PLANETS.map((p, i) => i), n).sort((a, b) => a - b).map((i) => PLANETS[i]);
      return { ...order('Range ces planètes de la plus proche à la plus éloignée du Soleil.', chosen.map((p) => p[0].toUpperCase() + p.slice(1)), 'de la plus proche à la plus éloignée du Soleil', 'Une phrase pour s’en souvenir : « Me Voici Toute Mignonne, Je Suis Une Nébuleuse » (Mercure, Vénus, Terre, Mars, Jupiter, Saturne, Uranus, Neptune).'), expectedSeconds: 60 };
    }
    return qcm(rand, pick(rand, SOLAR));
  },
});

const ASTRES = [
  SOLAR[3], SOLAR[4], SOLAR[5], SOLAR[6], SOLAR[7],
  ['La Lune brille la nuit. D’où vient sa lumière ?', 'du Soleil, qu’elle renvoie', ['elle la fabrique elle-même', 'de la Terre', 'des étoiles filantes'], 'La Lune ne produit pas de lumière : elle est éclairée par le Soleil, comme un miroir un peu sombre.'],
  ['Combien y a-t-il de saisons dans une année ?', 'quatre', ['deux', 'trois', 'douze'], 'Le printemps, l’été, l’automne et l’hiver.'],
  ['Quelle saison commence vers le 21 juin ?', 'l’été', ['l’hiver', 'le printemps', 'l’automne'], 'Vers le 21 juin, c’est le jour le plus long de l’année : l’été commence.'],
  ['Quelle saison commence vers le 21 décembre ?', 'l’hiver', ['l’été', 'le printemps', 'l’automne'], 'Vers le 21 décembre, c’est la nuit la plus longue de l’année : l’hiver commence.'],
  ['Quelle saison commence vers le 20 mars ?', 'le printemps', ['l’automne', 'l’été', 'l’hiver'], 'Vers le 20 mars, le jour et la nuit durent à peu près autant : c’est le printemps.'],
  ['En été, les journées sont…', 'plus longues qu’en hiver', ['plus courtes qu’en hiver', 'aussi longues qu’en hiver', 'sans nuit du tout en France'], 'En été, le Soleil se lève tôt et se couche tard : les jours sont longs.'],
  ['Qu’est-ce qu’une étoile ?', 'une boule de gaz très chaude qui produit sa lumière', ['une planète qui brille', 'un morceau de Lune', 'un avion très haut'], 'Le Soleil est l’étoile la plus proche de nous ; les autres étoiles sont si loin qu’elles paraissent minuscules.'],
  ['Quelle est l’étoile la plus proche de la Terre ?', 'le Soleil', ['la Lune', 'l’étoile polaire', 'Mars'], 'Le Soleil est une étoile ; la Lune est un satellite, Mars une planète.'],
  ['La nuit, en plus de la Lune, on peut voir dans le ciel…', 'des étoiles, et parfois des planètes', ['le Soleil', 'des arcs-en-ciel', 'rien du tout'], 'Les planètes comme Vénus ou Jupiter brillent sans scintiller.'],
  ['La Lune semble changer de forme au cours du mois parce que…', 'on voit une partie plus ou moins grande de sa face éclairée', ['elle se casse puis se répare', 'les nuages la grignotent', 'elle rétrécit vraiment'], 'Ce sont les phases de la Lune : nouvelle lune, croissant, quartier, pleine lune…'],
  ['En hiver, en France, les journées sont…', 'plus courtes qu’en été', ['plus longues qu’en été', 'éclairées jour et nuit', 'sans aucune nuit'], 'Le Soleil se lève tard et se couche tôt.'],
];
add({
  id: 'hp-astres', subject: 'hg', facts: true, label: 'La Terre, le Soleil, la Lune et les saisons', skill: 'hg.p.astres', levels: ['ce1', 'ce2'],
  description: 'Le Soleil est une étoile, la Lune un satellite ; le jour et la nuit, l’année, les quatre saisons.',
  chapters: ['ce1-hg-terre-univers', 'ce2-hg-astres'],
  make(rand) { return qcm(rand, pick(rand, ASTRES)); },
});

/* ------------------------------ Le corps humain : digestion, circulation ------------------------------ */

const DIGEST = [
  ['Où les nutriments passent-ils dans le sang ?', 'dans l’intestin grêle', ['dans la bouche', 'dans l’œsophage', 'dans les poumons'], 'Dans l’intestin grêle, long de plusieurs mètres, les aliments digérés traversent la paroi et passent dans le sang.'],
  ['Quel organe fait circuler le sang dans tout le corps ?', 'le cœur', ['les poumons', 'l’estomac', 'le cerveau'], 'Le cœur est un muscle qui se contracte sans arrêt : il pousse le sang dans les vaisseaux sanguins.'],
  ['Dans quels organes le dioxygène de l’air passe-t-il dans le sang ?', 'dans les poumons', ['dans le cœur', 'dans l’estomac', 'dans l’intestin'], 'Dans les poumons, le dioxygène de l’air passe dans le sang, et le dioxyde de carbone en sort.'],
  ['Que transporte le sang jusqu’aux organes ?', 'du dioxygène et des nutriments', ['seulement de l’eau', 'des aliments entiers', 'de l’air pur sans rien d’autre'], 'Le sang apporte aux organes ce dont ils ont besoin : le dioxygène et les nutriments.'],
  ['Quel tuyau conduit les aliments de la bouche à l’estomac ?', 'l’œsophage', ['la trachée', 'l’intestin grêle', 'le gros intestin'], 'L’œsophage descend de la gorge à l’estomac ; la trachée, elle, conduit l’air aux poumons.'],
  ['À quoi servent les dents ?', 'à couper et broyer les aliments', ['à digérer le sucre', 'à respirer', 'à faire passer les aliments dans le sang'], 'Les incisives coupent, les canines déchirent, les molaires broient : la digestion commence dans la bouche.'],
  ['Que deviennent les restes d’aliments non digérés ?', 'ils sont rejetés sous forme d’excréments', ['ils passent tous dans le sang', 'ils restent dans l’estomac', 'ils remontent dans la bouche'], 'Ce qui n’est pas digéré traverse le gros intestin puis est rejeté.'],
  ['Quel déchet produit par nos organes est rejeté par les poumons ?', 'le dioxyde de carbone', ['le dioxygène', 'le sucre', 'le sel'], 'Le sang emporte le dioxyde de carbone jusqu’aux poumons, qui le rejettent quand on expire.'],
  ['Pourquoi le cœur bat-il plus vite quand on court ?', 'les muscles ont besoin de plus de sang riche en dioxygène', ['il a froid', 'il se fatigue', 'on a faim'], 'On peut le sentir en posant la main sur sa poitrine, ou en prenant son pouls.'],
  ['Quelle partie du tube digestif est la plus longue ?', 'l’intestin grêle', ['l’estomac', 'l’œsophage', 'la bouche'], 'Il mesure plusieurs mètres, replié dans le ventre.'],
  ['Dans l’estomac, les aliments…', 'sont brassés et commencent à être transformés par des sucs digestifs', ['passent directement dans le sang', 'sont rejetés', 'se changent en air'], 'L’estomac est une poche musclée.'],
  ['Pour rester en bonne santé, il faut…', 'manger varié, bouger et boire de l’eau', ['manger surtout des sucreries', 'ne jamais bouger', 'boire surtout des sodas'], 'Fruits et légumes, eau et activité physique sont essentiels.'],
  ['Quand on inspire, l’air entre…', 'dans les poumons', ['dans l’estomac', 'dans le cœur', 'dans le cerveau'], 'Il passe par le nez ou la bouche, puis par la trachée.'],
];
const TUBE = ['La bouche', 'L’œsophage', 'L’estomac', 'L’intestin grêle', 'Le gros intestin'];
add({
  id: 'st-p-digestion', subject: 'sciences-techno', facts: true, label: 'Digestion, respiration, circulation', skill: 'sciences-techno.p.digestion', levels: ['cm2'],
  description: 'Le trajet des aliments, le passage des nutriments et du dioxygène dans le sang, le rôle du cœur.',
  chapters: ['cm2-st-nutrition'],
  make(rand) {
    if (rand() < 0.3) return order('Range les organes dans l’ordre où les aliments les traversent.', TUBE, 'de l’entrée à la sortie', 'Les aliments entrent par la bouche…');
    return qcm(rand, pick(rand, DIGEST));
  },
});

/* ------------------------------ Chaînes alimentaires ------------------------------ */

const CHAINS = [
  ['L’herbe', 'Le lapin', 'Le renard'],
  ['Les feuilles du chêne', 'La chenille', 'La mésange', 'L’épervier'],
  ['L’herbe', 'Le criquet', 'La grenouille', 'La couleuvre'],
  ['Les grains de blé', 'Le mulot', 'La chouette'],
  ['Le rosier', 'Le puceron', 'La coccinelle'],
  ['Les feuilles de salade', 'L’escargot', 'Le hérisson'],
  ['Les algues du plancton', 'Les petits crustacés', 'Le hareng', 'Le phoque'],
];
const FOOD = [
  ['Par quoi commence toujours une chaîne alimentaire ?', 'par un végétal (ou des algues)', ['par un carnivore', 'par un omnivore', 'par un champignon'], 'Les végétaux fabriquent leur propre matière avec la lumière : ce sont les producteurs, au début de chaque chaîne.'],
  ['Dans « l’herbe → le lapin », que veut dire la flèche ?', '« est mangé par »', ['« mange »', '« est plus grand que »', '« vit à côté de »'], 'La flèche va de celui qui est mangé vers celui qui le mange : l’herbe est mangée par le lapin.'],
  ['Quel est le rôle des vers de terre et des champignons du sol ?', 'ils décomposent les restes d’êtres vivants', ['ils fabriquent leur nourriture avec la lumière', 'ils mangent seulement des animaux vivants', 'ils n’ont aucun rôle'], 'Ce sont des décomposeurs : ils transforment feuilles mortes et cadavres en matière qui nourrit le sol.'],
  ['Si les renards disparaissaient d’une forêt, que risquerait-il d’arriver aux lapins ?', 'ils risqueraient de devenir beaucoup plus nombreux', ['ils disparaîtraient aussitôt', 'rien ne changerait jamais', 'ils deviendraient carnivores'], 'Un être vivant dépend des autres : sans prédateur, une population peut grandir, puis manquer de nourriture.'],
  ['Un réseau alimentaire, c’est…', 'plusieurs chaînes alimentaires reliées entre elles', ['une seule chaîne très longue', 'la liste des animaux d’un zoo', 'un filet pour pêcher'], 'Un même animal mange souvent plusieurs espèces et peut être mangé par plusieurs autres : les chaînes s’entrecroisent.'],
  ['De quoi une plante verte a-t-elle besoin pour fabriquer sa matière ?', 'de lumière, d’eau, de sels minéraux et de dioxyde de carbone', ['de viande', 'de sucre en poudre', 'de terre seulement, sans lumière'], 'Grâce à la lumière, la plante fabrique sa matière avec l’eau, les sels minéraux du sol et le dioxyde de carbone de l’air.'],
  ['Un animal qui mange d’autres animaux est…', 'un carnivore', ['un herbivore', 'un producteur', 'un décomposeur'], 'Carnivore : qui mange de la chair, de la viande. Herbivore : qui mange des végétaux.'],
];
add({
  id: 'st-p-chaines', subject: 'sciences-techno', facts: true, label: 'Chaînes et réseaux alimentaires', skill: 'sciences-techno.p.chaines', levels: ['cm1', 'cm2'],
  description: 'Remettre une chaîne alimentaire dans l’ordre, comprendre les producteurs, consommateurs et décomposeurs.',
  chapters: ['cm1-st-ecosysteme', 'cm2-st-ecosystemes'],
  make(rand) {
    if (rand() < 0.45) {
      const c = pick(rand, CHAINS);
      return { ...order('Range cette chaîne alimentaire : du premier être vivant mangé jusqu’au dernier mangeur.', c, 'de celui qui est mangé à celui qui mange', 'Une chaîne alimentaire commence par un végétal.'), solution: `${c.join(' → ')} (la flèche veut dire « est mangé par »).` };
    }
    return qcm(rand, pick(rand, FOOD));
  },
});

/* ------------------------------ Mouvements : distances et durées ------------------------------ */

const MOVERS = {
  cm1: [['Un randonneur', 4, 'à pied'], ['Une cycliste', 15, 'à vélo'], ['Un enfant en trottinette', 8, 'en trottinette'], ['Un cheval au trot', 12, 'au trot']],
  cm2: [['Un train', 120, 'en train'], ['Une voiture', 80, 'en voiture'], ['Un cycliste', 20, 'à vélo'], ['Un bateau', 30, 'en bateau'], ['Un car', 90, 'en car']],
};
add({
  id: 'st-p-vitesse', subject: 'sciences-techno', label: 'Mouvements : distances, durées, vitesses', skill: 'sciences-techno.p.vitesse', levels: ['cm1', 'cm2'],
  description: 'Un mouvement régulier : la distance parcourue en une heure, en plusieurs heures, la durée d’un trajet.',
  chapters: ['cm1-st-mouvement', 'cm2-st-mouvements'],
  make(rand, lv, hard) {
    const [who, v0] = pick(rand, MOVERS[lv]);
    const v = v0 + (lv === 'cm2' ? ri(rand, -2, 2) * 5 : ri(rand, -1, 1));
    const t = ri(rand, 2, hard ? 6 : 4);
    const k = pick(rand, hard ? ['distance', 'duree', 'vitesse', 'demi'] : ['distance', 'duree', 'vitesse']);
    const why = 'Le mouvement est régulier : en deux fois plus de temps, on parcourt deux fois plus de distance.';
    if (k === 'distance') return numeric(v * t, { prompt: `${who} avance toujours à la même allure : ${v} km en 1 heure. Quelle distance parcourt-il en ${t} heures ?`, unit: 'km', unitOptional: true, expectedSeconds: 40, hints: [why], solution: `${v} × ${t} = ${v * t} km.`, representation: 'concrete' });
    if (k === 'duree') return numeric(t, { prompt: `${who} parcourt ${v} km en 1 heure, toujours à la même allure. Combien d’heures lui faut-il pour parcourir ${v * t} km ?`, unit: 'h', unitOptional: true, expectedSeconds: 45, hints: [`Combien de fois ${v} km dans ${v * t} km ?`], solution: `${v * t} ÷ ${v} = ${t} heures.`, representation: 'concrete' });
    if (k === 'demi') return numeric(v / 2, { prompt: `${who} parcourt ${v} km en 1 heure, toujours à la même allure. Quelle distance parcourt-il en une demi-heure (30 minutes) ?`, unit: 'km', unitOptional: true, expectedSeconds: 45, hints: ['En deux fois moins de temps, on parcourt deux fois moins de distance.'], solution: `${v} ÷ 2 = ${String(v / 2).replace('.', ',')} km.`, representation: 'concrete' });
    return numeric(v, { prompt: `${who} parcourt ${v * t} km en ${t} heures, toujours à la même allure. Quelle distance parcourt-il en 1 heure ?`, unit: 'km', unitOptional: true, expectedSeconds: 45, hints: [`Partage les ${v * t} km en ${t} parts égales.`], solution: `${v * t} ÷ ${t} = ${v} km en 1 heure : sa vitesse est de ${v} km/h.`, representation: 'concrete' });
  },
});

/* ------------------------------ Masses, volumes, températures ------------------------------ */

const MASS_CP = [
  ['Sur une balance à plateaux, le plateau de la pomme descend et celui de la fraise monte. Quel fruit est le plus lourd ?', 'la pomme', ['la fraise', 'ils sont aussi lourds', 'on ne peut pas savoir'], 'Le plateau le plus lourd descend.'],
  ['Les deux plateaux de la balance sont à la même hauteur. Que peut-on dire ?', 'les deux objets ont la même masse', ['l’objet de gauche est plus lourd', 'l’objet de droite est plus lourd', 'la balance est cassée'], 'Quand la balance est en équilibre, les deux masses sont égales.'],
  ['Quel instrument sert à mesurer la température ?', 'le thermomètre', ['la balance', 'la règle', 'la montre'], 'Le thermomètre mesure la température, en degrés (°C).'],
  ['Le thermomètre indique 30 °C. Fait-il…', 'chaud', ['très froid', 'il gèle', 'on ne peut pas savoir'], '30 °C, c’est une température d’été, il fait chaud.'],
  ['Ce matin, il faisait 8 °C ; cet après-midi, 15 °C. L’après-midi, il fait…', 'plus chaud que le matin', ['plus froid que le matin', 'aussi chaud que le matin', 'il gèle'], '15 est plus grand que 8 : il fait plus chaud.'],
  ['À quelle température l’eau se transforme-t-elle en glace ?', 'à 0 °C', ['à 20 °C', 'à 50 °C', 'à 100 °C'], 'L’eau gèle à 0 °C : en dessous, elle est solide.'],
  ['Qu’est-ce qui est le plus lourd ?', 'un vélo', ['une plume', 'une feuille de papier', 'une gomme'], 'Un vélo pèse plusieurs kilos : bien plus qu’une plume, une feuille ou une gomme.'],
  ['Qu’est-ce qui est le plus léger ?', 'une plume', ['un cartable rempli', 'une pastèque', 'un chat'], 'Une plume pèse presque rien.'],
  ['Quel instrument sert à mesurer une longueur ?', 'la règle (ou le mètre)', ['la balance', 'le thermomètre', 'la montre'], 'On mesure les longueurs en centimètres et en mètres.'],
  ['Quel instrument sert à mesurer une durée ?', 'le chronomètre (ou la montre)', ['la règle', 'la balance', 'le thermomètre'], 'Une durée se mesure en secondes, en minutes, en heures.'],
  ['Lequel de ces objets est le plus lourd ?', 'un dictionnaire', ['une plume', 'une feuille de papier', 'un ballon de baudruche'], 'Plein de pages, le dictionnaire pèse bien plus lourd.'],
  ['Sur un plateau, 3 billes ; sur l’autre, 5 billes identiques. Quel plateau descend ?', 'celui des 5 billes', ['celui des 3 billes', 'aucun des deux', 'les deux'], 'Plus il y a de billes identiques, plus c’est lourd.'],
  ['La masse d’un objet se mesure en…', 'grammes ou kilogrammes', ['mètres', 'litres', 'degrés'], 'On pèse une lettre en grammes, un sac de pommes en kilogrammes.'],
];
add({
  id: 'st-p-masses', subject: 'sciences-techno', label: 'Masses, volumes et températures', skill: 'sciences-techno.p.masses', levels: ['cp', 'cm1', 'cm2'],
  description: 'CP : comparer des masses, lire une température. CM : peser, convertir grammes et kilogrammes, litres et centilitres.',
  chapters: ['cp-st-masses-temperature', 'cm1-st-masse', 'cm2-st-masse-volume'],
  make(rand, lv, hard) {
    if (lv === 'cp') return qcm(rand, pick(rand, MASS_CP));
    const k = pick(rand, lv === 'cm1' ? ['kg-g', 'balance', 'comparer', 'balance'] : ['kg-g', 'litre', 'balance', 'eau', 'comparer']);
    if (k === 'kg-g') {
      const kg = ri(rand, 1, hard ? 9 : 5); const g = hard ? ri(rand, 1, 9) * 100 : 0;
      return numeric(kg * 1000 + g, { prompt: `Combien de grammes font ${kg} kg${g ? ` et ${g} g` : ''} ?`, unit: 'g', unitOptional: true, expectedSeconds: 30, hints: ['1 kg = 1 000 g.'], solution: `${kg} kg = ${kg * 1000} g${g ? `, plus ${g} g : ${kg * 1000 + g} g` : ''}.`, representation: 'symbolique' });
    }
    if (k === 'balance') {
      const masses = sample(rand, [500, 200, 200, 100, 50, 20, 10, 1000], hard ? 4 : 3);
      const total = masses.reduce((s, m) => s + m, 0);
      const fmt = (m) => (m >= 1000 ? `${m / 1000} kg` : `${m} g`);
      return numeric(total, { prompt: `Pour équilibrer la balance, on pose sur l’autre plateau : ${masses.map(fmt).join(', ')}. Combien pèse l’objet, en grammes ?`, unit: 'g', unitOptional: true, expectedSeconds: 45, hints: ['La balance est en équilibre : l’objet pèse autant que toutes les masses réunies.', '1 kg = 1 000 g.'], solution: `${masses.map((m) => `${m} g`).join(' + ')} = ${total} g.`, representation: 'concrete' });
    }
    if (k === 'litre') {
      const l = ri(rand, 1, 5);
      return pick(rand, [true, false])
        ? numeric(l * 100, { prompt: `Combien de centilitres dans ${l} L ?`, unit: 'cL', unitOptional: true, expectedSeconds: 30, hints: ['1 L = 100 cL.'], solution: `${l} L = ${l * 100} cL.`, representation: 'symbolique' })
        : numeric(l * 1000, { prompt: `Combien de millilitres dans ${l} L ?`, unit: 'mL', unitOptional: true, expectedSeconds: 30, hints: ['1 L = 1 000 mL.'], solution: `${l} L = ${l * 1000} mL.`, representation: 'symbolique' });
    }
    if (k === 'eau') {
      return qcm(rand, pick(rand, [
        ['Combien pèse environ 1 litre d’eau ?', 'environ 1 kg', ['environ 1 g', 'environ 10 kg', 'environ 100 g'], '1 L d’eau pèse environ 1 kg : une bouteille d’eau de 1,5 L pèse environ 1,5 kg.'],
        ['Quand l’eau gèle, que devient son volume ?', 'il augmente un peu', ['il diminue', 'il ne change pas', 'il devient nul'], 'La glace prend un peu plus de place que l’eau liquide : c’est pour cela qu’elle flotte, et qu’une bouteille pleine peut éclater au congélateur.'],
        ['Quand un glaçon fond, que devient sa masse ?', 'elle ne change pas', ['elle augmente', 'elle diminue de moitié', 'elle disparaît'], 'Fondre, c’est changer d’état : la quantité d’eau reste la même, donc la masse aussi.'],
        ['L’huile flotte sur l’eau. Un litre d’huile pèse donc…', 'moins qu’un litre d’eau', ['plus qu’un litre d’eau', 'autant qu’un litre d’eau', 'rien du tout'], 'Ce qui flotte est moins lourd que l’eau pour le même volume.'],
      ]));
    }
    const a = ri(rand, 1, 4); const b = ri(rand, 5, 9) * 100 + (a === 1 ? 1000 : 0);
    const big = a * 1000 > b ? `${a} kg` : `${b} g`;
    return qcm(rand, [`Lequel est le plus lourd : ${a} kg ou ${b} g ?`, big, [a * 1000 > b ? `${b} g` : `${a} kg`, 'ils pèsent autant'], `${a} kg = ${a * 1000} g, à comparer à ${b} g.`], { hint: 'Convertis d’abord dans la même unité : 1 kg = 1 000 g.' });
  },
});

/* ------------------------------ L'eau : solide, liquide ------------------------------ */

const WATER = [
  ['À quelle température l’eau gèle-t-elle ?', 'à 0 °C', ['à 10 °C', 'à 37 °C', 'à 100 °C'], 'En dessous de 0 °C, l’eau devient de la glace : elle est solide.'],
  ['Que devient un glaçon posé au soleil ?', 'il fond : il devient de l’eau liquide', ['il grossit', 'il devient du sable', 'il ne change pas'], 'La chaleur fait fondre la glace : l’eau passe de l’état solide à l’état liquide.'],
  ['La neige, la grêle et la glace, c’est de l’eau…', 'solide', ['liquide', 'en poudre de sucre', 'qui n’est pas de l’eau'], 'La neige, la grêle et la glace sont de l’eau à l’état solide.'],
  ['La pluie, la rivière et la mer, c’est de l’eau…', 'liquide', ['solide', 'en glace', 'qui n’est pas de l’eau'], 'L’eau liquide coule et prend la forme de son récipient.'],
  ['Une bouteille d’eau pleine et bien fermée, mise au congélateur, peut…', 'éclater, car la glace prend plus de place', ['rétrécir', 'se vider toute seule', 'se changer en jus'], 'En gelant, l’eau augmente un peu de volume.'],
  ['Quand un glaçon fond, sa masse…', 'reste la même', ['augmente', 'diminue de moitié', 'disparaît'], 'Il y a toujours la même quantité d’eau : seule sa forme change.'],
  ['Que devient l’eau d’une flaque au soleil ?', 'elle s’évapore : elle part dans l’air', ['elle devient de la glace', 'elle devient du sable', 'elle se change en caillou'], 'Chauffée par le soleil, l’eau devient de la vapeur d’eau, invisible dans l’air.'],
  ['Où trouve-t-on de l’eau solide dans la nature ?', 'dans les glaciers et sur la banquise', ['dans une source', 'dans la pluie d’été', 'dans une mer chaude'], 'Les glaciers des montagnes et la banquise des pôles sont de l’eau gelée.'],
  ['Le matin, on voit de la buée sur la vitre froide. C’est…', 'de la vapeur d’eau de l’air redevenue liquide', ['de la peinture', 'de la glace qui fond', 'de la poussière'], 'Au contact de la vitre froide, la vapeur d’eau invisible de l’air se transforme en gouttelettes.'],
  ['Le linge mouillé sèche sur le fil parce que…', 'l’eau s’évapore dans l’air', ['l’eau devient de la glace', 'le tissu boit l’eau', 'le vent mange l’eau'], 'Le soleil et le vent accélèrent l’évaporation.'],
  ['Les nuages sont faits…', 'de minuscules gouttes d’eau ou de cristaux de glace', ['de coton', 'de fumée', 'de sable'], 'Quand les gouttes grossissent, elles tombent : c’est la pluie.'],
  ['À quelle température l’eau se met-elle à bouillir ?', 'à 100 °C', ['à 0 °C', 'à 37 °C', 'à 50 °C'], 'L’eau bouillante se transforme en vapeur.'],
  ['Pour économiser l’eau, on peut…', 'fermer le robinet pendant qu’on se brosse les dents', ['laisser couler l’eau', 'prendre un très long bain chaque jour', 'arroser le jardin en plein soleil'], 'L’eau potable est précieuse : chaque geste compte.'],
  ['L’eau du robinet que l’on peut boire s’appelle l’eau…', 'potable', ['salée', 'de mer', 'usée'], 'Elle a été nettoyée et contrôlée pour pouvoir être bue sans danger.'],
  ['Dans la nature, l’eau de pluie…', 'coule vers les rivières et la mer, ou s’infiltre dans le sol', ['disparaît pour toujours', 'se change en sable', 'reste toujours dans les nuages'], 'C’est le cycle de l’eau : elle s’évapore, forme des nuages, retombe en pluie…'],
];
const water = (id, subject, levels, chapters, skill) => add({
  id, subject, facts: true, label: 'L’eau solide et l’eau liquide', skill, levels, chapters,
  description: 'La glace, la neige, la pluie ; geler à 0 °C, fondre, s’évaporer ; le volume et la masse qui changent… ou pas.',
  make(rand, lv) { return qcm(rand, pick(rand, lv === 'cp' ? WATER.filter((_, k) => ![4, 5, 8, 11].includes(k)) : WATER)); },
});
water('st-p-eau-cp', 'sciences-techno', ['cp'], ['cp-st-eau'], 'sciences-techno.p.eau');
water('qlm-p-eau', 'qlm', ['ce1'], ['ce1-qlm-eau'], 'qlm.p.eau');

/* ------------------------------ Le cerveau, les sens ------------------------------ */

const BRAIN = [
  ['Quel organe reçoit les messages des sens et commande les muscles ?', 'le cerveau', ['le cœur', 'l’estomac', 'les poumons'], 'Les messages des yeux, des oreilles, de la peau… arrivent au cerveau, qui envoie des ordres aux muscles.'],
  ['Par où circulent les messages entre le cerveau et le reste du corps ?', 'par les nerfs', ['par les os', 'par les cheveux', 'par l’estomac'], 'Les nerfs sont comme des câbles : ils transportent les messages vers le cerveau et depuis le cerveau.'],
  ['Avec quel organe sent-on les odeurs ?', 'le nez', ['la langue', 'les oreilles', 'la peau'], 'L’odorat est le sens du nez.'],
  ['Le toucher, c’est le sens…', 'de la peau', ['des yeux', 'du nez', 'des oreilles'], 'La peau sent le chaud, le froid, le doux, le piquant.'],
  ['Combien d’heures un enfant de 9-10 ans devrait-il dormir chaque nuit ?', 'environ 9 à 11 heures', ['environ 5 heures', 'environ 3 heures', 'environ 15 heures'], 'Pendant le sommeil, le cerveau range ce qu’on a appris dans la journée.'],
  ['Pourquoi est-il utile de revoir une leçon plusieurs jours de suite ?', 'pour mieux s’en souvenir longtemps', ['pour l’oublier plus vite', 'cela ne sert à rien', 'pour fatiguer le cerveau'], 'Chaque fois qu’on se rappelle une leçon, la mémoire la garde mieux.'],
  ['Quand on fait ses devoirs devant la télévision allumée, l’attention…', 'diminue', ['augmente', 'double', 'ne change pas'], 'Le cerveau a du mal à faire attention à deux choses à la fois.'],
  ['Le goût, c’est le sens…', 'de la langue', ['du nez seulement', 'des oreilles', 'des yeux'], 'La langue sent le sucré, le salé, l’acide et l’amer ; le nez aide beaucoup à reconnaître les saveurs.'],
  ['Quand on touche quelque chose de brûlant, on retire vite la main grâce…', 'aux nerfs, qui transmettent le message très vite', ['à l’estomac', 'aux cheveux', 'au hasard'], 'Le message part de la main et revient aussitôt vers les muscles du bras.'],
  ['Combien a-t-on de sens ?', 'cinq : la vue, l’ouïe, l’odorat, le goût et le toucher', ['deux', 'trois', 'dix'], 'Chaque sens a son organe : les yeux, les oreilles, le nez, la langue, la peau.'],
  ['Avec quels organes entend-on les sons ?', 'les oreilles', ['les yeux', 'le nez', 'la langue'], 'L’ouïe est le sens des oreilles.'],
  ['Pour protéger ses oreilles des bruits trop forts, on peut…', 'baisser le volume et porter des protections', ['monter le son au maximum', 'coller l’oreille contre l’enceinte', 'ne rien faire'], 'Des bruits trop forts peuvent abîmer l’audition pour toujours.'],
  ['Pour protéger ses yeux, il ne faut jamais…', 'regarder le Soleil en face', ['lire un livre', 'regarder la Lune', 'porter des lunettes de soleil'], 'Même avec des lunettes de soleil, regarder le Soleil peut brûler l’œil.'],
];
add({
  id: 'st-p-cerveau', subject: 'sciences-techno', facts: true, label: 'Le cerveau, les sens et la mémoire', skill: 'sciences-techno.p.cerveau', levels: ['cm1'],
  description: 'Les cinq sens, les nerfs et le cerveau ; ce qui aide à faire attention et à retenir.',
  chapters: ['cm1-st-cerveau'],
  make(rand) { return qcm(rand, pick(rand, BRAIN)); },
});

/* ------------------------------ Fabriquer des aliments ; un projet technique ------------------------------ */

const BREAD = ['Cultiver et récolter le blé', 'Moudre les grains pour obtenir de la farine', 'Pétrir la farine avec de l’eau, du sel et de la levure', 'Laisser lever la pâte', 'Cuire le pain au four'];
const YOGURT = ['Faire chauffer le lait', 'Ajouter des ferments (de minuscules bactéries)', 'Laisser au chaud plusieurs heures', 'Mettre les yaourts au réfrigérateur'];
const PROJECT = ['Exprimer le besoin', 'Imaginer des solutions et dessiner un croquis', 'Choisir les matériaux et les outils', 'Fabriquer la maquette', 'Tester et améliorer'];
const LIFE = ['Extraire les matières premières', 'Fabriquer l’objet à l’usine', 'Transporter et vendre l’objet', 'Utiliser l’objet', 'Recycler l’objet en fin de vie'];
const MAKE = [
  ['Qui transforme le lait en yaourt ?', 'des ferments : de minuscules bactéries', ['le sucre', 'le froid du réfrigérateur', 'la lumière'], 'Les bactéries des ferments transforment le sucre du lait : il s’épaissit et devient acide.'],
  ['Pourquoi la pâte à pain gonfle-t-elle ?', 'la levure produit un gaz qui fait des bulles', ['le sel la fait gonfler', 'le four la gonfle d’air', 'l’eau la fait exploser'], 'La levure est un champignon microscopique : elle produit du dioxyde de carbone, qui forme les trous de la mie.'],
  ['D’où vient la farine du pain ?', 'des grains de blé moulus', ['du lait', 'des pommes de terre', 'du sucre'], 'Au moulin, on écrase les grains de blé pour obtenir la farine.'],
  ['D’où vient le fromage ?', 'du lait, que l’on fait cailler puis affiner', ['du blé', 'des œufs', 'de la farine'], 'Selon les fromages, il faut souvent près de 10 litres de lait pour un kilo.'],
  ['Comment fabrique-t-on le beurre ?', 'en battant la crème du lait', ['en faisant bouillir de l’eau', 'en écrasant des olives', 'en mélangeant du sucre et du sel'], 'En battant la crème, les gouttelettes de matière grasse se collent entre elles.'],
  ['En France, le sucre est surtout fabriqué à partir…', 'de la betterave sucrière', ['du sel de mer', 'du blé', 'des pommes de terre'], 'Dans d’autres pays, on le tire de la canne à sucre.'],
  ['Le papier est fabriqué principalement à partir…', 'du bois et de vieux papiers recyclés', ['du plastique', 'du sable', 'du métal'], 'Les fibres sont réduites en pâte, puis pressées et séchées.'],
  ['Le verre est fabriqué en faisant fondre…', 'du sable', ['du bois', 'de la laine', 'du papier'], 'Chauffé à très haute température, le sable devient liquide ; on le façonne avant qu’il refroidisse.'],
];
add({
  id: 'st-p-fabriquer', subject: 'sciences-techno', facts: true, label: 'Fabriquer : aliments, maquettes, cycle de vie d’un objet', skill: 'sciences-techno.p.fabriquer', levels: ['cm2'],
  description: 'Les étapes de fabrication du pain et du yaourt, d’un projet technique et de la vie d’un objet.',
  chapters: ['cm2-st-aliments', 'cm2-st-projet'],
  make(rand) {
    const k = pick(rand, ['pain', 'yaourt', 'projet', 'vie', 'qcm', 'qcm']);
    if (k === 'pain') return order('Range les étapes de la fabrication du pain.', BREAD, 'du champ à la boulangerie', 'Tout commence dans un champ.');
    if (k === 'yaourt') return order('Range les étapes de la fabrication du yaourt.', YOGURT, 'de la première à la dernière étape', 'On commence par préparer le lait.');
    if (k === 'projet') return order('Range les étapes d’un projet technique, pour fabriquer une maquette.', PROJECT, 'de la première à la dernière étape', 'Avant de fabriquer, il faut savoir à quoi l’objet servira.');
    if (k === 'vie') return order('Range les étapes de la vie d’un objet, de sa fabrication à son recyclage.', LIFE, 'de la naissance à la fin de vie de l’objet', 'Il faut d’abord des matières premières.');
    return qcm(rand, pick(rand, MAKE));
  },
});

/* ------------------------------ La famille et les générations ------------------------------ */

const FAMILY = [
  ['Le père de ma mère est mon…', 'grand-père', ['oncle', 'cousin', 'frère'], 'Les parents de mes parents sont mes grands-parents.'],
  ['La sœur de mon père est ma…', 'tante', ['cousine', 'grand-mère', 'nièce'], 'Les frères et sœurs de mes parents sont mes oncles et mes tantes.'],
  ['Le frère de ma mère est mon…', 'oncle', ['grand-père', 'cousin', 'neveu'], 'Les frères de mes parents sont mes oncles.'],
  ['Le fils de mon oncle est mon…', 'cousin', ['frère', 'neveu', 'oncle'], 'Les enfants de mes oncles et tantes sont mes cousins et cousines.'],
  ['La fille de ma tante est ma…', 'cousine', ['sœur', 'tante', 'grand-mère'], 'Les enfants de mes oncles et tantes sont mes cousins et cousines.'],
  ['Les parents de mes parents sont mes…', 'grands-parents', ['arrière-grands-parents', 'oncles et tantes', 'cousins'], 'Ils appartiennent à la génération d’avant celle de mes parents.'],
  ['La mère de ma grand-mère est mon…', 'arrière-grand-mère', ['grand-mère', 'tante', 'cousine'], 'Moi, mes parents, mes grands-parents, mes arrière-grands-parents : quatre générations.'],
  ['Moi, mes parents et mes grands-parents : combien de générations ?', 'trois', ['deux', 'quatre', 'une'], 'Une génération : les personnes nées à peu près à la même époque dans une famille.'],
  ['La fille de ma sœur est ma…', 'nièce', ['cousine', 'tante', 'fille'], 'Les enfants de mes frères et sœurs sont mes neveux et nièces.'],
  ['Le fils de mon frère est mon…', 'neveu', ['cousin', 'oncle', 'fils'], 'Moi, je suis son oncle ou sa tante.'],
  ['Le mari de ma tante est mon…', 'oncle', ['cousin', 'grand-père', 'neveu'], 'Un oncle peut être le frère d’un parent, ou le mari d’une tante.'],
  ['Les frères et sœurs de mes parents sont mes…', 'oncles et tantes', ['cousins', 'grands-parents', 'neveux'], 'Leurs enfants sont mes cousins et cousines.'],
];
const MY_LIFE = { cp: ['Ma naissance', 'Mes premiers pas', 'Mon entrée à l’école maternelle', 'Mon entrée au CP'], ce1: ['Ma naissance', 'Mes premiers pas', 'Mon entrée à l’école maternelle', 'Mon entrée au CP', 'Mon entrée au CE1'] };
add({
  id: 'hp-famille', subject: 'hg', facts: true, label: 'La famille et les générations', skill: 'hg.p.generations', levels: ['cp', 'ce1'],
  description: 'Qui est qui dans la famille ; les générations ; la frise de ma vie.',
  chapters: ['cp-hg-generations', 'ce1-hg-generations'],
  make(rand, lv) {
    if (rand() < 0.3) return order('Range ces moments de ta vie, du plus ancien au plus récent.', MY_LIFE[lv], 'du plus ancien au plus récent', 'Tout commence par la naissance.');
    return qcm(rand, pick(rand, FAMILY));
  },
});

/* ------------------------------ Français : les sons, les lettres muettes ------------------------------ */

const SOUNDS = [
  ['ou', ['loup', 'roue', 'mouton', 'poule', 'hibou', 'soupe'], ['lapin', 'vélo', 'tasse', 'pirate', 'fusée', 'cheval']],
  ['on', ['ballon', 'mouton', 'pont', 'maison', 'bonbon', 'citron'], ['lapin', 'vélo', 'tulipe', 'salade', 'moto', 'cerise']],
  ['an', ['maman', 'dent', 'enfant', 'éléphant', 'pantalon', 'tambour'], ['moto', 'souris', 'fleur', 'cheval', 'tapis', 'hibou']],
  ['in', ['lapin', 'sapin', 'main', 'pain', 'dauphin', 'jardin'], ['moto', 'soleil', 'banane', 'tortue', 'carotte', 'souris']],
  ['oi', ['roi', 'poisson', 'étoile', 'voiture', 'oiseau', 'noix'], ['lapin', 'tomate', 'cheval', 'fusée', 'pirate', 'lune']],
  ['ch', ['chat', 'cheval', 'chemise', 'vache', 'niche', 'cochon'], ['lapin', 'tomate', 'poule', 'mouton', 'vélo', 'lune']],
  ['o', ['bateau', 'gâteau', 'chapeau', 'auto', 'moto', 'vélo'], ['lapin', 'souris', 'fusée', 'tulipe', 'cerise', 'lune']],
  ['eu', ['feu', 'cheveu', 'jeudi', 'fleur', 'bleu', 'heure'], ['lapin', 'moto', 'sapin', 'tasse', 'cabane', 'tortue']],
];
const MUET = [['chat', 't', 'chaton'], ['loup', 'p', 'louve'], ['lait', 't', 'laitier'], ['dent', 't', 'dentiste'], ['bavard', 'd', 'bavarder'], ['long', 'g', 'longue'], ['gros', 's', 'grosse'], ['petit', 't', 'petite'],
  ['sirop', 'p', 'siroter'], ['tapis', 's', 'tapisser'], ['galop', 'p', 'galoper'], ['chant', 't', 'chanteur'], ['blanc', 'c', 'blanche'], ['sport', 't', 'sportif'], ['bond', 'd', 'bondir'], ['plomb', 'b', 'plombier']];
add({
  id: 'fr-p-sons', subject: 'francais', facts: true, label: 'Entendre les sons, trouver les lettres muettes', skill: 'fp.sons', levels: ['cp', 'ce1', 'ce2'],
  description: 'CP-CE1 : dans quel mot entend-on le son « ou », « on », « in »… ? CE2 : la lettre muette d’un mot, retrouvée grâce à un mot de la même famille.',
  chapters: ['cp-f-code-1', 'ce1-f-decodage', 'ce2-f-decodage'],
  make(rand, lv, hard) {
    if (lv === 'ce2' || (lv === 'ce1' && hard)) {
      const [w, letter, family] = pick(rand, MUET);
      return text([letter, `le ${letter}`, `un ${letter}`, `-${letter}`], {
        prompt: `Le mot « ${w} » se termine par une lettre muette, qu’on écrit sans l’entendre. Laquelle ? (Pense au mot « ${family} ».)`,
        expectedSeconds: 25, representation: 'verbale', hints: [`Dans « ${family} », on entend la lettre qui est muette dans « ${w} ».`], solution: `« ${w} » : la lettre muette est « ${letter} », qu’on entend dans « ${family} ».`,
      });
    }
    const [sound, withS, without] = pick(rand, SOUNDS);
    const good = pick(rand, withS);
    return qcm(rand, [`Dans quel mot entend-on le son « ${sound} » ?`, good, without, `On entend « ${sound} » dans « ${good} ».`], { hint: 'Dis chaque mot à voix haute, lentement, syllabe par syllabe.', expectedSeconds: 30 });
  },
});

/* ------------------------------ Français : la phrase ------------------------------ */

// [phrase, sujet, verbe, COD (ou null), [complément circonstanciel, sorte]]
const PHRASES = [
  ['Chaque matin, Léa promène son chien dans le parc.', 'Léa', 'promène', 'son chien', ['dans le parc', 'de lieu']],
  ['Les hirondelles construisent leur nid sous le toit.', 'Les hirondelles', 'construisent', 'leur nid', ['sous le toit', 'de lieu']],
  ['Demain, mon grand frère passera son examen.', 'mon grand frère', 'passera', 'son examen', ['Demain', 'de temps']],
  ['Dans la cuisine, papa prépare une soupe de légumes.', 'papa', 'prépare', 'une soupe de légumes', ['Dans la cuisine', 'de lieu']],
  ['Le boulanger cuit le pain très tôt.', 'Le boulanger', 'cuit', 'le pain', ['très tôt', 'de temps']],
  ['En hiver, les ours dorment dans leur tanière.', 'les ours', 'dorment', null, ['En hiver', 'de temps']],
  ['Pendant les vacances, Hugo a visité un château.', 'Hugo', 'a visité', 'un château', ['Pendant les vacances', 'de temps']],
  ['Ma petite sœur dessine un dragon avec ses feutres.', 'Ma petite sœur', 'dessine', 'un dragon', ['avec ses feutres', 'de moyen']],
  ['Au marché, les clients achètent des fruits.', 'les clients', 'achètent', 'des fruits', ['Au marché', 'de lieu']],
  ['Le facteur distribue le courrier chaque jour.', 'Le facteur', 'distribue', 'le courrier', ['chaque jour', 'de temps']],
  ['Dans la forêt, un renard guette un lapin.', 'un renard', 'guette', 'un lapin', ['Dans la forêt', 'de lieu']],
  ['Cet été, nos voisins partiront en Espagne.', 'nos voisins', 'partiront', null, ['Cet été', 'de temps']],
];
const INVERTED = [
  ['Dans le ciel brillent les étoiles.', 'les étoiles', 'brillent', null, ['Dans le ciel', 'de lieu']],
  ['Au loin apparaît un bateau.', 'un bateau', 'apparaît', null, ['Au loin', 'de lieu']],
  ['Sur la colline se dresse un vieux moulin.', 'un vieux moulin', 'se dresse', null, ['Sur la colline', 'de lieu']],
  ['Au fond du jardin pousse un grand cerisier.', 'un grand cerisier', 'pousse', null, ['Au fond du jardin', 'de lieu']],
];
const ROLE_Q = {
  sujet: (p) => `Dans la phrase « ${p[0]} », quel est le sujet du verbe « ${p[2]} » ?`,
  verbe: (p) => `Dans la phrase « ${p[0]} », quel est le verbe conjugué ?`,
  cod: (p) => `Dans la phrase « ${p[0]} », quel est le complément d’objet du verbe « ${p[2]} » ?`,
  cc: (p) => `Dans la phrase « ${p[0]} », quel groupe est un complément circonstanciel ${p[4][1]} ?`,
};
const ROLE_WHY = {
  sujet: (p) => `Qui est-ce qui ${p[2]} ? « ${p[1]} » : c’est le sujet. On peut l’encadrer : « C’est ${p[1][0].toLowerCase()}${p[1].slice(1)} qui ${p[2]}. »`,
  verbe: (p) => `« ${p[2]} » est le verbe : il change si l’on parle à un autre moment (hier, demain).`,
  cod: (p) => `${p[1]} ${p[2]} quoi ? « ${p[3]} » : il complète directement le verbe, et on ne peut pas le déplacer en tête de phrase.`,
  cc: (p) => `« ${p[4][0]} » est un complément circonstanciel ${p[4][1]} : on peut le déplacer ou le supprimer.`,
};
add({
  id: 'fr-p-phrase', subject: 'francais', label: 'Analyser la phrase : sujet, verbe, compléments', skill: 'fp.phrase', levels: ['cm1', 'cm2'],
  description: 'Trouver le verbe conjugué, son sujet (même inversé au CM2), le complément d’objet et les compléments circonstanciels.',
  chapters: ['cm1-f-phrase', 'cm2-f-phrase'],
  make(rand, lv, hard) {
    const p = pick(rand, lv === 'cm2' && (hard || rand() < 0.3) ? INVERTED : PHRASES);
    const roles = ['sujet', 'verbe', 'cc', ...(p[3] ? ['cod'] : [])];
    const role = pick(rand, roles);
    const groups = [p[1], p[2], p[3], p[4][0]].filter(Boolean);
    const good = { sujet: p[1], verbe: p[2], cod: p[3], cc: p[4][0] }[role];
    const others = groups.filter((g) => g !== good);
    return qcm(rand, [ROLE_Q[role](p), good, others, ROLE_WHY[role](p)], {
      hint: role === 'sujet' ? 'Pose la question « Qui est-ce qui… ? » devant le verbe, ou encadre par « C’est… qui ».' : role === 'verbe' ? 'Change le moment : « Hier… », « Demain… ». Le mot qui change est le verbe.' : role === 'cod' ? 'Pose la question « … quoi ? » ou « … qui ? » juste après le verbe.' : 'Un complément circonstanciel peut se déplacer ou se supprimer ; il répond à « où ? », « quand ? », « comment ? ».',
      expectedSeconds: 40,
    });
  },
});

/* ------------------------------ Le robot sur le quadrillage ------------------------------ */

const COLS = ['A', 'B', 'C', 'D', 'E', 'F'];
const MOVES = { '→': [1, 0], '←': [-1, 0], '↑': [0, 1], '↓': [0, -1] };
const cellName = (x, y) => `${COLS[x]}${y + 1}`;
/** Quadrillage en tableau : colonnes A, B, C… de gauche à droite, lignes numérotées de bas en haut. */
function gridFigure(n, robot, star) {
  const head = [' ', ...COLS.slice(0, n)];
  const rows = [];
  for (let y = n - 1; y >= 0; y--) rows.push([String(y + 1), ...COLS.slice(0, n).map((_, x) => (x === robot[0] && y === robot[1] ? '🤖' : star && x === star[0] && y === star[1] ? '⭐' : ''))]);
  return { alt: `Quadrillage de ${n} colonnes (A à ${COLS[n - 1]}) et ${n} lignes (1 à ${n}, de bas en haut). Le robot est en ${cellName(...robot)}${star ? `, l’étoile en ${cellName(...star)}` : ''}.`, items: [{ type: 'table', head, rows }] };
}
function walk(rand, n, len) {
  for (;;) {
    let x = ri(rand, 0, n - 1); let y = ri(rand, 0, n - 1);
    const start = [x, y]; const prog = [];
    let ok = true;
    for (let k = 0; k < len; k++) {
      const last = prog[prog.length - 1];
      const back = last ? Object.keys(MOVES).find((m) => MOVES[m][0] === -MOVES[last][0] && MOVES[m][1] === -MOVES[last][1]) : null;
      // pas d'aller-retour (↑ puis ↓) : un programme qui va droit au but
      const options = Object.keys(MOVES).filter((m) => { const [dx, dy] = MOVES[m]; return m !== back && x + dx >= 0 && x + dx < n && y + dy >= 0 && y + dy < n; });
      if (!options.length) { ok = false; break; }
      const m = pick(rand, options);
      prog.push(m); x += MOVES[m][0]; y += MOVES[m][1];
    }
    if (ok && (x !== start[0] || y !== start[1])) return { start, end: [x, y], prog };
  }
}
const run = (start, prog) => prog.reduce(([x, y], m) => [x + MOVES[m][0], y + MOVES[m][1]], start);
const accepts = (x, y) => { const c = COLS[x]; const r = y + 1; return [`${c}${r}`, `${c} ${r}`, `(${c},${r})`, `(${c};${r})`, `${c},${r}`, `${c};${r}`, `${c}-${r}`, `(${c}, ${r})`, `(${c} ; ${r})`]; };
const ROBOT_HINT = 'Une flèche = une case. → à droite, ← à gauche, ↑ vers le haut, ↓ vers le bas. Suis le chemin case par case avec ton doigt.';
function robot(rand, lv, hard) {
  const n = lv === 'cp' ? 4 : lv === 'ce1' ? 5 : 6;
  const len = { cp: 3, ce1: 4, cm1: 5, cm2: 6 }[lv] + (hard ? 1 : 0);
  const w = walk(rand, n, len);
  const k = pick(rand, lv === 'cp' ? ['ou', 'ou', 'quel'] : lv === 'ce1' ? ['ou', 'quel'] : ['ou', 'quel', 'boucle']);
  const progText = (p) => p.join(' ');
  if (k === 'quel') {
    // quel programme mène le robot à l'étoile ? (les autres finissent ailleurs)
    const wrong = [];
    for (let t = 0; t < 40 && wrong.length < 3; t++) {
      const alt = w.prog.slice();
      const i = ri(rand, 0, alt.length - 1);
      alt[i] = pick(rand, Object.keys(MOVES).filter((m) => m !== alt[i]));
      if (t % 3 === 2) alt.reverse();
      const e = run(w.start, alt);
      const inside = alt.every((_, j) => { const [x, y] = run(w.start, alt.slice(0, j + 1)); return x >= 0 && y >= 0 && x < n && y < n; });
      if (inside && (e[0] !== w.end[0] || e[1] !== w.end[1]) && !wrong.includes(progText(alt))) wrong.push(progText(alt));
    }
    return qcm(rand, ['Quel programme conduit le robot 🤖 jusqu’à l’étoile ⭐ ?', progText(w.prog), wrong, `Le bon programme : ${progText(w.prog)}, du robot en ${cellName(...w.start)} jusqu’à l’étoile en ${cellName(...w.end)}.`],
      { figure: gridFigure(n, w.start, w.end), hint: ROBOT_HINT, expectedSeconds: 60, representation: 'visuelle' });
  }
  if (k === 'boucle') {
    // une boucle « répéter » : n fois la même flèche, puis une autre
    const dirs = Object.keys(MOVES);
    for (let t = 0; t < 60; t++) {
      const start = [ri(rand, 0, n - 1), ri(rand, 0, n - 1)];
      const a = pick(rand, dirs); const b = pick(rand, dirs.filter((d) => (MOVES[d][0] === 0) !== (MOVES[a][0] === 0))); // b perpendiculaire à a
      const times = ri(rand, 2, hard ? 4 : 3);
      const prog = [...Array(times).fill(a), b];
      const e = run(start, prog);
      const inside = prog.every((_, j) => { const [x, y] = run(start, prog.slice(0, j + 1)); return x >= 0 && y >= 0 && x < n && y < n; });
      if (!inside) continue;
      return text(accepts(...e), {
        prompt: `Le robot 🤖 exécute ce programme : « répéter ${times} fois [ ${a} ], puis ${b} ». Sur quelle case arrive-t-il ? (Écris la lettre puis le chiffre, par exemple B3.)`,
        figure: gridFigure(n, start, null), expectedSeconds: 60, representation: 'visuelle',
        hints: [`« Répéter ${times} fois [ ${a} ] », c’est ${Array(times).fill(a).join(' ')}.`, ROBOT_HINT], solution: `${prog.join(' ')} : de ${cellName(...start)} à ${cellName(...e)}.`,
      });
    }
  }
  return text(accepts(...w.end), {
    prompt: `Le robot 🤖 suit ce programme : ${progText(w.prog)}. Sur quelle case arrive-t-il ? (Écris la lettre puis le chiffre, par exemple B3.)`,
    figure: gridFigure(n, w.start, null), expectedSeconds: 60, representation: 'visuelle',
    hints: [ROBOT_HINT, 'La lettre de la colonne (en haut), puis le numéro de la ligne (à gauche).'], solution: `De ${cellName(...w.start)}, ${progText(w.prog)} : le robot arrive en ${cellName(...w.end)}.`,
  });
}
add({
  id: 'pm-robot', subject: 'maths', label: 'Guider un robot sur un quadrillage', skill: 'mp.espace-codage', levels: ['cp', 'ce1'],
  description: 'Coder et décoder un déplacement avec des flèches ; repérer une case par sa colonne et sa ligne.',
  chapters: ['cp-m-espace', 'ce1-m-espace'],
  make: robot,
});
add({
  id: 'st-p-programmer', subject: 'sciences-techno', label: 'Programmer un robot : séquences et boucles', skill: 'sciences-techno.p.programmer', levels: ['cm1', 'cm2'],
  description: 'Lire un programme de déplacement, choisir le bon programme, comprendre une boucle « répéter ».',
  chapters: ['cm1-st-programmation', 'cm2-st-programmation'],
  make: robot,
});

export const PRIMAIRE_SAVOIRS = GEN;
export const PRIMAIRE_SAVOIRS_SKILLS = [
  { subject: 'sciences-techno', id: 'sciences-techno.p.systeme-solaire', label: 'Connaître le système solaire : planètes, Soleil, Lune, jour et nuit, saisons', level: 'cm1' },
  { subject: 'hg', id: 'hg.p.astres', label: 'Situer la Terre, le Soleil et la Lune ; le jour, l’année, les saisons', level: 'ce1' },
  { subject: 'sciences-techno', id: 'sciences-techno.p.digestion', label: 'Décrire la digestion, la respiration et la circulation sanguine', level: 'cm2' },
  { subject: 'sciences-techno', id: 'sciences-techno.p.chaines', label: 'Construire une chaîne alimentaire ; producteurs, consommateurs, décomposeurs', level: 'cm1' },
  { subject: 'sciences-techno', id: 'sciences-techno.p.vitesse', label: 'Relier distance, durée et vitesse d’un mouvement régulier', level: 'cm1' },
  { subject: 'sciences-techno', id: 'sciences-techno.p.masses', label: 'Comparer et mesurer des masses, des volumes, des températures', level: 'cp' },
  { subject: 'sciences-techno', id: 'sciences-techno.p.eau', label: 'Connaître l’eau solide et l’eau liquide', level: 'cp' },
  { subject: 'qlm', id: 'qlm.p.eau', label: 'L’eau liquide et la glace : température, volume, masse', level: 'ce1' },
  { subject: 'sciences-techno', id: 'sciences-techno.p.cerveau', label: 'Le cerveau, les sens, l’attention et la mémoire', level: 'cm1' },
  { subject: 'sciences-techno', id: 'sciences-techno.p.fabriquer', label: 'Ordonner les étapes d’une fabrication et de la vie d’un objet', level: 'cm2' },
  { subject: 'hg', id: 'hg.p.generations', label: 'Nommer les liens de parenté ; situer les générations', level: 'cp' },
  { subject: 'francais', id: 'fp.sons', label: 'Repérer un son dans un mot ; trouver une lettre muette', level: 'cp' },
  { subject: 'francais', id: 'fp.phrase', label: 'Identifier verbe, sujet, complément d’objet et compléments circonstanciels', level: 'cm1' },
  { subject: 'maths', id: 'mp.espace-codage', label: 'Coder et décoder un déplacement sur un quadrillage', level: 'cp' },
  { subject: 'sciences-techno', id: 'sciences-techno.p.programmer', label: 'Programmer un déplacement : séquences d’instructions et boucles', level: 'cm1' },
].map((s) => ({ ...s, track: 'classe', status: 'programme', domain: 'primaire', prereqs: [], editorialLevel: true }));
