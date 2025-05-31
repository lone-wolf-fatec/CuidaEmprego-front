package com.cuidaemprego.controller;

import com.cuidaemprego.model.AjustePonto;
import com.cuidaemprego.services.CorrectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/corrections")
public class CorrectionController {
    
    @Autowired
    private CorrectionService correctionService;
    
    @PostMapping
    public ResponseEntity<AjustePonto> submitCorrection(@RequestBody Map<String, Object> request) {
        try {
            Long usuarioId = Long.valueOf(request.get("usuarioId").toString());
            String data = request.get("data").toString();
            String tipoRegistro = request.get("tipoRegistro").toString();
            String horaOriginal = request.get("horaOriginal").toString();
            String horaCorreta = request.get("horaCorreta").toString();
            String motivo = request.get("motivo").toString();
            
            AjustePonto ajuste = correctionService.submitCorrection(
                usuarioId, data, tipoRegistro, horaOriginal, horaCorreta, motivo);
            return ResponseEntity.ok(ajuste);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<AjustePonto>> getCorrecoesUsuario(@PathVariable Long usuarioId) {
        List<AjustePonto> correcoes = correctionService.getSolicitacoesPendentes(usuarioId);
        return ResponseEntity.ok(correcoes);
    }
    
    @GetMapping("/usuario/{usuarioId}/pendentes")
    public ResponseEntity<List<AjustePonto>> getSolicitacoesPendentes(@PathVariable Long usuarioId) {
        List<AjustePonto> pendentes = correctionService.getSolicitacoesPendentes(usuarioId);
        return ResponseEntity.ok(pendentes);
    }
    
    @GetMapping("/tem-pendente")
    public ResponseEntity<Boolean> temSolicitacaoPendente(@RequestParam Long usuarioId,
                                                         @RequestParam String data,
                                                         @RequestParam String tipoRegistro) {
        boolean temPendente = correctionService.temSolicitacaoPendente(usuarioId, data, tipoRegistro);
        return ResponseEntity.ok(temPendente);
    }
    
    @GetMapping
    public ResponseEntity<List<AjustePonto>> getAllCorrecoes() {
        // Para admin ver todas as correções
        List<AjustePonto> correcoes = correctionService.getSolicitacoesPendentes(null);
        return ResponseEntity.ok(correcoes);
    }
    
    @PutMapping("/{ajusteId}/processar")
    public ResponseEntity<String> processarCorrecao(@PathVariable Long ajusteId,
                                                   @RequestBody Map<String, Object> request) {
        try {
            boolean aprovado = Boolean.parseBoolean(request.get("aprovado").toString());
            String observacao = request.getOrDefault("observacao", "").toString();
            
            correctionService.processarCorrecao(ajusteId, aprovado, observacao);
            return ResponseEntity.ok(aprovado ? "Correção aprovada" : "Correção rejeitada");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PutMapping("/{ajusteId}/aprovar")
    public ResponseEntity<String> aprovarCorrecao(@PathVariable Long ajusteId) {
        try {
            correctionService.processarCorrecao(ajusteId, true, "");
            return ResponseEntity.ok("Correção aprovada com sucesso");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PutMapping("/{ajusteId}/rejeitar")
    public ResponseEntity<String> rejeitarCorrecao(@PathVariable Long ajusteId,
                                                  @RequestBody Map<String, String> request) {
        try {
            String observacao = request.getOrDefault("observacao", "");
            correctionService.processarCorrecao(ajusteId, false, observacao);
            return ResponseEntity.ok("Correção rejeitada");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
