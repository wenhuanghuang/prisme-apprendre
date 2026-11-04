/**
 * Physique-chimie de seconde : générateurs rattachés aux chapitres du programme (parcours de référence pc-2nde).
 * Calculs (concentration, mole, loi d'Ohm, vitesse, poids, fréquence, vergence, réfraction) avec les erreurs
 * typiques reconnues — unités non converties, formule inversée — et questions de cours à choix expliquées.
 */
import { pick, sample, ri, numeric, text, mc, fr, roundTo, roundedTo } from './gen-util.js';
import { qcm } from './primaire-savoirs.js';

const GEN = [];
function add(g) {
  const { make, ...rest } = g;
  GEN.push({ tracks: ['classe', 'approfondissement'], options: [], levels: ['2nde'], subject: 'pc', ...rest, make(rand, o = {}, tier = 'classe') { return make(rand, tier !== 'classe'); } });
}
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'; const SUB = '₀₁₂₃₄₅₆₇₈₉';
const sup = (n) => String(n).split('').map((d) => SUP[d]).join('');
const sub = (n) => String(n).split('').map((d) => SUB[d]).join('');
const nuclide = (sym, A, Z) => `${sup(A)}${sub(Z)}${sym}`;
// H2O → H₂O : seuls les chiffres collés à une lettre sont des indices (« 2 H2O » garde son coefficient 2)
const mol = (f) => f.replace(/([A-Za-z)])(\d+)/g, (m, c, d) => c + sub(d));
const sci = (x) => { const e = Math.floor(Math.log10(x)); return `${fr(roundTo(x / 10 ** e, 3))} × 10${e < 0 ? '⁻' : ''}${sup(Math.abs(e))}`; };

/* ------------------------------ Solutions, corps purs ------------------------------ */

add({
  id: 'l2pc-solutions', label: 'Solutions : concentration en masse, dilution, masse volumique', skill: 'l2pc.solutions', chapters: ['2nde-pc-solutions', '2nde-pc-corps-purs'],
  description: 'Cm = m / V, masse à peser, volume de solution mère pour une dilution, masse volumique d’un corps pur.',
  make(rand, hard) {
    const k = pick(rand, hard ? ['cm', 'masse', 'dilution', 'rho'] : ['cm', 'cm', 'masse', 'dilution']);
    const V = pick(rand, [100, 200, 250, 500]); // mL
    if (k === 'cm') {
      const cm = ri(rand, 2, 40); const m = (cm * V) / 1000;
      return numeric(cm, { prompt: `On dissout ${fr(m)} g de sucre dans de l’eau pour obtenir ${V} mL de solution. Quelle est la concentration en masse du sucre, en g/L ?`, unit: 'g/L', unitOptional: true,
        misconceptions: [mc(roundTo(m / V, 4), 'mc:volume-ml', 'unite', `Le volume doit être en litres : ${V} mL = ${fr(V / 1000)} L.`)], expectedSeconds: 60,
        hints: ['Cm = m / V, avec V en litres.'], solution: `Cm = ${fr(m)} g / ${fr(V / 1000)} L = ${cm} g/L`, representation: 'symbolique' });
    }
    if (k === 'masse') {
      const cm = ri(rand, 2, 30); const m = (cm * V) / 1000;
      return numeric(m, { prompt: `Quelle masse de sel faut-il peser pour préparer ${V} mL d’une solution de concentration en masse ${cm} g/L ?`, unit: 'g', unitOptional: true,
        misconceptions: [mc(cm * V, 'mc:volume-ml', 'unite', `Le volume doit être en litres : ${V} mL = ${fr(V / 1000)} L.`)], expectedSeconds: 60,
        hints: ['m = Cm × V, avec V en litres.'], solution: `m = ${cm} g/L × ${fr(V / 1000)} L = ${fr(m)} g`, representation: 'symbolique' });
    }
    if (k === 'dilution') {
      const F = pick(rand, [2, 4, 5, 10, 20]); const Vf = pick(rand, [100, 200, 500].filter((v) => v % F === 0)); const C0 = F * ri(rand, 1, 5);
      return numeric(Vf / F, { prompt: `On veut préparer ${Vf} mL d’une solution fille de concentration ${fr(C0 / F)} g/L à partir d’une solution mère à ${C0} g/L. Quel volume de solution mère faut-il prélever, en mL ?`, unit: 'mL', unitOptional: true,
        misconceptions: [mc(Vf * F, 'mc:dilution-inverse', 'notion', 'La solution mère est plus concentrée : on en prélève MOINS que le volume final (Cmère × Vmère = Cfille × Vfille).')], expectedSeconds: 75, difficulty: 3,
        hints: ['La masse de soluté se conserve : Cmère × Vmère = Cfille × Vfille.', `Le facteur de dilution vaut ${C0} / ${fr(C0 / F)} = ${F}.`], solution: `Vmère = Cfille × Vfille / Cmère = ${fr(C0 / F)} × ${Vf} / ${C0} = ${fr(Vf / F)} mL`, representation: 'symbolique' });
    }
    const [name, rho] = pick(rand, [['l’éthanol', 0.79], ['l’eau', 1.0], ['le cyclohexane', 0.78], ['l’huile d’olive', 0.92], ['le glycérol', 1.26]]);
    const vol = pick(rand, [10, 20, 25, 50]); const m = roundTo(rho * vol, 2);
    return numeric(rho, { prompt: `Un échantillon de ${vol} mL d’un liquide incolore a une masse de ${fr(m)} g. Quelle est sa masse volumique, en g/mL ? (Ce liquide est ${name}.)`, unit: 'g/mL', unitOptional: true, ...roundedTo(2),
      misconceptions: [mc(roundTo(vol / m, 2), 'mc:rho-inverse', 'notion', 'ρ = m / V : la masse divisée par le volume.')].filter((x) => Math.abs(x.answer - rho) > 0.02), expectedSeconds: 45,
      hints: ['ρ = m / V.'], solution: `ρ = ${fr(m)} g / ${vol} mL = ${fr(rho)} g/mL`, representation: 'symbolique' });
  },
});

/* ------------------------------ Atome, noyau, transformations nucléaires ------------------------------ */

