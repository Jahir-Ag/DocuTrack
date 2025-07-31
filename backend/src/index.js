require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Inicializar Prisma
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Función para conectar a la base de datos
async function initializeDatabase() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    
    // Probar la conexión
    await prisma.$connect();
    console.log('✅ Base de datos conectada exitosamente');
    
    // Opcional: hacer una query de prueba
    const userCount = await prisma.user.count();
    console.log(`📊 Usuarios en BD: ${userCount}`);
    
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    console.error('🔍 DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'NO CONFIGURADA');
    throw error;
  }
}

// Inicializar todo
async function initialize() {
  try {
    await initializeDatabase();
    console.log('✅ Inicializaciones de DocuTrack completadas');
  } catch (error) {
    console.error('💥 Error en inicializaciones:', error);
    process.exit(1); // Fallar el deploy si no puede conectar a BD
  }
}

// Ejecutar inicializaciones
initialize();

// Exportar prisma para uso en otras partes
module.exports = { prisma };