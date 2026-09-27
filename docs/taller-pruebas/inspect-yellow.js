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
    const viewport = page.getViewport({ scale: 1 });
    const ops = await page.getOperatorList();
    const { fnArray, argsArray } = ops;

    // Collect yellow filled rectangles in PDF user space
    const yellowBoxes = [];
    let fillRGB = null;
    let ctmStack = [[1,0,0,1,0,0]];
    let pendingRect = null;

    const multiply = (m1, m2) => [
      m1[0]*m2[0] + m1[2]*m2[1],
      m1[1]*m2[0] + m1[3]*m2[1],
      m1[0]*m2[2] + m1[2]*m2[3],
      m1[1]*m2[2] + m1[3]*m2[3],
      m1[0]*m2[4] + m1[2]*m2[5] + m1[4],
      m1[1]*m2[4] + m1[3]*m2[5] + m1[5]
    ];
    const apply = (m, x, y) => [m[0]*x + m[2]*y + m[4], m[1]*x + m[3]*y + m[5]];

    let pathRect = null;
    for (let k = 0; k < fnArray.length; k++) {
      const fn = fnArray[k];
      const args = argsArray[k];
      if (fn === OPS.save) ctmStack.push(ctmStack[ctmStack.length-1].slice());
      else if (fn === OPS.restore) ctmStack.pop();
      else if (fn === OPS.transform) ctmStack[ctmStack.length-1] = multiply(ctmStack[ctmStack.length-1], args);
      else if (fn === OPS.setFillRGBColor) fillRGB = args;
      else if (fn === OPS.rectangle) {
        pathRect = args; // x,y,w,h
      } else if (fn === OPS.constructPath) {
        // args: [ops, coords]
        // sometimes rects come here
      } else if (fn === OPS.fill || fn === OPS.eoFill || fn === OPS.fillStroke) {
        if (fillRGB && fillRGB[0] > 250 && fillRGB[1] > 250 && fillRGB[2] < 20 && pathRect) {
          const ctm = ctmStack[ctmStack.length-1];
          const [x,y,w,h] = pathRect;
          const p1 = apply(ctm, x, y);
          const p2 = apply(ctm, x+w, y+h);
          yellowBoxes.push({
            x1: Math.min(p1[0], p2[0]),
            y1: Math.min(p1[1], p2[1]),
            x2: Math.max(p1[0], p2[0]),
            y2: Math.max(p1[1], p2[1])
          });
        }
        pathRect = null;
      }
    }

    const tc = await page.getTextContent();
    const highlighted = [];
    for (const it of tc.items) {
      if (!it.str.trim()) continue;
      const x = it.transform[4];
      const y = it.transform[5];
      const w = it.width || 0;
      const h = it.height || it.transform[3] || 10;
      const cx = x + w/2;
      const cy = y + h/4;
      const hit = yellowBoxes.find(b => cx >= b.x1-2 && cx <= b.x2+2 && cy >= b.y1-2 && cy <= b.y2+2);
      if (hit) highlighted.push(it.str);
    }

    console.log('\n======== PAGE', i, 'yellowBoxes', yellowBoxes.length, '========');
    yellowBoxes.forEach((b, idx) => console.log('box', idx, JSON.stringify(b)));
    console.log('HIGHLIGHTED TEXT:');
    console.log(highlighted.join('|'));

    // Also dump all text with coords for manual check if needed
    if (highlighted.length === 0 && yellowBoxes.length) {
      console.log('--- nearby text heuristic ---');
      for (const b of yellowBoxes) {
        const near = tc.items.filter(it => {
          const x = it.transform[4];
          const y = it.transform[5];
          return x >= b.x1 - 5 && x <= b.x2 + 5 && y >= b.y1 - 5 && y <= b.y2 + 5;
        }).map(it => it.str);
        console.log(near.join(''));
      }
    }
  }
})().catch(e => { console.error(e); process.exit(1); });
