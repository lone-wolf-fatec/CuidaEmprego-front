package com.empresa.controleponto.repository;

import com.empresa.controleponto.model.Funcionario;
import com.empresa.controleponto.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FuncionarioRepository extends JpaRepository<Funcionario, Long> {
    Optional<Funcionario> findByUsuario(Usuario usuario);
    Optional<Funcionario> findByMatricula(String matricula);
    boolean existsByMatricula(String matricula);
}