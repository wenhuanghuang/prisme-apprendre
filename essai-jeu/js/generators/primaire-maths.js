/**
 * Générateurs de mathématiques pour l'école primaire (CP → CM2), rattachés aux chapitres des parcours officiels
 * (`chapters`) : numération, calcul, grandeurs, fractions, décimaux, problèmes, géométrie, données.
 * Chaque générateur adapte les nombres à la classe (option « niveau », transmise par les séries, les quêtes et
 * le jeu de plateau) ; le niveau ◆ (approfondissement) sert aux défis des quêtes. Les réponses fausses typiques
 * sont calculées avec les mêmes nombres, pour que le diagnostic reste précis.
 */
import { ri, pick, clean, fr, mc, numeric, text } from './gen-util.js';

export const PRIMARY_LEVELS = ['cp', 'ce1', 'ce2', 'cm1', 'cm2'];
const LABEL = { cp: 'CP', ce1: 'CE1', ce2: 'CE2', cm1: 'CM1', cm2: 'CM2' };
const at = (lv) => PRIMARY_LEVELS.indexOf(lv);
// prénoms et pronom (pour accorder les énoncés)
const PEOPLE = [['Léo', 'il'], ['Inès', 'elle'], ['Malo', 'il'], ['Lina', 'elle'], ['Noé', 'il'], ['Jade', 'elle'], ['Adam', 'il'], ['Zoé', 'elle'], ['Yanis', 'il'], ['Lou', 'elle']];
const NAMES = PEOPLE.map((x) => x[0]);

const GEN = [];
/** Générateur de primaire : option « Classe », niveaux classe et ◆. `make(rand, lv, hard)` reçoit la classe choisie. */
function add(g) {
  const { make, ...rest } = g;
  GEN.push({
    subject: 'maths', tracks: ['classe', 'approfondissement'],
    options: [{ id: 'niveau', label: 'Classe', values: g.levels.map((l) => ({ id: l, label: LABEL[l] })) }],
    ...rest,
    make(rand, o = {}, tier = 'classe') {
      const lv = g.levels.includes(String(o.niveau || '').toLowerCase()) ? String(o.niveau).toLowerCase() : g.levels[0];
      return make(rand, lv, tier !== 'classe');
    },
  });
}
const digits = (n) => String(n).split('').map(Number);
/** « de billes », mais « d’images » (élision devant une voyelle). */
const de = (w) => (/^[aeiouéèêh]/i.test(w) ? `d’${w}` : `de ${w}`);
const person = (rand) => { const [n, il] = pick(rand, PEOPLE); return { n, il }; };

/* ------------------------------ Nombres ------------------------------ */

add({
  id: 'mp-numeration', label: 'Les nombres : unités, dizaines, centaines…', skill: 'mp.numeration', levels: PRIMARY_LEVELS,
  description: 'Composer un nombre, trouver le chiffre d’un rang, compter les dizaines ou les centaines.',
  chapters: ['cp-m-collections', 'cp-m-nombres-59', 'cp-m-nombres-100', 'ce1-m-centaines', 'ce1-m-nombres-1000', 'ce2-m-nombres-10000', 'cm1-m-entiers', 'cm2-m-entiers'],
  make(rand, lv, hard) {
    const ranks = ['unités', 'dizaines', 'centaines', 'milliers', 'dizaines de mille', 'centaines de mille', 'millions', 'dizaines de millions', 'centaines de millions'];
    const size = [2, 3, 4, 6, 9][at(lv)];
    const n = ri(rand, 10 ** (size - 1), 10 ** size - 1);
    const d = digits(n).reverse(); // d[0] = unités
    const kind = size === 2 ? (rand() < 0.5 ? 'composer' : 'chiffre') : pick(rand, ['composer', 'chiffre', 'combien']);
    if (kind === 'composer') {
      const parts = d.map((x, i) => [x, i]).reverse().filter(([x, i]) => x || i < 2);
      const txt = parts.map(([x, i]) => `${x} ${x <= 1 ? ranks[i].replace(/s(?=\b| )/g, '') : ranks[i]}`).join(', ');
      // ◆ : un rang au-delà de 9 (« 4 dizaines et 15 unités »), il faut regrouper
      if (hard && size <= 4) {
        const tens = ri(rand, 2, 8); const units = ri(rand, 11, 19); const hund = size >= 3 ? ri(rand, 1, 8) : 0;
        const ans = hund * 100 + tens * 10 + units;
        return numeric(ans, {
          prompt: `Quel nombre fait ${hund ? `${hund} centaine${hund > 1 ? 's' : ''}, ` : ''}${tens} dizaines et ${units} unités ?`, difficulty: 3, expectedSeconds: 50,
          misconceptions: [mc(Number(`${hund || ''}${tens}${units}`), 'mc:regrouper-dix', 'notion', `${units} unités, c’est 1 dizaine et ${units - 10} unités : il faut regrouper.`)],
          hints: [`${units} unités = 1 dizaine et ${units - 10} unités.`, `Tu as donc ${tens + 1} dizaines${hund ? ` et ${hund} centaines` : ''}.`],
          solution: `${hund ? `${hund * 100} + ` : ''}${tens * 10} + ${units} = ${fr(ans)}.`,
        });
      }
      const swapped = size === 2 ? d[0] * 10 + d[1] : null;
      return numeric(n, {
        prompt: `Écris le nombre : ${txt}.`, expectedSeconds: 35,
        misconceptions: swapped && swapped !== n && d[0] ? [mc(swapped, 'mc:position-chiffres', 'notion', 'Les dizaines s’écrivent à gauche des unités.')] : [],
        hints: ['Écris les chiffres du plus grand rang au plus petit.', 'Un rang qui n’est pas cité vaut 0.'],
        solution: `On écrit les chiffres rang par rang : ${fr(n)}.`,
      });
    }
    const r = ri(rand, 0, size - 1);
    if (kind === 'chiffre') {
      const neighbor = d[r + 1] !== undefined ? d[r + 1] : d[r - 1];
      return numeric(d[r], {
        prompt: `Dans le nombre ${fr(n)}, quel est le chiffre des ${ranks[r]} ?`, expectedSeconds: 30,
        misconceptions: neighbor !== undefined && neighbor !== d[r] ? [mc(neighbor, 'mc:position-chiffres', 'notion', 'Compte les rangs depuis la droite : unités, dizaines, centaines…')] : [],
        hints: ['Le chiffre des unités est le dernier à droite.', `Avance vers la gauche jusqu’au rang des ${ranks[r]}.`],
        solution: `${fr(n)} : le chiffre des ${ranks[r]} est ${d[r]}.`,
      });
    }
    // « combien de centaines en tout » : le nombre de centaines n'est pas le chiffre des centaines
    const k = ri(rand, 1, Math.min(2, size - 2));
    const ans = Math.floor(n / 10 ** k);
    return numeric(ans, {
      prompt: `Combien y a-t-il de ${ranks[k]} en tout dans ${fr(n)} ?`, difficulty: hard ? 3 : 2, expectedSeconds: 45,
      misconceptions: ans !== d[k] ? [mc(d[k], 'mc:chiffre-ou-nombre', 'notion', `${d[k]} est le chiffre des ${ranks[k]}, mais le nombre de ${ranks[k]} compte aussi celles des rangs plus grands.`)] : [],
      hints: [`Le chiffre des ${ranks[k]} ne suffit pas : regarde aussi les chiffres à sa gauche.`, `Cache les ${k} chiffre${k > 1 ? 's' : ''} de droite : ce qui reste est la réponse.`],
      solution: `Dans ${fr(n)}, il y a ${fr(ans)} ${ranks[k]} en tout (le chiffre des ${ranks[k]} est ${d[k]}).`,
    });
  },
});

add({
  id: 'mp-comparer', label: 'Comparer, ranger, encadrer', skill: 'mp.comparer', levels: PRIMARY_LEVELS,
  description: 'Le nombre qui suit, qui précède, l’encadrement à la dizaine ou à la centaine ; comparer des décimaux.',
  chapters: ['cp-m-comparer', 'cp-m-ordinaux', 'ce1-m-comparer', 'ce2-m-comparer', 'cm1-m-decimaux', 'cm2-m-decimaux'],
  make(rand, lv, hard) {
    const i = at(lv);
    if (i >= 3 && (hard || rand() < 0.5)) {
      // décimaux : 2,5 et 2,45 — le plus long n'est pas le plus grand
      const a = ri(rand, 1, 9); const t = ri(rand, 2, 8); const u = ri(rand, 1, t - 1); const v = ri(rand, 1, 9);
      const big = clean(a + t / 10); const small = clean(a + u / 10 + v / 100);
      const [x, y] = rand() < 0.5 ? [big, small] : [small, big];
      return numeric(big, {
        prompt: `Quel est le plus grand nombre : ${fr(x)} ou ${fr(y)} ?`, difficulty: 3, expectedSeconds: 35,
        misconceptions: [mc(small, 'mc:decimal-plus-long', 'notion', `${fr(small)} a plus de chiffres, mais compare d’abord les dixièmes : ${t} dixièmes, c’est plus que ${u} dixièmes.`)],
        hints: ['Compare la partie entière, puis les dixièmes, puis les centièmes.', `Tu peux écrire ${fr(big)} avec deux chiffres après la virgule : ${fr(big)}0.`],
        solution: `Même partie entière ; dixièmes : ${t} > ${u}, donc ${fr(big)} > ${fr(small)}.`,
      });
    }
    const step = [10, 10, 100, 1000, 1000][i];
    const max = [99, 999, 9999, 999999, 999999999][i];
    if (rand() < 0.5) {
      // le nombre juste après un passage de dizaine (59 → 60, 399 → 400, 4 999 → 5 000)
      const zeros = Math.max(1, Math.min(String(max).length - 1, ri(rand, 1, i + 1)));
      const base = ri(rand, 1, Math.floor(max / 10 ** zeros) - 1) * 10 ** zeros;
      const after = rand() < 0.6;
      const ans = after ? base : base - 1;
      const asked = after ? base - 1 : base;
      const wrong = after ? Number(`${Math.floor(asked / 10)}${(asked % 10) + 1}`) : null;
      return numeric(ans, {
        prompt: `Quel nombre vient juste ${after ? 'après' : 'avant'} ${fr(asked)} ?`, expectedSeconds: 30,
        misconceptions: wrong && wrong !== ans ? [mc(wrong, 'mc:passage-dizaine', 'notion', 'Après 9 unités, on fait une dizaine de plus et on revient à 0 unité.')] : [],
        hints: [after ? 'Ajoute 1.' : 'Retire 1.', 'Attention au passage de la dizaine (ou de la centaine).'],
        solution: `${fr(asked)} ${after ? '+' : '−'} 1 = ${fr(ans)}.`,
      });
    }
    // encadrer entre deux dizaines (ou centaines, milliers) qui se suivent
    let n;
    do { n = ri(rand, step + 1, Math.min(max, step * 999)); } while (n % step === 0);
    const low = Math.floor(n / step) * step;
    const unit = step === 10 ? 'dizaines' : step === 100 ? 'centaines' : 'milliers';
    return numeric(low + step, {
      prompt: `Encadre ${fr(n)} entre deux ${unit} qui se suivent : ${fr(low)} < ${fr(n)} < …`, expectedSeconds: 40,
      misconceptions: [mc(low + step * 10, 'mc:mauvais-rang', 'notion', `On cherche les ${unit} qui se suivent : après ${fr(low)}, la suivante est ${fr(low + step)}.`), mc(n + 1, 'mc:suivant', 'notion', `On ne cherche pas le nombre qui suit ${fr(n)}, mais les ${unit} entières.`)],
      hints: [`${fr(low)} est la ${unit.slice(0, -1)} juste avant ${fr(n)}.`, `Ajoute ${fr(step)} à ${fr(low)}.`],
      solution: `${fr(low)} < ${fr(n)} < ${fr(low + step)}.`,
    });
  },
});

