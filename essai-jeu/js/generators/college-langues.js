/**
 * Langues vivantes au collège (anglais et espagnol, 5e et 4e) : générateurs rattachés aux chapitres des parcours
 * lv-5e et lv-4e. Formes verbales à écrire (avec écoute de la phrase corrigée), modaux et choix à justifier,
 * repères culturels. Les réponses acceptent les variantes usuelles (contractions, majuscules).
 */
import { pick, sample, text } from './gen-util.js';
import { qcm } from './primaire-savoirs.js';

const GEN = [];
function add(g) {
  const { make, ...rest } = g;
  GEN.push({ tracks: ['classe', 'approfondissement'], options: [], levels: ['5e', '4e'], subject: 'lv', ...rest, make(rand, o = {}, tier = 'classe') { return make(rand, tier !== 'classe'); } });
}
/** Phrase à compléter : la forme attendue, l'écoute de la phrase complète dans la langue. */
function fill(sentence, accept, { lang, hint, rule, wrong = [] }) {
  const list = Array.isArray(accept) ? accept : [accept];
  const full = sentence.replace('___', list[0]);
  return text(list, {
    prompt: `Complète : ${sentence}`, expectedSeconds: 40, representation: 'verbale', hints: [hint],
    misconceptions: wrong.filter(([w]) => !list.includes(w)).map(([w, fb]) => ({ answer: w, id: 'mc:forme-verbale', error: 'notion', feedback: fb })),
    solution: `${full}${rule ? ` — ${rule}` : ''}`, audio: { text: full, lang, after: true },
  });
}

/* ================================ ANGLAIS ================================ */

const EN = 'en-GB';
const IRREG = [['go', 'went', 'gone'], ['see', 'saw', 'seen'], ['eat', 'ate', 'eaten'], ['take', 'took', 'taken'], ['buy', 'bought', 'bought'], ['come', 'came', 'come'], ['have', 'had', 'had'],
  ['make', 'made', 'made'], ['write', 'wrote', 'written'], ['drink', 'drank', 'drunk'], ['swim', 'swam', 'swum'], ['give', 'gave', 'given'], ['find', 'found', 'found'], ['speak', 'spoke', 'spoken'],
  ['break', 'broke', 'broken'], ['run', 'ran', 'run'], ['sleep', 'slept', 'slept'], ['tell', 'told', 'told'], ['think', 'thought', 'thought'], ['know', 'knew', 'known'], ['fly', 'flew', 'flown'], ['meet', 'met', 'met']];
const SUBJ = ['I', 'You', 'He', 'She', 'We', 'They', 'My friends', 'Tom'];
const PAST_CTX = ['yesterday', 'last week', 'two days ago', 'last summer', 'on Saturday'];
const REG = [['play', 'played'], ['watch', 'watched'], ['visit', 'visited'], ['stop', 'stopped'], ['study', 'studied'], ['travel', 'travelled'], ['like', 'liked'], ['cry', 'cried'], ['walk', 'walked'], ['plan', 'planned']];

add({
  id: 'en-c-preterit', label: 'Anglais : le prétérit (verbes réguliers et irréguliers)', skill: 'lv.c.en-preterit', chapters: ['en5-ch-preterit', 'en4-ch-recit', 'en4-ch-present-perfect'],
  description: 'Écrire le prétérit d’un verbe dans une phrase : -ed et ses règles d’orthographe, verbes irréguliers les plus fréquents.',
  make(rand, hard) {
    const s = pick(rand, SUBJ); const when = pick(rand, PAST_CTX);
    if (!hard && rand() < 0.4) {
      const [v, p] = pick(rand, REG);
      return fill(`${s} ___ (${v}) ${when}.`, p, { lang: EN, hint: 'Verbe régulier : base verbale + -ed. Attention : stop → stopped, study → studied, like → liked.', rule: `prétérit régulier de « ${v} » : ${p}`,
        wrong: [[`${v}ed`, `Orthographe : ${v} → ${p}.`], [v, 'Avec un marqueur du passé, on met le verbe au prétérit.']] });
    }
    const [v, p, pp] = pick(rand, IRREG);
    return fill(`${s} ___ (${v}) ${when}.`, p, { lang: EN, hint: `« ${v} » est un verbe irrégulier : son prétérit ne se forme pas avec -ed.`, rule: `${v} – ${p} – ${pp}`,
      wrong: [[`${v}ed`, `« ${v} » est irrégulier : au prétérit, on écrit « ${p} ».`], [pp !== p ? pp : `${v}s`, pp !== p ? `« ${pp} » est le participe passé (present perfect) ; au prétérit : « ${p} ».` : 'Au prétérit, pas de -s.']] });
  },
});

