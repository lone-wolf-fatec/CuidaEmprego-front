import React, { useState, useEffect } from 'react';

const BotaoLimparPontos = ({ userData, setTimeEntries, setLastAction }) => {
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [cooldownAtivo, setCooldownAtivo] = useState(false);
  const [tempoAteReset, setTempoAteReset] = useState('');

  // Obter identificador seguro do usuário (email ou nome, se id não estiver disponível)
  const getUserIdentifier = () => {
    if (!userData) return 'usuario';
    return userData.email || userData.name || 'usuario';
  };

  // Verificar se há um cooldown ativo ao carregar o componente
  useEffect(() => {
    if (!userData) return; // Não verificar cooldown se não tiver dados do usuário
    
    const verificarCooldown = () => {
      try {
        const userIdentifier = getUserIdentifier();
        const chaveLocalStorage = `limparPontos_cooldown_${userIdentifier}`;
        const cooldownArmazenado = localStorage.getItem(chaveLocalStorage);
        
        if (cooldownArmazenado) {
          const dados = JSON.parse(cooldownArmazenado);
          const fimCooldown = new Date(dados.horaFim);
          const agora = new Date();
          
          if (fimCooldown > agora) {
            // Cooldown ainda está ativo
            setCooldownAtivo(true);
            
            // Calcular tempo restante
            const tempoRestante = fimCooldown - agora;
            const horas = Math.floor(tempoRestante / (1000 * 60 * 60));
            const minutos = Math.floor((tempoRestante % (1000 * 60 * 60)) / (1000 * 60));
            setTempoAteReset(`${horas}h ${minutos}m`);
            
            // Configurar timeout para desativar o cooldown quando terminar
            const timeoutId = setTimeout(() => {
              setCooldownAtivo(false);
              localStorage.removeItem(chaveLocalStorage);
            }, tempoRestante);
            
            return () => clearTimeout(timeoutId);
          } else {
            // Cooldown expirou, remover do localStorage
            localStorage.removeItem(chaveLocalStorage);
          }
        }
      } catch (erro) {
        console.error("Erro ao verificar cooldown:", erro);
        // Em caso de erro, limpar o localStorage para evitar problemas futuros
        try {
          localStorage.removeItem(`limparPontos_cooldown_${getUserIdentifier()}`);
        } catch (e) {
          console.error("Erro ao limpar localStorage:", e);
        }
      }
    };
    
    verificarCooldown();
    
    // Verificar a cada minuto para atualizar o tempo restante
    const intervalo = setInterval(verificarCooldown, 60000);
    return () => clearInterval(intervalo);
  }, [userData]);

  // Função para lidar com o clique inicial no botão
  const handleClick = () => {
    setMostrarConfirmacao(true);
  };

  // Função para confirmar e apagar pontos do funcionário atual
  const confirmarLimparPontos = () => {
    try {
      if (!userData) {
        alert("Erro: Dados do usuário não disponíveis. Não foi possível limpar os registros.");
        setMostrarConfirmacao(false);
        return;
      }
      
      // 1. Obter todos os registros
      const todosRegistros = JSON.parse(localStorage.getItem('timeEntries') || '[]');
      
      // 2. Identificar o funcionário atual (tentar usar id, depois email, depois nome)
      const funcionarioAtual = userData.id || userData.email || userData.name;
      
      if (!funcionarioAtual) {
        alert("Erro: Não foi possível identificar o usuário atual.");
        setMostrarConfirmacao(false);
        return;
      }
      
      // 3. Filtrar para manter apenas registros que NÃO pertencem ao usuário atual
      // Tenta diferentes propriedades para identificar registros do usuário
      const registrosFiltrados = todosRegistros.filter(registro => {
        // Verificar todas as propriedades possíveis que podem identificar o usuário
        if (userData.id && registro.employeeId) {
          return registro.employeeId !== userData.id;
        }
        if (userData.email && registro.email) {
          return registro.email !== userData.email;
        }
        if (userData.name && registro.employeeName) {
          return registro.employeeName !== userData.name;
        }
        if (userData.name && registro.user) {
          return registro.user !== userData.name;
        }
        // Se não conseguir identificar, manter o registro
        return true;
      });
      
      // 4. Salvar os registros filtrados de volta no localStorage
      localStorage.setItem('timeEntries', JSON.stringify(registrosFiltrados));
      
      // 5. Atualizar o estado no componente pai
      setTimeEntries(registrosFiltrados);
      
      // 6. Definir uma mensagem de última ação
      setLastAction('Seus registros de ponto foram apagados!');
      
      // 7. Fechar o modal de confirmação
      setMostrarConfirmacao(false);
      
      // 8. Configurar cooldown (8 horas) específico para o funcionário
      const fimCooldown = new Date(Date.now() + 8 * 60 * 60 * 1000);
      setCooldownAtivo(true);
      setTempoAteReset('8h 0m');
      
      // 9. Salvar cooldown no localStorage com chave específica para o funcionário
      const userIdentifier = getUserIdentifier();
      localStorage.setItem(`limparPontos_cooldown_${userIdentifier}`, JSON.stringify({
        horaFim: fimCooldown.toISOString()
      }));
      
      // 10. Adicionar uma notificação para o administrador
      const nomeUsuario = userData.name || 'Um usuário';
      const notificacaoAdmin = {
        id: Date.now(),
        message: `${nomeUsuario} apagou todos os seus registros de ponto!`,
        date: new Date().toLocaleDateString('pt-BR'),
        read: false,
        urgent: true
      };
      
      const notificacoesAdmin = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
      localStorage.setItem('adminNotifications', JSON.stringify([notificacaoAdmin, ...notificacoesAdmin]));
    } catch (erro) {
      console.error("Erro ao limpar registros:", erro);
      alert("Ocorreu um erro ao limpar os registros. Por favor, tente novamente.");
      setMostrarConfirmacao(false);
    }
  };

  // Função para cancelar a operação
  const cancelarOperacao = () => {
    setMostrarConfirmacao(false);
  };

  return (
    <div className="mt-4 flex justify-end">
      {/* Botão principal - discreto e alinhado à direita */}
      <button
        onClick={handleClick}
        disabled={cooldownAtivo}
        className={`px-4 py-2 rounded-md text-sm flex items-center shadow-sm transition duration-200
          ${!cooldownAtivo 
            ? 'bg-red-600 hover:bg-red-700 text-white' 
            : 'bg-gray-600 cursor-not-allowed opacity-60 text-gray-300'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        {cooldownAtivo
          ? `Disponível em ${tempoAteReset}`
          : "Limpar Meus Registros"}
      </button>

      {/* Modal de confirmação */}
      {mostrarConfirmacao && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-purple-900 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-xl font-bold mb-4 text-white">ATENÇÃO!</h3>
            
            <div className="bg-red-900 bg-opacity-60 p-4 rounded-lg mb-4">
              <p className="text-white mb-2">Você está prestes a apagar TODOS os seus registros de ponto.</p>
              <p className="text-white font-bold">Esta ação não pode ser desfeita!</p>
              <p className="text-yellow-300 mt-2">Após limpar, esta função ficará bloqueada por 8 horas para sua conta.</p>
            </div>
            
            <p className="text-purple-300 mb-6">
              Tem certeza que deseja continuar?
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelarOperacao}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-md text-white"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarLimparPontos}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded-md text-white font-bold"
              >
                Sim, Apagar Meus Registros
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BotaoLimparPontos;