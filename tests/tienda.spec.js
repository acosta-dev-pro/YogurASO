// @ts-check
import { test, expect } from '@playwright/test';

test('inicio muestra marca y catálogo', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page).toHaveTitle(/YogurASO/i);
  await expect(page.getByRole('link', { name: 'Productos' }).first()).toBeVisible();
});

test('catálogo abre desde el menú', async ({ page }) => {
  await page.goto('/index.html');
  await page.getByRole('link', { name: 'Productos' }).first().click();
  await expect(page).toHaveURL(/productos\.html/);
});

test('aviso de datos personales', async ({ page }) => {
  await page.goto('/pages/privacidad.html');
  await expect(page.getByRole('heading', { name: /datos personales/i })).toBeVisible();
});
