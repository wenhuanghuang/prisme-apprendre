/**
 * Niveaux supérieurs des générateurs de calcul : pour chaque générateur (par son id), une fonction
 * `approfondissement(rand, options)` et/ou `expert(rand, options)` qui renvoie un exercice plus exigeant.
 * Le niveau « classe » reste la fonction `make` du générateur (maths-pc.js). Voir docs/GENERATEURS.md.
 */
import { TIERS_NOMBRES } from './tiers-nombres.js';
import { TIERS_FRACTIONS } from './tiers-fractions.js';
import { TIERS_LITTERAL } from './tiers-litteral.js';
import { TIERS_GRANDEURS } from './tiers-grandeurs.js';
import { TIERS_MESURES } from './tiers-mesures.js';
import { TIERS_PHYSIQUE } from './tiers-physique.js';

export const TIERS = { ...TIERS_NOMBRES, ...TIERS_FRACTIONS, ...TIERS_LITTERAL, ...TIERS_GRANDEURS, ...TIERS_MESURES, ...TIERS_PHYSIQUE };
