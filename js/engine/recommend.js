/**
 * Moteur de recommandation : à partir du profil (états des compétences) et du graphe des compétences,
 * propose les prochaines activités, chacune avec une raison lisible par l'élève ET par le parent.
 *
 * Règles (par priorité décroissante) :
 *  - difficulté ancienne qui réapparaît           → rappel ciblé
 *  - prérequis manquant                           → exercice plus simple sur le prérequis
 *  - erreur répétée du même type                  → explication + exercices sur cette difficulté précise,
 *                                                    dans une autre représentation si la même a échoué
 *  - révision espacée arrivée à échéance          → révision
 *  - réponses justes non justifiées               → exercices où il faut expliquer
 *  - suite du parcours de la classe               → prochaine notion dont les prérequis sont acquis
 *  - notion maîtrisée sans transfert              → problème de transfert
 *  - réussite rapide et autonome                  → approfondissement puis défi expert (facultatifs)
 */
import { DAY, masteryLevel, autonomy, speedRatio, recurringErrors } from './mastery.js';
import { ERROR_TYPES } from '../core/errors.js';

const REPRESENTATION_LABEL = { symbolique: 'calcul écrit', visuelle: 'schéma ou figure', concrete: 'situation concrète', manipulation: 'manipulation', verbale: 'explication en mots' };

function hasExercises(index, query) {
  return index.exercises.some((e) => matches(e, query));
}

export function matches(e, q) {
  if (q.skillsAny) {
    if (!q.skillsAny.includes(e.skill) && !(e.skills || []).some((s) => q.skillsAny.includes(s))) return false;
  } else if (q.skill && e.skill !== q.skill && !(e.skills || []).includes(q.skill)) return false;
  if (q.track && (e.track || 'classe') !== q.track) return false;
  if (q.roles && !q.roles.includes(e.role)) return false;
  if (q.requireTargets && q.targets && !(e.targets || []).some((t) => q.targets.includes(t))) return false;
  if (q.justify && !e.justify && e.type !== 'open') return false;
  return true;
}

function label(index, id) {
  const s = index.skills.get(id);
  return s ? s.label : id;
}

function daysAgo(now, ts) {
  return Math.max(0, Math.round((now - ts) / DAY));
}

/**
 * @param {{skills: Map, exercises: Array}} index  graphe des compétences et métadonnées des exercices
 * @param {Object<string, object>} states           état par compétence (cf. mastery.js)
 * @param {{now:number, level?:string, focusSkills?:string[], limit?:number}} ctx
 */
