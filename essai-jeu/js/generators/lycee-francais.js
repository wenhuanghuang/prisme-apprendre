/**
 * Français au lycée (seconde et première) : générateurs rattachés aux chapitres des parcours de référence
 * francais-2nde et francais-1re. Figures de style sur des citations célèbres, versification, œuvres et auteurs,
 * mouvements littéraires, grammaire (propositions, valeurs des temps, négation, interrogation, accords),
 * connecteurs logiques de l'argumentation.
 */
import { pick, sample } from './gen-util.js';
import { qcm } from './primaire-savoirs.js';

const GEN = [];
function add(g) {
  const { make, ...rest } = g;
  GEN.push({ tracks: ['classe', 'approfondissement'], options: [], levels: ['2nde', '1re'], subject: 'francais', ...rest, make(rand, o = {}, tier = 'classe') { return make(rand, tier !== 'classe'); } });
}
function match(rand, prompt, pairs, [lt, rt], count = 4) {
  const ps = sample(rand, pairs, Math.min(count, pairs.length));
  const right = sample(rand, ps.map((p, i) => ({ id: `r${i}`, label: p[1] })), ps.length);
  return { type: 'match', prompt, leftTitle: lt, rightTitle: rt, left: ps.map((p, i) => ({ id: `l${i}`, label: p[0] })), right, pairs: Object.fromEntries(ps.map((p, i) => [`l${i}`, `r${i}`])),
    hints: ['Commence par les associations dont tu es sûr.'], solution: ps.map((p) => `${p[0]} ↔ ${p[1]}`).join(' ; '), expectedSeconds: 75, representation: 'verbale', errorType: 'notion' };
}
function categorize(rand, prompt, categories, items, count = 6) {
  let pk = [];
  for (let k = 0; k < 30; k++) { pk = sample(rand, items, Math.min(count, items.length)); if (new Set(pk.map((i) => i[1])).size >= 2) break; }
  return { type: 'categorize', prompt, categories: categories.map(([id, label]) => ({ id, label })), items: pk.map(([label, category], i) => ({ id: `i${i}`, label, category })),
    hints: ['Demande-toi quel lien logique le mot introduit entre deux idées.'], solution: pk.map(([l, c]) => `${l} → ${categories.find((x) => x[0] === c)[1]}`).join(' ; '), expectedSeconds: 70, representation: 'verbale', errorType: 'notion' };
}
const FIGURES = ['une comparaison', 'une métaphore', 'une personnification', 'une hyperbole', 'une anaphore', 'une litote', 'un euphémisme', 'une gradation', 'une antithèse', 'un oxymore', 'un chiasme', 'une allitération'];

const FIG = [
  ['« Cette obscure clarté qui tombe des étoiles » (Corneille, Le Cid)', 'un oxymore', 'Deux termes de sens opposé sont unis dans le même groupe : « obscure clarté ».'],
  ['« Va, je ne te hais point » (Corneille, Le Cid)', 'une litote', 'Chimène dit moins pour suggérer plus : elle aime Rodrigue.'],
  ['« Va, cours, vole, et nous venge » (Corneille, Le Cid)', 'une gradation', 'Les verbes vont du plus faible au plus fort, de plus en plus rapides.'],
  ['« Pour qui sont ces serpents qui sifflent sur vos têtes ? » (Racine, Andromaque)', 'une allitération', 'La répétition du son [s] imite le sifflement des serpents.'],
  ['« Il faut manger pour vivre et non pas vivre pour manger » (Molière, L’Avare)', 'un chiasme', 'Les termes sont repris en ordre inverse : manger / vivre — vivre / manger.'],
  ['« Je vis, je meurs ; je me brûle et me noie » (Louise Labé)', 'une antithèse', 'Des termes opposés (vivre / mourir, brûler / noyer) sont rapprochés.'],
  ['« Rome, l’unique objet de mon ressentiment ! / Rome, à qui vient ton bras d’immoler mon amant ! » (Corneille, Horace)', 'une anaphore', 'Le même mot est répété en tête de vers.'],
  ['« La Terre est bleue comme une orange » (Éluard)', 'une comparaison', 'L’outil « comme » relie deux éléments comparés (ici de façon surprenante).'],
  ['« Ma jeunesse ne fut qu’un ténébreux orage » (Baudelaire, L’Ennemi)', 'une métaphore', 'La jeunesse est assimilée à un orage, sans outil de comparaison.'],
  ['« Le vent hurlait dans la nuit »', 'une personnification', 'Le vent reçoit une action humaine (ou animale) : hurler.'],
  ['« Je meurs de faim ! »', 'une hyperbole', 'L’exagération met en relief une simple faim.'],
  ['« Il nous a quittés » (pour dire qu’il est mort)', 'un euphémisme', 'On adoucit une réalité pénible.'],
];
add({
  id: 'lf-figures', label: 'Les figures de style', skill: 'fl.figures', chapters: ['2nde-f-poesie', '1re-f-poesie', '2nde-f-lexique', '2nde-f-explication-commentaire', '1re-f-commentaire', '1re-f-explication'],
  description: 'Reconnaître la figure de style d’une citation célèbre : oxymore, litote, gradation, chiasme, anaphore, allitération…',
  facts: true,
  make(rand) {
    const [quote, good, why] = pick(rand, FIG);
    return qcm(rand, [`Quelle figure de style trouve-t-on dans : ${quote} ?`, good, FIGURES.filter((f) => f !== good), why], { hint: 'Repère d’abord s’il y a un outil de comparaison, une répétition, une opposition, une exagération…' });
  },
});

