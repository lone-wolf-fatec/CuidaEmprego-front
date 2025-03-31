package com.empresa.controleponto.repository;

import com.empresa.controleponto.model.Ferias;
import com.empresa.controleponto.model.Funcionario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface FeriasRepository extends JpaRepository<Ferias, Long> {
    List<Ferias> findByFuncionarioOrderByDataInicioDesc(Funcionario funcionario);
    
    List<Ferias> findByStatusOrderByDataInicio(Ferias.StatusFerias status);
    
    @Query("SELECT f FROM Ferias f WHERE f.funcionario = :funcionario AND " +
           "(:dataInicio BETWEEN f.dataInicio AND f.dataFim OR " +
           ":dataFim BETWEEN f.dataInicio AND f.dataFim OR " +
           "f.dataInicio BETWEEN :dataInicio AND :dataFim)")
    List<Ferias> findFeriasConflitantes(
            @Param("funcionario") Funcionario funcionario,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim") LocalDate dataFim);
    
    @Query("SELECT f FROM Ferias f WHERE f.funcionario = :funcionario AND " +
           "f.periodoAquisitivo = :periodoAquisitivo")
    List<Ferias> findByFuncionarioAndPeriodoAquisitivo(
            @Param("funcionario") Funcionario funcionario,
            @Param("periodoAquisitivo") Integer periodoAquisitivo);
}