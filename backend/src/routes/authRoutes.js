const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');

const router = express.Router();
const prisma = new PrismaClient();

// Validaciones
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('firstName').trim().isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('El apellido debe tener al menos 2 caracteres'),
  body('phone').optional().isMobilePhone('any').withMessage('Número de teléfono inválido'),
  body('nationalId').trim().isLength({ min: 5 }).withMessage('Cédula debe tener al menos 5 caracteres')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Contraseña requerida')
];

// ✅ CORREGIDO: Generar JWT con estructura consistente
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role }, // ✅ Usar userId (no id) para consistencia con middleware
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// POST /api/auth/register - Registro de usuario
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Datos inválidos', 
        errors: errors.array() 
      });
    }

    const { email, password, firstName, lastName, phone, nationalId } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { nationalId }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: existingUser.email === email 
          ? 'El email ya está registrado' 
          : 'La cédula ya está registrada' 
      });
    }

    // Hashear contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        nationalId,
        role: 'USER'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        nationalId: true,
        phone: true,
        role: true,
        createdAt: true
      }
    });

    // Generar token
    const token = generateToken(user.id, user.role);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ CORREGIDO: POST /api/auth/login - Inicio de sesión
router.post('/login', loginValidation, async (req, res) => {
  try {
    console.log('📧 Intentando login con:', { email: req.body.email });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Errores de validación:', errors.array());
      return res.status(400).json({ 
        success: false,
        message: 'Datos inválidos', 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Buscar usuario
    console.log('🔍 Buscando usuario en BD...');
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return res.status(401).json({ 
        success: false,
        message: 'Credenciales inválidas' 
      });
    }

    console.log('✅ Usuario encontrado:', { id: user.id, email: user.email, isActive: user.isActive });

    // ✅ AGREGADO: Verificar si está activo
    if (!user.isActive) {
      console.log('❌ Usuario inactivo');
      return res.status(401).json({ 
        success: false,
        message: 'Cuenta desactivada. Contacta al administrador.' 
      });
    }

    // Verificar contraseña
    console.log('🔑 Verificando contraseña...');
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('❌ Contraseña incorrecta');
      return res.status(401).json({ 
        success: false,
        message: 'Credenciales inválidas' 
      });
    }

    console.log('✅ Contraseña correcta');

    // Generar token
    const token = generateToken(user.id, user.role);
    console.log('🎫 Token generado exitosamente');

    // ✅ CORREGIDO: Actualizar último login de forma segura
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });
      console.log('📅 LastLogin actualizado');
    } catch (updateError) {
      console.warn('⚠️ No se pudo actualizar lastLogin:', updateError.message);
      // Continúa sin fallar
    }

    console.log('🎉 Login exitoso para:', user.email);

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        token
      }
    });

  } catch (error) {
    console.error('💥 Error en login:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ CORREGIDO: POST /api/auth/verify - Verificar token
router.post('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Token requerido' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ✅ CORREGIDO: Usar decoded.userId (consistente con generateToken)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        nationalId: true,
        phone: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: 'Usuario no válido' 
      });
    }

    res.json({ 
      success: true,
      data: {
        valid: true, 
        user 
      }
    });

  } catch (error) {
    console.error('Error verificando token:', error);
    res.status(401).json({ 
      success: false,
      valid: false, 
      message: 'Token inválido' 
    });
  }
});

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Sesión cerrada exitosamente'
  });
});

module.exports = router;