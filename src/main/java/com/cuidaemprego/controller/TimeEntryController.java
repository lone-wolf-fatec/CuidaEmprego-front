package com.cuidaemprego.controller;

import com.cuidaemprego.model.RegistroPonto;
import com.cuidaemprego.services.TimeEntryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/time-entry")
public class TimeEntryController {
    
    @Autowired
    private TimeEntryService timeEntryService;
    
    @PostMapping("/register")
    public ResponseEntity<RegistroPonto> registerTimeEntry(@RequestBody Map<String, Object> request) {
        try {
            Long usuarioId = Long.valueOf(request.get("usuarioId").toString());
            String tipo = request.get("tipo").toString();
            
            RegistroPonto registro = timeEntryService.registerTimeEntry(usuarioId, tipo);
            return ResponseEntity.ok(registro);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/can-register-entry/{usuarioId}")
    public ResponseEntity<Map<String, Boolean>> canRegisterEntry(@PathVariable Long usuarioId) {
        boolean canRegister = timeEntryService.canRegisterEntry(usuarioId);
        Map<String, Boolean> response = new HashMap<>();
        response.put("canRegister", canRegister);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/can-register-exit/{usuarioId}")
    public ResponseEntity<Map<String, Boolean>> canRegisterExit(@PathVariable Long usuarioId) {
        boolean canRegister = timeEntryService.canRegisterExit(usuarioId);
        Map<String, Boolean> response = new HashMap<>();
        response.put("canRegister", canRegister);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/count-today/{usuarioId}")
    public ResponseEntity<Map<String, Integer>> getCountToday(@PathVariable Long usuarioId) {
        int count = timeEntryService.getCountRegistrosHoje(usuarioId);
        Map<String, Integer> response = new HashMap<>();
        response.put("count", count);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/batch-register")
    public ResponseEntity<String> batchRegister(@RequestBody Map<String, Object> request) {
        try {
            Long usuarioId = Long.valueOf(request.get("usuarioId").toString());
            @SuppressWarnings("unchecked")
            java.util.List<String> tipos = (java.util.List<String>) request.get("tipos");
            
            for (String tipo : tipos) {
                timeEntryService.registerTimeEntry(usuarioId, tipo);
            }
            
            return ResponseEntity.ok("Registros criados com sucesso");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao criar registros: " + e.getMessage());
        }
    }
}