/**
 * Générateurs de PROBLÈMES de physique-chimie (2/2) : poids et masse, dissolution, combustion, lumière, chaîne d’énergie.
 * Une situation concrète, plusieurs questions qui s'enchaînent et, au niveau expert, une justification. Voir docs/GENERATEURS.md.
 */
import { ri, pick, clean, fr, mc, numeric, text, problem } from './gen-util.js';
import { TROIS, until, round, isInt, eq, cap, pow10, sciParts, sci, tolRound, bound, yesNo, tiered } from './problemes-pc-outils.js';


/* ------------------------------------------------------------------ */
/* 5. L'astronaute et son équipement : poids et masse                  */
/* ------------------------------------------------------------------ */
const G = { Terre: 9.8, Lune: 1.6, Mars: 3.7 };
const SUR = { Terre: 'sur la Terre', Lune: 'sur la Lune', Mars: 'sur Mars' };
const G_DONNEES = 'g = 9,8 N/kg sur la Terre, 1,6 N/kg sur la Lune, 3,7 N/kg sur Mars';
const MASSE_POIDS = 'La masse (en kg) et le poids (en N) sont deux grandeurs différentes : P = m × g.';

const ASTRONAUTE = {
  classe(rand, who) {
    const A = pick(rand, ['Lune', 'Mars']); const g = G[A];
    const ma = ri(rand, 55, 90); const me = pick(rand, [90, 100, 110, 120, 130]); const M = ma + me;
    const PT = clean(M * 9.8); const PA = clean(M * g);
    return problem([
      numeric(M, { prompt: 'Quelle est la masse de l’astronaute équipé, en kg ?', unit: 'kg', misconceptions: [mc(ma, 'mc:oubli-equipement', 'lecture', 'Ajoute la masse de la combinaison et de l’équipement.')] }),
      numeric(PT, { prompt: 'Quel est son poids, tout équipé, sur la Terre, en N (à 1 N près) ?', unit: 'N', tolerance: 1, misconceptions: [
        mc(clean(M / 9.8), 'mc:poids-division', 'notion', 'P = m × g : on multiplie la masse par g.'), mc(M, 'mc:masse-poids', 'notion', MASSE_POIDS)] }),
      numeric(M, { prompt: `Quelle est la masse de l’astronaute équipé ${SUR[A]}, en kg ?`, unit: 'kg', misconceptions: [
        mc(clean((M * g) / 9.8), 'mc:masse-change', 'notion', 'La masse mesure la quantité de matière : elle ne change pas quand on change d’astre. C’est le poids qui change.'),
        mc(PA, 'mc:masse-poids', 'notion', 'Ça, c’est le poids (en N) ; on demande la masse (en kg).')] }),
      numeric(PA, { prompt: `Quel est son poids ${SUR[A]}, en N (à 1 N près) ?`, unit: 'N', tolerance: 1, misconceptions: [
        mc(PT, 'mc:g-terre', 'lecture', `${cap(SUR[A])}, g vaut ${fr(g)} N/kg, pas 9,8 N/kg.`), mc(clean(M / g), 'mc:poids-division', 'notion', 'P = m × g : on multiplie la masse par g.')] }),
    ], {
      prompt: `${who} est astronaute et a une masse de ${ma} kg. Pour une sortie ${SUR[A]}, la combinaison et l’équipement ajoutent ${me} kg. Intensité de la pesanteur : g = 9,8 N/kg sur la Terre et ${fr(g)} N/kg ${SUR[A]}.`,
      hints: ['La masse (en kg) se mesure avec une balance ; le poids (en N), avec un dynamomètre.', 'P = m × g, où g dépend de l’astre.', 'La masse ne change pas d’un astre à l’autre ; le poids, si.'],
      solution: `Masse : ${ma} + ${me} = ${M} kg, la même partout. Poids sur la Terre : ${M} × 9,8 = ${fr(PT)} N. ${cap(SUR[A])} : la masse reste ${M} kg, le poids vaut ${M} × ${fr(g)} = ${fr(PA)} N.`,
      expectedSeconds: 300,
    });
  },
  approfondissement(rand, who) {
    const A = pick(rand, ['Lune', 'Mars']); const B = A === 'Lune' ? 'Mars' : 'Lune';
    const m = pick(rand, [0.4, 0.5, 0.6, 0.75, 0.8, 1.2, 1.5, 2, 2.5, 3]); const P = clean(m * G[A]);
    const ratio = clean(9.8 / G[A]);
    return problem([
      numeric(clean(m * 1000), { prompt: 'Quelle est la masse de l’échantillon, en grammes ?', unit: 'g', strictUnit: true, misconceptions: [
        mc(m, 'mc:kg-g', 'unite', 'P ÷ g donne la masse en kilogrammes : convertis-la en grammes (1 kg = 1 000 g).'),
        mc(clean(P * G[A] * 1000), 'mc:poids-division', 'notion', 'm = P / g : on divise le poids par g.'), mc(P, 'mc:masse-poids', 'notion', `${fr(P)} N est un poids, pas une masse : m = P / g.`)] }),
      numeric(clean(m * 9.8), { prompt: 'Quel sera son poids une fois rapporté sur la Terre, en N (au dixième) ?', unit: 'N', tolerance: 0.051, misconceptions: [
        mc(clean(P * 9.8), 'mc:masse-poids', 'notion', `${fr(P)} N est un poids : retrouve d’abord la masse.`), mc(P, 'mc:poids-constant', 'notion', 'Le poids dépend de l’astre : sur la Terre, g est plus grand, donc le poids aussi.')] }),
      numeric(clean(m * G[B]), { prompt: `Et ${SUR[B]}, en N (au dixième) ?`, unit: 'N', tolerance: 0.051, misconceptions: [
        mc(clean(P * G[B]), 'mc:masse-poids', 'notion', `${fr(P)} N est un poids : utilise la masse.`), mc(clean(m * 9.8), 'mc:g-terre', 'lecture', `${cap(SUR[B])}, g vaut ${fr(G[B])} N/kg.`)] }),
      numeric(ratio, { prompt: `Combien de fois le poids est-il plus grand sur la Terre que ${SUR[A]} ? (au dixième)`, tolerance: 0.051, misconceptions: [
        mc(clean(G[A] / 9.8), 'mc:rapport-inverse', 'raisonnement', 'Le poids est plus grand sur la Terre : le rapport cherché est plus grand que 1.')] }),
    ], {
      prompt: `${cap(SUR[A])}, ${who} suspend un échantillon de roche à un dynamomètre, qui indique ${fr(P)} N. Données : ${G_DONNEES}.`,
      hints: ['Le dynamomètre mesure un poids, en newtons.', `m = P / g, avec g = ${fr(G[A])} N/kg ici ; le résultat est en kg.`, 'La masse ne change pas : on la multiplie par le g de chaque astre.'],
      solution: `m = ${fr(P)} ÷ ${fr(G[A])} = ${fr(m)} kg = ${fr(m * 1000)} g. Sur la Terre : ${fr(m)} × 9,8 = ${fr(m * 9.8)} N ; ${SUR[B]} : ${fr(m)} × ${fr(G[B])} = ${fr(m * G[B])} N. Rapport : 9,8 ÷ ${fr(G[A])} ${eq(ratio)}.`,
      expectedSeconds: 420,
    });
  },
  expert(rand, who) {
    const A = pick(rand, ['Lune', 'Mars']); const g = G[A];
    const obj = pick(rand, ['une foreuse', 'une caisse d’échantillons', 'un module scientifique', 'un petit rover', 'une réserve d’eau']);
    const [M, F] = until(() => [pick(rand, [60, 80, 100, 120, 150, 180, 200, 250, 300]), pick(rand, [500, 800, 1000, 1200, 1500, 2000])], ([x, f]) => Math.abs(x * 9.8 - f) >= 0.05 * f && x * g < f);
    const PT = clean(M * 9.8); const PA = clean(M * g); const mmax = clean(F / g); const okT = PT <= F;
    // masse MAXIMALE : arrondi au kilogramme inférieur (un kilogramme de plus, et le poids dépasserait F)
    const lim = bound(mmax, 'max');
    const trop = `${fr(lim.unsafe)} kg × ${fr(g)} N/kg = ${fr(lim.unsafe * g)} N`;
    const arrondiM = lim.gap ? [mc(lim.unsafe, 'mc:arrondi-par-exces', 'raisonnement', `${trop} : c’est plus que ${F} N, le treuil ne pourrait pas soulever cette charge. Une masse MAXIMALE s’arrondit au kilogramme inférieur : ${fr(lim.answer)} kg.`)] : [];
    return problem([
      numeric(PT, { prompt: 'Quel est le poids de la charge sur la Terre, en N (à 1 N près) ?', unit: 'N', tolerance: 1, misconceptions: [mc(M, 'mc:masse-poids', 'notion', MASSE_POIDS), mc(clean(M / 9.8), 'mc:poids-division', 'notion', 'P = m × g.')] }),
      yesNo(okT, 'Sur la Terre, le treuil peut-il soulever cette charge ? (oui ou non)', 'mc:comparer-masse-force', 'raisonnement', `Compare le poids (${fr(PT)} N) à la force maximale du treuil (${F} N) : deux forces en newtons, et non une masse en kg.`),
      numeric(PA, { prompt: `Quel est le poids de la charge ${SUR[A]}, en N (à 1 N près) ?`, unit: 'N', tolerance: 1, misconceptions: [mc(PT, 'mc:g-terre', 'lecture', `${cap(SUR[A])}, g vaut ${fr(g)} N/kg.`), mc(clean(M / g), 'mc:poids-division', 'notion', 'P = m × g.')] }),
      numeric(lim.answer, { prompt: `Quelle masse maximale le treuil peut-il soulever ${SUR[A]}, en kg (arrondie au kilogramme) ?`, unit: 'kg', tolerance: lim.tolerance, misconceptions: [
        ...arrondiM,
        mc(clean(F / 9.8), 'mc:g-terre', 'lecture', `${cap(SUR[A])}, g vaut ${fr(g)} N/kg.`), mc(clean(F * g), 'mc:poids-division', 'notion', 'm = P / g : on divise la force par g.'), mc(F, 'mc:masse-poids', 'notion', 'Une force en newtons n’est pas une masse en kg : m = F / g.')] }),
    ], {
      prompt: `Pour une mission ${SUR[A]}, ${who} doit soulever ${obj} de ${M} kg avec un treuil dont la force maximale est de ${F} N. Données : ${G_DONNEES}.`,
      hints: ['Le treuil doit exercer une force au moins égale au poids de la charge.', 'P = m × g ; compare des newtons avec des newtons.', `Masse maximale = force maximale ÷ g (${fr(g)} N/kg ${SUR[A]}) ; arrondis vers le bas, sinon la charge serait trop lourde pour le treuil.`],
      solution: `Sur la Terre : P = ${M} × 9,8 = ${fr(PT)} N, ${okT ? 'inférieur' : 'supérieur'} à ${F} N : le treuil ${okT ? 'peut' : 'ne peut pas'} la soulever. ${cap(SUR[A])} : P = ${M} × ${fr(g)} = ${fr(PA)} N. Masse maximale : ${F} ÷ ${fr(g)} ${eq(mmax, 2)} kg${lim.gap ? `, soit ${fr(lim.answer)} kg au kilogramme inférieur (${trop} dépasserait ${F} N)` : ''}.`,
      justify: { prompt: `Explique pourquoi le même treuil soulève plus de matériel ${SUR[A]} que sur la Terre, alors que la masse de la charge ne change pas.`, minWords: 15, keywords: ['poids', 'masse', 'pesanteur', 'newton', 'g'],
        example: `La masse de la charge reste ${M} kg partout, mais son poids P = m × g dépend de l’astre. ${cap(SUR[A])}, g vaut ${fr(g)} N/kg au lieu de 9,8 : le poids est plus petit, donc avec ${F} N le treuil peut soulever jusqu’à ${fr(lim.answer)} kg.` },
      expectedSeconds: 480,
    });
  },
};

