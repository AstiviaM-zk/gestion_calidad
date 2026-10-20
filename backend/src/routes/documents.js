import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { getAllUsers } from '../services/userService.js';
import { authenticateToken, requirePermission } from '../middleware/authMiddleware.js';

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
    const { categoryId, departmentId } = req.query;
    
    let query = `
      SELECT 
        d.id as db_id,
        d.code as id,
        d.name as title,
        d.description,
        c.name as category,
        d.current_version as version,
        d.status,
        u.full_name as author,
        d.created_at as "updatedAt",
        dv.file_name,
        dv.mime_type,
        dv.file_size_mb,
        dv.file_path,
        dv.uploaded_by as uploader_id
      FROM qms.documents d
      LEFT JOIN qms.categories c ON d.id_category = c.id
      LEFT JOIN qms.users u ON d.created_by = u.id
      LEFT JOIN LATERAL (
        SELECT file_name, mime_type, file_size_mb, file_path, uploaded_by
        FROM qms.documents_versions
        WHERE document_id = d.id
        ORDER BY created_at DESC
        LIMIT 1
      ) dv ON true
      WHERE d.is_active = true
    `;
    const params = [];
    let paramIndex = 1;

    if (categoryId) {
      query += ` AND d.id_category = $${paramIndex++}`;
      params.push(categoryId);
    }

    if (departmentId) {
      if (departmentId === 'global' || departmentId === 'null') {
        query += ` AND d.id_department IS NULL`;
      } else {
        query += ` AND (d.id_department = $${paramIndex++} OR d.id_department IS NULL)`;
        params.push(departmentId);
      }
    }

    query += ` ORDER BY d.created_at DESC`;

    const { rows } = await pool.query(query, params);
    
    const formattedRows = rows.map(row => {
      let ext = 'PDF';
      if (row.file_name) {
        const parsed = path.extname(row.file_name).replace('.', '').toUpperCase();
        if (parsed) ext = parsed;
      } else if (row.mime_type) {
        if (row.mime_type.includes('pdf')) ext = 'PDF';
        else if (row.mime_type.includes('word') || row.mime_type.includes('officedocument.wordprocessingml')) ext = 'DOCX';
        else if (row.mime_type.includes('excel') || row.mime_type.includes('officedocument.spreadsheetml')) ext = 'XLSX';
      }

      return {
        ...row,
        type: ext,
        size: row.file_size_mb ? `${parseFloat(row.file_size_mb).toFixed(2)} MB` : '1.0 MB',
        updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString().split('T')[0] : 'N/A',
        author: row.author || 'Sistema'
      };
    });

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

    const isGeneral = categoryName.trim().toLowerCase() === 'general';
    const finalDepartmentId = isGeneral ? null : (departmentId === 'global' || departmentId === 'null' ? null : departmentId);
    if (isGeneral) {
      departmentName = 'Global';
    }

    // 2. Insert Document
    const docQuery = `
      INSERT INTO qms.documents (name, code, description, id_category, id_department, current_version, is_active, status, created_at, created_by)
      VALUES ($1, $2, $3, $4, $5, '1.0', true, 'pending', NOW(), $6)
      RETURNING id
    `;
    const docValues = [name, code, description, categoryId || null, finalDepartmentId, userId];
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
 * GET /api/documents/:id/file
 * Sirve el archivo para previsualización (inline)
 */
router.get('/documents/:id/file', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const versionRes = await pool.query(
      `SELECT file_path, file_name, mime_type 
       FROM qms.documents_versions 
       WHERE document_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [id]
    );

    if (versionRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Archivo no encontrado' });
    }

    const { file_path, file_name, mime_type } = versionRes.rows[0];
    const fullPath = path.join(process.cwd(), 'src', 'storage', file_path);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, message: 'El archivo físico no existe en el servidor' });
    }

    res.setHeader('Content-Type', mime_type || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file_name)}"`);
    res.sendFile(fullPath);
  } catch (error) {
    console.error('Error al servir archivo del documento:', error);
    res.status(500).json({ success: false, message: 'Error interno al cargar el archivo' });
  }
});