/* ------------------------------ Calcul ------------------------------ */

add({
  id: 'mp-addition', label: 'Additions : tables, doubles, compléments, additions posées', skill: 'mp.addition', levels: ['cp', 'ce1', 'ce2'],
  description: 'Les tables d’addition, les doubles et les compléments, puis les sommes de nombres à deux ou trois chiffres.',
  chapters: ['cp-m-tables-addition', 'cp-m-ajouter-retirer', 'cp-m-addition-posee', 'cp-m-calcul-procedures', 'ce1-m-faits-addition', 'ce1-m-operations-posees', 'ce2-m-faits', 'ce2-m-addition-soustraction'],
  make(rand, lv, hard) {
    const i = at(lv);
    const kind = pick(rand, ['somme', 'somme', 'double', 'complement']);
    if (kind === 'double') {
      const n = i === 0 ? ri(rand, 2, hard ? 25 : 10) : ri(rand, 11, hard ? 250 : 50);
      return numeric(2 * n, {
        prompt: `Quel est le double de ${fr(n)} ?`, expectedSeconds: 25,
        misconceptions: [mc(n + 2, 'mc:double', 'notion', `Le double, c’est ${fr(n)} + ${fr(n)}, pas ${fr(n)} + 2.`)],
        hints: [`Le double de ${fr(n)}, c’est ${fr(n)} + ${fr(n)}.`], solution: `${fr(n)} + ${fr(n)} = ${fr(2 * n)}.`,
      });
    }
    if (kind === 'complement') {
      const target = [10, 100, 100][i] * (hard && i ? 10 : 1);
      const a = ri(rand, 1, target - 1);
      return numeric(target - a, {
        prompt: `Complète : ${fr(a)} + … = ${fr(target)}`, expectedSeconds: 30,
        misconceptions: [mc(target + a, 'mc:complement', 'notion', `On cherche ce qu’il faut ajouter à ${fr(a)} pour arriver à ${fr(target)} : c’est un écart, pas une somme.`)],
        hints: [`Compte de ${fr(a)} jusqu’à ${fr(target)}.`, `Ou calcule ${fr(target)} − ${fr(a)}.`], solution: `${fr(a)} + ${fr(target - a)} = ${fr(target)}.`,
      });
    }
    const [lo, hi] = [[1, 10], [10, 89], [100, 899]][i];
    const a = ri(rand, lo, hi); const b = ri(rand, lo, hi);
    const c = hard ? ri(rand, lo, hi) : 0;
    const ans = a + b + c;
    const carry = (a % 10) + (b % 10) + (c % 10) >= 10;
    return numeric(ans, {
      prompt: `Calcule : ${fr(a)} + ${fr(b)}${c ? ` + ${fr(c)}` : ''}`, difficulty: hard ? 3 : 2, expectedSeconds: i ? 45 : 25,
      misconceptions: i && carry ? [mc(ans - 10, 'mc:retenue-oubliee', 'calcul', 'Les unités font plus de 9 : n’oublie pas la retenue sur les dizaines.')] : [],
      hints: [i ? 'Pose l’addition : unités sous les unités, dizaines sous les dizaines.' : `Pars de ${fr(Math.max(a, b))} et avance de ${fr(Math.min(a, b))}.`, 'Si les unités font 10 ou plus, retiens 1 dizaine.'],
      solution: `${fr(a)} + ${fr(b)}${c ? ` + ${fr(c)}` : ''} = ${fr(ans)}.`,
    });
  },
});

/** Soustraction « en enlevant le plus petit chiffre du plus grand dans chaque colonne » (erreur classique). */
function columnBug(a, b) {
  const da = digits(a).reverse(); const db = digits(b).reverse();
  return Number(da.map((x, k) => Math.abs(x - (db[k] || 0))).reverse().join(''));
}

add({
  id: 'mp-soustraction', label: 'Soustractions', skill: 'mp.soustraction', levels: ['cp', 'ce1', 'ce2', 'cm1'],
  description: 'Retirer, calculer un écart ; soustractions posées avec retenue.',
  chapters: ['cp-m-ajouter-retirer', 'ce1-m-operations-posees', 'ce2-m-addition-soustraction', 'cm1-m-calcul-mental'],
  make(rand, lv, hard) {
    const i = at(lv);
    const max = [20, 100, 1000, 10000][i] * (hard ? (i === 0 ? 5 : 10) : 1);
    let a; let b;
    do { a = ri(rand, Math.floor(max / 4), max - 1); b = ri(rand, 1, a - 1); } while (hard && i && (a % 10) >= (b % 10));
    const ans = a - b;
    const bug = columnBug(a, b);
    return numeric(ans, {
      prompt: `Calcule : ${fr(a)} − ${fr(b)}`, difficulty: hard ? 3 : 2, expectedSeconds: i ? 50 : 25,
      misconceptions: [...(bug !== ans ? [mc(bug, 'mc:soustraction-colonnes', 'calcul', 'Dans une colonne, on ne retire pas « le plus petit du plus grand » : s’il manque des unités, on échange une dizaine contre 10 unités.')] : []),
        mc(a + b, 'mc:addition', 'notion', 'Tu as additionné : ici on retire.')],
      hints: [i ? 'Pose la soustraction en alignant les unités.' : `Pars de ${fr(a)} et recule de ${fr(b)}.`, 'Si le chiffre du haut est trop petit, prends une dizaine : il gagne 10 unités.'],
      solution: `${fr(a)} − ${fr(b)} = ${fr(ans)} (vérification : ${fr(ans)} + ${fr(b)} = ${fr(a)}).`,
    });
  },
});

add({
  id: 'mp-calcul-mental', label: 'Calcul mental : procédures', skill: 'mp.calcul-mental', levels: PRIMARY_LEVELS,
  description: 'Ajouter 9 ou 19, des dizaines entières, multiplier par 10, 100 ou 1 000, compléter, doubler.',
  chapters: ['cp-m-calcul-dizaines', 'cp-m-calcul-procedures', 'ce1-m-calcul-mental', 'ce2-m-calcul-mental', 'cm1-m-calcul-mental', 'cm2-m-calcul-mental'],
  make(rand, lv, hard) {
    const i = at(lv);
    const kinds = [['plus10', 'moins10', 'dizaine-sup'], ['plus9', 'dizaines', 'fois10'], ['plus19', 'moins9', 'fois100', 'fois10'], ['fois100', 'div10', 'plus99', 'double'], ['fois1000', 'div100', 'fois5', 'double']][i];
    const k = pick(rand, kinds);
    const big = hard ? 10 : 1;
    switch (k) {
      case 'plus10': case 'moins10': {
        const n = ri(rand, 11, 89); const ans = k === 'plus10' ? n + 10 : n - 10;
        return numeric(ans, { prompt: `Calcule : ${n} ${k === 'plus10' ? '+' : '−'} 10`, expectedSeconds: 20, misconceptions: [mc(k === 'plus10' ? n + 1 : n - 1, 'mc:dix-ou-un', 'notion', 'Ajouter ou retirer 10, c’est changer le chiffre des dizaines : celui des unités ne bouge pas.')], hints: ['Seul le chiffre des dizaines change.'], solution: `${n} ${k === 'plus10' ? '+' : '−'} 10 = ${ans}.` });
      }
      case 'dizaine-sup': {
        let n; do { n = ri(rand, 11, 88); } while (n % 10 === 0);
        const up = Math.ceil(n / 10) * 10;
        return numeric(up - n, { prompt: `Complète pour arriver à la dizaine : ${n} + … = ${up}`, expectedSeconds: 25, misconceptions: [mc(up, 'mc:complement', 'notion', `On cherche ce qui manque à ${n} pour faire ${up}, pas ${up} lui-même.`)], hints: [`Combien manque-t-il à ${n % 10} pour faire 10 ?`], solution: `${n} + ${up - n} = ${up}.` });
      }
      case 'plus9': case 'plus19': case 'plus99': {
        const add9 = k === 'plus9' ? 9 : k === 'plus19' ? 19 : 99;
        const n = ri(rand, 12, k === 'plus99' ? 900 : 80) * big;
        return numeric(n + add9, { prompt: `Calcule : ${fr(n)} + ${add9}`, expectedSeconds: 25, misconceptions: [mc(n + add9 + 1, 'mc:ajouter-9', 'notion', `Ajouter ${add9}, c’est ajouter ${add9 + 1} puis retirer 1 : tu as oublié de retirer 1.`)], hints: [`Ajoute ${add9 + 1}, puis retire 1.`], solution: `${fr(n)} + ${add9 + 1} − 1 = ${fr(n + add9)}.` });
      }
      case 'moins9': {
        const n = ri(rand, 20, 99) * big;
        return numeric(n - 9, { prompt: `Calcule : ${fr(n)} − 9`, expectedSeconds: 25, misconceptions: [mc(n - 11, 'mc:retirer-9', 'notion', 'Retirer 9, c’est retirer 10 puis ajouter 1 (et non retirer 1).')], hints: ['Retire 10, puis ajoute 1.'], solution: `${fr(n)} − 10 + 1 = ${fr(n - 9)}.` });
      }
      case 'dizaines': {
        const n = ri(rand, 11, 59); const t = ri(rand, 2, 4) * 10;
        return numeric(n + t, { prompt: `Calcule : ${n} + ${t}`, expectedSeconds: 25, misconceptions: [mc(n + t / 10, 'mc:dizaines-unites', 'notion', `${t}, ce sont ${t / 10} dizaines : on les ajoute aux dizaines, pas aux unités.`)], hints: [`${t} = ${t / 10} dizaines.`], solution: `${n} + ${t} = ${n + t}.` });
      }
      case 'fois10': case 'fois100': case 'fois1000': {
        const f = k === 'fois10' ? 10 : k === 'fois100' ? 100 : 1000;
        const n = ri(rand, 3, i >= 3 ? 999 : 99);
        return numeric(n * f, { prompt: `Calcule : ${fr(n)} × ${fr(f)}`, expectedSeconds: 20, misconceptions: f > 10 ? [mc(n * 10, 'mc:zeros', 'notion', `Multiplier par ${fr(f)}, c’est rendre le nombre ${fr(f)} fois plus grand : chaque chiffre avance de ${String(f).length - 1} rangs.`)] : [mc(n + 10, 'mc:fois-plus', 'notion', 'Multiplier par 10 n’est pas ajouter 10.')], hints: [`Chaque chiffre avance de ${String(f).length - 1} rang${f > 10 ? 's' : ''} vers la gauche.`], solution: `${fr(n)} × ${fr(f)} = ${fr(n * f)}.` });
      }
      case 'div10': case 'div100': {
        const f = k === 'div10' ? 10 : 100;
        const q = ri(rand, 3, 999);
        return numeric(q, { prompt: `Calcule : ${fr(q * f)} ÷ ${f}`, expectedSeconds: 25, misconceptions: [mc(k === 'div100' ? q * 10 : q * 100, 'mc:diviser', 'notion', k === 'div100' ? 'Diviser par 100, c’est enlever deux rangs, pas un seul.' : 'Diviser par 10 rend le nombre plus petit, pas plus grand.')], hints: [`Combien de fois ${f} dans ${fr(q * f)} ?`], solution: `${fr(q * f)} ÷ ${f} = ${fr(q)}.` });
      }
      case 'double': {
        const n = ri(rand, 13, 49) * (hard ? 10 : 1) + (hard ? ri(rand, 1, 9) : 0);
        return numeric(2 * n, { prompt: `Quel est le double de ${fr(n)} ?`, expectedSeconds: 25, misconceptions: [mc(n + 2, 'mc:double', 'notion', 'Le double, c’est deux fois le nombre.')], hints: ['Double les dizaines, double les unités, puis ajoute.'], solution: `2 × ${fr(n)} = ${fr(2 * n)}.` });
      }
      case 'fois5': default: {
        const n = ri(rand, 4, 40) * 2;
        return numeric(n * 5, { prompt: `Calcule : ${n} × 5`, expectedSeconds: 30, misconceptions: [mc(n * 10, 'mc:fois5', 'notion', 'Multiplier par 5, c’est multiplier par 10 puis prendre la moitié.')], hints: ['× 5 = × 10, puis la moitié.'], solution: `${n} × 10 = ${n * 10}, la moitié : ${n * 5}.` });
      }
    }
  },
});

