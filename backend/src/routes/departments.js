import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken, requirePermission } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/departments
 * Obtenida a través de users.js en este momento, pero re-implementada aquí para un CRUD completo
 */
router.get('/', authenticateToken, requirePermission('departments:read'), async (req, res) => {
  try {
    const resDb = await query(`SELECT id, title, code, description, icon, status, created_at, updated_by, updated_at FROM qms.departments ORDER BY id ASC`);
    return res.json({ success: true, departments: resDb.rows });
  } catch (error) {
    console.error('Error al obtener departamentos:', error.message);
    return res.status(500).json({ success: false, message: 'Error al obtener departamentos' });
  }
});

/**
 * GET /api/departments/:id/categories
 * Obtener categorías de un departamento
 */
router.get('/:id/categories', authenticateToken, requirePermission('documents:read'), async (req, res) => {
  try {
    const { id } = req.params;
    const canViewRestricted = req.user?.role === 'admin_sgc' || req.user?.role === 'leader';
    const restrictionCondition = canViewRestricted ? '' : ' AND c.is_restricted = false';

    const resDb = await query(
      `SELECT c.id, c.name, c.code, c.icon, c.is_restricted, c.is_base,
              (SELECT COUNT(*) FROM qms.documents d WHERE d.id_category = c.id AND d.id_department = $1 AND d.is_active = true) as documents_count
       FROM qms.categories c 
       WHERE (c.department_id = $1 OR c.is_base = true) ${restrictionCondition} 
       ORDER BY c.is_base DESC, c.id ASC`,
      [id]
    );
    return res.json({ success: true, categories: resDb.rows });
  } catch (error) {
    console.error('Error al obtener categorías:', error.message);
    return res.status(500).json({ success: false, message: 'Error al obtener categorías' });
  }
});

/**
 * POST /api/departments/:id/categories
 * Crear categoría en un departamento
 */
router.post('/:id/categories', authenticateToken, requirePermission('categories:manage'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, icon, is_restricted } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });

    const resDb = await query(
      `INSERT INTO qms.categories (department_id, name, code, icon, is_restricted) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, name, code || null, icon || 'fa-solid fa-folder', is_restricted || false]
    );
    return res.status(201).json({ success: true, category: resDb.rows[0] });
  } catch (error) {
    console.error('Error al crear categoría:', error.message);
    return res.status(500).json({ success: false, message: 'Error al crear categoría' });
  }
});

/**
 * PUT /api/departments/:id/categories/:categoryId
 * Actualizar categoría
 */
router.put('/:id/categories/:categoryId', authenticateToken, requirePermission('categories:manage'), async (req, res) => {
  try {
    const { id, categoryId } = req.params;
    const { name, code, icon, is_restricted } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });

    const resDb = await query(
      `UPDATE qms.categories SET name = $1, code = $2, icon = $3, is_restricted = $4 WHERE id = $5 AND department_id = $6 RETURNING *`,
      [name, code || null, icon || 'fa-solid fa-folder', is_restricted || false, categoryId, id]
    );

    if (resDb.rows.length === 0) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    return res.json({ success: true, category: resDb.rows[0] });
  } catch (error) {
    console.error('Error al actualizar categoría:', error.message);
    return res.status(500).json({ success: false, message: 'Error al actualizar categoría' });
  }
});

/**
 * POST /api/departments
 * Crear departamento
 */
router.post('/', authenticateToken, requirePermission('departments:create'), async (req, res) => {
  try {
    const { title, code, description, icon, status } = req.body;
    const userId = req.user?.id || null;
    if (!title) return res.status(400).json({ success: false, message: 'El título es obligatorio' });

    const resDb = await query(
      `INSERT INTO qms.departments (title, code, description, icon, status, updated_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, code || null, description || null, icon || null, status !== undefined ? status : true, userId]
    );
    return res.status(201).json({ success: true, department: resDb.rows[0] });
  } catch (error) {
    console.error('Error al crear departamento:', error.message);
    return res.status(500).json({ success: false, message: 'Error al crear departamento' });
  }
});

/**
 * PUT /api/departments/:id
 * Actualizar departamento
 */
router.put('/:id', authenticateToken, requirePermission('departments:update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, code, description, icon, status } = req.body;
    const userId = req.user?.id || null;
    if (!title) return res.status(400).json({ success: false, message: 'El título es obligatorio' });

    const resDb = await query(
      `UPDATE qms.departments SET title = $1, code = $2, description = $3, icon = $4, status = $5, updated_by = $6, updated_at = NOW() WHERE id = $7 RETURNING *`,
      [title, code || null, description || null, icon || null, status !== undefined ? status : true, userId, id]
    );

    if (resDb.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Departamento no encontrado' });
    }

    return res.json({ success: true, department: resDb.rows[0] });
  } catch (error) {
    console.error('Error al actualizar departamento:', error.message);
    return res.status(500).json({ success: false, message: 'Error al actualizar departamento' });
  }
});

/**
 * DELETE /api/departments/:id
 * Eliminar departamento
 */
router.delete('/:id', authenticateToken, requirePermission('departments:delete'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si hay usuarios asignados a este departamento antes de eliminar
    const usersRes = await query(`SELECT COUNT(*) FROM qms.users WHERE department_id = $1`, [id]);
    if (parseInt(usersRes.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el departamento porque hay usuarios asignados a él.'
      });
    }

    const resDb = await query(`UPDATE qms.departments SET status = false WHERE id = $1 RETURNING id`, [id]);

    if (resDb.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Departamento no encontrado' });
    }

    return res.json({ success: true, message: 'Departamento inhabilitado correctamente' });
  } catch (error) {
    console.error('Error al eliminar departamento:', error.message);
    return res.status(500).json({ success: false, message: 'Error al eliminar departamento' });
  }
});

export default router;
