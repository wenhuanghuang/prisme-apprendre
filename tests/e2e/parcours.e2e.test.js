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

test('débogage : l’éditeur s’ouvre avec le programme à corriger (jamais vide)', async () => {
  const lesson = JSON.parse(readFileSync(join(root, 'app', 'content', 'lessons', 'code-variables.json'), 'utf8'));
  const withStart = lesson.exercises.filter((e) => e.type === 'code' && e.start && /\b(mets|ajoute|si|pour)\b/.test(e.start));
  assert.ok(withStart.length > 0, 'au moins un programme de départ en mode texte');
  await page.goto(`${BASE}#/lecon/code-variables`);
  await page.waitForSelector('.code-editor');
  const texts = await page.locator('.code-editor .code-text').evaluateAll((tas) => tas.filter((t) => !t.closest('[hidden]')).map((t) => t.value));
  assert.ok(texts.length > 0, 'des éditeurs en mode texte sont affichés');
  assert.ok(texts.every((t) => t.trim().length > 0), 'aucun éditeur texte vide');
});

test('Espace exercices : une série par matière (5e et 4e) démarre sans erreur', async () => {
  for (const level of ['5e', '4e']) {
    await page.goto(`${BASE}#/exercices`);
    await page.waitForSelector('.series-form select');
    await page.locator('.series-form select').first().selectOption(level);
    await page.waitForTimeout(150);
    const subjects = await page.locator('.series-form select').nth(1).evaluate((s) => [...s.options].map((o) => o.value));
    assert.ok(subjects.length >= 3, `${level} : seulement ${subjects.join(', ')}`);
    for (const subject of subjects) {
      // adresse unique : revenir à la même adresse ne recharge pas la vue
      await page.goto(`${BASE}#/exercices?essai=${level}-${subject}`);
      await page.waitForSelector('.series-form select');
      await page.locator('.series-form select').first().selectOption(level);
      await page.waitForTimeout(100);
      await page.locator('.series-form select').nth(1).selectOption(subject);
      await page.waitForTimeout(150);
      await page.getByRole('button', { name: 'Commencer la série' }).click();
      await page.waitForSelector('.series-stage .ex', { timeout: 8000 });
      const problems = await pageTextProblems();
      assert.deepEqual(problems, [], `${level} ${subject} : ${problems.join(' | ')}`);
    }
  }
  assert.deepEqual(errors, [], errors.join('\n'));
});

test('Espace exercices : chaque générateur produit un exercice corrigeable', async () => {
  await page.goto(`${BASE}#/exercices?onglet=generateurs`);
  await page.waitForSelector('.gen-card');
  await page.locator('.series-grid select').first().selectOption('tous');
  await page.waitForTimeout(150);
  const n = await page.locator('.gen-card').count();
  assert.ok(n >= 17, `${n} générateurs`);
  for (let i = 0; i < n; i++) {
    await page.goto(`${BASE}#/exercices?onglet=generateurs&essai=${i}`);
    await page.waitForSelector('.gen-card');
    await page.locator('.series-grid select').first().selectOption('tous');
    await page.waitForTimeout(100);
    const card = page.locator('.gen-card').nth(i);
    const title = await card.locator('h3').innerText();
    await card.getByRole('button', { name: 'S’entraîner' }).click();
    await page.waitForSelector('.ex', { timeout: 8000 });
    const problems = await pageTextProblems();
    assert.deepEqual(problems, [], `${title} : ${problems.join(' | ')}`);
    await page.getByRole('button', { name: 'Voir la correction' }).click();
    await page.getByRole('button', { name: /Voir la correction|voir quand même/ }).click();
    await page.waitForSelector('.solution, .ex-extra section', { timeout: 4000 });
  }
  assert.deepEqual(errors, [], errors.join('\n'));
});

test('mots à repérer : utilisables au clavier (flèches + Espace)', async () => {
  const hl = index.exercises.find((e) => e.type === 'highlight' && e.track === 'classe');
  assert.ok(hl, 'au moins un exercice de repérage');
  await page.goto(`${BASE}#/lecon/${hl.lesson}`);
  const word = page.locator('.hl-word').first();
  await word.waitFor({ timeout: 8000 });
  await word.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Space');
  assert.equal(await page.locator('.hl-word').nth(1).getAttribute('aria-pressed'), 'true');
});

test('fiche imprimable : énoncés puis corrigé', async () => {
  await page.goto(`${BASE}#/exercices`);
  await page.waitForSelector('.series-form');
  await page.evaluate(() => { window.print = () => { window.__printed = true; }; });
  await page.getByRole('button', { name: /Imprimer une fiche/ }).click();
  await page.waitForFunction(() => window.__printed === true, null, { timeout: 8000 });
  const sheet = await page.locator('.print-sheet').evaluate((s) => ({ items: s.querySelectorAll(':scope > .ps-list > li').length, answers: s.querySelectorAll('.ps-answers li').length, text: s.textContent }));
  assert.ok(sheet.items >= 5, `${sheet.items} exercices imprimés`);
  assert.equal(sheet.items, sheet.answers);
  assert.ok(!/undefined|NaN/.test(sheet.text), 'fiche sans valeur manquante');
});
