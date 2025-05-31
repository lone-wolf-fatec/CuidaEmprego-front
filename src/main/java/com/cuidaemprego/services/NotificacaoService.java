package com.cuidaemprego.services;

import com.cuidaemprego.model.Notificacoes;
import com.cuidaemprego.repository.NotificacoesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class NotificacaoService {
    
    @Autowired
    private NotificacoesRepository notificacoesRepository;
    
    public Notificacoes enviarNotificacao(String destinatario, Long remetente, String mensagem, String tipo, Boolean urgente) {
        Notificacoes notificacao = new Notificacoes();
        notificacao.setDestinatario(destinatario);
        notificacao.setRemetente(remetente);
        notificacao.setMensagem(mensagem);
        notificacao.setTipo(tipo);
        notificacao.setUrgente(urgente != null ? urgente : false);
        
        // Se destinatário for ADMIN, não precisa de usuarioId específico
        if (!"ADMIN".equals(destinatario)) {
            try {
                Long usuarioId = Long.parseLong(destinatario);
                notificacao.setUsuarioId(usuarioId);
            } catch (NumberFormatException e) {
                // Se não conseguir converter, deixa como ADMIN
                notificacao.setDestinatario("ADMIN");
            }
        }
        
        return notificacoesRepository.save(notificacao);
    }
    
    public List<Notificacoes> getNotificacoesByUsuario(Long usuarioId) {
        return notificacoesRepository.findByUsuarioIdOrderByDataEnvioDesc(usuarioId);
    }
    
    public List<Notificacoes> getNotificacoesAdmin() {
        return notificacoesRepository.findAdminNotifications();
    }
    
    public void marcarComoLida(Long notificacaoId) {
        Notificacoes notificacao = notificacoesRepository.findById(notificacaoId)
                .orElseThrow(() -> new RuntimeException("Notificação não encontrada"));
        
        notificacao.setLida(true);
        notificacoesRepository.save(notificacao);
    }
    
    public void marcarTodasComoLidas(Long usuarioId) {
        List<Notificacoes> notificacoes = notificacoesRepository.findByUsuarioIdOrderByDataEnvioDesc(usuarioId);
        notificacoes.forEach(n -> n.setLida(true));
        notificacoesRepository.saveAll(notificacoes);
    }
}
