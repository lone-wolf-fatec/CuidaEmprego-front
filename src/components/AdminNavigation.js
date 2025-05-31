// ========== AdminNavigation.js - NAVEGAÇÃO ESPECIAL PARA ADMIN ==========
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const AdminNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useUser();

  const handleLogout = () => {
    // Limpar dados do localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('admin_visited_admin_page');
    
    // Chamar função de logout do contexto
    if (logout) {
      logout();
    }
    
    console.log('🚪 Admin deslogado - dados limpos');
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-purple-800 bg-opacity-80 backdrop-blur-lg border-b border-purple-500 border-opacity-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h2 className="text-white text-xl font-bold">CuidaEmprego Admin</h2>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive('/admin')
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-purple-200 hover:bg-purple-700 hover:text-white'
                }`}
              >
                🏛️ Painel Admin
              </Link>
              
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive('/dashboard')
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-purple-200 hover:bg-purple-700 hover:text-white'
                }`}
              >
                📊 Dashboard
              </Link>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <span className="text-purple-200 text-sm">
              👑 Administrador
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
            >
              🚪 Sair
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link
            to="/admin"
            className={`block px-3 py-2 rounded-md text-base font-medium transition-all ${
              isActive('/admin')
                ? 'bg-purple-600 text-white'
                : 'text-purple-200 hover:bg-purple-700 hover:text-white'
            }`}
          >
            🏛️ Painel Admin
          </Link>
          
          <Link
            to="/dashboard"
            className={`block px-3 py-2 rounded-md text-base font-medium transition-all ${
              isActive('/dashboard')
                ? 'bg-purple-600 text-white'
                : 'text-purple-200 hover:bg-purple-700 hover:text-white'
            }`}
          >
            📊 Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavigation;
