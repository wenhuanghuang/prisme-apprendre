/** Passer d'un appareil à l'autre : fichier de compte chiffré, et fusion de deux appareils sans rien perdre. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
const W = new URL('../../js/', import.meta.url).href;
const S = await import(W + 'engine/sync.js');
const T = await import(W + 'storage/transfer.js');
const B = await import(W + 'storage/backup.js');

const DAY = 86400000;
const t0 = Date.UTC(2026, 9, 1);
const profile = (extra = {}) => ({ id: 'p-lou', pseudo: 'Lou', symbol: '◆', color: '#3b4cca', level: 'CM1', createdAt: t0, demo: false, ...extra });
const att = (d, skill, ex, verdict = 'correct', id) => ({ ...(id ? { id } : {}), ts: t0 + d * DAY, skill, exerciseId: ex, verdict, credit: 1, score: 1 });
const ev = (type, id, d) => ({ type, id, ts: t0 + d * DAY });
const skill = (id, lastTs, n, pL) => ({ skill: id, lastTs, n, pL });

const tablette = {
  profile: profile({ level: 'CM1' }),
  states: { skills: { 'mp.calcul': skill('mp.calcul', t0 + 2 * DAY, 4, 0.5), 'fp.lecture': skill('fp.lecture', t0 + 3 * DAY, 2, 0.3) },
    lessons: { L1: { done: { e1: 1, e2: 0.5 }, seen: [0, 1], lastTs: t0 + DAY } },
    game: { events: [ev('lecon', 'L1', 1), ev('memoire', '2026-10-02', 1)], goals: [{ from: '2026-10-01', xp: 60 }], records: { 'eclair:cm1': { ms: 42000, at: t0 }, 'estime:cm1': { score: 5, at: t0 } }, equipped: { tint: 'soleil', accessory: null }, seenLevel: 2 } },
  attempts: [att(1, 'mp.calcul', 'x1', 'correct', 7), att(2, 'mp.calcul', 'x2', 'incorrect', 8), att(3, 'fp.lecture', 'x3')],
  submissions: [{ id: 'p-lou::s1', skill: 'fp.ecrire', versions: [{ text: 'a' }], status: 'en-attente' }],
};
const ordi = {
  profile: profile({ level: 'CM2', symbol: '★' }),
  states: { skills: { 'mp.calcul': skill('mp.calcul', t0 + 5 * DAY, 9, 0.8), 'st.lune': skill('st.lune', t0 + 4 * DAY, 3, 0.6) },
    lessons: { L1: { done: { e2: 1, e3: 1 }, seen: [2], lastTs: t0 + 5 * DAY }, L2: { done: { f1: 1 }, seen: [0], lastTs: t0 + 4 * DAY } },
    game: { events: [ev('lecon', 'L1', 1), ev('frise', '2026-10-05', 5), ev('chapitre', 'cm1-st-lune', 5)], goals: [{ from: '2026-10-04', xp: 80 }], records: { 'eclair:cm1': { ms: 39000, at: t0 + 5 * DAY }, 'estime:cm1': { score: 4, at: t0 + 5 * DAY } }, equipped: { tint: 'menthe', accessory: null }, seenLevel: 3 } },
  attempts: [att(1, 'mp.calcul', 'x1', 'correct', 1), att(4, 'st.lune', 'y1'), att(5, 'mp.calcul', 'x4')],
  submissions: [{ id: 'p-lou::s1', skill: 'fp.ecrire', versions: [{ text: 'a' }, { text: 'b' }], status: 'valide' }, { id: 'p-lou::s2', skill: 'fp.ecrire', versions: [{ text: 'c' }], status: 'en-attente' }],
};

test('fusion : rien n’est perdu, rien n’est compté deux fois', () => {
  const { account: m, added } = S.mergeAccounts(tablette, ordi);
  assert.equal(m.attempts.length, 5, 'x1 fait des deux côtés compte une fois');
  assert.ok(m.attempts.every((a) => !('id' in a)), 'les identifiants propres à chaque appareil sont retirés');
  assert.deepEqual(m.attempts.map((a) => a.exerciseId), ['x1', 'x2', 'x3', 'y1', 'x4']);
  assert.equal(added.attempts, 2);
  assert.deepEqual(m.states.game.events.map((e) => e.type), ['lecon', 'memoire', 'frise', 'chapitre']);
  assert.equal(added.events, 2);
  // notions : la plus récente gagne ; les autres sont gardées
  assert.equal(m.states.skills['mp.calcul'].n, 9);
  assert.ok(m.states.skills['fp.lecture'] && m.states.skills['st.lune']);
  // leçons : sections vues et meilleurs crédits réunis
  assert.deepEqual(m.states.lessons.L1.done, { e1: 1, e2: 1, e3: 1 });
  assert.deepEqual(m.states.lessons.L1.seen, [0, 1, 2]);
  assert.ok(m.states.lessons.L2);
  // records : le meilleur temps, le meilleur score
  assert.equal(m.states.game.records['eclair:cm1'].ms, 39000);
  assert.equal(m.states.game.records['estime:cm1'].score, 5);
  assert.deepEqual(m.states.game.goals.map((g) => g.from), ['2026-10-01', '2026-10-04']);
  assert.equal(m.states.game.seenLevel, 3);
  // profil et apparence : l'appareil utilisé en dernier (l'ordinateur)
  assert.equal(m.profile.level, 'CM2');
  assert.equal(m.profile.symbol, '★');
  assert.equal(m.states.game.equipped.tint, 'menthe');
  // réponses rédigées : la version relue l'emporte, la nouvelle est ajoutée
  assert.equal(m.submissions.length, 2);
  assert.equal(m.submissions.find((s) => s.id === 'p-lou::s1').status, 'valide');
});

test('fusion symétrique : dans les deux sens, le même résultat', () => {
  const a = S.mergeAccounts(tablette, ordi).account; const b = S.mergeAccounts(ordi, tablette).account;
  assert.deepEqual(a.attempts, b.attempts);
  assert.deepEqual(a.states.skills, b.states.skills);
  assert.deepEqual(a.states.game.events, b.states.game.events);
  assert.deepEqual(a.states.game.records, b.states.game.records);
  assert.equal(a.profile.level, b.profile.level);
  // et refusionner ne change plus rien
  const again = S.mergeAccounts(a, ordi);
  assert.equal(again.added.attempts, 0);
  assert.equal(again.added.events, 0);
});

test('code secret : la protection n’est jamais perdue en fusionnant', () => {
  const secret = { kind: 'pin', salt: 'AAAAAAAAAAAAAAAAAAAAAA==', iter: 100000, hash: 'x'.repeat(44) };
  const locked = { ...tablette, profile: profile({ secret }) };
  assert.deepEqual(S.mergeAccounts(locked, ordi).account.profile.secret, secret, 'l’ordinateur, plus récent, n’a pas de code : on garde celui de la tablette');
  assert.deepEqual(S.mergeAccounts(ordi, locked).account.profile.secret, secret);
  assert.equal('secret' in S.mergeAccounts(tablette, ordi).account.profile, false);
});

test('code de transfert : 12 caractères lisibles, remis en forme', () => {
  const codes = new Set();
  for (let k = 0; k < 200; k++) {
    const c = T.newTransferCode();
    assert.match(c, /^[A-HJKMNP-TW-Z2-9]{4}-[A-HJKMNP-TW-Z2-9]{4}-[A-HJKMNP-TW-Z2-9]{4}$/);
    assert.equal(T.normalizeCode(c.toLowerCase().replace(/-/g, ' ')), c.replace(/-/g, ''));
    codes.add(c);
  }
  assert.equal(codes.size, 200);
  assert.equal(T.normalizeCode('ABCD-EFGH'), null);
  assert.equal(T.normalizeCode('ABCD-EFGH-IJK0'), null, 'I et 0 ne font pas partie des codes');
});

test('fichier de compte : il ne s’ouvre qu’avec son code, et redonne exactement le compte', async () => {
  const backup = B.buildBackup([tablette]);
  const code = T.newTransferCode();
  const file = await T.packAccount(backup, code, { pseudo: 'Lou' });
  assert.equal(file.format, 'prisme-compte');
  assert.equal(file.pseudo, 'Lou');
  const json = JSON.stringify(file);
  assert.ok(!json.includes('mp.calcul') && !json.includes('attempts') && !json.includes('"level"'), 'le contenu n’est pas lisible en clair');
  assert.ok(T.isAccountFile(JSON.parse(json)));
  const ok = await T.unpackAccount(JSON.parse(json), code.toLowerCase());
  assert.ok(ok.ok);
  assert.deepEqual(ok.backup, JSON.parse(JSON.stringify(backup)));
  assert.equal(B.validateBackup(ok.backup).profiles.length, 1);
  const wrong = await T.unpackAccount(file, T.newTransferCode());
  assert.equal(wrong.ok, false);
  assert.match(wrong.error, /pas le bon code/);
  const tampered = { ...file, data: file.data.slice(0, 20) + (file.data[20] === 'A' ? 'B' : 'A') + file.data.slice(21) };
  assert.equal((await T.unpackAccount(tampered, code)).ok, false, 'un fichier modifié est refusé');
  assert.match((await T.unpackAccount(file, '123')).error, /12 caractères/);
  assert.match((await T.unpackAccount({ format: 'prisme-sauvegarde' }, code)).error, /pas un fichier de compte/);
  assert.match((await T.unpackAccount({ ...file, version: 9 }, code)).error, /plus récente/);
});
