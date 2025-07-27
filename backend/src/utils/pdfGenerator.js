const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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
        const backgroundColor = '#f8fafc';

        // Header del documento
        this.addHeader(doc, primaryColor);

        // Título principal
        this.addTitle(doc, request.certificateType, primaryColor);

        // Información del certificado
        this.addCertificateInfo(doc, request, primaryColor, secondaryColor);

        // Información del solicitante
        this.addUserInfo(doc, request.user, secondaryColor);

        // Detalles de la solicitud
        this.addRequestDetails(doc, request, secondaryColor);

        // Validación y firma digital
        this.addValidationSection(doc, request, primaryColor, secondaryColor);

        // Footer
        this.addFooter(doc, request, secondaryColor);

        // Marca de agua de seguridad
        this.addWatermark(doc);

        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  // Header del documento
  static addHeader(doc, primaryColor) {
    const pageCenter = doc.page.width / 2;
    
    // Logo o título institucional
    doc.fontSize(20)
       .fillColor(primaryColor)
       .text('REPÚBLICA DE PANAMÁ', pageCenter - 100, 50, { width: 200, align: 'center' });
    
    doc.fontSize(16)
       .text('MINISTERIO DE GOBIERNO', pageCenter - 100, 75, { width: 200, align: 'center' });
    
    doc.fontSize(12)
       .text('Sistema DocuTrack', pageCenter - 100, 100, { width: 200, align: 'center' });

    // Línea decorativa
    doc.moveTo(50, 130)
       .lineTo(doc.page.width - 50, 130)
       .strokeColor(primaryColor)
       .lineWidth(2)
       .stroke();
  }

  // Título del certificado
  static addTitle(doc, certificateType, primaryColor) {
    const titles = {
      'NACIMIENTO': 'CERTIFICADO DE NACIMIENTO',
      'ESTUDIOS': 'CERTIFICADO DE ESTUDIOS',
      'RESIDENCIA': 'CERTIFICADO DE RESIDENCIA',
      'ANTECEDENTES': 'CERTIFICADO DE ANTECEDENTES PENALES'
    };

    doc.fontSize(18)
       .fillColor(primaryColor)
       .text(titles[certificateType] || 'CERTIFICADO OFICIAL', 50, 160, {
         width: doc.page.width - 100,
         align: 'center'
       });
  }

  // Información del certificado
  static addCertificateInfo(doc, request, primaryColor, secondaryColor) {
    const currentY = 200;
    
    // Número de certificado
    doc.fontSize(12)
       .fillColor(secondaryColor)
       .text('Número de Certificado:', 50, currentY);
    
    doc.fontSize(12)
       .fillColor(primaryColor)
       .font('Helvetica-Bold')
       .text(request.requestNumber, 200, currentY);

    // Fecha de emisión
    doc.fontSize(12)
       .fillColor(secondaryColor)
       .font('Helvetica')
       .text('Fecha de Emisión:', 50, currentY + 20);
    
    doc.fontSize(12)
       .fillColor(primaryColor)
       .font('Helvetica-Bold')
       .text(new Date(request.completedAt).toLocaleDateString('es-ES'), 200, currentY + 20);

    // Fecha de solicitud
    doc.fontSize(12)
       .fillColor(secondaryColor)
       .font('Helvetica')
       .text('Fecha de Solicitud:', 50, currentY + 40);
    
    doc.fontSize(12)
       .fillColor(primaryColor)
       .font('Helvetica-Bold')
       .text(new Date(request.createdAt).toLocaleDateString('es-ES'), 200, currentY + 40);
  }

  // Información del solicitante
  static addUserInfo(doc, user, secondaryColor) {
    const currentY = 300;
    
    // Título de sección
    doc.fontSize(14)
       .fillColor('#1f2937')
       .font('Helvetica-Bold')
       .text('DATOS DEL SOLICITANTE', 50, currentY);

    // Rectángulo de fondo
    doc.rect(50, currentY + 20, doc.page.width - 100, 100)
       .fillColor('#f9fafb')
       .fill();

    // Información personal
    doc.fontSize(11)
       .fillColor(secondaryColor)
       .font('Helvetica')
       .text('Nombre Completo:', 60, currentY + 35);
    
    doc.fontSize(11)
       .fillColor('#1f2937')
       .font('Helvetica-Bold')
       .text(`${user.firstName} ${user.lastName}`, 160, currentY + 35);

    doc.fontSize(11)
       .fillColor(secondaryColor)
       .font('Helvetica')
       .text('Cédula de Identidad:', 60, currentY + 55);
    
    doc.fontSize(11)
       .fillColor('#1f2937')
       .font('Helvetica-Bold')
       .text(user.nationalId, 160, currentY + 55);

    doc.fontSize(11)
       .fillColor(secondaryColor)
       .font('Helvetica')
       .text('Correo Electrónico:', 60, currentY + 75);
    
    doc.fontSize(11)
       .fillColor('#1f2937')
       .font('Helvetica-Bold')
       .text(user.email, 160, currentY + 75);

    doc.fontSize(11)
       .fillColor(secondaryColor)
       .font('Helvetica')
       .text('Teléfono:', 60, currentY + 95);
    
    doc.fontSize(11)
       .fillColor('#1f2937')
       .font('Helvetica-Bold')
       .text(user.phone || 'No proporcionado', 160, currentY + 95);
  }

  // Detalles de la solicitud
  static addRequestDetails(doc, request, secondaryColor) {
    const currentY = 450;
    
    // Título de sección
    doc.fontSize(14)
       .fillColor('#1f2937')
       .font('Helvetica-Bold')
       .text('DETALLES DE LA SOLICITUD', 50, currentY);

    // Motivo de la solicitud
    doc.fontSize(11)
       .fillColor(secondaryColor)
       .font('Helvetica')
       .text('Motivo de la solicitud:', 50, currentY + 25);
    
    doc.fontSize(10)
       .fillColor('#1f2937')
       .font('Helvetica')
       .text(request.reason, 50, currentY + 45, {
         width: doc.page.width - 100,
         align: 'justify'
       });

    // Tipo de urgencia
    doc.fontSize(11)
       .fillColor(secondaryColor)
       .font('Helvetica')
       .text('Tipo de procesamiento:', 50, currentY + 85);
    
    doc.fontSize(11)
       .fillColor(request.urgency === 'URGENTE' ? '#dc2626' : '#16a34a')
       .font('Helvetica-Bold')
       .text(request.urgency === 'URGENTE' ? 'PROCESAMIENTO URGENTE' : 'PROCESAMIENTO NORMAL', 190, currentY + 85);
  }

  // Sección de validación
  static addValidationSection(doc, request, primaryColor, secondaryColor) {
    const currentY = 580;
    
    // Rectángulo de validación
    doc.rect(50, currentY, doc.page.width - 100, 80)
       .strokeColor(primaryColor)
       .lineWidth(1)
       .stroke();

    doc.fontSize(12)
       .fillColor(primaryColor)
       .font('Helvetica-Bold')
       .text('VALIDACIÓN OFICIAL', 60, currentY + 10);

    doc.fontSize(10)
       .fillColor(secondaryColor)
       .font('Helvetica')
       .text('Este certificado ha sido generado digitalmente por el Sistema DocuTrack', 60, currentY + 30);
    
    doc.text('y cuenta con validez oficial según las normativas vigentes.', 60, currentY + 45);

    // Código de verificación
    const verificationCode = this.generateVerificationCode(request);
    doc.fontSize(10)
       .fillColor('#1f2937')
       .font('Helvetica-Bold')
       .text(`Código de Verificación: ${verificationCode}`, 60, currentY + 60);
  }

  // Footer del documento
  static addFooter(doc, request, secondaryColor) {
    const footerY = doc.page.height - 100;
    
    // Línea superior
    doc.moveTo(50, footerY - 10)
       .lineTo(doc.page.width - 50, footerY - 10)
       .strokeColor(secondaryColor)
       .lineWidth(1)
       .stroke();

    doc.fontSize(8)
       .fillColor(secondaryColor)
       .font('Helvetica')
       .text('Este documento es generado automáticamente por el Sistema DocuTrack', 50, footerY, {
         width: doc.page.width - 100,
         align: 'center'
       });

    doc.text('Para verificar su autenticidad, visite: www.docutrack.gob.pa/verificar', 50, footerY + 12, {
         width: doc.page.width - 100,
         align: 'center'
       });

    doc.text(`Generado el: ${new Date().toLocaleString('es-ES')}`, 50, footerY + 24, {
         width: doc.page.width - 100,
         align: 'center'
       });

    // Número de página
    doc.fontSize(8)
       .text('Página 1 de 1', doc.page.width - 100, footerY + 40);
  }

  // Marca de agua de seguridad
  static addWatermark(doc) {
    // Guardar estado actual
    doc.save();
    
    // Configurar transparencia
    doc.fillOpacity(0.1);
    
    // Agregar marca de agua diagonal
    doc.fontSize(60)
       .fillColor('#2563eb')
       .font('Helvetica-Bold');
    
    // Rotar y posicionar la marca de agua
    doc.rotate(-45, { origin: [doc.page.width / 2, doc.page.height / 2] });
    doc.text('DOCUTRACK', doc.page.width / 2 - 150, doc.page.height / 2 - 30);
    
    // Restaurar estado
    doc.restore();
  }

  // Generar código de verificación único
  static generateVerificationCode(request) {
    const timestamp = new Date(request.completedAt).getTime();
    const hash = require('crypto')
      .createHash('md5')
      .update(`${request.id}-${request.requestNumber}-${timestamp}`)
      .digest('hex')
      .substring(0, 8)
      .toUpperCase();
    
    return `${hash.substring(0, 4)}-${hash.substring(4, 8)}`;
  }

  // Generar reporte de solicitudes para admin
  static async generateRequestsReport(requests, filters = {}) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
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
        doc.fontSize(16)
           .fillColor('#2563eb')
           .text('REPORTE DE SOLICITUDES', 40, 40);

        doc.fontSize(12)
           .fillColor('#64748b')
           .text(`Generado el: ${new Date().toLocaleString('es-ES')}`, 40, 65);

        // Filtros aplicados
        if (Object.keys(filters).length > 0) {
          doc.text('Filtros aplicados:', 40, 85);
          let yPos = 100;
          Object.entries(filters).forEach(([key, value]) => {
            if (value) {
              doc.fontSize(10).text(`${key}: ${value}`, 50, yPos);
              yPos += 15;
            }
          });
        }

        // Tabla de solicitudes
        let currentY = 150;
        
        // Headers de tabla
        doc.fontSize(10)
           .fillColor('#1f2937')
           .font('Helvetica-Bold');
        
        doc.text('N° Solicitud', 40, currentY);
        doc.text('Usuario', 140, currentY);
        doc.text('Tipo', 240, currentY);
        doc.text('Estado', 320, currentY);
        doc.text('Fecha', 400, currentY);
        doc.text('Urgencia', 480, currentY);

        currentY += 20;

        // Línea separadora
        doc.moveTo(40, currentY - 5)
           .lineTo(550, currentY - 5)
           .strokeColor('#e2e8f0')
           .stroke();

        // Datos de solicitudes
        doc.font('Helvetica').fontSize(9);
        
        requests.forEach((request, index) => {
          if (currentY > 750) { // Nueva página si es necesario
            doc.addPage();
            currentY = 50;
          }

          doc.fillColor(index % 2 === 0 ? '#000000' : '#374151');
          
          doc.text(request.requestNumber.substring(0, 15), 40, currentY);
          doc.text(`${request.user.firstName} ${request.user.lastName}`.substring(0, 20), 140, currentY);
          doc.text(request.certificateType, 240, currentY);
          doc.text(request.status, 320, currentY);
          doc.text(new Date(request.createdAt).toLocaleDateString('es-ES'), 400, currentY);
          doc.text(request.urgency, 480, currentY);

          currentY += 15;
        });

        // Estadísticas al final
        currentY += 20;
        doc.fontSize(12)
           .fillColor('#2563eb')
           .font('Helvetica-Bold')
           .text(`Total de solicitudes: ${requests.length}`, 40, currentY);

        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = {
  generateCertificatePDF: PDFGenerator.generateCertificatePDF.bind(PDFGenerator),
  generateRequestsReport: PDFGenerator.generateRequestsReport.bind(PDFGenerator)
};