import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import axios from 'axios';

// Componentes importados
import ApprovedDataComponent from '../components/ApprovedDataComponent';
import JustificativaAusencia from '../components/JustificativaAusencia';
import BotaoLimparPontos from '../components/BotaoLimparPontos';

// API config - Adaptada para Spring Boot
const API_BASE_URL = 'http://localhost:8080/api';
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Adiciona token JWT a todas as requisições
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Para debug: log de todas as requisições
  console.log('Requisição API:', config.method?.toUpperCase(), config.url, config.data);
  return config;
});

// Interceptor para tratamento de erros (ex: token expirado)
api.interceptors.response.use(
  response => {
    // Para debug: log de todas as respostas
    console.log('Resposta API:', response.status, response.data);
    return response;
  },
  error => {
    console.error('Erro API:', error.response?.status, error.response?.data);
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Funções utilitárias
const verificarAtraso = (horaRegistro, horaReferencia, tolerancia) => {
  const [horaReg, minutoReg] = horaRegistro.split(':').map(Number);
  const [horaRef, minutoRef] = horaReferencia.split(':').map(Number);
  
  const totalMinutosReg = horaReg * 60 + minutoReg;
  const totalMinutosRef = horaRef * 60 + minutoRef;
  
  return totalMinutosReg > totalMinutosRef + tolerancia;
};

const calcularHorasTrabalhadas = (horaInicio, horaFim) => {
  const [horaI, minutoI] = horaInicio.split(':').map(Number);
  const [horaF, minutoF] = horaFim.split(':').map(Number);
  
  const totalMinutosI = horaI * 60 + minutoI;
  const totalMinutosF = horaF * 60 + minutoF;
  const diffMinutos = totalMinutosF - totalMinutosI;
  
  const horas = Math.floor(diffMinutos / 60);
  const minutos = diffMinutos % 60;
  
  return [horas, minutos];
};
const UserDashboard = () => {
  // Configuração inicial e navegação
  const navigate = useNavigate();
  
  // Estados de UI
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastAction, setLastAction] = useState(null);
  const [activeTab, setActiveTab] = useState('registros');
  const [loading, setLoading] = useState(true);
  
  // Estados para modais
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [showHistoryDetailsModal, setShowHistoryDetailsModal] = useState(false);
  const [showEmployeeDataModal, setShowEmployeeDataModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [correctionModalVisible, setCorrectionModalVisible] = useState(true);
  const [timeUntilHide, setTimeUntilHide] = useState(10);
  const [alertVisible, setAlertVisible] = useState(true);

  // Estados de dados
  const [selectedHistoryMonth, setSelectedHistoryMonth] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [activeEmployeeTab, setActiveEmployeeTab] = useState('horasExtras');
  
  // Estados para registros de ponto
  const [timeEntries, setTimeEntries] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [monthlyHistory, setMonthlyHistory] = useState([]);
  
  // Estados de controle
  const [canRegisterEntry, setCanRegisterEntry] = useState(true);
  const [canRegisterExit, setCanRegisterExit] = useState(false);
  const [entryCount, setEntryCount] = useState(0);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownEndTime, setCooldownEndTime] = useState(null);
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const [pendingEntries, setPendingEntries] = useState({});
  
  // Estados para estatísticas
  const [horasSemanais, setHorasSemanais] = useState('0h 0min');
  const [horasExtras, setHorasExtras] = useState('0h 0min');
  const [proximaFolga, setProximaFolga] = useState('');
  
  // Estado para dados de correção
  const [correctionData, setCorrectionData] = useState({
    date: '',
    time: '',
    reason: '',
    newTime: ''
  });
  
  // Estado para dados do usuário
  const [userData, setUserData] = useState({
    id: null,
    nome: 'Usuário',
    email: '',
    departamento: '',
    cargo: '',
    initials: 'U',
    abonos: 0,
    bancoHoras: 0,
    diasCompensacao: 0,
    diasFeriasDisponiveis: 0,
    jornadaTrabalho: {
      inicio: '08:00',
      fimManha: '12:00',
      inicioTarde: '13:00',
      fim: '17:00',
      toleranciaAtraso: 10
    }
  });
  
  // Estado para dados detalhados do funcionário
  const [employeeData, setEmployeeData] = useState({
    horasExtras: [],
    ferias: { 
      disponivel: 0, 
      proximas: { inicio: null, fim: null }, 
      historico: [] 
    },
    folgas: [],
    bancoHoras: { 
      saldo: 0, 
      entradas: [], 
      saidas: [] 
    },
    ausencias: [],
    jornada: {
      inicio: '08:00',
      fimManha: '12:00',
      inicioTarde: '13:00',
      fim: '17:00',
      toleranciaAtraso: 10
    }
  });
  
  // Refs
  const timeoutRef = useRef(null);
  
  // Função para obter iniciais do nome
  const getInitials = (name) => {
    if (!name) return 'U';
    const nameParts = name.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  // Função para formatar horário
  const formatTime = (date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  // Efeito para carregar os dados do usuário ao montar o componente
  // Efeito para carregar os dados do usuário ao montar o componente
useEffect(() => {
  const fetchUserData = async () => {
    try {
      // ✅ PRIMEIRO: Verificar dados do localStorage
      const token = localStorage.getItem('token');
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token || !storedUser.authenticated) {
        console.log("❌ Token ou usuário não encontrado, redirecionando para login");
        navigate('/login');
        return;
      }

      console.log("📦 Dados do usuário do localStorage:", storedUser);

      // ✅ USAR OS DADOS REAIS DO USUÁRIO LOGADO
      setUserData({
        id: storedUser.id,
        nome: storedUser.name || storedUser.nome || 'Usuário', // ✅ Usar nome real
        email: storedUser.email || '',
        departamento: storedUser.departamento || '',
        cargo: storedUser.cargo || '',
        initials: getInitials(storedUser.name || storedUser.nome || 'U'),
        abonos: 0, // Esses valores podem vir da API posteriormente
        bancoHoras: 0,
        diasCompensacao: 0,
        diasFeriasDisponiveis: 0,
        jornadaTrabalho: {
          inicio: '08:00',
          fimManha: '12:00',
          inicioTarde: '13:00',
          fim: '17:00',
          toleranciaAtraso: 10
        }
      });

      console.log("✅ Dados do usuário definidos:", {
        id: storedUser.id,
        nome: storedUser.name || storedUser.nome,
        email: storedUser.email
      });

      // ✅ TENTAR BUSCAR DADOS ADICIONAIS DA API (opcional)
      try {
        console.log("🔄 Tentando buscar perfil adicional da API...");
        const response = await api.get(`/usuarios/${storedUser.id}`);
        
        if (response.data) {
          console.log("📦 Dados adicionais da API:", response.data);
          
          // Atualizar com dados mais completos da API
          setUserData(prevData => ({
            ...prevData,
            nome: response.data.nome || prevData.nome,
            email: response.data.email || prevData.email,
            departamento: response.data.departamento || prevData.departamento,
            cargo: response.data.cargo || prevData.cargo,
            initials: getInitials(response.data.nome || prevData.nome)
          }));
        }
      } catch (apiError) {
        console.log("⚠️ Não foi possível buscar dados adicionais da API, usando dados do localStorage");
        // Não é um erro crítico, continua com os dados do localStorage
      }

      // ✅ CARREGAR DADOS RELACIONADOS
      if (storedUser.id) {
        await Promise.all([
          fetchClockHistory(storedUser.id),
          fetchNotifications(storedUser.id),
          fetchEmployeeData(storedUser.id),
          fetchMonthlyHistory(storedUser.id)
        ]);
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados do usuário:', error);
      
      // ✅ REMOVER O CÓDIGO DE DESENVOLVIMENTO QUE ESTAVA CAUSANDO O PROBLEMA
      // if (process.env.NODE_ENV === 'development') {
      //   console.log("Ambiente de desenvolvimento detectado. Usando ID fixa para testes.");
      //   setUserData(prevState => ({
      //     ...prevState,
      //     id: 2, // ID fixa para testes
      //     nome: 'Funcionário Teste', // ❌ ISSO ESTAVA SOBRESCREVENDO O NOME REAL
      //   }));
      // }
      
      // Se há erro crítico, redirecionar para login
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };
  
  fetchUserData();
  
  // Atualizar hora atual a cada segundo
  const timer = setInterval(() => {
    setCurrentTime(new Date());
  }, 1000);
  
  return () => clearInterval(timer);
}, [navigate]);

// ✅ TAMBÉM ATUALIZE A FUNÇÃO fetchClockHistory PARA USAR OS DADOS CORRETOS:

const fetchClockHistory = async (funcionarioId) => {
  try {
    console.log(`🔄 Buscando histórico de ponto para funcionário ID ${funcionarioId}`);
    const response = await api.get(`/registros-ponto/funcionario/${funcionarioId}`);
    
    if (response.data) {
      const formattedEntries = response.data.map(entry => ({
        id: entry.id,
        type: entry.tipo,
        time: format(new Date(`2000-01-01T${entry.horaRegistro}`), 'HH:mm'),
        date: format(new Date(entry.dataRegistro), 'dd/MM/yyyy'),
        status: entry.status,
        atraso: entry.atraso,
        ajustado: entry.ajustado,
        employeeId: funcionarioId,
        employeeName: userData.nome || 'Usuário', // ✅ Usar nome real
        registeredBy: entry.registradoPor || 'app'
      }));
      
      console.log("✅ Entradas formatadas:", formattedEntries);
      setTimeEntries(formattedEntries);
      
      // Determinar estado dos botões de registro com base no último registro
      updateRegistrationButtonState(formattedEntries);
      
      // Verificar solicitações pendentes
      const pendingEntriesObj = {};
      if (funcionarioId) {
        try {
          const pendingResponse = await api.get(`/solicitacoes-ajuste/funcionario/${funcionarioId}`);
          if (pendingResponse.data) {
            pendingResponse.data.forEach(solicitacao => {
              if (solicitacao.status === 'pendente') {
                pendingEntriesObj[solicitacao.registroPontoId] = true;
              }
            });
          }
        } catch (err) {
          console.error('❌ Erro ao verificar solicitações pendentes:', err);
        }
      }
      setPendingEntries(pendingEntriesObj);
    }
  } catch (error) {
    console.error('❌ Erro ao buscar histórico de ponto:', error);
  }
};
  // Função para atualizar o estado dos botões de registro
  const updateRegistrationButtonState = (entries) => {
    const today = format(new Date(), 'dd/MM/yyyy');
    const todayEntries = entries.filter(entry => entry.date === today);
    
    if (todayEntries.length > 0) {
      // Ordenar do mais recente para o mais antigo
      const sortedEntries = [...todayEntries].sort((a, b) => {
        const timeA = a.time.split(':').map(Number);
        const timeB = b.time.split(':').map(Number);
        
        if (timeA[0] !== timeB[0]) return timeB[0] - timeA[0];
        return timeB[1] - timeA[1];
      });
      
      const lastEntry = sortedEntries[0];
      
      // Verificar o limite de 5 registros por dia
      if (todayEntries.length >= 5) {
        setEntryCount(5);
        // Verificar se deve ativar o cooldown
        const now = new Date();
        const lastEntryTime = new Date(`${today.split('/').reverse().join('-')}T${lastEntry.time}:00`);
        const timeDifference = now - lastEntryTime;
        const fourHoursInMs = 4 * 60 * 60 * 1000;
        
        if (timeDifference < fourHoursInMs) {
          setCooldownActive(true);
          const cooldownEnd = new Date(lastEntryTime.getTime() + fourHoursInMs);
          setCooldownEndTime(cooldownEnd.toISOString());
        } else {
          // O cooldown já passou
          setCooldownActive(false);
          setEntryCount(todayEntries.length);
        }
      } else {
        setEntryCount(todayEntries.length);
        setCooldownActive(false);
      }
      
      // Atualizar os botões com base no último registro
      if (lastEntry.type === 'entrada') {
        setCanRegisterEntry(false);
        setCanRegisterExit(true);
      } else if (lastEntry.type === 'saída') {
        setCanRegisterEntry(true);
        setCanRegisterExit(false);
      }
    } else {
      // Sem registros hoje
      setCanRegisterEntry(true);
      setCanRegisterExit(false);
      setEntryCount(0);
      setCooldownActive(false);
    }
  };
  
  // Função para buscar notificações
  const fetchNotifications = async (funcionarioId) => {
    try {
      const response = await api.get(`/notificacoes/funcionario/${funcionarioId}`);
      
      if (response.data) {
        const formattedNotifications = response.data.map(notification => ({
          id: notification.id,
          text: notification.mensagem,
          read: notification.lida,
          date: format(new Date(notification.dataCriacao), 'dd/MM/yyyy'),
          urgent: notification.urgente
        }));
        
        setNotifications(formattedNotifications);
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    }
  };
  
  // Função para buscar os dados completos do funcionário
  const fetchEmployeeData = async (funcionarioId) => {
    try {
      const response = await api.get(`/funcionarios-completo/${funcionarioId}`);
      
      if (response.data.success) {
        const data = response.data.data;
        
        const formattedHorasExtras = data.horasExtras.map(he => ({
          data: format(new Date(he.data), 'dd/MM/yyyy'),
          quantidade: `${he.quantidade.toFixed(1)}h`,
          motivo: he.motivo,
          status: he.status
        }));
        
        const formattedFerias = {
          disponivel: data.diasFeriasDisponiveis,
          proximas: {
            inicio: data.ferias.proximas.inicio ? format(new Date(data.ferias.proximas.inicio), 'dd/MM/yyyy') : null,
            fim: data.ferias.proximas.fim ? format(new Date(data.ferias.proximas.fim), 'dd/MM/yyyy') : null
          },
          historico: data.ferias.historico.map(h => ({
            inicio: format(new Date(h.inicio), 'dd/MM/yyyy'),
            fim: format(new Date(h.fim), 'dd/MM/yyyy'),
            dias: h.dias,
            aprovadoPor: h.aprovadoPor
          }))
        };
        
        const formattedFolgas = data.folgas.map(f => ({
          data: format(new Date(f.data), 'dd/MM/yyyy'),
          tipo: f.tipo,
          motivo: f.motivo,
          status: f.status
        }));
        
        const formattedBancoHoras = {
          saldo: `${data.bancoHoras.toFixed(1)}h`,
          entradas: data.bancoHorasDetalhes.entradas.map(e => ({
            data: format(new Date(e.data), 'dd/MM/yyyy'),
            quantidade: `${e.quantidade.toFixed(1)}h`,
            origem: e.origem
          })),
          saidas: data.bancoHorasDetalhes.saidas.map(s => ({
            data: format(new Date(s.data), 'dd/MM/yyyy'),
            quantidade: `${s.quantidade.toFixed(1)}h`,
            motivo: s.motivo
          }))
        };
        
        const formattedAusencias = data.ausencias.map(a => ({
          data: format(new Date(a.data), 'dd/MM/yyyy'),
          tipo: a.tipo,
          justificativa: a.justificativa,
          status: a.status
        }));
        
        const jornada = {
          inicio: data.jornada?.inicio || '08:00',
          fimManha: data.jornada?.fimManha || '12:00',
          inicioTarde: data.jornada?.inicioTarde || '13:00',
          fim: data.jornada?.fim || '17:00',
          toleranciaAtraso: data.jornada?.toleranciaAtraso || 10
        };
        
        setEmployeeData({
          horasExtras: formattedHorasExtras,
          ferias: formattedFerias,
          folgas: formattedFolgas,
          bancoHoras: formattedBancoHoras,
          ausencias: formattedAusencias,
          jornada: jornada
        });
      }
    } catch (error) {
      console.error('Erro ao buscar dados completos do funcionário:', error);
    }
  };
  // Função para buscar o histórico mensal
  const fetchMonthlyHistory = async (funcionarioId) => {
    try {
      // Obter o ano atual
      const currentYear = new Date().getFullYear();
      
      const response = await api.get(`/historico/anual/${funcionarioId}/${currentYear}`);
      
      if (response.data) {
        const formattedHistory = response.data.map(month => ({
          month: month.mes,
          workHours: `${month.horasTrabalhadas.toFixed(1)}h`,
          overtime: `${month.horasExtras.toFixed(1)}h`,
          absences: month.ausencias.toString(),
          adjustments: month.ajustes.toString(),
          entries: month.registrosDiarios?.map(reg => ({
            date: format(new Date(reg.data), 'dd/MM/yyyy'),
            type: reg.tipoRegistro,
            time: reg.horaRegistro,
            status: 'aprovado',
            atraso: reg.temAtraso
          })) || [],
          ausenciasDetalhes: month.ausenciasDetalhes || []
        }));
        
        setMonthlyHistory(formattedHistory);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico mensal:', error);
    }
  };
  
  // Efeito para calcular estatísticas
  useEffect(() => {
    // Calcular horas trabalhadas na semana
    const calcularHorasSemanais = () => {
      // Filtrar registros da semana atual
      const hoje = new Date();
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - hoje.getDay()); // Domingo como início da semana
      
      const registrosSemana = timeEntries.filter(entry => {
        const [dia, mes, ano] = entry.date.split('/').map(Number);
        const dataEntrada = new Date(ano, mes - 1, dia);
        return dataEntrada >= inicioSemana;
      });
      
      // Agrupar por dia e calcular horas
      let horasTotais = 0;
      let minutosTotais = 0;
      
      const registrosPorDia = {};
      registrosSemana.forEach(entry => {
        if (!registrosPorDia[entry.date]) {
          registrosPorDia[entry.date] = [];
        }
        registrosPorDia[entry.date].push(entry);
      });
      
      Object.values(registrosPorDia).forEach(entriesDoDia => {
        entriesDoDia.sort((a, b) => {
          const timeA = a.time.split(':').map(Number);
          const timeB = b.time.split(':').map(Number);
          
          if (timeA[0] !== timeB[0]) return timeA[0] - timeB[0];
          return timeA[1] - timeB[1];
        });
        
        for (let i = 0; i < entriesDoDia.length; i += 2) {
          if (i + 1 < entriesDoDia.length) {
            const entrada = entriesDoDia[i];
            const saida = entriesDoDia[i + 1];
            
            if (entrada.type === 'entrada' && saida.type === 'saída') {
              const [horas, minutos] = calcularHorasTrabalhadas(entrada.time, saida.time);
              
              horasTotais += horas;
              minutosTotais += minutos;
            }
          }
        }
      });
      
      // Normalizar minutos
      horasTotais += Math.floor(minutosTotais / 60);
      minutosTotais %= 60;
      
      return `${horasTotais}h ${minutosTotais}min`;
    };
    
    // Calcular horas extras do mês atual
    const calcularHorasExtras = () => {
      if (!employeeData.horasExtras.length) return '0h 0min';
      
      // Filtrar horas extras do mês atual e aprovadas
      const hoje = new Date();
      const mesAtual = hoje.getMonth() + 1;
      const anoAtual = hoje.getFullYear();
      
      const horasExtrasMes = employeeData.horasExtras.filter(he => {
        const [dia, mes, ano] = he.data.split('/').map(Number);
        return mes === mesAtual && ano === anoAtual && he.status === 'aprovado';
      });
      
      // Somar horas extras
      let horasTotal = 0;
      let minutosTotal = 0;
      
      horasExtrasMes.forEach(he => {
        const horasStr = he.quantidade.replace('h', '');
        horasTotal += parseFloat(horasStr) || 0;
      });
      
      // Formatar resultado
      const horasInteiras = Math.floor(horasTotal);
      minutosTotal = Math.round((horasTotal - horasInteiras) * 60);
      
      return `${horasInteiras}h ${minutosTotal}min`;
    };
    
    // Buscar próxima folga
    const buscarProximaFolga = () => {
      if (!employeeData.folgas.length) return '';
      
      // Filtrar folgas futuras e aprovadas
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const proximasFolgas = employeeData.folgas
        .filter(folga => {
          const [dia, mes, ano] = folga.data.split('/').map(Number);
          const dataFolga = new Date(ano, mes - 1, dia);
          return dataFolga >= hoje && folga.status === 'aprovado';
        })
        .sort((a, b) => {
          const [diaA, mesA, anoA] = a.data.split('/').map(Number);
          const [diaB, mesB, anoB] = b.data.split('/').map(Number);
          
          const dataA = new Date(anoA, mesA - 1, diaA);
          const dataB = new Date(anoB, mesB - 1, diaB);
          
          return dataA - dataB;
        });
      
      return proximasFolgas.length > 0 ? proximasFolgas[0].data : '';
    };
    
    // Atualizar estatísticas quando houver mudanças nos dados
    if (timeEntries.length > 0) {
      setHorasSemanais(calcularHorasSemanais());
    }
    
    if (employeeData.horasExtras.length > 0) {
      setHorasExtras(calcularHorasExtras());
    }
    
    setProximaFolga(buscarProximaFolga());
  }, [timeEntries, employeeData]);
  // Efeito para verificar cooldown do registro de ponto
  useEffect(() => {
    let interval;
    if (cooldownActive && cooldownEndTime) {
      interval = setInterval(() => {
        const now = new Date();
        const endTime = new Date(cooldownEndTime);
        const timeLeft = endTime - now;
        
        if (timeLeft <= 0) {
          setCooldownActive(false);
          setCooldownEndTime(null);
          setEntryCount(0);
          clearInterval(interval);
        } else {
          const hours = Math.floor(timeLeft / (1000 * 60 * 60));
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
          setTimeUntilReset(`${hours}h ${minutes}m ${seconds}s`);
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cooldownActive, cooldownEndTime]);
  
  // Efeito para o timer do modal de correção
  useEffect(() => {
    let timer;
    if (activeTab === 'marcacoes' && correctionModalVisible) {
      timer = setInterval(() => {
        setTimeUntilHide(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setCorrectionModalVisible(false);
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeTab, correctionModalVisible]);
  // Função para registrar ponto
  const registerTimeEntry = async (tipo) => {
    console.log("Botão de " + tipo + " clicado");
    
    if (!userData.id) {
      console.error("ID do usuário não encontrado");
      alert("Erro: ID do usuário não encontrado. Tente fazer login novamente.");
      return;
    }
    
    // Verificar limites de registro
    if (entryCount >= 5 && cooldownActive) {
      setShowLimitModal(true);
      return;
    }
    
    try {
      const now = new Date();
      console.log("Enviando registro de ponto:", {
        funcionarioId: userData.id,
        tipo: tipo,
        hora: format(now, 'HH:mm:ss'),
        data: format(now, 'yyyy-MM-dd'),
        registradoPor: 'app'
      });
      
      // Enviar registro para a API
      const response = await api.post('/registros-ponto/registrar', {
        funcionarioId: userData.id,
        tipo: tipo,
        hora: format(now, 'HH:mm:ss'),
        data: format(now, 'yyyy-MM-dd'),
        registradoPor: 'app'
      });
      
      console.log("Resposta da API:", response.data);
      
      if (response.data) {
        // Atualizar histórico de registros
        await fetchClockHistory(userData.id);
        
        // Adicionar mensagem de sucesso
        const statusMessage = response.data.atraso ? 
          `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} com atraso registrada às ${format(now, 'HH:mm')}` : 
          `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} registrada às ${format(now, 'HH:mm')}`;
        
        setLastAction(statusMessage);
        
        // Incrementar contador de registros
        const newCount = entryCount + 1;
        setEntryCount(newCount);
        
        // Verificar se atingiu o limite
        if (newCount >= 5 && !cooldownActive) {
          const cooldownEnd = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 horas de cooldown
          setCooldownActive(true);
          setCooldownEndTime(cooldownEnd.toISOString());
          setShowLimitModal(true);
        }
        
        // Atualizar estado dos botões
        if (tipo === 'entrada') {
          setCanRegisterEntry(false);
          setCanRegisterExit(true);
        } else {
          setCanRegisterEntry(true);
          setCanRegisterExit(false);
        }
      }
    } catch (error) {
      console.error('Erro ao registrar ponto:', error);
      alert('Erro ao registrar ponto. Por favor, tente novamente.');
    }
  };
  // Função para lidar com a seleção de arquivo
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Verificar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('O arquivo é muito grande. O tamanho máximo é 5MB.');
        return;
      }
      
      // Verificar tipo
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('Tipo de arquivo não permitido. Apenas PDF, JPG e PNG são aceitos.');
        return;
      }
      
      setSelectedFile(file);
    }
  };
  
  // Função para enviar atestado médico
  const submitMedicalCertificate = async () => {
    if (!selectedFile || !userData.id) return;
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('funcionarioId', userData.id);
      
      // Obter a data selecionada no modal
      const dataInput = document.querySelector('input[type="date"]');
      formData.append('dataInicio', dataInput.value);
      formData.append('dataFim', dataInput.value);
      formData.append('motivo', 'Atestado médico');
      
      // Enviar para a API
      const response = await api.post('/upload/atestado', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
    if (response.data.success) {
        // Fechar modal e limpar seleção
        setShowAttachModal(false);
        setSelectedFile(null);
        setFileInputKey(Date.now());
        
        // Exibir mensagem de sucesso
        setLastAction('Atestado médico enviado com sucesso!');
        
        // Atualizar dados
        fetchEmployeeData(userData.id);
        fetchNotifications(userData.id);
      }
    } catch (error) {
      console.error('Erro ao enviar atestado:', error);
      alert('Erro ao enviar atestado. Por favor, tente novamente.');
    }
  };
  
  // Função para cancelar envio de atestado
  const cancelMedicalCertificate = () => {
    setShowAttachModal(false);
    setSelectedFile(null);
    setFileInputKey(Date.now());
  };
  // Função para marcar notificação como lida
  const markAsRead = async (id) => {
    try {
      await api.put(`/notificacoes/${id}/lida`);
      
      // Atualizar lista de notificações
      setNotifications(notifications.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      ));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };
  
  // Função para marcar todas as notificações como lidas
  const markAllAsRead = async () => {
    if (!userData.id) return;
    
    try {
      await api.put(`/notificacoes/funcionario/${userData.id}/todas-lidas`);
      
      // Atualizar lista de notificações
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
    }
  };
  
  // Função para logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
  
  // Função para abrir o modal de correção
  const openCorrectionModal = (entry) => {
    setSelectedEntry(entry);
    setCorrectionData({
      date: entry.date,
      time: entry.time,
      reason: '',
      newTime: entry.time
    });
    setShowCorrectionModal(true);
  };
  
  // Função para iniciar o timer de ocultar modal
  const startHideTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearInterval(timeoutRef.current);
    }
    
    timeoutRef.current = setInterval(() => {
      setTimeUntilHide(prev => {
        if (prev <= 1) {
          clearInterval(timeoutRef.current);
          setCorrectionModalVisible(false);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);
  // Função para submeter solicitação de correção
  const submitCorrection = async () => {
    if (!selectedEntry || !correctionData.reason || !correctionData.newTime || !userData.id) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    try {
      console.log("Enviando solicitação de correção:", {
        funcionarioId: userData.id,
        registroPontoId: selectedEntry.id,
        data: correctionData.date.split('/').reverse().join('-'),
        tipoRegistro: selectedEntry.type,
        horaOriginal: selectedEntry.time + ':00',
        horaCorreta: correctionData.newTime + ':00',
        motivo: correctionData.reason
      });
      
      // Enviar solicitação para a API
      const response = await api.post('/solicitacoes-ajuste/criar', {
        funcionarioId: userData.id,
        registroPontoId: selectedEntry.id,
        data: correctionData.date.split('/').reverse().join('-'), // Converter para formato yyyy-MM-dd
        tipoRegistro: selectedEntry.type,
        horaOriginal: selectedEntry.time + ':00',
        horaCorreta: correctionData.newTime + ':00',
        motivo: correctionData.reason
      });
      
      console.log("Resposta da API:", response.data);
      
      if (response.data.success) {
        // Fechar modal
        setShowCorrectionModal(false);
        
        // Exibir mensagem de sucesso
        setLastAction('Solicitação de correção enviada para aprovação');
        
        // Atualizar a lista de entradas pendentes
        const newPendingEntries = { ...pendingEntries };
        newPendingEntries[selectedEntry.id] = true;
        setPendingEntries(newPendingEntries);
        
        // Mostrar modal de solicitações pendentes
        setCorrectionModalVisible(true);
        setTimeUntilHide(10);
        startHideTimer();
        setAlertVisible(false);
        
        // Atualizar dados
        fetchNotifications(userData.id);
      }
    } catch (error) {
      console.error('Erro ao enviar solicitação de correção:', error);
      alert('Erro ao enviar solicitação. Por favor, tente novamente.');
    }
  };
  
  // Função para visualizar detalhes do histórico mensal
  const viewHistoryDetails = (month) => {
    setSelectedHistoryMonth(month);
    setShowHistoryDetailsModal(true);
  };
  
  // Função para verificar se um registro já tem solicitação de correção pendente
  const temSolicitacaoPendente = async (entryId) => {
    try {
      // Buscar solicitações pendentes para o registro
      const response = await api.get(`/solicitacoes-ajuste/funcionario/${userData.id}`);
      
      if (response.data) {
        return response.data.some(
          s => s.registroPontoId === entryId && s.status === 'pendente'
        );
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao verificar solicitações pendentes:', error);
      return false;
    }
  };

  // Contador de notificações não lidas
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Tela de loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-purple-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-purple-300">Carregando...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-black text-white">
    
{/* Header */}
<header className="bg-purple-900 bg-opacity-80 shadow-lg sticky top-0 z-10">
  <div className="container mx-auto px-4 py-3 flex justify-between items-center">
    <div className="flex items-center">
      <div className="bg-purple-600 rounded-full p-1 mr-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <span className="text-xl font-bold">CuidaEmprego</span>
    </div>
    <div className="flex items-center space-x-4">
      {/* Notificações - código existente... */}
      
      {/* ✅ PERFIL DO USUÁRIO COM NOME REAL */}
      <div className="relative">
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="flex items-center space-x-2 focus:outline-none"
        >
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
            <span className="font-medium text-sm">{userData.initials}</span>
          </div>
          {/* ✅ MOSTRAR O NOME REAL DO FUNCIONÁRIO */}
          <span className="hidden md:inline-block">{userData.nome}</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showProfileMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-purple-800 rounded-md shadow-lg py-1 z-20">
            <div className="px-4 py-2 border-b border-purple-700">
              {/* ✅ NOME REAL NO DROPDOWN */}
              <p className="text-sm font-medium">{userData.nome}</p>
              <p className="text-xs text-purple-300">{userData.email}</p>
              {userData.cargo && (
                <p className="text-xs text-purple-400">{userData.cargo}</p>
              )}
            </div>
            <a href="#" className="block px-4 py-2 text-sm hover:bg-purple-700">Meu Perfil</a>
            <a href="#" className="block px-4 py-2 text-sm hover:bg-purple-700">Configurações</a>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-purple-700"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
</header>

{/* ✅ TAMBÉM ADICIONE UMA SEÇÃO DE BOAS-VINDAS APÓS O HEADER */}
<div className="bg-purple-800 bg-opacity-60 px-4 py-3">
  <div className="container mx-auto">
    <h1 className="text-lg font-medium text-white">
      👋 Bem-vindo, <span className="font-bold text-purple-200">{userData.nome}</span>!
    </h1>
    {userData.cargo && userData.departamento && (
      <p className="text-sm text-purple-300">
        {userData.cargo} • {userData.departamento}
      </p>
    )}
  </div>
</div>
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Relógio */}
        <div className="text-center mb-8">
          <p className="text-sm text-purple-300">{currentTime.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p className="text-4xl font-bold text-white">{formatTime(currentTime)}</p>
          {lastAction && (
            <div className="mt-2 text-sm bg-purple-600 inline-block px-3 py-1 rounded-full">
              {lastAction}
            </div>
          )}
        </div>
        {/* Botões de Ação */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={() => {
              console.log("Botão de entrada clicado");
              registerTimeEntry('entrada');
            }}
            disabled={!canRegisterEntry || (cooldownActive && entryCount >= 5)}
            className={`w-full sm:w-64 font-bold py-4 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center
              ${(canRegisterEntry && (!cooldownActive || entryCount < 5))
                ? 'bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white'
                : 'bg-gray-600 cursor-not-allowed opacity-60 text-gray-300'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            {cooldownActive && entryCount >= 5
              ? `Aguarde ${timeUntilReset}`
              : "Registrar Entrada"}
          </button>
          <button
            onClick={() => {
              console.log("Botão de saída clicado");
              registerTimeEntry('saída');
            }}
            disabled={!canRegisterExit || (cooldownActive && entryCount >= 5)}
            className={`w-full sm:w-64 font-bold py-4 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center
              ${(canRegisterExit && (!cooldownActive || entryCount < 5))
                ? 'bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white'
                : 'bg-gray-600 cursor-not-allowed opacity-60 text-gray-300'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {cooldownActive && entryCount >= 5
              ? `Aguarde ${timeUntilReset}`
              : "Registrar Saída"}
          </button>
          <button
            onClick={() => setShowAttachModal(true)}
            className="w-full sm:w-64 bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white font-bold py-4 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Enviar Atestado Médico
          </button>
          
          {/* Botão para ver dados do colaborador */}
          <button
            onClick={() => setShowEmployeeDataModal(true)}
            className="w-full sm:w-64 bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white font-bold py-4 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Ver Dados do Colaborador
          </button>
        </div>
        {/* Status de solicitações pendentes */}
        {(() => {
          // Verificar se existem solicitações pendentes
          const solicitacoesPendentes = notifications.filter(
            n => n.text.includes('Solicitação de correção') && !n.read
          );
          
          if (solicitacoesPendentes.length > 0 && alertVisible) {
            return (
              <div className="bg-yellow-600 bg-opacity-40 backdrop-blur-sm rounded-lg p-3 mb-5 flex items-center justify-between">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Você tem {solicitacoesPendentes.length} solicitação(ões) de correção de ponto pendente(s) de aprovação.</span>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => {
                      setActiveTab('marcacoes');
                      setCorrectionModalVisible(true);
                      setTimeUntilHide(10);
                      startHideTimer();
                      setAlertVisible(false);
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded-md text-sm font-medium"
                  >
                    Ver Detalhes
                  </button>
                  <button
                    onClick={() => setAlertVisible(false)}
                    className="text-yellow-300 hover:text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Tabs para diferentes seções */}
        <div className="mb-6">
          <div className="flex overflow-x-auto space-x-2 bg-purple-800 bg-opacity-30 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('registros')}
              className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${activeTab === 'registros' ? 'bg-purple-600' : 'hover:bg-purple-700'}`}
            >
              Registros Recentes
            </button>
            <button
              onClick={() => setActiveTab('marcacoes')}
              className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${activeTab === 'marcacoes' ? 'bg-purple-600' : 'hover:bg-purple-700'}`}
            >
              Marcações e Correções
            </button>
            <button
              onClick={() => setActiveTab('historico')}
              className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${activeTab === 'historico' ? 'bg-purple-600' : 'hover:bg-purple-700'}`}
            >
              Histórico Mensal
            </button>
            <button
              onClick={() => setActiveTab('justificativa')}
              className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${activeTab === 'justificativa' ? 'bg-purple-600' : 'hover:bg-purple-700'}`}
            >
              Justificativa de Ausência
            </button>
          </div>
        </div>
        {/* Conteúdo da tab Registros Recentes */}
        {activeTab === 'registros' && (
          <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-lg shadow-lg p-4 mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Registros Recentes
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-purple-300 text-sm">
                    <th className="text-left p-2">Data</th>
                    <th className="text-left p-2">Hora</th>
                    <th className="text-left p-2">Tipo</th>
                    <th className="text-left p-2">Registrado Por</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {timeEntries
                    .filter(entry => entry.employeeId === userData.id)
                    .slice(0, 10)
                    .map((entry, index) => (
                      <tr key={entry.id || index} className="border-t border-purple-700">
                        <td className="p-2">{entry.time}</td>
                        <td className="p-2">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${entry.type === 'entrada' ? 'bg-green-600' : 'bg-red-600'}`}>
                            {entry.type ? entry.type.toUpperCase() : 'N/A'}
                          </span>
                        </td>
                        <td className="p-2">{entry.registeredBy || userData.nome}</td>
                        <td className="p-2">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs
                            ${entry.status === 'aprovado' ? 'bg-green-700' :
                              entry.status === 'pendente' ? 'bg-yellow-600' : 'bg-red-700'}`}>
                            {entry.status ? entry.status.toUpperCase() : 'N/A'}
                          </span>
                          {entry.ajustado && 
                            <span className="ml-2 text-xs text-purple-300">(Ajustado)</span>
                          }
                        </td>
                        <td className="p-2">
                          {entry.atraso ? (
                            <span className="inline-block px-2 py-1 rounded-full text-xs bg-orange-600">
                              ATRASO
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 rounded-full text-xs bg-green-600">
                              NORMAL
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  {timeEntries.filter(entry => entry.employeeId === userData.id).length === 0 && (
                    <tr className="border-t border-purple-700">
                      <td colSpan="6" className="p-4 text-center text-gray-400">
                        Você não possui registros de ponto.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Componente para limpar registros */}
            <BotaoLimparPontos 
              userData={userData}
              setTimeEntries={setTimeEntries}
              setLastAction={setLastAction}
              api={api}
            />
          </div>
        )}
        {/* Conteúdo da tab Marcações e Correções */}
        {activeTab === 'marcacoes' && (
          <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-lg shadow-lg p-4 mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Marcações e Correções
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-purple-300 text-sm">
                    <th className="text-left p-2">Data</th>
                    <th className="text-left p-2">Hora</th>
                    <th className="text-left p-2">Tipo</th>
                    <th className="text-left p-2">Registrado Por</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Situação</th>
                    <th className="text-left p-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {timeEntries
                    .filter(entry => entry.employeeId === userData.id)
                    .map((entry, index) => (
                      <tr key={entry.id || index} className="border-t border-purple-700">
                        <td className="p-2">{entry.date}</td>
                        <td className="p-2">{entry.time}</td>
                        <td className="p-2">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${entry.type === 'entrada' ? 'bg-green-600' : 'bg-red-600'}`}>
                            {entry.type ? entry.type.toUpperCase() : 'N/A'}
                          </span>
                        </td>
                        <td className="p-2">{entry.registeredBy || userData.nome}</td>
                        <td className="p-2">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs
                            ${entry.status === 'aprovado' ? 'bg-green-700' :
                              entry.status === 'pendente' ? 'bg-yellow-600' : 'bg-red-700'}`}>
                            {entry.status ? entry.status.toUpperCase() : 'N/A'}
                          </span>
                          {entry.ajustado && 
                            <span className="ml-2 text-xs text-purple-300">(Ajustado)</span>
                          }
                        </td>
                        <td className="p-2">
                          {entry.atraso ? (
                            <span className="inline-block px-2 py-1 rounded-full text-xs bg-orange-600">
                              ATRASO
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 rounded-full text-xs bg-green-600">
                              NORMAL
                            </span>
                          )}
                        </td>
                        <td className="p-2">
                          {pendingEntries[entry.id] ? (
                            <span className="inline-block px-2 py-1 rounded-full text-xs bg-yellow-600">
                              CORREÇÃO PENDENTE
                            </span>
                          ) : (
                            <button
                              onClick={() => openCorrectionModal(entry)}
                              className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 rounded-md"
                            >
                              Solicitar Correção
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                  {timeEntries.filter(entry => entry.employeeId === userData.id).length === 0 && (
                    <tr className="border-t border-purple-700">
                      <td colSpan="7" className="p-4 text-center text-gray-400">
                        Você não possui registros de ponto.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Componente para limpar registros */}
            <BotaoLimparPontos 
              userData={userData}
              setTimeEntries={setTimeEntries}
              setLastAction={setLastAction}
              api={api}
            />
          </div>
        )}
        {/* Conteúdo da tab Histórico Mensal */}
        {activeTab === 'historico' && (
          <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-lg shadow-lg p-4 mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Histórico Mensal
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-purple-300 text-sm">
                    <th className="text-left p-2">Mês</th>
                    <th className="text-left p-2">Horas Trabalhadas</th>
                    <th className="text-left p-2">Horas Extras</th>
                    <th className="text-left p-2">Ausências</th>
                    <th className="text-left p-2">Ajustes</th>
                    <th className="text-left p-2">Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyHistory.map((month, index) => (
                    <tr key={index} className="border-t border-purple-700">
                      <td className="p-2">{month.month}</td>
                      <td className="p-2">{month.workHours}</td>
                      <td className="p-2">{month.overtime}</td>
                      <td className="p-2">{month.absences}</td>
                      <td className="p-2">{month.adjustments}</td>
                      <td className="p-2">
                        <button
                          onClick={() => viewHistoryDetails(month)}
                          className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 rounded-md"
                        >
                          Ver Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                  {monthlyHistory.length === 0 && (
                    <tr className="border-t border-purple-700">
                      <td colSpan="6" className="p-4 text-center text-gray-400">
                        Nenhum histórico mensal disponível.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Conteúdo da tab Justificativa de Ausência */}
        {activeTab === 'justificativa' && (
          <JustificativaAusencia 
            userData={userData} 
            setLastAction={setLastAction} 
            setNotifications={setNotifications} 
            notifications={notifications}
            api={api}
            fetchNotifications={() => fetchNotifications(userData.id)}
            fetchEmployeeData={() => fetchEmployeeData(userData.id)}
          />
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-lg shadow-lg p-4">
            <h3 className="text-sm text-purple-300 mb-1">Horas Trabalhadas (Esta Semana)</h3>
            <p className="text-2xl font-bold">{horasSemanais}</p>
          </div>
          <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-lg shadow-lg p-4">
            <h3 className="text-sm text-purple-300 mb-1">Horas Extras (Este Mês)</h3>
            <p className="text-2xl font-bold">{horasExtras}</p>
          </div>
          <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-lg shadow-lg p-4">
            <h3 className="text-sm text-purple-300 mb-1">Próxima Folga</h3>
            <p className="text-2xl font-bold">{proximaFolga || 'Nenhuma agendada'}</p>
          </div>
        </div>
      </main>
      {/* Modais */}
      {/* Modal para anexar atestado médico */}
      {showAttachModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-purple-900 rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Enviar Atestado Médico</h3>
              <button
                onClick={cancelMedicalCertificate}
                className="text-purple-300 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Data da Ausência</label>
              <input
                type="date"
                className="w-full px-3 py-2 bg-purple-800 border border-purple-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                defaultValue={currentTime.toISOString().split('T')[0]}
                onClick={e => e.stopPropagation()}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Horário</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-purple-300 mb-1">Início</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 bg-purple-800 border border-purple-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    defaultValue="08:00"
                    onClick={e => e.stopPropagation()}
                  />
                </div>
                <div>
                  <label className="block text-xs text-purple-300 mb-1">Fim</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 bg-purple-800 border border-purple-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    defaultValue="18:00"
                    onClick={e => e.stopPropagation()}
                  />
                </div>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Anexar Atestado</label>
              <div
                className="relative border-2 border-dashed border-purple-600 rounded-md p-4 text-center"
                onClick={e => e.stopPropagation()}
              >
                {selectedFile ? (
                  <div>
                    <p className="text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-purple-300 mt-1">{Math.round(selectedFile.size / 1024)} KB</p>
                    <button
                      onClick={() => {
                        setSelectedFile(null);
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
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelMedicalCertificate}
                className="px-4 py-2 bg-purple-800 hover:bg-purple-700 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={submitMedicalCertificate}
                disabled={!selectedFile}
                className={`px-4 py-2 rounded-md ${selectedFile ? 'bg-purple-600 hover:bg-purple-500' : 'bg-purple-900 opacity-50 cursor-not-allowed'}`}
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal para solicitar correção de registro */}
      {showCorrectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-purple-900 rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Solicitar Correção de Registro</h3>
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="text-purple-300 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="bg-purple-800 bg-opacity-50 p-3 rounded-lg mb-4">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">Sua solicitação será enviada para aprovação do administrador e ficará pendente até que seja analisada.</span>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Tipo de Registro</label>
              <div className="px-3 py-2 bg-purple-800 border border-purple-600 rounded-md">
                <span className={`inline-block px-2 py-1 rounded-full text-xs ${selectedEntry?.type === 'entrada' ? 'bg-green-600' : 'bg-red-600'}`}>
                  {selectedEntry?.type?.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Data do Registro</label>
              <input
                type="text"
                value={correctionData.date}
                readOnly
                className="w-full px-3 py-2 bg-purple-800 border border-purple-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Horário Registrado</label>
              <input
                type="text"
                value={correctionData.time}
                readOnly
                className="w-full px-3 py-2 bg-purple-800 border border-purple-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Horário Correto *</label>
              <input
                type="time"
                value={correctionData.newTime}
                onChange={(e) => setCorrectionData({...correctionData, newTime: e.target.value})}
                className="w-full px-3 py-2 bg-purple-800 border border-purple-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Motivo da Correção *</label>
              <textarea
                value={correctionData.reason}
                onChange={(e) => setCorrectionData({...correctionData, reason: e.target.value})}
                className="w-full px-3 py-2 bg-purple-800 border border-purple-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-20"
                placeholder="Descreva o motivo da solicitação de correção..."
                required
              />
              <span className="text-xs text-purple-300 mt-1">Forneça o máximo de detalhes possível para facilitar a análise.</span>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="px-4 py-2 bg-purple-800 hover:bg-purple-700 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={submitCorrection}
                disabled={!correctionData.reason || !correctionData.newTime}
                className={`px-4 py-2 rounded-md ${(correctionData.reason && correctionData.newTime) ? 'bg-purple-600 hover:bg-purple-500' : 'bg-purple-900 opacity-50 cursor-not-allowed'}`}
              >
                Enviar Solicitação
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal para ver detalhes do histórico mensal */}
      {showHistoryDetailsModal && selectedHistoryMonth && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-purple-900 rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Detalhes do Histórico - {selectedHistoryMonth.month}</h3>
              <button
                onClick={() => setShowHistoryDetailsModal(false)}
                className="text-purple-300 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-purple-800 bg-opacity-40 p-4 rounded-lg">
                <h4 className="text-sm text-purple-300 mb-1">Total de Horas</h4>
                <p className="text-2xl font-bold">{selectedHistoryMonth.workHours}</p>
              </div>
              <div className="bg-purple-800 bg-opacity-40 p-4 rounded-lg">
                <h4 className="text-sm text-purple-300 mb-1">Horas Extras</h4>
                <p className="text-2xl font-bold">{selectedHistoryMonth.overtime}</p>
              </div>
              <div className="bg-purple-800 bg-opacity-40 p-4 rounded-lg">
                <h4 className="text-sm text-purple-300 mb-1">Ajustes Realizados</h4>
                <p className="text-2xl font-bold">{selectedHistoryMonth.adjustments}</p>
              </div>
            </div>
            <div className="mb-6">
              <h4 className="text-lg font-medium mb-3">Marcações Diárias</h4>
              <div className="bg-purple-800 bg-opacity-30 p-4 rounded-lg overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-purple-300 text-sm">
                      <th className="text-left p-2">Data</th>
                      <th className="text-left p-2">Entrada</th>
                      <th className="text-left p-2">Saída Almoço</th>
                      <th className="text-left p-2">Retorno Almoço</th>
                      <th className="text-left p-2">Saída</th>
                      <th className="text-left p-2">Total do Dia</th>
                      <th className="text-left p-2">Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Agrupar os registros por dia
                      const registrosPorDia = {};
                      const registrosDoMes = selectedHistoryMonth.entries || [];
                      
                      // Agrupar por dia
                      registrosDoMes.forEach(entry => {
                        if (!registrosPorDia[entry.date]) {
                          registrosPorDia[entry.date] = [];
                        }
                        registrosPorDia[entry.date].push(entry);
                      });
                      
                      // Converter para array e ordenar por data
                      return Object.entries(registrosPorDia)
                        .sort(([dateA], [dateB]) => {
                          const [diaA, mesA, anoA] = dateA.split('/').map(Number);
                          const [diaB, mesB, anoB] = dateB.split('/').map(Number);
                          
                          const dataA = new Date(anoA, mesA - 1, diaA);
                          const dataB = new Date(anoB, mesB - 1, diaB);
                          
                          return dataA - dataB;
                        })
                        .map(([date, entries]) => {
                          // Ordenar entradas do dia por hora
                          entries.sort((a, b) => {
                            const timeA = a.time.split(':').map(Number);
                            const timeB = b.time.split(':').map(Number);
                            
                            if (timeA[0] !== timeB[0]) return timeA[0] - timeB[0];
                            return timeA[1] - timeB[1];
                          });
                          
                          // Encontrar entradas e saídas do dia
                          const entrada = entries.find(e => e.type === 'entrada' && new Date(`${date} ${e.time}`).getHours() < 12);
                          const saidaAlmoco = entries.find(e => e.type === 'saída' && new Date(`${date} ${e.time}`).getHours() < 13);
                          const retornoAlmoco = entries.find(e => e.type === 'entrada' && new Date(`${date} ${e.time}`).getHours() >= 12);
                          const saida = entries.find(e => e.type === 'saída' && new Date(`${date} ${e.time}`).getHours() >= 15);
                          
                          // Calcular total de horas do dia
                          let totalHoras = '—';
                          let temAtraso = false;
                          
                          if (entrada && saida) {
                            const [horasEntrada, minutosEntrada] = entrada.time.split(':').map(Number);
                            const [horasSaida, minutosSaida] = saida.time.split(':').map(Number);
                            
                            let totalMinutos = (horasSaida * 60 + minutosSaida) - (horasEntrada * 60 + minutosEntrada);
                            
                           // Descontar intervalo de almoço
                            if (saidaAlmoco && retornoAlmoco) {
                              const [horasSaidaAlmoco, minutosSaidaAlmoco] = saidaAlmoco.time.split(':').map(Number);
                              const [horasRetornoAlmoco, minutosRetornoAlmoco] = retornoAlmoco.time.split(':').map(Number);
                              
                              const intervaloMinutos = (horasRetornoAlmoco * 60 + minutosRetornoAlmoco) - (horasSaidaAlmoco * 60 + minutosSaidaAlmoco);
                              totalMinutos -= intervaloMinutos;
                            }
                            
                            // Converter para horas e minutos
                            const horas = Math.floor(totalMinutos / 60);
                            const minutos = totalMinutos % 60;
                            
                            totalHoras = `${horas}h ${minutos}min`;
                            
                            // Verificar atrasos
                            temAtraso = entrada.atraso || (retornoAlmoco && retornoAlmoco.atraso);
                          }
                          
                          return (
                            <tr key={date} className="border-t border-purple-700">
                              <td className="p-2">{date}</td>
                              <td className="p-2">{entrada ? entrada.time : '—'}</td>
                              <td className="p-2">{saidaAlmoco ? saidaAlmoco.time : '—'}</td>
                              <td className="p-2">{retornoAlmoco ? retornoAlmoco.time : '—'}</td>
                              <td className="p-2">{saida ? saida.time : '—'}</td>
                              <td className="p-2">{totalHoras}</td>
                              <td className="p-2">
                                {temAtraso ? (
                                  <span className="inline-block px-2 py-1 rounded-full text-xs bg-orange-600">
                                    ATRASO
                                  </span>
                                ) : (
                                  <span className="inline-block px-2 py-1 rounded-full text-xs bg-green-600">
                                    NORMAL
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        });
                    })()}
                    {!selectedHistoryMonth.entries || selectedHistoryMonth.entries.length === 0 && (
                      <tr>
                        <td colSpan="7" className="p-4 text-center text-gray-300">
                          Nenhum registro disponível para este mês
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mb-6">
              <h4 className="text-lg font-medium mb-3">Ausências e Justificativas</h4>
              <div className="bg-purple-800 bg-opacity-30 p-4 rounded-lg">
                {selectedHistoryMonth.absences === '0' ? (
                  <p className="text-gray-300">Nenhuma ausência registrada neste mês.</p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="text-purple-300 text-sm">
                        <th className="text-left p-2">Data</th>
                        <th className="text-left p-2">Tipo</th>
                        <th className="text-left p-2">Justificativa</th>
                        <th className="text-left p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        if (!selectedHistoryMonth.ausenciasDetalhes || selectedHistoryMonth.ausenciasDetalhes.length === 0) {
                          return (
                            <tr className="border-t border-purple-700">
                              <td colSpan="4" className="p-2 text-center text-gray-300">
                                Nenhuma ausência detalhada disponível
                              </td>
                            </tr>
                          );
                        }
                        
                        return selectedHistoryMonth.ausenciasDetalhes.map((ausencia, index) => (
                          <tr key={index} className="border-t border-purple-700">
                            <td className="p-2">{ausencia.data}</td>
                            <td className="p-2">
                              <span className="inline-block px-2 py-1 rounded-full text-xs bg-yellow-600">
                                {ausencia.tipo.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-2">{ausencia.justificativa}</td>
                            <td className="p-2">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs 
                                ${ausencia.status === 'aprovado' ? 'bg-green-600' :
                                  ausencia.status === 'pendente' ? 'bg-yellow-600' : 'bg-red-600'}`}>
                                {ausencia.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowHistoryDetailsModal(false)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-md"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Dados do Colaborador */}
      {showEmployeeDataModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-purple-900 rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Dados do Colaborador - {userData.nome}</h3>
              <button
                onClick={() => setShowEmployeeDataModal(false)}
                className="text-purple-300 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Tabs para Dados do Colaborador */}
            <div className="mb-6">
              <div className="flex overflow-x-auto space-x-2 bg-purple-800 bg-opacity-30 p-1 rounded-lg">
                <button
                  onClick={() => setActiveEmployeeTab('horasExtras')}
                  className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${activeEmployeeTab === 'horasExtras' ? 'bg-purple-600' : 'hover:bg-purple-700'}`}
                >
                  Horas Extras
                </button>
                <button
                  onClick={() => setActiveEmployeeTab('ferias')}
                  className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${activeEmployeeTab === 'ferias' ? 'bg-purple-600' : 'hover:bg-purple-700'}`}
                >
                  Férias
                </button>
                <button
                  onClick={() => setActiveEmployeeTab('folgas')}
                  className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${activeEmployeeTab === 'folgas' ? 'bg-purple-600' : 'hover:bg-purple-700'}`}
                >
                  Folgas
                </button>
                <button
                  onClick={() => setActiveEmployeeTab('bancoHoras')}
                  className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${activeEmployeeTab === 'bancoHoras' ? 'bg-purple-600' : 'hover:bg-purple-700'}`}
                >
                  Banco de Horas
                </button>
                <button
                  onClick={() => setActiveEmployeeTab('ausencias')}
                  className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${activeEmployeeTab === 'ausencias' ? 'bg-purple-600' : 'hover:bg-purple-700'}`}
                >
                  Ausências
                </button>
                <button
                  onClick={() => setActiveEmployeeTab('jornada')}
                  className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${activeEmployeeTab === 'jornada' ? 'bg-purple-600' : 'hover:bg-purple-700'}`}
                >
                  Jornada
                </button>
              </div>
            </div>
            
            {/* Conteúdo da tab de Dados do Colaborador */}
            {activeEmployeeTab === 'horasExtras' && (
              <div className="bg-purple-800 bg-opacity-30 p-4 rounded-lg">
                <h4 className="text-lg font-medium mb-3">Horas Extras</h4>
                {employeeData.horasExtras.length === 0 ? (
                  <p className="text-gray-300">Nenhum registro de hora extra.</p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="text-purple-300 text-sm">
                        <th className="text-left p-2">Data</th>
                        <th className="text-left p-2">Quantidade</th>
                        <th className="text-left p-2">Motivo</th>
                        <th className="text-left p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeData.horasExtras.map((horaExtra, index) => (
                        <tr key={index} className="border-t border-purple-700">
                          <td className="p-2">{horaExtra.data}</td>
                          <td className="p-2">{horaExtra.quantidade}</td>
                          <td className="p-2">{horaExtra.motivo}</td>
                          <td className="p-2">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs 
                              ${horaExtra.status === 'aprovado' ? 'bg-green-600' :
                                horaExtra.status === 'pendente' ? 'bg-yellow-600' : 'bg-red-600'}`}>
                              {horaExtra.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            
            {activeEmployeeTab === 'ferias' && (
              <div className="bg-purple-800 bg-opacity-30 p-4 rounded-lg">
                <h4 className="text-lg font-medium mb-3">Férias</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-purple-700 bg-opacity-40 p-4 rounded-lg">
                    <h5 className="text-sm text-purple-300 mb-1">Dias Disponíveis</h5>
                    <p className="text-2xl font-bold">{employeeData.ferias.disponivel} dias</p>
                  </div>
                  
                  <div className="bg-purple-700 bg-opacity-40 p-4 rounded-lg">
                    <h5 className="text-sm text-purple-300 mb-1">Próximas Férias</h5>
                    {employeeData.ferias.proximas.inicio ? (
                      <p className="text-lg">
                        {employeeData.ferias.proximas.inicio} até {employeeData.ferias.proximas.fim}
                      </p>
                    ) : (
                      <p className="text-lg">Nenhum período agendado</p>
                    )}
                  </div>
                </div>
                
                <h5 className="text-md font-medium mb-2">Histórico de Férias</h5>
                {employeeData.ferias.historico.length === 0 ? (
                  <p className="text-gray-300">Nenhum histórico de férias disponível.</p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="text-purple-300 text-sm">
                        <th className="text-left p-2">Período</th>
                        <th className="text-left p-2">Duração</th>
                        <th className="text-left p-2">Aprovado Por</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeData.ferias.historico.map((periodo, index) => (
                        <tr key={index} className="border-t border-purple-700">
                          <td className="p-2">{periodo.inicio} até {periodo.fim}</td>
                          <td className="p-2">{periodo.dias} dias</td>
                          <td className="p-2">{periodo.aprovadoPor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            
            {/* Continuar com outros tabs do modal de dados do colaborador... */}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowEmployeeDataModal(false)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-md"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para limite de marcações de ponto */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-purple-900 rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Limite de Marcações Atingido</h3>
              <button
                onClick={() => setShowLimitModal(false)}
                className="text-purple-300 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-6">
              <div className="bg-purple-800 bg-opacity-50 p-4 rounded-lg mb-4">
                <p className="text-center">Você já bateu seu ponto 5 vezes hoje.</p>
                {cooldownActive && (
                  <p className="text-center mt-2">
                    Aguarde <span className="font-bold">{timeUntilReset}</span> para registrar novamente.
                  </p>
                )}
              </div>
              <p className="text-sm text-purple-300">
                Caso haja uma emergência, entre em contato com a administração.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowLimitModal(false)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-md"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de solicitações de correção */}
      {activeTab === 'marcacoes' && correctionModalVisible && (
        <div className="fixed bottom-4 right-4 z-10">
          <div className="bg-purple-800 bg-opacity-90 rounded-lg shadow-lg p-4 max-w-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-bold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Suas Solicitações de Correção
              </h3>
              <div className="flex items-center">
                <span className="text-xs text-purple-300 mr-2">Fechando em {timeUntilHide}s</span>
                <button
                  onClick={() => setCorrectionModalVisible(false)}
                  className="text-purple-300 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {(() => {
                // Filtrar notificações relacionadas a solicitações de correção
                const solicitacoes = notifications.filter(n => 
                  n.text.includes('Solicitação de correção') || 
                  n.text.includes('correção de registro')
                );
                
                if (solicitacoes.length === 0) {
                  return <p className="text-sm text-purple-300">Nenhuma solicitação de correção.</p>;
                }
                
                return solicitacoes.map((solicitacao, index) => {
                  // Extrair status da notificação (se disponível)
                  let status = 'pendente';
                  if (solicitacao.text.includes('aprovada')) status = 'aprovado';
                  if (solicitacao.text.includes('rejeitada')) status = 'rejeitado';
                  
                  // Cores para os status
                  const statusColors = {
                    'pendente': 'bg-yellow-600',
                    'aprovado': 'bg-green-600',
                    'rejeitado': 'bg-red-600'
                  };
                  
                  return (
                    <div key={index} className="border-t border-purple-700 py-2">
                      <div className="flex justify-between">
                        <span className="text-sm">{solicitacao.date}</span>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${statusColors[status]}`}>
                          {status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-purple-300 mt-1">{solicitacao.text}</p>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Decorações */}
      <div className="fixed top-20 left-10 w-20 h-20 bg-purple-500 rounded-full opacity-5 blur-xl"></div>
      <div className="fixed bottom-20 right-10 w-32 h-32 bg-purple-400 rounded-full opacity-5 blur-xl"></div>
      <div className="fixed top-40 right-20 w-16 h-16 bg-purple-300 rounded-full opacity-5 blur-xl"></div>
    </div>
  );
};

export default UserDashboard;