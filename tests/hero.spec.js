// @ts-check
import { test, expect } from '@playwright/test';

test.describe('hero con selector de sabores', () => {
  test('arranca en fresa y muestra título, botón y 8 sabores', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('body')).toHaveAttribute('data-flavor', 'fresa');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Yogurt');
    await expect(page.getByRole('link', { name: /Conoce nuestros/i })).toBeVisible();
    await expect(page.getByRole('radio')).toHaveCount(8);
  });

  test('al elegir un sabor cambian fondo, botella y botella de atrás', async ({ page }) => {
    await page.goto('/index.html');
    const hero = page.locator('#hero');
    const antes = await hero.evaluate((el) => getComputedStyle(el).backgroundColor);
    await page.getByRole('radio', { name: 'Mora' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-flavor', 'mora');
    await expect(page.locator('.bottle--main img').first()).toHaveAttribute('src', /mora/);
    await expect(page.locator('.bottle--second img').first()).toHaveAttribute('src', /melocoton/);
    await expect.poll(() => hero.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(antes);
  });

  test('el teclado recorre los sabores con las flechas', async ({ page }) => {
    await page.goto('/index.html');
    await page.getByRole('radio', { name: 'Fresa' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('body')).toHaveAttribute('data-flavor', 'pina');
    await page.keyboard.press('End');
    await expect(page.locator('body')).toHaveAttribute('data-flavor', 'mango');
  });

  test('el carrito del menú sigue abriendo', async ({ page }) => {
    await page.goto('/index.html');
    await page.locator('#cartBtn').click();
    await expect(page.locator('#cartSidebar')).toHaveClass(/show/);
  });
});

test.describe('hero con movimiento reducido', () => {
  test.use({ reducedMotion: 'reduce' });
  test('cambia de sabor sin animaciones de desplazamiento', async ({ page }) => {
    await page.goto('/index.html');
    await page.getByRole('radio', { name: 'Piña' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-flavor', 'pina');
    await expect.poll(() => page.evaluate(() =>
      document.getAnimations().filter((a) => a.playState === 'running'
        && (a.effect && a.effect.getKeyframes ? a.effect.getKeyframes() : []).some((k) => k.transform && k.transform !== 'none')).length)
    ).toBe(0);
  });
});
