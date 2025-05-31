package com.cuidaemprego.repository;

import com.cuidaemprego.model.AjustePonto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AjustePontoRepository extends JpaRepository<AjustePonto, Long> {
    
    @Query("SELECT a FROM AjustePonto a WHERE a.usuarioId = :usuarioId ORDER BY a.dataSolicitacao DESC")
    List<AjustePonto> findByUsuarioIdOrderByDataSolicitacaoDesc(@Param("usuarioId") Long usuarioId);
    
    @Query("SELECT a FROM AjustePonto a ORDER BY a.dataSolicitacao DESC")
    List<AjustePonto> findAllOrderByDataSolicitacaoDesc();
}