const VERS = [
  ['Combien de syllabes compte un alexandrin ?', '12', ['8', '10', '14'], 'L’alexandrin (12 syllabes) est le vers de la tragédie classique ; le décasyllabe en a 10, l’octosyllabe 8.'],
  ['Des rimes disposées ABAB sont…', 'croisées', ['embrassées', 'plates', 'libres'], 'ABAB : croisées ; ABBA : embrassées ; AABB : plates (ou suivies).'],
  ['Des rimes disposées ABBA sont…', 'embrassées', ['croisées', 'plates', 'riches'], 'La rime B est « embrassée » par la rime A.'],
  ['Un sonnet est composé de…', 'deux quatrains suivis de deux tercets', ['trois quatrains', 'un seul long paragraphe', 'quatre tercets'], 'Soit 14 vers ; la forme vient de l’Italie (Pétrarque) et s’impose en France au XVIe siècle.'],
  ['Une strophe de quatre vers s’appelle…', 'un quatrain', ['un tercet', 'un distique', 'un sizain'], 'Distique : 2 vers ; tercet : 3 ; quatrain : 4 ; quintil : 5 ; sizain : 6.'],
  ['Un enjambement, c’est…', 'une phrase qui se poursuit au vers suivant, sans pause', ['une rime riche', 'un vers de 12 syllabes', 'une strophe de quatre vers'], 'Le sens déborde la fin du vers ; un rejet met en valeur le mot rejeté au vers suivant.'],
  ['Le poème en prose…', 'n’a ni vers ni rimes obligatoires, mais une recherche poétique', ['est toujours un sonnet', 'est écrit en alexandrins', 'est une pièce de théâtre'], 'Baudelaire, Le Spleen de Paris ; Rimbaud, Illuminations.'],
];
add({
  id: 'lf-versification', label: 'La versification', skill: 'fl.versification', chapters: ['2nde-f-poesie', '1re-f-poesie'],
  description: 'Mètres, disposition des rimes, strophes, sonnet, enjambement, poème en prose.',
  facts: true,
  make(rand) { return qcm(rand, pick(rand, VERS)); },
});

const OEUVRES = [['Les Misérables', 'Victor Hugo'], ['Madame Bovary', 'Gustave Flaubert'], ['Candide', 'Voltaire'], ['Les Fleurs du mal', 'Charles Baudelaire'], ['Phèdre', 'Jean Racine'],
  ['Le Cid', 'Pierre Corneille'], ['Le Misanthrope', 'Molière'], ['Germinal', 'Émile Zola'], ['Le Rouge et le Noir', 'Stendhal'], ['Les Essais', 'Michel de Montaigne'], ['Gargantua', 'François Rabelais'],
  ['Bel-Ami', 'Guy de Maupassant'], ['L’Étranger', 'Albert Camus'], ['Le Père Goriot', 'Honoré de Balzac'], ['Les Liaisons dangereuses', 'Choderlos de Laclos'], ['Alcools', 'Guillaume Apollinaire'],
  ['Les Caractères', 'Jean de La Bruyère'], ['Rhinocéros', 'Eugène Ionesco'], ['En attendant Godot', 'Samuel Beckett'], ['Juste la fin du monde', 'Jean-Luc Lagarce']];
