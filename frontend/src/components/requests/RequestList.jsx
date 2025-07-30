import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RequestCard from './RequestCard';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import { useRequests } from '../../hooks/useRequests';
import { formatStatus } from '../../utils/formatters';
import { REQUEST_STATUS } from '../../utils/constants';

const RequestList = ({ isAdmin = false, showFilters = true }) => {
  const navigate = useNavigate();
  const { requests, isLoading, error, fetchRequests, fetchAllRequests } = useRequests();
  
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: ''
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    // Cargar solicitudes según el tipo de usuario
    if (isAdmin) {
      fetchAllRequests();
    } else {
      fetchRequests();
    }
  }, [isAdmin]);

  useEffect(() => {
    // Filtrar y ordenar solicitudes
    let filtered = [...requests];

    // Aplicar filtros
    if (filters.status) {
      filtered = filtered.filter(request => request.status === filters.status);
    }

    if (filters.type) {
      filtered = filtered.filter(request => request.certificateType === filters.type);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(request => 
        request.firstName?.toLowerCase().includes(searchLower) ||
        request.lastName?.toLowerCase().includes(searchLower) ||
        request.email?.toLowerCase().includes(searchLower) ||
        request.id.toString().includes(searchLower)
      );
    }

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredRequests(filtered);
  }, [requests, filters, sortBy, sortOrder]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      type: '',
      search: ''
    });
  };

  const handleRequestClick = (requestId) => {
    navigate(`/request/${requestId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 inline-block">
          <p className="text-red-600">Error al cargar las solicitudes: {error}</p>
          <Button 
            onClick={() => isAdmin ? fetchAllRequests() : fetchRequests()}
            variant="primary"
            size="sm" 
            className="mt-2"
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros y búsqueda */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <input
                type="text"
                id="search"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Nombre, email o ID..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtro por estado */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los estados</option>
                {Object.entries(REQUEST_STATUS).map(([key, value]) => (
                  <option key={key} value={key}>{formatStatus(key)}</option>
                ))}
              </select>
            </div>

            {/* Ordenar por */}
            <div>
              <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
                Ordenar por
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="createdAt">Fecha de creación</option>
                <option value="updatedAt">Última actualización</option>
                <option value="status">Estado</option>
                <option value="certificateType">Tipo de certificado</option>
              </select>
            </div>

            {/* Botones de acción */}
            <div className="flex items-end space-x-2">
              <Button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                variant="secondary"
                size="sm"
                className="flex-1"
              >
                {sortOrder === 'asc' ? '↑' : '↓'} {sortOrder === 'asc' ? 'Asc' : 'Desc'}
              </Button>
              <Button
                onClick={clearFilters}
                variant="secondary"
                size="sm"
                className="flex-1"
              >
                Limpiar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-blue-600">{requests.length}</div>
          <div className="text-sm text-gray-600">Total de solicitudes</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {requests.filter(r => r.status === 'PENDING').length}
          </div>
          <div className="text-sm text-gray-600">Pendientes</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-green-600">
            {requests.filter(r => r.status === 'APPROVED' || r.status === 'ISSUED').length}
          </div>
          <div className="text-sm text-gray-600">Aprobadas</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-red-600">
            {requests.filter(r => r.status === 'REJECTED').length}
          </div>
          <div className="text-sm text-gray-600">Rechazadas</div>
        </div>
      </div>

      {/* Lista de solicitudes */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay solicitudes
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.search || filters.status || filters.type
                ? 'No se encontraron solicitudes que coincidan con los filtros aplicados.'
                : isAdmin 
                  ? 'Aún no hay solicitudes en el sistema.'
                  : 'Aún no has creado ninguna solicitud.'
              }
            </p>
            {!isAdmin && (
              <div className="mt-6">
                <Button
                  onClick={() => navigate('/new-request')}
                  variant="primary"
                >
                  Crear primera solicitud
                </Button>
              </div>
            )}
          </div>
        ) : (
          filteredRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onClick={() => handleRequestClick(request.id)}
              isAdmin={isAdmin}
            />
          ))
        )}
      </div>

      {/* Paginación (implementar si es necesario) */}
      {filteredRequests.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Mostrando {filteredRequests.length} de {requests.length} solicitudes
        </div>
      )}
    </div>
  );
};

export default RequestList;