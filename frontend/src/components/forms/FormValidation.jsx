// Validaciones para el formulario de solicitud
export const validateRequestForm = (formData, selectedFile) => {
  const errors = {};

  // Validar tipo de certificado
  if (!formData.certificateType) {
    errors.certificateType = 'Debes seleccionar un tipo de certificado';
  }

  // Validar nombre
  if (!formData.firstName || formData.firstName.trim().length < 2) {
    errors.firstName = 'El nombre debe tener al menos 2 caracteres';
  }

  // Validar apellido
  if (!formData.lastName || formData.lastName.trim().length < 2) {
    errors.lastName = 'El apellido debe tener al menos 2 caracteres';
  }

  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email || !emailRegex.test(formData.email)) {
    errors.email = 'Ingresa un correo electrónico válido';
  }

  // Validar teléfono
  const phoneRegex = /^[\d\s\-\(\)]+$/;
  if (!formData.phone || formData.phone.trim().length < 8 || !phoneRegex.test(formData.phone)) {
    errors.phone = 'Ingresa un número de teléfono válido';
  }

  // Validar cédula
  const cedulaRegex = /^\d{1,2}-\d{3,4}-\d{4}$/;
  if (!formData.cedula || !cedulaRegex.test(formData.cedula.replace(/\s/g, ''))) {
    errors.cedula = 'Ingresa una cédula válida (formato: 8-123-4567)';
  }

  // Validar fecha de nacimiento
  if (!formData.birthDate) {
    errors.birthDate = 'La fecha de nacimiento es requerida';
  } else {
    const birthDate = new Date(formData.birthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 18 || age > 120) {
      errors.birthDate = 'Debes ser mayor de 18 años';
    }
  }

  // Validar dirección
  if (!formData.address || formData.address.trim().length < 10) {
    errors.address = 'La dirección debe tener al menos 10 caracteres';
  }

  // Validar motivo
  if (!formData.reason || formData.reason.trim().length < 10) {
    errors.reason = 'El motivo debe tener al menos 10 caracteres';
  }

  // Validar archivo
  if (!selectedFile) {
    errors.document = 'Debes subir un documento de identidad';
  }

  return errors;
};

// Validaciones para el formulario de login
export const validateLoginForm = (formData) => {
  const errors = {};

  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email || !emailRegex.test(formData.email)) {
    errors.email = 'Ingresa un correo electrónico válido';
  }

  // Validar contraseña
  if (!formData.password || formData.password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres';
  }

  return errors;
};

// Validaciones para el formulario de registro
export const validateRegisterForm = (formData) => {
  const errors = {};

  // Validar nombre
  if (!formData.firstName || formData.firstName.trim().length < 2) {
    errors.firstName = 'El nombre debe tener al menos 2 caracteres';
  }

  // Validar apellido
  if (!formData.lastName || formData.lastName.trim().length < 2) {
    errors.lastName = 'El apellido debe tener al menos 2 caracteres';
  }

  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email || !emailRegex.test(formData.email)) {
    errors.email = 'Ingresa un correo electrónico válido';
  }

  // Validar contraseña
  if (!formData.password || formData.password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres';
  }

  // Validar confirmación de contraseña
  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden';
  }

  return errors;
};

// Validaciones para actualización de estado (admin)
export const validateStatusUpdate = (status, comments) => {
  const errors = {};

  if (!status) {
    errors.status = 'Debes seleccionar un estado';
  }

  // Si el estado es REJECTED o NEEDS_CORRECTION, los comentarios son obligatorios
  if ((status === 'REJECTED' || status === 'NEEDS_CORRECTION') && !comments?.trim()) {
    errors.comments = 'Los comentarios son obligatorios para este estado';
  }

  return errors;
};

// Validación de archivos
export const validateFile = (file, maxSize = 5 * 1024 * 1024, allowedTypes = ['pdf', 'jpg', 'jpeg', 'png']) => {
  const errors = [];

  if (!file) {
    return ['No se ha seleccionado ningún archivo'];
  }

  // Validar tamaño
  if (file.size > maxSize) {
    errors.push(`El archivo es demasiado grande. Tamaño máximo: ${(maxSize / (1024 * 1024)).toFixed(1)}MB`);
  }

  // Validar tipo
  const fileExtension = file.name.split('.').pop().toLowerCase();
  if (!allowedTypes.includes(fileExtension)) {
    errors.push(`Tipo de archivo no válido. Tipos permitidos: ${allowedTypes.join(', ')}`);
  }

  return errors;
};

// Validación de cédula panameña
export const validatePanamaCedula = (cedula) => {
  if (!cedula) return false;
  
  // Remover espacios y guiones
  const cleanCedula = cedula.replace(/[-\s]/g, '');
  
  // Verificar longitud (8 o 9 dígitos)
  if (cleanCedula.length < 8 || cleanCedula.length > 9) {
    return false;
  }
  
  // Verificar que solo contenga números
  if (!/^\d+$/.test(cleanCedula)) {
    return false;
  }
  
  return true;
};

// Validación de teléfono panameño
export const validatePanamaPhone = (phone) => {
  if (!phone) return false;
  
  // Remover espacios, guiones y paréntesis
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Verificar longitud (8 dígitos)
  if (cleanPhone.length !== 8) {
    return false;
  }
  
  // Verificar que solo contenga números
  if (!/^\d+$/.test(cleanPhone)) {
    return false;
  }
  
  // Verificar que empiece con 6 (móvil) o números válidos para fijo
  const firstDigit = cleanPhone.charAt(0);
  if (!['2', '3', '4', '5', '6', '7', '8', '9'].includes(firstDigit)) {
    return false;
  }
  
  return true;
};

// Sanitizar entrada de texto
export const sanitizeText = (text) => {
  if (!text) return '';
  
  return text
    .trim()
    .replace(/\s+/g, ' ') // Reemplazar múltiples espacios con uno solo
    .replace(/[<>]/g, ''); // Remover caracteres potencialmente peligrosos
};

// Validar edad mínima
export const validateMinAge = (birthDate, minAge = 18) => {
  if (!birthDate) return false;
  
  const birth = new Date(birthDate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 >= minAge;
  }
  
  return age >= minAge;
};