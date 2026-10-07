/**
 * Générateurs de PROBLÈMES de mathématiques (1/2) : moyenne, tarifs, soldes, recettes, aires, Pythagore, ombres.
 * Une situation concrète, plusieurs questions qui s'enchaînent et, au niveau expert, une justification
 * à rédiger. Chaque générateur déclare ses `tracks` et `make(rand, options, parcours)` renvoie un `problem(...)`.
 * Voir docs/GENERATEURS.md.
 */
import { ri, pick, clean, fr, mc, numeric, text, expression, problem } from './gen-util.js';
import { PRENOMS, sum, nom, round, eur, quot, yesNo, choose, cap, byTier, ALL_TRACKS } from './problemes-outils.js';


/* ------------------------------------------------------------------------------------------
 * 1. Abonnement ou tickets ?
 * ---------------------------------------------------------------------------------------- */

const LIEUX_ABO = [
  { a: 'À la piscine municipale', unite: 'entrée', unites: 'entrées', de: 'd’entrées', la: 'l’entrée' },
  { a: 'Au cinéma du quartier', unite: 'séance', unites: 'séances', de: 'de séances', la: 'la séance' },
  { a: 'À la salle d’escalade', unite: 'séance', unites: 'séances', de: 'de séances', la: 'la séance' },
  { a: 'À la patinoire', unite: 'entrée', unites: 'entrées', de: 'd’entrées', la: 'l’entrée' },
];
const TARIF_TICKETS = ['les tickets', 'tickets', 'le ticket', 'ticket', 'les tickets à l’unité', 'à l’unité', 'le tarif à l’unité'];
const TARIF_CARTE = ['l’abonnement', 'l\'abonnement', 'abonnement', 'la carte', 'carte', 'la carte d’abonnement', 'carte d’abonnement'];
const TARIF_PASS = ['le pass', 'pass', 'le pass illimité', 'pass illimité', 'l’illimité', 'illimité', 'le forfait illimité'];

function aboClasse(rand) {
  const who = nom(rand); const L = pick(rand, LIEUX_ABO);
  let t; let r; let F; let n; let pT; let pA;
  do {
    t = ri(rand, 10, 18) / 2; r = ri(rand, 4, 2 * t - 4) / 2; F = 5 * ri(rand, 3, 12); n = ri(rand, 6, 20);
    pT = clean(t * n); pA = clean(F + r * n);
  } while (Math.abs(pT - pA) < 2);
  const carte = pA < pT;
  return problem([
    numeric(pT, { prompt: `Avec les tickets, combien coûtent ${n} ${L.unites} ? (en €)` }),
    numeric(pA, { prompt: `Avec l’abonnement, combien coûtent ${n} ${L.unites}, carte comprise ? (en €)`, misconceptions: [
      mc(clean(r * n), 'mc:oubli-abonnement', 'raisonnement', `Il faut aussi payer la carte d’abonnement (${eur(F)}), une seule fois dans l’année.`),
      mc(clean((F + r) * n), 'mc:carte-a-chaque-entree', 'raisonnement', `La carte (${eur(F)}) se paie une seule fois, pas à chaque ${L.unite}.`),
    ] }),
    choose(`Pour ${n} ${L.unites}, quel est le tarif le plus avantageux : les tickets ou l’abonnement ?`, carte ? TARIF_CARTE : TARIF_TICKETS, [
      { accept: carte ? TARIF_TICKETS : TARIF_CARTE, id: 'mc:mauvaise-comparaison', feedback: `Compare les deux prix : ${eur(pT)} avec les tickets, ${eur(pA)} avec l’abonnement. Le plus avantageux est le moins cher.` },
    ]),
  ], {
    prompt: `${L.a}, une ${L.unite} coûte ${eur(t)} avec un ticket. Avec l’abonnement, on paie une carte de ${eur(F)} pour l’année, puis ${eur(r)} par ${L.unite}. ${who} prévoit d’y aller ${n} fois cette année.`,
    hints: [`Avec les tickets : prix d’une ${L.unite} × nombre ${L.de}.`, `Avec l’abonnement : la carte se paie une seule fois, puis chaque ${L.unite} au prix réduit : ${eur(F)} + ${n} × ${eur(r)}.`, 'Le tarif le plus avantageux est celui qui coûte le moins cher.'],
    solution: `Tickets : ${n} × ${eur(t)} = ${eur(pT)}. Abonnement : ${eur(F)} + ${n} × ${eur(r)} = ${eur(F)} + ${eur(r * n)} = ${eur(pA)}. Pour ${n} ${L.unites}, ${carte ? 'l’abonnement est' : 'les tickets sont'} le tarif le plus avantageux (${eur(Math.abs(pT - pA))} d’écart).`,
    expectedSeconds: 240,
  });
}

function aboPlus(rand) {
  const L = pick(rand, LIEUX_ABO); const U = L.unites;
  let t; let r; let k; let F;
  do { t = ri(rand, 5, 10); r = ri(rand, 2, t - 2); k = ri(rand, 4, 15); F = (t - r) * k; } while (F < 12 || F > 90);
  const d = t - r;
  return problem([
    expression(`${F} + ${r}*x`, { prompt: `On note x le nombre ${L.de} dans l’année. Écris le prix payé avec l’abonnement (en €) en fonction de x.`, misconceptions: [
      mc(`(${F} + ${r})*x`, 'mc:carte-a-chaque-entree', 'raisonnement', `La carte (${F} €) se paie une seule fois : seul le prix réduit (${r} €) est multiplié par x.`),
      mc(`${r}*x`, 'mc:oubli-abonnement', 'raisonnement', `Il faut ajouter le prix de la carte (${F} €), payé une seule fois.`),
      mc(`${F}*x + ${r}`, 'mc:roles-inverses', 'raisonnement', `Le prix de la carte (${F} €) est fixe ; c’est le prix par ${L.unite} (${r} €) qui est multiplié par x.`),
    ] }),
    numeric(k, { prompt: `Pour combien ${L.de} les deux tarifs coûtent-ils exactement le même prix ?`, misconceptions: [
      mc(clean(F / t), 'mc:oubli-prix-reduit', 'raisonnement', `Avec l’abonnement, on paie aussi chaque ${L.unite} (${r} €) : à chaque ${L.unite}, on n’économise que ${t} − ${r} = ${d} €.`),
    ] }),
    numeric(k + 1, { prompt: `À partir de combien ${L.de} l’abonnement est-il strictement moins cher que les tickets ?`, misconceptions: [
      mc(k, 'mc:egalite-pas-strict', 'raisonnement', `Pour ${k} ${U}, les deux tarifs coûtent la même chose : l’abonnement n’est pas encore moins cher.`),
    ] }),
  ], {
    prompt: `${L.a}, une ${L.unite} coûte ${t} € avec un ticket. Avec l’abonnement, on paie une carte de ${F} € pour l’année, puis ${r} € par ${L.unite}.`,
    hints: [`Avec l’abonnement : ${F} € une seule fois, plus ${r} € multiplié par le nombre ${L.de}.`, `À chaque ${L.unite}, l’abonnement fait économiser ${t} − ${r} = ${d} € par rapport au ticket.`, `Les deux tarifs sont égaux quand ${t}x = ${F} + ${r}x : les économies remboursent alors la carte.`],
    solution: `Abonnement : ${F} + ${r}x ; tickets : ${t}x. Égalité : ${t}x = ${F} + ${r}x, donc ${d}x = ${F} et x = ${F} ÷ ${d} = ${k}. Pour ${k} ${U}, chaque tarif coûte ${t * k} €. Pour ${k + 1} ${U} : ${t * (k + 1)} € avec les tickets contre ${F + r * (k + 1)} € avec l’abonnement, qui devient moins cher à partir de ${k + 1} ${U}.`,
    expectedSeconds: 300,
  });
}

function aboExpert(rand) {
  const who = nom(rand); const L = pick(rand, LIEUX_ABO); const U = L.unites;
  let t; let r; let F; let G; let n1; let n2; let N; let prices;
  for (;;) {
    t = ri(rand, 6, 10); r = ri(rand, 2, t - 3); F = 5 * ri(rand, 4, 12); G = 5 * ri(rand, 14, 40);
    n1 = Math.floor(F / (t - r)) + 1; n2 = Math.floor((G - F) / r) + 1;
    if (n1 < 4 || n2 < n1 + 3 || n2 > 40) continue;
    const zone = ri(rand, 0, 2);
    N = zone === 0 ? ri(rand, 2, n1 - 1) : zone === 1 ? ri(rand, n1, n2 - 1) : ri(rand, n2, n2 + 8);
    prices = { tickets: t * N, carte: F + r * N, pass: G };
    const sorted = Object.values(prices).sort((a, b) => a - b);
    if (sorted[1] - sorted[0] >= 2) break;
  }
  const best = Object.keys(prices).reduce((a, b) => (prices[b] < prices[a] ? b : a));
  const NAMES = { tickets: TARIF_TICKETS, carte: ['la carte', ...TARIF_CARTE], pass: TARIF_PASS };
  const LABEL = { tickets: 'les tickets', carte: 'la carte', pass: 'le pass illimité' };
  const why = `Pour ${N} ${U} : tickets ${eur(prices.tickets)}, carte ${eur(prices.carte)}, pass ${eur(prices.pass)}. On choisit le prix le plus bas.`;
  const seuil = (n) => `Pour ${n} ${U}, ce tarif n’est pas encore strictement moins cher : calcule les deux prix pour vérifier, puis prends l’entier suivant.`;
  return problem([
    numeric(n1, { prompt: `À partir de combien ${L.de} la carte est-elle strictement moins chère que les tickets ?`, misconceptions: [mc(n1 - 1, 'mc:seuil-arrondi', 'raisonnement', seuil(n1 - 1))] }),
    numeric(n2, { prompt: `À partir de combien ${L.de} le pass illimité est-il strictement moins cher que la carte ?`, misconceptions: [
      mc(n2 - 1, 'mc:seuil-arrondi', 'raisonnement', seuil(n2 - 1)),
      mc(Math.floor(G / t) + 1, 'mc:mauvaise-comparaison', 'lecture', 'Tu as comparé le pass aux tickets : la question compare le pass à la carte.'),
    ] }),
    choose(`${who} prévoit ${N} ${U} cette année. Quel tarif choisir : les tickets, la carte ou le pass illimité ?`, NAMES[best],
      Object.keys(NAMES).filter((k) => k !== best).map((k) => ({ accept: NAMES[k], id: 'mc:mauvais-tarif', feedback: why }))),
  ], {
    prompt: `${L.a}, trois tarifs sont proposés. Tickets : ${t} € ${L.la}. Carte : ${F} € pour l’année, puis ${r} € ${L.la}. Pass illimité : ${G} € pour l’année, sans rien payer ensuite.`,
    hints: [`Écris le prix de chaque tarif pour n ${U} : ${t}n, ${F} + ${r}n et ${G}.`, `Carte moins chère que les tickets : ${F} + ${r}n < ${t}n. Résous cette inéquation, ou procède par essais.`, 'n est un nombre entier : prends le premier entier qui vérifie l’inégalité. Compare ensuite les trois prix pour le nombre prévu.'],
    solution: `Carte < tickets : ${F} + ${r}n < ${t}n, soit ${t - r}n > ${F}, n > ${quot(F, t - r)} : à partir de ${n1} ${U}. Pass < carte : ${G} < ${F} + ${r}n, soit ${r}n > ${G - F}, n > ${quot(G - F, r)} : à partir de ${n2} ${U}. ${why} Il faut choisir ${LABEL[best]}.`,
    justify: { prompt: 'Explique comment tu as trouvé les deux seuils (inéquation ou essais), puis justifie ton choix.', minWords: 15, keywords: [['inéquation', 'essai', 'moins cher', '<'], 'carte', 'pass'], example: `La carte est moins chère que les tickets quand ${F} + ${r}n < ${t}n, soit ${t - r}n > ${F}, donc à partir de ${n1} ${U}. Le pass est moins cher que la carte quand ${G} < ${F} + ${r}n, donc à partir de ${n2} ${U}. Pour ${N} ${U}, je choisis ${LABEL[best]} car son prix est le plus bas.` },
    expectedSeconds: 480,
  });
}

