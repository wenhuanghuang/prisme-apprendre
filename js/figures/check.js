/**
 * Vérification d'une figure décrite en JSON (voir docs/FIGURES.md) : types connus, points existants,
 * nombres valides. Partagée par le validateur de contenus et par le moteur de rendu.
 */

export const GEOMETRY_TYPES = ['point', 'segment', 'line', 'ray', 'polygon', 'circle', 'arc', 'angle', 'arrow', 'text', 'rect'];
export const CHART_TYPES = ['bars', 'linechart', 'pie', 'timeline', 'table'];
export const FIGURE_TYPES = [...GEOMETRY_TYPES, ...CHART_TYPES];

/** « 3 », « −2,5 », 4 → nombre ; sinon NaN (les paramètres d'exercice arrivent interpolés en chaînes). */
export function num(v) {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && /^\s*[−-]?\d+(?:[.,]\d+)?\s*$/.test(v)) return Number(v.trim().replace('−', '-').replace(',', '.'));
  return NaN;
}

const isPair = (v) => Array.isArray(v) && v.length === 2 && v.every((x) => Number.isFinite(num(x)));

/** @returns {string[]} problèmes trouvés (vide si la figure est correcte) */
export function checkFigure(fig, where = 'figure') {
  const errs = [];
  if (!fig || typeof fig !== 'object' || Array.isArray(fig)) return [`${where} : objet attendu`];
  if (!fig.alt || typeof fig.alt !== 'string') errs.push(`${where} : description « alt » obligatoire`);
  if (!Array.isArray(fig.items) || !fig.items.length) return [...errs, `${where} : « items » doit être une liste non vide`];
  for (const k of ['w', 'h']) if (fig[k] !== undefined && !(num(fig[k]) >= 80 && num(fig[k]) <= 1200)) errs.push(`${where} : ${k} hors de 80-1200`);
  if (fig.frame) {
    for (const ax of ['x', 'y']) {
      const r = fig.frame[ax];
      if (!isPair(r) || !(num(r[0]) < num(r[1]))) errs.push(`${where} : frame.${ax} doit être [min, max] avec min < max`);
    }
    if (fig.frame.grid !== undefined && typeof fig.frame.grid !== 'boolean' && !(num(fig.frame.grid) > 0)) errs.push(`${where} : frame.grid doit être true ou un pas positif`);
  }
  const points = new Set(fig.items.filter((it) => it && it.type === 'point' && it.id).map((it) => String(it.id)));
  const ref = (v, field, at) => {
    if (v === undefined) { errs.push(`${at} : champ « ${field} » manquant`); return; }
    if (isPair(v)) return;
    if (!points.has(String(v))) errs.push(`${at} : point « ${v} » inconnu (déclare-le avec un élément { "type": "point", "id": "${v}" })`);
  };
  const charts = fig.items.filter((it) => it && CHART_TYPES.includes(it.type)).length;
  if (charts > 1) errs.push(`${where} : un seul diagramme (bars, linechart, pie, timeline, table) par figure`);
  if (charts && fig.items.length > 1) errs.push(`${where} : un diagramme occupe toute la figure, sans autre élément`);
  fig.items.forEach((it, i) => {
    const at = `${where} › élément ${i + 1}${it && it.type ? ` (${it.type})` : ''}`;
    if (!it || !FIGURE_TYPES.includes(it.type)) { errs.push(`${at} : type inconnu (attendu : ${FIGURE_TYPES.join(', ')})`); return; }
    const needNum = (...fields) => { for (const f of fields) if (!Number.isFinite(num(it[f]))) errs.push(`${at} : « ${f} » doit être un nombre`); };
    switch (it.type) {
      case 'point': if (!it.id) errs.push(`${at} : « id » manquant`); needNum('x', 'y'); break;
      case 'segment': case 'arrow': ref(it.from, 'from', at); ref(it.to, 'to', at); break;
      case 'line': if (!Array.isArray(it.through) || it.through.length !== 2) errs.push(`${at} : « through » = deux points`); else it.through.forEach((p) => ref(p, 'through', at)); break;
      case 'ray': ref(it.from, 'from', at); ref(it.through, 'through', at); break;
      case 'polygon': if (!Array.isArray(it.points) || it.points.length < 3) errs.push(`${at} : au moins 3 points`); else it.points.forEach((p) => ref(p, 'points', at)); break;
      case 'circle': ref(it.center, 'center', at); if (it.through !== undefined) ref(it.through, 'through', at); else needNum('r'); break;
      case 'arc': ref(it.center, 'center', at); needNum('r', 'start', 'end'); break;
      case 'angle': ref(it.vertex, 'vertex', at); ref(it.from, 'from', at); ref(it.to, 'to', at); break;
      case 'text': needNum('x', 'y'); if (it.text === undefined || it.text === '') errs.push(`${at} : « text » manquant`); break;
      case 'rect': needNum('x', 'y', 'w', 'h'); break;
      case 'bars': case 'pie':
        if (!Array.isArray(it.data) || it.data.length < 2) errs.push(`${at} : « data » = au moins 2 valeurs {label, value}`);
        else it.data.forEach((d, j) => { if (!d || d.label === undefined || !Number.isFinite(num(d.value)) || num(d.value) < 0) errs.push(`${at} : donnée ${j + 1} invalide (label + value positive)`); });
        break;
      case 'linechart':
        if (!Array.isArray(it.series) || !it.series.length) errs.push(`${at} : « series » manquant`);
        else it.series.forEach((s, j) => { if (!s || !Array.isArray(s.points) || s.points.length < 2 || !s.points.every(isPair)) errs.push(`${at} : série ${j + 1} : au moins 2 points [x, y]`); });
        break;
      case 'timeline':
        needNum('from', 'to');
        if (num(it.from) >= num(it.to)) errs.push(`${at} : « from » doit précéder « to »`);
        if (it.step !== undefined && !(num(it.step) > 0)) errs.push(`${at} : « step » doit être un nombre positif`);
        for (const e of it.events || []) if (!Number.isFinite(num(e.year)) || !e.label) errs.push(`${at} : évènement invalide (year + label)`);
        for (const p of it.periods || []) if (!Number.isFinite(num(p.from)) || !Number.isFinite(num(p.to)) || !p.label) errs.push(`${at} : période invalide (from, to, label)`);
        if (!(it.events || []).length && !(it.periods || []).length) errs.push(`${at} : au moins un évènement ou une période`);
        break;
      case 'table':
        if (!Array.isArray(it.rows) || !it.rows.length) errs.push(`${at} : « rows » manquant`);
        else if (it.head && it.rows.some((r) => !Array.isArray(r) || r.length !== it.head.length)) errs.push(`${at} : chaque ligne doit avoir autant de cases que « head »`);
        break;
      default: break;
    }
  });
  return errs;
}