add({
  id: 'mp-tables', label: 'Tables de multiplication', skill: 'mp.tables-multiplication', levels: PRIMARY_LEVELS,
  description: 'Des groupements au CP, puis les tables, les facteurs manquants et « combien de fois ».',
  chapters: ['cp-m-groupements-partages', 'ce1-m-multiplication', 'ce1-m-tables-multiplication', 'ce2-m-faits', 'ce2-m-multiplication', 'cm1-m-calcul-mental', 'cm2-m-calcul-mental'],
  make(rand, lv, hard) {
    const i = at(lv);
    if (i === 0) {
      const g = ri(rand, 2, hard ? 6 : 4); const n = ri(rand, 2, hard ? 6 : 5);
      const thing = pick(rand, ['billes', 'crayons', 'gâteaux', 'images']);
      return numeric(g * n, {
        prompt: `Il y a ${g} paquets de ${n} ${thing}. Combien ${de(thing)} en tout ?`, representation: 'concrete', expectedSeconds: 40,
        misconceptions: [mc(g + n, 'mc:addition-au-lieu-de-multiplication', 'notion', `Il y a ${g} paquets de ${n} : on ajoute ${n} ${g} fois.`)],
        hints: [`Compte ${n} par ${n}, ${g} fois.`], solution: `${Array(g).fill(n).join(' + ')} = ${g * n}.`,
      });
    }
    const tables = i === 1 ? [2, 3, 4, 5, 10] : [2, 3, 4, 5, 6, 7, 8, 9];
    const a = pick(rand, tables); const b = ri(rand, 2, hard ? 12 : 10);
    if (i >= 2 && (hard || rand() < 0.4)) {
      return numeric(b, {
        prompt: `Complète : ${a} × … = ${a * b}`, difficulty: 3, expectedSeconds: 30,
        misconceptions: [mc(a * b - a, 'mc:soustraction', 'notion', 'On cherche le facteur manquant : combien de fois ' + a + ' dans ' + a * b + ' ?')],
        hints: [`Récite la table de ${a} jusqu’à ${a * b}.`], solution: `${a} × ${b} = ${a * b}.`,
      });
    }
    const [x, y] = rand() < 0.5 ? [a, b] : [b, a];
    return numeric(a * b, {
      prompt: `Calcule : ${x} × ${y}`, expectedSeconds: 20,
      misconceptions: [mc(a + b, 'mc:addition-au-lieu-de-multiplication', 'notion', 'Le signe × veut dire « fois » : on multiplie.'), mc(a * (b + 1), 'mc:table-voisine', 'calcul', 'C’est le résultat suivant dans la table.'), mc(a * (b - 1), 'mc:table-voisine', 'calcul', 'C’est le résultat précédent dans la table.')],
      hints: [`${x} × ${y}, c’est ${y} ajouté ${x} fois.`, `Pars d’un résultat que tu connais : ${a} × ${b - 1} = ${a * (b - 1)}, puis ajoute ${a}.`],
      solution: `${x} × ${y} = ${a * b}.`,
    });
  },
});

add({
  id: 'mp-multiplication-posee', label: 'Multiplication posée', skill: 'mp.multiplication-posee', levels: ['ce2', 'cm1', 'cm2'],
  description: 'Multiplier par un nombre à un chiffre, puis à deux chiffres ; un décimal par un entier en CM2.',
  chapters: ['ce2-m-multiplication-posee', 'cm1-m-multiplication', 'cm2-m-multiplication-division'],
  make(rand, lv, hard) {
    const i = at(lv);
    if (i === 4 && (hard || rand() < 0.5)) {
      const a = clean(ri(rand, 12, 99) / 10); const b = ri(rand, 3, 9);
      const ans = clean(a * b);
      return numeric(ans, {
        prompt: `Calcule : ${fr(a)} × ${b}`, difficulty: 3, expectedSeconds: 60,
        misconceptions: [mc(clean(a * 10 * b), 'mc:virgule-oubliee', 'notion', `${fr(a)} a un chiffre après la virgule : le produit aussi.`)],
        hints: [`Calcule ${fr(a * 10)} × ${b}, puis remets un chiffre après la virgule.`], solution: `${fr(a * 10)} × ${b} = ${fr(a * 10 * b)}, donc ${fr(a)} × ${b} = ${fr(ans)}.`,
      });
    }
    const twoDigits = i >= 3 && (hard || rand() < 0.6);
    const a = ri(rand, 23, i === 2 ? 99 : 499); const b = twoDigits ? ri(rand, 12, 49) : ri(rand, 3, 9);
    const ans = a * b;
    const mcs = [];
    if (twoDigits) mcs.push(mc(a * Math.floor(b / 10) + a * (b % 10), 'mc:decalage', 'calcul', `Pour les dizaines de ${b}, on multiplie par ${Math.floor(b / 10) * 10} : décale la deuxième ligne d’un rang (ou écris un 0).`));
    const noCarry = Number(digits(a).map((x) => (x * (b % 10)) % 10).join(''));
    if (!twoDigits && noCarry !== ans) mcs.push(mc(noCarry, 'mc:retenue-oubliee', 'calcul', 'N’oublie pas les retenues : ajoute-les au produit suivant.'));
    return numeric(ans, {
      prompt: `Pose et calcule : ${fr(a)} × ${b}`, difficulty: twoDigits ? 3 : 2, expectedSeconds: twoDigits ? 120 : 60, misconceptions: mcs,
      hints: twoDigits ? [`Calcule ${fr(a)} × ${b % 10}, puis ${fr(a)} × ${Math.floor(b / 10) * 10}.`, 'Ajoute les deux lignes.'] : ['Commence par les unités et garde les retenues.'],
      solution: twoDigits ? `${fr(a)} × ${b % 10} = ${fr(a * (b % 10))} ; ${fr(a)} × ${Math.floor(b / 10) * 10} = ${fr(a * Math.floor(b / 10) * 10)} ; total ${fr(ans)}.` : `${fr(a)} × ${b} = ${fr(ans)}.`,
    });
  },
});

add({
  id: 'mp-division', label: 'Partages et divisions', skill: 'mp.division', levels: ['ce2', 'cm1', 'cm2'],
  description: 'Partager équitablement, quotient et reste, puis la division décimale en CM2.',
  chapters: ['ce2-m-division', 'cm1-m-division', 'cm2-m-multiplication-division', 'cm2-m-multiples-diviseurs'],
  make(rand, lv, hard) {
    const i = at(lv);
    if (i === 2) {
      const n = ri(rand, 2, hard ? 9 : 6); const q = ri(rand, 2, hard ? 12 : 9); const thing = pick(rand, ['bonbons', 'cartes', 'billes', 'feutres']);
      return numeric(q, {
        prompt: `On partage ${n * q} ${thing} entre ${n} enfants, chacun autant. Combien ${de(thing)} pour chacun ?`, representation: 'concrete', expectedSeconds: 45,
        misconceptions: [mc(n * q - n, 'mc:soustraction', 'notion', 'Partager en parts égales, c’est diviser : combien de fois ' + n + ' dans ' + n * q + ' ?')],
        hints: [`Cherche dans la table de ${n} : ${n} × … = ${n * q}.`], solution: `${n} × ${q} = ${n * q}, donc chacun a ${q} ${thing}.`,
      });
    }
    if (i === 4 && (hard || rand() < 0.4)) {
      const d = pick(rand, [2, 4, 5]); const a = ri(rand, 11, 49);
      if (a % d === 0) return numeric(a / d, { prompt: `Calcule : ${a} ÷ ${d}`, expectedSeconds: 40, hints: [`Combien de fois ${d} dans ${a} ?`], solution: `${a} ÷ ${d} = ${a / d}.` });
      const ans = clean(a / d);
      return numeric(ans, {
        prompt: `Calcule la division décimale : ${a} ÷ ${d}`, difficulty: 3, expectedSeconds: 75,
        misconceptions: [mc(Math.floor(a / d), 'mc:reste-oublie', 'notion', 'Il reste quelque chose : continue la division après la virgule (ajoute des dixièmes).')],
        hints: [`${a} ÷ ${d} = ${Math.floor(a / d)}, reste ${a % d}.`, `Le reste ${a % d} = ${(a % d) * 10} dixièmes : divise-les aussi par ${d}.`], solution: `${a} ÷ ${d} = ${fr(ans)}.`,
      });
    }
    const d = ri(rand, 3, 9); const q = ri(rand, 4, hard ? 99 : 12); const r = ri(rand, 1, d - 1); const n = d * q + r;
    if (rand() < 0.5) {
      return numeric(r, {
        prompt: `Quel est le reste de la division de ${n} par ${d} ?`, expectedSeconds: 50,
        misconceptions: [mc(q, 'mc:quotient-ou-reste', 'notion', `${q} est le quotient ; le reste est ce qui ne fait pas un groupe complet de ${d}.`), mc(r + d, 'mc:reste-trop-grand', 'notion', `Le reste est toujours plus petit que ${d}.`)],
        hints: [`Cherche le plus grand multiple de ${d} inférieur à ${n}.`], solution: `${n} = ${d} × ${q} + ${r} : le reste est ${r}.`,
      });
    }
    return numeric(q, {
      prompt: `Complète : ${n} = ${d} × … + ${r}`, expectedSeconds: 50,
      misconceptions: [mc(q + 1, 'mc:quotient-trop-grand', 'calcul', `${d} × ${q + 1} = ${d * (q + 1)} : c’est plus que ${n}.`)],
      hints: [`${n} − ${r} = ${n - r}.`, `${d} × … = ${n - r}.`], solution: `${d} × ${q} = ${d * q} et ${d * q} + ${r} = ${n}.`,
    });
  },
});