const S3 = [['play', 'plays'], ['watch', 'watches'], ['go', 'goes'], ['fly', 'flies'], ['do', 'does'], ['have', 'has'], ['study', 'studies'], ['wash', 'washes'], ['like', 'likes'], ['read', 'reads'], ['finish', 'finishes'], ['carry', 'carries']];
const ING = [['swim', 'swimming'], ['run', 'running'], ['dance', 'dancing'], ['read', 'reading'], ['write', 'writing'], ['play', 'playing'], ['sit', 'sitting'], ['make', 'making'], ['watch', 'watching'], ['get', 'getting']];
add({
  id: 'en-c-present', label: 'Anglais : présent simple et présent en be + V-ing', skill: 'lv.c.en-present', chapters: ['en5-ch-present', 'en5-ch-ecole', 'en5-ch-portrait'],
  description: 'Le -s de la 3e personne (et ses règles d’orthographe), la forme en -ing après be, le choix entre les deux.',
  make(rand) {
    const k = pick(rand, ['s3', 's3', 'ing', 'choix']);
    if (k === 's3') {
      const [v, f] = pick(rand, S3); const who = pick(rand, ['He', 'She', 'My brother', 'Emma', 'It']);
      return fill(`${who} ___ (${v}) every day.`, f, { lang: EN, hint: 'Au présent simple, on ajoute -s à la 3e personne du singulier (he, she, it) : -es après -ch, -sh, -o ; y → ies après une consonne.', rule: `${who} → ${f}`,
        wrong: [[v, 'À la 3e personne du singulier (he, she, it), le verbe prend un -s.'], [`${v}s`, `Orthographe : ${v} → ${f}.`]] });
    }
    if (k === 'ing') {
      const [v, f] = pick(rand, ING); const [who, be] = pick(rand, [['I', 'am'], ['She', 'is'], ['They', 'are'], ['We', 'are'], ['Tom', 'is']]);
      return fill(`Look! ${who} ${be} ___ (${v}) now.`, f, { lang: EN, hint: 'be + V-ing : base verbale + -ing ; on double la consonne finale (swim → swimming), on enlève le -e muet (dance → dancing).', rule: `${v} → ${f}`,
        wrong: [[`${v}ing`, `Orthographe : ${v} → ${f}.`]] });
    }
    const [sent, good, bad, why] = pick(rand, [
      ['She usually ___ to school by bus.', 'goes', ['is going', 'go', 'went'], '« usually » : une habitude, donc présent simple.'],
      ['Listen! The baby ___.', 'is crying', ['cries', 'cry', 'cried'], '« Listen! » : l’action se déroule maintenant, donc be + V-ing.'],
      ['We ___ football every Wednesday.', 'play', ['are playing', 'plays', 'played'], '« every Wednesday » : une habitude, présent simple (pas de -s avec we).'],
      ['Be quiet, I ___ my homework.', 'am doing', ['do', 'does', 'did'], 'L’action est en cours au moment où l’on parle : be + V-ing.'],
    ]);
    return qcm(rand, [`Choisis la bonne forme : ${sent}`, good, bad, why], { audio: { text: sent.replace('___', good), lang: EN, after: true } });
  },
});

const COMP = [['big', 'bigger', 'the biggest'], ['small', 'smaller', 'the smallest'], ['tall', 'taller', 'the tallest'], ['happy', 'happier', 'the happiest'], ['easy', 'easier', 'the easiest'], ['hot', 'hotter', 'the hottest'],
  ['expensive', 'more expensive', 'the most expensive'], ['interesting', 'more interesting', 'the most interesting'], ['beautiful', 'more beautiful', 'the most beautiful'], ['good', 'better', 'the best'], ['bad', 'worse', 'the worst']];