/* ------------------------------------------------------------------------------------------
 * 2. Soldes : remises successives ou remise unique ?
 * ---------------------------------------------------------------------------------------- */

const ARTICLES = ['un sweat', 'une paire de baskets', 'un sac à dos', 'une trottinette', 'un casque audio', 'une veste'];
const OBJETS = [{ un: 'un vélo', du: 'du vélo' }, { un: 'un ordinateur portable', du: 'de l’ordinateur' }, { un: 'un téléphone', du: 'du téléphone' }, { un: 'une console de jeux', du: 'de la console' }];
const MAG_A = ['A', 'le magasin A', 'magasin A', 'chez A', 'le A'];
const MAG_B = ['B', 'le magasin B', 'magasin B', 'chez B', 'le B'];
const coef = (p) => fr(clean(1 - p / 100));

function soldesClasse(rand) {
  const who = nom(rand); const art = pick(rand, ARTICLES);
  let P; let p; let rem; let D;
  for (;;) {
    P = 10 * ri(rand, 3, 18); p = pick(rand, [10, 20, 25, 30, 40, 50]); rem = clean((P * p) / 100);
    if (!Number.isInteger(rem)) continue;
    D = rem + pick(rand, [-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]);
    if (D >= 3 && D < P) break;
  }
  const prixA = P - rem; const prixB = P - D; const aMoins = prixA < prixB;
  return problem([
    numeric(rem, { prompt: 'Chez A, quel est le montant de la remise ? (en €)', misconceptions: [
      mc(p, 'mc:pourcentage-egal-euros', 'notion', `${p} % de ${eur(P)}, ce n’est pas ${p} € : c’est ${p} ÷ 100 × ${P}.`),
      mc(clean(P / p), 'mc:division-par-p', 'notion', `Prendre ${p} %, c’est multiplier par ${p} puis diviser par 100 (et non diviser par ${p}).`),
    ] }),
    numeric(prixA, { prompt: 'Quel est le prix à payer chez A ? (en €)', misconceptions: [
      mc(rem, 'mc:remise-seule', 'raisonnement', 'Ce nombre est le montant de la remise ; le prix à payer, c’est le prix de départ moins la remise.'),
      mc(P + rem, 'mc:augmentation-au-lieu-reduction', 'raisonnement', 'Une remise fait baisser le prix : on soustrait, on n’ajoute pas.'),
    ] }),
    choose('Quel magasin propose le prix le plus bas : A ou B ?', aMoins ? MAG_A : MAG_B, [
      { accept: aMoins ? MAG_B : MAG_A, id: 'mc:mauvaise-comparaison', feedback: `Compare les prix à payer : ${eur(prixA)} chez A et ${P} − ${D} = ${eur(prixB)} chez B.` },
    ]),
  ], {
    prompt: `${who} veut acheter ${art} au prix de ${eur(P)}. Le magasin A fait une remise de ${p} % ; le magasin B fait une réduction de ${eur(D)} sur le même prix de départ.`,
    hints: [`${p} %, c’est ${p} pour 100 : la remise vaut ${p} ÷ 100 × ${P}.`, 'Prix à payer = prix de départ − remise.', `Calcule aussi le prix chez B (${P} − ${D}), puis compare.`],
    solution: `Remise chez A : ${p} ÷ 100 × ${P} = ${eur(rem)}. Prix chez A : ${P} − ${rem} = ${eur(prixA)}. Prix chez B : ${P} − ${D} = ${eur(prixB)}. Le prix le plus bas est chez ${aMoins ? 'A' : 'B'}.`,
    expectedSeconds: 240,
  });
}

function soldesPlus(rand) {
  const art = pick(rand, ARTICLES);
  let P; let p1; let p2; let Q1; let Q2;
  for (;;) {
    P = 10 * ri(rand, 4, 30); p1 = pick(rand, [10, 20, 30, 40, 50]); p2 = pick(rand, [10, 20, 25, 30, 50]);
    Q1 = clean((P * (100 - p1)) / 100); Q2 = clean((Q1 * (100 - p2)) / 100);
    if (Number.isInteger(clean(Q2 * 100))) break;
  }
  const tot = clean(p1 + p2 - (p1 * p2) / 100);
  return problem([
    numeric(Q1, { prompt: 'Quel est le prix après la première remise ? (en €)', tolerance: 0.01, misconceptions: [
      mc(clean((P * p1) / 100), 'mc:remise-seule', 'raisonnement', 'Ce nombre est le montant de la remise ; le prix soldé, c’est le prix de départ moins la remise.'),
    ] }),
    numeric(Q2, { prompt: 'Quel est le prix final, après les deux remises ? (en €)', tolerance: 0.01, misconceptions: [
      mc(clean((P * (100 - p1 - p2)) / 100), 'mc:pourcentages-additionnes', 'raisonnement', `La remise de ${p2} % s’applique au prix déjà soldé (${eur(Q1)}), pas au prix de départ : on ne peut pas additionner les pourcentages.`),
    ] }),
    numeric(tot, { prompt: 'Quel pourcentage du prix de départ représente la remise totale ? (en %)', tolerance: 0.01, misconceptions: [
      mc(p1 + p2, 'mc:pourcentages-additionnes', 'raisonnement', `Deux remises successives de ${p1} % et ${p2} % ne font pas ${p1 + p2} % : la seconde porte sur un prix plus petit.`),
      mc(clean(P - Q2), 'mc:euros-au-lieu-pourcentage', 'methode', 'Ce nombre est la remise en euros ; on demande un pourcentage du prix de départ.'),
    ] }),
  ], {
    prompt: `Pendant les soldes, ${art} coûtant ${eur(P)} bénéficie d’une remise de ${p1} %. Le dernier jour, le magasin ajoute une remise de ${p2} % sur le prix déjà soldé.`,
    hints: [`Baisser de ${p1} %, c’est multiplier par 1 − ${fr(p1 / 100)} = ${coef(p1)}.`, `La seconde remise s’applique au prix soldé : on multiplie encore par ${coef(p2)}.`, 'Remise totale en % : (prix de départ − prix final) ÷ prix de départ × 100.'],
    solution: `Après la première remise : ${P} × ${coef(p1)} = ${eur(Q1)}. Après la seconde : ${fr(Q1)} × ${coef(p2)} = ${eur(Q2)}. Remise totale : ${P} − ${fr(Q2)} = ${eur(P - Q2)}, soit ${fr(clean(P - Q2))} ÷ ${P} × 100 = ${fr(tot)} % (et non ${p1 + p2} %). On peut aussi multiplier les coefficients : ${coef(p1)} × ${coef(p2)} = ${fr(clean((1 - p1 / 100) * (1 - p2 / 100)))}.`,
    expectedSeconds: 330,
  });
}

