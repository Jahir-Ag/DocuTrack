import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDownload } from '../hooks/useDownload';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import CertificateDownload from '../components/requests/CertificateDownload';
import { requestService } from '../services/requestService';
import { formatDate, formatFileSize } from '../utils/formatters';

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { downloadCertificate, downloading } = useDownload();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);

  useEffect(() => {
    fetchRequestDetail();
  }, [id]);

  const fetchRequestDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await requestService.getRequestById(id);
      setRequest(response.data);
      
      // Simular historial de estados (en un caso real vendría del backend)
      const mockHistory = [
        {
          status: 'RECIBIDO',
          date: response.data.createdAt,
          comment: 'Solicitud recibida correctamente'
        }
      ];
      
      if (response.data.status !== 'RECIBIDO') {
        mockHistory.push({
          status: response.data.status,
          date: response.data.updatedAt,
          comment: 'Estado actualizado por el administrador'
        });
      }
      
      setStatusHistory(mockHistory);
    } catch (error) {
      console.error('Error fetching request detail:', error);
      setError('Error al cargar los detalles de la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = async () => {
    try {
      await downloadCertificate(request.id);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Error al descargar el certificado');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'RECIBIDO': 'blue',
      'EN_VALIDACION': 'yellow',
      'APROBADO': 'green',
      'RECHAZADO': 'red',
      'CORRECCION_REQUERIDA': 'orange',
      'EMITIDO': 'green'
    };
    return colors[status] || 'gray';
  };

  const getStatusDescription = (status) => {
    const descriptions = {
      'RECIBIDO': 'Tu solicitud ha sido recibida y está en cola para revisión.',
      'EN_VALIDACION': 'Nuestro equipo está revisando tu solicitud y los documentos adjuntos.',
      'APROBADO': 'Tu solicitud ha sido aprobada. El certificado será generado pronto.',
      'RECHAZADO': 'Tu solicitud ha sido rechazada. Revisa los comentarios para más información.',
      'CORRECCION_REQUERIDA': 'Se requieren correcciones en tu solicitud. Revisa los comentarios.',
      'EMITIDO': 'Tu certificado ha sido emitido y está listo para descargar.'
    };
    return descriptions[status] || 'Estado desconocido';
  };

  const getCertificateTypeTitle = (type) => {
    const titles = {
      'NACIMIENTO': 'Certificado de Nacimiento',
      'ESTUDIOS': 'Certificado de Estudios',
      'RESIDENCIA': 'Certificado de Residencia',
      'ANTECEDENTES': 'Certificado de Antecedentes'
    };
    return titles[type] || type;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">Error al cargar la solicitud</h3>
        <p className="mt-2 text-gray-600">{error}</p>
        <div className="mt-6">
          <Button variant="primary" onClick={() => navigate('/my-requests')}>
            Volver a Mis Solicitudes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() => navigate('/my-requests')}
        >
          ← Volver a Mis Solicitudes
        </Button>
        
        {request.status === 'EMITIDO' && (
          <CertificateDownload
            requestId={request.id}
            certificateType={request.certificateType}
          />
        )}
      </div>

      {/* Request Overview */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {getCertificateTypeTitle(request.certificateType)}
              </h1>
              <p className="text-blue-100">Solicitud #{request.id}</p>
            </div>
            <div className="text-right">
              <StatusBadge status={request.status} size="lg" />
              <p className="text-blue-100 text-sm mt-2">
                Creada el {formatDate(request.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de la Solicitud</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-600">ID de Solicitud</dt>
                  <dd className="text-sm text-gray-900">#{request.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Tipo de Certificado</dt>
                  <dd className="text-sm text-gray-900">{getCertificateTypeTitle(request.certificateType)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Estado Actual</dt>
                  <dd className="text-sm">
                    <StatusBadge status={request.status} />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Fecha de Creación</dt>
                  <dd className="text-sm text-gray-900">{formatDate(request.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Última Actualización</dt>
                  <dd className="text-sm text-gray-900">{formatDate(request.updatedAt)}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos del Solicitante</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-600">Nombre Completo</dt>
                  <dd className="text-sm text-gray-900">{request.fullName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Documento de Identidad</dt>
                  <dd className="text-sm text-gray-900">{request.identityDocument}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Email</dt>
                  <dd className="text-sm text-gray-900">{request.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Teléfono</dt>
                  <dd className="text-sm text-gray-900">{request.phone}</dd>
                </div>
                {request.address && (
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Dirección</dt>
                    <dd className="text-sm text-gray-900">{request.address}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Status Description */}
      <div className={`rounded-lg p-6 border-l-4 ${
        request.status === 'EMITIDO' ? 'bg-green-50 border-green-400' :
        request.status === 'RECHAZADO' ? 'bg-red-50 border-red-400' :
        request.status === 'CORRECCION_REQUERIDA' ? 'bg-orange-50 border-orange-400' :
        'bg-blue-50 border-blue-400'
      }`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {request.status === 'EMITIDO' ? (
              <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : request.status === 'RECHAZADO' ? (
              <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="ml-3">
            <h3 className={`text-lg font-medium ${
              request.status === 'EMITIDO' ? 'text-green-800' :
              request.status === 'RECHAZADO' ? 'text-red-800' :
              request.status === 'CORRECCION_REQUERIDA' ? 'text-orange-800' :
              'text-blue-800'
            }`}>
              Estado: {request.status.replace('_', ' ')}
            </h3>
            <p className={`mt-1 ${
              request.status === 'EMITIDO' ? 'text-green-700' :
              request.status === 'RECHAZADO' ? 'text-red-700' :
              request.status === 'CORRECCION_REQUERIDA' ? 'text-orange-700' :
              'text-blue-700'
            }`}>
              {getStatusDescription(request.status)}
            </p>
          </div>
        </div>
      </div>

      {/* Documents Section */}
      {request.documents && request.documents.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Documentos Adjuntos</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {request.documents.map((doc, index) => (
                <div key={index} className="flex items-center p-4 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-900">{doc.originalName || `Documento ${index + 1}`}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(doc.size || 0)}</p>
                  </div>
                  <button
                    onClick={() => window.open(`/api/documents/${doc.filename}`, '_blank')}
                    className="ml-4 text-blue-600 hover:text-blue-800"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status History */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Historial de Estados</h3>
        </div>
        <div className="p-6">
          <div className="flow-root">
            <ul className="-mb-8">
              {statusHistory.map((item, index) => (
                <li key={index}>
                  <div className="relative pb-8">
                    {index !== statusHistory.length - 1 && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                          getStatusColor(item.status) === 'green' ? 'bg-green-500' :
                          getStatusColor(item.status) === 'red' ? 'bg-red-500' :
                          getStatusColor(item.status) === 'yellow' ? 'bg-yellow-500' :
                          getStatusColor(item.status) === 'orange' ? 'bg-orange-500' :
                          'bg-blue-500'
                        }`}>
                          <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            Estado cambiado a <StatusBadge status={item.status} />
                          </p>
                          {item.comment && (
                            <p className="mt-1 text-sm text-gray-900">{item.comment}</p>
                          )}
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          {formatDate(item.date)}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Download Certificate Section */}
      {request.status === 'EMITIDO' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-green-800">
                ¡Tu certificado está listo!
              </h3>
              <p className="mt-1 text-green-700">
                Tu {getCertificateTypeTitle(request.certificateType).toLowerCase()} ha sido emitido y está disponible para descarga.
              </p>
            </div>
            <div className="ml-4">
              <Button
                variant="primary"
                onClick={handleDownloadCertificate}
                disabled={downloading}
                className="bg-green-600 hover:bg-green-700"
              >
                {downloading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Descargando...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Descargar Certificado
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Button
          variant="secondary"
          onClick={() => navigate('/my-requests')}
        >
          ← Volver a Mis Solicitudes
        </Button>
        
        <div className="flex gap-3">
          {request.status === 'CORRECCION_REQUERIDA' && (
            <Button
              variant="primary"
              onClick={() => navigate(`/edit-request/${request.id}`)}
            >
              Corregir Solicitud
            </Button>
          )}
          
          <Button
            variant="secondary"
            onClick={() => window.print()}
          >
            Imprimir Detalles
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RequestDetail;
              