import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8080/api';

const JustificativaAusencia = ({ userData, setLastAction, setNotifications, notifications }) => {
  // ===== VERIFICAÇÃO DE SEGURANÇA E CARREGAMENTO DE DADOS =====
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para formulário e modais
  const [showAusenciaModal, setShowAusenciaModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [ausenciasList, setAusenciasList] = useState([]);
  const [loadingApi, setLoadingApi] = useState(false);
  
  // Estado para nova ausência
  const [novaAusencia, setNovaAusencia] = useState({
    tipo: 'atestado médico',
    dataInicio: '',
    dataFim: '',
    horaInicio: '08:00',
    horaFim: '18:00',
    motivo: '',
    anexo: null,
    status: 'pendente'
  });

  // ===== FUNÇÕES DE API =====
  
  // Obter token de autenticação
  const getAuthToken = () => {
    return sessionStorage.getItem('token') || localStorage.getItem('token');
  };
  
  // Headers para requisições
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`
  });

  // Buscar dados do usuário se não foram passados via props
  const fetchUserData = async () => {
    try {
      console.log('🔍 Buscando dados do usuário...');
      
      const response = await fetch(`${API_BASE_URL}/me`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const user = await response.json();
      console.log('✅ Dados do usuário carregados:', user);
      
      return {
        id: user.id,
        name: user.name || user.nome || 'Usuário',
        email: user.email || ''
      };
      
    } catch (err) {
      console.error('❌ Erro ao buscar dados do usuário:', err);
      
      // Fallback para localStorage
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (storedUser && storedUser.id) {
          console.log('🔄 Usando dados do localStorage:', storedUser);
          return {
            id: storedUser.id,
            name: storedUser.name || storedUser.nome || 'Usuário',
            email: storedUser.email || ''
          };
        }
      } catch (storageError) {
        console.error('❌ Erro ao ler localStorage:', storageError);
      }
      
      throw new Error('Não foi possível carregar dados do usuário');
    }
  };

  // Buscar ausências do usuário
  const fetchAusencias = async (userId) => {
    if (!userId) {
      console.log('⚠️ fetchAusencias: userId não disponível');
      return;
    }
    
    try {
      setLoadingApi(true);
      console.log('🔍 Buscando ausências para usuário ID:', userId);
      
      const response = await fetch(`${API_BASE_URL}/ausencias/funcionario/${userId}`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const ausencias = await response.json();
      console.log('✅ Ausências carregadas:', ausencias);
      
      // Converter formato da API para o formato esperado pelo componente
      const ausenciasFormatadas = ausencias.map(ausencia => ({
        id: ausencia.id,
        employeeId: ausencia.funcionarioId,
        employeeName: userInfo?.name || 'Usuário',
        tipo: ausencia.tipo,
        dataInicio: formatarDataBR(ausencia.data),
        dataFim: formatarDataBR(ausencia.data), // Para ausências de um dia só
        horaInicio: '08:00', // Valores padrão, pode ser melhorado
        horaFim: '18:00',
        motivo: ausencia.justificativa,
        anexo: ausencia.arquivoAnexo,
        status: ausencia.status,
        dataCriacao: formatarDataBR(ausencia.createdAt),
        registradoPor: userInfo?.name || 'Usuário'
      }));
      
      setAusenciasList(ausenciasFormatadas);
      setError('');
      
    } catch (err) {
      console.error('❌ Erro ao buscar ausências:', err);
      setError('Erro ao carregar ausências: ' + err.message);
    } finally {
      setLoadingApi(false);
    }
  };

  // Criar nova ausência
  const criarAusencia = async (dadosAusencia) => {
    try {
      console.log('📝 Criando nova ausência:', dadosAusencia);
      
      const response = await fetch(`${API_BASE_URL}/ausencias/solicitar`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          funcionarioId: userInfo.id,
          data: converterParaISO(dadosAusencia.dataInicio),
          tipo: dadosAusencia.tipo,
          justificativa: dadosAusencia.motivo
        })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Ausência criada com sucesso');
        return result.ausencia;
      } else {
        throw new Error(result.error || 'Erro ao criar ausência');
      }
      
    } catch (err) {
      console.error('❌ Erro ao criar ausência:', err);
      throw err;
    }
  };

  // Upload de arquivo de atestado
  const uploadAtestado = async (file, ausenciaData) => {
    try {
      console.log('📎 Fazendo upload do atestado:', file.name);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('funcionarioId', userInfo.id.toString());
      formData.append('dataInicio', converterParaISO(ausenciaData.dataInicio));
      formData.append('motivo', ausenciaData.motivo);

      const response = await fetch(`${API_BASE_URL}/upload/atestado`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
          // Não definir Content-Type para FormData, o browser faz automaticamente
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Atestado enviado com sucesso');
        return result.ausencia;
      } else {
        throw new Error(result.error || 'Erro ao enviar atestado');
      }
      
    } catch (err) {
      console.error('❌ Erro ao enviar atestado:', err);
      throw err;
    }
  };

  // ===== FUNÇÕES AUXILIARES =====
  
  // Formata data para o formato PT-BR (DD/MM/YYYY)
  const formatarDataBR = (data) => {
    if (!data) return '';
    const d = new Date(data);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  // Converte data de formato PT-BR para ISO (YYYY-MM-DD)
  const converterParaISO = (data) => {
    if (!data) return '';
    if (data.includes('-')) return data; // Já está em formato ISO
    
    const partes = data.split('/');
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
  };

  // ===== EFFECTS =====
  
  // Carregar dados do usuário
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Se userData foi passado via props e é válido, usar ele
        if (userData && userData.id) {
          console.log('✅ Usando userData das props:', userData);
          setUserInfo({
            id: userData.id,
            name: userData.name || userData.nome || 'Usuário',
            email: userData.email || ''
          });
        } else {
          // Senão, buscar da API
          console.log('🔍 userData não disponível, buscando da API...');
          const user = await fetchUserData();
          setUserInfo(user);
        }
        
      } catch (err) {
        console.error('❌ Erro ao carregar dados do usuário:', err);
        setError('Erro ao carregar dados do usuário: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [userData]);

  // Carregar ausências quando userInfo estiver disponível
  useEffect(() => {
    if (userInfo?.id && !loading) {
      fetchAusencias(userInfo.id);
    }
  }, [userInfo?.id, loading]);

  // ===== HANDLERS =====
  
  // Função para lidar com mudanças no formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovaAusencia(prev => ({ ...prev, [name]: value }));
  };

  // Função para lidar com seleção de arquivo
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setNovaAusencia(prev => ({ ...prev, anexo: e.target.files[0].name }));
    }
  };

  // Função para abrir o modal
  const abrirModalAusencia = () => {
    setNovaAusencia({
      tipo: 'atestado médico',
      dataInicio: '',
      dataFim: '',
      horaInicio: '08:00',
      horaFim: '18:00',
      motivo: '',
      anexo: null,
      status: 'pendente'
    });
    setSelectedFile(null);
    setFileInputKey(Date.now());
    setShowAusenciaModal(true);
  };

  // Função para fechar o modal
  const fecharModalAusencia = () => {
    setShowAusenciaModal(false);
    setSelectedFile(null);
    setFileInputKey(Date.now());
  };

  // Funções para lidar com as datas no formulário
  const handleDataInicioChange = (e) => {
    const dataISO = e.target.value;
    if (!dataISO) {
      setNovaAusencia(prev => ({ ...prev, dataInicio: '' }));
      return;
    }
    
    // Converter para o formato DD/MM/YYYY
    const dataFormatada = formatarDataBR(dataISO + 'T00:00:00');
    setNovaAusencia(prev => ({ 
      ...prev, 
      dataInicio: dataFormatada,
      // Se a data de fim não estiver definida, define igual à data de início
      dataFim: prev.dataFim ? prev.dataFim : dataFormatada
    }));
  };

  const handleDataFimChange = (e) => {
    const dataISO = e.target.value;
    if (!dataISO) {
      setNovaAusencia(prev => ({ ...prev, dataFim: '' }));
      return;
    }
    
    // Converter para o formato DD/MM/YYYY
    const dataFormatada = formatarDataBR(dataISO + 'T00:00:00');
    setNovaAusencia(prev => ({ ...prev, dataFim: dataFormatada }));
  };

  // Função para salvar a ausência
  const salvarAusencia = async () => {
    // Validar datas
    if (!novaAusencia.dataInicio || !novaAusencia.dataFim || !novaAusencia.motivo) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setLoadingApi(true);
      
      let ausenciaCriada;
      
      // Se tem arquivo anexo e é atestado médico, usar endpoint de upload
      if (selectedFile && novaAusencia.tipo === 'atestado médico') {
        ausenciaCriada = await uploadAtestado(selectedFile, novaAusencia);
      } else {
        // Usar endpoint regular de criação
        ausenciaCriada = await criarAusencia(novaAusencia);
      }
      
      // Feedback para o usuário
      const newNotification = {
        id: (notifications?.length || 0) + Date.now(),
        text: `Solicitação de ${novaAusencia.tipo} enviada com sucesso. Aguardando aprovação.`,
        read: false,
        date: new Date().toLocaleDateString('pt-BR')
      };
      
      if (typeof setNotifications === 'function') {
        setNotifications(prev => [newNotification, ...(prev || [])]);
      }
      
      if (typeof setLastAction === 'function') {
        setLastAction(`Solicitação de ${novaAusencia.tipo} enviada com sucesso!`);
      }
      
      // Recarregar lista de ausências
      if (userInfo?.id) {
        await fetchAusencias(userInfo.id);
      }
      
      // Fechar modal
      setShowAusenciaModal(false);
      setSelectedFile(null);
      setFileInputKey(Date.now());
      
    } catch (err) {
      console.error('❌ Erro ao salvar ausência:', err);
      alert('Erro ao enviar solicitação: ' + err.message);
    } finally {
      setLoadingApi(false);
    }
  };

  // Função para cancelar uma solicitação existente
  const cancelarSolicitacao = async (id) => {
    if (!window.confirm('Tem certeza que deseja cancelar esta solicitação?')) {
      return;
    }

    try {
      setLoadingApi(true);
      
      // TODO: Implementar endpoint de cancelamento no backend
      // Por enquanto, simular cancelamento local
      console.log('🚫 Cancelando solicitação ID:', id);
      
      // Atualizar lista local temporariamente
      setAusenciasList(prev => prev.map(a => 
        a.id === id ? { ...a, status: 'cancelado' } : a
      ));
      
      if (typeof setLastAction === 'function') {
        setLastAction('Solicitação de ausência cancelada com sucesso!');
      }
      
    } catch (err) {
      console.error('❌ Erro ao cancelar solicitação:', err);
      alert('Erro ao cancelar solicitação: ' + err.message);
    } finally {
      setLoadingApi(false);
    }
  };

  // Função para obter o nome da classe CSS para o status
  const getStatusClass = (status) => {
    switch (status) {
      case 'aprovado':
        return 'bg-green-600';
      case 'pendente':
        return 'bg-yellow-600';
      case 'rejeitado':
        return 'bg-red-600';
      case 'cancelado':
        return 'bg-gray-600';
      default:
        return 'bg-purple-600';
    }
  };

  // Função para obter o nome da classe CSS para o tipo
  const getTipoClass = (tipo) => {
    switch (tipo) {
      case 'atestado médico':
      case 'atestado':
        return 'bg-blue-600';
      case 'falta':
        return 'bg-orange-600';
      case 'férias':
        return 'bg-green-600';
      case 'licença':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
    }
  };

  // ===== RENDER =====
  
  // Estado de loading inicial
  if (loading) {
    return (
      <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-lg shadow-lg p-4 mb-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-purple-300">Carregando dados do usuário...</p>
        </div>
      </div>
    );
  }

  // Estado de erro
  if (error && !userInfo) {
    return (
      <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-lg shadow-lg p-4 mb-8">
        <div className="text-center py-8">
          <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded text-white text-sm p-4">
            <h3 className="font-bold mb-2">Erro ao carregar dados</h3>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Verificação final de segurança
  if (!userInfo || !userInfo.id) {
    return (
      <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-lg shadow-lg p-4 mb-8">
        <div className="text-center py-4">
          <p className="text-purple-300">Dados do usuário não disponíveis</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-lg shadow-lg p-4 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Justificativa de Ausência
        </h2>
        <button
          onClick={abrirModalAusencia}
          disabled={loadingApi}
          className="bg-purple-600 hover:bg-purple-500 px-3 py-2 rounded-md text-sm flex items-center disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nova Justificativa
        </button>
      </div>
      
      <p className="text-purple-300 text-sm mb-4">
        Olá {userInfo.name}, registre e acompanhe suas ausências, atestados, férias e licenças.
      </p>

      {/* Loading e Error States */}
      {loadingApi && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-2"></div>
          <p className="text-purple-300">Carregando...</p>
        </div>
      )}

      {error && userInfo && (
        <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded text-white text-sm p-3 mb-4">
          {error}
        </div>
      )}
      
      {!loadingApi && ausenciasList.length === 0 ? (
        <div className="bg-purple-800 bg-opacity-30 p-6 rounded-lg text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-purple-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>Você não possui nenhuma justificativa de ausência registrada.</p>
          <button
            onClick={abrirModalAusencia}
            className="mt-4 bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-md"
          >
            Registrar Nova Justificativa
          </button>
        </div>
      ) : !loadingApi && ausenciasList.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-purple-300 text-sm">
                <th className="text-left p-2">Tipo</th>
                <th className="text-left p-2">Período</th>
                <th className="text-left p-2">Motivo</th>
                <th className="text-left p-2">Anexo</th>
                <th className="text-left p-2">Data de Solicitação</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {ausenciasList.map((ausencia) => (
                <tr key={ausencia.id} className="border-t border-purple-700">
                  <td className="p-2">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${getTipoClass(ausencia.tipo)}`}>
                      {ausencia.tipo.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-2">
                    {ausencia.dataInicio === ausencia.dataFim 
                      ? `${ausencia.dataInicio} (${ausencia.horaInicio || '08:00'} - ${ausencia.horaFim || '18:00'})` 
                      : `${ausencia.dataInicio} a ${ausencia.dataFim} (${ausencia.horaInicio || '08:00'} - ${ausencia.horaFim || '18:00'})`}
                  </td>
                  <td className="p-2">{ausencia.motivo}</td>
                  <td className="p-2">
                    {ausencia.anexo ? (
                      <span className="text-blue-400 cursor-pointer hover:underline">
                        {ausencia.anexo}
                      </span>
                    ) : (
                      <span className="text-gray-500">Não anexado</span>
                    )}
                  </td>
                  <td className="p-2">{ausencia.dataCriacao || "N/A"}</td>
                  <td className="p-2">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusClass(ausencia.status)}`}>
                      {ausencia.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-2">
                    {ausencia.status === 'pendente' && (
                      <button
                        onClick={() => cancelarSolicitacao(ausencia.id)}
                        disabled={loadingApi}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded-md disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Modal para registrar nova ausência */}
      {showAusenciaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-purple-900 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Registrar Justificativa de Ausência</h3>
            <p className="text-purple-300 text-sm mb-4">Funcionário: {userInfo.name}</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Tipo de Ausência</label>
              <select
                name="tipo"
                value={novaAusencia.tipo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-purple-800 border border-purple-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="atestado médico">Atestado Médico</option>
                <option value="falta">Falta Justificada</option>
                <option value="férias">Férias</option>
                <option value="licença">Licença</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Data de Início</label>
                <input 
                  type="date" 
                  value={novaAusencia.dataInicio ? converterParaISO(novaAusencia.dataInicio) : ''}
                  onChange={handleDataInicioChange}
                  className="w-full px-3 py-2 bg-purple-800 border border-purple-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Hora de Início</label>
                <input 
                  type="time" 
                  name="horaInicio"
                  value={novaAusencia.horaInicio}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-purple-800 border border-purple-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-2">Data de Fim</label>
                <input 
                  type="date" 
                  value={novaAusencia.dataFim ? converterParaISO(novaAusencia.dataFim) : ''}
                  onChange={handleDataFimChange}
                  className="w-full px-3 py-2 bg-purple-800 border border-purple-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Hora de Fim</label>
                <input 
                  type="time" 
                  name="horaFim"
                  value={novaAusencia.horaFim}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-purple-800 border border-purple-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Motivo</label>
              <textarea 
                name="motivo"
                value={novaAusencia.motivo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-purple-800 border border-purple-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-20"
                placeholder="Descreva o motivo da ausência..."
              />
            </div>
            
            <div className="mt-4 mb-6">
              <label className="block text-sm font-medium mb-2">Anexar Documento (opcional)</label>
              <div className="relative border-2 border-dashed border-purple-600 rounded-md p-4 text-center">
                {selectedFile ? (
                  <div>
                    <p className="text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-purple-300 mt-1">{Math.round(selectedFile.size / 1024)} KB</p>
                    <button 
                      onClick={() => {
                        setSelectedFile(null);
                        setNovaAusencia(prev => ({ ...prev, anexo: null }));
                        setFileInputKey(Date.now());
                      }}
                      className="mt-2 px-2 py-1 bg-purple-700 hover:bg-purple-600 rounded-md text-xs"
                    >
                      Remover arquivo
                    </button>
                  </div>
                ) : (
                  <div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mt-2 text-sm">Clique para selecionar um arquivo</p>
                    <p className="text-xs text-purple-300 mt-1">Formatos aceitos: PDF, JPG, PNG (max. 5MB)</p>
                    <input 
                      type="file" 
                      key={fileInputKey}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png" 
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={fecharModalAusencia}
                disabled={loadingApi}
                className="px-4 py-2 bg-purple-800 hover:bg-purple-700 rounded-md disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={salvarAusencia}
                disabled={!novaAusencia.dataInicio || !novaAusencia.dataFim || !novaAusencia.motivo || loadingApi}
                className={`px-4 py-2 rounded-md ${(novaAusencia.dataInicio && novaAusencia.dataFim && novaAusencia.motivo && !loadingApi) ? 'bg-purple-600 hover:bg-purple-500' : 'bg-purple-900 opacity-50 cursor-not-allowed'}`}
              >
                {loadingApi ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JustificativaAusencia;