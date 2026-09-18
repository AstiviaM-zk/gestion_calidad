import express from 'express';
import { getAllUsers, updateUserRole } from '../services/userService.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/users
 * Returns list of all registered users in QMS (Exclusivo Administradores)
 */
router.get('/users', authenticateToken, requireRole('admin_sgc'), async (req, res) => {
  try {
    const users = await getAllUsers();
    return res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error al obtener la lista de usuarios:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener la lista de usuarios de la base de datos'
    });
  }
});

/**
 * PUT /api/users/:email/role
 * Updates an authenticated user's role in PostgreSQL (Exclusivo Administradores)
 */
router.put('/users/:email/role', authenticateToken, requireRole('admin_sgc'), async (req, res) => {
  try {
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

    return res.json({
      success: true,
      message: `Rol del usuario actualizado a ${role}`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error al actualizar rol de usuario:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar el rol'
    });
  }
});

export default router;
