/** « Vrai ou faux ? » : cartes tirées des QCM et des associations, paquets équilibrés, verdicts, points. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
const W = new URL('../../js/', import.meta.url).href;
const V = await import(W + 'engine/vraifaux.js');
const G = await import(W + 'engine/game.js');
const { CODE_GENERATORS, generateFromCode } = await import(W + 'generators/maths-pc.js');

const qcm = (prompt, good, bads, why = 'Parce que.') => ({ type: 'qcm', prompt, choices: [{ text: good, correct: true, feedback: `Oui ! ${why}` }, ...bads.map((b) => ({ text: b, correct: false, feedback: why }))] });

test('carte QCM : bonne réponse, leurres, explication sans « Oui ! »', () => {
  const c = V.qcmCandidate(qcm('Quelle est la capitale de la France ?', 'Paris', ['Lyon', 'Paris', 'Nice']), { label: 'Villes', subject: 'hg' });
  assert.equal(c.good, 'Paris');
  assert.deepEqual(c.bads.sort(), ['Lyon', 'Nice']);
  assert.equal(c.why, 'Parce que.');
  assert.equal(c.theme, 'Villes');
});

test('cartes écartées : questions piégeuses, plusieurs bonnes réponses, figures, textes trop longs', () => {
  assert.equal(V.qcmCandidate(qcm('Quelle affirmation est fausse ?', 'a', ['b'])), null);
  assert.equal(V.qcmCandidate(qcm('Trouve l’intrus.', 'a', ['b'])), null);
  assert.equal(V.qcmCandidate(qcm('Lis le texte puis réponds.', 'a', ['b'])), null);
  assert.equal(V.qcmCandidate({ ...qcm('Combien ?', 'a', ['b']), figure: {} }), null);
  assert.equal(V.qcmCandidate(qcm('Combien ?', 'x'.repeat(95), ['b'])), null);
  assert.equal(V.qcmCandidate({ type: 'qcm', prompt: 'Q ?', choices: [{ text: 'a', correct: true }, { text: 'b', correct: true }] }), null);
  assert.equal(V.qcmCandidate({ type: 'numeric', prompt: 'Q ?' }), null);
  assert.equal(V.qcmCandidate(null), null);
});

test('associations : un leurre ne va jamais avec la même entrée', () => {
  const pairs = [{ a: 'chat', b: 'cat' }, { a: 'chien', b: 'dog' }, { a: 'chat', b: 'kitty' }, { a: 'oiseau', b: 'bird' }];
  const cands = V.pairCandidates(pairs, { label: 'Animaux' }, { leftTitle: 'En français', rightTitle: 'En anglais' });
  assert.equal(cands.length, 3);
  const chat = cands.find((c) => c.question === 'chat');
  assert.ok(!chat.bads.includes('kitty') && !chat.bads.includes('cat'));
  for (let k = 0; k < 50; k++) {
    const card = V.makeCard(chat, false);
    assert.ok(['dog', 'bird'].includes(card.proposal));
    assert.match(V.verdict(card), /^Faux : « chat » va avec « cat », pas avec/);
  }
  assert.match(V.verdict(V.makeCard(chat, true)), /^Vrai : « chat » va bien avec « cat »/);
});

test('paquet : cartes toutes différentes, moitié vraies, thèmes alternés', () => {
  const cands = [];
  for (let t = 0; t < 4; t++) for (let k = 0; k < 10; k++) cands.push(V.qcmCandidate(qcm(`Question ${t}-${k} ?`, `bon ${k}`, [`faux ${k}`, `autre ${k}`]), { label: `T${t}` }));
  for (let r = 0; r < 100; r++) {
    const deck = V.newDeck([...cands, ...cands.slice(0, 5)], 12);
    assert.equal(deck.length, 12);
    assert.equal(new Set(deck.map((c) => c.key)).size, 12);
    assert.equal(deck.filter((c) => c.truth).length, 6);
    for (const c of deck) assert.equal(c.proposal === c.good, c.truth);
    const perTheme = {}; for (const c of deck) perTheme[c.theme] = (perTheme[c.theme] || 0) + 1;
    assert.ok(Object.values(perTheme).every((n) => n === 3), JSON.stringify(perTheme));
    assert.equal(V.isRight(deck[0], deck[0].truth), true);
    assert.equal(V.isRight(deck[0], !deck[0].truth), false);
  }
  assert.equal(V.newDeck(cands.slice(0, 5), 12).length, 5);
});

test('banques réelles : chaque classe du primaire au lycée a des dizaines de cartes valables', () => {
  for (const lv of ['cp', 'ce1', 'ce2', 'cm1', 'cm2', '6e', '5e', '4e', '3e', '2nde', '1re', 'tle']) {
    const keys = new Set();
    for (const g of CODE_GENERATORS.filter((x) => x.facts && x.levels.includes(lv))) {
      for (let s = 1; s <= 30; s++) {
        const c = V.qcmCandidate(generateFromCode(g, s, { parcours: 'classe', niveau: lv }), g);
        if (!c) continue;
        assert.ok(c.bads.length >= 1 && !c.bads.includes(c.good), `${g.id} ${c.question}`);
        assert.ok(!/undefined|NaN|\[object/.test(c.question + c.good + c.bads.join() + c.why), `${g.id} ${c.question}`);
        keys.add(c.key);
      }
    }
    assert.ok(keys.size >= 40, `${lv} : ${keys.size} cartes`);
  }
});

test('étoiles et points une fois par jour', () => {
  assert.equal(V.vfStars(0), 3);
  assert.equal(V.vfStars(2), 2);
  assert.equal(V.vfStars(3), 1);
  assert.equal(G.XP.vraifaux, 10);
  assert.equal(G.eventXp('vraifaux'), 10);
});
