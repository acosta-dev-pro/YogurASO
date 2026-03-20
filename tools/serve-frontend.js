/**
 * tools/serve-frontend.js — Servidor local para ver la web (npm start, puerto 5500).
 * Sirve la carpeta frontend/ tal cual; no tiene lógica de negocio.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5500;
const PUBLIC_DIR = path.join(__dirname, '../frontend');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

// Direcciones que la gente escribe al buscar el catálogo, y el prefijo /frontend/
// (cuando el servidor se abre desde la carpeta del proyecto, no desde frontend/).
const ALIASES = {
    '/catalogo': '/pages/productos.html',
    '/catalogo.html': '/pages/productos.html',
    '/pages/catalogo': '/pages/productos.html',
    '/pages/catalogo.html': '/pages/productos.html',
    '/pages/productos': '/pages/productos.html'
};

function publicPath(reqUrl) {
    let urlPath = decodeURIComponent(reqUrl.split('?')[0]);
    if (urlPath.length > 1 && urlPath.endsWith('/')) urlPath = urlPath.slice(0, -1);
    if (urlPath === '/frontend' || urlPath.startsWith('/frontend/')) {
        urlPath = urlPath.slice('/frontend'.length) || '/';
    }
    if (ALIASES[urlPath]) urlPath = ALIASES[urlPath];
    if (urlPath === '/') urlPath = '/index.html';
    return urlPath;
}

const server = http.createServer((req, res) => {
    const reqUrl = publicPath(req.url);

    let filePath = path.join(PUBLIC_DIR, reqUrl);

    // Prevent path traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        return res.end('403 Forbidden');
    }

    const send = (target, stats) => {
        const ext = path.extname(target).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        const totalSize = (stats && stats.size) || fs.statSync(target).size;
        const range = req.headers.range;

        // Soporte de HTTP Range (206 Partial Content) obligatorio para Safari en iOS / macOS
        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

            if (start >= totalSize || end >= totalSize) {
                res.writeHead(416, {
                    'Content-Range': `bytes */${totalSize}`,
                    'Access-Control-Allow-Origin': '*'
                });
                return res.end();
            }

            const chunksize = (end - start) + 1;
            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${totalSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*'
            });

            const stream = fs.createReadStream(target, { start, end });
            stream.on('error', () => {
                if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Server Error');
            });
            stream.pipe(res);
        } else {
            res.writeHead(200, {
                'Content-Type': contentType,
                'Content-Length': totalSize,
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Access-Control-Allow-Origin': '*'
            });
            const stream = fs.createReadStream(target);
            stream.on('error', () => {
                if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Server Error');
            });
            stream.pipe(res);
        }
    };

    const missing = () => {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    };

    fs.stat(filePath, (err, stats) => {
        if (!err && stats.isFile()) return send(filePath, stats);
        if (!err && stats.isDirectory()) {
            const indexFile = path.join(filePath, 'index.html');
            return fs.stat(indexFile, (errDir, statsDir) => {
                if (!errDir && statsDir.isFile()) return send(indexFile, statsDir);
                return missing();
            });
        }
        if (!path.extname(filePath)) {
            const withHtml = `${filePath}.html`;
            return fs.stat(withHtml, (errHtml, statsHtml) => {
                if (!errHtml && statsHtml.isFile()) return send(withHtml, statsHtml);
                return missing();
            });
        }
        return missing();
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Frontend YogurASO corriendo en http://127.0.0.1:${PORT}`);
});
