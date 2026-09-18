/**
 * Role Service - Administra los roles y permisos del sistema QMS directamente desde PostgreSQL
 */
import { query } from '../config/db.js';

/**
 * Obtiene todos los roles registrados en PostgreSQL con sus respectivos permisos
 */
export async function getAllRoles() {
  try {
    const res = await query(
      `SELECT r.id, r.code as role, r.name, r.description, r.badge_color as "badgeColor", r.is_system as "isSystem"
       FROM qms.roles r
       ORDER BY r.id ASC`
    );
    
    const roles = await Promise.all(res.rows.map(async (roleObj) => {
      let perms = [];
      try {
        const permsRes = await query(
          `SELECT permission_key as key FROM qms.role_permissions WHERE CAST(id_role AS text) = CAST($1 AS text)`,
          [roleObj.id]
        );
        if (permsRes.rows) {
          perms = permsRes.rows.map(p => ({ key: p.key, label: p.key }));
        }
      } catch (pErr) {
        console.warn(`Error obteniendo permisos para el rol ${roleObj.role}:`, pErr.message);
      }
      return {
        ...roleObj,
        permissions: perms
      };
    }));

    return roles;
  } catch (err) {
    console.error('Error al obtener roles de PostgreSQL:', err.message);
    return [];
  }
}

/**
 * Obtiene un rol por su código o nombre desde PostgreSQL
 */
export async function getRoleByCode(roleCode) {
  if (!roleCode) return null;
  try {
    const res = await query(
      `SELECT r.id, r.code as role, r.name, r.description, r.badge_color as "badgeColor", r.is_system as "isSystem"
       FROM qms.roles r
       WHERE LOWER(r.code) = LOWER($1) OR LOWER(r.name) = LOWER($1)`,
      [roleCode.trim()]
    );
    if (res.rows.length > 0) {
      const roleObj = res.rows[0];
      const permsRes = await query(
        `SELECT permission_key as key FROM qms.role_permissions WHERE CAST(id_role AS text) = CAST($1 AS text)`,
        [roleObj.id]
      );
      return {
        ...roleObj,
        permissions: permsRes.rows ? permsRes.rows.map(p => ({ key: p.key, label: p.key })) : []
      };
    }
  } catch (err) {
    console.error('Error al obtener rol por código:', err.message);
  }
  return null;
}

/**
 * Obtiene un arreglo de llaves de permisos (strings) para un rol dado desde PostgreSQL
 */
export async function getPermissionsForRole(roleCode) {
  const roleObj = await getRoleByCode(roleCode);
  if (!roleObj || !roleObj.permissions) return [];
  return roleObj.permissions.map(p => typeof p === 'string' ? p : p.key);
}

/**
 * Crea un nuevo rol personalizado directamente en PostgreSQL (qms.roles y qms.role_permissions)
 */
export async function createRole(roleData) {
  if (!roleData || !roleData.name) {
    throw new Error('El nombre del rol es obligatorio.');
  }

  const roleName = roleData.name.trim();
  const roleCode = roleName.toLowerCase().replace(/\s+/g, '_');
  const description = roleData.description || 'Rol personalizado del sistema QMS.';

  // Verificar si ya existe
  const existingRes = await query(
    `SELECT id FROM qms.roles WHERE LOWER(code) = LOWER($1) OR LOWER(name) = LOWER($2)`,
    [roleCode, roleName]
  );
  if (existingRes.rows.length > 0) {
    throw new Error(`El rol "${roleName}" ya existe en la base de datos.`);
  }

  const insertRes = await query(
    `INSERT INTO qms.roles (code, name, description, badge_color, is_system)
     VALUES ($1, $2, $3, 'role-custom', FALSE)
     RETURNING id, code as role, name, description, badge_color as "badgeColor", is_system as "isSystem"`,
    [roleCode, roleName, description]
  );

  const newRole = insertRes.rows[0];
  const createdPerms = [];

  if (Array.isArray(roleData.permissions)) {
    for (const perm of roleData.permissions) {
      const keyStr = typeof perm === 'string' ? perm : perm.key;
      if (keyStr) {
        await query(
          `INSERT INTO qms.role_permissions (id_role, permission_key) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [newRole.id, keyStr]
        );
        createdPerms.push({ key: keyStr, label: keyStr });
      }
    }
  }

  return {
    ...newRole,
    permissions: createdPerms
  };
}
