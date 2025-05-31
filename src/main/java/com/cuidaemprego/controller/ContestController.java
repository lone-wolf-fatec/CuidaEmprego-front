package com.cuidaemprego.controller;

import com.cuidaemprego.model.AjustePonto;
import com.cuidaemprego.services.ContestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contests")
public class ContestController {
    
    @Autowired
    private ContestService contestService;
    
    @PostMapping
    public ResponseEntity<AjustePonto> contestarRegistro(@RequestBody Map<String, Object> request) {
        try {
            Long usuarioId = Long.valueOf(request.get("usuarioId").toString());
            Long registroId = Long.valueOf(request.get("registroId").toString());
            String motivo = request.get("motivo").toString();
            String novaHora = request.get("novaHora").toString();
            
            AjustePonto contestacao = contestService.contestarRegistro(usuarioId, registroId, motivo, novaHora);
            return ResponseEntity.ok(contestacao);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<AjustePonto>> getContestacoesUsuario(@PathVariable Long usuarioId) {
        List<AjustePonto> contestacoes = contestService.getContestacoesUsuario(usuarioId);
        return ResponseEntity.ok(contestacoes);
    }
    
    @GetMapping
    public ResponseEntity<List<AjustePonto>> getAllContestacoes() {
        List<AjustePonto> contestacoes = contestService.getContestacoesUsuario(null); // Para admin ver todas
        return ResponseEntity.ok(contestacoes);
    }
    
    @PutMapping("/{contestacaoId}/aprovar")
    public ResponseEntity<String> aprovarContestacao(@PathVariable Long contestacaoId) {
        try {
            contestService.aprovarContestacao(contestacaoId);
            return ResponseEntity.ok("Contestação aprovada com sucesso");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PutMapping("/{contestacaoId}/rejeitar")
    public ResponseEntity<String> rejeitarContestacao(@PathVariable Long contestacaoId, 
                                                     @RequestBody Map<String, String> request) {
        try {
            String observacao = request.getOrDefault("observacao", "");
            contestService.rejeitarContestacao(contestacaoId, observacao);
            return ResponseEntity.ok("Contestação rejeitada");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @GetMapping("/pendentes")
    public ResponseEntity<List<AjustePonto>> getContestacoesPendentes() {
        // TODO: Implementar método no service para buscar apenas pendentes
        List<AjustePonto> contestacoes = contestService.getContestacoesUsuario(null);
        List<AjustePonto> pendentes = contestacoes.stream()
                .filter(c -> "pendente".equals(c.getStatus()))
                .toList();
        return ResponseEntity.ok(pendentes);
    }
}