add({
  id: 'en-c-comparer', label: 'Anglais : comparatifs et superlatifs', skill: 'lv.c.en-comparer', chapters: ['en5-ch-comparer', 'en4-ch-comparer'],
  description: 'Adjectifs courts (-er, -est), longs (more, the most), irréguliers (good, bad).',
  make(rand) {
    const [adj, c, s] = pick(rand, COMP);
    if (rand() < 0.55) {
      const [a, b] = pick(rand, [['London', 'Paris'], ['My cat', 'your dog'], ['This film', 'the book'], ['Today', 'yesterday']]);
      return fill(`${a} is ___ (${adj}) than ${b}.`, c, { lang: EN, hint: 'Adjectif court : + -er ; adjectif long : more + adjectif ; good → better, bad → worse.', rule: `${adj} → ${c}`,
        wrong: [[`more ${adj}`, c.startsWith('more') ? '' : `« ${adj} » est un adjectif court : ${c}.`], [`${adj}er`, `Orthographe ou forme irrégulière : ${c}.`]].filter(([w, f]) => f && w !== c) });
    }
    return fill(`It is ___ (${adj}) day of the year.`, s, { lang: EN, hint: 'Superlatif : the + adjectif + -est (court), the most + adjectif (long) ; good → the best, bad → the worst.', rule: `${adj} → ${s}`,
      wrong: [[s.replace('the ', ''), 'Le superlatif se construit avec « the ».'], [`the most ${adj}`, s.includes('most') ? '' : `« ${adj} » est court : ${s}.`]].filter(([w, f]) => f && w !== s) });
  },
});

const MODALS = [
  ['You ___ wear a helmet on a motorbike: it’s the law.', 'must', ['can', 'should', 'may'], 'Une obligation (la loi) : must.'],
  ['You look tired. You ___ go to bed earlier.', 'should', ['must', 'can', 'mustn’t'], 'Un conseil : should.'],
  ['My little sister is only five but she ___ swim.', 'can', ['must', 'should', 'has to'], 'Une capacité : can.'],
  ['You ___ use your phone during the test: it’s forbidden!', 'mustn’t', ['don’t have to', 'can', 'should'], 'Une interdiction : mustn’t.'],
  ['It’s Sunday: we ___ go to school.', 'don’t have to', ['mustn’t', 'must', 'can’t'], 'Une absence d’obligation : don’t have to (ce n’est pas une interdiction).'],
  ['Look at those black clouds! It ___ rain.', 'is going to', ['will', 'must', 'should'], 'Une prévision fondée sur un indice visible : be going to.'],
  ['I think people ___ live on Mars one day.', 'will', ['are going to', 'must', 'should'], 'Une prédiction, une opinion sur l’avenir : will.'],
  ['If it rains tomorrow, we ___ stay at home.', 'will', ['would', 'are', 'did'], 'If + présent, will + base verbale (condition réaliste).'],
  ['Students ___ run in the corridors: it’s dangerous!', 'mustn’t', ['don’t have to', 'can', 'will'], 'Une interdiction : mustn’t.'],
  ['I ___ speak three languages: French, English and Spanish.', 'can', ['must', 'should', 'mustn’t'], 'Une capacité : can.'],
  ['It’s very cold outside. You ___ take a coat.', 'should', ['mustn’t', 'can’t', 'don’t have to'], 'Un conseil : should.'],
  ['Penguins ___ fly, but they are excellent swimmers.', 'can’t', ['mustn’t', 'don’t have to', 'shouldn’t'], 'Une incapacité : can’t.'],
  ['You ___ pay to visit the museum: it’s free on Sundays.', 'don’t have to', ['mustn’t', 'can’t', 'shouldn’t'], 'Ce n’est pas obligatoire : don’t have to.'],
  ['In the future, robots ___ probably do many jobs.', 'will', ['must', 'mustn’t', 'should'], 'Une prédiction sur l’avenir : will.'],
  ['___ I open the window, please? It’s hot in here.', 'Can', ['Do', 'Am', 'Have'], 'Demander la permission : Can I… ? (ou May I… ?)'],
  ['We have bought the tickets: we ___ visit London next summer.', 'are going to', ['mustn’t', 'can’t', 'should'], 'Un projet déjà décidé : be going to.'],
];
add({
  id: 'en-c-modaux', label: 'Anglais : modaux et futur (can, must, should, will, going to)', skill: 'lv.c.en-modaux', chapters: ['en5-ch-projets-regles', 'en4-ch-modaux', 'en4-ch-futur', 'en5-ch-interaction', 'en4-ch-dialoguer'],
  description: 'Choisir le modal qui exprime une capacité, une obligation, une interdiction, un conseil, une prévision.',
  make(rand) { const [s, g, b, why] = pick(rand, MODALS); return qcm(rand, [`Choisis : ${s}`, g, b, why], { audio: { text: s.replace('___', g), lang: EN, after: true } }); },
});

