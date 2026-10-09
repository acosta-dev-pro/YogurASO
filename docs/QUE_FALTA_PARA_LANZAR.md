# Qué falta exactamente para lanzar YogurASO

Última actualización: octubre 2026 (web migrada a Supabase; Express y PostgreSQL local retirados).

---

## 1. Estado

La web es estática y usa **Supabase** para catálogo, cuentas, perfil, panel admin y fotos. Funciona igual en local y en GitHub Pages; ya no depende de `localhost:3000`.

| Función | Dónde |
|---------|--------|
| Catálogo | tabla `products` (lectura pública de los activos) |
| Registro con código de 6 dígitos | `signUp` + `verifyOtp` (`pages/registro.html`) |
| Login | `signInWithPassword` (`pages/login.html`) |
| Google | botón de Google + `signInWithIdToken` |
| Recuperar clave | `resetPasswordForEmail` + código (`pages/recuperar.html`) |
| Perfil y cambiar clave | tabla `profiles` + `reauthenticate` (`pages/perfil.html`) |
| Admin productos y fotos | tabla `products` + bucket `product-images` (solo `is_admin()`) |
| Admin usuarios | `profiles.is_active` (activar / desactivar) |
| Carrito + WhatsApp | navegador (`localStorage`) |

Guía de correos y Google: `docs/GMAIL_Y_GOOGLE.md`. Equivalencias con la API vieja: `docs/migration/NODE_TO_SUPABASE.md`.

---

## 2. Qué sigue faltando para PRODUCCIÓN

1. **WhatsApp real** en `frontend/js/config.js` (hoy es de prueba).
2. **Publicar la app de Google** (en Prueba solo entran los usuarios de prueba).
3. **Admin**: registrarse y volverse admin con el SQL del README.
4. **Bloqueo real de usuarios**: desactivar en el panel impide entrar por la web, pero para bloquear la cuenta en Supabase Auth hace falta una Edge Function con `service_role` (pendiente).
5. **Sitemap** con dominio real.
6. **Prueba de punta a punta** en GitHub Pages: registro, login, Google, recuperar, perfil, admin y fotos.

### Opcional / futuro

- Correo de bienvenida (Edge Function).
- Pedidos guardados en `orders` (hoy la compra es por WhatsApp).
- Plan gratis de Supabase: el proyecto se pausa tras ~1 semana sin uso; se reactiva desde el panel.
