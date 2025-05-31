package com.cuidaemprego.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.cuidaemprego.model.User;
import com.cuidaemprego.repository.UserRepository;

@Configuration
public class DatabaseSeeder {

    @Bean
    public CommandLineRunner initUsers(UserRepository userRepository) {  // ✅ Removido PasswordEncoder
        return args -> {
            System.out.println("🚀 Inicializando dados no MySQL...");
            System.out.println("📊 Verificando usuários existentes...");
            
            // Mostrar informações do banco
            long totalUsers = userRepository.count();
            System.out.println("📈 Total de usuários no banco MySQL: " + totalUsers);
            
            // CRIAR ADMIN COM SENHA SIMPLES (SEM CRIPTOGRAFIA)
            if (userRepository.findByEmail("admin@cuidaemprego.com").isEmpty()) {
                User admin = new User();
                admin.setEmail("admin@cuidaemprego.com");
                admin.setUsername("Admin Sistema");
                admin.setPassword("admin123"); // ✅ SENHA SIMPLES - SEM CRIPTOGRAFIA
                admin.setRole("ADMIN");
                
                userRepository.save(admin);
                
                System.out.println("✅ Usuário ADMIN criado no MySQL:");
                System.out.println("   📧 Email: admin@cuidaemprego.com");
                System.out.println("   🔑 Senha: admin123");
                System.out.println("   👤 Role: ADMIN");
            } else {
                System.out.println("ℹ️ Usuário ADMIN já existe no MySQL");
                User existingAdmin = userRepository.findByEmail("admin@cuidaemprego.com").get();
                System.out.println("🔍 Admin existente:");
                System.out.println("   📧 Email: " + existingAdmin.getEmail());
                System.out.println("   👤 Username: " + existingAdmin.getUsername());
                System.out.println("   🏷️ Role: " + existingAdmin.getRole());
                
                // ✅ VERIFICAÇÃO SIMPLES - SEM ENCODER
                boolean passwordMatches = "admin123".equals(existingAdmin.getPassword());
                System.out.println("   ✅ Senha 'admin123' confere: " + passwordMatches);
                
                // Se a senha não confere, recriar o admin
                if (!passwordMatches) {
                    System.out.println("❌ Senha do admin incorreta, recriando...");
                    userRepository.delete(existingAdmin);
                    
                    User newAdmin = new User();
                    newAdmin.setEmail("admin@cuidaemprego.com");
                    newAdmin.setUsername("Admin Sistema");
                    newAdmin.setPassword("admin123"); // ✅ SENHA SIMPLES
                    newAdmin.setRole("ADMIN");
                    
                    userRepository.save(newAdmin);
                    System.out.println("✅ Admin recriado com senha correta!");
                }
            }
            
            // Criar usuário FUNCIONÁRIO apenas se não existir
            if (userRepository.findByEmail("funcionario@cuidaemprego.com").isEmpty()) {
                User funcionario = new User();
                funcionario.setEmail("funcionario@cuidaemprego.com");
                funcionario.setUsername("João Silva");
                funcionario.setPassword("func123"); // ✅ SENHA SIMPLES
                funcionario.setRole("USER");
                
                userRepository.save(funcionario);
                
                System.out.println("✅ Usuário FUNCIONÁRIO criado no MySQL:");
                System.out.println("   📧 Email: funcionario@cuidaemprego.com");
                System.out.println("   🔑 Senha: func123");
                System.out.println("   👤 Role: USER");
            } else {
                System.out.println("ℹ️ Usuário FUNCIONÁRIO já existe no MySQL");
            }
            
            // Mostrar total atualizado de usuários no banco
            totalUsers = userRepository.count();
            System.out.println("📊 Total final de usuários no MySQL: " + totalUsers);
            
            if (totalUsers > 0) {
                System.out.println("🗄️ Usuários no banco MySQL:");
                userRepository.findAll().forEach(user -> {
                    System.out.println("   👤 " + user.getUsername() + " (" + user.getEmail() + ") - " + user.getRole());
                });
            }
            
            System.out.println("🎉 Inicialização MySQL concluída com sucesso!");
            System.out.println("═══════════════════════════════════════════");
            System.out.println("🔐 CREDENCIAIS GARANTIDAS:");
            System.out.println("   ADMIN: admin@cuidaemprego.com / admin123");
            System.out.println("   USER:  funcionario@cuidaemprego.com / func123");
            System.out.println("💾 Todos os dados estão salvos no MySQL!");
            System.out.println("═══════════════════════════════════════════");
        };
    }
}