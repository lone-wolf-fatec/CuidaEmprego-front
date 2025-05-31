package com.cuidaemprego.repository;

import com.cuidaemprego.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    
    @Query("SELECT u FROM Usuario u ORDER BY u.name ASC")
    List<Usuario> findAllOrderByName();
    
    @Query("SELECT u FROM Usuario u WHERE u.isAdmin = true")
    List<Usuario> findAdmins();
    
    @Query("SELECT u FROM Usuario u WHERE u.isAdmin = false")
    List<Usuario> findFuncionarios();
}