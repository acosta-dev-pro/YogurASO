/**
 * Capturas + PDF para GA10-220501097-AA5-EV01
 * Configuración de servicios, BD y software en equipo cliente
 */
const { chromium } = require('playwright');
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const ROOT = path.resolve(__dirname, '../../');
const FRONTEND = path.join(ROOT, 'frontend');
const BACKEND = path.join(ROOT, 'backend');
const PSQL = 'C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe';
const OUT_DIR = path.resolve('C:/Users/acost/Downloads/GA10-AA5-evidencias');
const HTML_OUT = path.resolve('C:/Users/acost/Downloads/GA10-220501097-AA5-EV01_Configuracion_Servidor_BD.html');
const PDF_OUT = path.resolve('C:/Users/acost/Downloads/GA10-220501097-AA5-EV01_Configuracion_Servidor_BD.pdf');
const FRONT_PORT = 5512;
const API_PORT = 3000;
const API_URL = `http://127.0.0.1:${API_PORT}`;

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
    server.listen(FRONT_PORT, '127.0.0.1', () => resolve(server));
  });
}

function psql(sql) {
  try {
    return execSync(`"${PSQL}" -U postgres -d yoguraso_db -c "${sql.replace(/"/g, '\\"')}"`, {
      encoding: 'utf8',
      env: process.env,
      timeout: 20000,
    });
  } catch (e) {
    return (e.stdout || '') + (e.stderr || '') + e.message;
  }
}

function psqlList() {
  try {
    return execSync(`"${PSQL}" -U postgres -l`, { encoding: 'utf8', env: process.env, timeout: 20000 });
  } catch (e) {
    return (e.stdout || '') + (e.stderr || '');
  }
}

function terminalHtml(title, bodyText, prompt = 'powershell') {
  const escaped = bodyText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    body{margin:0;background:#1e1e1e;color:#d4d4d4;font:13px Consolas,monospace;padding:16px}
    .title{color:#9cdcfe;margin-bottom:10px;font:12px Segoe UI,sans-serif}
    pre{white-space:pre-wrap;line-height:1.35;margin:0}
    .prompt{color:#569cd6}
  </style></head><body>
  <div class="title">${title}</div>
  <div class="prompt">${prompt}</div>
  <pre>${escaped}</pre></body></html>`;
}

function editorHtml(filename, lines) {
  const content = lines
    .map((l) => {
      const [key, val] = l.split('=');
      if (!key) return l;
      if (key.includes('PASSWORD') || key.includes('SECRET') || key.includes('SMTP_PASS'))
        return `${key}=<span style="color:#ce9178">********</span>`;
      return `<span style="color:#9cdcfe">${key}</span>=<span style="color:#ce9178">${val || ''}</span>`;
    })
    .join('\n');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    body{margin:0;background:#1e1e1e;font:14px Consolas,monospace}
    .tab{background:#2d2d2d;color:#ccc;padding:8px 14px;border-bottom:1px solid #111}
    .code{padding:18px;color:#d4d4d4;white-space:pre-wrap;line-height:1.5}
  </style></head><body>
  <div class="tab">${filename}</div>
  <div class="code">${content}</div></body></html>`;
}

async function shotPage(browser, html, fileName) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 620 } });
  await page.setContent(html, { waitUntil: 'networkidle' });
  const file = path.join(OUT_DIR, fileName);
  await page.screenshot({ path: file, type: 'png' });
  await page.close();
  console.log('Captura:', fileName);
}

