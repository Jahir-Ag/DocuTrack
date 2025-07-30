import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StatusBadge from './common/StatusBadge';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import CertificateDownload from './CertificateDownload';
import { useRequests } from '../../hooks/useRequests';
import { useDownload } from '../../hooks/useDownload';
import { useAuth } from '../../hooks/useAuth';
import { formatDate, formatDateTime, formatCertificateType, formatRequestId } from '../../utils/formatters';

const RequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getRequestById, updateRequestStatus } = useRequests();
  const { downloadDocument } = useDownload();
  
  const [request, setRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [adminComments, setAdminComments] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const isAdmin = user?.role === 'ADMIN';
  const canEditStatus = isAdmin && request?.status !== 'ISSUED';

  useEffect(() => {
    loadRequest();
  }, [id]);

  const loadRequest = async () => {
    try {
      setIsLoading(true);
      const result = await getRequestById(id);
      if (result.success) {
        setRequest(result.data);
      } else {
        setError(result.error || 'Error al cargar la solicitud');
      }
    } catch (err) {
      setError('Error inesperado al cargar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) return;

    try {
      setIsUpdating(true);
      const result = await updateRequestStatus(id, newStatus, adminComments);
      
      if (result.success) {
        setRequest(prev => ({
          ...prev,
          status: newStatus,
          adminComments: adminComments || prev.adminComments,
          updatedAt: new Date().toISOString()
        }));
        setShowStatusModal(false);
        setNewStatus('');
        setAdminComments('');
      } else {
        alert('Error al actualizar el estado: ' + (result.error || 'Error desconocido'));
      }
    } catch (err) {
      alert('Error inesperado al actualizar el estado');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadDocument = async () => {
    if (request?.documentPath) {
      await downloadDocument(request.documentPath, `documento-${request.id}.pdf`);
    }
  };

  const getStatusHistory = () => {
    // Esto sería ideal tenerlo en el backend, pero por simplicidad lo simulamos
    const history = [
      {
        status: 'PENDING',
        date: request?.createdAt,
        description: 'Solicitud creada'
      }
    ];

    if (request?.status !== 'PENDING') {
      history.push({
        status: request?.status,
        date: request?.updatedAt,
        description: getStatusDescription(request?.status)
      });
    }

    return history;
  };

  const getStatusDescription = (status) => {
    const descriptions = {
      'IN_REVIEW': 'Solicitud en revisión',
      'APPROVED': 'Solicitud aprobada',
      'REJECTED': 'Solicitud rechazada',
      'ISSUED': 'Certificado emitido',
      'NEEDS_CORRECTION': 'Requiere correcciones'
    };
    return descriptions[status] || status;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 inline-block">
          <p className="text-red-600">{error || 'Solicitud no encontrada'}</p>
          <Button 
            onClick={() => navigate(-1)}
            variant="primary"
            size="sm" 
            className="mt-2"
          >
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {formatRequestId(request.id)}
              </h1>
              <StatusBadge status={request.status} size="lg" />
            </div>
            <p className="text-gray-600">
              {formatCertificateType(request.certificateType)}
            </p>
          </div>
          <div className="flex space-x-2">
            {canEditStatus && (
              <Button
                onClick={() => setShowStatusModal(true)}
                variant="secondary"
              >
                Actualizar Estado
              </Button>
            )}
            <Button
              onClick={() => navigate(-1)}
              variant="secondary"
            >
              Volver
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos del solicitante */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Información del Solicitante
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
                <p className="text-sm text-gray-900">{request.firstName} {request.lastName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
                <p className="text-sm text-gray-900">{request.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                <p className="text-sm text-gray-900">{request.phone || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cédula</label>
                <p className="text-sm text-gray-900">{request.cedula}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de nacimiento</label>
                <p className="text-sm text-gray-900">{formatDate(request.birthDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de solicitud</label>
                <p className="text-sm text-gray-900">{formatDateTime(request.createdAt)}</p>
              </div>
            </div>
            
            {request.address && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Dirección</label>
                <p className="text-sm text-gray-900">{request.address}</p>
              </div>
            )}
          </div>

          {/* Detalles de la solicitud */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Detalles de la Solicitud
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Motivo de la solicitud</label>
                <p className="text-sm text-gray-900 mt-1">{request.reason}</p>
              </div>
              
              {request.additionalInfo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Información adicional</label>
                  <p className="text-sm text-gray-900 mt-1">{request.additionalInfo}</p>
                </div>
              )}

              {request.adminComments && (
                <div className="p-4 bg-blue-50 rounded-md">
                  <label className="block text-sm font-medium text-blue-800">Comentarios del administrador</label>
                  <p className="text-sm text-blue-700 mt-1">{request.adminComments}</p>
                </div>
              )}
            </div>
          </div>

          {/* Documentos */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Documentos
            </h2>
            
            <div className="space-y-3">
              {request.documentPath && (
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center space-x-3">
                    <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Documento de identidad</p>
                      <p className="text-xs text-gray-500">Documento adjunto por el solicitante</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleDownloadDocument}
                    variant="secondary"
                    size="sm"
                  >
                    Descargar
                  </Button>
                </div>
              )}

              {request.status === 'ISSUED' && (
                <CertificateDownload requestId={request.id} />
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Historial de estado */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Historial
            </h2>
            
            <div className="space-y-3">
              {getStatusHistory().map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.description}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(item.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Información técnica */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Información Técnica
            </h2>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ID:</span>
                <span className="text-gray-900">{request.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Creado:</span>
                <span className="text-gray-900">{formatDateTime(request.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Actualizado:</span>
                <span className="text-gray-900">{formatDateTime(request.updatedAt)}</span>
              </div>
              {request.userId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Usuario ID:</span>
                  <span className="text-gray-900">{request.userId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para actualizar estado */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Actualizar Estado de Solicitud"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Nuevo Estado
            </label>
            <select
              id="status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar estado</option>
              <option value="IN_REVIEW">En Revisión</option>
              <option value="APPROVED">Aprobado</option>
              <option value="REJECTED">Rechazado</option>
              <option value="NEEDS_CORRECTION">Necesita Corrección</option>
              <option value="ISSUED">Emitido</option>
            </select>
          </div>

          <div>
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
              Comentarios {(newStatus === 'REJECTED' || newStatus === 'NEEDS_CORRECTION') && '*'}
            </label>
            <textarea
              id="comments"
              value={adminComments}
              onChange={(e) => setAdminComments(e.target.value)}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Agrega comentarios sobre esta actualización..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={() => setShowStatusModal(false)}
              variant="secondary"
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleStatusUpdate}
              variant="primary"
              disabled={!newStatus || isUpdating}
            >
              {isUpdating ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RequestDetails;