const PARTS = IRREG.filter(([, p, pp]) => p !== pp);
add({
  id: 'en-c-present-perfect', label: 'Anglais : le present perfect', skill: 'lv.c.en-present-perfect', chapters: ['en4-ch-present-perfect', 'en4-ch-voyages', 'en4-ch-rencontres'],
  description: 'have/has + participe passé, ever et never, present perfect ou prétérit.',
  make(rand) {
    if (rand() < 0.6) {
      const [v, p, pp] = pick(rand, PARTS); const [who, aux] = pick(rand, [['I', 'have'], ['She', 'has'], ['We', 'have'], ['He', 'has']]);
      return fill(`${who} ${aux} never ___ (${v}) that.`, pp, { lang: EN, hint: 'Present perfect : have / has + participe passé (3e colonne de la liste des verbes irréguliers).', rule: `${v} – ${p} – ${pp}`,
        wrong: [[p, `« ${p} » est le prétérit ; après have / has, il faut le participe passé : « ${pp} ».`], [`${v}ed`, `Verbe irrégulier : ${v} – ${p} – ${pp}.`]] });
    }
    const [s, g, b, why] = pick(rand, [
      ['I ___ to London last year.', 'went', ['have gone', 'have been', 'go'], '« last year » : un moment passé précis et terminé, donc prétérit.'],
      ['Have you ever ___ to Scotland?', 'been', ['went', 'go', 'gone to'], '« Have you ever… ? » : expérience, present perfect avec le participe « been ».'],
      ['She ___ her keys: she can’t open the door.', 'has lost', ['lost', 'loses', 'is losing'], 'Une action passée dont le résultat compte maintenant : present perfect.'],
      ['We ___ the film two days ago.', 'saw', ['have seen', 'see', 'have saw'], '« two days ago » : date précise, donc prétérit.'],
    ]);
    return qcm(rand, [`Choisis : ${s}`, g, b, why], { audio: { text: s.replace('___', g), lang: EN, after: true } });
  },
});

const CONTR = [['I am', ['I’m', "I'm"]], ['do not', ['don’t', "don't"]], ['cannot', ['can’t', "can't"]], ['will not', ['won’t', "won't"]], ['she is', ['she’s', "she's"]], ['they are', ['they’re', "they're"]], ['does not', ['doesn’t', "doesn't"]], ['I have', ['I’ve', "I've"]], ['we will', ['we’ll', "we'll"]], ['is not', ['isn’t', "isn't"]]];
const UK = [
  ['Quelle est la capitale de l’Écosse ?', 'Édimbourg (Edinburgh)', ['Cardiff', 'Belfast', 'Dublin'], 'Le Royaume-Uni réunit l’Angleterre (Londres), l’Écosse (Édimbourg), le pays de Galles (Cardiff) et l’Irlande du Nord (Belfast).'],
  ['Quelle est la capitale du pays de Galles ?', 'Cardiff', ['Édimbourg', 'Belfast', 'Manchester'], 'Le gallois (Welsh) y est aussi langue officielle.'],
  ['Combien de nations forment le Royaume-Uni ?', 'quatre', ['deux', 'trois', 'six'], 'Angleterre, Écosse, pays de Galles, Irlande du Nord.'],
  ['« Big Ben », c’est…', 'la grande cloche de la tour de l’horloge de Westminster', ['le palais de la reine', 'un pont de Londres', 'le plus grand parc de Londres'], 'Le nom désigne la cloche ; la tour s’appelle Elizabeth Tower depuis 2012.'],
  ['Quelle est la monnaie du Royaume-Uni ?', 'la livre sterling', ['l’euro', 'le dollar', 'le franc'], 'Le symbole de la livre est £.'],
  ['Dans quelle ville se trouve Buckingham Palace ?', 'Londres', ['Édimbourg', 'Oxford', 'Liverpool'], 'C’est la résidence officielle du souverain britannique à Londres.'],
  ['De quelle ville venait le groupe des Beatles ?', 'Liverpool', ['Londres', 'Manchester', 'Glasgow'], 'Les Beatles se sont formés à Liverpool en 1960.'],
];
add({
  id: 'en-c-langue-culture', label: 'Anglais : formes contractées, Royaume-Uni', skill: 'lv.c.en-culture', chapters: ['en5-ch-phonologie', 'en5-ch-royaume-uni', 'en5-ch-langues', 'en5-ch-imaginaire', 'en4-ch-langages', 'en4-ch-ecole-societe'],
  description: 'Écrire les formes contractées de l’oral, repères sur les nations et les villes du Royaume-Uni.',
  make(rand) {
    if (rand() < 0.45) {
      const [full, acc] = pick(rand, CONTR);
      return text(acc, { prompt: `Écris la forme contractée de « ${full} ».`, expectedSeconds: 25, representation: 'verbale', hints: ['L’apostrophe remplace la ou les lettres qui disparaissent à l’oral.'],
        solution: `${full} → ${acc[0]}${full === 'will not' ? ' (forme irrégulière)' : ''}`, audio: { text: acc[1], lang: EN, after: true } });
    }
    return qcm(rand, pick(rand, UK));
  },
});

