const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Middleware de autenticación
const auth = async (req, res, next) => {
  try {
    // Obtener el token del header Authorization
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. No se proporcionó token de autenticación.'
      });
    }

    // Extraer el token (formato: "Bearer TOKEN")
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. Token inválido.'
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,  // ✅ CAMBIADO: name -> firstName
        lastName: true,   // ✅ AGREGADO: lastName 
        nationalId: true, // ✅ AGREGADO: nationalId
        phone: true,      // ✅ AGREGADO: phone
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido. Usuario no encontrado.'
      });
    }

    // Agregar la información del usuario al request
    req.user = user;
    next();
    
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor.'
    });
  }
};

// Middleware para verificar roles específicos
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para realizar esta acción.'
      });
    }

    next();
  };
};

// Middleware opcional de autenticación (no falla si no hay token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,  // ✅ CAMBIADO: name -> firstName
        lastName: true,   // ✅ AGREGADO: lastName
        nationalId: true, // ✅ AGREGADO: nationalId
        phone: true,      // ✅ AGREGADO: phone
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (user) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Si hay error, simplemente continúa sin usuario autenticado
    next();
  }
};

// También exportar como authenticateToken para compatibilidad
const authenticateToken = auth;

// ✅ AGREGADO: Alias requireUser que es lo que necesita requestRoutes.js
const requireUser = auth;

// ✅ SOLUCION: Crear requireAdmin usando requireRole
const requireAdmin = requireRole(['ADMIN']);

module.exports = {
  auth,
  authenticateToken,
  requireRole,
  optionalAuth,
  requireUser,
  requireAdmin  // ✅ AGREGADO: Ahora exporta requireAdmin
};