/**
 * Espace exercices : séries sur mesure (exercices des leçons + exercices générés) et générateurs
 * en entraînement illimité, avec impression d'une fiche et de son corrigé.
 * Chaque réponse est corrigée et diagnostiquée comme dans les leçons, et alimente le modèle de l'élève.
 */
import { h, tabs, pct, clear } from '../dom.js';
import { store, loadExercise, loadCourse, recentExerciseIds } from '../../app/store.js';
import { instantiate } from '../../core/checkers/index.js';
import { ERROR_TYPES } from '../../core/errors.js';
import { LEVELS as MASTERY, masteryLevel, DAY } from '../../engine/mastery.js';
import { mountExercise, TRACK_LABELS, TRACK_ICONS } from '../exercise.js';
import { allGenerators, produce, newSeed } from '../../generators/registry.js';
import { rng } from '../../core/template.js';
import { printSheet, printable } from '../print-sheet.js';

const TRACKS = ['classe', 'approfondissement', 'expert'];
const SUBJECT_ORDER = ['maths', 'pc', 'numerique', 'francais', 'hg', 'emc', 'svt', 'techno', 'lv', 'musique', 'arts-plastiques'];
const levelId = (x) => String(x || '').toLowerCase();

function subjLabel(id) {
  const s = store.catalog && store.catalog.subjects.find((x) => x.id === id);
  return s ? s.label : { lv: 'Langues vivantes', 'arts-plastiques': 'Arts plastiques', musique: 'Éducation musicale' }[id] || id;
}

function levelsWithContent() {
  const set = new Set([...store.index.lessons.map((l) => levelId(l.level)), ...allGenerators(store.index).flatMap((g) => g.levels.map(levelId))]);
  const ordered = (store.catalog ? store.catalog.levels.map((l) => l.id) : []).filter((l) => set.has(l));
  return ordered.length ? ordered : [...set];
}

function subjectsAt(level) {
  const set = new Set([
    ...store.index.exercises.filter((e) => levelId(e.level) === level).map((e) => e.subject),
    ...allGenerators(store.index).filter((g) => g.levels.map(levelId).includes(level)).map((g) => g.subject),
  ]);
  return [...set].sort((a, b) => (SUBJECT_ORDER.indexOf(a) + 100) % 100 - (SUBJECT_ORDER.indexOf(b) + 100) % 100);
}

/** Besoin d'entraînement d'une notion : peu maîtrisée, révision due, erreurs récentes. */
function need(skill) {
  const st = store.states.skills[skill];
  if (!st) return 1.1;
  let w = 1 - st.pL;
  if (st.due && st.due <= store.now() + DAY) w += 0.6;
  const recentErrors = store.attempts.slice(-40).filter((a) => a.skill === skill && (a.credit ?? 1) < 0.5).length;
  return Math.max(0.1, w + Math.min(0.6, recentErrors * 0.2));
}

function weightedPick(rand, items, weight) {
  const total = items.reduce((s, x) => s + weight(x), 0);
  let r = rand() * total;
  for (const x of items) { r -= weight(x); if (r <= 0) return x; }
  return items[items.length - 1];
}

const MAX_REPEAT = 3; // un exercice à valeurs variables revient au plus 3 fois (avec d'autres nombres)

/**
 * Compose une série sur les notions choisies, jusqu'au nombre demandé :
 *  1. exercices des leçons du parcours choisi, sans doublon, mêlés aux exercices générés de ce parcours ;
 *  2. s'il en manque, les exercices à valeurs variables reviennent avec d'autres nombres ;
 *  3. s'il en manque encore, des exercices générés sur les mêmes notions (fillPool : autre parcours,
 *     en général le niveau de la classe) complètent la série. Chaque exercice garde son vrai parcours.
 */
