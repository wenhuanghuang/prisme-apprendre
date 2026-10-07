/**
 * Niveaux ◆ approfondissement et ✦ expert des générateurs de grandeurs (proportionnalité, pourcentages).
 * Chaque fonction reçoit (rand, options) et renvoie un exercice comme `make`.
 * ◆ : conversions, plusieurs opérations, question posée à l'envers ; ✦ : plusieurs étapes, cas piège,
 * conclusion à donner (oui / non, matériau…). Toutes les idées fausses sont calculées avec les nombres tirés.
 */
import { ri, pick, sample, clean, fr, mc, text, problem } from './gen-util.js';
import { prenom, round, isRound, eur, cap, de, choice, num, yesNo, tableFig } from './tiers-outils.js';

/* ======================================================================= */
/*                            Proportionnalité                             */
/* ======================================================================= */

const DENREES = ['de cerises', 'de tomates', 'de fromage', 'de café', 'de fraises', 'de noix', 'd’abricots', 'de raisin'];
/** « le prix des cerises » */
const DU = { 'de cerises': 'des cerises', 'de tomates': 'des tomates', 'de fromage': 'du fromage', 'de café': 'du café', 'de fraises': 'des fraises', 'de noix': 'des noix', 'd’abricots': 'des abricots', 'de raisin': 'du raisin' };

/** ◆ Prix au kilogramme avec des masses en g et en kg. */
function propPrixMasse(rand) {
  let u; let m1; let p1;
  do {
    u = pick(rand, [2.4, 3.2, 3.6, 4.8, 5.6, 6.4, 7.2, 8.5, 9.6, 12.8, 14, 18.5]);
    m1 = pick(rand, [250, 300, 400, 600, 750, 800, 1200, 1500]); p1 = clean((u * m1) / 1000);
  } while (!isRound(p1));
  const m2 = pick(rand, [0.5, 1.5, 2, 2.5, 3, 3.5, 4]); const kg1 = clean(m1 / 1000);
  const ans = clean(u * m2); const food = pick(rand, DENREES);
  return num(ans, {
    prompt: `Au marché, ${fr(m1)} g ${food} coûtent ${eur(p1)} €. Le prix est proportionnel à la masse. Combien coûtent ${fr(m2)} kg ${food} ?`,
    tolerance: 0.005, representation: 'concrete', expectedSeconds: 150,
    misconceptions: [
      mc(clean(p1 * m2), 'mc:oubli-unitaire', 'methode', `${fr(m2)} kg, ce n’est pas ${fr(m2)} fois ${fr(m1)} g : calcule d’abord le prix d’un kilogramme.`),
      mc(clean((p1 * m2) / m1), 'mc:unites-melangees', 'unite', `Les deux masses doivent être dans la même unité : ${fr(m2)} kg = ${fr(m2 * 1000)} g.`),
    ],
    hints: [`Mets les deux masses dans la même unité : ${fr(m1)} g = ${fr(kg1)} kg.`, `Prix d’un kilogramme : ${eur(p1)} ÷ ${fr(kg1)}.`, `Multiplie ensuite ce prix par ${fr(m2)}.`],
    solution: `${fr(m1)} g = ${fr(kg1)} kg. Prix d’un kilogramme : ${eur(p1)} ÷ ${fr(kg1)} = ${eur(u)} €. Prix de ${fr(m2)} kg : ${fr(m2)} × ${eur(u)} = ${eur(ans)} €.`,
  });
}

/** ◆ Tableau de proportionnalité à compléter (trois cases, dont une « à l’envers »). */
function propTableau(rand) {
  let u; let m1; let m2; let m3; let p1; let p2; let p3;
  do {
    u = pick(rand, [2.4, 3.2, 4.8, 5.6, 6, 7.2, 8, 9.6, 12, 15]);
    [m1, m2, m3] = sample(rand, [150, 200, 250, 300, 400, 450, 600, 750, 800, 1250, 1500, 1800, 2500], 3);
    [p1, p2, p3] = [m1, m2, m3].map((m) => clean((u * m) / 1000));
  } while (![p1, p2, p3].every((p) => isRound(p)));
  const food = pick(rand, DENREES);
  return problem([
    num(u, { prompt: 'Case (a) : prix d’un kilogramme, en € ?', tolerance: 0.005, misconceptions: [mc(clean(p1 / m1), 'mc:prix-gramme', 'unite', 'C’est le prix d’un gramme : 1 kg = 1 000 g, multiplie par 1 000.'), mc(clean(m1 / p1), 'mc:rapport-inverse', 'raisonnement', 'Ce nombre est la masse (en g) obtenue pour 1 € ; on cherche le prix d’un kilogramme : prix ÷ masse en kg.')] }),
    num(m2, { prompt: `Case (b) : quelle masse, en g, obtient-on pour ${eur(p2)} € ?`, unit: 'g', unitOptional: true, misconceptions: [mc(clean(p2 * u), 'mc:operation-inverse', 'raisonnement', `On cherche une masse à partir d’un prix : on divise le prix par le prix d’un kilogramme (${eur(u)} €).`), mc(clean(p2 / u), 'mc:conversion-oubliee', 'unite', 'Ce nombre est la masse en kg : la case demande des grammes.')] }),
    num(p3, { prompt: `Case (c) : prix de ${fr(m3)} g, en € ?`, tolerance: 0.005, misconceptions: [mc(clean(u * m3), 'mc:unites-melangees', 'unite', `${fr(m3)} g = ${fr(m3 / 1000)} kg : multiplie le prix d’un kilogramme par ${fr(m3 / 1000)}, pas par ${fr(m3)}.`), mc(clean(p1 * m3), 'mc:oubli-unitaire', 'methode', `Tu as multiplié le prix de ${fr(m1)} g par ${fr(m3)} : passe par le prix d’un kilogramme (ou d’un gramme).`)] }),
  ], {
    prompt: `Le prix ${DU[food]} est proportionnel à la masse achetée. Complète le tableau (cases a, b et c).`,
    figure: tableFig(`Tableau de proportionnalité entre la masse ${DU[food]} et le prix`, ['Masse (g)', fr(m1), fr(1000), '(b)', fr(m3)], [['Prix (€)', eur(p1), '(a)', eur(p2), '(c)']]),
    representation: 'concrete', expectedSeconds: 240,
    hints: [`Commence par la case (a) : ${fr(m1)} g = ${fr(m1 / 1000)} kg, divise le prix par cette masse.`, `Coefficient : prix = masse (en kg) × ${eur(u)}. Pour la case (b), on divise le prix par ${eur(u)}.`, 'Vérifie chaque case : le quotient prix ÷ masse doit être le même partout.'],
    solution: `(a) ${eur(p1)} ÷ ${fr(m1 / 1000)} = ${eur(u)} € le kilogramme. (b) ${eur(p2)} ÷ ${eur(u)} = ${fr(m2 / 1000)} kg = ${fr(m2)} g. (c) ${fr(m3 / 1000)} × ${eur(u)} = ${eur(p3)} €.`,
  });
}

