package com.empresa.controleponto.repository;

import com.empresa.controleponto.model.Funcionario;
import com.empresa.controleponto.model.RegistroPonto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RegistroPontoRepository extends JpaRepository<RegistroPonto, Long> {
    List<RegistroPonto> findByFuncionarioOrderByDataHoraDesc(Funcionario funcionario);
    
    List<RegistroPonto> findByFuncionarioAndDataHoraBetweenOrderByDataHoraAsc(
            Funcionario funcionario, LocalDateTime inicio, LocalDateTime fim);
    
    @Query("SELECT rp FROM RegistroPonto rp WHERE rp.funcionario = :funcionario " +
           "AND FUNCTION('DATE', rp.dataHora) = FUNCTION('DATE', :data) " +
           "ORDER BY rp.dataHora ASC")
    List<RegistroPonto> findByFuncionarioAndData(
            @Param("funcionario") Funcionario funcionario, @Param("data") LocalDateTime data);
    
    List<RegistroPonto> findByValidadoFalse();
}