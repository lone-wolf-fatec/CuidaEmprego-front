// hooks/useAuth.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Função para pegar o token
  const getToken = () => {
    return sessionStorage.getItem('token') || localStorage.getItem('token');
  };

  // Função para decodificar token JWT
  const decodeToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error('Erro ao decodificar token:', error);
      return null;
    }
  };

  // Função para verificar se o token é válido
  const isTokenValid = (token) => {
    if (!token) return false;
    
    try {
      const payload = decodeToken(token);
      if (!payload) return false;
      
      // Verificar se o token não expirou
      const now = Date.now() / 1000;
      if (payload.exp && payload.exp < now) {
        console.log('Token expirado');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao validar token:', error);
      return false;
    }
  };

  // Função para fazer logout
  const logout = () => {
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  // Função para verificar autenticação
  const checkAuth = async () => {
    setLoading(true);
    setError(null);
    
    const token = getToken();
    
    if (!token) {
      console.log('Nenhum token encontrado');
      setLoading(false);
      return null;
    }

    if (!isTokenValid(token)) {
      console.log('Token inválido ou expirado');
      logout();
      return null;
    }

    try {
      // Buscar dados do usuário do backend
      const response = await fetch('http://localhost:8080/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        console.log('Token não autorizado pelo servidor');
        logout();
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const userData = await response.json();
      console.log('Dados do usuário carregados:', userData);
      
      setUser(userData);
      setLoading(false);
      return userData;
      
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setError(error.message);
      
      // Se for erro de rede, manter o usuário logado com dados do token
      const payload = decodeToken(token);
      if (payload) {
        const fallbackUser = {
          id: payload.userId || payload.id || payload.sub,
          name: payload.name || 'Usuário',
          email: payload.email || '',
          role: payload.role || 'funcionario',
          isAdmin: payload.role === 'admin' || payload.isAdmin || false
        };
        console.log('Usando dados do token como fallback:', fallbackUser);
        setUser(fallbackUser);
      } else {
        logout();
      }
      
      setLoading(false);
      return null;
    }
  };

  // Effect para verificar autenticação na inicialização
  useEffect(() => {
    checkAuth();
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.isAdmin === true,
    checkAuth,
    logout,
    getToken
  };
};