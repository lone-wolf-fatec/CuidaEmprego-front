import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// ✅ IMPORT CORRETO DO HOOK
import { useFuncionarios } from '../hooks/useFuncionarios';
import PontoBatidoTab from '../components/PontoBatidoFlexivel';
import AjustesPontoTab from '../components/AjustesPontoTab';
import JornadasTab from '../components/JornadasTab';
import RelatoriosTab from '../components/RelatoriosTab';
import NotificacoesTab from '../components/NotificacoesTab';
import BancoHorasTab from '../components/BancoHorasTab';
import AusenciasTab from '../components/AusenciasTab';
import ContestacaoAdmin from '../components/ContestacaoAdmin';
import GestaoTempoTab from '../components/GestaoTempoTab'; 
import HorasExtrasTab from '../components/HorasExtrasTab';

// Configuração do Axios para comunicação com o backend
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {'Content-Type': 'application/json'},
});

// Interceptor para incluir token nas requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para lidar com erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  // ✅ USO CORRETO DO HOOK useFuncionarios
  const { funcionarios, loading: loadingFuncionarios, reloadFuncionarios } = useFuncionarios();
  
  const [userData, setUserData] = useState({
    name: 'Carregando...',
    initials: 'A',
    isAdmin: false,
    email: ''
  });
  const [activeTab, setActiveTab] = useState('pontoBatido');
  const [notifications, setNotifications] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [contestacoesPendentes, setContestacoesPendentes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ✅ FUNÇÃO PARA MARCAR QUE ADMIN VISITOU A PÁGINA
  const markAdminVisited = () => {
    localStorage.setItem('admin_visited_admin_page', 'true');
  };

  // ✅ useEffect PARA VERIFICAÇÃO DE ADMIN
  useEffect(() => {
    const forceAdminCheck = () => {
      console.log('🔍 AdminDashboard - Verificação de admin');
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      
      if (!token || !storedUser.authenticated) {
        console.log('❌ AdminDashboard - Usuário não autenticado');
        navigate('/login');
        return false;
      }

      const isAdmin = storedUser.isAdmin ||
                      storedUser.email === 'admin@cuidaemprego.com' ||
                      (storedUser.roles && storedUser.roles.some(role =>
                        role && typeof role === 'string' && role.toUpperCase() === 'ADMIN'
                      ));
      
      if (!isAdmin) {
        console.log('❌ AdminDashboard - Usuário não é admin, redirecionando para /dashboard');
        navigate('/dashboard');
        return false;
      }

      console.log('✅ AdminDashboard - Admin verificado');
      
      // ✅ MARCAR QUE ADMIN VISITOU A PÁGINA ADMIN
      markAdminVisited();
      
      return true;
    };

    const isValidAdmin = forceAdminCheck();
    if (!isValidAdmin) return;

    const initializeAdmin = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        console.log("🚀 AdminDashboard - Inicializando dashboard admin");
        
        setUserData({
          name: storedUser.name || 'Administrador',
          email: storedUser.email || 'admin@cuidaemprego.com',
          initials: (storedUser.name || 'A').charAt(0).toUpperCase(),
          isAdmin: true
        });
        
        setLoading(false);
        console.log("✅ AdminDashboard - Dashboard inicializado");
        
      } catch (error) {
        console.error("❌ AdminDashboard - Erro ao inicializar:", error);
        setError('Erro ao carregar o painel administrativo');
        setLoading(false);
      }
    };
    
    initializeAdmin();
  }, [navigate]);

  // ✅ useEffect PARA CARREGAR FUNCIONÁRIOS
  useEffect(() => {
    const setupFuncionarios = async () => {
      if (loading) return;

      console.log('🔄 AdminDashboard - Carregando funcionários...');
      try {
        // ✅ USA A FUNÇÃO CORRETA DO HOOK
        const funcionariosCarregados = await reloadFuncionarios();
        console.log('✅ AdminDashboard - Funcionários carregados:', funcionariosCarregados?.length || funcionarios.length);
        
      } catch (error) {
        console.error('❌ AdminDashboard - Erro ao carregar funcionários:', error);
      }
    };
    
    setupFuncionarios();
    
    // ✅ INTERVALO PARA RECARREGAR FUNCIONÁRIOS
    const interval = setInterval(() => {
      if (!loadingFuncionarios) {
        reloadFuncionarios();
      }
    }, 30000); // 30 segundos
    
    return () => clearInterval(interval);
  }, [loading, reloadFuncionarios, loadingFuncionarios, funcionarios.length]);
  // ✅ useEffect PARA CARREGAR NOTIFICAÇÕES
  useEffect(() => {
    const loadNotifications = async () => {
      if (loading || !userData.isAdmin) return;
      
      try {
        console.log("🔔 AdminDashboard - Carregando notificações...");
        const response = await api.get('/admin/notificacoes');
        const backendNotifications = response.data.map(notif => ({
          id: notif.id,
          message: notif.mensagem,
          date: new Date(notif.dataCriacao).toLocaleDateString('pt-BR'),
          read: notif.lida,
          type: notif.tipo || 'geral',
          urgent: notif.urgente || false
        }));
        setNotifications(backendNotifications);
        console.log(`✅ AdminDashboard - Notificações carregadas: ${backendNotifications.length}`);
      } catch (error) {
        console.error("❌ AdminDashboard - Erro ao carregar notificações:", error);
        // Fallback para notificações locais
        const localNotifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
        setNotifications(localNotifications);
        console.log("🔄 AdminDashboard - Usando notificações locais");
      }
    };
    
    loadNotifications();
  }, [loading, userData.isAdmin]);

  // ✅ useEffect PARA CARREGAR CONTESTAÇÕES
  useEffect(() => {
    const loadContestacoes = async () => {
      if (loading || !userData.isAdmin) return;
      
      try {
        console.log("📝 AdminDashboard - Carregando contestações pendentes...");
        const response = await api.get('/admin/contestacoes/pendentes');
        setContestacoesPendentes(response.data.length || 0);
        console.log(`✅ AdminDashboard - Contestações pendentes: ${response.data.length || 0}`);
      } catch (error) {
        console.error("❌ AdminDashboard - Erro ao carregar contestações:", error);
        // Fallback para contestações locais
        const localContestacoes = JSON.parse(localStorage.getItem('contestacoes') || '[]');
        const pendentes = localContestacoes.filter(c => c.status === 'pendente').length;
        setContestacoesPendentes(pendentes);
        console.log(`🔄 AdminDashboard - Usando contestações locais: ${pendentes}`);
      }
    };
    
    loadContestacoes();

    // Atualizar contestações a cada 30 segundos
    const interval = setInterval(loadContestacoes, 30000);
    return () => clearInterval(interval);
  }, [loading, userData.isAdmin]);

  // ✅ FUNÇÃO PARA CONTAR NOTIFICAÇÕES NÃO LIDAS
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // ✅ FUNÇÃO PARA MARCAR TODAS AS NOTIFICAÇÕES COMO LIDAS
  const markAllNotificationsAsRead = async () => {
    try {
      await api.post('/admin/notificacoes/marcar-todas-lidas');
      const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updatedNotifications);
      console.log("✅ AdminDashboard - Todas as notificações marcadas como lidas");
    } catch (error) {
      console.error("❌ AdminDashboard - Erro ao marcar notificações como lidas:", error);
      // Fallback local
      const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updatedNotifications);
      localStorage.setItem('adminNotifications', JSON.stringify(updatedNotifications));
    }
  };

  // ✅ FUNÇÃO PARA MARCAR UMA NOTIFICAÇÃO COMO LIDA
  const markNotificationAsRead = async (id) => {
    try {
      await api.post(`/admin/notificacoes/${id}/marcar-lida`);
      const updatedNotifications = notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      );
      setNotifications(updatedNotifications);
      console.log(`✅ AdminDashboard - Notificação ${id} marcada como lida`);
    } catch (error) {
      console.error(`❌ AdminDashboard - Erro ao marcar notificação ${id} como lida:`, error);
      // Fallback local
      const updatedNotifications = notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      );
      setNotifications(updatedNotifications);
      localStorage.setItem('adminNotifications', JSON.stringify(updatedNotifications));
    }
  };

  // ✅ FUNÇÃO DE LOGOUT
  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      console.log("✅ AdminDashboard - Logout realizado no backend");
    } catch (error) {
      console.log("⚠️ AdminDashboard - Erro no logout do backend (não crítico):", error);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('admin_visited_admin_page');
      localStorage.removeItem('funcionarios_cache');
      console.log("🔄 AdminDashboard - Dados locais limpos, redirecionando...");
      navigate('/login');
    }
  };

  // ✅ FUNÇÃO DE NAVEGAÇÃO ENTRE ABAS
  const handleNavigation = (tab) => {
    console.log(`🔄 AdminDashboard - Navegando para aba: ${tab}`);
    if (tab === 'horasExtras') {
      setActiveTab('gestaoTempo');
    } else {
      setActiveTab(tab);
    }
  };

  // ✅ FUNÇÃO PARA IR PARA O DASHBOARD DO FUNCIONÁRIO
  const goToDashboard = () => {
    console.log("🔄 AdminDashboard - Navegando para dashboard do funcionário");
    navigate('/dashboard');
  };

  // ✅ TELA DE LOADING
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Carregando painel administrativo...</p>
          <p className="text-sm text-purple-300 mt-2">Verificando permissões...</p>
          {loadingFuncionarios && (
            <p className="text-xs text-purple-400 mt-1">Carregando funcionários...</p>
          )}
        </div>
      </div>
    );
  }
  // ✅ RENDER DO COMPONENTE
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-black text-white flex flex-col">
      {error && (
        <div className="bg-yellow-600 bg-opacity-80 text-white px-4 py-2 text-center text-sm">
          ⚠️ {error}
        </div>
      )}
      
      {/* ✅ BARRA SUPERIOR COM INFO DOS FUNCIONÁRIOS */}
      <div className="bg-purple-800 bg-opacity-60 px-4 py-2">
        <div className="container mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-purple-200">👑 Painel Administrativo</span>
            <span className="text-purple-300">|</span>
            <span className="text-green-400">
              {loadingFuncionarios ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-400 mr-1"></div>
                  Carregando funcionários...
                </span>
              ) : (
                `👥 ${funcionarios.length} funcionários cadastrados`
              )}
            </span>
          </div>
          <button
            onClick={goToDashboard}
            className="bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded text-xs transition-all"
          >
            📋 Ver Dashboard
          </button>
        </div>
      </div>
      
    {/* ✅ HEADER PRINCIPAL COM NOME CORRETO */}
