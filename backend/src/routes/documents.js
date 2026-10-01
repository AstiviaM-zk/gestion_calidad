import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { getAllUsers } from '../services/userService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

import { pool } from '../config/db.js';

const router = express.Router();
const upload = multer({ dest: 'src/storage/temp/' });

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
        u.full_name as author,
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
 * POST /api/documents
 */
router.post('/documents', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Archivo requerido' });
  }

  const { name, code, description, categoryId, departmentId } = req.body;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get department and category names
    let departmentName = 'Global';
    if (departmentId && departmentId !== 'global' && departmentId !== 'null') {
       const deptRes = await client.query('SELECT title FROM qms.departments WHERE id = $1', [departmentId]);
       if (deptRes.rows.length) departmentName = deptRes.rows[0].title;
    }
    
    let categoryName = 'General';
    if (categoryId) {
      const catRes = await client.query('SELECT name FROM qms.categories WHERE id = $1', [categoryId]);
      if (catRes.rows.length) categoryName = catRes.rows[0].name;
    }

    // 2. Insert Document
    const docQuery = `
      INSERT INTO qms.documents (name, code, description, id_category, id_department, current_version, is_active, status, created_at, created_by)
      VALUES ($1, $2, $3, $4, $5, '1.0', true, 'pending', NOW(), $6)
      RETURNING id
    `;
    const docValues = [name, code, description, categoryId || null, departmentId === 'global' ? null : departmentId, userId];
    const docRes = await client.query(docQuery, docValues);
    const newDocId = docRes.rows[0].id;

    // 3. Move file
    const timestamp = Date.now();
    
    // Sanitize names for paths
    const safeDept = departmentName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const safeCat = categoryName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    const relativePath = `${safeDept}/${safeCat}/uploaded_docs/${userId}/${timestamp}`;
    const targetDir = path.join(process.cwd(), 'src', 'storage', relativePath);
    
    await fs.promises.mkdir(targetDir, { recursive: true });
    
    const originalExt = path.extname(req.file.originalname);
    const finalFileName = `${code || 'doc'}_v1.0${originalExt}`;
    const finalPath = path.join(targetDir, finalFileName);
    
    await fs.promises.rename(req.file.path, finalPath);
    
    const savedPath = `${relativePath}/${finalFileName}`; // stored without "storage/" prefix
    const fileSizeMb = (req.file.size / (1024 * 1024)).toFixed(2);
    
    // 4. Insert Document Version
    const verQuery = `
      INSERT INTO qms.documents_versions (document_id, version_number, file_path, file_name, mime_type, file_size_mb, created_at, uploaded_by)
      VALUES ($1, '1.0', $2, $3, $4, $5, NOW(), $6)
    `;
    await client.query(verQuery, [newDocId, savedPath, req.file.originalname, req.file.mimetype, fileSizeMb, userId]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Documento creado exitosamente' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating document:', err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: 'Error al crear documento' });
  } finally {
    client.release();
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