add({
  id: 'mp-multiples', label: 'Multiples et diviseurs', skill: 'mp.multiples-diviseurs', levels: ['cm1', 'cm2'],
  description: 'Trouver un multiple dans un intervalle, le plus petit multiple commun, compter des diviseurs.',
  chapters: ['cm1-m-division', 'cm2-m-multiples-diviseurs'],
  make(rand, lv, hard) {
    if (hard || (at(lv) === 4 && rand() < 0.5)) {
      const pairs = [[4, 6, 12], [6, 8, 24], [3, 4, 12], [4, 10, 20], [6, 9, 18], [5, 6, 30], [8, 12, 24], [2, 3, 6], [2, 5, 10], [3, 5, 15], [4, 5, 20], [2, 7, 14], [3, 8, 24], [6, 10, 30], [10, 15, 30], [9, 12, 36]];
      const [x, y, l] = pick(rand, pairs); const [a, b] = rand() < 0.5 ? [x, y] : [y, x];
      return numeric(l, {
        prompt: `Quel est le plus petit nombre (autre que 0) qui est à la fois un multiple de ${a} et un multiple de ${b} ?`, difficulty: 3, expectedSeconds: 70,
        misconceptions: [...(a * b !== l ? [mc(a * b, 'mc:produit', 'notion', `${a} × ${b} = ${a * b} est bien un multiple commun, mais il y en a un plus petit.`)] : [])],
        hints: [`Écris les multiples de ${b} : ${b}, ${2 * b}, ${3 * b}…`, `Lequel est aussi dans la table de ${a} ?`], solution: `${l} = ${l / a} × ${a} = ${l / b} × ${b}.`,
      });
    }
    const d = ri(rand, 3, 9); const k = ri(rand, 4, 11); const m = d * k;
    const lo = m - ri(rand, 1, d - 1); const hi = lo + d - 1;
    return numeric(m, {
      prompt: `Quel multiple de ${d} est compris entre ${lo} et ${hi} ?`, expectedSeconds: 40,
      misconceptions: [mc(m + d, 'mc:hors-intervalle', 'calcul', `${m + d} est un multiple de ${d}, mais il dépasse ${hi}.`)],
      hints: [`Récite la table de ${d}.`], solution: `${d} × ${k} = ${m}, entre ${lo} et ${hi}.`,
    });
  },
});

/* ------------------------------ Grandeurs ------------------------------ */

add({
  id: 'mp-monnaie', label: 'La monnaie', skill: 'mp.monnaie', levels: ['cp', 'ce1', 'ce2'],
  description: 'Compter des pièces et des billets, euros et centimes, rendre la monnaie.',
  chapters: ['cp-m-monnaie', 'ce1-m-monnaie', 'ce2-m-monnaie'],
  make(rand, lv, hard) {
    const i = at(lv);
    if (i === 0) {
      const b = ri(rand, 1, hard ? 4 : 2); const p2 = ri(rand, 0, 3); const p1 = ri(rand, 1, 4);
      const ans = b * 5 + p2 * 2 + p1;
      return numeric(ans, {
        prompt: `Tu as ${b} billet${b > 1 ? 's' : ''} de 5 €${p2 ? `, ${p2} pièce${p2 > 1 ? 's' : ''} de 2 €` : ''} et ${p1} pièce${p1 > 1 ? 's' : ''} de 1 €. Combien d’euros as-tu ?`, unit: '€', representation: 'concrete', expectedSeconds: 50,
        misconceptions: [mc(b + p2 + p1, 'mc:compter-objets', 'notion', 'On ne compte pas les pièces et les billets : on ajoute leurs valeurs.')],
        hints: ['Compte d’abord les billets de 5 € : 5, 10, 15…', 'Ajoute ensuite les pièces.'], solution: `${b} × 5 €${p2 ? ` + ${p2} × 2 €` : ''} + ${p1} € = ${ans} €.`,
      });
    }
    if (i === 1 && !hard) {
      const e = ri(rand, 1, 9); const c = ri(rand, 1, 9) * 10;
      return numeric(e * 100 + c, {
        prompt: `${e} € et ${c} centimes, cela fait combien de centimes ?`, unit: 'c', unitOptional: true, expectedSeconds: 40,
        misconceptions: [mc(e * 10 + c, 'mc:euro-centimes', 'notion', '1 € = 100 centimes.'), mc(e + c, 'mc:euro-centimes', 'notion', 'Chaque euro vaut 100 centimes.')],
        hints: ['1 € = 100 centimes.'], solution: `${e} € = ${e * 100} centimes ; ${e * 100} + ${c} = ${e * 100 + c} centimes.`,
      });
    }
    const p = clean(ri(rand, 21, hard ? 378 : 196) * 0.05); // un prix au multiple de 5 centimes
    const paid = p < 5 ? 5 : p < 10 ? 10 : 20;
    const ans = clean(paid - p);
    return numeric(ans, {
      prompt: `${pick(rand, NAMES)} achète un livre à ${fr(p)} € et paie avec un billet de ${paid} €. Combien lui rend-on ?`, unit: '€', representation: 'concrete', difficulty: 3, expectedSeconds: 70,
      misconceptions: [mc(clean(paid + p), 'mc:addition', 'notion', 'On rend la différence entre le billet et le prix.')],
      hints: [`Complète de ${fr(p)} € jusqu’à ${paid} €.`, 'Arrive d’abord à l’euro suivant, puis à la dizaine.'], solution: `${paid} € − ${fr(p)} € = ${fr(ans)} €.`,
    });
  },
});

const LENGTHS = { km: 1000, m: 1, dm: 0.1, cm: 0.01, mm: 0.001 };
add({
  id: 'mp-longueurs', label: 'Longueurs : mesurer et convertir', skill: 'mp.longueurs', levels: ['cp', 'ce1', 'ce2', 'cm1', 'cm2'],
  description: 'Comparer des longueurs au CP, puis convertir mètres, centimètres, kilomètres, millimètres.',
  chapters: ['cp-m-longueurs', 'ce1-m-longueurs', 'ce2-m-longueurs-perimetre', 'cm1-m-grandeurs'],
  make(rand, lv, hard) {
    const i = at(lv);
    if (i === 0) {
      const a = ri(rand, 8, 20); const b = ri(rand, 2, a - 2); const [o1, o2] = pick(rand, [['crayon', 'gomme'], ['règle', 'feutre'], ['livre', 'cahier']]);
      return numeric(a - b, {
        prompt: `Le ${o1} mesure ${a} cm et la ${o2} mesure ${b} cm. De combien de centimètres le ${o1} est-il plus long ?`, unit: 'cm', unitOptional: true, representation: 'concrete', expectedSeconds: 45,
        misconceptions: [mc(a + b, 'mc:addition', 'notion', 'On cherche l’écart entre les deux longueurs.')], hints: [`Combien faut-il ajouter à ${b} pour arriver à ${a} ?`], solution: `${a} − ${b} = ${a - b} cm.`,
      });
    }
    const pairs = i === 1 ? [['m', 'cm'], ['km', 'm']] : i === 2 ? [['m', 'cm'], ['cm', 'mm'], ['m', 'mm'], ['km', 'm'], ['dm', 'cm']] : [['m', 'cm'], ['km', 'm'], ['cm', 'mm'], ['m', 'mm'], ['cm', 'm'], ['m', 'km']];
    const [from, to] = pick(rand, pairs);
    const factor = clean(LENGTHS[from] / LENGTHS[to]);
    const decimal = i >= 3 && (hard || rand() < 0.5);
    let v = decimal ? clean(ri(rand, 11, 99) / 10) : ri(rand, 2, 9);
    if (factor < 1) v = ri(rand, 2, 99) * (1 / factor) / (decimal ? 10 : 1); // 350 cm → m, 2 500 m → km
    v = clean(v);
    const ans = clean(v * factor);
    const wrongFactor = factor >= 1 ? (factor === 100 ? 10 : factor === 1000 ? 100 : 100) : (factor === 0.01 ? 0.1 : 0.01);
    return numeric(ans, {
      prompt: `Convertis : ${fr(v)} ${from} = … ${to}`, unit: to, unitOptional: true, difficulty: decimal ? 3 : 2, expectedSeconds: 45,
      misconceptions: [mc(clean(v * wrongFactor), 'mc:conversion', 'notion', `1 ${from} = ${fr(factor)} ${to} : vérifie le nombre de zéros.`), mc(clean(v / factor), 'mc:sens-conversion', 'notion', `On passe de ${from} à ${to} : l’unité est ${factor > 1 ? 'plus petite, il en faut plus' : 'plus grande, il en faut moins'}.`)],
      hints: [`1 ${from} = ${fr(factor)} ${to}.`, factor > 1 ? `Multiplie par ${fr(factor)}.` : `Divise par ${fr(1 / factor)}.`], solution: `${fr(v)} ${from} = ${fr(ans)} ${to}.`,
    });
  },
});

add({
  id: 'mp-perimetre', label: 'Le périmètre', skill: 'mp.perimetre', levels: ['ce2', 'cm1', 'cm2'],
  description: 'Le tour d’un carré, d’un rectangle, d’un polygone ; retrouver un côté.',
  chapters: ['ce2-m-longueurs-perimetre', 'cm1-m-grandeurs', 'cm2-m-geometrie'],
  make(rand, lv, hard) {
    if (hard) {
      const c = ri(rand, 3, 25);
      return numeric(c, {
        prompt: `Un carré a un périmètre de ${4 * c} cm. Combien mesure un côté ?`, unit: 'cm', unitOptional: true, difficulty: 3, expectedSeconds: 50,
        misconceptions: [mc(4 * c / 2, 'mc:demi-perimetre', 'notion', 'Un carré a 4 côtés égaux : divise par 4.')], hints: ['Le périmètre est la somme des 4 côtés.'], solution: `${4 * c} ÷ 4 = ${c} cm.`,
      });
    }
    const L = ri(rand, 5, 30); const l = ri(rand, 2, L - 1);
    return numeric(2 * (L + l), {
      prompt: `Un rectangle mesure ${L} cm de long et ${l} cm de large. Quel est son périmètre ?`, unit: 'cm', unitOptional: true, representation: 'visuelle', expectedSeconds: 50,
      misconceptions: [mc(L + l, 'mc:demi-perimetre', 'notion', 'Le tour du rectangle passe par les 4 côtés : 2 longueurs et 2 largeurs.'), mc(L * l, 'mc:aire-perimetre', 'notion', 'L × l donne l’aire (la surface), pas le tour.')],
      hints: ['Le périmètre est la longueur du tour.', `${L} + ${l} + ${L} + ${l}.`], solution: `${L} + ${l} + ${L} + ${l} = ${2 * (L + l)} cm.`,
    });
  },
});

