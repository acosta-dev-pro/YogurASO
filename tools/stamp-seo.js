#!/usr/bin/env node
/**
 * tools/stamp-seo.js — Pone el dominio real en el sitio que se publica (sitemap, robots, canonical, Open Graph).
 *
 * Se ejecuta SOLO en el pipeline sobre la carpeta a publicar (ver .github/workflows/pages.yml);
 * el código del repositorio queda sin dominio y sirve igual en local, en GitHub Pages o en uno propio.
 *
 * Uso: node tools/stamp-seo.js <carpeta> <https://dominio.com[/subcarpeta]>
 *
 * Qué hace:
 *  - sitemap.xml: cambia https://yoguraso.example por el dominio.
 *  - robots.txt: deja la línea Sitemap con la dirección completa.
 *  - HTML: añade <link rel="canonical"> y og:url, y vuelve absoluta la og:image.
 *  - Páginas privadas (admin, ingreso, registro, perfil, carrito...): añade noindex.
 */
const fs = require('fs');
const path = require('path');

const dir = process.argv[2];
const site = String(process.argv[3] || '').replace(/\/+$/, '');
if (!dir || !fs.existsSync(dir) || !/^https?:\/\//.test(site)) {
    console.error('Uso: node tools/stamp-seo.js <carpeta> <https://dominio.com>');
    process.exit(1);
}

const PRIVADAS = ['admin', 'login', 'registro', 'recuperar', 'reset-password', 'perfil', 'carrito'];

function edit(file, fn) {
    if (!fs.existsSync(file)) return;
    const antes = fs.readFileSync(file, 'utf8');
    const despues = fn(antes);
    if (despues !== antes) fs.writeFileSync(file, despues);
}

edit(path.join(dir, 'sitemap.xml'), (t) => t.replace(/https:\/\/yoguraso\.example/g, site));
edit(path.join(dir, 'robots.txt'), (t) => t.replace(/^Sitemap:.*$/m, `Sitemap: ${site}/sitemap.xml`));

function pageUrl(rel) {
    return rel === 'index.html' ? `${site}/` : `${site}/${rel.replace(/\\/g, '/')}`;
}

function stamp(rel) {
    edit(path.join(dir, rel), (html) => {
        const nombre = path.basename(rel, '.html');
        let out = html;
        if (PRIVADAS.includes(nombre)) {
            if (!/name="robots"/i.test(out)) out = out.replace('</head>', '    <meta name="robots" content="noindex, nofollow">\n</head>');
            return out;
        }
        const url = pageUrl(rel);
        const tags = [];
        if (!/rel="canonical"/i.test(out)) tags.push(`<link rel="canonical" href="${url}">`);
        if (!/property="og:url"/i.test(out)) tags.push(`<meta property="og:url" content="${url}">`);
        if (tags.length) out = out.replace('</head>', `    ${tags.join('\n    ')}\n</head>`);
        // og:image absoluta (las redes y WhatsApp no cargan rutas relativas)
        out = out.replace(/(<meta property="og:image" content=")([^"]+)(")/, (m, a, src, c) => {
            if (/^https?:\/\//.test(src)) return m;
            const limpio = src.replace(/^(\.\.\/)+/, '').replace(/^\//, '');
            return `${a}${site}/${limpio}${c}`;
        });
        return out;
    });
}

stamp('index.html');
stamp('404.html');
for (const f of fs.readdirSync(path.join(dir, 'pages'))) if (f.endsWith('.html')) stamp(`pages/${f}`);
try {
    const parsed = new URL(site);
    if (!parsed.hostname.endsWith('.github.io')) {
        fs.writeFileSync(path.join(dir, 'CNAME'), parsed.hostname + '\n');
        console.log(`stamp-seo: CNAME generado para ${parsed.hostname}`);
    }
} catch {}

console.log(`stamp-seo: dominio ${site} aplicado en ${dir}`);