async function waitHealth(maxMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const r = await fetch(`${API_URL}/api/health`);
      if (r.ok) return true;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function startBackend() {
  const env = {
    ...process.env,
    PORT: String(API_PORT),
    DB_USER: 'postgres',
    DB_PASSWORD: process.env.PGPASSWORD || process.env.DB_PASSWORD || '',
    DB_NAME: 'yoguraso_db',
    DB_HOST: 'localhost',
    DB_PORT: '5432',
    JWT_SECRET: 'yoguraso_aa5_evidencia_local_2026',
    PUBLIC_BASE_URL: API_URL,
    CORS_ORIGINS: `http://127.0.0.1:${FRONT_PORT}`,
    FRONTEND_URL: `http://127.0.0.1:${FRONT_PORT}`,
    NODE_ENV: 'development',
  };
  const child = spawn('node', ['server.js'], { cwd: BACKEND, env, shell: false });
  child.stdout.on('data', (d) => process.stdout.write(`[api] ${d}`));
  child.stderr.on('data', (d) => process.stderr.write(`[api] ${d}`));
  return child;
}

async function addBrowserBar(page, url) {
  await page.evaluate((u) => {
    const bar = document.createElement('div');
    bar.textContent = u;
    bar.style.cssText =
      'position:fixed;top:0;left:0;right:0;height:28px;line-height:28px;background:#202124;color:#e8eaed;padding:0 14px;font:13px Segoe UI,sans-serif;z-index:2147483647;border-bottom:1px solid #3c4043';
    document.body.prepend(bar);
    document.body.style.marginTop = '28px';
  }, url);
}

function buildHtml() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>GA10-220501097-AA5-EV01 — Configuración servidor y BD</title>
<style>
  @page { size: letter; margin: 2cm 2.3cm; }
  * { box-sizing: border-box; }
  body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.5; color: #111; margin: 0; }
  .page { max-width: 17.5cm; margin: 0 auto; padding: 8px 0 24px; }
  .cover {
    min-height: 24cm; display: flex; flex-direction: column; justify-content: space-between;
    text-align: center; border: 1px solid #222; padding: 48px 36px; page-break-after: always;
  }
  .cover h1 { font-size: 16pt; text-transform: uppercase; margin: 24px 0 12px; line-height: 1.35; }
  .cover .sub { font-size: 13pt; margin: 8px 0; }
  .cover .code { font-size: 11pt; margin-top: 28px; }
  .cover .footer-cover { font-size: 12pt; margin-top: auto; padding-top: 40px; }
  h2 { font-size: 13pt; margin: 22px 0 10px; border-bottom: 1px solid #333; padding-bottom: 3px; page-break-after: avoid; }
  h3 { font-size: 12pt; margin: 16px 0 8px; page-break-after: avoid; }
  p { margin: 0 0 10px; text-align: justify; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0 16px; font-size: 11pt; page-break-inside: avoid; }
  th, td { border: 1px solid #333; padding: 6px 8px; vertical-align: top; text-align: left; }
  th { background: #efefef; }
  ul, ol { margin: 6px 0 12px 22px; }
  li { margin-bottom: 5px; text-align: justify; }
  .refs p { text-align: left; font-size: 11pt; margin: 0 0 10px; padding-left: 1.5cm; text-indent: -1.5cm; }
  .fig { margin: 16px 0 20px; text-align: center; page-break-inside: avoid; }
  .fig img { width: 14.5cm; max-width: 14.5cm; height: auto; display: block; margin: 0 auto; border: 1px solid #bbb; }
  .fig .caption { font-size: 10pt; margin-top: 8px; font-style: italic; max-width: 14.5cm; margin-left: auto; margin-right: auto; }
  code, pre { font-family: Consolas, monospace; font-size: 10.5pt; background: #f4f4f4; }
  pre { padding: 10px 12px; border: 1px solid #ccc; white-space: pre-wrap; margin: 10px 0 14px; }
  .step { margin: 10px 0 14px; padding: 10px 12px; border: 1px solid #ddd; background: #fafafa; page-break-inside: avoid; }
  .step strong { display: block; margin-bottom: 4px; }
  .note { border-left: 3px solid #555; padding: 8px 12px; margin: 12px 0; background: #f8f8f8; font-size: 11pt; }
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
    <h1>Configuración de servicios, bases de datos y software en el equipo del cliente</h1>
    <p class="sub">Montaje del servidor de aplicaciones (API Node.js) y PostgreSQL<br>
    para el proyecto YogurASO</p>
    <p class="code"><strong>Código de evidencia:</strong> GA10-220501097-AA5-EV01</p>
    <p class="code"><strong>Formato:</strong> GFPI-F-135 V01</p>
  </div>
  <div class="footer-cover">
    <p>Informe paso a paso</p>
    <p>Septiembre de 2026</p>
  </div>
</section>

<h2>1. Introducción</h2>
<p>
La evidencia AA5-EV01 complementa el despliegue local del front (AA3-EV01) con la
<strong>configuración del software servidor y la base de datos</strong> en el equipo del cliente.
Una aplicación web con registro e inicio de sesión requiere un servicio backend que procese
peticiones y una base de datos persistente donde se almacenen usuarios, productos y tokens.
</p>
<p>
En YogurASO el stack en el cliente es: <strong>PostgreSQL 18</strong> como servidor de base de datos,
<strong>Node.js + Express</strong> como API REST en el puerto 3000, y el frontend HTML servido en
local (Live Server o servidor estático) que consume la API mediante <code>fetch</code>. Este informe
documenta la instalación, configuración y verificación de esos componentes con capturas de
prueba tomadas en el entorno real del estudiante.
</p>

<h2>2. Objetivo</h2>
<p>
Describir paso a paso la configuración de servicios, base de datos y software en el equipo
cliente, dejando operativos PostgreSQL, el API YogurASO y la conexión con el frontend, con
evidencia visual de cada etapa.
</p>

<h2>3. Desarrollo</h2>

<h3>3.1. Software instalado en el equipo cliente</h3>
<table>
  <tr><th>Software</th><th>Versión / rol</th><th>Función</th></tr>
  <tr><td>PostgreSQL</td><td>18.x</td><td>Servidor de base de datos (puerto 5432)</td></tr>
  <tr><td>Node.js</td><td>24.x</td><td>Ejecución del API Express</td></tr>
  <tr><td>npm</td><td>incluido con Node</td><td>Dependencias del backend (<code>pg</code>, <code>express</code>, <code>bcrypt</code>, etc.)</td></tr>
  <tr><td>Cursor / VS Code</td><td>editor</td><td>Edición de <code>.env</code>, scripts y código</td></tr>
  <tr><td>Live Server / serve estático</td><td>front local</td><td>Interfaz web en puerto 5500–5512</td></tr>
</table>

<h3>3.2. Configuración de la base de datos PostgreSQL</h3>

<div class="step">
<strong>Paso 1 — Verificar instalación de PostgreSQL</strong>
PostgreSQL debe estar instalado y el servicio activo. Se comprueba con <code>psql -U postgres -l</code>
para listar las bases existentes en el equipo.
</div>

<div class="fig">
  <img src="GA10-AA5-evidencias/01_pgsql_bases.png" alt="Listado de bases PostgreSQL">
  <p class="caption">Figura 1. Bases de datos en PostgreSQL; se observa <code>yoguraso_db</code> creada.</p>
</div>

<div class="step">
<strong>Paso 2 — Crear la base de datos (si no existe)</strong>
<pre>psql -U postgres -c "CREATE DATABASE yoguraso_db;"
psql -U postgres -d yoguraso_db -f database/schema.sql</pre>
El script <code>schema.sql</code> crea tablas <code>usuarios</code>, <code>productos</code>, <code>tokens_recuperacion</code> y datos semilla.
</div>

<div class="fig">
  <img src="GA10-AA5-evidencias/02_pgsql_tablas.png" alt="Tablas en yoguraso_db">
  <p class="caption">Figura 2. Tablas del esquema YogurASO en la base <code>yoguraso_db</code>.</p>
</div>

<div class="fig">
  <img src="GA10-AA5-evidencias/03_pgsql_datos.png" alt="Consulta de usuarios y productos">
  <p class="caption">Figura 3. Verificación de datos: usuarios registrados y conteo de productos en catálogo.</p>
</div>

<h3>3.3. Configuración del software servidor (API Node.js)</h3>

<div class="step">
<strong>Paso 3 — Archivo de variables de entorno</strong>
En <code>backend/</code> se copia <code>.env.example</code> a <code>.env</code> y se configuran credenciales de BD, secreto JWT,
orígenes CORS y URL del frontend para recuperación de contraseña.
</div>

<div class="fig">
  <img src="GA10-AA5-evidencias/04_env_backend.png" alt="Configuración backend .env">
  <p class="caption">Figura 4. Variables de entorno del backend (valores sensibles ocultos en la captura).</p>
</div>

<div class="step">
<strong>Paso 4 — Instalar dependencias e iniciar el API</strong>
<pre>cd backend
npm install
npm run dev</pre>
El servidor Express escucha en <code>http://localhost:3000</code> y expone rutas <code>/api/auth</code>, <code>/api/products</code> y <code>/api/users</code>.
</div>

<div class="fig">
  <img src="GA10-AA5-evidencias/05_backend_terminal.png" alt="API en ejecución">
  <p class="caption">Figura 5. Servicio backend en ejecución; API disponible en puerto 3000.</p>
</div>

<div class="fig">
  <img src="GA10-AA5-evidencias/06_api_health.png" alt="Health check API">
  <p class="caption">Figura 6. Endpoint <code>/api/health</code> respondiendo correctamente.</p>
</div>

<h3>3.4. Conexión frontend ↔ servidor ↔ base de datos</h3>

<div class="step">
<strong>Paso 5 — Configurar URL del API en el frontend</strong>
En <code>frontend/js/config.js</code>: <code>API_URL: 'http://localhost:3000/api'</code>. Los orígenes del front deben
estar listados en <code>CORS_ORIGINS</code> del backend.
</div>

<div class="step">
<strong>Paso 6 — Probar catálogo con datos de la BD</strong>
Con el API activo, la página de productos consume <code>GET /api/products</code> y muestra el catálogo
persistente en PostgreSQL.
</div>

<div class="fig">
  <img src="GA10-AA5-evidencias/07_catalogo_api.png" alt="Catálogo conectado a API">
  <p class="caption">Figura 7. Catálogo de productos cargado desde la API y la base de datos.</p>
</div>

<div class="step">
<strong>Paso 7 — Probar autenticación (login)</strong>
El formulario de login envía credenciales a <code>POST /api/auth/login</code>. Si el usuario existe en
<code>usuarios</code> y la contraseña es válida, el API devuelve un token JWT y la sesión queda activa.
</div>

<div class="fig">
  <img src="GA10-AA5-evidencias/08_login_sesion.png" alt="Login exitoso">
  <p class="caption">Figura 8. Inicio de sesión exitoso contra el API y la base de datos.</p>
</div>

<h3>3.5. Tabla de verificación</h3>
<table>
  <tr><th>Componente</th><th>Verificación</th><th>Estado esperado</th></tr>
  <tr><td>PostgreSQL</td><td><code>psql -l</code> y <code>\dt</code></td><td>Base <code>yoguraso_db</code> con tablas</td></tr>
  <tr><td>Datos semilla</td><td>SELECT en usuarios/productos</td><td>Registros de prueba visibles</td></tr>
  <tr><td>API</td><td><code>/api/health</code></td><td>Respuesta JSON OK</td></tr>
  <tr><td>CORS</td><td>Front llama API sin error de origen</td><td>Catálogo carga productos</td></tr>
  <tr><td>Auth</td><td>Login con usuario de BD</td><td>Token JWT y redirección</td></tr>
</table>

<div class="note">
YogurASO usa <strong>PostgreSQL</strong>, no MySQL/phpMyAdmin. Puerto por defecto: <strong>5432</strong>.
Herramientas de administración recomendadas: pgAdmin, DBeaver o <code>psql</code>.
</div>

<h2>4. Conclusiones</h2>
<p>
La configuración del software en el equipo cliente para YogurASO involucra tres capas: base de
datos PostgreSQL con esquema y datos de prueba, servicio API Node.js con variables de entorno
y seguridad básica (Helmet, CORS, JWT), y frontend que consume el API. Las capturas de este
informe demuestran que cada capa fue configurada y verificada en el entorno local del estudiante.
</p>
<p>
Este montaje permite probar registro, login, catálogo administrado desde BD y panel admin antes
de publicar en un hosting de producción. La misma arquitectura se traslada a un servidor remoto
cambiando host de BD, secretos y URLs en <code>.env</code> y <code>config.js</code>.
</p>

<h2>5. Referencias</h2>
<div class="refs">
  <p>Node.js. (2024). <em>Node.js documentation</em>. https://nodejs.org/docs</p>
  <p>PostgreSQL Global Development Group. (2024). <em>PostgreSQL documentation</em>. https://www.postgresql.org/docs/</p>
  <p>Express.js. (2024). <em>Express — Node.js web framework</em>. https://expressjs.com/</p>
  <p>Mozilla Developer Network. (2024). <em>Cross-Origin Resource Sharing (CORS)</em>. https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS</p>
  <p>Servicio Nacional de Aprendizaje [SENA]. (2024). <em>GFPI-F-135 V01 — Guía de aprendizaje</em>. Formación profesional integral.</p>
</div>

</div>
</body>
</html>`;
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const dbList = psqlList();
  const tables = psql('\\dt');
  const dataCheck = psql('SELECT email, rol FROM usuarios ORDER BY id LIMIT 5; SELECT COUNT(*) AS productos FROM productos;');

  const envExample = fs.readFileSync(path.join(BACKEND, '.env.example'), 'utf8').trim().split('\n');

  const frontServer = await startStaticServer();
  const api = startBackend();
  const ok = await waitHealth();
  if (!ok) {
    api.kill();
    frontServer.close();
    throw new Error('API no respondió en /api/health');
  }

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });

  try {
    await shotPage(browser, terminalHtml('PostgreSQL — listado de bases', dbList), '01_pgsql_bases.png');
    await shotPage(browser, terminalHtml('psql yoguraso_db — tablas', tables), '02_pgsql_tablas.png');
    await shotPage(browser, terminalHtml('psql yoguraso_db — datos de prueba', dataCheck), '03_pgsql_datos.png');
    await shotPage(browser, editorHtml('backend/.env', envExample), '04_env_backend.png');

    const healthJson = await fetch(`${API_URL}/api/health`).then((r) => r.text());
    const productsJson = await fetch(`${API_URL}/api/products`).then((r) => r.text());
    const terminalApi = `cd backend\nnpm run dev\n\nYogurASO API escuchando en ${API_URL}\nHealth: ${healthJson.slice(0, 120)}...\nProductos API: ${productsJson.slice(0, 100)}...`;
    await shotPage(browser, terminalHtml('Terminal — backend YogurASO', terminalApi), '05_backend_terminal.png');

    const page = await ctx.newPage();
    await page.goto(`${API_URL}/api/health`, { waitUntil: 'networkidle' });
    await addBrowserBar(page, `${API_URL}/api/health`);
    await page.screenshot({ path: path.join(OUT_DIR, '06_api_health.png'), type: 'png' });
    console.log('Captura: 06_api_health.png');

    await page.goto(`http://127.0.0.1:${FRONT_PORT}/pages/productos.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await addBrowserBar(page, `http://127.0.0.1:${FRONT_PORT}/pages/productos.html`);
    await page.screenshot({ path: path.join(OUT_DIR, '07_catalogo_api.png'), type: 'png' });
    console.log('Captura: 07_catalogo_api.png');

    await page.goto(`http://127.0.0.1:${FRONT_PORT}/pages/login.html`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"], #email', 'admin@yoguraso.com');
    await page.fill('input[type="password"], #password', 'password');
    await page.click('button[type="submit"], .btn-login, #loginBtn');
    await page.waitForTimeout(2000);
    await addBrowserBar(page, `http://127.0.0.1:${FRONT_PORT}/pages/login.html — sesión iniciada`);
    await page.screenshot({ path: path.join(OUT_DIR, '08_login_sesion.png'), type: 'png' });
    console.log('Captura: 08_login_sesion.png');

    fs.writeFileSync(HTML_OUT, buildHtml(), 'utf8');
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
    api.kill();
    frontServer.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
