/**
 * Genera un hash bcrypt para pegar en SQL (cambio manual de password).
 * Uso:
 *   node database/generar_hash_password.js "MiClaveNueva123"
 */
const bcrypt = require('bcrypt');

const password = process.argv[2];
if (!password || password.length < 6) {
    console.error('Uso: node database/generar_hash_password.js "TuClave(min 6)"');
    process.exit(1);
}

(async () => {
    const hash = await bcrypt.hash(password, 10);
    console.log('\nHash bcrypt:\n');
    console.log(hash);
    console.log('\nSQL sugerido:\n');
    console.log(`UPDATE usuarios`);
    console.log(`SET password = '${hash}', updated_at = NOW()`);
    console.log(`WHERE email = 'admin@yoguraso.com';`);
    console.log('');
})();
