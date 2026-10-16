import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { renderPage } from '../site/layout.mjs';
import { pages } from '../site/pages.mjs';

// Routes ending in "/" become <route>/index.html so CloudFront and the dev server serve clean URLs.
export const outputPath = (route) => join('dist', route.endsWith('/') ? `${route}index.html` : route);

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('src', 'dist/src', { recursive: true });

for (const page of pages) {
  const file = outputPath(page.route);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, renderPage(page));
}

console.log(`Built ${pages.length} pages into dist/`);
