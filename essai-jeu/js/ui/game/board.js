/**
 * Dessin du plateau (SVG) : serpentin de cases aux couleurs du spectre, du rouge au violet, jusqu'au Prisme.
 * Arcs-en-ciel et nuages sont reliés à leur case d'arrivée ; les pions se déplacent case par case.
 */
import { h, esc } from '../dom.js';
import { CASE_TYPES, COLUMNS, caseCell } from '../../engine/plateau.js';

const CELL = 100;
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Teinte d'une case : le spectre de la lumière, du rouge (départ) au violet (Prisme). */
export const hueOf = (i, n) => Math.round((i / n) * 280);

function center(i, rows) {
  const { row, col } = caseCell(i, COLUMNS);
  return { x: col * CELL + CELL / 2, y: (rows - 1 - row) * CELL + CELL / 2 };
}

const OFFSETS = [[-19, -17], [19, -17], [-19, 19], [19, 19]];

export function caseTitle(c, n) {
  const t = CASE_TYPES[c.type];
  const where = c.type === 'depart' ? 'Départ' : c.type === 'arrivee' ? `Case ${n} · le Prisme` : `Case ${c.i}`;
  const extra = c.type === 'pont' ? ` Raccourci jusqu’à la case ${c.to}.` : c.type === 'nuage' ? ` Rattrapage raté : retour à la case ${c.to}.` : '';
  return `${where}${c.type !== 'normale' && c.type !== 'depart' && c.type !== 'arrivee' ? ` · ${t.label}` : ''} — ${t.help}${extra}`;
}