/* ================================ ESPAGNOL ================================ */

const ES = 'es-ES';
const PRES = [
  ['(Yo) ___ (tener) doce años.', 'tengo', 'tener : tengo, tienes, tiene, tenemos, tenéis, tienen.'],
  ['Mi hermana ___ (llamarse) Lucía.', 'se llama', 'llamarse : me llamo, te llamas, se llama…'],
  ['Nosotros ___ (ser) franceses.', 'somos', 'ser : soy, eres, es, somos, sois, son.'],
  ['¿De dónde ___ (ser) tú?', 'eres', 'ser : soy, eres, es…'],
  ['(Yo) ___ (querer) un helado.', 'quiero', 'querer diphtongue : e → ie (quiero, quieres, quiere, queremos…).'],
  ['(Yo) ___ (poder) venir mañana.', 'puedo', 'poder diphtongue : o → ue (puedo, puedes, puede, podemos…).'],
  ['Mi padre ___ (dormir) mucho.', 'duerme', 'dormir diphtongue : o → ue (duermo, duermes, duerme…).'],
  ['Los niños ___ (jugar) al fútbol.', 'juegan', 'jugar : u → ue (juego, juegas, juega, jugamos, jugáis, juegan).'],
  ['(Yo) ___ (hacer) los deberes.', 'hago', 'hacer : hago, haces, hace…'],
  ['¿Cuántos hermanos ___ (tener) tú?', 'tienes', 'tener : tengo, tienes, tiene…'],
];
const GUSTAR = [
  ['Me ___ el chocolate.', 'gusta', ['gustan', 'gusto', 'gustas'], 'gusta + nom singulier ; gustan + nom pluriel.'],
  ['Me ___ los perros.', 'gustan', ['gusta', 'gusto', 'gustamos'], '« los perros » est au pluriel : gustan.'],
  ['A mi hermano le ___ jugar al tenis.', 'gusta', ['gustan', 'gusto', 'gustas'], 'gusta + verbe à l’infinitif.'],
  ['Para hablar de la hora o de un lugar se usa…', 'estar (estoy en casa)', ['ser (soy en casa)', 'tener', 'hay'], 'estar : la situation, l’état passager ; ser : l’identité, l’origine, la description.'],
  ['« Je suis fatigué » se dit…', 'Estoy cansado.', ['Soy cansado.', 'Tengo cansado.', 'Hay cansado.'], 'Un état passager : estar.'],
  ['« Elle est mexicaine » se dit…', 'Es mexicana.', ['Está mexicana.', 'Tiene mexicana.', 'Hay mexicana.'], 'L’origine, la nationalité : ser.'],
];
add({
  id: 'es-c-presente', label: 'Espagnol : le présent (ser, tener, diphtongues), gustar, ser et estar', skill: 'lv.c.es-presente', chapters: ['es5-ch-presentarse', 'es5-ch-familia', 'es4-ch-presente', 'es5-ch-quotidien'],
  description: 'Se présenter, conjuguer au présent les verbes fréquents et à diphtongue, employer gustar, choisir ser ou estar.',
  make(rand) {
    if (rand() < 0.6) { const [s, a, rule] = pick(rand, PRES); return fill(s, a, { lang: ES, hint: 'Repère le sujet, puis la terminaison ; certains verbes diphtonguent (e → ie, o → ue) sauf avec nosotros et vosotros.', rule }); }
    const [s, g, b, why] = pick(rand, GUSTAR);
    return qcm(rand, [s.includes('___') ? `Choisis : ${s}` : s, g, b, why], s.includes('___') ? { audio: { text: s.replace('___', g), lang: ES, after: true } } : {});
  },
});

