/**
 * Tests de bout en bout dans un vrai navigateur (Edge ou Chrome installé, en mode invisible).
 *   npm run test:e2e
 * 1. crée un profil, ouvre chaque leçon et chaque parcours facultatif : aucune erreur JavaScript,
 *    aucun texte « null », « undefined », « NaN » ni accolade de gabarit non remplacée ;
 * 2. résout une équation avec une erreur de signe, vérifie le diagnostic, puis la bonne réponse ;
 * 3. vérifie que la tentative apparaît dans le tableau de bord parent ;
 * 4. ouvre chaque laboratoire du « Labo ».
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PORT = 10091;
const BASE = `http://localhost:${PORT}/`;
const index = JSON.parse(readFileSync(join(root, 'app', 'content', 'index.json'), 'utf8'));
let server; let browser; let page; const errors = [];

async function launch() {
  for (const channel of ['msedge', 'chrome']) {
    try { return await chromium.launch({ channel, headless: true }); } catch { /* essai suivant */ }
  }
  throw new Error('Aucun navigateur Edge ou Chrome trouvé');
}

before(async () => {
  server = spawn(process.execPath, [join(root, 'tools', 'serve.js')], { env: { ...process.env, PORT: String(PORT) }, stdio: 'pipe' });
  await new Promise((resolve) => server.stdout.once('data', resolve));
  browser = await launch();
  page = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' })).newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|precache/.test(m.text())) errors.push(`console: ${m.text()}`); });
});

after(async () => {
  if (browser) await browser.close();
  if (server) server.kill();
});

async function pageTextProblems() {
  const text = await page.locator('#app').innerText();
  const problems = [];
  if (/\bnull\b|\bundefined\b|\bNaN\b/.test(text)) problems.push(text.match(/.{0,40}\b(null|undefined|NaN)\b.{0,40}/)[0]);
  const brace = text.match(/\{[a-zA-Z][^{}\n]{0,25}\}/);
  if (brace) problems.push(`gabarit non remplacé : ${brace[0]}`);
  if (/Oups, cette page/.test(text)) problems.push('page en erreur');
  return problems;
}

test('création de profil', async () => {
  await page.goto(`${BASE}#/profils`);
  await page.fill('#pseudo', 'Testeur');
  await page.getByRole('button', { name: '4e', exact: true }).click();
  await page.getByRole('button', { name: /Créer mon profil/ }).click();
  await page.waitForURL(/#\/$/);
  await page.waitForSelector('h1');
  assert.match(await page.locator('h1').innerText(), /Testeur/);
});

test('chaque leçon et chaque parcours s’affichent sans erreur', async () => {
  for (const l of index.lessons) {
    for (const track of ['', '?parcours=approfondissement', '?parcours=expert']) {
      if (track && !l.counts[track.split('=')[1]]) continue;
      await page.goto(`${BASE}#/lecon/${l.id}${track}`);
      await page.waitForSelector('.ex', { timeout: 8000 });
      await page.waitForTimeout(150);
      const problems = await pageTextProblems();
      assert.deepEqual(problems, [], `${l.id}${track} : ${problems.join(' | ')}`);
    }
  }
  assert.deepEqual(errors, [], errors.join('\n'));
});

test('équation : erreur de signe diagnostiquée ligne par ligne, puis réussite', async () => {
  await page.goto(`${BASE}#/lecon/m4-equations`);
  const ex = page.locator('.ex--steps').first();
  await ex.scrollIntoViewIfNeeded();
  const prompt = await ex.locator('.ex-prompt').innerText();
  const m = prompt.replace(/−/g, '-').match(/(\d+)x\s*([+-])\s*(\d+)\s*=\s*(-?\d+)/);
  assert.ok(m, `énoncé inattendu : ${prompt}`);
  const a = Number(m[1]); const b = (m[2] === '-' ? -1 : 1) * Number(m[3]); const c = Number(m[4]);
  const input = ex.locator('.step-line input').first();
  await input.fill(`${a}x = ${c + b}`); // signe non changé
  await ex.getByRole('button', { name: 'Valider' }).click();
  await ex.locator('.feedback').waitFor();
  assert.match(await ex.locator('.feedback').innerText(), /Erreur de signe/);
  await input.fill(`${a}x = ${c - b}`);
  await input.press('Enter');
  await ex.locator('.step-line input').nth(1).fill(`x = ${(c - b) / a}`);
  await ex.getByRole('button', { name: 'Valider' }).click();
  await page.waitForTimeout(200);
  assert.match(await ex.locator('.feedback').innerText(), /Réussi|juste/);
});

test('la tentative apparaît dans le tableau de bord parent', async () => {
  await page.goto(`${BASE}#/parents`);
  await page.waitForSelector('.kpis');
  const text = await page.locator('#app').innerText();
  assert.match(text, /Tableau de bord pédagogique/);
  assert.match(text, /Résoudre une équation du premier degré/);
});

test('chaque laboratoire se charge', async () => {
  for (const g of ['maths', 'pc', 'numerique']) {
    await page.goto(`${BASE}#/labo?g=${g}`);
    await page.waitForSelector('.btn-row a');
    const links = await page.locator('.btn-row a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    for (const href of links) {
      await page.goto(`${BASE}${href}`);
      await page.waitForSelector('.activity:not([aria-busy])', { timeout: 8000 });
      await page.waitForTimeout(200);
      const problems = await pageTextProblems();
      assert.deepEqual(problems, [], `${href} : ${problems.join(' | ')}`);
    }
  }
  assert.deepEqual(errors, [], errors.join('\n'));
});
