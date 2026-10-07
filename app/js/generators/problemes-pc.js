/**
 * Générateurs de PROBLÈMES de physique-chimie (1/2) : vitesse moyenne, orage, masse volumique, protection d’une DEL.
 * Une situation concrète, plusieurs questions qui s'enchaînent et, au niveau expert, une justification. Voir docs/GENERATEURS.md.
 */
import { ri, pick, clean, fr, mc, numeric, text, problem, boundAnswer } from './gen-util.js';
import { TROIS, elide, until, round, isInt, eq, about, tolRound, bound, beyond, clock, yesNo, tiered } from './problemes-pc-outils.js';


/* ------------------------------------------------------------------ */
/* 1. Vitesse moyenne d'un aller-retour                               */
/* ------------------------------------------------------------------ */
const HEURES = 'Distance ÷ vitesse donne une durée en heures : multiplie par 60 pour l’avoir en minutes.';

const ALLER_RETOUR = {
  classe(rand, who) {
    const lieu = pick(rand, ['au collège', 'au stade', 'chez ses grands-parents', 'à la piscine', 'au marché', 'à la médiathèque']);
    const T = [10, 12, 15, 18, 20, 24, 30, 36, 40, 45];
    const [d, t1, t2] = until(() => [ri(rand, 3, 12), pick(rand, T), pick(rand, T)],
      ([x, a, b]) => a < b && isInt((60 * x) / a) && isInt((60 * x) / b) && isInt((120 * x) / (a + b), 1) && (60 * x) / a <= 30 && (60 * x) / b >= 6);
    const v1 = clean((60 * d) / t1); const v2 = clean((60 * d) / t2); const vm = clean((120 * d) / (t1 + t2));
    return problem([
      numeric(v1, { prompt: `Quelle est la vitesse moyenne de ${who} à l’aller, en km/h ?`, unit: 'km/h', misconceptions: [
        mc(clean(d / t1), 'mc:minutes-non-converties', 'unite', `${t1} min, ce n’est pas ${t1} h : pour des km/h, la durée doit être en heures (${t1} min = ${t1} ÷ 60 h).`),
        mc(clean(t1 / 60 / d), 'mc:vitesse-inverse', 'notion', 'v = d / t : la distance divisée par la durée, pas l’inverse.')] }),
      numeric(2 * d, { prompt: 'Quelle distance a été parcourue en tout (aller et retour), en km ?', unit: 'km', misconceptions: [mc(d, 'mc:oubli-retour', 'lecture', 'Un aller-retour : la distance est parcourue deux fois.')] }),
      numeric(vm, { prompt: 'Quelle est la vitesse moyenne sur l’ensemble de l’aller-retour, en km/h ?', unit: 'km/h', misconceptions: [
        mc(clean((v1 + v2) / 2), 'mc:moyenne-des-vitesses', 'raisonnement', `La moyenne des deux vitesses (${fr(v1)} et ${fr(v2)} km/h) ne donne pas la vitesse moyenne : on roule plus longtemps à la vitesse la plus lente. Vitesse moyenne = distance totale ÷ durée totale.`),
        mc(clean((60 * d) / (t1 + t2)), 'mc:oubli-retour', 'lecture', 'Divise la distance TOTALE (aller et retour) par la durée totale.'),
        mc(clean((2 * d) / (t1 + t2)), 'mc:minutes-non-converties', 'unite', 'Convertis la durée totale en heures avant de diviser.')] }),
    ], {
      prompt: `${who} va ${lieu} à vélo, à ${fr(d)} km. L’aller, en descente, dure ${t1} min ; le retour, en montée, dure ${t2} min.`,
      hints: ['Vitesse moyenne = distance parcourue ÷ durée du parcours (v = d / t).', `Pour obtenir des km/h, la durée doit être en heures : ${t1} min = ${t1} ÷ 60 h.`, `Sur l’aller-retour : ${fr(2 * d)} km en ${t1 + t2} min en tout.`],
      solution: `Aller : v = ${fr(d)} ÷ (${t1} ÷ 60) = ${fr(d)} × 60 ÷ ${t1} = ${fr(v1)} km/h. Distance totale : 2 × ${fr(d)} = ${fr(2 * d)} km ; durée totale : ${t1} + ${t2} = ${t1 + t2} min. Vitesse moyenne : ${fr(2 * d)} × 60 ÷ ${t1 + t2} = ${fr(vm)} km/h. Ce n’est pas la moyenne des vitesses, (${fr(v1)} + ${fr(v2)}) ÷ 2 = ${fr((v1 + v2) / 2)} km/h : la montée dure plus longtemps et compte davantage.`,
      expectedSeconds: 300,
    });
  },
  approfondissement(rand, who) {
    const [engin, speeds] = pick(rand, [['en rollers', [10, 12, 14, 15, 16, 18, 20]], ['en courant', [6, 8, 9, 10, 12, 15]], ['à trottinette', [12, 14, 15, 16, 18, 20, 24]], ['à vélo', [12, 15, 16, 18, 20, 24, 30]]]);
    const raison = pick(rand, ['avec le vent de face', 'en montée', 'avec un sac à dos chargé', 'sous une pluie battante']);
    const [d, v1, v2] = until(() => [pick(rand, [2, 2.4, 3, 3.6, 4, 4.5, 5, 6, 7.2, 8, 9, 10, 12]), pick(rand, speeds), pick(rand, speeds)],
      ([x, a, b]) => b < a && a - b >= 4 && isInt((60 * x) / a) && isInt((60 * x) / b) && (a - b) ** 2 / (2 * (a + b)) > 0.3);
    const t1 = clean((60 * d) / v1); const t2 = clean((60 * d) / v2); const vm = clean((120 * d) / (t1 + t2)); const ms = clean(vm / 3.6);
    return problem([
      numeric(t1, { prompt: 'Combien de minutes dure l’aller ?', unit: 'min', misconceptions: [mc(clean(d / v1), 'mc:heures-minutes', 'unite', HEURES), mc(clean(v1 / d), 'mc:duree-inverse', 'notion', 't = d / v : la distance divisée par la vitesse.')] }),
      numeric(t2, { prompt: 'Combien de minutes dure le retour ?', unit: 'min', misconceptions: [mc(clean(d / v2), 'mc:heures-minutes', 'unite', HEURES), mc(clean(v2 / d), 'mc:duree-inverse', 'notion', 't = d / v : la distance divisée par la vitesse.')] }),
      numeric(vm, { prompt: 'Quelle est la vitesse moyenne sur l’aller-retour, en km/h (arrondie au dixième si besoin) ?', unit: 'km/h', tolerance: 0.051, misconceptions: [
        mc(clean((v1 + v2) / 2), 'mc:moyenne-des-vitesses', 'raisonnement', `(${v1} + ${v2}) ÷ 2 n’est pas la vitesse moyenne : le retour, plus lent, dure plus longtemps. Divise la distance totale par la durée totale.`),
        mc(clean((60 * d) / (t1 + t2)), 'mc:oubli-retour', 'lecture', 'La distance totale est celle de l’aller ET du retour.')] }),
      numeric(ms, { prompt: 'Convertis cette vitesse moyenne en m/s (arrondie au dixième).', unit: 'm/s', strictUnit: true, tolerance: tolRound(ms, 1, [round(round(vm, 1) / 3.6, 1)]), misconceptions: [
        mc(clean(vm * 3.6), 'mc:conversion-sens', 'unite', '1 m/s = 3,6 km/h : pour passer des km/h aux m/s, on divise par 3,6 (le nombre diminue).'),
        mc(clean((vm * 1000) / 60), 'mc:minutes-secondes', 'unite', 'Tu as obtenu des mètres par minute : une heure compte 3 600 secondes.')] }),
    ], {
      prompt: `${who} fait un aller-retour ${engin} entre deux points distants de ${fr(d)} km : l’aller à ${v1} km/h, le retour ${raison} à ${v2} km/h.`,
      hints: ['Durée = distance ÷ vitesse : le résultat est en heures, à multiplier par 60 pour des minutes.', 'Vitesse moyenne = distance totale ÷ durée totale ; ce n’est pas la moyenne des deux vitesses.', '1 m/s = 3,6 km/h : pour passer des km/h aux m/s, on divise par 3,6.'],
      solution: `Aller : ${fr(d)} ÷ ${v1} × 60 = ${fr(t1)} min ; retour : ${fr(d)} ÷ ${v2} × 60 = ${fr(t2)} min. Vitesse moyenne : ${fr(2 * d)} km en ${fr(t1 + t2)} min, soit ${fr(2 * d)} × 60 ÷ ${fr(t1 + t2)} ${eq(vm)} km/h, et non (${v1} + ${v2}) ÷ 2 = ${fr((v1 + v2) / 2)} km/h. En m/s : ${fr(round(vm, 2))} ÷ 3,6 ${eq(ms)} m/s.`,
      expectedSeconds: 420,
    });
  },
  expert(rand, who) {
    const [v1, vm, d] = until(() => { const a = ri(rand, 6, 20); return [a, ri(rand, a + 1, 2 * a - 1), ri(rand, 3, 20)]; },
      ([a, m, x]) => isInt((m * a) / (2 * a - m)) && (m * a) / (2 * a - m) <= 60 && isInt((60 * x) / a) && isInt((120 * x) / m) && 2 * m !== 3 * a);
    const v2 = clean((vm * v1) / (2 * v1 - vm)); const t1 = clean((60 * d) / v1); const T = clean((120 * d) / vm); const t2 = clean(T - t1); const naive = 2 * vm - v1;
    // dernière question : une autre moyenne visée, tantôt atteignable, tantôt impossible (la limite 2 × v1 ou au-delà)
    const cas = pick(rand, ['limite', 'au-dela', 'possible']);
    const X = cas === 'limite' ? 2 * v1 : cas === 'au-dela' ? until(() => 2 * v1 + ri(rand, 2, 8), (x) => x !== naive)
      : until(() => ri(rand, v1 + 1, 2 * v1 - 1), (x) => x !== vm && x !== naive && (x * v1) / (2 * v1 - x) <= 70);
    const TX = clean((120 * d) / X); const possible = cas === 'possible';
    const finX = possible ? `Pour ${X} km/h, l’aller-retour durerait ${about(TX)} min : il resterait ${about(TX - t1)} min pour descendre, c’est possible (à environ ${fr(round((X * v1) / (2 * v1 - X)))} km/h).`
      : cas === 'limite' ? `Une moyenne de ${X} km/h demanderait ${fr(t1)} min pour tout l’aller-retour, le temps de la montée seule : c’est impossible.`
        : `Une moyenne de ${X} km/h demanderait ${about(TX)} min pour tout l’aller-retour, moins que la montée seule (${fr(t1)} min) : c’est impossible.`;
    return problem([
      numeric(t1, { prompt: 'Combien de minutes dure la montée ?', unit: 'min', misconceptions: [mc(clean(d / v1), 'mc:heures-minutes', 'unite', HEURES)] }),
      numeric(T, { prompt: `Pour une moyenne de ${vm} km/h sur l’aller-retour, combien de minutes doit durer l’ensemble du trajet ?`, unit: 'min', misconceptions: [
        mc(clean((60 * d) / vm), 'mc:oubli-retour', 'lecture', `L’aller-retour mesure 2 × ${d} = ${2 * d} km.`), mc(clean((2 * d) / vm), 'mc:heures-minutes', 'unite', HEURES)] }),
      numeric(v2, { prompt: 'À quelle vitesse moyenne faut-il alors faire la descente, en km/h ?', unit: 'km/h', misconceptions: [
        mc(naive, 'mc:moyenne-des-vitesses', 'raisonnement', `(${v1} + ${naive}) ÷ 2 = ${vm}, mais une vitesse moyenne ne se calcule pas ainsi : la descente, plus rapide, dure moins longtemps. Il reste ${fr(t2)} min pour ${d} km.`),
        mc(clean(d / t2), 'mc:minutes-non-converties', 'unite', 'La durée de la descente est en minutes : convertis-la en heures pour obtenir des km/h.')] }),
      yesNo(possible, `En montant à ${v1} km/h, est-il possible d’obtenir ${X} km/h de moyenne sur l’aller-retour en descendant assez vite ? (oui ou non)`, possible ? 'mc:limite-mal-placee' : 'mc:moyenne-des-vitesses', 'raisonnement',
        possible ? `Compare les durées : ${2 * d} km à ${X} km/h prennent ${about(TX)} min, plus que la montée (${fr(t1)} min). Il reste du temps pour descendre : c’est possible.`
          : `Pour ${X} km/h de moyenne, l’aller-retour (${2 * d} km) devrait durer ${about(TX)} min : c’est ${cas === 'limite' ? 'exactement' : 'moins que'} la durée de la montée. Il ne resterait aucun temps pour descendre.`),
    ], {
      prompt: `${who} grimpe un col à vélo : ${d} km de montée à ${v1} km/h de moyenne, puis la descente par la même route. Objectif : ${vm} km/h de vitesse moyenne sur l’aller-retour.`,
      hints: ['Commence par la durée de la montée, en minutes.', `Durée totale permise = distance totale ÷ vitesse moyenne visée = ${2 * d} ÷ ${vm} h.`, 'Durée de la descente = durée totale − durée de la montée ; puis v = d ÷ t. Pour la dernière question, compare la durée totale permise à celle de la montée.'],
      solution: `Montée : ${d} ÷ ${v1} × 60 = ${fr(t1)} min. Pour ${vm} km/h sur ${2 * d} km, il faut ${2 * d} ÷ ${vm} × 60 = ${fr(T)} min en tout. Il reste ${fr(t2)} min pour descendre ${d} km : v = ${d} × 60 ÷ ${fr(t2)} = ${fr(v2)} km/h (et non 2 × ${vm} − ${v1} = ${naive} km/h). ${finX}`,
      justify: { prompt: `Explique pourquoi la descente ne se fait pas à ${naive} km/h, puis justifie ta réponse pour la moyenne de ${X} km/h.`, minWords: 15, keywords: ['durée', 'temps', 'distance totale', 'moyenne'],
        example: `La vitesse moyenne est la distance totale divisée par la durée totale. Pour ${vm} km/h il faut ${fr(T)} min en tout ; la montée en prend déjà ${fr(t1)}, il reste ${fr(t2)} min pour ${d} km, soit ${fr(v2)} km/h. ${finX}` },
      expectedSeconds: 540,
    });
  },
};

