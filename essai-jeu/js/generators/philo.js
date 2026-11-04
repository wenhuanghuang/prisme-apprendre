/**
 * Philosophie (terminale générale) : auteurs et œuvres, citations célèbres, repères du programme (distinctions
 * conceptuelles) et les dix-sept notions. Rattaché aux chapitres du parcours de référence philo-tle.
 */
import { pick, sample } from './gen-util.js';
import { qcm } from './primaire-savoirs.js';

const OEUVRES = [['Platon', 'La République'], ['Aristote', 'Éthique à Nicomaque'], ['Descartes', 'Discours de la méthode'], ['Pascal', 'Pensées'], ['Spinoza', 'Éthique'],
  ['Hobbes', 'Léviathan'], ['Rousseau', 'Du contrat social'], ['Kant', 'Critique de la raison pure'], ['Montesquieu', 'De l’esprit des lois'], ['Nietzsche', 'Ainsi parlait Zarathoustra'],
  ['Sartre', 'L’existentialisme est un humanisme'], ['Simone de Beauvoir', 'Le Deuxième Sexe'], ['Hannah Arendt', 'Condition de l’homme moderne'], ['Bergson', 'L’Évolution créatrice'], ['Marx', 'Le Capital']];
const CITATIONS = [
  ['« Je pense, donc je suis. »', 'Descartes', 'Discours de la méthode (1637) : même si je doute de tout, je ne peux douter que je pense.'],
  ['« L’homme est né libre, et partout il est dans les fers. »', 'Rousseau', 'Du contrat social (1762), livre I.'],
  ['« L’homme n’est qu’un roseau, le plus faible de la nature ; mais c’est un roseau pensant. »', 'Pascal', 'Pensées : la grandeur de l’homme tient à sa pensée.'],
  ['« L’existence précède l’essence. »', 'Sartre', 'L’existentialisme est un humanisme (1946) : l’homme se définit par ses actes.'],
  ['« On ne naît pas femme : on le devient. »', 'Simone de Beauvoir', 'Le Deuxième Sexe (1949).'],
  ['« Dieu est mort. »', 'Nietzsche', 'Le Gai Savoir : la fin des valeurs absolues héritées.'],
  ['« Je sais que je ne sais rien. »', 'Socrate', 'Formule attribuée à Socrate, rapportée par Platon (Apologie de Socrate).'],
  ['« Le cœur a ses raisons que la raison ne connaît point. »', 'Pascal', 'Pensées.'],
  ['« L’homme est un animal politique. »', 'Aristote', 'Les Politiques : l’être humain s’accomplit dans la vie de la cité.'],
  ['« L’homme est un loup pour l’homme. »', 'Hobbes', 'Formule reprise de Plaute dans Du citoyen (1642) : sans État, c’est la guerre de chacun contre chacun.'],
  ['« Que sais-je ? »', 'Montaigne', 'Essais : la devise du doute sceptique.'],
  ['« Rien de grand ne s’est accompli dans le monde sans passion. »', 'Hegel', 'La Raison dans l’histoire.'],
  ['« Les philosophes n’ont fait qu’interpréter le monde de différentes manières ; ce qui importe, c’est de le transformer. »', 'Marx', 'Thèses sur Feuerbach (1845), onzième thèse.'],
  ['« L’enfer, c’est les autres. »', 'Sartre', 'Huis clos (1944) : nous dépendons du regard d’autrui sur nous.'],
  ['« Agis de telle sorte que tu traites l’humanité, dans ta personne et dans celle d’autrui, toujours en même temps comme une fin, jamais simplement comme un moyen. »', 'Kant', 'Fondements de la métaphysique des mœurs (1785).'],
  ['« Ose savoir ! Aie le courage de te servir de ton propre entendement. »', 'Kant', 'Qu’est-ce que les Lumières ? (1784).'],
  ['« La mort n’est rien pour nous. »', 'Épicure', 'Lettre à Ménécée : quand nous sommes, la mort n’est pas là ; quand elle est là, nous ne sommes plus.'],
  ['« Une vie sans examen ne vaut pas d’être vécue. »', 'Socrate', 'Propos rapporté par Platon dans l’Apologie de Socrate.'],
  ['« L’homme est condamné à être libre. »', 'Sartre', 'L’existentialisme est un humanisme (1946) : nous sommes responsables de ce que nous faisons.'],
  ['« Penser, c’est dire non. »', 'Alain', 'Propos : penser commence par refuser l’évidence et le préjugé.'],
  ['« Le travail éloigne de nous trois grands maux : l’ennui, le vice et le besoin. »', 'Voltaire', 'Candide (1759), chapitre 30.'],
  ['« Le bonheur est un idéal non de la raison mais de l’imagination. »', 'Kant', 'Fondements de la métaphysique des mœurs : chacun se représente le bonheur à sa façon.'],
];
const PHILOSOPHES = ['Descartes', 'Rousseau', 'Pascal', 'Sartre', 'Simone de Beauvoir', 'Nietzsche', 'Socrate', 'Kant', 'Platon', 'Spinoza',
  'Aristote', 'Hobbes', 'Montaigne', 'Hegel', 'Marx', 'Épicure', 'Alain', 'Voltaire'];
