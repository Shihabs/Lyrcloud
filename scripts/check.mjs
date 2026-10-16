import { execFileSync } from 'node:child_process';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

execFileSync(process.execPath, ['scripts/build.mjs'], { stdio: 'inherit' });

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

const exists = (path) => stat(path).then(() => true, () => false);
const targetFile = (href) => {
  const path = href.split(/[?#]/)[0];
  if (path.endsWith('/')) return join('dist', path, 'index.html');
  return join('dist', path);
};

const errors = [];
for await (const file of walk('dist')) {
  if (!file.endsWith('.html')) continue;
  const html = await readFile(file, 'utf8');
  if (!/<title>[^<]+<\/title>/.test(html)) errors.push(`${file}: missing <title>`);
  for (const [, href] of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    if (!(await exists(targetFile(href)))) errors.push(`${file}: broken link ${href}`);
  }
}

const home = await readFile('dist/index.html', 'utf8');
for (const required of ['Lyrcloud', 'Start building', 'Pricing']) {
  if (!home.includes(required)) errors.push(`dist/index.html: missing required content "${required}"`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Static content checks passed');
