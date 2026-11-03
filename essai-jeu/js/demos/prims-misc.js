/**
 * Objets d'annotation et de mesure des expériences animées : flèches, étiquettes, textes,
 * rayons lumineux, courbe qui se trace, tableau de relevés qui se remplit, formes libres, emoji,
 * boîte de Petri, plante.
 */
import { esc, n, r1, rnd, col, fr, niceStep } from './util.js';

function arrowHead(x2, y2, ang, size, color) {
  const a1 = ang + Math.PI * 0.85; const a2 = ang - Math.PI * 0.85;
  return `<path d="M${r1(x2)},${r1(y2)} L${r1(x2 + size * Math.cos(a1))},${r1(y2 + size * Math.sin(a1))} L${r1(x2 + size * Math.cos(a2))},${r1(y2 + size * Math.sin(a2))} Z" style="fill:${color}"/>`;
}

function textWidth(t, size = 14) { return String(t).length * size * 0.56; }

export const MISC = {
  fleche: {
    defaults: { from: [0, 0], to: [100, 0], progress: 1, color: '#e11d48' },
    render(p) {
      const [x1, y1] = p.from.map(Number); const [tx, ty] = p.to.map(Number);
      const k = Math.max(0, Math.min(1, n(p.progress, 1)));
      if (k <= 0) return '';
      const x2 = x1 + (tx - x1) * k; const y2 = y1 + (ty - y1) * k;
      const c = col(p.color, '#e11d48');
      const ang = Math.atan2(y2 - y1, x2 - x1);
      let out = `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2 - 8 * Math.cos(ang))}" y2="${r1(y2 - 8 * Math.sin(ang))}" style="stroke:${c}" stroke-width="${n(p.width, 4)}" stroke-linecap="round"/>${arrowHead(x2, y2, ang, 14, c)}`;
      if (p.label) out += `<text class="d-txt d-txt--s d-halo" x="${r1((x1 + x2) / 2)}" y="${r1((y1 + y2) / 2 - 10)}" text-anchor="middle" style="fill:${c}">${esc(p.label)}</text>`; // étiquette au milieu de la flèche
      return out;
    },
    box: (p) => [Math.min(p.from[0], p.to[0]) - 6, Math.min(p.from[1], p.to[1]) - 6, Math.abs(p.to[0] - p.from[0]) + 12, Math.abs(p.to[1] - p.from[1]) + 12],
  },

  rayon: {
    defaults: { from: [0, 0], to: [100, 0], progress: 1, color: '#f59e0b', width: 3 },
    render(p) {
      const [x1, y1] = p.from.map(Number); const [tx, ty] = p.to.map(Number);
      const k = Math.max(0, Math.min(1, n(p.progress, 1)));
      if (k <= 0) return '';
      const x2 = x1 + (tx - x1) * k; const y2 = y1 + (ty - y1) * k;
      const c = col(p.color, '#f59e0b');
      const ang = Math.atan2(ty - y1, tx - x1);
      const mx = x1 + (x2 - x1) * 0.55; const my = y1 + (y2 - y1) * 0.55;
      return `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" style="stroke:${c}" stroke-width="${n(p.width, 3) + 6}" opacity=".18" stroke-linecap="round"/><line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" style="stroke:${c}" stroke-width="${n(p.width, 3)}" stroke-linecap="round"/>${k > 0.3 && p.arrow !== false ? arrowHead(mx, my, ang, 11, c) : ''}`;
    },
    box: (p) => [Math.min(p.from[0], p.to[0]) - 6, Math.min(p.from[1], p.to[1]) - 6, Math.abs(p.to[0] - p.from[0]) + 12, Math.abs(p.to[1] - p.from[1]) + 12],
  },

  etiquette: {
    defaults: { text: '' },
    // une étiquette (x, y = centre) reliée par un trait au point `to` qu'elle désigne
    render(p) {
      const x = n(p.x); const y = n(p.y);
      const w = textWidth(p.text, 14) + 22;
      const c = col(p.color, '#1d2433');
      let out = '';
      if (Array.isArray(p.to)) out += `<line class="d-leader" x1="${r1(x)}" y1="${r1(y)}" x2="${r1(n(p.to[0]))}" y2="${r1(n(p.to[1]))}"/><circle cx="${r1(n(p.to[0]))}" cy="${r1(n(p.to[1]))}" r="3.5" class="d-leader-dot"/>`;
      out += `<rect class="d-label-box" x="${r1(x - w / 2)}" y="${r1(y - 14)}" width="${r1(w)}" height="28" rx="8" style="stroke:${p.color ? c : ''}"/><text class="d-txt d-txt--s" x="${r1(x)}" y="${r1(y + 5)}" text-anchor="middle">${esc(p.text)}</text>`;
      return out;
    },
    box: (p) => { const w = textWidth(p.text, 14) + 22; return [n(p.x) - w / 2, n(p.y) - 14, w, 28]; },
  },

  texte: {
    defaults: { text: '', size: 16, anchor: 'middle' },
    render(p) {
      // taille en style (la feuille de style l'emporterait sur un simple attribut font-size)
      const style = `font-size:${n(p.size, 16)}px${p.color ? `;fill:${col(p.color, '#1d2433')}` : ''}`;
      return `<text class="d-txt d-halo" x="${n(p.x)}" y="${n(p.y)}" text-anchor="${esc(p.anchor)}" style="${style}" ${p.bold ? 'font-weight="700"' : ''}>${esc(p.text)}</text>`;
    },
    box: (p) => { const w = textWidth(p.text, n(p.size, 16)); const a = p.anchor === 'start' ? 0 : p.anchor === 'end' ? w : w / 2; return [n(p.x) - a, n(p.y) - n(p.size, 16), w, n(p.size, 16) * 1.3]; },
  },

  courbe: {
    defaults: { w: 280, h: 190, xRange: [0, 10], yRange: [0, 100], points: [], progress: 1, color: '#e11d48', xLabel: '', yLabel: '' },
    // panneau (x, y = coin supérieur gauche) ; la courbe se trace jusqu'à `progress` (0 à 1) de l'axe horizontal
    render(p) {
      const x = n(p.x); const y = n(p.y); const w = n(p.w); const h = n(p.h);
      const [x0, x1] = p.xRange.map(Number); const [y0, y1] = p.yRange.map(Number);
      // titre en haut, puis l'étiquette de l'axe vertical, puis le graphique : rien ne se chevauche
      const L = x + 44; const R = x + w - 12; const T = y + (p.title ? 30 : 16) + (p.yLabel ? 14 : 0); const B = y + h - 30;
      const X = (v) => L + (v - x0) / (x1 - x0 || 1) * (R - L);
      const Y = (v) => B - (v - y0) / (y1 - y0 || 1) * (B - T);
      let out = `<rect class="d-panel" x="${x}" y="${y}" width="${w}" height="${h}" rx="12"/>`;
      if (p.title) out += `<text class="d-txt d-txt--s" x="${x + 12}" y="${y + 20}" font-weight="700">${esc(p.title)}</text>`;
      const ys = niceStep(y1 - y0, 4); const xs = niceStep(x1 - x0, 5);
      for (let v = Math.ceil(y0 / ys) * ys; v <= y1 + 1e-9; v += ys) out += `<line class="d-gridline" x1="${L}" y1="${r1(Y(v))}" x2="${R}" y2="${r1(Y(v))}"/><text class="d-small" x="${L - 5}" y="${r1(Y(v) + 4)}" text-anchor="end">${fr(v, ys < 1 ? 1 : 0)}</text>`;
      for (let v = Math.ceil(x0 / xs) * xs; v <= x1 + 1e-9; v += xs) out += `<text class="d-small" x="${r1(X(v))}" y="${B + 14}" text-anchor="middle">${fr(v, xs < 1 ? 1 : 0)}</text>`;
      out += `<line class="d-axis" x1="${L}" y1="${B}" x2="${R}" y2="${B}"/><line class="d-axis" x1="${L}" y1="${B}" x2="${L}" y2="${T - 6}"/>`;
      if (p.xLabel) out += `<text class="d-small" x="${R}" y="${y + h - 4}" text-anchor="end">${esc(p.xLabel)}</text>`;
      if (p.yLabel) out += `<text class="d-small" x="${L + 4}" y="${T - 4}">${esc(p.yLabel)}</text>`;
      for (const z of Array.isArray(p.zones) ? p.zones : []) {
        // zone surlignée (ex. un palier), avec son nom en haut du graphique
        const za = X(Math.max(x0, Number(z.from))); const zb = X(Math.min(x1, Number(z.to)));
        out += `<rect x="${r1(za)}" y="${T}" width="${r1(Math.max(2, zb - za))}" height="${r1(B - T)}" fill="#ffb703" opacity=".18"/>`;
        if (z.label) out += `<text class="d-small d-halo" x="${r1((za + zb) / 2)}" y="${T + 12}" text-anchor="middle" font-weight="700">${esc(z.label)}</text>`;
      }
      if (p.ref && Array.isArray(p.ref.points)) {
        // courbe de référence en pointillés (ex. l'eau pure, pour comparer avec un mélange)
        out += `<polyline points="${p.ref.points.map((q) => `${r1(X(Number(q[0])))},${r1(Y(Number(q[1])))}`).join(' ')}" fill="none" stroke="#94a3b8" stroke-width="2.4" stroke-dasharray="6 5"/>`;
        if (p.ref.label) out += `<text class="d-small" x="${R - 4}" y="${T + 10}" text-anchor="end">- - ${esc(p.ref.label)}</text>`;
      }
      const pts = (p.points || []).map((q) => [Number(q[0]), Number(q[1])]);
      const lim = x0 + (x1 - x0) * Math.max(0, Math.min(1, n(p.progress, 1)));
      const drawn = [];
      for (let i = 0; i < pts.length; i++) {
        if (pts[i][0] <= lim) drawn.push(pts[i]);
        else { if (i > 0 && pts[i - 1][0] < lim) { const [ax, ay] = pts[i - 1]; const [bx, by] = pts[i]; drawn.push([lim, ay + (by - ay) * (lim - ax) / (bx - ax || 1)]); } break; }
      }
      const c = col(p.color, '#e11d48');
      if (drawn.length > 1) out += `<polyline points="${drawn.map(([a, b]) => `${r1(X(a))},${r1(Y(b))}`).join(' ')}" fill="none" style="stroke:${c}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`;
      if (drawn.length && n(p.progress, 1) > 0) { const [a, b] = drawn[drawn.length - 1]; out += `<circle cx="${r1(X(a))}" cy="${r1(Y(b))}" r="5" style="fill:${c}" stroke="#fff" stroke-width="2"/>`; }
      return out;
    },
    box: (p) => [n(p.x), n(p.y), n(p.w), n(p.h)],
  },

  releve: {
    defaults: { head: [], rows: [], w: 240 },
    // tableau de mesures (x, y = coin supérieur gauche) ; `shown` = nombre de lignes déjà relevées
    render(p) {
      const x = n(p.x); const y = n(p.y); const w = n(p.w);
      const rows = p.rows || []; const shown = p.shown === undefined ? rows.length : Math.max(0, Math.min(rows.length, Math.round(n(p.shown))));
      const cols = Math.max(1, (p.head || []).length || (rows[0] || []).length);
      const cw = w / cols; const rh = 26; const top = y + (p.title ? 26 : 0);
      let out = `<rect class="d-panel" x="${x}" y="${y}" width="${w}" height="${r1((p.title ? 26 : 0) + rh * (rows.length + 1) + 6)}" rx="10"/>`;
      if (p.title) out += `<text class="d-txt d-txt--s" x="${x + 10}" y="${y + 18}" font-weight="700">${esc(p.title)}</text>`;
      (p.head || []).forEach((hd, j) => { out += `<text class="d-txt d-txt--s" x="${r1(x + cw * j + cw / 2)}" y="${top + 18}" text-anchor="middle" font-weight="700">${esc(hd)}</text>`; });
      out += `<line class="d-axis" x1="${x + 6}" y1="${top + rh}" x2="${x + w - 6}" y2="${top + rh}"/>`;
      rows.forEach((row, i) => {
        if (i >= shown) return;
        const yy = top + rh * (i + 1);
        if (p.highlight !== false && i === shown - 1) out += `<rect x="${x + 4}" y="${yy + 2}" width="${w - 8}" height="${rh - 2}" rx="5" class="d-row-new"/>`;
        row.forEach((cell, j) => { out += `<text class="d-txt d-txt--s" x="${r1(x + cw * j + cw / 2)}" y="${yy + 18}" text-anchor="middle">${esc(cell)}</text>`; });
      });
      return out;
    },
    box: (p) => [n(p.x), n(p.y), n(p.w), (p.title ? 26 : 0) + 26 * ((p.rows || []).length + 1) + 6],
  },

  forme: {
    defaults: { shape: 'rect', fill: 'gris' },
    render(p) {
      const st = `style="fill:${p.fill === 'none' ? 'none' : col(p.fill, '#9ca3af')};stroke:${p.stroke ? col(p.stroke, '#334155') : 'none'}" stroke-width="${n(p.width, 2)}"`;
      switch (p.shape) {
        case 'ellipse': return `<ellipse cx="${n(p.x)}" cy="${n(p.y)}" rx="${n(p.w) / 2}" ry="${n(p.h) / 2}" ${st}/>`;
        case 'line': return `<line x1="${n(p.x)}" y1="${n(p.y)}" x2="${n(p.x) + n(p.w)}" y2="${n(p.y) + n(p.h)}" style="stroke:${col(p.stroke || p.fill, '#334155')}" stroke-width="${n(p.width, 2)}" stroke-linecap="round"/>`;
        case 'polygon': return `<polygon points="${(p.points || []).map((q) => `${n(q[0])},${n(q[1])}`).join(' ')}" ${st}/>`;
        case 'path': return /^[MmLlHhVvCcSsQqTtAaZz0-9.,\s-]+$/.test(p.d || '') ? `<path d="${p.d}" ${st}/>` : '';
        default: return `<rect x="${n(p.x)}" y="${n(p.y)}" width="${n(p.w)}" height="${n(p.h)}" rx="${n(p.rx, 4)}" ${st}/>`;
      }
    },
    box(p) {
      if (p.shape === 'ellipse') return [n(p.x) - n(p.w) / 2, n(p.y) - n(p.h) / 2, n(p.w), n(p.h)];
      if (p.shape === 'polygon' && Array.isArray(p.points) && p.points.length) {
        const xs = p.points.map((q) => n(q[0])); const ys = p.points.map((q) => n(q[1]));
        return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
      }
      return [n(p.x), n(p.y), n(p.w, 10), n(p.h, 10)]; // chemin : indiquer x, y, w, h (cadre englobant) pour le halo
    },
  },

  emoji: {
    defaults: { char: '🧪', size: 48 },
    render: (p) => `<text x="${n(p.x)}" y="${n(p.y)}" font-size="${n(p.size, 48)}" text-anchor="middle" dominant-baseline="central">${esc(p.char)}</text>${p.label ? `<text class="d-txt d-txt--s" x="${n(p.x)}" y="${r1(n(p.y) + n(p.size, 48) * 0.75)}" text-anchor="middle">${esc(p.label)}</text>` : ''}`,
    box: (p) => [n(p.x) - n(p.size, 48) / 2, n(p.y) - n(p.size, 48) / 2, n(p.size, 48), n(p.size, 48)],
  },

  'boite-petri': {
    defaults: { r: 60, colonies: 0, color: '#f59e0b' },
    render(p) {
      const x = n(p.x); const y = n(p.y); const R = n(p.r);
      let out = `<ellipse class="d-glass-fill" cx="${x}" cy="${y}" rx="${R}" ry="${r1(R * 0.42)}"/><ellipse cx="${x}" cy="${y}" rx="${R - 6}" ry="${r1(R * 0.42 - 4)}" fill="#fde68a" opacity=".55"/>`;
      const N = Math.round(n(p.colonies));
      for (let k = 0; k < N; k++) {
        const a = rnd(k) * Math.PI * 2; const d = Math.sqrt(rnd(k + 17)) * 0.82;
        out += `<ellipse cx="${r1(x + Math.cos(a) * d * (R - 10))}" cy="${r1(y + Math.sin(a) * d * (R * 0.42 - 6))}" rx="${r1(2 + rnd(k + 5) * 4)}" ry="${r1(1.4 + rnd(k + 5) * 2.4)}" style="fill:${col(p.color, '#f59e0b')}"/>`;
      }
      return out + (p.label ? `<text class="d-txt d-txt--s" x="${x}" y="${r1(y + R * 0.42 + 22)}" text-anchor="middle">${esc(p.label)}</text>` : '');
    },
    box: (p) => [n(p.x) - n(p.r), n(p.y) - n(p.r) * 0.42, 2 * n(p.r), n(p.r) * 0.84],
  },

  plante: {
    defaults: { h: 120, leaves: 6, color: '#2e7d32', wilt: 0 },
    render(p) {
      const x = n(p.x); const y = n(p.y); const h = n(p.h); const w = Math.max(0, Math.min(1, n(p.wilt)));
      const c = col(p.color, '#2e7d32');
      const tipX = x + w * h * 0.45; const tipY = y - h * (1 - w * 0.35);
      let out = `<path d="M${x},${y} Q${r1(x + w * h * 0.1)},${r1(y - h * 0.6)} ${r1(tipX)},${r1(tipY)}" fill="none" style="stroke:${c}" stroke-width="4" stroke-linecap="round"/>`;
      const L = Math.round(n(p.leaves, 6));
      for (let k = 0; k < L; k++) {
        const t = (k + 1) / (L + 1);
        const lx = x + (tipX - x) * t * t; const ly = y + (tipY - y) * t;
        const side = k % 2 ? 1 : -1;
        const droop = 20 + w * 50;
        out += `<path d="M${r1(lx)},${r1(ly)} q${r1(side * 14)},${r1(-12 + droop * 0.3)} ${r1(side * 30)},${r1(-4 + droop * 0.35)} q${r1(-side * 14)},${r1(8)} ${r1(-side * 30)},${r1(4 - droop * 0.35)}" style="fill:${c}" opacity=".9"/>`;
      }
      return out + (p.label ? `<text class="d-txt d-txt--s" x="${x}" y="${y + 20}" text-anchor="middle">${esc(p.label)}</text>` : '');
    },
    box: (p) => [n(p.x) - 40, n(p.y) - n(p.h), 80, n(p.h)],
  },
};
