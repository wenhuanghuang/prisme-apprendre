/**
 * Compléments : la programmation par blocs côté mathématiques (5e, 4e), la logique en première (mêmes questions
 * qu'en seconde), et l'anglais du primaire à l'écrit (phrases à remettre dans l'ordre) et à l'oral (petits dialogues).
 */
import { pick } from './gen-util.js';
import { qcm } from './primaire-savoirs.js';
import { COLLEGE_TECHNO } from './college-techno.js';
import { LYCEE_MATHS } from './lycee-maths.js';

const reuse = (gens, id) => { const g = gens.find((x) => x.id === id); return (rand, o, tier) => g.make(rand, o, tier); };

const EN_PHRASES = ['My name is Tom.', 'I am eight years old.', 'I like apples.', 'She has got a blue bike.', 'We play football on Sunday.', 'The cat is under the table.', 'I live in a small house.', 'My favourite colour is green.'];
const DIALOGUES = [
  ['« How are you? » — Que peux-tu répondre ?', 'I’m fine, thank you.', ['My name is Lucy.', 'I’m ten.', 'Goodbye!'], '« How are you? » demande comment tu vas.'],
  ['« What’s your name? » — Que peux-tu répondre ?', 'My name is Léo.', ['I’m fine.', 'I’m from France.', 'Yes, please.'], '« What’s your name? » demande ton prénom.'],
  ['« How old are you? » — Que peux-tu répondre ?', 'I’m nine.', ['I’m fine.', 'My name is Ana.', 'It’s blue.'], '« How old are you? » demande ton âge.'],
  ['« Where do you live? » — Que peux-tu répondre ?', 'I live in Lyon.', ['I like pizza.', 'I’m eleven.', 'It’s Monday.'], '« Where…? » demande un lieu.'],
  ['« What’s the weather like? » — Que peux-tu répondre ?', 'It’s sunny.', ['It’s Tuesday.', 'I’m happy.', 'It’s a dog.'], 'On répond par le temps qu’il fait : sunny, rainy, cloudy, windy…'],
  ['Comment dit-on « Merci » en anglais ?', 'Thank you.', ['Please.', 'Sorry.', 'Hello.'], '« Please » = s’il te plaît ; « Sorry » = pardon ; « Hello » = bonjour.'],
  ['Ton ami anglais dit « I’m hungry ». Que veut-il dire ?', 'Il a faim.', ['Il a froid.', 'Il est fatigué.', 'Il est content.'], 'hungry = qui a faim ; cold = froid ; tired = fatigué ; happy = content.'],
  ['« Can I have an apple, please? » — Que demande l’enfant ?', 'une pomme', ['une orange', 'un verre d’eau', 'un crayon'], 'apple = pomme.'],
];
const words = (s) => s.split(' ');

export const COMPLEMENTS = [
  { id: 'm-algo-blocs', subject: 'maths', levels: ['5e', '4e'], label: 'Algorithmique : programmes par blocs, boucles et conditions', skill: 'tc.programmation',
    chapters: ['m5-ch-algo', 'm4-ch-algo'], tracks: ['classe', 'approfondissement'], options: [],
    description: 'Prévoir l’effet d’un programme : compteurs, boucles « répéter », polygones, conditions « si… alors… sinon ».',
    make: reuse(COLLEGE_TECHNO, 'tc-programmation') },
  { id: 'l1-logique', subject: 'maths', levels: ['1re'], facts: true, label: 'Logique et ensembles (première)', skill: 'l2.logique',
    chapters: ['1re-m-logique'], tracks: ['classe', 'approfondissement'], options: [],
    description: 'Négation, réciproque, contre-exemple, appartenance et inclusion, ensembles de nombres.',
    make: reuse(LYCEE_MATHS, 'l2-logique') },
  { id: 'en-p-phrases', subject: 'lv', levels: ['cp', 'ce1', 'ce2', 'cm1', 'cm2'], facts: true, label: 'Anglais : écrire une phrase (mots dans l’ordre)', skill: 'lv.p.anglais-ecrit',
    chapters: ['lv-c2c3-2026-ee'], tracks: ['classe', 'approfondissement'], options: [],
    description: 'Remettre les mots d’une phrase anglaise dans l’ordre ; la phrase corrigée peut être écoutée.',
    make(rand) {
      const s = pick(rand, EN_PHRASES);
      return { type: 'order', prompt: 'Range les mots pour écrire une phrase en anglais.', orderLabel: 'du premier au dernier mot', errorType: 'notion', representation: 'verbale', expectedSeconds: 50,
        items: words(s).map((w, i) => ({ id: `w${i + 1}`, label: w })), hints: ['La phrase commence par la majuscule et finit par le point ; en anglais aussi, le sujet vient avant le verbe.'], solution: s,
        audio: { text: s, lang: 'en-GB', after: true } };
    } },
  { id: 'en-p-dialogues', subject: 'lv', levels: ['cp', 'ce1', 'ce2', 'cm1', 'cm2'], facts: true, label: 'Anglais : petits dialogues', skill: 'lv.p.anglais-oral',
    chapters: ['lv-c2c3-2026-eoi', 'lv-c2c3-2026-eoc', 'lv-c2c3-2026-m'], tracks: ['classe', 'approfondissement'], options: [],
    description: 'Répondre à une question simple, comprendre une phrase, dire merci : les échanges du quotidien.',
    make(rand) {
      const d = pick(rand, DIALOGUES);
      // on fait écouter la phrase anglaise citée (pas la question en français)
      const m = d[0].match(/«\s*([^»]+?)\s*»/);
      const english = m && !/^Comment dit-on/.test(d[0]) ? m[1] : null;
      return qcm(rand, d, english ? { audio: { text: english, lang: 'en-GB' } } : {});
    } },
];
export const COMPLEMENTS_SKILLS = [
  { subject: 'lv', id: 'lv.p.anglais-ecrit', label: 'Anglais : écrire une phrase simple', level: 'cp' },
  { subject: 'lv', id: 'lv.p.anglais-oral', label: 'Anglais : comprendre et répondre dans un petit dialogue', level: 'cp' },
].map((s) => ({ ...s, track: 'classe', status: 'programme', domain: 'primaire', prereqs: [], editorialLevel: true }));