/* ------------------------------------------------------------------ */
/* 6. Dissoudre du sel ou du sucre (5e)                                */
/* ------------------------------------------------------------------ */
/** Solubilité à 20 °C, en g pour 100 mL d'eau. */
/** Solubilité à 20 °C (g pour 100 mL d'eau) ; volumes d'eau et tirages de masses à l'échelle d'un verre ou d'un bécher. Au niveau ◆, la masse de sel est un multiple de 9 (volume d'eau entier). */
const SOLUTES = [
  { nom: 'sel', s: 36, de: 'de sel', V: [50, 150, 200, 250, 300], tire: (rand) => 5 * ri(rand, 2, 30), tirePlus: (rand) => 9 * ri(rand, 2, 25) },
  { nom: 'sucre', s: 200, de: 'de sucre', V: [50, 80, 120, 150], tire: (rand) => 10 * ri(rand, 2, 45), tirePlus: (rand) => 10 * ri(rand, 2, 60) },
];
const EAU = '1 mL d’eau a une masse de 1 g.';

const DISSOLUTION = {
  classe(rand, who) {
    const S = pick(rand, SOLUTES); const V = pick(rand, S.V); const max = clean((S.s * V) / 100); const tout = rand() < 0.5;
    const ms = until(() => S.tire(rand), (x) => (tout ? x <= max - 5 : x >= max + 5));
    return problem([
      numeric(V + ms, { prompt: 'Quelle est la masse du mélange obtenu (sans compter le verre), en g ?', unit: 'g', misconceptions: [
        mc(V, 'mc:masse-disparue', 'notion', `Le ${S.nom} ne disparaît pas en se dissolvant : sa masse s’ajoute à celle de l’eau.`),
        mc(clean(V + Math.min(ms, max)), 'mc:depot-oublie', 'raisonnement', 'Le solide resté au fond fait toujours partie du mélange.')] }),
      numeric(max, { prompt: `Quelle masse maximale ${S.de} peut-on dissoudre dans ${V} mL d’eau à 20 °C, en g ?`, unit: 'g', misconceptions: [
        mc(S.s, 'mc:solubilite-volume', 'raisonnement', `${S.s} g, c’est pour 100 mL d’eau ; ici il y a ${V} mL : la masse maximale est proportionnelle au volume d’eau.`)] }),
      yesNo(tout, `Tout le ${S.nom} peut-il se dissoudre ? (oui ou non)`, tout ? 'mc:comparaison-solubilite' : 'mc:solubilite-illimitee', 'raisonnement',
        tout ? `${ms} g, c’est moins que la masse maximale (${fr(max)} g) : tout se dissout.` : `On ne peut pas dissoudre autant de ${S.nom} qu’on veut : au-delà de ${fr(max)} g, la solution est saturée et le reste se dépose au fond.`),
    ], {
      prompt: `${who} verse ${ms} g ${S.de} dans ${V} mL d’eau à 20 °C et mélange longtemps. À 20 °C, on peut dissoudre au maximum ${S.s} g ${S.de} dans 100 mL d’eau. ${EAU}`,
      hints: ['Quand un solide se dissout, il ne disparaît pas : la masse totale se conserve.', `La masse maximale dissoute est proportionnelle au volume d’eau : ${S.s} g pour 100 mL.`, `Compare ${ms} g à la masse maximale.`],
      solution: `Masse du mélange : ${V} g d’eau + ${ms} g ${S.de} = ${V + ms} g (conservation de la masse). Masse maximale dissoute : ${S.s} × ${V} ÷ 100 = ${fr(max)} g. ${tout ? `${ms} g < ${fr(max)} g : tout se dissout.` : `${ms} g > ${fr(max)} g : la solution est saturée, ${fr(ms - max)} g restent au fond.`}`,
      expectedSeconds: 240,
    });
  },
  approfondissement(rand, who) {
    const S = pick(rand, SOLUTES); const V = pick(rand, S.V); const mb = ri(rand, 80, 160); const max = clean((S.s * V) / 100);
    const ms = until(() => S.tirePlus(rand), (x) => x >= max + 5 && x <= 2 * max);
    const Vtot = clean((100 * ms) / S.s); const ajout = clean(Vtot - V); const reste = clean(ms - max);
    return problem([
      numeric(mb + V + ms, { prompt: 'Qu’indique la balance après le mélange (bécher compris), en g ?', unit: 'g', misconceptions: [
        mc(mb + V, 'mc:masse-disparue', 'notion', `Le ${S.nom} ne disparaît pas en se dissolvant : sa masse est toujours là.`),
        mc(clean(mb + V + max), 'mc:depot-oublie', 'raisonnement', `Le ${S.nom} resté au fond est toujours dans le bécher : la balance le pèse aussi.`), mc(V + ms, 'mc:becher-oublie', 'lecture', 'La balance pèse aussi le bécher.')] }),
      numeric(reste, { prompt: `Quelle masse ${S.de} reste au fond sans se dissoudre, en g ?`, unit: 'g', misconceptions: [
        mc(max, 'mc:masse-dissoute', 'lecture', 'C’est la masse dissoute ; on demande la masse qui reste au fond.'),
        mc(clean(ms - S.s), 'mc:solubilite-volume', 'raisonnement', `${S.s} g correspond à 100 mL ; pour ${V} mL, on peut en dissoudre ${fr(max)} g.`)] }),
      numeric(ajout, { prompt: `Quel volume d’eau faut-il ajouter, au minimum, pour que tout le ${S.nom} se dissolve, en mL ?`, unit: 'mL', misconceptions: [
        mc(Vtot, 'mc:volume-total', 'lecture', `Il faut ${fr(Vtot)} mL d’eau en tout, mais il y en a déjà ${V} mL.`),
        mc(reste, 'mc:masse-volume', 'notion', 'Une masse de solide n’est pas un volume d’eau : utilise la solubilité (proportionnalité).')] }),
    ], {
      prompt: `${who} pose un bécher vide sur une balance (${mb} g), y verse ${V} mL d’eau à 20 °C puis ${ms} g ${S.de}, et mélange longtemps. Solubilité à 20 °C : ${S.s} g ${S.de} pour 100 mL d’eau. ${EAU}`,
      hints: ['La balance pèse tout ce qui est dans le bécher, y compris le solide non dissous.', `Masse maximale dissoute = ${S.s} × ${V} ÷ 100.`, `Pour dissoudre ${ms} g, il faut ${ms} × 100 ÷ ${S.s} mL d’eau en tout.`],
      solution: `Balance : ${mb} + ${V} + ${ms} = ${mb + V + ms} g (rien ne disparaît). Masse maximale dissoute : ${S.s} × ${V} ÷ 100 = ${fr(max)} g, donc ${ms} − ${fr(max)} = ${fr(reste)} g restent au fond. Eau nécessaire : ${ms} × 100 ÷ ${S.s} = ${fr(Vtot)} mL ; il faut en ajouter ${fr(Vtot)} − ${V} = ${fr(ajout)} mL.`,
      expectedSeconds: 420,
    });
  },
  expert(rand, who) {
    const V = pick(rand, [50, 80, 100, 120, 150, 200, 250]); const cristaux = rand() < 0.75;
    const ms = until(() => 5 * ri(rand, 4, 145), (x) => (cristaux ? x >= 2 * V + 5 && x <= 2.9 * V - 5 : x <= 2 * V - 5 && x >= V));
    const m60 = clean(2.9 * V); const dep = cristaux ? ms - 2 * V : 0;
    return problem([
      numeric(m60, { prompt: 'Quelle masse maximale de sucre peut-on dissoudre dans cette eau à 60 °C, en g ?', unit: 'g', misconceptions: [
        mc(290, 'mc:solubilite-volume', 'raisonnement', `290 g, c’est pour 100 mL d’eau ; ici il y en a ${V} mL.`), mc(2 * V, 'mc:mauvaise-temperature', 'lecture', 'Ça, c’est à 20 °C ; à 60 °C, on peut dissoudre davantage de sucre.')] }),
      numeric(dep, { prompt: 'Quand le pot refroidit à 20 °C, quelle masse de sucre réapparaît sous forme de cristaux, en g ?', unit: 'g', misconceptions: [
        mc(clean(0.9 * V), 'mc:difference-solubilites', 'raisonnement', `${fr(0.9 * V)} g serait juste si l’eau contenait le maximum possible à 60 °C (${fr(m60)} g) ; elle n’en contient que ${ms} g.`),
        mc(2 * V, 'mc:masse-dissoute', 'lecture', 'C’est la masse qui peut rester dissoute à 20 °C ; on demande ce qui se dépose.'),
        cristaux ? mc(0, 'mc:sucre-reste-dissous', 'notion', 'En refroidissant, l’eau peut dissoudre moins de sucre : l’excès se dépose en cristaux.')
          : mc(ms - 2 * V, 'mc:masse-negative', 'raisonnement', `Une masse ne peut pas être négative : il y a moins de sucre (${ms} g) que ce que l’eau peut garder dissous à 20 °C (${2 * V} g), rien ne se dépose.`)] }),
      numeric(V + ms, { prompt: 'Quelle est la masse totale du contenu du pot à 20 °C (liquide et cristaux éventuels), en g ?', unit: 'g', misconceptions: [
        mc(3 * V, 'mc:masse-disparue', 'notion', 'Les cristaux sont toujours dans le pot : la masse totale se conserve.'), mc(V, 'mc:masse-disparue', 'notion', 'Le sucre dissous ne disparaît pas : sa masse s’ajoute à celle de l’eau.')] }),
      yesNo(cristaux, 'À 20 °C, le liquide du pot est-il une solution saturée ? (oui ou non)', 'mc:saturation', 'notion',
        cristaux ? 'Il reste du sucre solide au fond : le liquide ne peut plus en dissoudre, il est saturé.' : `Le liquide pourrait encore dissoudre ${2 * V - ms} g de sucre : il n’est pas saturé.`),
    ], {
      prompt: `Pour préparer un sirop, ${who} dissout ${ms} g de sucre dans ${V} mL d’eau chauffée à 60 °C, puis laisse refroidir le pot fermé jusqu’à 20 °C. Solubilité du sucre : environ 290 g pour 100 mL d’eau à 60 °C, et 200 g pour 100 mL à 20 °C. ${EAU}`,
      hints: ['La masse maximale dissoute est proportionnelle à la quantité d’eau, et dépend de la température.', `À 20 °C, l’eau ne peut garder que 200 × ${V} ÷ 100 = ${2 * V} g de sucre dissous.`, 'Pot fermé : rien n’entre, rien ne sort, la masse totale se conserve.'],
      solution: `À 60 °C : 290 × ${V} ÷ 100 = ${fr(m60)} g au maximum, donc les ${ms} g se dissolvent. À 20 °C : ${2 * V} g au maximum ${cristaux ? `; ${ms} − ${2 * V} = ${dep} g de sucre réapparaissent en cristaux et le liquide est saturé` : `; ${ms} g < ${2 * V} g, rien ne se dépose et le liquide n’est pas saturé`}. Masse totale : ${V} + ${ms} = ${V + ms} g (conservation de la masse).`,
      justify: { prompt: 'Explique ce qui se passe quand le sirop refroidit, avec les mots « solubilité » et « conservation de la masse ».', minWords: 15, keywords: ['solubilité', 'conservation', 'masse', 'saturé', 'cristaux'],
        example: `La solubilité du sucre diminue quand la température baisse : à 20 °C l’eau ne garde que ${2 * V} g dissous. ${cristaux ? `Les ${dep} g en trop forment des cristaux, le liquide est saturé.` : 'Il y en a moins, donc rien ne se dépose.'} Par conservation de la masse, le pot contient toujours ${V + ms} g.` },
      expectedSeconds: 480,
    });
  },
};

