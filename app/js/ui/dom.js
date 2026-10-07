/**
 * Petits outils d'interface sans framework : création d'éléments sûre (textContent par défaut),
 * rendu d'un Markdown léger pour les contenus, rendu des formules entre $…$.
 */
import { tryParse, toHTML } from '../core/expr.js';

/**
 * h('button', {class: 'btn', onclick: fn, 'aria-label': '…'}, 'Texte', enfant…)
 * Les chaînes deviennent des nœuds texte (jamais interprétées comme HTML).
 */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') {
      for (const [prop, val] of Object.entries(v)) {
        if (prop.startsWith('--')) el.style.setProperty(prop, val);
        else el.style[prop] = val;
      }
    }
    else if (k === 'html') el.innerHTML = v; // réservé aux rendus internes déjà échappés
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Rend une formule : si elle se lit comme une expression, rendu mathématique ; sinon texte. */
export function mathHTML(src) {
  const t = String(src).trim();
  const parsed = tryParse(t);
  // « P(A) », « f(x) » : notation de fonction, à garder telle quelle (sinon lue comme le produit P × A)
  const functionNotation = /(^|[^A-Za-z])([A-Z]|[fgh])\(/.test(t);
  if (parsed.ok && !functionNotation && !/[A-Za-zÀ-ÿ]{3,}/.test(t.replace(/(pgcd|ppcm|racine|cos|sin|tan|sqrt)/g, ''))) {
    return `<span class="math">${toHTML(parsed.node)}</span>`;
  }
  return `<span class="math">${esc(t).replace(/\^(\d+)/g, '<sup>$1</sup>')}</span>`;
}

/** Texte en ligne : **gras**, *italique*, $formule$, [lien](https://…). Entrée échappée. */
export function inlineHTML(text) {
  const parts = String(text ?? '').split(/(\$[^$]+\$)/g);
  return parts.map((p) => {
    if (/^\$[^$]+\$$/.test(p)) return mathHTML(p.slice(1, -1));
    return esc(p)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
      .replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  }).join('');
}

/** Markdown léger en blocs : paragraphes, listes, citations « À retenir », titres ###. */
export function richText(text, cls = 'rich') {
  const lines = String(text ?? '').split('\n');
  let html = '';
  let list = null; let quote = [];
  const flushList = () => { if (list) { html += `<${list.tag}>${list.items.map((i) => `<li>${inlineHTML(i)}</li>`).join('')}</${list.tag}>`; list = null; } };
  const flushQuote = () => {
    if (quote.length) {
      html += `<aside class="retenir">${richText(quote.join('\n'), '').innerHTML}</aside>`;
      quote = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^>\s?/.test(line)) { flushList(); quote.push(line.replace(/^>\s?/, '')); continue; }
    flushQuote();
    const ul = line.match(/^\s*[-•]\s+(.*)$/);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (ul || ol) {
      const tag = ul ? 'ul' : 'ol';
      if (!list || list.tag !== tag) { flushList(); list = { tag, items: [] }; }
      list.items.push((ul || ol)[1]);
      continue;
    }
    flushList();
    if (!line.trim()) continue;
    const hd = line.match(/^(#{2,4})\s+(.*)$/);
    if (hd) { html += `<h${hd[1].length + 1}>${inlineHTML(hd[2])}</h${hd[1].length + 1}>`; continue; }
    html += `<p>${inlineHTML(line)}</p>`;
  }
  flushList(); flushQuote();
  const div = document.createElement('div');
  if (cls) div.className = cls;
  div.innerHTML = html;
  return div;
}

/** Annonce pour les lecteurs d'écran (zone aria-live globale). */
export function announce(msg) {
  const live = document.getElementById('live');
  if (!live) return;
  live.textContent = '';
  setTimeout(() => { live.textContent = msg; }, 30);
}

export function pct(x) {
  return `${Math.round((x || 0) * 100)} %`;
}

export function relDays(ts, now = Date.now()) {
  const d = Math.round((ts - now) / 86400000);
  if (d === 0) return "aujourd'hui";
  if (d === 1) return 'demain';
  if (d === -1) return 'hier';
  return d > 0 ? `dans ${d} jours` : `il y a ${-d} jours`;
}

let pendingTab = null;
/** Remet le focus sur l'onglet choisi au clavier, dans la page réelle (la liste a pu être reconstruite). */
export function focusPendingTab() {
  if (!pendingTab) return false;
  const lists = [...document.querySelectorAll('[role="tablist"]')].filter((l) => l.getAttribute('aria-label') === pendingTab.label);
  const btn = lists.map((l) => [...l.querySelectorAll('[data-tab]')].find((b) => b.dataset.tab === pendingTab.id)).find(Boolean);
  if (btn) { btn.focus(); pendingTab = null; return true; }
  return false;
}

/** Petit composant d'onglets accessible au clavier (flèches gauche/droite). */
export function tabs(items, active, onSelect, label = 'Onglets') {
  const list = h('div', { class: 'tabs', role: 'tablist', 'aria-label': label });
  items.forEach((it, i) => {
    const b = h('button', {
      class: `tab ${it.id === active ? 'is-active' : ''} ${it.cls || ''}`, role: 'tab', type: 'button',
      'aria-selected': it.id === active ? 'true' : 'false', tabindex: it.id === active ? '0' : '-1',
      onclick: () => onSelect(it.id),
      onkeydown: (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const next = items[(i + (e.key === 'ArrowRight' ? 1 : items.length - 1)) % items.length];
          pendingTab = { label, id: next.id };
          onSelect(next.id);
          focusPendingTab();
        }
      },
      dataset: { tab: it.id },
    }, it.icon ? h('span', { class: 'tab-icon', 'aria-hidden': 'true' }, it.icon) : null, it.label);
    list.append(b);
  });
  return list;
}

/** Remplace les enfants d'un élément en ignorant les valeurs vides (null, undefined, false). */
export function fill(el, ...kids) {
  el.replaceChildren(...kids.flat(Infinity).filter((k) => k !== null && k !== undefined && k !== false));
  return el;
}
