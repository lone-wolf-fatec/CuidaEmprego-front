import React, { useState, useEffect } from 'react';
import SaldoFolgasModal from './SaldoFolgasModal'; // Importando o modal de saldos


const FolgaTab = () => {
  // Estado para os registros de folgas
  const [modalSaldoAberto, setModalSaldoAberto] = useState(false);

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
  
  // NOVO: Estado para o modal de saldo de folgas
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);
  
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
        diasCompensacao: user.diasCompensacao || 0,
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
              diasCompensacao: user.diasCompensacao || 0,
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
              diasCompensacao: func.diasCompensacao !== undefined ? func.diasCompensacao : existingFunc.diasCompensacao,
              diasFeriasDisponiveis: func.diasFeriasDisponiveis !== undefined ? func.diasFeriasDisponiveis : existingFunc.diasFeriasDisponiveis
            });
          } else {
            // Garantir valores padrão para propriedades ausentes
            funcionariosMap.set(func.id, {
              id: func.id,
              nome: func.nome,
              bancoHoras: func.bancoHoras !== undefined ? func.bancoHoras : 0,
              abonos: func.abonos !== undefined ? func.abonos : 0,
              diasCompensacao: func.diasCompensacao !== undefined ? func.diasCompensacao : 0,
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
  
  // Obter dados diretamente do localStorage e sincronizar com o estado
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
  
  // Adicionar evento de armazenamento para sincronização entre abas
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

  // NOVO: Função para abrir o modal de saldo de folgas
  const abrirModalSaldo = (funcionario) => {
    setFuncionarioSelecionado(funcionario);
  };
  
  // NOVO: Função para atualizar saldos após edição
  const atualizarSaldosFuncionario = (novosSaldos) => {
    // Atualizar a lista de funcionários após a edição
    const allPossible = getAllPossibleFuncionarios();
    setAllFuncionarios(allPossible);
  };
  
  // Selecionar funcionário para nova folga
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
  
  // NOVO: Função para atualizar saldos quando uma folga é aprovada
  const atualizarSaldosFolga = (funcionarioId, tipo, periodo) => {
    // Buscar funcionário
    const funcionarioIndex = allFuncionarios.findIndex(f => f.id === funcionarioId);
    if (funcionarioIndex === -1) return;
    
    const funcionario = allFuncionarios[funcionarioIndex];
    const novosFuncionarios = [...allFuncionarios];
    
    // Atualizar saldos com base no tipo de folga
    if (tipo === 'abono') {
      novosFuncionarios[funcionarioIndex] = {
        ...funcionario,
        abonos: Math.max(0, funcionario.abonos - 1)
      };
    } else if (tipo === 'banco de horas') {
      const horasUtilizadas = periodo === 'dia' ? 8 : 4;
      novosFuncionarios[funcionarioIndex] = {
        ...funcionario,
        bancoHoras: Math.max(0, funcionario.bancoHoras - horasUtilizadas)
      };
    } else if (tipo === 'compensação') {
      const diasUtilizados = periodo === 'dia' ? 1 : 0.5;
      novosFuncionarios[funcionarioIndex] = {
        ...funcionario,
        diasCompensacao: Math.max(0, funcionario.diasCompensacao - diasUtilizados)
      };
    }
    
    // Atualizar estado local
    setAllFuncionarios(novosFuncionarios);
    
    // Atualizar funcionários no localStorage
    atualizarFuncionariosLocalStorage(novosFuncionarios[funcionarioIndex]);
  };
  
  // NOVO: Função para atualizar funcionários no localStorage
  const atualizarFuncionariosLocalStorage = (funcionarioAtualizado) => {
    if (!funcionarioAtualizado || !funcionarioAtualizado.id) return;
    
    // Atualizar em registeredUsers
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const updatedUsers = registeredUsers.map(user => {
      if (user.id === funcionarioAtualizado.id) {
        return {
          ...user,
          abonos: funcionarioAtualizado.abonos,
          bancoHoras: funcionarioAtualizado.bancoHoras,
          diasCompensacao: funcionarioAtualizado.diasCompensacao
        };
      }
      return user;
    });
    localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));
    
    // Atualizar em funcionarios
    const funcionarios = JSON.parse(localStorage.getItem('funcionarios') || '[]');
    const funcionarioExistente = funcionarios.findIndex(f => f.id === funcionarioAtualizado.id);
    
    if (funcionarioExistente !== -1) {
      // Funcionário já existe
      funcionarios[funcionarioExistente] = {
        ...funcionarios[funcionarioExistente],
        abonos: funcionarioAtualizado.abonos,
        bancoHoras: funcionarioAtualizado.bancoHoras,
        diasCompensacao: funcionarioAtualizado.diasCompensacao
      };
    } else {
      // Funcionário não existe, adicioná-lo
      funcionarios.push({
        id: funcionarioAtualizado.id,
        nome: funcionarioAtualizado.nome,
        abonos: funcionarioAtualizado.abonos,
        bancoHoras: funcionarioAtualizado.bancoHoras,
        diasCompensacao: funcionarioAtualizado.diasCompensacao
      });
    }
    
    localStorage.setItem('funcionarios', JSON.stringify(funcionarios));
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
      alert('Funcionário não encontrado');
      return;
    }
    
    // Verificar saldo disponível com base no tipo de folga
    if (newFolga.tipo === 'abono' && (funcionario.abonos <= 0)) {
      alert('Funcionário não possui abonos disponíveis');
      return;
    } else if (newFolga.tipo === 'banco de horas') {
      const horasNecessarias = newFolga.periodo === 'dia' ? 8 : 4;
      if (funcionario.bancoHoras < horasNecessarias) {
        alert(`Funcionário não possui horas suficientes no banco (Necessário: ${horasNecessarias}h, Disponível: ${funcionario.bancoHoras}h)`);
        return;
      }
    } else if (newFolga.tipo === 'compensação' && (funcionario.diasCompensacao <= 0)) {
      alert('Funcionário não possui dias de compensação disponíveis');
      return;
    }
    
    // Criar nova folga
    const novaFolga = {
      id: Date.now(), // ID único baseado no timestamp
      funcionarioId: newFolga.funcionarioId,
      funcionarioNome: newFolga.funcionarioNome,
      data: dataFormatada,
      tipo: newFolga.tipo,
      periodo: newFolga.periodo,
      status: 'pendente',
      motivo: newFolga.motivo,
      dataSolicitacao: new Date().toISOString()
    };
    
    // Adicionar à lista
    setFolgaEntries([...folgaEntries, novaFolga]);
    
    // Limpar formulário
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
  
  // Função para renderizar tipo de folga
  const renderizarTipo = (tipo, periodo) => {
    // Verificar se tipo é undefined antes de chamar toUpperCase
    if (!tipo) return "Não especificado";
    
    // Formatar o tipo
    const tipoFormatado = tipo.charAt(0).toUpperCase() + tipo.slice(1);
    
    // Adicionar período se for diferente de dia inteiro
    if (periodo && periodo !== 'dia') {
      return `${tipoFormatado} (${periodo})`;
    }
    
    return tipoFormatado;
  };
  
  // Função para renderizar status
  const renderizarStatus = (status) => {
    if (!status) return "Não especificado";
    
    switch(status) {
      case 'aprovado':
        return (
          <span className="px-2 py-1 bg-green-600 text-white rounded-full text-xs font-semibold">
            Aprovado
          </span>
        );
      case 'pendente':
        return (
          <span className="px-2 py-1 bg-yellow-500 text-white rounded-full text-xs font-semibold">
            Pendente
          </span>
        );
      case 'rejeitado':
        return (
          <span className="px-2 py-1 bg-red-600 text-white rounded-full text-xs font-semibold">
            Rejeitado
          </span>
        );
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  // Funções para lidar com mudança de status
  const changeStatus = (id, novoStatus) => {
    if (novoStatus === 'rejeitado' && !observacaoRejeicao) {
      alert('Por favor, informe o motivo da rejeição');
      return;
    }
    
    const updatedFolgas = folgaEntries.map(folga => {
      if (folga.id === id) {
        const novaFolga = { ...folga, status: novoStatus };
        
        // Adicionar observação de rejeição se aplicável
        if (novoStatus === 'rejeitado') {
          novaFolga.observacao_rejeicao = observacaoRejeicao;
          // Fechar modal após rejeição
          setModalRejeitarAberto(false);
          setObservacaoRejeicao('');
        }
        
        // Se aprovado, atualizar saldos do funcionário
        if (novoStatus === 'aprovado') {
          atualizarSaldosFolga(folga.funcionarioId, folga.tipo, folga.periodo);
        }
        
        return novaFolga;
      }
      return folga;
    });
    
    setFolgaEntries(updatedFolgas);
    
    // Notificar usuário da mudança
    if (novoStatus === 'aprovado') {
      alert(`Folga aprovada com sucesso!`);
    } else if (novoStatus === 'rejeitado') {
      alert(`Folga rejeitada com sucesso!`);
    }
  };
  
  // Função para abrir modal de rejeição
  const abrirModalRejeitar = (folga) => {
    setSolicitacaoSelecionada(folga);
    setModalRejeitarAberto(true);
  };
  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* NOVO: Cabeçalho com título e botão de gerenciar saldos */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestão de Folgas</h1>
        
        {/* Botão para gerenciar saldos gerais */}
        <button
          onClick={() => setModalSaldoAberto(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md font-medium flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          Gerenciar Saldos de Folgas
        </button>
      </div>
      
      {/* Filtros */}
      <div className="mb-6 bg-purple-900 bg-opacity-40 p-4 rounded-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-purple-300 mb-1">Status</label>
            <select
              className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
              value={filtros.status}
              onChange={(e) => setFiltros({...filtros, status: e.target.value})}
            >
              <option value="">Todos</option>
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
              <option value="">Todos</option>
              {/* Criar lista única de nomes de funcionários */}
              {Array.from(new Set(folgaEntries.map(f => f.funcionarioNome)))
                .sort()
                .map((nome, index) => (
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
              <option value="">Todos</option>
              <option value="abono">Abono</option>
              <option value="banco de horas">Banco de Horas</option>
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
              <option value="">Todos</option>
              <option value="semana">Próxima Semana</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de folgas */}
      <div className="mb-6">
        <div className="bg-purple-900 bg-opacity-40 overflow-hidden rounded-lg">
          <table className="min-w-full table-auto">
            <thead className="border-b border-purple-700">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-medium text-purple-300">Funcionário</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-purple-300">Data</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-purple-300">Tipo</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-purple-300">Motivo</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-purple-300">Status</th>
                <th className="py-3 px-4 text-right text-sm font-medium text-purple-300">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-800">
              {folgasOrdenadas.map(folga => (
                <tr key={folga.id} className="hover:bg-purple-800 hover:bg-opacity-30 transition-colors">
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
                    {/* NOVO: Botão para editar saldos direto da tabela */}
                    <button
                      onClick={() => {
                        const funcionario = allFuncionarios.find(f => f.id === folga.funcionarioId);
                        if (funcionario) abrirModalSaldo(funcionario);
                      }}
                      className="ml-2 bg-purple-600 hover:bg-purple-700 text-white py-1 px-2 rounded text-xs"
                    >
                      Editar Saldos
                    </button>
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
                    {funcionario.nome} ({funcionario.bancoHoras}h banco / {funcionario.abonos} abonos / {funcionario.diasCompensacao} comp.)
                  </option>
                ))}
              </select>
              {/* NOVO: Botão para editar saldos do funcionário selecionado */}
              {newFolga.funcionarioId && (
                <button
                  type="button"
                  onClick={() => {
                    const func = allFuncionarios.find(f => f.id === parseInt(newFolga.funcionarioId));
                    if (func) abrirModalSaldo(func);
                  }}
                  className="mt-2 bg-purple-600 hover:bg-purple-700 text-white py-1 px-2 rounded text-xs"
                >
                  Editar Saldos de {newFolga.funcionarioNome}
                </button>
              )}
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

      {/* NOVO: Modal para listar e gerenciar todos os saldos de folgas */}
      {modalSaldoAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-purple-900 rounded-lg p-6 w-full max-w-4xl">
            <h3 className="text-xl font-semibold mb-4">Gerenciar Saldos de Folgas</h3>
            
            <div className="overflow-auto max-h-96">
              <table className="min-w-full divide-y divide-purple-700">
                <thead className="bg-purple-800">
                  <tr>
                    <th className="px-4 py-3 text-left">Funcionário</th>
                    <th className="px-4 py-3 text-left">Abonos</th>
                    <th className="px-4 py-3 text-left">Banco de Horas</th>
                    <th className="px-4 py-3 text-left">Dias Compensação</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {allFuncionarios.map(func => (
                    <tr key={func.id} className="border-b border-purple-700 hover:bg-purple-700 hover:bg-opacity-30">
                      <td className="px-4 py-3">{func.nome}</td>
                      <td className="px-4 py-3">{func.abonos || 0}</td>
                      <td className="px-4 py-3">{func.bancoHoras || 0}h</td>
                      <td className="px-4 py-3">{func.diasCompensacao || 0}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => abrirModalSaldo(func)}
                          className="bg-purple-600 hover:bg-purple-700 text-white py-1 px-3 rounded text-sm"
                        >
                          Editar Saldos
                        </button>
                      </td>
                    </tr>
                  ))}
                  {allFuncionarios.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-gray-400">
                        Nenhum funcionário encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setModalSaldoAberto(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
  
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
      
      {/* Área de Debug */}
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
      
      {/* Importar o componente SaldoFolgasModal */}
      <SaldoFolgasModal
        isOpen={funcionarioSelecionado !== null}
        onClose={() => setFuncionarioSelecionado(null)}
        funcionarioId={funcionarioSelecionado?.id}
        funcionarioNome={funcionarioSelecionado?.nome}
        onSave={atualizarSaldosFuncionario}
      />
    </div>
  );
};

export default FolgaTab;