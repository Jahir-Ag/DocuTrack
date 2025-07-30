import api from './api';

export const authService = {
  // Login
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });
      
      const { token, user } = response.data.data;
      
      // Guardar token en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { token, user };
    } catch (error) {
      console.error('Error en login:', error);
      throw new Error(error.response?.data?.error || 'Error de autenticación');
    }
  },

  // Registro
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Error en registro:', error);
      throw new Error(error.response?.data?.error || 'Error en registro');
    }
  },

  // Logout
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Verificar si está autenticado
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  // Obtener usuario actual
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Verificar token
  async verifyToken() {
    try {
      const response = await api.get('/auth/verify');
      return response.data;
    } catch (error) {
      // Token inválido, limpiar localStorage
      this.logout();
      throw error;
    }
  },

  // Actualizar perfil
  async updateProfile(userData) {
    try {
      const response = await api.put('/auth/profile', userData);
      
      // Actualizar usuario en localStorage
      const updatedUser = response.data.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return response.data;
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      throw new Error(error.response?.data?.error || 'Error actualizando perfil');
    }
  },

  // Cambiar contraseña
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      throw new Error(error.response?.data?.error || 'Error cambiando contraseña');
    }
  }
};