const NUCLIDES = [['C', 12, 6, 'carbone'], ['C', 14, 6, 'carbone'], ['N', 14, 7, 'azote'], ['O', 16, 8, 'oxygène'], ['Na', 23, 11, 'sodium'], ['Mg', 24, 12, 'magnésium'], ['Al', 27, 13, 'aluminium'],
  ['Cl', 35, 17, 'chlore'], ['Cl', 37, 17, 'chlore'], ['K', 39, 19, 'potassium'], ['Ca', 40, 20, 'calcium'], ['Fe', 56, 26, 'fer'], ['Cu', 63, 29, 'cuivre'], ['U', 235, 92, 'uranium'], ['U', 238, 92, 'uranium']];
const IONS = [['Na⁺', 11, 1, 'sodium'], ['Cl⁻', 17, -1, 'chlorure'], ['Mg²⁺', 12, 2, 'magnésium'], ['O²⁻', 8, -2, 'oxyde'], ['Ca²⁺', 20, 2, 'calcium'], ['Al³⁺', 13, 3, 'aluminium'], ['S²⁻', 16, -2, 'sulfure'], ['K⁺', 19, 1, 'potassium'], ['F⁻', 9, -1, 'fluorure']];
const NUC_EQ = [
  ['²³⁵₉₂U + ¹₀n → ¹⁴¹₅₆Ba + ⁹²₃₆Kr + x ¹₀n', 3, 'Conservation du nombre de nucléons : 235 + 1 = 141 + 92 + x, donc x = 3.'],
  ['²³⁵₉₂U + ¹₀n → ¹⁴⁰₅₄Xe + ⁹⁴₃₈Sr + x ¹₀n', 2, 'Conservation du nombre de nucléons : 235 + 1 = 140 + 94 + x, donc x = 2.'],
];
add({
  id: 'l2pc-atome', label: 'Le noyau de l’atome, les ions, les réactions nucléaires', skill: 'l2pc.atome', chapters: ['2nde-pc-atome', '2nde-pc-nucleaire'],
  description: 'Protons, neutrons et électrons à partir de la notation A et Z ; électrons d’un ion ; conservation dans une équation nucléaire.',
  make(rand) {
    const k = pick(rand, ['neutrons', 'neutrons', 'ion', 'nucleaire', 'qcm']);
    if (k === 'neutrons') {
      const [s, A, Z, name] = pick(rand, NUCLIDES);
      return numeric(A - Z, { prompt: `Le noyau d’un atome de ${name} est noté ${nuclide(s, A, Z)} (nombre de masse A = ${A}, numéro atomique Z = ${Z}). Combien contient-il de neutrons ?`,
        misconceptions: [mc(A, 'mc:neutrons-A', 'notion', 'A compte tous les nucléons (protons ET neutrons) : N = A − Z.'), mc(A + Z, 'mc:neutrons-somme', 'notion', 'N = A − Z : on retire les protons au nombre total de nucléons.')], expectedSeconds: 40,
        hints: ['A = nombre de nucléons (protons + neutrons), Z = nombre de protons.'], solution: `N = A − Z = ${A} − ${Z} = ${A - Z} neutrons.`, representation: 'symbolique' });
    }
    if (k === 'ion') {
      const [f, Z, q, name] = pick(rand, IONS);
      return numeric(Z - q, { prompt: `Combien d’électrons possède l’ion ${name} ${f} ? (Numéro atomique de l’élément : Z = ${Z}.)`,
        misconceptions: [mc(Z, 'mc:ion-electrons-Z', 'notion', 'Seul l’atome neutre a Z électrons : l’ion en a gagné ou perdu.'), mc(Z + q, 'mc:ion-signe', 'signe', `Un ion ${q > 0 ? 'positif a PERDU' : 'négatif a GAGNÉ'} des électrons.`)].filter((m) => m.answer !== Z - q), expectedSeconds: 45,
        hints: [`L’atome neutre a ${Z} électrons ; la charge ${q > 0 ? '+' : '−'}${Math.abs(q) > 1 ? Math.abs(q) : ''} indique combien il en a ${q > 0 ? 'perdu' : 'gagné'}.`], solution: `${Z} ${q > 0 ? '−' : '+'} ${Math.abs(q)} = ${Z - q} électrons.`, representation: 'symbolique' });
    }
    if (k === 'nucleaire') {
      const [eq, x, why] = pick(rand, NUC_EQ);
      return numeric(x, { prompt: `Dans la réaction de fission ${eq}, combien de neutrons (x) sont libérés ?`, expectedSeconds: 60,
        hints: ['Dans une réaction nucléaire, le nombre de nucléons (en haut) et le nombre de charges (en bas) se conservent.'], solution: why, representation: 'symbolique' });
    }
    return qcm(rand, pick(rand, [
      ['Où est concentrée presque toute la masse d’un atome ?', 'dans son noyau', ['dans ses électrons', 'répartie uniformément dans tout l’atome', 'dans le vide entre le noyau et les électrons'], 'Les nucléons sont environ 2 000 fois plus lourds que les électrons : la masse est dans le noyau, minuscule.'],
      ['Un atome est électriquement neutre car…', 'il a autant d’électrons que de protons', ['il a autant de neutrons que de protons', 'ses neutrons annulent la charge des électrons', 'son noyau n’a pas de charge'], 'Chaque proton porte une charge +e et chaque électron une charge −e : Z protons, Z électrons.'],
      ['Deux isotopes d’un même élément ont…', 'le même nombre de protons mais pas le même nombre de neutrons', ['le même nombre de neutrons mais pas de protons', 'le même nombre de masse', 'des numéros atomiques différents'], 'Exemple : le carbone 12 et le carbone 14 ont tous deux 6 protons, mais 6 et 8 neutrons.'],
      ['Dans l’équation ²³⁸₉₂U → ²³⁴₉₀Th + X, la particule X est…', 'un noyau d’hélium ⁴₂He', ['un neutron ¹₀n', 'un électron', 'un proton ¹₁p'], 'Conservation : 238 = 234 + 4 nucléons et 92 = 90 + 2 charges : c’est ⁴₂He (désintégration alpha).'],
      ['Dans les étoiles comme le Soleil, l’énergie vient…', 'de la fusion de noyaux légers', ['de la fission de noyaux d’uranium', 'de la combustion du charbon', 'de réactions chimiques avec le dioxygène'], 'Au cœur du Soleil, des noyaux d’hydrogène fusionnent pour former de l’hélium en libérant de l’énergie.'],
    ]));
  },
});

/* ------------------------------ Cortège électronique, stabilité ------------------------------ */