/** ◆ Recette : litres → centilitres. */
function propRecetteLitres(rand) {
  const per = pick(rand, [0.05, 0.075, 0.1, 0.125, 0.15, 0.2, 0.25]);
  const n1 = pick(rand, [2, 4, 6, 8]); const n2 = pick(rand, [3, 5, 10, 12, 14, 15].filter((n) => n !== n1));
  const v1 = clean(per * n1); const ans = clean(per * n2 * 100); const liq = pick(rand, ['de lait', 'de crème liquide', 'de bouillon', 'de jus d’orange']);
  return num(ans, {
    prompt: `Pour ${n1} personnes, une recette demande ${fr(v1)} L ${liq}. Quelle quantité ${liq}, en cL, faut-il pour ${n2} personnes ?`,
    unit: 'cL', unitOptional: true, strictUnit: true, tolerance: 0.005, representation: 'concrete', expectedSeconds: 150,
    misconceptions: [
      mc(clean(per * n2), 'mc:conversion-oubliee', 'unite', 'Ce nombre est la quantité en litres : 1 L = 100 cL.'),
      mc(clean(v1 * 100 + (n2 - n1)), 'mc:modele-additif', 'raisonnement', `Ajouter ${Math.abs(n2 - n1)} (la différence du nombre de personnes) ne respecte pas la proportionnalité : il faut multiplier.`),
      mc(clean(v1 * n2 * 100), 'mc:oubli-unitaire', 'methode', `Tu as multiplié la quantité pour ${n1} personnes par ${n2} : cherche d’abord la quantité pour une personne.`),
    ],
    hints: [`Convertis : ${fr(v1)} L = ${fr(v1 * 100)} cL.`, `Pour une personne : ${fr(v1 * 100)} ÷ ${n1} cL.`, `Puis multiplie par ${n2}.`],
    solution: `${fr(v1)} L = ${fr(v1 * 100)} cL. Pour une personne : ${fr(v1 * 100)} ÷ ${n1} = ${fr(per * 100)} cL. Pour ${n2} personnes : ${n2} × ${fr(per * 100)} = ${fr(ans)} cL.`,
  });
}

/** ◆ Recette à l’envers : combien de personnes avec la farine disponible (kg) ? */
function propRecetteEnvers(rand) {
  const per = pick(rand, [40, 50, 60, 75, 80, 125, 150]); const n1 = pick(rand, [4, 6, 8]);
  const n2 = pick(rand, [10, 12, 15, 16, 20, 24, 30]); const m1 = per * n1; const stock = clean((per * n2) / 1000);
  const who = prenom(rand);
  return num(n2, {
    prompt: `Une recette pour ${n1} personnes demande ${m1} g de farine. ${who} a ${fr(stock)} kg de farine. Pour combien de personnes peut-on préparer la recette en utilisant toute cette farine ?`,
    representation: 'concrete', expectedSeconds: 150,
    misconceptions: [
      mc(clean(stock / per), 'mc:unites-melangees', 'unite', `Convertis d’abord la farine en grammes : ${fr(stock)} kg = ${fr(stock * 1000)} g.`),
      mc(clean(n2 / n1), 'mc:nombre-de-recettes', 'methode', `Ce nombre indique combien de fois on peut faire la recette pour ${n1} personnes : multiplie-le par ${n1}.`),
      mc(clean((stock * 1000 * n1) / per), 'mc:rapport-inverse', 'raisonnement', 'Vérifie le sens du calcul : on divise la farine disponible par la farine pour une personne.'),
    ],
    hints: [`${fr(stock)} kg = ${fr(stock * 1000)} g.`, `Farine pour une personne : ${m1} ÷ ${n1} = ${per} g.`, `Nombre de personnes : ${fr(stock * 1000)} ÷ ${per}.`],
    solution: `${fr(stock)} kg = ${fr(stock * 1000)} g. Pour une personne : ${m1} ÷ ${n1} = ${per} g. Nombre de personnes : ${fr(stock * 1000)} ÷ ${per} = ${n2}.`,
  });
}

/** ◆ Autonomie d'une voiture (question à l’envers). */
function propAutonomie(rand) {
  let cons; let tank; let ans;
  do { cons = pick(rand, [4.5, 5, 5.5, 6, 6.4, 7.5, 8]); tank = pick(rand, [36, 40, 45, 48, 50, 54, 60]); ans = clean((tank / cons) * 100); } while (!isRound(ans, 0));
  return num(ans, {
    prompt: `Une voiture consomme ${fr(cons)} L de carburant aux 100 km. Son réservoir contient ${tank} L. Quelle distance peut-elle parcourir avec un plein ?`,
    unit: 'km', unitOptional: true, representation: 'concrete', expectedSeconds: 150,
    misconceptions: [
      mc(clean(tank / cons), 'mc:oubli-cent-km', 'methode', `${fr(tank / cons)} est le nombre de fois « 100 km » : multiplie par 100.`),
      mc(clean((tank * cons) / 100), 'mc:rapport-inverse', 'raisonnement', 'Plus le réservoir est grand, plus on va loin : on divise la quantité de carburant par la consommation.'),
      mc(clean(tank * cons), 'mc:rapport-inverse', 'raisonnement', 'On ne multiplie pas les litres du réservoir par la consommation : cherche combien de fois le réservoir contient la consommation pour 100 km.'),
    ],
    hints: [`Avec ${fr(cons)} L, on parcourt 100 km.`, `Combien de fois ${fr(cons)} L dans ${tank} L ? ${tank} ÷ ${fr(cons)}.`, 'Multiplie ce nombre par 100 km.'],
    solution: `${tank} ÷ ${fr(cons)} = ${fr(tank / cons)} ; ${fr(tank / cons)} × 100 = ${fr(ans)} km.`,
  });
}

