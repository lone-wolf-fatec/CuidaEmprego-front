import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApprovedDataComponent from '../components/ApprovedDataComponent';
import JustificativaAusencia from '../components/JustificativaAusencia';

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

  // Estados de dados
  const [selectedHistoryMonth, setSelectedHistoryMonth] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  
  // Estados de controle
  const [canRegisterEntry, setCanRegisterEntry] = useState(true);
  const [canRegisterExit, setCanRegisterExit] = useState(false);
  const [entryCount, setEntryCount] = useState(0);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownEndTime, setCooldownEndTime] = useState(null);
  const [timeUntilReset, setTimeUntilReset] = useState('');

  // Estado para dados de correção
  const [correctionData, setCorrectionData] = useState({
    date: '',
    time: '',
    reason: '',
    newTime: ''
  });

  // 2. Dados do usuário
  const [userData, setUserData] = useState(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    return {
      id: storedUser.id || 1,
      name: storedUser.name || 'Usuário',
      email: storedUser.email || '',
      initials: getInitials(storedUser.name) || 'U',
      isAdmin: false
    };
  });

  // 3. Notificações
  const [notifications, setNotifications] = useState(() => {
    const userNotifications = JSON.parse(localStorage.getItem('userNotifications') || '[]');
    if (userNotifications.length === 0) {
      return [
        { id: 1, text: 'Você tem 5h 45min de horas extras acumuladas este mês', read: false, date: '14/03/2025' },
        { id: 2, text: 'Você tem uma folga agendada para 15/03/2025', read: false, date: '10/03/2025' },
        { id: 3, text: 'Seu atestado médico foi aprovado pelo RH', read: true, date: '05/03/2025' }
      ];
    }
    return userNotifications
      .filter(n => !n.userId || n.userId === userData.id)
      .map(n => ({
        id: n.id,
        text: n.message,
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
    return [
      { type: 'entrada', time: '08:03', date: '12/03/2025', user: userData.name, status: 'aprovado', employeeId: userData.id, employeeName: userData.name, registeredBy: userData.name },
      { type: 'saída', time: '12:00', date: '12/03/2025', user: userData.name, status: 'aprovado', employeeId: userData.id, employeeName: userData.name, registeredBy: userData.name },
      { type: 'entrada', time: '13:05', date: '12/03/2025', user: userData.name, status: 'aprovado', employeeId: userData.id, employeeName: userData.name, registeredBy: userData.name },
      { type: 'saída', time: '17:30', date: '12/03/2025', user: userData.name, status: 'aprovado', employeeId: userData.id, employeeName: userData.name, registeredBy: userData.name },
      { type: 'entrada', time: '08:00', date: '13/03/2025', user: userData.name, status: 'aprovado', employeeId: userData.id, employeeName: userData.name, registeredBy: userData.name },
    ];
  });

  // 5. Histórico mensal
  const [monthlyHistory] = useState([
    { month: 'Janeiro/2025', workHours: '168h 30min', overtime: '10h 15min', absences: '0', adjustments: '2' },
    { month: 'Fevereiro/2025', workHours: '152h 45min', overtime: '8h 30min', absences: '1', adjustments: '3' },
    { month: 'Março/2025 (Atual)', workHours: '84h 20min', overtime: '5h 45min', absences: '0', adjustments: '1' },
  ]);

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

  // 7. Efeitos colaterais
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
      const sortedEntries = [...timeEntries].sort((a, b) => {
        const dateA = new Date(a.date.split('/').reverse().join('-') + 'T' + a.time);
        const dateB = new Date(b.date.split('/').reverse().join('-') + 'T' + b.time);
        return dateB - dateA;
      });
      
      const today = currentTime.toLocaleDateString('pt-BR');
      const todayEntries = sortedEntries.filter(entry => entry.date === today);
      
      if (todayEntries.length > 0) {
        const lastEntry = todayEntries[0];
        if (lastEntry.type === 'entrada') {
          const entryTime = new Date(today.split('/').reverse().join('-') + 'T' + lastEntry.time);
          const currentT = new Date();
          const hoursDiff = (currentT - entryTime) / (1000 * 60 * 60);
          if (hoursDiff >= 8) {
            setCanRegisterEntry(true);
            setCanRegisterExit(false);
          } else {
            setCanRegisterEntry(false);
            setCanRegisterExit(true);
          }
        } else if (lastEntry.type === 'saída') {
          setCanRegisterEntry(true);
          setCanRegisterExit(false);
        }
      } else {
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

  // 8. Funções principais
  const registerTimeEntry = (type) => {
    if (entryCount >= 5 && cooldownActive) {
      setShowLimitModal(true);
      return;
    }

    const now = new Date();
    const newEntry = {
      type,
      time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString('pt-BR'),
      user: userData.name,
      status: 'pendente',
      employeeId: userData.id,
      employeeName: userData.name,
      registeredBy: userData.name
    };

    const updatedEntries = [newEntry, ...timeEntries];
    localStorage.setItem('timeEntries', JSON.stringify(updatedEntries));
    setTimeEntries(updatedEntries);
    setLastAction(`${type.charAt(0).toUpperCase() + type.slice(1)} registrada às ${newEntry.time}`);

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

    const adminNotification = {
      id: Date.now() + Math.random(),
      message: `${userData.name} registrou ${type} às ${newEntry.time}`,
      date: now.toLocaleDateString('pt-BR'),
      read: false
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

  const openCorrectionModal = (entry, index) => {
    setSelectedEntry({ ...entry, index });
    setCorrectionData({
      date: entry.date,
      time: entry.time,
      reason: '',
      newTime: entry.time
    });
    setShowCorrectionModal(true);
  };

  const submitCorrection = () => {
    setTimeout(() => {
      const newNotification = {
        id: notifications.length + 1,
        text: `Solicitação de correção para registro de ${selectedEntry.type} do dia ${correctionData.date} enviada. Aguardando aprovação do administrador.`,
        read: false,
        date: currentTime.toLocaleDateString('pt-BR')
      };
      setNotifications([newNotification, ...notifications]);
      setLastAction('Solicitação de correção enviada para aprovação');
      setShowCorrectionModal(false);

      const adminNotification = {
        id: Date.now() + Math.random(),
        message: `${userData.name} solicitou correção de registro de ${selectedEntry.type} do dia ${correctionData.date}: ${correctionData.reason}`,
        date: currentTime.toLocaleDateString('pt-BR'),
        read: false
      };
      const currentAdminNotifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
      localStorage.setItem('adminNotifications', JSON.stringify([
        adminNotification,
        ...currentAdminNotifications
      ]));
    }, 500);
  };

  const viewHistoryDetails = (month) => {
    setSelectedHistoryMonth(month);
    setShowHistoryDetailsModal(true);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
<ApprovedDataComponent />

        </div>

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
                        <button
                          onClick={() => openCorrectionModal(entry, index)}
                          className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 rounded-md"
                        >
                          Solicitar Correção
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            <p className="text-2xl font-bold">32h 15min</p>
          </div>
          <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-lg shadow-lg p-4">
            <h3 className="text-sm text-purple-300 mb-1">Horas Extras (Este Mês)</h3>
            <p className="text-2xl font-bold">5h 45min</p>
          </div>
          <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-lg shadow-lg p-4">
            <h3 className="text-sm text-purple-300 mb-1">Próxima Folga</h3>
            <p className="text-2xl font-bold">15/03/2025</p>
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
            <h3 className="text-xl font-bold mb-4">Solicitar Correção de Registro</h3>
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
              <label className="block text-sm font-medium mb-2">Horário Correto</label>
              <input
                type="time"
                value={correctionData.newTime}
                onChange={(e) => setCorrectionData({...correctionData, newTime: e.target.value})}
                className="w-full px-3 py-2 bg-purple-800 border border-purple-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Motivo da Correção</label>
              <textarea
                value={correctionData.reason}
                onChange={(e) => setCorrectionData({...correctionData, reason: e.target.value})}
                className="w-full px-3 py-2 bg-purple-800 border border-purple-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-20"
                placeholder="Descreva o motivo da solicitação de correção..."
              />
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
                disabled={!correctionData.reason}
                className={`px-4 py-2 rounded-md ${correctionData.reason ? 'bg-purple-600 hover:bg-purple-500' : 'bg-purple-900 opacity-50 cursor-not-allowed'}`}
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
                      <th className="text-left p-2">Registrado Por</th>
                      <th className="text-left p-2">Total do Dia</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-purple-700">
                      <td className="p-2">01/{selectedHistoryMonth.month.slice(0, 7)}</td>
                      <td className="p-2">08:00</td>
                      <td className="p-2">12:00</td>
                      <td className="p-2">13:00</td>
                      <td className="p-2">17:00</td>
                      <td className="p-2">{userData.name}</td>
                      <td className="p-2">8h</td>
                    </tr>
                    <tr className="border-t border-purple-700">
                      <td className="p-2">02/{selectedHistoryMonth.month.slice(0, 7)}</td>
                      <td className="p-2">08:05</td>
                      <td className="p-2">12:00</td>
                      <td className="p-2">13:05</td>
                      <td className="p-2">17:30</td>
                      <td className="p-2">{userData.name}</td>
                      <td className="p-2">8h 20min</td>
                    </tr>
                    <tr className="border-t border-purple-700">
                      <td className="p-2">03/{selectedHistoryMonth.month.slice(0, 7)}</td>
                      <td className="p-2">08:00</td>
                      <td className="p-2">12:00</td>
                      <td className="p-2">13:00</td>
                      <td className="p-2">18:00</td>
                      <td className="p-2">{userData.name}</td>
                      <td className="p-2">9h (1h extra)</td>
                    </tr>
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
                        <th className="text-left p-2">Registrado Por</th>
                        <th className="text-left p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-purple-700">
                        <td className="p-2">15/{selectedHistoryMonth.month.slice(0, 7)}</td>
                        <td className="p-2">
                          <span className="inline-block px-2 py-1 rounded-full text-xs bg-yellow-600">
                            ATESTADO MÉDICO
                          </span>
                        </td>
                        <td className="p-2">Consulta médica - atestado anexado</td>
                        <td className="p-2">{userData.name}</td>
                        <td className="p-2">
                          <span className="inline-block px-2 py-1 rounded-full text-xs bg-green-700">
                            APROVADO
                          </span>
                        </td>
                      </tr>
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

      {/* Decorações */}
      <div className="fixed top-20 left-10 w-20 h-20 bg-purple-500 rounded-full opacity-5 blur-xl"></div>
      <div className="fixed bottom-20 right-10 w-32 h-32 bg-purple-400 rounded-full opacity-5 blur-xl"></div>
      <div className="fixed top-40 right-20 w-16 h-16 bg-purple-300 rounded-full opacity-5 blur-xl"></div>
    </div>
  );
};

export default UserDashboard;
