/**
 * Ordre de grandeur : estimer une mesure (hauteur, distance, masse, durée, nombre…). Plus l'estimation est proche de
 * la vraie valeur, plus elle rapporte d'étoiles : on mesure l'écart par un rapport (deux fois trop ou deux fois trop
 * peu, c'est la même erreur), ce qui convient aussi bien aux petits nombres qu'aux distances astronomiques.
 * À deux, le plus proche de la vraie valeur marque le point. Moteur pur.
 */

/** [id, question, valeur, unité, explication] par niveau : p (école), c (collège), l (lycée). */
const Q = {
  p: [
    ['porte', 'Quelle est la hauteur d’une porte de maison, en mètres ?', 2, 'm', 'Une porte mesure environ 2 m : un peu plus que la taille d’un adulte.'],
    ['litre-eau', 'Quelle est la masse d’un litre d’eau, en kilogrammes ?', 1, 'kg', 'Un litre d’eau a une masse de 1 kg.'],
    ['terrain-foot', 'Quelle est la longueur d’un terrain de football, en mètres ?', 105, 'm', 'Environ 100 à 110 m : 105 m pour les grands stades.'],
    ['baguette', 'Quelle est la masse d’une baguette de pain, en grammes ?', 250, 'g', 'Une baguette pèse environ 250 g.'],
    ['tour-eiffel', 'Quelle est la hauteur de la tour Eiffel, en mètres ?', 330, 'm', 'Environ 330 m avec ses antennes : plus de cent étages d’immeuble.'],
    ['match', 'Combien de minutes dure un match de football, sans les prolongations ?', 90, 'min', 'Deux mi-temps de 45 minutes.'],
    ['elephant', 'Quelle est la masse d’un éléphant d’Afrique adulte, en kilogrammes ?', 6000, 'kg', 'Environ 6 tonnes, soit 6 000 kg : le plus lourd des animaux terrestres.'],
    ['voiture', 'Quelle est la longueur d’une voiture, en mètres ?', 4, 'm', 'Une voiture mesure environ 4 m de long.'],
    ['corps', 'Quelle est la température normale du corps humain, en degrés Celsius ?', 37, '°C', 'Environ 37 °C ; au-dessus de 38 °C, on a de la fièvre.'],
    ['immeuble', 'Quelle est la hauteur d’un immeuble de 10 étages, en mètres ?', 30, 'm', 'Environ 3 m par étage : 30 m.'],
    ['os', 'Combien d’os compte le squelette d’un adulte ?', 206, 'os', 'Un adulte a 206 os ; un bébé en a davantage, qui se soudent en grandissant.'],
    ['marche', 'À quelle vitesse marche-t-on, en kilomètres par heure ?', 5, 'km/h', 'Environ 5 km/h en marchant d’un bon pas.'],
    ['pomme', 'Quelle est la masse d’une pomme, en grammes ?', 150, 'g', 'Une pomme pèse environ 150 g.'],
    ['dents', 'Combien de dents a un adulte (dents de sagesse comprises) ?', 32, 'dents', 'Un adulte a 32 dents ; un enfant a 20 dents de lait.'],
  ],
  c: [
    ['terre-lune', 'Quelle est la distance entre la Terre et la Lune, en kilomètres ?', 384000, 'km', 'Environ 384 000 km : la lumière les parcourt en un peu plus d’une seconde.'],
    ['terre-soleil', 'Quelle est la distance entre la Terre et le Soleil, en millions de kilomètres ?', 150, 'millions de km', 'Environ 150 millions de km.'],
    ['lumiere', 'Quelle est la vitesse de la lumière, en kilomètres par seconde ?', 300000, 'km/s', 'Environ 300 000 km par seconde dans le vide.'],
    ['son', 'Quelle est la vitesse du son dans l’air, en mètres par seconde ?', 340, 'm/s', 'Environ 340 m/s : environ un kilomètre en trois secondes.'],
    ['france', 'Combien d’habitants compte la France, en millions ?', 68, 'millions', 'Environ 68 millions d’habitants.'],
    ['monde', 'Combien d’habitants compte la Terre, en milliards ?', 8, 'milliards', 'Plus de 8 milliards d’habitants.'],
    ['everest', 'Quelle est l’altitude de l’Everest, en mètres ?', 8849, 'm', 'L’Everest culmine à 8 849 m.'],
    ['diametre-terre', 'Quel est le diamètre de la Terre, en kilomètres ?', 12742, 'km', 'Environ 12 700 km.'],
    ['loire', 'Quelle est la longueur de la Loire, le plus long fleuve de France, en kilomètres ?', 1000, 'km', 'Environ 1 000 km.'],
    ['mariannes', 'Quelle est la profondeur de la fosse des Mariannes, en mètres ?', 11000, 'm', 'Près de 11 000 m : l’endroit le plus profond des océans.'],
    ['baleine', 'Quelle peut être la masse d’une baleine bleue adulte, en tonnes ?', 150, 't', 'Jusqu’à environ 150 tonnes : le plus gros animal ayant jamais vécu.'],
    ['age-terre', 'Quel est l’âge de la Terre, en milliards d’années ?', 4.5, 'milliards d’années', 'Environ 4,5 milliards d’années.'],
    ['soleil-terre', 'Combien de minutes met la lumière du Soleil pour arriver jusqu’à nous ?', 8, 'min', 'Environ 8 minutes.'],
    ['onu', 'Combien d’États sont membres de l’ONU ?', 193, 'États', '193 États membres.'],
  ],
  l: [
    ['atome', 'Quelle est la taille d’un atome, en nanomètres ?', 0.1, 'nm', 'Environ 0,1 nm, soit un dix-milliardième de mètre.'],
    ['globule', 'Quel est le diamètre d’un globule rouge, en micromètres ?', 7, 'µm', 'Environ 7 µm.'],
    ['avogadro', 'Le nombre d’Avogadro vaut environ 6 × 10ⁿ : quel est l’exposant n ?', 23, '', 'N_A ≈ 6,02 × 10²³ entités par mole.'],
    ['masse-terre', 'La masse de la Terre vaut environ 6 × 10ⁿ kg : quel est l’exposant n ?', 24, '', 'Environ 6 × 10²⁴ kg.'],
    ['proxima', 'À quelle distance se trouve Proxima du Centaure, l’étoile la plus proche du Soleil, en années-lumière ?', 4.2, 'années-lumière', 'Environ 4,2 années-lumière.'],
    ['univers', 'Quel est l’âge de l’Univers, en milliards d’années ?', 13.8, 'milliards d’années', 'Environ 13,8 milliards d’années.'],
    ['neurones', 'Combien de neurones compte un cerveau humain, en milliards ?', 86, 'milliards', 'Environ 86 milliards de neurones.'],
    ['adn', 'Quelle est la longueur totale de l’ADN d’une cellule humaine, une fois déroulé, en mètres ?', 2, 'm', 'Environ 2 m, replié dans un noyau de quelques micromètres.'],
    ['pression', 'Quelle est la pression atmosphérique normale au niveau de la mer, en hectopascals ?', 1013, 'hPa', 'Environ 1 013 hPa.'],
    ['reacteur', 'Quelle est la puissance électrique d’un réacteur nucléaire, en mégawatts ?', 1000, 'MW', 'Environ 900 à 1 450 MW selon les réacteurs français.'],
    ['lune-humains', 'Combien d’êtres humains ont marché sur la Lune ?', 12, 'personnes', 'Douze astronautes, entre 1969 et 1972.'],
    ['lumiere-an', 'Combien de kilomètres parcourt la lumière en une année, en milliers de milliards de km ?', 9.5, 'milliers de milliards de km', 'Une année-lumière vaut environ 9 500 milliards de km.'],
  ],
};
export const ESTIME_QUESTIONS = Object.fromEntries(Object.entries(Q).map(([tier, list]) => [tier, list.map(([id, q, value, unit, why]) => ({ id: `${tier}-${id}`, q, value, unit, why }))]));

