// @ts-check
import { test, expect } from '@playwright/test';

const quitarAvisos = (page) => page.evaluate(() => document.querySelectorAll('.nt-welcome-overlay,.nt-cookie-banner').forEach((o) => o.remove())).catch(() => {});

for (const [nombre, viewport] of [['celular', { width: 390, height: 844 }], ['pantalla grande', { width: 1280, height: 800 }]]) {
  test.describe(nombre, () => {
    test.use({ viewport });

    test('registro: escribir y borrar la contraseña no cambia de casilla', async ({ page }) => {
      await page.goto('/pages/registro.html');
      await quitarAvisos(page);
      const pass = page.locator('#password');
      const confirmar = page.locator('#confirm-password');

      await pass.click();
      await page.keyboard.type('Clave123');
      await expect(pass).toBeFocused();
      await page.keyboard.press('Backspace');
      await page.keyboard.press('Backspace');
      await expect(pass).toHaveValue('Clave1');
      await expect(pass).toBeFocused();

      // pasar a "Confirmar" con un toque: el formulario no se mueve y se puede escribir y borrar
      await confirmar.click();
      await expect(confirmar).toBeFocused();
      await page.keyboard.type('Clave1');
      await page.keyboard.press('Backspace');
      await expect(confirmar).toHaveValue('Clave');
      await expect(pass).toHaveValue('Clave1');

      // Ver / Ocultar no le quita el foco al campo
      await pass.click();
      await page.locator('[aria-controls="password"]').click();
      await expect(pass).toHaveAttribute('type', 'text');
      await expect(pass).toBeFocused();
    });

    test('registro: los errores salen al enviar y se quitan al corregir', async ({ page }) => {
      await page.goto('/pages/registro.html');
      await quitarAvisos(page);
      await page.locator('#password').fill('abc');
      await page.locator('#confirm-password').click();
      await expect(page.locator('#password-error')).toHaveCount(0);
      await page.locator('#registerForm [type="submit"]').click();
      await expect(page.locator('#password-error')).toBeVisible();
      await page.locator('#password').fill('Clave1234');
      await expect(page.locator('#password-error')).toBeHidden();
    });
  });
}
