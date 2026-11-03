/**
 * Parcours d'une matière, à la manière des applications de langues : les unités (chapitres du programme) dans
 * l'ordre, les leçons à faire, un bilan par unité (réussi : une couronne) et la leçon suivante à proposer.
 * Rien n'est verrouillé (chaque professeur choisit son ordre) : le parcours conseille, il n'interdit pas.
 * Fonctions pures : les leçons terminées, les étoiles et les couronnes sont fournies par l'appelant.
 */

export const BILAN_SIZE = 8; // exercices d'un bilan d'unité
export const UNIT_LESSONS = 3; // leçons par unité : les chapitres qui se suivent sont regroupés (un chapitre n'est jamais coupé)
export const BILAN_PASS = 0.7; // part des étoiles pour réussir un bilan (et gagner la couronne)

/** Étoiles d'une leçon ramenées à 0-3, comme pour un exercice. */
export function lessonMedal(stars, maxStars) {
  if (!maxStars || !stars) return 0;
  const r = stars / maxStars;
  return r >= 0.8 ? 3 : r >= 0.5 ? 2 : 1;
}

/** Titre court d'un chapitre : « Les fractions : quotient, opérateur… » → « Les fractions ». */
export function shortTitle(t) {
  // « Histoire · Thème 1 — Civils et militaires… », « Se chercher — Se raconter (autobiographie) » : le vrai titre est après le tiret
  const parts = String(t || '').split(/\s+[—–]\s+/);
  return parts[parts.length - 1].split(/\s+:\s+|\s+;\s+|\s+\(/)[0].trim();
}

export const UNIT_TITLE_MAX = 48;

/**
 * Vérifie les unités écrites dans un parcours (`course.units` : [{ id, title, chapters: [ids] }]) : identifiants
 * uniques, titres courts, chapitres existants, chacun dans une seule unité, dans l'ordre du parcours, et tout
 * chapitre qui a des leçons rangé dans une unité. Renvoie la liste des problèmes (vide si tout va bien).
 */
export function checkUnits(course) {
  if (!course.units) return [];
  if (!Array.isArray(course.units) || !course.units.length) return ['units doit être une liste non vide'];
  const errs = [];
  const order = new Map((course.chapters || []).map((c, i) => [c.id, i]));
  const seenUnit = new Set(); const seenChapter = new Map();
  // une unité peut réunir des chapitres non voisins d'un même thème (histoire et géographie alternées) :
  // ses chapitres restent dans l'ordre du parcours, et les unités dans l'ordre de leur premier chapitre
  let lastFirst = -1;
  for (const u of course.units) {
    const where = `unité ${u && u.id}`;
    if (!u || typeof u.id !== 'string' || !/^[a-z0-9][\w-]*$/i.test(u.id)) { errs.push(`${where} : identifiant invalide`); continue; }
    if (seenUnit.has(u.id)) errs.push(`${where} : identifiant en double`);
    seenUnit.add(u.id);
    if (typeof u.title !== 'string' || !u.title.trim()) errs.push(`${where} : titre manquant`);
    else if (u.title.length > UNIT_TITLE_MAX) errs.push(`${where} : titre trop long (${u.title.length} > ${UNIT_TITLE_MAX})`);
    if (!Array.isArray(u.chapters) || !u.chapters.length) { errs.push(`${where} : aucun chapitre`); continue; }
    let last = -1;
    for (const id of u.chapters) {
      if (!order.has(id)) { errs.push(`${where} : chapitre inconnu ${id}`); continue; }
      if (seenChapter.has(id)) errs.push(`${where} : chapitre ${id} déjà dans l'unité ${seenChapter.get(id)}`);
      seenChapter.set(id, u.id);
      if (order.get(id) < last) errs.push(`${where} : chapitre ${id} hors de l'ordre du parcours`);
      last = Math.max(last, order.get(id));
    }
    const first = order.get(u.chapters.find((id) => order.has(id)));
    if (first !== undefined) {
      if (first < lastFirst) errs.push(`${where} : unité hors de l'ordre du parcours (son premier chapitre vient avant celui de l'unité précédente)`);
      lastFirst = Math.max(lastFirst, first);
    }
  }
  for (const c of course.chapters || []) if ((c.lessons || []).length && !seenChapter.has(c.id)) errs.push(`chapitre ${c.id} (avec leçons) dans aucune unité`);
  return errs;
}

/** Regroupe les chapitres qui se suivent en unités d'au moins `size` leçons (le dernier groupe peut être plus petit). */
function groupChapters(chapters, size) {
  const units = []; let cur = null;
  for (const c of chapters) {
    if (!cur) { cur = { chapters: [], lessons: [] }; units.push(cur); }
    cur.chapters.push(c.ch); cur.lessons.push(...c.lessons);
    if (cur.lessons.length >= size) cur = null;
  }
  // une dernière unité d'une seule leçon rejoint la précédente (pas de bilan sur une leçon isolée)
  const last = units[units.length - 1];
  if (units.length > 1 && last.lessons.length < Math.min(2, size)) {
    const prev = units[units.length - 2];
    prev.chapters.push(...last.chapters); prev.lessons.push(...last.lessons); units.pop();
  }
  return units;
}

/** Unités écrites dans le parcours ; un chapitre ajouté depuis rejoint l'unité du chapitre qui le précède. */
function explicitUnits(units, chapters) {
  const unitOf = new Map();
  for (const u of units) for (const id of u.chapters || []) unitOf.set(id, u.id);
  const groups = units.map((u) => ({ id: u.id, title: u.title, chapters: [], lessons: [] }));
  const byId = new Map(groups.map((g) => [g.id, g]));
  let prev = groups[0];
  for (const c of chapters) {
    const g = byId.get(unitOf.get(c.ch.id)) || prev;
    g.chapters.push(c.ch); g.lessons.push(...c.lessons); prev = g;
  }
  return groups;
}

/** Sans unités écrites : chapitres regroupés par ~3 leçons ; l'unité prend l'identifiant de son premier chapitre. */
function computedUnits(chapters, size) {
  return groupChapters(chapters.filter((c) => c.lessons.length), size)
    .map((g) => ({ id: g.chapters[0].id, title: g.chapters.map((c) => shortTitle(c.title)).join(' · '), chapters: g.chapters, lessons: g.lessons }));
}

/** Prochaine étape d'une unité : sa première leçon à faire, sinon son bilan s'il n'est pas réussi. */
function stepOf(u, after = -1) {
  // après la leçon n° `after` : les suivantes de l'unité, puis celles restées en arrière (jamais la même leçon)
  const l = u.lessons.slice(after + 1).find((x) => !x.done) || u.lessons.slice(0, Math.max(after, 0)).find((x) => !x.done);
  if (l) return { kind: 'lecon', id: l.id, title: l.title, unitId: u.id };
  if (u.complete && !u.bilan.passed) return { kind: 'bilan', id: u.id, title: `Bilan de l’unité ${u.number}`, unitId: u.id };
  return null;
}

/**
 * @param {object} course parcours (courses/<matière>-<classe>.json), avec ses unités `units` (sinon elles sont calculées)
 * @param {Map<string, object>} lessonsById métadonnées des leçons (index : titre, compteurs, expériences)
 * @param {{ done: Set<string>, stars: Map<string, number>, crowns: Set<string> }} progress
 * @param {{ unitSize?: number }} [opts]
 */
export function buildPath(course, lessonsById, progress, opts = {}) {
  const done = progress.done || new Set();
  const crowns = progress.crowns || new Set();
  const starsOf = (id) => (progress.stars && progress.stars.get(id)) || 0;
  const chapters = (course.chapters || []).map((ch) => {
    const lessons = (ch.lessons || []).map((id) => lessonsById.get(id)).filter(Boolean).map((l) => {
      const maxStars = ((l.counts && l.counts.classe) || 0) * 3;
      const stars = starsOf(l.id);
      return { id: l.id, title: l.title, done: done.has(l.id), stars, maxStars, medal: lessonMedal(stars, maxStars), experiences: (l.experiences || []).length };
    });
    return { ch, lessons };
  });
  const groups = Array.isArray(course.units) && course.units.length
    ? explicitUnits(course.units, chapters) : computedUnits(chapters, opts.unitSize || UNIT_LESSONS);
  // la couronne d'une unité est rangée sous « <parcours>/<unité> » : elle ne bouge pas quand on ajoute des leçons
  const units = groups.filter((g) => g.lessons.length).map((g, k) => {
    const key = `${course.id}/${g.id}`;
    const doneCount = g.lessons.filter((l) => l.done).length;
    const optional = g.chapters.every((c) => c.status && c.status !== 'programme');
    return {
      id: g.id, key, number: k + 1, title: g.title, chapters: g.chapters.map((c) => c.id),
      status: optional ? 'facultatif' : 'programme', lessons: g.lessons, doneCount, total: g.lessons.length,
      complete: doneCount === g.lessons.length,
      bilan: { passed: crowns.has(key), advised: doneCount === g.lessons.length },
    };
  });
  const allLessons = units.flatMap((u) => u.lessons);
  const doneCount = allLessons.filter((l) => l.done).length;
  // dans l'ordre des unités : la première leçon à faire, ou le bilan d'une unité terminée sans couronne
  // un bilan n'est proposé en premier que pour la dernière unité où l'élève a travaillé : un bilan raté ou laissé
  // de côté ne bloque pas « Continuer » quand il est passé aux unités suivantes (il reste sur le chemin)
  const frontier = units.reduce((m, u, k) => (u.doneCount ? k : m), -1);
  let next = null;
  for (const [k, u] of units.entries()) {
    const step = stepOf(u);
    if (step && (step.kind === 'lecon' || k >= frontier)) { next = step; break; }
  }
  return {
    units,
    total: allLessons.length,
    doneCount,
    crowns: units.filter((u) => u.bilan.passed).length,
    progress: allLessons.length ? doneCount / allLessons.length : 0,
    next,
    currentUnit: next ? next.unitId : null,
  };
}

/**
 * Étape conseillée après la leçon `lessonId` : la leçon suivante de son unité, le bilan de l'unité si elle vient
 * d'être terminée, puis les unités suivantes ; sinon la prochaine étape du parcours. Renvoie { kind, id, title, unitId }.
 */
export function lessonAfter(path, lessonId) {
  const ui = path.units.findIndex((u) => u.lessons.some((l) => l.id === lessonId));
  if (ui < 0) return path.next;
  const unit = path.units[ui];
  const here = stepOf(unit, unit.lessons.findIndex((l) => l.id === lessonId));
  if (here) return here;
  for (const u of path.units.slice(ui + 1)) { const s = stepOf(u); if (s) return s; }
  return path.next && path.next.id !== lessonId ? path.next : null; // jamais « Leçon suivante : la même leçon »
}

/**
 * Résultat d'un bilan. Seul le premier résultat de chaque exercice compte (`firstStars`, 0 à 3) : refaire un
 * exercice après avoir vu sa correction entraîne, mais ne fait pas gagner la couronne.
 * @returns {{ ratio: number, passed: boolean, missedLessons: Set<string> }} leçons des exercices manqués (< 2 étoiles)
 */
export function bilanOutcome(defs, firstStars, lessonOf) {
  const starsOf = (d) => firstStars.get(d.id) || 0;
  const total = defs.reduce((a, d) => a + starsOf(d), 0);
  const ratio = defs.length ? total / (defs.length * 3) : 0;
  const missedLessons = new Set(defs.filter((d) => starsOf(d) < 2).map(lessonOf));
  return { ratio, passed: defs.length > 0 && ratio >= BILAN_PASS, missedLessons };
}

/** Petit générateur pseudo-aléatoire reproductible (mulberry32). */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s) {
  let h = 2166136261;
  for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Corrigé automatiquement (pas de rédaction à faire valider par un adulte). */
const NEEDS_ADULT = (d) => d.type === 'open' || Boolean(d.openEnded) || Boolean(d.justify && d.justify.review);
const AUTO = (d) => !NEEDS_ADULT(d) && !(d.parts || []).some(NEEDS_ADULT);

/**
 * Exercices d'un bilan d'unité : au plus `size`, pris à tour de rôle dans chaque leçon (toutes les leçons sont
 * représentées), corrigés automatiquement, du niveau de la classe ; le tirage change chaque jour (graine).
 * @param {Array<{ lessonId: string, exercises: object[] }>} pools exercices de classe de chaque leçon de l'unité
 */
export function pickBilan(pools, seed, size = BILAN_SIZE) {
  const rand = rng(seed);
  const shuffled = pools.map((p) => {
    const list = p.exercises.filter(AUTO);
    for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
    return { lessonId: p.lessonId, list };
  });
  const out = [];
  for (let round = 0; out.length < size && shuffled.some((p) => p.list.length > round); round++) {
    for (const p of shuffled) if (out.length < size && p.list[round]) out.push({ lessonId: p.lessonId, def: p.list[round] });
  }
  return out;
}
