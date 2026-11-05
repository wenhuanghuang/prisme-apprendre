/**
 * Quête de l'année (onglet « Quête » de l'Espace exercices) : pour chaque matière, les chapitres du programme dans
 * l'ordre, répartis sur les cinq périodes de l'année scolaire. Chaque chapitre se joue comme une quête (étapes,
 * défis, coffres) ; terminé, il reçoit une médaille ; une période terminée ouvre un coffre rare ; l'année entière,
 * un dernier coffre. La date du jour indique le rythme conseillé, sans rien verrouiller : chaque chapitre reste
 * jouable, si la classe suit un autre ordre.
 */
import { h, announce, esc } from '../dom.js';
import { store, getSetting, setSetting, loadCourse, recordGameEvent, gameProgress } from '../../app/store.js';
import { calendarOf, schoolYearKey, yearClock, planYear, yearProgress, chapterStages, medalOf, yearId, MEDAL_MIN } from '../../engine/annee.js';
import { newQuest, questSummary, isOver, STEPS_PER_STAGE } from '../../engine/quete.js';
import { allGenerators, coversSkills } from '../../generators/registry.js';
import { planQuest, planReview } from './quest-plan.js';
import { guardianUnlock, newFight, fightState, fightPlayable, agree, GUARDIAN_QUESTIONS, GUARDIAN_HEARTS } from '../../engine/gardien.js';
import { playGuardian, guardianOf } from './guardian-view.js';
import { playQuest } from './quest-view.js';
import { quickExercise } from './deck.js';
import { subjLabel } from '../views/exercices.js';
import { SUBJECT_ICONS } from '../parcours/data.js';
import { photon } from '../photon.js';
import { chestReveal, chestSvg, newVignettes } from './rewards-ui.js';
import { confetti } from '../lesson-play/celebrate.js';
import { bonusGame } from './mini-games.js';

const levelId = (x) => String(x || '').toLowerCase();
const levelLabel = (id) => ((store.catalog && store.catalog.levels.find((l) => l.id === id)) || { label: id }).label;
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmtDate = (ms) => { const d = new Date(ms); return `${d.getDate() === 1 ? '1er' : d.getDate()} ${d.toLocaleDateString('fr-FR', { month: 'long' })}`; };

/* ------------------------------ Données ------------------------------ */

/**
 * Parcours d'une classe : un par matière, le parcours rédigé s'il existe, sinon le parcours de référence (programme
 * officiel) — au primaire, ses chapitres sont joués avec les générateurs qui leur sont rattachés.
 */
function yearCourses(level) {
  const all = (store.catalog ? store.catalog.courses : []).filter((c) => c.level === level);
  const bySubject = new Map();
  for (const c of all) { const cur = bySubject.get(c.subject); if (!cur || (cur.coverage === 'reference' && c.coverage !== 'reference')) bySubject.set(c.subject, c); }
  return all.filter((c) => bySubject.get(c.subject) === c);
}

/**
 * Notions d'un chapitre et ce qu'il y a pour le jouer : exercices courts des leçons, générateurs qui couvrent ses
 * notions ou qui lui sont rattachés (`chapters`). Un chapitre sans notions écrites prend celles de ses générateurs.
 */
export function chapterContent(level, subject, ch) {
  const gens = allGenerators(store.index).filter((g) => g.subject === subject && g.levels.map(levelId).includes(level) && g.kind !== 'probleme');
  const attached = gens.filter((g) => (g.chapters || []).includes(ch.id));
  const skills = new Set(ch.skills && ch.skills.length ? ch.skills : attached.flatMap((g) => [g.skill, ...(g.skills || [])]));
  const n = store.index.exercises.filter((e) => levelId(e.level) === level && e.subject === subject && (e.track || 'classe') === 'classe' && quickExercise(e) && skills.has(e.skill)).length;
  const covering = skills.size ? gens.filter((g) => attached.includes(g) || coversSkills(g, skills)) : [];
  // des questions de connaissance seulement (solides, figures) : un chapitre court
  const factsOnly = covering.length > 0 && covering.every((g) => g.facts) && n < 6;
  return { skills: [...skills], n, hasGen: covering.length > 0, factsOnly };
}

