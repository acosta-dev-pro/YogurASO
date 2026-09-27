const fs = require('fs');
const path = require('path');

(async () => {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const pdfPath = path.join(process.env.USERPROFILE, 'Downloads', 'AA1_EV02_Plan de Pruebas.pdf');
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  console.log('pages', doc.numPages);

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const annots = await page.getAnnotations();
    console.log('\n=== PAGE', i, 'annots:', annots.length, '===');
    for (const a of annots) {
      console.log(JSON.stringify({
        subtype: a.subtype,
        contents: a.contents,
        color: a.color,
        rect: a.rect
      }));
    }

    const ops = await page.getOperatorList();
    const { fnArray, argsArray } = ops;
    const OPS = pdfjsLib.OPS;
    const yellowRects = [];
    // Track graphics state roughly: when we see yellow fill then rect/fill
    let currentFill = null;
    for (let k = 0; k < fnArray.length; k++) {
      const fn = fnArray[k];
      const args = argsArray[k];
      if (fn === OPS.setFillRGBColor) {
        currentFill = args;
      } else if (fn === OPS.constructPath || fn === OPS.rectangle) {
        // ignore
      } else if ((fn === OPS.fill || fn === OPS.eoFill || fn === OPS.fillStroke) && currentFill) {
        const [r, g, b] = currentFill;
        if (r > 0.85 && g > 0.85 && b < 0.55) {
          yellowRects.push(currentFill);
        }
      }
    }
    console.log('yellow fill ops approx', yellowRects.length, yellowRects.slice(0, 3));

    const tc = await page.getTextContent();
    let line = '';
    let lastY = null;
    const lines = [];
    for (const it of tc.items) {
      const y = Math.round(it.transform[5]);
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        lines.push(line.trim());
        line = '';
      }
      line += it.str + (it.hasEOL ? '\n' : '');
      lastY = y;
    }
    if (line.trim()) lines.push(line.trim());
    console.log(lines.join('\n'));
  }
})().catch(e => { console.error(e); process.exit(1); });
