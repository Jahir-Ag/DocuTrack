import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { useRequests } from '../../hooks/useRequests';

// ✅ Constantes definidas localmente (temporal)
const CERTIFICATE_TYPES = {
  NACIMIENTO: 'Certificado de Nacimiento',
  ESTUDIOS: 'Certificado de Estudios',
  RESIDENCIA: 'Certificado de Residencia',
  ANTECEDENTES: 'Certificado de Antecedentes'
};

// ✅ Validación simple (temporal)
const validateRequestForm = (formData, selectedFile) => {
  const errors = {};
  
  if (!formData.certificateType) errors.certificateType = 'Selecciona un tipo de certificado';
  if (!formData.firstName) errors.firstName = 'El nombre es requerido';
  if (!formData.lastName) errors.lastName = 'El apellido es requerido';
  if (!formData.email) errors.email = 'El email es requerido';
  if (!formData.phone) errors.phone = 'El teléfono es requerido';
  if (!formData.cedula) errors.cedula = 'La cédula es requerida';
  if (!formData.birthDate) errors.birthDate = 'La fecha de nacimiento es requerida';
  if (!formData.address) errors.address = 'La dirección es requerida';
  if (!formData.reason) errors.reason = 'El motivo es requerido';
  if (!selectedFile) errors.document = 'Debes subir un documento';
  
  return errors;
};

