#!/usr/bin/env node
/**
 * Construction complète (sans dépendance) :
 *  1. parcours rédigés + catalogue + programmes (si la recherche documentaire est présente) ;
 *  2. validation des contenus + index léger ;
 *  3. liste de pré-cache pour le fonctionnement hors connexion (precache.json, version = empreinte des fichiers).
 */
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { hashString } from '../app/js/core/template.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const app = join(root, 'app');
const run = (script, args = []) => execFileSync(process.execPath, [join(root, 'tools', script), ...args], { stdio: 'inherit' });

const research = existsSync(join(root, 'research', 'programmes-catalogue.json'));
if (research) run('authored-courses.js');
run('link-chapters.js');
if (research) {
  run('build-catalog.js');
  run('build-resources.js');
}
run('validate-content.js');

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const rel = relative(app, p).split('\\').join('/');
    if (rel.startsWith('dev/') || rel === 'precache.json' || rel === 'sw.js' || name.startsWith('.')) continue;
    if (statSync(p).isDirectory()) walk(p);
    else files.push(rel);
  }
})(app);
files.sort();
let h = 0;
for (const f of files) h = hashString(`${h}:${f}:${hashString(readFileSync(join(app, f)).toString('latin1'))}`);
const version = h.toString(36);
writeFileSync(join(app, 'precache.json'), JSON.stringify({ version, files: ['./', ...files] }));
// la version est inscrite dans sw.js : le fichier change, donc le navigateur installe la nouvelle version
const swPath = join(app, 'sw.js');
writeFileSync(swPath, readFileSync(swPath, 'utf8').replace(/const VERSION = '[^']*';/, `const VERSION = '${version}';`));
console.log(`✓ Pré-cache : ${files.length} fichiers, version ${version}`);
