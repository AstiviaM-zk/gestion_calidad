import jwt from 'jsonwebtoken';

/**
 * Middleware para verificar que la petición incluya un token JWT válido
 */
export function authenticateToken(req, res, next) {
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
