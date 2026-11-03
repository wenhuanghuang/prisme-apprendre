/**
 * Matériel de laboratoire des expériences animées : verrerie, chauffage, instruments de mesure,
 * objets, loupe sur les particules. Chaque objet : `defaults`, `render(p, ctx)` → chaîne SVG,
 * `box(p)` → [x, y, l, h] (pour l'entourer), `animated(p)` si l'image bouge toute seule.
 * Convention : la verrerie et les objets posés sont placés par le MILIEU DE LEUR BASE (x, y).
 */
import { esc, n, r1, frac, rnd, col, fr, tag, lcd } from './util.js';

/* ---------- contenu d'un récipient : liquide, glaçons, bulles, grains, trouble, vapeur ---------- */
function contents(p, ctx, inner) {
  // inner : { left, right, bottom, height, widthAt(y) } — zone intérieure du récipient
  const { left, right, bottom, height } = inner;
  const lh = Math.max(0, Math.min(1, n(p.level))) * height;
  const ys = bottom - lh;
  let out = '';
  if (lh > 0.5) {
    const pts = inner.poly ? inner.poly(ys) : `${left},${bottom} ${right},${bottom} ${right},${r1(ys)} ${left},${r1(ys)}`;
    out += `<polygon class="d-liquid" points="${pts}" style="fill:${col(p.liquid)}"/>`;
    if (p.top && n(p.top.level) > 0) {
      const th = n(p.top.level) * height;
      const yt = ys - th;
      out += `<polygon class="d-liquid" points="${inner.poly ? inner.poly(yt, ys) : `${left},${r1(ys)} ${right},${r1(ys)} ${right},${r1(yt)} ${left},${r1(yt)}`}" style="fill:${col(p.top.color, '#f2c94c')}"/>`;
    }
    out += `<line class="d-surface" x1="${r1(left + 2)}" y1="${r1(ys)}" x2="${r1(right - 2)}" y2="${r1(ys)}"/>`;
    if (n(p.cloudy) > 0) out += `<polygon points="${inner.poly ? inner.poly(ys) : `${left},${bottom} ${right},${bottom} ${right},${r1(ys)} ${left},${r1(ys)}`}" fill="#ffffff" opacity="${r1(Math.min(0.85, n(p.cloudy) * 0.75) * 100) / 100}"/>`;
  }
  // précipité (dépôt au fond)
  if (n(p.precipitate) > 0) {
    const ph = Math.min(height * 0.25, 4 + n(p.precipitate) * height * 0.18);
    out += `<path d="M${left + 2},${bottom} Q${(left + right) / 2},${r1(bottom - ph * 1.6)} ${right - 2},${bottom} Z" style="fill:${col(p.precipitateColor, '#f8fafc')}" class="d-solid"/>`;
  }
  // grains (sucre, sel, sable) au fond, qui disparaissent quand ils se dissolvent
  const grains = Math.round(n(p.grains));
  if (grains > 0 && n(p.dissolve) < 1) {
    const op = 1 - Math.max(0, Math.min(1, n(p.dissolve)));
    for (let k = 0; k < grains; k++) {
      const gx = left + 6 + rnd(k + 3) * (right - left - 12);
      const gy = bottom - 3 - rnd(k + 7) * Math.min(10, grains / 3);
      out += `<rect x="${r1(gx)}" y="${r1(gy - 3)}" width="4" height="4" rx="1" style="fill:${col(p.grainColor, '#ffffff')}" stroke="#94a3b8" stroke-width=".6" opacity="${r1(op * 100) / 100}"/>`;
    }
  }
  // glaçons : flottent à la surface s'il y a du liquide, sinon empilés au fond ; rapetissent avec `solid`
  const ice = Math.round(n(p.ice));
  const solid = Math.max(0, Math.min(1, p.solid === undefined ? 1 : n(p.solid)));
  if (ice > 0 && solid > 0.02) {
    const size = Math.max(6, 24 * Math.sqrt(solid) * Math.min(1, (right - left) / 110));
    for (let k = 0; k < ice; k++) {
      const per = Math.max(1, Math.floor((right - left - 8) / (size + 4)));
      const row = Math.floor(k / per); const colK = k % per;
      const cx = left + 6 + colK * (size + 4) + (row % 2) * size * 0.4 + rnd(k) * 3;
      const cy = lh > size ? ys - size * 0.75 + rnd(k + 1) * 3 : bottom - size - 2 - row * (size + 2);
      const rot = (rnd(k + 9) - 0.5) * 24;
      out += `<rect class="d-ice" x="${r1(cx)}" y="${r1(cy)}" width="${r1(size)}" height="${r1(size)}" rx="${r1(size * 0.2)}" transform="rotate(${r1(rot)} ${r1(cx + size / 2)} ${r1(cy + size / 2)})"/>`;
    }
  }
  // bulles qui montent (ébullition, dégagement gazeux)
  const b = Math.max(0, Math.min(1, n(p.bubbles)));
  if (b > 0 && lh > 6) {
    const count = Math.round(3 + 18 * b);
    for (let k = 0; k < count; k++) {
      const ph = frac(ctx.clock * (0.35 + 0.9 * b) * (0.7 + rnd(k) * 0.6) + rnd(k + 11));
      const bx = left + 6 + rnd(k + 5) * (right - left - 12) + Math.sin(ctx.clock * 3 + k) * 2;
      const by = bottom - 4 - ph * (lh - 6);
      const br = 1.6 + rnd(k + 2) * 3.2 * (0.5 + b * 0.6) * (0.6 + ph * 0.6);
      out += `<circle class="d-bubble" cx="${r1(bx)}" cy="${r1(by)}" r="${r1(br)}"/>`;
    }
  }
  return out;
}