/** Chapitres de l'année d'une matière, dans l'ordre du parcours, avec leur nombre d'étapes et leur période. */
export async function yearPlan(level, subject, clock) {
  const course = yearCourses(level).find((c) => c.subject === subject);
  const data = course ? await loadCourse(course.id) : null;
  if (!data) return [];
  const unitOf = new Map();
  (data.units || []).forEach((u, i) => (u.chapters || []).forEach((id) => unitOf.set(id, { number: i + 1, title: u.title })));
  // un parcours de référence peut couvrir plusieurs classes (EMC du CP à la terminale, langues du collège au lycée) :
  // on écarte, s'ils n'ont rien à jouer, les chapitres dont l'identifiant désigne une autre classe (« emc-2024-ce1 »)
  const levelIds = new Set(((store.catalog && store.catalog.levels) || []).map((l) => levelId(l.id)));
  const otherLevel = (id) => { const last = levelId(String(id).split('-').pop()); return levelIds.has(last) && last !== level; };
  const chapters = (data.chapters || []).map((ch) => {
    const c = chapterContent(level, subject, ch);
    return { id: ch.id, title: ch.title, skills: c.skills, unit: unitOf.get(ch.id) || null, stages: c.factsOnly ? 1 : chapterStages(c.n, c.hasGen), factsOnly: c.factsOnly };
  }).filter((c) => c.stages || !otherLevel(c.id));
  // une année d'un seul chapitre de questions de connaissance (l'EMC d'une classe) : trois étapes plutôt qu'une
  const playable = chapters.filter((c) => c.stages);
  if (playable.length === 1 && playable[0].factsOnly) playable[0].stages = 3;
  return planYear(chapters, clock.periods);
}

const stateKey = (yearKey, level, subject) => `annee:${store.profile.id}:${yearKey}:${level}:${subject}`;
async function loadState(yearKey, level, subject) {
  const s = await getSetting(stateKey(yearKey, level, subject), null).catch(() => null);
  return s && s.version === 1 ? { done: {}, quests: {}, fights: {}, ...s } : { version: 1, done: {}, quests: {}, fights: {} };
}
const saveState = (yearKey, level, subject, st) => setSetting(stateKey(yearKey, level, subject), st);

/**
 * Résumé de la quête de l'année d'une classe : pour chaque matière jouable, chapitres faits, prochain chapitre,
 * chapitre en cours (quête commencée) et date de la dernière activité — pour la page « Aujourd'hui ».
 */
export async function yearSummary(level) {
  const now = store.now();
  const yearKey = schoolYearKey(now);
  const clock = yearClock(calendarOf(yearKey), now);
  const out = [];
  for (const c of yearCourses(level)) {
    const plan = await yearPlan(level, c.subject, clock);
    if (!plan.some((x) => x.stages)) continue;
    const st = await loadState(yearKey, level, c.subject);
    const pr = yearProgress(plan, st.done, clock);
    const last = Math.max(0, ...Object.values(st.done).map((d) => d.ts || 0), ...Object.values(st.quests).map((q) => q.createdAt || 0));
    // chapitre en cours : la quête commencée (pas finie) la plus récente
    const open = Object.entries(st.quests).filter(([, q]) => q && !isOver(q)).sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0));
    const inProgress = open.length ? plan.find((x) => x.id === open[0][0]) || null : null;
    out.push({ subject: c.subject, finished: pr.finished, chapters: pr.chapters, next: pr.next, nowChapter: pr.nowChapter, inProgress, last, complete: pr.complete });
  }
  return out;
}

/* ------------------------------ Cartes des matières ------------------------------ */

