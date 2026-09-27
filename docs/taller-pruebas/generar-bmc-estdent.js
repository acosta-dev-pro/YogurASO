/**
 * Business Model Canvas — EstDent System (pro)
 * Llena la plantilla BMC con enfoque en automatización odontológica.
 */
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, VerticalAlign, ShadingType,
  Header, Footer, PageNumber,
} = require('docx');
const fs = require('fs');
const path = require('path');

const OUT = path.resolve('C:/Users/acost/Downloads/Business_Model_Canvas_EstDent_System.docx');
const OUT2 = path.resolve('C:/Users/acost/Downloads/BUSINESS MODEL GOOGLE DOC_EstDent_LLENADO.docx');

const B = { style: BorderStyle.SINGLE, size: 8, color: '1F2937' };
const borders = { top: B, bottom: B, left: B, right: B };

function r(text, o = {}) {
  return new TextRun({
    text: String(text ?? ''),
    font: o.font || 'Calibri',
    size: o.size || 18,
    bold: !!o.bold,
    italics: !!o.italics,
    color: o.color || '111827',
  });
}

function lines(arr, o = {}) {
  if (!arr.length) return [new Paragraph({ children: [r('')] })];
  return arr.map((t, i) => new Paragraph({
    spacing: { after: i === arr.length - 1 ? 60 : 40, line: 240 },
    children: [r(t, { size: o.size || 17, bold: !!o.bold, italics: !!o.italics, color: o.color })],
  }));
}

function cell(content, w, o = {}) {
  const children = Array.isArray(content) ? content : lines([content], o);
  return new TableCell({
    borders,
    width: { size: w, type: WidthType.DXA },
    columnSpan: o.colSpan || 1,
    rowSpan: o.rowSpan || 1,
    shading: { type: ShadingType.CLEAR, fill: o.fill || 'FFFFFF' },
    verticalAlign: o.vAlign || VerticalAlign.TOP,
    children: [
      ...(o.title
        ? [new Paragraph({
          spacing: { after: 80, before: 40 },
          children: [r(o.title, { bold: true, size: 16, color: o.titleColor || '0F766E' })],
        })]
        : []),
      ...children,
    ],
  });
}

function titleBar(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120, before: 40 },
    children: [r(text, { bold: true, size: 32, color: '0F766E' })],
  });
}

function metaRow(label, value) {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      r(label + ' ', { bold: true, size: 20 }),
      r(value, { size: 20 }),
    ],
  });
}

function sectionH(text) {
  return new Paragraph({
    spacing: { before: 220, after: 100 },
    children: [r(text, { bold: true, size: 24, color: '134E4A' })],
  });
}

function p(text, o = {}) {
  return new Paragraph({
    spacing: { after: 100, line: 260 },
    alignment: o.align || AlignmentType.JUSTIFIED,
    children: [r(text, { size: o.size || 20, bold: !!o.bold, italics: !!o.italics })],
  });
}

function bullet(text) {
  return new Paragraph({
    spacing: { after: 60, line: 250 },
    indent: { left: 200 },
    children: [r('•  ' + text, { size: 19 })],
  });
}

