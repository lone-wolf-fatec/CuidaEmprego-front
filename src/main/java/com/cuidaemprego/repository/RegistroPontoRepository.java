package com.cuidaemprego.repository;

import com.cuidaemprego.model.RegistroPonto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface RegistroPontoRepository extends JpaRepository<RegistroPonto, Long> {
    
    @Query("SELECT r FROM RegistroPonto r WHERE r.usuarioId = :usuarioId ORDER BY r.data DESC, r.hora DESC")
    List<RegistroPonto> findByUsuarioIdOrderByDataDescHoraDesc(@Param("usuarioId") Long usuarioId);
    
    @Query("SELECT r FROM RegistroPonto r WHERE r.data = :data AND r.usuarioId = :usuarioId ORDER BY r.hora ASC")
    List<RegistroPonto> findByDataAndUsuarioIdOrderByHora(@Param("data") LocalDate data, @Param("usuarioId") Long usuarioId);
    
    @Query("SELECT r FROM RegistroPonto r ORDER BY r.data DESC, r.hora DESC")
    List<RegistroPonto> findAllOrderByDataDescHoraDesc();
}
