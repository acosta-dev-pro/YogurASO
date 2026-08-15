#!/usr/bin/env node
/**
 * tools/stamp-version.js — Cache-busting para el despliegue (GitHub Pages).
 *
 * Problema: Pages sirve JS/CSS con caché; tras publicar, celulares (sobre todo iOS Safari) siguen
 * usando archivos viejos mezclados con HTML nuevo y la web se rompe o "no se actualiza".
 *
 * Solución: añade ?v=<versión> a cada referencia local de .js/.css en los HTML y a los imports
 * relativos dentro de los módulos JS. Si el archivo cambia, la URL cambia y el navegador lo
 * descarga de nuevo. Se ejecuta SOLO en el pipeline sobre la carpeta a publicar; el código
 * del repositorio no se modifica.
 *
 * Uso: node tools/stamp-version.js <carpeta> [versión]   (versión por defecto: fecha-hora)
 */
const fs = require('fs');
const path = require('path');

const dir = process.argv[2];
const version = (process.argv[3] || new Date().toISOString().replace(/\D/g, '').slice(0, 14)).slice(0, 12);
if (!dir || !fs.existsSync(dir)) {
    console.error('Uso: node tools/stamp-version.js <carpeta> [versión]');
    process.exit(1);
}

const walk = (d) => fs.readdirSync(d, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));

/** Añade o reemplaza ?v= en una URL local (ignora http(s), data: y rutas sin extensión js/css). */
const stamp = (url) => {
    if (/^(https?:)?\/\//i.test(url) || /^data:/i.test(url)) return url;
    if (!/\.(js|css)(\?|$)/i.test(url)) return url;
    return url.replace(/\?.*$/, '') + '?v=' + version;
};

let htmlCount = 0;
let jsCount = 0;
for (const file of walk(dir)) {
    if (file.endsWith('.html')) {
        const src = fs.readFileSync(file, 'utf8');
        const out = src.replace(/(\s(?:src|href)=)(["'])([^"']+)\2/gi, (m, attr, q, url) => attr + q + stamp(url) + q);
        if (out !== src) { fs.writeFileSync(file, out); htmlCount++; }
    } else if (file.endsWith('.js') && !file.includes(`${path.sep}vendor${path.sep}`)) {
        const src = fs.readFileSync(file, 'utf8');
        const out = src
            // import ... from './x.js'   |   export ... from '../x.js'
            .replace(/(\bfrom\s*)(["'])(\.{1,2}\/[^"']+\.js)(?:\?[^"']*)?\2/g, (m, a, q, url) => a + q + stamp(url) + q)
            // import('./x.js')
            .replace(/(\bimport\(\s*)(["'])(\.{1,2}\/[^"']+\.js)(?:\?[^"']*)?\2/g, (m, a, q, url) => a + q + stamp(url) + q);
        if (out !== src) { fs.writeFileSync(file, out); jsCount++; }
    }
}
console.log(`stamp-version: v=${version} · ${htmlCount} HTML y ${jsCount} módulos JS actualizados`);
