package com.cuidaemprego.repository;

import com.cuidaemprego.model.Ausencias;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AusenciasRepository extends JpaRepository<Ausencias, Long> {
    
    @Query("SELECT a FROM Ausencias a WHERE a.usuarioId = :usuarioId ORDER BY a.data DESC")
    List<Ausencias> findByUsuarioIdOrderByDataDesc(@Param("usuarioId") Long usuarioId);
    
    @Query("SELECT a FROM Ausencias a ORDER BY a.dataSolicitacao DESC")
    List<Ausencias> findAllOrderByDataSolicitacaoDesc();
}