/** Les matières de la classe, avec l'avancement de l'année de chacune. */
export async function yearCards(container, { level, onOpen }) {
  const now = store.now();
  const yearKey = schoolYearKey(now);
  const clock = yearClock(calendarOf(yearKey), now);
  const cards = [];
  for (const c of yearCourses(level)) {
    const plan = await yearPlan(level, c.subject, clock);
    if (!plan.some((x) => x.stages)) continue;
    const st = await loadState(yearKey, level, c.subject);
    const pr = yearProgress(plan, st.done, clock);
    const medals = Object.values(st.done).filter(Boolean);
    const started = medals.length > 0 || Object.keys(st.quests).length > 0;
    cards.push(h('article', { class: `card card--accent year-card subj-${c.subject}` },
      h('div', { class: 'year-card-head' },
        h('span', { class: 'year-card-icon', 'aria-hidden': 'true' }, SUBJECT_ICONS[c.subject] || '•'),
        h('div', {}, h('h3', {}, subjLabel(c.subject)), h('p', { class: 'small muted' }, `${pr.finished}/${pr.chapters} chapitre${pr.chapters > 1 ? 's' : ''} · ${medals.filter((m) => m.medal === 'or').length} 🥇`))),
      h('div', { class: 'year-mini', role: 'img', 'aria-label': `${pr.finished} chapitres terminés sur ${pr.chapters}` },
        plan.filter((x) => x.stages).map((x) => h('i', { class: `${st.done[x.id] ? `is-${st.done[x.id].medal}` : ''} ${pr.next && pr.next.id === x.id ? 'is-next' : ''}` }))),
      h('p', { class: 'small' }, pr.complete ? '🎓 Année terminée : bravo !' : pr.next ? `Prochain chapitre : ${pr.next.title}` : ''),
      h('button', { type: 'button', class: 'btn btn--primary btn--small', onclick: () => onOpen(c.subject) }, pr.complete ? 'Voir mon année' : started ? 'Continuer mon année' : 'Commencer mon année')));
  }
  container.replaceChildren(...(cards.length ? cards : [h('p', { class: 'card' }, `Pas encore de parcours avec des exercices en ${levelLabel(level)}.`)]));
}

/* ------------------------------ Constellation de l'année ------------------------------ */

const MEDAL_COLORS = { or: '#f5c84c', argent: '#cfd6de', bronze: '#d9a066' };
const starPath = (cx, cy, r) => {
  const pts = [];
  for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5; const rr = k % 2 ? r * 0.45 : r; pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`); }
  return pts.join(' ');
};
function hashY(id) { let x = 7; for (const c of id) x = (x * 31 + c.codePointAt(0)) >>> 0; return x % 1000 / 1000; }

/**
 * La constellation de l'année : une étoile par chapitre, rangée dans sa période ; chaque chapitre terminé allume
 * son étoile (couleur de sa médaille), les étoiles allumées se relient. Le pointillé marque la date du jour.
 */
export function constellation(plan, done, clock, nextId) {
  const W = 900; const H = 190; const top = 22; const bottom = 34;
  const stars = plan.filter((c) => c.stages);
  const totalDays = clock.periods.reduce((s, p) => s + p.days, 0);
  const bands = []; let x0 = 10;
  for (const p of clock.periods) { const w = ((W - 20) * p.days) / totalDays; bands.push({ ...p, x: x0, w }); x0 += w; }
  const pts = stars.map((c) => {
    const b = bands[c.period];
    const inBand = stars.filter((x) => x.period === c.period);
    const k = inBand.indexOf(c);
    return { c, x: b.x + (b.w * (k + 0.5)) / inBand.length, y: top + 8 + hashY(c.id) * (H - top - bottom - 16) };
  });
  const lines = pts.slice(1).map((p, k) => {
    const a = pts[k]; const lit = done[a.c.id] && done[p.c.id];
    return `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" class="cst-line ${lit ? 'is-lit' : ''}"/>`;
  }).join('');
  const starsSvg = pts.map((p) => {
    const d = done[p.c.id];
    const medal = d ? (medalOf(d.ratio) || medalOf(MEDAL_MIN)) : null;
    const isNext = p.c.id === nextId;
    const title = `${p.c.title} — ${d ? medal.label : isNext ? 'prochain chapitre' : 'à venir'}`;
    if (d) return `<g class="cst-star is-lit"><title>${esc(title)}</title><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="14" class="cst-glow"/><polygon points="${starPath(p.x, p.y, 10)}" fill="${MEDAL_COLORS[medal.id]}" class="cst-shape"/></g>`;
    if (isNext) return `<g class="cst-star is-next"><title>${esc(title)}</title><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="12" class="cst-ring"/><polygon points="${starPath(p.x, p.y, 8)}" class="cst-shape cst-shape--next"/></g>`;
    return `<g class="cst-star"><title>${esc(title)}</title><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.2" class="cst-dot"/></g>`;
  }).join('');
  const bandSvg = bands.map((b) => `<rect x="${b.x.toFixed(1)}" y="${top}" width="${(b.w - 3).toFixed(1)}" height="${H - top - bottom}" rx="10" class="cst-band ${b.index === clock.current && clock.fraction < 1 ? 'is-now' : ''}"/><text x="${(b.x + b.w / 2).toFixed(1)}" y="${H - 12}" class="cst-label">${esc(b.short)}</text>`).join('');
  const todayX = 10 + clock.fraction * (W - 20);
  const today = clock.fraction > 0 && clock.fraction < 1 ? `<line x1="${todayX.toFixed(1)}" y1="${top - 6}" x2="${todayX.toFixed(1)}" y2="${H - bottom + 4}" class="cst-today"/><text x="${todayX.toFixed(1)}" y="${top - 9}" class="cst-today-label">aujourd’hui</text>` : '';
  const lit = stars.filter((c) => done[c.id]).length;
  const wrap = h('div', { class: 'constellation' });
  wrap.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Constellation de l’année : ${lit} étoile${lit > 1 ? 's' : ''} allumée${lit > 1 ? 's' : ''} sur ${stars.length}">${bandSvg}${lines}${starsSvg}${today}</svg>`;
  return wrap;
}

