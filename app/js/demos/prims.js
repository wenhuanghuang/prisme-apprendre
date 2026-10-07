/** Catalogue des objets disponibles dans les expériences animées (voir docs/EXPERIENCES.md). */
import { LAB } from './prims-lab.js';
import { ELEC } from './prims-elec.js';
import { MISC } from './prims-misc.js';

export const PRIMS = { ...LAB, ...ELEC, ...MISC };
export const PRIM_TYPES = Object.keys(PRIMS);
