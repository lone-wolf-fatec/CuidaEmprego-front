// ===== utils/apiConfig.js - Configuração Central da API =====
import axios from 'axios';

// ✅ CONFIGURAÇÃO PRINCIPAL DA API
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// ✅ INTERCEPTOR PARA ADICIONAR TOKEN (SUPORTA AMBOS)
api.interceptors.request.use(
  (config) => {
    // Tentar JWT primeiro, depois token simples
    const jwtToken = localStorage.getItem('jwtToken');
    const simpleToken = localStorage.getItem('authToken') || localStorage.getItem('token');
    
    if (jwtToken) {
      config.headers.Authorization = `Bearer ${jwtToken}`;
      console.log('🔒 Token JWT adicionado');
    } else if (simpleToken) {
      config.headers.Authorization = `Bearer ${simpleToken}`;
      console.log('🔒 Token simples adicionado');
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ INTERCEPTOR PARA RESPOSTAS
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('🔐 Token inválido, limpando dados');
      // Limpar todos os tipos de token
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('user');
      
      // Redirecionar apenas se não estivermos na página de login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ✅ FUNÇÕES UTILITÁRIAS PARA AUTENTICAÇÃO
export const AuthUtils = {
  // Verificar se o usuário está autenticado
  isAuthenticated: () => {
    const jwtToken = localStorage.getItem('jwtToken');
    const simpleToken = localStorage.getItem('authToken') || localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('currentUser') || localStorage.getItem('user') || '{}');
    
    return (jwtToken || simpleToken) && user.authenticated;
  },

  // Obter dados do usuário atual
  getCurrentUser: () => {
    const userData = localStorage.getItem('currentUser') || localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  },

  // Obter token atual
  getToken: () => {
    return localStorage.getItem('jwtToken') || localStorage.getItem('authToken') || localStorage.getItem('token');
  },

  // Fazer logout completo
  logout: () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Verificar se é admin
  isAdmin: () => {
    const user = AuthUtils.getCurrentUser();
    return user && (
      user.isAdmin === true ||
      user.username === 'admin' ||
      user.email?.includes('admin') ||
      (user.roles && user.roles.includes('ADMIN'))
    );
  }
};

// ✅ SIMULAÇÃO DE FUNCIONÁRIOS PARA SISTEMAS SEM BACKEND
export const mockFuncionarios = [
  {
    id: 1,
    name: 'Administrador Sistema',
    username: 'admin',
    email: 'admin@cuidaemprego.com',
    cargo: 'Administrador',
    departamento: 'TI',
    isAdmin: true
  },
  {
    id: 2,
    name: 'João Silva Santos',
    username: 'joao',
    email: 'joao@empresa.com',
    cargo: 'Desenvolvedor',
    departamento: 'TI',
    isAdmin: false
  },
  {
    id: 3,
    name: 'Maria Oliveira Costa',
    username: 'maria',
    email: 'maria@empresa.com',
    cargo: 'Analista',
    departamento: 'RH',
    isAdmin: false
  },
  {
    id: 4,
    name: 'Carlos Eduardo Lima',
    username: 'carlos',
    email: 'carlos@empresa.com',
    cargo: 'Analista',
    departamento: 'Financeiro',
    isAdmin: false
  },
  {
    id: 5,
    name: 'Ana Paula Ferreira',
    username: 'ana',
    email: 'ana@empresa.com',
    cargo: 'Designer',
    departamento: 'Marketing',
    isAdmin: false
  }
];

// ✅ EXPORTAR API CONFIGURADA
export default api;