# Informe de auditoría de YoguraSo

Fecha: 4 de octubre de 2026. Rama `redesign/yoguraso-v2`. Respaldo: `C:\Users\acost\Desktop\YOGURASO-BACKUP-2026-10-04.zip` (398 archivos, sin `node_modules`, `.git`, `playwright-report` ni `test-results`).

Este informe responde las 13 preguntas de la sección 46 del plan maestro. El detalle de cada archivo está en `YOGURASO_PROJECT_MAP_V2.md`.

## Resumen ejecutivo

- La web funciona en local: catálogo, carrito con pedido por WhatsApp, cuentas, perfil, recuperación de clave y panel admin.
- El sitio publicado en GitHub Pages no puede funcionar completo: llama a `localhost:3000`.
- El rediseño exige componentes con estado (hero, selector de sabores, panel admin); por eso se propone React + TypeScript.
- Todo el backend de Node se puede reemplazar por Supabase. Solo hace falta una Edge Function.
- Se eliminaron 26 archivos sin uso (16 MB de imágenes, la carpeta `backup/` y los scripts de una máquina virtual).
- No hay secretos reales en Git. Sí hay una clave de administrador de desarrollo conocida y una contraseña de máquina virtual en el historial.

## Las 13 preguntas

### 1. ¿Qué se mantiene?

- Lógica del carrito y mensaje de WhatsApp (`cart.js`): funciona y el plan pide conservarla.
- Reglas de negocio de producto (precio y stock no negativos, color hexadecimal, tipos de letrero, descuento máximo 80 %): pasan a `CHECK` en la base de datos.
- Aviso de privacidad, `robots.txt`, flujo de GitHub Pages.
- Pruebas de Playwright y su configuración.
- `INICIAR-YOGURASO.bat`, hasta que Supabase reemplace la API.
- `backend/` y `database/`, como referencia y respaldo funcional hasta pasar la paridad.
- `docs/taller-pruebas/` (tareas del SENA), sin tocar.

### 2. ¿Qué se migra?

- Cuentas, sesión, perfil y recuperación de clave: a Supabase Auth.
- Productos: de `productos` a `products`.
- Imágenes subidas: de `backend/uploads` a Supabase Storage.
- Panel admin: mismas funciones, ahora con RLS.
- `config.js`: a variables de entorno y datos del sitio.
- `utils.js`, `cart.js`, `cart_view.js`, `auth.js`, `admin.js`: se reescriben como módulos TypeScript.

### 3. ¿Qué se reemplaza?

- Los 7 archivos CSS (150 KB) por tokens + Tailwind.
- `index.html` (hero) por `ProductShowcase`.
- Menú, tarjetas, catálogo y fichas por componentes del sistema de diseño.
- `api.js` por un cliente de Supabase.
- Express, JWT propio, bcrypt, Multer, Nodemailer y `pg`, cuando haya paridad.
- Logo escrito con fuente por el logo SVG.

### 4. ¿Qué se elimina?

Ya eliminado en esta rama (con `git rm`, en commits separados; ver `ELIMINADOS.md`):

| Categoría | Archivos | Motivo |
|-----------|----------|--------|
| `backup/` | 2 | Copia vieja de la portada y de los estilos. Ningún archivo la referencia; además `.gitignore` ya la excluía |
| Máquina virtual Ubuntu | `ABRIR-YOGURASO-AA5.bat` y 13 archivos de `scripts/` | Ni `package.json`, ni el README, ni las pruebas, ni el workflow, ni el backend los usan. Guardan una contraseña de la máquina virtual en texto plano |
| Imágenes sin uso | 10 en `frontend/assets/img/` | 0 coincidencias del nombre en HTML, CSS, JS, SQL, pruebas y documentos |

Para eliminar más adelante: Express y su carpeta `backend/`, `database/generar_hash_password.js`, `database/ops_lanzamiento.sql`, las 3 migraciones sueltas de `database/` ya incluidas en `schema.sql`, y el código muerto de la sección 6.

