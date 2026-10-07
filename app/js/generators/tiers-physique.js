/**
 * Niveaux ◆ approfondissement et ✦ expert des générateurs de physique-chimie (vitesse, masse volumique, loi d'Ohm, poids).
 * Chaque fonction reçoit (rand, options) et renvoie un exercice comme `make`.
 * ◆ : conversions, plusieurs opérations, question posée à l'envers ; ✦ : plusieurs étapes, cas piège,
 * conclusion à donner (oui / non, matériau…). Toutes les idées fausses sont calculées avec les nombres tirés.
 */
import { ri, pick, sample, clean, fr, sq, mc, numeric, text, problem, boundAnswer } from './gen-util.js';
import { PRENOMS, prenom, round, isRound, eur, cap, de, choice, hm, sane, num, yesNo, tableFig, pt, frameAround } from './tiers-outils.js';

/* ======================================================================= */
/*                          Vitesse, distance, durée                        */
/* ======================================================================= */

/** ◆ km et minutes → km/h. */
function vitKmMin(rand) {
  const [mode, speeds] = pick(rand, [['à vélo', [12, 15, 18, 20, 24, 30]], ['en voiture', [45, 60, 72, 80, 90]], ['en roller', [12, 15, 18]], ['en scooter', [36, 40, 45]]]);
  let v; let t; let d;
  do { v = pick(rand, speeds); t = pick(rand, [10, 12, 15, 20, 24, 30, 36, 40, 45, 48, 50, 75, 80, 90, 100]); d = clean((v * t) / 60); } while (!isRound(d, 1));
  const who = prenom(rand); const th = `${isRound(t / 60, 4) ? '=' : '≈'} ${fr(round(t / 60, 4))} h`;
  // au-delà d'une heure, l'énoncé affiche « 1 h 20 min » : l'erreur typique est de lire 1,20 h (et non « 80 min = 0,80 h »)
  const h = Math.floor(t / 60); const m = t % 60; const hDec = `${h},${String(m).padStart(2, '0')}`;
  const mcs = t < 60
    ? [mc(clean(d / t), 'mc:duree-minutes', 'unite', `La durée est en minutes : convertis-la en heures (${t} min ${th}) pour obtenir des km/h.`),
      mc(clean(d / (t / 100)), 'mc:duree-decimale', 'notion', `${t} min ne font pas 0,${t} h : 1 h = 60 min, donc ${t} min = ${t} ÷ 60 h.`)]
    : [mc(clean(d / t), 'mc:duree-minutes', 'unite', `Tu as divisé par ${t}, la durée comptée en minutes : pour obtenir des km/h, la durée doit être en heures (${hm(t)} ${th}).`),
      mc(clean(d / (h + m / 100)), 'mc:duree-decimale', 'notion', `${hm(t)} ne fait pas ${hDec} h : ${m} min = ${m}/60 h ${isRound(m / 60, 2) ? '=' : '≈'} ${fr(round(m / 60, 2))} h.`)];
  mcs.push(mc(clean(t / 60 / d), 'mc:vitesse-inverse', 'notion', 'La vitesse est la distance divisée par la durée, pas l’inverse.'));
  return num(v, {
    prompt: `${who} parcourt ${fr(d)} km ${mode} en ${hm(t)}. Calcule sa vitesse moyenne en km/h.`, unit: 'km/h', representation: 'concrete', expectedSeconds: 150, misconceptions: mcs,
    hints: ['v = d / t, avec t en heures pour obtenir des km/h.', t < 60 ? `${t} min = ${t} ÷ 60 h.` : `${hm(t)} = ${t} min = ${t} ÷ 60 h (et non ${hDec} h).`, `Autre méthode : ${fr(d)} km en ${t} min, donc ${fr(d)} ÷ ${t} km par minute, et 60 fois plus en une heure.`],
    solution: `t = ${t < 60 ? '' : `${hm(t)} = `}${t} min = ${t} ÷ 60 h ${th}. v = d / t = ${fr(d)} × 60 ÷ ${t} = ${fr(v)} km/h.`,
  });
}

/** ◆ Course à pied : m/s puis km/h. */
function vitCourse(rand) {
  let v; let d; let t;
  do { v = pick(rand, [3, 3.5, 4, 4.5, 5, 6]); d = pick(rand, [400, 800, 1000, 1500, 2000, 3000, 5000]); t = d / v; } while (!Number.isInteger(t) || t < 60);
  const m = Math.floor(t / 60); const s = t % 60; const who = prenom(rand); const tTxt = s ? `${m} min ${s} s` : `${m} min`;
  const mis1 = [mc(clean(d / (t / 60)), 'mc:duree-minutes', 'unite', `Ce résultat est en mètres par minute : convertis la durée en secondes (${tTxt} = ${t} s).`)];
  if (s) mis1.push(mc(round(d / ((m + s / 100) * 60), 3), 'mc:duree-decimale', 'notion', `${m} min ${s} s ne font pas ${m},${s} min : ${tTxt} = ${m} × 60 + ${s} = ${t} s.`));
  return problem([
    num(v, { prompt: 'Vitesse moyenne, en m/s ?', unit: 'm/s', misconceptions: mis1 }),
    num(clean(v * 3.6), { prompt: 'Cette vitesse, en km/h ?', unit: 'km/h', strictUnit: true, misconceptions: [mc(round(v / 3.6, 3), 'mc:conversion-sens', 'notion', 'Pour passer des m/s aux km/h, on multiplie par 3,6.'), mc(clean((v * 60) / 1000), 'mc:heure-60', 'notion', '1 h = 3 600 s (et non 60 s).')] }),
  ], {
    prompt: `${who} court ${fr(d)} m en ${tTxt}.`,
    representation: 'concrete', expectedSeconds: 240,
    hints: [`Convertis la durée en secondes : ${tTxt} = ${t} s.`, 'v = d / t avec d en m et t en s donne des m/s.', '1 m/s = 3,6 km/h.'],
    solution: `t = ${t} s ; v = ${fr(d)} ÷ ${t} = ${fr(v)} m/s = ${fr(v)} × 3,6 = ${fr(v * 3.6)} km/h.`,
  });
}

/** ◆ Distance avec une durée en h et min. */
function vitDistanceHM(rand) {
  let v; let h; let m; let d;
  do { v = pick(rand, [60, 80, 90, 100, 110, 120, 130, 150, 200, 240, 300, 320]); h = ri(rand, 0, 3); m = pick(rand, [6, 12, 15, 18, 20, 24, 30, 36, 40, 45, 48]); d = clean(v * (h + m / 60)); } while (!isRound(d, 1));
  const mobile = v <= 130 ? 'Une voiture' : 'Un TGV';
  return num(d, {
    prompt: `${mobile} roule à ${v} km/h de moyenne pendant ${h ? `${h} h ` : ''}${m} min. Quelle distance est parcourue ?`, unit: 'km', representation: 'concrete', expectedSeconds: 150,
    misconceptions: [
      mc(clean(v * (h + m / 100)), 'mc:duree-decimale', 'notion', `${m} min ne font pas 0,${m} h : ${m} min = ${m} ÷ 60 h.`),
      mc(clean(v * (h * 60 + m)), 'mc:duree-minutes', 'unite', 'Avec une vitesse en km/h, la durée doit être en heures, pas en minutes.'),
      mc(round(v / (h + m / 60), 2), 'mc:distance-division', 'notion', 'd = v × t : à vitesse constante, plus on roule longtemps, plus la distance est grande.'),
    ],
    hints: ['d = v × t, avec t en heures.', `${m} min = ${m} ÷ 60 h = ${fr(round(m / 60, 4))} h.`, `t = ${h} + ${fr(round(m / 60, 4))} h.`],
    solution: `t = ${h} h ${m} min = ${fr(round(h + m / 60, 4))} h. d = ${v} × ${fr(round(h + m / 60, 4))} = ${fr(d)} km.`,
  });
}

/** ◆ Distance en km avec une vitesse en m/s et une durée en min s. */
function vitDistanceDrone(rand) {
  const v = pick(rand, [8, 10, 12, 15, 18, 20]); const m = ri(rand, 1, 8); const s = pick(rand, [0, 15, 20, 30, 40, 45]);
  const t = 60 * m + s; const dm = v * t; const ans = clean(dm / 1000); const tTxt = s ? `${m} min ${s} s` : `${m} min`;
  const mcs = [mc(dm, 'mc:conversion-km', 'unite', `Ce résultat est en mètres : ${fr(dm)} m = ${fr(ans)} km.`), mc(clean((v * (m + s / 60)) / 1000), 'mc:duree-minutes', 'unite', 'Avec une vitesse en m/s, la durée doit être en secondes.')];
  if (s) mcs.push(mc(clean((v * (m + s / 100) * 60) / 1000), 'mc:duree-decimale', 'notion', `${m} min ${s} s ne font pas ${m},${s} min : ${tTxt} = ${t} s.`));
  return num(ans, {
    prompt: `Un drone vole à ${v} m/s pendant ${tTxt}. Quelle distance parcourt-il, en km ?`, unit: 'km', strictUnit: true, representation: 'concrete', expectedSeconds: 150, misconceptions: mcs,
    hints: [`Convertis la durée en secondes : ${tTxt} = ${t} s.`, 'd = v × t donne des mètres.', '1 km = 1 000 m.'],
    solution: `t = ${t} s ; d = ${v} × ${t} = ${fr(dm)} m = ${fr(ans)} km.`,
  });
}

