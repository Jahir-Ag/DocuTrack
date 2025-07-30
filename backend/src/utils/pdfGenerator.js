const PDFDocument = require('pdfkit');
const crypto = require('crypto');

class ModernPDFGenerator {
  static async generateCertificatePDF(request) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 40, bottom: 40, left: 40, right: 40 },
          bufferPages: true,
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
    doc.save();
    doc.rect(margin, startY, contentWidth, headerHeight)
       .fillColor(colors.light)
       .fill()
       .strokeColor(colors.border)
       .lineWidth(1)
       .stroke();
    doc.restore();

    // Logo/Escudo simulado con texto en lugar de emoji
    doc.save();
    doc.rect(margin + 15, startY + 15, 50, 50)
       .fillColor(colors.primary)
       .fill();
    
    doc.fillColor('#ffffff')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('GOB', margin + 28, startY + 30)
       .text('PA', margin + 32, startY + 45);
    doc.restore();

    // Texto institucional
    const textX = margin + 80;
    doc.fillColor(colors.primary)
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('REPUBLICA DE PANAMA', textX, startY + 10);
    
    doc.fillColor(colors.text)
       .fontSize(14)
       .font('Helvetica')
       .text('MINISTERIO DE GOBIERNO', textX, startY + 30);
    
    doc.fillColor(colors.secondary)
       .fontSize(10)
       .text('Sistema DocuTrack - Gestion Digital de Tramites', textX, startY + 50);

    // Fecha de generación (alineada a la derecha)
    const currentDate = new Date().toLocaleString('es-PA', {
      timeZone: 'America/Panama',
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    doc.fillColor(colors.secondary)
       .fontSize(8)
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
    doc.save();
    doc.rect(margin, startY, contentWidth, titleHeight)
       .fillColor('#eff6ff')
       .fill()
       .strokeColor(colors.primary)
       .lineWidth(2)
       .stroke();
    doc.restore();

    // Título principal - centrado manualmente
    doc.save();
    doc.fillColor(colors.primary)
       .fontSize(18)
       .font('Helvetica-Bold');
    
    const titleWidth = doc.widthOfString(title);
    const titleX = margin + (contentWidth - titleWidth) / 2;
    doc.text(title, titleX, startY + 15);
    doc.restore();

    // Subtítulo
    doc.save();
    doc.fillColor(colors.secondary)
       .fontSize(10)
       .font('Helvetica');
    
    const subtitle = 'Documento Oficial con Validez Legal';
    const subtitleWidth = doc.widthOfString(subtitle);
    const subtitleX = margin + (contentWidth - subtitleWidth) / 2;
    doc.text(subtitle, subtitleX, startY + 40);
    doc.restore();

    return startY + titleHeight + 25;
  }

  // === INFORMACIÓN DEL CERTIFICADO ===
  static drawCertificateInfo(doc, request, margin, startY, contentWidth, colors) {
    const sectionHeight = 80;
    
    // Título de sección
    doc.save();
    doc.fillColor(colors.text)
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('INFORMACION DEL CERTIFICADO', margin, startY);
    doc.restore();

    startY += 20;

    // Fondo de la sección
    doc.save();
    doc.rect(margin, startY, contentWidth, sectionHeight - 20)
       .fillColor('#fafafa')
       .fill()
       .strokeColor(colors.border)
       .lineWidth(1)
       .stroke();
    doc.restore();

    const infoStartY = startY + 15;
    const leftCol = margin + 20;
    const rightCol = margin + (contentWidth / 2) + 20;

    // Información en dos columnas
    doc.save();
    doc.fillColor(colors.secondary)
       .fontSize(9)
       .font('Helvetica')
       .text('Numero de Certificado:', leftCol, infoStartY);
    
    doc.fillColor(colors.text)
       .fontSize(10)
       .font('Helvetica-Bold')
       .text(request.requestNumber || 'N/A', leftCol, infoStartY + 12);
    doc.restore();

    // Fecha de emisión
    const emissionDate = request.completedAt || request.updatedAt || new Date();
    const formattedEmissionDate = new Date(emissionDate).toLocaleDateString('es-PA');
    
    doc.save();
    doc.fillColor(colors.secondary)
       .fontSize(9)
       .font('Helvetica')
       .text('Fecha de Emision:', rightCol, infoStartY);
    
    doc.fillColor(colors.text)
       .fontSize(10)
       .font('Helvetica-Bold')
       .text(formattedEmissionDate, rightCol, infoStartY + 12);
    doc.restore();

    // Fecha de solicitud
    const formattedRequestDate = new Date(request.createdAt).toLocaleDateString('es-PA');
    
    doc.save();
    doc.fillColor(colors.secondary)
       .fontSize(9)
       .font('Helvetica')
       .text('Fecha de Solicitud:', leftCol, infoStartY + 35);
    
    doc.fillColor(colors.text)
       .fontSize(10)
       .font('Helvetica')
       .text(formattedRequestDate, leftCol, infoStartY + 47);
    doc.restore();

    // Estado
    doc.save();
    doc.fillColor(colors.secondary)
       .fontSize(9)
       .font('Helvetica')
       .text('Estado:', rightCol, infoStartY + 35);
    
    doc.fillColor(colors.success)
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('EMITIDO', rightCol, infoStartY + 47);
    doc.restore();

    return startY + sectionHeight + 15;
  }

  // === DATOS PERSONALES ===
  static drawPersonalInfo(doc, request, margin, startY, contentWidth, colors) {
    const sectionHeight = 120;
    
    // Título de sección
    doc.save();
    doc.fillColor(colors.text)
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('DATOS DEL SOLICITANTE', margin, startY);
    doc.restore();

    startY += 20;

    // Fondo de la sección
    doc.save();
    doc.rect(margin, startY, contentWidth, sectionHeight - 20)
       .fillColor('#f9fafb')
       .fill()
       .strokeColor(colors.border)
       .lineWidth(1)
       .stroke();
    doc.restore();

    const infoStartY = startY + 15;
    const leftCol = margin + 20;
    const rightCol = margin + (contentWidth / 2) + 20;

    // Obtener datos del usuario
    const firstName = request.user?.firstName || request.firstName || 'N/A';
    const lastName = request.user?.lastName || request.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const nationalId = request.user?.nationalId || request.nationalId || 'N/A';
    const email = request.user?.email || request.email || 'N/A';
    const phone = request.user?.phone || request.phone || 'No proporcionado';

    // Datos personales
    const personalData = [
      { label: 'Nombre Completo:', value: fullName, x: leftCol },
      { label: 'Cedula de Identidad:', value: nationalId, x: rightCol },
      { label: 'Correo Electronico:', value: email, x: leftCol },
      { label: 'Telefono:', value: phone, x: rightCol }
    ];

    personalData.forEach((item, index) => {
      const yPos = infoStartY + (Math.floor(index / 2) * 40);
      
      doc.save();
      doc.fillColor(colors.secondary)
         .fontSize(9)
         .font('Helvetica')
         .text(item.label, item.x, yPos);
      
      doc.fillColor(colors.text)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text(item.value, item.x, yPos + 12, { width: 200, ellipsis: true });
      doc.restore();
    });

    return startY + sectionHeight + 15;
  }

  // === DETALLES DE LA SOLICITUD ===
  static drawRequestDetails(doc, request, margin, startY, contentWidth, colors) {
    const sectionHeight = 100;
    
    // Título de sección
    doc.save();
    doc.fillColor(colors.text)
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('DETALLES DE LA SOLICITUD', margin, startY);
    doc.restore();

    startY += 20;

    // Motivo de la solicitud
    doc.save();
    doc.fillColor(colors.secondary)
       .fontSize(9)
       .font('Helvetica')
       .text('Motivo de la solicitud:', margin, startY);
    doc.restore();

    startY += 15;

    // Fondo para el motivo
    doc.save();
    doc.rect(margin, startY, contentWidth, 50)
       .fillColor('#fafafa')
       .fill()
       .strokeColor(colors.border)
       .lineWidth(1)
       .stroke();
    doc.restore();

    doc.save();
    doc.fillColor(colors.text)
       .fontSize(10)
       .font('Helvetica')
       .text(request.reason || 'No especificado', margin + 10, startY + 10, {
         width: contentWidth - 20,
         align: 'justify'
       });
    doc.restore();

    startY += 65;

    // Tipo de procesamiento y documento
    const leftCol = margin;
    const rightCol = margin + (contentWidth / 2);

    doc.save();
    doc.fillColor(colors.secondary)
       .fontSize(9)
       .font('Helvetica')
       .text('Tipo de procesamiento:', leftCol, startY);
    doc.restore();

    const urgencyText = request.urgency === 'URGENTE' ? 'PROCESAMIENTO URGENTE' : 'PROCESAMIENTO NORMAL';
    const urgencyColor = request.urgency === 'URGENTE' ? '#dc2626' : colors.success;

    doc.save();
    doc.fillColor(urgencyColor)
       .fontSize(10)
       .font('Helvetica-Bold')
       .text(urgencyText, leftCol, startY + 12);
    doc.restore();

    // Documento adjunto (si existe)
    if (request.document?.originalName) {
      doc.save();
      doc.fillColor(colors.secondary)
         .fontSize(9)
         .font('Helvetica')
         .text('Documento adjunto:', rightCol, startY);
      
      doc.fillColor(colors.text)
         .fontSize(10)
         .font('Helvetica')
         .text(request.document.originalName, rightCol, startY + 12, { width: 200, ellipsis: true });
      doc.restore();
    }

    return startY + 40;
  }

  // === VALIDACIÓN Y SEGURIDAD ===
  static drawValidationSection(doc, request, margin, startY, contentWidth, colors) {
    const sectionHeight = 80;
    
    // Fondo de validación
    doc.save();
    doc.rect(margin, startY, contentWidth, sectionHeight)
       .fillColor('#fef3c7')
       .fill()
       .strokeColor('#f59e0b')
       .lineWidth(2)
       .stroke();
    doc.restore();

    // Icono de seguridad (texto en lugar de emoji)
    doc.save();
    doc.rect(margin + 15, startY + 15, 20, 15)
       .fillColor('#f59e0b')
       .fill();
    
    doc.fillColor('#ffffff')
       .fontSize(8)
       .font('Helvetica-Bold')
       .text('SEC', margin + 18, startY + 20);
    doc.restore();

    // Título
    doc.save();
    doc.fillColor('#92400e')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('VALIDACION OFICIAL Y SEGURIDAD', margin + 45, startY + 15);
    doc.restore();

    // Texto de validación
    const validationText = [
      'Este certificado ha sido generado digitalmente por el Sistema DocuTrack del',
      'Ministerio de Gobierno de la Republica de Panama, y cuenta con plena validez',
      'legal segun las normativas vigentes. Su autenticidad puede ser verificada.'
    ];

    validationText.forEach((line, index) => {
      doc.save();
      doc.fillColor('#78350f')
         .fontSize(9)
         .font('Helvetica')
         .text(line, margin + 15, startY + 35 + (index * 10));
      doc.restore();
    });

    // Código de verificación
    const verificationCode = this.generateVerificationCode(request);
    doc.save();
    doc.fillColor('#92400e')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text(`Codigo de Verificacion: ${verificationCode}`, margin + 15, startY + 70);
    doc.restore();

    return startY + sectionHeight + 20;
  }

  // === FOOTER ===
  static drawFooter(doc, request, margin, colors) {
    const footerY = doc.page.height - 80;
    
    // Línea superior
    doc.save();
    doc.moveTo(margin, footerY)
       .lineTo(doc.page.width - margin, footerY)
       .strokeColor(colors.border)
       .lineWidth(1)
       .stroke();
    doc.restore();

    // QR Code simulado
    const qrSize = 50;
    const qrX = doc.page.width - margin - qrSize - 10;
    
    doc.save();
    doc.rect(qrX, footerY + 5, qrSize, qrSize)
       .fillColor('#ffffff')
       .fill()
       .strokeColor(colors.primary)
       .lineWidth(1)
       .stroke();
    
    doc.fillColor(colors.primary)
       .fontSize(8)
       .font('Helvetica-Bold')
       .text('QR', qrX + 18, footerY + 20);
    
    doc.fillColor(colors.secondary)
       .fontSize(6)
       .text('Verificar', qrX + 12, footerY + 30);
    doc.restore();

    // Información del footer
    const footerTexts = [
      'Este documento fue generado automaticamente por el Sistema DocuTrack',
      'Ministerio de Gobierno - Republica de Panama',
      'Para verificar autenticidad: www.docutrack.gob.pa/verificar'
    ];

    footerTexts.forEach((text, index) => {
      doc.save();
      doc.fillColor(colors.secondary)
         .fontSize(7)
         .font('Helvetica');
      
      const textWidth = doc.widthOfString(text);
      const textX = margin + ((doc.page.width - margin - qrSize - 30) - textWidth) / 2;
      doc.text(text, textX, footerY + 10 + (index * 10));
      doc.restore();
    });

    // ID del documento
    doc.save();
    doc.fillColor('#d1d5db')
       .fontSize(6)
       .text(`ID: ${request.id}`, margin, footerY + 45);
    doc.restore();
  }

  // === MARCA DE AGUA ===
  static drawWatermark(doc, colors) {
    doc.save();
    
    // Configurar opacidad y fuente
    doc.fillOpacity(0.05)
       .fillColor(colors.primary)
       .fontSize(60)
       .font('Helvetica-Bold');
    
    // Rotar y centrar
    const centerX = doc.page.width / 2;
    const centerY = doc.page.height / 2;
    
    doc.rotate(-45, { origin: [centerX, centerY] });
    
    const watermarkText = 'DOCUTRACK';
    const textWidth = doc.widthOfString(watermarkText);
    doc.text(watermarkText, centerX - textWidth / 2, centerY - 20);
    
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
          margins: { top: 30, bottom: 30, left: 30, right: 30 },
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
        doc.save();
        doc.fillColor('#1e40af')
           .fontSize(16)
           .font('Helvetica-Bold')
           .text('REPORTE DE SOLICITUDES - DOCUTRACK', margin, currentY);
        doc.restore();

        currentY += 30;

        doc.save();
        doc.fillColor('#64748b')
           .fontSize(10)
           .font('Helvetica')
           .text(`Generado: ${new Date().toLocaleString('es-PA')}`, margin, currentY);
        doc.restore();

        currentY += 30;

        // Estadísticas
        const stats = this.calculateStats(requests);
        const statsText = `Total: ${stats.total} | Emitidos: ${stats.emitidos} | Pendientes: ${stats.pendientes}`;
        
        doc.save();
        doc.fillColor('#1f2937')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text(statsText, margin, currentY);
        doc.restore();

        currentY += 40;

        // Headers de tabla
        const headers = [
          { text: 'Numero', x: margin, width: 100 },
          { text: 'Usuario', x: margin + 100, width: 120 },
          { text: 'Tipo', x: margin + 220, width: 80 },
          { text: 'Estado', x: margin + 300, width: 60 },
          { text: 'Fecha', x: margin + 360, width: 80 }
        ];

        // Línea de header
        doc.save();
        doc.rect(margin, currentY, contentWidth, 20)
           .fillColor('#f8fafc')
           .fill()
           .strokeColor('#e2e8f0')
           .lineWidth(1)
           .stroke();
        doc.restore();

        headers.forEach(header => {
          doc.save();
          doc.fillColor('#1f2937')
             .fontSize(9)
             .font('Helvetica-Bold')
             .text(header.text, header.x + 5, currentY + 6);
          doc.restore();
        });

        currentY += 25;

        // Datos
        requests.slice(0, 25).forEach((request, index) => {
          if (currentY > 750) {
            doc.addPage();
            currentY = 50;
          }

          const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
          
          doc.save();
          doc.rect(margin, currentY, contentWidth, 18)
             .fillColor(bgColor)
             .fill();
          doc.restore();

          const requestNumber = (request.requestNumber || 'N/A').substring(0, 18);
          const userName = `${request.user?.firstName || request.firstName || ''} ${request.user?.lastName || request.lastName || ''}`.trim().substring(0, 20) || 'N/A';
          const certificateType = (request.certificateType || 'N/A').substring(0, 12);
          const status = request.status || 'N/A';
          const createdDate = request.createdAt ? new Date(request.createdAt).toLocaleDateString('es-PA') : 'N/A';

          const data = [
            { text: requestNumber, x: margin + 5 },
            { text: userName, x: margin + 105 },
            { text: certificateType, x: margin + 225 },
            { text: status, x: margin + 305 },
            { text: createdDate, x: margin + 365 }
          ];

          data.forEach(item => {
            doc.save();
            doc.fillColor('#374151')
               .fontSize(8)
               .font('Helvetica')
               .text(item.text, item.x, currentY + 5);
            doc.restore();
          });

          currentY += 18;
        });

        // Nota si hay más registros
        if (requests.length > 25) {
          currentY += 20;
          doc.save();
          doc.fillColor('#6b7280')
             .fontSize(8)
             .font('Helvetica-Oblique')
             .text(`Mostrando primeros 25 de ${requests.length} registros`, margin, currentY);
          doc.restore();
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