/* ------------------------------------------------------------------ */
/* 2. À quelle distance est l'orage ?                                  */
/* ------------------------------------------------------------------ */
const ORAGE_LIEUX = ['depuis sa fenêtre', 'sur la plage', 'au camping', 'sous le préau', 'depuis le balcon'];
const RAPPROCHE = ['il se rapproche', 'se rapproche', 'rapproche', 'il s’approche', 's’approche', 'approche', 'il approche', 'l’orage se rapproche', 'il arrive', 'il se rapproche de nous'];
const ELOIGNE = ['il s’éloigne', 's’éloigne', 'éloigne', 'il s’en va', 'il part', 'l’orage s’éloigne', 'il s’eloigne', 's’eloigne'];

const ORAGE = {
  classe(rand, who) {
    const dt = ri(rand, 2, 15); const lieu = pick(rand, ORAGE_LIEUX); const d = 340 * dt;
    const son = 'Le son ne parcourt qu’environ 340 m chaque seconde ; la lumière, 300 000 km par seconde : elle arrive presque instantanément.';
    return problem([
      text(['la lumière', 'lumière', 'la lumière de l’éclair', 'l’éclair', 'éclair', 'la lumiere', 'lumiere'], { prompt: 'Qu’est-ce qui arrive en premier : la lumière de l’éclair ou le son du tonnerre ?', placeholder: 'la lumière ou le son',
        misconceptions: ['le son', 'son', 'le tonnerre', 'tonnerre', 'le son du tonnerre'].map((a) => mc(a, 'mc:son-plus-rapide', 'notion', son)) }),
      numeric(d, { prompt: 'À quelle distance la foudre est-elle tombée, en mètres ?', unit: 'm', misconceptions: [
        mc(clean(340 / dt), 'mc:vitesse-division', 'notion', `d = v × t : en ${dt} s, le son parcourt ${dt} fois 340 m.`), mc(clean(dt / 340), 'mc:vitesse-inverse', 'notion', 'd = v × t : on multiplie la vitesse par la durée.')] }),
      numeric(d / 1000, { prompt: 'Convertis cette distance en kilomètres.', unit: 'km', strictUnit: true, misconceptions: [mc(d * 1000, 'mc:conversion-sens', 'unite', '1 km = 1 000 m : le nombre de kilomètres est 1 000 fois plus petit que le nombre de mètres.')] }),
    ], {
      prompt: `Pendant un orage, ${who} voit un éclair ${lieu}, puis compte ${dt} secondes avant d’entendre le tonnerre. Dans l’air, le son se propage à environ 340 m/s et la lumière à environ 300 000 km/s.`,
      hints: ['La lumière met un temps négligeable à arriver : on voit l’éclair presque au moment où il se produit.', `Pendant les ${dt} s, c’est le son qui parcourt la distance : d = v × t.`, '1 km = 1 000 m.'],
      solution: `La lumière (300 000 km/s) arrive presque instantanément ; le son, bien plus lent, met ${dt} s. Distance : d = 340 × ${dt} = ${fr(d)} m, soit ${fr(d / 1000)} km.`,
      expectedSeconds: 240,
    });
  },
  approfondissement(rand, who) {
    const n = pick(rand, [3, 6, 9, 12, 15, 18]); const lieu = pick(rand, ORAGE_LIEUX);
    const d = 340 * n; const regle = n / 3; const ecart = clean(d - 1000 * regle);
    return problem([
      numeric(d, { prompt: 'Avec la vitesse du son, à quelle distance l’éclair est-il tombé, en mètres ?', unit: 'm', misconceptions: [mc(clean(340 / n), 'mc:vitesse-division', 'notion', 'd = v × t : on multiplie la vitesse par la durée.')] }),
      numeric(regle, { prompt: 'Une règle pratique dit : « nombre de secondes ÷ 3 = distance en kilomètres ». Quelle distance donne-t-elle ici, en km ?', unit: 'km', misconceptions: [mc(3 * n, 'mc:regle-multiplier', 'calcul', 'La règle divise le nombre de secondes par 3.')] }),
      numeric(ecart, { prompt: 'Quel est l’écart entre les deux résultats, en mètres ?', unit: 'm', misconceptions: [mc(clean(d - regle), 'mc:unites-melangees', 'unite', `Mets d’abord les deux distances dans la même unité : ${fr(regle)} km = ${fr(1000 * regle)} m.`)] }),
      text(['plus proche', 'proche', 'plus près', 'près', 'plus proche qu’en réalité'], { prompt: 'Avec la règle pratique, l’orage paraît-il plus proche ou plus loin qu’en réalité ?', placeholder: 'plus proche ou plus loin',
        misconceptions: ['plus loin', 'loin', 'plus éloigné'].map((a) => mc(a, 'mc:comparaison-sens', 'raisonnement', `${fr(1000 * regle)} m < ${fr(d)} m : la règle donne une distance un peu trop petite, l’orage paraît plus proche.`)) }),
    ], {
      prompt: `${who} compte ${n} secondes entre un éclair et le coup de tonnerre, ${lieu}. Dans l’air, le son se propage à environ 340 m/s.`,
      hints: ['d = v × t, avec v = 340 m/s et t en secondes.', 'La règle donne des kilomètres : convertis en mètres avant de comparer.', 'La règle revient à prendre une vitesse du son de 1 000 ÷ 3 ≈ 333 m/s, un peu trop faible.'],
      solution: `Avec 340 m/s : d = 340 × ${n} = ${fr(d)} m. Règle pratique : ${n} ÷ 3 = ${fr(regle)} km = ${fr(1000 * regle)} m. Écart : ${fr(d)} − ${fr(1000 * regle)} = ${fr(ecart)} m. La règle donne une distance plus petite : l’orage paraît un peu plus proche qu’en réalité (elle reste une bonne estimation).`,
      expectedSeconds: 360,
    });
  },
  expert(rand, who) {
    const approche = rand() < 0.55; const T = pick(rand, [10, 12, 15, 20, 30]);
    const [a, k] = until(() => [ri(rand, 6, 24), ri(rand, 3, 15)], ([x, y]) => (approche ? x - y >= 2 : x + y <= 30) && (20.4 * y) / T >= 8 && (20.4 * y) / T <= 60);
    const c = approche ? a - k : a + k; const b = Math.round((a + c) / 2);
    const start = ri(rand, 16 * 60, 19 * 60 + 30); const mid = start + ri(rand, 2, T - 2);
    const d1 = clean(0.34 * a); const d3 = clean(0.34 * c); const dd = clean(Math.abs(d1 - d3)); const v = clean((dd * 60) / T);
    const right = approche ? RAPPROCHE : ELOIGNE; const wrong = approche ? ELOIGNE : RAPPROCHE;
    const km = (dt) => [mc(340 * dt, 'mc:conversion-oubliee', 'unite', '340 × durée donne des mètres : convertis en kilomètres (÷ 1 000).'), mc(clean(dt / 3), 'mc:regle-approchee', 'precision', 'La règle « secondes ÷ 3 » n’est qu’une estimation : calcule avec 340 m/s.')];
    return problem([
      numeric(d1, { prompt: 'À quelle distance du lieu d’observation le premier éclair est-il tombé, en km ?', unit: 'km', misconceptions: km(a) }),
      numeric(d3, { prompt: 'Et le troisième éclair, en km ?', unit: 'km', misconceptions: km(c) }),
      text(right, { prompt: 'L’orage se rapproche-t-il ou s’éloigne-t-il ?', placeholder: 'il se rapproche ou il s’éloigne',
        misconceptions: wrong.slice(0, 3).map((w) => mc(w, 'mc:duree-distance', 'raisonnement', 'Plus la durée entre l’éclair et le tonnerre est courte, plus l’orage est proche.')) }),
      numeric(v, { prompt: 'À quelle vitesse moyenne l’orage se déplace-t-il, en km/h ? (arrondie au dixième)', unit: 'km/h', tolerance: 0.051, misconceptions: [
        mc(clean(dd / T), 'mc:minutes-non-converties', 'unite', `Tu as obtenu des kilomètres par minute : ${T} min = ${T} ÷ 60 h.`),
        mc(clean((d1 * 60) / T), 'mc:distance-au-lieu-ecart', 'raisonnement', 'Le chemin parcouru par l’orage est la différence entre les deux distances, pas la distance du premier éclair.'),
        mc(clean((dd * 1000) / (T * 60)), 'mc:metres-par-seconde', 'unite', 'Tu as obtenu des m/s : multiplie par 3,6 pour avoir des km/h.')] }),
    ], {
      prompt: `${who} observe un orage et note, pour trois éclairs, la durée avant le tonnerre : ${a} s à ${clock(start)}, ${b} s à ${clock(mid)}, ${c} s à ${clock(start + T)}. Le son se propage à 340 m/s ; on admet que l’orage avance en ligne droite, sur un axe qui passe par le lieu d’observation.`,
      hints: ['Calcule la distance de chaque éclair : d = 340 × durée (en m), puis convertis en km.', 'Une durée plus courte signifie un éclair plus proche.', `L’orage a parcouru l’écart entre les deux distances en ${T} min : convertis cette durée en heures.`],
      solution: `Premier éclair : 340 × ${a} = ${fr(340 * a)} m = ${fr(d1)} km ; troisième : 340 × ${c} = ${fr(340 * c)} m = ${fr(d3)} km. Les durées ${approche ? 'diminuent' : 'augmentent'} : l’orage ${approche ? 'se rapproche' : 's’éloigne'}. Il parcourt ${fr(dd)} km en ${T} min, soit ${fr(dd)} × 60 ÷ ${T} ${eq(v)} km/h.`,
      justify: { prompt: 'Explique comment tu sais dans quel sens se déplace l’orage, puis comment tu as calculé sa vitesse.', minWords: 15, keywords: ['durée', 'distance', 'son', '340', 'vitesse'],
        example: `Les durées ${approche ? 'diminuent' : 'augmentent'}, donc les distances aussi : ${fr(d1)} km puis ${fr(d3)} km, l’orage ${approche ? 'se rapproche' : 's’éloigne'}. Il a parcouru ${fr(dd)} km en ${T} minutes, donc sa vitesse est ${fr(dd)} × 60 ÷ ${T}, environ ${fr(round(v, 1))} km/h.` },
      expectedSeconds: 540,
    });
  },
};