function soldesExpert(rand) {
  const who = nom(rand); const obj = pick(rand, OBJETS);
  let P; let p1; let p2; let p3; let c;
  for (;;) {
    P = 10 * ri(rand, 15, 90); p1 = pick(rand, [10, 20, 30, 40]); p2 = pick(rand, [10, 20, 30, 40]);
    c = clean(p1 + p2 - (p1 * p2) / 100);
    // 60 % des cas : remise unique plus faible que p1 + p2 mais plus forte que la remise réelle de A (piège)
    const trick = rand() < 0.6;
    const lo = trick ? c + 1 : Math.max(5, c - 8);
    const hi = trick ? p1 + p2 - 1 : c - 1;
    if (lo > hi) continue;
    p3 = ri(rand, lo, hi);
    break;
  }
  const k = clean(((100 - p1) * (100 - p2)) / 10000);
  const Q = clean(P * k); const B = clean((P * (100 - p3)) / 100); const aMoins = Q < B;
  return problem([
    numeric(c, { prompt: 'Chez A, quel pourcentage du prix de départ représente la remise totale ? (en %)', tolerance: 0.01, misconceptions: [
      mc(p1 + p2, 'mc:pourcentages-additionnes', 'raisonnement', `La remise de ${p2} % porte sur un prix déjà soldé : au total, cela fait moins de ${p1 + p2} %. Multiplie les coefficients ${coef(p1)} et ${coef(p2)}.`),
    ] }),
    numeric(P, { prompt: `Quel était le prix ${obj.du} avant les remises ? (en €)`, tolerance: 0.01, misconceptions: [
      mc(clean(Q * (1 + (p1 + p2) / 100)), 'mc:remise-inverse', 'raisonnement', `Ajouter ${p1 + p2} % au prix soldé ne redonne pas le prix de départ : les remises étaient calculées sur des prix plus grands. Divise le prix final par ${fr(k)}.`),
      mc(clean(Q * (1 + c / 100)), 'mc:remise-inverse', 'raisonnement', `Ajouter ${fr(c)} % au prix soldé ne redonne pas le prix de départ : divise le prix final par ${fr(k)}.`),
      mc(clean(Q / (1 - (p1 + p2) / 100)), 'mc:pourcentages-additionnes', 'raisonnement', `La remise totale n’est pas de ${p1 + p2} % : le coefficient multiplicateur du magasin A est ${fr(k)}.`),
    ] }),
    numeric(B, { prompt: `Quel est le prix ${obj.du} chez B ? (en €)`, tolerance: 0.01, misconceptions: [
      mc(clean((P * p3) / 100), 'mc:remise-seule', 'raisonnement', 'Ce nombre est le montant de la remise ; le prix à payer, c’est le prix de départ moins la remise.'),
      mc(clean((Q * (100 - p3)) / 100), 'mc:mauvais-prix-de-depart', 'raisonnement', 'La remise de B s’applique au prix de départ, pas au prix déjà soldé chez A.'),
    ] }),
    choose(`Dans quel magasin le prix ${obj.du} est-il le plus bas : A ou B ?`, aMoins ? MAG_A : MAG_B, [
      { accept: aMoins ? MAG_B : MAG_A, id: aMoins ? 'mc:mauvaise-comparaison' : 'mc:pourcentages-additionnes', feedback: `Compare les prix réels : ${eur(Q)} chez A et ${eur(B)} chez B${aMoins ? '' : ` ; additionner ${p1} % et ${p2} % surestime la remise de A`}.` },
    ]),
  ], {
    prompt: `Deux magasins vendent ${obj.un} au même prix de départ. Le magasin A fait une remise de ${p1} %, puis une seconde remise de ${p2} % sur le prix déjà soldé : ${who} y voit le prix final de ${eur(Q)}. Le magasin B fait une remise unique de ${p3} % sur le prix de départ.`,
    hints: [p1 === p2 ? `Baisser de ${p1} % revient à multiplier par ${coef(p1)}, et cela deux fois de suite.` : `Baisser de ${p1} % revient à multiplier par ${coef(p1)} ; baisser de ${p2} %, par ${coef(p2)}.`, `Les deux remises de A reviennent à multiplier le prix de départ par ${coef(p1)} × ${coef(p2)} = ${fr(k)}.`, `Prix de départ = prix final ÷ ${fr(k)} ; applique ensuite la remise de B à ce prix de départ.`],
    solution: `Coefficient de A : ${coef(p1)} × ${coef(p2)} = ${fr(k)}, soit une remise totale de ${fr(c)} % (et non ${p1 + p2} %). Prix de départ : ${fr(Q)} ÷ ${fr(k)} = ${eur(P)}. Chez B : ${P} × ${coef(p3)} = ${eur(B)}. Le prix le plus bas est chez ${aMoins ? 'A' : 'B'}.`,
    justify: { prompt: `Explique pourquoi les deux remises de A ne font pas une remise de ${p1 + p2} %, puis justifie le choix du magasin.`, minWords: 15, keywords: [['soldé', 'seconde remise', 'deuxième remise', 'coefficient', 'multipli'], ['moins cher', 'plus bas', 'magasin']], example: `La seconde remise de ${p2} % porte sur le prix déjà soldé, plus petit que le prix de départ : les coefficients se multiplient, ${coef(p1)} × ${coef(p2)} = ${fr(k)}, donc la remise totale est de ${fr(c)} % et non de ${p1 + p2} %. Le prix de départ est ${eur(P)} ; chez B on paie ${eur(B)}, donc le magasin ${aMoins ? 'A' : 'B'} est le moins cher.` },
    expectedSeconds: 480,
  });
}

/* ------------------------------------------------------------------------------------------
 * 3. Une recette pour plus de personnes, et les achats
 * ---------------------------------------------------------------------------------------- */

const RECETTES = [
  { nom: 'des crêpes', de: 'des crêpes', n: 4, sec: 'farine', q: 250, oeufs: 4, lait: 50 },
  { nom: 'des pancakes', de: 'des pancakes', n: 4, sec: 'farine', q: 200, oeufs: 2, lait: 30 },
  { nom: 'des gaufres', de: 'des gaufres', n: 6, sec: 'farine', q: 300, oeufs: 3, lait: 60 },
  { nom: 'un clafoutis', de: 'du clafoutis', n: 6, sec: 'sucre', q: 120, oeufs: 3, lait: 40 },
  { nom: 'un gâteau de semoule', de: 'du gâteau de semoule', n: 6, sec: 'semoule', q: 120, oeufs: 3, lait: 90 },
];
const recetteTexte = (R) => `${R.q} g de ${R.sec}, ${R.oeufs} œufs et ${R.lait} cL de lait`;

function recetteClasse(rand) {
  const who = nom(rand);
  let R; let k;
  do { R = pick(rand, RECETTES); k = pick(rand, [2, 3, 1.5]); } while (k === 1.5 && (R.oeufs % 2 || (R.q * 3) % 2 || (R.lait * 3) % 2));
  const n2 = R.n * k; const add = n2 - R.n;
  const additive = (x, plus) => mc(x + add, 'mc:modele-additif', 'notion', `Il y a ${fr(k)} fois plus de personnes : il faut ${fr(k)} fois plus ${plus}. On multiplie, on n’ajoute pas ${add}.`);
  return problem([
    numeric(R.q * k, { prompt: `Quelle masse de ${R.sec} faut-il pour ${n2} personnes ? (en g)`, unit: 'g', unitOptional: true, misconceptions: [additive(R.q, `de ${R.sec}`)] }),
    numeric(R.oeufs * k, { prompt: `Combien d’œufs faut-il pour ${n2} personnes ?`, misconceptions: [additive(R.oeufs, 'd’œufs')] }),
    numeric(R.lait * k, { prompt: `Quelle quantité de lait faut-il pour ${n2} personnes ? (en cL)`, unit: 'cL', unitOptional: true, misconceptions: [additive(R.lait, 'de lait')] }),
  ], {
    prompt: `Pour ${R.n} personnes, la recette ${R.de} demande ${recetteTexte(R)}. ${who} veut en préparer pour ${n2} personnes.`,
    hints: ['Compare les nombres de personnes : combien de fois plus ?', `${n2} ÷ ${R.n} = ${fr(k)} : toutes les quantités sont multipliées par ${fr(k)}.`, `Par exemple, pour le lait : ${R.lait} × ${fr(k)}.`],
    solution: `${n2} ÷ ${R.n} = ${fr(k)} : on multiplie tout par ${fr(k)}. ${cap(R.sec)} : ${R.q} × ${fr(k)} = ${fr(R.q * k)} g ; œufs : ${R.oeufs} × ${fr(k)} = ${fr(R.oeufs * k)} ; lait : ${R.lait} × ${fr(k)} = ${fr(R.lait * k)} cL.`,
    expectedSeconds: 210,
  });
}

function recettePlus(rand) {
  const who = nom(rand);
  let R; let n2; let pk; let q2; let l2; let cout;
  for (;;) {
    R = pick(rand, RECETTES); n2 = ri(rand, 3, 15);
    if (n2 % R.n === 0 || R.n % n2 === 0) continue;
    q2 = clean((R.q * n2) / R.n); l2 = clean((R.lait * n2) / R.n);
    if (!Number.isInteger(q2) || !Number.isInteger(l2)) continue;
    pk = pick(rand, [0.9, 1.2, 1.5, 1.8, 2.4, 3]); cout = clean((q2 / 1000) * pk);
    if (Number.isInteger(clean(cout * 100))) break;
  }
  return problem([
    numeric(q2, { prompt: `Quelle masse de ${R.sec} faut-il pour ${n2} personnes ? (en g)`, unit: 'g', unitOptional: true, misconceptions: [
      mc(R.q + n2 - R.n, 'mc:modele-additif', 'notion', 'Les quantités sont proportionnelles au nombre de personnes : on ne peut pas ajouter la différence du nombre de personnes.'),
      mc(R.q * n2, 'mc:passage-unite', 'methode', `Tu as multiplié la quantité pour ${R.n} personnes par ${n2} : il faut d’abord la diviser par ${R.n} (quantité pour une personne).`),
    ] }),
    numeric(clean(l2 / 100), { prompt: `Quelle quantité de lait faut-il pour ${n2} personnes ? (en litres)`, unit: 'L', unitOptional: true, misconceptions: [
      mc(l2, 'mc:conversion-cl-l', 'unite', `${fr(l2)} cL : la recette est en centilitres, on demande des litres (1 L = 100 cL).`),
    ] }),
    numeric(cout, { prompt: `Le paquet de 1 kg de ${R.sec} coûte ${eur(pk)}. Combien coûte la quantité de ${R.sec} utilisée ? (en €)`, misconceptions: [
      mc(clean(q2 * pk), 'mc:conversion-g-kg', 'unite', `Le prix est donné pour 1 kg = 1 000 g : ${fr(q2)} g, c’est ${fr(q2 / 1000)} kg.`),
    ] }),
  ], {
    prompt: `Pour ${R.n} personnes, la recette ${R.de} demande ${recetteTexte(R)}. ${who} veut en préparer pour ${n2} personnes.`,
    hints: [`Passe par une personne : ${R.q} ÷ ${R.n} = ${fr(clean(R.q / R.n))} g de ${R.sec} par personne.`, `Pour le lait : ${R.lait} ÷ ${R.n} × ${n2} cL, puis convertis (1 L = 100 cL).`, `Prix : convertis la masse en kg, puis multiplie par ${eur(pk)}.`],
    solution: `${cap(R.sec)} : ${R.q} ÷ ${R.n} × ${n2} = ${fr(q2)} g. Lait : ${R.lait} ÷ ${R.n} × ${n2} = ${fr(l2)} cL = ${fr(l2 / 100)} L. Coût : ${fr(q2)} g = ${fr(q2 / 1000)} kg, et ${fr(q2 / 1000)} × ${fr(pk)} = ${eur(cout)}.`,
    expectedSeconds: 300,
  });
}

