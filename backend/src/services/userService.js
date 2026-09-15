import { query } from '../config/db.js';
import bcrypt from 'bcryptjs';

/**
 * Helper to format full name into Title Case with single spaces between words
 * Example: "  cARLOS   mAriANo   pERez " -> "Carlos Mariano Perez"
 */
export function sanitizeFullName(name) {
  if (!name || typeof name !== 'string') return '';
  const cleaned = name.trim().replace(/\s+/g, ' ');
  return cleaned
    .toLowerCase()
    .split(' ')
    .map(word => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
    .join(' ');
}

// Auto-initialize DB table and schema on import
async function initDb() {
  try {
    await query(`CREATE SCHEMA IF NOT EXISTS qms;`);
    await query(`
      CREATE TABLE IF NOT EXISTS qms.users (
        id VARCHAR(50) PRIMARY KEY,
        google_id VARCHAR(100),
        name VARCHAR(255) NOT NULL,
        given_name VARCHAR(255),
        family_name VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        picture TEXT,
        role VARCHAR(50) DEFAULT 'operator',
        status VARCHAR(50) DEFAULT 'Activo',
        google_login_enabled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Ensure google_id is NOT NULL constraint removed if it exists
    await query(`ALTER TABLE qms.users ALTER COLUMN google_id DROP NOT NULL;`).catch(() => {});
    // Add google_login_enabled column if missing
    await query(`ALTER TABLE qms.users ADD COLUMN IF NOT EXISTS google_login_enabled BOOLEAN DEFAULT FALSE;`).catch(() => {});
    await query(`ALTER TABLE qms.users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);`).catch(() => {});
  } catch (err) {
    console.warn('⚠️ Base de datos PostgreSQL no disponible o error al inicializar esquema qms.users:', err.message);
  }
}

initDb();

function mapRowToUser(row) {
  return {
    id: row.id,
    googleId: row.google_id || null,
    name: row.name,
    givenName: row.given_name || row.name,
    familyName: row.family_name || '',
    email: row.email,
    picture: row.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name)}&background=1e3a8a&color=fff`,
    role: row.role || 'operator',
    status: row.status || 'Activo',
    googleLoginEnabled: !!row.google_login_enabled,
    createdAt: row.created_at,
    lastLogin: row.last_login
  };
}

/**
 * Upsert Google User into PostgreSQL
 */
export async function upsertUserFromGoogle(googleUser) {
  if (!googleUser || !googleUser.email) return null;
  const sanitizedName = sanitizeFullName(googleUser.name || 'Usuario Google');
  const email = googleUser.email.toLowerCase().trim();
  const now = new Date();

  try {
    const existingRes = await query('SELECT * FROM qms.users WHERE LOWER(email) = $1', [email]);
    if (existingRes.rows.length > 0) {
      const existing = existingRes.rows[0];
      const updateRes = await query(
        `UPDATE qms.users 
         SET name = $1, google_id = COALESCE($2, google_id), picture = COALESCE($3, picture), 
             google_login_enabled = TRUE, last_login = $4 
         WHERE LOWER(email) = $5 
         RETURNING *`,
        [sanitizedName, googleUser.googleId, googleUser.picture, now, email]
      );
      return mapRowToUser(updateRes.rows[0]);
    }

    const countRes = await query('SELECT COUNT(*) FROM qms.users');
    const userCount = parseInt(countRes.rows[0].count, 10);
    const role = userCount === 0 ? 'admin_sgc' : 'operator';
    const newId = `USR-${(userCount + 1).toString().padStart(3, '0')}`;

    const insertRes = await query(
      `INSERT INTO qms.users 
       (id, google_id, name, given_name, family_name, email, picture, role, status, google_login_enabled, created_at, last_login)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Activo', TRUE, $9, $9)
       RETURNING *`,
      [
        newId,
        googleUser.googleId,
        sanitizedName,
        googleUser.givenName || sanitizedName,
        googleUser.familyName || '',
        email,
        googleUser.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(sanitizedName)}&background=1e3a8a&color=fff`,
        role,
        now
      ]
    );
    return mapRowToUser(insertRes.rows[0]);
  } catch (err) {
    console.error('Error al guardar usuario de Google en PostgreSQL:', err.message);
    throw err;
  }
}

/**
 * Register Form User with Email / Password
 */
export async function registerFormUser({ name, email, password }) {
  const sanitizedName = sanitizeFullName(name);
  const normalizedEmail = email.toLowerCase().trim();

  const existingRes = await query('SELECT * FROM qms.users WHERE LOWER(email) = $1', [normalizedEmail]);
  if (existingRes.rows.length > 0) {
    throw new Error('El correo electrónico ya se encuentra registrado en el sistema.');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const countRes = await query('SELECT COUNT(*) FROM qms.users');
  const userCount = parseInt(countRes.rows[0].count, 10);
  const role = userCount === 0 ? 'admin_sgc' : 'operator';
  const newId = `USR-${(userCount + 1).toString().padStart(3, '0')}`;
  const now = new Date();

  const insertRes = await query(
    `INSERT INTO qms.users 
     (id, google_id, name, given_name, family_name, email, password_hash, picture, role, status, google_login_enabled, created_at, last_login)
     VALUES ($1, NULL, $2, $2, '', $3, $4, $5, $6, 'Activo', FALSE, $7, $7)
     RETURNING *`,
    [
      newId,
      sanitizedName,
      normalizedEmail,
      passwordHash,
      `https://ui-avatars.com/api/?name=${encodeURIComponent(sanitizedName)}&background=1e3a8a&color=fff`,
      role,
      now
    ]
  );

  return mapRowToUser(insertRes.rows[0]);
}

/**
 * Login Form User with Email / Password
 */
export async function loginFormUser({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();
  const res = await query('SELECT * FROM qms.users WHERE LOWER(email) = $1', [normalizedEmail]);
  if (res.rows.length === 0) {
    throw new Error('Correo electrónico o contraseña incorrectos');
  }

  const userRow = res.rows[0];
  if (!userRow.password_hash) {
    if (userRow.google_login_enabled) {
      throw new Error('Esta cuenta fue creada con inicio de sesión de Google. Por favor inicia sesión usando el botón de Google.');
    }
    throw new Error('La cuenta no tiene contraseña configurada.');
  }

  const isMatch = await bcrypt.compare(password, userRow.password_hash);
  if (!isMatch) {
    throw new Error('Correo electrónico o contraseña incorrectos');
  }

  const now = new Date();
  await query('UPDATE qms.users SET last_login = $1 WHERE id = $2', [now, userRow.id]);
  userRow.last_login = now;

  return mapRowToUser(userRow);
}

/**
 * Get all users
 */
export async function getAllUsers() {
  try {
    const res = await query('SELECT * FROM qms.users ORDER BY created_at DESC');
    return res.rows.map(mapRowToUser);
  } catch (err) {
    console.error('Error al obtener usuarios de PostgreSQL:', err.message);
    return [];
  }
}

/**
 * Update user role
 */
export async function updateUserRole(email, newRole) {
  try {
    const res = await query('UPDATE qms.users SET role = $1 WHERE LOWER(email) = $2 RETURNING *', [newRole, email.toLowerCase().trim()]);
    if (res.rows.length > 0) {
      return mapRowToUser(res.rows[0]);
    }
    return null;
  } catch (err) {
    console.error('Error actualizando rol:', err.message);
    return null;
  }
}
