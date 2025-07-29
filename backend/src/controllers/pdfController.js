const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs').promises;
const { generateCertificatePDF } = require('../utils/pdfGenerator');

const prisma = new PrismaClient();

class PDFController {
  // Generar y descargar certificado
  static async downloadCertificate(req, res) {
    try {
      const requestId = req.params.id;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Obtener la solicitud con validaciones
      const request = await prisma.certificateRequest.findFirst({
        where: {
          id: requestId,
          // Solo el dueño o un admin puede descargar
          ...(userRole !== 'ADMIN' && { userId }),
          // Solo si está emitido
          status: 'EMITIDO'
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nationalId: true,
              email: true,
              phone: true
            }
          },
          document: {
            select: {
              id: true,
              fileName: true,
              originalName: true,
              fileSize: true,
              mimeType: true
            }
          }
        }
      });

      if (!request) {
        return res.status(404).json({
          error: 'Certificado no encontrado o no disponible',
          details: 'La solicitud debe estar en estado EMITIDO y pertenecer al usuario'
        });
      }

      // Generar nombre del archivo
      const certificateFileName = `certificado-${request.requestNumber}.pdf`;
      const certificatePath = path.join(__dirname, '../../certificates', certificateFileName);

      let pdfBuffer;

      try {
        // Verificar si ya existe el certificado generado
        await fs.access(certificatePath);
        // Si existe, leerlo
        pdfBuffer = await fs.readFile(certificatePath);
        console.log(`Certificado existente recuperado: ${certificateFileName}`);
      } catch (error) {
        // Si no existe, generarlo
        console.log(`Generando nuevo certificado: ${certificateFileName}`);
        
        // Generar el PDF
        pdfBuffer = await generateCertificatePDF(request);
        
        // Guardar en la carpeta certificates para futuras descargas
        try {
          await fs.mkdir(path.dirname(certificatePath), { recursive: true });
          await fs.writeFile(certificatePath, pdfBuffer);
          console.log(`Certificado guardado en: ${certificatePath}`);
        } catch (saveError) {
          console.warn('No se pudo guardar el certificado:', saveError.message);
          // Continuar aunque no se pueda guardar
        }
      }

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${certificateFileName}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      // Enviar el PDF
      res.send(pdfBuffer);

