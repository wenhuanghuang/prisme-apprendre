/**
 * Vérification d'une expérience animée (section « experience ») — voir docs/EXPERIENCES.md.
 * Une expérience sans objets (`items` vide) reste valide : elle se joue en mode « récit illustré ».
 */
import { PRIM_TYPES } from './prims.js';

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const isPt = (v) => Array.isArray(v) && v.length === 2 && v.every((x) => Number.isFinite(Number(x)));

export function checkDemo(demo, where = 'expérience') {
  if (!demo || typeof demo !== 'object') return [`${where} : champ « demo » manquant`];
  const errs = [];
  if (!Array.isArray(demo.steps) || !demo.steps.length) return [`${where} : « steps » doit être une liste non vide`];
  const ids = new Set();
  (demo.items || []).forEach((it, i) => {
    const at = `${where} › objet ${i + 1}${it && it.id ? ` « ${it.id} »` : ''}`;
    if (!it || !PRIM_TYPES.includes(it.type)) { errs.push(`${at} : type inconnu « ${it && it.type} » (attendu : ${PRIM_TYPES.join(', ')})`); return; }
    if (it.id) { if (ids.has(it.id)) errs.push(`${at} : identifiant en double`); ids.add(it.id); }
    const needsXY = !['paillasse', 'fil', 'fleche', 'rayon'].includes(it.type);
    if (needsXY && (!Number.isFinite(Number(it.x)) || !Number.isFinite(Number(it.y)))) errs.push(`${at} : « x » et « y » (nombres) obligatoires`);
    if (it.type === 'fil' && (!Array.isArray(it.points) || it.points.length < 2 || !it.points.every(isPt))) errs.push(`${at} : « points » = au moins 2 points [x, y]`);
    if (['fleche', 'rayon'].includes(it.type) && (!isPt(it.from) || !isPt(it.to))) errs.push(`${at} : « from » et « to » = [x, y]`);
    if (it.type === 'courbe' && it.points && !it.points.every(isPt)) errs.push(`${at} : « points » = liste de [x, y]`);
    for (const f of ['grains', 'ice', 'colonies', 'leaves', 'n']) if (it[f] !== undefined && !(Number(it[f]) >= 0 && Number(it[f]) <= 200)) errs.push(`${at} : « ${f} » entre 0 et 200`);
    if (it.decimals !== undefined && !(Number(it.decimals) >= 0 && Number(it.decimals) <= 6)) errs.push(`${at} : « decimals » entre 0 et 6`);
    if (it.type === 'eprouvette' && it.step !== undefined && !(Number(it.step) > 0)) errs.push(`${at} : « step » doit être positif`);
  });
  const W = Number(demo.w) || 800; const H = Number(demo.h) || 440;
  if (W < 200 || W > 1600 || H < 120 || H > 1000) errs.push(`${where} : taille de scène hors limites`);
  demo.steps.forEach((st, i) => {
    const at = `${where} › étape ${i + 1}`;
    if (!st || typeof st !== 'object') { errs.push(`${at} : objet attendu`); return; }
    if (!st.title) errs.push(`${at} : « title » manquant`);
    if (!st.text && !st.ask) errs.push(`${at} : « text » (explication) manquant`);
    for (const f of ['show', 'hide', 'focus']) for (const id of st[f] || []) if (!ids.has(id)) errs.push(`${at} : ${f} → objet « ${id} » inconnu`);
    for (const [j, a] of (st.do || []).entries()) {
      const aat = `${at} › action ${j + 1}`;
      if (!a || !ids.has(a.id)) { errs.push(`${aat} : objet « ${a && a.id} » inconnu`); continue; }
      if (!a.set && !a.to) errs.push(`${aat} : « set » ou « to » attendu`);
      for (const [k, v] of Object.entries(a.to || {})) {
        const ok = typeof v === 'number' || (typeof v === 'string' && HEX.test(v)) || (Array.isArray(v) && v.every((x) => typeof x === 'number' || isPt(x)));
        if (!ok) errs.push(`${aat} : « to.${k} » doit être un nombre, une couleur #rrggbb ou une liste de nombres (utilise « set » pour le reste)`);
      }
      for (const f of ['at', 'dur']) if (a[f] !== undefined && !(Number(a[f]) >= 0)) errs.push(`${aat} : « ${f} » doit être un nombre de secondes ≥ 0`);
    }
    if (st.duration !== undefined && !(Number(st.duration) >= 0 && Number(st.duration) <= 60)) errs.push(`${at} : « duration » entre 0 et 60 secondes`);
    if (st.ask) {
      const a = st.ask;
      if (!a.question) errs.push(`${at} : ask.question manquant`);
      if (!Array.isArray(a.choices) || a.choices.length < 2) errs.push(`${at} : ask.choices = au moins 2 propositions`);
      else if (!Number.isInteger(Number(a.answer)) || Number(a.answer) < 0 || Number(a.answer) >= a.choices.length) errs.push(`${at} : ask.answer = numéro (à partir de 0) de la bonne proposition`);
      if (!a.explain) errs.push(`${at} : ask.explain manquant (explication après la réponse)`);
    }
  });
  return errs;
}
