/**
 * Plantilla VACÍA — GA9-220501096-AA2-EV01
 * Mismos campos/tablas que el Excel diligenciado, sin datos de pruebas.
 */
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const OUT = path.join(
  process.env.USERPROFILE,
  'Downloads',
  'GA9-220501096-AA2-EV01_Casos_Prueba_YogurASO_VACIO.xlsx'
);
const LOGO = path.join(__dirname, 'evidencias', 'logo_yoguraso.png');

const BRAND = 'FA5053';
const CREAM = 'FFF8F4';
const HEADER = '7A1F24';
const SOFT = 'FFE4E1';
const GRAY = 'F3F3F3';

function styleFill(argb) {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + argb } };
}

function thinBorder() {
  const b = { style: 'thin', color: { argb: 'FF999999' } };
  return { top: b, left: b, bottom: b, right: b };
}

function setCell(ws, r, c, value, opts = {}) {
  const cell = ws.getCell(r, c);
  cell.value = value;
  cell.border = thinBorder();
  cell.alignment = {
    vertical: 'middle',
    wrapText: true,
    horizontal: opts.align || 'left'
  };
  if (opts.bold) cell.font = { bold: true, name: 'Calibri', size: opts.size || 11, color: opts.color ? { argb: 'FF' + opts.color } : undefined };
  else cell.font = { name: 'Calibri', size: opts.size || 11, color: opts.color ? { argb: 'FF' + opts.color } : undefined };
  if (opts.fill) cell.fill = styleFill(opts.fill);
  return cell;
}

async function addLogo(ws, workbook) {
  if (!fs.existsSync(LOGO)) return;
  const imgId = workbook.addImage({ filename: LOGO, extension: 'png' });
  ws.addImage(imgId, { tl: { col: 0.2, row: 0.2 }, ext: { width: 90, height: 78 } });
}

