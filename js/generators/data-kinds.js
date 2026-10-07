/**
 * Générateurs d'exercices pilotés par des données (fichiers app/content/generators/*.json).
 * Chaque appel produit une définition d'exercice ordinaire, corrigée par les correcteurs habituels.
 * Ajouter un générateur = écrire un fichier JSON, sans code.
 *
 * Genres (« kind ») : conjugaison, vocab, chronologie, categorize, match, cloze.
 */
import { rng } from '../core/template.js';

const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];
function sample(rand, arr, n) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, n);
}
const asList = (x) => (Array.isArray(x) ? x : String(x).split('|')).map((s) => String(s).trim()).filter(Boolean);
/** « du présent », « de l’imparfait » ; « le présent », « l’imparfait ». */
const du = (label) => (/^[aeiouyéèêh]/i.test(label) ? `de l’${label}` : `du ${label}`);
const le = (label) => (/^[aeiouyéèêh]/i.test(label) ? `l’${label}` : `le ${label}`);
const same = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

function base(gen, seed, extra) {
  return {
    id: `gen-${gen.id}-${seed}`,
    skill: gen.skill,
    track: gen.track || 'classe',
    role: 'libre',
    difficulty: gen.difficulty || 2,
    representation: gen.representation || 'verbale',
    expectedSeconds: gen.expectedSeconds || 45,
    generated: gen.id,
    ...extra,
  };
}

