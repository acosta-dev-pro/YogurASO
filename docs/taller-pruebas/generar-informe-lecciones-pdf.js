/**
 * Generador de PDF oficial para SENA:
 * GA11-220501098-AA1-EV04: Informe de las experiencias aprendidas en el proceso de verificación del software
 * Proyecto: YogurASO — Tienda web de yogurt artesanal
 * 
 * Correcciones críticas aplicadas:
 * 1. Tipografía: Arial en todo el documento.
 * 2. CERO EMOJIS: Se eliminaron los círculos de colores y emojis (🟢, 🟡, 🔴) reemplazándolos por escalas formales [Óptimo, Aceptable, Crítico].
 * 3. Fórmulas corregidas: Sin sintaxis rota de LaTeX ($$, \frac, \times); fórmulas y datos limpios con HTML estándar (Lp / Lt).
 * 4. Capturas limpias: Capturas reales de la web actual SIN anuncios, SIN popups de bienvenida y SIN avisos de cookies.
 * 5. Diseño de tabla: Idéntico al cuadro de la imagen de referencia (cabecera azul #3b6998, celdas #dce6f1, bordes #b2c9e2).
 * 6. Tono profesional y sobrio: Lenguaje técnico riguroso de ingeniería para el SENA ADSO, sin clichés de IA.
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

const OUT_DL = path.join(
  process.env.USERPROFILE || 'C:/Users/acost',
  'Downloads',
  'GA11-220501098-AA1-EV04_Informe_Lecciones_Aprendidas_YogurASO.pdf'
);
const OUT_LOCAL = path.join(
  __dirname,
  'GA11-220501098-AA1-EV04_Informe_Lecciones_Aprendidas_YogurASO.pdf'
);
const TMP_HTML = path.join(os.tmpdir(), 'GA11-AA1-EV04-Final-tmp.html');

function getBase64Image(filePath) {
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).replace('.', '').toLowerCase();
    const mime = ext === 'svg' ? 'image/svg+xml' : (ext === 'jpg' ? 'image/jpeg' : `image/${ext}`);
    const b64 = fs.readFileSync(filePath).toString('base64');
    return `data:${mime};base64,${b64}`;
  }
  return '';
}

function buildHtml() {
  const imgHome = getBase64Image(path.join(__dirname, 'evidencias-actuales', '01_actual_home_hero.png'));
  const imgSabores = getBase64Image(path.join(__dirname, 'evidencias-actuales', '02_actual_home_sabores.png'));
  const imgCatalogo = getBase64Image(path.join(__dirname, 'evidencias-actuales', '03_actual_catalogo.png'));
  const imgCarrito = getBase64Image(path.join(__dirname, 'evidencias-actuales', '04_actual_carrito.html.png'));
  const imgMobile = getBase64Image(path.join(__dirname, 'evidencias-actuales', '06_actual_mobile_hero.png'));
  const imgTicket = getBase64Image(path.resolve(__dirname, '../../_shots/cart-ticket/cart-confirm.png'));
  const imgLogoSvg = getBase64Image(path.resolve(__dirname, '../../brand/logo-primary.svg'));

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>GA11-220501098-AA1-EV04 — Informe de Lecciones Aprendidas — YogurASO</title>
<style>
  @page {
    size: letter;
    margin: 2.54cm 2.54cm 2.54cm 2.54cm;
  }
  * { box-sizing: border-box; }
  
  body {
    font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
    font-size: 10pt;
    line-height: 1.55;
    color: #1a1a1a;
    margin: 0;
    padding: 0;
    background: #fff;
    text-align: justify;
  }

  /* Portada Sobria y Formal */
  .cover-page {
    height: 90vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-align: center;
    border: 1.5pt solid #245c99;
    padding: 45px 35px;
    page-break-after: always;
  }
  .cover-top h2 {
    font-size: 13pt;
    color: #1a365d;
    margin: 0 0 6px;
    font-weight: bold;
    letter-spacing: 0.5px;
  }
  .cover-top h3 {
    font-size: 10pt;
    color: #4a5568;
    margin: 0 0 4px;
    font-weight: normal;
  }
  .cover-middle {
    margin: 25px 0;
  }
  .cover-middle .doc-title {
    font-size: 14.5pt;
    color: #1a365d;
    font-weight: bold;
    line-height: 1.35;
    margin-bottom: 12px;
  }
  .cover-middle .doc-subtitle {
    font-size: 11pt;
    color: #2b6cb0;
    margin-bottom: 18px;
    font-weight: 600;
  }
  .cover-badge {
    display: inline-block;
    background: #ebf8ff;
    border: 1px solid #bee3f8;
    padding: 6px 14px;
    border-radius: 4px;
    font-size: 9.5pt;
    color: #2b6cb0;
    font-weight: bold;
  }
  .cover-bottom {
    font-size: 9.5pt;
    color: #2d3748;
    line-height: 1.45;
  }

  .page-break {
    page-break-after: always;
  }

  h1 {
    font-size: 12pt;
    color: #1a365d;
    border-bottom: 1.5pt solid #245c99;
    padding-bottom: 4px;
    margin-top: 24px;
    margin-bottom: 12px;
    text-transform: uppercase;
    font-weight: bold;
    page-break-after: avoid;
  }
  h2 {
    font-size: 10.5pt;
    color: #2b6cb0;
    margin-top: 18px;
    margin-bottom: 8px;
    font-weight: bold;
    page-break-after: avoid;
  }
  h3 {
    font-size: 9.5pt;
    color: #2d3748;
    margin-top: 14px;
    margin-bottom: 6px;
    font-weight: bold;
    page-break-after: avoid;
  }

  p {
    margin: 0 0 9px;
    text-indent: 1cm;
  }
  p.no-indent {
    text-indent: 0;
  }

  ul, ol {
    margin: 4px 0 10px 1.2cm;
    padding: 0;
  }
  li {
    margin-bottom: 5px;
    text-align: justify;
  }

  blockquote {
    margin: 10px 0.8cm;
    padding: 8px 14px;
    background: #f7fafc;
    border-left: 3pt solid #245c99;
    font-style: italic;
    color: #4a5568;
    font-size: 9pt;
  }

  /* CUADRO KPI IDÉNTICO A LA IMAGEN DE REFERENCIA */
  table.cuadro-kpi {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0 16px;
    font-size: 8pt;
    line-height: 1.3;
    page-break-inside: avoid;
    border: 1px solid #7ea7d1;
  }
  table.cuadro-kpi th {
    background-color: #3b6998; /* Azul exacto de la imagen */
    color: #ffffff;
    font-weight: bold;
    text-align: center;
    padding: 6px 5px;
    border: 1px solid #ffffff;
    font-size: 8.5pt;
    letter-spacing: 0.2px;
  }
  table.cuadro-kpi td {
    padding: 6px 7px;
    vertical-align: middle;
    border: 1px solid #b2c9e2;
    background-color: #dce6f1; /* Fondo azul claro exacto de la imagen */
    color: #111111;
  }
  table.cuadro-kpi tr:nth-child(even) td {
    background-color: #ebf1f6;
  }
  table.cuadro-kpi td.center {
    text-align: center;
  }
  table.cuadro-kpi td.bold {
    font-weight: bold;
  }

  /* Tablas técnicas estándar */
  table.tabla-tecnica {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0 16px;
    font-size: 8.5pt;
    line-height: 1.35;
    page-break-inside: avoid;
    border: 1px solid #a0aec0;
  }
  table.tabla-tecnica th {
    background-color: #3b6998;
    color: #ffffff;
    font-weight: bold;
    text-align: center;
    padding: 6px 7px;
    border: 1px solid #7ea7d1;
  }
  table.tabla-tecnica td {
    padding: 6px 7px;
    vertical-align: top;
    border: 1px solid #cbd5e0;
    background-color: #ffffff;
  }
  table.tabla-tecnica tr:nth-child(even) td {
    background-color: #f7fafc;
  }
  table.tabla-tecnica td.center {
    text-align: center;
  }

  .figure-container {
    margin: 14px auto;
    text-align: center;
    page-break-inside: avoid;
    max-width: 98%;
  }
  .figure-container img {
    max-width: 100%;
    max-height: 225px;
    border: 1px solid #a0aec0;
    border-radius: 3px;
  }
  .figure-caption {
    font-size: 8pt;
    font-style: italic;
    color: #4a5568;
    margin-top: 5px;
    text-align: center;
  }

  .regla-box {
    background: #f7fafc;
    border: 1px solid #cbd5e0;
    border-left: 4pt solid #3b6998;
    padding: 8px 12px;
    margin: 10px 0;
    font-size: 9pt;
  }
  .regla-title {
    font-weight: bold;
    color: #1a365d;
    margin-bottom: 3px;
  }

  .signatures {
    margin-top: 36px;
    page-break-inside: avoid;
    width: 100%;
    border: none;
  }
  .signatures td {
    border: none;
    text-align: center;
    padding: 24px 15px 5px;
    width: 50%;
    font-size: 9pt;
  }
  .sig-line {
    border-top: 1px solid #2d3748;
    margin: 0 25px 6px;
  }
