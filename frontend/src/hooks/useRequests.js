import { useState, useEffect, useCallback } from 'react';
import { requestService } from '../services/requestService';

export const useRequests = (initialFilters = {}) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState(initialFilters);

  // ✅ MEMORIZAR loadRequests con useCallback
  const loadRequests = useCallback(async (page = 1, newFilters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await requestService.getMyRequests(
        page, 
        pagination.limit, 
        { ...filters, ...newFilters }
      );
    
      setRequests(response.requests || []);
      setPagination(response.pagination || {
        page,
        limit: pagination.limit,
        total: response.requests?.length || 0,
        pages: 1
      });
    } catch (err) {
      setError(err.message);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  // ✅ fetchAllRequests para admin
  const fetchAllRequests = useCallback(async (page = 1, newFilters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Fetching all requests for admin...');
      const response = await requestService.getAllRequests(
        page, 
        50, // límite más alto para admin
        { ...filters, ...newFilters }
      );
      
      console.log('✅ Admin requests loaded:', response);
      setRequests(response.requests || []);
      setPagination(response.pagination || {
        page,
        limit: 50,
        total: response.requests?.length || 0,
        pages: 1
      });
    } catch (err) {
      console.error('❌ Error fetching all requests:', err);
      setError(err.message);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Crear nueva solicitud
  const createRequest = async (formData) => {
    try {
      console.log('🚀 Creando solicitud:', formData);
      const response = await requestService.createRequest(formData);
      
      // Recargar la lista de solicitudes
      await loadRequests(1);
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Error creando solicitud:', error);
      return { success: false, error: error.message };
    }
  };

  // Actualizar solicitud
  const updateRequest = async (id, data) => {
    try {
      const response = await requestService.updateRequest(id, data);
      
      // Actualizar en la lista local
      setRequests(prev => 
        prev.map(req => req.id === id ? { ...req, ...response.data } : req)
      );
      
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Cancelar solicitud
  const cancelRequest = async (id) => {
    try {
      await requestService.cancelRequest(id);
      
      // Eliminar de la lista local
      setRequests(prev => prev.filter(req => req.id !== id));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Buscar solicitudes
  const searchRequests = useCallback((searchTerm) => {
    const newFilters = { ...filters, search: searchTerm };
    setFilters(newFilters);
    loadRequests(1, newFilters);
  }, [filters, loadRequests]);

  // Filtrar por estado
  const filterByStatus = useCallback((status) => {
    const newFilters = { ...filters, status };
    setFilters(newFilters);
    loadRequests(1, newFilters);
  }, [filters, loadRequests]);

  // Cambiar página
  const changePage = useCallback((page) => {
    loadRequests(page);
  }, [loadRequests]);

  // Refrescar
  const refresh = useCallback(() => {
    loadRequests(pagination.page);
  }, [loadRequests, pagination.page]);

  // ✅ CARGAR AL MONTAR 
  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  return {
    requests,
    loading,
    error,
    pagination,
    filters,
    createRequest,
    updateRequest,
    cancelRequest,
    searchRequests,
    filterByStatus,
    changePage,
    refresh,
    loadRequests,
    fetchAllRequests 
  };
};