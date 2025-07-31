const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { requireUser } = require('../middlewares/auth');
const { uploadDocument, cleanupFile } = require('../middlewares/uploadsMiddleware');
const { generateCertificatePDF } = require('../utils/pdfGenerator');

const router = express.Router();
const prisma = new PrismaClient();

// Agregar todos los campos requeridos
const requestValidation = [
  body('certificateType')
    .isIn(['NACIMIENTO', 'ESTUDIOS', 'RESIDENCIA', 'ANTECEDENTES'])
    .withMessage('Tipo de certificado inválido'),
  
  // AGREGAR VALIDACIONES PARA CAMPOS PERSONALES
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres'),
  
  body('email')
    .isEmail()
    .withMessage('Debe ser un email válido'),
  
  body('phone')
    .trim()
    .isLength({ min: 8, max: 20 })
    .withMessage('El teléfono debe tener entre 8 y 20 caracteres'),
  
  body('cedula')
    .trim()
    .isLength({ min: 8, max: 15 })
    .withMessage('La cédula debe tener entre 8 y 15 caracteres'),
  
  body('birthDate')
    .isISO8601()
    .withMessage('La fecha de nacimiento debe ser válida'),
  
  body('address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('La dirección debe tener entre 10 y 200 caracteres'),
  
  body('reason')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('La razón debe tener entre 10 y 500 caracteres'),
  
  body('additionalInfo')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La información adicional no puede exceder 500 caracteres'),
    
  body('urgency')
    .optional()
    .isIn(['NORMAL', 'URGENTE'])
    .withMessage('Urgencia inválida')
];


// GET /api/requests/all - Obtener TODAS las solicitudes (solo admin)
router.get('/all', requireUser, async (req, res) => {
  try {
    console.log('🔍 Admin solicitando todas las solicitudes...');
    console.log('Usuario:', req.user);
    
    // Verificar que sea admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
    }

    const { page = 1, limit = 50, status, certificateType, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(status && { status }),
      ...(certificateType && { certificateType }),
      ...(search && {
        OR: [
          { requestNumber: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
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
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          document: {
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

    console.log('✅ Solicitudes encontradas:', requests.length);

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
    console.error('❌ Error obteniendo todas las solicitudes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

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
          document: {
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
    console.log('🔍 BACKEND DEBUG - Datos recibidos:');
    console.log('Body:', req.body);
    console.log('File:', req.file ? {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    } : 'No file');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ BACKEND - Errores de validación:', errors.array());
      // Limpiar archivo subido si hay errores de validación
      await cleanupFile(req.file);
      return res.status(400).json({ 
        error: 'Datos inválidos', 
        details: errors.array() 
      });
    }

    // ✅ EXTRAER TODOS LOS CAMPOS DEL FRONTEND
    const { 
      certificateType, 
      firstName,
      lastName,
      email,
      phone,
      cedula,
      birthDate,
      address,
      reason, 
      additionalInfo,
      urgency = 'NORMAL' 
    } = req.body;

    console.log('✅ BACKEND - Campos extraídos:', {
      certificateType,
      firstName,
      lastName,
      email,
      phone,
      cedula,
      birthDate,
      address,
      reason,
      additionalInfo,
      urgency
    });

    // Verificar que se subió archivo
    if (!req.file) {
      return res.status(400).json({ 
        error: 'Se requiere adjuntar un documento' 
      });
    }

    // Generar número de solicitud único
    const requestNumber = `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Crear solicitud en transacción
    const result = await prisma.$transaction(async (tx) => {
      // ✅ CREAR LA SOLICITUD CON TODOS LOS CAMPOS
      const request = await tx.certificateRequest.create({
        data: {
          requestNumber,
          certificateType,
          // ✅ AGREGAR CAMPOS PERSONALES (verificar que existan en tu schema.prisma)
          firstName,
          lastName,
          email,
          phone,
          cedula,
          birthDate: new Date(birthDate),
          address,
          reason,
          additionalInfo: additionalInfo || null,
          urgency,
          status: 'RECIBIDO',
          userId: req.user.id
        }
      });

      // Crear documento asociado
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

    console.log('✅ BACKEND - Solicitud creada exitosamente:', result.request.id);

    res.status(201).json({
      message: 'Solicitud creada exitosamente',
      request: {
        ...result.request,
        document: {
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
    await cleanupFile(req.file);
    
    console.error('❌ BACKEND - Error creando solicitud:', error);
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
        document: {
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


router.get('/:id/download', requireUser, async (req, res) => {
  try {
    console.log('🔍 Iniciando descarga de certificado para ID:', req.params.id);
    
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
        },
        document: true
      }
    });

    if (!request) {
      console.log('❌ Solicitud no encontrada');
      return res.status(404).json({ 
        error: 'Solicitud no encontrada o certificado no disponible' 
      });
    }

    console.log('✅ Solicitud encontrada:', {
      id: request.id,
      status: request.status,
      user: request.user,
      hasDocument: !!request.document
    });

    console.log('🔍 Generando PDF...');
    const pdfBuffer = await generateCertificatePDF(request);
    console.log('✅ PDF generado, tamaño:', pdfBuffer.length, 'bytes');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificado-${request.requestNumber}.pdf"`);
    res.send(pdfBuffer);
    
    console.log('✅ PDF enviado al cliente');

  } catch (error) {
    console.error('❌ Error completo descargando certificado:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ error: 'Error generando certificado: ' + error.message });
  }
});

// DELETE /api/requests/:id - Cancelar solicitud
router.delete('/:id', requireUser, async (req, res) => {
  try {
    const request = await prisma.certificateRequest.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
        status: 'RECIBIDO'
      },
      include: {
        document: true
      }
    });

    if (!request) {
      return res.status(404).json({ 
        error: 'Solicitud no encontrada o no se puede cancelar' 
      });
    }

    // Eliminar archivo físico
    await cleanupFile(request.document);

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