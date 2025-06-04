import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FeriasTab = () => {
  // Configuração da API
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const [funcionarios, setFuncionarios] = useState([]);
  const [feriasEntries, setFeriasEntries] = useState([]);
  const [newFerias, setNewFerias] = useState({
    funcionarioId: '',
    dataInicio: '',
    dataFim: '',
    observacao: '',
  });
  const [filtros, setFiltros] = useState({
    status: '',
    funcionario: '',
    funcionarioId: '',
    periodo: '',
    contestacao: '',
  });
  const [diasFerias, setDiasFerias] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingFerias, setLoadingFerias] = useState(false);
  const [loadingFuncionarios, setLoadingFuncionarios] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Função para buscar funcionários
  // Endpoint: GET /api/funcionarios
  const fetchFuncionarios = async () => {
    try {
      setLoadingFuncionarios(true);
      setError('');
      console.log('🔄 Buscando funcionários...');
      
      const response = await api.get('/funcionarios');
      
      console.log('✅ Funcionários carregados:', response.data);
      setFuncionarios(response.data);
    } catch (error) {
      console.error('❌ Erro ao buscar funcionários:', error);
      setError('Erro ao buscar funcionários');
      // Fallback para dados mockados em caso de erro
      setFuncionarios([]);
    } finally {
    }
  };
  
  // Função para buscar férias com tratamento de erro
  // Endpoint: GET /api/ferias
  const fetchFerias = async () => {
    try {
      setLoadingFerias(true);
      setError('');
      console.log('🔄 Buscando férias...', { filtros });
      
      const response = await api.get('/ferias', { params: filtros });
      
      const feriasFormatadas = response.data.map((ferias) => {
        const funcionario = funcionarios.find((f) => f.id === ferias.funcionario_id);
        return {
          id: ferias.id,
          funcionarioId: ferias.funcionario_id,
          funcionarioNome: funcionario?.nome || `Funcionário ID ${ferias.funcionario_id}`,
          dataInicio: ferias.data_inicio,
          dataFim: ferias.data_fim,
          observacao: ferias.observacao,
          status: ferias.status,
          diasTotais: calcularDiasFerias(ferias.data_inicio, ferias.data_fim),
        };
      });
      setFeriasEntries(feriasFormatadas);
      console.log('✅ Férias carregadas:', feriasFormatadas.length);
    } catch (error) {
      setError('');
    } finally {
      setLoadingFerias(false);
    }
  };

  const calcularDiasFerias = (dataInicio, dataFim) => {
    if (!dataInicio || !dataFim) return 0;
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const diffTime = Math.abs(fim - inicio);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  useEffect(() => {
    if (newFerias.dataInicio && newFerias.dataFim) {
      const dias = calcularDiasFerias(newFerias.dataInicio, newFerias.dataFim);
      setDiasFerias(dias);
    } else {
      setDiasFerias(0);
    }
  }, [newFerias.dataInicio, newFerias.dataFim]);

  useEffect(() => {
    fetchFuncionarios();
  }, []);

  useEffect(() => {
    if (funcionarios.length > 0) {
      fetchFerias();
    }
  }, [filtros, funcionarios]);

  // Função para criar nova solicitação de férias
  // Endpoint: POST /api/ferias
  const handleAddFerias = async (e) => {
    e.preventDefault();
    if (!newFerias.funcionarioId) {
      setError('Por favor, selecione um funcionário');
      return;
    }
    if (!newFerias.dataInicio) {
      setError('Por favor, informe a data de início');
      return;
    }
    if (!newFerias.dataFim) {
      setError('Por favor, informe a data de fim');
      return;
    }
    if (diasFerias > 30) {
      setError('Não é permitido registrar mais de 30 dias de férias consecutivos');
      return;
    }
    if (diasFerias < 1) {
      setError('O período de férias deve ser de pelo menos 1 dia');
      return;
    }

    const dataInicio = new Date(newFerias.dataInicio);
    const dataFim = new Date(newFerias.dataFim);
    if (dataInicio >= dataFim) {
      setError('A data de início deve ser anterior à data de fim');
      return;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if (dataInicio < hoje) {
      setError('Não é possível solicitar férias para datas passadas');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      
      const feriasData = {
        funcionario_id: parseInt(newFerias.funcionarioId),
        data_inicio: newFerias.dataInicio,
        data_fim: newFerias.dataFim,
        observacao: newFerias.observacao?.trim() || null,
        status: 'pendente',
        dias_totais: diasFerias
      };
      
      console.log('📤 Enviando dados de férias:', feriasData);

      const response = await api.post('/ferias', feriasData);
      console.log('✅ Férias criadas:', response.data);
      setSuccessMessage('Solicitação de férias registrada com sucesso!');

      setNewFerias({
        funcionarioId: '',
        dataInicio: '',
        dataFim: '',
        observacao: '',
      });

      setTimeout(() => {
        fetchFerias();
        setSuccessMessage('');
      }, 2000);
    } catch (error) {
      console.error('❌ Erro ao registrar férias:', error);
      setError(`Erro ao registrar férias: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Função para aprovar solicitação de férias
  // Endpoint: PUT /api/ferias/:id
  const handleApproveFerias = async (id) => {
    try {
      setLoading(true);
      
      await api.put(`/ferias/${id}`, { status: 'aprovado' });
      
      setSuccessMessage('Solicitação de férias aprovada!');
      fetchFerias();
    } catch (error) {
      console.error('❌ Erro ao aprovar férias:', error);
      setError('Erro ao aprovar solicitação de férias');
    } finally {
      setLoading(false);
    }
  };

  // Função para rejeitar solicitação de férias
  // Endpoint: PUT /api/ferias/:id
  const handleRejectFerias = async (id) => {
    try {
      setLoading(true);
      
      await api.put(`/ferias/${id}`, { status: 'rejeitado' });
      
      setSuccessMessage('Solicitação de férias rejeitada.');
      fetchFerias();
    } catch (error) {
      console.error('❌ Erro ao rejeitar férias:', error);
      setError('Erro ao rejeitar solicitação de férias');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-lg shadow-lg p-6">
      <h1 className="text-2xl font-bold mb-4">Gerenciamento de Férias</h1>
      
      {error && (
        <div className="bg-red-500 bg-opacity-75 text-white p-3 rounded mb-4 flex justify-between items-center">
          <span></span>
          <button onClick={() => setError('')} className="text-white hover:text-gray-200">&times;</button>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-500 bg-opacity-75 text-white p-3 rounded mb-4 flex justify-between items-center">
          <span>✅ {successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="text-white hover:text-gray-200">&times;</button>
        </div>
      )}
      
    {loadingFuncionarios ? (
  <div className="bg-yellow-500 bg-opacity-75 text-white p-3 rounded mb-4">
    🔄 Carregando funcionários do banco de dados...
  </div>
) : (
  <div className="bg-green-500 bg-opacity-75 text-white p-3 rounded mb-4">
    ✅ {funcionarios.length} funcionários carregados do banco de dados
  </div>
)}

      {/* Filtros */}
      <div className="bg-purple-900 bg-opacity-40 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-purple-300 mb-1">Status</label>
            <select
              className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
              value={filtros.status}
              onChange={(e) => setFiltros({...filtros, status: e.target.value})}
            >
              <option value="">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="aprovado">Aprovado</option>
              <option value="rejeitado">Rejeitado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-purple-300 mb-1">
              Funcionário ({funcionarios.length} disponíveis)
            </label>
            <select
              className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
              value={filtros.funcionarioId}
              onChange={(e) => {
                const funcionarioId = e.target.value;
                const funcionario = funcionarios.find(f => f.id.toString() === funcionarioId);
                setFiltros({
                  ...filtros,
                  funcionarioId: funcionarioId,
                  funcionario: funcionario ? funcionario.nome : ''
                });
              }}
            >
              <option value="">Todos os funcionários</option>
              {funcionarios.map((funcionario) => (
                <option key={funcionario.id} value={funcionario.id}>
                  {funcionario.nome} - {funcionario.cargo || 'Funcionário'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-purple-300 mb-1">Período</label>
            <select
              className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
              value={filtros.periodo}
              onChange={(e) => setFiltros({...filtros, periodo: e.target.value})}
            >
              <option value="">Todos os períodos</option>
              <option value="proximo-mes">Próximo mês</option>
              <option value="este-mes">Este mês</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-purple-300 mb-1">Contestações</label>
            <select
              className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
              value={filtros.contestacao}
              onChange={(e) => setFiltros({...filtros, contestacao: e.target.value})}
            >
              <option value="">Todas</option>
              <option value="com-contestacao">Com contestação</option>
              <option value="sem-contestacao">Sem contestação</option>
            </select>
          </div>
        </div>
      </div>

      {/* Formulário de Nova Solicitação */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Registrar Nova Solicitação de Férias</h2>
        <form onSubmit={handleAddFerias} className="bg-purple-900 bg-opacity-40 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-purple-300 mb-1">
                Funcionário * ({funcionarios.length} cadastrados)
              </label>
              <select
                className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white focus:ring-2 focus:ring-purple-400"
                value={newFerias.funcionarioId}
                onChange={(e) => {
                  console.log('👤 Funcionário selecionado:', e.target.value);
                  setNewFerias({...newFerias, funcionarioId: e.target.value});
                  setError('');
                }}
                required
                disabled={loadingFuncionarios || funcionarios.length === 0}
              >
                <option value="">
                  {loadingFuncionarios ? 'Carregando funcionários...' :
                  funcionarios.length === 0 ? 'Nenhum funcionário disponível' :
                  'Selecione um funcionário'}
                </option>
                {funcionarios.map((funcionario) => (
                  <option key={funcionario.id} value={funcionario.id}>
                    {funcionario.nome} ({funcionario.diasFeriasDisponiveis || 30} dias) - {funcionario.cargo || 'Funcionário'}
                  </option>
                ))}
              </select>
              {loadingFuncionarios && (
                <div className="flex items-center mt-2 text-xs text-purple-300">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-400 mr-2"></div>
                  Buscando funcionários...
                </div>
              )}
              {!loadingFuncionarios && funcionarios.length === 0 && (
                <p className="text-xs text-red-300 mt-1">
                  ⚠️ Nenhum funcionário encontrado. Verifique se há funcionários cadastrados.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-purple-300 mb-1">Data de Início *</label>
                <input
                  type="date"
                  className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white focus:ring-2 focus:ring-purple-400"
                  value={newFerias.dataInicio}
                  onChange={(e) => {
                    console.log('📅 Data início:', e.target.value);
                    setNewFerias({...newFerias, dataInicio: e.target.value});
                    setError('');
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-purple-300 mb-1">Data de Fim *</label>
                <input
                  type="date"
                  className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white focus:ring-2 focus:ring-purple-400"
                  value={newFerias.dataFim}
                  onChange={(e) => {
                    console.log('📅 Data fim:', e.target.value);
                    setNewFerias({...newFerias, dataFim: e.target.value});
                    setError('');
                  }}
                  min={newFerias.dataInicio || new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-purple-300 mb-1">Observação</label>
            <textarea
              className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white focus:ring-2 focus:ring-purple-400"
              value={newFerias.observacao}
              onChange={(e) => setNewFerias({...newFerias, observacao: e.target.value})}
              rows={3}
              placeholder="Observações sobre as férias (opcional)"
              maxLength={500}
            ></textarea>
            <p className="text-xs text-purple-400 mt-1">
              {newFerias.observacao?.length || 0}/500 caracteres
            </p>
          </div>
          <div className={`p-3 rounded mb-4 ${
            diasFerias > 30 ? 'bg-red-700 bg-opacity-40' :
            diasFerias > 0 ? 'bg-purple-700 bg-opacity-40' :
            'bg-gray-700 bg-opacity-40'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white font-medium">
                  Total de dias de férias: <strong>{diasFerias} dias</strong>
                </p>
                {diasFerias > 30 && (
                  <p className="text-red-300 text-sm mt-1">
                    ⚠️ Máximo permitido: 30 dias consecutivos
                  </p>
                )}
                {diasFerias > 0 && diasFerias <= 30 && (
                  <p className="text-green-300 text-sm mt-1">
                    ✅ Período válido
                  </p>
                )}
              </div>
              {newFerias.funcionarioId && funcionarios.length > 0 && (
                <div className="text-right">
                  {(() => {
                    const funcionario = funcionarios.find(f => f.id.toString() === newFerias.funcionarioId);
                    const diasDisponiveis = funcionario?.diasFeriasDisponiveis || 30;
                    return (
                      <div>
                        <p className="text-sm text-purple-300">Dias disponíveis:</p>
                        <p className={`font-bold ${diasDisponiveis >= diasFerias ? 'text-green-400' : 'text-red-400'}`}>
                          {diasDisponiveis} dias
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                setNewFerias({
                  funcionarioId: '',
                  dataInicio: '',
                  dataFim: '',
                  observacao: '',
                });
                setError('');
                setSuccessMessage('');
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
            >
              Limpar
            </button>
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                loading ||
                loadingFuncionarios ||
                funcionarios.length === 0 ||
                !newFerias.funcionarioId ||
                !newFerias.dataInicio ||
                !newFerias.dataFim ||
                diasFerias > 30 ||
                diasFerias < 1
              }
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </span>
              ) : (
                'Solicitar Férias'
              )}
            </button>
          </div>
          <div className="mt-4 p-3 bg-blue-900 bg-opacity-30 rounded text-sm">
            <h4 className="font-semibold text-blue-300 mb-2">💡 Dicas:</h4>
            <ul className="text-blue-200 space-y-1">
              <li>• As férias devem ser solicitadas com antecedência</li>
              <li>• Máximo de 30 dias consecutivos por solicitação</li>
              <li>• Verifique a disponibilidade de dias antes de solicitar</li>
              <li>• A aprovação depende da análise do gestor</li>
            </ul>
          </div>
        </form>
      </div>

      {(loading || loadingFerias || loadingFuncionarios) && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
          <p className="mt-2">
            {loadingFuncionarios ? 'Carregando funcionários...' : 'Processando...'}
          </p>
        </div>
      )}

      <div className="bg-purple-900 bg-opacity-40 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Solicitações de Férias</h2>
          <button
            onClick={() => {
              setError('');
              setSuccessMessage('');
              fetchFerias();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded flex items-center"
            disabled={loadingFerias}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Atualizar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-purple-300 text-sm border-b border-purple-700">
                <th className="text-left p-3">Funcionário</th>
                <th className="text-left p-3">Cargo</th>
                <th className="text-left p-3">Data Início</th>
                <th className="text-left p-3">Data Fim</th>
                <th className="text-left p-3">Dias</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Observação</th>
                <th className="text-left p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {!loadingFerias && feriasEntries.map((ferias) => {
                const funcionario = funcionarios.find(f => f.id === ferias.funcionarioId);
                return (
                  <tr key={ferias.id} className="border-b border-purple-700 hover:bg-purple-800 hover:bg-opacity-30">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{ferias.funcionarioNome}</p>
                        <p className="text-xs text-purple-300">{funcionario?.email || 'Email não disponível'}</p>
                      </div>
                    </td>
                    <td className="p-3 text-purple-300 text-sm">
                      {funcionario?.cargo || 'N/A'}
                    </td>
                    <td className="p-3">
                      <span className="text-sm">
                        {new Date(ferias.dataInicio).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">
                        {new Date(ferias.dataFim).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-sm ${
                        ferias.diasTotais > 30 ? 'bg-red-600' :
                        ferias.diasTotais > 15 ? 'bg-orange-600' :
                        'bg-purple-600'
                      }`}>
                        {ferias.diasTotais} dias
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        ferias.status === 'aprovado' ? 'bg-green-600 text-white' :
                        ferias.status === 'rejeitado' ? 'bg-red-600 text-white' :
                        'bg-yellow-600 text-black'
                      }`}>
                        {ferias.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="max-w-xs">
                        {ferias.observacao ? (
                          <span title={ferias.observacao} className="text-sm">
                            {ferias.observacao.length > 50
                              ? `${ferias.observacao.substring(0, 50)}...`
                              : ferias.observacao
                            }
                          </span>
                        ) : (
                          <span className="text-purple-400 text-sm">-</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      {ferias.status === 'pendente' && (
                        <div className="flex gap-2">
                          <button
                            className="bg-green-500 hover:bg-green-700 text-white rounded px-3 py-1 text-sm disabled:opacity-50 transition-colors"
                            onClick={() => handleApproveFerias(ferias.id)}
                            disabled={loading}
                          >
                            ✓ Aprovar
                          </button>
                          <button
                            className="bg-red-500 hover:bg-red-700 text-white rounded px-3 py-1 text-sm disabled:opacity-50 transition-colors"
                            onClick={() => handleRejectFerias(ferias.id)}
                            disabled={loading}
                          >
                            ✗ Rejeitar
                          </button>
                        </div>
                      )}
                      {ferias.status === 'aprovado' && (
                        <div className="flex items-center text-green-400 text-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Aprovado
                        </div>
                      )}
                      {ferias.status === 'rejeitado' && (
                        <div className="flex items-center text-red-400 text-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Rejeitado
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {feriasEntries.length === 0 && !loadingFerias && (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-purple-300">
                    {funcionarios.length === 0 ? (
                      <div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        <p className="text-lg font-medium">Nenhum funcionário cadastrado</p>
                        <p className="text-sm">Cadastre funcionários para gerenciar férias</p>
                      </div>
                    ) : (
                      <div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-lg font-medium">Nenhuma solicitação de férias</p>
                        <p className="text-sm">Use o formulário acima para criar uma nova solicitação</p>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {feriasEntries.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-purple-800 bg-opacity-50 p-4 rounded">
              <p className="text-sm text-purple-300">Total de Solicitações</p>
              <p className="text-2xl font-bold text-white">{feriasEntries.length}</p>
            </div>
            <div className="bg-yellow-600 bg-opacity-20 p-4 rounded">
              <p className="text-sm text-yellow-300">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-400">
                {feriasEntries.filter(f => f.status === 'pendente').length}
              </p>
            </div>
            <div className="bg-green-600 bg-opacity-20 p-4 rounded">
              <p className="text-sm text-green-300">Aprovadas</p>
              <p className="text-2xl font-bold text-green-400">
                {feriasEntries.filter(f => f.status === 'aprovado').length}
              </p>
            </div>
            <div className="bg-red-600 bg-opacity-20 p-4 rounded">
              <p className="text-sm text-red-300">Rejeitadas</p>
              <p className="text-2xl font-bold text-red-400">
                {feriasEntries.filter(f => f.status === 'rejeitado').length}
              </p>
            </div>
          </div>
        )}
      </div>

      {funcionarios.length > 0 && (
        <div className="mt-6 bg-purple-900 bg-opacity-40 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">
            📋 Funcionários Cadastrados ({funcionarios.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {funcionarios.slice(0, 6).map((funcionario) => (
              <div key={funcionario.id} className="bg-purple-700 bg-opacity-40 p-3 rounded hover:bg-purple-600 hover:bg-opacity-40 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-white">{funcionario.nome}</p>
                    <p className="text-sm text-purple-300">{funcionario.cargo || 'Funcionário'}</p>
                    <p className="text-xs text-purple-400">{funcionario.departamento || 'Geral'}</p>
                  </div>
                  <div className="text-right">
                    <div className="bg-purple-600 px-2 py-1 rounded text-xs text-white">
                      {funcionario.diasFeriasDisponiveis || 30} dias
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {funcionarios.length > 6 && (
              <div className="bg-purple-700 bg-opacity-40 p-3 rounded flex items-center justify-center">
                <div className="text-center">
                  <p className="text-lg font-bold text-white">+{funcionarios.length - 6}</p>
                  <p className="text-sm text-purple-300">mais funcionários</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeriasTab;