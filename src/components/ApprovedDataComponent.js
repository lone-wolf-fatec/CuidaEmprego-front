import React, { useState, useEffect } from 'react';

const ApprovedDataComponent = () => {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('horasExtras');
  
  // Estados para armazenar dados aprovados pelo administrador
  const [horasExtrasApproved, setHorasExtrasApproved] = useState([]);
  const [feriasApproved, setFeriasApproved] = useState([]);
  const [folgasApproved, setFolgasApproved] = useState([]);
  const [bancoHoras, setBancoHoras] = useState(null);
  const [ausenciasApproved, setAusenciasApproved] = useState([]);
  const [jornada, setJornada] = useState(null);
  
  // Obter dados do usuário logado
  const [userData, setUserData] = useState(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    return {
      id: storedUser.id || 1, // Valor padrão para teste
      name: storedUser.name || 'Usuário',
      email: storedUser.email || ''
    };
  });
  
  // Carregar dados aprovados ao iniciar
  useEffect(() => {
    // Horas Extras aprovadas
    const storedHorasExtras = localStorage.getItem('overtimeEntries');
    if (storedHorasExtras) {
      const horasExtras = JSON.parse(storedHorasExtras);
      const approved = horasExtras.filter(item => 
        item.funcionarioId === userData.id && (item.status === 'aprovado' || item.status === 'detectado')
      );
      setHorasExtrasApproved(approved);
    }
    
    // Férias aprovadas
    const storedFerias = localStorage.getItem('feriasEntries');
    if (storedFerias) {
      const ferias = JSON.parse(storedFerias);
      const approved = ferias.filter(item => 
        item.funcionarioId === userData.id && item.status === 'aprovado'
      );
      setFeriasApproved(approved);
    }
    
    // Folgas aprovadas
    const storedFolgas = localStorage.getItem('folgaEntries');
    if (storedFolgas) {
      const folgas = JSON.parse(storedFolgas);
      const approved = folgas.filter(item => 
        item.funcionarioId === userData.id && item.status === 'aprovado'
      );
      setFolgasApproved(approved);
    }
    
    // Banco de Horas
    const storedFuncionarios = localStorage.getItem('funcionarios');
    if (storedFuncionarios) {
      const funcionarios = JSON.parse(storedFuncionarios);
      const userInfo = funcionarios.find(item => item.id === userData.id);
      if (userInfo && userInfo.bancoHoras !== undefined) {
        setBancoHoras({ 
          saldo: userInfo.bancoHoras,
          ultimaAtualizacao: new Date().toLocaleDateString('pt-BR')
        });
      }
    }
    
    // Ausências aprovadas
    const storedAusencias = localStorage.getItem('ausencias');
    if (storedAusencias) {
      const ausencias = JSON.parse(storedAusencias);
      const approved = ausencias.filter(item => 
        item.employeeId === userData.id && item.status === 'aprovado'
      );
      setAusenciasApproved(approved);
    }
    
    // Jornada de trabalho
    const storedJornadas = localStorage.getItem('jornadas');
    if (storedJornadas) {
      const jornadas = JSON.parse(storedJornadas);
      const userJornada = jornadas.find(item => item.employeeId === userData.id);
      if (userJornada) {
        setJornada(userJornada);
      }
    }
  }, [userData.id]);
  
  // Função para formatar período
  const formatPeriod = (start, end) => {
    return start === end ? start : `${start} - ${end}`;
  };

  // Renderizar status com cor
  const renderStatus = (status) => {
    let className = '';
    let text = status.toUpperCase();
    
    switch(status) {
      case 'aprovado':
        className = 'bg-green-600';
        break;
      case 'pendente':
        className = 'bg-yellow-600';
        break;
      case 'rejeitado':
        className = 'bg-red-600';
        break;
      case 'detectado':
        className = 'bg-blue-600';
        break;
      default:
        className = 'bg-gray-600';
    }
    
    return (
      <span className={`inline-block px-2 py-1 rounded-full text-xs ${className}`}>
        {text}
      </span>
    );
  };
  
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full sm:w-64 bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white font-bold py-4 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Dados do Colaborador
      </button>
      
      {/* Modal com os dados aprovados */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-purple-900 rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Dados do Administrador</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-purple-300 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Tabs de navegação */}
            <div className="mb-6">
              <div className="flex overflow-x-auto space-x-2 bg-purple-800 bg-opacity-30 p-1 rounded-lg">
                <button 
                  onClick={() => setActiveTab('horasExtras')}
                  className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${activeTab === 'horasExtras' ? 'bg-purple-600' : 'hover:bg-purple-700'}`}
                >
                  Horas Extras
                </button>
                <button 
                  onClick={() => setActiveTab('ferias')}
                  className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${activeTab === 'ferias' ? 'bg-purple-600' : 'hover:bg-purple-700'}`}
                >
                  Férias
                </button>
                <button 
                  onClick={() => setActiveTab('folgas')}
                  className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${activeTab === 'folgas' ? 'bg-purple-600' : 'hover:bg-purple-700'}`}
                >
                  Folgas
                </button>
                <button 
                  onClick={() => setActiveTab('bancoHoras')}
                  className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${activeTab === 'bancoHoras' ? 'bg-purple-600' : 'hover:bg-purple-700'}`}
                >
                  Banco de Horas
                </button>
                <button 
                  onClick={() => setActiveTab('ausencias')}
                  className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${activeTab === 'ausencias' ? 'bg-purple-600' : 'hover:bg-purple-700'}`}
                >
                  Ausências
                </button>
                <button 
                  onClick={() => setActiveTab('jornada')}
                  className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${activeTab === 'jornada' ? 'bg-purple-600' : 'hover:bg-purple-700'}`}
                >
                  Jornada de Trabalho
                </button>
              </div>
            </div>
            
            {/* Conteúdo das abas */}
            <div className="bg-purple-800 bg-opacity-30 rounded-lg p-4">
              {/* Aba de Horas Extras */}
              {activeTab === 'horasExtras' && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Horas Extras Aprovadas</h4>
                  {horasExtrasApproved.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-purple-300 text-sm border-b border-purple-700">
                            <th className="px-4 py-2 text-left">Data</th>
                            <th className="px-4 py-2 text-left">Horas</th>
                            <th className="px-4 py-2 text-left">Motivo</th>
                            <th className="px-4 py-2 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {horasExtrasApproved.map((item) => (
                            <tr key={item.id} className="border-b border-purple-700 hover:bg-purple-700 hover:bg-opacity-30">
                              <td className="px-4 py-3">{item.date}</td>
                              <td className="px-4 py-3">{item.hours}h</td>
                              <td className="px-4 py-3">
                                <div className="truncate max-w-xs" title={item.reason}>
                                  {item.reason}
                                </div>
                              </td>
                              <td className="px-4 py-3">{renderStatus(item.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-purple-300 py-4">Nenhuma hora extra aprovada encontrada.</p>
                  )}
                  
                  {/* Dashboard de resumo */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-purple-700 bg-opacity-40 rounded-lg p-4">
                      <h5 className="font-semibold mb-2">Total de Horas</h5>
                      <p className="text-2xl">
                        {horasExtrasApproved.reduce((total, item) => total + item.hours, 0).toFixed(1)}h
                      </p>
                    </div>
                    <div className="bg-purple-700 bg-opacity-40 rounded-lg p-4">
                      <h5 className="font-semibold mb-2">Total de Registros</h5>
                      <p className="text-2xl">{horasExtrasApproved.length}</p>
                    </div>
                    <div className="bg-purple-700 bg-opacity-40 rounded-lg p-4">
                      <h5 className="font-semibold mb-2">Último Registro</h5>
                      <p className="text-xl">
                        {horasExtrasApproved.length > 0 
                          ? horasExtrasApproved[0].date 
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Aba de Férias */}
              {activeTab === 'ferias' && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Férias Aprovadas</h4>
                  {feriasApproved.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-purple-300 text-sm border-b border-purple-700">
                            <th className="px-4 py-2 text-left">Período</th>
                            <th className="px-4 py-2 text-left">Dias</th>
                            <th className="px-4 py-2 text-left">Observação</th>
                            <th className="px-4 py-2 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {feriasApproved.map((item) => (
                            <tr key={item.id} className="border-b border-purple-700 hover:bg-purple-700 hover:bg-opacity-30">
                              <td className="px-4 py-3">{item.dataInicio} a {item.dataFim}</td>
                              <td className="px-4 py-3">{item.diasTotais} dias</td>
                              <td className="px-4 py-3">
                                <div className="truncate max-w-xs" title={item.observacao}>
                                  {item.observacao || '-'}
                                </div>
                              </td>
                              <td className="px-4 py-3">{renderStatus(item.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-purple-300 py-4">Nenhum período de férias aprovado encontrado.</p>
                  )}
                  
                  {/* Dashboard de resumo */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-purple-700 bg-opacity-40 rounded-lg p-4">
                      <h5 className="font-semibold mb-2">Total de Dias</h5>
                      <p className="text-2xl">
                        {feriasApproved.reduce((total, item) => total + item.diasTotais, 0)} dias
                      </p>
                    </div>
                    <div className="bg-purple-700 bg-opacity-40 rounded-lg p-4">
                      <h5 className="font-semibold mb-2">Períodos Aprovados</h5>
                      <p className="text-2xl">{feriasApproved.length}</p>
                    </div>
                    <div className="bg-purple-700 bg-opacity-40 rounded-lg p-4">
                      <h5 className="font-semibold mb-2">Próximo Período</h5>
                      <p className="text-xl">
                        {feriasApproved.length > 0 
                          ? feriasApproved[0].dataInicio 
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Aba de Folgas */}
              {activeTab === 'folgas' && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Folgas Aprovadas</h4>
                  {folgasApproved.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-purple-300 text-sm border-b border-purple-700">
                            <th className="px-4 py-2 text-left">Data</th>
                            <th className="px-4 py-2 text-left">Tipo</th>
                            <th className="px-4 py-2 text-left">Período</th>
                            <th className="px-4 py-2 text-left">Motivo</th>
                            <th className="px-4 py-2 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {folgasApproved.map((item) => (
                            <tr key={item.id} className="border-b border-purple-700 hover:bg-purple-700 hover:bg-opacity-30">
                              <td className="px-4 py-3">{item.data}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                                  item.tipo === 'abono' ? 'bg-blue-600' : 
                                  item.tipo === 'banco de horas' ? 'bg-purple-600' : 
                                  'bg-indigo-600'
                                }`}>
                                  {item.tipo.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {item.periodo === 'dia' ? 'Dia inteiro' : 
                                 item.periodo === 'manhã' ? 'Manhã' : 'Tarde'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="truncate max-w-xs" title={item.motivo}>
                                  {item.motivo}
                                </div>
                              </td>
                              <td className="px-4 py-3">{renderStatus(item.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-purple-300 py-4">Nenhuma folga aprovada encontrada.</p>
                  )}
                  
                  {/* Dashboard de resumo */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-purple-700 bg-opacity-40 rounded-lg p-4">
                      <h5 className="font-semibold mb-2">Total de Folgas</h5>
                      <p className="text-2xl">{folgasApproved.length}</p>
                    </div>
                    <div className="bg-purple-700 bg-opacity-40 rounded-lg p-4">
                      <h5 className="font-semibold mb-2">Próxima Folga</h5>
                      <p className="text-xl">
                        {folgasApproved.length > 0 
                          ? folgasApproved[0].data
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-purple-700 bg-opacity-40 rounded-lg p-4">
                      <h5 className="font-semibold mb-2">Abonos Utilizados</h5>
                      <p className="text-2xl">
                        {folgasApproved.filter(item => item.tipo === 'abono').length}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Aba de Banco de Horas */}
              {activeTab === 'bancoHoras' && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Banco de Horas</h4>
                  {bancoHoras ? (
                    <div className="bg-purple-700 bg-opacity-40 rounded-lg p-6">
                      <div className="mb-6 text-center">
                        <p className="text-sm text-purple-300 mb-1">Saldo Atual</p>
                        <p className={`text-4xl font-bold ${bancoHoras.saldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {bancoHoras.saldo.toFixed(1)}h
                        </p>
                        <p className="text-xs text-purple-300 mt-2">
                          Atualizado em: {bancoHoras.ultimaAtualizacao}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-purple-800 bg-opacity-50 rounded-lg p-4">
                          <h5 className="font-semibold mb-2">Horas Extras Totais</h5>
                          <p className="text-2xl">
                            {horasExtrasApproved.reduce((total, item) => total + item.hours, 0).toFixed(1)}h
                          </p>
                        </div>
                        <div className="bg-purple-800 bg-opacity-50 rounded-lg p-4">
                          <h5 className="font-semibold mb-2">Horas Utilizadas</h5>
                          <p className="text-2xl">
                            {folgasApproved
                              .filter(item => item.tipo === 'banco de horas')
                              .reduce((total, item) => total + (item.periodo === 'dia' ? 8 : 4), 0)}h
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-purple-300 py-4">Informações de banco de horas não disponíveis.</p>
                  )}
                </div>
              )}
              
              {/* Aba de Ausências */}
              {activeTab === 'ausencias' && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Ausências Registradas</h4>
                  {ausenciasApproved.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-purple-300 text-sm border-b border-purple-700">
                            <th className="px-4 py-2 text-left">Data</th>
                            <th className="px-4 py-2 text-left">Tipo</th>
                            <th className="px-4 py-2 text-left">Justificativa</th>
                            <th className="px-4 py-2 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ausenciasApproved.map((item) => (
                            <tr key={item.id} className="border-b border-purple-700 hover:bg-purple-700 hover:bg-opacity-30">
                              <td className="px-4 py-3">{item.date}</td>
                              <td className="px-4 py-3">{item.type}</td>
                              <td className="px-4 py-3">
                                <div className="truncate max-w-xs" title={item.justification}>
                                  {item.justification || '-'}
                                </div>
                              </td>
                              <td className="px-4 py-3">{renderStatus(item.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-purple-300 py-4">Nenhuma ausência registrada encontrada.</p>
                  )}
                </div>
              )}
              
              {/* Aba de Jornada */}
              {activeTab === 'jornada' && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Jornada de Trabalho</h4>
                  {jornada ? (
                    <div className="bg-purple-700 bg-opacity-40 rounded-lg p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-semibold mb-3">Horário Regular</h5>
                          <table className="w-full">
                            <thead>
                              <tr className="text-purple-300 text-sm border-b border-purple-700">
                                <th className="px-4 py-2 text-left">Dia</th>
                                <th className="px-4 py-2 text-left">Entrada</th>
                                <th className="px-4 py-2 text-left">Saída</th>
                              </tr>
                            </thead>
                            <tbody>
                              {jornada.horarios.map((horario, index) => (
                                <tr key={index} className="border-b border-purple-700">
                                  <td className="px-4 py-3">{horario.dia}</td>
                                  <td className="px-4 py-3">{horario.entrada}</td>
                                  <td className="px-4 py-3">{horario.saida}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div>
                          <h5 className="font-semibold mb-3">Informações Adicionais</h5>
                          <div className="bg-purple-800 bg-opacity-50 rounded-lg p-4 mb-4">
                            <p className="text-sm text-purple-300 mb-1">Carga Horária Semanal</p>
                            <p className="text-2xl">{jornada.cargaHorariaSemanal}h</p>
                          </div>
                          <div className="bg-purple-800 bg-opacity-50 rounded-lg p-4">
                            <p className="text-sm text-purple-300 mb-1">Intervalo</p>
                            <p className="text-xl">{jornada.intervalo} minutos</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-purple-300 py-4">Informações de jornada não disponíveis.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ApprovedDataComponent;