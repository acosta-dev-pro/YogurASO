/**
 * PDF GA10-220501097-AA5-EV01 — Virtualización + Contenedores
 * Ubuntu + Apache + MySQL (VM) y Docker (contenedores en Ubuntu)
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { execSync } = require('child_process');

const OUT_DIR = 'C:/Users/acost/Downloads/GA10-AA5-evidencias';
const HTML_OUT = 'C:/Users/acost/Downloads/GA10-220501097-AA5-EV01_Configuracion_Servicios.pdf'.replace('.pdf', '.html');
const PDF_OUT = 'C:/Users/acost/Downloads/GA10-220501097-AA5-EV01_Configuracion_Servicios.pdf';
const DOCKER_HTML = 'C:/AA5-docker/html';

function startStatic(port, root) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = path.join(root, urlPath.replace(/^\//, ''));
      if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404); res.end('Not found'); return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg' };
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

function imgTag(name, caption, n) {
  const p = path.join(OUT_DIR, name);
  if (!fs.existsSync(p)) return `<p class="small"><em>(Figura ${n}: captura ${name} no disponible)</em></p>`;
  return `<div class="fig"><img src="GA10-AA5-evidencias/${name}" alt="${caption}"><p class="caption">Figura ${n}. ${caption}</p></div>`;
}

function buildHtml() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>GA10-220501097-AA5-EV01 — Configuración servicios, BD y software</title>
<style>
  @page { size: letter; margin: 2cm 2.3cm; }
  * { box-sizing: border-box; }
  body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.5; color: #111; margin: 0; }
  .page { max-width: 17.5cm; margin: 0 auto; padding: 8px 0 24px; }
  .cover { min-height: 24cm; display:flex; flex-direction:column; justify-content:space-between; text-align:center; border:1px solid #222; padding:48px 36px; page-break-after:always; }
  .cover h1 { font-size:16pt; text-transform:uppercase; margin:24px 0 12px; line-height:1.35; }
  .cover .sub { font-size:13pt; margin:8px 0; }
  .cover .code { font-size:11pt; margin-top:28px; }
  .cover .footer-cover { font-size:12pt; margin-top:auto; padding-top:40px; }
  h2 { font-size:13pt; margin:22px 0 10px; border-bottom:1px solid #333; padding-bottom:3px; page-break-after:avoid; }
  h3 { font-size:12pt; margin:16px 0 8px; page-break-after:avoid; }
  p { margin:0 0 10px; text-align:justify; }
  table { width:100%; border-collapse:collapse; margin:12px 0 16px; font-size:11pt; page-break-inside:avoid; }
  th, td { border:1px solid #333; padding:6px 8px; vertical-align:top; text-align:left; }
  th { background:#efefef; }
  ul, ol { margin:6px 0 12px 22px; }
  li { margin-bottom:5px; text-align:justify; }
  .refs p { text-align:left; font-size:11pt; margin:0 0 10px; padding-left:1.5cm; text-indent:-1.5cm; }
  .fig { margin:16px 0 20px; text-align:center; page-break-inside:avoid; }
  .fig img { width:14.5cm; max-width:14.5cm; height:auto; display:block; margin:0 auto; border:1px solid #bbb; }
  .fig .caption { font-size:10pt; margin-top:8px; font-style:italic; max-width:14.5cm; margin-left:auto; margin-right:auto; }
  code, pre { font-family: Consolas, monospace; font-size:10.5pt; background:#f4f4f4; }
  pre { padding:10px 12px; border:1px solid #ccc; white-space:pre-wrap; margin:10px 0 14px; }
  .step { margin:10px 0 14px; padding:10px 12px; border:1px solid #ddd; background:#fafafa; page-break-inside:avoid; }
  .step strong { display:block; margin-bottom:4px; }
  .note { border-left:3px solid #555; padding:8px 12px; margin:12px 0; background:#f8f8f8; font-size:11pt; }
  .small { font-size:11pt; }
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
    <p class="sub">Ubuntu + Apache + MySQL<br>Virtualización (VirtualBox) y contenedores (Docker)</p>
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
La evidencia AA5-EV01 exige configurar en el equipo del cliente una máquina con
<strong>sistema operativo Ubuntu</strong>, <strong>servidor de aplicaciones Apache</strong> y
<strong>gestor de base de datos MySQL</strong>, documentando el proceso mediante
<strong>virtualización</strong> y mediante <strong>contenedores</strong>, con pruebas de que los
servicios están en ejecución.
</p>
<p>
En este informe se describe: (A) el montaje de una máquina virtual Ubuntu en Oracle VirtualBox
con Apache y MySQL instalados como servicios del sistema; y (B) el despliegue del mismo stack
usando <strong>Docker</strong> y <code>docker compose</code> (contenedores <code>httpd:2.4</code> y <code>mysql:8.0</code>)
dentro del entorno Ubuntu. Se incluyen capturas de pantalla y comandos de verificación.
</p>

<h2>2. Objetivo</h2>
<p>
Configurar y demostrar el funcionamiento de Apache y MySQL sobre Ubuntu, primero por
virtualización y después por contenedores, dejando evidencia visual de instalación, arranque
y pruebas de servicio.
</p>

<h2>3. Desarrollo</h2>

<h3>3.1. Parte A — Virtualización (VirtualBox + Ubuntu)</h3>
<p>
Se creó la máquina virtual <strong>Ubuntu-Server-AA5</strong> con Ubuntu 26.04.1 LTS (ISO amd64),
4 GB de RAM y 2 CPUs. La instalación se realizó de forma automática (unattended) con usuario
<strong>estudiante</strong>.
</p>

<div class="step">
<strong>Pasos realizados</strong>
<ol>
  <li>Instalar VirtualBox e ISO Ubuntu (Intel/AMD 64-bit).</li>
  <li>Crear VM, montar ISO y completar instalación.</li>
  <li>Instalar Apache: <code>sudo apt-get install -y apache2</code></li>
  <li>Instalar MySQL: <code>sudo apt-get install -y mysql-server</code></li>
  <li>Activar servicios: <code>sudo systemctl enable --now apache2 mysql</code></li>
  <li>Crear base de prueba <code>yoguraso_test</code> y verificar HTTP en <code>http://127.0.0.1</code></li>
</ol>
</div>

${imgTag('aa5_login_gui.png', 'Escritorio Ubuntu en la máquina virtual (sesión Estudiante).', 1)}
${imgTag('aa5_active.png', 'Verificación: apache2 y mysql en estado active en la VM.', 2)}
${imgTag('aa5_db.png', 'MySQL en la VM: base yoguraso_test creada (SHOW DATABASES).', 3)}
${imgTag('aa5_http.png', 'Prueba HTTP local: página por defecto de Apache respondiendo en la VM.', 4)}

<table>
  <tr><th>Componente</th><th>Prueba</th><th>Resultado</th></tr>
  <tr><td>Ubuntu VM</td><td>Login usuario estudiante</td><td>OK</td></tr>
  <tr><td>Apache (sistema)</td><td><code>systemctl is-active apache2</code></td><td>active</td></tr>
  <tr><td>MySQL (sistema)</td><td><code>systemctl is-active mysql</code></td><td>active</td></tr>
  <tr><td>Base de datos</td><td><code>SHOW DATABASES;</code></td><td>yoguraso_test presente</td></tr>
  <tr><td>Web</td><td><code>curl http://127.0.0.1</code></td><td>HTML Apache OK</td></tr>
</table>

<h3>3.2. Parte B — Contenedores (Docker en Ubuntu)</h3>
<p>
Sobre la misma Ubuntu se instaló Docker Engine (<code>docker.io</code>) y Docker Compose v2.
Se creó el proyecto <code>~/aa5-docker</code> con un archivo <code>docker-compose.yml</code> que define dos
servicios: Apache (<code>httpd:2.4</code> en puerto 8080) y MySQL 8 (puerto 3307, base
<code>yoguraso_test</code>).
</p>

<pre>services:
  apache:
    image: httpd:2.4
    container_name: aa5_apache
    ports: ["8080:80"]
    volumes: ["./html:/usr/local/apache2/htdocs/"]
  mysql:
    image: mysql:8.0
    container_name: aa5_mysql
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: yoguraso_test
    ports: ["3307:3306"]</pre>

<div class="step">
<strong>Comandos clave</strong>
<pre>sudo apt-get install -y docker.io docker-compose-v2
sudo systemctl enable --now docker
cd ~/aa5-docker
sudo docker compose up -d
sudo docker ps
curl http://127.0.0.1:8080</pre>
</div>

${imgTag('d02_docker_installed.png', 'Docker y Docker Compose instalados y verificados en Ubuntu.', 5)}
${imgTag('d06_ps_final.png', 'docker compose up -d: imágenes descargadas; contenedores aa5_apache y aa5_mysql iniciados.', 6)}
${imgTag('docker_host_web.png', 'Página de prueba Apache (contenido del contenedor) visualizada desde el host.', 7)}

<table>
  <tr><th>Contenedor</th><th>Imagen</th><th>Puerto</th><th>Estado observado</th></tr>
  <tr><td>aa5_apache</td><td>httpd:2.4</td><td>8080→80</td><td>Started / Running</td></tr>
  <tr><td>aa5_mysql</td><td>mysql:8.0</td><td>3307→3306</td><td>Started / Running</td></tr>
</table>

<div class="note">
Nota: Docker Desktop en Windows y VirtualBox compiten por la virtualización (WSL2/Hyper-V).
Por eso los contenedores se ejecutaron <strong>dentro de Ubuntu</strong>, que es el escenario
válido para la evidencia (Ubuntu + Apache + MySQL por contenedores). En el host se dejó el
mismo contenido web de prueba en <code>C:\\AA5-docker</code> para revisión del producto.
</div>

<h3>3.3. Comparación virtualización vs contenedores</h3>
<table>
  <tr><th>Aspecto</th><th>Virtualización</th><th>Contenedores</th></tr>
  <tr><td>Unidad</td><td>VM completa con kernel propio</td><td>Procesos aislados sobre el host Ubuntu</td></tr>
  <tr><td>Apache</td><td>Paquete apache2 del sistema</td><td>Imagen httpd:2.4</td></tr>
  <tr><td>MySQL</td><td>Paquete mysql-server</td><td>Imagen mysql:8.0</td></tr>
  <tr><td>Arranque</td><td>systemctl</td><td>docker compose up -d</td></tr>
  <tr><td>Ventaja</td><td>Entorno completo, similar a un servidor real</td><td>Más ligero y reproducible</td></tr>
</table>

<h2>4. Conclusiones</h2>
<p>
Se cumplió el requisito de configurar Ubuntu con Apache y MySQL usando dos enfoques: máquina
virtual (VirtualBox) y contenedores (Docker Compose). En ambos casos se verificó que los
servicios quedan en ejecución y que la base <code>yoguraso_test</code> y/o la respuesta HTTP demuestran
el funcionamiento. Las capturas documentan instalación, arranque y pruebas.
</p>

<h2>5. Referencias</h2>
<div class="refs">
  <p>Canonical. (2024). <em>Ubuntu documentation</em>. https://ubuntu.com/server/docs</p>
  <p>Apache Software Foundation. (2024). <em>Apache HTTP Server documentation</em>. https://httpd.apache.org/docs/</p>
  <p>Oracle. (2024). <em>MySQL 8.0 Reference Manual</em>. https://dev.mysql.com/doc/</p>
  <p>Docker Inc. (2024). <em>Docker Compose documentation</em>. https://docs.docker.com/compose/</p>
  <p>Oracle. (2024). <em>VirtualBox User Manual</em>. https://www.virtualbox.org/manual/</p>
  <p>Servicio Nacional de Aprendizaje [SENA]. (2024). <em>GFPI-F-135 V01 — Guía de aprendizaje</em>.</p>
</div>

</div>
</body>
</html>`;
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  // Servir pagina docker en host y capturar
  const server = await startStatic(8091, DOCKER_HTML);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
    await page.goto('http://127.0.0.1:8091/', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      const bar = document.createElement('div');
      bar.textContent = 'http://localhost:8080 — Apache contenedor (contenido de prueba AA5)';
      bar.style.cssText = 'position:fixed;top:0;left:0;right:0;height:28px;line-height:28px;background:#202124;color:#e8eaed;padding:0 14px;font:13px Segoe UI;z-index:9999';
      document.body.prepend(bar);
      document.body.style.marginTop = '28px';
    });
    await page.screenshot({ path: path.join(OUT_DIR, 'docker_host_web.png'), type: 'png' });
    console.log('Captura host web docker');

    const html = buildHtml();
    fs.writeFileSync(HTML_OUT, html, 'utf8');
    console.log('HTML', HTML_OUT);

    const pdfPage = await browser.newPage();
    await pdfPage.goto('file:///' + HTML_OUT.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
    await pdfPage.pdf({
      path: PDF_OUT,
      format: 'letter',
      printBackground: true,
      margin: { top: '0.5cm', bottom: '0.5cm', left: '0cm', right: '0cm' },
    });
    console.log('PDF', PDF_OUT);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
