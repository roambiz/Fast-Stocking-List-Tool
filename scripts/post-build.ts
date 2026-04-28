/**
 * Build-time site packaging helpers.
 *
 * Generates deployment-side helper files into dist/:
 * - config.json
 * - ai.txt
 * - .htaccess (SPA rewrite + cache + security headers)
 * - robots.txt
 * - sitemap.xml
 *
 * Also injects canonical/og/twitter meta into dist/index.html.
 *
 * Intended to run from Vite closeBundle().
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const distDir = path.join(root, 'dist');

function getVersion(): string {
  const pkgPath = path.join(root, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version?: string };
  return pkg.version ?? '0.0.0';
}

function writeDistFile(name: string, content: string) {
  const out = path.join(distDir, name);
  writeFileSync(out, content, 'utf-8');
}

function generateConfig(siteUrl: string) {
  const version = getVersion();
  const buildTime = new Date().toISOString();
  const config = {
    name: {
      zh: '备货清单工具',
      en: 'Fast Stocking List Tool',
    },
    product: 'Fast Stocking List Tool',
    version,
    buildTime,
    siteUrl,
  };
  writeDistFile('config.json', JSON.stringify(config, null, 2));
}

function generateAiTxt() {
  const buildDate = new Date().toISOString().slice(0, 10);
  const content = `---
updated: ${buildDate}
scope: /
---

# Fast Stocking List Tool | 备货清单工具

用于制作备货清单：维护商品模板与备货清单，支持页组版面摆放，并可导出 PDF / ZIP 存档。

## 功能

- 商品库（款式模板）
- 备货清单（数量填写）
- 页组版面摆放（每组 12 格/页）
- 导出 PDF / 一键存档（PDF + PNG + JSON）

## 请勿滥用

请勿使用自动化脚本高频触发导出 PDF/ZIP；导出与打包会消耗本地计算与带宽资源。`;
  writeDistFile('ai.txt', content);
}

function generateHtaccess() {
  const content = `# Fast Stocking List Tool
# Apache server config (place under site root)

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Long cache for hashed assets
<IfModule mod_headers.c>
  <FilesMatch "\\.(js|css)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-Content-Type-Options "nosniff"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
`;
  writeDistFile('.htaccess', content);
}

function generateRobotsTxt(siteUrl: string) {
  const content = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;
  writeDistFile('robots.txt', content);
}

function generateSitemap(siteUrl: string) {
  const buildDate = new Date().toISOString().slice(0, 10);
  const content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${buildDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
  writeDistFile('sitemap.xml', content);
}

const OG_TITLE = '备货清单工具 | Fast Stocking List Tool';
const OG_DESCRIPTION =
  '备货清单工具：商品库模板、备货清单数量、页组版面摆放，一键导出 PDF 与 ZIP 存档。';

function injectIndexMeta(siteUrl: string) {
  const indexPath = path.join(distDir, 'index.html');
  if (!existsSync(indexPath)) return;

  let html = readFileSync(indexPath, 'utf-8');
  if (html.includes('rel="canonical"')) return;

  const metaBlock = `    <meta name="description" content="${OG_DESCRIPTION}" />
    <link rel="canonical" href="${siteUrl}/" />
    <meta property="og:title" content="${OG_TITLE}" />
    <meta property="og:description" content="${OG_DESCRIPTION}" />
    <meta property="og:url" content="${siteUrl}/" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${OG_TITLE}" />
`;

  html = html.replace('</head>', `${metaBlock}  </head>`);
  writeFileSync(indexPath, html, 'utf-8');
}

export interface PostBuildOptions {
  siteUrl?: string;
}

export function runPostBuild(options?: PostBuildOptions) {
  if (!existsSync(distDir)) return;
  const siteUrl = options?.siteUrl ?? process.env.SITE_URL ?? 'https://fast-stocking-list.roambiz.com';

  generateConfig(siteUrl);
  generateAiTxt();
  generateHtaccess();
  generateRobotsTxt(siteUrl);
  generateSitemap(siteUrl);
  injectIndexMeta(siteUrl);
}

