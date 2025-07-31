const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
   process.env.FRONTEND_URL || 'https://docu-track-beta.vercel.app'
];

/*
const allowedOrigins = [
  'https://docu-track-beta.vercel.app',
  'https://docutrack-production.up.railway.app'
]; */

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origen no permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Importar rutas
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const requestRoutes = require('./src/routes/requestRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const pdfRoutes = require('./src/routes/pdfRoutes');

// Seguridad
app.use(helmet());

// Morgan para logs
app.use(morgan('combined'));

// CORS simplificado y limpio

console.log('🔗 CORS configurado para:', allowedOrigins);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.' },
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Archivos estáticos (subidas)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas con prefijo /api
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/certificates', pdfRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    message: 'DocuTrack API funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    corsOrigins: allowedOrigins,
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ 
    message: 'DocuTrack API funcionando correctamente',
    version: '1.0.0',
    docs: '/api/health'
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error stack:', err.stack);
  
  // Multer
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'Archivo demasiado grande',
      details: 'El archivo debe ser menor a 5MB',
    });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Demasiados archivos',
      details: 'Máximo 5 archivos permitidos',
    });
  }
  
  // Prisma
  if (err.code === 'P2002') {
    return res.status(400).json({
      error: 'Datos duplicados',
      details: 'Ya existe un registro con esos datos',
    });
  }
  
  // Genérico
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal',
  });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
  });
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT recibido, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

// Inicializaciones propias (DB, jobs, etc.) - SIN servidor
require('./src/index');

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor DocuTrack corriendo en puerto ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API base: http://0.0.0.0:${PORT}/api`);
  console.log(`📈 Health:   http://0.0.0.0:${PORT}/api/health`);
  console.log(`🌐 CORS Origins:`, allowedOrigins);
});

server.on('error', (err) => {
  console.error('❌ Error al iniciar servidor:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Puerto ${PORT} ya está en uso. Cerrando proceso...`);
    process.exit(1);
  }
});