function recetteExpert(rand) {
  const who = nom(rand);
  let R; let k; let eggs; let laitL;
  for (;;) {
    R = pick(rand, RECETTES); k = ri(rand, 4, 8); eggs = R.oeufs * k; laitL = clean((R.lait * k) / 100);
    if (eggs % 6 !== 0 && !Number.isInteger(laitL)) break;
  }
  const N = R.n * k; const secG = R.q * k;
  const pk = pick(rand, [0.9, 1.2, 1.5]); const pe = pick(rand, [1.8, 2.1, 2.4, 2.7, 3]); const pl = pick(rand, [0.9, 1.05, 1.2]);
  const boites = Math.ceil(eggs / 6); const bout = Math.ceil(laitL); const paq = Math.ceil(secG / 1000);
  const cout = clean(paq * pk + boites * pe + bout * pl);
  const exact = clean((secG / 1000) * pk + (eggs / 6) * pe + laitL * pl);
  return problem([
    numeric(boites, { prompt: 'Combien de boîtes de 6 œufs faut-il acheter ?', misconceptions: [
      mc(Math.floor(eggs / 6), 'mc:arrondi-inferieur', 'raisonnement', `Avec ${Math.floor(eggs / 6)} boîtes, il n’y aurait que ${6 * Math.floor(eggs / 6)} œufs : il en manquerait. On arrondit à l’entier supérieur.`),
      mc(clean(eggs / 6), 'mc:quantite-non-entiere', 'raisonnement', 'On ne peut pas acheter une partie de boîte : il faut un nombre entier de boîtes, arrondi au-dessus.'),
      mc(eggs, 'mc:oeufs-au-lieu-boites', 'lecture', `${eggs}, c’est le nombre d’œufs ; une boîte en contient 6.`),
    ] }),
    numeric(bout, { prompt: 'Combien de bouteilles de 1 L de lait faut-il acheter ?', misconceptions: [
      mc(Math.floor(laitL), 'mc:arrondi-inferieur', 'raisonnement', `Il faut ${fr(laitL)} L de lait : ${Math.floor(laitL)} bouteilles ne suffisent pas.`),
      mc(laitL, 'mc:quantite-non-entiere', 'raisonnement', 'On achète des bouteilles entières : arrondis à l’entier supérieur.'),
      mc(R.lait * k, 'mc:conversion-cl-l', 'unite', `${R.lait * k} cL, c’est ${fr(laitL)} L (1 L = 100 cL).`),
    ] }),
    numeric(cout, { prompt: 'Combien coûtent tous les achats ? (en €)', tolerance: 0.01, misconceptions: [
      mc(exact, 'mc:sans-arrondi', 'raisonnement', 'On paie des paquets, des boîtes et des bouteilles entiers : calcule le prix avec les nombres de paquets, de boîtes et de bouteilles achetés.'),
    ] }),
  ], {
    prompt: `${who} prépare ${R.nom} pour ${N} personnes. La recette, pour ${R.n} personnes : ${recetteTexte(R)}. Au magasin, le paquet de 1 kg de ${R.sec} coûte ${eur(pk)}, la boîte de 6 œufs ${eur(pe)} et la bouteille de 1 L de lait ${eur(pl)}.`,
    hints: [`${N} personnes, c’est ${k} fois ${R.n} personnes : multiplie chaque quantité par ${k}.`, `Il faut ${eggs} œufs et ${fr(laitL)} L de lait, mais on n’achète que des boîtes et des bouteilles entières.`, 'Arrondis les nombres de paquets, de boîtes et de bouteilles à l’entier supérieur, puis additionne les prix.'],
    solution: `Pour ${N} personnes (× ${k}) : ${fr(secG)} g de ${R.sec}, ${eggs} œufs, ${R.lait * k} cL = ${fr(laitL)} L de lait. Achats : ${paq} paquet${paq > 1 ? 's' : ''} de ${R.sec}, ${boites} boîtes d’œufs (${quot(eggs, 6)}), ${bout} bouteilles de lait. Coût : ${paq} × ${fr(pk)} + ${boites} × ${fr(pe)} + ${bout} × ${fr(pl)} = ${eur(cout)}.`,
    justify: { prompt: 'Explique pourquoi on ne peut pas acheter exactement les quantités de la recette, et comment tu as calculé le coût.', minWords: 15, keywords: [['arrondi', 'supérieur', 'entier', 'entière', 'complet', 'complète'], ['boîte', 'bouteille', 'paquet']], example: `Il faut ${eggs} œufs et ${fr(laitL)} L de lait, mais on n’achète que des boîtes de 6 œufs et des bouteilles de 1 L entières : j’arrondis à l’entier supérieur, soit ${boites} boîtes et ${bout} bouteilles, plus ${paq} paquet${paq > 1 ? 's' : ''} de ${R.sec}. J’additionne ensuite les prix : ${eur(cout)}.` },
    expectedSeconds: 480,
  });
}

/* ------------------------------------------------------------------------------------------
 * 4. Peindre ou carreler une pièce
 * ---------------------------------------------------------------------------------------- */

const PORTES = [[0.8, 2], [0.9, 2], [0.9, 2.1]];
const FENETRES = [[1, 1], [1.2, 1], [1.5, 1], [1, 1.4], [1.6, 1.25]];
const notInteger = (q) => q - Math.floor(q) > 0.05 && q - Math.floor(q) < 0.95;

function peintureClasse(rand) {
  const who = nom(rand);
  let L; let H; let door; let c; let mur; let A;
  do {
    L = ri(rand, 6, 12) / 2; H = pick(rand, [2.4, 2.5, 2.6, 2.7]); door = pick(rand, PORTES); c = pick(rand, [2.5, 3, 4, 5]);
    mur = clean(L * H); A = clean(mur - door[0] * door[1]);
  } while (!notInteger(A / c));
  const pa = clean(door[0] * door[1]); const pots = Math.ceil(A / c); const fl = Math.floor(A / c);
  return problem([
    numeric(mur, { prompt: 'Quelle est l’aire du mur entier, porte comprise ? (en m²)', unit: 'm²', unitOptional: true, misconceptions: [
      mc(clean(2 * (L + H)), 'mc:perimetre-au-lieu-aire', 'notion', 'Tu as calculé le périmètre (le tour du mur). L’aire d’un rectangle, c’est longueur × largeur.'),
      mc(clean(L + H), 'mc:somme-au-lieu-produit', 'calcul', 'L’aire d’un rectangle se calcule en multipliant la longueur par la largeur, pas en les additionnant.'),
    ] }),
    numeric(A, { prompt: 'Quelle aire faut-il peindre ? (en m²)', unit: 'm²', unitOptional: true, misconceptions: [
      mc(mur, 'mc:oubli-porte', 'raisonnement', `On ne peint pas la porte : il faut retirer son aire (${fr(door[0])} × ${fr(door[1])} = ${fr(pa)} m²).`),
      mc(clean(mur + pa), 'mc:porte-ajoutee', 'raisonnement', 'L’aire de la porte se retire de celle du mur, elle ne s’ajoute pas.'),
    ] }),
    numeric(pots, { prompt: `Un pot de peinture permet de peindre ${fr(c)} m². Combien de pots faut-il acheter ?`, misconceptions: [
      mc(fl, 'mc:arrondi-inferieur', 'raisonnement', `Avec ${fl} pot${fl > 1 ? 's' : ''}, on ne peint que ${fr(clean(fl * c))} m² : il en manquerait. On arrondit à l’entier supérieur.`),
      mc(clean(A / c), 'mc:pots-non-entiers', 'raisonnement', 'On ne peut pas acheter une partie de pot : il faut un nombre entier de pots, arrondi au-dessus.'),
    ] }),
  ], {
    prompt: `${who} veut repeindre un mur de sa chambre. Le mur est un rectangle de ${fr(L)} m de long et ${fr(H)} m de haut ; il contient une porte de ${fr(door[0])} m sur ${fr(door[1])} m, qu’on ne peint pas. Une seule couche suffit.`,
    hints: ['Aire d’un rectangle = longueur × largeur.', `Aire à peindre = aire du mur − aire de la porte (${fr(door[0])} × ${fr(door[1])}).`, 'Nombre de pots : aire à peindre ÷ aire couverte par un pot, arrondi à l’entier supérieur.'],
    solution: `Mur : ${fr(L)} × ${fr(H)} = ${fr(mur)} m². Porte : ${fr(door[0])} × ${fr(door[1])} = ${fr(pa)} m². À peindre : ${fr(mur)} − ${fr(pa)} = ${fr(A)} m². Pots : ${quot(A, c)}, donc ${pots} pots (on arrondit au-dessus).`,
    expectedSeconds: 270,
  });
}

