/**
 * Frise chronologique : des cartes « événement » à placer une à une au bon endroit d'une frise qui s'allonge.
 * Une carte mal placée rejoint quand même sa vraie place (on apprend en jouant) mais coûte une vie quand on joue
 * seul ; à deux, chacun place une carte à son tour et marque un point par carte bien placée.
 * Moteur pur : pas de DOM, pas de stockage.
 */

export const FRISE_LIVES = 3;

const shuffle = (arr, rand) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const group = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** Année lisible : 1789, 52 av. J.-C., vers 300 000 av. J.-C. */
export function yearLabel(e) {
  const y = Number(e.year);
  const n = Math.abs(y) >= 10000 ? group(Math.abs(y)) : String(Math.abs(y));
  return `${e.circa ? 'vers ' : ''}${n}${y < 0 ? ' av. J.-C.' : ''}`;
}

/** Jusqu'à `count` événements, mélangés, aux intitulés et aux années tous différents. */
export function distinctEvents(events, count, rand = Math.random) {
  const out = []; const labels = new Set(); const years = new Set();
  for (const e of shuffle(events || [], rand)) {
    if (!e || !e.label || !Number.isFinite(Number(e.year)) || labels.has(e.label) || years.has(Number(e.year))) continue;
    labels.add(e.label); years.add(Number(e.year)); out.push({ ...e, year: Number(e.year) });
    if (out.length >= count) break;
  }
  return out;
}

/** Nouvelle partie : la première carte est posée, les autres forment la pioche. */
export function newFrise(events, { players = ['Joueur'], lives = FRISE_LIVES, rand = Math.random } = {}) {
  const deck = shuffle(events, rand).map((e, i) => ({ ...e, id: `c${i}` }));
  const first = deck.shift();
  return {
    line: first ? [{ ...first, start: true }] : [], deck, current: 0, turn: 0, lives, solo: players.length === 1,
    players: players.map((name) => ({ name, score: 0, misses: 0 })), last: null,
  };
}

export const currentCard = (f) => f.deck[f.current] || null;
export const cardsLeft = (f) => Math.max(0, f.deck.length - f.current);
export const isOver = (f) => f.current >= f.deck.length || (f.solo && f.lives <= 0);

/** Emplacements corrects (0 = tout au début, line.length = tout à la fin) pour une année. */
export function validSlots(line, year) {
  const out = [];
  for (let i = 0; i <= line.length; i++) if ((i === 0 || line[i - 1].year <= year) && (i === line.length || year <= line[i].year)) out.push(i);
  return out;
}

/** Place la carte en cours à l'emplacement `slot`. Renvoie { ok, at, slot, card } (ou null si la partie est finie). */
export function place(f, slot) {
  const card = currentCard(f);
  if (!card || isOver(f)) return null;
  const good = validSlots(f.line, card.year);
  const ok = good.includes(slot);
  const at = ok ? slot : good[0];
  f.line.splice(at, 0, { ...card, missed: !ok, by: f.turn });
  const p = f.players[f.turn];
  if (ok) p.score++; else { p.misses++; if (f.solo) f.lives--; }
  f.last = { ok, at, slot, card };
  f.current++;
  if (!f.solo) f.turn = (f.turn + 1) % f.players.length;
  return f.last;
}

/** Étoiles d'une partie en solo : 3 sans erreur, 2 avec une ou deux erreurs, 1 sinon. */
export function friseStars(f) {
  const m = f.players[0].misses;
  if (f.lives <= 0) return 1;
  return m === 0 ? 3 : m <= 2 ? 2 : 1;
}

export function friseWinners(f) {
  const best = Math.max(...f.players.map((p) => p.score));
  return f.players.filter((p) => p.score === best);
}
