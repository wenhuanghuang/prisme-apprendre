/** Dé à six faces dessiné en CSS ; il roule un instant avant de montrer le résultat (sauf animations réduites). */
import { h } from '../dom.js';

const PIPS = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function die(value = 1) {
  const el = h('div', { class: 'die', role: 'img', 'aria-label': `Dé : ${value}` });
  const face = (v) => {
    el.dataset.face = String(v);
    el.setAttribute('aria-label', `Dé : ${v}`);
    el.replaceChildren(...Array.from({ length: 9 }, (_, k) => h('i', { class: PIPS[v].includes(k + 1) ? 'on' : '' })));
  };
  face(value);
  return {
    el,
    set: face,
    /** Fait rouler le dé puis s'arrête sur `v`. */
    async roll(v) {
      if (reduced()) { face(v); return; }
      el.classList.add('is-rolling');
      for (let k = 0; k < 9; k++) { face(1 + ((v + k * 5) % 6)); await wait(55 + k * 9); }
      face(v);
      el.classList.remove('is-rolling');
      el.classList.add('is-landed');
      setTimeout(() => el.classList.remove('is-landed'), 500);
    },
  };
}