/* ------------------------------------------------------------------ */
/* 7. Combustions et conservation de la masse (4e)                     */
/* ------------------------------------------------------------------ */
/** ref = masses de l'expérience de référence [combustible, dioxygène, dioxyde de carbone, eau] en g. */
const COMBUSTIBLES = [
  { du: 'du méthane', de: 'de méthane', nom: 'méthane', usage: 'le gaz de la cuisinière', eq: 'CH₄ + 2 O₂ → CO₂ + 2 H₂O', ref: [16, 64, 44, 36], kO2: 2, oxy: 4 },
  { du: 'du propane', de: 'de propane', nom: 'propane', usage: 'une bouteille de gaz de camping', eq: 'C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O', ref: [44, 160, 132, 72], kO2: 5, oxy: 10 },
  { du: 'de l’éthanol', de: 'd’éthanol', nom: 'éthanol', usage: 'un réchaud à alcool', eq: 'C₂H₆O + 3 O₂ → 2 CO₂ + 3 H₂O', ref: [46, 96, 88, 54], kO2: 3, oxy: 7 },
];
const CONSERVATION = 'Au cours d’une transformation chimique, la masse totale se conserve : masse des réactifs consommés = masse des produits formés.';

const COMBUSTION = {
  classe(rand, who) {
    const s = pick(rand, [0.25, 0.5, 0.75, 1, 1.5, 2]); const mC = clean(12 * s); const mO = clean(32 * s); const mCO2 = clean(44 * s);
    const M = clean(ri(rand, 180, 420) + mC + mO + ri(rand, 2, 12));
    return problem([
      numeric(M, { prompt: 'Qu’indique la balance à la fin, quand tout le carbone a brûlé (flacon toujours fermé), en g ?', unit: 'g', misconceptions: [
        mc(clean(M - mC), 'mc:masse-disparue', 'notion', 'Le carbone n’a pas disparu : ses atomes sont dans le dioxyde de carbone, qui reste dans le flacon fermé. La masse totale se conserve.'),
        mc(clean(M + mCO2), 'mc:produit-ajoute', 'raisonnement', 'Le dioxyde de carbone se forme à partir des réactifs déjà présents dans le flacon : rien ne s’ajoute.')] }),
      numeric(mO, { prompt: `On mesure qu’il s’est formé ${fr(mCO2)} g de dioxyde de carbone. Quelle masse de dioxygène a été consommée, en g ?`, unit: 'g', misconceptions: [
        mc(clean(mCO2 + mC), 'mc:conservation-sens', 'raisonnement', 'm(carbone) + m(dioxygène consommé) = m(dioxyde de carbone) : on soustrait la masse de carbone.'),
        mc(mCO2, 'mc:produit-reactif', 'lecture', 'Ça, c’est la masse du produit formé, pas celle du dioxygène consommé.')] }),
      text(['produit', 'un produit', 'c’est un produit', 'le produit'], { prompt: 'Le dioxyde de carbone est-il un réactif ou un produit de la réaction ?', placeholder: 'réactif ou produit',
        misconceptions: ['réactif', 'un réactif', 'reactif'].map((a) => mc(a, 'mc:reactif-produit', 'notion', 'Les réactifs (carbone, dioxygène) sont consommés ; le dioxyde de carbone apparaît : c’est un produit.')) }),
    ], {
      prompt: `${who} fait brûler ${fr(mC)} g de carbone (du charbon de bois) dans un flacon fermé rempli de dioxygène, posé sur une balance qui indique ${fr(M)} g au départ. Équation de la réaction : carbone + dioxygène → dioxyde de carbone.`,
      hints: ['Dans un flacon fermé, rien n’entre et rien ne sort.', CONSERVATION, 'Les réactifs sont consommés, les produits apparaissent.'],
      solution: `Flacon fermé : la masse totale se conserve, la balance indique toujours ${fr(M)} g. Dioxygène consommé : ${fr(mCO2)} − ${fr(mC)} = ${fr(mO)} g. Le dioxyde de carbone apparaît : c’est un produit.`,
      expectedSeconds: 300,
    });
  },
  approfondissement(rand, who) {
    const C = pick(rand, COMBUSTIBLES); const [f0, o0, c0, w0] = C.ref;
    const s = pick(rand, [0.25, 0.5, 0.75, 1.5, 2, 2.5, 3]); const mf = clean(s * f0); const mo = clean(s * o0);
    return problem([
      numeric(w0, { prompt: 'Dans l’expérience de référence, quelle masse d’eau s’est formée, en g ?', unit: 'g', misconceptions: [
        mc(f0 + o0, 'mc:un-seul-produit', 'raisonnement', 'Il se forme DEUX produits : retire la masse de dioxyde de carbone.'),
        mc(f0 + o0 + c0, 'mc:conservation-sens', 'raisonnement', 'Masse des réactifs = masse des produits : on soustrait la masse du dioxyde de carbone, on ne l’ajoute pas.')] }),
      numeric(mo, { prompt: `Quelle masse de dioxygène faut-il pour brûler ${fr(mf)} g ${C.de}, en g ?`, unit: 'g', misconceptions: [
        mc(clean(mf * C.kO2), 'mc:coefficient-masse', 'notion', `Le coefficient ${C.kO2} devant O₂ compte des molécules, pas des grammes : utilise la proportionnalité avec l’expérience (${f0} g ${C.de} pour ${o0} g de dioxygène).`),
        mc(o0, 'mc:proportionnalite', 'raisonnement', `${o0} g, c’est pour ${f0} g ; ici on brûle ${fr(mf)} g : les masses sont proportionnelles.`),
        mc(clean(mf + o0 - f0), 'mc:modele-additif', 'raisonnement', 'Les masses sont proportionnelles : on multiplie par un même nombre, on n’ajoute pas un même nombre.')] }),
      numeric(clean(mf + mo), { prompt: 'Quelle masse totale de produits (dioxyde de carbone et eau) se forme alors, en g ?', unit: 'g', misconceptions: [
        mc(clean(s * c0), 'mc:un-seul-produit', 'raisonnement', 'N’oublie pas l’eau : il y a deux produits.'), mc(mf, 'mc:gaz-sans-masse', 'notion', 'Le dioxygène consommé a une masse : elle se retrouve dans les produits.')] }),
      numeric(C.oxy, { prompt: 'D’après l’équation, combien d’atomes d’oxygène y a-t-il en tout du côté des produits ?', misconceptions: [
        mc(3, 'mc:coefficient-oublie', 'lecture', 'Le coefficient placé devant une formule multiplie toute la molécule : 2 H₂O contient 2 atomes d’oxygène.')] }),
    ], {
      prompt: `${who} étudie la combustion ${C.du} (${C.usage}). Équation de la réaction : ${C.eq}. Lors d’une expérience de référence, ${f0} g ${C.de} ont réagi avec ${o0} g de dioxygène en formant ${c0} g de dioxyde de carbone et de l’eau. ${who} veut prévoir ce qui se passera en brûlant ${fr(mf)} g ${C.de}.`,
      hints: [CONSERVATION, `Les masses qui réagissent sont proportionnelles : ${fr(mf)} g, c’est ${fr(s)} fois ${f0} g.`, 'Pour compter les atomes, multiplie l’indice de chaque atome par le coefficient placé devant la formule.'],
      solution: `Eau formée : ${f0} + ${o0} − ${c0} = ${w0} g. ${fr(mf)} g = ${fr(s)} × ${f0} g, donc dioxygène : ${fr(s)} × ${o0} = ${fr(mo)} g, et produits : ${fr(mf)} + ${fr(mo)} = ${fr(mf + mo)} g. Atomes d’oxygène dans les produits : ${C.oxy} (autant que dans les réactifs).`,
      expectedSeconds: 420,
    });
  },
  expert(rand, who) {
    const S = [1 / 40, 1 / 20, 1 / 16, 1 / 10, 1 / 8, 1 / 5];
    const [s1, s2] = until(() => [pick(rand, S), pick(rand, S)], ([a, b]) => a !== b);
    const fe1 = clean(168 * s1); const ox1 = clean(232 * s1); const o1 = clean(64 * s1);
    const fe2 = clean(168 * s2); const ox2 = clean(232 * s2); const o2 = clean(64 * s2); const M = clean(ri(rand, 2500, 4500) / 10);
    const q2 = rand() < 0.5
      ? yesNo(false, 'La masse a augmenté : la loi de conservation de la masse est-elle contredite ? (oui ou non)', 'mc:conservation-contredite', 'raisonnement',
        'Non : le dioxygène de l’air, qui n’était pas sur la balance au départ, s’est fixé sur le fer. Si on compte tous les réactifs, la masse se conserve.')
      : yesNo(true, 'Un gaz de l’air a-t-il participé à cette transformation chimique ? (oui ou non)', 'mc:gaz-sans-masse', 'notion',
        'Oui : le dioxygène de l’air est un réactif. Il s’est fixé sur le fer : c’est pour cela que la masse a augmenté.');
    return problem([
      numeric(o1, { prompt: 'Quelle masse de dioxygène de l’air a réagi avec le fer, en g ?', unit: 'g', misconceptions: [
        mc(clean(ox1 + fe1), 'mc:conservation-sens', 'raisonnement', 'm(fer) + m(dioxygène) = m(oxyde) : on soustrait.'), mc(ox1, 'mc:produit-reactif', 'lecture', 'Ça, c’est la masse de l’oxyde formé.'),
        mc(0, 'mc:gaz-sans-masse', 'notion', 'Un gaz a une masse : c’est le dioxygène de l’air fixé sur le fer qui fait augmenter la masse.')] }),
      q2,
      numeric(ox2, { prompt: `Quelle masse d’oxyde de fer obtiendrait-on en brûlant entièrement ${fr(fe2)} g de paille de fer, en g ?`, unit: 'g', misconceptions: [
        mc(clean(fe2 + o1), 'mc:modele-additif', 'raisonnement', `Le gain de masse n’est pas toujours ${fr(o1)} g : il est proportionnel à la masse de fer brûlée.`), mc(fe2, 'mc:gaz-sans-masse', 'notion', 'Le fer gagne la masse du dioxygène qui s’y fixe.')] }),
      numeric(M, { prompt: `On recommence avec ${fr(fe2)} g de paille de fer dans un flacon fermé rempli de dioxygène : avant la combustion, l’ensemble posé sur la balance pèse ${fr(M)} g. Qu’indique la balance après, en g ?`, unit: 'g', misconceptions: [
        mc(clean(M + o2), 'mc:flacon-ferme', 'raisonnement', 'Dans le flacon fermé, le dioxygène qui se fixe sur le fer était déjà sur la balance : la masse totale ne change pas.'),
        mc(clean(M - fe2), 'mc:masse-disparue', 'notion', 'Le fer ne disparaît pas : il se transforme en oxyde, qui reste dans le flacon.')] }),
    ], {
      prompt: `${who} pose ${fr(fe1)} g de paille de fer sur une balance et la fait brûler à l’air libre. À la fin, la balance indique ${fr(ox1)} g : le fer s’est transformé en oxyde de fer. Équation de la réaction : 3 Fe + 2 O₂ → Fe₃O₄.`,
      hints: ['Quels réactifs participent à la combustion ? Étaient-ils tous sur la balance au départ ?', 'm(fer) + m(dioxygène consommé) = m(oxyde formé) ; ces masses sont proportionnelles.', 'Dans un flacon fermé, tous les réactifs sont sur la balance dès le départ.'],
      solution: `Dioxygène fixé : ${fr(ox1)} − ${fr(fe1)} = ${fr(o1)} g ; il venait de l’air, la masse se conserve bien. Proportionnalité : ${fr(fe2)} g de fer donnent ${fr(ox1)} × ${fr(fe2)} ÷ ${fr(fe1)} = ${fr(ox2)} g d’oxyde. Dans un flacon fermé, la balance indique toujours ${fr(M)} g.`,
      justify: { prompt: 'Explique pourquoi la masse augmente à l’air libre, et pourquoi elle ne changerait pas dans un flacon fermé.', minWords: 15, keywords: ['dioxygène', 'air', 'conservation', 'fermé', 'réactif'],
        example: `À l’air libre, le dioxygène de l’air réagit avec le fer : ${fr(o1)} g s’ajoutent, alors qu’ils n’étaient pas pesés au départ. Dans un flacon fermé, ce dioxygène est déjà sur la balance : la masse totale se conserve et reste ${fr(M)} g.` },
      expectedSeconds: 540,
    });
  },
};

