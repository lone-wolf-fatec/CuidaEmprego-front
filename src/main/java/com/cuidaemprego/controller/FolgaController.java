package com.cuidaemprego.controller;

import com.cuidaemprego.model.Folgas;
import com.cuidaemprego.services.FolgaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/folgas")
public class FolgaController {

    @Autowired
    private FolgaService folgaService;

    // Solicita uma nova folga
    @PostMapping("/solicitar")
    public ResponseEntity<Folgas> solicitarFolga(
            @RequestParam Long usuarioId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) String motivo
    ) {
        Folgas folga = folgaService.solicitarFolga(usuarioId, data, tipo, motivo);
        return ResponseEntity.ok(folga);
    }

    // Lista todas as folgas de um usuário
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<Folgas>> listarFolgasPorUsuario(@PathVariable Long usuarioId) {
        List<Folgas> folgas = folgaService.getFolgasByUsuario(usuarioId);
        return ResponseEntity.ok(folgas);
    }

    // Lista todas as folgas (admin)
    @GetMapping("/todas")
    public ResponseEntity<List<Folgas>> listarTodasFolgas() {
        return ResponseEntity.ok(folgaService.getTodasFolgas());
    }

    // Próxima folga aprovada de um usuário
    @GetMapping("/proxima/{usuarioId}")
    public ResponseEntity<Folgas> proximaFolga(@PathVariable Long usuarioId) {
        Optional<Folgas> proxima = folgaService.getProximaFolgaAprovada(usuarioId);
        return proxima.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }

    // Folgas do dia atual
    @GetMapping("/hoje")
    public ResponseEntity<List<Folgas>> folgasHoje() {
        return ResponseEntity.ok(folgaService.getFolgasDoDia(LocalDate.now()));
    }

    // Folgas da semana
    @GetMapping("/semana")
    public ResponseEntity<List<Folgas>> folgasDaSemana(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim
    ) {
        return ResponseEntity.ok(folgaService.getFolgasDaSemana(inicio, fim));
    }

    // Folgas pendentes e vencidas (não aprovadas e já passaram)
    @GetMapping("/pendentes-vencidas")
    public ResponseEntity<List<Folgas>> folgasPendentesVencidas() {
        return ResponseEntity.ok(folgaService.getFolgasPendentesVencidas());
    }

    // Estatísticas de folgas do usuário
    @GetMapping("/estatisticas/{usuarioId}")
    public ResponseEntity<List<Object[]>> estatisticasFolgas(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(folgaService.getEstatisticasPorUsuario(usuarioId));
    }
}
