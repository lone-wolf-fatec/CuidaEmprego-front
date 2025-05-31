// src/contexts/FuncionarioContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const FuncionarioContext = createContext();

export const useFuncionario = () => {
  const context = useContext(FuncionarioContext);
  if (!context) {
    throw new Error('useFuncionario deve ser usado dentro de FuncionarioProvider');
  }
  return context;
};

export const FuncionarioProvider = ({ children }) => {
  const [funcionario, setFuncionario] = useState(null);
  const [funcionarios, setFuncionarios] = useState([]); // Lista de todos os funcionários
  const [loading, setLoading] = useState(true);
  const [loadingFuncionarios, setLoadingFuncionarios] = useState(false);
  const [error, setError] = useState(null);

  // Função para obter headers de autenticação
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  // Buscar todos os funcionários do banco de dados
  const buscarTodosFuncionarios = async () => {
    try {
      setLoadingFuncionarios(true);
      
      // Primeiro tenta buscar do backend
      try {
        const response = await axios.get(
          'http://localhost:8080/api/usuarios',
          getAuthHeaders()
        );
        
        // Mapear os dados do backend para o formato esperado
        const funcionariosMapeados = response.data.map(user => ({
          id: user.id,
          nome: user.name || user.username,
          email: user.email,
          cargo: user.cargo,
          departamento: user.departamento,
          dataAdmissao: user.dataAdmissao,
          salario: user.salario,
          diasFeriasDisponiveis: user.diasFeriasDisponiveis || 30,
          roles: user.roles || []
        }));
        
        setFuncionarios(funcionariosMapeados);
        
        // Salvar no localStorage como cache
        localStorage.setItem('funcionarios_cache', JSON.stringify(funcionariosMapeados));
        
        console.log('✅ Funcionários carregados do backend:', funcionariosMapeados.length);
        return funcionariosMapeados;
        
      } catch (backendError) {
        console.warn('⚠️ Backend não disponível, usando dados locais:', backendError.message);
        
        // Fallback para sistema local
        const localUsers = JSON.parse(localStorage.getItem('cuidaemprego_users') || '{}');
        const localFuncionarios = JSON.parse(localStorage.getItem('cuidaemprego_funcionarios') || '[]');
        const cachedFuncionarios = JSON.parse(localStorage.getItem('funcionarios_cache') || '[]');
        
        // Se tem cache, usa o cache
        if (cachedFuncionarios.length > 0) {
          setFuncionarios(cachedFuncionarios);
          console.log('✅ Funcionários carregados do cache:', cachedFuncionarios.length);
          return cachedFuncionarios;
        }
        
        // Senão, monta a partir dos dados locais
        const funcionariosLocais = [];
        
        // Adiciona funcionários do sistema de usuários locais
        Object.values(localUsers).forEach(user => {
          funcionariosLocais.push({
            id: user.id,
            nome: user.name,
            email: user.email,
            cargo: user.cargo || 'Não informado',
            departamento: user.departamento || 'Não informado',
            dataAdmissao: user.createdAt || new Date().toISOString(),
            salario: user.salario || 0,
            diasFeriasDisponiveis: 30,
            roles: user.roles || []
          });
        });
        
        // Adiciona funcionários da lista local que não estão nos usuários
        localFuncionarios.forEach(nomeFuncionario => {
          const jaExiste = funcionariosLocais.some(f => f.nome === nomeFuncionario);
          if (!jaExiste) {
            funcionariosLocais.push({
              id: Math.floor(Math.random() * 100000),
              nome: nomeFuncionario,
              email: `${nomeFuncionario.toLowerCase().replace(/\s+/g, '.')}@empresa.com`,
              cargo: 'Funcionário',
              departamento: 'Geral',
              dataAdmissao: new Date().toISOString(),
              salario: 0,
              diasFeriasDisponiveis: 30,
              roles: ['FUNCIONARIO']
            });
          }
        });
        
        setFuncionarios(funcionariosLocais);
        console.log('✅ Funcionários carregados do sistema local:', funcionariosLocais.length);
        return funcionariosLocais;
      }
      
    } catch (error) {
      console.error('❌ Erro ao buscar funcionários:', error);
      setError('Erro ao carregar lista de funcionários');
      return [];
    } finally {
      setLoadingFuncionarios(false);
    }
  };

  // Adicionar novo funcionário
  const adicionarFuncionario = async (dadosFuncionario) => {
    try {
      // Tenta adicionar no backend
      try {
        const response = await axios.post(
          'http://localhost:8080/api/usuarios',
          dadosFuncionario,
          getAuthHeaders()
        );
        
        // Recarrega a lista de funcionários
        await buscarTodosFuncionarios();
        return response.data;
        
      } catch (backendError) {
        console.warn('⚠️ Erro no backend, adicionando localmente:', backendError.message);
        
        // Adiciona no sistema local
        const novoFuncionario = {
          id: Math.floor(Math.random() * 100000),
          nome: dadosFuncionario.name || dadosFuncionario.nome,
          email: dadosFuncionario.email,
          cargo: dadosFuncionario.cargo || 'Funcionário',
          departamento: dadosFuncionario.departamento || 'Geral',
          dataAdmissao: new Date().toISOString(),
          salario: dadosFuncionario.salario || 0,
          diasFeriasDisponiveis: 30,
          roles: dadosFuncionario.roles || ['FUNCIONARIO']
        };
        
        // Adiciona à lista local
        const funcionariosAtuais = [...funcionarios, novoFuncionario];
        setFuncionarios(funcionariosAtuais);
        
        // Atualiza localStorage
        const localFuncionarios = JSON.parse(localStorage.getItem('cuidaemprego_funcionarios') || '[]');
        if (!localFuncionarios.includes(novoFuncionario.nome)) {
          localFuncionarios.push(novoFuncionario.nome);
          localStorage.setItem('cuidaemprego_funcionarios', JSON.stringify(localFuncionarios));
        }
        
        return novoFuncionario;
      }
      
    } catch (error) {
      console.error('❌ Erro ao adicionar funcionário:', error);
      throw error;
    }
  };

  // Inicializar funcionário do localStorage
  const initializeFuncionario = () => {
    try {
      const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');

      if (userFromStorage.authenticated && token && userFromStorage.id) {
        const funcionarioData = {
          id: userFromStorage.id,
          name: userFromStorage.name || userFromStorage.username,
          email: userFromStorage.email,
          initials: getInitials(userFromStorage.name || userFromStorage.username),
          isAdmin: userFromStorage.roles?.includes('ADMIN') || false,
          authenticated: true,
          jornadaTrabalho: {
            inicio: '08:00',
            fimManha: '12:00',
            inicioTarde: '13:00',
            fim: '17:00',
            toleranciaAtraso: 10
          }
        };
        
        setFuncionario(funcionarioData);
        console.log('✅ Funcionário inicializado do localStorage:', funcionarioData);
        
        // Carregar dados completos do backend
        carregarDadosCompletos(userFromStorage.id);
      } else {
        setError('Usuário não autenticado');
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar funcionário:', error);
      setError('Erro ao carregar dados do usuário');
      setLoading(false);
    }
  };

  // Carregar dados completos do backend
  const carregarDadosCompletos = async (userId) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/usuarios/${userId}`, 
        getAuthHeaders()
      );
      
      const userData = response.data;
      const funcionarioCompleto = {
        id: userData.id,
        name: userData.name || userData.username,
        email: userData.email,
        initials: getInitials(userData.name || userData.username),
        isAdmin: userData.roles?.includes('ADMIN') || false,
        authenticated: true,
        jornadaTrabalho: userData.jornadaTrabalho || {
          inicio: '08:00',
          fimManha: '12:00',
          inicioTarde: '13:00',
          fim: '17:00',
          toleranciaAtraso: 10
        },
        // Dados adicionais do funcionário
        cargo: userData.cargo,
        departamento: userData.departamento,
        dataAdmissao: userData.dataAdmissao,
        salario: userData.salario
      };

      setFuncionario(funcionarioCompleto);
      
      // Atualizar localStorage com dados completos
      localStorage.setItem('user', JSON.stringify({
        ...funcionarioCompleto,
        authenticated: true
      }));

      console.log('✅ Dados completos do funcionário carregados:', funcionarioCompleto);
    } catch (error) {
      console.error('❌ Erro ao carregar dados completos:', error);
      // Manter dados básicos se falhar ao carregar completos
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para obter iniciais
  const getInitials = (name) => {
    if (!name) return 'U';
    const nameParts = name.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  // Atualizar funcionário
  const updateFuncionario = (novosDados) => {
    setFuncionario(prev => ({
      ...prev,
      ...novosDados
    }));
    
    // Atualizar localStorage
    const updatedUser = {
      ...funcionario,
      ...novosDados,
      authenticated: true
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Logout
  const logout = () => {
    setFuncionario(null);
    setFuncionarios([]);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('funcionarios_cache');
    setError(null);
  };

  // Verificar se é admin
  const isAdmin = () => {
    return funcionario?.isAdmin || false;
  };

  // Verificar se está autenticado
  const isAuthenticated = () => {
    return funcionario?.authenticated && localStorage.getItem('token');
  };

  // Inicializar ao montar o componente
  useEffect(() => {
    initializeFuncionario();
    
    // Carrega a lista de funcionários após inicializar
    const loadFuncionarios = async () => {
      await buscarTodosFuncionarios();
    };
    
    loadFuncionarios();
  }, []);

  const value = {
    funcionario,
    funcionarios,
    loading,
    loadingFuncionarios,
    error,
    updateFuncionario,
    logout,
    isAdmin,
    isAuthenticated,
    carregarDadosCompletos,
    buscarTodosFuncionarios,
    adicionarFuncionario
  };

  return (
    <FuncionarioContext.Provider value={value}>
      {children}
    </FuncionarioContext.Provider>
  );
};

export default FuncionarioProvider;