add({
  id: 'mp-masses', label: 'Masses et contenances', skill: 'mp.masses-contenances', levels: ['cp', 'ce1', 'ce2', 'cm1', 'cm2'],
  description: 'Ajouter des masses, convertir kilogrammes et grammes, litres et centilitres.',
  chapters: ['cp-m-masses', 'ce1-m-masses', 'ce2-m-masses-contenances', 'cm1-m-grandeurs'],
  make(rand, lv, hard) {
    const i = at(lv);
    if (i === 0) {
      const a = ri(rand, 2, 9); const b = ri(rand, 1, 9);
      return numeric(a + b, { prompt: `Un sac de pommes pèse ${a} kg et un sac de carottes ${b} kg. Combien pèsent les deux sacs ensemble ?`, unit: 'kg', unitOptional: true, representation: 'concrete', expectedSeconds: 35, hints: ['Ajoute les deux masses.'], solution: `${a} + ${b} = ${a + b} kg.` });
    }
    const pairs = i === 1 ? [['kg', 'g', 1000]] : [['kg', 'g', 1000], ['t', 'kg', 1000], ['L', 'cL', 100], ['L', 'mL', 1000], ['dL', 'cL', 10]];
    const [from, to, f] = pick(rand, pairs);
    const decimal = i >= 3 && (hard || rand() < 0.5);
    const v = decimal ? clean(ri(rand, 11, 49) / 10) : ri(rand, 2, 9);
    const ans = clean(v * f);
    return numeric(ans, {
      prompt: `Convertis : ${fr(v)} ${from} = … ${to}`, unit: to, unitOptional: true, difficulty: decimal ? 3 : 2, expectedSeconds: 40,
      misconceptions: [mc(clean(v * (f === 1000 ? 100 : 10)), 'mc:conversion', 'notion', `1 ${from} = ${fr(f)} ${to}.`)],
      hints: [`1 ${from} = ${fr(f)} ${to}.`], solution: `${fr(v)} × ${fr(f)} = ${fr(ans)} ${to}.`,
    });
  },
});

add({
  id: 'mp-durees', label: 'L’heure et les durées', skill: 'mp.durees', levels: PRIMARY_LEVELS,
  description: 'Heures entières, demi-heures et quarts d’heure, minutes et secondes, durées entre deux horaires.',
  chapters: ['cp-m-heures', 'ce1-m-heures-durees', 'ce2-m-heures-durees', 'cm1-m-durees', 'cm2-m-durees'],
  make(rand, lv, hard) {
    const i = at(lv);
    if (i === 0) {
      const h = ri(rand, 1, 8); const d = ri(rand, 1, hard ? 6 : 3);
      return numeric(h + d, { prompt: `Il est ${h} heures. Quelle heure sera-t-il dans ${d} heure${d > 1 ? 's' : ''} ?`, unit: 'h', unitOptional: true, representation: 'concrete', expectedSeconds: 35, hints: ['Avance la petite aiguille d’une heure à la fois.'], solution: `${h} h + ${d} h = ${h + d} h.` });
    }
    if (i === 1) {
      const h = ri(rand, 1, 4);
      const k = pick(rand, [['une demi-heure', 30], ['un quart d’heure', 15], ['trois quarts d’heure', 45], ['une heure et demie', 90],
        [`${h} heure${h > 1 ? 's' : ''}`, h * 60], [`${h} heure${h > 1 ? 's' : ''} et demie`, h * 60 + 30], [`${h} heure${h > 1 ? 's' : ''} et quart`, h * 60 + 15]]);
      const base100 = Math.floor(k[1] / 60) * 100 + Math.round(((k[1] % 60) / 60) * 100); // « une heure = 100 minutes »
      return numeric(k[1], { prompt: `Combien de minutes y a-t-il dans ${k[0]} ?`, unit: 'min', unitOptional: true, expectedSeconds: 30, misconceptions: base100 !== k[1] ? [mc(base100, 'mc:base-100', 'notion', 'Une heure dure 60 minutes, pas 100.')] : [], hints: ['1 heure = 60 minutes ; une demi-heure = 30 minutes ; un quart d’heure = 15 minutes.'], solution: `${k[0]} = ${k[1]} minutes.` });
    }
    if (i === 4 && rand() < 0.35) {
      const m = ri(rand, 1, 9); const s = ri(rand, 5, 55);
      return numeric(m * 60 + s, { prompt: `Convertis : ${m} min ${s} s = … s`, unit: 's', unitOptional: true, expectedSeconds: 40, misconceptions: [mc(m * 100 + s, 'mc:base-100', 'notion', 'Une minute dure 60 secondes.')], hints: ['1 min = 60 s.'], solution: `${m} × 60 + ${s} = ${m * 60 + s} s.` });
    }
    if (hard || rand() < 0.5) {
      // durée entre deux horaires (en minutes)
      const h1 = ri(rand, 8, 16); const m1 = pick(rand, [0, 10, 15, 20, 30, 40, 45]); const dur = ri(rand, 3, hard ? 20 : 12) * 5;
      const t2 = h1 * 60 + m1 + dur; const h2 = Math.floor(t2 / 60); const m2 = t2 % 60;
      const naive = (h2 - h1) * 100 + (m2 - m1);
      return numeric(dur, {
        prompt: `Un film commence à ${h1} h ${String(m1).padStart(2, '0')} et finit à ${h2} h ${String(m2).padStart(2, '0')}. Combien de minutes dure-t-il ?`, unit: 'min', unitOptional: true, difficulty: 3, representation: 'concrete', expectedSeconds: 70,
        misconceptions: naive !== dur && naive > 0 ? [mc(naive, 'mc:base-100', 'notion', 'Les heures ont 60 minutes : on ne soustrait pas les horaires comme des nombres ordinaires.')] : [],
        hints: [`Va de ${h1} h ${String(m1).padStart(2, '0')} jusqu’à l’heure pile suivante, puis jusqu’à ${h2} h ${String(m2).padStart(2, '0')}.`], solution: `La durée est de ${dur} minutes (${Math.floor(dur / 60) ? `${Math.floor(dur / 60)} h ` : ''}${dur % 60} min).`,
      });
    }
    const h = ri(rand, 1, 3); const m = ri(rand, 1, 11) * 5;
    return numeric(h * 60 + m, {
      prompt: `Convertis : ${h} h ${m} min = … min`, unit: 'min', unitOptional: true, expectedSeconds: 40,
      misconceptions: [mc(h * 100 + m, 'mc:base-100', 'notion', 'Une heure dure 60 minutes, pas 100.')], hints: ['1 h = 60 min.'], solution: `${h} × 60 + ${m} = ${h * 60 + m} min.`,
    });
  },
});

/* ------------------------------ Fractions et décimaux ------------------------------ */

add({
  id: 'mp-fractions', label: 'Les fractions', skill: 'mp.fractions', levels: ['ce1', 'ce2', 'cm1', 'cm2'],
  description: 'La moitié, le tiers, le quart d’une quantité ; fractions égales ; fraction d’une quantité ; additions.',
  chapters: ['ce1-m-fractions-unitaires', 'ce1-m-fractions', 'ce2-m-fractions-egales', 'ce2-m-fractions-longueurs', 'cm1-m-fractions', 'cm1-m-fractions-calculs', 'cm2-m-fractions', 'cm2-m-fractions-calculs'],
  make(rand, lv, hard) {
    const i = at(lv);
    const NAMES_F = { 2: 'la moitié', 3: 'le tiers', 4: 'le quart', 5: 'le cinquième', 10: 'le dixième' };
    if (i === 1 && !hard) {
      const d = pick(rand, [2, 3, 4]); const q = ri(rand, 2, 9);
      return numeric(q, {
        prompt: `Quel est ${NAMES_F[d]} de ${d * q} ?`, expectedSeconds: 35,
        misconceptions: d !== 2 ? [mc(d * q / 2, 'mc:moitie', 'notion', `${NAMES_F[d]}, c’est partager en ${d} parts égales, pas en 2.`)] : [mc(d * q - 2, 'mc:soustraction', 'notion', 'La moitié, c’est partager en 2 parts égales.')],
        hints: [`Partage ${d * q} en ${d} parts égales.`], solution: `${d * q} ÷ ${d} = ${q}.`,
      });
    }
    if (i === 2 || (i === 1 && hard)) {
      const d = ri(rand, 2, 5); const n = ri(rand, 1, d - 1); const k = ri(rand, 2, 4);
      return numeric(n * k, {
        prompt: `Complète pour avoir deux fractions égales : ${n}/${d} = …/${d * k}`, difficulty: 3, expectedSeconds: 45,
        misconceptions: [mc(n + d * k - d, 'mc:fraction-egale-addition', 'notion', `On ne passe pas de ${d} à ${d * k} en ajoutant : on multiplie par ${k}, en haut comme en bas.`)],
        hints: [`Par combien a-t-on multiplié ${d} pour obtenir ${d * k} ?`, `Fais pareil avec ${n}.`], solution: `${d} × ${k} = ${d * k}, donc ${n} × ${k} = ${n * k} : ${n}/${d} = ${n * k}/${d * k}.`,
      });
    }
    if (i === 4 && (hard || rand() < 0.5)) {
      const d = ri(rand, 5, 12); const a = ri(rand, 1, d - 2); const b = ri(rand, 1, d - 1 - a);
      if (rand() < 0.5) {
        const k = ri(rand, 2, 4); const n = ri(rand, 1, d - 1);
        return numeric(k * n, { prompt: `Complète : ${k} × ${n}/${d} = …/${d}`, expectedSeconds: 40, misconceptions: [mc(n, 'mc:multiplier-numerateur', 'notion', `${k} × ${n}/${d}, c’est ${k} fois ${n}/${d} : on multiplie le numérateur par ${k}.`)], hints: [`${Array(k).fill(`${n}/${d}`).join(' + ')}.`], solution: `${k} × ${n}/${d} = ${k * n}/${d}.` });
      }
      return numeric(a + b, {
        prompt: `Complète : ${a}/${d} + ${b}/${d} = …/${d}`, expectedSeconds: 40,
        misconceptions: [mc(a * b, 'mc:produit', 'calcul', 'On ajoute les numérateurs.')], hints: [`Le dénominateur reste ${d} : ajoute seulement les numérateurs.`], solution: `${a}/${d} + ${b}/${d} = ${a + b}/${d}.`,
      });
    }
    // CM1 (et CM2) : fraction d'une quantité
    const d = pick(rand, [2, 3, 4, 5, 10]); const n = ri(rand, 2, d === 2 ? 3 : d - 1); const q = ri(rand, 2, hard ? 15 : 8);
    const total = d * q;
    return numeric(n * q, {
      prompt: `Combien font les ${n}/${d} de ${total} ?`, difficulty: 3, expectedSeconds: 55,
      misconceptions: [mc(q, 'mc:unite', 'notion', `${q} est 1/${d} de ${total} : il en faut ${n} fois plus.`)],
      hints: [`1/${d} de ${total} = ${total} ÷ ${d}.`, `Puis multiplie par ${n}.`], solution: `${total} ÷ ${d} = ${q} ; ${q} × ${n} = ${n * q}.`,
    });
  },
});

