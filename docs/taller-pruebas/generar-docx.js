/**
 * Genera el documento Word del taller GA9-220501096-AA1-EV01
 * Salida: Descargas/GA9-220501096-AA1-EV01_Taller_Pruebas_YogurASO.docx
 */
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  PageBreak, ImageRun, BorderStyle, Header, Footer, PageNumber
} = require('docx');
const fs = require('fs');
const path = require('path');

const EVIDENCIAS = path.join(__dirname, 'evidencias');
const OUT = path.join(process.env.USERPROFILE || process.env.HOME, 'Downloads', 'GA9-220501096-AA1-EV01_Taller_Pruebas_YogurASO.docx');

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 200, line: 276 },
    alignment: opts.align || AlignmentType.JUSTIFIED,
    ...opts.para,
    children: [
      new TextRun({
        text,
        font: 'Times New Roman',
        size: opts.size || 24, // 12pt
        bold: !!opts.bold,
        italics: !!opts.italics
      })
    ]
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, font: 'Times New Roman', size: 28, bold: true })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, font: 'Times New Roman', size: 26, bold: true })]
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 220, after: 120 },
    children: [new TextRun({ text, font: 'Times New Roman', size: 24, bold: true })]
  });
}

function bullet(text) {
  return new Paragraph({
    spacing: { after: 120, line: 276 },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: 720 },
    children: [new TextRun({ text: `• ${text}`, font: 'Times New Roman', size: 24 })]
  });
}

function caption(text) {
  return new Paragraph({
    spacing: { before: 80, after: 240 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text, font: 'Times New Roman', size: 20, italics: true })]
  });
}

function imageBlock(fileName, captionText, width = 520, height = 320) {
  const full = path.join(EVIDENCIAS, fileName);
  if (!fs.existsSync(full)) {
    return [p(`[Falta evidencia: ${fileName}]`, { italics: true, align: AlignmentType.CENTER })];
  }
  const data = fs.readFileSync(full);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 160, after: 60 },
      children: [
        new ImageRun({
          type: 'png',
          data,
          transformation: { width, height },
          altText: { title: fileName, description: captionText || fileName, name: fileName }
        })
      ]
    }),
    caption(captionText)
  ];
}

function coverLine(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: opts.after ?? 120 },
    children: [new TextRun({
      text,
      font: 'Times New Roman',
      size: opts.size || 24,
      bold: !!opts.bold
    })]
  });
}