function steam(cx, top, w, amount, clock) {
  const a = Math.max(0, Math.min(1, n(amount)));
  if (a <= 0) return '';
  let out = '';
  for (let k = 0; k < 3; k++) {
    const ph = frac(clock * 0.35 + k / 3);
    const x = cx - w * 0.25 + k * w * 0.25;
    const y = top - 6 - ph * 60;
    out += `<path class="d-steam" d="M${r1(x)},${r1(y + 26)} q-8,-7 0,-13 q8,-7 0,-13" opacity="${r1(a * (1 - ph) * 0.8 * 100) / 100}"/>`;
  }
  return out;
}

const glassBox = (p) => [n(p.x) - n(p.w) / 2, n(p.y) - n(p.h), n(p.w), n(p.h)];
const liquidAnimated = (p) => n(p.bubbles) > 0 || n(p.steam) > 0;

export const LAB = {
  paillasse: {
    defaults: { y: 380 },
    render: (p, ctx) => `<rect class="d-bench" x="0" y="${n(p.y)}" width="${ctx.W}" height="${ctx.H - n(p.y)}"/><line class="d-bench-edge" x1="0" y1="${n(p.y)}" x2="${ctx.W}" y2="${n(p.y)}"/>`,
    box: (p) => [0, n(p.y), 800, 40],
  },

  becher: {
    defaults: { w: 120, h: 150, level: 0.5, liquid: 'eau', grad: true },
    render(p, ctx) {
      const x = n(p.x); const y = n(p.y); const w = n(p.w); const h = n(p.h);
      const left = x - w / 2; const right = x + w / 2; const top = y - h;
      let out = contents(p, ctx, { left: left + 3, right: right - 3, bottom: y - 3, height: h * 0.9 });
      if (p.spoon) out += `<line class="d-spoon" x1="${r1(x + w * 0.1)}" y1="${r1(top - 24)}" x2="${r1(x - w * 0.18)}" y2="${r1(y - 10)}"/>`;
      out += `<path class="d-glass" d="M${r1(left - 6)},${r1(top)} L${r1(left)},${r1(top + 7)} L${r1(left)},${r1(y - 8)} Q${r1(left)},${r1(y)} ${r1(left + 8)},${r1(y)} L${r1(right - 8)},${r1(y)} Q${r1(right)},${r1(y)} ${r1(right)},${r1(y - 8)} L${r1(right)},${r1(top)}"/>`;
      if (p.grad) for (let k = 1; k <= 4; k++) out += `<line class="d-grad" x1="${r1(right - 14)}" y1="${r1(y - h * 0.18 * k)}" x2="${r1(right - 4)}" y2="${r1(y - h * 0.18 * k)}"/>`;
      out += steam(x, top, w, p.steam, ctx.clock);
      return out + tag(x, top - 16, p.label);
    },
    box: glassBox,
    animated: liquidAnimated,
  },

  tube: {
    defaults: { w: 34, h: 150, level: 0.5, liquid: 'eau' },
    render(p, ctx) {
      const x = n(p.x); const y = n(p.y); const w = n(p.w); const h = n(p.h);
      const rr = w / 2; const left = x - rr; const right = x + rr; const top = y - h;
      const poly = (ys, ye) => {
        const b = ye === undefined ? y - 2 : ye;
        const pts = [];
        if (ye === undefined) for (let a = 0; a <= 180; a += 20) pts.push(`${r1(x + (rr - 3) * Math.cos(a * Math.PI / 180))},${r1(y - rr + (rr - 3) * Math.sin(a * Math.PI / 180))}`);
        else pts.push(`${r1(right - 3)},${r1(b)}`, `${r1(left + 3)},${r1(b)}`);
        return `${pts.join(' ')} ${r1(left + 3)},${r1(Math.min(ys, b))} ${r1(right - 3)},${r1(Math.min(ys, b))}`;
      };
      let out = contents(p, ctx, { left: left + 3, right: right - 3, bottom: y - 3, height: h * 0.92, poly });
      if (p.stopper) out += `<rect class="d-stopper" x="${r1(left - 2)}" y="${r1(top - 14)}" width="${r1(w + 4)}" height="18" rx="4"/>`;
      out += `<path class="d-glass" d="M${r1(left - 4)},${r1(top)} L${r1(left)},${r1(top + 5)} L${r1(left)},${r1(y - rr)} A${r1(rr)},${r1(rr)} 0 0 0 ${r1(right)},${r1(y - rr)} L${r1(right)},${r1(top + 5)} L${r1(right + 4)},${r1(top)}"/>`;
      out += steam(x, top, w * 2, p.steam, ctx.clock);
      return out + tag(x, top - (p.stopper ? 28 : 16), p.label);
    },
    box: glassBox,
    animated: liquidAnimated,
  },

  erlenmeyer: {
    defaults: { w: 130, h: 160, level: 0.35, liquid: 'eau' },
    render(p, ctx) {
      const x = n(p.x); const y = n(p.y); const w = n(p.w); const h = n(p.h);
      const nw = w * 0.3; const bodyH = h * 0.72; const top = y - h;
      const half = (yy) => { const d = Math.min(bodyH, Math.max(0, y - yy)); return w / 2 - (w / 2 - nw / 2) * (d / bodyH); };
      const poly = (ys, ye) => {
        const b = ye === undefined ? y - 3 : ye;
        const hb = half(b) - 4; const ht = half(ys) - 4;
        return `${r1(x - hb)},${r1(b)} ${r1(x + hb)},${r1(b)} ${r1(x + ht)},${r1(ys)} ${r1(x - ht)},${r1(ys)}`;
      };
      let out = contents(p, ctx, { left: x - w / 2 + 6, right: x + w / 2 - 6, bottom: y - 3, height: bodyH, poly });
      if (p.stopper) out += `<rect class="d-stopper" x="${r1(x - nw / 2 - 2)}" y="${r1(top - 12)}" width="${r1(nw + 4)}" height="18" rx="4"/>`;
      out += `<path class="d-glass" d="M${r1(x - nw / 2 - 4)},${r1(top)} L${r1(x - nw / 2)},${r1(top + 5)} L${r1(x - nw / 2)},${r1(y - bodyH)} L${r1(x - w / 2)},${r1(y - 8)} Q${r1(x - w / 2)},${r1(y)} ${r1(x - w / 2 + 9)},${r1(y)} L${r1(x + w / 2 - 9)},${r1(y)} Q${r1(x + w / 2)},${r1(y)} ${r1(x + w / 2)},${r1(y - 8)} L${r1(x + nw / 2)},${r1(y - bodyH)} L${r1(x + nw / 2)},${r1(top + 5)} L${r1(x + nw / 2 + 4)},${r1(top)}"/>`;
      out += steam(x, top, nw * 2, p.steam, ctx.clock);
      return out + tag(x, top - (p.stopper ? 26 : 16), p.label);
    },
    box: glassBox,
    animated: liquidAnimated,
  },

  eprouvette: {
    defaults: { w: 46, h: 210, max: 100, value: 50, step: 10, liquid: 'eau' },
    render(p, ctx) {
      const x = n(p.x); const y = n(p.y); const w = n(p.w); const h = n(p.h);
      const left = x - w / 2; const right = x + w / 2; const base = 12; const inner = h - base - 22;
      const bottom = y - base;
      const level = Math.max(0, Math.min(1, n(p.value) / n(p.max, 100)));
      let out = `<rect class="d-foot" x="${r1(x - w * 0.9)}" y="${r1(y - base)}" width="${r1(w * 1.8)}" height="${base}" rx="3"/>`;
      out += contents({ ...p, level }, ctx, { left: left + 3, right: right - 3, bottom, height: inner });
      if (p.objet) {
        const s = n(p.objet.size, 16);
        out += `<path d="M${r1(x - s / 2)},${r1(bottom - 1)} q${r1(s * 0.1)},${r1(-s)} ${r1(s * 0.55)},${r1(-s * 0.9)} q${r1(s * 0.5)},${r1(s * 0.1)} ${r1(s * 0.45)},${r1(s * 0.9)} z" style="fill:${col(p.objet.color, '#78716c')}" class="d-solid"/>`;
      }
      out += `<path class="d-glass" d="M${r1(left - 5)},${r1(y - h)} L${r1(left)},${r1(y - h + 6)} L${r1(left)},${r1(bottom)} L${r1(right)},${r1(bottom)} L${r1(right)},${r1(y - h + 6)}"/>`;
      const max = n(p.max, 100) > 0 ? n(p.max, 100) : 100;
      const step = Math.max(max / 100, n(p.step, 10) > 0 ? n(p.step, 10) : 10); // au plus 100 graduations
      for (let v = step; v <= max + 1e-9; v += step) {
        const yy = bottom - (v / max) * inner;
        const major = Math.round(v / step) % 2 === 0;
        out += `<line class="d-grad" x1="${r1(left)}" y1="${r1(yy)}" x2="${r1(left + (major ? 14 : 8))}" y2="${r1(yy)}"/>`;
        if (major) out += `<text class="d-small" x="${r1(left - 6)}" y="${r1(yy + 4)}" text-anchor="end">${fr(v)}</text>`;
      }
      out += `<text class="d-small" x="${r1(right + 6)}" y="${r1(y - h + 18)}">mL</text>`;
      return out + tag(x, y - h - 16, p.label);
    },
    box: glassBox,
    animated: liquidAnimated,
  },

  plaque: {
    defaults: { w: 150, on: false, power: 1 },
    render(p, ctx) {
      const x = n(p.x); const y = n(p.y); const w = n(p.w);
      const heat = p.on ? Math.max(0, Math.min(1, n(p.power, 1))) : 0;
      const glow = heat ? 0.55 + 0.25 * heat + Math.sin(ctx.clock * 5) * 0.05 : 0;
      let out = `<rect class="d-device" x="${r1(x - w / 2)}" y="${r1(y - 30)}" width="${r1(w)}" height="30" rx="6"/>`;
      out += `<rect x="${r1(x - w / 2 + 8)}" y="${r1(y - 36)}" width="${r1(w - 16)}" height="8" rx="3" class="d-plate"/>`;
      if (heat) out += `<rect x="${r1(x - w / 2 + 8)}" y="${r1(y - 36)}" width="${r1(w - 16)}" height="8" rx="3" fill="#ff5a1f" opacity="${r1(glow * 100) / 100}"/>`;
      out += `<circle cx="${r1(x + w / 2 - 22)}" cy="${r1(y - 15)}" r="8" class="d-knob"/><line x1="${r1(x + w / 2 - 22)}" y1="${r1(y - 15)}" x2="${r1(x + w / 2 - 22 + 6 * Math.cos(-2.4 + heat * 2.6))}" y2="${r1(y - 15 + 6 * Math.sin(-2.4 + heat * 2.6))}" class="d-knob-line"/>`;
      out += `<circle cx="${r1(x - w / 2 + 18)}" cy="${r1(y - 15)}" r="4" fill="${heat ? '#ef4444' : '#64748b'}"/>`;
      return out + tag(x, y + 18, p.label);
    },
    box: (p) => [n(p.x) - n(p.w) / 2, n(p.y) - 36, n(p.w), 36],
    animated: (p) => Boolean(p.on),
  },

  flamme: {
    defaults: { on: false, power: 1 },
    render(p, ctx) {
      const x = n(p.x); const y = n(p.y);
      let out = `<rect class="d-device" x="${r1(x - 26)}" y="${r1(y - 10)}" width="52" height="10" rx="3"/><rect class="d-device" x="${r1(x - 8)}" y="${r1(y - 62)}" width="16" height="54" rx="2"/>`;
      if (p.on) {
        const pw = Math.max(0.3, Math.min(1.4, n(p.power, 1)));
        const f = 1 + Math.sin(ctx.clock * 17) * 0.06 + Math.sin(ctx.clock * 7.3) * 0.05;
        const hh = 58 * pw * f;
        out += `<path d="M${x - 11},${y - 62} Q${x - 15},${r1(y - 62 - hh * 0.5)} ${x},${r1(y - 62 - hh)} Q${x + 15},${r1(y - 62 - hh * 0.5)} ${x + 11},${y - 62} Z" fill="#60a5fa" opacity=".55"/>`;
        out += `<path d="M${x - 6},${y - 62} Q${x - 8},${r1(y - 62 - hh * 0.3)} ${x},${r1(y - 62 - hh * 0.55)} Q${x + 8},${r1(y - 62 - hh * 0.3)} ${x + 6},${y - 62} Z" fill="#1d4ed8" opacity=".8"/>`;
      }
      return out + tag(x, y + 18, p.label);
    },
    box: (p) => [n(p.x) - 26, n(p.y) - 120, 52, 120],
    animated: (p) => Boolean(p.on),
  },

  trepied: {
    defaults: { w: 140, h: 100 },
    render(p) {
      const x = n(p.x); const y = n(p.y); const w = n(p.w); const h = n(p.h);
      return `<g class="d-metal"><line x1="${r1(x - w / 2)}" y1="${r1(y - h)}" x2="${r1(x + w / 2)}" y2="${r1(y - h)}" stroke-width="5"/><line x1="${r1(x - w / 2 + 10)}" y1="${r1(y - h)}" x2="${r1(x - w / 2 - 6)}" y2="${y}" stroke-width="4"/><line x1="${r1(x + w / 2 - 10)}" y1="${r1(y - h)}" x2="${r1(x + w / 2 + 6)}" y2="${y}" stroke-width="4"/><line x1="${x}" y1="${r1(y - h)}" x2="${x}" y2="${r1(y - 4)}" stroke-width="3" opacity=".5"/></g>`;
    },
    box: (p) => [n(p.x) - n(p.w) / 2, n(p.y) - n(p.h), n(p.w), n(p.h)],
  },

  thermometre: {
    defaults: { h: 190, value: 20, min: -20, max: 110, unit: '°C', decimals: 0, display: true },
    render(p) {
      const x = n(p.x); const y = n(p.y); const h = n(p.h);
      const min = n(p.min); const max = n(p.max);
      const t = Math.max(0, Math.min(1, (n(p.value) - min) / (max - min || 1)));
      const tubeTop = y - h; const tubeBottom = y - 16;
      const colTop = tubeBottom - t * (tubeBottom - tubeTop - 6);
      let out = `<rect class="d-thermo" x="${x - 7}" y="${r1(tubeTop)}" width="14" height="${r1(h - 10)}" rx="7"/><circle class="d-thermo" cx="${x}" cy="${r1(y - 10)}" r="11"/>`;
      out += `<rect x="${x - 3}" y="${r1(colTop)}" width="6" height="${r1(tubeBottom - colTop + 4)}" fill="#e11d48"/><circle cx="${x}" cy="${r1(y - 10)}" r="7.5" fill="#e11d48"/>`;
      if (p.display) {
        const txt = `${fr(n(p.value), n(p.decimals))} ${p.unit}`;
        const dx = n(p.dx, 30); // écart entre le thermomètre et son afficheur (négatif : à gauche)
        const lw = Math.max(64, txt.length * 10 + 18);
        out += `<line class="d-leader" x1="${x + (dx < 0 ? -8 : 8)}" y1="${r1(colTop)}" x2="${x + dx}" y2="${r1(colTop)}"/>`;
        out += lcd(x + dx + (dx < 0 ? -lw / 2 : lw / 2), colTop, txt, { cls: 'd-lcd--thermo' });
      }
      return out + tag(x, tubeTop - 16, p.label);
    },
    box: (p) => [n(p.x) - 12, n(p.y) - n(p.h), 24, n(p.h)],
  },

  balance: {
    defaults: { w: 170, value: 0, unit: 'g', decimals: 1 },
    render(p) {
      const x = n(p.x); const y = n(p.y); const w = n(p.w);
      let out = `<path class="d-device" d="M${r1(x - w / 2)},${y} L${r1(x - w / 2 + 12)},${y - 38} L${r1(x + w / 2 - 12)},${y - 38} L${r1(x + w / 2)},${y} Z"/>`;
      out += `<rect class="d-plate" x="${r1(x - w / 2 + 18)}" y="${y - 44}" width="${r1(w - 36)}" height="7" rx="3"/>`;
      out += lcd(x, y - 16, `${fr(n(p.value), n(p.decimals))} ${p.unit}`, { w: Math.min(w - 40, 120), cls: 'd-lcd--small' });
      return out + tag(x, y + 18, p.label);
    },
    box: (p) => [n(p.x) - n(p.w) / 2, n(p.y) - 44, n(p.w), 44],
  },

  dynamometre: {
    defaults: { h: 170, value: 0, max: 10, unit: 'N', decimals: 1 },
    render(p) {
      const x = n(p.x); const y = n(p.y); const h = n(p.h);
      const t = Math.max(0, Math.min(1, n(p.value) / n(p.max, 10)));
      const zone = h - 40;
      const mark = y + 20 + t * zone;
      let out = `<line class="d-string" x1="${x}" y1="${y - 26}" x2="${x}" y2="${y}"/><rect class="d-device d-device--light" x="${x - 15}" y="${y}" width="30" height="${h}" rx="6"/>`;
      for (let k = 0; k <= 5; k++) {
        const yy = y + 20 + (k / 5) * zone;
        out += `<line class="d-grad" x1="${x - 15}" y1="${r1(yy)}" x2="${x - 5}" y2="${r1(yy)}"/><text class="d-small" x="${x - 20}" y="${r1(yy + 4)}" text-anchor="end">${fr(n(p.max, 10) * k / 5)}</text>`;
      }
      out += `<path class="d-spring" d="M${x},${y + 8} ${Array.from({ length: 8 }, (_, k) => `L${x + (k % 2 ? 7 : -7)},${r1(y + 8 + (k + 1) * (mark - y - 8) / 8)}`).join(' ')}"/>`;
      out += `<rect x="${x - 11}" y="${r1(mark - 2)}" width="22" height="4" fill="#e11d48"/>`;
      out += `<line class="d-string" x1="${x}" y1="${r1(y + h)}" x2="${x}" y2="${r1(y + h + 16)}"/><path class="d-hook" d="M${x},${r1(y + h + 16)} q0,10 -7,9"/>`;
      out += lcd(x + 62, r1(mark), `${fr(n(p.value), n(p.decimals))} ${p.unit}`, { cls: 'd-lcd--small' });
      return out + tag(x, y - 38, p.label);
    },
    box: (p) => [n(p.x) - 16, n(p.y), 32, n(p.h) + 26],
  },

  chrono: {
    defaults: { value: 0, format: 'mmss' },
    render(p) {
      const x = n(p.x); const y = n(p.y); const v = Math.max(0, n(p.value));
      const txt = p.format === 's' ? `${fr(v, 1)} s` : `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(Math.floor(v % 60)).padStart(2, '0')}`;
      const a = (v % 60) / 60 * 2 * Math.PI;
      return `<rect class="d-device" x="${x - 6}" y="${y - 44}" width="12" height="10" rx="2"/><circle class="d-dial" cx="${x}" cy="${y}" r="34"/><line class="d-hand" x1="${x}" y1="${y}" x2="${r1(x + 24 * Math.sin(a))}" y2="${r1(y - 24 * Math.cos(a))}"/>${lcd(x, y + 54, txt, { cls: 'd-lcd--small' })}${tag(x, y - 58, p.label)}`;
    },
    box: (p) => [n(p.x) - 36, n(p.y) - 46, 72, 116],
  },

  objet: {
    defaults: { shape: 'cube', size: 40, color: 'gris' },
    render(p) {
      const x = n(p.x); const y = n(p.y); const s = n(p.size); const c = col(p.color, '#9ca3af');
      let out = '';
      if (p.hang) out += `<line class="d-string" x1="${x}" y1="${r1(y - s - n(p.hang, 20))}" x2="${x}" y2="${r1(y - s)}"/>`;
      switch (p.shape) {
        case 'boule': out += `<circle cx="${x}" cy="${r1(y - s / 2)}" r="${r1(s / 2)}" style="fill:${c}" class="d-solid"/><circle cx="${r1(x - s * 0.15)}" cy="${r1(y - s * 0.65)}" r="${r1(s * 0.12)}" fill="#fff" opacity=".45"/>`; break;
        case 'caillou': out += `<path d="M${r1(x - s / 2)},${y} q${r1(s * 0.05)},${r1(-s * 0.8)} ${r1(s * 0.45)},${r1(-s * 0.85)} q${r1(s * 0.55)},${r1(s * 0.05)} ${r1(s * 0.55)},${r1(s * 0.85)} z" style="fill:${c}" class="d-solid"/>`; break;
        case 'cylindre': out += `<rect x="${r1(x - s * 0.3)}" y="${r1(y - s)}" width="${r1(s * 0.6)}" height="${r1(s)}" rx="4" style="fill:${c}" class="d-solid"/><ellipse cx="${x}" cy="${r1(y - s)}" rx="${r1(s * 0.3)}" ry="5" fill="#fff" opacity=".35"/>`; break;
        case 'goutte': out += `<path d="M${x},${r1(y - s)} Q${r1(x + s * 0.45)},${r1(y - s * 0.35)} ${x},${y} Q${r1(x - s * 0.45)},${r1(y - s * 0.35)} ${x},${r1(y - s)} Z" style="fill:${c}" class="d-solid"/>`; break;
        case 'bouteille': out += `<path d="M${r1(x - s * 0.22)},${y} L${r1(x - s * 0.22)},${r1(y - s * 0.7)} Q${r1(x - s * 0.22)},${r1(y - s * 0.82)} ${r1(x - s * 0.08)},${r1(y - s * 0.86)} L${r1(x - s * 0.08)},${r1(y - s)} L${r1(x + s * 0.08)},${r1(y - s)} L${r1(x + s * 0.08)},${r1(y - s * 0.86)} Q${r1(x + s * 0.22)},${r1(y - s * 0.82)} ${r1(x + s * 0.22)},${r1(y - s * 0.7)} L${r1(x + s * 0.22)},${y} Z" style="fill:${c}" class="d-solid" opacity=".85"/>`; break;
        default: out += `<rect x="${r1(x - s / 2)}" y="${r1(y - s)}" width="${r1(s)}" height="${r1(s)}" rx="4" style="fill:${c}" class="d-solid"/><path d="M${r1(x - s / 2)},${r1(y - s)} l${r1(s * 0.18)},${r1(-s * 0.18)} h${r1(s)} l${r1(-s * 0.18)},${r1(s * 0.18)} z" style="fill:${c}" opacity=".7"/>`;
      }
      return out + tag(x, y - s - (p.hang ? n(p.hang, 20) + 14 : 16), p.label);
    },
    box: (p) => [n(p.x) - n(p.size) / 2, n(p.y) - n(p.size), n(p.size), n(p.size)],
  },

  zoom: {
    defaults: { r: 70, etat: 0, n: 24, color: 'bleu', speed: 1, mix: 0, color2: 'rouge' },
    render(p, ctx) {
      const x = n(p.x); const y = n(p.y); const R = n(p.r); const N = Math.min(60, Math.round(n(p.n, 24)));
      const e = Math.max(0, Math.min(2, n(p.etat)));
      const t = ctx.clock * n(p.speed, 1);
      const pr = Math.max(3.5, R * 0.085);
      const side = Math.ceil(Math.sqrt(N));
      let out = `<clipPath id="${ctx.key}-clip"><circle cx="${x}" cy="${y}" r="${R - 3}"/></clipPath><circle class="d-zoom" cx="${x}" cy="${y}" r="${R}"/><g clip-path="url(#${ctx.key}-clip)">`;
      for (let k = 0; k < N; k++) {
        // solide : réseau ordonné qui vibre ; liquide : serré mais désordonné, glisse ; gaz : dispersé, rapide
        const gx = x - (side - 1) * pr * 1.1 + (k % side) * pr * 2.2;
        const gy = y + R * 0.55 - Math.floor(k / side) * pr * 2.2 - pr;
        const sol = [gx + Math.sin(t * 9 + k) * 1.2, gy + Math.cos(t * 8 + k * 1.3) * 1.2];
        const liq = [x + (rnd(k) - 0.5) * R * 1.4 + Math.sin(t * 1.2 + k) * R * 0.18, y + R * 0.15 + rnd(k + 40) * R * 0.55 - pr + Math.cos(t * 1.1 + k * 2) * 4];
        const bounce = (u) => { const v = frac(u); return v < 0.5 ? v * 2 : 2 - v * 2; };
        const gas = [x - R * 0.85 + bounce(rnd(k + 7) + t * (0.12 + rnd(k) * 0.12)) * R * 1.7, y - R * 0.85 + bounce(rnd(k + 9) + t * (0.1 + rnd(k + 3) * 0.12)) * R * 1.7];
        const [a, b, u] = e <= 1 ? [sol, liq, e] : [liq, gas, e - 1];
        const px = a[0] + (b[0] - a[0]) * u; const py = a[1] + (b[1] - a[1]) * u;
        const c = k < N * n(p.mix) ? col(p.color2, '#e11d48') : col(p.color, '#3b82f6');
        out += `<circle cx="${r1(px)}" cy="${r1(py)}" r="${r1(pr)}" style="fill:${c}" class="d-particle"/>`;
      }
      out += '</g>';
      out += `<line class="d-zoom-handle" x1="${r1(x + R * 0.72)}" y1="${r1(y + R * 0.72)}" x2="${r1(x + R * 1.05)}" y2="${r1(y + R * 1.05)}"/>`;
      return out + (p.label ? `<text class="d-txt d-txt--s" x="${x}" y="${r1(y - R - 10)}" text-anchor="middle">${esc(p.label)}</text>` : '');
    },
    box: (p) => [n(p.x) - n(p.r), n(p.y) - n(p.r), 2 * n(p.r), 2 * n(p.r)],
    animated: () => true,
  },
};
