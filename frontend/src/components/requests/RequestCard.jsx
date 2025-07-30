import React from 'react';
import StatusBadge from "../common/StatusBadge";
import Button from '../common/Button';
import { formatDate, formatCertificateType, formatRequestId } from '../../utils/formatters';
import { useDownload } from '../../hooks/useDownload';

const RequestCard = ({ request, onClick, isAdmin = false }) => {
  const { downloadCertificate, isDownloading } = useDownload();

  const handleDownload = async (e) => {
    e.stopPropagation(); // Evitar que se active el onClick del card
    await downloadCertificate(request.id, `certificado-${request.id}.pdf`);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'IN_REVIEW':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'APPROVED':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'ISSUED':
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
          </svg>
        );
      case 'REJECTED':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'NEEDS_CORRECTION':
        return (
          <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const canDownload = request.status === 'ISSUED' && request.certificatePath;

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header con ID y estado */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {formatRequestId(request.id)}
              </h3>
              <div className="flex items-center space-x-2">
                {getStatusIcon(request.status)}
                <StatusBadge status={request.status} />
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {formatDate(request.createdAt)}
            </div>
          </div>

          {/* Información del solicitante */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {request.firstName} {request.lastName}
                </p>
                <p className="text-sm text-gray-500">{request.email}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {formatCertificateType(request.certificateType)}
                </p>
                {request.phone && (
                  <p className="text-sm text-gray-500">{request.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Motivo de la solicitud (truncado) */}
          {request.reason && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 line-clamp-2">
                <span className="font-medium">Motivo:</span> {request.reason}
              </p>
            </div>
          )}

          {/* Comentarios del admin (si existen) */}
          {request.adminComments && (
            <div className="mb-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Comentarios del administrador:</span>
              </p>
              <p className="text-sm text-blue-700 mt-1">{request.adminComments}</p>
            </div>
          )}

          {/* Información adicional para admin */}
          {isAdmin && (
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
              <div>
                <span className="font-medium">Cédula:</span> {request.cedula}
              </div>
              <div>
                <span className="font-medium">Fecha de nacimiento:</span> {formatDate(request.birthDate)}
              </div>
              {request.address && (
                <div className="col-span-2">
                  <span className="font-medium">Dirección:</span> {request.address}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>Actualizado: {formatDate(request.updatedAt)}</span>
          {request.documentPath && (
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
              </svg>
              Documento adjunto
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {canDownload && (
            <Button
              onClick={handleDownload}
              variant="primary"
              size="sm"
              disabled={isDownloading}
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
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Descargar
                </>
              )}
            </Button>
          )}
          
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            variant="secondary"
            size="sm"
          >
            Ver detalles
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RequestCard;