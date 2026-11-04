/**
 * Générateurs « temps » de l'histoire-géographie à l'école primaire : le calendrier (jours, mois, saisons) au CP et
 * au CE1, puis les siècles et les grandes durées du CE2 au CM2. Rattachés aux chapitres des parcours (`chapters`).
 */
import { ri, pick, mc, numeric, text } from './gen-util.js';

const DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
const LABEL = { cp: 'CP', ce1: 'CE1', ce2: 'CE2', cm1: 'CM1', cm2: 'CM2' };

const GEN = [];
function add(g) {
  const { make, ...rest } = g;
  GEN.push({
    subject: 'hg', tracks: ['classe', 'approfondissement'], facts: true,
    options: [{ id: 'niveau', label: 'Classe', values: g.levels.map((l) => ({ id: l, label: LABEL[l] })) }],
    ...rest,
    make(rand, o = {}, tier = 'classe') {
      const lv = g.levels.includes(String(o.niveau || '').toLowerCase()) ? String(o.niveau).toLowerCase() : g.levels[0];
      return make(rand, lv, tier !== 'classe');
    },
  });
}

add({
  id: 'hp-calendrier', label: 'Le calendrier : jours, mois, saisons', skill: 'hg.p.calendrier', levels: ['cp', 'ce1'],
  description: 'Le jour qui suit, le mois qui précède, les saisons, et combien de jours, de mois ou d’heures.',
  chapters: ['cp-hg-calendrier', 'cp-hg-jour-nuit-saisons', 'cp-hg-mesurer-temps', 'ce1-hg-rythmes', 'ce1-hg-durees'],
  make(rand, lv, hard) {
    const kind = pick(rand, lv === 'cp' && !hard ? ['jour', 'jour', 'mois', 'saison', 'combien'] : ['jour', 'mois', 'mois', 'saison', 'combien', 'combien']);
    if (kind === 'jour' || kind === 'mois') {
      const list = kind === 'jour' ? DAYS : MONTHS; const i = ri(rand, 0, list.length - 1); const after = rand() < 0.6;
      const j = (i + (after ? 1 : list.length - 1)) % list.length;
      const wrong = list[(i + (after ? list.length - 1 : 1)) % list.length];
      return text([list[j], list[j][0].toUpperCase() + list[j].slice(1)], {
        prompt: `Quel ${kind === 'jour' ? 'jour' : 'mois'} vient juste ${after ? 'après' : 'avant'} ${kind === 'jour' ? '' : 'le mois de '}${list[i]} ?`.replace('  ', ' '),
        misconceptions: [mc(wrong, 'mc:avant-apres', 'notion', `« ${wrong} » vient ${after ? 'avant' : 'après'} ${list[i]}.`)],
        expectedSeconds: 25, hints: [`Récite les ${kind === 'jour' ? 'jours de la semaine' : 'mois de l’année'} dans l’ordre : ${list.slice(0, 4).join(', ')}…`],
        solution: `${list[i]} → ${after ? list[j] : `${list[j]} vient juste avant`}.`,
      });
    }
    if (kind === 'saison') {
      const q = pick(rand, [['En quelle saison fête-t-on Noël, en France ?', 'hiver'], ['En quelle saison les feuilles des arbres tombent-elles ?', 'automne'], ['Quelle saison vient après le printemps ?', 'été'],
        ['Quelle saison vient après l’hiver ?', 'printemps'], ['En quelle saison commence l’année scolaire, en septembre ?', 'automne|été'], ['Quelle saison vient après l’été ?', 'automne']]);
      const accept = q[1].split('|').flatMap((a) => [a, `l’${a}`, `le ${a}`, `en ${a}`, `au ${a}`]);
      return text(accept, { prompt: q[0], expectedSeconds: 25, hints: ['Les quatre saisons, dans l’ordre : printemps, été, automne, hiver.'], solution: `Réponse : ${q[1].split('|')[0]}.` });
    }
    const q = pick(rand, [['Combien de jours y a-t-il dans une semaine ?', 7], ['Combien de mois y a-t-il dans une année ?', 12], ['Combien de saisons y a-t-il dans une année ?', 4],
      ['Combien d’heures y a-t-il dans une journée ?', 24], ['Combien de jours y a-t-il dans deux semaines ?', 14],
      ...(lv === 'ce1' || hard ? [['Combien de jours y a-t-il dans une année ordinaire (non bissextile) ?', 365], ['Combien de jours y a-t-il en février, dans une année ordinaire ?', 28], ['Combien de minutes y a-t-il dans une heure ?', 60]] : [])]);
    return numeric(q[1], { prompt: q[0], expectedSeconds: 25, hints: ['Pense au calendrier de la classe.'], solution: `Réponse : ${q[1]}.` });
  },
});