const SIECLES = [
  ['L’humanisme (Rabelais, Montaigne) appartient au…', 'XVIe siècle', ['XIIe siècle', 'XVIIIe siècle', 'XIXe siècle'], 'La Renaissance redécouvre les Anciens et place l’homme au centre.'],
  ['Le classicisme (Racine, Molière, La Fontaine) s’épanouit au…', 'XVIIe siècle', ['XVIe siècle', 'XVIIIe siècle', 'XXe siècle'], 'Sous Louis XIV : ordre, mesure, règle des trois unités au théâtre.'],
  ['Les Lumières (Voltaire, Diderot, Montesquieu, Rousseau) appartiennent au…', 'XVIIIe siècle', ['XVIe siècle', 'XVIIe siècle', 'XIXe siècle'], 'La raison et l’esprit critique contre l’intolérance et l’arbitraire.'],
  ['Le romantisme (Hugo, Lamartine, Musset) domine la première moitié du…', 'XIXe siècle', ['XVIIe siècle', 'XVIIIe siècle', 'XXe siècle'], 'Expression des sentiments, du moi, de la nature ; la préface de Cromwell (1827) en est un manifeste.'],
  ['Le naturalisme, avec Zola, se développe…', 'à la fin du XIXe siècle', ['au XVIe siècle', 'au début du XVIIIe siècle', 'après 1950'], 'Les Rougon-Macquart observent l’influence de l’hérédité et du milieu.'],
  ['Le surréalisme (Breton, Éluard, Aragon) naît…', 'dans les années 1920', ['au XVIIe siècle', 'au XIXe siècle', 'en 2000'], 'Le Manifeste du surréalisme d’André Breton date de 1924.'],
  ['La règle des trois unités, au théâtre classique, concerne…', 'le temps, le lieu et l’action', ['les personnages, les décors et les costumes', 'les vers, les rimes et les strophes', 'le début, le milieu et la fin'], 'Une seule action, en un seul lieu, en une journée.'],
];
add({
  id: 'lf-oeuvres', label: 'Œuvres, auteurs et mouvements littéraires', skill: 'fl.oeuvres',
  chapters: ['2nde-f-roman', '2nde-f-theatre', '2nde-f-idees-presse', '2nde-f-appropriation', '1re-f-roman', '1re-f-theatre', '1re-f-idees', '1re-f-entretien'],
  description: 'Associer des œuvres à leur auteur, situer les mouvements littéraires dans leur siècle.',
  make(rand) {
    if (rand() < 0.5) return match(rand, 'Associe chaque œuvre à son auteur.', OEUVRES, ['Œuvre', 'Auteur'], 4);
    return qcm(rand, pick(rand, SIECLES));
  },
});

const GRAM = [
  ['Dans « Je pense qu’il viendra », la proposition « qu’il viendra » est…', 'une subordonnée complétive', ['une subordonnée relative', 'une subordonnée circonstancielle', 'une proposition indépendante'], 'Introduite par « que », elle complète le verbe « penser » (elle est COD).'],
  ['Dans « Le livre que je lis est passionnant », « que je lis » est…', 'une subordonnée relative', ['une subordonnée complétive', 'une subordonnée circonstancielle de cause', 'une interrogative indirecte'], 'Introduite par le pronom relatif « que », elle complète le nom « livre » (antécédent).'],
  ['« Bien qu’il pleuve, nous sortons » : la subordonnée exprime…', 'la concession', ['la cause', 'le but', 'la conséquence'], '« Bien que » + subjonctif : un fait qui aurait pu empêcher la principale, sans l’empêcher.'],
  ['« Comme il pleuvait, nous sommes restés » : la subordonnée exprime…', 'la cause', ['la conséquence', 'le but', 'la comparaison'], '« Comme » en tête de phrase introduit souvent la cause.'],
  ['« Il a tant couru qu’il est épuisé » : la subordonnée exprime…', 'la conséquence', ['la cause', 'la concession', 'le temps'], 'Tant… que : système consécutif.'],
  ['« Je me tais pour que tu dormes » : la subordonnée exprime…', 'le but', ['la cause', 'la conséquence', 'l’opposition'], '« Pour que » + subjonctif : le but.'],
  ['Quel pronom relatif complète : « Le film ___ je te parle est sorti hier » ?', 'dont', ['que', 'qui', 'où'], 'On dit « parler de » : « dont » remplace un complément introduit par « de ».'],
  ['Dans « Les pommes que j’ai mangées », pourquoi « mangées » s’accorde-t-il ?', 'le COD « que » (mis pour « les pommes ») est placé avant le verbe', ['avec avoir, on accorde toujours avec le sujet', 'les participes passés s’accordent toujours', 'parce que « pommes » est le sujet'], 'Avec l’auxiliaire avoir, le participe s’accorde avec le COD seulement s’il est placé avant.'],
  ['« La Terre tourne autour du Soleil » : quelle est la valeur du présent ?', 'un présent de vérité générale', ['un présent d’énonciation', 'un présent de narration', 'un futur proche'], 'Une vérité valable en tout temps.'],
  ['« Il ne viendra jamais » : quelle négation ?', 'une négation partielle (elle porte sur le temps)', ['une négation totale', 'une double négation', 'il n’y a pas de négation'], '« Ne… pas » est une négation totale ; « ne… jamais », « ne… personne », « ne… rien » sont partielles.'],
  ['« Viendras-tu demain ? » est une interrogation…', 'totale (on peut répondre par oui ou non)', ['partielle', 'indirecte', 'rhétorique forcément'], 'L’interrogation partielle porte sur un élément (qui ? où ? quand ?).'],
  ['« Je me demande s’il viendra » contient…', 'une interrogation indirecte', ['une interrogation directe', 'une exclamation', 'une négation'], 'La question est rapportée dans une subordonnée, sans point d’interrogation.'],
  ['L’imparfait de « Il marchait quand l’orage éclata » exprime…', 'une action en cours, servant d’arrière-plan', ['une action brève de premier plan', 'un futur', 'un ordre'], 'Le passé simple « éclata » marque l’action de premier plan, qui surgit.'],
];
add({
  id: 'lf-grammaire', label: 'Grammaire : propositions, valeurs des temps, négation, interrogation, accords', skill: 'fl.grammaire',
  chapters: ['2nde-f-accords', '2nde-f-verbe', '2nde-f-phrase-complexe', '2nde-f-relatives', '1re-f-grammaire-oral', '1re-f-circonstancielles', '1re-f-interrogation', '1re-f-negation', '1re-f-langue-seconde'],
  description: 'Les questions de grammaire du lycée et de l’oral du bac : subordonnées, circonstancielles, valeurs des temps, négation, interrogation, accord du participe.',
  facts: true,
  make(rand) { return qcm(rand, pick(rand, GRAM)); },
});