/** ◆ Carburant consommé puis coût du trajet. */
function propCoutTrajet(rand) {
  const cons = pick(rand, [4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8]); const d = pick(rand, [120, 240, 250, 320, 360, 450, 480, 640]);
  const prix = pick(rand, [1.7, 1.75, 1.8, 1.85, 1.9, 1.95]); const L = clean((cons * d) / 100); const cost = round(L * prix, 2);
  return problem([
    num(L, { prompt: 'Combien de litres de carburant faut-il pour ce trajet ?', unit: 'L', unitOptional: true, misconceptions: [mc(clean(cons * d), 'mc:oubli-cent-km', 'methode', `La consommation est donnée pour 100 km : ${d} km, c’est ${fr(d / 100)} fois 100 km.`), mc(clean(cons + (d - 100)), 'mc:modele-additif', 'raisonnement', 'On ne peut pas ajouter des kilomètres à des litres : il faut multiplier.')] }),
    num(cost, { prompt: 'Combien coûte ce carburant (arrondi au centime) ?', tolerance: 0.01, misconceptions: [mc(round(d * prix, 2), 'mc:prix-par-km', 'lecture', 'Le prix est donné par litre, pas par kilomètre : multiplie le nombre de litres par le prix d’un litre.'), mc(round(cons * prix, 2), 'mc:cout-100km', 'methode', `C’est le coût pour 100 km seulement ; le trajet fait ${d} km.`)] }),
  ], {
    prompt: `Une voiture consomme ${fr(cons)} L aux 100 km. Le carburant coûte ${eur(prix)} € le litre. On fait un trajet de ${d} km.`,
    representation: 'concrete', expectedSeconds: 240,
    hints: [`${d} km = ${fr(d / 100)} × 100 km.`, `Litres : ${fr(cons)} × ${fr(d / 100)}.`, `Coût : nombre de litres × ${eur(prix)} €.`],
    solution: `Carburant : ${fr(cons)} × ${d} ÷ 100 = ${fr(L)} L. Coût : ${fr(L)} × ${eur(prix)} ${isRound(L * prix, 2) ? '=' : `= ${fr(L * prix)} ≈`} ${eur(cost)} €.`,
  });
}

/** ✦ Formule avec carte : situation NON proportionnelle, seuil de rentabilité. */
function propAbonnement(rand) {
  const [lieu, unite, plur, sing] = pick(rand, [['À la piscine', 'l’entrée', 'entrées', 'entrée'], ['Au cinéma', 'la séance', 'séances', 'séance'], ['À la salle d’escalade', 'la séance', 'séances', 'séance'], ['À la patinoire', 'l’entrée', 'entrées', 'entrée']]);
  let pa; let pb; let fee;
  do { pa = pick(rand, [4, 4.5, 5, 6, 6.5, 7, 8]); pb = pick(rand, [1.5, 2, 2.5, 3, 3.5, 4]); fee = pick(rand, [15, 18, 20, 24, 25, 30, 36, 40]); } while (pb > pa - 1);
  const n = ri(rand, 6, 20); const costB = clean(fee + pb * n);
  const s = clean(fee / (pa - pb)); const first = Number.isInteger(s) ? s + 1 : Math.ceil(s);
  const tie = Number.isInteger(s);
  return problem([
    num(costB, { prompt: `Avec la formule B, combien coûtent ${n} ${plur} ?`, tolerance: 0.005, misconceptions: [mc(clean(pb * n), 'mc:oubli-fixe', 'methode', `N’oublie pas le prix de la carte (${fee} €), payé une seule fois.`), mc(clean((fee + pb) * n), 'mc:fixe-repete', 'raisonnement', `La carte se paie une seule fois, pas à chaque ${sing}.`)] }),
    yesNo(false, `Avec la formule B, le prix payé est-il proportionnel au nombre ${de(plur)} ? (oui ou non)`, 'mc:affine-proportionnel', 'notion', `Avec 0 ${sing}, on paie déjà ${fee} € : le prix ne double pas quand le nombre ${de(plur)} double. Ce n’est pas une situation de proportionnalité.`),
    num(first, { prompt: `À partir de combien ${de(plur)} la formule B devient-elle strictement moins chère que la formule A ?`, misconceptions: [tie ? mc(s, 'mc:egalite-stricte', 'raisonnement', `Pour ${s} ${plur}, les deux formules coûtent exactement le même prix : il en faut une de plus pour que B soit moins chère.`) : mc(Math.floor(s), 'mc:arrondi-par-defaut', 'raisonnement', `Pour ${Math.floor(s)} ${plur}, la formule B coûte encore ${eur(fee + pb * Math.floor(s))} € contre ${eur(pa * Math.floor(s))} € pour A.`), mc(Math.ceil(fee / pb), 'mc:ecart-oublie', 'methode', `Chaque ${sing} fait économiser ${eur(pa - pb)} € avec B : c’est cet écart qui « rembourse » la carte, et non le prix payé à chaque ${sing} avec B.`)] }),
  ], {
    prompt: `${lieu}, deux formules : formule A, ${eur(pa)} € ${unite} ; formule B, une carte de ${fee} € pour l’année, puis ${eur(pb)} € ${unite}.`,
    representation: 'concrete', expectedSeconds: 360,
    hints: [`Formule B : prix de la carte + prix de toutes les ${plur}.`, `Combien paie-t-on pour 0 ${sing} avec chaque formule ?`, `Avec B, chaque ${sing} coûte ${eur(pa - pb)} € de moins : combien ${de(plur)} faut-il pour compenser les ${fee} € de la carte ?`],
    solution: `B pour ${n} ${plur} : ${fee} + ${n} × ${eur(pb)} = ${eur(costB)} €. Ce n’est pas proportionnel : 0 ${sing} coûte déjà ${fee} €. Économie par ${sing} avec B : ${eur(pa)} − ${eur(pb)} = ${eur(pa - pb)} € ; ${fee} ÷ ${eur(pa - pb)} ${tie ? '=' : '≈'} ${fr(round(s, 2))}${tie ? ` (égalité pour ${s} ${plur})` : ''}. B est strictement moins chère à partir de ${first} ${plur} : ${eur(fee + pb * first)} € contre ${eur(pa * first)} €.`,
  });
}

