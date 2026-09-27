const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const CFB = require('cfb');

const xlsm = process.argv[2];
const tmp = path.join(__dirname, '_vba_tmp');
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp);
execSync(`powershell -NoProfile -Command "Add-Type -A System.IO.Compression.FileSystem; $z=[IO.Compression.ZipFile]::OpenRead('${xlsm}'); $e=$z.GetEntry('xl/vbaProject.bin'); [IO.Compression.ZipFileExtensions]::ExtractToFile($e,'${path.join(tmp, 'vba.bin')}',$true); $z.Dispose()"`);

function decompress(buf) {
  if (buf[0] !== 1) throw new Error('firma');
  const out = [];
  let pos = 1;
  while (pos < buf.length) {
    const hdr = buf.readUInt16LE(pos);
    const size = (hdr & 0x0fff) + 3;
    const compressed = (hdr & 0x8000) !== 0;
    const end = Math.min(pos + size, buf.length);
    pos += 2;
    const chunkStart = out.length;
    if (!compressed) {
      for (let i = 0; i < 4096 && pos < end; i++) out.push(buf[pos++]);
      continue;
    }
    while (pos < end) {
      const flags = buf[pos++];
      for (let bit = 0; bit < 8 && pos < end; bit++) {
        if ((flags & (1 << bit)) === 0) { out.push(buf[pos++]); continue; }
        const token = buf.readUInt16LE(pos); pos += 2;
        const d = out.length - chunkStart;
        let bitCount = 4;
        while ((1 << bitCount) < d) bitCount++;
        if (bitCount < 4) bitCount = 4;
        const lenMask = 0xffff >> bitCount;
        const offset = (token >> (16 - bitCount)) + 1;
        const length = (token & lenMask) + 3;
        for (let i = 0; i < length; i++) out.push(out[out.length - offset]);
      }
    }
  }
  return Buffer.from(out);
}

const cfb = CFB.read(fs.readFileSync(path.join(tmp, 'vba.bin')));
const byName = (n) => {
  const k = cfb.FullPaths.findIndex(p => p.toLowerCase().replace(/\/$/, '').endsWith('/vba/' + n.toLowerCase()));
  return k >= 0 ? cfb.FileIndex[k] : null;
};
CFB.find = (_c, p) => byName(p.replace(/^VBA\//, ''));
const dir = decompress(Buffer.from(CFB.find(cfb, 'VBA/dir').content));
// module records: 0x0019 name, 0x0031 offset
let i = 0; const mods = []; let cur = null;
while (i < dir.length - 6) {
  const id = dir.readUInt16LE(i); const sz = dir.readUInt32LE(i + 2);
  if (id === 0x0009) { i += 6 + 6; continue; }
  const data = dir.slice(i + 6, i + 6 + sz);
  if (id === 0x0019) { cur = { name: data.toString('latin1') }; mods.push(cur); }
  if (id === 0x0031 && cur) cur.offset = data.readUInt32LE(0);
  i += 6 + sz;
}
for (const m of mods) {
  const e = CFB.find(cfb, 'VBA/' + m.name);
  if (!e || m.offset === undefined) continue;
  const src = decompress(Buffer.from(e.content).slice(m.offset)).toString('latin1');
  const code = src.split(/\r?\n/).filter(l => !/^Attribute /.test(l)).join('\n').trim();
  if (code) console.log(`===== ${m.name}\n${code}\n`);
}
