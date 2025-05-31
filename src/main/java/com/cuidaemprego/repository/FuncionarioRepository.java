package com.cuidaemprego.repository;

import com.cuidaemprego.model.Funcionario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FuncionarioRepository extends JpaRepository<Funcionario, Long> {

    // Correto: busca pelo nome do departamento
    List<Funcionario> findByDepartamento_Nome(String nome);

    // Correto: busca pelo id do usuário associado
    List<Funcionario> findByUsuario_Id(Long id);
}
