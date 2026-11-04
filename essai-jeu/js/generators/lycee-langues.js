/**
 * Anglais en 6e et de la 3e à la terminale : les bases de 6e (be, have got, there is, possessifs, pluriels
 * irréguliers) ; au-delà, voix passive, conditionnels, pronoms relatifs, modaux au passé, discours rapporté, mots de
 * liaison, verbes irréguliers moins fréquents et repères culturels du monde anglophone. Écoute de la phrase corrigée.
 */
import { pick, sample, text } from './gen-util.js';
import { qcm } from './primaire-savoirs.js';

const EN = 'en-GB';
function fill(sentence, accept, { hint, rule, wrong = [] }) {
  const list = Array.isArray(accept) ? accept : [accept];
  const full = sentence.replace('___', list[0]);
  return text(list, {
    prompt: `Complète : ${sentence}`, expectedSeconds: 40, representation: 'verbale', hints: [hint],
    misconceptions: wrong.filter(([w]) => !list.includes(w)).map(([w, fb]) => ({ answer: w, id: 'mc:forme-anglaise', error: 'notion', feedback: fb })),
    solution: `${full}${rule ? ` — ${rule}` : ''}`, audio: { text: full, lang: EN, after: true },
  });
}
function categorize(rand, prompt, categories, items, count = 6) {
  let pk = [];
  for (let k = 0; k < 30; k++) { pk = sample(rand, items, Math.min(count, items.length)); if (new Set(pk.map((i) => i[1])).size >= 2) break; }
  return { type: 'categorize', prompt, categories: categories.map(([id, label]) => ({ id, label })), items: pk.map(([label, category], i) => ({ id: `i${i}`, label, category })),
    hints: ['Demande-toi quel lien le mot crée entre les deux idées.'], solution: pk.map(([l, c]) => `${l} → ${categories.find((x) => x[0] === c)[1]}`).join(' ; '), expectedSeconds: 70, representation: 'verbale', errorType: 'notion' };
}
const GEN = [];
const add = (g) => { const { make, ...rest } = g; GEN.push({ tracks: ['classe', 'approfondissement'], options: [], subject: 'lv', ...rest, make(rand, o = {}, tier = 'classe') { return make(rand, tier !== 'classe'); } }); };

/* ------------------------------ 6e : les bases ------------------------------ */

const BASES = [
  ['I ___ (be) eleven years old.', 'am', 'be : I am, you are, he / she / it is, we / they are.', [['is', 'Avec « I », on dit « I am ».'], ['are', 'Avec « I », on dit « I am ».']]],
  ['My sister ___ (be) very funny.', 'is', 'be : he / she / it is.', [['are', 'Sujet singulier (my sister) : « is ».'], ['am', '« am » ne s’emploie qu’avec « I ».']]],
  ['They ___ (be) from Scotland.', 'are', 'be : we / you / they are.', [['is', 'Sujet pluriel : « are ».']]],
  ['He ___ (have got) two brothers.', ['has got', "'s got", '’s got'], 'have got : I / you / we / they have got ; he / she / it has got.', [['have got', 'À la 3e personne du singulier : « has got ».']]],
  ['There ___ three cats in the garden.', 'are', 'There is + singulier ; there are + pluriel.', [['is', '« three cats » est au pluriel : there are.']]],
  ['There ___ a book on the table.', 'is', 'There is + singulier.', [['are', '« a book » est au singulier : there is.']]],
  ['Tom loves ___ dog. (son chien, à lui)', 'his', 'his : à lui ; her : à elle ; their : à eux.', [['her', '« her » renvoie à une possesseure (à elle) ; Tom → his.']]],
  ['Emma is doing ___ homework. (ses devoirs, à elle)', 'her', 'Le possessif dépend du possesseur : Emma → her.', [['his', 'Emma est une fille : her.']]],
  ['One child, two ___.', 'children', 'Pluriel irrégulier : child → children.', [['childs', 'Pluriel irrégulier : children.']]],
  ['One mouse, two ___.', 'mice', 'Pluriel irrégulier : mouse → mice.', [['mouses', 'Pluriel irrégulier : mice.']]],
  ['One tooth, two ___.', 'teeth', 'Pluriel irrégulier : tooth → teeth (et foot → feet).', [['tooths', 'Pluriel irrégulier : teeth.']]],
];
add({
  id: 'en-6e-bases', levels: ['6e'], facts: true, label: 'Anglais (6e) : be, have got, there is, possessifs, pluriels', skill: 'lv.6e.en-bases', chapters: ['lv-c4-lycee-2025-activites'],
  description: 'Les bases de l’anglais de 6e, avec écoute de la phrase corrigée.',
  make(rand) { const [s, a, rule, wrong] = pick(rand, BASES); return fill(s, a, { hint: 'Regarde le sujet : singulier ou pluriel, I, he, she ?', rule, wrong }); },
});