/** ✦ Comparer deux offres au prix du kilogramme (l’offre la moins chère à payer n’est pas toujours la meilleure). */
function propOffres(rand) {
  const [prod, deProd] = pick(rand, [['pâtes', 'des pâtes'], ['riz', 'du riz'], ['café', 'du café'], ['farine', 'de la farine'], ['croquettes', 'des croquettes']]);
  let k; let q; let Q; let uA; let uB; let pA; let pB;
  do {
    k = pick(rand, [2, 3, 4]); q = pick(rand, [250, 400, 500, 750]); Q = pick(rand, [1.5, 2, 2.5, 3, 5]);
    uA = pick(rand, [1.6, 2, 2.4, 2.8, 3.2, 3.6, 4, 4.8, 6, 8.4, 9.6]); uB = pick(rand, [1.8, 2.2, 2.6, 3, 3.4, 4.2, 5, 7.6, 9]);
    pA = clean((uA * k * q) / 1000); pB = clean(uB * Q);
  } while (!isRound(pA) || !isRound(pB) || Math.abs(uA - uB) < 0.15 || Math.abs(uA - uB) > 3);
  const best = uA < uB ? 'A' : 'B'; const other = best === 'A' ? 'B' : 'A';
  const cheaperTotal = pA < pB ? 'A' : 'B';
  const accept = (L) => [L, `offre ${L}`, `l’offre ${L}`, `lot ${L}`, `le lot ${L}`];
  return problem([
    num(uA, { prompt: 'Prix d’un kilogramme avec l’offre A, en € ?', tolerance: 0.005, misconceptions: [mc(clean(pA / k), 'mc:prix-paquet', 'lecture', `C’est le prix d’un paquet de ${q} g, pas d’un kilogramme.`), mc(clean(pA / (k * q)), 'mc:prix-gramme', 'unite', 'C’est le prix d’un gramme : multiplie par 1 000.')] }),
    num(uB, { prompt: 'Prix d’un kilogramme avec l’offre B, en € ?', tolerance: 0.005, misconceptions: [mc(clean(pB * Q), 'mc:operation-inverse', 'raisonnement', `Pour ${fr(Q)} kg on paie ${eur(pB)} € : pour 1 kg, on divise par ${fr(Q)}.`), mc(pB, 'mc:prix-total', 'lecture', `${eur(pB)} € est le prix des ${fr(Q)} kg, pas d’un seul kilogramme.`)] }),
    text(accept(best), { prompt: 'Quelle offre est la plus avantageuse ? (A ou B)', misconceptions: [mc(other, 'mc:prix-unitaire', 'raisonnement', cheaperTotal === other ? `L’offre ${other} est la moins chère à payer, mais on n’achète pas la même quantité : compare le prix d’un kilogramme.` : 'L’offre la plus avantageuse est celle dont le prix d’un kilogramme est le plus bas.')] }),
  ], {
    prompt: `Pour acheter ${deProd} : offre A, ${k} paquets de ${q} g pour ${eur(pA)} € ; offre B, un sac de ${fr(Q)} kg pour ${eur(pB)} €.`,
    representation: 'concrete', expectedSeconds: 300,
    hints: [`Offre A : ${k} × ${q} g = ${fr(k * q)} g = ${fr((k * q) / 1000)} kg.`, 'Prix d’un kilogramme = prix payé ÷ masse en kg.', 'Compare les deux prix au kilogramme, pas les prix payés.'],
    solution: `A : ${fr((k * q) / 1000)} kg pour ${eur(pA)} €, soit ${eur(pA)} ÷ ${fr((k * q) / 1000)} = ${eur(uA)} € le kg. B : ${eur(pB)} ÷ ${fr(Q)} = ${eur(uB)} € le kg. L’offre ${best} est la plus avantageuse (${eur(Math.min(uA, uB))} € le kg).`,
  });
}

/** ✦ L’ingrédient qui limite la recette (deux proportionnalités, puis le plus petit des deux). */
function propIngredientLimitant(rand) {
  const n1 = pick(rand, [4, 6, 8]); const f = pick(rand, [40, 50, 60, 75]); const e = pick(rand, [2, 3, 4, 5]);
  const k = ri(rand, 2, 4); const pE = k * n1; const eggs = k * e;
  let pF; do { pF = pick(rand, [12, 15, 16, 18, 20, 24, 25, 30, 32]); } while (pF === pE);
  const flour = clean((pF * f) / 1000); const max = Math.min(pF, pE); const who = prenom(rand);
  const eggsLimit = pE < pF;
  const egg = ['les œufs', 'œufs', 'les oeufs', 'oeufs', 'œuf', 'oeuf']; const far = ['la farine', 'farine'];
  return problem([
    num(pF, { prompt: 'Pour combien de personnes la farine suffit-elle ?', misconceptions: [mc(clean(flour / f), 'mc:unites-melangees', 'unite', `Convertis la farine en grammes : ${fr(flour)} kg = ${fr(flour * 1000)} g.`), mc(clean(pF / n1), 'mc:nombre-de-recettes', 'methode', `Tu as trouvé combien de fois on peut faire la recette pour ${n1} personnes : multiplie par ${n1}.`)] }),
    num(pE, { prompt: 'Pour combien de personnes les œufs suffisent-ils ?', misconceptions: [mc(k, 'mc:nombre-de-recettes', 'methode', `${eggs} œufs permettent de faire ${k} fois la recette pour ${n1} personnes, soit ${k} × ${n1} personnes.`), mc(clean((eggs * e) / n1), 'mc:rapport-inverse', 'raisonnement', `Il faut ${e} œufs pour ${n1} personnes : divise le nombre d’œufs par ${e}, puis multiplie par ${n1}.`)] }),
    num(max, { prompt: 'Pour combien de personnes au maximum peut-on préparer la recette ?', misconceptions: [mc(Math.max(pF, pE), 'mc:ingredient-limitant', 'raisonnement', 'Il faut assez de chaque ingrédient : c’est celui qui s’épuise le premier qui fixe le maximum (le plus petit des deux nombres).'), mc(pF + pE, 'mc:addition-ingredients', 'raisonnement', 'On ne cumule pas les personnes : chaque personne a besoin de farine ET d’œufs.')] }),
    text(eggsLimit ? egg : far, { prompt: 'Quel ingrédient limite la recette ? (la farine ou les œufs)', misconceptions: [mc(eggsLimit ? 'la farine' : 'les œufs', 'mc:ingredient-limitant', 'raisonnement', 'L’ingrédient qui limite est celui qui permet de servir le MOINS de personnes.')] }),
  ], {
    prompt: `Une recette de crêpes pour ${n1} personnes demande ${f * n1} g de farine et ${e} œufs. ${who} dispose de ${fr(flour)} kg de farine et de ${eggs} œufs (et du reste en quantité suffisante).`,
    representation: 'concrete', expectedSeconds: 360,
    hints: [`Farine : ${f * n1} g pour ${n1} personnes, soit ${f} g par personne ; ${fr(flour)} kg = ${fr(flour * 1000)} g.`, `Œufs : ${e} œufs pour ${n1} personnes ; ${eggs} œufs, c’est ${k} fois plus.`, 'Le nombre maximal de personnes est le plus petit des deux résultats.'],
    solution: `Farine : ${fr(flour * 1000)} ÷ ${f} = ${pF} personnes. Œufs : ${eggs} ÷ ${e} = ${k} recettes, soit ${k} × ${n1} = ${pE} personnes. Maximum : ${max} personnes ; ${eggsLimit ? 'les œufs' : 'la farine'} limite${eggsLimit ? 'nt' : ''} la recette.`,
  });
}

