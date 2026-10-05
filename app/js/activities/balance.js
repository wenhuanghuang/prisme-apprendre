/**
 * Balance à équations : des sacs identiques (contenu inconnu x) et des billes.
 * Mode « explore » : on peut retirer d'un seul côté → la balance penche (on voit pourquoi il faut agir des deux côtés).
 * Mode « solve » : seules les opérations sur les deux plateaux sont proposées ; le journal écrit l'équation à chaque étape.
 */
import { h } from '../ui/dom.js';
import { mathHTML } from '../ui/dom.js';

const SVGNS = 'http://www.w3.org/2000/svg';

function eqText(s) {
  const side = (bags, marbles) => {
    const parts = [];
    if (bags) parts.push(bags === 1 ? 'x' : `${bags}x`);
    if (marbles || !bags) parts.push(String(marbles));
    return parts.join(' + ');
  };
  return `${side(s.lb, s.lm)} = ${side(s.rb, s.rm)}`;
}

export function mount(container, config) {
  const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
  const x = num(config.x, 4);
  const mode = config.mode === 'explore' ? 'explore' : 'solve';
  const initial = { lb: num(config.a, 3), lm: num(config.b, 4), rb: num(config.c, 0), rm: num(config.d, 12), solved: null, opened: false };
  let s = { ...initial };
  const history = [];
  const log = h('ol', { class: 'log bal-log', 'aria-live': 'polite' });
  const status = h('p', { class: 'bal-status', 'aria-live': 'polite' });
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', '0 0 520 260');
  svg.setAttribute('class', 'lab-svg bal-svg');
  svg.setAttribute('role', 'img');

  const weight = (bags, marbles) => bags * x + marbles;
  const tilt = () => Math.max(-14, Math.min(14, (weight(s.rb, s.rm) - weight(s.lb, s.lm)) * 2.2));

  function drawPan(g, cx, cy, bags, marbles, solvedBag) {
    const items = [];
    let col = 0; let row = 0;
    const place = (w) => { const px = cx - 100 + col * 30; const py = cy - 16 - row * 28; col += w; if (col > 6.2) { col = 0; row++; } return [px, py]; };
    for (let i = 0; i < bags; i++) {
      const [px, py] = place(1.3);
      const opened = s.opened && solvedBag;
      items.push(`<g class="bal-bag"><path d="M${px} ${py + 24} q-4 -19 7 -24 h17 q11 5 7 24 z"/><path d="M${px + 7} ${py} l5 -6 l8 0 l5 6" class="bal-tie"/><text x="${px + 15}" y="${py + 18}" text-anchor="middle">${opened ? x : 'x'}</text></g>`);
    }
    for (let i = 0; i < marbles; i++) {
      const [px, py] = place(0.72);
      items.push(`<circle class="bal-marble" cx="${px + 10}" cy="${py + 14}" r="10"/>`);
    }
    g.innerHTML = `<path class="bal-pan" d="M${cx - 110} ${cy} q110 34 220 0 z"/><line class="bal-string" x1="${cx - 100}" y1="${cy}" x2="${cx}" y2="${cy - 120}"/><line class="bal-string" x1="${cx + 100}" y1="${cy}" x2="${cx}" y2="${cy - 120}"/>${items.join('')}`;
  }

  function draw() {
    const t = tilt();
    const rad = (t * Math.PI) / 180;
    const lx = 260 - 170 * Math.cos(rad); const ly = 70 - 170 * Math.sin(rad);
    const rx = 260 + 170 * Math.cos(rad); const ry = 70 + 170 * Math.sin(rad);
    svg.innerHTML = `<path class="bal-foot" d="M220 250 h80 l-25 -18 h-30 z"/><line class="bal-post" x1="260" y1="232" x2="260" y2="70"/>
      <line class="bal-beam" x1="${lx}" y1="${ly}" x2="${rx}" y2="${ry}"/><circle class="bal-pivot" cx="260" cy="70" r="7"/>
      <g id="pl" transform="translate(${lx - 90} ${ly + 120 - 70})"></g><g id="pr" transform="translate(${rx - 430} ${ry + 120 - 70})"></g>`;
    drawPan(svg.querySelector('#pl'), 90, 70, s.lb, s.lm, s.solved === 'left');
    drawPan(svg.querySelector('#pr'), 430, 70, s.rb, s.rm, s.solved === 'right');
    svg.setAttribute('aria-label', `Balance : à gauche ${s.lb} sac(s) et ${s.lm} bille(s), à droite ${s.rb} sac(s) et ${s.rm} bille(s). ${Math.abs(t) < 0.01 ? 'Équilibre.' : 'La balance penche.'}`);
    const balanced = Math.abs(t) < 0.01;
    status.textContent = balanced ? 'Équilibre.' : `Déséquilibre ! La balance penche vers la ${t < 0 ? 'gauche' : 'droite'} : l'égalité n'est plus vraie.`;
    status.className = `bal-status ${balanced ? '' : 'warn'}`;
    renderButtons();
  }

  function record(label) {
    const li = h('li', {});
    li.innerHTML = `${mathHTML(eqText(s))} <span class="muted small">— ${label}</span>`;
    log.append(li);
  }

  function apply(change, label) {
    history.push({ ...s });
    s = { ...s, ...change(s) };
    record(label);
    draw();
  }

  const btns = h('div', { class: 'btn-row bal-buttons', role: 'group', 'aria-label': 'Opérations' });
  function renderButtons() {
    const both = [];
    both.push(h('button', { type: 'button', class: 'btn btn--small', disabled: !(s.lm > 0 && s.rm > 0), onclick: () => apply((c) => ({ lm: c.lm - 1, rm: c.rm - 1 }), 'retirer 1 bille des deux côtés') }, '− 1 bille des deux côtés'));
    const minM = Math.min(s.lm, s.rm);
    if (minM > 1) both.push(h('button', { type: 'button', class: 'btn btn--small', onclick: () => apply((c) => ({ lm: c.lm - minM, rm: c.rm - minM }), `retirer ${minM} billes des deux côtés`) }, `− ${minM} billes des deux côtés`));
    both.push(h('button', { type: 'button', class: 'btn btn--small', disabled: !(s.lb > 0 && s.rb > 0), onclick: () => apply((c) => ({ lb: c.lb - 1, rb: c.rb - 1 }), 'retirer 1 sac des deux côtés') }, '− 1 sac des deux côtés'));
    const onlyBagsLeft = s.lb > 1 && s.lm === 0 && s.rb === 0;
    const onlyBagsRight = s.rb > 1 && s.rm === 0 && s.lb === 0;
    if (onlyBagsLeft || onlyBagsRight) {
      const k = onlyBagsLeft ? s.lb : s.rb; const m = onlyBagsLeft ? s.rm : s.lm;
      both.push(h('button', { type: 'button', class: 'btn btn--small btn--primary', onclick: () => {
        if (m % k !== 0) { status.textContent = `${m} billes ne se partagent pas en ${k} parts égales entières : ici, x ne serait pas un nombre entier de billes.`; return; }
        apply(() => (onlyBagsLeft ? { lb: 1, rm: m / k, solved: 'left' } : { rb: 1, lm: m / k, solved: 'right' }), `partager chaque plateau en ${k} parts égales`);
      } }, `Partager en ${k} parts égales`));
    }
    const single = mode === 'explore' ? [
      h('button', { type: 'button', class: 'btn btn--ghost btn--small', disabled: s.lm < 1, onclick: () => apply((c) => ({ lm: c.lm - 1 }), 'retirer 1 bille à GAUCHE seulement') }, '− 1 bille à gauche seulement'),
      h('button', { type: 'button', class: 'btn btn--ghost btn--small', disabled: s.rm < 1, onclick: () => apply((c) => ({ rm: c.rm - 1 }), 'retirer 1 bille à DROITE seulement') }, '− 1 bille à droite seulement'),
    ] : [];
    const tools = [
      h('button', { type: 'button', class: 'btn btn--ghost btn--small', disabled: !history.length, onclick: () => { s = history.pop(); log.lastChild && log.lastChild.remove(); draw(); } }, '↶ Annuler'),
      h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => { s = { ...initial }; history.length = 0; log.replaceChildren(); record('départ'); draw(); } }, 'Recommencer'),
    ];
    if (s.solved) tools.push(h('button', { type: 'button', class: 'btn btn--ghost btn--small', disabled: s.opened, onclick: () => { s = { ...s, opened: true }; draw(); status.textContent = `On ouvre le sac : il contient ${x} billes. Vérification réussie.`; } }, 'Ouvrir le sac pour vérifier'));
    btns.replaceChildren(...both, ...single, ...tools);
  }

  container.append(h('div', { class: 'bal' },
    h('div', { class: 'lab-grid' },
      h('div', {}, svg, status),
      h('div', { class: 'lab-controls' }, h('p', { class: 'small muted' }, mode === 'explore' ? 'Essaie aussi de retirer d’un seul côté : que se passe-t-il ?' : 'Chaque bouton agit sur les deux plateaux à la fois.'), btns,
        h('p', { class: 'small', style: { margin: '6px 0 0' } }, h('strong', {}, 'Journal des équations')), log))));
  record('départ');
  draw();
  return () => { container.replaceChildren(); };
}
