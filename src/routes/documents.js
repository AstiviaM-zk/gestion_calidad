import express from 'express';
import { getAllUsers } from '../services/userService.js';

const router = express.Router();

// Mock QMS Documents Data
const documentsData = [
  {
    id: 'DOC-QMS-001',
    title: 'Manual de Gestión de la Calidad ISO 9001:2015',
    category: 'Manuales',
    version: 'v3.2',
    status: 'Aprobado',
    author: 'Ing. Carlos Mendoza',
    updatedAt: '2026-08-15',
    type: 'PDF',
    size: '4.2 MB'
  },
  {
    id: 'DOC-QMS-002',
    title: 'Procedimiento Operativo Estándar - Control de Cambios',
    category: 'Procedimientos',
    version: 'v2.1',
    status: 'Aprobado',
    author: 'Dra. Elena Ramos',
    updatedAt: '2026-08-28',
    type: 'PDF',
    size: '1.8 MB'
  },
  {
    id: 'DOC-QMS-003',
    title: 'Formato de Registro de Incidencias y No Conformidades',
    category: 'Formatos',
    version: 'v1.4',
    status: 'En Revisión',
    author: 'Lic. Fernando Ortiz',
    updatedAt: '2026-09-02',
    type: 'DOCX',
    size: '850 KB'
  },
  {
    id: 'DOC-QMS-004',
    title: 'Plan Anual de Auditorías Internas de Calidad 2026-2027',
    category: 'Planes',
    version: 'v1.0',
    status: 'Borrador',
    author: 'Ing. Sofía Morales',
    updatedAt: '2026-09-08',
    type: 'PDF',
    size: '2.5 MB'
  },
  {
    id: 'DOC-QMS-005',
    title: 'Matriz de Evaluación de Riesgos Operacionales',
    category: 'Matrices',
    version: 'v2.0',
    status: 'Aprobado',
    author: 'Ing. Carlos Mendoza',
    updatedAt: '2026-07-20',
    type: 'XLSX',
    size: '3.1 MB'
  }
];

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
router.get('/documents', (req, res) => {
  res.json({
    success: true,
    documents: documentsData
  });
});

/**
 * GET /api/stats
 */
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    stats: statsData
  });
});

/**
 * GET /api/users
 * Returns list of REAL users who have authenticated via Google OAuth
 */
router.get('/users', (req, res) => {
  const realUsers = getAllUsers();
  res.json({
    success: true,
    users: realUsers
  });
});

export default router;
