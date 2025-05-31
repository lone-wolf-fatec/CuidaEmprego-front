import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
  const navigate = useNavigate();

  // Configuração da API
  const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // ✅ FUNÇÃO PARA DETERMINAR SE É ADMIN
  const isUserAdmin = (userData) => {
    return (
      userData.roles?.some(role => role === 'ROLE_ADMIN' || role === 'ADMIN') ||
      userData.email === 'admin@cuidaemprego.com' ||
      userData.username === 'admin'
    );
  };

  // ✅ FUNÇÃO PARA FAZER REDIRECIONAMENTO CORRETO
  const redirectUser = (userData) => {
    const isAdmin = isUserAdmin(userData);
    
    console.log('🎯 Redirecionamento:', {
      nome: userData.name,
      isAdmin,
      roles: userData.roles
    });

    if (isAdmin) {
      console.log('👑 Admin detectado - redirecionando para /admin');
      navigate('/admin');
    } else {
      console.log('👤 Funcionário detectado - redirecionando para /dashboard');
      navigate('/dashboard');
    }
  };

  // Verificar se já está logado
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && user.authenticated) {
      console.log('🔄 Usuário já autenticado, redirecionando...');
      redirectUser(user);
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isLogin) {
        // ✅ PROCESSO DE LOGIN
        console.log('🔐 Tentativa de login com:', formData.username);
        
        const response = await api.post('/auth/signin', {
          username: formData.username,
          password: formData.password
        });

        const data = response.data;
        console.log('📦 Resposta do login:', data);

        // ✅ SALVAR DADOS DO USUÁRIO
        const isAdmin = isUserAdmin(data);
        
        const userData = {
          id: data.id,
          username: data.username,
          name: data.name, // ✅ Nome real do usuário
          email: data.email,
          cargo: data.cargo,
          departamento: data.departamento,
          roles: data.roles,
          isAdmin: isAdmin,
          authenticated: true
        };

        // Salvar no localStorage
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('user', JSON.stringify(userData));

        console.log('💾 Dados salvos:', userData);

        // ✅ REDIRECIONAMENTO BASEADO NO TIPO DE USUÁRIO
        redirectUser(userData);

      } else {
        // ✅ PROCESSO DE CADASTRO
        if (formData.password !== formData.confirmPassword) {
          setErrorMessage('As senhas não coincidem!');
          setLoading(false);
          return;
        }

        const response = await api.post('/auth/signup', {
          username: formData.username,
          name: formData.name,
          email: formData.email,
          password: formData.password,
          cargo: formData.cargo,
          departamento: formData.departamento,
          roles: formData.email.includes('admin') ? ['admin'] : []
        });

        setSuccessMessage('Cadastro realizado com sucesso! Faça login para acessar.');
        setTimeout(() => {
          setIsLogin(true);
          setSuccessMessage('');
          setFormData({
            username: formData.username,
            email: formData.email,
            password: '',
            confirmPassword: '',
            name: '',
            cargo: '',
            departamento: ''
          });
        }, 2000);
      }

    } catch (error) {
      console.error('❌ Erro:', error);
      const message = error.response?.data?.message || 'Erro desconhecido';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-900 to-black">
      {/* Logo */}
      <div className="flex justify-center mt-16 mb-12">
        <div className="text-white text-5xl font-bold flex items-center">
          <span className="bg-purple-600 rounded-full p-3 mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </span>
          CuidaEmprego
        </div>
      </div>

      {/* Card do formulário */}
      <div className="w-full max-w-md mx-auto px-4">
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
              }}
            >
              Cadastro
            </button>
          </div>

          {/* Mensagens */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-500 bg-opacity-25 border border-red-500 rounded-lg text-white text-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {errorMessage}
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-500 bg-opacity-25 border border-green-500 rounded-lg text-white text-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {successMessage}
              </div>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Campos do Login */}
            {isLogin ? (
              <>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Nome, Username ou Email
                  </label>
                  <input
                    className="w-full bg-purple-900 bg-opacity-50 text-white border border-purple-500 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-300 transition-all"
                    name="username"
                    type="text"
                    placeholder="Digite seu nome, username ou email"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Senha
                  </label>
                  <input
                    className="w-full bg-purple-900 bg-opacity-50 text-white border border-purple-500 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-300 transition-all"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            ) : (
              <>
                {/* Campos do Cadastro */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Nome Completo
                  </label>
                  <input
                    className="w-full bg-purple-900 bg-opacity-50 text-white border border-purple-500 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-300 transition-all"
                    name="name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Username
                  </label>
                  <input
                    className="w-full bg-purple-900 bg-opacity-50 text-white border border-purple-500 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-300 transition-all"
                    name="username"
                    type="text"
                    placeholder="Escolha um username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    className="w-full bg-purple-900 bg-opacity-50 text-white border border-purple-500 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-300 transition-all"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Cargo
                    </label>
                    <input
                      className="w-full bg-purple-900 bg-opacity-50 text-white border border-purple-500 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-300 transition-all"
                      name="cargo"
                      type="text"
                      placeholder="Seu cargo"
                      value={formData.cargo}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Departamento
                    </label>
                    <input
                      className="w-full bg-purple-900 bg-opacity-50 text-white border border-purple-500 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-300 transition-all"
                      name="departamento"
                      type="text"
                      placeholder="Departamento"
                      value={formData.departamento}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Senha
                  </label>
                  <input
                    className="w-full bg-purple-900 bg-opacity-50 text-white border border-purple-500 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-300 transition-all"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Confirmar Senha
                  </label>
                  <input
                    className="w-full bg-purple-900 bg-opacity-50 text-white border border-purple-500 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-300 transition-all"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-purple-700 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-all ${
                loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg transform hover:scale-105'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isLogin ? 'Entrando...' : 'Cadastrando...'}
                </div>
              ) : (
                <>
                  {isLogin ? '🔑 Entrar' : '✨ Cadastrar'}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-8 text-center text-purple-300 text-sm">
        <p>Sistema de Controle de Ponto</p>
        <p className="text-xs mt-1">Desenvolvido com Spring Boot + React</p>
      </div>
    </div>
  );
};

export default LoginRegisterPage;