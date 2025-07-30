import { useState } from 'react';
import Button from '../common/Button';
import StatusBadge from './common/StatusBadge';
import StatusUpdater from './StatusUpdater';
import LoadingSpinner from '../common/LoadingSpinner';
import { API_BASE_URL } from '../../utils/constants';

const RequestManagement = ({ request, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const handleDownloadDocument = async (documentPath) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}${documentPath}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al descargar el documento');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documento-${request.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Error al descargar el documento');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Detalles de la Solicitud
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'actions'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Acciones
          </button>
        </nav>
      </div>

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="space-y-6">
          {/* Request Header */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Solicitud #{request.id}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Creada el {formatDate(request.createdAt)}
                </p>
              </div>
              <StatusBadge status={request.status} />
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Información Personal</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                <p className="mt-1 text-sm text-gray-900">{request.fullName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{request.user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Número de Identificación</label>
                <p className="mt-1 text-sm text-gray-900">{request.identificationNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo de Certificado</label>
                <p className="mt-1 text-sm text-gray-900">{request.certificateType}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                <p className="mt-1 text-sm text-gray-900">{request.phoneNumber || 'No proporcionado'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Dirección</label>
                <p className="mt-1 text-sm text-gray-900">{request.address || 'No proporcionada'}</p>
              </div>
            </div>
            
            {request.additionalInfo && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Información Adicional</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded">
                  {request.additionalInfo}
                </p>
              </div>
            )}
          </div>

          {/* Document */}
          {request.documentPath && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Documento Adjunto</h4>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Documento de Respaldo</p>
                    <p className="text-sm text-gray-500">PDF • Subido el {formatDate(request.createdAt)}</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleDownloadDocument(request.documentPath)}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                >
                  {loading ? 'Descargando...' : 'Descargar'}
                </Button>
              </div>
            </div>
          )}

          {/* Status History */}
          {request.statusHistory && request.statusHistory.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Historial de Estados</h4>
              <div className="flow-root">
                <ul className="-mb-8">
                  {request.statusHistory.map((history, index) => (
                    <li key={index}>
                      <div className="relative pb-8">
                        {index !== request.statusHistory.length - 1 && (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                              <StatusBadge status={history.status} size="sm" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                Estado cambiado a <span className="font-medium text-gray-900">{history.status}</span>
                              </p>
                              {history.comment && (
                                <p className="mt-1 text-sm text-gray-600">{history.comment}</p>
                              )}
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
          )}
        </div>
      )}

      {/* Actions Tab */}
      {activeTab === 'actions' && (
        <div className="space-y-6">
          <StatusUpdater request={request} onUpdate={onClose} />
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
        <Button onClick={onClose} variant="outline">
          Cerrar
        </Button>
      </div>
    </div>
  );
};

export default RequestManagement;