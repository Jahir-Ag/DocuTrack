const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// 🚀 Configuración de directorio para Railway
const getUploadPath = () => {
  if (process.env.NODE_ENV === 'production') {
    // En Railway usamos /tmp que es confiable
    return '/tmp/uploads';
  } else {
    // En desarrollo local usamos la carpeta uploads
    return path.join(__dirname, '../../uploads');
  }
};

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = getUploadPath();
    try {
      // Crear directorio si no existe
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      console.error('Error creando directorio de uploads:', error);
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generar nombre único para evitar conflictos
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, fileExtension);
    
    // Sanitizar nombre del archivo
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
    const finalName = `${uniqueSuffix}-${sanitizedBaseName}${fileExtension}`;
    
    console.log(`📁 Guardando archivo como: ${finalName}`);
    cb(null, finalName);
  }
});

// Filtro de archivos permitidos - Solo PDF y JPG
const fileFilter = (req, file, cb) => {
  console.log(`📋 Validando archivo: ${file.originalname}, MIME: ${file.mimetype}`);
  
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png'  // ✅ Agregué PNG que faltaba
  ];
  
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    console.log(`✅ Archivo válido: ${file.originalname}`);
    cb(null, true);
  } else {
    console.log(`❌ Archivo inválido: ${file.originalname}`);
    cb(new Error('Solo se permiten archivos PDF, JPG y PNG'), false);
  }
};

// Configuración principal de multer para UN solo archivo
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB máximo
    files: 1 // Solo UN archivo
  },
  fileFilter
});

// Middleware para manejar errores de multer
const handleMulterError = (error, req, res, next) => {
  console.error('🔥 Error de Multer:', error);
  
  if (error instanceof multer.MulterError) {
    // Limpiar archivo subido en caso de error
    if (req.file) {
      cleanupFile(req.file).catch(console.error);
    }
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          error: 'Archivo demasiado grande. Máximo 5MB.'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: 'Solo se permite un archivo por solicitud.'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: 'Campo de archivo no esperado.'
        });
      default:
        return res.status(400).json({
          success: false,
          error: 'Error en la subida de archivo: ' + error.message
        });
    }
  }
  
  // Error de filtro de archivos
  if (error.message.includes('Solo se permiten archivos')) {
    // Limpiar archivo subido en caso de error
    if (req.file) {
      cleanupFile(req.file).catch(console.error);
    }
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
  
  next(error);
};

// ✅ MIDDLEWARE CORREGIDO: Adaptar req.file a req.files para el controller
const validateFile = (req, res, next) => {
  console.log('🔍 Validando archivo recibido...');
  console.log('📋 req.file:', req.file);
  console.log('📝 req.body:', req.body);
  
  if (!req.file) {
    console.log('❌ No se recibió archivo');
    return res.status(400).json({
      success: false,
      error: 'Se requiere un documento (PDF, JPG o PNG)'
    });
  }
  
  // ✅ CONVERSIÓN CRÍTICA: Controller espera req.files (array)
  // Convertir req.file (single) a req.files (array) para compatibilidad
  req.files = [req.file];
  console.log('✅ Archivo convertido a req.files para compatibilidad con controller');
  console.log('📋 req.files:', req.files);
  
  next();
};

// Middleware combinado para documento único
const uploadDocument = [
  upload.single('document'), // ✅ Campo 'document' del FormData (single file)
  handleMulterError,
  validateFile  // ✅ Incluye la conversión req.file -> req.files
];

// Función helper para limpiar archivo en caso de error
const cleanupFile = async (file) => {
  if (!file || !file.path) return;
  
  try {
    await fs.unlink(file.path);
    console.log(`🗑️ Archivo eliminado: ${file.path}`);
  } catch (error) {
    console.error('❌ Error eliminando archivo:', file.path, error);
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

// Función helper para obtener la ruta completa del archivo
const getFilePath = (filename) => {
  const uploadPath = getUploadPath();
  return path.join(uploadPath, filename);
};

// Función helper para verificar si un archivo existe
const fileExists = async (filename) => {
  try {
    const filePath = getFilePath(filename);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

module.exports = {
  upload,
  uploadDocument,
  handleMulterError,
  validateFile,
  cleanupFile,
  cleanupFiles,
  getFilePath,
  fileExists,
  getUploadPath
};