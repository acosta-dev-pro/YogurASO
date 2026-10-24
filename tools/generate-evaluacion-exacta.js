const fs = require('fs');
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
    PageOrientation
} = docx;

// Colores exactos de la imagen de referencia:
// Encabezado: Azul Word/Excel (#3A75C4 o #2F6FBD)
// Filas de datos: Azul claro pastel (#DCE6F1)
// Bordes de celda: Líneas blancas divisorias (#FFFFFF)
const COLOR_HEADER_BG = '2F6FBD';
const COLOR_ROW_BG = 'DCE6F1';
const COLOR_ROW_ALT_BG = 'E8EFF7'; // sutil alternancia para máxima legibilidad humana
const COLOR_BORDER = 'FFFFFF';
const COLOR_TEXT = '000000';

function whiteBorder() {
    return {
        style: BorderStyle.SINGLE,
        size: 8, // ~1pt
        color: COLOR_BORDER
    };
}

const cellBorders = {
    top: whiteBorder(),
    bottom: whiteBorder(),
    left: whiteBorder(),
    right: whiteBorder()
};

function headerCell(text, widthDxa) {
    return new TableCell({
        width: { size: widthDxa, type: WidthType.DXA },
        shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR },
        borders: cellBorders,
        margins: { top: 140, bottom: 140, left: 140, right: 140 },
        children: [
            new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                    new TextRun({
                        text: text,
                        bold: true,
                        size: 21, // 10.5pt
                        color: 'FFFFFF',
                        font: 'Calibri'
                    })
                ]
            })
        ]
    });
}

function tableCell(paragraphs, widthDxa, isAlt = false, align = AlignmentType.LEFT) {
    const pList = Array.isArray(paragraphs) ? paragraphs : [
        new Paragraph({
            alignment: align,
            children: [
                new TextRun({
                    text: String(paragraphs || ''),
                    size: 19, // 9.5pt
                    color: COLOR_TEXT,
                    font: 'Calibri'
                })
            ]
        })
    ];

    return new TableCell({
        width: { size: widthDxa, type: WidthType.DXA },
        shading: { fill: isAlt ? COLOR_ROW_ALT_BG : COLOR_ROW_BG, type: ShadingType.CLEAR },
        borders: cellBorders,
        margins: { top: 120, bottom: 120, left: 140, right: 140 },
        children: pList
    });
}