const ELEMENTS = ['', 'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar'];
const NAMES = ['', 'hydrogène', 'hélium', 'lithium', 'béryllium', 'bore', 'carbone', 'azote', 'oxygène', 'fluor', 'néon', 'sodium', 'magnésium', 'aluminium', 'silicium', 'phosphore', 'soufre', 'chlore', 'argon'];
function config(Z) {
  const shells = [['1s', 2], ['2s', 2], ['2p', 6], ['3s', 2], ['3p', 6]];
  const out = []; let left = Z;
  for (const [n, cap] of shells) { if (left <= 0) break; const e = Math.min(cap, left); out.push([n, e]); left -= e; }
  return out;
}
const valence = (Z) => (Z <= 2 ? Z : Z <= 10 ? Z - 2 : Z - 10);
const periodOf = (Z) => (Z <= 2 ? 1 : Z <= 10 ? 2 : 3);
const ION_OF = { 3: 'Li⁺', 4: 'Be²⁺', 9: 'F⁻', 8: 'O²⁻', 11: 'Na⁺', 12: 'Mg²⁺', 13: 'Al³⁺', 16: 'S²⁻', 17: 'Cl⁻' };
const BONDS = [['H', 'hydrogène', 1], ['C', 'carbone', 4], ['N', 'azote', 3], ['O', 'oxygène', 2], ['Cl', 'chlore', 1]];
add({
  id: 'l2pc-cortege', label: 'Cortège électronique, tableau périodique, ions et liaisons', skill: 'l2pc.cortege', chapters: ['2nde-pc-cortege', '2nde-pc-stabilite'],
  description: 'Configuration électronique (Z ≤ 18), électrons de valence, période ; ion monoatomique stable, nombre de liaisons covalentes.',
  make(rand, hard) {
    const k = pick(rand, hard ? ['config', 'valence', 'ion', 'liaisons'] : ['valence', 'periode', 'ion', 'liaisons', 'config']);
    const Z = ri(rand, 3, 18);
    if (k === 'config') {
      const c = config(Z);
      const plain = c.map(([n, e]) => `${n}${e}`); const pretty = c.map(([n, e]) => `${n}${sup(e)}`);
      return text([plain.join(' '), plain.join(''), pretty.join(' '), pretty.join(''), plain.join(', ')], {
        prompt: `Écris la configuration électronique de l’atome de ${NAMES[Z]} (Z = ${Z}). (Exemple pour Z = 7 : 1s2 2s2 2p3.)`, expectedSeconds: 60,
        hints: ['On remplit dans l’ordre 1s (2 électrons au plus), 2s (2), 2p (6), 3s (2), 3p (6).'], solution: `${NAMES[Z]} (Z = ${Z}) : ${pretty.join(' ')}`, representation: 'symbolique' });
    }
    if (k === 'valence') {
      return numeric(valence(Z), { prompt: `Combien l’atome de ${NAMES[Z]} (Z = ${Z}) a-t-il d’électrons de valence ?`, misconceptions: valence(Z) !== Z ? [mc(Z, 'mc:valence-Z', 'notion', 'Les électrons de valence sont ceux de la dernière couche seulement.')] : [], expectedSeconds: 45,
        hints: ['Écris la configuration électronique, puis compte les électrons de la couche la plus externe.'], solution: `${config(Z).map(([n, e]) => `${n}${sup(e)}`).join(' ')} : ${valence(Z)} électron${valence(Z) > 1 ? 's' : ''} sur la dernière couche (n = ${periodOf(Z)}).`, representation: 'symbolique' });
    }
    if (k === 'periode') {
      return numeric(periodOf(Z), { prompt: `Dans quelle période (ligne) du tableau périodique se trouve le ${NAMES[Z]} (Z = ${Z}) ?`, expectedSeconds: 40,
        hints: ['La période correspond au numéro de la dernière couche occupée.'], solution: `${config(Z).map(([n, e]) => `${n}${sup(e)}`).join(' ')} : dernière couche n = ${periodOf(Z)}, période ${periodOf(Z)}.`, representation: 'symbolique' });
    }
    if (k === 'ion') {
      const z = pick(rand, Object.keys(ION_OF).map(Number)); const good = ION_OF[z]; const s = ELEMENTS[z];
      const others = [`${s}⁺`, `${s}⁻`, `${s}²⁺`, `${s}²⁻`, `${s}³⁺`].filter((x) => x !== good);
      return qcm(rand, [`Quel ion monoatomique stable l’atome de ${NAMES[z]} (Z = ${z}) forme-t-il ?`, good, others,
        `Le ${NAMES[z]} ${good.includes('⁺') ? 'perd' : 'gagne'} des électrons pour avoir la configuration électronique du gaz noble le plus proche (règle du duet ou de l’octet) : ${good}.`], { hint: 'Compte ses électrons de valence : est-il plus facile d’en perdre ou d’en gagner pour avoir une couche externe pleine ?' });
    }
    const [s, name, n] = pick(rand, BONDS);
    return numeric(n, { prompt: `Combien de liaisons covalentes l’atome de ${name} (${s}) établit-il en général dans une molécule ?`, expectedSeconds: 40,
      hints: ['Chaque liaison apporte un électron de plus à l’atome : il en faut assez pour compléter sa couche externe (duet pour H, octet pour les autres).'], solution: `${name} : ${n} liaison${n > 1 ? 's' : ''} pour atteindre ${s === 'H' ? 'le duet' : 'l’octet'}.`, representation: 'symbolique' });
  },
});

/* ------------------------------ La mole ------------------------------ */

