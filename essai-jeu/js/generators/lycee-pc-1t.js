/**
 * Physique-chimie de première et de terminale (spécialité) : générateurs rattachés aux chapitres des parcours de
 * référence pc-1re et pc-tle. Calculs avec des valeurs choisies pour rester simples, unités vérifiées, erreurs
 * typiques reconnues (unités non converties, formule inversée, facteur oublié), questions de cours expliquées.
 */
import { pick, ri, numeric, mc, fr, roundTo, roundedTo } from './gen-util.js';
import { qcm } from './primaire-savoirs.js';

const GEN = [];
function add(level, g) {
  const { make, ...rest } = g;
  GEN.push({ tracks: ['classe', 'approfondissement'], options: [], levels: [level], subject: 'pc', ...rest, make(rand, o = {}, tier = 'classe') { return make(rand, tier !== 'classe'); } });
}
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const chem = (f) => f.replace(/([A-Za-z)])(\d+)/g, (m, c, d) => c + d.split('').map((x) => SUB[x]).join(''));
const sup = (n) => String(n).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('');
const num = (answer, o) => numeric(answer, { representation: 'symbolique', expectedSeconds: 60, ...o });

/* ================================ PREMIÈRE ================================ */

add('1re', {
  id: 'l1pc-composition', label: 'Composition d’un système : concentration molaire, absorbance', skill: 'l1pc.composition', chapters: ['1re-pc-composition'],
  description: 'c = n / V, n = c × V, dilution, loi de Beer-Lambert A = k × c.',
  make(rand) {
    const k = pick(rand, ['c', 'n', 'beer', 'dilution']);
    const V = pick(rand, [0.1, 0.2, 0.25, 0.5, 1]); // L
    if (k === 'c') {
      const c = pick(rand, [0.01, 0.02, 0.05, 0.1, 0.2, 0.5]); const n = roundTo(c * V, 6);
      return num(c, { prompt: `On dissout ${fr(n)} mol de soluté pour obtenir ${fr(V * 1000)} mL de solution. Quelle est la concentration en quantité de matière, en mol/L ?`, unit: 'mol/L', unitOptional: true,
        misconceptions: [mc(roundTo(n / (V * 1000), 8), 'mc:volume-ml', 'unite', `Le volume doit être en litres : ${fr(V * 1000)} mL = ${fr(V)} L.`)], hints: ['c = n / V, avec V en litres.'], solution: `c = ${fr(n)} / ${fr(V)} = ${fr(c)} mol/L` });
    }
    if (k === 'n') {
      const c = pick(rand, [0.05, 0.1, 0.2, 0.5, 1.5]); const n = roundTo(c * V, 6);
      return num(n, { prompt: `Quelle quantité de matière de soluté contient ${fr(V * 1000)} mL d’une solution à ${fr(c)} mol/L ?`, unit: 'mol', unitOptional: true,
        misconceptions: [mc(roundTo(c * V * 1000, 6), 'mc:volume-ml', 'unite', `Le volume doit être en litres : ${fr(V * 1000)} mL = ${fr(V)} L.`)], hints: ['n = c × V.'], solution: `n = ${fr(c)} × ${fr(V)} = ${fr(n)} mol` });
    }
    if (k === 'beer') {
      const kk = pick(rand, [200, 250, 500, 1000]); const c = pick(rand, [0.0004, 0.0008, 0.001, 0.0012, 0.002]); const A = roundTo(kk * c, 4);
      return num(roundTo(c * 1000, 6), { prompt: `D’après la droite d’étalonnage, A = ${kk} × c (c en mol/L). Une solution a une absorbance A = ${fr(A)}. Quelle est sa concentration, en mmol/L ?`, unit: 'mmol/L', unitOptional: true,
        misconceptions: [mc(roundTo(A * kk, 4), 'mc:beer-produit', 'notion', 'A = k × c, donc c = A / k : on divise.')], hints: ['Loi de Beer-Lambert : A = k × c, donc c = A / k ; 1 mol/L = 1 000 mmol/L.'], solution: `c = ${fr(A)} / ${kk} = ${fr(c)} mol/L = ${fr(roundTo(c * 1000, 4))} mmol/L` });
    }
    const F = pick(rand, [2, 5, 10, 20]); const Vf = pick(rand, [50, 100, 200]);
    return num(Vf / F, { prompt: `On dilue ${F} fois une solution pour préparer ${Vf} mL de solution fille. Quel volume de solution mère faut-il prélever, en mL ?`, unit: 'mL', unitOptional: true,
      misconceptions: [mc(Vf * F, 'mc:dilution-inverse', 'notion', 'La solution mère est plus concentrée : on en prélève moins que le volume final, Vmère = Vfille / F.')], hints: ['Facteur de dilution : F = Vfille / Vmère.'], solution: `Vmère = ${Vf} / ${F} = ${fr(Vf / F)} mL` });
  },
});

const REACTIONS = [['CH4 + 2 O2 → CO2 + 2 H2O', 'CH4', 1, 'O2', 2], ['2 H2 + O2 → 2 H2O', 'H2', 2, 'O2', 1], ['N2 + 3 H2 → 2 NH3', 'N2', 1, 'H2', 3], ['2 Mg + O2 → 2 MgO', 'Mg', 2, 'O2', 1], ['Fe + 2 H+ → Fe2+ + H2', 'Fe', 1, 'H+', 2]];
add('1re', {
  id: 'l1pc-avancement', label: 'Avancement, titrage colorimétrique, oxydoréduction', skill: 'l1pc.avancement', chapters: ['1re-pc-avancement', '1re-pc-titrage', '1re-pc-oxydoreduction'],
  description: 'Avancement maximal et réactif limitant, concentration à l’équivalence d’un titrage, oxydants et réducteurs.',
  make(rand) {
    const k = pick(rand, ['xmax', 'xmax', 'titrage', 'redox']);
    if (k === 'xmax') {
      const [eq, A, a, B, b] = pick(rand, REACTIONS); const nA = pick(rand, [1, 2, 3, 4, 6]); const nB = pick(rand, [1, 2, 3, 4, 6]);
      const xmax = Math.min(nA / a, nB / b);
      return num(roundTo(xmax, 6), { prompt: `Pour la réaction ${chem(eq)}, on part de ${nA} mol de ${chem(A)} et de ${nB} mol de ${chem(B)}. Quel est l’avancement maximal x_max, en mol ?`, unit: 'mol', unitOptional: true, tolerance: 1e-6,
        misconceptions: [mc(Math.min(nA, nB), 'mc:xmax-coefficients', 'notion', 'Il faut tenir compte des nombres stœchiométriques : x_max = min(nA / a ; nB / b).')].filter((m) => Math.abs(m.answer - xmax) > 1e-6), hints: [`Si ${chem(A)} est limitant : ${nA} − ${a}x = 0 ; si ${chem(B)} est limitant : ${nB} − ${b}x = 0. On garde la plus petite valeur.`],
        solution: `${nA}/${a} = ${fr(roundTo(nA / a, 3))} et ${nB}/${b} = ${fr(roundTo(nB / b, 3))} : x_max = ${fr(roundTo(xmax, 3))} mol (réactif limitant : ${nA / a <= nB / b ? chem(A) : chem(B)}).` });
    }
    if (k === 'titrage') {
      const cB = pick(rand, [0.01, 0.02, 0.05, 0.1]); const VE = pick(rand, [8, 10, 12, 12.5, 15, 16, 20]); const VA = pick(rand, [10, 20]);
      const cA = roundTo((cB * VE) / VA, 6);
      return num(cA, { prompt: `On titre VA = ${VA} mL d’une solution par une solution titrante de concentration ${fr(cB)} mol/L (réaction mole à mole). L’équivalence est repérée par le changement de couleur pour VE = ${fr(VE)} mL. Quelle est la concentration de la solution titrée, en mol/L ?`, unit: 'mol/L', unitOptional: true, tolerance: 1e-6,
        misconceptions: [mc(roundTo((cB * VA) / VE, 6), 'mc:titrage-volumes', 'notion', 'À l’équivalence : cA × VA = cB × VE, donc cA = cB × VE / VA.')].filter((m) => Math.abs(m.answer - cA) > 1e-6), hints: ['À l’équivalence, les réactifs ont été introduits dans les proportions stœchiométriques : cA × VA = cB × VE.'], solution: `cA = ${fr(cB)} × ${fr(VE)} / ${VA} = ${fr(cA)} mol/L` });
    }
    return qcm(rand, pick(rand, [
      ['Un oxydant est une espèce capable de…', 'capter un ou plusieurs électrons', ['céder des électrons', 'capter des protons', 'céder des protons'], 'Oxydant : capte des électrons ; réducteur : en cède. (Les protons, c’est l’acide-base.)'],
      ['Quelle est la demi-équation du couple Cu²⁺/Cu ?', 'Cu²⁺ + 2 e⁻ = Cu', ['Cu²⁺ = Cu + 2 e⁻', 'Cu + 2 e⁻ = Cu²⁺', 'Cu²⁺ + e⁻ = Cu'], 'L’oxydant Cu²⁺ capte 2 électrons pour donner le réducteur Cu ; les charges se conservent.'],
      ['Lors d’une oxydation, le réducteur…', 'perd des électrons', ['gagne des électrons', 'gagne des protons', 'ne change pas'], 'Oxydation = perte d’électrons ; réduction = gain d’électrons.'],
      ['Dans un titrage colorimétrique, l’équivalence est repérée…', 'par un changement de couleur du mélange', ['par une explosion', 'par un dégagement de chaleur', 'par une chute de pression'], 'Un réactif coloré (ou un indicateur) change la teinte quand on passe l’équivalence.'],
    ]));
  },
});

