const API_URL = import.meta.env.VITE_API_URL;

export const certificateService = {
  downloadCertificate: async (id) => {
    try {
      const response = await fetch(`${API_URL}/requests/${id}/certificate`);
      if (!response.ok) throw new Error('Error al descargar el certificado');

      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('Error en certificateService:', error);
      throw error;
    }
  }
};
