import express from 'express';
import { getAllUsers, updateUserRole, updateUser, getAllDepartments } from '../services/userService.js';
import { authenticateToken, requirePermission } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/departments
 * Devuelve la lista de departamentos de QMS desde PostgreSQL
 */
router.get('/departments', authenticateToken, async (req, res) => {
  try {
    const departments = await getAllDepartments();
    return res.json({
      success: true,
      departments
    });
  } catch (error) {
    console.error('Error al obtener la lista de departamentos:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener la lista de departamentos'
    });
  }
});

/**
 * GET /api/users
 * Devuelve la lista de usuarios registrados en QMS (Permiso users:read o admin_sgc)
 */
router.get('/users', authenticateToken, requirePermission('users:read'), async (req, res) => {
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
 * PUT /api/users/:id
 * Actualiza la información general de un usuario (Nombre, Email, Rol, Estado activo)
 * Requiere permiso users:update o admin_sgc
 */
router.put('/users/:id', authenticateToken, requirePermission('users:update'), async (req, res) => {
  try {
    const { id } = req.params;
    const userData = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'El ID de usuario es obligatorio'
      });
    }

    const updatedUser = await updateUser(id, userData);
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    return res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error al actualizar información de usuario:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar información del usuario'
    });
  }
});

/**
 * PUT /api/users/:email/role
 * Actualiza el rol de un usuario por su correo electrónico (Permiso users:update o admin_sgc)
 */
router.put('/users/:email/role', authenticateToken, requirePermission('users:update'), async (req, res) => {
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