/* ------------------------------------------------------------------ */
/* 8. Combien de temps met la lumière ? (4e)                           */
/* ------------------------------------------------------------------ */
/** Distance moyenne au Soleil, en millions de km. */
const PLANETES = [['Mercure', 58], ['Vénus', 108], ['la Terre', 150], ['Mars', 228], ['Jupiter', 778], ['Saturne', 1430]];
const SONDES = [['un robot posé sur Mars', 8, [1.2, 1.5, 1.8, 2.1, 2.4, 2.7, 3, 3.6]], ['la sonde Juno, en orbite autour de Jupiter', 8, [6, 7.2, 9]], ['la sonde New Horizons, au-delà de Pluton', 9, [9]], ['la sonde Voyager 1', 10, [2.4]]];
const BASE_100 = 'Une minute compte 60 secondes (et une heure 60 minutes), pas 100.';
const KM_S = 'La distance est en km : divise par la vitesse en km/s (3 × 10⁵ km/s), pas en m/s.';

const LUMIERE = {
  classe(rand, who) {
    const [P, D] = pick(rand, PLANETES); const d = D * 1e6; const t = clean(d / 3e5); const min = clean(t / 60);
    return problem([
      numeric(d, { prompt: `Écris la distance entre le Soleil et ${P} en kilomètres (tu peux utiliser une puissance de 10).`, unit: 'km', unitOptional: true, strictUnit: true, misconceptions: [
        mc(D * 1000, 'mc:million', 'notion', '1 million = 1 000 000 = 10⁶ : six zéros, pas trois.'), mc(D * 1e9, 'mc:million', 'notion', 'Un million = 10⁶ ; un milliard = 10⁹.')] }),
      numeric(t, { prompt: `Combien de secondes la lumière du Soleil met-elle pour atteindre ${P} ? (arrondi à la seconde)`, unit: 's', tolerance: 0.51, misconceptions: [
        mc(clean(d / 3e8), 'mc:unites-melangees', 'unite', KM_S), mc(clean(3e5 / d), 'mc:duree-inverse', 'notion', 't = d / v : on divise la distance par la vitesse.'), mc(clean(d * 3e5), 'mc:vitesse-produit', 'notion', 't = d / v : on divise, on ne multiplie pas.')] }),
      numeric(min, { prompt: 'Convertis cette durée en minutes (arrondie au dixième).', unit: 'min', strictUnit: true, tolerance: tolRound(min, 1, [round(round(t) / 60, 1)]), misconceptions: [
        mc(clean(t / 100), 'mc:base-100', 'notion', BASE_100), mc(clean(t * 60), 'mc:conversion-sens', 'unite', 'Une minute est plus longue qu’une seconde : le nombre doit diminuer (on divise par 60).')] }),
    ], {
      prompt: `${who} lit que la lumière se propage dans le vide à environ 300 000 km/s, et que ${P} se trouve à environ ${fr(D)} millions de kilomètres du Soleil.`,
      hints: ['1 million = 10⁶ ; 300 000 km/s = 3 × 10⁵ km/s.', 't = d / v, avec d en km et v en km/s : t est en secondes.', '1 min = 60 s : divise par 60.'],
      solution: `d = ${fr(D)} millions de km = ${fr(d)} km = ${sci(d)} km. t = ${fr(d)} ÷ 300 000 ${eq(t, 0)} s, soit ${fr(round(t, 0))} ÷ 60 ${eq(min)} min.`,
      expectedSeconds: 300,
    });
  },
  approfondissement(rand, who) {
    const [sonde, n0, as] = pick(rand, SONDES); const d = clean(pick(rand, as) * 10 ** n0); const [a, n] = sciParts(d); const t = clean(d / 3e5);
    const enH = t >= 7200; const u = enH ? 'h' : 'min'; const mot = enH ? 'heures' : 'minutes'; const k = enH ? 3600 : 60; const tu = clean(t / k); const aller = clean((2 * t) / k);
    return problem([
      numeric(t, { prompt: 'Combien de secondes un message radio met-il pour arriver à destination ?', unit: 's', misconceptions: [mc(clean(d / 3e8), 'mc:unites-melangees', 'unite', KM_S), mc(clean(d * 3e5), 'mc:vitesse-produit', 'notion', 't = d / v : on divise la distance par la vitesse.')] }),
      numeric(tu, { prompt: `Convertis cette durée en ${mot} (arrondie au dixième).`, unit: u, strictUnit: true, tolerance: 0.051, misconceptions: [
        mc(clean(t / 100), 'mc:base-100', 'notion', BASE_100), ...(enH ? [mc(clean(t / 60), 'mc:minutes-heures', 'unite', 'Tu as obtenu des minutes : une heure compte 3 600 secondes.')] : [])] }),
      // au dixième : on accepte aussi le double de la durée arrondie de la question précédente
      numeric(aller, { prompt: `On envoie un ordre et la réponse repart aussitôt. Au bout de combien de temps la reçoit-on, en ${mot} (au dixième) ?`, unit: u, tolerance: tolRound(aller, 1, [2 * round(tu, 1)]), misconceptions: [
        mc(tu, 'mc:aller-seulement', 'raisonnement', 'L’ordre fait l’aller, la réponse fait le retour : la durée est doublée.')] }),
    ], {
      prompt: `Les ondes radio se propagent à la vitesse de la lumière : 3 × 10⁵ km/s. ${who} s’intéresse aux messages échangés avec ${sonde}, à ${sci(d)} km de la Terre.`,
      hints: ['Durée = distance ÷ vitesse : avec des km et des km/s, la durée est en secondes.', `${sci(d)} ÷ (3 × 10⁵) : divise ${fr(a)} par 3, puis ${pow10(n)} ÷ 10⁵ = ${pow10(n - 5)}.`, '1 min = 60 s ; 1 h = 3 600 s. Un aller-retour prend deux fois plus de temps.'],
      solution: `t = ${sci(d)} ÷ (3 × 10⁵) = ${fr(t)} s, soit ${fr(t)} ÷ ${k} ${eq(tu)} ${u}. Aller et retour : 2 × ${fr(t)} = ${fr(2 * t)} s ${eq(aller)} ${u}.`,
      expectedSeconds: 420,
    });
  },
  expert(rand, who) {
    const [cible, d] = pick(rand, [['la Terre', 1.5e8], ['Mars', 2.28e8]]);
    const vp = pick(rand, [400, 500, 600, 750, 800, 1000, 1200, 1500, 2000]);
    const tl = clean(d / 3e5); const tp = clean(d / vp); const hP = clean(tp / 3600); const avance = clean((tp - tl) / 3600); const rapport = clean(3e5 / vp);
    // avance au dixième : on accepte aussi la différence calculée avec les deux durées arrondies des questions précédentes
    const avanceArrondie = round(round(hP, 1) - round(tl / 60, 1) / 60, 1);
    return problem([
      numeric(clean(tl / 60), { prompt: 'Combien de minutes la lumière de l’éruption met-elle pour arriver ? (au dixième)', unit: 'min', tolerance: 0.051, misconceptions: [
        mc(clean(tl / 100), 'mc:base-100', 'notion', BASE_100), mc(0, 'mc:lumiere-instantanee', 'notion', 'La lumière est très rapide mais pas instantanée : sur une telle distance, elle met plusieurs minutes.')] }),
      numeric(hP, { prompt: 'Combien d’heures le nuage de particules met-il pour arriver ? (au dixième)', unit: 'h', tolerance: 0.051, misconceptions: [
        mc(clean(tp / 60), 'mc:minutes-heures', 'unite', 'Tu as obtenu des minutes : une heure compte 3 600 secondes.'), mc(clean(tp / 100), 'mc:base-100', 'notion', BASE_100)] }),
      numeric(avance, { prompt: 'Les astronomes voient l’éruption au moment où sa lumière arrive. De combien d’heures d’avance disposent-ils avant l’arrivée du nuage ? (au dixième)', unit: 'h', tolerance: tolRound(avance, 1, [avanceArrondie]), misconceptions: [
        mc(hP, 'mc:lumiere-instantanee', 'raisonnement', `La lumière aussi met du temps (${fr(round(tl / 60, 1))} min) : l’avance est la différence entre les deux durées.`)] }),
      numeric(rapport, { prompt: 'Combien de fois la lumière est-elle plus rapide que le nuage ?', misconceptions: [
        mc(clean(vp / 3e5), 'mc:rapport-inverse', 'raisonnement', 'La lumière est plus rapide : le rapport est plus grand que 1. Divise la vitesse de la lumière par celle du nuage.')] }),
    ], {
      prompt: `Le Soleil projette parfois un énorme nuage de particules (une « éjection de masse coronale »). ${who} étudie un nuage parti vers ${cible}, à ${sci(d)} km du Soleil, à ${fr(vp)} km/s. La lumière de l’éruption, à 3 × 10⁵ km/s, part au même instant.`,
      hints: ['Pour chacun : durée = distance ÷ vitesse (en secondes), puis conversion.', '1 h = 3 600 s. Les astronomes ne voient l’éruption qu’une fois sa lumière arrivée.', 'Avance = durée du nuage − durée de la lumière ; rapport = vitesse de la lumière ÷ vitesse du nuage.'],
      solution: `Lumière : ${sci(d)} ÷ (3 × 10⁵) = ${fr(tl)} s ${eq(tl / 60)} min. Nuage : ${sci(d)} ÷ ${fr(vp)} = ${fr(tp)} s ${eq(hP)} h. Avance : (${fr(tp)} − ${fr(tl)}) ÷ 3 600 ${eq(avance)} h. Rapport : 300 000 ÷ ${fr(vp)} = ${fr(rapport)}.`,
      justify: { prompt: 'Explique pourquoi on voit l’éruption avant l’arrivée du nuage, et comment tu as calculé l’avance.', minWords: 15, keywords: ['lumière', 'vitesse', 'durée', 'différence', 'rapide'],
        example: `La lumière va ${fr(rapport)} fois plus vite que le nuage : elle arrive après ${fr(round(tl / 60, 1))} minutes, le nuage après ${fr(round(hP, 1))} heures. L’avance est la différence des deux durées, environ ${fr(round(avance, 1))} heures.` },
      expectedSeconds: 540,
    });
  },
};

