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
      const response = await requestService.getRequestById(id);
      setRequest(response.data);
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

  const downloadDocument = async (documentPath) => {
    try {
      // This would typically be handled by your download service
      window.open(`${import.meta.env.VITE_API_URL}/uploads/${documentPath}`, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
      setError('Error al descargar el documento');
    }
  };

  const getActionButtons = () => {
    if (!request) return null;

    const actions = [];

    switch (request.status) {
      case REQUEST_STATUS.RECEIVED:
        actions.push(
          {
            label: 'Iniciar Validación',
            status: REQUEST_STATUS.IN_VALIDATION,
            color: 'bg-blue-600 hover:bg-blue-700',
            description: 'Marcar como en proceso de validación'
          },
          {
            label: 'Rechazar',
            status: REQUEST_STATUS.REJECTED,
            color: 'bg-red-600 hover:bg-red-700',
            description: 'Rechazar la solicitud'
          }
        );
        break;

      case REQUEST_STATUS.IN_VALIDATION:
        actions.push(
          {
            label: 'Aprobar',
            status: REQUEST_STATUS.APPROVED,
            color: 'bg-green-600 hover:bg-green-700',
            description: 'Aprobar y generar certificado'
          },
          {
            label: 'Rechazar',
            status: REQUEST_STATUS.REJECTED,
            color: 'bg-red-600 hover:bg-red-700',
            description: 'Rechazar la solicitud'
          },
          {
            label: 'Pedir Corrección',
            status: REQUEST_STATUS.CORRECTION_REQUIRED,
            color: 'bg-yellow-600 hover:bg-yellow-700',
            description: 'Solicitar correcciones al usuario'
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
                Detalle de Solicitud #{request.id}
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
                    <dd className="mt-1 text-sm text-gray-900 font-mono">#{request.id}</dd>
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
                    <dt className="text-sm font-medium text-gray-500">Fecha de Solicitud</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(request.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Última Actualización</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(request.updatedAt)}</dd>
                  </div>
                </dl>
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
                        {request.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {request.user?.name || 'Usuario'}
                    </h3>
                    <p className="text-sm text-gray-500">{request.user?.email}</p>
                  </div>
                </div>
                
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Nombre Completo</dt>
                    <dd className="mt-1 text-sm text-gray-900">{request.fullName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Número de Identificación</dt>
                    <dd className="mt-1 text-sm text-gray-900">{request.identificationNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Fecha de Nacimiento</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(request.dateOfBirth)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                    <dd className="mt-1 text-sm text-gray-900">{request.phoneNumber}</dd>
                  </div>
                </dl>
                
                {request.address && (
                  <div className="mt-4">
                    <dt className="text-sm font-medium text-gray-500">Dirección</dt>
                    <dd className="mt-1 text-sm text-gray-900">{request.address}</dd>
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
                {request.documentPath ? (
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          Documento de Identidad
                        </p>
                        <p className="text-sm text-gray-500">PDF</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => downloadDocument(request.documentPath)}
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

            {/* Comments/History Card */}
            {request.comments && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">
                    Comentarios Administrativos
                  </h2>
                </div>
                <div className="px-6 py-4">
                  <p className="text-sm text-gray-700">{request.comments}</p>
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
                
                {request.status === REQUEST_STATUS.APPROVED && request.certificatePath && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => downloadDocument(request.certificatePath)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Descargar Certificado
                    </Button>
                  </div>
                )}
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