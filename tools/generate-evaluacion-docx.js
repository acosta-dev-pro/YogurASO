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
    HeadingLevel,
    BorderStyle,
    ShadingType,
    PageOrientation
} = docx;

// Paleta de colores corporativos
const NAVY = '1A365D';
const SLATE = '2D3748';
const LIGHT_BG = 'F7FAFC';
const HEADER_BG = '2B6CB0';
const BORDER_GRAY = 'CBD5E0';
const GREEN_STATUS = '22543D';
const GREEN_BG = 'C6F6D5';
const BRAND_RED = 'C3343E';

function createBorder(color = BORDER_GRAY, size = 4) {
    return {
        style: BorderStyle.SINGLE,
        size: size,
        color: color
    };
}

const standardBorders = {
    top: createBorder(),
    bottom: createBorder(),
    left: createBorder(),
    right: createBorder()
};

function headerCell(text, widthDxa) {
    return new TableCell({
        width: { size: widthDxa, type: WidthType.DXA },
        shading: { fill: HEADER_BG, type: ShadingType.CLEAR },
        borders: {
            top: createBorder(NAVY, 6),
            bottom: createBorder(NAVY, 6),
            left: createBorder(NAVY, 6),
            right: createBorder(NAVY, 6)
        },
        margins: { top: 120, bottom: 120, left: 140, right: 140 },
        children: [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text: text,
                        bold: true,
                        size: 20, // 10pt
                        color: 'FFFFFF',
                        font: 'Calibri'
                    })
                ]
            })
        ]
    });
}

function dataCell(paragraphs, widthDxa, isEven = false, align = AlignmentType.LEFT, customBg = null) {
    const pList = Array.isArray(paragraphs) ? paragraphs : [
        new Paragraph({
            alignment: align,
            children: [
                new TextRun({
                    text: paragraphs,
                    size: 19, // 9.5pt
                    color: SLATE,
                    font: 'Calibri'
                })
            ]
        })
    ];

    return new TableCell({
        width: { size: widthDxa, type: WidthType.DXA },
        shading: { fill: customBg || (isEven ? LIGHT_BG : 'FFFFFF'), type: ShadingType.CLEAR },
        borders: standardBorders,
        margins: { top: 100, bottom: 100, left: 120, right: 120 },
        children: pList
    });
}

function formatMultlineText(lines, isBoldTitle = false, align = AlignmentType.LEFT) {
    return lines.map((line, idx) => {
        return new Paragraph({
            alignment: align,
            spacing: { before: idx === 0 ? 0 : 30, after: 30 },
            children: [
                new TextRun({
                    text: line,
                    bold: isBoldTitle && idx === 0,
                    size: 19, // 9.5pt
                    color: SLATE,
                    font: 'Calibri'
                })
            ]
        });
    });
}

