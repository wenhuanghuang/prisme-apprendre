/**
 * « La boutique » : des clients, des prix, et un porte-monnaie de pièces et de billets en euros. Payer le prix exact
 * (du CP au CM2), puis, à partir du CE2, rendre la monnaie quand le client paie avec un billet. Payer avec le moins de
 * pièces et de billets possible rapporte un bonus « paiement malin ». Les montants sont en centimes (entiers) : aucun
 * calcul à virgule. Moteur pur : pas de DOM, pas de stockage.
 */

/** Pièces et billets, en centimes. */
export const DENOMS = [
  { v: 1, kind: 'piece', metal: 'cuivre' }, { v: 2, kind: 'piece', metal: 'cuivre' }, { v: 5, kind: 'piece', metal: 'cuivre' },
  { v: 10, kind: 'piece', metal: 'or' }, { v: 20, kind: 'piece', metal: 'or' }, { v: 50, kind: 'piece', metal: 'or' },
  { v: 100, kind: 'piece', metal: 'bimetal' }, { v: 200, kind: 'piece', metal: 'bimetal' },
  { v: 500, kind: 'billet' }, { v: 1000, kind: 'billet' }, { v: 2000, kind: 'billet' }, { v: 5000, kind: 'billet' },
];

const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];
const ri = (rand, a, b) => a + Math.floor(rand() * (b - a + 1));

/**
 * Réglages par classe : pièces disponibles, prix (en centimes, pas de `step`), part des clients à qui il faut rendre
 * la monnaie, et si le total du comptoir est affiché (aide pour les plus jeunes).
 */
export const BOUTIQUE_LEVELS = {
  cp: { denoms: [100, 200, 500, 1000], min: 200, max: 2000, step: 100, rendre: 0, showTotal: true },
  ce1: { denoms: [100, 200, 500, 1000, 2000, 5000], min: 500, max: 6000, step: 100, rendre: 0, showTotal: true },
  ce2: { denoms: [10, 20, 50, 100, 200, 500, 1000, 2000, 5000], min: 150, max: 3000, step: 50, rendre: 0.3, showTotal: false },
  cm1: { denoms: DENOMS.map((d) => d.v), min: 105, max: 4500, step: 5, rendre: 0.5, showTotal: false },
  cm2: { denoms: DENOMS.map((d) => d.v), min: 101, max: 8000, step: 1, rendre: 0.5, showTotal: false },
  '6e': { denoms: DENOMS.map((d) => d.v), min: 101, max: 9500, step: 1, rendre: 0.5, showTotal: false },
};

/** Articles : icône, nom, fourchette de prix plausible (en euros). */
const ITEMS = [
  ['🍎', 'un sachet de pommes', 2, 6], ['🥖', 'deux baguettes', 2, 3], ['🧃', 'un jus de fruits', 1, 4], ['🍫', 'une tablette de chocolat', 1, 4],
  ['✏️', 'une boîte de crayons', 2, 9], ['📒', 'un cahier', 1, 5], ['🎨', 'une boîte de peinture', 4, 15], ['🧸', 'un ours en peluche', 8, 30],
  ['⚽', 'un ballon', 6, 25], ['📚', 'un livre', 5, 22], ['🪁', 'un cerf-volant', 8, 28], ['🎲', 'un jeu de société', 12, 45],
  ['🧩', 'un puzzle', 6, 25], ['🎧', 'un casque audio', 15, 70], ['🛼', 'des rollers', 25, 90], ['🎸', 'un ukulélé', 20, 80],
  ['🌱', 'un pot de basilic', 2, 6], ['🧢', 'une casquette', 5, 18], ['🧦', 'des chaussettes', 2, 9], ['🖍️', 'des craies', 1, 5],
  ['🍦', 'une glace', 2, 5], ['🥐', 'trois croissants', 2, 5], ['🔦', 'une lampe de poche', 4, 16], ['🎒', 'un sac à dos', 12, 45],
];