/** Questions d'une classe : l'école, le collège (avec celles de l'école en 6e), le lycée (avec celles du collège). */
export function questionsFor(level) {
  const lv = String(level || '').toLowerCase();
  if (['cp', 'ce1', 'ce2', 'cm1', 'cm2'].includes(lv)) return ESTIME_QUESTIONS.p;
  if (lv === '6e') return [...ESTIME_QUESTIONS.p, ...ESTIME_QUESTIONS.c];
  if (['5e', '4e', '3e'].includes(lv)) return ESTIME_QUESTIONS.c;
  return [...ESTIME_QUESTIONS.c, ...ESTIME_QUESTIONS.l];
}

/** Lecture d'une estimation : « 384 000 », « 4,5 », « 0.1 ». */
export function parseEstimate(text) {
  const s = String(text || '').replace(/[\s  ]/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const v = Number(s);
  return v > 0 ? v : null;
}

/** Écart d'une estimation : le rapport (≥ 1) entre la plus grande et la plus petite des deux valeurs. */
export const ratioOf = (guess, value) => Math.max(guess / value, value / guess);
/** Étoiles d'une estimation : à 10 % près 3, à 50 % près 2, à un facteur 3 près 1, sinon 0. */
export function estimateStars(guess, value) {
  const r = ratioOf(guess, value);
  return r <= 1.1 ? 3 : r <= 1.5 ? 2 : r <= 3 ? 1 : 0;
}
/** Le plus proche parmi plusieurs estimations (indices ; plusieurs en cas d'égalité). */
export function closest(guesses, value) {
  const rs = guesses.map((g) => ratioOf(g, value));
  const best = Math.min(...rs);
  return rs.map((r, i) => (Math.abs(r - best) < 1e-9 ? i : -1)).filter((i) => i >= 0);
}

const shuffle = (arr, rand) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pickQuestions = (level, count = 6, rand = Math.random) => shuffle(questionsFor(level), rand).slice(0, count);

/** Nombre lisible : 384 000 ; 4,5 ; 0,1. */
export const fmtValue = (v) => {
  const [i, d] = String(v).split('.');
  return `${i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}${d ? `,${d}` : ''}`;
};
