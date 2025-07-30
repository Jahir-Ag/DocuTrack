import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, FileText, UserPlus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';
import { validateEmail } from '../../utils/validators';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, loading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        cedula: data.cedula,
        phone: data.phone
      });
    } catch (error) {
      if (error.response?.status === 400) {
        setError('root', { 
          message: 'El email ya está registrado o los datos son inválidos.' 
        });
      } else {
        setError('root', { 
          message: 'Error al registrar usuario. Inténtalo de nuevo.' 
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center bg-blue-600 rounded-full">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Crear Cuenta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Regístrate en DocuTrack para gestionar tus certificados
          </p>
        </div>

        {/* Form */}
        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Error general */}
            {errors.root && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{errors.root.message}</p>
              </div>
            )}

            {/* Nombre */}
            <div>
              <label className="form-label">
                Nombre Completo
              </label>
              <input
                type="text"
                className={`form-input ${errors.name ? 'border-red-500' : ''}`}
                placeholder="Tu nombre completo"
                {...register('name', {
                  required: 'El nombre es requerido',
                  minLength: {
                    value: 2,
                    message: 'El nombre debe tener al menos 2 caracteres'
                  }
                })}
              />
              {errors.name && (
                <p className="form-error">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="form-label">
                Correo Electrónico
              </label>
              <input
                type="email"
                className={`form-input ${errors.email ? 'border-red-500' : ''}`}
                placeholder="tu@email.com"
                {...register('email', {
                  required: 'El email es requerido',
                  validate: validateEmail
                })}
              />
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>

            {/* Cédula */}
            <div>
              <label className="form-label">
                Cédula
              </label>
              <input
                type="text"
                className={`form-input ${errors.cedula ? 'border-red-500' : ''}`}
                placeholder="Tu número de cédula"
                {...register('cedula', {
                  required: 'La cédula es requerida',
                  pattern: {
                    value: /^[0-9-]+$/,
                    message: 'La cédula solo debe contener números y guiones'
                  }
                })}
              />
              {errors.cedula && (
                <p className="form-error">{errors.cedula.message}</p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label className="form-label">
                Teléfono
              </label>
              <input
                type="tel"
                className={`form-input ${errors.phone ? 'border-red-500' : ''}`}
                placeholder="Tu número de teléfono"
                {...register('phone', {
                  required: 'El teléfono es requerido',
                  pattern: {
                    value: /^[0-9+\-\s()]+$/,
                    message: 'Formato de teléfono inválido'
                  }
                })}
              />
              {errors.phone && (
                <p className="form-error">{errors.phone.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="form-label">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="Tu contraseña"
                  {...register('password', {
                    required: 'La contraseña es requerida',
                    minLength: {
                      value: 6,
                      message: 'La contraseña debe tener al menos 6 caracteres'
                    }
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="form-label">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`form-input pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="Confirma tu contraseña"
                  {...register('confirmPassword', {
                    required: 'Debes confirmar la contraseña',
                    validate: value =>
                      value === password || 'Las contraseñas no coinciden'
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="form-error">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Crear Cuenta
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;