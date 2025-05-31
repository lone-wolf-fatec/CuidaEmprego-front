import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Configuração do Axios para ajustes de ponto
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para incluir token
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

const AjustesPontoTab = () => {
  // Hooks e Context
  const { userData, funcionarios, refreshFuncionarios } = useUser();
  const navigate = useNavigate();
  
  // Estado para as solicitações de ajuste (agora vem do backend)
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para modais
  const [modalRejeitarAberto, setModalRejeitarAberto] = useState(false);
  const [modalAprovarAberto, setModalAprovarAberto] = useState(false);
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState(null);
  const [observacaoRejeicao, setObservacaoRejeicao] = useState('');
  const [observacaoAprovacao, setObservacaoAprovacao] = useState('');
  const [processandoDecisao, setProcessandoDecisao] = useState(false);
  
  // Estados para filtros (conectados com backend)
  const [filtros, setFiltros] = useState({
    status: '',
    funcionario: '',
    funcionarioId: '',
    periodo: ''
  });
  
  // Estado para lista de funcionários únicos
  const [funcionariosUnicos, setFuncionariosUnicos] = useState([]);
  
  // Carregar solicitações de ajuste do backend
  const carregarSolicitacoes = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Construir parâmetros de filtro
      const params = new URLSearchParams();
      if (filtros.status) params.append('status', filtros.status);
      if (filtros.funcionarioId) params.append('funcionarioId', filtros.funcionarioId);
      if (filtros.periodo) params.append('periodo', filtros.periodo);
      
      const response = await api.get(`/ajustes-ponto?${params.toString()}`);
      console.log('Solicitações carregadas do backend:', response.data);
      
      setSolicitacoes(response.data);
      
      // Extrair funcionários únicos das solicitações
      const funcionariosUnicos = [...new Set(response.data.map(s => ({
        id: s.funcionarioId,
        nome: s.funcionarioNome
      })))];
      
      setFuncionariosUnicos(funcionariosUnicos);
      
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      
      // Fallback para localStorage se backend estiver offline
      const storedSolicitacoes = localStorage.getItem('ajustePontoSolicitacoes');
      if (storedSolicitacoes) {
        console.log('📦 Usando dados do localStorage como fallback');
        setSolicitacoes(JSON.parse(storedSolicitacoes));
        setError('Exibindo dados offline devido a erro de conexão');
      }
      
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    console.log('🔧 AjustesPontoTab: Inicializando componente');
    
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || !storedUser.authenticated) {
      console.log('❌ AjustesPontoTab: Usuário não autenticado - aguardando AdminDashboard lidar com isso');
      return;
    }
    
    const isAdmin = storedUser.isAdmin ||
                    storedUser.email === 'admin@cuidaemprego.com' ||
                    (storedUser.roles && storedUser.roles.some(role =>
                      role && typeof role === 'string' && role.toUpperCase() === 'ADMIN'
                    ));
                    
    if (!isAdmin) {
      console.log('❌ AjustesPontoTab: Usuário não é admin - aguardando AdminDashboard lidar com isso');
      return;
    }
    
    console.log('✅ AjustesPontoTab: Usuário validado, carregando funcionários');
    refreshFuncionarios();
    
  }, [refreshFuncionarios]);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      carregarSolicitacoes();
    }
  }, [carregarSolicitacoes]);
  
  // Função para aplicar filtros (conectada com backend via parâmetros)
  const aplicarFiltros = (novosFiltros) => {
    setFiltros(prevFiltros => ({
      ...prevFiltros,
      ...novosFiltros
    }));
  };
  
  // Função para limpar filtros
  const limparFiltros = () => {
    setFiltros({
      status: '',
      funcionario: '',
      funcionarioId: '',
      periodo: ''
    });
  };
  
  // Funções de aprovação e rejeição (conectadas com backend)
  const abrirModalAprovar = (solicitacao) => {
    setSolicitacaoSelecionada(solicitacao);
    setObservacaoAprovacao('');
    setModalAprovarAberto(true);
  };
  
  const aprovarSolicitacao = async () => {
    if (!solicitacaoSelecionada || processandoDecisao) return;
    try {
      setProcessandoDecisao(true);
      await api.put(`/ajustes-ponto/${solicitacaoSelecionada.id}/decisao`, {
        decisao: 'aprovar',
        justificativa: observacaoAprovacao
      });
      console.log('Solicitação aprovada com sucesso');
      await carregarSolicitacoes();
      setModalAprovarAberto(false);
      setSolicitacaoSelecionada(null);
      setObservacaoAprovacao('');
      alert('Solicitação aprovada com sucesso!');
    } catch (error) {
      console.error('Erro ao aprovar solicitação:', error);
      let errorMessage = 'Erro ao aprovar solicitação.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      alert(errorMessage);
    } finally {
      setProcessandoDecisao(false);
    }
  };
  
  const rejeitarSolicitacao = async () => {
    if (!solicitacaoSelecionada || processandoDecisao) return;
    if (!observacaoRejeicao.trim()) {
      alert('Por favor, informe o motivo da rejeição.');
      return;
    }
    try {
      setProcessandoDecisao(true);
      await api.put(`/ajustes-ponto/${solicitacaoSelecionada.id}/decisao`, {
        decisao: 'rejeitar',
        justificativa: observacaoRejeicao
      });
      console.log('Solicitação rejeitada com sucesso');
      await carregarSolicitacoes();
      setModalRejeitarAberto(false);
      setSolicitacaoSelecionada(null);
      setObservacaoRejeicao('');
      alert('Solicitação rejeitada.');
    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      let errorMessage = 'Erro ao rejeitar solicitação.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      alert(errorMessage);
    } finally {
      setProcessandoDecisao(false);
    }
  };
  
  // Funções de renderização
  const renderizarStatus = (status) => {
    const statusColors = {
      PENDENTE: 'bg-yellow-600',
      APROVADO: 'bg-green-600',
      REJEITADO: 'bg-red-600',
      pendente: 'bg-yellow-600',
      aprovado: 'bg-green-600',
      rejeitado: 'bg-red-600',
      default: 'bg-gray-600'
    };
    const statusText = status.toLowerCase();
    return (
      <span className={`inline-block px-2 py-1 rounded-full text-xs ${statusColors[status] || statusColors.default}`}>
        {statusText.toUpperCase()}
      </span>
    );
  };
  
  const formatarData = (dataString) => {
    if (!dataString) return '';
    if (dataString.includes('T')) {
      const date = new Date(dataString);
      return date.toLocaleDateString('pt-BR');
    }
    return dataString;
  };
  
  const formatarDataHora = (dataString) => {
    if (!dataString) return '';
    if (dataString.includes('T')) {
      const date = new Date(dataString);
      return date.toLocaleString('pt-BR');
    }
    return dataString;
  };
  
  if (loading) {
    return (
      <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mr-3"></div>
          <span>Carregando ajustes de ponto...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-lg shadow-lg p-6">
      <h1 className="text-2xl font-bold mb-6">Ajustes de Ponto</h1>
      {/* Removemos a exibição do error como alerta principal */}
      
      {/* Filtros com Axios */}
      <div className="bg-purple-900 bg-opacity-40 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-purple-300 mb-1">Status</label>
            <select
              className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
              value={filtros.status}
              onChange={(e) => aplicarFiltros({ status: e.target.value })}
            >
              <option value="">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="aprovado">Aprovado</option>
              <option value="rejeitado">Rejeitado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-purple-300 mb-1">Funcionário</label>
            <select
              className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
              value={filtros.funcionarioId}
              onChange={(e) => {
                const funcionarioId = e.target.value;
                const funcionario = funcionariosUnicos.find(f => f.id.toString() === funcionarioId);
                aplicarFiltros({
                  funcionarioId: funcionarioId,
                  funcionario: funcionario ? funcionario.nome : ''
                });
              }}
            >
              <option value="">Todos os funcionários</option>
              {funcionariosUnicos.map((func) => (
                <option key={func.id} value={func.id}>{func.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-purple-300 mb-1">Período</label>
            <select
              className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
              value={filtros.periodo}
              onChange={(e) => aplicarFiltros({ periodo: e.target.value })}
            >
              <option value="">Todos os períodos</option>
              <option value="hoje">Hoje</option>
              <option value="semana">Últimos 7 dias</option>
              <option value="mes">Este mês</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={limparFiltros}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>
      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-purple-300">
          {solicitacoes.length} solicitação(ões) encontrada(s)
        </div>
        <button
          onClick={carregarSolicitacoes}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-md transition duration-200"
        >
          {loading ? 'Carregando...' : 'Recarregar'}
        </button>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-4">Solicitações de Ajuste</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-purple-300 text-sm border-b border-purple-700">
                <th className="px-4 py-2 text-left">Funcionário</th>
                <th className="px-4 py-2 text-left">Data</th>
                <th className="px-4 py-2 text-left">Tipo</th>
                <th className="px-4 py-2 text-left">Original</th>
                <th className="px-4 py-2 text-left">Solicitado</th>
                <th className="px-4 py-2 text-left">Motivo</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Solicitado em</th>
                <th className="px-4 py-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {solicitacoes.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-purple-300">
                    {loading ? 'Carregando...' : 'Nenhuma solicitação encontrada'}
                  </td>
                </tr>
              ) : (
                solicitacoes.map((solicitacao) => (
                  <tr key={solicitacao.id} className="border-b border-purple-700 hover:bg-purple-700 hover:bg-opacity-30">
                    <td className="px-4 py-3">{solicitacao.funcionarioNome}</td>
                    <td className="px-4 py-3">{formatarData(solicitacao.dataPonto)}</td>
                    <td className="px-4 py-3 capitalize">{solicitacao.tipoRegistro}</td>
                    <td className="px-4 py-3">{solicitacao.horaOriginal}</td>
                    <td className="px-4 py-3">{solicitacao.horaCorreta}</td>
                    <td className="px-4 py-3">
                      <div className="truncate max-w-xs" title={solicitacao.motivo}>
                        {solicitacao.motivo}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {renderizarStatus(solicitacao.status)}
                      {solicitacao.justificativaAdmin && (
                        <span
                          className="ml-2 text-xs text-purple-300 cursor-help"
                          title={solicitacao.justificativaAdmin}
                        >
                          ℹ️
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-purple-300">
                      {formatarDataHora(solicitacao.dataSolicitacao)}
                    </td>
                    <td className="px-4 py-3">
                      {(solicitacao.status === 'PENDENTE' || solicitacao.status === 'pendente') ? (
                        <div className="flex space-x-2">
                          {/* Botão Aprovar - com Axios */}
                          <button
                            onClick={() => abrirModalAprovar(solicitacao)}
                            disabled={processandoDecisao}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs px-2 py-1 rounded transition duration-200"
                          >
                            Aprovar
                          </button>
                          {/* Botão Rejeitar - com Axios */}
                          <button
                            onClick={() => {
                              setSolicitacaoSelecionada(solicitacao);
                              setObservacaoRejeicao('');
                              setModalRejeitarAberto(true);
                            }}
                            disabled={processandoDecisao}
                            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs px-2 py-1 rounded transition duration-200"
                          >
                            Rejeitar
                          </button>
                        </div>
                      ) : (
                        <div>
                          {solicitacao.justificativaAdmin && (
                            <div className="text-xs text-purple-300 mt-1" title={solicitacao.justificativaAdmin}>
                              {solicitacao.justificativaAdmin.length > 20
                                ? solicitacao.justificativaAdmin.substring(0, 20) + '...'
                                : solicitacao.justificativaAdmin
                              }
                            </div>
                          )}
                          {solicitacao.dataDecisao && (
                            <div className="text-xs text-purple-300">
                              Decidido em: {formatarDataHora(solicitacao.dataDecisao)}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal de Aprovação - com Axios */}
      {modalAprovarAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-purple-900 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Aprovar Solicitação</h3>
            <div className="mb-4 bg-purple-800 bg-opacity-40 p-3 rounded">
              <p className="text-sm">
                <span className="text-purple-300">Funcionário:</span> {solicitacaoSelecionada?.funcionarioNome}
              </p>
              <p className="text-sm">
                <span className="text-purple-300">Data:</span> {formatarData(solicitacaoSelecionada?.dataPonto)}
              </p>
              <p className="text-sm">
                <span className="text-purple-300">Alteração:</span> {solicitacaoSelecionada?.horaOriginal} → {solicitacaoSelecionada?.horaCorreta}
              </p>
              <p className="text-sm">
                <span className="text-purple-300">Motivo:</span> {solicitacaoSelecionada?.motivo}
              </p>
            </div>
            {/* Campo de observação com Axios */}
            <div className="mb-4">
              <label className="block text-sm text-purple-300 mb-1">Observações da aprovação</label>
              <textarea
                className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                value={observacaoAprovacao}
                onChange={(e) => setObservacaoAprovacao(e.target.value)}
                rows={3}
                placeholder="Adicione uma observação (opcional)"
                disabled={processandoDecisao}
              />
            </div>
            <div className="flex justify-end space-x-2">
              {/* Botão Cancelar */}
              <button
                onClick={() => {
                  setModalAprovarAberto(false);
                  setSolicitacaoSelecionada(null);
                  setObservacaoAprovacao('');
                }}
                disabled={processandoDecisao}
                className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded transition duration-200"
              >
                Cancelar
              </button>
              {/* Botão Confirmar Aprovação - com Axios */}
              <button
                onClick={aprovarSolicitacao}
                disabled={processandoDecisao}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded transition duration-200"
              >
                {processandoDecisao ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Aprovando...
                  </span>
                ) : (
                  'Confirmar Aprovação'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Rejeição - com Axios */}
      {modalRejeitarAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-purple-900 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Rejeitar Solicitação</h3>
            <p className="mb-4">
              Você está rejeitando a solicitação de ajuste de ponto de{' '}
              <strong>{solicitacaoSelecionada?.funcionarioNome}</strong> para o dia{' '}
              <strong>{formatarData(solicitacaoSelecionada?.dataPonto)}</strong>.
            </p>
            {/* Campo de motivo da rejeição com Axios */}
            <div className="mb-4">
              <label className="block text-sm text-purple-300 mb-1">Motivo da rejeição *</label>
              <textarea
                className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                value={observacaoRejeicao}
                onChange={(e) => setObservacaoRejeicao(e.target.value)}
                rows={3}
                placeholder="Informe o motivo da rejeição"
                disabled={processandoDecisao}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              {/* Botão Cancelar */}
              <button
                onClick={() => {
                  setModalRejeitarAberto(false);
                  setSolicitacaoSelecionada(null);
                  setObservacaoRejeicao('');
                }}
                disabled={processandoDecisao}
                className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded transition duration-200"
              >
                Cancelar
              </button>
              {/* Botão Confirmar Rejeição - com Axios */}
              <button
                onClick={rejeitarSolicitacao}
                disabled={processandoDecisao || !observacaoRejeicao.trim()}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded transition duration-200"
              >
                {processandoDecisao ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Rejeitando...
                  </span>
                ) : (
                  'Confirmar Rejeição'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AjustesPontoTab;
