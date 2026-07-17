# YogurASO

Tienda web de yogurt artesanal. Catálogo, carrito local, autenticación JWT, panel administrador y checkout por WhatsApp.

## Tecnologías

- Frontend: HTML5, CSS3, JavaScript (Vanilla)
- Backend: Node.js + Express
- Base de datos: PostgreSQL
- Auth: JWT + bcrypt
- Imágenes: Multer

## Estructura

```
YOGURASO-WEB/
├── frontend/           # Sitio estático
│   ├── index.html
│   ├── 404.html
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── pages/          # productos, carrito, login, registro, admin
│   ├── js/             # config, utils, cart, auth, admin, api
│   ├── css/
│   └── assets/
├── backend/            # API Express
│   ├── server.js
│   ├── .env.example
│   └── src/
└── database/
    └── schema.sql
```

## Instalación

### 1. Base de datos

Crea la base en PostgreSQL y ejecuta el schema:

```bash
psql -U postgres -c "CREATE DATABASE yoguraso_db;"
psql -U postgres -d yoguraso_db -f database/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edita .env con tus credenciales
npm install
npm run dev
```

La API queda en `http://localhost:3000`.

### 3. Frontend

Abre la carpeta `frontend/` con Live Server (o cualquier servidor estático).

> El frontend y el backend corren por separado.

## Variables de entorno (`backend/.env`)

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto del API (default 3000) |
| `DB_USER` | Usuario PostgreSQL |
| `DB_PASSWORD` | Contraseña PostgreSQL |
| `DB_NAME` | Nombre de la base |
| `DB_HOST` | Host (localhost) |
| `DB_PORT` | Puerto DB (5432) |
| `JWT_SECRET` | Secreto para firmar tokens |
| `PUBLIC_BASE_URL` | URL pública para imágenes (opcional) |
| `CORS_ORIGINS` | Orígenes permitidos (opcional) |

## Configuración del frontend

Edita solo `frontend/js/config.js`:

- `WHATSAPP_NUMBER`
- `COMPANY_NAME`
- `COMPANY_EMAIL`
- `INSTAGRAM` / `FACEBOOK`
- `API_URL`

## Usuario administrador

- Email: `admin@yoguraso.com`
- Contraseña temporal: `password`

Cámbiala antes de cualquier entorno real.

## Flujo de compra

1. Explorar catálogo  
2. Agregar al carrito  
3. Ajustar cantidades  
4. **Comprar por WhatsApp**  
5. Continuar la venta por chat  

No hay pasarela de pagos ni pedidos internos.

## Scripts

```bash
# Backend
cd backend
npm run dev    # desarrollo con nodemon
npm start      # producción
```

## Capturas

Agrega aquí capturas del home, catálogo, carrito y panel admin cuando las tengas listas.

## Licencia

Proyecto educativo / portafolio. Uso libre con atribución a YogurASO.
