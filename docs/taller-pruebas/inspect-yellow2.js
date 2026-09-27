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
    const yellowBoxes = [];
    for (let k = 0; k < fnArray.length; k++) {
      if (fnArray[k] === OPS.setFillRGBColor) {
        const [r,g,b] = argsArray[k];
        if (r > 200 && g > 200 && b < 50) {
          const next = argsArray[k+1];
          // constructPath typically follows
          if (fnArray[k+1] === OPS.constructPath && next && next[2]) {
            const bb = next[2];
            yellowBoxes.push({ x1: bb[0], y1: bb[1], x2: bb[2], y2: bb[3] });
          }
        }
      }
    }

    const tc = await page.getTextContent();
    // group text by lines, mark if any glyph center is in a yellow box
    const highlightedSpans = [];
    for (const it of tc.items) {
      if (!it.str) continue;
      const x = it.transform[4];
      const y = it.transform[5];
      const w = it.width || (it.str.length * 5);
      const midX = x + w / 2;
      const midY = y + 3;
      const inYellow = yellowBoxes.some(b => midX >= b.x1 && midX <= b.x2 && midY >= b.y1 && midY <= b.y2);
      if (inYellow) highlightedSpans.push({ str: it.str, x, y });
    }

    // Also: for each yellow box, collect ALL text that intersects horizontally/vertically
    const byBox = yellowBoxes.map((b, idx) => {
      const texts = tc.items.filter(it => {
        const x = it.transform[4];
        const y = it.transform[5];
        const w = it.width || 10;
        const overlaps = !(x+w < b.x1 || x > b.x2 || y+10 < b.y1 || y > b.y2);
        return overlaps && it.str.trim();
      }).map(it => it.str).join('');
      return { idx, box: b, texts };
    });

    console.log('\n======== PAGE', i, '========');
    console.log('yellow boxes:', yellowBoxes.length);
    byBox.forEach(b => console.log(`BOX${b.idx}: "${b.texts}"`, JSON.stringify(b.box)));
    console.log('span join:', highlightedSpans.map(s => s.str).join(''));
  }
})().catch(e => { console.error(e); process.exit(1); });
