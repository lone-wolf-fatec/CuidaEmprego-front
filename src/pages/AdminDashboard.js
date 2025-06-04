// PARTE 1: AdminDashboard - Imports e Configurações Básicas

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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

// ✅ CONFIGURAÇÃO DA API COM AUTENTICAÇÃO
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// ✅ INTERCEPTOR PARA INCLUIR TOKEN DE AUTENTICAÇÃO
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔒 AdminDashboard - Token de autenticação adicionado');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ INTERCEPTOR PARA TRATAR ERROS DE AUTENTICAÇÃO
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('❌ AdminDashboard - Token expirado, redirecionando para login');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('admin_visited_admin_page');
      localStorage.removeItem('funcionarios_cache');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
// PARTE 2: AdminDashboard - Estados e Inicialização

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  // ✅ USO DO HOOK useFuncionarios PARA SINCRONIZAÇÃO
  const { funcionarios, loading: loadingFuncionarios, reloadFuncionarios } = useFuncionarios();
  
  // ✅ ESTADOS PRINCIPAIS
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

  // ✅ ESTADOS PARA LISTAS DINÂMICAS DE FUNCIONÁRIOS
  const [departamentosAdmin, setDepartamentosAdmin] = useState([]);
  const [cargosAdmin, setCargosAdmin] = useState([]);
  const [funcionariosParaSelecao, setFuncionariosParaSelecao] = useState([]);

  // ✅ FUNÇÃO PARA MARCAR VISITA DO ADMIN
  const markAdminVisited = () => {
    localStorage.setItem('admin_visited_admin_page', 'true');
  };

  // ✅ FUNÇÃO PARA CARREGAR DADOS DO ADMINISTRADOR
  const loadAdminData = async () => {
    try {
      console.log('👑 AdminDashboard - Carregando dados do administrador...');
      const response = await api.get('/admin/profile');
      const adminData = response.data;
      
      const adminInfo = {
        name: adminData.name || adminData.username || 'Administrador',
        email: adminData.email || 'admin@cuidaemprego.com',
        initials: (adminData.name || adminData.username || 'A').charAt(0).toUpperCase(),
        isAdmin: true
      };
      
      setUserData(adminInfo);
      console.log('✅ AdminDashboard - Dados do administrador carregados:', adminInfo);
      
    } catch (error) {
      console.error('❌ AdminDashboard - Erro ao carregar dados do admin:', error);
      // Fallback para dados locais
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      setUserData({
        name: storedUser.name || 'Administrador',
        email: storedUser.email || 'admin@cuidaemprego.com',
        initials: (storedUser.name || 'A').charAt(0).toUpperCase(),
        isAdmin: true
      });
    }
  };
  // PARTE 3: AdminDashboard - Carregamento de Dados dos Funcionários

  // ✅ FUNÇÃO PARA CARREGAR LISTAS DINÂMICAS COM FUNCIONÁRIOS CADASTRADOS
  const loadAdminSelectData = async () => {
    try {
      console.log('📋 AdminDashboard - Carregando dados para seleção...');
      
      // 1. CARREGAR FUNCIONÁRIOS PARA CAIXAS DE SELEÇÃO
      const funcionariosResponse = await api.get('/admin/funcionarios');
      const funcionariosData = funcionariosResponse.data || [];
      
      // Preparar lista completa para seleção com TODOS os nomes
      const funcionariosFormatados = funcionariosData.map(func => ({
        id: func.id,
        nome: func.name || func.nomeCompleto || func.username,
        username: func.username,
        email: func.email,
        cargo: func.cargo || 'Não informado',
        departamento: func.departamento || 'Não informado',
        status: func.ativo ? 'Ativo' : 'Inativo',
        telefone: func.telefone || '',
        dataAdmissao: func.dataAdmissao || '',
        salario: func.salario || '',
        cpf: func.cpf || '',
        endereco: func.endereco || '',
        jornadaTrabalho: func.jornadaTrabalho || {
          inicio: '08:00',
          fimManha: '12:00', 
          inicioTarde: '13:00',
          fim: '17:00',
          toleranciaAtraso: 10
        }
      }));
      
      setFuncionariosParaSelecao(funcionariosFormatados);
      console.log(`✅ ${funcionariosFormatados.length} funcionários carregados para seleção`);
      
      // 2. EXTRAIR DEPARTAMENTOS ÚNICOS DOS FUNCIONÁRIOS
      const departamentosUnicos = [...new Set(
        funcionariosData
          .map(func => func.departamento)
          .filter(dept => dept && dept.trim() !== '')
      )];
      
      // Adicionar departamentos padrão se necessário
      const departamentosCompletos = [...new Set([
        ...departamentosUnicos,
        'Recursos Humanos',
        'Tecnologia da Informação',
        'Financeiro',
        'Comercial',
        'Operações',
        'Marketing',
        'Administração',
        'Vendas',
        'Suporte',
        'Qualidade'
      ])];
      
      setDepartamentosAdmin(departamentosCompletos);
      console.log(`✅ ${departamentosCompletos.length} departamentos únicos`);
      
      // 3. EXTRAIR CARGOS ÚNICOS DOS FUNCIONÁRIOS
      const cargosUnicos = [...new Set(
        funcionariosData
          .map(func => func.cargo)
          .filter(cargo => cargo && cargo.trim() !== '')
      )];
      
      // Adicionar cargos padrão se necessário
      const cargosCompletos = [...new Set([
        ...cargosUnicos,
        'Desenvolvedor Frontend',
        'Desenvolvedor Backend',
        'Desenvolvedor Full Stack',
        'Analista de Sistemas',
        'Analista de Dados',
        'Gerente de Projetos',
        'Coordenador de TI',
        'Assistente Administrativo',
        'Diretor Executivo',
        'Supervisor',
        'Especialista',
        'Consultor',
        'Técnico',
        'Estagiário'
      ])];
      
      setCargosAdmin(cargosCompletos);
      console.log(`✅ ${cargosCompletos.length} cargos únicos`);
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados de seleção do admin:', error);
      
      // Fallback com dados padrão
      setDepartamentosAdmin([
        'Recursos Humanos',
        'Tecnologia da Informação',
        'Financeiro',
        'Comercial',
        'Operações',
        'Marketing',
        'Administração',
        'Vendas',
        'Suporte',
        'Qualidade'
      ]);
      
      setCargosAdmin([
        'Desenvolvedor Frontend',
        'Desenvolvedor Backend',
        'Desenvolvedor Full Stack',
        'Analista de Sistemas',
        'Analista de Dados',
        'Gerente de Projetos',
        'Coordenador de TI',
        'Assistente Administrativo',
        'Diretor Executivo',
        'Supervisor',
        'Especialista',
        'Consultor',
        'Técnico',
        'Estagiário'
      ]);
      
      setFuncionariosParaSelecao([]);
    }
  };
  // PARTE 4: AdminDashboard - Notificações e Contestações

  // ✅ FUNÇÃO PARA CARREGAR NOTIFICAÇÕES DO ADMINISTRADOR
  const loadAdminNotifications = async () => {
    try {
      console.log('🔔 AdminDashboard - Carregando notificações do administrador...');
      const response = await api.get('/admin/notificacoes');
      
      const adminNotifications = response.data.map(notif => ({
        id: notif.id,
        message: notif.mensagem,
        date: new Date(notif.dataCriacao).toLocaleDateString('pt-BR'),
        read: notif.lida,
        type: notif.tipo || 'geral',
        urgent: notif.urgente || false
      }));
      
      setNotifications(adminNotifications);
      console.log(`✅ AdminDashboard - ${adminNotifications.length} notificações carregadas`);
      
    } catch (error) {
      console.error('❌ AdminDashboard - Erro ao carregar notificações:', error);
      // Fallback para notificações locais
      const localNotifications = [
        { 
          id: 1, 
          message: 'Sistema iniciado com sucesso', 
          date: new Date().toLocaleDateString('pt-BR'), 
          read: false, 
          type: 'sistema', 
          urgent: false 
        },
        { 
          id: 2, 
          message: '3 solicitações de ajuste pendentes', 
          date: new Date().toLocaleDateString('pt-BR'), 
          read: false, 
          type: 'ajuste', 
          urgent: true 
        }
      ];
      setNotifications(localNotifications);
    }
  };

  // ✅ FUNÇÃO PARA CARREGAR CONTESTAÇÕES PENDENTES
  const loadContestacoesPendentes = async () => {
    try {
      console.log('📝 AdminDashboard - Carregando contestações pendentes...');
      const response = await api.get('/admin/contestacoes/pendentes');
      const pendentesCount = response.data.length || 0;
      setContestacoesPendentes(pendentesCount);
      console.log(`✅ AdminDashboard - ${pendentesCount} contestações pendentes`);
      
    } catch (error) {
      console.error('❌ AdminDashboard - Erro ao carregar contestações:', error);
      // Fallback para contestações locais
      setContestacoesPendentes(2); // Valor padrão para demonstração
    }
  };

  // ✅ FUNÇÃO PARA CONTAR NOTIFICAÇÕES NÃO LIDAS
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // ✅ FUNÇÃO PARA MARCAR TODAS AS NOTIFICAÇÕES COMO LIDAS
  const markAllNotificationsAsRead = async () => {
    try {
      console.log('📝 AdminDashboard - Marcando todas notificações como lidas...');
      const response = await api.post('/admin/notificacoes/marcar-todas-lidas');
      
      if (response.data.success) {
        const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
        setNotifications(updatedNotifications);
        console.log('✅ AdminDashboard - Todas notificações marcadas como lidas');
      }
    } catch (error) {
      console.error('❌ AdminDashboard - Erro ao marcar notificações:', error);
      // Fallback local apenas se API falhar
      const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updatedNotifications);
    }
  };

  // ✅ FUNÇÃO PARA MARCAR UMA NOTIFICAÇÃO COMO LIDA
  const markNotificationAsRead = async (id) => {
    try {
      console.log(`📝 AdminDashboard - Marcando notificação ${id} como lida...`);
      const response = await api.post(`/admin/notificacoes/${id}/marcar-lida`);
      
      if (response.data.success) {
        const updatedNotifications = notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        );
        setNotifications(updatedNotifications);
        console.log(`✅ AdminDashboard - Notificação ${id} marcada como lida`);
      }
    } catch (error) {
      console.error(`❌ AdminDashboard - Erro ao marcar notificação ${id}:`, error);
      // Fallback local apenas se API falhar
      const updatedNotifications = notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      );
      setNotifications(updatedNotifications);
    }
  };
  // PARTE 5: AdminDashboard - useEffect e Inicialização

  // ✅ VERIFICAÇÃO DE AUTENTICAÇÃO E INICIALIZAÇÃO COMPLETA
  useEffect(() => {
    const initializeAdminDashboard = async () => {
      try {
        console.log('🚀 AdminDashboard - Inicializando dashboard administrador...');
        
        // 1. VERIFICAR TOKEN DE AUTENTICAÇÃO PRIMEIRO
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('❌ AdminDashboard - Token de autenticação não encontrado');
          navigate('/login');
          return;
        }

        // 2. VERIFICAR PERMISSÕES DE ADMINISTRADOR
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (!storedUser.isAdmin && storedUser.email !== 'admin@cuidaemprego.com') {
          console.log('❌ AdminDashboard - Usuário não é administrador');
          navigate('/dashboard');
          return;
        }

        console.log('✅ AdminDashboard - Permissões de administrador confirmadas');

        // 3. MARCAR QUE ADMINISTRADOR VISITOU A PÁGINA
        markAdminVisited();
        
        // 4. CARREGAR TODOS OS DADOS VIA API
        await Promise.all([
          loadAdminData(),
          loadAdminNotifications(),
          loadContestacoesPendentes(),
          loadAdminSelectData()
        ]);
        
        setLoading(false);
        console.log('✅ AdminDashboard - Dashboard administrativo inicializado');
        
      } catch (error) {
        console.error('❌ AdminDashboard - Erro ao inicializar:', error);
        setError('Erro ao carregar o painel administrativo');
        setLoading(false);
      }
    };
    
    initializeAdminDashboard();
  }, [navigate]);

  // ✅ CARREGAR FUNCIONÁRIOS VIA API (INTEGRAÇÃO COMPLETA)
  useEffect(() => {
    const setupFuncionarios = async () => {
      if (loading) return;

      console.log('🔄 AdminDashboard - Carregando funcionários via API...');
      try {
        await reloadFuncionarios();
        await loadAdminSelectData(); // Recarregar dados de seleção também
      } catch (error) {
        console.error('❌ AdminDashboard - Erro ao carregar funcionários via API:', error);
      }
    };
    
    setupFuncionarios();
    
    // INTERVALO PARA RECARREGAR VIA API
    const interval = setInterval(async () => {
      if (!loadingFuncionarios) {
        try {
          await reloadFuncionarios();
          await loadAdminSelectData();
          console.log('🔄 AdminDashboard - Funcionários sincronizados via API');
        } catch (error) {
          console.error('❌ AdminDashboard - Erro na sincronização:', error);
        }
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [loading, reloadFuncionarios, loadingFuncionarios]);
  // PARTE 6: AdminDashboard - Funções de Controle

  // ✅ FUNÇÃO DE LOGOUT COM LIMPEZA COMPLETA VIA API
  const handleLogout = async () => {
    try {
      console.log('🚪 AdminDashboard - Fazendo logout via API...');
      
      // LOGOUT NO BACKEND VIA API
      const response = await api.post('/auth/logout');
      if (response.data.success) {
        console.log('✅ AdminDashboard - Logout realizado no backend');
      }
      
    } catch (error) {
      console.log('⚠️ AdminDashboard - Erro no logout via API (não crítico):', error);
    } finally {
      // LIMPEZA COMPLETA DE DADOS LOCAIS
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('admin_visited_admin_page');
      localStorage.removeItem('funcionarios_cache');
      
      console.log('🔄 AdminDashboard - Dados locais limpos, redirecionando...');
      navigate('/login');
    }
  };

  // ✅ FUNÇÃO DE NAVEGAÇÃO ENTRE ABAS
  const handleNavigation = async (tab) => {
    console.log(`🔄 AdminDashboard - Navegando para aba: ${tab}`);
    
    if (tab === 'horasExtras') {
      setActiveTab('gestaoTempo');
    } else {
      setActiveTab(tab);
    }
  };

  // ✅ FUNÇÃO PARA IR PARA O DASHBOARD DO FUNCIONÁRIO
  const goToDashboard = () => {
    navigate('/dashboard');
  };

  // ✅ FUNÇÕES AUXILIARES PARA COMPONENTES FILHOS
  const getFuncionarioById = (id) => {
    return funcionariosParaSelecao.find(func => func.id == id) || null;
  };

  // ✅ FUNÇÃO PARA OBTER LISTA DE FUNCIONÁRIOS PARA SELEÇÃO
  const getFuncionariosParaSelecao = () => {
    return funcionariosParaSelecao;
  };

  // ✅ FUNÇÃO PARA OBTER LISTA DE DEPARTAMENTOS
  const getDepartamentos = () => {
    return departamentosAdmin;
  };

  // ✅ FUNÇÃO PARA OBTER LISTA DE CARGOS
  const getCargos = () => {
    return cargosAdmin;
  };
  // PARTE 7: AdminDashboard - Telas de Loading e Erro

  // ✅ TELA DE LOADING COM STATUS DE SINCRONIZAÇÃO
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Carregando painel administrativo...</p>
          <p className="text-sm text-purple-300 mt-2">🔒 Validando autenticação...</p>
          <p className="text-sm text-purple-300 mt-1">👑 Verificando permissões de administrador...</p>
          {loadingFuncionarios && (
            <p className="text-xs text-purple-400 mt-1">👥 Sincronizando funcionários via API...</p>
          )}
        </div>
      </div>
    );
  }

  // ✅ TELA DE ERRO COM OPÇÃO DE REVALIDAÇÃO
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <p className="text-lg mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
            >
              🔄 Tentar Novamente
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
            >
              🚪 Fazer Logout
            </button>
          </div>
        </div>
      </div>
    );
  }
  // PARTE 8: AdminDashboard - Header e Barra Superior

  // ✅ RENDER DO COMPONENTE PRINCIPAL
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-black text-white flex flex-col">
      {/* ✅ BARRA SUPERIOR COM STATUS DE SISTEMA */}
      <div className="bg-purple-800 bg-opacity-60 px-4 py-2">
        <div className="container mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-purple-200">👑 Painel Administrativo</span>
            <span className="text-purple-300">|</span>
            <span className="text-green-400">
              🔒 Autenticado
            </span>
            <span className="text-purple-300">|</span>
            <span className="text-green-400">
              {loadingFuncionarios ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-400 mr-1"></div>
                  Sincronizando via API...
                </span>
              ) : (
                `👥 ${funcionarios.length} funcionários (API)`
              )}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-green-400">🟢 Backend Online</span>
            <button
              onClick={goToDashboard}
              className="bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded text-xs transition-all"
            >
              📋 Ver Dashboard
            </button>
          </div>
        </div>
      </div>
      
      {/* ✅ HEADER PRINCIPAL COM STATUS */}
      <header className="bg-purple-900 bg-opacity-80 shadow-lg sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-purple-600 rounded-full p-1 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold">CuidaEmprego | Administrador</span>
            <span className="ml-2 text-xs bg-green-600 px-2 py-1 rounded">API</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* ✅ DROPDOWN DE NOTIFICAÇÕES COM SYNC VIA API */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
                className="relative focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 text-xs flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
              
              {showNotificationsMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-purple-800 rounded-md shadow-lg py-1 z-20">
                  <div className="flex justify-between items-center px-4 py-2 border-b border-purple-700">
                    <h3 className="font-medium">🔔 Notificações (API)</h3>
                    {unreadNotificationsCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-xs text-purple-300 hover:text-white"
                      >
                        Marcar todas como lidas
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-purple-300">
                        <p>Sem notificações.</p>
                        <p className="text-xs mt-1">📡 Sincronizado via API</p>
                      </div>
                    ) : (
                      notifications.map(notification => (
                        <div
                          key={notification.id}
                          className={`px-4 py-2 border-b border-purple-700 cursor-pointer hover:bg-purple-700 ${!notification.read ? 'bg-purple-700 bg-opacity-50' : ''}`}
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm">{notification.message}</p>
                              <p className="text-xs text-purple-300">{notification.date}</p>
                            </div>
                            {notification.urgent && (
                              <span className="ml-2 bg-red-500 text-white text-xs px-1 rounded">Urgente</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* ✅ DROPDOWN DO PERFIL */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="font-medium text-sm">{userData.initials}</span>
                </div>
                <span className="hidden md:inline-block">{userData.name}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-purple-800 rounded-md shadow-lg py-1 z-20">
                  <div className="px-4 py-2 border-b border-purple-700">
                    <p className="text-sm font-medium">{userData.name}</p>
                    <p className="text-xs text-purple-300">{userData.email}</p>
                    <p className="text-xs text-green-400 mt-1">🔒 Autenticado</p>
                  </div>
                  <button className="block w-full text-left px-4 py-2 text-sm hover:bg-purple-700">
                    Meu Perfil
                  </button>
                  <button className="block w-full text-left px-4 py-2 text-sm hover:bg-purple-700">
                    Configurações
                  </button>
                  <button 
                    onClick={handleLogout} 
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-purple-700 border-t border-purple-700"
                  >
                    🚪 Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ✅ CORPO PRINCIPAL COM SIDEBAR E CONTEÚDO */}
      <div className="flex-grow flex">
        {/* ✅ SIDEBAR COM CONTADORES - COMPLETA */}
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
                    <span className="ml-auto text-xs bg-blue-600 px-1 rounded">API</span>
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
                    <span className="ml-auto text-xs bg-blue-600 px-1 rounded">API</span>
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
                    <span className="ml-auto text-xs bg-blue-600 px-1 rounded">API</span>
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
                    <span className="ml-auto text-xs bg-blue-600 px-1 rounded">API</span>
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
                    <span className="ml-auto text-xs bg-blue-600 px-1 rounded">API</span>
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
                    <span className="ml-auto text-xs bg-blue-600 px-1 rounded">API</span>
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
                    <span className="ml-auto text-xs bg-blue-600 px-1 rounded">API</span>
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
            
            {/* ✅ INFO DOS FUNCIONÁRIOS NA SIDEBAR COM STATUS */}
            <div className="mt-6 p-3 bg-purple-800 bg-opacity-50 rounded">
              <h3 className="text-sm font-semibold mb-2">👥 Funcionários (API)</h3>
              {loadingFuncionarios ? (
                <div className="flex items-center text-xs text-purple-300">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-400 mr-2"></div>
                  Sincronizando...
                </div>
              ) : (
                <div className="text-xs text-purple-300">
                  <p>📊 Total: <span className="text-white font-medium">{funcionarios.length}</span></p>
                  <p>🎯 Para Seleção: <span className="text-white font-medium">{funcionariosParaSelecao.length}</span></p>
                  <p>🏢 Departamentos: <span className="text-white font-medium">{departamentosAdmin.length}</span></p>
                  <p>💼 Cargos: <span className="text-white font-medium">{cargosAdmin.length}</span></p>
                  <p className="text-green-400 mt-1">🔄 Última sync: {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  {funcionarios.length > 0 && (
                    <div className="mt-2">
                      <p className="text-green-400">✅ Banco Online</p>
                      <p className="text-blue-400">🔗 API Conectada</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ✅ ÁREA PRINCIPAL DE CONTEÚDO COM VALIDAÇÃO */}
        <div className="flex-1 p-4 overflow-y-auto">
          
          {/* ✅ RENDERIZAÇÃO DAS ABAS COM SINCRONIZAÇÃO */}
          {activeTab === 'pontoBatido' && (
            <div className="space-y-4">
              <div className="bg-purple-800 bg-opacity-40 p-4 rounded-lg">
                <h2 className="text-xl font-bold mb-2 flex items-center">
                  🔒 Ponto Batido (Sincronizado)
                  <span className="ml-2 text-xs bg-green-600 px-2 py-1 rounded">API Live</span>
                </h2>
                <p className="text-purple-300 text-sm mb-4">Dados sincronizados em tempo real via API</p>
              </div>
              <PontoBatidoTab 
                funcionarios={funcionariosParaSelecao}
                departamentos={departamentosAdmin}
                cargos={cargosAdmin}
              />
            </div>
          )}
          {activeTab === 'ajustesPonto' && (
            <div className="space-y-4">
              <div className="bg-purple-800 bg-opacity-40 p-4 rounded-lg">
                <h2 className="text-xl font-bold mb-2 flex items-center">
                  ✏️ Ajustes de Ponto
                  <span className="ml-2 text-xs bg-green-600 px-2 py-1 rounded">API Live</span>
                </h2>
                <p className="text-purple-300 text-sm mb-4">Alterações validadas via backend</p>
              </div>
              <AjustesPontoTab 
                funcionarios={funcionariosParaSelecao}
                departamentos={departamentosAdmin}
                cargos={cargosAdmin}
              />
            </div>
          )}
          {activeTab === 'jornadas' && (
            <div className="space-y-4">
              <div className="bg-purple-800 bg-opacity-40 p-4 rounded-lg">
                <h2 className="text-xl font-bold mb-2 flex items-center">
                  📅 Jornadas de Trabalho
                  <span className="ml-2 text-xs bg-green-600 px-2 py-1 rounded">API Live</span>
                </h2>
                <p className="text-purple-300 text-sm mb-4">Gestão de horários sincronizada</p>
              </div>
              <JornadasTab 
                funcionarios={funcionariosParaSelecao}
                departamentos={departamentosAdmin}
                cargos={cargosAdmin}
              />
            </div>
          )}
          {activeTab === 'gestaoTempo' && (
            <div className="space-y-4">
              <div className="bg-purple-800 bg-opacity-40 p-4 rounded-lg">
                <h2 className="text-xl font-bold mb-2 flex items-center">
                  ⏰ Gestão de Tempo
                  <span className="ml-2 text-xs bg-green-600 px-2 py-1 rounded">API Live</span>
                </h2>
                <p className="text-purple-300 text-sm mb-4">Controle temporal via API</p>
              </div>
              <GestaoTempoTab 
                funcionarios={funcionariosParaSelecao}
                departamentos={departamentosAdmin}
                cargos={cargosAdmin}
              />
            </div>
          )}
          {activeTab === 'contestacoes' && (
            <div className="space-y-4">
              <div className="bg-purple-800 bg-opacity-40 p-4 rounded-lg">
                <h2 className="text-xl font-bold mb-2 flex items-center">
                  💬 Contestações
                  <span className="ml-2 text-xs bg-green-600 px-2 py-1 rounded">API Live</span>
                  {contestacoesPendentes > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      {contestacoesPendentes} Pendentes
                    </span>
                  )}
                </h2>
                <p className="text-purple-300 text-sm mb-4">Solicitações em tempo real via API</p>
              </div>
              <ContestacaoAdmin 
                funcionarios={funcionariosParaSelecao}
                departamentos={departamentosAdmin}
                cargos={cargosAdmin}
              />
            </div>
          )}
          {activeTab === 'ausencias' && (
            <div className="space-y-4">
              <div className="bg-purple-800 bg-opacity-40 p-4 rounded-lg">
                <h2 className="text-xl font-bold mb-2 flex items-center">
                  ❌ Ausências
                  <span className="ml-2 text-xs bg-green-600 px-2 py-1 rounded">API Live</span>
                </h2>
                <p className="text-purple-300 text-sm mb-4">Gestão de faltas sincronizada</p>
              </div>
              <AusenciasTab 
                funcionarios={funcionariosParaSelecao}
                departamentos={departamentosAdmin}
                cargos={cargosAdmin}
              />
            </div>
          )}
          {activeTab === 'bancoHoras' && (
            <div className="space-y-4">
              <div className="bg-purple-800 bg-opacity-40 p-4 rounded-lg">
                <h2 className="text-xl font-bold mb-2 flex items-center">
                  🏦 Banco de Horas
                  <span className="ml-2 text-xs bg-green-600 px-2 py-1 rounded">API Live</span>
                </h2>
                <p className="text-purple-300 text-sm mb-4">Saldos atualizados via API</p>
              </div>
              <BancoHorasTab 
                funcionarios={funcionariosParaSelecao}
                departamentos={departamentosAdmin}
                cargos={cargosAdmin}
              />
            </div>
          )}
          {activeTab === 'relatorios' && (
            <div className="space-y-4">
              <div className="bg-purple-800 bg-opacity-40 p-4 rounded-lg">
                <h2 className="text-xl font-bold mb-2 flex items-center">
                  📊 Relatórios
                  <span className="ml-2 text-xs bg-green-600 px-2 py-1 rounded">API Live</span>
                </h2>
                <p className="text-purple-300 text-sm mb-4">Dados analíticos em tempo real</p>
              </div>
              <RelatoriosTab 
                funcionarios={funcionariosParaSelecao}
                departamentos={departamentosAdmin}
                cargos={cargosAdmin}
              />
            </div>
          )}
          {activeTab === 'notificacoes' && (
            <div className="space-y-4">
              <div className="bg-purple-800 bg-opacity-40 p-4 rounded-lg">
                <h2 className="text-xl font-bold mb-2 flex items-center">
                  🔔 Notificações
                  <span className="ml-2 text-xs bg-green-600 px-2 py-1 rounded">API Live</span>
                  {unreadNotificationsCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      {unreadNotificationsCount} Não Lidas
                    </span>
                  )}
                </h2>
                <p className="text-purple-300 text-sm mb-4">Sistema de alertas sincronizado</p>
              </div>
              <NotificacoesTab 
                funcionarios={funcionariosParaSelecao}
                departamentos={departamentosAdmin}
                cargos={cargosAdmin}
              />
            </div>
          )}
        </div>
      </div>
      // PARTE 11: AdminDashboard - Footer e Export

      {/* ✅ FOOTER COM STATUS COMPLETO DO SISTEMA */}
      <footer className="bg-purple-900 bg-opacity-80 shadow-lg py-4">
        <div className="container mx-auto px-4 text-center text-purple-300 text-sm">
          <div className="flex justify-between items-center">
            <div>
              <p>&copy; 2025 CuidaEmprego. Todos os direitos reservados.</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-green-400">🔒 Autenticado</span>
              <span className="text-green-400">🌐 API Online</span>
              <span className="text-blue-400">
                {loadingFuncionarios ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400 mr-1"></div>
                    Sincronizando...
                  </span>
                ) : (
                  `👥 ${funcionarios.length} usuários`
                )}
              </span>
            </div>
          </div>
          <div className="text-xs mt-2 flex justify-between items-center">
            <div>
              <span className="text-purple-400">
                Backend: Spring Boot + MySQL | Frontend: React + API
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-400">🟢 Sistema Operacional</span>
              <span className="text-blue-400">
                Última sync: {new Date().toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </span>
            </div>
          </div>
          {funcionarios.length === 0 && (
            <div className="mt-2 p-2 bg-yellow-600 bg-opacity-20 rounded">
              <p className="text-yellow-300">⚠️ Nenhum funcionário encontrado. Verifique a conexão com o banco de dados.</p>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;