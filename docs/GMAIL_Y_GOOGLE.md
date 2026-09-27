# Gmail + Google Sign-In — YogurASO

Para que la recuperación de contraseña llegue a Gmail y el botón **Continuar con Google** funcione, configura estos dos bloques.

---

## 1. Base de datos (si ya tenías la BD creada)

En pgAdmin → Query Tool sobre `yoguraso_db`, ejecuta:

`database/migration_google_auth.sql`

(Instalaciones nuevas con `schema.sql` ya incluyen `google_id` y `auth_provider`.)

---

## 2. Correo real con Gmail (SMTP)

1. Entra a tu cuenta Google → **Seguridad**.
2. Activa **Verificación en 2 pasos**.
3. Busca **Contraseñas de aplicaciones** → crea una para “Correo” / “Otro (YogurASO)”.
4. Copia la clave de 16 caracteres.
5. En `backend/.env` deja algo así:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
MAIL_FROM=YogurASO <tu_correo@gmail.com>
FRONTEND_URL=http://127.0.0.1:5500
```

6. Reinicia el backend (`npm run dev` o `node src/server.js`).
7. Prueba en `pages/recuperar.html`: el enlace debe llegar al inbox (o Spam).

Sin SMTP, el link solo aparece en la **consola del backend** (modo desarrollo).

---

## 3. Inicio de sesión con Google

### A) Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea o elige un proyecto.
3. **APIs y servicios** → **Pantalla de consentimiento OAuth** (tipo Externo; agrega tu email de prueba).
4. **Credenciales** → **Crear credenciales** → **ID de cliente de OAuth**.
5. Tipo: **Aplicación web**.
6. Orígenes JavaScript autorizados (ajusta al puerto que uses):
   - `http://127.0.0.1:5500`
   - `http://localhost:5500`
7. Copia el **ID de cliente** (termina en `.apps.googleusercontent.com`).

### B) Pegar el mismo ID en dos sitios

`frontend/js/config.js`:

```js
GOOGLE_CLIENT_ID: 'TU_CLIENT_ID.apps.googleusercontent.com'
```

`backend/.env`:

```env
GOOGLE_CLIENT_ID=TU_CLIENT_ID.apps.googleusercontent.com
```

Reinicia el backend. Recarga login/registro: debe aparecer el botón oficial de Google.

---

## 4. Diálogos de seguridad (ya incluidos)

| Acción | Comportamiento |
|--------|----------------|
| Login / Google | Pregunta **Sí, continuar** / **Cancelar** antes de guardar la sesión |
| Cerrar sesión | Pregunta **Sí, cerrar sesión** / **No, quedarme** |
| Registro, recuperar, reset, perfil, cambiar clave | Confirmación o alerta según el caso |

---

## 5. Checklist rápido

- [ ] Migración SQL ejecutada (BD existente)
- [ ] SMTP Gmail con contraseña de aplicación
- [ ] `GOOGLE_CLIENT_ID` igual en frontend y backend
- [ ] Orígenes `http://127.0.0.1:5500` (o tu Live Server) en Google Cloud
- [ ] Backend reiniciado
