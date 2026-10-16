import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

// SITE=lyrsoft serves the Lyrsoft Work app (scripts/build-lyrsoft.mjs) instead of the Lyrcloud site.
const lyrsoft = process.env.SITE === 'lyrsoft';
const root = join(process.cwd(), lyrsoft ? 'dist-lyrsoft' : 'dist');
const buildScript = lyrsoft ? 'scripts/build-lyrsoft.mjs' : 'scripts/build.mjs';
const port = Number(process.env.PORT || (lyrsoft ? 5174 : 5173));
const types = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
]);

// Rebuild on every page request so edits to site/ and src/ show up on refresh.
const build = () => execFileSync(process.execPath, [buildScript], { stdio: 'ignore' });
build();

// Mirrors the CloudFront viewer-request rewrite in infra/aws/static-site.yml.
const resolve = (pathname) => {
  if (pathname.endsWith('/')) return `${pathname}index.html`;
  return extname(pathname) ? pathname : `${pathname}/index.html`;
};

createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host}`);
  const normalizedPath = normalize(resolve(decodeURIComponent(url.pathname))).replace(/^([/\\])+/, '');
  if (normalizedPath.startsWith('..')) {
    response.writeHead(400).end();
    return;
  }
  const filePath = join(root, normalizedPath);
  if (filePath.endsWith('.html')) {
    try { build(); } catch (error) { console.error(error.message); }
  }
  try {
    const body = await readFile(filePath);
    response.writeHead(200, { 'content-type': types.get(extname(filePath)) || 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    response.end(await readFile(join(root, '404.html')).catch(() => 'Not found'));
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`${lyrsoft ? 'Lyrsoft' : 'Lyrcloud'} dev server running at http://localhost:${port}`);
});