/** Arc entre deux cases (raccourci ou glissade), avec une flèche. */
function linkPath(a, b) {
  const mx = (a.x + b.x) / 2; const my = (a.y + b.y) / 2;
  const dx = b.x - a.x; const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const bend = Math.min(60, len * 0.35);
  const cx = mx - (dy / len) * bend; const cy = my + (dx / len) * bend;
  // on s'arrête au bord des cases
  const t0 = 34 / len; const t1 = 1 - 38 / len;
  const q = (t) => ({ x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * cx + t * t * b.x, y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * cy + t * t * b.y });
  const s = q(t0); const e = q(t1);
  return `M${s.x.toFixed(1)} ${s.y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
}

/**
 * @param {object} game état de la partie
 * @returns {{ el: HTMLElement, update(game), target(i|null), move(playerId, path, opts): Promise }}
 */
export function boardView(game) {
  const { n, cases } = game.board;
  const rows = (n + 1) / COLUMNS;
  const W = COLUMNS * CELL; const H = rows * CELL;
  const pts = cases.map((c) => center(c.i, rows));
  const road = pts.map((p, k) => `${k ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
  const links = cases.filter((c) => c.to !== undefined).map((c) => `<path class="link link--${c.type}" d="${linkPath(pts[c.i], pts[c.to])}" marker-end="url(#arrow-${c.type})"/>`).join('');
  const caseSvg = cases.map((c) => {
    const p = pts[c.i];
    const t = CASE_TYPES[c.type];
    const special = !['normale', 'depart', 'arrivee'].includes(c.type);
    let inner;
    if (c.type === 'arrivee') {
      inner = `<rect class="case-bg" x="-44" y="-44" width="88" height="88" rx="22"/>
        <path class="prism" d="M0 -27 L24 18 H-24 Z"/>
        <path class="prism-ray" d="M-40 6 L-12 0"/>${['#e5484d', '#f59e0b', '#2a9d5c', '#3b4cca', '#7a4cc2'].map((col, k) => `<path d="M10 0 L40 ${-14 + k * 7}" stroke="${col}" class="prism-out"/>`).join('')}`;
    } else if (c.type === 'depart') {
      inner = `<rect class="case-bg" x="-42" y="-42" width="84" height="84" rx="20"/><text class="case-start" y="-24">Départ</text>`;
    } else {
      inner = `<rect class="case-bg" x="-40" y="-40" width="80" height="80" rx="18"/>
        <text class="case-num" x="-30" y="-22">${c.i}</text>
        ${special ? `<text class="case-icon" y="14">${esc(t.icon)}</text>` : `<circle class="case-dot" r="7"/>`}`;
    }
    return `<g class="case case--${c.type}" data-case="${c.i}" style="--h:${hueOf(c.i, n)}" transform="translate(${p.x} ${p.y})"><title>${esc(caseTitle(c, n))}</title>${inner}<rect class="case-ring" x="-46" y="-46" width="92" height="92" rx="24"/></g>`;
  }).join('');

  const svgWrap = h('div', { class: 'board-wrap' });
  svgWrap.innerHTML = `<svg class="board" viewBox="-6 -6 ${W + 12} ${H + 12}" role="img" aria-labelledby="board-desc">
    <desc id="board-desc"></desc>
    <defs>
      <marker id="arrow-pont" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" class="arrow-pont"/></marker>
      <marker id="arrow-nuage" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" class="arrow-nuage"/></marker>
      <linearGradient id="rainbow" x1="0" x2="1" y1="0" y2="0">${['#e5484d', '#f59e0b', '#eab308', '#2a9d5c', '#0f7b7d', '#3b4cca', '#7a4cc2'].map((col, k) => `<stop offset="${k / 6}" stop-color="${col}"/>`).join('')}</linearGradient>
    </defs>
    <path class="road" d="${road}"/>
    <path class="road-dash" d="${road}"/>
    ${caseSvg}
    ${links}
    <g class="pawns"></g>
  </svg>`;
  const svg = svgWrap.firstElementChild;
  const pawnsG = svg.querySelector('.pawns');
  const desc = svg.querySelector('desc');
  const pawns = new Map();
  const ns = 'http://www.w3.org/2000/svg';

  const placeOf = (idx, pos, count) => {
    const p = pts[Math.max(0, Math.min(n, pos))];
    const [ox, oy] = count === 1 ? [0, 0] : OFFSETS[idx % 4];
    return { x: p.x + ox, y: p.y + oy };
  };
  const setPawn = (g, xy) => { g.style.transform = `translate(${xy.x}px, ${xy.y}px)`; };

  game.players.forEach((pl, idx) => {
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', `pawn ${pl.kind === 'photon' ? 'pawn--photon' : ''}`);
    g.dataset.player = pl.id;
    const ring = document.createElementNS(ns, 'circle'); ring.setAttribute('r', '22'); ring.setAttribute('class', 'pawn-ring');
    const shadow = document.createElementNS(ns, 'ellipse'); shadow.setAttribute('rx', '15'); shadow.setAttribute('ry', '5'); shadow.setAttribute('cy', '17'); shadow.setAttribute('class', 'pawn-shadow');
    const body = document.createElementNS(ns, 'circle'); body.setAttribute('r', '16'); body.setAttribute('class', 'pawn-body'); body.setAttribute('fill', pl.color || '#1d2433');
    const txt = document.createElementNS(ns, 'text'); txt.setAttribute('class', 'pawn-sym'); txt.setAttribute('y', '6'); txt.textContent = pl.symbol || '●';
    g.append(ring, shadow, body, txt);
    pawnsG.append(g);
    pawns.set(pl.id, { g, idx });
    setPawn(g, placeOf(idx, pl.pos, game.players.length));
  });

  function describe(gm) {
    desc.textContent = `Plateau de ${n} cases. ${gm.players.map((p) => `${p.name} : ${p.finished ? 'dans le Prisme' : p.pos === 0 ? 'au départ' : `case ${p.pos}`}`).join(' ; ')}.`;
  }

  function update(gm) {
    gm.players.forEach((pl, idx) => {
      const pw = pawns.get(pl.id);
      if (!pw) return;
      setPawn(pw.g, placeOf(idx, pl.pos, gm.players.length));
      pw.g.classList.toggle('is-current', idx === gm.turn && !gm.over);
    });
    describe(gm);
  }

  function target(i) {
    svg.querySelectorAll('.case.is-target').forEach((c) => c.classList.remove('is-target'));
    if (i !== null && i !== undefined) { const c = svg.querySelector(`.case[data-case="${i}"]`); if (c) c.classList.add('is-target'); }
  }

  /** Déplace un pion de case en case (ou d'un seul bond pour un arc-en-ciel, un nuage, une carte). */
  async function move(playerId, from, to, { jump = false } = {}) {
    const pw = pawns.get(playerId);
    if (!pw) return;
    const count = game.players.length;
    if (reduced()) { setPawn(pw.g, placeOf(pw.idx, to, count)); return; }
    pawnsG.append(pw.g); // le pion qui bouge passe au premier plan
    if (jump || Math.abs(to - from) > 12) {
      pw.g.classList.add('is-jumping');
      setPawn(pw.g, placeOf(pw.idx, to, count));
      await wait(650);
      pw.g.classList.remove('is-jumping');
      return;
    }
    const dir = to > from ? 1 : -1;
    for (let k = from + dir; dir > 0 ? k <= to : k >= to; k += dir) {
      pw.g.classList.remove('is-hop'); void pw.g.getBoundingClientRect(); pw.g.classList.add('is-hop');
      setPawn(pw.g, placeOf(pw.idx, k, count));
      await wait(230);
    }
    pw.g.classList.remove('is-hop');
  }

  update(game);
  return { el: svgWrap, update, target, move };
}

/** Petite légende des cases, sous le plateau ou dans la règle du jeu. */
export function legend() {
  return h('ul', { class: 'board-legend' }, ['normale', 'defi', 'revision', 'carte', 'pont', 'nuage', 'arrivee'].map((t) => h('li', { class: `legend-${t}` },
    h('span', { class: 'legend-icon', 'aria-hidden': 'true' }, CASE_TYPES[t].icon || '•'),
    h('span', {}, h('strong', {}, CASE_TYPES[t].label), ' — ', CASE_TYPES[t].help))));
}