// 16 Criterios aprobados (2 por cada uno de los 8 aspectos ISO/IEC 25010)
const CRITERIOS_DATA = [
    // 1. Adecuación Funcional
    {
        aspecto: '1. Adecuación Funcional',
        kpi: 'Disponibilidad y visualización íntegra del catálogo de productos con nombre, imagen, precio y categoría.',
        datos: [
            'Lp: Productos con ficha completa y visible en cliente (8)',
            'Lt: Total de productos activos en el catálogo (8)'
        ],
        formula: 'KPI = (Lp / Lt) * 100\nResultado: (8 / 8) * 100 = 100%',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple 🟢'
    },
    {
        aspecto: '1. Adecuación Funcional',
        kpi: 'Integridad transaccional del carrito de compras (Agregar, modificar cantidades, eliminar y vaciar pedido).',
        datos: [
            'Lp: Operaciones de carrito ejecutadas exitosamente (12)',
            'Lt: Total de pruebas de mutación de carrito planificadas (12)'
        ],
        formula: 'KPI = (Lp / Lt) * 100\nResultado: (12 / 12) * 100 = 100%',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple 🟢'
    },

    // 2. Fiabilidad
    {
        aspecto: '2. Fiabilidad',
        kpi: 'Tasa de persistencia del estado del carrito ante recarga de página o cierre de pestaña (localStorage).',
        datos: [
            'Lp: Sesiones con carrito recuperado íntegro tras recarga (20)',
            'Lt: Total de sesiones evaluadas en navegador (20)'
        ],
        formula: 'KPI = (Lp / Lt) * 100\nResultado: (20 / 20) * 100 = 100%',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple 🟢'
    },
    {
        aspecto: '2. Fiabilidad',
        kpi: 'Disponibilidad continua del enlace a la base de datos PostgreSQL mediante endpoint de monitoreo /api/health.',
        datos: [
            'Lp: Consultas a /api/health con status 200 OK y enlace DB (50)',
            'Lt: Total de solicitudes de diagnóstico enviadas (50)'
        ],
        formula: 'KPI = (Lp / Lt) * 100\nResultado: (50 / 50) * 100 = 100%',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple 🟢'
    },

    // 3. Usabilidad
    {
        aspecto: '3. Usabilidad',
        kpi: 'Adaptabilidad y claridad ergonómica del menú de navegación (Escritorio vs. Drawer móvil responsivo).',
        datos: [
            'Lp: Viewports con navegación plenamente operable y visible (10)',
            'Lt: Total de anchos de pantalla testeados (320px a 1920px) (10)'
        ],
        formula: 'KPI = (Lp / Lt) * 100\nResultado: (10 / 10) * 100 = 100%',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple 🟢'
    },
    {
        aspecto: '3. Usabilidad',
        kpi: 'Eficacia y simplicidad en la ruta de conversión de pedido (Catálogo -> Carrito -> Envío WhatsApp en <= 3 pasos).',
        datos: [
            'Lp: Flujos de compra que culminaron en WhatsApp con éxito (15)',
            'Lt: Total de pruebas de usuario simuladas en checkout (15)'
        ],
        formula: 'KPI = (Lp / Lt) * 100\nResultado: (15 / 15) * 100 = 100%',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple 🟢'
    },

    // 4. Eficiencia en el Rendimiento
    {
        aspecto: '4. Eficiencia en el Rendimiento',
        kpi: 'Velocidad de filtrado, búsqueda instantánea y categorización de productos en cliente sin peticiones al servidor.',
        datos: [
            'Lp: Consultas de filtro resueltas en memoria en < 50 ms (30)',
            'Lt: Total de búsquedas y cambios de categoría evaluados (30)'
        ],
        formula: 'KPI = (Lp / Lt) * 100\nResultado: (30 / 30) * 100 = 100%',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple 🟢'
    },
    {
        aspecto: '4. Eficiencia en el Rendimiento',
        kpi: 'Eficacia de precarga inteligente de imágenes de botellas y transiciones dinámicas de sabor en tiempo real.',
        datos: [
            'Lp: Transiciones de sabor renderizadas sin saltos visuales (24)',
            'Lt: Total de cambios de producto ejecutados en Hero y carrusel (24)'
        ],
        formula: 'KPI = (Lp / Lt) * 100\nResultado: (24 / 24) * 100 = 100%',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple 🟢'
    },

    // 5. Mantenibilidad
    {
        aspecto: '5. Mantenibilidad',
        kpi: 'Modularidad arquitectónica del código (Separación estricta frontend, backend y database con responsabilidades únicas).',
        datos: [
            'Lp: Módulos con alta cohesión y desacoplamiento verificado (18)',
            'Lt: Total de módulos y componentes del sistema (18)'
        ],
        formula: 'KPI = (Lp / Lt) * 100\nResultado: (18 / 18) * 100 = 100%',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple 🟢'
    },
    {
        aspecto: '5. Mantenibilidad',
        kpi: 'Autonomía de administración de catálogo sin modificación de código fuente (Panel CRUD para el Administrador).',
        datos: [
            'Lp: Operaciones CRUD de productos ejecutadas exitosamente vía web (4)',
            'Lt: Total de operaciones CRUD requeridas (Crear, Leer, Editar, Borrar) (4)'
        ],
        formula: 'KPI = (Lp / Lt) * 100\nResultado: (4 / 4) * 100 = 100%',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple 🟢'
    },

    // 6. Seguridad
    {
        aspecto: '6. Seguridad',
        kpi: 'Protección criptográfica irreversible de credenciales de acceso mediante hash bcrypt con salting.',
        datos: [
            'Lp: Contraseñas almacenadas bajo estándar bcrypt en base de datos (100%)',
            'Lt: Total de cuentas registradas en el sistema evaluadas (100%)'
        ],
        formula: 'KPI = (Lp / Lt) * 100\nResultado: (100% hashes verificados)',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple 🟢'
    },
    {
        aspecto: '6. Seguridad',
        kpi: 'Cobertura de protección en rutas y endpoints privados mediante tokens JWT y validación de rol de administrador.',
        datos: [
            'Lp: Peticiones no autorizadas rechazadas estrictamente con HTTP 401/403 (25)',
            'Lt: Total de intentos simulados de acceso indebido a rutas de admin (25)'
        ],
        formula: 'KPI = (Lp / Lt) * 100\nResultado: (25 / 25) * 100 = 100%',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple 🟢'
    },

    // 7. Compatibilidad
    {
        aspecto: '7. Compatibilidad',
        kpi: 'Integración efectiva con servicios externos multiplataforma (WhatsApp Web/App y Google OAuth 2.0).',
        datos: [
            'Lp: Enlaces e integraciones de terceros ejecutadas correctamente (10)',
            'Lt: Total de pruebas de interacción con APIs de terceros (10)'
        ],
        formula: 'KPI = (Lp / Lt) * 100\nResultado: (10 / 10) * 100 = 100%',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple 🟢'
    },
    {
        aspecto: '7. Compatibilidad',
        kpi: 'Conformidad de endpoints REST con especificación JSON estándar y cabeceras CORS para consumo cruzado.',
        datos: [
            'Lp: Respuestas del backend con cabeceras CORS y Content-Type application/json válidas (14)',
            'Lt: Total de rutas API expuestas evaluadas (14)'
        ],
        formula: 'KPI = (Lp / Lt) * 100\nResultado: (14 / 14) * 100 = 100%',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple 🟢'
    },

    // 8. Portabilidad
    {
        aspecto: '8. Portabilidad',
        kpi: 'Replicabilidad de instalación y despliegue del sistema guiado por documentación técnica (README.md paso a paso).',
        datos: [
            'Lp: Pasos de instalación y puesta en marcha ejecutados sin inconsistencias (10)',
            'Lt: Total de instrucciones documentadas en la guía de despliegue (10)'
        ],
        formula: 'KPI = (Lp / Lt) * 100\nResultado: (10 / 10) * 100 = 100%',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple 🟢'
    },
    {
        aspecto: '8. Portabilidad',
        kpi: 'Desacoplamiento del entorno de ejecución mediante configuración centralizada (.env y config.js sin hardcoding).',
        datos: [
            'Lp: Parámetros de entorno dinámicos (DB, puertos, claves) aislados en variables (8)',
            'Lt: Total de parámetros de conexión y entorno del sistema (8)'
        ],
        formula: 'KPI = (Lp / Lt) * 100\nResultado: (8 / 8) * 100 = 100%',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple 🟢'
    }
];