const SPECIES = [['H2O', 18, 'eau'], ['CO2', 44, 'dioxyde de carbone'], ['O2', 32, 'dioxygène'], ['CH4', 16, 'méthane'], ['NH3', 17, 'ammoniac'], ['C6H12O6', 180, 'glucose'], ['NaCl', 58.5, 'chlorure de sodium'], ['Fe', 56, 'fer']];
const NA = 6.02e23;
add({
  id: 'l2pc-mole', label: 'Compter les entités : la mole', skill: 'l2pc.mole', chapters: ['2nde-pc-mole'],
  description: 'n = m / M, m = n × M, n = N / NA : quantité de matière, masse et nombre d’entités.',
  make(rand) {
    const [f, M, name] = pick(rand, SPECIES);
    const n = pick(rand, [0.1, 0.2, 0.25, 0.5, 1, 1.5, 2, 3, 4]);
    const k = pick(rand, ['n', 'm', 'N']);
    if (k === 'n') {
      const m = roundTo(n * M, 2);
      return numeric(n, { prompt: `Quelle quantité de matière (en mol) y a-t-il dans ${fr(m)} g de ${name} ${mol(f)} ? (Masse molaire : M = ${fr(M)} g/mol.)`, unit: 'mol', unitOptional: true,
        misconceptions: [mc(roundTo(m * M, 2), 'mc:n-produit', 'notion', 'n = m / M : on divise la masse par la masse molaire.')], expectedSeconds: 50,
        hints: ['n = m / M.'], solution: `n = ${fr(m)} / ${fr(M)} = ${fr(n)} mol`, representation: 'symbolique' });
    }
    if (k === 'm') {
      const m = roundTo(n * M, 2);
      return numeric(m, { prompt: `Quelle est la masse de ${fr(n)} mol de ${name} ${mol(f)} ? (M = ${fr(M)} g/mol.)`, unit: 'g', unitOptional: true,
        misconceptions: [mc(roundTo(n / M, 4), 'mc:m-quotient', 'notion', 'm = n × M : la masse est le produit de la quantité de matière par la masse molaire.')].filter((x) => x.answer !== m), expectedSeconds: 50,
        hints: ['m = n × M.'], solution: `m = ${fr(n)} × ${fr(M)} = ${fr(m)} g`, representation: 'symbolique' });
    }
    const nn = ri(rand, 1, 9); const N = nn * NA;
    return numeric(nn, { prompt: `Un échantillon contient ${sci(N)} molécules de ${name}. Quelle est sa quantité de matière, en mol ? (Constante d’Avogadro : NA = 6,02 × 10²³ mol⁻¹.)`, unit: 'mol', unitOptional: true, expectedSeconds: 60,
      hints: ['n = N / NA.'], solution: `n = ${sci(N)} / (6,02 × 10²³) = ${nn} mol`, representation: 'symbolique' });
  },
});

/* ------------------------------ Transformations physiques et chimiques ------------------------------ */

const STATES = [
  ['Le passage de l’état solide à l’état liquide s’appelle…', 'la fusion', ['la solidification', 'la vaporisation', 'la condensation'], 'Fusion : solide → liquide (la glace fond). Elle absorbe de l’énergie.'],
  ['Le passage de l’état liquide à l’état solide s’appelle…', 'la solidification', ['la fusion', 'la liquéfaction', 'la sublimation'], 'Solidification : liquide → solide (l’eau gèle). Elle libère de l’énergie.'],
  ['Le passage de l’état gazeux à l’état liquide s’appelle…', 'la liquéfaction', ['la vaporisation', 'la sublimation', 'la fusion'], 'Liquéfaction : gaz → liquide (la buée sur une vitre froide).'],
  ['Le passage de l’état solide directement à l’état gazeux s’appelle…', 'la sublimation', ['la vaporisation', 'la fusion', 'la liquéfaction'], 'Sublimation : solide → gaz, sans passer par le liquide (la neige carbonique).'],
  ['La fusion de la glace est une transformation…', 'endothermique : elle absorbe de l’énergie', ['exothermique : elle libère de l’énergie', 'qui ne fait intervenir aucune énergie', 'chimique'], 'Pour fondre, la glace doit recevoir de l’énergie thermique : la transformation est endothermique.'],
  ['Une transformation chimique se reconnaît au fait que…', 'de nouvelles espèces chimiques apparaissent', ['l’espèce change seulement d’état', 'la masse totale diminue', 'les atomes disparaissent'], 'Les réactifs sont consommés et de nouveaux produits se forment ; les atomes, eux, se conservent.'],
  ['À quoi sert le chauffage à reflux lors d’une synthèse ?', 'à accélérer la transformation sans perdre de matière', ['à refroidir le mélange', 'à filtrer le produit', 'à identifier le produit'], 'On chauffe pour aller plus vite ; le réfrigérant condense les vapeurs, qui retombent dans le ballon.'],
  ['À quoi sert une chromatographie sur couche mince (CCM) ?', 'à identifier les espèces chimiques d’un mélange', ['à mesurer une masse', 'à chauffer un mélange', 'à mesurer une température de fusion'], 'On compare les taches du mélange à celles d’espèces de référence.'],
];
const EQS = [
  ['CH4 + x O2 → CO2 + 2 H2O', 2, 'Les 4 atomes d’oxygène à droite (2 dans CO₂, 2 dans 2 H₂O) demandent 2 O₂.'],
  ['x H2 + O2 → 2 H2O', 2, '4 atomes d’hydrogène à droite : il faut 2 H₂.'],
  ['C3H8 + x O2 → 3 CO2 + 4 H2O', 5, 'À droite : 3 × 2 + 4 × 1 = 10 atomes d’oxygène, soit 5 O₂.'],
  ['x Mg + O2 → 2 MgO', 2, '2 atomes de magnésium à droite : il faut 2 Mg.'],
  ['N2 + x H2 → 2 NH3', 3, '2 × 3 = 6 atomes d’hydrogène à droite : il faut 3 H₂.'],
  ['4 Fe + x O2 → 2 Fe2O3', 3, '2 × 3 = 6 atomes d’oxygène à droite : il faut 3 O₂.'],
  ['C + x O2 → CO2', 1, 'Deux atomes d’oxygène de chaque côté : le coefficient vaut 1.'],
  ['2 C4H10 + x O2 → 8 CO2 + 10 H2O', 13, 'À droite : 8 × 2 + 10 = 26 atomes d’oxygène, soit 13 O₂.'],
];
add({
  id: 'l2pc-transformations', label: 'Transformations physiques et chimiques', skill: 'l2pc.transformations', chapters: ['2nde-pc-transfo-physique', '2nde-pc-transfo-chimique', '2nde-pc-synthese'],
  description: 'Changements d’état et énergie, ajuster une équation de réaction, réactif limitant, techniques de synthèse.',
  make(rand, hard) {
    const k = pick(rand, hard ? ['ajuster', 'limitant', 'energie', 'qcm'] : ['ajuster', 'ajuster', 'qcm', 'qcm', 'energie']);
    if (k === 'ajuster') {
      const [eq, x, why] = pick(rand, hard ? EQS : EQS.slice(0, 7));
      return numeric(x, { prompt: `Ajuste l’équation de réaction : ${mol(eq).replace(/x /, 'x ')}. Que vaut le coefficient x ?`, expectedSeconds: 60,
        hints: ['Au cours d’une transformation chimique, les atomes de chaque élément se conservent : compte-les de chaque côté.'], solution: why, representation: 'symbolique' });
    }
    if (k === 'energie') {
      const m = pick(rand, [0.1, 0.2, 0.25, 0.5, 1, 1.5, 2]); const L = 334;
      return numeric(roundTo(m * L, 1), { prompt: `Quelle énergie faut-il fournir pour faire fondre ${fr(m)} kg de glace à 0 °C ? (Énergie massique de fusion de la glace : L = 334 kJ/kg.) Réponds en kJ.`, unit: 'kJ', unitOptional: true,
        misconceptions: [mc(roundTo(L / m, 1), 'mc:energie-quotient', 'notion', 'Q = m × L : l’énergie est proportionnelle à la masse.')].filter((x) => x.answer !== roundTo(m * L, 1)), expectedSeconds: 45,
        hints: ['Q = m × L.'], solution: `Q = ${fr(m)} × 334 = ${fr(roundTo(m * L, 1))} kJ`, representation: 'symbolique' });
    }
    if (k === 'limitant') {
      const a = pick(rand, [1, 2, 3, 4, 6]); const b = pick(rand, [1, 2, 3]); // 2 H2 + O2 → 2 H2O
      if (a === 2 * b) return qcm(rand, [`On fait réagir ${a} mol de H₂ avec ${b} mol de O₂ selon 2 H₂ + O₂ → 2 H₂O. Que peut-on dire ?`, 'le mélange est stœchiométrique : les deux réactifs sont entièrement consommés', ['H₂ est le réactif limitant', 'O₂ est le réactif limitant', 'il ne se passe rien'], `Il faut 2 mol de H₂ pour 1 mol de O₂ : ${a} = 2 × ${b}, les proportions sont exactement respectées.`]);
      const lim = a < 2 * b ? 'H₂' : 'O₂';
      return qcm(rand, [`On fait réagir ${a} mol de H₂ avec ${b} mol de O₂ selon 2 H₂ + O₂ → 2 H₂O. Quel est le réactif limitant ?`, lim, [lim === 'H₂' ? 'O₂' : 'H₂', 'aucun : les deux sont entièrement consommés', 'H₂O'],
        `${a} mol de H₂ réagiraient avec ${fr(a / 2)} mol de O₂ ; on en a ${b} : ${lim === 'H₂' ? 'il reste du O₂, H₂ est épuisé le premier' : 'O₂ est épuisé le premier'}.`], { hint: 'Compare n(H₂)/2 et n(O₂)/1 : le plus petit des deux désigne le réactif limitant.' });
    }
    return qcm(rand, pick(rand, STATES));
  },
});

