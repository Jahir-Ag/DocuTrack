const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireRole } = require('../middlewares/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Aplicar middleware de autenticación y admin a todas las rutas
router.use(authenticateToken);
router.use(requireRole(['ADMIN'])); 

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
              nationalId: true,
              phone: true
            }
          },
          document: {
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
            take: 1,
            include: {
              changedBy: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
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
        document: {
          select: {
            id: true,
            fileName: true,
            originalName: true,
            fileSize: true,
            mimeType: true,
            filePath: true,
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

// ✅ PATCH /api/admin/requests/:id/status - Cambiar estado de solicitud (REST-compliant)
router.patch('/requests/:id/status', [
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

    // Validaciones de transición de estado
    const validTransitions = {
      'RECIBIDO': ['EN_VALIDACION', 'RECHAZADO'],
      'EN_VALIDACION': ['OBSERVADO', 'APROBADO', 'RECHAZADO'],
      'OBSERVADO': ['EN_VALIDACION', 'APROBADO', 'RECHAZADO'],
      'APROBADO': ['EMITIDO'],
      'EMITIDO': [], // Estado final
      'RECHAZADO': [] // Estado final
    };

    if (!validTransitions[existingRequest.status].includes(status)) {
      return res.status(400).json({
        success: false,
        error: `No se puede cambiar de ${existingRequest.status} a ${status}`
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
          processedAt: status === 'EN_VALIDACION' && !existingRequest.processedAt ? new Date() : existingRequest.processedAt,
          completedAt: ['APROBADO', 'EMITIDO', 'RECHAZADO'].includes(status) ? new Date() : null
        },
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
          document: true
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
      message: `Estado actualizado a ${status} exitosamente`,
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

// ✅ GET /api/admin/requests/:id/document - Descarga directa del documento (para AdminRequestDetail)
router.get('/requests/:id/document', async (req, res) => {
  try {
    const { id: requestId } = req.params;

    // Buscar la solicitud con su documento
    const request = await prisma.certificateRequest.findUnique({
      where: { id: requestId },
      include: {
        document: true
      }
    });

    if (!request || !request.document) {
      return res.status(404).json({ 
        success: false,
        error: 'Documento no encontrado' 
      });
    }

    const fs = require('fs').promises;

    try {
      await fs.access(request.document.filePath);
    } catch {
      return res.status(404).json({ 
        success: false,
        error: 'Archivo no encontrado en el sistema' 
      });
    }

    // Configurar headers para descarga
    res.setHeader('Content-Type', request.document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${request.document.originalName}"`);
    res.setHeader('Content-Length', request.document.fileSize);

    const fileBuffer = await fs.readFile(request.document.filePath);
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

// GET /api/admin/requests/:id/documents/:docId - Descargar documento específico por ID
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

// GET /api/admin/dashboard/stats - Estadísticas específicas para dashboard admin
router.get('/dashboard/stats', async (req, res) => {
  try {
    const [
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      todayRequests,
      requestsByType,
      recentRequests
    ] = await Promise.all([
      // Total de solicitudes
      prisma.certificateRequest.count(),
      
      // Solicitudes pendientes
      prisma.certificateRequest.count({
        where: {
          status: {
            in: ['RECIBIDO', 'EN_VALIDACION', 'OBSERVADO']
          }
        }
      }),
      
      // Solicitudes aprobadas
      prisma.certificateRequest.count({
        where: { status: { in: ['APROBADO', 'EMITIDO'] } }
      }),
      
      // Solicitudes rechazadas
      prisma.certificateRequest.count({
        where: { status: 'RECHAZADO' }
      }),
      
      // Solicitudes de hoy
      prisma.certificateRequest.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      
      // Solicitudes por tipo
      prisma.certificateRequest.groupBy({
        by: ['certificateType'],
        _count: {
          certificateType: true
        }
      }),
      
      // Solicitudes recientes
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

    res.json({
      success: true,
      data: {
        stats: {
          total: totalRequests,
          pending: pendingRequests,
          approved: approvedRequests,
          rejected: rejectedRequests,
          today: todayRequests
        },
        requestsByType,
        recentRequests
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/admin/dashboard - Dashboard con estadísticas generales (mantener compatibilidad)
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalRequests,
      pendingRequests,
      completedRequests,
      recentRequests
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
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