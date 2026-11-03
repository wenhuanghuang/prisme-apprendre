/**
 * Jeu de plateau : règles pures (plateau, dé, déplacements, cartes, tours, fin de partie).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rng } from '../../app/js/core/template.js';
import {
  BOARD_SIZES, COLUMNS, CARDS, createBoard, caseCell, newGame, startTurn, answer, endTurn, currentPlayer,
  photonResult, ranking, gameStars,
} from '../../app/js/engine/plateau.js';

const two = () => [{ id: 'a', name: 'A', kind: 'profil' }, { id: 'b', name: 'B', kind: 'invite' }];

/** Partie dont on fixe le plateau (cases toutes simples sauf celles données). */
function fixedGame(players, special = {}, n = 23) {
  const g = newGame({ players, size: 'courte', rand: rng(1) });
  g.board = { size: 'courte', n, cases: Array.from({ length: n + 1 }, (_, i) => ({ i, type: i === 0 ? 'depart' : i === n ? 'arrivee' : 'normale' })) };
  for (const [i, c] of Object.entries(special)) g.board.cases[i] = { i: Number(i), ...c };
  return g;
}

test('plateau : tailles en serpentin, cases spéciales bien placées, tirage reproductible', () => {
  for (const size of Object.keys(BOARD_SIZES)) {
    for (let s = 1; s <= 60; s++) {
      const b = createBoard(size, rng(s));
      assert.equal((b.n + 1) % COLUMNS, 0, 'rangées complètes');
      assert.equal(b.cases[0].type, 'depart');
      assert.equal(b.cases[b.n].type, 'arrivee');
      for (const i of [1, 2, b.n - 1]) assert.equal(b.cases[i].type, 'normale', `case ${i} simple`);
      for (const t of ['carte', 'defi', 'revision', 'pont', 'nuage']) assert.ok(b.cases.some((c) => c.type === t), `${size} : au moins une case ${t}`);
      for (const c of b.cases.filter((x) => x.type === 'pont')) {
        assert.ok(c.to > c.i && c.to < b.n, 'un arc-en-ciel mène plus loin, avant le Prisme');
        assert.ok(!['pont', 'nuage'].includes(b.cases[c.to].type));
      }
      for (const c of b.cases.filter((x) => x.type === 'nuage')) {
        assert.ok(c.to < c.i && c.to > 0, 'un nuage fait reculer, jamais au départ');
        assert.ok(!['pont', 'nuage'].includes(b.cases[c.to].type));
      }
    }
  }
  assert.deepEqual(createBoard('normale', rng(9)), createBoard('normale', rng(9)));
  assert.deepEqual(caseCell(0), { row: 0, col: 0 });
  assert.deepEqual(caseCell(7), { row: 0, col: 7 });
  assert.deepEqual(caseCell(8), { row: 1, col: 7 }, 'la deuxième rangée repart de droite');
  assert.deepEqual(caseCell(15), { row: 1, col: 0 });
});

test('étoiles du jeu : premier coup sans indice = 3, la loupe rend le premier indice gratuit', () => {
  assert.equal(gameStars({ verdict: 'correct', tries: 1, hintsUsed: 0 }), 3);
  assert.equal(gameStars({ verdict: 'correct', tries: 1, hintsUsed: 1 }), 2);
  assert.equal(gameStars({ verdict: 'correct', tries: 1, hintsUsed: 1 }, { loupe: true }), 3);
  assert.equal(gameStars({ verdict: 'correct', tries: 3, hintsUsed: 2 }), 1);
  assert.equal(gameStars({ verdict: 'incorrect', tries: 1 }), 0);
  assert.equal(gameStars({ verdict: 'correct', tries: 1, solutionShown: true }), 0);
  assert.equal(gameStars({ verdict: 'a-valider', tries: 1 }), 2, 'une réponse à relire par un adulte n’est pas comptée fausse');
  assert.equal(gameStars({ verdict: 'correct', tries: 2, answerRevealed: true }), 1, 'réponse lue dans la correction : réussi, sans éclat');
});