/* ------------------------------ Carte de l'année ------------------------------ */

function paceText(pr, clock, cal) {
  const per = clock.periods[clock.current];
  if (store.now() < clock.periods[0].from) return `L’année commence le ${fmtDate(clock.periods[0].from)} : tu peux déjà prendre de l’avance.`;
  if (clock.fraction >= 1) return 'L’année scolaire est finie : tu peux continuer à t’entraîner sur tous les chapitres.';
  const where = `Nous sommes ${clock.holiday ? 'en vacances, avant la' : 'en'} ${per.short.toLowerCase()} (${per.span})${cal.approx ? ', dates approchées' : ''}.`;
  // tout début : on ne parle pas de retard, on propose de commencer là où en est sans doute la classe
  if (!pr.finished) return `${where} Ta classe en est sans doute à la ${per.short.toLowerCase()} : commence par les chapitres de maintenant, ou reprends l’année depuis le début.${pr.complete ? '' : ` Pour finir en juin : environ ${pr.stepsPerWeek} étapes par semaine.`}`;
  const rhythm = pr.complete ? 'Toute l’année est faite : bravo !'
    : pr.pace === 'avance' ? 'Tu as de l’avance sur le rythme conseillé : super !'
      : pr.pace === 'retard' ? `Tu as un peu de retard sur le rythme conseillé (${pr.lag} chapitres) : pas de panique, avance pas à pas.`
        : 'Tu suis le rythme de l’année.';
  const weekly = pr.complete ? '' : ` Pour finir en juin : environ ${pr.stepsPerWeek} étape${pr.stepsPerWeek > 1 ? 's' : ''} par semaine (${clock.weeksLeft} semaine${clock.weeksLeft > 1 ? 's' : ''} de classe).`;
  return `${where} ${rhythm}${weekly}`;
}