/* ------------------------------------------------------------------ */
/* 3. Quel est ce métal ? Masse volumique, flottaison                  */
/* ------------------------------------------------------------------ */
/** [nom, masse volumique en g/cm³, nom commençant par une voyelle] */
const METAUX = [['aluminium', 2.7, true], ['zinc', 7.14, false], ['fer', 7.87, false], ['cuivre', 8.96, false], ['argent', 10.5, true], ['plomb', 11.3, false], ['or', 19.3, true]];
const TABLE_METAUX = 'aluminium 2,70 ; zinc 7,14 ; fer 7,87 ; cuivre 8,96 ; argent 10,5 ; plomb 11,3 ; or 19,3';
const metalNames = ([name, , elide]) => (elide ? [name, `l’${name}`, `de l’${name}`, `en ${name}`] : [name, `le ${name}`, `du ${name}`, `en ${name}`]);
/** Métal du tableau le plus proche de rho (à 8 % près), sinon null. */
function closestMetal(rho) {
  const best = METAUX.reduce((b, m) => (Math.abs(m[1] - rho) < Math.abs(b[1] - rho) ? m : b));
  return Math.abs(best[1] - rho) <= 0.08 * best[1] ? best : null;
}
const VOLUME_PAVE = (L, l, h) => [mc(clean(L + l + h), 'mc:volume-somme', 'notion', 'Le volume d’un pavé est le produit longueur × largeur × hauteur.'), mc(clean(L * l), 'mc:volume-aire', 'notion', 'Longueur × largeur donne l’aire d’une face : multiplie aussi par la hauteur.')];
/** Matériaux du niveau expert : flotte sur les deux liquides, sur l'eau seulement, ou coule dans les deux. */
const MATERIAUX = [[['du liège', 0.24], ['du bois de pin', 0.5], ['du bois de chêne', 0.75]], [['du polyéthylène (un plastique)', 0.95]], [['du nylon', 1.15], ['du plexiglas', 1.18], ['du PVC', 1.38], ['de l’aluminium', 2.7]]];
const FLOTTE = {
  deux: ['les deux', 'deux', 'dans les deux', 'les 2', 'l’eau et l’huile', 'eau et huile', 'dans l’eau et dans l’huile'],
  eau: ['l’eau seulement', 'eau seulement', 'seulement l’eau', 'seulement dans l’eau', 'dans l’eau seulement', 'l’eau', 'eau', 'dans l’eau', 'uniquement l’eau', 'l’eau uniquement'],
  aucun: ['aucun', 'aucun des deux', 'aucune', 'ni l’un ni l’autre', 'dans aucun', 'aucun liquide', 'nulle part'],
};