/** Un montant en toutes lettres : « 3,50 € », « 12 € », « 45 c » (moins d'un euro). */
export function money(cents) {
  const c = Math.round(cents);
  if (c < 100) return `${c} c`;
  const e = Math.floor(c / 100); const r = c % 100;
  return r ? `${e},${String(r).padStart(2, '0')} €` : `${e} €`;
}
/** L'étiquette d'une pièce ou d'un billet : « 2 € », « 50 c », « 20 € ». */
export const denomLabel = (v) => (v >= 100 ? `${v / 100} €` : `${v} c`);

/** Le moins de pièces et de billets pour faire `amount` (l'algorithme glouton est optimal pour l'euro). */
export function fewest(amount, denoms) {
  const out = []; let rest = Math.round(amount);
  for (const d of [...denoms].sort((a, b) => b - a)) while (rest >= d) { out.push(d); rest -= d; }
  return rest === 0 ? out : null;
}

const cfg = (level) => BOUTIQUE_LEVELS[String(level || '').toLowerCase()] || BOUTIQUE_LEVELS.ce2;

/** Un client : ce qu'il achète, son prix, et s'il faut payer ou lui rendre la monnaie. */
export function newCustomer(level, rand = Math.random) {
  const c = cfg(level);
  const rendre = rand() < c.rendre;
  const items = ITEMS.filter(([, , lo, hi]) => lo * 100 <= c.max && hi * 100 >= c.min);
  const [icon, name, lo, hi] = pick(rand, items);
  const a = Math.max(c.min, lo * 100); const b = Math.min(c.max, hi * 100);
  let price = Math.round(ri(rand, Math.ceil(a / c.step), Math.floor(b / c.step)) * c.step);
  if (rendre) {
    const bills = [500, 1000, 2000, 5000, 10000].filter((x) => x > price && (x !== 10000 || price > 5000));
    const given = bills[0];
    if (rendre && given - price >= c.step) return { icon, name, price, mode: 'rendre', given, target: given - price };
  }
  if (!fewest(price, c.denoms)) price = Math.round(price / 100) * 100 || 100;
  return { icon, name, price, mode: 'payer', given: 0, target: price };
}

/** Une journée de boutique : des clients, sans deux fois le même article d'affilée. */
export function newDay(level, count = 8, rand = Math.random) {
  const out = [];
  for (let k = 0; out.length < count && k < count * 20; k++) {
    const c = newCustomer(level, rand);
    if (out.length && out[out.length - 1].name === c.name) continue;
    out.push(c);
  }
  return out;
}

/** Ce que l'on a posé sur le comptoir : la somme, l'écart, exact ou non, et « malin » (le moins de pièces possible). */
export function judge(customer, tray, level) {
  const sum = tray.reduce((s, v) => s + v, 0);
  const diff = sum - customer.target;
  const best = fewest(customer.target, cfg(level).denoms) || [];
  return { sum, diff, exact: diff === 0, smart: diff === 0 && tray.length <= best.length, best };
}

/** Ce qu'il faut dire après un essai. */
export function feedback(customer, verdict) {
  const what = customer.mode === 'rendre' ? 'rendre' : 'payer';
  if (verdict.exact) return verdict.smart ? 'Compte juste, et avec le moins de pièces possible : paiement malin !' : `Compte juste ! On pouvait aussi ${what} avec ${verdict.best.length} pièce${verdict.best.length > 1 ? 's' : ''} ou billet${verdict.best.length > 1 ? 's' : ''} seulement.`;
  if (verdict.diff > 0) return `C’est trop : tu as posé ${money(verdict.sum)}, il faut ${what} ${money(customer.target)}. Reprends ${money(verdict.diff)}.`;
  return `Il manque ${money(-verdict.diff)} : tu as posé ${money(verdict.sum)}, il faut ${what} ${money(customer.target)}.`;
}

/** Explication du rendu de monnaie : on complète du prix jusqu'au billet donné. */
export function changeHint(customer) {
  return `Le client donne ${money(customer.given)} pour ${money(customer.price)} : de ${money(customer.price)} à ${money(customer.given)}, il manque ${money(customer.target)}.`;
}

/** Étoiles d'une journée : sans erreur 3, une ou deux erreurs 2, sinon 1. */
export const boutiqueStars = (errors) => (errors === 0 ? 3 : errors <= 2 ? 2 : 1);