// 16 Criterios aprobados (2 por cada uno de los 8 aspectos de ISO/IEC 25010)
const CRITERIOS_TABLA = [
    // 1. Funcionalidad
    {
        aspecto: 'Funcionalidad',
        kpiTitulo: 'Disponibilidad del catálogo de productos.',
        kpiEjemplo: 'Ejemplo: si una base de catálogo tiene 8 productos registrados y la vista pública muestra correctamente los 8 con su nombre, imagen, precio y categoría, entonces el producto tiene una disponibilidad de catálogo del 100%.',
        datos1: 'Número de productos mostrados correctamente = Lp',
        datos2: 'Número total de productos en catálogo base = Lt',
        formula: 'Disponibilidad del catálogo = Lp / Lt',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple'
    },
    {
        aspecto: 'Funcionalidad',
        kpiTitulo: 'Efectividad transaccional del carrito de compras.',
        kpiEjemplo: 'Ejemplo: si se realizan 12 operaciones de agregar, quitar y modificar cantidades de yogur y las 12 se procesan con persistencia exacta, la efectividad del carrito es del 100%.',
        datos1: 'Operaciones de carrito procesadas con éxito = Lp',
        datos2: 'Total de operaciones de carrito evaluadas = Lt',
        formula: 'Efectividad del carrito = Lp / Lt',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple'
    },

    // 2. Fiabilidad
    {
        aspecto: 'Fiabilidad',
        kpiTitulo: 'Persistencia del carrito de compras.',
        kpiEjemplo: 'Ejemplo: si se recarga la página o se cierra el navegador 20 veces consecutivas con productos agregados y en las 20 pruebas se recuperan los datos desde localStorage, la persistencia es del 100%.',
        datos1: 'Sesiones con carrito recuperado sin pérdidas = Lp',
        datos2: 'Número total de recargas evaluadas = Lt',
        formula: 'Persistencia del carrito = Lp / Lt',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple'
    },
    {
        aspecto: 'Fiabilidad',
        kpiTitulo: 'Disponibilidad de conexión con la base de datos.',
        kpiEjemplo: 'Ejemplo: si se consultan 50 peticiones de diagnóstico al servicio /api/health y las 50 confirman conexión activa con PostgreSQL sin caídas, la disponibilidad es del 100%.',
        datos1: 'Respuestas de diagnóstico exitosas de BD = Lp',
        datos2: 'Total de peticiones de diagnóstico enviadas = Lt',
        formula: 'Disponibilidad de BD = Lp / Lt',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple'
    },

    // 3. Usabilidad
    {
        aspecto: 'Usabilidad',
        kpiTitulo: 'Claridad y ergonomía del menú de navegación.',
        kpiEjemplo: 'Ejemplo: si se evalúa la navegación en 10 resoluciones de pantalla distintas (móvil, tablet y escritorio) y en las 10 el menú se despliega claramente sin superposiciones, la claridad es del 100%.',
        datos1: 'Pantallas con navegación clara y accesible = Lp',
        datos2: 'Total de resoluciones de pantalla evaluadas = Lt',
        formula: 'Ergonomía de navegación = Lp / Lt',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple'
    },
    {
        aspecto: 'Usabilidad',
        kpiTitulo: 'Simplicidad en el flujo de pedido a WhatsApp.',
        kpiEjemplo: 'Ejemplo: si completar un pedido desde la selección de sabor hasta abrir WhatsApp con el mensaje estructurado toma 3 pasos de un máximo sugerido de 4, el proceso cumple con máxima simplicidad.',
        datos1: 'Pedidos completados en 3 pasos o menos = Lp',
        datos2: 'Total de flujos de prueba de compra realizados = Lt',
        formula: 'Simplicidad de compra = Lp / Lt',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple'
    },

    // 4. Eficiencia en el Rendimiento
    {
        aspecto: 'Eficiencia en el Rendimiento',
        kpiTitulo: 'Tiempo de respuesta en búsqueda y filtros en cliente.',
        kpiEjemplo: 'Ejemplo: si se ejecutan 30 búsquedas de producto y cambios de categoría en el catálogo y las 30 responden de forma inmediata en el navegador sin latencia de red, la tasa es del 100%.',
        datos1: 'Búsquedas y filtros con respuesta inmediata = Lp',
        datos2: 'Total de consultas y filtros ejecutados = Lt',
        formula: 'Respuesta de filtrado = Lp / Lt',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple'
    },
    {
        aspecto: 'Eficiencia en el Rendimiento',
        kpiTitulo: 'Eficiencia de precarga de botellas por sabor.',
        kpiEjemplo: 'Ejemplo: si al interactuar con los sabores se precargan las 8 imágenes de botellas y las 8 se muestran sin parpadeos ni demoras perceptibles, la eficiencia de precarga es del 100%.',
        datos1: 'Botellas de sabor renderizadas al instante = Lp',
        datos2: 'Total de botellas requeridas en el carrusel = Lt',
        formula: 'Eficiencia de precarga = Lp / Lt',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple'
    },

    // 5. Mantenibilidad
    {
        aspecto: 'Mantenibilidad',
        kpiTitulo: 'Organización modular de la estructura del código.',
        kpiEjemplo: 'Ejemplo: si un sistema cuenta con 18 módulos y los 18 se encuentran desacoplados y organizados en sus carpetas específicas (frontend, backend y database), la modularidad es del 100%.',
        datos1: 'Módulos organizados en carpetas independientes = Lp',
        datos2: 'Total de módulos que componen el aplicativo = Lt',
        formula: 'Modularidad del código = Lp / Lt',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple'
    },
    {
        aspecto: 'Mantenibilidad',
        kpiTitulo: 'Autonomía de gestión desde el panel de administración.',
        kpiEjemplo: 'Ejemplo: si el administrador puede realizar las 4 acciones CRUD (crear, listar, modificar y eliminar productos) directamente desde la interfaz web sin tocar código, la autonomía es del 100%.',
        datos1: 'Operaciones CRUD funcionales en la interfaz = Lp',
        datos2: 'Total de operaciones CRUD requeridas (4) = Lt',
        formula: 'Autonomía de administración = Lp / Lt',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple'
    },

    // 6. Seguridad
    {
        aspecto: 'Seguridad',
        kpiTitulo: 'Cifrado de contraseñas de usuarios.',
        kpiEjemplo: 'Ejemplo: si se verifica la tabla de usuarios registrados en la base de datos y el 100% de las contraseñas están almacenadas mediante hash bcrypt con salting, el nivel de cifrado es del 100%.',
        datos1: 'Contraseñas almacenadas con hash bcrypt = Lp',
        datos2: 'Total de cuentas de usuario en la base de datos = Lt',
        formula: 'Cifrado de contraseñas = Lp / Lt',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple'
    },
    {
        aspecto: 'Seguridad',
        kpiTitulo: 'Control de acceso a rutas privadas con token JWT.',
        kpiEjemplo: 'Ejemplo: si se realizan 25 intentos de acceso no autorizado a rutas privadas de administración y los 25 son rechazados con códigos HTTP 401 o 403, el control de acceso es del 100%.',
        datos1: 'Accesos no autorizados bloqueados con éxito = Lp',
        datos2: 'Total de intentos de acceso indebido evaluados = Lt',
        formula: 'Control de acceso = Lp / Lt',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple'
    },

    // 7. Compatibilidad
    {
        aspecto: 'Compatibilidad',
        kpiTitulo: 'Integración con WhatsApp y Google Login.',
        kpiEjemplo: 'Ejemplo: si se prueban 10 enlaces de comunicación con WhatsApp y autenticación federada con Google y los 10 conectan con los servicios externos sin error, la compatibilidad es del 100%.',
        datos1: 'Interacciones externas exitosas = Lp',
        datos2: 'Total de pruebas de integración con terceros = Lt',
        formula: 'Integración con terceros = Lp / Lt',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple'
    },
    {
        aspecto: 'Compatibilidad',
        kpiTitulo: 'Estandarización de respuestas JSON de la API.',
        kpiEjemplo: 'Ejemplo: si se evalúan los 14 endpoints del backend y los 14 devuelven datos con cabeceras CORS y formato JSON estándar legible por cualquier navegador moderno, la tasa es del 100%.',
        datos1: 'Endpoints con respuestas JSON y CORS válidas = Lp',
        datos2: 'Total de endpoints evaluados en el servidor = Lt',
        formula: 'Estandarización de API = Lp / Lt',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple'
    },

    // 8. Portabilidad
    {
        aspecto: 'Portabilidad',
        kpiTitulo: 'Instalación documentada mediante archivo README.',
        kpiEjemplo: 'Ejemplo: si se siguen los 10 pasos indicados en el README.md en un entorno limpio y el proyecto se descarga, configura y arranca sin pasos omitidos, la efectividad es del 100%.',
        datos1: 'Pasos de instalación ejecutados con éxito = Lp',
        datos2: 'Total de pasos documentados en la guía = Lt',
        formula: 'Efectividad de instalación = Lp / Lt',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple'
    },
    {
        aspecto: 'Portabilidad',
        kpiTitulo: 'Configuración centralizada en variables de entorno.',
        kpiEjemplo: 'Ejemplo: si se requiere migrar a otro servidor y los 8 parámetros críticos (puerto, URL de base de datos, credenciales) se modifican en .env y config.js sin alterar el código, la portabilidad es del 100%.',
        datos1: 'Variables de conexión configurables en .env = Lp',
        datos2: 'Total de parámetros de entorno requeridos = Lt',
        formula: 'Configuración de entorno = Lp / Lt',
        escala: ['90% - 100% 🟢', '70% - 89% 🟡', '0% - 69% 🔴'],
        estado: 'Cumple'
    }
];

