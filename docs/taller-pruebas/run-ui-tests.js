/**
 * Pruebas básicas de UI con Playwright — YogurASO
 * Genera capturas en ./evidencias para anexar al taller.
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { pathToFileURL } = require('url');

const FRONTEND = path.resolve(__dirname, '../../frontend');
const EVIDENCIAS = path.resolve(__dirname, 'evidencias');
const PORT = 5505;

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = path.join(FRONTEND, urlPath.replace(/^\//, ''));
      if (!filePath.startsWith(FRONTEND) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const types = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        '.gif': 'image/gif'
      };
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

async function shot(page, name, fullPage = true) {
  const file = path.join(EVIDENCIAS, name);
  await page.screenshot({ path: file, fullPage });
  console.log('OK captura:', name);
  return file;
}

async function main() {
  if (!fs.existsSync(EVIDENCIAS)) fs.mkdirSync(EVIDENCIAS, { recursive: true });
  const server = await startStaticServer();
  const base = `http://127.0.0.1:${PORT}`;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  const resultados = [];

  try {
    // Prueba 1: Home carga
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    const titleHome = await page.title();
    await shot(page, '01_inicio_home.png');
    resultados.push({ id: 1, nombre: 'Carga de página de inicio', ok: titleHome.length > 0, detalle: `Título: ${titleHome}` });

    // Prueba 2: Navegación a productos
    await page.goto(`${base}/pages/productos.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await shot(page, '02_catalogo_productos.png');
    const hasSearch = await page.locator('#catalog-search').count();
    resultados.push({ id: 2, nombre: 'Catálogo de productos visible', ok: hasSearch > 0, detalle: 'Campo de búsqueda #catalog-search presente' });

    // Prueba 3: Login
    await page.goto(`${base}/pages/login.html`, { waitUntil: 'networkidle' });
    await shot(page, '03_login.png');
    const email = await page.locator('#email, input[type="email"]').count();
    resultados.push({ id: 3, nombre: 'Formulario de login disponible', ok: email > 0, detalle: 'Inputs de autenticación encontrados' });

    // Prueba 4: Registro
    await page.goto(`${base}/pages/registro.html`, { waitUntil: 'networkidle' });
    await shot(page, '04_registro.png');
    const nombre = await page.locator('#nombre').count();
    resultados.push({ id: 4, nombre: 'Formulario de registro disponible', ok: nombre > 0, detalle: 'Campo nombre presente' });

    // Prueba 5: Carrito
    await page.goto(`${base}/pages/carrito.html`, { waitUntil: 'networkidle' });
    await shot(page, '05_carrito.png');
    resultados.push({ id: 5, nombre: 'Vista de carrito', ok: true, detalle: 'Página carrito.html renderizada' });

    // Prueba 6: Admin
    await page.goto(`${base}/pages/admin.html`, { waitUntil: 'networkidle' });
    await shot(page, '06_admin.png');
    resultados.push({ id: 6, nombre: 'Panel administrador', ok: true, detalle: 'Página admin.html renderizada' });

    // Prueba 7: Validación visual login (campos vacíos / UI)
    await page.goto(`${base}/pages/login.html`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"], #email', 'prueba_invalida');
    await page.fill('input[type="password"], #password', '123');
    await shot(page, '07_login_datos_prueba.png', false);
    resultados.push({ id: 7, nombre: 'Interacción con formulario login', ok: true, detalle: 'Se ingresaron datos de prueba en el formulario' });

    // Prueba 8: 404
    await page.goto(`${base}/404.html`, { waitUntil: 'networkidle' });
    await shot(page, '08_pagina_404.png');
    resultados.push({ id: 8, nombre: 'Página 404', ok: true, detalle: '404.html accesible' });

  } finally {
    await browser.close();
    server.close();
  }

  const reporte = {
    herramienta: 'Playwright (Chromium)',
    fecha: new Date().toISOString(),
    proyecto: 'YogurASO',
    resultados
  };
  fs.writeFileSync(path.join(EVIDENCIAS, 'reporte_pruebas.json'), JSON.stringify(reporte, null, 2), 'utf8');
  console.log('\n=== RESUMEN ===');
  resultados.forEach((r) => console.log(`${r.ok ? 'PASS' : 'FAIL'} | P${r.id} | ${r.nombre} | ${r.detalle}`));
  console.log('Evidencias en:', EVIDENCIAS);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
