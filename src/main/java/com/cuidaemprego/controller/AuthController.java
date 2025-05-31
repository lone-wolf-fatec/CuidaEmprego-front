package com.cuidaemprego.controller;

import com.cuidaemprego.dto.LoginRequest;
import com.cuidaemprego.dto.LoginResponse;
import com.cuidaemprego.dto.RegisterRequest;
import com.cuidaemprego.dto.FuncionarioResponse;
import com.cuidaemprego.model.User;
import com.cuidaemprego.services.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            User user = authService.authenticate(loginRequest.getEmail(), loginRequest.getPassword());
            
            if (user != null) {
                LoginResponse response = new LoginResponse(
                    user.getId(),
                    user.getEmail(),
                    user.getUsername(),
                    Arrays.asList(user.getRole()),
                    "dummy-token", // Você pode implementar JWT aqui
                    user.getIsAdmin()
                );
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body("Credenciais inválidas");
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro no login: " + e.getMessage());
        }
    }
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest registerRequest) {
        try {
            User user = authService.register(
                registerRequest.getName(), 
                registerRequest.getEmail(), 
                registerRequest.getPassword()
            );
            
            FuncionarioResponse response = new FuncionarioResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getIsAdmin()
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro no registro: " + e.getMessage());
        }
    }
    
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestParam Long userId) {
        try {
            User user = authService.findById(userId);
            if (user != null) {
                FuncionarioResponse response = new FuncionarioResponse(
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getIsAdmin()
                );
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro: " + e.getMessage());
        }
    }
}