/* ------------------------------------------------------------------ */
/* 9. Chaîne d'énergie : dynamo, éolienne, panneau, moteur (5e)        */
/* ------------------------------------------------------------------ */
const FORMES = {
  cinetique: { nom: 'cinétique', accept: ['cinétique', 'énergie cinétique', 'l’énergie cinétique', 'cinetique', 'mouvement', 'énergie de mouvement', 'mécanique', 'énergie mécanique'] },
  electrique: { nom: 'électrique', accept: ['électrique', 'énergie électrique', 'l’énergie électrique', 'electrique', 'électricité', 'l’électricité'] },
  lumineuse: { nom: 'lumineuse', accept: ['lumineuse', 'énergie lumineuse', 'l’énergie lumineuse', 'lumière', 'la lumière', 'lumiere'] },
  thermique: { nom: 'thermique', accept: ['thermique', 'énergie thermique', 'l’énergie thermique', 'chaleur', 'la chaleur', 'calorifique'] },
};
const FORMES_PH = 'cinétique, électrique, lumineuse…';
const CONVERTISSEURS = [
  { dans: 'dans la dynamo', de: 'de la dynamo', scene: 'roule de nuit : la dynamo, entraînée par la roue, alimente la lampe du vélo', recu: 'cinetique', utile: 'electrique', base: 'chaque minute', E: [300, 360, 400, 480, 500, 600], p: [50, 55, 60, 65, 70] },
  { dans: 'dans l’éolienne', de: 'de l’éolienne', scene: 'visite une petite éolienne qui alimente un refuge de montagne', recu: 'cinetique', utile: 'electrique', base: 'chaque seconde', E: [2000, 2500, 3000, 4000, 5000], p: [30, 35, 40, 45] },
  { dans: 'dans le panneau photovoltaïque', de: 'du panneau photovoltaïque', scene: 'installe un panneau photovoltaïque sur le toit d’une cabane', recu: 'lumineuse', utile: 'electrique', base: 'chaque seconde', E: [1000, 1200, 1500, 1700, 2000], p: [15, 18, 20] },
  { dans: 'dans le moteur de la trottinette', de: 'du moteur de la trottinette', scene: 'se déplace en trottinette électrique', recu: 'electrique', utile: 'cinetique', base: 'chaque seconde', E: [250, 300, 350, 400, 500], p: [75, 80, 85, 90] },
  { dans: 'dans la lampe à DEL', de: 'de la lampe à DEL', scene: 'lit le soir à la lumière d’une lampe à DEL', recu: 'electrique', utile: 'lumineuse', base: 'chaque seconde', E: [5, 6, 8, 10, 12], p: [25, 30, 40, 50] },
];
/** Deux convertisseurs à la suite ; E1 = énergie de départ (◆), E3 = énergie utile visée (✦). */
const CHAINES = [
  { c1: 'la dynamo', nom1: 'dynamo', a1: 'à la dynamo', c2: 'la lampe à DEL', a2: 'à la lampe', de2: 'de la lampe', recu: 'cinetique', utile: 'lumineuse', base: 'en une minute', p1: [50, 60, 70], p2: [25, 30, 40, 50], E1: [200, 300, 400, 500, 600, 800, 1000, 1200], E3: [30, 36, 45, 48, 60, 72, 90, 120], scene: (w) => `${w} pédale de nuit : la dynamo du vélo alimente une lampe à DEL.` },
  { c1: 'l’éolienne', nom1: 'éolienne', a1: 'à l’éolienne', c2: 'le moteur de la pompe', a2: 'au moteur de la pompe', de2: 'du moteur de la pompe', recu: 'cinetique', utile: 'cinetique', base: 'chaque seconde', p1: [30, 40, 50], p2: [70, 75, 80], E1: [1000, 2000, 2500, 3000, 4000, 5000], E3: [300, 450, 600, 750, 900, 1200], scene: (w) => `Dans une ferme, une éolienne alimente le moteur d’une pompe à eau ; ${w} étudie l’installation.` },
  { c1: 'le panneau photovoltaïque', nom1: 'panneau photovoltaïque', a1: 'au panneau', c2: 'la lampe à DEL', a2: 'à la lampe', de2: 'de la lampe', recu: 'lumineuse', utile: 'lumineuse', base: 'chaque seconde', p1: [15, 18, 20], p2: [25, 30, 40, 50], E1: [400, 500, 800, 1000, 1200, 1600, 2000], E3: [30, 40, 45, 60, 75, 90, 120], scene: (w) => `${w} éclaire une cabane avec un panneau photovoltaïque relié à une lampe à DEL.` },
];
const BILAN = 'Un convertisseur ne fournit jamais plus d’énergie qu’il n’en reçoit : énergie reçue = énergie utile + énergie perdue.';

