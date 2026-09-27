/**
 * Edita el BMC original: reemplaza textos, conserva diseño e imagen.
 * Empaqueta el DOCX con rutas ZIP correctas (forward slashes).
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const AdmZip = require('adm-zip');

const SRC = 'C:/Users/acost/Downloads/BUSINESS MODEL GOOGLE DOC.docx';
const OUT_SAFE = 'C:/Users/acost/Downloads/BUSINESS_MODEL_CANVAS_EstDent_ORIGINAL_DISENO.docx';
const OUT_ALT = 'C:/Users/acost/Downloads/BUSINESS MODEL GOOGLE DOC - EstDent LLENADO.docx';

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function replaceCellContent(cellXml, lines) {
  const tcPrMatch = cellXml.match(/<w:tcPr[\s\S]*?<\/w:tcPr>/);
  const tcPr = tcPrMatch ? tcPrMatch[0] : '';
  const pMatch = cellXml.match(/<w:p\b[\s\S]*?<\/w:p>/);
  let pPr = '';
  let rPr = '';
  if (pMatch) {
    const pPrM = pMatch[0].match(/<w:pPr[\s\S]*?<\/w:pPr>/);
    pPr = pPrM ? pPrM[0] : '';
    const rPrM = pMatch[0].match(/<w:rPr[\s\S]*?<\/w:rPr>/);
    rPr = rPrM ? rPrM[0] : '';
  }
  const paras = (lines.length ? lines : ['']).map((line) => {
    const text = esc(line);
    const space = ' xml:space="preserve"';
    return `<w:p>${pPr}<w:r>${rPr}<w:t${space}>${text}</w:t></w:r></w:p>`;
  }).join('');
  const open = cellXml.match(/^<w:tc\b[^>]*>/)[0];
  return `${open}${tcPr}${paras}</w:tc>`;
}

function replaceNthCell(xmlStr, n, lines) {
  let count = 0;
  return xmlStr.replace(/<w:tc\b[\s\S]*?<\/w:tc>/g, (cell) => {
    count += 1;
    if (count === n) return replaceCellContent(cell, lines);
    return cell;
  });
}

function loadOriginalXml() {
  // Prefer unlocked copy from temp if original locked
  const candidates = [
    SRC,
    path.join(os.tmpdir(), 'bmc-edit2', 'doc.zip'),
  ];
  for (const c of candidates) {
    try {
      if (!fs.existsSync(c)) continue;
      const z = new AdmZip(c);
      const e = z.getEntries().find((x) => x.entryName.replace(/\\/g, '/') === 'word/document.xml');
      if (!e) continue;
      return { zip: z, xml: e.getData().toString('utf8'), src: c };
    } catch (_) {
      /* try next */
    }
  }
  throw new Error('No se pudo leer el DOCX original (ciérralo en Word).');
}

function main() {
  const { zip, xml: raw, src } = loadOriginalXml();
  let xml = raw;

  xml = replaceNthCell(xml, 10, ['Juan Esteban Acosta']);
  xml = replaceNthCell(xml, 12, ['18/09/2026']);

  xml = replaceNthCell(xml, 25, [
    '1. Consultorios odontológicos',
    '2. Proveedores de servicios en la nube',
    '3. Proveedores de equipos e internet',
  ]);

  xml = replaceNthCell(xml, 26, [
    '1. Desarrollar y mantener el sistema.',
    '2. Crear y mejorar las automatizaciones.',
    '3. Actualizar y corregir errores del sistema.',
    '4. Dar soporte a los usuarios.',
    '5. Proteger y mantener organizada la información.',
  ]);

  xml = replaceNthCell(xml, 27, [
    '¿Qué ofrecemos?',
    'EstDent System es un sistema para consultorios odontológicos que permite organizar la información y automatizar diferentes tareas del día a día.',
    '',
    'Promesa de valor',
    'Ayudar a los consultorios a ahorrar tiempo y reducir tareas repetitivas por medio de la automatización.',
    '',
    'Alegrías',
    '• Ahorrar tiempo en tareas repetitivas.',
    '• Tener la información organizada.',
    '• Facilitar el trabajo del personal.',
    '• Tener procesos más rápidos y ordenados.',
    '',
    'Frustraciones',
    '• Hacer muchas tareas manualmente.',
    '• Perder tiempo buscando información.',
    '• Tener información desorganizada.',
    '• Repetir los mismos procesos todos los días.',
    '',
    '¿De qué manera me diferencio de negocios similares?',
    'EstDent System no solo organiza la información del consultorio, también busca automatizar tareas y procesos repetitivos para que el personal tenga que hacer menos trabajo manual.',
  ]);

  xml = replaceNthCell(xml, 28, [
    '2 estrategias de fidelización de clientes',
    '',
    '1. Dar soporte y ayudar al cliente cuando tenga problemas o dudas con el sistema.',
    '',
    '2. Escuchar las necesidades de los consultorios y agregar mejoras y automatizaciones útiles.',
  ]);

  xml = replaceNthCell(xml, 29, [
    'Cliente principal:',
    'Consultorios odontológicos pequeños y medianos.',
    '',
    'También:',
    '• Odontólogos independientes.',
    '• Clínicas odontológicas.',
    '• Consultorios que realizan muchos procesos manualmente.',
    '• Consultorios que buscan automatizar y organizar su trabajo.',
  ]);

  xml = replaceNthCell(xml, 36, [
    '1. Computadores y equipos de trabajo.',
    '2. Software y herramientas de programación.',
    '3. Servidor y base de datos.',
    '4. Internet.',
    '5. Conocimientos de programación y automatización.',
    '6. EstDent System.',
  ]);

  xml = replaceNthCell(xml, 38, [
    '1. Página web',
    '2. WhatsApp',
    '3. Redes sociales',
    '4. Contacto directo con consultorios',
    '5. Demostraciones del sistema',
  ]);

  xml = replaceNthCell(xml, 42, [
    '1. Servidor y base de datos.',
    '2. Dominio y página web.',
    '3. Herramientas de desarrollo.',
    '4. Mantenimiento y actualizaciones.',
    '5. Soporte técnico.',
    '6. Publicidad y promoción.',
  ]);

  xml = replaceNthCell(xml, 43, [
    '1. Suscripción mensual al sistema.',
    '2. Plan anual.',
    '3. Configuración inicial.',
    '4. Automatizaciones o personalizaciones adicionales.',
    '',
    'Medios de pago:',
    'Nequi – Daviplata – Transferencia bancaria – Efectivo.',
  ]);

  // Rebuild zip with forward-slash names
  const out = new AdmZip();
  for (const e of zip.getEntries()) {
    if (e.isDirectory) continue;
    const name = e.entryName.replace(/\\/g, '/');
    if (name === 'word/document.xml') {
      out.addFile(name, Buffer.from(xml, 'utf8'));
    } else {
      out.addFile(name, e.getData());
    }
  }

  out.writeZip(OUT_SAFE);
  out.writeZip(OUT_ALT);

  try {
    out.writeZip(SRC);
    console.log('Updated original:', SRC);
  } catch (e) {
    console.log('Original locked. Close Word and use:');
  }

  console.log('Saved:', OUT_SAFE);
  console.log('Saved:', OUT_ALT);
  console.log('Source read from:', src);
  console.log('image:', xml.includes('r:embed="rId7"') || xml.includes('image1'));
  console.log('Acosta:', xml.includes('Juan Esteban Acosta'));
}

main();