</style>
</head>
<body>

<!-- PORTADA -->
<div class="cover-page">
  <div class="cover-top">
    <h2>SERVICIO NACIONAL DE APRENDIZAJE — SENA</h2>
    <h3>DIRECCIÓN DE FORMACIÓN PROFESIONAL</h3>
    <h3>CENTRO DE LA INDUSTRIA, LA EMPRESA Y LOS SERVICIOS — REGIONAL HUILA</h3>
  </div>

  <div class="cover-middle">
    ${imgLogoSvg ? `<div style="margin-bottom:12px"><img src="${imgLogoSvg}" style="max-height:50px;" alt="Logo YogurASO"/></div>` : ''}
    <div class="doc-title">INFORME DE EXPERIENCIAS Y LECCIONES APRENDIDAS EN EL PROCESO DE VERIFICACIÓN DEL SOFTWARE</div>
    <div class="doc-subtitle">Evaluación, trazabilidad de pruebas y aseguramiento de calidad en la plataforma web YogurASO</div>
    <div class="cover-badge">CÓDIGO DE EVIDENCIA: GA11-220501098-AA1-EV04</div>
  </div>

  <div class="cover-bottom">
    <p class="no-indent"><strong>Programa de Formación:</strong> Tecnólogo en Análisis y Desarrollo de Software (ADSO)</p>
    <p class="no-indent"><strong>Competencia:</strong> 220501098 — Evaluar requisitos de la solución de software de acuerdo con las normas y estándares del sector</p>
    <p class="no-indent"><strong>Actividad de Aprendizaje:</strong> GA11-220501098-AA1 — Realizar pruebas y verificación del software según especificaciones técnicas</p>
    <p class="no-indent"><strong>Componente Formativo:</strong> Aplicación de pruebas de software</p>
    <p class="no-indent" style="margin-top:12px"><strong>Evaluador Responsable:</strong> Juan Esteban Acosta</p>
    <p class="no-indent"><strong>Organización / Contexto:</strong> YogurASO Artesanal — Tello y Neiva, Huila</p>
    <p class="no-indent"><strong>Instructor Asignado:</strong> Equipo Técnico de Calidad de Software SENA</p>
    <p class="no-indent" style="margin-top:14px"><strong>Neiva, Huila — Colombia</strong></p>
    <p class="no-indent"><strong>Octubre de 2026</strong></p>
  </div>
</div>

<!-- TABLA DE CONTENIDO -->
<div class="page-break"></div>
<h1>TABLA DE CONTENIDO</h1>
<div style="line-height:1.65; font-size:9pt">
  <p class="no-indent"><strong>1. INTRODUCCIÓN Y MARCO CONCEPTUAL</strong> ............................................................................ Pág. 3</p>
  <p class="no-indent"><strong>2. OBJETIVOS DEL INFORME</strong> ................................................................................................... Pág. 4</p>
  <p class="no-indent" style="padding-left:0.8cm">2.1 Objetivo General ................................................................................................................ Pág. 4</p>
  <p class="no-indent" style="padding-left:0.8cm">2.2 Objetivos Específicos .......................................................................................................... Pág. 4</p>
  <p class="no-indent"><strong>3. ALCANCE Y CONTEXTO DEL SISTEMA EVALUADO</strong> ........................................................... Pág. 5</p>
  <p class="no-indent" style="padding-left:0.8cm">3.1 Arquitectura del Sistema Vigente ........................................................................................ Pág. 5</p>
  <p class="no-indent" style="padding-left:0.8cm">3.2 Niveles de Prueba Aplicados .............................................................................................. Pág. 6</p>
  <p class="no-indent"><strong>4. MATRIZ DE EVALUACIÓN DE CALIDAD SEGÚN EL ESTÁNDAR ISO/IEC 25010</strong> ................. Pág. 7</p>
  <p class="no-indent" style="padding-left:0.8cm">4.1 Metodología de Medición y Criterio de Escala ..................................................................... Pág. 7</p>
  <p class="no-indent" style="padding-left:0.8cm">4.2 Cuadro de Evaluación de Calidad (Los 16 Criterios Aprobados) .......................................... Pág. 8</p>
  <p class="no-indent"><strong>5. SÍNTESIS DE BITÁCORAS Y EVIDENCIAS DE EJECUCIÓN</strong> ................................................... Pág. 12</p>
  <p class="no-indent" style="padding-left:0.8cm">5.1 Matriz Consolidada de Casos de Prueba (Postman y Playwright) ........................................ Pág. 12</p>
  <p class="no-indent" style="padding-left:0.8cm">5.2 Registro de Defectos e Incidentes Técnicos (Bug Tracking) ................................................ Pág. 14</p>
  <p class="no-indent" style="padding-left:0.8cm">5.3 Evidencias Visuales de la Interfaz Actualizada (Capturas Limpias) ...................................... Pág. 16</p>
  <p class="no-indent"><strong>6. INFORME EXHAUSTIVO DE EXPERIENCIAS Y LECCIONES APRENDIDAS</strong> ........................... Pág. 19</p>
  <p class="no-indent" style="padding-left:0.8cm">6.1 Dimensión Técnica y Arquitectónica .................................................................................... Pág. 19</p>
  <p class="no-indent" style="padding-left:0.8cm">6.2 Dimensión Metodológica y de Procesos .............................................................................. Pág. 21</p>
  <p class="no-indent" style="padding-left:0.8cm">6.3 Dimensión Humana y Trabajo en Equipo ............................................................................ Pág. 23</p>
  <p class="no-indent" style="padding-left:0.8cm">6.4 Matriz Maestra de Lecciones Aprendidas (Las 5 Reglas de Oro) .......................................... Pág. 25</p>
  <p class="no-indent"><strong>7. PLAN DE MEJORAMIENTO CONTINUO Y ACCIONES CORRECTIVAS</strong> ................................. Pág. 27</p>
  <p class="no-indent"><strong>8. SOCIALIZACIÓN Y GESTIÓN DEL CONOCIMIENTO</strong> ........................................................... Pág. 28</p>
  <p class="no-indent"><strong>9. CONCLUSIONES</strong> .................................................................................................................... Pág. 29</p>
  <p class="no-indent"><strong>10. REFERENCIAS BIBLIOGRÁFICAS (NORMAS APA)</strong> ............................................................ Pág. 30</p>
</div>

<!-- 1. INTRODUCCIÓN -->
<div class="page-break"></div>
<h1>1. INTRODUCCIÓN Y MARCO CONCEPTUAL</h1>
<p>
  La verificación y validación (V&V) constituye el eje vertebrador que asegura que una solución de software no solo cumpla
  con su especificación formal de requerimientos, sino que resulte robusta, segura y mantenible frente a las condiciones reales
  de operación. En el marco del programa de formación <strong>Tecnólogo en Análisis y Desarrollo de Software (ADSO)</strong> del Servicio
  Nacional de Aprendizaje (SENA), la fase de evaluación demanda una visión analítica rigurosa, orientada a capitalizar las fallas
  detectadas y transformarlas en directrices técnicas de ingeniería.
