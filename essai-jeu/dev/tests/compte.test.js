/** Comptes sur l'appareil : codes secrets (images, chiffres, mot de passe), empreintes PBKDF2, attente après erreurs, sauvegarde. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
const W = new URL('../../js/', import.meta.url).href;
const C = await import(W + 'engine/compte.js');
const B = await import(W + 'storage/backup.js');

test('codes valables : 4 images, 4 chiffres, mot de passe d’au moins 6 caractères', () => {
  assert.equal(C.normalizeSecret('images', [3, 1, 7, 0]), '3-1-7-0');
  assert.equal(C.normalizeSecret('images', [3, 3, 3, 3]), '3-3-3-3', 'une image peut revenir');
  assert.equal(C.normalizeSecret('images', [3, 1, 7]), null);
  assert.equal(C.normalizeSecret('images', [3, 1, 7, 9]), null);
  assert.equal(C.normalizeSecret('pin', '0427'), '0427');
  assert.equal(C.normalizeSecret('pin', '427'), null);
  assert.equal(C.normalizeSecret('pin', 'abcd'), null);
  assert.equal(C.normalizeSecret('motdepasse', 'soleil'), 'soleil');
  assert.equal(C.normalizeSecret('motdepasse', 'chat'), null);
  assert.equal(C.normalizeSecret('autre', '1234'), null);
  assert.equal(C.PICTOS.length, 9);
});

test('empreinte : jamais le code en clair ; le bon code ouvre, un autre non ; sel différent à chaque fois', async () => {
  const s = await C.makeSecret('images', [2, 4, 4, 8]);
  assert.equal(s.kind, 'images');
  assert.match(s.hash, /^[0-9a-f]{64}$/);
  assert.ok(!JSON.stringify(s).includes('2-4-4-8'));
  assert.equal(await C.checkSecret(s, [2, 4, 4, 8]), true);
  assert.equal(await C.checkSecret(s, [2, 4, 8, 4]), false);
  const t = await C.makeSecret('images', [2, 4, 4, 8]);
  assert.notEqual(s.salt, t.salt);
  assert.notEqual(s.hash, t.hash);
  const p = await C.makeSecret('pin', '0427');
  assert.equal(await C.checkSecret(p, '0427'), true);
  assert.equal(await C.checkSecret(p, '0428'), false);
  assert.equal(await C.checkSecret(null, 'n’importe quoi'), true, 'sans code, le compte s’ouvre');
  await assert.rejects(C.makeSecret('pin', '12'));
});

test('attente après les erreurs : rien avant la cinquième, puis 30 s, 60 s… au plus 10 minutes', () => {
  assert.equal(C.lockDelay(4), 0);
  assert.equal(C.lockDelay(5), 30000);
  assert.equal(C.lockDelay(6), 60000);
  assert.equal(C.lockDelay(20), 600000);
});

test('sauvegarde : l’empreinte suit le profil ; une empreinte abîmée est écartée', async () => {
  const secret = await C.makeSecret('motdepasse', 'comete42');
  const ok = B.validateBackup(B.buildBackup([{ profile: { id: 'p-1', pseudo: 'Lou', symbol: '★', color: '#3b4cca', level: 'CM1', secret }, states: {}, attempts: [], submissions: [] }]));
  assert.deepEqual(ok.profiles[0].profile.secret, secret);
  const bad = B.validateBackup(B.buildBackup([{ profile: { id: 'p-2', pseudo: 'Max', level: 'CM1', secret: { kind: 'pin', salt: 'zz', hash: 'nope' } }, states: {}, attempts: [] }]));
  assert.equal(bad.profiles[0].profile.secret, undefined);
  assert.equal(C.cleanSecret({ kind: 'images', salt: 'a'.repeat(32), hash: 'b'.repeat(64), iter: 5 }).iter, C.ITERATIONS);
});