/* ------------------------------ Mouvement, inertie ------------------------------ */

const MOTION = [
  ['Un passager est assis dans un train qui roule. Dans quel référentiel est-il immobile ?', 'dans le référentiel du train', ['dans le référentiel terrestre', 'dans tous les référentiels', 'dans aucun référentiel'], 'Le mouvement dépend du référentiel : le passager ne bouge pas par rapport au train, mais se déplace par rapport au quai.'],
  ['D’après le principe d’inertie, un objet soumis à des forces qui se compensent est…', 'immobile ou en mouvement rectiligne uniforme', ['forcément immobile', 'forcément en train d’accélérer', 'en mouvement circulaire'], 'Si les forces se compensent (ou s’il n’y en a pas), la vitesse ne change pas : ni en valeur, ni en direction.'],
  ['Une balle qui roule sur l’herbe ralentit puis s’arrête. Que peut-on dire des forces qui s’exercent sur elle ?', 'elles ne se compensent pas', ['elles se compensent', 'il n’y a aucune force', 'seul son poids agit'], 'Sa vitesse change : d’après le principe d’inertie, les forces ne se compensent pas (les frottements la freinent).'],
  ['Un mouvement est uniforme lorsque…', 'la valeur de la vitesse reste constante', ['la trajectoire est une droite', 'l’objet est immobile', 'la vitesse augmente régulièrement'], 'Uniforme concerne la valeur de la vitesse ; rectiligne concerne la trajectoire.'],
];
add({
  id: 'l2pc-mouvement', label: 'Décrire un mouvement ; principe d’inertie', skill: 'l2pc.mouvement', chapters: ['2nde-pc-mouvement', '2nde-pc-inertie'],
  description: 'Vitesse moyenne, conversions km/h ↔ m/s, référentiel, principe d’inertie.',
  make(rand) {
    const k = pick(rand, ['vitesse', 'kmh', 'ms', 'qcm']);
    if (k === 'vitesse') {
      const v = pick(rand, [2, 4, 5, 8, 10, 12, 15, 20, 25]); const t = pick(rand, [4, 5, 10, 20, 30, 50, 60]);
      return numeric(v, { prompt: `Un objet parcourt ${v * t} m en ${t} s. Quelle est sa vitesse moyenne, en m/s ?`, unit: 'm/s', unitOptional: true,
        misconceptions: [mc(roundTo(t / (v * t), 4), 'mc:v-inverse', 'notion', 'v = d / t : la distance divisée par la durée.')], expectedSeconds: 40,
        hints: ['v = d / t.'], solution: `v = ${v * t} m / ${t} s = ${v} m/s`, representation: 'symbolique' });
    }
    const v = pick(rand, [5, 10, 15, 20, 25, 30, 35]);
    if (k === 'kmh') {
      return numeric(v * 3.6, { prompt: `Convertis ${v} m/s en km/h.`, unit: 'km/h', unitOptional: true, misconceptions: [mc(roundTo(v / 3.6, 2), 'mc:conversion-inverse', 'unite', 'En 1 h = 3 600 s, on parcourt 3 600 fois plus : on MULTIPLIE par 3,6 pour passer des m/s aux km/h.')], expectedSeconds: 40,
        hints: ['1 m/s = 3 600 m/h = 3,6 km/h.'], solution: `${v} × 3,6 = ${fr(v * 3.6)} km/h`, representation: 'symbolique' });
    }
    if (k === 'ms') {
      return numeric(v, { prompt: `Convertis ${fr(v * 3.6)} km/h en m/s.`, unit: 'm/s', unitOptional: true, misconceptions: [mc(roundTo(v * 3.6 * 3.6, 2), 'mc:conversion-inverse', 'unite', 'Pour passer des km/h aux m/s, on DIVISE par 3,6.')], expectedSeconds: 40,
        hints: ['1 km/h = 1 000 m / 3 600 s : on divise par 3,6.'], solution: `${fr(v * 3.6)} ÷ 3,6 = ${v} m/s`, representation: 'symbolique' });
    }
    return qcm(rand, pick(rand, MOTION));
  },
});

