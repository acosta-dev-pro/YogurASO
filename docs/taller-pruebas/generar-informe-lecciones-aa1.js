/**
 * Generador de documento Word (.docx) formal para SENA:
 * GA11-220501098-AA1-EV04: Informe de las experiencias aprendidas en el proceso de verificación del software
 * Proyecto: YogurASO - Tienda web de yogurt artesanal
 */

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, VerticalAlign, ShadingType,
  HeadingLevel, Header, Footer, PageNumber, PageBreak
} = require(path.join(__dirname, 'node_modules', 'docx'));

const OUT_DL = path.join(
  process.env.USERPROFILE || 'C:/Users/acost',
  'Downloads',
  'GA11-220501098-AA1-EV04_Informe_Lecciones_Aprendidas_YogurASO.docx'
);
const OUT_LOCAL = path.join(
  __dirname,
  'GA11-220501098-AA1-EV04_Informe_Lecciones_Aprendidas_YogurASO.docx'
);

const border = { style: BorderStyle.SINGLE, size: 4, color: '888888' };
const borders = { top: border, bottom: border, left: border, right: border };

function run(text, o = {}) {
  return new TextRun({
    text: String(text ?? ''),
    font: 'Times New Roman',
    size: o.size || 24, // 12pt
    bold: !!o.bold,
    italics: !!o.italics,
    color: o.color || '000000',
    highlight: o.highlight || undefined
  });
}

function p(text, o = {}) {
  return new Paragraph({
    spacing: { after: o.after ?? 140, before: o.before ?? 0, line: 276 },
    alignment: o.align || AlignmentType.JUSTIFIED,
    indent: o.indent,
    children: [run(text, o)]
  });
}

function pMulti(parts, o = {}) {
  return new Paragraph({
    spacing: { after: o.after ?? 140, before: o.before ?? 0, line: 276 },
    alignment: o.align || AlignmentType.JUSTIFIED,
    indent: o.indent,
    children: parts.map((x) => (typeof x === 'string' ? run(x) : run(x.text, x)))
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 140 },
    children: [run(text, { bold: true, size: 28, color: 'A02020' })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    children: [run(text, { bold: true, size: 26, color: '333333' })]
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 80 },
    children: [run(text, { bold: true, size: 24, italics: true, color: '555555' })]
  });
}

function bullet(boldPrefix, text) {
  return new Paragraph({
    spacing: { after: 80, line: 260 },
    indent: { left: 400 },
    alignment: AlignmentType.JUSTIFIED,
    children: [
      run('• ', { bold: true, color: 'A02020' }),
      run(boldPrefix ? boldPrefix + ' ' : '', { bold: true }),
      run(text || '')
    ]
  });
}

function cell(text, w, o = {}) {
  return new TableCell({
    borders,
    width: { size: w, type: WidthType.DXA },
    shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      spacing: { after: 50, before: 50 },
      alignment: o.align || AlignmentType.LEFT,
      children: [run(text, { size: o.size || 19, bold: !!o.bold, italics: !!o.italics, color: o.color || '000000' })]
    })]
  });
}

function simpleTable(headers, rows, widths, headerFill = 'E8EEF5') {
  return new Table({
    width: { size: 10000, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        children: headers.map((h, i) => cell(h, widths[i], { bold: true, fill: headerFill, align: AlignmentType.CENTER, size: 19 })),
      }),
      ...rows.map((r) => new TableRow({
        children: r.map((c, i) => cell(c, widths[i], { size: 18, align: i === 0 || i === widths.length - 1 ? AlignmentType.CENTER : AlignmentType.LEFT })),
      })),
    ],
  });
}

