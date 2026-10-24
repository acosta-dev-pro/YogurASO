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
    PageOrientation,
    TableLayoutType
} = docx;

// Colores del cuadro según la imagen de referencia:
const COLOR_HEADER_BG = '2F6FBD';  // Azul institucional Word/Excel
const COLOR_ROW_BG = 'DCE6F1';     // Azul claro pastel exacto de la imagen
const COLOR_BORDER = 'FFFFFF';     // Líneas blancas divisorias
const COLOR_TEXT = '000000';

function whiteBorder() {
    return {
        style: BorderStyle.SINGLE,
        size: 8, // 1pt
        color: COLOR_BORDER
    };
}

const cellBorders = {
    top: whiteBorder(),
    bottom: whiteBorder(),
    left: whiteBorder(),
    right: whiteBorder()
};

// Generador de variable matemática L_p / L_t con subíndice y sin subrayado rojo de ortografía
function varRun(base = 'L', sub = 'p') {
    return [
        new TextRun({ text: base, italics: true, noProof: true, size: 18, font: 'Calibri' }),
        new TextRun({ text: sub, italics: true, subScript: true, noProof: true, size: 15, font: 'Calibri' })
    ];
}

function headerCell(text, widthPercent, align = AlignmentType.LEFT) {
    return new TableCell({
        width: { size: widthPercent, type: WidthType.PERCENTAGE },
        shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR },
        borders: cellBorders,
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
        children: [
            new Paragraph({
                alignment: align,
                spacing: { before: 0, after: 0 },
                children: [
                    new TextRun({
                        text: text,
                        bold: true,
                        size: 19, // 9.5pt
                        color: 'FFFFFF',
                        font: 'Calibri'
                    })
                ]
            })
        ]
    });
}

function tableCell(paragraphs, widthPercent) {
    return new TableCell({
        width: { size: widthPercent, type: WidthType.PERCENTAGE },
        shading: { fill: COLOR_ROW_BG, type: ShadingType.CLEAR },
        borders: cellBorders,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: paragraphs
    });
}

