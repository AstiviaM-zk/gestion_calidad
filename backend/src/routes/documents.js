import express from 'express';
import { getAllUsers } from '../services/userService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

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
router.get('/documents', authenticateToken, (req, res) => {
  res.json({
    success: true,
    documents: documentsData
  });
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

/**
 * GET /api/users
 * Returns list of REAL users who have authenticated via Google OAuth
 */
router.get('/users', authenticateToken, (req, res) => {
  const realUsers = getAllUsers();
  res.json({
    success: true,
    users: realUsers
  });
});

export default router;