const METAL = {
  classe(rand, who) {
    const metal = pick(rand, METAUX); const [name, rho] = metal;
    const obj = pick(rand, ['une bille', 'un petit cylindre', 'un écrou', 'une médaille', 'un lest de pêche', 'une figurine']);
    const V = pick(rand, [4, 5, 6, 8, 10, 12, 15, 20]); const V1 = pick(rand, [20, 25, 30, 40, 50, 60]); const V2 = V1 + V; const m = clean(rho * V);
    const wrong = closestMetal(m / V2);
    return problem([
      numeric(V, { prompt: 'Quel est le volume de l’objet, en cm³ ?', unit: 'cm³', misconceptions: [
        mc(V2, 'mc:lecture-volume-final', 'lecture', 'Le volume de l’objet, c’est la montée du niveau de l’eau : niveau final − niveau initial.'), mc(V1 + V2, 'mc:volumes-ajoutes', 'methode', 'On soustrait les deux niveaux, on ne les additionne pas.')] }),
      numeric(rho, { prompt: 'Calcule la masse volumique de ce métal, en g/cm³ (au centième près).', unit: 'g/cm³', tolerance: 0.01, misconceptions: [
        mc(clean(V / m), 'mc:rho-inverse', 'notion', 'ρ = m / V : la masse divisée par le volume, pas l’inverse.'),
        mc(clean(m / V2), 'mc:lecture-volume-final', 'lecture', `Divise par le volume de l’objet (${V} cm³), pas par le niveau final de l’eau.`),
        mc(clean(m * V), 'mc:rho-produit', 'notion', 'On divise la masse par le volume ; on ne multiplie pas.')] }),
      text(metalNames(metal), { prompt: 'De quel métal s’agit-il ? (aide-toi du tableau)', placeholder: 'nom du métal',
        misconceptions: wrong && wrong[0] !== name ? metalNames(wrong).slice(0, 2).map((x) => mc(x, 'mc:lecture-volume-final', 'lecture', 'Ce métal correspond à une masse volumique calculée avec le niveau final de l’eau : utilise le volume de l’objet.')) : [] }),
    ], {
      prompt: `${who} cherche le métal qui compose ${obj}. La balance indique ${fr(m)} g. Dans une éprouvette graduée, le niveau de l’eau passe de ${V1} mL à ${V2} mL quand on y plonge l’objet. Masses volumiques (en g/cm³) : ${TABLE_METAUX}. Rappel : 1 mL = 1 cm³.`,
      hints: ['Le volume de l’objet est égal au volume d’eau qu’il déplace : la montée du niveau.', 'ρ = m / V, avec m en g et V en cm³.', 'Compare ta valeur à celles du tableau : la plus proche donne le métal.'],
      solution: `Volume : ${V2} − ${V1} = ${V} mL = ${V} cm³. Masse volumique : ρ = ${fr(m)} ÷ ${V} = ${fr(rho)} g/cm³. D’après le tableau, c’est ${metalNames(metal)[2]}.`,
      expectedSeconds: 300,
    });
  },
  approfondissement(rand, who) {
    const metal = pick(rand, METAUX); const [name, rho] = metal;
    const [L, l, h] = until(() => [ri(rand, 4, 20), ri(rand, 2, 10), pick(rand, [0.5, 1, 1.5, 2, 2.5, 3, 4, 5])], ([x, y, z]) => isInt(rho * x * y * z) && rho * x * y * z >= 200 && rho * x * y * z <= 20000);
    const V = clean(L * l * h); const g = clean(rho * V); const kg = clean(g / 1000);
    return problem([
      numeric(V, { prompt: 'Quel est le volume du bloc, en cm³ ?', unit: 'cm³', misconceptions: VOLUME_PAVE(L, l, h) }),
      numeric(rho, { prompt: 'Calcule sa masse volumique en g/cm³ (au centième près).', unit: 'g/cm³', tolerance: 0.01, misconceptions: [
        mc(clean(kg / V), 'mc:masse-non-convertie', 'unite', `Pour des g/cm³, la masse doit être en grammes : ${fr(kg)} kg = ${fr(g)} g.`), mc(clean(V / g), 'mc:rho-inverse', 'notion', 'ρ = m / V : la masse divisée par le volume.')] }),
      numeric(clean(rho * 1000), { prompt: 'Exprime cette masse volumique en kg/m³.', unit: 'kg/m³', strictUnit: true, tolerance: 10, misconceptions: [
        mc(clean(rho / 1000), 'mc:conversion-sens', 'unite', '1 g/cm³ = 1 000 kg/m³ : un mètre cube contient un million de centimètres cubes, le nombre doit augmenter.'),
        mc(clean(rho * 1e6), 'mc:conversion-masse-oubliee', 'unite', 'Tu as converti le volume mais pas la masse : 1 g = 0,001 kg. Au total, 1 g/cm³ = 1 000 kg/m³.')] }),
      text(metalNames(metal), { prompt: 'De quel métal s’agit-il ?', placeholder: 'nom du métal' }),
    ], {
      prompt: `${who} trouve dans un atelier un bloc de métal en forme de pavé : ${L} cm × ${l} cm × ${fr(h)} cm. Sa masse est de ${fr(kg)} kg. Masses volumiques (en g/cm³) : ${TABLE_METAUX}.`,
      hints: ['Volume d’un pavé : longueur × largeur × hauteur.', 'Pour obtenir des g/cm³, la masse doit être en grammes : 1 kg = 1 000 g.', '1 g/cm³ = 1 000 kg/m³ (1 m³ = 1 000 000 cm³ et 1 kg = 1 000 g).'],
      solution: `V = ${L} × ${l} × ${fr(h)} = ${fr(V)} cm³ ; m = ${fr(kg)} kg = ${fr(g)} g. ρ = ${fr(g)} ÷ ${fr(V)} = ${fr(rho)} g/cm³ = ${fr(rho * 1000)} kg/m³ : c’est ${metalNames(metal)[2]} (tableau).`,
      expectedSeconds: 420,
    });
  },
  expert(rand, who) {
    const cat = ri(rand, 0, 2); const [mat, rho0] = pick(rand, MATERIAUX[cat]);
    const a = ri(rand, 2, 10); const b = ri(rand, 2, 10); const c = ri(rand, 2, 8);
    const V = a * b * c; const m = round(rho0 * V, 1); const rho = clean(m / V);
    const key = ['deux', 'eau', 'aucun'][cat];
    const why = (k) => (k === 'aucun' ? 'Ce n’est pas la masse de l’objet qui décide, mais sa masse volumique comparée à celle du liquide.'
      : k === 'deux' && key === 'eau' ? `L’huile (0,92 g/cm³) est moins dense que l’eau : un objet de ${fr(round(rho, 2))} g/cm³ y coule.`
        : `Compare ${fr(round(rho, 2))} g/cm³ à 1,00 (eau) et à 0,92 (huile) : un objet flotte si sa masse volumique est plus petite que celle du liquide.`);
    const verdict = { deux: 'il flotte sur les deux liquides', eau: 'il flotte sur l’eau mais coule dans l’huile', aucun: 'il coule dans les deux liquides' }[key];
    return problem([
      numeric(V, { prompt: 'Quel est le volume du pavé, en cm³ ?', unit: 'cm³', misconceptions: VOLUME_PAVE(a, b, c) }),
      numeric(rho, { prompt: 'Calcule sa masse volumique, en g/cm³ (au centième près).', unit: 'g/cm³', tolerance: 0.01, misconceptions: [mc(clean(V / m), 'mc:rho-inverse', 'notion', 'ρ = m / V : la masse divisée par le volume.')] }),
      text(FLOTTE[key], { prompt: 'Sur quel(s) liquide(s) le pavé flotte-t-il ? Réponds : « les deux », « l’eau seulement » ou « aucun ».', placeholder: 'les deux, l’eau seulement ou aucun',
        misconceptions: Object.keys(FLOTTE).filter((k) => k !== key).map((k) => mc(FLOTTE[k][0], k === 'aucun' ? 'mc:lourd-coule' : 'mc:comparer-masses-volumiques', 'raisonnement', why(k))) }),
      numeric(V, { prompt: 'Au-delà de quelle masse un pavé de mêmes dimensions coulerait-il dans l’eau, en g ?', unit: 'g', misconceptions: [
        mc(clean(0.92 * V), 'mc:mauvais-liquide', 'lecture', 'La question porte sur l’eau (1,00 g/cm³), pas sur l’huile.'),
        mc(m, 'mc:masse-actuelle', 'raisonnement', 'C’est la masse actuelle du pavé. Cherche la masse pour laquelle sa masse volumique atteindrait celle de l’eau : m = 1,00 × V.')] }),
    ], {
      prompt: `${who} a un pavé de ${a} cm × ${b} cm × ${c} cm, fait d’un matériau inconnu ; sa masse est de ${fr(m)} g. On le pose sur de l’eau (masse volumique 1,00 g/cm³), puis sur de l’huile (0,92 g/cm³).`,
      hints: ['V = longueur × largeur × hauteur, puis ρ = m / V.', 'Un objet flotte sur un liquide si sa masse volumique est plus petite que celle du liquide.', 'Le pavé coulerait dans l’eau si sa masse volumique dépassait 1,00 g/cm³ : m = 1,00 × V.'],
      solution: `V = ${a} × ${b} × ${c} = ${V} cm³ ; ρ = ${fr(m)} ÷ ${V} ${eq(rho, 2)} g/cm³. Comparé à l’eau (1,00) et à l’huile (0,92) : ${verdict}. Il coulerait dans l’eau au-delà de 1,00 × ${V} = ${V} g. (C’est sans doute ${mat}, ρ ≈ ${fr(rho0)} g/cm³.)`,
      justify: { prompt: 'Explique la règle qui permet de prévoir si un objet flotte, et applique-la aux deux liquides.', minWords: 15, keywords: ['masse volumique', 'inférieure', 'supérieure', 'plus petite', 'plus grande', 'compare'],
        example: `Un objet flotte si sa masse volumique est plus petite que celle du liquide. Ici ρ = ${fr(m)} ÷ ${V}, environ ${fr(round(rho, 2))} g/cm³ ; je la compare à 1,00 pour l’eau et à 0,92 pour l’huile : ${verdict}.` },
      expectedSeconds: 480,
    });
  },
};

