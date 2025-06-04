import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BotaoLimparPontos from '../components/BotaoLimparPontos';
import ApprovedDataComponent from '../components/ApprovedDataComponent';
import JustificativaAusencia from '../components/JustificativaAusencia';
import { calcularHorasTrabalhadas, verificarAtraso } from '../utils/timeUtils';

const UserDashboard = () => {
  // 1. Configuração inicial e estados
  const navigate = useNavigate();
  
  // Estados de UI
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastAction, setLastAction] = useState(null);
  const [activeTab, setActiveTab] = useState('registros');
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [showHistoryDetailsModal, setShowHistoryDetailsModal] = useState(false);
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
  // Estados de controle
  const [canRegisterEntry, setCanRegisterEntry] = useState(true);
  const [canRegisterExit, setCanRegisterExit] = useState(false);
  const [entryCount, setEntryCount] = useState(0);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownEndTime, setCooldownEndTime] = useState(null);
  const [timeUntilReset, setTimeUntilReset] = useState('');

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

  // 2. Dados do usuário
  const [userData] = useState(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    return {
      id: storedUser.id || 1,
      name: storedUser.name || 'Usuário',
      email: storedUser.email || '',
      initials: getInitials(storedUser.name) || 'U',
      isAdmin: false,
      jornadaTrabalho: storedUser.jornadaTrabalho || {
        inicio: '08:00',
        fimManha: '12:00',
        inicioTarde: '13:00',
        fim: '17:00',
        toleranciaAtraso: 10 // minutos
      }
    };
  });

  // 3. Notificações
  const [notifications, setNotifications] = useState(() => {
    const userNotifications = JSON.parse(localStorage.getItem('userNotifications') || '[]');
    if (userNotifications.length === 0) {
      return [
        { id: 1, text: 'Bem-vindo ao sistema de ponto!', read: false, date: new Date().toLocaleDateString('pt-BR') }
      ];
    }
    return userNotifications
      .filter(n => !n.userId || n.userId === userData.id)
      .map(n => ({
        id: n.id,
        text: n.message || n.text,
        read: n.read,
        date: n.date
      }));
  });
  
  // 4. Registros de ponto
  const [timeEntries, setTimeEntries] = useState(() => {
    const storedEntries = localStorage.getItem('timeEntries');
    if (storedEntries) {
      try {
        const parsedEntries = JSON.parse(storedEntries);
        const validEntries = Array.isArray(parsedEntries) ?
          parsedEntries.filter(entry =>
            entry && typeof entry === 'object' &&
            entry.type && typeof entry.type === 'string' &&
            entry.time && entry.date
          ) : [];
        if (validEntries.length > 0) {
          return validEntries;
        }
      } catch (error) {
        console.error('Erro ao carregar registros de ponto:', error);
      }
    }
    
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);
    
    return [
      { 
        type: 'entrada', 
        time: '08:03', 
        date: ontem.toLocaleDateString('pt-BR'), 
        user: userData.name, 
        status: 'aprovado', 
        employeeId: userData.id, 
        employeeName: userData.name, 
        registeredBy: userData.name,
        atraso: verificarAtraso('08:03', userData.jornadaTrabalho.inicio, userData.jornadaTrabalho.toleranciaAtraso)
      },
      { 
        type: 'saída', 
        time: '12:00', 
        date: ontem.toLocaleDateString('pt-BR'), 
        user: userData.name, 
        status: 'aprovado', 
        employeeId: userData.id, 
        employeeName: userData.name, 
        registeredBy: userData.name 
      },
      { 
        type: 'entrada', 
        time: '13:05', 
        date: ontem.toLocaleDateString('pt-BR'), 
        user: userData.name, 
        status: 'aprovado', 
        employeeId: userData.id, 
        employeeName: userData.name, 
        registeredBy: userData.name,
        atraso: verificarAtraso('13:05', userData.jornadaTrabalho.inicioTarde, userData.jornadaTrabalho.toleranciaAtraso) 
      },
      { 
        type: 'saída', 
        time: '17:30', 
        date: ontem.toLocaleDateString('pt-BR'), 
        user: userData.name, 
        status: 'aprovado', 
        employeeId: userData.id, 
        employeeName: userData.name, 
        registeredBy: userData.name 
      }
    ];
  });
  // 5. Histórico mensal - Cálculo dinâmico baseado nos registros reais
  const calculateWorkHoursHistory = () => {
    // Agrupar registros por mês
    const registrosPorMes = {};
    
    timeEntries.forEach(entry => {
      const [dia, mes, ano] = entry.date.split('/').map(Number);
      const chave = `${mes}/${ano}`;
      
      if (!registrosPorMes[chave]) {
        registrosPorMes[chave] = {
          entradas: [],
          nomeMes: new Date(ano, mes-1, 1).toLocaleString('pt-BR', { month: 'long' }),
          ano: ano
        };
      }
      
      registrosPorMes[chave].entradas.push(entry);
    });
    
    // Calcular estatísticas por mês
    const historicoMensal = Object.keys(registrosPorMes).map(chave => {
      const registros = registrosPorMes[chave];
      const dataAtual = new Date();
      const ehMesAtual = parseInt(chave.split('/')[0]) === dataAtual.getMonth() + 1 && 
                        parseInt(chave.split('/')[1]) === dataAtual.getFullYear();
      
      // Calcular dias trabalhados (dias com pelo menos uma entrada)
      const diasTrabalhados = new Set();
      registros.entradas.forEach(entry => {
        const [dia] = entry.date.split('/');
        diasTrabalhados.add(dia);
      });
      
      // Calcular horas trabalhadas
      let horasTrabalhadasTotal = 0;
      let minutosTrabalhadosTotal = 0;
      let horasExtrasTotal = 0;
      let minutosExtrasTotal = 0;
      
      // Agrupar por dia
      const registrosPorDia = {};
      registros.entradas.forEach(entry => {
        if (!registrosPorDia[entry.date]) {
          registrosPorDia[entry.date] = [];
        }
        registrosPorDia[entry.date].push(entry);
      });
      
      // Calcular horas por dia
      Object.values(registrosPorDia).forEach(entriesDoDia => {
        // Ordenar por hora
        entriesDoDia.sort((a, b) => {
          const timeA = a.time.split(':').map(Number);
          const timeB = b.time.split(':').map(Number);
          
          if (timeA[0] !== timeB[0]) return timeA[0] - timeB[0];
          return timeA[1] - timeB[1];
        });
        
        // Parear entradas e saídas
        for (let i = 0; i < entriesDoDia.length; i += 2) {
          if (i + 1 < entriesDoDia.length) {
            const entrada = entriesDoDia[i];
            const saida = entriesDoDia[i + 1];
            
            if (entrada.type === 'entrada' && saida.type === 'saída') {
              const [horasTrabalhadas, minutosTrabalhados] = calcularHorasTrabalhadas(entrada.time, saida.time);
              
              horasTrabalhadasTotal += horasTrabalhadas;
              minutosTrabalhadosTotal += minutosTrabalhados;
              
              // Se trabalhou mais de 8 horas no dia, considerar como hora extra
              if (horasTrabalhadas > 8) {
                horasExtrasTotal += horasTrabalhadas - 8;
              } else if (horasTrabalhadas === 8 && minutosTrabalhados > 0) {
                minutosExtrasTotal += minutosTrabalhados;
              }
            }
          }
        }
      });
      
      // Ajustar minutos excedentes
      horasTrabalhadasTotal += Math.floor(minutosTrabalhadosTotal / 60);
      minutosTrabalhadosTotal %= 60;
      
      horasExtrasTotal += Math.floor(minutosExtrasTotal / 60);
      minutosExtrasTotal %= 60;
      
      // Contabilizar ajustes
      const ajustes = registros.entradas.filter(entry => 
        entry.status === 'ajustado' || 
        entry.ajustado === true
      ).length;
      
      // Calcular ausências (dias úteis sem registro)
      // Para simplificar, consideramos apenas dias úteis no mês (22 em média)
      const ausencias = registros.entradas.filter(entry => entry.type === 'ausência').length;
      
      return {
        month: `${registros.nomeMes}/${registros.ano}${ehMesAtual ? ' (Atual)' : ''}`,
        workHours: `${horasTrabalhadasTotal}h ${minutosTrabalhadosTotal}min`,
        overtime: `${horasExtrasTotal}h ${minutosExtrasTotal}min`,
        absences: ausencias.toString(),
        adjustments: ajustes.toString(),
        entries: registros.entradas
      };
    });
    
    // Ordenar do mais recente para o mais antigo
    return historicoMensal.sort((a, b) => {
      const [mesA, anoA] = a.month.split('/');
      const [mesB, anoB] = b.month.split('/');
      
      if (anoA !== anoB) return parseInt(anoB) - parseInt(anoA);
      
      // Comparar meses (converter nomes de meses para números)
      const mesesIndice = {
        'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3, 'maio': 4, 'junho': 5,
        'julho': 6, 'agosto': 7, 'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
      };
      
      return mesesIndice[mesB.toLowerCase()] - mesesIndice[mesA.toLowerCase()];
    });
  };

  const [monthlyHistory, setMonthlyHistory] = useState(() => calculateWorkHoursHistory());
  
  // 6. Funções auxiliares
  function getInitials(name) {
    if (!name) return 'U';
    const nameParts = name.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  // 7. Efeitos colaterais para atualizar estatísticas
  useEffect(() => {
    // Calcular horas trabalhadas na semana atual
    const calcularHorasSemanais = () => {
      const hoje = new Date();
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - hoje.getDay()); // Domingo como início da semana
      inicioSemana.setHours(0, 0, 0, 0);
      
      let horasTotais = 0;
      let minutosTotais = 0;
      
      // Filtrar entradas da semana atual
      const entradasSemana = timeEntries.filter(entry => {
        const [dia, mes, ano] = entry.date.split('/').map(Number);
        const dataEntrada = new Date(ano, mes - 1, dia);
        return dataEntrada >= inicioSemana;
      });
      
      // Agrupar por dia
      const registrosPorDia = {};
      entradasSemana.forEach(entry => {
        if (!registrosPorDia[entry.date]) {
          registrosPorDia[entry.date] = [];
        }
        registrosPorDia[entry.date].push(entry);
      });
      
      // Calcular horas por dia
      Object.values(registrosPorDia).forEach(entriesDoDia => {
        // Ordenar por hora
        entriesDoDia.sort((a, b) => {
          const timeA = a.time.split(':').map(Number);
          const timeB = b.time.split(':').map(Number);
          
          if (timeA[0] !== timeB[0]) return timeA[0] - timeB[0];
          return timeA[1] - timeB[1];
        });
        
        // Parear entradas e saídas
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
    
    // Buscar e calcular horas extras do mês atual
    const calcularHorasExtras = () => {
      const solicitacoesHorasExtras = JSON.parse(localStorage.getItem('horasExtras') || '[]');
      
      // Filtrar solicitações aprovadas para o usuário atual
      const hoje = new Date();
      const mesAtual = hoje.getMonth() + 1;
      const anoAtual = hoje.getFullYear();
      
      const horasExtrasMes = solicitacoesHorasExtras.filter(solicitacao => {
        // Verificar se é para o usuário atual e foi aprovada
        if (solicitacao.funcionarioId !== userData.id || solicitacao.status !== 'aprovado') {
          return false;
        }
        
        // Verificar se é do mês atual
        const [dia, mes, ano] = solicitacao.data.split('/').map(Number);
        return mes === mesAtual && ano === anoAtual;
      });
      
      // Somar horas extras
      let horasTotal = 0;
      let minutosTotal = 0;
      
      horasExtrasMes.forEach(solicitacao => {
        const [horas, minutos] = solicitacao.quantidade.split('h ');
        horasTotal += parseInt(horas) || 0;
        minutosTotal += parseInt(minutos) || 0;
      });
      
      // Normalizar minutos
      horasTotal += Math.floor(minutosTotal / 60);
      minutosTotal %= 60;
      
      return `${horasTotal}h ${minutosTotal}min`;
    };
    
    // Buscar próxima folga agendada
    const buscarProximaFolga = () => {
      const solicitacoesFolga = JSON.parse(localStorage.getItem('solicitacoesFolga') || '[]');
      
      // Filtrar solicitações futuras e aprovadas para o usuário atual
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const proximasFolgas = solicitacoesFolga
        .filter(solicitacao => {
          // Verificar se é para o usuário atual e foi aprovada
          if (solicitacao.funcionarioId !== userData.id || solicitacao.status !== 'aprovado') {
            return false;
          }
          
          // Verificar se é futura
          const [dia, mes, ano] = solicitacao.data.split('/').map(Number);
          const dataFolga = new Date(ano, mes - 1, dia);
          
          return dataFolga >= hoje;
        })
        .sort((a, b) => {
          // Ordenar por data
          const [diaA, mesA, anoA] = a.data.split('/').map(Number);
          const [diaB, mesB, anoB] = b.data.split('/').map(Number);
          
          const dataA = new Date(anoA, mesA - 1, diaA);
          const dataB = new Date(anoB, mesB - 1, diaB);
          
          return dataA - dataB;
        });
      
      return proximasFolgas.length > 0 ? proximasFolgas[0].data : '';
    };
    
    // Atualizar estatísticas
    setHorasSemanais(calcularHorasSemanais());
    setHorasExtras(calcularHorasExtras());
    setProximaFolga(buscarProximaFolga());
  }, [timeEntries, userData.id]);

  useEffect(() => {
    if (userData.name !== 'Usuário') {
      setTimeEntries(prevEntries =>
        prevEntries.map(entry => ({
          ...entry,
          user: userData.name,
          employeeName: userData.name,
          registeredBy: userData.name
        }))
      );
    }
  }, [userData.name]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkEntryStatus = () => {
      const today = currentTime.toLocaleDateString('pt-BR');
      const todayEntries = timeEntries.filter(entry => entry.date === today);
      
      // Verificar o estado atual baseado no último registro
      if (todayEntries.length > 0) {
        // Ordenar por horário (mais recente primeiro)
        const sortedEntries = [...todayEntries].sort((a, b) => {
          const timeA = a.time.split(':').map(Number);
          const timeB = b.time.split(':').map(Number);
          
          if (timeA[0] !== timeB[0]) return timeB[0] - timeA[0];
          return timeB[1] - timeA[1];
        });
        
        const lastEntry = sortedEntries[0];
        
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
      }
    };
    
    checkEntryStatus();
  }, [timeEntries, currentTime]);

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
          setTimeUntilReset(`${hours}h ${minutes}m`);
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cooldownActive, cooldownEndTime]);

  useEffect(() => {
    const storedEntryData = JSON.parse(localStorage.getItem(`entryData_${userData.id}`) || 'null');
    if (storedEntryData) {
      const { count, endTime } = storedEntryData;
      const now = new Date();
      const cooldownEnd = new Date(endTime);
      if (cooldownEnd > now) {
        setEntryCount(count);
        setCooldownActive(true);
        setCooldownEndTime(endTime);
      } else {
        setEntryCount(0);
        localStorage.removeItem(`entryData_${userData.id}`);
      }
    }
  }, [userData.id]);

  // Verificação de atualizações em solicitações de ajuste
  useEffect(() => {
    // Função para verificar se alguma solicitação do usuário foi aprovada ou rejeitada
    const checkCorrectionUpdates = () => {
      const ajustePontoSolicitacoes = JSON.parse(localStorage.getItem('ajustePontoSolicitacoes') || '[]');
      
      // Filtrar solicitações deste usuário que foram processadas recentemente
      const processedSolicitacoes = ajustePontoSolicitacoes.filter(
        solicitacao => 
          solicitacao.funcionarioId === userData.id && 
          (solicitacao.status === 'aprovado' || solicitacao.status === 'rejeitado') &&
          // Verificar se a decisão foi tomada nas últimas 24 horas
          solicitacao.dataDecisao && 
          new Date(solicitacao.dataDecisao.split('/').reverse().join('-')) > 
            new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

      // Atualizar timeEntries se houver solicitações aprovadas
      if (processedSolicitacoes.length > 0) {
        // Atualizar os registros locais
        const updatedTimeEntries = [...timeEntries];
        
        processedSolicitacoes.forEach(solicitacao => {
          if (solicitacao.status === 'aprovado') {
            // Encontrar o registro correspondente e atualizá-lo
            const index = updatedTimeEntries.findIndex(
              entry => 
                entry.date === solicitacao.data && 
                entry.type === solicitacao.tipoRegistro
            );
            
            if (index !== -1) {
              updatedTimeEntries[index] = {
                ...updatedTimeEntries[index],
                time: solicitacao.horaCorreta,
                status: 'aprovado',
                ajustado: true
              };
            }
          }
        });
        
        setTimeEntries(updatedTimeEntries);
      }
    };
    
    // Verificar atualizações a cada 30 segundos
    const interval = setInterval(checkCorrectionUpdates, 30000);
    
    // Verificar uma vez imediatamente
    checkCorrectionUpdates();
    
    return () => clearInterval(interval);
  }, [timeEntries, userData.id]);

  // Efeito para atualizar o histórico quando houver novos registros
  useEffect(() => {
    setMonthlyHistory(calculateWorkHoursHistory());
  }, [timeEntries]);

  // Efeito para o timer do modal de correção
  useEffect(() => {
    // Timer para fechar automaticamente o modal de solicitações após 10 segundos
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

  // 8. Funções principais
  const registerTimeEntry = (type) => {
    if (entryCount >= 5 && cooldownActive) {
      setShowLimitModal(true);
      return;
    }

    const now = new Date();
    
    // Verificar se é uma entrada com atraso
    let atraso = false;
    if (type === 'entrada') {
      const horario = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      // Verificar se é pela manhã ou tarde
      const hora = now.getHours();
      const jornadaInicio = hora < 12 ? userData.jornadaTrabalho.inicio : userData.jornadaTrabalho.inicioTarde;
      
      atraso = verificarAtraso(horario, jornadaInicio, userData.jornadaTrabalho.toleranciaAtraso);
    }

    const newEntry = {
      type,
      time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString('pt-BR'),
      user: userData.name,
      status: 'pendente',
      employeeId: userData.id,
      employeeName: userData.name,
      registeredBy: userData.name,
      atraso: atraso
    };

    const updatedEntries = [newEntry, ...timeEntries];
    localStorage.setItem('timeEntries', JSON.stringify(updatedEntries));
    setTimeEntries(updatedEntries);
    
    // Adicionar mensagem personalizada sobre atraso
    const statusMessage = atraso ? 
      `${type.charAt(0).toUpperCase() + type.slice(1)} com atraso registrada às ${newEntry.time}` : 
      `${type.charAt(0).toUpperCase() + type.slice(1)} registrada às ${newEntry.time}`;
      
    setLastAction(statusMessage);

    const newCount = entryCount + 1;
    setEntryCount(newCount);

    if (newCount >= 5 && !cooldownActive) {
      const cooldownEnd = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      setCooldownActive(true);
      setCooldownEndTime(cooldownEnd.toISOString());
      localStorage.setItem(`entryData_${userData.id}`, JSON.stringify({
        count: newCount,
        endTime: cooldownEnd.toISOString()
      }));
      setShowLimitModal(true);
    }

    if (type === 'entrada') {
      setCanRegisterEntry(false);
      setCanRegisterExit(true);
    } else {
      setCanRegisterEntry(true);
      setCanRegisterExit(false);
    }

    // Notificar administrador sobre o registro, incluindo status de atraso
    const adminNotification = {
      id: Date.now() + Math.random(),
      message: atraso ? 
        `${userData.name} registrou ${type} com ATRASO às ${newEntry.time}` : 
        `${userData.name} registrou ${type} às ${newEntry.time}`,
      date: now.toLocaleDateString('pt-BR'),
      read: false,
      urgent: atraso  // Marcar como urgente se for um atraso
    };
    
    const currentAdminNotifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
    localStorage.setItem('adminNotifications', JSON.stringify([
      adminNotification,
      ...currentAdminNotifications
    ]));
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const submitMedicalCertificate = () => {
    if (selectedFile) {
      setTimeout(() => {
        const newNotification = {
          id: notifications.length + 1,
          text: `Atestado médico "${selectedFile.name}" enviado com sucesso. Aguardando aprovação.`,
          read: false,
          date: currentTime.toLocaleDateString('pt-BR')
        };
        setNotifications([newNotification, ...notifications]);
        setShowAttachModal(false);
        setSelectedFile(null);
        setFileInputKey(Date.now());
        setLastAction('Atestado médico enviado com sucesso!');

        const adminNotification = {
          id: Date.now() + Math.random(),
          message: `${userData.name} enviou um atestado médico: ${selectedFile.name}`,
          date: currentTime.toLocaleDateString('pt-BR'),
          read: false
        };
        const currentAdminNotifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
        localStorage.setItem('adminNotifications', JSON.stringify([
          adminNotification,
          ...currentAdminNotifications
        ]));
      }, 1000);
    }
  };

  const cancelMedicalCertificate = () => {
    setShowAttachModal(false);
    setSelectedFile(null);
    setFileInputKey(Date.now());
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(notif =>
      notif.id === id ? { ...notif, read: true } : notif
    ));
    const allNotifications = JSON.parse(localStorage.getItem('userNotifications') || '[]');
    const updatedAllNotifications = allNotifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    localStorage.setItem('userNotifications', JSON.stringify(updatedAllNotifications));
  };
  
  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
    const allNotifications = JSON.parse(localStorage.getItem('userNotifications') || '[]');
    const updatedAllNotifications = allNotifications.map(n =>
      (!n.userId || n.userId === userData.id) ? { ...n, read: true } : n
    );
    localStorage.setItem('userNotifications', JSON.stringify(updatedAllNotifications));
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Função modificada para abrir o modal de correção com os dados do registro
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

  // Função modificada para enviar solicitação de correção ao sistema de AjustesPontoTab
  const submitCorrection = () => {
    if (!selectedEntry || !correctionData.reason || !correctionData.newTime) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Criar uma nova solicitação de ajuste de ponto compatível com o AjustesPontoTab
    const novaSolicitacao = {
      id: Date.now(),
      funcionarioId: userData.id,
      funcionarioNome: userData.name,
      data: correctionData.date,
      tipoRegistro: selectedEntry.type,
      horaOriginal: selectedEntry.time,
      horaCorreta: correctionData.newTime,
      motivo: correctionData.reason,
      status: 'pendente',
      dataSolicitacao: new Date().toLocaleDateString('pt-BR')
    };

    // Obter solicitações existentes
    const solicitacoesExistentes = JSON.parse(localStorage.getItem('ajustePontoSolicitacoes') || '[]');
    
    // Adicionar nova solicitação
    const solicitacoesAtualizadas = [novaSolicitacao, ...solicitacoesExistentes];
    
    // Salvar no localStorage
    localStorage.setItem('ajustePontoSolicitacoes', JSON.stringify(solicitacoesAtualizadas));

    // Criar notificação para o admin
    const adminNotification = {
      id: Date.now() + Math.random(),
      type: 'ajustePonto', // Adicionar tipo para facilitar a filtragem no AjustesPontoTab
      message: `${userData.name} solicitou correção de registro de ${selectedEntry.type} do dia ${correctionData.date}: ${correctionData.reason}`,
      date: new Date().toLocaleDateString('pt-BR'),
      read: false
    };
    
    // Adicionar notificação para o admin
    const currentAdminNotifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
    localStorage.setItem('adminNotifications', JSON.stringify([
      adminNotification,
      ...currentAdminNotifications
    ]));

    // Adicionar notificação para o usuário
    const novaNotificacao = {
      id: notifications.length + 1,
      text: `Solicitação de correção para registro de ${selectedEntry.type} do dia ${correctionData.date} enviada. Aguardando aprovação.`,
      read: false,
      date: new Date().toLocaleDateString('pt-BR')
    };
    
    setNotifications([novaNotificacao, ...notifications]);
    setLastAction('Solicitação de correção enviada para aprovação');
    setShowCorrectionModal(false);
    
    // Exibir o modal de correções pendentes
    setCorrectionModalVisible(true);
    setTimeUntilHide(10);
    setAlertVisible(true);
  };

  const viewHistoryDetails = (month) => {
    setSelectedHistoryMonth(month);
    setShowHistoryDetailsModal(true);
  };
  // Função para mostrar dados do colaborador
  const [showEmployeeDataModal, setShowEmployeeDataModal] = useState(false);
  const [employeeData, setEmployeeData] = useState({
    horasExtras: [],
    ferias: { 
      disponivel: 30, 
      proximas: { inicio: '', fim: '' }, 
      historico: [] 
    },
    folgas: [],
    bancoHoras: { saldo: '0h 0min', entradas: [], saidas: [] },
    ausencias: [],
    jornada: userData.jornadaTrabalho || {
      inicio: '08:00',
      fimManha: '12:00',
      inicioTarde: '13:00',
      fim: '17:00',
      toleranciaAtraso: 10
    }
  });

  // Função para carregar dados do colaborador
  const carregarDadosColaborador = () => {
    // Carregar horas extras
    const horasExtras = JSON.parse(localStorage.getItem('horasExtras') || '[]')
      .filter(he => he.funcionarioId === userData.id)
      .sort((a, b) => {
        const [diaA, mesA, anoA] = a.data.split('/').map(Number);
        const [diaB, mesB, anoB] = b.data.split('/').map(Number);
        
        const dataA = new Date(anoA, mesA - 1, diaA);
        const dataB = new Date(anoB, mesB - 1, diaB);
        
        return dataB - dataA; // Ordenar da mais recente para a mais antiga
      });
    
    // Carregar férias
    const ferias = JSON.parse(localStorage.getItem('ferias') || '{}')[userData.id] || {
      disponivel: 30,
      proximas: { inicio: '', fim: '' },
      historico: []
    };
    
    // Carregar folgas
    const folgas = JSON.parse(localStorage.getItem('solicitacoesFolga') || '[]')
      .filter(folga => folga.funcionarioId === userData.id && folga.status === 'aprovado')
      .sort((a, b) => {
        const [diaA, mesA, anoA] = a.data.split('/').map(Number);
        const [diaB, mesB, anoB] = b.data.split('/').map(Number);
        
        const dataA = new Date(anoA, mesA - 1, diaA);
        const dataB = new Date(anoB, mesB - 1, diaB);
        
        return dataA - dataB; // Ordenar da mais antiga para a mais recente
      });
    
    // Carregar banco de horas
    const bancoHoras = JSON.parse(localStorage.getItem('bancoHoras') || '{}')[userData.id] || {
      saldo: '0h 0min',
      entradas: [],
      saidas: []
    };
    
    // Carregar ausências
    const ausencias = JSON.parse(localStorage.getItem('ausencias') || '[]')
      .filter(ausencia => ausencia.funcionarioId === userData.id)
      .sort((a, b) => {
        const [diaA, mesA, anoA] = a.data.split('/').map(Number);
        const [diaB, mesB, anoB] = b.data.split('/').map(Number);
        
        const dataA = new Date(anoA, mesA - 1, diaA);
        const dataB = new Date(anoB, mesB - 1, diaB);
        
        return dataB - dataA; // Ordenar da mais recente para a mais antiga
      });
    
    // Atualizar estado com os dados carregados
    setEmployeeData({
      horasExtras,
      ferias,
      folgas,
      bancoHoras,
      ausencias,
      jornada: userData.jornadaTrabalho
    });
    
    // Mostrar modal
    setShowEmployeeDataModal(true);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Função para verificar se um registro já tem solicitação de correção pendente
  const temSolicitacaoPendente = (entry) => {
    const solicitacoes = JSON.parse(localStorage.getItem('ajustePontoSolicitacoes') || '[]');
    
    return solicitacoes.some(
      s => s.funcionarioId === userData.id && 
           s.data === entry.date && 
           s.tipoRegistro === entry.type && 
           s.status === 'pendente'
    );
  };

  // 9. Renderização do componente
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
            {/* Notificações */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-1 rounded-full hover:bg-purple-700 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-purple-800 rounded-md shadow-lg py-1 z-20 max-h-96 overflow-y-auto">
                  <div className="flex justify-between items-center px-4 py-2 border-b border-purple-700">
                    <h3 className="text-sm font-bold">Notificações</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-purple-300 hover:text-white"
                      >
                        Marcar todas como lidas
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="px-4 py-2 text-sm text-gray-300">Nenhuma notificação</p>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        className={`px-4 py-2 border-b border-purple-700 cursor-pointer hover:bg-purple-700 ${notif.read ? 'opacity-60' : 'bg-purple-700 bg-opacity-40'}`}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <p className="text-sm">{notif.text}</p>
                        <p className="text-xs text-purple-300 mt-1">{notif.date}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            {/* Perfil do usuário */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="font-medium text-sm">{userData.initials}</span>
                </div>
                <span className="hidden md:inline-block">{userData.name}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-purple-800 rounded-md shadow-lg py-1 z-20">
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
            onClick={() => registerTimeEntry('entrada')}
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
            onClick={() => registerTimeEntry('saída')}
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
          
          {/* Botões lado a lado na mesma linha */}
          <div className="flex gap-4 w-full justify-center">
          <ApprovedDataComponent />
            
          </div>
        </div>
        {/* Status de solicitações pendentes */}
        {(() => {
          // Verificar se existem solicitações pendentes
          const solicitacoes = JSON.parse(localStorage.getItem('ajustePontoSolicitacoes') || '[]');
          const solicitacoesPendentes = solicitacoes.filter(
            s => s.funcionarioId === userData.id && s.status === 'pendente'
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
       {/* Conteúdo baseado na tab ativa */}
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
                  {timeEntries.slice(0, 10).map((entry, index) => (
                    <tr key={index} className="border-t border-purple-700">
                      <td className="p-2">{entry.date}</td>
                      <td className="p-2">{entry.time}</td>
                      <td className="p-2">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${entry.type === 'entrada' ? 'bg-green-600' : 'bg-red-600'}`}>
                          {entry.type ? entry.type.toUpperCase() : 'N/A'}
                        </span>
                      </td>
                      <td className="p-2">{entry.registeredBy || userData.name}</td>
                      <td className="p-2">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs
                          ${entry.status === 'aprovado' ? 'bg-green-700' :
                            entry.status === 'pendente' ? 'bg-yellow-600' : 'bg-red-700'}`}>
                          {entry.status ? entry.status.toUpperCase() : 'N/A'}
                        </span>
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
                </tbody>
              </table>
            </div>
          </div>
        )}

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
          {timeEntries.map((entry, index) => (
            <tr key={index} className="border-t border-purple-700">
              <td className="p-2">{entry.date}</td>
              <td className="p-2">{entry.time}</td>
              <td className="p-2">
                <span className={`inline-block px-2 py-1 rounded-full text-xs ${entry.type === 'entrada' ? 'bg-green-600' : 'bg-red-600'}`}>
                  {entry.type ? entry.type.toUpperCase() : 'N/A'}
                </span>
              </td>
              <td className="p-2">{entry.registeredBy || userData.name}</td>
              <td className="p-2">
                <span className={`inline-block px-2 py-1 rounded-full text-xs
                  ${entry.status === 'aprovado' ? 'bg-green-700' :
                    entry.status === 'pendente' ? 'bg-yellow-600' : 'bg-red-700'}`}>
                  {entry.status ? entry.status.toUpperCase() : 'N/A'}
                </span>
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
                {temSolicitacaoPendente(entry) ? (
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
        </tbody>
      </table>
    </div>
    
    {/* BOTÃO PARA LIMPAR REGISTROS */}
    <BotaoLimparPontos 
      userData={userData} 
      setTimeEntries={setTimeEntries} 
      setLastAction={setLastAction} 
    />
  </div>
)}

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
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'justificativa' && (
          <JustificativaAusencia userData={userData} setLastAction={setLastAction} setNotifications={setNotifications} notifications={notifications} />
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
                    {/* Agrupar os registros por dia e ordenar por data */}
                    {(() => {
                      const registrosPorDia = {};
                      
                      // Filtrar apenas registros do mês selecionado
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
                     {/* Filtrar ausências do mês selecionado */}
                     {(() => {
                       const ausencias = JSON.parse(localStorage.getItem('ausencias') || '[]');
                       
                       // Extrair mês e ano do mês selecionado
                       const mesSelecionado = selectedHistoryMonth.month.split('/')[0].toLowerCase();
                       const anoSelecionado = parseInt(selectedHistoryMonth.month.split('/')[1]);
                       
                       const ausenciasFiltradas = ausencias.filter(ausencia => {
                         if (ausencia.funcionarioId !== userData.id) return false;
                         
                         const [dia, mes, ano] = ausencia.data.split('/').map(Number);
                         const nomesMeses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
                         return nomesMeses[mes-1] === mesSelecionado && ano === anoSelecionado;
                       });
                       
                       if (ausenciasFiltradas.length === 0) {
                         return (
                           <tr className="border-t border-purple-700">
                             <td colSpan="4" className="p-2 text-center text-gray-300">
                               Nenhuma ausência detalhada disponível
                             </td>
                           </tr>
                         );
                       }
                       
                       return ausenciasFiltradas.map((ausencia, index) => (
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
             <h3 className="text-xl font-bold">Dados do Colaborador - {userData.name}</h3>
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
            
            {activeEmployeeTab === 'folgas' && (
              <div className="bg-purple-800 bg-opacity-30 p-4 rounded-lg">
                <h4 className="text-lg font-medium mb-3">Folgas</h4>
                
                {employeeData.folgas.length === 0 ? (
                  <p className="text-gray-300">Nenhuma folga registrada.</p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="text-purple-300 text-sm">
                        <th className="text-left p-2">Data</th>
                        <th className="text-left p-2">Tipo</th>
                        <th className="text-left p-2">Motivo</th>
                        <th className="text-left p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeData.folgas.map((folga, index) => (
                        <tr key={index} className="border-t border-purple-700">
                          <td className="p-2">{folga.data}</td>
                          <td className="p-2">{folga.tipo}</td>
                          <td className="p-2">{folga.motivo}</td>
                          <td className="p-2">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs 
                              ${folga.status === 'aprovado' ? 'bg-green-600' :
                                folga.status === 'pendente' ? 'bg-yellow-600' : 'bg-red-600'}`}>
                              {folga.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            
            {activeEmployeeTab === 'bancoHoras' && (
              <div className="bg-purple-800 bg-opacity-30 p-4 rounded-lg">
                <h4 className="text-lg font-medium mb-3">Banco de Horas</h4>
                
                <div className="bg-purple-700 bg-opacity-40 p-4 rounded-lg mb-6">
                  <h5 className="text-sm text-purple-300 mb-1">Saldo Atual</h5>
                  <p className="text-2xl font-bold">{employeeData.bancoHoras.saldo}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-md font-medium mb-2">Créditos</h5>
                    {employeeData.bancoHoras.entradas.length === 0 ? (
                      <p className="text-gray-300">Nenhum crédito registrado.</p>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="text-purple-300 text-sm">
                            <th className="text-left p-2">Data</th>
                            <th className="text-left p-2">Quantidade</th>
                            <th className="text-left p-2">Origem</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employeeData.bancoHoras.entradas.map((entrada, index) => (
                            <tr key={index} className="border-t border-purple-700">
                              <td className="p-2">{entrada.data}</td>
                              <td className="p-2">{entrada.quantidade}</td>
                              <td className="p-2">{entrada.origem}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  
                  <div>
                    <h5 className="text-md font-medium mb-2">Débitos</h5>
                    {employeeData.bancoHoras.saidas.length === 0 ? (
                      <p className="text-gray-300">Nenhum débito registrado.</p>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="text-purple-300 text-sm">
                            <th className="text-left p-2">Data</th>
                            <th className="text-left p-2">Quantidade</th>
                            <th className="text-left p-2">Motivo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employeeData.bancoHoras.saidas.map((saida, index) => (
                            <tr key={index} className="border-t border-purple-700">
                              <td className="p-2">{saida.data}</td>
                              <td className="p-2">{saida.quantidade}</td>
                              <td className="p-2">{saida.motivo}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}{activeEmployeeTab === 'ausencias' && (
              <div className="bg-purple-800 bg-opacity-30 p-4 rounded-lg">
                <h4 className="text-lg font-medium mb-3">Ausências</h4>
                
                {employeeData.ausencias.length === 0 ? (
                  <p className="text-gray-300">Nenhuma ausência registrada.</p>
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
                      {employeeData.ausencias.map((ausencia, index) => (
                        <tr key={index} className="border-t border-purple-700">
                          <td className="p-2">{ausencia.data}</td>
                          <td className="p-2">{ausencia.tipo}</td>
                          <td className="p-2">{ausencia.justificativa}</td>
                          <td className="p-2">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs 
                              ${ausencia.status === 'aprovado' ? 'bg-green-600' :
                                ausencia.status === 'pendente' ? 'bg-yellow-600' : 'bg-red-600'}`}>
                              {ausencia.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            
            {activeEmployeeTab === 'jornada' && (
              <div className="bg-purple-800 bg-opacity-30 p-4 rounded-lg">
                <h4 className="text-lg font-medium mb-3">Jornada de Trabalho</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-purple-700 bg-opacity-40 p-4 rounded-lg">
                    <h5 className="text-sm text-purple-300 mb-1">Horário de Entrada</h5>
                    <p className="text-2xl font-bold">{employeeData.jornada.inicio}</p>
                  </div>
                  
                  <div className="bg-purple-700 bg-opacity-40 p-4 rounded-lg">
                    <h5 className="text-sm text-purple-300 mb-1">Horário de Saída para Almoço</h5>
                    <p className="text-2xl font-bold">{employeeData.jornada.fimManha}</p>
                  </div>
                  
                  <div className="bg-purple-700 bg-opacity-40 p-4 rounded-lg">
                    <h5 className="text-sm text-purple-300 mb-1">Horário de Retorno do Almoço</h5>
                    <p className="text-2xl font-bold">{employeeData.jornada.inicioTarde}</p>
                  </div>
                  
                  <div className="bg-purple-700 bg-opacity-40 p-4 rounded-lg">
                    <h5 className="text-sm text-purple-300 mb-1">Horário de Saída</h5>
                    <p className="text-2xl font-bold">{employeeData.jornada.fim}</p>
                  </div>
                </div>
                
                <div className="mt-4 bg-purple-700 bg-opacity-40 p-4 rounded-lg">
                  <h5 className="text-sm text-purple-300 mb-1">Tolerância para Atraso</h5>
                  <p className="text-2xl font-bold">{employeeData.jornada.toleranciaAtraso} minutos</p>
                </div>
                
                <div className="mt-4 bg-yellow-700 bg-opacity-40 p-4 rounded-lg">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">Para solicitar alteração na sua jornada de trabalho, entre em contato com o departamento de RH.</p>
                  </div>
                </div>
              </div>
            )}
            
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
          <div className="bg-purple-900 rounded-lg shadow-xl p-6 w-full max-w-md">
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
                // Obter solicitações de correção do usuário
                const solicitacoes = JSON.parse(localStorage.getItem('ajustePontoSolicitacoes') || '[]')
                  .filter(s => s.funcionarioId === userData.id)
                  .sort((a, b) => {
                    // Ordenar por data de solicitação (mais recente primeiro)
                    const [diaA, mesA, anoA] = a.dataSolicitacao.split('/').map(Number);
                    const [diaB, mesB, anoB] = b.dataSolicitacao.split('/').map(Number);
                    
                    const dateA = new Date(anoA, mesA - 1, diaA);
                    const dateB = new Date(anoB, mesB - 1, diaB);
                    
                    return dateB - dateA;
                  });
                
                if (solicitacoes.length === 0) {
                  return <p className="text-sm text-purple-300">Nenhuma solicitação de correção.</p>;
                }
                
                return solicitacoes.map((solicitacao, index) => {
                  // Definir cor de acordo com o status
                  const statusColors = {
                    'pendente': 'bg-yellow-600',
                    'aprovado': 'bg-green-600',
                    'rejeitado': 'bg-red-600'
                  };
                  
                  return (
                    <div key={index} className="border-t border-purple-700 py-2">
                      <div className="flex justify-between">
                        <span className="text-sm">{solicitacao.data} - {solicitacao.tipoRegistro}</span>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${statusColors[solicitacao.status]}`}>
                          {solicitacao.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-purple-300 mt-1">
                        {solicitacao.horaOriginal} → {solicitacao.horaCorreta}
                      </p>
                      {solicitacao.status === 'rejeitado' && solicitacao.observacao && (
                        <p className="text-xs text-red-300 mt-1">
                          Motivo: {solicitacao.observacao}
                        </p>
                      )}
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