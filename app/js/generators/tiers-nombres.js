/**
 * Niveaux ◆ approfondissement et ✦ expert des générateurs : relatifs et priorités opératoires.
 * Chaque fonction reçoit (rand, options) et renvoie un exercice comme `make` (numeric, expression, steps).
 */
import { ri, nz, pick, sample, clean, fr, par, lcm, frac, fracStr, mc, numeric } from './gen-util.js';
import { near, distinct, fdistinct, fadd, fsub, fmul, fdiv, fm, fp, numFor, isNice, decimals, VERB, signHint, fracResult, formTxt, steps, negWord, readFrac } from './tiers-nombres-outils.js';

export const TIERS_NOMBRES = {
  'm-relatifs-somme': {
    /** ◆ Une suite de 4 termes, ou des parenthèses à calculer d'abord ; entiers ou décimaux selon l'option. */
    approfondissement(rand, o) {
      const dec = (o.nombres || (rand() < 0.35 ? 'decimaux' : 'entiers')) === 'decimaux';
      const draw = () => (dec ? nz(rand, -99, 99) / 10 : nz(rand, -20, 20));
      if (o.op !== 'addition' && rand() < 0.35) {
        // a − (b − c) ± d : la parenthèse d'abord ; piège : enlever la parenthèse sans changer les signes
        let a; let b; let c; let d; let plus; let ans; let wrong;
        do {
          a = draw(); b = draw(); c = draw(); d = draw(); plus = o.op === 'soustraction' ? false : rand() < 0.5;
          ans = clean(a - (b - c) + (plus ? d : -d)); wrong = clean(a - b - c + (plus ? d : -d));
        } while (!ans || !distinct(ans, [wrong, -ans]));
        const expr = `${fr(a)} − (${fr(b)} − ${par(c)}) ${plus ? '+' : '−'} ${par(d)}`;
        return numeric(ans, {
          prompt: `${pick(rand, VERB)} : $${expr}$`, expectedSeconds: 100,
          misconceptions: [mc(wrong, 'mc:moins-devant-parenthese', 'signe', `Un « − » devant une parenthèse change le signe de chaque terme qu’elle contient : − (${fr(b)} − ${par(c)}) = − ${par(b)} + ${par(c)}. Le plus sûr : calculer d’abord la parenthèse.`),
            mc(-ans, 'mc:signe-somme', 'signe', 'Le calcul des distances est juste, mais pas le signe du résultat.')],
          hints: ['Commence par le calcul entre parenthèses.', `$${fr(b)} − ${par(c)} = ${fr(clean(b - c))}$`, 'Transforme ensuite chaque soustraction en addition de l’opposé.'],
          solution: `$${expr} = ${fr(a)} − ${par(clean(b - c))} ${plus ? '+' : '−'} ${par(d)} = ${fr(ans)}$`,
        });
      }
      let terms; let ops; let signed; let ans; let forgot; let dist;
      do {
        terms = [draw(), draw(), draw(), draw()];
        if (o.op === 'addition') ops = ['+', '+', '+'];
        else if (o.op === 'soustraction') ops = ['-', '-', '-'];
        else { ops = [pick(rand, ['+', '-']), pick(rand, ['+', '-']), pick(rand, ['+', '-'])]; if (!ops.includes('-')) ops[ri(rand, 0, 2)] = '-'; if (!ops.includes('+')) ops[ri(rand, 0, 2)] = '+'; }
        signed = terms.map((t, i) => (i === 0 ? t : ops[i - 1] === '+' ? t : -t));
        ans = clean(signed.reduce((s, t) => s + t, 0));
        // « − (−12) » lu comme « − 12 » : l'opposé est oublié pour les termes négatifs soustraits
        forgot = clean(terms.reduce((s, t, i) => (i === 0 ? t : ops[i - 1] === '+' ? s + t : t < 0 ? s + t : s - t), 0));
        dist = clean(Math.sign(ans) * signed.reduce((s, t) => s + Math.abs(t), 0));
      } while (!ans || signed.filter((t) => t < 0).length < 2 || (ops.includes('-') && near(forgot, ans)) || !distinct(ans, [-ans, dist, ...(ops.includes('-') ? [forgot] : [])]));
      const expr = terms.map((t, i) => (i === 0 ? fr(t) : `${ops[i - 1] === '+' ? '+' : '−'} ${par(t)}`)).join(' ');
      const rewritten = signed.map((t, i) => (i === 0 ? fr(t) : `+ ${par(t)}`)).join(' ');
      const mcs = [mc(-ans, 'mc:signe-somme', 'signe', 'Le calcul des distances est juste, mais pas le signe du résultat.'),
        mc(dist, 'mc:distances-ajoutees', 'notion', 'Les termes n’ont pas tous le même signe : on ajoute les positifs, on ajoute les négatifs, puis on soustrait les deux distances.')];
      if (ops.includes('-')) mcs.unshift(mc(forgot, 'mc:soustraire-opposé', 'notion', 'Soustraire un nombre négatif, c’est ajouter son opposé : « − (−7) » devient « + 7 ».'));
      return numeric(ans, {
        prompt: `${pick(rand, VERB)} : $${expr}$`, expectedSeconds: 90, misconceptions: mcs,
        hints: [ops.includes('-') ? 'Transforme d’abord chaque soustraction en addition de l’opposé.' : 'Regroupe les termes positifs d’un côté, les négatifs de l’autre.', ops.includes('-') ? `Tu obtiens : ${rewritten}.` : `Somme des positifs : ${fr(clean(signed.filter((t) => t > 0).reduce((s, t) => s + t, 0)))} ; somme des négatifs : ${fr(clean(signed.filter((t) => t < 0).reduce((s, t) => s + t, 0)))}.`, 'Le résultat prend le signe de la somme la plus éloignée de zéro.'],
        solution: `$${expr} = ${rewritten} = ${fr(ans)}$`,
      });
    },
    /** ✦ Le terme manquant : il faut raisonner à l'envers (l'opération réciproque), parfois à travers une parenthèse. */
    expert(rand, o) {
      const dec = (o.nombres || (rand() < 0.3 ? 'decimaux' : 'entiers')) === 'decimaux';
      const draw = () => (dec ? nz(rand, -99, 99) / 10 : nz(rand, -30, 30));
      // l'option est respectée : additions seules (5, 6), soustractions seules (1, 2, 4), ou les deux mêlées (1 à 4)
      const kind = o.op === 'addition' ? pick(rand, [5, 6]) : o.op === 'soustraction' ? pick(rand, [1, 2, 4]) : ri(rand, 1, 4);
      let a; let b; let c;
      if (kind === 5) {
        // a + ? = c  →  ? = c − a
        let ans;
        do { a = draw(); c = draw(); ans = clean(c - a); } while (!distinct(ans, [clean(c + a), clean(a - c)]));
        return numeric(ans, {
          prompt: `Trouve le nombre manquant : $${fr(a)} + ? = ${fr(c)}$`, expectedSeconds: 90,
          misconceptions: [mc(clean(c + a), 'mc:operation-reciproque', 'raisonnement', `Pour retrouver le terme manquant, on retire le terme connu au résultat : ${fr(c)} − ${par(a)}, on n’ajoute pas.`), mc(clean(a - c), 'mc:ordre-soustraction', 'signe', `Le nombre cherché vaut ${fr(c)} − ${par(a)}, pas ${fr(a)} − ${par(c)} : vérifie en remplaçant.`)],
          hints: ['Quel nombre faut-il ajouter au premier terme pour obtenir le résultat ?', `Le nombre cherché vaut ${fr(c)} − ${par(a)}.`],
          solution: `? = ${fr(c)} − ${par(a)} = ${fr(ans)}. Vérification : $${fr(a)} + ${par(ans)} = ${fr(c)}$.`,
        });
      }
      if (kind === 6) {
        // a + ? + b = c  →  ? = c − (a + b)
        let ans;
        do { a = draw(); b = draw(); c = draw(); ans = clean(c - a - b); } while (!distinct(ans, [clean(c - a + b), clean(a + b - c)]));
        const ab = clean(a + b);
        return numeric(ans, {
          prompt: `Trouve le nombre manquant : $${fr(a)} + ? + ${par(b)} = ${fr(c)}$`, expectedSeconds: 120,
          misconceptions: [mc(clean(c - a + b), 'mc:operation-reciproque', 'raisonnement', `On a ajouté ${par(b)} : pour revenir en arrière, il faut le retirer, pas l’ajouter une seconde fois.`), mc(clean(a + b - c), 'mc:ordre-soustraction', 'signe', `Le nombre cherché vaut ${fr(c)} − ${par(ab)}, pas ${fr(ab)} − ${par(c)} : vérifie en remplaçant.`)],
          hints: [`Regroupe d’abord les nombres connus : ${fr(a)} + ${par(b)} = ${fr(ab)}.`, `Il reste ${fr(ab)} + ? = ${fr(c)}.`],
          solution: `$${fr(a)} + ${par(b)} = ${fr(ab)}$, donc ? = ${fr(c)} − ${par(ab)} = ${fr(ans)}. Vérification : $${fr(a)} + ${par(ans)} + ${par(b)} = ${fr(c)}$.`,
        });
      }
      if (kind === 1) {
        // a − ? = c  →  ? = a − c
        do { a = draw(); c = draw(); } while (near(a, c));
        const ans = clean(a - c);
        return numeric(ans, {
          prompt: `Trouve le nombre manquant : $${fr(a)} − ? = ${fr(c)}$`, expectedSeconds: 90,
          misconceptions: [mc(clean(c - a), 'mc:ordre-soustraction', 'signe', `Vérifie : ${fr(a)} − (ton nombre) doit donner ${fr(c)}. Le nombre cherché est ${fr(a)} − ${par(c)}.`), mc(clean(a + c), 'mc:operation-reciproque', 'raisonnement', 'Pour retrouver le nombre soustrait, on calcule (premier terme) − (résultat), pas leur somme.')],
          hints: ['Teste ta réponse en la remplaçant dans l’égalité.', `Le nombre cherché vaut ${fr(a)} − ${par(c)}.`],
          solution: `? = ${fr(a)} − ${par(c)} = ${fr(ans)}. Vérification : $${fr(a)} − ${par(ans)} = ${fr(c)}$.`,
        });
      }
      if (kind === 2) {
        // ? − b = c  →  ? = c + b
        b = draw(); c = draw();
        const ans = clean(c + b);
        return numeric(ans, {
          prompt: `Trouve le nombre manquant : $? − ${par(b)} = ${fr(c)}$`, expectedSeconds: 90,
          misconceptions: [mc(clean(c - b), 'mc:operation-reciproque', 'raisonnement', `On a retiré ${par(b)} au nombre cherché : pour le retrouver, on rajoute ${par(b)} au résultat.`)],
          hints: [`Le nombre cherché moins ${par(b)} donne ${fr(c)} : que faut-il faire pour revenir en arrière ?`, `? = ${fr(c)} + ${par(b)}.`],
          solution: `? = ${fr(c)} + ${par(b)} = ${fr(ans)}. Vérification : $${par(ans)} − ${par(b)} = ${fr(c)}$.`,
        });
      }
      if (kind === 3) {
        // a + ? − b = c  →  ? = c − a + b
        let ans;
        do { a = draw(); b = draw(); c = draw(); ans = clean(c - a + b); } while (!distinct(ans, [clean(c - a - b), clean(a + b + c)]));
        return numeric(ans, {
          prompt: `Trouve le nombre manquant : $${fr(a)} + ? − ${par(b)} = ${fr(c)}$`, expectedSeconds: 120,
          misconceptions: [mc(clean(c - a - b), 'mc:soustraire-opposé', 'notion', `Retirer ${par(b)} puis vouloir revenir en arrière : il faut rajouter ${par(b)}, pas l’enlever une seconde fois.`), mc(clean(a + b + c), 'mc:operation-reciproque', 'raisonnement', 'Isole le nombre cherché étape par étape : enlève d’abord le premier terme, puis compense la soustraction.')],
          hints: [`Simplifie d’abord : ${fr(a)} − ${par(b)} = ${fr(clean(a - b))}.`, `Il reste ${fr(clean(a - b))} + ? = ${fr(c)}.`],
          solution: `$${fr(a)} − ${par(b)} = ${fr(clean(a - b))}$, donc ? = ${fr(c)} − ${par(clean(a - b))} = ${fr(ans)}.`,
        });
      }
      // a − (? − b) = c  →  ? − b = a − c  →  ? = a − c + b
      let ans; let wrongPar; let wrongSign;
      do { a = draw(); b = draw(); c = draw(); ans = clean(a - c + b); wrongPar = clean(a - b - c); wrongSign = clean(c - a + b); } while (!distinct(ans, [wrongPar, wrongSign]));
      return numeric(ans, {
        prompt: `Trouve le nombre manquant : $${fr(a)} − (? − ${par(b)}) = ${fr(c)}$`, expectedSeconds: 150,
        misconceptions: [mc(wrongPar, 'mc:moins-devant-parenthese', 'signe', `La parenthèse compte : ${fr(a)} − (? − ${par(b)}) n’est pas ${fr(a)} − ? − ${par(b)}. Cherche d’abord la valeur de toute la parenthèse.`),
          mc(wrongSign, 'mc:ordre-soustraction', 'raisonnement', `La parenthèse vaut ${fr(a)} − ${par(c)}, pas ${fr(c)} − ${par(a)} : vérifie en remplaçant.`)],
        hints: ['Cherche d’abord la valeur de toute la parenthèse.', `${fr(a)} − (parenthèse) = ${fr(c)}, donc la parenthèse vaut ${fr(a)} − ${par(c)} = ${fr(clean(a - c))}.`, `Il reste ? − ${par(b)} = ${fr(clean(a - c))}.`],
        solution: `La parenthèse vaut ${fr(a)} − ${par(c)} = ${fr(clean(a - c))} ; donc ? = ${fr(clean(a - c))} + ${par(b)} = ${fr(ans)}. Vérification : $${fr(a)} − (${fr(ans)} − ${par(b)}) = ${fr(c)}$.`,
      });
    },
  },

  'm-relatifs-produit': {
    /** ◆ Longs produits avec décimaux, quotients de produits, décimaux, enchaînements × ÷, facteur manquant. */
    approfondissement(rand, o) {
      const kinds = o.op === 'multiplication' ? ['long', 'long', 'manquant'] : o.op === 'division' ? ['bar', 'decimal', 'manquant-div'] : ['chaine', 'chaine', 'long', 'bar', 'decimal', 'manquant', 'manquant-div'];
      return RP_APPRO[pick(rand, kinds)](rand);
    },
    /** ✦ Facteur manquant dans un produit, énigme produit/somme, quotient avec priorités, quotient égal à un produit. */
    expert(rand, o) {
      const kinds = o.op === 'multiplication' ? ['manquant3', 'enigme'] : o.op === 'division' ? ['barre', 'egalite'] : ['manquant3', 'enigme', 'barre', 'egalite'];
      return RP_EXPERT[pick(rand, kinds)](rand);
    },
  },

  'm-priorites': {
    /** ◆ 3 ou 4 opérations, parenthèses imbriquées, décimaux, trait de fraction, nombre manquant. */
    approfondissement(rand, o) {
      const etapes = (o.reponse || (rand() < 0.4 ? 'etapes' : 'resultat')) === 'etapes';
      const kind = pick(rand, etapes ? ['p1', 'p2', 'p3', 'p4'] : ['p1', 'p2', 'p3', 'p4', 'manquant']);
      if (kind === 'manquant') return PRIO_MANQUANT(rand);
      return prioExercise(PRIO_APPRO[kind](rand), etapes, rand, 120);
    },
    /** ✦ Fractions et priorités, carré dans un calcul, nombre manquant à retrouver en défaisant les opérations. */
    expert(rand, o) {
      const etapes = (o.reponse || (rand() < 0.4 ? 'etapes' : 'resultat')) === 'etapes';
      const kind = pick(rand, etapes ? ['frac', 'carre'] : ['frac', 'carre', 'manquant']);
      if (kind === 'manquant') return PRIO_EXPERT_MANQUANT(rand);
      const t = PRIO_EXPERT[kind](rand);
      return prioExercise(t, etapes, rand, kind === 'frac' ? 210 : 150, t.skills ? { skills: t.skills } : {});
    },
  },

};