/** ◆ Durée en minutes (vitesse en km/h). */
function vitDureeMin(rand) {
  const [mobile, speeds] = pick(rand, [['Un bus', [30, 40, 45, 50, 60]], ['Un camion', [60, 72, 80, 90]], ['Une moto', [72, 80, 90, 120]], ['Un tracteur', [24, 30, 36, 40]]]);
  let v; let d; let t;
  do { v = pick(rand, speeds); d = ri(rand, 4, 150); t = (d / v) * 60; } while (!Number.isInteger(round(t, 6)) || t < 10 || t > 240 || round(t, 6) % 60 === 0);
  t = round(t, 0);
  return num(t, {
    prompt: `${mobile} roule à ${v} km/h de moyenne. Combien de minutes lui faut-il pour parcourir ${d} km ?`, unit: 'min', tolerance: 0.01, representation: 'concrete', expectedSeconds: 150,
    misconceptions: [
      mc(clean(d / v), 'mc:heures-minutes', 'unite', `Ce résultat est en heures : multiplie par 60 pour avoir des minutes.`),
      mc(clean((d / v) * 100), 'mc:duree-decimale', 'notion', '1 h = 60 min (et non 100 min).'),
      mc(clean((v / d) * 60), 'mc:duree-inverse', 'notion', 't = d / v : on divise la distance par la vitesse.'),
    ],
    hints: ['t = d / v donne une durée en heures.', `t = ${d} ÷ ${v} h.`, 'Multiplie par 60 pour convertir en minutes.'],
    solution: `t = ${d} ÷ ${v} h = ${d} × 60 ÷ ${v} min = ${fr(t)} min${t >= 60 ? ` (soit ${hm(t)})` : ''}.`,
  });
}

/** ◆ Durée en minutes avec une vitesse en m/s et une distance en km. */
function vitDureeNage(rand) {
  let v; let d; let tm;
  do { v = pick(rand, [1, 1.2, 1.25, 1.5, 2]); d = pick(rand, [0.6, 0.9, 1.2, 1.5, 1.8, 3, 3.6]); tm = (d * 1000) / v / 60; } while (!isRound(tm, 1));
  const who = prenom(rand); const ts = clean((d * 1000) / v);
  return num(clean(tm), {
    prompt: `${who} nage à la vitesse moyenne de ${fr(v)} m/s. Combien de minutes faut-il pour nager ${fr(d)} km ?`, unit: 'min', representation: 'concrete', expectedSeconds: 150,
    misconceptions: [
      mc(clean(d / v), 'mc:unites-melangees', 'unite', `Avec une vitesse en m/s, la distance doit être en mètres : ${fr(d)} km = ${fr(d * 1000)} m.`),
      mc(ts, 'mc:secondes-minutes', 'unite', `Ce résultat est en secondes : ${fr(ts)} s = ${fr(ts)} ÷ 60 min.`),
    ],
    hints: [`${fr(d)} km = ${fr(d * 1000)} m.`, 't = d / v donne des secondes.', 'Divise par 60 pour des minutes.'],
    solution: `t = ${fr(d * 1000)} ÷ ${fr(v)} = ${fr(ts)} s = ${fr(ts)} ÷ 60 = ${fr(tm)} min.`,
  });
}

/** ✦ Aller-retour à deux vitesses : la vitesse moyenne n’est pas la moyenne des vitesses. */
function vitAllerRetour(rand) {
  const velo = rand() < 0.5;
  const speeds = velo ? [10, 12, 15, 18, 20, 24, 30] : [30, 40, 45, 50, 60, 72, 80, 90, 100, 120];
  let d; let v1; let v2; let t1; let t2; let avg;
  do {
    [v1, v2] = sample(rand, speeds, 2); d = pick(rand, velo ? [6, 8, 9, 10, 12, 15, 18, 20, 24, 30] : [20, 24, 30, 36, 40, 45, 60, 72, 90, 120]);
    t1 = (d / v1) * 60; t2 = (d / v2) * 60; avg = (2 * v1 * v2) / (v1 + v2);
  } while (!Number.isInteger(round(t1, 6)) || !Number.isInteger(round(t2, 6)) || !isRound(avg, 1));
  t1 = round(t1, 0); t2 = round(t2, 0); avg = clean(avg);
  const who = prenom(rand); const slow = Math.min(v1, v2); const mean = clean((v1 + v2) / 2);
  const where = velo ? ['à vélo', 'deux villages distants'] : ['en voiture', 'deux villes distantes'];
  return problem([
    num(t1, { prompt: 'Durée de l’aller, en minutes ?', unit: 'min', tolerance: 0.01, misconceptions: [mc(clean(d / v1), 'mc:heures-minutes', 'unite', 'Ce résultat est en heures : multiplie par 60.'), mc(clean((v1 / d) * 60), 'mc:duree-inverse', 'notion', 't = d / v.')] }),
    num(t2, { prompt: 'Durée du retour, en minutes ?', unit: 'min', tolerance: 0.01, misconceptions: [mc(clean(d / v2), 'mc:heures-minutes', 'unite', 'Ce résultat est en heures : multiplie par 60.'), mc(clean((v2 / d) * 60), 'mc:duree-inverse', 'notion', 't = d / v.')] }),
    num(avg, { prompt: 'Vitesse moyenne sur l’ensemble de l’aller-retour, en km/h ?', unit: 'km/h', tolerance: 0.05, misconceptions: [mc(mean, 'mc:moyenne-des-vitesses', 'raisonnement', `La vitesse moyenne n’est pas la moyenne des deux vitesses : on roule plus longtemps à ${slow} km/h. Calcule distance totale ÷ durée totale.`), mc(round((d * 60) / (t1 + t2), 2), 'mc:distance-aller-retour', 'lecture', `L’aller-retour mesure 2 × ${d} = ${2 * d} km.`)] }),
  ], {
    prompt: `${who} fait ${where[0]} l’aller-retour entre ${where[1]} de ${d} km : ${v1} km/h de moyenne à l’aller, ${v2} km/h au retour.`,
    representation: 'concrete', expectedSeconds: 360,
    hints: ['Calcule chaque durée avec t = d / v (en heures, puis en minutes).', `Distance totale : 2 × ${d} = ${2 * d} km ; durée totale : somme des deux durées.`, 'Vitesse moyenne = distance totale ÷ durée totale (en heures).'],
    solution: `Aller : ${d} × 60 ÷ ${v1} = ${t1} min. Retour : ${d} × 60 ÷ ${v2} = ${t2} min. Durée totale : ${t1 + t2} min. Vitesse moyenne : ${2 * d} km ÷ (${t1 + t2} ÷ 60) h = ${2 * d} × 60 ÷ ${t1 + t2} = ${fr(avg)} km/h — et non ${fr(mean)} km/h, car on roule plus longtemps à ${slow} km/h.`,
    justify: { prompt: 'Explique pourquoi la vitesse moyenne n’est pas la moyenne des deux vitesses.', minWords: 10, keywords: [['durée', 'temps', 'longtemps']], example: `On roule plus longtemps à ${slow} km/h qu’à ${Math.max(v1, v2)} km/h, donc la vitesse moyenne, distance totale divisée par la durée totale, vaut ${fr(avg)} km/h et non ${fr(mean)} km/h.` },
  });
}

/** ✦ Distance d’arrêt = distance de réaction + distance de freinage. */
function vitArret(rand) {
  const v = pick(rand, [36, 54, 72, 90, 108, 126]); const ms = clean(v / 3.6); const tr = pick(rand, [1, 1.5, 2]);
  const dr = clean(ms * tr); const df = Math.round((ms * ms) / 14); const da = clean(dr + df);
  const obstacle = Math.round(da + pick(rand, [-12, -8, -5, 6, 10, 15])); const stops = da < obstacle;
  return problem([
    num(ms, { prompt: 'Vitesse de la voiture, en m/s ?', unit: 'm/s', strictUnit: true, misconceptions: [mc(clean(v / 60), 'mc:heure-60', 'notion', '1 h = 3 600 s (et non 60 s) : on divise les km/h par 3,6.'), mc(clean(v * 3.6), 'mc:conversion-sens', 'notion', 'En m/s, le nombre est plus petit qu’en km/h : on divise par 3,6.')] }),
    num(dr, { prompt: `Distance parcourue pendant le temps de réaction (${fr(tr)} s), en m ?`, unit: 'm', misconceptions: [mc(clean(v * tr), 'mc:unites-melangees', 'unite', 'Avec une durée en secondes, utilise la vitesse en m/s.'), mc(round(ms / tr, 2), 'mc:distance-division', 'notion', 'd = v × t : on multiplie la vitesse par la durée.')] }),
    num(da, { prompt: 'Distance d’arrêt totale, en m ?', unit: 'm', misconceptions: [mc(df, 'mc:oubli-reaction', 'methode', 'Pendant le temps de réaction, la voiture roule encore sans freiner : distance d’arrêt = distance de réaction + distance de freinage.'), mc(dr, 'mc:oubli-freinage', 'methode', 'Il faut ajouter la distance de freinage.')] }),
    yesNo(stops, `Un obstacle apparaît à ${obstacle} m devant la voiture. S’arrête-t-elle avant l’obstacle ? (oui ou non)`, 'mc:comparaison-distance', 'raisonnement', stops ? `${fr(da)} m < ${obstacle} m : la voiture s’arrête avant l’obstacle.` : `${fr(da)} m > ${obstacle} m : la voiture n’a pas le temps de s’arrêter.`),
  ], {
    prompt: `Une voiture roule à ${v} km/h sur route sèche. Quand un obstacle apparaît, il faut ${fr(tr)} s avant de commencer à freiner (temps de réaction) ; ensuite, la voiture freine sur ${df} m.`,
    representation: 'concrete', expectedSeconds: 360,
    hints: ['Convertis la vitesse : divise les km/h par 3,6 pour avoir des m/s.', 'Distance de réaction = vitesse (m/s) × temps de réaction (s).', 'Distance d’arrêt = distance de réaction + distance de freinage ; compare-la à la distance de l’obstacle.'],
    solution: `${v} km/h = ${v} ÷ 3,6 = ${fr(ms)} m/s. Réaction : ${fr(ms)} × ${fr(tr)} = ${fr(dr)} m. Arrêt : ${fr(dr)} + ${df} = ${fr(da)} m. Obstacle à ${obstacle} m : ${stops ? 'la voiture s’arrête avant' : 'la voiture ne s’arrête pas à temps'}.`,
  });
}