const RequestForm = ({ certificateType, onSuccess, onCancel }) => {
  const navigate = useNavigate();
  // ✅ CORREGIDO: usar 'loading' en lugar de 'isLoading'
  const { createRequest, loading } = useRequests();
  
  const [formData, setFormData] = useState({
    certificateType: certificateType || '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    cedula: '',
    birthDate: '',
    address: '',
    reason: '',
    additionalInfo: ''
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    console.log('📝 Input change:', e.target.name, e.target.value);
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error específico cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleFileSelect = (e) => {
    console.log('📁 File selected:', e.target.files[0]);
    const file = e.target.files[0];
    
    // 🔍 DEBUG: Información detallada del archivo
    if (file) {
      console.log('📁 Archivo detallado:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        lastModifiedDate: file.lastModifiedDate
      });
    }
    
    setSelectedFile(file);
    if (errors.document) {
      setErrors(prev => ({
        ...prev,
        document: null
      }));
    }
  };

  const handleSubmit = async (e) => {
    console.log('🚀 Form submit iniciado');
    console.log('🔍 DEBUG - Estado inicial:', {
      formData,
      selectedFile: selectedFile ? {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      } : null
    });
    
    e.preventDefault();
    
    // Validar formulario
    const validationErrors = validateRequestForm(formData, selectedFile);
    if (Object.keys(validationErrors).length > 0) {
      console.log('❌ Errores de validación:', validationErrors);
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    console.log('📤 Datos validados, preparando envío...');
    
    try {
      // 🔍 DEBUG: Ver datos antes de crear FormData
      console.log('📋 FormData original antes de FormData:', formData);
      console.log('📋 Archivo seleccionado antes de FormData:', selectedFile);
      
      // Crear FormData para enviar archivo
      const submitData = new FormData();
      
      // Agregar datos del formulario
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        console.log(`📋 Agregando al FormData - ${key}:`, value);
        submitData.append(key, value);
      });
      
      // Agregar archivo
      if (selectedFile) {
        console.log('📁 Agregando archivo al FormData:', selectedFile.name);
        submitData.append('document', selectedFile);
      }

      // 🔍 DEBUG: Ver exactamente qué se envía
      console.log('📋 FormData keys:', Array.from(submitData.keys()));  
      console.log('📋 FormData values completos:');
      for (let [key, value] of submitData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          console.log(`${key}:`, value);
        }
      }
      
      // 🔍 DEBUG: Verificar que no hay valores undefined o null
      let hasEmptyValues = false;
      for (let [key, value] of submitData.entries()) {
        if (value === 'undefined' || value === 'null' || value === '') {
          console.warn(`⚠️ Valor vacío encontrado en ${key}:`, value);
          hasEmptyValues = true;
        }
      }
      
      if (hasEmptyValues) {
        console.warn('⚠️ Se encontraron valores vacíos en FormData');
      }

      console.log('📋 FormData preparado, llamando createRequest...');
      console.log('🚀 Enviando solicitud al servidor...');
      
      const result = await createRequest(submitData);
      console.log('✅ Resultado de createRequest:', result);
      
      if (result.success) {
        console.log('✅ Solicitud creada exitosamente');
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/my-requests', { 
            state: { 
              message: 'Solicitud creada exitosamente. Puedes seguir su progreso aquí.',
              type: 'success'
            }
          });
        }
      } else {
        console.error('❌ Error en resultado:', result.error);
        setErrors({ submit: result.error || 'Error al crear la solicitud' });
      }
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error details:', {
        message: error.message,
        name: error.name,
        code: error.code
      });
      setErrors({ submit: 'Error inesperado al enviar la solicitud' });
    } finally {
      setIsSubmitting(false);
      console.log('🏁 Proceso de envío terminado');
    }
  };

  // 🔍 DEBUG: Log cuando el componente se renderiza
  console.log('🎨 RequestForm renderizando con:', {
    certificateType,
    loading,
    formDataKeys: Object.keys(formData),
    hasSelectedFile: !!selectedFile,
    errorsCount: Object.keys(errors).length
  });

  if (loading) {
    console.log('⏳ Mostrando loading spinner');
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Nueva Solicitud de Certificado</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de Certificado */}
        <div>
          <label htmlFor="certificateType" className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Certificado *
          </label>
          <select
            id="certificateType"
            name="certificateType"
            value={formData.certificateType}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.certificateType ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Selecciona un tipo de certificado</option>
            {Object.entries(CERTIFICATE_TYPES).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>
          {errors.certificateType && (
            <p className="mt-1 text-sm text-red-600">{errors.certificateType}</p>
          )}
        </div>

        {/* Información Personal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Tu nombre"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              Apellido *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Tu apellido"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="tu@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="(507) 1234-5678"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cedula" className="block text-sm font-medium text-gray-700 mb-2">
              Cédula *
            </label>
            <input
              type="text"
              id="cedula"
              name="cedula"
              value={formData.cedula}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.cedula ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="8-123-4567"
            />
            {errors.cedula && (
              <p className="mt-1 text-sm text-red-600">{errors.cedula}</p>
            )}
          </div>

          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Nacimiento *
            </label>
            <input
              type="date"
              id="birthDate"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.birthDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.birthDate && (
              <p className="mt-1 text-sm text-red-600">{errors.birthDate}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            Dirección *
          </label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            rows="3"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.address ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Tu dirección completa"
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address}</p>
          )}
        </div>

        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
            Motivo de la Solicitud *
          </label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            rows="3"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.reason ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Explica brevemente para qué necesitas este certificado"
          />
          {errors.reason && (
            <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
          )}
        </div>

        <div>
          <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-2">
            Información Adicional
          </label>
          <textarea
            id="additionalInfo"
            name="additionalInfo"
            value={formData.additionalInfo}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Cualquier información adicional que consideres relevante (opcional)"
          />
        </div>

        {/* ✅ SIMPLIFICADO: Input file básico */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Documento de Identidad *
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.document ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {selectedFile && (
            <p className="mt-1 text-sm text-gray-600">
              Archivo seleccionado: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </p>
          )}
          {errors.document && (
            <p className="mt-1 text-sm text-red-600">{errors.document}</p>
          )}
        </div>

        {/* Error de envío */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel || (() => navigate('/dashboard'))}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" />
                Enviando...
              </>
            ) : (
              'Enviar Solicitud'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RequestForm;