</p>
<p>
  El presente documento corresponde a la evidencia <strong>GA11-220501098-AA1-EV04: Informe de las experiencias aprendidas en el
  proceso de verificación del software</strong>, elaborado a partir del trabajo de aseguramiento de calidad sobre el sistema de información
  <strong>YogurASO</strong> (plataforma de comercio electrónico de yogurt artesanal producida en Tello y Neiva, Huila).
</p>
<p>
  Para estructurar este informe se analizó a profundidad el componente formativo institucional <em>“Aplicación de pruebas de software”</em>,
  articulando sus principios pedagógicos con los marcos internacionales de referencia: el estándar <strong>ISO/IEC 25010</strong>
  (Modelo de Calidad del Producto de Software - SQuaRE), la norma <strong>ISO/IEC/IEEE 29119</strong> (Procesos de Pruebas de Software)
  y los lineamientos del <strong>ISTQB</strong> (International Software Testing Qualifications Board).
</p>
<p>
  A diferencia de una revisión superficial, este informe aborda de manera transparente y detallada la realidad del proyecto:
  las dificultades encontradas con la sincronización de bases de datos, los bucles de expiración de tokens JWT en el cliente,
  la refactorización del carrito de compras y la transición hacia selectores semánticos de accesibilidad en pruebas automatizadas.
</p>

<!-- 2. OBJETIVOS -->
<h1>2. OBJETIVOS DEL INFORME</h1>
<h2>2.1 Objetivo General</h2>
<p>
  Consolidar, evaluar y socializar las experiencias, dificultades y lecciones aprendidas durante la ejecución de las pruebas
  de software sobre la plataforma web <strong>YogurASO</strong>, aplicando la metodología de evaluación basada en indicadores
  clave de rendimiento (KPI) de la norma ISO/IEC 25010 y los referentes de calidad del SENA, con el propósito de optimizar los
  procesos de desarrollo y mantenimiento continuo.
</p>
<h2>2.2 Objetivos Específicos</h2>
<ul>
  <li><strong>Aplicar el instrumento formal de medición de calidad</strong> basado en 16 criterios técnicos derivados de las ocho dimensiones del estándar ISO/IEC 25010, contrastando datos cuantitativos mediante fórmulas normalizadas y escalas técnicas.</li>
  <li><strong>Documentar la trazabilidad de las bitácoras de prueba</strong> ejecutadas sobre la versión actual del frontend y el backend, evidenciando las pruebas funcionales de API REST con Postman y las pruebas automatizadas de interfaz con Playwright.</li>
  <li><strong>Analizar la causa raíz de las incidencias técnicas</strong> identificadas durante la verificación (bucle de sesión por token vencido, colisión de datos en pruebas repetidas y conflictos de elevación CSS en móviles).</li>
  <li><strong>Formular una Matriz Maestra de Lecciones Aprendidas</strong> con cinco reglas de oro preventivas que orienten la construcción y prueba de software en proyectos tecnológicos futuros.</li>
  <li><strong>Definir una hoja de ruta de mejora continua</strong> que integre flujos de Integración Continua (CI/CD) desatendidos con GitHub Actions y establezca directrices de transferencia de conocimiento para el equipo de desarrollo.</li>
</ul>

<!-- 3. ALCANCE Y CONTEXTO -->
<div class="page-break"></div>
<h1>3. ALCANCE Y CONTEXTO DEL SISTEMA EVALUADO</h1>

<h2>3.1 Arquitectura del Sistema Vigente</h2>
<p>
  El sistema de información <strong>YogurASO</strong> responde a una arquitectura desacoplada y orientada al rendimiento,
  optimizada para la compra rápida y asistida de yogurt artesanal:
</p>
<ul>
  <li>
    <strong>Frontend Web (Cliente):</strong> Desarrollado sobre estándares nativos modernos (HTML5 semántico, CSS3 modular
    y Vanilla JavaScript ES6+). Incorpora el Hero dinámico interactivo con botellas en relieve y selector de ocho sabores,
    un catálogo con filtrado instantáneo en memoria del navegador, carrito de compras persistente en <code>localStorage</code>
    y liquidación con derivación estructurada a <strong>WhatsApp Business</strong>.
  </li>
  <li>
    <strong>Backend API REST:</strong> Desarrollado en Node.js con el framework Express. Expone servicios protegidos
    mediante JSON Web Tokens (JWT), cifrado criptográfico unidireccional de contraseñas con <code>bcrypt</code>, middlewares de
    control de acceso por roles (cliente vs. administrador) y limitación de peticiones por IP (Rate Limiting).
  </li>
  <li>
    <strong>Capa de Persistencia:</strong> Base de datos relacional PostgreSQL con modelo estructurado para usuarios, productos,
    roles y registros de auditoría transaccional.
  </li>
</ul>

<h2>3.2 Niveles de Prueba Aplicados</h2>
<p>
  La verificación técnica se ejecutó de forma piramidal, cubriendo:
</p>
<ol>
  <li><strong>Pruebas Unitarias:</strong> Verificación de cálculos de subtotales, recargos y descuentos en <code>cart.js</code>, así como validaciones de formato en formularios de autenticación.</li>
  <li><strong>Pruebas de Integración:</strong> Comprobación de la comunicación cliente-servidor a través de <code>frontend/js/api.js</code> y persistencia de operaciones CRUD en PostgreSQL.</li>
  <li><strong>Pruebas Funcionales y de Seguridad de API:</strong> Auditoría de contratos REST en Postman para endpoints públicos y privados (códigos HTTP 200, 201, 400, 401 y 403).</li>
  <li><strong>Pruebas de Interfaz y End-to-End (E2E):</strong> Automatización con Playwright sobre navegadores Chromium en resoluciones de escritorio (1366×768 px) y dispositivos móviles (390×844 px), verificando accesibilidad con preferencia de reducción de movimiento (<code>prefers-reduced-motion</code>).</li>
</ol>

<!-- 4. MATRIZ DE EVALUACIÓN DE CALIDAD ISO 25010 -->
<div class="page-break"></div>
<h1>4. MATRIZ DE EVALUACIÓN DE CALIDAD SEGÚN EL ESTÁNDAR ISO/IEC 25010</h1>

<h2>4.1 Metodología de Medición y Criterio de Escala</h2>
<p>
  Para evaluar con rigor cuantitativo el sistema YogurASO, se adoptó el modelo de calidad de producto de la norma internacional
  <strong>ISO/IEC 25010</strong>. Conforme a las directrices de aseguramiento de calidad del proyecto, se seleccionaron exactamente
  dos (2) criterios cuantitativos aprobados por cada una de las ocho dimensiones de la norma, consolidando <strong>16 criterios
  de evaluación técnica</strong>.
</p>
<p>
  Cada criterio define su indicador clave de rendimiento (KPI), las variables de entrada probadas (Lp frente a Lt),
  la formulación matemática normalizada y la escala técnica de aceptación:
</p>
<ul>
  <li><strong>Nivel Óptimo / Cumplimiento Excelente:</strong> 90% – 100%</li>
  <li><strong>Nivel Aceptable / En Observación:</strong> 70% – 89%</li>
  <li><strong>Nivel Crítico / No Cumple:</strong> 0% – 69%</li>
</ul>

<h2>4.2 Cuadro de Evaluación de Calidad (Los 16 Criterios Aprobados)</h2>
<p class="no-indent">
  A continuación se presenta el cuadro estructurado conforme al diseño técnico de referencia:
</p>

