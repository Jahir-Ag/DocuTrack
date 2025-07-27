const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Aplicar middleware de admin a todas las rutas
router.use(requireAdmin);

// GET /api/admin/requests - Obtener todas las solicitudes
router.get('/requests', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      certificateType, 
      urgency,
      search 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Construir filtros
    const where = {
      ...(status && { status }),
      ...(certificateType && { certificateType }),
      ...(urgency && { urgency }),
      ...(search && {
        OR: [
          { requestNumber: { contains: search, mode: 'insensitive' } },
          { user: { 
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { nationalId: { contains: search, mode: 'insensitive' } }
            ]
          }}
        ]
      })
    };

    const [requests, total] = await Promise.all([
      prisma.certificateRequest.findMany({
        where,
        orderBy: [
          { urgency: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: parseInt(limit),
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              nationalId: true
            }
          },
          documents: {
            select: {
              id: true,
              fileName: true,
              originalName: true,
              fileSize: true,
              uploadedAt: true
            }
          },
          _count: {
            select: {
              statusHistory: true
            }
          }
        }
      }),
      prisma.certificateRequest.count({ where })
    ]);

    // Estadísticas rápidas
    const stats = await prisma.certificateRequest.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    res.json({
      requests,
      stats: stats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status;
        return acc;
      }, {}),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error obteniendo solicitudes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/admin/requests/:id - Obtener solicitud específica con detalles completos
router.get('/requests/:id', async (req, res) => {
  try {
    const request = await prisma.certificateRequest.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            nationalId: true,
            phone: true,
            createdAt: true
          }
        },
        documents: {
          select: {
            id: true,
            fileName: true,
            originalName: true,
            fileSize: true,
            mimeType: true,
            uploadedAt: true
          }
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            changedBy: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    res.json({ request });

  } catch (error) {
    console.error('Error obteniendo solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/admin/requests/:id/status - Cambiar estado de solicitud
router.put('/requests/:id/status', [
  body('status').isIn(['RECIBIDO', 'EN_VALIDACION', 'OBSERVADO', 'APROBADO', 'EMITIDO', 'RECHAZADO'])
    .withMessage('Estado inválido'),
  body('comment').optional().trim().isLength({ min: 1, max: 1000 })
    .withMessage('El comentario debe tener entre 1 y 1000 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Datos inválidos', 
        details: errors.array() 
      });
    }

    const { status, comment } = req.body;
    const requestId = req.params.id;

    // Verificar que la solicitud existe
    const existingRequest = await prisma.certificateRequest.findUnique({
      where: { id: requestId }
    });

    if (!existingRequest) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    // Actualizar en transacción
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar la solicitud
      const updatedRequest = await tx.certificateRequest.update({
        where: { id: requestId },
        data: {
          status,
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      // Crear registro en historial
      await tx.statusHistory.create({
        data: {
          requestId,
          oldStatus: existingRequest.status,
          newStatus: status,
          comment: comment || null,
          changedById: req.user.id
        }
      });

      return updatedRequest;
    });

    res.json({
      message: 'Estado actualizado exitosamente',
      request: result
    });

  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/admin/requests/:id/documents/:docId - Descargar documento
router.get('/requests/:id/documents/:docId', async (req, res) => {
  try {
    const document = await prisma.document.fin