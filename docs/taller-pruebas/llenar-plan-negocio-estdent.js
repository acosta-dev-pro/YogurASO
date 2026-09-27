/**
 * Plan de Negocio EstDent — llenado LIMPIO.
 * Solo celdas de entrada. No reescribe fórmulas de la plantilla.
 * Desprotege hojas y muestra fórmulas (hidden:false).
 */
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");

const SRC = path.join(
  "C:/Users/acost/Downloads",
  "Plan de Negocio 3145644 -ANALISIS Y DESARROLLO DE SOFTWARE.xlsm"
);
const OUT = path.join(
  "C:/Users/acost/Downloads",
  "Plan_Negocio_EstDent_System_LIMPIO.xlsx"
);

function set(ws, addr, value) {
  const cell = ws.getCell(addr);
  cell.value = value;
  cell.protection = { locked: false, hidden: false };
}

function setMonths(ws, row, vals) {
  const cols = "BCDEFGHIJKLM".split("");
  cols.forEach((col, i) => set(ws, col + row, vals[i]));
}

(async () => {
  if (!fs.existsSync(SRC)) throw new Error("No está la plantilla: " + SRC);

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(SRC);

  // ── Datos Aprendiz ──
  const da = wb.getWorksheet("Datos Aprendiz");
  set(da, "B6", "EstDent System");
  set(da, "B8", new Date(2026, 8, 25));
  set(da, "A12", "Juan Esteban Acosta");
  set(da, "B12", "CC");

  // ── 1. Inversiones ──
  const inv = wb.getWorksheet("1. Inversiones");
  set(inv, "E3", 2);

  set(inv, "A10", "Portátil desarrollo EstDent");
  set(inv, "B10", "Equipo");
  set(inv, "C10", 1);
  set(inv, "D10", 3500000);

  set(inv, "A11", "Portátil apoyo técnico");
  set(inv, "B11", "Equipo");
  set(inv, "C11", 1);
  set(inv, "D11", 2500000);

  set(inv, "A12", 'Monitor adicional 27"');
  set(inv, "B12", "Equipo");
  set(inv, "C12", 1);
  set(inv, "D12", 700000);

  set(inv, "A13", "UPS / regulador de voltaje");
  set(inv, "B13", "Equipo");
  set(inv, "C13", 1);
  set(inv, "D13", 350000);

  set(inv, "A14", "Kit periféricos (teclado, mouse, cámara, audífonos)");
  set(inv, "B14", "Equipo");
  set(inv, "C14", 1);
  set(inv, "D14", 480000);

  set(inv, "A15", "Disco externo / backup local");
  set(inv, "B15", "Equipo");
  set(inv, "C15", 1);
  set(inv, "D15", 320000);

  // Otras herramientas / software base (sin Cursor; Cursor va en costos fijos mensuales)
  set(inv, "C20", 1);
  set(inv, "D20", 900000);

  set(inv, "C23", 2);
  set(inv, "D23", 420000);
  set(inv, "C24", 2);
  set(inv, "D24", 380000);
  set(inv, "C25", 1);
  set(inv, "D25", 280000);
  set(inv, "C26", 1);
  set(inv, "D26", 450000);
  set(inv, "C31", 1);
  set(inv, "D31", 350000);

  set(inv, "C35", 1);
  set(inv, "D35", 520000);
  set(inv, "C39", 1);
  set(inv, "D39", 380000);

  // ── 2. Mercado ──
  const merc = wb.getWorksheet("2. Mercado");
  set(merc, "A5", "EstDent Básico");
  set(merc, "B5", 79000);
  set(merc, "A6", "EstDent Profesional");
  set(merc, "B6", 129000);
  set(merc, "A7", "EstDent Clínica");
  set(merc, "B7", 199000);
  set(merc, "A8", "Configuración inicial EstDent");
  set(merc, "B8", 250000);
  set(merc, "A9", "Automatización personalizada");
  set(merc, "B9", 350000);

  set(merc, "A12", "NovusOral");
  set(merc, "B12", "Colombia / online");
  set(
    merc,
    "C12",
    "Software odontológico por suscripción; referencia pública cercana a $50.000/mes por profesional."
  );
  set(merc, "A13", "DentaraOS");
  set(merc, "B13", "Colombia / online");
  set(
    merc,
    "C13",
    "Gestión odontológica en la nube; planes publicados desde aproximadamente $129.000/mes."
  );
  set(merc, "A14", "NacarOS");
  set(merc, "B14", "Colombia / online");
  set(
    merc,
    "C14",
    "Software odontológico en la nube; plan Pro cercano a $46.400/mes según información pública."
  );

  set(merc, "C18", 50000);
  set(merc, "D18", 70000);
  set(merc, "E18", 46400);
  set(merc, "C19", 129000);
  set(merc, "D19", 99900);
  set(merc, "E19", 85000);
  set(merc, "C20", 189000);
  set(merc, "D20", 165000);
  set(merc, "E20", 150000);
  set(merc, "C21", 200000);
  set(merc, "D21", 280000);
  set(merc, "E21", 300000);
  set(merc, "C22", 300000);
  set(merc, "D22", 400000);
  set(merc, "E22", 450000);

  // ── 3. Proyección Ventas (solo año 1; años 2-5 ya traen *1.055) ──
  const vent = wb.getWorksheet("3. Proyección Ventas");
  // 50+105+28+25+17 = 225 unidades | ventas ≈ $35.267.000
  setMonths(vent, 7, [2, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6]);
  setMonths(vent, 8, [5, 6, 7, 8, 8, 9, 9, 10, 10, 11, 11, 11]);
  setMonths(vent, 9, [1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4]);
  setMonths(vent, 10, [1, 1, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3]);
  setMonths(vent, 11, [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2]);

  // ── 4. Costos Variables ──
  const cv = wb.getWorksheet("4. Costos Variables");

  set(cv, "A9", "Infraestructura nube (hosting / BD)");
  set(cv, "B9", 1);
  set(cv, "C9", 8000);
  set(cv, "A10", "Almacenamiento y backups");
  set(cv, "B10", 1);
  set(cv, "C10", 2500);
  set(cv, "A11", "Correo / notificaciones");
  set(cv, "B11", 1);
  set(cv, "C11", 2000);
  set(cv, "C12", 3000);

  set(cv, "A26", "Infraestructura nube (hosting / BD)");
  set(cv, "B26", 1);
  set(cv, "C26", 10000);
  set(cv, "A27", "Almacenamiento y backups");
  set(cv, "B27", 1);
  set(cv, "C27", 3500);
  set(cv, "A28", "APIs / mensajería");
  set(cv, "B28", 1);
  set(cv, "C28", 3000);
  set(cv, "C29", 4500);

  set(cv, "A44", "Infraestructura nube (mayor capacidad)");
  set(cv, "B44", 1);
  set(cv, "C44", 12000);
  set(cv, "A45", "Almacenamiento y backups");
  set(cv, "B45", 1);
  set(cv, "C45", 5000);
  set(cv, "A46", "APIs / mensajería / reportes");
  set(cv, "B46", 1);
  set(cv, "C46", 5000);
  set(cv, "C47", 7000);

  set(cv, "A62", "Horas configuración / puesta en marcha");
  set(cv, "B62", 1);
  set(cv, "C62", 28000);
  set(cv, "A63", "Capacitación inicial al consultorio");
  set(cv, "B63", 1);
  set(cv, "C63", 12000);
  set(cv, "A64", "Plantillas y carga de datos inicial");
  set(cv, "B64", 1);
  set(cv, "C64", 5000);
  set(cv, "C65", 4000);

  set(cv, "A80", "Desarrollo de automatización a medida");
  set(cv, "B80", 1);
  set(cv, "C80", 50000);
  set(cv, "A81", "Integraciones API");
  set(cv, "B81", 1);
  set(cv, "C81", 20000);
  set(cv, "A82", "Pruebas y despliegue");
  set(cv, "B82", 1);
  set(cv, "C82", 10000);
  set(cv, "C83", 8000);

  // ── 6. Nómina ──
  const nom = wb.getWorksheet("6. Nomina");
  set(nom, "C6", 1750905);
  set(nom, "A17", "Desarrollo y mantenimiento de software EstDent");
  set(nom, "B17", 1500000);
  set(nom, "A29", "Asesoría comercial y captación de consultorios");
  set(nom, "B29", 800000);

  // ── Cursor AI $70.000/mes (celda amarilla en Costos Fijos) ──
  // La plantilla ya tiene: Año1 = B26*12
  const cf = wb.getWorksheet("7. Costos Fijos");
  set(cf, "A26", "Suscripción Cursor AI (herramienta de desarrollo)");
  set(cf, "B26", 70000);

  // ── Desproteger + mostrar fórmulas (sin tocar las fórmulas) ──
  wb.eachSheet((ws) => {
    try {
      ws.sheetProtection = undefined;
    } catch (_) {}
    if (ws.model && ws.model.sheetProtection) {
      delete ws.model.sheetProtection;
    }
    ws.eachRow({ includeEmpty: true }, (row) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.protection = { locked: false, hidden: false };
      });
    });
  });

  // Borrar si existe salida previa corrupta / ocupar nombre nuevo
  if (fs.existsSync(OUT)) {
    try {
      fs.unlinkSync(OUT);
    } catch (_) {}
  }

  await wb.xlsx.writeFile(OUT);

  // Verificación rápida de apertura
  const check = new ExcelJS.Workbook();
  await check.xlsx.readFile(OUT);
  const names = check.worksheets.map((s) => s.name);
  const inv2 = check.getWorksheet("1. Inversiones");
  const e10 = inv2.getCell("E10").value;
  const cf2 = check.getWorksheet("7. Costos Fijos");

  console.log("OK archivo:", OUT);
  console.log("Hojas:", names.length);
  console.log("E10 (fórmula plantilla):", JSON.stringify(e10));
  console.log("Cursor B26:", cf2.getCell("B26").value, "| A26:", cf2.getCell("A26").value);
  console.log("Protección inversiones:", inv2.sheetProtection);
  console.log("E10 hidden?:", inv2.getCell("E10").protection);

  // Totales esperados (lo calcula Excel con las fórmulas de la plantilla)
  const mach = 3500000 + 2500000 + 700000 + 350000 + 480000 + 320000 + 900000;
  const adeq = mach * 0.04;
  const muebles = 2 * 420000 + 2 * 380000 + 280000 + 450000 + 350000;
  const oficina = 520000 + 380000;
  console.log("Inversión estimada:", Math.round(adeq + mach + muebles + oficina));
  console.log("Cursor año 1 (70k*12):", 70000 * 12);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