add('1re', {
  id: 'l1pc-structure', label: 'Structure, polarité, cohésion, chimie organique', skill: 'l1pc.structure', chapters: ['1re-pc-polarite', '1re-pc-cohesion', '1re-pc-organique', '1re-pc-synthese', '1re-pc-combustions'],
  description: 'Géométrie et polarité des molécules, liaisons hydrogène, groupes caractéristiques, rendement d’une synthèse, énergie d’une combustion.',
  make(rand) {
    const k = pick(rand, ['qcm', 'qcm', 'rendement', 'combustion']);
    if (k === 'rendement') {
      const nmax = pick(rand, [0.1, 0.2, 0.25, 0.5]); const r = pick(rand, [40, 50, 60, 75, 80, 90]); const nobt = roundTo((nmax * r) / 100, 6);
      return num(r, { prompt: `Une synthèse pourrait donner au maximum ${fr(nmax)} mol de produit ; on en obtient ${fr(nobt)} mol. Quel est le rendement, en % ?`, unit: '%', unitOptional: true,
        misconceptions: [mc(roundTo((nmax / nobt) * 100, 2), 'mc:rendement-inverse', 'notion', 'Rendement = quantité obtenue / quantité maximale (toujours ≤ 100 %).')], hints: ['η = n_obtenue / n_max.'], solution: `η = ${fr(nobt)} / ${fr(nmax)} = ${fr(r / 100)}, soit ${r} %` });
    }
    if (k === 'combustion') {
      const [fuel, PC] = pick(rand, [['bois sec', 15], ['charbon', 30], ['éthanol', 30], ['butane', 50], ['essence', 45]]); const m = pick(rand, [0.5, 2, 4, 10]);
      return num(roundTo(m * PC, 3), { prompt: `Le pouvoir calorifique du ${fuel} est d’environ ${PC} MJ/kg. Quelle énergie libère la combustion de ${fr(m)} kg de ${fuel}, en MJ ?`, unit: 'MJ', unitOptional: true,
        misconceptions: [mc(roundTo(PC / m, 3), 'mc:pc-quotient', 'notion', 'E = m × PC : l’énergie est proportionnelle à la masse brûlée.')].filter((x) => x.answer !== roundTo(m * PC, 3)), hints: ['E = m × PC.'], solution: `E = ${fr(m)} × ${PC} = ${fr(roundTo(m * PC, 3))} MJ` });
    }
    return qcm(rand, pick(rand, [
      ['Quelle est la géométrie de la molécule de méthane CH₄ ?', 'tétraédrique', ['linéaire', 'coudée', 'plane carrée'], 'Les quatre doublets liants se repoussent au maximum : tétraèdre.'],
      ['Quelle est la géométrie de la molécule d’eau H₂O ?', 'coudée', ['linéaire', 'tétraédrique', 'pyramidale'], 'Deux doublets liants et deux doublets non liants autour de O : la molécule est coudée.'],
      ['La molécule de CO₂ est-elle polaire ?', 'non : elle est linéaire, les deux liaisons polarisées se compensent', ['oui, car O est électronégatif', 'oui, car elle contient du carbone', 'on ne peut pas le savoir'], 'Liaisons C=O polarisées mais molécule symétrique : barycentres des charges confondus.'],
      ['Pourquoi l’eau a-t-elle une température d’ébullition élevée pour une si petite molécule ?', 'à cause des liaisons hydrogène entre ses molécules', ['parce qu’elle est lourde', 'parce qu’elle est apolaire', 'à cause de liaisons ioniques'], 'Les liaisons hydrogène renforcent la cohésion de l’eau liquide.'],
      ['Le groupe caractéristique –OH est celui de la famille des…', 'alcools', ['acides carboxyliques', 'cétones', 'esters'], 'Alcool : –OH ; acide carboxylique : –COOH ; cétone : C=O dans la chaîne ; ester : –COO–.'],
      ['Sur un spectre infrarouge, une bande large vers 3 300 cm⁻¹ signale…', 'une liaison O–H (alcool)', ['une liaison C=O', 'une liaison C–C', 'un atome de chlore'], 'La liaison O–H associée par liaison hydrogène donne une bande large vers 3 200-3 400 cm⁻¹ ; C=O donne une bande fine vers 1 700 cm⁻¹.'],
      ['Une espèce ionique comme NaCl se dissout bien dans…', 'un solvant polaire comme l’eau', ['un solvant apolaire comme le cyclohexane', 'l’huile', 'aucun solvant'], 'Les ions sont entourés par les molécules polaires d’eau (solvatation).'],
      ['La combustion complète d’un alcane produit…', 'du dioxyde de carbone et de l’eau', ['du monoxyde de carbone seulement', 'du dioxygène', 'de l’hydrogène et du carbone'], 'Avec assez de dioxygène, le carbone devient CO₂ et l’hydrogène H₂O.'],
    ]));
  },
});