<header className="bg-purple-900 bg-opacity-80 shadow-lg sticky top-0 z-10">
  <div className="container mx-auto px-4 py-3 flex justify-between items-center">
    <div className="flex items-center">
      <div className="bg-purple-600 rounded-full p-1 mr-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <span className="text-xl font-bold">CuidaEmprego | Administrador</span>
    </div>
    
    <div className="flex items-center space-x-4">
      {/* Resto do código das notificações... */}
      
      {/* ✅ DROPDOWN DO PERFIL COM NOME CORRETO */}
      <div className="relative">
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="flex items-center space-x-2 focus:outline-none"
        >
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
            <span className="font-medium text-sm">A</span>
          </div>
          {/* ✅ SEMPRE MOSTRAR "Admin" PARA ADMINISTRADORES */}
          <span className="hidden md:inline-block">Admin</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showProfileMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-purple-800 rounded-md shadow-lg py-1 z-20">
            <div className="px-4 py-2 border-b border-purple-700">
              {/* ✅ SEMPRE MOSTRAR "Admin" NO DROPDOWN */}
              <p className="text-sm font-medium">Admin</p>
              <p className="text-xs text-purple-300">{userData.email}</p>
            </div>
            <a href="#" className="block px-4 py-2 text-sm hover:bg-purple-700">Meu Perfil</a>
            <a href="#" className="block px-4 py-2 text-sm hover:bg-purple-700">Configurações</a>
            <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm hover:bg-purple-700">Sair</button>
          </div>
        )}
      </div>
    </div>
  </div>
