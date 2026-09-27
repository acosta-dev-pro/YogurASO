/**
 * PDF GA10-220501097-AA8-EV01
 * Plan de mantenimiento y soporte del software + cronograma
 * Referencia: ISO/IEC 14764 (mantenimiento de software)
 * Solo genera PDF en Descargas (HTML temporal se elimina).
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

const PDF_OUT = path.resolve(
  'C:/Users/acost/Downloads/GA10-220501097-AA8-EV01_Plan_Mantenimiento_Soporte.pdf'
);
const TMP_HTML = path.join(os.tmpdir(), 'GA10-AA8-EV01-tmp.html');

function buildHtml() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>GA10-220501097-AA8-EV01 — Plan de mantenimiento y soporte</title>
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
  .page { max-width: 16.5cm; margin: 0 auto; }
  .cover {
    min-height: 22cm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-align: center;
    border: 1px solid #222;
    padding: 48px 40px;
    page-break-after: always;
    line-height: 1.55;
  }
  .cover h1 {
    font-size: 15pt;
    text-transform: uppercase;
    margin: 24px 0 14px;
    line-height: 1.35;
  }
  .cover .sub { font-size: 12.5pt; margin: 7px 0; }
  .cover .code { font-size: 11pt; margin-top: 22px; }
  .cover .footer-cover { font-size: 12pt; padding-top: 36px; }
  h1.run {
    font-size: 12pt;
    text-align: center;
    font-weight: 700;
    margin: 0 0 22px;
  }
  h2 {
    font-size: 12pt;
    font-weight: 700;
    margin: 26px 0 10px;
    page-break-after: avoid;
  }
  h3 {
    font-size: 12pt;
    font-weight: 700;
    font-style: italic;
    margin: 18px 0 8px;
    page-break-after: avoid;
  }
  h4 {
    font-size: 12pt;
    font-weight: 700;
    margin: 14px 0 6px;
    page-break-after: avoid;
  }
  p { margin: 0 0 11px; text-align: justify; text-indent: 1.27cm; }
  p.no-indent { text-indent: 0; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0 16px;
    font-size: 10.5pt;
    line-height: 1.35;
    page-break-inside: avoid;
  }
  th, td {
    border: 1px solid #333;
    padding: 6px 7px;
    vertical-align: top;
    text-align: left;
  }
  th { background: #efefef; font-weight: 700; }
  ul, ol { margin: 4px 0 12px 1.4cm; padding: 0; }
  li { margin-bottom: 5px; text-align: justify; }
  .toc { page-break-after: always; line-height: 1.75; }
  .toc p { text-indent: 0; margin: 0 0 3px; }
  .refs p {
    text-align: left;
    text-indent: -1.27cm;
    padding-left: 1.27cm;
    margin: 0 0 11px;
  }
  .box {
    border: 1px solid #bbb;
    background: #fafafa;
    padding: 10px 12px;
    margin: 10px 0 14px;
    page-break-inside: avoid;
    line-height: 1.45;
  }
  .box p { text-indent: 0; margin: 0 0 6px; }
  .note {
    border-left: 3px solid #444;
    padding: 8px 12px;
    margin: 12px 0;
    background: #f6f6f6;
    font-size: 11pt;
    line-height: 1.45;
  }
  .note p { text-indent: 0; margin: 0; }
  code {
    font-family: Consolas, "Courier New", monospace;
    font-size: 10pt;
    background: #f2f2f2;
  }
  .small { font-size: 10.5pt; line-height: 1.4; }
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
    <h1>Plan de mantenimiento y soporte del software</h1>
    <p class="sub">Mantenimiento preventivo y correctivo según ISO/IEC 14764<br>
    Proyecto formativo: <strong>YogurASO</strong> (tienda web de yogurt artesanal)</p>
    <p class="code"><strong>Código de evidencia:</strong> GA10-220501097-AA8-EV01</p>
    <p class="code"><strong>Formato asociado:</strong> GFPI-F-135 V01</p>
  </div>
  <div class="footer-cover">
    <p>Documento técnico + cronograma de mantenimiento</p>
    <p>Septiembre de 2026</p>
  </div>
</section>

<section class="toc">
  <h2 style="text-align:center;">Tabla de contenido</h2>
  <p>1. Introducción</p>
  <p>2. Objetivos del plan</p>
  <p>3. Marco normativo: ISO/IEC 14764</p>
  <p>4. Tipos de mantenimiento (preventivo y correctivo)</p>
  <p>5. Descripción del sistema</p>
  <p>6. Proceso de implementación</p>
  <p>7. Análisis de modificación y problemas</p>
  <p>8. Implementación de la modificación</p>
  <p>9. Aceptación y revisión del mantenimiento</p>
  <p>10. Migración</p>
  <p>11. Retiro</p>
  <p>12. Plan operativo de soporte</p>
  <p>13. Cronograma de mantenimiento</p>
  <p>14. Roles, indicadores y riesgos</p>
  <p>15. Conclusiones</p>
  <p>16. Referencias</p>
  <p>Anexos</p>
</section>

<h1 class="run">Plan de mantenimiento y soporte del software — YogurASO</h1>

<h2>1. Introducción</h2>
<p>
El ciclo de vida de un producto software no termina con su puesta en producción. Una vez
desplegado, el sistema requiere actividades continuas de <strong>mantenimiento</strong> y <strong>soporte</strong> para
corregir defectos, prevenir fallos, adaptar el entorno y preservar la continuidad del negocio.
La evidencia GA10-220501097-AA8-EV01 solicita diseñar un plan y un cronograma de mantenimiento
para la solución formativa, considerando los tipos <strong>preventivo</strong> y <strong>correctivo</strong>, alineados con
el estándar internacional de mantenimiento de software.
</p>
<p>
Este documento toma como base el proyecto <strong>YogurASO</strong>: aplicación web de catálogo y pedidos de
yogurt artesanal (frontend estático, API Node.js/Express, PostgreSQL, autenticación JWT y panel
administrador). Se estructura según los procesos descritos en <strong>ISO/IEC 14764</strong>
<em>Software Engineering — Software Life Cycle Processes — Maintenance</em>, norma de referencia para
el mantenimiento de software. En algunas guías de aprendizaje aparece citada como “ISO 14724”;
el contenido técnico de los apartados solicitados (descripción del sistema, implementación,
análisis, modificación, aceptación, migración y retiro) corresponde a ISO/IEC 14764
(International Organization for Standardization [ISO], 2006/2018).
</p>

<h2>2. Objetivos del plan</h2>
<h3>2.1. Objetivo general</h3>
<p>
Definir un plan de mantenimiento preventivo y correctivo, junto con un cronograma operable, que
asegure la disponibilidad, seguridad y evolución controlada de YogurASO durante su vida útil.
</p>
<h3>2.2. Objetivos específicos</h3>
<ol>
  <li>Describir el sistema y sus componentes sujetos a mantenimiento.</li>
  <li>Establecer el proceso de implementación del mantenimiento según ISO/IEC 14764.</li>
  <li>Definir cómo se analizan problemas y solicitudes de modificación.</li>
  <li>Especificar la implementación, aceptación y revisión de cambios.</li>
  <li>Planear escenarios de migración y de retiro del software.</li>
  <li>Presentar un cronograma anual con actividades preventivas y correctivas.</li>
</ol>

<h2>3. Marco normativo: ISO/IEC 14764</h2>
<p>
ISO/IEC 14764 proporciona un marco para el proceso de mantenimiento de software dentro del ciclo
de vida. Sus elementos fundamentales incluyen: gestión del mantenimiento, comprensión del
producto, análisis de problemas y modificaciones, implementación del cambio, aceptación/revisión,
migración y retiro (ISO, 2006/2018; Institute of Electrical and Electronics Engineers [IEEE], 2006).
</p>
<div class="box">
  <p><strong>Elementos fundamentales aplicados en este plan</strong></p>
  <ul>
    <li>Descripción / comprensión del sistema a mantener.</li>
    <li>Proceso de implementación del mantenimiento.</li>
    <li>Análisis de modificación y problemas.</li>
    <li>Implementación de la modificación.</li>
    <li>Aceptación y revisión del mantenimiento.</li>
    <li>Migración (cambio de entorno, versión mayor o plataforma).</li>
    <li>Retiro (fin de soporte y desactivación controlada).</li>
  </ul>
</div>

<h2>4. Tipos de mantenimiento (preventivo y correctivo)</h2>
<p>
Aunque ISO/IEC 14764 reconoce también el mantenimiento adaptativo y perfectivo, la evidencia
exige enfocar el plan en <strong>preventivo</strong> y <strong>correctivo</strong>, que se definen así:
</p>
<table>
  <thead>
    <tr>
      <th>Tipo</th>
      <th>Definición</th>
      <th>Ejemplos en YogurASO</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Correctivo</strong></td>
      <td>Corregir fallos detectados después de la entrega (errores, defectos, incidentes).</td>
      <td>Login roto, API 500, carrito que no suma, imagen que no sube, CORS en producción.</td>
    </tr>
    <tr>
      <td><strong>Preventivo</strong></td>
      <td>Detectar y corregir fallos latentes antes de que ocurran en operación; reducir riesgo.</td>
      <td>Copias de seguridad, renovación TLS, actualización de dependencias, monitoreo de logs, pruebas de regresión programadas.</td>
    </tr>
  </tbody>
</table>
<p>
En la práctica, ambos tipos se ejecutan bajo el mismo proceso ISO (análisis → cambio → prueba →
aceptación), diferenciándose por el <em>origen del disparador</em>: incidente vs. actividad planificada
(Pressman &amp; Maxim, 2015; Sommerville, 2016).
</p>

<h2>5. Descripción del sistema</h2>
<h3>5.1. Propósito</h3>
<p>
YogurASO es una solución web para exhibir el catálogo de yogurt artesanal, permitir registro e
inicio de sesión de clientes, gestionar un carrito en el navegador y canalizar el pedido por
WhatsApp. El administrador gestiona inventario (CRUD de productos, letreros/promociones) y
usuarios.
</p>
<h3>5.2. Arquitectura lógica</h3>
<table>
  <thead>
    <tr>
      <th>Capa</th>
      <th>Tecnología</th>
      <th>Responsabilidad</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Frontend</td>
      <td>HTML, CSS, JavaScript (vanilla)</td>
      <td>UI: inicio, productos, login, registro, perfil, carrito, admin</td>
    </tr>
    <tr>
      <td>Backend / API</td>
      <td>Node.js + Express</td>
      <td>Auth JWT, productos, usuarios, uploads, salud del servicio</td>
    </tr>
    <tr>
      <td>Datos</td>
      <td>PostgreSQL</td>
      <td>Usuarios, productos, tokens de recuperación, metadatos</td>
    </tr>
    <tr>
      <td>Integraciones</td>
      <td>WhatsApp (enlace), SMTP/Gmail (opcional), Google Sign-In (opcional)</td>
      <td>Pedidos, correo de recuperación, autenticación social</td>
    </tr>
  </tbody>
</table>

<h3>5.3. Alcance del mantenimiento</h3>
<ul>
  <li>Código fuente del repositorio (frontend, backend, scripts SQL, pruebas).</li>
  <li>Configuración (<code>.env</code>, <code>config.js</code>, DNS, HTTPS, CORS).</li>
  <li>Base de datos (esquema, índices, respaldos, migraciones).</li>
  <li>Activos estáticos e imágenes en <code>uploads</code>.</li>
  <li>Documentación operativa y de usuario básico.</li>
</ul>

<h3>5.4. Fuera de alcance (inicial)</h3>
<ul>
  <li>Pasarela de pagos en línea (no forma parte del MVP).</li>
  <li>Aplicación nativa móvil (se mantiene web responsiva).</li>
  <li>Infraestructura de terceros no controlada (cambios unilaterales de WhatsApp/Google).</li>
</ul>

<h2>6. Proceso de implementación</h2>
<p>
El proceso de implementación del mantenimiento establece <em>cómo</em> se organiza el trabajo desde que
surge una necesidad hasta que el cambio queda en producción de forma controlada.
</p>

<h3>6.1. Fases del proceso (ISO/IEC 14764 aplicadas)</h3>
<ol>
  <li><strong>Recepción / identificación:</strong> ticket, reporte de usuario, alerta de monitoreo o tarea preventiva del cronograma.</li>
  <li><strong>Clasificación:</strong> preventivo o correctivo; severidad (crítica, alta, media, baja).</li>
  <li><strong>Análisis:</strong> reproducir, impactar componentes, estimar esfuerzo y riesgo (sección 7).</li>
  <li><strong>Aprobación:</strong> el responsable técnico autoriza el cambio según impacto.</li>
  <li><strong>Implementación:</strong> desarrollo en rama, pruebas locales y en staging (sección 8).</li>
  <li><strong>Aceptación y revisión:</strong> checklist, despliegue, verificación post-release (sección 9).</li>
  <li><strong>Cierre y registro:</strong> documentar en bitácora de mantenimiento; actualizar cronograma si aplica.</li>
</ol>

<h3>6.2. Entornos</h3>
<table>
  <thead>
    <tr>
      <th>Entorno</th>
      <th>Uso en mantenimiento</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Desarrollo (local)</td>
      <td>Corrección y pruebas unitarias/manuales del desarrollador</td>
    </tr>
    <tr>
      <td>Pruebas / staging</td>
      <td>Validación antes de producción (misma pila: Node + Postgres)</td>
    </tr>
    <tr>
      <td>Producción</td>
      <td>Solo cambios aceptados; ventana de despliegue preferible en baja demanda</td>
    </tr>
  </tbody>
</table>

<h3>6.3. Herramientas de soporte al proceso</h3>
<ul>
  <li>Control de versiones: Git (ramas <code>fix/</code>, <code>chore/</code>, etiquetas de release).</li>
  <li>Seguimiento: hoja de incidencias o tablero (ID, tipo, estado, responsable).</li>
  <li>Pruebas: checklist manual + Playwright para regresiones críticas.</li>
  <li>Monitoreo básico: endpoint <code>/api/health</code>, logs del servidor, uptime del hosting.</li>
</ul>

<h2>7. Análisis de modificación y problemas</h2>
<p>
El análisis determina si un problema o solicitud debe convertirse en modificación, qué partes
del sistema afectan y con qué prioridad se atiende.
</p>

<h3>7.1. Entradas del análisis</h3>
<ul>
  <li>Reporte de error (pasos, capturas, navegador/dispositivo, usuario).</li>
  <li>Logs del backend y consola del navegador.</li>
  <li>Resultados de pruebas fallidas o de humo en producción.</li>
  <li>Alertas preventivas (certificado por vencer, disco, dependencias vulnerables).</li>
</ul>

<h3>7.2. Criterios de severidad (correctivo)</h3>
<table>
  <thead>
    <tr>
      <th>Severidad</th>
      <th>Criterio</th>
      <th>Tiempo objetivo de respuesta</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Crítica</td>
      <td>Sitio caído, BD inaccesible, filtración o fallo total de login</td>
      <td>≤ 4 horas</td>
    </tr>
    <tr>
      <td>Alta</td>
      <td>Función de negocio rota (catálogo vacío, checkout WhatsApp, admin inutilizable)</td>
      <td>≤ 1 día hábil</td>
    </tr>
    <tr>
      <td>Media</td>
      <td>Error parcial con alternativa (un formulario, un filtro)</td>
      <td>≤ 3 días hábiles</td>
    </tr>
    <tr>
      <td>Baja</td>
      <td>Defectos estéticos o menores sin bloqueo</td>
      <td>Próxima ventana preventiva</td>
    </tr>
  </tbody>
</table>

<h3>7.3. Análisis de impacto</h3>
<p>
Para cada modificación se evalúa: módulos afectados (auth, productos, carrito, admin, correo),
necesidad de migración SQL, compatibilidad de navegadores, y si requiere ventana de mantenimiento.
Se documenta en una ficha breve (Anexo A).
</p>

<h3>7.4. Problemas típicos previstos en YogurASO</h3>
<ul>
  <li>Desalineación de <code>API_URL</code> tras un cambio de hosting.</li>
  <li>Caducidad de JWT_SECRET o tokens de correo.</li>
  <li>Fallo de SMTP Gmail (credenciales de aplicación).</li>
  <li>Inconsistencias de UTF-8 / assets / caché del navegador.</li>
  <li>Regresiones de UI en header, carrito o panel admin entre páginas.</li>
  <li>Pérdida de espacio en disco por imágenes en <code>uploads</code>.</li>
</ul>

<h2>8. Implementación de la modificación</h2>
<h3>8.1. Procedimiento técnico</h3>
<ol>
  <li>Crear rama desde la versión estable etiquetada.</li>
  <li>Reproducir el defecto (correctivo) o preparar el cambio planificado (preventivo).</li>
  <li>Aplicar el cambio mínimo necesario; actualizar pruebas si aplica.</li>
  <li>Ejecutar checklist de regresión: home, productos, login, carrito, perfil/admin.</li>
  <li>Generar respaldo de BD y de <code>.env</code> antes de desplegar a producción.</li>
  <li>Desplegar, verificar <code>/api/health</code> y flujos críticos en la URL pública.</li>
  <li>Si falla, ejecutar plan de rollback (restaurar release anterior + backup).</li>
</ol>

<h3>8.2. Controles de calidad previos al despliegue</h3>
<table>
  <thead>
    <tr>
      <th>Control</th>
      <th>Evidencia</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Código revisado / autocontrol</td>
      <td>Diff en Git; comentarios en el ticket</td>
    </tr>
    <tr>
      <td>Prueba funcional del caso</td>
      <td>PASS del escenario que motivó el cambio</td>
    </tr>
    <tr>
      <td>Prueba de regresión corta</td>
      <td>Checklist o suite Playwright</td>
    </tr>
    <tr>
      <td>Seguridad básica</td>
      <td>No exponer secretos; validar auth en rutas admin</td>
    </tr>
  </tbody>
</table>

<h3>8.3. Implementación preventiva recurrente</h3>
<ul>
  <li>Actualización controlada de dependencias npm (mensual).</li>
  <li>Revisión de logs y limpieza de uploads huérfanos (quincenal).</li>
  <li>Verificación de backups restaurables (mensual).</li>
  <li>Revisión de certificado TLS y DNS (trimestral).</li>
</ul>

<h2>9. Aceptación y revisión del mantenimiento</h2>
<p>
La aceptación confirma que la modificación cumple el objetivo sin degradar el sistema. La revisión
evalúa el proceso para mejorar futuros mantenimientos (lecciones aprendidas).
</p>

<h3>9.1. Criterios de aceptación</h3>
<ul>
  <li>El incidente queda resuelto o la tarea preventiva se completó según alcance.</li>
  <li>No se introdujeron regresiones en flujos críticos.</li>
  <li>Documentación y bitácora actualizadas (fecha, responsable, versión).</li>
  <li>Stakeholders de prueba (aprendiz / tutor / dueño del negocio formativo) dan visto bueno cuando el cambio es visible al usuario.</li>
</ul>

<h3>9.2. Revisión post-mantenimiento</h3>
<div class="box">
  <p>Preguntas de revisión (cada cierre de cambio mayor o cada mes):</p>
  <ul>
    <li>¿La causa raíz quedó identificada?</li>
    <li>¿Se puede prevenir con monitoreo o prueba automática?</li>
    <li>¿El tiempo de resolución respetó el SLA interno?</li>
    <li>¿Hay deuda técnica pendiente de agendar?</li>
  </ul>
</div>

<h2>10. Migración</h2>
<p>
La migración es el traslado del producto a un nuevo entorno operativo, versión mayor de plataforma
o infraestructura, preservando datos y continuidad del servicio (ISO, 2006/2018).
</p>

<h3>10.1. Escenarios de migración previstos</h3>
<ul>
  <li>Cambio de hosting (local → VPS/PaaS) o de dominio.</li>
  <li>Actualización mayor de Node.js o PostgreSQL.</li>
  <li>Reorganización del esquema SQL (nuevas columnas, índices, soft-delete, auth Google).</li>
  <li>Cambio de proveedor de correo o de almacenamiento de imágenes.</li>
</ul>

<h3>10.2. Procedimiento de migración</h3>
<ol>
  <li>Inventario de activos: código, BD, uploads, secretos, DNS.</li>
  <li>Plan de ventana y comunicación a usuarios de prueba.</li>
  <li>Backup completo y prueba de restauración en entorno espejo.</li>
  <li>Ejecutar scripts de migración SQL versionados.</li>
  <li>Desplegar nueva plataforma; actualizar DNS/HTTPS y <code>API_URL</code>.</li>
  <li>Validar humo en producción; mantener rollback listo 48–72 h.</li>
  <li>Cerrar migración con acta breve (Anexo B).</li>
</ol>

<h2>11. Retiro</h2>
<p>
El retiro es la retirada controlada del software cuando deja de ser útil, es reemplazado o ya no
puede mantenerse con seguridad. Incluye archivo de datos, desactivación de servicios y
comunicación (ISO, 2006/2018).
</p>

<h3>11.1. Condiciones que pueden disparar el retiro</h3>
<ul>
  <li>Fin del proyecto formativo o reemplazo por otra solución.</li>
  <li>Costos de hosting injustificables o riesgos de seguridad no mitigables.</li>
  <li>Decisión explícita del responsable del producto.</li>
</ul>

<h3>11.2. Procedimiento de retiro</h3>
<ol>
  <li>Anunciar fecha de apagado (con antelación razonable).</li>
  <li>Exportar datos relevantes (usuarios/productos) y archivar backups cifrados.</li>
  <li>Desactivar DNS, certificados, procesos Node y base de datos.</li>
  <li>Revocar credenciales (JWT secret, SMTP, Google OAuth, accesos admin).</li>
  <li>Conservar código en repositorio etiquetado <code>retired-YYYYMMDD</code>.</li>
  <li>Elaborar acta de retiro (Anexo C).</li>
</ol>

<h2>12. Plan operativo de soporte</h2>
<h3>12.1. Canales de soporte</h3>
<table>
  <thead>
    <tr>
      <th>Canal</th>
      <th>Uso</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Correo / ticket interno</td>
      <td>Reporte formal de incidencias</td>
    </tr>
    <tr>
      <td>WhatsApp del negocio</td>
      <td>Soporte de pedidos (no técnico profundo)</td>
    </tr>
    <tr>
      <td>Bitácora del repositorio</td>
      <td>Registro técnico de cambios</td>
    </tr>
  </tbody>
</table>

<h3>12.2. Niveles de soporte</h3>
<ul>
  <li><strong>N1:</strong> orientación de uso (login, carrito, pedido WhatsApp).</li>
  <li><strong>N2:</strong> diagnóstico técnico (logs, configuración, reproducción).</li>
  <li><strong>N3:</strong> cambio de código, migración SQL o infraestructura.</li>
</ul>

<h2>13. Cronograma de mantenimiento</h2>
<p class="no-indent">
El cronograma combina actividades <strong>preventivas</strong> (calendario fijo) y capacidad reservada para
<strong>correctivas</strong> (bajo demanda). Horizonte: 12 meses a partir de octubre 2026.
</p>

<h3>13.1. Calendario anual (vista mensual)</h3>
<table>
  <thead>
    <tr>
      <th>Mes</th>
      <th>Actividades preventivas</th>
      <th>Ventana correctiva</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Oct 2026</td>
      <td>Baseline: inventario, backups iniciales, checklist de producción</td>
      <td>Reserva 8 h/sem</td>
    </tr>
    <tr>
      <td>Nov 2026</td>
      <td>Actualización dependencias; prueba regresión Playwright</td>
      <td>Reserva 6 h/sem</td>
    </tr>
    <tr>
      <td>Dic 2026</td>
      <td>Revisión TLS/DNS; auditoría de usuarios admin</td>
      <td>Reserva 6 h/sem</td>
    </tr>
    <tr>
      <td>Ene 2027</td>
      <td>Prueba de restauración de backup; limpieza uploads</td>
      <td>Reserva 6 h/sem</td>
    </tr>
    <tr>
      <td>Feb 2027</td>
      <td>Revisión de logs y rendimiento API; parches menores</td>
      <td>Reserva 6 h/sem</td>
    </tr>
    <tr>
      <td>Mar 2027</td>
      <td>Simulacro de incidente crítico (rollback)</td>
      <td>Reserva 8 h/sem</td>
    </tr>
    <tr>
      <td>Abr 2027</td>
      <td>Actualización dependencias; revisión correo SMTP</td>
      <td>Reserva 6 h/sem</td>
    </tr>
    <tr>
      <td>May 2027</td>
      <td>Pruebas multi-navegador y móvil</td>
      <td>Reserva 6 h/sem</td>
    </tr>
    <tr>
      <td>Jun 2027</td>
      <td>Revisión de seguridad (secretos, headers, roles)</td>
      <td>Reserva 6 h/sem</td>
    </tr>
    <tr>
      <td>Jul 2027</td>
      <td>Optimización BD (índices, vacuum/analyze según motor)</td>
      <td>Reserva 6 h/sem</td>
    </tr>
    <tr>
      <td>Ago 2027</td>
      <td>Evaluación de migración de versión Node/Postgres</td>
      <td>Reserva 8 h/sem</td>
    </tr>
    <tr>
      <td>Sep 2027</td>
      <td>Revisión anual del plan; lecciones aprendidas; ajuste SLA</td>
      <td>Reserva 6 h/sem</td>
    </tr>
  </tbody>
</table>

<h3>13.2. Rutinas periódicas</h3>
<table>
  <thead>
    <tr>
      <th>Frecuencia</th>
      <th>Actividad</th>
      <th>Tipo</th>
      <th>Responsable</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Diaria</td>
      <td>Revisar health del API y disponibilidad del sitio</td>
      <td>Preventivo</td>
      <td>Soporte N2</td>
    </tr>
    <tr>
      <td>Semanal</td>
      <td>Revisar logs de error y tickets abiertos</td>
      <td>Preventivo</td>
      <td>Soporte N2</td>
    </tr>
    <tr>
      <td>Quincenal</td>
      <td>Smoke test (home, productos, login, carrito)</td>
      <td>Preventivo</td>
      <td>QA / aprendiz</td>
    </tr>
    <tr>
      <td>Mensual</td>
      <td>Backup verificado + dependencias</td>
      <td>Preventivo</td>
      <td>Admin técnico</td>
    </tr>
    <tr>
      <td>Trimestral</td>
      <td>DNS, TLS, permisos admin, simulacro restore</td>
      <td>Preventivo</td>
      <td>Admin técnico</td>
    </tr>
    <tr>
      <td>Bajo demanda</td>
      <td>Corrección de incidentes según severidad</td>
      <td>Correctivo</td>
      <td>N2/N3</td>
    </tr>
  </tbody>
</table>

<h3>13.3. Diagrama de Gantt simplificado (trimestre 1)</h3>
<table>
  <thead>
    <tr>
      <th>Actividad</th>
      <th>Oct</th>
      <th>Nov</th>
      <th>Dic</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Inventario y baseline</td>
      <td>■ ■</td>
      <td></td>
      <td></td>
    </tr>
    <tr>
      <td>Backups + prueba restore</td>
      <td>■</td>
      <td>■</td>
      <td>■</td>
    </tr>
    <tr>
      <td>Actualización dependencias</td>
      <td></td>
      <td>■ ■</td>
      <td></td>
    </tr>
    <tr>
      <td>Revisión TLS/DNS</td>
      <td></td>
      <td></td>
      <td>■ ■</td>
    </tr>
    <tr>
      <td>Regresión automatizada</td>
      <td>■</td>
      <td>■</td>
      <td>■</td>
    </tr>
    <tr>
      <td>Cola correctiva (reserva)</td>
      <td>■ ■ ■</td>
      <td>■ ■ ■</td>
      <td>■ ■ ■</td>
    </tr>
  </tbody>
</table>
<p class="small no-indent"><em>Nota:</em> ■ = bloque de trabajo planificado en esa quincena. El detalle diario se lleva en la bitácora.</p>

<h2>14. Roles, indicadores y riesgos</h2>
<h3>14.1. Roles</h3>
<table>
  <thead>
    <tr>
      <th>Rol</th>
      <th>Responsabilidad</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Dueño del producto (formativo)</td>
      <td>Prioriza cambios; acepta releases visibles</td>
    </tr>
    <tr>
      <td>Administrador técnico</td>
      <td>Infraestructura, backups, despliegues</td>
    </tr>
    <tr>
      <td>Desarrollador / mantenedor</td>
      <td>Análisis, código, pruebas</td>
    </tr>
    <tr>
      <td>Soporte N1</td>
      <td>Atención básica al usuario</td>
    </tr>
  </tbody>
</table>

<h3>14.2. Indicadores (KPI)</h3>
<ul>
  <li>Disponibilidad mensual del sitio (≥ 99 % en horario de servicio formativo).</li>
  <li>Tiempo medio de resolución (MTTR) por severidad.</li>
  <li>Porcentaje de backups con restore exitoso (meta: 100 % de las pruebas mensuales).</li>
  <li>Incidentes recurrentes (meta: tendencia decreciente).</li>
</ul>

<h3>14.3. Riesgos y mitigación</h3>
<table>
  <thead>
    <tr>
      <th>Riesgo</th>
      <th>Mitigación</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Pérdida de datos</td>
      <td>Backups cifrados + prueba de restore</td>
    </tr>
    <tr>
      <td>Despliegue fallido</td>
      <td>Staging + rollback documentado</td>
    </tr>
    <tr>
      <td>Dependencia de un solo mantenedor</td>
      <td>Documentación y bitácora obligatoria</td>
    </tr>
    <tr>
      <td>Secretos filtrados</td>
      <td>Rotación de claves; no versionar <code>.env</code></td>
    </tr>
  </tbody>
</table>

<h2>15. Conclusiones</h2>
<p>
El mantenimiento de YogurASO debe tratarse como un proceso continuo, no como una reacción
improvisada a fallos. Al separar claramente lo <strong>preventivo</strong> (calendario, respaldos, actualizaciones,
monitoreo) de lo <strong>correctivo</strong> (respuesta por severidad), y al seguir el flujo de ISO/IEC 14764
—desde el análisis hasta la aceptación, contemplando migración y retiro—, se obtiene un plan
trazable, evaluable y alineado con buenas prácticas de ingeniería de software.
</p>
<p>
El cronograma anual propuesto reserva capacidad para incidentes sin descuidar la salud del
sistema. Su revisión trimestral permitirá ajustar tiempos, roles e indicadores según el
comportamiento real del producto en operación.
</p>

<h2>16. Referencias</h2>
<div class="refs">
  <p>Institute of Electrical and Electronics Engineers [IEEE]. (2006). <em>IEEE Std 14764-2006 — Software Engineering — Software life cycle processes — Maintenance</em> (adopción de ISO/IEC 14764). IEEE.</p>
  <p>International Organization for Standardization [ISO]. (2006/2018). <em>ISO/IEC 14764 — Software engineering — Software life cycle processes — Maintenance</em>. ISO.</p>
  <p>International Software Testing Qualifications Board [ISTQB]. (2018). <em>Certified tester foundation level syllabus</em>. ISTQB.</p>
  <p>Pressman, R. S., &amp; Maxim, B. R. (2015). <em>Software engineering: A practitioner’s approach</em> (8.ª ed.). McGraw-Hill.</p>
  <p>Servicio Nacional de Aprendizaje [SENA]. (2024). <em>GFPI-F-135 V01 — Guía de aprendizaje</em>. Formación profesional integral.</p>
  <p>Sommerville, I. (2016). <em>Software engineering</em> (10.ª ed.). Pearson.</p>
</div>

<h2>Anexos</h2>
<h3>Anexo A. Ficha de análisis de modificación (plantilla)</h3>
<table>
  <thead>
    <tr><th>Campo</th><th>Contenido</th></tr>
  </thead>
  <tbody>
    <tr><td>ID</td><td>MNT-YYYY-###</td></tr>
    <tr><td>Tipo</td><td>Preventivo / Correctivo</td></tr>
    <tr><td>Severidad</td><td>Crítica / Alta / Media / Baja</td></tr>
    <tr><td>Descripción</td><td></td></tr>
    <tr><td>Componentes impactados</td><td></td></tr>
    <tr><td>Esfuerzo estimado</td><td></td></tr>
    <tr><td>Riesgo / rollback</td><td></td></tr>
    <tr><td>Decisión</td><td>Aprobado / Diferido / Rechazado</td></tr>
  </tbody>
</table>

<h3>Anexo B. Acta breve de migración (plantilla)</h3>
<p class="no-indent">Fecha: __________ &nbsp; Origen: __________ &nbsp; Destino: __________</p>
<p class="no-indent">Backup verificado: Sí / No &nbsp; DNS/HTTPS OK: Sí / No &nbsp; Smoke PASS: Sí / No</p>
<p class="no-indent">Responsable: __________ &nbsp; Observaciones: _______________________________</p>

<h3>Anexo C. Acta de retiro (plantilla)</h3>
<p class="no-indent">Sistema: YogurASO &nbsp; Fecha de retiro: __________ &nbsp; Motivo: __________</p>
<p class="no-indent">Datos archivados en: __________ &nbsp; Credenciales revocadas: Sí / No</p>
<p class="no-indent">Repositorio etiquetado: __________ &nbsp; Responsable: __________</p>

</div>
</body>
</html>`;
}

async function main() {
  const html = buildHtml();
  fs.writeFileSync(TMP_HTML, html, 'utf8');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('file:///' + TMP_HTML.replace(/\\/g, '/'), { waitUntil: 'load' });
  await page.pdf({
    path: PDF_OUT,
    format: 'Letter',
    printBackground: true,
    margin: {
      top: '2.54cm',
      right: '2.54cm',
      bottom: '2.54cm',
      left: '2.54cm',
    },
  });
  await browser.close();

  try {
    fs.unlinkSync(TMP_HTML);
  } catch (_) {
    /* ignore */
  }

  // No dejar HTML en Descargas
  console.log('PDF:', PDF_OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
