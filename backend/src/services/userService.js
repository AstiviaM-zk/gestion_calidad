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

// Inicialización de la tabla si no existe
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
        id_role BIGINT DEFAULT 3,
        is_active BOOLEAN DEFAULT TRUE,
        google_login_enabled BOOLEAN DEFAULT FALSE,
        last_login TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await query(`ALTER TABLE qms.users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;`);
    await query(`ALTER TABLE qms.users ADD COLUMN IF NOT EXISTS id_role BIGINT DEFAULT 3;`);
  } catch (err) {
    console.warn('⚠️ Base de datos PostgreSQL no disponible o error al verificar tabla qms.users:', err.message);
  }
}

initDb();

/**
 * Resuelve el nombre del rol a partir de role_name o del campo FK id_role (1=admin_sgc, 2=leader, 3=operator, 4=auditor)
 */
function resolveRoleName(row) {
  if (row.role_name) return row.role_name;
  if (row.role && typeof row.role === 'string' && isNaN(row.role)) return row.role;

  const roleIdStr = String(row.id_role !== undefined && row.id_role !== null ? row.id_role : (row.role || ''));
  switch (roleIdStr) {
    case '1': return 'admin_sgc';
    case '2': return 'leader';
    case '3': return 'operator';
    case '4': return 'auditor';
    default: return 'operator';
  }
}

/**
 * Mapea el nombre del rol al ID numérico en la tabla qms.roles
 */
function getRoleIdByName(roleName) {
  if (!roleName) return 3;
  if (!isNaN(roleName)) return parseInt(roleName, 10);
  switch (roleName.toLowerCase().trim()) {
    case 'admin_sgc':
    case 'admin': return 1;
    case 'leader': return 2;
    case 'operator': return 3;
    case 'auditor': return 4;
    default: return 3;
  }
}

/**
 * Consulta la tabla qms.role_permissions para obtener los permisos asignados a un id_role en PostgreSQL.
 * Si el rol no tiene permisos registrados en la BD, la BD responde un arreglo vacío [] y ese debe respetarse.
 */
export async function getPermissionsForUserRole(idRole, roleCode) {
  if (!idRole) return [];
  
  try {
    const resJoined = await query(
      `SELECT p.* 
       FROM qms.role_permissions rp
       JOIN qms.permissions p ON rp.id_permission = p.id
       WHERE CAST(rp.id_role AS text) = CAST($1 AS text)`,
      [idRole]
    );
    if (resJoined && Array.isArray(resJoined.rows)) {
      return resJoined.rows
        .map(r => r.key || r.code || r.name || r.permission || r.permission_key || String(r.id))
        .filter(Boolean);
    }
  } catch (err) {
    console.warn('⚠️ Error al consultar qms.role_permissions:', err.message);
  }

  return [];
}

/**
 * Mapea la fila de la base de datos al objeto de usuario del sistema
 */
function mapRowToUser(row) {
  const nameVal = row.full_name || '';
  const avatarVal = row.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(nameVal || 'Usuario')}&background=1e3a8a&color=fff`;
  const userRole = resolveRoleName(row);
  const deptName = row.department_name || (row.department_id ? `Depto. #${row.department_id}` : 'General');
  const userPermissions = Array.isArray(row.permissions) ? row.permissions : [];

  return {
    id: row.id,
    googleId: row.google_id || null,
    name: nameVal,
    givenName: nameVal,
    familyName: '',
    email: row.email,
    picture: avatarVal,
    role: userRole,
    idRole: row.id_role || getRoleIdByName(userRole),
    departmentId: row.department_id || null,
    departmentName: deptName,
    permissions: userPermissions,
    isActive: row.is_active !== false,
    status: row.is_active === false ? 'Inactivo' : 'Activo',
    googleLoginEnabled: !!row.google_login_enabled,
    hasPassword: !!(row.password_hash && row.password_hash.trim().length > 0),
    lastLogin: row.last_login || null,
    createdAt: row.created_at
  };
}

/**
 * Inserta o actualiza un usuario de Google usando id_role
 */
