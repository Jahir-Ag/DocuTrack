require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

// Inicializar Express y Prisma
const app = express();
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Middlewares
app.use(cors({
  origin: 'https://docu-track-beta.vercel.app', // o '*' en desarrollo
  credentials: true,
}));
app.use(express.json());

// Conexión a la base de datos
async function initializeDatabase() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await prisma.$connect();
    console.log('✅ Base de datos conectada exitosamente');

    const userCount = await prisma.user.count();
    console.log(`📊 Usuarios en BD: ${userCount}`);
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    throw error;
  }
}

// Rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const requestRoutes = require('./routes/requestRoutes');
const pdfRoutes = require('./routes/pdfRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/pdf', pdfRoutes);

// Inicialización completa y servidor
async function startServer() {
  try {
    await initializeDatabase();
    
  } catch (error) {
    console.error('💥 Error en inicializaciones:', error);
    process.exit(1);
  }
}


startServer();

// Exportar Prisma
module.exports = { prisma };
