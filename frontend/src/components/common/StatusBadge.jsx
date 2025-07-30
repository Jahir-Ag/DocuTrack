import React from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  FileCheck,
  Eye
} from 'lucide-react';

const StatusBadge = ({ status, showIcon = true, size = 'md' }) => {
  const statusConfig = {
    PENDING: {
      label: 'Pendiente',
      className: 'badge-pending',
      icon: Clock
    },
    IN_VALIDATION: {
      label: 'En Validación',
      className: 'badge-in-validation', 
      icon: Eye
    },
    APPROVED: {
      label: 'Aprobado',
      className: 'badge-approved',
      icon: CheckCircle
    },
    REJECTED: {
      label: 'Rechazado',
      className: 'badge-rejected',
      icon: XCircle
    },
    ISSUED: {
      label: 'Emitido',
      className: 'badge-issued',
      icon: FileCheck
    },
    CORRECTION_REQUESTED: {
      label: 'Corrección Solicitada',
      className: 'badge-warning',
      icon: AlertCircle
    }
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5', 
    lg: 'text-sm px-3 py-1'
  };

  const config = statusConfig[status];
  
  if (!config) {
    return (
      <span className={`badge bg-gray-100 text-gray-800 ${sizes[size]}`}>
        {status}
      </span>
    );
  }

  const Icon = config.icon;
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-4 h-4'
  };

  return (
    <span className={`badge ${config.className} ${sizes[size]}`}>
      {showIcon && <Icon className={`${iconSizes[size]} mr-1`} />}
      {config.label}
    </span>
  );
};

// Función helper para obtener el color del estado
export const getStatusColor = (status) => {
  const colors = {
    PENDING: 'yellow',
    IN_VALIDATION: 'blue',
    APPROVED: 'green', 
    REJECTED: 'red',
    ISSUED: 'purple',
    CORRECTION_REQUESTED: 'orange'
  };
  
  return colors[status] || 'gray';
};

// Función helper para obtener el progreso del estado
export const getStatusProgress = (status) => {
  const progress = {
    PENDING: 20,
    IN_VALIDATION: 40,
    APPROVED: 60,
    ISSUED: 100,
    REJECTED: 0,
    CORRECTION_REQUESTED: 30
  };
  
  return progress[status] || 0;
};

// Componente de progreso de estado
export const StatusProgress = ({ status }) => {
  const progress = getStatusProgress(status);
  const color = getStatusColor(status);
  
  const colorClasses = {
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    gray: 'bg-gray-500'
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <StatusBadge status={status} size="sm" />
        <span className="text-xs text-gray-500">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${colorClasses[color]}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default StatusBadge;