export function buildSeries({ lessonPool, genPool, fillPool = [], count, adapted, recent = [], rand = Math.random, level = null }) {
  const recentSet = new Set(recent);
  const weight = (skill, id) => (adapted ? need(skill) : 1) * (recentSet.has(id) ? 0.3 : 1);
  const seed = () => 1 + Math.floor(rand() * 2 ** 31);
  const genItem = (g, filler) => ({ kind: 'gen', meta: g, seed: seed(), opts: level ? { niveau: level } : {}, skill: g.skill, track: g.track || 'classe', difficulty: 2, ...(filler ? { filler: true } : {}) });
  const series = [];
  const lessons = lessonPool.slice();
  const maxGen = lessons.length ? Math.ceil(count / 2) : count;
  let gens = 0;
  while (series.length < count && (lessons.length || genPool.length)) {
    const useGen = genPool.length && (!lessons.length || (gens < maxGen && rand() < genPool.length / (genPool.length + lessons.length) + 0.15));
    if (useGen) {
      series.push(genItem(weightedPick(rand, genPool, (x) => weight(x.skill, null)), false));
      gens++;
    } else {
      const e = weightedPick(rand, lessons, (x) => weight(x.skill, x.id));
      lessons.splice(lessons.indexOf(e), 1);
      series.push({ kind: 'lesson', id: e.id, skill: e.skill, track: e.track, difficulty: e.difficulty });
    }
  }
  const uses = new Map(series.map((x) => [x.id, 1]));
  let variables = lessonPool.filter((e) => e.variable);
  while (series.length < count && variables.length) {
    const e = weightedPick(rand, variables, (x) => weight(x.skill, null));
    uses.set(e.id, (uses.get(e.id) || 0) + 1);
    if (uses.get(e.id) >= MAX_REPEAT) variables = variables.filter((x) => x !== e);
    series.push({ kind: 'lesson', id: e.id, seed: seed(), skill: e.skill, track: e.track, difficulty: e.difficulty, repeat: true });
  }
  while (series.length < count && fillPool.length) series.push(genItem(weightedPick(rand, fillPool, (x) => weight(x.skill, null)), true));
  return series.sort((a, b) => TRACKS.indexOf(a.track) - TRACKS.indexOf(b.track) || a.difficulty - b.difficulty);
}

/** Composition lisible d'une série (affichée avant de commencer et en titre). */
export function describeSeries(items) {
  const n = (f) => items.filter(f).length;
  const parts = [];
  for (const t of TRACKS) {
    const k = n((x) => x.track === t && !x.filler && !x.repeat && x.kind === 'lesson');
    if (k) parts.push(`${k} exercice${k > 1 ? 's' : ''} ${t === 'classe' ? 'du niveau de la classe' : t === 'approfondissement' ? 'd’approfondissement' : 'experts'} tirés des leçons`);
  }
  const rep = n((x) => x.repeat);
  if (rep) parts.push(`${rep} repris avec d’autres nombres`);
  const gen = n((x) => x.kind === 'gen' && !x.filler);
  if (gen) parts.push(`${gen} généré${gen > 1 ? 's' : ''}`);
  const fill = n((x) => x.filler);
  if (fill) parts.push(`${fill} généré${fill > 1 ? 's' : ''} du niveau de la classe pour compléter`);
  return parts.join(' + ');
}

async function materialize(item) {
  if (item.kind === 'gen') return { def: await produce(item.meta, item.seed, item.opts || {}), lessonId: null, seed: item.seed };
  const loaded = await loadExercise(item.id);
  return { def: loaded.def, lessonId: loaded.lesson.id, seed: item.seed };
}