const INDEF = [
  ['Ayer (yo) ___ (hablar) con mi abuela.', 'hablé', 'hablar → hablé, hablaste, habló, hablamos, hablasteis, hablaron.'],
  ['El año pasado (nosotros) ___ (viajar) a México.', 'viajamos', 'Verbes en -ar : -é, -aste, -ó, -amos, -asteis, -aron.'],
  ['Anoche mi hermano ___ (comer) una pizza.', 'comió', 'Verbes en -er / -ir : -í, -iste, -ió, -imos, -isteis, -ieron.'],
  ['En 2020 ellos ___ (vivir) en Sevilla.', 'vivieron', 'vivir → viví, viviste, vivió, vivimos, vivisteis, vivieron.'],
  ['El sábado (yo) ___ (ir) al cine.', 'fui', 'ir et ser ont le même passé simple : fui, fuiste, fue…'],
  ['Ayer (yo) ___ (tener) un examen.', 'tuve', 'tener → tuve, tuviste, tuvo… (irrégulier, sans accent).'],
  ['¿Qué ___ (hacer) tú el domingo?', 'hiciste', 'hacer → hice, hiciste, hizo…'],
  ['La semana pasada mis amigos ___ (estar) en Madrid.', 'estuvieron', 'estar → estuve, estuviste, estuvo, estuvimos, estuvisteis, estuvieron.'],
];
const IMPERF = [
  ['De pequeño, (yo) ___ (jugar) en el parque.', 'jugaba', 'Imparfait des verbes en -ar : -aba, -abas, -aba, -ábamos, -abais, -aban.'],
  ['Antes mi abuela ___ (vivir) en el campo.', 'vivía', 'Imparfait des verbes en -er / -ir : -ía, -ías, -ía, -íamos, -íais, -ían.'],
  ['Cuando era niño, (yo) ___ (ser) muy tímido.', 'era', 'ser à l’imparfait : era, eras, era, éramos, erais, eran.'],
  ['Todos los veranos (nosotros) ___ (ir) a la playa.', 'íbamos', 'ir à l’imparfait : iba, ibas, iba, íbamos, ibais, iban.'],
  ['En el pueblo ___ (haber) una fuente.', 'había', 'haber (hay) à l’imparfait : había.'],
];
add({
  id: 'es-c-pasado', label: 'Espagnol : raconter et décrire au passé', skill: 'lv.c.es-pasado', chapters: ['es4-ch-pasado', 'es4-ch-imparfait', 'es5-ch-imaginaire', 'es4-ch-rencontres'],
  description: 'Le pretérito indefinido (réguliers et irréguliers fréquents) et l’imparfait (-aba, -ía, era, iba, había).',
  make(rand) {
    const [s, a, rule] = pick(rand, rand() < 0.6 ? INDEF : IMPERF);
    return fill(s, a, { lang: ES, hint: 'Action ponctuelle et terminée (ayer, el sábado…) : pretérito indefinido ; habitude ou description dans le passé (antes, de pequeño…) : imparfait.', rule });
  },
});