/**
 * PATCH /api/documents/:id/status
 * Actualizar estado del documento (Aprobado, Rechazado, Pendiente, Obsoleto)
 */
router.patch('/documents/:id/status', authenticateToken, requirePermission('documents:approve'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['approved', 'pending', 'rejected', 'obsolete'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Estado no válido' });
    }

    const updateRes = await pool.query(
      `UPDATE qms.documents 
       SET status = $1 
       WHERE id = $2 
       RETURNING id, name, code, status`,
      [status, id]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Documento no encontrado' });
    }

    res.json({
      success: true,
      message: `Documento ${status === 'approved' ? 'aprobado' : status === 'rejected' ? 'rechazado' : 'actualizado'} exitosamente`,
      document: updateRes.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar estado del documento:', error);
    res.status(500).json({ success: false, message: 'Error interno al actualizar estado' });
  }
});

/**
 * GET /api/documents/:id/versions
 * Obtiene el historial de versiones de un documento
 */
router.get('/documents/:id/versions', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const versionsRes = await pool.query(
      `SELECT 
         dv.id,
         dv.document_id,
         dv.version_number as version,
         dv.file_name,
         dv.mime_type,
         dv.file_size_mb,
         dv.created_at as "createdAt",
         dv.uploaded_by,
         u.full_name as author
       FROM qms.documents_versions dv
       LEFT JOIN qms.users u ON dv.uploaded_by = u.id
       WHERE dv.document_id = $1
       ORDER BY dv.created_at DESC`,
      [id]
    );

    const formattedVersions = versionsRes.rows.map(v => ({
      ...v,
      createdAt: v.createdAt ? new Date(v.createdAt).toLocaleString('es-MX') : 'N/A',
      size: v.file_size_mb ? `${parseFloat(v.file_size_mb).toFixed(2)} MB` : 'N/A'
    }));

    res.json({
      success: true,
      versions: formattedVersions
    });
  } catch (error) {
    console.error('Error al obtener versiones del documento:', error);
    res.status(500).json({ success: false, message: 'Error al obtener versiones' });
  }
});

/**
 * GET /api/documents/versions/:versionId/file
 * Sirve el archivo de una versión histórica específica
 */
router.get('/documents/versions/:versionId/file', authenticateToken, async (req, res) => {
  try {
    const { versionId } = req.params;
    const versionRes = await pool.query(
      `SELECT file_path, file_name, mime_type 
       FROM qms.documents_versions 
       WHERE id = $1`,
      [versionId]
    );

    if (versionRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Versión de archivo no encontrada' });
    }

    const { file_path, file_name, mime_type } = versionRes.rows[0];
    const fullPath = path.join(process.cwd(), 'src', 'storage', file_path);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, message: 'El archivo físico no existe en el servidor' });
    }

    res.setHeader('Content-Type', mime_type || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file_name)}"`);
    res.sendFile(fullPath);
  } catch (error) {
    console.error('Error al servir versión del archivo:', error);
    res.status(500).json({ success: false, message: 'Error interno al cargar la versión del archivo' });
  }
});

/**
 * GET /api/documents/:id/download
 * Descarga forzada del archivo (Requiere permiso documents:download)
 */
router.get('/documents/:id/download', authenticateToken, requirePermission('documents:download'), async (req, res) => {
  try {
    const { id } = req.params;
    const versionRes = await pool.query(
      `SELECT file_path, file_name 
       FROM qms.documents_versions 
       WHERE document_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [id]
    );

    if (versionRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Archivo no encontrado' });
    }

    const { file_path, file_name } = versionRes.rows[0];
    const fullPath = path.join(process.cwd(), 'src', 'storage', file_path);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, message: 'El archivo físico no existe en el servidor' });
    }

    res.download(fullPath, file_name);
  } catch (error) {
    console.error('Error al descargar archivo del documento:', error);
    res.status(500).json({ success: false, message: 'Error interno al descargar el archivo' });
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
