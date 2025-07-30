import React, { useState } from 'react';
import Button from "../components/common/Button";
import { useDownload } from '../hooks/useDownload';

const CertificateDownload = ({ requestId, className = '' }) => {
  const { downloadCertificate, isDownloading, downloadError } = useDownload();
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownload = async () => {
    const result = await downloadCertificate(requestId, `certificado-${requestId}.pdf`);
    
    if (result.success) {
      setDownloadSuccess(true);
      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => setDownloadSuccess(false), 3000);
    }
  };

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between p-4 border-2 border-dashed border-green-300 rounded-lg bg-green-50">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-green-800">
              ¡Certificado Disponible!
            </h3>
            <p className="text-sm text-green-600">
              Tu certificado ha sido emitido y está listo para descargar
            </p>
          </div>
        </div>
        
        <div className="flex-shrink-0">
          <Button
            onClick={handleDownload}
            variant="primary"
            disabled={isDownloading}
            className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
          >
            {isDownloading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Descargando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Descargar PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Mensaje de éxito */}
      {downloadSuccess && (
        <div className="mt-3 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">
              ¡Certificado descargado exitosamente!
            </span>
          </div>
        </div>
      )}

      {/* Mensaje de error */}
      {downloadError && (
        <div className="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">
              {downloadError}
            </span>
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="mt-3 text-xs text-gray-500">
        <p>• El certificado será descargado como archivo PDF</p>
        <p>• Guarda el archivo en un lugar seguro para futuras referencias</p>
        <p>• Si tienes problemas con la descarga, contacta al administrador</p>
      </div>
    </div>
  );
};

export default CertificateDownload;