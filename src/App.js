import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginRegisterPage from "./pages/LoginRegisterPage";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import HorasExtrasTab from "./components/HorasExtrasTab"; 
import WorkshiftProvider from "./context/WorkshiftContext";
import { UserProvider } from "./context/UserContext"; 
import axios from 'axios';

// ✅ CONFIGURAÇÃO DA API COM JWT - CENTRALIZADA
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// ✅ INTERCEPTOR PARA INCLUIR TOKEN JWT AUTOMATICAMENTE
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ INTERCEPTOR PARA TRATAR ERROS 401 (TOKEN EXPIRADO)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('❌ App - Token expirado, redirecionando para login');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ✅ FUNÇÃO PARA VERIFICAR AUTENTICAÇÃO VIA API JWT
const isJWTAuthenticated = async () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log('🔍 DEBUG AUTH - Token existe:', !!token);
  console.log('🔍 DEBUG AUTH - User existe:', !!user);
  
  if (!token || !user) {
    console.log('❌ JWT: Token ou usuário ausente');
    return false;
  }
  
  try {
    // ✅ VERIFICAR TOKEN VIA API
    const response = await api.get('/auth/status', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('🔍 Resposta da API /auth/status:', response.data);
    
    if (response.data.authenticated) {
      const userData = JSON.parse(user);
      console.log('🔍 JWT Auth check via API:', { 
        hasToken: !!token, 
        hasUser: !!user, 
        authenticated: response.data.authenticated,
        username: userData?.username 
      });
      return true;
    } else {
      console.log('❌ JWT: Token inválido via API');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar JWT via API:', error);
    
    // Se erro 401, token expirado
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return false;
    }
    
    // Para outros erros, usar dados locais como fallback
    try {
      const userData = JSON.parse(user);
      console.log('📱 Usando dados locais como fallback');
      return userData?.authenticated === true;
    } catch (parseError) {
      console.error('❌ Erro ao verificar JWT:', parseError);
      return false;
    }
  }
};

