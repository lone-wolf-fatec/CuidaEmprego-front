import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// ✅ CONFIGURAÇÃO DA API COM TIMEOUT E INTERCEPTORS
const api = axios.create({
  baseURL: 'http://localhost:8080/api', // Verifique se esta URL está correta
  timeout: 15000, // Tempo limite de 15 segundos
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para logs de requisições
api.interceptors.request.use(
  (config) => {
    console.log('📤 Enviando requisição:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      // Ocultar senha nos logs de requisição
      data: config.url === '/auth/login' || config.url === '/auth/register' 
        ? { ...config.data, password: '[OCULTA]' } 
        : config.data
    });
    
    // Adicionar token de autorização se existir no localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔒 Token JWT adicionado ao cabeçalho.');
    }
    return config;
  },
  (error) => {
    console.error('❌ Erro na requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptor para logs de respostas
api.interceptors.response.use(
  (response) => {
    console.log('📦 Resposta recebida:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data // Cuidado ao logar dados sensíveis aqui em produção
    });
    return response;
  },
  (error) => {
    console.error('❌ Erro na resposta:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data, // Dados de erro do backend
      message: error.message, // Mensagem de erro do Axios
      config: { // Detalhes da requisição que falhou
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data // Dados enviados na requisição (pode conter senha se não filtrado antes)
      }
    });
    return Promise.reject(error);
  }
);

const LoginRegisterPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    cargo: '',
    departamento: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking', 'online', 'offline'
  const navigate = useNavigate();

  // ✅ FUNÇÃO PARA DETERMINAR SE É ADMIN
  const isUserAdmin = (userData) => {
    // Verifica múltiplas propriedades para robustez
    const checks = {
      isAdminField: userData.isAdmin === true, // Campo booleano direto
      rolesCheck: userData.roles?.some(role => // Verifica array de roles (case-insensitive)
        typeof role === 'string' && role.toUpperCase() === 'ADMIN'
      ),
      emailCheck: userData.email?.toLowerCase().includes('admin'), // Email que contém admin
      usernameCheck: userData.username?.toLowerCase() === 'admin' // Username específico
    };
    
    console.log('🔍 Verificação de admin para usuário:', userData.username || userData.email, checks);
    return checks.isAdminField || checks.rolesCheck || checks.emailCheck || checks.usernameCheck;
  };

  // ✅ FUNÇÃO PARA REDIRECIONAMENTO
  const redirectUser = (userData) => {
    const isAdmin = isUserAdmin(userData);
    console.log('🎯 Redirecionamento:', {
      nome: userData.name,
      username: userData.username,
      isAdmin,
      roles: userData.roles
    });
    
    if (isAdmin) {
      console.log('👑 Admin detectado - redirecionando para /admin');
      navigate('/admin');
    } else {
      console.log('👤 Usuário detectado - redirecionando para /dashboard');
      navigate('/dashboard');
    }
  };

  // ✅ VERIFICAR SE JÁ ESTÁ LOGADO E STATUS DO BACKEND
  useEffect(() => {
    const checkAuthAndStatus = async () => {
      // 1. Verificar status do backend
      try {
        console.log('🔍 Verificando status do backend…');
        // Use um endpoint leve para verificar se o backend está de pé
        await api.get('/test'); // Assumindo que existe um endpoint /api/test
        setBackendStatus('online');
        console.log('✅ Backend está online.');
      } catch (error) {
        console.error('❌ Backend offline ou endpoint /test falhou:', error);
        setBackendStatus('offline');
        setErrorMessage('❌ Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      }

      // 2. Verificar autenticação APENAS se o backend estiver online ou se já há token/user localmente
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      if (token && user.authenticated) {
        console.log('🔄 Usuário já autenticado localmente, verificando validade (simulada) e redirecionando...', user);
        // Em um sistema real, você faria uma chamada para validar o token no backend aqui
        // Ex: try { await api.get('/auth/validate-token'); redirectUser(user); } catch { logout(); }
        redirectUser(user); // Redireciona com base nos dados locais por enquanto
      } else {
        console.log('🚫 Nenhum usuário autenticado encontrado localmente.');
      }
    };

    checkAuthAndStatus();
  }, [navigate]); // Dependência: navigate

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ FUNÇÃO PRINCIPAL DE SUBMIT COM DEBUG COMPLETO
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);
    console.log('🚀 === INÍCIO DO PROCESSO ===');

    // Verificar se o backend está online antes de tentar submeter
    if (backendStatus === 'offline') {
      setErrorMessage('❌ O servidor está offline. Não é possível realizar a operação.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // ✅ PROCESSO DE LOGIN COM DEBUG MÁXIMO
        console.log('🔐 Tentativa de login com username:', formData.username);
        const loginData = {
          username: formData.username,
          password: formData.password
        };
        console.log('📤 Dados de login preparados:', { ...loginData, password: '[OCULTA]' });
        console.log('📤 URL de destino:', `${api.defaults.baseURL}/auth/login`);

        let response;
        try {
          console.log('🔐 Fazendo login principal...');
          response = await api.post('/auth/login', loginData);
          console.log('✅ Login principal bem-sucedido.');
        } catch (loginError) {
          console.error('❌ Erro no login principal:', loginError);
          // ✅ FALLBACK: TENTAR ENDPOINT DE TESTE SE O PRINCIPAL FALHAR
          console.log('🧪 Tentando login de teste...');
          try {
            response = await api.post('/auth/login-test', loginData);
            console.log('✅ Login de teste funcionou!');
          } catch (testError) {
            console.error('❌ Login de teste também falhou:', testError);
            throw loginError; // Lança o erro original do login principal
          }
        }

        console.log('📦 Resposta do login recebida:', response.data);

        // ✅ VERIFICAR SUCESSO E EXTRAIR DADOS
        if (!response.data || !response.data.token) { // Verifica se o token está presente na resposta
          const errorMsg = response.data?.message || 'Resposta de login inválida: Token não recebido.';
          console.error('❌ Login falhou:', errorMsg);
          setErrorMessage(errorMsg);
          setLoading(false);
          return;
        }

        // Extrair dados do usuário, priorizando 'user' objeto se existir, ou campos diretos
        const userData = response.data.user || {
          id: response.data.id,
          name: response.data.name,
          username: response.data.username,
          email: response.data.email,
          cargo: response.data.cargo,
          departamento: response.data.departamento,
          roles: response.data.roles,
          isAdmin: response.data.isAdmin,
          authenticated: true // Marcamos como autenticado após login bem-sucedido
        };

        console.log('👤 Dados do usuário extraídos:', userData);

        // ✅ VERIFICAR SE É ADMIN
        const isAdmin = isUserAdmin(userData);
        console.log('🔍 Resultado da verificação de admin:', isAdmin);

        // ✅ PREPARAR DADOS FINAIS PARA ARMAZENAMENTO
        const finalUserData = {
          ...userData,
          isAdmin: isAdmin, // Garante que o campo isAdmin está correto
          authenticated: true,
          loginTime: new Date().toISOString()
        };

        // ✅ SALVAR NO LOCALSTORAGE
        const token = response.data.token; // Usar o token recebido
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(finalUserData));
        console.log('💾 Dados salvos no localStorage:', {
          token: token,
          user: finalUserData
        });

        // ✅ FEEDBACK VISUAL
        setSuccessMessage(`✅ Login realizado com sucesso! Bem-vindo, ${finalUserData.name || finalUserData.username}!`);

        // ✅ REDIRECIONAMENTO COM DELAY
        setTimeout(() => {
          console.log('🎯 Iniciando redirecionamento...');
          redirectUser(finalUserData);
        }, 1000); // Pequeno delay para o usuário ver a mensagem de sucesso

      } else {
        // ✅ PROCESSO DE CADASTRO
        console.log('📝 Iniciando processo de cadastro...');
        if (formData.password !== formData.confirmPassword) {
          setErrorMessage('❌ As senhas não coincidem!');
          setLoading(false);
          return;
        }

        const signupData = {
          username: formData.username,
          name: formData.name,
          email: formData.email,
          password: formData.password, // Em um sistema real, a senha seria hasheada no backend
          cargo: formData.cargo,
          departamento: formData.departamento
        };
        console.log('📤 Dados de cadastro preparados:', { ...signupData, password: '[OCULTA]' });

        const response = await api.post('/auth/register', signupData);
        console.log('📦 Resposta do cadastro:', response.data);

        if (response.data && response.data.success) { // Assumindo que o backend retorna { success: true, message: '...' }
          setSuccessMessage('✅ Cadastro realizado com sucesso! Faça login para acessar.');
          // Limpar formulário e mudar para aba de login
          setTimeout(() => {
            setIsLogin(true);
            setSuccessMessage('');
            setFormData({
              username: formData.username, // Manter username/email para facilitar login
              email: formData.email,
              password: '', // Limpar senhas e outros campos de registro
              confirmPassword: '',
              name: '',
              cargo: '',
              departamento: ''
            });
          }, 2000); // Delay para o usuário ler a mensagem
        } else {
          // Se o backend retornar sucesso: false ou estrutura diferente
          setErrorMessage(response.data?.message || 'Erro no cadastro. Resposta do servidor inesperada.');
        }
      }
    } catch (error) {
      console.error('❌ ERRO DURANTE SUBMISSÃO:', error);
      // ✅ ANÁLISE DETALHADA DO ERRO PARA MENSAGEM AO USUÁRIO
      let userErrorMessage = 'Ocorreu um erro inesperado. Por favor, tente novamente.';

      if (axios.isCancel(error)) {
        userErrorMessage = 'Requisição cancelada.';
      } else if (error.code === 'ECONNABORTED') {
        userErrorMessage = '⏱️ Tempo limite da requisição excedido. O servidor pode estar lento ou inacessível.';
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        userErrorMessage = '🔌 Não foi possível conectar ao servidor. Verifique sua conexão ou se o backend está rodando.';
      } else if (error.response) {
        // Erros de resposta do servidor (4xx, 5xx)
        const { status, data } = error.response;
        console.error('🔧 Detalhes técnicos do erro de resposta:', { status, data });

        if (data && data.message) {
          // Usar a mensagem de erro fornecida pelo backend
          userErrorMessage = `❌ Erro ${status}: ${data.message}`;
        } else {
          // Mensagem genérica baseada no status HTTP
          switch (status) {
            case 400: userErrorMessage = '❌ Requisição inválida. Verifique os dados informados.'; break;
            case 401: userErrorMessage = '🔒 Credenciais inválidas. Verifique seu username e senha.'; break;
            case 403: userErrorMessage = '🚫 Acesso negado. Você não tem permissão para realizar esta ação.'; break;
            case 404: userErrorMessage = '🔍 Recurso não encontrado. O endpoint do servidor pode estar incorreto.'; break;
            case 409: userErrorMessage = '⚠️ Conflito. O username ou email já pode estar em uso.'; break; // Comum em cadastro
            case 500: userErrorMessage = '⚠️ Erro interno do servidor. Por favor, tente novamente mais tarde.'; break;
            default: userErrorMessage = `❌ Erro do servidor (${status}).`;
          }
        }
      } else {
        // Outros erros (ex: erro no código JS, erro antes de enviar a requisição)
        userErrorMessage = `❌ Erro: ${error.message}`;
      }

      setErrorMessage(userErrorMessage);

    } finally {
      setLoading(false);
      console.log('🏁 === FIM DO PROCESSO ===');
    }
  };

  // Renderização do componente
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 to-black py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorações de fundo */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500 rounded-full opacity-5 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-400 rounded-full opacity-5 blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-purple-300 rounded-full opacity-5 blur-3xl animate-pulse delay-500"></div>
      <div className="absolute bottom-1/4 left-1/4 w-28 h-28 bg-purple-600 rounded-full opacity-5 blur-3xl animate-pulse delay-1500"></div>

      {/* Logo */}
      <div className="flex justify-center mb-12 z-10">
        <div className="text-white text-5xl font-bold flex items-center">
          <span className="bg-purple-600 rounded-full p-3 mr-3 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </span>
          CuidaEmprego
        </div>
      </div>

      {/* Card do formulário */}
      <div className="w-full max-w-md mx-auto z-10">
        <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-purple-500">
          {/* Abas */}
          <div className="flex mb-8">
            <button
              className={`flex-1 py-3 text-white font-medium rounded-tl-xl rounded-bl-xl transition-all ${
                isLogin ? 'bg-purple-600 shadow-lg' : 'bg-purple-900 bg-opacity-50 hover:bg-purple-800'
              }`}
              onClick={() => {
                setIsLogin(true);
                setErrorMessage('');
                setSuccessMessage('');
                // Opcional: Limpar campos específicos ao mudar para login
                setFormData({
                  ...formData,
                  email: '', // Limpa email ao mudar para login (se login usa username)
                  confirmPassword: '',
                  name: '',
                  cargo: '',
                  departamento: ''
                });
              }}
            >
              Login
            </button>
            <button
              className={`flex-1 py-3 text-white font-medium rounded-tr-xl rounded-br-xl transition-all ${
                !isLogin ? 'bg-purple-600 shadow-lg' : 'bg-purple-900 bg-opacity-50 hover:bg-purple-800'
              }`}
              onClick={() => {
                setIsLogin(false);
                setErrorMessage('');
                setSuccessMessage('');
                // Opcional: Limpar campos específicos ao mudar para registro
                setFormData({
                  ...formData,
                  username: '', // Limpa username ao mudar para registro (se registro usa email)
                  password: '',
                  confirmPassword: '',
                  name: '',
                  cargo: '',
                  departamento: ''
                });
              }}
            >
              Cadastro
            </button>
          </div>

          {/* ✅ STATUS DO SISTEMA */}
          {backendStatus === 'checking' && (
            <div className="mb-6 p-3 bg-blue-500 bg-opacity-20 border border-blue-400 rounded-lg text-blue-200 text-xs flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verificando status do sistema...
            </div>
          )}
          {backendStatus === 'online' && !errorMessage && ( // Mostra online apenas se não houver erro geral de conexão
            <div className="mb-6 p-3 bg-green-500 bg-opacity-20 border border-green-400 rounded-lg text-green-200 text-xs">
              <div className="flex items-center justify-between">
                <span>🟢 Sistema Online</span>
                <span>Backend: Spring Boot | Frontend: React</span>
              </div>
            </div>
          )}
          {backendStatus === 'offline' && (
            <div className="mb-6 p-3 bg-red-500 bg-opacity-20 border border-red-400 rounded-lg text-red-200 text-xs">
              <div className="flex items-center justify-between">
                <span>🔴 Sistema Offline</span>
                <span>Não foi possível conectar ao backend.</span>
              </div>
            </div>
          )}

          {/* Mensagens de feedback */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-500 bg-opacity-25 border border-red-500 rounded text-white text-sm break-words">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-500 bg-opacity-25 border border-green-500 rounded text-white text-sm break-words">
              {successMessage}
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit}>
            {/* Campos para Login */}
            {isLogin && (
              <>
                <div className="mb-4">
                  <label className="block text-white text-sm font-medium mb-2" htmlFor="username">
                    Username
                  </label>
                  <input
                    className="w-full bg-purple-900 bg-opacity-50 text-white border border-purple-500 rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    id="username"
                    name="username"
                    type="text" // Pode ser 'text' para username
                    value={formData.username}
                    onChange={handleChange}
                    required
                    disabled={loading || backendStatus === 'offline'}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-white text-sm font-medium mb-2" htmlFor="password">
                    Senha
                  </label>
                  <input
                    className="w-full bg-purple-900 bg-opacity-50 text-white border border-purple-500 rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading || backendStatus === 'offline'}
                  />
                </div>
              </>
            )}

            {/* Campos para Cadastro */}
            {!isLogin && (
              <>
                <div className="mb-4">
                  <label className="block text-white text-sm font-medium mb-2" htmlFor="username">
                    Username <span className="text-red-400">*</span>
                  </label>
                  <input
                    className="w-full bg-purple-900 bg-opacity-50 text-white border border-purple-500 rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    disabled={loading || backendStatus === 'offline'}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-white text-sm font-medium mb-2" htmlFor="name">
                    Nome Completo <span className="text-red-400">*</span>
                  </label>
                  <input
                    className="w-full bg-purple-900 bg-opacity-50 text-white border border-purple-500 rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={loading || backendStatus === 'offline'}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-white text-sm font-medium mb-2" htmlFor="email">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    className="w-full bg-purple-900 bg-opacity-50 text-white border border-purple-500 rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading || backendStatus === 'offline'}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-white text-sm font-medium mb-2" htmlFor="password">
                    Senha <span className="text-red-400">*</span>
                  </label>
                  <input
                    className="w-full bg-purple-900 bg-opacity-50 text-white border border-purple-500 rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading || backendStatus === 'offline'}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-white text-sm font-medium mb-2" htmlFor="confirmPassword">
                    Confirmar Senha <span className="text-red-400">*</span>
                  </label>
                  <input
                    className="w-full bg-purple-900 bg-opacity-50 text-white border border-purple-500 rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    disabled={loading || backendStatus === 'offline'}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-white text-sm font-medium mb-2" htmlFor="cargo">
                    Cargo
                  </label>
                  <input
                    className="w-full bg-purple-900 bg-opacity-50 text-white border border-purple-500 rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    id="cargo"
                    name="cargo"
                    type="text"
                    value={formData.cargo}
                    onChange={handleChange}
                    disabled={loading || backendStatus === 'offline'}
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-white text-sm font-medium mb-2" htmlFor="departamento">
                    Departamento
                  </label>
                  <input
                    className="w-full bg-purple-900 bg-opacity-50 text-white border border-purple-500 rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    id="departamento"
                    name="departamento"
                    type="text"
                    value={formData.departamento}
                    onChange={handleChange}
                    disabled={loading || backendStatus === 'offline'}
                  />
                </div>
              </>
            )}

            {isLogin && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <input
                    id="remember"
                    name="remember"
                    type="checkbox"
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    disabled={loading || backendStatus === 'offline'}
                  />
                  <label htmlFor="remember" className="ml-2 block text-sm text-white">
                    Lembrar-me
                  </label>
                </div>
                <div className="text-sm">
                  <a href="#" className="text-purple-300 hover:text-purple-200">
                    Esqueceu a senha?
                  </a>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || backendStatus === 'offline'} // Desabilita o botão se estiver carregando ou offline
              className={`w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 transition duration-200 ease-in-out transform hover:scale-105 shadow-lg
                ${loading || backendStatus === 'offline' ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processando...
                </span>
              ) : (
                isLogin ? 'Entrar' : 'Registrar'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Decorações adicionais */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-purple-500 rounded-full opacity-10 blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-400 rounded-full opacity-10 blur-xl"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-purple-300 rounded-full opacity-10 blur-xl"></div>
      <div className="absolute bottom-10 left-40 w-24 h-24 bg-purple-600 rounded-full opacity-10 blur-xl"></div>
    </div>
  );
};

export default LoginRegisterPage;