/* ------------------------------ 3e et lycée ------------------------------ */

const PASSIVE = [
  ['The Eiffel Tower ___ (build) in 1889.', 'was built', 'Voix passive au prétérit : was / were + participe passé.'],
  ['English ___ (speak) all over the world.', 'is spoken', 'Voix passive au présent : is / are + participe passé.'],
  ['These letters ___ (send) yesterday.', 'were sent', 'Sujet pluriel : were + participe passé.'],
  ['Romeo and Juliet ___ (write) by Shakespeare.', 'was written', 'write – wrote – written ; « by » introduit l’auteur de l’action.'],
  ['The thief ___ (catch) by the police last night.', 'was caught', 'catch – caught – caught.'],
];
const COND = [
  ['If it rains tomorrow, we ___ (stay) at home.', ['will stay', "'ll stay", '’ll stay'], 'If + présent → will + base verbale (condition réaliste).'],
  ['If I ___ (have) more money, I would travel around the world.', 'had', 'If + prétérit → would + base verbale (hypothèse irréelle dans le présent).'],
  ['If you had studied, you ___ (pass) the exam.', 'would have passed', 'If + past perfect → would have + participe passé (regret sur le passé).'],
  ['If I were you, I ___ (call) her.', ['would call', "'d call", '’d call'], '« If I were you » : un conseil ; would + base verbale.'],
];
const REL = [
  ['The girl ___ father is a doctor is my best friend.', 'whose', ['who', 'which', 'what'], '« whose » exprime la possession (la fille dont le père…).'],
  ['The man ___ lives next door is a pilot.', 'who', ['which', 'whose', 'what'], '« who » pour une personne sujet du verbe.'],
  ['The film ___ we saw last night was great.', 'which', ['who', 'whose', 'where'], '« which » (ou « that ») pour une chose.'],
  ['This is the town ___ I was born.', 'where', ['which', 'who', 'whose'], '« where » pour un lieu.'],
  ['You look exhausted: you ___ gone to bed earlier.', 'should have', ['must', 'should', 'can'], 'should have + participe passé : un reproche ou un regret sur le passé.'],
  ['He said: “I am tired.” → He said that he ___ tired.', 'was', ['is', 'has been', 'will be'], 'Discours rapporté : le présent devient prétérit (concordance des temps).'],
];
const LINK = [['although', 'concession'], ['even though', 'concession'], ['however', 'concession'], ['whereas', 'concession'],
  ['therefore', 'consequence'], ['so', 'consequence'], ['as a result', 'consequence'],
  ['because', 'cause'], ['since', 'cause'], ['because of', 'cause'], ['due to', 'cause'],
  ['moreover', 'addition'], ['furthermore', 'addition'], ['in addition', 'addition']];