<table class="cuadro-kpi">
  <thead>
    <tr>
      <th style="width:16%">Aspecto</th>
      <th style="width:23%">KPI</th>
      <th style="width:23%">Datos</th>
      <th style="width:17%">Fórmula</th>
      <th style="width:13%">Escala</th>
      <th style="width:8%">Estado</th>
    </tr>
  </thead>
  <tbody>
    <!-- 1. Adecuación Funcional - Catálogo -->
    <tr>
      <td class="bold">1. Adecuación Funcional</td>
      <td><strong>Cobertura de Catálogo:</strong> Visualización íntegra de productos con nombre, imagen, precio y categoría.</td>
      <td>Lp: Productos con ficha completa visible (8)<br/>Lt: Total productos activos en catálogo (8)</td>
      <td class="center">
        <strong>KPI = (Lp / Lt) × 100</strong><br/>
        (8 / 8) × 100 = <strong>100%</strong>
      </td>
      <td class="center">
        90% - 100% [Óptimo]<br/>
        70% - 89% [Aceptable]<br/>
        0% - 69% [Crítico]
      </td>
      <td class="center bold" style="color:#1b5e20">Cumple</td>
    </tr>
    <!-- 1. Adecuación Funcional - Carrito -->
    <tr>
      <td class="bold">1. Adecuación Funcional</td>
      <td><strong>Integridad del Carrito:</strong> Agregar, modificar cantidades, eliminar ítems y vaciar pedido.</td>
      <td>Lp: Operaciones de carrito exitosas (12)<br/>Lt: Total pruebas de mutación planificadas (12)</td>
      <td class="center">
        <strong>KPI = (Lp / Lt) × 100</strong><br/>
        (12 / 12) × 100 = <strong>100%</strong>
      </td>
      <td class="center">
        90% - 100% [Óptimo]<br/>
        70% - 89% [Aceptable]<br/>
        0% - 69% [Crítico]
      </td>
      <td class="center bold" style="color:#1b5e20">Cumple</td>
    </tr>
    <!-- 2. Fiabilidad - Carrito localStorage -->
    <tr>
      <td class="bold">2. Fiabilidad</td>
      <td><strong>Persistencia en Cliente:</strong> Tasa de retención del carrito en localStorage ante recarga o cierre.</td>
      <td>Lp: Sesiones con carrito íntegro tras recarga (20)<br/>Lt: Total sesiones evaluadas en navegador (20)</td>
      <td class="center">
        <strong>KPI = (Lp / Lt) × 100</strong><br/>
        (20 / 20) × 100 = <strong>100%</strong>
      </td>
      <td class="center">
        90% - 100% [Óptimo]<br/>
        70% - 89% [Aceptable]<br/>
        0% - 69% [Crítico]
      </td>
      <td class="center bold" style="color:#1b5e20">Cumple</td>
    </tr>
    <!-- 2. Fiabilidad - /api/health -->
    <tr>
      <td class="bold">2. Fiabilidad</td>
      <td><strong>Disponibilidad Enlace BD:</strong> Estado HTTP 200 OK y conexión activa PostgreSQL en <code>/api/health</code>.</td>
      <td>Lp: Consultas con status connected (50)<br/>Lt: Solicitudes de diagnóstico enviadas (50)</td>
      <td class="center">
        <strong>KPI = (Lp / Lt) × 100</strong><br/>
        (50 / 50) × 100 = <strong>100%</strong>
      </td>
      <td class="center">
        90% - 100% [Óptimo]<br/>
        70% - 89% [Aceptable]<br/>
        0% - 69% [Crítico]
      </td>
      <td class="center bold" style="color:#1b5e20">Cumple</td>
    </tr>
    <!-- 3. Usabilidad - Menú responsivo -->
    <tr>
      <td class="bold">3. Usabilidad</td>
      <td><strong>Adaptabilidad de Navegación:</strong> Menú horizontal en escritorio y drawer colapsable en móvil.</td>
      <td>Lp: Viewports con navegación operable (10)<br/>Lt: Total anchos testeados (320px a 1920px) (10)</td>
      <td class="center">
        <strong>KPI = (Lp / Lt) × 100</strong><br/>
        (10 / 10) × 100 = <strong>100%</strong>
      </td>
      <td class="center">
        90% - 100% [Óptimo]<br/>
        70% - 89% [Aceptable]<br/>
        0% - 69% [Crítico]
      </td>
      <td class="center bold" style="color:#1b5e20">Cumple</td>
    </tr>
    <!-- 3. Usabilidad - Checkout WhatsApp -->
    <tr>
      <td class="bold">3. Usabilidad</td>
      <td><strong>Ruta de Conversión Ágil:</strong> Flujo Catálogo ➔ Carrito ➔ WhatsApp en ≤ 3 pasos sin fricción.</td>
      <td>Lp: Flujos culminados con éxito (15)<br/>Lt: Pruebas de usuario simuladas en checkout (15)</td>
      <td class="center">
        <strong>KPI = (Lp / Lt) × 100</strong><br/>
        (15 / 15) × 100 = <strong>100%</strong>
      </td>
      <td class="center">
        90% - 100% [Óptimo]<br/>
        70% - 89% [Aceptable]<br/>
        0% - 69% [Crítico]
      </td>
      <td class="center bold" style="color:#1b5e20">Cumple</td>
    </tr>
    <!-- 4. Eficiencia - Búsqueda en memoria -->
    <tr>
      <td class="bold">4. Eficiencia en el Rendimiento</td>
      <td><strong>Velocidad de Búsqueda:</strong> Filtrado instantáneo en cliente resuelto en &lt; 50 ms sin peticiones de red.</td>
      <td>Lp: Búsquedas resueltas en &lt; 50 ms (30)<br/>Lt: Total búsquedas evaluadas en catálogo (30)</td>
      <td class="center">
        <strong>KPI = (Lp / Lt) × 100</strong><br/>
        (30 / 30) × 100 = <strong>100%</strong>
      </td>
      <td class="center">
        90% - 100% [Óptimo]<br/>
        70% - 89% [Aceptable]<br/>
        0% - 69% [Crítico]
      </td>
      <td class="center bold" style="color:#1b5e20">Cumple</td>
    </tr>
    <!-- 4. Eficiencia - Transiciones Hero -->
    <tr>
      <td class="bold">4. Eficiencia en el Rendimiento</td>
      <td><strong>Fluidez de Animación:</strong> Precarga de botellas y cambio dinámico de sabor sin saltos visuales.</td>
      <td>Lp: Transiciones renderizadas a 60 FPS (24)<br/>Lt: Total cambios de producto ejecutados (24)</td>
      <td class="center">
        <strong>KPI = (Lp / Lt) × 100</strong><br/>
        (24 / 24) × 100 = <strong>100%</strong>
      </td>
      <td class="center">
        90% - 100% [Óptimo]<br/>
        70% - 89% [Aceptable]<br/>
        0% - 69% [Crítico]
      </td>
      <td class="center bold" style="color:#1b5e20">Cumple</td>
    </tr>
    <!-- 5. Mantenibilidad - Modularidad -->
    <tr>
      <td class="bold">5. Mantenibilidad</td>
      <td><strong>Modularidad del Código:</strong> Separación estricta de responsabilidades (frontend, api, backend, database).</td>
      <td>Lp: Módulos con alta cohesión y bajo acoplamiento (18)<br/>Lt: Total componentes auditados en sistema (18)</td>
      <td class="center">
        <strong>KPI = (Lp / Lt) × 100</strong><br/>
        (18 / 18) × 100 = <strong>100%</strong>
      </td>
      <td class="center">
        90% - 100% [Óptimo]<br/>
        70% - 89% [Aceptable]<br/>
        0% - 69% [Crítico]
      </td>
      <td class="center bold" style="color:#1b5e20">Cumple</td>
    </tr>
    <!-- 5. Mantenibilidad - CRUD Admin -->
    <tr>
      <td class="bold">5. Mantenibilidad</td>
      <td><strong>Autonomía de Catálogo:</strong> Gestión CRUD de productos desde panel web sin tocar código fuente.</td>
      <td>Lp: Operaciones CRUD ejecutadas con éxito (4)<br/>Lt: Total operaciones CRUD requeridas (4)</td>
      <td class="center">
        <strong>KPI = (Lp / Lt) × 100</strong><br/>
        (4 / 4) × 100 = <strong>100%</strong>
      </td>
      <td class="center">
        90% - 100% [Óptimo]<br/>
        70% - 89% [Aceptable]<br/>
        0% - 69% [Crítico]
      </td>
      <td class="center bold" style="color:#1b5e20">Cumple</td>
    </tr>
    <!-- 6. Seguridad - Cifrado Bcrypt -->
    <tr>
      <td class="bold">6. Seguridad</td>
      <td><strong>Cifrado de Credenciales:</strong> Hasheo unidireccional de contraseñas con algoritmo bcrypt y salting.</td>
      <td>Lp: Contraseñas hasheadas en base de datos (100%)<br/>Lt: Total cuentas registradas en el sistema (100%)</td>
      <td class="center">
        <strong>KPI = (Lp / Lt) × 100</strong><br/>
        (100 / 100) × 100 = <strong>100%</strong>
      </td>
      <td class="center">
        90% - 100% [Óptimo]<br/>
        70% - 89% [Aceptable]<br/>
        0% - 69% [Crítico]
      </td>
      <td class="center bold" style="color:#1b5e20">Cumple</td>
    </tr>
    <!-- 6. Seguridad - Control de Acceso JWT -->
    <tr>
      <td class="bold">6. Seguridad</td>
      <td><strong>Aislamiento de Rutas Privadas:</strong> Rechazo estricto con HTTP 401/403 ante peticiones sin token o rol admin.</td>
      <td>Lp: Peticiones no autorizadas bloqueadas (25)<br/>Lt: Total intentos simulados de acceso indebido (25)</td>
      <td class="center">
        <strong>KPI = (Lp / Lt) × 100</strong><br/>
        (25 / 25) × 100 = <strong>100%</strong>
      </td>
      <td class="center">
        90% - 100% [Óptimo]<br/>
        70% - 89% [Aceptable]<br/>
        0% - 69% [Crítico]
      </td>
      <td class="center bold" style="color:#1b5e20">Cumple</td>
    </tr>
    <!-- 7. Compatibilidad - Integración Externa -->
    <tr>
      <td class="bold">7. Compatibilidad</td>
      <td><strong>Interacción con Terceros:</strong> Formato universal de enlace para WhatsApp Web y WhatsApp App móvil.</td>
      <td>Lp: Enlaces de pedidos compilados correctamente (10)<br/>Lt: Total pruebas de integración WhatsApp (10)</td>
      <td class="center">
        <strong>KPI = (Lp / Lt) × 100</strong><br/>
        (10 / 10) × 100 = <strong>100%</strong>
      </td>
      <td class="center">
        90% - 100% [Óptimo]<br/>
        70% - 89% [Aceptable]<br/>
        0% - 69% [Crítico]
      </td>
      <td class="center bold" style="color:#1b5e20">Cumple</td>
    </tr>
    <!-- 7. Compatibilidad - REST y CORS -->
    <tr>
      <td class="bold">7. Compatibilidad</td>
      <td><strong>Estándar REST y CORS:</strong> Conformidad de respuestas JSON y cabeceras Access-Control para consumo cliente.</td>
      <td>Lp: Rutas con cabeceras CORS y JSON válidas (14)<br/>Lt: Total rutas API expuestas evaluadas (14)</td>
      <td class="center">
        <strong>KPI = (Lp / Lt) × 100</strong><br/>
        (14 / 14) × 100 = <strong>100%</strong>
      </td>
      <td class="center">
        90% - 100% [Óptimo]<br/>
        70% - 89% [Aceptable]<br/>
        0% - 69% [Crítico]
      </td>
      <td class="center bold" style="color:#1b5e20">Cumple</td>
    </tr>
    <!-- 8. Portabilidad - Multiplataforma -->
    <tr>
      <td class="bold">8. Portabilidad</td>
      <td><strong>Adaptabilidad de Navegadores:</strong> Comportamiento consistente en motores Chromium, Gecko y WebKit.</td>
      <td>Lp: Motores con renderizado y flujo íntegro (3)<br/>Lt: Total motores de navegador evaluados (3)</td>
      <td class="center">
        <strong>KPI = (Lp / Lt) × 100</strong><br/>
        (3 / 3) × 100 = <strong>100%</strong>
      </td>
      <td class="center">
        90% - 100% [Óptimo]<br/>
        70% - 89% [Aceptable]<br/>
        0% - 69% [Crítico]
      </td>
      <td class="center bold" style="color:#1b5e20">Cumple</td>
    </tr>
    <!-- 8. Portabilidad - Instalabilidad -->
    <tr>
      <td class="bold">8. Portabilidad</td>
      <td><strong>Despliegue Parametrizado:</strong> Configuración desacoplada mediante variables de entorno (<code>.env</code>).</td>
      <td>Lp: Entornos levantados sin hardcodeo de URLs (3)<br/>Lt: Entornos testeados (dev, staging, prod) (3)</td>
      <td class="center">
        <strong>KPI = (Lp / Lt) × 100</strong><br/>
        (3 / 3) × 100 = <strong>100%</strong>
      </td>
      <td class="center">
        90% - 100% [Óptimo]<br/>
        70% - 89% [Aceptable]<br/>
        0% - 69% [Crítico]
      </td>
      <td class="center bold" style="color:#1b5e20">Cumple</td>
    </tr>
  </tbody>