const REPERES = [
  ['Une loi peut être légale sans être…', 'légitime (juste au regard de la morale ou du droit naturel)', ['écrite', 'votée', 'appliquée'], 'Légal : conforme à la loi en vigueur ; légitime : fondé en droit ou en justice.'],
  ['Convaincre, par opposition à persuader, c’est…', 's’adresser à la raison, par des arguments', ['jouer sur les émotions', 'menacer', 'mentir habilement'], 'Persuader touche les sentiments ; convaincre s’appuie sur des raisons que chacun peut examiner.'],
  ['Une chose contingente est une chose…', 'qui aurait pu ne pas être ou être autrement', ['qui ne peut pas ne pas être', 'impossible', 'éternelle'], 'Le nécessaire, lui, ne peut pas être autrement.'],
  ['Distinguer « en fait » et « en droit », c’est opposer…', 'ce qui est à ce qui doit être', ['le passé au futur', 'le vrai au faux', 'la ville à la campagne'], 'En fait : ce qui se constate ; en droit : ce qui est légitime ou fondé.'],
  ['L’origine d’une chose se distingue de son fondement :', 'l’origine est le commencement dans le temps, le fondement est ce qui la justifie', ['ce sont deux synonymes', 'le fondement est toujours plus ancien', 'l’origine est toujours une cause morale'], 'Exemple : l’origine historique de l’État et le fondement de son autorité.'],
  ['Objectif s’oppose à…', 'subjectif', ['concret', 'nécessaire', 'universel'], 'Objectif : qui vaut indépendamment du point de vue de chacun ; subjectif : qui dépend du sujet.'],
  ['Transcendant s’oppose à…', 'immanent', ['abstrait', 'particulier', 'contingent'], 'Transcendant : qui est au-delà, extérieur ; immanent : qui est contenu dans la chose même.'],
  ['Croire se distingue de savoir car…', 'savoir suppose une justification ou une preuve', ['croire est toujours faux', 'savoir est toujours religieux', 'ce sont deux synonymes'], 'On peut croire ce qui est vrai sans le savoir.'],
  ['Expliquer, par opposition à comprendre, c’est…', 'rendre compte d’un phénomène par ses causes', ['saisir le sens d’une intention', 'juger une action', 'raconter une histoire'], 'On explique la chute d’un corps ; on comprend le sens d’un geste ou d’une parole.'],
  ['L’obligation se distingue de la contrainte car…', 'on reconnaît une obligation, alors que la contrainte s’impose par la force', ['ce sont deux synonymes', 'la contrainte est morale, l’obligation physique', 'l’obligation est toujours illégale'], 'On est contraint par une force ; on est obligé par une règle qu’on reconnaît.'],
  ['Un exemple, à la différence d’une preuve…', 'illustre une idée sans la démontrer', ['démontre toujours une thèse', 'est toujours faux', 'est une loi scientifique'], 'Un seul contre-exemple peut en revanche réfuter une affirmation générale.'],
  ['Ce qui est universel…', 'vaut pour tous les cas, sans exception', ['vaut pour la plupart des cas', 'ne concerne qu’un individu', 'dépend de chacun'], 'Le général vaut pour la plupart des cas, le particulier pour certains, le singulier pour un seul.'],
  ['Une connaissance intuitive, par opposition à discursive, est…', 'saisie immédiatement, d’un seul coup', ['obtenue par une suite de raisonnements', 'toujours fausse', 'apprise dans un livre'], 'Le discursif procède par étapes, d’une idée à l’autre.'],
  ['Être « en puissance », par opposition à « en acte », c’est…', 'avoir la possibilité de devenir quelque chose', ['être déjà pleinement réalisé', 'être impossible', 'avoir de la force physique'], 'Chez Aristote, la graine est un arbre en puissance ; l’arbre est en acte.'],
  ['Médiat s’oppose à immédiat :', 'ce qui est médiat passe par un intermédiaire', ['le médiat est plus rapide', 'ce sont deux synonymes', 'le médiat est toujours faux'], 'Une connaissance médiate passe par un raisonnement, un signe ou un instrument.'],
  ['Ce qui est essentiel, par opposition à accidentel, est…', 'ce qui appartient à la nature même d’une chose', ['ce qui arrive par hasard', 'ce qui se voit le plus', 'ce qui est rare'], 'Un accident, au sens philosophique, peut changer sans que la chose cesse d’être ce qu’elle est.'],
  ['L’analyse, par opposition à la synthèse, consiste à…', 'décomposer un tout en ses éléments', ['réunir des éléments en un tout', 'deviner sans preuve', 'refuser de penser'], 'La synthèse fait le chemin inverse : elle recompose.'],
  ['L’analogie se distingue de la simple ressemblance car elle est…', 'une ressemblance de rapports : A est à B ce que C est à D', ['une parfaite identité', 'une simple différence', 'toujours une erreur'], 'Exemple : le pilote est au navire ce que le gouvernant est à la cité.'],
];
const NOTIONS = ['l’art', 'le bonheur', 'la conscience', 'le devoir', 'l’État', 'l’inconscient', 'la justice', 'le langage', 'la liberté', 'la nature', 'la raison', 'la religion', 'la science', 'la technique', 'le temps', 'le travail', 'la vérité'];
const NON_NOTIONS = ['l’amour', 'la politesse', 'le sport', 'la mode', 'l’argent', 'la famille'];

