const express = require('express');
const { param, query } = require('express-validator');
const { requireUser, requireAdmin } = require('../middlewares/auth');
const { validationResult } = require('express-validator');

// Importar PDFController con manejo de errores
let PDFController;
try {
  PDFController = require('../controllers/pdfController');
  
  // Verificar que las funciones existen
  const requiredMethods = ['downloadCertificate', 'checkCertificate', 'previewCertificate', 'regenerateCertificate', 'cleanupOldCertificates'];
  const missingMethods = requiredMethods.filter(method => !PDFController[method]);
  
  if (missingMethods.length > 0) {
    throw new Error(`Métodos faltantes en PDFController: ${missingMethods.join(', ')}`);
  }
  
  console.log('✅ PDFController cargado correctamente');
} catch (error) {
  console.error('❌ Error cargando PDFController:', error.message);
  
  // Funciones fallback
  PDFController = {
    downloadCertificate: (req, res) => {
      res.status(503).json({
        error: 'Servicio no disponible',
        message: 'La funcionalidad de certificados está temporalmente deshabilitada',
        details: 'PDFController no pudo cargar correctamente'
      });
    },
    checkCertificate: (req, res) => {
      res.status(503).json({
        error: 'Servicio no disponible',
        message: 'La verificación de certificados está temporalmente deshabilitada'
      });
    },
    previewCertificate: (req, res) => {
      res.status(503).json({
        error: 'Servicio no disponible',
        message: 'La vista previa de certificados está temporalmente deshabilitada'
      });
    },
    regenerateCertificate: (req, res) => {
      res.status(503).json({
        error: 'Servicio no disponible',
        message: 'La regeneración de certificados está temporalmente deshabilitada'
      });
    },
    cleanupOldCertificates: (req, res) => {
      res.status(503).json({
        error: 'Servicio no disponible',
        message: 'La limpieza de certificados está temporalmente deshabilitada'
      });
    }
  };
}

const router = express.Router();

// Validaciones
const idValidation = [
  param('id').isUUID().withMessage('ID de solicitud inválido')
];

const cleanupValidation = [
  query('olderThanDays')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Días debe ser entre 1 y 365')
];

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos inválidos',
      details: errors.array()
    });
  }
  next();
};

// ===== RUTAS PÚBLICAS PARA USUARIOS =====

// GET /api/certificates/:id/download - Descargar certificado
router.get('/:id/download', 
  requireUser, 
  idValidation, 
  handleValidationErrors,
  PDFController.downloadCertificate
);

// GET /api/certificates/:id/check - Verificar disponibilidad del certificado
router.get('/:id/check', 
  requireUser, 
  idValidation, 
  handleValidationErrors,
  PDFController.checkCertificate
);

// ===== RUTAS ADMINISTRATIVAS =====

// GET /api/certificates/:id/preview - Vista previa (solo admins)
router.get('/:id/preview', 
  requireAdmin, 
  idValidation, 
  handleValidationErrors,
  PDFController.previewCertificate
);

// POST /api/certificates/:id/regenerate - Regenerar certificado (solo admins)
router.post('/:id/regenerate', 
  requireAdmin, 
  idValidation, 
  handleValidationErrors,
  PDFController.regenerateCertificate
);

// DELETE /api/certificates/cleanup - Limpiar certificados antiguos (solo admins)
router.delete('/cleanup', 
  requireAdmin, 
  cleanupValidation, 
  handleValidationErrors,
  PDFController.cleanupOldCertificates
);

module.exports = router;