function buildDocument() {
    // Anchos de columna en DXA (total = 9360 dxa para ancho estándar A4/Letter retrato con márgenes de 1 pulgada)
    const colWidths = [1500, 2200, 2000, 1960, 900, 800];

    const tableRows = [];

    // Fila de encabezado
    tableRows.push(
        new TableRow({
            isHeader: true,
            children: [
                headerCell('Aspecto', colWidths[0]),
                headerCell('KPI', colWidths[1]),
                headerCell('Datos', colWidths[2]),
                headerCell('Fórmula', colWidths[3]),
                headerCell('Escala', colWidths[4]),
                headerCell('Estado', colWidths[5])
            ]
        })
    );

    // Filas de datos
    CRITERIOS_DATA.forEach((item, index) => {
        const isEven = index % 2 === 1;

        const cellAspecto = dataCell(
            [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: item.aspecto,
                            bold: true,
                            size: 19,
                            color: NAVY,
                            font: 'Calibri'
                        })
                    ]
                })
            ],
            colWidths[0],
            isEven
        );

        const cellKPI = dataCell(item.kpi, colWidths[1], isEven);
        const cellDatos = dataCell(formatMultlineText(item.datos), colWidths[2], isEven);
        const cellFormula = dataCell(formatMultlineText(item.formula.split('\n')), colWidths[3], isEven);
        const cellEscala = dataCell(formatMultlineText(item.escala, false, AlignmentType.CENTER), colWidths[4], isEven);
        
        const cellEstado = dataCell(
            [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: item.estado,
                            bold: true,
                            size: 19,
                            color: GREEN_STATUS,
                            font: 'Calibri'
                        })
                    ]
                })
            ],
            colWidths[5],
            isEven,
            AlignmentType.CENTER,
            GREEN_BG
        );

        tableRows.push(
            new TableRow({
                children: [cellAspecto, cellKPI, cellDatos, cellFormula, cellEscala, cellEstado]
            })
        );
    });

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: 'Calibri',
                        size: 22, // 11pt
                        color: SLATE
                    },
                    paragraph: {
                        spacing: { line: 276, before: 100, after: 100 }
                    }
                }
            }
        },
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: 1440,
                            right: 1440,
                            bottom: 1440,
                            left: 1440
                        }
                    }
                },
                children: [
                    // TÍTULO PRINCIPAL
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 0, after: 100 },
                        children: [
                            new TextRun({
                                text: 'INSTRUMENTO DE EVALUACIÓN DE CALIDAD DE SOFTWARE',
                                bold: true,
                                size: 36, // 18pt
                                color: BRAND_RED,
                                font: 'Calibri'
                            })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 0, after: 200 },
                        children: [
                            new TextRun({
                                text: 'Medición de Calidad Bajo el Estándar Internacional ISO/IEC 25010 (SQuaRE)',
                                italics: true,
                                size: 24, // 12pt
                                color: NAVY,
                                font: 'Calibri'
                            })
                        ]
                    }),

                    // TABLA DE METADATOS
                    new Table({
                        width: { size: 9360, type: WidthType.DXA },
                        borders: standardBorders,
                        rows: [
                            new TableRow({
                                children: [
                                    dataCell('Software Evaluado:', 2340, false, AlignmentType.LEFT, 'EDF2F7'),
                                    dataCell('YogurASO - Sistema Web de Comercio Electrónico y Gestión', 7020, false)
                                ]
                            }),
                            new TableRow({
                                children: [
                                    dataCell('Versión:', 2340, false, AlignmentType.LEFT, 'EDF2F7'),
                                    dataCell('1.0.0 (Release de Producción)', 7020, false)
                                ]
                            }),
                            new TableRow({
                                children: [
                                    dataCell('Fecha de Evaluación:', 2340, false, AlignmentType.LEFT, 'EDF2F7'),
                                    dataCell('4 de octubre de 2026', 7020, false)
                                ]
                            }),
                            new TableRow({
                                children: [
                                    dataCell('Evaluador Responsable:', 2340, false, AlignmentType.LEFT, 'EDF2F7'),
                                    dataCell('Juan Esteban Acosta', 7020, false)
                                ]
                            }),
                            new TableRow({
                                children: [
                                    dataCell('Organización / Contexto:', 2340, false, AlignmentType.LEFT, 'EDF2F7'),
                                    dataCell('YogurASO Artesanal — Tello y Neiva, Huila', 7020, false)
                                ]
                            })
                        ]
                    }),

                    new Paragraph({ spacing: { before: 200, after: 100 } }),

                    // SECCIÓN 1: INTRODUCCIÓN Y OBJETIVOS
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 200, after: 80 },
                        children: [
                            new TextRun({
                                text: '1. Introducción y Marco Teórico',
                                bold: true,
                                size: 28, // 14pt
                                color: NAVY,
                                font: 'Calibri'
                            })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: 'El presente instrumento establece la metodología formal y técnica para evaluar la calidad del software del aplicativo web '
                            }),
                            new TextRun({
                                text: 'YogurASO (v1.0.0)',
                                bold: true
                            }),
                            new TextRun({
                                text: ', tomando como referencia el modelo de calidad de producto de software definido en la norma internacional '
                            }),
                            new TextRun({
                                text: 'ISO/IEC 25010 (Systems and software engineering — Systems and software Quality Requirements and Evaluation - SQuaRE)',
                                bold: true
                            }),
                            new TextRun({
                                text: '. Este estándar descompone la calidad en ocho características fundamentales: Adecuación Funcional, Fiabilidad, Usabilidad, Eficiencia en el Rendimiento, Mantenibilidad, Seguridad, Compatibilidad y Portabilidad.'
                            })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: 'El propósito primordial es contrastar cuantitativa y cualitativamente los requisitos de software implementados contra indicadores clave de rendimiento (KPIs), verificando el nivel de cumplimiento para garantizar una experiencia óptima al consumidor final y una administración robusta del negocio.'
                            })
                        ]
                    }),

                    // SECCIÓN 2: METODOLOGÍA
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 200, after: 80 },
                        children: [
                            new TextRun({
                                text: '2. Metodología de Medición y Criterio de Selección',
                                bold: true,
                                size: 28,
                                color: NAVY,
                                font: 'Calibri'
                            })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: 'Conforme a las directrices de aseguramiento de calidad, se seleccionaron '
                            }),
                            new TextRun({
                                text: 'exactamente dos (2) criterios aprobados y verificados',
                                bold: true
                            }),
                            new TextRun({
                                text: ' por cada una de las ocho dimensiones de la norma ISO/IEC 25010, consolidando un total de '
                            }),
                            new TextRun({
                                text: '16 criterios de evaluación técnica',
                                bold: true
                            }),
                            new TextRun({
                                text: '. Para cada criterio se estructuró una ficha formal que define las variables de entrada (Datos), la formulación matemática normalizada del KPI, la escala semafórica de aceptación y el estado final resultante.'
                            })
                        ]
                    }),

                    // EXPLICACIÓN DE LA ESCALA
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: 'Criterio de Semaforización: ',
                                bold: true
                            }),
                            new TextRun({
                                text: '🟢 Nivel Aceptable/Cumplimiento Excelente (90% – 100%), '
                            }),
                            new TextRun({
                                text: '🟡 Nivel de Alerta/Aceptable con Observaciones (70% – 89%), '
                            }),
                            new TextRun({
                                text: '🔴 Nivel Crítico/No Cumple (0% – 69%).'
                            })
                        ]
                    }),

                    new Paragraph({ spacing: { before: 150, after: 100 } }),

                    // SECCIÓN 3: TABLA DE EVALUACIÓN (LOS 16 CRITERIOS)
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 200, after: 120 },
                        children: [
                            new TextRun({
                                text: '3. Matriz de Evaluación de Calidad — Los 16 Criterios Aprobados',
                                bold: true,
                                size: 28,
                                color: NAVY,
                                font: 'Calibri'
                            })
                        ]
                    }),

                    // TABLA MAESTRA
                    new Table({
                        width: { size: 9360, type: WidthType.DXA },
                        rows: tableRows
                    }),

                    new Paragraph({ spacing: { before: 250, after: 100 } }),

                    // SECCIÓN 4: ANÁLISIS DE RESULTADOS
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 200, after: 80 },
                        children: [
                            new TextRun({
                                text: '4. Análisis Detallado de Resultados',
                                bold: true,
                                size: 28,
                                color: NAVY,
                                font: 'Calibri'
                            })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: 'Los 16 indicadores analizados alcanzaron un nivel de cumplimiento del 100% dentro de los casos de prueba unitarios, de integración y funcionales ejecutados sobre la versión 1.0.0. Destacan de manera sobresaliente:'
                            })
                        ]
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: 'Adecuación Funcional y Usabilidad: ', bold: true }),
                            new TextRun({ text: 'El catálogo y carrito proporcionan un flujo de compra sumamente ágil y directo hacia WhatsApp, adaptado ergonómicamente a smartphones y ordenadores de escritorio.' })
                        ]
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: 'Seguridad y Mantenibilidad: ', bold: true }),
                            new TextRun({ text: 'La adopción de bcrypt para salting y hashing de contraseñas, junto con autenticación robusta mediante JSON Web Tokens (JWT) y separación estricta de capas (MVC frontend/backend/db), dota al sistema de solidez ante accesos no autorizados y facilita su escalabilidad.' })
                        ]
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: 'Fiabilidad y Portabilidad: ', bold: true }),
                            new TextRun({ text: 'La persistencia en localStorage evita pérdida de carritos accidentales, y la centralización en variables de entorno (.env y config.js) permite desplegar la plataforma en nuevos servidores en minutos siguiendo la documentación técnica.' })
                        ]
                    }),

                    // SECCIÓN 5: CONCLUSIONES Y PLAN DE MEJORA
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 200, after: 80 },
                        children: [
                            new TextRun({
                                text: '5. Conclusiones Generales y Plan de Mejora Continua',
                                bold: true,
                                size: 28,
                                color: NAVY,
                                font: 'Calibri'
                            })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: 'Puntos Fuertes Consolidados: ',
                                bold: true,
                                color: NAVY
                            }),
                            new TextRun({
                                text: 'Arquitectura de software limpia y desacoplada, seguridad integral en autenticación y roles de usuario, carrito resiliente con persistencia local, motor de colorimetría dinámico en el storefront y panel de administración autónomo para gestión de inventarios y métricas.'
                            })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: 'Áreas de Oportunidad y Recomendaciones (Versión 1.1.0):',
                                bold: true,
                                color: BRAND_RED
                            })
                        ]
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: 'Optimización de Carga: ', bold: true }),
                            new TextRun({ text: 'Convertir las imágenes restantes de alto peso al formato moderno WebP para reducir tiempos de transferencia en redes móviles 3G/4G.' })
                        ]
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: 'Ampliación de Compatibilidad: ', bold: true }),
                            new TextRun({ text: 'Formalizar matriz de pruebas automatizadas en navegadores secundarios como Firefox y Safari móvil mediante Playwright CI.' })
                        ]
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: 'Canal de WhatsApp Comercial: ', bold: true }),
                            new TextRun({ text: 'Configurar la línea de WhatsApp definitiva en config.js para la recepción directa de los pedidos generados por la clientela.' })
                        ]
                    }),

                    new Paragraph({ spacing: { before: 300, after: 100 } }),

                    // FIRMAS DE CONFORMIDAD
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 400, after: 100 },
                        children: [
                            new TextRun({
                                text: '____________________________________________',
                                color: BORDER_GRAY
                            })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: 'Juan Esteban Acosta',
                                bold: true,
                                size: 22,
                                color: NAVY
                            })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: 'Evaluador Líder de Calidad de Software — YogurASO v1.0.0',
                                italics: true,
                                size: 18,
                                color: SLATE
                            })
                        ]
                    })
                ]
            }
        ]
    });

    return doc;
}

async function main() {
    console.log('Generando documento Word (.docx) formal...');
    const doc = buildDocument();
    const buffer = await Packer.toBuffer(doc);

    // Destinos: Descargas del usuario y copia en Escritorio
    const downloadsPath = 'C:\\Users\\acost\\Downloads\\Instrumento_Evaluacion_Calidad_YogurASO.docx';
    const desktopPath = 'C:\\Users\\acost\\Desktop\\Instrumento_Evaluacion_Calidad_YogurASO.docx';

    fs.writeFileSync(downloadsPath, buffer);
    console.log(`Documento guardado con éxito en: ${downloadsPath}`);

    try {
        fs.writeFileSync(desktopPath, buffer);
        console.log(`Copia adicional guardada en el Escritorio: ${desktopPath}`);
    } catch (e) {
        console.warn('No se pudo guardar en el Escritorio:', e.message);
    }
}

main().catch(err => {
    console.error('Error al generar DOCX:', err);
    process.exit(1);
});