add({
  id: 'mp-decimaux', label: 'Les nombres décimaux', skill: 'mp.decimaux', levels: ['cm1', 'cm2'],
  description: 'Fractions décimales et écriture à virgule, rangs des chiffres, additions, × 10, 100, 1 000, arrondis.',
  chapters: ['cm1-m-fractions-decimales', 'cm1-m-decimaux', 'cm1-m-add-decimaux', 'cm1-m-multiplication', 'cm2-m-fractions-decimales', 'cm2-m-decimaux', 'cm2-m-calcul-decimaux', 'cm2-m-multiplication-division'],
  make(rand, lv, hard) {
    const kinds = ['fraction', 'rang', 'addition', 'arrondi', ...(at(lv) === 4 ? ['fois', 'fois'] : ['fois'])];
    const k = hard ? pick(rand, ['addition', 'fois', 'fraction']) : pick(rand, kinds);
    if (k === 'fraction') {
      const den = pick(rand, [10, 100, ...(at(lv) === 4 ? [1000] : [])]); const num = ri(rand, 3, den * (hard ? 5 : 1) - 1);
      const ans = clean(num / den);
      return numeric(ans, {
        prompt: `Écris avec une virgule : ${num}/${den}`, expectedSeconds: 35,
        misconceptions: [mc(clean(num / (den * 10)), 'mc:rang-decimal', 'notion', `/${den} : le dernier chiffre est au rang des ${den === 10 ? 'dixièmes' : den === 100 ? 'centièmes' : 'millièmes'}.`), mc(clean(num / (den / 10)), 'mc:rang-decimal', 'notion', `Compte les zéros de ${den} : autant de chiffres après la virgule.`)],
        hints: [`${den} a ${String(den).length - 1} zéro${den > 10 ? 's' : ''} : ${String(den).length - 1} chiffre${den > 10 ? 's' : ''} après la virgule.`], solution: `${num}/${den} = ${fr(ans)}.`,
      });
    }
    if (k === 'rang') {
      const n = clean(ri(rand, 1, 99) + ri(rand, 11, 99) / 100);
      const [i10, i100] = [Math.floor(clean(n * 10)) % 10, Math.round(clean(n * 100)) % 10];
      const askCent = rand() < 0.5;
      return numeric(askCent ? i100 : i10, {
        prompt: `Dans ${fr(n)}, quel est le chiffre des ${askCent ? 'centièmes' : 'dixièmes'} ?`, expectedSeconds: 30,
        misconceptions: [mc(askCent ? i10 : i100, 'mc:rang-decimal', 'notion', 'Juste après la virgule : les dixièmes ; puis les centièmes.')], hints: ['Le premier chiffre après la virgule est celui des dixièmes.'], solution: `${fr(n)} : ${i10} dixièmes et ${i100} centièmes.`,
      });
    }
    if (k === 'addition') {
      const a = clean(ri(rand, 11, 99) / 10); const b = clean(ri(rand, 101, 999) / 100);
      const ans = clean(a + b);
      const misaligned = clean((Math.round(a * 10) + Math.round(b * 100)) / 100);
      return numeric(ans, {
        prompt: `Calcule : ${fr(a)} + ${fr(b)}`, difficulty: 3, expectedSeconds: 60,
        misconceptions: misaligned !== ans ? [mc(misaligned, 'mc:virgules-non-alignees', 'calcul', 'Pose l’addition en alignant les virgules : dixièmes sous dixièmes.')] : [],
        hints: [`Écris ${fr(a)} avec deux chiffres après la virgule : ${fr(a)}0.`, 'Aligne les virgules, puis ajoute comme des entiers.'], solution: `${fr(a)} + ${fr(b)} = ${fr(ans)}.`,
      });
    }
    if (k === 'arrondi') {
      const n = clean(ri(rand, 10, 999) / 10);
      const ans = Math.round(n);
      return numeric(ans, {
        prompt: `Arrondis ${fr(n)} à l’unité la plus proche.`, expectedSeconds: 30,
        misconceptions: Math.floor(n) !== ans ? [mc(Math.floor(n), 'mc:troncature', 'notion', 'Arrondir n’est pas couper : si les dixièmes font 5 ou plus, on monte à l’unité suivante.')] : [mc(ans + 1, 'mc:arrondi', 'notion', 'Moins de 5 dixièmes : on garde l’unité.')],
        hints: [`${fr(n)} est entre ${Math.floor(n)} et ${Math.floor(n) + 1} : de quel nombre est-il le plus proche ?`], solution: `${fr(n)} ≈ ${ans}.`,
      });
    }
    const f = pick(rand, [10, 100, 1000]); const n = clean(ri(rand, 101, 999) / 100);
    const ans = clean(n * f);
    return numeric(ans, {
      prompt: `Calcule : ${fr(n)} × ${fr(f)}`, expectedSeconds: 30,
      misconceptions: [mc(n, 'mc:ajouter-zeros', 'notion', `Ajouter des zéros à droite d’un décimal ne change pas sa valeur : la virgule se déplace de ${String(f).length - 1} rang${f > 10 ? 's' : ''} vers la droite.`), mc(clean(n * f / 10), 'mc:rangs', 'notion', `× ${fr(f)} : chaque chiffre avance de ${String(f).length - 1} rangs.`)],
      hints: [`× ${fr(f)} : chaque chiffre devient ${fr(f)} fois plus grand.`], solution: `${fr(n)} × ${fr(f)} = ${fr(ans)}.`,
    });
  },
});

/* ------------------------------ Problèmes, algèbre, proportionnalité ------------------------------ */

add({
  id: 'mp-problemes', label: 'Problèmes', skill: 'mp.problemes', levels: PRIMARY_LEVELS, representation: 'concrete',
  description: 'Problèmes d’ajout, de retrait, de comparaison et de partage, en une ou plusieurs étapes.',
  chapters: ['cp-m-ajouter-retirer', 'cp-m-problemes-2-etapes', 'ce1-m-problemes-additifs', 'ce1-m-problemes-2-etapes', 'ce2-m-problemes-additifs', 'ce2-m-problemes-complexes', 'cm1-m-problemes', 'cm1-m-problemes-etapes', 'cm2-m-problemes', 'cm2-m-problemes-strategies'],
  make(rand, lv, hard) {
    const i = at(lv); const A = person(rand); let B = person(rand); while (B.n === A.n) B = person(rand);
    const scale = [1, 5, 20, 50, 100][i];
    const kinds = i === 0 ? ['ajout', 'retrait', 'comparaison'] : i === 1 ? ['ajout', 'comparaison', 'groupes', 'deux-etapes'] : ['comparaison', 'groupes', 'partage', 'deux-etapes', 'fois-plus'];
    const k = hard ? pick(rand, i === 0 ? ['deux-etapes', 'comparaison'] : ['deux-etapes', 'fois-plus', 'partage']) : pick(rand, kinds);
    const thing = pick(rand, ['billes', 'images', 'timbres', 'cartes']);
    if (k === 'ajout' || k === 'retrait') {
      const a = ri(rand, 5, 15) * scale; const b = ri(rand, 2, Math.min(9, a / scale - 1)) * scale;
      const ans = k === 'ajout' ? a + b : a - b;
      return numeric(ans, {
        prompt: k === 'ajout' ? `${A.n} a ${fr(a)} ${thing}. ${A.il[0].toUpperCase()}${A.il.slice(1)} en gagne ${fr(b)}. Combien en a-t-${A.il} maintenant ?` : `Il y a ${fr(a)} oiseaux sur un arbre. ${fr(b)} s’envolent. Combien en reste-t-il ?`,
        expectedSeconds: 45, misconceptions: [mc(k === 'ajout' ? a - b : a + b, 'mc:operation', 'notion', k === 'ajout' ? 'On en gagne : il y en a plus qu’au début.' : 'Des oiseaux partent : il en reste moins.')],
        hints: ['Y en a-t-il plus ou moins à la fin ?'], solution: `${fr(a)} ${k === 'ajout' ? '+' : '−'} ${fr(b)} = ${fr(ans)}.`,
      });
    }
    if (k === 'comparaison') {
      const a = ri(rand, 8, 19) * scale; const b = ri(rand, 2, 7) * scale; const less = rand() < 0.5;
      const ans = less ? a - b : a + b;
      return numeric(ans, {
        prompt: `${A.n} a ${fr(a)} ${thing}. ${B.n} en a ${fr(b)} de ${less ? 'moins' : 'plus'} que ${A.n}. Combien ${de(thing)} a ${B.n} ?`,
        expectedSeconds: 50, misconceptions: [mc(less ? a + b : a - b, 'mc:comparaison', 'notion', `« ${fr(b)} de ${less ? 'moins' : 'plus'} » : ${B.n} en a ${less ? 'moins' : 'plus'} que ${A.n}.`)],
        hints: [`${B.n} en a-t-${B.il} plus ou moins que ${A.n} ?`], solution: `${fr(a)} ${less ? '−' : '+'} ${fr(b)} = ${fr(ans)} ${thing}.`,
      });
    }
    if (k === 'groupes' || k === 'partage') {
      const n = ri(rand, 3, 9); const per = ri(rand, 3, i >= 3 ? 25 : 9);
      if (k === 'groupes') {
        return numeric(n * per, { prompt: `Une boîte contient ${per} œufs. Combien d’œufs y a-t-il dans ${n} boîtes ?`, expectedSeconds: 45, misconceptions: [mc(n + per, 'mc:addition-au-lieu-de-multiplication', 'notion', `${n} boîtes de ${per} : ${per} répété ${n} fois.`)], hints: [`${per} + ${per} + … (${n} fois), ou ${n} × ${per}.`], solution: `${n} × ${per} = ${n * per} œufs.` });
      }
      return numeric(per, { prompt: `${n * per} élèves se répartissent en ${n} équipes de même taille. Combien d’élèves y a-t-il dans chaque équipe ?`, expectedSeconds: 50, misconceptions: [mc(n * per - n, 'mc:soustraction', 'notion', 'Partager en parts égales, c’est diviser.')], hints: [`${n} × … = ${n * per}.`], solution: `${n * per} ÷ ${n} = ${per} élèves.` });
    }
    if (k === 'fois-plus') {
      const a = ri(rand, 4, 25) * Math.max(1, scale / 10); const f = ri(rand, 2, 5);
      return numeric(a * f, { prompt: `${A.n} a ${fr(a)} ${thing}. ${B.n} en a ${f} fois plus. Combien ${de(thing)} a ${B.n} ?`, difficulty: 3, expectedSeconds: 50, misconceptions: [mc(a + f, 'mc:fois-plus', 'notion', `« ${f} fois plus », c’est multiplier par ${f}.`)], hints: [`${f} fois plus : × ${f}.`], solution: `${fr(a)} × ${f} = ${fr(a * f)} ${thing}.` });
    }
    // deux étapes : un gain puis un don
    const a = ri(rand, 10, 30) * scale; const b = ri(rand, 2, 9) * scale; const c = ri(rand, 2, 9) * scale;
    const ans = a + b - c;
    return numeric(ans, {
      prompt: `${A.n} a ${fr(a)} ${thing}. Le matin, ${A.il} en gagne ${fr(b)}. L’après-midi, ${A.il} en donne ${fr(c)} à ${B.n}. Combien ${de(thing)} ${A.n} a-t-${A.il} le soir ?`,
      difficulty: 3, expectedSeconds: 75,
      misconceptions: [mc(a + b + c, 'mc:operation', 'notion', `L’après-midi, ${A.n} en donne : il faut retirer.`), mc(a - b - c, 'mc:operation', 'notion', 'Le matin, on gagne : il faut ajouter.')],
      hints: ['Première étape : combien après le matin ?', 'Deuxième étape : combien après l’après-midi ?'], solution: `${fr(a)} + ${fr(b)} = ${fr(a + b)}, puis ${fr(a + b)} − ${fr(c)} = ${fr(ans)}.`,
    });
  },
});