/** ✦ Consommation moyenne sur un trajet en deux parties (piège : moyenne des consommations). */
function propConsoMoyenne(rand) {
  let d1; let d2; let c1; let c2; let L; let avg;
  do {
    d1 = pick(rand, [40, 60, 80, 100, 120, 150, 180]); d2 = pick(rand, [100, 150, 200, 250, 300, 350, 400]);
    c1 = pick(rand, [6.5, 7, 7.5, 8, 8.5, 9]); c2 = pick(rand, [4.5, 5, 5.5, 6]);
    L = clean((c1 * d1 + c2 * d2) / 100); avg = (L * 100) / (d1 + d2);
  } while (d1 === d2 || Math.abs(avg - (c1 + c2) / 2) < 0.2);
  const A = round(avg, 1); const Lv = clean((c1 * d1) / 100);
  return problem([
    num(Lv, { prompt: 'Combien de litres la voiture consomme-t-elle en ville ?', unit: 'L', unitOptional: true, misconceptions: [mc(clean(c1 * d1), 'mc:oubli-cent-km', 'methode', `La consommation est donnée pour 100 km : ${d1} km, c’est ${fr(d1 / 100)} fois 100 km.`)] }),
    num(L, { prompt: 'Combien de litres consomme-t-elle sur l’ensemble du trajet ?', unit: 'L', unitOptional: true, misconceptions: [mc(clean(c1 + c2), 'mc:taux-additionnes', 'raisonnement', 'On n’additionne pas des consommations aux 100 km : calcule les litres de chaque partie, puis additionne-les.'), mc(clean((((c1 + c2) / 2) * (d1 + d2)) / 100), 'mc:moyenne-des-taux', 'raisonnement', 'Les deux parties n’ont pas la même longueur : calcule séparément les litres de chaque partie.')] }),
    num(A, { prompt: 'Quelle est la consommation moyenne sur le trajet, en L pour 100 km (arrondie au dixième) ?', round: 1, tolerance: 0.051, misconceptions: [mc(clean((c1 + c2) / 2), 'mc:moyenne-des-taux', 'raisonnement', `La moyenne de ${fr(c1)} et ${fr(c2)} ne convient pas : on roule ${d1} km en ville et ${d2} km sur route, pas la même distance.`), mc(round(L / (d1 + d2), 3), 'mc:oubli-cent-km', 'methode', 'Ce nombre est la consommation pour 1 km : multiplie par 100.')] }),
  ], {
    prompt: `Une voiture parcourt ${d1} km en ville, où elle consomme ${fr(c1)} L aux 100 km, puis ${d2} km sur route, où elle consomme ${fr(c2)} L aux 100 km.`,
    representation: 'concrete', expectedSeconds: 360,
    hints: ['Calcule les litres consommés dans chaque partie (consommation × distance ÷ 100).', `Distance totale : ${d1} + ${d2} = ${d1 + d2} km.`, 'Consommation moyenne = litres consommés ÷ distance totale × 100.'],
    solution: `Ville : ${fr(c1)} × ${d1} ÷ 100 = ${fr(Lv)} L. Route : ${fr(c2)} × ${d2} ÷ 100 = ${fr(clean((c2 * d2) / 100))} L. Total : ${fr(L)} L pour ${d1 + d2} km, soit ${fr(L)} ÷ ${d1 + d2} × 100 ≈ ${fr(A)} L aux 100 km — et non ${fr((c1 + c2) / 2)} L : la partie la plus longue pèse davantage.`,
    justify: { prompt: 'Explique pourquoi la consommation moyenne n’est pas la moyenne des deux consommations.', minWords: 10, keywords: [['distance', 'kilomètres', 'plus long', 'longueur']], example: `On ne roule pas la même distance dans les deux parties : les ${Math.max(d1, d2)} km pèsent plus que les ${Math.min(d1, d2)} km, donc on divise le total des litres par la distance totale.` },
  });
}

/* ======================================================================= */
/*                              Pourcentages                               */
/* ======================================================================= */

const ARTICLES = ['un vélo', 'une console de jeux', 'un manteau', 'un casque audio', 'une paire de baskets', 'une trottinette', 'un sac à dos', 'une tablette'];
const ABONNEMENTS = ['un abonnement de téléphone', 'un abonnement de bus', 'la cotisation d’un club de sport', 'une place de concert', 'un forfait de ski', 'un abonnement de streaming'];
const POPS = [
  { lieu: 'Dans un collège', noms: 'élèves', verbe: 'viennent à vélo' },
  { lieu: 'Dans un club de sport', noms: 'adhérents', verbe: 'font de la compétition' },
  { lieu: 'Dans un village', noms: 'habitants', verbe: 'ont plus de 60 ans' },
  { lieu: 'Dans une médiathèque', noms: 'livres', verbe: 'sont des bandes dessinées' },
  { lieu: 'Lors d’un festival', noms: 'spectateurs', verbe: 'sont venus en train' },
];
const PRIX = [24, 32, 36, 40, 45, 48, 60, 64, 75, 80, 90, 120, 150, 180, 240, 250, 320];

/** ◆ Retrouver le total à partir d’une part et de son pourcentage. */
function pctTotal(rand) {
  const c = pick(rand, POPS); let p; let total;
  do { p = pick(rand, [4, 5, 8, 12, 15, 16, 24, 25, 35, 45, 60, 65]); total = 50 * ri(rand, 4, 30); } while (!Number.isInteger((total * p) / 100));
  const part = (total * p) / 100;
  return num(total, {
    prompt: `${c.lieu}, ${fr(part)} ${c.noms} ${c.verbe}, soit ${p} % de l’ensemble des ${c.noms}. Combien y a-t-il ${de(c.noms)} en tout ?`,
    representation: 'concrete', expectedSeconds: 120,
    misconceptions: [
      mc(clean((part * p) / 100), 'mc:pourcentage-mauvais-total', 'raisonnement', `Les ${p} % se calculent sur le total (inconnu), pas sur ${fr(part)} : cherche le nombre dont ${p} % valent ${fr(part)}.`),
      mc(clean(part / p), 'mc:oubli-cent', 'calcul', `${fr(part / p)}, c’est 1 % du total : le total, c’est 100 %.`),
      mc(total - part, 'mc:complement', 'lecture', `Ce nombre correspond aux ${100 - p} % restants : le total (100 %) comprend aussi les ${fr(part)} ${c.noms} de l’énoncé.`),
    ],
    hints: [`${p} % du total valent ${fr(part)}. Combien vaut 1 % du total ?`, `1 % du total : ${fr(part)} ÷ ${p} = ${fr(part / p)}.`, 'Le total correspond à 100 %.'],
    solution: `1 % du total : ${fr(part)} ÷ ${p} = ${fr(part / p)}. Total (100 %) : ${fr(part / p)} × 100 = ${fr(total)}. Vérification : ${fr(total)} × ${p} ÷ 100 = ${fr(part)}.`,
  });
}

/** ◆ Calculer un pourcentage (taux décimal). */
function pctTaux(rand) {
  const c = pick(rand, POPS); let p; let total;
  do { total = pick(rand, [40, 80, 120, 160, 200, 240, 250, 320, 400, 500, 640, 800]); p = pick(rand, [2.5, 7.5, 12.5, 15, 22.5, 32.5, 35, 37.5, 45, 55, 62.5, 85]); } while (!Number.isInteger((total * p) / 100));
  const part = (total * p) / 100;
  return num(p, {
    prompt: `${c.lieu}, ${fr(part)} des ${fr(total)} ${c.noms} ${c.verbe}. Quel pourcentage des ${c.noms} cela représente-t-il ?`,
    representation: 'concrete', expectedSeconds: 120,
    misconceptions: [
      mc(clean(part / total), 'mc:oubli-cent', 'calcul', `${fr(part / total)} est la proportion : pour l’écrire en pourcentage, on la multiplie par 100.`),
      mc(clean((total / part) * 100), 'mc:rapport-inverse', 'raisonnement', `On divise la partie (${fr(part)}) par le total (${fr(total)}), pas l’inverse.`),
    ],
    hints: ['Un pourcentage compare une partie au total, ramené à 100.', `Calcule ${fr(part)} ÷ ${fr(total)}, puis multiplie par 100.`],
    solution: `${fr(part)} ÷ ${fr(total)} = ${fr(part / total)}, soit ${fr(p)} %. Vérification : ${fr(total)} × ${fr(p)} ÷ 100 = ${fr(part)}.`,
  });
}

