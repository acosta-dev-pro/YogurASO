// @ts-check
import { test, expect } from '@playwright/test';

async function cerrarPublicidad(page) {
  try {
    const aviso = page.getByRole('button', { name: 'Cerrar anuncio' });
    const aparecio = await aviso.waitFor({ state: 'visible', timeout: 8000 }).then(() => true).catch(() => false);
    if (aparecio) await aviso.click({ timeout: 8000 }).catch(() => {});
  } catch {}
  await page.evaluate(() => document.querySelectorAll('.nt-welcome-overlay').forEach((o) => o.remove())).catch(() => {});
}

test.use({ viewport: { width: 390, height: 844 } });

test('en celular el menú se abre con el botón', async ({ page }) => {
  await page.goto('/index.html');
  await cerrarPublicidad(page);
  const toggle = page.locator('#navToggle');
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(page.locator('#nav-items')).toHaveClass(/is-open/);
  await expect(page.getByRole('link', { name: 'Sabores' }).first()).toBeVisible();
});
