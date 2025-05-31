import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Configuração da API
const API_BASE_URL = 'http://localhost:8080/api';

// Instância do axios configurada
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});


// Interceptor para tratamento de erros
api.interceptors.response.use(
  response => response,
  error => {
    console.error('Erro na API:', error);
    return Promise.reject(error);
  }
);

// Constantes para status
const STATUS_APROVADO = 'aprovado';
const STATUS_REJEITADO = 'rejeitado';
const STATUS_PENDENTE = 'pendente';
const STATUS_AJUSTADO = 'ajustado';

// Tipos de justificativa
const TIPOS_JUSTIFICATIVA = [
  { id: 'atestado_medico', nome: 'Atestado médico', selecionado: false },
  { id: 'declaracao_comparecimento', nome: 'Declaração de comparecimento', selecionado: false },
  { id: 'treinamento_externo', nome: 'Treinamento externo', selecionado: false },
  { id: 'trabalho_externo', nome: 'Trabalho externo', selecionado: false },
  { id: 'folga_compensatoria', nome: 'Folga compensatória', selecionado: false },
  { id: 'feriado', nome: 'Feriado', selecionado: false },
  { id: 'outro', nome: 'Outro', selecionado: false }
];

// Modelos de Trabalho - estrutura inicial
const MODELOS_TRABALHO_INICIAIS = {
  PADRAO: {
    id: 'PADRAO',
    codigo: 'PADRAO',
    nome: 'Padrão (8h)',
    horasEsperadas: 480, // minutos
    registros: [
      { tipo: 'entrada_trabalho', label: 'Entrada Trabalho', ordem: 1 },
      { tipo: 'saida_almoco', label: 'Saída Almoço', ordem: 2 },
      { tipo: 'entrada_almoco', label: 'Retorno Almoço', ordem: 3 },
      { tipo: 'saida_trabalho', label: 'Saída Trabalho', ordem: 4 }
    ]
  },
  MEIO_PERIODO: {
    id: 'MEIO_PERIODO',
    codigo: 'MEIO_PERIODO', 
    nome: 'Meio Período (4h)',
    horasEsperadas: 240,
    registros: [
      { tipo: 'entrada_trabalho', label: 'Entrada', ordem: 1 },
      { tipo: 'saida_trabalho', label: 'Saída', ordem: 2 }
    ]
  },
  PLANTAO_12H: {
    id: 'PLANTAO_12H',
    codigo: 'PLANTAO_12H',
    nome: 'Plantão (12h)',
    horasEsperadas: 720,
    registros: [
      { tipo: 'entrada_plantao', label: 'Entrada Plantão', ordem: 1 },
      { tipo: 'pausa_1', label: 'Intervalo 1', ordem: 2 },
      { tipo: 'retorno_1', label: 'Retorno 1', ordem: 3 },
      { tipo: 'pausa_2', label: 'Intervalo 2', ordem: 4 },
      { tipo: 'retorno_2', label: 'Retorno 2', ordem: 5 },
      { tipo: 'saida_plantao', label: 'Saída Plantão', ordem: 6 }
    ]
  },
  HOME_OFFICE: {
    id: 'HOME_OFFICE',
    codigo: 'HOME_OFFICE',
    nome: 'Home Office',
    horasEsperadas: 480,
    registros: [
      { tipo: 'inicio_expediente', label: 'Início Expediente', ordem: 1 },
      { tipo: 'pausa', label: 'Pausa', ordem: 2 },
      { tipo: 'retorno', label: 'Retorno', ordem: 3 },
      { tipo: 'fim_expediente', label: 'Fim Expediente', ordem: 4 }
    ]
  }
};

