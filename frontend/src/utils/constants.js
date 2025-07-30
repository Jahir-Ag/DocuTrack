// Estados de las solicitudes
export const REQUEST_STATUS = {
  PENDING: 'PENDING',
  IN_VALIDATION: 'IN_VALIDATION',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ISSUED: 'ISSUED',
  CORRECTION_REQUESTED: 'CORRECTION_REQUESTED'
};

// Labels para los estados
export const STATUS_LABELS = {
  [REQUEST_STATUS.PENDING]: 'Pendiente',
  [REQUEST_STATUS.IN_VALIDATION]: 'En Validación',
  [REQUEST_STATUS.APPROVED]: 'Aprobado',
  [REQUEST_STATUS.REJECTED]: 'Rechazado',
  [REQUEST_STATUS.ISSUED]: 'Emitido',
  [REQUEST_STATUS.CORRECTION_REQUESTED]: 'Corrección Solicitada'
};

// Tipos de certificados
export const CERTIFICATE_TYPES = {
  BIRTH: 'BIRTH',
  STUDIES: 'STUDIES',
  RESIDENCE: 'RESIDENCE',
  INCOME: 'INCOME',
  WORK: 'WORK'
};

// Labels para tipos de certificados
export const CERTIFICATE_TYPE_LABELS = {
  [CERTIFICATE_TYPES.BIRTH]: 'Certificado de Nacimiento',
  [CERTIFICATE_TYPES.STUDIES]: 'Certificado de Estudios',
  [CERTIFICATE_TYPES.RESIDENCE]: 'Certificado de Residencia',
  [CERTIFICATE_TYPES.INCOME]: 'Certificado de Ingresos',
  [CERTIFICATE_TYPES.WORK]: 'Certificado de Trabajo'
};

// Roles de usuario
export const USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN'
};

// Configuración de archivos
export const FILE_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
  ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png']
};

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'Este campo es requerido',
  INVALID_EMAIL: 'Email inválido',
  INVALID_PHONE: 'Teléfono inválido',
  PASSWORD_MIN_LENGTH: 'La contraseña debe tener al menos 6 caracteres',
  PASSWORDS_NOT_MATCH: 'Las contraseñas no coinciden',
  FILE_TOO_LARGE: 'El archivo es demasiado grande (máximo 5MB)',
  INVALID_FILE_TYPE: 'Tipo de archivo no permitido',
  NETWORK_ERROR: 'Error de conexión. Inténtalo de nuevo.',
  UNAUTHORIZED: 'No tienes autorización para realizar esta acción',
  SERVER_ERROR: 'Error del servidor. Inténtalo más tarde.'
};

// Mensajes de éxito
export const SUCCESS_MESSAGES = {
  LOGIN: 'Sesión iniciada correctamente',
  REGISTER: 'Cuenta creada exitosamente',
  REQUEST_CREATED: 'Solicitud creada exitosamente',
  REQUEST_UPDATED: 'Solicitud actualizada correctamente',
  FILE_UPLOADED: 'Archivo subido correctamente',
  CERTIFICATE_DOWNLOADED: 'Certificado descargado'
};

// Configuración de paginación
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50]
};

// URLs de la API
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile'
  },
  REQUESTS: {
    BASE: '/requests',
    UPLOAD_DOCUMENT: '/requests/upload-document',
    MY_REQUESTS: '/requests/my-requests'
  },
  ADMIN: {
    REQUESTS: '/admin/requests',
    UPDATE_STATUS: '/admin/requests/:id/status'
  },
  CERTIFICATES: {
    DOWNLOAD: '/certificates/download/:id',
    GENERATE: '/certificates/generate/:id'
  }
};

// Configuración de fechas
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
  ISO: 'yyyy-MM-dd',
  API: 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\''
};

// Configuración de colores para estados
export const STATUS_COLORS = {
  [REQUEST_STATUS.PENDING]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200'
  },
  [REQUEST_STATUS.IN_VALIDATION]: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200'
  },
  [REQUEST_STATUS.APPROVED]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200'
  },
  [REQUEST_STATUS.REJECTED]: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200'
  },
  [REQUEST_STATUS.ISSUED]: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-200'
  },
  [REQUEST_STATUS.CORRECTION_REQUESTED]: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200'
  }
};

// Configuración de localStorage keys
export const STORAGE_KEYS = {
  TOKEN: 'docutrack_token',
  USER: 'docutrack_user',
  PREFERENCES: 'docutrack_preferences'
};

// Configuración de timeouts
export const TIMEOUTS = {
  API_TIMEOUT: 30000, // 30 segundos
  TOAST_DURATION: 4000, // 4 segundos
  DEBOUNCE_SEARCH: 300 // 300ms
};

// Rutas de la aplicación
export const APP_ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  NEW_REQUEST: '/new-request',
  MY_REQUESTS: '/my-requests',
  REQUEST_DETAIL: '/request/:id',
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    REQUESTS: '/admin/requests',
    REQUEST_DETAIL: '/admin/request/:id'
  }
};