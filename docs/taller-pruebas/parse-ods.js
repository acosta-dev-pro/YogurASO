const fs = require('fs');
const path = require('path');
const xml = fs.readFileSync(path.join(__dirname, 'ods-extract', 'content.xml'), 'utf8');

// Extract table names
const tables = [...xml.matchAll(/table:name="([^"]+)"/g)].map(m => m[1]);
console.log('TABLES:', tables);

// Extract all text:p content in order (rough)
const texts = [...xml.matchAll(/<text:p[^>]*>([\s\S]*?)<\/text:p>/g)].map(m => {
  return m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
}).filter(Boolean);

console.log('\nTEXT COUNT:', texts.length);
texts.forEach((t, i) => console.log(String(i).padStart(3), t.slice(0, 120)));
