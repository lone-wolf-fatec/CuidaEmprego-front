import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginRegisterPage from "./pages/LoginRegisterPage";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import HorasExtrasTab from "./components/HorasExtrasTab"; 
import WorkshiftProvider from "./context/WorkshiftContext";
import { UserProvider } from "./context/UserContext"; 

// Componente para proteger rotas com base no papel do usuário
const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  console.log("🔐 ProtectedRoute - Verificando autenticação:", { 
    user: user?.username || user?.email, 
    name: user?.name,
    authenticated: user?.authenticated,
    hasToken: !!token,
    userRoles: user?.roles,
    allowedRoles,
    currentPath: window.location.pathname
  });

  // 🔍 DEBUG DETALHADO DO USUÁRIO NO LOCALSTORAGE
  console.log("🔍 DEBUG - Dados completos do usuário no localStorage:", JSON.stringify(user, null, 2));

  // 🚨 ALERTA CRÍTICO - Verificar se dados são de teste
  if (user.name === "Funcionário Teste" || user.username === "funcionario_teste") {
    console.error("🚨 ERRO CRÍTICO: Dados de 'Funcionário Teste' detectados no ProtectedRoute!");
    console.error("Isso indica que:");
    console.error("1. O localStorage foi corrompido");
    console.error("2. Algum componente está sobrescrevendo os dados");
    console.error("3. Há dados mockados sendo injetados");
    console.error("Dados atuais:", user);
    
    // Tentar recuperar dados do token
    const tokenData = token ? token.split('_') : [];
    console.log("Token breakdown:", tokenData);
  }

  // Verificar se o usuário está autenticado
  if (!user?.authenticated || !token) {
    console.log("❌ Usuário não autenticado - redirecionando para login");
    return <Navigate to="/" replace />;
  }

  // Função para verificar se é admin (mesma lógica do LoginRegisterPage)
  const isUserAdmin = (userData) => {
    const checks = {
      isAdminField: userData.isAdmin === true,
      rolesCheck: userData.roles?.some(role => 
        typeof role === 'string' && role.toUpperCase() === 'ADMIN'
      ),
      emailCheck: userData.email?.toLowerCase().includes('admin'),
      usernameCheck: userData.username?.toLowerCase() === 'admin'
    };
    
    console.log("🔍 DEBUG - Verificação de admin detalhada:", {
      userData: {
        username: userData.username,
        email: userData.email,
        isAdmin: userData.isAdmin,
        roles: userData.roles
      },
      checks
    });
    
    return checks.isAdminField || checks.rolesCheck || checks.emailCheck || checks.usernameCheck;
  };

  // Verificar permissões
  const userRoles = Array.isArray(user.roles) ? user.roles : [];
  const isAdmin = isUserAdmin(user);
  
  console.log("🔍 Verificação de permissão:", { 
    isAdmin, 
    userRoles, 
    allowedRoles,
    userName: user.name,
    userUsername: user.username
  });

  // Simplificar lógica: Admin sempre tem acesso, outros precisam verificar roles
  if (!isAdmin && allowedRoles.includes("ADMIN") && allowedRoles.length === 1) {
    console.log("🚫 Acesso negado a rota exclusiva de admin");
    return <Navigate to="/dashboard" replace />;
  }

  // Para dashboard, permitir tanto admin quanto funcionários
  if (allowedRoles.includes("FUNCIONARIO") || allowedRoles.includes("USER")) {
    console.log("✅ Acesso permitido ao dashboard");
    return children;
  }

  // Para outras verificações de role
  if (!isAdmin) {
    const hasPermission = userRoles.some(role => 
      allowedRoles.includes(role?.toUpperCase?.() || role)
    );

    if (!hasPermission) {
      console.log("🚫 Acesso negado - usuário não tem permissão");
      return <Navigate to="/dashboard" replace />;
    }
  }

  console.log("✅ Acesso permitido");
  return children;
};

// Componente para redirecionar usuários já logados
const PublicRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  // Se já estiver autenticado, redirecionar para o dashboard apropriado
  if (user?.authenticated && token) {
    console.log("🔄 Usuário já autenticado - redirecionando");
    
    // Usar a mesma lógica de verificação de admin
    const isUserAdmin = (userData) => {
      const checks = {
        isAdminField: userData.isAdmin === true,
        rolesCheck: userData.roles?.some(role => 
          typeof role === 'string' && role.toUpperCase() === 'ADMIN'
        ),
        emailCheck: userData.email?.toLowerCase().includes('admin'), // Mudança aqui também
        usernameCheck: userData.username?.toLowerCase() === 'admin'
      };
      
      return checks.isAdminField || checks.rolesCheck || checks.emailCheck || checks.usernameCheck;
    };

    const isAdmin = isUserAdmin(user);
    const redirectPath = isAdmin ? "/admin" : "/dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

const App = () => {
  return (
    <UserProvider> 
      <WorkshiftProvider>
        <Router>
          <Routes>
            {/* Página inicial (login e registro) - só acessível se não estiver logado */}
            <Route 
              path="/" 
              element={
                <PublicRoute>
                  <LoginRegisterPage />
                </PublicRoute>
              } 
            />

            {/* Dashboard acessível para ADMIN e FUNCIONARIO */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["ADMIN", "FUNCIONARIO", "USER"]}>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />

            {/* Dashboard exclusivo para ADMIN */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Página de RH (somente ADMIN pode acessar) */}
            <Route
              path="/rh"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <HorasExtrasTab />
                </ProtectedRoute>
              }
            />

            {/* Redirecionamento para a página inicial caso a rota não exista */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </WorkshiftProvider>
    </UserProvider>
  );
};

export default App;