function drawEvolution(rand, up, rates) {
  let P0; let p; let P1;
  do { P0 = pick(rand, PRIX); p = pick(rand, rates); P1 = clean(P0 * (1 + (up ? p : -p) / 100)); } while (!isRound(P1) || P0 === 100);
  return { P0, p, P1, k: clean(1 + (up ? p : -p) / 100) };
}

/** ◆ Retrouver le prix de départ après une réduction ou une hausse. */
function pctDepart(rand, up) {
  const item = pick(rand, up ? ABONNEMENTS : ARTICLES);
  const { P0, p, P1, k } = drawEvolution(rand, up, [5, 10, 15, 20, 25, 30, 35, 40, 60]);
  const kInv = clean(1 + (up ? -p : p) / 100); const word = up ? 'la hausse' : 'la réduction';
  return num(P0, {
    prompt: up ? `Après une hausse de ${p} %, ${item} coûte ${eur(P1)} €. Quel était son prix avant la hausse ?` : `Pendant les soldes, ${item} coûte ${eur(P1)} € après une réduction de ${p} %. Quel était son prix avant la réduction ?`,
    tolerance: 0.005, representation: 'concrete', expectedSeconds: 150,
    misconceptions: [
      mc(clean(P1 * kInv), 'mc:reciproque-pourcentage', 'raisonnement', `${up ? 'Retirer' : 'Ajouter'} ${p} % au nouveau prix ne redonne pas le prix de départ : les ${p} % ont été calculés sur le prix de départ, pas sur ${eur(P1)} €.`),
      mc(clean(up ? P1 - p : P1 + p), 'mc:soustraire-p', 'notion', `${p} % ne valent pas ${p} € : un pourcentage est une proportion d’un prix.`),
      mc(clean(P1 * k), 'mc:sens-coefficient', 'methode', `Tu as appliqué ${word} une seconde fois : ici, on connaît le prix APRÈS ${word} et on cherche le prix AVANT.`),
    ],
    hints: [`Le nouveau prix représente ${100 + (up ? p : -p)} % du prix de départ.`, `Prix de départ × ${fr(k)} = ${eur(P1)}.`, `Pour retrouver le prix de départ, on divise : ${eur(P1)} ÷ ${fr(k)}.`],
    solution: `${up ? 'Une hausse' : 'Une réduction'} de ${p} % revient à multiplier par ${fr(k)}. Prix de départ × ${fr(k)} = ${eur(P1)}, donc prix de départ = ${eur(P1)} ÷ ${fr(k)} = ${eur(P0)} €. Vérification : ${eur(P0)} × ${fr(k)} = ${eur(P1)} €.`,
  });
}

/** ◆ Trouver le pourcentage d’évolution. */
function pctTauxEvolution(rand, up) {
  const item = pick(rand, up ? ABONNEMENTS : ARTICLES);
  const { P0, p, P1 } = drawEvolution(rand, up, [5, 10, 12, 15, 20, 25, 30, 35, 40, 60]);
  const diff = clean(Math.abs(P1 - P0));
  return num(p, {
    prompt: `Le prix ${de(item)} passe de ${eur(P0)} € à ${eur(P1)} €. Quel est le pourcentage ${up ? 'd’augmentation' : 'de réduction'} ?`,
    tolerance: 0.05, representation: 'concrete', expectedSeconds: 150,
    misconceptions: [
      mc(diff, 'mc:difference-euros', 'notion', `L’écart est de ${eur(diff)} € ; pour obtenir un pourcentage, on le compare au prix de départ : ${eur(diff)} ÷ ${eur(P0)}.`),
      mc(round((diff / P1) * 100, 1), 'mc:mauvaise-reference', 'raisonnement', `Un pourcentage d’évolution se calcule par rapport au prix de départ (${eur(P0)} €), pas au nouveau prix.`),
      mc(clean((P1 / P0) * 100), up ? 'mc:coefficient-pourcentage' : 'mc:pourcentage-restant', 'methode', up ? `Le nouveau prix vaut ${fr(100 + p)} % de l’ancien : l’augmentation, c’est ce qui dépasse 100 %.` : `Le nouveau prix vaut ${fr(100 - p)} % de l’ancien : la réduction, c’est ce qui manque pour atteindre 100 %.`),
    ],
    hints: [`Calcule d’abord ${up ? 'l’augmentation' : 'la réduction'} en euros.`, `Compare-la au prix de départ : ${eur(diff)} ÷ ${eur(P0)}.`, 'Multiplie le résultat par 100 pour obtenir un pourcentage.'],
    solution: `${up ? 'Augmentation' : 'Réduction'} : ${eur(diff)} €. ${eur(diff)} ÷ ${eur(P0)} = ${fr(p / 100)}, soit ${p} %.`,
  });
}

