import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRequests } from '../hooks/useRequests';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import RequestCard from '../components/requests/RequestCard';
import { formatDate } from '../utils/formatters';

const MyRequests = () => {
  const navigate = useNavigate();
  // ✅ CORREGIDO: Usar loadRequests en lugar de fetchRequests
  const { requests, loading, loadRequests, error } = useRequests();
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    certificateType: 'all',
    sortBy: 'newest'
  });
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ CORREGIDO: Ya no necesitas este useEffect porque loadRequests 
  // se ejecuta automáticamente en el hook useRequests
  // useEffect(() => {
  //   loadRequests();
  // }, []);

  useEffect(() => {
    let filtered = [...requests];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(request => request.status === filters.status);
    }

    // Filter by certificate type
    if (filters.certificateType !== 'all') {
      filtered = filtered.filter(request => request.certificateType === filters.certificateType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.certificateType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.id.toString().includes(searchTerm) ||
        request.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    switch (filters.sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'status':
        filtered.sort((a, b) => a.status.localeCompare(b.status));
        break;
      default:
        break;
    }

    setFilteredRequests(filtered);
  }, [requests, filters, searchTerm]);

  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'RECIBIDO', label: 'Recibido' },
    { value: 'EN_VALIDACION', label: 'En Validación' },
    { value: 'APROBADO', label: 'Aprobado' },
    { value: 'RECHAZADO', label: 'Rechazado' },
    { value: 'CORRECCION_REQUERIDA', label: 'Corrección Requerida' },
    { value: 'EMITIDO', label: 'Emitido' }
  ];

  const certificateTypeOptions = [
    { value: 'all', label: 'Todos los tipos' },
    { value: 'NACIMIENTO', label: 'Certificado de Nacimiento' },
    { value: 'ESTUDIOS', label: 'Certificado de Estudios' },
    { value: 'RESIDENCIA', label: 'Certificado de Residencia' },
    { value: 'ANTECEDENTES', label: 'Certificado de Antecedentes' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Más recientes' },
    { value: 'oldest', label: 'Más antiguos' },
    { value: 'status', label: 'Por estado' }
  ];

  const getStatsData = () => {
    const stats = {
      total: requests.length,
      pending: requests.filter(r => ['RECIBIDO', 'EN_VALIDACION'].includes(r.status)).length,
      approved: requests.filter(r => ['APROBADO', 'EMITIDO'].includes(r.status)).length,
      rejected: requests.filter(r => ['RECHAZADO', 'CORRECCION_REQUERIDA'].includes(r.status)).length
    };
    return stats;
  };

  const handleRequestClick = (requestId) => {
    navigate(`/request/${requestId}`);
  };

  // ✅ AGREGADO: Manejo de errores
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-96">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar solicitudes</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button
          variant="primary"
          onClick={() => loadRequests()}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const stats = getStatsData();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Solicitudes</h1>
          <p className="mt-2 text-gray-600">
            Gestiona y da seguimiento a todas tus solicitudes de certificados
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button
            variant="primary"
            onClick={() => navigate('/new-request')}
          >
            Nueva Solicitud
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
              <p className="text-sm font-medium text-gray-600">En Proceso</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aprobadas</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rechazadas</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="ID, tipo o estado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Certificate Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Certificado
            </label>
            <select
              value={filters.certificateType}
              onChange={(e) => setFilters({ ...filters, certificateType: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {certificateTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ordenar por
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(filters.status !== 'all' || filters.certificateType !== 'all' || searchTerm) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setFilters({ status: 'all', certificateType: 'all', sortBy: 'newest' });
                setSearchTerm('');
              }}
            >
              Limpiar Filtros
            </Button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Solicitudes ({filteredRequests.length})
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {requests.length === 0 ? 'No tienes solicitudes' : 'No se encontraron solicitudes'}
              </h3>
              <p className="mt-2 text-gray-600">
                {requests.length === 0 
                  ? 'Comienza creando tu primera solicitud de certificado.'
                  : 'Intenta ajustar los filtros de búsqueda.'
                }
              </p>
              {requests.length === 0 && (
                <div className="mt-6">
                  <Button
                    variant="primary"
                    onClick={() => navigate('/new-request')}
                  >
                    Crear Primera Solicitud
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {filteredRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onClick={() => handleRequestClick(request.id)}
                  showDetails={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyRequests;