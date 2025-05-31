package com.cuidaemprego.repository;

import com.cuidaemprego.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(String role);

    List<User> findByUsernameContainingIgnoreCase(String username);

    // ⚠️ Remova este método em produção se estiver salvando senhas criptografadas
    @Deprecated
    Optional<User> findByEmailAndPassword(String email, String password);

    List<User> findByStatusTrue();

    // ✅ (Opcional) método para login seguro com role
    Optional<User> findByEmailAndRole(String email, String role);
}