/** ✦ Deux évolutions successives dans le même sens (piège : additionner les pourcentages). */
function pctSuccessifs(rand, up) {
  const item = pick(rand, up ? ABONNEMENTS : ARTICLES); const s = up ? 1 : -1;
  let P0; let p1; let p2; let P1; let P2;
  do {
    P0 = pick(rand, [40, 50, 60, 80, 120, 150, 200, 250, 300, 400, 500]);
    [p1, p2] = sample(rand, up ? [5, 10, 15, 20, 25, 30, 50] : [10, 15, 20, 25, 30, 40, 50], 2);
    P1 = clean(P0 * (1 + (s * p1) / 100)); P2 = clean(P1 * (1 + (s * p2) / 100));
  } while (!isRound(P1) || !isRound(P2));
  const k1 = clean(1 + (s * p1) / 100); const k2 = clean(1 + (s * p2) / 100); const g = clean(Math.abs(k1 * k2 - 1) * 100);
  return problem([
    num(P1, { prompt: `Prix après ${up ? 'la première hausse' : 'la première réduction'}, en € ?`, tolerance: 0.005, misconceptions: [mc(clean(P0 + s * p1), 'mc:soustraire-p', 'notion', `${p1} % de ${eur(P0)} € ne valent pas ${p1} € : calcule ${eur(P0)} × ${p1} ÷ 100.`)] }),
    num(P2, { prompt: 'Prix final, en € ?', tolerance: 0.005, misconceptions: [mc(clean(P0 * (1 + (s * (p1 + p2)) / 100)), 'mc:taux-additionnes', 'raisonnement', `${up ? 'La seconde hausse' : 'La seconde réduction'} se calcule sur le nouveau prix (${eur(P1)} €), pas sur le prix de départ.`)] }),
    num(g, { prompt: `De quel pourcentage le prix a-t-il ${up ? 'augmenté' : 'baissé'} en tout ?`, tolerance: 0.05, misconceptions: [mc(p1 + p2, 'mc:taux-additionnes', 'raisonnement', `Les pourcentages successifs ne s’additionnent pas : ${up ? 'la seconde hausse porte sur un prix déjà augmenté' : 'la seconde réduction porte sur un prix déjà réduit'}. Compare le prix final au prix de départ.`), mc(clean(Math.abs(P2 - P0)), 'mc:difference-euros', 'notion', `C’est l’écart en euros ; pour un pourcentage, divise-le par le prix de départ (${eur(P0)} €).`)] }),
  ], {
    prompt: up ? `${cap(item)} coûte ${eur(P0)} €. Son prix augmente de ${p1} %, puis, l’année suivante, de ${p2} %.` : `${cap(item)} coûte ${eur(P0)} €. Pendant les soldes, son prix baisse de ${p1} %, puis une remise supplémentaire de ${p2} % s’applique au prix soldé.`,
    representation: 'concrete', expectedSeconds: 330,
    hints: ['Une hausse de p % revient à multiplier par (1 + p/100) ; une réduction de p %, par (1 − p/100).', `Chaque pourcentage s’applique au prix du moment : d’abord ${eur(P0)} €, puis le nouveau prix.`, `Pour le taux global, compare le prix final à ${eur(P0)} €.`],
    solution: `${eur(P0)} × ${fr(k1)} = ${eur(P1)} € ; ${eur(P1)} × ${fr(k2)} = ${eur(P2)} €. Coefficient global : ${fr(k1)} × ${fr(k2)} = ${fr(k1 * k2)}, soit ${up ? 'une hausse' : 'une baisse'} de ${fr(g)} % — et non de ${p1 + p2} %.`,
  });
}

/** ✦ Hausse puis baisse du même pourcentage : « ça revient au même » est faux. */
function pctAllerRetour(rand) {
  const item = pick(rand, [...ARTICLES, ...ABONNEMENTS]);
  let P0; let p; let P1; let P2;
  do { P0 = pick(rand, [40, 50, 80, 120, 150, 200, 250, 400, 500, 800]); p = pick(rand, [10, 20, 25, 30, 40, 50]); P1 = clean(P0 * (1 + p / 100)); P2 = clean(P1 * (1 - p / 100)); } while (!isRound(P1) || !isRound(P2));
  const g = clean((p * p) / 100);
  return problem([
    num(P1, { prompt: 'Prix après la hausse, en € ?', tolerance: 0.005, misconceptions: [mc(P0 + p, 'mc:soustraire-p', 'notion', `${p} % de ${eur(P0)} € ne valent pas ${p} €.`)] }),
    num(P2, { prompt: 'Prix après la baisse, en € ?', tolerance: 0.005, misconceptions: [mc(P0, 'mc:pourcentages-compenses', 'raisonnement', `La baisse de ${p} % se calcule sur le prix augmenté (${eur(P1)} €), plus grand que le prix de départ : elle enlève plus que la hausse n’avait ajouté.`)] }),
    yesNo(false, 'Le prix final est-il égal au prix de départ ? (oui ou non)', 'mc:pourcentages-compenses', 'raisonnement', `Compare : ${eur(P2)} € ≠ ${eur(P0)} €. Une hausse puis une baisse du même pourcentage ne se compensent pas.`),
    num(g, { prompt: 'De quel pourcentage le prix final est-il inférieur au prix de départ ?', tolerance: 0.05, misconceptions: [mc(0, 'mc:pourcentages-compenses', 'raisonnement', `Le prix final (${eur(P2)} €) est plus petit que le prix de départ (${eur(P0)} €) : la baisse globale n’est pas nulle.`), mc(clean(P0 - P2), 'mc:difference-euros', 'notion', `C’est l’écart en euros ; divise-le par ${eur(P0)} € pour obtenir un pourcentage.`)] }),
  ], {
    prompt: `Le prix ${de(item)} est de ${eur(P0)} €. Il augmente de ${p} %, puis le nouveau prix baisse de ${p} %.`,
    representation: 'concrete', expectedSeconds: 330,
    hints: [`Hausse de ${p} % : on multiplie par ${fr(1 + p / 100)}.`, `Baisse de ${p} % : on multiplie le NOUVEAU prix par ${fr(1 - p / 100)}.`, `Coefficient global : ${fr(1 + p / 100)} × ${fr(1 - p / 100)}.`],
    solution: `${eur(P0)} × ${fr(1 + p / 100)} = ${eur(P1)} € ; ${eur(P1)} × ${fr(1 - p / 100)} = ${eur(P2)} €. Coefficient global : ${fr(1 + p / 100)} × ${fr(1 - p / 100)} = ${fr(1 - g / 100)}, soit une baisse de ${fr(g)} %. Le prix ne revient pas à ${eur(P0)} €.`,
    justify: { prompt: `Explique pourquoi la baisse de ${p} % ne compense pas la hausse de ${p} %.`, minWords: 10, keywords: [['augmenté', 'plus grand', 'nouveau prix', 'pas le même prix']], example: `La baisse de ${p} % est calculée sur le prix augmenté de ${eur(P1)} €, plus grand que ${eur(P0)} € : elle enlève ${eur(P1 - P2)} €, plus que les ${eur(P1 - P0)} € ajoutés.` },
  });
}

