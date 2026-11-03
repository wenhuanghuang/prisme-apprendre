/** Atelier Tortue en accès libre (sans modèle à reproduire). */
import { createCodeEditor } from './turtle-editor.js';

export function mount(container, config) {
  const ed = createCodeEditor({ start: config.program || '', target: config.target || '', mode: 'both' });
  container.append(ed.el);
  return () => { container.replaceChildren(); };
}
