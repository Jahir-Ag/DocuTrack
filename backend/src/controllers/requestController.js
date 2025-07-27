const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { generateCertificatePDF } = require('../utils/pdfGenerator');

const prisma = new PrismaClient();

class RequestController {
  // Crear nueva solicitud
  static async createRequest(req, res) {
    try {
      const { certificateType, reason, urgency = 'NORMAL' } = req.body;
      const userId = req.user.id;

      // Verificar que se subieron documentos
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ 
          error: 'Se requiere al menos un documento' 
        });
      }

      // Generar número de solicitud único
      const requestNumber = `DOC-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

      // Crear solicitud en transacción
      const result = await prisma.$transaction(async (tx) => {
        // Crear la solicitud
        const request = await tx.certificateRequest.create({
          data: {
            requestNumber,
            certificateType,
            reason,
            urgency,
            status: 'RECIBIDO',
            userId
          }
        });

        // Crear documentos asociados
        const documents = await Promise.all(
          req.files.map(file => 
            tx.document.create({
              data: {
                fileName: file.filename,
                originalName: file.originalname,
                filePath: file.path,
                fileSize: file.size,
                mimeType: file.mimetype,
                requestId: request.id
              }
            })
          )
        );

        // Crear registro en historial de estado
        await tx.statusHistory.create({
          data: {
            requestId: request.id,
            oldStatus: 'RECIBIDO',
            newStatus: 'RECIBIDO',
            comment: 'Solicitud creada y recibida en el sistema',
            changedById: userId
          }
        });

        return { request, documents };
      });

      res.status(201).json({
        success: true,
        message: 'Solicitud creada exitosamente',
        data: {
          request: {
            ...result.request,
            documents: result.documents.map(doc => ({
              id: doc.id,
              fileName: doc.fileName,
              originalName: doc.originalName,
              fileSize: doc.fileSize,
              uploadedAt: doc.uploadedAt
            }))
          }
        }
      });

    } catch (error) {
      // Limpiar archivos en caso de error
      if (req.files) {
        for (const file of req.files) {
          await fs.unlink(file.path).catch(console.error);
        }
      }
      
      console.error('Error creando solicitud:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtener solicitudes del usuario
  static async getUserRequests(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, status, certificateType, search } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {
        userId,
        ...(status && { status }),
        ...(certificateType && { certificateType }),
        ...(search && {
          OR: [
            { requestNumber: { contains: search, mode: 'insensitive' } },
            { reason: { contains: search, mode: 'insensitive' } }
          ]
        })
      };

      const [requests, total] = await Promise.all([
        prisma.certificateRequest.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
          include: {
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

  // Obtener solicitud específica
  static async getRequestById(req, res) {
    try {
      const requestId = req.params.id;
      const userId = req.user.id;

      const request = await prisma.certificateRequest.findFirst({
        where: {
          id: requestId,
          userId
        },
        include: {
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

  // Descargar certificado
  static async downloadCertificate(req, res) {
    try {
      const requestId = req.params.id;
      const userId = req.user.id;

      const request = await prisma.certificateRequest.findFirst({
        where: {
          id: requestId,
          userId,
          status: 'EMITIDO'
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              nationalId: true,
              email: true
            }
          }
        }
      });

      if (!request) {
        return res.status(404).json({ 
          error: 'Solicitud no encontrada o certificado no disponible para descarga' 
        });
      }

      // Generar PDF del certificado
      const pdfBuffer = await generateCertificatePDF(request);

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="certificado-${request.requestNumber}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);

    } catch (error) {
      console.error('Error descargando certificado:', error);
      res.status(500).json({ 
        error: 'Error generando certificado',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Cancelar solicitud (solo si está en RECIBIDO)
  static async cancelRequest(req, res) {
    try {
      const requestId = req.params.id;
      const userId = req.user.id;

      const request = await prisma.certificateRequest.findFirst({
        where: {
          id: requestId,
          userId,
          status: 'RECIBIDO'
        },
        include: {
          documents: true
        }
      });

      if (!request) {
        return res.status(404).json({ 
          error: 'Solicitud no encontrada o no se puede cancelar (solo se pueden cancelar solicitudes en estado RECIBIDO)' 
        });
      }

      // Eliminar en transacción
      await prisma.$transaction(async (tx) => {
        // Crear registro en historial
        await tx.statusHistory.create({
          data: {
            requestId: request.id,
            oldStatus: request.status,
            newStatus: 'RECHAZADO',
            comment: 'Solicitud cancelada por el usuario',
            changedById: userId
          }
        });

        // Actualizar estado a RECHAZADO en lugar de eliminar
        await tx.certificateRequest.update({
          where: { id: requestId },
          data: { 
            status: 'RECHAZADO',
            updatedAt: new Date()
          }
        });
      });

      // Eliminar archivos físicos (opcional, podrías mantenerlos para auditoría)
      for (const doc of request.documents) {
        await fs.unlink(doc.filePath).catch(console.error);
      }

      res.json({
        success: true,
        message: 'Solicitud cancelada exitosamente'
      });

    } catch (error) {
      console.error('Error cancelando solicitud:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Descargar documento específico
  static async downloadDocument(req, res) {
    try {
      const { id: requestId, docId } = req.params;
      const userId = req.user.id;

      // Verificar que el documento pertenece al usuario
      const document = await prisma.document.findFirst({
        where: {
          id: docId,
          request: {
            id: requestId,
            userId
          }
        },
        include: {
          request: {
            select: {
              requestNumber: true
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

  // Obtener tipos de certificados disponibles
  static async getCertificateTypes(req, res) {
    try {
      const certificateTypes = [
        {
          value: 'NACIMIENTO',
          label: 'Certificado de Nacimiento',
          description: 'Documento que certifica el nacimiento de una persona',
          requiredDocuments: ['Cédula de identidad', 'Documento de identificación adicional']
        },
        {
          value: 'ESTUDIOS',
          label: 'Certificado de Estudios',
          description: 'Documento que certifica los estudios realizados',
          requiredDocuments: ['Cédula de identidad', 'Diploma o certificado original', 'Notas o expediente académico']
        },
        {
          value: 'RESIDENCIA',
          label: 'Certificado de Residencia',
          description: 'Documento que certifica el lugar de residencia',
          requiredDocuments: ['Cédula de identidad', 'Recibo de servicios públicos', 'Contrato de alquiler o escritura']
        },
        {
          value: 'ANTECEDENTES',
          label: 'Certificado de Antecedentes',
          description: 'Documento que certifica los antecedentes penales',
          requiredDocuments: ['Cédula de identidad', 'Fotografía reciente']
        }
      ];

      res.json({
        success: true,
        data: { certificateTypes }
      });

    } catch (error) {
      console.error('Error obteniendo tipos de certificados:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = RequestController;