export async function yearMap(stage, { level, subject, onBack, setStopper }) {
  const now = store.now();
  const yearKey = schoolYearKey(now);
  const cal = calendarOf(yearKey);
  const clock = yearClock(cal, now);
  const plan = await yearPlan(level, subject, clock);
  const yid = yearId(yearKey, level, subject);
  const st = await loadState(yearKey, level, subject);
  const save = () => saveState(yearKey, level, subject, st).catch(() => {});
  const playable = plan.filter((c) => c.stages);

  function showMap() {
    const pr = yearProgress(plan, st.done, clock);
    const g = gameProgress();
    const events = new Set(((store.states && store.states.game && store.states.game.events) || []).map((e) => `${e.type}:${e.id}`));
    // au tout début de la quête : aussi « le chapitre de maintenant » (là où en est sans doute la classe)
    const nowBtn = !pr.finished && pr.nowChapter && pr.next && pr.nowChapter.id !== pr.next.id
      ? h('button', { type: 'button', class: 'btn btn--primary', onclick: () => play(pr.nowChapter) }, `Chapitre de maintenant : ${pr.nowChapter.title}`) : null;
    const nextBtn = pr.next ? h('button', { type: 'button', class: nowBtn ? 'btn btn--ghost' : 'btn btn--primary', onclick: () => play(pr.next) },
      st.quests[pr.next.id] ? `Reprendre : ${pr.next.title}` : pr.finished ? `Continuer : ${pr.next.title}` : `Depuis le début : ${pr.next.title}`) : null;
    const station = (c) => {
      const d = st.done[c.id];
      const inProgress = st.quests[c.id] && !isOver(st.quests[c.id]);
      const isNext = pr.next && pr.next.id === c.id;
      const m = d ? medalOf(d.ratio) || medalOf(MEDAL_MIN) : null;
      return h('li', { class: `year-chapter ${d ? 'is-done' : ''} ${isNext ? 'is-next' : ''}` },
        h('span', { class: 'year-medal', 'aria-hidden': 'true' }, m ? m.icon : inProgress ? '◐' : '○'),
        h('div', { class: 'year-chapter-text' },
          c.unit ? h('small', { class: 'muted' }, `Unité ${c.unit.number} · ${c.unit.title}`) : null,
          h('strong', {}, c.title),
          h('small', { class: 'muted' }, `${c.stages} étape${c.stages > 1 ? 's' : ''} · ${c.stages * STEPS_PER_STAGE} exercices · ${c.stages} défi${c.stages > 1 ? 's' : ''}`,
            d ? ` · ${m.label}, ★ ${d.stars}/${d.maxStars}` : inProgress ? ' · en cours' : '')),
        h('button', { type: 'button', class: `btn btn--small ${isNext ? 'btn--primary' : 'btn--ghost'}`, onclick: () => play(c), 'aria-label': `${d ? 'Rejouer' : inProgress ? 'Reprendre' : 'Jouer'} : ${c.title}` },
          d ? 'Rejouer' : inProgress ? 'Reprendre' : 'Jouer'));
    };
    const periods = clock.periods.map((p) => {
      const cs = playable.filter((c) => c.period === p.index);
      const opened = events.has(`periode:${yid}:${p.index + 1}`);
      return h('section', { class: `year-period ${p.index === clock.current && clock.fraction < 1 ? 'is-now' : ''}`, 'aria-labelledby': `per-${p.index}` },
        h('header', { class: 'year-period-head' },
          h('div', {}, h('h3', { id: `per-${p.index}` }, p.short), h('p', { class: 'small muted' }, `${p.span} · du ${fmtDate(p.from)} au ${fmtDate(p.to - 86400000)}`)),
          p.index === clock.current && clock.fraction < 1 ? h('span', { class: 'year-now' }, '📍 maintenant') : null,
          h('span', { class: `year-period-chest ${opened ? 'is-open' : ''}`, title: opened ? 'Coffre de la période ouvert' : 'Termine tous les chapitres de la période pour ouvrir ce coffre' }, chestSvg({ rare: true, open: opened }),
            h('span', { class: 'sr-only' }, opened ? 'Coffre de la période ouvert' : 'Coffre de la période fermé'))),
        cs.length ? h('ol', { class: 'year-chapters' }, cs.map(station)) : h('p', { class: 'small muted' }, 'Pas de chapitre prévu dans cette période.'),
        cs.length ? guardianRow(p.index, cs, events) : null);
    });
    const later = plan.filter((c) => !c.stages);
    stage.replaceChildren(
      h('div', { class: 'series-head quest-head' },
        h('div', {}, h('p', { class: 'eyebrow' }, `Quête de l’année · ${yearKey} · ${levelLabel(level)}`), h('h2', {}, `Mon année de ${subjLabel(subject)}`)),
        h('div', { class: 'btn-row' },
          h('p', { class: 'quest-score' }, h('span', {}, h('b', {}, `${pr.finished}`), h('small', {}, `/${pr.chapters} chapitres`)), g ? h('span', {}, '📒 ', h('b', {}, String(g.counters.album)), h('small', {}, ' vignettes')) : null),
          h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => onBack() }, '← Toutes les matières'))),
      h('div', { class: 'card year-pace' }, photon(pr.pace === 'retard' ? 'encourage' : 'joie', 52),
        h('div', {}, h('p', {}, paceText(pr, clock, cal)),
          h('p', { class: 'small muted' }, 'Chaque chapitre terminé allume une étoile de ta constellation ; le pointillé montre où en est l’année. Tu peux jouer les chapitres dans un autre ordre si ta classe avance autrement.'),
          nextBtn || nowBtn ? h('div', { class: 'btn-row' }, nowBtn, nextBtn) : null)),
      constellation(plan, st.done, clock, pr.next && pr.next.id),
      h('div', { class: 'year-periods' }, periods),
      later.length ? h('details', { class: 'card year-later' }, h('summary', {}, `${later.length} chapitre${later.length > 1 ? 's' : ''} sans exercices pour l’instant`),
        h('ul', {}, later.map((c) => h('li', { class: 'small' }, c.title)))) : null);
    const first = nowBtn || nextBtn;
    if (first) first.focus({ preventScroll: true });
  }

  /** Le gardien d'une période : verrouillé, à défier (ou défi en cours), ou apprivoisé. */
  function guardianRow(p, cs, events) {
    const g = guardianOf(p);
    const u = guardianUnlock(cs, st.done);
    const tamed = events.has(`gardien:${yid}:${p + 1}`);
    const fight = st.fights[p] && !fightState(st.fights[p]).over ? st.fights[p] : null;
    const icon = h('span', { class: `year-guardian-icon ${u.open ? '' : 'is-locked'}`, 'aria-hidden': 'true' }, g.icon);
    if (!u.open) {
      return h('div', { class: 'year-guardian is-locked' }, icon,
        h('p', { class: 'small' }, h('strong', {}, `${g.name}, ${g.what}`), ` garde le trésor de la période. Termine ${u.need} chapitre${u.need > 1 ? 's' : ''} de la période pour le défier (${u.finished}/${u.need}).`));
    }
    if (tamed && !fight) {
      return h('div', { class: 'year-guardian is-tamed' }, icon,
        h('p', { class: 'small' }, h('strong', {}, `🏅 ${g.name} est ${agree(g, 'apprivoisé')}.`), ' Tu peux le défier encore pour réviser la période (sans nouveaux points).'),
        h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => fightGuardian(p), 'aria-label': `Rejouer contre ${g.name}` }, 'Rejouer'));
    }
    const hearts = fight ? fightState(fight).hearts : 0;
    return h('div', { class: 'year-guardian is-open' }, icon,
      h('p', { class: 'small' }, h('strong', {}, `${g.name}, ${g.what}, t’attend !`),
        fight ? ` Défi en cours : ${hearts} cœur${hearts > 1 ? 's' : ''} allumé${hearts > 1 ? 's' : ''} sur ${GUARDIAN_HEARTS}.` : ` ${GUARDIAN_QUESTIONS} questions mêlées des chapitres faits : allume ses ${GUARDIAN_HEARTS} cœurs pour gagner son trésor.`),
      h('button', { type: 'button', class: 'btn btn--primary btn--small', onclick: () => fightGuardian(p) }, fight ? `Reprendre le défi` : `Défier ${g.name}`));
  }

  /** Défie (ou reprend) le gardien de la période p : questions mêlées des chapitres terminés de la période. */
  function fightGuardian(p) {
    let fight = st.fights[p];
    if (!fight || fightState(fight).over) {
      const cs = playable.filter((c) => c.period === p && st.done[c.id]);
      const items = planReview({ level, subject, skillSets: cs.map((c) => c.skills), count: GUARDIAN_QUESTIONS });
      if (!fightPlayable(items)) { announce('Pas assez d’exercices pour défier ce gardien.'); return; }
      fight = newFight({ period: p, items, now: store.now() });
      st.fights[p] = fight;
      save();
    }
    window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
    const g = guardianOf(p);
    playGuardian(stage, fight, {
      eventId: `${yid}:${p + 1}`,
      eyebrow: `Gardien de la ${clock.periods[p].short.toLowerCase()} · Mon année de ${subjLabel(subject)} · ${levelLabel(level)}`,
      save: (f) => { st.fights[p] = f; return saveState(yearKey, level, subject, st); },
      onExit: () => { if (st.fights[p] && fightState(st.fights[p]).over) { delete st.fights[p]; save(); } showMap(); },
      onAgain: () => { delete st.fights[p]; save(); fightGuardian(p); },
      setStopper,
    });
    announce(`${g.name} t’attend : ${GUARDIAN_QUESTIONS} questions.`);
  }

  function play(ch) {
    let q = st.quests[ch.id];
    if (!q || isOver(q)) {
      const plan1 = planQuest({ level, subject, skills: new Set(ch.skills), stages: ch.stages });
      if (!plan1) { announce('Pas assez d’exercices pour ce chapitre.'); return; }
      q = newQuest({ id: `${yid}:${ch.id}`, title: ch.title, level, subject, chapter: ch.id, skills: ch.skills, size: 'annee', steps: plan1.steps, challenges: plan1.challenges, now: store.now() });
      st.quests[ch.id] = q;
      save();
    }
    window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
    playQuest(stage, q, {
      eyebrow: `Mon année de ${subjLabel(subject)} · ${levelLabel(level)}${ch.unit ? ` · unité ${ch.unit.number}` : ''}`,
      save: (qq) => { st.quests[ch.id] = qq; return saveState(yearKey, level, subject, st); },
      onPause: () => showMap(), onNew: () => showMap(), setStopper,
      onFinished: (s) => chapterDone(ch, s),
    });
  }

  async function chapterDone(ch, s) {
    const prev = st.done[ch.id];
    const m = medalOf(s.ratio);
    if (!m) { notYet(ch, s); return; }
    if (!prev || s.ratio > prev.ratio) st.done[ch.id] = { stars: s.stars, maxStars: s.maxStars, ratio: s.ratio, medal: m.id, chests: s.passed, ts: store.now() };
    delete st.quests[ch.id];
    await save();
    const pr = yearProgress(plan, st.done, clock);
    const before = gameProgress();
    await recordGameEvent('chapitre', `${yid}:${ch.id}`).catch(() => {});
    const beforePeriod = before ? before.counters.periodes : 0;
    if (ch.period !== null && pr.periodDone[ch.period]) await recordGameEvent('periode', `${yid}:${ch.period + 1}`).catch(() => {});
    if (pr.complete) await recordGameEvent('annee', yid).catch(() => {});
    const after = gameProgress();
    const gained = before && after ? after.totalXp - before.totalXp : 0;
    const vignettes = newVignettes(before, after);
    const periodOpened = after && after.counters.periodes > beforePeriod;
    const yearOpened = after && before && after.counters.annees > before.counters.annees;
    const next = pr.next;
    const medal = medalOf(st.done[ch.id].ratio);
    // le gardien de la période vient de s'éveiller (juste assez de chapitres terminés, pas encore apprivoisé)
    const perCs = ch.period !== null ? playable.filter((c) => c.period === ch.period) : [];
    const gu = perCs.length ? guardianUnlock(perCs, st.done) : null;
    const tamedNow = ((store.states && store.states.game && store.states.game.events) || []).some((e) => e.type === 'gardien' && e.id === `${yid}:${ch.period + 1}`);
    const woke = !prev && gu && gu.open && gu.finished === gu.need && !tamedNow;
    const g = woke ? guardianOf(ch.period) : null;
    stage.replaceChildren(h('section', { class: 'card year-done enter-fwd' },
      h('div', { class: 'year-done-medal', 'aria-hidden': 'true' }, m.icon),
      h('p', { class: 'eyebrow' }, 'Chapitre terminé'),
      h('h2', { tabindex: '-1' }, ch.title),
      h('p', {}, `${m.label} · ★ ${s.stars}/${s.maxStars} · coffres ouverts : ${s.passed}/${s.challenges}.${prev && medal.id !== m.id ? ` Tu gardes ta meilleure médaille : ${medal.label.toLowerCase()}.` : ''}`),
      gained > 0 ? h('p', { class: 'chest-points' }, `+${gained} points`) : h('p', { class: 'small muted' }, 'Chapitre déjà terminé cette année : pas de nouveaux points, mais bel entraînement !'),
      periodOpened ? chestReveal({ title: `Période ${ch.period + 1} accomplie : son coffre s’ouvre !`, points: 0, vignette: vignettes.shift() || null, rare: true }) : null,
      yearOpened ? chestReveal({ title: '🎓 Toute l’année est accomplie !', points: 0, vignette: vignettes.shift() || null, rare: true }) : null,
      g ? h('div', { class: 'year-guardian is-open is-woke' }, h('span', { class: 'year-guardian-icon', 'aria-hidden': 'true' }, g.icon),
        h('p', {}, h('strong', {}, `${g.name}, ${g.what}, s’est ${agree(g, 'réveillé')} !`), ` ${g.fem ? 'Elle' : 'Il'} garde le trésor de la ${clock.periods[ch.period].short.toLowerCase()} : ${GUARDIAN_QUESTIONS} questions mêlées de tes chapitres.`),
        h('button', { type: 'button', class: 'btn btn--small', onclick: () => fightGuardian(ch.period) }, `Défier ${g.name}`)) : null,
      (() => { const b = bonusGame(level, subject, ch); return b ? h('p', { class: 'year-bonus' }, h('span', { 'aria-hidden': 'true' }, `${b.icon} `), 'Bonus : ', h('a', { href: b.href }, b.label)) : null; })(),
      h('div', { class: 'btn-row' },
        next ? h('button', { type: 'button', class: 'btn btn--primary', onclick: () => play(next) }, `Chapitre suivant : ${next.title} →`) : null,
        h('button', { type: 'button', class: next ? 'btn btn--ghost' : 'btn btn--primary', onclick: () => showMap() }, 'Voir mon année'))));
    if (yearOpened || periodOpened) setTimeout(() => confetti(stage.firstChild, 90), 150);
    announce(`Chapitre terminé : ${m.label}.${periodOpened ? ' Coffre de la période ouvert.' : ''}`);
    const t = stage.querySelector('h2'); if (t) t.focus({ preventScroll: true });
  }

  /** Chapitre parcouru sans assez d'étoiles : pas de médaille, on le refait (nouveaux exercices). */
  function notYet(ch, s) {
    delete st.quests[ch.id];
    save();
    const again = h('button', { type: 'button', class: 'btn btn--primary', onclick: () => play(ch) }, 'Refaire ce chapitre');
    stage.replaceChildren(h('section', { class: 'card year-done enter-fwd' },
      photon('encourage', 72),
      h('p', { class: 'eyebrow' }, 'Bout du chapitre'),
      h('h2', { tabindex: '-1' }, ch.title),
      h('p', {}, `★ ${s.stars}/${s.maxStars} : il faut au moins ${Math.round(MEDAL_MIN * 100)} % des étoiles pour la médaille du chapitre. Relis les corrections, puis refais-le avec d’autres exercices : tu vas y arriver !`),
      h('div', { class: 'btn-row' }, again, h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => showMap() }, 'Voir mon année'))));
    announce('Chapitre à refaire pour gagner sa médaille.');
    again.focus({ preventScroll: true });
  }

  showMap();
}