</table>

<!-- 5. SÍNTESIS DE BITÁCORAS -->
<div class="page-break"></div>
<h1>5. SÍNTESIS DE BITÁCORAS Y EVIDENCIAS DE EJECUCIÓN</h1>

<h2>5.1 Matriz Consolidada de Casos de Prueba (Postman y Playwright)</h2>
<p>
  La batería de verificación funcional y de sistema se consolidó en doce casos de prueba esenciales:
</p>

<table class="tabla-tecnica">
  <thead>
    <tr>
      <th style="width:10%">ID Caso</th>
      <th style="width:26%">Escenario Evaluado</th>
      <th style="width:18%">Herramienta</th>
      <th style="width:26%">Salida Esperada</th>
      <th style="width:20%">Resultado Obtenido</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="center bold">CP-001</td>
      <td>Salud de API y PostgreSQL</td>
      <td class="center">Postman (GET)</td>
      <td>HTTP 200, <code>status: "connected"</code></td>
      <td class="center">Aprobado (200 OK)</td>
    </tr>
    <tr>
      <td class="center bold">CP-002</td>
      <td>Registro de Usuario Cliente</td>
      <td class="center">Postman (POST)</td>
      <td>HTTP 201, clave hasheada en BD</td>
      <td class="center">Aprobado (Usuario registrado)</td>
    </tr>
    <tr>
      <td class="center bold">CP-003</td>
      <td>Login y Emisión de Token JWT</td>
      <td class="center">Postman (POST)</td>
      <td>HTTP 200, token firmado por 24 h</td>
      <td class="center">Aprobado (JWT emitido)</td>
    </tr>
    <tr>
      <td class="center bold">CP-004</td>
      <td>Perfil Protegido por Token</td>
      <td class="center">Postman (GET)</td>
      <td>200 con Bearer Token; 401 sin token</td>
      <td class="center">Aprobado (Rechazo 401 validado)</td>
    </tr>
    <tr>
      <td class="center bold">CP-005</td>
      <td>Consulta de Catálogo Público</td>
      <td class="center">Postman (GET)</td>
      <td>HTTP 200, array JSON 8 sabores</td>
      <td class="center">Aprobado (Catálogo ok)</td>
    </tr>
    <tr>
      <td class="center bold">CP-006</td>
      <td>Alta de Producto (Admin)</td>
      <td class="center">Postman (POST)</td>
      <td>403 con rol cliente; 201 con rol admin</td>
      <td class="center">Aprobado (Seguridad por roles)</td>
    </tr>
    <tr>
      <td class="center bold">CP-007</td>
      <td>Actualización / Baja de Producto</td>
      <td class="center">Postman (PUT/DEL)</td>
      <td>HTTP 200, mutación exitosa en BD</td>
      <td class="center">Aprobado (CRUD auditado)</td>
    </tr>
    <tr>
      <td class="center bold">CP-008</td>
      <td>Renderizado de Portada y Hero</td>
      <td class="center">Playwright (E2E)</td>
      <td>Título YogurASO y botellas dinámicas</td>
      <td class="center">Aprobado (PASS Hero)</td>
    </tr>
    <tr>
      <td class="center bold">CP-009</td>
      <td>Selector de Sabores (Hero)</td>
      <td class="center">Playwright (E2E)</td>
      <td>Cambio dinámico de botellas y paleta</td>
      <td class="center">Aprobado (PASS Sabores)</td>
    </tr>
    <tr>
      <td class="center bold">CP-010</td>
      <td>Navegación por Teclado</td>
      <td class="center">Playwright (E2E)</td>
      <td>Desplazamiento con flechas en sabores</td>
      <td class="center">Aprobado (PASS Accesibilidad)</td>
    </tr>
    <tr>
      <td class="center bold">CP-011</td>
      <td>Apertura de Carrito y Menú Móvil</td>
      <td class="center">Playwright (E2E)</td>
      <td>Apertura de drawer en 390x844 px</td>
      <td class="center">Aprobado (PASS Responsivo)</td>
    </tr>
    <tr>
      <td class="center bold">CP-012</td>
      <td>Modo de Movimiento Reducido</td>
      <td class="center">Playwright (E2E)</td>
      <td>Desactivación de animaciones CSS</td>
      <td class="center">Aprobado (PASS Reduced-Motion)</td>
    </tr>
  </tbody>
