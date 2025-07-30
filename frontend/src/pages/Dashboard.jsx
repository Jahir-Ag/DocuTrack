import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useRequests } from '../hooks/useRequests';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import RequestCard from '../components/requests/RequestCard';



const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requests, loading, loadRequests } = useRequests();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (requests.length > 0) {
      const newStats = {
        total: requests.length,
        pending: requests.filter(r => ['RECIBIDO', 'EN_VALIDACION'].includes(r.status)).length,
        approved: requests.filter(r => ['APROBADO', 'EMITIDO'].includes(r.status)).length,
        rejected: requests.filter(r => ['RECHAZADO', 'CORRECCION_REQUERIDA'].includes(r.status)).length
      };
      setStats(newStats);
    }
  }, [requests]);

  const getRecentRequests = () => {
    return requests
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">
            {getGreeting()}, {user?.name || 'Usuario'}
          </h1>
          <p className="text-blue-100 text-lg">
            Bienvenido a DocuTrack. Aquí puedes gestionar todas tus solicitudes de certificados.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/new-request')}
        >
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Nueva Solicitud</h3>
              <p className="text-gray-600 text-sm">Crear certificado</p>
            </div>
          </div>
        </div>

        <div 
          className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/my-requests')}
        >
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Mis Solicitudes</h3>
              <p className="text-gray-600 text-sm">Ver todas</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">En Proceso</h3>
              <p className="text-gray-600 text-sm">{stats.pending} solicitudes</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Total</h3>
              <p className="text-gray-600 text-sm">{stats.total} solicitudes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <StatusBadge status="EN_VALIDACION" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aprobadas</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <StatusBadge status="APROBADO" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rechazadas</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <StatusBadge status="RECHAZADO" />
          </div>
        </div>
      </div>

      {/* Recent Requests */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Solicitudes Recientes</h2>
            <Button
              variant="secondary"
              onClick={() => navigate('/my-requests')}
            >
              Ver todas
            </Button>
          </div>
        </div>
        
        <div className="p-6">
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No tienes solicitudes</h3>
              <p className="mt-2 text-gray-600">Comienza creando tu primera solicitud de certificado.</p>
              <div className="mt-6">
                <Button
                  variant="primary"
                  onClick={() => navigate('/new-request')}
                >
                  Crear Primera Solicitud
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {getRecentRequests().map((request) => (
                <RequestCard 
                  key={request.id} 
                  request={request}
                  onClick={() => navigate(`/request/${request.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-blue-900">¿Necesitas ayuda?</h3>
            <div className="mt-2 text-blue-800">
              <p>
                Si tienes alguna pregunta sobre el proceso de solicitud o el estado de tu certificado, 
                no dudes en contactarnos.
              </p>
            </div>
            <div className="mt-4">
              <Button variant="secondary" size="sm">
                Contactar Soporte
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;