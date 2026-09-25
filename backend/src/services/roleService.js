/**
 * Role Service - Administra los roles y permisos del sistema QMS directamente desde PostgreSQL
 */
import { query } from '../config/db.js';

/**
 * Formatea un objeto de rol retornado por PostgreSQL asignando propiedades por defecto
 */
function formatRole(row, perms = []) {
  if (!row) return null;
  return {
    ...row,
    role: row.role || row.name || row.code || '',
    name: row.name || row.role || '',
    description: row.description || '',
    isSystem: row.isSystem !== undefined ? row.isSystem : (row.is_system !== undefined ? row.is_system : false),
    permissions: perms
  };
}

/**
 * Obtiene todos los roles registrados en PostgreSQL con sus respectivos permisos
 */
export async function getAllRoles() {
  try {
    const res = await query(
      `SELECT r.*
       FROM qms.roles r
       ORDER BY r.id ASC`
    );
    
    const roles = await Promise.all(res.rows.map(async (roleObj) => {
      let perms = [];
      try {
        const permsRes = await query(
          `SELECT p.* 
           FROM qms.role_permissions rp
           JOIN qms.permissions p ON rp.id_permission = p.id
           WHERE CAST(rp.id_role AS text) = CAST($1 AS text)`,
          [roleObj.id]
        );
        if (permsRes.rows) {
          perms = permsRes.rows.map(p => {
            const k = p.key || p.code || p.name || p.permission || p.permission_key || String(p.id);
            return { id: p.id, key: k, label: p.name || p.label || k, description: p.description || '' };
          });
        }
      } catch (pErr) {
        console.warn(`Error obteniendo permisos para el rol ${roleObj.name || roleObj.id}:`, pErr.message);
      }
      return formatRole(roleObj, perms);
    }));

    return roles;
  } catch (err) {
    console.error('Error al obtener roles de PostgreSQL:', err.message);
    return [];
  }
}

/**
 * Obtiene todos los permisos registrados en PostgreSQL
 */
export async function getAllPermissions() {
  try {
    const res = await query(
      `SELECT * FROM qms.permissions ORDER BY id ASC`
    );
    return res.rows.map(p => {
      const k = p.key || p.code || p.name || p.permission || p.permission_key || String(p.id);
      return { id: p.id, key: k, label: p.name || p.label || k, module: p.module || 'Otros', description: p.description || '' };
    });
  } catch (err) {
    console.error('Error al obtener permisos de PostgreSQL:', err.message);
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
      `SELECT r.*
       FROM qms.roles r
       WHERE LOWER(r.name) = LOWER($1) OR LOWER(CAST(r.id AS text)) = LOWER($1)`,
      [roleCode.trim()]
    );
    if (res.rows.length > 0) {
      const roleObj = res.rows[0];
      const permsRes = await query(
        `SELECT p.* 
         FROM qms.role_permissions rp
         JOIN qms.permissions p ON rp.id_permission = p.id
         WHERE CAST(rp.id_role AS text) = CAST($1 AS text)`,
        [roleObj.id]
      );
      const perms = permsRes.rows ? permsRes.rows.map(p => {
        const k = p.key || p.code || p.name || p.permission || p.permission_key || String(p.id);
        return { id: p.id, key: k, label: p.name || p.label || k, description: p.description || '' };
      }) : [];
      return formatRole(roleObj, perms);
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
  const description = roleData.description || 'Rol personalizado del sistema QMS.';

  // Verificar si ya existe
  const existingRes = await query(
    `SELECT id FROM qms.roles WHERE LOWER(name) = LOWER($1)`,
    [roleName]
  );
  if (existingRes.rows.length > 0) {
    throw new Error(`El rol "${roleName}" ya existe en la base de datos.`);
  }

  let insertRes;
  try {
    insertRes = await query(
      `INSERT INTO qms.roles (name, description)
       VALUES ($1, $2)
       RETURNING *`,
      [roleName, description]
    );
  } catch (err) {
    insertRes = await query(
      `INSERT INTO qms.roles (name)
       VALUES ($1)
       RETURNING *`,
      [roleName]
    );
  }

  const newRole = insertRes.rows[0];
  const createdPerms = [];

  if (Array.isArray(roleData.permissions)) {
    for (const perm of roleData.permissions) {
      const keyStr = typeof perm === 'string' ? perm : (perm.key || perm.name || perm.code);
      if (keyStr) {
        try {
          const permRes = await query(
            `SELECT id FROM qms.permissions WHERE key = $1 OR code = $1 OR name = $1 LIMIT 1`,
            [keyStr]
          );
          if (permRes.rows.length > 0) {
            const permId = permRes.rows[0].id;
            await query(
              `INSERT INTO qms.role_permissions (id_role, id_permission) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [newRole.id, permId]
            );
          }
        } catch (e) {
          console.warn('Error vinculando permiso al nuevo rol:', e.message);
        }
        createdPerms.push({ key: keyStr, label: keyStr });
      }
    }
  }

  return formatRole(newRole, createdPerms);
}

/**
 * Actualiza un rol existente y sus permisos
 */
export async function updateRole(roleCode, roleData) {
  const roleObj = await getRoleByCode(roleCode);
  if (!roleObj) {
    throw new Error('Rol no encontrado');
  }

  const name = roleObj.isSystem ? roleObj.name : (roleData.name || roleObj.name);
  const description = roleData.description !== undefined ? roleData.description : roleObj.description;

  try {
    await query(
      `UPDATE qms.roles SET name = $1, description = $2 WHERE id = $3`,
      [name, description, roleObj.id]
    );
  } catch (err) {
    console.error('Error actualizando rol básico:', err.message);
  }

  if (Array.isArray(roleData.permissions)) {
    try {
      await query(`DELETE FROM qms.role_permissions WHERE id_role = $1`, [roleObj.id]);
      
      for (const perm of roleData.permissions) {
        let permId = typeof perm === 'object' ? perm.id : null;
        if (!permId) {
          const keyStr = typeof perm === 'string' ? perm : (perm.key || perm.name || perm.code);
          if (keyStr) {
            const permRes = await query(
              `SELECT id FROM qms.permissions WHERE key = $1 OR code = $1 OR name = $1 LIMIT 1`,
              [keyStr]
            );
            if (permRes.rows.length > 0) {
              permId = permRes.rows[0].id;
            }
          }
        }
        
        if (permId) {
          try {
            await query(
              `INSERT INTO qms.role_permissions (id_role, id_permission) VALUES ($1, $2)`,
              [roleObj.id, permId]
            );
          } catch (insertErr) {
            console.warn('El permiso ya estaba vinculado o no es válido:', insertErr.message);
          }
        }
      }
    } catch (e) {
      console.warn('Error vinculando permisos actualizados:', e.message);
    }
  }

  return await getRoleByCode(String(roleObj.id));
}
