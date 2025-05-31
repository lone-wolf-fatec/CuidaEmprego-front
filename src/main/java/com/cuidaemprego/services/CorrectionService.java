package com.cuidaemprego.services;

import com.cuidaemprego.model.AjustePonto;
import com.cuidaemprego.model.RegistroPonto;
import com.cuidaemprego.repository.AjustePontoRepository;
import com.cuidaemprego.repository.RegistroPontoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class CorrectionService {
    
    @Autowired
    private AjustePontoRepository ajustePontoRepository;
    
    @Autowired
    private RegistroPontoRepository registroPontoRepository;
    
    @Autowired
    private NotificacaoService notificacaoService;
    
    public AjustePonto submitCorrection(Long usuarioId, String dataStr, String tipoRegistro, 
                                      String horaOriginal, String horaCorreta, String motivo) {
        // Parse da data do formato brasileiro DD/MM/YYYY
        LocalDate data;
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            data = LocalDate.parse(dataStr, formatter);
        } catch (Exception e) {
            // Tentar formato ISO
            data = LocalDate.parse(dataStr);
        }
        
        AjustePonto ajuste = new AjustePonto();
        ajuste.setUsuarioId(usuarioId);
        ajuste.setData(data);
        ajuste.setTipoRegistro(tipoRegistro);
        ajuste.setHoraOriginal(horaOriginal);
        ajuste.setHoraCorreta(horaCorreta);
        ajuste.setMotivo(motivo);
        ajuste.setStatus("pendente");
        
        AjustePonto savedAjuste = ajustePontoRepository.save(ajuste);
        
        // Enviar notificação para admin
        String mensagem = String.format("Solicitação de correção de %s do dia %s: %s → %s. Motivo: %s", 
                                       tipoRegistro, dataStr, horaOriginal, horaCorreta, motivo);
        notificacaoService.enviarNotificacao("ADMIN", usuarioId, mensagem, "CORRECAO_PONTO", false);
        
        return savedAjuste;
    }
    
    public boolean temSolicitacaoPendente(Long usuarioId, String dataStr, String tipoRegistro) {
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            LocalDate data = LocalDate.parse(dataStr, formatter);
            
            return ajustePontoRepository.findByUsuarioIdOrderByDataSolicitacaoDesc(usuarioId)
                    .stream()
                    .anyMatch(a -> a.getData().equals(data) && 
                                  a.getTipoRegistro().equals(tipoRegistro) && 
                                  "pendente".equals(a.getStatus()));
        } catch (Exception e) {
            return false;
        }
    }
    
    public List<AjustePonto> getSolicitacoesPendentes(Long usuarioId) {
        return ajustePontoRepository.findByUsuarioIdOrderByDataSolicitacaoDesc(usuarioId)
                .stream()
                .filter(a -> "pendente".equals(a.getStatus()))
                .toList();
    }
    
    public void processarCorrecao(Long ajusteId, boolean aprovado, String observacao) {
        AjustePonto ajuste = ajustePontoRepository.findById(ajusteId)
                .orElseThrow(() -> new RuntimeException("Ajuste não encontrado"));
        
        if (aprovado) {
            ajuste.setStatus("aprovado");
            // Aplicar a correção no registro original
            aplicarCorrecao(ajuste);
        } else {
            ajuste.setStatus("rejeitado");
            ajuste.setObservacao(observacao);
        }
        
        ajustePontoRepository.save(ajuste);
    }
    
    private void aplicarCorrecao(AjustePonto ajuste) {
        // Buscar o registro original e atualizar
        List<RegistroPonto> registros = registroPontoRepository
                .findByDataAndUsuarioIdOrderByHora(ajuste.getData(), ajuste.getUsuarioId());
        
        registros.stream()
                .filter(r -> r.getTipo().equals(ajuste.getTipoRegistro()) && 
                            r.getHora().equals(ajuste.getHoraOriginal()))
                .findFirst()
                .ifPresent(registro -> {
                    registro.setHora(ajuste.getHoraCorreta());
                    registro.setStatus("ajustado");
                    registroPontoRepository.save(registro);
                });
    }
}