add('1re', {
  id: 'l1pc-fluides-champs', label: 'Pression, loi de Mariotte, champs', skill: 'l1pc.fluides', chapters: ['1re-pc-fluides', '1re-pc-champs'],
  description: 'P = F / S, loi de Mariotte, différence de pression dans un liquide, interactions et champs.',
  make(rand) {
    const k = pick(rand, ['pression', 'mariotte', 'statique', 'qcm']);
    if (k === 'pression') {
      const F = pick(rand, [100, 200, 500, 600, 1000]); const S = pick(rand, [0.01, 0.02, 0.05, 0.1]); const P = roundTo(F / S, 6);
      return num(P, { prompt: `Une force de ${F} N s’exerce perpendiculairement sur une surface de ${fr(S)} m². Quelle est la pression, en Pa ?`, unit: 'Pa', unitOptional: true,
        misconceptions: [mc(roundTo(F * S, 6), 'mc:pression-produit', 'notion', 'P = F / S : la force divisée par la surface.')], hints: ['P = F / S, F en N et S en m².'], solution: `P = ${F} / ${fr(S)} = ${fr(P)} Pa` });
    }
    if (k === 'mariotte') {
      const P1 = pick(rand, [100, 120, 150, 200]); const V1 = pick(rand, [20, 30, 40, 60]); const f = pick(rand, [2, 3, 4]); const V2 = V1 / f;
      return num(P1 * f, { prompt: `Un gaz occupe ${V1} mL sous ${P1} kPa. À température constante, on le comprime jusqu’à ${fr(V2)} mL. Quelle est sa nouvelle pression, en kPa ?`, unit: 'kPa', unitOptional: true,
        misconceptions: [mc(roundTo(P1 / f, 4), 'mc:mariotte-sens', 'notion', 'Loi de Mariotte : P × V = constante ; si le volume diminue, la pression augmente.')], hints: ['P₁ × V₁ = P₂ × V₂.'], solution: `P₂ = ${P1} × ${V1} / ${fr(V2)} = ${P1 * f} kPa` });
    }
    if (k === 'statique') {
      const h = pick(rand, [1, 2, 5, 10, 20]); const dP = roundTo(1000 * 9.8 * h, 3);
      return num(dP, { prompt: `Quelle est la différence de pression entre la surface de l’eau et un point situé ${h} m plus bas ? (ρ = 1 000 kg/m³, g = 9,8 N/kg.) Réponds en Pa.`, unit: 'Pa', unitOptional: true,
        hints: ['Loi de la statique des fluides : P_B − P_A = ρ × g × (z_A − z_B).'], solution: `ΔP = 1 000 × 9,8 × ${h} = ${fr(dP)} Pa (environ ${fr(roundTo(dP / 1e5, 2))} bar)` });
    }
    return qcm(rand, pick(rand, [
      ['Si la distance entre deux charges électriques double, la force électrostatique est…', 'divisée par 4', ['divisée par 2', 'multipliée par 2', 'inchangée'], 'Loi de Coulomb : F est proportionnelle à 1/d².'],
      ['Deux charges de même signe…', 'se repoussent', ['s’attirent', 'n’interagissent pas', 's’annulent'], 'Charges de même signe : répulsion ; de signes contraires : attraction.'],
      ['Près de la surface de la Terre, le champ de pesanteur est…', 'quasiment uniforme, vertical et dirigé vers le bas', ['nul', 'horizontal', 'dirigé vers le haut'], 'g ≈ 9,8 N/kg, même direction et même sens partout au voisinage du sol.'],
      ['La pression atmosphérique au niveau de la mer vaut environ…', '1 013 hPa', ['10 Pa', '1 Pa', '100 000 hPa'], 'Environ 1,013 × 10⁵ Pa, soit 1 013 hPa ou 1 bar.'],
    ]));
  },
});

add('1re', {
  id: 'l1pc-energie', label: 'Énergies mécanique et électrique', skill: 'l1pc.energie', chapters: ['1re-pc-energie-mecanique', '1re-pc-mouvement', '1re-pc-energie-electrique'],
  description: 'Énergie cinétique, potentielle, conservation, travail d’une force, puissance et énergie électriques, effet Joule, rendement.',
  make(rand, hard) {
    const k = pick(rand, hard ? ['ec', 'chute', 'travail', 'joule', 'rendement'] : ['ec', 'epp', 'travail', 'puissance', 'rendement']);
    if (k === 'ec') {
      const m = pick(rand, [2, 4, 10, 50, 80, 1000]); const v = pick(rand, [2, 3, 5, 10, 20]); const E = 0.5 * m * v * v;
      return num(E, { prompt: `Quelle est l’énergie cinétique d’un objet de ${m} kg se déplaçant à ${v} m/s ? (En J.)`, unit: 'J', unitOptional: true,
        misconceptions: [mc(m * v * v, 'mc:ec-demi', 'notion', 'Ec = ½ × m × v² : n’oublie pas le ½.'), mc(0.5 * m * v, 'mc:ec-carre', 'notion', 'Ec = ½ m v² : la vitesse est au carré.')], hints: ['Ec = ½ × m × v².'], solution: `Ec = ½ × ${m} × ${v}² = ${fr(E)} J` });
    }
    if (k === 'epp') {
      const m = pick(rand, [1, 2, 5, 10, 60]); const h = pick(rand, [2, 5, 10, 20]); const E = roundTo(m * 9.8 * h, 3);
      return num(E, { prompt: `Quelle est l’énergie potentielle de pesanteur d’un objet de ${m} kg situé ${h} m au-dessus du sol (référence au sol, g = 9,8 N/kg) ? (En J.)`, unit: 'J', unitOptional: true, hints: ['Epp = m × g × h.'], solution: `Epp = ${m} × 9,8 × ${h} = ${fr(E)} J` });
    }
    if (k === 'chute') {
      const h = pick(rand, [5, 10, 20, 45]); const v = roundTo(Math.sqrt(2 * 9.8 * h), 1);
      return num(v, { prompt: `Un objet est lâché sans vitesse d’une hauteur de ${h} m. En négligeant les frottements, avec quelle vitesse touche-t-il le sol ? (g = 9,8 N/kg ; arrondi au dixième, en m/s.)`, unit: 'm/s', unitOptional: true, ...roundedTo(1), difficulty: 3, expectedSeconds: 90,
        misconceptions: [mc(roundTo(2 * 9.8 * h, 1), 'mc:oubli-racine', 'methode', 'v² = 2 g h : il reste à prendre la racine carrée.')], hints: ['Conservation de l’énergie mécanique : m g h = ½ m v², donc v = √(2 g h).'], solution: `v = √(2 × 9,8 × ${h}) ≈ ${fr(v)} m/s` });
    }
    if (k === 'travail') {
      const F = pick(rand, [10, 20, 50, 100, 200]); const d = pick(rand, [2, 5, 10, 25]); const [a, c] = pick(rand, [[0, 1], [60, 0.5], [90, 0]]);
      return num(F * d * c, { prompt: `Une force constante de ${F} N déplace son point d’application de ${d} m ; elle fait un angle de ${a}° avec le déplacement. Quel est son travail, en J ?`, unit: 'J', unitOptional: true,
        misconceptions: c !== 1 ? [mc(F * d, 'mc:travail-cos', 'notion', 'W = F × d × cos(α) : n’oublie pas le cosinus de l’angle.')] : [], hints: ['W = F × d × cos(α).'], solution: `W = ${F} × ${d} × cos(${a}°) = ${fr(F * d * c)} J${c === 0 ? ' : une force perpendiculaire au déplacement ne travaille pas.' : ''}` });
    }
    if (k === 'puissance') {
      const U = pick(rand, [5, 12, 230]); const I = pick(rand, [0.5, 1, 2, 4]); const P = roundTo(U * I, 3);
      return num(P, { prompt: `Un appareil alimenté sous ${U} V est traversé par un courant de ${fr(I)} A. Quelle puissance électrique reçoit-il, en W ?`, unit: 'W', unitOptional: true, hints: ['P = U × I.'], solution: `P = ${U} × ${fr(I)} = ${fr(P)} W` });
    }
    if (k === 'joule') {
      const R = pick(rand, [2, 5, 10, 20, 50]); const I = pick(rand, [0.5, 1, 2, 3]); const P = roundTo(R * I * I, 3);
      return num(P, { prompt: `Quelle puissance est dissipée par effet Joule dans une résistance de ${R} Ω traversée par ${fr(I)} A ? (En W.)`, unit: 'W', unitOptional: true,
        misconceptions: I !== 1 ? [mc(roundTo(R * I, 3), 'mc:joule-carre', 'notion', 'P = R × I² : l’intensité est au carré.')] : [], hints: ['P_J = R × I².'], solution: `P = ${R} × ${fr(I)}² = ${fr(P)} W` });
    }
    const Pabs = pick(rand, [200, 500, 1000, 2000]); const eta = pick(rand, [40, 60, 75, 80, 90]); const Pu = (Pabs * eta) / 100;
    return num(eta, { prompt: `Un moteur reçoit une puissance électrique de ${Pabs} W et fournit une puissance mécanique utile de ${fr(Pu)} W. Quel est son rendement, en % ?`, unit: '%', unitOptional: true,
      misconceptions: [mc(roundTo((Pabs / Pu) * 100, 2), 'mc:rendement-inverse', 'notion', 'η = puissance utile / puissance reçue : il est toujours inférieur à 100 %.')], hints: ['η = P_utile / P_reçue.'], solution: `η = ${fr(Pu)} / ${Pabs} = ${fr(eta / 100)}, soit ${eta} %` });
  },
});

