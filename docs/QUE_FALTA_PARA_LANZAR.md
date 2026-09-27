# Qué falta exactamente para lanzar YogurASO

Documento de diagnóstico + estado de implementación.  
Última actualización: agosto 2026 (tras implementar gaps del MVP).

---

## 1. Respuesta corta (actualizada)

**El MVP ya funciona en local** e incluye ahora:

- Login / registro / JWT  
- **Recuperar contraseña** (API + páginas + email/consola)  
- **Perfil** + **cambiar contraseña** logueado  
- **Admin de usuarios** (activar/desactivar)  
- **Soft-delete** de productos  
- Helmet en el backend  

**Para publicar en internet** aún debes configurar producción (API URL, WhatsApp real, secretos, HTTPS, Postgres en la nube).

---

## 2. Importante: NO es phpMyAdmin

YogurASO usa **PostgreSQL**.

| Incorrecto | Correcto |
|------------|----------|
| phpMyAdmin | **pgAdmin**, DBeaver o `psql` |
| Puerto 3306 | Puerto **5432** |

SQL de verificación y operaciones: `database/ops_lanzamiento.sql`  
Generar hash de password: `node database/generar_hash_password.js "TuClave"`

---

## 3. Qué YA está listo

### Auth

| Función | Dónde |
|---------|--------|
| Login | `POST /api/auth/login` |
| Registro | `POST /api/auth/registro` |
| Perfil | `GET/PUT /api/auth/perfil` + `pages/perfil.html` |
| Olvidé mi contraseña | `POST /api/auth/recuperar` + `pages/recuperar.html` |
| Reset con token | `POST /api/auth/reset-password` + `pages/reset-password.html` |
| Cambiar password logueado | `PUT /api/auth/cambiar-password` |
| Google Sign-In | `POST /api/auth/google` + botón en login/registro |
| Diálogos sesión / logout | `utils.js` (`confirmAction` / `alertAction`) |
| Email reset | `backend/src/services/mailService.js` (SMTP Gmail o consola) |
| Guía Gmail + Google | `docs/GMAIL_Y_GOOGLE.md` |

### Tienda / admin

| Función | Estado |
|---------|--------|
| Catálogo / CRUD productos | Listo |
| Soft-delete productos | Listo (`DELETE` → `activo=false`) |
| Admin usuarios | Listo (`GET/PATCH /api/users`) |
| Carrito + WhatsApp | Listo (placeholders en `config.js`) |
| Helmet | Listo en `server.js` |

### Cómo probar recuperación en local

1. Backend ON (`cd backend && npm run dev`).  
2. Abre `pages/recuperar.html`, envía un email registrado.  
3. En la **consola del backend** aparece el link (si no hay SMTP).  
4. Abre el link → `reset-password.html?token=...` → guarda nueva clave → login.

Variables SMTP en `backend/.env.example`.  
`FRONTEND_URL` debe coincidir con tu Live Server (ej. `http://127.0.0.1:5500`).

---

## 4. Qué sigue faltando para PRODUCCIÓN

### Obligatorio al publicar

1. **`frontend/js/config.js`**
   - `API_URL`, `WHATSAPP_NUMBER`, redes, `SITE_URL`
2. **`backend/.env`**
   - `JWT_SECRET` nuevo  
   - Postgres real  
   - `CORS_ORIGINS=https://tudominio.com`  
   - `PUBLIC_BASE_URL`  
   - `FRONTEND_URL=https://tudominio.com`  
   - SMTP real para correos de recuperación  
3. **Cambiar admin** (`admin@yoguraso.com` / `password`)  
4. **Hosting HTTPS** (frontend + API + Postgres + `uploads` persistente)  
5. **Prueba E2E** en el dominio real  

### Opcional / futuro

- Cookies httpOnly / refresh tokens  
- Pedidos internos en BD (hoy la compra es WhatsApp)  
- Carrito server-side (tablas existen, app usa `localStorage`)  
- Verificación de email al registrarse  
- Sitemap con dominio absoluto  

---

## 5. Checklist

### Local / entrega académica

- [x] Login / registro  
- [x] Recuperar / reset password  
- [x] Perfil / cambiar password  
- [x] Catálogo / admin / usuarios  
- [x] Soft-delete  
- [x] Carrito / WhatsApp (número de prueba)

### Clientes reales en internet

- [ ] Postgres en hosting  
- [ ] `config.js` + `.env` de producción  
- [ ] Admin con contraseña fuerte  
- [ ] WhatsApp real  
- [ ] SMTP real  
- [ ] HTTPS frontend + API  
- [ ] Prueba end-to-end en dominio real  

---

## 6. Resumen

**Antes:** faltaba toda la dinámica de recuperación (solo la tabla).  
**Ahora:** recuperación, perfil, cambio de clave, admin usuarios y soft-delete ya están en el código.  
**Para lanzar al público:** configura producción (secretos, URLs, WhatsApp, SMTP, HTTPS). La BD sigue siendo **PostgreSQL**, no phpMyAdmin.
