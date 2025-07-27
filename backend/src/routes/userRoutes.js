const express = require('express');
const { body, query } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const UserController = require('../controllers/userController');

const router = express.Router();

// Middleware: todas las rutas requieren autenticación
router.use(authenticateToken);

// Validaciones
const updateProfileValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Número de teléfono inválido')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Contraseña actual requerida'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    })
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('El límite debe estar entre 1 y 50')
];

// GET /api/users/profile - Obtener perfil del usuario
router.get('/profile', UserController.getProfile);

// PUT /api/users/profile - Actualizar perfil del usuario
router.put('/profile', updateProfileValidation, validateRequest, UserController.updateProfile);

// GET /api/users/stats - Obtener estadísticas del usuario
router.get('/stats', UserController.getStats);

// GET /api/users/history - Obtener historial de solicitudes
router.get('/history', paginationValidation, validateRequest, UserController.getRequestHistory);

// POST /api/users/change-password - Cambiar contraseña
router.post('/change-password', changePasswordValidation, validateRequest, UserController.changePassword);

// GET /api/users/check-email - Verificar disponibilidad de email
router.get('/check-email', [
  query('email').isEmail().withMessage('Email inválido')
], validateRequest, UserController.checkEmailAvailability);

// POST /api/users/deactivate - Desactivar cuenta
router.post('/deactivate', [
  body('password').notEmpty().withMessage('Contraseña requerida para confirmar')
], validateRequest, UserController.deactivateAccount);

module.exports = router;