</header>
      {/* ✅ CORPO PRINCIPAL COM SIDEBAR E CONTEÚDO */}
      <div className="flex-grow flex">
        {/* ✅ SIDEBAR */}
        <div className="w-64 bg-purple-900 bg-opacity-60 shadow-lg hidden md:block">
          <div className="p-4">
            <h2 className="text-lg font-bold mb-4">Menu Administrativo</h2>
            <nav>
              <ul>
                <li className="mb-2">
                  <button
                    onClick={() => handleNavigation('pontoBatido')}
                    className={`w-full flex items-center p-2 rounded-md transition-colors ${activeTab === 'pontoBatido' ? 'bg-purple-700' : 'hover:bg-purple-800'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Ponto Batido
                  </button>
                </li>
                <li className="mb-2">
                  <button
                    onClick={() => handleNavigation('ajustesPonto')}
                    className={`w-full flex items-center p-2 rounded-md transition-colors ${activeTab === 'ajustesPonto' ? 'bg-purple-700' : 'hover:bg-purple-800'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Ajustes de Ponto
                  </button>
                </li>
                <li className="mb-2">
                  <button
                    onClick={() => handleNavigation('jornadas')}
                    className={`w-full flex items-center p-2 rounded-md transition-colors ${activeTab === 'jornadas' ? 'bg-purple-700' : 'hover:bg-purple-800'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Jornadas de Trabalho
                  </button>
                </li>
                <li className="mb-2">
                  <button
                    onClick={() => handleNavigation('gestaoTempo')}
                    className={`w-full flex items-center p-2 rounded-md transition-colors ${activeTab === 'gestaoTempo' ? 'bg-purple-700' : 'hover:bg-purple-800'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Gestão de Tempo
                  </button>
                </li>
                <li className="mb-2">
                  <button
                    onClick={() => handleNavigation('contestacoes')}
                    className={`w-full flex items-center p-2 rounded-md relative transition-colors ${activeTab === 'contestacoes' ? 'bg-purple-700' : 'hover:bg-purple-800'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Contestações
                    {contestacoesPendentes > 0 && (
                      <span className="absolute right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {contestacoesPendentes}
                      </span>
                    )}
                  </button>
                </li>
                <li className="mb-2">
                  <button
                    onClick={() => handleNavigation('ausencias')}
                    className={`w-full flex items-center p-2 rounded-md transition-colors ${activeTab === 'ausencias' ? 'bg-purple-700' : 'hover:bg-purple-800'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Ausências
                  </button>
                </li>
                <li className="mb-2">
                  <button
                    onClick={() => handleNavigation('bancoHoras')}
                    className={`w-full flex items-center p-2 rounded-md transition-colors ${activeTab === 'bancoHoras' ? 'bg-purple-700' : 'hover:bg-purple-800'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    Banco de Horas
                  </button>
                </li>
                <li className="mb-2">
                  <button
                    onClick={() => handleNavigation('relatorios')}
                    className={`w-full flex items-center p-2 rounded-md transition-colors ${activeTab === 'relatorios' ? 'bg-purple-700' : 'hover:bg-purple-800'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Relatórios
                  </button>
                </li>
                <li className="mb-2">
                  <button
                    onClick={() => handleNavigation('notificacoes')}
                    className={`w-full flex items-center p-2 rounded-md transition-colors ${activeTab === 'notificacoes' ? 'bg-purple-700' : 'hover:bg-purple-800'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Notificações
                    {unreadNotificationsCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </button>
                </li>
              </ul>
            </nav>
            
            {/* ✅ INFO DOS FUNCIONÁRIOS NA SIDEBAR */}
            <div className="mt-6 p-3 bg-purple-800 bg-opacity-50 rounded">
              <h3 className="text-sm font-semibold mb-2">👥 Funcionários</h3>
              {loadingFuncionarios ? (
                <div className="flex items-center text-xs text-purple-300">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-400 mr-2"></div>
                  Carregando...
                </div>
              ) : (
                <div className="text-xs text-purple-300">
                  <p>📊 Total: <span className="text-white font-medium">{funcionarios.length}</span></p>
                  <p>🔄 Última atualização: {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  {funcionarios.length > 0 && (
                    <div className="mt-2">
                      <p className="text-green-400">✅ Sistema online</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* ✅ ÁREA PRINCIPAL DE CONTEÚDO */}
        <div className="flex-1 p-4 overflow-y-auto">
          
          {/* ✅ RENDERIZAÇÃO DAS ABAS */}
          {activeTab === 'pontoBatido' && <PontoBatidoTab />}
          {activeTab === 'ajustesPonto' && <AjustesPontoTab />}
          {activeTab === 'jornadas' && <JornadasTab />}
          {activeTab === 'gestaoTempo' && <GestaoTempoTab />}
          {activeTab === 'contestacoes' && <ContestacaoAdmin />}
          {activeTab === 'ausencias' && <AusenciasTab />}
          {activeTab === 'bancoHoras' && <BancoHorasTab />}
          {activeTab === 'relatorios' && <RelatoriosTab />}
          {activeTab === 'notificacoes' && <NotificacoesTab />}
        </div>
      </div>
      
      {/* ✅ FOOTER */}
      <footer className="bg-purple-900 bg-opacity-80 shadow-lg py-4">
        <div className="container mx-auto px-4 text-center text-purple-300 text-sm">
          <p>&copy; 2025 CuidaEmprego. Todos os direitos reservados.</p>
          <p className="text-xs mt-1">
            {loadingFuncionarios ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-400 mr-1"></div>
                Sincronizando funcionários do banco de dados...
              </span>
            ) : funcionarios.length > 0 ? (
              `Sistema carregado com ${funcionarios.length} funcionários ativos`
            ) : (
              "⚠️ Nenhum funcionário encontrado no banco de dados"
            )}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;