package com.empresa.controleponto.repository;

import com.empresa.controleponto.model.Funcionario;
import com.empresa.controleponto.model.HoraExtra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface HoraExtraRepository extends JpaRepository<HoraExtra, Long> {
    List<HoraExtra> findByFuncionarioOrderByDataHoraInicioDesc(Funcionario funcionario);
    
    List<HoraExtra> findByStatus(HoraExtra.StatusHoraExtra status);
    
    @Query("SELECT he FROM HoraExtra he WHERE he.funcionario = :funcionario AND " +
           "he.dataHoraInicio >= :inicio AND he.dataHoraFim <= :fim")
    List<HoraExtra> findByFuncionarioAndPeriodo(
            @Param("funcionario") Funcionario funcionario,
            @Param("inicio") LocalDateTime inicio,
            @Param("fim") LocalDateTime fim);
    
    @Query("SELECT SUM(he.minutosTotais) FROM HoraExtra he WHERE he.funcionario = :funcionario " +
           "AND he.status = 'APROVADA' AND he.paraCompensacao = true")
    Integer calcularMinutosTotaisParaCompensacao(@Param("funcionario") Funcionario funcionario);
}