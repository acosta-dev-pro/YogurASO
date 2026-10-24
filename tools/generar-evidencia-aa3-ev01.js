const fs = require('fs');
const path = require('path');
const docx = require('docx');

const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    AlignmentType,
    BorderStyle,
    ShadingType,
    HeadingLevel,
    Header,
    Footer,
    PageNumber,
    PageBreak,
    TableLayoutType
} = docx;

// Paleta de colores SENA / Corporativa
const COLOR_PRIMARY = '00843D';   // Verde Institucional SENA
const COLOR_NAVY = '1A365D';      // Azul Oscuro Profesional
const COLOR_RUBY = 'C3343E';      // Rojo Marca YogurASO
const COLOR_TEXT = '2D3748';      // Texto principal grafito
const COLOR_MUTED = '4A5568';     // Texto secundario
const COLOR_HEADER_BG = '2B6CB0'; // Azul de cabecera de tablas
const COLOR_ROW_ALT = 'F7FAFC';   // Fondo alternado para tablas
const COLOR_BORDER = 'CBD5E0';    // Borde gris claro

function createBorder(color = COLOR_BORDER, size = 4) {
    return {
        style: BorderStyle.SINGLE,
        size: size,
        color: color
    };
}

const tableBorders = {
    top: createBorder(),
    bottom: createBorder(),
    left: createBorder(),
    right: createBorder()
};

function run(text, opts = {}) {
    return new TextRun({
        text: String(text ?? ''),
        font: opts.font || 'Calibri',
        size: opts.size || 22, // 11pt default
        bold: !!opts.bold,
        italics: !!opts.italics,
        color: opts.color || COLOR_TEXT,
        subScript: !!opts.subScript,
        superScript: !!opts.superScript,
        noProof: !!opts.noProof
    });
}

function p(text, opts = {}) {
    return new Paragraph({
        spacing: { before: opts.before ?? 60, after: opts.after ?? 100, line: opts.line ?? 260 },
        alignment: opts.align || AlignmentType.JUSTIFIED,
        indent: opts.indent,
        children: Array.isArray(text) ? text : [run(text, opts)]
    });
}

function h1(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 280, after: 100 },
        children: [run(text, { bold: true, size: 28, color: COLOR_NAVY })]
    });
}

function h2(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 80 },
        children: [run(text, { bold: true, size: 24, color: COLOR_PRIMARY })]
    });
}

function h3(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 160, after: 60 },
        children: [run(text, { bold: true, size: 22, italics: true, color: COLOR_MUTED })]
    });
}

function bullet(title, text) {
    return new Paragraph({
        spacing: { before: 30, after: 60, line: 260 },
        indent: { left: 400 },
        alignment: AlignmentType.JUSTIFIED,
        children: [
            run('• ', { bold: true, color: COLOR_PRIMARY }),
            run(title ? title + ' ' : '', { bold: true, color: COLOR_NAVY }),
            run(text || '')
        ]
    });
}

function tableHeaderCell(text, widthDxa, align = AlignmentType.CENTER) {
    return new TableCell({
        width: { size: widthDxa, type: WidthType.DXA },
        shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR },
        borders: tableBorders,
        margins: { top: 100, bottom: 100, left: 120, right: 120 },
        children: [
            new Paragraph({
                alignment: align,
                spacing: { before: 0, after: 0 },
                children: [run(text, { bold: true, size: 19, color: 'FFFFFF' })]
            })
        ]
    });
}

function tableDataCell(paragraphs, widthDxa, isAlt = false, align = AlignmentType.LEFT) {
    const pList = Array.isArray(paragraphs) ? paragraphs : [
        new Paragraph({
            alignment: align,
            spacing: { before: 0, after: 0 },
            children: [run(paragraphs, { size: 18, color: COLOR_TEXT })]
        })
    ];

    return new TableCell({
        width: { size: widthDxa, type: WidthType.DXA },
        shading: { fill: isAlt ? COLOR_ROW_ALT : 'FFFFFF', type: ShadingType.CLEAR },
        borders: tableBorders,
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: pList
    });
}