async function build() {
  let reporte = { resultados: [] };
  const reportePath = path.join(EVIDENCIAS, 'reporte_pruebas.json');
  if (fs.existsSync(reportePath)) {
    reporte = JSON.parse(fs.readFileSync(reportePath, 'utf8'));
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          styles: [{
            id: 'Normal',
            run: { font: 'Times New Roman', size: 24 }
          }]
        }
      }
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } // ~2cm
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({
              text: 'GA9-220501096-AA1-EV01 | YogurASO',
              font: 'Times New Roman',
              size: 18,
              italics: true,
              color: '666666'
            })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Página ', font: 'Times New Roman', size: 18 }),
              new TextRun({ children: [PageNumber.CURRENT], font: 'Times New Roman', size: 18 }),
              new TextRun({ text: ' de ', font: 'Times New Roman', size: 18 }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Times New Roman', size: 18 })
            ]
          })]
        })
      },
      children: [
        // ===== PORTADA =====
        coverLine('SERVICIO NACIONAL DE APRENDIZAJE – SENA', { bold: true, size: 28, after: 200 }),
        coverLine('Formación Titulada', { after: 80 }),
        coverLine('GFPI-F-135 V01', { after: 400 }),
        coverLine('EVIDENCIA DE CONOCIMIENTO', { bold: true, size: 26, after: 120 }),
        coverLine('GA9-220501096-AA1-EV01', { bold: true, size: 26, after: 120 }),
        coverLine('Taller sobre codificación de módulos del software', { bold: true, size: 26, after: 80 }),
        coverLine('(Componente formativo: las pruebas de software)', { size: 22, after: 400 }),
        coverLine('Proyecto formativo / solución de software:', { after: 80 }),
        coverLine('YogurASO – Tienda web de yogurt artesanal', { bold: true, size: 26, after: 80 }),
        coverLine('Frontend: HTML5, CSS3 y JavaScript | Backend: Node.js + Express | BD: PostgreSQL', { size: 20, after: 400 }),
        coverLine('Aprendiz: ________________________________', { after: 120 }),
        coverLine('Ficha: ________________________________', { after: 120 }),
        coverLine('Instructor: ________________________________', { after: 120 }),
        coverLine('Fecha: agosto de 2026', { after: 200 }),
        coverLine('Centro de formación: ________________________', { after: 80 }),

        new Paragraph({ children: [new PageBreak()] }),

        // ===== INTRODUCCIÓN =====
        h1('1. Introducción'),
        p('Una solución de software es un conjunto de elementos enfocados al tratamiento y administración de datos e información, los cuales deben estar organizados y preparados para cumplir objetivos específicos. En este contexto, las pruebas de software constituyen una actividad esencial del ciclo de vida del desarrollo, porque permiten verificar que el sistema funcione según lo esperado, detectar defectos de manera temprana y reducir riesgos antes de la entrega al usuario final.'),
        p('El presente taller corresponde a la evidencia de conocimiento GA9-220501096-AA1-EV01 y se desarrolla a partir del componente formativo “las pruebas de software”. El documento responde a las preguntas orientadoras del taller, profundiza con fuentes académicas y técnicas, y aplica los conceptos al proyecto real YogurASO, una tienda web de yogurt artesanal con catálogo de productos, carrito local, autenticación JWT, panel administrador y checkout por WhatsApp.'),
        p('YogurASO está organizado en dos capas principales: el frontend (carpeta frontend/), construido con HTML, CSS y JavaScript vanilla; y el backend (carpeta backend/), implementado con Node.js y Express, conectado a PostgreSQL. Esta arquitectura modular facilita identificar qué tipos de pruebas resultan más pertinentes y sobre qué archivos o módulos conviene enfocarlas.'),
        p('El objetivo de este trabajo es: (1) explicar los tipos de pruebas de software y sus beneficios; (2) seleccionar los tipos de prueba más adecuados para YogurASO; (3) investigar e instalar una herramienta de pruebas; (4) ejecutar pruebas básicas con evidencias fotográficas; y (5) presentar un resumen crítico de los resultados, con las respectivas conclusiones.'),

        // ===== TIPOS DE PRUEBAS =====
        h1('2. ¿Qué tipos de pruebas de software existen? Características y beneficios'),
        p('Las pruebas de software se pueden clasificar según su nivel (unidad, integración, sistema, aceptación), según su conocimiento del código (caja blanca, caja negra y caja gris) y según su propósito (funcionales, no funcionales, regresión, humo, etc.). A continuación se describen los tipos más relevantes para un proyecto web como YogurASO.'),

        h2('2.1. Pruebas unitarias (Unit Testing)'),
        p('Evalúan el comportamiento de la unidad más pequeña del software: una función, un método o un módulo aislado. En YogurASO, por ejemplo, podrían aplicarse a funciones de frontend/js/cart.js (cálculo de totales) o a validaciones de email/contraseña en backend/src/controllers/authController.js.'),
        p('Características: se ejecutan de forma automática y rápida; suelen usar mocks o stubs para aislar dependencias; requieren conocimiento del código (enfoque de caja blanca).'),
        p('Beneficios: detectan errores temprano, facilitan el mantenimiento, documentan el comportamiento esperado de cada función y permiten refactorizar con mayor seguridad.'),

        h2('2.2. Pruebas de integración'),
        p('Verifican que varios módulos trabajen correctamente al combinarse. En YogurASO aplica, por ejemplo, a la integración entre productRoutes.js, productController.js y la conexión PostgreSQL en src/config/db.js, o entre frontend/js/api.js y los endpoints /api/auth y /api/products.'),
        p('Características: comprueban interfaces, contratos de API y flujo de datos entre capas; pueden usar base de datos de prueba o contenedores.'),
        p('Beneficios: revelan fallos que no aparecen en pruebas unitarias aisladas (por ejemplo, errores de formato JSON, CORS, JWT inválido o consultas SQL incorrectas).'),

        h2('2.3. Pruebas de sistema'),
        p('Evalúan la aplicación completa como un todo, en un entorno similar al de producción. Incluyen flujos completos: ver catálogo, iniciar sesión, administrar productos o usar el carrito.'),
        p('Características: se centran en requisitos funcionales de punta a punta; pueden ser manuales o automatizadas con herramientas de UI.'),
        p('Beneficios: dan una visión real del comportamiento del producto y ayudan a validar que la solución cumple su objetivo de negocio.'),

        h2('2.4. Pruebas de aceptación (UAT)'),
        p('Las realiza el cliente, el instructor o un usuario final para confirmar que el sistema satisface las necesidades acordadas. En YogurASO, un administrador validaría el panel admin.html y un cliente validaría catálogo, carrito y contacto por WhatsApp.'),
        p('Características: se basan en criterios de aceptación y escenarios de uso real; suelen ser de caja negra.'),
        p('Beneficios: aumentan la confianza en la entrega y reducen rechazos al finalizar el proyecto.'),

        h2('2.5. Pruebas funcionales (caja negra)'),
        p('Comprueban qué hace el sistema frente a entradas y salidas, sin analizar el código interno. Ejemplos: login con credenciales correctas/incorrectas; GET /api/products debe retornar listado; un usuario no admin no puede crear productos.'),
        p('Características: se diseñan a partir de requisitos y casos de uso; no requieren leer el código fuente.'),
        p('Beneficios: validan el cumplimiento de reglas de negocio y son fáciles de comunicar a stakeholders no técnicos.'),

        h2('2.6. Pruebas de caja blanca'),
        p('Se diseñan con conocimiento interno del código: rutas, condiciones, bucles y excepciones. En YogurASO permitirían cubrir ramas de verificarToken, verificarAdmin y optionalAuth en backend/src/middleware/verifyToken.js.'),
        p('Características: miden cobertura de código; se apoyan en pruebas unitarias y de integración.'),
        p('Beneficios: descubren caminos no probados y errores lógicos ocultos.'),

        h2('2.7. Pruebas de regresión'),
        p('Se vuelven a ejecutar después de un cambio (nuevo módulo, corrección o mejora) para asegurar que lo que ya funcionaba sigue funcionando.'),
        p('Características: idealmente automatizadas; se ejecutan en cada iteración o antes de un despliegue.'),
        p('Beneficios: evitan que una corrección en auth rompa, por ejemplo, el listado de productos o el panel admin.'),

        h2('2.8. Pruebas de humo (Smoke) y de sanidad (Sanity)'),
        p('Las de humo verifican que las funciones críticas arrancan (API responde, home carga, base de datos conecta). Las de sanidad revisan un cambio puntual de forma rápida.'),
        p('Características: son breves, selectivas y de bajo costo.'),
        p('Beneficios: ahorran tiempo al detectar fallos graves antes de una batería completa de pruebas.'),

        h2('2.9. Pruebas no funcionales'),
        p('Evalúan atributos de calidad más allá de la función: rendimiento, seguridad, usabilidad, compatibilidad y disponibilidad. En YogurASO son relevantes por el uso de JWT, bcrypt, rate limiting (rateLimit.js) y subida de imágenes con Multer.'),
        bullet('Rendimiento: tiempo de respuesta de /api/products y carga del frontend.'),
        bullet('Seguridad: protección de rutas admin, caducidad de token, validación de archivos en upload.'),
        bullet('Usabilidad: claridad de formularios en login.html y registro.html.'),
        bullet('Compatibilidad: comportamiento en distintos navegadores y resoluciones.'),
        p('Beneficios: elevan la calidad percibida y reducen riesgos de ataques, lentitud o mala experiencia de usuario.'),

        h2('2.10. Pruebas de interfaz de usuario (UI) y end-to-end (E2E)'),
        p('Simulan la interacción de un usuario real sobre el navegador: navegación entre páginas, diligenciamiento de formularios y visualización de componentes. Herramientas como Playwright, Cypress o Selenium automatizan este proceso y generan capturas de evidencia.'),
        p('Beneficios: validan la experiencia completa y producen evidencia visual útil para informes académicos y de calidad.'),

        // ===== ADAPTACIÓN AL PROYECTO =====
        h1('3. Tipos de pruebas que mejor se adaptan al proyecto YogurASO'),
        p('Tras analizar la arquitectura del proyecto (frontend estático modular + API REST + PostgreSQL), se priorizan los siguientes tipos de prueba por su pertinencia, costo y valor diagnóstico:'),

        h3('3.1. Pruebas de humo / sanidad'),
        p('Permiten confirmar rápidamente que el servidor Express responde (por ejemplo GET /api/health y GET /), que PostgreSQL está conectada y que las páginas principales del frontend cargan sin error. Son el primer filtro antes de pruebas más profundas.'),

        h3('3.2. Pruebas funcionales de API (caja negra)'),
        p('YogurASO concentra la lógica de negocio en el backend. Por ello conviene probar:'),
        bullet('Autenticación: POST /api/auth/login, POST /api/auth/registro y GET /api/auth/perfil (archivo authRoutes.js + authController.js).'),
        bullet('Productos: GET/POST /api/products y GET/PUT/DELETE /api/products/:id (productRoutes.js + productController.js).'),
        bullet('Autorización: un cliente no debe crear/editar/eliminar productos; solo un admin con JWT válido (middlewares verificarToken y verificarAdmin).'),
        p('Estas pruebas se adaptan muy bien porque los endpoints están claramente definidos y devuelven JSON verificable.'),

        h3('3.3. Pruebas de UI / E2E sobre el frontend'),
        p('El usuario final interactúa con páginas HTML. Por eso es necesario verificar visual y funcionalmente: index.html, pages/productos.html, pages/carrito.html, pages/login.html, pages/registro.html y pages/admin.html, además de la coherencia de estilos en css/styles.css y la configuración en js/config.js.'),

        h3('3.4. Pruebas de integración frontend–backend'),
        p('El módulo frontend/js/api.js es el puente con la API. Se debe validar que las rutas, cabeceras Authorization y manejo de errores coincidan con lo expuesto por Express.'),

        h3('3.5. Pruebas de seguridad básicas'),
        p('Dado que existen roles (cliente/admin), hash de contraseñas con bcrypt, JWT y rate limit, conviene incluir casos negativos: token ausente, token inválido, usuario no admin intentando upload, y carga de archivos no permitidos.'),

        h3('3.6. Pruebas unitarias selectivas'),
        p('Aunque el proyecto no trae suite unitaria previa, se recomienda a futuro cubrir utilidades de carrito (cart.js) y validaciones del controlador de autenticación. No son la prioridad inmediata frente a humo, API y UI, pero sí aportan sostenibilidad.'),

        p('En síntesis, para el estado actual de YogurASO la estrategia más adecuada combina: humo + pruebas funcionales de API + pruebas UI/E2E, complementadas con chequeos de seguridad en middlewares. Esa combinación equilibra cobertura y esfuerzo, y es coherente con un MVP académico-productivo.'),

        // ===== HERRAMIENTA =====
        h1('4. Herramienta de pruebas seleccionada e instalación'),
        h2('4.1. Investigación y justificación'),
        p('Se investigaron herramientas comunes para pruebas de software web: Postman/Newman (API), Jest (unitarias), Selenium, Cypress y Playwright (UI/E2E). Para este taller se eligió Playwright por las siguientes razones:'),
        bullet('Permite automatizar pruebas en navegador real (Chromium) sobre el frontend de YogurASO.'),
        bullet('Genera capturas de pantalla de cada caso, ideales como anexo de evidencia.'),
        bullet('Se instala y ejecuta con Node.js, stack ya usado en el backend del proyecto.'),
        bullet('Soporta esperas automáticas, navegación y llenado de formularios, alineado a pruebas básicas de sistema/UI.'),
        p('Playwright es mantenido por Microsoft y se utiliza ampliamente en la industria para pruebas end-to-end modernas. Complementariamente, el análisis teórico incluye Postman como opción recomendada para profundizar pruebas de API en una siguiente iteración.'),

        h2('4.2. Instalación realizada en el computador'),
        p('En la carpeta docs/taller-pruebas del proyecto se inicializó un entorno Node.js y se instalaron las dependencias necesarias con npm. El proceso general fue:'),
        bullet('Crear el directorio de trabajo del taller y ejecutar npm init.'),
        bullet('Instalar paquetes: npm install playwright docx'),
        bullet('Descargar el navegador de pruebas: npx playwright install chromium'),
        bullet('Crear el script run-ui-tests.js para ejecutar casos básicos y guardar evidencias en docs/taller-pruebas/evidencias/.'),
        p('Con ello queda demostrada la instalación y puesta en marcha de una herramienta de pruebas de software “a gusto” del aprendiz, aplicada directamente sobre la solución YogurASO.'),

        // ===== PRUEBAS REALIZADAS =====
        h1('5. Ejecución de pruebas básicas sobre YogurASO'),
        p('Se diseñó una batería de pruebas de humo y de interfaz sobre las páginas del frontend. Un servidor estático local sirvió la carpeta frontend/ y Playwright (Chromium en modo headless) navegó cada vista, validó elementos clave y tomó capturas de pantalla.'),
        p('Alcance de las pruebas ejecutadas:'),
        bullet('P1. Carga de la página de inicio (frontend/index.html).'),
        bullet('P2. Visualización del catálogo (frontend/pages/productos.html) y presencia del buscador.'),
        bullet('P3. Disponibilidad del formulario de login (frontend/pages/login.html).'),
        bullet('P4. Disponibilidad del formulario de registro (frontend/pages/registro.html).'),
        bullet('P5. Renderizado de la vista de carrito (frontend/pages/carrito.html).'),
        bullet('P6. Renderizado del panel administrador (frontend/pages/admin.html).'),
        bullet('P7. Interacción básica con el formulario de login (ingreso de datos de prueba).'),
        bullet('P8. Acceso a la página de error 404 (frontend/404.html).'),

        h2('5.1. Resultados obtenidos'),
        ...((reporte.resultados || []).length
          ? reporte.resultados.map((r) => p(`Caso P${r.id} — ${r.nombre}: ${r.ok ? 'PASS (exitoso)' : 'FAIL (fallido)'}. Detalle: ${r.detalle}.`))
          : [p('Los resultados detallados se consolidaron en evidencias/reporte_pruebas.json tras la ejecución del script.')]),

        h2('5.2. Anexos fotográficos del proceso'),
        p('A continuación se anexan las capturas de pantalla generadas automáticamente por Playwright durante la ejecución de las pruebas. Cada imagen evidencia el estado de la interfaz en el momento de la verificación.'),
        ...imageBlock('01_inicio_home.png', 'Figura 1. Prueba P1 — Carga de la página de inicio (index.html).', 500, 300),
        ...imageBlock('02_catalogo_productos.png', 'Figura 2. Prueba P2 — Catálogo de productos (productos.html).', 500, 300),
        ...imageBlock('03_login.png', 'Figura 3. Prueba P3 — Formulario de inicio de sesión (login.html).', 500, 300),
        ...imageBlock('04_registro.png', 'Figura 4. Prueba P4 — Formulario de registro (registro.html).', 500, 300),
        ...imageBlock('05_carrito.png', 'Figura 5. Prueba P5 — Vista del carrito (carrito.html).', 500, 300),
        ...imageBlock('06_admin.png', 'Figura 6. Prueba P6 — Panel de administración (admin.html).', 500, 300),
        ...imageBlock('07_login_datos_prueba.png', 'Figura 7. Prueba P7 — Interacción con datos de prueba en login.', 480, 280),
        ...imageBlock('08_pagina_404.png', 'Figura 8. Prueba P8 — Página 404.', 500, 300),

        // ===== RESUMEN =====
        h1('6. Resumen de las pruebas realizadas'),
        p('Se instaló Playwright con navegador Chromium y se ejecutaron ocho pruebas básicas orientadas a humo, sanidad y UI sobre el frontend de YogurASO. Las pruebas confirmaron que las páginas principales del sistema se sirven correctamente, que los formularios de autenticación están presentes y que las vistas de catálogo, carrito, administración y error 404 renderizan de forma estable.'),
        p('Desde el punto de vista del taller, este ejercicio demuestra la aplicación práctica del componente formativo de pruebas de software: no solo se consultó la teoría de tipos de prueba, sino que se seleccionó una herramienta, se instaló en el equipo, se automatizó un conjunto mínimo de casos y se documentó con evidencias.'),
        p('Limitaciones y trabajo futuro: en esta corrida el enfoque principal fue UI/frontend porque permite evidencia visual clara. Como mejora continua se recomienda: (a) levantar el backend y PostgreSQL para pruebas funcionales de /api/auth y /api/products con Postman o Playwright request; (b) agregar pruebas negativas de seguridad sobre middlewares; (c) incorporar pruebas unitarias a cart.js y validaciones de authController.js; y (d) integrar la suite en un script npm test dentro del repositorio.'),
        p('Hallazgo general: la modularización del proyecto (routes, controllers, middleware, js por responsabilidad y pages por pantalla) facilita diseñar casos de prueba trazables a archivos concretos, lo cual fortalece la calidad del software y la claridad de la evidencia académica.'),

        // ===== CONCLUSIONES =====
        h1('7. Conclusiones'),
        p('Las pruebas de software son indispensables para asegurar que una solución cumpla sus objetivos de tratamiento y administración de información. Conocer sus tipos —unitarias, integración, sistema, aceptación, funcionales, no funcionales, regresión, humo y UI/E2E— permite elegir la estrategia correcta según el contexto del proyecto.'),
        p('Para YogurASO, por ser una aplicación web con API REST, autenticación JWT y un frontend por páginas, las pruebas más pertinentes en esta etapa son las de humo, las funcionales de API y las de interfaz de usuario. Esta selección responde a la arquitectura real del repositorio y a los riesgos más críticos del MVP (disponibilidad de pantallas, autenticación y gestión de productos).'),
        p('La instalación y uso de Playwright evidenció que es viable automatizar verificaciones básicas y generar anexos fotográficos de calidad para un entregable académico. El proceso cumplió los elementos solicitados por la guía GA9-220501096-AA1-EV01 / GFPI-F-135 V01: indagación teórica, adaptación al proyecto, instalación de herramienta, ejecución de pruebas con capturas, resumen y estructura formal del documento (portada, introducción y conclusiones).'),
        p('Finalmente, se concluye que codificar módulos no termina al escribir el código: la calidad se consolida cuando cada módulo —rutas, controladores, middlewares, páginas y scripts— puede demostrarse mediante pruebas observables, repetibles y documentadas.'),

        // ===== REFERENCIAS =====
        h1('8. Referencias'),
        p('ISTQB. (s. f.). Foundation Level Syllabus. International Software Testing Qualifications Board.', { align: AlignmentType.LEFT }),
        p('Microsoft. (s. f.). Playwright documentation. https://playwright.dev/', { align: AlignmentType.LEFT }),
        p('Pressman, R. S., & Maxim, B. R. (2015). Software Engineering: A Practitioner’s Approach. McGraw-Hill.', { align: AlignmentType.LEFT }),
        p('Sommerville, I. (2011). Software Engineering (9.ª ed.). Addison-Wesley.', { align: AlignmentType.LEFT }),
        p('SENA. Evidencia de conocimiento GA9-220501096-AA1-EV01 – Taller sobre codificación de módulos del software. GFPI-F-135 V01.', { align: AlignmentType.LEFT }),
        p('Proyecto YogurASO-WEB. Repositorio local de la solución (frontend/, backend/, database/).', { align: AlignmentType.LEFT })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUT, buffer);
  console.log('Documento generado:', OUT);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