function carrelagePlus(rand) {
  const who = nom(rand);
  let a; let b; let c; let d; let s; let B; let aire; let n;
  for (;;) {
    a = ri(rand, 8, 14) / 2; b = ri(rand, 6, 10) / 2; c = ri(rand, 2, 4) / 2; d = ri(rand, 2, 4) / 2;
    if (c > a - 1.5 || d > b - 1.5) continue;
    s = pick(rand, [25, 50]); B = s === 50 ? pick(rand, [8, 10, 12]) : pick(rand, [20, 24, 32]);
    aire = clean(a * b - c * d); n = Math.round(aire / ((s / 100) ** 2));
    if (n % B !== 0) break;
  }
  const t2 = clean((s / 100) ** 2); const boites = Math.ceil(n / B); const fl = Math.floor(n / B);
  return problem([
    numeric(aire, { prompt: 'Quelle est l’aire du sol à carreler ? (en m²)', unit: 'm²', unitOptional: true, misconceptions: [
      mc(clean(a * b), 'mc:rectangle-englobant', 'raisonnement', `Il faut retirer le coin qui manque (${fr(c)} m sur ${fr(d)} m).`),
      mc(clean(a * b + c * d), 'mc:coin-ajoute', 'raisonnement', 'Le coin manquant se retire du grand rectangle, il ne s’ajoute pas.'),
    ] }),
    numeric(n, { prompt: 'Combien de carreaux faut-il poser ?', misconceptions: [
      mc(clean(aire / (s / 100)), 'mc:aire-carreau', 'notion', `Un carreau de ${s} cm de côté n’a pas une aire de ${fr(s / 100)} m² : son aire est ${fr(s / 100)} × ${fr(s / 100)} = ${fr(t2)} m².`),
    ] }),
    numeric(boites, { prompt: `Les carreaux sont vendus par boîtes de ${B}. Combien de boîtes faut-il acheter ?`, misconceptions: [
      mc(fl, 'mc:arrondi-inferieur', 'raisonnement', `Avec ${fl} boîtes, on n’aurait que ${B * fl} carreaux : il en manquerait. On arrondit au-dessus.`),
      mc(clean(n / B), 'mc:boites-non-entieres', 'raisonnement', 'On achète des boîtes entières : arrondis à l’entier supérieur.'),
    ] }),
  ], {
    prompt: `${who} veut carreler le sol d’une pièce en forme de L : c’est un rectangle de ${fr(a)} m sur ${fr(b)} m auquel il manque, dans un coin, un rectangle de ${fr(c)} m sur ${fr(d)} m (un placard). Les carreaux sont des carrés de ${s} cm de côté, posés sans découpe.`,
    hints: ['Aire du L = aire du grand rectangle − aire du coin qui manque.', `Un carreau mesure ${fr(s / 100)} m de côté : son aire est ${fr(s / 100)} × ${fr(s / 100)} = ${fr(t2)} m².`, 'Nombre de carreaux = aire du sol ÷ aire d’un carreau ; pour les boîtes, arrondis à l’entier supérieur.'],
    solution: `Aire : ${fr(a)} × ${fr(b)} − ${fr(c)} × ${fr(d)} = ${fr(clean(a * b))} − ${fr(clean(c * d))} = ${fr(aire)} m². Un carreau : ${fr(t2)} m², donc ${fr(aire)} ÷ ${fr(t2)} = ${n} carreaux. Boîtes : ${quot(n, B)}, donc ${boites} boîtes.`,
    expectedSeconds: 330,
  });
}

function peintureExpert(rand) {
  const who = nom(rand);
  let L; let l; let H; let w; let S; let V; let PL; let prix;
  for (;;) {
    L = ri(rand, 6, 10) / 2; l = ri(rand, 5, 8) / 2; H = pick(rand, [2.4, 2.5, 2.6]); w = pick(rand, FENETRES);
    if (l >= L) continue;
    S = clean(2 * (L + l) * H - 1.6 - w[0] * w[1]); V = clean(S / 5);
    [PL, prix] = pick(rand, [[1, ri(rand, 12, 18)], [2, ri(rand, 22, 30)], [2.5, ri(rand, 28, 38)]]);
    if (Number.isInteger(clean(V * 100)) && notInteger(V / PL)) break;
  }
  const ouv = clean(1.6 + w[0] * w[1]); const brut = clean(2 * (L + l) * H);
  const pots = Math.ceil(V / PL); const fl = Math.floor(V / PL); const cout = pots * prix;
  return problem([
    numeric(S, { prompt: 'Quelle est l’aire totale des murs à peindre ? (en m²)', unit: 'm²', unitOptional: true, tolerance: 0.01, misconceptions: [
      mc(clean(L * l), 'mc:aire-sol', 'notion', 'Tu as calculé l’aire du sol : on peint les quatre murs, chacun est un rectangle (côté de la pièce × hauteur).'),
      mc(brut, 'mc:ouvertures', 'raisonnement', `On ne peint ni la porte ni la fenêtre : il faut retirer ${fr(ouv)} m².`),
      mc(clean((L + l) * H - ouv), 'mc:deux-murs', 'raisonnement', 'La pièce a quatre murs : deux de chaque sorte.'),
    ] }),
    numeric(V, { prompt: 'Combien de litres de peinture faut-il pour les deux couches ?', unit: 'L', unitOptional: true, tolerance: 0.01, misconceptions: [
      mc(clean(S / 10), 'mc:une-couche', 'raisonnement', 'Il faut deux couches : la surface est peinte deux fois.'),
      mc(clean(S * 20), 'mc:produit-au-lieu-quotient', 'methode', 'Un litre couvre 10 m² : le nombre de litres est la surface à couvrir divisée par 10.'),
    ] }),
    numeric(cout, { prompt: `La peinture est vendue en pots de ${fr(PL)} L à ${eur(prix)} le pot. Quelle est la dépense minimale ? (en €)`, tolerance: 0.01, misconceptions: [
      mc(clean((V / PL) * prix), 'mc:pots-non-entiers', 'raisonnement', 'On achète des pots entiers : arrondis le nombre de pots à l’entier supérieur avant de calculer le prix.'),
      mc(fl * prix, 'mc:arrondi-inferieur', 'raisonnement', `Avec ${fl} pot${fl > 1 ? 's' : ''}, il manquerait de la peinture : on arrondit au-dessus.`),
    ] }),
  ], {
    prompt: `${who} repeint les quatre murs d’une chambre rectangulaire de ${fr(L)} m sur ${fr(l)} m ; les murs mesurent ${fr(H)} m de haut. On ne peint ni la porte (0,8 m sur 2 m) ni la fenêtre (${fr(w[0])} m sur ${fr(w[1])} m). Il faut deux couches, et un litre de peinture couvre 10 m² pour une couche.`,
    hints: [`Les quatre murs : deux murs de ${fr(L)} m × ${fr(H)} m et deux murs de ${fr(l)} m × ${fr(H)} m, moins la porte et la fenêtre.`, 'Deux couches : la surface à couvrir est doublée ; il faut 1 L pour 10 m².', 'Nombre de pots : litres ÷ contenance d’un pot, arrondi à l’entier supérieur ; puis multiplie par le prix d’un pot.'],
    solution: `Murs : 2 × (${fr(L)} + ${fr(l)}) × ${fr(H)} = ${fr(brut)} m² ; ouvertures : 1,6 + ${fr(clean(w[0] * w[1]))} = ${fr(ouv)} m² ; à peindre : ${fr(S)} m². Deux couches : ${fr(clean(2 * S))} m², soit ${fr(clean(2 * S))} ÷ 10 = ${fr(V)} L. Pots : ${quot(V, PL)}, donc ${pots} pots, soit ${pots} × ${eur(prix)} = ${eur(cout)}.`,
    justify: { prompt: 'Explique ta démarche : la surface à peindre, les deux couches, puis le nombre de pots et la dépense.', minWords: 15, keywords: [['surface', 'aire'], 'couche', 'pot'], example: `La surface des quatre murs moins la porte et la fenêtre vaut ${fr(S)} m². Avec deux couches, il faut couvrir ${fr(clean(2 * S))} m², donc ${fr(V)} L de peinture. Il faut ${pots} pots car on arrondit à l’entier supérieur, ce qui coûte ${eur(cout)}.` },
    expectedSeconds: 480,
  });
}

/* ------------------------------------------------------------------------------------------
 * 5. Le théorème de Pythagore en situation : échelle, écran
 * ---------------------------------------------------------------------------------------- */

// [distance au mur, hauteur atteinte, longueur de l'échelle] en m : triplets pythagoriciens exacts
const ECHELLES = [[0.7, 2.4, 2.5], [1, 2.4, 2.6], [1.6, 3, 3.4], [0.9, 4, 4.1], [1.2, 3.5, 3.7], [1.1, 6, 6.1], [1.5, 2, 2.5],
  [1.8, 2.4, 3], [1.2, 1.6, 2], [2.1, 2.8, 3.5], [1.5, 3.6, 3.9], [2, 4.8, 5.2], [0.8, 1.5, 1.7], [1.4, 4.8, 5],
  [1.6, 6.3, 6.5], [1.3, 8.4, 8.5], [2.4, 7, 7.4], [1.8, 8, 8.2], [2.4, 3.2, 4]];
const HYPO_OK = ['l’échelle', 'l\'échelle', 'échelle', 'la longueur de l’échelle', 'la longueur de l\'échelle'];
const HYPO_FAUX = ['le mur', 'mur', 'le sol', 'sol', 'la hauteur', 'hauteur'];
const ECRANS = [{ un: 'un téléviseur', tailles: [32, 40, 43, 50, 55, 65] }, { un: 'un moniteur d’ordinateur', tailles: [22, 24, 27, 32] }];

function echelleClasse(rand) {
  const who = nom(rand); const [d, h, L] = pick(rand, ECHELLES);
  const W = clean(h + pick(rand, [-0.5, -0.4, -0.3, -0.2, 0.2, 0.3, 0.4, 0.5]));
  const ok = h >= W; const h2 = clean(L * L - d * d);
  return problem([
    choose('Dans le triangle rectangle formé par le mur, le sol et l’échelle, quel côté est l’hypoténuse : le mur, le sol ou l’échelle ?', HYPO_OK, [
      { accept: HYPO_FAUX, id: 'mc:hypotenuse', error: 'notion', feedback: 'L’hypoténuse est le côté opposé à l’angle droit ; ici, l’angle droit est entre le mur et le sol.' },
    ]),
    numeric(h, { prompt: 'À quelle hauteur arrive le haut de l’échelle ? (en m)', unit: 'm', unitOptional: true, misconceptions: [
      mc(clean(L - d), 'mc:difference-longueurs', 'notion', 'On ne soustrait pas les longueurs : le théorème de Pythagore porte sur leurs carrés.'),
      mc(h2, 'mc:racine-oubliee', 'calcul', 'Ce nombre est le carré de la hauteur : il reste à prendre sa racine carrée.'),
      mc(clean(L * L + d * d), 'mc:somme-au-lieu-difference', 'notion', 'L’échelle est l’hypoténuse : hauteur² = échelle² − distance², c’est une différence.'),
    ] }),
    yesNo(ok, `Le rebord d’une fenêtre est à ${fr(W)} m du sol. Le haut de l’échelle l’atteint-il ? (oui ou non)`, 'mc:comparaison', 'raisonnement', `Compare la hauteur atteinte par l’échelle à ${fr(W)} m.`),
  ], {
    prompt: `${who} appuie une échelle de ${fr(L)} m contre le mur vertical de la maison, sur un sol horizontal. Le pied de l’échelle est à ${fr(d)} m du mur.`,
    hints: ['Le mur, le sol et l’échelle forment un triangle rectangle ; l’angle droit est au pied du mur.', 'L’hypoténuse est l’échelle : échelle² = hauteur² + distance².', `Hauteur² = ${fr(L)}² − ${fr(d)}² ; il reste à prendre la racine carrée.`],
    solution: `Le triangle est rectangle au pied du mur, d’hypoténuse l’échelle. Par le théorème de Pythagore : h² = ${fr(L)}² − ${fr(d)}² = ${fr(clean(L * L))} − ${fr(clean(d * d))} = ${fr(h2)}, donc h = √${fr(h2)} = ${fr(h)} m. ${ok ? `${fr(h)} m ≥ ${fr(W)} m : l’échelle atteint le rebord.` : `${fr(h)} m < ${fr(W)} m : l’échelle n’atteint pas le rebord.`}`,
    expectedSeconds: 270,
  });
}

