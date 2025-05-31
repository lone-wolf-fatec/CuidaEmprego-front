// src/hooks/useFuncionarios.js
import { useContext, useEffect, useState } from 'react';
import { FuncionarioProvider } from '../components/FuncionarioContext';
import axios from 'axios';

// ✅ HOOK PRINCIPAL PARA USAR OS FUNCIONÁRIOS NAS CAIXAS DE SELEÇÃO
export const useFuncionarios = () => {
  const context = useContext(FuncionarioProvider);

  const [funcionariosFallback, setFuncionariosFallback] = useState([]);
  const [loadingFallback, setLoadingFallback] = useState(true);
  const [hasContext, setHasContext] = useState(!!context);

  useEffect(() => {
    setHasContext(!!context);

    if (!context) {
      const carregarFuncionarios = async () => {
        try {
          console.log('🔄 Carregando funcionários sem context...');
          const token = localStorage.getItem('token');

          if (token) {
            try {
              const response = await axios.get('http://localhost:8080/api/usuarios', {
                headers: { Authorization: `Bearer ${token}` }
              });

              const funcionariosMapeados = response.data.map(user => ({
                id: user.id,
                nome: user.name || user.username,
                email: user.email,
                cargo: user.cargo || 'Funcionário',
                departamento: user.departamento || 'Geral',
                diasFeriasDisponiveis: user.diasFeriasDisponiveis || 30
              }));

              setFuncionariosFallback(funcionariosMapeados);
              console.log('✅ Funcionários carregados do backend (fallback):', funcionariosMapeados.length);
              setLoadingFallback(false);
              return;
            } catch (backendError) {
              console.warn('⚠️ Backend indisponível, usando dados locais');
            }
          }

          // Fallback local
          const localUsers = JSON.parse(localStorage.getItem('cuidaemprego_users') || '{}');
          const localFuncionarios = JSON.parse(localStorage.getItem('cuidaemprego_funcionarios') || '[]');
          const funcionariosLocais = [];

          Object.values(localUsers).forEach(user => {
            funcionariosLocais.push({
              id: user.id,
              nome: user.name,
              email: user.email,
              cargo: user.cargo || 'Funcionário',
              departamento: user.departamento || 'Geral',
              diasFeriasDisponiveis: 30
            });
          });

          localFuncionarios.forEach((nomeFuncionario, index) => {
            const jaExiste = funcionariosLocais.some(f => f.nome === nomeFuncionario);
            if (!jaExiste) {
              funcionariosLocais.push({
                id: 1000 + index,
                nome: nomeFuncionario,
                email: `${nomeFuncionario.toLowerCase().replace(/\s+/g, '.') }@empresa.com`,
                cargo: 'Funcionário',
                departamento: 'Geral',
                diasFeriasDisponiveis: 30
              });
            }
          });

          setFuncionariosFallback(funcionariosLocais);
          console.log('✅ Funcionários carregados do localStorage (fallback):', funcionariosLocais.length);
        } catch (error) {
          console.error('❌ Erro ao carregar funcionários (fallback):', error);
        } finally {
          setLoadingFallback(false);
        }
      };

      carregarFuncionarios();
    }
  }, [context]);

  const addFuncionario = async (nomeFuncionario) => {
    try {
      console.log('📝 Adicionando funcionário:', nomeFuncionario);
      const nome = typeof nomeFuncionario === 'string' ? nomeFuncionario : nomeFuncionario.name;

      if (context && context.adicionarFuncionario) {
        try {
          if (typeof nomeFuncionario === 'string') {
            const dadosFuncionario = {
              name: nomeFuncionario,
              email: `${nomeFuncionario.toLowerCase().replace(/\s+/g, '.') }@empresa.com`,
              cargo: 'Funcionário',
              departamento: 'Geral'
            };
            const resultado = await context.adicionarFuncionario(dadosFuncionario);
            console.log('✅ Funcionário adicionado via context:', nome);
            return resultado;
          } else {
            return await context.adicionarFuncionario(nomeFuncionario);
          }
        } catch (contextError) {
          console.warn('⚠️ Erro no context, usando fallback local:', contextError);
        }
      }

      const localFuncionarios = JSON.parse(localStorage.getItem('cuidaemprego_funcionarios') || '[]');

      if (!localFuncionarios.includes(nome)) {
        localFuncionarios.push(nome);
        localStorage.setItem('cuidaemprego_funcionarios', JSON.stringify(localFuncionarios));

        if (!context) {
          const novoFuncionario = {
            id: Date.now(),
            nome: nome,
            email: `${nome.toLowerCase().replace(/\s+/g, '.') }@empresa.com`,
            cargo: 'Funcionário',
            departamento: 'Geral',
            diasFeriasDisponiveis: 30
          };

          setFuncionariosFallback(prev => [...prev, novoFuncionario]);
        }

        console.log('✅ Funcionário adicionado localmente:', nome);
        return true;
      }

      console.log('⚠️ Funcionário já existe:', nome);
      return false;

    } catch (error) {
      console.error('❌ Erro ao adicionar funcionário:', error);
      return false;
    }
  };

  const reloadFuncionarios = async () => {
    if (context && context.buscarTodosFuncionarios) {
      return await context.buscarTodosFuncionarios();
    }

    setLoadingFallback(true);
    const localUsers = JSON.parse(localStorage.getItem('cuidaemprego_users') || '{}');
    const localFuncionarios = JSON.parse(localStorage.getItem('cuidaemprego_funcionarios') || '[]');
    const funcionariosAtualizados = [];

    Object.values(localUsers).forEach(user => {
      funcionariosAtualizados.push({
        id: user.id,
        nome: user.name,
        email: user.email,
        cargo: user.cargo || 'Funcionário',
        departamento: user.departamento || 'Geral',
        diasFeriasDisponiveis: 30
      });
    });

    localFuncionarios.forEach((nomeFuncionario, index) => {
      const jaExiste = funcionariosAtualizados.some(f => f.nome === nomeFuncionario);
      if (!jaExiste) {
        funcionariosAtualizados.push({
          id: 1000 + index,
          nome: nomeFuncionario,
          email: `${nomeFuncionario.toLowerCase().replace(/\s+/g, '.') }@empresa.com`,
          cargo: 'Funcionário',
          departamento: 'Geral',
          diasFeriasDisponiveis: 30
        });
      }
    });

    setFuncionariosFallback(funcionariosAtualizados);
    setLoadingFallback(false);

    return funcionariosAtualizados;
  };

  if (hasContext && context) {
    const { funcionarios, loadingFuncionarios, buscarTodosFuncionarios } = context;

    return {
      funcionarios: funcionarios || [],
      loading: loadingFuncionarios || false,
      reloadFuncionarios,
      addFuncionario,
      buscarTodosFuncionarios: buscarTodosFuncionarios || (() => funcionarios || [])
    };
  } else {
    return {
      funcionarios: funcionariosFallback,
      loading: loadingFallback,
      reloadFuncionarios,
      addFuncionario,
      buscarTodosFuncionarios: () => funcionariosFallback
    };
  }
};