add({
  id: 'mp-algebre', label: 'Égalités à trous, suites, programmes de calcul', skill: 'mp.algebre', levels: ['ce2', 'cm1', 'cm2'],
  description: 'Trouver le nombre caché, continuer une suite, suivre (ou remonter) un programme de calcul.',
  chapters: ['cm1-m-algebre', 'cm2-m-algebre', 'ce2-m-problemes-complexes'],
  make(rand, lv, hard) {
    const k = hard ? pick(rand, ['remonter', 'suite']) : pick(rand, ['trou', 'suite', 'programme']);
    if (k === 'trou') {
      const a = ri(rand, 12, 89); const b = ri(rand, a + 5, a + 90);
      return numeric(b - a, { prompt: `Trouve le nombre caché : … + ${a} = ${b}`, expectedSeconds: 35, misconceptions: [mc(a + b, 'mc:trou-addition', 'notion', `Le nombre caché plus ${a} doit donner ${b} : il est plus petit que ${b}.`)], hints: [`${b} − ${a}.`], solution: `${b - a} + ${a} = ${b}.` });
    }
    if (k === 'suite') {
      const start = ri(rand, 1, 20); const step = ri(rand, 2, hard ? 15 : 9); const terms = Array.from({ length: 4 }, (_, j) => start + j * step);
      return numeric(start + 4 * step, { prompt: `Continue la suite : ${terms.join(', ')}, …`, expectedSeconds: 35, misconceptions: [mc(start + 4 * step + 1, 'mc:pas', 'calcul', `On ajoute toujours ${step}.`)], hints: ['De combien augmente-t-on à chaque fois ?'], solution: `On ajoute ${step} : ${terms[3]} + ${step} = ${start + 4 * step}.` });
    }
    const x = ri(rand, 2, 12); const m = ri(rand, 2, 5); const p = ri(rand, 1, 9);
    if (k === 'programme') return numeric(x * m + p, { prompt: `Programme de calcul : je choisis ${x}, je le multiplie par ${m}, puis j’ajoute ${p}. Quel nombre j’obtiens ?`, expectedSeconds: 45, misconceptions: [mc((x + p) * m, 'mc:ordre-programme', 'notion', 'Respecte l’ordre : d’abord × ' + m + ', ensuite + ' + p + '.')], hints: [`${x} × ${m} = …`], solution: `${x} × ${m} = ${x * m}, puis ${x * m} + ${p} = ${x * m + p}.` });
    const r = x * m + p;
    return numeric(x, { prompt: `Je choisis un nombre, je le multiplie par ${m}, puis j’ajoute ${p} : j’obtiens ${r}. Quel nombre avais-je choisi ?`, difficulty: 3, expectedSeconds: 75, misconceptions: [mc(r * m + p, 'mc:sens-programme', 'notion', 'On remonte le programme à l’envers : on retire ' + p + ', puis on divise par ' + m + '.')], hints: [`Avant d’ajouter ${p}, j’avais ${r} − ${p} = ${r - p}.`, `Puis ${r - p} ÷ ${m}.`], solution: `${r} − ${p} = ${r - p} ; ${r - p} ÷ ${m} = ${x}.` });
  },
});

add({
  id: 'mp-proportionnalite', label: 'La proportionnalité', skill: 'mp.proportionnalite', levels: ['cm1', 'cm2'], representation: 'concrete',
  description: 'Prix, recettes, quantités : passer par l’unité ou par un multiple.',
  chapters: ['cm1-m-proportionnalite', 'cm2-m-proportionnalite'],
  make(rand, lv, hard) {
    const unit = ri(rand, 2, 9); const n1 = ri(rand, 2, 6); let n2 = ri(rand, 3, hard ? 25 : 12); if (n2 === n1) n2 += 1;
    const thing = pick(rand, [['cahiers', '€'], ['stylos', '€'], ['croissants', '€']]);
    const p1 = unit * n1; const ans = unit * n2;
    return numeric(ans, {
      prompt: `${n1} ${thing[0]} coûtent ${p1} €. Combien coûtent ${n2} ${thing[0]} (tous au même prix) ?`, unit: '€', difficulty: hard ? 3 : 2, expectedSeconds: 60,
      misconceptions: [mc(p1 + (n2 - n1), 'mc:modele-additif', 'notion', 'Dans une situation de proportionnalité, on ne rajoute pas l’écart : on multiplie.')],
      hints: [`Combien coûte 1 ${thing[0].slice(0, -1)} ? ${p1} ÷ ${n1}.`, `Puis multiplie par ${n2}.`], solution: `1 ${thing[0].slice(0, -1)} coûte ${p1} ÷ ${n1} = ${unit} € ; ${n2} × ${unit} = ${ans} €.`,
    });
  },
});

add({
  id: 'mp-aires', label: 'Les aires', skill: 'mp.aires', levels: ['cm1', 'cm2'],
  description: 'L’aire d’un rectangle ou d’un carré en cm², les conversions m² et dm² en CM2.',
  chapters: ['cm1-m-aires', 'cm2-m-aires'],
  make(rand, lv, hard) {
    if (at(lv) === 4 && (hard || rand() < 0.3)) {
      const v = ri(rand, 2, 9);
      return numeric(v * 100, { prompt: `Convertis : ${v} m² = … dm²`, unit: 'dm²', unitOptional: true, difficulty: 3, expectedSeconds: 40, misconceptions: [mc(v * 10, 'mc:conversion-aire', 'notion', '1 m = 10 dm, mais 1 m² = 10 × 10 = 100 dm².')], hints: ['Un carré de 1 m de côté contient 10 × 10 carrés de 1 dm de côté.'], solution: `${v} × 100 = ${v * 100} dm².` });
    }
    const L = ri(rand, 3, hard ? 25 : 12); const l = rand() < 0.3 ? L : ri(rand, 2, L);
    return numeric(L * l, {
      prompt: L === l ? `Quelle est l’aire d’un carré de ${L} cm de côté ?` : `Quelle est l’aire d’un rectangle de ${L} cm sur ${l} cm ?`, unit: 'cm²', unitOptional: true, representation: 'visuelle', expectedSeconds: 45,
      misconceptions: [mc(2 * (L + l), 'mc:perimetre-aire', 'notion', 'Le tour, c’est le périmètre ; l’aire compte les carrés de 1 cm² à l’intérieur.'), mc(L + l, 'mc:somme', 'notion', 'L’aire d’un rectangle se calcule avec une multiplication : longueur × largeur.')],
      hints: [`Combien de rangées de ${L} carrés de 1 cm² ?`], solution: `${L} × ${l} = ${L * l} cm².`,
    });
  },
});

/* ------------------------------ Géométrie ------------------------------ */

const SOLIDS = [
  { name: 'un cube', faces: 6, aretes: 12, sommets: 8, from: 0 },
  { name: 'un pavé droit', faces: 6, aretes: 12, sommets: 8, from: 1 },
  { name: 'une pyramide à base carrée', faces: 5, aretes: 8, sommets: 5, from: 1 },
  { name: 'un prisme à base triangulaire', faces: 5, aretes: 9, sommets: 6, from: 3 },
];
add({
  id: 'mp-solides', label: 'Les solides', skill: 'mp.solides', levels: PRIMARY_LEVELS, facts: true,
  description: 'Faces, arêtes et sommets du cube, du pavé, de la pyramide et du prisme ; le patron du cube.',
  chapters: ['cp-m-solides', 'ce1-m-solides', 'ce2-m-solides', 'cm1-m-solides-espace', 'cm2-m-solides-espace'],
  make(rand, lv, hard) {
    const i = at(lv);
    if (i === 0 || rand() < 0.2) {
      // CP : reconnaître les solides et leurs faces planes
      const cp = [['un cylindre', 2], ['un cône', 1], ['une boule', 0], ['un cube', 6], ['un pavé', 6]];
      const [nm, f] = pick(rand, cp);
      if (i === 0 || nm !== 'un cube') return numeric(f, { prompt: `Combien de faces planes (plates) a ${nm} ?`, representation: 'visuelle', expectedSeconds: 30, hints: ['Une face plane est une partie toute plate : on peut poser le solide dessus sans qu’il roule.'], solution: `${nm[0].toUpperCase()}${nm.slice(1)} a ${f} face${f > 1 ? 's' : ''} plane${f > 1 ? 's' : ''}.` });
    }
    if (i >= 2 && rand() < 0.25) return numeric(6, { prompt: 'Un patron de cube est formé de combien de carrés ?', expectedSeconds: 25, misconceptions: [mc(4, 'mc:faces-cachees', 'notion', 'Le cube a 6 faces, toutes présentes dans le patron.')], hints: ['Chaque face du cube est un carré du patron.'], solution: 'Le cube a 6 faces : son patron a 6 carrés.' });
    const s = pick(rand, SOLIDS.filter((x) => x.from <= i));
    const what = i === 0 ? 'faces' : pick(rand, hard ? ['aretes', 'sommets'] : ['faces', 'aretes', 'sommets']);
    const label = { faces: 'faces', aretes: 'arêtes', sommets: 'sommets' }[what];
    const hidden = { faces: Math.ceil(s.faces / 2), aretes: s.aretes - 3, sommets: s.sommets - 1 }[what];
    return numeric(s[what], {
      prompt: `Combien de ${label} a ${s.name} ?`,
      representation: 'visuelle', difficulty: hard ? 3 : 2, expectedSeconds: 35,
      misconceptions: hidden !== s[what] ? [mc(hidden, 'mc:faces-cachees', 'notion', 'N’oublie pas ce qu’on ne voit pas : derrière et dessous.')] : [],
      hints: [{ faces: 'Une face est une surface plate.', aretes: 'Une arête est un bord, là où deux faces se touchent.', sommets: 'Un sommet est un « coin », là où des arêtes se rejoignent.' }[what], 'Compte aussi ce qui est caché derrière et dessous.'],
      solution: `${s.name[0].toUpperCase()}${s.name.slice(1)} a ${s.faces} faces, ${s.aretes} arêtes et ${s.sommets} sommets.`,
    });
  },
});