const FUTUR = [
  ['Mañana (yo) ___ estudiar. (aller + infinitif)', ['voy a'], 'ir a + infinitif : voy a, vas a, va a, vamos a, vais a, van a.'],
  ['Este verano (nosotros) ___ visitar Barcelona. (aller + infinitif)', ['vamos a'], 'ir a + infinitif : vamos a visitar.'],
  ['Ahora mi madre está ___ (hablar) por teléfono.', ['hablando'], 'estar + gérondif : -ar → -ando.'],
  ['Los alumnos están ___ (comer) en el comedor.', ['comiendo'], 'estar + gérondif : -er / -ir → -iendo.'],
  ['Para aprobar, ___ que estudiar. (il faut, en général)', ['hay'], 'hay que + infinitif : obligation générale (il faut).'],
  ['(Yo) ___ que hacer los deberes. (je dois)', ['tengo'], 'tener que + infinitif : obligation personnelle (je dois).'],
];
const MEX = [
  ['Quelle est la capitale du Mexique ?', 'Mexico (Ciudad de México)', ['Guadalajara', 'Cancún', 'Monterrey'], 'Mexico est construite sur le site de Tenochtitlan, l’ancienne capitale aztèque.'],
  ['Le « Día de Muertos » se fête au Mexique…', 'au début du mois de novembre', ['à Noël', 'en été', 'le 14 février'], 'Les 1er et 2 novembre, on honore les défunts avec des autels, des fleurs de cempasúchil et des calaveras.'],
  ['Frida Kahlo était…', 'une peintre mexicaine', ['une chanteuse espagnole', 'une reine aztèque', 'une footballeuse argentine'], 'Célèbre pour ses autoportraits, elle vivait à Mexico (la « Maison bleue »).'],
  ['Dans combien de pays environ l’espagnol est-il langue officielle ?', 'une vingtaine', ['trois', 'cinquante', 'un seul'], 'Une vingtaine de pays, surtout en Amérique latine, plus l’Espagne et la Guinée équatoriale.'],
  ['Comment dit-on 15 h 30 en espagnol ?', 'Son las tres y media.', ['Es la tres y media.', 'Son las quince menos media.', 'Está las tres y media.'], '« Son las… » (pluriel) sauf pour une heure : « Es la una ». En Espagne, on déjeune souvent vers 14 h.'],
  ['Dans « canción », la syllabe accentuée est…', 'la dernière (-ción)', ['la première (can-)', 'aucune', 'toutes les deux'], 'L’accent écrit indique la syllabe tonique : can-CIÓN.'],
];
add({
  id: 'es-c-projets-culture', label: 'Espagnol : futur proche, gérondif, obligation ; le Mexique', skill: 'lv.c.es-projets', chapters: ['es5-ch-outils', 'es4-ch-projets', 'es5-ch-mexique', 'es5-ch-langues', 'es5-ch-prononciation', 'es4-ch-langages', 'es4-ch-ecole-societe', 'es4-ch-voyages', 'es4-ch-dialoguer'],
  description: 'ir a + infinitif, estar + gérondif, tener que et hay que ; repères sur le Mexique et le monde hispanophone.',
  make(rand) {
    if (rand() < 0.55) { const [s, a, rule] = pick(rand, FUTUR); return fill(s, a, { lang: ES, hint: 'Projets : ir a + infinitif ; action en cours : estar + gérondif ; obligation : tener que (personnelle), hay que (générale).', rule }); }
    return qcm(rand, pick(rand, MEX));
  },
});

export const COLLEGE_LANGUES = GEN;
export const COLLEGE_LANGUES_SKILLS = [
  ['lv.c.en-preterit', 'Anglais : le prétérit des verbes réguliers et irréguliers'], ['lv.c.en-present', 'Anglais : présent simple et be + V-ing'],
  ['lv.c.en-comparer', 'Anglais : comparatifs et superlatifs'], ['lv.c.en-modaux', 'Anglais : modaux et futur'],
  ['lv.c.en-present-perfect', 'Anglais : le present perfect'], ['lv.c.en-culture', 'Anglais : formes contractées, repères culturels'],
  ['lv.c.es-presente', 'Espagnol : le présent, gustar, ser et estar'], ['lv.c.es-pasado', 'Espagnol : pretérito indefinido et imparfait'],
  ['lv.c.es-projets', 'Espagnol : futur proche, gérondif, obligation ; repères culturels'],
].map(([id, label]) => ({ subject: 'lv', id, label, level: '5e', track: 'classe', status: 'programme', domain: 'college', prereqs: [], editorialLevel: true }));
