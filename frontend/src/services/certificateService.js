const API_URL = import.meta.env.VITE_API_URL;

export const certificateService = {
  downloadCertificate: async (id) => {
    try {
      console.log('🔍 Descargando certificado para ID:', id);
      
      const response = await fetch(`${API_URL}/requests/${id}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
         
        }
      });
      
      console.log('📊 Response status:', response.status);
      console.log('📊 Response headers:', [...response.headers.entries()]);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response body:', errorText);
        
        if (response.status === 404) {
          throw new Error('Certificado no encontrado o no disponible');
        } else if (response.status === 403) {
          throw new Error('No tienes permisos para descargar este certificado');
        } else if (response.status === 500) {
          throw new Error(`Error del servidor: ${errorText}`);
        }
        throw new Error('Error al descargar el certificado');
      }
       
      const blob = await response.blob();
      console.log('📊 Blob size:', blob.size);
      console.log('📊 Blob type:', blob.type);
      
      // ✅ Verificar si el blob es muy pequeño
      if (blob.size < 1000) {
        const text = await blob.text();
        console.log('⚠️ Contenido del blob pequeño:', text);
      }
      
      return blob;
    } catch (error) {
      console.error('❌ Error en certificateService:', error);
      throw error;
    }
  }
};