package com.cuidaemprego.services;

import com.cuidaemprego.model.User;
import com.cuidaemprego.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    // Se você não tiver Spring Security configurado, remova esta dependência
    // @Autowired
    // private PasswordEncoder passwordEncoder;
    
    public User authenticate(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            // TEMPORÁRIO: Comparação de senha simples (INSEGURO para produção)
            // Em produção, use: passwordEncoder.matches(password, user.getPassword())
            if (password.equals(user.getPassword())) {
                return user;
            }
        }
        
        return null;
    }
    
    public User register(String name, String email, String password) {
        // Verificar se email já existe
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email já está em uso");
        }
        
        User user = new User();
        user.setUsername(name);
        user.setEmail(email);
        
        // TEMPORÁRIO: Salvar senha em texto plano (INSEGURO para produção)
        // Em produção, use: passwordEncoder.encode(password)
        user.setPassword(password);
        
        user.setRole("FUNCIONARIO");
        user.setIsAdmin(false);
        
        return userRepository.save(user);
    }
    
    public User findById(Long id) {
        return userRepository.findById(id).orElse(null);
    }
    
    public User findByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }
}