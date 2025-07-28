const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { requireUser } = require('../middlewares/auth');
const { generateCertificatePDF } = require('../utils/pdfGenerator'); // ✅ MOVIDO AL INICIO

const router = express.Router();
const prisma = new PrismaClient();

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/documents');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF, JPG, JPEG y PNG'));
    }
  }
});

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
          documents: {
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
router.post('/', requireUser, upload.array('documents', 5), requestValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Limpiar archivos subidos si hay errores de validación
      if (req.files) {
        for (const file of req.files) {
          await fs.unlink(file.path).catch(console.error);
        }
      }
      return res.status(400).json({ 
        error: 'Datos inválidos', 
        details: errors.array() 
      });
    }

    const { certificateType, reason, urgency = 'NORMAL' } = req.body;

    // Verificar que se subieron documentos
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        error: 'Se requiere al menos un documento' 
      });
    }

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

      return { request, documents };
    });

    res.status(201).json({
      message: 'Solicitud creada exitosamente',
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
    });

  } catch (error) {
    // Limpiar archivos en caso de error
    if (req.files) {
      for (const file of req.files) {
        await fs.unlink(file.path).catch(console.error);
      }
    }
    
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
        documents: {
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
            phone: true // ✅ AGREGADO PHONE
          }
        }
      }
    });

    if (!request) {
      return res.status(404).json({ 
        error: 'Solicitud no encontrada o certificado no disponible' 
      });
    }

    // ✅ REMOVIDO EL REQUIRE DINÁMICO - ahora usa la importación del inicio
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
        documents: true
      }
    });

    if (!request) {
      return res.status(404).json({ 
        error: 'Solicitud no encontrada o no se puede cancelar' 
      });
    }

    // Eliminar archivos físicos
    for (const doc of request.documents) {
      await fs.unlink(doc.filePath).catch(console.error);
    }

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