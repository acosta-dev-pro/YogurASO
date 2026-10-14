// @ts-check
import { test, expect } from '@playwright/test';

test('inicio muestra marca y catálogo', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page).toHaveTitle(/YogurASO/i);
  await expect(page.getByRole('link', { name: 'Sabores' }).first()).toBeVisible();
});

async function cerrarPublicidad(page) {
  const aviso = page.getByRole('button', { name: 'Cerrar publicidad' });
  const aparecio = await aviso.waitFor({ state: 'visible', timeout: 2500 }).then(() => true).catch(() => false);
  if (aparecio) await aviso.click();
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
  await expect(page).toHaveURL(/productos\.html/);
});

test('aviso de datos personales', async ({ page }) => {
  await page.goto('/pages/privacidad.html');
  await expect(page.getByRole('heading', { name: /datos personales/i })).toBeVisible();
});
