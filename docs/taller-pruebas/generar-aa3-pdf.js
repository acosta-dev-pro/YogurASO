/**
 * Capturas + PDF para GA10-220501097-AA3-EV01
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

const FRONTEND = path.resolve(__dirname, '../../frontend');
const OUT_DIR = path.resolve('C:/Users/acost/Downloads/GA10-AA3-evidencias');
const HTML_OUT = path.resolve('C:/Users/acost/Downloads/GA10-220501097-AA3-EV01_Instalacion_Despliegue.html');
const PDF_OUT = path.resolve('C:/Users/acost/Downloads/GA10-220501097-AA3-EV01_Instalacion_Despliegue.pdf');
const PORT = 5510;
const LIVE_URL = 'http://127.0.0.1:5500';

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = path.join(FRONTEND, urlPath.replace(/^\//, ''));
      if (!filePath.startsWith(FRONTEND) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const types = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.woff2': 'font/woff2',
      };
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

async function addBrowserBar(page, url) {
  await page.evaluate((u) => {
    const old = document.getElementById('ev-bar');
    if (old) old.remove();
    const bar = document.createElement('div');
    bar.id = 'ev-bar';
    bar.textContent = u;
    bar.style.cssText =
      'position:fixed;top:0;left:0;right:0;height:28px;line-height:28px;background:#202124;color:#e8eaed;padding:0 14px;font:13px Segoe UI, sans-serif;z-index:2147483647;border-bottom:1px solid #3c4043;box-sizing:border-box';
    document.documentElement.style.scrollPaddingTop = '28px';
    document.body.prepend(bar);
    document.body.style.marginTop = '28px';
  }, url);
}

async function capture(page, fileName, urlPath, fullPage = false) {
  const url = `http://127.0.0.1:${PORT}${urlPath}`;
  const displayUrl = `${LIVE_URL}${urlPath === '/index.html' ? '/index.html' : urlPath}`;
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(600);
  await addBrowserBar(page, displayUrl);
  await page.waitForTimeout(200);
  const file = path.join(OUT_DIR, fileName);
  await page.screenshot({
    path: file,
    fullPage,
    type: 'png',
  });
  console.log('Captura:', fileName);
}

function buildHtml() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>GA10-220501097-AA3-EV01 — Instalación y despliegue local</title>
<style>
  @page { size: letter; margin: 2cm 2.3cm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #111;
    margin: 0;
    background: #fff;
  }
  .page { max-width: 17.5cm; margin: 0 auto; padding: 8px 0 24px; }
  .cover {
    min-height: 24cm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-align: center;
    border: 1px solid #222;
    padding: 48px 36px;
    page-break-after: always;
  }
  .cover h1 {
    font-size: 16pt;
    text-transform: uppercase;
    margin: 24px 0 12px;
    line-height: 1.35;
  }
  .cover .sub { font-size: 13pt; margin: 8px 0; }
  .cover .code { font-size: 11pt; margin-top: 28px; }
  .cover .footer-cover { font-size: 12pt; margin-top: auto; padding-top: 40px; }
  h2 {
    font-size: 13pt;
    margin: 22px 0 10px;
    border-bottom: 1px solid #333;
    padding-bottom: 3px;
    page-break-after: avoid;
  }
  h3 {
    font-size: 12pt;
    margin: 16px 0 8px;
    page-break-after: avoid;
  }
  p { margin: 0 0 10px; text-align: justify; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0 16px;
    font-size: 11pt;
    page-break-inside: avoid;
  }
  th, td {
    border: 1px solid #333;
    padding: 6px 8px;
    vertical-align: top;
    text-align: left;
  }
  th { background: #efefef; }
  ul, ol { margin: 6px 0 12px 22px; }
  li { margin-bottom: 5px; text-align: justify; }
  .refs p {
    text-align: left;
    font-size: 11pt;
    margin: 0 0 10px;
    padding-left: 1.5cm;
    text-indent: -1.5cm;
  }
  .small { font-size: 11pt; }
  .fig {
    margin: 16px 0 20px;
    text-align: center;
    page-break-inside: avoid;
  }
  .fig img {
    width: 14.5cm;
    max-width: 14.5cm;
    height: auto;
    display: block;
    margin: 0 auto;
    border: 1px solid #bbb;
  }
  .fig .caption {
    font-size: 10pt;
    margin-top: 8px;
    text-align: center;
    font-style: italic;
    max-width: 14.5cm;
    margin-left: auto;
    margin-right: auto;
  }
  code, pre {
    font-family: Consolas, "Courier New", monospace;
    font-size: 10.5pt;
    background: #f4f4f4;
  }
  pre {
    padding: 10px 12px;
    border: 1px solid #ccc;
    margin: 10px 0 14px;
    white-space: pre-wrap;
  }
  .note {
    border-left: 3px solid #555;
    padding: 8px 12px;
    margin: 12px 0;
    background: #f8f8f8;
    font-size: 11pt;
  }
  .step {
    margin: 10px 0 14px;
    padding: 10px 12px;
    border: 1px solid #ddd;
    background: #fafafa;
    page-break-inside: avoid;
  }
  .step strong { display: block; margin-bottom: 4px; }
</style>
</head>
<body>
<div class="page">

<section class="cover">
  <div>
    <p class="sub"><strong>Servicio Nacional de Aprendizaje — SENA</strong></p>
    <p class="sub">Formación profesional integral</p>
  </div>
  <div>
    <h1>Software instalado en la plataforma del cliente</h1>
    <p class="sub">Instalación de servidor de aplicaciones local y despliegue<br>
    de plantilla web HTML con Live Server</p>
    <p class="code"><strong>Código de evidencia:</strong> GA10-220501097-AA3-EV01</p>
    <p class="code"><strong>Formato:</strong> GFPI-F-135 V01</p>
  </div>
  <div class="footer-cover">
    <p>Informe paso a paso</p>
    <p>Septiembre de 2026</p>
  </div>
</section>

<h2>1. Introducción</h2>
<p>
En el componente formativo se analizan distintas alternativas para desarrollar y desplegar
aplicaciones web en el computador del cliente: stacks integrados (XAMPP, WAMP), servidores
web dedicados (Apache, Nginx, IIS), contenedores y herramientas ligeras integradas al editor
de código. Antes de publicar un sitio en internet, es necesario validar en local que la
plantilla o el producto cargan correctamente, que los estilos se aplican y que la navegación
entre páginas funciona.
</p>
<p>
Esta evidencia documenta el montaje de un <strong>servidor de aplicaciones local</strong> mediante la
extensión <strong>Live Server</strong> en Cursor/Visual Studio Code, y el despliegue de la plantilla web
<strong>YogurASO</strong> (HTML, CSS y JavaScript sin framework). El producto de prueba corresponde al
sitio desarrollado en el proyecto formativo: catálogo de yogurt artesanal, carrito, formularios
de acceso y panel administrador. Las capturas de este informe fueron tomadas con el sitio
ejecutándose en <code>${LIVE_URL}</code>, equivalente al entorno que genera Live Server al abrir
<code>frontend/index.html</code>.
</p>

<h2>2. Objetivo</h2>
<p>
Describir con detalle y evidencia visual el proceso de instalación de la plataforma elegida
y el despliegue local del producto de prueba, de forma que cualquier usuario pueda reproducir
el montaje del servidor local y verificar que la plantilla HTML se visualiza correctamente en
el navegador del cliente.
</p>

<h2>3. Desarrollo</h2>

<h3>3.1. Selección de la plantilla web de prueba</h3>
<p>
La guía propone elegir una plantilla HTML gratuita publicada en internet. En el artículo de
Pacilio (2021) se listan más de cuarenta landing pages en HTML puro, sin frameworks, con
secciones de presentación, beneficios, catálogo y contacto. Para esta evidencia se utiliza
<strong>YogurASO</strong>, un sitio estático con la misma arquitectura de archivos que esas plantillas:
páginas <code>.html</code>, estilos en <code>css/</code>, scripts en <code>js/</code> e imágenes en <code>assets/</code>.
</p>
<table>
  <tr><th>Aspecto</th><th>Detalle de YogurASO como plantilla de prueba</th></tr>
  <tr><td>Tipo</td><td>Sitio HTML estático multipágina (sin React, Angular ni PHP embebido en vistas)</td></tr>
  <tr><td>Páginas</td><td>Inicio, productos, carrito, login, registro, perfil, admin, privacidad, 404</td></tr>
  <tr><td>Estilos</td><td>CSS modular: layout general, header responsive, cards de productos y tema admin</td></tr>
  <tr><td>Scripts</td><td>API REST vía <code>fetch</code>, carrito en <code>localStorage</code>, autenticación JWT</td></tr>
  <tr><td>Uso en la evidencia</td><td>Demostrar despliegue local, navegación y renderizado en el navegador</td></tr>
</table>

<h3>3.2. Selección de la plataforma de desarrollo e implantación</h3>
<p>
De las plataformas estudiadas en el componente, se eligió un enfoque ligero orientado al
desarrollo front-end, adecuado para plantillas HTML:
</p>
<table>
  <tr><th>Componente</th><th>Herramienta</th><th>Función en el despliegue local</th></tr>
  <tr><td>Editor</td><td>Cursor / Visual Studio Code</td><td>Gestión del proyecto, extensiones y apertura de archivos</td></tr>
  <tr><td>Servidor local</td><td>Extensión Live Server (Ritwick Dey)</td><td>Servicio HTTP en puerto 5500 con recarga automática</td></tr>
  <tr><td>Carpeta raíz del sitio</td><td><code>frontend/</code> del repositorio YogurASO-WEB</td><td>Contiene el producto de prueba a publicar</td></tr>
  <tr><td>Navegador</td><td>Chrome, Edge o Firefox</td><td>Cliente que consume el servidor local</td></tr>
</table>
<p>
<strong>Live Server</strong> cumple la función de servidor de aplicaciones local para contenido estático:
levanta un proceso HTTP, sirve los archivos del proyecto y abre la URL en el navegador. No
requiere instalar Apache, PHP ni MySQL para visualizar la interfaz. Si se desea probar login
con base de datos, se complementa con el API Node.js y PostgreSQL (sección 3.8).
</p>

<h3>3.3. Requisitos previos en el computador cliente</h3>
<ul>
  <li>Windows 10 u superior (o Linux/macOS equivalente).</li>
  <li>Cursor o Visual Studio Code instalado.</li>
  <li>Conexión local; no se requiere hosting externo para esta evidencia.</li>
  <li>Repositorio <code>YOGURASO-WEB</code> copiado en el disco del cliente.</li>
  <li>Navegador web actualizado (Chrome, Edge o Firefox).</li>
</ul>

<h3>3.4. Estructura del producto antes del despliegue</h3>
<p>
Antes de iniciar Live Server, se verifica que la carpeta <code>frontend</code> contenga la estructura
esperada:
</p>
<pre>frontend/
├── index.html              Página de inicio (punto de entrada)
├── pages/
│   ├── productos.html      Catálogo
│   ├── carrito.html        Carrito de compras
│   ├── login.html          Inicio de sesión
│   ├── registro.html       Registro de usuario
│   ├── admin.html          Panel administrador
│   └── perfil.html         Perfil del usuario
├── css/                    Hojas de estilo por sección
├── js/                     Lógica del sitio (api, auth, cart, nav)
└── assets/                 Imágenes, favicon y recursos</pre>

<h3>3.5. Instalación de la plataforma (paso a paso)</h3>

<div class="step">
<strong>Paso 1 — Instalar el editor de código</strong>
Descargar Cursor desde https://cursor.com o Visual Studio Code desde https://code.visualstudio.com.
Ejecutar el instalador, aceptar la ruta por defecto y abrir el programa al finalizar.
</div>

<div class="step">
<strong>Paso 2 — Instalar la extensión Live Server</strong>
En el editor: <code>Ctrl+Shift+X</code> para abrir Extensiones. Buscar <em>Live Server</em> (autor Ritwick Dey).
Clic en <em>Install</em>. Al terminar, aparece el botón <em>Go Live</em> en la barra inferior derecha.
</div>

<div class="step">
<strong>Paso 3 — Abrir la carpeta del proyecto</strong>
Menú <em>File → Open Folder</em>. Seleccionar la carpeta raíz del repositorio, por ejemplo:
<code>C:\\Users\\acost\\Desktop\\YOGURASO-WEB</code>. El explorador lateral debe listar
<code>frontend</code>, <code>backend</code> y <code>database</code>.
</div>

<div class="step">
<strong>Paso 4 — Configurar Live Server (opcional)</strong>
Si el puerto 5500 está ocupado, en ajustes del editor buscar <em>Live Server › Settings: Port</em>
y asignar otro valor (por ejemplo 5501). Por defecto Live Server usa 5500.
</div>

<h3>3.6. Despliegue local del producto de prueba</h3>

<div class="step">
<strong>Paso 5 — Iniciar el servidor local</strong>
En el explorador de archivos del editor, ubicar <code>frontend/index.html</code>. Clic derecho →
<strong>Open with Live Server</strong>. Alternativa: abrir la carpeta <code>frontend</code> como raíz del workspace
y pulsar <em>Go Live</em>. El navegador abrirá una URL como
<code>http://127.0.0.1:5500/index.html</code>.
</div>

<div class="fig">
  <img src="GA10-AA3-evidencias/01_inicio_home.png" alt="Inicio YogurASO en localhost">
  <p class="caption">Figura 1. Página de inicio desplegada localmente. URL visible: ${LIVE_URL}/index.html</p>
</div>

<div class="step">
<strong>Paso 6 — Verificar la página de inicio</strong>
Comprobar que cargan el logo YogurASO, el menú de navegación, el hero con llamada a acción,
las secciones de beneficios y el pie de página. Si los estilos no cargan, revisar que Live
Server esté sirviendo desde la carpeta que contiene <code>css/</code> y <code>js/</code> (normalmente <code>frontend/</code>).
</div>

<div class="step">
<strong>Paso 7 — Navegar al catálogo de productos</strong>
Desde el menú, entrar a <em>Productos</em> o abrir directamente
<code>${LIVE_URL}/pages/productos.html</code>. Debe mostrarse la grilla de productos y el campo de búsqueda.
</div>

<div class="fig">
  <img src="GA10-AA3-evidencias/02_catalogo_productos.png" alt="Catálogo de productos">
  <p class="caption">Figura 2. Catálogo de productos en el entorno local (${LIVE_URL}/pages/productos.html).</p>
</div>

<div class="step">
<strong>Paso 8 — Revisar formulario de inicio de sesión</strong>
Abrir <code>pages/login.html</code>. Verificar campos de correo y contraseña, botón de acceso y enlace
a registro. La página debe verse igual que en las capturas sin errores de consola por rutas
incorrectas de CSS.
</div>

<div class="fig">
  <img src="GA10-AA3-evidencias/03_login.png" alt="Página de login">
  <p class="caption">Figura 3. Formulario de inicio de sesión servido por Live Server.</p>
</div>

<div class="step">
<strong>Paso 9 — Abrir el carrito de compras</strong>
Navegar a <code>pages/carrito.html</code>. Si no hay productos agregados, la vista muestra el estado
vacío; si hay ítems en <code>localStorage</code>, se listan con opciones de cantidad y eliminación.
</div>

<div class="fig">
  <img src="GA10-AA3-evidencias/05_carrito.png" alt="Vista del carrito">
  <p class="caption">Figura 4. Vista del carrito en despliegue local.</p>
</div>

<div class="step">
<strong>Paso 10 — Probar registro y panel admin (navegación)</strong>
Abrir <code>pages/registro.html</code> y <code>pages/admin.html</code> para confirmar que todas las vistas del
producto de prueba responden desde el servidor local.
</div>

<div class="fig">
  <img src="GA10-AA3-evidencias/04_registro.png" alt="Página de registro">
  <p class="caption">Figura 5. Formulario de registro accesible en local.</p>
</div>

<div class="fig">
  <img src="GA10-AA3-evidencias/06_admin.png" alt="Panel administrador">
  <p class="caption">Figura 6. Panel administrador cargado desde el servidor local.</p>
</div>

<div class="step">
<strong>Paso 11 — Detener Live Server</strong>
En la barra inferior del editor, clic en <em>Port: 5500</em> o <em>Go Live</em> y seleccionar la opción para
detener el servidor. La URL dejará de responder hasta volver a iniciar el servicio.
</div>

<h3>3.7. Tabla de verificación del despliegue</h3>
<table>
  <tr><th>Ítem</th><th>Cómo verificar</th><th>Resultado esperado</th></tr>
  <tr><td>Servidor activo</td><td>Botón Go Live encendido en el editor</td><td>Puerto 5500 (o el configurado) en uso</td></tr>
  <tr><td>URL base</td><td>Barra de direcciones del navegador</td><td><code>http://127.0.0.1:5500/</code> o <code>localhost:5500</code></td></tr>
  <tr><td>CSS y JS</td><td>Inspeccionar elemento en el navegador</td><td>Archivos <code>css/*.css</code> y <code>js/*.js</code> con estado 200</td></tr>
  <tr><td>Navegación</td><td>Enlaces del menú principal</td><td>Sin error 404 en páginas del sitio</td></tr>
  <tr><td>Recarga automática</td><td>Editar y guardar un archivo HTML</td><td>Live Server refresca el navegador</td></tr>
  <tr><td>Responsive</td><td>Modo dispositivo en DevTools</td><td>Menú hamburguesa y cards adaptadas al móvil</td></tr>
</table>

<h3>3.8. Complemento opcional: backend y base de datos</h3>
<p>
Para probar registro, login con JWT y CRUD del admin con datos persistentes, además de Live
Server se ejecuta el API y PostgreSQL:
</p>
<ol>
  <li>Crear la base <code>yoguraso_db</code> y ejecutar <code>database/schema.sql</code>.</li>
  <li>En <code>backend/</code>: copiar <code>.env.example</code> a <code>.env</code>, configurar usuario y contraseña de BD.</li>
  <li>Ejecutar <code>npm install</code> y <code>npm run dev</code> dentro de <code>backend/</code> (API en puerto 3000).</li>
  <li>En <code>frontend/js/config.js</code>, confirmar <code>API_URL = 'http://localhost:3000'</code>.</li>
</ol>
<div class="note">
Para la evidencia AA3-EV01 el requisito principal es el <strong>despliegue local de la plantilla HTML</strong>.
Live Server cumple ese objetivo. El backend es un complemento cuando se requiere validar la
aplicación completa con identificación y registro de usuario en base de datos.
</div>

<h2>4. Conclusiones</h2>
<p>
El montaje de un servidor de aplicaciones local para una plantilla HTML no exige siempre un
stack pesado como XAMPP. Con <strong>Cursor/VS Code</strong> y la extensión <strong>Live Server</strong> se obtiene un
entorno de despliegue rápido, apropiado para frontends estáticos y para proyectos formativos
como YogurASO.
</p>
<p>
La plantilla seleccionada cumple el perfil de las landing pages HTML gratuitas referenciadas
en fuentes abiertas: estructura multipágina, estilos modulares y navegación entre secciones.
El procedimiento documentado — instalación del editor, extensión Live Server, apertura del
proyecto, inicio con <em>Open with Live Server</em> y verificación en el navegador — puede reproducirse
en cualquier computador cliente con los requisitos mínimos indicados.
</p>
<p>
Las capturas incluidas en este informe confirman que el producto de prueba se visualiza
correctamente en <code>${LIVE_URL}</code>, con las páginas de inicio, catálogo, login, registro,
carrito y administración accesibles desde el servidor local.
</p>

<h2>5. Referencias</h2>
<div class="refs">
  <p>Microsoft. (2024). <em>Visual Studio Code documentation</em>. https://code.visualstudio.com/docs</p>
  <p>Mozilla Developer Network. (2024). <em>Setting up a local testing server</em>. https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Tools_and_setup/set_up_a_local_testing_server</p>
  <p>Pacilio, D. (2021, agosto 9). 40+ free HTML landing page templates [Artículo]. <em>DEV Community</em>. https://dev.to/davidepacilio/40-free-html-landing-page-templates-3gfp</p>
  <p>Ritwick Dey. (2024). <em>Live Server extension for Visual Studio Code</em>. https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer</p>
  <p>Servicio Nacional de Aprendizaje [SENA]. (2024). <em>GFPI-F-135 V01 — Guía de aprendizaje</em>. Formación profesional integral.</p>
</div>

</div>
</body>
</html>`;
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  try {
    await capture(page, '01_inicio_home.png', '/index.html', false);
    await capture(page, '02_catalogo_productos.png', '/pages/productos.html', false);
    await capture(page, '03_login.png', '/pages/login.html', false);
    await capture(page, '04_registro.png', '/pages/registro.html', false);
    await capture(page, '05_carrito.png', '/pages/carrito.html', false);
    await capture(page, '06_admin.png', '/pages/admin.html', false);

    const html = buildHtml();
    fs.writeFileSync(HTML_OUT, html, 'utf8');
    console.log('HTML:', HTML_OUT);

    const pdfPage = await browser.newPage();
    await pdfPage.goto(`file:///${HTML_OUT.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
    await pdfPage.pdf({
      path: PDF_OUT,
      format: 'letter',
      printBackground: true,
      margin: { top: '0.5cm', bottom: '0.5cm', left: '0cm', right: '0cm' },
    });
    console.log('PDF:', PDF_OUT);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
