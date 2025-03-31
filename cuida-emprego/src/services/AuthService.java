package com.empresa.controleponto.service;

import com.empresa.controleponto.dto.JwtResponse;
import com.empresa.controleponto.dto.LoginRequest;
import com.empresa.controleponto.dto.UsuarioDTO;
import com.empresa.controleponto.model.Usuario;
import com.empresa.controleponto.repository.UsuarioRepository;
import com.empresa.controleponto.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;

    public JwtResponse authenticate(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtil.generateToken((Usuario) authentication.getPrincipal());

        Usuario userDetails = (Usuario) authentication.getPrincipal();
        List<String> roles = new ArrayList<>(userDetails.getRoles());

        return new JwtResponse(
                jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getNome(),
                roles
        );
    }

    @Transactional
    public Usuario registrarUsuario(UsuarioDTO usuarioDTO, boolean isAdmin) {
        if (usuarioRepository.existsByUsername(usuarioDTO.getUsername())) {
            throw new RuntimeException("Nome de usuário já está em uso!");
        }

        if (usuarioRepository.existsByEmail(usuarioDTO.getEmail())) {
            throw new RuntimeException("E-mail já está em uso!");
        }

        // Criar novo usuário
        Usuario usuario = new Usuario();
        usuario.setUsername(usuarioDTO.getUsername());
        usuario.setNome(usuarioDTO.getNome());
        usuario.setEmail(usuarioDTO.getEmail());
        usuario.setPassword(encoder.encode(usuarioDTO.getPassword()));

        Set<String> roles = new HashSet<>();
        
        if (isAdmin) {
            roles.add("ADMIN");
        } else {
            roles.add("FUNCIONARIO");
        }
        
        usuario.setRoles(roles);
        
        return usuarioRepository.save(usuario);
    }
}