import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken, requirePermission } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/categories
 * Obtener todas las categorías globales
 */
router.get('/', authenticateToken, requirePermission('documents:read'), async (req, res) => {
  try {
    const canViewRestricted = req.user?.role === 'admin_sgc' || req.user?.role === 'leader';
    const restrictionCondition = canViewRestricted ? '' : ' WHERE c.is_restricted = false ';
    
    const resDb = await query(`
      SELECT c.id, c.name, c.code, c.icon, c.is_restricted, c.is_base, c.department_id,
             d.title as department_title,
             (SELECT COUNT(*) FROM qms.documents d2 WHERE d2.id_category = c.id AND d2.id_department IS NOT DISTINCT FROM c.department_id AND d2.is_active = true) as documents_count
      FROM qms.categories c
      LEFT JOIN qms.departments d ON c.department_id = d.id
      ${restrictionCondition}
      ORDER BY d.title ASC, c.id ASC
    `);
    
    return res.json({ success: true, categories: resDb.rows });
  } catch (error) {
    console.error('Error al obtener todas las categorías:', error.message);
    return res.status(500).json({ success: false, message: 'Error al obtener categorías globales' });
  }
});

/**
 * POST /api/categories
 * Crear categoría global (con o sin departamento)
 */
router.post('/', authenticateToken, requirePermission('categories:manage'), async (req, res) => {
  try {
    const { name, code, icon, is_restricted, department_id } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });

    const isBase = !department_id; // Si no tiene departamento, es base

    const resDb = await query(
      `INSERT INTO qms.categories (department_id, name, code, icon, is_restricted, is_base) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [department_id || null, name, code || null, icon || 'fa-solid fa-folder', is_restricted || false, isBase]
    );
    return res.status(201).json({ success: true, category: resDb.rows[0] });
  } catch (error) {
    console.error('Error al crear categoría global:', error.message);
    return res.status(500).json({ success: false, message: 'Error al crear categoría global' });
  }
});

/**
 * PUT /api/categories/:id
 * Actualizar categoría global
 */
router.put('/:id', authenticateToken, requirePermission('categories:manage'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, icon, is_restricted, department_id } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });

    const isBase = !department_id;

    const resDb = await query(
      `UPDATE qms.categories SET name = $1, code = $2, icon = $3, is_restricted = $4, department_id = $5, is_base = $6 WHERE id = $7 RETURNING *`,
      [name, code || null, icon || 'fa-solid fa-folder', is_restricted || false, department_id || null, isBase, id]
    );

    if (resDb.rows.length === 0) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    return res.json({ success: true, category: resDb.rows[0] });
  } catch (error) {
    console.error('Error al actualizar categoría global:', error.message);
    return res.status(500).json({ success: false, message: 'Error al actualizar categoría global' });
  }
});

export default router;
