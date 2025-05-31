package com.cuidaemprego.repository;

import com.cuidaemprego.model.PontoBatido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PontoBatidoRepository extends JpaRepository<PontoBatido, Long> {
    
    // Buscar por funcionário e data específica
    Optional<PontoBatido> findByFuncionarioIdAndData(Long funcionarioId, LocalDate data);
    
    // Buscar por data ordenado por nome do funcionário
    List<PontoBatido> findByDataOrderByFuncionarioNome(LocalDate data);
    
    // Buscar histórico de um funcionário ordenado por data (mais recente primeiro)
    List<PontoBatido> findByFuncionarioIdOrderByDataDesc(Long funcionarioId);
    
    // Buscar todos ordenados por data (mais recente primeiro) e depois por nome
    @Query("SELECT p FROM PontoBatido p ORDER BY p.data DESC, p.funcionarioNome ASC")
    List<PontoBatido> findAllOrderByDataDescAndFuncionarioNomeAsc();
    
    // Buscar por funcionário
    List<PontoBatido> findByFuncionarioId(Long funcionarioId);
    
    // Buscar por data
    List<PontoBatido> findByData(LocalDate data);
    
    // Buscar por período (entre duas datas)
    List<PontoBatido> findByDataBetween(LocalDate dataInicio, LocalDate dataFim);
    
    // Buscar por funcionário e período
    List<PontoBatido> findByFuncionarioIdAndDataBetween(Long funcionarioId, LocalDate dataInicio, LocalDate dataFim);
    
    // Contar registros por funcionário
    Long countByFuncionarioId(Long funcionarioId);
    
    // Contar registros por data
    Long countByData(LocalDate data);
    
    // Buscar registros mais recentes (últimos 30 dias)
    @Query("SELECT p FROM PontoBatido p WHERE p.data >= :dataInicio ORDER BY p.data DESC, p.funcionarioNome ASC")
    List<PontoBatido> findRecentRecords(@Param("dataInicio") LocalDate dataInicio);
    
    // Buscar registros com pendências (horários nulos)
    @Query("SELECT p FROM PontoBatido p WHERE p.entradaManha IS NULL OR p.saidaAlmoco IS NULL OR p.entradaTarde IS NULL OR p.saidaFinal IS NULL")
    List<PontoBatido> findRegistrosComPendencias();
    
    // Buscar registros completos (todos os horários preenchidos)
    @Query("SELECT p FROM PontoBatido p WHERE p.entradaManha IS NOT NULL AND p.saidaAlmoco IS NOT NULL AND p.entradaTarde IS NOT NULL AND p.saidaFinal IS NOT NULL")
    List<PontoBatido> findRegistrosCompletos();
}