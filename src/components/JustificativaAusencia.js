import React, { useState, useEffect } from 'react';

const JustificativaAusencia = ({ userData, setLastAction, setNotifications, notifications }) => {
  // Estados para formulário e modais
  const [showAusenciaModal, setShowAusenciaModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [ausenciasList, setAusenciasList] = useState([]);
  const [currentTime] = useState(new Date());
  
  // Estado para nova ausência
  const [novaAusencia, setNovaAusencia] = useState({
    tipo: 'atestado',
    dataInicio: '',
    dataFim: '',
    horaInicio: '08:00',
    horaFim: '18:00',
    motivo: '',
    anexo: null,
    status: 'pendente'
  });

  // Carrega ausências do localStorage
  useEffect(() => {
    const storedAusencias = JSON.parse(localStorage.getItem('ausencias') || '[]');
    const userAusencias = storedAusencias.filter(a => a.employeeId === userData.id);
    setAusenciasList(userAusencias);
  }, [userData.id]);

  // Monitorar mudanças nas ausências vindas de outros componentes
  useEffect(() => {
    const handleStorageChange = () => {
      const storedAusencias = JSON.parse(localStorage.getItem('ausencias') || '[]');
      const userAusencias = storedAusencias.filter(a => a.employeeId === userData.id);
      setAusenciasList(userAusencias);
    };
    
    // Verificar a cada 5 segundos se houve mudanças no localStorage
    const interval = setInterval(() => {
      handleStorageChange();
    }, 5000);
    
    // Adicionar event listener para notificações de outros componentes
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [userData.id]);

  // Formata data para o formato PT-BR (DD/MM/YYYY)
  const formatarData = (data) => {
    if (!data) return '';
    const d = new Date(data);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  // Converte data de formato PT-BR para ISO (YYYY-MM-DD)
  const converterParaISO = (data) => {
    if (!data) return '';
    const partes = data.split('/');
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
  };

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
      tipo: 'atestado',
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
    const dataFormatada = formatarData(dataISO);
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
    const dataFormatada = formatarData(dataISO);
    setNovaAusencia(prev => ({ ...prev, dataFim: dataFormatada }));
  };

  // Função para salvar a ausência
  const salvarAusencia = () => {
    // Validar datas
    if (!novaAusencia.dataInicio || !novaAusencia.dataFim || !novaAusencia.motivo) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Criar objeto de nova ausência
    const ausenciaNova = {
      id: Date.now(),
      employeeId: userData.id,
      employeeName: userData.name,
      tipo: novaAusencia.tipo,
      dataInicio: novaAusencia.dataInicio,
      dataFim: novaAusencia.dataFim,
      horaInicio: novaAusencia.horaInicio,
      horaFim: novaAusencia.horaFim,
      motivo: novaAusencia.motivo,
      anexo: novaAusencia.anexo,
      status: 'pendente',
      notified: false,
      dataCriacao: new Date().toLocaleDateString('pt-BR'),
      registradoPor: userData.name
    };

    // Obter ausências existentes
    const ausenciasExistentes = JSON.parse(localStorage.getItem('ausencias') || '[]');
    
    // Adicionar nova ausência
    const ausenciasAtualizadas = [ausenciaNova, ...ausenciasExistentes];
    
    // Salvar no localStorage
    localStorage.setItem('ausencias', JSON.stringify(ausenciasAtualizadas));
    
    // Atualizar lista local
    setAusenciasList(prev => [ausenciaNova, ...prev]);
    
    // Criar notificação para o admin
    const adminNotification = {
      id: Date.now() + Math.random(),
      message: `${userData.name} registrou ${novaAusencia.tipo} para o período de ${novaAusencia.dataInicio} a ${novaAusencia.dataFim} (${novaAusencia.horaInicio} - ${novaAusencia.horaFim})`,
      date: new Date().toLocaleDateString('pt-BR'),
      read: false
    };
    
    const currentAdminNotifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
    localStorage.setItem('adminNotifications', JSON.stringify([
      adminNotification,
      ...currentAdminNotifications
    ]));
    
    // Feedback para o usuário
    const newNotification = {
      id: notifications.length + 1,
      text: `Solicitação de ${novaAusencia.tipo} enviada com sucesso. Aguardando aprovação.`,
      read: false,
      date: new Date().toLocaleDateString('pt-BR')
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setLastAction(`Solicitação de ${novaAusencia.tipo} enviada com sucesso!`);
    
    // Fechar modal
    setShowAusenciaModal(false);
    setSelectedFile(null);
    setFileInputKey(Date.now());
  };

  // Função para cancelar uma solicitação existente
  const cancelarSolicitacao = (id) => {
    if (window.confirm('Tem certeza que deseja cancelar esta solicitação?')) {
      // Atualizar o status no localStorage
      const ausenciasExistentes = JSON.parse(localStorage.getItem('ausencias') || '[]');
      const ausenciasAtualizadas = ausenciasExistentes.map(a => 
        a.id === id ? { ...a, status: 'cancelado', notified: false } : a
      );
      
      localStorage.setItem('ausencias', JSON.stringify(ausenciasAtualizadas));
      
      // Atualizar lista local
      setAusenciasList(prev => prev.map(a => 
        a.id === id ? { ...a, status: 'cancelado' } : a
      ));
      
      // Notificar administrador
      const ausencia = ausenciasExistentes.find(a => a.id === id);
      
      const adminNotification = {
        id: Date.now() + Math.random(),
        message: `${userData.name} cancelou solicitação de ${ausencia.tipo} para o período de ${ausencia.dataInicio} a ${ausencia.dataFim}`,
        date: new Date().toLocaleDateString('pt-BR'),
        read: false
      };
      
      const currentAdminNotifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
      localStorage.setItem('adminNotifications', JSON.stringify([
        adminNotification,
        ...currentAdminNotifications
      ]));
      
      // Feedback para o usuário
      setLastAction(`Solicitação de ausência cancelada com sucesso!`);
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
          className="bg-purple-600 hover:bg-purple-500 px-3 py-2 rounded-md text-sm flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nova Justificativa
        </button>
      </div>
      
      <p className="text-purple-300 text-sm mb-4">
        Olá {userData.name}, registre e acompanhe suas ausências, atestados, férias e licenças.
      </p>
      
      {ausenciasList.length === 0 ? (
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
      ) : (
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
                        className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded-md"
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
      
      {/* Modal para registrar nova ausência - agora com z-index alto e fundo opaco */}
      {showAusenciaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-purple-900 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Registrar Justificativa de Ausência</h3>
            <p className="text-purple-300 text-sm mb-4">Funcionário: {userData.name}</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Tipo de Ausência</label>
              <select
                name="tipo"
                value={novaAusencia.tipo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-purple-800 border border-purple-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="atestado">Atestado Médico</option>
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
                className="px-4 py-2 bg-purple-800 hover:bg-purple-700 rounded-md"
              >
                Cancelar
              </button>
              <button 
                onClick={salvarAusencia}
                disabled={!novaAusencia.dataInicio || !novaAusencia.dataFim || !novaAusencia.motivo}
                className={`px-4 py-2 rounded-md ${(novaAusencia.dataInicio && novaAusencia.dataFim && novaAusencia.motivo) ? 'bg-purple-600 hover:bg-purple-500' : 'bg-purple-900 opacity-50 cursor-not-allowed'}`}
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JustificativaAusencia;