/* --------------------------- relatifs : produits -------------------------- */

const DECS = [0.5, 0.25, 0.2, 2.5, 1.5, 0.4, 1.2, 0.3, 0.6, 0.8];

const RP_APPRO = {
  long(rand) {
    let f; let ans;
    do {
      f = sample(rand, [pick(rand, DECS), pick(rand, DECS), ri(rand, 2, 8), ri(rand, 2, 9)]).map((x) => (rand() < 0.55 ? -x : x));
      ans = clean(f.reduce((p, x) => p * x, 1));
    } while (f.filter((x) => x < 0).length < 2 || !isNice(ans, 3) || Math.abs(ans) < 0.1);
    const negs = f.filter((x) => x < 0).length;
    const expr = f.map((x, i) => (i === 0 ? fr(x) : par(x))).join(' × ');
    return numeric(ans, {
      prompt: `${pick(rand, VERB)} : $${expr}$`, expectedSeconds: 100,
      misconceptions: [mc(-ans, 'mc:regle-signes', 'signe', `Il y a ${negWord(negs)} : un nombre ${negs % 2 ? 'impair' : 'pair'} de facteurs négatifs donne un produit ${negs % 2 ? 'négatif' : 'positif'}.`),
        mc(clean(ans * 10), 'mc:virgule-produit', 'calcul', 'Dans un produit de décimaux, le résultat a autant de chiffres après la virgule que tous les facteurs réunis (avant simplification des zéros).'),
        mc(clean(ans / 10), 'mc:virgule-produit', 'calcul', 'La virgule est mal placée : compte les chiffres après la virgule de chaque facteur.')],
      hints: [signHint, `Il y a ${negWord(negs)} : le produit est ${negs % 2 ? 'négatif' : 'positif'}.`, 'Multiplie les distances à zéro en groupant astucieusement (0,5 × 4 = 2 ; 2,5 × 4 = 10 ; 0,2 × 5 = 1).'],
      solution: `${negWord(negs)} → produit ${negs % 2 ? 'négatif' : 'positif'} ; $${f.map((x) => fr(Math.abs(x))).join(' × ')} = ${fr(Math.abs(ans))}$, donc le résultat est ${fr(ans)}.`,
    });
  },
  manquant(rand) {
    let a; let x;
    do { a = nz(rand, -9, 9); x = nz(rand, -40, 40) / 10; } while (Math.abs(a) < 2 || Number.isInteger(x));
    const c = clean(a * x);
    const left = rand() < 0.5;
    return numeric(x, {
      prompt: `Trouve le nombre manquant : $${left ? `${par(a)} × ?` : `? × ${par(a)}`} = ${fr(c)}$`, expectedSeconds: 75,
      misconceptions: [mc(-x, 'mc:regle-signes', 'signe', `Vérifie le signe : ${par(a)} × (ta réponse) doit être ${c > 0 ? 'positif' : 'négatif'}.`),
        mc(clean(c * a), 'mc:operation-reciproque', 'raisonnement', `Pour retrouver un facteur, on divise le produit par l’autre facteur : ${fr(c)} ÷ ${par(a)}, on ne multiplie pas.`)],
      hints: [`Quel nombre, multiplié par ${par(a)}, donne ${fr(c)} ?`, `On divise : ? = ${fr(c)} ÷ ${par(a)}.`, signHint],
      solution: `? = ${fr(c)} ÷ ${par(a)} = ${fr(x)}. Vérification : $${par(a)} × ${par(x)} = ${fr(c)}$.`,
    });
  },
  bar(rand) {
    let c; let d; let p; let q; let a; let b; let negs;
    // au moins deux nombres négatifs parmi les quatre écrits : c'est la règle des signes qu'on travaille
    do { c = nz(rand, -6, 6); d = nz(rand, -6, 6); p = nz(rand, -5, 5); q = nz(rand, -5, 5); a = c * p; b = d * q; negs = [a, b, c, d].filter((v) => v < 0).length; } while (Math.abs(c) < 2 || Math.abs(d) < 2 || Math.abs(p * q) < 2 || negs < 2);
    const ans = p * q;
    const expr = `(${fr(a)} × ${par(b)})/(${fr(c)} × ${par(d)})`;
    return numeric(ans, {
      prompt: `${pick(rand, VERB)} : $${expr}$`, expectedSeconds: 100,
      misconceptions: [mc(-ans, 'mc:regle-signes', 'signe', `Il y a ${negs} nombre${negs > 1 ? 's' : ''} négatif${negs > 1 ? 's' : ''} en tout : un nombre ${negs % 2 ? 'impair' : 'pair'} de signes « − » donne un résultat ${negs % 2 ? 'négatif' : 'positif'}.`),
        mc(clean((a * b) / c * d), 'mc:trait-de-fraction', 'notion', `Le trait de fraction porte sur tout le dénominateur : on divise par le produit ${fr(c)} × ${par(d)} (à la calculatrice : ${fr(a * b)} ÷ (${fr(c)} × ${par(d)}), avec des parenthèses).`)],
      hints: ['Simplifie avant de calculer : divise un facteur du numérateur par un facteur du dénominateur.', `${fr(a)} ÷ ${par(c)} = ${fr(p)} et ${fr(b)} ÷ ${par(d)} = ${fr(q)}.`, signHint],
      solution: `$${expr}$ = (${fr(a)} ÷ ${par(c)}) × (${fr(b)} ÷ ${par(d)}) = ${par(p)} × ${par(q)} = ${fr(ans)}.`,
    });
  },
  decimal(rand) {
    let b; let q; let a;
    do { b = pick(rand, [0.2, 0.4, 0.5, 0.05, 0.25, 0.8, 1.2, 0.3, 0.6, 0.08, 1.5]) * (rand() < 0.5 ? -1 : 1); q = nz(rand, -30, 30); a = clean(b * q); } while (Math.abs(q) < 2 || Math.abs(q) % 10 === 0 || (a > 0 && b > 0));
    const k = decimals(b); const m = 10 ** k;
    return numeric(q, {
      prompt: `${pick(rand, VERB)} : $${fr(a)} ÷ ${par(b)}$`, expectedSeconds: 75,
      misconceptions: [mc(-q, 'mc:regle-signes', 'signe', 'Pour un quotient, la règle des signes est la même que pour un produit.'),
        mc(clean(q / 10), 'mc:virgule-quotient', 'calcul', `Multiplie le dividende ET le diviseur par ${m} : ${fr(a)} ÷ ${par(b)} = ${fr(clean(a * m))} ÷ ${par(clean(b * m))}.`),
        mc(clean(q * 10), 'mc:virgule-quotient', 'calcul', `Multiplie le dividende ET le diviseur par le même nombre (${m}) : le quotient ne change pas.`)],
      hints: [signHint, `Multiplie le dividende et le diviseur par ${m} : ${fr(a)} ÷ ${par(b)} = ${fr(clean(a * m))} ÷ ${par(clean(b * m))}.`],
      solution: `$${fr(a)} ÷ ${par(b)} = ${fr(clean(a * m))} ÷ ${par(clean(b * m))} = ${fr(q)}$`,
    });
  },
  'manquant-div'(rand) {
    if (rand() < 0.5) {
      // ? ÷ b = c  →  ? = b × c
      let b; let c;
      do { b = pick(rand, [0.5, 0.2, 0.25, 2, 3, 4, 5, 6, 8]) * (rand() < 0.5 ? -1 : 1); c = nz(rand, -12, 12); } while (Math.abs(c) < 2);
      const ans = clean(b * c);
      return numeric(ans, {
        prompt: `Trouve le nombre manquant : $? ÷ ${par(b)} = ${fr(c)}$`, expectedSeconds: 75,
        misconceptions: [mc(clean(c / b), 'mc:operation-reciproque', 'raisonnement', `On a divisé le nombre cherché par ${par(b)} : pour le retrouver, on multiplie ${fr(c)} par ${par(b)}.`), mc(-ans, 'mc:regle-signes', 'signe', 'Vérifie le signe en remplaçant ? par ta réponse.')],
        hints: [`Si ? ÷ ${par(b)} = ${fr(c)}, alors ? = ${fr(c)} × ${par(b)}.`, signHint],
        solution: `? = ${fr(c)} × ${par(b)} = ${fr(ans)}. Vérification : $${par(ans)} ÷ ${par(b)} = ${fr(c)}$.`,
      });
    }
    // a ÷ ? = c  →  ? = a ÷ c
    let ans; let c; let a;
    do { ans = nz(rand, -9, 9); c = nz(rand, -9, 9); a = ans * c; } while (Math.abs(ans) < 2 || Math.abs(c) < 2 || !distinct(ans, [a * c, c / a, -ans]));
    return numeric(ans, {
      prompt: `Trouve le nombre manquant : $${fr(a)} ÷ ? = ${fr(c)}$`, expectedSeconds: 75,
      misconceptions: [mc(a * c, 'mc:operation-reciproque', 'raisonnement', `On cherche le diviseur : ? = ${fr(a)} ÷ ${par(c)} (on ne multiplie pas).`), mc(clean(c / a), 'mc:quotient-inverse', 'raisonnement', `Le diviseur est le dividende divisé par le quotient : ${fr(a)} ÷ ${par(c)}, pas l’inverse.`), mc(-ans, 'mc:regle-signes', 'signe', 'Vérifie le signe en remplaçant ? par ta réponse.')],
      hints: [`Le nombre cherché est le diviseur : ? = ${fr(a)} ÷ ${par(c)}.`, signHint],
      solution: `? = ${fr(a)} ÷ ${par(c)} = ${fr(ans)}. Vérification : $${fr(a)} ÷ ${par(ans)} = ${fr(c)}$.`,
    });
  },
  chaine(rand) {
    let a; let b; let c; let d; let t; let ans; let wrong;
    do { b = nz(rand, -9, 9); t = nz(rand, -9, 9); c = nz(rand, -6, 6); d = nz(rand, -6, 6); a = b * t; ans = (t * c) / d; wrong = a / (b * c) / d; } while (Math.abs(b) < 2 || Math.abs(c) < 2 || Math.abs(d) < 2 || !Number.isInteger(ans) || [a, b, c, d].filter((v) => v < 0).length < 2 || !distinct(ans, [-ans, wrong]));
    const expr = `${fr(a)} ÷ ${par(b)} × ${par(c)} ÷ ${par(d)}`;
    return numeric(ans, {
      prompt: `${pick(rand, VERB)} : $${expr}$`, expectedSeconds: 100,
      misconceptions: [mc(-ans, 'mc:regle-signes', 'signe', `Compte les nombres négatifs (${[a, b, c, d].filter((v) => v < 0).length}) : la règle des signes est la même pour × et ÷.`),
        mc(clean(wrong), 'mc:multiplication-prioritaire', 'notion', 'La multiplication n’est pas prioritaire sur la division : quand il n’y a que des × et des ÷, on calcule de gauche à droite.')],
      hints: ['Multiplications et divisions ont la même priorité : on les effectue de gauche à droite.', `Commence par ${fr(a)} ÷ ${par(b)} = ${fr(t)}.`, signHint],
      solution: `$${expr} = ${fr(t)} × ${par(c)} ÷ ${par(d)} = ${fr(t * c)} ÷ ${par(d)} = ${fr(ans)}$`,
    });
  },
};

