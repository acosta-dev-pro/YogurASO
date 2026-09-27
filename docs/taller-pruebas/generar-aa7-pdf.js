/**
 * PDF GA10-220501097-AA7-EV01
 * Realización de pruebas de funcionalidad del software
 * (sitio publicado en internet / dominio y hosting)
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const PDF_OUT = path.resolve('C:/Users/acost/Downloads/GA10-220501097-AA7-EV01_Pruebas_Funcionalidad.pdf');
const HTML_OUT = path.resolve('C:/Users/acost/Downloads/GA10-220501097-AA7-EV01_Pruebas_Funcionalidad.html');

function buildHtml() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>GA10-220501097-AA7-EV01 — Pruebas de funcionalidad del software</title>
<style>
  @page { size: letter; margin: 2.54cm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    line-height: 2;
    color: #111;
    margin: 0;
    background: #fff;
  }
  .page { max-width: 16.5cm; margin: 0 auto; padding: 0 0 24px; }
  .cover {
    min-height: 22cm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-align: center;
    border: 1px solid #222;
    padding: 48px 40px;
    page-break-after: always;
    line-height: 1.6;
  }
  .cover h1 {
    font-size: 16pt;
    text-transform: uppercase;
    margin: 28px 0 16px;
    line-height: 1.35;
    font-weight: 700;
  }
  .cover .sub { font-size: 13pt; margin: 8px 0; }
  .cover .code { font-size: 11pt; margin-top: 24px; }
  .cover .footer-cover { font-size: 12pt; margin-top: auto; padding-top: 36px; }
  h1.run { font-size: 12pt; text-align: center; font-weight: 700; margin: 0 0 24px; text-transform: none; }
  h2 {
    font-size: 12pt;
    font-weight: 700;
    margin: 28px 0 12px;
    page-break-after: avoid;
    text-align: left;
  }
  h3 {
    font-size: 12pt;
    font-weight: 700;
    font-style: italic;
    margin: 20px 0 10px;
    page-break-after: avoid;
  }
  h4 {
    font-size: 12pt;
    font-weight: 700;
    margin: 14px 0 8px;
    page-break-after: avoid;
  }
  p { margin: 0 0 12px; text-align: justify; text-indent: 1.27cm; }
  p.no-indent { text-indent: 0; }
  p.center { text-align: center; text-indent: 0; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0 18px;
    font-size: 11pt;
    line-height: 1.35;
    page-break-inside: avoid;
  }
  th, td {
    border: 1px solid #333;
    padding: 7px 8px;
    vertical-align: top;
    text-align: left;
  }
  th { background: #efefef; font-weight: 700; }
  ul, ol { margin: 6px 0 14px 1.5cm; padding: 0; }
  li { margin-bottom: 6px; text-align: justify; text-indent: 0; }
  .refs p {
    text-align: left;
    text-indent: -1.27cm;
    padding-left: 1.27cm;
    margin: 0 0 12px;
    line-height: 2;
  }
  .step {
    margin: 10px 0 14px;
    padding: 10px 12px;
    border: 1px solid #ccc;
    background: #fafafa;
    page-break-inside: avoid;
    line-height: 1.45;
  }
  .step strong { display: block; margin-bottom: 4px; }
  .step p { text-indent: 0; margin: 0 0 6px; }
  .note {
    border-left: 3px solid #555;
    padding: 8px 12px;
    margin: 12px 0 16px;
    background: #f7f7f7;
    font-size: 11pt;
    line-height: 1.45;
  }
  .note p { text-indent: 0; margin: 0; }
  code, pre {
    font-family: Consolas, "Courier New", monospace;
    font-size: 10pt;
    background: #f3f3f3;
  }
  pre {
    padding: 10px 12px;
    border: 1px solid #ccc;
    white-space: pre-wrap;
    margin: 10px 0 14px;
    line-height: 1.4;
    text-indent: 0;
  }
  .toc { page-break-after: always; line-height: 1.8; }
  .toc p { text-indent: 0; margin: 0 0 4px; }
  .fig-cap {
    font-size: 11pt;
    font-style: italic;
    text-align: center;
    text-indent: 0;
    margin: 8px 0 16px;
    line-height: 1.4;
  }
</style>
</head>
<body>
<div class="page">

<section class="cover">
  <div>
    <p class="sub"><strong>Servicio Nacional de Aprendizaje — SENA</strong></p>
    <p class="sub">Formación profesional integral</p>
    <p class="sub">Tecnólogo en Análisis y Desarrollo de Software</p>
  </div>
  <div>
    <h1>Realización de pruebas de funcionalidad del software</h1>
    <p class="sub">Investigación y guía práctica para verificar un sitio web publicado en internet (dominio, hosting y navegadores)</p>
    <p class="code"><strong>Código de evidencia:</strong> GA10-220501097-AA7-EV01</p>
    <p class="code"><strong>Formato asociado:</strong> GFPI-F-135 V01</p>
  </div>
  <div class="footer-cover">
    <p>Informe de investigación y procedimiento paso a paso</p>
    <p>Septiembre de 2026</p>
  </div>
</section>

<section class="toc">
  <h2 style="text-align:center;border:none;">Tabla de contenido</h2>
  <p>1. Introducción ................................................................................................ 3</p>
  <p>2. Objetivo general y específicos ...................................................................... 3</p>
  <p>3. Marco conceptual ...................................................................................... 4</p>
  <p>4. Cómo verificar si un dominio está bien configurado ..................................... 5</p>
  <p>5. ¿Una aplicación web se ve igual en todos los exploradores? ......................... 7</p>
  <p>6. Cómo se ve una aplicación web en el celular ................................................ 8</p>
  <p>7. Elementos que se deben probar en una aplicación web ................................ 9</p>
  <p>8. Procedimiento paso a paso: instalación, despliegue y pruebas .................... 11</p>
  <p>9. Checklist de verificación final ..................................................................... 15</p>
  <p>10. Conclusiones ............................................................................................ 16</p>
  <p>11. Referencias ............................................................................................... 17</p>
</section>

<h1 class="run">Realización de pruebas de funcionalidad del software publicado en internet</h1>

<h2>1. Introducción</h2>
<p>
Publicar una aplicación web no termina cuando el código “funciona” en el computador del desarrollador.
En internet intervienen el <strong>nombre de dominio</strong>, los registros DNS, el certificado TLS/HTTPS, el
servicio de <strong>hosting</strong>, la red del usuario y la diversidad de <strong>navegadores</strong> y dispositivos.
Por ello, las pruebas de funcionalidad de un sitio desplegado deben evaluar tanto el comportamiento
de la aplicación como la calidad del entorno de publicación.
</p>
<p>
La evidencia GA10-220501097-AA7-EV01 orienta a profundizar en pruebas de servicios desplegados
mediante plataformas de dominio y de hosting de uso común. Este documento condensa una
investigación práctica —con fuentes técnicas y bibliográficas— sobre <em>cómo se deberían realizar
las pruebas de funcionalidad de un sitio publicado en internet</em>, responde las preguntas guía de la
actividad y entrega un procedimiento paso a paso para instalar la plataforma, desplegar un producto
de prueba y verificarlo.
</p>

<h2>2. Objetivo general y específicos</h2>
<h3>2.1. Objetivo general</h3>
<p>
Establecer un enfoque ordenado para realizar pruebas de funcionalidad de un sitio web publicado
en internet, integrando verificación de dominio/hosting, compatibilidad entre navegadores,
experiencia móvil y checklist de elementos funcionales.
</p>
<h3>2.2. Objetivos específicos</h3>
<ol>
  <li>Explicar cómo comprobar que un dominio está correctamente configurado (DNS, resolución, HTTPS y redirecciones).</li>
  <li>Analizar por qué una misma aplicación puede verse o comportarse distinto entre navegadores.</li>
  <li>Describir cómo evaluar la aplicación en navegadores de celular y qué aspectos priorizar.</li>
  <li>Identificar los elementos mínimos que deben probarse en una aplicación web publicada.</li>
  <li>Documentar un paso a paso de instalación de plataforma, despliegue y ejecución de pruebas.</li>
</ol>

<h2>3. Marco conceptual</h2>
<p>
Las <strong>pruebas de funcionalidad</strong> verifican que el sistema hace lo que se espera según requisitos:
iniciar sesión, listar productos, guardar datos, navegar entre páginas, enviar formularios, etc.
En un entorno publicado, esas pruebas deben ejecutarse contra la URL real (o de staging) y no solo
contra <code>localhost</code>, porque fallos de DNS, HTTPS, CORS, variables de entorno o rutas absolutas
aparecen únicamente en producción (ISTQB, 2018; Pressman &amp; Maxim, 2015).
</p>
<p>
Un <strong>dominio</strong> es un nombre legible (por ejemplo, <code>yoguraso.com</code>) que, mediante DNS, se asocia a
direcciones IP o a servicios de hosting. El <strong>hosting</strong> es el servicio que aloja archivos, procesos
y bases de datos. La combinación dominio + hosting + certificado digital es la base de un sitio
accesible de forma segura por HTTPS (Mozilla Developer Network [MDN], 2024).
</p>
<p>
Además, la <strong>compatibilidad multi-navegador</strong> y el <strong>diseño responsivo</strong> forman parte de la calidad
percibida: el usuario final no prueba “en Chrome del desarrollador”, sino en el dispositivo que tiene
a mano. Por eso, un plan de pruebas funcional publicado debe incluir al menos escritorio y móvil,
más de un motor de renderizado y validaciones de red (latencia, errores 4xx/5xx).
</p>

<div class="note">
  <p><strong>Nota metodológica.</strong> Se recomienda un entorno de <em>staging</em> (copia casi idéntica a producción)
  para no romper el sitio público. Si solo hay producción, las pruebas deben ser no destructivas
  (cuentas de prueba, datos ficticios y horarios de bajo tráfico).</p>
</div>

<h2>4. ¿Cómo verificar si un dominio está bien configurado?</h2>
<p>
Verificar un dominio no es solo “abrir la página”. Hay que comprobar la cadena completa:
compra/registro del dominio → DNS → apuntado al hosting → respuesta HTTP(S) correcta →
certificado válido → redirecciones coherentes.
</p>

<h3>4.1. Checklist técnico de dominio y DNS</h3>
<table>
  <thead>
    <tr>
      <th>Verificación</th>
      <th>Qué se espera</th>
      <th>Herramienta / método</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Resolución DNS (A / AAAA / CNAME)</td>
      <td>El nombre resuelve a la IP o al alias correcto del hosting</td>
      <td><code>nslookup</code>, <code>dig</code>, panel DNS del registrador</td>
    </tr>
    <tr>
      <td>Propagación</td>
      <td>Los cambios DNS ya son visibles en distintos resolvers</td>
      <td>WhatsMyDNS, DNS Checker</td>
    </tr>
    <tr>
      <td>www y apex (raíz)</td>
      <td><code>dominio.com</code> y <code>www.dominio.com</code> apuntan y redirigen de forma consistente</td>
      <td>Navegador + redirección 301</td>
    </tr>
    <tr>
      <td>HTTPS / TLS</td>
      <td>Certificado válido, no caducado, cadena completa, sin avisos de seguridad</td>
      <td>Candado del navegador, SSL Labs</td>
    </tr>
    <tr>
      <td>HTTP → HTTPS</td>
      <td>El tráfico inseguro redirige a HTTPS</td>
      <td>Abrir <code>http://...</code> y observar 301/302</td>
    </tr>
    <tr>
      <td>Correo del dominio (opcional)</td>
      <td>Registros MX / SPF / DKIM si el sitio envía correo</td>
      <td>Panel DNS + pruebas de envío</td>
    </tr>
    <tr>
      <td>Tiempo de respuesta</td>
      <td>El sitio carga sin errores DNS ni timeouts prolongados</td>
      <td>DevTools Network, ping/curl</td>
    </tr>
  </tbody>
</table>

<h3>4.2. Pruebas prácticas recomendadas</h3>
<ol>
  <li>Desde otra red (datos móviles o red distinta a la del hosting), abrir la URL pública.</li>
  <li>Confirmar código de estado 200 en la home y en rutas críticas (<code>/productos</code>, <code>/login</code>, API).</li>
  <li>Revisar que no existan recursos mixtos (HTTP dentro de página HTTPS), que bloquean estilos o scripts.</li>
  <li>Validar que el certificado coincida con el nombre del dominio (SAN/CN correctos).</li>
  <li>Documentar capturas: DNS, candado HTTPS, redirección www y respuesta del servidor.</li>
</ol>

<pre>Ejemplos de comandos útiles (Windows / Linux):
nslookup midominio.com
curl -I https://midominio.com
curl -I http://midominio.com</pre>

<p>
Si el DNS está mal, el navegador muestra errores del tipo “No se puede acceder a este sitio” o
resuelve a un hosting antiguo. Si el DNS está bien pero el hosting falla, el dominio resuelve y
aún así aparecen 502/503. Diferenciar ambos fallos es parte de la prueba de publicación
(MDN, 2024; Internet Corporation for Assigned Names and Numbers [ICANN], 2023).
</p>

<h2>5. ¿Una aplicación web se ve igual en todos los exploradores web?</h2>
<p>
<strong>No.</strong> Aunque HTML5/CSS3 y JavaScript modernos han reducido diferencias, los navegadores
implementan motores distintos (Blink en Chrome/Edge, Gecko en Firefox, WebKit en Safari) y
pueden interpretar estilos, APIs y formularios con pequeñas o grandes variaciones (W3C, 2023;
MDN, 2024).
</p>
<p>
Las causas más frecuentes de inconsistencia son:
</p>
<ul>
  <li>CSS experimental o prefijos incompletos.</li>
  <li>Fuentes tipográficas que no cargan y caen a una fuente del sistema distinta.</li>
  <li>APIs no soportadas (por ejemplo, ciertas funciones de almacenamiento, notificaciones o media).</li>
  <li>Extensiones del usuario (bloqueadores) que alteran la página.</li>
  <li>Modo oscuro automático, zoom, o escala de tipografía del sistema operativo.</li>
  <li>Versiones antiguas del navegador en equipos de usuarios finales.</li>
</ul>

<h3>5.1. Estrategia de prueba multi-navegador</h3>
<table>
  <thead>
    <tr>
      <th>Prioridad</th>
      <th>Navegador</th>
      <th>Por qué incluirlo</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Alta</td>
      <td>Google Chrome (última estable)</td>
      <td>Alta cuota de mercado en escritorio y Android</td>
    </tr>
    <tr>
      <td>Alta</td>
      <td>Microsoft Edge</td>
      <td>Muy usado en entornos Windows corporativos/educativos</td>
    </tr>
    <tr>
      <td>Alta</td>
      <td>Mozilla Firefox</td>
      <td>Motor Gecko; detecta fallos no visibles en Chromium</td>
    </tr>
    <tr>
      <td>Media/Alta</td>
      <td>Safari (si hay usuarios iOS/macOS)</td>
      <td>WebKit; reglas estrictas de cookies, video y CSS</td>
    </tr>
  </tbody>
</table>

<p>
Para cada navegador se deben repetir los flujos críticos (happy path): cargar inicio, navegar al
catálogo, iniciar sesión, agregar al carrito, abrir perfil/admin según rol. Se registra: layout,
errores de consola, peticiones fallidas y capturas. Herramientas útiles: DevTools, BrowserStack/LambdaTest
(opcional) y pruebas automatizadas con Playwright/Cypress (Google Chrome Developers, 2024).
</p>

<h2>6. ¿Cómo se ve una aplicación web en un explorador del celular?</h2>
<p>
En el celular la aplicación se renderiza en un viewport estrecho, con interacción táctil, teclado
virtual, posibles barras del navegador que cambian la altura útil y, con frecuencia, redes más
lentas o inestables. “Verse bien” implica diseño <strong>responsivo</strong>: tipografía legible, botones
alcanzables con el pulgar, menús colapsables, imágenes adaptadas y formularios usables
(Google, 2024; Nielsen Norman Group, 2020).
</p>

<h3>6.1. Formas de probar en móvil</h3>
<ol>
  <li><strong>Dispositivo real:</strong> abrir la URL pública en Chrome Android / Safari iOS. Es la prueba más fiel.</li>
  <li><strong>Emulación en DevTools:</strong> modo dispositivo (iPhone/Pixel) para layouts rápidos; no sustituye del todo al hardware real.</li>
  <li><strong>Orientación:</strong> probar vertical y horizontal.</li>
  <li><strong>Gestos:</strong> scroll, tap, zoom; evitar hover como única forma de descubrir acciones.</li>
  <li><strong>Rendimiento:</strong> tiempo de carga con 3G/4G simulada; peso de imágenes y JS.</li>
</ol>

<h3>6.2. Criterios de aceptación móvil (ejemplo)</h3>
<ul>
  <li>El menú hamburguesa abre/cierra y permite llegar a Productos, Contacto y cuenta.</li>
  <li>Los botones principales miden al menos ~44px de área táctil recomendada.</li>
  <li>No hay scroll horizontal indeseado ni textos cortados.</li>
  <li>El carrito/bolsa y formularios de login son usables sin “pellizcar” para leer.</li>
  <li>Las imágenes de producto no desbordan ni tapan controles.</li>
</ul>

<p class="fig-cap">Tabla conceptual: el celular no es “una versión pequeña del PC”; es otro contexto de uso que debe probarse explícitamente.</p>

<h2>7. ¿Qué elementos se deben probar en una aplicación web?</h2>
<p>
En un sitio e-commerce o similar (catálogo, autenticación, carrito, panel admin), conviene organizar
las pruebas por capas: interfaz, lógica de negocio, integración con API/BD y publicación.
</p>

<h3>7.1. Elementos funcionales prioritarios</h3>
<table>
  <thead>
    <tr>
      <th>Área</th>
      <th>Elementos a probar</th>
      <th>Resultado esperado</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Navegación</td>
      <td>Header, menú, enlaces, logo, 404</td>
      <td>Rutas correctas; header consistente en todas las páginas</td>
    </tr>
    <tr>
      <td>Autenticación</td>
      <td>Registro, login, logout, recuperación de clave</td>
      <td>Acceso válido; rechazo de credenciales incorrectas; sesión coherente</td>
    </tr>
    <tr>
      <td>Autorización</td>
      <td>Rutas de admin vs cliente</td>
      <td>Usuario no admin no entra al panel; admin sí</td>
    </tr>
    <tr>
      <td>Catálogo</td>
      <td>Listado, detalle, precios, stock, imágenes, letreros</td>
      <td>Datos visibles y coherentes con backend</td>
    </tr>
    <tr>
      <td>Carrito</td>
      <td>Agregar, sumar/restar, vaciar, total, persistencia</td>
      <td>Cantidades y totales correctos; se mantiene al recargar si aplica</td>
    </tr>
    <tr>
      <td>Formularios</td>
      <td>Validaciones, mensajes de error, UX</td>
      <td>No acepta datos inválidos; feedback claro</td>
    </tr>
    <tr>
      <td>API / red</td>
      <td>Códigos HTTP, CORS, JWT, timeouts</td>
      <td>Respuestas esperadas; errores controlados</td>
    </tr>
    <tr>
      <td>Publicación</td>
      <td>DNS, HTTPS, www, assets estáticos</td>
      <td>Sitio seguro y alcanzable desde internet</td>
    </tr>
    <tr>
      <td>No funcionales básicos</td>
      <td>Tiempo de carga, usabilidad móvil, accesibilidad mínima</td>
      <td>Uso aceptable en condiciones reales</td>
    </tr>
  </tbody>
</table>

<h3>7.2. Tipos de prueba relacionados</h3>
<ul>
  <li><strong>Pruebas de humo (smoke):</strong> ¿el sitio abre y los flujos críticos no están rotos?</li>
  <li><strong>Pruebas de regresión:</strong> tras un cambio, ¿sigue funcionando lo anterior?</li>
  <li><strong>Pruebas de compatibilidad:</strong> navegadores y dispositivos.</li>
  <li><strong>Pruebas de aceptación:</strong> el producto cumple lo pedido por el usuario/negocio.</li>
</ul>

<h2>8. Procedimiento paso a paso: instalación de plataforma, despliegue y pruebas</h2>
<p class="no-indent">
A continuación se propone un procedimiento reproducible, aplicable a un producto de prueba
(por ejemplo, una tienda web como YogurASO) desplegado en hosting compartido, VPS o plataforma PaaS.
Adáptense nombres de dominio, rutas y comandos al caso real del aprendiz.
</p>

<h3>8.1. Requisitos previos</h3>
<ul>
  <li>Computador con acceso a internet.</li>
  <li>Cuenta en un registrador de dominios (Namecheap, GoDaddy, Google Domains/Squarespace, etc.).</li>
  <li>Cuenta de hosting o plataforma de despliegue (cPanel, Hostinger, Railway, Render, Vercel + backend, VPS Ubuntu, etc.).</li>
  <li>Node.js LTS y Git instalados (si el backend es Node/Express).</li>
  <li>Navegadores Chrome, Edge y Firefox; un celular Android o iPhone.</li>
  <li>Editor de código (Visual Studio Code).</li>
</ul>

<h3>8.2. Paso a paso — preparación local del producto de prueba</h3>
<div class="step">
  <strong>Paso 1. Obtener el código fuente</strong>
  <p>Clonar o copiar el proyecto en el equipo. Verificar estructura típica: <code>frontend/</code>, <code>backend/</code>, <code>database/</code>.</p>
</div>
<div class="step">
  <strong>Paso 2. Instalar dependencias del backend</strong>
  <p>En la carpeta del API: <code>npm install</code>. Crear archivo <code>.env</code> a partir de <code>.env.example</code> (puerto, URL de BD, JWT, correo).</p>
</div>
<div class="step">
  <strong>Paso 3. Preparar la base de datos</strong>
  <p>Crear la base en PostgreSQL/MySQL según el proyecto. Ejecutar el script <code>schema.sql</code> o migraciones. Verificar conexión con un script de salud o login de prueba.</p>
</div>
<div class="step">
  <strong>Paso 4. Arrancar en local y smoke test</strong>
  <p>Levantar backend y servir el frontend (Live Server, Nginx local o el propio Express). Probar home, productos, login y carrito antes de publicar.</p>
</div>

<h3>8.3. Paso a paso — dominio y hosting</h3>
<div class="step">
  <strong>Paso 5. Registrar o asignar el dominio</strong>
  <p>En el panel del proveedor, confirmar que el dominio está activo. Anotar nameservers o zona DNS editable.</p>
</div>
<div class="step">
  <strong>Paso 6. Crear el sitio / servicio en el hosting</strong>
  <p>Crear la aplicación web o VPS. Subir frontend (HTML/CSS/JS) y desplegar backend (Node como servicio, PM2, o plataforma PaaS). Configurar variables de entorno de producción.</p>
</div>
<div class="step">
  <strong>Paso 7. Configurar DNS</strong>
  <p>Crear registro <strong>A</strong> (IP del servidor) o <strong>CNAME</strong> hacia el host indicado por la plataforma. Configurar también <code>www</code> si aplica. Esperar propagación (minutos a 48 h).</p>
</div>
<div class="step">
  <strong>Paso 8. Activar HTTPS</strong>
  <p>Emitir certificado (Let’s Encrypt / automático del hosting). Forzar redirección HTTP→HTTPS. Probar el candado en el navegador.</p>
</div>
<div class="step">
  <strong>Paso 9. Ajustar CORS y URLs de API</strong>
  <p>En el frontend, la URL base del API debe apuntar al dominio/backend público (no a localhost). En el backend, permitir el origen del frontend publicado.</p>
</div>

<h3>8.4. Paso a paso — ejecución de pruebas de funcionalidad en internet</h3>
<div class="step">
  <strong>Paso 10. Prueba de dominio</strong>
  <p>Ejecutar <code>nslookup</code> / comprobar panel DNS. Abrir la URL desde otra red. Documentar captura de resolución y HTTPS.</p>
</div>
<div class="step">
  <strong>Paso 11. Prueba funcional de humo en producción</strong>
  <p>Recorrer: Inicio → Productos → Login/Registro → Carrito → Perfil/Admin (con usuario de prueba). Registrar PASS/FAIL.</p>
</div>
<div class="step">
  <strong>Paso 12. Prueba multi-navegador</strong>
  <p>Repetir el recorrido en Chrome, Edge y Firefox. Anotar diferencias de UI o errores de consola.</p>
</div>
<div class="step">
  <strong>Paso 13. Prueba en celular</strong>
  <p>Abrir el sitio en el navegador móvil. Verificar menú, formularios, carrito y legibilidad. Tomar capturas en vertical.</p>
</div>
<div class="step">
  <strong>Paso 14. Prueba de API publicada</strong>
  <p>Con DevTools o Postman/Insomnia, llamar endpoints públicos/protegidos. Verificar códigos 200/401/403 y latencia razonable.</p>
</div>
<div class="step">
  <strong>Paso 15. Cierre y evidencias</strong>
  <p>Completar matriz de casos (ID, pasos, esperado, obtenido, estado). Adjuntar capturas de DNS, HTTPS, desktop y móvil. Redactar hallazgos y acciones correctivas.</p>
</div>

<h3>8.5. Ejemplo de matriz breve de casos</h3>
<table>
  <thead>
    <tr>
      <th>ID</th>
      <th>Caso</th>
      <th>Pasos</th>
      <th>Esperado</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>TF-01</td>
      <td>Resolución del dominio</td>
      <td>Consultar DNS y abrir URL</td>
      <td>Resuelve e inicia carga HTTPS</td>
    </tr>
    <tr>
      <td>TF-02</td>
      <td>Home pública</td>
      <td>Abrir /</td>
      <td>HTTP 200; marca y menú visibles</td>
    </tr>
    <tr>
      <td>TF-03</td>
      <td>Catálogo</td>
      <td>Ir a Productos</td>
      <td>Lista productos desde API</td>
    </tr>
    <tr>
      <td>TF-04</td>
      <td>Login válido</td>
      <td>Credenciales de prueba</td>
      <td>Sesión iniciada; acceso a perfil</td>
    </tr>
    <tr>
      <td>TF-05</td>
      <td>Login inválido</td>
      <td>Clave incorrecta</td>
      <td>Mensaje de error; sin sesión</td>
    </tr>
    <tr>
      <td>TF-06</td>
      <td>Carrito</td>
      <td>Agregar ítem y abrir bolsa</td>
      <td>Ítem y total correctos</td>
    </tr>
    <tr>
      <td>TF-07</td>
      <td>Chrome vs Firefox</td>
      <td>Mismo flujo en ambos</td>
      <td>Sin roturas funcionales</td>
    </tr>
    <tr>
      <td>TF-08</td>
      <td>Vista móvil</td>
      <td>Abrir en celular</td>
      <td>Navegación usable; sin scroll horizontal</td>
    </tr>
  </tbody>
</table>

<h2>9. Checklist de verificación final</h2>
<ul>
  <li>☐ Dominio resuelve correctamente (A/CNAME).</li>
  <li>☐ HTTPS activo, certificado válido, redirección desde HTTP.</li>
  <li>☐ www y dominio raíz coherentes.</li>
  <li>☐ Frontend apunta al API de producción.</li>
  <li>☐ Flujos críticos PASS en al menos 2 navegadores de escritorio.</li>
  <li>☐ Flujos críticos PASS en un navegador móvil real.</li>
  <li>☐ Formularios validan entradas incorrectas.</li>
  <li>☐ Roles (cliente/admin) respetan permisos.</li>
  <li>☐ Errores 404 y mensajes de falla son comprensibles.</li>
  <li>☐ Evidencias (capturas + matriz) archivadas para la entrega.</li>
</ul>

<h2>10. Conclusiones</h2>
<p>
Las pruebas de funcionalidad de un sitio publicado en internet deben mirar más allá del código local:
incluyen la correcta configuración del <strong>dominio</strong> y el <strong>hosting</strong>, la seguridad de <strong>HTTPS</strong>,
la estabilidad de la integración frontend–backend en URLs públicas y la experiencia en
<strong>múltiples navegadores</strong> y en el <strong>celular</strong>. Una aplicación no se ve necesariamente igual en
todos los exploradores; por eso la estrategia de pruebas debe ser deliberada y documentada.
</p>
<p>
El procedimiento paso a paso propuesto —preparación local, despliegue, DNS/TLS, smoke test,
compatibilidad y evidencias— permite cumplir el propósito formativo de la evidencia
GA10-220501097-AA7-EV01 y, al mismo tiempo, adoptar una práctica profesional transferable a
cualquier producto web desplegado en plataformas de dominio y hosting de uso común.
</p>

<h2>11. Referencias</h2>
<div class="refs">
  <p>Google. (2024). <em>Mobile-friendly test and responsive design basics</em>. Google Search Central. https://developers.google.com/search/docs/appearance/responsive-web-design</p>
  <p>Google Chrome Developers. (2024). <em>DevTools and cross-browser testing guidance</em>. https://developer.chrome.com/docs/devtools</p>
  <p>International Software Testing Qualifications Board [ISTQB]. (2018). <em>Certified tester foundation level syllabus</em>. ISTQB.</p>
  <p>Internet Corporation for Assigned Names and Numbers [ICANN]. (2023). <em>Beginner’s guide to domain names</em>. https://www.icann.org</p>
  <p>Mozilla Developer Network [MDN]. (2024). <em>How the web works / DNS / HTTP / TLS</em>. https://developer.mozilla.org</p>
  <p>Nielsen Norman Group. (2020). <em>Mobile user experience: Limitations and strengths</em>. https://www.nngroup.com</p>
  <p>Pressman, R. S., &amp; Maxim, B. R. (2015). <em>Software engineering: A practitioner’s approach</em> (8.ª ed.). McGraw-Hill.</p>
  <p>Servicio Nacional de Aprendizaje [SENA]. (2024). <em>GFPI-F-135 V01 — Guía de aprendizaje</em>. Formación profesional integral.</p>
  <p>World Wide Web Consortium [W3C]. (2023). <em>Web standards and browser interoperability</em>. https://www.w3.org</p>
</div>

</div>
</body>
</html>`;
}

async function main() {
  const html = buildHtml();
  fs.writeFileSync(HTML_OUT, html, 'utf8');
  console.log('HTML:', HTML_OUT);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('file:///' + HTML_OUT.replace(/\\/g, '/'), { waitUntil: 'load' });
  await page.pdf({
    path: PDF_OUT,
    format: 'Letter',
    printBackground: true,
    margin: { top: '2.54cm', right: '2.54cm', bottom: '2.54cm', left: '2.54cm' },
  });
  await browser.close();
  console.log('PDF:', PDF_OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
