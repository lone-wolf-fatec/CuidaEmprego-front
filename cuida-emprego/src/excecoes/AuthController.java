package com.cuidaemprego.backend.controller;

import com.cuidaemprego.backend.dto.AuthResponseDTO;
import com.cuidaemprego.backend.dto.LoginDTO;
import com.cuidaemprego.backend.dto.RegistroDTO;
import com.cuidaemprego.backend.model.Usuario;
import com.cuidaemprego.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {
    
    @Autowired
    private UserService userService;

    @PostMapping("/registro")
    public ResponseEntity<?> registrarUsuario(
        @Valid @RequestBody RegistroDTO registroDTO
    ) {
        try {
            Usuario usuario = userService.registrarNovoUsuario(registroDTO);
            return ResponseEntity.ok("Usuário registrado com sucesso");
        } catch (Exception e) {
            return ResponseEntity
                .badRequest()
                .body(e.getMessage());
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(
        @Valid @RequestBody LoginDTO loginDTO
    ) {
        try {
            String token = userService.autenticarUsuario(loginDTO);
            
            // Recuperar usuário autenticado
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            Usuario usuario = (Usuario) authentication.getPrincipal();
            
            return ResponseEntity.ok(
                new AuthResponseDTO(
                    token, 
                    usuario.getId(), 
                    usuario.getUsername(), 
                    usuario.getNome(), 
                    usuario.getRoles()
                )
            );
        } catch (Exception e) {
            return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body("Credenciais inválidas");
        }
    }
}