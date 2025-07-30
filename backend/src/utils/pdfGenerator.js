const PDFDocument = require('pdfkit');
const crypto = require('crypto');

class ModernPDFGenerator {
  static async generateCertificatePDF(request) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
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

        // Configurar variables de diseño
        const pageWidth = doc.page.width;
        const margin = 40;
        const contentWidth = pageWidth - (margin * 2);
        let currentY = margin;

        // Colores modernos
        const colors = {
          primary: '#1e40af',
          secondary: '#64748b',
          accent: '#0f766e',
          success: '#059669',
          text: '#1f2937',
          light: '#f8fafc',
          border: '#e2e8f0'
        };

        // === HEADER INSTITUCIONAL ===
        currentY = this.drawHeader(doc, margin, currentY, contentWidth, colors);
        
        // === TIPO DE CERTIFICADO ===
        currentY = this.drawCertificateTitle(doc, request.certificateType, margin, currentY, contentWidth, colors);
        
        // === INFORMACIÓN DEL CERTIFICADO ===
        currentY = this.drawCertificateInfo(doc, request, margin, currentY, contentWidth, colors);
        
        // === DATOS DEL SOLICITANTE ===
        currentY = this.drawPersonalInfo(doc, request, margin, currentY, contentWidth, colors);
        
        // === DETALLES DE LA SOLICITUD ===
        currentY = this.drawRequestDetails(doc, request, margin, currentY, contentWidth, colors);
        
        // === VALIDACIÓN Y SEGURIDAD ===
        currentY = this.drawValidationSection(doc, request, margin, currentY, contentWidth, colors);
        
        // === FOOTER ===
        this.drawFooter(doc, request, margin, colors);
        
        // === MARCA DE AGUA ===
        this.drawWatermark(doc, colors);

