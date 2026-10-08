const { chromium } = require('playwright');
const path = require('path');

const BASE = 'http://127.0.0.1:5500';
const OUT = path.join(__dirname, 'evidencias');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@yoguraso.com';
const ADMIN_PASS = process.env.ADMIN_PASS || '';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1365, height: 768 } });

  const waitImages = () => page.waitForFunction(
    () => [...document.images].filter((i) => i.offsetParent).every((i) => i.complete && i.naturalWidth > 0),
    null, { timeout: 15000 }
  ).catch(() => console.log('aviso: alguna imagen no cargó'));

  await page.goto(`${BASE}/pages/productos.html`, { waitUntil: 'load' });
  await page.waitForSelector('button.btn-add');
  await waitImages();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(OUT, '09_catalogo_con_productos.png') });
  console.log('catálogo ok');

  const addButtons = page.locator('button.btn-add');
  const n = await addButtons.count();
  for (let i = 0; i < Math.min(n, 3); i++) {
    await addButtons.nth(i).dispatchEvent('click');
    await page.waitForSelector('#inspectAdd', { state: 'visible' });
    await page.waitForTimeout(400);
    await page.click('#inspectAdd');
    await page.waitForTimeout(600);
  }
  await page.goto(`${BASE}/pages/carrito.html`, { waitUntil: 'load' });
  await waitImages();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT, '10_carrito_con_productos.png') });
  console.log('carrito ok, productos agregados:', Math.min(n, 3));

  if (!ADMIN_PASS) {
    console.log('sin ADMIN_PASS: se omite la captura del panel admin');
    await browser.close();
    return;
  }
  await page.goto(`${BASE}/pages/login.html`, { waitUntil: 'load' });
  await page.fill('#email', ADMIN_EMAIL);
  await page.fill('#password', ADMIN_PASS);
  await Promise.all([
    page.waitForURL(/admin/, { timeout: 10000 }).catch(() => null),
    page.click('#loginForm button[type="submit"]'),
  ]);
  await waitImages();
  await page.waitForTimeout(2000);
  console.log('admin url:', page.url());
  if (/admin/.test(page.url())) await page.screenshot({ path: path.join(OUT, '11_panel_admin_productos.png') });

  await browser.close();
})().catch((e) => { console.error('ERROR', e.message); process.exit(1); });
