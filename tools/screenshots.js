#!/usr/bin/env node
/**
 * Captures d'écran pour la documentation (Edge ou Chrome installé, invisible) → docs/captures/*.png
 *   node tools/screenshots.js
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'docs', 'captures');
mkdirSync(out, { recursive: true });
const PORT = 10092;
const BASE = `http://localhost:${PORT}/`;

const server = spawn(process.execPath, [join(root, 'tools', 'serve.js')], { env: { ...process.env, PORT: String(PORT) }, stdio: 'pipe' });
await new Promise((r) => server.stdout.once('data', r));
let browser;
for (const channel of ['msedge', 'chrome']) { try { browser = await chromium.launch({ channel, headless: true }); break; } catch { /* suivant */ } }
const page = await (await browser.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1, serviceWorkers: 'block' })).newPage();
const shot = async (name, opts = {}) => { await page.waitForTimeout(500); await page.screenshot({ path: join(out, `${name}.png`), ...opts }); console.log(`✓ ${name}.png`); };

try {
  await page.goto(`${BASE}#/profils`);
  await shot('01-accueil');
  await page.getByRole('button', { name: /Charger les profils fictifs/ }).click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /Comète/ }).click();
  await page.waitForSelector('.reco');
  await shot('02-aujourdhui-comete');

  await page.goto(`${BASE}#/lecon/m4-equations`);
  await page.waitForSelector('.bal-svg');
  await page.locator('#sec-0').scrollIntoViewIfNeeded();
  await shot('03-lecon-balance');

  const ex = page.locator('.ex--steps').first();
  const prompt = await ex.locator('.ex-prompt').innerText();
  const m = prompt.replace(/−/g, '-').match(/(\d+)x\s*([+-])\s*(\d+)\s*=\s*(-?\d+)/);
  const a = Number(m[1]); const b = (m[2] === '-' ? -1 : 1) * Number(m[3]); const c = Number(m[4]);
  await ex.locator('.step-line input').first().fill(`${a}x = ${c + b}`);
  await ex.locator('.step-line input').first().press('Enter');
  await ex.locator('.step-line input').nth(1).fill(`x = ${c + b}/${a}`);
  await ex.getByRole('button', { name: 'Valider' }).click();
  await ex.locator('.feedback').waitFor();
  await ex.scrollIntoViewIfNeeded();
  await ex.screenshot({ path: join(out, '04-diagnostic-etapes.png') });
  console.log('✓ 04-diagnostic-etapes.png');

  await page.goto(`${BASE}#/lecon/m4-equations?parcours=expert`);
  await page.waitForSelector('.ex');
  await shot('05-parcours-expert');

  await page.goto(`${BASE}#/labo?g=pc&a=ohm-lab`);
  await page.waitForSelector('.activity:not([aria-busy])');
  for (const v of [3, 6, 9]) {
    const range = page.locator('.activity input[type="range"]').first();
    await range.evaluate((el, val) => { el.value = String(val); el.dispatchEvent(new Event('input', { bubbles: true })); }, v);
    const mesure = page.getByRole('button', { name: /^Mesurer$/ });
    if (await mesure.count()) await mesure.first().click();
  }
  await page.locator('.activity').scrollIntoViewIfNeeded();
  await shot('06-labo-ohm');

  await page.goto(`${BASE}#/parents`);
  await page.waitForSelector('.kpis');
  await page.getByRole('tab', { name: /Nova/ }).click();
  await page.waitForTimeout(500);
  await shot('07-parents-nova', { fullPage: false });

  await page.goto(`${BASE}#/carte/maths?niveau=5e`);
  await page.waitForSelector('.station');
  await shot('08-carte-maths-5e');

  await page.goto(`${BASE}#/programmes`);
  await page.waitForSelector('.matrix');
  await shot('09-programmes');

  await page.goto(`${BASE}#/labo?g=numerique&a=knn-lab`);
  await page.waitForSelector('.knn-svg');
  await shot('10-labo-ia');

  await page.goto(`${BASE}#/exercices`);
  await page.waitForSelector('.series-form select');
  await shot('11-espace-exercices', { fullPage: false });

  // mots à repérer en français, corrigés : juste / en trop restent lisibles sans la couleur
  await page.goto(`${BASE}#/lecon/fr5-classes-fonctions`);
  const hl = page.locator('.ex--highlight').first();
  await hl.waitFor();
  await hl.locator('.hl-word').nth(1).click();
  await hl.locator('.hl-word').nth(3).click();
  await hl.getByRole('button', { name: 'Valider' }).click();
  await hl.locator('.feedback').waitFor();
  await hl.scrollIntoViewIfNeeded();
  await hl.screenshot({ path: join(out, '12-mots-a-reperer.png') });
  console.log('✓ 12-mots-a-reperer.png');

  await page.goto(`${BASE}#/exercices?onglet=generateurs`);
  await page.waitForSelector('.gen-card');
  await page.locator('.gen-card').filter({ hasText: 'Fractions : additions' }).getByRole('button', { name: 'S’entraîner' }).click();
  await page.waitForSelector('.ex');
  await shot('13-generateur-fractions', { fullPage: false });
} finally {
  await browser.close();
  server.kill();
}
