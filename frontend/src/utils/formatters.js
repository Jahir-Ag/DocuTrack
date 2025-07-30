// Formatear fechas
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now - date;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return diffInMinutes <= 1 ? 'Hace un momento' : `Hace ${diffInMinutes} minutos`;
    }
    return diffInHours === 1 ? 'Hace 1 hora' : `Hace ${diffInHours} horas`;
  }
  
  if (diffInDays === 1) return 'Ayer';
  if (diffInDays < 7) return `Hace ${diffInDays} días`;
  
  return formatDate(dateString);
};

// Formatear estado de solicitud
export const formatStatus = (status) => {
  const statusMap = {
    'PENDING': 'Pendiente',
    'IN_REVIEW': 'En Revisión',
    'APPROVED': 'Aprobado',
    'REJECTED': 'Rechazado',
    'ISSUED': 'Emitido',
    'NEEDS_CORRECTION': 'Necesita Corrección'
  };
  
  return statusMap[status] || status;
};

// Formatear tipo de certificado
export const formatCertificateType = (type) => {
  const typeMap = {
    'BIRTH': 'Certificado de Nacimiento',
    'STUDY': 'Certificado de Estudios',
    'WORK': 'Certificado Laboral',
    'RESIDENCE': 'Certificado de Residencia',
    'OTHER': 'Otro'
  };
  
  return typeMap[type] || type;
};

// Formatear tamaño de archivo
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

// Formatear nombre de archivo
export const formatFileName = (fileName, maxLength = 30) => {
  if (!fileName) return '';
  
  if (fileName.length <= maxLength) return fileName;
  
  const extension = fileName.split('.').pop();
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
  const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 4);
  
  return `${truncatedName}...${extension}`;
};

// Formatear ID de solicitud
export const formatRequestId = (id) => {
  return `REQ-${String(id).padStart(6, '0')}`;
};

// Formatear texto largo con truncamiento
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

// Formatear número de teléfono
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remover caracteres no numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Formatear según longitud
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  }
  
  return phone;
};

// Formatear cédula
export const formatCedula = (cedula) => {
  if (!cedula) return '';
  
  // Remover caracteres no numéricos
  const cleaned = cedula.replace(/\D/g, '');
  
  // Formatear: X-XXX-XXXX
  if (cleaned.length >= 8) {
    return `${cleaned.substring(0, 1)}-${cleaned.substring(1, 4)}-${cleaned.substring(4, 8)}`;
  }
  
  return cedula;
};

// Capitalizar primera letra de cada palabra
export const capitalizeWords = (text) => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Formatear moneda
export const formatCurrency = (amount, currency = 'USD') => {
  if (!amount && amount !== 0) return '-';
  
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: currency
  }).format(amount);
};