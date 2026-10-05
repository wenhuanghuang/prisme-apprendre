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
    h('div', { class: 'page-head' }, h('div', {}, h('p', { class: 'eyebrow' }, 'Version 0.1 — octobre 2026'), h('h1', {}, 'État du projet'),
      h('p', { class: 'lede' }, 'Une première version fonctionnelle, volontairement plus profonde que large. Voici ce qui est réellement fait, et ce qui ne l’est pas encore.'))),
    h('div', { class: 'kpis', style: { marginBottom: '18px' } },
      h('div', { class: 'kpi' }, h('b', {}, String(idx.lessons.length)), h('span', {}, 'leçons rédigées')),
      h('div', { class: 'kpi' }, h('b', {}, String(idx.exercises.length)), h('span', {}, `exercices (${byTrack.classe} classe, ${byTrack.approfondissement} ◆, ${byTrack.expert} ✦)`)),
      h('div', { class: 'kpi' }, h('b', {}, `${Math.round((qcm / Math.max(1, idx.exercises.length)) * 100)} %`), h('span', {}, 'de QCM (vérifications rapides)')),
      h('div', { class: 'kpi' }, h('b', {}, String(types.size)), h('span', {}, 'types de réponses construites')),
      h('div', { class: 'kpi' }, h('b', {}, `${authored}/${store.catalog.courses.length}`), h('span', {}, 'parcours rédigés / référencés'))),
    h('div', { class: 'grid grid--2' },
      h('section', { class: 'card' }, h('h2', {}, 'Terminé et testé'), h('ul', {},
        h('li', {}, 'Moteur adaptatif par compétence : maîtrise estimée, typologie des erreurs, idées fausses, prérequis, résurgences, révision espacée, recommandations expliquées (élève et parent).'),
        h('li', {}, 'Correcteurs qui analysent la démarche : calcul et équations étape par étape, expressions (forme développée, factorisée…), grandeurs avec unités, contre-exemples, réponses multiples, équations à inventer, programmes.'),
        h('li', {}, 'Réponses rédigées : critères visibles, auto-évaluation, nouvelles versions, validation par un adulte ; jamais déclarées fausses automatiquement.'),
        h('li', {}, 'Laboratoires : balance à équations, droite graduée, fractions, Pythagore, triangles, dés, loi d’Ohm, masse volumique, chronophotographie, poids, changement d’état, IA par l’exemple, mini modèle de langage, tortue (blocs puis texte).'),
        h('li', {}, 'Démonstration approfondie en mathématiques (5e, 4e, début 3e) et physique-chimie (cycle 4), plus programmation, IA, français et histoire.'),
        h('li', {}, 'Profils locaux par pseudo, tableau de bord parent, validation des rédactions, export/restauration/effacement, code parent, PWA hors connexion.'),
        h('li', {}, 'Matrice des programmes 2026-2027 (CP → Terminale) avec liens BO / Éduscol / Légifrance et distinction programme / approfondissement / hors programme.'),
        h('li', {}, 'Tests automatiques : moteur d’expressions, correcteurs, élèves fictifs, et rejeu des réponses types de chaque exercice.'))),
      h('section', { class: 'card' }, h('h2', {}, 'Reste à développer'), h('ul', {},
        h('li', {}, 'Les leçons des autres chapitres et des autres classes : la plupart des parcours ne contiennent encore que les domaines et notions officiels.'),
        h('li', {}, 'SVT, technologie, EMC, langues vivantes, arts, EPS : aucune leçon interactive pour l’instant.'),
        h('li', {}, 'Primaire (CP-CM2) et lycée : structure et programmes référencés, contenus à créer (lecture et numération au primaire, Python au lycée…).'),
        h('li', {}, 'Correction des rédactions par IA (locale ou distante) : non implémentée. Une IA distante ne serait activée qu’avec l’accord explicite d’un parent.'),
        h('li', {}, 'Synchronisation entre les deux ordinateurs : non prévue (export/import manuel).'),
        h('li', {}, 'Vérification par un enseignant de l’ensemble des contenus ; certains liens officiels sont marqués « non vérifiés » (sites protégés).'),
        h('li', {}, 'Lecture des formules par synthèse vocale, mode dyslexie, traduction : à étudier.')))));
}
