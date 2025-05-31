package com.empresa.controleponto.controller;

import com.empresa.controleponto.dto.UsuarioDTO;
import com.empresa.controleponto.model.Usuario;
import com.empresa.controleponto.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000") // Permite chamadas do React
public class UsuarioController {
    
    private final UsuarioService usuarioService;

    @Autowired
    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    /**
     * Retorna todos os usuários ativos em formato DTO para o frontend
     */
    @GetMapping
    public ResponseEntity<List<UsuarioDTO>> getAllUsers() {
        List<Usuario> usuarios = usuarioService.getAllUsuarios();
        
        // Converter para DTO para não expor dados sensíveis como senha
        List<UsuarioDTO> usuariosDTO = usuarios.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
            
        return ResponseEntity.ok(usuariosDTO);
    }
    
    /**
     * Busca um usuário específico pelo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<UsuarioDTO> getUserById(@PathVariable Long id) {
        Usuario usuario = usuarioService.getUsuarioById(id);
        if (usuario == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(convertToDTO(usuario));
    }
    
    /**
     * Converte um usuário para DTO (Data Transfer Object)
     */
    private UsuarioDTO convertToDTO(Usuario usuario) {
        UsuarioDTO dto = new UsuarioDTO();
        dto.setId(usuario.getId());
        dto.setNome(usuario.getNome());
        dto.setUsername(usuario.getUsername());
        dto.setEmail(usuario.getEmail());
        dto.setRoles(usuario.getRoles());
        dto.setAtivo(usuario.isAtivo());
        return dto;
    }
}