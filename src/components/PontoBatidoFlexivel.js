import React, { useState, useEffect, useRef } from 'react';

// Constantes para status
const STATUS_APROVADO = 'aprovado';
const STATUS_REJEITADO = 'rejeitado';
const STATUS_PENDENTE = 'pendente';
const STATUS_AJUSTADO = 'ajustado';
const FUNCIONARIOS_KEY = 'funcionarios';

// Modelo de Trabalho
const MODELOS_TRABALHO = {
  PADRAO: {
    nome: 'Padrão (8h)',
    registros: [
      { tipo: 'entrada trabalho', label: 'Entrada Trabalho' },
      { tipo: 'saída almoço', label: 'Saída Almoço' },
      { tipo: 'entrada almoço', label: 'Retorno Almoço' },
      { tipo: 'saída trabalho', label: 'Saída Trabalho' }
    ]
  },
  MEIO_PERIODO: {
    nome: 'Meio Período (4h)',
    registros: [
      { tipo: 'entrada trabalho', label: 'Entrada' },
      { tipo: 'saída trabalho', label: 'Saída' }
    ]
  },
  PLANTAO_12H: {
    nome: 'Plantão (12h)',
    registros: [
      { tipo: 'entrada plantão', label: 'Entrada Plantão' },
      { tipo: 'pausa 1', label: 'Intervalo 1' },
      { tipo: 'retorno 1', label: 'Retorno 1' },
      { tipo: 'pausa 2', label: 'Intervalo 2' },
      { tipo: 'retorno 2', label: 'Retorno 2' },
      { tipo: 'saída plantão', label: 'Saída Plantão' }
    ]
  },
  HOME_OFFICE: {
    nome: 'Home Office',
    registros: [
      { tipo: 'início expediente', label: 'Início Expediente' },
      { tipo: 'pausa', label: 'Pausa' },
      { tipo: 'retorno', label: 'Retorno' },
      { tipo: 'fim expediente', label: 'Fim Expediente' }
    ]
  },
  PERSONALIZADO: {
    nome: 'Personalizado',
    registros: [] // Será definido pelo administrador
  }
};

