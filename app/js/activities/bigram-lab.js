/**
 * Mini modèle de langage : il compte, dans un texte d'entraînement, quel mot suit quel mot (bigrammes),
 * puis génère une suite en choisissant à chaque fois un mot probable. On voit les probabilités, et on voit
 * qu'il peut produire des phrases fausses avec assurance : il ne « sait » rien, il enchaîne du probable.
 */
import { h, fill } from '../ui/dom.js';

export function tokenize(text) {
  return String(text || '').toLowerCase().replace(/([.!?,;:])/g, ' $1 ').split(/\s+/).filter(Boolean);
}

export function train(tokens) {
  const table = {};
  for (let i = 0; i < tokens.length - 1; i++) {
    const a = tokens[i]; const b = tokens[i + 1];
    table[a] = table[a] || {};
    table[a][b] = (table[a][b] || 0) + 1;
  }
  return table;
}

export function distribution(table, word) {
  const row = table[word] || {};
  const total = Object.values(row).reduce((s, n) => s + n, 0);
  return Object.entries(row).map(([w, n]) => ({ word: w, count: n, p: total ? n / total : 0 })).sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));
}

export function mount(container, config) {
  const corpus = h('textarea', { class: 'field-textarea', rows: 5, 'aria-label': 'Texte d’entraînement' }, config.corpus || '');
  let table = {};
  const stats = h('p', { class: 'small muted' });
  const startIn = h('input', { class: 'field-input', value: config.start || 'le', 'aria-label': 'Mot de départ', style: { maxWidth: '140px' } });
  const lenIn = h('input', { class: 'field-input', type: 'number', min: 3, max: 40, value: 12, 'aria-label': 'Nombre de mots à générer', style: { maxWidth: '90px' } });
  let greedy = false;
  const output = h('div', { class: 'bg-output', 'aria-live': 'polite' });
  const dist = h('div', { class: 'bg-dist' });

  function showDist(word) {
    const d = distribution(table, word);
    fill(dist, h('p', {}, h('strong', {}, `Après « ${word} »`), d.length ? ` : ${d.reduce((s, x) => s + x.count, 0)} occurrence(s) dans le texte` : ' : ce mot n’est jamais suivi d’un autre dans le texte.'),
      d.length ? h('table', { class: 'lab-table' }, h('thead', {}, h('tr', {}, h('th', {}, 'mot suivant'), h('th', {}, 'nombre'), h('th', {}, 'probabilité'))),
        h('tbody', {}, d.map((x) => h('tr', {}, h('td', { style: { textAlign: 'left' } }, x.word), h('td', {}, String(x.count)), h('td', {}, h('span', { class: 'bg-bar', style: { width: `${Math.round(x.p * 100)}px` } }), ` ${Math.round(x.p * 100)} %`))))) : null);
  }

  function retrain() {
    const tokens = tokenize(corpus.value);
    table = train(tokens);
    stats.textContent = `${tokens.length} mots lus, ${Object.keys(table).length} mots différents suivis d’un autre mot.`;
    showDist(tokenize(startIn.value)[0] || 'le');
  }

  function generate() {
    let word = tokenize(startIn.value)[0] || 'le';
    const words = [word];
    const n = Math.max(3, Math.min(40, Number(lenIn.value) || 12));
    let stuck = false;
    for (let i = 0; i < n; i++) {
      const d = distribution(table, word);
      if (!d.length) { stuck = true; break; }
      if (greedy) word = d[0].word;
      else {
        const r = crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
        let acc = 0; word = d[d.length - 1].word;
        for (const x of d) { acc += x.p; if (r < acc) { word = x.word; break; } }
      }
      words.push(word);
    }
    fill(output, 
      h('p', { class: 'bg-sentence' }, ...words.map((w) => h('button', { type: 'button', class: 'bg-word', title: 'Voir les probabilités après ce mot', onclick: () => showDist(w) }, w))),
      stuck ? h('p', { class: 'small muted' }, `Arrêt : « ${word} » n’est jamais suivi d’un autre mot dans le texte d’entraînement.`) : null,
      h('p', { class: 'small muted' }, 'Clique sur un mot pour voir parmi quels mots le modèle a choisi le suivant.'));
  }

  corpus.addEventListener('change', retrain);
  const modeBtns = h('div', { class: 'btn-row', role: 'radiogroup', 'aria-label': 'Façon de choisir' });
  const drawModes = () => modeBtns.replaceChildren(
    h('button', { type: 'button', role: 'radio', 'aria-checked': String(!greedy), class: `btn btn--small ${!greedy ? 'btn--primary' : 'btn--ghost'}`, onclick: () => { greedy = false; drawModes(); } }, 'Tirer au hasard selon les probabilités'),
    h('button', { type: 'button', role: 'radio', 'aria-checked': String(greedy), class: `btn btn--small ${greedy ? 'btn--primary' : 'btn--ghost'}`, onclick: () => { greedy = true; drawModes(); } }, 'Toujours le plus probable'));
  drawModes();

  container.append(h('div', { class: 'bg' },
    h('label', { class: 'field-label' }, 'Texte d’entraînement (tu peux le modifier)'), corpus,
    h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn btn--small', onclick: retrain }, 'Entraîner le modèle'), stats),
    h('div', { class: 'lab-grid', style: { marginTop: '12px' } },
      h('div', {}, h('div', { class: 'btn-row' }, h('label', {}, 'Mot de départ ', startIn), h('label', {}, 'Longueur ', lenIn)), modeBtns,
        h('button', { type: 'button', class: 'btn btn--primary btn--small', style: { marginTop: '8px' }, onclick: generate }, 'Générer une suite'), output),
      h('div', { class: 'lab-controls' }, dist))));
  retrain();
  return () => { container.replaceChildren(); };
}