add({
  id: 'hp-siecles', label: 'Les siècles et les grandes durées', skill: 'hg.p.siecles', levels: ['ce2', 'cm1', 'cm2'],
  description: 'Trouver le siècle d’une année, lire les chiffres romains, convertir années, siècles et millénaires.',
  chapters: ['ce2-hg-mesurer-temps', 'ce2-hg-frise', 'ce2-hg-periodes'],
  make(rand, lv, hard) {
    const kind = pick(rand, hard ? ['siecle-limite', 'siecle', 'romain'] : ['siecle', 'siecle', 'romain', 'duree']);
    if (kind === 'duree') {
      const q = pick(rand, [['Combien d’années y a-t-il dans un siècle ?', 100], ['Combien d’années y a-t-il dans un millénaire ?', 1000], ['Combien de siècles y a-t-il dans un millénaire ?', 10], ['Combien d’années y a-t-il dans une décennie ?', 10]]);
      return numeric(q[1], { prompt: q[0], expectedSeconds: 25, hints: ['Une décennie = 10 ans ; un siècle = 100 ans ; un millénaire = 1 000 ans.'], solution: `Réponse : ${q[1]}.` });
    }
    if (kind === 'romain') {
      const c = ri(rand, 4, 21);
      return numeric(c, { prompt: `Le ${ROMAN[c]}e siècle : écris le numéro de ce siècle en chiffres (1, 2, 3…).`, expectedSeconds: 35,
        misconceptions: [mc(c === 4 ? 6 : c === 9 ? 11 : c - 1, 'mc:chiffres-romains', 'notion', 'En chiffres romains, I placé avant V ou X se retire : IV = 4, IX = 9.')],
        hints: ['I = 1, V = 5, X = 10 ; un I placé avant V ou X se retire (IV = 4, IX = 9).'], solution: `${ROMAN[c]} = ${c}.` });
    }
    // le siècle d'une année : 1515 est au XVIe siècle ; une année « ronde » (1900) termine le siècle
    const year = kind === 'siecle-limite' ? ri(rand, 10, 20) * 100 : ri(rand, 2, 20) * 100 + ri(rand, 1, 99);
    const century = Math.ceil(year / 100);
    return numeric(century, {
      prompt: `En quel siècle se situe l’année ${year} ? Écris le numéro du siècle en chiffres.`, difficulty: kind === 'siecle-limite' ? 3 : 2, expectedSeconds: 40,
      misconceptions: [mc(Math.floor(year / 100) === century ? century + 1 : Math.floor(year / 100), 'mc:siecle-centaines', 'notion',
        year % 100 === 0 ? `L’année ${year} est la dernière du ${ROMAN[century]}e siècle : le siècle suivant commence en ${year + 1}.` : `Le ${ROMAN[century]}e siècle va de ${(century - 1) * 100 + 1} à ${century * 100} : on ajoute 1 au nombre de centaines.`)],
      hints: ['Le Ier siècle va de l’an 1 à l’an 100, le IIe de 101 à 200…', `Prends le nombre de centaines de ${year}, puis ajoute 1 (sauf pour une année ronde comme 1900).`],
      solution: `${year} est au ${ROMAN[century]}e siècle (de ${(century - 1) * 100 + 1} à ${century * 100}).`,
    });
  },
});

export const PRIMAIRE_MONDE = GEN;
export const PRIMAIRE_MONDE_SKILLS = [
  { subject: 'hg', id: 'hg.p.calendrier', label: 'Se repérer dans le calendrier : jours, mois, saisons', level: 'cp', track: 'classe', status: 'programme', domain: 'primaire', prereqs: [], editorialLevel: true },
  { subject: 'hg', id: 'hg.p.siecles', label: 'Situer une année dans son siècle ; lire les siècles en chiffres romains', level: 'ce2', track: 'classe', status: 'programme', domain: 'primaire', prereqs: [], editorialLevel: true },
];