/** ✦ Vitesse à tenir sur la fin du trajet pour arriver à l’heure. */
function vitATenir(rand) {
  let D; let T; let d1; let v1; let t1; let r; let d2; let v2;
  do {
    D = pick(rand, [60, 80, 90, 100, 120, 150]); T = pick(rand, [60, 75, 80, 90, 100, 120]); d1 = pick(rand, [20, 24, 30, 36, 40, 45, 50, 60]); v1 = pick(rand, [40, 45, 48, 50, 60, 72, 80, 90]);
    t1 = (d1 / v1) * 60; r = T - t1; d2 = D - d1; v2 = r > 0 ? d2 / (r / 60) : 0;
  } while (!Number.isInteger(round(t1, 6)) || d2 <= 0 || r < 15 || v2 > 110 || v2 < 30 || !isRound(v2, 1) || Math.abs(v2 - v1) < 5);
  t1 = round(t1, 0); r = round(r, 0); v2 = clean(v2); const Vm = D / (T / 60);
  const mobile = pick(rand, ['Un car scolaire', 'Une ambulance', 'Un camion de livraison', 'Un bus']);
  return problem([
    num(t1, { prompt: 'Durée de la première partie, en minutes ?', unit: 'min', tolerance: 0.01, misconceptions: [mc(clean(d1 / v1), 'mc:heures-minutes', 'unite', 'Ce résultat est en heures : multiplie par 60.')] }),
    num(r, { prompt: 'Temps restant pour la fin du trajet, en minutes ?', unit: 'min', tolerance: 0.01, misconceptions: [mc(clean(T - d1 / v1), 'mc:unites-melangees', 'unite', `Tu as soustrait une durée en heures (${fr(round(d1 / v1, 4))} h) à une durée en minutes : convertis d’abord.`)] }),
    num(v2, { prompt: 'Vitesse moyenne à tenir sur la fin du trajet, en km/h ?', unit: 'km/h', tolerance: 0.05, misconceptions: [mc(round(2 * Vm - v1, 1), 'mc:moyenne-des-vitesses', 'raisonnement', 'La vitesse moyenne n’est pas la moyenne des vitesses : raisonne avec la distance et le temps qui restent.'), mc(round(d2 / r, 3), 'mc:minutes-heures', 'unite', 'Ce résultat est en km par minute : convertis le temps restant en heures.'), mc(round(Vm, 1), 'mc:vitesse-moyenne-globale', 'lecture', 'C’est la vitesse moyenne sur tout le trajet ; mais une partie du trajet est déjà faite, à une autre vitesse.')] }),
  ], {
    prompt: `${mobile} doit parcourir ${D} km en ${hm(T)} pour arriver à l’heure. Sur les ${d1} premiers kilomètres, sa vitesse moyenne est de ${v1} km/h.`,
    representation: 'concrete', expectedSeconds: 360,
    hints: [`Durée de la première partie : ${d1} ÷ ${v1} h, à convertir en minutes.`, `Temps restant : ${T} min − cette durée ; distance restante : ${D} − ${d1} = ${d2} km.`, 'Vitesse à tenir = distance restante ÷ temps restant (en heures).'],
    solution: `Première partie : ${d1} × 60 ÷ ${v1} = ${t1} min. Temps restant : ${T} − ${t1} = ${r} min. Distance restante : ${d2} km. Vitesse : ${d2} ÷ (${r} ÷ 60) = ${d2} × 60 ÷ ${r} = ${fr(v2)} km/h.`,
  });
}

/* ======================================================================= */
/*                             Masse volumique                             */
/* ======================================================================= */

/** [nom, ρ en g/cm³, « de l’huile », « d’huile » (après une quantité)] */
const LIQUIDES = [['huile', 0.92, 'de l’huile', 'd’huile'], ['éthanol', 0.79, 'de l’éthanol', 'd’éthanol'], ['glycérine', 1.26, 'de la glycérine', 'de glycérine'], ['miel', 1.42, 'du miel', 'de miel'], ['essence', 0.75, 'de l’essence', 'd’essence'], ['eau de mer', 1.03, 'de l’eau de mer', 'd’eau de mer']];
const METAUX = [['aluminium', 2.7, 'de l’aluminium'], ['titane', 4.5, 'du titane'], ['zinc', 7.14, 'du zinc'], ['fer', 7.87, 'du fer'], ['cuivre', 8.96, 'du cuivre'], ['argent', 10.5, 'de l’argent'], ['plomb', 11.3, 'du plomb'], ['or', 19.3, 'de l’or']];
/** [matière, ρ en g/cm³] : celles qui flottent et celles qui coulent (même du bois). */
const MATIERES = [['du bois de chêne', 0.75], ['du bois de pin', 0.5], ['du liège', 0.24], ['de la paraffine', 0.9], ['de la glace', 0.92], ['du PVC', 1.38], ['du bois d’ébène', 1.2], ['du plexiglas', 1.18], ['du téflon', 2.2]];
const metalNames = (n) => [n, `le ${n}`, `l’${n}`, `du ${n}`, `de l’${n}`, `en ${n}`];

/** ◆ Liquide : volume en L ou cL, masse en g ou kg → g/cm³ puis kg/m³. */
function mvLiquide(rand) {
  const [, rho, , qte] = pick(rand, LIQUIDES); const cl = rand() < 0.5;
  const VL = cl ? pick(rand, [20, 25, 33, 50, 75]) / 100 : pick(rand, [0.25, 0.5, 0.75, 1.5, 2]);
  const Vcm3 = clean(VL * 1000); const mg = clean(rho * Vcm3); const inKg = mg >= 1000;
  const Vshown = cl ? clean(VL * 100) : VL; const Vtxt = cl ? `${fr(Vshown)} cL` : `${fr(VL)} L`;
  const mShown = inKg ? clean(mg / 1000) : mg; const mTxt = inKg ? `${fr(mShown)} kg` : `${fr(mg)} g`;
  return problem([
    num(rho, { prompt: 'Masse volumique de ce liquide, en g/cm³ ?', unit: 'g/cm³', misconceptions: [mc(clean(mShown / Vshown), 'mc:unites-melangees', 'unite', `Convertis d’abord : ${Vtxt} = ${fr(Vcm3)} cm³${inKg ? ` et ${mTxt} = ${fr(mg)} g` : ''}.`), mc(clean(Vcm3 / mg), 'mc:rho-inverse', 'notion', 'ρ = m / V : la masse divisée par le volume.')] }),
    num(clean(rho * 1000), { prompt: 'Exprime cette masse volumique en kg/m³.', unit: 'kg/m³', strictUnit: true, misconceptions: [mc(clean(rho / 1000), 'mc:conversion-sens', 'notion', '1 g/cm³ = 1 000 kg/m³ : le nombre en kg/m³ est plus grand.'), mc(clean(rho * 1e6), 'mc:conversion-partielle', 'methode', 'Il faut convertir la masse (g → kg) ET le volume (cm³ → m³) : 1 g/cm³ = 1 000 kg/m³.')] }),
  ], {
    prompt: `Une bouteille contient ${Vtxt} ${qte}. La masse de ce liquide est ${mTxt}.`,
    representation: 'concrete', expectedSeconds: 240,
    hints: ['ρ = m / V : avec m en g et V en cm³, on obtient des g/cm³.', '1 L = 1 000 cm³ ; 1 cL = 10 cm³ ; 1 kg = 1 000 g.', '1 g/cm³ = 1 000 kg/m³.'],
    solution: `V = ${Vtxt} = ${fr(Vcm3)} cm³ ; m = ${fr(mg)} g. ρ = ${fr(mg)} ÷ ${fr(Vcm3)} = ${fr(rho)} g/cm³ = ${fr(rho * 1000)} kg/m³.`,
  });
}

/** ◆ Masse en g à partir de ρ en kg/m³ et d’un volume en cm³. */
function mvMasseKgM3(rand) {
  const [name, rho, du] = pick(rand, METAUX); const V = pick(rand, [20, 40, 50, 125, 250, 400, 500]); const m = clean(rho * V);
  return num(m, {
    prompt: `La masse volumique ${du} est ${fr(rho * 1000)} kg/m³. Quelle est la masse, en g, d’une pièce en ${name} de ${V} cm³ ?`, unit: 'g', strictUnit: true, representation: 'concrete', expectedSeconds: 180,
    misconceptions: [
      mc(clean(rho * 1000 * V), 'mc:unites-melangees', 'unite', `Utilise des unités compatibles avec les cm³ : ${fr(rho * 1000)} kg/m³ = ${fr(rho)} g/cm³.`),
      mc(clean((rho * V) / 1000), 'mc:conversion-g-kg', 'unite', 'Ce nombre est la masse en kg : la question la demande en g.'),
      mc(clean((rho * 1000) / V), 'mc:rho-division', 'notion', 'm = ρ × V : on multiplie.'),
    ],
    hints: ['m = ρ × V.', `${fr(rho * 1000)} kg/m³ = ${fr(rho)} g/cm³ (on divise par 1 000).`, `m = ${fr(rho)} × ${V}.`],
    solution: `ρ = ${fr(rho * 1000)} kg/m³ = ${fr(rho)} g/cm³. m = ${fr(rho)} × ${V} = ${fr(m)} g.`,
  });
}

