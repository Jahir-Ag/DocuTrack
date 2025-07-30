import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'blue', 
  text = '', 
  className = '',
  fullScreen = false 
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colors = {
    blue: 'text-blue-600',
    gray: 'text-gray-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    white: 'text-white'
  };

  const spinnerClasses = `${sizes[size]} ${colors[color]} animate-spin`;
  
  const containerClasses = fullScreen 
    ? 'fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50'
    : `flex items-center justify-center ${className}`;

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center">
        <Loader2 className={spinnerClasses} />
        {text && (
          <p className="mt-2 text-sm text-gray-600 animate-pulse">
            {text}
          </p>
        )}
      </div>
    </div>
  );
};

// Componente específico para pantalla completa
export const FullScreenLoader = ({ text = 'Cargando...' }) => {
  return <LoadingSpinner fullScreen text={text} size="lg" />;
};

// Componente específico para botones
export const ButtonSpinner = () => {
  return <Loader2 className="w-4 h-4 animate-spin" />;
};

// Componente específico para elementos en línea
export const InlineSpinner = ({ text = '' }) => {
  return (
    <div className="flex items-center space-x-2">
      <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;