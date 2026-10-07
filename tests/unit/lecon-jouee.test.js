/**
 * Leçon jouée écran par écran, figures et expériences animées : vérifications sans navigateur.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkFigure, num } from '../../app/js/figures/check.js';
import { checkDemo } from '../../app/js/demos/check.js';
import { lerp, stepDuration, initialState, stateAt, renderScene } from '../../app/js/demos/scene.js';
import { PRIMS } from '../../app/js/demos/prims.js';
import { autoCards } from '../../app/js/ui/lesson-play/cards.js';
import { starsFor } from '../../app/js/ui/lesson-play/stars.js';
import { instantiate, check } from '../../app/js/core/checkers/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('figures : une figure correcte passe, les erreurs sont nommées', () => {
  const ok = { alt: 'Triangle', frame: { x: [0, 6], y: [0, 4] }, items: [
    { type: 'point', id: 'A', x: 1, y: 3 }, { type: 'point', id: 'B', x: 1, y: 0.5 }, { type: 'point', id: 'C', x: 5, y: 0.5 },
    { type: 'polygon', points: ['A', 'B', 'C'] }, { type: 'angle', vertex: 'B', from: 'A', to: 'C', right: true }] };
  assert.deepEqual(checkFigure(ok), []);
  assert.match(checkFigure({ ...ok, alt: '' }).join(), /alt/);
  assert.match(checkFigure({ ...ok, items: [...ok.items, { type: 'segment', from: 'A', to: 'Z' }] }).join(), /« Z » inconnu/);
  assert.match(checkFigure({ alt: 'x', items: [{ type: 'bars', data: [{ label: 'a', value: 1 }, { label: 'b', value: 2 }] }, { type: 'point', id: 'A', x: 0, y: 0 }] }).join(), /sans autre élément/);
  assert.match(checkFigure({ alt: 'x', items: [{ type: 'cercle' }] }).join(), /type inconnu/);
  assert.equal(num('−2,5'), -2.5);
  assert.ok(Number.isNaN(num('{a}')));
});

test('expériences : interpolation, durée des étapes, état à un instant donné', () => {
  assert.equal(lerp(0, 10, 0.5), 5);
  assert.equal(lerp('#000000', '#ffffff', 0.5), '#808080');
  assert.equal(lerp(false, true, 0.4), false);
  assert.equal(lerp(false, true, 1), true);
  const demo = { items: [{ type: 'thermometre', id: 'th', x: 100, y: 300, value: -18 }, { type: 'becher', id: 'b', x: 200, y: 300 }],
    steps: [{ title: 'a', text: 'a' }, { title: 'b', text: 'b', duration: 4, do: [{ id: 'th', to: { value: 0 }, ease: 'lineaire' }, { id: 'b', set: { bubbles: 1 }, at: 2 }] }, { title: 'c', text: 'c', do: [{ id: 'th', to: { value: 100 } }] }] };
  assert.deepEqual(checkDemo(demo), []);
  assert.equal(stepDuration(demo.steps[0]), 0);
  assert.equal(stepDuration(demo.steps[1]), 4);
  assert.equal(stepDuration(demo.steps[2]), 3);
  const base = initialState(demo);
  assert.equal(stateAt(demo, base, 1, 2).th.value, -9, 'mi-parcours linéaire');
  assert.ok(!stateAt(demo, base, 1, 1).b.bubbles, 'action pas encore commencée');
  assert.equal(stateAt(demo, base, 1, 3).b.bubbles, 1);
  assert.equal(stateAt(demo, base, 2, 0).th.value, 0, 'les étapes précédentes sont appliquées en entier');
  assert.equal(stateAt(demo, base, 0, 0).th.value, -18, 'revenir en arrière retrouve l’état initial');
});

test('expériences : le vérificateur signale les erreurs d’écriture', () => {
  const errs = checkDemo({ items: [{ type: 'becher', id: 'b', x: 1, y: 1 }, { type: 'fusee', id: 'f', x: 0, y: 0 }],
    steps: [{ title: 't', text: 'x', do: [{ id: 'zz', to: { level: 1 } }, { id: 'b', to: { label: 'texte' } }] }, { title: 'q', ask: { question: '?', choices: ['a', 'b'], answer: 3 } }] });
  const s = errs.join('\n');
  assert.match(s, /type inconnu « fusee »/);
  assert.match(s, /objet « zz » inconnu/);
  assert.match(s, /to\.label/);
  assert.match(s, /ask\.answer/);
  assert.match(s, /ask\.explain/);
});

test('expériences : chaque objet se dessine sans erreur ni « NaN » avec ses valeurs par défaut', () => {
  for (const [type, prim] of Object.entries(PRIMS)) {
    const p = { ...prim.defaults, type, id: 'o', x: 200, y: 300, from: [10, 10], to: [100, 50], points: type === 'fil' ? [[0, 0], [50, 0]] : prim.defaults.points, text: 'test' };
    const svg = prim.render(p, { clock: 1.3, W: 800, H: 440, uid: 't', key: 't-o' });
    assert.equal(typeof svg, 'string', type);
    assert.ok(!/NaN|undefined/.test(svg), `${type} : ${svg.match(/.{0,30}(NaN|undefined).{0,30}/)?.[0]}`);
    if (prim.box) assert.ok(prim.box(p).every(Number.isFinite), `${type} : boîte`);
  }
});

test('expériences des leçons : toutes valides et dessinables à chaque étape', () => {
  const dir = join(root, 'app', 'content', 'lessons');
  let count = 0;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    let lesson;
    try { lesson = JSON.parse(readFileSync(join(dir, f), 'utf8')); } catch { continue; } // fichier en cours d'écriture
    for (const s of lesson.sections.filter((x) => x.kind === 'experience')) {
      count += 1;
      assert.deepEqual(checkDemo(s.demo), [], `${lesson.id} › ${s.title}`);
      const base = initialState(s.demo);
      s.demo.steps.forEach((st, k) => {
        const { svg } = renderScene(s.demo, stateAt(s.demo, base, k, stepDuration(st) / 2), 2, st.focus || []);
        assert.ok(!/NaN|undefined/.test(svg), `${lesson.id} › ${s.title} › étape ${k + 1}`);
      });
    }
  }
  assert.ok(count >= 2, `${count} expériences trouvées`);
});

test('cours en cartes : un long cours est découpé en cartes courtes, titrées', () => {
  const body = '### Les trois états\n**Solide.** Il a une forme propre.\n\nUn liquide prend la forme du récipient. '.padEnd(500, 'x') + '\n\n### Les changements d’état\n- fusion\n- solidification\n\n> À retenir : la masse se conserve.';
  const cards = autoCards(body);
  assert.equal(cards.length >= 2, true);
  assert.equal(cards[0].title, 'Les trois états');
  assert.equal(cards[cards.length - 1].title, 'Les changements d’état');
  assert.match(cards[cards.length - 1].body, /- fusion\n- solidification/, 'une liste reste entière');
  const bold = autoCards('**Trois états.** Un solide a une forme propre.');
  assert.equal(bold[0].title, 'Trois états');
  assert.equal(bold[0].body, 'Un solide a une forme propre.');
});

test('message d’une idée fausse : les paramètres tirés sont remplacés', () => {
  const def = { id: 't-mc', type: 'numeric', params: { k: { int: [3, 3] } }, answer: 'k*2', prompt: '?',
    misconceptions: [{ answer: 'k+2', id: 'mc:ajout', error: 'calcul', feedback: 'Tu as ajouté {k} au lieu de multiplier par {k}.' }] };
  const d = check(instantiate(def, 1), { value: '5' });
  assert.equal(d.misconception, 'mc:ajout');
  assert.match(d.feedback, /ajouté 3 au lieu de multiplier par 3/);
});

test('étoiles : premier coup sans indice = 3, correction vue = 0, rédaction = 2', () => {
  assert.equal(starsFor({ verdict: 'correct' }, { tries: 1 }), 3);
  assert.equal(starsFor({ verdict: 'correct' }, { tries: 2 }), 2);
  assert.equal(starsFor({ verdict: 'correct' }, { tries: 1, hintsUsed: 2 }), 1);
  assert.equal(starsFor({ verdict: 'incorrect' }, { tries: 3, solutionShown: true }), 0);
  assert.equal(starsFor({ verdict: 'a-valider' }, { tries: 1 }), 2);
  assert.equal(starsFor(null, {}), 0);
});