const KINDS = {
  /** data : { pronouns: [6], tenses: {id: libellé}, verbs: { infinitif: { forms: { tenseId: [6 formes] } } }, lang } */
  conjugaison(gen, rand, seed, opts) {
    const d = gen.data;
    const tenses = Object.keys(d.tenses).filter((t) => !opts.tense || opts.tense === 'tous' || t === opts.tense);
    const verbs = Object.keys(d.verbs).filter((v) => !opts.verb || v === opts.verb);
    let verb; let tense; let forms;
    for (let k = 0; k < 50; k++) {
      verb = pick(rand, verbs); tense = pick(rand, tenses);
      forms = d.verbs[verb].forms && d.verbs[verb].forms[tense];
      if (forms) break;
    }
    const person = Math.floor(rand() * 6);
    const answer = asList(forms[person]);
    const misconceptions = [];
    for (const [t, f] of Object.entries(d.verbs[verb].forms)) {
      if (t === tense) continue;
      for (const v of asList(f[person])) if (!answer.some((a) => same(a, v)) && !misconceptions.some((m) => same(m.answer, v))) {
        misconceptions.push({ answer: v, id: 'mc:temps-confondu', error: 'notion', feedback: `« ${v} » est la forme ${du(d.tenses[t])}, pas ${du(d.tenses[tense])}.` });
      }
    }
    forms.forEach((f, p) => {
      if (p === person) return;
      for (const v of asList(f)) if (!answer.some((a) => same(a, v)) && !misconceptions.some((m) => same(m.answer, v))) {
        misconceptions.push({ answer: v, id: 'mc:accord-sujet-verbe', error: 'notion', feedback: `« ${v} » correspond à une autre personne : le verbe s'accorde avec « ${d.pronouns[person]} ».` });
      }
    });
    const pron = d.pronouns[person];
    return base(gen, seed, {
      type: 'text',
      prompt: `Conjugue **${verb}** au **${d.tenses[tense]}** : ${pron} ___`,
      inputLabel: `${pron} …`,
      accept: answer, misconceptions,
      hints: [d.hints && d.hints[tense] ? d.hints[tense] : `Repère la terminaison ${du(d.tenses[tense])} à la personne de « ${pron} ».`],
      solution: `${pron} ${answer[0]}. Tout ${le(d.tenses[tense])} : ${forms.map((f, i) => `${d.pronouns[i]} ${asList(f)[0]}`).join(', ')}.`,
      audio: d.lang ? { text: `${pron.split(' / ')[0]} ${answer[0]}`, lang: d.lang, after: true } : undefined,
    });
  },

  /** data : { from, to, lang (synthèse vocale de la langue étrangère), pairs: [{ q, a, theme? }] } (q dans la langue « from ») */
  vocab(gen, rand, seed, opts) {
    const d = gen.data;
    const pool = d.pairs.filter((p) => !opts.theme || opts.theme === 'tous' || p.theme === opts.theme);
    const p = pick(rand, pool);
    const reverse = opts.direction === 'inverse' || (opts.direction === 'mixte' && rand() < 0.5);
    const question = reverse ? asList(p.a)[0] : asList(p.q)[0];
    // vers le français, « la cuisine » ou « cuisine » : l'article n'est pas exigé
    const withoutArticle = (w) => w.replace(/^(?:le|la|les|un|une|des|l['’])\s*/i, '');
    const accept = reverse ? [...new Set(asList(p.q).flatMap((w) => [w, withoutArticle(w)]))] : asList(p.a);
    return base(gen, seed, {
      type: 'text',
      prompt: reverse ? `Traduis en ${d.fromLabel || 'français'} : **${question}**` : `Traduis en ${d.toLabel || 'langue étrangère'} : **${question}**`,
      accept,
      hints: [p.hint || `Thème : ${p.theme || 'vocabulaire'}.`],
      solution: `${question} → ${accept[0]}`,
      audio: d.lang ? { text: reverse ? question : accept[0], lang: d.lang, after: !reverse } : undefined,
      representation: 'verbale',
    });
  },

  /** data : { events: [{ label, year }] } ; options.mode : « frise » (ranger 4 événements) ou « date » */
  chronologie(gen, rand, seed, opts) {
    const d = gen.data;
    const mode = opts.mode === 'date' ? 'date' : opts.mode === 'frise' ? 'frise' : rand() < 0.6 ? 'frise' : 'date';
    if (mode === 'date') {
      const e = pick(rand, d.events);
      return base(gen, seed, {
        type: 'numeric', prompt: `En quelle année : **${e.label}** ?`, answer: e.year, tolerance: 0,
        hints: [e.hint || 'Situe d’abord le siècle.'], solution: `${e.label} : ${e.year}.`, representation: 'concrete',
      });
    }
    let events = [];
    for (let k = 0; k < 30; k++) {
      events = sample(rand, d.events, 4);
      if (new Set(events.map((e) => e.year)).size === 4) break;
    }
    events.sort((a, b) => a.year - b.year);
    return base(gen, seed, {
      type: 'order', prompt: 'Range ces événements du plus ancien au plus récent.', orderLabel: 'du plus ancien au plus récent',
      items: events.map((e, i) => ({ id: `e${i}`, label: e.label })), errorType: 'notion',
      solution: events.map((e) => `${e.year} : ${e.label}`).join(' ; '), representation: 'visuelle',
    });
  },

  /** data : { categories: [{id,label}], items: [{label, category, feedback?}], count? } */
  categorize(gen, rand, seed) {
    const d = gen.data;
    let items = [];
    for (let k = 0; k < 30; k++) {
      items = sample(rand, d.items, Math.min(d.count || 6, d.items.length));
      if (new Set(items.map((i) => i.category)).size >= Math.min(2, d.categories.length)) break;
    }
    return base(gen, seed, {
      type: 'categorize', prompt: d.prompt || 'Range chaque élément dans la bonne catégorie.',
      categories: d.categories, items: items.map((it, i) => ({ id: `i${i}`, label: it.label, category: it.category })),
      solution: items.map((it) => `${it.label} → ${(d.categories.find((c) => c.id === it.category) || {}).label}${it.feedback ? ` (${it.feedback})` : ''}`).join(' ; '),
      representation: 'concrete',
    });
  },

  /** data : { pairs: [{left, right}], count?, leftTitle?, rightTitle? } */
  match(gen, rand, seed) {
    const d = gen.data;
    const pairs = sample(rand, d.pairs, Math.min(d.count || 5, d.pairs.length));
    const right = sample(rand, pairs.map((p, i) => ({ id: `r${i}`, label: p.right })), pairs.length);
    return base(gen, seed, {
      type: 'match', prompt: d.prompt || 'Associe chaque élément à celui qui lui correspond.',
      leftTitle: d.leftTitle, rightTitle: d.rightTitle,
      left: pairs.map((p, i) => ({ id: `l${i}`, label: p.left })), right,
      pairs: Object.fromEntries(pairs.map((p, i) => [`l${i}`, `r${i}`])),
      solution: pairs.map((p) => `${p.left} ↔ ${p.right}`).join(' ; '),
      representation: 'visuelle',
    });
  },

  /** data : { items: [{ sentence: "Il ___ parti.", accept: ["est"], misconceptions: [{answer, feedback, id?, error?}], hint?, rule? }] } */
  cloze(gen, rand, seed) {
    const d = gen.data;
    const it = pick(rand, d.items);
    return base(gen, seed, {
      type: 'text', prompt: `${d.prompt || 'Complète :'} ${it.sentence}`, accept: asList(it.accept),
      misconceptions: (it.misconceptions || []).map((m) => ({ id: m.id || 'mc:confusion', error: m.error || 'notion', ...m })),
      hints: [it.hint || d.hint || 'Essaie de remplacer le mot par un autre de la même classe.'].filter(Boolean),
      solution: `${it.sentence.replace('___', asList(it.accept)[0])}${it.rule ? ` — ${it.rule}` : ''}`,
      audio: d.lang && d.lang !== 'fr-FR' ? { text: it.sentence.replace('___', asList(it.accept)[0]), lang: d.lang, after: true } : undefined,
    });
  },
};

export const DATA_KINDS = Object.keys(KINDS);

/* ---------- niveaux ◆ approfondissement et ✦ expert ---------- */
export const DATA_TRACKS = ['classe', 'approfondissement', 'expert'];
const RANK = { classe: 0, approfondissement: 1, expert: 2 };
const ROLE = { classe: 'libre', approfondissement: 'transfert', expert: 'defi' };
/** Réponses courtes : nombre de formes à écrire d'un coup selon le niveau. */
const PARTS = { approfondissement: 3, expert: 5 };
const COMPOSITE_PROMPT = {
  conjugaison: 'Conjugue chaque verbe au temps demandé.',
  vocab: 'Traduis chaque mot ou expression.',
  cloze: 'Complète chaque phrase.',
  chronologie: 'Donne l’année de chaque événement.',
};

/** Plusieurs réponses courtes d'un même générateur, réunies en un exercice à plusieurs questions. */
function severalShort(gen, rand, seed, opts, n) {
  const parts = [];
  const seen = new Set();
  for (let k = 0; k < n * 6 && parts.length < n; k++) {
    const one = KINDS[gen.kind](gen, rand, seed, opts);
    if (seen.has(one.prompt)) continue;
    seen.add(one.prompt);
    parts.push(one);
  }
  const strip = ({ id, skill, track, role, difficulty, representation, expectedSeconds, generated, solution, audio, ...rest }) => rest;
  return base(gen, seed, {
    type: 'composite',
    prompt: COMPOSITE_PROMPT[gen.kind] || 'Réponds à chaque question.',
    parts: parts.map(strip),
    generatedAnswer: { parts: parts.map((p) => canonicalResponse(p)) },
    hints: [...new Set(parts.flatMap((p) => p.hints || []))].slice(0, 3),
    solution: parts.map((p, i) => `${i + 1}. ${p.solution}`).join('\n'),
    expectedSeconds: (gen.expectedSeconds || 45) * parts.length,
  });
}

/** Frise ✦ : des événements proches dans le temps (fenêtre de dates voisines), plus difficiles à ranger. */
function closeEvents(rand, events, n) {
  const sorted = events.slice().sort((a, b) => a.year - b.year);
  const width = Math.min(sorted.length, n + 2);
  const start = Math.floor(rand() * (sorted.length - width + 1));
  return sample(rand, sorted.slice(start, start + width), n);
}

function tiered(gen, rand, seed, opts, tier) {
  const d = gen.data;
  const short = ['conjugaison', 'vocab', 'cloze'].includes(gen.kind) || (gen.kind === 'chronologie' && opts.mode === 'date');
  // vocabulaire : le sens par défaut (du français vers la langue étrangère) est déjà le plus difficile
  if (short) return severalShort(gen, rand, seed, opts, PARTS[tier]);
  if (gen.kind === 'chronologie') {
    const n = Math.min(6, d.events.length);
    let events = [];
    for (let k = 0; k < 30; k++) {
      events = tier === 'expert' ? closeEvents(rand, d.events, n) : sample(rand, d.events, n);
      if (new Set(events.map((e) => e.year)).size === events.length) break;
    }
    events.sort((a, b) => a.year - b.year);
    return base(gen, seed, {
      type: 'order', prompt: `Range ces ${events.length} événements du plus ancien au plus récent.${tier === 'expert' ? ' Attention : ils sont proches dans le temps.' : ''}`, orderLabel: 'du plus ancien au plus récent',
      items: events.map((e, i) => ({ id: `e${i}`, label: e.label })), errorType: 'notion',
      solution: events.map((e) => `${e.year} : ${e.label}`).join(' ; '), representation: 'visuelle',
    });
  }
  // classements et associations : davantage d'éléments à traiter
  const bigger = (n) => (tier === 'expert' ? n + 6 : n + 3);
  if (gen.kind === 'categorize') return KINDS.categorize({ ...gen, data: { ...d, count: Math.min(d.items.length, bigger(d.count || 6)) } }, rand, seed, opts);
  if (gen.kind === 'match') return KINDS.match({ ...gen, data: { ...d, count: Math.min(d.pairs.length, bigger(d.count || 5) - 1) } }, rand, seed, opts);
  return KINDS[gen.kind](gen, rand, seed, opts);
}

/** Produit un exercice à partir d'un générateur de données ; seed et options rendent le tirage reproductible. */
export function generateFromData(gen, seed, opts = {}) {
  const kind = KINDS[gen.kind];
  if (!kind) throw new Error(`Genre de générateur inconnu : ${gen.kind}`);
  const rand = rng(seed);
  const tier = DATA_TRACKS.includes(opts.parcours) ? opts.parcours : 'classe';
  let def = tier === 'classe' ? kind(gen, rand, seed, opts) : tiered(gen, rand, seed, opts, tier);
  if (tier !== 'classe') {
    def = { ...def, id: `gen-${gen.id}-${tier}-${seed}`, track: tier, role: ROLE[tier], difficulty: Math.min(5, (gen.difficulty || 2) + RANK[tier]) };
  }
  return Object.fromEntries(Object.entries(def).filter(([, v]) => v !== undefined));
}

/** Réponse type d'un exercice généré (pour la validation automatique et le corrigé imprimé). */
export function canonicalResponse(def) {
  if (def.generatedAnswer) return def.generatedAnswer;
  switch (def.type) {
    case 'text': return { value: def.accept[0] };
    case 'numeric': return { value: `${String(def.answer).replace('.', ',')}${def.unit && !def.unitOptional ? ` ${def.unit}` : ''}` };
    case 'expression': return { value: def.answer };
    case 'order': return { order: def.items.map((i) => i.id) };
    case 'categorize': return { assign: Object.fromEntries(def.items.map((i) => [i.id, i.category])) };
    case 'match': return { pairs: { ...def.pairs } };
    default: return {};
  }
}
