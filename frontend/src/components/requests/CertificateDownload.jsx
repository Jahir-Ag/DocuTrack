import { useState, useEffect } from 'react';
import { Download, FileCheck, AlertCircle, Eye, RefreshCw } from 'lucide-react';
import { certificateService } from '../../services/certificateService';
import { useAuth } from '../../hooks/useAuth';

const CertificateDownload = ({ requestId, requestNumber, status, className = '' }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [certificateInfo, setCertificateInfo] = useState(null);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Verificar disponibilidad del certificado al cargar
  useEffect(() => {
    if (status === 'EMITIDO') {
      checkCertificateAvailability();
    }
  }, [requestId, status]);

  const checkCertificateAvailability = async () => {
    try {
      const info = await certificateService.checkCertificate(requestId);
      setCertificateInfo(info);
    } catch (error) {
      console.error('Error verificando certificado:', error);
    }
  };

  const handleDownload = async () => {
    if (status !== 'EMITIDO') return;
    
    setIsDownloading(true);
    setError(null);
    
    try {
      await certificateService.downloadCertificate(requestId);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreview = async () => {
    if (!isAdmin) return;
    
    setIsPreviewing(true);
    setError(null);
    
    try {
      await certificateService.previewCertificate(requestId);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleRegenerate = async () => {
    if (!isAdmin) return;
    
    setIsRegenerating(true);
    setError(null);
    
    try {
      await certificateService.regenerateCertificate(requestId);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      // Recargar info del certificado
      await checkCertificateAvailability();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Si no está emitido, mostrar estado
  if (status !== 'EMITIDO') {
    const statusConfig = {
      'RECIBIDO': { color: 'text-blue-600', icon: '📋', text: 'Solicitud recibida' },
      'EN_VALIDACION': { color: 'text-yellow-600', icon: '🔍', text: 'En validación' },
      'OBSERVADO': { color: 'text-orange-600', icon: '⚠️', text: 'Con observaciones' },
      'APROBADO': { color: 'text-green-600', icon: '✅', text: 'Aprobado - Generando certificado' },
      'RECHAZADO': { color: 'text-red-600', icon: '❌', text: 'Solicitud rechazada' },
      'CANCELADO': { color: 'text-gray-600', icon: '🚫', text: 'Solicitud cancelada' }
    };

    const config = statusConfig[status] || { color: 'text-gray-500', icon: '❓', text: 'Estado desconocido' };

    return (
      <div className={`flex items-center p-3 bg-gray-50 rounded-lg ${className}`}>
        <span className="text-xl mr-3">{config.icon}</span>
        <div>
          <p className={`font-medium ${config.color}`}>{config.text}</p>
          <p className="text-sm text-gray-500">El certificado estará disponible cuando sea emitido</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Información del certificado */}
      {certificateInfo && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center mb-2">
            <FileCheck className="text-green-600 mr-2" size={18} />
            <span className="font-medium text-green-800">Certificado Disponible</span>
          </div>
          <div className="text-sm text-green-700 space-y-1">
            <p>📄 Archivo: {certificateInfo.certificate?.fileName}</p>
            {certificateInfo.certificate?.fileSize && (
              <p>📊 Tamaño: {(certificateInfo.certificate.fileSize / 1024).toFixed(1)} KB</p>
            )}
            <p>📅 Emitido: {new Date(certificateInfo.completedAt).toLocaleDateString('es-ES')}</p>
          </div>
        </div>
      )}

      {/* Mensajes de estado */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center">
            <AlertCircle className="text-red-600 mr-2" size={18} />
            <span className="text-red-800 font-medium">Error</span>
          </div>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      )}

      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center">
            <FileCheck className="text-green-600 mr-2" size={18} />
            <span className="text-green-800 font-medium">¡Éxito!</span>
          </div>
          <p className="text-green-700 text-sm mt-1">Operación completada correctamente</p>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-3">
        {/* Botón principal de descarga */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isDownloading ? (
            <>
              <div className="animate-spin mr-2">⏳</div>
              Descargando...
            </>
          ) : (
            <>
              <Download size={18} className="mr-2" />
              Descargar Certificado
            </>
          )}
        </button>

        {/* Botones para admins */}
        {isAdmin && (
          <>
            <button
              onClick={handlePreview}
              disabled={isPreviewing}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPreviewing ? (
                <>
                  <div className="animate-spin mr-2">⏳</div>
                  Cargando...
                </>
              ) : (
                <>
                  <Eye size={18} className="mr-2" />
                  Vista Previa
                </>
              )}
            </button>

            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRegenerating ? (
                <>
                  <div className="animate-spin mr-2">⏳</div>
                  Regenerando...
                </>
              ) : (
                <>
                  <RefreshCw size={18} className="mr-2" />
                  Regenerar
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Información adicional */}
      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
        <p>💡 <strong>Tip:</strong> Guarda tu certificado en un lugar seguro. Puedes descargarlo las veces que necesites.</p>
        {isAdmin && (
          <p className="mt-1">🔧 <strong>Admin:</strong> Usa "Vista Previa" para revisar antes de entregar, y "Regenerar" si hay cambios.</p>
        )}
      </div>
    </div>
  );
};

export default CertificateDownload;