add('1re', {
  id: 'l1pc-ondes', label: 'Ondes, lentilles, couleurs, photons', skill: 'l1pc.ondes', chapters: ['1re-pc-ondes-mecaniques', '1re-pc-images-couleurs', '1re-pc-modeles-lumiere'],
  description: 'v = λ × f, retard, relation de conjugaison, synthèses additive et soustractive, énergie d’un photon.',
  make(rand, hard) {
    const k = pick(rand, hard ? ['lambda', 'retard', 'conjugaison', 'photon', 'qcm'] : ['lambda', 'retard', 'photon', 'qcm', 'qcm']);
    if (k === 'lambda') {
      const [v, milieu] = pick(rand, [[340, 'l’air'], [1500, 'l’eau']]); const f = pick(rand, [170, 340, 500, 680, 1000, 1700]); const l = roundTo(v / f, 4);
      return num(l, { prompt: `Un son de fréquence ${f} Hz se propage dans ${milieu} à ${v} m/s. Quelle est sa longueur d’onde, en m ?`, unit: 'm', unitOptional: true, tolerance: 0.0005,
        misconceptions: [mc(v * f, 'mc:lambda-produit', 'notion', 'v = λ × f, donc λ = v / f.')], hints: ['v = λ × f.'], solution: `λ = ${v} / ${f} = ${fr(l)} m` });
    }
    if (k === 'retard') {
      const d = pick(rand, [34, 68, 170, 340, 680]); const t = roundTo(d / 340, 4);
      return num(t, { prompt: `Un son parcourt ${d} m dans l’air (340 m/s). Quel est le retard entre l’émission et la réception, en s ?`, unit: 's', unitOptional: true, tolerance: 0.0005,
        misconceptions: [mc(roundTo(340 / d, 4), 'mc:retard-inverse', 'notion', 'τ = d / v : la distance divisée par la vitesse.')].filter((m) => Math.abs(m.answer - t) > 0.0005), hints: ['τ = d / v.'], solution: `τ = ${d} / 340 = ${fr(t)} s` });
    }
    if (k === 'conjugaison') {
      const [f, OA, OA2] = pick(rand, [[10, -20, 20], [10, -15, 30], [20, -30, 60], [5, -10, 10], [20, -60, 30], [10, -30, 15]]);
      return num(OA2, { prompt: `Une lentille convergente a une distance focale f′ = ${f} cm. L’objet est à OA = ${OA} cm (distance algébrique). Où se forme l’image : OA′ = ? (en cm)`, unit: 'cm', unitOptional: true, difficulty: 3, expectedSeconds: 90,
        hints: ['Relation de conjugaison : 1/OA′ − 1/OA = 1/f′.'], solution: `1/OA′ = 1/${f} + 1/(${OA}) = ${fr(roundTo(1 / OA2, 4))}, donc OA′ = ${OA2} cm` });
    }
    if (k === 'photon') {
      const [l, E] = pick(rand, [[620, 2], [413, 3], [496, 2.5], [310, 4], [1240, 1]]);
      return num(E, { prompt: `Quelle est l’énergie, en électronvolts, d’un photon de longueur d’onde ${l} nm ? (On utilisera E ≈ 1 240 / λ, avec λ en nm et E en eV.)`, unit: 'eV', unitOptional: true, tolerance: 0.01,
        misconceptions: [mc(roundTo(l / 1240, 4), 'mc:photon-inverse', 'notion', 'E = h c / λ : plus la longueur d’onde est grande, plus l’énergie est petite.')], hints: ['E = h × c / λ ≈ 1 240 / λ (nm) en eV.'], solution: `E ≈ 1 240 / ${l} = ${fr(E)} eV` });
    }
    return qcm(rand, pick(rand, [
      ['En synthèse additive, lumière rouge + lumière verte donnent…', 'du jaune', ['du blanc', 'du marron', 'du cyan'], 'Rouge + vert = jaune ; les trois primaires ensemble donnent du blanc.'],
      ['Un objet paraît rouge en lumière blanche parce qu’il…', 'diffuse surtout le rouge et absorbe les autres couleurs', ['émet du rouge', 'absorbe le rouge', 'transforme le blanc en rouge'], 'La couleur perçue est celle de la lumière diffusée.'],
      ['Une onde mécanique transporte…', 'de l’énergie, sans transport de matière', ['de la matière', 'des électrons', 'de la lumière'], 'Le milieu se déforme localement puis revient : seule l’énergie se propage.'],
      ['La lumière a un modèle ondulatoire et un modèle…', 'particulaire (le photon)', ['magnétique', 'chimique', 'mécanique'], 'Elle se comporte comme une onde (diffraction) ou comme un flux de photons (effet photoélectrique).'],
    ]));
  },
});

/* ================================ TERMINALE ================================ */