function buildDocument() {
    // Ancho imprimible en Portrait (8.5 x 11 in): 12240 dxa - 2880 dxa márgenes = 9360 dxa
    const W_FULL = 9360;

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: { font: 'Calibri', size: 22, color: COLOR_TEXT },
                    paragraph: { spacing: { line: 260, before: 60, after: 100 } }
                }
            }
        },
        sections: [{
            properties: {
                page: {
                    margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } // 2.54 cm APA estándar
                }
            },
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                                run('SENA ADSO | GA11-220501098-AA3-EV01: Ajustes en Procesos de Desarrollo — YogurASO', {
                                    size: 16,
                                    italics: true,
                                    color: '718096'
                                })
                            ]
                        })
                    ]
                })
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                run('Página ', { size: 16, color: '718096' }),
                                new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: 16, color: '718096' }),
                                run(' de ', { size: 16, color: '718096' }),
                                new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Calibri', size: 16, color: '718096' }),
                                run(' — SENA Regional Huila — CIES', { size: 16, italics: true, color: '718096' })
                            ]
                        })
                    ]
                })
            },
            children: [
                // ==================== PORTADA OFICIAL SENA ====================
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 100, after: 80 },
                    children: [run('SERVICIO NACIONAL DE APRENDIZAJE — SENA', { bold: true, size: 26, color: COLOR_PRIMARY })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 60 },
                    children: [run('CENTRO DE LA INDUSTRIA, LA EMPRESA Y LOS SERVICIOS (CIES)', { bold: true, size: 20, color: COLOR_NAVY })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 300 },
                    children: [run('REGIONAL HUILA', { size: 19, color: COLOR_MUTED })]
                }),

                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 200, after: 120 },
                    children: [
                        run('INFORME TÉCNICO DE AJUSTES EN LOS PROCESOS DE DESARROLLO DE SOFTWARE', {
                            bold: true,
                            size: 28,
                            color: COLOR_RUBY
                        })
                    ]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 250 },
                    children: [
                        run('Evaluación de Comportamiento, Reingeniería de Flujos Operativos y Técnicos Bajo Marcos de Calidad y Metodología Ágil', {
                            italics: true,
                            size: 21,
                            color: COLOR_NAVY
                        })
                    ]
                }),

                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 200, after: 60 },
                    children: [run('EVIDENCIA DE APRENDIZAJE:', { bold: true, size: 20, color: COLOR_PRIMARY })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 60 },
                    children: [run('GA11-220501098-AA3-EV01', { bold: true, size: 22 })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 250 },
                    children: [run('Actividad de Aprendizaje: Realiza ajustes en los procesos de desarrollo', { italics: true, size: 19 })]
                }),

                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 150, after: 40 },
                    children: [run('PROYECTO FORMATIVO:', { bold: true, size: 19, color: COLOR_NAVY })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 150 },
                    children: [run('YogurASO: Plataforma Web de Comercio Electrónico y Gestión para Yogurt Artesanal (v1.0.0)', { size: 20 })]
                }),

                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 150, after: 40 },
                    children: [run('APRENDIZ / AUTOR:', { bold: true, size: 19, color: COLOR_NAVY })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 150 },
                    children: [run('Juan Esteban Acosta', { bold: true, size: 22 })]
                }),

                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 100, after: 40 },
                    children: [run('PROGRAMA DE FORMACIÓN:', { bold: true, size: 19, color: COLOR_NAVY })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 300 },
                    children: [run('Tecnólogo en Análisis y Desarrollo de Software (ADSO)', { size: 21 })]
                }),

                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 40 },
                    children: [run('Neiva, Huila — Colombia', { bold: true, size: 19 })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 100 },
                    children: [run('Octubre de 2026', { size: 19 })]
                }),

                new Paragraph({ children: [new PageBreak()] }),

                // ==================== TABLA DE METADATOS DEL PROYECTO ====================
                h1('Ficha Técnica de la Evidencia'),
                new Table({
                    width: { size: W_FULL, type: WidthType.DXA },
                    rows: [
                        new TableRow({
                            children: [
                                tableDataCell('Código de Competencia:', 2600, true, AlignmentType.LEFT),
                                tableDataCell('220501098 — Evaluar requisitos de la solución de software de acuerdo con las normas y estándares de calidad.', 6760)
                            ]
                        }),
                        new TableRow({
                            children: [
                                tableDataCell('Actividad de Aprendizaje:', 2600, true, AlignmentType.LEFT),
                                tableDataCell('AA3 — Evaluar el comportamiento llevado a cabo para realizar los ajustes en el proceso de desarrollo de software de acuerdo con la metodología seleccionada.', 6760)
                            ]
                        }),
                        new TableRow({
                            children: [
                                tableDataCell('Resultado de Aprendizaje (RAP):', 2600, true, AlignmentType.LEFT),
                                tableDataCell('220501098-03 — Realizar los ajustes requeridos en los procesos del desarrollo de software de acuerdo con los resultados obtenidos en las pruebas.', 6760)
                            ]
                        }),
                        new TableRow({
                            children: [
                                tableDataCell('Componente Formativo Analizado:', 2600, true, AlignmentType.LEFT),
                                tableDataCell('“Aplicación de pruebas de software” — Servicio Nacional de Aprendizaje SENA.', 6760)
                            ]
                        }),
                        new TableRow({
                            children: [
                                tableDataCell('Sistema Evaluado:', 2600, true, AlignmentType.LEFT),
                                tableDataCell('YogurASO (Frontend Web, API REST en Node.js/Express, Base de Datos PostgreSQL/Supabase).', 6760)
                            ]
                        })
                    ]
                }),

                new Paragraph({ spacing: { before: 150, after: 100 } }),

                // ==================== SECCIÓN 1: INTRODUCCIÓN ====================
                h1('1. Introducción y Justificación'),
                p('El desarrollo de software moderno no es un proceso estático ni lineal; por el contrario, requiere de mecanismos de retroalimentación sistemáticos que permitan identificar desvíos, ineficiencias y cuellos de botella para efectuar mejoras oportunas. En el marco del proyecto formativo YogurASO —una solución web para la comercialización artesanal y gestión de inventarios de yogurt en los municipios de Neiva y Tello (Huila)— se llevó a cabo una exhaustiva fase de verificación y aseguramiento de la calidad.'),
                p('A partir de los resultados cuantitativos y cualitativos arrojados por las pruebas de software (pruebas de API con Postman, pruebas automatizadas E2E con Playwright y la evaluación bajo la norma ISO/IEC 25010), se identificaron discrepancias operativas y técnicas en el ciclo de vida previo del proyecto. El presente documento formaliza los ajustes efectuados en la secuencia de ejecución de los procesos de desarrollo, detallando la transición metodológica, las modificaciones operativas en la gestión del equipo y las implementaciones técnicas a nivel de arquitectura y código fuente.'),

                // ==================== SECCIÓN 2: METODOLOGÍA ====================
                h1('2. Reconocimiento de la Metodología Seleccionada'),
                p('Para el ciclo de desarrollo de YogurASO se adoptó un marco de trabajo ágil basado en Scrum complementado con prácticas de flujo continuo Kanban. Esta selección responde a la necesidad de responder rápidamente a los requerimientos de la microempresa, permitiendo entregas incrementales de valor en periodos cortos denominados Sprints (iteraciones de 2 semanas).'),
                h2('2.1 Evaluación del Comportamiento del Proceso Inicial'),
                p('Durante las primeras etapas del proyecto se evidenciaron debilidades operativas derivadas de una aplicación inmadura del marco ágil. Específicamente:'),
                bullet('Enfoque tardío de pruebas (Big Bang Testing):', 'Las actividades de aseguramiento de calidad (QA) se relegaban al final del Sprint, lo que impedía corregir defectos estructurales sin retrasar la fecha comprometida de entrega.'),
                bullet('Falta de automatización preventiva:', 'Los desarrolladores ejecutaban pruebas manuales ad-hoc en sus entornos locales, lo que provocaba que errores de sincronización y regresión pasaran inadvertidos al repositorio compartido.'),
                bullet('Definición de Hecho (DoD) ambigua:', 'Las historias de usuario se marcaban como "terminadas" únicamente con la finalización de la codificación, sin requerir cobertura de pruebas automatizadas ni verificación de accesibilidad o rendimiento.'),

                // ==================== SECCIÓN 3: COMPONENTE FORMATIVO ====================
                h1('3. Análisis del Componente Formativo “Aplicación de Pruebas de Software”'),
                p('El estudio riguroso del componente formativo del SENA aporta fundamentos esenciales que sustentan los cambios requeridos en el proyecto:'),
                bullet('Principio de Detección Temprana (Shift-Left Testing):', 'El costo y esfuerzo de corregir un defecto se incrementa exponencialmente si se detecta en etapas tardías o en producción. Por ello, las pruebas deben integrarse desde la fase de diseño y concepción de las historias de usuario.'),
                bullet('Pirámide de Pruebas de Mike Cohn:', 'La estrategia de pruebas debe fundamentarse en una sólida base de pruebas unitarias rápidas y económicas, una capa intermedia de pruebas de integración/API, y una cúspide reducida pero crítica de pruebas de interfaz de usuario End-to-End (E2E).'),
                bullet('Independencia y Trazabilidad del Defecto:', 'Todo hallazgo debe documentarse mediante un formato estandarizado que contenga precondiciones, pasos de reproducción, resultado esperado, resultado obtenido, severidad y prioridad.'),

                // ==================== SECCIÓN 4: PROPUESTA DE CAMBIOS ====================
                h1('4. Propuesta de Cambios en la Secuencia de Ejecución de Procesos'),
                p('Con el propósito de garantizar que la calidad sea intrínseca al desarrollo y no un control posterior, se rediseñó la secuencia del ciclo de vida del software, estableciendo "compuertas de calidad" (Quality Gates) obligatorias.'),
                h2('4.1 Matriz Comparativa: Proceso Tradicional vs. Proceso Ajustado'),
                new Table({
                    width: { size: W_FULL, type: WidthType.DXA },
                    rows: [
                        new TableRow({
                            isHeader: true,
                            children: [
                                tableHeaderCell('Etapa del Proceso', 2000),
                                tableHeaderCell('Secuencia Tradicional Previa', 3680),
                                tableHeaderCell('Secuencia Ajustada (Shift-Left QA)', 3680)
                            ]
                        }),
                        new TableRow({
                            children: [
                                tableDataCell('1. Planificación del Sprint', 2000, true),
                                tableDataCell('Definición básica de alcance técnico sin criterios de aceptación de pruebas.', 3680),
                                tableDataCell('Diseño colaborativo de criterios de aceptación BDD (Given-When-Then) y escenarios de prueba previos a la codificación.', 3680)
                            ]
                        }),
                        new TableRow({
                            children: [
                                tableDataCell('2. Codificación', 2000, true),
                                tableDataCell('Desarrollo aislado de componentes; las pruebas se postergaban hasta tener el módulo completo.', 3680),
                                tableDataCell('Desarrollo guiado por pruebas (TDD/Component Testing) con linters y pre-commit hooks activos.', 3680)
                            ]
                        }),
                        new TableRow({
                            children: [
                                tableDataCell('3. Integración de Código', 2000, true),
                                tableDataCell('Fusión manual de ramas a main sin ejecución automática de pruebas unitarias o de integración.', 3680),
                                tableDataCell('Integración Continua (CI/CD): Cada Pull Request desencadena validación sintáctica y suite automatizada de Playwright.', 3680)
                            ]
                        }),
                        new TableRow({
                            children: [
                                tableDataCell('4. Verificación y QA', 2000, true),
                                tableDataCell('Pruebas manuales masivas al cierre del sprint; saturación y bloqueos de última hora.', 3680),
                                tableDataCell('Pruebas automatizadas continuas durante todo el sprint; pruebas exploratorias y de usabilidad enfocadas.', 3680)
                            ]
                        }),
                        new TableRow({
                            children: [
                                tableDataCell('5. Cierre y Retrospectiva', 2000, true),
                                tableDataCell('Historias cerradas con deuda técnica y correcciones pendientes para futuros sprints.', 3680),
                                tableDataCell('Revisión estricta de la Definition of Done (DoD), métricas de defectos y lecciones aprendidas documentadas.', 3680)
                            ]
                        })
                    ]
                }),

                new Paragraph({ spacing: { before: 180, after: 100 } }),

                // ==================== SECCIÓN 5: CAMBIOS OPERATIVOS ====================
                h1('5. Aplicación de Cambios a Nivel Operativo'),
                p('Las modificaciones operativas transformaron la dinámica diaria de trabajo del equipo de desarrollo, fortaleciendo la disciplina ágil:'),
                h2('5.1 Redefinición de la Definition of Ready (DoR) y Definition of Done (DoD)'),
                bullet('Criterios de Preparación (DoR):', 'Ninguna historia de usuario pasa al Sprint Backlog si no cuenta con diseño de interfaz validado, casos de uso definidos y especificación técnica de endpoints y datos.'),
                bullet('Criterios de Terminación (DoD):', 'Una tarea solo se considera "Terminada" cuando: (a) el código pasa linters sin advertencias, (b) cuenta con pruebas automatizadas aprobadas, (c) fue revisada por pares vía Pull Request, y (d) no rompe la suite E2E en Playwright.'),
                h2('5.2 Gestión y Trazabilidad de Defectos en el Tablero Ágil'),
                p('Se incorporó una columna de "Auditoría de Calidad" y una política de "Zero Bugs Policy" para incidencias críticas: cualquier defecto que bloquee el flujo de compra o la seguridad del usuario adquiere prioridad inmediata por encima de nuevas funcionalidades.'),

                // ==================== SECCIÓN 6: CAMBIOS TÉCNICOS ====================
                h1('6. Aplicación de Cambios a Nivel Técnico'),
                p('A nivel de código fuente y arquitectura, se implementaron soluciones directas a los problemas técnicos identificados durante las pruebas de la solución YogurASO:'),
                h2('6.1 Automatización de Pruebas End-to-End con Playwright'),
                p('Se configuró una suite automatizada con Playwright para verificar de forma desatendida las rutas críticas del aplicativo: navegación del catálogo, agregado y persistencia en el carrito de compras, cálculo de descuentos y apertura del canal de WhatsApp.'),
                h2('6.2 Corrección de Race Conditions en el Motor de Colorimetría'),
                p('Se solucionó el problema crítico detectado en la sincronización de temas de sabor entre el carrusel de productos y la portada (Hero): se implementó la bandera isSyncingFromExternal y un canal de eventos maestro-esclavo bidireccional en theme-reactor.js y hero.js, garantizando que el color del fondo y las botellas coincidan siempre con el sabor seleccionado.'),
                h2('6.3 Monitoreo de Salud de Conexión a Base de Datos'),
                p('Se habilitó la ruta /api/health en el backend de Node.js/Express para verificar en tiempo real el estado de conexión con PostgreSQL y Supabase, permitiendo alertar al frontend antes de que ocurra una falla silenciosa en la experiencia del usuario.'),
                h2('6.4 Optimización de Activos y Compatibilidad Multiplataforma'),
                p('Se inició la migración de imágenes pesadas hacia el formato moderno WebP y se eliminó el hardcoding de credenciales, consolidando variables dinámicas en .env y config.js para facilitar la portabilidad en cualquier servidor o contenedor.'),

                // ==================== SECCIÓN 7: BUENAS PRÁCTICAS ====================
                h1('7. Selección de Buenas Prácticas de Calidad según Marcos de Trabajo'),
                p('Los ajustes introducidos se alinean con los principales estándares de ingeniería de software reconocidos internacionalmente:'),
                new Table({
                    width: { size: W_FULL, type: WidthType.DXA },
                    rows: [
                        new TableRow({
                            isHeader: true,
                            children: [
                                tableHeaderCell('Marco / Estándar', 2500),
                                tableHeaderCell('Práctica Seleccionada', 3300),
                                tableHeaderCell('Aplicación en YogurASO', 3560)
                            ]
                        }),
                        new TableRow({
                            children: [
                                tableDataCell('ISO/IEC 25010', 2500, true),
                                tableDataCell('Evaluación de Calidad de Producto basada en Métricas.', 3300),
                                tableDataCell('Medición de 16 KPIs en 8 dimensiones (Funcionalidad, Seguridad, Usabilidad, etc.).', 3560)
                            ]
                        }),
                        new TableRow({
                            children: [
                                tableDataCell('ISTQB (International Software Testing Qualifications Board)', 2500, true),
                                tableDataCell('Pruebas Tempranas y Agrupación de Defectos.', 3300),
                                tableDataCell('Diseño de casos de prueba formales previo al desarrollo y trazabilidad de bugs.', 3560)
                            ]
                        }),
                        new TableRow({
                            children: [
                                tableDataCell('Scrum Guide & Agile Alliance', 2500, true),
                                tableDataCell('Definición de Terminado rigurosa y Entrega Incremental.', 3300),
                                tableDataCell('DoD con compuertas de calidad automáticas antes de mezclar código a main.', 3560)
                            ]
                        }),
                        new TableRow({
                            children: [
                                tableDataCell('Clean Architecture & 12-Factor App', 2500, true),
                                tableDataCell('Separación de Responsabilidades y Configuración Externa.', 3300),
                                tableDataCell('División modular frontend/backend/db y centralización en archivos .env.', 3560)
                            ]
                        })
                    ]
                }),

                new Paragraph({ spacing: { before: 180, after: 100 } }),

                // ==================== SECCIÓN 8: CONCLUSIONES ====================
                h1('8. Conclusiones y Evaluación del Impacto de los Ajustes'),
                p('La implementación de los ajustes en el proceso de desarrollo de YogurASO demostró que la calidad de software no depende únicamente de la habilidad técnica individual, sino de la madurez y disciplina del proceso metodológico:'),
                bullet('Reducción drástica del retrabajo:', 'Al incorporar pruebas automatizadas en etapas tempranas, los defectos se corrigen en minutos durante la codificación en lugar de requerir días de depuración al final del sprint.'),
                bullet('Mayor confiabilidad del producto final:', 'La resolución de problemas de sincronización de estado y la protección de rutas mediante JWT y bcrypt elevaron la robustez del sistema a un nivel óptimo para su despliegue comercial.'),
                bullet('Alineación con estándares del sector:', 'La combinación de Scrum, ISO/IEC 25010 y prácticas ISTQB capacita al equipo de desarrollo en metodologías profesionales de alta demanda en la industria del software.'),

                new Paragraph({ spacing: { before: 200, after: 60 } }),

                // ==================== FIRMA FORMAL ====================
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 150, after: 20 },
                    children: [run('____________________________________________', { color: 'A0AEC0' })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 0, after: 10 },
                    children: [run('Juan Esteban Acosta', { bold: true, size: 21, color: COLOR_NAVY })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 0, after: 0 },
                    children: [run('Aprendiz Tecnólogo en Análisis y Desarrollo de Software (ADSO) — SENA Regional Huila', { italics: true, size: 18, color: COLOR_MUTED })]
                })
            ]
        }]
    });

    return doc;
}

async function main() {
    console.log('Generando documento de ajustes en el proceso de desarrollo GA11-220501098-AA3-EV01...');
    const doc = buildDocument();
    const buffer = await Packer.toBuffer(doc);

    const docxDestinations = [
        path.join(process.env.USERPROFILE || 'C:/Users/acost', 'Downloads', 'GA11-220501098-AA3-EV01_Ajustes_Procesos_Desarrollo_YogurASO.docx'),
        path.join(process.env.USERPROFILE || 'C:/Users/acost', 'Desktop', 'GA11-220501098-AA3-EV01_Ajustes_Procesos_Desarrollo_YogurASO.docx'),
        path.join(__dirname, '..', 'docs', 'taller-pruebas', 'GA11-220501098-AA3-EV01_Ajustes_Procesos_Desarrollo_YogurASO.docx')
    ];

    for (const d of docxDestinations) {
        try {
            fs.writeFileSync(d, buffer);
            console.log('Documento Word guardado exitosamente en:', d);
        } catch (e) {
            console.warn(`No se pudo escribir en ${d}:`, e.message);
        }
    }
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
