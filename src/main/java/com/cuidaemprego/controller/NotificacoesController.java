package com.cuidaemprego.controller;

import com.cuidaemprego.model.Notificacoes;
import com.cuidaemprego.repository.NotificacoesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notificacoes")
public class NotificacoesController {
    
    @Autowired
    private NotificacoesRepository notificacoesRepository;
    
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<Notificacoes>> getNotificacoesByUsuario(@PathVariable Long usuarioId) {
        List<Notificacoes> notificacoes = notificacoesRepository.findByUsuarioIdOrderByDataEnvioDesc(usuarioId);
        return ResponseEntity.ok(notificacoes);
    }
    
    @GetMapping("/admin")
    public ResponseEntity<List<Notificacoes>> getAdminNotifications() {
        List<Notificacoes> notificacoes = notificacoesRepository.findAdminNotifications();
        return ResponseEntity.ok(notificacoes);
    }
    
    @GetMapping
    public ResponseEntity<List<Notificacoes>> getAllNotificacoes() {
        List<Notificacoes> notificacoes = notificacoesRepository.findAllOrderByDataEnvioDesc();
        return ResponseEntity.ok(notificacoes);
    }
    
    @PostMapping
    public ResponseEntity<Notificacoes> criarNotificacao(@RequestBody Notificacoes notificacao) {
        Notificacoes savedNotificacao = notificacoesRepository.save(notificacao);
        return ResponseEntity.ok(savedNotificacao);
    }
    
    @PutMapping("/{id}/lida")
    public ResponseEntity<String> marcarComoLida(@PathVariable Long id) {
        Notificacoes notificacao = notificacoesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notificação não encontrada"));
        
        notificacao.setLida(true);
        notificacoesRepository.save(notificacao);
        
        return ResponseEntity.ok("Notificação marcada como lida");
    }
    
    @PutMapping("/usuario/{usuarioId}/marcar-todas-lidas")
    public ResponseEntity<String> marcarTodasComoLidas(@PathVariable Long usuarioId) {
        List<Notificacoes> notificacoes = notificacoesRepository.findByUsuarioIdOrderByDataEnvioDesc(usuarioId);
        
        notificacoes.forEach(notificacao -> notificacao.setLida(true));
        notificacoesRepository.saveAll(notificacoes);
        
        return ResponseEntity.ok("Todas as notificações marcadas como lidas");
    }
}