async function build() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'YogurASO';
  wb.title = 'GA9-220501096-AA2-EV01 Plantilla vacía Casos de Prueba';

  // ===== Hoja de Control (vacía / placeholders) =====
  const hc = wb.addWorksheet('Hoja de Control', {
    properties: { tabColor: { argb: 'FF' + BRAND } },
    views: [{ showGridLines: false }]
  });
  hc.columns = [
    { width: 28 }, { width: 36 }, { width: 28 }, { width: 28 }, { width: 22 }, { width: 18 }
  ];
  hc.getRow(1).height = 78;
  for (let c = 1; c <= 6; c++) setCell(hc, 1, c, '', { fill: CREAM });
  hc.mergeCells('B1:F1');
  setCell(hc, 1, 2, 'YogurASO  ·  Plan de Pruebas de Integración\nGA9-220501096-AA2-EV01  |  GFPI-F-135 V01\n(PLANTILLA VACÍA)', {
    bold: true, size: 15, fill: CREAM, align: 'center', color: BRAND
  });
  await addLogo(hc, wb);

  const controlFields = [
    [3, 'Organismo / Institución', '', 'Unidad / Evidencia', 'GA9-220501096-AA2-EV01'],
    [4, 'Proyecto', 'YogurASO – Tienda web de yogurt artesanal', 'Entregable', 'Formato de casos de prueba (Excel)'],
    [5, 'Autor', '', 'Versión / Edición', '0100'],
    [6, 'Aprobado por', '', 'Fecha aprobación', '']
  ];
  controlFields.forEach(([r, l1, v1, l2, v2]) => {
    setCell(hc, r, 1, l1, { bold: true, fill: SOFT });
    hc.mergeCells(r, 2, r, 3);
    setCell(hc, r, 2, v1, { fill: GRAY });
    setCell(hc, r, 4, l2, { bold: true, fill: SOFT });
    hc.mergeCells(r, 5, r, 6);
    setCell(hc, r, 5, v2, { fill: GRAY });
  });
  setCell(hc, 5, 6, '', { fill: GRAY }); // fecha versión vacía

  setCell(hc, 8, 1, 'REGISTRO DE CAMBIOS', { bold: true, fill: BRAND, color: 'FFFFFF', size: 12 });
  hc.mergeCells('A8:F8');
  ['Versión', 'Causa del cambio', 'Responsable del cambio', 'Fecha del cambio', '', ''].forEach((h, i) =>
    setCell(hc, 9, i + 1, h, { bold: true, fill: SOFT, align: 'center' })
  );
  for (let r = 10; r <= 12; r++) {
    for (let c = 1; c <= 6; c++) setCell(hc, r, c, '', { fill: 'FFFFFF' });
    hc.getRow(r).height = 22;
  }

  setCell(hc, 14, 1, 'CONTROL DE DISTRIBUCIÓN', { bold: true, fill: BRAND, color: 'FFFFFF', size: 12 });
  hc.mergeCells('A14:F14');
  setCell(hc, 15, 1, 'Nombre y Apellidos', { bold: true, fill: SOFT });
  hc.mergeCells('B15:C15');
  setCell(hc, 15, 2, '', { fill: GRAY });
  setCell(hc, 15, 4, 'Documento', { bold: true, fill: SOFT });
  hc.mergeCells('E15:F15');
  setCell(hc, 15, 5, 'Plan / Casos de Prueba de Integración — YogurASO', { fill: GRAY });

  setCell(hc, 17, 1, 'NOTA', { bold: true, fill: SOFT });
  hc.mergeCells('B17:F18');
  setCell(hc, 17, 2, 'Plantilla vacía: diligencie autor, fechas y resultados. Use las hojas “Casos de Prueba GFPI”, “Ambiente de Pruebas” y “Pruebas de Integración”. Herramientas sugeridas: Postman (API) y Playwright (UI/E2E).');

  // ===== Ambiente (estructura + filas vacías de valor) =====
  const amb = wb.addWorksheet('Ambiente de Pruebas', {
    properties: { tabColor: { argb: 'FF4CAF50' } }
  });
  amb.columns = [{ width: 32 }, { width: 55 }, { width: 40 }];
  amb.getRow(1).height = 70;
  for (let c = 1; c <= 3; c++) setCell(amb, 1, c, '', { fill: CREAM });
  amb.mergeCells('B1:C1');
  setCell(amb, 1, 2, 'Definición del ambiente / entorno de pruebas — YogurASO (VACÍO)', {
    bold: true, size: 13, fill: CREAM, align: 'center', color: BRAND
  });
  await addLogo(amb, wb);

  const ambLabels = [
    ['Elemento', 'Configuración YogurASO', 'Observación'],
    ['Tipo de aplicación', '', ''],
    ['Sistema operativo', '', ''],
    ['Navegadores', '', ''],
    ['Frontend', '', ''],
    ['Backend', '', ''],
    ['Base de datos', '', ''],
    ['Autenticación', '', ''],
    ['Herramienta API', '', ''],
    ['Herramienta UI/E2E', '', ''],
    ['URL API local', '', ''],
    ['URL Frontend local', '', ''],
    ['Variables de entorno', '', ''],
    ['Evidencias', '', '']
  ];
  ambLabels.forEach((row, idx) => {
    const r = idx + 3;
    row.forEach((val, i) => {
      setCell(amb, r, i + 1, val, {
        bold: idx === 0 || (i === 0 && idx > 0),
        fill: idx === 0 ? BRAND : i === 0 ? SOFT : 'FFFFFF',
        color: idx === 0 ? 'FFFFFF' : undefined,
        align: idx === 0 ? 'center' : 'left'
      });
    });
    amb.getRow(r).height = idx === 0 ? 22 : 26;
  });

  // ===== Casos GFPI vacíos =====
  const cp = wb.addWorksheet('Casos de Prueba GFPI', {
    properties: { tabColor: { argb: 'FF' + BRAND } }
  });
  const headers = [
    'Número de caso',
    'Nombre del proyecto',
    'Nombre del caso de prueba',
    'Fecha de revisión',
    'Descripción del caso de prueba',
    'Ambiente o entorno de prueba',
    'Herramienta utilizada',
    'Autor del caso de prueba',
    'Salida esperada',
    'Salida obtenida',
    'Resultado',
    'Seguimiento',
    'Severidad',
    'Evidencia',
    'Firma de aprobación'
  ];
  cp.columns = headers.map((h) => ({ width: Math.min(36, Math.max(16, h.length + 4)) }));
  cp.getColumn(3).width = 38;
  cp.getColumn(5).width = 48;
  cp.getColumn(6).width = 40;
  cp.getColumn(9).width = 36;
  cp.getColumn(10).width = 40;
  cp.getColumn(14).width = 36;

  cp.getRow(1).height = 72;
  cp.mergeCells(1, 1, 1, 15);
  setCell(cp, 1, 1, 'FORMATO DE CASOS DE PRUEBA — YogurASO  |  GA9-220501096-AA2-EV01  |  GFPI-F-135 V01  (PLANTILLA VACÍA)', {
    bold: true, size: 13, fill: CREAM, align: 'center', color: BRAND
  });
  for (let c = 2; c <= 15; c++) setCell(cp, 1, c, '', { fill: CREAM });
  await addLogo(cp, wb);

  headers.forEach((h, i) => {
    setCell(cp, 2, i + 1, h, { bold: true, fill: BRAND, color: 'FFFFFF', align: 'center', size: 10 });
  });
  cp.getRow(2).height = 32;
  cp.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: 15 } };
  cp.views = [{ state: 'frozen', ySplit: 2 }];

  // 12 filas vacías con solo número sugerido 001..012 y proyecto fijo opcional vacío
  for (let i = 0; i < 12; i++) {
    const r = i + 3;
    for (let c = 1; c <= 15; c++) {
      let val = '';
      if (c === 1) val = String(i + 1).padStart(3, '0'); // solo consecutivos
      setCell(cp, r, c, val, {
        fill: r % 2 === 0 ? GRAY : 'FFFFFF',
        size: 10,
        align: c === 1 || c === 11 || c === 13 ? 'center' : 'left'
      });
    }
    cp.getRow(r).height = 40;
  }

  // Lista desplegable Resultado
  for (let r = 3; r <= 14; r++) {
    cp.getCell(r, 11).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Aprobado,En seguimiento,Rechazado"']
    };
    cp.getCell(r, 13).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Alto,Medio,Bajo,N/A"']
    };
  }

  // ===== Pruebas Integración vacías =====
  const pi = wb.addWorksheet('Pruebas de Integración', {
    properties: { tabColor: { argb: 'FF1976D2' } }
  });
  pi.columns = [
    { width: 12 }, { width: 42 }, { width: 28 }, { width: 28 }, { width: 12 }, { width: 28 }
  ];
  pi.getRow(1).height = 70;
  for (let c = 1; c <= 6; c++) setCell(pi, 1, c, '', { fill: CREAM });
  pi.mergeCells('B1:F1');
  setCell(pi, 1, 2, 'Pruebas de Integración — detalle por caso (plantilla PPI) — YogurASO (VACÍO)', {
    bold: true, size: 12, fill: CREAM, align: 'center', color: BRAND
  });
  await addLogo(pi, wb);

  let row = 3;
  setCell(pi, row, 1, 'Número del Caso de Prueba', { bold: true, fill: BRAND, color: 'FFFFFF', align: 'center', size: 10 });
  setCell(pi, row, 2, 'Componente', { bold: true, fill: BRAND, color: 'FFFFFF', align: 'center', size: 10 });
  pi.mergeCells(row, 3, row, 4);
  setCell(pi, row, 3, 'Descripción de lo que se Probará', { bold: true, fill: BRAND, color: 'FFFFFF', align: 'center', size: 10 });
  setCell(pi, row, 4, '', { fill: BRAND });
  pi.mergeCells(row, 5, row, 6);
  setCell(pi, row, 5, 'Prerrequisitos', { bold: true, fill: BRAND, color: 'FFFFFF', align: 'center', size: 10 });
  setCell(pi, row, 6, '', { fill: BRAND });
  row++;

  // 4 filas resumen vacías con IDs CA001..CA004
  for (let i = 1; i <= 4; i++) {
    setCell(pi, row, 1, `CA${String(i).padStart(3, '0')}`, { bold: true, fill: SOFT, align: 'center' });
    setCell(pi, row, 2, '', { size: 10 });
    pi.mergeCells(row, 3, row, 4);
    setCell(pi, row, 3, '', { size: 10 });
    setCell(pi, row, 4, '', { size: 10 });
    pi.mergeCells(row, 5, row, 6);
    setCell(pi, row, 5, '', { size: 10 });
    setCell(pi, row, 6, '', { size: 10 });
    pi.getRow(row).height = 32;
    row++;
  }

  row += 1;
  setCell(pi, row, 1, 'FICHAS DETALLADAS POR CASO (pasos)', { bold: true, fill: BRAND, color: 'FFFFFF', size: 12 });
  pi.mergeCells(row, 1, row, 6);
  row += 2;

  for (let i = 1; i <= 4; i++) {
    const id = `CA${String(i).padStart(3, '0')}`;
    setCell(pi, row, 1, id, { bold: true, fill: SOFT, align: 'center' });
    pi.mergeCells(row, 2, row, 6);
    setCell(pi, row, 2, '', { bold: true, fill: SOFT, size: 10 });
    row++;

    ['Paso', 'Descripción de pasos a seguir', 'Datos Entrada', 'Salida Esperada', '¿OK?', 'Observaciones']
      .forEach((h, idx) => setCell(pi, row, idx + 1, h, { bold: true, fill: HEADER, color: 'FFFFFF', align: 'center', size: 10 }));
    row++;

    for (let p = 1; p <= 6; p++) {
      setCell(pi, row, 1, p, { align: 'center', fill: GRAY });
      for (let c = 2; c <= 6; c++) setCell(pi, row, c, '', { size: 10 });
      pi.getCell(row, 5).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"Sí,No"']
      };
      pi.getRow(row).height = 24;
      row++;
    }
    row += 1;
  }

  setCell(pi, row, 1, 'Nota:', { bold: true, fill: SOFT });
  pi.mergeCells(row, 2, row, 6);
  setCell(pi, row, 2, 'Complete una ficha por cada caso <<CAxxx>>. Las columnas ¿OK? y Observaciones se llenan al ejecutar las pruebas.');

  // ===== Resumen vacío =====
  const res = wb.addWorksheet('Resumen', { properties: { tabColor: { argb: 'FFFFC107' } } });
  res.columns = [{ width: 28 }, { width: 18 }, { width: 40 }];
  res.getRow(1).height = 60;
  res.mergeCells('A1:C1');
  setCell(res, 1, 1, 'Resumen ejecutivo de pruebas — YogurASO (VACÍO)', {
    bold: true, size: 14, fill: CREAM, align: 'center', color: BRAND
  });
  setCell(res, 1, 2, '', { fill: CREAM });
  setCell(res, 1, 3, '', { fill: CREAM });

  setCell(res, 3, 1, 'Indicador', { bold: true, fill: BRAND, color: 'FFFFFF', align: 'center' });
  setCell(res, 3, 2, 'Valor', { bold: true, fill: BRAND, color: 'FFFFFF', align: 'center' });
  setCell(res, 3, 3, 'Detalle', { bold: true, fill: BRAND, color: 'FFFFFF', align: 'center' });

  const indicators = [
    'Total casos GFPI',
    'Aprobados',
    'En seguimiento',
    'Rechazados',
    'Herramientas',
    'Fecha de revisión',
    'Firma analista'
  ];
  indicators.forEach((name, i) => {
    const r = i + 4;
    setCell(res, r, 1, name, { bold: true, fill: SOFT });
    setCell(res, r, 2, '', { align: 'center', fill: GRAY });
    setCell(res, r, 3, '', { fill: 'FFFFFF' });
  });

  await wb.xlsx.writeFile(OUT);
  console.log('OK:', OUT);
  console.log('Size:', fs.statSync(OUT).length);
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
