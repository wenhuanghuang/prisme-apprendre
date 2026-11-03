/**
 * Quête de l'année (onglet « Quête » de l'Espace exercices) : pour chaque matière, les chapitres du programme dans
 * l'ordre, répartis sur les cinq périodes de l'année scolaire. Chaque chapitre se joue comme une quête (étapes,
 * défis, coffres) ; terminé, il reçoit une médaille ; une période terminée ouvre un coffre rare ; l'année entière,
 * un dernier coffre. La date du jour indique le rythme conseillé, sans rien verrouiller : chaque chapitre reste
 * jouable, si la classe suit un autre ordre.
 */
import { h, announce } from '../dom.js';
import { store, getSetting, setSetting, loadCourse, recordGameEvent, gameProgress } from '../../app/store.js';
import { calendarOf, schoolYearKey, yearClock, planYear, yearProgress, chapterStages, medalOf, yearId, MEDAL_MIN } from '../../engine/annee.js';
import { newQuest, questSummary, isOver, STEPS_PER_STAGE } from '../../engine/quete.js';
import { allGenerators, coversSkills } from '../../generators/registry.js';
import { planQuest } from './quest-plan.js';
import { playQuest } from './quest-view.js';
import { quickExercise } from './deck.js';
import { subjLabel } from '../views/exercices.js';
import { SUBJECT_ICONS } from '../parcours/data.js';
import { photon } from '../photon.js';
import { chestReveal, chestSvg, newVignettes } from './rewards-ui.js';
import { confetti } from '../lesson-play/celebrate.js';

const levelId = (x) => String(x || '').toLowerCase();
const levelLabel = (id) => ((store.catalog && store.catalog.levels.find((l) => l.id === id)) || { label: id }).label;
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmtDate = (ms) => { const d = new Date(ms); return `${d.getDate() === 1 ? '1er' : d.getDate()} ${d.toLocaleDateString('fr-FR', { month: 'long' })}`; };

/* ------------------------------ Données ------------------------------ */

/** Parcours d'une classe qui ont des chapitres jouables. */
function yearCourses(level) {
  return (store.catalog ? store.catalog.courses : []).filter((c) => c.level === level && c.coverage !== 'reference');
}

/** Chapitres de l'année d'une matière, dans l'ordre du parcours, avec leur nombre d'étapes et leur période. */
export async function yearPlan(level, subject, clock) {
  const course = yearCourses(level).find((c) => c.subject === subject);
  const data = course ? await loadCourse(course.id) : null;
  if (!data) return [];
  const unitOf = new Map();
  (data.units || []).forEach((u, i) => (u.chapters || []).forEach((id) => unitOf.set(id, { number: i + 1, title: u.title })));
  const exercises = store.index.exercises.filter((e) => levelId(e.level) === level && e.subject === subject && (e.track || 'classe') === 'classe' && quickExercise(e));
  const gens = allGenerators(store.index).filter((g) => g.subject === subject && g.levels.map(levelId).includes(level) && g.kind !== 'probleme');
  const chapters = (data.chapters || []).map((ch) => {
    const skills = new Set(ch.skills || []);
    const n = exercises.filter((e) => skills.has(e.skill)).length;
    const hasGen = skills.size > 0 && gens.some((g) => coversSkills(g, skills));
    return { id: ch.id, title: ch.title, skills: [...skills], unit: unitOf.get(ch.id) || null, stages: chapterStages(n, hasGen) };
  });
  return planYear(chapters, clock.periods);
}

const stateKey = (yearKey, level, subject) => `annee:${store.profile.id}:${yearKey}:${level}:${subject}`;
async function loadState(yearKey, level, subject) {
  const s = await getSetting(stateKey(yearKey, level, subject), null).catch(() => null);
  return s && s.version === 1 ? { done: {}, quests: {}, ...s } : { version: 1, done: {}, quests: {} };
}
const saveState = (yearKey, level, subject, st) => setSetting(stateKey(yearKey, level, subject), st);

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
        cs.length ? h('ol', { class: 'year-chapters' }, cs.map(station)) : h('p', { class: 'small muted' }, 'Pas de chapitre prévu dans cette période.'));
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
          h('div', { class: 'year-bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(pr.chapters), 'aria-valuenow': String(pr.finished), 'aria-label': 'Chapitres terminés' },
            h('i', { style: { width: `${pr.chapters ? (pr.finished / pr.chapters) * 100 : 0}%` } }),
            h('b', { class: 'year-bar-today', style: { left: `${clock.fraction * 100}%` }, title: 'Rythme conseillé à cette date' })),
          h('p', { class: 'small muted' }, 'La barre montre les chapitres faits ; le repère, le rythme conseillé à cette date. Tu peux jouer les chapitres dans un autre ordre si ta classe avance autrement.'),
          nextBtn || nowBtn ? h('div', { class: 'btn-row' }, nowBtn, nextBtn) : null)),
      h('div', { class: 'year-periods' }, periods),
      later.length ? h('details', { class: 'card year-later' }, h('summary', {}, `${later.length} chapitre${later.length > 1 ? 's' : ''} sans exercices pour l’instant`),
        h('ul', {}, later.map((c) => h('li', { class: 'small' }, c.title)))) : null);
    const first = nowBtn || nextBtn;
    if (first) first.focus({ preventScroll: true });
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
    stage.replaceChildren(h('section', { class: 'card year-done enter-fwd' },
      h('div', { class: 'year-done-medal', 'aria-hidden': 'true' }, m.icon),
      h('p', { class: 'eyebrow' }, 'Chapitre terminé'),
      h('h2', { tabindex: '-1' }, ch.title),
      h('p', {}, `${m.label} · ★ ${s.stars}/${s.maxStars} · coffres ouverts : ${s.passed}/${s.challenges}.${prev && medal.id !== m.id ? ` Tu gardes ta meilleure médaille : ${medal.label.toLowerCase()}.` : ''}`),
      gained > 0 ? h('p', { class: 'chest-points' }, `+${gained} points`) : h('p', { class: 'small muted' }, 'Chapitre déjà terminé cette année : pas de nouveaux points, mais bel entraînement !'),
      periodOpened ? chestReveal({ title: `Période ${ch.period + 1} accomplie : son coffre s’ouvre !`, points: 0, vignette: vignettes.shift() || null, rare: true }) : null,
      yearOpened ? chestReveal({ title: '🎓 Toute l’année est accomplie !', points: 0, vignette: vignettes.shift() || null, rare: true }) : null,
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
