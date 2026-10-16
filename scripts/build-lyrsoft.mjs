// Builds the Lyrsoft Work app (lyrsoft/) into dist-lyrsoft/.
// Like the Lyrcloud site, assets go under /assets/<content hash>/ so they can be cached forever.
// The shared Cognito helpers (src/auth.js) are copied alongside, and config.js carries the API URL
// from LYRSOFT_API_BASE (set by scripts/deploy-lyrsoft.sh from the lyrsoft-work-api stack).
import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const OUT = 'dist-lyrsoft';
const apiBase = (process.env.LYRSOFT_API_BASE || 'http://localhost:8787').replace(/\/$/, '');

const files = new Map();
for (const name of await readdir('lyrsoft')) {
  if (/\.(js|css)$/.test(name)) files.set(name, await readFile(join('lyrsoft', name)));
}
files.set('auth.js', await readFile('src/auth.js'));
files.set('config.js', Buffer.from(`export const WORK_API_BASE = ${JSON.stringify(apiBase)};\n`));

const hash = createHash('sha256');
for (const [name, body] of [...files].sort(([a], [b]) => a.localeCompare(b))) hash.update(name).update(body);
const assetBase = `/assets/${hash.digest('hex').slice(0, 12)}/`;

await rm(OUT, { recursive: true, force: true });
await mkdir(join(OUT, assetBase), { recursive: true });
for (const [name, body] of files) await writeFile(join(OUT, assetBase, name), body);
for (const page of ['index.html', 'callback.html']) {
  const html = await readFile(join('lyrsoft', page), 'utf8');
  await writeFile(join(OUT, page), html.replaceAll('"/app/', `"${assetBase}`));
}
await cp(join(OUT, 'index.html'), join(OUT, '404.html'));

console.log(`Built Lyrsoft into ${OUT}/ (assets at ${assetBase}, API ${apiBase})`);
