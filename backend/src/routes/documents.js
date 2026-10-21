import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { getAllUsers } from '../services/userService.js';
import { authenticateToken, requirePermission } from '../middleware/authMiddleware.js';

import { pool } from '../config/db.js';

const router = express.Router();
const upload = multer({ dest: 'src/storage/temp/' });

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
router.post('/documents', authenticateToken, requirePermission('documents:create'), upload.single('file'), async (req, res) => {
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
      INSERT INTO qms.documents_versions (document_id, version_number, file_path, file_name, mime_type, file_size_mb, status, created_at, uploaded_by)
      VALUES ($1, '1.0', $2, $3, $4, $5, 'pending', NOW(), $6)
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
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status, versionId } = req.body;
    const validStatuses = ['approved', 'pending', 'rejected', 'obsolete'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Estado no válido' });
    }

    await client.query('BEGIN');

    let targetVersionId = versionId;
    if (!targetVersionId) {
      const latestVer = await client.query(
        'SELECT id, version_number FROM qms.documents_versions WHERE document_id = $1 ORDER BY created_at DESC LIMIT 1',
        [id]
      );
      if (latestVer.rows.length) targetVersionId = latestVer.rows[0].id;
    }

    if (targetVersionId) {
      // 1. Actualizar el status de la versión
      const verUpdate = await client.query(
        'UPDATE qms.documents_versions SET status = $1 WHERE id = $2 RETURNING version_number',
        [status, targetVersionId]
      );

      // Si se aprueba esta versión, las versiones anteriores aprobadas pasan a obsoletas
      if (status === 'approved') {
        await client.query(
          "UPDATE qms.documents_versions SET status = 'obsolete' WHERE document_id = $1 AND id != $2 AND status = 'approved'",
          [id, targetVersionId]
        );
        if (verUpdate.rows.length) {
          await client.query(
            "UPDATE qms.documents SET current_version = $1, status = 'approved' WHERE id = $2",
            [verUpdate.rows[0].version_number, id]
          );
        }
      } else if (status === 'rejected') {
        const prevApproved = await client.query(
          "SELECT version_number FROM qms.documents_versions WHERE document_id = $1 AND status = 'approved' ORDER BY created_at DESC LIMIT 1",
          [id]
        );
        if (prevApproved.rows.length) {
          await client.query(
            "UPDATE qms.documents SET current_version = $1, status = 'approved' WHERE id = $2",
            [prevApproved.rows[0].version_number, id]
          );
        } else {
          await client.query(
            "UPDATE qms.documents SET status = 'rejected' WHERE id = $1",
            [id]
          );
        }
      } else {
        await client.query('UPDATE qms.documents SET status = $1 WHERE id = $2', [status, id]);
      }
    } else {
      await client.query('UPDATE qms.documents SET status = $1 WHERE id = $2', [status, id]);
    }

    await client.query('COMMIT');

    const docRes = await pool.query('SELECT id, name, code, status, current_version FROM qms.documents WHERE id = $1', [id]);

    res.json({
      success: true,
      message: `Documento ${status === 'approved' ? 'aprobado' : status === 'rejected' ? 'rechazado' : 'actualizado'} exitosamente`,
      document: docRes.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar estado del documento:', error);
    res.status(500).json({ success: false, message: 'Error interno al actualizar estado' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/documents/:id/versions
 * Subir una nueva versión de un documento existente (Operadores o Administradores)
 */
router.post('/documents/:id/versions', authenticateToken, requirePermission('documents:create_version'), upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Archivo requerido para la nueva versión' });
  }

  const { id } = req.params;
  const { versionNumber } = req.body;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Obtener documento base y nombres
    const docRes = await client.query(`
      SELECT d.id, d.name, d.code, d.current_version, d.id_category, d.id_department,
             c.name as category_name, dept.title as department_name
      FROM qms.documents d
      LEFT JOIN qms.categories c ON d.id_category = c.id
      LEFT JOIN qms.departments dept ON d.id_department = dept.id
      WHERE d.id = $1
    `, [id]);

    if (docRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Documento no encontrado' });
    }

    const doc = docRes.rows[0];

    // 2. Determinar número de versión
    let newVersion = versionNumber;
    if (!newVersion) {
      const currentVerNum = parseFloat(doc.current_version) || 1.0;
      newVersion = (currentVerNum + 0.1).toFixed(1);
    }

    // Validar que no exista ya ese número de versión para este documento
    const existVer = await client.query(
      'SELECT id FROM qms.documents_versions WHERE document_id = $1 AND version_number = $2',
      [id, newVersion]
    );
    if (existVer.rows.length > 0) {
      return res.status(400).json({ success: false, message: `La versión ${newVersion} ya existe para este documento` });
    }

    // 3. Mover archivo a disco
    const deptName = doc.department_name || 'Global';
    const catName = doc.category_name || 'General';
    const safeDept = deptName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const safeCat = catName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = Date.now();

    const relativePath = `${safeDept}/${safeCat}/uploaded_docs/${userId}/${timestamp}`;
    const targetDir = path.join(process.cwd(), 'src', 'storage', relativePath);
    await fs.promises.mkdir(targetDir, { recursive: true });

    const originalExt = path.extname(req.file.originalname);
    const finalFileName = `${doc.code || 'doc'}_v${newVersion}${originalExt}`;
    const finalPath = path.join(targetDir, finalFileName);

    await fs.promises.rename(req.file.path, finalPath);

    const savedPath = `${relativePath}/${finalFileName}`;
    const fileSizeMb = (req.file.size / (1024 * 1024)).toFixed(2);

    // 4. Insertar en documents_versions con status = 'pending'
    const verQuery = `
      INSERT INTO qms.documents_versions (document_id, version_number, file_path, file_name, mime_type, file_size_mb, status, created_at, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW(), $7)
      RETURNING id, version_number, status
    `;
    const verRes = await client.query(verQuery, [id, newVersion, savedPath, req.file.originalname, req.file.mimetype, fileSizeMb, userId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Propuesta de versión v${newVersion} enviada a revisión exitosamente.`,
      version: verRes.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al subir nueva versión:', err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: 'Error al subir la nueva versión' });
  } finally {
    client.release();
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
         dv.status,
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

export default router;