const PontoBatidoFlexivel = () => {
  // Estados principais
  const [pontoRegistros, setPontoRegistros] = useState([]);
  const [allFuncionarios, setAllFuncionarios] = useState([]);
  const [modelosTrabalho, setModelosTrabalho] = useState(MODELOS_TRABALHO_INICIAIS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para filtros - TODOS INICIAM VAZIOS (false/'' = "Todos")
  const [filtros, setFiltros] = useState({
    data: '', // '' = "Todas as datas"
    funcionario: '', // '' = "Todos os funcionários" 
    status: '', // '' = "Todos os status"
    modeloTrabalho: '' // '' = "Todos os modelos"
  });

  // Estados para configurações - TODOS INICIAM COMO false
  const [configPersonalizada, setConfigPersonalizada] = useState({
    toleranciaAtraso: 15,
    limiteHoraExtra: 120,
    enviarAlertaPendencia: false, // false = não selecionado inicialmente
    permitirJustificativaPosterior: false, // false = não selecionado inicialmente
    requerGeolocalizacao: false // false = não selecionado inicialmente
  });

  // Estados para modais e edição
  const [editandoRegistro, setEditandoRegistro] = useState(null);
  const [editandoObservacao, setEditandoObservacao] = useState(null);
  const [mostrarNotificacaoModal, setMostrarNotificacaoModal] = useState(false);
  const [mostrarJustificativaModal, setMostrarJustificativaModal] = useState(false);
  const [mostrarConfigRegrasModal, setMostrarConfigRegrasModal] = useState(false);
  const [mostrarAdicionarRegistroModal, setMostrarAdicionarRegistroModal] = useState(false);

  // Estados para dados de modais
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);
  const [notificacaoPersonalizada, setNotificacaoPersonalizada] = useState('');
  
  // Estado para justificativa - tipos iniciam como false (não selecionados)
  const [justificativaData, setJustificativaData] = useState({
    tipo: '', // '' = nenhum tipo selecionado inicialmente
    detalhamento: '',
    temComprovante: false, // false = não selecionado inicialmente
    registroId: null
  });

  // Estado para novo registro - campos vazios inicialmente
  const [novoRegistroData, setNovoRegistroData] = useState({
    funcionarioId: '', // '' = "Selecione um funcionário"
    data: new Date().toLocaleDateString('pt-BR'),
    modeloTrabalho: '' // '' = "Selecione um modelo"
  });

  // Estados para UI
  const [modoVisualizacao, setModoVisualizacao] = useState('lista');
  const [exportandoPdf, setExportandoPdf] = useState(false);

  // Refs
  const horaInputRefs = useRef({});
  const observacaoInputRef = useRef(null);

// Serviços da API
  const pontoService = {
    // Buscar todos os registros com filtros
    buscarRegistros: async (filtros = {}) => {
      try {
        const params = new URLSearchParams();
        if (filtros.data) params.append('data', filtros.data);
        if (filtros.funcionario) params.append('funcionario', filtros.funcionario);
        if (filtros.status) params.append('status', filtros.status);
        if (filtros.modeloTrabalho) params.append('modeloTrabalho', filtros.modeloTrabalho);
        
        const response = await api.get(`/ponto/registros?${params}`);
        return response.data;
      } catch (error) {
        console.error('Erro ao buscar registros:', error);
        throw error;
      }
    },

    // Criar novo registro
    criarRegistro: async (dadosRegistro) => {
      try {
        const response = await api.post('/ponto/registros', dadosRegistro);
        return response.data;
      } catch (error) {
        console.error('Erro ao criar registro:', error);
        throw error;
      }
    },

    // Atualizar status de um registro específico
    atualizarStatusRegistro: async (registroId, indiceRegistro, novoStatus, dadosAdicionais = {}) => {
      try {
        const response = await api.put(`/ponto/registros/${registroId}/status/${indiceRegistro}`, {
          status: novoStatus,
          ...dadosAdicionais
        });
        return response.data;
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
        throw error;
      }
    },

    // Salvar observação
    salvarObservacao: async (registroId, observacao) => {
      try {
        const response = await api.put(`/ponto/registros/${registroId}/observacao`, {
          observacao: observacao
        });
        return response.data;
      } catch (error) {
        console.error('Erro ao salvar observação:', error);
        throw error;
      }
    },

    // Buscar funcionários
    buscarFuncionarios: async () => {
      try {
        const response = await api.get('/funcionarios');
        return response.data;
      } catch (error) {
        console.error('Erro ao buscar funcionários:', error);
        throw error;
      }
    },

    // Buscar modelos de trabalho
    buscarModelosTrabalho: async () => {
      try {
        const response = await api.get('/ponto/modelos-trabalho');
        return response.data;
      } catch (error) {
        console.error('Erro ao buscar modelos de trabalho:', error);
        return MODELOS_TRABALHO_INICIAIS;
      }
    },

    // Enviar notificação
    enviarNotificacao: async (funcionarioId, mensagem, dadosExtras = {}) => {
      try {
        const response = await api.post('/notificacoes/enviar', {
          funcionarioId,
          mensagem,
          ...dadosExtras
        });
        return response.data;
      } catch (error) {
        console.error('Erro ao enviar notificação:', error);
        throw error;
      }
    },

    // Registrar justificativa
    registrarJustificativa: async (dadosJustificativa) => {
      try {
        const response = await api.post('/ponto/justificativas', dadosJustificativa);
        return response.data;
      } catch (error) {
        console.error('Erro ao registrar justificativa:', error);
        throw error;
      }
    },

    // Buscar configurações
    buscarConfiguracoes: async () => {
      try {
        const response = await api.post('/ponto/configuracoes'); // creio que é POST!
        return response.data;
      } catch (error) {
        console.error('Erro ao buscar configurações:', error);
        return {
          toleranciaAtraso: 15,
          limiteHoraExtra: 120,
          enviarAlertaPendencia: false,
          permitirJustificativaPosterior: false,
          requerGeolocalizacao: false
        };
      }
    },

    // Salvar configurações
    salvarConfiguracoes: async (configuracoes) => {
      try {
        const response = await api.put('/ponto/configuracoes', configuracoes);
        return response.data;
      } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        throw error;
      }
    },

    // Exportar registro
    exportarRegistro: async (registroId) => {
      try {
        const response = await api.get(`/ponto/registros/${registroId}/exportar`, {
          responseType: 'blob'
        });
        return response.data;
      } catch (error) {
        console.error('Erro ao exportar registro:', error);
        throw error;
      }
    },

    // Buscar dashboard
    buscarDashboard: async (filtros = {}) => {
      try {
        const params = new URLSearchParams();
        if (filtros.data) params.append('data', filtros.data);
        if (filtros.funcionario) params.append('funcionario', filtros.funcionario);
        if (filtros.status) params.append('status', filtros.status);
        if (filtros.modeloTrabalho) params.append('modeloTrabalho', filtros.modeloTrabalho);
        
        const response = await api.get(`/ponto/dashboard?${params}`);
        return response.data;
      } catch (error) {
        console.error('Erro ao buscar dashboard:', error);
        throw error;
      }
    }
  };
