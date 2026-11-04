/**
 * Gardiens des périodes (quête de l'année) : à chaque période son gardien, une créature qui garde un trésor.
 * Dès que deux chapitres de la période sont terminés (un seul si la période n'en compte qu'un), on peut le défier :
 * huit questions mêlées des chapitres déjà faits (révision espacée et entrelacée). Chaque bonne réponse (au plus
 * un indice ou un deuxième essai) allume un des cinq cœurs du gardien ; les cinq cœurs allumés, il est apprivoisé
 * et confie son trésor (un coffre rare). Raté : il s'envole, et revient avec d'autres questions — sans pénalité.
 *
 * Fonctions pures (l'affrontement est un petit objet enregistrable, modifié sur place comme une quête).
 */

export const GUARDIAN_HEARTS = 5;
export const GUARDIAN_QUESTIONS = 8;
export const GUARDIAN_MIN_CHAPTERS = 2;
export const GUARDIAN_HIT = 2; // étoiles qu'il faut sur une question pour allumer un cœur

/** Un gardien par période, de la rentrée à l'été. */
export const GUARDIANS = [
  { id: 'feuillu', icon: '🦔', name: 'Feuillu', what: 'le hérisson des feuilles d’automne',
    hello: 'Je garde les chemins de l’automne, sous les feuilles rousses. Réponds bien et je t’ouvrirai mon trésor !',
    win: 'Tu connais tes chapitres de la rentrée sur le bout des doigts. Voici mon trésor, bien caché sous les feuilles !',
    lose: 'Hop, je me roule en boule ! Relis tes corrections et reviens me voir : je ne bouge pas de mon tas de feuilles.' },
  { id: 'frimas', icon: '🦉', name: 'Frimas', fem: true, what: 'la chouette des premières neiges',
    hello: 'Hou hou ! Je veille sur les longues nuits d’avant Noël. Montre-moi ce que tu as appris depuis la Toussaint.',
    win: 'Hou hou ! Tu as l’œil aussi perçant que le mien. Mon trésor est à toi.',
    lose: 'Je m’envole sur ma branche… Reviens quand tu veux, je t’attendrai avec d’autres questions.' },
  { id: 'banquise', icon: '🦭', name: 'Banquise', what: 'le phoque des glaces d’hiver',
    hello: 'Brrr ! Je garde la banquise de janvier. Si tu te souviens de tes chapitres, la glace fondra pour toi.',
    win: 'La glace fond, bravo ! Tu as bien retenu tes leçons de l’hiver : prends mon trésor.',
    lose: 'Plouf ! Je replonge sous la glace. Relis tes corrections et reviens frapper à mon trou d’eau.' },
  { id: 'petale', icon: '🐢', name: 'Pétale', fem: true, what: 'la tortue des pluies de printemps',
    hello: 'Doucement mais sûrement… Je garde les jardins du printemps. Prends ton temps pour bien répondre.',
    win: 'Pas à pas, tu as fait tout le chemin, comme moi ! Mon trésor fleurit pour toi.',
    lose: 'Je rentre dans ma carapace pour un moment. Rien ne presse : reviens quand tu auras relu tes corrections.' },
  { id: 'solaris', icon: '🐉', name: 'Solaris', what: 'le dragon du soleil d’été',
    hello: 'Je suis le gardien du dernier chemin, celui qui mène à l’été. Voyons si toute ton année brille encore !',
    win: 'Quelle lumière ! Toute ton année brille. Mon trésor est à toi, et les vacances aussi.',
    lose: 'Je reprends mon vol vers le soleil… Mais je reviendrai : retente ta chance, tu y es presque.' },
];

const HIT_LINES = ['Bien vu ! Un cœur s’allume.', 'Exact : tu gagnes ma confiance.', 'Tu t’en souviens bien !', 'Oh, bravo ! Encore un cœur.', 'Parfait, continue comme ça !'];
const MISS_LINES = ['Hmm… pas encore. Regarde bien la correction.', 'Presque ! La prochaine sera la bonne.', 'Ce n’est pas grave : on apprend en se trompant.', 'Relis la correction, tu vas t’en souvenir.'];
const pick = (lines, k) => lines[((k % lines.length) + lines.length) % lines.length];

/** Accord au féminin (« apprivoisée ») pour les gardiennes. */
export const agree = (g, word) => (g && g.fem ? `${word}e` : word);

/** Ce que dit le gardien après la réponse numéro k (0, 1, …). */
export const guardianLine = (hit, k) => pick(hit ? HIT_LINES : MISS_LINES, k);

/** Peut-on défier le gardien d'une période ? (chapitres terminés de la période, sur combien il en faut) */
export function guardianUnlock(periodChapters, done) {
  const total = periodChapters.length;
  const finished = periodChapters.filter((c) => done[c.id]).length;
  const need = Math.min(GUARDIAN_MIN_CHAPTERS, total);
  return { total, finished, need, open: total > 0 && finished >= need };
}

/** Nouvel affrontement : les questions (éléments de quête enregistrables) sont tirées à part. */
export function newFight({ period, items, now }) {
  return { version: 1, period, items: items.slice(0, GUARDIAN_QUESTIONS), results: [], start: now };
}

/** Où en est l'affrontement : cœurs allumés, questions posées et restantes, gagné, perdu (plus assez de questions). */
export function fightState(f) {
  const asked = f.results.length;
  const hearts = Math.min(GUARDIAN_HEARTS, f.results.filter((s) => s >= GUARDIAN_HIT).length);
  const left = Math.max(0, f.items.length - asked);
  const won = hearts >= GUARDIAN_HEARTS;
  const lost = !won && hearts + left < GUARDIAN_HEARTS;
  return { asked, hearts, left, won, lost, over: won || lost, total: f.items.length, current: won || lost ? null : f.items[asked] || null };
}

/** Enregistre la réponse à la question en cours (nombre d'étoiles). Ne fait rien si l'affrontement est fini. */
export function answerFight(f, stars) {
  const before = fightState(f);
  if (before.over) return { ...before, hit: false };
  const s = Math.max(0, Math.min(3, Math.round(Number(stars) || 0)));
  f.results.push(s);
  return { ...fightState(f), hit: s >= GUARDIAN_HIT };
}

/** Un affrontement est jouable s'il a assez de questions pour allumer tous les cœurs. */
export const fightPlayable = (items) => Array.isArray(items) && items.length >= GUARDIAN_HEARTS;
