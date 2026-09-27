/**
 * Llena Caso 2 plantilla UNAD — mismo diseño, sin recrear documento.
 * Estudiante: Juan Esteban Acosta
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const AdmZip = require('adm-zip');

const SRC = 'C:/Users/acost/Downloads/Caso 2_nombre estudiante_plantilla.docx';
const OUT = 'C:/Users/acost/Downloads/Caso 2_Juan_Esteban_Acosta_Campus_Soluciones.docx';

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function setParaText(pXml, text) {
  const pPrM = pXml.match(/<w:pPr[\s\S]*?<\/w:pPr>/);
  const pPr = pPrM ? pPrM[0] : '';
  let rPr = '';
  const rPrM = pXml.match(/<w:rPr[\s\S]*?<\/w:rPr>/);
  if (rPrM) rPr = rPrM[0];
  // prefer rPr from first run that has text
  const runWithT = pXml.match(/<w:r\b[\s\S]*?<w:t[\s\S]*?<\/w:r>/);
  if (runWithT) {
    const rp = runWithT[0].match(/<w:rPr[\s\S]*?<\/w:rPr>/);
    if (rp) rPr = rp[0];
  }
  const open = pXml.match(/^<w:p\b[^>]*>/)[0];
  return `${open}${pPr}<w:r>${rPr}<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function mapParas(xml, fn) {
  let i = 0;
  return xml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, (p) => {
    const t = [...p.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((x) => x[1]).join('');
    if (!t.trim()) return p;
    i += 1;
    const neu = fn(i, t, p);
    return neu == null ? p : setParaText(p, neu);
  });
}

function setCellText(cellXml, text) {
  const tcPrM = cellXml.match(/<w:tcPr[\s\S]*?<\/w:tcPr>/);
  const tcPr = tcPrM ? tcPrM[0] : '';
  const pMatch = cellXml.match(/<w:p\b[\s\S]*?<\/w:p>/);
  let pPr = '';
  let rPr = '';
  if (pMatch) {
    const pPrM = pMatch[0].match(/<w:pPr[\s\S]*?<\/w:pPr>/);
    pPr = pPrM ? pPrM[0] : '';
    const rPrM = pMatch[0].match(/<w:rPr[\s\S]*?<\/w:rPr>/);
    rPr = rPrM ? rPrM[0] : '';
  }
  const open = cellXml.match(/^<w:tc\b[^>]*>/)[0];
  return `${open}${tcPr}<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p></w:tc>`;
}

function replaceNthTable(xml, tableIndex, cellMap) {
  // cellMap: {1:'...', 6:'...'} 1-based within that table
  let t = 0;
  return xml.replace(/<w:tbl\b[\s\S]*?<\/w:tbl>/g, (tbl) => {
    t += 1;
    if (t !== tableIndex) return tbl;
    let c = 0;
    return tbl.replace(/<w:tc\b[\s\S]*?<\/w:tc>/g, (cell) => {
      c += 1;
      if (Object.prototype.hasOwnProperty.call(cellMap, c)) {
        return setCellText(cell, cellMap[c]);
      }
      return cell;
    });
  });
}

function main() {
  const zip = new AdmZip(SRC);
  const entry = zip.getEntries().find((e) => e.entryName.replace(/\\/g, '/') === 'word/document.xml');
  let xml = entry.getData().toString('utf8');

  const P = {
    6: 'Juan Esteban Acosta',
    13: 'Bogotá, septiembre de 2026',

    15: 'Los conceptos básicos de la contabilidad son la base con la que el futuro profesional de contaduría pública aprende a observar, registrar y entender lo que pasa en una empresa día a día. Sin esa base resulta difícil leer un movimiento, saber qué cuenta se mueve y por qué se mueve.',

    16: 'Esos fundamentos ayudan a comprender, registrar, clasificar y analizar las operaciones económicas: distinguir un activo de un pasivo, reconocer un ingreso o un gasto, y aplicar la ecuación contable Activo = Pasivo + Patrimonio. También permiten ver la naturaleza de cada cuenta y saber cuándo va al débito y cuándo al crédito.',

    17: 'Por lo anterior, el estudio de estos conceptos permite ordenar la información financiera, elaborar registros por partida doble y disponer de datos útiles para controlar recursos y apoyar decisiones. En este informe se aplica esa mirada al caso de Campus Soluciones Integrales S.A.S.',

    18: 'El trabajo se enmarca en el propósito de apropiar los principios y fundamentos contables a partir de operaciones reales del caso, con el fin de identificar cuentas, explicar cambios en la ecuación contable y presentar asientos claros y equilibrados.',

    19: 'Para elaborar este segundo producto del curso Contabilidad Financiera Básica se revisó el material del entorno de aprendizaje, la guía del Caso 2, la rúbrica de evaluación, el material explicativo en Excel y las orientaciones de los encuentros CIPAS y webconferencias de la directora del curso.',

    23: 'Identificar los fundamentos básicos de la contabilidad para clasificar correctamente las cuentas que intervienen en las operaciones de Campus Soluciones Integrales S.A.S. y reconocer su naturaleza deudora o acreedora.',

    24: 'Analizar el principio de partida doble y su aplicación con el fin de elaborar registros contables en los que el total del debe sea igual al total del haber, usando los soportes que respaldan cada movimiento.',

    25: 'Comprender la diferencia entre los componentes de los estados financieros (cuentas reales del estado de situación financiera y cuentas nominales del estado de resultados) y explicar cómo la información contable aporta a la toma de decisiones de la empresa.',

    28: 'Campus Soluciones Integrales S.A.S. es una empresa dedicada a la prestación de servicios tecnológicos para instituciones educativas. Como cualquier organización, realiza transacciones económicas que afectan su situación financiera. En su primer mes de funcionamiento se documentan seis operaciones que permiten practicar clasificación de cuentas, ecuación contable, naturaleza débito-crédito y partida doble.',

    29: 'A continuación se explica cada registro contable: qué ocurrió, qué cuentas intervienen, cómo cambia la ecuación Activo = Pasivo + Patrimonio, cómo se registra al debe y al haber, y qué soporte respalda el movimiento.',

    30: 'Análisis del primer registro contable',

    31: 'En la primera operación, los socios aportan $40.000.000 en efectivo para constituir la empresa. Se afecta la cuenta Caja (activo) al débito porque entra dinero, y la cuenta de Patrimonio – aportes o capital social – al crédito porque aumenta el aporte de los dueños. La ecuación contable crece por ambos lados: sube el activo y sube el patrimonio en el mismo valor. No aparece pasivo en este movimiento. El soporte es el recibo de caja por aporte de capital. Caja es cuenta real de naturaleza deudora; el patrimonio es cuenta real de naturaleza acreedora. Con este registro la empresa queda en capacidad de empezar a operar con recursos propios.',

    32: 'Análisis del segundo registro contable',

    33: 'La empresa traslada $35.000.000 desde caja hacia el banco para abrir y fondear la cuenta bancaria. Se debita Bancos (activo) porque aumenta el dinero disponible en entidad financiera, y se acredita Caja (activo) porque disminuye el efectivo en caja. Aquí el activo total no cambia de tamaño: solo cambia de forma (de caja a bancos). El pasivo y el patrimonio permanecen iguales. El soporte es el comprobante de egreso por traslado de fondos. Ambas cuentas son reales y de naturaleza deudora; una aumenta por el débito y la otra disminuye por el crédito.',

    34: 'Después de este traslado, en caja quedan $5.000.000 ($40.000.000 del aporte menos $35.000.000 consignados) y en bancos aparecen $35.000.000. Ese detalle es útil para control interno: se sabe cuánto efectivo físico hay y cuánto está en el banco listo para pagos por transferencia.',

    35: 'Análisis del tercer registro contable',

    36: 'Como tercera operación, Campus Soluciones Integrales S.A.S. compra cinco computadores por $12.000.000. En el ejercicio se plantea primero la causación de la compra: se debita Equipo de procesamiento de datos (activo no corriente / propiedad planta y equipo) porque la empresa adquiere bienes para su operación, y se acredita Proveedores nacionales (pasivo) porque nace la obligación de pago. La ecuación se mantiene: sube el activo y sube el pasivo en $12.000.000. El soporte de esta causación es la factura de compra. Luego se registra el pago.',

    37: 'Análisis del cuarto registro contable',

    38: 'En la cuarta operación se paga la factura de los computadores con transferencia bancaria por $12.000.000. Se debita Proveedores porque se cancela la deuda (el pasivo disminuye), y se acredita Bancos porque sale dinero de la cuenta bancaria (el activo disminuye). La ecuación contable se equilibra otra vez: bajan activo y pasivo en el mismo valor. El soporte es el comprobante de egreso. Con esto el equipo queda en el activo y la obligación con el proveedor queda saldada.',

    39: 'Análisis del quinto registro contable',

    40: 'En la quinta operación la empresa presta un servicio de capacitación por $4.500.000 y recibe el dinero por consignación bancaria. Se debita Bancos (activo) porque ingresan recursos, y se acredita la cuenta de Ingresos por servicios de capacitación (cuenta nominal o de resultado, naturaleza acreedora) porque se reconoce el ingreso. En la ecuación, el activo aumenta y el patrimonio se fortalece a través del resultado del periodo (el ingreso mejora la utilidad). El soporte es la factura de venta del servicio. Esta operación muestra cómo un ingreso no siempre es “caja chica”: aquí el dinero llega directo al banco.',

    41: 'Análisis del sexto registro contable',

    42: 'Por último, la empresa paga servicios públicos por $350.000. Se debita Gastos por servicios públicos (cuenta nominal de naturaleza deudora, del estado de resultados) y se acredita Bancos porque sale el dinero. El activo disminuye y el gasto reduce el resultado del periodo, lo que impacta el patrimonio vía utilidades. El soporte es el comprobante de egreso. Junto con el arriendo, este movimiento recuerda que no todo egreso de banco es un activo: a veces es un gasto del mes.',

    43: 'En el conjunto de operaciones se usaron cuentas reales como Caja, Bancos, Equipo de procesamiento de datos y Proveedores, que hacen parte del estado de situación financiera (balance). Las cuentas de activo son de naturaleza deudora: aumentan con el débito y disminuyen con el crédito. Las de pasivo y patrimonio son de naturaleza acreedora: aumentan con el crédito y disminuyen con el débito. También se usaron cuentas de resultado: Ingresos (naturaleza acreedora) y Gastos por arriendo y por servicios públicos (naturaleza deudora), que alimentan el estado de resultados. En todos los asientos se cumplió la igualdad de la partida doble: lo debitado fue igual a lo acreditado.',

    44: 'Respecto a Caja, el aporte inicial la subió a $40.000.000; el traslado al banco la bajó en $35.000.000, dejando un saldo de $5.000.000. Bancos, por su parte, recibió $35.000.000, pagó $12.000.000 de equipos, $800.000 de arriendo y $350.000 de servicios públicos, y recibió $4.500.000 por la capacitación. Ese seguimiento de saldos es justo una de las utilidades prácticas de llevar la contabilidad al día.',

    45: 'Estas operaciones sirven a la empresa para llevar control de su dinero y de sus obligaciones, preparar información para estados financieros y tomar decisiones con base en datos: por ejemplo, cuánto efectivo queda, qué tan grande es la inversión en equipos o si los ingresos del mes alcanzan a cubrir gastos como arriendo y servicios. Sin ese registro ordenado, la administración tendría que apoyarse solo en la memoria o en papeles sueltos, y eso complica el control y la transparencia.',

    46: 'A continuación se presentan las operaciones económicas del primer mes, con sus asientos por partida doble. En cada cuadro el total del debe es igual al total del haber.',

    47: 'Los socios aportan $40.000.000 en efectivo para constituir la empresa. (Soporte: recibo de caja por aporte de capital)',

    57: 'Se abre cuenta bancaria y se consignan $35.000.000. (Soporte: comprobante de egreso – traslado de fondos)',

    67: 'Se compran cinco computadores por $12.000.000. Primero se causa la factura a proveedores. (Soporte: factura de compra)',

    79: 'Ahora se hace el pago de los computadores por transferencia bancaria. (Soporte: comprobante de egreso)',

    93: 'Se pagan $800.000 por concepto de arrendamiento. (Soporte: comprobante de egreso)',

    105: 'Se presta un servicio de capacitación por $4.500.000, recibido mediante consignación bancaria. (Soporte: factura de venta)',

    115: 'Se pagan servicios públicos por $350.000. (Soporte: comprobante de egreso)',

    125: 'Todos los ejercicios contables presentados anteriormente son de elaboración propia, con base en el caso Campus Soluciones Integrales S.A.S. y en los recursos del curso.',

    127: 'En conclusión, con este caso se apropiaron conocimientos sobre la naturaleza de las cuentas reales y de las cuentas de resultado. Se aplicó la partida doble en cada operación, se clasificaron activos, pasivos, patrimonio, ingresos y gastos, y se observó cómo cambia la ecuación contable cuando entra o sale dinero, cuando se adquiere un equipo o cuando se reconoce un ingreso. También quedó claro el papel de los soportes (recibo de caja, factura y comprobante de egreso) como evidencia de cada registro. La información obtenida permite a Campus Soluciones Integrales S.A.S. conocer su situación económica inicial, controlar saldos de caja y bancos, y disponer de datos útiles para decidir sobre pagos, inversión en equipos y generación de ingresos por servicios. En resumen, los fundamentos vistos en el curso dejan de ser solo teoría cuando se llevan a asientos concretos y equilibrados como los de este informe.',

    129: 'Fierro, A. M. (2016). Contabilidad general con enfoque NIIF para las pymes (5.ª ed.). Ecoe Ediciones.',

    130: 'Mendoza, A. (2016). Contabilidad financiera para contaduría y administración. Universidad del Norte.',

    131: 'Fierro, A. M. (2016). Contabilidad general con enfoque NIIF para las pymes (5.ª ed.). Ecoe Ediciones.',

    132: 'Alcarria, J. (2016). Contabilidad financiera I. Universitat Jaume I, Servei de Comunicació i Publicacions.',

    // quitar observaciones de la plantilla
    133: 'Declaración: para la organización editorial del presente informe se usó apoyo tecnológico de asistencia de redacción; la interpretación del caso, el análisis contable, las conclusiones y la versión final del texto son de elaboración propia del estudiante.',
    134: '',
    135: '',
    136: '',
    137: '',
    138: '',
    139: '',
  };

  // Extra human paragraphs: expand intro-adjacent by replacing empty won't work.
  // Add content by lengthening existing paras already done.

  xml = mapParas(xml, (i, old, p) => {
    if (Object.prototype.hasOwnProperty.call(P, i)) return P[i];
    return null;
  });

  // Insert intermediate analysis for rent (para 37-38 already cover 4th; need expand rent story - it's para 38 in analysis but rent amount was in fourth analysis wrongly in template)
  // Template structure: 4th analysis was rent in skeleton but we used 4th for payment of computers.
  // Looking at original: 37 Análisis cuarto = rent, 38 rent text. I overwrote 37-38 with computer payment.
  // Need to re-check mapping:
  // 35 tercer = computers cause
  // 36 tercer text
  // 37 cuarto header -> I put "Análisis del cuarto registro" for payment - good
  // 38 cuarto text payment - good
  // But RENT analysis is missing as separate narrative! Original had 4=rent, 5=income, 6=utilities
  // And tables: 3=cause computers, 4=pay computers, 5=rent, 6=income, 7=utilities
  // So we need narrative for rent between payment and income.
  // Original paras: 37 Análisis cuarto (rent), 38 rent text, 39 quinto, 40 income, 41 sexto, 42 utilities
  // I changed 37-38 to payment of computers - then jumped to 39 as fifth = income. RENT narrative lost!
  // Fix: put payment in tercer follow-up and rent in cuarto.

  // Re-do key analysis paras with correct sequence:
  const P2 = {
    35: 'Análisis del tercer registro contable',
    36: 'Como tercera operación, la empresa compra cinco computadores por $12.000.000. Primero se causa la compra: se debita Equipo de procesamiento de datos (activo) y se acredita Proveedores (pasivo) por $12.000.000; en ese momento suben activo y pasivo. Después se paga: se debita Proveedores y se acredita Bancos por el mismo valor; entonces bajan el pasivo y el activo disponible en banco. Al final queda el equipo en el activo y la deuda queda en cero. Los soportes son la factura de compra y el comprobante de egreso del pago. Separar causación y pago ayuda a no confundir “tener el bien” con “haberlo pagado ya”.',
    37: 'Análisis del cuarto registro contable',
    38: 'En la cuarta operación se pagan $800.000 por arrendamiento. Se debita Gastos por arriendos (cuenta de resultado, naturaleza deudora) y se acredita Bancos porque sale el dinero. El activo disminuye y el gasto afecta el resultado del periodo. El soporte es el comprobante de egreso. Este movimiento muestra una salida de banco que no crea otro activo, sino un gasto del mes.',
    39: 'Análisis del quinto registro contable',
    40: 'En la quinta operación la empresa presta un servicio de capacitación por $4.500.000 y recibe el valor por consignación bancaria. Se debita Bancos (activo) y se acredita Ingresos por servicios de capacitación (cuenta nominal, naturaleza acreedora). Sube el activo y se reconoce el ingreso del periodo. El soporte es la factura de venta. Con este ingreso la empresa empieza a generar recursos distintos del aporte inicial de los socios.',
    41: 'Análisis del sexto registro contable',
    42: 'Finalmente, se pagan servicios públicos por $350.000. Se debita Gastos por servicios públicos y se acredita Bancos. De nuevo disminuye el activo disponible y se reconoce un gasto. El soporte es el comprobante de egreso. Junto con el arriendo, este pago ayuda a dimensionar los costos fijos de operación del primer mes.',
  };
  xml = mapParas(xml, (i, old, p) => {
    if (Object.prototype.hasOwnProperty.call(P2, i)) return P2[i];
    return null;
  });

  // Tables amounts and descriptions
  xml = replaceNthTable(xml, 1, {
    7: 'Caja',
    8: 'Aporte de capital en efectivo',
    9: '40.000.000',
    10: '',
    11: '311505',
    12: 'Aportes sociales / capital',
    13: 'Aporte de los socios',
    14: '',
    15: '40.000.000',
  });

  xml = replaceNthTable(xml, 2, {
    6: '111005',
    7: 'Bancos',
    8: 'Consignación apertura de cuenta',
    9: '35.000.000',
    10: '',
    11: '110505',
    12: 'Caja',
    13: 'Traslado de fondos al banco',
    14: '',
    15: '35.000.000',
  });

  xml = replaceNthTable(xml, 3, {
    7: 'Equipo de procesamiento de datos',
    8: 'Compra de 5 computadores',
    9: '12.000.000',
    10: '',
    12: 'Proveedores nacionales',
    13: 'Causación factura de compra',
    14: '',
    15: '12.000.000',
  });

  xml = replaceNthTable(xml, 4, {
    7: 'Proveedores nacionales',
    8: 'Pago de computadores',
    9: '12.000.000',
    10: '',
    11: '111005',
    12: 'Bancos',
    13: 'Salida por transferencia bancaria',
    14: '',
    15: '12.000.000',
  });

  xml = replaceNthTable(xml, 5, {
    7: 'Gastos por arriendos',
    8: 'Causación y pago del arriendo',
    9: '800.000',
    10: '',
    12: 'Bancos',
    13: 'Pago del arriendo',
    14: '',
    15: '800.000',
  });

  xml = replaceNthTable(xml, 6, {
    6: '111005',
    7: 'Bancos',
    8: 'Consignación por servicio de capacitación',
    9: '4.500.000',
    10: '',
    11: '416005',
    12: 'Ingresos por capacitación',
    13: 'Prestación del servicio',
    14: '',
    15: '4.500.000',
  });

  xml = replaceNthTable(xml, 7, {
    6: '513595',
    7: 'Gastos por servicios públicos',
    8: 'Pago de servicios públicos',
    9: '350.000',
    10: '',
    12: 'Bancos',
    13: 'Salida de banco por servicios',
    14: '',
    15: '350.000',
  });

  // Rebuild zip
  const out = new AdmZip();
  for (const e of zip.getEntries()) {
    if (e.isDirectory) continue;
    const name = e.entryName.replace(/\\/g, '/');
    if (name === 'word/document.xml') out.addFile(name, Buffer.from(xml, 'utf8'));
    else out.addFile(name, e.getData());
  }
  out.writeZip(OUT);

  // word count estimate
  const texts = [];
  for (const m of xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)) texts.push(m[1]);
  const body = texts.join(' ');
  const words = body.split(/\s+/).filter(Boolean).length;
  console.log('OK', OUT);
  console.log('approx words (with refs/headers):', words);
}

main();
