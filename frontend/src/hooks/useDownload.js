import { useState } from 'react';
import { certificateService } from '../services/certificateService';

export const useDownload = () => {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const downloadCertificate = async (requestId) => {
    try {
      setDownloading(true);
      setError(null);
      
      // Llamar al servicio para descargar el certificado
      const response = await certificateService.downloadCertificate(requestId);
      
      // Crear blob y descargar archivo
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificado-${requestId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return response;
    } catch (error) {
      console.error('Error downloading certificate:', error);
      setError(error.message || 'Error al descargar el certificado');
      throw error;
    } finally {
      setDownloading(false);
    }
  };

  const downloadDocument = async (filename) => {
    try {
      setDownloading(true);
      setError(null);
      
      // Llamar al servicio para descargar un documento adjunto
      const response = await certificateService.downloadDocument(filename);
      
      // Crear blob y descargar archivo
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return response;
    } catch (error) {
      console.error('Error downloading document:', error);
      setError(error.message || 'Error al descargar el documento');
      throw error;
    } finally {
      setDownloading(false);
    }
  };

  const previewDocument = async (filename) => {
    try {
      setError(null);
      
      // Abrir el documento en una nueva ventana
      const url = `/api/documents/${filename}`;
      window.open(url, '_blank');
      
    } catch (error) {
      console.error('Error previewing document:', error);
      setError(error.message || 'Error al previsualizar el documento');
      throw error;
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    downloading,
    error,
    downloadCertificate,
    downloadDocument,
    previewDocument,
    clearError
  };
};