/**
 * Entraîner une IA (k plus proches voisins) : distinguer des pommes et des poires
 * à partir de deux mesures (allongement, couleur). L'élève ajoute des exemples, règle k,
 * teste des fruits et évalue l'IA sur des données de test (matrice d'erreurs).
 * Préréglage « biais » : données d'entraînement déséquilibrées → l'IA se trompe surtout sur la classe rare.
 */
import { h } from '../ui/dom.js';
import { formatNumber } from '../core/expr.js';
import { rng } from '../core/template.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const X = [0.8, 1.6]; const Y = [0, 10];
const CLASSES = { pomme: { label: 'Pomme', shape: 'circle' }, poire: { label: 'Poire', shape: 'triangle' } };

function gen(rand, cls, n, opts = {}) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const g = () => (rand() + rand() + rand()) / 3; // presque gaussien
    if (cls === 'pomme') out.push({ x: 0.86 + g() * 0.26, y: opts.yRange ? opts.yRange[0] + rand() * (opts.yRange[1] - opts.yRange[0]) : 1.5 + rand() * 7.5, label: 'pomme' });
    else out.push({ x: 1.08 + g() * 0.42, y: opts.yRange ? opts.yRange[0] + rand() * (opts.yRange[1] - opts.yRange[0]) : 1 + rand() * 6.5, label: 'poire' });
  }
  return out;
}

function datasets(preset) {
  const rand = rng(preset === 'biais' ? 77 : 42);
  const train = preset === 'biais'
    ? [...gen(rand, 'pomme', 26), ...gen(rand, 'poire', 3, { yRange: [1, 3] })]
    : [...gen(rand, 'pomme', 12), ...gen(rand, 'poire', 12)];
  const tr = rng(2026);
  const test = [...gen(tr, 'pomme', 20), ...gen(tr, 'poire', 20)];
  return { train, test };
}

const norm = (p) => [(p.x - X[0]) / (X[1] - X[0]), (p.y - Y[0]) / (Y[1] - Y[0])];

export function predict(train, p, k) {
  const [a, b] = norm(p);
  const near = train.map((q) => { const [c, d] = norm(q); return { q, dist: Math.hypot(a - c, b - d) }; }).sort((u, v) => u.dist - v.dist).slice(0, k);
  const votes = {};
  for (const { q } of near) votes[q.label] = (votes[q.label] || 0) + 1;
  const label = Object.entries(votes).sort((u, v) => v[1] - u[1])[0][0];
  return { label, near, votes };
}