/* ------------------------------------------------------------------ */
/* 4. Protéger une DEL : choisir la résistance (4e)                    */
/* ------------------------------------------------------------------ */
const DELS = [['rouge', 2], ['jaune', 2.1], ['verte', 2.2], ['bleue', 3], ['blanche', 3.2]];
/** Valeurs normalisées de la série E12, de 10 Ω à 8,2 kΩ. */
const E12 = [1, 10, 100].flatMap((k) => [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82].map((v) => v * k));
const nextE12 = (r) => E12.find((v) => v >= r - 1e-9);
const prevE12 = (r) => [...E12].reverse().find((v) => v < r - 1e-9);
const e12List = (lo, hi) => E12.slice(Math.max(0, E12.indexOf(lo) - 2), E12.indexOf(hi) + 3).join(' ; ');
const notE12 = (r) => !E12.some((v) => Math.abs(v - r) < 1);
const ADDITIVITE = 'Loi d’additivité des tensions en série : U(générateur) = somme des tensions aux bornes des dipôles.';

const DEL = {
  classe(rand, who) {
    const [[color, UL], UG, I] = until(() => [pick(rand, DELS), pick(rand, [4.5, 5, 6, 9, 12]), pick(rand, [10, 15, 20, 25])], ([[, ul], ug, i]) => ug - ul >= 1 && isInt((1000 * (ug - ul)) / i));
    const UR = clean(UG - UL); const A = clean(I / 1000); const R = clean((1000 * UR) / I);
    return problem([
      numeric(UR, { prompt: 'Quelle tension doit-il y avoir aux bornes de la résistance, en V ?', unit: 'V', misconceptions: [
        mc(UG, 'mc:tension-totale', 'lecture', 'La résistance et la DEL se partagent la tension du générateur (loi d’additivité des tensions en série).'),
        mc(clean(UG + UL), 'mc:additivite-sens', 'notion', `En série : U(générateur) = U(DEL) + U(résistance), donc U(résistance) = ${fr(UG)} − ${fr(UL)}.`)] }),
      numeric(A, { prompt: 'Quelle est l’intensité du courant qui traverse la résistance, en ampères ?', unit: 'A', strictUnit: true, misconceptions: [
        mc(clean(I / 100), 'mc:conversion-ma', 'unite', '1 mA = 0,001 A : divise par 1 000.'), mc(I * 1000, 'mc:conversion-sens', 'unite', 'Un ampère vaut 1 000 mA : le nombre d’ampères est plus petit que le nombre de milliampères.')] }),
      numeric(R, { prompt: 'Quelle résistance faut-il choisir, en Ω ?', unit: 'Ω', misconceptions: [
        mc(clean(UR / I), 'mc:ma-non-converti', 'unite', `Convertis d’abord ${I} mA en ampères : ${fr(A)} A.`),
        mc(clean(UG / A), 'mc:tension-totale', 'lecture', `La résistance n’a que ${fr(UR)} V à ses bornes, pas ${fr(UG)} V.`),
        mc(clean(A / UR), 'mc:r-inverse', 'notion', 'R = U / I : la tension divisée par l’intensité.')] }),
    ], {
      prompt: `${who} monte une DEL ${color} en série avec une résistance, sur un générateur de ${fr(UG)} V. Pour bien éclairer sans être abîmée, la DEL doit avoir ${fr(UL)} V à ses bornes et être traversée par un courant de ${I} mA.`,
      hints: [ADDITIVITE, 'En série, la même intensité traverse tous les dipôles ; 1 mA = 0,001 A.', 'Loi d’Ohm : U = R × I, donc R = U / I (U en V, I en A).'],
      solution: `Tension de la résistance : ${fr(UG)} − ${fr(UL)} = ${fr(UR)} V. Intensité (la même partout en série) : ${I} mA = ${fr(A)} A. Loi d’Ohm : R = U / I = ${fr(UR)} ÷ ${fr(A)} = ${fr(R)} Ω.`,
      expectedSeconds: 300,
    });
  },
  approfondissement(rand, who) {
    const [[color, UL], UG, Imax] = until(() => [pick(rand, DELS), pick(rand, [5, 6, 9, 12]), pick(rand, [15, 20, 25, 30])],
      ([[, ul], ug, i]) => { const r = (1000 * (ug - ul)) / i; return r >= 50 && r <= 900 && notE12(r); });
    const UR = clean(UG - UL); const Rmin = clean((1000 * UR) / Imax); const Rc = nextE12(Rmin); const Rb = prevE12(Rmin); const Ir = clean((1000 * UR) / Rc);
    // résistance MINIMALE : on arrondit à l'unité supérieure (avec l'arrondi inférieur, l'intensité dépasserait Imax)
    const lim = bound(Rmin, 'min');
    const arrondiR = lim.gap ? [mc(lim.unsafe, 'mc:arrondi-par-defaut', 'raisonnement', `Avec ${fr(lim.unsafe)} Ω, l’intensité serait ${fr(UR)} ÷ ${fr(lim.unsafe)} A ${beyond((1000 * UR) / lim.unsafe, Imax)} mA : c’est plus que ${Imax} mA, la DEL ne serait pas protégée. Une résistance MINIMALE s’arrondit à l’unité supérieure : ${fr(lim.answer)} Ω.`)] : [];
    const nonNormalisees = [...new Set([lim.answer, round(Rmin)])];
    return problem([
      numeric(UR, { prompt: 'Quelle tension y aura-t-il aux bornes de la résistance, en V ?', unit: 'V', misconceptions: [mc(UG, 'mc:tension-totale', 'lecture', 'La DEL prend une partie de la tension du générateur : U(résistance) = U(générateur) − U(DEL).')] }),
      numeric(lim.answer, { prompt: `Quelle est la plus petite résistance qui ne laisse pas dépasser ${Imax} mA, en Ω (arrondie à l’unité) ?`, unit: 'Ω', tolerance: lim.tolerance, misconceptions: [
        ...arrondiR,
        mc(clean(UR / Imax), 'mc:ma-non-converti', 'unite', `Convertis ${Imax} mA en ampères : ${fr(Imax / 1000)} A.`),
        mc(clean((1000 * UG) / Imax), 'mc:tension-totale', 'lecture', `La résistance n’a que ${fr(UR)} V à ses bornes.`), mc(clean(Imax / 1000 / UR), 'mc:r-inverse', 'notion', 'R = U / I.')] }),
      numeric(Rc, { prompt: 'Les résistances ne sont vendues qu’avec des valeurs normalisées (liste de l’énoncé). Laquelle choisir, en Ω ?', unit: 'Ω', misconceptions: [
        mc(Rb, 'mc:r-i-sens', 'raisonnement', `Avec ${Rb} Ω, l’intensité serait ${beyond((1000 * UR) / Rb, Imax)} mA : c’est trop. Plus la résistance est petite, plus l’intensité est grande : prends la valeur juste au-dessus.`),
        ...nonNormalisees.map((r) => mc(r, 'mc:valeur-non-normalisee', 'methode', 'Cette valeur n’est pas vendue : choisis parmi les valeurs normalisées de la liste.'))] }),
      numeric(Ir, { prompt: 'Avec cette résistance, quelle intensité traverse la DEL, en mA (arrondie au dixième) ?', unit: 'mA', tolerance: 0.051, misconceptions: [
        mc(clean((1000 * UG) / Rc), 'mc:tension-totale', 'lecture', `Utilise la tension aux bornes de la résistance (${fr(UR)} V).`),
        mc(clean(UR / Rc), 'mc:conversion-ma', 'unite', 'Tu as obtenu des ampères : 1 A = 1 000 mA.'),
        mc(Imax, 'mc:intensite-max', 'raisonnement', `La résistance choisie est plus grande que la résistance minimale (${fr(lim.answer)} Ω) : l’intensité est donc un peu inférieure à ${Imax} mA. Calcule I = U / R.`)] }),
    ], {
      prompt: `${who} veut alimenter une DEL ${color} (${fr(UL)} V à ses bornes) avec un générateur de ${fr(UG)} V, sans que l’intensité dépasse ${Imax} mA. On place une résistance en série ; on suppose que la tension de la DEL reste ${fr(UL)} V. Valeurs vendues (Ω) : ${e12List(Rb, Rc)}.`,
      hints: [ADDITIVITE, 'R = U / I avec I en ampères : plus R est grande, plus I est petite. Une résistance minimale s’arrondit donc à l’unité supérieure.', 'Prends la valeur normalisée juste AU-DESSUS du minimum calculé, puis recalcule I = U / R.'],
      solution: `U(résistance) = ${fr(UG)} − ${fr(UL)} = ${fr(UR)} V. R minimale = ${fr(UR)} ÷ ${fr(Imax / 1000)} ${eq(Rmin, 2)} Ω${lim.gap ? `, arrondie à l’unité supérieure : ${fr(lim.answer)} Ω (avec ${fr(lim.unsafe)} Ω, l’intensité dépasserait ${Imax} mA)` : ''}. Valeur normalisée juste au-dessus : ${Rc} Ω (avec ${Rb} Ω, on dépasserait ${Imax} mA). Intensité : ${fr(UR)} ÷ ${Rc} ${eq(Ir / 1000, 4)} A, soit ${fr(round(Ir, 1))} mA.`,
      expectedSeconds: 420,
    });
  },
  expert(rand, who) {
    const pair = () => { const x = pick(rand, DELS); let y; do { y = pick(rand, DELS); } while (y === x); return [x, y]; };
    const [[[c1, u1], [c2, u2]], UG, Imax] = until(() => [pair(), pick(rand, [6, 9]), pick(rand, [20, 25, 30])],
      ([[[, a], [, b]], ug, i]) => { const r = (1000 * (ug - a - b)) / i; return ug - a - b >= 0.8 && r >= 40 && r <= 900 && notE12(r); });
    const sumU = clean(u1 + u2); const UR = clean(UG - sumU); const Rmin = (1000 * UR) / Imax; const Rc = nextE12(Rmin); const Rb = prevE12(Rmin);
    const Umax = clean(sumU + (Rc * Imax) / 1000);
    const UG2 = until(() => pick(rand, [4.5, 6, 7.5, 9, 10.5, 12]), (u) => u !== UG && u >= sumU + 0.5 && Math.abs(u - Umax) >= 0.3);
    const ok = UG2 <= Umax;
    // tension MAXIMALE au dixième : arrondi inférieur (au-dessus, l'intensité dépasserait Imax) ; résistance minimale : arrondi supérieur
    const lim = bound(Umax, 'max', 1); const RminUp = boundAnswer(Rmin, 'min').answer;
    const arrondiU = lim.gap ? [mc(lim.unsafe, 'mc:arrondi-par-exces', 'raisonnement', `Avec ${fr(lim.unsafe)} V, la résistance recevrait ${fr(lim.unsafe)} − ${fr(sumU)} = ${fr(lim.unsafe - sumU)} V, et l’intensité serait ${fr(lim.unsafe - sumU)} ÷ ${Rc} A ${beyond((1000 * (lim.unsafe - sumU)) / Rc, Imax)} mA : c’est plus que ${Imax} mA. Une tension MAXIMALE s’arrondit au dixième inférieur : ${fr(lim.answer)} V.`)] : [];
    // si l'arrondi sûr tombe sur la tension de la pile, répondre la tension de la pile est juste : ce n'est plus une idée fausse
    const pile = Math.abs(UG - lim.answer) > lim.tolerance + 1e-9 ? [mc(UG, 'mc:tension-pile', 'raisonnement', 'La résistance choisie est un peu plus grande que le minimum : on peut dépasser légèrement la tension de la pile. Calcule U(DEL) + U(DEL) + R × I(max).')] : [];
    return problem([
      numeric(UR, { prompt: 'Quelle tension y aura-t-il aux bornes de la résistance, en V ?', unit: 'V', misconceptions: [
        mc(clean(UG - u1), 'mc:une-seule-del', 'lecture', 'Les deux DEL sont en série : retire leurs deux tensions.'), mc(clean(UG - u2), 'mc:une-seule-del', 'lecture', 'Les deux DEL sont en série : retire leurs deux tensions.'),
        mc(UG, 'mc:tension-totale', 'lecture', 'Les DEL prennent une partie de la tension du générateur.')] }),
      numeric(Rc, { prompt: 'Quelle résistance normalisée faut-il choisir, en Ω ?', unit: 'Ω', misconceptions: [
        mc(Rb, 'mc:r-i-sens', 'raisonnement', `Avec ${Rb} Ω, l’intensité dépasserait ${Imax} mA : plus la résistance est petite, plus l’intensité est grande.`),
        ...[...new Set([RminUp, round(Rmin)])].map((r) => mc(r, 'mc:valeur-non-normalisee', 'methode', 'Cette valeur n’est pas vendue : choisis la valeur normalisée juste au-dessus.'))] }),
      numeric(lim.answer, { prompt: `Avec cette résistance, quelle est la tension maximale du générateur pour ne pas dépasser ${Imax} mA, en V (au dixième) ?`, unit: 'V', tolerance: lim.tolerance, misconceptions: [
        ...arrondiU,
        mc(clean((Rc * Imax) / 1000), 'mc:additivite-oubliee', 'notion', 'R × I donne seulement la tension de la résistance : ajoute celles des deux DEL (loi d’additivité).'),
        mc(clean(sumU + Rc * Imax), 'mc:ma-non-converti', 'unite', 'Convertis l’intensité en ampères avant d’utiliser U = R × I.'),
        ...pile] }),
      yesNo(ok, `Peut-on alimenter ce montage avec un générateur de ${fr(UG2)} V sans dépasser ${Imax} mA ? (oui ou non)`, 'mc:comparaison-tension', 'raisonnement', `Compare ${fr(UG2)} V à la tension maximale trouvée (${fr(Umax)} V).`),
    ], {
      prompt: `${who} prépare une guirlande : une DEL ${c1} (${fr(u1)} V) et une DEL ${c2} (${fr(u2)} V) en série avec une résistance, sur une pile de ${UG} V. L’intensité ne doit pas dépasser ${Imax} mA. Résistances vendues (Ω) : ${e12List(Rb, Rc)}. On suppose que la tension de chaque DEL ne change pas.`,
      hints: [ADDITIVITE, `R minimale = U(résistance) ÷ I(max), avec I en A ; choisis la valeur vendue juste au-dessus.`, 'Tension maximale du générateur = U(DEL 1) + U(DEL 2) + R × I(max). C’est une limite : arrondis-la vers le bas.'],
      solution: `U(résistance) = ${UG} − ${fr(u1)} − ${fr(u2)} = ${fr(UR)} V ; R minimale = ${fr(UR)} ÷ ${fr(Imax / 1000)} ${eq(Rmin, 2)} Ω, on choisit ${Rc} Ω. Tension maximale : ${fr(sumU)} + ${Rc} × ${fr(Imax / 1000)} ${eq(Umax, 3)} V${lim.gap ? `, soit ${fr(lim.answer)} V au dixième inférieur (avec ${fr(lim.unsafe)} V, l’intensité dépasserait ${Imax} mA)` : ''}. Avec ${fr(UG2)} V : ${ok ? 'c’est en dessous, les DEL restent protégées' : 'c’est au-dessus, l’intensité dépasserait ' + Imax + ' mA'}.`,
      justify: { prompt: 'Explique ton choix de résistance et ce qui change quand on change de générateur.', minWords: 15, keywords: ['additivité', 'tension', 'intensité', 'Ohm', 'série'],
        example: `Par la loi d’additivité, la résistance reçoit ${fr(UR)} V ; avec la loi d’Ohm il faut au moins ${fr(RminUp)} Ω, donc ${Rc} Ω. Avec cette résistance, l’intensité reste sous ${Imax} mA tant que la tension ne dépasse pas ${fr(Umax)} V : ${ok ? 'c’est le cas' : 'ce n’est pas le cas'} avec ${fr(UG2)} V.` },
      expectedSeconds: 540,
    });
  },
};
export const PROBLEMES_PC = [
  { id: 'p-pc-aller-retour', subject: 'pc', label: 'Problème : la vitesse moyenne d’un aller-retour', skill: 'pc.mouvement.vitesse', skills: ['pc5.mouvement.decrire'], levels: ['5e', '4e'], tracks: TROIS,
    description: 'Vitesse moyenne d’un trajet en deux parties : ce n’est pas la moyenne des deux vitesses. ◆ durées et conversion en m/s ; ✦ retrouver la vitesse de descente pour une moyenne visée, et le cas impossible.', make: tiered(ALLER_RETOUR) },
  { id: 'p-pc-orage', subject: 'pc', label: 'Problème : à quelle distance est l’orage ?', skill: 'pc.signaux.propagation', skills: ['pc.mouvement.vitesse'], levels: ['4e'], tracks: TROIS,
    description: 'Durée entre l’éclair et le tonnerre, son à 340 m/s, lumière quasi instantanée. ◆ la règle « secondes ÷ 3 » et son écart ; ✦ trois éclairs : l’orage s’approche-t-il, à quelle vitesse ?', make: tiered(ORAGE) },
  { id: 'p-pc-quel-metal', subject: 'pc', label: 'Problème : quel est ce métal ?', skill: 'pc.matiere.masse-volumique', skills: [], levels: ['4e'], tracks: TROIS,
    description: 'Masse à la balance, volume par déplacement d’eau, masse volumique et tableau de valeurs. ◆ pavé, kg et kg/m³ ; ✦ l’objet flotte-t-il sur l’eau, sur l’huile ?', make: tiered(METAL) },
  { id: 'p-pc-proteger-del', subject: 'pc', label: 'Problème : choisir la résistance qui protège une DEL', skill: 'pc.electricite.ohm', skills: ['pc4.electricite.lois'], levels: ['4e'], tracks: TROIS,
    description: 'Additivité des tensions en série et loi d’Ohm. ◆ valeur normalisée juste au-dessus et intensité obtenue ; ✦ deux DEL, tension maximale du générateur.', make: tiered(DEL) },
];
