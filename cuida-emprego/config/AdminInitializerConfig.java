package com.cuidaemprego.backend.config;

import com.cuidaemprego.backend.model.Usuario;
import com.cuidaemprego.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import javax.annotation.PostConstruct;
import java.util.HashSet;
import java.util.Set;

@Configuration
public class AdminInitializerConfig {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostConstruct
    public void initAdminUser() {
        // Verifica se já existe algum usuário com role ADMIN
        boolean adminExists = usuarioRepository.findAll().stream()
                .anyMatch(u -> u.getRoles().contains("ADMIN"));

        // Se não existir admin, cria um
        if (!adminExists) {
            Usuario admin = new Usuario();
            admin.setUsername("admin");
            admin.setNome("Administrador");
            admin.setEmail("admin@cuidaemprego.com");
            admin.setPassword(passwordEncoder.encode("admin123")); // Senha inicial
            admin.setAtivo(true);
            
            // Define a role como ADMIN
            Set<String> roles = new HashSet<>();
            roles.add("ADMIN");
            admin.setRoles(roles);
            
            usuarioRepository.save(admin);
            
            System.out.println("Usuário administrador criado com sucesso!");
            System.out.println("Username: admin");
            System.out.println("Senha: admin123");
        }
    }
}