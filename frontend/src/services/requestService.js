import api from './api';

export const requestService = {
  // Crear nueva solicitud
  async createRequest(formData) {
    try {
      const response = await api.post('/requests', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creando solicitud:', error);
      throw new Error(error.response?.data?.error || 'Error creando solicitud');
    }
  },

  // Obtener todas las solicitudes del usuario
  async getMyRequests(page = 1, limit = 10, filters = {}) {
    try {
      const params = {
        page,
        limit,
        ...filters
      };
      
      const response = await api.get('/requests', { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo solicitudes:', error);
      throw new Error(error.response?.data?.error || 'Error obteniendo solicitudes');
    }
  },

  // Obtener una solicitud específica
  async getRequestById(id) {
    try {
      const response = await api.get(`/requests/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo solicitud:', error);
      throw new Error(error.response?.data?.error || 'Solicitud no encontrada');
    }
  },

  // Actualizar solicitud (solo si está en RECIBIDO)
  async updateRequest(id, data) {
    try {
      const response = await api.put(`/requests/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error actualizando solicitud:', error);
      throw new Error(error.response?.data?.error || 'Error actualizando solicitud');
    }
  },

  // Cancelar solicitud
  async cancelRequest(id) {
    try {
      const response = await api.delete(`/requests/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error cancelando solicitud:', error);
      throw new Error(error.response?.data?.error || 'Error cancelando solicitud');
    }
  },

  // Obtener historial de estados
  async getRequestHistory(id) {
    try {
      const response = await api.get(`/requests/${id}/history`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      throw new Error('Error obteniendo historial');
    }
  }
};