const RP_EXPERT = {
  manquant3(rand) {
    let a; let b; let x; let c; let ab;
    do { a = pick(rand, [0.5, 2.5, 0.25, 1.5, 0.2, 4, 5]) * (rand() < 0.5 ? -1 : 1); b = nz(rand, -8, 8); x = nz(rand, -9, 9); ab = clean(a * b); c = clean(ab * x); } while (Math.abs(b) < 2 || Math.abs(x) < 2 || !isNice(ab, 2) || !distinct(x, [-x, clean(c * ab), clean((c / a) * b)]));
    return numeric(x, {
      prompt: `Trouve le nombre manquant : $${fr(a)} × ? × ${par(b)} = ${fr(c)}$`, expectedSeconds: 150,
      misconceptions: [mc(-x, 'mc:regle-signes', 'signe', `Compte les facteurs négatifs du produit : le résultat ${fr(c)} est ${c > 0 ? 'positif' : 'négatif'}, ce qui impose le signe du nombre cherché.`),
        mc(clean(c * ab), 'mc:operation-reciproque', 'raisonnement', `On a multiplié par ${fr(ab)} pour obtenir ${fr(c)} : pour revenir en arrière, on divise par ${fr(ab)}.`),
        mc(clean((c / a) * b), 'mc:operation-reciproque', 'raisonnement', `Il faut défaire les deux multiplications : diviser par ${par(a)} ET par ${par(b)}.`)],
      hints: [`Calcule d’abord le produit des nombres connus : ${par(a)} × ${par(b)} = ${fr(ab)}.`, `Il reste ${par(ab)} × ? = ${fr(c)} : on divise ${fr(c)} par ${par(ab)}.`, 'Vérifie en remplaçant ? par ta réponse.'],
      solution: `${par(a)} × ${par(b)} = ${fr(ab)}, donc ? = ${fr(c)} ÷ ${par(ab)} = ${fr(x)}. Vérification : $${fr(a)} × ${par(x)} × ${par(b)} = ${fr(c)}$.`,
    });
  },
  enigme(rand) {
    let x; let y;
    do { x = ri(rand, 2, 12); y = -ri(rand, 2, 12); } while (x === -y);
    const P = x * y; const S = x + y; const big = rand() < 0.5;
    const ans = big ? x : y;
    return numeric(ans, {
      prompt: `Deux nombres relatifs entiers ont pour produit ${fr(P)} et pour somme ${fr(S)}. Quel est le plus ${big ? 'grand' : 'petit'} des deux ?`, expectedSeconds: 180, difficulty: 4,
      misconceptions: [mc(big ? -y : -x, 'mc:regle-signes', 'signe', `${fr(-x)} et ${fr(-y)} ont bien pour produit ${fr(P)}, mais leur somme vaut ${fr(-S)}, pas ${fr(S)} : vérifie les deux conditions.`),
        mc(big ? y : x, 'mc:lecture', 'lecture', `Tu as trouvé le bon couple, mais on demande le plus ${big ? 'grand' : 'petit'} des deux nombres.`)],
      hints: ['Le produit est négatif : les deux nombres sont de signes contraires.', `Écris ${fr(P)} comme produit de deux entiers de signes contraires (par exemple 1 × ${par(P)}), puis calcule la somme de chaque couple.`, 'Vérifie les deux conditions : le produit ET la somme.'],
      solution: `${fr(x)} × ${par(y)} = ${fr(P)} et ${fr(x)} + ${par(y)} = ${fr(S)}. Les deux nombres sont ${fr(x)} et ${fr(y)} ; le plus ${big ? 'grand' : 'petit'} est ${fr(ans)}. (Le couple ${fr(-x)} et ${fr(-y)} a le même produit, mais sa somme vaut ${fr(-S)}.)`,
    });
  },
  barre(rand) {
    let a; let b; let c; let d; let ee; let f; let N; let D; let ans;
    do {
      a = nz(rand, -9, 9); b = nz(rand, -9, 9); c = ri(rand, 2, 9); d = -ri(rand, 2, 9); ee = nz(rand, -5, 5); f = nz(rand, -5, 5);
      N = a * b - c * d; D = ee * f; ans = N / D;
    } while ([a, b, ee, f].some((v) => Math.abs(v) < 2) || !Number.isInteger(ans) || !ans || Math.abs(ans) > 30 || !distinct(ans, [-ans, (a * b + c * d) / D, ((a * b - c) * d) / D]));
    const expr = `(${fr(a)} × ${par(b)} − ${c} × ${par(d)})/(${fr(ee)} × ${par(f)})`;
    return numeric(ans, {
      prompt: `${pick(rand, VERB)} : $${expr}$`, expectedSeconds: 210, skills: ['m5.calcul.priorites'],
      misconceptions: [mc(-ans, 'mc:regle-signes', 'signe', 'Le numérateur et le dénominateur sont justes ? Applique la règle des signes au quotient.'),
        mc(clean((a * b + c * d) / D), 'mc:soustraire-opposé', 'signe', `${c} × ${par(d)} = ${fr(c * d)} : soustraire ce nombre négatif revient à ajouter ${fr(-c * d)}.`),
        mc(clean(((a * b - c) * d) / D), 'mc:gauche-a-droite', 'notion', 'Dans le numérateur, les multiplications passent avant la soustraction : on calcule les deux produits d’abord.')],
      hints: ['Le trait de fraction joue le rôle de parenthèses : calcule séparément le numérateur et le dénominateur.', `Dans le numérateur, les produits d’abord : ${fr(a)} × ${par(b)} = ${fr(a * b)} et ${c} × ${par(d)} = ${fr(c * d)}.`, 'Termine par la règle des signes pour le quotient.'],
      solution: `Numérateur : ${fr(a * b)} − ${par(c * d)} = ${fr(N)}. Dénominateur : ${fr(ee)} × ${par(f)} = ${fr(D)}. Quotient : ${fr(N)} ÷ ${par(D)} = ${fr(ans)}.`,
    });
  },
  egalite(rand) {
    let b; let c; let R; let ans; let a;
    do {
      b = nz(rand, -12, 12) / (rand() < 0.5 ? 10 : 1); c = nz(rand, -9, 9);
      ans = pick(rand, [0.5, 0.25, 2, 3, 4, 5, 1.5, 0.2]) * (rand() < 0.5 ? -1 : 1); R = clean(b * c); a = clean(ans * R);
    } while (Math.abs(c) < 2 || Math.abs(b) === 1 || !isNice(a, 2) || !distinct(ans, [-ans, clean(a * R), clean(R / a)]));
    return numeric(ans, {
      prompt: `Trouve le nombre manquant : $${fr(a)} ÷ ? = ${par(b)} × ${par(c)}$`, expectedSeconds: 180,
      misconceptions: [mc(-ans, 'mc:regle-signes', 'signe', 'Vérifie le signe : remplace ? par ta réponse et compare les deux membres.'),
        mc(clean(a * R), 'mc:operation-reciproque', 'raisonnement', `On cherche un diviseur : ? = ${fr(a)} ÷ ${par(R)}, on ne multiplie pas.`),
        mc(clean(R / a), 'mc:quotient-inverse', 'raisonnement', `Le diviseur cherché est ${fr(a)} ÷ ${par(R)} (dividende ÷ quotient), pas l’inverse.`)],
      hints: [`Calcule d’abord le membre de droite : ${par(b)} × ${par(c)} = ${fr(R)}.`, `On cherche le diviseur : ? = ${fr(a)} ÷ ${par(R)}.`, signHint],
      solution: `${par(b)} × ${par(c)} = ${fr(R)}, donc ? = ${fr(a)} ÷ ${par(R)} = ${fr(ans)}. Vérification : $${fr(a)} ÷ ${par(ans)} = ${fr(R)}$.`,
    });
  },
};

