import axios from 'axios';

// Configuração do axios
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token de autenticação
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Estados adicionais para observações
const [observacoes, setObservacoes] = useState({});
const [salvandoObservacao, setSalvandoObservacao] = useState(false);

// Função para iniciar edição de observação com carregamento das existentes
const iniciarEdicaoObservacao = async (registroId) => {
  setEditandoObservacao(registroId);
  const registro = pontoRegistros.find(r => r.id === registroId);
  
  // Tentar carregar observações existentes da API
  try {
    const response = await axiosInstance.get(`/observacoes/registro/${registroId}`);
    if (response.data && response.data.length > 0) {
      // Pegar a observação mais recente
      const observacaoMaisRecente = response.data[0];
      setObservacoes(prev => ({
        ...prev,
        [registroId]: response.data
      }));
    }
  } catch (error) {
    console.error('Erro ao carregar observações:', error);
  }
  
  setTimeout(() => {
    if (observacaoInputRef.current) {
      observacaoInputRef.current.value = registro?.observacoes || '';
      observacaoInputRef.current.focus();
    }
  }, 100);
};

// Função para salvar observação com POST para API
const salvarObservacaoComAPI = async () => {
  if (!editandoObservacao) return;
  
  const novaObservacao = observacaoInputRef.current?.value || '';
  if (!novaObservacao.trim()) {
    alert('Por favor, digite uma observação.');
    return;
  }
  
  const registro = pontoRegistros.find(r => r.id === editandoObservacao);
  if (!registro) {
    alert('Registro não encontrado.');
    return;
  }
  
  setSalvandoObservacao(true);
  
  try {
    // Dados da observação para enviar à API
    const observacaoData = {
      registroId: editandoObservacao,
      funcionarioId: registro.funcionarioId,
      funcionarioNome: registro.funcionarioNome,
      data: registro.data,
      observacao: novaObservacao.trim(),
      autorId: getCurrentUserId(), // Função para pegar ID do usuário logado
      autorNome: getCurrentUserName(), // Função para pegar nome do usuário logado
      categoria: 'ponto',
      prioridade: 'normal',
      dataRegistro: new Date().toISOString(),
      modeloTrabalho: registro.modeloTrabalho,
      statusRegistros: registro.registros.map(r => ({
        tipo: r.tipo,
        status: r.status,
        hora: r.hora
      }))
    };
    
    // POST para criar a observação na API
    const response = await axiosInstance.post('/observacoes', observacaoData);
    
    if (response.status === 201 || response.status === 200) {
      // Sucesso na API
      console.log('Observação criada na API:', response.data);
      
      // Atualizar também o localStorage (mantém compatibilidade)
      const novosRegistros = pontoRegistros.map(r => {
        if (r.id === editandoObservacao) {
          return { ...r, observacoes: novaObservacao };
        }
        return r;
      });
      
      setPontoRegistros(novosRegistros);
      localStorage.setItem('pontoRegistros', JSON.stringify(novosRegistros));
      
      // Atualizar estado das observações
      setObservacoes(prev => ({
        ...prev,
        [editandoObservacao]: [
          ...(prev[editandoObservacao] || []),
          response.data
        ]
      }));
      
      // Criar notificação para o funcionário
      try {
        await axiosInstance.post('/notificacoes', {
          userId: registro.funcionarioId,
          message: `Nova observação adicionada ao seu registro de ponto de ${registro.data}`,
          tipo: 'observacao_ponto',
          registroId: editandoObservacao,
          data: registro.data,
          urgente: false
        });
      } catch (notifError) {
        console.warn('Erro ao enviar notificação:', notifError);
        // Fallback para localStorage
        const notificacoes = JSON.parse(localStorage.getItem('userNotifications') || '[]');
        notificacoes.push({
          id: Date.now(),
          userId: registro.funcionarioId,
          message: `Nova observação adicionada ao seu registro de ponto de ${registro.data}`,
          date: new Date().toLocaleDateString('pt-BR'),
          read: false,
          tipo: 'observacao_ponto'
        });
        localStorage.setItem('userNotifications', JSON.stringify(notificacoes));
      }
      
      alert(`Observação salva com sucesso para ${registro.funcionarioNome}!`);
      setEditandoObservacao(null);
      
    } else {
      throw new Error('Resposta inesperada da API');
    }
    
  } catch (error) {
    console.error('Erro ao salvar observação:', error);
    
    let mensagemErro = 'Erro ao salvar observação na API. ';
    
    if (error.response) {
      // Erro de resposta do servidor
      switch (error.response.status) {
        case 400:
          mensagemErro += 'Dados inválidos enviados.';
          break;
        case 401:
          mensagemErro += 'Não autorizado. Faça login novamente.';
          break;
        case 403:
          mensagemErro += 'Sem permissão para criar observações.';
          break;
        case 404:
          mensagemErro += 'Endpoint não encontrado.';
          break;
        case 500:
          mensagemErro += 'Erro interno do servidor.';
          break;
        default:
          mensagemErro += `Status: ${error.response.status}`;
      }
    } else if (error.request) {
      mensagemErro += 'Servidor não respondeu. Verifique sua conexão.';
    } else {
      mensagemErro += error.message;
    }
    
    // Perguntar se quer salvar localmente como fallback
    if (window.confirm(`${mensagemErro}\n\nDeseja salvar apenas localmente?`)) {
      salvarObservacaoLocal(novaObservacao);
    }
    
  } finally {
    setSalvandoObservacao(false);
  }
};

