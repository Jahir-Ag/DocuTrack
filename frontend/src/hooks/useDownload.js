import { useState } from 'react';
import { certificateService } from '../services/certificateService';

export const useDownload = () => {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const downloadCertificate = async (requestId) => {
    try {
      setDownloading(true);
      setError(null);
      
      // ✅ CORREGIDO: certificateService ya devuelve un Blob
      const blob = await certificateService.downloadCertificate(requestId);
      
      // ✅ CORREGIDO: Usar el blob directamente, no response.data
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificado-${requestId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
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
      
      // ✅ CORREGIDO: Si downloadDocument también devuelve blob directamente
      const blob = await certificateService.downloadDocument(filename);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
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