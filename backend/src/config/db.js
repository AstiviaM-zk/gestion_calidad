import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'qms_local',
});

// Forzar a que todas las consultas busquen en el esquema qms primero
pool.on('connect', (client) => {
    client.query('SET search_path TO qms, public');
});

export const query = (text, params) => pool.query(text, params);