async function main() {
  // Classic BMC grid widths (total ~10080 DXA usable)
  // Row1: KP(1680) | KA(1680) | VP(3360) | CR(1680) | CS(1680)  — but KA/KR stacked, CR/CH stacked
  // Standard visual BMC:
  // [8 KP] [7 KA] [1 VP] [4 CR] [2 CS]
  // [8 KP] [6 KR] [1 VP] [3 CH] [2 CS]
  // [9 Cost]           [5 Revenue]

  const wKP = 1680;
  const wKA = 1680;
  const wVP = 3360;
  const wCR = 1680;
  const wCS = 1680;
  const wCost = wKP + wKA + wVP; // 6720
  const wRev = wCR + wCS; // 3360

  const socios = lines([
    '1. Consultorios odontológicos (aliados / early adopters).',
    '2. Proveedores de servicios en la nube (hosting, BD, backups).',
    '3. Proveedores de equipos e internet (infraestructura del consultorio).',
    '',
    'Nota: también se contemplan permisos, licencias de software y cumplimiento de buenas prácticas de protección de datos clínicos.',
  ], { size: 15 });

  const actividades = lines([
    '1. Desarrollar y mantener EstDent System.',
    '2. Crear y mejorar automatizaciones del consultorio.',
    '3. Actualizar el sistema y corregir errores.',
    '4. Dar soporte a los usuarios.',
    '5. Proteger y mantener organizada la información.',
  ], { size: 15 });

  const recursos = lines([
    '1. Computadores y equipos de trabajo.',
    '2. Software y herramientas de programación.',
    '3. Servidor y base de datos.',
    '4. Internet.',
    '5. Conocimientos de programación y automatización.',
    '6. EstDent System (producto).',
  ], { size: 15 });

  const valor = [
    new Paragraph({
      spacing: { after: 60 },
      children: [r('¿Qué ofrecemos?', { bold: true, size: 16, color: '0F766E' })],
    }),
    ...lines([
      'EstDent System es un sistema para consultorios odontológicos que permite organizar la información y automatizar diferentes tareas del día a día.',
    ], { size: 15 }),
    new Paragraph({
      spacing: { before: 60, after: 40 },
      children: [r('Promesa de valor', { bold: true, size: 16, color: '0F766E' })],
    }),
    ...lines([
      'Ayudar a los consultorios a ahorrar tiempo y reducir tareas repetitivas por medio de la automatización.',
    ], { size: 15 }),
    new Paragraph({
      spacing: { before: 60, after: 40 },
      children: [r('Alegrías', { bold: true, size: 15, color: '047857' })],
    }),
    ...lines([
      '• Ahorrar tiempo en tareas repetitivas.',
      '• Tener la información organizada.',
      '• Facilitar el trabajo del personal.',
      '• Tener procesos más rápidos y ordenados.',
    ], { size: 14 }),
    new Paragraph({
      spacing: { before: 60, after: 40 },
      children: [r('Frustraciones que aliviamos', { bold: true, size: 15, color: 'B91C1C' })],
    }),
    ...lines([
      '• Hacer muchas tareas manualmente.',
      '• Perder tiempo buscando información.',
      '• Tener información desorganizada.',
      '• Repetir los mismos procesos todos los días.',
    ], { size: 14 }),
    new Paragraph({
      spacing: { before: 60, after: 40 },
      children: [r('Diferenciación', { bold: true, size: 15, color: '0F766E' })],
    }),
    ...lines([
      'EstDent System no solo organiza la información del consultorio: también busca automatizar tareas y procesos repetitivos para que el personal haga menos trabajo manual.',
    ], { size: 14, italics: true }),
  ];

  const relacion = lines([
    'Estrategias de fidelización (2):',
    '',
    '1. Dar soporte y ayudar al cliente cuando tenga problemas o dudas con el sistema.',
    '',
    '2. Escuchar las necesidades de los consultorios y agregar mejoras y automatizaciones útiles.',
  ], { size: 15 });

  const canales = lines([
    '1. Página web',
    '2. WhatsApp',
    '3. Redes sociales',
    '4. Contacto directo con consultorios',
    '5. Demostraciones del sistema',
  ], { size: 15 });

  const segmentos = [
    new Paragraph({
      spacing: { after: 40 },
      children: [r('Cliente principal', { bold: true, size: 15, color: '0F766E' })],
    }),
    ...lines(['Consultorios odontológicos pequeños y medianos.'], { size: 14 }),
    new Paragraph({
      spacing: { before: 50, after: 30 },
      children: [r('También:', { bold: true, size: 14 })],
    }),
    ...lines([
      '• Odontólogos independientes.',
      '• Clínicas odontológicas.',
      '• Consultorios con muchos procesos manuales.',
      '• Consultorios que buscan automatizar y organizar su trabajo.',
    ], { size: 13 }),
    new Paragraph({
      spacing: { before: 60, after: 30 },
      children: [r('1. Demográfica', { bold: true, size: 13, color: '134E4A' })],
    }),
    ...lines([
      'Edad: 25 a 55 años (titulares y personal administrativo).',
      'Género: hombres y mujeres.',
      'Ocupación: odontólogos, auxiliares, recepcionistas, administradores de clínica.',
      'Nivel educativo: técnico / profesional.',
      'Ingresos: medios a altos (capacidad de pagar suscripción SaaS).',
    ], { size: 12 }),
    new Paragraph({
      spacing: { before: 50, after: 30 },
      children: [r('2. Geográfica', { bold: true, size: 13, color: '134E4A' })],
    }),
    ...lines([
      'Inicio: Neiva y Huila; expansión a ciudades intermedias de Colombia.',
      'Zonas urbanas con consultorio e internet estable.',
    ], { size: 12 }),
    new Paragraph({
      spacing: { before: 50, after: 30 },
      children: [r('3. Conductual', { bold: true, size: 13, color: '134E4A' })],
    }),
    ...lines([
      'Hoy usan agendas, Excel o papel.',
      'Repiten tareas administrativas a diario.',
      'Buscan rapidez, orden y menos carga manual.',
      'Valoran soporte cercano y demos claras.',
    ], { size: 12 }),
    new Paragraph({
      spacing: { before: 50, after: 30 },
      children: [r('4. Psicográfica', { bold: true, size: 13, color: '134E4A' })],
    }),
    ...lines([
      'Perfil práctico, orientado a soluciones.',
      'Quiere ahorrar tiempo y reducir estrés operativo.',
      'Valora confianza, orden y acompañamiento.',
      'Busca modernizar el consultorio sin complicarse.',
    ], { size: 12 }),
  ];

  const costos = lines([
    '1. Servidor y base de datos.',
    '2. Dominio y página web.',
    '3. Herramientas de desarrollo.',
    '4. Mantenimiento y actualizaciones.',
    '5. Soporte técnico.',
    '6. Publicidad y promoción.',
    '',
    'Ejemplo de lectura de costos:',
    '• Costos fijos: hosting/BD, dominio, herramientas base.',
    '• Costos variables: soporte por cliente, publicidad, personalizaciones.',
    '• Gastos de ventas y administración: mensuales según operación.',
  ], { size: 15 });

  const ingresos = lines([
    '1. Suscripción mensual al sistema.',
    '2. Plan anual.',
    '3. Configuración inicial.',
    '4. Automatizaciones o personalizaciones adicionales.',
    '',
    'Medios de pago:',
    'Nequi – Daviplata – Transferencia bancaria – Efectivo.',
  ], { size: 15 });

  const canvas = new Table({
    width: { size: 10080, type: WidthType.DXA },
    columnWidths: [wKP, wKA, wVP, wCR, wCS],
    rows: [
      // Row 1
      new TableRow({
        children: [
          cell(socios, wKP, { title: '8. SOCIOS CLAVE', fill: 'ECFDF5', rowSpan: 2 }),
          cell(actividades, wKA, { title: '7. ACTIVIDADES CLAVE', fill: 'F0FDFA' }),
          cell(valor, wVP, { title: '1. PROPUESTA DE VALOR', fill: 'CCFBF1', rowSpan: 2 }),
          cell(relacion, wCR, { title: '4. RELACIÓN CON CLIENTES', fill: 'F0FDFA' }),
          cell(segmentos, wCS, { title: '2. SEGMENTOS DE CLIENTES', fill: 'ECFDF5', rowSpan: 2 }),
        ],
      }),
      // Row 2
      new TableRow({
        children: [
          cell(recursos, wKA, { title: '6. RECURSOS CLAVE', fill: 'F0FDFA' }),
          cell(canales, wCR, { title: '3. CANALES', fill: 'F0FDFA' }),
        ],
      }),
      // Row 3
      new TableRow({
        children: [
          cell(costos, wCost, { title: '9. ESTRUCTURA DE COSTOS', fill: 'FEF3C7', colSpan: 3 }),
          cell(ingresos, wRev, { title: '5. FUENTES DE INGRESOS', fill: 'DBEAFE', colSpan: 2 }),
        ],
      }),
    ],
  });

  // Fix: colSpan on last row — widths need to match. With 5 columns, colSpan 3 + colSpan 2 = 5.
  // First row has KP rowSpan 2, VP rowSpan 2, CS rowSpan 2 — second row only KA and CR cells. Good.

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { orientation: 'landscape', width: 15840, height: 12240 }, // landscape letter
          margin: { top: 500, right: 500, bottom: 500, left: 500 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [r('EstDent System · Business Model Canvas · v1', { size: 14, italics: true, color: '6B7280' })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              r('Página ', { size: 14, color: '6B7280' }),
              new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: 14, color: '6B7280' }),
            ],
          })],
        }),
      },
      children: [
        titleBar('PLANTILLA MODELO CANVAS — ESTDENT SYSTEM'),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 140 },
          children: [r('Plataforma odontológica para organizar información y automatizar procesos del consultorio', {
            size: 18, italics: true, color: '374151',
          })],
        }),

        new Table({
          width: { size: 10080, type: WidthType.DXA },
          columnWidths: [2520, 2520, 2520, 2520],
          rows: [
            new TableRow({
              children: [
                cell(lines(['Emprendimiento'], { size: 18 }), 2520, { title: 'Diseñado para:', fill: 'F8FAFC' }),
                cell(lines(['Juan Esteban Acosta'], { size: 18 }), 2520, { title: 'Diseñado por:', fill: 'F8FAFC' }),
                cell(lines(['18/09/2026'], { size: 18 }), 2520, { title: 'Fecha:', fill: 'F8FAFC' }),
                cell(lines(['1'], { size: 18 }), 2520, { title: 'Versión:', fill: 'F8FAFC' }),
              ],
            }),
          ],
        }),

        new Paragraph({ spacing: { before: 140, after: 80 }, children: [] }),
        canvas,

        sectionH('Idea central (para sustentar ante el docente)'),
        p('La diferencia de EstDent no es solo digitalizar la información del consultorio: es automatizar tareas repetitivas para ahorrar tiempo y facilitar el trabajo del personal.'),
        p('¿Por qué automatización? Porque hay tareas que se hacen muchas veces de forma manual. La idea es que el sistema se encargue de parte de esos procesos y el personal pueda dedicar más tiempo a otras actividades clínicas y de atención.'),

        sectionH('Resumen ejecutivo del modelo'),
        bullet('Cliente: consultorios odontológicos pequeños y medianos (y clínicas / odontólogos independientes).'),
        bullet('Valor: organización + automatización de procesos repetitivos.'),
        bullet('Canales: web, WhatsApp, redes, contacto directo y demos.'),
        bullet('Ingresos: suscripción mensual/anual, setup inicial y personalizaciones.'),
        bullet('Costos clave: nube, dominio, desarrollo, mantenimiento, soporte y promoción.'),
      ],
    }],
  });

  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(OUT, buf);
  fs.writeFileSync(OUT2, buf);
  console.log('OK', OUT);
  console.log('OK', OUT2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