export async function upsertUserFromGoogle(googleUser) {
  if (!googleUser || !googleUser.email) return null;
  const sanitizedName = sanitizeFullName(googleUser.name || 'Usuario Google');
  const email = googleUser.email.toLowerCase().trim();
  const avatarUrl = googleUser.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(sanitizedName)}&background=1e3a8a&color=fff`;

  try {
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      if (existingUser.isActive === false) {
        throw new Error('Tu cuenta se encuentra inactiva. Contacta al administrador del sistema.');
      }
      await query(
        `UPDATE qms.users 
         SET full_name = $1, google_id = COALESCE($2, google_id), 
             avatar_url = COALESCE($3, avatar_url), 
             google_login_enabled = TRUE,
             last_login = CURRENT_TIMESTAMP
         WHERE LOWER(email) = $4`,
        [sanitizedName, googleUser.googleId, avatarUrl, email]
      );
      return getUserByEmail(email);
    }

    const countRes = await query('SELECT COUNT(*) FROM qms.users');
    const userCount = parseInt(countRes.rows[0].count, 10);
    const roleName = userCount === 0 ? 'admin_sgc' : 'operator';
    const roleId = getRoleIdByName(roleName);

    await query(
      `INSERT INTO qms.users 
       (google_id, full_name, email, avatar_url, id_role, is_active, google_login_enabled, last_login)
       VALUES ($1, $2, $3, $4, $5, TRUE, TRUE, CURRENT_TIMESTAMP)`,
      [
        googleUser.googleId,
        sanitizedName,
        email,
        avatarUrl,
        roleId
      ]
    );
    return getUserByEmail(email);
  } catch (err) {
    console.error('Error al guardar usuario de Google en PostgreSQL:', err.message);
    throw err;
  }
}

/**
 * Registro de usuario por formulario usando id_role
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
  const roleName = userCount === 0 ? 'admin_sgc' : 'operator';
  const roleId = getRoleIdByName(roleName);

  await query(
    `INSERT INTO qms.users 
     (google_id, full_name, email, password_hash, avatar_url, id_role, is_active, google_login_enabled, last_login)
     VALUES (NULL, $1, $2, $3, $4, $5, TRUE, FALSE, CURRENT_TIMESTAMP)`,
    [
      sanitizedName,
      normalizedEmail,
      passwordHash,
      avatarUrl,
      roleId
    ]
  );

  return getUserByEmail(normalizedEmail);
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
  if (userRow.is_active === false) {
    throw new Error('Tu cuenta se encuentra inactiva. Contacta al administrador del sistema.');
  }

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

  await query(
    `UPDATE qms.users 
     SET last_login = CURRENT_TIMESTAMP 
     WHERE id = $1`,
    [userRow.id]
  );

  return getUserByEmail(normalizedEmail);
}

/**
 * Obtener todos los usuarios activos (is_active = TRUE) realizando LEFT JOIN con qms.roles y qms.departments
 */
export async function getAllUsers() {
  try {
    const res = await query(
      `SELECT u.*, r.name as role_name, d.name as department_name, d.code as department_code
       FROM qms.users u 
       LEFT JOIN qms.roles r ON CAST(u.id_role AS text) = CAST(r.id AS text) 
       LEFT JOIN qms.departments d ON u.department_id = d.id
       ORDER BY u.created_at DESC`
    );
    const users = await Promise.all(res.rows.map(async (userRow) => {
      const userRole = resolveRoleName(userRow);
      const permissions = await getPermissionsForUserRole(userRow.id_role, userRole);
      return mapRowToUser({ ...userRow, permissions });
    }));
    return users;
  } catch (err) {
    console.error('Error al obtener usuarios de PostgreSQL:', err.message);
    return [];
  }
}

/**
 * Actualizar rol de usuario (soporta código de rol o id numérico)
 */
export async function updateUserRole(email, newRole) {
  try {
    const roleId = getRoleIdByName(newRole);
    await query(
      `UPDATE qms.users 
       SET id_role = $1 
       WHERE LOWER(email) = $2`, 
      [roleId, email.toLowerCase().trim()]
    );
    return getUserByEmail(email);
  } catch (err) {
    console.error('Error actualizando rol:', err.message);
    return null;
  }
}

/**
 * Obtener un usuario por correo electrónico realizando LEFT JOIN con qms.roles y qms.departments
 */
export async function getUserByEmail(email) {
  if (!email) return null;
  try {
    const res = await query(
      `SELECT u.*, r.name as role_name, d.name as department_name, d.code as department_code
       FROM qms.users u 
       LEFT JOIN qms.roles r ON CAST(u.id_role AS text) = CAST(r.id AS text) 
       LEFT JOIN qms.departments d ON u.department_id = d.id
       WHERE LOWER(u.email) = $1`, 
      [email.toLowerCase().trim()]
    );
    if (res.rows.length > 0) {
      const userRow = res.rows[0];
      const userRole = resolveRoleName(userRow);
      const permissions = await getPermissionsForUserRole(userRow.id_role, userRole);
      return mapRowToUser({ ...userRow, permissions });
    }
    return null;
  } catch (err) {
    console.error('Error al obtener usuario por correo:', err.message);
    return null;
  }
}

/**
 * Obtener un usuario por su ID
 */
export async function getUserById(id) {
  if (!id) return null;
  try {
    const res = await query(
      `SELECT u.*, r.name as role_name, d.name as department_name, d.code as department_code
       FROM qms.users u 
       LEFT JOIN qms.roles r ON CAST(u.id_role AS text) = CAST(r.id AS text) 
       LEFT JOIN qms.departments d ON u.department_id = d.id
       WHERE u.id = $1`, 
      [id]
    );
    if (res.rows.length > 0) {
      const userRow = res.rows[0];
      const userRole = resolveRoleName(userRow);
      const permissions = await getPermissionsForUserRole(userRow.id_role, userRole);
      return mapRowToUser({ ...userRow, permissions });
    }
    return null;
  } catch (err) {
    console.error('Error al obtener usuario por ID:', err.message);
    return null;
  }
}

/**
 * Obtener todos los departamentos desde qms.departments
 */
export async function getAllDepartments() {
  try {
    const res = await query(
      `SELECT id, name, code FROM qms.departments ORDER BY name ASC`
    );
    return res.rows;
  } catch (err) {
    console.warn('⚠️ Error al consultar qms.departments:', err.message);
    return [];
  }
}

/**
 * Actualiza la información general de un usuario por su ID (nombre, rol, departamento)
 */
export async function updateUser(id, userData) {
  try {
    const { full_name, name, role, department_id, departmentId, is_active, isActive } = userData;
    const nameToUse = full_name || name;
    const deptIdToUse = department_id !== undefined ? department_id : departmentId;
    const isActiveToUse = is_active !== undefined ? is_active : isActive;

    const updates = [];
    const values = [];
    let paramIdx = 1;

    if (nameToUse !== undefined && nameToUse !== null) {
      const cleanName = sanitizeFullName(nameToUse);
      if (cleanName) {
        updates.push(`full_name = $${paramIdx++}`);
        values.push(cleanName);
      }
    }

    if (role !== undefined && role !== null) {
      const roleId = getRoleIdByName(role);
      updates.push(`id_role = $${paramIdx++}`);
      values.push(roleId);
    }

    if (deptIdToUse !== undefined && deptIdToUse !== null) {
      if (deptIdToUse === '' || deptIdToUse === 'null') {
        updates.push(`department_id = NULL`);
      } else {
        const parsedDept = parseInt(deptIdToUse, 10);
        if (!isNaN(parsedDept)) {
          updates.push(`department_id = $${paramIdx++}`);
          values.push(parsedDept);
        }
      }
    }

    if (isActiveToUse !== undefined && isActiveToUse !== null) {
      updates.push(`is_active = $${paramIdx++}`);
      values.push(Boolean(isActiveToUse));
    }

    if (updates.length === 0) {
      return getUserById(id);
    }

    values.push(id);
    await query(
      `UPDATE qms.users 
       SET ${updates.join(', ')} 
       WHERE id = $${paramIdx}`,
      values
    );

    return getUserById(id);
  } catch (err) {
    console.error('Error actualizando información de usuario:', err.message);
    throw err;
  }
}
