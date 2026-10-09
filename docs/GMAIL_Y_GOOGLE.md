# Correos y Google Sign-In — YogurASO (Supabase)

Desde la migración a Supabase ya no hay backend propio ni `backend/.env`. Todo se configura en el panel de Supabase.

---

## 1. Correos (SMTP de Gmail)

Supabase → **Authentication → Emails → SMTP Settings** → Enable custom SMTP:

| Campo | Valor |
|---|---|
| Host | `smtp.gmail.com` |
| Port | `587` (si falla, `465`) |
| Username / Sender email | `yogurasoweb@gmail.com` |
| Password | contraseña de aplicación de 16 letras (Cuenta de Google → Seguridad → Contraseñas de aplicaciones) |

Plantillas (**Authentication → Emails → Templates**) con el código `{{ .Token }}`:

- **Confirm signup**: código para activar la cuenta (`pages/registro.html`).
- **Reset Password**: código de `pages/recuperar.html`.
- **Reauthentication**: código para cambiar la clave desde `pages/perfil.html`.

Si cambias la clave de la cuenta de Gmail, Google borra las contraseñas de aplicación: crea una nueva y pégala otra vez.

---

## 2. Inicio de sesión con Google

1. Google Cloud → **Google Auth Platform → Clientes** → cliente web `...489l.apps.googleusercontent.com`.
2. **Orígenes de JavaScript autorizados** (sin `/` al final): `http://127.0.0.1:5500`, `http://localhost:5500`, `http://127.0.0.1:5501`, `http://localhost:5501`, `https://acosta-dev-pro.github.io`.
3. **URI de redireccionamiento**: `https://xrgpqdqayevzyjfolcfb.supabase.co/auth/v1/callback`.
4. Supabase → **Authentication → Sign In / Providers → Google**: mismo Client ID + Client Secret.
5. El mismo Client ID va en `frontend/js/config.js` → `GOOGLE_CLIENT_ID`.
6. **Público (Audience)**: mientras diga **Prueba (Testing)**, solo pueden entrar con Google las cuentas agregadas como usuarios de prueba. Para abrirlo a todos: **Publicar app**.

---

## 3. Checklist

- [ ] SMTP de Gmail en Supabase
- [ ] Plantillas con `{{ .Token }}`
- [ ] Orígenes de JavaScript en Google Cloud (incluido el puerto que uses)
- [ ] Google activado en Supabase con Client ID y secreto
- [ ] App de Google publicada (o tu correo como usuario de prueba)
