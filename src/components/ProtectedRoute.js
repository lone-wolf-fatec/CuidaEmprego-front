import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const location = useLocation();
  
  // Verificar token
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Verificar usuário
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }

  let user;
  try {
    user = JSON.parse(userStr);
  } catch (error) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  // Verificar se está autenticado
  if (!user.authenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar se é admin
  const isAdmin = user.isAdmin === true || 
                  user.email === 'admin@cuidaemprego.com' || 
                  user.username === 'admin' ||
                  (user.roles && user.roles.some(role => 
                    typeof role === 'string' && role.toUpperCase() === 'ADMIN'
                  ));

  // Se rota requer admin mas usuário não é admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // CORREÇÃO: Admin pode acessar dashboard de funcionário
  // Não redirecionar admin se ele está acessando /dashboard
  
  return children;
};

export default ProtectedRoute;