export const PHILO = [{
  id: 'philo-tle', subject: 'philo', levels: ['tle'], label: 'Philosophie : auteurs, citations, repères et notions', skill: 'philo.tle', chapters: ['philo-tle-2019-structure', 'philo-tle-2019-notions', 'philo-tle-2019-perspectives'],
  description: 'Associer auteurs et œuvres, attribuer une citation, maîtriser les repères (légal/légitime, persuader/convaincre…) et les dix-sept notions.',
  tracks: ['classe', 'approfondissement'], options: [],
  make(rand) {
    const k = pick(rand, ['oeuvre', 'citation', 'repere', 'repere', 'notion']);
    if (k === 'oeuvre') { const [a, o] = pick(rand, OEUVRES); return qcm(rand, [`Qui a écrit « ${o} » ?`, a, OEUVRES.map(([x]) => x).filter((x) => x !== a), `« ${o} » est une œuvre de ${a}.`]); }
    if (k === 'citation') { const [c, a, why] = pick(rand, CITATIONS); return qcm(rand, [`Qui a écrit (ou dit) : ${c}`, a, PHILOSOPHES.filter((x) => x !== a), why]); }
    if (k === 'repere') return qcm(rand, pick(rand, REPERES), { hint: 'Les repères sont des couples de notions à distinguer avec précision.' });
    const odd = pick(rand, NON_NOTIONS); const others = sample(rand, NOTIONS, 3);
    return qcm(rand, ['Lequel de ces termes ne fait pas partie des dix-sept notions du programme de philosophie ?', odd, others, `Les dix-sept notions : ${NOTIONS.join(', ')}.`]);
  },
}];
export const PHILO_SKILLS = [{ subject: 'philo', id: 'philo.tle', label: 'Philosophie : auteurs, citations, repères et notions', level: 'tle', track: 'classe', status: 'programme', domain: 'lycee', prereqs: [], editorialLevel: true }];
