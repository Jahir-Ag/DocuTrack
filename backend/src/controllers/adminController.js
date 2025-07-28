const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;

const prisma = new PrismaClient();

class AdminController {
  // Dashboard - Estadísticas generales
  static async getDashboard(req, res) {
    try {
      // Estadísticas generales
      const [
        totalRequests,
        totalUsers,
        requestsByStatus,
        requestsByType,
        recentRequests,
        urgentRequests
      ] = await Promise.all([
        // Total de solicitudes
        prisma.certificateRequest.count(),
        
        // Total de usuarios
        prisma.user.count({ where: { role: 'USER' } }),
        
        // Solicitudes por estado
        prisma.certificateRequest.groupBy({
          by: ['status'],
          _count: { status: true }
        }),
        
        // Solicitudes por tipo
        prisma.certificateRequest.groupBy({
          by: ['certificateType'],
          _count: { certificateType: true }
        }),
        
        // Solicitudes recientes
        prisma.certificateRequest.findMany({
          take: 10,
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
        }),
        
        // Solicitudes urgentes pendientes
        prisma.certificateRequest.count({
          where: {
            urgency: 'URGENTE',
            status: { in: ['RECIBIDO', 'EN_VALIDACION'] }
          }
        })
      ]);

      // Convertir arrays de agrupación a objetos
      const statusStats = requestsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {});

      const typeStats = requestsByType.reduce((acc, item) => {
        acc[item.certificateType] = item._count.certificateType;
        return acc;
      }, {});

      // Estadísticas de productividad (solicitudes procesadas hoy)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const processedToday = await prisma.certificateRequest.count({
        where: {
          updatedAt: {
            gte: today,
            lt: tomorrow
          },
          status: { in: ['APROBADO', 'EMITIDO', 'RECHAZADO'] }
        }
      });

      res.json({
        success: true,
        data: {
          overview: {
            totalRequests,
            totalUsers,
            urgentRequests,
            processedToday
          },
          statusStats,
          typeStats,
          recentRequests
        }
      });

    } catch (error) {
      console.error('Error obteniendo dashboard:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtener todas las solicitudes (con filtros)
  static async getAllRequests(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        certificateType, 
        urgency,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
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
            { reason: { contains: search, mode: 'insensitive' } },
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

      // Configurar ordenamiento
      const orderBy = {};
      if (sortBy === 'user') {
        orderBy.user = { firstName: sortOrder };
      } else if (sortBy === 'urgency') {
        orderBy.urgency = sortOrder;
      } else {
        orderBy[sortBy] = sortOrder;
      }

      const [requests, total] = await Promise.all([
        prisma.certificateRequest.findMany({
          where,
          orderBy: [
            { urgency: 'desc' }, // Siempre priorizar urgentes
            orderBy
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
      console.error('Error obteniendo solicitudes:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtener solicitud específica con detalles completos
  static async getRequestById(req, res) {
    try {
      const requestId = req.params.id;

      const request = await prisma.certificateRequest.findUnique({
        where: { id: requestId },
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
                  email: true,
                  role: true
                }
              }
            }
          }
        }
      });

      if (!request) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }

      res.json({
        success: true,
        data: { request }
      });

    } catch (error) {
      console.error('Error obteniendo solicitud:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Cambiar estado de solicitud
  static async updateRequestStatus(req, res) {
    try {
      const { status, comment } = req.body;
      const requestId = req.params.id;
      const adminId = req.user.id;

      // Verificar que la solicitud existe
      const existingRequest = await prisma.certificateRequest.findUnique({
        where: { id: requestId },
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

      if (!existingRequest) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }

      // Validar transición de estado
      const validTransitions = {
        'RECIBIDO': ['EN_VALIDACION', 'RECHAZADO'],
        'EN_VALIDACION': ['OBSERVADO', 'APROBADO', 'RECHAZADO'],
        'OBSERVADO': ['EN_VALIDACION', 'APROBADO', 'RECHAZADO'],
        'APROBADO': ['EMITIDO'],
        'EMITIDO': [], // Estado final
        'RECHAZADO': [] // Estado final
      };

      const currentStatus = existingRequest.status;
      if (!validTransitions[currentStatus].includes(status)) {
        return res.status(400).json({ 
          error: 'Transición de estado inválida',
          details: `No se puede cambiar de ${currentStatus} a ${status}`
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
            ...(status === 'APROBADO' && { processedAt: new Date() }),
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
            oldStatus: currentStatus,
            newStatus: status,
            comment: comment || null,
            changedById: adminId
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
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Descargar documento de solicitud
  static async downloadRequestDocument(req, res) {
    try {
      const { id: requestId, docId } = req.params;

      const document = await prisma.document.findFirst({
        where: {
          id: docId,
          requestId
        },
        include: {
          request: {
            select: {
              requestNumber: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      if (!document) {
        return res.status(404).json({ error: 'Documento no encontrado' });
      }

      // Verificar que el archivo existe
      try {
        await fs.access(document.filePath);
      } catch {
        return res.status(404).json({ error: 'Archivo no encontrado en el sistema' });
      }

      // Configurar headers y enviar archivo
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
      
      const fileBuffer = await fs.readFile(document.filePath);
      res.send(fileBuffer);

    } catch (error) {
      console.error('Error descargando documento:', error);
      res.status(500).json({ 
        error: 'Error descargando documento',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Gestión de usuarios
static async getAllUsers(req, res) {
  try {
    const { page = 1, limit = 10, search, role, isActive } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(role && { role }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { nationalId: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          nationalId: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true
        }
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
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
}
