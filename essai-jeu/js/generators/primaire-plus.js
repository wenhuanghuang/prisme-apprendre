/**
 * Générateurs complémentaires de l'école primaire : dictées (CP → CE2), étapes à remettre dans l'ordre (cycles de
 * vie, phases de la Lune, moments de la journée et saisons), orientation sur une carte. Rattachés aux chapitres.
 */
import { pick, sample, text } from './gen-util.js';
import { qcm } from './primaire-savoirs.js';

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
const mcw = (word, id, feedback, error = 'orthographe') => ({ word, id, error, feedback });

/* ------------------------------ Dictées ------------------------------ */

const IN = 'Le son « in » s’écrit ici avec les lettres i-n.';
const MUETTE = 'Ce mot se termine par une lettre muette : on ne l’entend pas, mais on l’écrit.';
const CP_WORDS = [
  ['papa'], ['maman'], ['lune'], ['vélo'], ['moto'], ['ami'], ['école'], ['tomate'], ['pirate'], ['salade'], ['domino'], ['robe'],
  ['lapin', [mcw('lapain', 'mc:graphie-in', IN)]], ['matin', [mcw('matain', 'mc:graphie-in', IN)]], ['sapin', [mcw('sapain', 'mc:graphie-in', IN)]], ['jardin', [mcw('jardain', 'mc:graphie-in', IN)]],
  ['chat', [mcw('cha', 'mc:lettre-muette', MUETTE)]], ['souris', [mcw('souri', 'mc:lettre-muette', MUETTE)]],
];
const CE1_WORDS = [
  ['aujourd\'hui', [mcw('aujourdhui', 'mc:apostrophe', 'Aujourd’hui s’écrit avec une apostrophe : aujourd’hui.')]], ['beaucoup', [mcw('beaucou', 'mc:lettre-muette', MUETTE)]],
  ['toujours', [mcw('toujour', 'mc:lettre-muette', MUETTE)]], ['maintenant', [mcw('maintenan', 'mc:lettre-muette', MUETTE)]], ['souvent', [mcw('souvant', 'mc:graphie-en', 'Ici, le son « an » s’écrit « en ».')]],
  ['ensuite'], ['pendant', [mcw('pandant', 'mc:graphie-en', 'Ici, le premier son « an » s’écrit « en » : pendant.')]], ['avec'], ['dans'], ['après', [mcw('aprè', 'mc:lettre-muette', MUETTE)]],
  ['avant'], ['comme', [mcw('come', 'mc:double-consonne', 'Comme s’écrit avec deux m.')]], ['quand', [mcw('quan', 'mc:lettre-muette', MUETTE), mcw('kan', 'mc:graphie-qu', 'Le son « k » s’écrit ici « qu ».')]],
  ['demain'], ['hier'], ['encore'], ['très', [mcw('trè', 'mc:lettre-muette', MUETTE)]], ['bientôt'], ['longtemps', [mcw('lontemps', 'mc:lettre-muette', 'Longtemps : long + temps, avec un g et un p muets.')]],
];
const CE2_SENTENCES = [
  ['Les enfants jouent dans la cour.', [mcw('joue', 'mc:accord-sujet-verbe', 'Le sujet « les enfants » est au pluriel : jouent.', 'notion')]],
  ['Le petit chat noir dort sur le lit.', [mcw('dors', 'mc:accord-sujet-verbe', 'Avec « le chat » (il), dormir fait « dort ».', 'notion')]],
  ['Nous mangeons des pommes rouges.', [mcw('rouge', 'mc:accord-adjectif', 'L’adjectif s’accorde avec « pommes » : rouges.', 'notion'), mcw('mangons', 'mc:graphie-ge', 'Avec « nous », manger garde le e : mangeons.')]],
  ['Les oiseaux chantent dans les arbres.', [mcw('chante', 'mc:accord-sujet-verbe', 'Le sujet « les oiseaux » est au pluriel : chantent.', 'notion'), mcw('oiseaus', 'mc:pluriel-eau', 'Les noms en -eau prennent un x au pluriel.')]],
  ['Il y a beaucoup de fleurs dans le jardin.', [mcw('beaucou', 'mc:lettre-muette', MUETTE), mcw('fleur', 'mc:pluriel', '« Beaucoup de fleurs » : fleurs est au pluriel.', 'notion')]],
  ['Demain, nous irons à la piscine.', [mcw('a', 'mc:homophone-a-a', 'On ne peut pas dire « avait la piscine » : c’est « à ».', 'notion')]],
  ['Ma sœur et moi aimons les gâteaux.', [mcw('aimont', 'mc:accord-sujet-verbe', '« Ma sœur et moi », c’est « nous » : aimons.', 'notion'), mcw('gateaux', 'mc:accent', 'Gâteau prend un accent circonflexe sur le a.')]],
  ['Le maître lit une histoire aux élèves.', [mcw('lie', 'mc:accord-sujet-verbe', 'Lire, avec « il » : il lit.', 'notion')]],
  ['Elles sont parties en vacances.', [mcw('parti', 'mc:accord-participe', 'Avec être, le participe passé s’accorde avec le sujet « elles » : parties.', 'notion')]],
  ['Mon frère a perdu ses clés.', [mcw('à', 'mc:homophone-a-a', '« Mon frère avait perdu » : c’est le verbe avoir, « a » sans accent.', 'notion'), mcw('ces', 'mc:homophone-ces-ses', 'Ce sont les clés de mon frère (les siennes) : ses.', 'notion')]],
];

