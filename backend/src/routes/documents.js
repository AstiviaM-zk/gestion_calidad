import express from 'express';
import { getAllUsers } from '../services/userService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

import { pool } from '../config/db.js';

const router = express.Router();

// Mock System Stats Data
const statsData = {
  totalDocuments: 148,
  pendingReviews: 12,
  approvedDocuments: 124,
  qualityComplianceRate: '98.5%',
  activeAudits: 3,
  activeUsers: 24
};

/**
 * GET /api/documents
 */
router.get('/documents', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        d.id as db_id,
        d.code as id,
        d.name as title,
        c.name as category,
        d.current_version as version,
        d.status,
        u.name as author,
        d.created_at as "updatedAt",
        'PDF' as type,
        '1.0 MB' as size
      FROM qms.documents d
      LEFT JOIN qms.categories c ON d.id_category = c.id
      LEFT JOIN qms.users u ON d.created_by = u.id
      WHERE d.is_active = true
      ORDER BY d.created_at DESC
    `);
    
    const formattedRows = rows.map(row => ({
      ...row,
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString().split('T')[0] : 'N/A',
      author: row.author || 'Sistema'
    }));

    res.json({
      success: true,
      documents: formattedRows
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ success: false, message: 'Error de servidor al cargar documentos' });
  }
});

/**
 * GET /api/stats
 */
router.get('/stats', authenticateToken, (req, res) => {
  res.json({
    success: true,
    stats: statsData
  });
});

export default router;