        doc.end();

      } catch (error) {
        console.error('Error generando PDF:', error);
        reject(error);
      }
    });
  }

  // === HEADER INSTITUCIONAL ===
  static drawHeader(doc, margin, startY, contentWidth, colors) {
    const headerHeight = 80;
    
    // Fondo del header
    doc.rect(margin, startY, contentWidth, headerHeight)
       .fillColor(colors.light)
       .fill()
       .strokeColor(colors.border)
       .lineWidth(1)
       .stroke();

    // Escudo/Logo (simulado con emoji)
    doc.fontSize(32)
       .fillColor(colors.primary)
       .text('🏛️', margin + 20, startY + 15);

    // Texto institucional
    const textX = margin + 80;
    doc.fontSize(16)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text('REPÚBLICA DE PANAMÁ', textX, startY + 10);
    
    doc.fontSize(14)
       .fillColor(colors.text)
       .font('Helvetica')
       .text('MINISTERIO DE GOBIERNO', textX, startY + 30);
    
    doc.fontSize(10)
       .fillColor(colors.secondary)
       .text('Sistema DocuTrack - Gestión Digital de Trámites', textX, startY + 50);

    // Fecha de generación (alineada a la derecha)
    const currentDate = new Date().toLocaleString('es-ES');
    doc.fontSize(8)
       .fillColor(colors.secondary)
       .text(`Generado: ${currentDate}`, margin + contentWidth - 120, startY + 10);

    return startY + headerHeight + 30;
  }

  // === TÍTULO DEL CERTIFICADO ===
  static drawCertificateTitle(doc, certificateType, margin, startY, contentWidth, colors) {
    const titles = {
      'NACIMIENTO': 'CERTIFICADO DE NACIMIENTO',
      'ESTUDIOS': 'CERTIFICADO DE ESTUDIOS',
      'RESIDENCIA': 'CERTIFICADO DE RESIDENCIA',
      'ANTECEDENTES': 'CERTIFICADO DE ANTECEDENTES PENALES'
    };

    const title = titles[certificateType] || 'CERTIFICADO OFICIAL';
    const titleHeight = 60;

    // Fondo del título
    doc.rect(margin, startY, contentWidth, titleHeight)
       .fillColor('#eff6ff')
       .fill()
       .strokeColor(colors.primary)
       .lineWidth(2)
       .stroke();

    // Título principal
    doc.fontSize(18)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text(title, margin, startY + 15, {
         width: contentWidth,
         align: 'center'
       });

    // Subtítulo
    doc.fontSize(10)
       .fillColor(colors.secondary)
       .font('Helvetica')
       .text('Documento Oficial con Validez Legal', margin, startY + 40, {
         width: contentWidth,
         align: 'center'
       });

    return startY + titleHeight + 25;
  }

  // === INFORMACIÓN DEL CERTIFICADO ===
  static drawCertificateInfo(doc, request, margin, startY, contentWidth, colors) {
    const sectionHeight = 80;
    
    // Título de sección
    doc.fontSize(12)
       .fillColor(colors.text)
       .font('Helvetica-Bold')
       .text('INFORMACIÓN DEL CERTIFICADO', margin, startY);

    startY += 20;

    // Fondo de la sección
    doc.rect(margin, startY, contentWidth, sectionHeight - 20)
       .fillColor('#fafafa')
       .fill()
       .strokeColor(colors.border)
       .lineWidth(1)
       .stroke();

    const infoStartY = startY + 15;
    const leftCol = margin + 20;
    const rightCol = margin + (contentWidth / 2) + 20;

    // Información en dos columnas
    doc.fontSize(9)
       .fillColor(colors.secondary)
       .font('Helvetica')
       .text('Número de Certificado:', leftCol, infoStartY);
    
    doc.fontSize(10)
       .fillColor(colors.text)
       .font('Helvetica-Bold')
       .text(request.requestNumber, leftCol, infoStartY + 12);

    // Fecha de emisión
    const emissionDate = request.completedAt || request.updatedAt || new Date();
    doc.fontSize(9)
       .fillColor(colors.secondary)
       .font('Helvetica')
       .text('Fecha de Emisión:', rightCol, infoStartY);
    
    doc.fontSize(10)
       .fillColor(colors.text)
       .font('Helvetica-Bold')
       .text(new Date(emissionDate).toLocaleDateString('es-ES'), rightCol, infoStartY + 12);

    // Fecha de solicitud
    doc.fontSize(9)
       .fillColor(colors.secondary)
       .font('Helvetica')
       .text('Fecha de Solicitud:', leftCol, infoStartY + 35);
    
    doc.fontSize(10)
       .fillColor(colors.text)
       .font('Helvetica')
       .text(new Date(request.createdAt).toLocaleDateString('es-ES'), leftCol, infoStartY + 47);

    // Estado
    doc.fontSize(9)
       .fillColor(colors.secondary)
       .font('Helvetica')
       .text('Estado:', rightCol, infoStartY + 35);
    
    doc.fontSize(10)
       .fillColor(colors.success)
       .font('Helvetica-Bold')
       .text('EMITIDO', rightCol, infoStartY + 47);

    return startY + sectionHeight + 15;
  }

  // === DATOS PERSONALES ===
  static drawPersonalInfo(doc, request, margin, startY, contentWidth, colors) {
    const sectionHeight = 120;
    
    // Título de sección
    doc.fontSize(12)
       .fillColor(colors.text)
       .font('Helvetica-Bold')
       .text('DATOS DEL SOLICITANTE', margin, startY);

    startY += 20;

    // Fondo de la sección
    doc.rect(margin, startY, contentWidth, sectionHeight - 20)
       .fillColor('#f9fafb')
       .fill()
       .strokeColor(colors.border)
       .lineWidth(1)
       .stroke();

    const infoStartY = startY + 15;
    const leftCol = margin + 20;
    const rightCol = margin + (contentWidth / 2) + 20;

    // Datos personales
    const personalData = [
      { label: 'Nombre Completo:', value: `${request.user.firstName} ${request.user.lastName}`, x: leftCol },
      { label: 'Cédula de Identidad:', value: request.user.nationalId, x: rightCol },
      { label: 'Correo Electrónico:', value: request.user.email, x: leftCol },
      { label: 'Teléfono:', value: request.user.phone || 'No proporcionado', x: rightCol }
    ];

    personalData.forEach((item, index) => {
      const yPos = infoStartY + (Math.floor(index / 2) * 40);
      
      doc.fontSize(9)
         .fillColor(colors.secondary)
         .font('Helvetica')
         .text(item.label, item.x, yPos);
      
      doc.fontSize(10)
         .fillColor(colors.text)
         .font('Helvetica-Bold')
         .text(item.value, item.x, yPos + 12, { width: 200 });
    });

    return startY + sectionHeight + 15;
  }

  // === DETALLES DE LA SOLICITUD ===
  static drawRequestDetails(doc, request, margin, startY, contentWidth, colors) {
    const sectionHeight = 100;
    
    // Título de sección
    doc.fontSize(12)
       .fillColor(colors.text)
       .font('Helvetica-Bold')
       .text('DETALLES DE LA SOLICITUD', margin, startY);

    startY += 20;

    // Motivo de la solicitud
    doc.fontSize(9)
       .fillColor(colors.secondary)
       .font('Helvetica')
       .text('Motivo de la solicitud:', margin, startY);

    startY += 15;

    // Fondo para el motivo
    doc.rect(margin, startY, contentWidth, 50)
       .fillColor('#fafafa')
       .fill()
       .strokeColor(colors.border)
       .lineWidth(1)
       .stroke();

    doc.fontSize(10)
       .fillColor(colors.text)
       .font('Helvetica')
       .text(request.reason, margin + 10, startY + 10, {
         width: contentWidth - 20,
         align: 'justify'
       });

    startY += 65;

    // Tipo de procesamiento y documento
    const leftCol = margin;
    const rightCol = margin + (contentWidth / 2);

    doc.fontSize(9)
       .fillColor(colors.secondary)
       .font('Helvetica')
       .text('Tipo de procesamiento:', leftCol, startY);

    const urgencyText = request.urgency === 'URGENTE' ? 'PROCESAMIENTO URGENTE' : 'PROCESAMIENTO NORMAL';
    const urgencyColor = request.urgency === 'URGENTE' ? '#dc2626' : colors.success;

    doc.fontSize(10)
       .fillColor(urgencyColor)
       .font('Helvetica-Bold')
       .text(urgencyText, leftCol, startY + 12);

    // Documento adjunto (si existe)
    if (request.document) {
      doc.fontSize(9)
         .fillColor(colors.secondary)
         .font('Helvetica')
         .text('Documento adjunto:', rightCol, startY);
      
      doc.fontSize(10)
         .fillColor(colors.text)
         .font('Helvetica')
         .text(request.document.originalName, rightCol, startY + 12, { width: 200 });
    }

    return startY + 40;
  }

  // === VALIDACIÓN Y SEGURIDAD ===
  static drawValidationSection(doc, request, margin, startY, contentWidth, colors) {
    const sectionHeight = 80;
    
    // Fondo de validación
    doc.rect(margin, startY, contentWidth, sectionHeight)
       .fillColor('#fef3c7')
       .fill()
       .strokeColor('#f59e0b')
       .lineWidth(2)
       .stroke();

    // Icono de seguridad
    doc.fontSize(16)
       .fillColor('#f59e0b')
       .text('🔐', margin + 15, startY + 15);

    // Título
    doc.fontSize(12)
       .fillColor('#92400e')
       .font('Helvetica-Bold')
       .text('VALIDACIÓN OFICIAL Y SEGURIDAD', margin + 45, startY + 15);

    // Texto de validación
    const validationText = [
      'Este certificado ha sido generado digitalmente por el Sistema DocuTrack del',
      'Ministerio de Gobierno de la República de Panamá, y cuenta con plena validez',
      'legal según las normativas vigentes. Su autenticidad puede ser verificada.'
    ];

    validationText.forEach((line, index) => {
      doc.fontSize(9)
         .fillColor('#78350f')
         .font('Helvetica')
         .text(line, margin + 15, startY + 35 + (index * 10));
    });

    // Código de verificación
    const verificationCode = this.generateVerificationCode(request);
    doc.fontSize(10)
       .fillColor('#92400e')
       .font('Helvetica-Bold')
       .text(`Código de Verificación: ${verificationCode}`, margin + 15, startY + 70);

    return startY + sectionHeight + 20;
  }

  // === FOOTER ===
  static drawFooter(doc, request, margin, colors) {
    const footerY = doc.page.height - 80;
    
    // Línea superior
    doc.moveTo(margin, footerY)
       .lineTo(doc.page.width - margin, footerY)
       .strokeColor(colors.border)
       .lineWidth(1)
       .stroke();

    // QR Code simulado
    const qrSize = 50;
    const qrX = doc.page.width - margin - qrSize - 10;
    
    doc.rect(qrX, footerY + 5, qrSize, qrSize)
       .fillColor('#ffffff')
       .fill()
       .strokeColor(colors.primary)
       .lineWidth(1)
       .stroke();
    
    doc.fontSize(8)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text('QR', qrX + 18, footerY + 20);
    
    doc.fontSize(6)
       .fillColor(colors.secondary)
       .text('Verificar', qrX + 12, footerY + 30);

    // Información del footer
    const footerTexts = [
      'Este documento fue generado automáticamente por el Sistema DocuTrack',
      'Ministerio de Gobierno - República de Panamá',
      'Para verificar autenticidad: www.docutrack.gob.pa/verificar'
    ];

    footerTexts.forEach((text, index) => {
      doc.fontSize(7)
         .fillColor(colors.secondary)
         .font('Helvetica')
         .text(text, margin, footerY + 10 + (index * 10), {
           width: doc.page.width - margin - qrSize - 30,
           align: 'center'
         });
    });

    // ID del documento
    doc.fontSize(6)
       .fillColor('#d1d5db')
       .text(`ID: ${request.id}`, margin, footerY + 45);
  }

  // === MARCA DE AGUA ===
  static drawWatermark(doc, colors) {
    doc.save();
    
    doc.fillOpacity(0.05)
       .fontSize(60)
       .fillColor(colors.primary)
       .font('Helvetica-Bold');
    
    // Rotar y centrar
    doc.rotate(-45, { origin: [doc.page.width / 2, doc.page.height / 2] });
    doc.text('DOCUTRACK', doc.page.width / 2 - 150, doc.page.height / 2 - 20);
    
    doc.restore();
  }

  // === CÓDIGO DE VERIFICACIÓN ===
  static generateVerificationCode(request) {
    const completedDate = request.completedAt || request.updatedAt || new Date();
    const timestamp = new Date(completedDate).getTime();
    const hash = crypto
      .createHash('sha256')
      .update(`${request.id}-${request.requestNumber}-${timestamp}-DOCUTRACK`)
      .digest('hex')
      .substring(0, 12)
      .toUpperCase();
    
    return `${hash.substring(0, 4)}-${hash.substring(4, 8)}-${hash.substring(8, 12)}`;
  }

  // === REPORTE DE SOLICITUDES (ADMIN) ===
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
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        let currentY = 30;
        const margin = 30;
        const contentWidth = doc.page.width - (margin * 2);

        // Header del reporte
        doc.fontSize(16)
           .fillColor('#1e40af')
           .font('Helvetica-Bold')
           .text('REPORTE DE SOLICITUDES - DOCUTRACK', margin, currentY);

        currentY += 30;

        doc.fontSize(10)
           .fillColor('#64748b')
           .font('Helvetica')
           .text(`Generado: ${new Date().toLocaleString('es-ES')}`, margin, currentY);

        currentY += 30;

        // Estadísticas
        const stats = this.calculateStats(requests);
        const statsText = `Total: ${stats.total} | Emitidos: ${stats.emitidos} | Pendientes: ${stats.pendientes}`;
        
        doc.fontSize(10)
           .fillColor('#1f2937')
           .font('Helvetica-Bold')
           .text(statsText, margin, currentY);

        currentY += 40;

        // Headers de tabla
        const headers = [
          { text: 'Número', x: margin, width: 100 },
          { text: 'Usuario', x: margin + 100, width: 120 },
          { text: 'Tipo', x: margin + 220, width: 80 },
          { text: 'Estado', x: margin + 300, width: 60 },
          { text: 'Fecha', x: margin + 360, width: 80 }
        ];

        // Línea de header
        doc.rect(margin, currentY, contentWidth, 20)
           .fillColor('#f8fafc')
           .fill()
           .strokeColor('#e2e8f0')
           .lineWidth(1)
           .stroke();

        headers.forEach(header => {
          doc.fontSize(9)
             .fillColor('#1f2937')
             .font('Helvetica-Bold')
             .text(header.text, header.x + 5, currentY + 6);
        });

        currentY += 25;

        // Datos
        requests.slice(0, 25).forEach((request, index) => {
          if (currentY > 750) {
            doc.addPage();
            currentY = 50;
          }

          const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
          
          doc.rect(margin, currentY, contentWidth, 18)
             .fillColor(bgColor)
             .fill();

          const data = [
            { text: request.requestNumber.substring(0, 18), x: margin + 5 },
            { text: `${request.user?.firstName || request.firstName} ${request.user?.lastName || request.lastName}`.substring(0, 20), x: margin + 105 },
            { text: request.certificateType.substring(0, 12), x: margin + 225 },
            { text: request.status, x: margin + 305 },
            { text: new Date(request.createdAt).toLocaleDateString('es-ES'), x: margin + 365 }
          ];

          data.forEach(item => {
            doc.fontSize(8)
               .fillColor('#374151')
               .font('Helvetica')
               .text(item.text, item.x, currentY + 5);
          });

          currentY += 18;
        });

        // Nota si hay más registros
        if (requests.length > 25) {
          currentY += 20;
          doc.fontSize(8)
             .fillColor('#6b7280')
             .font('Helvetica-Oblique')
             .text(`Mostrando primeros 25 de ${requests.length} registros`, margin, currentY);
        }

        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  // === CALCULAR ESTADÍSTICAS ===
  static calculateStats(requests) {
    return {
      total: requests.length,
      emitidos: requests.filter(r => r.status === 'EMITIDO').length,
      pendientes: requests.filter(r => ['RECIBIDO', 'EN_VALIDACION', 'OBSERVADO', 'APROBADO'].includes(r.status)).length
    };
  }
}

module.exports = {
  generateCertificatePDF: ModernPDFGenerator.generateCertificatePDF.bind(ModernPDFGenerator),
  generateRequestsReport: ModernPDFGenerator.generateRequestsReport.bind(ModernPDFGenerator)
};