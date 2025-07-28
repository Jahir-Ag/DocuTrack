const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/documents');
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

// Filtro de archivos permitidos
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png'
  ];
  
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF, JPG, JPEG y PNG'), false);
  }
};

// Configuración principal de multer
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB por archivo
    files: 5 // Máximo 5 archivos
  },
  fileFilter
});

// Middleware para manejar errores de multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    // Limpiar archivos subidos en caso de error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path).catch(console.error);
      });
    }

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({ 
          error: 'Archivo demasiado grande. Máximo 5MB por archivo.' 
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({ 
          error: 'Demasiados archivos. Máximo 5 archivos permitidos.' 
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({ 
          error: 'Campo de archivo no esperado.' 
        });
      default:
        return res.status(400).json({ 
          error: 'Error en la subida de archivos: ' + error.message 
        });
    }
  }
  
  // Error de filtro de archivos
  if (error.message.includes('Solo se permiten archivos')) {
    // Limpiar archivos subidos en caso de error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path).catch(console.error);
      });
    }
    return res.status(400).json({ error: error.message });
  }
  
  next(error);
};

// Middleware para validar que se subieron archivos
const validateFiles = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ 
      error: 'Se requiere al menos un documento' 
    });
  }
  next();
};

// Middleware combinado para documentos
const uploadDocuments = [
  upload.array('documents', 5),
  handleMulterError,
  validateFiles
];

// Middleware para archivo único (si lo necesitas en el futuro)
const uploadSingle = (fieldName) => [
  upload.single(fieldName),
  handleMulterError
];

// Función helper para limpiar archivos en caso de error
const cleanupFiles = async (files) => {
  if (!files) return;
  
  const fileArray = Array.isArray(files) ? files : [files];
  for (const file of fileArray) {
    try {
      await fs.unlink(file.path);
    } catch (error) {
      console.error('Error eliminando archivo:', file.path, error);
    }
  }
};

module.exports = {
  upload,
  uploadDocuments,
  uploadSingle,
  handleMulterError,
  validateFiles,
  cleanupFiles
};