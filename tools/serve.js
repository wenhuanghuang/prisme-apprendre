#!/usr/bin/env node
/**
 * Serveur statique de développement (aucune dépendance). Port réservé au projet : 10090.
 *   node tools/serve.js            → http://localhost:10090/
 *   PORT=10091 node tools/serve.js
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'app');
const port = Number(process.env.PORT || 10090);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${port}`);
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    const file = normalize(join(root, rel));
    if (!file.startsWith(root)) { res.writeHead(403).end('Interdit'); return; }
    const info = await stat(file).catch(() => null);
    if (!info || !info.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Introuvable'); return; }
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    });
    res.end(body);
  } catch (e) {
    res.writeHead(500).end('Erreur serveur');
    console.error(e);
  }
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') console.error(`Le port ${port} est déjà utilisé. Essayez : PORT=${port + 1} node tools/serve.js`);
  else console.error(e);
  process.exit(1);
});
server.listen(port, '127.0.0.1', () => console.log(`Prisme : http://localhost:${port}/`));