/* ------------------------------ Forces ------------------------------ */

add({
  id: 'l2pc-forces', label: 'Modéliser une action par une force : poids, gravitation', skill: 'l2pc.forces', chapters: ['2nde-pc-forces'],
  description: 'Poids P = m × g sur la Terre et la Lune, masse et poids, actions réciproques, loi de la gravitation.',
  make(rand, hard) {
    const k = pick(rand, ['poids', 'masse', 'qcm']);
    const where = pick(rand, [['sur la Terre', 9.8], ['sur la Lune', 1.6]]);
    if (k === 'poids') {
      const m = pick(rand, [0.5, 2, 5, 10, 20, 45, 60, 75]); const P = roundTo(m * where[1], 1);
      return numeric(P, { prompt: `Quel est le poids, ${where[0]}, d’un objet de masse ${fr(m)} kg ? (g = ${fr(where[1])} N/kg.)`, unit: 'N', unitOptional: true, ...roundedTo(1),
        misconceptions: [mc(m, 'mc:poids-masse', 'notion', 'Le poids est une force (en newtons) : P = m × g, différent de la masse (en kg).')], expectedSeconds: 40,
        hints: ['P = m × g.'], solution: `P = ${fr(m)} × ${fr(where[1])} = ${fr(P)} N`, representation: 'symbolique' });
    }
    if (k === 'masse') {
      const m = pick(rand, [2, 5, 10, 20, 50]); const P = roundTo(m * where[1], 1);
      return numeric(m, { prompt: `Un objet a un poids de ${fr(P)} N ${where[0]} (g = ${fr(where[1])} N/kg). Quelle est sa masse, en kg ?`, unit: 'kg', unitOptional: true, ...roundedTo(1),
        misconceptions: [mc(roundTo(P * where[1], 1), 'mc:masse-produit', 'notion', 'm = P / g : on divise le poids par g.')], expectedSeconds: 45,
        hints: ['P = m × g, donc m = P / g.'], solution: `m = ${fr(P)} / ${fr(where[1])} = ${fr(m)} kg`, representation: 'symbolique' });
    }
    return qcm(rand, pick(rand, [
      ['Un astronaute part de la Terre vers la Lune. Que devient sa masse ?', 'elle ne change pas', ['elle diminue', 'elle augmente', 'elle devient nulle'], 'La masse mesure la quantité de matière, la même partout ; c’est le poids qui change (g est plus faible sur la Lune).'],
      ['La Terre attire une pomme. La pomme attire-t-elle la Terre ?', 'oui, avec une force de même valeur', ['non, jamais', 'oui, mais beaucoup moins fort', 'seulement quand elle tombe'], 'Principe des actions réciproques : les deux forces ont la même valeur et la même droite d’action, des sens opposés.'],
      ['Si la distance entre deux corps double, la force de gravitation entre eux est…', 'divisée par 4', ['divisée par 2', 'multipliée par 2', 'inchangée'], 'F = G × mA × mB / d² : avec 2d, on divise par 2² = 4.'],
      ['Une force se représente par…', 'un vecteur : direction, sens, valeur et point d’application', ['un simple nombre', 'une courbe', 'une surface'], 'On modélise une action mécanique par une force, représentée par un vecteur.'],
    ]));
  },
});

/* ------------------------------ Le son ------------------------------ */

add({
  id: 'l2pc-son', label: 'Le son : période, fréquence, écho, perception', skill: 'l2pc.son', chapters: ['2nde-pc-son'],
  description: 'f = 1 / T, distance d’un obstacle par l’écho, domaine audible, niveau d’intensité sonore.',
  make(rand) {
    const k = pick(rand, ['frequence', 'echo', 'qcm']);
    if (k === 'frequence') {
      const [T, f] = pick(rand, [[1, 1000], [2, 500], [2.5, 400], [4, 250], [5, 200], [10, 100], [20, 50], [0.5, 2000]]);
      return numeric(f, { prompt: `Un son a une période de ${fr(T)} ms. Quelle est sa fréquence, en Hz ?`, unit: 'Hz', unitOptional: true,
        misconceptions: [mc(roundTo(1 / T, 4), 'mc:periode-ms', 'unite', `La période doit être en secondes : ${fr(T)} ms = ${fr(T / 1000)} s.`)], expectedSeconds: 45,
        hints: ['f = 1 / T, avec T en secondes.'], solution: `f = 1 / ${fr(T / 1000)} s = ${f} Hz`, representation: 'symbolique' });
    }
    if (k === 'echo') {
      const t = pick(rand, [0.2, 0.4, 0.5, 1, 1.2, 1.5, 2]); const d = roundTo((340 * t) / 2, 1);
      return numeric(d, { prompt: `Un randonneur crie face à une falaise et entend l’écho ${fr(t)} s plus tard. À quelle distance est la falaise, en m ? (Vitesse du son dans l’air : 340 m/s.)`, unit: 'm', unitOptional: true,
        misconceptions: [mc(roundTo(340 * t, 1), 'mc:echo-aller-retour', 'notion', 'Le son fait l’aller ET le retour : on divise la distance parcourue par 2.')], expectedSeconds: 60, difficulty: 3,
        hints: ['Le son va jusqu’à la falaise puis revient : distance parcourue = 2 × distance de la falaise.'], solution: `340 × ${fr(t)} = ${fr(340 * t)} m aller-retour, donc ${fr(d)} m.`, representation: 'concrete' });
    }
    return qcm(rand, pick(rand, [
      ['Quel est, à peu près, le domaine des fréquences audibles par l’être humain ?', 'de 20 Hz à 20 000 Hz', ['de 0 Hz à 100 Hz', 'de 1 000 Hz à 1 000 000 Hz', 'de 20 Hz à 200 Hz'], 'En dessous de 20 Hz : infrasons ; au-dessus de 20 kHz : ultrasons.'],
      ['Le son peut-il se propager dans le vide ?', 'non : il a besoin d’un milieu matériel', ['oui, comme la lumière', 'oui, mais plus lentement', 'seulement dans le vide spatial'], 'Le son est une vibration qui se transmet de proche en proche dans l’air, l’eau ou les solides.'],
      ['Un son plus aigu a…', 'une fréquence plus élevée', ['une fréquence plus faible', 'une amplitude plus grande', 'une période plus longue'], 'La hauteur d’un son est liée à sa fréquence : aigu = fréquence élevée.'],
      ['À partir de quel niveau sonore une exposition prolongée devient-elle dangereuse pour l’audition ?', 'environ 85 dB', ['environ 20 dB', 'environ 40 dB', 'seulement au-delà de 200 dB'], 'Au-delà d’environ 85 dB, une exposition longue peut abîmer l’oreille ; vers 120 dB, c’est le seuil de douleur.'],
    ]));
  },
});