export function recommend(index, states, ctx) {
  const now = ctx.now;
  const out = [];
  const push = (r) => { if (hasExercises(index, r.query)) out.push(r); };
  const stateOf = (id) => states[id];
  const levelOf = (id) => masteryLevel(stateOf(id), now);
  const prereqWeak = (id) => {
    const lv = levelOf(id);
    const st = stateOf(id);
    return lv === 'non-vu' || lv === 'decouverte' || lv === 'fragile' || (st && st.pL < 0.6 && lv !== 'a-revoir');
  };

  for (const [skillId, st] of Object.entries(states)) {
    if (!index.skills.has(skillId) || !st || !st.n) continue;
    const skill = index.skills.get(skillId);
    const lv = masteryLevel(st, now);

    // 1. Difficulté ancienne qui réapparaît
    const lastErr = st.recentErrors[st.recentErrors.length - 1];
    if (lastErr && lastErr.resurgence && now - lastErr.ts < 10 * DAY && (st.successesSinceError[lastErr.type] || 0) < 2) {
      const errLabel = ERROR_TYPES[lastErr.type] ? ERROR_TYPES[lastErr.type].label.toLowerCase() : 'erreur';
      push({
        kind: 'resurgence', skill: skillId, priority: 95,
        title: `Rappel : ${skill.label}`,
        reasonStudent: `Une difficulté que tu avais surmontée revient (« ${errLabel} »). Un rappel rapide suffit souvent à la faire disparaître.`,
        reasonParent: `Difficulté ancienne réapparue sur « ${skill.label} » (${errLabel}) alors qu'elle était résolue depuis plusieurs réussites.`,
        query: { skill: skillId, track: 'classe', roles: ['remediation', 'guide', 'libre'], targets: [lastErr.type, lastErr.misconception].filter(Boolean), maxDifficulty: 3 },
        evidence: { error: lastErr },
      });
    }

    // 2. Prérequis manquant (désigné par une idée fausse, ou compétence fragile dont un prérequis est faible)
    const declared = st.recentErrors.filter((e) => e.prerequisite && now - e.ts < 21 * DAY).map((e) => e.prerequisite);
    const structural = (lv === 'fragile' || st.failStreak >= 2) ? (skill.prereqs || []).filter(prereqWeak) : [];
    for (const pre of new Set([...declared, ...structural])) {
      if (!index.skills.has(pre)) continue;
      const declaredCount = declared.filter((d) => d === pre).length;
      push({
        kind: 'prerequis', skill: pre, forSkill: skillId, priority: declaredCount ? 90 : 86,
        title: `D'abord : ${label(index, pre)}`,
        reasonStudent: declaredCount
          ? `Tes erreurs sur « ${skill.label} » viennent souvent de « ${label(index, pre)} ». On consolide ce point avec un exercice plus simple, puis on revient.`
          : `« ${skill.label} » s'appuie sur « ${label(index, pre)} », qui n'est pas encore solide. On commence par là.`,
        reasonParent: declaredCount
          ? `${declaredCount} erreur(s) récente(s) sur « ${skill.label} » correspondent à une idée fausse rattachée au prérequis « ${label(index, pre)} ».`
          : `Compétence fragile (« ${skill.label} ») dont le prérequis « ${label(index, pre)} » est lui-même peu ou pas maîtrisé.`,
        query: { skill: pre, track: 'classe', roles: ['remediation', 'guide', 'libre'], maxDifficulty: 2 },
        evidence: { declaredCount },
      });
    }

    // 3. Erreur répétée sur une difficulté précise
    for (const rec of recurringErrors(st, now).filter((r) => (st.successesSinceError[r.type] || 0) < 3).slice(0, 1)) {
      if (rec.type === 'sans-justification') continue;
      const errLabel = ERROR_TYPES[rec.type] ? ERROR_TYPES[rec.type].label.toLowerCase() : 'erreur';
      const tried = rec.representations;
      const alternatives = ['visuelle', 'manipulation', 'concrete', 'symbolique'].filter((r) => !tried.includes(r));
      const changeRep = tried.length > 0 && rec.count >= 2;
      push({
        kind: 'remediation', skill: skillId, priority: rec.type === 'notion' ? 88 : 84,
        title: `Point précis : ${skill.label}`,
        reasonStudent: `${rec.count} erreurs du même type (« ${errLabel} ») sur cette notion. Voici une courte explication ciblée et des exercices sur ce point précis${changeRep ? `, présentés autrement (${REPRESENTATION_LABEL[alternatives[0]] || 'autre approche'})` : ''}.`,
        reasonParent: `Erreur récurrente « ${errLabel} » (${rec.count} fois en 3 semaines)${rec.misconception ? `, idée fausse identifiée : ${rec.misconception}` : ''}. ${changeRep ? 'Changement de représentation proposé car la même approche a échoué.' : ''}`.trim(),
        query: { skill: skillId, track: 'classe', roles: ['remediation', 'guide', 'libre'], targets: [rec.type, rec.misconception].filter(Boolean), preferRepresentation: changeRep ? alternatives : null, maxDifficulty: 3 },
        evidence: rec,
      });
    }

    // 4. Révision espacée
    if (st.due && now >= st.due && (st.everMastered || st.pL >= 0.6)) {
      const overdue = (now - st.due) / DAY;
      push({
        kind: 'revision', skill: skillId, priority: Math.min(80, 70 + overdue),
        title: `Révision : ${skill.label}`,
        reasonStudent: `Tu as réussi cette notion il y a ${daysAgo(now, st.lastSuccessTs)} jour(s). La revoir maintenant, juste avant de l'oublier, la fixe durablement.`,
        reasonParent: `Révision espacée programmée (intervalle actuel : ${Math.round(st.stability)} j). Une réussite maintenant comptera comme « réussite différée ».`,
        query: { skill: skillId, track: 'classe', roles: ['libre', 'reinvestissement', 'guide', 'transfert'] },
        evidence: { stability: st.stability, due: st.due },
      });
    }

    // 5. Justesse sans justification
    if (st.unjustified >= 2 && st.unjustified > st.justified) {
      push({
        kind: 'expliquer', skill: skillId, priority: 65,
        title: `Expliquer sa méthode : ${skill.label}`,
        reasonStudent: 'Tu trouves souvent le bon résultat, mais sans expliquer comment. Savoir justifier est une compétence à part entière (et elle est évaluée).',
        reasonParent: `${st.unjustified} réponse(s) juste(s) sans justification sur cette notion.`,
        query: { skill: skillId, justify: true },
        evidence: { unjustified: st.unjustified, justified: st.justified },
      });
    }

    // 6. Transfert et 7. Défis facultatifs (seulement si la notion est acquise)
    if (st.pL >= 0.85 && st.successes >= 3) {
      const roleTransfer = (st.roles.transfert || { ok: 0 }).ok + (st.roles.reinvestissement || { ok: 0 }).ok;
      if (roleTransfer === 0) {
        push({
          kind: 'transfert', skill: skillId, priority: 55,
          title: `Problème de transfert : ${skill.label}`,
          reasonStudent: 'Tu maîtrises cette notion dans les exercices habituels. Ce problème vérifie que tu sais l’utiliser dans une situation nouvelle.',
          reasonParent: 'Notion maîtrisée en exercices directs, pas encore réinvestie dans une situation nouvelle.',
          query: { skill: skillId, track: 'classe', roles: ['transfert', 'reinvestissement', 'mission'] },
          evidence: {},
        });
      }
      const auto = autonomy(st);
      const speed = speedRatio(st);
      const easy = auto !== null && auto >= 0.75 && (speed === null || speed <= 1.2);
      if (easy) {
        const deepOk = st.tracks.approfondissement ? st.tracks.approfondissement.ok : 0;
        const track = deepOk >= 2 ? 'expert' : 'approfondissement';
        // les défis peuvent porter sur une notion avancée qui prolonge celle-ci (ex. équations à paramètre)
        const extending = [...index.skills.values()].filter((x) => (x.prereqs || []).includes(skillId) && x.track !== 'classe').map((x) => x.id);
        push({
          kind: 'defi', skill: skillId, priority: 48 + 6 * auto + (speed ? Math.max(0, 1 - speed) * 6 : 0),
          title: `${track === 'expert' ? 'Défi expert' : 'Approfondissement'} : ${skill.label}`,
          reasonStudent: `Tu réussis vite et sans aide (${Math.round(auto * 100)} % de réussites autonomes). ${track === 'expert' ? 'Un défi de niveau expert' : 'Un problème d’approfondissement'} t'attend : facultatif, il ne change pas ta progression du programme.`,
          reasonParent: `Réussite autonome (${Math.round(auto * 100)} %)${speed ? `, temps médian ${Math.round(speed * 100)} % du temps prévu` : ''}. Proposition facultative hors progression officielle (parcours ${track}).`,
          query: { skill: skillId, skillsAny: [skillId, ...extending], track },
          evidence: { autonomy: auto, speed },
        });
      }
    }
  }

  // 8. Suite du parcours : notions de la classe non maîtrisées dont les prérequis sont acquis
  const focus = ctx.focusSkills || [...index.skills.keys()].filter((id) => !ctx.level || index.skills.get(id).level === ctx.level);
  for (const id of focus) {
    const skill = index.skills.get(id);
    if (!skill || (skill.track && skill.track !== 'classe')) continue;
    const st = stateOf(id);
    if (st && st.pL >= 0.85) continue;
    // prérequis d'une classe antérieure sans données : supposé acquis (le diagnostic le corrigera) ;
    // prérequis de la même classe pas encore travaillé : il passe avant.
    const ready = (skill.prereqs || []).every((p) => {
      if (!index.skills.has(p)) return true;
      if (!stateOf(p)) return index.skills.get(p).level !== skill.level;
      return !prereqWeak(p);
    });
    if (!ready) continue;
    push({
      kind: 'suite', skill: id, priority: st && st.n ? 61 : 58,
      title: st && st.n ? `Continuer : ${skill.label}` : `Nouvelle notion : ${skill.label}`,
      reasonStudent: st && st.n ? 'Tu as commencé cette notion : encore quelques exercices pour la maîtriser.' : 'Prochaine notion du programme de ta classe : ses prérequis sont en place.',
      reasonParent: st && st.n ? `Notion en cours (maîtrise estimée ${Math.round(st.pL * 100)} %).` : 'Notion du programme non commencée, prérequis acquis ou non requis.',
      query: { skill: id, track: 'classe', roles: st && st.n ? ['guide', 'libre', 'reinvestissement'] : ['guide', 'libre'] },
      evidence: {},
    });
  }

  // une seule recommandation par compétence (la plus prioritaire), puis tri
  const best = new Map();
  for (const r of out) {
    // un défi facultatif peut coexister avec la recommandation principale sur la même notion
    const key = r.kind === 'defi' ? `${r.skill}:defi` : r.skill;
    if (!best.has(key) || best.get(key).priority < r.priority) best.set(key, r);
  }
  const limit = ctx.limit || 10;
  const sorted = [...best.values()].sort((a, b) => b.priority - a.priority);
  // au plus 3 « nouvelles notions » à la fois, pour laisser la place aux remédiations et aux défis
  const others = sorted.filter((r) => r.kind !== 'suite');
  // nouvelles notions : une par matière au plus (mathématiques et sciences d'abord), trois en tout
  const SUBJECT_ORDER = ['maths', 'pc', 'numerique', 'francais', 'hg'];
  const subjectOf = (id) => { const sk = index.skills.get(id) || {}; return sk.subject === 'transversal' ? id.split('.')[0] : sk.subject; };
  const rank = (r) => { const i = SUBJECT_ORDER.indexOf(subjectOf(r.skill)); return i === -1 ? 9 : i; };
  const seenSubjects = new Set();
  const suite = sorted.filter((r) => r.kind === 'suite')
    .sort((x, y) => y.priority - x.priority || rank(x) - rank(y))
    .filter((r) => { const sub = subjectOf(r.skill); if (seenSubjects.has(sub)) return false; seenSubjects.add(sub); return true; })
    .slice(0, 3);
  let result = [...others, ...suite].sort((a, b) => b.priority - a.priority).slice(0, limit);
  const bestDefi = others.find((r) => r.kind === 'defi');
  if (bestDefi && !result.includes(bestDefi)) result = [...result.slice(0, limit - 1), bestDefi];
  return result;
}