add({
  id: 'fr-p-dictee', subject: 'francais', label: 'Dictées : mots, mots fréquents, phrases', skill: 'fp.dictee', levels: ['cp', 'ce1', 'ce2'],
  description: 'Écouter puis écrire : des mots simples au CP, les mots invariables fréquents au CE1, de courtes phrases avec leurs accords au CE2 (voix française de l’ordinateur).',
  chapters: ['cp-f-encoder', 'cp-f-code-2', 'ce1-f-dictee', 'ce1-f-orthographe', 'ce2-f-dictee'],
  make(rand, lv, hard) {
    const pool = lv === 'cp' ? CP_WORDS : lv === 'ce1' ? CE1_WORDS : CE2_SENTENCES;
    // ◆ : deux mots (ou deux phrases) à la suite
    const picks = hard ? sample(rand, pool, 2) : [pick(rand, pool)];
    const answer = picks.map(([w]) => w).join(lv === 'ce2' ? ' ' : ' ');
    const misconceptions = picks.flatMap(([, m]) => m || []);
    const isSentence = lv === 'ce2';
    return {
      type: 'dictation', prompt: isSentence ? 'Écoute la phrase, puis écris-la.' : `Écoute, puis écris ${picks.length > 1 ? 'les deux mots' : 'le mot'}.`,
      answer, audio: { text: answer.replace(/'/g, '’'), lang: 'fr-FR' }, misconceptions, generatedAnswer: { value: answer },
      expectedSeconds: isSentence ? 90 : 40, representation: 'verbale', difficulty: hard ? 3 : 2,
      hints: [isSentence ? 'Écoute la phrase en entier, puis mot par mot. Pense aux accords (pluriel, sujet-verbe).' : 'Écoute bien chaque son ; pense aux lettres muettes à la fin des mots.'],
      solution: `${isSentence ? 'La phrase' : 'Le mot'} s’écrit : ${answer.replace(/'/g, '’')}`,
    };
  },
});

/* ------------------------------ Ordres : cycles de vie, Lune, temps ------------------------------ */

const order = (prompt, steps, label = 'du premier au dernier', hint = 'Commence par ce qui arrive en premier.') => ({
  type: 'order', prompt, orderLabel: label, errorType: 'notion', representation: 'visuelle', expectedSeconds: 60,
  items: steps.map((s, i) => ({ id: `s${i + 1}`, label: s })), hints: [hint], solution: steps.join(' → '),
});

const CYCLES = [
  ['du papillon', ['L’œuf', 'La chenille', 'La chrysalide', 'Le papillon adulte']],
  ['de la grenouille', ['L’œuf', 'Le têtard', 'Le têtard avec des pattes', 'La grenouille adulte']],
  ['de la poule', ['L’œuf', 'Le poussin', 'La jeune poule', 'La poule adulte']],
  ['d’une plante à fleurs', ['La graine', 'La germination : la graine s’ouvre', 'La jeune plante', 'La plante en fleurs', 'Le fruit et ses graines']],
  ['de l’être humain', ['Le bébé', 'L’enfant', 'L’adolescent', 'L’adulte', 'La personne âgée']],
  ['de la coccinelle', ['L’œuf', 'La larve', 'La nymphe', 'La coccinelle adulte']],
  ['du moustique', ['L’œuf, posé sur l’eau', 'La larve, qui vit dans l’eau', 'La nymphe', 'Le moustique adulte, qui vole']],
  ['du haricot', ['La graine de haricot', 'La germination', 'La jeune pousse et ses premières feuilles', 'La plante en fleurs', 'La gousse et ses graines']],
  ['de l’abeille', ['L’œuf, dans une alvéole', 'La larve', 'La nymphe', 'L’abeille adulte']],
];
add({
  id: 'qlm-p-cycles', subject: 'qlm', facts: true, label: 'Les cycles de vie', skill: 'qlm.p.cycles', levels: ['ce1', 'ce2'],
  description: 'Remettre dans l’ordre les étapes de la vie du papillon, de la grenouille, de la poule, d’une plante, de l’être humain.',
  chapters: ['ce1-qlm-cycle-vie', 'ce1-qlm-plantes', 'ce1-qlm-croissance'],
  make(rand) {
    const [who, steps] = pick(rand, CYCLES);
    return order(`Range les étapes de la vie ${who}, de la première à la dernière.`, steps, 'de la première à la dernière étape', 'Tout commence par un œuf, une graine ou une naissance.');
  },
});

const MOON_Q = [
  ['La Lune brille parce qu’elle…', 'renvoie la lumière du Soleil', ['produit sa propre lumière', 'est en feu', 'est couverte de volcans en éruption'], 'La Lune n’a pas de lumière à elle : elle est éclairée par le Soleil.'],
  ['Combien de temps faut-il pour revoir la même phase de la Lune ?', 'environ un mois (29 jours et demi)', ['un jour', 'une semaine', 'un an'], 'C’est l’origine du mot « mois ».'],
  ['Pourquoi voit-on toujours la même face de la Lune ?', 'elle tourne sur elle-même en autant de temps qu’elle tourne autour de la Terre', ['elle ne tourne pas du tout', 'l’autre face est toujours dans le noir', 'la Terre la cache'], 'Les deux mouvements durent environ 27 jours.'],
  ['À la pleine lune, la Lune est…', 'entièrement éclairée vue de la Terre', ['invisible', 'éclairée à moitié', 'deux fois plus grosse'], 'Le Soleil, la Terre et la Lune sont presque alignés, la Terre au milieu.'],
  ['Le premier homme à marcher sur la Lune, en 1969, s’appelle…', 'Neil Armstrong', ['Youri Gagarine', 'Thomas Pesquet', 'Christophe Colomb'], 'Gagarine fut le premier humain dans l’espace, en 1961.'],
  ['Les marées sont surtout causées par…', 'l’attraction de la Lune (et du Soleil)', ['le vent', 'les bateaux', 'la pluie'], 'La Lune attire l’eau des océans : la mer monte et descend environ deux fois par jour.'],
  ['Pourquoi n’y a-t-il ni vent ni pluie sur la Lune ?', 'elle n’a presque pas d’atmosphère', ['elle est trop petite pour avoir de l’eau', 'elle est trop chaude', 'il y fait toujours nuit'], 'Sans air ni vent, les traces de pas des astronautes y sont restées intactes.'],
];
const MOON = ['La nouvelle lune (on ne la voit pas)', 'Le premier croissant', 'Le premier quartier', 'La lune gibbeuse croissante', 'La pleine lune', 'La lune gibbeuse décroissante', 'Le dernier quartier', 'Le dernier croissant'];
add({
  id: 'st-p-lune', subject: 'sciences-techno', facts: true, label: 'La Lune : ses phases et ses mystères', skill: 'sciences-techno.p.lune', levels: ['cm1', 'cm2'],
  description: 'Remettre dans l’ordre les phases de la Lune au cours d’un mois lunaire, et comprendre pourquoi elle brille, sa face cachée, les marées.',
  chapters: ['cm1-st-lune', 'cm2-st-lumiere'],
  make(rand, lv, hard) {
    if (rand() < 0.5) return qcm(rand, pick(rand, MOON_Q));
    const n = hard ? 6 : 4;
    const start = Math.floor(rand() * (MOON.length - n + 1));
    return { ...order(`Range ces phases de la Lune dans l’ordre où on les observe au cours d’un mois.`, MOON.slice(start, start + n), 'de la première à la dernière observée', 'Après la nouvelle lune, la partie éclairée que l’on voit grandit jusqu’à la pleine lune, puis diminue.'),
      solution: `${MOON.slice(start, start + n).join(' → ')} (la Lune tourne autour de la Terre en environ 29 jours et demi).` };
  },
});

const DAY_MOMENTS = ['Le matin', 'Le midi', 'L’après-midi', 'Le soir', 'La nuit'];
const SEASONS = ['Le printemps', 'L’été', 'L’automne', 'L’hiver'];
const WEEK = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MEALS = ['Le petit-déjeuner', 'Le déjeuner', 'Le goûter', 'Le dîner'];
add({
  id: 'hp-ordre-temps', subject: 'hg', facts: true, label: 'Remettre le temps dans l’ordre : journée, semaine, mois, saisons', skill: 'hg.p.calendrier', levels: ['cp', 'ce1'],
  description: 'Ranger les moments de la journée, les repas, des jours de la semaine, des mois, les saisons.',
  chapters: ['cp-hg-calendrier', 'cp-hg-jour-nuit-saisons', 'cp-hg-evenements', 'ce1-hg-rythmes', 'ce1-hg-situer-evenements'],
  make(rand) {
    const k = pick(rand, ['jour', 'semaine', 'saisons', 'mois', 'repas']);
    if (k === 'mois') { const st = Math.floor(rand() * 9); return order('Range ces mois dans l’ordre de l’année.', MONTHS.slice(st, st + 4), 'dans l’ordre de l’année', 'Récite les mois : janvier, février, mars…'); }
    if (k === 'repas') return order('Range les repas de la journée, du matin au soir.', MEALS, 'du matin au soir', 'Le premier repas se prend au réveil.');
    if (k === 'jour') return order('Range les moments de la journée, du matin à la nuit.', DAY_MOMENTS, 'du matin à la nuit', 'La journée commence quand on se réveille.');
    if (k === 'saisons') return order('Range les saisons dans l’ordre, en commençant par le printemps.', SEASONS, 'à partir du printemps', 'Après le printemps vient la saison la plus chaude.');
    const start = Math.floor(rand() * 4);
    return order('Range ces jours dans l’ordre de la semaine.', WEEK.slice(start, start + 4), 'dans l’ordre de la semaine', 'Récite les jours de la semaine : lundi, mardi…');
  },
});

/* ------------------------------ Orientation ------------------------------ */

const ORIENT = [
  ['Sur une carte, le nord est en haut. De quel côté se trouve le sud ?', ['en bas', 'bas']],
  ['Sur une carte, le nord est en haut. De quel côté se trouve l’est ?', ['à droite', 'droite']],
  ['Sur une carte, le nord est en haut. De quel côté se trouve l’ouest ?', ['à gauche', 'gauche']],
  ['Quel point cardinal est à l’opposé du nord ?', ['le sud', 'sud']],
  ['Quel point cardinal est à l’opposé de l’est ?', ['l’ouest', 'ouest', "l'ouest"]],
  ['De quel côté de l’horizon le Soleil se lève-t-il, à peu près ?', ['à l’est', 'l’est', 'est', "l'est", "à l'est"]],
  ['De quel côté de l’horizon le Soleil se couche-t-il, à peu près ?', ['à l’ouest', 'l’ouest', 'ouest', "l'ouest", "à l'ouest"]],
  ['En France, à midi, de quel côté se trouve le Soleil ?', ['au sud', 'le sud', 'sud']],
  ['Quel point cardinal est à l’opposé de l’ouest ?', ['l’est', 'est', "l'est"]],
  ['Quel point cardinal est à l’opposé du sud ?', ['le nord', 'nord']],
  ['Quel instrument indique le nord grâce à une aiguille aimantée ?', ['une boussole', 'la boussole', 'boussole']],
  ['Quelle direction se trouve entre le nord et l’est ?', ['le nord-est', 'nord-est', 'nord est']],
  ['Quelle direction se trouve entre le sud et l’ouest ?', ['le sud-ouest', 'sud-ouest', 'sud ouest']],
  ['La nuit, quelle étoile indique à peu près la direction du nord ?', ['l’étoile polaire', 'étoile polaire', "l'étoile polaire", 'la polaire', 'polaire']],
];
add({
  id: 'hp-orientation', subject: 'hg', label: 'S’orienter : les points cardinaux', skill: 'hg.p.orientation', levels: ['ce1', 'ce2', 'cm1'], facts: true,
  description: 'Les quatre points cardinaux sur une carte et dans le ciel.',
  chapters: ['ce1-hg-cartes', 'ce2-hg-cartes', 'ce1-hg-espace-proche'],
  make(rand) {
    const [q, accept] = pick(rand, ORIENT);
    return text(accept, { prompt: q, expectedSeconds: 25, representation: 'visuelle', hints: ['Sur une carte, on lit dans le sens des aiguilles d’une montre : nord en haut, est à droite, sud en bas, ouest à gauche.'], solution: `Réponse : ${accept[0]}.` });
  },
});

export const PRIMAIRE_PLUS = GEN;
export const PRIMAIRE_PLUS_SKILLS = [
  { subject: 'francais', id: 'fp.dictee', label: 'Écrire sous la dictée des mots et des phrases', level: 'cp' },
  { subject: 'qlm', id: 'qlm.p.cycles', label: 'Ordonner les étapes du cycle de vie d’êtres vivants', level: 'ce1' },
  { subject: 'sciences-techno', id: 'sciences-techno.p.lune', label: 'Connaître la succession des phases de la Lune', level: 'cm1' },
  { subject: 'hg', id: 'hg.p.orientation', label: 'S’orienter avec les points cardinaux', level: 'ce1' },
].map((s) => ({ ...s, track: 'classe', status: 'programme', domain: 'primaire', prereqs: [], editorialLevel: true }));