function ecranPlus(rand) {
  const who = nom(rand);
  let dev; let real; let w; let h; let diag;
  for (;;) {
    dev = pick(rand, ECRANS); real = pick(rand, dev.tailles);
    const k = (real * 2.54) / Math.sqrt(337); // format 16:9
    w = Math.round(16 * k) + ri(rand, -1, 1); h = Math.round(9 * k);
    diag = Math.sqrt(w * w + h * h); const inch = diag / 2.54;
    if (Math.abs(diag * 10 - Math.round(diag * 10)) < 0.35 && Math.abs(inch - Math.round(inch)) < 0.35 && Math.round(inch) === real) break;
  }
  const d1 = round(diag, 1); const pouces = Math.round(d1 / 2.54); const c2 = w * w + h * h;
  const annonce = rand() < 0.55 ? real : real + pick(rand, [1, 2, 3]); const vrai = annonce === pouces;
  return problem([
    numeric(d1, { prompt: 'Quelle est la longueur de la diagonale de l’écran, arrondie au dixième de centimètre ? (en cm)', unit: 'cm', unitOptional: true, tolerance: 0.05, round: 1, misconceptions: [
      mc(w + h, 'mc:somme-longueurs', 'notion', 'La diagonale n’est pas la somme des deux côtés : c’est l’hypoténuse du triangle rectangle formé par la largeur et la hauteur.'),
      mc(c2, 'mc:racine-oubliee', 'calcul', 'Ce nombre est le carré de la diagonale : il reste à prendre sa racine carrée.'),
    ] }),
    numeric(pouces, { prompt: 'Quelle est la longueur de cette diagonale en pouces, arrondie à l’unité ? (1 pouce = 2,54 cm)', unit: 'pouces', unitOptional: true, round: 0, misconceptions: [
      mc(Math.round(d1 * 2.54), 'mc:conversion-inverse', 'unite', '1 pouce = 2,54 cm : pour passer des centimètres aux pouces, on divise par 2,54 (on ne multiplie pas).'),
    ] }),
    yesNo(vrai, `Le vendeur annonce un écran de ${annonce} pouces. Cette annonce est-elle exacte, à l’unité près ? (oui ou non)`, 'mc:comparaison', 'raisonnement', `Compare ta mesure en pouces à l’annonce (${annonce} pouces).`),
  ], {
    prompt: `${who} regarde ${dev.un} dont l’écran mesure ${w} cm de large et ${h} cm de haut. La taille d’un écran est la longueur de sa diagonale, donnée en pouces.`,
    hints: ['La largeur, la hauteur et la diagonale forment un triangle rectangle : la diagonale est l’hypoténuse.', `Diagonale² = ${w}² + ${h}² = ${fr(c2)}.`, 'Pour passer des centimètres aux pouces, on divise par 2,54.'],
    solution: `Par le théorème de Pythagore : diagonale² = ${w}² + ${h}² = ${fr(w * w)} + ${fr(h * h)} = ${fr(c2)}, donc diagonale = √${fr(c2)} ≈ ${fr(d1)} cm. En pouces : ${fr(d1)} ÷ 2,54 ≈ ${fr(round(d1 / 2.54, 2))}, soit ${pouces} pouces. L’annonce de ${annonce} pouces est ${vrai ? 'exacte' : 'fausse'}.`,
    expectedSeconds: 330,
  });
}

function echelleExpert(rand) {
  const who = nom(rand); const wantSafe = rand() < 0.5;
  let L; let d; let alpha; let h;
  for (;;) {
    L = pick(rand, [3, 3.5, 4, 4.5, 5, 6]); d = ri(rand, 5, 30) / 10;
    if (d > L * 0.6) continue;
    alpha = (Math.acos(d / L) * 180) / Math.PI; h = Math.sqrt(L * L - d * d);
    const safe = alpha >= 65 && alpha <= 75;
    if (safe !== wantSafe || Math.abs(alpha - 65) < 1.5 || Math.abs(alpha - 75) < 1.5) continue;
    if (Math.abs(alpha - Math.round(alpha)) < 0.35 && Math.abs(h * 100 - Math.round(h * 100)) < 0.35) break;
  }
  const A = Math.round(alpha); const h2 = round(h, 2);
  const verdict = wantSafe ? `${A}° est compris entre 65° et 75° : l’échelle est en sécurité.` : `${A}° n’est pas compris entre 65° et 75° : l’échelle n’est pas en sécurité (${A < 65 ? 'son pied est trop loin du mur' : 'elle est trop droite'}).`;
  return problem([
    numeric(h2, { prompt: 'À quelle hauteur arrive le haut de l’échelle ? (en m, arrondie au centimètre)', unit: 'm', unitOptional: true, tolerance: 0.005, round: 2, misconceptions: [
      mc(round(Math.sqrt(L * L + d * d), 2), 'mc:somme-au-lieu-difference', 'notion', 'L’échelle est l’hypoténuse : la hauteur se calcule avec une différence de carrés, h² = L² − d².'),
      mc(clean(L - d), 'mc:difference-longueurs', 'notion', 'On ne soustrait pas les longueurs : on applique le théorème de Pythagore à leurs carrés.'),
    ] }),
    numeric(A, { prompt: 'Quelle est la mesure de l’angle entre l’échelle et le sol, arrondie au degré ?', tolerance: 0.5, round: 0, misconceptions: [
      mc(Math.round(90 - alpha), 'mc:angle-mur', 'lecture', 'Tu as calculé l’angle entre l’échelle et le mur. Pour l’angle avec le sol : cos(angle) = côté adjacent ÷ hypoténuse = distance au mur ÷ longueur de l’échelle.'),
    ] }),
    yesNo(wantSafe, 'L’échelle est-elle placée en sécurité ? (oui ou non)', 'mc:comparaison-angle', 'raisonnement', 'La règle demande un angle compris entre 65° et 75° : compare l’angle trouvé à ces deux valeurs.'),
  ], {
    prompt: `${who} pose une échelle de ${fr(L)} m contre un mur vertical, sur un sol horizontal ; le pied de l’échelle est à ${fr(d)} m du mur. Pour qu’une échelle soit stable, l’angle entre l’échelle et le sol doit être compris entre 65° et 75°.`,
    hints: ['Le mur, le sol et l’échelle forment un triangle rectangle dont l’hypoténuse est l’échelle.', `Hauteur : théorème de Pythagore, h² = ${fr(L)}² − ${fr(d)}².`, `Angle avec le sol : cos(angle) = côté adjacent ÷ hypoténuse = ${fr(d)} ÷ ${fr(L)} ; utilise la touche cos⁻¹ (ou Arccos) de la calculatrice.`],
    solution: `Pythagore : h² = ${fr(L)}² − ${fr(d)}² = ${fr(clean(L * L - d * d))}, donc h ≈ ${fr(h2)} m. Cosinus : cos(angle) = ${fr(d)} ÷ ${fr(L)} ≈ ${fr(round(d / L, 3))}, donc l’angle mesure environ ${A}°. ${verdict}`,
    justify: { prompt: 'Explique ta démarche : quel triangle, quel théorème, quel rapport trigonométrique, puis ta conclusion.', minWords: 15, keywords: ['Pythagore', ['cosinus', 'cos'], 'angle'], example: `Le mur, le sol et l’échelle forment un triangle rectangle dont l’échelle est l’hypoténuse. Par le théorème de Pythagore, h² = ${fr(L)}² − ${fr(d)}², donc h ≈ ${fr(h2)} m. Avec le cosinus, cos(angle) = ${fr(d)} ÷ ${fr(L)}, donc l’angle avec le sol mesure environ ${A}°. ${verdict}` },
    expectedSeconds: 450,
  });
}

/* ------------------------------------------------------------------------------------------
 * 6. La hauteur d'un arbre ou d'un immeuble par son ombre (Thalès)
 * ---------------------------------------------------------------------------------------- */

const HAUTS = [{ du: 'de l’arbre' }, { du: 'du sapin' }, { du: 'du mât du drapeau' }];

