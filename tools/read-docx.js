const fs = require('fs');
const cp = require('child_process');

// We can use adm-zip if installed or tar
try {
  const AdmZip = require('adm-zip');
  const zip = new AdmZip('C:/Users/acost/Downloads/Instrumento_Evaluacion_Calidad_YogurASO.docx');
  const xml = zip.readAsText('word/document.xml');
  console.log(xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 3000));
} catch(e) {
  // Let's unzip using tar
  cp.execSync('tar -xf "C:/Users/acost/Downloads/Instrumento_Evaluacion_Calidad_YogurASO.docx" -C "C:/Users/acost/AppData/Local/Temp" word/document.xml');
  const xml = fs.readFileSync('C:/Users/acost/AppData/Local/Temp/word/document.xml', 'utf8');
  console.log(xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 3000));
}
