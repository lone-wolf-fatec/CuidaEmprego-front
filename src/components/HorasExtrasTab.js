import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FeriasTab from './FeriasTab';
import FolgaTab from './FolgaTab';

const HorasExtrasTab = () => {
  const [activeTab, setActiveTab] = useState('horasExtras');
  const [overtimeEntries, setOvertimeEntries] = useState([]);
  const [newOvertime, setNewOvertime] = useState({
    funcionarioId: '',
    date: '',
    hours: '',
    reason: ''
  });
  const [allFuncionarios, setAllFuncionarios] = useState([]);
  const [modalRejeitarAberto, setModalRejeitarAberto] = useState(false);
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState(null);
  const [observacaoRejeicao, setObservacaoRejeicao] = useState('');
  const [filtros, setFiltros] = useState({
    status: '',
    funcionario: '',
    periodo: ''
  });

  // Carrega todos os funcionários
  const getAllFuncionarios = async () => {
    try {
      const response = await axios.get('/api/funcionarios');
      setAllFuncionarios(response.data);
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
    }
  };

  // Carrega todas as horas extras com filtros
  const loadOvertimeEntries = async () => {
    try {
      const response = await axios.get('/api/horasExtras', { params: filtros });
      setOvertimeEntries(response.data);
    } catch (error) {
      console.error('Erro ao carregar horas extras:', error);
    }
  };

  useEffect(() => {
    getAllFuncionarios();
    loadOvertimeEntries();
  }, [filtros]);

  // Adiciona nova hora extra
  const handleAddOvertime = async (e) => {
    e.preventDefault();
    if (!newOvertime.funcionarioId || !newOvertime.date || !newOvertime.hours || !newOvertime.reason) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    try {
      const response = await axios.post('/api/horasExtras', {
        ...newOvertime,
        status: 'pendente'
      });
      setOvertimeEntries([response.data, ...overtimeEntries]);
      setNewOvertime({
        funcionarioId: '',
        date: '',
        hours: '',
        reason: ''
      });
      alert('Hora extra registrada com sucesso!');
    } catch (error) {
      console.error('Erro ao registrar hora extra:', error);
    }
  };

  // Altera status de uma entrada
  const changeStatus = async (id, newStatus) => {
    try {
      await axios.patch(`/api/horasExtras/${id}`, {
        status: newStatus,
        observacao: newStatus === 'rejeitado' ? observacaoRejeicao : ''
      });
      loadOvertimeEntries();
      if (newStatus === 'rejeitado') {
        setModalRejeitarAberto(false);
        setSolicitacaoSelecionada(null);
        setObservacaoRejeicao('');
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  // Abre modal de rejeição
  const abrirModalRejeitar = (overtime) => {
    setSolicitacaoSelecionada(overtime);
    setObservacaoRejeicao('');
    setModalRejeitarAberto(true);
  };

  // Detecta horas extras automaticamente
  const detectOvertime = async () => {
    try {
      const response = await axios.post('/api/horasExtras/detect');
      alert(`${response.data.newDetected} novas horas extras detectadas automaticamente.`);
      loadOvertimeEntries();
    } catch (error) {
      console.error('Erro ao detectar horas extras:', error);
    }
  };

  // Renderiza cor de status
  const renderizarStatus = (status) => {
    let corClasse = '';
    let texto = status.toUpperCase();
    switch (status) {
      case 'aprovado':
        corClasse = 'bg-green-600';
        break;
      case 'pendente':
        corClasse = 'bg-yellow-600';
        break;
      case 'rejeitado':
        corClasse = 'bg-red-600';
        break;
      case 'detectado':
        corClasse = 'bg-blue-600';
        texto = 'DETECTADO';
        break;
      default:
        corClasse = 'bg-gray-600';
    }
    return (
      <span className={`inline-block px-2 py-1 rounded-full text-xs ${corClasse}`}>
        {texto}
      </span>
    );
  };

  return (
    <div className="bg-purple-900 min-h-screen p-4 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex border-b border-purple-700 mb-6">
          <button
            className={`py-2 px-4 font-medium rounded-t-lg mr-2 ${
              activeTab === 'horasExtras'
                ? 'bg-purple-800 border-t border-l border-r border-purple-700'
                : 'bg-purple-950 text-purple-300 hover:bg-purple-800 hover:text-white'
            }`}
            onClick={() => setActiveTab('horasExtras')}
          >
            Horas Extras
          </button>
          <button
            className={`py-2 px-4 font-medium rounded-t-lg mr-2 ${
              activeTab === 'ferias'
                ? 'bg-purple-800 border-t border-l border-r border-purple-700'
                : 'bg-purple-950 text-purple-300 hover:bg-purple-800 hover:text-white'
            }`}
            onClick={() => setActiveTab('ferias')}
          >
            Férias
          </button>
          <button
            className={`py-2 px-4 font-medium rounded-t-lg mr-2 ${
              activeTab === 'folgas'
                ? 'bg-purple-800 border-t border-l border-r border-purple-700'
                : 'bg-purple-950 text-purple-300 hover:bg-purple-800 hover:text-white'
            }`}
            onClick={() => setActiveTab('folgas')}
          >
            Folgas
          </button>
        </div>
        {activeTab === 'horasExtras' && (
          <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold mb-6">Gerenciamento de Horas Extras</h1>
            <div className="mb-4 flex justify-between items-center">
              <button
                onClick={loadOvertimeEntries}
                className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-md text-sm"
              >
                Atualizar Lista de Funcionários ({allFuncionarios.length})
              </button>
              <button
                onClick={detectOvertime}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
                </svg>
                Detectar Horas Extras
              </button>
            </div>
            <div className="bg-purple-900 bg-opacity-40 rounded-lg p-4 mb-6">
              <h2 className="text-xl font-semibold mb-4">Filtros</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-purple-300 mb-1">Status</label>
                  <select
                    className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
                    value={filtros.status}
                    onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                  >
                    <option value="">Todos os status</option>
                    <option value="pendente">Pendente</option>
                    <option value="aprovado">Aprovado</option>
                    <option value="rejeitado">Rejeitado</option>
                    <option value="detectado">Detectado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-purple-300 mb-1">Funcionário</label>
                  <select
                    className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
                    value={filtros.funcionario}
                    onChange={(e) => setFiltros({ ...filtros, funcionario: e.target.value })}
                  >
                    <option value="">Todos os funcionários</option>
                    {allFuncionarios.map((func) => (
                      <option key={func.id} value={func.nome}>
                        {func.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-purple-300 mb-1">Período</label>
                  <select
                    className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
                    value={filtros.periodo}
                    onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })}
                  >
                    <option value="">Todos os períodos</option>
                    <option value="hoje">Hoje</option>
                    <option value="semana">Últimos 7 dias</option>
                    <option value="mes">Este mês</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Registrar Nova Hora Extra</h2>
              <form onSubmit={handleAddOvertime} className="bg-purple-900 bg-opacity-40 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-purple-300 mb-1">
                      Funcionário * ({allFuncionarios.length} disponíveis)
                    </label>
                    <select
                      className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
                      value={newOvertime.funcionarioId}
                      onChange={(e) => setNewOvertime({ ...newOvertime, funcionarioId: e.target.value })}
                      required
                    >
                      <option value="">Selecione</option>
                      {allFuncionarios.map(funcionario => (
                        <option key={funcionario.id} value={funcionario.id}>
                          {funcionario.nome} {funcionario.id ? `(ID: ${funcionario.id})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-purple-300 mb-1">Data *</label>
                    <input
                      type="date"
                      className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
                      value={newOvertime.date}
                      onChange={(e) => setNewOvertime({ ...newOvertime, date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-purple-300 mb-1">Horas *</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
                      value={newOvertime.hours}
                      onChange={(e) => setNewOvertime({ ...newOvertime, hours: e.target.value })}
                      required
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm text-purple-300 mb-1">Motivo *</label>
                    <input
                      type="text"
                      className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
                      value={newOvertime.reason}
                      onChange={(e) => setNewOvertime({ ...newOvertime, reason: e.target.value })}
                      required
                      placeholder="Motivo da hora extra"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                >
                  Registrar Hora Extra
                </button>
              </form>
            </div>
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Histórico de Horas Extras</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-purple-300 text-sm border-b border-purple-700">
                      <th className="px-4 py-2 text-left">Funcionário</th>
                      <th className="px-4 py-2 text-left">Data</th>
                      <th className="px-4 py-2 text-left">Horas</th>
                      <th className="px-4 py-2 text-left">Motivo</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overtimeEntries.map((entry) => (
                      <tr key={entry.id} className="border-b border-purple-700 hover:bg-purple-700 hover:bg-opacity-30">
                        <td className="px-4 py-3">{entry.funcionarioNome}</td>
                        <td className="px-4 py-3">{entry.date}</td>
                        <td className="px-4 py-3">{entry.hours}h</td>
                        <td className="px-4 py-3">
                          <div className="truncate max-w-xs" title={entry.reason}>
                            {entry.reason}
                          </div>
                        </td>
                        <td className="px-4 py-3">{renderizarStatus(entry.status)}</td>
                        <td className="px-4 py-3">
                          {entry.status === 'pendente' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => changeStatus(entry.id, 'aprovado')}
                                className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded"
                              >
                                Aprovar
                              </button>
                              <button
                                onClick={() => abrirModalRejeitar(entry)}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded"
                              >
                                Rejeitar
                              </button>
                            </div>
                          )}
                          {entry.status === 'detectado' && (
                            <button
                              onClick={() => changeStatus(entry.id, 'aprovado')}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded"
                            >
                              Confirmar
                            </button>
                          )}
                          {(entry.status === 'aprovado' || entry.status === 'rejeitado') && entry.observacao && (
                            <div className="text-xs text-purple-300" title={entry.observacao}>
                              Obs: {entry.observacao.substring(0, 30)}
                              {entry.observacao.length > 30 ? '...' : ''}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {overtimeEntries.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-4 py-6 text-center text-purple-300">
                          Nenhuma hora extra encontrada com os filtros selecionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card - Total de Horas Extras */}
              <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-lg shadow-lg p-4">
                <div className="flex items-center mb-4">
                  <div className="bg-purple-600 p-2 rounded-full mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold">Total de Horas Extras</h2>
                </div>
                <p className="text-2xl font-bold mb-2">
                  {overtimeEntries.filter(entry => entry.status === 'aprovado')
                    .reduce((total, entry) => total + entry.hours, 0)
                    .toFixed(1)}h
                </p>
                <p className="text-purple-300 text-sm">
                  De {overtimeEntries.filter(entry => entry.status === 'aprovado').length} registros aprovados
                </p>
              </div>
              {/* Card - Solicitações Pendentes */}
              <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-lg shadow-lg p-4">
                <div className="flex items-center mb-4">
                  <div className="bg-yellow-600 p-2 rounded-full mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold">Solicitações Pendentes</h2>
                </div>
                <p className="text-2xl font-bold mb-2">
                  {overtimeEntries.filter(entry => entry.status === 'pendente' || entry.status === 'detectado').length}
                </p>
                <p className="text-purple-300 text-sm">
                  Total de {overtimeEntries.filter(entry => entry.status === 'pendente' || entry.status === 'detectado')
                    .reduce((total, entry) => total + entry.hours, 0)
                    .toFixed(1)}h a processar
                </p>
              </div>
              {/* Card - Top Funcionários */}
              <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-lg shadow-lg p-4">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-600 p-2 rounded-full mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold">Top Funcionários</h2>
                </div>
                <ul className="space-y-2">
                  {(() => {
                    const funcionariosHoras = overtimeEntries
                      .filter(entry => entry.status === 'aprovado' && entry.funcionarioNome && entry.funcionarioNome !== 'undefined')
                      .reduce((acc, entry) => {
                        const nome = entry.funcionarioNome || 'Não identificado';
                        if (!acc[nome]) {
                          acc[nome] = 0;
                        }
                        acc[nome] += entry.hours;
                        return acc;
                      }, {});

                    const topFuncionarios = Object.entries(funcionariosHoras)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 3);

                    if (topFuncionarios.length === 0) {
                      return <li className="text-purple-300 text-sm">Nenhuma hora extra aprovada</li>;
                    }

                    return topFuncionarios.map(([nome, horas], index) => (
                      <li key={index} className="flex justify-between items-center">
                        <span>{nome}</span>
                        <div className="flex items-center space-x-2">
                          <span className="bg-purple-700 px-2 py-1 rounded-full text-xs">
                            {horas.toFixed(1)}h
                          </span>
                          <button
                            onClick={() => {
                              const updatedEntries = overtimeEntries.map(entry =>
                                entry.funcionarioNome === nome && entry.status === 'aprovado'
                                  ? { ...entry, status: 'rejeitado', observacao: 'Removido da lista de top funcionários' }
                                  : entry
                              );
                              setOvertimeEntries(updatedEntries);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs p-1 rounded-full"
                            title="Remover funcionário da lista"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </li>
                    ));
                  })()}
                </ul>
              </div>
            </div>
            {/* Modal de Rejeição */}
            {modalRejeitarAberto && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-purple-900 rounded-lg shadow-xl p-6 w-full max-w-md">
                  <h3 className="text-xl font-bold mb-4">Rejeitar Hora Extra</h3>
                  <p className="mb-4">
                    Você está rejeitando a hora extra de <strong>{solicitacaoSelecionada?.funcionarioNome}</strong> para o dia <strong>{solicitacaoSelecionada?.date}</strong> de <strong>{solicitacaoSelecionada?.hours}h</strong>.
                  </p>
                  <div className="mb-4">
                    <label className="block text-sm text-purple-300 mb-1">Motivo da rejeição</label>
                    <textarea
                      className="w-full bg-purple-700 border border-purple-600 rounded-md p-2 text-white"
                      value={observacaoRejeicao}
                      onChange={(e) => setObservacaoRejeicao(e.target.value)}
                      rows={3}
                      placeholder="Informe o motivo da rejeição"
                    ></textarea>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setModalRejeitarAberto(false)}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => changeStatus(solicitacaoSelecionada?.id, 'rejeitado')}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded"
                    >
                      Rejeitar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'ferias' && <FeriasTab />}
        {activeTab === 'folgas' && <FolgaTab />}
      </div>
    </div>
  );
};

export default HorasExtrasTab;