function buildDocumentLandscape() {
    // Ancho total disponible en orientación horizontal (Letter = 11 x 8.5 in -> 15840 x 12240 dxa)
    // Con márgenes de 0.75 in (1080 dxa a cada lado), el ancho imprimible es de 13680 dxa
    const colWidths = [1800, 3900, 3100, 2180, 1400, 1300];

    const tableRows = [];

    // Fila 1: Encabezados (Azul institucional con texto blanco)
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
    CRITERIOS_TABLA.forEach((row, i) => {
        const isAlt = i % 2 === 1;

        // Celda Aspecto
        const pAspecto = [
            new Paragraph({
                children: [
                    new TextRun({
                        text: row.aspecto,
                        size: 20,
                        color: COLOR_TEXT,
                        font: 'Calibri'
                    })
                ]
            })
        ];

        // Celda KPI (Título + Ejemplo numérico)
        const pKPI = [
            new Paragraph({
                spacing: { after: 40 },
                children: [
                    new TextRun({
                        text: row.kpiTitulo,
                        size: 20,
                        color: COLOR_TEXT,
                        font: 'Calibri'
                    })
                ]
            }),
            new Paragraph({
                spacing: { before: 40 },
                children: [
                    new TextRun({
                        text: row.kpiEjemplo,
                        size: 19,
                        color: '2D3748',
                        font: 'Calibri'
                    })
                ]
            })
        ];

        // Celda Datos
        const pDatos = [
            new Paragraph({
                spacing: { after: 40 },
                children: [
                    new TextRun({
                        text: row.datos1,
                        size: 19,
                        color: COLOR_TEXT,
                        font: 'Calibri'
                    })
                ]
            }),
            new Paragraph({
                spacing: { before: 40 },
                children: [
                    new TextRun({
                        text: row.datos2,
                        size: 19,
                        color: COLOR_TEXT,
                        font: 'Calibri'
                    })
                ]
            })
        ];

        // Celda Fórmula
        const pFormula = [
            new Paragraph({
                children: [
                    new TextRun({
                        text: row.formula,
                        size: 19,
                        color: COLOR_TEXT,
                        font: 'Calibri'
                    })
                ]
            })
        ];

        // Celda Escala (Semáforo de 3 niveles)
        const pEscala = row.escala.map((item, idx) => {
            return new Paragraph({
                spacing: { before: idx === 0 ? 0 : 20, after: 20 },
                children: [
                    new TextRun({
                        text: item,
                        size: 19,
                        color: COLOR_TEXT,
                        font: 'Calibri'
                    })
                ]
            });
        });

        // Celda Estado (Cumple)
        const pEstado = [
            new Paragraph({
                children: [
                    new TextRun({
                        text: row.estado,
                        size: 20,
                        color: COLOR_TEXT,
                        font: 'Calibri'
                    })
                ]
            })
        ];

        tableRows.push(
            new TableRow({
                children: [
                    tableCell(pAspecto, colWidths[0], isAlt),
                    tableCell(pKPI, colWidths[1], isAlt),
                    tableCell(pDatos, colWidths[2], isAlt),
                    tableCell(pFormula, colWidths[3], isAlt),
                    tableCell(pEscala, colWidths[4], isAlt),
                    tableCell(pEstado, colWidths[5], isAlt)
                ]
            })
        );
    });

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: 'Calibri',
                        size: 22,
                        color: '111827'
                    },
                    paragraph: {
                        spacing: { line: 260, before: 60, after: 60 }
                    }
                }
            }
        },
        sections: [
            {
                properties: {
                    page: {
                        size: {
                            orientation: PageOrientation.LANDSCAPE,
                            width: 15840,
                            height: 12240
                        },
                        margin: {
                            top: 1080,
                            right: 1080,
                            bottom: 1080,
                            left: 1080
                        }
                    }
                },
                children: [
                    // ENCABEZADO TÉCNICO FORMAL
                    new Paragraph({
                        spacing: { before: 0, after: 60 },
                        children: [
                            new TextRun({
                                text: 'Instrumento de Evaluación de Calidad de Software',
                                bold: true,
                                size: 32, // 16pt
                                color: '1A365D',
                                font: 'Calibri'
                            })
                        ]
                    }),
                    new Paragraph({
                        spacing: { before: 0, after: 120 },
                        children: [
                            new TextRun({ text: 'Software Evaluado: ', bold: true, size: 20 }),
                            new TextRun({ text: 'YogurASO   |   ', size: 20 }),
                            new TextRun({ text: 'Versión: ', bold: true, size: 20 }),
                            new TextRun({ text: '1.0.0   |   ', size: 20 }),
                            new TextRun({ text: 'Fecha de Evaluación: ', bold: true, size: 20 }),
                            new TextRun({ text: '4 de octubre de 2026   |   ', size: 20 }),
                            new TextRun({ text: 'Evaluador: ', bold: true, size: 20 }),
                            new TextRun({ text: 'Juan Esteban Acosta', size: 20 })
                        ]
                    }),

                    // BREVE INTRODUCCIÓN HUMANA
                    new Paragraph({
                        spacing: { before: 40, after: 120 },
                        children: [
                            new TextRun({
                                text: 'Este instrumento presenta la evaluación técnica del sistema web YogurASO bajo el modelo de calidad ISO/IEC 25010. Se evaluaron 8 aspectos fundamentales seleccionando exactamente dos criterios aprobados por cada aspecto (16 criterios en total). Cada criterio detalla su indicador clave de rendimiento (KPI) con un ejemplo numérico aplicativo, la fórmula matemática empleada, la escala de semaforización y su estado de cumplimiento verificado.',
                                size: 20,
                                color: '374151'
                            })
                        ]
                    }),

                    // TABLA EXACTA DE LA IMAGEN
                    new Table({
                        width: { size: 13680, type: WidthType.DXA },
                        rows: tableRows
                    }),

                    new Paragraph({ spacing: { before: 200, after: 80 } }),

                    // CONCLUSIONES Y OBSERVACIONES DEL EVALUADOR
                    new Paragraph({
                        spacing: { before: 100, after: 40 },
                        children: [
                            new TextRun({
                                text: 'Conclusiones y Observaciones Generales',
                                bold: true,
                                size: 24,
                                color: '1A365D',
                                font: 'Calibri'
                            })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: '• Puntos fuertes: ', bold: true, color: '1A365D' }),
                            new TextRun({ text: 'Backend ordenado y modular, contraseñas debidamente cifradas con bcrypt, rutas privadas protegidas con token JWT y control de rol de administrador, y límite de intentos de acceso. El catálogo interactivo, el carrito de compras y la generación de pedido a WhatsApp operan de forma íntegra, con código documentado y suites de prueba funcionales.' })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: '• Áreas de mejora: ', bold: true, color: '1A365D' }),
                            new TextRun({ text: 'Comprimir imágenes restantes de alto peso (como fondos y banners) hacia formato WebP, incorporar mediciones formales de velocidad de carga y ampliar la matriz de pruebas documentadas en navegadores adicionales como Firefox y celulares iOS/Android.' })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: '• Recomendaciones: ', bold: true, color: '1A365D' }),
                            new TextRun({ text: 'Optimizar los recursos multimedia pesados, configurar la línea telefónica definitiva en config.js para la atención comercial por WhatsApp, y revisar los reportes de Playwright antes del despliegue productivo final.' })
                        ]
                    }),

                    new Paragraph({ spacing: { before: 200, after: 40 } }),

                    // FIRMA FORMAL
                    new Paragraph({
                        alignment: AlignmentType.LEFT,
                        spacing: { before: 180, after: 40 },
                        children: [
                            new TextRun({ text: '____________________________________________', color: '9CA3AF' })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.LEFT,
                        spacing: { before: 0, after: 20 },
                        children: [
                            new TextRun({ text: 'Juan Esteban Acosta', bold: true, size: 21, color: '1A365D' })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.LEFT,
                        spacing: { before: 0, after: 0 },
                        children: [
                            new TextRun({ text: 'Evaluador de Calidad de Software — Proyecto YogurASO v1.0.0', italics: true, size: 19, color: '4B5563' })
                        ]
                    })
                ]
            }
        ]
    });

    return doc;
}