const CONNECTEURS = [['car', 'cause'], ['en effet', 'cause'], ['parce que', 'cause'], ['puisque', 'cause'],
  ['donc', 'consequence'], ['c’est pourquoi', 'consequence'], ['par conséquent', 'consequence'], ['ainsi', 'consequence'],
  ['mais', 'opposition'], ['cependant', 'opposition'], ['pourtant', 'opposition'], ['néanmoins', 'opposition'], ['en revanche', 'opposition'],
  ['de plus', 'addition'], ['en outre', 'addition'], ['par ailleurs', 'addition'], ['d’abord', 'addition']];
const ARG = [
  ['Dans une dissertation, la thèse, c’est…', 'l’opinion que l’on défend', ['un exemple', 'la conclusion du texte étudié', 'le titre de l’œuvre'], 'On la soutient par des arguments, illustrés par des exemples précis.'],
  ['« Certes…, mais… » sert à…', 'concéder un point à l’adversaire pour mieux le réfuter', ['ajouter un exemple', 'conclure', 'poser une question'], 'La concession reconnaît une part de vérité avant de réfuter.'],
  ['Un argument d’autorité s’appuie sur…', 'l’avis d’une personne ou d’une institution reconnue', ['une émotion', 'une statistique inventée', 'une question rhétorique'], 'Il vaut ce que vaut l’autorité citée : on le vérifie.'],
  ['La contraction de texte consiste à…', 'résumer un texte en respectant l’ordre de ses idées, sans donner son avis', ['commenter le style', 'donner son opinion', 'recopier les phrases clés'], 'On reformule, on réduit (en général au quart), on garde l’énonciation du texte.'],
];
add({
  id: 'lf-argumentation', label: 'Argumenter : connecteurs logiques, dissertation, essai', skill: 'fl.argumentation', chapters: ['2nde-f-expression', '1re-f-lexique-expression', '2nde-f-dissertation-essai', '1re-f-dissertation'],
  description: 'Classer les connecteurs logiques (cause, conséquence, opposition, addition) ; thèse, concession, contraction de texte.',
  make(rand) {
    if (rand() < 0.6) return categorize(rand, 'Range chaque connecteur selon la relation logique qu’il exprime.', [['cause', 'Cause, justification'], ['consequence', 'Conséquence'], ['opposition', 'Opposition, concession'], ['addition', 'Addition, énumération']], CONNECTEURS, 6);
    return qcm(rand, pick(rand, ARG));
  },
});

export const LYCEE_FRANCAIS = GEN;
export const LYCEE_FRANCAIS_SKILLS = [
  ['fl.figures', 'Reconnaître les figures de style'], ['fl.versification', 'Connaître les règles de la versification'],
  ['fl.oeuvres', 'Situer des œuvres, des auteurs et des mouvements littéraires'], ['fl.grammaire', 'Analyser la phrase complexe, les valeurs des temps, la négation, l’interrogation'],
  ['fl.argumentation', 'Argumenter : connecteurs logiques, thèse, concession'],
].map(([id, label]) => ({ subject: 'francais', id, label, level: '2nde', track: 'classe', status: 'programme', domain: 'lycee', prereqs: [], editorialLevel: true }));
