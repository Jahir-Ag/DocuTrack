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

// Generar JWT
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
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
        role: 'USER' // Por defecto todos son usuarios
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
      message: 'Error interno del servidor' 
    });
  }
});

// POST /api/auth/login - Inicio de sesión
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Datos inválidos', 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Credenciales inválidas' 
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        message: 'Credenciales inválidas' 
      });
    }

    // Generar token
    const token = generateToken(user.id, user.role);

    // Actualizar último login (opcional - solo si tienes el campo en tu modelo)
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });
    } catch (error) {
      // Si no existe el campo lastLogin, simplemente continúa
      console.warn('Campo lastLogin no existe en el modelo User');
    }

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
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
});

// POST /api/auth/verify - Verificar token
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
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        nationalId: true,
        phone: true,
        role: true
      }
    });

    if (!user) {
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
    res.status(401).json({ 
      success: false,
      valid: false, 
      message: 'Token inválido' 
    });
  }
});

// POST /api/auth/logout - Cerrar sesión (opcional - para invalidar token del lado del cliente)
router.post('/logout', (req, res) => {
  // En JWT stateless, el logout se maneja del lado del cliente eliminando el token
  res.json({
    success: true,
    message: 'Sesión cerrada exitosamente'
  });
});

module.exports = router;