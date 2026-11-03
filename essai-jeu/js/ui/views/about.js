/** État du projet : ce qui est terminé, ce qui reste à développer — sans enjoliver. */
import { h } from '../dom.js';
import { store } from '../../app/store.js';

export function render(root) {
  const idx = store.index;
  const byTrack = { classe: 0, approfondissement: 0, expert: 0 };
  let qcm = 0;
  for (const e of idx.exercises) { byTrack[e.track] += 1; if (e.type === 'qcm') qcm += 1; }
  const types = new Set(idx.exercises.map((e) => e.type));
  const authored = store.catalog.courses.filter((c) => c.coverage !== 'reference').length;

  root.append(
    h('div', { class: 'page-head' }, h('div', {}, h('p', { class: 'eyebrow' }, 'Version 0.4 — octobre 2026'), h('h1', {}, 'État du projet'),
      h('p', { class: 'lede' }, 'Tout le collège est rédigé, de la 6e à la 3e, en français, mathématiques, histoire-géographie et sciences (sciences et technologie en 6e, physique-chimie et SVT ensuite) ; les leçons se jouent écran par écran, les expériences sont montrées étape par étape, et une progression ludique (points, niveaux, série de jours) encourage la régularité. Voici ce qui est réellement fait, et ce qui ne l’est pas encore.'))),
    h('div', { class: 'kpis', style: { marginBottom: '18px' } },
      h('div', { class: 'kpi' }, h('b', {}, String(idx.lessons.length)), h('span', {}, 'leçons rédigées')),
      h('div', { class: 'kpi' }, h('b', {}, String(idx.exercises.length)), h('span', {}, `exercices (${byTrack.classe} classe, ${byTrack.approfondissement} ◆, ${byTrack.expert} ✦)`)),
      h('div', { class: 'kpi' }, h('b', {}, `${Math.round((qcm / Math.max(1, idx.exercises.length)) * 100)} %`), h('span', {}, 'de QCM (vérifications rapides)')),
      h('div', { class: 'kpi' }, h('b', {}, String(types.size)), h('span', {}, 'types de réponses construites')),
      h('div', { class: 'kpi' }, h('b', {}, `${authored}/${store.catalog.courses.length}`), h('span', {}, 'parcours rédigés / référencés'))),
    h('div', { class: 'grid grid--2' },
      h('section', { class: 'card' }, h('h2', {}, 'Terminé et testé'), h('ul', {},
        h('li', {}, 'Leçons jouées écran par écran : chemin d’étapes, cours en cartes (avec cartes devinettes à retourner), exemple résolu dévoilé pas à pas, exercices un par un, étoiles, écran de fin.'),
        h('li', {}, 'Expériences montrées étape par étape : animation, explication de chaque étape, pause, retour en arrière, vitesse, lecture à voix haute, questions « Que va-t-il se passer ? ». Galerie dans le Labo.'),
        h('li', {}, 'Figures dessinées par l’application : géométrie, repères, diagrammes, frises chronologiques, tableaux, y compris sur les fiches imprimées.'),
        h('li', {}, 'Moteur adaptatif par compétence : maîtrise estimée, typologie des erreurs, idées fausses, prérequis, résurgences, révision espacée, recommandations expliquées (élève et parent).'),
        h('li', {}, 'Correcteurs qui analysent la démarche : calcul et équations étape par étape, expressions (forme développée, factorisée…), grandeurs avec unités, contre-exemples, réponses multiples, équations à inventer, programmes.'),
        h('li', {}, 'Réponses rédigées : critères visibles, auto-évaluation, nouvelles versions, validation par un adulte ; jamais déclarées fausses automatiquement.'),
        h('li', {}, 'Manipulations de mathématiques (balance à équations, droite graduée, fractions, Pythagore, triangles, dés), programmation (tortue) et IA ; simulations de physique en accès libre et facultatives dans le Labo.'),
        h('li', {}, 'Collège (6e, 5e, 4e, 3e) : français, mathématiques, histoire-géographie et sciences rédigés chapitre par chapitre, avec des exercices « type brevet » en 3e ; premières leçons dans les autres matières (EMC, technologie, langues, arts, musique, programmation et IA).'),
        h('li', {}, 'Progression ludique : points d’expérience, 15 niveaux aux noms de lumière, objectif du jour, série de jours avec jokers, accessoires de Photon à débloquer, trophées ; les points récompensent la réussite sans aide et la régularité, jamais le simple clic.'),
        h('li', {}, 'Garde-fous de correction : un message d’erreur qui contiendrait la réponse est repéré (l’élève qui la recopie n’est pas compté comme ayant réussi seul) ; unités, nombres en lettres, pourcentages et durées lus avec précision.'),
        h('li', {}, 'Profils locaux par pseudo, tableau de bord parent, validation des rédactions, export/restauration/effacement, code parent, PWA hors connexion.'),
        h('li', {}, 'Matrice des programmes 2026-2027 (CP → Terminale) avec liens BO / Éduscol / Légifrance et distinction programme / approfondissement / hors programme.'),
        h('li', {}, 'Tests automatiques : moteur d’expressions, correcteurs, élèves fictifs, et rejeu des réponses types de chaque exercice.'))),
      h('section', { class: 'card' }, h('h2', {}, 'Reste à développer'), h('ul', {},
        h('li', {}, 'Primaire (CP-CM2) et lycée : les parcours présentent le découpage en chapitres et les notions officielles ; les leçons restent à rédiger.'),
        h('li', {}, 'Au collège, les chapitres « à venir » des autres matières (technologie, EMC, langues, arts, musique).'),
        h('li', {}, 'Six leçons sur des sujets sensibles (puberté, reproduction, génocides) sont marquées « à relire par un enseignant » avant un usage en classe.'),
        h('li', {}, 'Relecture par un enseignant des nouvelles leçons : citations et chiffres sont sourcés, mais certains sont signalés « à vérifier sur une édition de référence ».'),
        h('li', {}, 'Primaire (CP-CM2) et lycée : structure et programmes référencés, contenus à créer (lecture et numération au primaire, Python au lycée…).'),
        h('li', {}, 'Correction des rédactions par IA (locale ou distante) : non implémentée. Une IA distante ne serait activée qu’avec l’accord explicite d’un parent.'),
        h('li', {}, 'Synchronisation entre les deux ordinateurs : non prévue (export/import manuel).'),
        h('li', {}, 'Vérification par un enseignant de l’ensemble des contenus ; certains liens officiels sont marqués « non vérifiés » (sites protégés).'),
        h('li', {}, 'Lecture des formules par synthèse vocale, mode dyslexie, traduction : à étudier.')))));
}