/* ------------------------------- priorités -------------------------------- */

/** Exercice de priorités à partir d'un tirage { expr, lines, ans | frac, mcs, hints } : résultat seul ou toutes les étapes. */
function prioExercise(t, etapes, rand, secs, extra = {}) {
  const common = { expectedSeconds: secs, hints: t.hints, solution: `$${t.expr} = ${t.lines.join(' = ')}$`, ...extra };
  if (etapes) {
    return steps('calcul', t.expr, t.lines, { prompt: `Calcule en écrivant chaque étape (une par ligne) : $${t.expr}$`, minSteps: Math.min(3, t.lines.length), final: t.frac ? 'irreductible' : undefined, ...common });
  }
  if (t.frac) return fracResult(t.frac, { prompt: `Calcule et donne le résultat sous la forme d’${formTxt(t.frac)} : $${t.expr}$`, misconceptions: t.mcs, ...common });
  return numeric(t.ans, { prompt: `${pick(rand, ['Calcule', 'Effectue', 'Calcule en respectant les priorités'])} : $${t.expr}$`, misconceptions: t.mcs, ...common });
}

const PAR_FB = 'Les calculs entre parenthèses sont prioritaires : on calcule d’abord ce qu’elles contiennent.';

const PRIO_APPRO = {
  /** a × (b + c × d) − e */
  p1(rand) {
    let a; let b; let c; let d; let ee; let ans; let w1; let w2;
    do { a = ri(rand, 2, 9); b = ri(rand, 2, 9); c = ri(rand, 2, 9); d = ri(rand, 2, 9); ee = ri(rand, 1, 40); ans = a * (b + c * d) - ee; w1 = a * ((b + c) * d) - ee; w2 = a * b + c * d - ee; } while (!distinct(ans, [w1, w2]));
    const inner = b + c * d;
    return {
      expr: `${a} × (${b} + ${c} × ${d}) − ${ee}`, ans,
      lines: [`${a} × (${b} + ${c * d}) − ${ee}`, `${a} × ${inner} − ${ee}`, `${a * inner} − ${ee}`, fr(ans)],
      mcs: [mc(w1, 'mc:gauche-a-droite', 'notion', `Même entre parenthèses, la multiplication passe avant l’addition : calcule d’abord ${c} × ${d}.`), mc(w2, 'mc:parentheses-ignorees', 'notion', `${a} multiplie toute la parenthèse. ${PAR_FB}`)],
      hints: ['Commence par l’intérieur de la parenthèse ; à l’intérieur, la multiplication d’abord.', `La parenthèse vaut ${b} + ${c * d} = ${inner}.`, 'Puis la multiplication, et la soustraction en dernier.'],
    };
  },
  /** a − (b + c × (d − e)) : parenthèses imbriquées, résultat intermédiaire parfois négatif */
  p2(rand) {
    let a; let b; let c; let d; let ee; let in1; let inner; let ans; let w1; let w2;
    do { a = ri(rand, 10, 60); b = ri(rand, 2, 15); c = ri(rand, 2, 9); d = ri(rand, 1, 12); ee = ri(rand, 1, 12); in1 = d - ee; inner = b + c * in1; ans = a - inner; w1 = a - b + c * in1; w2 = a - (b + c) * in1; } while (d === ee || !distinct(ans, [w1, w2]));
    return {
      expr: `${a} − (${b} + ${c} × (${d} − ${ee}))`, ans,
      lines: [`${a} − (${b} + ${c} × ${par(in1)})`, `${a} − (${b} + ${par(c * in1)})`, `${a} − ${par(inner)}`, fr(ans)],
      mcs: [mc(w1, 'mc:moins-devant-parenthese', 'signe', 'Le « − » devant la grande parenthèse porte sur tout ce qu’elle contient : calcule-la entièrement, puis soustrais le résultat.'), mc(w2, 'mc:gauche-a-droite', 'notion', `Dans la grande parenthèse, la multiplication passe avant l’addition : ${c} × ${par(in1)} d’abord.`)],
      hints: ['Commence par la parenthèse la plus intérieure.', `$${d} − ${ee} = ${fr(in1)}$, puis ${c} × ${par(in1)} = ${fr(c * in1)}.`, `La grande parenthèse vaut ${fr(inner)} : il reste ${a} − ${par(inner)}.`],
    };
  },
  /** x × k − m × (y + n) avec des décimaux */
  p3(rand) {
    let x; let k; let m; let y; let n; let ans; let w1; let w2;
    do { x = pick(rand, [1.5, 2.5, 0.5, 1.2, 0.25, 3.5, 0.75, 4.5]); k = ri(rand, 2, 8); m = ri(rand, 2, 6); y = ri(rand, 1, 99) / 10; n = ri(rand, 1, 9); ans = clean(x * k - m * (y + n)); w1 = clean((x * k - m) * (y + n)); w2 = clean(x * k - m * y + n); } while (!isNice(x * k, 2) || Number.isInteger(y) || !ans || !distinct(ans, [w1, w2]));
    return {
      expr: `${fr(x)} × ${k} − ${m} × (${fr(y)} + ${n})`, ans,
      lines: [`${fr(clean(x * k))} − ${m} × ${fr(clean(y + n))}`, `${fr(clean(x * k))} − ${fr(clean(m * (y + n)))}`, fr(ans)],
      mcs: [mc(w1, 'mc:gauche-a-droite', 'notion', 'Les deux multiplications passent avant la soustraction : on ne calcule pas de gauche à droite.'), mc(w2, 'mc:parentheses-ignorees', 'notion', `${m} multiplie toute la parenthèse. ${PAR_FB}`)],
      hints: ['Priorités : parenthèse, puis les deux multiplications, enfin la soustraction.', `$${fr(y)} + ${n} = ${fr(clean(y + n))}$ et $${fr(x)} × ${k} = ${fr(clean(x * k))}$.`, 'Le résultat peut être négatif.'],
    };
  },
  /** (a + b × c)/(d − e × f) : le trait de fraction regroupe numérateur et dénominateur */
  p4(rand) {
    let a; let b; let c; let d; let ee; let f; let D; let q; let N; let w1; let w2;
    do { ee = ri(rand, 2, 5); f = ri(rand, 2, 5); d = ri(rand, 2, 25); D = d - ee * f; q = nz(rand, -8, 8); b = ri(rand, 2, 6); c = ri(rand, 2, 9); N = q * D; a = N - b * c; w1 = ((a + b) * c) / D; w2 = N / ((d - ee) * f); } while (Math.abs(D) < 2 || a < 1 || a > 60 || !distinct(q, [w1, w2]));
    return {
      expr: `(${a} + ${b} × ${c})/(${d} − ${ee} × ${f})`, ans: q,
      lines: [`(${a} + ${b * c})/(${d} − ${ee * f})`, `${N}/${par(D)}`, fr(q)],
      mcs: [mc(clean(w1), 'mc:gauche-a-droite', 'notion', `Au numérateur, la multiplication passe avant l’addition : ${b} × ${c} d’abord.`), mc(clean(w2), 'mc:gauche-a-droite', 'notion', `Au dénominateur, la multiplication passe avant la soustraction : ${ee} × ${f} d’abord.`)],
      hints: ['Le trait de fraction joue le rôle de parenthèses : calcule le numérateur, puis le dénominateur.', `Numérateur : ${a} + ${b * c} = ${N} ; dénominateur : ${d} − ${ee * f} = ${fr(D)}.`, 'Termine par la division (attention au signe).'],
    };
  },
};