add({
  id: 'mp-figures', label: 'Figures planes, angles et symétrie', skill: 'mp.figures', levels: PRIMARY_LEVELS, facts: true,
  description: 'Côtés et angles droits des figures, l’angle droit et le tour complet, les axes de symétrie.',
  chapters: ['cp-m-figures', 'ce1-m-figures', 'ce2-m-figures', 'ce2-m-symetrie', 'cm1-m-figures', 'cm1-m-angles', 'cm1-m-perpendiculaires', 'cm1-m-symetrie', 'cm2-m-geometrie', 'cm2-m-angles', 'cm2-m-constructions', 'cm2-m-symetrie'],
  make(rand, lv, hard) {
    const i = at(lv);
    const pool = [
      { q: 'Combien de côtés a un triangle ?', a: 3, from: 0, hint: 'Compte les traits droits qui forment le tour.' },
      { q: 'Combien de côtés a un carré ?', a: 4, from: 0, hint: 'Compte les côtés un par un.' },
      { q: 'Combien de sommets (de coins) a un triangle ?', a: 3, from: 0, hint: 'Un sommet est un coin de la figure.' },
      { q: 'Combien de côtés a un rectangle ?', a: 4, from: 0, hint: 'Compte les côtés un par un.' },
      { q: 'Combien de sommets (de coins) a un carré ?', a: 4, from: 0, hint: 'Un sommet est un coin de la figure.' },
      { q: 'Combien de côtés a un losange ?', a: 4, from: 2, hint: 'Un losange a tous ses côtés de la même longueur.' },
      { q: 'Combien de côtés a un hexagone ?', a: 6, from: 2, hint: '« hexa » veut dire six.' },
      { q: 'Combien de côtés a un pentagone ?', a: 5, from: 2, hint: '« penta » veut dire cinq.' },
      { q: 'Combien d’angles droits a un rectangle ?', a: 4, from: 1, hint: 'Vérifie chaque coin avec l’équerre.' },
      { q: 'Combien d’angles droits a un triangle rectangle ?', a: 1, from: 1, hint: 'Son nom le dit : il a un angle droit.' },
      { q: 'Combien d’axes de symétrie a un carré ?', a: 4, from: 2, hint: 'Pense aux pliages : par le milieu des côtés, et par les diagonales.' },
      { q: 'Combien d’axes de symétrie a un rectangle (qui n’est pas un carré) ?', a: 2, from: 2, hint: 'Ses diagonales ne sont pas des axes : essaie de plier.' },
      { q: 'Combien d’axes de symétrie a un triangle équilatéral ?', a: 3, from: 3, hint: 'Un axe passe par chaque sommet.' },
      { q: 'Combien mesure un angle droit, en degrés ?', a: 90, from: 3, unit: '°', hint: 'Un tour complet fait 360°, un angle droit en est le quart.' },
      { q: 'Combien d’angles droits faut-il pour faire un tour complet ?', a: 4, from: 3, hint: 'Tourne d’un quart de tour, quatre fois.' },
      { q: 'Deux droites perpendiculaires forment combien d’angles droits ?', a: 4, from: 3, hint: 'Regarde les quatre angles autour du point où elles se coupent.' },
      { q: 'Combien de diagonales a un carré ?', a: 2, from: 1, hint: 'Une diagonale relie deux sommets opposés.' },
    ];
    const items = pool.filter((x) => x.from <= i && (!hard || x.from >= Math.max(0, i - 1)));
    const it = pick(rand, items.length ? items : pool.filter((x) => x.from <= i));
    return numeric(it.a, {
      prompt: it.q, ...(it.unit ? { unit: it.unit, unitOptional: true } : {}), representation: 'visuelle', expectedSeconds: 30,
      misconceptions: it.a === 4 && /symétrie/.test(it.q) ? [mc(2, 'mc:axes-diagonales', 'notion', 'Les diagonales du carré sont aussi des axes de symétrie.')] : it.a === 2 && /rectangle/.test(it.q) ? [mc(4, 'mc:axes-diagonales', 'notion', 'Plie un rectangle selon sa diagonale : les deux moitiés ne se superposent pas.')] : [],
      hints: [it.hint], solution: `Réponse : ${it.a}${it.unit || ''}.`,
    });
  },
});

/* ------------------------------ Données et hasard ------------------------------ */

add({
  id: 'mp-donnees', label: 'Lire un diagramme', skill: 'mp.donnees', levels: PRIMARY_LEVELS, representation: 'visuelle',
  description: 'Lire une barre, comparer deux barres, faire le total d’un diagramme.',
  chapters: ['cp-m-donnees', 'ce1-m-donnees', 'ce2-m-donnees', 'cm1-m-donnees', 'cm2-m-donnees'],
  make(rand, lv, hard) {
    const i = at(lv);
    const sets = [['pomme', 'banane', 'fraise', 'cerise'], ['chat', 'chien', 'lapin', 'poisson'], ['football', 'danse', 'natation', 'judo']];
    const labels = pick(rand, sets).slice(0, i === 0 ? 3 : 4);
    const unit = [1, 1, 5, 10, 25][i];
    const values = labels.map(() => ri(rand, 1, i === 0 ? 9 : 12) * unit);
    const data = labels.map((label, k) => ({ label, value: values[k] }));
    const topic = labels[0] === 'pomme' ? 'fruit préféré' : labels[0] === 'chat' ? 'animal préféré' : 'sport préféré';
    const figure = { alt: `Diagramme en barres : ${data.map((d) => `${d.label} ${d.value}`).join(', ')}.`, items: [{ type: 'bars', data, unit: 'élèves' }] };
    const k = hard ? pick(rand, ['ecart', 'total']) : pick(rand, i === 0 ? ['lire', 'lire', 'total'] : ['lire', 'ecart', 'total']);
    if (k === 'lire') {
      const j = ri(rand, 0, labels.length - 1);
      return numeric(values[j], { prompt: `Des élèves ont choisi leur ${topic}. Combien d’élèves ont choisi « ${labels[j]} » ?`, figure, expectedSeconds: 30, hints: ['Suis le haut de la barre jusqu’à l’axe des nombres.'], solution: `La barre « ${labels[j]} » monte jusqu’à ${values[j]}.` });
    }
    if (k === 'ecart') {
      let a = ri(rand, 0, labels.length - 1); let b = ri(rand, 0, labels.length - 1);
      while (b === a || values[a] === values[b]) { b = (b + 1) % labels.length; if (b === a) b = (b + 1) % labels.length; if (values[a] === values[b]) values[b] += unit; }
      if (values[a] < values[b]) [a, b] = [b, a];
      data[b].value = values[b];
      return numeric(values[a] - values[b], { prompt: `Des élèves ont choisi leur ${topic}. Combien d’élèves de plus ont choisi « ${labels[a]} » plutôt que « ${labels[b]} » ?`, figure: { ...figure, alt: `Diagramme en barres : ${data.map((d) => `${d.label} ${d.value}`).join(', ')}.` }, difficulty: 3, expectedSeconds: 50, misconceptions: [mc(values[a] + values[b], 'mc:addition', 'notion', 'On cherche l’écart entre les deux barres.')], hints: ['Lis les deux barres, puis calcule la différence.'], solution: `${values[a]} − ${values[b]} = ${values[a] - values[b]}.` });
    }
    const total = values.reduce((s, v) => s + v, 0);
    return numeric(total, { prompt: `Des élèves ont choisi leur ${topic}. Combien d’élèves ont répondu en tout ?`, figure, expectedSeconds: 50, misconceptions: [mc(labels.length, 'mc:compter-barres', 'notion', 'On ne compte pas les barres : on ajoute leurs valeurs.')], hints: ['Lis chaque barre, puis ajoute.'], solution: `${values.join(' + ')} = ${total}.` });
  },
});

add({
  id: 'mp-probabilites', label: 'Le hasard', skill: 'mp.probabilites', levels: ['cm1', 'cm2'],
  description: 'Possible, certain ou impossible ; « a chances sur b » avec des billes ou un dé.',
  chapters: ['cm1-m-probabilites', 'cm2-m-probabilites'],
  make(rand, lv, hard) {
    if (at(lv) === 3 && !hard && rand() < 0.5) {
      const cases = [
        ['On lance un dé à 6 faces numérotées de 1 à 6. Obtenir 7, est-ce possible, certain ou impossible ?', 'impossible'],
        ['On lance un dé à 6 faces numérotées de 1 à 6. Obtenir un nombre plus petit que 7, est-ce possible, certain ou impossible ?', 'certain'],
        ['On lance un dé à 6 faces numérotées de 1 à 6. Obtenir 4, est-ce possible, certain ou impossible ?', 'possible'],
        ['Un sac ne contient que des billes rouges. Tirer une bille rouge, est-ce possible, certain ou impossible ?', 'certain'],
        ['Un sac ne contient que des billes rouges. Tirer une bille verte, est-ce possible, certain ou impossible ?', 'impossible'],
      ];
      const [q, a] = pick(rand, cases);
      return text([a, a === 'certain' ? 'c’est certain' : a === 'impossible' ? 'c’est impossible' : 'c’est possible'], { prompt: q, expectedSeconds: 30, hints: ['Certain : ça arrive à chaque fois. Impossible : ça n’arrive jamais. Possible : ça peut arriver ou non.'], solution: `C’est ${a}.` });
    }
    const r = ri(rand, 1, 7); const b = ri(rand, 1, 7); const askRed = rand() < 0.5;
    const ans = askRed ? r : b;
    return numeric(ans, {
      prompt: `Un sac contient ${r} bille${r > 1 ? 's' : ''} rouge${r > 1 ? 's' : ''} et ${b} bille${b > 1 ? 's' : ''} bleue${b > 1 ? 's' : ''}. On tire une bille au hasard. Combien a-t-on de chances sur ${r + b} de tirer une bille ${askRed ? 'rouge' : 'bleue'} ?`, difficulty: hard ? 3 : 2, expectedSeconds: 45,
      misconceptions: [mc(askRed ? b : r, 'mc:autre-couleur', 'notion', `Compte les billes ${askRed ? 'rouges' : 'bleues'}.`)], hints: [`Il y a ${r + b} billes en tout : combien sont ${askRed ? 'rouges' : 'bleues'} ?`], solution: `${ans} chance${ans > 1 ? 's' : ''} sur ${r + b}.`,
    });
  },
});

export const PRIMAIRE_MATHS = GEN;

/** Libellés des notions (compétences) de ces générateurs, rédigés comme des compétences. */
const SKILL_LABELS = {
  'mp.numeration': 'Comprendre l’écriture des nombres : unités, dizaines, centaines, milliers…',
  'mp.comparer': 'Comparer, ranger et encadrer des nombres (entiers, puis décimaux)',
  'mp.addition': 'Connaître les tables d’addition, doubles et compléments ; additionner',
  'mp.soustraction': 'Soustraire, avec ou sans retenue',
  'mp.calcul-mental': 'Calculer mentalement avec des procédures (+ 9, × 10, × 100, doubles…)',
  'mp.tables-multiplication': 'Connaître les tables de multiplication et le sens de la multiplication',
  'mp.multiplication-posee': 'Poser et effectuer une multiplication',
  'mp.division': 'Partager, diviser : quotient et reste, division décimale',
  'mp.multiples-diviseurs': 'Reconnaître multiples et diviseurs ; multiple commun',
  'mp.monnaie': 'Calculer avec la monnaie : euros et centimes, rendre la monnaie',
  'mp.longueurs': 'Mesurer et convertir des longueurs (mm, cm, dm, m, km)',
  'mp.perimetre': 'Calculer le périmètre d’un carré, d’un rectangle',
  'mp.masses-contenances': 'Mesurer et convertir des masses et des contenances',
  'mp.durees': 'Lire l’heure, convertir et calculer des durées',
  'mp.fractions': 'Utiliser les fractions : partager, fractions égales, fraction d’une quantité',
  'mp.decimaux': 'Utiliser les nombres décimaux : écriture, rangs, calculs, arrondis',
  'mp.problemes': 'Résoudre des problèmes en une ou plusieurs étapes',
  'mp.algebre': 'Égalités à trous, suites et programmes de calcul',
  'mp.proportionnalite': 'Résoudre des problèmes de proportionnalité',
  'mp.aires': 'Calculer l’aire d’un carré, d’un rectangle ; convertir m² et dm²',
  'mp.solides': 'Reconnaître les solides : faces, arêtes, sommets, patrons',
  'mp.figures': 'Reconnaître les figures planes, les angles droits et les axes de symétrie',
  'mp.donnees': 'Lire et exploiter un tableau ou un diagramme en barres',
  'mp.probabilites': 'Exprimer des chances : possible, certain, impossible, « a chances sur b »',
};

/** Notions (compétences) de ces générateurs, pour le graphe des compétences et la carte. */
export const PRIMAIRE_SKILLS = GEN.map((g) => ({ subject: 'maths', id: g.skill, label: SKILL_LABELS[g.skill] || g.label, level: g.levels[0], track: 'classe', status: 'programme', domain: 'primaire', prereqs: [], editorialLevel: true }));
