import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import NewRequest from './pages/NewRequest';
import MyRequests from './pages/MyRequests';
import RequestDetail from './pages/RequestDetail';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminRequests from './pages/Admin/AdminRequests';
import AdminRequestDetail from './pages/Admin/AdminRequestDetail';
import LoadingSpinner from './components/common/LoadingSpinner';
import './App.css';

// Componente de ruta protegida
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Componente de ruta pública (solo para usuarios no autenticados)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main className="min-h-screen bg-gray-50">
          <Routes>
            {/* Rutas públicas */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />

            {/* Rutas protegidas para usuarios */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/new-request" 
              element={
                <ProtectedRoute>
                  <NewRequest />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-requests" 
              element={
                <ProtectedRoute>
                  <MyRequests />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/request/:id" 
              element={
                <ProtectedRoute>
                  <RequestDetail />
                </ProtectedRoute>
              } 
            />

            {/* Rutas protegidas para administradores */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/requests" 
              element={
                <ProtectedRoute adminOnly>
                  <AdminRequests />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/requests/:id" 
              element={
                <ProtectedRoute adminOnly>
                  <AdminRequestDetail />
                </ProtectedRoute>
              } 
            />

            {/* Redirección por defecto */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Ruta 404 */}
            <Route 
              path="*" 
              element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-gray-600">Página no encontrada</p>
                  </div>
                </div>
              } 
            />
          </Routes>
        </main>
        
        {/* Toast notifications */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#22c55e',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;