// Funções de carregamento de dados via API
  const carregarRegistrosPonto = async () => {
    try {
      setLoading(true);
      setError('');
      
      const registros = await pontoService.buscarRegistros(filtros);
      setPontoRegistros(registros);
    } catch (error) {
      setError('');
      console.error('', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarFuncionarios = async () => {
    try {
      const funcionarios = await pontoService.buscarFuncionarios();
      setAllFuncionarios(funcionarios);
    } catch (error) {
      setError('Erro ao carregar funcionários');
      console.error('Erro ao carregar funcionários:', error);
    }
  };

  const carregarModelosTrabalho = async () => {
    try {
      const modelos = await pontoService.buscarModelosTrabalho();
      setModelosTrabalho(modelos);
    } catch (error) {
      console.error('Erro ao carregar modelos de trabalho:', error);
      // Usa modelos iniciais em caso de erro
    }
  };

  const carregarConfiguracoes = async () => {
    try {
      const config = await pontoService.buscarConfiguracoes();
      setConfigPersonalizada(config);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  // Função para adicionar novo registro - INTEGRADA COM API
  const adicionarNovoRegistro = async () => {
    if (!novoRegistroData.funcionarioId) {
      setError('Selecione um funcionário.');
      return;
    }

    if (!novoRegistroData.modeloTrabalho) {
      setError('Selecione um modelo de trabalho.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const funcionario = allFuncionarios.find(f => f.id.toString() === novoRegistroData.funcionarioId.toString());
      if (!funcionario) {
        setError('Funcionário não encontrado.');
        return;
      }
      
      // Preparar dados para envio - converter data para formato ISO
      const [dia, mes, ano] = novoRegistroData.data.split('/');
      const dataISO = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      
      const dadosRegistro = {
        funcionarioId: parseInt(novoRegistroData.funcionarioId),
        funcionarioNome: funcionario.nome,
        data: dataISO,
        modeloTrabalho: novoRegistroData.modeloTrabalho,
        observacoes: '',
        bancoHoras: 0
      };
      
      // Enviar para API
      const novoRegistro = await pontoService.criarRegistro(dadosRegistro);
      
      // Atualizar lista local
      setPontoRegistros(prev => [...prev, novoRegistro]);
      
      // Resetar formulário
      setNovoRegistroData({
        funcionarioId: '',
        data: new Date().toLocaleDateString('pt-BR'),
        modeloTrabalho: ''
      });
      
      // Fechar modal
      setMostrarAdicionarRegistroModal(false);
      
      alert(`Novo registro de ponto criado para ${funcionario.nome} em ${novoRegistroData.data}.`);
      
    } catch (error) {
      setError('Erro ao adicionar novo registro');
      console.error('Erro ao adicionar registro:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para salvar configurações - INTEGRADA COM API
  const salvarConfiguracoes = async (novaConfig) => {
    try {
      setLoading(true);
      setError('');
      
      // Enviar para API
      await pontoService.salvarConfiguracoes(novaConfig);
      
      // Atualizar estado local
      setConfigPersonalizada(novaConfig);
      setMostrarConfigRegrasModal(false);
      
      alert('Configurações salvas com sucesso!');
      
    } catch (error) {
      setError('Erro ao salvar configurações');
      console.error('Erro ao salvar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para salvar status de ponto - INTEGRADA COM API
  const salvarStatus = async (registroId, indice, novoStatus, novaHora = null, novaLocalizacao = null) => {
    try {
      setLoading(true);
      setError('');
      
      const dadosAdicionais = {};
      if (novaHora !== null) dadosAdicionais.hora = novaHora;
      if (novaLocalizacao !== null) dadosAdicionais.localizacao = novaLocalizacao;
      
      // Enviar para API
      await pontoService.atualizarStatusRegistro(registroId, indice, novoStatus, dadosAdicionais);
      
      // Atualizar estado local
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
      
      setPontoRegistros(novosRegistros);
      
      const registro = pontoRegistros.find(r => r.id === registroId);
      if (registro) {
        alert(`Ponto atualizado para ${registro.funcionarioNome} em ${registro.data}.`);
      }
      
    } catch (error) {
      setError('Erro ao salvar status do ponto');
      console.error('Erro ao salvar status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para salvar observação - INTEGRADA COM API
  const salvarObservacao = async (registroId, novaObservacao) => {
    try {
      setLoading(true);
      setError('');
      
      // Enviar para API
      await pontoService.salvarObservacao(registroId, novaObservacao);
      
      // Atualizar estado local
      const novosRegistros = pontoRegistros.map(registro => {
        if (registro.id === registroId) {
          return { ...registro, observacoes: novaObservacao };
        }
        return registro;
      });
      
      setPontoRegistros(novosRegistros);
      setEditandoObservacao(null);
      
      alert('Observação salva com sucesso!');
      
    } catch (error) {
      setError('Erro ao salvar observação');
      console.error('Erro ao salvar observação:', error);
    } finally {
      setLoading(false);
    }
  };
// Função para enviar notificação - INTEGRADA COM API
  const enviarNotificacaoPersonalizada = async () => {
    if (!funcionarioSelecionado || !notificacaoPersonalizada.trim()) {
      setError('É necessário preencher a mensagem de notificação.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Dados extras para a notificação
      const dadosExtras = {
        tipo: 'ponto_pendente',
        data: funcionarioSelecionado.data,
        pendencias: funcionarioSelecionado.pendencias,
        urgente: true
      };
      
      // Enviar para API
      await pontoService.enviarNotificacao(
        funcionarioSelecionado.id, 
        notificacaoPersonalizada, 
        dadosExtras
      );
      
      alert(`Notificação enviada para ${funcionarioSelecionado.nome} sobre ponto pendente.`);
      
      // Limpar formulário e fechar modal
      setMostrarNotificacaoModal(false);
      setNotificacaoPersonalizada('');
      setFuncionarioSelecionado(null);
      
    } catch (error) {
      setError('Erro ao enviar notificação');
      console.error('Erro ao enviar notificação:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para salvar justificativa - INTEGRADA COM API
  const salvarJustificativa = async () => {
    if (!justificativaData.registroId) {
      setError('Registro não identificado para justificativa.');
      return;
    }

    if (!justificativaData.tipo) {
      setError('Selecione um tipo de justificativa.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const registro = pontoRegistros.find(r => r.id === justificativaData.registroId);
      if (!registro) {
        setError('Registro não encontrado.');
        return;
      }
      
      // Preparar dados da justificativa
      const dadosJustificativa = {
        registroId: justificativaData.registroId,
        funcionarioId: registro.funcionarioId,
        funcionarioNome: registro.funcionarioNome,
        data: registro.data,
        tipo: justificativaData.tipo,
        detalhamento: justificativaData.detalhamento,
        temComprovante: justificativaData.temComprovante,
        pontosPendentes: registro.registros
          .map((r, i) => ({ ...r, indice: i }))
          .filter(r => r.status === STATUS_PENDENTE || r.status === 'falta')
          .map(r => ({
            tipo: r.tipo,
            indice: r.indice
          }))
      };
      
      // Enviar para API
      await pontoService.registrarJustificativa(dadosJustificativa);
      
      // Atualizar registros locais - marcar como falta justificada
      const novosRegistros = pontoRegistros.map(r => {
        if (r.id === justificativaData.registroId) {
          const registrosAtualizados = r.registros.map((reg, idx) => {
            if (reg.status === STATUS_PENDENTE || reg.status === 'falta') {
              return { ...reg, status: 'falta justificada' };
            }
            return reg;
          });
          
          const novaObservacao = r.observacoes + (r.observacoes ? '\n' : '') + 
            `Justificativa: ${justificativaData.tipo} - ${justificativaData.detalhamento}`;
          
          return { 
            ...r, 
            registros: registrosAtualizados, 
            observacoes: novaObservacao 
          };
        }
        return r;
      });
      
      setPontoRegistros(novosRegistros);
      
      alert(`Falta justificada registrada para ${registro.funcionarioNome} em ${registro.data}.`);
      
      // Fechar modal e limpar dados
      setMostrarJustificativaModal(false);
      setJustificativaData({
        tipo: '',
        detalhamento: '',
        temComprovante: false,
        registroId: null
      });
      
    } catch (error) {
      setError('Erro ao salvar justificativa');
      console.error('Erro ao salvar justificativa:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para exportar registro - INTEGRADA COM API
  const exportarRegistro = async (registroId) => {
    try {
      setExportandoPdf(true);
      setError('');
      
      // Buscar dados do registro da API
      const blob = await pontoService.exportarRegistro(registroId);
      
      // Criar download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const registro = pontoRegistros.find(r => r.id === registroId);
      const nomeArquivo = registro 
        ? `ponto_${registro.funcionarioNome.replace(/\s+/g, '_')}_${registro.data.replace(/\//g, '-')}.pdf`
        : `ponto_registro_${registroId}.pdf`;
        
      a.download = nomeArquivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert(`Espelho de ponto exportado com sucesso!`);
      
    } catch (error) {
      setError('Erro ao exportar registro');
      console.error('Erro ao exportar registro:', error);
    } finally {
      setExportandoPdf(false);
    }
  };

  // Função para notificar funcionário - INTEGRADA COM API
  const notificarFuncionario = async (registroId) => {
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

  // Função para abrir modal de justificativa
  const abrirJustificativaModal = (registroId) => {
    const registro = pontoRegistros.find(r => r.id === registroId);
    if (!registro) return;
    
    // Resetar dados da justificativa com valores padrão (não selecionados)
    setJustificativaData({
      tipo: '', // '' = nenhum tipo selecionado
      detalhamento: '',
      temComprovante: false, // false = não selecionado
      registroId: registroId
    });
    
    setMostrarJustificativaModal(true);
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

  const salvarEdicaoPonto = async (registroId, indiceRegistro, statusSelecionado = STATUS_AJUSTADO) => {
    const inputRef = horaInputRefs.current[`${registroId}-${indiceRegistro}`];
    if (inputRef && inputRef.value) {
      await salvarStatus(registroId, indiceRegistro, statusSelecionado, inputRef.value);
    }
    setEditandoRegistro(null);
  };

  const cancelarEdicaoPonto = () => {
    setEditandoRegistro(null);
  };

  const salvarObservacaoEditar = async () => {
    if (!editandoObservacao) return;
    
    const novaObservacao = observacaoInputRef.current?.value || '';
    await salvarObservacao(editandoObservacao, novaObservacao);
  };

  // Função para calcular banco de horas
  const calcularBancoHoras = (registro) => {
    if (registro.registros.some(r => r.hora === '--:--')) {
      return { texto: 'Pendente', minutos: 0 };
    }
    
    try {
      const modelo = modelosTrabalho[registro.modeloTrabalho] || modelosTrabalho.PADRAO;
      const horasEsperadas = modelo.horasEsperadas || 480; // padrão 8h
      
      const converterParaMinutos = (hora) => {
        const [h, m] = hora.split(':').map(Number);
        return h * 60 + m;
      };
      
      let totalMinutosTrabalhados = 0;
      
      if (registro.modeloTrabalho === 'PADRAO') {
        const entrada1 = registro.registros.find(r => r.tipo === 'entrada_trabalho')?.hora || '';
        const saida1 = registro.registros.find(r => r.tipo === 'saida_almoco')?.hora || '';
        const entrada2 = registro.registros.find(r => r.tipo === 'entrada_almoco')?.hora || '';
        const saida2 = registro.registros.find(r => r.tipo === 'saida_trabalho')?.hora || '';
        
        const periodo1 = converterParaMinutos(saida1) - converterParaMinutos(entrada1);
        const periodo2 = converterParaMinutos(saida2) - converterParaMinutos(entrada2);
        
        totalMinutosTrabalhados = periodo1 + periodo2;
      } else if (registro.modeloTrabalho === 'MEIO_PERIODO') {
        const entrada = registro.registros.find(r => r.tipo === 'entrada_trabalho')?.hora || '';
        const saida = registro.registros.find(r => r.tipo === 'saida_trabalho')?.hora || '';
        
        totalMinutosTrabalhados = converterParaMinutos(saida) - converterParaMinutos(entrada);
      } else if (registro.modeloTrabalho === 'PLANTAO_12H') {
        const entrada = registro.registros.find(r => r.tipo === 'entrada_plantao')?.hora || '';
        const saida = registro.registros.find(r => r.tipo === 'saida_plantao')?.hora || '';
        
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
        const entrada = registro.registros.find(r => r.tipo === 'inicio_expediente')?.hora || '';
        const saida = registro.registros.find(r => r.tipo === 'fim_expediente')?.hora || '';
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
      
      const saldoMinutos = totalMinutosTrabalhados - horasEsperadas;
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
    if (registro.registros.some(r => r.hora === '--:--')) {
      return 'Pendente';
    }
    
    try {
      const converterParaMinutos = (hora) => {
        const [h, m] = hora.split(':').map(Number);
        return h * 60 + m;
      };
      
      let totalMinutosTrabalhados = 0;
      
      if (registro.modeloTrabalho === 'PADRAO') {
        const entrada1 = registro.registros.find(r => r.tipo === 'entrada_trabalho')?.hora || '';
        const saida1 = registro.registros.find(r => r.tipo === 'saida_almoco')?.hora || '';
        const entrada2 = registro.registros.find(r => r.tipo === 'entrada_almoco')?.hora || '';
        const saida2 = registro.registros.find(r => r.tipo === 'saida_trabalho')?.hora || '';
        
        const periodo1 = converterParaMinutos(saida1) - converterParaMinutos(entrada1);
        const periodo2 = converterParaMinutos(saida2) - converterParaMinutos(entrada2);
        
        totalMinutosTrabalhados = periodo1 + periodo2;
      } else if (registro.modeloTrabalho === 'MEIO_PERIODO') {
        const entrada = registro.registros.find(r => r.tipo === 'entrada_trabalho')?.hora || '';
        const saida = registro.registros.find(r => r.tipo === 'saida_trabalho')?.hora || '';
        
        totalMinutosTrabalhados = converterParaMinutos(saida) - converterParaMinutos(entrada);
      } else if (registro.modeloTrabalho === 'PLANTAO_12H') {
        const entrada = registro.registros.find(r => r.tipo === 'entrada_plantao')?.hora || '';
        const saida = registro.registros.find(r => r.tipo === 'saida_plantao')?.hora || '';
        
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
        const entrada = registro.registros.find(r => r.tipo === 'inicio_expediente')?.hora || '';
        const saida = registro.registros.find(r => r.tipo === 'fim_expediente')?.hora || '';
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
      
      const horas = Math.floor(totalMinutosTrabalhados / 60);
      const minutos = totalMinutosTrabalhados % 60;
      
      return `${horas}h${minutos.toString().padStart(2, '0')}m`;
    } catch (error) {
      console.error('Erro ao calcular horas trabalhadas:', error);
      return 'Erro';
    }
  };

  // Função para renderizar status
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

  // useEffect para carregamento inicial
  useEffect(() => {
    const carregarDadosIniciais = async () => {
      await Promise.all([
        carregarFuncionarios(),
        carregarModelosTrabalho(),
        carregarConfiguracoes(),
        carregarRegistrosPonto()
      ]);
    };
    
    carregarDadosIniciais();
  }, []);

  // useEffect para recarregar dados quando filtros mudam
  useEffect(() => {
    carregarRegistrosPonto();
  }, [filtros]);

  // Preparar dados para visualização
  const funcionarios = [...new Set(allFuncionarios.map(f => f.nome))].sort();
  const datas = [...new Set(pontoRegistros.map(registro => registro.data))].sort((a, b) => {
    // Converter data BR para comparação
    const parseDate = (dateStr) => {
      if (dateStr.includes('/')) {
        const [dia, mes, ano] = dateStr.split('/').map(Number);
        return new Date(ano, mes - 1, dia);
      } else {
        return new Date(dateStr);
      }
    };
    
    const dateA = parseDate(a);
    const dateB = parseDate(b);
    return dateB - dateA;
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
    // Converter data para comparação
    const parseDate = (dateStr) => {
      if (dateStr.includes('/')) {
        const [dia, mes, ano] = dateStr.split('/').map(Number);
        return new Date(ano, mes - 1, dia);
      } else {
        return new Date(dateStr);
      }
    };
    
    const dateA = parseDate(a.data);
    const dateB = parseDate(b.data);
    
    const compareDatas = dateB - dateA;
    if (compareDatas !== 0) return compareDatas;
    
    return a.funcionarioNome.localeCompare(b.funcionarioNome);
  });

  // Dados para dashboard
  const dadosDashboard = {
    totalRegistros: registrosFiltrados.length,
    totalPendentes: registrosFiltrados.filter(r => r.registros.some(reg => reg.status === STATUS_PENDENTE)).length,
    totalAprovados: registrosFiltrados.filter(r => r.registros.every(reg => reg.status !== STATUS_PENDENTE && reg.status !== STATUS_REJEITADO)).length,
    totalJustificados: registrosFiltrados.filter(r => r.registros.some(reg => reg.status === 'falta justificada')).length,
    modelosTrabalho: Object.entries(modelosTrabalho).map(([key, modelo]) => ({
      id: key,
      nome: modelo.nome,
      total: registrosFiltrados.filter(r => r.modeloTrabalho === key).length
    }))
  };

  // INÍCIO DA INTERFACE JSX
  return (
    <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-lg shadow-lg p-6">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-600 bg-opacity-80 text-white px-4 py-2 rounded mb-4 text-center text-sm">
          ⚠️ {error}
          <button 
            onClick={() => setError('')}
            className="ml-2 text-red-200 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between">
        <h1 className="text-2xl font-bold">Registros de Ponto Flexível</h1>
        
        {/* Alternar entre modos de visualização */}
        <div className="flex space-x-2 mt-2 md:mt-0">
          <button 
            onClick={() => setModoVisualizacao('lista')}
            className={`px-3 py-1 rounded ${modoVisualizacao === 'lista' ? 'bg-purple-600' : 'bg-purple-800'} transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          <button 
            onClick={() => setModoVisualizacao('calendario')}
            className={`px-3 py-1 rounded ${modoVisualizacao === 'calendario' ? 'bg-purple-600' : 'bg-purple-800'} transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button 
            onClick={() => setModoVisualizacao('dashboard')}
            className={`px-3 py-1 rounded ${modoVisualizacao === 'dashboard' ? 'bg-purple-600' : 'bg-purple-800'} transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Barra de ações - INTEGRADA COM API */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button 
          onClick={() => setMostrarAdicionarRegistroModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded flex items-center"
          disabled={loading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {loading ? 'Carregando...' : 'Adicionar Registro'}
        </button>
        
        <button 
          onClick={() => setMostrarConfigRegrasModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded flex items-center"
          disabled={loading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Configurações
        </button>
        
        <button 
          onClick={async () => {
            setLoading(true);
            await Promise.all([
              carregarRegistrosPonto(),
              carregarFuncionarios()
            ]);
            setLoading(false);
            alert(`Dados atualizados: ${pontoRegistros.length} registros, ${allFuncionarios.length} funcionários.`);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded flex items-center"
          disabled={loading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Atualizando...' : `Atualizar (${pontoRegistros.length})`}
        </button>
      </div>
      
      {/* Filtros - TODOS INICIAM VAZIOS (= "Todos") */}
      <div className="bg-purple-900 bg-opacity-40 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-purple-300 mb-1">Data</label>
            <select
              className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
              value={filtros.data} // = '' = "Todas as datas" selecionado
              onChange={(e) => setFiltros({...filtros, data: e.target.value})}
            >
              <option value="">📅 Todas as datas</option>
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
              value={filtros.funcionario} // = '' = "Todos os funcionários" selecionado
              onChange={(e) => setFiltros({...filtros, funcionario: e.target.value})}
            >
              <option value="">👥 Todos os funcionários</option>
              {funcionarios.map((funcionario, index) => (
                <option key={index} value={funcionario}>{funcionario}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-purple-300 mb-1">Status</label>
            <select
              className="w-full bg-purple-800 border border-purple-700 rounded-md p-2 text-white"
              value={filtros.status} // = '' = "Todos os status" selecionado
              onChange={(e) => setFiltros({...filtros, status: e.target.value})}
            >
              <option value="">🔄 Todos os status</option>
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
              value={filtros.modeloTrabalho} // = '' = "Todos os modelos" selecionado
              onChange={(e) => setFiltros({...filtros, modeloTrabalho: e.target.value})}
            >
              <option value="">⚙️ Todos os modelos</option>
              {Object.entries(modelosTrabalho).map(([id, modelo]) => (
                <option key={id} value={id}>{modelo.nome}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Indicador visual dos filtros ativos */}
        <div className="mt-4 flex flex-wrap gap-2">
          {filtros.data && (
            <span className="bg-purple-600 px-2 py-1 rounded text-xs">
              📅 Data: {filtros.data}
              <button 
                onClick={() => setFiltros({...filtros, data: ''})} 
                className="ml-1 text-purple-200 hover:text-white"
              >×</button>
            </span>
          )}
          {filtros.funcionario && (
            <span className="bg-purple-600 px-2 py-1 rounded text-xs">
              👤 {filtros.funcionario}
              <button 
                onClick={() => setFiltros({...filtros, funcionario: ''})} 
                className="ml-1 text-purple-200 hover:text-white"
              >×</button>
            </span>
          )}
          {filtros.status && (
            <span className="bg-purple-600 px-2 py-1 rounded text-xs">
              🔄 {filtros.status}
              <button 
                onClick={() => setFiltros({...filtros, status: ''})} 
                className="ml-1 text-purple-200 hover:text-white"
              >×</button>
            </span>
          )}
          {filtros.modeloTrabalho && (
            <span className="bg-purple-600 px-2 py-1 rounded text-xs">
              ⚙️ {modelosTrabalho[filtros.modeloTrabalho]?.nome}
              <button 
                onClick={() => setFiltros({...filtros, modeloTrabalho: ''})} 
                className="ml-1 text-purple-200 hover:text-white"
              >×</button>
            </span>
          )}
          {(filtros.data || filtros.funcionario || filtros.status || filtros.modeloTrabalho) && (
            <button 
              onClick={() => setFiltros({data: '', funcionario: '', status: '', modeloTrabalho: ''})}
              className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
            >
              🗑️ Limpar todos
            </button>
          )}
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
                    <td className="px-4 py-3">{modelosTrabalho[registro.modeloTrabalho]?.nome || 'Personalizado'}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        {registro.registros && registro.registros.map((r, index) => (
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
                                    disabled={loading}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => salvarEdicaoPonto(registro.id, index, STATUS_REJEITADO)}
                                    className="text-red-500 hover:text-red-400"
                                    title="Rejeitar registro"
                                    disabled={loading}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => salvarEdicaoPonto(registro.id, index, STATUS_AJUSTADO)}
                                    className="text-blue-500 hover:text-blue-400"
                                    title="Ajustar registro"
                                    disabled={loading}
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
                                  title="Editar registro"
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
                        {registro.registros && registro.registros.some(r => r.status === STATUS_PENDENTE) && (
                          <button
                            onClick={() => notificarFuncionario(registro.id)}
                            className="bg-purple-600 hover:bg-purple-700 text-white rounded p-1 text-xs flex items-center"
                            title="Notificar funcionário"
                            disabled={loading}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            Notificar
                          </button>
                        )}
                        {registro.registros && registro.registros.some(r => r.status === STATUS_PENDENTE) && (
                          <button
                            onClick={() => abrirJustificativaModal(registro.id)}
                            className="bg-orange-600 hover:bg-orange-700 text-white rounded p-1 text-xs flex items-center"
                            title="Justificar faltas"
                            disabled={loading}
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
                          disabled={loading}
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
                          disabled={exportandoPdf || loading}
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
                    {loading ? 'Carregando registros...' : 'Nenhum registro encontrado com os filtros selecionados.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Dashboard Simples */}
      {modoVisualizacao === 'dashboard' && (
        <div className="bg-purple-900 bg-opacity-30 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-6">Dashboard de Ponto</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-purple-800 rounded-lg p-4 flex flex-col">
              <h4 className="text-sm text-purple-300 mb-1">Total de Registros</h4>
              <p className="text-3xl font-bold">{dadosDashboard.totalRegistros}</p>
            </div>
            
            <div className="bg-purple-600 rounded-lg p-4 flex flex-col">
              <h4 className="text-sm text-purple-200 mb-1">Pendentes</h4>
              <p className="text-3xl font-bold">{dadosDashboard.totalPendentes}</p>
            </div>
            
            <div className="bg-green-600 rounded-lg p-4 flex flex-col">
              <h4 className="text-sm text-green-200 mb-1">Aprovados</h4>
              <p className="text-3xl font-bold">{dadosDashboard.totalAprovados}</p>
            </div>
            
            <div className="bg-orange-600 rounded-lg p-4 flex flex-col">
              <h4 className="text-sm text-orange-200 mb-1">Justificados</h4>
              <p className="text-3xl font-bold">{dadosDashboard.totalJustificados}</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Adicionar Registro - INTEGRADO COM API */}
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
                <option value="">Selecione um modelo</option>
                {Object.entries(modelosTrabalho).map(([id, modelo]) => (
                  <option key={id} value={id}>{modelo.nome}</option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setMostrarAdicionarRegistroModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={adicionarNovoRegistro}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                disabled={loading}
              >
                {loading ? 'Adicionando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configurações - INTEGRADO COM API */}
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
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={() => salvarConfiguracoes(configPersonalizada)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Notificação Personalizada - INTEGRADO COM API */}
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
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={enviarNotificacaoPersonalizada}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar Notificação'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Justificativa - INTEGRADO COM API */}
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
                <option value="">Selecione um tipo</option>
                {TIPOS_JUSTIFICATIVA.map((tipo, index) => (
                  <option key={index} value={tipo.id}>{tipo.nome}</option>
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
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={salvarJustificativa}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded"
                disabled={loading}
              >
                {loading ? 'Registrando...' : 'Registrar Justificativa'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Edição de Observação - INTEGRADO COM API */}
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
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={salvarObservacaoEditar}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar Observação'}
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