const ENERGIE = {
  classe(rand, who) {
    const C = pick(rand, CONVERTISSEURS); const R = FORMES[C.recu]; const F = FORMES[C.utile];
    const [E, p] = until(() => [pick(rand, C.E), pick(rand, C.p)], ([e, q]) => isInt((e * q) / 100, 1));
    const U = clean((E * p) / 100); const perdue = clean(E - U);
    return problem([
      text(R.accept, { prompt: `Quelle forme d’énergie entre ${C.dans} ? (un mot)`, placeholder: FORMES_PH, misconceptions: [mc(F.nom, 'mc:conversion-inversee', 'notion', `C’est l’énergie qui sort. Ce convertisseur reçoit de l’énergie ${R.nom} et la convertit en énergie ${F.nom}.`)] }),
      text(F.accept, { prompt: `Quelle forme d’énergie utile sort ${C.de} ? (un mot)`, placeholder: FORMES_PH, misconceptions: [
        mc(R.nom, 'mc:conversion-inversee', 'notion', 'C’est l’énergie reçue ; on demande l’énergie fournie, celle qui est utile.'),
        mc('thermique', 'mc:perdue-utile', 'notion', 'L’énergie thermique est ici de l’énergie perdue (le convertisseur chauffe) : ce n’est pas l’énergie utile.')] }),
      numeric(perdue, { prompt: `Quelle énergie est perdue ${C.base}, en J ?`, unit: 'J', misconceptions: [
        mc(clean(E + U), 'mc:bilan-addition', 'raisonnement', BILAN), mc(U, 'mc:utile-perdue', 'lecture', 'Ça, c’est l’énergie utile ; l’énergie perdue est ce qui manque pour arriver à l’énergie reçue.')] }),
      text(FORMES.thermique.accept, { prompt: 'Sous quelle forme cette énergie perdue part-elle surtout dans l’environnement ? (un mot)', placeholder: FORMES_PH,
        misconceptions: ['détruite', 'aucune', 'elle disparaît', 'elle disparait', 'rien'].map((a) => mc(a, 'mc:energie-detruite', 'notion', 'L’énergie ne disparaît pas : la partie « perdue » devient surtout de l’énergie thermique (le convertisseur chauffe), qui se disperse dans l’air.')) }),
    ], {
      prompt: `${who} ${C.scene}. ${cap(C.base)}, ce convertisseur reçoit ${fr(E)} J d’énergie et en fournit ${fr(U)} J sous forme utile ; le reste est perdu.`,
      hints: ['Un convertisseur reçoit une forme d’énergie et en fournit une autre.', 'Énergie reçue = énergie utile + énergie perdue.', 'Un convertisseur qui fonctionne chauffe un peu.'],
      solution: `Ce convertisseur reçoit de l’énergie ${R.nom} et fournit de l’énergie ${F.nom} (utile). Énergie perdue : ${fr(E)} − ${fr(U)} = ${fr(perdue)} J, surtout sous forme d’énergie thermique dispersée dans l’air : elle n’est pas détruite.`,
      expectedSeconds: 300,
    });
  },
  approfondissement(rand, who) {
    const C = pick(rand, CHAINES); const R = FORMES[C.recu]; const F = FORMES[C.utile];
    const [E1, p1, p2] = until(() => [pick(rand, C.E1), pick(rand, C.p1), pick(rand, C.p2)], ([e, a, b]) => isInt((e * a) / 100) && isInt((e * a * b) / 1e4, 1));
    const E2 = clean((E1 * p1) / 100); const E3 = clean((E2 * p2) / 100); const pct = clean((p1 * p2) / 100);
    return problem([
      numeric(E2, { prompt: `Quelle énergie électrique arrive ${C.a2} ${C.base}, en J ?`, unit: 'J', misconceptions: [
        mc(clean(E1 - E2), 'mc:utile-perdue', 'lecture', `Ça, c’est l’énergie perdue par ${C.c1}. Calcule ${p1} % de ${fr(E1)} J.`),
        mc(clean((E1 * 100) / p1), 'mc:pourcentage-sens', 'raisonnement', `Un convertisseur fournit moins que ce qu’il reçoit : prends ${p1} % de l’énergie reçue.`)] }),
      numeric(E3, { prompt: `Quelle énergie utile (${F.nom}) obtient-on à la sortie ${C.de2}, en J ?`, unit: 'J', misconceptions: [
        mc(clean((E1 * p2) / 100), 'mc:mauvaise-reference', 'raisonnement', `Le pourcentage de ${C.c2} s’applique à l’énergie reçue par ${C.c2} (${fr(E2)} J), pas à l’énergie de départ.`)] }),
      numeric(clean(E1 - E3), { prompt: 'Quelle énergie a été perdue en tout dans la chaîne, en J ?', unit: 'J', misconceptions: [
        mc(clean(E2 - E3), 'mc:perte-partielle', 'raisonnement', 'Compte les pertes des deux convertisseurs.'), mc(clean(E1 - E2), 'mc:perte-partielle', 'raisonnement', 'Compte les pertes des deux convertisseurs.')] }),
      numeric(pct, { prompt: 'Quel pourcentage de l’énergie de départ devient de l’énergie utile à la fin (en %) ?', misconceptions: [
        mc(clean((p1 + p2) / 2), 'mc:moyenne-pourcentages', 'raisonnement', `Les pourcentages ne se moyennent pas : calcule ${fr(E3)} ÷ ${fr(E1)} × 100.`),
        mc(p2, 'mc:dernier-convertisseur', 'raisonnement', 'Ce pourcentage ne concerne que le dernier convertisseur ; compare l’énergie utile finale à l’énergie de départ.')] }),
    ], {
      prompt: `${C.scene(who)} ${cap(C.base)}, ${C.c1} reçoit ${fr(E1)} J d’énergie ${R.nom} et en convertit ${p1} % en énergie électrique ; ${C.c2} convertit ${p2} % de l’énergie électrique reçue en énergie ${F.nom} utile.`,
      hints: [`${p1} % de ${fr(E1)} J = ${fr(E1)} × ${p1} ÷ 100.`, 'Le second pourcentage s’applique à l’énergie qui arrive au second convertisseur.', 'Pourcentage final = énergie utile finale ÷ énergie de départ × 100.'],
      solution: `${fr(E1)} × ${p1} ÷ 100 = ${fr(E2)} J d’énergie électrique ; ${fr(E2)} × ${p2} ÷ 100 = ${fr(E3)} J d’énergie ${F.nom} utile. Pertes : ${fr(E1)} − ${fr(E3)} = ${fr(E1 - E3)} J (surtout thermiques). Part utile : ${fr(E3)} ÷ ${fr(E1)} × 100 = ${fr(pct)} %.`,
      expectedSeconds: 420,
    });
  },
  expert(rand, who) {
    const C = pick(rand, CHAINES); const R = FORMES[C.recu]; const F = FORMES[C.utile];
    const [E3, p1, p2] = until(() => [pick(rand, C.E3), pick(rand, C.p1), pick(rand, C.p2)], ([e, a, b]) => isInt((e * 100) / b) && isInt((e * 1e4) / (a * b)));
    const E2 = clean((E3 * 100) / p2); const E1 = clean((E2 * 100) / p1);
    // la publicité : tantôt impossible (énergie créée), tantôt plausible (un peu moins de pertes)
    const triche = rand() < 0.5; const mieux = p1 + 5;
    const pub = triche
      ? yesNo(false, `Une publicité affirme qu’un nouveau modèle de ${C.nom1} fournit plus d’énergie électrique qu’il n’en reçoit. Est-ce possible ? (oui ou non)`, 'mc:energie-creee', 'notion',
        'L’énergie ne se crée pas : un convertisseur fournit au plus l’énergie qu’il reçoit, et en pratique moins, car une partie devient de l’énergie thermique.')
      : yesNo(true, `Une publicité affirme qu’un nouveau modèle de ${C.nom1} convertit ${mieux} % de l’énergie reçue en énergie électrique, au lieu de ${p1} %. Est-ce possible ? (oui ou non)`, 'mc:pertes-reduites', 'raisonnement',
        `C’est possible : ${mieux} % reste inférieur à 100 %, le nouveau modèle fournit toujours moins d’énergie qu’il n’en reçoit ; il perd simplement un peu moins d’énergie thermique.`);
    const verdictPub = triche ? 'La publicité est fausse : l’énergie ne se crée pas.' : `La publicité est plausible : ${mieux} % reste inférieur à 100 %, aucune énergie n’est créée.`;
    return problem([
      numeric(E2, { prompt: `Quelle énergie électrique doit arriver ${C.a2} pour obtenir ces ${fr(E3)} J, en J ?`, unit: 'J', misconceptions: [
        mc(clean((E3 * p2) / 100), 'mc:pourcentage-sens', 'raisonnement', `${fr(E3)} J ne représente que ${p2} % de l’énergie reçue : l’énergie reçue est donc plus grande. E = ${fr(E3)} × 100 ÷ ${p2}.`)] }),
      numeric(E1, { prompt: `Quelle énergie ${R.nom} faut-il fournir ${C.a1}, en J ?`, unit: 'J', misconceptions: [
        mc(clean((E3 * 100) / p1), 'mc:convertisseur-oublie', 'raisonnement', 'Il y a deux convertisseurs : remonte la chaîne étape par étape, à partir de l’énergie électrique trouvée.'),
        mc(clean((E2 * p1) / 100), 'mc:pourcentage-sens', 'raisonnement', `L’énergie électrique ne représente que ${p1} % de l’énergie reçue par ${C.c1} : divise par ${p1} et multiplie par 100.`)] }),
      numeric(clean(E1 - E3), { prompt: 'Quelle énergie est perdue en tout dans la chaîne, en J ?', unit: 'J', misconceptions: [
        mc(clean(E1 + E3), 'mc:bilan-addition', 'raisonnement', BILAN), mc(clean(E1 - E2), 'mc:perte-partielle', 'raisonnement', 'Compte les pertes des deux convertisseurs.')] }),
      pub,
    ], {
      prompt: `${C.scene(who)} On veut obtenir ${fr(E3)} J d’énergie ${F.nom} utile ${C.base}. ${cap(C.c1)} convertit ${p1} % de l’énergie reçue en énergie électrique ; ${C.c2} convertit ${p2} % de l’énergie électrique reçue en énergie ${F.nom}.`,
      hints: ['Remonte la chaîne en partant de la fin.', `${fr(E3)} J, c’est ${p2} % de l’énergie reçue par ${C.c2} : énergie reçue = ${fr(E3)} × 100 ÷ ${p2}.`, 'Énergie perdue = énergie de départ − énergie utile finale.'],
      solution: `Énergie électrique nécessaire : ${fr(E3)} × 100 ÷ ${p2} = ${fr(E2)} J. Énergie ${R.nom} à fournir : ${fr(E2)} × 100 ÷ ${p1} = ${fr(E1)} J. Pertes : ${fr(E1)} − ${fr(E3)} = ${fr(E1 - E3)} J, surtout thermiques. ${verdictPub}`,
      justify: { prompt: 'Explique comment tu as remonté la chaîne, puis si la publicité peut dire vrai.', minWords: 15, keywords: ['convertit', 'perdue', 'thermique', 'reçoit', 'crée', 'pourcentage'],
        example: `Les ${fr(E3)} J utiles ne sont que ${p2} % de l’énergie électrique, donc il en faut ${fr(E2)} J, qui ne sont que ${p1} % de l’énergie reçue au départ : ${fr(E1)} J. À chaque étape une partie devient thermique. ${verdictPub}` },
      expectedSeconds: 480,
    });
  },
};
export const PROBLEMES_PC_2 = [
  { id: 'p-pc-astronaute', subject: 'pc', label: 'Problème : l’astronaute et son équipement', skill: 'pc.interactions.poids', skills: ['pc4.interactions.forces'], levels: ['4e', '3e'], tracks: TROIS,
    description: 'Poids et masse sur la Terre, la Lune et Mars. ◆ échantillon pesé au dynamomètre sur un autre astre ; ✦ le treuil peut-il soulever la charge ?', make: tiered(ASTRONAUTE) },
  { id: 'p-pc-dissolution', subject: 'pc', label: 'Problème : dissoudre du sel ou du sucre', skill: 'pc5.matiere.melanges', skills: [], levels: ['5e'], tracks: TROIS,
    description: 'Conservation de la masse lors d’une dissolution, solubilité proportionnelle au volume d’eau, solution saturée. ◆ dépôt et eau à ajouter ; ✦ le sirop qui refroidit.', make: tiered(DISSOLUTION) },
  { id: 'p-pc-combustion', subject: 'pc', label: 'Problème : combustions et conservation de la masse', skill: 'pc4.matiere.transformations', skills: ['pc4.matiere.atomes-molecules'], levels: ['4e'], tracks: TROIS,
    description: 'Réactifs, produits et conservation de la masse. ◆ équation fournie, proportionnalité des masses et atomes ; ✦ la paille de fer dont la masse augmente.', make: tiered(COMBUSTION) },
  { id: 'p-pc-lumiere-soleil', subject: 'pc', label: 'Problème : combien de temps met la lumière ?', skill: 'pc.signaux.propagation', skills: ['pc.mouvement.vitesse'], levels: ['4e'], tracks: TROIS,
    description: 'Lumière à 3 × 10⁵ km/s et distances du système solaire, puissances de 10. ◆ messages radio vers une sonde ; ✦ éruption solaire : lumière ou particules, quelle avance ?', make: tiered(LUMIERE) },
  { id: 'p-pc-chaine-energie', subject: 'pc', label: 'Problème : la chaîne d’énergie d’un vélo à dynamo ou d’une éolienne', skill: 'pc5.energie.conversions', skills: [], levels: ['5e'], tracks: TROIS,
    description: 'Formes d’énergie reçue, utile et perdue d’un convertisseur. ◆ deux convertisseurs à la suite et pourcentage utile ; ✦ remonter la chaîne et démasquer une publicité impossible.', make: tiered(ENERGIE) },
];
