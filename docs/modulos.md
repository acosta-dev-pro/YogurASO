# Módulos del sistema YogurASO

## 1. Frontend (HTML, CSS y JavaScript)

El frontend es la parte visible de la aplicación: lo que el usuario ve e interactúa en el navegador. En YogurASO se implementa con HTML5, CSS3 y JavaScript vanilla (sin React ni frameworks). Todo el código de esta capa se encuentra dentro de la carpeta `frontend/` y se comunica con el backend mediante peticiones HTTP.

### Módulos del frontend:

- **Páginas e interfaz**  
  Son las vistas del sitio: cada archivo HTML corresponde a una pantalla con la que el usuario navega, compra o administra. La navegación entre pantallas se hace con enlaces HTML normales.  
  La página de inicio está en `frontend/index.html`. El catálogo vive en `frontend/pages/productos.html`, el carrito en `frontend/pages/carrito.html`, el login en `frontend/pages/login.html`, el registro en `frontend/pages/registro.html` y el panel de administración en `frontend/pages/admin.html`. También existe `frontend/404.html` para páginas no encontradas.  
  Los estilos visuales del sitio están centralizados en `frontend/css/styles.css`, y las imágenes de productos y marca se guardan en `frontend/assets/img/`.

- **Gestión de estado**  
  En YogurASO no se usan librerías como Redux ni Context API. El estado se maneja con JavaScript y el almacenamiento del navegador (`localStorage`), para que la aplicación recuerde al usuario y sus productos aunque recargue la página.  
  La lógica del carrito (agregar, quitar y calcular totales) está en `frontend/js/cart.js`, y su representación en pantalla se controla desde `frontend/js/cart_view.js`.  
  La sesión del usuario autenticado, el login, el registro y el guardado del token JWT se gestionan en `frontend/js/auth.js`.  
  El estado y las acciones del panel administrador están en `frontend/js/admin.js`.  
  La lógica general de la página de inicio se encuentra en `frontend/js/main.js`, y las funciones auxiliares compartidas entre varios módulos están en `frontend/js/utils.js`.

- **Conexión con el backend**  
  Se realiza con la API `fetch` del navegador. Todas las llamadas al servidor (productos, autenticación y subida de imágenes) pasan por el cliente HTTP ubicado en `frontend/js/api.js`.  
  La URL del API, el número de WhatsApp, las redes sociales y el nombre de la marca se configuran en un solo archivo: `frontend/js/config.js`. De este modo, el frontend y el backend pueden correr por separado y solo hace falta cambiar esa configuración al publicar el sitio.

---

## 2. Backend (Node.js + Express)

El backend es la capa del servidor: recibe peticiones del frontend, aplica reglas de negocio, consulta la base de datos y responde con JSON. En YogurASO se construye con Node.js y Express, y se organiza por capas para mantener el código ordenado y fácil de mantener.  
El punto de entrada del servidor es `backend/server.js`. Ahí se montan CORS, el parseo de JSON, el rate limit, la subida de imágenes con Multer y las rutas principales `/api/auth` y `/api/products`. Las imágenes subidas por el administrador se almacenan en la carpeta `backend/uploads/`.

### Módulos del backend:

- **Rutas (routes)**  
  Definen las entradas del sistema, es decir, las URLs que el cliente puede llamar. Cada ruta indica el método HTTP (GET, POST, PUT, DELETE), qué middlewares aplicar y a qué controlador enviar la solicitud.  
  Las rutas de autenticación están en `backend/src/routes/authRoutes.js` y exponen: `POST /api/auth/login`, `POST /api/auth/registro` y `GET /api/auth/perfil`.  
  Las rutas de productos están en `backend/src/routes/productRoutes.js` y exponen: listar y crear en `/api/products`, y obtener, actualizar o eliminar un producto en `/api/products/:id`.  
  Ambas se registran desde `backend/server.js`, que es quien las conecta a la aplicación Express.

- **Controladores (controllers)**  
  Procesan las solicitudes entrantes, ejecutan la lógica de negocio y devuelven respuestas al cliente. El controlador no define la URL: solo decide qué hacer cuando llega una petición.  
  El archivo `backend/src/controllers/authController.js` se encarga del login, el registro y la consulta del perfil, usando JWT y bcrypt para autenticar de forma segura.  
  El archivo `backend/src/controllers/productController.js` se encarga de listar, crear, actualizar y eliminar productos del catálogo.

- **Middlewares**  
  Son funciones intermedias que se ejecutan antes del controlador. Se usan para validación, autenticación, autorización y protección del servidor.  
  En `backend/src/middleware/verifyToken.js` están las funciones `verificarToken` (exige un JWT válido), `verificarAdmin` (exige rol de administrador) y `optionalAuth` (lee el token si viene, sin obligarlo).  
  En `backend/src/middleware/rateLimit.js` se limita la cantidad de peticiones que un cliente puede hacer en un tiempo determinado, para evitar abusos.

- **Modelos / datos**  
  Representan las estructuras de datos en la base de datos y cómo interactuar con ellas. En este proyecto no hay una carpeta `models` ni un ORM como Sequelize: los controladores consultan PostgreSQL directamente con SQL mediante el cliente `pg`.  
  La definición de tablas (usuarios, productos y demás relaciones) está en `database/schema.sql`. Ese archivo es la referencia de cómo están organizados los datos que el backend lee y escribe.

- **Conexión con la base de datos**  
  Es la configuración y el manejo de consultas hacia PostgreSQL.  
  El pool de conexiones se crea en `backend/src/config/db.js` usando la librería `pg`. Las credenciales no van escritas en el código: se leen desde `backend/.env` (variables como `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` y `DB_PORT`).  
  Como plantilla para configurar el entorno existe `backend/.env.example`, que indica qué variables hacen falta sin exponer secretos reales. Todas las consultas del backend pasan por esta conexión de forma centralizada.