/* ------------------------------ Lumière, lentilles ------------------------------ */

add({
  id: 'l2pc-lumiere', label: 'Lumière : réfraction, spectres, lentilles', skill: 'l2pc.lumiere', chapters: ['2nde-pc-lumiere', '2nde-pc-lentilles'],
  description: 'Loi de Snell-Descartes, spectres d’émission, vergence et grandissement d’une lentille mince convergente.',
  make(rand, hard) {
    const k = pick(rand, hard ? ['snell', 'vergence', 'grandissement', 'qcm'] : ['snell', 'vergence', 'qcm', 'qcm']);
    if (k === 'snell') {
      const [mat, n2] = pick(rand, [['l’eau', 1.33], ['le verre', 1.5]]); const i1 = pick(rand, [20, 30, 40, 45, 50, 60]);
      const i2 = roundTo((Math.asin(Math.sin((i1 * Math.PI) / 180) / n2) * 180) / Math.PI, 0);
      return numeric(i2, { prompt: `Un rayon lumineux passe de l’air (n = 1,00) dans ${mat} (n = ${fr(n2)}) avec un angle d’incidence de ${i1}°. Quel est l’angle de réfraction, arrondi au degré ?`, unit: '°', unitOptional: true, ...roundedTo(0),
        misconceptions: [mc(roundTo(i1 / n2, 0), 'mc:snell-angles', 'notion', 'La loi porte sur les sinus des angles : n₁ × sin(i₁) = n₂ × sin(i₂).')].filter((x) => x.answer !== i2), expectedSeconds: 90, difficulty: 3,
        hints: ['n₁ × sin(i₁) = n₂ × sin(i₂), puis utilise la touche arcsin (sin⁻¹) de la calculatrice.'], solution: `sin(i₂) = 1,00 × sin(${i1}°) / ${fr(n2)} ≈ ${fr(roundTo(Math.sin((i1 * Math.PI) / 180) / n2, 3))}, donc i₂ ≈ ${i2}°.`, representation: 'symbolique' });
    }
    if (k === 'vergence') {
      const [f, C] = pick(rand, [[10, 10], [20, 5], [25, 4], [50, 2], [5, 20], [12.5, 8]]);
      return numeric(C, { prompt: `Une lentille convergente a une distance focale f′ = ${fr(f)} cm. Quelle est sa vergence, en dioptries (δ) ?`, unit: 'δ', unitOptional: true,
        misconceptions: [mc(roundTo(1 / f, 4), 'mc:vergence-cm', 'unite', `La distance focale doit être en mètres : ${fr(f)} cm = ${fr(f / 100)} m.`)], expectedSeconds: 45,
        hints: ['C = 1 / f′, avec f′ en mètres.'], solution: `C = 1 / ${fr(f / 100)} m = ${C} δ`, representation: 'symbolique' });
    }
    if (k === 'grandissement') {
      const [oa, oa2] = pick(rand, [[-20, 30], [-30, 15], [-40, 40], [-15, 30], [-60, 20]]);
      const g = roundTo(oa2 / oa, 2);
      return numeric(g, { prompt: `Pour une lentille mince, l’objet est à OA = ${oa} cm et son image à OA′ = ${oa2} cm (distances algébriques). Quel est le grandissement γ = OA′ / OA ?`, expectedSeconds: 60,
        misconceptions: [mc(roundTo(oa / oa2, 2), 'mc:grandissement-inverse', 'notion', 'γ = OA′ / OA : l’image sur l’objet.'), mc(-g, 'mc:grandissement-signe', 'signe', 'Avec des distances algébriques, γ est négatif : l’image est renversée.')].filter((x) => x.answer !== g), hints: ['γ = OA′ / OA ; un γ négatif signifie une image renversée.'],
        solution: `γ = ${oa2} / (${oa}) = ${fr(g)} : l’image est renversée${Math.abs(g) > 1 ? ' et agrandie' : Math.abs(g) < 1 ? ' et plus petite' : ' et de même taille'}.`, representation: 'symbolique' });
    }
    return qcm(rand, pick(rand, [
      ['Quel type de spectre donne la lumière d’une lampe à vapeur de sodium ?', 'un spectre de raies d’émission', ['un spectre continu', 'un spectre de bandes d’absorption', 'aucun spectre'], 'Un gaz excité émet seulement certaines radiations : des raies, caractéristiques de l’élément.'],
      ['Un corps chaud, comme le filament d’une lampe, émet…', 'un spectre continu', ['un spectre de raies', 'aucune lumière visible', 'seulement de la lumière rouge'], 'Plus le corps est chaud, plus son spectre continu s’enrichit vers le bleu.'],
      ['Dans un milieu homogène et transparent, la lumière se propage…', 'en ligne droite', ['en zigzag', 'en cercle', 'seulement vers le bas'], 'C’est la propagation rectiligne de la lumière.'],
      ['Quelle est, environ, la vitesse de la lumière dans le vide ?', '300 000 km/s', ['340 m/s', '300 km/s', '3 000 km/h'], 'c ≈ 3,00 × 10⁸ m/s, soit 300 000 km/s ; 340 m/s est la vitesse du son dans l’air.'],
      ['Dans l’œil, quel élément joue le rôle de la lentille ?', 'le cristallin', ['la rétine', 'la pupille', 'le nerf optique'], 'Le cristallin forme l’image sur la rétine, qui joue le rôle de l’écran.'],
    ]));
  },
});

