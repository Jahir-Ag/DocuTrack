import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RequestForm from '../components/forms/RequestForm';
import Button from '../components/common/Button';

const NewRequest = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState('');

  const certificateTypes = [
    {
      id: 'NACIMIENTO',
      title: 'Certificado de Nacimiento',
      description: 'Documento oficial que certifica el nacimiento de una persona.',
      icon: '👶',
      requirements: [
        'Documento de identidad del solicitante',
        'Documento de identidad de los padres (si aplica)',
        'Formulario de solicitud completo'
      ],
      processingTime: '5-7 días hábiles',
      price: 'Gratuito'
    },
    {
      id: 'ESTUDIOS',
      title: 'Certificado de Estudios',
      description: 'Documento que certifica los estudios realizados en una institución educativa.',
      icon: '🎓',
      requirements: [
        'Documento de identidad del solicitante',
        'Certificado o diploma original',
        'Formulario de solicitud completo'
      ],
      processingTime: '3-5 días hábiles',
      price: 'Gratuito'
    },
    {
      id: 'RESIDENCIA',
      title: 'Certificado de Residencia',
      description: 'Documento que certifica el lugar de residencia actual.',
      icon: '🏠',
      requirements: [
        'Documento de identidad del solicitante',
        'Comprobante de domicilio',
        'Formulario de solicitud completo'
      ],
      processingTime: '2-3 días hábiles',
      price: 'Gratuito'
    },
    {
      id: 'ANTECEDENTES',
      title: 'Certificado de Antecedentes',
      description: 'Documento que certifica la ausencia de antecedentes penales.',
      icon: '📋',
      requirements: [
        'Documento de identidad del solicitante',
        'Formulario de solicitud completo',
        'Declaración jurada'
      ],
      processingTime: '7-10 días hábiles',
      price: 'Gratuito'
    }
  ];

  const handleSelectType = (type) => {
    setSelectedType(type);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    navigate('/my-requests');
  };

  const handleBackToSelection = () => {
    setShowForm(false);
    setSelectedType('');
  };

  if (showForm) {
    const typeInfo = certificateTypes.find(t => t.id === selectedType);
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="secondary"
            onClick={handleBackToSelection}
            className="mb-4"
          >
            ← Volver a Selección
          </Button>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">{typeInfo?.icon}</span>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{typeInfo?.title}</h2>
                <p className="text-gray-600">{typeInfo?.description}</p>
              </div>
            </div>
          </div>
        </div>
        
        <RequestForm
          certificateType={selectedType}
          onSuccess={handleFormSuccess}
          onCancel={handleBackToSelection}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Nueva Solicitud de Certificado
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Selecciona el tipo de certificado que necesitas. Te guiaremos paso a paso 
          en el proceso de solicitud.
        </p>
      </div>

      {/* Certificate Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {certificateTypes.map((type) => (
          <div
            key={type.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer group"
            onClick={() => handleSelectType(type.id)}
          >
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-4 rounded-full mr-4 group-hover:bg-blue-200 transition-colors">
                  <span className="text-3xl">{type.icon}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {type.title}
                  </h3>
                  <p className="text-gray-600 mt-1">{type.description}</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Requisitos:</h4>
                  <ul className="space-y-1">
                    {type.requirements.map((req, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="text-green-500 mr-2 mt-0.5">✓</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Tiempo de procesamiento:</span>
                    <p className="text-sm text-gray-900 font-medium">{type.processingTime}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Precio:</span>
                    <p className="text-sm text-green-600 font-medium">{type.price}</p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <Button
                  variant="primary"
                  className="w-full group-hover:bg-blue-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectType(type.id);
                  }}
                >
                  Solicitar {type.title}
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Information Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            ¿Cómo funciona el proceso?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-semibold">
                1
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Selecciona</h3>
              <p className="text-sm text-gray-600">Elige el tipo de certificado que necesitas</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-semibold">
                2
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Completa</h3>
              <p className="text-sm text-gray-600">Llena el formulario y adjunta los documentos</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-semibold">
                3
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Espera</h3>
              <p className="text-sm text-gray-600">Nuestro equipo revisará tu solicitud</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-semibold">
                4
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Descarga</h3>
              <p className="text-sm text-gray-600">Recibe y descarga tu certificado oficial</p>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-yellow-900">Información Importante</h3>
            <div className="mt-2 text-yellow-800">
              <ul className="list-disc list-inside space-y-1">
                <li>Todos los documentos deben estar en formato PDF o JPG</li>
                <li>El tamaño máximo por archivo es de 10MB</li>
                <li>Asegúrate de que los documentos sean legibles</li>
                <li>Los tiempos de procesamiento son estimados y pueden variar</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewRequest;