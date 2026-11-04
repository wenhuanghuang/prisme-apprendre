/**
 * L'énigme du jour : une question un peu plus exigeante chaque jour (la matière change d'un jour à l'autre), suivie
 * d'un « Le savais-tu ? ». Résolue : quelques points, une série de jours d'énigmes et des trophées de curiosité.
 * Une seule énigme par jour : on revient demain, sans rien perdre si on a sauté un jour.
 * Fonctions pures (le choix de l'exercice est fait par l'interface avec la graine du jour).
 */
import { dayKey, addDays } from './game.js';

/** Graine reproductible : la même énigme pour un jour, une classe et une matière donnés. */
export function daySeed(key, level, subject) {
  let x = 2166136261;
  for (const c of `${key}|${level}|${subject}`) { x ^= c.codePointAt(0); x = Math.imul(x, 16777619) >>> 0; }
  return (x >>> 0) || 1;
}

/** Numéro du jour (pour faire tourner les matières). */
export const dayNumber = (key) => Math.floor(new Date(`${key}T12:00:00`).getTime() / 86400000);

/** Matière de l'énigme du jour, parmi celles de la classe (toujours dans le même ordre). */
export function subjectOfDay(key, subjects) {
  if (!subjects.length) return null;
  return subjects[((dayNumber(key) % subjects.length) + subjects.length) % subjects.length];
}

/** Série de jours d'énigmes résolues, jusqu'à aujourd'hui (une énigme pas encore faite aujourd'hui ne casse rien). */
export function enigmaStreak(events, now) {
  const days = new Set((events || []).filter((e) => e.type === 'enigme').map((e) => e.id));
  const today = dayKey(now);
  let k = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(k)) { n += 1; k = addDays(k, -1); }
  return { streak: n, total: days.size, solvedToday: days.has(today) };
}

/** « Le savais-tu ? » : de petites curiosités vraies, une par jour. */
export const FACTS = [
  { subject: 'maths', text: 'Le zéro est arrivé en Europe au Moyen Âge : il venait d’Inde, transmis par les savants du monde arabe.' },
  { subject: 'maths', text: 'Un nombre est divisible par 3 quand la somme de ses chiffres l’est : 2 + 3 + 4 = 9, donc 234 est divisible par 3.' },
  { subject: 'maths', text: 'Il y a bien plus de façons de mélanger un jeu de 52 cartes que d’étoiles dans tout l’Univers observable.' },
  { subject: 'maths', text: 'Les abeilles construisent des alvéoles hexagonales : l’hexagone couvre tout le plan sans trou, avec peu de cire.' },
  { subject: 'maths', text: 'Le mot « calcul » vient du latin calculus, le petit caillou qui servait à compter.' },
  { subject: 'svt', text: 'Ton cœur bat environ 100 000 fois par jour.' },
  { subject: 'svt', text: 'Le squelette d’un adulte compte 206 os ; celui d’un bébé en a davantage, qui se soudent en grandissant.' },
  { subject: 'svt', text: 'Les pieuvres ont trois cœurs et le sang bleu.' },
  { subject: 'svt', text: 'Les oiseaux sont les descendants de dinosaures : les autres dinosaures ont disparu il y a environ 66 millions d’années.' },
  { subject: 'pc', text: 'Une goutte d’eau reste en moyenne environ 9 jours dans l’atmosphère avant de retomber en pluie ou en neige.' },
  { subject: 'pc', text: 'Le son va environ quatre fois plus vite dans l’eau que dans l’air.' },
  { subject: 'pc', text: 'La glace flotte parce que l’eau solide est moins dense que l’eau liquide : c’est rare parmi les substances.' },
  { subject: 'pc', text: 'Un éclair est environ cinq fois plus chaud que la surface du Soleil.' },
  { subject: 'pc', text: 'Le Soleil est si grand qu’environ un million de Terres pourraient tenir dedans.' },
  { subject: 'pc', text: 'La Lune s’éloigne de la Terre d’environ 3,8 cm chaque année.' },
  { subject: 'hg', text: 'L’été, la tour Eiffel peut grandir d’une quinzaine de centimètres : le métal se dilate à la chaleur.' },
  { subject: 'hg', text: 'Le français est parlé sur les cinq continents, par plus de 300 millions de personnes.' },
  { subject: 'hg', text: 'La Grande Muraille de Chine ne se voit pas à l’œil nu depuis la Lune : elle est bien trop étroite.' },
  { subject: 'hg', text: 'Selon la tradition, les premiers Jeux olympiques ont eu lieu à Olympie, en Grèce, en 776 avant J.-C.' },
  { subject: 'hg', text: 'Les peintures de la grotte de Lascaux ont environ 20 000 ans.' },
  { subject: 'hg', text: 'Le mont Blanc, plus haut sommet d’Europe de l’Ouest, culmine à environ 4 800 m ; sa hauteur varie avec la neige.' },
  { subject: 'francais', text: '« Anticonstitutionnellement » est l’un des mots les plus longs du français courant : 25 lettres.' },
  { subject: 'francais', text: '« Chocolat » et « tomate » viennent du nahuatl, la langue des Aztèques, passés par l’espagnol.' },
  { subject: 'francais', text: 'Le point-virgule a été popularisé à Venise à la fin du XVe siècle par l’imprimeur Alde Manuce.' },
  { subject: 'francais', text: 'Une phrase qui contient toutes les lettres de l’alphabet s’appelle un pangramme.' },
  { subject: 'francais', text: 'Le mot « école » vient du grec skholê, qui voulait dire… « loisir » !' },
  { subject: 'arts-plastiques', text: 'La Joconde est un petit tableau : environ 77 cm de haut sur 53 cm de large.' },
  { subject: 'musique', text: 'Beethoven a composé certaines de ses plus grandes œuvres alors qu’il était devenu sourd.' },
  { subject: 'numerique', text: 'Ada Lovelace a écrit au XIXe siècle ce qu’on considère comme le premier programme informatique.' },
  { subject: 'numerique', text: 'Un ordinateur ne manipule que deux chiffres, 0 et 1 : c’est le système binaire.' },
];

/** Curiosité du jour : de la matière de l'énigme si possible. */
export function factOfDay(key, subject) {
  const pool = FACTS.filter((f) => f.subject === subject);
  const list = pool.length ? pool : FACTS;
  return list[((dayNumber(key) % list.length) + list.length) % list.length];
}
