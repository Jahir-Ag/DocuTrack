const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generar nombre único para evitar conflictos
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, fileExtension);
    cb(null, `${uniqueSuffix}-${baseName}${fileExtension}`);
  }
});

// Filtro de archivos permitidos - Solo PDF y JPG
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg'
  ];
  
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF y JPG'), false);
  }
};

// Configuración principal de multer para UN solo archivo
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
    files: 1 // Solo UN archivo
  },
  fileFilter
});

// Middleware para manejar errores de multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    // Limpiar archivo subido en caso de error
    if (req.file) {
      fs.unlink(req.file.path).catch(console.error);
    }
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          error: 'Archivo demasiado grande. Máximo 5MB.'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          error: 'Solo se permite un archivo por solicitud.'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          error: 'Campo de archivo no esperado.'
        });
      default:
        return res.status(400).json({
          error: 'Error en la subida de archivo: ' + error.message
        });
    }
  }
  
  // Error de filtro de archivos
  if (error.message.includes('Solo se permiten archivos')) {
    // Limpiar archivo subido en caso de error
    if (req.file) {
      fs.unlink(req.file.path).catch(console.error);
    }
    return res.status(400).json({ error: error.message });
  }
  
  next(error);
};

// Middleware para validar que se subió un archivo
const validateFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'Se requiere un documento (PDF o JPG)'
    });
  }
  next();
};

// Middleware combinado para documento único
const uploadDocument = [
  upload.single('document'), // Cambiado de 'documents' a 'document' (singular)
  handleMulterError,
  validateFile
];

// Función helper para limpiar archivo en caso de error
const cleanupFile = async (file) => {
  if (!file) return;
  
  try {
    await fs.unlink(file.path);
  } catch (error) {
    console.error('Error eliminando archivo:', file.path, error);
  }
};

// Función helper para limpiar múltiples archivos (retrocompatibilidad)
const cleanupFiles = async (files) => {
  if (!files) return;
  
  const fileArray = Array.isArray(files) ? files : [files];
  for (const file of fileArray) {
    await cleanupFile(file);
  }
};

module.exports = {
  upload,
  uploadDocument,    // Nuevo: para un solo documento
  handleMulterError,
  validateFile,      // Nuevo: para validar un solo archivo
  cleanupFile,       // Nuevo: para limpiar un solo archivo
  cleanupFiles       // Mantenido para retrocompatibilidad
};