function ombreClasse(rand) {
  const who = nom(rand); const o = pick(rand, HAUTS);
  let b; let s; let k; let m;
  do { b = pick(rand, [1, 1.2, 1.5, 2]); s = ri(rand, 4, 20) / 10; k = ri(rand, 3, 9); m = ri(rand, 2, 6); } while (m === k);
  const S = clean(s * k); const H = clean(b * k); const P = clean(b * m); const sP = clean(s * m);
  return problem([
    numeric(k, { prompt: `Combien de fois l’ombre ${o.du} est-elle plus longue que celle du bâton ?`, misconceptions: [
      mc(clean(S - s), 'mc:difference-au-lieu-rapport', 'notion', '« Combien de fois plus » : c’est un quotient (une ombre divisée par l’autre), pas une différence.'),
    ] }),
    numeric(H, { prompt: `Quelle est la hauteur ${o.du} ? (en m)`, unit: 'm', unitOptional: true, misconceptions: [
      mc(clean(b + S - s), 'mc:modele-additif', 'notion', 'Hauteurs et ombres sont proportionnelles : on multiplie par le même nombre, on n’ajoute pas la même longueur.'),
      mc(clean((b * s) / S), 'mc:rapport-inverse', 'raisonnement', `L’ombre ${o.du} est plus longue que celle du bâton : sa hauteur est donc plus grande, pas plus petite.`),
    ] }),
    numeric(sP, { prompt: `Au même moment, quelle est la longueur de l’ombre d’un lampadaire de ${fr(P)} m de haut ? (en m)`, unit: 'm', unitOptional: true, misconceptions: [
      mc(clean((P * b) / s), 'mc:rapport-inverse', 'raisonnement', `Le bâton de ${fr(b)} m a une ombre de ${fr(s)} m : l’ombre vaut hauteur × ${fr(s)} ÷ ${fr(b)}.`),
      mc(clean(P - b + s), 'mc:modele-additif', 'notion', 'Hauteurs et ombres sont proportionnelles : on ne peut pas ajouter la même longueur.'),
    ] }),
  ], {
    prompt: `Par une journée de soleil, ${who} plante verticalement un bâton de ${fr(b)} m dans le sol horizontal : son ombre mesure ${fr(s)} m. Au même moment, l’ombre ${o.du} mesure ${fr(S)} m. À un instant donné, la hauteur d’un objet vertical et la longueur de son ombre sont proportionnelles.`,
    hints: [`Calcule ${fr(S)} ÷ ${fr(s)} : l’ombre ${o.du} est combien de fois plus longue ?`, 'La hauteur est multipliée par le même nombre que l’ombre.', `Le lampadaire mesure ${fr(P)} m, c’est-à-dire ${m} fois la hauteur du bâton.`],
    solution: `${fr(S)} ÷ ${fr(s)} = ${k} : l’ombre ${o.du} est ${k} fois plus longue, donc la hauteur ${o.du} est ${k} × ${fr(b)} = ${fr(H)} m. Le lampadaire mesure ${fr(P)} ÷ ${fr(b)} = ${m} fois le bâton, donc son ombre mesure ${m} × ${fr(s)} = ${fr(sP)} m.`,
    expectedSeconds: 270,
  });
}

function ombrePlus(rand) {
  const who = nom(rand); const o = pick(rand, HAUTS);
  const t = ri(rand, 150, 185); const s = ri(rand, 8, 25) / 10; const k = ri(rand, 3, 8); const j = ri(rand, k + 2, k + 10);
  const S = clean(k * s); const D = clean((k - 1) * s); const H = clean((t * k) / 100); const S2 = clean(s * j); const H2 = clean((t * j) / 100); const tm = t / 100;
  return problem([
    numeric(S, { prompt: `Quelle est la longueur de l’ombre ${o.du} ? (en m)`, unit: 'm', unitOptional: true, misconceptions: [
      mc(D, 'mc:longueur-totale', 'lecture', `L’ombre ${o.du} va de son pied jusqu’au bout de l’ombre de ${who} : ${fr(D)} + ${fr(s)}.`),
    ] }),
    numeric(H, { prompt: `Quelle est la hauteur ${o.du} ? (en m)`, unit: 'm', unitOptional: true, misconceptions: [
      mc(clean((t * (k - 1)) / 100), 'mc:longueur-totale', 'lecture', `Utilise toute l’ombre ${o.du} (${fr(S)} m), pas seulement la distance de ${fr(D)} m.`),
      mc(clean((tm * s) / S), 'mc:rapport-inverse', 'raisonnement', `L’ombre ${o.du} est plus longue que celle de ${who} : la hauteur est donc plus grande, pas plus petite.`),
    ] }),
    numeric(H2, { prompt: `Au même moment, l’ombre d’un immeuble voisin mesure ${fr(S2)} m. Quelle est sa hauteur ? (en m)`, unit: 'm', unitOptional: true, misconceptions: [
      mc(clean(tm + S2 - s), 'mc:modele-additif', 'notion', 'Hauteurs et ombres sont proportionnelles : on multiplie par le même rapport, on n’ajoute pas la même longueur.'),
    ] }),
  ], {
    prompt: `${who}, qui mesure ${t} cm, se place debout au soleil de façon que le bout de son ombre arrive exactement au même point que le bout de l’ombre ${o.du}. L’ombre de ${who} mesure ${fr(s)} m, et ${who} se tient à ${fr(D)} m du pied ${o.du}.`,
    hints: [`L’ombre ${o.du} = ${fr(D)} m + l’ombre de ${who}.`, `Convertis : ${t} cm = ${fr(tm)} m. Les rayons du soleil sont parallèles : on peut utiliser le théorème de Thalès (ou la proportionnalité).`, `Hauteur ÷ ombre est le même rapport pour ${who} et pour ${o.du.replace(/^d(e |u )/, (x) => (x === 'du ' ? 'le ' : ''))}.`],
    solution: `Ombre ${o.du} : ${fr(D)} + ${fr(s)} = ${fr(S)} m. Les rayons du soleil sont parallèles (configuration de Thalès) : hauteur ÷ ombre est le même rapport. Hauteur ${o.du} : ${fr(tm)} × ${fr(S)} ÷ ${fr(s)} = ${fr(H)} m. Immeuble : ${fr(tm)} × ${fr(S2)} ÷ ${fr(s)} = ${fr(H2)} m.`,
    expectedSeconds: 330,
  });
}

