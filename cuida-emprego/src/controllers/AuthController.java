package com.cuidaemprego.backend.controller;

import com.cuidaemprego.backend.dto.AuthResponseDTO;
import com.cuidaemprego.backend.dto.LoginDTO;
import com.cuidaemprego.backend.dto.RegistroDTO;
import com.cuidaemprego.backend.model.Usuario;
import com.cuidaemprego.backend.repository.UsuarioRepository;
import com.cuidaemprego.backend.security.JwtUtil;
import com.cuidaemprego.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private JwtUtil jwtUtil;

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
            // Verifica se o login é por email
            String username = loginDTO.getUsername();
            if (username.contains("@")) {
                // Buscar usuário pelo email
                Usuario usuarioPorEmail = usuarioRepository.findByEmail(username)
                    .orElseThrow(() -> new RuntimeException("Email não encontrado"));
                // Usar o username para autenticação
                username = usuarioPorEmail.getUsername();
            }
            
            // Autenticar o usuário
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, loginDTO.getPassword())
            );
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            Usuario usuario = (Usuario) authentication.getPrincipal();
            
            // Gerar token JWT
            String token = jwtUtil.generateToken(usuario);
            
            // Converter roles para uma lista de strings
            List<String> roles = usuario.getAuthorities().stream()
                .map(grantedAuthority -> grantedAuthority.getAuthority().replace("ROLE_", ""))
                .collect(Collectors.toList());
            
            // Verificar se é admin
            boolean isAdmin = roles.contains("ADMIN");
            
            return ResponseEntity.ok(new AuthResponseDTO(
                token,
                usuario.getId(),
                usuario.getUsername(),
                usuario.getNome(),
                roles,
                isAdmin,
                roles.contains("FUNCIONARIO")
            ));
        } catch (Exception e) {
            return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body("Credenciais inválidas: " + e.getMessage());
        }
    }
}