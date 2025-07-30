import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FileText, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Home,
  Plus,
  FolderOpen,
  Settings
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const userNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/new-request', label: 'Nueva Solicitud', icon: Plus },
    { path: '/my-requests', label: 'Mis Solicitudes', icon: FolderOpen }
  ];

  const adminNavItems = [
    { path: '/admin/dashboard', label: 'Panel Admin', icon: Settings },
    { path: '/admin/requests', label: 'Gestionar Solicitudes', icon: FolderOpen }
  ];

  const navItems = user?.role === 'ADMIN' ? adminNavItems : userNavItems;

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <FileText className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">DocuTrack</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">DocuTrack</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <User className="w-4 h-4" />
              <span>{user?.name}</span>
              {user?.role === 'ADMIN' && (
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                  Admin
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 p-2"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 border-t border-gray-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive(item.path)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
            
            {/* User info mobile */}
            <div className="px-3 py-2 border-t border-gray-200 mt-3">
              <div className="flex items-center space-x-2 text-sm text-gray-700 mb-3">
                <User className="w-4 h-4" />
                <span>{user?.name}</span>
                {user?.role === 'ADMIN' && (
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                    Admin
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;