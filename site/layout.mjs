import { products } from './products.mjs';

export const escape = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

const navLink = (href, label, active) =>
  `<a href="${href}"${active === href ? ' aria-current="page"' : ''}>${label}</a>`;

function header(active) {
  const productLinks = products
    .map(
      (product) => `
          <a class="mega-item" href="/products/${product.slug}/">
            <span class="mega-icon" aria-hidden="true">${product.icon}</span>
            <span><b>${product.name}</b><small>${escape(product.tagline)}</small></span>
          </a>`,
    )
    .join('');

  return `
    <header class="site-header">
      <a class="brand" href="/" aria-label="Lyrcloud home">
        <span class="brand-mark" aria-hidden="true">✦</span>
        <span>Lyrcloud</span>
      </a>
      <nav aria-label="Main navigation">
        <div class="nav-dropdown">
          <a href="/products/"${active.startsWith('/products/') ? ' aria-current="page"' : ''}>Products <span aria-hidden="true">▾</span></a>
          <div class="mega-menu">
            <div class="mega-grid">${productLinks}
            </div>
            <a class="mega-footer" href="/products/">View all products →</a>
          </div>
        </div>
        ${navLink('/solutions/', 'Solutions', active)}
        ${navLink('/developers/', 'Developers', active)}
        ${navLink('/network/', 'Network', active)}
        ${navLink('/pricing/', 'Pricing', active)}
      </nav>
      <div class="header-actions">
        <a class="link-button" href="/login/" id="login-link">Log in</a>
        <a class="button ghost" href="/contact/">Contact sales</a>
        <a class="button primary" href="/sign-up/">Start building</a>
      </div>
      <button class="menu-button" type="button" aria-label="Open menu" aria-expanded="false">☰</button>
    </header>`;
}

function footer() {
  const column = (title, links) => `
        <div>
          <h4>${title}</h4>
          ${links.map(([href, label]) => `<a href="${href}">${label}</a>`).join('\n          ')}
        </div>`;

  return `
    <footer class="footer">
      <div class="footer-brand">
        <div class="brand"><span class="brand-mark" aria-hidden="true">✦</span><span>Lyrcloud</span></div>
        <p>Build, secure, and scale every digital experience on one global cloud.</p>
      </div>
      <div class="footer-columns">
        ${column('Products', products.map((product) => [`/products/${product.slug}/`, product.name]))}
        ${column('Developers', [
          ['/developers/', 'Developer hub'],
          ['/developers/#quickstart', 'Quickstart'],
          ['/developers/#cli', 'CLI reference'],
          ['/dash/', 'Dashboard'],
        ])}
        ${column('Company', [
          ['/about/', 'About'],
          ['/network/', 'Network'],
          ['/pricing/', 'Pricing'],
          ['/contact/', 'Contact sales'],
        ])}
      </div>
      <p class="footer-legal">© ${new Date().getFullYear()} Lyrcloud. Built for secure, high-performance cloud experiences.</p>
    </footer>`;
}

export function renderPage({ route, title, description, body, bodyClass = '', chrome = true, styles = [], scripts = [] }) {
  const fullTitle = route === '/' ? title : `${title} | Lyrcloud`;
  const styleTags = ['/src/styles.css', ...styles].map((href) => `<link rel="stylesheet" href="${href}" />`).join('\n    ');
  const scriptTags = (chrome ? ['/src/main.js', ...scripts] : scripts)
    .map((src) => `<script type="module" src="${src}"></script>`)
    .join('\n    ');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escape(description)}" />
    <title>${escape(fullTitle)}</title>
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E✦%3C/text%3E%3C/svg%3E" />
    ${styleTags}
  </head>
  <body${bodyClass ? ` class="${bodyClass}"` : ''}>${chrome ? header(route) : ''}
    ${body}${chrome ? footer() : ''}
    ${scriptTags}
  </body>
</html>
`;
}
