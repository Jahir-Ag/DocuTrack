const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  try {
    // Limpiar datos existentes (opcional - comentar en producción)
    console.log('🧹 Limpiando datos existentes...');
    await prisma.statusHistory.deleteMany();
    await prisma.document.deleteMany();
    await prisma.certificateRequest.deleteMany();
    await prisma.user.deleteMany();

    // 1. Crear usuario administrador por defecto
    console.log('👤 Creando usuario administrador...');
    const adminPassword = await bcrypt.hash('admin123456', 12);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@docutrack.gob.pa',
        password: adminPassword,
        firstName: 'Administrador',
        lastName: 'del Sistema',
        nationalId: 'ADM-00000001',
        phone: '+507-6000-0000',
        role: 'ADMIN',
        isActive: true,
        emailVerified: true
      }
    });

    console.log(`✅ Administrador creado: ${admin.email}`);

    // 2. Crear usuario de prueba
    console.log('👥 Creando usuarios de prueba...');
    const userPassword = await bcrypt.hash('user123456', 12);
    
    const testUsers = await Promise.all([
      prisma.user.create({
        data: {
          email: 'juan.perez@email.com',
          password: userPassword,
          firstName: 'Juan Carlos',
          lastName: 'Pérez González',
          nationalId: '8-123-456',
          phone: '+507-6234-5678',
          role: 'USER',
          isActive: true,
          emailVerified: true
        }
      }),
      prisma.user.create({
        data: {
          email: 'maria.rodriguez@email.com',
          password: userPassword,
          firstName: 'María Elena',
          lastName: 'Rodríguez López',
          nationalId: '9-987-654',
          phone: '+507-6876-5432',
          role: 'USER',
          isActive: true,
          emailVerified: true
        }
      }),
      prisma.user.create({
        data: {
          email: 'carlos.mendoza@email.com',
          password: userPassword,
          firstName: 'Carlos Alberto',
          lastName: 'Mendoza Silva',
          nationalId: '4-567-890',
          phone: '+507-6345-6789',
          role: 'USER',
          isActive: true,
          emailVerified: false // Para probar diferentes estados
        }
      })
    ]);

    console.log(`✅ ${testUsers.length} usuarios de prueba creados`);

    // 3. Crear solicitudes de ejemplo
    console.log('📄 Creando solicitudes de ejemplo...');
    
    const sampleRequests = [
      {
        userId: testUsers[0].id,
        certificateType: 'NACIMIENTO',
        reason: 'Necesito el certificado de nacimiento para tramitar mi pasaporte y poder viajar al exterior por motivos laborales.',
        urgency: 'NORMAL',
        status: 'EMITIDO'
      },
      {
        userId: testUsers[0].id,
        certificateType: 'ANTECEDENTES',
        reason: 'Solicito certificado de antecedentes penales para proceso de contratación en nueva empresa.',
        urgency: 'URGENTE',
        status: 'EN_VALIDACION'
      },
      {
        userId: testUsers[1].id,
        certificateType: 'ESTUDIOS',
        reason: 'Requiero certificado de estudios para continuar con mi maestría en el extranjero.',
        urgency: 'NORMAL',
        status: 'APROBADO'
      },
      {
        userId: testUsers[1].id,
        certificateType: 'RESIDENCIA',
        reason: 'Necesito comprobar mi residencia actual para trámites bancarios y apertura de cuenta.',
        urgency: 'NORMAL',
        status: 'RECIBIDO'
      },
      {
        userId: testUsers[2].id,
        certificateType: 'NACIMIENTO',
        reason: 'Certificado de nacimiento requerido para inscripción de mi hijo en el colegio.',
        urgency: 'URGENTE',
        status: 'OBSERVADO'
      },
      {
        userId: testUsers[2].id,
        certificateType: 'ANTECEDENTES',
        reason: 'Certificado de antecedentes para visa de trabajo en Estados Unidos.',
        urgency: 'NORMAL',
        status: 'RECHAZADO'
      }
    ];

    const createdRequests = [];
    
    for (let i = 0; i < sampleRequests.length; i++) {
      const requestData = sampleRequests[i];
      const requestNumber = `DOC-${Date.now() + i}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      
      // Calcular fechas realistas
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30)); // Últimos 30 días
      
      const processedAt = requestData.status !== 'RECIBIDO' && requestData.status !== 'RECHAZADO' 
        ? new Date(createdAt.getTime() + (Math.random() * 5 * 24 * 60 * 60 * 1000)) // 1-5 días después
        : null;
      
      const completedAt = requestData.status === 'EMITIDO' 
        ? new Date(processedAt.getTime() + (Math.random() * 2 * 24 * 60 * 60 * 1000)) // 1-2 días después
        : null;

      const request = await prisma.certificateRequest.create({
        data: {
          requestNumber,
          certificateType: requestData.certificateType,
          reason: requestData.reason,
          urgency: requestData.urgency,
          status: requestData.status,
          userId: requestData.userId,
          createdAt,
          updatedAt: processedAt || createdAt,
          processedAt,
          completedAt
        }
      });

      createdRequests.push(request);

      // Crear historial de estados para cada solicitud
      const statusFlow = getStatusFlow(requestData.status);
      
      for (let j = 0; j < statusFlow.length; j++) {
        const statusChange = statusFlow[j];
        const changeDate = new Date(createdAt.getTime() + (j * 24 * 60 * 60 * 1000)); // Un día entre cada cambio
        
        await prisma.statusHistory.create({
          data: {
            requestId: request.id,
            oldStatus: statusChange.from,
            newStatus: statusChange.to,
            comment: statusChange.comment,
            changedById: statusChange.to === 'RECIBIDO' ? requestData.userId : admin.id,
            createdAt: changeDate
          }
        });
      }
    }

    console.log(`✅ ${createdRequests.length} solicitudes de ejemplo creadas`);

    // 4. Crear algunos documentos simulados (solo registros en BD, sin archivos físicos)
    console.log('📎 Creando registros de documentos...');
    
    for (const request of createdRequests) {
      const numDocs = Math.floor(Math.random() * 3) + 1; // 1-3 documentos por solicitud
      
      for (let i = 0; i < numDocs; i++) {
        await prisma.document.create({
          data: {
            fileName: `doc_${request.id}_${i + 1}_${Date.now()}.pdf`,
            originalName: `documento_${i + 1}.pdf`,
            filePath: `/uploads/documents/sample_doc_${request.id}_${i + 1}.pdf`,
            fileSize: Math.floor(Math.random() * 2000000) + 100000, // 100KB - 2MB
            mimeType: 'application/pdf',
            requestId: request.id
          }
        });
      }
    }

    // 5. Estadísticas finales
    console.log('\n📊 Estadísticas de la base de datos:');
    
    const stats = {
      usuarios: await prisma.user.count(),
      administradores: await prisma.user.count({ where: { role: 'ADMIN' } }),
      usuariosRegulares: await prisma.user.count({ where: { role: 'USER' } }),
      solicitudes: await prisma.certificateRequest.count(),
      documentos: await prisma.document.count(),
      cambiosEstado: await prisma.statusHistory.count()
    };

    Object.entries(stats).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    console.log('\n🎉 Seed completado exitosamente!');
    console.log('\n📋 Credenciales de acceso:');
    console.log('  🔧 Administrador:');
    console.log('    Email: admin@docutrack.gob.pa');
    console.log('    Password: admin123456');
    console.log('  👤 Usuario de prueba:');
    console.log('    Email: juan.perez@email.com');
    console.log('    Password: user123456');
    console.log('  👤 Usuario de prueba 2:');
    console.log('    Email: maria.rodriguez@email.com');
    console.log('    Password: user123456');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  }
}

// Función auxiliar para generar flujo de estados
function getStatusFlow(finalStatus) {
  const flows = {
    'RECIBIDO': [
      { from: 'RECIBIDO', to: 'RECIBIDO', comment: 'Solicitud recibida en el sistema' }
    ],
    'EN_VALIDACION': [
      { from: 'RECIBIDO', to: 'RECIBIDO', comment: 'Solicitud recibida en el sistema' },
      { from: 'RECIBIDO', to: 'EN_VALIDACION', comment: 'Iniciando proceso de validación de documentos' }
    ],
    'OBSERVADO': [
      { from: 'RECIBIDO', to: 'RECIBIDO', comment: 'Solicitud recibida en el sistema' },
      { from: 'RECIBIDO', to: 'EN_VALIDACION', comment: 'Iniciando proceso de validación' },
      { from: 'EN_VALIDACION', to: 'OBSERVADO', comment: 'Se requiere documentación adicional o correcciones' }
    ],
    'APROBADO': [
      { from: 'RECIBIDO', to: 'RECIBIDO', comment: 'Solicitud recibida en el sistema' },
      { from: 'RECIBIDO', to: 'EN_VALIDACION', comment: 'Validando documentos presentados' },
      { from: 'EN_VALIDACION', to: 'APROBADO', comment: 'Documentos validados correctamente. Solicitud aprobada' }
    ],
    'EMITIDO': [
      { from: 'RECIBIDO', to: 'RECIBIDO', comment: 'Solicitud recibida en el sistema' },
      { from: 'RECIBIDO', to: 'EN_VALIDACION', comment: 'Revisando documentación' },
      { from: 'EN_VALIDACION', to: 'APROBADO', comment: 'Documentos aprobados' },
      { from: 'APROBADO', to: 'EMITIDO', comment: 'Certificado generado y disponible para descarga' }
    ],
    'RECHAZADO': [
      { from: 'RECIBIDO', to: 'RECIBIDO', comment: 'Solicitud recibida en el sistema' },
      { from: 'RECIBIDO', to: 'EN_VALIDACION', comment: 'Revisando solicitud' },
      { from: 'EN_VALIDACION', to: 'RECHAZADO', comment: 'Solicitud rechazada por documentación insuficiente' }
    ]
  };

  return flows[finalStatus] || [
    { from: 'RECIBIDO', to: 'RECIBIDO', comment: 'Solicitud recibida en el sistema' }
  ];
}

main()
  .catch((e) => {
    console.error('❌ Error fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });