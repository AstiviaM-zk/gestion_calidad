import express from 'express';
import { getAllRoles, createRole } from '../services/roleService.js';
import { updateUserRole } from '../services/userService.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/roles
 * Returns list of system and custom roles with permissions
 */
router.get('/roles', authenticateToken, (req, res) => {
  const roles = getAllRoles();
  res.json({
    success: true,
    roles
  });
});

/**
 * POST /api/roles
 * Creates a new custom role (Exclusivo Administradores)
 */
router.post('/roles', authenticateToken, requireRole('admin_sgc'), (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del rol es obligatorio'
      });
    }

    const newRole = createRole({ name, description, permissions });
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
