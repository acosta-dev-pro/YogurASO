/**
 * db.js — Conexión a PostgreSQL (pool)
 * Credenciales obligatorias desde .env (sin passwords hardcodeados).
 */
const { Pool } = require('pg');
require('dotenv').config();

const required = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
    throw new Error(`Faltan variables de entorno de base de datos: ${missing.join(', ')}`);
}

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT || 5432),
});

module.exports = {
    pool,
    query: (text, params) => pool.query(text, params)
};