// Função fallback para salvar localmente
const salvarObservacaoLocal = (novaObservacao) => {
  const novosRegistros = pontoRegistros.map(registro => {
    if (registro.id === editandoObservacao) {
      return { ...registro, observacoes: novaObservacao };
    }
    return registro;
  });
  
  setPontoRegistros(novosRegistros);
  localStorage.setItem('pontoRegistros', JSON.stringify(novosRegistros));
  setEditandoObservacao(null);
  alert('Observação salva localmente com sucesso!');
};

// Funções auxiliares para obter dados do usuário
const getCurrentUserId = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.id || user.userId || 1; // Fallback para ID 1
};

const getCurrentUserName = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.name || user.nome || 'Administrador'; // Fallback
};

// Componente do botão Observar atualizado
const BotaoObservar = ({ registro }) => (
  <button
    onClick={() => iniciarEdicaoObservacao(registro.id)}
    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded p-1 text-xs flex items-center"
    title="Adicionar observação"
    disabled={salvandoObservacao}
  >
    {salvandoObservacao && editandoObservacao === registro.id ? (
      <>
        <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Salvando...
      </>
    ) : (
      <>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Observar
      </>
    )}
  </button>
);

// Modal de observação atualizado
const ModalObservacao = () => (
  editandoObservacao !== null && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-purple-900 p-6 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Adicionar Observação</h2>
        
        {/* Mostrar observações existentes */}
        {observacoes[editandoObservacao] && observacoes[editandoObservacao].length > 0 && (
          <div className="mb-4 p-3 bg-purple-800 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Observações Anteriores:</h3>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {observacoes[editandoObservacao].map((obs, index) => (
                <div key={index} className="text-xs bg-purple-700 p-2 rounded">
                  <div className="font-medium">{obs.autorNome}</div>
                  <div className="text-purple-300">{new Date(obs.dataRegistro).toLocaleString('pt-BR')}</div>
                  <div className="mt-1">{obs.observacao}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-sm text-purple-300 mb-2">Nova Observação:</label>
          <textarea
            ref={observacaoInputRef}
            className="w-full bg-purple-800 border border-purple-700 rounded-md p-3 text-white h-32"
            placeholder="Digite sua observação sobre este registro..."
            disabled={salvandoObservacao}
          ></textarea>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setEditandoObservacao(null)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
            disabled={salvandoObservacao}
          >
            Cancelar
          </button>
          <button
            onClick={salvarObservacaoComAPI}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded flex items-center"
            disabled={salvandoObservacao}
          >
            {salvandoObservacao ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Salvando...
              </>
            ) : (
              'Salvar Observação'
            )}
          </button>
        </div>
      </div>
    </div>
  )
);

// Exportar componentes
export { BotaoObservar, ModalObservacao, salvarObservacaoComAPI };