# Lyrcloud

The Lyrcloud website (`www.lyrcloud.com`): a Cloudflare-style multi-page marketing site plus a preview dashboard at `/dash/`. No dependencies — just Node.js.

## Commands

```bash
npm run dev
npm run check
npm run build
npm run create:s3
npm run deploy:aws
```

- `npm run dev` starts a local server on port `5173` that rebuilds on every page load.
- `npm run check` builds the site, then fails on missing titles or broken internal links.
- `npm run build` renders every page into `dist/`.
- `npm run create:s3` creates the private S3 bucket stack for static site assets.
- `npm run deploy:aws` builds the site, creates/updates the AWS stack, syncs `dist/` to S3, and invalidates CloudFront.

## Project layout

| Path | What it is |
|---|---|
| `site/layout.mjs` | Shared header (with the Products mega-menu), footer, and HTML shell |
| `site/products.mjs` | Product catalog — each entry becomes `/products/<slug>/` and a nav item |
| `site/pages.mjs` | Every page and its route (`/pricing/` → `dist/pricing/index.html`) |
| `src/styles.css` | Site styles |
| `src/dash.js`, `src/dash.css` | Dashboard single-page app (hash routes such as `/dash/#/zones/example.com/dns`) |
| `src/auth.js` | Cognito Hosted UI sign-in (Google, GitHub) with PKCE; `/callback.html` completes it |

To add a page, add an entry to the `pages` array in `site/pages.mjs`. To add a product, add it to `site/products.mjs`.

## Sign-in and dashboard

Sign-in is real: `/login/` and `/sign-up/` send visitors to the Cognito Hosted UI (`lyrcloud-users` pool), which offers Google and GitHub. Cognito only accepts `/callback.html` as the redirect and `/index.html` as the logout page (on `https://www.lyrcloud.com` and `http://localhost:5173`), so keep those paths. Profile data in Settings comes from the account API (`GET /me`).

The dashboard itself is not backed by a server yet:

- **Real:** adding a site scans its existing DNS records over public DNS-over-HTTPS (dns.google), and “Check nameservers” looks up the domain’s live NS records. The Edge Functions preview runs code in an isolated Web Worker in the browser.
- **Preview only:** websites, DNS records, functions, and settings are stored in the visitor’s browser (localStorage). Analytics and security events are generated sample data and labeled as such.

## Theme

Light by default; dark when the visitor’s OS prefers dark. Colors are tokens on `:root` in `src/styles.css`.

## AWS hosting

The AWS deployment is defined in [infra/aws/static-site.yml](infra/aws/static-site.yml). It creates:

- a bucket policy for the private S3 bucket created by [infra/aws/s3-bucket.yml](infra/aws/s3-bucket.yml)
- a Lambda@Edge viewer-request function for clean URL rewrites
- an ACM certificate for `lyrcloud.com` and `www.lyrcloud.com`
- a CloudFront distribution with the S3 bucket as a private origin
- `A`/`AAAA` Route53 alias records for the apex and `www`

Run it from a machine or CI runner with AWS CLI credentials:

```bash
AWS_REGION=us-east-1 npm run create:s3
AWS_REGION=us-east-1 npm run deploy:aws
```

The first run creates a Route53 public hosted zone from [infra/aws/route53-zone.yml](infra/aws/route53-zone.yml), prints the name servers, and stops. Add those name servers at the registrar for `lyrcloud.com`, then run:

```bash
CONFIRM_DELEGATED=1 AWS_REGION=us-east-1 npm run deploy:aws
```

Optional overrides:

```bash
STACK_NAME=lyrcloud-static-site \
DOMAIN_NAME=lyrcloud.com \
SITE_BUCKET_NAME=lyrcloud.com \
HOSTED_ZONE_ID=Z1234567890 \
AWS_REGION=us-east-1 \
npm run deploy:aws
```

CloudFront requires the ACM certificate and Lambda@Edge function to live in `us-east-1`, so keep `AWS_REGION=us-east-1` unless you also change the architecture.
