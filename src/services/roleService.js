/**
 * Role Service - Manage system roles and permission sets
 */

// Default system roles
const rolesMap = new Map([
  [
    'Administrador',
    {
      id: 'ROLE-ADMIN',
      name: 'Administrador',
      description: 'Acceso total al sistema, gestión de usuarios, configuración y aprobación final de documentos QMS.',
      badgeColor: 'role-admin',
      permissions: [
        { key: 'docs:read', label: 'Lectura de Documentos' },
        { key: 'docs:create', label: 'Creación de Documentos' },
        { key: 'docs:edit', label: 'Edición de Documentos' },
        { key: 'docs:delete', label: 'Eliminación de Documentos' },
        { key: 'docs:approve', label: 'Aprobación de Calidad' },
        { key: 'users:manage', label: 'Gestión de Usuarios' },
        { key: 'audit:export', label: 'Exportación de Reportes' }
      ],
      isSystem: true
    }
  ],
  [
    'Usuario',
    {
      id: 'ROLE-USER',
      name: 'Usuario',
      description: 'Acceso estándar para consultar procedimientos aprobados y redactar borradores de trabajo.',
      badgeColor: 'role-user',
      permissions: [
        { key: 'docs:read', label: 'Lectura de Documentos' },
        { key: 'docs:create', label: 'Creación de Documentos' },
        { key: 'docs:edit', label: 'Edición de Documentos' }
      ],
      isSystem: true
    }
  ],
  [
    'Auditor',
    {
      id: 'ROLE-AUDITOR',
      name: 'Auditor',
      description: 'Perfil de inspección para auditorías de calidad ISO, revisión de hallazgos y exportación de evidencias.',
      badgeColor: 'role-auditor',
      permissions: [
        { key: 'docs:read', label: 'Lectura de Documentos' },
        { key: 'docs:approve', label: 'Aprobación de Calidad' },
        { key: 'audit:export', label: 'Exportación de Reportes' }
      ],
      isSystem: true
    }
  ]
]);

/**
 * Get all available roles
 */
export function getAllRoles() {
  return Array.from(rolesMap.values());
}

/**
 * Create a new custom role
 */
export function createRole(roleData) {
  if (!roleData || !roleData.name) return null;

  const roleName = roleData.name.trim();
  if (rolesMap.has(roleName)) {
    throw new Error(`El rol "${roleName}" ya existe en el sistema.`);
  }

  const newRole = {
    id: `ROLE-${Date.now().toString().slice(-4)}`,
    name: roleName,
    description: roleData.description || 'Rol personalizado del sistema QMS.',
    badgeColor: 'role-custom',
    permissions: roleData.permissions || [{ key: 'docs:read', label: 'Lectura de Documentos' }],
    isSystem: false
  };

  rolesMap.set(roleName, newRole);
  return newRole;
}