/** ◆ à l'envers : retrouver le nombre manquant d'un calcul avec priorités. */
function PRIO_MANQUANT(rand) {
  if (rand() < 0.5) {
    // a + ? × b = c  →  ? = (c − a) ÷ b
    let a; let b; let x; let c;
    do { a = ri(rand, 2, 30); b = ri(rand, 2, 9); x = nz(rand, -6, 12); c = a + x * b; } while (!distinct(x, [c / b - a, (c - a) * b]));
    return numeric(x, {
      prompt: `Trouve le nombre manquant : $${a} + ? × ${b} = ${fr(c)}$`, expectedSeconds: 120,
      misconceptions: [mc(clean(c / b - a), 'mc:gauche-a-droite', 'notion', `L’égalité se lit ${a} + (? × ${b}) : la multiplication est prioritaire, ce n’est pas (${a} + ?) × ${b}.`), mc((c - a) * b, 'mc:operation-reciproque', 'raisonnement', `? × ${b} = ${fr(c - a)} : pour retrouver ?, on divise par ${b}.`)],
      hints: [`Le calcul est ${a} + (? × ${b}) : que vaut ? × ${b} ?`, `? × ${b} = ${fr(c)} − ${a} = ${fr(c - a)}.`, `Divise par ${b}.`],
      solution: `? × ${b} = ${fr(c)} − ${a} = ${fr(c - a)}, donc ? = ${fr(c - a)} ÷ ${b} = ${fr(x)}. Vérification : $${a} + ${par(x)} × ${b} = ${fr(c)}$.`,
    });
  }
  // a × (? − b) = c  →  ? = c ÷ a + b
  let a; let b; let x; let c;
  do { a = ri(rand, 2, 9); b = ri(rand, 1, 9); x = nz(rand, -6, 15); c = a * (x - b); } while (!c || !distinct(x, [(c + b) / a, c / a - b]));
  return numeric(x, {
    prompt: `Trouve le nombre manquant : $${a} × (? − ${b}) = ${fr(c)}$`, expectedSeconds: 120,
    misconceptions: [mc(clean((c + b) / a), 'mc:parentheses-ignorees', 'notion', `${a} multiplie toute la parenthèse : la parenthèse vaut ${fr(c)} ÷ ${a}.`), mc(clean(c / a - b), 'mc:operation-reciproque', 'raisonnement', `Dans la parenthèse, on a retiré ${b} : pour retrouver ?, on rajoute ${b}.`)],
    hints: [`La parenthèse vaut ${fr(c)} ÷ ${a} = ${fr(c / a)}.`, `Il reste ? − ${b} = ${fr(c / a)}.`],
    solution: `? − ${b} = ${fr(c)} ÷ ${a} = ${fr(c / a)}, donc ? = ${fr(c / a)} + ${b} = ${fr(x)}. Vérification : $${a} × (${fr(x)} − ${b}) = ${fr(c)}$.`,
  });
}