/** Imprime une fiche ; renvoie un message à afficher (exercices retirés, échec), ou une chaîne vide. */
async function printItems(title, subtitle, items) {
  const out = [];
  let failed = 0;
  for (const it of items) {
    try {
      const m = await materialize(it);
      if (printable(m.def)) out.push({ def: m.def, inst: instantiate(m.def, it.seed || newSeed()) });
    } catch { failed++; }
  }
  if (!out.length) return 'Aucun exercice imprimable pour ce choix (les programmes et les manipulations se font à l’écran).';
  printSheet({ title, subtitle, items: out });
  const removed = items.length - out.length - failed;
  return [removed ? `${removed} exercice(s) interactif(s) (programmes, manipulations) retiré(s) de la fiche.` : '', failed ? `${failed} exercice(s) n’ont pas pu être chargés.` : ''].filter(Boolean).join(' ');
}

/* ------------------------------ Lecture d'une série ------------------------------ */

function lastAttemptFor(defId) {
  for (let i = store.attempts.length - 1; i >= 0; i--) if (store.attempts[i].exerciseId === defId) return store.attempts[i];
  return null;
}

function runSeries(stage, items, { title, subtitle, onRestart, cleanup }) {
  const results = [];
  let current = null; let index = 0; let stopped = false; let retry = null;
  if (cleanup.fn) cleanup.fn();
  cleanup.fn = () => { stopped = true; clearTimeout(retry); if (current) { current.destroy(); current = null; } };
  const progress = h('p', { class: 'eyebrow', 'aria-live': 'polite' });
  const bar = h('div', { class: 'series-bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(items.length) }, h('span'));
  const slot = h('div', {});
  stage.replaceChildren(h('div', { class: 'series-head' }, h('div', {}, h('h2', {}, title), subtitle ? h('p', { class: 'small muted' }, subtitle) : null), h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => summary() }, 'Arrêter et voir le bilan')), progress, bar, slot);

  const show = async () => {
    if (stopped) return;
    if (current) { current.destroy(); current = null; }
    if (index >= items.length) { summary(); return; }
    const item = items[index];
    progress.textContent = `Exercice ${index + 1} sur ${items.length}`;
    bar.setAttribute('aria-valuenow', String(index));
    bar.firstChild.style.width = `${(index / items.length) * 100}%`;
    let m;
    try { m = await materialize(item); } catch (e) { if (stopped) return; slot.replaceChildren(h('p', { class: 'card warn' }, `Exercice indisponible (${e.message}).`)); index++; retry = setTimeout(show, 800); return; }
    if (stopped) return;
    clear(slot);
    current = mountExercise(slot, {
      def: m.def, seed: item.seed, lessonId: m.lessonId, context: 'exercices:serie',
      nextLabel: index + 1 >= items.length ? 'Voir le bilan' : 'Exercice suivant',
      onNext: () => { results.push({ item, attempt: lastAttemptFor(m.def.id) }); index++; show(); },
    });
    slot.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const summary = () => {
    stopped = true; clearTimeout(retry);
    if (current) { current.destroy(); current = null; }
    const done = results.filter((r) => r.attempt);
    const ok = done.filter((r) => r.attempt.verdict === 'correct').length;
    const partial = done.filter((r) => r.attempt.verdict === 'partiel').length;
    const pending = done.filter((r) => ['a-valider', 'incertain'].includes(r.attempt.verdict)).length;
    const errors = {};
    for (const r of done) if (r.attempt.errorType && r.attempt.verdict !== 'correct') errors[r.attempt.errorType] = (errors[r.attempt.errorType] || 0) + 1;
    const skills = [...new Set(done.map((r) => r.attempt.skill))];
    const missed = results.filter((r) => r.attempt && !['correct', 'a-valider', 'incertain'].includes(r.attempt.verdict)).map((r) => (r.item.kind === 'gen' ? { ...r.item, seed: newSeed() } : r.item));
    progress.textContent = 'Série terminée';
    bar.firstChild.style.width = '100%';
    slot.replaceChildren(h('section', { class: 'card series-summary' },
      h('h3', {}, 'Bilan de la série'),
      h('p', { class: 'series-score' }, h('strong', {}, `${ok}`), ` réussi${ok > 1 ? 's' : ''} sur ${done.length}`, partial ? ` · ${partial} presque` : '', pending ? ` · ${pending} à relire par un adulte` : ''),
      Object.keys(errors).length ? h('div', {}, h('p', {}, 'Ce qui a coincé :'), h('ul', {}, Object.entries(errors).sort((a, b) => b[1] - a[1]).map(([k, n]) => h('li', {}, h('strong', {}, ERROR_TYPES[k] ? ERROR_TYPES[k].label : k), ` (${n}) — `, ERROR_TYPES[k] ? ERROR_TYPES[k].student : '')))) : null,
      skills.length ? h('div', {}, h('p', {}, 'Où tu en es maintenant :'), h('ul', { class: 'skill-pills' }, skills.map((s) => {
        const meta = store.index.skills.get(s); const st = store.states.skills[s]; const lv = masteryLevel(st, store.now());
        return meta ? h('li', { class: `skill-pill lvl-${lv}` }, `${meta.label} · ${MASTERY[lv].label.toLowerCase()}${st ? ` (${pct(st.pL)})` : ''}`) : null;
      }))) : null,
      h('div', { class: 'btn-row' },
        missed.length ? h('button', { type: 'button', class: 'btn btn--primary', onclick: () => runSeries(stage, missed, { title: 'Reprendre les exercices manqués', onRestart, cleanup }) }, `Reprendre les ${missed.length} exercice${missed.length > 1 ? 's' : ''} manqué${missed.length > 1 ? 's' : ''}`) : null,
        h('button', { type: 'button', class: missed.length ? 'btn btn--ghost' : 'btn btn--primary', onclick: onRestart }, 'Nouvelle série'),
        h('a', { class: 'btn btn--ghost', href: '#/carnet' }, 'Mon carnet'))));
  };

  show();
}

/* ------------------------------ Séries sur mesure ------------------------------ */

async function seriesPanel(panel, stageCleanup, params) {
  const levels = levelsWithContent();
  const asked = levelId(params.get('niveau'));
  const mine = levelId(store.profile.level);
  const state = {
    level: levels.includes(asked) ? asked : levels.includes(mine) ? mine : levels[0],
    subject: params.get('matiere') || null,
    skills: new Set((params.get('notions') || '').split(',').filter((s) => store.index.skills.has(s))),
    tracks: new Set(['classe']), count: 10, noQcm: true, adapted: true, fill: true,
  };
  const form = h('form', { class: 'card series-form', onsubmit: (e) => { e.preventDefault(); start(); } });
  const stage = h('div', { class: 'series-stage' });
  panel.append(form, stage);

  const pools = () => {
    const lessonPool = store.index.exercises.filter((e) => levelId(e.level) === state.level && e.subject === state.subject && state.tracks.has(e.track)
      && (!state.noQcm || e.type !== 'qcm') && e.role !== 'labo' && (!state.skills.size || state.skills.has(e.skill)));
    const gens = allGenerators(store.index).filter((g) => g.subject === state.subject && g.levels.map(levelId).includes(state.level)
      && (!state.skills.size || state.skills.has(g.skill)));
    const genPool = gens.filter((g) => state.tracks.has(g.track || 'classe'));
    // générateurs des mêmes notions mais d'un autre parcours : ils complètent une série trop courte
    const fillPool = gens.filter((g) => !state.tracks.has(g.track || 'classe'));
    return { lessonPool, genPool, fillPool };
  };
  const plan = (rand, recent = []) => {
    const { lessonPool, genPool, fillPool } = pools();
    return buildSeries({ lessonPool, genPool, fillPool: state.fill ? fillPool : [], count: state.count, adapted: state.adapted, recent, rand, level: state.level });
  };

  const status = h('p', { class: 'small muted', 'aria-live': 'polite' });

  const start = () => {
    const items = plan(Math.random, recentExerciseIds(30));
    if (!items.length) return;
    form.hidden = true;
    runSeries(stage, items, {
      title: `${subjLabel(state.subject)} · ${items.length} exercices`, subtitle: describeSeries(items), cleanup: stageCleanup,
      onRestart: () => { if (stageCleanup.fn) stageCleanup.fn(); stageCleanup.fn = null; stage.replaceChildren(); form.hidden = false; render(); },
    });
  };

  const print = async () => {
    const items = plan(Math.random).map((it) => ({ ...it, seed: it.seed || newSeed() }));
    status.textContent = await printItems(`${subjLabel(state.subject)} · fiche d'exercices`, `Classe de ${state.level} · ${items.length} exercices`, items);
  };

  async function render() {
    const subjects = subjectsAt(state.level);
    if (!subjects.includes(state.subject)) { state.subject = subjects[0]; state.skills = new Set(); }
    const course = store.catalog && store.catalog.courses.find((c) => c.level === state.level && c.subject === state.subject);
    const courseData = course ? await loadCourse(course.id) : null;
    const allLessonEx = store.index.exercises.filter((e) => levelId(e.level) === state.level && e.subject === state.subject);
    const gens = allGenerators(store.index).filter((g) => g.subject === state.subject && g.levels.map(levelId).includes(state.level));
    const available = new Set([...allLessonEx.map((e) => e.skill), ...gens.map((g) => g.skill)]);
    // une notion choisie qui n'existe pas dans cette classe (changement de classe, lien de la carte) est retirée
    state.skills = new Set([...state.skills].filter((s) => available.has(s)));
    const groups = [];
    const placed = new Set();
    for (const ch of (courseData && courseData.chapters) || []) {
      const sk = (ch.skills || []).filter((s) => available.has(s) && !placed.has(s));
      if (sk.length) { groups.push({ title: ch.title, skills: sk }); sk.forEach((s) => placed.add(s)); }
    }
    const rest = [...available].filter((s) => !placed.has(s));
    if (rest.length) groups.push({ title: groups.length ? 'Autres notions' : 'Notions', skills: rest });

    const sel = (key, label, value, options, onchange) => h('label', { class: 'field' }, h('span', { class: 'field-label' }, label),
      h('select', { class: 'field-input', dataset: { key }, onchange: (e) => onchange(e.target.value) }, options.map(([v, l]) => h('option', { value: v, selected: String(v) === String(value) }, l))));
    const check = (key, label, checked, onchange, extra = {}) => h('label', { class: 'check-inline', ...extra }, h('input', { type: 'checkbox', checked, dataset: { key }, onchange: (e) => onchange(e.target.checked) }), ' ', label);

    const { lessonPool, genPool, fillPool } = pools();
    const n = lessonPool.length;
    // aperçu de la série (tirage fixe) : l'élève voit d'avance combien d'exercices il aura et d'où ils viennent
    const preview = plan(rng(1));
    const short = preview.length < state.count;
    // le formulaire est reconstruit : on rend le focus clavier à l'élément qui l'avait
    const focusKey = form.contains(document.activeElement) && document.activeElement.dataset ? document.activeElement.dataset.key : null;
    form.replaceChildren(
      h('div', { class: 'series-grid' },
        sel('classe', 'Classe', state.level, levels.map((l) => [l, (store.catalog.levels.find((x) => x.id === l) || { label: l }).label]), (v) => { state.level = v; render(); }),
        sel('matiere', 'Matière', state.subject, subjects.map((s) => [s, subjLabel(s)]), (v) => { state.subject = v; state.skills = new Set(); render(); }),
        sel('nombre', 'Nombre d’exercices', state.count, [5, 10, 15, 20].map((x) => [x, String(x)]), (v) => { state.count = Number(v); render(); })),
      h('fieldset', { class: 'series-fs' }, h('legend', {}, 'Chapitres et notions ', h('span', { class: 'muted small' }, state.skills.size ? `(${state.skills.size} choisie${state.skills.size > 1 ? 's' : ''})` : '(toutes)')),
        groups.map((g) => h('div', { class: 'series-group' }, h('p', { class: 'series-group-title' }, g.title),
          h('div', { class: 'series-skills' }, g.skills.map((s) => {
            const meta = store.index.skills.get(s); const lv = masteryLevel(store.states.skills[s], store.now());
            return check(`notion:${s}`, h('span', {}, meta ? meta.label : s, ' ', h('span', { class: `skill-dot lvl-${lv}`, title: MASTERY[lv].label }), h('span', { class: 'sr-only' }, `(${MASTERY[lv].label})`)), state.skills.has(s), (on) => { if (on) state.skills.add(s); else state.skills.delete(s); render(); }, { class: 'check-inline series-skill' });
          }))))),
      h('fieldset', { class: 'series-fs' }, h('legend', {}, 'Parcours'),
        h('div', { class: 'series-skills' }, TRACKS.map((t) => check(`parcours:${t}`, `${TRACK_ICONS[t]} ${TRACK_LABELS[t]}`, state.tracks.has(t), (on) => { if (on) state.tracks.add(t); else if (state.tracks.size > 1) state.tracks.delete(t); render(); })))),
      h('div', { class: 'series-skills' },
        check('adaptee', 'Adaptée à mes besoins (notions peu maîtrisées, révisions dues, erreurs récentes en priorité)', state.adapted, (on) => { state.adapted = on; }),
        check('sans-qcm', 'Sans vérification rapide (QCM)', state.noQcm, (on) => { state.noQcm = on; render(); })),
      fillPool.length ? check('completer', `Compléter avec des exercices générés sur ces notions (niveau de la classe) s’il n’y a pas assez d’exercices dans le parcours choisi`, state.fill, (on) => { state.fill = on; render(); }) : null,
      h('div', { class: `series-preview ${short ? 'is-short' : ''}`, 'aria-live': 'polite' },
        h('p', {}, h('strong', {}, preview.length ? `Série prévue : ${preview.length} exercice${preview.length > 1 ? 's' : ''}` : 'Aucun exercice pour ce choix'), preview.length ? ` — ${describeSeries(preview)}.` : '.'),
        short && preview.length ? h('p', { class: 'small' }, `Il n’y a pas ${state.count} exercices différents pour ces notions dans ce parcours. Pour en avoir plus : cocher d’autres notions ou le parcours « Niveau de la classe »${fillPool.length && !state.fill ? ', ou cocher « Compléter avec des exercices générés »' : ''}.`) : null,
        h('p', { class: 'small muted' }, `Réservoir : ${n} exercice${n > 1 ? 's' : ''} de leçons${genPool.length ? ` + ${genPool.length} générateur${genPool.length > 1 ? 's' : ''} (exercices nouveaux à chaque tirage)` : ''}.`)),
      h('div', { class: 'btn-row' },
        h('button', { type: 'submit', class: 'btn btn--primary', disabled: !n && !genPool.length }, 'Commencer la série'),
        h('button', { type: 'button', class: 'btn btn--ghost', disabled: !n && !genPool.length, onclick: () => print() }, h('span', { 'aria-hidden': 'true' }, '🖨 '), 'Imprimer une fiche avec corrigé')),
      status);
    if (focusKey) { const el = [...form.querySelectorAll('[data-key]')].find((x) => x.dataset.key === focusKey); if (el) el.focus(); }
  }
  await render();
}

/* ------------------------------ Générateurs ------------------------------ */

function trainer(stage, meta, opts, onBack, cleanup) {
  const stats = { done: 0, ok: 0, first: 0, streak: 0, best: 0 };
  let current = null; let stopped = false;
  const counter = h('p', { class: 'trainer-stats', 'aria-live': 'polite' });
  const status = h('p', { class: 'small muted', 'aria-live': 'polite' });
  const slot = h('div', {});
  const stop = () => { stopped = true; if (current) { current.destroy(); current = null; } };
  if (cleanup.fn) cleanup.fn();
  cleanup.fn = stop;
  const updateStats = () => {
    counter.replaceChildren(
      h('span', {}, h('strong', {}, String(stats.ok)), ` réussi${stats.ok > 1 ? 's' : ''} sur ${stats.done}`, stats.ok ? ` (dont ${stats.first} du premier coup)` : ''),
      h('span', {}, 'Série sans faute : ', h('strong', {}, String(stats.streak))),
      h('span', {}, 'Record : ', h('strong', {}, String(stats.best))));
  };
  const next = async () => {
    if (current) { current.destroy(); current = null; }
    const seed = newSeed();
    let def;
    try { def = await produce(meta, seed, opts); } catch (e) { if (!stopped) slot.replaceChildren(h('p', { class: 'card warn' }, e.message)); return; }
    if (stopped) return;
    clear(slot);
    current = mountExercise(slot, {
      def, seed, context: `exercices:generateur:${meta.id}`, nextLabel: 'Exercice suivant',
      onNext: () => {
        const a = lastAttemptFor(def.id);
        if (a && !['a-valider', 'incertain'].includes(a.verdict)) {
          stats.done++;
          // « du premier coup » : un seul essai, sans indice ni correction affichée
          const firstTry = a.verdict === 'correct' && a.tries === 1 && !a.hintsUsed && !a.solutionShown;
          if (a.verdict === 'correct') stats.ok++;
          if (firstTry) { stats.first++; stats.streak++; stats.best = Math.max(stats.best, stats.streak); } else stats.streak = 0;
        }
        updateStats(); next();
      },
    });
  };
  const printTen = async () => { status.textContent = await printItems(meta.label, 'Exercices générés', Array.from({ length: 10 }, () => ({ kind: 'gen', meta, opts, seed: newSeed() }))); };
  stage.replaceChildren(
    h('div', { class: 'series-head' }, h('div', {}, h('p', { class: 'eyebrow' }, 'Entraînement illimité'), h('h2', {}, meta.label)),
      h('div', { class: 'btn-row' },
        h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: printTen }, h('span', { 'aria-hidden': 'true' }, '🖨 '), 'Fiche de 10'),
        h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => { stop(); cleanup.fn = null; onBack(); } }, '← Autres générateurs'))),
    status, counter, slot);
  updateStats();
  next();
}

