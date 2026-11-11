/**
 * « Vrai ou faux ? » : une question de la classe et une réponse proposée (ou deux éléments qui vont peut-être
 * ensemble) ; il faut dire si c'est vrai ou faux. Les cartes viennent des banques de questions (QCM des générateurs de
 * connaissances) et des associations (mots, œuvres, dates, traductions…). Une fois sur deux environ, la réponse
 * proposée est la bonne. Après chaque carte, la bonne réponse et son explication s'affichent.
 * Moteur pur : pas de DOM, pas de stockage.
 */

export const VF_ROUNDS = 12;

// questions qui n'ont plus de sens hors de leur exercice, ou qui embrouillent (« laquelle est fausse ? » → vrai ou faux ?)
const UNFIT = /\b(fausses?|faux|intrus|incorrecte?s?|erronée?s?)\b|ci-dessous|ci-contre|ce texte|le texte|l’image|la figure|ce graphique|le tableau|le schéma|cet extrait|l’extrait/i;
const tidy = (s) => String(s || '').replace(/\s+/g, ' ').trim();

/**
 * Une carte candidate tirée d'un exercice à choix (une seule bonne réponse), ou null s'il ne convient pas.
 * @param {object} def exercice produit par un générateur
 * @param {{ id?: string, label?: string, subject?: string }} meta générateur
 */
export function qcmCandidate(def, meta = {}) {
  if (!def || def.type !== 'qcm' || !Array.isArray(def.choices) || def.choices.length < 2) return null;
  const goods = def.choices.filter((c) => c.correct);
  if (goods.length !== 1 || def.figure || def.svg || def.audio || def.image || def.media) return null;
  const question = tidy(def.prompt);
  if (!question || question.length > 170 || UNFIT.test(question)) return null;
  const good = tidy(goods[0].text);
  const bads = [...new Set(def.choices.filter((c) => !c.correct).map((c) => tidy(c.text)))].filter((b) => b && b.toLowerCase() !== good.toLowerCase());
  if (!good || !bads.length || [good, ...bads].some((t) => t.length > 90 || /toutes les réponses|aucune réponse/i.test(t))) return null;
  const why = tidy(String(goods[0].feedback || '').replace(/^(oui|bravo|exact|juste)\s*!\s*/i, ''));
  return { kind: 'qcm', key: `q|${question}`, theme: meta.label || '', subject: meta.subject || '', question, good, bads, why };
}

/**
 * Cartes candidates tirées d'associations { a, b } : « a » va-t-il avec « b » ? Les leurres sont les « b » des autres
 * paires (jamais un « b » qui irait aussi avec ce « a »).
 */
export function pairCandidates(pairs, meta = {}, { leftTitle = '', rightTitle = '' } = {}) {
  const clean = (pairs || []).map((p) => ({ a: tidy(p.a), b: tidy(p.b) })).filter((p) => p.a && p.b && p.a.length <= 90 && p.b.length <= 90);
  const goodsOf = new Map();
  for (const p of clean) goodsOf.set(p.a.toLowerCase(), new Set([...(goodsOf.get(p.a.toLowerCase()) || []), p.b.toLowerCase()]));
  const out = []; const seen = new Set();
  for (const p of clean) {
    const key = `p|${p.a.toLowerCase()}`;
    if (seen.has(key)) continue;
    const ok = goodsOf.get(p.a.toLowerCase());
    const bads = [...new Set(clean.map((x) => x.b).filter((b) => !ok.has(b.toLowerCase())))];
    if (!bads.length) continue;
    seen.add(key);
    out.push({ kind: 'pair', key, theme: meta.label || '', subject: meta.subject || '', leftTitle, rightTitle, question: p.a, good: p.b, bads, why: '' });
  }
  return out;
}

const shuffle = (arr, rand) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** Une carte jouable : la réponse proposée et si elle est vraie. */
export function makeCard(cand, truth, rand = Math.random) {
  const proposal = truth ? cand.good : cand.bads[Math.floor(rand() * cand.bads.length)];
  return { ...cand, proposal, truth: Boolean(truth) };
}

/**
 * Un paquet de cartes : questions toutes différentes, en alternant les thèmes autant que possible, autant de « vrai »
 * que de « faux » (à une carte près).
 */
export function newDeck(cands, count = VF_ROUNDS, rand = Math.random) {
  const byTheme = new Map();
  for (const c of shuffle(cands, rand)) { const t = c.theme || '?'; if (!byTheme.has(t)) byTheme.set(t, []); byTheme.get(t).push(c); }
  const picked = []; const seen = new Set();
  const queues = shuffle([...byTheme.values()], rand);
  while (picked.length < count && queues.some((q) => q.length)) {
    for (const q of queues) {
      while (q.length && seen.has(q[0].key)) q.shift();
      if (!q.length || picked.length >= count) continue;
      const c = q.shift(); seen.add(c.key); picked.push(c);
    }
  }
  const truths = shuffle(picked.map((_, i) => i < Math.ceil(picked.length / 2)), rand);
  return shuffle(picked, rand).map((c, i) => makeCard(c, truths[i], rand));
}

/** La réponse « vrai » (true) ou « faux » (false) est-elle juste ? */
export const isRight = (card, saysTrue) => Boolean(saysTrue) === card.truth;

/** Ce qu'il faut retenir d'une carte. */
export function verdict(card) {
  const head = card.kind === 'pair'
    ? (card.truth ? `Vrai : « ${card.question} » va bien avec « ${card.good} ».` : `Faux : « ${card.question} » va avec « ${card.good} », pas avec « ${card.proposal} ».`)
    : (card.truth ? `Vrai : ${card.good}.` : `Faux : la bonne réponse est « ${card.good} ».`);
  return card.why ? `${head} ${card.why}` : head;
}

/** Étoiles d'une partie en solo : sans erreur 3, une ou deux erreurs 2, sinon 1. */
export const vfStars = (errors) => (errors === 0 ? 3 : errors <= 2 ? 2 : 1);
