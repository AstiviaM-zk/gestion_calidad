import { query } from '../config/db.js';
import bcrypt from 'bcryptjs';

/**
 * Formatea el nombre completo a Title Case con un solo espacio entre palabras
 * Ejemplo: "  cARLOS   mAriANo   pERez " -> "Carlos Mariano Perez"
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

// Inicialización de la tabla si no existe (usa estrictamente las columnas originales de la BD: full_name, avatar_url, is_active)
async function initDb() {
  try {
    await query(`CREATE SCHEMA IF NOT EXISTS qms;`);
    await query(`
      CREATE TABLE IF NOT EXISTS qms.users (
        id SERIAL PRIMARY KEY,
        google_id VARCHAR(100),
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT,
        avatar_url TEXT,
        role VARCHAR(50) DEFAULT 'operator',
        is_active BOOLEAN DEFAULT TRUE,
        google_login_enabled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    console.warn('⚠️ Base de datos PostgreSQL no disponible o error al verificar tabla qms.users:', err.message);
  }
}

initDb();

/**
 * Mapea la fila de la base de datos (con full_name y avatar_url) al objeto de usuario del sistema
 */
function mapRowToUser(row) {
  const nameVal = row.full_name || '';
  const avatarVal = row.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(nameVal || 'Usuario')}&background=1e3a8a&color=fff`;

  return {
    id: row.id,
    googleId: row.google_id || null,
    name: nameVal,
    givenName: nameVal,
    familyName: '',
    email: row.email,
    picture: avatarVal,
    role: row.role || 'operator',
    status: row.is_active === false ? 'Inactivo' : 'Activo',
    googleLoginEnabled: !!row.google_login_enabled,
    createdAt: row.created_at
  };
}

/**
 * Inserta o actualiza un usuario de Google usando únicamente las columnas de la BD (full_name, avatar_url)
 */
export async function upsertUserFromGoogle(googleUser) {
  if (!googleUser || !googleUser.email) return null;
  const sanitizedName = sanitizeFullName(googleUser.name || 'Usuario Google');
  const email = googleUser.email.toLowerCase().trim();
  const avatarUrl = googleUser.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(sanitizedName)}&background=1e3a8a&color=fff`;

  try {
    const existingRes = await query('SELECT * FROM qms.users WHERE LOWER(email) = $1', [email]);
    if (existingRes.rows.length > 0) {
      const updateRes = await query(
        `UPDATE qms.users 
         SET full_name = $1, google_id = COALESCE($2, google_id), 
             avatar_url = COALESCE($3, avatar_url), 
             google_login_enabled = TRUE, is_active = TRUE
         WHERE LOWER(email) = $4 
         RETURNING *`,
        [sanitizedName, googleUser.googleId, avatarUrl, email]
      );
      return mapRowToUser(updateRes.rows[0]);
    }

    const countRes = await query('SELECT COUNT(*) FROM qms.users');
    const userCount = parseInt(countRes.rows[0].count, 10);
    const role = userCount === 0 ? 'admin_sgc' : 'operator';

    const insertRes = await query(
      `INSERT INTO qms.users 
       (google_id, full_name, email, avatar_url, role, is_active, google_login_enabled)
       VALUES ($1, $2, $3, $4, $5, TRUE, TRUE)
       RETURNING *`,
      [
        googleUser.googleId,
        sanitizedName,
        email,
        avatarUrl,
        role
      ]
    );
    return mapRowToUser(insertRes.rows[0]);
  } catch (err) {
    console.error('Error al guardar usuario de Google en PostgreSQL:', err.message);
    throw err;
  }
}

/**
 * Registro de usuario por formulario usando las columnas originales de la BD (full_name, avatar_url)
 */
export async function registerFormUser({ name, email, password }) {
  const sanitizedName = sanitizeFullName(name);
  const normalizedEmail = email.toLowerCase().trim();
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(sanitizedName)}&background=1e3a8a&color=fff`;

  const existingRes = await query('SELECT * FROM qms.users WHERE LOWER(email) = $1', [normalizedEmail]);
  if (existingRes.rows.length > 0) {
    throw new Error('El correo electrónico ya se encuentra registrado en el sistema.');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const countRes = await query('SELECT COUNT(*) FROM qms.users');
  const userCount = parseInt(countRes.rows[0].count, 10);
  const role = userCount === 0 ? 'admin_sgc' : 'operator';

  const insertRes = await query(
    `INSERT INTO qms.users 
     (google_id, full_name, email, password_hash, avatar_url, role, is_active, google_login_enabled)
     VALUES (NULL, $1, $2, $3, $4, $5, TRUE, FALSE)
     RETURNING *`,
    [
      sanitizedName,
      normalizedEmail,
      passwordHash,
      avatarUrl,
      role
    ]
  );

  return mapRowToUser(insertRes.rows[0]);
}

/**
 * Inicio de sesión por formulario utilizando email y contraseña
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

  return mapRowToUser(userRow);
}

/**
 * Obtener todos los usuarios registrados
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
 * Actualizar rol de usuario
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