// ✅ HOOK PARA API COM AUTENTICAÇÃO
export const useApi = () => {
  const [api] = useState(() => {
    const apiInstance = axios.create({
      baseURL: 'http://localhost:8080/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    apiInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    apiInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          console.warn('⚠️ Token expirado, redirecionando para login');
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );

    return apiInstance;
  });

  return { api };
};

// ✅ HOOK PARA FILTRAGEM DE FUNCIONÁRIOS
export const useFuncionariosFiltrados = (filtros = {}) => {
  const { funcionarios, loading } = useFuncionarios();
  const [funcionariosFiltrados, setFuncionariosFiltrados] = useState([]);

  useEffect(() => {
    let resultado = [...funcionarios];

    if (filtros.nome) {
      resultado = resultado.filter(f =>
        f.nome.toLowerCase().includes(filtros.nome.toLowerCase())
      );
    }

    if (filtros.cargo) {
      resultado = resultado.filter(f =>
        f.cargo?.toLowerCase().includes(filtros.cargo.toLowerCase())
      );
    }

    if (filtros.departamento) {
      resultado = resultado.filter(f =>
        f.departamento?.toLowerCase().includes(filtros.departamento.toLowerCase())
      );
    }

    if (filtros.isAdmin !== undefined) {
      resultado = resultado.filter(f =>
        f.roles?.includes('ADMIN') === filtros.isAdmin
      );
    }

    setFuncionariosFiltrados(resultado);
  }, [funcionarios, filtros]);

  return {
    funcionarios: funcionariosFiltrados,
    loading
  };
};

// ✅ HOOK PARA UM FUNCIONÁRIO ESPECÍFICO
export const useFuncionario = (funcionarioId) => {
  const { funcionarios, loading } = useFuncionarios();
  const [funcionario, setFuncionario] = useState(null);

  useEffect(() => {
    if (funcionarioId && funcionarios.length > 0) {
      const encontrado = funcionarios.find(f => f.id === funcionarioId);
      setFuncionario(encontrado || null);
    }
  }, [funcionarioId, funcionarios]);

  return {
    funcionario,
    loading
  };
};
