const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class PDFGenerator {
  // Generar certificado en PDF
  static async generateCertificatePDF(request) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Certificado ${request.certificateType}`,
            Author: 'DocuTrack - Sistema de Gestión de Trámites',
            Subject: `Certificado ${request.certificateType} - ${request.requestNumber}`,
            Creator: 'DocuTrack',
            Producer: 'DocuTrack PDF Generator'
          }
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });
        doc.on('error', reject);

        // Configurar fuentes y colores
        const primaryColor = '#2563eb';
        const secondaryColor = '#64748b';
        const accentColor = '#059669';
        const warningColor = '#dc2626';

        // Header del documento
        this.addHeader(doc, primaryColor);

        // Título principal
        this.addTitle(doc, request.certificateType, primaryColor);

        // Información del certificado
        this.addCertificateInfo(doc, request, primaryColor, secondaryColor);

        // Información del solicitante
        this.addUserInfo(doc, request.user, secondaryColor);

        // Detalles de la solicitud
        this.addRequestDetails(doc, request, secondaryColor, accentColor);

        // Validación y firma digital
        this.addValidationSection(doc, request, primaryColor, secondaryColor);

        // Footer
        this.addFooter(doc, request, secondaryColor);

        // Marca de agua de seguridad
        this.addWatermark(doc);

        // Código QR de verificación (simulado con texto)
        this.addQRSection(doc, request, primaryColor);

        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  // Header del documento mejorado
  static addHeader(doc, primaryColor) {
    const pageCenter = doc.page.width / 2;
    
    // Rectángulo de header con degradado simulado
    doc.rect(50, 30, doc.page.width - 100, 100)
       .fillColor('#f8fafc')
       .fill()
       .strokeColor(primaryColor)
       .lineWidth(2)
       .stroke();
    
    // Logo o escudo (simulado con texto estilizado)
    doc.fontSize(24)
       .fillColor(primaryColor)
       .font('Helvetica-Bold')
       .text('🏛️', pageCenter - 15, 45);
    
    // Título institucional
    doc.fontSize(18)
       .fillColor(primaryColor)
       .font('Helvetica-Bold')
       .text('REPÚBLICA DE PANAMÁ', pageCenter - 90, 65, { width: 180, align: 'center' });
    
    doc.fontSize(14)
       .fillColor('#1f2937')
       .font('Helvetica')
       .text('MINISTERIO DE GOBIERNO', pageCenter - 90, 85, { width: 180, align: 'center' });
    
    doc.fontSize(10)
       .fillColor('#6b7280')
       .text('Sistema DocuTrack - Gestión Digital de Trámites', pageCenter - 90, 105, { width: 180, align: 'center' });

    // Fecha y hora de generación
    doc.fontSize(8)
       .fillColor('#9ca3af')
       .text(`Generado: ${new Date().toLocaleString('es-ES')}`, doc.page.width - 200, 40);
  }

  // Título del certificado mejorado
  static addTitle(doc, certificateType, primaryColor) {
    const titles = {
      'NACIMIENTO': 'CERTIFICADO DE NACIMIENTO',
      'ESTUDIOS': 'CERTIFICADO DE ESTUDIOS',
      'RESIDENCIA': 'CERTIFICADO DE RESIDENCIA',
      'ANTECEDENTES': 'CERTIFICADO DE ANTECEDENTES PENALES'
    };

    const title = titles[certificateType] || 'CERTIFICADO OFICIAL';

    // Rectángulo decorativo para el título
    doc.rect(50, 150, doc.page.width - 100, 50)
       .fillColor('#eff6ff')
       .fill()
       .strokeColor(primaryColor)
       .lineWidth(1)
       .stroke();

    // Título principal
    doc.fontSize(20)
       .fillColor(primaryColor)
       .font('Helvetica-Bold')
       .text(title, 50, 170, {
         width: doc.page.width - 100,
         align: 'center'
       });

    // Subtítulo decorativo
    doc.fontSize(10)
       .fillColor('#6b7280')
       .font('Helvetica')
       .text('Documento Oficial con Validez Legal', 50, 190, {
         width: doc.page.width - 100,
         align: 'center'
       });
  }

  // Información del certificado mejorada
  static addCertificateInfo(doc, request, primaryColor, secondaryColor) {
    const currentY = 230;
    
    // Título de sección
    doc.fontSize(12)
       .fillColor('#1f2937')
       .font('Helvetica-Bold')
       .text('INFORMACIÓN DEL CERTIFICADO', 50, currentY);

    // Línea decorativa
    doc.moveTo(50, currentY + 15)
       .lineTo(250, currentY + 15)
       .strokeColor(primaryColor)
       .lineWidth(1)
       .stroke();
    
    // Grid de información
    const infoY = currentY + 25;
    
    // Número de certificado
    doc.fontSize(10)
       .fillColor(secondaryColor)
       .font('Helvetica')
       .text('N° Certificado:', 50, infoY);
    
    doc.fontSize(11)
       .fillColor(primaryColor)
       .font('Helvetica-Bold')
       .text(request.requestNumber, 150, infoY);

    // Fecha de emisión
    doc.fontSize(10)
       .fillColor(secondaryColor)
       .font('Helvetica')
       .text('Fecha Emisión:', 300, infoY);
    
    const emissionDate = request.completedAt || request.updatedAt || new Date();
    doc.fontSize(11)
       .fillColor(primaryColor)
       .font('Helvetica-Bold')
       .text(new Date(emissionDate).toLocaleDateString('es-ES'), 380, infoY);

    // Fecha de solicitud
    doc.fontSize(10)
       .fillColor(secondaryColor)
       .font('Helvetica')
       .text('Fecha Solicitud:', 50, infoY + 20);
    
    doc.fontSize(11)
       .fillColor('#1f2937')
       .font('Helvetica')
       .text(new Date(request.createdAt).toLocaleDateString('es-ES'), 150, infoY + 20);

    // Estado
    doc.fontSize(10)
       .fillColor(secondaryColor)
       .font('Helvetica')
       .text('Estado:', 300, infoY + 20);
    
    doc.fontSize(11)
       .fillColor('#059669')
       .font('Helvetica-Bold')
       .text('EMITIDO ✓', 380, infoY + 20);
  }

  // Información del solicitante mejorada
  static addUserInfo(doc, user, secondaryColor) {
    const currentY = 310;
    
    // Título de sección
    doc.fontSize(12)
       .fillColor('#1f2937')
       .font('Helvetica-Bold')
       .text('DATOS DEL SOLICITANTE', 50, currentY);

    // Línea decorativa
    doc.moveTo(50, currentY + 15)
       .lineTo(220, currentY + 15)
       .strokeColor('#059669')
       .lineWidth(1)
       .stroke();

    // Rectángulo de fondo con bordes redondeados (simulado)
    doc.rect(50, currentY + 25, doc.page.width - 100, 120)
       .fillColor('#f9fafb')
       .fill()
       .strokeColor('#e5e7eb')
       .lineWidth(1)
       .stroke();

    // Información personal en grid
    const userY = currentY + 40;
    
    // Nombre completo
    doc.fontSize(10)
       .fillColor(secondaryColor)
       .font('Helvetica')
       .text('Nombre Completo:', 60, userY);
    
    doc.fontSize(12)
       .fillColor('#1f2937')
       .font('Helvetica-Bold')
       .text(`${user.firstName} ${user.lastName}`, 170, userY);

    // Cédula
    doc.fontSize(10)
       .fillColor(secondaryColor)
       .font('Helvetica')
       .text('Cédula de Identidad:', 60, userY + 25);
    
    doc.fontSize(12)
       .fillColor('#1f2937')
       .font('Helvetica-Bold')
       .text(user.nationalId, 170, userY + 25);

    // Email
    doc.fontSize(10)
       .fillColor(secondaryColor)
       .font('Helvetica')
       .text('Correo Electrónico:', 60, userY + 50);
    
    doc.fontSize(10)
       .fillColor('#1f2937')
       .font('Helvetica')
       .text(user.email, 170, userY + 50);

    // Teléfono
    doc.fontSize(10)
       .fillColor(secondaryColor)
       .font('Helvetica')
       .text('Teléfono:', 60, userY + 75);
    
    doc.fontSize(10)
       .fillColor('#1f2937')
       .font('Helvetica')
       .text(user.phone || 'No proporcionado', 170, userY + 75);

    // Icono decorativo
    doc.fontSize(16)
       .fillColor('#d1d5db')
       .text('👤', doc.page.width - 90, userY + 30);
  }

  // Detalles de la solicitud mejorados
  static addRequestDetails(doc, request, secondaryColor, accentColor) {
    const currentY = 480;
    
    // Título de sección
    doc.fontSize(12)
       .fillColor('#1f2937')
       .font('Helvetica-Bold')
       .text('DETALLES DE LA SOLICITUD', 50, currentY);

    // Línea decorativa
    doc.moveTo(50, currentY + 15)
       .lineTo(240, currentY + 15)
       .strokeColor(accentColor)
       .lineWidth(1)
       .stroke();

    // Motivo de la solicitud
    doc.fontSize(10)
       .fillColor(secondaryColor)
       .font('Helvetica')
       .text('Motivo de la solicitud:', 50, currentY + 30);
    
    // Rectángulo para el motivo
    doc.rect(50, currentY + 45, doc.page.width - 100, 60)
       .fillColor('#fafafa')
       .fill()
       .strokeColor('#e5e7eb')
       .lineWidth(1)
       .stroke();
    
    doc.fontSize(10)
       .fillColor('#1f2937')
       .font('Helvetica')
       .text(request.reason, 60, currentY + 55, {
         width: doc.page.width - 120,
         align: 'justify',
         lineGap: 2
       });

    // Tipo de procesamiento
    const urgencyY = currentY + 115;
    doc.fontSize(10)
       .fillColor(secondaryColor)
       .font('Helvetica')
       .text('Tipo de procesamiento:', 50, urgencyY);
    
    const isUrgent = request.urgency === 'URGENTE';
    const urgencyColor = isUrgent ? '#dc2626' : accentColor;
    const urgencyText = isUrgent ? '⚡ PROCESAMIENTO URGENTE' : '📋 PROCESAMIENTO NORMAL';
    
    doc.fontSize(11)
       .fillColor(urgencyColor)
       .font('Helvetica-Bold')
       .text(urgencyText, 200, urgencyY);

    // Documento adjunto (si existe)
    if (request.document) {
      doc.fontSize(10)
         .fillColor(secondaryColor)
         .font('Helvetica')
         .text('Documento adjunto:', 50, urgencyY + 20);
      
      doc.fontSize(10)
         .fillColor('#1f2937')
         .font('Helvetica')
         .text(`📎 ${request.document.originalName}`, 170, urgencyY + 20);
    }
  }

  // Sección de validación mejorada
  static addValidationSection(doc, request, primaryColor, secondaryColor) {
    const currentY = 640;
    
    // Rectángulo de validación con estilo premium
    doc.rect(50, currentY, doc.page.width - 100, 90)
       .fillColor('#fef3c7')
       .fill()
       .strokeColor('#f59e0b')
       .lineWidth(2)
       .stroke();

    // Icono de validación
    doc.fontSize(20)
       .fillColor('#f59e0b')
       .text('🔐', 60, currentY + 15);

    // Título de validación
    doc.fontSize(12)
       .fillColor('#92400e')
       .font('Helvetica-Bold')
       .text('VALIDACIÓN OFICIAL Y SEGURIDAD', 90, currentY + 15);

    // Textos de validación
    doc.fontSize(9)
       .fillColor('#78350f')
       .font('Helvetica')
       .text('Este certificado ha sido generado digitalmente por el Sistema DocuTrack del', 60, currentY + 35);
    
    doc.text('Ministerio de Gobierno de la República de Panamá, y cuenta con plena validez', 60, currentY + 48);
    
    doc.text('legal según las normativas vigentes. Su autenticidad puede ser verificada', 60, currentY + 61);

    // Código de verificación
    const verificationCode = this.generateVerificationCode(request);
    doc.fontSize(10)
       .fillColor('#92400e')
       .font('Helvetica-Bold')
       .text(`Código de Verificación: ${verificationCode}`, 200, currentY + 75);
  }

  // Sección QR de verificación
  static addQRSection(doc, request, primaryColor) {
    const qrY = 750;
    
    // Simulación de QR con texto
    doc.rect(doc.page.width - 120, qrY, 60, 60)
       .fillColor('#ffffff')
       .fill()
       .strokeColor(primaryColor)
       .lineWidth(1)
       .stroke();
    
    doc.fontSize(8)
       .fillColor(primaryColor)
       .font('Helvetica-Bold')
       .text('QR CODE', doc.page.width - 110, qrY + 25, { width: 40, align: 'center' });
    
    doc.fontSize(6)
       .fillColor('#6b7280')
       .font('Helvetica')
       .text('Escanear para', doc.page.width - 115, qrY + 35, { width: 50, align: 'center' });
    
    doc.text('verificar', doc.page.width - 115, qrY + 42, { width: 50, align: 'center' });

    // URL de verificación
    doc.fontSize(8)
       .fillColor('#6b7280')
       .font('Helvetica')
       .text('Verificar en:', 50, qrY + 10);
    
    doc.fontSize(8)
       .fillColor(primaryColor)
       .font('Helvetica')
       .text('https://docutrack.gob.pa/verificar', 50, qrY + 25);
  }

  // Footer del documento mejorado
  static addFooter(doc, request, secondaryColor) {
    const footerY = doc.page.height - 60;
    
    // Línea superior decorativa
    doc.moveTo(50, footerY - 10)
       .lineTo(doc.page.width - 50, footerY - 10)
       .strokeColor('#e5e7eb')
       .lineWidth(1)
       .stroke();

    // Información del footer
    doc.fontSize(7)
       .fillColor(secondaryColor)
       .font('Helvetica')
       .text('Este documento fue generado automáticamente por el Sistema DocuTrack', 50, footerY, {
         width: doc.page.width - 100,
         align: 'center'
       });

    doc.fontSize(7)
       .text('Ministerio de Gobierno - República de Panamá', 50, footerY + 12, {
         width: doc.page.width - 100,
         align: 'center'
       });

    doc.fontSize(7)
       .fillColor('#9ca3af')
       .text('Para verificar autenticidad: www.docutrack.gob.pa/verificar', 50, footerY + 24, {
         width: doc.page.width - 100,
         align: 'center'
       });

    // Número de página y timestamp
    doc.fontSize(6)
       .fillColor('#d1d5db')
       .text('Página 1 de 1', 50, footerY + 40);
    
    doc.fontSize(6)
       .text(`ID: ${request.id}`, doc.page.width - 150, footerY + 40);
  }

  // Marca de agua de seguridad mejorada
  static addWatermark(doc) {
    // Guardar estado actual
    doc.save();
    
    // Configurar transparencia
    doc.fillOpacity(0.08);
    
    // Agregar múltiples marcas de agua
    doc.fontSize(50)
       .fillColor('#2563eb')
       .font('Helvetica-Bold');
    
    // Marca de agua principal (diagonal)
    doc.rotate(-45, { origin: [doc.page.width / 2, doc.page.height / 2] });
    doc.text('DOCUTRACK', doc.page.width / 2 - 120, doc.page.height / 2 - 25);
    
    // Restaurar y agregar marca secundaria
    doc.restore();
    doc.save();
    doc.fillOpacity(0.05);
    
    // Marca de agua secundaria
    doc.rotate(45, { origin: [doc.page.width / 4, doc.page.height * 3 / 4] });
    doc.fontSize(30)
       .text('OFICIAL', doc.page.width / 4 - 50, doc.page.height * 3 / 4 - 15);
    
    // Restaurar estado
    doc.restore();
  }

  // Generar código de verificación único mejorado
  static generateVerificationCode(request) {
    const completedDate = request.completedAt || request.updatedAt || new Date();
    const timestamp = new Date(completedDate).getTime();
    const hash = crypto
      .createHash('sha256')
      .update(`${request.id}-${request.requestNumber}-${timestamp}-DOCUTRACK`)
      .digest('hex')
      .substring(0, 12)
      .toUpperCase();
    
    // Formatear en grupos de 4
    return `${hash.substring(0, 4)}-${hash.substring(4, 8)}-${hash.substring(8, 12)}`;
  }

  // Generar reporte de solicitudes para admin (mejorado)
  static async generateRequestsReport(requests, filters = {}) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 30,
          info: {
            Title: 'Reporte de Solicitudes - DocuTrack',
            Author: 'DocuTrack - Sistema de Gestión de Trámites',
            Subject: 'Reporte administrativo de solicitudes',
            Creator: 'DocuTrack'
          }
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });
        doc.on('error', reject);

        // Header del reporte
        doc.fontSize(18)
           .fillColor('#2563eb')
           .font('Helvetica-Bold')
           .text('📊 REPORTE DE SOLICITUDES', 30, 30);

        doc.fontSize(12)
           .fillColor('#64748b')
           .font('Helvetica')
           .text(`Generado: ${new Date().toLocaleString('es-ES')}`, 30, 55);

        // Estadísticas rápidas
        const stats = this.calculateReportStats(requests);
        let currentY = 80;

        doc.fontSize(10)
           .fillColor('#1f2937')
           .font('Helvetica-Bold')
           .text(`Total: ${stats.total} | Emitidos: ${stats.emitidos} | Pendientes: ${stats.pendientes}`, 30, currentY);

        currentY += 25;

        // Filtros aplicados
        if (Object.keys(filters).length > 0) {
          doc.fontSize(10)
             .fillColor('#6b7280')
             .font('Helvetica')
             .text('Filtros aplicados:', 30, currentY);
          
          currentY += 15;
          Object.entries(filters).forEach(([key, value]) => {
            if (value) {
              doc.fontSize(9).text(`• ${key}: ${value}`, 40, currentY);
              currentY += 12;
            }
          });
          currentY += 10;
        }

        // Headers de tabla
        doc.fontSize(8)
           .fillColor('#1f2937')
           .font('Helvetica-Bold');
        
        const headers = [
          { text: 'N° Solicitud', x: 30, width: 80 },
          { text: 'Usuario', x: 110, width: 80 },
          { text: 'Tipo', x: 190, width: 60 },
          { text: 'Estado', x: 250, width: 50 },
          { text: 'Fecha', x: 300, width: 60 },
          { text: 'Urgencia', x: 360, width: 50 }
        ];

        headers.forEach(header => {
          doc.text(header.text, header.x, currentY, { width: header.width });
        });

        currentY += 15;

        // Línea separadora
        doc.moveTo(30, currentY)
           .lineTo(450, currentY)
           .strokeColor('#e2e8f0')
           .lineWidth(1)
           .stroke();

        currentY += 10;

        // Datos de solicitudes
        doc.font('Helvetica').fontSize(7);
        
        requests.forEach((request, index) => {
          if (currentY > 750) { // Nueva página
            doc.addPage();
            currentY = 50;
          }

          const rowColor = index % 2 === 0 ? '#000000' : '#374151';
          doc.fillColor(rowColor);
          
          const data = [
            { text: request.requestNumber.substring(0, 12), x: 30, width: 80 },
            { text: `${request.user.firstName} ${request.user.lastName}`.substring(0, 15), x: 110, width: 80 },
            { text: request.certificateType.substring(0, 8), x: 190, width: 60 },
            { text: request.status, x: 250, width: 50 },
            { text: new Date(request.createdAt).toLocaleDateString('es-ES'), x: 300, width: 60 },
            { text: request.urgency === 'URGENTE' ? '⚡' : '📋', x: 360, width: 50 }
          ];

          data.forEach(item => {
            doc.text(item.text, item.x, currentY, { width: item.width });
          });

          currentY += 12;
        });

        // Resumen final
        currentY += 20;
        doc.fontSize(10)
           .fillColor('#2563eb')
           .font('Helvetica-Bold')
           .text('RESUMEN ESTADÍSTICO', 30, currentY);

        currentY += 15;
        doc.fontSize(9)
           .fillColor('#1f2937')
           .font('Helvetica')
           .text(`Total de solicitudes procesadas: ${requests.length}`, 30, currentY);

        Object.entries(stats.byStatus).forEach(([status, count]) => {
          currentY += 12;
          doc.text(`• ${status}: ${count} solicitudes`, 40, currentY);
        });

        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  // Calcular estadísticas para reporte
  static calculateReportStats(requests) {
    const stats = {
      total: requests.length,
      emitidos: 0,
      pendientes: 0,
      byStatus: {}
    };

    requests.forEach(request => {
      // Contar por estado
      stats.byStatus[request.status] = (stats.byStatus[request.status] || 0) + 1;
      
      // Contar emitidos y pendientes
      if (request.status === 'EMITIDO') {
        stats.emitidos++;
      } else if (['RECIBIDO', 'EN_VALIDACION', 'OBSERVADO', 'APROBADO'].includes(request.status)) {
        stats.pendientes++;
      }
    });

    return stats;
  }
}

module.exports = {
  generateCertificatePDF: PDFGenerator.generateCertificatePDF.bind(PDFGenerator),
  generateRequestsReport: PDFGenerator.generateRequestsReport.bind(PDFGenerator)
};