add('tle', {
  id: 'ltpc-acide-base', label: 'Acides et bases : pH, force, prédominance', skill: 'ltpc.acide-base', chapters: ['tle-pc-acide-base', 'tle-pc-force-acides', 'tle-pc-analyse-physique'],
  description: 'pH = −log[H₃O⁺], acide fort dilué, domaines de prédominance selon le pKa.',
  make(rand) {
    const k = pick(rand, ['ph', 'fort', 'dilution', 'predominance', 'qcm']);
    if (k === 'ph') { const p = ri(rand, 1, 12); return num(p, { prompt: `La concentration en ions oxonium d’une solution est [H₃O⁺] = 1 × 10⁻${sup(p)} mol/L. Quel est son pH ?`, misconceptions: [mc(-p, 'mc:ph-signe', 'signe', 'pH = −log[H₃O⁺] : le signe moins rend le pH positif.')], expectedSeconds: 30, hints: ['pH = −log([H₃O⁺]).'], solution: `pH = −log(10^−${p}) = ${p}` }); }
    if (k === 'fort') { const p = ri(rand, 1, 4); const c = 10 ** -p; return num(p, { prompt: `Quel est le pH d’une solution d’acide chlorhydrique (acide fort) de concentration ${fr(c)} mol/L ?`, expectedSeconds: 40, hints: ['Un acide fort réagit totalement avec l’eau : [H₃O⁺] = c.'], solution: `[H₃O⁺] = ${fr(c)} mol/L, donc pH = ${p}` }); }
    if (k === 'dilution') { const p0 = ri(rand, 1, 3); const F = pick(rand, [10, 100]); const p = p0 + Math.log10(F); return num(p, { prompt: `Une solution d’acide fort a un pH de ${p0}. On la dilue ${F} fois. Quel est le nouveau pH ?`, misconceptions: [mc(p0 - Math.log10(F), 'mc:dilution-ph-sens', 'notion', 'Diluer un acide le rend moins acide : le pH augmente.')], expectedSeconds: 45, hints: ['Diluer 10 fois un acide fort divise [H₃O⁺] par 10 : le pH augmente de 1.'], solution: `pH = ${p0} + ${Math.log10(F)} = ${p}` }); }
    if (k === 'predominance') {
      const pKa = pick(rand, [3.8, 4.8, 6.4, 9.2]); const pH = pick(rand, [2, 3, 7, 8, 10, 11]);
      const acid = pH < pKa;
      return qcm(rand, [`Pour un couple acide/base de pKa = ${fr(pKa)}, quelle forme prédomine dans une solution de pH = ${pH} ?`, acid ? 'la forme acide' : 'la forme basique', [acid ? 'la forme basique' : 'la forme acide', 'les deux à égalité', 'aucune des deux'],
        `pH ${acid ? '<' : '>'} pKa : la forme ${acid ? 'acide' : 'basique'} prédomine (les deux sont à égalité seulement si pH = pKa).`]);
    }
    return qcm(rand, pick(rand, [
      ['Selon Brønsted, un acide est une espèce capable de…', 'céder un proton H⁺', ['capter un proton H⁺', 'céder un électron', 'capter un électron'], 'Acide : donneur de proton ; base : accepteur de proton.'],
      ['Plus un acide est fort, plus son pKa est…', 'petit', ['grand', 'proche de 7', 'négatif à coup sûr'], 'Un acide fort se dissocie davantage : sa constante Ka est grande, donc son pKa = −log Ka est petit.'],
      ['À 25 °C, une solution de pH = 9 est…', 'basique', ['acide', 'neutre', 'impossible'], 'pH < 7 : acide ; pH = 7 : neutre ; pH > 7 : basique.'],
    ]));
  },
});

add('tle', {
  id: 'ltpc-titrages', label: 'Titrages et suivi d’une réaction', skill: 'ltpc.titrages', chapters: ['tle-pc-titrages', 'tle-pc-cinetique', 'tle-pc-equilibre'],
  description: 'Concentration à l’équivalence (stœchiométrie 1:1 ou 1:2), facteurs cinétiques, temps de demi-réaction, sens d’évolution (Qr et K).',
  make(rand) {
    const k = pick(rand, ['titrage', 'titrage2', 'qcm', 'qcm']);
    if (k === 'titrage' || k === 'titrage2') {
      const two = k === 'titrage2'; const cB = pick(rand, [0.01, 0.02, 0.05, 0.1]); const VE = pick(rand, [10, 12, 15, 16, 20]); const VA = pick(rand, [10, 20, 25]);
      const cA = roundTo((cB * VE) / (VA * (two ? 2 : 1)), 6);
      return num(cA, { prompt: two
        ? `On titre ${VA} mL d’une solution de base B par un acide fort à ${fr(cB)} mol/L selon B + 2 H₃O⁺ → … (une mole de B réagit avec deux moles d’acide). Équivalence à VE = ${VE} mL. Concentration de B, en mol/L ?`
        : `On titre ${VA} mL d’acide éthanoïque par une solution de soude à ${fr(cB)} mol/L (réaction mole à mole). Le saut de pH donne VE = ${VE} mL. Concentration de l’acide, en mol/L ?`, unit: 'mol/L', unitOptional: true, tolerance: 1e-6,
        misconceptions: two ? [mc(roundTo((cB * VE) / VA, 6), 'mc:titrage-stoechio', 'notion', 'À l’équivalence, n(acide versé) = 2 × n(B) : on divise par 2.')] : [mc(roundTo((cB * VA) / VE, 6), 'mc:titrage-volumes', 'notion', 'À l’équivalence : cA × VA = cB × VE.')].filter((m) => Math.abs(m.answer - cA) > 1e-6),
        hints: [two ? 'À l’équivalence : n(H₃O⁺ versé) = 2 × n(B initial).' : 'À l’équivalence : cA × VA = cB × VE.'], solution: `cA = ${fr(cB)} × ${VE} / (${two ? '2 × ' : ''}${VA}) = ${fr(cA)} mol/L` });
    }
    return qcm(rand, pick(rand, [
      ['Le temps de demi-réaction t₁/₂ est la durée au bout de laquelle…', 'l’avancement atteint la moitié de sa valeur finale', ['la réaction est terminée', 'la température double', 'la moitié du solvant s’est évaporée'], 'C’est une mesure de la rapidité d’une transformation.'],
      ['Un catalyseur…', 'accélère la réaction sans être consommé', ['est un réactif consommé', 'change l’état final', 'ralentit toujours la réaction'], 'Il modifie le chemin réactionnel mais se retrouve intact à la fin.'],
      ['Si l’on augmente la température, une réaction est en général…', 'plus rapide', ['plus lente', 'totalement arrêtée', 'inchangée'], 'La température est un facteur cinétique : les chocs efficaces sont plus nombreux.'],
      ['Si le quotient de réaction Qr est inférieur à la constante d’équilibre K, le système évolue…', 'dans le sens direct (formation des produits)', ['dans le sens inverse', 'il ne bouge pas', 'il explose'], 'Le système évolue spontanément de façon à ce que Qr se rapproche de K.'],
    ]));
  },
});

add('tle', {
  id: 'ltpc-radioactivite', label: 'Décroissance radioactive', skill: 'ltpc.radioactivite', chapters: ['tle-pc-radioactivite'],
  description: 'Demi-vie, part de noyaux restants, datation au carbone 14.',
  make(rand) {
    const k = pick(rand, ['reste', 'age', 'demi', 'qcm']);
    if (k === 'reste') { const n = ri(rand, 1, 5); const p = roundTo(100 / 2 ** n, 4); return num(p, { prompt: `Quel pourcentage des noyaux radioactifs initiaux reste-t-il au bout de ${n} demi-vie${n > 1 ? 's' : ''} ?`, unit: '%', unitOptional: true, tolerance: 0.01, misconceptions: [mc(Math.max(0, 100 - 50 * n), 'mc:decroissance-lineaire', 'notion', 'À chaque demi-vie, le nombre de noyaux est divisé par 2 : la décroissance n’est pas linéaire.')].filter((m) => m.answer !== p), expectedSeconds: 40, hints: ['Après n demi-vies : N = N₀ / 2ⁿ.'], solution: `100 / 2^${n} = ${fr(p)} %` }); }
    if (k === 'age') { const [r, n] = pick(rand, [[50, 1], [25, 2], [12.5, 3]]); return num(5730 * n, { prompt: `Un os ne contient plus que ${fr(r)} % du carbone 14 qu’il avait à la mort de l’animal. La demi-vie du carbone 14 est de 5 730 ans. Quel est son âge, en années ?`, unit: 'ans', unitOptional: true, expectedSeconds: 60, hints: [`${fr(r)} % = 100 % divisé par 2 combien de fois ?`], solution: `${fr(r)} % = 100 % / 2^${n} : ${n} demi-vie${n > 1 ? 's' : ''}, soit ${5730 * n} ans.` }); }
    if (k === 'demi') { const t = pick(rand, [8, 12, 30, 5]); const n = ri(rand, 2, 4); return num(t, { prompt: `Au bout de ${t * n} jours, il ne reste que 1/${2 ** n} des noyaux d’un échantillon radioactif. Quelle est la demi-vie, en jours ?`, unit: 'jours', unitOptional: true, expectedSeconds: 60, misconceptions: [mc(roundTo((t * n) / 2, 4), 'mc:demi-vie-moitie', 'notion', `1/${2 ** n} = (1/2)^${n} : il s’est écoulé ${n} demi-vies.`)].filter((m) => m.answer !== t), hints: [`1/${2 ** n} = (1/2)^${n}.`], solution: `${n} demi-vies en ${t * n} jours : t₁/₂ = ${t} jours` }); }
    return qcm(rand, pick(rand, [
      ['La désintégration d’un noyau radioactif donné est…', 'aléatoire : on ne peut pas prévoir quand il se désintégrera', ['prévisible à la seconde près', 'déclenchée par la lumière', 'impossible à mesurer'], 'On ne prévoit que le comportement statistique d’un grand nombre de noyaux.'],
      ['L’activité d’un échantillon radioactif s’exprime en…', 'becquerels (Bq)', ['joules', 'watts', 'grays seulement'], '1 Bq = une désintégration par seconde.'],
      ['Au cours du temps, l’activité d’un échantillon radioactif…', 'diminue', ['augmente', 'reste constante', 'oscille'], 'Le nombre de noyaux radioactifs diminue, donc les désintégrations aussi.'],
    ]));
  },
});

add('tle', {
  id: 'ltpc-piles', label: 'Piles, électrolyse, charge électrique', skill: 'ltpc.piles', chapters: ['tle-pc-piles', 'tle-pc-electrolyse'],
  description: 'Q = I × Δt, capacité d’une batterie en mAh et en coulombs, électrodes et sens du courant.',
  make(rand) {
    const k = pick(rand, ['charge', 'mah', 'duree', 'qcm', 'qcm']);
    if (k === 'charge') { const I = pick(rand, [0.1, 0.2, 0.5, 1, 2]); const t = pick(rand, [60, 300, 600, 3600]); return num(roundTo(I * t, 4), { prompt: `Une pile débite un courant de ${fr(I)} A pendant ${t} s. Quelle charge électrique a-t-elle fait circuler, en C ?`, unit: 'C', unitOptional: true, hints: ['Q = I × Δt.'], solution: `Q = ${fr(I)} × ${t} = ${fr(roundTo(I * t, 4))} C` }); }
    if (k === 'mah') { const c = pick(rand, [1000, 2000, 3000, 4000, 5000]); return num(c * 3.6, { prompt: `La batterie d’un téléphone a une capacité de ${c} mAh. Quelle charge cela représente-t-il, en coulombs ? (1 mAh = 3,6 C.)`, unit: 'C', unitOptional: true, misconceptions: [mc(c * 3600, 'mc:mah-conversion', 'unite', '1 mAh = 0,001 A × 3 600 s = 3,6 C.')], hints: ['1 mA × 1 h = 0,001 A × 3 600 s.'], solution: `${c} × 3,6 = ${fr(c * 3.6)} C` }); }
    if (k === 'duree') { const c = pick(rand, [1000, 2000, 3000]); const I = pick(rand, [100, 200, 250, 500]); return num(c / I, { prompt: `Une batterie de ${c} mAh alimente un appareil qui consomme ${I} mA. Combien d’heures peut-il fonctionner ?`, unit: 'h', unitOptional: true, misconceptions: [mc(c * I, 'mc:autonomie-produit', 'notion', 'Durée = capacité / intensité.')], hints: ['Δt = Q / I.'], solution: `${c} mAh / ${I} mA = ${fr(c / I)} h` }); }
    return qcm(rand, pick(rand, [
      ['Dans une pile, l’oxydation a lieu à…', 'l’anode (borne négative)', ['la cathode (borne positive)', 'dans le pont salin', 'nulle part'], 'Anode : oxydation, elle libère des électrons qui partent dans le circuit extérieur.'],
      ['Dans le circuit extérieur d’une pile, les électrons circulent…', 'de la borne − vers la borne +', ['de la borne + vers la borne −', 'dans le pont salin', 'dans les deux sens à la fois'], 'Le courant électrique conventionnel va de + vers −, les électrons en sens inverse.'],
      ['Une électrolyse est une transformation…', 'forcée par un générateur', ['spontanée', 'sans électrons', 'nucléaire'], 'Le générateur impose le sens d’évolution inverse du sens spontané (ex. : recharger une batterie).'],
      ['Le rôle du pont salin est de…', 'fermer le circuit en assurant la neutralité des solutions', ['produire des électrons', 'stocker l’énergie', 'mesurer la tension'], 'Ses ions migrent pour compenser les charges apparues dans chaque demi-pile.'],
    ]));
  },
});

add('tle', {
  id: 'ltpc-mecanique', label: 'Mouvement, lois de Newton, gravitation', skill: 'ltpc.mecanique', chapters: ['tle-pc-cinematique', 'tle-pc-newton', 'tle-pc-gravitation'],
  description: 'Accélération moyenne, deuxième loi de Newton, chute libre, mouvement des satellites.',
  make(rand) {
    const k = pick(rand, ['acc', 'newton', 'chute', 'qcm']);
    if (k === 'acc') { const dv = pick(rand, [10, 20, 27, 30]); const dt = pick(rand, [2, 5, 10]); return num(roundTo(dv / dt, 4), { prompt: `Une voiture passe de 0 à ${dv} m/s en ${dt} s sur une ligne droite. Quelle est la valeur de son accélération moyenne, en m/s² ?`, unit: 'm/s²', unitOptional: true, misconceptions: [mc(dv * dt, 'mc:acc-produit', 'notion', 'a = Δv / Δt.')], hints: ['a = Δv / Δt.'], solution: `a = ${dv} / ${dt} = ${fr(roundTo(dv / dt, 4))} m/s²` }); }
    if (k === 'newton') { const m = pick(rand, [2, 5, 10, 1000, 1200]); const a = pick(rand, [0.5, 1, 2, 3]); return num(m * a, { prompt: `Quelle est la résultante des forces appliquées à un système de ${m} kg dont l’accélération vaut ${fr(a)} m/s² ? (En N.)`, unit: 'N', unitOptional: true, misconceptions: [mc(roundTo(m / a, 4), 'mc:newton-quotient', 'notion', 'Deuxième loi de Newton : ΣF = m × a.')].filter((x) => x.answer !== m * a), hints: ['ΣF = m × a.'], solution: `ΣF = ${m} × ${fr(a)} = ${fr(m * a)} N` }); }
    if (k === 'chute') { const t = pick(rand, [1, 2, 3]); const h = roundTo(0.5 * 9.8 * t * t, 3); return num(h, { prompt: `Un objet est lâché sans vitesse initiale (chute libre, g = 9,8 m/s²). Quelle distance a-t-il parcourue au bout de ${t} s, en m ?`, unit: 'm', unitOptional: true, misconceptions: [mc(roundTo(9.8 * t, 3), 'mc:chute-vitesse', 'notion', 'g × t est la vitesse ; la distance est ½ g t².')], hints: ['z(t) = ½ g t² pour une chute sans vitesse initiale.'], solution: `d = ½ × 9,8 × ${t}² = ${fr(h)} m` }); }
    return qcm(rand, pick(rand, [
      ['Pour un satellite en orbite circulaire, si le rayon de l’orbite augmente, sa vitesse…', 'diminue', ['augmente', 'reste la même', 'devient nulle'], 'v = √(GM / r) : plus le satellite est loin, plus il est lent.'],
      ['D’après la troisième loi de Kepler, pour les planètes du système solaire, T² / a³ est…', 'le même pour toutes les planètes', ['différent pour chaque planète', 'égal à 1 an', 'nul'], 'T² / a³ ne dépend que de la masse du Soleil.'],
      ['Pour un projectile lancé dans le champ de pesanteur (sans frottement), la composante horizontale de la vitesse…', 'reste constante', ['augmente', 'diminue', 's’annule au sommet'], 'Le poids est vertical : il ne modifie que la composante verticale.'],
      ['Un satellite géostationnaire…', 'reste au-dessus du même point de l’équateur', ['est immobile dans le référentiel héliocentrique', 'passe au-dessus des pôles', 'tourne en 12 h'], 'Il tourne en un jour sidéral, dans le plan de l’équateur, dans le même sens que la Terre.'],
    ]));
  },
});

