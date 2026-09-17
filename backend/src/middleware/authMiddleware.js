import jwt from 'jsonwebtoken';
import { getUserByEmail } from '../services/userService.js';

/**
 * Middleware para verificar que la petición incluya un token JWT válido
 * y consultar el estado actual del usuario en PostgreSQL.
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Acceso no autorizado: Token de sesión ausente'
    });
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'default_secret';

  try {
    const decoded = jwt.verify(token, jwtSecret);
    if (decoded && decoded.email) {
      const dbUser = await getUserByEmail(decoded.email);
      if (dbUser) {
        req.user = dbUser;
        return next();
      }
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Acceso no autorizado: Token inválido o expirado'
    });
  }
}

/**
 * Middleware para restringir rutas por Rol de usuario
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: No tienes el rol necesario para esta operación.'
      });
    }
    next();
  };
}

/**
 * Middleware para restringir rutas por Permisos específicos
 */
export function requirePermission(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Acceso no autorizado' });
    }
    if (req.user.role === 'admin_sgc') {
      return next();
    }
    const userPerms = req.user.permissions || [];
    const hasAll = requiredPermissions.every(p => userPerms.includes(p));
    if (!hasAll) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: Permisos insuficientes.'
      });
    }
    next();
  };
}
