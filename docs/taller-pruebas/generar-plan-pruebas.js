/**
 * Completa AA1_EV02 Plan de Pruebas — solo campos amarillos del PDF plantilla,
 * adaptados a YogurASO + Playwright + Postman (evidencia previa).
 */
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  PageBreak, Header, Footer, PageNumber, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType
} = require('docx');
const fs = require('fs');
const path = require('path');

const OUT = path.join(
  process.env.USERPROFILE,
  'Downloads',
  'AA1_EV02_Plan_de_Pruebas_YogurASO_Completado.docx'
);

const border = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
const borders = { top: border, bottom: border, left: border, right: border };

function t(text, opts = {}) {
  return new TextRun({
    text,
    font: 'Times New Roman',
    size: opts.size || 24,
    bold: !!opts.bold,
    italics: !!opts.italics,
    highlight: opts.highlight || undefined
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 160, line: 276 },
    alignment: opts.align || AlignmentType.JUSTIFIED,
    children: [t(text, opts)]
  });
}

function mixed(...runs) {
  return new Paragraph({
    spacing: { after: 160, line: 276 },
    alignment: AlignmentType.JUSTIFIED,
    children: runs.map((r) => (typeof r === 'string' ? t(r) : t(r.text, r)))
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 280, after: 140 },
    children: [t(text, { bold: true, size: 26 })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 220, after: 120 },
    children: [t(text, { bold: true, size: 24 })]
  });
}

function bullet(label, rest) {
  return new Paragraph({
    spacing: { after: 100, line: 276 },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: 360 },
    children: [
      t(`• ${label}`, { bold: true }),
      t(rest ? ` ${rest}` : '')
    ]
  });
}

function center(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: opts.after ?? 120 },
    children: [t(text, opts)]
  });
}

function cell(text, opts = {}) {
  return new TableCell({
    borders,
    width: { size: opts.width || 2340, type: WidthType.DXA },
    shading: opts.shading ? { type: ShadingType.CLEAR, fill: opts.shading } : undefined,
    children: [new Paragraph({
      spacing: { after: 40, before: 40 },
      children: [t(text, { bold: !!opts.bold, size: opts.size || 18 })]
    })]
  });
}

function checkRow(id, caso, esperado) {
  return new TableRow({
    children: [
      cell(id, { width: 700 }),
      cell(caso, { width: 3200 }),
      cell(esperado, { width: 2800 }),
      cell('☐', { width: 700 }),
      cell('', { width: 1600 })
    ]
  });
}