### 5. ¿Qué archivos están duplicados?

| Archivos | Evidencia | Acción |
|----------|-----------|--------|
| `frontend/assets/img/Fresa.png` y `fresa sin fondo.png` | Mismo MD5 y mismo tamaño (978.616 bytes) | Los dos se usan (uno en `og:image`, otro en el hero). Se quedan hasta rediseñar el hero |
| `docs/modulos.md` y `docs/modulos.html` | Mismo texto; el HTML es la versión para imprimir | Se mantienen (material del taller) |
| `database/migration_*.sql` y `schema.sql` | Las tres migraciones ya están dentro de `schema.sql` | Se mantienen como historia hasta retirar `database/` |
| `/profile` y `/change-password` frente a `/perfil` y `/cambiar-password` | Rutas gemelas en `authRoutes.js` | Se retiran con Express |

### 6. ¿Qué archivos están muertos?

Sin referencias en ninguna parte del repositorio:

- 10 imágenes (eliminadas).
- `backup/index.html`, `backup/styles.css.bak` (eliminados).
- Scripts de la máquina virtual (eliminados).

Código muerto dentro de archivos que sí se usan (no se tocó):

- `api.js`: `checkHealth`, `getProduct`.
- `styles.css`: 4 `@font-face` hacia una carpeta `font/` que no existe.
- Tablas `carrito`, `carrito_items`, `pedidos`, `detalles_pedido`: ningún controlador las usa.
- `backend/scripts/verify-db.js`: script manual.

Fuera del alcance de la web: `docs/estdent-factura/` es la factura de otro proyecto (EstDent). Se propone moverla, no se borró.

### 7. ¿Qué riesgos existen?

| Riesgo | Nivel |
|--------|-------|
| El sitio publicado depende de una API que solo existe en tu PC | Crítico |
| Clave de administrador de desarrollo conocida (está en el README) | Crítico |
| Cuentas actuales no se pueden pasar con su clave | Alto |
| JWT en `localStorage` | Alto |
| Imágenes de producto: hasta 3,5 MB cada una y sin recortar los envases nuevos | Alto |
| Cambiar "YogurASO" a "YoguraSo" toca HTML, correos, mensaje de WhatsApp y SEO | Medio |
| Textos como "sin aditivos ni conservantes" o "alto en proteína" no están verificados | Medio |
| Precios de 1 L y 2 L calculados con un factor en el código | Medio |
| `schema.sql` empieza con `DROP TABLE`: ejecutarlo dos veces borra datos | Medio |
| Dependencia de un servicio externo (Supabase) | Bajo |

### 8. ¿Qué dependencias nuevas son necesarias?

| Paquete | Para qué | Cuándo |
|---------|----------|--------|
| `vite`, `react`, `react-dom`, `typescript` | Frontend nuevo | Fase 3 |
| `react-router-dom` | Rutas | Fase 3 |
| `tailwindcss` | Estilos | Fase 3 |
| `@supabase/supabase-js` | Cliente de Supabase (versión fija) | Fase 6 |
| `framer-motion` | Movimiento de interfaz | Fase 4 |
| `zod` | Validación de formularios | Fase 6 |
| `supabase` (CLI, desarrollo) | Migraciones y funciones | Fase 6 |
| `three`, `@react-three/fiber`, `@react-three/drei` | Solo si se aprueba el 3D | Después del hero 2D |
| `gsap` | Solo si una animación de scroll lo exige | Probablemente nunca |

No se instaló nada en esta fase.

### 9. ¿Qué dependencias actuales pueden eliminarse?

Todo el `backend/package.json` una vez pasada la paridad: `express`, `cors`, `helmet`, `dotenv`, `pg`, `jsonwebtoken`, `bcrypt`, `google-auth-library`, `multer`, `nodemailer`, `nodemon`. Quedan `@playwright/test` y `@types/node`.

### 10. ¿Qué parte del backend pasa directo a Supabase?

