// @ts-check
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('en celular el menú se abre con el botón', async ({ page }) => {
  await page.goto('/index.html');
  const toggle = page.locator('#navToggle');
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(page.locator('#nav-items')).toHaveClass(/is-open/);
  await expect(page.getByRole('link', { name: 'Productos' }).first()).toBeVisible();
});