const PRIO_EXPERT = {
  /** a/b ± (c/d) × (e/f) ou a/b + (c/d) ÷ (e/f) : fractions et priorités */
  frac(rand) {
    let A; let B; let C; let op; let P; let res; let mcs;
    do {
      const q = ri(rand, 2, 9); const s = ri(rand, 2, 9); const u = ri(rand, 2, 9);
      A = [numFor(rand, q), q]; B = [numFor(rand, s, s + 3), s]; C = [numFor(rand, u, u + 3), u]; op = pick(rand, ['+×', '−×', '+÷']);
      P = op[1] === '×' ? fmul(B, C) : fdiv(B, C);
      res = op[0] === '+' ? fadd(A, P) : fsub(A, P);
      const left = op[0] === '+' ? fadd(A, B) : fsub(A, B);
      mcs = [mc(fracStr(op[1] === '×' ? fmul(left, C) : fdiv(left, C)), 'mc:gauche-a-droite', 'notion', `La ${op[1] === '×' ? 'multiplication' : 'division'} est prioritaire sur ${op[0] === '+' ? 'l’addition' : 'la soustraction'} : on calcule d’abord $${fp(B)} ${op[1]} ${fp(C)}$.`),
        mc(fracStr(frac(op[0] === '+' ? A[0] + P[0] : A[0] - P[0], A[1] + P[1])), 'mc:ajouter-denominateurs', 'notion', `Pour ${op[0] === '+' ? 'ajouter' : 'soustraire'} deux fractions, on les écrit d’abord avec le même dénominateur : on n’ajoute pas les dénominateurs.`)];
      if (op[1] === '÷') mcs.push(mc(fracStr(fadd(A, fmul(B, C))), 'mc:division-sans-inverse', 'notion', `Diviser par $${fm(C)}$, c’est multiplier par son inverse $${fm([C[1], C[0]])}$.`));
    } while (!res[0] || res[1] > 72 || P[1] === 1 || B[1] === C[1] || !fdistinct(res, mcs.map((m) => readFrac(m.answer))));
    const L = lcm(A[1], P[1]);
    const sign = op[0] === '+' ? '+' : '−';
    return {
      expr: `${fm(A)} ${sign} ${fp(B)} ${op[1]} ${fp(C)}`, frac: res, mcs, skills: ['m4.fractions.calcul'],
      lines: [`${fm(A)} ${sign} ${fm(P)}`, `${(A[0] * L) / A[1]}/${L} ${sign} ${(P[0] * L) / P[1]}/${L}`, fracStr(res)],
      hints: [`Priorités : la ${op[1] === '×' ? 'multiplication' : 'division'} passe avant ${op[0] === '+' ? 'l’addition' : 'la soustraction'}.`, `$${fp(B)} ${op[1]} ${fp(C)} = ${fm(P)}$`, `Mets ensuite au même dénominateur (${L}) et simplifie.`],
    };
  },
  /** a − b × (c − d)² : le carré d'abord, il ne porte que sur la parenthèse */
  carre(rand) {
    let a; let b; let c; let d; let in1; let s2; let ans; let vals;
    do {
      a = ri(rand, 2, 40); b = ri(rand, 2, 6); c = ri(rand, 1, 9); d = ri(rand, 1, 9); in1 = c - d; s2 = in1 * in1; ans = a - b * s2;
      vals = [(a - b) * s2, a - (b * in1) ** 2, a - b * 2 * in1, ...(in1 < 0 ? [a + b * s2] : [])];
    } while (Math.abs(in1) < 2 || !distinct(ans, vals));
    const mcs = [mc(vals[0], 'mc:gauche-a-droite', 'notion', 'La multiplication passe avant la soustraction : on ne calcule pas de gauche à droite.'),
      mc(vals[1], 'mc:puissance-prioritaire', 'notion', `Le carré porte seulement sur la parenthèse : on calcule ${par(in1)}² avant de multiplier par ${b}.`),
      mc(vals[2], 'mc:carre-double', 'notion', `${par(in1)}² = ${par(in1)} × ${par(in1)}, pas 2 × ${par(in1)}.`)];
    if (in1 < 0) mcs.push(mc(vals[3], 'mc:carre-negatif', 'signe', `Le carré d’un nombre négatif est positif : ${par(in1)}² = ${s2}.`));
    return {
      expr: `${a} − ${b} × (${c} − ${d})²`, ans, mcs, skills: ['m5.puissances.calcul'],
      lines: [`${a} − ${b} × ${par(in1)}²`, `${a} − ${b} × ${s2}`, `${a} − ${b * s2}`, fr(ans)],
      hints: ['Ordre : parenthèses, puissances, multiplications, puis additions et soustractions.', `$${c} − ${d} = ${fr(in1)}$ et ${par(in1)}² = ${s2}.`, `Il reste ${a} − ${b} × ${s2}.`],
    };
  },
};