- Registro, login, Google, perfil, cambio de clave y recuperación: Auth.
- Lectura y CRUD de productos, incluido el borrado lógico y el definitivo: tablas con RLS.
- Listado de usuarios y cambio de rol visible: tabla `profiles` con RLS.
- Subida de imágenes: Storage.
- Límite de intentos: lo da Auth.

### 11. ¿Qué parte necesita Edge Functions?

- Desactivar a un usuario de verdad (bloquear el inicio de sesión): necesita la clave `service_role`. Función `admin-set-user-active`.
- Correo de bienvenida, solo si se quiere conservar.

Nada más.

### 12. ¿Qué partes del frontend necesitan React/TypeScript?

El proyecto actual no usa ninguno de los dos. Se justifican en:

- **Hero `ProductShowcase`**: estado compartido entre producto principal, secundario, fondo, texto y acentos; teclado, toque y transiciones.
- **Panel admin**: tabla con filtros, orden, selección múltiple, modal, subida de imagen y usuarios (36 KB de JavaScript con estado en variables sueltas).
- **Catálogo y ficha de producto**: hoy se arman con texto HTML en `main.js`.
- **Carrito y cajón lateral**: estado compartido entre todas las páginas.
- **Datos de Supabase**: los tipos generados evitan errores de nombres de columnas.

Se pueden dejar como HTML estático: aviso de privacidad y 404.

### 13. ¿Qué cambios son obligatorios para implementar el hero de referencia?

1. Logo SVG (el archivo recibido es PNG con fondo crema).
2. PNG transparentes de los envases, con la misma geometría. Los 9 recibidos son JPEG con el cuadro de transparencia pintado o fondo negro.
3. Fredoka y Nunito Sans.
4. Datos de sabor: color de fondo, acento, imagen y texto.
5. Componente con estado y transición coordinada, y selector sin flechas.
6. Respeto de `prefers-reduced-motion`.
7. Hero móvil propio.

## Lista de archivos y carpetas propuestos para eliminar o archivar, con evidencia

Método de búsqueda: se buscó el nombre del archivo (sin distinguir mayúsculas) dentro de todos los archivos de texto versionados fuera de `docs/taller-pruebas` (HTML, CSS, JS, JSON, SQL, Markdown, YAML, `.bat`, `.ps1`, `.sh`), y aparte dentro de los 60 archivos de texto de `docs/taller-pruebas`. Las imágenes también se buscaron por la ruta `assets/img/`.

### Ya eliminados

| Archivo | Evidencia | Motivo |
|---------|-----------|--------|
| `backup/index.html` | Ninguna referencia a la ruta `backup/` salvo `.gitignore` | Copia vieja de la portada |
| `backup/styles.css.bak` | 0 referencias | Copia vieja de estilos |
| `ABRIR-YOGURASO-AA5.bat` | Solo lo nombra su propio grupo | Abría la máquina virtual |
| `scripts/aa5-one.txt`, `aa5-step1.txt`, `aa5-step2.txt`, `aa5-step3.txt` | 0 referencias | Comandos sueltos de la máquina virtual (uno guarda una contraseña) |
| `scripts/abrir-yoguraso-firefox.sh` | 0 referencias | Abre Firefox en Ubuntu |
| `scripts/arreglar-firefox-ubuntu.ps1` | 0 referencias | Arreglo de Firefox en la máquina virtual |
| `scripts/deploy-standalone.sh`, `deploy-ubuntu-raro.sh`, `ubuntu-aa5-deploy.sh` | 0 referencias fuera de `scripts/` | Despliegue en Ubuntu (contienen contraseña) |
| `scripts/deploy-ubuntu-aa5.ps1`, `iniciar-todo-aa5.ps1`, `iniciar-ubuntu-vm.ps1`, `ubuntu-auto-docker-raro.ps1` | Solo el `.bat` eliminado los llamaba | Orquestan la máquina virtual |
| `frontend/assets/img/BG.png` | 0 referencias | Imagen vieja, 1,6 MB |
| `frontend/assets/img/Cafe.png` | 0 referencias | Envase viejo, 1,6 MB |
| `frontend/assets/img/Frutos Rojos.png` | 0 referencias | Envase viejo, 1,5 MB |
| `frontend/assets/img/Guanabana.png` | 0 referencias | Envase viejo, 1,4 MB |
| `frontend/assets/img/Mango.png` | 0 referencias | Envase viejo, 1,3 MB |
| `frontend/assets/img/Melocoton.png` | Solo aparece como nombre en una URL externa (`i.ibb.co/.../Melocoton.png`) en `schema.sql`, que no usa el archivo local | Envase viejo, 1,3 MB |
| `frontend/assets/img/Mora.png` | Igual que el anterior | Envase viejo, 1,4 MB |
| `frontend/assets/img/Piña.png` | Igual (URL externa `Pi-a.png`) | Envase viejo, 1,4 MB |
| `frontend/assets/img/Yogurt Griego.png` | 0 referencias | Envase viejo, 1,3 MB |
| `frontend/assets/img/tazon.png` | 0 referencias | Imagen vieja, 3,5 MB |