test('tour : réussi, le pion va sur la case visée ; raté, il avance d’une case ; le dé ne se relance pas', () => {
  const g = fixedGame(two());
  const r = rng(3);
  const pend = startTurn(g, r);
  assert.ok(pend.roll >= 1 && pend.roll <= 6);
  assert.equal(startTurn(g, r), pend, 'une partie reprise garde le même lancer');
  let ev = answer(g, { stars: 2 }, r);
  assert.equal(g.players[0].pos, pend.target);
  assert.equal(g.players[0].eclats, 0, 'réussi avec un indice : pas d’éclat');
  assert.ok(ev.some((e) => e.type === 'move' && e.reason === 'reussite'));
  assert.equal(endTurn(g).same, false);
  assert.equal(currentPlayer(g).id, 'b');
  startTurn(g, r);
  ev = answer(g, { stars: 0 }, r);
  assert.equal(g.players[1].pos, 1, 'raté : une seule case');
  assert.ok(ev.some((e) => e.reason === 'petit-pas'));
  endTurn(g);
  assert.equal(g.round, 2);
  assert.equal(currentPlayer(g).id, 'a');
});

test('éclats : premier coup sans indice +1, défi réussi +2, révision réussie +1', () => {
  const g = fixedGame([{ id: 'a', kind: 'profil' }], { 3: { type: 'defi' }, 6: { type: 'revision' } });
  g.pending = { roll: 3, target: 3, question: 'defi', phase: 'question' };
  answer(g, { stars: 3 }, rng(1));
  assert.equal(g.players[0].eclats, 3);
  endTurn(g);
  g.pending = { roll: 3, target: 6, question: 'revision', phase: 'question' };
  answer(g, { stars: 1 }, rng(1));
  assert.equal(g.players[0].eclats, 4);
  assert.deepEqual(g.players[0].stats, { questions: 2, ok: 2, perfect: 1, stars: 4 });
});

test('le Prisme se gagne seulement par une bonne réponse', () => {
  const g = fixedGame(two());
  g.players[0].pos = 22;
  g.pending = { roll: 4, target: 23, question: 'finale', phase: 'question' };
  answer(g, { stars: 0 }, rng(1));
  assert.equal(g.players[0].pos, 22, 'raté juste avant le Prisme : on reste');
  assert.equal(g.players[0].finished, null);
  endTurn(g); startTurn(g, rng(1)); answer(g, { stars: 0 }, rng(1)); endTurn(g);
  g.pending = { roll: 4, target: 23, question: 'finale', phase: 'question' };
  const ev = answer(g, { stars: 3 }, rng(1));
  assert.equal(g.players[0].finished, 1);
  assert.ok(ev.some((e) => e.type === 'arrivee'));
});

test('arc-en-ciel et nuage (rattrapage, bouclier)', () => {
  const g = fixedGame([{ id: 'a', kind: 'profil' }], { 4: { type: 'pont', to: 9 }, 12: { type: 'nuage', to: 7 } });
  g.pending = { roll: 4, target: 4, question: 'classe', phase: 'question' };
  let ev = answer(g, { stars: 2 }, rng(1));
  assert.equal(g.players[0].pos, 9);
  assert.ok(ev.some((e) => e.reason === 'pont'));
  endTurn(g);
  g.pending = { roll: 3, target: 12, question: 'classe', phase: 'question' };
  answer(g, { stars: 2 }, rng(1));
  assert.equal(g.pending.phase, 'rattrapage', 'sur un nuage : une question de rattrapage');
  answer(g, { stars: 1 }, rng(1));
  assert.equal(g.players[0].pos, 12, 'rattrapage réussi : on reste');
  g.players[0].pos = 9;
  g.pending = { roll: 3, target: 12, question: 'classe', phase: 'question' };
  answer(g, { stars: 2 }, rng(1));
  ev = answer(g, { stars: 0 }, rng(1));
  assert.equal(g.players[0].pos, 7, 'rattrapage raté : on glisse');
  assert.ok(ev.some((e) => e.reason === 'nuage'));
  g.players[0].pos = 9; g.players[0].shield = true;
  g.pending = { roll: 3, target: 12, question: 'classe', phase: 'question' };
  ev = answer(g, { stars: 2 }, rng(1));
  assert.equal(g.pending, null, 'le bouclier évite le rattrapage');
  assert.equal(g.players[0].shield, false);
  assert.ok(ev.some((e) => e.type === 'bouclier'));
});

