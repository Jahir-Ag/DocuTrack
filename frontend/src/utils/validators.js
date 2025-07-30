import { ERROR_MESSAGES, FILE_CONFIG } from './constants';

// Validador de email
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return ERROR_MESSAGES.INVALID_EMAIL;
  }
  return true;
};

// Validador de teléfono
export const validatePhone = (phone) => {
  const phoneRegex = /^[0-9+\-\s()]+$/;
  if (!phoneRegex.test(phone)) {
    return ERROR_MESSAGES.INVALID_PHONE;
  }
  return true;
};

// Validador de cédula (formato básico)
export const validateCedula = (cedula) => {
  const cedulaRegex = /^[0-9-]+$/;
  if (!cedulaRegex.test(cedula)) {
    return 'La cédula solo debe contener números y guiones';
  }
  if (cedula.length < 8) {
    return 'La cédula debe tener al menos 8 caracteres';
  }
  return true;
};

// Validador de contraseña
export const validatePassword = (password) => {
  if (password.length < 6) {
    return ERROR_MESSAGES.PASSWORD_MIN_LENGTH;
  }
  return true;
};

// Validador de confirmación de contraseña
export const validatePasswordConfirmation = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    return ERROR_MESSAGES.PASSWORDS_NOT_MATCH;
  }
  return true;
};

// Validador de archivos
export const validateFile = (file) => {
  if (!file) {
    return 'Debes seleccionar un archivo';
  }

  // Validar tamaño
  if (file.size > FILE_CONFIG.MAX_SIZE) {
    return ERROR_MESSAGES.FILE_TOO_LARGE;
  }

  // Validar tipo
  if (!FILE_CONFIG.ALLOWED_TYPES.includes(file.type)) {
    return ERROR_MESSAGES.INVALID_FILE_TYPE;
  }

  // Validar extensión
  const fileName = file.name.toLowerCase();
  const hasValidExtension = FILE_CONFIG.ALLOWED_EXTENSIONS.some(ext => 
    fileName.endsWith(ext)
  );
  
  if (!hasValidExtension) {
    return 'Extensión de archivo no permitida. Use: PDF, JPG, PNG';
  }

  return true;
};

// Validador de texto requerido
export const validateRequired = (value, fieldName = 'Este campo') => {
  if (!value || value.trim() === '') {
    return `${fieldName} es requerido`;
  }
  return true;
};

// Validador de longitud mínima
export const validateMinLength = (value, minLength, fieldName = 'Este campo') => {
  if (value && value.length < minLength) {
    return `${fieldName} debe tener al menos ${minLength} caracteres`;
  }
  return true;
};

// Validador de longitud máxima
export const validateMaxLength = (value, maxLength, fieldName = 'Este campo') => {
  if (value && value.length > maxLength) {
    return `${fieldName} no puede tener más de ${maxLength} caracteres`;
  }
  return true;
};

// Validador numérico
export const validateNumeric = (value, fieldName = 'Este campo') => {
  const numericRegex = /^[0-9]+$/;
  if (!numericRegex.test(value)) {
    return `${fieldName} solo debe contener números`;
  }
  return true;
};

// Validador alfanumérico
export const validateAlphaNumeric = (value, fieldName = 'Este campo') => {
  const alphaNumericRegex = /^[a-zA-Z0-9\s]+$/;
  if (!alphaNumericRegex.test(value)) {
    return `${fieldName} solo debe contener letras, números y espacios`;
  }
  return true;
};

// Validador de fecha
export const validateDate = (date, fieldName = 'La fecha') => {
  if (!date) {
    return `${fieldName} es requerida`;
  }
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return `${fieldName} no es válida`;
  }
  
  return true;
};

// Validador de fecha pasada
export const validatePastDate = (date, fieldName = 'La fecha') => {
  const validation = validateDate(date, fieldName);
  if (validation !== true) return validation;
  
  const dateObj = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (dateObj >= today) {
    return `${fieldName} debe ser anterior a hoy`;
  }
  
  return true;
};

// Validador de fecha futura
export const validateFutureDate = (date, fieldName = 'La fecha') => {
  const validation = validateDate(date, fieldName);
  if (validation !== true) return validation;
  
  const dateObj = new Date(date);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  if (dateObj <= today) {
    return `${fieldName} debe ser posterior a hoy`;
  }
  
  return true;
};

// Validador de rango de fechas
export const validateDateRange = (startDate, endDate) => {
  const startValidation = validateDate(startDate, 'La fecha de inicio');
  if (startValidation !== true) return startValidation;
  
  const endValidation = validateDate(endDate, 'La fecha de fin');
  if (endValidation !== true) return endValidation;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start >= end) {
    return 'La fecha de inicio debe ser anterior a la fecha de fin';
  }
  
  return true;
};

// Validador de URL
export const validateUrl = (url, fieldName = 'La URL') => {
  try {
    new URL(url);
    return true;
  } catch {
    return `${fieldName} no es válida`;
  }
};

// Validador de selección de lista
export const validateSelect = (value, options, fieldName = 'Este campo') => {
  if (!options.includes(value)) {
    return `${fieldName} contiene una opción inválida`;
  }
  return true;
};

// Validador combinado para formularios
export const validateForm = (data, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const fieldRules = rules[field];
    const value = data[field];
    
    for (const rule of fieldRules) {
      const result = rule.validator(value, rule.message || field);
      if (result !== true) {
        errors[field] = result;
        break; // Stop at first error for this field
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Helpers para crear reglas de validación
export const required = (message) => ({
  validator: validateRequired,
  message
});

export const email = (message) => ({
  validator: validateEmail,
  message
});

export const minLength = (length, message) => ({
  validator: (value) => validateMinLength(value, length),
  message
});

export const maxLength = (length, message) => ({
  validator: (value) => validateMaxLength(value, length),
  message
});

export const phone = (message) => ({
  validator: validatePhone,
  message
});

export const cedula = (message) => ({
  validator: validateCedula,
  message
});

export const file = (message) => ({
  validator: validateFile,
  message
});

// Validadores específicos para el dominio de la aplicación
export const validateCertificateType = (type) => {
  const validTypes = ['BIRTH', 'STUDIES', 'RESIDENCE', 'INCOME', 'WORK'];
  if (!validTypes.includes(type)) {
    return 'Tipo de certificado inválido';
  }
  return true;
};

export const validateRequestStatus = (status) => {
  const validStatuses = ['PENDING', 'IN_VALIDATION', 'APPROVED', 'REJECTED', 'ISSUED', 'CORRECTION_REQUESTED'];
  if (!validStatuses.includes(status)) {
    return 'Estado de solicitud inválido';
  }
  return true;
};

export const validateUserRole = (role) => {
  const validRoles = ['USER', 'ADMIN'];
  if (!validRoles.includes(role)) {
    return 'Rol de usuario inválido';
  }
  return true;
};