/** ✦ Défaire un calcul en remontant les priorités (dans l'ordre inverse). */
function PRIO_EXPERT_MANQUANT(rand) {
  if (rand() < 0.5) {
    // (? − a) × b + c = d  →  ? = (d − c) ÷ b + a
    let a; let b; let c; let x; let d; let vals;
    do { a = ri(rand, 1, 9); b = ri(rand, 2, 7); c = ri(rand, 1, 20); x = nz(rand, -10, 15); d = (x - a) * b + c; vals = [d / b - c + a, d - c + a * b, (d - c) / b - a]; } while (!distinct(x, vals));
    return numeric(x, {
      prompt: `Trouve le nombre manquant : $(? − ${a}) × ${b} + ${c} = ${fr(d)}$`, expectedSeconds: 180,
      misconceptions: [mc(clean(vals[0]), 'mc:ordre-reciproque', 'raisonnement', `On défait les opérations dans l’ordre inverse du calcul : d’abord le « + ${c} » (fait en dernier), puis le « × ${b} ».`),
        mc(clean(vals[1]), 'mc:parentheses-ignorees', 'notion', `La parenthèse compte : c’est toute la parenthèse (? − ${a}) qui est multipliée par ${b}.`),
        mc(clean(vals[2]), 'mc:operation-reciproque', 'raisonnement', `Dans la parenthèse, on a retiré ${a} : pour retrouver ?, on rajoute ${a}.`)],
      hints: ['Défais les opérations dans l’ordre inverse de celui du calcul.', `D’abord : (? − ${a}) × ${b} = ${fr(d)} − ${c} = ${fr(d - c)}.`, `Puis ? − ${a} = ${fr(d - c)} ÷ ${b} = ${fr(x - a)}.`],
      solution: `(? − ${a}) × ${b} = ${fr(d - c)}, donc ? − ${a} = ${fr(x - a)}, donc ? = ${fr(x)}. Vérification : $(${fr(x)} − ${a}) × ${b} + ${c} = ${fr(d)}$.`,
    });
  }
  // a − b × (? + c) = d  →  ? = (a − d) ÷ b − c
  let a; let b; let c; let x; let d; let vals;
  do { a = ri(rand, 10, 50); b = ri(rand, 2, 6); c = ri(rand, 1, 9); x = nz(rand, -9, 9); d = a - b * (x + c); vals = [(d - a) / b - c, d / (a - b) - c, (a - d) / b + c]; } while (x + c === 0 || !distinct(x, vals));
  return numeric(x, {
    prompt: `Trouve le nombre manquant : $${a} − ${b} × (? + ${c}) = ${fr(d)}$`, expectedSeconds: 180,
    misconceptions: [mc(clean(vals[0]), 'mc:ordre-soustraction', 'signe', `${a} − (quelque chose) = ${fr(d)} : ce « quelque chose » vaut ${a} − ${par(d)}, pas ${fr(d)} − ${a}.`),
      mc(clean(vals[1]), 'mc:gauche-a-droite', 'notion', `La multiplication est prioritaire : le calcul est ${a} − (${b} × (? + ${c})), pas (${a} − ${b}) × (? + ${c}).`),
      mc(clean(vals[2]), 'mc:operation-reciproque', 'raisonnement', `Dans la parenthèse, on a ajouté ${c} : pour retrouver ?, on retire ${c}.`)],
    hints: [`Que vaut ${b} × (? + ${c}) ? C’est ce qu’on retire à ${a} pour obtenir ${fr(d)}.`, `${b} × (? + ${c}) = ${a} − ${par(d)} = ${fr(a - d)}, donc ? + ${c} = ${fr((a - d) / b)}.`],
    solution: `${b} × (? + ${c}) = ${fr(a - d)}, donc ? + ${c} = ${fr((a - d) / b)} et ? = ${fr(x)}. Vérification : $${a} − ${b} × (${fr(x)} + ${c}) = ${fr(d)}$.`,
  });
}