/** ◆ Lingot : volume d’un pavé, puis masse en kg. */
function mvLingot(rand) {
  const [name, rho, du] = pick(rand, METAUX.filter((x) => ['aluminium', 'cuivre', 'argent', 'plomb', 'or'].includes(x[0])));
  const a = pick(rand, [5, 6, 8, 10, 12]); const b = pick(rand, [3, 4, 5]); const c = pick(rand, [1, 1.5, 2, 2.5, 3]);
  const V = clean(a * b * c); const mg = clean(rho * V); const mk = round(mg / 1000, 2);
  return problem([
    num(V, { prompt: 'Volume du lingot, en cm³ ?', unit: 'cm³', misconceptions: [mc(clean(a + b + c), 'mc:volume-somme', 'notion', 'Le volume d’un pavé, c’est longueur × largeur × hauteur.'), mc(clean(a * b), 'mc:volume-aire', 'notion', 'Ce nombre est l’aire d’une face : multiplie encore par la troisième dimension.')] }),
    num(mk, { prompt: 'Masse du lingot, en kg (arrondie au centième) ?', unit: 'kg', strictUnit: true, round: 2, tolerance: 0.0051, misconceptions: [mc(mg, 'mc:conversion-g-kg', 'unite', `Ce nombre est la masse en g : ${fr(mg)} g = ${fr(mg / 1000)} kg.`), mc(round(V / rho, 2), 'mc:rho-inverse', 'notion', 'm = ρ × V : on multiplie le volume par la masse volumique.')] }),
  ], {
    prompt: `Un lingot en ${name} a la forme d’un pavé droit de ${a} cm × ${b} cm × ${fr(c)} cm. La masse volumique ${du} est ${fr(rho)} g/cm³.`,
    representation: 'concrete', expectedSeconds: 240,
    hints: ['Volume d’un pavé : longueur × largeur × hauteur.', 'm = ρ × V, en g si ρ est en g/cm³ et V en cm³.', '1 kg = 1 000 g.'],
    solution: `V = ${a} × ${b} × ${fr(c)} = ${fr(V)} cm³. m = ${fr(rho)} × ${fr(V)} = ${fr(mg)} g ≈ ${fr(mk)} kg.`,
  });
}

/** ◆ Volume en L à partir d’une masse en kg et de ρ en kg/m³. */
function mvVolumeLitres(rand) {
  const [, rho, du, qte] = pick(rand, LIQUIDES); let VL; let m;
  do { VL = pick(rand, [0.5, 1.5, 2, 2.5, 4, 5, 10, 20]); m = clean(rho * VL); } while (!isRound(m, 3));
  return num(VL, {
    prompt: `Un bidon contient ${fr(m)} kg ${qte}. La masse volumique ${du} est ${fr(rho * 1000)} kg/m³. Quel volume de liquide, en L, contient le bidon ?`, unit: 'L', strictUnit: true, representation: 'concrete', expectedSeconds: 180,
    misconceptions: [
      mc(clean(m / (rho * 1000)), 'mc:m3-litre', 'unite', 'Ce nombre est le volume en m³ : 1 m³ = 1 000 L.'),
      mc(clean(m * rho * 1000), 'mc:rho-produit', 'notion', 'V = m / ρ : on divise la masse par la masse volumique.'),
      mc(clean((rho * 1000) / m), 'mc:rho-inverse', 'notion', 'V = m / ρ (et non ρ / m).'),
    ],
    hints: ['V = m / ρ.', `${fr(rho * 1000)} kg/m³ = ${fr(rho)} kg/L (1 m³ = 1 000 L).`, `V = ${fr(m)} ÷ ${fr(rho)}.`],
    solution: `ρ = ${fr(rho * 1000)} kg/m³ = ${fr(rho)} kg/L. V = ${fr(m)} ÷ ${fr(rho)} = ${fr(VL)} L.`,
  });
}

/** ✦ Volume par déplacement d’eau, masse volumique, puis identification du métal. */
function mvIdentification(rand) {
  const [name, rho] = pick(rand, METAUX); const V = pick(rand, [4, 5, 8, 10, 12, 15, 20, 25]);
  const m = round(rho * V, 1); const V0 = pick(rand, [20, 25, 30, 40, 50, 60]); const V1 = V0 + V; const rhoM = round(m / V, 2);
  const nearest = (r) => METAUX.reduce((best, x) => (Math.abs(x[1] - r) < Math.abs(best[1] - r) ? x : best));
  const who = prenom(rand);
  // métal « trouvé » si l'on prend le niveau final (ou initial) de l'éprouvette pour volume de l'objet
  const misread = [[m / V1, V1, 'final'], [m / V0, V0, 'initial']].map(([r, vol, lvl]) => [nearest(r)[0], vol, lvl]).find(([n]) => n !== name);
  return problem([
    num(V, { prompt: 'Volume de l’objet, en cm³ ?', unit: 'cm³', misconceptions: [mc(V1, 'mc:volume-lecture-finale', 'methode', `${V1} mL est le volume de l’eau ET de l’objet : le volume de l’objet est la différence ${V1} − ${V0}.`), mc(V0 + V1, 'mc:volume-somme-niveaux', 'methode', 'On ne cumule pas les deux niveaux : l’objet occupe la différence entre le niveau final et le niveau initial.')] }),
    num(rhoM, { prompt: 'Masse volumique du métal, en g/cm³ (arrondie au centième) ?', unit: 'g/cm³', round: 2, tolerance: 0.0051, misconceptions: [mc(round(m / V1, 2), 'mc:volume-lecture-finale', 'methode', 'Utilise le volume de l’objet seul, pas le niveau final de l’eau.'), mc(round(V / m, 3), 'mc:rho-inverse', 'notion', 'ρ = m / V : la masse divisée par le volume.')] }),
    text(metalNames(name), { prompt: 'De quel métal l’objet est-il fait ? (utilise le tableau)', misconceptions: misread ? [mc(misread[0], 'mc:volume-lecture-finale', 'methode', `Ce métal correspond à une masse volumique calculée avec ${misread[1]} cm³ (le niveau ${misread[2]} de l’eau) : utilise le volume de l’objet seul (${V} cm³).`)] : [] }),
  ], {
    prompt: `Pour identifier le métal d’un objet, ${who} le pèse : ${fr(m)} g. L’objet est ensuite plongé dans une éprouvette graduée contenant de l’eau : le niveau passe de ${V0} mL à ${V1} mL.`,
    figure: tableFig('Tableau des masses volumiques de quelques métaux', ['Métal', 'Masse volumique (g/cm³)'], METAUX.map(([n, r]) => [n, fr(r)])),
    representation: 'concrete', expectedSeconds: 330,
    hints: ['Le volume de l’objet est l’augmentation du volume lu dans l’éprouvette (1 mL = 1 cm³).', 'ρ = m / V.', 'Cherche dans le tableau la masse volumique la plus proche de ton résultat.'],
    solution: `V = ${V1} − ${V0} = ${V} mL = ${V} cm³. ρ = ${fr(m)} ÷ ${V} ≈ ${fr(rhoM)} g/cm³ : c’est ${METAUX.find((x) => x[0] === name)[2]} (${fr(rho)} g/cm³).`,
  });
}

/** ✦ Poutres ou barres : volume en m³, masse, nombre maximal dans une camionnette. */
function mvPoutres(rand) {
  let steel; let name; let rho; let Lm; let a; let b; let V; let m; let C;
  do {
    steel = rand() < 0.3; [name, rho] = steel ? ['acier', 7850] : pick(rand, [['chêne', 750], ['sapin', 450], ['pin', 500]]);
    Lm = pick(rand, steel ? [2, 3, 4, 6] : [2, 2.5, 3, 4, 5]); a = pick(rand, steel ? [4, 5, 6, 8] : [10, 15, 20]); b = pick(rand, steel ? [4, 5, 6, 8] : [5, 8, 10, 15, 20]);
    V = clean((Lm * a * b) / 10000); m = clean(rho * V); C = pick(rand, steel ? [150, 200, 250, 300, 400, 500] : [300, 400, 500, 600, 750, 800, 1000, 1200]);
  } while (C / m < 2 || C / m > 40 || Number.isInteger(round(C / m, 6)));
  const word = steel ? 'barres' : 'poutres'; const one = steel ? 'barre' : 'poutre'; const N = Math.floor(C / m);
  return problem([
    num(V, { prompt: `Volume d’une ${one}, en m³ ?`, unit: 'm³', misconceptions: [mc(clean(Lm * a * b), 'mc:unites-melangees', 'unite', `Mets les trois longueurs en mètres : ${a} cm = ${fr(a / 100)} m et ${b} cm = ${fr(b / 100)} m.`), mc(clean((Lm * a * b) / 100), 'mc:conversion-partielle', 'unite', 'Les deux dimensions en cm doivent être converties en m.')] }),
    num(m, { prompt: `Masse d’une ${one}, en kg ?`, unit: 'kg', tolerance: 0.005, misconceptions: [mc(clean(rho * Lm * a * b), 'mc:unites-melangees', 'unite', 'Avec ρ en kg/m³, le volume doit être en m³.'), mc(clean(V / rho), 'mc:rho-inverse', 'notion', 'm = ρ × V.')] }),
    num(N, { prompt: `Combien de ${word} la camionnette peut-elle transporter au maximum ?`, misconceptions: [mc(Math.ceil(C / m), 'mc:arrondi-par-exces', 'raisonnement', `Avec ${Math.ceil(C / m)} ${word}, la charge serait de ${fr(Math.ceil(C / m) * m)} kg : c’est plus que ${C} kg. On garde l’entier inférieur.`), mc(round(C / m, 2), 'mc:quotient-non-entier', 'raisonnement', `Le nombre de ${word} est un nombre entier : on ne peut pas en charger une partie.`)] }),
  ], {
    prompt: `Une camionnette peut transporter au plus ${C} kg. On veut y charger des ${word} en ${name} (masse volumique ${fr(rho)} kg/m³), longues de ${fr(Lm)} m, de section rectangulaire ${a} cm × ${b} cm.`,
    representation: 'concrete', expectedSeconds: 330,
    hints: [`Convertis en m : ${a} cm = ${fr(a / 100)} m ; ${b} cm = ${fr(b / 100)} m.`, 'Volume = longueur × largeur × hauteur ; masse = ρ × V.', `Nombre de ${word} : ${C} ÷ masse d’une ${one}, arrondi à l’entier inférieur.`],
    solution: `V = ${fr(Lm)} × ${fr(a / 100)} × ${fr(b / 100)} = ${fr(V)} m³. m = ${fr(rho)} × ${fr(V)} = ${fr(m)} kg. ${C} ÷ ${fr(m)} ≈ ${fr(round(C / m, 2))}, donc ${N} ${word} au maximum.`,
  });
}