const CRITERIOS_DATA = [
    // 1. Funcionalidad
    {
        aspecto: 'Funcionalidad',
        kpiTitulo: 'Disponibilidad del catálogo de productos.',
        kpiEjemplo: 'Ejemplo: si el catálogo tiene 8 productos registrados y los 8 se muestran con nombre, imagen, precio y categoría, la disponibilidad es del 100%.',
        d1Label: 'Productos mostrados correctamente',
        d1Sub: 'p',
        d2Label: 'Total de productos registrados',
        d2Sub: 't',
        formulaName: 'Disponibilidad'
    },
    {
        aspecto: 'Funcionalidad',
        kpiTitulo: 'Efectividad operativa del carrito de compras.',
        kpiEjemplo: 'Ejemplo: si se realizan 12 pruebas de agregar, cambiar cantidad y eliminar productos y las 12 se ejecutan con éxito, la efectividad es del 100%.',
        d1Label: 'Operaciones de carrito exitosas',
        d1Sub: 'p',
        d2Label: 'Total de operaciones probadas',
        d2Sub: 't',
        formulaName: 'Efectividad del carrito'
    },

    // 2. Fiabilidad
    {
        aspecto: 'Fiabilidad',
        kpiTitulo: 'Persistencia del carrito de compras.',
        kpiEjemplo: 'Ejemplo: si se recarga la página o se cierra la pestaña 20 veces consecutivas y en las 20 se recupera el carrito intacto, la persistencia es del 100%.',
        d1Label: 'Sesiones con carrito recuperado',
        d1Sub: 'p',
        d2Label: 'Total de recargas evaluadas',
        d2Sub: 't',
        formulaName: 'Persistencia del carrito'
    },
    {
        aspecto: 'Fiabilidad',
        kpiTitulo: 'Disponibilidad de la base de datos.',
        kpiEjemplo: 'Ejemplo: si se envían 50 solicitudes al endpoint /api/health y las 50 confirman conexión activa con PostgreSQL, la disponibilidad es del 100%.',
        d1Label: 'Verificaciones de BD exitosas',
        d1Sub: 'p',
        d2Label: 'Total de verificaciones realizadas',
        d2Sub: 't',
        formulaName: 'Disponibilidad de BD'
    },

    // 3. Usabilidad
    {
        aspecto: 'Usabilidad',
        kpiTitulo: 'Claridad del menú de navegación.',
        kpiEjemplo: 'Ejemplo: si se prueba el menú en 10 tamaños de pantalla (móvil y escritorio) y en los 10 es claro y fácil de usar, la adaptabilidad es del 100%.',
        d1Label: 'Pantallas con menú funcional',
        d1Sub: 'p',
        d2Label: 'Total de pantallas evaluadas',
        d2Sub: 't',
        formulaName: 'Claridad del menú'
    },
    {
        aspecto: 'Usabilidad',
        kpiTitulo: 'Simplicidad del proceso de compra.',
        kpiEjemplo: 'Ejemplo: si el pedido a WhatsApp (catálogo, carrito y envío) se completa en 3 pasos de un límite de 4, la simplicidad alcanza el 100%.',
        d1Label: 'Pedidos completados en ≤ 3 pasos',
        d1Sub: 'p',
        d2Label: 'Total de compras de prueba realizadas',
        d2Sub: 't',
        formulaName: 'Simplicidad de compra'
    },

    // 4. Eficiencia en el Rendimiento
    {
        aspecto: 'Eficiencia en el Rendimiento',
        kpiTitulo: 'Respuesta de filtros en catálogo.',
        kpiEjemplo: 'Ejemplo: si se realizan 30 búsquedas y filtros en el catálogo y las 30 responden al instante en el navegador, la tasa es del 100%.',
        d1Label: 'Filtros con respuesta inmediata',
        d1Sub: 'p',
        d2Label: 'Total de consultas ejecutadas',
        d2Sub: 't',
        formulaName: 'Respuesta de filtros'
    },
    {
        aspecto: 'Eficiencia en el Rendimiento',
        kpiTitulo: 'Eficiencia de precarga de imágenes.',
        kpiEjemplo: 'Ejemplo: si se precargan las 8 botellas de sabor y las 8 se muestran al instante sin parpadeos ni demoras, la eficiencia es del 100%.',
        d1Label: 'Imágenes mostradas al instante',
        d1Sub: 'p',
        d2Label: 'Total de imágenes requeridas',
        d2Sub: 't',
        formulaName: 'Eficiencia de precarga'
    },

    // 5. Mantenibilidad
    {
        aspecto: 'Mantenibilidad',
        kpiTitulo: 'Modularidad del código fuente.',
        kpiEjemplo: 'Ejemplo: si el proyecto cuenta con 15 módulos y los 15 están separados limpiamente en sus carpetas (front, back, db), la modularidad es del 100%.',
        d1Label: 'Módulos en carpetas correctas',
        d1Sub: 'p',
        d2Label: 'Total de módulos analizados',
        d2Sub: 't',
        formulaName: 'Modularidad del código'
    },
    {
        aspecto: 'Mantenibilidad',
        kpiTitulo: 'Gestión desde panel de administración.',
        kpiEjemplo: 'Ejemplo: si el admin puede crear, ver, editar y eliminar productos directamente desde la interfaz web sin tocar código, la autonomía es del 100%.',
        d1Label: 'Operaciones CRUD disponibles',
        d1Sub: 'p',
        d2Label: 'Total de operaciones requeridas',
        d2Sub: 't',
        formulaName: 'Gestión desde admin'
    },

    // 6. Seguridad
    {
        aspecto: 'Seguridad',
        kpiTitulo: 'Cifrado de contraseñas de usuarios.',
        kpiEjemplo: 'Ejemplo: si se verifican 20 cuentas en base de datos y las 20 tienen su contraseña encriptada con bcrypt, el nivel de cifrado es del 100%.',
        d1Label: 'Contraseñas con hash bcrypt',
        d1Sub: 'p',
        d2Label: 'Total de cuentas verificadas',
        d2Sub: 't',
        formulaName: 'Cifrado de contraseñas'
    },
    {
        aspecto: 'Seguridad',
        kpiTitulo: 'Control de acceso a rutas privadas.',
        kpiEjemplo: 'Ejemplo: si se evalúan 25 intentos no autorizados a rutas de administrador y los 25 son bloqueados con HTTP 401 o 403, el control es del 100%.',
        d1Label: 'Accesos indebidos bloqueados',
        d1Sub: 'p',
        d2Label: 'Total de accesos evaluados',
        d2Sub: 't',
        formulaName: 'Control de acceso'
    },

    // 7. Compatibilidad
    {
        aspecto: 'Compatibilidad',
        kpiTitulo: 'Integración con servicios externos.',
        kpiEjemplo: 'Ejemplo: si se prueban 10 enlaces de pedido a WhatsApp y autenticación con Google y los 10 conectan sin fallo, la compatibilidad es del 100%.',
        d1Label: 'Conexiones externas exitosas',
        d1Sub: 'p',
        d2Label: 'Total de pruebas de integración',
        d2Sub: 't',
        formulaName: 'Integración externa'
    },
    {
        aspecto: 'Compatibilidad',
        kpiTitulo: 'Estandarización de la API REST.',
        kpiEjemplo: 'Ejemplo: si se consultan 14 rutas de la API y las 14 devuelven datos en formato JSON estándar con CORS, la compatibilidad es del 100%.',
        d1Label: 'Rutas con JSON estándar y CORS',
        d1Sub: 'p',
        d2Label: 'Total de rutas consultadas',
        d2Sub: 't',
        formulaName: 'Estandarización de API'
    },

    // 8. Portabilidad
    {
        aspecto: 'Portabilidad',
        kpiTitulo: 'Efectividad de la guía de instalación.',
        kpiEjemplo: 'Ejemplo: si se siguen los 10 pasos del README.md en un equipo nuevo y el sistema se instala y arranca sin error, la efectividad es del 100%.',
        d1Label: 'Pasos de instalación exitosos',
        d1Sub: 'p',
        d2Label: 'Total de pasos documentados',
        d2Sub: 't',
        formulaName: 'Efectividad de instalación'
    },
    {
        aspecto: 'Portabilidad',
        kpiTitulo: 'Configuración en variables de entorno.',
        kpiEjemplo: 'Ejemplo: si los 8 parámetros del servidor se configuran en .env y config.js sin alterar el código fuente, la portabilidad es del 100%.',
        d1Label: 'Variables de entorno aisladas',
        d1Sub: 'p',
        d2Label: 'Total de parámetros requeridos',
        d2Sub: 't',
        formulaName: 'Independencia de entorno'
    }
];