add('tle', {
  id: 'ltpc-thermo-fluides', label: 'Gaz parfait, thermodynamique, fluides', skill: 'ltpc.thermo', chapters: ['tle-pc-gaz-parfait', 'tle-pc-thermodynamique', 'tle-pc-fluides'],
  description: 'Énergie pour chauffer de l’eau (Q = m c ΔT), loi des gaz parfaits, poussée d’Archimède, effet Venturi.',
  make(rand) {
    const k = pick(rand, ['chaleur', 'archimede', 'gaz', 'qcm']);
    if (k === 'chaleur') { const m = pick(rand, [0.5, 1, 2]); const dT = pick(rand, [10, 20, 50, 80]); const Q = roundTo((m * 4180 * dT) / 1000, 3); return num(Q, { prompt: `Quelle énergie faut-il pour élever de ${dT} °C la température de ${fr(m)} kg d’eau ? (c = 4 180 J·kg⁻¹·K⁻¹.) Réponds en kJ.`, unit: 'kJ', unitOptional: true, misconceptions: [mc(roundTo(m * 4180 * dT, 3), 'mc:kj-j', 'unite', 'Q = m c ΔT donne des joules : il reste à convertir en kJ (÷ 1 000).')], hints: ['Q = m × c × ΔT.'], solution: `Q = ${fr(m)} × 4 180 × ${dT} = ${fr(roundTo(m * 4180 * dT, 1))} J = ${fr(Q)} kJ` }); }
    if (k === 'archimede') { const V = pick(rand, [0.001, 0.002, 0.005, 0.01]); const F = roundTo(1000 * V * 9.8, 4); return num(F, { prompt: `Un objet de volume ${fr(V * 1000)} L est entièrement immergé dans l’eau (ρ = 1 000 kg/m³, g = 9,8 N/kg). Quelle est la valeur de la poussée d’Archimède, en N ?`, unit: 'N', unitOptional: true, tolerance: 0.001, misconceptions: [mc(roundTo(1000 * V * 1000 * 9.8, 2), 'mc:volume-litres', 'unite', `Le volume doit être en m³ : ${fr(V * 1000)} L = ${fr(V)} m³.`)], hints: ['Π = ρ_fluide × V_immergé × g, avec V en m³.'], solution: `Π = 1 000 × ${fr(V)} × 9,8 = ${fr(F)} N` }); }
    if (k === 'gaz') { const n = pick(rand, [0.5, 1, 2]); const T = pick(rand, [273, 300]); const V = pick(rand, [0.01, 0.02, 0.05]); const P = roundTo((n * 8.314 * T) / V, 0); return num(P, { prompt: `Quelle est la pression de ${fr(n)} mol de gaz parfait occupant ${fr(V * 1000)} L à ${T} K ? (R = 8,314 J·mol⁻¹·K⁻¹ ; arrondi au pascal près, en Pa.)`, unit: 'Pa', unitOptional: true, tolerance: 2, difficulty: 3, expectedSeconds: 90, misconceptions: [mc(roundTo((n * 8.314 * T) / (V * 1000), 0), 'mc:volume-m3', 'unite', `Le volume doit être en m³ : ${fr(V * 1000)} L = ${fr(V)} m³.`)], hints: ['P × V = n × R × T, avec V en m³ et T en kelvins.'], solution: `P = ${fr(n)} × 8,314 × ${T} / ${fr(V)} ≈ ${fr(P)} Pa` }); }
    return qcm(rand, pick(rand, [
      ['Dans un tuyau qui se rétrécit, l’eau va plus vite. Sa pression…', 'diminue (effet Venturi)', ['augmente', 'reste la même', 'devient nulle'], 'Relation de Bernoulli : là où la vitesse augmente, la pression diminue.'],
      ['Le premier principe de la thermodynamique traduit…', 'la conservation de l’énergie : ΔU = W + Q', ['la création d’énergie par la chaleur', 'la disparition de l’énergie', 'l’égalité des températures'], 'L’énergie interne varie du travail et de la chaleur échangés.'],
      ['Un transfert thermique spontané se fait…', 'du corps chaud vers le corps froid', ['du corps froid vers le corps chaud', 'dans les deux sens à la fois', 'jamais'], 'Jusqu’à l’équilibre thermique.'],
      ['0 °C correspond à…', '273,15 K', ['0 K', '100 K', '−273,15 K'], 'T(K) = θ(°C) + 273,15.'],
    ]));
  },
});

