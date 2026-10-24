const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');

const FRONTEND_DIR = path.resolve(__dirname, '../frontend');
const SHOTS_DIR = path.resolve(__dirname, '../docs/taller-pruebas/evidencias-actuales');

if (!fs.existsSync(SHOTS_DIR)) {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
}

function startServer(port = 8089) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = decodeURIComponent((req.url || '/').split('?')[0]);
      if (reqPath === '/') reqPath = '/index.html';
      const filePath = path.join(FRONTEND_DIR, reqPath.replace(/^\//, ''));
      if (!filePath.startsWith(FRONTEND_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        '.woff2': 'font/woff2',
        '.json': 'application/json'
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function removeAllModals(page) {
  // Click close buttons if any
  try {
    const closeBtns = page.locator('button[data-act="close-welcome"], .nt-welcome-close, button[aria-label*="Cerrar"], .nt-cookie-x');
    const count = await closeBtns.count();
    for (let i = 0; i < count; i++) {
      try { await closeBtns.nth(i).click({ timeout: 500, force: true }); } catch(e) {}
    }
  } catch(e) {}

  await page.evaluate(() => {
    // 1. Eliminar físicamente del DOM cualquier overlay, modal, banner, popup o cookie notice
    const toRemove = document.querySelectorAll(
      '.nt-welcome-overlay, .nt-welcome-window, .nt-top-banner, .nt-cookie, .nt-stack, .nt-toast, #cookie-banner, #notice-modal, .modal-backdrop, [role="dialog"], .modal, .promo-banner'
    );
    toRemove.forEach(el => el.remove());

    // 2. Desactivar cualquier filtro de desenfoque o backdrop
    document.querySelectorAll('*').forEach(el => {
      const s = window.getComputedStyle(el);
      if (s.filter && s.filter !== 'none') el.style.filter = 'none';
      if (s.backdropFilter && s.backdropFilter !== 'none') el.style.backdropFilter = 'none';
    });

    document.body.style.overflow = 'visible';
    document.documentElement.style.overflow = 'visible';
  });
  await page.waitForTimeout(400);
}

async function captureAll() {
  const PORT = 8089;
  const server = await startServer(PORT);
  console.log(`Servidor local activo en http://127.0.0.1:${PORT}`);

  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  const contextDesktop = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1.5
  });

  const page = await contextDesktop.newPage();

  // 1. Home Hero
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await removeAllModals(page);
  await page.screenshot({ path: path.join(SHOTS_DIR, '01_actual_home_hero.png') });
  console.log('Captura 1 lista (hero totalmente limpio sin popup)');

  // 2. Home Sabores
  const saboresSec = page.locator('#productos').first();
  if (await saboresSec.isVisible({ timeout: 2000 })) {
    await saboresSec.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await removeAllModals(page);
    await page.screenshot({ path: path.join(SHOTS_DIR, '02_actual_home_sabores.png') });
    console.log('Captura 2 lista (sabores limpio sin popup)');
  }

  // 3. Catálogo
  await page.goto(`http://127.0.0.1:${PORT}/pages/productos.html`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(800);
  await removeAllModals(page);
  await page.screenshot({ path: path.join(SHOTS_DIR, '03_actual_catalogo.png') });
  console.log('Captura 3 lista (catálogo limpio sin popup)');

  // 4. Carrito
  await page.goto(`http://127.0.0.1:${PORT}/pages/carrito.html`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(800);
  await removeAllModals(page);
  await page.screenshot({ path: path.join(SHOTS_DIR, '04_actual_carrito.html.png') });
  console.log('Captura 4 lista (carrito limpio sin popup)');

  // 5. Mobile Hero
  const contextMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    deviceScaleFactor: 2
  });
  const pageMobile = await contextMobile.newPage();
  await pageMobile.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle', timeout: 30000 });
  await pageMobile.waitForTimeout(1000);
  await removeAllModals(pageMobile);
  await pageMobile.screenshot({ path: path.join(SHOTS_DIR, '06_actual_mobile_hero.png') });
  console.log('Captura 6 lista (mobile limpio sin popup)');

  await browser.close();
  server.close();
  console.log('¡Todas las capturas listas e impecables!');
}

captureAll().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