function buildDocument() {
    // Porcentajes de ancho para tabla fluida (total = 100%)
    const colPct = [12, 34, 23, 16, 8, 7];

    const tableRows = [];

    // Fila 1: Encabezados
    tableRows.push(
        new TableRow({
            tableHeader: true,
            cantSplit: true,
            children: [
                headerCell('Aspecto', colPct[0]),
                headerCell('KPI', colPct[1]),
                headerCell('Datos', colPct[2]),
                headerCell('Fórmula', colPct[3]),
                headerCell('Escala', colPct[4], AlignmentType.CENTER),
                headerCell('Estado', colPct[5], AlignmentType.CENTER)
            ]
        })
    );

    // Filas de datos
    CRITERIOS_DATA.forEach((item) => {
        // Celda Aspecto
        const cellAspecto = tableCell([
            new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [
                    new TextRun({
                        text: item.aspecto,
                        size: 18,
                        color: COLOR_TEXT,
                        font: 'Calibri'
                    })
                ]
            })
        ], colPct[0]);

        // Celda KPI (Título + Ejemplo aplicativo corto)
        const cellKPI = tableCell([
            new Paragraph({
                spacing: { before: 0, after: 20 },
                children: [
                    new TextRun({
                        text: item.kpiTitulo,
                        size: 18,
                        color: COLOR_TEXT,
                        font: 'Calibri'
                    })
                ]
            }),
            new Paragraph({
                spacing: { before: 20, after: 0 },
                children: [
                    new TextRun({
                        text: item.kpiEjemplo,
                        size: 17, // 8.5pt
                        color: '333333',
                        font: 'Calibri'
                    })
                ]
            })
        ], colPct[1]);

        // Celda Datos (Con formato matemático Lp y Lt y noProof: true para evitar subrayados rojos)
        const cellDatos = tableCell([
            new Paragraph({
                spacing: { before: 0, after: 20 },
                children: [
                    new TextRun({ text: item.d1Label + ' = ', size: 18, color: COLOR_TEXT, font: 'Calibri' }),
                    ...varRun('L', item.d1Sub)
                ]
            }),
            new Paragraph({
                spacing: { before: 20, after: 0 },
                children: [
                    new TextRun({ text: item.d2Label + ' = ', size: 18, color: COLOR_TEXT, font: 'Calibri' }),
                    ...varRun('L', item.d2Sub)
                ]
            })
        ], colPct[2]);

        // Celda Fórmula
        const cellFormula = tableCell([
            new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [
                    new TextRun({ text: item.formulaName + ' = ', size: 18, color: COLOR_TEXT, font: 'Calibri' }),
                    ...varRun('L', 'p'),
                    new TextRun({ text: ' / ', size: 18, color: COLOR_TEXT, font: 'Calibri' }),
                    ...varRun('L', 't')
                ]
            })
        ], colPct[3]);

        // Celda Escala (90%-100% verde, 70%-89% amarillo, 0%-69% rojo)
        const cellEscala = tableCell([
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 10 },
                children: [
                    new TextRun({ text: '90% - 100% ', size: 17, color: COLOR_TEXT, font: 'Calibri' }),
                    new TextRun({ text: '●', color: '16A34A', bold: true, size: 20, font: 'Arial' })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 10, after: 10 },
                children: [
                    new TextRun({ text: '70% - 89% ', size: 17, color: COLOR_TEXT, font: 'Calibri' }),
                    new TextRun({ text: '●', color: 'EAB308', bold: true, size: 20, font: 'Arial' })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 10, after: 0 },
                children: [
                    new TextRun({ text: '0% - 69% ', size: 17, color: COLOR_TEXT, font: 'Calibri' }),
                    new TextRun({ text: '●', color: 'DC2626', bold: true, size: 20, font: 'Arial' })
                ]
            })
        ], colPct[4]);

        // Celda Estado (Cumple, centrado y limpio)
        const cellEstado = tableCell([
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: [
                    new TextRun({
                        text: 'Cumple',
                        size: 18,
                        color: COLOR_TEXT,
                        font: 'Calibri'
                    })
                ]
            })
        ], colPct[5]);

        tableRows.push(
            new TableRow({
                cantSplit: true,
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
                        size: 20,
                        color: COLOR_TEXT
                    },
                    paragraph: {
                        spacing: { line: 240, before: 30, after: 30 }
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
                            width: 12240,  // docx invierte width y height en landscape: esto genera 15840 x 12240 = 11 x 8.5 in
                            height: 15840
                        },
                        margin: {
                            top: 720,
                            right: 720,
                            bottom: 720,
                            left: 720
                        }
                    }
                },
                children: [
                    // ENCABEZADO TÉCNICO FORMAL Y COMPACTO
                    new Paragraph({
                        spacing: { before: 0, after: 30 },
                        children: [
                            new TextRun({
                                text: 'Instrumento de Evaluación de Calidad de Software',
                                bold: true,
                                size: 26, // 13pt
                                color: '1A365D',
                                font: 'Calibri'
                            })
                        ]
                    }),
                    new Paragraph({
                        spacing: { before: 0, after: 60 },
                        children: [
                            new TextRun({ text: 'Software Evaluado: ', bold: true, size: 18 }),
                            new TextRun({ text: 'YogurASO   |   ', size: 18 }),
                            new TextRun({ text: 'Versión: ', bold: true, size: 18 }),
                            new TextRun({ text: '1.0.0   |   ', size: 18 }),
                            new TextRun({ text: 'Fecha: ', bold: true, size: 18 }),
                            new TextRun({ text: '4 de octubre de 2026   |   ', size: 18 }),
                            new TextRun({ text: 'Evaluador: ', bold: true, size: 18 }),
                            new TextRun({ text: 'Juan Esteban Acosta', size: 18 })
                        ]
                    }),
                    new Paragraph({
                        spacing: { before: 0, after: 80 },
                        children: [
                            new TextRun({
                                text: 'Evaluación técnica basada en la norma ISO/IEC 25010 seleccionando exactamente 2 criterios aprobados por cada una de las 8 características de calidad (16 criterios en total).',
                                size: 17,
                                color: '4B5563'
                            })
                        ]
                    }),

                    // TABLA EXACTA DEL MODELO CON ANCHO PORCENTUAL 100%
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: tableRows
                    }),

                    new Paragraph({ spacing: { before: 120, after: 30 } }),

                    // CONCLUSIONES Y OBSERVACIONES
                    new Paragraph({
                        spacing: { before: 40, after: 20 },
                        children: [
                            new TextRun({
                                text: 'Conclusiones y Observaciones Generales',
                                bold: true,
                                size: 21,
                                color: '1A365D',
                                font: 'Calibri'
                            })
                        ]
                    }),
                    new Paragraph({
                        spacing: { before: 10, after: 15 },
                        children: [
                            new TextRun({ text: '• Puntos fuertes: ', bold: true, color: '1A365D', size: 17 }),
                            new TextRun({ text: 'Backend ordenado y modular, contraseñas cifradas con bcrypt, rutas privadas con JWT y verificación de rol admin, y límite de intentos. Catálogo, carrito y pedido a WhatsApp operando sin fallas.', size: 17 })
                        ]
                    }),
                    new Paragraph({
                        spacing: { before: 10, after: 15 },
                        children: [
                            new TextRun({ text: '• Áreas de mejora: ', bold: true, color: '1A365D', size: 17 }),
                            new TextRun({ text: 'Optimizar imágenes restantes a formato WebP, realizar mediciones formales de velocidad de carga y ampliar pruebas documentadas en Firefox y navegadores móviles.', size: 17 })
                        ]
                    }),
                    new Paragraph({
                        spacing: { before: 10, after: 30 },
                        children: [
                            new TextRun({ text: '• Recomendaciones: ', bold: true, color: '1A365D', size: 17 }),
                            new TextRun({ text: 'Comprimir activos multimedia pesados, configurar el número comercial de WhatsApp en config.js y revisar los reportes de Playwright antes del despliegue final.', size: 17 })
                        ]
                    }),

                    // FIRMA FORMAL COMPACTA
                    new Paragraph({
                        alignment: AlignmentType.LEFT,
                        spacing: { before: 80, after: 15 },
                        children: [
                            new TextRun({ text: '____________________________________________', color: '9CA3AF' })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.LEFT,
                        spacing: { before: 0, after: 5 },
                        children: [
                            new TextRun({ text: 'Juan Esteban Acosta', bold: true, size: 19, color: '1A365D' })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.LEFT,
                        spacing: { before: 0, after: 0 },
                        children: [
                            new TextRun({ text: 'Evaluador de Calidad de Software — YogurASO v1.0.0', italics: true, size: 16, color: '6B7280' })
                        ]
                    })
                ]
            }
        ]
    });

    return doc;
}

async function run() {
    console.log('Generando documento Word compacto y limpio sin líneas entrecortadas...');
    const doc = buildDocument();
    const buffer = await Packer.toBuffer(doc);

    // Rutas de destino
    const targets = [
        'C:\\Users\\acost\\Desktop\\Instrumento_Evaluacion_Calidad_YogurASO.docx',
        'c:\\Users\\acost\\Desktop\\YOGURASO-WEB\\docs\\Instrumento_Evaluacion_Calidad_YogurASO.docx',
        'C:\\Users\\acost\\Downloads\\Instrumento_Evaluacion_Calidad_YogurASO_Compacto.docx',
        'C:\\Users\\acost\\Downloads\\Instrumento_Evaluacion_Calidad_YogurASO.docx',
        'C:\\Users\\acost\\Downloads\\Instrumento_Evaluacion_Calidad_YogurASO_Final.docx'
    ];

    for (const target of targets) {
        try {
            fs.writeFileSync(target, buffer);
            console.log('Guardado con éxito en:', target);
        } catch (e) {
            console.warn(`No se pudo escribir en ${target} (posiblemente abierto en Word):`, e.message);
        }
    }
}

run().catch(err => {
    console.error('Error al generar:', err);
    process.exit(1);
});