function generatorsPanel(panel, stageCleanup) {
  const levels = levelsWithContent();
  const state = { level: levels.includes(levelId(store.profile.level)) ? levelId(store.profile.level) : 'tous', subject: 'tous' };
  const list = h('div', {});
  const stage = h('div', {});
  const status = h('p', { class: 'small muted', 'aria-live': 'polite' });
  panel.append(list, stage);

  const render = () => {
    const gens = allGenerators(store.index).filter((g) => state.level === 'tous' || g.levels.map(levelId).includes(state.level));
    const subjects = [...new Set(gens.map((g) => g.subject))].sort((a, b) => (SUBJECT_ORDER.indexOf(a) + 100) % 100 - (SUBJECT_ORDER.indexOf(b) + 100) % 100);
    if (state.subject !== 'tous' && !subjects.includes(state.subject)) state.subject = 'tous';
    const shown = gens.filter((g) => state.subject === 'tous' || g.subject === state.subject);
    const focusKey = list.contains(document.activeElement) && document.activeElement.dataset ? document.activeElement.dataset.key : null;
    const filters = h('div', { class: 'series-grid card' },
      h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Classe'),
        h('select', { class: 'field-input', dataset: { key: 'classe' }, onchange: (e) => { state.level = e.target.value; render(); } }, h('option', { value: 'tous' }, 'Toutes'), levels.map((l) => h('option', { value: l, selected: l === state.level }, (store.catalog.levels.find((x) => x.id === l) || { label: l }).label)))),
      h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Matière'),
        h('select', { class: 'field-input', dataset: { key: 'matiere' }, onchange: (e) => { state.subject = e.target.value; render(); } }, h('option', { value: 'tous' }, 'Toutes'), subjects.map((s) => h('option', { value: s, selected: s === state.subject }, subjLabel(s))))),
      h('p', { class: 'small muted', style: { alignSelf: 'end' } }, `${shown.length} générateur${shown.length > 1 ? 's' : ''} : chaque exercice est nouveau, corrigé et diagnostiqué.`));
    const cards = shown.map((g) => {
      const chosen = {};
      const meta = store.index.skills.get(g.skill);
      const lv = masteryLevel(store.states.skills[g.skill], store.now());
      const printTen = async () => { status.textContent = await printItems(g.label, 'Exercices générés', Array.from({ length: 10 }, () => ({ kind: 'gen', meta: g, opts: { ...chosen }, seed: newSeed() }))); };
      return h('article', { class: `card card--accent gen-card subj-${g.subject}` },
        h('p', { class: 'eyebrow' }, subjLabel(g.subject), ' · ', g.levels.join(', ')),
        h('h3', {}, g.label),
        g.description ? h('p', { class: 'small' }, g.description) : null,
        meta ? h('p', { class: 'small' }, h('span', { class: `skill-pill lvl-${lv}` }, `${meta.label} · ${MASTERY[lv].label.toLowerCase()}`)) : null,
        (g.options || []).map((o) => h('label', { class: 'field' }, h('span', { class: 'field-label' }, o.label),
          h('select', { class: 'field-input', onchange: (e) => { chosen[o.id] = e.target.value; } }, h('option', { value: '' }, 'Au hasard'), o.values.map((v) => h('option', { value: v.id }, v.label))))),
        h('div', { class: 'btn-row' },
          h('button', { type: 'button', class: 'btn btn--primary btn--small', onclick: () => { list.hidden = true; trainer(stage, g, { ...chosen }, () => { stage.replaceChildren(); list.hidden = false; render(); }, stageCleanup); } }, 'S’entraîner'),
          h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: printTen }, h('span', { 'aria-hidden': 'true' }, '🖨 '), 'Fiche')));
    });
    list.replaceChildren(filters, status, shown.length ? h('div', { class: 'grid grid--3 gen-grid' }, cards) : h('p', { class: 'card' }, 'Aucun générateur pour ce choix.'));
    if (focusKey) { const el = [...list.querySelectorAll('[data-key]')].find((x) => x.dataset.key === focusKey); if (el) el.focus(); }
  };
  render();
}

export async function render(root, { params }) {
  const tab = params.get('onglet') === 'generateurs' ? 'generateurs' : 'series';
  const stageCleanup = { fn: null };
  root.append(h('div', { class: 'page-head' },
    h('div', {}, h('p', { class: 'eyebrow' }, 'Espace exercices'), h('h1', {}, 'S’entraîner à la demande'),
      h('p', { class: 'muted' }, 'Compose une série sur mesure ou lance un générateur : chaque réponse est corrigée, la démarche analysée, et ta progression mise à jour.'))));
  root.append(tabs([{ id: 'series', label: 'Séries sur mesure', icon: '☰' }, { id: 'generateurs', label: 'Générateurs illimités', icon: '∞' }], tab,
    (id) => { location.hash = `#/exercices${id === 'generateurs' ? '?onglet=generateurs' : ''}`; }, 'Espace exercices'));
  const panel = h('div', { class: 'ex-space', role: 'tabpanel' });
  root.append(panel);
  if (tab === 'series') await seriesPanel(panel, stageCleanup, params);
  else generatorsPanel(panel, stageCleanup);
  return () => { if (stageCleanup.fn) stageCleanup.fn(); };
}