// Tipos de justificativa
const TIPOS_JUSTIFICATIVA = [
  'Atestado médico',
  'Declaração de comparecimento',
  'Treinamento externo',
  'Trabalho externo',
  'Folga compensatória',
  'Feriado',
  'Outro'
];
const PontoBatidoFlexivel = () => {
  // Estados para dados principais
  const [pontoRegistros, setPontoRegistros] = useState(() => {
    const storedRegistros = localStorage.getItem('pontoRegistros');
    const registrosBase = storedRegistros ? JSON.parse(storedRegistros) : [];
    
    // Se não houver registros, criar exemplos para demonstração
    if (registrosBase.length === 0) {
      return [
        {
          id: 1,
          funcionarioId: 101,
          funcionarioNome: 'João Silva',
          data: '19/03/2025',
          modeloTrabalho: 'PADRAO',
          registros: MODELOS_TRABALHO.PADRAO.registros.map(r => ({
            tipo: r.tipo,
            label: r.label,
            hora: r.tipo === 'saída trabalho' ? '--:--' : getRandomHour(r.tipo),
            status: r.tipo === 'saída trabalho' ? STATUS_PENDENTE : 'regular',
            localizacao: 'Escritório Central'
          })),
          bancoHoras: 0, // em minutos
          observacoes: ''
        },
        {
          id: 2,
          funcionarioId: 102,
          funcionarioNome: 'Maria Oliveira',
          data: '19/03/2025',
          modeloTrabalho: 'HOME_OFFICE',
          registros: MODELOS_TRABALHO.HOME_OFFICE.registros.map(r => ({
            tipo: r.tipo,
            label: r.label,
            hora: getRandomHour(r.tipo),
            status: 'regular',
            localizacao: 'Home Office - Verificado',
          })),
          bancoHoras: 45, // 45 minutos positivos
          observacoes: 'Trabalho em projeto especial'
        },
        {
          id: 3,
          funcionarioId: 103,
          funcionarioNome: 'Carlos Pereira',
          data: '19/03/2025',
          modeloTrabalho: 'PLANTAO_12H',
          registros: MODELOS_TRABALHO.PLANTAO_12H.registros.map(r => ({
            tipo: r.tipo,
            label: r.label,
            hora: getRandomHour(r.tipo),
            status: r.tipo.includes('saída') ? 'hora extra' : 'regular',
            localizacao: 'Unidade Norte'
          })),
          bancoHoras: 120, // 2 horas positivas
          observacoes: 'Cobertura de plantão emergencial'
        },
        {
          id: 4,
          funcionarioId: 104,
          funcionarioNome: 'Ana Souza',
          data: '19/03/2025',
          modeloTrabalho: 'MEIO_PERIODO',
          registros: MODELOS_TRABALHO.MEIO_PERIODO.registros.map(r => ({
            tipo: r.tipo,
            label: r.label,
            hora: '--:--',
            status: STATUS_PENDENTE,
            localizacao: ''
          })),
          bancoHoras: 0,
          observacoes: ''
        }
      ];
    }
    
    // Restaurar status salvos em chaves individuais e converter registros antigos para novo formato
    return registrosBase.map(registro => {
      // Verificar se o registro já está no novo formato
      if (registro.modeloTrabalho) {
        const registrosAtualizados = registro.registros.map((r, indice) => {
          const statusKey = `pontoStatus_${registro.id}_${indice}`;
          const statusSalvo = localStorage.getItem(statusKey);
          
          if (statusSalvo) {
            return { ...r, status: statusSalvo };
          }
          
          return r;
        });
        
        return { ...registro, registros: registrosAtualizados };
      } else {
        // Converter registro antigo para novo formato
        const modeloTrabalhoDetectado = detectarModeloTrabalho(registro.registros);
        const novosRegistros = MODELOS_TRABALHO[modeloTrabalhoDetectado].registros.map((modelo, indice) => {
          const registroAntigo = registro.registros[indice] || {};
          const statusKey = `pontoStatus_${registro.id}_${indice}`;
          const statusSalvo = localStorage.getItem(statusKey);
          
          return {
            tipo: modelo.tipo,
            label: modelo.label,
            hora: registroAntigo.hora || '--:--',
            status: statusSalvo || registroAntigo.status || STATUS_PENDENTE,
            localizacao: registroAntigo.localizacao || 'Não registrado'
          };
        });
        
        return {
          ...registro,
          modeloTrabalho: modeloTrabalhoDetectado,
          registros: novosRegistros,
          bancoHoras: 0,
          observacoes: ''
        };
      }
    });
  });

  // Estados para filtros e UI
  const [filtros, setFiltros] = useState({
    data: '',
    funcionario: '',
    status: '',
    modeloTrabalho: ''
  });
  
  const [allFuncionarios, setAllFuncionarios] = useState([]);
  const [editandoRegistro, setEditandoRegistro] = useState(null);
  const [editandoObservacao, setEditandoObservacao] = useState(null);
  const horaInputRefs = useRef({});
  const observacaoInputRef = useRef(null);
  
  // Estados para modais e funcionalidades
  const [notificacaoPersonalizada, setNotificacaoPersonalizada] = useState('');
  const [mostrarNotificacaoModal, setMostrarNotificacaoModal] = useState(false);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);
  
  const [mostrarJustificativaModal, setMostrarJustificativaModal] = useState(false);
  const [justificativaData, setJustificativaData] = useState({
    tipo: TIPOS_JUSTIFICATIVA[0],
    detalhamento: '',
    temComprovante: false,
    registroId: null
  });
  
  const [exportandoPdf, setExportandoPdf] = useState(false);
  
  // Estados para funcionalidades avançadas
  const [modoVisualizacao, setModoVisualizacao] = useState('lista'); // 'lista' ou 'calendario' ou 'dashboard'
  const [mostrarConfigRegrasModal, setMostrarConfigRegrasModal] = useState(false);
  const [mostrarAdicionarRegistroModal, setMostrarAdicionarRegistroModal] = useState(false);
  const [novoRegistroData, setNovoRegistroData] = useState({
    funcionarioId: '',
    data: new Date().toLocaleDateString('pt-BR'),
    modeloTrabalho: 'PADRAO'
  });
  
  // Estado para configuração personalizada
  const [configPersonalizada, setConfigPersonalizada] = useState(() => {
    const config = localStorage.getItem('configPonto');
    return config ? JSON.parse(config) : {
      toleranciaAtraso: 15, // minutos
      limiteHoraExtra: 120, // minutos por dia
      enviarAlertaPendencia: true,
      permitirJustificativaPosterior: true,
      requerGeolocalizacao: false
    };
  });
  // Helper para criar horários aleatórios para demonstração
  function getRandomHour(tipo) {
    const baseHour = tipo.includes('entrada trabalho') ? 8 :
                     tipo.includes('saída almoço') ? 12 :
                     tipo.includes('entrada almoço') ? 13 :
                     tipo.includes('saída trabalho') ? 17 :
                     tipo.includes('entrada plantão') ? 7 :
                     tipo.includes('saída plantão') ? 19 :
                     tipo.includes('início') ? 9 :
                     tipo.includes('fim') ? 18 : 
                     tipo.includes('pausa') ? 15 :
                     tipo.includes('retorno') ? 16 : 10;
                     
    const randomMinute = Math.floor(Math.random() * 60);
    return `${baseHour}:${randomMinute.toString().padStart(2, '0')}`;
  }
  
  // Função para detectar modelo de trabalho baseado nos registros
  function detectarModeloTrabalho(registros) {
    if (!registros || registros.length === 0) return 'PADRAO';
    
    const tipos = registros.map(r => r.tipo);
    
    if (registros.length === 2 && 
        tipos.includes('entrada trabalho') && 
        tipos.includes('saída trabalho')) {
      return 'MEIO_PERIODO';
    } else if (registros.length >= 6 && 
               tipos.includes('entrada plantão') && 
               tipos.includes('saída plantão')) {
      return 'PLANTAO_12H';
    } else if (registros.length === 4 && 
               tipos.includes('início expediente') && 
               tipos.includes('fim expediente')) {
      return 'HOME_OFFICE';
    } else if (registros.length === 4 && 
               tipos.includes('entrada trabalho') && 
               tipos.includes('saída trabalho')) {
      return 'PADRAO';
    } else {
      return 'PERSONALIZADO';
    }
  }

  // Funções para gerenciar funcionários
  const getAllPossibleFuncionarios = () => {
    try {
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const funcionariosFromUsers = registeredUsers.map(user => ({
        id: user.id,
        nome: user.name || user.nome
      }));
      
      const storedFuncionarios = JSON.parse(localStorage.getItem(FUNCIONARIOS_KEY) || '[]');
      
      const funcionariosFromRegistros = pontoRegistros.map(registro => ({
        id: registro.funcionarioId,
        nome: registro.funcionarioNome
      }));

      const funcionariosMap = new Map();
      
      [...funcionariosFromUsers, ...storedFuncionarios, ...funcionariosFromRegistros]
        .forEach(func => {
          if (func && func.id) {
            funcionariosMap.set(func.id, func);
          }
        });

      return Array.from(funcionariosMap.values());
    } catch (error) {
      console.error('Erro ao obter funcionários de todas as fontes:', error);
      return [];
    }
  };

  // Função para calcular banco de horas
  const calcularBancoHoras = (registro) => {
    // Verificar se tem todos os registros necessários
    if (registro.registros.some(r => r.hora === '--:--')) {
      return { texto: 'Pendente', minutos: 0 };
    }
    
    try {
      const modelo = MODELOS_TRABALHO[registro.modeloTrabalho] || MODELOS_TRABALHO.PADRAO;
      
      // Definir expectativa de horas conforme modelo de trabalho
      let horasEsperadas = 0;
      switch (registro.modeloTrabalho) {
        case 'PADRAO':
          horasEsperadas = 8 * 60; // 8h em minutos
          break;
        case 'MEIO_PERIODO':
          horasEsperadas = 4 * 60; // 4h em minutos
          break;
        case 'PLANTAO_12H':
          horasEsperadas = 12 * 60; // 12h em minutos
          break;
        case 'HOME_OFFICE':
          horasEsperadas = 8 * 60; // 8h em minutos
          break;
        default:
          horasEsperadas = 8 * 60; // Padrão 8h
      }
      
      // Cálculo específico por modelo
      const converterParaMinutos = (hora) => {
        const [h, m] = hora.split(':').map(Number);
        return h * 60 + m;
      };
      
      let totalMinutosTrabalhados = 0;
      
      if (registro.modeloTrabalho === 'PADRAO') {
        // Modelo padrão: entrada trabalho, saída almoço, entrada almoço, saída trabalho
        const entrada1 = registro.registros.find(r => r.tipo === 'entrada trabalho')?.hora || '';
        const saida1 = registro.registros.find(r => r.tipo === 'saída almoço')?.hora || '';
        const entrada2 = registro.registros.find(r => r.tipo === 'entrada almoço')?.hora || '';
        const saida2 = registro.registros.find(r => r.tipo === 'saída trabalho')?.hora || '';
        
        const minEntrada1 = converterParaMinutos(entrada1);
        const minSaida1 = converterParaMinutos(saida1);
        const minEntrada2 = converterParaMinutos(entrada2);
        const minSaida2 = converterParaMinutos(saida2);
        
        // Calcular períodos trabalhados
        const periodo1 = minSaida1 - minEntrada1;
        const periodo2 = minSaida2 - minEntrada2;
        
        totalMinutosTrabalhados = periodo1 + periodo2;
      } else if (registro.modeloTrabalho === 'MEIO_PERIODO') {
        // Modelo meio período: entrada trabalho, saída trabalho
        const entrada = registro.registros.find(r => r.tipo === 'entrada trabalho')?.hora || '';
        const saida = registro.registros.find(r => r.tipo === 'saída trabalho')?.hora || '';
        
        const minEntrada = converterParaMinutos(entrada);
        const minSaida = converterParaMinutos(saida);
        
        totalMinutosTrabalhados = minSaida - minEntrada;
      } else if (registro.modeloTrabalho === 'PLANTAO_12H') {
        // Modelo plantão: considerar pausas
        const entrada = registro.registros.find(r => r.tipo === 'entrada plantão')?.hora || '';
        const saida = registro.registros.find(r => r.tipo === 'saída plantão')?.hora || '';
        
        let totalPausas = 0;
        const pausas = registro.registros.filter(r => r.tipo.includes('pausa'));
        const retornos = registro.registros.filter(r => r.tipo.includes('retorno'));
        
        for (let i = 0; i < Math.min(pausas.length, retornos.length); i++) {
          const pausa = pausas[i].hora;
          const retorno = retornos[i].hora;
          
          if (pausa && retorno) {
            totalPausas += converterParaMinutos(retorno) - converterParaMinutos(pausa);
          }
        }
        
        totalMinutosTrabalhados = converterParaMinutos(saida) - converterParaMinutos(entrada) - totalPausas;
      } else if (registro.modeloTrabalho === 'HOME_OFFICE') {
        // Modelo home office: similar ao padrão mas com nomenclatura diferente
        const entrada = registro.registros.find(r => r.tipo === 'início expediente')?.hora || '';
        const saida = registro.registros.find(r => r.tipo === 'fim expediente')?.hora || '';
        const pausa = registro.registros.find(r => r.tipo === 'pausa')?.hora || '';
        const retorno = registro.registros.find(r => r.tipo === 'retorno')?.hora || '';
        
        const temPausa = pausa && pausa !== '--:--' && retorno && retorno !== '--:--';
        
        if (temPausa) {
          const periodo1 = converterParaMinutos(pausa) - converterParaMinutos(entrada);
          const periodo2 = converterParaMinutos(saida) - converterParaMinutos(retorno);
          totalMinutosTrabalhados = periodo1 + periodo2;
        } else {
          totalMinutosTrabalhados = converterParaMinutos(saida) - converterParaMinutos(entrada);
        }
      }
      
      // Calcular saldo (positivo ou negativo)
      const saldoMinutos = totalMinutosTrabalhados - horasEsperadas;
      
      // Formatar o resultado
      const saldoHoras = Math.floor(Math.abs(saldoMinutos) / 60);
      const saldoMinutosRestantes = Math.abs(saldoMinutos) % 60;
      const sinalSaldo = saldoMinutos >= 0 ? '+' : '-';
      
      return {
        texto: `${sinalSaldo}${saldoHoras}h${saldoMinutosRestantes.toString().padStart(2, '0')}m`,
        minutos: saldoMinutos
      };
    } catch (error) {
      console.error('Erro ao calcular banco de horas:', error);
      return { texto: 'Erro', minutos: 0 };
    }
  };

  // Função para calcular horas trabalhadas
  const calcularHorasTrabalhadas = (registro) => {
    // Verificar se tem todos os registros necessários
    if (registro.registros.some(r => r.hora === '--:--')) {
      return 'Pendente';
    }
    
    try {
      const modelo = MODELOS_TRABALHO[registro.modeloTrabalho] || MODELOS_TRABALHO.PADRAO;
      
      // Função auxiliar para converter horas em minutos
      const converterParaMinutos = (hora) => {
        const [h, m] = hora.split(':').map(Number);
        return h * 60 + m;
      };
      
      let totalMinutosTrabalhados = 0;
      
      // Cálculo baseado no modelo de trabalho
      if (registro.modeloTrabalho === 'PADRAO') {
        const entrada1 = registro.registros.find(r => r.tipo === 'entrada trabalho')?.hora || '';
        const saida1 = registro.registros.find(r => r.tipo === 'saída almoço')?.hora || '';
        const entrada2 = registro.registros.find(r => r.tipo === 'entrada almoço')?.hora || '';
        const saida2 = registro.registros.find(r => r.tipo === 'saída trabalho')?.hora || '';
        
        const periodo1 = converterParaMinutos(saida1) - converterParaMinutos(entrada1);
        const periodo2 = converterParaMinutos(saida2) - converterParaMinutos(entrada2);
        
        totalMinutosTrabalhados = periodo1 + periodo2;
      } else if (registro.modeloTrabalho === 'MEIO_PERIODO') {
        const entrada = registro.registros.find(r => r.tipo === 'entrada trabalho')?.hora || '';
        const saida = registro.registros.find(r => r.tipo === 'saída trabalho')?.hora || '';
        
        totalMinutosTrabalhados = converterParaMinutos(saida) - converterParaMinutos(entrada);
      } else if (registro.modeloTrabalho === 'PLANTAO_12H') {
        const entrada = registro.registros.find(r => r.tipo === 'entrada plantão')?.hora || '';
        const saida = registro.registros.find(r => r.tipo === 'saída plantão')?.hora || '';
        
        // Descontar pausas
        let totalPausas = 0;
        const pausas = registro.registros.filter(r => r.tipo.includes('pausa'));
        const retornos = registro.registros.filter(r => r.tipo.includes('retorno'));
        
        for (let i = 0; i < Math.min(pausas.length, retornos.length); i++) {
          const pausa = pausas[i].hora;
          const retorno = retornos[i].hora;
          
          if (pausa && retorno) {
            totalPausas += converterParaMinutos(retorno) - converterParaMinutos(pausa);
          }
        }
        
        totalMinutosTrabalhados = converterParaMinutos(saida) - converterParaMinutos(entrada) - totalPausas;
      } else if (registro.modeloTrabalho === 'HOME_OFFICE') {
        const entrada = registro.registros.find(r => r.tipo === 'início expediente')?.hora || '';
        const saida = registro.registros.find(r => r.tipo === 'fim expediente')?.hora || '';
        const pausa = registro.registros.find(r => r.tipo === 'pausa')?.hora || '';
        const retorno = registro.registros.find(r => r.tipo === 'retorno')?.hora || '';
        
        const temPausa = pausa && pausa !== '--:--' && retorno && retorno !== '--:--';
        
        if (temPausa) {
          const periodo1 = converterParaMinutos(pausa) - converterParaMinutos(entrada);
          const periodo2 = converterParaMinutos(saida) - converterParaMinutos(retorno);
          totalMinutosTrabalhados = periodo1 + periodo2;
        } else {
          totalMinutosTrabalhados = converterParaMinutos(saida) - converterParaMinutos(entrada);
        }
      }
      
      // Converter resultado de volta para horas:minutos
      const horas = Math.floor(totalMinutosTrabalhados / 60);
      const minutos = totalMinutosTrabalhados % 60;
      
      return `${horas}h${minutos.toString().padStart(2, '0')}m`;
    } catch (error) {
      console.error('Erro ao calcular horas trabalhadas:', error);
      return 'Erro';
    }
  };
  // Função para salvar status de ponto
  const salvarStatus = (registroId, indice, novoStatus, novaHora = null, novaLocalizacao = null) => {
    // Salvar na chave individualizada no localStorage
    const statusKey = `pontoStatus_${registroId}_${indice}`;
    localStorage.setItem(statusKey, novoStatus);
    
    // Atualizar o estado local
    const novosRegistros = pontoRegistros.map(registro => {
      if (registro.id === registroId) {
        const novosRegistrosInternos = registro.registros.map((r, idx) => {
          if (idx === indice) {
            return { 
              ...r, 
              status: novoStatus,
              hora: novaHora !== null ? novaHora : r.hora,
              localizacao: novaLocalizacao !== null ? novaLocalizacao : r.localizacao
            };
          }
          return r;
        });
        
        return { ...registro, registros: novosRegistrosInternos };
      }
      return registro;
    });
    
    // Atualizar o estado e o localStorage
    setPontoRegistros(novosRegistros);
    localStorage.setItem('pontoRegistros', JSON.stringify(novosRegistros));
    
    // Adicionar notificação para o funcionário
    const registro = pontoRegistros.find(r => r.id === registroId);
    if (registro) {
      const notificacoes = JSON.parse(localStorage.getItem('userNotifications') || '[]');
      notificacoes.push({
        id: Date.now(),
        userId: registro.funcionarioId,
        message: `Seu registro de ponto do dia ${registro.data} foi ${novoStatus} pelo administrador.`,
        date: new Date().toLocaleDateString('pt-BR'),
        read: false,
        urgente: true
      });
      localStorage.setItem('userNotifications', JSON.stringify(notificacoes));
      
      alert(`Ponto atualizado para ${registro.funcionarioNome} em ${registro.data}.`);
    }
  };

  // Função para salvar observações
  const salvarObservacao = (registroId, novaObservacao) => {
    const novosRegistros = pontoRegistros.map(registro => {
      if (registro.id === registroId) {
        return { ...registro, observacoes: novaObservacao };
      }
      return registro;
    });
    
    setPontoRegistros(novosRegistros);
    localStorage.setItem('pontoRegistros', JSON.stringify(novosRegistros));
    setEditandoObservacao(null);
  };

  // Funções para edição de registros
  const iniciarEdicaoPonto = (registroId, indiceRegistro) => {
    setEditandoRegistro({ registroId, indiceRegistro });
    setTimeout(() => {
      if (horaInputRefs.current[`${registroId}-${indiceRegistro}`]) {
        horaInputRefs.current[`${registroId}-${indiceRegistro}`].focus();
      }
    }, 100);
  };

  const iniciarEdicaoObservacao = (registroId) => {
    setEditandoObservacao(registroId);
    const registro = pontoRegistros.find(r => r.id === registroId);
    
    setTimeout(() => {
      if (observacaoInputRef.current) {
        observacaoInputRef.current.value = registro?.observacoes || '';
        observacaoInputRef.current.focus();
      }
    }, 100);
  };

  const salvarEdicaoPonto = (registroId, indiceRegistro, statusSelecionado = STATUS_AJUSTADO) => {
    const inputRef = horaInputRefs.current[`${registroId}-${indiceRegistro}`];
    if (inputRef && inputRef.value) {
      salvarStatus(registroId, indiceRegistro, statusSelecionado, inputRef.value);
    }
    setEditandoRegistro(null);
  };

  const cancelarEdicaoPonto = () => {
    setEditandoRegistro(null);
  };

  // Função para adicionar novo registro de ponto
  const adicionarNovoRegistro = () => {
    if (!novoRegistroData.funcionarioId) {
      alert('Selecione um funcionário.');
      return;
    }
    
    const funcionario = allFuncionarios.find(f => f.id.toString() === novoRegistroData.funcionarioId.toString());
    if (!funcionario) {
      alert('Funcionário não encontrado.');
      return;
    }
    
    // Criar ID para o novo registro
    const novoId = Math.max(...pontoRegistros.map(r => r.id), 0) + 1;
    
    // Criar registros com base no modelo selecionado
    const modeloSelecionado = MODELOS_TRABALHO[novoRegistroData.modeloTrabalho];
    const registros = modeloSelecionado.registros.map(r => ({
      tipo: r.tipo,
      label: r.label,
      hora: '--:--',
      status: STATUS_PENDENTE,
      localizacao: ''
    }));
    
    // Criar novo registro
    const novoRegistro = {
      id: novoId,
      funcionarioId: parseInt(novoRegistroData.funcionarioId),
      funcionarioNome: funcionario.nome,
      data: novoRegistroData.data,
      modeloTrabalho: novoRegistroData.modeloTrabalho,
      registros: registros,
      bancoHoras: 0,
      observacoes: ''
    };
    
    // Adicionar ao estado
    const novosRegistros = [...pontoRegistros, novoRegistro];
    setPontoRegistros(novosRegistros);
    localStorage.setItem('pontoRegistros', JSON.stringify(novosRegistros));
    
    // Resetar formulário
    setNovoRegistroData({
      funcionarioId: '',
      data: new Date().toLocaleDateString('pt-BR'),
      modeloTrabalho: 'PADRAO'
    });
    
    // Fechar modal
    setMostrarAdicionarRegistroModal(false);
    
    alert(`Novo registro de ponto criado para ${funcionario.nome} em ${novoRegistroData.data}.`);
  };

  // Função para salvar observação
  const salvarObservacaoEditar = () => {
    if (!editandoObservacao) return;
    
    const novaObservacao = observacaoInputRef.current?.value || '';
    salvarObservacao(editandoObservacao, novaObservacao);
  };
  // Função para notificar funcionário
  const notificarFuncionario = (registroId) => {
    const registro = pontoRegistros.find(r => r.id === registroId);
    if (!registro) return;
    
    // Identificar quais pontos estão pendentes
    const pontosPendentes = registro.registros
      .map((r, index) => ({ ...r, index }))
      .filter(r => r.status === STATUS_PENDENTE);
    
    if (pontosPendentes.length === 0) {
      alert('Não há registros pendentes para este funcionário nesta data.');
      return;
    }
    
    // Preparar detalhes da notificação
    const detalhesPendentes = pontosPendentes.map(p => p.label).join(', ');
    
    // Configurar dados para o modal
    setFuncionarioSelecionado({
      id: registro.funcionarioId,
      nome: registro.funcionarioNome,
      registroId: registro.id,
      data: registro.data,
      pendencias: detalhesPendentes
    });
    
    setNotificacaoPersonalizada(
      `Prezado(a) ${registro.funcionarioNome}, identificamos pendências no seu registro de ponto do dia ${registro.data}. Por favor, regularize os seguintes registros: ${detalhesPendentes}.`
    );
    
    setMostrarNotificacaoModal(true);
  };

  // Função para enviar notificação personalizada
  const enviarNotificacaoPersonalizada = () => {
    if (!funcionarioSelecionado || !notificacaoPersonalizada.trim()) {
      alert('É necessário preencher a mensagem de notificação.');
      return;
    }
    
    const notificacoes = JSON.parse(localStorage.getItem('userNotifications') || '[]');
    notificacoes.push({
      id: Date.now(),
      userId: funcionarioSelecionado.id,
      message: notificacaoPersonalizada,
      date: new Date().toLocaleDateString('pt-BR'),
      read: false,
      urgente: true,
      tipo: 'ponto_pendente',
      data: funcionarioSelecionado.data,
      pendencias: funcionarioSelecionado.pendencias
    });
    
    localStorage.setItem('userNotifications', JSON.stringify(notificacoes));
    alert(`Notificação enviada para ${funcionarioSelecionado.nome} sobre ponto pendente.`);
    
    setMostrarNotificacaoModal(false);
    setNotificacaoPersonalizada('');
    setFuncionarioSelecionado(null);
  };

  // Função para justificativa
  const abrirJustificativaModal = (registroId) => {
    const registro = pontoRegistros.find(r => r.id === registroId);
    if (!registro) return;
    
    setJustificativaData({
      tipo: TIPOS_JUSTIFICATIVA[0],
      detalhamento: '',
      temComprovante: false,
      registroId: registroId
    });
    
    setMostrarJustificativaModal(true);
  };

  const salvarJustificativa = () => {
    if (!justificativaData.registroId) return;
    
    const registro = pontoRegistros.find(r => r.id === justificativaData.registroId);
    if (!registro) {
      alert('Registro não encontrado.');
      return;
    }
    
    // Salvar histórico da justificativa
    const justificativasHistorico = JSON.parse(localStorage.getItem('justificativasHistorico') || '[]');
    justificativasHistorico.push({
      id: Date.now(),
      registroId: justificativaData.registroId,
      funcionarioId: registro.funcionarioId,
      funcionarioNome: registro.funcionarioNome,
      data: registro.data,
      tipo: justificativaData.tipo,
      detalhamento: justificativaData.detalhamento,
      temComprovante: justificativaData.temComprovante,
      dataCriacao: new Date().toISOString(),
      pontosPendentes: registro.registros
        .map((r, i) => ({ ...r, indice: i }))
        .filter(r => r.status === STATUS_PENDENTE || r.status === 'falta')
        .map(r => ({
          tipo: r.tipo,
          indice: r.indice
        }))
    });
    
    localStorage.setItem('justificativasHistorico', JSON.stringify(justificativasHistorico));
    
    // Atualizar status dos registros pendentes
    let mudancas = false;
    const novosRegistros = pontoRegistros.map(r => {
      if (r.id === justificativaData.registroId) {
        const registrosAtualizados = r.registros.map((reg, idx) => {
          if (reg.status === STATUS_PENDENTE || reg.status === 'falta') {
            // Salvar na chave individualizada
            const statusKey = `pontoStatus_${justificativaData.registroId}_${idx}`;
            localStorage.setItem(statusKey, 'falta justificada');
            mudancas = true;
            return { ...reg, status: 'falta justificada' };
          }
          return reg;
        });
        
        return { ...r, registros: registrosAtualizados, observacoes: r.observacoes + (r.observacoes ? '\n' : '') + `Justificativa: ${justificativaData.tipo} - ${justificativaData.detalhamento}` };
      }
      return r;
    });
    
    if (mudancas) {
      setPontoRegistros(novosRegistros);
      localStorage.setItem('pontoRegistros', JSON.stringify(novosRegistros));
      
      // Adicionar notificação para o funcionário
      const notificacoes = JSON.parse(localStorage.getItem('userNotifications') || '[]');
      notificacoes.push({
        id: Date.now(),
        userId: registro.funcionarioId,
        message: `Sua falta do dia ${registro.data} foi justificada como "${justificativaData.tipo}".`,
        date: new Date().toLocaleDateString('pt-BR'),
        read: false
      });
      localStorage.setItem('userNotifications', JSON.stringify(notificacoes));
      
      alert(`Falta justificada registrada para ${registro.funcionarioNome} em ${registro.data}.`);
    }
    
    setMostrarJustificativaModal(false);
  };

  // Função para exportar registro individual
  const exportarRegistro = (registroId) => {
    const registro = pontoRegistros.find(r => r.id === registroId);
    if (!registro) return;
    
    // Simular geração de PDF
    setExportandoPdf(true);
    
    setTimeout(() => {
      const modelo = MODELOS_TRABALHO[registro.modeloTrabalho];
      const bancoHoras = calcularBancoHoras(registro);
      
      // Criar conteúdo para download
      const content = `
ESPELHO DE PONTO - ${registro.funcionarioNome}
Data: ${registro.data}
Modelo de Trabalho: ${modelo.nome}

REGISTROS:
${registro.registros.map(r => `${r.label}: ${r.hora} - Status: ${r.status.toUpperCase()}${r.localizacao ? ` - Local: ${r.localizacao}` : ''}`).join('\n')}

HORAS TRABALHADAS: ${calcularHorasTrabalhadas(registro)}
BANCO DE HORAS: ${bancoHoras.texto}

OBSERVAÇÕES:
${registro.observacoes || 'Nenhuma observação registrada.'}

PENDÊNCIAS: ${
  registro.registros.some(r => r.status === STATUS_PENDENTE) 
  ? registro.registros
      .filter(r => r.status === STATUS_PENDENTE)
      .map(r => r.label).join(', ')
  : 'Nenhuma pendência'
}

ASSINATURAS:

____________________________     ____________________________
      Funcionário                        Gestor
`;

      // Criar um blob e fazer download
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ponto_${registro.funcionarioNome.replace(/\s+/g, '_')}_${registro.data.replace(/\//g, '-')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExportandoPdf(false);
      alert(`Espelho de ponto de ${registro.funcionarioNome} exportado com sucesso!`);
    }, 1000);
  };

  // Função para salvar configurações
  const salvarConfiguracoes = (novaConfig) => {
    setConfigPersonalizada(novaConfig);
    localStorage.setItem('configPonto', JSON.stringify(novaConfig));
    setMostrarConfigRegrasModal(false);
    alert('Configurações salvas com sucesso!');
  };

  // Funções para lidar com múltiplas visualizações
  const alterarModoVisualizacao = (modo) => {
    setModoVisualizacao(modo);
  };
  // Efeitos para carregar dados iniciais
  useEffect(() => {
    // Carregar lista de funcionários e inicializar
    const funcionarios = getAllPossibleFuncionarios();
    setAllFuncionarios(funcionarios);
    
    // Configurar listener para mudanças no localStorage
    const handleStorageChange = (e) => {
      if (e.key === FUNCIONARIOS_KEY || e.key === 'registeredUsers' || e.key === 'user') {
        setAllFuncionarios(getAllPossibleFuncionarios());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Persistir mudanças no estado
  useEffect(() => {
    localStorage.setItem('pontoRegistros', JSON.stringify(pontoRegistros));
  }, [pontoRegistros]);

  // Funções para renderizar elementos de UI
  const renderizarStatus = (status) => {
    let corClasse = '';
    let texto = status.toUpperCase();
    
    switch(status) {
      case 'regular':
        corClasse = 'bg-green-600';
        break;
      case 'atrasado':
        corClasse = 'bg-yellow-600';
        break;
      case 'hora extra':
        corClasse = 'bg-blue-600';
        break;
      case STATUS_PENDENTE:
      case 'falta':
        corClasse = 'bg-purple-600';
        texto = 'PENDENTE';
        break;
      case 'falta justificada':
        corClasse = 'bg-orange-600';
        texto = 'JUSTIFICADA';
        break;
      case STATUS_AJUSTADO:
        corClasse = 'bg-indigo-600';
        break;
      case STATUS_APROVADO:
        corClasse = 'bg-green-700';
        break;
      case STATUS_REJEITADO:
        corClasse = 'bg-red-700';
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

  // Preparar dados para a visualização atual
  const funcionarios = [...new Set(allFuncionarios.map(f => f.nome))].sort();
  const datas = [...new Set(pontoRegistros.map(registro => registro.data))].sort((a, b) => {
    const [diaA, mesA, anoA] = a.split('/').map(Number);
    const [diaB, mesB, anoB] = b.split('/').map(Number);
    const dateA = new Date(anoA, mesA - 1, diaA);
    const dateB = new Date(anoB, mesB - 1, diaB);
    return dateB - dateA; // Ordenação descendente
  });
  
  // Filtrar registros
  const registrosFiltrados = pontoRegistros.filter(registro => {
    const filtroModeloTrabalho = filtros.modeloTrabalho === '' || registro.modeloTrabalho === filtros.modeloTrabalho;
    
    return (
      (filtros.data === '' || registro.data === filtros.data) &&
      (filtros.funcionario === '' || registro.funcionarioNome === filtros.funcionario) &&
      (filtros.status === '' || registro.registros.some(r => r.status === filtros.status)) &&
      filtroModeloTrabalho
    );
  });

  // Ordenar registros
  const registrosOrdenados = [...registrosFiltrados].sort((a, b) => {
    // Primeiro ordenar por data (mais recente primeiro)
    const [diaA, mesA, anoA] = a.data.split('/').map(Number);
    const [diaB, mesB, anoB] = b.data.split('/').map(Number);
    const dateA = new Date(anoA, mesA - 1, diaA);
    const dateB = new Date(anoB, mesB - 1, diaB);
    
    const compareDatas = dateB - dateA;
    if (compareDatas !== 0) return compareDatas;
    
    // Depois ordenar por nome do funcionário
    return a.funcionarioNome.localeCompare(b.funcionarioNome);
  });
  
  // Agrupar dados para dashboard
  const dadosDashboard = {
    totalRegistros: registrosFiltrados.length,
    totalPendentes: registrosFiltrados.filter(r => r.registros.some(reg => reg.status === STATUS_PENDENTE)).length,
    totalAprovados: registrosFiltrados.filter(r => r.registros.every(reg => reg.status !== STATUS_PENDENTE && reg.status !== STATUS_REJEITADO)).length,
    totalJustificados: registrosFiltrados.filter(r => r.registros.some(reg => reg.status === 'falta justificada')).length,
    modelosTrabalho: Object.entries(MODELOS_TRABALHO).map(([key, modelo]) => ({
      id: key,
      nome: modelo.nome,
      total: registrosFiltrados.filter(r => r.modeloTrabalho === key).length
    }))
  };
  // Renderizar interface principal
  return (
    <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-lg shadow-lg p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between">
        <h1 className="text-2xl font-bold">Registros de Ponto Flexível</h1>
        
        {/* Alternar entre modos de visualização */}
        <div className="flex space-x-2 mt-2 md:mt-0">
          <button 
            onClick={() => alterarModoVisualizacao('lista')}
            className={`px-3 py-1 rounded ${modoVisualizacao === 'lista' ? 'bg-purple-600' : 'bg-purple-800'} transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          <button 
            onClick={() => alterarModoVisualizacao('calendario')}
            className={`px-3 py-1 rounded ${modoVisualizacao === 'calendario' ? 'bg-purple-600' : 'bg-purple-800'} transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button 
            onClick={() => alterarModoVisualizacao('dashboard')}
            className={`px-3 py-1 rounded ${modoVisualizacao === 'dashboard' ? 'bg-purple-600' : 'bg-purple-800'} transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Barra de ações */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button 
          onClick={() => setMostrarAdicionarRegistroModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Adicionar Registro
        </button>
        
        <button 
          onClick={() => setMostrarConfigRegrasModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Configurações
        </button>
        
        <button 
          onClick={() => {
            const funcionarios = getAllPossibleFuncionarios();
            setAllFuncionarios(funcionarios);
            alert(`Lista atualizada: ${funcionarios.length} funcionários encontrados.`);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Atualizar Lista ({allFuncionarios.length})
        </button>
      </div>
      
      {/* Filtros */}
      <div className="bg-purple-900 bg-opacity-40 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-purple-300 mb-1">Data</label>
            <select
              className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
              value={filtros.data}
              onChange={(e) => setFiltros({...filtros, data: e.target.value})}
            >
              <option value="">Todas as datas</option>
              {datas.map((data, index) => (
                <option key={index} value={data}>{data}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-purple-300 mb-1">
              Funcionário ({funcionarios.length})
            </label>
            <select
              className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
              value={filtros.funcionario}
              onChange={(e) => setFiltros({...filtros, funcionario: e.target.value})}
            >
              <option value="">Todos os funcionários</option>
              {funcionarios.map((funcionario, index) => (
                <option key={index} value={funcionario}>{funcionario}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-purple-300 mb-1">Status</label>
            <select
              className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
              value={filtros.status}
              onChange={(e) => setFiltros({...filtros, status: e.target.value})}
            >
              <option value="">Todos os status</option>
              <option value="regular">Regular</option>
              <option value="atrasado">Atrasado</option>
              <option value="hora extra">Hora Extra</option>
              <option value={STATUS_PENDENTE}>Pendente</option>
              <option value="falta justificada">Falta Justificada</option>
              <option value={STATUS_AJUSTADO}>Ajustado</option>
              <option value={STATUS_APROVADO}>Aprovado</option>
              <option value={STATUS_REJEITADO}>Rejeitado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-purple-300 mb-1">Modelo de Trabalho</label>
            <select
              className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
              value={filtros.modeloTrabalho}
              onChange={(e) => setFiltros({...filtros, modeloTrabalho: e.target.value})}
            >
              <option value="">Todos os modelos</option>
              {Object.entries(MODELOS_TRABALHO).map(([id, modelo]) => (
                <option key={id} value={id}>{modelo.nome}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {/* Conteúdo baseado no modo de visualização */}
      {modoVisualizacao === 'lista' && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-purple-300 text-sm border-b border-purple-700">
                <th className="px-4 py-2 text-left">Funcionário</th>
                <th className="px-4 py-2 text-left">Data</th>
                <th className="px-4 py-2 text-left">Modelo</th>
                <th className="px-4 py-2 text-left">Registros</th>
                <th className="px-4 py-2 text-left">Horas Trabalhadas</th>
                <th className="px-4 py-2 text-left">Banco Horas</th>
                <th className="px-4 py-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {registrosOrdenados.map((registro) => {
                const bancoHoras = calcularBancoHoras(registro);
                
                return (
                  <tr key={registro.id} className="border-b border-purple-700 hover:bg-purple-700 hover:bg-opacity-30">
                    <td className="px-4 py-3">{registro.funcionarioNome}</td>
                    <td className="px-4 py-3">{registro.data}</td>
                    <td className="px-4 py-3">{MODELOS_TRABALHO[registro.modeloTrabalho]?.nome || 'Personalizado'}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        {registro.registros.map((r, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            {editandoRegistro && editandoRegistro.registroId === registro.id && editandoRegistro.indiceRegistro === index ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs">{r.label}:</span>
                                <input
                                  type="time"
                                  defaultValue={r.hora !== '--:--' ? r.hora : ''}
                                  className="bg-purple-800 border border-purple-600 rounded-md p-1 text-white w-24"
                                  ref={el => horaInputRefs.current[`${registro.id}-${index}`] = el}
                                />
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => salvarEdicaoPonto(registro.id, index, STATUS_APROVADO)}
                                    className="text-green-500 hover:text-green-400"
                                    title="Aprovar registro"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => salvarEdicaoPonto(registro.id, index, STATUS_REJEITADO)}
                                    className="text-red-500 hover:text-red-400"
                                    title="Rejeitar registro"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => salvarEdicaoPonto(registro.id, index, STATUS_AJUSTADO)}
                                    className="text-blue-500 hover:text-blue-400"
                                    title="Ajustar registro"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => cancelarEdicaoPonto()}
                                    className="text-gray-400 hover:text-white"
                                    title="Cancelar"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs whitespace-nowrap">{r.label}:</span>
                                <span className={r.status === STATUS_PENDENTE || r.status === 'falta' ? 'text-red-400' : ''}>
                                  {r.hora}
                                </span>
                                <div>{renderizarStatus(r.status)}</div>
                                <button
                                  onClick={() => iniciarEdicaoPonto(registro.id, index)}
                                  className="text-purple-300 hover:text-white"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">{calcularHorasTrabalhadas(registro)}</td>
                    <td className="px-4 py-3">
                      <span className={bancoHoras.minutos > 0 ? 'text-green-400' : bancoHoras.minutos < 0 ? 'text-red-400' : ''}>
                        {bancoHoras.texto}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {registro.registros.some(r => r.status === STATUS_PENDENTE) && (
                          <button
                            onClick={() => notificarFuncionario(registro.id)}
                            className="bg-purple-600 hover:bg-purple-700 text-white rounded p-1 text-xs flex items-center"
                            title="Notificar funcionário"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            Notificar
                          </button>
                        )}
                        {registro.registros.some(r => r.status === STATUS_PENDENTE) && (
                          <button
                            onClick={() => abrirJustificativaModal(registro.id)}
                            className="bg-orange-600 hover:bg-orange-700 text-white rounded p-1 text-xs flex items-center"
                            title="Justificar faltas"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Justificar
                          </button>
                        )}
                        <button
                          onClick={() => iniciarEdicaoObservacao(registro.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded p-1 text-xs flex items-center"
                          title="Adicionar observação"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Observar
                        </button>
                        <button
                          onClick={() => exportarRegistro(registro.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded p-1 text-xs flex items-center"
                          title="Exportar registro"
                          disabled={exportandoPdf}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Exportar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {registrosOrdenados.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-6 text-center text-purple-300">
                    Nenhum registro encontrado com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* Visualização de Calendário */}
      {modoVisualizacao === 'calendario' && (
        <div className="rounded-lg border border-purple-700 overflow-hidden">
          <div className="px-6 py-4 bg-purple-900 border-b border-purple-700">
            <h3 className="text-xl font-semibold">Calendário de Ponto</h3>
            <p className="text-sm text-purple-300 mt-1">Selecione um funcionário para visualizar seu calendário completo</p>
          </div>
          
          <div className="p-6 bg-purple-800 bg-opacity-30">
            {!filtros.funcionario ? (
              <div className="text-center py-10">
                <p className="mb-4">Selecione um funcionário no filtro acima para visualizar o calendário</p>
                <button 
                  onClick={() => setMostrarAdicionarRegistroModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded inline-flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Adicionar Novo Registro
                </button>
              </div>
            ) : (
              <div>
                <h4 className="text-lg font-semibold mb-4">Calendário de {filtros.funcionario}</h4>
                
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
                    <div key={dia} className="text-center text-xs font-semibold py-1">{dia}</div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {/* Aqui seria renderizado o calendário baseado nos registros do funcionário */}
                  {Array(31).fill(0).map((_, i) => {
                    const dia = i + 1;
                    const registrosDoDia = registrosOrdenados.filter(r => {
                      const [diaR] = r.data.split('/').map(Number);
                      return diaR === dia && r.funcionarioNome === filtros.funcionario;
                    });
                    
                    const temPendencia = registrosDoDia.some(r => r.registros.some(reg => reg.status === STATUS_PENDENTE));
                    const temJustificativa = registrosDoDia.some(r => r.registros.some(reg => reg.status === 'falta justificada'));
                    const todosAprovados = registrosDoDia.some(r => r.registros.every(reg => reg.status === STATUS_APROVADO || reg.status === 'regular'));
                    
                    let corFundo = 'bg-purple-800 bg-opacity-30';
                    if (registrosDoDia.length > 0) {
                      if (temPendencia) corFundo = 'bg-purple-600';
                      else if (temJustificativa) corFundo = 'bg-orange-600';
                      else if (todosAprovados) corFundo = 'bg-green-600';
                    }
                    
                    return (
                      <div 
                        key={dia} 
                        className={`p-2 rounded min-h-14 ${corFundo} hover:bg-opacity-80 cursor-pointer transition-colors`}
                        onClick={() => {
                          if (registrosDoDia.length > 0) {
                            // Abrir modal com detalhes ou focar na lista
                            setFiltros({...filtros, data: registrosDoDia[0].data});
                            setModoVisualizacao('lista');
                          } else {
                            // Oferecer adicionar
                            if (window.confirm(`Deseja adicionar registro para ${filtros.funcionario} no dia ${dia}?`)) {
                              setNovoRegistroData({
                                funcionarioId: allFuncionarios.find(f => f.nome === filtros.funcionario)?.id || '',
                                data: `${dia.toString().padStart(2, '0')}/${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
                                modeloTrabalho: 'PADRAO'
                              });
                              setMostrarAdicionarRegistroModal(true);
                            }
                          }
                        }}
                      >
                        <div className="text-xs font-bold">{dia}</div>
                        {registrosDoDia.length > 0 && (
                          <div className="mt-1 text-xs">
                            {registrosDoDia.map(r => {
                              const modelo = MODELOS_TRABALHO[r.modeloTrabalho];
                              return (
                                <div key={r.id} className="truncate">
                                  {modelo.nome}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Visualização de Dashboard */}
      {modoVisualizacao === 'dashboard' && (
        <div className="bg-purple-900 bg-opacity-30 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-6">Dashboard de Ponto</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Card de Registros Totais */}
            <div className="bg-purple-800 rounded-lg p-4 flex flex-col">
              <h4 className="text-sm text-purple-300 mb-1">Total de Registros</h4>
              <p className="text-3xl font-bold">{dadosDashboard.totalRegistros}</p>
              <div className="mt-auto pt-4 text-xs text-purple-300">
                Com filtros aplicados
              </div>
            </div>
            
            {/* Card de Registros Pendentes */}
            <div className="bg-purple-600 rounded-lg p-4 flex flex-col">
              <h4 className="text-sm text-purple-200 mb-1">Pendentes</h4>
              <p className="text-3xl font-bold">{dadosDashboard.totalPendentes}</p>
              <div className="mt-auto pt-4 text-xs">
                {dadosDashboard.totalPendentes > 0 && (
                  <button 
                    className="bg-purple-700 hover:bg-purple-800 px-2 py-1 rounded"
                    onClick={() => {
                      setFiltros({...filtros, status: STATUS_PENDENTE});
                      setModoVisualizacao('lista');
                    }}
                  >
                    Ver Pendentes
                  </button>
                )}
              </div>
            </div>
            
            {/* Card de Registros Aprovados */}
            <div className="bg-green-600 rounded-lg p-4 flex flex-col">
              <h4 className="text-sm text-green-200 mb-1">Aprovados</h4>
              <p className="text-3xl font-bold">{dadosDashboard.totalAprovados}</p>
              <div className="mt-auto pt-4 text-xs text-green-200">
                {Math.round((dadosDashboard.totalAprovados / dadosDashboard.totalRegistros) * 100)}% do total
              </div>
            </div>
            
            {/* Card de Faltas Justificadas */}
            <div className="bg-orange-600 rounded-lg p-4 flex flex-col">
              <h4 className="text-sm text-orange-200 mb-1">Justificados</h4>
              <p className="text-3xl font-bold">{dadosDashboard.totalJustificados}</p>
              <div className="mt-auto pt-4 text-xs">
                {dadosDashboard.totalJustificados > 0 && (
                  <button 
                    className="bg-orange-700 hover:bg-orange-800 px-2 py-1 rounded"
                    onClick={() => {
                      setFiltros({...filtros, status: 'falta justificada'});
                      setModoVisualizacao('lista');
                    }}
                  >
                    Ver Justificativas
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Estatísticas por Modelo de Trabalho */}
          <div className="bg-purple-800 bg-opacity-50 rounded-lg p-6 mb-6">
            <h4 className="text-lg font-semibold mb-4">Registros por Modelo de Trabalho</h4>
            
            <div className="space-y-4">
              {dadosDashboard.modelosTrabalho.map(modelo => (
                <div key={modelo.id} className="flex items-center">
                  <div className="w-40 text-sm">{modelo.nome}</div>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-purple-900 rounded-full h-4 overflow-hidden">
                      <div 
                        className="bg-purple-500 h-4" 
                        style={{width: `${(modelo.total / dadosDashboard.totalRegistros) * 100}%`}}
                      ></div>
                    </div>
                  </div>
                  <div className="w-20 text-right">{modelo.total}</div>
                  <div className="w-20 text-right text-sm">
                    {Math.round((modelo.total / dadosDashboard.totalRegistros) * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Ações Rápidas */}
          <div className="bg-purple-800 bg-opacity-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold mb-4">Ações Rápidas</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setFiltros({...filtros, status: STATUS_PENDENTE});
                  setModoVisualizacao('lista');
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ver Registros Pendentes
              </button>
              
              <button
                onClick={() => {
                  const pendentes = registrosOrdenados.filter(r => r.registros.some(reg => reg.status === STATUS_PENDENTE));
                  if (pendentes.length === 0) {
                    alert('Não há registros pendentes para notificar.');
                    return;
                  }
                  
                  if (window.confirm(`Deseja notificar todos os ${pendentes.length} funcionários com registros pendentes?`)) {
                    // Aqui implementaria a notificação em massa
                    alert(`Notificações enviadas para ${pendentes.length} funcionários.`);
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Notificar Todos Pendentes
              </button>
              
              <button
                onClick={() => {
                  setFiltros({...filtros});
                  setModoVisualizacao('calendario');
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Ver Calendário
              </button>
              
              <button
                onClick={() => {
                  setExportandoPdf(true);
                  setTimeout(() => {
                    // Simular exportação
                    setExportandoPdf(false);
                    alert('Relatório exportado com sucesso!');
                  }, 1500);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded flex items-center"
                disabled={exportandoPdf}
              >
                {exportandoPdf ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exportando...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Exportar Relatório Completo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Notificação Personalizada */}
      {mostrarNotificacaoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-purple-900 p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Enviar Notificação</h2>
            <p className="text-sm mb-4">Enviando para: <strong>{funcionarioSelecionado?.nome}</strong> - {funcionarioSelecionado?.data}</p>
            
            <div className="mb-4">
              <label className="block text-sm text-purple-300 mb-2">Mensagem:</label>
              <textarea
                className="w-full bg-purple-800 border border-purple-700 rounded-md p-3 text-white h-32"
                value={notificacaoPersonalizada}
                onChange={(e) => setNotificacaoPersonalizada(e.target.value)}
                placeholder="Digite a mensagem para o funcionário..."
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setMostrarNotificacaoModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={enviarNotificacaoPersonalizada}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
              >
                Enviar Notificação
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Justificativa */}
      {mostrarJustificativaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-purple-900 p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Registrar Justificativa</h2>
            
            <div className="mb-4">
              <label className="block text-sm text-purple-300 mb-2">Tipo de Justificativa:</label>
              <select
                className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
                value={justificativaData.tipo}
                onChange={(e) => setJustificativaData({...justificativaData, tipo: e.target.value})}
              >
                {TIPOS_JUSTIFICATIVA.map((tipo, index) => (
                  <option key={index} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-purple-300 mb-2">Detalhamento:</label>
              <textarea
                className="w-full bg-purple-800 border border-purple-700 rounded-md p-3 text-white h-24"
                value={justificativaData.detalhamento}
                onChange={(e) => setJustificativaData({...justificativaData, detalhamento: e.target.value})}
                placeholder="Descreva os detalhes da justificativa..."
              ></textarea>
            </div>
            
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox h-5 w-5 text-purple-600 rounded"
                  checked={justificativaData.temComprovante}
                  onChange={(e) => setJustificativaData({...justificativaData, temComprovante: e.target.checked})}
                />
                <span className="ml-2 text-sm">Possui comprovante</span>
              </label>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setMostrarJustificativaModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={salvarJustificativa}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded"
              >
                Registrar Justificativa
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Edição de Observação */}
      {editandoObservacao !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-purple-900 p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Adicionar Observação</h2>
            
            <div className="mb-4">
              <label className="block text-sm text-purple-300 mb-2">Observação:</label>
              <textarea
                ref={observacaoInputRef}
                className="w-full bg-purple-800 border border-purple-700 rounded-md p-3 text-white h-32"
                placeholder="Digite sua observação sobre este registro..."
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setEditandoObservacao(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={salvarObservacaoEditar}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
              >
                Salvar Observação
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Adicionar Registro */}
      {mostrarAdicionarRegistroModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-purple-900 p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Adicionar Novo Registro</h2>
            
            <div className="mb-4">
              <label className="block text-sm text-purple-300 mb-2">Funcionário:</label>
              <select
                className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
                value={novoRegistroData.funcionarioId}
                onChange={(e) => setNovoRegistroData({...novoRegistroData, funcionarioId: e.target.value})}
              >
                <option value="">Selecione um funcionário</option>
                {allFuncionarios.map((func) => (
                  <option key={func.id} value={func.id}>{func.nome}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-purple-300 mb-2">Data:</label>
              <input
                type="text"
                className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
                value={novoRegistroData.data}
                onChange={(e) => setNovoRegistroData({...novoRegistroData, data: e.target.value})}
                placeholder="DD/MM/AAAA"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm text-purple-300 mb-2">Modelo de Trabalho:</label>
              <select
                className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
                value={novoRegistroData.modeloTrabalho}
                onChange={(e) => setNovoRegistroData({...novoRegistroData, modeloTrabalho: e.target.value})}
              >
                {Object.entries(MODELOS_TRABALHO).map(([id, modelo]) => (
                  <option key={id} value={id}>{modelo.nome}</option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setMostrarAdicionarRegistroModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={adicionarNovoRegistro}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Configurações */}
      {mostrarConfigRegrasModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-purple-900 p-6 rounded-lg shadow-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Configurações de Ponto</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm text-purple-300 mb-2">Tolerância para atraso (minutos):</label>
                <input
                  type="number"
                  className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
                  value={configPersonalizada.toleranciaAtraso}
                  onChange={(e) => setConfigPersonalizada({...configPersonalizada, toleranciaAtraso: parseInt(e.target.value)})}
                  min="0"
                  max="60"
                />
              </div>
              
              <div>
                <label className="block text-sm text-purple-300 mb-2">Limite diário de hora extra (minutos):</label>
                <input
                  type="number"
                  className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
                  value={configPersonalizada.limiteHoraExtra}
                  onChange={(e) => setConfigPersonalizada({...configPersonalizada, limiteHoraExtra: parseInt(e.target.value)})}
                  min="0"
                  max="240"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Configurações de Notificação</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-purple-600 rounded"
                    checked={configPersonalizada.enviarAlertaPendencia}
                    onChange={(e) => setConfigPersonalizada({...configPersonalizada, enviarAlertaPendencia: e.target.checked})}
                  />
                  <span className="ml-2">Enviar alertas automáticos para pendências</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-purple-600 rounded"
                    checked={configPersonalizada.permitirJustificativaPosterior}
                    onChange={(e) => setConfigPersonalizada({...configPersonalizada, permitirJustificativaPosterior: e.target.checked})}
                  />
                  <span className="ml-2">Permitir justificativas posteriores</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-purple-600 rounded"
                    checked={configPersonalizada.requerGeolocalizacao}
                    onChange={(e) => setConfigPersonalizada({...configPersonalizada, requerGeolocalizacao: e.target.checked})}
                  />
                  <span className="ml-2">Exigir geolocalização para registros</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setMostrarConfigRegrasModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={() => salvarConfiguracoes(configPersonalizada)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Overlay de Carregamento para Exportação */}
      {exportandoPdf && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-purple-900 p-6 rounded-lg shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-300 mb-4"></div>
            <p className="text-xl font-semibold">Gerando Relatório...</p>
            <p className="text-sm mt-2">Por favor, aguarde enquanto preparamos seu documento.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PontoBatidoFlexivel;