import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { formatDate } from '../../utils/formatters';
import { REQUEST_STATUS } from '../../utils/constants';
import { requestService } from '../../services/requestService';

const AdminRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [comments, setComments] = useState('');

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchRequestDetail();
    }
  }, [id, user]);

  const fetchRequestDetail = async () => {
    try {
      setLoading(true);
      const response = await requestService.getAdminRequestById(id);
      console.log('✅ Request detail loaded:', response.data.request);
      setRequest(response.data.request);
      
    } catch (error) {
      console.error('Error fetching request detail:', error);
      setError('Error al cargar los detalles de la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus, actionComments = '') => {
    try {
      setUpdating(true);
      await requestService.updateRequestStatus(id, newStatus, actionComments);
      await fetchRequestDetail(); // Reload the request data
      setShowModal(false);
      setComments('');
      setModalAction(null);
    } catch (error) {
      console.error('Error updating request status:', error);
      setError('Error al actualizar el estado de la solicitud');
    } finally {
      setUpdating(false);
    }
  };

  const openModal = (action) => {
    setModalAction(action);
    setShowModal(true);
    setComments('');
  };

  const confirmAction = () => {
    if (modalAction) {
      handleStatusUpdate(modalAction.status, comments);
    }
  };

  const downloadDocument = async () => {
    try {
      await requestService.downloadDocument(id);
    } catch (error) {
      console.error('Error downloading document:', error);
      setError('Error al descargar el documento');
    }
  };

  const getActionButtons = () => {
    if (!request) return null;

    const actions = [];

    switch (request.status) {
      case 'RECIBIDO':
        actions.push(
          {
            label: 'Iniciar Validación',
            status: 'EN_VALIDACION',
            color: 'bg-blue-600 hover:bg-blue-700',
            description: 'Marcar como en proceso de validación'
          },
          {
            label: 'Rechazar',
            status: 'RECHAZADO',
            color: 'bg-red-600 hover:bg-red-700',
            description: 'Rechazar la solicitud'
          }
        );
        break;

      case 'EN_VALIDACION':
        actions.push(
          {
            label: 'Aprobar',
            status: 'APROBADO',
            color: 'bg-green-600 hover:bg-green-700',
            description: 'Aprobar y generar certificado'
          },
          {
            label: 'Rechazar',
            status: 'RECHAZADO',
            color: 'bg-red-600 hover:bg-red-700',
            description: 'Rechazar la solicitud'
          },
          {
            label: 'Observar',
            status: 'OBSERVADO',
            color: 'bg-yellow-600 hover:bg-yellow-700',
            description: 'Marcar con observaciones'
          }
        );
        break;

      case 'APROBADO':
        actions.push(
          {
            label: 'Marcar como Emitido',
            status: 'EMITIDO',
            color: 'bg-green-600 hover:bg-green-700',
            description: 'Marcar certificado como emitido'
          }
        );
        break;

      default:
        break;
    }

    return actions;
  };

  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">No tienes permisos para acceder a esta página.</p>
          <Button onClick={() => navigate('/')}>Volver al Inicio</Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => fetchRequestDetail()}>Reintentar</Button>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Solicitud no encontrada</h2>
          <p className="text-gray-600 mb-4">La solicitud que buscas no existe.</p>
          <Button onClick={() => navigate('/admin/requests')}>Volver a Solicitudes</Button>
        </div>
      </div>
    );
  }

  const actionButtons = getActionButtons();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Solicitud #{request.requestNumber || request.id.slice(-8)}
              </h1>
              <p className="mt-2 text-gray-600">
                Revisa y gestiona esta solicitud de certificado
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => navigate('/admin/requests')}
                variant="outline"
              >
                Volver a Solicitudes
              </Button>
            </div>
          </div>
        </div>

        {/* Request Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Details Card */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Información de la Solicitud
                </h2>
              </div>
              <div className="px-6 py-4">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">ID de Solicitud</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">#{request.requestNumber || request.id.slice(-8)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Estado Actual</dt>
                    <dd className="mt-1">
                      <StatusBadge status={request.status} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Tipo de Certificado</dt>
                    <dd className="mt-1 text-sm text-gray-900">{request.certificateType}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Urgencia</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        request.urgency === 'URGENTE' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {request.urgency}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Fecha de Solicitud</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(request.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Última Actualización</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(request.updatedAt)}</dd>
                  </div>
                </dl>
                
                {request.reason && (
                  <div className="mt-4">
                    <dt className="text-sm font-medium text-gray-500">Motivo</dt>
                    <dd className="mt-1 text-sm text-gray-900">{request.reason}</dd>
                  </div>
                )}
              </div>
            </div>

            {/* User Information Card */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Información del Solicitante
                </h2>
              </div>
              <div className="px-6 py-4">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 h-12 w-12">
                    <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-lg font-medium text-gray-700">
                        {(request.firstName || request.user?.firstName || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {`${request.firstName} ${request.lastName}` || `${request.user?.firstName} ${request.user?.lastName}` || 'Usuario'}
                    </h3>
                    <p className="text-sm text-gray-500">{request.email || request.user?.email}</p>
                  </div>
                </div>
                
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Nombre Completo</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {`${request.firstName} ${request.lastName}` || 'No disponible'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Cédula</dt>
                    <dd className="mt-1 text-sm text-gray-900">{request.cedula || 'No disponible'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Fecha de Nacimiento</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {request.birthDate ? formatDate(request.birthDate) : 'No disponible'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                    <dd className="mt-1 text-sm text-gray-900">{request.phone || 'No disponible'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{request.email || 'No disponible'}</dd>
                  </div>
                </dl>
                
                {request.address && (
                  <div className="mt-4">
                    <dt className="text-sm font-medium text-gray-500">Dirección</dt>
                    <dd className="mt-1 text-sm text-gray-900">{request.address}</dd>
                  </div>
                )}
                
                {request.additionalInfo && (
                  <div className="mt-4">
                    <dt className="text-sm font-medium text-gray-500">Información Adicional</dt>
                    <dd className="mt-1 text-sm text-gray-900">{request.additionalInfo}</dd>
                  </div>
                )}
              </div>
            </div>

            {/* Documents Card */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Documentos Adjuntos
                </h2>
              </div>
              <div className="px-6 py-4">
                {request.document ? (
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {request.document.originalName || 'Documento de Identidad'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {request.document.mimeType || 'PDF'} - {((request.document.fileSize || 0) / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={downloadDocument}
                      variant="outline"
                      size="sm"
                    >
                      Descargar
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No hay documentos adjuntos</p>
                )}
              </div>
            </div>

            {/* Status History Card */}
            {request.statusHistory && request.statusHistory.length > 0 && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">
                    Historial de Estados
                  </h2>
                </div>
                <div className="px-6 py-4">
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {request.statusHistory.map((history, index) => (
                        <li key={history.id}>
                          <div className="relative pb-8">
                            {index !== request.statusHistory.length - 1 && (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"></span>
                            )}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                  history.newStatus === 'APROBADO' ? 'bg-green-500' :
                                  history.newStatus === 'RECHAZADO' ? 'bg-red-500' :
                                  history.newStatus === 'EN_VALIDACION' ? 'bg-blue-500' :
                                  'bg-gray-500'
                                }`}>
                                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Estado cambiado de <StatusBadge status={history.oldStatus} size="sm" /> a <StatusBadge status={history.newStatus} size="sm" />
                                  </p>
                                  {history.comment && (
                                    <p className="mt-1 text-sm text-gray-700">{history.comment}</p>
                                  )}
                                  <p className="mt-1 text-xs text-gray-400">
                                    Por {history.changedBy ? `${history.changedBy.firstName} ${history.changedBy.lastName}` : 'Sistema'}
                                  </p>
                                </div>
                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                  {formatDate(history.createdAt)}
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
            )}
          </div>

          {/* Actions Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Acciones Disponibles
                </h2>
              </div>
              <div className="px-6 py-4">
                {actionButtons && actionButtons.length > 0 ? (
                  <div className="space-y-3">
                    {actionButtons.map((action, index) => (
                      <Button
                        key={index}
                        onClick={() => openModal(action)}
                        className={`w-full ${action.color}`}
                        disabled={updating}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No hay acciones disponibles para el estado actual.
                  </p>
                )}
              </div>
            </div>

            {/* Request Summary */}
            <div className="bg-white shadow rounded-lg mt-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Resumen
                </h2>
              </div>
              <div className="px-6 py-4">
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Tiempo transcurrido:</dt>
                    <dd className="text-sm text-gray-900">
                      {Math.ceil((new Date() - new Date(request.createdAt)) / (1000 * 60 * 60 * 24))} días
                    </dd>
                  </div>
                  {request.processedAt && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Procesado:</dt>
                      <dd className="text-sm text-gray-900">{formatDate(request.processedAt)}</dd>
                    </div>
                  )}
                  {request.completedAt && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Completado:</dt>
                      <dd className="text-sm text-gray-900">{formatDate(request.completedAt)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Action Confirmation Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={`Confirmar ${modalAction?.label}`}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {modalAction?.description}
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentarios (opcional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Agrega comentarios sobre esta acción..."
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                onClick={() => setShowModal(false)}
                variant="outline"
                disabled={updating}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmAction}
                className={modalAction?.color}
                disabled={updating}
              >
                {updating ? 'Procesando...' : `Confirmar ${modalAction?.label}`}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default AdminRequestDetail;