test('cartes Lumière : chaque effet', () => {
  const play = (card, setup = () => {}) => {
    const g = fixedGame([{ id: 'a', kind: 'profil' }, { id: 'b', kind: 'profil' }], { 5: { type: 'carte' }, 8: { type: 'defi' } });
    g.players[1].pos = 3;
    setup(g);
    g.deck = [card];
    g.pending = { roll: 5, target: 5, question: 'classe', phase: 'question' };
    const ev = answer(g, { stars: 2 }, rng(1));
    assert.ok(ev.some((e) => e.type === 'carte' && e.card === card));
    return g;
  };
  assert.equal(play('vent').players[0].pos, 7);
  assert.equal(play('miroir').extraTurn, true);
  const gm = play('miroir'); assert.equal(endTurn(gm).same, true); assert.equal(currentPlayer(gm).id, 'a');
  assert.equal(play('loupe').players[0].loupe, true);
  assert.equal(play('bouclier').players[0].shield, true);
  assert.equal(play('arc').players[0].eclats, 1);
  assert.equal(play('eclipse').players[1].pos, 2, 'les autres reculent d’une case');
  assert.equal(play('etoile').players[0].pos, 8, 'jusqu’à la prochaine case Défi');
  const gc = play('cadeau');
  assert.equal(gc.pending.phase, 'bonus');
  answer(gc, { stars: 2 }, rng(1));
  assert.equal(gc.players[0].pos, 8, 'question cadeau réussie : +3');
  // une carte ne fait jamais entrer dans le Prisme
  const gv = play('vent', (g) => { g.board.cases[21] = { i: 21, type: 'carte' }; });
  gv.players[0].pos = 19; gv.deck = ['vent']; gv.pending = { roll: 2, target: 21, question: 'classe', phase: 'question' };
  answer(gv, { stars: 2 }, rng(1));
  assert.equal(gv.players[0].pos, 22);
  assert.equal(gv.players[0].finished, null);
  assert.equal(Object.keys(CARDS).length, 8);
});

test('dernier tour : chacun joue autant de tours que le premier arrivé, puis classement', () => {
  const g = fixedGame([{ id: 'a', kind: 'profil' }, { id: 'b', kind: 'profil' }, { id: 'c', kind: 'photon' }]);
  g.players[0].pos = 22; g.players[1].pos = 20; g.players[2].pos = 21; g.players[2].eclats = 4;
  g.pending = { roll: 1, target: 23, question: 'finale', phase: 'question' };
  answer(g, { stars: 3 }, rng(1));
  assert.equal(g.lastRound, 1);
  assert.equal(endTurn(g).over, undefined);
  assert.equal(currentPlayer(g).id, 'b', 'les suivants jouent encore ce tour');
  g.pending = { roll: 1, target: 21, question: 'classe', phase: 'question' }; answer(g, { stars: 2 }, rng(1)); endTurn(g);
  g.pending = { roll: 1, target: 22, question: 'classe', phase: 'question' }; answer(g, { stars: 0 }, rng(1));
  assert.equal(endTurn(g).over, true);
  assert.equal(g.over, true);
  assert.deepEqual(ranking(g).map((p) => p.id), ['a', 'c', 'b']);
  assert.throws(() => startTurn(g, rng(1)));
});

test('simulation : toutes les parties se terminent, pions toujours sur le plateau, Photon joue seul', () => {
  for (let s = 1; s <= 400; s++) {
    const rand = rng(s);
    const n = 1 + (s % 4);
    const players = Array.from({ length: n }, (_, k) => (k === n - 1 && n > 1 ? { id: `ph${k}`, kind: 'photon', photonLevel: ['tranquille', 'malin', 'rapide'][s % 3] } : { id: `p${k}`, kind: 'profil' }));
    const size = Object.keys(BOARD_SIZES)[s % 3];
    const g = newGame({ players, size, rand });
    let turns = 0;
    while (!g.over) {
      assert.ok(++turns < 600, 'la partie se termine');
      startTurn(g, rand);
      let guard = 0;
      while (g.pending) {
        assert.ok(++guard < 5);
        const res = currentPlayer(g).kind === 'photon' ? photonResult(g, rand) : { stars: rand() < 0.6 ? 3 : 0 };
        answer(g, res, rand);
      }
      for (const p of g.players) assert.ok(p.pos >= 0 && p.pos <= g.board.n);
      endTurn(g);
    }
    assert.ok(g.players.some((p) => p.finished === 1));
    const rk = ranking(g);
    assert.equal(rk[0].finished, 1);
    assert.equal(JSON.stringify(JSON.parse(JSON.stringify(g))), JSON.stringify(g), 'état sérialisable (partie sauvegardée)');
  }
});

test('nombre de joueurs : de 1 à 4', () => {
  assert.throws(() => newGame({ players: [], rand: rng(1) }));
  assert.throws(() => newGame({ players: Array.from({ length: 5 }, (_, i) => ({ id: String(i) })), rand: rng(1) }));
  const solo = newGame({ players: [{ id: 'a', kind: 'profil' }], rand: rng(1) });
  startTurn(solo, rng(2)); answer(solo, { stars: 2 }, rng(2));
  assert.equal(endTurn(solo).same, true);
  assert.equal(solo.round, 2);
});
