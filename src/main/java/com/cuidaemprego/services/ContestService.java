package com.cuidaemprego.services;

import com.cuidaemprego.model.AjustePonto;
import com.cuidaemprego.repository.AjustePontoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ContestService {
    
    @Autowired
    private AjustePontoRepository ajustePontoRepository;
    
    @Autowired
    private NotificacaoService notificacaoService;
    
    public AjustePonto contestarRegistro(Long usuarioId, Long registroId, String motivo, String novaHora) {
        AjustePonto contestacao = new AjustePonto();
        contestacao.setUsuarioId(usuarioId);
        contestacao.setMotivo(motivo);
        contestacao.setHoraCorreta(novaHora);
        contestacao.setStatus("pendente");
        
        AjustePonto savedContestacao = ajustePontoRepository.save(contestacao);
        
        // Notificar admin
        String mensagem = String.format("Contestação de registro: %s", motivo);
        notificacaoService.enviarNotificacao("ADMIN", usuarioId, mensagem, "CONTESTACAO", false);
        
        return savedContestacao;
    }
    
    public List<AjustePonto> getContestacoesUsuario(Long usuarioId) {
        return ajustePontoRepository.findByUsuarioIdOrderByDataSolicitacaoDesc(usuarioId);
    }
    
    public void aprovarContestacao(Long contestacaoId) {
        AjustePonto contestacao = ajustePontoRepository.findById(contestacaoId)
                .orElseThrow(() -> new RuntimeException("Contestação não encontrada"));
        
        contestacao.setStatus("aprovado");
        ajustePontoRepository.save(contestacao);
    }
    
    public void rejeitarContestacao(Long contestacaoId, String observacao) {
        AjustePonto contestacao = ajustePontoRepository.findById(contestacaoId)
                .orElseThrow(() -> new RuntimeException("Contestação não encontrada"));
        
        contestacao.setStatus("rejeitado");
        contestacao.setObservacao(observacao);
        ajustePontoRepository.save(contestacao);
    }
}