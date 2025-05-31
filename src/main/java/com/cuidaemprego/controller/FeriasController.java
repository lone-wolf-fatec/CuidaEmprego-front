package com.cuidaemprego.controller;

import com.cuidaemprego.model.Ferias;
import com.cuidaemprego.services.FeriasService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ferias")
@CrossOrigin(origins = "*") // Para evitar problemas CORS (ajuste conforme sua necessidade)
public class FeriasController {

    @Autowired
    private FeriasService feriasService;

    @GetMapping
    public List<Ferias> getAllFerias() {
        return feriasService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ferias> getFeriasById(@PathVariable Long id) {
        return feriasService.findById(id)
                .map(ferias -> ResponseEntity.ok().body(ferias))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Ferias createFerias(@RequestBody Ferias ferias) {
        return feriasService.save(ferias);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Ferias> updateFerias(@PathVariable Long id, @RequestBody Ferias feriasDetails) {
        return feriasService.findById(id)
                .map(ferias -> {
                    ferias.setFuncionario(feriasDetails.getFuncionario());
                    ferias.setDataInicio(feriasDetails.getDataInicio());
                    ferias.setDataFim(feriasDetails.getDataFim());
                    ferias.setStatus(feriasDetails.getStatus());
                    Ferias updated = feriasService.save(ferias);
                    return ResponseEntity.ok(updated);
                }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFerias(@PathVariable Long id) {
        feriasService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
