// src/index.js - Solo inicializaciones, SIN servidor
require('dotenv').config();

// Aquí van las inicializaciones que necesites:
// - Conexión a base de datos (Prisma, MongoDB, etc.)
// - Configuración de jobs/cron
// - Configuración de servicios externos
// - Cache (Redis, etc.)
// - Websockets si los usas
// - Cualquier otra inicialización

console.log('✅ Inicializaciones de DocuTrack completadas');

// IMPORTANTE: NO crear servidor aquí
// IMPORTANTE: NO usar app.listen()
// El servidor se maneja completamente en server.js