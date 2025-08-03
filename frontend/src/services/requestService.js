import api from './api';

export const requestService = {
 
  createRequest: async (requestData) => {
    try {
      // ✅ requestData YA ES FormData completo desde RequestForm, no reconstruir
      console.log('📤 Enviando FormData directo al backend...');
      
      // 🔍 Debug: Ver qué contiene el FormData antes de enviar
      console.log('📋 FormData contents:');
      for (let [key, value] of requestData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          console.log(`${key}:`, value);
        }
      }

      const response = await api.post('/requests', requestData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  },

  // ✅Obtener solicitudes del usuario
  getUserRequests: async () => {
    try {
      const response = await api.get('/requests');
      return response.data;
    } catch (error) {
      console.error('Error fetching user requests:', error);
      throw error;
    }
  },

  // ✅getMyRequests (mismo que getUserRequests)
  getMyRequests: async () => {
    try {
      const response = await api.get('/requests');
      return response.data;
    } catch (error) {
      console.error('Error fetching my requests:', error);
      throw error;
    }
  },

  // ✅Obtener solicitud específica del usuario
  getRequestById: async (id) => {
    try {
      const response = await api.get(`/requests/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching request:', error);
      throw error;
    }
  },

  // ✅Obtener todas las solicitudes para admin
  getAdminRequests: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.status) queryParams.append('status', params.status);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      const response = await api.get(`/admin/requests?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching admin requests:', error);
      throw error;
    }
  },

  // ✅ ALIAS para compatibilidad: Mismo método con nombre diferente
  getAllRequests: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.status) queryParams.append('status', params.status);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      const response = await api.get(`/admin/requests?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all requests:', error);
      throw error;
    }
  },

  // ✅ Obtener solicitud específica para admin
  getAdminRequestById: async (id) => {
    try {
      const response = await api.get(`/admin/requests/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching admin request:', error);
      throw error;
    }
  },

  // ✅ Actualizar estado de solicitud (solo admin)
  updateRequestStatus: async (id, status, comment = '') => {
    try {
      const response = await api.patch(`/admin/requests/${id}/status`, {
        status,
        comment
      });
      return response.data;
    } catch (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  },

  // ✅ Obtener estadísticas del dashboard admin
  getAdminStats: async () => {
    try {
      const response = await api.get('/admin/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }
  },

  // ✅ Descargar documento (admin)
  downloadDocument: async (requestId) => {
    try {
      const response = await api.get(`/admin/requests/${requestId}/document`, {
        responseType: 'blob'
      });
      
      // Crear URL para descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Intentar obtener el nombre del archivo del header
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'documento.pdf';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  },

  // ✅ MÉTODO AUXILIAR: Obtener URL de descarga directa
  getDocumentDownloadUrl: (requestId) => {
    return `${api.defaults.baseURL}/admin/requests/${requestId}/document`;
  },

  // ✅ Actualizar solicitud (método que faltaba en mi versión anterior)
  updateRequest: async (id, data) => {
    try {
      const response = await api.patch(`/requests/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating request:', error);
      throw error;
    }
  },

  // ✅ Cancelar solicitud (método que faltaba en mi versión anterior)
  cancelRequest: async (id) => {
    try {
      const response = await api.delete(`/requests/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error canceling request:', error);
      throw error;
    }
  },

  // ✅ Obtener tipos de certificados disponibles
  getCertificateTypes: async () => {
    try {
      const response = await api.get('/requests/certificate-types');
      return response.data;
    } catch (error) {
      console.error('Error fetching certificate types:', error);
      throw error;
    }
  }
};