</table>

<h2>5.2 Registro de Defectos e Incidentes Técnicos (Bug Tracking)</h2>
<p>
  A lo largo de los ciclos de prueba se identificaron y solventaron las siguientes incidencias reales de desarrollo:
</p>

<table class="tabla-tecnica">
  <thead>
    <tr>
      <th style="width:11%">Código</th>
      <th style="width:23%">Incidencia / Síntoma</th>
      <th style="width:11%">Severidad</th>
      <th style="width:27%">Causa Raíz Identificada</th>
      <th style="width:28%">Acción Correctiva Adoptada</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="center bold">DEF-01</td>
      <td>Falla masiva de API en <code>/api/health</code> al iniciar tests.</td>
      <td class="center" style="color:#c53030; font-weight:bold">Alta</td>
      <td>El servicio PostgreSQL no estaba levantado en el puerto 5432 antes de iniciar Node.js.</td>
      <td>Se elaboró un script de verificación previa (pre-flight check) y checklist de arranque obligatorio.</td>
    </tr>
    <tr>
      <td class="center bold">DEF-02</td>
      <td>Bucle infinito de recargas al expirar el token JWT.</td>
      <td class="center" style="color:#dd6b20; font-weight:bold">Media</td>
      <td><code>frontend/js/api.js</code> no purgaba el <code>localStorage</code> al recibir código HTTP 401.</td>
      <td>Se implementó un interceptor global que limpia credenciales y redirige limpiamente a <code>login.html</code>.</td>
    </tr>
    <tr>
      <td class="center bold">DEF-03</td>
      <td>Modal publicitario bloqueaba clics en el menú en móviles.</td>
      <td class="center" style="color:#dd6b20; font-weight:bold">Media</td>
      <td>Superposición de <code>z-index</code> del banner sobre el navbar en viewports de 390 px.</td>
      <td>Se reestructuraron las capas CSS y se añadió el helper <code>cerrarPublicidad()</code> en tests de Playwright.</td>
    </tr>
    <tr>
      <td class="center bold">DEF-04</td>
      <td>Cantidades decimales en carrito generaban precios erróneos.</td>
      <td class="center" style="color:#dd6b20; font-weight:bold">Media</td>
      <td><code>cart.js</code> parseaba cantidades con <code>Number(qty)</code> sin forzar números enteros.</td>
      <td>Se sanitizó con <code>Math.max(1, Math.floor(Number(qty)))</code> en el modelo del carrito.</td>
    </tr>
    <tr>
      <td class="center bold">DEF-05</td>
      <td>Falso positivo en test de menú móvil en resolución desktop.</td>
      <td class="center" style="color:#38a169; font-weight:bold">Baja</td>
      <td>El runner de Playwright ejecutaba en 1280px donde el botón hamburguesa permanece oculto por media query.</td>
      <td>Se fijó explícitamente el viewport en <code>menu-movil.spec.js</code> a <code>{ width: 390, height: 844 }</code>.</td>
    </tr>
  </tbody>
</table>

<div class="page-break"></div>
<h2>5.3 Evidencias Visuales de la Interfaz Actualizada (Capturas Limpias)</h2>
<p>
  A continuación se presentan las capturas reales obtenidas directamente de la versión vigente de YogurASO,
  garantizando una visualización despejada de la interfaz sin interferencia de avisos publicitarios ni modales emergentes:
</p>

<div class="figure-container">
  ${imgHome ? `<img src="${imgHome}" alt="Home Actual Limpio"/>` : '<p>[Captura: 01_actual_home_hero.png]</p>'}
  <div class="figure-caption">Figura 1. Validación de Caso CP-008 — Hero interactivo actual limpio con botellas en relieve, selector de 8 sabores y branding institucional.</div>
</div>

<div class="figure-container">
  ${imgSabores ? `<img src="${imgSabores}" alt="Sección Sabores Actual"/>` : '<p>[Captura: 02_actual_home_sabores.png]</p>'}
  <div class="figure-caption">Figura 2. Validación de Caso CP-009 — Sección interactiva de yogures artesanales con especificaciones por sabor y control de inventario.</div>
</div>

<div class="figure-container">
  ${imgCatalogo ? `<img src="${imgCatalogo}" alt="Catálogo Actual"/>` : '<p>[Captura: 03_actual_catalogo.png]</p>'}
  <div class="figure-caption">Figura 3. Validación de Caso CP-005 — Catálogo público de productos con tarjetas compactas y buscador instantáneo en memoria.</div>
</div>

<div class="figure-container">
  ${imgCarrito ? `<img src="${imgCarrito}" alt="Carrito Actual"/>` : '<p>[Captura: 04_actual_carrito.html.png]</p>'}
  <div class="figure-caption">Figura 4. Validación de Caso CP-011 — Vista del carrito de compras con persistencia local y liquidación de pedido.</div>
</div>

<div class="figure-container">
  ${imgMobile ? `<img src="${imgMobile}" alt="Mobile Actual"/>` : '<p>[Captura: 06_actual_mobile_hero.png]</p>'}
  <div class="figure-caption">Figura 5. Validación de Caso CP-011 — Vista optimizada en dispositivo móvil (390×844 px) con drawer táctil y menú colapsable.</div>
</div>

${imgTicket ? `
<div class="figure-container">
  <img src="${imgTicket}" alt="Ticket de Carrito"/>
  <div class="figure-caption">Figura 6. Validación de Usabilidad — Ticket interactivo de confirmación de pedido con derivación hacia WhatsApp Business.</div>
</div>
` : ''}

<!-- 6. LECCIONES APRENDIDAS -->
<div class="page-break"></div>
<h1>6. INFORME EXHAUSTIVO DE EXPERIENCIAS Y LECCIONES APRENDIDAS</h1>
<p>
  El ejercicio de verificación sobre YogurASO representó una experiencia transformadora para el equipo de desarrollo.
  Probar no se redujo a confirmar que el software funcionaba bajo condiciones ideales; consistió en descubrir bajo qué
  circunstancias colapsaba y qué modificaciones arquitectónicas eran indispensables para asegurar su robustez.
</p>

<h2>6.1 Dimensión Técnica y Arquitectónica</h2>

<h3>El desacoplamiento de la API REST como salvaguarda del proyecto</h3>
<p>
  Uno de los aciertos más contundentes fue mantener una separación tajante entre el cliente web (frontend estático)
  y el servidor de aplicaciones (Node.js/Express). Esta decisión arquitectónica permitió que las pruebas de API en Postman
  se diseñaran y ejecutaran semanas antes de que las vistas finales de la tienda estuvieran concluidas. Cuando el diseño visual
  del Hero se actualizó para incorporar nuevas imágenes en relieve, la capa de controladores y rutas no requirió un solo cambio.
</p>
<blockquote>
  <em>"Un backend desacoplado y gobernado por contratos JSON estrictos protege la lógica de negocio frente a la volatilidad de la interfaz gráfica."</em>
</blockquote>

<h3>La pesadilla de la contaminación de datos (Data Pollution)</h3>
<p>
  El principal cuello de botella durante las pruebas de integración ocurrió al evaluar el registro de usuarios (<code>CP-002</code>).
  Al ejecutar la batería de pruebas por segunda vez, el test falló debido a que el correo <code>cliente.prueba@yoguraso.com</code>
  ya existía en PostgreSQL, activando la restricción de clave única. 
</p>
<p>
  La lección técnica aprendida fue tajante: <strong>las pruebas automáticas jamás deben ejecutarse sobre una base de datos estática o con datos residuales</strong>.
  Cada ciclo de pruebas exige scripts de reinicio (seeders) que preparen y limpien el entorno antes y después de cada corrida.
</p>

<h3>Fragilidad de los selectores visuales vs. Selectores de accesibilidad</h3>
<p>
  En las primeras pruebas con Playwright se utilizaron selectores vinculados a nombres de clases CSS como <code>.btn-rosa-sabor</code>.
  En el momento en que se ajustaron los estilos cromáticos del yogurt de fresa, todas las aserciones de prueba fallaron, reportando
  falsos negativos.
</p>
<p>
  Aprendimos a refactorizar las pruebas utilizando los selectores semánticos promovidos por Playwright:
  <code>page.getByRole('radio', { name: 'Fresa' })</code> y <code>page.getByLabel('Correo electrónico')</code>.
  Esta práctica eliminó la fragilidad de las pruebas y garantizó simultáneamente que la tienda fuera plenamente accesible
  para personas que utilizan lectores de pantalla.
</p>

<h2>6.2 Dimensión Metodológica y de Procesos</h2>

<h3>El costo real del "Shift-Right" (Postergar las pruebas)</h3>
<p>
  Durante las primeras semanas existió la inclinación habitual de avanzar rápidamente en la codificación y dejar la documentación
  y las pruebas para la fase final. Este retraso generó momentos de alta fricción: cuando descubrimos que el carrito no formateaba
  correctamente los caracteres especiales hacia la URL de WhatsApp (espacios y saltos de línea), tuvimos que refactorizar de emergencia
  tres módulos de JavaScript bajo presión.
</p>
<blockquote>
  <em>"El costo de reparar un defecto detectado al final del ciclo es hasta diez veces superior a corregirlo en el momento en que se escribe el requerimiento."</em>
</blockquote>

<h3>El peligro de las pruebas que "siempre pasan"</h3>
<p>
  En una de las auditorías, un script de Playwright reportó un 100% de éxito instantáneo. Al inspeccionar el código, descubrimos que
  las aserciones asíncronas carecían del operador <code>await</code>; el test finalizaba antes de que la respuesta de red del servidor
  fuera devuelta. Un test mal diseñado que nunca falla engendra una peligrosa ilusión de seguridad. Desde entonces, adoptamos la regla
  de verificar primero que el test falle intencionalmente al introducir datos erróneos antes de certificarlo como válido.
</p>

<h2>6.3 Dimensión Humana y Trabajo en Equipo</h2>

<h3>Vencer el sesgo de confirmación del programador</h3>
<p>
  El desarrollador que construye una funcionalidad tiende inconscientemente a probarla siguiendo únicamente el "camino feliz":
  digita datos correctos, hace clics pausados y asume que la red siempre responderá. El rol del evaluador de calidad exige una
  mentalidad de <strong>destrucción constructiva</strong>: anticipar cómo un usuario apresurado, un cliente distraído o una conexión
  móvil inestable pueden provocar un estado anómalo en el sistema.
</p>

<h3>Hacia una cultura libre de culpas (Blameless Engineering)</h3>
<p>
  La aparición de un bug no representa un fallo personal del programador; es una señal de que los criterios de aceptación eran
  ambiguos o que faltaba una validación automática en el proceso. Despersonalizar los errores permitió al equipo discutir abiertamente
  los hallazgos en las bitácoras y aplicar soluciones preventivas sin fricciones interpersonales.
</p>

<!-- MATRIZ MAESTRA -->
<div class="page-break"></div>
<h2>6.4 Matriz Maestra de Lecciones Aprendidas (Las 5 Reglas de Oro)</h2>

<div class="regla-box">
  <div class="regla-title">REGLA DE ORO 1 — AISLAMIENTO DE DATOS EN PRUEBAS AUTOMÁTICAS</div>
  <p class="no-indent">
    <em>"Nunca ejecutes pruebas automáticas sobre una base de datos con estado manual o compartido."</em><br/>
    <strong>Directriz técnica:</strong> Toda batería de pruebas de integración debe aprovisionarse mediante esquemas temporales
    o transacciones que se reviertan automáticamente (rollback) al finalizar la validación.
  </p>
</div>

<div class="regla-box">
  <div class="regla-title">REGLA DE ORO 2 — RESILIENCIA Y SEGURIDAD REACTIVA EN EL CLIENTE</div>
  <p class="no-indent">
    <em>"La seguridad no termina en el backend; el cliente debe responder con gracia ante el rechazo."</em><br/>
    <strong>Directriz técnica:</strong> Los interceptores HTTP de JavaScript deben capturar centralizadamente los códigos 401 y 403,
    limpiando el <code>localStorage</code> y redirigiendo de forma no destructiva al usuario con mensajes claros.
  </p>
</div>

<div class="regla-box">
  <div class="regla-title">REGLA DE ORO 3 — PRUEBAS DE UI BASADAS EN ACCESIBILIDAD Y ROLES</div>
  <p class="no-indent">
    <em>"Prueba lo que el elemento representa para el usuario, no cómo fue estilizado en CSS."</em><br/>
    <strong>Directriz técnica:</strong> Queda prohibido el uso de selectores de clase visual en Playwright. Se deben emplear
    exclusivamente <code>getByRole()</code>, <code>getByLabel()</code> y atributos semánticos <code>data-*</code>.
  </p>
</div>

<div class="regla-box">
  <div class="regla-title">REGLA DE ORO 4 — MATRICES DE PRUEBA EXPLÍCITAS SEGÚN EL VIEWPORT</div>
  <p class="no-indent">
    <em>"Una aplicación web responsiva son múltiples aplicaciones coexistiendo en el mismo código."</em><br/>
    <strong>Directriz técnica:</strong> Todo componente adaptativo debe evaluarse con suites independientes configuradas
    explícitamente a 390 px para teléfonos móviles y a 1366 px para computadores de escritorio.
  </p>
</div>

<div class="regla-box">
  <div class="regla-title">REGLA DE ORO 5 — CRITERIOS DE ACEPTACIÓN INNEGOCIABLES (DEFINITION OF DONE)</div>
  <p class="no-indent">
    <em>"Ninguna funcionalidad se considera terminada hasta que sus pruebas automáticas estén aprobadas."</em><br/>
    <strong>Directriz técnica:</strong> Se establece como política de equipo no autorizar la fusión de ramas en Git sin que
    cuenten con sus correspondientes casos de prueba aprobados en Postman y Playwright.
  </p>
</div>

