/**
 * db.js — Conexión a PostgreSQL (pool)
 * Credenciales desde backend/.env
 */
const path = require('path');
const { Pool } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const dbHost = process.env.DB_HOST || 'localhost';

if (!dbUser || !dbPassword || !dbName) {
    throw new Error('Faltan DB_USER / DB_PASSWORD / DB_NAME en backend/.env');
}

const pool = new Pool({
    user: dbUser,
    host: dbHost,
    database: dbName,
    password: dbPassword,
    port: Number(process.env.DB_PORT || 5432),
});

module.exports = {
    pool,
    query: (text, params) => pool.query(text, params)
};
