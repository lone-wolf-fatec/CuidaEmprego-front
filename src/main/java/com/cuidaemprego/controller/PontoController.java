package com.cuidaemprego.controller;

import com.cuidaemprego.model.RegistroPonto;
import com.cuidaemprego.repository.RegistroPontoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/ponto")
public class PontoController {
    
    @Autowired
    private RegistroPontoRepository registroPontoRepository;
    
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<RegistroPonto>> getRegistrosByUsuario(@PathVariable Long usuarioId) {
        List<RegistroPonto> registros = registroPontoRepository.findByUsuarioIdOrderByDataDescHoraDesc(usuarioId);
        return ResponseEntity.ok(registros);
    }
    
    @GetMapping
    public ResponseEntity<List<RegistroPonto>> getAllRegistros() {
        List<RegistroPonto> registros = registroPontoRepository.findAllOrderByDataDescHoraDesc();
        return ResponseEntity.ok(registros);
    }
    
    @PostMapping
    public ResponseEntity<RegistroPonto> criarRegistro(@RequestBody RegistroPonto registro) {
        RegistroPonto savedRegistro = registroPontoRepository.save(registro);
        return ResponseEntity.ok(savedRegistro);
    }
    
    @DeleteMapping("/usuario/{usuarioId}")
    public ResponseEntity<String> limparRegistros(@PathVariable Long usuarioId) {
        List<RegistroPonto> registros = registroPontoRepository.findByUsuarioIdOrderByDataDescHoraDesc(usuarioId);
        registroPontoRepository.deleteAll(registros);
        return ResponseEntity.ok("Registros de ponto limpos com sucesso");
    }
}