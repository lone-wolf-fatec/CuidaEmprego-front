// ========== App.js - ROTAS CORRIGIDAS ==========
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { FuncionarioProvider } from './components/FuncionarioContext';
import LoginRegisterPage from './pages/LoginRegisterPage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <UserProvider>
      <FuncionarioProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Rota pública - Login */}
              <Route path="/" element={<LoginRegisterPage />} />
              <Route path="/login" element={<LoginRegisterPage />} />
              
              {/* Rota protegida - Dashboard (funcionários e admin) */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute requireAuth={true}>
                    <UserDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Rota protegida - Admin Dashboard (apenas admin) */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requireAuth={true} requireAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Rota padrão - redireciona para login */}
              <Route path="*" element={<LoginRegisterPage />} />
            </Routes>
          </div>
        </Router>
      </FuncionarioProvider>
    </UserProvider>
  );
}

export default App;
