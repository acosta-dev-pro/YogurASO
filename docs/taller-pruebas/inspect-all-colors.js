const fs = require('fs');
const path = require('path');

(async () => {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const pdfPath = path.join(process.env.USERPROFILE, 'Downloads', 'AA1_EV02_Plan de Pruebas.pdf');
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const OPS = pdfjsLib.OPS;

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const ops = await page.getOperatorList();
    const { fnArray, argsArray } = ops;
    console.log('\n==== PAGE', i, 'non-black fills ====');
    for (let k = 0; k < fnArray.length; k++) {
      if (fnArray[k] === OPS.setFillRGBColor) {
        const c = [...argsArray[k]];
        if (!(c[0]===0 && c[1]===0 && c[2]===0) && !(c[0]===1 && c[1]===1 && c[2]===1)) {
          let text = '';
          if (fnArray[k+1] === OPS.constructPath && argsArray[k+1][2]) {
            const bb = argsArray[k+1][2];
            const tc = await page.getTextContent();
            text = tc.items.filter(it => {
              const x = it.transform[4], y = it.transform[5], w = it.width||10;
              return !(x+w < bb[0] || x > bb[2] || y+10 < bb[1] || y > bb[3]);
            }).map(it => it.str).join('');
          }
          console.log('color', c, 'text:', JSON.stringify(text));
        }
      }
    }
  }
})().catch(e => { console.error(e); process.exit(1); });
