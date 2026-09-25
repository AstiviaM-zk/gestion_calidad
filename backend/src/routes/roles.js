import express from 'express';
import { getAllRoles, createRole, getAllPermissions, updateRole } from '../services/roleService.js';
import { updateUserRole } from '../services/userService.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/roles
 * Returns list of system and custom roles with permissions from PostgreSQL
 */
router.get('/roles', authenticateToken, async (req, res) => {
  try {
    const roles = await getAllRoles();
    res.json({
      success: true,
      roles
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Error al obtener roles'
    });
  }
});

/**
 * GET /api/permissions
 * Returns list of all system permissions from PostgreSQL
 */
router.get('/permissions', authenticateToken, async (req, res) => {
  try {
    const permissions = await getAllPermissions();
    res.json({
      success: true,
      permissions
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Error al obtener permisos'
    });
  }
});

/**
 * POST /api/roles
 * Creates a new custom role (Exclusivo Administradores)
 */
router.post('/roles', authenticateToken, requireRole('admin_sgc'), async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del rol es obligatorio'
      });
    }

    const newRole = await createRole({ name, description, permissions });
    res.status(201).json({
      success: true,
      message: 'Rol creado exitosamente',
      role: newRole
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error al crear el rol'
    });
  }
});

/**
 * PUT /api/roles/:code
 * Updates an existing role and its permissions (Exclusivo Administradores)
 */
router.put('/roles/:code', authenticateToken, requireRole('admin_sgc'), async (req, res) => {
  try {
    const { code } = req.params;
    const { name, description, permissions } = req.body;

    const updatedRole = await updateRole(code, { name, description, permissions });
    res.json({
      success: true,
      message: 'Rol actualizado exitosamente',
      role: updatedRole
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar el rol'
    });
  }
});
/**
 * PUT /api/users/:email/role
 * Updates an authenticated user's role (Exclusivo Administradores)
 */
router.put('/users/:email/role', authenticateToken, requireRole('admin_sgc'), async (req, res) => {
  const { email } = req.params;
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({
      success: false,
      message: 'El rol especificado es requerido'
    });
  }

  const updatedUser = await updateUserRole(email, role);
  if (!updatedUser) {
    return res.status(404).json({
      success: false,
      message: 'Usuario no encontrado'
    });
  }

  res.json({
    success: true,
    message: `Rol del usuario actualizado a ${role}`,
    user: updatedUser
  });
});

export default router;