const IRREG2 = [['bring', 'brought'], ['choose', 'chose'], ['forget', 'forgot'], ['lead', 'led'], ['rise', 'rose'], ['teach', 'taught'], ['throw', 'threw'], ['wear', 'wore'], ['fight', 'fought'], ['steal', 'stole'], ['spend', 'spent'], ['feel', 'felt']];
const CULTURE = [
  ['How many states are there in the United States?', '50', ['13', '27', '52'], 'Fifty states ; the first thirteen colonies declared independence in 1776.'],
  ['Who gave the famous “I Have a Dream” speech in 1963?', 'Martin Luther King', ['Abraham Lincoln', 'Barack Obama', 'Nelson Mandela'], 'During the March on Washington for civil rights.'],
  ['What is the capital of Australia?', 'Canberra', ['Sydney', 'Melbourne', 'Perth'], 'Canberra was chosen as a compromise between Sydney and Melbourne.'],
  ['On which date do Americans celebrate Independence Day?', 'July 4th', ['December 25th', 'November 11th', 'January 1st'], 'The Declaration of Independence was adopted on July 4th, 1776.'],
  ['Which country did Nelson Mandela lead as president?', 'South Africa', ['Kenya', 'Nigeria', 'Egypt'], 'He became the first president elected by all South Africans in 1994.'],
  ['The Commonwealth is…', 'an association of countries, most of them former British territories', ['a British bank', 'an American state', 'a London football club'], 'It counts more than fifty member states.'],
];
add({
  id: 'en-l-grammaire', levels: ['3e', '2nde', '1re', 'tle'], label: 'Anglais : passif, conditionnels, relatives, discours rapporté, mots de liaison', skill: 'lv.l.en-grammaire',
  chapters: ['lv-2020-activites', 'lv-c4-lycee-2025-activites', 'lv-c4-lycee-2025-axes-2nde', 'lv-c4-lycee-2025-axes-1re', 'lv-c4-lycee-2025-axes-tle'],
  description: 'La grammaire du B1-B2 et quelques repères culturels du monde anglophone, avec écoute des phrases.',
  make(rand, hard) {
    const k = pick(rand, hard ? ['passive', 'cond', 'rel', 'link', 'irreg'] : ['passive', 'cond', 'rel', 'link', 'irreg', 'culture']);
    if (k === 'passive') { const [s, a, rule] = pick(rand, PASSIVE); return fill(s, a, { hint: 'Voix passive : be (au temps voulu) + participe passé.', rule }); }
    if (k === 'cond') { const [s, a, rule] = pick(rand, COND); return fill(s, a, { hint: 'Regarde le temps après « if » : présent → will ; prétérit → would ; past perfect → would have.', rule }); }
    if (k === 'irreg') { const [v, p] = pick(rand, IRREG2); return fill(`Last year, she ___ (${v}) a lot.`, p, { hint: `« ${v} » est irrégulier au prétérit.`, rule: `${v} → ${p}`, wrong: [[`${v}ed`, `« ${v} » est irrégulier : ${p}.`]] }); }
    if (k === 'link') return categorize(rand, 'Range chaque mot de liaison selon le lien logique qu’il exprime.', [['cause', 'Cause'], ['consequence', 'Conséquence'], ['concession', 'Opposition, concession'], ['addition', 'Addition']], LINK, 6);
    if (k === 'culture') return qcm(rand, pick(rand, CULTURE));
    const [s, g, b, why] = pick(rand, REL);
    return qcm(rand, [`Choisis : ${s}`, g, b, why], { audio: { text: s.replace('___', g).replace(/ → .*$/, ''), lang: EN, after: true } });
  },
});

export const LYCEE_LANGUES = GEN;
export const LYCEE_LANGUES_SKILLS = [
  { subject: 'lv', id: 'lv.6e.en-bases', label: 'Anglais (6e) : be, have got, there is, possessifs, pluriels irréguliers', level: '6e' },
  { subject: 'lv', id: 'lv.l.en-grammaire', label: 'Anglais : passif, conditionnels, relatives, discours rapporté, mots de liaison', level: '3e' },
].map((s) => ({ ...s, track: 'classe', status: 'programme', domain: 'langues', prereqs: [], editorialLevel: true }));
