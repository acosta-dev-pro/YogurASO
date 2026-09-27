const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const svgPath = path.resolve(__dirname, '../../frontend/assets/favicon.svg');
  const out = path.resolve(__dirname, 'evidencias/logo_yoguraso.png');
  const svg = fs.readFileSync(svgPath, 'utf8').replace('<svg', '<svg width="160" height="160"');
  const html = `<!DOCTYPE html><html><body style="margin:0;background:#fff8f4;display:flex;align-items:center;justify-content:center;height:100vh;font-family:'Segoe UI',sans-serif">
  <div style="text-align:center">
    <div style="width:160px;height:160px;margin:0 auto 14px">${svg}</div>
    <div style="font-size:34px;font-weight:800;color:#FA5053;letter-spacing:0.5px">YogurASO</div>
    <div style="font-size:13px;color:#7a4a4a;margin-top:6px">Yogurt artesanal</div>
  </div></body></html>`;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 420, height: 360 } });
  await page.setContent(html);
  await page.screenshot({ path: out });
  await browser.close();
  console.log('OK', out, fs.statSync(out).size);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