Las 10 imágenes suman 16.406.663 bytes (15,6 MB).

### Propuestos para después (necesitan editar código en uso o una decisión tuya)

| Qué | Evidencia | Motivo |
|-----|-----------|--------|
| `frontend/assets/img/fresa sin fondo.png` o `Fresa.png` | Mismo MD5; cada una la usa una línea de `index.html` | Duplicado. Se resuelve al rediseñar el hero |
| `frontend/css/styles.css` líneas 38 a 41 | La carpeta `font/` no existe | `@font-face` rotos |
| `frontend/js/api.js`: `checkHealth`, `getProduct` | 0 usos en `auth.js`, `admin.js`, `main.js` | Código muerto |
| `database/migration_*.sql` (3) | Ya están dentro de `schema.sql` | Historia; archivar |
| `docs/estdent-factura/` | Otro proyecto | Mover fuera del repositorio |
| `backend/uploads/img_1778207684287_590444.webp` | `.gitignore` ignora `uploads/` pero el archivo está en Git | Subirla a Storage y quitarla de Git |
| `backend/` y `database/` completos | Se sustituyen por Supabase | Fase 8, después de la paridad |

## Secretos

Revisión de lo versionado (todas las ramas del historial) y del árbol de trabajo:

| Hallazgo | Dónde | Gravedad |
|----------|-------|----------|
| `backend/.env` existe en tu PC con valores reales (base de datos, JWT, correo, Google). **No está en Git** ni apareció nunca en el historial; `.gitignore` lo cubre | Solo local | Sin acción. Ojo: está dentro del zip de respaldo, no lo compartas |
| Hash bcrypt de un administrador de desarrollo (`admin@yoguraso.com`) y su clave en texto claro en el README | `database/schema.sql`, `README.md` | Media-alta si esa base de datos llega a un servidor. No se copió a `seed.sql` |
| Contraseña de la máquina virtual en texto claro | Scripts de `scripts/` (ya eliminados de esta rama) | Baja, pero sigue en el historial de Git. Si esa contraseña se usa en otro lado, cámbiala |
| Client ID de Google OAuth | `frontend/js/config.js` | No es secreto (es público por diseño). El *client secret* no está en el repositorio |
| Número de WhatsApp `573001234567` | `config.js` | Número de prueba |
| Claves de Supabase | — | No existen todavía en el proyecto. `.env.example` solo trae marcadores |

No se encontraron claves de API, tokens ni archivos `.pem` o `.key` versionados. Los valores no se copian en este informe.

## Qué sigue

1. Que aprobaras esta auditoría (ya autorizaste los borrados; falta la fase 3).
2. Crear el proyecto de Supabase (lo haces tú con tu cuenta).
3. Entregar el logo en SVG y los PNG recortados.
4. Fase 3: tokens, tipografía y componentes base.
