import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useRequests } from '../../hooks/useRequests';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import { formatDate } from '../../utils/formatters';
import { REQUEST_STATUS } from '../../utils/constants';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { requests, loading, error, fetchAllRequests } = useRequests();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inValidation: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchAllRequests();
    }
  }, [user, fetchAllRequests]);

  useEffect(() => {
    if (requests.length > 0) {
      const newStats = requests.reduce((acc, request) => {
        acc.total++;
        switch (request.status) {
          case REQUEST_STATUS.RECEIVED:
            acc.pending++;
            break;
          case REQUEST_STATUS.IN_VALIDATION:
            acc.inValidation++;
            break;
          case REQUEST_STATUS.APPROVED:
            acc.approved++;
            break;
          case REQUEST_STATUS.REJECTED:
            acc.rejected++;
            break;
          default:
            break;
        }
        return acc;
      }, { total: 0, pending: 0, inValidation: 0, approved: 0, rejected: 0 });
      
      setStats(newStats);
    }
  }, [requests]);

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
          <Button onClick={() => fetchAllRequests()}>Reintentar</Button>
        </div>
      </div>
    );
  }

  const getRecentRequests = () => {
    return requests
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  };

  const StatCard = ({ title, value, color, bgColor }) => (
    <div className={`${bgColor} rounded-lg shadow p-6`}>
      <div className="flex items-center">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            {title}
          </h3>
          <p className={`mt-2 text-3xl font-bold ${color}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Panel de Administración
              </h1>
              <p className="mt-2 text-gray-600">
                Bienvenido, {user.name}. Gestiona las solicitudes de certificados.
              </p>
            </div>
            <Button 
              onClick={() => navigate('/admin/requests')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Ver Todas las Solicitudes
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard
            title="Total"
            value={stats.total}
            color="text-gray-900"
            bgColor="bg-white"
          />
          <StatCard
            title="Pendientes"
            value={stats.pending}
            color="text-yellow-600"
            bgColor="bg-yellow-50"
          />
          <StatCard
            title="En Validación"
            value={stats.inValidation}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <StatCard
            title="Aprobadas"
            value={stats.approved}
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <StatCard
            title="Rechazadas"
            value={stats.rejected}
            color="text-red-600"
            bgColor="bg-red-50"
          />
        </div>

        {/* Recent Requests */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Solicitudes Recientes
              </h2>
              <Button
                onClick={() => navigate('/admin/requests')}
                variant="outline"
                size="sm"
              >
                Ver Todas
              </Button>
            </div>
          </div>
          
          <div className="overflow-hidden">
            {getRecentRequests().length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No hay solicitudes disponibles.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Solicitante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo de Certificado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getRecentRequests().map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {request.user?.name?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {request.user?.name || 'Usuario'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {request.certificateType}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          onClick={() => navigate(`/admin/requests/${request.id}`)}
                          variant="outline"
                          size="sm"
                        >
                          Ver Detalles
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;