/**
 * Typologie des erreurs. Chaque diagnostic produit par un correcteur porte un de ces types.
 * Le profil élève compte les occurrences par compétence pour distinguer une notion non comprise
 * d'une simple erreur de calcul, et repérer les difficultés anciennes qui réapparaissent.
 */
export const ERROR_TYPES = {
  notion: {
    label: 'Notion non comprise',
    short: 'notion',
    family: 'comprehension',
    student: 'Ta réponse correspond à une idée fausse fréquente sur cette notion.',
    parent: "La réponse correspond à une conception erronée identifiée (ce n'est pas une étourderie).",
  },
  prerequis: {
    label: 'Prérequis manquant',
    short: 'prérequis',
    family: 'comprehension',
    student: "L'erreur vient d'une notion plus ancienne dont on a besoin ici.",
    parent: "L'erreur provient d'une notion antérieure (prérequis) qui n'est pas encore solide.",
  },
  calcul: {
    label: 'Erreur de calcul',
    short: 'calcul',
    family: 'execution',
    student: 'La méthode est bonne, une opération a été mal effectuée.',
    parent: "Méthode correcte, erreur d'exécution sur une opération.",
  },
  signe: {
    label: 'Erreur de signe',
    short: 'signe',
    family: 'execution',
    student: 'Un signe + ou − a été perdu ou inversé en route.',
    parent: 'Un signe a été perdu ou inversé (fréquent en calcul littéral et avec les relatifs).',
  },
  lecture: {
    label: "Mauvaise lecture de l'énoncé",
    short: 'lecture',
    family: 'lecture',
    student: "Ta réponse répond à une autre question que celle posée : relis l'énoncé.",
    parent: "La réponse correspond à une autre grandeur que celle demandée (lecture de l'énoncé).",
  },
  methode: {
    label: 'Méthode mal appliquée',
    short: 'méthode',
    family: 'execution',
    student: 'Tu connais la méthode, mais une étape a été mal appliquée.',
    parent: 'Les premières étapes sont justes ; une étape de la méthode est mal appliquée.',
  },
  'sans-justification': {
    label: 'Réponse juste non justifiée',
    short: 'justification',
    family: 'communication',
    student: 'Le résultat est juste, mais il manque la justification.',
    parent: 'Résultat correct obtenu sans justification ou explication de la démarche.',
  },
  forme: {
    label: 'Forme demandée non respectée',
    short: 'forme',
    family: 'execution',
    student: "Ta réponse est juste, mais elle n'est pas écrite sous la forme demandée.",
    parent: 'Réponse mathématiquement correcte mais pas sous la forme demandée (développée, réduite, irréductible…).',
  },
  unite: {
    label: "Erreur d'unité ou de conversion",
    short: 'unité',
    family: 'execution',
    student: "Attention à l'unité : la valeur ne correspond pas à l'unité indiquée.",
    parent: "Erreur d'unité ou de conversion d'unité.",
  },
  precision: {
    label: 'Arrondi ou précision',
    short: 'arrondi',
    family: 'execution',
    student: "La valeur est proche : vérifie l'arrondi demandé.",
    parent: 'Valeur proche du résultat attendu : arrondi ou précision non respectés.',
  },
  raisonnement: {
    label: 'Raisonnement incomplet',
    short: 'raisonnement',
    family: 'comprehension',
    student: 'Le raisonnement saute une étape ou utilise un argument insuffisant.',
    parent: 'Raisonnement incomplet (exemple au lieu de preuve, argument manquant).',
  },
  inconnue: {
    label: 'Erreur non identifiée',
    short: 'à analyser',
    family: 'inconnue',
    student: "Ce n'est pas encore la réponse attendue.",
    parent: "Erreur que l'analyse automatique ne sait pas classer avec certitude.",
  },
};

export const ERROR_FAMILIES = {
  comprehension: 'Compréhension',
  execution: 'Exécution',
  lecture: 'Lecture',
  communication: 'Communication',
  inconnue: 'Non classée',
};

export function errorLabel(type) {
  return (ERROR_TYPES[type] && ERROR_TYPES[type].label) || 'Erreur';
}

/**
 * Le diagnostic standard renvoyé par tous les correcteurs.
 * verdict : 'correct' | 'partiel' | 'incorrect' | 'incertain' | 'a-valider'
 *   - 'incertain' : le logiciel ne sait pas trancher → il le dit et propose une validation humaine.
 *   - 'a-valider' : réponse rédigée, la validation revient à l'élève (auto-évaluation) puis au parent.
 */
export function diagnosis(fields) {
  return {
    verdict: 'incorrect',
    score: 0,
    errorType: null,
    misconception: null,
    prerequisite: null,
    stepsOk: null,
    stepsTotal: null,
    firstBadStep: null,
    feedback: '',
    details: [],
    needsHuman: false,
    ...fields,
  };
}