async function build() {
  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 1008, bottom: 1008, left: 1008, right: 1008 } }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [t('AA1-EV02 | Plan de pruebas — YogurASO', { size: 16, italics: true })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              t('Página ', { size: 16 }),
              new TextRun({ children: [PageNumber.CURRENT], font: 'Times New Roman', size: 16 }),
              t(' de ', { size: 16 }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Times New Roman', size: 16 })
            ]
          })]
        })
      },
      children: [
        // ===== PORTADA (amarillo: Nombre Proyecto) =====
        center('SERVICIO NACIONAL DE APRENDIZAJE – SENA', { bold: true, size: 26, after: 200 }),
        center('AA1-EV02 – Plan de Pruebas', { bold: true, size: 24, after: 360 }),

        // Campo amarillo 1 (portada)
        mixed(
          { text: 'Plan de pruebas del proyecto: “', bold: true, size: 28 },
          { text: 'YogurASO – Tienda web de yogurt artesanal', bold: true, size: 28, highlight: 'yellow' },
          { text: '”', bold: true, size: 28 }
        ),

        new Paragraph({ spacing: { after: 200 }, children: [] }),
        center('Nombres integrantes: ________________________________', { after: 140 }),
        center('Nombre de la institución: ______________________________', { after: 140 }),
        center('Ciudad: ______________________________________________', { after: 140 }),
        center('Año: 2026', { after: 200 }),

        new Paragraph({ children: [new PageBreak()] }),

        // TOC
        h1('Tabla de contenido'),
        p('1. Introducción', { align: AlignmentType.LEFT }),
        p('2. Alcance', { align: AlignmentType.LEFT }),
        p('3. Estrategia de Pruebas', { align: AlignmentType.LEFT }),
        p('4. Detalles de la Estrategia de Pruebas', { align: AlignmentType.LEFT }),
        p('    4.1. Pruebas Unitarias', { align: AlignmentType.LEFT }),
        p('    4.2. Pruebas de Integración', { align: AlignmentType.LEFT }),
        p('    4.3. Pruebas de Aceptación/Funcionales', { align: AlignmentType.LEFT }),
        p('    4.4. Pruebas End-to-End (E2E)', { align: AlignmentType.LEFT }),
        p('5. Criterios de Aceptación', { align: AlignmentType.LEFT }),
        p('6. Ambiente de Pruebas', { align: AlignmentType.LEFT }),
        p('7. Planificación de Pruebas', { align: AlignmentType.LEFT }),
        p('8. Recursos y Herramientas', { align: AlignmentType.LEFT }),
        p('9. Riesgos y Mitigación', { align: AlignmentType.LEFT }),
        p('10. Comunicación y Reportes', { align: AlignmentType.LEFT }),
        p('11. Lista de chequeo de pruebas', { align: AlignmentType.LEFT }),
        p('Conclusiones', { align: AlignmentType.LEFT }),

        new Paragraph({ children: [new PageBreak()] }),

        // 1. Introducción — amarillo: nombre del proyecto
        h1('1. Introducción'),
        mixed(
          'Este documento describe el plan de pruebas para el proyecto ',
          { text: '“YogurASO – Tienda web de yogurt artesanal”', highlight: 'yellow', bold: true },
          '. Se utilizará la Pirámide de Pruebas para garantizar una estrategia de pruebas equilibrada y eficiente. YogurASO cuenta con frontend en HTML/CSS/JavaScript (carpeta frontend/), backend Node.js + Express (backend/) y base de datos PostgreSQL (database/schema.sql), con autenticación JWT, catálogo de productos, carrito local, panel administrador y checkout por WhatsApp.'
        ),

        h1('2. Alcance'),
        p('El alcance de las pruebas incluye pruebas unitarias, pruebas de integración, pruebas de aceptación y pruebas end-to-end para la aplicación web YogurASO, cubriendo especialmente: autenticación (/api/auth), productos (/api/products), middlewares de seguridad, páginas del frontend y la comunicación frontend–backend mediante frontend/js/api.js.'),

        h1('3. Estrategia de Pruebas'),
        p('La estrategia de pruebas se basará en la Pirámide de Pruebas, que se estructura de la siguiente manera:'),
        bullet('Pruebas Unitarias', '(Base de la pirámide)'),
        bullet('Pruebas de Integración', '(Capa intermedia)'),
        bullet('Pruebas de Aceptación/Funcionales', '(Capa superior)'),
        bullet('Pruebas End-to-End', '(Pico de la pirámide)'),

        h1('4. Detalles de la Estrategia de Pruebas'),

        h2('4.1. Pruebas Unitarias'),
        bullet('Objetivo:', 'Verificar que cada unidad individual de código (funciones, métodos, clases) funcione correctamente.'),
        bullet('Herramientas:', 'Jest (para JavaScript/Node.js del backend y utilidades del frontend).'),
        bullet('Descripción casos a probar:', 'Validaciones de authController.js (email/password), cálculo de totales en frontend/js/cart.js, y respuestas de helpers en utils.js.'),
        bullet('Responsabilidad:', 'Desarrolladores.'),
        bullet('Cobertura:', 'Se espera una cobertura de pruebas de al menos el 80% del código crítico (auth, productos, carrito).'),

        h2('4.2. Pruebas de Integración'),
        bullet('Objetivo:', 'Validar la interacción entre múltiples unidades de código, como componentes, módulos o servicios.'),
        bullet('Herramientas:', 'Postman (colecciones de API) y Mocha/supertest (opcional para Node.js).'),
        bullet('Descripción casos a probar:', 'Comunicación PostgreSQL ↔ backend (db.js), endpoints de authRoutes.js y productRoutes.js, y consumo desde frontend/js/api.js.'),
        bullet('Responsabilidad:', 'Equipo de QA y desarrolladores.'),
        bullet('Áreas clave:', 'Integración de la base de datos, API REST (/api/health, /api/auth, /api/products) y middlewares verifyToken.js / rateLimit.js.'),

        h2('4.3. Pruebas de Aceptación/Funcionales'),
        bullet('Objetivo:', 'Validar que el sistema cumple con los requisitos funcionales especificados.'),
        bullet('Herramientas:', 'Postman (API) y Playwright (interfaz de usuario).'),
        bullet('Descripción casos a probar:', 'Formularios de login.html y registro.html; CRUD de productos en admin.html; listado y búsqueda en productos.html; carrito en carrito.html.'),
        bullet('Responsabilidad:', 'Equipo de QA con participación de los interesados clave.'),
        bullet('Áreas clave:', 'Inicio de sesión, registro, gestión CRUD de productos (admin), catálogo y flujo de compra vía WhatsApp.'),

        h2('4.4. Pruebas End-to-End (E2E)'),
        bullet('Objetivo:', 'Verificar el flujo completo del sistema de extremo a extremo, asegurando que el sistema funcione como un todo.'),
        // Campo amarillo 3 (herramientas E2E)
        mixed(
          { text: '• Herramientas: ', bold: true },
          { text: 'Playwright (UI/E2E) y Postman (API).', highlight: 'yellow', bold: true }
        ),
        bullet('Descripción casos a probar:', 'Funcionamiento total de la aplicación desde la interfaz (páginas HTML) hacia el backend Express y la base de datos PostgreSQL.'),
        bullet('Responsabilidad:', 'Equipo de QA / aprendiz desarrollador.'),
        bullet('Áreas clave:', 'Registro de usuario, inicio de sesión, consulta de productos, uso del carrito, acceso al panel admin y manejo de página 404.'),

        h1('5. Criterios de Aceptación'),
        bullet('Pruebas Unitarias:', 'Todas las pruebas deben pasar y la cobertura de código crítico debe ser al menos del 80%.'),
        bullet('Pruebas de Integración:', 'Todas las pruebas deben pasar, especialmente las de API REST y conexión a PostgreSQL.'),
        bullet('Pruebas de Aceptación:', 'Todos los casos de uso principales deben ser validados (login, catálogo, carrito, admin).'),
        bullet('Pruebas E2E:', 'Los flujos críticos deben ser completamente funcionales sin errores bloqueantes.'),

        h1('6. Ambiente de Pruebas'),
        bullet('Entorno de Desarrollo:', 'Pruebas unitarias y de integración. Backend en http://localhost:3000; frontend con servidor estático (p. ej. puerto 5505 / Live Server).'),
        bullet('Entorno de Staging / local integrado:', 'Pruebas de aceptación, Postman sobre /api/* y end-to-end con Playwright sobre las páginas de frontend/.'),

        h1('7. Planificación de Pruebas'),
        bullet('Fase de Desarrollo:', 'Implementación de pruebas unitarias y de integración (API con Postman).'),
        bullet('Fase de Pre-Lanzamiento:', 'Pruebas de aceptación y end-to-end con Playwright (capturas de evidencia).'),
        bullet('Post-Lanzamiento:', 'Monitoreo y pruebas de regresión sobre auth, productos y vistas principales.'),

        h1('8. Recursos y Herramientas'),
        bullet('Recursos Humanos:', 'Aprendiz desarrollador, instructor / interesados clave.'),
        bullet('Herramientas:', 'Jest (unitarias), Postman (API), Playwright (UI/E2E), Node.js, PostgreSQL, navegador Chromium de Playwright.'),

        h1('9. Riesgos y Mitigación'),
        bullet('Riesgo:', 'Falta de cobertura de pruebas en áreas críticas (auth JWT y CRUD admin).'),
        p('Mitigación: Revisión y ampliación de casos de prueba en Postman; automatización de regresiones UI con Playwright.'),
        bullet('Riesgo:', 'Falla de integración frontend–backend (CORS, API_URL en config.js, token expirado).'),
        p('Mitigación: Pruebas frecuentes de /api/health y colecciones Postman; verificación de cabecera Authorization.'),
        bullet('Riesgo:', 'Base de datos no disponible durante la ejecución de pruebas.'),
        p('Mitigación: Validar conexión en arranque del server.js; usar datos de prueba controlados en PostgreSQL.'),

        h1('10. Comunicación y Reportes'),
        bullet('Frecuencia:', 'Reportes al finalizar cada batería de pruebas (Postman / Playwright) y durante la fase intensiva de QA.'),
        bullet('Formato:', 'Informe de progreso de pruebas, lista de defectos, evidencias (capturas Playwright) y métricas de casos PASS/FAIL.'),

        // Campo amarillo 4 — Diseño lista de chequeo (completo)
        h1('11. Lista de chequeo de pruebas (diseño de formato)'),
        mixed(
          'A continuación se presenta el ',
          { text: 'diseño de formato Lista de chequeo', highlight: 'yellow', bold: true },
          ' adaptado a YogurASO, para registrar la ejecución de pruebas con Postman (API) y Playwright (UI/E2E).'
        ),

        new Paragraph({
          spacing: { before: 160, after: 80 },
          children: [t('A) Lista de chequeo – API (Postman)', { bold: true, size: 24 })]
        }),

        new Table({
          width: { size: 9000, type: WidthType.DXA },
          rows: [
            new TableRow({
              children: [
                cell('ID', { bold: true, shading: 'FFF2CC', width: 700 }),
                cell('Caso de prueba', { bold: true, shading: 'FFF2CC', width: 3200 }),
                cell('Resultado esperado', { bold: true, shading: 'FFF2CC', width: 2800 }),
                cell('OK', { bold: true, shading: 'FFF2CC', width: 700 }),
                cell('Observación', { bold: true, shading: 'FFF2CC', width: 1600 })
              ]
            }),
            checkRow('API-01', 'GET /api/health', 'success: true y database connected'),
            checkRow('API-02', 'POST /api/auth/registro', 'Usuario creado o mensaje de validación claro'),
            checkRow('API-03', 'POST /api/auth/login', 'Retorna token JWT y datos de usuario'),
            checkRow('API-04', 'GET /api/auth/perfil (con Bearer)', 'Perfil del usuario autenticado'),
            checkRow('API-05', 'GET /api/products', 'Listado de productos en JSON'),
            checkRow('API-06', 'POST /api/products sin token', '401/403 – acceso denegado'),
            checkRow('API-07', 'POST /api/products con token admin', 'Producto creado correctamente'),
            checkRow('API-08', 'PUT/DELETE /api/products/:id (admin)', 'Actualiza o elimina según corresponda')
          ]
        }),

        new Paragraph({
          spacing: { before: 240, after: 80 },
          children: [t('B) Lista de chequeo – UI / E2E (Playwright)', { bold: true, size: 24 })]
        }),

        new Table({
          width: { size: 9000, type: WidthType.DXA },
          rows: [
            new TableRow({
              children: [
                cell('ID', { bold: true, shading: 'FFF2CC', width: 700 }),
                cell('Caso de prueba', { bold: true, shading: 'FFF2CC', width: 3200 }),
                cell('Resultado esperado', { bold: true, shading: 'FFF2CC', width: 2800 }),
                cell('OK', { bold: true, shading: 'FFF2CC', width: 700 }),
                cell('Evidencia', { bold: true, shading: 'FFF2CC', width: 1600 })
              ]
            }),
            checkRow('UI-01', 'Carga de index.html', 'Home visible sin error'),
            checkRow('UI-02', 'Catálogo productos.html', 'Buscador #catalog-search presente'),
            checkRow('UI-03', 'Formulario login.html', 'Campos email y password visibles'),
            checkRow('UI-04', 'Formulario registro.html', 'Campo nombre y formulario usable'),
            checkRow('UI-05', 'Vista carrito.html', 'Página de carrito renderizada'),
            checkRow('UI-06', 'Panel admin.html', 'Interfaz de administración visible'),
            checkRow('UI-07', 'Interacción login (datos prueba)', 'Formulario acepta entrada de datos'),
            checkRow('UI-08', 'Página 404.html', 'Página de error accesible')
          ]
        }),

        new Paragraph({
          spacing: { before: 200, after: 120 },
          children: [t('Leyenda: marcar OK cuando el caso pase; adjuntar captura o ID de request de Postman/Playwright en Observación/Evidencia.', { italics: true, size: 20 })]
        }),

        h1('Conclusiones'),
        mixed(
          'Este plan de pruebas pretende asegurar que ',
          { text: '“YogurASO – Tienda web de yogurt artesanal”', highlight: 'yellow', bold: true },
          ' cumpla con los requisitos de calidad esperados, utilizando una estrategia basada en la Pirámide de Pruebas para optimizar el esfuerzo y los recursos invertidos en pruebas. La combinación de Postman para la API REST y Playwright para la interfaz permite cubrir integración, aceptación y flujos E2E alineados con los módulos reales del proyecto (auth, productos, carrito y administración).'
        )
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUT, buffer);
  console.log('OK:', OUT);
}

build().catch((e) => { console.error(e); process.exit(1); });
