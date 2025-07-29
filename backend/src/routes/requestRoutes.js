const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { requireUser } = require('../middlewares/auth');
const { uploadDocument, cleanupFile } = require('../middlewares/uploadsMiddleware'); // Cambiado
const { generateCertificatePDF } = require('../utils/pdfGenerator');

const router = express.Router();
const prisma = new PrismaClient();

// Validaciones
const requestValidation = [
  body('certificateType').isIn(['NACIMIENTO', 'ESTUDIOS', 'RESIDENCIA', 'ANTECEDENTES'])
    .withMessage('Tipo de certificado inválido'),
  body('reason').trim().isLength({ min: 10, max: 500 })
    .withMessage('La razón debe tener entre 10 y 500 caracteres'),
  body('urgency').optional().isIn(['NORMAL', 'URGENTE'])
    .withMessage('Urgencia inválida')
];

// GET /api/requests - Obtener solicitudes del usuario
router.get('/', requireUser, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId: req.user.id,
      ...(status && { status })
    };

    const [requests, total] = await Promise.all([
      prisma.certificateRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          document: { // Cambiado de 'documents' a 'document' (singular)
            select: {
              id: true,
              fileName: true,
              originalName: true,
              fileSize: true,
              uploadedAt: true
            }
          }
        }
      }),
      prisma.certificateRequest.count({ where })
    ]);

    res.json({
      requests,
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

// POST /api/requests - Crear nueva solicitud
router.post('/', requireUser, uploadDocument, requestValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Limpiar archivo subido si hay errores de validación
      await cleanupFile(req.file); // Cambiado de cleanupFiles a cleanupFile
      return res.status(400).json({ 
        error: 'Datos inválidos', 
        details: errors.array() 
      });
    }

    const { certificateType, reason, urgency = 'NORMAL' } = req.body;

    // Generar número de solicitud único
    const requestNumber = `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

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
          userId: req.user.id
        }
      });

      // Crear documento asociado (solo UNO)
      const document = await tx.document.create({
        data: {
          fileName: req.file.filename,
          originalName: req.file.originalname,
          filePath: req.file.path,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          requestId: request.id
        }
      });

      return { request, document };
    });

    res.status(201).json({
      message: 'Solicitud creada exitosamente',
      request: {
        ...result.request,
        document: { // Singular
          id: result.document.id,
          fileName: result.document.fileName,
          originalName: result.document.originalName,
          fileSize: result.document.fileSize,
          uploadedAt: result.document.uploadedAt
        }
      }
    });

  } catch (error) {
    // Limpiar archivo en caso de error
    await cleanupFile(req.file); // Cambiado
    
    console.error('Error creando solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/requests/:id - Obtener solicitud específica
router.get('/:id', requireUser, async (req, res) => {
  try {
    const request = await prisma.certificateRequest.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        document: { // Cambiado a singular
          select: {
            id: true,
            fileName: true,
            originalName: true,
            fileSize: true,
            uploadedAt: true
          }
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10
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

// GET /api/requests/:id/download - Descargar certificado
router.get('/:id/download', requireUser, async (req, res) => {
  try {
    const request = await prisma.certificateRequest.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
        status: 'EMITIDO'
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            nationalId: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!request) {
      return res.status(404).json({ 
        error: 'Solicitud no encontrada o certificado no disponible' 
      });
    }

    const pdfBuffer = await generateCertificatePDF(request);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificado-${request.requestNumber}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error descargando certificado:', error);
    res.status(500).json({ error: 'Error generando certificado' });
  }
});

// DELETE /api/requests/:id - Cancelar solicitud (solo si está en RECIBIDO)
router.delete('/:id', requireUser, async (req, res) => {
  try {
    const request = await prisma.certificateRequest.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
        status: 'RECIBIDO'
      },
      include: {
        document: true // Cambiado a singular
      }
    });

    if (!request) {
      return res.status(404).json({ 
        error: 'Solicitud no encontrada o no se puede cancelar' 
      });
    }

    // Eliminar archivo físico usando el helper
    await cleanupFile(request.document); // Cambiado

    // Eliminar de la base de datos
    await prisma.certificateRequest.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Solicitud cancelada exitosamente' });

  } catch (error) {
    console.error('Error cancelando solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;