package com.cuidaemprego.controller;

import com.cuidaemprego.model.Ausencias;
import com.cuidaemprego.repository.AusenciasRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/ausencias")
public class AusenciasController {
    
    @Autowired
    private AusenciasRepository ausenciasRepository;
    
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<Ausencias>> getAusenciasByUsuario(@PathVariable Long usuarioId) {
        List<Ausencias> ausencias = ausenciasRepository.findByUsuarioIdOrderByDataDesc(usuarioId);
        return ResponseEntity.ok(ausencias);
    }
    
    @GetMapping
    public ResponseEntity<List<Ausencias>> getAllAusencias() {
        List<Ausencias> ausencias = ausenciasRepository.findAllOrderByDataSolicitacaoDesc();
        return ResponseEntity.ok(ausencias);
    }
    
    @PostMapping
    public ResponseEntity<Ausencias> criarAusencia(@RequestBody Ausencias ausencia) {
        Ausencias savedAusencia = ausenciasRepository.save(ausencia);
        return ResponseEntity.ok(savedAusencia);
    }
}

