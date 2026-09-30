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

export default router;
