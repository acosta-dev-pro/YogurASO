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

test.describe('hero con carrusel de botellas', () => {
  test('arranca en fresa y muestra título, nombre, texto y botón', async ({ page }) => {
    await page.goto('/index.html');
    await cerrarPublicidad(page);
    await expect(page.locator('body')).toHaveAttribute('data-flavor', 'fresa');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Yogurt');
    await expect(page.locator('#hero-flavor')).toContainText('Fresa');
    await expect(page.locator('.hero-note')).toContainText('yogurt artesanal del Huila');
    await expect(page.getByRole('link', { name: /Conoce nuestros/i })).toBeVisible();
    await expect(page.locator('.hero-dot')).toHaveCount(0);
  });

  test('la botella central no invade el título', async ({ page }) => {
    await page.goto('/index.html');
    await cerrarPublicidad(page);
    const caja = await page.evaluate(() => {
      const nombre = document.querySelector('.hero-flavor').getBoundingClientRect();
      const botella = document.querySelector('.bottle[data-pos="0"]').getBoundingClientRect();
      return { nombreAbajo: nombre.bottom, botellaArriba: botella.top };
    });
    expect(caja.botellaArriba).toBeGreaterThanOrEqual(caja.nombreAbajo - 2);
  });

  test('al avanzar cambian fondo, nombre y botellas', async ({ page }) => {
    await page.goto('/index.html');
    await cerrarPublicidad(page);
    const hero = page.locator('#hero');
    const antes = await hero.evaluate((el) => getComputedStyle(el).backgroundColor);
    await page.locator('#hero-stage').click();
    await expect(page.locator('body')).toHaveAttribute('data-flavor', 'pina');
    await expect(page.locator('#hero-flavor .hero-word.is-current')).toHaveText('Piña');
    await expect(page.locator('.bottle[data-pos="0"] img')).toHaveAttribute('src', /pina/);
    await expect(page.locator('.bottle[data-pos="-1"] img')).toHaveAttribute('src', /fresa/);
    await expect.poll(() => hero.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(antes);
  });

  test('las botellas se mueven por posición sin cambiar de elemento', async ({ page }) => {
    await page.goto('/index.html');
    await cerrarPublicidad(page);
    const posiciones = () => page.locator('.bottle').evaluateAll((els) => els.map((el) => el.dataset.pos).sort());
    expect(await posiciones()).toEqual(['-1', '-2', '-3', '0', '1', '2', '3']);
    await page.locator('#hero-stage').click();
    expect(await posiciones()).toEqual(['-1', '-2', '-3', '0', '1', '2', '3']);
  });

  test('el teclado recorre los sabores con las flechas', async ({ page }) => {
    await page.goto('/index.html');
    await cerrarPublicidad(page);
    await page.locator('#hero-stage').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('body')).toHaveAttribute('data-flavor', 'pina');
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('body')).toHaveAttribute('data-flavor', 'fresa');
    const ultimo = await page.evaluate(() => {
      const f = window.YogurHero.getFlavors();
      return f[f.length - 1].slug;
    });
    await page.keyboard.press('End');
    await expect(page.locator('body')).toHaveAttribute('data-flavor', ultimo);
  });

  test('el carrito del menú sigue abriendo', async ({ page }) => {
    await page.goto('/index.html');
    await cerrarPublicidad(page);
    await page.locator('#cartBtn').click();
    await expect(page.locator('#cartSidebar')).toHaveClass(/show/);
  });
});

test.describe('secciones rediseñadas', () => {
  test('las tarjetas del proceso muestran número, etiqueta, título y texto', async ({ page }) => {
    await page.goto('/index.html');
    await cerrarPublicidad(page);
    await expect(page.locator('.rc-tarjeta')).toHaveCount(4);
    await expect(page.locator('.rc-tarjeta .rc-num')).toHaveCount(4);
    await expect(page.locator('.rc-tarjeta .rc-tag')).toHaveCount(4);
    await expect(page.locator('.rc-tarjeta .rc-tarjeta-title')).toHaveCount(4);
    await expect(page.locator('.rc-dock-frame')).toBeVisible();
  });

  test('distribuidores muestra los tres caminos y el botón de WhatsApp', async ({ page }) => {
    await page.goto('/index.html');
    await cerrarPublicidad(page);
    await expect(page.locator('.dst__card')).toHaveCount(3);
    await expect(page.locator('.dst__cta')).toHaveAttribute('data-config', 'whatsapp');
  });
});

test.describe('hero con movimiento reducido', () => {
  test.use({ reducedMotion: 'reduce' });
  test('cambia de sabor sin animaciones de desplazamiento', async ({ page }) => {
    await page.goto('/index.html');
    await cerrarPublicidad(page);
    await page.locator('#hero-stage').click();
    await expect(page.locator('body')).toHaveAttribute('data-flavor', 'pina');
    await expect.poll(() => page.evaluate(() =>
      document.getAnimations().filter((a) => a.playState === 'running'
        && (a.effect && a.effect.getKeyframes ? a.effect.getKeyframes() : []).some((k) => k.transform && k.transform !== 'none')).length)
    ).toBe(0);
  });
});