/** ✦ Bloc de matière inconnue (dimensions en cm et mm) : volume, ρ, flotte-t-il ? */
function mvFlottaison(rand) {
  const [name, rho] = pick(rand, MATIERES); let a; let b; let cmm; let V; let m;
  do { a = pick(rand, [4, 5, 6, 8, 10]); b = pick(rand, [2, 3, 4, 5]); cmm = pick(rand, [15, 20, 25, 30, 40, 50]); V = clean((a * b * cmm) / 10); m = round(rho * V, 1); } while (m < 1 || Math.abs(m / V - 1) < 0.05);
  const rhoM = round(m / V, 2); const floats = rhoM < 1;
  return problem([
    num(V, { prompt: 'Volume du bloc, en cm³ ?', unit: 'cm³', misconceptions: [mc(a * b * cmm, 'mc:unites-melangees', 'unite', `Les trois dimensions doivent être dans la même unité : ${cmm} mm = ${fr(cmm / 10)} cm.`), mc(clean(a + b + cmm / 10), 'mc:volume-somme', 'notion', 'Volume d’un pavé = longueur × largeur × hauteur.')] }),
    num(rhoM, { prompt: 'Masse volumique de la matière, en g/cm³ (arrondie au centième) ?', unit: 'g/cm³', round: 2, tolerance: 0.0051, misconceptions: [mc(round(V / m, 2), 'mc:rho-inverse', 'notion', 'ρ = m / V : la masse divisée par le volume.'), mc(round(m / (a * b * cmm), 3), 'mc:unites-melangees', 'unite', `Le volume se calcule avec ${cmm} mm = ${fr(cmm / 10)} cm.`)] }),
    yesNo(floats, 'Ce bloc flotte-t-il sur l’eau ? (oui ou non)', 'mc:flottaison', 'notion', floats ? `${fr(rhoM)} g/cm³ est plus petit que la masse volumique de l’eau (1 g/cm³) : le bloc flotte, quelle que soit sa masse.` : `${fr(rhoM)} g/cm³ est plus grand que la masse volumique de l’eau (1 g/cm³) : le bloc coule, même s’il paraît léger.`),
  ], {
    prompt: `Un bloc de matière inconnue a la forme d’un pavé droit de ${a} cm × ${b} cm × ${cmm} mm. Sa masse est ${fr(m)} g. La masse volumique de l’eau est 1 g/cm³.`,
    representation: 'concrete', expectedSeconds: 300,
    hints: [`Convertis : ${cmm} mm = ${fr(cmm / 10)} cm.`, 'ρ = m / V.', 'Un objet plein flotte sur l’eau si sa masse volumique est plus petite que 1 g/cm³.'],
    solution: `V = ${a} × ${b} × ${fr(cmm / 10)} = ${fr(V)} cm³. ρ = ${fr(m)} ÷ ${fr(V)} ≈ ${fr(rhoM)} g/cm³, ${floats ? 'moins' : 'plus'} que l’eau : le bloc ${floats ? 'flotte' : 'coule'} (ce pourrait être ${name}).`,
  });
}

/* ======================================================================= */
/*                                Loi d’Ohm                                */
/* ======================================================================= */

function drawKohm(rand, Rs, Is) {
  for (;;) {
    const R = pick(rand, Rs); const I = pick(rand, Is); const U = clean(R * I);
    if (U <= 24 && U >= 0.5 && isRound(U, 2)) return { R, I, U };
  }
}

/** ◆ Tension avec R en kΩ et I en mA ou en A. */
function ohmTension(rand) {
  const { R, I, U } = drawKohm(rand, [1, 1.2, 1.5, 2.2, 2.7, 3.3, 4.7, 6.8], [0.5, 1.2, 1.5, 2, 2.5, 3, 4, 5]);
  const inA = rand() < 0.4; const IA = clean(I / 1000); const Itxt = inA ? `${fr(IA)} A` : `${fr(I)} mA`;
  const mcs = inA
    ? [mc(clean(R * IA), 'mc:conversion-kohm', 'unite', `Convertis la résistance en ohms : ${fr(R)} kΩ = ${fr(R * 1000)} Ω.`), mc(clean((R * 1000) / IA), 'mc:ohm-division', 'notion', 'U = R × I : on multiplie.')]
    : [mc(clean(R * 1000 * I), 'mc:conversion-partielle', 'unite', `Tu as converti les kΩ en Ω, mais pas les mA en A : ${fr(I)} mA = ${fr(IA)} A.`), mc(clean(R * IA), 'mc:conversion-partielle', 'unite', `Tu as converti les mA en A, mais pas les kΩ en Ω : ${fr(R)} kΩ = ${fr(R * 1000)} Ω.`), mc(clean(R / I), 'mc:ohm-division', 'notion', 'U = R × I : on multiplie.')];
  return num(U, {
    prompt: `Un conducteur ohmique de résistance ${fr(R)} kΩ est traversé par un courant d’intensité ${Itxt}. Calcule la tension à ses bornes.`, unit: 'V', representation: 'concrete', expectedSeconds: 150, misconceptions: mcs,
    hints: ['U = R × I avec R en ohms (Ω) et I en ampères (A).', '1 kΩ = 1 000 Ω ; 1 mA = 0,001 A.', `R = ${fr(R * 1000)} Ω et I = ${fr(IA)} A.`],
    solution: `R = ${fr(R)} kΩ = ${fr(R * 1000)} Ω ; I = ${Itxt}${inA ? '' : ` = ${fr(IA)} A`}. U = R × I = ${fr(R * 1000)} × ${fr(IA)} = ${fr(U)} V.${inA ? '' : ' (Astuce : des kΩ multipliés par des mA donnent directement des volts.)'}`,
  });
}

/** ◆ Intensité en mA avec R en kΩ. */
function ohmIntensiteKohm(rand) {
  const { R, I, U } = drawKohm(rand, [1, 1.2, 1.5, 2.2, 3.3, 4.7, 6.8], [0.5, 1.2, 1.5, 2, 2.5, 3, 4, 5, 8]);
  return num(I, {
    prompt: `On applique une tension de ${fr(U)} V aux bornes d’un conducteur ohmique de ${fr(R)} kΩ. Calcule l’intensité du courant, en mA.`, unit: 'mA', strictUnit: true, representation: 'concrete', expectedSeconds: 150,
    misconceptions: [
      mc(clean(I / 1000), 'mc:conversion-a-ma', 'unite', 'Ce résultat est en ampères (A) : 1 A = 1 000 mA.'),
      mc(clean(I * 1000), 'mc:conversion-double', 'unite', 'Des volts divisés par des kΩ donnent directement des mA : il ne faut pas multiplier encore par 1 000.'),
      mc(clean(R / U), 'mc:ohm-inverse', 'notion', 'I = U / R : la tension divisée par la résistance.'),
    ],
    hints: ['I = U / R avec U en V et R en Ω donne des ampères.', `${fr(R)} kΩ = ${fr(R * 1000)} Ω.`, '1 A = 1 000 mA.'],
    solution: `R = ${fr(R * 1000)} Ω. I = ${fr(U)} ÷ ${fr(R * 1000)} = ${fr(I / 1000)} A = ${fr(I)} mA.`,
  });
}

/** ◆ Proportionnalité de U et I : résistance, puis intensité sous une autre tension. */
function ohmProportion(rand) {
  let R; let I1; let I2; let U1; let U2;
  do { R = pick(rand, [100, 150, 200, 250, 300, 400, 500, 600, 750]); [I1, I2] = sample(rand, [5, 8, 10, 12, 15, 20, 25, 30, 40], 2); U1 = clean((R * I1) / 1000); U2 = clean((R * I2) / 1000); } while (U1 > 12 || U2 > 24 || U1 < 0.5 || !isRound(U1, 2) || !isRound(U2, 2));
  return problem([
    num(R, { prompt: 'Résistance de ce conducteur ohmique, en Ω ?', unit: 'Ω', misconceptions: [mc(clean(U1 / I1), 'mc:conversion-ma', 'unite', `Convertis l’intensité en A : ${I1} mA = ${fr(I1 / 1000)} A.`), mc(clean(I1 / 1000 / U1), 'mc:ohm-inverse', 'notion', 'R = U / I.')] }),
    num(I2, { prompt: `Quelle est l’intensité, en mA, sous une tension de ${fr(U2)} V ?`, unit: 'mA', misconceptions: [mc(clean(I1 + (U2 - U1)), 'mc:modele-additif', 'raisonnement', 'Pour un conducteur ohmique, U et I sont proportionnelles : on multiplie, on n’ajoute pas.'), mc(clean(U2 / R), 'mc:conversion-a-ma', 'unite', 'Ce résultat est en A : 1 A = 1 000 mA.'), mc(round((I1 * U1) / U2, 3), 'mc:rapport-inverse', 'raisonnement', `U et I varient dans le même sens : quand la tension ${U2 > U1 ? 'augmente' : 'diminue'}, l’intensité ${U2 > U1 ? 'augmente' : 'diminue'} aussi, dans la même proportion.`)] }),
  ], {
    prompt: `Sous une tension de ${fr(U1)} V, un conducteur ohmique est traversé par un courant de ${I1} mA.`,
    representation: 'concrete', expectedSeconds: 240,
    hints: [`R = U / I avec I en A : ${I1} mA = ${fr(I1 / 1000)} A.`, 'La résistance ne change pas : I = U / R.', `Ou bien : la tension est multipliée par ${fr(round(U2 / U1, 4))}, l’intensité aussi.`],
    solution: `R = ${fr(U1)} ÷ ${fr(I1 / 1000)} = ${R} Ω. Sous ${fr(U2)} V : I = ${fr(U2)} ÷ ${R} = ${fr(I2 / 1000)} A = ${I2} mA.`,
  });
}

