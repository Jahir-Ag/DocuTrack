import React, { useState } from 'react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { REQUEST_STATUS } from '../../utils/constants';
import { requestService } from '../../services/requestService';

const StatusUpdater = ({ request, onStatusUpdated }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [comments, setComments] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const getAvailableStatuses = () => {
    const statuses = [];
    
    switch (request.status) {
      case REQUEST_STATUS.RECEIVED:
        statuses.push(
          { value: REQUEST_STATUS.IN_VALIDATION, label: 'En Validación', color: 'bg-blue-600' },
          { value: REQUEST_STATUS.REJECTED, label: 'Rechazar', color: 'bg-red-600' }
        );
        break;
        
      case REQUEST_STATUS.IN_VALIDATION:
        statuses.push(
          { value: REQUEST_STATUS.APPROVED, label: 'Aprobar', color: 'bg-green-600' },
          { value: REQUEST_STATUS.REJECTED, label: 'Rechazar', color: 'bg-red-600' },
          { value: REQUEST_STATUS.CORRECTION_REQUIRED, label: 'Pedir Corrección', color: 'bg-yellow-600' }
        );
        break;
        
      case REQUEST_STATUS.CORRECTION_REQUIRED:
        statuses.push(
          { value: REQUEST_STATUS.IN_VALIDATION, label: 'Continuar Validación', color: 'bg-blue-600' },
          { value: REQUEST_STATUS.REJECTED, label: 'Rechazar', color: 'bg-red-600' }
        );
        break;
        
      default:
        break;
    }
    
    return statuses;
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setIsModalOpen(true);
    setComments('');
    setError('');
  };

  const handleConfirm = async () => {
    if (!selectedStatus) return;

    try {
      setUpdating(true);
      setError('');
      
      await requestService.updateRequestStatus(request.id, selectedStatus, comments);
      
      // Notify parent component
      if (onStatusUpdated) {
        onStatusUpdated(request.id, selectedStatus);
      }
      
      setIsModalOpen(false);
      setSelectedStatus('');
      setComments('');
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Error al actualizar el estado. Por favor, inténtalo de nuevo.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedStatus('');
    setComments('');
    setError('');
  };

  const getStatusLabel = (status) => {
    const statusObj = getAvailableStatuses().find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  };

  const getStatusColor = (status) => {
    const statusObj = getAvailableStatuses().find(s => s.value === status);
    return statusObj ? statusObj.color : 'bg-gray-600';
  };

  const availableStatuses = getAvailableStatuses();

  if (availableStatuses.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-500">
          No hay acciones disponibles para el estado actual.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Cambiar Estado de la Solicitud
      </h3>
      
      {availableStatuses.map((status) => (
        <Button
          key={status.value}
          onClick={() => handleStatusChange(status.value)}
          className={`w-full ${status.color} hover:opacity-90`}
          disabled={updating}
        >
          {status.label}
        </Button>
      ))}

      {/* Confirmation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCancel}
        title={`Confirmar cambio de estado`}
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Solicitud:</strong> #{request.id}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Estado actual:</strong> {request.status}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Nuevo estado:</strong> {getStatusLabel(selectedStatus)}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentarios {selectedStatus === REQUEST_STATUS.REJECTED || selectedStatus === REQUEST_STATUS.CORRECTION_REQUIRED ? '(requerido)' : '(opcional)'}
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder={
                selectedStatus === REQUEST_STATUS.REJECTED 
                  ? "Especifica los motivos del rechazo..."
                  : selectedStatus === REQUEST_STATUS.CORRECTION_REQUIRED
                  ? "Describe las correcciones necesarias..."
                  : "Agrega comentarios adicionales (opcional)..."
              }
              required={selectedStatus === REQUEST_STATUS.REJECTED || selectedStatus === REQUEST_STATUS.CORRECTION_REQUIRED}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={updating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              className={`${getStatusColor(selectedStatus)} hover:opacity-90`}
              disabled={updating || (
                (selectedStatus === REQUEST_STATUS.REJECTED || selectedStatus === REQUEST_STATUS.CORRECTION_REQUIRED) 
                && !comments.trim()
              )}
            >
              {updating ? 'Actualizando...' : 'Confirmar Cambio'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StatusUpdater;