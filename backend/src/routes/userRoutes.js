const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { auth, requireRole } = require('../middlewares/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Validaciones para actualización de perfil
const updateProfileValidation = [
  body('firstName').optional().trim().isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),
  body('lastName').optional().trim().isLength({ min: 2 }).withMessage('El apellido debe tener al menos 2 caracteres'),
  body('phone').optional().isMobilePhone().withMessage('Teléfono inválido')
];

// NOTA: Los endpoints de registro y login están en /api/auth
// Este archivo maneja solo las operaciones de usuarios autenticados

// 🔹 GET /api/users/profile - Obtener perfil del usuario autenticado
router.get('/profile', auth, async (req, res) => {
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
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            certificateRequests: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 🔹 GET /api/users - Obtener todos los usuarios (solo ADMIN)
router.get('/', auth, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = search ? {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { nationalId: { contains: search } }
      ]
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          nationalId: true,
          phone: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              certificateRequests: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 🔹 GET /api/users/:id - Obtener usuario específico (solo ADMIN)
router.get('/:id', auth, requireRole(['ADMIN']), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        nationalId: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        certificateRequests: {
          select: {
            id: true,
            requestNumber: true,
            certificateType: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 🔹 PUT /api/users/profile - Actualizar perfil del usuario autenticado
router.put('/profile', auth, updateProfileValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { firstName, lastName, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone })
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
      data: { user }
    });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 🔹 DELETE /api/users/:id - Eliminar usuario (solo ADMIN)
router.delete('/:id', auth, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;

    // No permitir que se elimine a sí mismo
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propia cuenta'
      });
    }

    // Verificar si el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Eliminar usuario (esto también eliminará las solicitudes relacionadas por cascada)
    await prisma.user.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;