import React, { useState } from 'react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusBadge from './common/StatusBadge';

const StatusUpdater = ({ request, onStatusUpdate, isOpen, onClose }) => {
  const [newStatus, setNewStatus] = useState(request?.status || '');
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const statusOptions = [
    { value: 'RECIBIDO', label: 'Recibido', color: 'blue' },
    { value: 'EN_VALIDACION', label: 'En Validación', color: 'yellow' },
    { value: 'APROBADO', label: 'Aprobado', color: 'green' },
    { value: 'RECHAZADO', label: 'Rechazado', color: 'red' },
    { value: 'CORRECCION_REQUERIDA', label: 'Corrección Requerida', color: 'orange' },
    { value: 'EMITIDO', label: 'Emitido', color: 'green' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newStatus) {
      alert('Por favor selecciona un estado');
      return;
    }

    setIsLoading(true);
    
    try {
      await onStatusUpdate(request.id, {
        status: newStatus,
        comment: comment.trim()
      });
      
      setComment('');
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNewStatus(request?.status || '');
    setComment('');
    onClose();
  };

  if (!request) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Actualizar Estado de Solicitud">
      <div className="space-y-6">
        {/* Request Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Solicitud ID:</span>
              <p className="text-gray-900">#{request.id}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Solicitante:</span>
              <p className="text-gray-900">{request.user?.name || 'N/A'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Tipo:</span>
              <p className="text-gray-900">{request.certificateType}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Estado Actual:</span>
              <div className="mt-1">
                <StatusBadge status={request.status} />
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nuevo Estado
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Seleccionar estado...</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Preview */}
          {newStatus && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Vista previa:</span>
              <StatusBadge status={newStatus} />
            </div>
          )}

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentario (Opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Agregar comentario sobre el cambio de estado..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !newStatus}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Actualizando...
                </>
              ) : (
                'Actualizar Estado'
              )}
            </Button>
          </div>
        </form>

        {/* Status Change Confirmation */}
        {newStatus && newStatus !== request.status && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Cambio de Estado
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    El estado cambiará de <strong>{request.status}</strong> a <strong>{newStatus}</strong>.
                    {newStatus === 'EMITIDO' && (
                      <span className="block mt-1 font-medium">
                        ⚠️ Al marcar como "Emitido", se generará automáticamente el certificado para descarga.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default StatusUpdater;