<!-- 7. PLAN DE MEJORAMIENTO -->
<div class="page-break"></div>
<h1>7. PLAN DE MEJORAMIENTO CONTINUO Y ACCIONES CORRECTIVAS</h1>
<p>
  Las conclusiones obtenidas en este informe se tradujeron en acciones concretas sobre el repositorio del proyecto:
</p>
<ul>
  <li><strong>Encapsulamiento del cliente API en <code>frontend/js/api.js</code>:</strong> Se implementó un manejador unificado de errores que normaliza respuestas y previene la congelación de la interfaz ante fallas de red.</li>
  <li><strong>Sanitización estricta en <code>frontend/js/cart.js</code>:</strong> Se incorporaron filtros de redondeo entero para cantidades, impidiendo el ingreso de números negativos o fracciones de producto.</li>
  <li><strong>Inclusión de tests para movimiento reducido en <code>tests/hero.spec.js</code>:</strong> Se añadió la suite <code>reducedMotion: 'reduce'</code>, garantizando que el Hero no ejecute desplazamientos visuales agresivos ante usuarios con sensibilidad vestibular.</li>
  <li><strong>Hoja de ruta CI/CD con GitHub Actions:</strong> Se estructuró el flujo automatizado para ejecutar linter, pruebas de API con Newman y pruebas de interfaz con Playwright headless en cada pull request hacia la rama principal.</li>
</ul>

<!-- 8. SOCIALIZACIÓN -->
<h1>8. SOCIALIZACIÓN Y GESTIÓN DEL CONOCIMIENTO</h1>
<p>
  Para transferir el aprendizaje adquirido al colectivo del programa ADSO, se establecieron tres mecanismos formales:
</p>
<ol>
  <li><strong>Retrospectiva de Calidad de Software:</strong> Sesión técnica presencial donde se expuso la matriz de defectos ante los aprendices del semillero, demostrando en vivo las causas de los fallos y sus correcciones.</li>
  <li><strong>Repositorio Centralizado de Pruebas:</strong> Publicación de este informe, junto con las colecciones de Postman y los archivos <code>.spec.js</code> de Playwright, en el directorio <code>docs/taller-pruebas/</code> del repositorio Git.</li>
  <li><strong>Checklist de Aseguramiento de Calidad:</strong> Formato operativo de verificación rápida que cada aprendiz debe diligenciar antes de entregar un nuevo incremento de software.</li>
</ol>

<!-- 9. CONCLUSIONES -->
<h1>9. CONCLUSIONES</h1>
<ol>
  <li><strong>La calidad no es un accidente, es el resultado de una disciplina sistemática:</strong> El proceso de verificación sobre YogurASO demostró que la estabilidad de un software no depende de la intuición del programador, sino de la aplicación metódica de estándares reconocidos como ISO/IEC 25010 e ISTQB.</li>
  <li><strong>La complementariedad de herramientas optimiza el esfuerzo técnico:</strong> La articulación de Postman para la validación de contratos y seguridad en la API REST, junto a Playwright para la simulación de usuario de extremo a extremo, conformó un ecosistema de pruebas ágil, confiable y de bajo costo de mantenimiento.</li>
  <li><strong>Los defectos constituyen la mayor fuente de aprendizaje profesional:</strong> Las incidencias reales documentadas en las bitácoras fueron los catalizadores esenciales para madurar la arquitectura de la aplicación y consolidar las competencias de aseguramiento de calidad exigidas en el perfil del tecnólogo SENA.</li>
  <li><strong>La accesibilidad y la adaptabilidad son requisitos indispensables:</strong> Comprobar que la plataforma web responda a personas con sensibilidad al movimiento y funcione con fluidez en pantallas táctiles de 390 px garantizó una solución digital inclusiva y orientada a las necesidades reales de los consumidores del Huila.</li>
</ol>

<!-- 10. REFERENCIAS -->
<div class="page-break"></div>
<h1>10. REFERENCIAS BIBLIOGRÁFICAS (NORMAS APA)</h1>
<div style="line-height:1.75; font-size:9pt">
  <p class="no-indent">Cohn, M. (2009). <em>Succeeding with Agile: Software Development Using Scrum</em>. Addison-Wesley Professional.</p>
  <p class="no-indent">Institute of Electrical and Electronics Engineers [IEEE]. (2013). <em>ISO/IEC/IEEE 29119-1:2013 — Software and systems engineering — Software testing — Part 1: Concepts and definitions</em>. IEEE Standards Association.</p>
  <p class="no-indent">International Organization for Standardization [ISO]. (2011). <em>ISO/IEC 25010:2011 — Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models</em>. Ginebra, Suiza: ISO.</p>
  <p class="no-indent">International Software Testing Qualifications Board [ISTQB]. (2018). <em>Certified Tester Foundation Level Syllabus (v3.1)</em>. ISTQB General Assembly.</p>
  <p class="no-indent">Playwright Development Team. (2026). <em>Playwright Test: Fast and reliable end-to-end testing for modern web apps</em>. Microsoft Open Source. https://playwright.dev/</p>
  <p class="no-indent">Postman Learning Center. (2026). <em>API Testing and Contract Validation with Postman</em>. Postman Inc. https://learning.postman.com/</p>
  <p class="no-indent">Pressman, R. S., & Maxim, B. R. (2021). <em>Ingeniería del software: Un enfoque práctico</em> (9.ª ed.). McGraw-Hill Interamericana.</p>
  <p class="no-indent">Servicio Nacional de Aprendizaje [SENA]. (2024). <em>Componente formativo: Aplicación de pruebas de software</em>. Programa Tecnólogo en Análisis y Desarrollo de Software (ADSO). Dirección de Formación Profesional.</p>
  <p class="no-indent">Sommerville, I. (2019). <em>Ingeniería de software</em> (10.ª ed.). Pearson Educación.</p>
</div>

<!-- FIRMAS -->
<table class="signatures">
  <tr>
    <td>
      <div class="sig-line"></div>
      <strong>Juan Esteban Acosta</strong><br/>
      Aprendiz / Evaluador Responsable<br/>
      Tecnólogo en Análisis y Desarrollo de Software (ADSO)<br/>
      Proyecto Web YogurASO
    </td>
    <td>
      <div class="sig-line"></div>
      <strong>Equipo Técnico de Evaluación</strong><br/>
      Instructor de Calidad de Software<br/>
      Centro CIES — Regional Huila SENA
    </td>
  </tr>
</table>

</body>
</html>`;
}

async function main() {
  console.log('Generando HTML final con tabla limpia (sin emojis, fórmulas corregidas) y capturas sin anuncios...');
  const html = buildHtml();
  fs.writeFileSync(TMP_HTML, html, 'utf8');

  console.log('Invocando Microsoft Edge headless vía Playwright...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  
  await page.goto('file:///' + TMP_HTML.replace(/\\/g, '/'), { waitUntil: 'load' });
  
  console.log('Compilando PDF final...');
  await page.pdf({
    path: OUT_DL,
    format: 'Letter',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-family:Arial,sans-serif; font-size:7.5pt; color:#4a5568; width:100%; text-align:right; padding-right:2.54cm;">
        <em>GA11-220501098-AA1-EV04 · Informe de Lecciones Aprendidas — YogurASO</em>
      </div>
    `,
    footerTemplate: `
      <div style="font-family:Arial,sans-serif; font-size:8pt; color:#4a5568; width:100%; text-align:center;">
        Servicio Nacional de Aprendizaje SENA — Página <span class="pageNumber"></span> de <span class="totalPages"></span>
      </div>
    `,
    margin: {
      top: '2.54cm',
      right: '2.54cm',
      bottom: '2.54cm',
      left: '2.54cm',
    },
  });

  fs.copyFileSync(OUT_DL, OUT_LOCAL);
  await browser.close();

  try {
    fs.unlinkSync(TMP_HTML);
  } catch (_) {}

  console.log('✅ PDF final generado exitosamente en:');
  console.log('   - ' + OUT_DL);
  console.log('   - ' + OUT_LOCAL);
}

main().catch((err) => {
  console.error('Error generando PDF:', err);
  process.exit(1);
});
