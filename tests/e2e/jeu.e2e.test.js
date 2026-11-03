/**
 * Jeu de plateau dans un vrai navigateur (Edge ou Chrome, ou CHROME_PATH) :
 *   npm run test:e2e
 * 1. deux profils de classes différentes jouent à tour de rôle : chacun reçoit une question de sa classe
 *    et sa tentative va dans SON profil ; l'en-tête garde le profil de l'appareil ;
 * 2. la partie se sauvegarde, se reprend après avoir quitté la page, et se termine par le classement ;
 * 3. contre Photon, l'ordinateur joue seul son tour ; aucune erreur JavaScript, aucun « undefined ».
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PORT = 10093;
const BASE = `http://localhost:${PORT}/`;
let server; let browser; let page; const errors = [];

async function launch() {
  for (const channel of ['msedge', 'chrome']) {
    try { return await chromium.launch({ channel, headless: true }); } catch { /* essai suivant */ }
  }
  if (process.env.CHROME_PATH) return chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true });
  throw new Error('Aucun navigateur Edge ou Chrome trouvé (ou indiquer CHROME_PATH)');
}

before(async () => {
  server = spawn(process.execPath, [join(root, 'tools', 'serve.js')], { env: { ...process.env, PORT: String(PORT) }, stdio: 'pipe' });
  await new Promise((resolve) => server.stdout.once('data', resolve));
  browser = await launch();
  page = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' })).newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|precache/.test(m.text())) errors.push(`console: ${m.text()}`); });
});

after(async () => {
  if (browser) await browser.close();
  if (server) server.kill();
});

async function createProfile(name, level) {
  await page.goto(`${BASE}#/profils`);
  await page.fill('#pseudo', name);
  await page.getByRole('button', { name: level, exact: true }).click();
  await page.getByRole('button', { name: /Créer mon profil/ }).click();
  await page.waitForSelector('.reco-list, .empty');
}

/** Affiche la correction (sans répondre), puis déplace le pion ; répond aussi aux questions de rattrapage ou cadeau. */
async function playTurnByGivingUp() {
  const roll = page.locator('.jeu-roll');
  if (await roll.count()) await roll.click();
  for (let q = 0; q < 3; q++) {
    await page.waitForSelector('.jeu-ex-slot .ex, .jeu-ex-slot .warn', { timeout: 15000 });
    const text = await page.locator('#app').innerText();
    assert.doesNotMatch(text, /\bundefined\b|\bNaN\b|\bnull\b/);
    for (let k = 0; k < 2; k++) {
      const sol = page.locator('.jeu-ex-slot .ex-actions button:visible', { hasText: /correction|quand même/ });
      if (await sol.count()) await sol.first().click();
    }
    await page.getByRole('button', { name: /Déplacer mon pion/ }).click();
    await page.waitForSelector('.jeu-next button', { timeout: 15000 });
    const next = page.locator('.jeu-next button').first();
    if (!/rattrapage|cadeau/i.test(await next.innerText())) return next;
    await next.click();
  }
  return page.locator('.jeu-next button').first();
}

const fromStore = (fn) => page.evaluate(fn);

test('à deux, chacun sa classe : les tentatives vont dans le profil de celui qui joue', async () => {
  await createProfile('Tom', '4e');
  await createProfile('Léa', '5e');
  await page.goto(`${BASE}#/jeu`);
  await page.waitForSelector('.jeu-setup');
  await page.getByRole('button', { name: /\+ Tom/ }).click();
  await page.locator('input[value="courte"]').check();
  await page.getByRole('button', { name: /Commencer la partie/ }).click();
  await page.waitForSelector('.board .pawn');
  assert.equal(await page.locator('.board .pawn').count(), 2);
  const fills = await page.locator('.board .pawn-body').evaluateAll((els) => els.map((e) => e.getAttribute('fill')));
  assert.notEqual(fills[0], fills[1], 'deux profils de même couleur ont des pions différents');
  for (const who of ['Léa', 'Tom', 'Léa', 'Tom']) {
    assert.match(await page.locator('.jeu-turn-head h2').first().innerText(), new RegExp(who));
    const next = await playTurnByGivingUp();
    await next.click();
  }
  assert.match(await page.locator('#who').innerText(), /Léa/, 'l’en-tête garde le profil de l’appareil');
  const data = await fromStore(async () => {
    const st = await import('/js/app/store.js');
    const out = {};
    for (const p of st.store.profiles) {
      const d = await st.profileData(p.id);
      out[p.pseudo] = d.attempts.map((a) => ({ context: a.context, skill: a.skill }));
    }
    return { out, levels: Object.fromEntries([...st.store.index.skills.values()].map((s) => [s.id, String(s.level || '').toLowerCase()])) };
  });
  for (const [name, level] of [['Léa', '5e'], ['Tom', '4e']]) {
    assert.ok(data.out[name].length >= 2, `${name} : ses tentatives sont dans son profil`);
    assert.ok(data.out[name].every((a) => a.context === 'jeu:plateau'));
    const known = data.out[name].map((a) => data.levels[a.skill]).filter(Boolean);
    assert.ok(known.every((l) => l === level || l === ''), `${name} : questions de sa classe (${known.join(', ')})`);
  }
});

test('la partie se reprend, puis se termine par le classement', async () => {
  await page.goto(`${BASE}#/carnet`);
  const after1 = await fromStore(async () => { const st = await import('/js/app/store.js'); return { who: st.store.profile.pseudo, shared: st.store.sharedPlay }; });
  assert.deepEqual(after1, { who: 'Léa', shared: false }, 'en quittant le jeu, le profil de l’appareil est rendu');
  // Tom est entré dans le Prisme pendant ce tour ; Léa joue le dernier tour
  await fromStore(async () => {
    const st = await import('/js/app/store.js');
    const g = await st.getSetting('jeu:partie', null);
    Object.assign(g.players[1], { pos: g.board.n, finished: 1 });
    Object.assign(g, { arrivals: 1, lastRound: g.round, turn: 0, pending: null });
    await st.setSetting('jeu:partie', g);
  });
  await page.goto(`${BASE}#/jeu`);
  await page.getByRole('button', { name: 'Reprendre la partie' }).click();
  const last = await playTurnByGivingUp();
  assert.match(await last.innerText(), /classement/);
  await last.click();
  await page.waitForSelector('.jeu-podium');
  assert.match(await page.locator('.jeu-podium li').first().innerText(), /Tom/);
  const saved = await fromStore(async () => { const st = await import('/js/app/store.js'); return st.getSetting('jeu:partie', null); });
  assert.equal(saved, null, 'une partie terminée n’est plus proposée à la reprise');
});

test('contre Photon : l’ordinateur joue seul son tour', async () => {
  await page.getByRole('button', { name: 'Changer les joueurs' }).click();
  await page.waitForSelector('.jeu-setup');
  await page.getByRole('button', { name: /Retirer Tom/ }).click();
  await page.getByRole('button', { name: /Photon/ }).click();
  await page.getByRole('button', { name: /Commencer la partie/ }).click();
  const next = await playTurnByGivingUp();
  assert.match(await next.innerText(), /Photon/);
  await next.click();
  await page.waitForSelector('.jeu-next button', { timeout: 15000 });
  assert.match(await page.locator('.jeu-log').innerText(), /Photon fait \d/);
  assert.match(await page.locator('.jeu-next button').first().innerText(), /Léa/);
  assert.deepEqual(errors, []);
});