// ✅ FUNÇÃO PARA VERIFICAR ADMIN VIA API JWT
const isJWTAdmin = async () => {
  console.log('🚀 === INICIANDO VERIFICAÇÃO DE ADMIN VIA API ===');
  
  try {
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');
    
    console.log('📦 String do usuário no localStorage:', userString);
    
    if (!token || !userString) {
      console.log('❌ Nenhum token ou usuário no localStorage');
      return false;
    }
    
    // ✅ VERIFICAR VIA API PRIMEIRO
    try {
      const response = await api.get('/auth/status', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('📡 Resposta da verificação admin via API:', response.data);
      
      if (response.data.authenticated && response.data.user) {
        const isAdminFromAPI = response.data.user.isAdmin || response.data.isAdmin;
        console.log('👑 É admin via API:', isAdminFromAPI);
        return isAdminFromAPI;
      }
    } catch (apiError) {
      console.log('⚠️ API indisponível, usando dados locais:', apiError.message);
    }
    
    // ✅ FALLBACK PARA DADOS LOCAIS
    const user = JSON.parse(userString);
    console.log('👤 Dados completos do usuário:', user);
    
    const checks = {
      isAdminField: user.isAdmin === true,
      rolesCheck: user.roles?.some(role => 
        typeof role === 'string' && role.toUpperCase() === 'ADMIN'
      ),
      emailCheck: user.email?.toLowerCase() === 'admin@cuidaemprego.com',
      usernameCheck: user.username?.toLowerCase() === 'admin'
    };
    
    console.log('🔍 Verificações individuais:');
    console.log('   - isAdmin field:', user.isAdmin, '→', checks.isAdminField);
    console.log('   - roles array:', user.roles, '→', checks.rolesCheck);
    console.log('   - email check:', user.email, '→', checks.emailCheck);
    console.log('   - username check:', user.username, '→', checks.usernameCheck);
    
    const isAdmin = checks.isAdminField || checks.rolesCheck || checks.emailCheck || checks.usernameCheck;
    
    console.log('🎯 RESULTADO FINAL DA VERIFICAÇÃO DE ADMIN:', isAdmin);
    console.log('=== FIM DA VERIFICAÇÃO DE ADMIN ===');
    
    return isAdmin;
  } catch (error) {
    console.error('❌ Erro ao verificar admin JWT:', error);
    return false;
  }
};

// ✅ COMPONENTE PARA PROTEGER ROTAS COM API JWT
const ProtectedRoute = ({ children, allowedRoles }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkAuth = async () => {
      console.log('🛡️ === INICIANDO VERIFICAÇÃO DE ROTA PROTEGIDA VIA API ===');
      console.log('🔐 ProtectedRoute - Parâmetros:', { 
        allowedRoles, 
        currentPath: window.location.pathname 
      });

      try {
        const authResult = await isJWTAuthenticated();
        const adminResult = await isJWTAdmin();
        
        console.log('🔒 Usuário autenticado via API?', authResult);
        console.log('👑 É admin via API?', adminResult);
        
        setIsAuthenticated(authResult);
        setIsAdmin(adminResult);
      } catch (error) {
        console.error('❌ Erro na verificação de auth:', error);
        setIsAuthenticated(false);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Verificando permissões...</p>
          <p className="text-sm text-purple-300 mt-2">🔒 Validando via API JWT...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("❌ JWT: Usuário não autenticado - redirecionando para login");
    return <Navigate to="/" replace />;
  }

  // ✅ VERIFICAR PERMISSÕES COM DEBUG COMPLETO
  const isAdminOnlyRoute = allowedRoles.includes("ADMIN") && allowedRoles.length === 1;
  
  console.log("🔍 Análise de permissões via API:");
  console.log("   - É admin?", isAdmin);
  console.log("   - Roles permitidos:", allowedRoles);
  console.log("   - É rota exclusiva de admin?", isAdminOnlyRoute);
  console.log("   - Rota atual:", window.location.pathname);

  // ✅ SE É ROTA EXCLUSIVA DE ADMIN E NÃO É ADMIN
  if (isAdminOnlyRoute && !isAdmin) {
    console.log("🚫 JWT: Acesso negado - rota exclusiva de admin, redirecionando para dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  // ✅ SE É ADMIN TENTANDO ACESSAR DASHBOARD DE USUÁRIO, REDIRECIONAR PARA ADMIN
  if (isAdmin && window.location.pathname === '/dashboard' && allowedRoles.includes("ADMIN")) {
    console.log("🔄 JWT: Admin tentando acessar dashboard de usuário, redirecionando para admin");
    return <Navigate to="/admin" replace />;
  }

  console.log("✅ JWT: Acesso permitido!");
  console.log('=== FIM DA VERIFICAÇÃO DE ROTA PROTEGIDA ===');
  return children;
};

// ✅ COMPONENTE PARA REDIRECIONAR USUÁRIOS JÁ LOGADOS VIA API
const PublicRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkAuth = async () => {
      console.log('🌍 === VERIFICANDO ROTA PÚBLICA VIA API ===');
      console.log('🔍 PublicRoute JWT - Verificando se já está logado...');

      try {
        const authResult = await isJWTAuthenticated();
        const adminResult = await isJWTAdmin();
        
        console.log('🔒 Está autenticado via API?', authResult);
        console.log('👑 É admin via API?', adminResult);
        
        setIsAuthenticated(authResult);
        setIsAdmin(adminResult);
      } catch (error) {
        console.error('❌ Erro na verificação:', error);
        setIsAuthenticated(false);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Verificando sessão...</p>
          <p className="text-sm text-purple-300 mt-2">🔒 Consultando API JWT...</p>
        </div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    console.log("🔄 JWT: Usuário já autenticado via API - verificando tipo...");
    
    const redirectPath = isAdmin ? "/admin" : "/dashboard";
    
    console.log(`➡️ JWT: Redirecionando ${isAdmin ? 'ADMIN' : 'USUÁRIO'} para ${redirectPath}`);
    console.log('=== FIM DA VERIFICAÇÃO DE ROTA PÚBLICA ===');
    return <Navigate to={redirectPath} replace />;
  }

  console.log('👤 JWT: Usuário não logado - mostrando página de login');
  console.log('=== FIM DA VERIFICAÇÃO DE ROTA PÚBLICA ===');
  return children;
};

// ✅ COMPONENTE ESPECIAL PARA TESTAR ACESSO DIRETO AO ADMIN VIA API
const AdminTestRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkAuth = async () => {
      console.log('🧪 === TESTE ESPECIAL PARA ROTA ADMIN VIA API ===');
      
      try {
        const authResult = await isJWTAuthenticated();
        const adminResult = await isJWTAdmin();
        
        console.log('🧪 Status de autenticação via API:', authResult);
        console.log('🧪 Status de admin via API:', adminResult);
        
        setIsAuthenticated(authResult);
        setIsAdmin(adminResult);
      } catch (error) {
        console.error('❌ Erro no teste admin:', error);
        setIsAuthenticated(false);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Verificando permissões de admin...</p>
          <p className="text-sm text-purple-300 mt-2">🔒 Validando via API JWT...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    console.log('🧪 Não autenticado, redirecionando para login');
    return <Navigate to="/" replace />;
  }
  
  if (!isAdmin) {
    console.log('🧪 Autenticado mas não é admin, redirecionando para dashboard');
    return <Navigate to="/dashboard" replace />;
  }
  
  console.log('🧪 ADMIN VERIFICADO VIA API! Permitindo acesso ao AdminDashboard');
  console.log('=== FIM DO TESTE ESPECIAL ===');
  return children;
};

const App = () => {
  // ✅ DEBUG JWT NO CARREGAMENTO VIA API
  React.useEffect(() => {
    const initApp = async () => {
      console.log('🚀 === APP INICIANDO COM API JWT ===');
      console.log('🚀 App JWT iniciando...');
      
      try {
        const authStatus = await isJWTAuthenticated();
        const adminStatus = await isJWTAdmin();
        
        console.log('🔍 Estado completo da aplicação via API:');
        console.log('   - Autenticado:', authStatus);
        console.log('   - É admin:', adminStatus);
        console.log('   - Token presente:', !!localStorage.getItem('token'));
        console.log('   - User presente:', !!localStorage.getItem('user'));
        console.log('   - Rota atual:', window.location.pathname);

        // ✅ VERIFICAÇÃO ADICIONAL PARA DEBUG
        if (authStatus) {
          try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            console.log('👤 Dados detalhados do usuário logado:');
            console.log('   - Nome:', user.name);
            console.log('   - Username:', user.username);
            console.log('   - Email:', user.email);
            console.log('   - IsAdmin:', user.isAdmin);
            console.log('   - Roles:', user.roles);
            console.log('   - Authenticated:', user.authenticated);
          } catch (error) {
            console.error('❌ Erro ao analisar dados do usuário:', error);
          }
        }
      } catch (error) {
        console.error('❌ Erro na inicialização do App:', error);
      }
      
      console.log('=== FIM DO DEBUG DE INICIALIZAÇÃO ===');
    };

    initApp();
  }, []);

  return (
    <UserProvider> 
      <WorkshiftProvider>
        <Router>
          <Routes>
            {/* ✅ PÁGINA INICIAL (LOGIN/REGISTRO) */}
            <Route 
              path="/"
              element={
                <PublicRoute>
                  <LoginRegisterPage />
                </PublicRoute>
              } 
            />

            {/* ✅ ROTA PARA /login TAMBÉM */}
            <Route 
              path="/login"
              element={
                <PublicRoute>
                  <LoginRegisterPage />
                </PublicRoute>
              } 
            />

            {/* ✅ DASHBOARD PARA USUÁRIOS */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["FUNCIONARIO", "USER"]}>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />

            {/* ✅ DASHBOARD EXCLUSIVO PARA ADMIN - COM TESTE ESPECIAL VIA API */}
            <Route
              path="/admin"
              element={
                <AdminTestRoute>
                  <AdminDashboard />
                </AdminTestRoute>
              }
            />

            {/* ✅ PÁGINA DE RH (SOMENTE ADMIN) */}
            <Route
              path="/rh"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <HorasExtrasTab />
                </ProtectedRoute>
              }
            />

            {/* ✅ ROTA 404 COM DEBUG COMPLETO VIA API */}
            <Route 
              path="*" 
              element={
                <div className="min-h-screen bg-gradient-to-br from-purple-900 to-black text-white flex items-center justify-center">
                  <div className="text-center max-w-2xl">
                    <div className="text-purple-400 text-6xl mb-4">🔍</div>
                    <h1 className="text-3xl font-bold mb-4">Página não encontrada</h1>
                    
                    {/* DEBUG INFO VISUAL COM API */}
                    <div className="bg-purple-800 bg-opacity-40 p-4 rounded-lg mb-6 text-left">
                      <h3 className="text-lg font-bold mb-2">🧪 Debug Info (API JWT):</h3>
                      <div className="text-sm space-y-1">
                        <p>🔒 Token: {localStorage.getItem('token') ? '✅ PRESENTE' : '❌ AUSENTE'}</p>
                        <p>👤 User: {localStorage.getItem('user') ? '✅ PRESENTE' : '❌ AUSENTE'}</p>
                        <p>🎯 Rota atual: {window.location.pathname}</p>
                        <p className="text-blue-400">🔗 Status: API JWT Ativa</p>
                        {localStorage.getItem('user') && (
                          <div className="mt-2 p-2 bg-purple-700 bg-opacity-50 rounded">
                            <p className="font-bold">Dados do usuário:</p>
                            <pre className="text-xs mt-1 overflow-auto">
                              {JSON.stringify(JSON.parse(localStorage.getItem('user')), null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-x-4">
                      <button
                        onClick={() => window.location.href = '/'}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
                      >
                        🔑 Ir para Login
                      </button>
                      <button
                        onClick={() => {
                          localStorage.clear();
                          window.location.href = '/';
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
                      >
                        🚪 Limpar e Voltar
                      </button>
                    </div>
                  </div>
                </div>
              } 
            />
          </Routes>
        </Router>
      </WorkshiftProvider>
    </UserProvider>
  );
};

export default App;