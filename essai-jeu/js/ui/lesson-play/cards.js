/**
 * Cours en cartes : une idée par carte, retournement des « cartes devinettes ».
 * Les anciennes leçons (un long `body`) sont découpées automatiquement en cartes courtes.
 */
import { h, richText, inlineHTML } from '../dom.js';
import { renderFigure } from '../../figures/render.js';

const MAX_CHUNK = 420;

/** Découpe un texte Markdown léger en blocs (paragraphe, liste, citation, titre). */
function blocks(text) {
  const out = [];
  let cur = null;
  for (const raw of String(text || '').split('\n')) {
    const line = raw.trimEnd();
    const kind = /^#{2,4}\s/.test(line) ? 'title' : /^>\s?/.test(line) ? 'quote' : /^\s*([-•]|\d+[.)])\s+/.test(line) ? 'list' : line.trim() ? 'para' : 'blank';
    if (kind === 'blank') { cur = null; continue; }
    if (kind === 'title') { out.push({ kind, lines: [line] }); cur = null; continue; }
    if (cur && cur.kind === kind && kind !== 'para') { cur.lines.push(line); continue; }
    cur = { kind, lines: [line] };
    out.push(cur);
  }
  return out;
}

/** Cartes construites à partir d'un long texte de cours (anciennes leçons). */
export function autoCards(body) {
  const cards = [];
  let cur = null;
  const flush = () => { if (cur && (cur.text.trim() || cur.title)) cards.push(cur); cur = null; };
  for (const b of blocks(body)) {
    if (b.kind === 'title') { flush(); cur = { title: b.lines[0].replace(/^#{2,4}\s+/, ''), text: '' }; continue; }
    const txt = b.lines.join('\n');
    // une liste reste avec le paragraphe qui l'annonce ; sinon on coupe quand la carte devient longue
    if (cur && b.kind !== 'list' && cur.text.length + txt.length > MAX_CHUNK && cur.text.length > 120) flush();
    if (!cur) cur = { title: '', text: '' };
    cur.text += (cur.text ? '\n\n' : '') + txt;
  }
  flush();
  return cards.map((c) => {
    let { title, text } = c;
    // « **Trois états.** Un solide… » : le début en gras devient le titre de la carte
    const m = !title && text.match(/^\*\*([^*]{3,60}?)\.?\*\*\s*[.:—-]?\s*/);
    if (m) { title = m[1]; text = text.slice(m[0].length); }
    return { title, body: text };
  });
}

/** Toutes les cartes l'une sous l'autre (rappel de cours en séance, sans navigation). */
export function cardsDigest(cards) {
  return h('div', { class: 'deck-digest' }, cards.map((c) => h('section', { class: 'deck-digest-card' },
    h('h4', {}, c.emoji ? h('span', { 'aria-hidden': 'true' }, `${c.emoji} `) : null, c.title || ''),
    c.body ? richText(c.body) : null,
    c.example ? h('p', { class: 'deck-example' }, h('span', { class: 'deck-example-tag' }, 'Exemple'), ' ', h('span', { html: inlineHTML(c.example) })) : null,
    c.figure ? renderFigure(c.figure) : null)));
}

/**
 * Paquet de cartes. `onChange` est appelé à chaque changement de carte.
 * @returns {{ el: HTMLElement, next: () => boolean, remaining: () => number }}
 */
export function cardDeck(cards, { onChange } = {}) {
  let i = 0;
  const seen = new Set([0]);
  const stage = h('div', { class: 'deck-stage', 'aria-live': 'polite' });
  const dots = h('div', { class: 'deck-dots', role: 'group', 'aria-label': 'Cartes du cours' });
  const counter = h('span', { class: 'deck-counter' });
  const prev = h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => go(i - 1) }, '← Carte précédente');
  const el = h('div', { class: 'deck' }, stage, h('div', { class: 'deck-nav' }, prev, dots, counter));

  function cardEl(c, k) {
    const body = h('div', { class: 'deck-card-body' },
      c.body ? richText(c.body) : null,
      c.example ? h('p', { class: 'deck-example' }, h('span', { class: 'deck-example-tag' }, 'Exemple'), ' ', h('span', { html: inlineHTML(c.example) })) : null,
      c.figure ? renderFigure(c.figure) : null);
    const face = h('div', { class: 'deck-card-face' },
      h('header', { class: 'deck-card-head' },
        h('span', { class: 'deck-emoji', 'aria-hidden': 'true' }, c.emoji || '💡'),
        h('div', {}, h('p', { class: 'deck-card-n' }, `Carte ${k + 1} sur ${cards.length}`), c.title ? h('h3', {}, c.title) : null)),
      body);
    if (!c.reveal) return h('article', { class: 'deck-card' }, face);
    const answer = h('div', { class: 'deck-reveal-answer', hidden: true }, h('p', { class: 'deck-reveal-tag' }, 'Réponse'), richText(c.reveal.answer));
    const flip = h('button', { type: 'button', class: 'btn btn--primary deck-flip', onclick: () => {
      answer.hidden = false; flip.hidden = true; card.classList.add('is-flipped');
    } }, '↻ Retourner la carte');
    const card = h('article', { class: 'deck-card deck-card--reveal' }, face,
      h('div', { class: 'deck-reveal' }, h('p', { class: 'deck-reveal-q' }, h('span', { class: 'deck-reveal-emoji', 'aria-hidden': 'true' }, '🤔 '), h('span', { html: inlineHTML(c.reveal.question) })), flip, answer));
    return card;
  }

  function go(k) {
    if (k < 0 || k >= cards.length) return;
    const dir = k > i ? 'fwd' : 'back';
    i = k; seen.add(k);
    const c = cardEl(cards[k], k);
    c.classList.add(`enter-${dir}`);
    stage.replaceChildren(c);
    const dotHadFocus = dots.contains(document.activeElement);
    dots.replaceChildren(...cards.map((_, j) => h('button', {
      type: 'button', class: `deck-dot ${j === i ? 'is-current' : ''} ${seen.has(j) ? 'is-seen' : ''}`,
      'aria-label': `Carte ${j + 1}`, 'aria-current': j === i ? 'true' : undefined, onclick: () => go(j),
    })));
    if (dotHadFocus) dots.children[i].focus({ preventScroll: true }); // le bouton cliqué a été remplacé
    counter.textContent = `${i + 1} / ${cards.length}`;
    prev.disabled = i === 0;
    if (onChange) onChange(i);
  }
  go(0);
  return {
    el,
    /** Avance d'une carte ; renvoie false s'il n'y en a plus. */
    next() { if (i < cards.length - 1) { go(i + 1); return true; } return false; },
    remaining: () => cards.length - 1 - i,
  };
}
