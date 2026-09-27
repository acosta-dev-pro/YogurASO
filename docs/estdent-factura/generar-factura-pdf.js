const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const HTML = path.join(__dirname, 'factura-medica.html');
const PDF = 'C:/Users/acost/Downloads/EstDent_Factura_Medica.pdf';

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto('file:///' + HTML.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
    await page.pdf({
      path: PDF,
      format: 'letter',
      printBackground: true,
      margin: { top: '1.2cm', bottom: '1.2cm', left: '1.4cm', right: '1.4cm' },
    });
    console.log('PDF:', PDF);
    console.log('Tamaño:', (fs.statSync(PDF).size / 1024).toFixed(1), 'KB');
  } finally {
    await browser.close();
  }
})();
