const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Obtener perfil del usuario actual
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        nationalId: true,
        phone: true,
        role: true,
        lastLogin: true,
        createdAt: true,
        emailVerified: true,
        _count: {
          select: {
            requests: {
              where: { status: { not: 'RECHAZADO' } }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Actualizar perfil del usuario
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const userId = req.user.id;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        phone,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        nationalId: true,
        phone: true,
        role: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: { user: updatedUser }
    });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener estadísticas del usuario
const getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Obtener estadísticas de solicitudes
    const stats = await prisma.certificateRequest.groupBy({
      by: ['status'],
      where: { userId },
      _count: {
        status: true
      }
    });

    // Convertir a objeto más legible
    const statusStats = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status;
      return acc;
    }, {});

    // Obtener solicitudes recientes
    const recentRequests = await prisma.certificateRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        requestNumber: true,
        certificateType: true,
        status: true,
        urgency: true,
        createdAt: true
      }
    });

    // Obtener total de solicitudes por tipo
    const typeStats = await prisma.certificateRequest.groupBy({
      by: ['certificateType'],
      where: { userId },
      _count: {
        certificateType: true
      }
    });

    const certificateTypeStats = typeStats.reduce((acc, stat) => {
      acc[stat.certificateType] = stat._count.certificateType;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        statusStats,
        certificateTypeStats,
        recentRequests,
        totalRequests: Object.values(statusStats).reduce((sum, count) => sum + count, 0)
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener historial de solicitudes del usuario
const getRequestHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status, certificateType } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId,
      ...(status && { status }),
      ...(certificateType && { certificateType })
    };

    const [requests, total] = await Promise.all([
      prisma.certificateRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          requestNumber: true,
          certificateType: true,
          status: true,
          urgency: true,
          reason: true,
          createdAt: true,
          updatedAt: true,
          completedAt: true,
          _count: {
            select: {
              documents: true
            }
          }
        }
      }),
      prisma.certificateRequest.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verificar disponibilidad de email
const checkEmailAvailability = async (req, res) => {
  try {
    const { email } = req.query;
    const currentUserId = req.user.id;

    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        id: { not: currentUserId }
      }
    });

    res.json({
      success: true,
      data: {
        available: !existingUser,
        email
      }
    });

  } catch (error) {
    console.error('Error verificando email:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Cambiar contraseña
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Obtener usuario actual
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    }

    // Verificar que la nueva contraseña sea diferente
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ error: 'La nueva contraseña debe ser diferente a la actual' });
    }

    // Hashear nueva contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Desactivar cuenta (soft delete)
const deactivateAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    // Verificar contraseña para confirmar
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Contraseña incorrecta' });
    }

    // Verificar que no tenga solicitudes pendientes
    const pendingRequests = await prisma.certificateRequest.count({
      where: {
        userId,
        status: {
          notIn: ['COMPLETADO', 'RECHAZADO']
        }
      }
    });

    if (pendingRequests > 0) {
      return res.status(400).json({ error: 'No puedes desactivar tu cuenta con trámites pendientes' });
    }

    // Soft delete: marcar cuenta como inactiva
    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Cuenta desactivada exitosamente'
    });

  } catch (error) {
    console.error('Error desactivando cuenta:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getStats,
  getRequestHistory,
  checkEmailAvailability,
  changePassword,
  deactivateAccount
};