add('tle', {
  id: 'ltpc-ondes', label: 'Son, diffraction, lunette, photons', skill: 'ltpc.ondes', chapters: ['tle-pc-son-doppler', 'tle-pc-diffraction', 'tle-pc-lunette', 'tle-pc-photons'],
  description: 'Niveau d’intensité sonore, écart angulaire de diffraction, grossissement d’une lunette, effet photoélectrique.',
  make(rand) {
    const k = pick(rand, ['db', 'diffraction', 'lunette', 'qcm', 'qcm']);
    if (k === 'db') { const [f, d] = pick(rand, [[10, 10], [100, 20], [1000, 30], [2, 3]]); return num(d, { prompt: `Si l’intensité sonore est multipliée par ${f}, de combien de décibels le niveau d’intensité sonore augmente-t-il ?`, unit: 'dB', unitOptional: true, tolerance: f === 2 ? 0.05 : 0, misconceptions: [mc(f, 'mc:db-lineaire', 'notion', 'L = 10 log(I / I₀) : l’échelle des décibels est logarithmique.')].filter((m) => m.answer !== d), hints: ['L = 10 × log(I / I₀) ; ΔL = 10 × log(facteur).'], solution: `ΔL = 10 × log(${f}) ≈ ${d} dB` }); }
    if (k === 'diffraction') { const [l, a, th] = pick(rand, [[500, 0.1, 5], [600, 0.2, 3], [400, 0.05, 8], [633, 0.1, 6.33]]); return num(th, { prompt: `Un laser de longueur d’onde ${l} nm éclaire une fente de largeur ${fr(a)} mm. Quel est l’écart angulaire θ = λ / a, en milliradians ?`, unit: 'mrad', unitOptional: true, tolerance: 0.01, difficulty: 3, expectedSeconds: 90, hints: ['Mets λ et a dans la même unité (en m) : 1 nm = 10⁻⁹ m, 1 mm = 10⁻³ m.'], solution: `θ = ${l} × 10⁻⁹ / (${fr(a)} × 10⁻³) = ${fr(th)} × 10⁻³ rad = ${fr(th)} mrad` }); }
    if (k === 'lunette') { const f1 = pick(rand, [600, 800, 900, 1000, 1200]); const f2 = pick(rand, [10, 20, 25]); return num(f1 / f2, { prompt: `Une lunette astronomique a un objectif de distance focale ${f1} mm et un oculaire de ${f2} mm. Quel est son grossissement ?`, misconceptions: [mc(roundTo(f2 / f1, 4), 'mc:grossissement-inverse', 'notion', 'G = f′objectif / f′oculaire : un grand objectif et un petit oculaire grossissent beaucoup.')], hints: ['G = f′₁ / f′₂.'], solution: `G = ${f1} / ${f2} = ${fr(f1 / f2)}` }); }
    return qcm(rand, pick(rand, [
      ['Une ambulance s’approche : le son de sa sirène paraît…', 'plus aigu (fréquence perçue plus élevée)', ['plus grave', 'identique', 'plus faible seulement'], 'Effet Doppler : quand la source s’approche, la fréquence perçue augmente.'],
      ['L’effet photoélectrique ne se produit que si…', 'l’énergie de chaque photon dépasse le travail d’extraction du métal', ['la lumière est très intense', 'le métal est chauffé', 'la lumière est rouge'], 'C’est l’énergie de chaque photon (liée à sa fréquence) qui compte, pas l’intensité.'],
      ['Des interférences constructives se produisent lorsque la différence de marche est…', 'un multiple entier de la longueur d’onde', ['un multiple impair de λ/2', 'nulle seulement', 'quelconque'], 'Les ondes arrivent en phase : leurs amplitudes s’ajoutent.'],
      ['Plus la fente est étroite, plus la diffraction est…', 'marquée (tache centrale plus large)', ['faible', 'inexistante', 'colorée'], 'θ = λ / a : l’écart angulaire augmente quand a diminue.'],
    ]));
  },
});

add('tle', {
  id: 'ltpc-rc', label: 'Condensateur et circuit RC', skill: 'ltpc.rc', chapters: ['tle-pc-circuit-rc', 'tle-pc-analyse-physique'],
  description: 'Constante de temps τ = RC, charge q = C × U, charge à 63 % et à 99 %.',
  make(rand) {
    const k = pick(rand, ['tau', 'charge', 'cinqtau', 'qcm']);
    const R = pick(rand, [1000, 2000, 4700, 10000]); const C = pick(rand, [1e-6, 2.2e-6, 10e-6, 100e-6]);
    const Cs = `${fr(roundTo(C * 1e6, 3))} µF`; const Rs = `${R >= 1000 ? `${fr(R / 1000)} kΩ` : `${R} Ω`}`;
    if (k === 'tau') { const tau = roundTo(R * C * 1000, 4); return num(tau, { prompt: `Quelle est la constante de temps d’un circuit RC avec R = ${Rs} et C = ${Cs} ? (En ms.)`, unit: 'ms', unitOptional: true, tolerance: 0.001, misconceptions: [mc(roundTo(R * C, 6), 'mc:tau-unite', 'unite', 'τ = R × C donne des secondes : il reste à convertir en millisecondes (× 1 000).')].filter((m) => Math.abs(m.answer - tau) > 0.001), hints: ['τ = R × C (R en Ω, C en F).'], solution: `τ = ${R} × ${fr(C)} = ${fr(roundTo(R * C, 6))} s = ${fr(tau)} ms` }); }
    if (k === 'charge') { const U = pick(rand, [5, 6, 9, 12]); const q = roundTo(C * U * 1e6, 3); return num(q, { prompt: `Un condensateur de ${Cs} est chargé sous ${U} V. Quelle charge porte son armature positive, en µC ?`, unit: 'µC', unitOptional: true, tolerance: 0.001, hints: ['q = C × U.'], solution: `q = ${fr(C)} × ${U} = ${fr(q)} × 10⁻⁶ C = ${fr(q)} µC` }); }
    if (k === 'cinqtau') { const tau = roundTo(R * C * 1000, 4); return num(roundTo(5 * tau, 4), { prompt: `Avec R = ${Rs} et C = ${Cs}, au bout de combien de millisecondes considère-t-on le condensateur chargé (à plus de 99 %, soit 5τ) ?`, unit: 'ms', unitOptional: true, tolerance: 0.001, hints: ['τ = R × C ; la charge est pratiquement complète après 5τ.'], solution: `5τ = 5 × ${fr(tau)} = ${fr(roundTo(5 * tau, 4))} ms` }); }
    return qcm(rand, pick(rand, [
      ['Lors de la charge d’un condensateur, à t = τ, la tension à ses bornes atteint environ…', '63 % de sa valeur finale', ['50 %', '99 %', '37 %'], 'u(τ) = E(1 − e⁻¹) ≈ 0,63 E.'],
      ['L’intensité du courant dans un condensateur est liée à sa tension par…', 'i = C × du/dt', ['i = C × u', 'i = u / C', 'i = R × C'], 'q = C u et i = dq/dt.'],
      ['Pendant la décharge d’un condensateur dans une résistance, la tension…', 'décroît exponentiellement', ['augmente', 'reste constante', 'décroît linéairement'], 'u(t) = U₀ e^(−t/τ).'],
    ]));
  },
});

export const LYCEE_PC_1T = GEN;
export const LYCEE_PC_1T_SKILLS = [
  ['l1pc.composition', '1re', 'Composition d’un système : concentration molaire, absorbance'], ['l1pc.avancement', '1re', 'Avancement, titrage colorimétrique, oxydoréduction'],
  ['l1pc.structure', '1re', 'Structure et polarité des entités, cohésion, chimie organique, combustions'], ['l1pc.fluides', '1re', 'Fluides au repos et champs'],
  ['l1pc.energie', '1re', 'Énergies mécanique et électrique'], ['l1pc.ondes', '1re', 'Ondes mécaniques, images et couleurs, modèles de la lumière'],
  ['ltpc.acide-base', 'tle', 'Transformations acide-base, pH, force des acides'], ['ltpc.titrages', 'tle', 'Titrages, cinétique et équilibre'],
  ['ltpc.radioactivite', 'tle', 'Décroissance radioactive'], ['ltpc.piles', 'tle', 'Piles, électrolyse, charge électrique'],
  ['ltpc.mecanique', 'tle', 'Mouvement, lois de Newton, gravitation'], ['ltpc.thermo', 'tle', 'Gaz parfait, thermodynamique, fluides en écoulement'],
  ['ltpc.ondes', 'tle', 'Son, diffraction, lunette, photons'], ['ltpc.rc', 'tle', 'Condensateur et circuit RC'],
].map(([id, level, label]) => ({ subject: 'pc', id, label, level, track: 'classe', status: 'programme', domain: 'lycee', prereqs: [], editorialLevel: true }));