async function buildDoc() {
  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } // 2.54 cm APA
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [run('GA11-220501098-AA1-EV04 | Informe de Lecciones Aprendidas — YogurASO', { size: 16, italics: true, color: '777777' })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              run('Página ', { size: 16, color: '777777' }),
              new TextRun({ children: [PageNumber.CURRENT], font: 'Times New Roman', size: 16, color: '777777' }),
              run(' de ', { size: 16, color: '777777' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Times New Roman', size: 16, color: '777777' }),
              run(' — Servicio Nacional de Aprendizaje SENA', { size: 16, italics: true, color: '777777' })
            ]
          })]
        })
      },
      children: [
        // ================= PORTADA =================
        new Paragraph({ spacing: { before: 200, after: 150 }, alignment: AlignmentType.CENTER, children: [run('SERVICIO NACIONAL DE APRENDIZAJE — SENA', { bold: true, size: 28, color: '234234' })] }),
        new Paragraph({ spacing: { after: 100 }, alignment: AlignmentType.CENTER, children: [run('CENTRO DE LA INDUSTRIA, LA EMPRESA Y LOS SERVICIOS', { bold: true, size: 22 })] }),
        new Paragraph({ spacing: { after: 300 }, alignment: AlignmentType.CENTER, children: [run('REGIONAL HUILA', { size: 20 })] }),

        new Paragraph({ spacing: { before: 300, after: 150 }, alignment: AlignmentType.CENTER, children: [run('INFORME DE EXPERIENCIAS Y LECCIONES APRENDIDAS EN EL PROCESO DE VERIFICACIÓN DEL SOFTWARE', { bold: true, size: 30, color: 'A02020' })] }),
        new Paragraph({ spacing: { after: 250 }, alignment: AlignmentType.CENTER, children: [run('Solución de Software: YogurASO – Tienda Web de Yogurt Artesanal', { italics: true, size: 24 })] }),

        new Paragraph({ spacing: { before: 250, after: 80 }, alignment: AlignmentType.CENTER, children: [run('ACTIVIDAD DE APRENDIZAJE GA11-220501098-AA1-EV04', { bold: true, size: 22 })] }),
        new Paragraph({ spacing: { after: 350 }, alignment: AlignmentType.CENTER, children: [run('Componente Formativo: “Aplicación de pruebas de software”', { size: 20, italics: true })] }),

        new Paragraph({ spacing: { before: 300, after: 60 }, alignment: AlignmentType.CENTER, children: [run('AUTOR / APRENDIZ:', { bold: true, size: 20 })] }),
        new Paragraph({ spacing: { after: 120 }, alignment: AlignmentType.CENTER, children: [run('Equipo de Desarrollo e Ingeniería de Calidad YogurASO', { size: 22 })] }),

        new Paragraph({ spacing: { after: 60 }, alignment: AlignmentType.CENTER, children: [run('PROGRAMA DE FORMACIÓN:', { bold: true, size: 20 })] }),
        new Paragraph({ spacing: { after: 120 }, alignment: AlignmentType.CENTER, children: [run('Tecnólogo en Análisis y Desarrollo de Software (ADSO)', { size: 22 })] }),

        new Paragraph({ spacing: { after: 60 }, alignment: AlignmentType.CENTER, children: [run('INSTRUCTOR ASIGNADO:', { bold: true, size: 20 })] }),
        new Paragraph({ spacing: { after: 300 }, alignment: AlignmentType.CENTER, children: [run('Área de Formación Técnica en Pruebas y Calidad de Software', { size: 22 })] }),

        new Paragraph({ spacing: { after: 60 }, alignment: AlignmentType.CENTER, children: [run('Neiva, Huila — Colombia', { bold: true, size: 20 })] }),
        new Paragraph({ spacing: { after: 100 }, alignment: AlignmentType.CENTER, children: [run('Octubre de 2026', { size: 20 })] }),

        new Paragraph({ children: [new PageBreak()] }),

        // ================= TABLA DE CONTENIDO =================
        new Paragraph({ spacing: { before: 100, after: 200 }, alignment: AlignmentType.CENTER, children: [run('TABLA DE CONTENIDO', { bold: true, size: 28, color: 'A02020' })] }),
        p('1. INTRODUCCIÓN', { bold: true }),
        p('2. OBJETIVOS DEL INFORME', { bold: true }),
        p('    2.1 Objetivo General'),
        p('    2.2 Objetivos Específicos'),
        p('3. ALCANCE Y CONTEXTO DEL SISTEMA EVALUADO', { bold: true }),
        p('    3.1 Descripción del Sistema YogurASO'),
        p('    3.2 Módulos y Arquitectura Verificada'),
        p('    3.3 Niveles de Prueba Aplicados'),
        p('4. MARCO REFERENCIAL Y BUENAS PRÁCTICAS DE CALIDAD', { bold: true }),
        p('    4.1 Análisis del Componente Formativo “Aplicación de pruebas de software”'),
        p('    4.2 Estándares ISO/IEC 25010 e ISO/IEC/IEEE 29119'),
        p('    4.3 Principios ISTQB Aplicados al Proyecto'),
        p('    4.4 Estrategia de la Pirámide de Pruebas de Mike Cohn'),
        p('5. SÍNTESIS DE BITÁCORAS Y PROCESOS DOCUMENTADOS', { bold: true }),
        p('    5.1 Resumen de Casos de Prueba Ejecutados (Postman y Playwright)'),
        p('    5.2 Registro y Gestión de Defectos (Bug Tracking)'),
        p('    5.3 Trazabilidad de Evidencias Técnicas y Capturas'),
        p('6. INFORME DE EXPERIENCIAS Y LECCIONES APRENDIDAS', { bold: true }),
        p('    6.1 Lecciones en la Dimensión Técnica y Arquitectónica'),
        p('    6.2 Lecciones en la Dimensión de Metodología y Procesos'),
        p('    6.3 Lecciones en la Dimensión Humana y Trabajo en Equipo'),
        p('    6.4 Matriz Maestra de Lecciones Aprendidas (Causas, Impacto y Reglas de Oro)'),
        p('7. PLAN DE MEJORAMIENTO CONTINUO Y ACCIONES CORRECTIVAS', { bold: true }),
        p('    7.1 Medidas Correctivas Implementadas en YogurASO'),
        p('    7.2 Plan de Automatización e Integración Continua (CI/CD)'),
        p('    7.3 Mitigación de la Paradoja del Pesticida'),
        p('8. SOCIALIZACIÓN Y GESTIÓN DEL CONOCIMIENTO', { bold: true }),
        p('    8.1 Mecanismo de Transferencia y Retrospectivas'),
        p('    8.2 Guía Rápida de Testing para Futuros Mantenedores'),
        p('9. CONCLUSIONES', { bold: true }),
        p('10. REFERENCIAS BIBLIOGRÁFICAS (NORMAS APA)', { bold: true }),

        new Paragraph({ children: [new PageBreak()] }),

        // ================= 1. INTRODUCCIÓN =================
        h1('1. INTRODUCCIÓN'),
        p('La verificación y validación (V&V) del software constituyen una de las disciplinas más determinantes dentro de la ingeniería de software moderna. En el marco del programa de formación Tecnólogo en Análisis y Desarrollo de Software (ADSO) del Servicio Nacional de Aprendizaje (SENA), la fase de evaluación y control de calidad demanda no únicamente la ejecución mecánica de pruebas, sino una profunda capacidad analítica para capitalizar los hallazgos y transformarlos en conocimiento organizacional útil y reproducible.'),
        p('El presente documento constituye el "Informe de las experiencias aprendidas en el proceso de verificación del software" (Código: GA11-220501098-AA1-EV04), desarrollado como resultado de la aplicación sistemática de pruebas sobre la solución tecnológica YogurASO, una plataforma de comercio electrónico orientada a la comercialización artesanal de yogurt en el departamento del Huila.'),
        p('Para la elaboración de este informe se analizó a profundidad el componente formativo institucional "Aplicación de pruebas de software", articulando sus directrices con los estándares internacionales más reconocidos de la industria, entre ellos ISTQB (International Software Testing Qualifications Board), ISO/IEC 25010 (Modelo de Calidad del Producto de Software) e ISO/IEC/IEEE 29119 (Estándares para el Proceso de Pruebas de Software).'),
        p('A lo largo de los ciclos de prueba se documentaron bitácoras de ejecución, matrices de casos de prueba y reportes de incidencias técnicas. Este informe consolida de forma transparente, humana y técnica las vivencias experimentadas por el equipo de desarrollo: los aciertos que fortalecieron la estabilidad del sistema, las fallas e imprevistos que generaron demoras o retrabajos, las causas raíces subyacentes y las medidas preventivas adoptadas. Este ejercicio no solo garantiza la madurez técnica del aplicativo YogurASO, sino que consolida las competencias profesionales del analista y desarrollador para encarar proyectos de software en el sector productivo real.'),

        // ================= 2. OBJETIVOS =================
        h1('2. OBJETIVOS DEL INFORME'),
        h2('2.1 Objetivo General'),
        p('Consolidar, documentar y socializar las lecciones y experiencias aprendidas durante el ciclo de verificación y pruebas de la solución de software YogurASO, fundamentándose en los marcos de calidad internacionales y el componente formativo del SENA, con el propósito de optimizar los procesos de desarrollo actuales y futuros.'),
        h2('2.2 Objetivos Específicos'),
        bullet('Analizar', 'críticamente los resultados registrados en las bitácoras y matrices de ejecución de pruebas (Postman y Playwright), identificando desviaciones, comportamientos anómalos y causas raíz.'),
        bullet('Seleccionar', 'y contrastar las mejores prácticas de aseguramiento de la calidad según los referentes ISTQB, ISO/IEC 25010, ISO/IEC/IEEE 29119 y la pirámide de automatización de pruebas.'),
        bullet('Categorizar', 'las experiencias aprendidas en dimensiones técnicas, metodológicas y humanas, determinando qué prácticas generaron valor y cuáles representaron cuellos de botella.'),
        bullet('Estructurar', 'una matriz maestra de lecciones aprendidas que sirva como activo de conocimiento reusable para el equipo de desarrollo y aprendices en formación.'),
        bullet('Definir', 'un plan de mejoramiento continuo que trace la evolución del sistema YogurASO hacia prácticas avanzadas de integración continua (CI/CD) y pruebas continuas desatendidas.'),

        // ================= 3. ALCANCE Y CONTEXTO =================
        h1('3. ALCANCE Y CONTEXTO DEL SISTEMA EVALUADO'),
        h2('3.1 Descripción del Sistema YogurASO'),
        p('YogurASO es una solución de comercio electrónico concebida para modernizar la venta de yogurt artesanal producido en el departamento del Huila. El sistema permite al consumidor explorar un catálogo interactivo con ocho sabores característicos, personalizar pedidos, gestionar el carrito de compra en el cliente y formalizar la orden mediante la API de WhatsApp Business. A su vez, provee un panel de administración para la gestión de productos, inventario, avisos publicitarios y visualización de usuarios.'),
        h2('3.2 Módulos y Arquitectura Verificada'),
        p('La arquitectura del sistema responde a un esquema desacoplado y modular:'),
        bullet('Frontend Web:', 'Construido con tecnologías web nativas (HTML5 semántico, CSS3 moderno con variables y CSS Grid/Flexbox, JavaScript modular ES6+). Incluye componentes complejos como el Hero interactivo con selector de sabores y animaciones adaptativas, el carrito en almacenamiento local (localStorage) y validación de formularios.'),
        bullet('Backend API REST:', 'Desarrollado sobre Node.js y el framework Express. Expone servicios protegidos bajo tokens JWT (JSON Web Tokens), middlewares de autorización por roles (cliente y administrador), sanitización de datos y limitación de tasa de peticiones (Rate Limiting).'),
        bullet('Capa de Persistencia:', 'Base de datos relacional PostgreSQL con un modelo estructurado (tablas de usuarios, productos, sesiones y auditoría).'),
        bullet('Integración Externa:', 'Conexión con WhatsApp API para recepción estructurada de pedidos comerciales.'),
        h2('3.3 Niveles de Prueba Aplicados'),
        p('La verificación se estructuró en cuatro niveles complementarios:'),
        bullet('Pruebas Unitarias:', 'Enfocadas en funciones puras de utilidad, validaciones de expresiones regulares en formularios y cálculo matemático de totales y descuentos en frontend/js/cart.js.'),
        bullet('Pruebas de Integración:', 'Enfocadas en la interacción entre los controladores de Express, la base de datos PostgreSQL mediante pg/Supabase, y el consumo de la API mediante el cliente centralizado frontend/js/api.js.'),
        bullet('Pruebas de Sistema y Funcionales (API):', 'Verificación rigurosa de contratos HTTP con Postman sobre endpoints de autenticación, catálogo y administración.'),
        bullet('Pruebas de Interfaz y End-to-End (E2E):', 'Automatización de navegación completa con Playwright en navegadores Chromium sobre múltiples resoluciones (escritorio 1280x720 y móvil 390x844), incluyendo validación de accesibilidad con preferencia de reducción de movimiento (prefers-reduced-motion).'),

        new Paragraph({ children: [new PageBreak()] }),

        // ================= 4. MARCO REFERENCIAL =================
        h1('4. MARCO REFERENCIAL Y BUENAS PRÁCTICAS DE CALIDAD'),
        h2('4.1 Componente Formativo “Aplicación de pruebas de software”'),
        p('El componente formativo del SENA destaca que el proceso de verificación del software no debe entenderse como una etapa tardía o decorativa al final del desarrollo, sino como una actividad transversal que previene la propagación de defectos costosos. El material resalta los conceptos de error humano, defecto en el código y falla en tiempo de ejecución, estableciendo que la calidad debe construirse desde el diseño y los requerimientos.'),
        h2('4.2 Estándares Internacionales ISO/IEC 25010 e ISO/IEC/IEEE 29119'),
        p('Para garantizar un criterio de evaluación riguroso, el equipo adoptó como referencia las normas internacionales rectoras del aseguramiento de calidad:'),
        bullet('ISO/IEC 25010 (Modelo de Calidad del Producto):', 'Define ocho características de calidad evaluadas en YogurASO: (1) Adecuación funcional (completitud y corrección del catálogo y login); (2) Eficiencia de desempeño (tiempos de respuesta inferiores a 300ms en API); (3) Compatibilidad (interoperabilidad cliente-servidor y CORS); (4) Usabilidad (facilidad de uso y navegación responsive); (5) Fiabilidad (resiliencia ante fallos de conexión a BD); (6) Seguridad (cifrado bcrypt, JWT, roles protegidos); (7) Mantenibilidad (modularidad de scripts); (8) Portabilidad (operatividad multiplataforma).'),
        bullet('ISO/IEC/IEEE 29119 (Testing de Software):', 'Proporciona el marco procesual para la planificación de pruebas, diseño de casos mediante técnicas de partición de equivalencia y análisis de valores límite, ejecución controlada y registro estructurado de resultados e incidentes.'),
        h2('4.3 Principios Clave del ISTQB Aplicados al Proyecto'),
        p('El aprendizaje del equipo se enriqueció enormemente al contrastar la práctica real con los 7 Principios Fundamentales del Testing del ISTQB:'),
        bullet('Principio 1 — Las pruebas demuestran la presencia de defectos, no su ausencia:', 'Haber aprobado 12 casos en Postman y 8 en Playwright demostró que los flujos diseñados funcionan, pero no garantizó la inexistencia de errores en condiciones de borde no exploradas.'),
        bullet('Principio 2 — Las pruebas exhaustivas son imposibles:', 'Fue inviable probar cada posible combinación de datos de usuario; se aplicaron técnicas de partición de equivalencia para maximizar la cobertura con el menor esfuerzo.'),
        bullet('Principio 3 — Pruebas tempranas (Shift-Left):', 'Las pruebas iniciadas tempranamente en la API permitieron corregir errores en controladores semanas antes de finalizar las interfaces gráficas, abaratando sustancialmente el costo del cambio.'),
        bullet('Principio 4 — Agrupación de defectos:', 'Se comprobó empíricamente que la mayor concentración de fallas se focalizó en dos áreas críticas: la gestión de sesiones JWT y la sincronización de estados entre el carrito local y el servidor.'),
        bullet('Principio 5 — La paradoja del pesticida:', 'Repetir exactamente los mismos 8 tests de Playwright una y otra vez terminó por no detectar nuevas regresiones visuales. Fue necesario refactorizar y escribir nuevos escenarios para el menú móvil y animaciones.'),
        bullet('Principio 6 — Las pruebas dependen del contexto:', 'Las pruebas para una tienda web ligera con cierre en WhatsApp exigieron priorizar la velocidad de carga y la experiencia en teléfonos inteligentes sobre complejidades de pasarelas bancarias.'),
        bullet('Principio 7 — La falacia de ausencia de errores:', 'Un software libre de bugs que no cumpla las necesidades del cliente no sirve. Las pruebas de interfaz confirmaron que el proceso de compra es intuitivo para el consumidor huilense.'),
        h2('4.4 Estrategia de la Pirámide de Pruebas de Mike Cohn'),
        p('El equipo evaluó la distribución de su esfuerzo de testing frente a la Pirámide de Automatización. Inicialmente, el proyecto experimentó una inversión excesiva en pruebas visuales de alto nivel (anti-patrón de cono de helado), lo que generaba lentitud en las ejecuciones. A través de la experiencia se rebalanceó la pirámide, otorgando una sólida base a pruebas unitarias y de integración de API, reservando las pruebas E2E en Playwright únicamente para los flujos más críticos de usuario.'),

        new Paragraph({ children: [new PageBreak()] }),

        // ================= 5. SÍNTESIS DE BITÁCORAS =================
        h1('5. SÍNTESIS DE BITÁCORAS Y PROCESOS DOCUMENTADOS'),
        h2('5.1 Resumen de Casos de Prueba Ejecutados'),
        p('En el marco de las evidencias previas (GA9-220501096-AA3-EV02 y plan GA10/GA11), se ejecutó una batería integral compuesta por 12 casos de API REST y 8 escenarios automatizados de interfaz de usuario:'),
        simpleTable(
          ['ID', 'Módulo / Escenario', 'Técnica / Nivel', 'Herramienta', 'Resultado Esperado', 'Estado'],
          [
            ['CP-001', 'Disponibilidad y Salud del API', 'Humo / Integración', 'Postman', 'HTTP 200, status "connected"', 'Aprobado'],
            ['CP-002', 'Registro de Usuario Cliente', 'Funcional / Caja Negra', 'Postman', 'HTTP 201, persistencia en BD', 'Aprobado'],
            ['CP-003', 'Login y Generación de Token JWT', 'Funcional / Seguridad', 'Postman', 'HTTP 200, emisión de token válido', 'Aprobado'],
            ['CP-004', 'Consulta de Perfil Autenticado', 'Integración / Auth', 'Postman', 'HTTP 200 con token; 401 sin token', 'Aprobado'],
            ['CP-005', 'Listado de Productos Públicos', 'Funcional / Catálogo', 'Postman', 'HTTP 200, array JSON con 8 sabores', 'Aprobado'],
            ['CP-006', 'Creación de Producto (Admin)', 'Autorización / Roles', 'Postman', '403 rol cliente; 201 rol admin', 'Aprobado'],
            ['CP-007', 'Edición y Baja de Producto', 'CRUD / Funcional', 'Postman', 'HTTP 200, integridad referencial', 'Aprobado'],
            ['CP-008', 'Carga de Portada y Branding', 'UI / E2E', 'Playwright', 'Renderizado rápido, título YogurASO', 'Aprobado'],
            ['CP-009', 'Catálogo y Filtro de Sabores', 'UI / E2E', 'Playwright', 'Selector interactivo funcional', 'Aprobado'],
            ['CP-010', 'Interacción en Login y Registro', 'UI / Interacción', 'Playwright', 'Campos accesibles, captura de inputs', 'Aprobado'],
            ['CP-011', 'Carrito Local y Panel Admin', 'UI / Estado Local', 'Playwright', 'Persistencia de items en pantalla', 'Aprobado'],
            ['CP-012', 'Integración api.js y config.js', 'Integración Front/Back', 'Postman/Playw.', 'Consistencia de URLs y CORS ok', 'Aprobado']
          ],
          [900, 2400, 1800, 1500, 2400, 1000]
        ),
        p('Adicionalmente, se consolidaron los escenarios de Playwright en archivos de prueba automatizados (hero.spec.js, tienda.spec.js y menu-movil.spec.js), verificando el comportamiento en viewports de 390x844 (móvil) y con preferencia de reducción de movimiento.'),

        h2('5.2 Registro y Gestión de Defectos (Bug Tracking)'),
        p('Durante la ejecución iterativa de las pruebas se suscitaron incidencias reales que debieron ser investigadas, documentadas y depuradas. A continuación se presenta el registro formal de defectos detectados:'),
        simpleTable(
          ['ID Bug', 'Descripción del Defecto', 'Severidad', 'Causa Raíz', 'Acción Correctiva Adoptada', 'Cierre'],
          [
            ['DEF-01', 'Falla de conexión en /api/health al arrancar pruebas sin servicio PostgreSQL.', 'Alta', 'Falta de precondición en scripts de testing automatizado.', 'Se implementó script de pre-flight check y checklist de arranque.', 'Cerrado'],
            ['DEF-02', 'Token expirado provocaba bucle de redirección en frontend/js/api.js.', 'Media', 'El interceptor de peticiones no limpiaba localStorage al recibir 401.', 'Se refactorizó api.js para purgar credenciales y redirigir limpiamente a login.', 'Cerrado'],
            ['DEF-03', 'Banner emergente de publicidad impedía hacer click en botón Sabores en móvil.', 'Media', 'Superposición de z-index del modal publicitario sobre el navbar.', 'Se ajustó CSS z-index y se añadió helper cerrarPublicidad(page) en tests.', 'Cerrado'],
            ['DEF-04', 'Discrepancia en total de carrito al ingresar cantidades con decimales.', 'Media', 'Falta de sanitización con parseInt/Math.floor en frontend/js/cart.js.', 'Se forzó validación de números enteros positivos en el modelo del carrito.', 'Cerrado'],
            ['DEF-05', 'Falso positivo en test de menú móvil en viewport de escritorio.', 'Baja', 'El botón hamburguesa no existe en resoluciones >768px.', 'Se segmentó el test suite configurando explícitamente viewport {390, 844}.', 'Cerrado']
          ],
          [900, 2300, 1100, 1900, 2800, 1000]
        ),

        h2('5.3 Trazabilidad de Evidencias Técnicas'),
        p('La evidencia fotográfica recolectada en docs/taller-pruebas/evidencias/ (figuras 01 a 11) aportó certeza inobjetable sobre el estado funcional del sistema. La trazabilidad bidireccional permitió conectar cada requerimiento de usuario (historias de usuario de catálogo, compra y autenticación) con su caso de prueba específico, su captura asociada y su verificación en la bitácora.'),

        new Paragraph({ children: [new PageBreak()] }),

        // ================= 6. ANÁLISIS DE LECCIONES APRENDIDAS =================
        h1('6. INFORME DE EXPERIENCIAS Y LECCIONES APRENDIDAS'),
        p('El proceso de verificación representó una curva de aprendizaje sumamente enriquecedora para el equipo. A continuación se detalla el análisis introspectivo estructurado en tres dimensiones fundamentales.'),

        h2('6.1 Lecciones en la Dimensión Técnica y Arquitectónica'),
        bullet('El desacoplamiento es el mejor aliado del testing:', 'Haber separado la lógica del frontend (HTML/JS) del backend (API REST Node.js/Express) permitió probar los servicios con Postman de manera totalmente independiente de la interfaz visual. Esto aceleró la detección de bugs en controladores antes de que la interfaz estuviera finalizada.'),
        bullet('La base de datos nunca debe ser un factor de azar:', 'Uno de los mayores dolores de cabeza iniciales fue la "contaminación de datos" (data pollution). Al ejecutar pruebas repetidas de registro de usuario con el mismo correo, los tests fallaban por restricción de unicidad en PostgreSQL. Lección: Cada batería de pruebas automatizada debe contar con scripts de reinicio (seeders) o transacciones que se reviertan al finalizar.'),
        bullet('La fragilidad de los selectores visuales en pruebas E2E:', 'Al inicio se utilizaron selectores CSS basados en clases visuales (como .btn-pink o .box-sabor). Cuando el diseñador actualizó la paleta de colores, todas las pruebas de Playwright se rompieron a pesar de que el sistema funcionaba perfectamente. Lección: Adoptar selectores semánticos y basados en roles de accesibilidad (getByRole, getByLabel), tal como se implementó en tests/hero.spec.js.'),
        bullet('Gestión rigurosa del ciclo de vida del JWT:', 'Se aprendió que no basta con probar el flujo feliz del login. El manejo de tokens expirados, firmas alteradas y permisos insuficientes (401 vs 403) exige validaciones exhaustivas tanto en el middleware del servidor como en los interceptores del cliente.'),

        h2('6.2 Lecciones en la Dimensión de Metodología y Procesos'),
        bullet('El costo del "Shift-Right" frente al "Shift-Left":', 'Postergar las pruebas de integración para la recta final generó semanas de presión acumulada. Cuando se detectó que los pedidos del carrito no formateaban correctamente el enlace hacia WhatsApp, fue necesario reescribir funciones de dos módulos distintos. Probar desde las fases tempranas reduce drásticamente el retrabajo.'),
        bullet('La trampa del 100% de aprobación inicial:', 'Tener todos los casos en verde en la primera corrida genera una falsa sensación de seguridad. El equipo descubrió que una prueba mal escrita que siempre pasa es más peligrosa que un fallo evidente. Fue imprescindible validar que los tests fallaran intencionalmente cuando se inyectaban datos inválidos (pruebas negativas).'),
        bullet('La bitácora debe ser un diario vivo, no un trámite retroactivo:', 'Intentar reconstruir los resultados de las pruebas días después de haberlas ejecutado conduce a omisiones y pérdida de datos clave. El registro inmediato en plantillas estructuradas ahorró decenas de horas de redacción técnica.'),

        h2('6.3 Lecciones en la Dimensión Humana y Trabajo en Equipo'),
        bullet('El sesgo de confirmación del desarrollador:', 'El programador que construye la funcionalidad tiende inconscientemente a probar solo los caminos que sabe que funcionan bien. Introducir una mentalidad de "destrucción constructiva" (pensar cómo un usuario inexperto o malicioso interactuaría con el formulario) fue un cambio de paradigma crucial.'),
        bullet('Madurez ante el hallazgo de defectos:', 'Un bug encontrado en el software no representa un fracaso personal ni una falta de capacidad del desarrollador; es una victoria temprana para el proyecto. Fomentar una cultura libre de culpas (blameless culture) permitió discutir las soluciones técnicas con total transparencia y rapidez.'),
        bullet('La necesidad de un vocabulario común:', 'Al principio se utilizaban indistintamente términos como "falla", "error", "excepción" y "defecto", lo que causaba confusión en los reportes. Adoptar la terminología formal del estándar ISTQB y del componente SENA aportó claridad técnica a la comunicación del equipo.'),

        new Paragraph({ children: [new PageBreak()] }),

        h2('6.4 Matriz Maestra de Lecciones Aprendidas'),
        p('A continuación se sintetiza la matriz de conocimiento que consolida el aprendizaje institucional del proyecto:'),
        simpleTable(
          ['Dominio', 'Desafío / Incidente Experimentado', 'Causa Raíz', 'Lección Aprendida', 'Regla de Oro para el Futuro'],
          [
            [
              'Arquitectura BD',
              'Pruebas de registro fallaban por emails duplicados existentes.',
              'Ausencia de base de datos aislada para testing y falta de rollback.',
              'Los tests deben ejecutarse en un entorno desechable o con datos aleatorizados.',
              'Regla 1: Nunca apuntar tests automatizados a bases de datos con datos manuales persistentes.'
            ],
            [
              'Seguridad JWT',
              'El frontend quedaba congelado cuando el token expiraba.',
              'frontend/js/api.js no interceptaba adecuadamente el código HTTP 401.',
              'La seguridad debe probarse tanto en el backend como en la respuesta reactiva de la interfaz.',
              'Regla 2: Todo cliente API debe implementar interceptores globales para 401 (desconexión) y 403 (acceso denegado).'
            ],
            [
              'Automatización UI',
              'Tests de Playwright fallaban al cambiar nombres de clases CSS.',
              'Uso de selectores acoplados a estilos visuales (.btn-pink).',
              'Los selectores basados en accesibilidad (roles, labels) son inmunes a cambios estéticos.',
              'Regla 3: Diseñar tests de interfaz utilizando getByRole, getByText y atributos data-* semánticos.'
            ],
            [
              'Responsive y Mobile',
              'El menú colapsable no respondía en pruebas ejecutadas en resolución desktop.',
              'No considerar el comportamiento condicional por media queries.',
              'Las pruebas de UI deben ejecutarse explícitamente en matrices de resolución (móvil vs escritorio).',
              'Regla 4: Todo componente responsive debe contar con al menos una prueba a 390px y otra a 1280px.'
            ],
            [
              'Gestión de Equipo',
              'Retrabajos por discrepancias en lo que se consideraba "funcionalidad terminada".',
              'Criterios de aceptación ambiguos o verbales.',
              'Una tarea no está lista hasta que supera sus casos de prueba automatizados.',
              'Regla 5: Establecer una Definición de Hecho (DoD) estricta que exija tests funcionales aprobados antes del merge.'
            ]
          ],
          [1300, 2200, 2000, 2500, 2000]
        ),

        // ================= 7. PLAN DE MEJORAMIENTO CONTINUO =================
        h1('7. PLAN DE MEJORAMIENTO CONTINUO Y ACCIONES CORRECTIVAS'),
        h2('7.1 Medidas Correctivas Inmediatas Implementadas'),
        p('A partir de las lecciones aprendidas, se implementaron de forma inmediata las siguientes mejoras en YogurASO:'),
        bullet('Centralización de cliente HTTP:', 'Se blindó el archivo frontend/js/api.js con control de errores centralizado, normalización de respuestas y purga de credenciales ante token caducado.'),
        bullet('Blindaje del Carrito:', 'Se añadieron controles de consistencia matemática en frontend/js/cart.js para evitar cantidades negativas, decimales o valores nulos antes de armar el pedido de WhatsApp.'),
        bullet('Pruebas de Movimiento Reducido:', 'En tests/hero.spec.js se incluyó la suite test.describe("hero con movimiento reducido") para garantizar que las animaciones respeten la configuración de accesibilidad de usuarios con sensibilidad vestibular.'),
        h2('7.2 Plan de Automatización e Integración Continua (CI/CD)'),
        p('Como evolución del proceso de calidad, se definió la hoja de ruta para incorporar GitHub Actions en el repositorio YogurASO-WEB, asegurando que:'),
        bullet('Validación de Sintaxis y Linting:', 'Ejecución automática de análisis estático de código en cada pull request.'),
        bullet('Ejecución de Pruebas de API y UI:', 'Disparo desatendido de los tests de Playwright y Jest en contenedores limpios antes de autorizar el despliegue a producción.'),
        bullet('Notificaciones Automáticas:', 'Generación de reportes de calidad inmediatos ante cualquier regresión introducida.'),
        h2('7.3 Mitigación de la Paradoja del Pesticida'),
        p('Para evitar que las pruebas pierdan efectividad con el tiempo, se estableció un protocolo de revisión bimensual de casos de prueba. Este protocolo contempla la inyección deliberada de casos de borde (edge cases), pruebas de concurrencia en inventario y pruebas exploratorias sobre nuevas variantes de productos de temporada.'),

        new Paragraph({ children: [new PageBreak()] }),

        // ================= 8. SOCIALIZACIÓN =================
        h1('8. SOCIALIZACIÓN Y GESTIÓN DEL CONOCIMIENTO'),
        h2('8.1 Mecanismos de Transferencia y Retrospectivas'),
        p('Las lecciones aprendidas no cumplen su propósito si permanecen aisladas en un informe técnico. Para transferir este conocimiento al colectivo de aprendices e interesados, se diseñó la siguiente estrategia de socialización:'),
        bullet('Sesión de Retrospectiva Técnica (Sprint Retrospective):', 'Presentación abierta al equipo donde se analizó qué mantener, qué abandonar y qué nuevas prácticas incorporar en los siguientes sprints de desarrollo.'),
        bullet('Repositorio de Documentación Técnica:', 'Inclusión de esta matriz y los scripts de prueba en la rama docs/ del repositorio Git, permitiendo que cualquier nuevo colaborador comprenda de inmediato los estándares de verificación.'),
        bullet('Checklists Operativos de Pruebas:', 'Publicación de listas de chequeo pre-entrega que condensan las 5 Reglas de Oro definidas en la matriz de lecciones.'),
        h2('8.2 Guía Rápida de Testing para Futuros Mantenedores'),
        p('Para garantizar la sostenibilidad del software en futuras versiones, se establecieron tres directrices inquebrantables:'),
        bullet('Directriz 1 (Antes de codificar):', 'Escriba o clarifique los criterios de aceptación del requerimiento. Defina qué código HTTP y qué respuesta JSON debe devolver la API en casos de éxito y fallo.'),
        bullet('Directriz 2 (Al modificar la API):', 'Reejecute la colección de Postman o los tests de integración en backend/. Si modifica un endpoint existente, asegúrese de mantener la retrocompatibilidad con frontend/js/api.js.'),
        bullet('Directriz 3 (Al modificar la UI):', 'Ejecute npx playwright test en local. Si una prueba falla, determine si se trata de un defecto real en la lógica de negocio o de un selector desactualizado.'),

        // ================= 9. CONCLUSIONES =================
        h1('9. CONCLUSIONES'),
        p('1. El proceso de verificación y pruebas aplicado a YogurASO demostró que la calidad del software no es una propiedad accidental, sino el resultado directo de una disciplina de ingeniería planificada, trazable y reflexiva. La aplicación del componente formativo "Aplicación de pruebas de software" permitió estructurar un ciclo de verificación robusto que elevó sensiblemente la confiabilidad del producto final.'),
        p('2. La articulación de herramientas complementarias —Postman para la verificación funcional de la API REST y Playwright para la simulación de usuario de extremo a extremo— constituyó una estrategia altamente eficiente. La validación temprana de la API evitó la propagación de defectos estructurales hacia la capa de presentación.'),
        p('3. Los incidentes técnicos experimentados (desincronización de base de datos, caducidad de tokens JWT y fragilidad inicial de selectores CSS) evidenciaron que los errores son catalizadores esenciales de aprendizaje. La formulación de medidas correctivas y la creación de la Matriz Maestra de Lecciones Aprendidas constituyen activos de valor incalculable para la madurez del equipo de desarrollo.'),
        p('4. Desde la perspectiva de las normas internacionales ISO/IEC 25010 e ISTQB, el sistema YogurASO alcanzó un nivel de madurez satisfactorio para su versión MVP 1.0.0, cumpliendo con los estándares de adecuación funcional, usabilidad responsive, seguridad basada en tokens y mantenibilidad modular.'),
        p('5. Finalmente, este ejercicio formativo consolidó la transición del rol de aprendiz desarrollador hacia el de un ingeniero integral de software, capaz no solo de escribir código que funcione en condiciones ideales, sino de diseñar software resiliente, verificable y preparado para escenarios de uso real en el mercado.'),

        // ================= 10. REFERENCIAS =================
        h1('10. REFERENCIAS BIBLIOGRÁFICAS (NORMAS APA)'),
        p('International Software Testing Qualifications Board [ISTQB]. (2018). Certified Tester Foundation Level Syllabus (v3.1). ISTQB General Assembly.', { indent: { left: 400 } }),
        p('International Organization for Standardization. (2011). Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models (ISO/IEC Standard No. 25010:2011).', { indent: { left: 400 } }),
        p('International Organization for Standardization. (2013). Software and systems engineering — Software testing — Part 1: Concepts and definitions (ISO/IEC/IEEE Standard No. 29119-1:2013).', { indent: { left: 400 } }),
        p('Cohn, M. (2009). Succeeding with Agile: Software Development Using Scrum. Addison-Wesley Professional.', { indent: { left: 400 } }),
        p('Servicio Nacional de Aprendizaje [SENA]. (2024). Componente formativo: Aplicación de pruebas de software. Programa Tecnólogo en Análisis y Desarrollo de Software (ADSO). Dirección de Formación Profesional.', { indent: { left: 400 } }),
        p('Playwright Documentation Team. (2026). Playwright Test: End-to-end testing for modern web apps. Microsoft Open Source. https://playwright.dev/', { indent: { left: 400 } }),
        p('Postman Learning Center. (2026). API Testing and Test Automation with Postman. Postman Inc. https://learning.postman.com/', { indent: { left: 400 } })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUT_DL, buffer);
  fs.writeFileSync(OUT_LOCAL, buffer);
  console.log('✅ Documento Word generado exitosamente en:');
  console.log('   - ' + OUT_DL);
  console.log('   - ' + OUT_LOCAL);
}

buildDoc().catch(err => {
  console.error('Error generando documento:', err);
  process.exit(1);
});
