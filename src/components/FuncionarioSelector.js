import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ✅ CONFIGURAÇÃO DA API PARA MICROSSERVIÇO SPRING BOOT
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ✅ INTERCEPTOR PARA ADICIONAR TOKEN DE AUTENTICAÇÃO
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

// Interceptor para tratamento de erros
api.interceptors.response.use(
  response => response,
  error => {
    console.error('❌ FuncionarioSelector - Erro na API:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * ✅ COMPONENTE FUNCIONARIO SELECTOR - INTEGRADO COM MICROSSERVIÇO SPRING BOOT
 * 
 * Props:
 * - value: ID do funcionário selecionado
 * - onChange: Função callback quando funcionário é selecionado
 * - placeholder: Texto placeholder (opcional)
 * - disabled: Se o componente está desabilitado (opcional)
 * - showAll: Se deve mostrar opção "Todos" (opcional)
 * - multiple: Se permite seleção múltipla (opcional)
 * - className: Classes CSS customizadas (opcional)
 * - showDetails: Se deve mostrar detalhes extras do funcionário (opcional)
 * - filterBy: Filtrar por departamento ou cargo (opcional)
 * - size: Tamanho do componente - 'sm', 'md', 'lg' (opcional)
 */
const FuncionarioSelector = ({
  value = '',
  onChange,
  placeholder = 'Selecione um funcionário',
  disabled = false,
  showAll = false,
  multiple = false,
  className = '',
  showDetails = false,
  filterBy = null, // { tipo: 'departamento', valor: 'TI' }
  size = 'md',
  onFuncionarioLoad = null // Callback quando funcionários são carregados
}) => {
  // ✅ ESTADOS
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // ✅ FUNÇÃO PARA CARREGAR FUNCIONÁRIOS VIA MICROSSERVIÇO
  const carregarFuncionarios = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 FuncionarioSelector: Carregando funcionários via microsserviço...');
      
      // Buscar funcionários via endpoint específico
      const response = await api.get('/funcionarios');
      
      if (response.data.success) {
        const funcionariosData = response.data.data || [];
        
        // ✅ GARANTIR QUE SEJA SEMPRE UM ARRAY
        const funcionariosArray = Array.isArray(funcionariosData) ? funcionariosData : [];
        
        // ✅ APLICAR FILTROS SE ESPECIFICADOS
        let funcionariosFiltrados = funcionariosArray;
        
        if (filterBy) {
          funcionariosFiltrados = funcionariosArray.filter(func => {
            if (filterBy.tipo === 'departamento') {
              return func.departamento === filterBy.valor;
            } else if (filterBy.tipo === 'cargo') {
              return func.cargo === filterBy.valor;
            } else if (filterBy.tipo === 'ativo') {
              return func.ativo === filterBy.valor;
            }
            return true;
          });
        }
        
        setFuncionarios(funcionariosFiltrados);
        
        // ✅ CALLBACK PARA COMPONENTE PAI
        if (onFuncionarioLoad) {
          onFuncionarioLoad(funcionariosFiltrados);
        }
        
        console.log(`✅ FuncionarioSelector: ${funcionariosFiltrados.length} funcionários carregados via microsserviço`);
        
      } else {
        console.log('⚠️ FuncionarioSelector: Resposta sem sucesso');
        setError('Erro ao carregar funcionários do servidor');
        setFuncionarios([]);
      }
      
    } catch (error) {
      console.error('❌ FuncionarioSelector: Erro ao carregar funcionários:', error);
      setError('Erro ao conectar com o microsserviço');
      setFuncionarios([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ useEffect PARA CARREGAR FUNCIONÁRIOS
  useEffect(() => {
    carregarFuncionarios();
  }, [filterBy]);

  // ✅ FUNÇÃO PARA FILTRAR FUNCIONÁRIOS POR BUSCA
  const funcionariosFiltrados = funcionarios.filter(func => {
    if (!searchTerm) return true;
    
    const termo = searchTerm.toLowerCase();
    return (
      func.nome.toLowerCase().includes(termo) ||
      func.email.toLowerCase().includes(termo) ||
      func.username.toLowerCase().includes(termo) ||
      (func.cargo && func.cargo.toLowerCase().includes(termo)) ||
      (func.departamento && func.departamento.toLowerCase().includes(termo))
    );
  });

  // ✅ FUNÇÃO PARA LIDAR COM SELEÇÃO
  const handleSelect = (funcionario) => {
    if (multiple) {
      // Implementar lógica de seleção múltipla se necessário
      console.log('Seleção múltipla não implementada ainda');
    } else {
      onChange(funcionario.id, funcionario);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  // ✅ FUNÇÃO PARA OBTER FUNCIONÁRIO SELECIONADO
  const funcionarioSelecionado = funcionarios.find(f => f.id.toString() === value.toString());

  // ✅ CLASSES CSS BASEADAS NO TAMANHO
  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-2',
    lg: 'text-lg px-4 py-3'
  };

  // ✅ RENDER DO COMPONENTE
  return (
    <div className={`relative ${className}`}>
      {/* ✅ CAMPO PRINCIPAL */}
      <div className="relative">
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full bg-purple-800 border border-purple-700 rounded-md text-white text-left
            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
            ${sizeClasses[size]}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700 cursor-pointer'}
            flex items-center justify-between
          `}
        >
          <div className="flex items-center flex-1 min-w-0">
            {funcionarioSelecionado ? (
              <div className="flex items-center">
                {/* ✅ AVATAR DO FUNCIONÁRIO */}
                <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                  <span className="text-xs font-medium">
                    {funcionarioSelecionado.initials || funcionarioSelecionado.nome.charAt(0).toUpperCase()}
                  </span>
                </div>
                
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {funcionarioSelecionado.nome}
                  </div>
                  {showDetails && (
                    <div className="text-xs text-purple-300 truncate">
                      {funcionarioSelecionado.cargo} - {funcionarioSelecionado.departamento}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <span className="text-purple-300">
                {loading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400 mr-2"></div>
                    Carregando funcionários...
                  </span>
                ) : (
                  placeholder
                )}
              </span>
            )}
          </div>
          
          {/* ✅ ÍCONE DE DROPDOWN */}
          <div className="flex items-center">
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400 mr-2"></div>
            )}
            <svg
              className={`w-5 h-5 text-purple-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* ✅ BADGE DE FONTE DE DADOS */}
        <div className="absolute top-0 right-0 -mt-1 -mr-1">
          <span className="inline-block w-3 h-3 bg-green-400 rounded-full animate-pulse" title="Dados via Spring Boot"></span>
        </div>
      </div>

      {/* ✅ ERROR MESSAGE */}
      {error && (
        <div className="mt-1 text-xs text-red-400">
          ⚠️ {error}
          <button 
            onClick={carregarFuncionarios}
            className="ml-2 text-purple-300 hover:text-white underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* ✅ DROPDOWN MENU */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-purple-800 border border-purple-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {/* ✅ CAMPO DE BUSCA */}
          <div className="p-2 border-b border-purple-700">
            <input
              type="text"
              placeholder="Buscar funcionário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-purple-900 border border-purple-600 rounded-md px-3 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* ✅ HEADER COM INFORMAÇÕES */}
          <div className="px-3 py-2 bg-purple-900 bg-opacity-50 border-b border-purple-700">
            <div className="text-xs text-purple-300">
              🎯 <span className="text-green-400">{funcionarios.length} funcionários</span> via Spring Boot
              {filterBy && (
                <span className="ml-2">| Filtro: {filterBy.tipo} = {filterBy.valor}</span>
              )}
            </div>
          </div>

          {/* ✅ OPÇÃO "TODOS" SE HABILITADA */}
          {showAll && (
            <button
              type="button"
              onClick={() => {
                onChange('', null);
                setIsOpen(false);
                setSearchTerm('');
              }}
              className="w-full px-3 py-2 text-left hover:bg-purple-700 focus:outline-none focus:bg-purple-700 border-b border-purple-700"
            >
              <div className="flex items-center">
                <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center mr-2">
                  <span className="text-xs font-medium">👥</span>
                </div>
                <span className="font-medium">Todos os funcionários</span>
              </div>
            </button>
          )}

          {/* ✅ LISTA DE FUNCIONÁRIOS */}
          {loading ? (
            <div className="px-3 py-4 text-center text-purple-300">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400 mr-2"></div>
                Carregando funcionários via microsserviço...
              </div>
            </div>
          ) : funcionariosFiltrados.length === 0 ? (
            <div className="px-3 py-4 text-center text-purple-300">
              {searchTerm ? (
                <div>
                  <p>🔍 Nenhum funcionário encontrado para "{searchTerm}"</p>
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="mt-1 text-xs text-purple-400 hover:text-white underline"
                  >
                    Limpar busca
                  </button>
                </div>
              ) : funcionarios.length === 0 ? (
                <div>
                  <p>📭 Nenhum funcionário cadastrado</p>
                  <p className="text-xs mt-1">Cadastre funcionários no sistema primeiro</p>
                  <button 
                    onClick={carregarFuncionarios}
                    className="mt-2 text-xs bg-purple-600 hover:bg-purple-500 px-2 py-1 rounded"
                  >
                    🔄 Recarregar
                  </button>
                </div>
              ) : (
                <p>🔽 Selecione um funcionário acima</p>
              )}
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto">
              {funcionariosFiltrados.map((funcionario) => (
                <button
                  key={funcionario.id}
                  type="button"
                  onClick={() => handleSelect(funcionario)}
                  className={`
                    w-full px-3 py-2 text-left hover:bg-purple-700 focus:outline-none focus:bg-purple-700
                    ${funcionarioSelecionado?.id === funcionario.id ? 'bg-purple-600' : ''}
                  `}
                >
                  <div className="flex items-center">
                    {/* ✅ AVATAR DO FUNCIONÁRIO */}
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <span className="text-sm font-medium">
                        {funcionario.initials || funcionario.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{funcionario.nome}</div>
                      <div className="text-sm text-purple-300 truncate">
                        {funcionario.username} • {funcionario.email}
                      </div>
                      {showDetails && (
                        <div className="text-xs text-purple-400 truncate mt-1">
                          📊 {funcionario.cargo || 'Sem cargo'} • 🏢 {funcionario.departamento || 'Sem departamento'}
                          {funcionario.ativo !== undefined && (
                            <span className={`ml-2 ${funcionario.ativo ? 'text-green-400' : 'text-red-400'}`}>
                              {funcionario.ativo ? '✅ Ativo' : '❌ Inativo'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ✅ INDICADOR DE SELEÇÃO */}
                    {funcionarioSelecionado?.id === funcionario.id && (
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* ✅ FOOTER COM AÇÕES */}
          <div className="px-3 py-2 bg-purple-900 bg-opacity-50 border-t border-purple-700">
            <div className="flex justify-between items-center text-xs">
              <span className="text-purple-300">
                {funcionariosFiltrados.length} de {funcionarios.length} funcionários
              </span>
              <div className="flex space-x-2">
                <button 
                  onClick={carregarFuncionarios}
                  disabled={loading}
                  className="text-purple-400 hover:text-white disabled:opacity-50"
                  title="Recarregar funcionários"
                >
                  🔄
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-purple-400 hover:text-white"
                  title="Fechar"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ COMPONENTE SIMPLIFICADO PARA USO RÁPIDO
export const FuncionarioSelectorSimples = ({ value, onChange, placeholder, disabled }) => {
  return (
    <FuncionarioSelector
      value={value}
      onChange={onChange}
      placeholder={placeholder || "Selecione um funcionário"}
      disabled={disabled}
      size="md"
      showDetails={false}
    />
  );
};

// ✅ COMPONENTE COMPLETO PARA ADMIN
export const FuncionarioSelectorAdmin = ({ value, onChange, filterBy, onFuncionarioLoad }) => {
  return (
    <FuncionarioSelector
      value={value}
      onChange={onChange}
      placeholder="Selecione um funcionário"
      showAll={true}
      showDetails={true}
      size="md"
      filterBy={filterBy}
      onFuncionarioLoad={onFuncionarioLoad}
      className="w-full"
    />
  );
};

// ✅ HOOK PERSONALIZADO PARA USAR O SELECTOR
export const useFuncionarioSelector = (initialValue = '') => {
  const [selectedFuncionario, setSelectedFuncionario] = useState(initialValue);
  const [funcionarioData, setFuncionarioData] = useState(null);

  const handleChange = (funcionarioId, funcionario) => {
    setSelectedFuncionario(funcionarioId);
    setFuncionarioData(funcionario);
  };

  const reset = () => {
    setSelectedFuncionario('');
    setFuncionarioData(null);
  };

  return {
    selectedFuncionario,
    funcionarioData,
    handleChange,
    reset,
    isSelected: !!selectedFuncionario
  };
};

// ✅ EXEMPLO DE USO DO COMPONENTE
export const ExemploUso = () => {
  const { selectedFuncionario, funcionarioData, handleChange, reset } = useFuncionarioSelector();

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4">🔧 Exemplo de Uso - FuncionarioSelector</h3>
      
      {/* ✅ SELECTOR SIMPLES */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Funcionário Simples:</label>
        <FuncionarioSelectorSimples
          value={selectedFuncionario}
          onChange={handleChange}
          placeholder="Escolha um funcionário..."
        />
      </div>

      {/* ✅ SELECTOR ADMIN COM FILTRO */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Funcionário Admin (Filtro TI):</label>
        <FuncionarioSelectorAdmin
          value={selectedFuncionario}
          onChange={handleChange}
          filterBy={{ tipo: 'departamento', valor: 'TI' }}
        />
      </div>

      {/* ✅ DADOS SELECIONADOS */}
      {funcionarioData && (
        <div className="mt-4 p-3 bg-purple-800 bg-opacity-50 rounded">
          <h4 className="font-medium mb-2">👤 Funcionário Selecionado:</h4>
          <pre className="text-sm text-purple-300">
            {JSON.stringify(funcionarioData, null, 2)}
          </pre>
          <button 
            onClick={reset}
            className="mt-2 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
          >
            🗑️ Limpar Seleção
          </button>
        </div>
      )}
    </div>
  );
};

export default FuncionarioSelector;