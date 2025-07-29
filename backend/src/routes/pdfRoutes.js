const express = require('express');
const { param, query } = require('express-validator');
const { requireUser, requireAdmin } = require('../middlewares/auth');
const { validationResult } = require('express-validator');
const PDFController = require('../controllers/pdfController');

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