/** ◆ Résistance en kΩ. */
function ohmResistanceKohm(rand) {
  const { R, I, U } = drawKohm(rand, [0.47, 0.68, 1, 1.2, 1.5, 2.2, 3.3, 4.7], [1, 1.5, 2, 2.5, 3, 4, 5, 6]);
  return num(R, {
    prompt: `Aux bornes d’un conducteur ohmique, on mesure une tension de ${fr(U)} V et une intensité de ${fr(I)} mA. Calcule sa résistance, en kΩ.`, unit: 'kΩ', strictUnit: true, representation: 'concrete', expectedSeconds: 150,
    misconceptions: [
      mc(clean(R * 1000), 'mc:conversion-kohm', 'unite', 'Ce résultat est en ohms (Ω) : 1 kΩ = 1 000 Ω.'),
      mc(round(I / U, 4), 'mc:ohm-inverse', 'notion', 'R = U / I : la tension divisée par l’intensité.'),
      mc(clean(U * I), 'mc:ohm-produit', 'notion', 'R = U / I : on divise.'),
    ],
    hints: ['R = U / I avec I en A donne des ohms.', `${fr(I)} mA = ${fr(I / 1000)} A.`, '1 kΩ = 1 000 Ω.'],
    solution: `I = ${fr(I / 1000)} A ; R = ${fr(U)} ÷ ${fr(I / 1000)} = ${fr(R * 1000)} Ω = ${fr(R)} kΩ.`,
  });
}

/** Résistances courantes au collège et tensions usuelles des générateurs de TP. */
const R_SERIE = [10, 22, 33, 47, 50, 68, 100, 120, 150, 200, 220, 300, 330, 470, 500, 680, 1000];
const U_GENERATEUR = [3, 4.5, 6, 9, 12];

function drawSerie(rand, extra = () => true) {
  for (;;) {
    const [R1, R2] = sample(rand, R_SERIE, 2); const U = pick(rand, U_GENERATEUR);
    const I = clean((U * 1000) / (R1 + R2)); const U1 = clean((R1 * I) / 1000); const U2 = clean((R2 * I) / 1000);
    const s = { R1, R2, I, U, U1, U2 };
    if (I >= 2 && I <= 200 && isRound(I, 1) && isRound(U1, 2) && isRound(U2, 2) && extra(s, rand)) return s;
  }
}

/** ✦ Série : résistance totale, intensité, tension aux bornes de chaque conducteur. */
function ohmSerieTensions(rand) {
  const { R1, R2, I, U, U1, U2 } = drawSerie(rand);
  return problem([
    num(R1 + R2, { prompt: 'Résistance totale du circuit, en Ω ?', unit: 'Ω', misconceptions: [mc(clean((R1 + R2) / 2), 'mc:moyenne-resistances', 'notion', 'En série, les résistances s’ajoutent : R = R₁ + R₂.')] }),
    num(I, { prompt: 'Intensité du courant, en mA ?', unit: 'mA', tolerance: 0.05, misconceptions: [mc(round((U / R1) * 1000, 2), 'mc:resistance-oubliee', 'methode', 'Le courant traverse les deux conducteurs l’un après l’autre : utilise la résistance totale.'), mc(clean(U / (R1 + R2)), 'mc:conversion-a-ma', 'unite', 'Ce résultat est en A : 1 A = 1 000 mA.')] }),
    num(U1, { prompt: 'Tension aux bornes de R₁, en V ?', unit: 'V', misconceptions: [mc(U, 'mc:tension-serie-identique', 'notion', 'En série, la tension du générateur se partage entre les deux conducteurs : U₁ = R₁ × I.'), mc(clean(U / 2), 'mc:partage-egal', 'raisonnement', 'Le partage n’est égal que si les deux résistances sont égales : calcule U₁ = R₁ × I.'), mc(clean(R1 * I), 'mc:conversion-ma', 'unite', `Convertis l’intensité en A : ${I} mA = ${fr(I / 1000)} A.`)] }),
    num(U2, { prompt: 'Tension aux bornes de R₂, en V ?', unit: 'V', misconceptions: [mc(U, 'mc:tension-serie-identique', 'notion', 'En série, la tension du générateur se partage : U₂ = R₂ × I (ou U − U₁).'), mc(clean(U / 2), 'mc:partage-egal', 'raisonnement', 'Le partage n’est égal que si les deux résistances sont égales.'), mc(U1, 'mc:partage-egal', 'raisonnement', 'R₂ n’est pas égale à R₁ : la tension à ses bornes est différente.')] }),
  ], {
    prompt: `Un générateur de ${fr(U)} V alimente deux conducteurs ohmiques montés en série : R₁ = ${R1} Ω et R₂ = ${R2} Ω.`,
    representation: 'concrete', expectedSeconds: 360,
    hints: ['En série, les résistances s’ajoutent et la même intensité traverse tout le circuit.', 'I = U / R totale (en A), puis U₁ = R₁ × I et U₂ = R₂ × I.', `Vérifie : U₁ + U₂ doit redonner ${fr(U)} V (loi d’additivité des tensions).`],
    solution: `R = ${R1} + ${R2} = ${R1 + R2} Ω. I = ${fr(U)} ÷ ${R1 + R2} = ${fr(I / 1000)} A = ${I} mA. U₁ = ${R1} × ${fr(I / 1000)} = ${fr(U1)} V ; U₂ = ${R2} × ${fr(I / 1000)} = ${fr(U2)} V. Vérification : ${fr(U1)} + ${fr(U2)} = ${fr(U)} V.`,
  });
}

/** ✦ Série : intensité, puis effet d’un changement du circuit. */
function ohmSerieIntensite(rand) {
  const remove = rand() < 0.5;
  let R3 = 0;
  const s = drawSerie(rand, (x, r) => {
    if (remove) return isRound((x.U * 1000) / x.R1, 1);
    R3 = pick(r, R_SERIE); return isRound((x.U * 1000) / (x.R1 + x.R2 + R3), 1);
  });
  const { R1, R2, I, U } = s; const Rn = remove ? R1 : R1 + R2 + R3; const In = clean((U * 1000) / Rn);
  return problem([
    num(R1 + R2, { prompt: 'Résistance totale du circuit, en Ω ?', unit: 'Ω', misconceptions: [mc(clean((R1 + R2) / 2), 'mc:moyenne-resistances', 'notion', 'En série, les résistances s’ajoutent.')] }),
    num(I, { prompt: 'Intensité du courant, en mA ?', unit: 'mA', tolerance: 0.05, misconceptions: [mc(round((U / R1) * 1000, 2), 'mc:resistance-oubliee', 'methode', 'Utilise la résistance totale : le courant traverse R₁ puis R₂.'), mc(clean(U / (R1 + R2)), 'mc:conversion-a-ma', 'unite', 'Ce résultat est en A : 1 A = 1 000 mA.')] }),
    num(In, { prompt: remove ? 'On retire R₂ : R₁ reste seul avec le générateur. Nouvelle intensité, en mA ?' : `On ajoute en série un troisième conducteur ohmique R₃ = ${R3} Ω. Nouvelle intensité, en mA ?`, unit: 'mA', tolerance: 0.05, misconceptions: [mc(I, 'mc:intensite-constante', 'notion', 'L’intensité dépend de la résistance totale du circuit : elle change.'), remove ? mc(round((U / R2) * 1000, 2), 'mc:mauvaise-resistance', 'lecture', 'C’est R₂ qu’on retire : il reste R₁.') : mc(round((U / R3) * 1000, 2), 'mc:resistance-oubliee', 'methode', 'La nouvelle résistance totale est R₁ + R₂ + R₃.')] }),
    yesNo(remove, 'L’intensité a-t-elle augmenté ? (oui ou non)', 'mc:resistance-intensite', 'notion', remove ? 'Avec une seule résistance, la résistance totale diminue : l’intensité augmente.' : 'La résistance totale augmente : l’intensité diminue.'),
  ], {
    prompt: `Un générateur de ${fr(U)} V alimente deux conducteurs ohmiques en série : R₁ = ${R1} Ω et R₂ = ${R2} Ω.`,
    representation: 'concrete', expectedSeconds: 360,
    hints: ['En série, la résistance totale est la somme des résistances.', 'I = U / R totale, avec R en Ω : on obtient des A, à convertir en mA.', 'Plus la résistance totale est grande, plus l’intensité est petite.'],
    solution: `R = ${R1 + R2} Ω ; I = ${fr(U)} ÷ ${R1 + R2} = ${fr(I / 1000)} A = ${I} mA. Nouvelle résistance totale : ${Rn} Ω ; I = ${fr(U)} ÷ ${Rn} = ${fr(In / 1000)} A = ${fr(In)} mA : l’intensité ${remove ? 'augmente' : 'diminue'}.`,
  });
}

