import React, { useState, useEffect } from 'react';
import { useFuncionarios, useApi } from '../hooks/useFuncionarios';
import SaldoFolgasModal from './SaldoFolgasModal';

const FolgaTab = () => {
  const { funcionarios: allFuncionarios, loading: loadingFuncionarios } = useFuncionarios();
  const { api } = useApi();
  
  const [modalSaldoAberto, setModalSaldoAberto] = useState(false);
  const [folgaEntries, setFolgaEntries] = useState([]);
  const [newFolga, setNewFolga] = useState({
    funcionarioId: '',
    data: '',
    tipo: 'abono',
    periodo: 'dia',
    motivo: ''
  });
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);
  const [filtros, setFiltros] = useState({
    status: '',
    funcionario: '',
    tipo: '',
    periodo: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchFolgas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/folgas', { params: filtros });
      const folgasFormatadas = response.data.map(folga => ({
        id: folga.id,
        funcionarioId: folga.funcionario_id,
        funcionarioNome: allFuncionarios.find(f => f.id === folga.funcionario_id)?.nome || 'N/A',
        data: folga.data,
        tipo: folga.tipo,
        periodo: folga.periodo,
        motivo: folga.motivo,
        status: folga.status
      }));
      setFolgaEntries(folgasFormatadas);
    } catch (error) {
      console.error('Erro ao buscar folgas:', error);
      setError('Erro ao carregar folgas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (allFuncionarios.length > 0) {
      fetchFolgas();
    }
  }, [filtros, allFuncionarios]);

  const handleAddFolga = async (e) => {
    e.preventDefault();
    if (!newFolga.funcionarioId || !newFolga.data || !newFolga.tipo || !newFolga.motivo) {
      alert('Por favor, preencha todos os campos obrigatórios');
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const folgaData = {
        funcionario_id: parseInt(newFolga.funcionarioId),
        data: newFolga.data,
        tipo: newFolga.tipo,
        periodo: newFolga.periodo,
        motivo: newFolga.motivo,
        status: 'pendente'
      };
      await api.post('/folgas', folgaData);
      alert('Solicitação de folga registrada com sucesso!');
      setNewFolga({
        funcionarioId: '',
        data: '',
        tipo: 'abono',
        periodo: 'dia',
        motivo: ''
      });
      fetchFolgas();
    } catch (error) {
      console.error('Erro ao registrar folga:', error);
      setError('Erro ao registrar folga');
      alert('Erro ao registrar folga');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveFolga = async (id) => {
    try {
      setLoading(true);
      await api.put(`/folgas/${id}`, { status: 'aprovado' });
      alert('Folga aprovada com sucesso!');
      fetchFolgas();
    } catch (error) {
      console.error('Erro ao aprovar folga:', error);
      alert('Erro ao aprovar folga');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectFolga = async (id) => {
    try {
      setLoading(true);
      await api.put(`/folgas/${id}`, { status: 'rejeitado' });
      alert('Folga rejeitada.');
      fetchFolgas();
    } catch (error) {
      console.error('Erro ao rejeitar folga:', error);
      alert('Erro ao rejeitar folga');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {error && (
        <div className="bg-red-500 bg-opacity-75 text-white p-3 rounded mb-4">
          {error}
          <button onClick={() => setError('')} className="float-right">&times;</button>
        </div>
      )}
      <div className="bg-purple-900 bg-opacity-40 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Gestão de Folgas</h2>
        <table className="min-w-full divide-y divide-purple-700">
          <thead className="bg-purple-800">
            <tr>
              <th className="px-4 py-3 text-left">Funcionário</th>
              <th className="px-4 py-3 text-left">Data</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Período</th>
              <th className="px-4 py-3 text-left">Motivo</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-700">
            {folgaEntries.map((folga) => (
              <tr key={folga.id} className="hover:bg-purple-800 hover:bg-opacity-50">
                <td className="px-4 py-2">{folga.funcionarioNome}</td>
                <td className="px-4 py-2">{folga.data}</td>
                <td className="px-4 py-2">{folga.tipo}</td>
                <td className="px-4 py-2">{folga.periodo}</td>
                <td className="px-4 py-2">{folga.motivo}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    folga.status === 'aprovado' ? 'bg-green-600' :
                    folga.status === 'rejeitado' ? 'bg-red-600' : 'bg-yellow-600'
                  }`}>
                    {folga.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => handleApproveFolga(folga.id)}
                    className="bg-green-500 hover:bg-green-700 text-white py-1 px-3 rounded text-sm mr-2"
                  >Aprovar</button>
                  <button
                    onClick={() => handleRejectFolga(folga.id)}
                    className="bg-red-500 hover:bg-red-700 text-white py-1 px-3 rounded text-sm mr-2"
                  >Rejeitar</button>
                  <button
                    onClick={() => setFuncionarioSelecionado(folga.funcionarioId)}
                    className="bg-purple-600 hover:bg-purple-700 text-white py-1 px-3 rounded text-sm"
                  >Editar Saldos</button>
                </td>
              </tr>
            ))}
            {folgaEntries.length === 0 && !loading && (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-400">
                  Nenhuma folga registrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {(loading || loadingFuncionarios) && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400 mx-auto"></div>
            <p className="mt-2 text-sm">Carregando...</p>
          </div>
        )}
      </div>
      <div className="bg-purple-900 bg-opacity-40 rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Registrar Nova Folga</h2>
        <form onSubmit={handleAddFolga}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-purple-300 mb-1">Funcionário</label>
              <select
                className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
                value={newFolga.funcionarioId}
                onChange={(e) => setNewFolga({ ...newFolga, funcionarioId: e.target.value })}
                required >
                <option value="">Selecione um funcionário</option>
                {allFuncionarios.map((funcionario) => (
                  <option key={funcionario.id} value={funcionario.id}>
                    {funcionario.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-purple-300 mb-1">Data</label>
              <input
                type="date"
                className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
                value={newFolga.data}
                onChange={(e) => setNewFolga({ ...newFolga, data: e.target.value })}
                required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-purple-300 mb-1">Tipo</label>
              <select
                className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
                value={newFolga.tipo}
                onChange={(e) => setNewFolga({ ...newFolga, tipo: e.target.value })}
                required >
                <option value="abono">Abono</option>
                <option value="banco de horas">Banco de Horas</option>
                <option value="compensação">Compensação</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-purple-300 mb-1">Período</label>
              <select
                className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
                value={newFolga.periodo}
                onChange={(e) => setNewFolga({ ...newFolga, periodo: e.target.value })} >
                <option value="dia">Dia inteiro</option>
                <option value="manhã">Manhã</option>
                <option value="tarde">Tarde</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-purple-300 mb-1">Motivo</label>
            <textarea
              className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
              rows="3"
              value={newFolga.motivo}
              onChange={(e) => setNewFolga({ ...newFolga, motivo: e.target.value })}
              placeholder="Informe o motivo da folga"
              required ></textarea>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md font-medium"
              disabled={loading} >
              {loading ? 'Registrando...' : 'Registrar Folga'}
            </button>
          </div>
        </form>
      </div>
      {funcionarioSelecionado !== null && (
        <SaldoFolgasModal
          isOpen={funcionarioSelecionado !== null}
          onClose={() => setFuncionarioSelecionado(null)}
          funcionarioId={funcionarioSelecionado}
         // onSave={atualizarSaldosFuncionario}
        />
      )}
    </div>
  );
};

export default FolgaTab;
