/**
 * Quête de l'année : les exercices d'une matière étalés sur toute l'année scolaire. Les chapitres du parcours, dans
 * l'ordre du programme, sont répartis sur les cinq périodes (rentrée → Toussaint → Noël → hiver → printemps → été)
 * selon le nombre de jours de classe de chaque période. Chaque chapitre se joue comme une quête (étapes, défis,
 * coffres) ; un chapitre terminé donne une médaille, une période terminée ouvre un coffre rare.
 * La date du jour indique où l'on « devrait » être : c'est un conseil de rythme, jamais un verrou.
 *
 * Fonctions pures (dates en millisecondes, clés « AAAA-MM-JJ »).
 */

const DAY = 86400000;
const parse = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d).getTime(); };

/**
 * Calendrier 2026-2027 (arrêté du 22 octobre 2025) : rentrée, Toussaint, Noël et fin d'année communes à toutes les
 * zones ; hiver et printemps de la zone A (les zones B et C sont décalées d'une ou deux semaines : découpage indicatif).
 */
export const CALENDARS = {
  '2026-2027': {
    start: '2026-09-01', end: '2027-07-03',
    holidays: [['2026-10-17', '2026-11-02'], ['2026-12-19', '2027-01-04'], ['2027-02-13', '2027-03-01'], ['2027-04-10', '2027-04-26']],
  },
};

export const PERIOD_LABELS = [
  { short: 'Période 1', span: 'rentrée → Toussaint' },
  { short: 'Période 2', span: 'Toussaint → Noël' },
  { short: 'Période 3', span: 'Noël → vacances d’hiver' },
  { short: 'Période 4', span: 'hiver → printemps' },
  { short: 'Période 5', span: 'printemps → été' },
];

/** Année scolaire d'une date : « 2026-2027 » de septembre à août. */
export function schoolYearKey(now) {
  const d = new Date(now);
  const y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1; // à partir d'août : l'année qui commence
  return `${y}-${y + 1}`;
}

/** Calendrier d'une année : connu (officiel) ou, à défaut, construit sur le même modèle (dates approchées). */
export function calendarOf(key) {
  if (CALENDARS[key]) return CALENDARS[key];
  const y = Number(key.slice(0, 4));
  const k = (yy, mm, dd) => `${yy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
  return { start: k(y, 9, 1), end: k(y + 1, 7, 3), approx: true,
    holidays: [[k(y, 10, 17), k(y, 11, 2)], [k(y, 12, 19), k(y + 1, 1, 4)], [k(y + 1, 2, 13), k(y + 1, 3, 1)], [k(y + 1, 4, 10), k(y + 1, 4, 26)]] };
}

/** Les cinq périodes de classe : [début, fin[ en millisecondes, et leur nombre de jours. */
export function periodsOf(cal) {
  const bounds = [cal.start, ...cal.holidays.flat(), cal.end].map(parse);
  const out = [];
  for (let p = 0; p < 5; p++) {
    const from = bounds[p * 2]; const to = bounds[p * 2 + 1];
    out.push({ index: p, from, to, days: Math.max(1, Math.round((to - from) / DAY)), ...PERIOD_LABELS[p] });
  }
  return out;
}

/**
 * Où en est l'année à cette date : période en cours (pendant des vacances : la suivante), part des jours de classe
 * écoulés (0 avant la rentrée, 1 après la fin), jours de classe et semaines qui restent.
 */
export function yearClock(cal, now) {
  const periods = periodsOf(cal);
  const total = periods.reduce((s, p) => s + p.days, 0);
  let elapsed = 0; let current = 4; let holiday = false;
  for (const p of periods) {
    if (now >= p.to) { elapsed += p.days; continue; }
    if (now < p.from) { current = p.index; holiday = p.index > 0; break; }
    elapsed += Math.round((now - p.from) / DAY);
    current = p.index;
    break;
  }
  if (now >= periods[4].to) { current = 4; elapsed = total; }
  const fraction = Math.max(0, Math.min(1, elapsed / total));
  const daysLeft = total - Math.min(total, elapsed);
  return { periods, total, elapsed: Math.min(total, elapsed), fraction, current, holiday, daysLeft, weeksLeft: Math.max(1, Math.round(daysLeft / 7)) };
}

/** Nombre d'étapes de quête d'un chapitre selon le nombre d'exercices disponibles (1 à 3 étapes de 4 exercices). */
export function chapterStages(nExercises, hasGenerators) {
  if (!nExercises && !hasGenerators) return 0;
  if (hasGenerators || nExercises >= 14) return 3;
  return nExercises >= 6 ? 2 : 1;
}

/**
 * Plan de l'année : chaque chapitre (dans l'ordre) reçoit sa période, d'après le milieu de sa part du chemin et la
 * part de jours de classe de chaque période. Un chapitre sans exercice (0 étape) est « à venir », sans période.
 * @param {Array<{ id, title, unit?, stages }>} chapters
 */
export function planYear(chapters, periods) {
  const totalDays = periods.reduce((s, p) => s + p.days, 0);
  const limits = []; let acc = 0;
  for (const p of periods) { acc += p.days; limits.push(acc / totalDays); }
  const steps = chapters.reduce((s, c) => s + (c.stages || 0), 0);
  let cum = 0;
  return chapters.map((c) => {
    if (!c.stages) return { ...c, period: null };
    const mid = (cum + c.stages / 2) / steps;
    cum += c.stages;
    return { ...c, period: limits.findIndex((l) => mid <= l + 1e-9) };
  });
}

export const MEDAL_MIN = 0.3; // part des étoiles pour qu'un chapitre compte comme fait (médaille de bronze)

/**
 * Médaille d'un chapitre, d'après la part des étoiles de ses étapes ; null en dessous de MEDAL_MIN : parcourir un
 * chapitre en affichant les corrections ne suffit pas, on le refait pour gagner sa médaille.
 */
export function medalOf(ratio) {
  if (ratio >= 0.85) return { id: 'or', icon: '🥇', label: 'Médaille d’or' };
  if (ratio >= 0.6) return { id: 'argent', icon: '🥈', label: 'Médaille d’argent' };
  if (ratio >= MEDAL_MIN) return { id: 'bronze', icon: '🥉', label: 'Médaille de bronze' };
  return null;
}

/**
 * Avancement de l'année : chapitres faits, chapitre suivant (le premier non fait, dans l'ordre), rythme.
 * @param {Array} plan résultat de planYear
 * @param {Record<string, object>} done résultats des chapitres terminés
 * @param {{ fraction: number, weeksLeft: number }} clock
 */
export function yearProgress(plan, done, clock) {
  const playable = plan.filter((c) => c.stages);
  const finished = playable.filter((c) => done[c.id]);
  const steps = playable.reduce((s, c) => s + c.stages * 4, 0);
  const stepsDone = finished.reduce((s, c) => s + c.stages * 4, 0);
  const expectedChapters = Math.round(clock.fraction * playable.length);
  const next = playable.find((c) => !done[c.id]) || null;
  // conseillé maintenant : le premier chapitre non fait de la période en cours (ou d'une période passée)
  const now = playable.find((c) => !done[c.id] && c.period !== null && c.period <= clock.current) || null;
  const lag = expectedChapters - finished.length; // > 0 : en retard sur le rythme conseillé
  const periodDone = [0, 1, 2, 3, 4].map((p) => {
    const cs = playable.filter((c) => c.period === p);
    return cs.length > 0 && cs.every((c) => done[c.id]);
  });
  return {
    chapters: playable.length, finished: finished.length, next, steps, stepsDone,
    nowChapter: playable.find((c) => !done[c.id] && c.period === clock.current) || now,
    expectedChapters, lag, pace: lag >= 2 ? 'retard' : lag <= -2 ? 'avance' : 'rythme',
    stepsPerWeek: Math.ceil(Math.max(0, steps - stepsDone) / clock.weeksLeft),
    periodDone, complete: playable.length > 0 && finished.length === playable.length,
  };
}

/** Identifiants des récompenses (une fois chacune, pour cette année scolaire, cette classe et cette matière). */
export const yearId = (yearKey, level, subject) => `${yearKey}:${level}:${subject}`;
