// @ts-check
import { test, expect } from '@playwright/test';

test('inicio muestra marca y catálogo', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page).toHaveTitle(/YogurASO/i);
  await expect(page.getByRole('link', { name: 'Sabores' }).first()).toBeVisible();
});

async function cerrarPublicidad(page) {
  const aviso = page.getByRole('button', { name: 'Cerrar anuncio' });
  const aparecio = await aviso.waitFor({ state: 'visible', timeout: 8000 }).then(() => true).catch(() => false);
  if (aparecio) await aviso.click();
  await page.evaluate(() => document.querySelectorAll('.nt-welcome-overlay').forEach((o) => o.remove())).catch(() => {});
}

test('sabores del inicio baja a la sección de yogures', async ({ page }) => {
  await page.goto('/index.html');
  await cerrarPublicidad(page);
  await page.getByRole('link', { name: 'Sabores' }).first().click();
  await expect(page).toHaveURL(/#productos/);
  await expect(page.locator('#productos')).toBeVisible();
});

test('catálogo abre desde el menú', async ({ page }) => {
  await page.goto('/index.html');
  await cerrarPublicidad(page);
  await page.getByRole('link', { name: 'Catálogo' }).click();
  // El servidor de pruebas quita el «.html» de la dirección, así que se acepta con y sin él.
  await expect(page).toHaveURL(/productos(\.html)?$/);
});

test('aviso de datos personales', async ({ page }) => {
  await page.goto('/pages/privacidad.html');
  await expect(page.getByRole('heading', { name: /datos personales/i })).toBeVisible();
});

test('el pedido por WhatsApp arma el mensaje con el carrito', async ({ page }) => {
  // No se guarda ningún pedido de prueba en la base: se bloquea la llamada y el mensaje sale con los datos del carrito.
  await page.route('**/rest/v1/rpc/**', (r) => r.abort());
  await page.addInitScript(() => {
    sessionStorage.setItem('yog_modal_seen', '1');
    localStorage.setItem('usuario', JSON.stringify({ id: 'u1', nombre: 'Ana', apellido: 'Pérez', email: 'ana@correo.com' }));
    localStorage.setItem('yogur_cart', JSON.stringify([
      { id: '1::500', nombre: 'Fresa · 500 ml', tamano: '500 ml', precio: 6900, cantidad: 2, imagen: 'assets/products/yoguraso-fresa-500ml-sm.webp', stock: 50 }
    ]));
    window.__urls = [];
    window.open = (u) => {
      if (u) window.__urls.push(u);
      return { closed: false, document: { title: '', body: { style: {} } }, location: { replace: (x) => window.__urls.push(x) } };
    };
  });
  await page.goto('/index.html');
  await page.locator('#cartBtn').click();
  await expect(page.locator('.cart-chip')).toHaveCount(1);
  await page.locator('#checkoutBtn').click();
  await expect.poll(() => page.evaluate(() => window.__urls.length), { timeout: 15000 }).toBeGreaterThan(0);
  const url = await page.evaluate(() => window.__urls[window.__urls.length - 1]);
  const texto = decodeURIComponent(url.split('text=')[1]);
  expect(url).toContain('https://wa.me/573103279958');
  expect(texto).toContain('Fresa · 500 ml');
  expect(texto).toContain('2 × $6.900 = $13.800');
  expect(texto).toContain('Total: $13.800');
});

test('el carrito suma, pide confirmar al quitar y vacía', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('yog_modal_seen', '1');
    localStorage.setItem('yogur_cart', JSON.stringify([
      { id: '1::500', nombre: 'Fresa · 500 ml', tamano: '500 ml', precio: 6900, cantidad: 1, imagen: 'assets/products/yoguraso-fresa-500ml-sm.webp', stock: 50 },
      { id: '2::500', nombre: 'Piña · 500 ml', tamano: '500 ml', precio: 6900, cantidad: 1, imagen: 'assets/products/yoguraso-pina-500ml-sm.webp', stock: 50 }
    ]));
  });
  await page.goto('/index.html');
  await page.evaluate(() => document.querySelectorAll('.nt-welcome-overlay').forEach((o) => o.remove()));
  await page.locator('#cartBtn').click();
  await page.locator('[data-action="qty"][data-delta="1"]').first().click();
  await expect(page.locator('.cart-item-qty').first()).toHaveText('2');
  await expect(page.locator('#cartTotalAmount')).toHaveText('$20.700');
  await page.locator('[data-action="remove"]').first().click();
  await page.locator('.cfx-confirm-ok').click();
  await expect(page.locator('.cart-chip')).toHaveCount(1);
  await page.locator('#btn-clear-cart-sidebar').click();
  await page.locator('.cfx-confirm-ok').click();
  await expect(page.locator('.cart-chip')).toHaveCount(0);
  await expect(page.locator('#cart-count')).toHaveText('0');
});