/** ✦ Série : résistance inconnue (valeur manquante) et tension à ses bornes. */
function ohmSerieInconnue(rand) {
  const { R1, R2, I, U, U2 } = drawSerie(rand); const Rt = R1 + R2;
  return problem([
    num(Rt, { prompt: 'Résistance totale du circuit, en Ω ?', unit: 'Ω', misconceptions: [mc(clean(U / I), 'mc:conversion-ma', 'unite', `Convertis l’intensité en A : ${I} mA = ${fr(I / 1000)} A.`), mc(round(I / 1000 / U, 5), 'mc:ohm-inverse', 'notion', 'R = U / I.')] }),
    num(R2, { prompt: 'Résistance R₂, en Ω ?', unit: 'Ω', misconceptions: [mc(Rt, 'mc:resistance-totale', 'methode', 'Ce nombre est la résistance totale R₁ + R₂ : retire R₁.'), mc(Rt + R1, 'mc:resistance-totale', 'methode', 'R totale = R₁ + R₂, donc R₂ = R totale − R₁.')] }),
    num(U2, { prompt: 'Tension aux bornes de R₂, en V ?', unit: 'V', misconceptions: [mc(U, 'mc:tension-serie-identique', 'notion', 'En série, la tension du générateur se partage entre R₁ et R₂.'), mc(clean(R2 * I), 'mc:conversion-ma', 'unite', `Convertis l’intensité en A : ${I} mA = ${fr(I / 1000)} A.`)] }),
  ], {
    prompt: `Dans un circuit en série, un générateur de ${fr(U)} V alimente un conducteur ohmique R₁ = ${R1} Ω et un conducteur ohmique R₂ de résistance inconnue. Un ampèremètre indique ${I} mA.`,
    representation: 'concrete', expectedSeconds: 330,
    hints: [`Toute la résistance du circuit : R = U / I, avec I = ${fr(I / 1000)} A.`, 'En série : R = R₁ + R₂.', 'U₂ = R₂ × I (vérifie avec U₁ + U₂ = U).'],
    solution: `R = ${fr(U)} ÷ ${fr(I / 1000)} = ${Rt} Ω. R₂ = ${Rt} − ${R1} = ${R2} Ω. U₂ = ${R2} × ${fr(I / 1000)} = ${fr(U2)} V (et U₁ = ${fr(U - U2)} V).`,
  });
}

/* ======================================================================= */
/*                              Poids et masse                             */
/* ======================================================================= */

const ASTRES = [['la Lune', 1.6], ['Mars', 3.7], ['Jupiter', 24.8], ['Vénus', 8.9]];
const OBJETS = [['Une boîte de conserve', [400, 500, 850]], ['Une gourde pleine', [500, 750, 1000]], ['Un appareil photo', [450, 600, 900]], ['Un marteau', [500, 750, 1250]], ['Un ballon de basket', [600, 620, 650]], ['Un sac de pommes', [1500, 2000, 2500]]];

/** ◆ Masse en g : poids sur Terre, poids sur un autre astre, masse sur cet astre. */
function poidsDeuxAstres(rand) {
  const [obj, masses] = pick(rand, OBJETS); const mg = pick(rand, masses); const m = clean(mg / 1000);
  const [astre, g] = pick(rand, ASTRES); const PT = clean(m * 9.8); const PA = clean(m * g);
  return problem([
    num(PT, { prompt: 'Poids sur Terre, en N ?', unit: 'N', tolerance: 0.005, misconceptions: [mc(clean(mg * 9.8), 'mc:conversion-g-kg', 'unite', `Dans P = m × g, la masse est en kg : ${fr(mg)} g = ${fr(m)} kg.`), mc(round(m / 9.8, 4), 'mc:poids-division', 'notion', 'P = m × g : on multiplie la masse par g.')] }),
    num(PA, { prompt: `Poids sur ${astre}, en N ?`, unit: 'N', tolerance: 0.005, misconceptions: [mc(clean(mg * g), 'mc:conversion-g-kg', 'unite', `La masse doit être en kg : ${fr(m)} kg.`), mc(PT, 'mc:poids-constant', 'notion', 'Le poids dépend de l’astre : il est proportionnel à g.'), mc(clean(PT * g), 'mc:poids-direct', 'methode', 'On multiplie la masse (en kg) par g, pas le poids sur Terre.')] }),
    num(m, { prompt: `Masse de l’objet sur ${astre}, en kg ?`, unit: 'kg', tolerance: 0.0005, misconceptions: [mc(mg, 'mc:conversion-g-kg', 'unite', `${fr(mg)} g = ${fr(m)} kg.`), mc(PA, 'mc:masse-poids', 'notion', 'Le poids (en N) et la masse (en kg) sont deux grandeurs différentes.'), mc(round((m * g) / 9.8, 3), 'mc:masse-change', 'notion', 'La masse ne dépend pas du lieu : c’est la quantité de matière, la même partout.')] }),
  ], {
    prompt: `${obj} a une masse de ${fr(mg)} g. On compare son poids sur Terre (g = 9,8 N/kg) et sur ${astre} (g = ${fr(g)} N/kg).`,
    representation: 'concrete', expectedSeconds: 240,
    hints: [`Convertis la masse : ${fr(mg)} g = ${fr(m)} kg.`, 'P = m × g, avec la valeur de g de chaque astre.', 'La masse est la même partout ; seul le poids change.'],
    solution: `m = ${fr(m)} kg. Sur Terre : P = ${fr(m)} × 9,8 = ${fr(PT)} N. Sur ${astre} : P = ${fr(m)} × ${fr(g)} = ${fr(PA)} N. La masse reste ${fr(m)} kg.`,
  });
}

/** ◆ Masse en g à partir d’un poids mesuré sur un astre. */
function poidsMasseGrammes(rand) {
  const [astre, g] = pick(rand, [['la Terre', 9.8], ['la Lune', 1.6], ['Mars', 3.7], ['Vénus', 8.9]]);
  const mg = pick(rand, [200, 250, 400, 500, 750, 800, 1250, 1500]); const m = clean(mg / 1000); const P = clean(m * g);
  const mcs = [mc(m, 'mc:conversion-g-kg', 'unite', `m = P / g donne une masse en kg : ${fr(m)} kg = ${fr(mg)} g.`), mc(clean(P * g * 1000), 'mc:poids-division', 'notion', 'm = P / g : on divise le poids par g.')];
  if (g !== 9.8) mcs.push(mc(round((P / 9.8) * 1000, 1), 'mc:mauvais-astre', 'lecture', `L’objet est sur ${astre} : utilise g = ${fr(g)} N/kg, pas la valeur terrestre.`));
  return num(mg, {
    prompt: `Sur ${astre} (g = ${fr(g)} N/kg), un dynamomètre indique que le poids d’un objet est ${fr(P)} N. Quelle est la masse de l’objet, en g ?`, unit: 'g', strictUnit: true, representation: 'concrete', expectedSeconds: 150, misconceptions: mcs,
    hints: ['m = P / g donne une masse en kg.', `m = ${fr(P)} ÷ ${fr(g)}.`, '1 kg = 1 000 g.'],
    solution: `m = ${fr(P)} ÷ ${fr(g)} = ${fr(m)} kg = ${fr(mg)} g.`,
  });
}

/** ◆ Poids sur un astre → masse → poids sur Terre. */
function poidsVersTerre(rand) {
  const [astre, g] = pick(rand, [['la Lune', 1.6], ['Mars', 3.7]]);
  const [obj, masses] = pick(rand, [['un robot d’exploration', [80, 120, 150, 240]], ['un module de mesure', [25, 40, 60]], ['une réserve d’eau', [50, 75, 100]]]);
  const m = pick(rand, masses); const P = clean(m * g); const PT = clean(m * 9.8);
  return problem([
    num(m, { prompt: 'Masse, en kg ?', unit: 'kg', tolerance: 0.005, misconceptions: [mc(P, 'mc:masse-poids', 'notion', 'Le poids (en N) n’est pas la masse (en kg) : m = P / g.'), mc(clean(P * g), 'mc:poids-division', 'notion', 'm = P / g : on divise par g.'), mc(round(P / 9.8, 2), 'mc:mauvais-astre', 'lecture', `Le poids est mesuré sur ${astre} : utilise g = ${fr(g)} N/kg.`)] }),
    num(PT, { prompt: 'Poids sur Terre (g = 9,8 N/kg), en N ?', unit: 'N', tolerance: 0.005, misconceptions: [mc(clean(P * 9.8), 'mc:poids-direct', 'methode', 'On multiplie la MASSE par g, pas le poids mesuré sur un autre astre.'), mc(P, 'mc:poids-constant', 'notion', 'Le poids change d’un astre à l’autre ; la masse, elle, ne change pas.')] }),
  ], {
    prompt: `Sur ${astre} (g = ${fr(g)} N/kg), ${obj} a un poids de ${fr(P)} N.`,
    representation: 'concrete', expectedSeconds: 210,
    hints: ['m = P / g, avec le g de l’astre où le poids est mesuré.', 'La masse est la même sur Terre.', 'P (Terre) = m × 9,8.'],
    solution: `m = ${fr(P)} ÷ ${fr(g)} = ${fr(m)} kg. Sur Terre : P = ${fr(m)} × 9,8 = ${fr(PT)} N.`,
  });
}