/** ✦ Après une baisse, quelle hausse pour revenir au prix de départ ? */
function pctRevenir(rand) {
  const item = pick(rand, ARTICLES);
  const { P0, p, P1 } = drawEvolution(rand, false, [10, 20, 25, 40, 50, 60, 75, 80]);
  const back = clean(P0 - P1); const up = round((p / (100 - p)) * 100, 1); const exact = isRound((p / (100 - p)) * 100, 1);
  return problem([
    num(P1, { prompt: 'Nouveau prix après la baisse, en € ?', tolerance: 0.005, misconceptions: [mc(P0 - p, 'mc:soustraire-p', 'notion', `${p} % de ${eur(P0)} € ne valent pas ${p} €.`), mc(clean((P0 * p) / 100), 'mc:reduction-seule', 'methode', `Tu as calculé la baisse (${eur((P0 * p) / 100)} €) : il faut encore la retirer du prix de départ.`)] }),
    num(back, { prompt: 'De combien d’euros faut-il augmenter ce nouveau prix pour revenir au prix de départ ?', tolerance: 0.005, misconceptions: [mc(clean((P1 * p) / 100), 'mc:pourcentages-compenses', 'raisonnement', `${p} % du nouveau prix ne suffisent pas : il faut regagner tout l’écart, ${eur(P0)} − ${eur(P1)}.`)] }),
    num(up, { prompt: 'Quel pourcentage de hausse faut-il appliquer au nouveau prix ? (arrondi au dixième si besoin)', tolerance: 0.05, round: 1, misconceptions: [mc(p, 'mc:pourcentages-compenses', 'raisonnement', `La hausse se calcule sur le prix baissé (${eur(P1)} €), plus petit : il faut un pourcentage plus grand que ${p} % pour regagner ${eur(back)} €.`), mc(round((P0 / P1) * 100, 1), 'mc:coefficient-pourcentage', 'methode', 'Ce nombre compare le prix de départ au nouveau prix ; la hausse, c’est ce qui dépasse 100 %.')] }),
  ], {
    prompt: `Le prix ${de(item)} baisse de ${p} % : il passe de ${eur(P0)} € à un nouveau prix. Le magasin veut ensuite revenir exactement au prix de départ.`,
    representation: 'concrete', expectedSeconds: 330,
    hints: [`Nouveau prix : ${eur(P0)} × ${fr(1 - p / 100)}.`, 'La hausse en euros est l’écart entre le prix de départ et le nouveau prix.', 'Le pourcentage de hausse se calcule par rapport au nouveau prix (celui qu’on augmente).'],
    solution: `Nouveau prix : ${eur(P0)} × ${fr(1 - p / 100)} = ${eur(P1)} €. Il faut regagner ${eur(P0)} − ${eur(P1)} = ${eur(back)} €, soit ${eur(back)} ÷ ${eur(P1)} × 100 ${exact ? '=' : '≈'} ${fr(up)} %. Une baisse de ${p} % se compense par une hausse de ${fr(up)} %, pas de ${p} %.`,
  });
}

const GROUPES = [
  { lieu: 'Un collège', noms: 'élèves', a: 'sont demi-pensionnaires', groupe: 'demi-pensionnaires', b: 'choisissent le menu végétarien' },
  { lieu: 'Un club de sport', noms: 'adhérents', a: 'font de la compétition', groupe: 'compétiteurs', b: 'sont qualifiés pour le championnat régional' },
  { lieu: 'Un festival', noms: 'spectateurs', a: 'sont venus en train', groupe: 'spectateurs venus en train', b: 'ont un billet à tarif réduit' },
];

/** ✦ Pourcentage d’un pourcentage. */
function pctDePct(rand) {
  const c = pick(rand, GROUPES); let N; let p1; let p2;
  do { N = pick(rand, [400, 500, 600, 800, 1200, 1500, 2000, 2500]); p1 = pick(rand, [20, 25, 30, 40, 45, 60, 75, 80]); p2 = pick(rand, [10, 15, 20, 25, 30, 40, 50]); } while (!Number.isInteger((N * p1) / 100) || !Number.isInteger((N * p1 * p2) / 10000));
  const nA = (N * p1) / 100; const nB = (nA * p2) / 100; const g = clean((p1 * p2) / 100);
  return problem([
    num(nA, { prompt: `Combien y a-t-il ${de(c.groupe)} ?`, misconceptions: [mc(N * p1, 'mc:oubli-cent', 'calcul', 'Prendre p %, c’est multiplier par p puis diviser par 100.'), mc(N - p1, 'mc:soustraire-p', 'notion', 'Un pourcentage n’est pas une quantité à retirer : c’est une proportion du total.')] }),
    num(nB, { prompt: `Combien ${de(c.noms)} ${c.b} ?`, misconceptions: [mc(clean((N * p2) / 100), 'mc:pourcentage-mauvais-total', 'raisonnement', `Les ${p2} % portent sur les ${c.groupe} (${fr(nA)}), pas sur les ${fr(N)} ${c.noms}.`)] }),
    num(g, { prompt: `Quel pourcentage de l’ensemble des ${c.noms} cela représente-t-il ?`, tolerance: 0.05, misconceptions: [mc(p2, 'mc:pourcentage-mauvais-total', 'raisonnement', `${p2} % est la part parmi les ${c.groupe} seulement ; rapporte le nombre trouvé aux ${fr(N)} ${c.noms}.`), mc(p1 * p2, 'mc:oubli-cent', 'calcul', `${p2} % de ${p1} %, c’est ${fr(p2 / 100)} × ${p1} % : n’oublie pas de diviser par 100.`)] }),
  ], {
    prompt: `${c.lieu} compte ${fr(N)} ${c.noms}. ${p1} % des ${c.noms} ${c.a}, et ${p2} % de ces ${c.groupe} ${c.b}.`,
    representation: 'concrete', expectedSeconds: 300,
    hints: [`${p1} % de ${fr(N)} : ${fr(N)} × ${p1} ÷ 100.`, `Puis ${p2} % du résultat (et non de ${fr(N)}).`, `Pour le pourcentage global, compare le nombre trouvé à ${fr(N)}.`],
    solution: `${fr(N)} × ${p1} ÷ 100 = ${fr(nA)} ${c.groupe}. ${fr(nA)} × ${p2} ÷ 100 = ${fr(nB)}. ${fr(nB)} ÷ ${fr(N)} = ${fr(g / 100)}, soit ${fr(g)} % de l’ensemble (${p2} % de ${p1} % : ${fr(p2 / 100)} × ${p1} = ${fr(g)}).`,
  });
}

export const TIERS_GRANDEURS = {
  'm-proportionnalite': {
    approfondissement(rand, o = {}) {
      const ctx = choice(rand, o.contexte, ['prix', 'recette', 'carburant']);
      if (ctx === 'prix') return rand() < 0.5 ? propPrixMasse(rand) : propTableau(rand);
      if (ctx === 'recette') return rand() < 0.5 ? propRecetteLitres(rand) : propRecetteEnvers(rand);
      return rand() < 0.5 ? propAutonomie(rand) : propCoutTrajet(rand);
    },
    expert(rand, o = {}) {
      const ctx = choice(rand, o.contexte, ['prix', 'recette', 'carburant']);
      if (ctx === 'prix') return rand() < 0.5 ? propAbonnement(rand) : propOffres(rand);
      if (ctx === 'recette') return propIngredientLimitant(rand);
      return propConsoMoyenne(rand);
    },
  },
  'm-pourcentages': {
    approfondissement(rand, o = {}) {
      const mode = choice(rand, o.mode, ['part', 'reduction', 'augmentation']);
      if (mode === 'part') return rand() < 0.5 ? pctTotal(rand) : pctTaux(rand);
      const up = mode === 'augmentation';
      return rand() < 0.6 ? pctDepart(rand, up) : pctTauxEvolution(rand, up);
    },
    expert(rand, o = {}) {
      const mode = choice(rand, o.mode, ['part', 'reduction', 'augmentation']);
      if (mode === 'part') return pctDePct(rand);
      if (mode === 'augmentation') return rand() < 0.5 ? pctSuccessifs(rand, true) : pctAllerRetour(rand);
      return rand() < 0.5 ? pctSuccessifs(rand, false) : pctRevenir(rand);
    },
  },
};
