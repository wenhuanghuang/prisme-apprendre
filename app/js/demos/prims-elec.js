/**
 * Électricité des expériences animées : pile, lampe, DEL, résistance, moteur, interrupteur,
 * multimètre et fils (avec le courant qui circule). Les composants sont placés par leur CENTRE ;
 * leurs bornes sont indiquées dans docs/EXPERIENCES.md pour y relier les fils.
 */
import { esc, n, r1, fr, tag, lcd, col } from './util.js';

export const ELEC = {
  fil: {
    defaults: { points: [], current: 0, color: '#334155' },
    render(p, ctx) {
      const pts = (p.points || []).map((q) => `${r1(n(q[0]))},${r1(n(q[1]))}`).join(' ');
      if (!pts) return '';
      let out = `<polyline class="d-wire" points="${pts}" style="stroke:${col(p.color, '#334155')}"/>`;
      const c = Math.max(0, Math.min(2, n(p.current)));
      if (c > 0) out += `<polyline class="d-current" points="${pts}" stroke-dashoffset="${r1(-ctx.clock * 55 * c)}"/>`;
      return out;
    },
    box(p) {
      const xs = (p.points || []).map((q) => n(q[0])); const ys = (p.points || []).map((q) => n(q[1]));
      return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs) || 4, Math.max(...ys) - Math.min(...ys) || 4];
    },
    animated: (p) => n(p.current) > 0,
  },

  pile: {
    defaults: { label: '4,5 V' },
    // bornes : (x − 40, y) borne −, (x + 40, y) borne +
    render(p) {
      const x = n(p.x); const y = n(p.y);
      return `<rect class="d-battery" x="${x - 34}" y="${y - 17}" width="68" height="34" rx="6"/><rect x="${x + 34}" y="${y - 7}" width="6" height="14" rx="2" class="d-terminal"/><rect x="${x - 40}" y="${y - 5}" width="6" height="10" rx="2" class="d-terminal"/><text class="d-sign" x="${x + 22}" y="${y + 5}" text-anchor="middle">+</text><text class="d-sign" x="${x - 22}" y="${y + 5}" text-anchor="middle">−</text><text class="d-txt d-txt--s" x="${x}" y="${y + 5}" text-anchor="middle">${esc(p.label)}</text>`;
    },
    box: (p) => [n(p.x) - 42, n(p.y) - 19, 84, 38],
  },

  lampe: {
    defaults: { on: 0 },
    // bornes : (x − 12, y + 34) et (x + 12, y + 34)
    render(p) {
      const x = n(p.x); const y = n(p.y); const on = Math.max(0, Math.min(1, n(p.on)));
      let out = '';
      if (on > 0) out += `<circle cx="${x}" cy="${y - 4}" r="${r1(26 + on * 26)}" fill="#fde047" opacity="${r1(on * 0.45 * 100) / 100}"/>`;
      out += `<circle class="d-bulb" cx="${x}" cy="${y - 4}" r="20" style="fill:${on > 0 ? `rgba(253,224,71,${r1((0.25 + on * 0.7) * 100) / 100})` : ''}"/>`;
      out += `<path d="M${x - 7},${y + 12} L${x - 4},${y - 6} q4,-6 8,0 L${x + 7},${y + 12}" fill="none" stroke="${on > 0 ? '#f59e0b' : '#64748b'}" stroke-width="1.6"/>`;
      out += `<rect class="d-socket" x="${x - 12}" y="${y + 14}" width="24" height="16" rx="3"/><line class="d-wire-thin" x1="${x - 12}" y1="${y + 30}" x2="${x - 12}" y2="${y + 34}"/><line class="d-wire-thin" x1="${x + 12}" y1="${y + 30}" x2="${x + 12}" y2="${y + 34}"/>`;
      return out + tag(x, y - 40, p.label);
    },
    box: (p) => [n(p.x) - 24, n(p.y) - 28, 48, 64],
  },

  del: {
    defaults: { on: 0, color: '#ef4444' },
    // bornes : (x − 22, y) et (x + 22, y)
    render(p) {
      const x = n(p.x); const y = n(p.y); const on = Math.max(0, Math.min(1, n(p.on)));
      const c = col(p.color, '#ef4444');
      let out = on > 0 ? `<circle cx="${x}" cy="${y - 6}" r="${r1(16 + on * 14)}" style="fill:${c}" opacity="${r1(on * 0.35 * 100) / 100}"/>` : '';
      out += `<path d="M${x - 9},${y + 4} L${x - 9},${y - 8} A9,9 0 0 1 ${x + 9},${y - 8} L${x + 9},${y + 4} Z" style="fill:${c}" opacity="${r1((0.45 + on * 0.55) * 100) / 100}" stroke="#334155" stroke-width="1.2"/>`;
      out += `<line class="d-wire-thin" x1="${x - 22}" y1="${y}" x2="${x - 9}" y2="${y}"/><line class="d-wire-thin" x1="${x + 9}" y1="${y}" x2="${x + 22}" y2="${y}"/>`;
      return out + tag(x, y - 30, p.label);
    },
    box: (p) => [n(p.x) - 22, n(p.y) - 20, 44, 28],
  },

  resistance: {
    defaults: {},
    // bornes : (x − 38, y) et (x + 38, y)
    render(p) {
      const x = n(p.x); const y = n(p.y);
      return `<line class="d-wire-thin" x1="${x - 38}" y1="${y}" x2="${x - 24}" y2="${y}"/><line class="d-wire-thin" x1="${x + 24}" y1="${y}" x2="${x + 38}" y2="${y}"/><rect class="d-resistor" x="${x - 24}" y="${y - 9}" width="48" height="18" rx="7"/><rect x="${x - 14}" y="${y - 9}" width="4" height="18" fill="#92400e"/><rect x="${x - 4}" y="${y - 9}" width="4" height="18" fill="#111827"/><rect x="${x + 6}" y="${y - 9}" width="4" height="18" fill="#e11d48"/>${tag(x, y - 26, p.label)}`;
    },
    box: (p) => [n(p.x) - 38, n(p.y) - 10, 76, 20],
  },

  moteur: {
    defaults: { speed: 0 },
    // bornes : (x − 34, y) et (x + 34, y)
    render(p, ctx) {
      const x = n(p.x); const y = n(p.y);
      const a = ctx.clock * n(p.speed) * 360;
      return `<line class="d-wire-thin" x1="${x - 34}" y1="${y}" x2="${x - 22}" y2="${y}"/><line class="d-wire-thin" x1="${x + 22}" y1="${y}" x2="${x + 34}" y2="${y}"/><circle class="d-device d-device--light" cx="${x}" cy="${y}" r="22"/><text class="d-txt" x="${x}" y="${y + 6}" text-anchor="middle" font-weight="700">M</text><g transform="rotate(${r1(a % 360)} ${x} ${y - 40})"><ellipse cx="${x}" cy="${y - 52}" rx="5" ry="12" class="d-blade"/><ellipse cx="${x}" cy="${y - 28}" rx="5" ry="12" class="d-blade"/></g><line class="d-metal" x1="${x}" y1="${y - 22}" x2="${x}" y2="${y - 40}" stroke-width="3"/>${tag(x, y + 40, p.label)}`;
    },
    box: (p) => [n(p.x) - 24, n(p.y) - 66, 48, 90],
    animated: (p) => n(p.speed) > 0,
  },

  interrupteur: {
    defaults: { closed: false },
    // bornes : (x − 32, y) et (x + 32, y)
    render(p) {
      const x = n(p.x); const y = n(p.y);
      const a = p.closed ? 0 : -32;
      return `<line class="d-wire-thin" x1="${x - 32}" y1="${y}" x2="${x - 20}" y2="${y}"/><line class="d-wire-thin" x1="${x + 20}" y1="${y}" x2="${x + 32}" y2="${y}"/><circle cx="${x - 20}" cy="${y}" r="4" class="d-terminal"/><circle cx="${x + 20}" cy="${y}" r="4" class="d-terminal"/><line class="d-lever" x1="${x - 20}" y1="${y}" x2="${r1(x - 20 + 42 * Math.cos(a * Math.PI / 180))}" y2="${r1(y + 42 * Math.sin(a * Math.PI / 180))}"/>${tag(x, y + 26, p.label || (p.closed ? 'fermé' : 'ouvert'))}`;
    },
    box: (p) => [n(p.x) - 32, n(p.y) - 26, 64, 34],
  },

  multimetre: {
    defaults: { mode: 'A', value: 0, unit: 'A', decimals: 2 },
    // bornes : (x − 18, y + 42) noire « COM » et (x + 18, y + 42) rouge
    render(p) {
      const x = n(p.x); const y = n(p.y);
      return `<rect class="d-meter" x="${x - 42}" y="${y - 46}" width="84" height="98" rx="10"/>${lcd(x, y - 22, `${fr(n(p.value), n(p.decimals))} ${p.unit}`, { w: 70, cls: 'd-lcd--small' })}<circle cx="${x}" cy="${y + 12}" r="13" class="d-knob"/><text class="d-txt d-txt--s" x="${x}" y="${y + 17}" text-anchor="middle" font-weight="700">${esc(p.mode)}</text><circle cx="${x - 18}" cy="${y + 42}" r="5" fill="#111827"/><circle cx="${x + 18}" cy="${y + 42}" r="5" fill="#e11d48"/>${tag(x, y - 62, p.label)}`;
    },
    box: (p) => [n(p.x) - 42, n(p.y) - 46, 84, 98],
  },
};
