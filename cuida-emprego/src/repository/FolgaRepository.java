package com.empresa.controleponto.repository;

import com.empresa.controleponto.model.Folga;
import com.empresa.controleponto.model.Funcionario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface FolgaRepository extends JpaRepository<Folga, Long> {
    List<Folga> findByFuncionarioOrderByDataInicioDesc(Funcionario funcionario);
    
    List<Folga> findByStatus(Folga.StatusFolga status);
    
    @Query("SELECT f FROM Folga f WHERE f.funcionario = :funcionario AND " +
           "(:dataInicio BETWEEN f.dataInicio AND f.dataFim OR " +
           ":dataFim BETWEEN f.dataInicio AND f.dataFim OR " +
           "f.dataInicio BETWEEN :dataInicio AND :dataFim)")
    List<Folga> findFolgasConflitantes(
            @Param("funcionario") Funcionario funcionario,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim") LocalDate dataFim);
}