      // Log de la descarga
      console.log(`Certificado descargado por usuario ${userId}: ${request.requestNumber}`);

    } catch (error) {
      console.error('Error generando/descargando certificado:', error);
      res.status(500).json({
        error: 'Error generando certificado',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Vista previa del certificado (solo para admins)
  static async previewCertificate(req, res) {
    try {
      const requestId = req.params.id;

      // Solo admins pueden hacer preview
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
          error: 'Acceso denegado',
          details: 'Solo los administradores pueden previsualizar certificados'
        });
      }

      const request = await prisma.certificateRequest.findUnique({
        where: { id: requestId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nationalId: true,
              email: true,
              phone: true
            }
          },
          document: {
            select: {
              id: true,
              fileName: true,
              originalName: true,
              fileSize: true,
              mimeType: true
            }
          }
        }
      });

      if (!request) {
        return res.status(404).json({
          error: 'Solicitud no encontrada'
        });
      }

      // Generar PDF para preview (sin guardar)
      const pdfBuffer = await generateCertificatePDF(request);

      // Configurar headers para mostrar en navegador
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="preview-${request.requestNumber}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Error generando preview:', error);
      res.status(500).json({
        error: 'Error generando preview',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Regenerar certificado (solo para admins)
  static async regenerateCertificate(req, res) {
    try {
      const requestId = req.params.id;

      // Solo admins pueden regenerar
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
          error: 'Acceso denegado',
          details: 'Solo los administradores pueden regenerar certificados'
        });
      }

      const request = await prisma.certificateRequest.findFirst({
        where: {
          id: requestId,
          status: 'EMITIDO'
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nationalId: true,
              email: true,
              phone: true
            }
          },
          document: {
            select: {
              id: true,
              fileName: true,
              originalName: true,
              fileSize: true,
              mimeType: true
            }
          }
        }
      });

      if (!request) {
        return res.status(404).json({
          error: 'Solicitud no encontrada o no está emitida'
        });
      }

      // Eliminar certificado existente si existe
      const certificateFileName = `certificado-${request.requestNumber}.pdf`;
      const certificatePath = path.join(__dirname, '../../certificates', certificateFileName);
      
      try {
        await fs.unlink(certificatePath);
        console.log(`Certificado anterior eliminado: ${certificateFileName}`);
      } catch (error) {
        // No importa si no existe
      }

      // Generar nuevo certificado
      const pdfBuffer = await generateCertificatePDF(request);
      
      // Guardar el nuevo certificado
      await fs.mkdir(path.dirname(certificatePath), { recursive: true });
      await fs.writeFile(certificatePath, pdfBuffer);

      res.json({
        success: true,
        message: 'Certificado regenerado exitosamente',
        data: {
          requestNumber: request.requestNumber,
          fileName: certificateFileName,
          regeneratedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error regenerando certificado:', error);
      res.status(500).json({
        error: 'Error regenerando certificado',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Verificar si existe certificado
  static async checkCertificate(req, res) {
    try {
      const requestId = req.params.id;
      const userId = req.user.id;
      const userRole = req.user.role;

      const request = await prisma.certificateRequest.findFirst({
        where: {
          id: requestId,
          ...(userRole !== 'ADMIN' && { userId }),
          status: 'EMITIDO'
        },
        select: {
          id: true,
          requestNumber: true,
          status: true,
          completedAt: true
        }
      });

      if (!request) {
        return res.status(404).json({
          error: 'Certificado no encontrado o no disponible'
        });
      }

      // Verificar si el archivo físico existe
      const certificateFileName = `certificado-${request.requestNumber}.pdf`;
      const certificatePath = path.join(__dirname, '../../certificates', certificateFileName);
      
      let fileExists = false;
      let fileSize = 0;
      
      try {
        const stats = await fs.stat(certificatePath);
        fileExists = true;
        fileSize = stats.size;
      } catch (error) {
        // Archivo no existe
      }

      res.json({
        success: true,
        data: {
          requestId: request.id,
          requestNumber: request.requestNumber,
          status: request.status,
          completedAt: request.completedAt,
          certificate: {
            exists: fileExists,
            fileName: certificateFileName,
            fileSize,
            downloadUrl: `/api/certificates/${request.id}/download`
          }
        }
      });

    } catch (error) {
      console.error('Error verificando certificado:', error);
      res.status(500).json({
        error: 'Error verificando certificado',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Limpiar certificados antiguos (tarea de mantenimiento)
  static async cleanupOldCertificates(req, res) {
    try {
      // Solo admins pueden ejecutar limpieza
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
          error: 'Acceso denegado'
        });
      }

      const { olderThanDays = 30 } = req.query;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThanDays));

      // Obtener solicitudes antiguas
      const oldRequests = await prisma.certificateRequest.findMany({
        where: {
          status: 'EMITIDO',
          completedAt: {
            lt: cutoffDate
          }
        },
        select: {
          requestNumber: true,
          completedAt: true
        }
      });

      const certificatesDir = path.join(__dirname, '../../certificates');
      let deletedCount = 0;
      let errors = [];

      for (const request of oldRequests) {
        const certificateFileName = `certificado-${request.requestNumber}.pdf`;
        const certificatePath = path.join(certificatesDir, certificateFileName);
        
        try {
          await fs.unlink(certificatePath);
          deletedCount++;
        } catch (error) {
          if (error.code !== 'ENOENT') { // Ignorar si no existe
            errors.push({
              file: certificateFileName,
              error: error.message
            });
          }
        }
      }

      res.json({
        success: true,
        message: 'Limpieza completada',
        data: {
          totalOldRequests: oldRequests.length,
          deletedCertificates: deletedCount,
          errors: errors.length > 0 ? errors : undefined,
          cutoffDate: cutoffDate.toISOString()
        }
      });

    } catch (error) {
      console.error('Error en limpieza:', error);
      res.status(500).json({
        error: 'Error en limpieza de certificados',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = PDFController;