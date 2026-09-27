require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../src/config/db');

(async () => {
  const u = await db.query('SELECT email, rol, activo FROM usuarios ORDER BY id');
  const p = await db.query('SELECT COUNT(*)::int AS n FROM productos');
  const t = await db.query("SELECT to_regclass('public.tokens_recuperacion') AS t");
  console.log('usuarios:', JSON.stringify(u.rows, null, 2));
  console.log('productos:', p.rows[0].n);
  console.log('tokens_recuperacion:', t.rows[0].t);
  process.exit(0);
})().catch((e) => {
  console.error('DB_ERROR', e.message);
  process.exit(1);
});
