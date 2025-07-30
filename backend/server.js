const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Inicializaciones propias (DB, jobs, etc.)
require('./src/index');

// Importar rutas
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const requestRoutes = require('./src/routes/requestRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const pdfRoutes = require('./src/routes/pdfRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Seguridad
app.use(helmet());

// CORS (permitir Vite y opciones comunes de dev)
const devOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

// Orígenes de producción
const prodOrigins = [
  'https://docu-track-beta.vercel.app',  // Tu dominio de Vercel
  process.env.APP_URL,                   // Variable de entorno adicional si la tienes
  process.env.FRONTEND_URL,              // La que agregaste en Railway
].filter(Boolean); // Elimina valores undefined/null

// En producción usa prodOrigins, en desarrollo usa devOrigins
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? prodOrigins 
  : devOrigins;

console.log('🔗 CORS configurado para:', allowedOrigins);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
    corsOrigins: allowedOrigins, // Para debug
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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor DocuTrack corriendo en puerto ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API base: http://localhost:${PORT}/api`);
  console.log(`📈 Health:   http://localhost:${PORT}/api/health`);
  console.log(`🌐 CORS Origins:`, allowedOrigins);
});