package com.empresa.controleponto.service;

import com.empresa.controleponto.model.Usuario;
import com.empresa.controleponto.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    @Autowired
    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    /**
     * Retorna todos os usuários ativos
     */
    public List<Usuario> getAllUsuarios() {
        return usuarioRepository.findAll()
                .stream()
                .filter(Usuario::isAtivo)
                .collect(Collectors.toList());
    }
    
    /**
     * Busca um usuário pelo ID
     */
    public Usuario getUsuarioById(Long id) {
        return usuarioRepository.findById(id).orElse(null);
    }
    
    /**
     * Busca um usuário pelo username
     */
    public Usuario getUsuarioByUsername(String username) {
        return usuarioRepository.findByUsername(username).orElse(null);
    }
}