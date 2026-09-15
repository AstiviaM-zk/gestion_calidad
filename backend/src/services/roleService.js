/**
 * Role Service - Administra los roles y permisos del sistema QMS
 */

// Default system roles
const rolesMap = new Map([
  [
    'admin_sgc',
    {
      id: 'ROLE-ADMIN-SGC',
      role: 'admin_sgc',
      name: 'Administrador (Calidad)',
      description: 'CRUD total de plantillas, gestión de versiones, visibilidad de todas las evidencias de todas las áreas.',
      badgeColor: 'role-admin',
      permissions: [
        { key: 'templates:crud', label: 'CRUD Total de Plantillas' },
        { key: 'versions:manage', label: 'Gestión de Versiones' },
        { key: 'evidences:view_all', label: 'Visibilidad Total de Evidencias' },
        { key: 'users:manage', label: 'Gestión de Usuarios' },
        { key: 'audit:logs', label: 'Ver Logs de Acceso' }
      ],
      isSystem: true
    }
  ],
  [
    'leader',
    {
      id: 'ROLE-LEADER',
      role: 'leader',
      name: 'Líder de Área (Dueño de proceso)',
      description: 'Consulta plantillas generales y de su área; visualiza y valida evidencias subidas por su departamento.',
      badgeColor: 'role-leader',
      permissions: [
        { key: 'templates:read_dept', label: 'Consulta Plantillas de Área' },
        { key: 'evidences:validate_dept', label: 'Visualizar y Validar Evidencias de Área' }
      ],
      isSystem: true
    }
  ],
  [
    'operator',
    {
      id: 'ROLE-OPERATOR',
      role: 'operator',
      name: 'Usuario común / Operativo',
      description: 'Consulta plantillas de su área en el visor seguro y sube sus formatos llenados/evidencias.',
      badgeColor: 'role-operator',
      permissions: [
        { key: 'templates:read_viewer', label: 'Consulta Plantillas en Visor Seguro' },
        { key: 'evidences:upload', label: 'Subir Formatos y Evidencias' }
      ],
      isSystem: true
    }
  ],
  [
    'auditor',
    {
      id: 'ROLE-AUDITOR',
      role: 'auditor',
      name: 'Auditor interno / externo',
      description: 'Acceso de solo lectura global a plantillas vigentes, evidencias cargadas y logs de accesos para revisión.',
      badgeColor: 'role-auditor',
      permissions: [
        { key: 'templates:read_global', label: 'Lectura Global de Plantillas' },
        { key: 'evidences:read_global', label: 'Lectura Global de Evidencias' },
        { key: 'audit:logs', label: 'Revisión de Logs de Acceso' }
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
    role: roleName.toLowerCase().replace(/\s+/g, '_'),
    name: roleName,
    description: roleData.description || 'Rol personalizado del sistema QMS.',
    badgeColor: 'role-custom',
    permissions: roleData.permissions || [{ key: 'templates:read_viewer', label: 'Consulta de Plantillas' }],
    isSystem: false
  };

  rolesMap.set(roleName, newRole);
  return newRole;
}
