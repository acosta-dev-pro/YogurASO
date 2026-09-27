const fs = require('fs');
const path = require('path');

(async () => {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const pdfPath = path.join(process.env.USERPROFILE, 'Downloads', 'AA1_EV02_Plan de Pruebas.pdf');
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const OPS = pdfjsLib.OPS;
  const opNames = Object.fromEntries(Object.entries(OPS).map(([k,v]) => [v,k]));

  for (let i of [1,3,4,5]) {
    const page = await doc.getPage(i);
    const ops = await page.getOperatorList();
    const { fnArray, argsArray } = ops;
    console.log('\n==== PAGE', i, '====');
    for (let k = 0; k < fnArray.length; k++) {
      const fn = fnArray[k];
      const args = argsArray[k];
      if (fn === OPS.setFillRGBColor) {
        const [r,g,b] = args;
        if (r > 200 && g > 200 && b < 50) {
          // print context window
          for (let j = Math.max(0, k-5); j <= Math.min(fnArray.length-1, k+15); j++) {
            console.log(j, opNames[fnArray[j]] || fnArray[j], JSON.stringify(argsArray[j]).slice(0,180));
          }
          console.log('---');
        }
      }
    }
  }
})().catch(e => { console.error(e); process.exit(1); });
