import React, { useState, useEffect } from 'react';

const FolgaTab = () => {
  // Estado para os registros de folgas
  const [folgaEntries, setFolgaEntries] = useState(() => {
    const storedFolgas = localStorage.getItem('folgaEntries');
    return storedFolgas ? JSON.parse(storedFolgas) : [
      { 
        id: 1,
        funcionarioId: 101,
        funcionarioNome: 'João Silva',
        data: '22/03/2025', 
        tipo: 'compensação',
        periodo: 'dia',
        status: 'aprovado', 
        motivo: 'Compensação por hora extra' 
      },
      { 
        id: 2,
        funcionarioId: 102,
        funcionarioNome: 'Maria Oliveira',
        data: '25/03/2025', 
        tipo: 'abono',
        periodo: 'dia',
        status: 'pendente', 
        motivo: 'Consulta médica' 
      },
      {
        id: 3,
        funcionarioId: 103,
        funcionarioNome: 'Carlos Pereira',
        data: '28/03/2025',
        tipo: 'banco de horas',
        periodo: 'tarde',
        status: 'rejeitado',
        motivo: 'Assuntos pessoais',
        observacao_rejeicao: 'Período com reunião importante agendada'
      }
    ];
  });
  
  // Estados para nova folga
  const [newFolga, setNewFolga] = useState({
    funcionarioId: '',
    funcionarioNome: '',
    data: '',
    tipo: 'abono',
    periodo: 'dia',
    motivo: ''
  });
  
  // Estado para armazenar funcionários do localStorage
  const [localFuncionarios, setLocalFuncionarios] = useState([]);
  
  // Estado para armazenar todos os funcionários possíveis consolidados
  const [allFuncionarios, setAllFuncionarios] = useState([]);
  
  // Estado para modal de rejeição
  const [modalRejeitarAberto, setModalRejeitarAberto] = useState(false);
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState(null);
  const [observacaoRejeicao, setObservacaoRejeicao] = useState('');
  
  // Estado para filtros
  const [filtros, setFiltros] = useState({
    status: '',
    funcionario: '',
    tipo: '',
    periodo: ''
  });
  
  // Função para obter todos os funcionários possíveis de todas as fontes
  const getAllPossibleFuncionarios = () => {
    try {
      // 1. Obter do registeredUsers
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const funcionariosFromUsers = registeredUsers.map(user => ({
        id: user.id,
        nome: user.name || user.nome,
        bancoHoras: user.bancoHoras || 0,
        abonos: user.abonos || 0,
        diasFeriasDisponiveis: user.diasFeriasDisponiveis || 30
      }));
      
      // 2. Obter do localStorage "funcionarios"
      const storedFuncionarios = JSON.parse(localStorage.getItem('funcionarios') || '[]');
      
      // 3. Obter do localFuncionarios
      const localFuncs = localFuncionarios || [];
      
      // 4. Obter funcionários únicos de folgaEntries
      const folgaFuncionarios = folgaEntries.map(folga => ({
        id: folga.funcionarioId,
        nome: folga.funcionarioNome
      }));
      
      // 5. Buscar usuário atual do localStorage (se existir)
      let currentUser = null;
      try {
        const userJson = localStorage.getItem('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          if (user && user.id) {
            currentUser = {
              id: user.id,
              nome: user.name || user.displayName || user.nome,
              bancoHoras: user.bancoHoras || 0,
              abonos: user.abonos || 0,
              diasFeriasDisponiveis: user.diasFeriasDisponiveis || 30
            };
          }
        }
      } catch (error) {
        console.error('Erro ao obter usuário atual:', error);
      }
      
      // 6. Buscar dados de ajustes de ponto para extrair funcionários
      const ajustesData = JSON.parse(localStorage.getItem('ajustePontoSolicitacoes') || '[]');
      const ajustesFuncionarios = ajustesData.map(ajuste => ({
        id: ajuste.funcionarioId,
        nome: ajuste.funcionarioNome
      }));
      
      // 7. Criar um mapa para eliminar duplicatas por ID
      const funcionariosMap = new Map();
      
      // Adicionar de todas as fontes
      [
        ...funcionariosFromUsers, 
        ...storedFuncionarios, 
        ...localFuncs,
        ...folgaFuncionarios,
        ...ajustesFuncionarios,
        ...(currentUser ? [currentUser] : [])
      ].forEach(func => {
        if (func && func.id) {
          // Se o funcionário já existe no mapa, manter valores não-nulos
          if (funcionariosMap.has(func.id)) {
            const existingFunc = funcionariosMap.get(func.id);
            funcionariosMap.set(func.id, {
              id: func.id,
              nome: func.nome || existingFunc.nome,
              bancoHoras: func.bancoHoras !== undefined ? func.bancoHoras : existingFunc.bancoHoras,
              abonos: func.abonos !== undefined ? func.abonos : existingFunc.abonos,
              diasFeriasDisponiveis: func.diasFeriasDisponiveis !== undefined ? func.diasFeriasDisponiveis : existingFunc.diasFeriasDisponiveis
            });
          } else {
            // Garantir valores padrão para propriedades ausentes
            funcionariosMap.set(func.id, {
              id: func.id,
              nome: func.nome,
              bancoHoras: func.bancoHoras !== undefined ? func.bancoHoras : 0,
              abonos: func.abonos !== undefined ? func.abonos : 0,
              diasFeriasDisponiveis: func.diasFeriasDisponiveis !== undefined ? func.diasFeriasDisponiveis : 30
            });
          }
        }
      });
      
      // Converter de volta para array
      return Array.from(funcionariosMap.values());
    } catch (error) {
      console.error('Erro ao obter funcionários de todas as fontes:', error);
      return [];
    }
  };
  
  // useEffect para manter a lista atualizada
  useEffect(() => {
    const updateAllFuncionarios = () => {
      const allPossible = getAllPossibleFuncionarios();
      setAllFuncionarios(allPossible);
      console.log('Lista completa de funcionários atualizada:', allPossible);
    };
    
    // Atualizar logo no início
    updateAllFuncionarios();
    
    // E a cada 2 segundos
    const interval = setInterval(updateAllFuncionarios, 2000);
    
    return () => clearInterval(interval);
  }, [localFuncionarios, folgaEntries]);
  
  // SOLUÇÃO 3: Obter dados diretamente do localStorage e sincronizar com o estado
  useEffect(() => {
    const getFuncionariosFromLocalStorage = () => {
      try {
        const stored = localStorage.getItem('funcionarios');
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error("Erro ao ler funcionários do localStorage:", error);
        return [];
      }
    };
    
    setLocalFuncionarios(getFuncionariosFromLocalStorage());
    
    // Atualizar a cada 5 segundos
    const interval = setInterval(() => {
      setLocalFuncionarios(getFuncionariosFromLocalStorage());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // SOLUÇÃO 4: Adicionar evento de armazenamento para sincronização entre abas
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'funcionarios') {
        setLocalFuncionarios(JSON.parse(e.newValue || '[]'));
      }
      
      // Verificar também outras mudanças relevantes
      if (['registeredUsers', 'user', 'ajustePontoSolicitacoes'].includes(e.key)) {
        const allPossible = getAllPossibleFuncionarios();
        setAllFuncionarios(allPossible);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Verificar notificações de admin
  useEffect(() => {
    const checkAdminNotifications = () => {
      const adminNotifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
      const unreadNotifications = adminNotifications.filter(n => !n.read && n.type === 'novoFuncionario');
      
      if (unreadNotifications.length > 0) {
        console.log("FolgaTab - Notificações não lidas de novos funcionários:", unreadNotifications);
        // Marcar como lidas
        const updatedNotifications = adminNotifications.map(n => {
          if (n.type === 'novoFuncionario' && !n.read) {
            return { ...n, read: true };
          }
          return n;
        });
        
        localStorage.setItem('adminNotifications', JSON.stringify(updatedNotifications));
      }
    };
    
    // Verificar notificações ao montar e a cada 10 segundos
    checkAdminNotifications();
    const notifInterval = setInterval(checkAdminNotifications, 10000);
    
    return () => clearInterval(notifInterval);
  }, []);
  
  // Salvar folgas no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('folgaEntries', JSON.stringify(folgaEntries));
  }, [folgaEntries]);
  
  // Filtrar folgas
  const folgasFiltradas = folgaEntries.filter(folga => {
    const matchStatus = filtros.status === '' || folga.status === filtros.status;
    const matchFuncionario = filtros.funcionario === '' || folga.funcionarioNome === filtros.funcionario;
    const matchTipo = filtros.tipo === '' || folga.tipo === filtros.tipo;
    
    // Implementação básica do filtro de período
    let matchPeriodo = true;
    if (filtros.periodo === 'semana') {
      const hoje = new Date();
      const dataLimite = new Date();
      dataLimite.setDate(hoje.getDate() + 7);
      
      const partesData = folga.data.split('/');
      const dataFolga = new Date(
        parseInt(partesData[2]), 
        parseInt(partesData[1]) - 1, 
        parseInt(partesData[0])
      );
      
      matchPeriodo = dataFolga <= dataLimite && dataFolga >= hoje;
    }
    
    return matchStatus && matchFuncionario && matchTipo && matchPeriodo;
  });
  
  // Ordenar por data (mais próximas primeiro)
  const folgasOrdenadas = [...folgasFiltradas].sort((a, b) => {
    // Converter datas do formato DD/MM/YYYY para objetos Date para comparação
    const [diaA, mesA, anoA] = a.data.split('/').map(Number);
    const [diaB, mesB, anoB] = b.data.split('/').map(Number);
    
    const dateA = new Date(anoA, mesA - 1, diaA);
    const dateB = new Date(anoB, mesB - 1, diaB);
    
    return dateA - dateB; // Ordem crescente (mais próxima primeiro)
  });
  
  // Selecionar funcionário para nova folga - FUNÇÃO CORRIGIDA
  const handleSelecionarFuncionario = (e) => {
    const funcionarioId = parseInt(e.target.value);
    if (funcionarioId) {
      // Procurar em allFuncionarios em vez da lista original
      const funcionarioSelecionado = allFuncionarios.find(f => f.id === funcionarioId);
      if (funcionarioSelecionado) {
        console.log("Funcionário selecionado:", funcionarioSelecionado);
        setNewFolga({
          ...newFolga,
          funcionarioId: funcionarioId,
          funcionarioNome: funcionarioSelecionado.nome
        });
      } else {
        console.warn("Funcionário não encontrado para ID:", funcionarioId);
      }
    } else {
      setNewFolga({
        ...newFolga,
        funcionarioId: '',
        funcionarioNome: ''
      });
    }
  };
  
  // Formatar data para DD/MM/YYYY
  const formatarData = (data) => {
    if (!data || data.includes('/')) return data;
    
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };
  
  // Adicionar nova folga
  const handleAddFolga = (e) => {
    e.preventDefault();
    
    if (!newFolga.funcionarioId || !newFolga.data || !newFolga.motivo) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }
    
    // Verificar se já existe uma folga para esta data
    const dataFormatada = newFolga.data.includes('-') ? formatarData(newFolga.data) : newFolga.data;
    
    const folgaExistente = folgaEntries.find(
      f => f.funcionarioId === newFolga.funcionarioId && 
           f.data === dataFormatada && 
           (f.status === 'aprovado' || f.status === 'pendente')
    );
    
    if (folgaExistente) {
      alert('Este funcionário já possui uma folga registrada para esta data');
      return;
    }
    
    // Verificar disponibilidade conforme o tipo de folga
    const funcionario = allFuncionarios.find(f => f.id === newFolga.funcionarioId);
    
    if (!funcionario) {
      alert('Funcionário não encontrado na base de dados');
      return;
    }
    
    if (newFolga.tipo === 'abono' && funcionario.abonos <= 0) {
      alert('Este funcionário não possui abonos disponíveis');
      return;
    }
    
    if (newFolga.tipo === 'banco de horas') {
      const horasNecessarias = newFolga.periodo === 'dia' ? 8 : 4;
      if (funcionario.bancoHoras < horasNecessarias) {
        alert(`Este funcionário não possui horas suficientes no banco de horas (${funcionario.bancoHoras}h disponíveis, ${horasNecessarias}h necessárias)`);
        return;
      }
    }
    
    const folga = {
      id: Date.now(),
      funcionarioId: newFolga.funcionarioId,
      funcionarioNome: newFolga.funcionarioNome,
      data: dataFormatada,
      tipo: newFolga.tipo,
      periodo: newFolga.periodo,
      motivo: newFolga.motivo,
      status: 'pendente' // Por padrão, a folga fica pendente de aprovação
    };
    
    setFolgaEntries([...folgaEntries, folga]);
    
    // Atualizar banco de horas ou abonos caso seja aprovado diretamente
    if (folga.status === 'aprovado') {
      atualizarRecursosAposAprovacao(folga);
    }
    
    // Notificar funcionário sobre a solicitação
    const notificacoes = JSON.parse(localStorage.getItem('userNotifications') || '[]');
    notificacoes.push({
      id: Date.now(),
      userId: folga.funcionarioId,
      message: `Sua solicitação de folga para ${folga.data} (${folga.periodo}) foi registrada e está aguardando aprovação.`,
      date: new Date().toLocaleDateString('pt-BR'),
      read: false
    });
    localStorage.setItem('userNotifications', JSON.stringify(notificacoes));
    
    // Resetar formulário
    setNewFolga({
      funcionarioId: '',
      funcionarioNome: '',
      data: '',
      tipo: 'abono',
      periodo: 'dia',
      motivo: ''
    });
    
    alert('Solicitação de folga registrada com sucesso!');
  };
  
  // Atualizar recursos do funcionário após aprovação
  const atualizarRecursosAposAprovacao = (folga) => {
    // Obter a lista mais atualizada de funcionários antes de fazer alterações
    const latestFuncionarios = getAllPossibleFuncionarios();
    
    // Apenas atualiza se for abono ou banco de horas
    if (folga.tipo === 'abono' || folga.tipo === 'banco de horas') {
      const updatedFuncionarios = latestFuncionarios.map(f => {
        if (f.id === folga.funcionarioId) {
          const newF = { ...f };
          
          if (folga.tipo === 'abono') {
            newF.abonos = Math.max(0, newF.abonos - 1);
          } else if (folga.tipo === 'banco de horas') {
            const horasUsadas = folga.periodo === 'dia' ? 8 : 4;
            newF.bancoHoras = Math.max(0, newF.bancoHoras - horasUsadas);
          }
          
          return newF;
        }
        return f;
      });
      
      // Atualizar apenas no localStorage, o estado será atualizado pelo efeito
      localStorage.setItem('funcionarios', JSON.stringify(updatedFuncionarios));
    }
  };
  
  // Função para alterar status (aprovação/rejeição)
  const changeStatus = (id, newStatus) => {
    const entryIndex = folgaEntries.findIndex(entry => entry.id === id);
    if (entryIndex === -1) return;
    
    const updatedEntries = [...folgaEntries];
    const folga = { ...updatedEntries[entryIndex] };
    
    // Guardar status antigo para verificar mudanças
    const oldStatus = folga.status;
    
    // Atualizar status
    folga.status = newStatus;
    
    // Adicionar observação se for rejeição
    if (newStatus === 'rejeitado' && observacaoRejeicao) {
      folga.observacao_rejeicao = observacaoRejeicao;
    }
    
    updatedEntries[entryIndex] = folga;
    setFolgaEntries(updatedEntries);
    
    // Atualizar recursos do funcionário se for aprovação
    if (newStatus === 'aprovado' && oldStatus !== 'aprovado') {
      atualizarRecursosAposAprovacao(folga);
    }
    
    // Notificar funcionário sobre mudança de status
    const notificacoes = JSON.parse(localStorage.getItem('userNotifications') || '[]');
    notificacoes.push({
      id: Date.now(),
      userId: folga.funcionarioId,
      message: `Sua solicitação de folga para ${folga.data} foi ${newStatus === 'aprovado' ? 'aprovada' : 'rejeitada'}.`,
      date: new Date().toLocaleDateString('pt-BR'),
      read: false
    });
    localStorage.setItem('userNotifications', JSON.stringify(notificacoes));
    
    if (newStatus === 'rejeitado') {
      setModalRejeitarAberto(false);
      setSolicitacaoSelecionada(null);
      setObservacaoRejeicao('');
    }
  };
  
  // Função para abrir modal de rejeição
  const abrirModalRejeitar = (folga) => {
    setSolicitacaoSelecionada(folga);
    setObservacaoRejeicao('');
    setModalRejeitarAberto(true);
  };
  
  // Renderizar cor do status
  const renderizarStatus = (status) => {
    let corClasse = '';
    let texto = status.toUpperCase();
    
    switch(status) {
      case 'aprovado':
        corClasse = 'bg-green-600';
        break;
      case 'pendente':
        corClasse = 'bg-yellow-600';
        break;
      case 'rejeitado':
        corClasse = 'bg-red-600';
        break;
      default:
        corClasse = 'bg-gray-600';
    }
    
    return (
      <span className={`inline-block px-2 py-1 rounded-full text-xs text-white ${corClasse}`}>
        {texto}
      </span>
    );
  };
  
 // Renderizar tipo de folga
const renderizarTipo = (tipo, periodo) => {
  if (!tipo || !periodo) {
    return null; // Se tipo ou período forem indefinidos, retorna null para evitar erro
  }
  
  let label = '';
  let corClasse = '';
  
  switch(tipo) {
    case 'abono':
      label = 'ABONO';
      corClasse = 'bg-blue-600';
      break;
    case 'banco de horas':
      label = 'BANCO DE HORAS';
      corClasse = 'bg-purple-600';
      break;
    case 'compensação':
      label = 'COMPENSAÇÃO';
      corClasse = 'bg-indigo-600';
      break;
    default:
      label = tipo.toUpperCase(); // Assume que 'tipo' não será undefined aqui
      corClasse = 'bg-gray-600';
  }

  return (
    <div className="flex flex-col">
      <span className={`inline-block px-2 py-1 rounded-full text-xs text-white ${corClasse}`}>
        {label}
      </span>
      <span className="text-xs mt-1 text-gray-300">
        {periodo === 'dia' ? 'Dia inteiro' : periodo === 'manhã' ? 'Manhã' : 'Tarde'}
      </span>
    </div>
  );
};

  
  // Calcular estatísticas de folgas
  const calcularEstatisticas = () => {
    const hoje = new Date();
    const folgasMes = folgaEntries.filter(folga => {
      const [dia, mes, ano] = folga.data.split('/').map(Number);
      const dataFolga = new Date(ano, mes - 1, dia);
      return dataFolga.getMonth() === hoje.getMonth() && dataFolga.getFullYear() === hoje.getFullYear();
    });
    
    return {
      totalMes: folgasMes.length,
      aprovadas: folgasMes.filter(f => f.status === 'aprovado').length,
      pendentes: folgasMes.filter(f => f.status === 'pendente').length,
      rejeitadas: folgasMes.filter(f => f.status === 'rejeitado').length
    };
  };
  
  const estatisticas = calcularEstatisticas();
  
  return (
    <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-lg shadow-lg p-6">
      <h1 className="text-2xl font-bold mb-6">Gerenciamento de Folgas</h1>
      
      {/* Botão para forçar atualização da lista */}
      <div className="mb-4">
        <button 
          onClick={() => {
            const latestFuncionarios = getAllPossibleFuncionarios();
            alert(`Lista atualizada! ${latestFuncionarios.length} funcionários encontrados.`);
          }}
          className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-md text-sm"
        >
          Atualizar Lista de Funcionários ({allFuncionarios.length})
        </button>
        <div className="text-xs text-purple-300 mt-1">
          Lista atualizada em: {new Date().toLocaleTimeString()}
        </div>
      </div>
      
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
            <label className="block text-sm text-purple-300 mb-1">Funcionário</label>
            <select 
              className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
              value={filtros.funcionario}
              onChange={(e) => setFiltros({...filtros, funcionario: e.target.value})}
            >
              <option value="">Todos os funcionários</option>
              {/* Usar consolidação de todos os nomes de funcionários */}
              {[...new Set([
                ...allFuncionarios.map(f => f.nome),
                ...folgaEntries.map(entry => entry.funcionarioNome)
              ])].filter(Boolean).sort().map((nome, index) => (
                <option key={index} value={nome}>{nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-purple-300 mb-1">Tipo</label>
            <select 
              className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
              value={filtros.tipo}
              onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
            >
              <option value="">Todos os tipos</option>
              <option value="abono">Abono</option>
              <option value="banco de horas">Banco de horas</option>
              <option value="compensação">Compensação</option>
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
              <option value="semana">Próxima semana</option>
              <option value="mes">Este mês</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Dashboard de folgas */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total do mês */}
        <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-lg shadow-lg p-4">
          <div className="flex items-center mb-2">
            <div className="bg-purple-600 p-2 rounded-full mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">Total do Mês</h2>
          </div>
          <p className="text-2xl font-bold">{estatisticas.totalMes}</p>
        </div>
        
        {/* Aprovadas */}
        <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-lg shadow-lg p-4">
          <div className="flex items-center mb-2">
            <div className="bg-green-600 p-2 rounded-full mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">Aprovadas</h2>
          </div>
        <p className="text-2xl font-bold">{estatisticas.aprovadas}</p>
        </div>
        
        {/* Pendentes */}
        <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-lg shadow-lg p-4">
          <div className="flex items-center mb-2">
            <div className="bg-yellow-600 p-2 rounded-full mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">Pendentes</h2>
          </div>
          <p className="text-2xl font-bold">{estatisticas.pendentes}</p>
        </div>
        
        {/* Rejeitadas */}
        <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-lg shadow-lg p-4">
          <div className="flex items-center mb-2">
            <div className="bg-red-600 p-2 rounded-full mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">Rejeitadas</h2>
          </div>
          <p className="text-2xl font-bold">{estatisticas.rejeitadas}</p>
        </div>
      </div>
      
      {/* Tabela de Folgas */}
      <div className="bg-purple-900 bg-opacity-40 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Solicitações de Folga</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-lg">
            <thead>
              <tr className="border-b border-purple-700">
                <th className="py-3 px-4 text-left">Funcionário</th>
                <th className="py-3 px-4 text-left">Data</th>
                <th className="py-3 px-4 text-left">Tipo</th>
                <th className="py-3 px-4 text-left">Motivo</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {folgasOrdenadas.map((folga) => (
                <tr key={folga.id} className="border-b border-purple-700 hover:bg-purple-700 hover:bg-opacity-50">
                  <td className="py-3 px-4">{folga.funcionarioNome}</td>
                  <td className="py-3 px-4">{folga.data}</td>
                  <td className="py-3 px-4">{renderizarTipo(folga.tipo, folga.periodo)}</td>
                  <td className="py-3 px-4">
                    <div className="max-w-xs">
                      <div className="truncate">{folga.motivo}</div>
                      {folga.observacao_rejeicao && (
                        <div className="text-xs mt-1 text-red-400 italic">
                          Motivo da rejeição: {folga.observacao_rejeicao}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">{renderizarStatus(folga.status)}</td>
                  <td className="py-3 px-4 text-right">
                    {folga.status === 'pendente' && (
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => changeStatus(folga.id, 'aprovado')}
                          className="bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded text-xs"
                        >
                          Aprovar
                        </button>
                        <button 
                          onClick={() => abrirModalRejeitar(folga)}
                          className="bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded text-xs"
                        >
                          Rejeitar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {folgasOrdenadas.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-6 px-4 text-center text-gray-400">
                    Nenhuma folga encontrada com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Formulário para adicionar nova folga */}
      <div className="bg-purple-900 bg-opacity-40 rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Registrar Nova Folga</h2>
        <form onSubmit={handleAddFolga}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-purple-300 mb-1">
                Funcionário* ({allFuncionarios.length} disponíveis)
              </label>
              <select 
                className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
                value={newFolga.funcionarioId}
                onChange={handleSelecionarFuncionario}
                required
              >
                <option value="">Selecione um funcionário</option>
                {allFuncionarios.map(funcionario => (
                  <option key={funcionario.id} value={funcionario.id}>
                    {funcionario.nome} ({funcionario.bancoHoras}h banco / {funcionario.abonos} abonos)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-purple-300 mb-1">Data*</label>
              <input 
                type="date" 
                className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
                value={newFolga.data}
                onChange={(e) => setNewFolga({...newFolga, data: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-purple-300 mb-1">Tipo*</label>
              <select 
                className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
                value={newFolga.tipo}
                onChange={(e) => setNewFolga({...newFolga, tipo: e.target.value})}
                required
              >
                <option value="abono">Abono</option>
                <option value="banco de horas">Banco de Horas</option>
                <option value="compensação">Compensação</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-purple-300 mb-1">Período*</label>
              <select 
                className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
                value={newFolga.periodo}
                onChange={(e) => setNewFolga({...newFolga, periodo: e.target.value})}
                required
              >
                <option value="dia">Dia inteiro</option>
                <option value="manhã">Manhã</option>
                <option value="tarde">Tarde</option>
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm text-purple-300 mb-1">Motivo*</label>
            <textarea 
              className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
              rows="3"
              value={newFolga.motivo}
              onChange={(e) => setNewFolga({...newFolga, motivo: e.target.value})}
              placeholder="Informe o motivo da folga"
              required
            ></textarea>
          </div>
          
          <div className="flex justify-end">
            <button 
              type="submit" 
              className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md font-medium"
            >
              Registrar Folga
            </button>
          </div>
        </form>
      </div>
      
      {/* Modal de Rejeição */}
      {modalRejeitarAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-purple-900 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Rejeitar Solicitação</h3>
            <p className="mb-4">
              Você está rejeitando a folga de <strong>{solicitacaoSelecionada?.funcionarioNome}</strong> para o dia <strong>{solicitacaoSelecionada?.data}</strong>.
            </p>
            <div className="mb-4">
              <label className="block text-sm text-purple-300 mb-1">Motivo da Rejeição*</label>
              <textarea 
                className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
                rows="3"
                value={observacaoRejeicao}
                onChange={(e) => setObservacaoRejeicao(e.target.value)}
                placeholder="Informe o motivo da rejeição"
                required
              ></textarea>
            </div>
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setModalRejeitarAberto(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={() => changeStatus(solicitacaoSelecionada?.id, 'rejeitado')}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-medium"
                disabled={!observacaoRejeicao}
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Debug: Visualizar dados de funcionários */}
      <div className="mt-6 bg-purple-900 bg-opacity-40 p-4 rounded-lg">
        <details>
          <summary className="cursor-pointer text-purple-300 hover:text-white">Dados de Funcionários para Debug</summary>
          <div className="mt-2 overflow-auto max-h-64 text-xs">
            <h4 className="font-bold text-purple-300">Funcionários Consolidados ({allFuncionarios.length}):</h4>
            <pre className="bg-purple-950 p-2 rounded">
              {JSON.stringify(allFuncionarios, null, 2)}
            </pre>
            
            <h4 className="font-bold text-purple-300 mt-2">Funcionários do localStorage ({localFuncionarios.length}):</h4>
            <pre className="bg-purple-950 p-2 rounded">
              {JSON.stringify(localFuncionarios, null, 2)}
            </pre>
            
            <h4 className="font-bold text-purple-300 mt-2">Registros de Usuários:</h4>
            <pre className="bg-purple-950 p-2 rounded">
              {JSON.stringify(JSON.parse(localStorage.getItem('registeredUsers') || '[]'), null, 2)}
            </pre>
            
            <h4 className="font-bold text-purple-300 mt-2">Funcionários de Ajustes de Ponto:</h4>
            <pre className="bg-purple-950 p-2 rounded">
              {JSON.stringify(
                (JSON.parse(localStorage.getItem('ajustePontoSolicitacoes') || '[]'))
                  .map(a => ({id: a.funcionarioId, nome: a.funcionarioNome}))
                  .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i),
                null, 2
              )}
            </pre>
            
            <h4 className="font-bold text-purple-300 mt-2">Usuário Atual:</h4>
            <pre className="bg-purple-950 p-2 rounded">
              {JSON.stringify(JSON.parse(localStorage.getItem('user') || '{}'), null, 2)}
            </pre>
          </div>
        </details>
      </div>
    </div>
  );
};

export default FolgaTab;