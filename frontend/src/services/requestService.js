import api from './api';

export const requestService = {
 
  createRequest: async (requestData) => {
    try {
      const formData = new FormData();
      
      // Campos principales
      formData.append('certificateType', requestData.certificateType);
      formData.append('reason', requestData.reason);
      formData.append('urgency', requestData.urgency || 'NORMAL');
      
      // ✅Mapear campos correctos del schema
      formData.append('firstName', requestData.firstName);
      formData.append('lastName', requestData.lastName);
      formData.append('email', requestData.email);
      formData.append('phone', requestData.phone);
      formData.append('cedula', requestData.cedula);
      formData.append('birthDate', requestData.birthDate);
      formData.append('address', requestData.address);
      
      if (requestData.additionalInfo) {
        formData.append('additionalInfo', requestData.additionalInfo);
      }
      
      // Documento
      if (requestData.document) {
        formData.append('document', requestData.document);
      }

      const response = await api.post('/requests', formData, {
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
  }
};