export function mount(container, config) {
  const preset = config.preset === 'biais' ? 'biais' : 'fruits';
  let { train, test } = datasets(preset);
  let k = Number(config.k) || 3;
  let mode = 'tester'; let addLabel = 'pomme'; let showZones = false; let probe = null;
  const W = 460; const H = 360; const pad = 40;
  const sx = (x) => pad + ((x - X[0]) / (X[1] - X[0])) * (W - pad - 12);
  const sy = (y) => H - pad - ((y - Y[0]) / (Y[1] - Y[0])) * (H - pad - 12);
  const ix = (px) => X[0] + ((px - pad) / (W - pad - 12)) * (X[1] - X[0]);
  const iy = (py) => Y[0] + ((H - pad - py) / (H - pad - 12)) * (Y[1] - Y[0]);
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'lab-svg knn-svg');
  svg.setAttribute('role', 'img');
  const info = h('div', { class: 'knn-info', 'aria-live': 'polite' });
  const evalBox = h('div', { class: 'knn-eval' });

  const shape = (p, cls, extra = '') => {
    const x = sx(p.x); const y = sy(p.y);
    return CLASSES[p.label].shape === 'circle'
      ? `<circle cx="${x}" cy="${y}" r="6" class="knn-pt knn-${p.label} ${cls}" ${extra}/>`
      : `<path d="M${x} ${y - 7} L${x + 7} ${y + 5} L${x - 7} ${y + 5} Z" class="knn-pt knn-${p.label} ${cls}" ${extra}/>`;
  };

  function draw() {
    let zones = '';
    if (showZones) {
      const step = 20;
      for (let px = pad; px < W - 12; px += step) for (let py = 12; py < H - pad; py += step) {
        const pr = predict(train, { x: ix(px + step / 2), y: iy(py + step / 2) }, k).label;
        zones += `<rect x="${px}" y="${py}" width="${step}" height="${step}" class="knn-zone knn-zone-${pr}"/>`;
      }
    }
    const axes = `<line x1="${pad}" y1="${H - pad}" x2="${W - 12}" y2="${H - pad}" class="knn-axis"/><line x1="${pad}" y1="12" x2="${pad}" y2="${H - pad}" class="knn-axis"/>
      <text x="${(W + pad) / 2}" y="${H - 8}" text-anchor="middle" class="knn-lab">allongement (hauteur ÷ largeur)</text>
      <text x="14" y="${(H - pad) / 2}" text-anchor="middle" transform="rotate(-90 14 ${(H - pad) / 2})" class="knn-lab">couleur : vert → rouge</text>
      ${[0.8, 1, 1.2, 1.4, 1.6].map((v) => `<text x="${sx(v)}" y="${H - pad + 16}" text-anchor="middle" class="knn-tick">${formatNumber(v)}</text>`).join('')}`;
    let probeSvg = '';
    if (probe) {
      const pr = predict(train, probe, k);
      probeSvg = pr.near.map(({ q }) => `<line x1="${sx(probe.x)}" y1="${sy(probe.y)}" x2="${sx(q.x)}" y2="${sy(q.y)}" class="knn-link"/>`).join('')
        + `<circle cx="${sx(probe.x)}" cy="${sy(probe.y)}" r="9" class="knn-probe"/><text x="${sx(probe.x)}" y="${sy(probe.y) + 4}" text-anchor="middle" class="knn-q">?</text>`;
      info.textContent = `Fruit testé (allongement ${formatNumber(Math.round(probe.x * 100) / 100)}, couleur ${formatNumber(Math.round(probe.y * 10) / 10)}) : parmi ses ${k} plus proches voisins, ${pr.votes.pomme || 0} pomme(s) et ${pr.votes.poire || 0} poire(s). L'IA répond : ${CLASSES[pr.label].label.toLowerCase()}.`;
    }
    svg.innerHTML = zones + axes + train.map((p) => shape(p, '')).join('') + probeSvg;
    svg.setAttribute('aria-label', `Nuage de ${train.length} exemples d'entraînement : ${train.filter((p) => p.label === 'pomme').length} pommes et ${train.filter((p) => p.label === 'poire').length} poires.`);
    counts.textContent = `Exemples : ${train.filter((p) => p.label === 'pomme').length} pommes ● · ${train.filter((p) => p.label === 'poire').length} poires ▲`;
  }

  svg.addEventListener('click', (e) => {
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W; const py = ((e.clientY - r.top) / r.height) * H;
    const p = { x: Math.max(X[0], Math.min(X[1], ix(px))), y: Math.max(Y[0], Math.min(Y[1], iy(py))) };
    if (mode === 'ajouter') { train = [...train, { ...p, label: addLabel }]; probe = null; info.textContent = `Exemple ajouté : ${CLASSES[addLabel].label.toLowerCase()}.`; }
    else probe = p;
    draw();
  });

  function evaluate() {
    const m = { pomme: { pomme: 0, poire: 0 }, poire: { pomme: 0, poire: 0 } };
    for (const p of test) m[p.label][predict(train, p, k).label] += 1;
    const total = test.length; const ok = m.pomme.pomme + m.poire.poire;
    const rate = (c) => Math.round((m[c][c] / (m[c].pomme + m[c].poire)) * 100);
    evalBox.replaceChildren(
      h('p', {}, h('strong', {}, `Réussite sur ${total} fruits jamais vus : ${Math.round((ok / total) * 100)} %`)),
      h('table', { class: 'lab-table knn-matrix' },
        h('thead', {}, h('tr', {}, h('th', {}, 'Vrai fruit ↓ / réponse de l’IA →'), h('th', {}, 'Pomme'), h('th', {}, 'Poire'), h('th', {}, 'Réussite'))),
        h('tbody', {}, ['pomme', 'poire'].map((c) => h('tr', {}, h('th', {}, CLASSES[c].label), h('td', {}, String(m[c].pomme)), h('td', {}, String(m[c].poire)), h('td', {}, `${rate(c)} %`))))),
      h('p', { class: 'small muted' }, 'Les cases en diagonale sont les bonnes réponses ; les autres sont les erreurs. Une IA peut avoir un bon score global et se tromper beaucoup sur une catégorie.'));
  }

  const counts = h('p', { class: 'small' });
  const kInput = h('input', { type: 'range', min: 1, max: 9, step: 2, value: k, 'aria-label': 'Nombre de voisins k', oninput: (e) => { k = Number(e.target.value); kOut.textContent = String(k); draw(); evalBox.replaceChildren(); } });
  const kOut = h('output', {}, String(k));
  const modeSel = h('div', { class: 'btn-row', role: 'radiogroup', 'aria-label': 'Mode' });
  const drawModes = () => modeSel.replaceChildren(...[
    h('button', { type: 'button', class: `btn btn--small ${mode === 'tester' ? 'btn--primary' : 'btn--ghost'}`, role: 'radio', 'aria-checked': String(mode === 'tester'), onclick: () => { mode = 'tester'; drawModes(); } }, 'Tester un fruit'),
    h('button', { type: 'button', class: `btn btn--small ${mode === 'ajouter' ? 'btn--primary' : 'btn--ghost'}`, role: 'radio', 'aria-checked': String(mode === 'ajouter'), onclick: () => { mode = 'ajouter'; drawModes(); } }, 'Ajouter un exemple'),
    mode === 'ajouter' ? h('select', { class: 'field-input', style: { width: 'auto' }, 'aria-label': 'Étiquette de l’exemple', onchange: (e) => { addLabel = e.target.value; } }, h('option', { value: 'pomme', selected: addLabel === 'pomme' }, 'Pomme ●'), h('option', { value: 'poire', selected: addLabel === 'poire' }, 'Poire ▲')) : null].filter(Boolean));
  drawModes();

  // alternative clavier : saisir les mesures
  const fx = h('input', { class: 'field-input', type: 'number', step: '0.05', min: X[0], max: X[1], value: '1.2', 'aria-label': 'Allongement' });
  const fy = h('input', { class: 'field-input', type: 'number', step: '0.5', min: Y[0], max: Y[1], value: '5', 'aria-label': 'Couleur de 0 (vert) à 10 (rouge)' });
  const kbForm = h('form', { class: 'knn-kb', onsubmit: (e) => { e.preventDefault(); const p = { x: Number(fx.value), y: Number(fy.value) }; if (mode === 'ajouter') train = [...train, { ...p, label: addLabel }]; else probe = p; draw(); } },
    h('label', {}, 'Allongement', fx), h('label', {}, 'Couleur (0 à 10)', fy), h('button', { class: 'btn btn--small', type: 'submit' }, 'Valider ces mesures'));

  container.append(h('div', { class: 'knn' }, h('div', { class: 'lab-grid' },
    h('div', {}, svg, counts, info),
    h('div', { class: 'lab-controls' },
      modeSel,
      h('label', {}, h('span', {}, 'Nombre de voisins consultés k = ', kOut), kInput),
      h('label', { class: 'check-inline' }, h('input', { type: 'checkbox', onchange: (e) => { showZones = e.target.checked; draw(); } }), ' Montrer les zones de décision'),
      h('button', { type: 'button', class: 'btn btn--small', onclick: evaluate }, 'Évaluer sur des fruits jamais vus'),
      h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => { ({ train, test } = datasets(preset)); probe = null; evalBox.replaceChildren(); info.textContent = ''; draw(); } }, 'Réinitialiser les exemples'),
      h('details', {}, h('summary', { class: 'small' }, 'Saisie au clavier'), kbForm))),
    evalBox));
  draw();
  return () => { container.replaceChildren(); };
}