function ombreExpert(rand) {
  const who = nom(rand);
  const R = [0.5, 0.6, 0.8, 1.2, 1.4, 1.5, 2];
  let t; let r; let r2; let Hb; let s; let s2;
  for (;;) {
    t = 5 * ri(rand, 30, 37); r = pick(rand, R); r2 = pick(rand, R); Hb = ri(rand, 12, 40);
    if (r2 === r) continue;
    s = clean((t * r) / 100); s2 = clean((t * r2) / 100);
    if (Number.isInteger(clean(s * 100)) && Number.isInteger(clean(s2 * 100))) break;
  }
  const Sb = clean(Hb * r); const Sb2 = clean(Hb * r2); const tm = t / 100; const dist = clean(Sb - s);
  return problem([
    numeric(s, { prompt: `À ce moment-là, quelle est la longueur de l’ombre de ${who} ? (en m)`, unit: 'm', unitOptional: true, misconceptions: [
      mc(clean(tm / r), 'mc:rapport-inverse', 'raisonnement', 'Le rapport ombre ÷ hauteur est le même pour l’immeuble et pour la personne : ombre = taille × ce rapport.'),
    ] }),
    numeric(dist, { prompt: `À quelle distance du pied de l’immeuble faut-il que ${who} se place pour que le bout de son ombre arrive exactement au bout de l’ombre de l’immeuble ? (en m)`, unit: 'm', unitOptional: true, misconceptions: [
      mc(Sb, 'mc:longueur-totale', 'raisonnement', `L’ombre de ${who} occupe la fin de l’ombre de l’immeuble : il faut retirer sa longueur.`),
      mc(clean(Sb + s), 'mc:ajout-au-lieu-retrait', 'raisonnement', `Les deux ombres se terminent au même point : ${who} se tient dans l’ombre de l’immeuble, il faut retirer la longueur de sa propre ombre.`),
    ] }),
    numeric(Sb2, { prompt: `Plus tard, l’ombre de ${who} mesure ${fr(s2)} m. Quelle est alors la longueur de l’ombre de l’immeuble ? (en m)`, unit: 'm', unitOptional: true, misconceptions: [
      mc(clean(Sb + s2 - s), 'mc:modele-additif', 'notion', 'Les ombres ne s’allongent pas toutes de la même longueur : elles restent proportionnelles aux hauteurs.'),
      mc(clean((s2 * tm) / Hb), 'mc:rapport-inverse', 'raisonnement', 'L’immeuble est bien plus haut que la personne : son ombre est plus longue, pas plus courte.'),
    ] }),
  ], {
    prompt: `Un immeuble de ${Hb} m de haut a une ombre de ${fr(Sb)} m sur un sol horizontal. ${who}, qui mesure ${t} cm, se tient debout au soleil, tout près.`,
    hints: [`Convertis : ${t} cm = ${fr(tm)} m. Le rapport ombre ÷ hauteur est le même pour l’immeuble et pour ${who}.`, `Ce rapport vaut ${fr(Sb)} ÷ ${Hb} = ${fr(r)}.`, `Pour que les deux ombres finissent au même point, la distance au pied de l’immeuble est l’ombre de l’immeuble moins l’ombre de ${who}.`],
    solution: `Les rayons du soleil sont parallèles : ombre ÷ hauteur est constant (théorème de Thalès). Rapport : ${fr(Sb)} ÷ ${Hb} = ${fr(r)}. Ombre de ${who} : ${fr(tm)} × ${fr(r)} = ${fr(s)} m. Distance : ${fr(Sb)} − ${fr(s)} = ${fr(dist)} m. Plus tard, le rapport devient ${fr(s2)} ÷ ${fr(tm)} = ${fr(r2)}, donc l’ombre de l’immeuble mesure ${Hb} × ${fr(r2)} = ${fr(Sb2)} m.`,
    justify: { prompt: 'Explique pourquoi on peut utiliser la proportionnalité (ou le théorème de Thalès) dans cette situation.', minWords: 15, keywords: [['parallèle', 'rayons'], ['proportionnel', 'Thalès', 'rapport']], example: `Les rayons du soleil sont parallèles et les hauteurs (l’immeuble, ${who}) sont verticales sur un sol horizontal, donc les deux triangles sont des agrandissements l’un de l’autre (théorème de Thalès) : hauteur et longueur d’ombre sont proportionnelles, avec ici un rapport ombre ÷ hauteur de ${fr(r)}.` },
    expectedSeconds: 450,
  });
}
export const PROBLEMES_MATHS = [
  {
    id: 'p-moyenne-a-atteindre', subject: 'maths', label: 'Problème : la note à obtenir pour atteindre une moyenne',
    skill: 'm5.stats.moyenne', skills: ['m5.equations.modeliser'], levels: ['5e', '4e'],
    tracks: ['classe', 'approfondissement', 'expert'],
    description: 'Raisonner à l’envers à partir d’une moyenne visée ; coefficient au niveau ◆ ; au niveau ✦, décider si c’est encore possible et le justifier.',
    make(rand, o, tier) {
      const who = pick(rand, PRENOMS);
      if (tier === 'classe') {
        let notes; let target; let x;
        do { notes = [ri(rand, 6, 18), ri(rand, 6, 18), ri(rand, 6, 18)]; target = ri(rand, 10, 15); x = 4 * target - sum(notes); } while (x < 0 || x > 20);
        return problem([
          numeric(sum(notes), { prompt: 'Quelle est la somme de ses trois premières notes ?', misconceptions: [mc(clean(sum(notes) / 3), 'mc:moyenne-au-lieu-somme', 'methode', 'On demande la somme des notes, pas leur moyenne.')] }),
          numeric(4 * target, { prompt: `Quel total de points lui faut-il sur les quatre contrôles pour avoir exactement ${target} de moyenne ?`, misconceptions: [mc(3 * target, 'mc:compter-controles', 'raisonnement', 'Il y aura quatre contrôles en tout : la moyenne se calcule sur 4 notes.')] }),
          numeric(x, { prompt: 'Quelle note faut-il obtenir au quatrième contrôle ?', misconceptions: [mc(target, 'mc:viser-la-moyenne', 'raisonnement', `Avoir ${target} au dernier contrôle ne suffit pas forcément : il faut compenser les notes déjà obtenues. Compare les totaux.`)] }),
        ], {
          prompt: `${who} a eu ${notes.join(', ')} sur 20 aux trois premiers contrôles. ${who} veut obtenir exactement ${target} de moyenne après le quatrième contrôle (tous les contrôles comptent pareil).`,
          hints: ['Une moyenne de 4 notes, c’est leur somme divisée par 4.', `Pour avoir ${target} de moyenne sur 4 notes, il faut ${target} × 4 = ${4 * target} points.`, 'Note cherchée = total nécessaire − total déjà obtenu.'],
          solution: `Total actuel : ${notes.join(' + ')} = ${sum(notes)}. Total nécessaire : ${target} × 4 = ${4 * target}. Note à obtenir : ${4 * target} − ${sum(notes)} = ${x}.`,
          expectedSeconds: 240,
        });
      }
      if (tier === 'approfondissement') {
        let notes; let target; let x;
        do { notes = [ri(rand, 6, 18), ri(rand, 6, 18), ri(rand, 6, 18)]; target = ri(rand, 10, 15); x = (5 * target - sum(notes)) / 2; } while (x < 0 || x > 20 || !Number.isInteger(x * 2));
        return problem([
          numeric(5, { prompt: 'Le dernier contrôle compte double. En tout, combien de notes « comptent » dans la moyenne ?', misconceptions: [mc(4, 'mc:oubli-coefficient', 'notion', 'Une note de coefficient 2 compte comme deux notes.')] }),
          numeric(5 * target, { prompt: `Quel total de points (coefficients compris) faut-il pour avoir ${target} de moyenne ?`, misconceptions: [mc(4 * target, 'mc:oubli-coefficient', 'notion', 'Avec le coefficient 2, on divise le total par 5, pas par 4.')] }),
          numeric(x, { prompt: 'Quelle note faut-il obtenir au dernier contrôle ?', tolerance: 0.01, misconceptions: [mc(4 * target - sum(notes), 'mc:oubli-coefficient', 'notion', 'Le dernier contrôle compte double : sa note est multipliée par 2 dans le total.'), mc(5 * target - sum(notes), 'mc:oubli-diviser', 'calcul', `Ce nombre représente deux fois la note cherchée (coefficient 2) : il reste à le diviser par 2.`)] }),
        ], {
          prompt: `${who} a eu ${notes.join(', ')} sur 20 aux trois premiers contrôles. Le dernier contrôle compte double (coefficient 2). ${who} veut exactement ${target} de moyenne.`,
          hints: ['Compte les coefficients : 1 + 1 + 1 + 2.', `Total nécessaire : ${target} × 5.`, 'Total nécessaire − total actuel = 2 × (note cherchée).'],
          solution: `Coefficients : 1 + 1 + 1 + 2 = 5. Total nécessaire : ${target} × 5 = ${5 * target}. Il manque ${5 * target} − ${sum(notes)} = ${5 * target - sum(notes)} points, soit 2 × la note : note = ${fr(x)}.`,
          expectedSeconds: 300,
        });
      }
      // ✦ expert : est-ce encore possible ? sinon, quelle est la meilleure moyenne possible ?
      let notes; let target; let x;
      do { notes = [ri(rand, 5, 17), ri(rand, 5, 17), ri(rand, 5, 17), ri(rand, 5, 17)]; target = ri(rand, 12, 16); x = 5 * target - sum(notes); } while (x < 0 || x > 40 || x === 20);
      const possible = x <= 20;
      const best = clean((sum(notes) + 20) / 5);
      return problem([
        numeric(x, { prompt: `Quelle note faudrait-il au cinquième contrôle pour avoir exactement ${target} de moyenne ?`, misconceptions: [mc(4 * target - sum(notes), 'mc:compter-controles', 'raisonnement', 'Il y aura cinq notes en tout : le total nécessaire est la moyenne × 5.')] }),
        text(possible ? ['oui'] : ['non'], { prompt: 'Est-ce possible ? (oui ou non)', misconceptions: [{ answer: possible ? 'non' : 'oui', id: 'mc:note-maximale', error: 'raisonnement', feedback: 'Une note est comprise entre 0 et 20 : compare la note nécessaire à 20.' }] }),
        numeric(best, { prompt: 'Quelle est la meilleure moyenne encore possible (avec 20 au dernier contrôle) ?', tolerance: 0.01, misconceptions: [mc(clean((sum(notes) + 20) / 4), 'mc:compter-controles', 'raisonnement', 'Avec la note de 20, il y a cinq notes : on divise par 5.')] }),
      ], {
        prompt: `${who} a eu ${notes.join(', ')} sur 20 aux quatre premiers contrôles. ${who} espère finir avec ${target} de moyenne après le cinquième et dernier contrôle.`,
        hints: ['Calcule le total nécessaire pour la moyenne visée, puis ce qu’il manque.', 'Une note ne peut pas dépasser 20.', 'Meilleure moyenne : imagine une note de 20 au dernier contrôle.'],
        solution: `Total actuel : ${sum(notes)}. Total nécessaire : ${target} × 5 = ${5 * target}. Note nécessaire : ${x} — ${possible ? 'c’est possible' : 'c’est impossible, car une note ne dépasse pas 20'}. Avec 20, la moyenne serait (${sum(notes)} + 20) ÷ 5 = ${fr(best)}.`,
        justify: { prompt: 'Explique ton raisonnement en quelques phrases.', minWords: 10, keywords: ['total', '20', 'moyenne'], example: `Il faut un total de ${5 * target} points, il y en a déjà ${sum(notes)}, donc il faut ${x} sur 20 : ${possible ? 'c’est possible' : 'c’est impossible car la note maximale est 20'}.` },
        expectedSeconds: 420,
      });
    },
  },
  {
    id: 'p-abonnement-ou-tickets', subject: 'maths', label: 'Problème : abonnement ou tickets ?',
    skill: 'm5.equations.modeliser', skills: ['m4.equations.modeliser', 'm5.litteral.expression', 'm4.equations.resoudre'], levels: ['5e', '4e'],
    tracks: ALL_TRACKS,
    description: 'Comparer deux tarifs ; ◆ écrire le prix en fonction de x et trouver le seuil par une équation ; ✦ trois tarifs, deux inéquations, un choix justifié.',
    make: byTier({ classe: aboClasse, approfondissement: aboPlus, expert: aboExpert }),
  },
  {
    id: 'p-soldes-remises', subject: 'maths', label: 'Problème : soldes, remises successives ou remise unique ?',
    skill: 'm5.pourcentages', skills: ['m4.proportionnalite.quatrieme'], levels: ['5e', '4e'],
    tracks: ALL_TRACKS,
    description: 'Une remise en % contre une remise en € ; ◆ deux remises successives (les pourcentages ne s’additionnent pas) ; ✦ retrouver le prix de départ et comparer deux magasins, avec justification.',
    make: byTier({ classe: soldesClasse, approfondissement: soldesPlus, expert: soldesExpert }),
  },
  {
    id: 'p-recette-courses', subject: 'maths', label: 'Problème : adapter une recette et faire les courses',
    skill: 'm5.proportionnalite', skills: ['m5.grandeurs.conversions', 'm4.proportionnalite.quatrieme'], levels: ['5e', '4e'],
    tracks: ALL_TRACKS,
    description: 'Multiplier une recette ; ◆ passage à l’unité, litres et prix au kilo ; ✦ boîtes et bouteilles entières à acheter, coût total et justification.',
    make: byTier({ classe: recetteClasse, approfondissement: recettePlus, expert: recetteExpert }),
  },
  {
    id: 'p-peinture-carrelage', subject: 'maths', label: 'Problème : peindre ou carreler une pièce',
    skill: 'm5.grandeurs.aires', skills: ['m5.grandeurs.conversions', 'm5.calcul.division-decimale'], levels: ['5e', '4e'],
    tracks: ALL_TRACKS,
    description: 'Aire d’un mur moins une porte et nombre de pots ; ◆ sol en L, carreaux en cm, boîtes à acheter ; ✦ quatre murs, deux couches, dépense minimale et justification.',
    make: byTier({ classe: peintureClasse, approfondissement: carrelagePlus, expert: peintureExpert }),
  },
  {
    id: 'p-pythagore-echelle-ecran', subject: 'maths', label: 'Problème : l’échelle contre le mur, la diagonale d’un écran',
    skill: 'm4.pythagore.calcul', skills: ['m4.racines.utiliser', 'm4.cosinus.angle'], levels: ['4e'],
    tracks: ALL_TRACKS,
    description: 'Hauteur atteinte par une échelle (Pythagore) ; ◆ diagonale d’un écran, arrondi et conversion en pouces ; ✦ l’échelle est-elle sûre ? (Pythagore et cosinus, justification).',
    make: byTier({ classe: echelleClasse, approfondissement: ecranPlus, expert: echelleExpert }),
  },
  {
    id: 'p-hauteur-par-ombre', subject: 'maths', label: 'Problème : la hauteur d’un arbre ou d’un immeuble par son ombre',
    skill: 'm4.thales.calcul', skills: ['m4.proportionnalite.quatrieme', 'm5.grandeurs.conversions'], levels: ['4e'],
    tracks: ALL_TRACKS,
    description: 'Ombres et hauteurs proportionnelles ; ◆ configuration de Thalès avec une personne et des cm ; ✦ où se placer, ombres qui changent, et pourquoi Thalès s’applique.',
    make: byTier({ classe: ombreClasse, approfondissement: ombrePlus, expert: ombreExpert }),
  },
];
