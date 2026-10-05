/**
 * Élèves fictifs. Leur historique est SIMULÉ en rejouant des tentatives dans le vrai moteur (applyAttempt) :
 * les états, diagnostics et recommandations affichés sont donc exactement ceux que produirait l'application.
 * Ils servent à la démonstration (tableau de bord parent) et aux tests automatiques.
 */
import { applyAttempt, emptySkillState, DAY } from './mastery.js';

const ok = (extra = {}) => ({ verdict: 'correct', score: 1, ...extra });
const err = (errorType, extra = {}) => ({ verdict: 'incorrect', score: 0, errorType, ...extra });

/** Chaque événement : [jours avant « maintenant », compétence, résultat, options] */
export const DEMO_PROFILES = [
  {
    profile: { id: 'demo-comete', pseudo: 'Comète', symbol: '☄', color: '#d6453d', level: '5e', demo: true },
    story: "À l'aise en calcul, mais la soustraction d'un nombre négatif lui a longtemps posé problème. Surmontée il y a trois semaines, la difficulté vient de réapparaître.",
    expect: { firstKind: 'resurgence', skill: 'm5.relatifs.addition' },
    events: [
      [24, 'm5.relatifs.reperage', ok(), { type: 'numberline', representation: 'visuelle' }],
      [24, 'm5.relatifs.reperage', ok(), { type: 'numberline', representation: 'visuelle' }],
      [23, 'm5.relatifs.addition', err('notion', { misconception: 'mc:moins-negatif' }), { type: 'numeric' }],
      [23, 'm5.relatifs.addition', err('notion', { misconception: 'mc:moins-negatif' }), { type: 'numeric' }],
      [22, 'm5.relatifs.addition', err('notion', { misconception: 'mc:moins-negatif' }), { type: 'steps' }],
      [22, 'm5.relatifs.addition', ok({ hintsUsed: 2 }), { type: 'numberline', representation: 'visuelle', role: 'remediation' }],
      [21, 'm5.relatifs.addition', ok(), { type: 'numeric', role: 'remediation' }],
      [20, 'm5.relatifs.addition', ok(), { type: 'steps' }],
      [18, 'm5.relatifs.addition', ok(), { type: 'steps' }],
      [15, 'm5.relatifs.addition', ok(), { type: 'numeric' }],
      [12, 'm5.relatifs.addition', ok(), { type: 'steps' }],
      [12, 'm5.fractions.egalite', ok(), { type: 'numeric' }],
      [11, 'm5.fractions.egalite', ok(), { type: 'expression' }],
      [10, 'm5.fractions.addition', ok({ tries: 2 }), { type: 'expression' }],
      [9, 'm5.fractions.addition', ok(), { type: 'expression' }],
      [1, 'm5.relatifs.addition', err('notion', { misconception: 'mc:moins-negatif' }), { type: 'steps' }],
    ],
  },
  {
    profile: { id: 'demo-orbite', pseudo: 'Orbite', symbol: '◎', color: '#2f5bd3', level: '4e', demo: true },
    story: "Très à l'aise en mathématiques : réussit vite, du premier coup et sans indice. Le moteur lui ouvre les parcours d'approfondissement puis expert, sans toucher à sa progression du programme.",
    expect: { kinds: ['defi', 'transfert'], skill: 'm4.equations.resoudre' },
    events: [
      ...[9, 9, 8, 8, 6, 5].map((d) => [d, 'm4.equations.resoudre', ok(), { type: 'steps', timeRatio: 0.45 }]),
      [5, 'm4.equations.resoudre', ok(), { type: 'steps', track: 'approfondissement', role: 'defi', timeRatio: 0.6 }],
      [4, 'm4.equations.resoudre', ok(), { type: 'equation', track: 'approfondissement', role: 'defi', timeRatio: 0.7 }],
      ...[7, 7, 6, 4, 3].map((d) => [d, 'm4.pythagore.calcul', ok(), { type: 'numeric', timeRatio: 0.5 }]),
      [3, 'm4.relatifs.produit', ok(), { type: 'numeric', timeRatio: 0.4 }],
      [3, 'm4.relatifs.produit', ok(), { type: 'numeric', timeRatio: 0.4 }],
    ],
  },
  {
    profile: { id: 'demo-nova', pseudo: 'Nova', symbol: '✳', color: '#7a4cc2', level: '3e', demo: true },
    story: "En 3e, Nova bloque sur la double distributivité. Ses erreurs montrent un oubli systématique : le deuxième terme de la parenthèse n'est pas multiplié. La difficulté vient en réalité de la distributivité simple (5e).",
    expect: { firstKind: 'prerequis', skill: 'm5.litteral.distributivite' },
    events: [
      [6, 'm4.litteral.double-distributivite', err('notion', { misconception: 'mc:distrib-partielle', prerequisite: 'm5.litteral.distributivite' }), { type: 'expression' }],
      [5, 'm4.litteral.double-distributivite', err('notion', { misconception: 'mc:distrib-partielle', prerequisite: 'm5.litteral.distributivite' }), { type: 'steps' }],
      [5, 'm4.litteral.double-distributivite', ok({ hintsUsed: 3, tries: 3 }), { type: 'expression' }],
      [2, 'm4.litteral.double-distributivite', err('notion', { misconception: 'mc:distrib-partielle', prerequisite: 'm5.litteral.distributivite' }), { type: 'expression' }],
      [2, 'm4.equations.resoudre', ok(), { type: 'steps' }],
      [1, 'm4.equations.resoudre', err('notion', { misconception: 'mc:distrib-partielle', prerequisite: 'm5.litteral.distributivite' }), { type: 'steps' }],
    ],
  },
  {
    profile: { id: 'demo-quasar', pseudo: 'Quasar', symbol: '✦', color: '#2a9d5c', level: '5e', demo: true },
    story: "Trouve presque toujours le bon résultat… sans jamais expliquer comment. Le moteur distingue « réponse juste » et « réponse justifiée ».",
    expect: { kinds: ['expliquer'], skill: 'm5.litteral.expression' },
    events: [
      [8, 'm5.litteral.expression', { verdict: 'partiel', score: 0.7, errorType: 'sans-justification' }, { type: 'numeric' }],
      [7, 'm5.litteral.expression', { verdict: 'partiel', score: 0.7, errorType: 'sans-justification' }, { type: 'expression' }],
      [5, 'm5.litteral.expression', ok(), { type: 'expression' }],
      [3, 'm5.litteral.expression', { verdict: 'partiel', score: 0.7, errorType: 'sans-justification' }, { type: 'steps' }],
      [3, 'm5.triangle.angles', ok(), { type: 'numeric' }],
      [2, 'm5.triangle.angles', { verdict: 'partiel', score: 0.7, errorType: 'sans-justification' }, { type: 'numeric' }],
    ],
  },
  {
    profile: { id: 'demo-pulsar', pseudo: 'Pulsar', symbol: '✺', color: '#e07a1f', level: '4e', demo: true },
    story: "A maîtrisé l'addition de fractions il y a un mois : la révision espacée arrive à échéance. Sur les équations, ses erreurs sont des erreurs de calcul, pas de méthode : la remédiation est ciblée en conséquence.",
    expect: { kinds: ['revision', 'remediation'] },
    events: [
      [40, 'm5.fractions.addition', ok({ tries: 2 }), { type: 'expression' }],
      [40, 'm5.fractions.addition', ok(), { type: 'expression' }],
      [39, 'm5.fractions.addition', ok(), { type: 'expression' }],
      [36, 'm5.fractions.addition', ok(), { type: 'expression' }],
      [30, 'm5.fractions.addition', ok(), { type: 'steps' }],
      [4, 'm4.equations.resoudre', ok(), { type: 'steps' }],
      [3, 'm4.equations.resoudre', err('calcul'), { type: 'steps' }],
      [2, 'm4.equations.resoudre', ok(), { type: 'steps' }],
      [1, 'm4.equations.resoudre', err('calcul'), { type: 'steps' }],
      [1, 'm4.equations.resoudre', err('signe'), { type: 'steps' }],
    ],
  },
];

/** Rejoue l'histoire d'un élève fictif ; renvoie {profile, states, attempts}. */
export function simulateProfile(demo, now) {
  const skills = {};
  const attempts = [];
  const sorted = demo.events
    .map((e, i) => ({ e, i }))
    .sort((a, b) => b.e[0] - a.e[0] || a.i - b.i);
  for (const { e: [days, skill, result, opts], i } of sorted) {
    const ts = now - days * DAY + i * 60000;
    const attempt = {
      ts, skill, exerciseId: null, tries: 1, hintsUsed: 0, solutionShown: false, track: 'classe', role: 'libre',
      expectedSeconds: 120, durationMs: (opts.timeRatio || 1) * 120000, representation: 'symbolique', ...result, ...opts,
    };
    const before = skills[skill] || emptySkillState(skill);
    const { state, flags, credit } = applyAttempt(before, attempt);
    skills[skill] = state;
    attempts.push({ ...attempt, profileId: demo.profile.id, credit, delayed: flags.delayed, resurgence: flags.resurgence });
  }
  return {
    profile: { ...demo.profile, createdAt: now - 45 * DAY, story: demo.story },
    states: { profileId: demo.profile.id, skills, lessons: {} },
    attempts,
  };
}