/** ✦ À partir du poids sur Terre : masse, poids sur un astre, rapport des poids. */
function poidsRapport(rand) {
  const [astre, g, note] = pick(rand, [['la Lune', 1.6, ''], ['Mars', 3.7, ''], ['Vénus', 8.9, ''], ['Mercure', 3.7, ''], ['Titan', 1.35, ' (le plus gros satellite de Saturne)']]);
  const obj = pick(rand, ['un robot d’exploration', 'une sonde', 'un module scientifique', 'un véhicule d’exploration']);
  const m = pick(rand, [60, 75, 80, 120, 150, 240, 300, 500]); const PT = clean(m * 9.8); const PA = clean(m * g); const ratio = round(9.8 / g, 1);
  return problem([
    num(m, { prompt: 'Masse, en kg ?', unit: 'kg', tolerance: 0.005, misconceptions: [mc(PT, 'mc:masse-poids', 'notion', 'Le poids (en N) n’est pas la masse (en kg) : m = P / g.'), mc(clean(PT * 9.8), 'mc:poids-division', 'notion', 'm = P / g : on divise le poids par g.')] }),
    num(PA, { prompt: `Poids sur ${astre}, en N ?`, unit: 'N', tolerance: 0.05, misconceptions: [mc(round(PT / g, 2), 'mc:poids-division', 'notion', 'P = m × g : on multiplie la masse par g.'), mc(clean(PT * g), 'mc:poids-direct', 'methode', `On multiplie la masse (${m} kg), pas le poids sur Terre, par g.`), mc(PT, 'mc:poids-constant', 'notion', 'Le poids dépend de l’astre.')] }),
    num(ratio, { prompt: `Combien de fois le poids est-il plus faible sur ${astre} que sur Terre ? (arrondi au dixième)`, round: 1, tolerance: 0.051, misconceptions: [mc(round(g / 9.8, 2), 'mc:rapport-inverse', 'raisonnement', '« Combien de fois plus faible » : divise le plus grand poids par le plus petit.'), mc(round(9.8 - g, 1), 'mc:difference-rapport', 'raisonnement', '« Combien de fois » demande un quotient, pas une différence.')] }),
  ], {
    prompt: `Sur Terre (g = 9,8 N/kg), le poids ${de(obj)} est ${fr(PT)} N. On l’envoie sur ${astre}${note}, où g = ${fr(g)} N/kg.`,
    representation: 'concrete', expectedSeconds: 330,
    hints: ['La masse ne change pas : m = P (Terre) ÷ 9,8.', `P (${astre}) = m × ${fr(g)}.`, `Rapport des poids = rapport des g : 9,8 ÷ ${fr(g)}.`],
    solution: `m = ${fr(PT)} ÷ 9,8 = ${m} kg. Sur ${astre} : P = ${m} × ${fr(g)} = ${fr(PA)} N. Rapport : ${fr(PT)} ÷ ${fr(PA)} = 9,8 ÷ ${fr(g)} ≈ ${fr(ratio)} : le poids est environ ${fr(ratio)} fois plus faible (directement : P = ${fr(PT)} × ${fr(g)} ÷ 9,8).`,
  });
}

/** ✦ Un dynamomètre limité : que peut-on peser sur Terre et sur un autre astre ? */
function poidsDynamometre(rand) {
  const [astre, g] = pick(rand, [['la Lune', 1.6], ['Mars', 3.7]]); const F = pick(rand, [5, 10, 20, 50]); const can = rand() < 0.5;
  let m;
  do { m = pick(rand, [0.5, 0.8, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50]); } while (m * 9.8 <= F || (can ? m * g > F * 0.95 : m * g < F * 1.05));
  const PA = clean(m * g);
  // masses MAXIMALES : arrondi au centième inférieur (le centième au-dessus, et le poids dépasserait F) ;
  // les arrondis au plus proche servent aux idées fausses « mauvais astre »
  const mA = boundAnswer(F / g, 'max', 2); const mT = boundAnswer(F / 9.8, 'max', 2);
  const nA = round(F / g, 2); const nT = round(F / 9.8, 2);
  const approx = (x) => `${isRound(x, 4) ? '=' : '≈'} ${fr(round(x, 4))}`;
  const gapA = Math.abs(F / g - mA.answer) > 1e-9; const gapT = Math.abs(F / 9.8 - mT.answer) > 1e-9;
  const trop = (b, gg) => `${fr(b.unsafe)} kg × ${fr(gg)} N/kg = ${fr(b.unsafe * gg)} N`;
  const arrondi = (b, gg) => mc(b.unsafe, 'mc:arrondi-par-exces', 'raisonnement', `${trop(b, gg)} : c’est plus que ${F} N, le dynamomètre ne pourrait pas mesurer ce poids. Une masse MAXIMALE s’arrondit au centième inférieur : ${fr(b.answer)} kg.`);
  const detail = (b, gg, gap) => (gap ? `, soit ${fr(b.answer)} kg au centième inférieur (${trop(b, gg)} dépasserait ${F} N)` : '');
  return problem([
    num(PA, { prompt: `Poids du sac sur ${astre}, en N ?`, unit: 'N', tolerance: 0.005, misconceptions: [mc(round(m / g, 3), 'mc:poids-division', 'notion', 'P = m × g : on multiplie.'), mc(clean(m * 9.8), 'mc:mauvais-astre', 'lecture', `Le sac est pesé sur ${astre} : g = ${fr(g)} N/kg.`)] }),
    yesNo(can, `Peut-on peser ce sac avec ce dynamomètre sur ${astre} ? (oui ou non)`, 'mc:comparaison-poids', 'raisonnement', can ? `${fr(PA)} N ≤ ${F} N : c’est possible sur ${astre}, alors que sur Terre le poids (${fr(m * 9.8)} N) dépasserait ${F} N.` : `${fr(PA)} N > ${F} N : le poids dépasse ce que mesure le dynamomètre.`),
    num(mA.answer, { prompt: `Masse maximale que l’on peut suspendre à ce dynamomètre sur ${astre}, en kg (arrondie au centième) ?`, unit: 'kg', round: 2, tolerance: mA.tolerance, misconceptions: [...(gapA ? [arrondi(mA, g)] : []), mc(nT, 'mc:mauvais-astre', 'lecture', `Sur ${astre}, g = ${fr(g)} N/kg.`), mc(clean(F * g), 'mc:poids-division', 'notion', 'm = P / g : on divise le poids maximal par g.'), mc(F, 'mc:masse-poids', 'notion', `${F} N est un poids, pas une masse : m = P / g.`)] }),
    num(mT.answer, { prompt: 'Et sur Terre (g = 9,8 N/kg), en kg (arrondie au centième) ?', unit: 'kg', round: 2, tolerance: mT.tolerance, misconceptions: [...(gapT ? [arrondi(mT, 9.8)] : []), mc(nA, 'mc:mauvais-astre', 'lecture', 'Sur Terre, g = 9,8 N/kg.'), mc(clean(F * 9.8), 'mc:poids-division', 'notion', 'm = P / g.'), mc(F, 'mc:masse-poids', 'notion', `${F} N est un poids, pas une masse.`)] }),
  ], {
    prompt: `Un dynamomètre mesure des poids jusqu’à ${F} N au maximum. Une équipe d’astronautes l’emporte sur ${astre} (g = ${fr(g)} N/kg) pour peser un sac d’échantillons de roches de ${fr(m)} kg.`,
    representation: 'concrete', expectedSeconds: 360,
    hints: [`Poids sur ${astre} : P = m × ${fr(g)}.`, `Compare ce poids à ${F} N.`, `Masse maximale : m = ${F} ÷ g, avec le g de l’astre ; arrondis vers le bas, sinon le poids dépasserait ${F} N.`],
    solution: `Sur ${astre} : P = ${fr(m)} × ${fr(g)} = ${fr(PA)} N, ${can ? 'inférieur' : 'supérieur'} à ${F} N : ${can ? 'on peut' : 'on ne peut pas'} le peser. Masse maximale sur ${astre} : ${F} ÷ ${fr(g)} ${approx(F / g)} kg${detail(mA, g, gapA)} ; sur Terre : ${F} ÷ 9,8 ${approx(F / 9.8)} kg${detail(mT, 9.8, gapT)}.`,
  });
}

/* ======================================================================= */
/*                     Table des niveaux par générateur                    */
/* ======================================================================= */

export const TIERS_PHYSIQUE = {
  'pc-vitesse': {
    approfondissement(rand, o = {}) {
      const c = choice(rand, o.cherche, ['vitesse', 'distance', 'duree']);
      if (c === 'vitesse') return rand() < 0.5 ? vitKmMin(rand) : vitCourse(rand);
      if (c === 'distance') return rand() < 0.5 ? vitDistanceHM(rand) : vitDistanceDrone(rand);
      return rand() < 0.5 ? vitDureeMin(rand) : vitDureeNage(rand);
    },
    expert(rand, o = {}) {
      const c = choice(rand, o.cherche, ['vitesse', 'distance', 'duree']);
      if (c === 'vitesse') return vitAllerRetour(rand);
      if (c === 'distance') return vitArret(rand);
      return vitATenir(rand);
    },
  },
  'pc-masse-volumique': {
    approfondissement(rand, o = {}) {
      const c = choice(rand, o.cherche, ['rho', 'masse', 'volume']);
      if (c === 'rho') return mvLiquide(rand);
      if (c === 'masse') return rand() < 0.5 ? mvMasseKgM3(rand) : mvLingot(rand);
      return mvVolumeLitres(rand);
    },
    expert(rand, o = {}) {
      const c = choice(rand, o.cherche, ['rho', 'masse', 'volume']);
      if (c === 'rho') return mvIdentification(rand);
      if (c === 'masse') return mvPoutres(rand);
      return mvFlottaison(rand);
    },
  },
  'pc-ohm': {
    approfondissement(rand, o = {}) {
      const c = choice(rand, o.cherche, ['tension', 'intensite', 'resistance']);
      if (c === 'tension') return ohmTension(rand);
      if (c === 'intensite') return rand() < 0.5 ? ohmIntensiteKohm(rand) : ohmProportion(rand);
      return ohmResistanceKohm(rand);
    },
    expert(rand, o = {}) {
      const c = choice(rand, o.cherche, ['tension', 'intensite', 'resistance']);
      if (c === 'tension') return ohmSerieTensions(rand);
      if (c === 'intensite') return ohmSerieIntensite(rand);
      return ohmSerieInconnue(rand);
    },
  },
  'pc-poids': {
    approfondissement(rand, o = {}) {
      const c = choice(rand, o.cherche, ['poids', 'masse']);
      if (c === 'poids') return poidsDeuxAstres(rand);
      return rand() < 0.5 ? poidsMasseGrammes(rand) : poidsVersTerre(rand);
    },
    expert(rand, o = {}) {
      const c = choice(rand, o.cherche, ['poids', 'masse']);
      return c === 'poids' ? poidsRapport(rand) : poidsDynamometre(rand);
    },
  },
};
