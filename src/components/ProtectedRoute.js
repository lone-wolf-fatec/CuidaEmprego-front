// ========== ProtectedRoute.js - COMPONENTE DE PROTEÇÃO DE ROTAS ==========
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, requireAuth = true, requireAdmin = false }) => {
  const location = useLocation();

  // Verificar se há dados de usuário
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  
  console.log('🛡️ ProtectedRoute verificação:', {
    currentPath: location.pathname,
    requireAuth,
    requireAdmin,
    userExists: !!user.email,
    userAuthenticated: user.authenticated,
    hasToken: !!token,
    userRoles: user.roles,
    isAdmin: user.isAdmin
  });

  // Se requer autenticação e não está autenticado
  if (requireAuth) {
    if (!user.authenticated || !token || !user.email) {
      console.log('❌ Usuário não autenticado - redirecionando para login');
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }

  // Se requer admin e não é admin
  if (requireAdmin) {
    const userRoles = Array.isArray(user.roles) ? user.roles : [user.roles].filter(Boolean);
    const isAdmin = userRoles.some(role => 
      role && typeof role === 'string' && role.toUpperCase() === 'ADMIN'
    ) || user.isAdmin === true || user.email === 'admin@cuidaemprego.com';

    if (!isAdmin) {
      console.log('❌ Usuário não é admin - redirecionando para dashboard');
      return <Navigate to="/dashboard" replace />;
    }
  }

  console.log('✅ Acesso autorizado');
  return children;
};

export default ProtectedRoute;