async function safeWrite(targetPath, fallbackPath, buffer) {
    try {
        fs.writeFileSync(targetPath, buffer);
        console.log('Guardado exitosamente en:', targetPath);
        return targetPath;
    } catch (e) {
        if (e.code === 'EBUSY') {
            console.warn(`Archivo bloqueado (abierto en Word): ${targetPath}. Guardando en versión alternativa...`);
            fs.writeFileSync(fallbackPath, buffer);
            console.log('Guardado exitosamente en archivo alternativo:', fallbackPath);
            return fallbackPath;
        } else {
            throw e;
        }
    }
}

async function run() {
    console.log('Generando documento Word con diseño exacto de la imagen de referencia...');
    const doc = buildDocumentLandscape();
    const buffer = await Packer.toBuffer(doc);

    const downloadsFile = 'C:\\Users\\acost\\Downloads\\Instrumento_Evaluacion_Calidad_YogurASO.docx';
    const downloadsFallback = 'C:\\Users\\acost\\Downloads\\Instrumento_Evaluacion_Calidad_YogurASO_Final.docx';

    const desktopFile = 'C:\\Users\\acost\\Desktop\\Instrumento_Evaluacion_Calidad_YogurASO.docx';
    const desktopFallback = 'C:\\Users\\acost\\Desktop\\Instrumento_Evaluacion_Calidad_YogurASO_Final.docx';

    const repoFile = 'c:\\Users\\acost\\Desktop\\YOGURASO-WEB\\docs\\Instrumento_Evaluacion_Calidad_YogurASO.docx';
    const repoFallback = 'c:\\Users\\acost\\Desktop\\YOGURASO-WEB\\docs\\Instrumento_Evaluacion_Calidad_YogurASO_Final.docx';

    await safeWrite(downloadsFile, downloadsFallback, buffer);
    await safeWrite(desktopFile, desktopFallback, buffer);
    await safeWrite(repoFile, repoFallback, buffer);
}

run().catch(err => {
    console.error('Error al generar:', err);
    process.exit(1);
});
