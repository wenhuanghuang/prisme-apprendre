#!/usr/bin/env node
/**
 * Parcours rédigés (5e, 4e, 3e) : découpage en chapitres, rattachement aux attendus officiels
 * (libellés repris de la recherche documentaire), leçons disponibles et chapitres à venir.
 * Le nombre de chapitres suit le programme réel : pas de découpage arbitraire en 5 ou 6.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const c4 = JSON.parse(readFileSync(join(root, 'research', 'cycle4-maths-pc.json'), 'utf8'));
const out = join(root, 'app', 'content', 'courses');

const mathsAttendus = {};
for (const lv of ['5e', '4e', '3e']) for (const th of c4.maths.levels[lv].themes) for (const a of th.attendus) mathsAttendus[a.id] = a.label;
const pcNotions = {};
for (const th of c4.pc.themes) for (const n of th.notions) pcNotions[n.id] = n.label;
const official = (ids, table) => ids.map((id) => ({ id, label: table[id] || id }));

function chapter(id, title, { lessons = [], skills = [], attendus = [], table = mathsAttendus, status = 'programme', note } = {}) {
  return { id, title, status, state: lessons.length ? 'disponible' : 'a-venir', lessons, skills, official: official(attendus, table), ...(note ? { note } : {}) };
}

const courses = [
  {
    id: 'maths-5e', level: '5e', subject: 'maths', programmes: ['maths-c4-2026'], coverage: 'partiel',
    progressionNote: 'Programme 2026 de 5e (arrêté du 18-02-2026, BO n°10 du 5-03-2026), défini par année. L’ordre des chapitres est une progression proposée par Prisme ; l’enseignant reste libre de son organisation.',
    chapters: [
      chapter('m5-ch-relatifs', 'Nombres relatifs : repérer, comparer, additionner, soustraire', { lessons: ['m5-relatifs'], skills: ['m5.relatifs.reperage', 'm5.relatifs.addition'], attendus: ['m5-nc-09', 'm5-nc-10', 'm5-nc-11', 'm5-nc-12', 'm5-nc-13', 'm5-nc-14', 'm5-nc-15'] }),
      chapter('m5-ch-fractions', 'Fractions : comparer, additionner, soustraire', { lessons: ['m5-fractions'], skills: ['m5.fractions.egalite', 'm5.fractions.comparaison', 'm5.fractions.addition'], attendus: ['m5-nc-16', 'm5-nc-17', 'm5-nc-18'] }),
      chapter('m5-ch-litteral', 'Calcul littéral : formules, substitution, distributivité, preuve et contre-exemple', { lessons: ['m5-litteral'], skills: ['m5.litteral.expression', 'm5.litteral.tester', 'm5.litteral.distributivite', 'm5.calcul.priorites'], attendus: ['m5-nc-21', 'm5-nc-22', 'm5-nc-23', 'm5-nc-24', 'm5-nc-25', 'm5-nc-26', 'm5-nc-27'] }),
      chapter('m5-ch-equations-trous', 'Problèmes à trous : équations ax = c et x + b = c', { attendus: ['m5-nc-28'] }),
      chapter('m5-ch-operations', 'Enchaîner des opérations, priorités, multiples et diviseurs', { skills: ['m5.calcul.priorites'], attendus: ['m5-nc-01', 'm5-nc-02', 'm5-nc-03', 'm5-nc-04', 'm5-nc-05', 'm5-nc-06', 'm5-nc-07', 'm5-nc-08'] }),
      chapter('m5-ch-puissances', 'Carrés et cubes', { attendus: ['m5-nc-19', 'm5-nc-20'] }),
      chapter('m5-ch-proportionnalite', 'Proportionnalité, pourcentages, « en fonction de »', { skills: ['m5.proportionnalite'], attendus: ['m5-df-09', 'm5-df-10', 'm5-df-11', 'm5-df-12', 'm5-df-13', 'm5-df-14'] }),
      chapter('m5-ch-stats', 'Données, fréquences, moyenne', { attendus: ['m5-df-01', 'm5-df-02', 'm5-df-03', 'm5-df-04'] }),
      chapter('m5-ch-probas', 'Hasard et probabilités', { lessons: ['m5-probabilites'], skills: ['m5.probabilites'], attendus: ['m5-df-05', 'm5-df-06', 'm5-df-07', 'm5-df-08'] }),
      chapter('m5-ch-triangles', 'Angles et triangles : somme des angles (et sa démonstration), constructions', { lessons: ['m5-triangles'], skills: ['m5.triangle.angles'], attendus: ['m5-eg-07', 'm5-eg-08', 'm5-eg-09', 'm5-eg-10'], note: 'L’inégalité triangulaire n’est plus citée dans le programme 2026 : elle est proposée dans le parcours d’approfondissement.' }),
      chapter('m5-ch-symetries', 'Symétrie axiale et demi-tour (symétrie centrale)', { attendus: ['m5-eg-05', 'm5-eg-06'] }),
      chapter('m5-ch-droites', 'Médiatrices, hauteurs, médianes', { attendus: ['m5-eg-11', 'm5-eg-12', 'm5-eg-13'] }),
      chapter('m5-ch-parallelogrammes', 'Parallélogrammes et parallélogrammes particuliers', { attendus: ['m5-eg-14', 'm5-eg-15'] }),
      chapter('m5-ch-reperage', 'Repérage sur une droite et dans le plan ; perspective et patrons', { attendus: ['m5-eg-01', 'm5-eg-02', 'm5-eg-03', 'm5-eg-04'] }),
      chapter('m5-ch-grandeurs', 'Aires et volumes', { attendus: ['m5-gm-01', 'm5-gm-02', 'm5-gm-03', 'm5-gm-04', 'm5-gm-05'] }),
      chapter('m5-ch-algo', 'Pensée informatique : séquences et boucles', { lessons: ['code-tortue-boucles'], skills: ['code.sequences', 'code.boucles', 'code.debug'], attendus: ['m5-ap-01', 'm5-ap-02', 'm5-ap-03', 'm5-ap-04'] }),
    ],
  },
  {
    id: 'maths-4e', level: '4e', subject: 'maths', programmes: ['maths-c4-2020'], coverage: 'partiel',
    progressionNote: 'En 2026-2027, la 4e reste sur le programme du cycle 4 de 2020 et les repères annuels de 2019 (le nouveau programme s’appliquera en 4e en 2027-2028). Ordre des chapitres : progression proposée par Prisme.',
    chapters: [
      chapter('m4-ch-relatifs', 'Nombres relatifs : produits et quotients', { lessons: ['m4-relatifs-produit'], skills: ['m4.relatifs.produit'], attendus: ['m4-nc-06'] }),
      chapter('m4-ch-fractions', 'Nombres rationnels : les quatre opérations, l’inverse', { skills: ['m4.fractions.produit'], attendus: ['m4-nc-05', 'm4-nc-07', 'm4-nc-08'] }),
      chapter('m4-ch-puissances', 'Puissances, puissances de 10, notation scientifique', { lessons: ['m4-puissances'], skills: ['m4.puissances'], attendus: ['m4-nc-01', 'm4-nc-02'] }),
      chapter('m4-ch-racines', 'Carrés parfaits et racine carrée', { attendus: ['m4-nc-03', 'm4-nc-04'] }),
      chapter('m4-ch-premiers', 'Nombres premiers et décomposition', { attendus: ['m4-nc-09', 'm4-nc-10'] }),
      chapter('m4-ch-litteral', 'Calcul littéral : distributivité simple, programmes de calcul équivalents', { skills: ['m5.litteral.distributivite'], attendus: ['m4-nc-11', 'm4-nc-12', 'm4-nc-13'] }),
      chapter('m4-ch-equations', 'Équations du premier degré et mise en équation', { lessons: ['m4-equations'], skills: ['m4.equations.resoudre', 'm4.equations.modeliser'], attendus: ['m4-nc-14', 'm4-nc-15'] }),
      chapter('m4-ch-proportionnalite', 'Proportionnalité, quatrième proportionnelle, formules', { attendus: ['m4-df-06', 'm4-df-07', 'm4-df-08', 'm4-df-09', 'm4-df-10'] }),
      chapter('m4-ch-stats', 'Statistiques : diagrammes circulaires, médiane', { attendus: ['m4-df-01', 'm4-df-02'] }),
      chapter('m4-ch-probas', 'Probabilités : évènement contraire, équiprobabilité', { attendus: ['m4-df-03', 'm4-df-04', 'm4-df-05'] }),
      chapter('m4-ch-pythagore', 'Théorème de Pythagore, réciproque et contraposée', { lessons: ['m4-pythagore'], skills: ['m4.pythagore.calcul', 'm4.pythagore.reciproque', 'm4.raisonner.preuve'], attendus: ['m4-eg-05'] }),
      chapter('m4-ch-thales', 'Théorème de Thalès (triangles emboîtés)', { attendus: ['m4-eg-04'] }),
      chapter('m4-ch-cosinus', 'Cosinus d’un angle aigu', { attendus: ['m4-eg-06'] }),
      chapter('m4-ch-translation', 'Translation', { attendus: ['m4-gm-04', 'm4-eg-07'] }),
      chapter('m4-ch-triangles', 'Cas d’égalité des triangles et constructions', { attendus: ['m4-eg-03', 'm4-eg-08'] }),
      chapter('m4-ch-grandeurs', 'Volumes (pyramide, cône), grandeurs composées, agrandissement-réduction', { attendus: ['m4-gm-01', 'm4-gm-02', 'm4-gm-03'] }),
      chapter('m4-ch-espace', 'Repérage dans l’espace, perspective et patrons', { attendus: ['m4-eg-01', 'm4-eg-02'] }),
      chapter('m4-ch-algo', 'Algorithmique : variables, conditions, blocs personnalisés', { lessons: ['code-variables'], skills: ['code.variables', 'code.procedures'], attendus: ['m4-ap-01'] }),
    ],
  },
  {
    id: 'maths-3e', level: '3e', subject: 'maths', programmes: ['maths-c4-2020'], coverage: 'partiel',
    progressionNote: 'En 2026-2027, la 3e reste sur le programme du cycle 4 de 2020 et les repères annuels de 2019. Seul le chapitre de calcul littéral est rédigé pour l’instant (accessible aux élèves de 4e en avance).',
    chapters: [
      chapter('m3-ch-litteral', 'Calcul littéral : double distributivité, factorisation', { lessons: ['m4-double-distributivite'], skills: ['m4.litteral.double-distributivite', 'mx.identites'], attendus: ['m3-nc-04'] }),
      chapter('m3-ch-nombres', 'Rationnels, puissances, racines carrées', { attendus: ['m3-nc-01', 'm3-nc-02', 'm3-nc-03'] }),
      chapter('m3-ch-equations', 'Équations produit nul, x² = a, problèmes', { attendus: ['m3-nc-05'] }),
      chapter('m3-ch-fonctions', 'Fonctions : notations, linéaires et affines', { attendus: ['m3-df-03', 'm3-df-04'] }),
      chapter('m3-ch-stats-probas', 'Statistiques et probabilités à deux épreuves', { attendus: ['m3-df-01', 'm3-df-02'] }),
      chapter('m3-ch-geometrie', 'Thalès (papillon), triangles semblables, trigonométrie, transformations', { attendus: ['m3-eg-02', 'm3-gm-02'] }),
      chapter('m3-ch-espace', 'Sphère, boule, sections de solides', { attendus: ['m3-eg-01', 'm3-gm-01'] }),
      chapter('m3-ch-algo', 'Algorithmique : niveaux 2 et 3', { attendus: ['m3-ap-01'] }),
    ],
  },
];

const pcNote = 'Le programme de physique-chimie du cycle 4 (2020) est défini pour l’ensemble du cycle : la répartition entre 5e, 4e et 3e suit les repères de progressivité et reste une progression éditoriale, pas un ordre national obligatoire.';
courses.push(
  { id: 'pc-5e', level: '5e', subject: 'pc', programmes: ['pc-c4-2020'], coverage: 'partiel', progressionNote: pcNote, chapters: [
    chapter('pc5-etats', 'États et changements d’état de la matière', { lessons: ['pc-changements-etat'], skills: ['pc.matiere.etats'], attendus: ['pc-mat-01', 'pc-mat-02', 'pc-mat-03', 'pc-mat-06'], table: pcNotions }),
    chapter('pc5-melanges', 'Corps purs, mélanges, solubilité', { attendus: ['pc-mat-04', 'pc-mat-05', 'pc-mat-07'], table: pcNotions }),
    chapter('pc5-mouvement', 'Décrire un mouvement', { attendus: ['pc-mvt-01', 'pc-mvt-02', 'pc-mvt-03'], table: pcNotions }),
    chapter('pc5-energie', 'Énergie : formes, sources, conversions', { attendus: ['pc-ene-01', 'pc-ene-02'], table: pcNotions }),
    chapter('pc5-circuits', 'Circuits électriques, intensité et tension', { attendus: ['pc-ene-03', 'pc-ene-04'], table: pcNotions }),
    chapter('pc5-lumiere', 'Lumière : sources, propagation rectiligne', { attendus: ['pc-sig-01'], table: pcNotions }),
  ] },
  { id: 'pc-4e', level: '4e', subject: 'pc', programmes: ['pc-c4-2020'], coverage: 'partiel', progressionNote: pcNote, chapters: [
    chapter('pc4-masse-volumique', 'Masse volumique', { lessons: ['pc-masse-volumique'], skills: ['pc.matiere.masse-volumique', 'pc.mesure.donnees'], attendus: ['pc-mat-08'], table: pcNotions }),
    chapter('pc4-atomes', 'Atomes, molécules, transformations chimiques', { attendus: ['pc-mat-09', 'pc-mat-10', 'pc-mat-11'], table: pcNotions }),
    chapter('pc4-vitesse', 'Vitesse : relation distance-durée, conversions', { lessons: ['pc-vitesse'], skills: ['pc.mouvement.vitesse'], attendus: ['pc-mvt-04'], table: pcNotions }),
    chapter('pc4-forces', 'Interactions et forces', { attendus: ['pc-mvt-05', 'pc-mvt-06'], table: pcNotions }),
    chapter('pc4-lois', 'Lois de l’électricité (série, dérivation)', { attendus: ['pc-ene-05'], table: pcNotions }),
    chapter('pc4-ohm', 'Loi d’Ohm', { lessons: ['pc-loi-ohm'], skills: ['pc.electricite.ohm', 'pc.mesure.incertitudes'], attendus: ['pc-ene-06'], table: pcNotions }),
    chapter('pc4-signaux', 'Son et lumière : propagation et vitesses', { lessons: ['pc-son-lumiere'], skills: ['pc.signaux.propagation'], attendus: ['pc-sig-02', 'pc-sig-03', 'pc-sig-04'], table: pcNotions }),
  ] },
  { id: 'pc-3e', level: '3e', subject: 'pc', programmes: ['pc-c4-2020'], coverage: 'partiel', progressionNote: pcNote, chapters: [
    chapter('pc3-poids', 'Poids et masse, gravitation', { lessons: ['pc-poids-masse'], skills: ['pc.interactions.poids'], attendus: ['pc-mvt-07', 'pc-mvt-08'], table: pcNotions }),
    chapter('pc3-puissance', 'Puissance et énergie électriques', { skills: ['pc.energie.puissance'], attendus: ['pc-ene-07', 'pc-ene-08'], table: pcNotions }),
    chapter('pc3-energie', 'Énergie cinétique, conservation de l’énergie', { attendus: ['pc-ene-09', 'pc-ene-10', 'pc-ene-11'], table: pcNotions }),
    chapter('pc3-ph', 'Acides, bases, pH', { attendus: ['pc-mat-12'], table: pcNotions }),
    chapter('pc3-atome', 'Constituants de l’atome, Univers', { attendus: ['pc-mat-14', 'pc-mat-15', 'pc-mat-16'], table: pcNotions }),
    chapter('pc3-signaux', 'Signal et information', { attendus: ['pc-sig-05', 'pc-sig-06'], table: pcNotions }),
  ] },
);

const numNote = 'L’algorithmique et la programmation font partie du programme de mathématiques (et de technologie) du cycle 4. L’intelligence artificielle n’est pas une discipline du BO : ces leçons s’appuient sur le cadre de référence des compétences numériques (CRCN) et les parcours Pix IA (obligatoires en 4e en 2026-2027).';
courses.push(
  { id: 'numerique-5e', level: '5e', subject: 'numerique', programmes: ['maths-c4-2026', 'ia-numerique-cadre-2026'], coverage: 'partiel', progressionNote: numNote, chapters: [
    { id: 'n5-code', title: 'Programmer la tortue : séquences, boucles, débogage', status: 'programme', state: 'disponible', lessons: ['code-tortue-boucles'], skills: ['code.sequences', 'code.boucles', 'code.debug'], official: official(['m5-ap-01', 'm5-ap-02', 'm5-ap-03', 'm5-ap-04'], mathsAttendus) },
    { id: 'n5-ia', title: 'Comment une IA apprend à partir d’exemples', status: 'programme', state: 'disponible', lessons: ['ia-apprendre-exemples'], skills: ['ia.apprentissage', 'ia.biais'], official: [] },
  ] },
  { id: 'numerique-4e', level: '4e', subject: 'numerique', programmes: ['maths-c4-2020', 'ia-numerique-cadre-2026'], coverage: 'partiel', progressionNote: numNote, chapters: [
    { id: 'n4-code', title: 'Variables, conditions, procédures', status: 'programme', state: 'disponible', lessons: ['code-variables'], skills: ['code.variables', 'code.procedures'], official: official(['m4-ap-01'], mathsAttendus) },
    { id: 'n4-ia', title: 'Les modèles de langage et l’usage responsable de l’IA', status: 'programme', state: 'disponible', lessons: ['ia-modeles-langage'], skills: ['ia.generative', 'ia.usage'], official: [] },
  ] },
  // Les parcours de français, histoire-géographie, EMC, SVT, technologie, langues, musique et arts
  // sont rédigés directement dans app/content/courses/ ("authored": true).
);

for (const c of courses) writeFileSync(join(out, `${c.id}.json`), JSON.stringify({ ...c, authored: true }, null, 1));
console.log(`✓ ${courses.length} parcours rédigés écrits.`);