/* ------------------------------ Électricité ------------------------------ */

add({
  id: 'l2pc-electricite', label: 'Lois de l’électricité : Ohm, nœuds, mailles, capteurs', skill: 'l2pc.electricite', chapters: ['2nde-pc-electricite'],
  description: 'U = R × I, loi des nœuds et loi des mailles, comportement d’un capteur.',
  make(rand) {
    const k = pick(rand, ['ohm-U', 'ohm-I', 'noeuds', 'mailles', 'qcm']);
    if (k === 'ohm-U') {
      const R = pick(rand, [10, 22, 47, 100, 220, 330, 470]); const ImA = pick(rand, [10, 20, 25, 50, 100]); const U = roundTo((R * ImA) / 1000, 2);
      return numeric(U, { prompt: `Un conducteur ohmique de résistance R = ${R} Ω est traversé par un courant d’intensité I = ${ImA} mA. Quelle est la tension à ses bornes, en V ?`, unit: 'V', unitOptional: true,
        misconceptions: [mc(R * ImA, 'mc:ohm-mA', 'unite', `L’intensité doit être en ampères : ${ImA} mA = ${fr(ImA / 1000)} A.`)], expectedSeconds: 45,
        hints: ['Loi d’Ohm : U = R × I, avec I en ampères.'], solution: `U = ${R} × ${fr(ImA / 1000)} = ${fr(U)} V`, representation: 'symbolique' });
    }
    if (k === 'ohm-I') {
      const R = pick(rand, [10, 20, 50, 100, 200]); const I = pick(rand, [0.05, 0.1, 0.2, 0.5]); const U = roundTo(R * I, 2);
      return numeric(I, { prompt: `Une tension de ${fr(U)} V est appliquée à un conducteur ohmique de ${R} Ω. Quelle est l’intensité du courant, en A ?`, unit: 'A', unitOptional: true,
        misconceptions: [mc(roundTo(U * R, 2), 'mc:ohm-produit', 'notion', 'I = U / R : on divise la tension par la résistance.')], expectedSeconds: 45,
        hints: ['U = R × I, donc I = U / R.'], solution: `I = ${fr(U)} / ${R} = ${fr(I)} A`, representation: 'symbolique' });
    }
    if (k === 'noeuds') {
      const I1 = pick(rand, [0.1, 0.15, 0.2, 0.3, 0.45]); const I2 = pick(rand, [0.05, 0.1, 0.25, 0.4]); const I = roundTo(I1 + I2, 2);
      return numeric(I2, { prompt: `À un nœud, un courant de ${fr(I)} A arrive et se partage en deux branches. Dans la première, l’intensité vaut ${fr(I1)} A. Que vaut-elle dans la seconde, en A ?`, unit: 'A', unitOptional: true,
        misconceptions: [mc(roundTo(I + I1, 2), 'mc:noeuds-somme', 'notion', 'Loi des nœuds : la somme des intensités qui partent est égale à celle qui arrive.')], expectedSeconds: 40,
        hints: ['Loi des nœuds : I = I₁ + I₂.'], solution: `I₂ = ${fr(I)} − ${fr(I1)} = ${fr(I2)} A`, representation: 'symbolique' });
    }
    if (k === 'mailles') {
      const UG = pick(rand, [4.5, 6, 9, 12]); const U1 = roundTo(UG * pick(rand, [0.25, 0.4, 0.5, 0.6, 0.75]), 2); const U2 = roundTo(UG - U1, 2);
      return numeric(U2, { prompt: `Un générateur de ${fr(UG)} V alimente deux dipôles en série. La tension aux bornes du premier vaut ${fr(U1)} V. Que vaut-elle aux bornes du second, en V ?`, unit: 'V', unitOptional: true,
        misconceptions: [mc(roundTo(UG + U1, 2), 'mc:mailles-somme', 'notion', 'Loi des mailles : la tension du générateur se partage entre les dipôles en série.')], expectedSeconds: 40,
        hints: ['Loi des mailles : U_G = U₁ + U₂.'], solution: `U₂ = ${fr(UG)} − ${fr(U1)} = ${fr(U2)} V`, representation: 'symbolique' });
    }
    return qcm(rand, pick(rand, [
      ['La résistance d’une thermistance CTN, quand la température augmente…', 'diminue', ['augmente', 'ne change pas', 'devient nulle'], 'CTN : coefficient de température négatif, la résistance baisse quand il fait plus chaud. On s’en sert comme capteur de température.'],
      ['Pour mesurer une tension, on branche le voltmètre…', 'en dérivation, aux bornes du dipôle', ['en série avec le dipôle', 'à la place du générateur', 'n’importe où dans le circuit'], 'Le voltmètre se branche en dérivation ; l’ampèremètre, lui, se branche en série.'],
      ['La caractéristique U = f(I) d’un conducteur ohmique est…', 'une droite qui passe par l’origine', ['une courbe en cloche', 'une droite horizontale', 'une parabole'], 'U = R × I : la tension est proportionnelle à l’intensité.'],
      ['Une photorésistance (LDR) sert de capteur…', 'de lumière', ['de température', 'de son', 'de pression'], 'Sa résistance diminue quand elle reçoit plus de lumière.'],
    ]));
  },
});

export const LYCEE_PC = GEN;
export const LYCEE_PC_SKILLS = [
  ['l2pc.solutions', 'Solutions aqueuses : concentration en masse, dilution ; masse volumique'],
  ['l2pc.atome', 'Le noyau de l’atome, les ions, les transformations nucléaires'],
  ['l2pc.cortege', 'Cortège électronique, tableau périodique, ions stables et liaisons covalentes'],
  ['l2pc.mole', 'Quantité de matière : la mole'],
  ['l2pc.transformations', 'Transformations physiques et chimiques, synthèse'],
  ['l2pc.mouvement', 'Décrire un mouvement ; principe d’inertie'],
  ['l2pc.forces', 'Modéliser une action par une force : poids, gravitation, actions réciproques'],
  ['l2pc.son', 'Émission et perception d’un son'],
  ['l2pc.lumiere', 'Lumière : réfraction, spectres, lentilles minces'],
  ['l2pc.electricite', 'Lois de l’électricité et capteurs'],
].map(([id, label]) => ({ subject: 'pc', id, label, level: '2nde', track: 'classe', status: 'programme', domain: 'lycee', prereqs: [], editorialLevel: true }));
