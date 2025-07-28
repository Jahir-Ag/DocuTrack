const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireRole } = require('../middlewares/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Aplicar middleware de autenticación y admin a todas las rutas
router.use(authenticateToken);
router.use(requireRole(['admin']));

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
      success: true,
      data: {
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
      }
    });

  } catch (error) {
    console.error('Error obteniendo solicitudes:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
      return res.status(404).json({ 
        success: false,
        error: 'Solicitud no encontrada' 
      });
    }

    res.json({ 
      success: true,
      data: { request }
    });

  } catch (error) {
    console.error('Error obteniendo solicitud:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
        success: false,
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
      return res.status(404).json({ 
        success: false,
        error: 'Solicitud no encontrada' 
      });
    }

    // Actualizar en transacción
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar la solicitud
      const updatedRequest = await tx.certificateRequest.update({
        where: { id: requestId },
        data: {
          status,
          updatedAt: new Date(),
          ...(status === 'EMITIDO' && { completedAt: new Date() })
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
      success: true,
      message: 'Estado actualizado exitosamente',
      data: { request: result }
    });

  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/admin/requests/:id/documents/:docId - Descargar documento
router.get('/requests/:id/documents/:docId', async (req, res) => {
  try {
    const { id: requestId, docId } = req.params;

    // Verificar que el documento existe y pertenece a la solicitud
    const document = await prisma.document.findFirst({
      where: {
        id: docId,
        requestId
      },
      include: {
        request: {
          select: {
            id: true,
            requestNumber: true
          }
        }
      }
    });

    if (!document) {
      return res.status(404).json({ 
        success: false,
        error: 'Documento no encontrado' 
      });
    }

    const fs = require('fs').promises;

    try {
      await fs.access(document.filePath);
    } catch {
      return res.status(404).json({ 
        success: false,
        error: 'Archivo no encontrado en el sistema' 
      });
    }

    // Configurar headers para descarga
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    res.setHeader('Content-Length', document.fileSize);

    const fileBuffer = await fs.readFile(document.filePath);
    res.send(fileBuffer);

  } catch (error) {
    console.error('Error descargando documento:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/admin/dashboard - Dashboard con estadísticas generales
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalRequests,
      pendingRequests,
      completedRequests,
      recentRequests
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'user' } }),
      prisma.certificateRequest.count(),
      prisma.certificateRequest.count({ 
        where: { 
          status: { 
            notIn: ['EMITIDO', 'RECHAZADO'] 
          } 
        } 
      }),
      prisma.certificateRequest.count({ where: { status: 'EMITIDO' } }),
      prisma.certificateRequest.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })
    ]);

    // Estadísticas por tipo de certificado
    const typeStats = await prisma.certificateRequest.groupBy({
      by: ['certificateType'],
      _count: {
        certificateType: true
      }
    });

    // Estadísticas por estado
    const statusStats = await prisma.certificateRequest.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalUsers,
          totalRequests,
          pendingRequests,
          completedRequests
        },
        typeStats: typeStats.reduce((acc, stat) => {
          acc[stat.certificateType] = stat._count.certificateType;
          return acc;
        }, {}),
        statusStats: statusStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.status;
          return acc;
        }, {}),
        recentRequests
      }
    });

  } catch (error) {
    console.error('Error obteniendo dashboard:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;